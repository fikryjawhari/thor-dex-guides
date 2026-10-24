"""Trainers (TR): trainer boxes, and the walkthrough's stops (D['_stops'], finished by walk.py).

Sets are the hack's own trainer data (trainers-rebalanced.json, tools/xy_trainers.py): species, form, level, ability,
item, IVs and moves (Gen 6 trainer data has no natures or EVs). The game data has no places, so they come from
Bulbapedia: its X and Y walkthrough lists the trainers in story order under place headings, with the vanilla team
(Trainerentry templates for regular trainers, Party templates for bosses). Each entry is matched to a vanilla trainer
(trainers-vanilla.json, the same tool on vanilla X) by class + name, then species and levels; the hack edits trainers in
place, so the hack's trainer with that id is the one you fight there. Trainers the walkthrough misses are placed from
the Trainerentry lists of the location pages (Battle Chateau, Battle Maison, Hotel Richissime...), the rest go in
dropped as unused. Placeholders (no name and a level 5 Rattata / Patrat...) are dropped.

Serena / Calem (the rival, by the player's character), Shauna, Tierno and Trevor are not matched by name: their ids are
fixed by tools/ex_rivals.py (rival-teams-rebalanced.md), and their places by RIVAL / FRIEND below.
Fields for the template's pickers: t.st = the player's starter (as PS: "Chespin"), t.pl = the player's character ("m" =
the boy, Calem: you fight Serena; "f" = the girl, Serena: you fight Calem).
"""
import json, os, re
from collections import defaultdict
from common import BULBA, load, norm, report, fix, split_name
from wikitext import split_args
from ctrguide import default_moves, trainer_match_score

PART = os.path.join(BULBA, 'Walkthrough-Pokémon X and Y-Part {}.wiki')
NPARTS = 17
# Boxes: (walkthrough parts, name)
CHAPTERS = [((1, 2), 'Vaniville Town to Santalune Gym'), ((3, 4, 5), 'Lumiose City to Cyllage Gym'),
            ((6,), 'Route 10 to Shalour Gym'), ((7,), 'Route 12 to Coumarine Gym'), ((8,), 'Lumiose Gym'),
            ((9,), 'Route 14 to Laverre Gym'), ((10,), 'Dendemille Town to Anistar Gym'),
            ((11,), 'Lysandre Labs and Team Flare Secret HQ'), ((12, 13), 'Route 18 to Snowbelle Gym'),
            ((14,), 'Victory Road'), ((15,), 'Pokémon League'), ((16, 17), 'Post-game')]
STARTERS = ('Chespin', 'Fennekin', 'Froakie')
TY = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric',
      'Psychic', 'Ice', 'Dragon', 'Dark']
RIVNAMES = {'shauna', 'tierno', 'trevor'}
# Serena / Calem fights, in the order of the walkthrough's parts: (part, battle label in ex_rivals.py, partner?).
# ex_rivals.py holds the ids: RIVAL below copies them (the tool's RIVAL / FRIENDS tables).
RIVAL = {  # label -> (Calem ids, Serena ids) by starter (Chespin, Fennekin, Froakie)
    'Route 7': ((435, 436, 437), (596, 597, 598)), 'Glittering Cave': ((130, 131, 132), (575, 576, 577)),
    'Tower of Mastery': ((329, 330, 331), (581, 582, 583)), 'Coumarine City': ((184, 185, 186), (578, 579, 580)),
    'Route 14': ((332, 333, 334), (584, 585, 586)), 'Poké Ball Factory': ((604, 605, 606), (607, 608, 609)),
    'Anistar City': ((335, 336, 337), (587, 588, 589)), 'Team Flare Secret HQ': ((338, 339, 340), (590, 591, 592)),
    'Victory Road': ((341, 342, 343), (593, 594, 595)), 'Kiloude City': ((519, 520, 521), (599, 600, 601))}
# the rival groups of each walkthrough part, in order ('~' = a partner on your side, prize = none)
RIVAL_BY_PART = {6: ['Tower of Mastery'], 7: ['Coumarine City'], 9: ['Route 14', '~Poké Ball Factory'],
                 10: ['Anistar City'], 11: ['~Team Flare Secret HQ'], 14: ['Victory Road'], 16: ['Kiloude City']}
# Partners the prose names only: the walkthrough entry that carries them -> rival label
PARTNER_AT = {'Route 7': ('Trevor', 4), 'Glittering Cave': (None, 5)}
# Shauna / Tierno / Trevor: (name, part) -> ids (by starter for Shauna)
FRIEND = {('Shauna', 1): (137, 138, 139), ('Tierno', 3): (573,), ('Tierno', 4): (438,), ('Trevor', 4): (439,),
          ('Shauna', 12): (321, 322, 323), ('Tierno', 12): (324,), ('Trevor', 12): (325,)}
VIOLA_NERF = 6
POST = (17, 'post-game')  # where location-page trainers with post-game levels go
LOCSTOP = {'teamflaresecrethq': (11, 'Geosenge Town')}  # location page -> walkthrough stop
HOTEL = ((280, 298), (440, 458))  # Owner / Waitress / Garcon / Furisode Girl / Chef: Hotel Richissime (post-game)
MAISON = 614  # nameless trainers from this id up: the Battle Maison's pool




def clean(s):
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'\{\{sup/\d\|[^}]*\}\}', '', s)
    s = re.sub(r'\{\{rt\|(\d+)\|[^}]*\}\}', r'Route \1', s)
    for _ in range(3):
        s = re.sub(r'\{\{[^{}|]+\|(?:[^{}|]*\|)*([^{}|]*)\}\}', r'\1', s)
        s = re.sub(r'\{\{([^{}|]*)\}\}', '', s)
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    return re.sub(r'<[^>]+>', ' ', s).replace('¦', '|').strip()


def place_name(h):
    return clean(h).strip()


def starter_of(text):
    m = re.search(r'(?:chose|PlayerChoice\|\d+\|)\s*\{?\{?(?:p\|)?(Chespin|Fennekin|Froakie)', text)
    return m.group(1) if m else ''


def entry_events(raw, part, place):
    """A Trainerentry: |game=6|image|class|name|prize|count|(dex|species|gender|level|item) x count."""
    p = [x for x in split_args(raw) if not re.match(r'^\w+=', x)]
    # location pages put the image first or after game=6; the image is the part with ".png"
    img = [i for i, x in enumerate(p) if '.png' in x]
    if img:
        p = p[img[0]:]
    if len(p) < 5:
        return []
    cnt = int(re.sub(r'\D', '', clean(p[4])) or 0)
    mons = []
    for i in range(cnt):
        if 8 + 5 * i >= len(p):
            break
        mons.append((fix(clean(p[6 + 5 * i])), int(re.sub(r'\D', '', p[8 + 5 * i]) or 0)))
    cls, name = fix(clean(p[1])), fix(clean(p[2]))
    return [dict(part=part, place=place, key=norm(cls + name), name=norm(name), cls=norm(cls), mons=mons, st='',
                 with_=('(with' in p[3]), boss=0)]


def party_events(b, part, place, two=False):
    """A {{Party}} (one trainer) or {{Party/2}} (two at once: the first `pokemon` blocks are the first trainer's)."""
    head = b.split('{{Pokémon', 1)[0]
    g = lambda k: (re.search(r'\|\s*' + k + r'\s*=\s*(.*)', head) or [None, ''])[1].strip()
    mons = []
    for blk in b.split('{{Pokémon')[1:]:
        sp = re.search(r'\|\s*pokemon\s*=\s*([^\n|]+)', blk)
        lv = re.search(r'\|\s*level\s*=\s*(?:\{\{tt\|)?(\d+)', blk)
        if sp:
            mons.append((fix(clean(sp.group(1))), int(lv.group(1)) if lv else 0))
    partner = 1 if re.match(r'none\b', g('prize')) else 0
    ev = lambda c, nm, ms: dict(part=part, place=place, key=norm(clean(c) + clean(nm)), name=norm(clean(nm)),
                                cls=norm(clean(c)), nm=clean(nm), mons=ms, st=starter_of(g('caption')), boss=1,
                                partner=partner, with_=False)
    if not two:
        return [ev(g('class'), g('name'), mons)]
    k = int(re.sub(r'\D', '', g('pokemon')) or 0)
    return [dict(ev(g('class'), g('name'), mons[:k]), fmt='Multi'), dict(ev(g('class2'), g('name2'), mons[k:]), fmt='Multi')]


# Sub-places that are a section of their own inside a place (h3/h4 headings of the walkthrough); anything else
# belongs to its == place ==.
SUBS = {'Santalune Gym', 'Cyllage Gym', 'Shalour Gym', 'Coumarine Gym', 'Lumiose Gym', 'Laverre Gym', 'Anistar Gym',
        'Snowbelle Gym', 'Tower of Mastery', 'Poké Ball Factory', 'Lost Hotel', 'Lysandre Labs', 'Lysandre Café',
        'Team Flare Secret HQ', 'Battle Chateau', 'Kalos Power Plant', 'Terminus Cave', 'Looker Bureau',
        'Great Hall'}


def events():
    """Every trainer battle of the walkthrough in order: dicts with part, place (== heading ==), sub (named
    sub-place), pos (offset in the part), bt (battle id: trainers fought together share it)."""
    out, bt = [], 0
    for n in range(1, NPARTS + 1):
        s = open(PART.format(n), encoding='utf-8').read().replace('{{!}}', '¦')
        h = ['', '', '', '', '']
        cond = ''
        pat = (r'^(={2,5})\s*(.*?)\s*\1\s*$|\{\{[Tt]rainerentry\|(.*?)\}\}\s*$|\{\{[Pp]arty(/2)?\n(.*?)\{\{Party/end\}\}'
               r'|\{\{[Tt]rainer(div|header|footer)\|([^\n]*)$')
        prev_with = False
        for m in re.finditer(pat, s, re.M | re.S):
            if m.group(1):
                lv = len(m.group(1))
                h[lv - 2] = place_name(m.group(2))
                for i in range(lv - 1, 5):
                    h[i] = ''
                prev_with = False
                continue
            if m.group(6):
                prev_with = False
                continue
            sub = next((x for x in h[1:] if x in SUBS), '')
            if not sub and h[0] == 'Coumarine City' and h[1] == 'Upper':
                sub = ''
            ctx = dict(sub=sub, pos=(n, m.start()), hs=tuple(h))
            if m.group(3):
                es = entry_events(m.group(3), n, h[0])
                for e in es:
                    e.update(ctx)
                    if e['with_'] and prev_with:  # the second of a pair fought with another trainer
                        e['bt'] = bt
                        prev_with = False
                    else:
                        bt += 1
                        e['bt'] = bt
                        prev_with = e['with_']
                out += es
            else:
                prev_with = False
                bt += 1
                es = party_events(m.group(5), n, h[0], two=bool(m.group(4)))
                for e in es:
                    e.update(ctx)
                    e['bt'] = bt
                out += es
    return out


def location_entries():
    """(page title, event) from the Trainerentry lists of the location pages (X and Y sections only)."""
    out = []
    for f in sorted(os.listdir(BULBA)):
        if f.startswith('Walkthrough'):
            continue
        s = open(os.path.join(BULBA, f), encoding='utf-8').read().replace('{{!}}', '¦')
        title = f[:-5]
        title = re.sub(r'^Kalos Route (\d+)$', r'Route \1', re.sub(r' \(Kalos\)$', '', title))
        # drop the other games' sections (Legends: Z-A, ORAS...)
        s = re.split(r'\n===?\s*Pok[ée]mon Legends: Z-A\s*===?', s)[0]
        for m in re.finditer(r'\{\{[Tt]rainerentry\|(.*?)\}\}\s*$', s, re.M | re.S):
            for e in entry_events(m.group(1), 99, title):
                e['pos'] = (99, m.start())
                out.append(e)
    return out




def prep(T):
    """Fix the game text's encoding and drop the empty team slots (Egg)."""
    for t in T:
        t['class'], t['name'] = fix(t['class']), fix(t['name'])
        t['team'] = [dict(m, species=fix(m['species'])) for m in t['team'] if m['speciesId']]
    return T



# Level caps, story order: (section head contains, trainer name contains, kind). 'trial' (the template's word for the
# main set) = the Gym Leaders, then the Elite Four's highest level (not the Champion); 'mini' = rivals, friends,
# Sycamore and Team Flare's bosses in between. Each matches the first such trainer after the previous cap.
CAPS = [('Santalune Gym', 'Leader Viola', 'trial'),
        ('Route 7', 'Trevor', 'mini'), ('Cyllage Gym', 'Leader Grant', 'trial'),
        ('Tower of Mastery', 'Serena', 'mini'), ('Shalour Gym', 'Leader Korrina', 'trial'),
        ('Coumarine City', 'Serena', 'mini'), ('Coumarine Gym', 'Leader Ramos', 'trial'),
        ('Kalos Power Plant', 'Aliana', 'mini'), ('Lumiose Gym', 'Leader Clemont', 'trial'),
        ('Route 14', 'Serena', 'mini'), ('Laverre Gym', 'Leader Valerie', 'trial'),
        ('Poké Ball Factory', 'Celosia', 'mini'), ('Frost Cavern', 'Mable', 'mini'), ('Anistar City', 'Serena', 'mini'),
        ('Anistar Gym', 'Leader Olympia', 'trial'), ('Lysandre Labs', 'Xerosic', 'mini'),
        ('Team Flare Secret HQ', 'Boss Lysandre', 'mini'),
        ('Route 19', 'Shauna', 'mini'), ('Snowbelle Gym', 'Leader Wulfric', 'trial'),
        ('Pokémon League', 'Elite Four', 'trial')]


def level_caps(g):
    """One cap list and one [level, who, where, battles left] per story section.

    Count one starter/player version per battle, excluding Chateau and Viola nerf cards.
    The previously redundant Route 5 and Victory Road caps stay out of CAPS.
    """
    story = [s for x in g if x['n'] != 'Post-game' for s in x['sec']]
    flat, start = [], []  # flat: [bt, [trainers], counted]
    for s in story:
        start.append(len(flat))
        for t in s['tr']:
            b = t.get('bt') or t['k']
            if flat and flat[-1][0] == b:
                flat[-1][1].append(t)
                continue
            skip = 'Battle Chateau' in s['h'] or 'Viola nerf patch' in t['tags'] or                 t.get('st', '') not in ('', STARTERS[0]) or t.get('pl', '') not in ('', 'm')
            flat.append([b, [t], not skip])
    sec_of = {id(t): i for i, s in enumerate(story) for t in s['tr']}
    caps, pos = [], 0
    for head, who, kind in CAPS:
        i = next((i for i in range(pos, len(flat)) if flat[i][2] and any(who in t['n'] for t in flat[i][1])
                  and head in story[sec_of[id(flat[i][1][0])]]['h']), None)
        if i is None:
            report('level cap not found:', head, who)
            continue
        ts = flat[i][1]
        if who == 'Elite Four':  # the four are one cap: the highest of them, cut before the first
            ts = [t for f in flat[i:] for t in f[1] if 'Elite Four' in t['n']]
        elif head == 'Route 19':
            ts = story[sec_of[id(ts[0])]]['tr']
        lv = max(m['l'] for t in ts for m in t['p'])
        short = lambda n: re.sub(r'^(Leader|Pokémon Trainer|Pokémon Professor|Team Flare( Boss)?) ', '', n)
        name = 'Elite Four' if who == 'Elite Four' else ' & '.join(dict.fromkeys(short(t['n']) for t in ts))
        name = name.replace('Serena', 'Serena / Calem')  # your rival: Calem if you play the girl
        if head == 'Route 19':
            name = 'Shauna, Tierno & Trevor'
        caps.append({'n': name, 'w': story[sec_of[id(ts[0])]]['h'].split(': ')[-1], 'l': lv, 'k': kind,
                     'cut': i, 'sec': sec_of[id(ts[0])]})
        pos = i + 1
    for si, (s, i0) in enumerate(zip(story, start)):
        cap = next((cap for cap in caps if cap['cut'] >= i0), caps[-1])
        s['cap'] = [cap['l'], cap['n'], cap['w'], sum(entry[2] for entry in flat[i0:cap['cut']])]
    report('level caps:', ' · '.join(f"{cap['n']} {cap['l']}" for cap in caps))
    return [[f"{cap['n']} ({cap['w']})", cap['l']] for cap in caps], caps


def build(D):
    V, Hk = prep(load('trainers-vanilla.json')), prep(load('trainers-rebalanced.json'))
    assert all(t['id'] == i for i, t in enumerate(Hk)) and all(t['id'] == i for i, t in enumerate(V))
    nerf = prep(load('trainers-rebalanced-viola-nerf.json'))[VIOLA_NERF]
    dexj = load('dex-rebalanced.json')
    spec, MI, ABI, byid = D['_spec'], D['_MI'], D['_ABI'], D['_byid']
    hpi = D['M'].index('Hidden Power')
    megas = {}
    for s in dexj['species']:
        for m in s.get('mega', []):
            if m.get('item'):
                megas[(s['id'], m['item'])] = spec[(s['id'], m['form'])]
    rival_ids = {i for a, b in RIVAL.values() for i in a + b} | {i for v in FRIEND.values() for i in v}
    # Placeholders: no team, a nameless level <= 10 Rattata / Patrat team, or a level 5 Rattata team
    dummy = lambda t: not t['team'] or t['name'] in ('--',) or all(m['species'] == 'Rattata' and m['level'] == 5
                                                                    for m in t['team']) or         (not t['name'] and all(m['species'] in ('Rattata', 'Patrat') and m['level'] <= 10 for m in t['team']))
    byk, byn = defaultdict(list), defaultdict(list)
    for t in V:
        if not dummy(t) and t['id'] not in rival_ids:
            byk[norm(t['class'] + t['name'])].append(t)
            byn[norm(t['name'])].append(t)
    used = set(rival_ids)

    def match(e):
        c = [t for t in byk.get(e['key'], []) if t['id'] not in used]
        if c:
            best = max(c, key=lambda t: trainer_match_score(e, t))
            if trainer_match_score(e, best) > 0:
                return best
        c = [t for t in byn.get(e.get('name', ''), []) if t['id'] not in used and e.get('name')]
        if c:
            best = max(c, key=lambda t: trainer_match_score(e, t))
            if trainer_match_score(e, best) >= 2:
                return best
        return None

    # --- the walkthrough's battles in order -> placed [(event, trainer id, extra fields)]
    evs = events()
    placed, partners, miss = [], [], 0   # partners: (battles joined, label, [(pl, st, id)])
    is_riv = lambda e: e['name'] in ('calem', 'serena') and e['cls'] == 'pokemontrainer'
    pairs = lambda lab: [(pl, stn, ids[k]) for k, stn in enumerate(STARTERS)
                         for pl, ids in (('f', RIVAL[lab][0]), ('m', RIVAL[lab][1]))]
    runs_in_part = defaultdict(int)
    i = 0
    while i < len(evs):
        e = evs[i]
        if is_riv(e):
            j = i
            while j < len(evs) and is_riv(evs[j]) and evs[j]['part'] == e['part']:
                j += 1
            run = evs[i:j]
            lab = RIVAL_BY_PART[e['part']][runs_in_part[e['part']]]
            runs_in_part[e['part']] += 1
            ptn = lab.startswith('~')
            lab = lab.lstrip('~')
            if [x['name'] for x in run] != ['calem', 'serena'] * 3:
                report('  rival run is not 3 x (Calem, Serena):', e['part'], lab, [x['name'] for x in run])
            ents = pairs(lab)
            if ptn:
                partners.append((dict(part=e['part'], bt=e['bt'], after=True), lab, ents))
            else:
                for x, (pl, stn, tid) in zip(run, ents):
                    placed.append((x, tid, dict(pl=pl, st=stn)))
            i = j
            continue
        if e['name'] in RIVNAMES and e['cls'] == 'pokemontrainer':   # Shauna, Tierno, Trevor
            ids = FRIEND.get((e['name'].capitalize(), e['part']))
            if not ids:
                report('  friend entry without ids:', e['part'], e['place'], e['name'])
            else:
                if e['name'] == 'shauna':
                    ids = (ids[STARTERS.index(e['st'])],) if e['st'] in STARTERS else ids
                placed.append((e, ids[0], dict(st=e['st'] if e['name'] == 'shauna' else '')))
            i += 1
            continue
        t = match(e)
        if t:
            used.add(t['id'])
            placed.append((e, t['id'], {}))
        elif e['mons']:
            miss += 1
            report('  walkthrough trainer not matched:', e['part'], e['place'], e['key'], e['mons'][:3])
        i += 1
    # Partners the walkthrough names only in prose: Route 7 (with Trevor and Tierno), Glittering Cave (the last pair)
    ev_of = lambda part, test: [e['bt'] for e in evs if e['part'] == part and test(e)]
    for lab, bts in (('Route 7', ev_of(4, lambda e: e['name'] == 'trevor')),
                     ('Glittering Cave', ev_of(5, lambda e: e['place'] == 'Glittering Cave' and e.get('with_')))):
        partners.append((dict(bts=set(bts)), lab, pairs(lab)))
        if not bts:
            report('  partner battle not found:', lab)
    # The '~' runs (Poke Ball Factory, Team Flare Secret HQ) join the pairs after them, before the part's next run
    for pa, lab, ents in partners:
        if pa.get('after'):
            part, bt0 = pa['part'], pa['bt']
            end = min([r['bt'] for r in evs if r['part'] == part and is_riv(r) and r['bt'] > bt0 + 5], default=10 ** 9)
            cnt = defaultdict(int)
            for r in evs:
                if r['part'] == part and bt0 < r['bt'] < end and not is_riv(r):
                    cnt[r['bt']] += 1
            pa['bts'] = {b for b, n in cnt.items() if n >= 2}
        report('  partner', lab, 'joins battles', sorted(pa['bts']))
    tid_used = {tid for _, tid, _ in placed} | {tid for _, _, ents in partners for _, _, tid in ents}

    # --- second pass: location pages (exact teams first)
    extra, ents_ = [], location_entries()
    exact = lambda e, t: trainer_match_score(e, t) == 3 * len(e['mons']) == 3 * len(t['team'])
    for strict in (True, False):
        for e in ents_:
            if e.get('done'):
                continue
            t = match(e)
            if t and not dummy(Hk[t['id']]) and (not strict or exact(e, t)):
                used.add(t['id'])
                extra.append((e, t['id']))
                e['done'] = 1
    extra.sort(key=lambda x: next(i for i, e in enumerate(ents_) if e is x[0]))
    real = [t for t in Hk if not dummy(t)]
    drop = [t for t in Hk if dummy(t)]
    report('trainers: walkthrough', len(placed), '(rival and friend fights included); partner teams',
           sum(len(x[2]) for x in partners), '; location pages', len(extra), '; of', len(real), 'real trainers;',
           len(drop), 'placeholders dropped')

    def mon(m):
        sid_, form = m['speciesId'], m['form']
        pid = spec.get((sid_, form))
        if pid is None:
            report('  no form', m['species'], form, '- using the base form')
            pid = spec[(sid_, 0)]
        base = byid[pid]
        a0 = None
        ab = None if ' or ' in m['ability'] else ABI.get(m['ability'])
        if ab is None and ' or ' not in m['ability']:
            report('  unknown ability', m['ability'], m['species'])
        if m.get('item') and (sid_, m['item']) in megas:
            pid = megas[(sid_, m['item'])]
            a0 = ab
        p = byid[pid]
        mv = [MI[x] for x in m.get('moves', []) if x in MI] or default_moves(base, m['level'])
        x = {'id': pid, 'l': m['level'], 'i': m.get('item') or '', 'm': mv, 'iv': [m['ivs']] * 6}
        if a0 is not None:
            x['a0'], x['a'] = a0, p['a'][0]
        elif ab is None:
            x['a'], x['ao'] = -1, m['ability'].replace(' or ', ' / ')
        else:
            x['a'] = ab
        if hpi in mv:   # every IV equal: the type from the IVs' low bits
            x['hp'] = TY[(sum((m['ivs'] & 1) << b for b in range(6)) * 15) // 63]
        return x

    pname = lambda t: f"{t['class']} {t['name']}".strip()

    def trainer(e, t, k, ex):
        tags, note = [], []
        b = t['battle']
        if b == 'Double':
            tags.append('Multi Battle' if ex.get('pt') else 'Double Battle')
        elif b in ('Triple', 'Rotation'):
            tags.append(b + ' Battle')
        if ex.get('tag'):
            tags.append(ex['tag'])
        if ex.get('note'):
            note.append(ex['note'])
        if t['items']:
            note.append('Uses ' + ', '.join(t['items']))
        x = {'k': k, 'n': pname(t), 'id': t['id'], 'loc': e['place'], 'tags': tags, 'st': ex.get('st', ''), 'cap': 0,
             'note': note, 'p': [mon(m) for m in t['team']]}
        if ex.get('pl'):
            x['pl'] = ex['pl']
        if ex.get('bt'):
            x['bt'] = ex['bt']
        if ex.get('pt'):
            x['pt'] = ex['pt']
        return x

    # partners -> the battles they join (t.pt [{n, st, pl, p}])
    ptfor = defaultdict(list)
    for pa, lab, ents in partners:
        for pl, stn, tid in ents:
            for b in pa['bts']:
                t = Hk[tid]
                ptfor[b].append({'n': pname(t), 'st': stn, 'pl': pl, 'p': [mon(m) for m in t['team']]})
    items = []   # (event, trainer, extra)
    nbt = max(e['bt'] for e in evs) + 1000
    for e, tid, ex in placed:
        t = Hk[tid]
        ex = dict(ex, bt=e['bt'], pt=ptfor.get(e['bt']))
        items.append((e, t, ex))
        if tid == VIOLA_NERF:   # the nerf patch: a second card for the same battle
            items.append((e, dict(nerf, battle=t['battle']), dict(ex, bt=nbt, tag='Viola nerf patch',
                          note='Viola nerf patch (Rebalanced version): only Viola changes.')))
            nbt += 1
    allstops = []
    for n in range(1, NPARTS + 1):
        s = open(PART.format(n), encoding='utf-8').read()
        for m in re.finditer(r'^==([^=].*?)==\s*$', s, re.M):
            pl = place_name(m.group(1).strip())
            if not allstops or allstops[-1][:2] != [n, pl]:
                allstops.append([n, pl, []])
    order = {(st[0], st[1]): i for i, st in enumerate(allstops)}
    chap = lambda part: next(i for i, (ps, _) in enumerate(CHAPTERS) if part in ps)
    seq = []   # [part, place, sub, [(e, t, ex)]]
    for e, t, ex in items:
        if seq and seq[-1][:3] == [e['part'], e['place'], e['sub']]:
            seq[-1][3].append((e, t, ex))
        else:
            seq.append([e['part'], e['place'], e['sub'], [(e, t, ex)]])
    # location-page trainers join the first stop with their place's name; post-game levels go to the post-game box
    story_lv = defaultdict(list)
    for e, t, _ in items:
        story_lv[chap(e['part'])].append(max([m['level'] for m in V[t['id']]['team']] or [0]))
    med = {c: sorted(v)[len(v) // 2] for c, v in story_lv.items()}
    loc_extra = defaultdict(list)
    for e, tid in extra:
        loc_extra[norm(e['place'])].append((e, tid))
    pre = lambda a, b: a.startswith(b) and not (a[len(b):len(b) + 1].isdigit() and b[-1:].isdigit())
    left = [t for t in real if t['id'] not in used and t['id'] not in tid_used]
    for key, its in loc_extra.items():
        hit = LOCSTOP.get(key)
        hit = next((st for st in allstops if st[:2] == list(hit)), None) if hit else \
            next((st for st in allstops if norm(st[1]) == key), None) or \
            next((st for st in allstops if pre(norm(st[1]), key) or pre(key, norm(st[1]))), None)
        if not hit:
            report('  location page with no walkthrough stop, trainers go to Other:', key, len(its))
            left += [Hk[tid] for _, tid in its]
            continue
        for e, tid in its:
            top = max([m['level'] for m in V[tid]['team']] or [0])
            if hit[0] < 16 and top >= med.get(chap(hit[0]), 100) + 15:
                e.update(part=POST[0], place=hit[1], sub=POST[1])
            else:
                e.update(part=hit[0], place=hit[1], sub='')
            q = next((q for q in seq if q[:3] == [e['part'], e['place'], e['sub']]), None)
            if q is None:
                q = [e['part'], e['place'], e['sub'], []]
                seq.append(q)
            q[3].append((e, Hk[tid], {}))
    # Trainers no page lists. Nameless ones from id MAISON up are the Battle Maison's pool; the rest go next to the
    # placed trainer with the closest lower id, when the one with the closest higher id is in the same place (the
    # game numbers trainers by place), else they stay in "Other trainers".
    anchors = {}
    for q in seq:
        for e, t, ex in q[3]:
            if t['id'] not in rival_ids and 'tag' not in ex:
                anchors.setdefault(t['id'], q)
    aid = sorted(anchors)
    maison, hotel, guessed, rest = [], [], 0, []
    after = defaultdict(list)   # anchor id -> trainers placed after it
    for t in sorted(left, key=lambda t: t['id']):
        if not t['name'] and t['id'] >= MAISON:
            maison.append(t)
            continue
        if t['class'] == 'Battle Chatelaine':   # the Battle Chateau's top rank
            q = next((q for q in seq if q[:3] == [4, 'Route 7 (west)', 'Battle Chateau']), None)
            if q:
                q[3].append(({'place': q[1]}, t, {}))
                continue
        if any(a <= t['id'] <= b for a, b in HOTEL):
            hotel.append(t)
            continue
        lo = max([a for a in aid if a < t['id']], default=None)
        hi = min([a for a in aid if a > t['id']], default=None)
        if lo is not None and hi is not None and anchors[lo][:2] == anchors[hi][:2]:
            after[lo].append(t)
            guessed += 1
        else:
            rest.append(t)
    for q in seq:
        out = []
        for e, t, ex in q[3]:
            out.append((e, t, ex))
            for u in after.get(t['id'], []) if anchors.get(t['id']) is q and 'tag' not in ex else []:
                out.append((dict(e, bt=0), u, {}))
        q[3][:] = out
    if hotel:
        seq.append([16, 'Lumiose City', 'Hotel Richissime', [({'place': 'Lumiose City'}, t, {}) for t in hotel]])
    if maison:
        seq.append([POST[0], 'Battle Maison', '', [({'place': 'Battle Maison'}, t, {}) for t in maison]])
    report('trainers no page lists: next to their id neighbours', guessed, '; Hotel Richissime', len(hotel), '; Battle Maison pool', len(maison),
           '; left', len(rest))
    left = rest
    seq.sort(key=lambda q: (order.get((q[0], q[1]), 10 ** 6), q[2] == POST[1]))

    g = [{'n': name, 'cap': 0, 'tab': name, 'note': [], 'sec': []} for _, name in CHAPTERS]
    keys = {}
    for part, place, sub, its in seq:
        gi = chap(part)
        h = f'{place}: {sub}' if sub else place
        if g[gi]['sec'] and g[gi]['sec'][-1]['h'] == h:
            sec = g[gi]['sec'][-1]
        else:
            sec = {'h': h, 'note': [], 'tr': []}
            g[gi]['sec'].append(sec)
        for e, t, ex in its:
            k = f"{gi}.{len(g[gi]['sec']) - 1}.{len(sec['tr'])}"
            sec['tr'].append(trainer(e, t, k, ex))
            keys.setdefault((part, place), []).append(k)
    # No Bulbapedia page (walkthrough or location) names these: vanilla X's unused trainer data (the Drivers, a
    # Gardener named "●"...). Left out (2026-10-22, the user: no "Other trainers" box).
    report('trainers dropped as unused (no page lists them):', len(left))
    for t in left:
        report('  unused trainer:', t['id'], t['class'], t['name'], [(m['species'], m['level']) for m in t['team']][:4])
    # Boxes are gym splits (the user, 2026-10-22, as Hardlove Gold): the story's sections in order, cut after each Gym's
    # section (a Leader in a "... Gym" section) and after the Champion's; what follows the Champion joins the post-game.
    story = [sc for x in g[:-1] for sc in x['sec']]
    boxes, cur = [], []
    for sc in story:
        cur.append(sc)
        if any(t['n'].startswith('Leader ') for t in sc['tr']) and ' Gym' in sc['h'] or                 any(t['n'].startswith('Champion ') for t in sc['tr']):
            boxes.append(cur)
            cur = []
    g = [{'n': '', 'cap': 0, 'tab': '', 'note': [], 'sec': b} for b in boxes] +         [dict(g[-1], sec=cur + g[-1]['sec'])]
    # Drop empty boxes and renumber the keys to match
    g = [x for x in g if any(s['tr'] or s['note'] for s in x['sec'])]
    remap = {}
    for gi, x in enumerate(g):
        for si, s in enumerate(x['sec']):
            for ti, t in enumerate(s['tr']):
                remap[t['k']] = f'{gi}.{si}.{ti}'
                t['k'] = remap[t['k']]
    for st in allstops:
        st[2] = [remap[k] for k in keys.get((st[0], st[1]), [])]
    tc, caps = level_caps(g)
    D['_legacy_splits'] = [next(trainer['k'] for section in reversed(group['sec'])
                               for trainer in reversed(section['tr'])
                               if trainer['n'].startswith(('Leader ', 'Champion '))) for group in g[:-1]]
    story, post = [section for group in g[:-1] for section in group['sec']], g[-1]
    groups, first = [], 0
    for index, cap in enumerate(caps):
        last = len(story) - 1 if index == len(caps) - 1 else cap['sec']
        name = split_name(cap['n'], cap['l'])
        sections = story[first:last + 1]
        assert sections, name
        groups.append({'n': name, 'cap': cap['l'], 'tab': name, 'note': [], 'sec': sections})
        first = last + 1
    g = groups + [post]
    D['_splits'] = [(group['n'], group['sec'][-1]['tr'][-1]['k']) for group in groups]
    D['TR'] = {'caps': tc, 'fix': [], 'src': 'game data + Bulbapedia places', 'g': g}
    D['_stops'] = allstops
    trs = [t for x in g for s in x['sec'] for t in s['tr']]
    report('trainer boxes:', ', '.join(f"{x['n']} {sum(len(s['tr']) for s in x['sec'])}" for x in g))
    report('COUNTS trainers shown', len(trs), 'sections', sum(len(x['sec']) for x in g),
           'battles', len({t.get('bt') or t['k'] for t in trs}), 'placeholders dropped', len(drop),
           'unmatched walkthrough entries', miss, 'left over', len(left))

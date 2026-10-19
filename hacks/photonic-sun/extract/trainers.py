"""Stage 3: trainers (TR) and the walkthrough's stops (D['_stops'], finished by walk.py).

Sets are the hack's own trainer data (trainers-rebalanced.json, tools/usum_trainers.py): species, form, level,
nature, ability, item, IVs, EVs and moves. The game data has no places, so they come from Bulbapedia: its Ultra
Sun / Ultra Moon walkthrough lists every trainer in story order under place headings, with the vanilla team
(Trainerentry templates for regular trainers, Party templates for bosses). Each entry is matched to a vanilla trainer
(trainers-vanilla.json, the same tool on vanilla Ultra Sun) by class + name, then species and levels; the hack edits
trainers in place, so the hack's trainer with that id is the one you fight there. Trainers the walkthrough misses
are placed from the Ultra Sun / Ultra Moon trainer lists on Bulbapedia's location pages, the rest go in "Other
trainers". Entries left in the game as placeholders (no name, or one level 5 Yungoos) are dropped.
Rival and other starter-dependent teams: Bulbapedia's "If the player chose X" (PlayerChoice) becomes t.st.
"""
import json, os, re
from collections import defaultdict
from common import BULBA, load, norm, report, fix

PART = os.path.join(BULBA, 'Walkthrough-Pokémon Ultra Sun and Ultra Moon-Part {}.wiki')
# Boxes: (walkthrough parts, name). Aether Paradise's second visit (Part 21) is its own box; the first (Part 14, no
# trainers, the Nihilego fight) is a section at the end of Akala, where it falls in the story.
CHAPTERS = [(range(1, 7), 'Melemele Island'), (range(7, 15), 'Akala Island'), (range(15, 21), "Ula'ula Island"),
            ((21,), 'Aether Paradise'), (range(22, 27), 'Poni Island'), ((27, 28), 'The Pokémon League'),
            ((29, 30), 'Post-game: Guardians and Poni Grove'), ((31,), 'Post-game: Episode RR'),
            (range(32, 36), 'Post-game: Ultra Space, Battle Tree and Title Defense')]
# Photonic Sun is built on Ultra Sun; the game data also holds Prismatic Moon's (Ultra Moon's) side of version splits.
# vanilla id -> note (Bulbapedia marks these {{sup/7|UM}} in prose, not on the trainer entries)
MOON = {75: 'In Photonic Sun you fight Dexio instead.', 648: 'In Photonic Sun you fight Dulse instead.',
        651: 'In Photonic Sun you fight Dulse instead.', 498: 'In Photonic Sun you fight Dulse instead.',
        499: 'In Photonic Sun you fight Dulse instead.', 503: 'In Photonic Sun you fight Mallow for the petals instead.',
        508: 'In Photonic Sun Nanu just gives you the Purple Petal.', 543: 'In Photonic Sun Cyrus has Dialga.',
        573: 'In Photonic Sun Lysandre has Xerneas.', 560: 'In Photonic Sun Ghetsis has Zekrom.',
        645: 'In Photonic Sun Giovanni has Mega Mewtwo X.'}
SUN_ONLY = {506: 'In Prismatic Moon Sophocles just gives you the Yellow Petal.'}
# {{Party/2}} lists only the first trainer's team; the second one by vanilla id (the prose names an Employee)
PAIR2 = {241: 442, 561: 544}
# Partners the walkthrough names only in prose (opponent vanilla id -> partner vanilla id)
PARTNER = {561: 582}  # Episode RR: Lillie fights at your side against Faba and his Employee
ALIAS = {'youngstertaro': 'youngstertristan'}  # Bulbapedia's name -> the game's
# Trainers neither the walkthrough nor a location page places: vanilla id -> (part, place, sub, note)
PLACE = {**{i: (15, 'Malie City', 'Kantonian Gym', 'Kantonian Gym, optional. The Gym is rechallenged after the League.')
            for i in (547, 548, 549, 550, 555)},
         630: (15, 'Malie City', 'Kantonian Gym', 'Kantonian Gym, optional, before the League. He fights again there '
                                                  'after the League and in the Title Defense.'),
         146: (34, 'Malie City', '', 'Kantonian Gym, after the League (Important Trainers doc: her second battle). '
                                     'Bulbapedia doesn\'t list it.')}
# Post-game captain battles the Important Trainers doc puts at the Kantonian Gym, where Bulbapedia (the vanilla game)
# has them elsewhere (vanilla id -> note)
DOCNOTE = {396: 'The Important Trainers doc lists this as his Kantonian Gym battle.',
           398: 'The Important Trainers doc lists this as his Kantonian Gym battle.',
           144: 'The Important Trainers doc lists this as her Kantonian Gym battle.'}
LOCSTOP = {'maliegarden': (17, 'Malie City'), 'battlebuffet': (5, "Hau'oli City")}  # location page -> walkthrough stop
LOCNOTE = {'battlebuffet': 'Battle Buffet in the Shopping Mall, once a day for a fee.'}
POST = (34, 'post-game')  # where location-page trainers with post-game levels go (part, sub heading)
# Level caps, story order: (part, stop, who, level or trainer vanilla id, kind). 'trial' = the next trial or grand trial
# (the usual rule); 'mini' = a forced boss in between. Totem levels are the Totem Battles doc's (not in trainer data).
CAPS = [(2, "Hau'oli City", 'Captain Ilima', 52, 'trial'), (3, 'Verdant Cavern', 'Totem Gumshoos', -16, 'trial'),
        (4, 'Seaward Cave', 'Ultra Recon Squad Dulse', 649, 'mini'), (4, 'Route 3', 'Hau', 12, 'mini'),
        (5, 'Iki Town', 'Kahuna Hala', 23, 'trial'),
        (7, 'Heahea City', 'Dexio', 74, 'mini'), (7, 'Paniola Town', 'Hau', 76, 'mini'),
        (8, 'Route 5 (South)', 'Trial Guide Bronson', 395, 'mini'), (8, 'Brooklet Hill', 'Totem Araquanid', -28, 'trial'),
        (8, 'Paniola Ranch', 'Ultra Recon Squad Dulse', 652, 'mini'), (9, 'Royal Avenue', 'Battle Royal', 81, 'mini'),
        (9, 'Wela Volcano Park', 'Totem Marowak', -37, 'trial'), (10, 'Lush Jungle', 'Totem Lurantis', -44, 'trial'),
        (12, 'Akala Outskirts', 'Plumeria', 89, 'mini'), (12, 'Ruins of Life', 'Kahuna Olivia', 90, 'trial'),
        (14, 'Aether Paradise', 'Nihilego', -58, 'mini'), (16, 'Mount Hokulani', 'Totem Togedemaru', -59, 'trial'),
        (17, 'Malie City', 'Guzma', 'Guzma', 'mini'), (18, 'Route 14', 'Totem Mimikyu', -66, 'trial'),
        (19, 'Route 15', 'Plumeria', 'Plumeria', 'mini'), (20, 'Po Town', 'Guzma', 'Guzma', 'mini'),
        (20, 'Route 15', 'Gladion', 'Gladion', 'mini'), (20, 'Malie City', 'Kahuna Nanu', 154, 'trial'),
        (21, 'Aether Paradise', 'Lusamine', 131, 'mini'), (24, 'Vast Poni Canyon', 'Ultra Recon Squad Dulse', 501, 'mini'),
        (24, 'Vast Poni Canyon', 'Totem Kommo-o', -92, 'trial'), (25, 'Megalo Tower', 'Ultra Necrozma', -100, 'mini'),
        (26, "Mina's trial", 'Totem Ribombee', -95, 'trial'), (26, 'Exeggutor Island (Revisited)', 'Kahuna Hapu', 497, 'trial'),
        (27, 'Mount Lanakila', 'Gladion', 'Gladion', 'mini'), (28, 'The Pokémon League', 'Elite Four and Champion', -100, 'trial')]
STARTERS = ('Rowlet', 'Litten', 'Popplio')
TY = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric',
      'Psychic', 'Ice', 'Dragon', 'Dark']


def split_top(s):
    out, cur, d = [], '', 0
    i = 0
    while i < len(s):
        two = s[i:i + 2]
        if two in ('{{', '[['):
            d += 1; cur += two; i += 2; continue
        if two in ('}}', ']]'):
            d -= 1; cur += two; i += 2; continue
        if s[i] == '|' and d == 0:
            out.append(cur); cur = ''
        else:
            cur += s[i]
        i += 1
    return out + [cur]


def clean(s):
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    s = re.sub(r'\{\{sup/\d\|[^}]*\}\}', '', s)
    s = re.sub(r'\{\{MSP/\d\|[^}]*\}\}', '', s)
    s = re.sub(r'\{\{rt\|(\d+)\|[^}]*\}\}', r'Route \1', s)
    for _ in range(3):
        s = re.sub(r'\{\{[^{}|]+\|(?:[^{}|]*\|)*([^{}|]*)\}\}', r'\1', s)
        s = re.sub(r'\{\{([^{}|]*)\}\}', '', s)
    s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    return re.sub(r'<[^>]+>', ' ', s).replace('¦', '|').strip()


def place_name(h):
    h = re.sub(r'\{\{sup/7\|UM\}\}.*$', '', re.sub(r'\s*/\s*[^/]*\{\{sup/7\|UM\}\}', '', h))
    return clean(h).strip()


def starter_of(text):
    m = re.search(r'(?:chose|PlayerChoice\|\d+\|)\s*\{?\{?(?:p\|)?(Rowlet|Litten|Popplio)', text)
    return m.group(1) if m else ''


SUB = {14, 21, 31}  # parts whose sections are their === sub-places === (Aether Paradise's floors, Team Rocket's Castle)


def events():
    """Every trainer battle of the walkthrough in order: dicts with part, place (== heading ==), sub (=== heading ===
    in SUB parts), cond (the trainerdiv caption above it), bt (battle id: trainers fought at once share it), fmt
    (Double / Multi / Battle Royal) and partner (1: a team on your side, prize = none, not a fight)."""
    out, bt = [], 0
    for n in range(1, 36):
        s = open(PART.format(n), encoding='utf-8').read().replace('{{!}}', '¦')
        h2 = h3 = h4 = cond = ''
        blk = 0
        pat = (r'^(={2,5})\s*(.*?)\s*\1\s*$|\{\{[Tt]rainerentry\|(.*?)\}\}\s*$|\{\{[Pp]arty(/2)?\n(.*?)\{\{Party/end\}\}'
               r'|\{\{[Tt]rainer(div|header|footer)\|([^\n]*)$')  # Part 1 has one {{party
        for m in re.finditer(pat, s, re.M | re.S):
            if m.group(1):
                lv, h = len(m.group(1)), place_name(m.group(2))
                if lv == 2:
                    h2, h3, h4 = h, '', ''
                elif lv == 3:
                    h3, h4 = h, ''
                elif lv == 4 and not h.startswith('VS '):  # "VS Faba" is a boss in the room above, not a room
                    h4 = h
                if lv < 4:
                    blk += 1
                cond = ''
                continue
            sub = (h3 + (' · ' + h4 if h4 else '')) if n in SUB else ''
            if m.group(6):
                c = split_top(m.group(7)[:-2] if m.group(7).endswith('}}') else m.group(7))
                cond = clean(c[1]) if m.group(6) == 'div' and len(c) > 1 else ''
            elif m.group(3):
                es = entry_events(m.group(3), n, h2)
                link = re.search(r'with the (following|previous)', m.group(3))
                if not (link and link.group(1) == 'previous' and out):
                    bt += 1
                for e in es:
                    e.update(sub=sub, blk=(n, blk), cond=cond, bt=bt)
                    if link or not e['key']:  # "Double Battle with the following Grunt", or a pair (Twins Isa and Nico)
                        e['fmt'] = 'Double'
                    if link and link.group(1) == 'previous' and out:
                        out[-1]['fmt'] = 'Double'
                out += es
            else:
                bt += 1
                for e in party_events(m.group(5), n, h2, two=bool(m.group(4))):
                    e.update(sub=sub, blk=(n, blk), cond=cond, bt=bt)
                    if h3 == 'Battle Royal Dome':  # four-way: the "prize = none" parties are opponents here, one battle
                        e['fmt'], e['partner'] = 'Battle Royal', 0
                        if out and out[-1].get('fmt') == 'Battle Royal' and out[-1]['blk'] == e['blk']:
                            e['bt'] = out[-1]['bt']
                    out.append(e)
    return out


def entry_events(raw, part, place):
    p = [x for x in split_top(raw) if not re.match(r'^\w+=', x)]
    if len(p) < 5:
        return []
    st = starter_of(p[3])
    cnt = int(re.sub(r'\D', '', clean(p[4])) or 0)
    mons = []
    for i in range(cnt):
        if 8 + 5 * i >= len(p):
            break
        owner = re.search(r"<!--\s*(.*?)'s\s*-->", p[6 + 5 * i])
        mons.append((clean(p[6 + 5 * i]), int(re.sub(r'\D', '', p[8 + 5 * i]) or 0), owner.group(1) if owner else ''))
    name = clean(p[2])
    if ' and ' in name:  # a pair (Twins Isa and Nico): matched as two trainers by name and species
        return [dict(part=part, place=place, key='', names=[norm(x) for x in name.split(' and ')],
                     mons=[(s, l) for s, l, _ in mons], st=st)]
    return [dict(part=part, place=place, key=norm(clean(p[1]) + name), name=norm(name), mons=[(s, l) for s, l, _ in mons], st=st)]


def party_events(b, part, place, two=False):
    """A {{Party}} (one trainer) or {{Party/2}} (two at once: the first `pokemon` blocks are the first trainer's).
    Levels may be {{tt|42|First two Multi Battles}}/{{tt|43|Against Faba}}: the first one is used."""
    head = b.split('{{Pokémon', 1)[0]
    g = lambda k: (re.search(r'\|\s*' + k + r'\s*=\s*(.*)', head) or [None, ''])[1].strip()
    mons = []
    for blk in b.split('{{Pokémon')[1:]:
        sp = re.search(r'\|\s*pokemon\s*=\s*([^\n|]+)', blk)
        lv = re.search(r'\|\s*level\s*=\s*(?:\{\{tt\|)?(\d+)', blk)
        if sp:
            mons.append((clean(sp.group(1)), int(lv.group(1)) if lv else 0))
    partner = 1 if re.match(r'none\b', g('prize')) else 0
    ev = lambda c, nm, ms: dict(part=part, place=place, key=norm(clean(c) + clean(nm)), name=norm(clean(nm)), mons=ms,
                                st=starter_of(g('caption')), boss=1, partner=partner)
    if not two:
        if ' and ' in clean(g('name')):  # Harper and Sarah
            return [dict(ev(g('class'), g('name'), mons), key='', names=[norm(x) for x in clean(g('name')).split(' and ')], fmt='Double')]
        return [ev(g('class'), g('name'), mons)]
    k = int(re.sub(r'\D', '', g('pokemon')) or 0)
    c2, n2 = g('class2'), g('name2')
    if c2 == 'Aether Foundation':  # name2 = {{tccolor|Aether Foundation Employee|000|Employee}}: the game's class, no name
        c2, n2 = 'Aether Foundation Employee', ''
    return [dict(ev(g('class'), g('name'), mons[:k]), fmt='Double'), dict(ev(c2, n2, mons[k:]), fmt='Double')]


def location_entries():
    """(page title, event) from the Ultra Sun / Ultra Moon trainer lists of the location pages."""
    out = []
    for f in os.listdir(BULBA):
        if f.startswith('Walkthrough'):
            continue
        s = open(os.path.join(BULBA, f), encoding='utf-8').read().replace('{{!}}', '¦')
        title = s.split('\n', 1)[0][5:].split(' | ')[0]
        title = re.sub(r'^Alola Route (\d+)$', r'Route \1', re.sub(r' \(Alola\)$', '', title))
        tr = re.search(r'\n==\s*Trainers\s*==(.*?)(?=\n==[^=]|$)', s, re.S)
        if not tr:
            continue
        body = tr.group(1)
        u = re.search(r'\n===\s*Pokémon Ultra Sun and Ultra Moon\s*===(.*?)(?=\n===[^=]|$)', body, re.S)
        if u:
            body = u.group(1)
        elif '===' in body and 'Sun and Moon' in body:
            continue
        for m in re.finditer(r'\{\{[Tt]rainerentry\|(.*?)\}\}\s*$', body, re.M | re.S):
            for e in entry_events(m.group(1), 99, title):
                out.append(e)
    return out


def score(e, t):
    vs = [(m['species'], m['level']) for m in t['team']]
    sc = 0
    for x in e['mons']:
        if x in vs:
            sc += 3
        elif x[0] in [v[0] for v in vs]:
            sc += 1
    return sc - abs(len(vs) - len(e['mons']))


def dummy(t):
    return t['name'] in ('', '●●●', '-') or (len(t['team']) == 1 and t['team'][0]['species'] == 'Yungoos'
                                                   and t['team'][0]['level'] == 5 and not t['team'][0]['moves'])


def build(D):
    V, Hk = load('trainers-vanilla.json'), load('trainers-rebalanced.json')
    dexj = load('dex-rebalanced.json')
    spec, MI, ABI, byid = D['_spec'], D['_MI'], D['_ABI'], D['_byid']
    sid = {s['name']: s['id'] for s in dexj['species'] if not s['form']}
    megas = {}
    for s in dexj['species']:
        for m in s.get('mega', []):
            if m.get('item'):  # Rayquaza needs Dragon Ascent, not a stone
                megas[(s['id'], m['item'])] = spec[(s['id'], m['form'])]
    byk, byn = defaultdict(list), defaultdict(list)
    for t in V:
        if not dummy(t):
            byk[norm(t['class'] + t['name'])].append(t)
            byn[norm(t['name'])].append(t)
    used, placed, miss = set(), [], 0

    def match(e):
        """[vanilla trainer] for an event: by class + name, else by name alone with a clear species match; a pair
        gives up to two trainers, whichever of its names share its Pokemon."""
        if not e['key']:
            c = [t for n in e['names'] for t in byn.get(n, []) if t['id'] not in used]
            hits = sorted((t for t in c if score(dict(mons=e['mons']), t) + abs(len(t['team']) - len(e['mons'])) > 0),
                          key=lambda t: -score(e, t))
            out, seen = [], set()
            for t in hits:
                if norm(t['name']) not in seen:
                    seen.add(norm(t['name']))
                    out.append(t)
            return out
        c = [t for t in byk.get(e['key'], []) if t['id'] not in used]
        if c:
            best = max(c, key=lambda t: score(e, t))
            if score(e, best) > 0:
                return [best]
        c = [t for t in byn.get(e.get('name', ''), []) if t['id'] not in used]
        if c:
            best = max(c, key=lambda t: score(e, t))
            if score(e, best) >= 2:
                return [best]
        return []
    evs = events()
    for e in evs:
        e['key'] = ALIAS.get(e['key'], e['key'])
    # A story entry that the post-game parts list again (Kagetora "after defeating the other Eevee users", Aristo
    # "after defeating all of Alola's skilled Trainers") is placed at the post-game one.
    late = {(e['key'], tuple(e['mons'])) for e in evs if e['part'] >= 29 and e['key']}
    partners = []  # (event, vanilla id): teams on your side, attached to their battles below
    for i, e in enumerate(evs):
        if e['part'] < 29 and e['cond'].startswith('After defeating') and (e['key'], tuple(e['mons'])) in late:
            continue
        if not e['mons'] and i and evs[i - 1]['bt'] == e['bt'] and evs[i - 1].get('tid') in PAIR2:
            ts = [V[PAIR2[evs[i - 1]['tid']]]]
        else:
            ts = match(e)
        for t in ts:
            used.add(t['id'])
            e['tid'] = t['id']
            (partners if e.get('partner') else placed).append((e, t['id']))
        if not ts and e['mons']:
            miss += 1
            report('  walkthrough trainer not matched:', e['part'], e['place'], e['key'] or e['names'], e['mons'][:3])
    # Second pass: location pages, exact teams first (Route 17's Ekans 36 grunt would take Ancient Poni Path's Ekans 45)
    extra, ents = [], location_entries()
    exact = lambda e, t: score(e, t) == 3 * len(e['mons']) == 3 * len(t['team'])
    for strict in (True, False):
        for e in ents:
            if e.get('done'):
                continue
            for t in match(e):
                if not dummy(Hk[t['id']]) and (not strict or exact(e, t)):
                    used.add(t['id'])
                    extra.append((e, t['id']))
                    e['done'] = 1
    extra.sort(key=lambda x: next(i for i, e in enumerate(ents) if e is x[0]))  # back in page order
    real = [t for t in Hk if not dummy(t)]
    left = [t for t in real if t['id'] not in used]
    report('trainers: walkthrough', len(placed), 'partners', len(partners), 'location pages', len(extra), 'of', len(real),
           'real trainers (', len(Hk) - len(real), 'placeholders dropped )')

    def mon(m):
        s0 = (m['speciesId'], m['form'])
        pid = spec.get(s0) or spec.get((m['speciesId'], 0))
        base = byid[pid]
        a0 = None
        if m['item'] and (m['speciesId'], m['item']) in megas:
            mp = megas[(m['speciesId'], m['item'])]
            a0 = ability_idx(m, base)
            pid = mp
        p = byid[pid]
        mv = [MI[x] for x in m['moves'] if x in MI] or default_moves(base, m['level'])
        iv = [m['ivs'][k] for k in ('hp', 'atk', 'def', 'spa', 'spd', 'spe')]
        ev = [m['evs'][k] for k in ('hp', 'atk', 'def', 'spa', 'spd', 'spe')]
        x = {'id': pid, 'l': m['level'], 'na': m['nature'], 'i': m['item'] or '', 'm': mv, 'iv': iv, 'ev': ev}
        ab = ability_idx(m, base)
        if a0 is not None:
            x['a0'], x['a'] = a0, p['a'][0]
        elif ab is None:
            x['a'], x['ao'] = -1, m['ability'].replace(' or ', ' / ')
        else:
            x['a'] = ab
        if D['M'].index('Hidden Power') in mv:
            x['hp'] = TY[(sum(((iv[i] & 1) << b) for b, i in enumerate((0, 1, 2, 5, 3, 4))) * 15) // 63]
        return x

    def ability_idx(m, base):
        a = m['ability']
        return ABI.get(a) if ' or ' not in a else None

    def default_moves(p, lv):
        ms = []
        for l, mv in p['lv']:
            if l <= lv and mv not in ms:
                ms.append(mv)
        return ms[-4:]

    def trainer(e, tid, k):
        t = Hk[tid]
        n = f"{t['class']} {t['name']}".strip()
        tags, note = [], []
        if e.get('fmt') == 'Battle Royal':
            tags.append('Battle Royal')
        elif e.get('fmt') == 'Double':
            tags.append('Multi Battle' if e.get('pt') else 'Double Battle')
        if tid in MOON:
            tags.append('Prismatic Moon')
            note.append('Prismatic Moon only. ' + MOON[tid])
        if tid in SUN_ONLY:
            note.append(SUN_ONLY[tid])
        if tid in DOCNOTE:
            note.append(DOCNOTE[tid])
        if e.get('cond') and not e['cond'].startswith(e['place']):
            note.append(e['cond'] + ('' if e['cond'].endswith('.') else '.'))
        if e.get('note'):
            note.append(e['note'])
        if t['items']:
            note.append('Uses ' + ', '.join(t['items']))
        x = {'k': k, 'n': n, 'id': tid, 'loc': e['place'], 'tags': tags, 'st': e.get('st', ''), 'cap': 0,
             'note': note, 'p': [mon(m) for m in t['team']]}
        if e.get('bt'):
            x['bt'] = e['bt']
        if e.get('pt'):
            x['pt'] = e['pt']
        return x

    # Partners: a team on your side joins the double battles after it in the same sub-place, or (none after: Diglett's
    # Tunnel lists Hau after the grunts) the ones before it; teams by starter stay apart (t.pt [{n, st, p}]).
    def pteam(pe, tid):
        t = Hk[tid]
        return {'n': f"{t['class']} {t['name']}".strip(), 'st': pe.get('st', ''), 'p': [mon(m) for m in t['team']]}
    for pe, ptid in partners:
        blk = [e for e, _ in placed if e.get('blk') == pe['blk'] and e.get('fmt') == 'Double']
        after = [e for e in blk if e['bt'] > pe['bt']]
        nxt = min((q['bt'] for q, _ in partners if q.get('blk') == pe['blk'] and q['bt'] > pe['bt']
                   and not (q['key'] == pe['key'] and q['st'] != pe['st'])), default=10 ** 9)
        for e in [e for e in after if e['bt'] < nxt] or blk:
            e.setdefault('pt', []).append(pteam(pe, ptid))
    for e, tid in placed:
        if tid in PARTNER:
            for q, _ in placed:
                if q['bt'] == e['bt']:
                    q['pt'] = [pteam({}, PARTNER[tid])]
            used.add(PARTNER[tid])
    left = [t for t in left if t['id'] not in used]
    # Partner copies the game keeps under other ids (Hau at Aether Paradise: the same species three times over, one
    # Raichu a level apart)
    pts = {(p['n'], tuple(x['id'] for x in p['p'])) for e, _ in placed for p in e.get('pt', [])}
    copies = [t for t in left if (f"{t['class']} {t['name']}", tuple(mon(m)['id'] for m in t['team'])) in pts]
    if copies:
        report('  partner teams kept once (copies dropped):', [(t['id'], t['class'], t['name']) for t in copies])
    left = [t for t in left if t not in copies]

    # Boxes (chapters) -> sections (part + place + sub-place runs) -> trainers; walkthrough stops keep the same order
    g = [{'n': name, 'cap': 0, 'tab': name, 'note': [], 'sec': []} for _, name in CHAPTERS]
    chap = lambda part: next(i for i, (ps, _) in enumerate(CHAPTERS) if part in ps)
    g[chap(21)]['note'] = ['The second visit, after Nanu. The first (the Nihilego fight) is at the end of Akala Island; '
                           'the third is Episode RR, after the League.']
    # Every stop of the walkthrough, trainers or not, in order (walk.py adds areas and items)
    allstops = []
    for n in range(1, 36):
        s = open(PART.format(n), encoding='utf-8').read()
        for m in re.finditer(r'^==([^=].*?)==\s*$', s, re.M):
            pl = place_name(m.group(1).strip())
            if not allstops or allstops[-1][:2] != [n, pl]:
                allstops.append([n, pl, []])
    order = {(st[0], st[1]): i for i, st in enumerate(allstops)}
    seq = []  # [part, place, sub, [(e, tid)]]
    for e, tid in placed:
        if seq and seq[-1][:3] == [e['part'], e['place'], e['sub']]:
            seq[-1][3].append((e, tid))
        else:
            seq.append([e['part'], e['place'], e['sub'], [(e, tid)]])
    # Location-page trainers join the first stop with their place's name; post-game levels go to the post-game box
    story_lv = defaultdict(list)
    for e, tid in placed:
        if e['part'] < 29:
            story_lv[chap(e['part'])].append(max([m['level'] for m in V[tid]['team']] or [0]))
    med = {c: sorted(v)[len(v) // 2] for c, v in story_lv.items()}
    loc_extra = defaultdict(list)
    for e, tid in extra:
        loc_extra[norm(e['place'])].append((e, tid))
    pre = lambda a, b: a.startswith(b) and not (a[len(b):len(b) + 1].isdigit() and b[-1:].isdigit())
    for key, items in loc_extra.items():
        if key in LOCSTOP:
            hit = next(st for st in allstops if st[:2] == list(LOCSTOP[key]))
        else:  # the same name, else one name starting the other but not mid-number ("route1" is not "route17")
            hit = next((st for st in allstops if norm(st[1]) == key), None) or \
                next((st for st in allstops if pre(norm(st[1]), key) or pre(key, norm(st[1]))), None)
        if not hit:
            report('  location page with no walkthrough stop, trainers go to Other:', key)
            left += [Hk[tid] for _, tid in items]
            continue
        for e, tid in items:
            e['note'] = LOCNOTE.get(key, '')
            top = max([m['level'] for m in V[tid]['team']] or [0])
            c = chap(hit[0])
            if hit[0] < 29 and top >= med.get(c, 100) + 15:
                e.update(part=POST[0], place=hit[1], sub=POST[1])
            else:
                e.update(part=hit[0], place=hit[1], sub='')
            q = next((q for q in seq if q[:3] == [e['part'], e['place'], e['sub']]), None)
            if q is None:
                q = [e['part'], e['place'], e['sub'], []]
                seq.append(q)
            q[3].append((e, tid))
    for t in list(left):
        if t['id'] in PLACE:
            part, place, sub, note = PLACE[t['id']]
            e = dict(part=part, place=place, sub=sub, st='', note=note)
            q = next((q for q in seq if q[:3] == [part, place, sub]), None)
            if q is None:
                q = [part, place, sub, []]
                seq.append(q)
            q[3].append((e, t['id']))
            left.remove(t)
    # Aether Paradise's first visit has no trainers but a forced fight (and a cap): a section of its own
    seq.append([14, 'Aether Paradise', '', []])
    # Places the walkthrough marks optional: the navigation boxes list a part's places, "..., Route 7, Trial 3: Wela
    # Volcano Park, Optional: Melemele Sea, Seaward Cave, ...". Each optional place belongs to the part that has it as a
    # stop next to the list's other places (Seaward Cave is a story stop in Part 4, optional in Part 9).
    opt = set()
    for n in range(1, 36):
        for m in re.finditer(r"(?:name=|'')([^|\n]*?)(?:''')?Optional:(?:''')?\s*([^|\n']+)", open(PART.format(n), encoding='utf-8').read()):
            names = lambda s: [re.sub(r'^Trial \d+: ', '', place_name(x)).strip() for x in s.split(',') if x.strip()]
            before, after = names(m.group(1)), names(m.group(2))
            parts = {st[0] for st in allstops if st[1] in after} if not before else \
                {st[0] for st in allstops if st[1] == before[0]} & {st[0] for st in allstops if st[1] in after}
            opt |= {(p, x) for p in parts for x in after}
    # Post-game rematch sections sit at the end of their stop
    sk = lambda q: (order.get((q[0], q[1]), 10 ** 6), q[2] == POST[1], q[2] == 'Kantonian Gym')
    seq.sort(key=sk)
    keys, secs = {}, []
    for part, place, sub, items in seq:
        gi = chap(part)
        h = sub if part in (21,) else (f'{place}: {sub}' if sub else place)
        if part == 14:
            h = 'Aether Paradise (first visit)'
        if g[gi]['sec'] and g[gi]['sec'][-1]['h'] == h:  # the same place again right after (end of one part, start of the next)
            sec = g[gi]['sec'][-1]
        else:
            sec = {'h': h, 'note': [], 'tr': [], 'at': order.get((part, place), 10 ** 6)}
            if part == 14:
                sec['note'] = ['No trainer battles. An Ultra Beast (Nihilego, level 58 in the Totem Battles doc) drops '
                               'in and you fight it with no way to catch it.']
            if (part, place) in opt or sub == 'Kantonian Gym':
                sec['opt'] = 1
            g[gi]['sec'].append(sec)
        for e, tid in items:
            k = f"{gi}.{len(g[gi]['sec']) - 1}.{len(sec['tr'])}"
            sec['tr'].append(trainer(e, tid, k))
            keys.setdefault((part, place), []).append(k)
    for t in left:
        report('  trainer with no place:', t['id'], t['class'], t['name'], [(m['species'], m['level']) for m in V[t['id']]['team']][:4])
    if left:
        g.append({'n': 'Other trainers', 'cap': 0, 'tab': 'Other', 'note': [
            'In the game data but not in Bulbapedia\'s Ultra Sun / Ultra Moon walkthrough or trainer lists (places unknown).'], 'sec': []})
        sec = {'h': '', 'note': [], 'tr': []}
        g[-1]['sec'].append(sec)
        for t in left:
            k = f"{len(g) - 1}.0.{len(sec['tr'])}"
            sec['tr'].append(trainer({'place': '', 'st': ''}, t['id'], k))
    for st in allstops:
        st[2] = keys.get((st[0], st[1]), [])

    # Level caps. Each section gets, for the trial rule and with mini caps, [level, who, where, battles left, forced
    # battles left]: the next cap at or after it and the battles from the section's start up to that fight (not
    # counting it). Battles, not
    # trainers: a pair is one; one starter's version of a rival fight; no optional places (the walkthrough's
    # "Optional:" lists, the Kantonian Gym), Battle Buffet or Prismatic Moon teams. The sources don't say which route
    # trainers can be walked around, so those all count. A mini cap is left out when it doesn't raise the cap, when it's
    # at or above the next trial (Ultra Necrozma, 100, comes before Mina, 95: going to 100 breaks the next caps), or
    # when it sits right before the next trial with no trainers between.
    lvl = lambda tid: max(m['level'] for m in Hk[tid]['team'])
    post = min(i for i, st in enumerate(allstops) if st[0] >= 29)
    story = [s for x in g for s in x['sec'] if s.get('at', 10 ** 6) < post]
    # Forced: the walkthrough writes scripted story fights as {{Party}} blocks; route trainers ({{Trainerentry}}) may
    # or may not be avoidable, and nothing in the sources says which.
    forced = {tid for e, tid in placed if e.get('boss')}
    flat, start = [], []  # flat: (section at, bt, vanilla ids, counted, forced); start[i]: story[i]'s first flat index
    for s in story:
        start.append(len(flat))
        for t in s['tr']:
            b = t.get('bt') or t['k']
            if flat and flat[-1][1] == b:
                flat[-1][2].append(t['id'])
                continue
            skip = s.get('opt') or 'Prismatic Moon' in t['tags'] or t['st'] not in ('', STARTERS[0]) or \
                any(re.search(r'optional|Battle Buffet', z) for z in t['note'])
            flat.append((s['at'], b, [t['id']], not skip, not skip and t['id'] in forced))
    caps = []
    for part, stop, who, x, kind in CAPS:
        at = order[(part, stop)]
        if isinstance(x, (str, int)) and not (isinstance(x, int) and x < 0):  # a trainer: the cut is their battle
            ids = [tid for e, tid in placed if (e['part'], e['place']) == (part, stop) and
                   (x in Hk[tid]['name'] if isinstance(x, str) else tid == x)]
            lv = max(lvl(i) for i in ids)
            cut = next(i for i, f in enumerate(flat) if f[0] == at and set(f[2]) & set(ids))
        else:  # a totem or Nihilego: after the stop's trainers
            lv = -x
            cut = next((i for i, f in enumerate(flat) if f[0] > at), len(flat))
        caps.append({'n': who, 'w': stop, 'l': lv, 'k': kind, 'at': at, 'cut': cut})
    for i, c in enumerate(caps):
        if c['k'] == 'mini':
            nt = next(d for d in caps if d['k'] == 'trial' and d['at'] >= c['at'])
            prev = max([d['l'] for d in caps[:i] if not d.get('drop')] or [0])
            between = [s for s in story if c['at'] < s['at'] < nt['at'] and s['tr']]
            c['drop'] = int(c['l'] <= prev or c['l'] >= nt['l'] or not between)
    for s, i0 in zip(story, start):
        def nxt(ks):
            c = next((c for c in caps if c['k'] in ks and not c.get('drop') and c['cut'] >= i0 and c['at'] >= s['at']), None)
            return [c['l'], c['n'], c['w'], sum(f[3] for f in flat[i0:c['cut']]), sum(f[4] for f in flat[i0:c['cut']])] if c else None
        if nxt(('trial',)):
            s['cap'] = [nxt(('trial',)), nxt(('trial', 'mini'))]
    for x in g:
        for s in x['sec']:
            s.pop('at', None)

    # Drop empty boxes and renumber the keys to match
    g = [x for x in g if any(s['tr'] or s['note'] for s in x['sec'])]
    remap = {}
    for gi, x in enumerate(g):
        for si, s in enumerate(x['sec']):
            for ti, t in enumerate(s['tr']):
                remap[t['k']] = f'{gi}.{si}.{ti}'
                t['k'] = remap[t['k']]
    for st in allstops:
        st[2] = [remap[k] for k in st[2]]
    D['TR'] = {'caps': [[f"{c['n']} ({c['w']})", c['l']] for c in caps if c['k'] == 'trial'],
               'mini': [[c['n'], c['w'], c['l'], c['k'], c.get('drop', 0)] for c in caps],
               'fix': [], 'src': 'game data + Bulbapedia places', 'g': g}
    D['_stops'] = allstops
    report('trainer boxes:', ', '.join(f"{x['n']} {sum(len(s['tr']) for s in x['sec'])}" for x in g))
    report('level caps:', ' · '.join(f"{c['n']} {c['l']}{'' if c['k'] == 'trial' else ' (mini' + (', dropped' if c.get('drop') else '') + ')'}" for c in caps))

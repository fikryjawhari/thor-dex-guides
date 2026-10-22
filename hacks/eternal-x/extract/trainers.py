"""Stage 3: trainers (TR) and the walkthrough's stops (D['_stops'], finished by walk.py).

Sets are the hack's own trainer data (trainers-rebalanced.json, tools/xy_trainers.py): species, form, level, ability,
item, IVs and moves (Gen 6 trainer data has no natures or EVs). The game data has no places, so they come from
Bulbapedia: its X and Y walkthrough lists the trainers in story order under place headings, with the vanilla team
(Trainerentry templates for regular trainers, Party templates for bosses). Each entry is matched to a vanilla trainer
(trainers-vanilla.json, the same tool on vanilla X) by class + name, then species and levels; the hack edits trainers in
place, so the hack's trainer with that id is the one you fight there. Trainers the walkthrough misses are placed from
the Trainerentry lists of the location pages (Battle Chateau, Battle Maison, Hotel Richissime...), the rest go in
"Other trainers". Placeholders (no name and a level 5 Rattata / Patrat...) are dropped.

Serena / Calem (the rival, by the player's character), Shauna, Tierno and Trevor are not matched by name: their ids are
fixed by tools/ex_rivals.py (rival-teams-rebalanced.md), and their places by RIVAL / FRIEND below.
Fields for the template's pickers: t.st = the player's starter (as PS: "Chespin"), t.pl = the player's character ("m" =
the boy, Calem: you fight Serena; "f" = the girl, Serena: you fight Calem).
"""
import json, os, re
from collections import defaultdict
from common import BULBA, load, norm, report, fix

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
RIVNAMES = {'Serena', 'Calem', 'Shauna', 'Tierno', 'Trevor'}
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
    p = [x for x in split_top(raw) if not re.match(r'^\w+=', x)]
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


def score(e, t):
    vs = [(m['species'], m['level']) for m in t['team']]
    sc = 0
    for x in e['mons']:
        if x in vs:
            sc += 3
        elif x[0] in [v[0] for v in vs]:
            sc += 1
    return sc - abs(len(vs) - len(e['mons']))


def prep(T):
    """Fix the game text's encoding and drop the empty team slots (Egg)."""
    for t in T:
        t['class'], t['name'] = fix(t['class']), fix(t['name'])
        t['team'] = [dict(m, species=fix(m['species'])) for m in t['team'] if m['speciesId']]
    return T


def build(D):
    V, Hk = prep(load('trainers-vanilla.json')), prep(load('trainers-rebalanced.json'))
    nerf = prep(load('trainers-rebalanced-viola-nerf.json'))[VIOLA_NERF]
    dexj = load('dex-rebalanced.json')
    spec, MI, ABI, byid = D['_spec'], D['_MI'], D['_ABI'], D['_byid']
    megas = {}
    for s in dexj['species']:
        for m in s.get('mega', []):
            if m.get('item'):
                megas[(s['id'], m['item'])] = spec[(s['id'], m['form'])]
    rival_ids = {i for a, b in RIVAL.values() for i in a + b} | {i for v in FRIEND.values() for i in v}
    dummy = lambda t: not t['team'] or (not t['name'] and all(m['species'] in ('Rattata', 'Patrat') and m['level'] <= 10
                                                              for m in t['team'])) or t['name'] in ('--',)
    byk, byn = defaultdict(list), defaultdict(list)
    for t in V:
        if not dummy(t) and t['id'] not in rival_ids:
            byk[norm(t['class'] + t['name'])].append(t)
            byn[norm(t['name'])].append(t)
    used = set(rival_ids)

    def match(e):
        c = [t for t in byk.get(e['key'], []) if t['id'] not in used]
        if c:
            best = max(c, key=lambda t: score(e, t))
            if score(e, best) > 0:
                return best
        c = [t for t in byn.get(e.get('name', ''), []) if t['id'] not in used and e.get('name')]
        if c:
            best = max(c, key=lambda t: score(e, t))
            if score(e, best) >= 2:
                return best
        return None

    evs = events()
    return evs, V, Hk, match, used, byk

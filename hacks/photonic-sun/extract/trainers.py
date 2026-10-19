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
import os, re
from collections import defaultdict
from common import BULBA, load, norm, report, fix

PART = os.path.join(BULBA, 'Walkthrough-Pokémon Ultra Sun and Ultra Moon-Part {}.wiki')
CHAPTERS = [(1, 6, 'Melemele Island'), (7, 13, 'Akala Island'), (14, 14, 'Aether Paradise'), (15, 21, "Ula'ula Island"),
            (22, 26, 'Poni Island'), (27, 28, 'The Pokémon League'), (29, 30, 'Post-game: Guardians and Poni Grove'),
            (31, 31, 'Post-game: Episode RR'), (32, 35, 'Post-game: Ultra Space, Battle Tree and Title Defense')]
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


def events():
    out = []
    for n in range(1, 36):
        s = open(PART.format(n), encoding='utf-8').read().replace('{{!}}', '¦')
        h2 = ''
        pat = r'^(={2,5})\s*(.*?)\s*\1\s*$|\{\{[Tt]rainerentry\|(.*?)\}\}\s*$|\{\{[Pp]arty\n(.*?)\{\{Party/end\}\}'  # Part 1 has one {{party
        for m in re.finditer(pat, s, re.M | re.S):
            if m.group(1):
                if len(m.group(1)) == 2:
                    h2 = place_name(m.group(2))
            elif m.group(3):
                out += entry_events(m.group(3), n, h2)
            else:
                out.append(party_event(m.group(4), n, h2))
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


def party_event(b, part, place):
    head = b.split('{{Pokémon', 1)[0]
    g = lambda k: (re.search(r'\|\s*' + k + r'\s*=\s*(.*)', head) or [None, ''])[1].strip()
    mons = []
    for blk in b.split('{{Pokémon')[1:]:
        sp = re.search(r'\|\s*pokemon\s*=\s*([^\n|]+)', blk)
        lv = re.search(r'\|\s*level\s*=\s*(\d+)', blk)
        if sp:
            mons.append((clean(sp.group(1)), int(lv.group(1)) if lv else 0))
    return dict(part=part, place=place, key=norm(clean(g('class')) + clean(g('name'))), name=norm(clean(g('name'))),
                mons=mons, st=starter_of(g('caption')), boss=1)


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
    return not t['name'] or t['name'] == '●●●' or (len(t['team']) == 1 and t['team'][0]['species'] == 'Yungoos'
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
        ts = match(e)
        for t in ts:
            used.add(t['id'])
            placed.append((e, t['id']))
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
    report('trainers: walkthrough', len(placed), 'location pages', len(extra), 'other', len(left), 'of', len(real),
           'real trainers (', len(Hk) - len(real), 'placeholders dropped )')
    for t in left:
        report('  trainer with no place:', t['id'], t['class'], t['name'], [(m['species'], m['level']) for m in V[t['id']]['team']][:4])

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
        cls = t['class']
        n = f"{cls} {t['name']}".strip()
        tags = [] if t['battle'] == 'Single' else [t['battle'] + ' Battle']
        note = []
        if t['items']:
            note.append('Uses ' + ', '.join(t['items']))
        return {'k': k, 'n': n, 'id': tid, 'loc': e['place'], 'tags': tags, 'st': e.get('st', ''), 'cap': 0,
                'note': note, 'p': [mon(m) for m in t['team']]}

    # Boxes (chapters) -> sections (part + place runs) -> trainers; walkthrough stops keep the same order
    loc_extra = defaultdict(list)
    for e, tid in extra:
        loc_extra[norm(e['place'])].append((e, tid))
    stops, g = [], []
    for lo, hi, name in CHAPTERS:
        g.append({'n': name, 'cap': 0, 'tab': name, 'note': [], 'sec': []})
    chap = lambda part: next(i for i, (lo, hi, _) in enumerate(CHAPTERS) if lo <= part <= hi)
    seq = []  # (part, place, [(e, tid)])
    for e, tid in placed:
        if seq and seq[-1][0] == e['part'] and seq[-1][1] == e['place']:
            seq[-1][2].append((e, tid))
        else:
            seq.append([e['part'], e['place'], [(e, tid)]])
    # Every stop of the walkthrough, trainers or not, in order (walk.py adds areas and items)
    allstops = []
    for n in range(1, 36):
        s = open(PART.format(n), encoding='utf-8').read()
        for m in re.finditer(r'^==([^=].*?)==\s*$', s, re.M):
            pl = place_name(m.group(1).strip())
            if not allstops or allstops[-1][:2] != [n, pl]:
                allstops.append([n, pl, []])
    # Location-page trainers join the first stop with their place's name
    for key, items in loc_extra.items():
        key = {'maliegarden': 'maliecity'}.get(key, key)  # the garden is a section of the Malie City stop
        # The same name, else one name starting the other but not mid-number ("route1" is not "route17")
        pre = lambda a, b: a.startswith(b) and not (a[len(b):len(b) + 1].isdigit() and b[-1:].isdigit())
        hit = next((st for st in allstops if norm(st[1]) == key), None) or \
            next((st for st in allstops if pre(norm(st[1]), key) or pre(key, norm(st[1]))), None)
        if hit:
            hit_seq = next((q for q in seq if q[0] == hit[0] and q[1] == hit[1]), None)
            if hit_seq is None:
                hit_seq = [hit[0], hit[1], []]
                seq.append(hit_seq)
            hit_seq[2].extend(items)
        else:
            report('  location page with no walkthrough stop, trainers go to Other:', key)
            left += [Hk[tid] for _, tid in items]
    order = {(st[0], st[1]): i for i, st in enumerate(allstops)}
    seq.sort(key=lambda q: order.get((q[0], q[1]), 10 ** 6))
    keys = {}
    for part, place, items in seq:
        gi = chap(part)
        if g[gi]['sec'] and g[gi]['sec'][-1]['h'] == place:  # the same place again right after (end of one part, start of the next)
            sec = g[gi]['sec'][-1]
        else:
            sec = {'h': place, 'note': [], 'tr': []}
            g[gi]['sec'].append(sec)
        for e, tid in items:
            k = f"{gi}.{len(g[gi]['sec']) - 1}.{len(sec['tr'])}"
            sec['tr'].append(trainer(e, tid, k))
            keys.setdefault((part, place), []).append(k)
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
    # Drop empty boxes (Aether Paradise's first visit has no trainer battles) and renumber the keys to match
    g = [x for x in g if any(s['tr'] for s in x['sec'])]
    remap = {}
    for gi, x in enumerate(g):
        for si, s in enumerate(x['sec']):
            for ti, t in enumerate(s['tr']):
                remap[t['k']] = f'{gi}.{si}.{ti}'
                t['k'] = remap[t['k']]
    for st in allstops:
        st[2] = [remap[k] for k in st[2]]
    D['TR'] = {'caps': [], 'fix': [], 'src': 'game data + Bulbapedia places', 'g': g}
    D['_stops'] = allstops
    report('trainer boxes:', ', '.join(f"{x['n']} {sum(len(s['tr']) for s in x['sec'])}" for x in g))

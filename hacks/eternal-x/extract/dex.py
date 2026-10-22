"""Stage 1: Pokemon, moves, abilities and the type chart (M, MV, AB, P, TC) from the game data.

dex-rebalanced.json (tools/ctr_dex.py on the hack's romfs + code.ips) is the source; dex-vanilla.json (the same tool
on vanilla Pokemon X v1.0) gives the "Changes from vanilla" card (P.vc) and the move change notes (MV.h).
Forms: unnamed forms are dropped; cosmetic duplicates (same types, stats, abilities and level-up moves as a lower
form of the same species: Unown, Vivillon, the Flabebe line, Furfrou...) fold into that form. SPEC maps every
(species id, form) to the P id it ended up as, for the wild, trainer and item stages.
"""
import re
from common import load, fix, norm, slug, report, text

TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic',
         'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']
# Gen 6+ chart: attacking type -> {defending type: multiplier} for the non-1x cells.
CHART = """Normal: Rock .5 Ghost 0 Steel .5
Fire: Fire .5 Water .5 Grass 2 Ice 2 Bug 2 Rock .5 Dragon .5 Steel 2
Water: Fire 2 Water .5 Grass .5 Ground 2 Rock 2 Dragon .5
Electric: Water 2 Electric .5 Grass .5 Ground 0 Flying 2 Dragon .5
Grass: Fire .5 Water 2 Grass .5 Poison .5 Ground 2 Flying .5 Bug .5 Rock 2 Dragon .5 Steel .5
Ice: Fire .5 Water .5 Grass 2 Ice .5 Ground 2 Flying 2 Dragon 2 Steel .5
Fighting: Normal 2 Ice 2 Poison .5 Flying .5 Psychic .5 Bug .5 Rock 2 Ghost 0 Dark 2 Steel 2 Fairy .5
Poison: Grass 2 Poison .5 Ground .5 Rock .5 Ghost .5 Steel 0 Fairy 2
Ground: Fire 2 Electric 2 Grass .5 Poison 2 Flying 0 Bug .5 Rock 2 Steel 2
Flying: Electric .5 Grass 2 Fighting 2 Bug 2 Rock .5 Steel .5
Psychic: Fighting 2 Poison 2 Psychic .5 Dark 0 Steel .5
Bug: Fire .5 Grass 2 Fighting .5 Poison .5 Flying .5 Psychic 2 Ghost .5 Dark 2 Steel .5 Fairy .5
Rock: Fire 2 Ice 2 Fighting .5 Ground .5 Flying 2 Bug 2 Steel .5
Ghost: Normal 0 Psychic 2 Ghost 2 Dark .5
Dragon: Dragon 2 Steel .5 Fairy 0
Dark: Fighting .5 Psychic 2 Ghost 2 Dark .5 Fairy .5
Steel: Fire .5 Water .5 Electric .5 Ice 2 Rock 2 Steel .5 Fairy 2
Fairy: Fire .5 Fighting 2 Poison .5 Dragon 2 Dark 2 Steel .5"""

# Forms that change in battle, with an item or a move, or by fusion: they share their base form's availability.
FC = {351, 421, 479, 386, 487, 492, 555, 641, 642, 645, 646, 647, 648, 658, 681, 716, 718, 720, 741, 746, 774, 778, 800}
FC_KEEP = {(718, 1), (718, 2), (718, 3)}  # Zygarde 10% / 50% are their own catches (cells), not changes
MEGA_WORDS = ('Mega ', 'Primal')


def form_name(s):
    n, f = s['name'], s['formName']
    if s['id'] == 744 and s['form'] == 1:
        return 'Rockruff (Own Tempo)'
    if s['id'] in (382, 383) and s['form'] == 1:
        return 'Primal ' + n
    if not f or f == n or f in ('One form', 'Type: Normal'):  # Unown, Silvally: the base form's own name
        return n
    if f.startswith('Mega ') or n in f:
        return f
    return f'{n} ({re.sub(r" (Form|Forme|Mode|Style|Size|Cloak|Trim|Pattern|Flower)$", "", f)})'


def evo_text(e, names):
    m, it = e['method'], e.get('item')
    lv = f"Lv {e['level']}" if e.get('level') else 'level up'
    t = {
        'Level': lv, 'Level (day)': lv + ', day', 'Level (night)': lv + ', night', 'Level (dusk)': lv + ', dusk (Own Tempo)',
        'Level (male)': lv + ', male', 'Level (female)': lv + ', female', 'Level (female, form 1)': lv + ', female',
        'Use item': f'use {it}', 'Use item (male)': f'use {it} (male)', 'Use item (female)': f'use {it} (female)',
'Friendship': 'high friendship',
        'Friendship (day)': 'high friendship, day', 'Friendship (night)': 'high friendship, night',
        'Hold item (day)': f'level up holding {it}, day', 'Hold item (night)': f'level up holding {it}, night',
        'Trade holding': f'trade holding {it}', 'Trade': 'trade', 'Know move': f"level up knowing {e.get('move')}",
        'Level with party member': f"level up with {e.get('with')} in the party", 'Level at magnetic field':
        'level up at Route 13 (magnetic field)', 'Trade for Shelmet/Karrablast': 'trade for Shelmet/Karrablast',
        'Affection and know move type':
        f"high affection knowing a {e.get('type')} move", 'Level (Atk < Def)': lv + ', Atk < Def',
        'Level (Atk > Def)': lv + ', Atk > Def', 'Level (Atk = Def)': lv + ', Atk = Def', 'Level (personality 1)':
        lv + ' (random)', 'Level (personality 2)': lv + ' (random)', 'Level (Ninjask)': lv,
        'Beauty': 'level up with max Beauty', 'Level with party type': f"{lv} with a {e.get('type')} type in the party",
        'Level holding 3DS upside down': lv + ', 3DS upside down', 'Level in rain': lv + ' in rain',
    }.get(m)
    if t is None:
        report('evolution method not described:', m, e)
        t = m
    return t


def build(D):
    H, V = load('dex-rebalanced.json'), load('dex-vanilla.json')
    van = {(s['id'], s['form']): s for s in V['species']}
    # Moves
    M = [m['name'] for m in H['moves']]
    MI = {n: i for i, n in enumerate(M)}
    vm = {m['id']: m for m in V['moves']}
    doc = move_doc()
    MV = []
    for m in H['moves']:
        v = vm[m['id']]
        h = []
        for k, lab in (('type', 'Type'), ('cat', 'Category'), ('bp', 'Power'), ('acc', 'Accuracy'), ('pp', 'PP'),
                       ('pr', 'Priority'), ('crit', 'Critical hit stage')):
            if m[k] != v[k]:
                h.append('Always a critical hit' if k == 'crit' and m[k] >= 3 else f'{lab} {v[k]} → {m[k]}')
        if fix(m['desc']) != fix(v['desc']):
            h.append('New description')
        e = {'t': m['type'], 'c': m['cat'], 'bp': m['bp'] or None, 'ac': m['acc'] if m['acc'] and m['acc'] <= 100 else None,
             'pp': m['pp'], 'pr': m['pr'], 'd': fix(m['desc']), 'f': m['flags'], 'h': h}
        if norm(m['name']) in doc:
            e['e'] = doc.pop(norm(m['name']))
            e['dc'] = 1
        MV.append(e)
    for k in doc:
        report('Move Changes doc move not found:', k)
    for m, e in zip(M, MV):
        if e.get('dc') and not e.get('h'):
            report('in the Move Changes doc but unchanged in the game:', m)
    AB = [[a['name'], fix(a['desc'])] for a in H['abilities']]
    ABI = {a[0]: i for i, a in enumerate(AB)}
    tms = H['tms']

    # Species and forms
    keep, spec, out, taken = {}, {}, [], set()
    base = {}
    for s in H['species']:
        key = (s['id'], s['form'])
        if s['form'] and not s['formName'] and key != (744, 1):
            spec[key] = None  # totem or battle-only duplicate: maps to the base form below
            continue
        sig = (s['id'], tuple(s['types']), tuple(s['stats']), tuple(s['abilities']), tuple(map(tuple, s['levelup'])))
        if s['form'] and sig in keep:
            spec[key] = keep[sig]
            continue
        n = form_name(s)
        if slug(n) in taken:  # Zygarde 10% comes with Aura Break or Power Construct
            n = f"{n[:-1]}, {s['abilities'][0]})"
        pid = slug(n)
        taken.add(pid)
        keep[sig] = pid
        spec[key] = pid
        if not s['form']:
            base[s['id']] = pid
        out.append((s, n, pid))
    for k, v in list(spec.items()):
        if v is None:
            spec[k] = base[k[0]]
    byname = {s['name']: s['id'] for s in H['species'] if not s['form']}

    P = []
    for s, n, pid in out:
        a1, a2, ha = s['abilities']
        a = [ABI[a1]] + ([ABI[a2]] if a2 != a1 else [])
        p = {'id': pid, 'n': n, 'dex': s['id'], 't': list(dict.fromkeys(s['types'])), 'a': a,
             'ha': ABI[ha] if ha not in (a1, a2) else -1, 's': s['stats'], 'ef': [], 'et': [], 'of': [],
             'lv': [[l, MI[mv]] for l, mv in s['levelup']], 'tm': sorted({MI[tms[t]] for t in s['tm']}),
             'tu': [MI[x] for x in dict.fromkeys(s['tutor'])], 'eg': [MI[x] for x in dict.fromkeys(s['egg'])], 'w': [], 'g': 0}
        if any(w in n for w in MEGA_WORDS) and s['form']:
            p['g'] = 1
        elif s['form'] and s['id'] in FC and (s['id'], s['form']) not in FC_KEEP:
            p['fc'] = 1
        hi = [x for x in dict.fromkeys(s['items']) if x]
        if hi:
            p['hi'] = hi
        v = van.get((s['id'], s['form']))
        vc = {}
        if v:
            if v['stats'] != s['stats']:
                vc['s'] = v['stats']
            if list(dict.fromkeys(v['types'])) != p['t']:
                vc['t'] = list(dict.fromkeys(v['types']))
            if v['abilities'] != s['abilities']:
                vc['a'] = list(dict.fromkeys(v['abilities']))
        if vc:
            p['vc'] = vc
        p['_s'] = s
        P.append(p)
    byid = {p['id']: p for p in P}
    # Evolutions (merge day + night variants of the same item method)
    for p in P:
        s = p.pop('_s')
        seen = {}
        evos = s['evolutions']
        if s['form'] and any(not e['into'] for e in evos):  # XY: Pumpkaboo's sizes have blank rows; the base form's apply
            evos = [dict(e, form=s['form']) for e in next(x for x in H['species'] if x['id'] == s['id'] and not x['form'])['evolutions']]
        for e in evos:
            form = e.get('form', 1 if 'form 1' in e['method'] else s['form'] if (byname[e['into']], s['form']) in spec else 0)
            tid = spec.get((byname[e['into']], form))
            if not tid:
                continue
            how = evo_text(e, byname)
            how = re.sub(r', (day|night)$', '', how) if e['method'].startswith('Hold item') else how
            if (tid, how) in seen:
                continue
            seen[(tid, how)] = 1
            p['et'].append([how, tid])
            byid[tid]['ef'].append([how, p['id']])
    # Shedinja appears beside Ninjask (an empty party slot and a spare Poke Ball); the evolution table can't say so
    how = 'Lv 20 with an empty party slot and a Poké Ball'
    byid['nincada']['et'].append([how, 'shedinja'])
    byid['shedinja']['ef'].append([how, 'nincada'])
    # Burmy's cloaks are folded into one entry, so its Sandy and Trash evolutions are added here
    burmy = next(p for p in P if p['dex'] == 412)
    for wid in [p['id'] for p in P if p['dex'] == 413][1:]:
        how = f"Lv 20, female, {byid[wid]['n'].split('(')[1][:-1]} Cloak"
        burmy['et'].append([how, wid])
        byid[wid]['ef'].append([how, burmy['id']])
    for p in P:
        p['of'] = [q['id'] for q in P if q['dex'] == p['dex'] and q is not p]
    D.update(M=M, MV=MV, AB=AB, P=P)
    D['TC'] = {a: {d: 10 for d in TYPES} for a in TYPES}
    for line in CHART.splitlines():
        a, rest = line.split(':')
        r = rest.split()
        for d, x in zip(r[::2], r[1::2]):
            D['TC'][a][d] = int(float(x) * 10)
    D['_spec'], D['_MI'], D['_ABI'], D['_byid'] = spec, MI, ABI, byid
    report('species/forms', len(P), 'megas', sum(p['g'] == 1 for p in P), 'form changes', sum(bool(p.get('fc')) for p in P),
           'changed from vanilla', sum(bool(p.get('vc')) for p in P), 'moves changed', sum(bool(e.get('h')) for e in MV))


def move_doc():
    """Move Changes.pdf: 'Move: change text' paragraphs and the TM changes, keyed by normalised move name."""
    t = text('Move Changes')
    body = t.split('more useful:', 1)[1].split('* This change')[0]
    out, cur = {}, None
    for line in body.splitlines():
        line = line.strip()
        m = re.match(r"^([A-Z][A-Za-z'\- ]+?)\*?: (.*)$", line)
        if m:
            cur = norm(m.group(1))
            out[cur] = m.group(2)
        elif line and cur:
            out[cur] += ' ' + line
    for tm in re.findall(r'TM\d+ [A-Za-z\- ]+? now teaches ([A-Za-z\- ]+?)(?:,| and)', t):
        k = norm(tm)
        out[k] = (out.get(k, '') + ' ' if k in out else '') + 'Now taught by a TM (see the TM list in Items).'
    return out

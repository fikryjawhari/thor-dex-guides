"""Shared conversion and trainer helpers for the 3DS guides' source extracts."""

import re
from extractlib import fix, norm, slug


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


def build_dex(data, hacked, vanilla, *, move_notes, evolution_text, report, evolution_rows=None):
    """Populate dex tables and scratch mappings; callbacks supply local evolution rules and report output."""
    # Moves
    M = [m['name'] for m in hacked['moves']]
    MI = {n: i for i, n in enumerate(M)}
    vm = {m['id']: m for m in vanilla['moves']}
    doc = dict(move_notes)
    MV = []
    for m in hacked['moves']:
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
    AB = [[a['name'], fix(a['desc'])] for a in hacked['abilities']]
    ABI = {a[0]: i for i, a in enumerate(AB)}
    tms = hacked['tms']

    # Species and forms
    keep, spec, out, taken = {}, {}, [], set()
    base = {}
    for s in hacked['species']:
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
    byname = {s['name']: s['id'] for s in hacked['species'] if not s['form']}

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
        p['_s'] = s
        P.append(p)
    byid = {p['id']: p for p in P}
    # Evolutions (merge day + night variants of the same item method)
    for p in P:
        s = p.pop('_s')
        seen = {}
        evos = evolution_rows(s, hacked['species']) if evolution_rows else s['evolutions']
        for e in evos:
            form = e.get('form', 1 if 'form 1' in e['method'] else s['form'] if (byname[e['into']], s['form']) in spec else 0)
            tid = spec.get((byname[e['into']], form))
            if not tid:
                continue
            how = evolution_text(e)
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
    data.update(M=M, MV=MV, AB=AB, P=P)
    data['TC'] = {a: {d: 10 for d in TYPES} for a in TYPES}
    for line in CHART.splitlines():
        a, rest = line.split(':')
        r = rest.split()
        for d, x in zip(r[::2], r[1::2]):
            data['TC'][a][d] = int(float(x) * 10)
    data['_spec'], data['_MI'], data['_ABI'], data['_byid'] = spec, MI, ABI, byid
    report('species/forms', len(P), 'megas', sum(p['g'] == 1 for p in P), 'form changes', sum(bool(p.get('fc')) for p in P),
           'moves changed', sum(bool(e.get('h')) for e in MV))


def parse_move_doc(text):
    """Move Changes.pdf: 'Move: change text' paragraphs and the TM changes, keyed by normalised move name."""
    body = text.split('more useful:', 1)[1].split('* This change')[0]
    out, cur = {}, None
    for line in body.splitlines():
        line = line.strip()
        m = re.match(r"^([A-Z][A-Za-z'\- ]+?)\*?: (.*)$", line)
        if m:
            cur = norm(m.group(1))
            out[cur] = m.group(2)
        elif line and cur:
            out[cur] += ' ' + line
    for tm in re.findall(r'TM\d+ [A-Za-z\- ]+? now teaches ([A-Za-z\- ]+?)(?:,| and)', text):
        k = norm(tm)
        out[k] = (out.get(k, '') + ' ' if k in out else '') + 'Now taught by a TM (see the TM list in Items).'
    return out


def trainer_match_score(event, trainer):
    team = [(member['species'], member['level']) for member in trainer['team']]
    score = 0
    for pokemon in event['mons']:
        if pokemon in team:
            score += 3
        elif pokemon[0] in [member[0] for member in team]:
            score += 1
    return score - abs(len(team) - len(event['mons']))


def default_moves(species, level):
    """The last four distinct level-up moves at that level, in learnset order."""
    moves = []
    for learned_level, move in species['lv']:
        if learned_level <= level and move not in moves:
            moves.append(move)
    return moves[-4:]

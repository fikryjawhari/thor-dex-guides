"""Stage 5: the Walkthrough tab (WK).

Eternal X follows Bulbapedia's Pokémon X and Y walkthrough: one split per part, one stop per place heading, with the
trainers trainers.py placed there. Each encounter area joins the first stop with its name; areas with no stop of their
own become "on the way" stops after the stop of the area before them (in the Locations order). Items are filed under the
first stop named in their location text (items.py's place list for rows with Found / Shop lines); the rest are listed in
Guide info. Game docs are the hack's own change docs and changelog.
"""
import os, re
from common import SRC, TXT, norm, report

ALIAS = {'Starter': ['Aquacorde Town']}
# Item places that are gyms, buildings or rooms of a walkthrough stop (the "(gift)" tag is dropped before the lookup).
# Bulbapedia files each building under the stop it sits in (Lysandre Labs under Lumiose City's second visit, and so on).
ITEM_ALIAS = {'Anistar Gym': 'Anistar City', 'Coumarine Gym': 'Coumarine City', 'Cyllage Gym': 'Cyllage City',
              'Laverre Gym': 'Laverre City', 'Lumiose Gym': 'Lumiose City', 'Santalune Gym': 'Santalune City',
              'Shalour Gym': 'Shalour City', 'Snowbelle Gym': 'Snowbelle City',
              'Lysandre Labs': 'Lumiose City', 'Lumiose Museum': 'Lumiose City', 'Hotel Richissime': 'Lumiose City',
              'North Boulevard': 'Lumiose City', 'South Boulevard': 'Lumiose City', 'Estival Avenue': 'Lumiose City',
              'Vernal Avenue': 'Lumiose City', 'Poké Ball Factory': 'Laverre City', 'Battle Maison': 'Kiloude City',
              'Tower of Mastery': 'Shalour City', 'Kalos Power Plant': 'Route 13', 'Chamber of Emptiness': 'Route 22',
              'Unknown Dungeon': 'Pokémon Village', 'Berry fields': 'Route 7 (east)', 'Shabboneau Castle': 'Camphrier Town'}
# Fixes to Bulbapedia's order: PLACE area -> (part, stop), NEW_STOP (part, stop, first trainer, new stop). None yet.
PLACE = {}
NEW_STOP = []
# Item places that name a building inside a stop's place ("Route 1 - Trainer School"). None yet.
ITEM_IN = {}
DOCS = [('Evolution Changes', 'Evolution Changes'), ('Move Changes', 'Move Changes')]


def key(s):
    return norm(re.sub(r'\s*\(.*?\)', '', s))


def same(area, stop):
    """Names match whole, or one starts the other (not "Route 1" for "Route 10")."""
    a, s = key(area), key(stop)
    if a == s:
        return True
    short, long_ = sorted((a, s), key=len)
    return len(short) > 5 and long_.startswith(short) and not long_[len(short)].isdigit()


def build(D):
    AR, stops = D['AR'], D['_stops']
    st = [{'part': p, 'n': n, 'a': [], 's': [], 'note': '', 'it': [], 'tr': tr} for p, n, tr in stops]
    TRN = {t['k']: t['n'] for g in D['TR']['g'] for s in g['sec'] for t in s['tr']}
    for part, n, first, new in NEW_STOP:
        j = next(j for j, s in enumerate(st) if s['part'] == part and s['n'] == n)
        k = next(k for k, t in enumerate(st[j]['tr']) if TRN[t] == first)
        st.insert(j + 1, {'part': part, 'n': new, 'a': [], 's': [], 'note': '', 'it': [], 'tr': st[j]['tr'][k:]})
        st[j]['tr'] = st[j]['tr'][:k]
    where = {}
    for i, A in enumerate(AR):
        names = [A['n']] + ALIAS.get(A['n'], [])
        if A['n'] in PLACE:
            part, n = PLACE[A['n']]
            hit = next(j for j, s in enumerate(st) if s['part'] == part and s['n'] == n)
        else:
            hit = next((j for j, s in enumerate(st) if any(same(x, s['n']) for x in names)), None)
        if hit is not None:
            st[hit]['a'].append(i)
            where[i] = hit
    # Areas with no stop: "on the way", after the stop holding the area before them
    extra = {}
    for i, A in enumerate(AR):
        if i in where or A.get('ns'):
            continue
        prev = max((where[j] for j in range(i) if j in where), default=0)
        extra.setdefault(prev, []).append(i)
    out = []
    for j, s in enumerate(st):
        out.append(s)
        for i in extra.get(j, []):
            out.append({'part': s['part'], 'n': AR[i]['n'], 'a': [i], 's': [], 'note': '', 'it': [], 'tr': [], 'x': 1})
    report('walkthrough: on the way stops', sum(len(v) for v in extra.values()), ':', ', '.join(AR[i]['n'] for v in extra.values() for i in v))
    # Items
    np = []
    for sec in D['IT']:
        if sec['n'] == 'Shops':
            continue
        for r in sec['r']:
            locs = [re.sub(r'^Was .*?\. ', '', x.strip()) for x in D.get('_itp', {}).get(r[0], r[1]).split(';')]
            locs = [x for x in locs if x and not x.startswith('held by')]
            hit = None
            for loc in locs:
                loc = next((v for k, v in ITEM_IN.items() if k in loc), loc)
                loc = loc.split(' - ')[0].split(' · ')[0].replace(' PokéMart', '').replace(' shop', '')
                loc = re.sub(r'\s*\(gift\)$', '', loc)
                loc = ITEM_ALIAS.get(loc, loc)
                hit = next((s for s in out if same(loc, s['n'])), None)
                if hit:
                    break
            row = [sec['n'], r[0], r[1], r[2]]
            if hit:
                hit['it'].append(row)
            else:
                np.append(row)
    splits = []
    for p in sorted({s['part'] for s in out}):
        ss = [s for s in out if s['part'] == p]
        a, b = ss[0]['n'], ss[-1]['n']
        splits.append({'n': f'{p}. {a}' + (f' – {b}' if b != a else ''), 'note': '', 'st': ss})
    for s in out:
        s.pop('part')
    docs = []
    for title, f in DOCS:
        t = open(os.path.join(TXT, f + '.txt'), encoding='utf-8').read()
        t = re.sub(r'\f', '\n', t).replace('', '•')
        docs.append([title, t.strip()])
    ch = open(os.path.join(SRC, 'Changelog.txt'), encoding='utf-8', errors='replace').read().replace('�', 'é')
    docs.append(['Changelog', ch.strip()])
    D['WK'] = {'splits': splits, 'np': np, 'docs': docs}
    report('walkthrough:', len(splits), 'splits', len(out), 'stops,', sum(len(s['it']) for s in out), 'items placed,', len(np), 'not placed')

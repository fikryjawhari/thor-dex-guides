"""Stage 5: the Walkthrough tab (WK).

Eternal X follows Bulbapedia's Pokémon X and Y walkthrough: one split per part, one stop per place heading, with the
trainers trainers.py placed there. Each encounter area joins the first stop with its name; areas with no stop of their
own become "on the way" stops after the stop of the area before them (in the Locations order). Items are filed under the
first stop named in their location text (items.py's place list for rows with Found / Shop lines); the rest are listed in
Guide info. An item filed under Lumiose City moves to the earliest part whose Lumiose City block lists it in its rows. Game docs are the hack's own change docs and changelog.
"""
import os, re
from common import SRC, TXT, norm, report
from items import walk_rows, ikey

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
# Fixes to Bulbapedia's order: PLACE area -> (part, stop), NEW_STOP (part, stop, first trainer, new stop). 
PLACE = {'Team Flare Secret HQ': (11, 'Geosenge Town')}  # Xerneas: the second Geosenge visit
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
    # Lumiose City is visited in several parts: an item filed there goes to the earliest part whose Lumiose City block
    # lists it in the walkthrough's {{itemlist}} rows (that block's stop; parts with two blocks have two stops)
    LUM = {}
    for w in walk_rows():
        if w['block'] == 'Lumiose City':
            LUM.setdefault(w['key'], (w['part'], w['bi']))
    lum_stop, cnt = {}, {}
    for s in out:
        if s['n'] == 'Lumiose City':
            cnt[s['part']] = cnt.get(s['part'], 0) + 1
            lum_stop[(s['part'], cnt[s['part']])] = s
    moved, stayed = {}, 0
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
            if hit and hit['n'] == 'Lumiose City' and ikey(r[0]) in LUM:
                tgt = lum_stop.get(LUM[ikey(r[0])])
                if tgt is not None and tgt is not hit:
                    moved[(tgt['part'], tgt['n'])] = moved.get((tgt['part'], tgt['n']), 0) + 1
                    hit = tgt
                else:
                    stayed += 1
            row = [sec['n'], r[0], r[1], r[2]]
            if hit:
                hit['it'].append(row)
            else:
                np.append(row)
    report('walkthrough Lumiose items moved:', ', '.join(f'part {p} stop {n}: {c}' for (p, n), c in sorted(moved.items())) or 'none',
           '; left in place', stayed)
    # Splits are the Trainers page's gym splits (D['_splits']: name, the key of the fight that ends it): stops in story
    # order, cut after the stop holding that fight; the rest is the post-game.
    splits, cur, ends = [], [], list(D['_splits'])
    for st in out:
        cur.append(st)
        if ends and ends[0][1] in st.get('tr', []):
            splits.append({'n': ends.pop(0)[0], 'note': '', 'st': cur})
            cur = []
    if ends:
        report('walkthrough: split ends not found:', [e[0] for e in ends])
    splits.append({'n': 'Post-game', 'note': '', 'st': cur})
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

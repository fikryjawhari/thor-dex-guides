"""Stage 5: the Walkthrough tab (WK).

Photonic Sun has no walkthrough of its own and follows Ultra Sun's story, so the order is Bulbapedia's Ultra Sun /
Ultra Moon walkthrough: one split per part, one stop per place heading, with the trainers trainers.py placed there.
Each encounter area joins the first stop with its name; areas with no stop of their own become "on the way" stops
after the stop of the area before them (in the Locations order). Items are filed under the first stop named in their
location text (items.py's place list for rows with Found / Shop lines); the rest are listed in Guide info. Game docs are the hack's own change docs and changelog.
"""
import os, re
from common import SRC, TXT, norm, report

ALIAS = {'Starter': ['Route 1'], 'Routes 15 and 16': ['Route 15', 'Route 16'],"Trainers' School": ["Trainer's School"],
         'Altar of the Sunne': ['Altar of the Sunne'], 'Ultra Space Wilds': ['Ultra Warp Ride']}
# Item places that are rooms or corners of a walkthrough stop
ITEM_ALIAS = {'Shady House': 'Po Town', 'Hokulani Observatory': 'Mount Hokulani', 'Plains Grotto': 'Poni Plains',
              "Team Rocket's Castle": 'Aether Paradise', 'Ultra Space Wilds': 'Ultra Warp Ride'}
DOCS = [('Evolution Changes', 'Evolution Changes'), ('Type Changes', 'Type Changes'), ('Move Changes', 'Move Changes'),
        ('Totem Battles', 'Totem Battles'), ('How to Enable Mega Evolution', 'How to Enable Mega Evolution')]


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
    where = {}
    for i, A in enumerate(AR):
        names = [A['n']] + ALIAS.get(A['n'], [])
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
                loc = loc.split(' - ')[0].replace(' PokéMart', '').replace(' shop', '')
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
        t = re.sub(r'\f', '\n', t).replace('', '•')
        docs.append([title, t.strip()])
    ch = open(os.path.join(SRC, 'Changelog.txt'), encoding='utf-8', errors='replace').read().replace('�', 'é')
    docs.append(['Changelog', ch.strip()])
    D['WK'] = {'splits': splits, 'np': np, 'docs': docs}
    report('walkthrough:', len(splits), 'splits', len(out), 'stops,', sum(len(s['it']) for s in out), 'items placed,', len(np), 'not placed')

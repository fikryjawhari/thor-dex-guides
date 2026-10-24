"""Walkthrough (WK): the Walkthrough tab.

Photonic Sun has no walkthrough of its own and follows Ultra Sun's story, so the order is Bulbapedia's Ultra Sun /
Ultra Moon walkthrough: stops start in part/place order, then regroup into the same cap splits as Trainers.
Stops spanning cap boundaries split into trainer runs, retaining encounters and items once and recording legacy coordinates.
Each encounter area joins the first stop with its name; areas with no stop of their own become "on the way" stops
after the stop of the area before them (in the Locations order). Items are filed under the first stop named in their
location text (items.py's place list for rows with Found / Shop lines); the rest are listed in Guide info. Game docs are the hack's own change docs and changelog.
"""
import os, re
from common import SRC, TXT, report, split_name
from ctrguide import walk_same as same, walk_stops

ALIAS = {'Starter': ['Route 1'], 'Routes 15 and 16': ['Route 15', 'Route 16'],"Trainers' School": ["Trainer's School"],
         'Altar of the Sunne': ['Altar of the Sunne'], 'Ultra Space Wilds': ['Ultra Warp Ride']}
# Item places that are rooms or corners of a walkthrough stop
ITEM_ALIAS = {'Shady House': 'Po Town', 'Hokulani Observatory': 'Mount Hokulani', 'Plains Grotto': 'Poni Plains',
              "Team Rocket's Castle": 'Aether Paradise', 'Ultra Space Wilds': 'Ultra Warp Ride'}
# Fixes to Bulbapedia's order (the user, 2026-10-21). PLACE: area -> (part, stop) it joins, the first stop of that name
# in the part (Route 1's wild Pokémon come with the Route 1 visit of part 2, after the Poké Balls; part 1 keeps the
# starter). NEW_STOP: (part, stop, first trainer, new stop): that trainer and the ones after him there move to a new stop
# right after it.
PLACE = {'Route 1': (2, 'Route 1'), "Hau'oli Outskirts": (2, "Route 1 (Hau'oli Outskirts)"),
         "Trainers' School": (2, "Trainers' School")}
NEW_STOP = [(2, "Route 1 (Hau'oli Outskirts)", 'Youth Athlete Hiromi', "Trainers' School")]
# Item places that name a building inside a stop's place ("Route 1 - Trainer School")
ITEM_IN = {'Trainer School': "Trainers' School"}
DOCS = [('Evolution Changes', 'Evolution Changes'), ('Type Changes', 'Type Changes'), ('Move Changes', 'Move Changes'),
        ('Totem Battles', 'Totem Battles'), ('How to Enable Mega Evolution', 'How to Enable Mega Evolution')]


def walkthrough_splits(data, old_splits):
    caps, targets = data['_cap_splits'], data['_trainer_splits']
    stop_order = {(part, name): index for index, (part, name, _) in enumerate(data['_stops'])}
    out = [{'n': group['n'], 'cap': group['cap'], 'note': '', 'st': []} for group in data['TR']['g']]
    previous_at = 0
    for old_split, split in enumerate(old_splits):
        for old_stop, stop in enumerate(split['st']):
            if stop['s']:
                raise ValueError('Checklist steps require shared stable-key support before cap regrouping')
            part = stop['part']
            if part >= 29:
                target = len(caps) if part == 31 else len(caps) + 1
            else:
                at = stop_order.get((part, stop['n']), previous_at)
                previous_at = at
                target = next(index for index, cap in enumerate(caps) if cap['at'] >= at)
            buckets = {}
            for trainer_key in stop['tr']:
                buckets.setdefault(targets[trainer_key], []).append(trainer_key)
            buckets.setdefault(target, [])
            for fragment, destination in enumerate(sorted(buckets)):
                copy = {key: value for key, value in stop.items() if key != 'part'}
                old_key = f'{old_split}.{old_stop}'
                copy['k'] = old_key + (f'.f{fragment}' if fragment else '')
                copy['tr'] = buckets[destination]
                if fragment:
                    copy.update(a=[], it=[], note='')
                out[destination]['st'].append(copy)
    return out


def build(D):
    TRN = {t['k']: t['n'] for g in D['TR']['g'] for s in g['sec'] for t in s['tr']}
    out = walk_stops(D['AR'], D['_stops'], TRN, aliases=ALIAS, placements=PLACE, new_stops=NEW_STOP)
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
    docs = []
    for title, f in DOCS:
        t = open(os.path.join(TXT, f + '.txt'), encoding='utf-8').read()
        t = re.sub(r'\f', '\n', t).replace('', '•')
        docs.append([title, t.strip()])
    ch = open(os.path.join(SRC, 'Changelog.txt'), encoding='utf-8', errors='replace').read().replace('�', 'é')
    docs.append(['Changelog', ch.strip()])
    D['WK'] = {'splits': splits, 'np': np, 'docs': docs}
    D['WK']['splits'] = walkthrough_splits(D, splits)
    splits = D['WK']['splits']
    out = [stop for split in splits for stop in split['st']]
    report('walkthrough:', len(splits), 'splits', len(out), 'stops,', sum(len(s['it']) for s in out), 'items placed,', len(np), 'not placed')

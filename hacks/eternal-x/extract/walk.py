"""Walkthrough (WK): the Walkthrough tab.

Eternal X follows Bulbapedia's Pokémon X and Y walkthrough: one split per cap, one stop per place heading, with the
trainers trainers.py placed there. Each encounter area joins the first stop with its name; areas with no stop of their
own become "on the way" stops after the stop of the area before them (in the Locations order). Items are filed under the
first stop named in their location text (items.py's place list for rows with Found / Shop lines); the rest are listed in
Guide info. An item filed under Lumiose City moves to the earliest part whose Lumiose City block lists it in its rows. Game docs are the hack's own change docs and changelog.
"""
import os, re
from common import SRC, TXT, report, split_name
from ctrguide import walk_same as same, walk_stops
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


def build(D):
    TRN = {t['k']: t['n'] for g in D['TR']['g'] for s in g['sec'] for t in s['tr']}
    out = walk_stops(D['AR'], D['_stops'], TRN, aliases=ALIAS, placements=PLACE, new_stops=NEW_STOP)
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
    legacy_ends = list(D['_legacy_splits'])
    legacy_split, legacy_stop = 0, 0
    for stop in out:
        stop['k'] = f'{legacy_split}.{legacy_stop}'
        legacy_stop += 1
        if legacy_ends and legacy_ends[0] in stop['tr']:
            legacy_ends.pop(0)
            legacy_split += 1
            legacy_stop = 0
    assert not legacy_ends, legacy_ends
    groups = D['TR']['g']
    splits = [{'n': split_name(group['n'], group['cap'] or None), 'note': '', 'st': []} for group in groups]
    group_of = {trainer['k']: index for index, group in enumerate(groups)
                for section in group['sec'] for trainer in section['tr']}
    cap_of = {trainer['k']: section.get('cap') for group in groups
              for section in group['sec'] for trainer in section['tr']}
    ends = {trainer_key: index for index, (_, trainer_key) in enumerate(D['_splits'])}
    current = 0
    for stop in out:
        fragments = []
        for trainer_key in stop['tr']:
            group_index = group_of[trainer_key]
            if not fragments or fragments[-1][0] != group_index:
                fragments.append((group_index, []))
            fragments[-1][1].append(trainer_key)
        if not fragments:
            fragments = [(current, [])]
        for fragment_index, (group_index, trainer_keys) in enumerate(fragments):
            fragment_key = f"{stop['k']}.f{fragment_index}" if fragment_index else stop['k']
            fragment = dict(stop, k=fragment_key, tr=trainer_keys)
            if fragment_index:
                fragment.update(a=[], s=[], it=[], note='')
            if trainer_keys and cap_of[trainer_keys[0]]:
                fragment['cap'] = cap_of[trainer_keys[0]]
            splits[group_index]['st'].append(fragment)
            current = group_index
            if any(trainer_key in ends for trainer_key in trainer_keys):
                current = min(group_index + 1, len(splits) - 1)
    for s in out:
        s.pop('part')
    for split in splits:
        for stop in split['st']:
            stop.pop('part', None)
    docs = []
    for title, f in DOCS:
        t = open(os.path.join(TXT, f + '.txt'), encoding='utf-8').read()
        t = re.sub(r'\f', '\n', t).replace('', '•')
        docs.append([title, t.strip()])
    ch = open(os.path.join(SRC, 'Changelog.txt'), encoding='utf-8', errors='replace').read().replace('�', 'é')
    docs.append(['Changelog', ch.strip()])
    legacy_stops = {f'{split_index}.{stop_index}': stop['k'].split('.f', 1)[0]
                    for split_index, split in enumerate(splits) for stop_index, stop in enumerate(split['st'])}
    fragment_keys = [stop['k'] for split in splits for stop in split['st']]
    assert len(fragment_keys) == len(set(fragment_keys)), 'Duplicate persistent walkthrough fragment keys'
    assert set(legacy_stops.values()) == {stop['k'] for stop in out}, 'Missing legacy walkthrough roots'
    D['WK'] = {'splits': splits, 'np': np, 'docs': docs}
    report('walkthrough:', len(splits), 'splits', sum(len(split['st']) for split in splits), 'stop fragments,',
           len(out), 'legacy stop keys,', sum(len(s['it']) for s in out), 'items placed,', len(np), 'not placed')

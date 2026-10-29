"""Walkthrough (WK): the Trainers boxes are the splits (the 21 cap battles, then Post-game), their places in Trainer
Changes order are the stops, with the places the doc has no trainers for put in between (ON_THE_WAY). Each stop takes
its Wild Areas areas (locs.area_names, first visit; AREA_STOP / REVISIT where the game says otherwise) and the Item
Changes placements (items.area_join: an item at the first stop of its place, Surf / Waterfall / badge / postgame ones
at the first stop of that place they can be reached from). Stop keys are the first build's positions ("split.stop",
tools/schema.py) and never change afterwards.
"""
import re

from common import drayano, report
import items
import locs

# Places with no trainers, as stops in the game's order: box (start of its name) -> [(stop name, the section header it
# goes before; None = at the end)]. Postgame-only places follow the Wild Areas doc's postgame order.
ON_THE_WAY = {
    'Cheren': [('Aspertia City', 'Route 20'), ('Route 19', 'Route 20'), ('Floccesy Town', 'Route 20')],
    'Burgh': [('Royal Unova', None)],
    'Lenora': [('Join Avenue', 'Desert Resort')],
    'Elesa': [('Anville Town', 'Route 16')],
    'Charles': [('Driftveil Drawbridge', None)],
    'Colress': [('Pokémon World Tournament', 'Route 6')],
    'Skyla': [('Lentimas Town', None)],
    'Marlon': [('Marine Tube', "Humilau City and Marlon's Gym")],
    'Post-game': [('Tubeline Bridge', 'Castelia City'), ('Dragonspiral Tower', 'Castelia City'),
                  ('Underground Ruins', 'Castelia City'), ('Marvelous Bridge', 'Castelia City'),
                  ('Route 15', 'Castelia City'), ('Black City', 'Castelia City'),
                  ('Pinwheel Forest', 'Castelia City'), ('Route 3', 'Castelia City'),
                  ('Dreamyard', 'Benga, Postgame'), ('Route 2', 'Benga, Postgame'),
                  ('Accumula Town', 'Benga, Postgame'), ('Route 1', 'Benga, Postgame'),
                  ('Nuvema Town', 'Benga, Postgame'), ('Route 17', 'Benga, Postgame'), ('Route 18', 'Benga, Postgame'),
                  ('P2 Laboratory', 'Benga, Postgame'), ('Entralink', 'N'), ('Abyssal Ruins', 'N'),
                  ('Unity Tower', 'N'), ('Pledge Grove', 'N'),
                  ('Nacrene City', 'Unovan Gym Leader Rematches, Postgame')],
}
# AR area -> the stop it shows at, where its first visit by name is wrong: AR name -> (box, stop name)
AREA_STOP = {
    'Starter': ('Cheren', 'Aspertia City'),
    'Relic Passage - Center (Main) Room': ('Colress', 'Relic Passage - Driftveil Side'),
    'Route 8, Moor of Icirrus - All Seasons': ('Post-game', 'Icirrus City, Postgame'),
    'Marvellous Bridge': ('Post-game', 'Marvelous Bridge'),
}
# Revisit stops that show an area again (Waterfall: the trainers that need it): (box, stop name) -> [AR names]
REVISIT = {('Benga', 'Route 20'): ['Route 20'], ('Benga', 'Lostlorn Forest'): ['Lostlorn Forest']}
# Stops named for a building: the item place they are in
STOP_PLACE = {"Drayden's Gym": 'Opelucid City'}
# Item places with no area and no stop of that name: item place (after items.area_join) -> stop name
ITEM_PLACE = {'PWT': 'Pokémon World Tournament', 'Pokémon League': 'The Pokémon League', 'Black Tower': 'Black City'}
# Badges: the box after the n-th gym leader's box is the first one with n badges
GYMS = ['Cheren', 'Roxie', 'Burgh', 'Elesa', 'Clay', 'Skyla', 'Drayden', 'Marlon']
# HMs: the stop that gives them (box index found by the box's name, stop name)
SURF = ('Clay', 'Route 6')
WATERFALL = ('Benga', None)    # HM05 at Undella Town ends the Hugh split: the next box


def norm(name):
    return drayano.key(re.sub(r'\s*\(.*?\)', '', name))


def build(D):
    groups, AR = D['TR']['g'], D['AR']
    ar_index = {a['n']: i for i, a in enumerate(AR)}
    aro = D.get('ARO') or list(range(len(AR)))
    loc_names = set(D['LOC'])
    box_of = lambda prefix: next(i for i, g in enumerate(groups) if g['n'].startswith(prefix))

    # ---- stops: the box's places in order (runs of one place are one stop), on-the-way stops between them
    splits = []
    for gi, g in enumerate(groups):
        stops = []
        for section in g['sec']:
            if stops and stops[-1]['n'] == section['h'] and stops[-1]['tr']:
                stops[-1]['tr'] += [t['k'] for t in section['tr']]
            else:
                stops.append(dict(n=section['h'], a=[], s=[], it=[], tr=[t['k'] for t in section['tr']]))
        for name, before in next((v for k, v in ON_THE_WAY.items() if g['n'].startswith(k)), []):
            at = len(stops) if before is None else next(i for i, s in enumerate(stops) if s['n'] == before)
            stops.insert(at, dict(n=name, a=[], s=[], it=[], tr=[], x=1))
        splits.append(dict(n=g['n'], st=stops))
    order = [(si, ti) for si, sp in enumerate(splits) for ti in range(len(sp['st']))]
    stop = lambda p: splits[p[0]]['st'][p[1]]
    find = lambda gi, name: (gi, next(ti for ti, s in enumerate(splits[gi]['st']) if s['n'] == name))

    # ---- areas: each at the first stop whose place names it (locs alias table), unless AREA_STOP says otherwise
    names_of = {p: [n for n in locs.area_names(stop(p)['n'])] for p in order}
    first_area = {}
    for p in order:
        for n in names_of[p]:
            if n in ar_index:
                first_area.setdefault(ar_index[n], p)
    for n, (box, name) in AREA_STOP.items():
        first_area[ar_index[n]] = find(box_of(box), name)
    shown = {a: [p] for a, p in first_area.items()}
    for (box, name), areas in REVISIT.items():
        for n in areas:
            shown[ar_index[n]].append(find(box_of(box), name))
    for a, ps in sorted(shown.items()):
        for p in ps:
            stop(p)['a'].append(a)
    for p in order:
        stop(p)['a'].sort(key=lambda a: aro.index(a))
    unplaced_areas = [a['n'] for i, a in enumerate(AR) if i not in first_area]

    # ---- items: every Found line and shop line at the first stop of its place it can be reached from
    surf = order.index(find(box_of(SURF[0]), SURF[1]))
    waterfall = order.index((box_of(WATERFALL[0]), 0))
    postgame = order.index((len(groups) - 1, 0))
    badge_from = [0] + [order.index((box_of(g) + 1, 0)) for g in GYMS]
    stop_of_trainer = {k: i for i, p in enumerate(order) for k in stop(p)['tr']}
    reward_at = {}                                # a TM a trainer gives: at that trainer's stop (gym TMs)
    for t in (t for g in groups for s in g['sec'] for t in s['tr']):
        for reward in t.get('rw', []):
            if re.match(r'[TH]M\d', reward):
                reward_at.setdefault(reward, stop_of_trainer[t['k']])

    def stops_of(place):
        """Positions in order whose stop is this item place: by area, else by stop name."""
        place, names = items.area_join(place, loc_names)
        place = ITEM_PLACE.get(place, place)
        at = {p for n in names if n in ar_index for p in shown.get(ar_index[n], [])}
        hits = [i for i, p in enumerate(order) if p in at or any(n in names for n in names_of[p])]
        return hits or [i for i, p in enumerate(order) if norm(STOP_PLACE.get(stop(p)['n'], stop(p)['n'])).startswith(norm(place))]

    NP, counts = [], {'found': 0, 'shop': 0}
    for box in D['IT']:
        for row in box['r']:
            for line in row[1].splitlines():
                if box['n'] == 'Shops':
                    place, kind = line.split(' — ')[0], 'shop'
                elif line.startswith('Found: '):
                    place, kind = line[7:].split(' — ')[0], 'found'
                else:
                    continue                      # Also: / Wild: lines are not places
                at = stops_of(place)
                low = 0
                note = line.split(' — ', 1)[1] if ' — ' in line else ''
                if re.search(r'\bSurf\b', note):
                    low = surf
                if re.search(r'\bWaterfall\b', note):
                    low = waterfall
                if re.search(r'postgame', note, re.I):
                    low = postgame
                if reward_at.get(row[0]) in at:
                    low = max(low, reward_at[row[0]])
                if m := re.search(r'(\d) Badges?', line):
                    low = max(low, badge_from[int(m[1])])
                pick = next((i for i in at if i >= low), at[0] if at else None)
                entry = [box['n'], row[0], line, row[2]]
                if pick is None:
                    NP.append(entry)
                else:
                    stop(order[pick])['it'].append(entry)
                    counts[kind] += 1
    D['WK'] = {'splits': splits, 'np': NP}
    report('walkthrough: %d splits, %d stops (%d on the way), %d trainers, %d areas, %d item lines + %d shop lines placed, %d unplaced' %
           (len(splits), len(order), sum(1 for p in order if stop(p).get('x')), sum(len(stop(p)['tr']) for p in order),
            len(first_area), counts['found'], counts['shop'], len(NP)))
    for name in unplaced_areas:
        report('  walkthrough: area not placed:', name)
    for e in NP:
        report('  walkthrough: item not placed: %s, %s' % (e[1], e[2]))

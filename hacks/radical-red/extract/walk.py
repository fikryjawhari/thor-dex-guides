"""WK for Radical Red 4.1 Hardcore: no walkthrough doc exists, so ROUTE is the play order worked out from the Trainer
Order sheet's row order and the user's rulings (notes.md → Walkthrough).

ROUTE (route.py, shared with trainers.py) holds the stops. In a stop with an empty trainers field each place's mini
bosses (Trainer Order entries) come before its ordinary trainers, a gym's trainers before its leader, the cap boss last.
Pickups (items.PICKUPS, by data.js area and cap step) go to the stop at their area in their own split, else the last
one in the split before (a boss's reward is the next step's bucket), else the first later one; the rest are WK.np.
"""
import collections

from common import DATA, report
import items
import trainers
from route import ROUTE, route   # noqa: F401 (check.py reads walk.route)

STATS = {}

# pickups with no data.js area (items.PICKUPS area None): item -> stop key
NO_AREA = {
    'Time Changer': 'pallet-postgame',
    'Poké Vial': 'viridian-city',
    'DexNav': 'route-2',
    'Infinite Repel': 'viridian-forest',
    'Safety Goggles': 'rock-tunnel',
    'Red Card': 'celadon-gym',
    'Waterium Z': 'saffron-gian',
    'Protective Pads': 'saffron-dojo',
}


def build(data):
    groups = data['TR']['g']
    assert len(groups) == 18, 'walk: expected the 18 Hardcore boxes'
    areas = DATA['areas']
    ar_of = {}
    for index, place in enumerate(data['AR']):
        for loc in place['l']:
            ar_of.setdefault(loc, index)
    gift = next(index for index, place in enumerate(data['AR']) if place['n'] == 'Mystery Gift')
    splits = [dict(n=group['n'], st=[]) for group in groups]
    stops, order = {}, []
    cards = [{} for _ in groups]                 # split -> trainer id -> card
    for split, group in enumerate(groups):
        for section in group['sec']:
            for card in section['tr']:
                cards[split][str(card['id'])] = card
    claimed = [set() for _ in groups]
    box = [{i: n for n, i in enumerate(c)} for c in cards]
    seen = [{} for _ in groups]
    for split in range(len(groups)):
        for i, card in cards[split].items():
            seen[split].setdefault(card['loc'], len(seen[split]))
    to_pos, enders = trainers.STATS['to_pos'], trainers.STATS['enders']

    def fight_order(split, i):
        """A place's mini bosses (Trainer Order entries, in its row order) gate its ordinary trainers: they come first,
        except in a gym (its trainers first, the mini boss gym trainers, then the leader, as the box has them); the
        split's cap boss last."""
        loc = cards[split][i]['loc']
        mini = i in to_pos
        rank = (1 if mini else 0) if 'Gym' in loc else (0 if mini else 1)
        return (i in enders, seen[split][loc], rank, to_pos.get(i, 0), box[split][i])
    plan = route()
    for split, key, places, ids, steps, name in plan:
        if ids:
            assert all(i in cards[split] for i in ids), (key, [i for i in ids if i not in cards[split]])
            assert not claimed[split] & set(ids), ('walk: trainer listed twice', key)
            claimed[split].update(ids)
    for split, key, places, ids, steps, name in plan:
        assert key not in stops, 'walk: two stops keyed ' + key
        if ids is None:
            names = {areas[a]['name'] for a in places}
            ids = sorted((i for i, card in cards[split].items() if card['loc'] in names and i not in claimed[split]),
                         key=lambda i: fight_order(split, i))
            claimed[split].update(ids)
        a = []
        for place in places:
            if ar_of[place] not in a:
                a.append(ar_of[place])
        if key == 'mystery-gift':
            a = [gift]
        stop = dict(k=key, n=name or data['AR'][ar_of[places[0]]]['n'], a=a, s=[[s, ''] for s in steps], it=[],
                    tr=[cards[split][i]['k'] for i in ids])
        stops[key] = stop
        order.append((split, key, places))
        splits[split]['st'].append(stop)
    unplaced = [(split, i, card['n'], card['loc']) for split in range(len(groups))
                for i, card in cards[split].items() if i not in claimed[split]]
    assert not unplaced, 'walk: trainer cards with no stop: %s' % unplaced

    # pickups: own split, else the split before (boss rewards), else the first later visit
    by_area = collections.defaultdict(list)
    for split, key, places in order:
        for place in places:
            by_area[place].append((split, key))
    np, how, later_rows = [], collections.Counter(), []
    for pickup in items.PICKUPS:
        row = [pickup['box'], pickup['item'], pickup['line'], None]
        if pickup['area'] is None:
            stops[NO_AREA[pickup['item']]]['it'].append(row)
            how['by item'] += 1
            continue
        visits, step = by_area.get(pickup['area'], []), pickup['step']
        same = [key for split, key in visits if split == step]
        before = [key for split, key in visits if split == step - 1]
        later = [key for split, key in visits if split > step]
        target = (same and same[0]) or (before and before[-1]) or (later and later[0])
        if target:
            stops[target]['it'].append(row)
            how['own split' if same else 'split before' if before else 'later visit'] += 1
            if not same and not before:
                later_rows.append('%s (%s, step %s) -> %s' % (pickup['item'], areas[pickup['area']]['name'], step, target))
        else:
            np.append(row)
            how['np'] += 1
            report('walkthrough: pickup with no stop: %s (%s, step %s)' % (pickup['item'], areas[pickup['area']]['name'], step))
    data['WK'] = dict(splits=splits, np=np)
    placed = set(a for split, key, places in order for a in places)
    loose = [a for a in range(len(areas)) if a not in placed]
    STATS.update(splits=len(splits), stops=len(stops), steps=sum(len(stop['s']) for stop in stops.values()),
                 trainers=sum(len(stop['tr']) for stop in stops.values()), pickups=len(items.PICKUPS),
                 placed=len(items.PICKUPS) - len(np), np=len(np))
    report('walkthrough:', ', '.join('%s %d' % pair for pair in STATS.items()))
    report('walkthrough: pickups placed by', ', '.join('%s %d' % pair for pair in sorted(how.items())))
    report('walkthrough: pickups at a later visit:', '; '.join(later_rows))
    report('walkthrough: data.js areas in no stop:', ', '.join('%d %s' % (a, areas[a]['name']) for a in loose) or 'none')

"""WK for Radical Red 4.1 Hardcore: no walkthrough doc exists, so ROUTE is the play order worked out from the Trainer
Order sheet and data.js (plans/radical-red-walk.md section 2, then the user's answers; notes.md → Walkthrough).

ROUTE, one stop per line: split | key | data.js areas | trainers | steps (^) | [name]
    split     the Hardcore cap step (0 Pre-Brock ... 17 Post Game) = the Trainers box the stop's fights are in
    key       the stop key (saved ticks and open state): explicit and semantic, never a position; never change one
    areas     data.js area indexes (LOC index): the stop's tracker areas (AR, so its encounters), its item pickups
              and the trainer places it may hold; the first one names the stop unless [name] is given
    trainers  data.js trainer ids in fight order, or empty = every card of this split whose place is one of the
              stop's areas and no other stop of the split lists (box order); '-' = none
Pickups (items.PICKUPS, by data.js area and cap step) go to the stop at their area in their own split, else the last
one in the split before (a boss's reward is the next step's bucket), else the first later one; the rest are WK.np.
"""
import collections

from common import DATA, report
import items

STATS = {}

ROUTE = """
0|pallet-town|1,0,2,3||Choose your starter in Oak's Lab and battle Blue.
0|route-1|4|-|
0|viridian-city|5,6,7,8||Take Oak's Parcel from the Poké Mart back to Oak, then head north.
0|route-22-early|10||
0|route-2|11|-|
0|viridian-forest|12|44 4 532 103 102|
0|viridian-forest-heart|13||
0|viridian-forest-exit|12|104|
0|pewter-city|15,16,17,18||
0|pewter-gym|19||
1|route-3|20||
1|route-4-west|21,22|-|Route 4 west of the ledge.
1|mt-moon|23,24,25||Beat Super Nerd Miguel on B2F and take one fossil: Helix or Dome.
2|route-4-east|21|-|
2|cerulean-city|26,27,28,30,31,29||Blue waits at the north end of the city.
2|route-24|32||
2|route-25|33,34||Help Bill in his house for the S.S. Ticket.
2|route-5|35,36,37,38||
2|route-6|39||
2|vermilion-city|40,41,42,43,44|-|
2|ss-anne-cabins|49,51,52,53,54,55,56,57,58,59,60,61,62,63,64,66,67,68,69,70,71||Board with the S.S. Ticket and clear the cabins.|S.S. Anne
2|diglett-cave|45,14,46|-|
2|route-11|47,48||
2|cerulean-gym|73||
3|cerulean-dig-house|26|355|Beat the Rocket Grunt behind the house he robbed.
3|route-6-jeff|39|146|
3|ss-anne|50,65,72||Get HM01 Cut from the Captain.
3|route-11-whitney|47|49|
3|route-2-cut|11,74|-|Cut through to the Route 2 gatehouse.
3|pewter-museum|17|-|
3|route-9|75||
3|route-10-north|76,77|156|
3|rock-tunnel|78,79||
3|route-10-south|76|188 187 157|
3|lavender-town|80,81,82||
3|pokemon-tower|83,84,85,86,87||Without the Silph Scope, turn back at the Ghost on 6F.
3|route-12-north|88,89||North pier: the Snorlax blocks the way south.
3|route-8|90,91||
3|route-7|92|-|
3|celadon-city|93,94,95,96,97,98,99,100,101,102,103|-|Get the Tea in Celadon Mansion: it opens the Saffron City gates.
3|route-16-north|104,105||
3|saffron-dojo|110,106,107,108,109|318 320 319 321||Saffron City
3|vermilion-gym|111||
4|route-25-bugsy|33|8|
4|route-9-picnickers|75|154 155|
4|rock-tunnel-dana|78|474|
4|route-10-herman|76|163|
4|lavender-morty|80|52|
4|route-8-aidan|90|171|
4|celadon-gym|112||
5|game-corner|113,118||Beat the Rocket Grunt by the poster to open the Rocket Hideout.
5|rocket-hideout|114,115,116,117||Get the Lift Key on B4F.
6|pokemon-tower-scope|83,84,85,86,87,119||Use the Silph Scope on the Ghost on 6F, then free Mr. Fuji on 7F.
6|lavender-flute|80|-|
6|silph-co|121,122,123,124,125,126,127,128,129,130,131||Get the Card Key on 5F.^Take the Lapras on 7F after Blue.^Archer and Ariana on 11F: a tag battle, Brendan with you.
7|silph-giovanni|131|349|
8|silph-president|131|-|Collect the Master Ball from the President on 11F.
8|saffron-mega-ring|106,133,134|-|
8|route-8-cole|90|18|
8|celadon-hotel|103|16 17|
8|lavender-gengarite|80|-|
8|saffron-chuck|110|317|
8|saffron-gym|135||
9|saffron-kid|132|25|
9|route-12-south|88,136|285 477 233 447|Wake the Snorlax with the Poké Flute.
9|route-13|137||
9|route-14|138||
9|route-15|139,140||
9|route-16|104,120||Wake the Snorlax by Route 16 and ride Cycling Road south.
9|route-17|141||
9|route-18|142,143||
9|fuchsia-city|144,151||
9|safari-zone|145,146,147,148,149,150|-|Take the Gold Teeth in Area 3.
9|fuchsia-warden|152,153|-|Give the Gold Teeth to the Warden.
9|route-19-beach|154||
9|pewter-gym-rematch|19|56|Beat at least 3 of the 4 gym rematches (Brock, Misty, Lt. Surge, Erika) before Koga.
9|route-2-rock-smash|11|-|
9|viridian-forest-heart-return|13|-|
9|mt-moon-return|25|-|
9|cerulean-gym-rematch|73|48|
9|vermilion-gym-rematch|111|51|
9|route-6-return|39|-|
9|rock-tunnel-return|79|-|
9|celadon-gym-rematch|112|65|Erika's rematch needs the Fuchsia Gloom errand done first.
9|celadon-return|93|-|
9|fuchsia-gym|155||
10|safari-moltres|156,146|-|
10|route-19|154||
10|route-20|158||
10|seafoam-islands|159,160,161,162,163|-|
10|route-21|169,9||
10|viridian-surf|5,10|-|
10|route-24-surf|32|-|
10|route-4-crissy|21|119|
10|route-10-surf|76|162|
10|power-plant|157||
10|vermilion-surf|40|-|
10|route-12-surf|88|-|
10|mansion-lewis|174|219|
10|cinnabar-may|170,164|61|
11|cinnabar-lab|165,166,167,168|62|Revive fossils in the Lab.
11|pokemon-mansion|171,172,173,174||Find the Secret Key on B1F: it opens the Gym.
11|cinnabar-gym|175||
12|cerulean-cave|176,177|73 72 71 70 67 68|
13|cerulean-cave-giovanni|178|69|
14|route-4-rewards|21|-|
14|cerulean-cave-ketchup|177|20 19|Ketchup gives a Kubfu after the first battle; the rematch, a day later, a second.
14|viridian-gym|179||
15|silph-b1f|180,181|-|
15|mansion-4f|182,183|454 455 218|
15|cinnabar-lab-return|165|-|
15|route-22|10|435 437 436|
15|route-23|184||
16|victory-road|185,186,187||
16|indigo-plateau|188,189||
16|pokemon-league|190,191,192,193,194||
17|pallet-postgame|3,0|200 210|
17|mystery-gift||-|Mystery Gifts open after the Hall of Fame.|Mystery Gift
17|route-16-fly-house|105|-|
17|one-island|195,200||Win 8 in a row at the Battle Simulator and Enamorus roams Kanto.
17|pokemon-tower-top|196,197||
17|magearna-chamber|198||
17|kyogre-chamber|199||
17|cerulean-gym-postgame|73||
17|saffron-gian|132||
17|viridian-gym-postgame|179||
17|cerulean-cave-mewtwo|178|-|Mewtwo waits on B1F.
17|treasure-beach|201||
17|kindle-road|202||
17|ember-spa|203|-|
17|mt-ember|204,205,206,207,208,209||
17|two-island|210,211,212||
17|cape-brink|213,214||
17|three-island|217,215,216,218||
17|bond-bridge|219||
17|berry-forest|220||
"""

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


def route():
    """ROUTE as [(split, key, areas, trainers or None = auto, steps, name)]."""
    out = []
    for line in ROUTE.strip().splitlines():
        fields = line.split('|') + [''] * 2
        split, key, areas, trainers, steps, name = fields[:6]
        out.append((int(split), key, [int(a) for a in areas.split(',') if a],
                    None if not trainers else [] if trainers == '-' else trainers.split(),
                    [s for s in steps.split('^') if s], name))
    return out


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
            ids = [i for i, card in cards[split].items() if card['loc'] in names and i not in claimed[split]]
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

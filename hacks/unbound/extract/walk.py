"""WK: wiki parts 1-40, the Expert cap boxes, and all 84 indexed missions.

ROUTE is a concise action outline audited against each part's Quick Guide and headings.
Part numbers identify source pages, not array positions. Visit and mission child keys are
explicit semantic identities; changing wording or insertion order never changes them.
Locations items keep their source page and access notes. Mission rewards use items.canon.
"""
import collections
import re

from common import WIKI, report
from wiki import key, text
import items

STATS = {}

ROUTE = """
1|0|Starter|starter|Choose Gible, Beldum, or Larvitar; escape the Shadow Base.
1|0|Frozen Heights|frozen-heights|Battle your rival.^Visit Professor Log and accept his errand.
1|0|Route 1|route-1|Head south across Route 1 to Bellin Town.
1|0|Bellin Town|bellin-town|Pick up Professor Log's package at the Mart.
1|0|Frozen Heights|package|Return the package to Professor Log.^Confront the Shadow Grunts and get the Pokédex.
2|0|Icicle Cave|icicle-cave|Learn to catch Pokémon.^Descend from 4F through the ice cave; confront the food thief.^Battle your rival on the lower floors and leave for Route 2.
2|0|Route 2|route-2|Cross Route 2 and complete the Challenge Road.^Continue to Dresco Town.
3|0|Dresco Town|dresco-town|Visit the Trainer House and explore the houses.^Get the Zygarde Cube from the scientists in the western house.
3|0|Route 3|route-3|Explore Route 3 before returning to Dresco Gym.
3|0|Flower Paradise|flower-paradise|Explore the flower fields north of Route 3.
4|0|Dresco Town|dresco-gym|Clear Dresco Gym and defeat Mirskle for the Leaf Badge.
4|1|Dresco Town|logs-friend|Meet Professor Log's friend after the gym.
4|1|Grim Woods|grim-woods|Cross Grim Woods to Route 4.
4|1|Route 4|route-4-east|Explore eastern Route 4 and enter Cinder Volcano.
5|1|Cinder Volcano|cinder-volcano|Climb the eastern floors to the summit.^Descend the western floors; heal at Chansey.^Confront Marlon and the Shadow Grunt on 1F.
5|1|Route 4|route-4-west|Leave via western Route 4 and ride Lapras down to Route 5.
6|1|Route 5|route-5|Explore Route 5 and visit the Day Care.^Visit the Unova starter house; continue to Crater Town.
6|1|Crater Town|crater-town|Explore Crater Town and enter the KBT Expressway.
7|1|KBT Expressway|kbt-expressway|Try mining in the KBT Expressway.^Find the Black Emboar and battle James.
7|1|Crater Town|crater-gym|Solve the gym's sneaking puzzle.^Defeat Vega for the Vision Badge.
7|2|Crater Town|shadow-battles|Battle Ivory, then Zeph after the gym.^Get HM01 Cut and head for Valley Cave.
8|2|Valley Cave|valley-cave|Cross Valley Cave and emerge on Route 6.
8|2|Route 6|route-6|Explore Route 6 and continue east.
8|2|Route 7|route-7|Get the Old Rod and cross Route 7 to Frost Mountain.
9|2|Frost Mountain|frost-mountain|Explore 1F and battle your rival.^Climb to 2F and leave for Route 8.
9|2|Route 8|route-8|Cross Route 8 to Blizzard City.
9|2|Blizzard City|blizzard-city|Explore the houses and get the VS Seeker.^Find the missing boy; get HM06 Rock Smash.
10|2|Frozen Forest|frozen-forest|Solve the ice puzzle.^Confront the thief and rescue the stolen Ninetales.
10|2|Blizzard City|blizzard-gym|Clear Blizzard Gym; defeat Alice for the Wings Badge.
10|3|Blizzard City|rock-smash|Return through the KBT Expressway using Rock Smash.^Continue to Fallshore City.
11|3|Fallshore City|fallshore-city|Visit Mission HQ and get the Trainer Catalogue.^Explore the market, Evolution House, and beach.^Try the Inverse Battle House.
11|3|Route 11|route-11|Cross lower Route 11 to Epidimy Town.
12|3|Epidimy Town|epidimy-town|Get HM04 Strength and the Good Rod.^Strength needs the Fall Badge before field use.
12|3|Cinder Volcano|alexa|Optional: return to Cinder Volcano 2F and challenge Ace Trainer Alexa.
12|3|Route 10|route-10|Search Route 10 for the Terror Granbull.^Defeat Gruff and continue to Tehl Town.
13|3|Tehl Town / Underground Pass|tehl-town|Explore Tehl Town and get the Dowsing Machine.^Pass through the Underground Pass to Route 9.
13|3|Route 9|route-9|Investigate the barrier and confront Ivory with your partner.^Defeat the Shadow Warrior and find the Fallshore Gym Leader.
14|3|Fallshore City|fallshore-gym|Solve Fallshore Gym's bridge puzzle.^Defeat Mel for the Fall Badge and Strength permission.^Get HM02 Fly; return to Epidimy Town.
15|4|Thundercap Mountain|thundercap-mountain|Climb from 1F through the main chambers to 5F.^Free the captured Pokémon.^Defeat Marlon at Zapdos; explore the Tablet and Electivire chambers.
15|4|Epidimy Town|epidimy-return|Return to Epidimy Town and follow the story toward Cliff Cave.
16|4|Cliff Cave|cliff-cave|Climb Cliff Cave to upper Route 11 and Tarmigan Town.
16|4|Cinder Volcano|mega-yale|Optional: challenge Mega Trainer Yale on Cinder Volcano 3F.
16|4|Tarmigan Town|tarmigan-town|Visit Tarmigan Town and the Dream Research Lab.
16|4|Tarmigan Mansion|tarmigan-mansion|Clear the mansion and defeat Successor Maxima.^Get Mega Evolution, then leave for Route 12.
17|5|Route 12|route-12|Battle your rival and get HM03 Surf.^Cross Route 12 to Dehara City; Surf permission comes after Galavan.
17|5|Dehara City|dehara-city|Explore Dehara City, its houses, and Cloud Game Corner.
17|5|Dehara City|department-store|Visit the Department Store and challenge the Double Battle House.
18|5|Ruins of Void|ruins-of-void|Enter the ruins and solve the B3F maze.^Defeat the guardians; solve the Hoopa puzzle.^Survive the portal and ritual challenges.^Escape Cube Space and follow Marlon to Cinder Volcano.
19|5|Cinder Volcano Depths|cinder-depths|Descend through Cinder Volcano to B2F.^Battle Vega with Marlon, then survive Primal Groudon.
19|5|Shadow Base|shadow-base|Infiltrate the Shadow Base and descend to B3F.^Confront Zeph, then return to Dehara City.
20|5|Dehara City|dehara-gym|Solve Dehara Gym's switch puzzle.^Defeat Galavan for the Battery Badge and Surf permission.
20|5|Route 3|surf-route-3|Optional: Surf Route 3's beach to battle Fishermen Edgar, Jason, and Cole.
20|5|Grim Woods|surf-grim-woods|Optional: return to Grim Woods after the Battery Badge.
21|6|Route 13|route-13|Surf across Route 13 and defeat its trainers.^Begin the Ocean Master challenge.
21|6|Route 14|route-14|Explore Route 14 and defeat its trainers.^Return to the Ocean Master for the final battle.
21|6|Route 2|surf-route-2|Optional: Surf back to Route 2 and challenge Mega Trainers Vivian and Mathis.
22|6|Auburn Waterway|auburn-waterway|Surf through Auburn Waterway; help Hiker Finn on the northeast island.
22|6|Lost Tunnel|lost-tunnel|Use Dig with Finn and explore the Lost Tunnel.
23|6|Thundercap Mountain|thundercap-return|Return with Surf and solve the electric-fence puzzle.^Explore the maze chamber and guide the lost child outside.
24|6|Dehara City|go-goggles|Get the Go-Goggles before entering the Great Desert.
24|6|Great Desert|great-desert|Cross the Great Desert and locate the Tomb of Borrius.
24|6|Gurun Town|gurun-town|Explore Gurun Town and the Gurun KBT Expressway entrance.
25|6|Vivill Woods|vivill-woods|Cross Vivill Woods to the abandoned town.
25|6|Vivill Town|abandoned-vivill|Investigate the abandoned town and enter the warehouse.
25|6|Vivill Warehouse|vivill-warehouse|Defeat the Shadow Warrior at the entrance.^Find the password, unlock the door, and confront Aklove.
25|6|Dehara City|distortion-world|Escape the Distortion World's boulder puzzle.^Battle Giratina and return through Rift Cave.
26|6|Vivill Town|vivill-town|Explore the restored town; visit the move trainer and Pokémon Center.
26|6|Route 15|route-15|Explore Route 15 and try the Fighting Island challenge.
26|6|Route 16|route-16|Get the Devon Scope and reveal the hidden Kecleon.^Get HM08 Rock Climb from the workers; continue to Antisis.
27|6|Antisis City|antisis-city|Visit Black Emboar HQ and explore the city.
27|6|Antisis Port|antisis-port|Visit Antisis Port for the Black Emboar jobs.
28|6|Antisis Sewers|antisis-sewers|Use Flash and find the Grimy Socks.^Return to HQ before the final Black Emboar mission.
28|6|Ferrothorn Turf|ferrothorn-turf|Invade Ferrothorn Turf.^Solve the Electrode and sequence puzzles; defeat Barbs.
29|6|Antisis City|antisis-gym|Take the Ring Challenge and defeat Big Mo.^Get the Ring Badge and Rock Climb permission.
29|7|Icicle Cave|icicle-return|Use Rock Climb to explore Icicle Cave's lower floors.^Solve the two ice puzzles and descend to B1F.
29|7|Icy Hole|icy-hole|Explore Icy Hole and help the clown.
29|7|Route 10|rock-climb-route-10|Optional: challenge Mega Trainer Ernesto on Route 10.
29|7|Route 11|rock-climb-route-11|Optional: challenge Mega Trainer Timothy on Route 11.
29|7|Great Desert|rock-climb-desert|Optional: challenge Mega Trainer Travon in the Great Desert.
30|7|Thundercap Mountain|antisis-thundercap|Enter Thundercap Mountain from Antisis.^Explore the northwest chamber, solve the boulder puzzle, and climb the final ladder.^Challenge the Mountain Master and solve the tablet puzzle.
31|7|Route 17|route-17|Cross Route 17 and defeat its trainers.^Win the Sky Master challenge; continue to Seaport City.
31|7|Seaport City|seaport-city|Explore the houses, Breeder's School, marketplace, and docks.^Get the Super Rod and investigate the missing Skitty.
32|7|Seaport Warehouses|seaport-west|Enter the west warehouse and rescue the kidnapped landlord.^Defeat the kidnappers.
32|7|Seaport Warehouses|seaport-east|Enter the east warehouse and recover the stolen Electivire.^Defeat the Scientist after the Dynamax battle.
32|7|S.S. Marine|ss-marine|Sail from Seaport City to East Borrius.
33|7|Polder Town|polder-town|Explore Polder Town and investigate the TV problem.^Visit the Safari Zone and Rotom appliance room.
33|7|Polder Town|polder-gym|Solve Polder Gym's puzzle and defeat Tessy.^Get the Swamp Badge, HM07 Waterfall, and permission to use it.
33|8|Tehl Town / Underground Pass|seasonal-research|Optional: return to Tehl Town for seasonal research after reaching Polder.
34|8|Cootes Bog|cootes-bog|Cross Cootes Bog; help Tessy against the Terror Granbull.
34|8|Magnolia Town|magnolia-town|Detour to Magnolia Town; visit the café and Moomoo Farm.
35|8|Cootes Bog|crystal-approach|Battle your rival on the way to Crystal Peak.
35|8|Crystal Peak|crystal-peak|Solve the lower-floor rune puzzles and climb the exterior.^Defeat Zekrom and Reshiram, then Ivory.^Free Marlon and Melony on 4F.^Battle Hoopa and Mega Rayquaza; defeat Aklove.^Fight alongside your rival and get the Master Ball.
36|8|Magnolia Fields|magnolia-fields|Cross Magnolia Fields toward Redwood Village.^Find the grove and the Vivillon along the way.
36|8|Redwood Village|redwood-village|Explore the village and breeders' houses.
36|8|Redwood Village|redwood-gym|Solve Redwood Gym's time puzzle.^Defeat Benjamin for the Time Badge and League qualification.
37|9|Redwood Village|camomons|Optional: challenge the Camomons Battle House.
37|9|Route 18|route-18|Defeat Route 18's trainers and the Route Master.^Heal at the Victory Road Pokémon Center.
38|9|Victory Road|victory-road|Cross the lower caverns and solve the boulder puzzle.^Clear the hedge maze.^Climb the upper ascent and solve the final ice puzzle.^Challenge Sterling and Portia before leaving for the League.
39|9||pokemon-league|Prepare your team and challenge the Elite Four.^Defeat Moleman, Elias, Arabella, and Penny.^Defeat Champion Jax to enter the Hall of Fame.
39|10|Frozen Heights|postgame-log|Return to Frozen Heights after becoming Champion.
40|10|Seaport City|adm|Buy the ADM at Seaport Shipyard.
40|10|Ruins of Void|saving-mom|Dive into the submerged ruins with the ADM.^Pass the Claydol maze and defeat Dynamax Claydol.^Defeat Aklove for the final time and rescue your mother.^Unlock the Mission Location Tracker and New Game+.
postgame|10|Frozen Heights|frozen-heights|Visit Professor Log for portal hunting.
postgame|10|Crystal Peak|crystal-peak|Explore Crystal Peak's post-game passages.
postgame|10|Redwood Forest|redwood-forest|Explore Redwood Forest on the way to Cube Corp.
postgame|10|Cube Corp.|cube-corp|Visit Cube Corp. for the raid-den and daily-event missions.
postgame|10|Frost Mountain|frost-mountain|Challenge Experts Ryuzoji and Kenlawa on Frost Mountain 2F.
postgame|10|Route 5|day-care|Return to the Day Care and challenge Pokémon Breeder Annie.
postgame|10|Blizzard City|blizzard-city|Rematch Candice and finish the Piemaker's requests.
postgame|10|Fallshore City|mission-hq|
postgame|10|Dehara City|dehara-city|
postgame|10|Magnolia Town|magnolia-town|
postgame|10|Tehl Town / Underground Pass|tehl-town|
postgame|10|Tarmigan Town|tarmigan-town|
postgame|10|Gurun Town|gurun-town|
postgame|10|Great Desert|tomb-of-borrius|
postgame|10|Battle Frontier|battle-frontier|Enter the Battle Frontier from Seaport City.
postgame|10||title-defense|Return to the League for Title Defense challenges.
postgame|10|Seaport City|battleground|Challenge the Battleground's Classic Leaders Gauntlet.
postgame|10|Mystery Gift|mystery-gift|Redeem available Mystery Gift codes at the Pokémon Center.
"""

MISSION_STOPS = {
    1: 'part-1/frozen-heights', 2: 'part-17/dehara-city', 3: 'part-27/antisis-city',
    4: 'postgame/dehara-city', 5: 'part-11/fallshore-city', 6: 'part-33/polder-town',
    7: 'part-2/icicle-cave', 8: 'postgame/cube-corp', 9: 'part-31/seaport-city',
    10: 'part-24/gurun-town', 11: 'part-33/polder-town', 12: 'part-9/blizzard-city',
    13: 'part-3/dresco-town', 14: 'postgame/crystal-peak', 15: 'part-34/magnolia-town',
    16: 'postgame/mission-hq', 17: 'postgame/mission-hq', 18: 'part-3/dresco-town',
    19: 'part-13/tehl-town', 20: 'postgame/mission-hq', 21: 'part-6/route-5',
    22: 'part-33/polder-town', 23: 'part-31/seaport-city', 24: 'part-27/antisis-city',
    25: 'postgame/battleground', 26: 'part-33/polder-town', 27: 'postgame/mission-hq',
    28: 'postgame/magnolia-town', 29: 'part-37/route-18', 30: 'part-31/seaport-city',
    31: 'part-3/flower-paradise', 32: 'part-34/cootes-bog', 33: 'part-10/blizzard-gym',
    34: 'part-22/auburn-waterway', 35: 'part-9/blizzard-city', 36: 'part-6/route-5',
    37: 'part-34/magnolia-town', 38: 'part-6/crater-town', 39: 'part-31/seaport-city',
    40: 'postgame/battle-frontier', 41: 'part-1/frozen-heights', 42: 'part-11/fallshore-city',
    43: 'part-9/blizzard-city', 44: 'postgame/redwood-forest', 45: 'part-9/route-8',
    46: 'part-27/antisis-city', 47: 'part-35/crystal-peak', 48: 'part-31/seaport-city',
    49: 'postgame/mission-hq', 50: 'part-39/postgame-log', 51: 'part-34/cootes-bog',
    52: 'part-17/dehara-city', 53: 'part-33/seasonal-research', 54: 'part-40/adm',
    55: 'part-36/redwood-village', 56: 'postgame/tehl-town', 57: 'part-27/antisis-city',
    58: 'part-9/blizzard-city', 59: 'postgame/mission-hq', 60: 'part-28/ferrothorn-turf',
    61: 'part-6/crater-town', 62: 'part-1/package', 63: 'postgame/mission-hq',
    64: 'postgame/mission-hq', 65: 'postgame/cube-corp', 66: 'postgame/tarmigan-town',
    67: 'part-1/bellin-town', 68: 'part-36/magnolia-fields', 69: 'part-1/package',
    70: 'part-3/dresco-town', 71: 'part-15/thundercap-mountain', 72: 'postgame/dehara-city',
    73: 'part-11/fallshore-city', 74: 'postgame/mission-hq', 75: 'part-23/thundercap-return',
    76: 'postgame/tomb-of-borrius', 77: 'part-33/polder-town', 78: 'part-26/vivill-town',
    79: 'postgame/gurun-town', 80: 'part-9/blizzard-city', 81: 'part-24/great-desert',
    82: 'part-20/surf-grim-woods', 83: 'part-11/fallshore-city', 84: 'part-39/pokemon-league',
}


def _mission(mission):
    fields = mission['fields']
    slug = mission['page']['link'].rstrip('/').rsplit('/', 1)[-1]
    number = int(slug.rsplit('-', 1)[-1])
    reward = fields.get('Reward', '')
    for raw, quantity in items.mission_items(reward):
        reward = reward.replace(raw, items.canon(raw)[0])
    objective = fields['Objectives'].rstrip('.') + '.'
    children = [dict(k='accept', t='Speak to the mission giver.', n=fields['Start Location']),
                dict(k='objective', t=objective),
                dict(k='reward', t='Return to the mission giver and collect the reward.')]
    return number, dict(m=slug, n=mission['name'].split(': ', 1)[1],
                        u=fields.get('Unlock Requirements', 'Reach ' + fields['Start Location'] + '.'),
                        r=reward, s=children)


def build(data):
    parts = WIKI.walkthrough_parts()
    assert [number for number, page in parts] == list(range(1, 41)), 'wiki walkthrough parts changed'
    splits = [dict(n=group['n'], st=[]) for group in data['TR']['g']]
    stops = {}
    visits = collections.defaultdict(list)
    area_ids = {area['n']: index for index, area in enumerate(data['AR'])}
    for line in ROUTE.strip().splitlines():
        part, split, area, visit, actions = line.split('|')
        stop_key = ('part-' + part if part.isdigit() else part) + '/' + visit
        assert stop_key not in stops
        name = area or ('Pokémon League' if visit == 'pokemon-league' else 'Title Defense')
        if visit == 'department-store':
            name = 'Dehara Department Store and Double Battle House'
        elif visit == 'distortion-world':
            name = 'Distortion World and Rift Cave'
        elif visit == 'mission-hq':
            name = 'Fallshore Mission HQ — post-game'
        elif visit == 'title-defense':
            name = 'Title Defense'
        elif visit == 'battleground':
            name = 'Battleground'
        stop = dict(k=stop_key, n=name, a=[area_ids[area]] if area else [],
                    s=[[action, ''] for action in actions.split('^') if action], it=[], tr=[])
        stops[stop_key] = stop
        visits[area].append((int(split), visit, stop))
        splits[int(split)]['st'].append(stop)
    for place, name, box, line in items.PLACED:
        assert place in visits, 'Locations items have no walkthrough stop: ' + place
        visits[place][0][2]['it'].append([box, name, line, None])
    for split_index, group in enumerate(data['TR']['g']):
        for section_index, section in enumerate(group['sec']):
            place = section['h']
            canonical = {'Thundercap Mt.': 'Thundercap Mountain', 'Day Care': 'Route 5',
                         'Dehara Department Store': 'Dehara City', 'Distortion World': 'Dehara City',
                         'Title Defense': '', 'Battleground': 'Seaport City'}.get(place, place)
            if 'League' in place:
                canonical = ''
            candidates = [stop for index, visit, stop in visits[canonical] if index == split_index]
            special = {
                (5, 'Dehara Department Store'): 'part-17/department-store',
                (5, 'Cinder Volcano'): 'part-19/cinder-depths',
                (6, 'Distortion World'): 'part-25/distortion-world',
                (10, 'Title Defense'): 'postgame/title-defense',
                (10, 'Battleground'): 'postgame/battleground',
            }.get((split_index, place))
            if split_index == 5 and place == 'Cinder Volcano':
                candidates = [stops[special]]
            elif special:
                candidates = [stops[special]]
            assert candidates, 'Trainer section has no stop: ' + group['n'] + ' / ' + place
            for trainer in section['tr']:
                target = candidates[0]
                if 'Leader ' in trainer['n'] or trainer['n'] == 'Successor Maxima':
                    target = candidates[-1]
                if split_index == 6 and place == 'Antisis City':
                    if 'Barbs' in trainer['n']:
                        target = stops['part-28/ferrothorn-turf']
                    elif 'Big Mo' in trainer['n']:
                        target = stops['part-29/antisis-gym']
                if trainer['n'] == 'Skier Charlie':
                    target = stops['part-30/antisis-thundercap']
                target['tr'].append(trainer['k'])
    missions = [_mission(mission) for mission in WIKI.item_missions()]
    index = WIKI.mission_index()
    first = next(row for row in index if row[0].startswith('#001:'))
    missions.append((1, dict(m='mission-001', n=first[0].split(': ', 1)[1], u='None.', r=first[-1], s=[
        dict(k='accept', t="Accept Professor Log's errand in Frozen Heights."),
        dict(k='light-of-ruin', t='Defeat the Light of Ruin and stop the Ultimate Weapon.'),
        dict(k='champion', t='Defeat the Pokémon League and become Champion.'),
    ])))
    for number, mission in sorted(missions):
        stops[MISSION_STOPS[number]]['s'].append(mission)
    data['WK'] = dict(splits=splits, np=[])
    STATS.update(parts=len(parts), splits=len(splits), stops=len(stops),
                 steps=sum(isinstance(step, list) for stop in stops.values() for step in stop['s']),
                 missions=len(missions), children=sum(len(mission['s']) for number, mission in missions),
                 items=len(items.PLACED), trainers=sum(len(stop['tr']) for stop in stops.values()))
    report('walkthrough:', ', '.join('%s %d' % pair for pair in STATS.items()))

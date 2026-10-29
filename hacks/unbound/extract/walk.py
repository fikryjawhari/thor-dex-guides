"""WK: wiki parts 1-40, the Expert cap boxes, and all 84 indexed missions.

ROUTE is a concise action outline audited against each part's Quick Guide and headings.
Part numbers identify source pages, not array positions. Visit and mission child keys are
explicit semantic identities; changing wording or insertion order never changes them.
Locations items keep their source page and access notes. Mission rewards use items.canon.
"""
import collections
import re

from common import WIKI, report
from wiki import key, _rows
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
10|3|Cinder Volcano|alexa|Optional: return to Cinder Volcano 2F and challenge Ace Trainer Alexa.
11|3|Fallshore City|fallshore-city|Visit Mission HQ and get the Trainer Catalogue.^Explore the market, Evolution House, and beach.^Try the Inverse Battle House.
11|3|Route 11|route-11|Cross lower Route 11 to Epidimy Town.
12|3|Epidimy Town|epidimy-town|Get HM04 Strength and the Good Rod.^Strength needs the Fall Badge before field use.
12|3|Route 10|route-10|Search Route 10 for the Terror Granbull.^Defeat Gruff and continue to Tehl Town.
13|3|Tehl Town / Underground Pass|tehl-town|Explore Tehl Town and get the Dowsing Machine.^Pass through the Underground Pass to Route 9.
13|3|Route 9|route-9|Investigate the barrier and confront Ivory with your partner.^Defeat the Shadow Warrior and find the Fallshore Gym Leader.
14|3|Fallshore City|fallshore-gym|Solve Fallshore Gym's bridge puzzle.^Defeat Mel for the Fall Badge and Strength permission.^Get HM02 Fly; return to Epidimy Town.
14|4|Cinder Volcano|mega-yale|Optional: use Strength to reach Mega Trainer Yale on Cinder Volcano 3F.
15|4|Thundercap Mountain|thundercap-mountain|Climb from 1F through the main chambers to 5F.^Free the captured Pokémon.^Defeat Marlon at Zapdos; explore the Tablet and Electivire chambers.
15|4|Epidimy Town|epidimy-return|Return to Epidimy Town and follow the story toward Cliff Cave.
16|4|Cliff Cave|cliff-cave|Climb Cliff Cave to upper Route 11 and Tarmigan Town.
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
26|6|Route 2|surf-route-2|Surf west from Route 15 to Route 2's Fighting Challenge Island.^Defeat Hiker Franklin and challenge Mega Trainers Vivian and Mathis.
26|6|Route 16|route-16|Get the Devon Scope and reveal the hidden Kecleon.^Get HM08 Rock Climb from the workers; continue to Antisis.
27|6|Antisis City|antisis-city|Visit Black Emboar HQ and explore the city.
27|6|Antisis Port|antisis-port|Visit Antisis Port for the Black Emboar jobs.
28|6|Antisis Sewers|antisis-sewers|Use Flash and find the Grimy Socks.^Return to HQ before the final Black Emboar mission.
28|6|Antisis City|antisis-hq|Return the Grimy Socks and speak to James at HQ.
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
33|7|Tehl Town / Underground Pass|seasonal-research|Optional: return to Tehl Town for seasonal research after reaching Polder.
33|7|Polder Town|polder-gym|Solve Polder Gym's puzzle and defeat Tessy.^Get the Swamp Badge, HM07 Waterfall, and permission to use it.
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
postgame|10|Crater Town|crater-town|
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
    37: 'part-34/magnolia-town', 38: 'postgame/crater-town', 39: 'part-31/seaport-city',
    40: 'postgame/battle-frontier', 41: 'part-1/frozen-heights', 42: 'part-11/fallshore-city',
    43: 'part-9/blizzard-city', 44: 'postgame/redwood-forest', 45: 'part-9/route-8',
    46: 'part-27/antisis-city', 47: 'postgame/crystal-peak', 48: 'part-31/seaport-city',
    49: 'postgame/mission-hq', 50: 'part-39/postgame-log', 51: 'part-34/cootes-bog',
    52: 'part-17/dehara-city', 53: 'part-33/seasonal-research', 54: 'part-40/adm',
    55: 'part-36/redwood-village', 56: 'postgame/tehl-town', 57: 'part-27/antisis-city',
    58: 'part-9/blizzard-city', 59: 'postgame/mission-hq', 60: 'part-28/antisis-hq',
    61: 'part-6/crater-town', 62: 'part-1/package', 63: 'postgame/mission-hq',
    64: 'postgame/mission-hq', 65: 'postgame/cube-corp', 66: 'postgame/tarmigan-town',
    67: 'part-1/bellin-town', 68: 'part-36/magnolia-fields', 69: 'part-1/package',
    70: 'part-3/dresco-town', 71: 'part-15/thundercap-mountain', 72: 'postgame/dehara-city',
    73: 'part-11/fallshore-city', 74: 'postgame/mission-hq', 75: 'part-23/thundercap-return',
    76: 'postgame/tomb-of-borrius', 77: 'part-33/polder-town', 78: 'part-26/vivill-town',
    79: 'postgame/gurun-town', 80: 'part-9/blizzard-city', 81: 'part-24/great-desert',
    82: 'part-20/surf-grim-woods', 83: 'part-11/fallshore-city', 84: 'part-39/pokemon-league',
}

MISSION_ACTIONS = {
    3: "street-battle|Meet the goon upstairs near the staircase and win the street battle.\n"
       "double-battle|Defeat Rory and Chad in the Double Battle.\n"
       "return-hq|Return to Black Emboar HQ for the Power Bracer.",
    4: "rift-cave|Enter Rift Cave from Dehara City and find the missing girl.\n"
       "palkia|Defeat Dynamax Palkia and rescue the girl.\n"
       "return-father|Return to her father for the Lustrous Orb.",
    5: "beach|Find the girl in the middle of Fallshore Beach.\n"
       "market|Report back, then find her at the top-left of Fallshore Market.\n"
       "evolution-house|Report back, then find her in front of the Evolution House.\n"
       "northeast-city|Report back, then find her in the city's northeast corner.\n"
       "mission-hq|Find her outside Mission HQ and reunite her with her mother.",
    7: "braille|Follow the Sandslash's tunnel on Icicle Cave 4F; get the Braille Converter.\n"
       "tablet-icicle|Push the ledge boulder onto its switch in Icicle Cave.|Strength, Rock Smash, Rock Climb.\n"
       "tablet-cinder|Push Cinder Volcano 2F's western boulder north and east onto the switch.|Strength.\n"
       "tablet-valley|Lead with a Bug type; press the button hidden in the rock near the Ranger.|Rock Climb.\n"
       "tablet-frost|Sneak up behind the turning Aggron on Frost Mountain 1F.|Rock Climb.\n"
       "tablet-thundercap|Drop the Electivire Chamber boulder into its hole, then solve the northwest 3F boulder switch.|Surf, Strength, Rock Smash, Rock Climb.\n"
       "tablet-ruins|Dive into the Ruins of Void and activate the three maze switches without being spotted.|Champion; ADM.\n"
       "tablet-crystal|Lower all three crystal colors; stand between the four dots in the newly opened chamber.|Champion.\n"
       "tablet-victory|Push boulders onto the northwest, northeast, southeast, southwest, then center buttons.|Champion; Surf with a Fire type or ADM.\n"
       "tablet-underwater|Dive through the eastern seaweed passages and defeat Dynamax Toxapex.|Champion; ADM.\n"
       "report-tablets|Return to the Ruin Maniac after opening all nine dens.",
    10: "hard-stones|Collect 20 Hard Stones; bring them to the Rancher for TM111 Smack Down.",
    12: "route-8-boy|Find the Pikachu-costumed boy on Route 8.\n"
        "reunite|Return him to his mother in Blizzard City for TM27 Return.",
    14: "totems|Activate all three totems in Crystal Peak B1F; accept the Kindler's request.\n"
        "kindler-west|Collect the Emerald in the western fork near the Kindler.\n"
        "main-floor|Leave only blue crystals; collect the Emerald on the 1F main chamber floor.\n"
        "east-orange|Activate only the yellow totem; climb the southeast orange wall to the Emerald chamber.\n"
        "west-orange|Climb the southwest orange wall and collect the ledge Emerald.\n"
        "waterfall|Activate the orange and yellow totems, then the southern blue totem; collect the waterfall Emerald.\n"
        "krystal|Collect the Emerald beside Route Master Krystal in the western chamber.\n"
        "cube-exit|Restore blue crystals and reach the Cube Corp. exit; collect the Emerald by the exit with orange crystals present.\n"
        "cube-corner|Enter from Cube Corp. after removing blue crystals; collect the Emerald formerly covered by them.\n"
        "upper-west|Restore all colors, climb outside to 2F, then activate the 3F orange totem; collect the western 2F Emerald.\n"
        "upper-north|Activate the 2F yellow totem by the Youngster; collect the last Emerald to the north.\n"
        "kindler|Give the Emeralds to the B1F Kindler for the Jade Orb.",
    24: "flash|Enter the Antisis Sewers from HQ and use Flash.\n"
        "socks|Find the Grimy Socks in the south sewer section.\n"
        "return-socks|Return to the goon beside HQ's downstairs TV for Black Sludge.",
    25: "gauntlet|Defeat all eight Classic Leaders in one Battleground Gauntlet.\n"
        "victini|Speak to the Picnicker and encounter Victini.",
    27: "cave-of-being|Meet the researcher in the Cave of Being on Route 10; release the Lake Trio.|Surf, Waterfall, Rock Climb.\n"
        "uxie|Catch Uxie outside Tarmigan Town's Dream Research Lab.\n"
        "mesprit|Catch Mesprit inside Shadow Base B3F.\n"
        "azelf|Catch Azelf on the hill north of Route 18's Pokémon Center.\n"
        "researcher|Bring all three Lake Pokémon to the Cave of Being; collect the Adamant Orb.\n"
        "dialga|Catch Dialga when it appears in the center of the cave.",
    28: "miltank|Find the Terror Granbull who kidnapped the Miltank.\n"
        "rescue|Defeat the goons and return the Miltank to Moomoo Ranch.",
    29: "monotype-league|Register a Hall of Fame clear for each of the 18 single-type teams.\n"
        "cameraman|Report to the Route 18 cameraman for the rewards.",
    30: "epidimy-hobo|Speak to the homeless man near Epidimy Town's Pokémon Center after reaching Seaport.\n"
        "seaport-landlord|Speak to the woman looking for her landlord in Seaport City.\n"
        "west-warehouse|Rescue the landlord from the west warehouse; defeat Swizer and Bullo.\n"
        "new-home|Arrange the old man's new home and collect Icium Z.",
    31: "honey|Collect 3 Honey from Combee and give them to the Flower Paradise woman.",
    33: "pretty-wings|Collect 20 Pretty Wings from Wingull or Pelipper; return to Alice.",
    34: "dig|Bring a Pokémon with Dig to Hiker Finn's northeast island.\n"
        "lost-tunnel|Follow Finn into the Lost Tunnel and finish exploring with him.",
    35: "ingredients|Bring 3 Rawst Berries, 5 Belue Berries, 5 Watmel Berries, and 5 Moomoo Milks to the Piemaker.",
    37: "hanky|Pick up the Grubby Hanky at Magnolia Café on Saturday.\n"
        "friday-owner|Return it to the rich boy at the same table on Friday for Lycanium Z.",
    38: "adm-mining|Use the ADM to mine in the KBT Expressway.\n"
        "carbink|Catch three Carbink from the mining tunnels and show the Ruin Maniac.",
    41: "antidote|Buy an Antidote at Bellin Town's Mart.\n"
        "deliver|Give it to the old man in Frozen Heights' southeast house.",
    43: "forest-thief|Follow the thief into Frozen Forest and solve the ice puzzle.\n"
        "ninetales|Free the stolen Alolan Ninetales.\n"
        "crabominable|Defeat the Crabominable on the way back.\n"
        "return-owner|Return to the owner in Blizzard City for the Alolan Vulpix Egg.",
    46: "port|Meet the goon at Antisis Port and help move the shipment.\n"
        "guards|Defeat the Black Ferrothorn guarding the smuggling route.\n"
        "return-hq|Return to HQ and collect Dream Mist.",
    47: "southwest-cliffs|Find the girl and Drifloon at the exterior's southwest corner.\n"
        "northeast-entrance|Find them south of the Crystal Peak 2F entrance.\n"
        "north-dead-end|Find them at the northern dead end via the northwest platform.\n"
        "crystal-intersection|Find them west of the 1F entrance at the first crystal intersection.\n"
        "mother|Return to the mother outside the 1F entrance.",
    48: "pyukumuku|Show the woman a Pyukumuku.\n"
        "probopass|Then show her a Probopass for the Balm Mushrooms.",
    51: "tessy|Meet Tessy at the Cootes Bog entrance after recovering Electivire.\n"
        "granbull|Defeat the Terror Granbull together.\n"
        "feraligatr|Defeat Dynamax Feraligatr and reunite Tessy with her Pokémon.",
    52: "beach|Throw every Pyukumuku on Dehara Beach back into the sea.\n"
        "fisherman|Return to the upstairs fisherman for the Power Band.",
    53: "spring|Show the rightmost scientist a Spring Sawsbuck.\n"
        "summer|Show him a Summer Sawsbuck.\n"
        "autumn|Show him an Autumn Sawsbuck.\n"
        "winter|Show him a Winter Sawsbuck to unlock free Nature changes.",
    54: "dive-route-17|Use the ADM to dive off Route 17.\n"
        "sharpedo|Defeat 20 Sharpedo on the sea floor.\n"
        "mega-sharpedo|Defeat Mega Sharpedo; report to the policeman for Sharpedonite.",
    55: "magikarp-box|Catch 30 Magikarp and put all 30 in one PC Box.\n"
        "show-box|Show the Redwood Village fisherman for a shiny Magikarp.",
    56: "regigigas|Capture Regigigas after exploring the Tomb of Borrius.\n"
        "worker|Show it to Tehl Town's Worker to unlock Amulet Coin upgrades.",
    57: "scientist-house|Enter the Scientist's house beside the Antisis Pokémon Center.\n"
        "electrode-floor|Cross the trapped floor.|West 2, north 1, west 1, north 2, east 1, north 1, east 5, south 3, west 1.\n"
        "scientist|Defeat the Scientist and her Electrode.\n"
        "enhancers|Take the enhancers from the windowsill; return to HQ with a free party slot.",
    58: "ingredients|Give the Piemaker 1 Pecha Berry, 1 Qualot Berry, and 1 Fresh Water.",
    59: "virizion|Follow Virizion through Victory Road's hedge maze: central grass, northeast, northwest, then entrance.\n"
        "terrakion|Follow Terrakion around 3F: entry dead end, east, southwest, then northwest exit.\n"
        "cobalion|Follow Cobalion outside: Kyurem's Cave, southwest, northeast grassy cliff, then central rocks.\n"
        "catch-swords|Catch all three at the central rock on 3F; do not disturb Virizion there before all three arrive.\n"
        "report|Bring the three to the Black Belt in Fallshore Mission HQ.\n"
        "keldeo|Meet him on the secluded beach at Route 17's middle island; open Keldeo's cave and receive 10 Fast Balls.",
    60: "sewer-breach|Follow James from HQ into the south sewer section and through the breach.\n"
        "electrode-lower|Cross the Electrode floor on Ferrothorn Turf 2F.\n"
        "sequence-lower|Solve the 3F sequence puzzle.\n"
        "electrode-upper|Cross the 4F Electrode floor and solve its sequence puzzle.\n"
        "sequence-top|Solve the 5F sequence puzzle.\n"
        "barbs|Defeat Black Ferrothorn Boss Barbs.\n"
        "james|Return to James for Heracronite.",
    61: "brother|Speak to the man in Crater Town's southwest house.\n"
        "kbt-goons|Find his brother and the Black Emboar in the KBT Expressway.\n"
        "james|Defeat Black Emboar James.\n"
        "motorcycle|Return to the brother for TM98 Work Up and the Motorcycle.",
    66: "dream-lab|Ask the scientist near Munna in Tarmigan's Dream Research Lab to help the boy.\n"
        "fullmoon|Meet Eldon at Fallshore's dock and sail to Fullmoon Island.\n"
        "cresselia|Defeat and catch Dynamax Cresselia; take the Lunar Wing.\n"
        "lunar-wing|Return to Tarmigan and give the Lunar Wing to the boy.\n"
        "nightmare|Follow the visions of your mother, Jax, Log, your rival, Marlon, the boy, and Eldon.\n"
        "darkrai-dynamax|Defeat Dynamax Darkrai to wake up.\n"
        "member-card|Take Eldon's Member Card and enter Tarmigan Inn to capture Darkrai.",
    67: "sandslash|Follow the Alolan Sandslash from Bellin Town into Icicle Cave.\n"
        "food-thief|Confront it in the side cavern.\n"
        "return-owner|Return to the Bellin Town house for TM56 Hone Claws.",
    70: "zygarde-cube|Get the Zygarde Cube from the scientist couple.\n"
        "cells|Collect all 100 Zygarde Cells across Borrius.\n"
        "zygarde|Return to the scientists for Zygarde with Power Construct.",
    71: "electivire-chamber|Find the trainer and Electivire in the northeast of Thundercap Mountain 4F.\n"
        "chase|Chase Electivire south through the breakable rocks; defeat it.\n"
        "epidimy|Meet its trainer at Epidimy Pokémon Center; learn it was stolen.\n"
        "east-warehouse|Find Electivire in Seaport City's east warehouse.\n"
        "electivire|Defeat the stolen Electivire, then its Dynamax form.\n"
        "scientist|Defeat the Science Society Scientist.\n"
        "reunite|Return to Epidimy with a free party slot for the shiny Elekid Egg and items.",
    73: "route-10-peninsula|Defeat the goon at the tip of Route 10's peninsula.\n"
        "auburn-waterway|Find and defeat the next goon across the bridge toward Auburn Waterway.\n"
        "route-9-fork|Follow the fork toward Route 9 and defeat the next goon.\n"
        "north-grass|Follow the long grass north and east to the last goon.\n"
        "gruff|Meet the policeman back on Route 10 and defeat Terror Granbull Boss Gruff.\n"
        "policeman|Collect TM106 Smart Strike from the policeman.",
    75: "milo|Find Milo in Thundercap Mountain's 4F Maze Chamber.\n"
        "escort|Guide him safely through the maze and outside for TM73 Thunder Wave.",
    76: "slide-puzzle|Enter the Tomb of Borrius and solve the 1F sliding puzzle.\n"
        "tomb-traps|Follow the archaeologist through the tomb's puzzles and traps.\n"
        "magearna|Defeat Dynamax Magearna.\n"
        "treasure-chamber|Reach the burial chamber and collect Psychium Z.",
    77: "dream-research|Visit the northwest scientist in Tarmigan's Dream Research Lab.\n"
        "bellin-scan|Scan the child in Bellin Town's southwest house.\n"
        "blizzard-scan|Scan the child on 2F of the house beside Blizzard's KBT entrance.\n"
        "crater-scan|Scan the swarm-information child in Crater Town's central south house.\n"
        "seaport-scan|Scan the child on 1F of Seaport's Alolan-starter building.\n"
        "cure|Return to the Dream Research Lab so the scientist can cure the children.\n"
        "rotom|Return to Polder's father with a free party slot for Rotom.",
    78: "ducklett|Trade an Alolan Sandshrew to Edmund in Dresco Town for Ducklett.\n"
        "electrode|Trade an Onix to Alicia for Electrode.\n"
        "hitmontop|Trade a Lickitung to Saige for Hitmontop.\n"
        "pachirisu|Trade a Manectric to Tim for Pachirisu.\n"
        "mushroom|Trade Amoonguss or Shiinotic with Shroomu for the other species.\n"
        "lampent|Trade a Zweilous to Balogna for Lampent.\n"
        "report-trades|Report all six trades to the man in Vivill Pokémon Center.",
    79: "tomb-hidden-items|Find every hidden item in the Tomb of Borrius.\n"
        "psychic|Return to Gurun Town's Psychic for the Larvesta Egg.",
    80: "ingredients|Give the Piemaker 10 Sitrus Berries, 10 Lum Berries, 2 Kee Berries, 2 Marang Berries, and 5 Moomoo Milks.",
    82: "grass|Use Cut to clear every patch of long grass in Grim Woods.\n"
        "report|Return to the man west of the east entrance for Beedrillite.",
    84: "solo-league|Defeat the Pokémon League with only one Pokémon.\n"
        "youngster|Report to the Youngster at the League's east table.",
}

TARGET_KEYS = {
    8: '''001 route-3
002 route-4-east
003 route-5
004 route-6
005 route-7
006 route-8
007 route-9
008 route-10
009 route-11
010 tarmigan-garden
011 route-12
012 route-14
013 great-desert
014 gurun-town
015 route-16
016 route-17
017 cootes-bog
018 magnolia-fields
019 route-18
020 cube-corp
021 icy-hole
022 icicle-tablet
023 grim-woods
024 cinder-tablet
025 kbt-expressway
026 valley-tablet
027 frost-tablet
028 thundercap-tablet
029 ruins-tablet
030 crystal-tablet
031 victory-tablet
032 underwater-tablet''',
    13: '''01 frozen-heights-house
02 route-1-cave
03 bellin-entrance
04 icicle-pond
05 icicle-chansey
06 icicle-lower-ladder
07 route-2-stairs
08 dresco-bridge
09 route-3-beach
10 route-4-east
11 route-4-west
12 cinder-east
13 route-5-waterfall
14 route-5-crater
15 route-6-bridge
16 route-7-bridge
17 frost-entrance
18 route-8-lake
19 route-9-chansey
20 route-10-cave-of-being
21 route-10-jumping-rocks
22 route-11-hiker
23 epidimy-statue
24 thundercap-main
25 route-12-beach
26 dehara-outskirts
27 route-13-border
28 route-14-ruins
29 desert-cactus
30 vivill-medium
31 route-15-outcrop
32 route-16-island
33 route-16-antisis
34 route-17-sky-master
35 route-18-checkpoint
36 league-path
37 cootes-polder
38 cootes-crystal
39 crystal-peninsula
40 magnolia-grove
41 redwood-villa
42 redwood-clearing
43 redwood-cube
44 cube-west
45 cube-east''',
    65: '''001 catching-lesson
002 flower-berries
003 swarm-berries
004 beast-ball-trade
005 type-berries
006 underground-race
007 moleman-fossil
008 epidimy-repels
009 evolution-stone
010 mansion-berries
011 dream-balls
012 play-date
013 stat-wings
014 sewer-medicine
015 hip-waders
016 tiny-pokemon
017 tall-pokemon
018 bp-lottery
019 heart-scale-move
020 croagunk-show
021 crystal-gems
022 pep-quiz
023 money-tree''',
}


def _children(actions):
    children = []
    for line in actions.splitlines():
        child_key, action, *notes = line.split('|')
        children.append(dict(k=child_key, t=action, **({'n': notes[0]} if notes else {})))
    return children


def _mission_order(number):
    previous = {9: 23, 39: 9, 35: 58, 80: 35, 26: 11, 22: 26}.get(number)
    return (*_mission_order(previous), number) if previous else (number,)


def _table_children(number, raw):
    children = []
    targets = dict(line.split() for line in TARGET_KEYS.get(number, '').splitlines())
    for table in re.findall(r'<table\b.*?</table>', raw, re.S):
        for row in _rows(table):
            if not row:
                continue
            target = row[0]
            if number == 8 and (match := re.fullmatch(r'Raid Den #(\d{3})', target)):
                children.append(dict(k='raid-' + targets[match[1]], t='Defeat ' + target + '.', n=row[1]))
            elif number == 13 and (match := re.fullmatch(r'Trainer Tips Sign #(\d{2})', target)):
                children.append(dict(k='sign-' + targets[match[1]], t='Read ' + target + '.', n=row[1]))
            elif number == 15 and (match := re.fullmatch(r'#\d+ (.+)', target)):
                children.append(dict(k='vivillon-' + key(match[1]), t='Find the ' + match[1] + ' Vivillon.', n=row[2]))
            elif number == 21 and len(row) == 4 and target not in ('Baby', ''):
                children.append(dict(k='show-' + key(target), t='Show the breeder a ' + target + '.',
                                     n=' · '.join(row[1:])))
            elif number == 50 and (match := re.match(r'#\d+ (.+?) (?:Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy)\b', target)):
                children.append(dict(k='catch-' + key(match[1]), t='Catch ' + match[1] + '.', n=row[2]))
            elif number == 65 and (match := re.match(r'Daily Event #(\d{3}) (.+)', target)):
                children.append(dict(k='daily-' + targets[match[1]], t='Complete ' + match[2] + '.', n=row[1]))
    expected = {8: 32, 13: 45, 15: 19, 21: 9, 50: 25, 65: 23}
    if number in expected:
        assert len(children) == expected[number], (number, len(children), expected[number])
    return children


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
                dict(k='reward', t='Complete the mission and collect the reward.')]
    table_children = _table_children(number, mission['page']['html'])
    if table_children:
        children = [children[0]] + table_children + [children[-1]]
    elif number in MISSION_ACTIONS:
        children = [children[0]] + _children(MISSION_ACTIONS[number])
    result = dict(m=slug, n=mission['name'].split(': ', 1)[1],
                        u=fields.get('Unlock Requirements', 'Reach ' + fields['Start Location'] + '.'),
                        r=reward, s=children)
    notes = {
        7: 'All nine tablets are required; later tablets need Champion status and the ADM.',
        8: 'Defeat every den on the same calendar day.',
        15: 'All eight badges are needed to finish. Report each pattern to the mission giver.',
        21: 'Show all nine babies; each new baby also earns a Heart Scale.',
        30: 'Starts with the old man in Epidimy Town; the rescue is in Seaport City.',
        37: 'The hanky appears on Saturday; its owner returns on Friday.',
        47: 'Leave all three crystal colors available while searching the exterior.',
        50: 'Catch all 25; some portals have time, party, or prerequisite legendary conditions.',
        65: 'Complete all 23 different events in one calendar day; Dialga is required to unlock this mission.',
        70: 'The 10-cell and 50-cell Zygarde forms are temporary; the 100-cell reward is permanent.',
        71: 'The mission starts after Marlon, but its Seaport finale comes later.',
        78: 'Earlier trades count; Shroomu offers the opposite mushroom species.',
        83: 'Show a different Flying type on four consecutive days.',
        84: 'Use a single Pokémon, not a full monotype party.',
    }
    if number in notes:
        result['note'] = notes[number]
    return number, result


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
        for section in group['sec']:
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
            if special:
                candidates = [stops[special]]
            assert candidates, 'Trainer section has no stop: ' + group['n'] + ' / ' + place
            for trainer in section['tr']:
                target = candidates[0]
                if trainer['n'].startswith('Leader ') or trainer['n'] == 'Successor Maxima':
                    target = candidates[-1]
                if split_index == 6 and place == 'Antisis City':
                    if 'Barbs' in trainer['n']:
                        target = stops['part-28/ferrothorn-turf']
                    elif 'Big Mo' in trainer['n']:
                        target = stops['part-29/antisis-gym']
                if trainer['n'] == 'Skier Charlie':
                    target = stops['part-30/antisis-thundercap']
                if split_index == 1 and trainer['n'] in ('Lass Crissy', 'Fisherman Dale', 'Fisherman Barney'):
                    target = stops['part-5/route-4-west']
                if split_index == 7 and place == 'Seaport City':
                    target = stops['part-32/seaport-east' if 'Scientist' in trainer['n'] else 'part-32/seaport-west']
                if split_index == 8 and place == 'Cootes Bog' and trainer['n'] == 'Rival':
                    target = stops['part-35/crystal-approach']
                target['tr'].append(trainer['k'])
    missions = [_mission(mission) for mission in WIKI.walkthrough_missions()]
    index = WIKI.mission_index()
    first = next(row for row in index if row[0].startswith('#001:'))
    missions.append((1, dict(m='mission-001', n=first[0].split(': ', 1)[1], u='None.', r=first[3], s=[
        dict(k='accept', t="Accept Professor Log's errand in Frozen Heights."),
        dict(k='light-of-ruin', t='Defeat the Light of Ruin and stop the Ultimate Weapon.'),
        dict(k='champion', t='Defeat the Pokémon League and become Champion.'),
    ])))
    for number, mission in sorted(missions, key=lambda entry: _mission_order(entry[0])):
        stops[MISSION_STOPS[number]]['s'].append(mission)
    data['WK'] = dict(splits=splits, np=[])
    STATS.update(parts=len(parts), splits=len(splits), stops=len(stops),
                 steps=sum(isinstance(step, list) for stop in stops.values() for step in stop['s']),
                 missions=len(missions), children=sum(len(mission['s']) for number, mission in missions),
                 items=len(items.PLACED), trainers=sum(len(stop['tr']) for stop in stops.values()))
    report('walkthrough:', ', '.join('%s %d' % pair for pair in STATS.items()))
    longest = max((mission for number, mission in missions), key=lambda mission: len(mission['s']))
    report('walkthrough: longest mission %s (%s), %d children' % (longest['m'], longest['n'], len(longest['s'])))
    report('walkthrough: mission-only checklists:', ', '.join(stop['k'] for stop in stops.values()
           if stop['s'] and all(isinstance(step, dict) for step in stop['s'])))

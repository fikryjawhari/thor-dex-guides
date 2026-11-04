"""The Radical Red play order (ROUTE), shared by trainers.py (an ordinary trainer's box = the split of the visit to its
place) and walk.py (WK). No walkthrough doc exists: ROUTE follows the Hardcore sheet's Trainer Order row order and the
user's rulings (notes.md → Walkthrough).

ROUTE, one stop per line: split | key | data.js areas | trainers | steps (^) | [name]
    split     the Hardcore cap step (0 Pre-Brock ... 17 Post Game) = the Trainers box the stop's fights are in
    key       the stop key (saved ticks and open state): explicit and semantic, never a position; never change one
    areas     data.js area indexes (LOC index): the stop's tracker areas (AR, so its encounters), its item pickups
              and the trainer places it may hold; the first one names the stop unless [name] is given
    trainers  data.js trainer ids in fight order, or empty = every card of this split whose place is one of the
              stop's areas and no other stop of the split lists (mini bosses first, walk.py); '-' = none
"""
from common import DATA

ROUTE = """
0|pallet-town|1,0,2,3||Choose your starter in Oak's Lab and battle Blue.
0|route-1|4|-|
0|viridian-city|5,6,7,8||Take Oak's Parcel from the Poké Mart back to Oak, then head north.
0|route-22-early|10||
0|route-2|11|-|
0|viridian-forest|12|44 4 532 103 102|
0|viridian-forest-heart|13||
0|viridian-forest-exit|12|104||Viridian Forest · Exit
0|pewter-city|15,16,17,18||
0|pewter-gym|19||
1|route-3|20||
1|route-4-west|21,22|-|Route 4 west of the ledge.|Route 4 · West
1|mt-moon|23,24,25||Beat Super Nerd Miguel on B2F and take one fossil: Helix or Dome.
2|route-4-east|21|-||Route 4 · East
2|cerulean-city|26,27,28,30,31,29||Blue waits at the north end of the city.
2|route-24|32||
2|route-25|33,34||Help Bill in his house for the S.S. Ticket.
2|route-5|35,36,37,38||
2|route-6|39||
2|vermilion-city|40,41,42,43,44|-|
2|diglett-cave|45,14,46|-|
2|route-11|47,48||
2|cerulean-gym|73||
3|route-25-bugsy|33|47||Route 25 · Bugsy
3|cerulean-dig-house|26|355|Beat the Rocket Grunt behind the house he robbed.|Cerulean City · Dig house
3|route-6-jeff|39|146||Route 6 · Camper Jeff
3|ss-anne|49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72||Board with the S.S. Ticket.^Get HM01 Cut from the Captain.|S.S. Anne
3|route-2-cut|11,74|-|Cut through to the Route 2 gatehouse.|Route 2 · Cut
3|pewter-museum|17|-|
3|vermilion-gym|111||
4|route-9|75||
4|route-10-north|76,77|156||Route 10 · North
4|rock-tunnel|78,79||
4|route-10-south|76|163 188 187 157||Route 10 · South
4|lavender-town|80,81,82|||Lavender Town
4|pokemon-tower|83,84,85,86,87||Without the Silph Scope, turn back at the Ghost on 6F.
4|route-12-north|88,89||North pier: the Snorlax blocks the way south.|Route 12 · North
4|route-8|90,91||
4|route-7|92|-|
4|celadon-city|93,94,95,96,97,98,99,100,101,102,103|-|Get the Tea in Celadon Mansion: it opens the Saffron City gates.
4|route-16-north|104,105|||Route 16 · North
4|saffron-dojo|110,106,107,108,109|318 320 319 321||Saffron City
4|johto-leaders||8 49 52 317||Johto Leaders
4|celadon-gym|112|||Celadon City Gym
5|game-corner|113,118||Beat the Rocket Grunt by the poster to open the Rocket Hideout.|Celadon City Game Corner
5|rocket-hideout|114,115,116,117||Get the Lift Key on B4F.
6|pokemon-tower-scope|83,84,85,86,87,119||Use the Silph Scope on the Ghost on 6F, then free Mr. Fuji on 7F.|Pokemon Tower · Silph Scope
6|lavender-flute|80|-||Lavender Town · Poké Flute
6|silph-co|121,122,123,124,125,126,127,128,129,130,131||Get the Card Key on 5F.^Take the Lapras on 7F after Blue.^Archer and Ariana on 11F: a tag battle, Brendan with you.
7|silph-giovanni|131|349||Silph Co. · Giovanni
8|silph-president|131|-|Collect the Master Ball from the President on 11F.|Silph Co. · President
8|saffron-mega-ring|106,133,134|-||Saffron City · Mega Ring
8|route-8-cole|90|18||Route 8 · Cole
8|celadon-hotel|103|16 17||Celadon City Hotel
8|lavender-gengarite|80|-||Lavender Town · Gengarite
8|saffron-gym|135||
9|saffron-kid|132|25|
9|route-12-south|88,136|285 477 233 447|Wake the Snorlax with the Poké Flute.|Route 12 · South
9|route-13|137||
9|route-14|138||
9|route-15|139,140||
9|route-16|104,120||Wake the Snorlax by Route 16 and ride Cycling Road south.|Route 16 · Cycling Road
9|route-17|141||
9|route-18|142,143||
9|fuchsia-city|144,151||
9|safari-zone|145,146,147,148,149,150|-|Take the Gold Teeth in Area 3.
9|fuchsia-warden|152,153|-|Give the Gold Teeth to the Warden.
9|route-19-beach|154|||Route 19 · Beach
9|pewter-gym-rematch|19|56|Beat at least 3 of the 4 gym rematches (Brock, Misty, Lt. Surge, Erika) before Koga.|Pewter City Gym · Rematch
9|route-2-rock-smash|11|-||Route 2 · Rock Smash
9|viridian-forest-heart-return|13|-||Viridian Forest Heart · Rock Smash / Strength
9|mt-moon-return|25|-||Mt. Moon · Rock Smash / Strength
9|cerulean-gym-rematch|73|48||Cerulean City Gym · Rematch
9|vermilion-gym-rematch|111|51||Vermilion City Gym · Rematch
9|route-6-return|39|-||Route 6 · Rock Smash / Strength
9|rock-tunnel-return|79|-||Rock Tunnel · Rock Smash / Strength
9|celadon-gym-rematch|112|65|Erika's rematch needs the Fuchsia Gloom errand done first.|Celadon City Gym · Rematch
9|celadon-return|93|-||Celadon City · Rock Smash / Strength
9|fuchsia-gym|155||
10|safari-moltres|156,146|-|
10|route-19|154|||Route 19 · Surf
10|route-20|158||
10|seafoam-islands|159,160,161,162,163|-|
10|route-21|169,9||
10|viridian-surf|5,10|-||Viridian City · Surf
10|route-24-surf|32|-||Route 24 · Surf
10|route-4-crissy|21|119||Route 4 · Surf
10|route-10-surf|76|162||Route 10 · Surf
10|power-plant|157||
10|vermilion-surf|40|-||Vermilion City · Surf
10|route-12-surf|88|-||Route 12 · Surf
10|cinnabar-may|170,164|61|
11|cinnabar-lab|165,166,167,168|62|Revive fossils in the Lab.
11|pokemon-mansion|171,172,173,174||Find the Secret Key on B1F: it opens the Gym.
11|cinnabar-gym|175||
12|cerulean-cave|176,177|72 73 70 71 67 68|
13|cerulean-cave-giovanni|178|69||Cerulean Cave · Giovanni
14|route-4-rewards|21|-||Route 4 · Rewards
14|cerulean-cave-ketchup|177|20 19|Ketchup gives a Kubfu after the first battle; the rematch, a day later, a second.|Cerulean Cave · Ketchup
14|viridian-gym|179||
15|roaming||-||Roaming
15|silph-b1f|180,181|-||Silph Co. · B1F
15|mansion-4f|182,183|454 455 218||Pokemon Mansion · 4F
15|cinnabar-lab-return|165|-||Cinnabar Island Lab · Soul Dew
15|route-22|10|435 437 436||Route 22 · Blue
15|route-23|184||
16|victory-road|185,186,187||
16|indigo-plateau|188,189||
16|pokemon-league|190,191,192,193,194||
17|pallet-postgame|3,0|200 210||Pallet Town · Postgame
17|mystery-gift||-|Mystery Gifts open after the Hall of Fame.|Mystery Gift
17|route-16-fly-house|105|-|
17|one-island|195,200||Win 8 in a row at the Battle Simulator and Enamorus roams Kanto.
17|pokemon-tower-top|196,197|||Pokemon Tower · 8F-9F
17|magearna-chamber|198||
17|kyogre-chamber|199||
17|cerulean-gym-postgame|73|||Cerulean City Gym · Postgame
17|saffron-gian|132|||Saffron City Gian's House · Gian
17|viridian-gym-postgame|179|||Viridian City Gym · Postgame
17|cerulean-cave-mewtwo|178|-|Mewtwo waits on B1F.|Cerulean Cave · Mewtwo
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


def visit_split(i, place, step):
    """The split of the walkthrough visit that holds ordinary trainer i (data.js id) at place (its areaName): the stop
    that lists it, else a stop with an empty trainers field at that place, in its data.js cap step's split, else the
    first later one, else the last earlier one; None = no stop at that place."""
    plan = route()
    for split, key, areas, ids, steps, name in plan:
        if ids and i in ids:
            return split
    visits = [split for split, key, areas, ids, steps, name in plan
              if ids is None and place in {DATA['areas'][a]['name'] for a in areas}]
    same = [s for s in visits if s == step]
    later = [s for s in visits if s > step]
    earlier = [s for s in visits if s < step]
    return (same or later or earlier[-1:] or [None])[0]

"""move_rules.json (tools/moveprops.py docstring): Hardlove's move-property rules that differ from the stock table.

build.py calls write(D) after MV is built and before finalise() reads the file, so the move lists follow the pinned
source on every build. Each entry's src names the hg-engine line at the pin (64838bf7db; src/ is not in .src: read
on GitHub at that commit). Mechanics.txt has no other move rule: Unseen Fist going through Protect on contact
(Mechanics.txt:24, CanHitThroughProtect) is stock; Libero / Protean, Battle Bond, Moody and permanent weather /
terrain (26-32) are not move rules (notes.md lists them).
"""
import json
import os

import moveprops
from move_metadata import EFFECT, SHEER_FORCE, SHEER_FORCE_MOVES, key

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'move_rules.json')
OHKO = 'ONE_HIT_KO'


def _stock(owner, side):
    rule = next(r for r in moveprops.RULES if r.get('a', r.get('i')) == owner and r['w'] == side)
    return rule['test']


def _diff(D, owner, side, wanted):
    """add / remove turning the stock rule's selection into the source's."""
    test = _stock(owner, side)
    stock = {name for name, move in zip(D['M'], D['MV']) if move and moveprops._matches(test, name, move)}
    return {'add': sorted(wanted - stock), 'remove': sorted(stock - wanted)}


def write(D):
    damaging = {name for name, move in zip(D['M'], D['MV']) if move and move.get('c') in ('Physical', 'Special')}
    effect = lambda name: EFFECT.get(key(name))
    sheer = {name for name in damaging if effect(name) in SHEER_FORCE or key(name) in SHEER_FORCE_MOVES}
    cloak = {name for name in damaging if effect(name) in SHEER_FORCE}
    contact = {name for name, move in zip(D['M'], D['MV']) if move and 'contact' in move.get('f', [])}
    ohko = sorted(name for name in D['M'] if effect(name) == OHKO)
    rules = [
        {'a': 'Sheer Force', 'w': 'u', **_diff(D, 'Sheer Force', 'u', sheer),
         'src': 'src/battle/battle_script_commands.c:1070-1150 (64838bf7db): effect-id list plus six named moves'},
        {'i': 'Covert Cloak', 'w': 't', 'e': "Blocks the move's added effects, the user's boosts too",
         **_diff(D, 'Covert Cloak', 't', cloak),
         'src': 'src/battle/battle_script_commands.c:1070-1135 (64838bf7db): the Sheer Force effect-id list'},
        {'i': 'Protective Pads', 'w': 't', 'match': None, 'e': 'Contact moves make no contact with the holder',
         'add': sorted(contact),
         'src': 'src/battle/other_battle_calculators.c:2874 (64838bf7db): IsContactBeingMade checks the defender\'s pads'},
        {'a': 'No Guard', 'w': 'u', 'e': 'OHKO moves ignore accuracy and the level check', 'add': ohko,
         'src': 'Mechanics.txt:30; src/battle/other_battle_calculators.c:2712, src/individual/BattleController_BeforeMove.c:4770 (64838bf7db)'},
        {'a': 'No Guard', 'w': 't', 'e': 'OHKO moves ignore accuracy and the level check', 'add': ohko,
         'src': 'Mechanics.txt:30; src/battle/other_battle_calculators.c:2712, src/individual/BattleController_BeforeMove.c:4770 (64838bf7db)'},
    ]
    with open(PATH, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(rules, f, ensure_ascii=False, indent=1)
        f.write('\n')
    return rules

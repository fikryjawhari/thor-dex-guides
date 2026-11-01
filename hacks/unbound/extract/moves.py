"""Unbound's curated structured move metadata; refresh with refresh_moves.mjs.

The committed snapshot makes normal builds independent of Node / other guides.
The structured reader in cfru.move_metadata is shared with sibling hacks.
"""
import json
from pathlib import Path

import cfru
from common import report

# Unbound's own moves no structured source has: records from the in-game description (the user, 2026-10-31).
# InfernalRage has Infernal Parade's text word for word; Endless Edge / Metal Bash say "This also lowers" (100%).
HAND = {
    'InfernalRage': {'target': 'normal', 'flags': {'protect': 1}, 'reliableProtect': True,
                     'secondary': {'chance': 30, 'status': 'brn'}},
    'Endless Edge': {'target': 'normal', 'flags': {'protect': 1}, 'reliableProtect': True,
                     'secondary': {'chance': 100, 'boosts': {'atk': -1}}},
    'Metal Bash': {'target': 'normal', 'flags': {'contact': 1, 'protect': 1}, 'reliableProtect': True,
                   'self': {'boosts': {'def': -1, 'spd': -1}}},
}


def build(data):
    snapshot = json.loads(Path(__file__).with_name('move_metadata.json').read_text(encoding='utf-8'))
    missing = []
    for name, move in zip(data['M'], data['MV']):
        record = snapshot['moves'].get(name) or HAND.get(name)
        if record is None:
            missing.append(name)
            continue
        move.update(cfru.move_metadata(record, move['c'] != 'Status'))
    report('move metadata: %d moves; no structured source: %s' % (
        len(data['M']) - len(missing), ', '.join(missing) or 'none'))

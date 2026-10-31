"""Unbound's curated structured move metadata; refresh with refresh_moves.mjs.

The committed snapshot makes normal builds independent of Node / other guides.
The structured reader in cfru.move_metadata is shared with sibling hacks.
"""
import json
from pathlib import Path

import cfru
from common import report


def build(data):
    snapshot = json.loads(Path(__file__).with_name('move_metadata.json').read_text(encoding='utf-8'))
    missing = []
    for name, move in zip(data['M'], data['MV']):
        record = snapshot['moves'].get(name)
        if record is None:
            missing.append(name)
            continue
        move.update(cfru.move_metadata(record, move['c'] != 'Status'))
    report('move metadata: %d moves; no structured source: %s' % (
        len(data['M']) - len(missing), ', '.join(missing) or 'none'))

"""Pokémon Radical Red 4.1 (Hardcore): raw sources in .src/ -> data.json + extract/report.txt.
Usage: uv run python -I hacks/radical-red/extract/build.py

dex.py runs first (M, MV, AB, P, TC; the move / ability / species lookups the others use); moves.py adds structured
move metadata; gid.py last, after finalise() (GID indexes M as it ends up). A module still a stub (raises
NotImplementedError) leaves its tables empty, so data.json builds while units are in progress (plans/radical-red.md, in git history).
"""
from pathlib import Path
import os
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import H, report
import extractlib
import dex
import gid
import locs
import trainers
import items
import walk
import prune
import moves


def main():
    data = {'LOC': [], 'AR': [], 'IT': [], 'WK': {'splits': [], 'np': []}, 'TR': {'g': [], 'caps': []}}
    dex.build(data)
    for module in (locs, trainers, items, walk):
        try:
            module.build(data)
        except NotImplementedError as error:
            report('%s: not built yet (%s)' % (module.__name__, error))
    keys = os.path.join(H.extract, 'trainer_keys.json')
    seeded = os.path.exists(keys)
    try:
        moves.build(data)
    except NotImplementedError as error:
        report('moves: not built yet (%s)' % error)
    extractlib.finalise(data, H.name, prune.build, gauntlet_rules=trainers.gauntlet_rules)
    if not seeded and not data['TR']['g'] and os.path.exists(keys):
        os.remove(keys)     # no trainers yet: the first build with trainers seeds the key table
        report('trainer keys: no trainers yet, no key table written')
    try:
        gid.build(data)
    except NotImplementedError as error:
        report('gid: not built yet (%s)' % error)
    extractlib.write_data(data, H)


if __name__ == '__main__':
    main()

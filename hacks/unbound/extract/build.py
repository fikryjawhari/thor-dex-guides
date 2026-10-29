"""Pokémon Unbound: raw sources in .src/ -> data.json + extract/report.txt.
Usage: uv run python -I hacks/unbound/extract/build.py

dex.py runs first (M, MV, AB, P, TC; the move / ability lookups the others use); gid.py last, after finalise()
(GID indexes M as it ends up). A module still a stub (raises
NotImplementedError) leaves its tables empty, so data.json builds while units 4-7 are in progress (plans/unbound.md).
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
    extractlib.finalise(data, H.name, prune.build)
    if not seeded and not data['TR']['g']:
        os.remove(keys)     # no trainers yet: the first build with trainers (unit 6) seeds the key table
        report('trainer keys: no trainers yet, no key table written')
    gid.build(data)
    extractlib.write_data(data, H)


if __name__ == '__main__':
    main()

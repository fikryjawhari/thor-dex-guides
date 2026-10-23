"""Build hacks/emerald-imperium/data.json from hacks/emerald-imperium/.src (SOURCES.md says how to fetch it).

Usage (repo root): uv run python -I hacks/emerald-imperium/extract/build.py
Modules: dex.py (M, MV, AB, P, TC; also the Changes doc), locs.py (LOC, AR, P.w, P.g), items.py (IT), walk.py (WK), trainers.py
(TR; needs the walkthrough's stops, so it runs after walk.py), then the split UI's reshaping (locs / trainers / items
split()), walk.name_splits and the shared finalisers (tools/extractlib.py finalise: Items standard, prune.py, split
names). The report of every conflict and guess goes to hacks/emerald-imperium/extract/report.txt.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import H  # noqa: E402
from extractlib import finalise, write_data  # noqa: E402
import dex, locs, items, walk, trainers, prune  # noqa: E402

# data.json keeps this key order (the published layout)
ORDER = ['M', 'MV', 'AB', 'P', 'LOC', 'TC', 'built', 'src', 'AR', 'IT', 'WK', 'TR', 's7']


def main():
    D = {}
    dex.build(D)
    locs.build(D)
    items.build(D)
    walk.build(D)
    trainers.build(D)
    locs.split(D)
    trainers.split(D)
    items.split(D)
    walk.name_splits(D)
    D['s7'] = 1      # the published files carry the split UI marker; the template does not read it
    finalise(D, H.name, prune.build)
    write_data(D, H, None, ORDER)


if __name__ == '__main__':
    main()

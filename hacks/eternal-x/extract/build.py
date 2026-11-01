"""Build hacks/eternal-x/data.json from hacks/eternal-x/.src (SOURCES.md says how to fetch it).

Usage (repo root): uv run python -I hacks/eternal-x/extract/build.py
Modules: dex.py (M, MV, AB, P, TC), locs.py (LOC, AR, P.w), trainers.py (TR), items.py (IT), walk.py (WK), then
items.order (game order, needs WK) and the shared finalisers (tools/extractlib.py finalise: Items standard, prune.py,
split names). The report of every conflict and guess goes to hacks/eternal-x/extract/report.txt.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import H  # noqa: E402
from extractlib import finalise, write_data  # noqa: E402
import schema  # noqa: E402
from ctrguide import build_save_ids, item_text  # noqa: E402
import dex, locs, trainers, items, walk, prune  # noqa: E402


def main():
    H.pdf_text()
    D = {}
    dex.build(D)
    locs.build(D)
    trainers.build(D)
    items.build(D)
    walk.build(D)
    items.order(D)
    item_text(D, H.load('dex-rebalanced.json'), H.load('dex-vanilla.json'), H.extract)   # before finalise: tools/item_text.py reads item_desc.json
    finalise(D, H.name, prune.build)
    schema.standardise(D)
    build_save_ids(D, H.load('dex-rebalanced.json'))
    write_data(D, H)


if __name__ == '__main__':
    main()

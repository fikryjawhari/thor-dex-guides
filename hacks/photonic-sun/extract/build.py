"""Build hacks/photonic-sun/data.json from hacks/photonic-sun/.src (SOURCES.md says how to fetch it).

Usage (repo root): uv run python -I hacks/photonic-sun/extract/build.py
Modules: dex.py (M, MV, AB, P, TC), locs.py (LOC, AR, P.w), trainers.py (TR), items.py (IT), walk.py (WK), then
items.order (game order, needs WK) and the shared finalisers (tools/extractlib.py finalise: Items standard, prune.py,
split names). The report of every conflict and guess goes to hacks/photonic-sun/extract/report.txt.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import H  # noqa: E402
from extractlib import finalise, write_data  # noqa: E402
import dex, locs, trainers, items, walk, prune  # noqa: E402

SRC_NOTE = 'Photonic Sun 2.38 Rebalanced: game data (romfs + code.ips over Ultra Sun v1.2), Buffel Saft\'s docs, Bulbapedia (trainer places, story order), Serebii (item locations)'


def main():
    H.pdf_text()
    D = {}
    dex.build(D)
    locs.build(D)
    trainers.build(D)
    items.build(D)
    walk.build(D)
    items.order(D)
    finalise(D, H.name, prune.build)
    write_data(D, H, SRC_NOTE)


if __name__ == '__main__':
    main()

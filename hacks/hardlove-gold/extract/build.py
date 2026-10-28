"""Build hacks/hardlove-gold/data.json from hacks/hardlove-gold/.src (SOURCES.md says how to fetch it).

Usage (repo root): uv run python -I hacks/hardlove-gold/extract/build.py
Modules: dex.py (M, MV, AB, P, TC), locs.py (LOC, P.w), trainers.py (TR), items.py (IT), walk.py (AR, WK). The steps keep the
order the data needs (the dex site's names, the locations sheet, the game's source, the trainer sheet...), so each module
is called several times; they share the working state X (common.py). Then the split UI's reshaping (trainers / items
split()), the Starter area (locs.starter), the shared finalisers (tools/extractlib.py finalise: Items standard, split
names) and the save importer's id tables (gid.py). The report goes to hacks/hardlove-gold/extract/report.txt.

The raw build is the only build: data.json is always made from .src. It stops when .src is not the release that watch.json
pins (repos/hardlove/COMMIT against the "Released game source" ref), so stale sources can't quietly rebuild older data.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import H, report  # noqa: E402
from extractlib import finalise, write_data  # noqa: E402
import dex, gid, locs, trainers, items, walk  # noqa: E402
import json  # noqa: E402


def main():
    D = {}
    dex.site(D)           # the dex site's pages: species order, names and forms
    locs.sheet(D)         # the Pokemon Locations sheet
    dex.moves(D)          # move names against Showdown
    trainers.sheet(D)     # the Trainer Battles sheet
    items.sheet(D)        # the Item Location sheet's Mega stones
    dex.megas(D)          # Z-A Megas, usable Megas
    dex.engine(D)         # the hack's own source (hg-engine)
    locs.verify(D)        # wild tables against the game; obtainable set
    trainers.engine(D)    # game trainer lookups
    dex.species(D)        # P
    dex.abilities(D)      # AB
    trainers.build(D)     # TR
    dex.movetable(D)      # MV
    items.build(D)        # IT
    walk.build(D)         # AR, WK
    dex.types(D)          # TC
    P = D['P']
    report('P', len(P), 'obtainable', sum(1 for p in P if p['g'] == 0), 'megas', sum(1 for p in P if p['g'] == 1),
           'trainer only', sum(1 for p in P if p['g'] == 3), 'moves', len(D['M']), 'abilities', len(D['AB']),
           'trainers', sum(len(s['tr']) for g in D['TR']['g'] for s in g['sec']), 'areas', len(D['AR']),
           'stops', sum(len(s['st']) for s in D['WK']['splits']), 'unplaced items', len(D['WK']['np']))
    trainers.split(D)     # one box per mini-split
    items.split(D)        # Held Items + Berries, Valuables
    locs.starter(D)       # the Starter area
    finalise(D, H.name)
    gid.build(D)          # GID: the save importer's game id tables (after finalise: M / AB indexes)
    write_data(D, H)


def check_pin():
    """.src must hold the release watch.json pins: re-fetch it with SOURCES.md otherwise."""
    pin = next(s['ref'] for s in json.load(open(os.path.join(H.dir, 'watch.json'), encoding='utf-8'))['sources']
               if s['name'] == 'Released game source')
    path = os.path.join(H.dir, '.src', 'repos', 'hardlove', 'COMMIT')
    have = open(path, encoding='utf-8').read().strip() if os.path.exists(path) else 'nothing'
    if have != pin:
        sys.exit('hardlove-gold/.src holds %s, watch.json pins %s: re-fetch the sources (SOURCES.md) before building' % (have[:10], pin[:10]))


if __name__ == '__main__':
    check_pin()
    main()

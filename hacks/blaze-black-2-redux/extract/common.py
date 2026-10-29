"""Paths and readers shared by the blaze-black-2-redux extract modules: the docs (tools/drayano.py), the RomHackDex
mirror (tools/romhackdex.py) and the name fixers every module resolves doc names through, so the build report lists
every fix once (build.py prints them at the end)."""
from pathlib import Path
import os
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
from extractlib import Hack, report  # noqa: E402,F401
import drayano  # noqa: E402
from romhackdex import Mirror  # noqa: E402

H = Hack('blaze-black-2-redux')
RD = Mirror(os.path.join(H.src, 'romhackdex'))
_docs = {}


def doc(name):
    """One of the hack's .txt docs ('Pokemon Changes'), read once."""
    if name not in _docs:
        _docs[name] = drayano.read(os.path.join(H.src, name + '.txt'))
    return _docs[name]


# The name fixers, on the mirror's names (dex.py builds them first; the other modules reuse them).
SPECIES = drayano.Names('species', [sp.name for sp in RD.species().values()])
MOVES = drayano.Names('move', [m['n'] for m in RD.moves().values()])
ABILITIES = drayano.Names('ability', list(RD.abilities()))

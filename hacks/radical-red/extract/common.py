"""Paths, readers and name lookups shared by the radical-red extract modules (the dex unit fills this in)."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from extractlib import Hack, report  # noqa: E402,F401

H = Hack('radical-red')

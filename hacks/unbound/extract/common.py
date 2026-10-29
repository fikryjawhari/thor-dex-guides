"""Paths shared by the unbound extract modules."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
from extractlib import Hack

H = Hack('unbound')

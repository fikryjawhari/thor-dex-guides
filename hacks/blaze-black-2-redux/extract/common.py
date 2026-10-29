"""Paths shared by the blaze-black-2-redux extract modules."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
from extractlib import Hack

H = Hack('blaze-black-2-redux')

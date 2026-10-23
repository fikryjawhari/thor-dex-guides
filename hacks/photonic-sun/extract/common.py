"""Shared paths and helpers for the Photonic Sun extract (run from the repo root; see build.py)."""
import os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools'))
from extractlib import Hack, REPORT, report, fix, norm, slug, split_name  # noqa: E402,F401

H = Hack('photonic-sun')
HACK, SRC, TXT, BULBA = H.dir, H.src, H.txt, H.bulba
load, text = H.load, H.text

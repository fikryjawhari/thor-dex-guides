"""Shared paths and helpers for the Emerald Imperium extract (run from the repo root; see build.py)."""
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools'))
from extractlib import Hack, REPORT, report, split_name, workbook  # noqa: E402,F401

H = Hack('emerald-imperium')
HACK, SRC, TXT = H.dir, H.src, H.txt
key = lambda s: re.sub(r'[^a-z0-9]', '', str(s).lower())

# the official docs (SOURCES.md): the Changes doc, the Encounter Tracker, the items sheet, the boss sheet
CHANGES = os.path.join(SRC, '1.3.1 Emerald Imperium Changes (Stats, Types, Abilities, Moves).xlsx')
TRACKER = os.path.join(SRC, 'Emerald Imperium 1.3 Encounter Tracker.xlsx')
ITEMS = os.path.join(SRC, 'Item (TMs, Mega Stones, etc) and Useful NPC Locations .xlsx')
BOSS = os.path.join(SRC, 'Boss Battles.xlsx')

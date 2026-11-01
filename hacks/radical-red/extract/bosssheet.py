"""The Hardcore trainer workbook (.src/trainers-hardcore.xlsx): boss blocks and the Trainer Order tab.

    blocks()       every boss block of the boss tabs: Block(sheet, row, title, labels, effects, mons)
    trainer_order() the Trainer Order tab: [Entry(row, name, link, cap, place, optional)] in order
    main_caps()    Main E44:E78's 18 Hardcore caps as [(name, cap)]

A block's title is in column C on the species row (species in E J O T Y AD); the rows below hold level (+1), nature
(+4), ability (+5, a second line "X (Mega)" = the Mega's ability), item (+6) and moves (+7..+10). The "(!) ..."
labels (IF RIVAL HAS SQUIRTLE, TEAM ONE, BACK TO BACK, ...) and "BATTLE EFFECT: ..." lines sit in the rows between
the previous block and the title. Raw values only: the extract normalises names.
"""
from collections import namedtuple
from functools import lru_cache
from pathlib import Path
import re

import openpyxl

from common import H

SHEETS = ['Kanto Leaders', 'Kanto Rematch', 'Johto Leaders', 'Rivals', 'Team Rocket', 'Mini Bosses',
          'Optional Bosses', 'Indigo League', 'Postgame']
COLS = ['E', 'J', 'O', 'T', 'Y', 'AD']
Block = namedtuple('Block', 'sheet row title labels effects mons')
Mon = namedtuple('Mon', 'cell species level nature ability ability_mega item moves')
Entry = namedtuple('Entry', 'row name link cap place optional')


@lru_cache(maxsize=1)
def _book():
    return openpyxl.load_workbook(Path(H.src) / 'trainers-hardcore.xlsx', data_only=True)


def _text(value):
    return '' if value is None else str(value).strip()


@lru_cache(maxsize=1)
def blocks():
    out = []
    for name in SHEETS:
        ws = _book()[name]
        rows = {}
        for row in ws.iter_rows():
            for c in row:
                if c.value not in (None, ''):
                    rows.setdefault(c.row, {})[c.column_letter] = c.value
        last = 0
        for r in sorted(rows):
            cells = rows[r]
            below = rows.get(r + 1, {})
            level = below.get('E')
            if not (_text(cells.get('C')) and _text(cells.get('E')) and
                    (isinstance(level, (int, float)) or re.search(r'\bLv\b|Level', _text(level)))):
                continue
            labels, effects = [], []
            for rr in range(last + 1, r):
                for col, v in sorted(rows.get(rr, {}).items()):
                    t = _text(v)
                    if t.startswith('BATTLE EFFECT'):
                        effects.append(t.split(':', 1)[1].strip())
                    elif re.match(r'\(!!?\)|IF RIVAL HAS ', t):
                        labels.append(re.sub(r'^\(!+\)\s*', '', t))
            mons = []
            for col in COLS:
                sp = _text(cells.get(col))
                if not sp:
                    continue
                get = lambda k: _text(rows.get(r + k, {}).get(col))
                ab, _, mega = get(5).partition('\n')
                mons.append(Mon('%s!%s%d' % (name, col, r), sp, rows.get(r + 1, {}).get(col), get(4), ab.strip(),
                                re.sub(r'\s*\(Mega\)$', '', mega.strip()), get(6),
                                [m for m in (get(k) for k in range(7, 11)) if m and m != '-']))
            out.append(Block(name, r, re.sub(r'\s+', ' ', _text(cells['C'])), labels, effects, mons))
            last = r + 20
    return out


@lru_cache(maxsize=1)
def trainer_order():
    ws = _book()['Trainer Order']
    rows = {}
    for row in ws.iter_rows():
        for c in row:
            if c.value not in (None, ''):
                rows.setdefault(c.row, {})[c.column_letter] = c
    out, optional = [], False
    for r in sorted(rows):
        cells = rows[r]
        if 'OPTIONAL' in _text(cells.get('C') and cells['C'].value) and 'D' not in cells:
            optional = True
            continue
        d = cells.get('D')
        if d is None or not d.hyperlink:
            continue
        cap = cells['F'].value if 'F' in cells else None
        cap = int(cap) if isinstance(cap, float) else _text(cap)
        place = _text(rows.get(r + 1, {}).get('D') and rows[r + 1]['D'].value)
        out.append(Entry(r, _text(d.value), d.hyperlink.location, cap, place, optional))
        optional = False
    return out


@lru_cache(maxsize=1)
def main_caps():
    ws = _book()['Main']
    out = []
    for r in range(44, 79):
        v = ws['E%d' % r].value
        if v not in (None, ''):
            out.append(_text(v))
    return out

"""The Expert boss workbook (.src/trainers-expert.xlsx): every numeric-level Pokémon slot of the 10 content sheets,
with its block (the battle) and column group (foe / partner, the rival's starter branch). Raw values, nothing resolved.

    blocks()   [Block] in sheet order; Block.groups [Group]; Group.mons [Slot]

Layout (plans/unbound-sources.md → Boss workbook layout): a block's header rows (Name / Name (event) / Location /
Location / Event, Fight Gimmicks, Trainer Items) sit above its "Pokemon Names" row; under it, per column: level ("Level at
Cap", Title Defense "Minimum Level"), ability, held item, 4 moves, nature, 6 EV rows (HP Atk Def SpA SpD Spe) and one
more row: the calc export label (Boss Wild Battles: "Boosts"). Rival: three six-column starter groups B:G / I:N / P:U
under row 1's PLAYER CHOSE ...; Shadow / Light of Ruin blocks: the partner's team in I:K (its name in the name row);
Boss Wild Battles: E:G of the Crystal Peak block are the partner's.
"""
import os
import re

from common import H

SHEETS = ['Gym Leaders', 'Pokemon League', 'Rival', 'Team Shadow Bosses', 'Team Light Of Ruin Bosses',
          'Boss Wild Battles', 'Mega Trainers', 'Other Bosses', 'Title Defense', 'Battleground']
HEAD = {'Name': 'name', 'Name (event)': 'name', 'Location': 'loc', 'Location / Event': 'loc',
        'Fight Gimmicks': 'gim', 'Trainer Items': 'items'}
ROWS = ['level', 'ability', 'item', 'm1', 'm2', 'm3', 'm4', 'nature', 'hp', 'at', 'df', 'sa', 'sd', 'sp', 'label']
LABELS = ['Level', 'Ability', 'Held Item', 'Moves', None, None, None, 'Nature', 'HP EVs', 'Attack EVs', 'Defense EVs',
          'Special Attack EVs', 'Special Defense EVs', 'Speed EVs', None]
COLS = 'BCDEFGHIJKLMNOPQRSTU'


def clean(v):
    if v is None:
        return ''
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return re.sub(r'\s+', ' ', str(v)).strip()


class Slot:
    """One Pokémon: cell (its name cell, "Gym Leaders!B5"), species (raw, with "[1st lead]" etc.), level int, ability,
    item, moves [4], nature, evs [6 raw strings], label (export label or Boss Wild "Boosts")."""

    def __init__(self, sheet, col, row, values):
        self.sheet, self.col, self.row = sheet, col, row
        self.cell = '%s!%s%d' % (sheet, col, row)
        self.species = values['species']
        self.level = int(float(values['level']))
        self.ability, self.item, self.nature = values['ability'], values['item'], values['nature']
        self.moves = [values[k] for k in ('m1', 'm2', 'm3', 'm4') if values[k]]
        self.evs = [values[k] for k in ('hp', 'at', 'df', 'sa', 'sd', 'sp')]
        self.label = values['label']

    def __repr__(self):
        return '%s %s L%d' % (self.cell, self.species, self.level)


class Group:
    """A column group of one block: role 'foe' or 'partner', starter (rival branch) or None, partner name, mons."""

    def __init__(self, role, starter=None, partner=None):
        self.role, self.starter, self.partner, self.mons = role, starter, partner, []


class Block:
    """One battle block: sheet, row (its first header row), head {name, loc, gim, items, ...} (raw strings),
    levelrow (the level row's label: "Level at Cap" / "Minimum Level"), groups."""

    def __init__(self, sheet, row, head):
        self.sheet, self.row, self.head, self.groups = sheet, row, head, []


def _groups(sheet, row, head, partner_name):
    if sheet == 'Rival':
        return [((c for c in COLS[i * 7:i * 7 + 6]), Group('foe', starter)) for i, starter in
                enumerate(['Gible', 'Beldum', 'Larvitar'])]
    if sheet in ('Team Shadow Bosses', 'Team Light Of Ruin Bosses'):
        return [('BCDEFG', Group('foe')), ('IJK', Group('partner', partner=partner_name))]
    if sheet == 'Boss Wild Battles' and head.get('loc') == 'Crystal Peak' and row == 193:
        return [('BCD', Group('foe')), ('EFG', Group('partner', partner='Rival'))]
    return [('BCDEFG', Group('foe'))]


def blocks(path=None):
    import openpyxl
    wb = openpyxl.load_workbook(path or os.path.join(H.src, 'trainers-expert.xlsx'), data_only=True)
    out = []
    for sheet in SHEETS:
        ws = wb[sheet]
        grid = {}
        for r in ws.iter_rows():
            for c in r:
                if c.value not in (None, ''):
                    grid[(c.column_letter, c.row)] = c.value
        last = max(r for _, r in grid)
        start = 1
        for row in range(1, last + 1):
            a = clean(grid.get(('A', row)))
            if a not in ('Pokemon Names', 'Pokemon Name'):
                continue
            head, first, partner = {}, None, None
            for r in range(start, row):
                key = HEAD.get(clean(grid.get(('A', r))))
                if key and clean(grid.get(('B', r))):
                    head.setdefault(key, clean(grid.get(('B', r))))
                if key:
                    first = r if first is None else first
                if key == 'name' and clean(grid.get(('I', r))):
                    partner = clean(grid.get(('I', r)))
            if sheet == 'Rival' and 'loc' in head:
                head['name'] = 'Rival'
            block = Block(sheet, first, head)
            block.levelrow = clean(grid.get(('A', row + 1)))
            sidecols = set()
            block.side = {}     # a sidebar list beside the team (Route 9's "MOVES BLOCKED BY AURAS:")
            for col in COLS:
                title = clean(grid.get((col, row - 1)))
                if title.isupper() and title.endswith(':'):
                    r, items = row, []
                    while clean(grid.get((col, r))):
                        items.append(clean(grid.get((col, r))))
                        r += 1
                    block.side[title.rstrip(':')] = items
                    sidecols.add(col)
            for k, want in enumerate(LABELS):
                got = clean(grid.get(('A', row + 1 + k)))
                ok = want is None or got.lower().startswith(want.lower()) or (k == 0 and got == 'Minimum Level')
                assert ok, (sheet, row + 1 + k, got, want)
            for cols, group in _groups(sheet, row, head, partner):
                for col in cols:
                    level = grid.get((col, row + 1))
                    if not isinstance(level, (int, float)):
                        assert not clean(grid.get((col, row))) or col in sidecols, (sheet, col, row)
                        continue
                    values = {'species': clean(grid.get((col, row)))}
                    values.update({k: clean(grid.get((col, row + 1 + i))) for i, k in enumerate(ROWS)})
                    group.mons.append(Slot(sheet, col, row, values))
                if group.mons:
                    block.groups.append(group)
            out.append(block)
            start = row + 16
    return out

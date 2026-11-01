"""Radical Red extract checks: data.json against data.js and the author's sheets. One function per tab; each unit
adds its own. Usage: uv run python -I hacks/radical-red/extract/check.py"""
from pathlib import Path
import json
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
data = Path(__file__).resolve().parents[1] / 'data.json'
if not data.is_file():
    print('SKIP radical-red extract-check: no data.json')
    sys.exit(0)
D = json.loads(data.read_text(encoding='utf-8'))
FAIL = []


def expect(ok, what):
    if not ok:
        FAIL.append(what)


def check_items():
    """Items (notes.md → Items): every machine, Mega Stone and care package against data.js and the item sheet, and
    the Hardcore view (Main tab, the sheet's Hardcore notes)."""
    import items
    from common import DATA
    rows = {r[0]: (box['n'], r) for box in D['IT'] for r in box['r']}
    lines = {name: r[1].splitlines() for name, (box, r) in rows.items()}
    # machines: every data.js TM / HM has a row, except the ones Hardcore lacks (TM107 / TM118 teach no move: no item)
    machines = set(items.TM_MOVES)
    have = {n.split(' ', 1)[0] for n, (box, r) in rows.items() if box == 'TMs and HMs'}
    expect(machines - have == items.HC_NO_TM, 'machines without a row: %s' % sorted(machines - have))
    expect(not have & items.HC_NO_TM, 'Hardcore-unavailable TMs listed: %s' % sorted(have & items.HC_NO_TM))
    expect(len(have) == len(machines) - len(items.HC_NO_TM), 'TM / HM rows %d, data.js %d' % (len(have), len(machines)))
    # Mega Stones: every Mega form's stone has a row and a place on the Pokémon page (the Primal orbs no source places)
    megas = {p['stone']: p for p in D['P'] if p.get('stone') and re.search(r'_(mega|primal)', p['id'])}
    unplaced = {s for s, p in megas.items() if not p.get('sloc')}
    expect(unplaced <= {'Red Orb', 'Adamant Orb'}, 'Mega Stones with no place: %s' % sorted(unplaced))
    expect(sum(1 for b, r in rows.values() if b == 'Mega Stones') == len(megas) - len(unplaced),
           'Mega Stone rows %d, placed stones %d' % (sum(1 for b, r in rows.values() if b == 'Mega Stones'),
                                                     len(megas) - len(unplaced)))
    # Hardcore swaps (Main E24 / E26)
    for stone, where in (('Charizardite Y', 'Route 16'), ('Charizardite X', 'Blaine'), ('Gardevoirite', 'Mansion'),
                         ('Cameruptite', 'Sabrina')):
        expect(any(where in x for x in lines.get(stone, [])), '%s: not at %s' % (stone, where))
    # Hardcore removals: no row, no wild holder; no removed tutor
    for item in items.HC_UNOBTAINABLE:
        expect(item not in rows, 'Hardcore-unobtainable %s listed' % item)
        expect(not any(h[0] == item for p in D['P'] for h in p.get('hi', [])), '%s still held by wild Pokémon' % item)
    tutors = {n for n, (box, r) in rows.items() if box == 'Move Tutors'}
    for gone in ('Swords Dance', 'Stealth Rock', 'Dragon Dance', 'Substitute', 'Rock Polish', 'Tailwind'):
        expect(gone not in tutors, 'Hardcore-removed tutor move listed: %s' % gone)
    expect(len(tutors) == 34, 'tutor moves %d, expected 34 (sheet 33 Hardcore + data.js Uproar)' % len(tutors))
    # care packages: every item the sheet gives in Hardcore (not red / blue, not unobtainable) has its line
    care = [x for n, ls in lines.items() for x in ls if x.startswith('Also: Care package')]
    given = 0
    for row, cells in items.tab('Care Packages'):
        for col, (text, font, fill) in cells.items():
            m = re.match(r'^(.+?) \[x\d+\]$', items.fix(text))
            if m and fill not in (items.RED, items.BLUE):
                item = items.name(m.group(1)) or m.group(1)
                if item not in items.HC_UNOBTAINABLE and items.box_of(item)[0] != items.NOT_LISTED:
                    given += 1
    expect(len(care) == given, 'care package lines %d, the sheet gives %d listed items' % (len(care), given))
    # every data.js shop stocks a line: Any Poké Mart for the marts' common stock
    expect(any('Shop: Any Poké Mart' in x for x in lines.get('Ultra Ball', [])), 'no Any Poké Mart line')
    # pickups: each Found / Also line has a pickup key; shops and wild lines none
    for box in D['IT']:
        for r in box['r']:
            if box['n'] in ('Move Tutors', 'Useful NPCs'):
                continue
            for text, k in zip(r[1].splitlines(), r[5]):
                expect(bool(k) == bool(re.match(r'(Found|Also):', text)) or box['n'] in items.UNIQUE | {'Key Items'},
                       'pickup key %r on %s: %s' % (k, r[0], text))
    # item text: every shown item has a description
    shown = {n for n, (box, r) in rows.items() if box not in ('TMs and HMs', 'Move Tutors', 'Useful NPCs')}
    expect(not [n for n in shown if not D.get('IX', {}).get(n, [''])[0]],
           'items with no description: %s' % sorted(n for n in shown if not D.get('IX', {}).get(n, [''])[0]))
    print('items: %d rows, %d machines, %d Mega Stones, %d tutor moves, %d care package lines' % (
        len(rows), len(have), len(megas) - len(unplaced), len(tutors), len(care)))


check_items()
if FAIL:
    print('FAIL radical-red extract-check:\n  ' + '\n  '.join(FAIL))
    sys.exit(1)
print('OK radical-red extract-check')

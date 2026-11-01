"""Radical Red extract checks: data.json against data.js and the author's sheets. One function per tab; each unit
adds its own. Usage: uv run python -I hacks/radical-red/extract/check.py

Locations (LOC / AR / P.w / P.g): every data.js area is a sublocation, every encounter in data.js is a P.w row of its
area, every area is in one tracker place, and every row resolves to a dex species; the locations sheet's additions
(sheet_locs.json) are all placed: Starter choice, Mystery Gift place, gift levels, trade wants, egg pools,
unobtainables."""
from pathlib import Path
import json
import re
import sys
from collections import Counter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import DATA, sid   # noqa: E402
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



METHODS = {'Grass/cave', 'Surf', 'Old Rod', 'Good Rod', 'Super Rod', 'Rock Smash', 'Raid', 'Static', 'Gift',
           'Trade', 'Roaming', 'Starter choice', 'Shard trade', 'Shard egg', 'Fossil (pick one)', 'Mystery Gift',
           'Wonder Egg', 'Paldea Egg', 'Sevii Egg'}
SHEET = json.loads((HERE / 'sheet_locs.json').read_text(encoding='utf-8'))


def expected_pairs():
    """(area index, species id) for every encounter entry in data.js (wild lists, raids, fixed tables)."""
    pairs = set()
    for area, record in enumerate(DATA['areas']):
        for key, table in record.items():
            if not isinstance(table, dict) or key in ('item-standard', 'item-hidden', 'item-cheat', 'item-shop',
                                                       'trainers', 'tutors'):
                continue
            for entries in table.values():
                for entry in entries:
                    if key.startswith('wild'):
                        values = [entry[0]]
                    elif key.startswith('raid'):
                        values = [entry[0]]
                    else:
                        values = [entry] if isinstance(entry, int) else []
                    for value in values:
                        pairs.add((area, sid(str(value))))
    return pairs


def check_locations(data, failures):
    areas = DATA['areas']
    if data['LOC'] != [area['name'] for area in areas] + [SHEET['mystery']['area']]:
        failures.append('LOC is not the %d data.js areas then the Mystery Gift place' % len(areas))
    covered = Counter(index for place in data['AR'] for index in place['l'])
    if sorted(covered) != list(range(len(data['LOC']))) or any(count != 1 for count in covered.values()):
        failures.append('AR.l does not place every LOC exactly once')
    ids = {mon['id'] for mon in data['P']}
    rows = {(row[0], mon['id']) for mon in data['P'] for row in mon['w']}
    for mon in data['P']:
        for row in mon['w']:
            if not 0 <= row[0] < len(data['LOC']):
                failures.append('%s: P.w LOC index %s out of range' % (mon['id'], row[0]))
            if row[1] not in METHODS:
                failures.append('%s: unknown P.w method %r' % (mon['id'], row[1]))
    for place in data['AR']:
        for section in place.get('es', []):
            for group in section['g']:
                for row in group['rows']:
                    if row['p'] not in ids:
                        failures.append('encounter species %r does not resolve' % row['p'])
    missing = sorted(pair for pair in expected_pairs() if pair not in rows and pair[1] is not None)
    if missing:
        failures.append('%d data.js encounters have no P.w row, e.g. %s' % (len(missing), missing[:5]))
    unresolved = sorted(area for area, species in expected_pairs() if species is None)
    if unresolved:
        failures.append('%d data.js encounter species do not resolve' % len(unresolved))
    obtainable = sum(mon['g'] == 0 for mon in data['P'])
    if not obtainable:
        failures.append('no obtainable species')
    check_sheet(data, failures)


def check_sheet(data, failures):
    by_id = {mon['id']: mon for mon in data['P']}
    loc = {name: index for index, name in enumerate(data['LOC'])}
    starters = [mon['id'] for mon in data['P'] if any(row[1] == 'Starter choice' for row in mon['w'])]
    lab = [place for place in data['AR'] if place.get('st')]
    if len(starters) != 27 or len(lab) != 1 or lab[0]['l'] != [loc[SHEET['starter']]]:
        failures.append('starter choice: %d species, %d starter places' % (len(starters), len(lab)))
    gift = loc[SHEET['mystery']['area']]
    place = next(place for place in data['AR'] if place['l'] == [gift])
    for name, _ in SHEET['mystery']['rows']:
        if not any(row[0] == gift and row[1] == 'Mystery Gift' and row[3] == '85' for row in by_id[sid(name)]['w']):
            failures.append('Mystery Gift %s has no Lv 85 row' % name)
    if not place.get('ns') or not place.get('es'):
        failures.append('Mystery Gift place should have encounters and no tracker slot')
    for area, mons in SHEET['gifts'].items():
        for name, (level, how) in mons.items():
            if not any(row[0] == loc[area] and row[1] == 'Gift' and row[3] == str(level) and how in row[4]
                       for row in by_id[sid(name)]['w']):
                failures.append('gift %s at %s has no Lv %d row' % (name, area, level))
    for area, wanted in SHEET['trades'].items():
        if not any(row[0] == loc[area] and row[1] == 'Trade' and row[4].endswith('for a ' + wanted)
                   for mon in data['P'] for row in mon['w']):
            failures.append('trade at %s does not say it wants %s' % (area, wanted))
    for egg in SHEET['eggs']:
        rate = '1 of %d' % len(egg['species'])
        for area, _, _ in egg['areas']:
            lacking = [name for name in egg['species'] if not any(
                row[0] == loc[area] and row[1] == egg['method'] and row[2] == rate for row in by_id[sid(name)]['w'])]
            if lacking:
                failures.append('%s at %s: %d species without a row, e.g. %s' % (egg['method'], area, len(lacking),
                                                                                lacking[:3]))
    unobtainable = {sid(name) for name in SHEET['unobtainable']}
    missing = sorted(mon['id'] for mon in data['P']
                     if mon['g'] == 3 and not mon.get('fc') and mon['id'] not in unobtainable)
    if missing:
        failures.append('%d species not found that the sheet calls available, e.g. %s' % (len(missing), missing[:5]))
    for name in SHEET['unobtainable']:
        if by_id[sid(name)]['g'] != 3:
            failures.append('%s should be unobtainable (g 3)' % name)



check_items()
check_locations(D, FAIL)
if FAIL:
    print('FAIL radical-red extract-check:\n  ' + '\n  '.join(FAIL))
    sys.exit(1)
print('OK radical-red extract-check')

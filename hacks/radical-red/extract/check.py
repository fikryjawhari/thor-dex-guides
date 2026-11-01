"""Source-backed radical-red checks, including baseline comparisons.

Locations (LOC / AR / P.w / P.g): every data.js area is a sublocation, every encounter in data.js is a P.w row of its
area, every area is in one tracker place, and every row resolves to a dex species; the locations sheet's additions
(sheet_locs.json) are all placed: Starter choice, Mystery Gift place, gift levels, trade wants, egg pools,
unobtainables.
"""
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import DATA, sid   # noqa: E402

data_path = HERE.parents[0] / 'data.json'
if not data_path.is_file():
    print('SKIP radical-red extract-check: no data.json')
    sys.exit(0)

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
    for name in SHEET['unobtainable']:
        if by_id[sid(name)]['g'] != 3:
            failures.append('%s should be unobtainable (g 3)' % name)


def main():
    data = json.loads(data_path.read_text(encoding='utf-8'))
    failures = []
    check_locations(data, failures)
    # TODO: trainers, items, walkthrough and save-ID checks (their units add them)
    for line in failures:
        print('FAIL radical-red extract-check: %s' % line)
    if failures:
        sys.exit(1)
    print('OK radical-red extract-check: locations (%d areas, %d places, %d rows)' % (
        len(data['LOC']), len(data['AR']), sum(len(mon['w']) for mon in data['P'])))


if __name__ == '__main__':
    main()

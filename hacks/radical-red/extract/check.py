"""Source-backed radical-red checks, including baseline comparisons.

Locations (LOC / AR / P.w / P.g): every data.js area is a sublocation, every encounter in data.js is a P.w row of its
area, every area is in one tracker place, and every row resolves to a dex species.
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
           'Gift (pick one)', 'Trade', 'Roaming'}


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
    if len(data['LOC']) != len(areas):
        failures.append('LOC has %d rows, data.js has %d areas' % (len(data['LOC']), len(areas)))
    covered = Counter(index for place in data['AR'] for index in place['l'])
    if sorted(covered) != list(range(len(areas))) or any(count != 1 for count in covered.values()):
        failures.append('AR.l does not place every LOC exactly once')
    ids = {mon['id'] for mon in data['P']}
    rows = {(row[0], mon['id']) for mon in data['P'] for row in mon['w']}
    for mon in data['P']:
        for row in mon['w']:
            if not 0 <= row[0] < len(areas):
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

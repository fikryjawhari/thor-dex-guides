"""Locations (LOC, AR, P.w, P.g) from data.js areas, in game order (index = data.js area index).

LOC: one sublocation per data.js area (floors and rooms are their own sublocations). AR: one tracker slot per place,
the area name with its floor / room suffix removed (Mt. Moon 1F, B1F, B2F -> Mt. Moon), each slot listing its
sublocations in LOC. Encounter sections (AR.es) are per sublocation and table: Grass/cave, Water (surf, rods, Rock
Smash), Other (raids, statics, gifts, trades, roaming).

Each data.js encounter key holds {cap step: entries}. The step is the progression step the content unlocks at; its
Hardcore level cap is written into the group label ("· cap 22") and the row notes, since the template has no per-row
cap field. Grass uses FRLG's 12 slot rates, surf / Rock Smash its 5, the rods their 2 / 3 / 5 (Old / Good / Super).
Raid rows keep the den's 12 drop items (names, 0 dropped) in the note.

Availability (P.g): 0 obtainable = found in a location, or the species' base form (first non-form entry of its dex
number) is found, or it evolves from an obtainable species; 3 not found (trainer-only or unobtainable).
Megas keep g 1 (prune.py decides them from their bases).
"""
import re
from collections import defaultdict

from common import DATA, cap, item, report, sid

GRASS = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1]          # FRLG grass / cave slot rates (day and night)
WATER = [60, 30, 5, 4, 1]                                  # Surf and Rock Smash
RODS = {'oldRod': ('Old Rod', [70, 30]), 'goodRod': ('Good Rod', [60, 20, 20]),
        'superRod': ('Super Rod', [40, 40, 15, 4, 1])}
FLOOR = re.compile(r'\s+(?:B?\d+F|Room \d+)$')
KIND = {'grass': 'grass', 'water': 'water', 'other': 'other'}


def place_name(name):
    """Mt. Moon B2F -> Mt. Moon; S.S. Anne 1F Room 3 -> S.S. Anne."""
    while True:
        short = FLOOR.sub('', name)
        if short == name:
            return name
        name = short


def level_text(low, high):
    return str(low) if low == high else '%d–%d' % (low, high)


def build(data):
    areas = DATA['areas']
    data['LOC'] = [record['name'] for record in areas]
    data['AR'] = []
    place_index = {}
    place_of = []
    for index, record in enumerate(areas):
        name = place_name(record['name'])
        if name not in place_index:
            place_index[name] = len(data['AR'])
            data['AR'].append({'n': name, 'l': []})
        data['AR'][place_index[name]]['l'].append(index)
        place_of.append(place_index[name])

    by_id = {mon['id']: mon for mon in data['P']}
    groups = {}         # (area, kind, method, cap step) -> {species id: row}
    counts = defaultdict(int)

    def add(area, kind, method, step, species, rate=None, col=None, low=None, high=None, note=None):
        group = groups.setdefault((area, kind, method, step), {})
        row = group.setdefault(species, {'r': [0, 0], 'lv': [], 'note': []})
        if rate is not None:
            if col is None:
                row['r'] = [row['r'][0] + rate, row['r'][1] + rate]
            else:
                row['r'][col] += rate
        if low is not None:
            row['lv'].append((low, high))
        if note and note not in row['note']:
            row['note'].append(note)
        counts[method] += 1

    def sid_of(value):
        found = sid(str(value))
        if found is None or found not in by_id:
            raise ValueError('Radical Red location species %s is not in the dex' % value)
        return found

    for area, record in enumerate(areas):
        for key, table in record.items():
            if not isinstance(table, dict):
                continue
            for step_key, entries in table.items():
                step = int(step_key)
                cap_note = 'cap %d' % cap(step)
                if key in ('wild-day', 'wild-night'):
                    col = 0 if key == 'wild-day' else 1
                    rates = GRASS
                    if len(entries) != len(rates):
                        report('locs: %s %s step %s has %d slots (expected %d)' % (record['name'], key, step,
                                                                                    len(entries), len(rates)))
                    for rate, (value, low, high) in zip(rates, entries):
                        add(area, 'grass', 'Grass/cave', step, sid_of(value), rate, col, low, high, cap_note)
                elif key == 'wild-surf' or key == 'wild-smash':
                    method = 'Surf' if key == 'wild-surf' else 'Rock Smash'
                    for rate, (value, low, high) in zip(WATER, entries):
                        add(area, 'water', method, step, sid_of(value), rate, None, low, high, cap_note)
                elif key in ('wild-oldRod', 'wild-goodRod', 'wild-superRod'):
                    method, rates = RODS[key[5:]]
                    for rate, (value, low, high) in zip(rates, entries):
                        add(area, 'water', method, step, sid_of(value), rate, None, low, high, cap_note)
                elif key.startswith('raid'):
                    stars = key[4:]
                    for value, drops in entries:
                        names = list(dict.fromkeys(item(x) for x in drops if x))
                        note = '%s★ den' % stars + ('; drops ' + ', '.join(names) if names else '')
                        add(area, 'other', 'Raid', step, sid_of(value), note=note + '; ' + cap_note)
                elif key == 'fixed-overworld':
                    for value in entries:
                        add(area, 'other', 'Static', step, sid_of(value), note=cap_note)
                elif key == 'fixed-gift':
                    pick = len(entries) > 1
                    for value in entries:
                        add(area, 'other', 'Gift', step, sid_of(value), note=cap_note)
                        if pick:
                            groups[(area, 'other', 'Gift', step)][sid_of(value)]['pick'] = len(entries)
                elif key == 'fixed-trade':
                    for value in entries:
                        add(area, 'other', 'Trade', step, sid_of(value), note=cap_note)
                elif key == 'fixed-roaming':
                    for value in entries:
                        add(area, 'other', 'Roaming', step, sid_of(value), note=cap_note)
                        groups[(area, 'other', 'Roaming', step)][sid_of(value)]['pick'] = len(entries)

    sections = {}
    for (area, kind, method, step), rows in sorted(groups.items()):
        ar = place_of[area]
        section = sections.setdefault((ar, area, kind), {'n': areas[area]['name'], 'k': KIND[kind], 'g': []})
        levels = [v for row in rows.values() for v in row['lv']]
        low = min((v[0] for v in levels), default=None)
        high = max((v[1] for v in levels), default=None)
        label = method + (' (pick one)' if any(row.get('pick') for row in rows.values()) and method == 'Gift' else '')
        group = {'m': '%s · cap %d' % (label, cap(step)), 'rows': []}
        if low is not None:
            group['lv'] = level_text(low, high)
        for species, row in rows.items():
            group['rows'].append({'p': species, 'r': row['r'], 'note': '; '.join(row['note'])})
            pick = row.get('pick')
            rate = '%d%% day / %d%% night' % tuple(row['r']) if all(row['r']) and row['r'][0] != row['r'][1] \
                else '%d%%' % (row['r'][0] or row['r'][1]) if any(row['r']) else ''
            if pick:
                rate = '1 of %d' % pick
            data_note = '; '.join(row['note'])
            if row['r'][0] and not row['r'][1]:
                data_note = 'Day; ' + data_note
            elif row['r'][1] and not row['r'][0]:
                data_note = 'Night; ' + data_note
            lv = level_text(min(v[0] for v in row['lv']), max(v[1] for v in row['lv'])) if row['lv'] else ''
            by_id[species]['w'].append([area, method, rate, lv, data_note.strip('; ')])
        section['g'].append(group)
        data['AR'][ar].setdefault('es', [])
        if section not in data['AR'][ar]['es']:
            data['AR'][ar]['es'].append(section)

    for ar in data['AR']:
        if not ar.get('es'):
            ar['ns'] = 1

    found = {mon['id'] for mon in data['P'] if mon['w']}
    first = {}
    for mon in data['P']:
        if not mon.get('fc') and mon['g'] != 1:
            first.setdefault(mon['dex'], mon['id'])
    obtainable = {mon['id'] for mon in data['P'] if mon['id'] in found or first.get(mon['dex']) in found}
    changed = True
    while changed:
        changed = False
        for mon in data['P']:
            if mon['g'] == 1 or mon['id'] in obtainable:
                continue
            if any(parent in obtainable for _, parent in mon['ef']):
                obtainable.add(mon['id'])
                changed = True
    for mon in data['P']:
        if mon['g'] != 1:
            mon['g'] = 0 if mon['id'] in obtainable else 3
    report('locs: %d areas in %d places, %d sublocation rows, %d obtainable species' % (
        len(areas), len(data['AR']), sum(counts.values()), sum(mon['g'] == 0 for mon in data['P'])))

"""Locations (LOC, AR, P.w, P.g) from data.js areas, in game order (index = data.js area index).

LOC: one sublocation per data.js area (floors and rooms are their own sublocations). AR: one tracker slot per place,
the area name with its floor / room suffix removed (Mt. Moon 1F, B1F, B2F -> Mt. Moon), each slot listing its
sublocations in LOC. Encounter sections (AR.es) are per sublocation and table: Grass/cave, Water (surf, rods, Rock
Smash), Other (raids, statics, gifts, trades, roaming).

Each data.js encounter key holds {cap step: entries}. The step is the progression step the content unlocks at; its
Hardcore level cap is written into the group label ("· cap 22") and the row notes, since the template has no per-row
cap field. Grass uses FRLG's 12 slot rates, surf / Rock Smash its 5, the rods their 2 / 3 / 5 (Old / Good / Super).
Raid rows keep the den's 12 drop items (names, 0 dropped) in the note.

The locations sheet adds what data.js lacks (extract/sheet_locs.json, hand-copied; notes.md -> Locations): Oak's Lab's
list as the Starter choice (AR.st), gift levels and how to get them, the shard each Fan Club fossil / Celadon egg costs,
the Mt. Moon fossil pair, what each trade NPC wants, water tables data.js has none for ("Doc only"), the Mystery Gift
legendaries (an AR place with no tracker slot, its LOC after the data.js areas) and the sheet's unobtainables.

Availability (P.g): 0 obtainable = found in a location, or the species' base form (first non-form entry of its dex
number) is found, or it evolves from an obtainable species; 3 not found (trainer-only or unobtainable).
Megas keep g 1 (prune.py decides them from their bases).
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from common import DATA, cap, item, report, sid

SHEET = json.loads(Path(__file__).with_name('sheet_locs.json').read_text(encoding='utf-8'))

GRASS = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1]          # FRLG grass / cave slot rates (day and night)
WATER = [60, 30, 5, 4, 1]                                  # Surf and Rock Smash
RODS = {'oldRod': ('Old Rod', [70, 30]), 'goodRod': ('Good Rod', [60, 20, 20]),
        'superRod': ('Super Rod', [40, 40, 15, 4, 1])}
FLOOR = re.compile(r'\s+(?:B?\d+F|Room \d+)$')
KIND = {'grass': 'grass', 'water': 'water', 'other': 'other'}
NO_CAP = {'Starter choice', 'Mystery Gift'}       # group labels without "· cap N"
DOC_ONLY = 'Doc only (not in the game data)'


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
    data['LOC'] = [record['name'] for record in areas] + [SHEET['mystery']['area']]
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
    gift_area = len(areas)
    place_of.append(len(data['AR']))
    data['AR'].append({'n': SHEET['mystery']['area'], 'l': [gift_area], 'ns': 1, 'note': SHEET['mystery']['how']})
    area_index = {name: index for index, name in enumerate(data['LOC'])}

    by_id = {mon['id']: mon for mon in data['P']}
    groups = {}         # (area, kind, method, cap step) -> {species id: row}
    counts = defaultdict(int)
    sheet_counts = Counter()

    def add(area, kind, method, step, species, rate=None, col=None, low=None, high=None, note=None, pick=None):
        group = groups.setdefault((area, kind, method, step), {})
        row = group.setdefault(species, {'r': [0, 0], 'lv': [], 'note': []})
        if pick:
            row['pick'] = pick
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

    def note_row(row, note):
        if note and note not in row['note']:
            row['note'].append(note)

    def shard_rows(area, step, shard, listed):
        """data.js's one gift list split by the shard each costs (random: one of the colour's list at random)."""
        placed = set()
        for colour, names in shard['colours'].items():
            for name in names:
                cap_forms = name == 'Any Cap'
                for species in [sid_of(x) for x in shard['any']] if cap_forms else [sid_of(name)]:
                    placed.add(species)
                    add(area, 'other', shard['method'], step, species, note='cap %d' % cap(step),
                        pick=len(names) if shard['random'] else None)
                    row = groups[(area, 'other', shard['method'], step)][species]
                    note_row(row, shard['how'] % colour)
                    if cap_forms:
                        note_row(row, 'Any Cap: one slot for the %d cap Pikachu' % len(shard['any']))
                    if species not in listed:
                        note_row(row, DOC_ONLY)
                        sheet_counts['sheet shard rows data.js lacks'] += 1
        for species in listed:
            if species not in placed:
                add(area, 'other', shard['method'], step, species, note='cap %d' % cap(step))
                note_row(groups[(area, 'other', shard['method'], step)][species], "Doc doesn't list it")
                sheet_counts['sheet shard rows the doc lacks'] += 1

    def rows_of(name, species, methods=None):
        """The rows of species in a data.js area (by name), optionally only for those methods."""
        found = [rows[species] for (a, _, method, _), rows in groups.items()
                 if a == area_index[name] and species in rows and (methods is None or method in methods)]
        if not found:
            raise ValueError('sheet_locs: %s has no %s row' % (name, species))
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
                elif key == 'fixed-gift' and record['name'] == SHEET['starter']:
                    for value in entries:
                        add(area, 'other', 'Starter choice', step, sid_of(value), note='at the start',
                            pick=len(entries))
                elif key == 'fixed-gift' and record['name'] in SHEET['shards'] and len(entries) > 1:
                    shard_rows(area, step, SHEET['shards'][record['name']], [sid_of(value) for value in entries])
                elif key == 'fixed-gift':
                    for value in entries:
                        add(area, 'other', 'Gift', step, sid_of(value), note=cap_note,
                            pick=len(entries) if len(entries) > 1 else None)
                elif key == 'fixed-trade':
                    for value in entries:
                        add(area, 'other', 'Trade', step, sid_of(value), note=cap_note)
                elif key == 'fixed-roaming':
                    for value in entries:
                        add(area, 'other', 'Roaming', step, sid_of(value), note=cap_note)
                        groups[(area, 'other', 'Roaming', step)][sid_of(value)]['pick'] = len(entries)

    # The locations sheet (sheet_locs.json)
    for name, mons in SHEET['gifts'].items():
        for species, (level, how) in mons.items():
            for row in rows_of(name, sid_of(species), ('Gift',)):
                row['lv'].append((level, level))
                note_row(row, how)
                sheet_counts['sheet gift levels'] += 1
    for extra in SHEET['add']:
        area = area_index[extra['area']]
        pick = len(extra['rows']) if '(pick one)' in extra['method'] else None
        for species, level, how in extra['rows']:
            add(area, 'other', extra['method'], extra['step'], sid_of(species), low=level, high=level,
                note='cap %d' % cap(extra['step']), pick=pick)
            note_row(groups[(area, 'other', extra['method'], extra['step'])][sid_of(species)], how)
            sheet_counts['sheet rows added'] += 1
    for name, mons in SHEET['notes'].items():
        for species, how in mons.items():
            for row in rows_of(name, sid_of(species)):
                note_row(row, how)
    for name, wanted in SHEET['trades'].items():
        trades = [rows for (a, _, method, _), rows in groups.items() if a == area_index[name] and method == 'Trade']
        if len(trades) != 1 or len(trades[0]) != 1:
            raise ValueError('sheet_locs: %s should have one trade' % name)
        note_row(next(iter(trades[0].values())), 'for a %s' % wanted)
    steps = defaultdict(Counter)        # (wild table key, lowest level) -> the data.js steps it has
    for record in areas:
        for key, table in record.items():
            if key.startswith('wild-') and isinstance(table, dict):
                for step_key, entries in table.items():
                    steps[(key, min(entry[1] for entry in entries))][int(step_key)] += 1
    for table in SHEET['tables']:
        area, key = area_index[table['area']], table['key']
        levels = [[int(x) for x in level.split('–')] for _, _, level in table['rows']]
        step = steps[(key, min(low for low, _ in levels))].most_common(1)[0][0]
        method = 'Surf' if key == 'wild-surf' else RODS[key[5:]][0]
        for (rate, species, _), (low, high) in zip(table['rows'], levels):
            add(area, 'water', method, step, sid_of(species), rate, None, low, high, 'cap %d' % cap(step))
            note_row(groups[(area, 'water', method, step)][sid_of(species)], DOC_ONLY)
        sheet_counts['sheet tables added'] += 1
    gift = SHEET['mystery']
    for species, extra in gift['rows']:
        add(gift_area, 'other', 'Mystery Gift', gift['step'], sid_of(species), low=gift['level'], high=gift['level'],
            note=gift['how'])
        note_row(groups[(gift_area, 'other', 'Mystery Gift', gift['step'])][sid_of(species)], extra)

    sections = {}
    for (area, kind, method, step), rows in sorted(groups.items()):
        ar = place_of[area]
        section = sections.setdefault((ar, area, kind), {'n': data['LOC'][area], 'k': KIND[kind], 'g': []})
        levels = [v for row in rows.values() for v in row['lv']]
        low = min((v[0] for v in levels), default=None)
        high = max((v[1] for v in levels), default=None)
        label = method + (' (pick one)' if any(row.get('pick') for row in rows.values()) and method == 'Gift' else '')
        group = {'m': label if method in NO_CAP else '%s · cap %d' % (label, cap(step)), 'rows': []}
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
        if ar['l'] == [area_index[SHEET['starter']]]:
            ar['st'] = 1

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
    obtainable -= {sid_of(name) for name in SHEET['unobtainable']}
    for mon in data['P']:
        if mon['g'] != 1:
            mon['g'] = 0 if mon['id'] in obtainable else 3
    for what, count in sorted(sheet_counts.items()):
        if what.startswith('sheet'):
            report('locs: %s: %d' % (what, count))
    report('locs: %d areas in %d places, %d sublocation rows, %d obtainable species' % (
        len(areas), len(data['AR']), sum(counts.values()), sum(mon['g'] == 0 for mon in data['P'])))

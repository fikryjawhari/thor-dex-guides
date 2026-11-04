"""Locations (LOC, AR, P.w, P.g) from data.js areas, in game order (index = data.js area index).

LOC: one sublocation per data.js area (floors and rooms are their own sublocations). AR: one tracker slot per place,
the area name with its floor / room suffix removed (Mt. Moon 1F, B1F, B2F -> Mt. Moon), each slot listing its
sublocations in LOC. Encounter sections (AR.es) are per sublocation and table: Grass/cave, Water (surf, rods, Rock
Smash), Other (raids, statics, gifts, trades, roaming).

Each data.js encounter key holds {cap step: entries}. The step is the progression step the content unlocks at; its
Hardcore level cap is written into the group label ("· cap 22") and the row notes, since the template has no per-row
cap field. Grass uses FRLG's 12 slot rates, surf / Rock Smash its 5, the rods their 2 / 3 / 5 (Old / Good / Super).
Raid rows keep the den's 12 drop items in the note with each slot's chance (100/80/80/50/50/30/30/25/25/5/4/1%, the
sheet's Raid Dens tab; an item in two slots shows both, "Big Nugget 80/80%"; 0 = no drop).

The locations sheet adds what data.js lacks (extract/sheet_locs.json, hand-copied; notes.md -> Locations): Oak's Lab's
list as the Starter choice (AR.st), gift levels and how to get them, the shard each Fan Club fossil / Celadon egg costs,
the Mt. Moon fossil pair, what each trade NPC wants, water tables data.js has none for ("Doc only"), which egg each
vendor place sells (Wonder / Paldea / Sevii: an AR note; the pools are not listed, the user's call; a species only an
egg gives keeps one P.w row naming the egg type, so it stays obtainable), the Mystery Gift legendaries (an AR place with no
tracker slot, its LOC after the data.js areas) and the sheet's unobtainables.

Availability (P.g): 0 obtainable = found in a location, or the species' base form (first non-form entry of its dex
number) is found, or it evolves from an obtainable species, or it is the pre-evolution of one (breeding), or a form in
sheet_locs.json -> follow whose base is obtainable; 3 not found or on the sheet's Unobtainables tab. Megas keep g 1
(prune.py decides them from their bases).
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from common import DATA, cap, item, report, sid
import encstd

SHEET = json.loads(Path(__file__).with_name('sheet_locs.json').read_text(encoding='utf-8'))

GRASS = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1]          # FRLG grass / cave slot rates (day and night)
WATER = [60, 30, 5, 4, 1]                                  # Surf and Rock Smash
RODS = {'oldRod': ('Old Rod', [70, 30]), 'goodRod': ('Good Rod', [60, 20, 20]),
        'superRod': ('Super Rod', [40, 40, 15, 4, 1])}
FLOOR = re.compile(r'\s+(?:B?\d+F|Room \d+)$')
RAID_DROPS = [100, 80, 80, 50, 50, 30, 30, 25, 25, 5, 4, 1]   # the 12 drop slots' chances (sheet, Raid Dens tab)
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
                    method = '%s %s' % (colour, shard['method'].split()[-1])     # one choice per shard: Green Shard egg
                    add(area, 'other', method, step, species, pick=len(names) if shard['random'] else None)
                    row = groups[(area, 'other', method, step)][species]
                    note_row(row, shard['how'] % colour)
                    if cap_forms:
                        note_row(row, 'Any Cap: one slot for the %d cap Pikachu' % len(shard['any']))
                    if species not in listed:
                        note_row(row, DOC_ONLY)
                        sheet_counts['sheet shard rows data.js lacks'] += 1
        for species in listed:
            if species not in placed:
                add(area, 'other', shard['method'], step, species)
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
                if key in ('wild-day', 'wild-night'):
                    col = 0 if key == 'wild-day' else 1
                    rates = GRASS
                    if len(entries) != len(rates):
                        report('locs: %s %s step %s has %d slots (expected %d)' % (record['name'], key, step,
                                                                                    len(entries), len(rates)))
                    for rate, (value, low, high) in zip(rates, entries):
                        add(area, 'grass', 'Grass/cave', step, sid_of(value), rate, col, low, high)
                elif key == 'wild-surf' or key == 'wild-smash':
                    method = 'Surf' if key == 'wild-surf' else 'Rock Smash'
                    for rate, (value, low, high) in zip(WATER, entries):
                        add(area, 'water', method, step, sid_of(value), rate, None, low, high)
                elif key in ('wild-oldRod', 'wild-goodRod', 'wild-superRod'):
                    method, rates = RODS[key[5:]]
                    for rate, (value, low, high) in zip(rates, entries):
                        add(area, 'water', method, step, sid_of(value), rate, None, low, high)
                elif key.startswith('raid'):
                    stars = key[4:]
                    for value, drops in entries:
                        if len(drops) != len(RAID_DROPS):
                            raise ValueError('%s %s: %d raid drops' % (record['name'], key, len(drops)))
                        chances = defaultdict(list)
                        for chance, drop in zip(RAID_DROPS, drops):
                            if drop:
                                chances[item(drop)].append(str(chance))
                        names = ['%s %s%%' % (name, '/'.join(rates)) for name, rates in chances.items()]
                        add(area, 'other', '%s★ raid' % stars, step, sid_of(value))
                        groups[(area, 'other', '%s★ raid' % stars, step)][sid_of(value)]['drops'] = ', '.join(names)
                elif key == 'fixed-overworld':
                    for value in entries:
                        add(area, 'other', 'Static', step, sid_of(value))
                elif key == 'fixed-gift' and record['name'] == SHEET['starter']:
                    for value in entries:
                        add(area, 'other', 'Starter choice', step, sid_of(value))
                elif key == 'fixed-gift' and record['name'] in SHEET['shards'] and len(entries) > 1:
                    shard_rows(area, step, SHEET['shards'][record['name']], [sid_of(value) for value in entries])
                elif key == 'fixed-gift':
                    for value in entries:
                        add(area, 'other', 'Gift', step, sid_of(value), pick=len(entries) if len(entries) > 1 else None)
                elif key == 'fixed-trade':
                    for value in entries:
                        add(area, 'other', 'Trade', step, sid_of(value))
                elif key == 'fixed-roaming':
                    for value in entries:
                        add(area, 'other', 'Roaming', step, sid_of(value))
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
            add(area, 'other', extra['method'], extra['step'], sid_of(species), low=level, high=level, pick=pick)
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
            add(area, 'water', method, step, sid_of(species), rate, None, low, high)
            note_row(groups[(area, 'water', method, step)][sid_of(species)], DOC_ONLY)
        sheet_counts['sheet tables added'] += 1
    gift = SHEET['mystery']
    for species, extra in gift['rows']:
        add(gift_area, 'other', 'Mystery Gift', gift['step'], sid_of(species), low=gift['level'], high=gift['level'])
        note_row(groups[(gift_area, 'other', 'Mystery Gift', gift['step'])][sid_of(species)], extra)
    # Egg vendors: one area note per place naming the egg it sells (the pools are not listed); a species only an egg
    # gives gets one P.w row naming the egg type (below, once availability without eggs is known).
    vendors = defaultdict(dict)         # place -> {how without the egg name: [egg types]}
    egg_of = {}                         # species -> (step, area, method, how, [other places])
    for egg in SHEET['eggs']:
        for name, step, how in egg['areas']:
            vendors[place_of[area_index[name]]].setdefault(how.replace(' (%s)' % egg['method'], ''), [])
            methods = vendors[place_of[area_index[name]]][how.replace(' (%s)' % egg['method'], '')]
            if egg['method'] not in methods:
                methods.append(egg['method'])
            for species in egg['species']:
                first = egg_of.get(sid_of(species))
                if first is None or step < first[0]:
                    egg_of[sid_of(species)] = (step, area_index[name], egg['method'], how,
                                               (first[4] + [first[1]]) if first else [])
                elif area_index[name] not in first[4] and area_index[name] != first[1]:
                    first[4].append(area_index[name])
    for ar, hows in vendors.items():
        data['AR'][ar]['note'] = '; '.join('%s: %s' % (' / '.join(methods), how) for how, methods in hows.items())
        sheet_counts['sheet egg vendor notes'] += 1

    enc, found = standardise(data, groups, place_of, area_index[SHEET['starter']], gift_area)

    first = {}
    for mon in data['P']:
        if not mon.get('fc') and mon['g'] != 1:
            first.setdefault(mon['dex'], mon['id'])
    by_mega = {mon['id'] for mon in data['P'] if mon['g'] == 1}
    follow = {sid_of(form): sid_of(base) for form, base in SHEET['follow'].items()}

    def available():
        obtainable = {mon['id'] for mon in data['P'] if mon['id'] in found or first.get(mon['dex']) in found}
        changed = True
        while changed:
            changed = False
            for mon in data['P']:
                if mon['g'] == 1 or mon['id'] in obtainable:
                    continue
                if any(parent in obtainable for _, parent in mon['ef']) or follow.get(mon['id']) in obtainable:
                    obtainable.add(mon['id'])
                    changed = True
                # breeding: the pre-evolution of an obtainable species hatches from it (Pichu, Cleffa, Azurill ...)
                elif any(child in obtainable and child not in by_mega for _, child in mon['et']):
                    obtainable.add(mon['id'])
                    changed = True
        return obtainable

    without_eggs = available()
    for species, (step, area, method, how, others) in sorted(egg_of.items()):
        if species not in without_eggs:
            also = 'also ' + ', '.join(data['LOC'][a] for a in others) if others else ''
            put(enc, slot_of(data, place_of[area]), step, area, 'gift', species, v=method, loc=area, note='; '.join(
                x for x in (how.replace(' (%s)' % method, ''), also) if x))
            found.add(species)
            sheet_counts['sheet egg-only species'] += 1
    for index, e in enumerate(enc):
        e.write(data, index)
    for mon in data['P']:       # the floor is in the LOC name already (Mt. Moon B1F): the label keeps the method
        for w in mon['w']:
            floor, _, rest = w[1].partition(' · ')
            if rest and floor not in encstd.KIND_NAME.values() and floor in data['LOC'][w[0]]:
                w[1] = rest
    encstd.finish(data)
    obtainable = available() - {sid_of(name) for name in SHEET['unobtainable']}
    for mon in data['P']:
        if mon['g'] != 1:
            mon['g'] = 0 if mon['id'] in obtainable else 3
    for what, count in sorted(sheet_counts.items()):
        if what.startswith('sheet'):
            report('locs: %s: %d' % (what, count))
    report('locs: %d areas in %d places, %d sublocation rows, %d obtainable species' % (
        len(areas), len(data['AR']), sum(counts.values()), sum(mon['g'] == 0 for mon in data['P'])))


# The encounter standard (template/README.md → Encounters, tools/encstd.py). Land tables are Cave unless the place is grass (tall
# grass outdoors; data.js only says "Grass/cave"): caves, towers, mansions and the Power Plant walk on floors.
CAVES = ("Diglett's Cave", 'Mt. Moon', 'Rock Tunnel', 'Pokemon Tower', 'Power Plant', 'Seafoam Islands', 'Pokemon Mansion',
         'Cerulean Cave', 'Victory Road', 'Mt Ember Interior', "Safari Zone Moltres' Den")
# Tracker slots that are one met location (FRLG's map sections; the user, 2026-11-04: a town or route is one place,
# its houses, gatehouses, Centers, marts and gyms included; a legendary's room is its dungeon's; only Oak's Lab and the
# Rocket Hideout are buildings of their own). One line per slot: its name | the AR names, the first is the slot (it
# keeps that area's index and tracker entry), '*' = every place named "<slot> ..." | the prefix that comes off a member's
# name for its floor heading (default "<slot> ").
MERGE_TABLE = """
Pallet Town|Pallet Town,Pallet Town Player's House,Pallet Town Rival's House
Viridian City|Viridian City,*
Viridian Forest|Viridian Forest,Viridian Forest Heart
Pewter City|Pewter City,*
Route 2|Route 2,*
Route 4|Route 4,*
Cerulean City|Cerulean City,*
Route 25|Route 25,*
Route 5|Route 5,*,Underground Path Route 5 Entrance
Vermilion City|Vermilion City,*
S.S. Anne|S.S. Anne Port,S.S. Anne,*
Underground Path|Underground Path Vertical,Underground Path Horizontal
Route 11|Route 11,*
Route 10|Route 10,*
Rock Tunnel|Rock Tunnel,*
Lavender Town|Lavender Town Mr. Fuji's House,Lavender Town EXP Farm,Lavender Town Poke Mart
Route 12|Route 12,*
Celadon City|Celadon City,*
Route 16|Route 16,*
Saffron City|Saffron City,*
Silph Co.|Silph Co.,*
Route 15|Route 15,*
Route 18|Route 18,*
Fuchsia City|Fuchsia City,*
Safari Zone|Safari Zone Area 1,Safari Zone Area 2,Safari Zone Area 3,Safari Zone Area 4,Safari Zone,*
Seafoam Islands|Seafoam Islands,*
Cinnabar Island|Cinnabar Island,*
Route 21|Route 21 North,Route 21 South
Pokemon Mansion|Pokemon Mansion,*
Indigo Plateau|Indigo Plateau League Approach,Pokemon League Lobby,Pokemon League
One Island|One Island,*
Kindle Road|Kindle Road,Ember Spa
Mt. Ember|Mt Ember Exterior,Mt Ember Interior,Mt Ember Interior 2,Mt Ember Interior 3,Mt Ember Interior 4,Mt Ember Summit|Mt Ember 
Two Island|Two Island,*
Cape Brink|Cape Brink,*
Three Island|Three Island,*
"""
MERGES = [(f[0], (f[2] if len(f) > 2 else f[0] + ' '), f[1].split(','))
          for f in (line.split('|') for line in MERGE_TABLE.strip().splitlines())]
# A legendary's room: its static is in the place's main list; its wild tables under a small heading of the room's
# name (the user, 2026-11-04: "a special place but don't need their own full box")
MAIN_LIST = {"Rock Tunnel Magearna's Chamber", "Silph Co. Raging Bolt's Office", "Seafoam Islands Kyogre's Chamber",
             "Pokemon Mansion Gouging Fire's Room"}
# Met locations with nothing wild: a tracker slot for an Egg hatched there (the user, 2026-11-04)
EGG_HATCH = 'Egg hatch location.'
OWN_PLACES = ['Rocket Hideout']    # buildings that are a met location of their own (and Oak's Lab, the Starter)
CHIP = {'Surf': 'Su', 'Old Rod': 'O', 'Good Rod': 'G', 'Super Rod': 'S'}
GIFT_V = {'Fossil (pick one)': 'Gift (fossil)'}
STARTER_LOC = "Oak's Lab"          # the Starter card's place (its own met location)
ROAMING = ('Roaming', 'Kanto')     # the Roaming card and its place (LOC)


# Each encounter line's unlock (walk.py: a return visit shows only the lines new since the last one): slot ->
# {(kind, floor, v, chip): [the lowest data.js step, {LOC index}]}
LINES = {}


def put(enc, slot, step, area, kind, species, *args, **kw):
    line = LINES.setdefault(slot, {}).setdefault((kind, kw.get('floor', ''), kw.get('v', ''), kw.get('chip', '')),
                                                 [step, set()])
    line[0] = min(line[0], step)
    line[1].add(area)
    enc[slot].add(kind, species, *args, **kw)


def slot_of(data, ar):
    return data['AR'][ar].get('in', ar)


def standardise(data, groups, place_of, starter_loc, gift_area):
    """data.js / sheet rows -> one encstd.Enc per tracker slot (AR index; written once the egg-only rows are in).
    Merges set AR.in; the Starter and Roaming cards are their own places. Returns ([Enc], species found)."""
    AR, LOC = data['AR'], data['LOC']
    names = [A['n'] for A in AR]
    rows_at = {area for area, *_ in groups}
    prefix = {}
    starter = next(i for i, A in enumerate(AR) if A['l'] == [starter_loc])
    for slot_name, pre, members in MERGES:
        members = [x for n in members for x in ([y for y in names if y.startswith(pre) and y not in members
                                                  and y != names[starter]] if n == '*' else [n])]
        idx = [names.index(n) for n in members]
        assert not any('in' in AR[i] for i in idx), 'locs: %s merged twice' % slot_name
        slot = idx[0]
        before = [i for i in idx if rows_at & set(AR[i]['l'])]
        AR[slot]['n'] = slot_name
        prefix[slot] = pre
        for i in idx[1:]:
            AR[i]['in'] = slot
            if AR[i]['n'].startswith(pre):
                AR[i]['n'] = slot_name + ' ' + AR[i]['n'][len(pre):]
        report('locs: merged %s: tracker slots %d -> 1 (AR %s; %d keeps the slot, members %s)' % (
            slot_name, len(before), ', '.join(map(str, before)), slot, ', '.join(map(str, idx[1:]))))
    AR[starter].update(n='Starter', st=1)
    LOC[starter_loc] = STARTER_LOC
    gift = next(i for i, A in enumerate(AR) if A['l'] == [gift_area])
    LOC.append(ROAMING[1])
    AR.append({'n': ROAMING[0], 'l': [len(LOC) - 1], 'ns': 1})
    roam = len(AR) - 1
    data['ARO'] = [starter] + [i for i in range(len(AR)) if i not in (starter, roam, gift)] + [roam, gift]
    enc = [encstd.Enc() for _ in AR]
    found = set()

    def floor_of(area, slot, kind):
        ls = [li for i, A in enumerate(AR) if i == slot or A.get('in') == slot for li in A['l']]
        if len(ls) < 2:
            return ''
        name, pre = LOC[area], prefix.get(slot) or AR[slot]['n'] + ' '
        if name in MAIN_LIST and kind == 'other':
            return ''
        return name[len(pre):] if name.startswith(pre) else '' if name == pre.strip() else name

    def lv_text(rows, step):
        """A table's (or a row's) level range, with the step's level cap once."""
        levels = [v for row in rows for v in row['lv']]
        if not levels:
            return ''
        return '%s · cap %d' % (level_text(min(v[0] for v in levels), max(v[1] for v in levels)), cap(step))

    for (area, kind, method, step), rows in sorted(groups.items()):
        slot = roam if method.startswith('Roaming') else slot_of(data, place_of[area])
        if slot == roam:            # met wherever it is caught: its place is Kanto, not data.js's Viridian City
            area = AR[roam]['l'][0]
        floor = '' if slot == roam else floor_of(area, slot, kind)
        common = Counter(row.get('drops') for row in rows.values()).most_common(1)[0][0]
        land = 'cave' if LOC[area].startswith(CAVES) else 'grass'
        table_lv = lv_text(rows.values(), step)
        for species, row in rows.items():
            found.add(species)
            note = '; '.join(row['note'])
            pick = '1 of %d' % row['pick'] if row.get('pick') and method != 'Starter choice' else ''
            if pick and row['pick'] != len(rows):    # Yellow Shard: 8 slots, one shared by the 7 cap Pikachu (the
                pick += ' slots'                      # template recounts a plain "1 of N" over the group's rows)
            own_lv = lv_text([row], step)
            where = dict(floor=floor, note=note, loc=area)
            if method == 'Grass/cave':
                for when, rate in zip('dn', row['r']):
                    if rate:
                        put(enc, slot, step, area, land, species, rate, lv=table_lv, when=when, **where)
            elif method in CHIP:
                put(enc, slot, step, area, 'water', species, row['r'][0], lv=table_lv, chip=CHIP[method], **where)
            elif method == 'Rock Smash':
                put(enc, slot, step, area, 'special', species, row['r'][0], lv=table_lv, v='Rock Smash', **where)
            elif method.endswith('raid'):     # the drop list once per tier; a species with other drops says so
                if row['drops'] != common:
                    where['note'] = '; '.join(x for x in (note, 'Drops ' + row['drops'] if row['drops'] else 'No drops') if x)
                put(enc, slot, step, area, 'raid', species, v=method, dr=common, **where)
            elif method == 'Trade':
                put(enc, slot, step, area, 'trade', species, lv=own_lv, **where)
            else:
                v = GIFT_V.get(method, method)
                if LOC[area].endswith('Game Corner Exchange') and v == 'Gift':
                    v = 'Prize'
                put(enc, slot, step, area, 'gift', species, lv=own_lv, v=v, t=pick, **where)
    towns = {AR[i]['n'] for i in prefix} | set(OWN_PLACES)
    hatch = []
    for i, A in enumerate(AR):
        A.pop('es', None)
        if A.get('in') is None and i not in (roam, gift):
            if enc[i].groups:
                A.pop('ns', None)
            elif A['n'] in towns:          # a met location with nothing wild: its slot is for an Egg hatched there
                A.pop('ns', None)
                A['note'] = '; '.join(x for x in (EGG_HATCH, A.get('note')) if x)
                hatch.append(A['n'])
            else:
                A['ns'] = 1
        elif A.get('in') is not None and not (rows_at & set(A['l'])):
            A['ns'] = 1                    # a member that never had a tracker slot (nothing there)
    report('locs: egg hatch slots (no wild Pokémon): ' + ', '.join(hatch))
    return enc, found

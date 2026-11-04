"""Write the encounter standard from Unbound's source-audited location tables."""
import re

from common import WIKI, report
import encstd
from wiki import _rows, item_sections


CAVES = {'Antisis Sewers', 'Cinder Volcano', 'Cinder Volcano Depths', 'Cliff Cave', 'Crystal Peak',
         'Frost Mountain', 'Icicle Cave', 'Icy Hole', 'KBT Expressway', 'Lost Tunnel', 'Ruins of Void',
         'Thundercap Mountain', 'Valley Cave', 'Victory Road'}
LAND = {'Long Grass', 'Cave', 'Grass/cave', 'Open Desert', 'Crystal Cliff', 'Ruins', 'Sewer'}
RODS = {'Old Rod': 'O', 'Good Rod': 'G', 'Super Rod': 'S'}


def method_info(area, floor, method):
    if method in RODS:
        return 'water', '', RODS[method], floor
    for rod, chip in RODS.items():
        if method.endswith(' ' + rod):
            patch = method.removesuffix(' ' + rod)
            return 'water', '', chip, ' · '.join(part for part in (floor, patch) if part)
    if method in ('Surf', 'Underwater', 'Lava Surf'):
        return 'water', {'Underwater': 'Underwater', 'Lava Surf': 'Lava'}.get(method, ''), 'Su', floor
    if method in LAND or 'Flowers' in method:
        cave = method in ('Cave', 'Sewer', 'Ruins') or area in CAVES or 'Cave' in floor or 'Tomb' in floor
        if method != 'Cave' and (any(word in floor for word in ('Exterior', 'Outside', 'Snowy Ascent'))
                                 or method == 'Crystal Cliff'):
            cave = False
        if method == 'Long Grass' or 'Flowers' in method:
            cave = False
        variant = method if 'Flowers' in method else ''
        return 'cave' if cave else 'grass', variant, '', floor
    if method.startswith('DexNav'):
        chip = 'Su' if 'Surf' in method or 'Underwater' in method else ''
        return 'special', 'DexNav', chip, floor
    if method == 'Trade':
        return 'trade', '', '', floor
    if method == 'Starter choice':
        return 'gift', method, '', floor
    if 'Egg' in method or 'egg' in method:
        return 'gift', 'Egg', '', floor
    if method == 'Revived Fossil':
        return 'gift', 'Gift (fossil)', '', floor
    if method.startswith(('Gift', 'Reward')) or method in ('Mystery Gift', 'Game Corner', 'Game Corner Shop', 'Mission Reward'):
        return 'gift', 'Gift', '', floor
    if method.startswith('Static') or method in ('Pick up the Fungus Pokémon in the Woods', 'Mission Encounter'):
        return 'gift', 'Static', '', floor
    if method == 'Roaming':
        return 'gift', 'Roaming', '', floor
    return 'special', method, '', floor


def raid_tables(den):
    raw = WIKI.page(den.title)['html']
    for heading, block in item_sections(raw):
        match = re.match(r'([1-6](?:/[1-6])?)-Star Species \+ Rewards \(Level (\d+-\d+)\)', heading)
        if not match:
            continue
        table = re.search(r'<table\b.*?</table>', block, re.S)
        if not table:
            raise ValueError('Raid rewards table missing: %s / %s' % (den.title, heading))
        rows = _rows(table[0])
        drops = []
        for cells in rows[1:]:
            items = {}
            for species, item in zip(rows[0][1:], cells[1:]):
                if item and item not in ('–', '-'):
                    items.setdefault(item, []).append(species)
            for item, species in items.items():
                detail = '' if len(species) == len(rows[0]) - 1 else ' (%s)' % ', '.join(species)
                drops.append('%s %s%s' % (item, cells[0], detail))
        yield match[1], match[2], '; '.join(drops)


def build(data):
    from locs import AREA_ALIASES, RESPELL, area_name, doc_wild, species_ids, workbook

    areas = data['AR']
    locs = data['LOC']
    by_name = {area['n']: index for index, area in enumerate(areas)}
    target, member = (by_name[name] for name in ('Cinder Volcano', 'Cinder Volcano Depths'))
    encs = [encstd.Enc() for area in areas]
    floors = {page.title: {row[0] for row in page.encounters if row[0]} for page in WIKI.locations()}
    source_rows = [(species['id'], row) for species in data['P'] for row in species['w']]
    doc_places = {}
    for area, place, floor, method, names, colour, cell in doc_wild(workbook())[0]:
        sub = place if place in AREA_ALIASES and place not in RESPELL else ''
        for name in names:
            placement = ' · '.join(part for part in (sub, floor) if part)
            key = (by_name[area], species_ids(name)[0], method)
            if placement not in doc_places.setdefault(key, []):
                doc_places[key].append(placement)

    def add(index, pid, method, floor='', qualifier='', rate=None, when='', note='', lv='', t='', dr=''):
        area = areas[index]['n']
        kind, variant, chip, floor = method_info(area, floor, method)
        if method == 'Raid den':
            kind, variant = 'raid', qualifier
        elif qualifier:
            variant = ' · '.join(part for part in (variant, qualifier) if part)
        if method == 'DexNav (Underwater)' and 'Underwater' not in floor:
            note = '; '.join(part for part in ('Underwater', note) if part)
        if index == member:
            floor = ' · '.join(part for part in ('Depths', floor) if part)
        encs[target if index == member else index].add(kind, pid, rate, floor=floor, v=variant, chip=chip,
                                                      when=when, note=note, lv=lv, t=t, dr=dr, loc=index)

    for index, area in enumerate(areas):
        for section in area.get('es', []):
            if 'Raid Den' in section['n']:
                continue
            for group in section['g']:
                floor = section['n'] if section['n'] in floors.get(area['n'], set()) else ''
                label = group['m'] if floor else section['n']
                method, _, qualifier = label.partition(' · ')
                for row in group['rows']:
                    for when, rate in zip(('d', 'n'), row['r']):
                        if rate:
                            add(index, row['p'], method, floor, qualifier, rate, when, row.get('note', ''))

    for pid, row in source_rows:
        if len(row) > 5 and row[5] == 1:
            continue
        index, method, rate, level, note = row[:5]
        floor = next((floor for floor in sorted(floors.get(areas[index]['n'], set()), key=len, reverse=True)
                      if note == floor or note.startswith(floor + '; ')), '')
        detail = note[len(floor):].lstrip('; ') if floor else note
        if method.startswith(('Gift from ', 'Reward', 'Mission Reward', 'Game Corner', 'Mystery Gift')):
            detail = '; '.join(part for part in (method, detail) if part)
        placements = doc_places.get((index, pid, method), [floor]) if note.startswith('Doc says') else [floor]
        for placement in placements:
            add(index, pid, method, placement, note=detail, lv=level, t=rate)

    for den in WIKI.raid_dens():
        index = by_name[area_name(den.title.removeprefix('Underwater ').removesuffix(' Raid Den'))]
        tiers = list(raid_tables(den))
        if not tiers:
            raise ValueError('No raid reward tiers: %s' % den.title)
        for tier, level, drops in tiers:
            star = tier.split('/')[0]
            for name, stars in den.encounters:
                if star not in re.findall(r'(\d)[ -][Ss]tar', stars):
                    continue
                gmax = 'Gigantamax' if re.search(r'Gigantamax|Gmax', name, re.I) else ''
                for pid in species_ids(re.sub(r'^(?:Gigantamax|Gmax) ', '', name)):
                    add(index, pid, 'Raid den', 'Underwater' if den.title.startswith('Underwater') else '',
                        tier + '-Star', note=gmax, lv=level, dr=drops)

    for species in data['P']:
        species['w'] = []
    for area in areas:
        area.pop('es', None)
    areas[member]['in'] = target
    locs[0] = 'Shadow Base'
    for index, enc in enumerate(encs):
        enc.write(data, index)
    encstd.finish(data)
    report('encounter standard: ESV 2; tracker slots 63 -> %d; Cinder Volcano [%d] <- Cinder Volcano Depths [%d]; '
           'all 69 AR indexes retained' % (sum(not area.get('ns') and area.get('in') is None for area in areas), target, member))

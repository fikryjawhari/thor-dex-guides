"""Encounter-standard output, preserving published areas, egg slots and walkthrough anchors."""
import json
from pathlib import Path
import re

from common import report
import encstd
from locs import locname


MERGES = ('Granite Cave', 'Meteor Falls', 'Mirage Tower', 'Mt. Pyre', 'Safari Zone', 'Shoal Cave',
          'Magma Hideout', 'Seafloor Cavern', 'Sky Pillar', 'Victory Road', 'Trick House')
WATER = {'Surf': 'Su', 'Old Rod': 'O', 'Good Rod': 'G', 'Super Rod': 'S'}


def build(data):
    """Write es and flagged P.w after locs.split, before the shared finalisers."""
    metadata = json.loads(Path(__file__).with_name('map_meta.json').read_text(encoding='utf-8'))
    maps = {locname(name): values for name, values in metadata['maps'].items()}
    areas = data['AR']
    locations = data['LOC']
    owner = {location: index for index, area in enumerate(areas) for location in area['l']}
    merged = {}
    for name in MERGES:
        members = [index for index, area in enumerate(areas)
                   if not area.get('ns') and area['n'].startswith(name + ' ')]
        assert len(members) > 1, (name, members)
        assert all(any(locations[location] in maps for location in areas[index]['l']) for index in members), name
        sections = {maps[locations[location]][0] for index in members for location in areas[index]['l']
                    if locations[location] in maps}
        assert len(sections) == 1, (name, sections)
        parent = members[0]
        for index in members:
            merged[index] = (parent, areas[index]['n'][len(name):].strip())
            if index != parent:
                areas[index]['in'] = parent
        areas[parent]['n'] = name
        report(f'encounters merge: {name}: {len(members)} -> 1 ({next(iter(sections))}); members {members}')
    encounters = [encstd.Enc() for area in areas]
    for pokemon in data['P']:
        previous = pokemon['w']
        pokemon['w'] = []
        for location, method, rate, level, note, *flag in previous:
            index = owner[location]
            parent, floor = merged.get(index, (index, ''))
            area = areas[index]
            if index not in merged and len(area['l']) > 1:
                floor = re.sub(r'^' + re.escape(area['n']) + r'\s*', '', locations[location], flags=re.I)
            variant = ''
            chip = ''
            if method == 'Grass/cave':
                map_type = maps[locations[location]][1]
                assert map_type in ('UNDERGROUND', 'INDOOR', 'ROUTE', 'OCEAN_ROUTE', 'CITY'), map_type
                kind = 'cave' if map_type in ('UNDERGROUND', 'INDOOR') else 'grass'
            elif method in WATER:
                kind, chip = 'water', WATER[method]
            elif method in ('Rock Smash', 'Headbutt'):
                kind, variant = 'special', method
            elif method.startswith('Trade'):
                kind, variant = 'trade', ''
            else:
                kind, variant = 'gift', method
                if method.startswith('Hot House ('):
                    variant = 'Hot House'
                    note = '; '.join((method.removeprefix('Hot House (').removesuffix(')'), note))
                elif method.startswith('Gift') or method == 'Hoenn Dex reward':
                    variant = 'Gift (fossil)' if 'Fossil' in note else 'Gift'
                    if method != 'Gift':
                        note = '; '.join((method, note))
                elif method.startswith('Static'):
                    variant = 'Static'
                    if method != 'Static':
                        note = '; '.join((method, note))
                elif method == 'Roaming':
                    note = '; '.join((rate, note))
            percent = float(rate[:-1]) if rate.endswith('%') else None
            encounters[parent].add(kind, pokemon['id'], percent, lv=level, floor=floor, v=variant, chip=chip,
                                   note=note, t='' if percent is not None else rate, loc=location)
    for index, encounter in enumerate(encounters):
        encounter.write(data, index)
    encstd.finish(data)
    report('encounters: ESV', data['ESV'], 'standard sections; egg sub-slots retained:',
           sum(len(area.get('sub', [])) for area in areas))

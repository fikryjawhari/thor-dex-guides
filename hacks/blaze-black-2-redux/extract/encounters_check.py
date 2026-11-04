"""Source conservation checks for the standardized BB2R encounter tables."""
from collections import defaultdict

import encstd
import locs


def check_standard(data, wild, check):
    areas = data['AR']
    original = ['Starter' if area.get('st') else data['LOC'][area['l'][0]] for area in areas]
    byarea = {name: index for index, name in enumerate(original)}
    expected, levels = defaultdict(int), defaultdict(list)
    group_whens = defaultdict(set)
    for source in wild['areas']:
        for group in source['groups']:
            if not group['rows']:
                continue
            name = locs.wild_area_name(source['name'], group['method'])
            index = byarea[name]
            parent = areas[index].get('in', index)
            kind, floor, variant, chip, when = locs.encounter_table(source['name'], group['method'], name, areas[parent]['n'])
            group_key = parent, kind, floor, variant, chip
            group_whens[group_key].add(when)
            for row in group['rows']:
                key = group_key + (locs.species_id(row['species']), when)
                expected[key] += row['rate']
                levels[key].append(row['levels'])
    actual = {}
    actual_levels = {}
    for index, area in enumerate(areas):
        for section in area.get('es', []):
            for group in section['g']:
                for row in group['rows']:
                    for key, rate in row.get('r', {}).items():
                        chip, when = key.split('|')
                        group_key = index, section['k'], group.get('f', ''), group.get('v', ''), chip
                        whens = group_whens.get(group_key, {when}) if not when else {when}
                        for season in whens:
                            identity = group_key + (row['p'], season)
                            actual[identity] = rate
                            actual_levels[identity] = row.get('kl', {}).get(key, row.get('lv', group.get('lv', '')))
    check(actual == expected, 'standard: all 2,057 source slots conserve aggregated rates, floors, methods and seasons')
    mismatches = [(key, actual_levels.get(key), encstd.lv_merge(value)) for key, value in levels.items()
                  if actual_levels.get(key) != encstd.lv_merge(value)]
    if mismatches:
        print('Encounter level mismatches:', len(mismatches), mismatches[:8])
    check(not mismatches,
          'standard: per-species source levels survive rate merging and common-level lifting')
    check(data.get('ESV') == 2 and all(len(row) > 5 and row[5] == 1 for pokemon in data['P'] for row in pokemon['w']),
          'standard: every encounter is flagged in P.w, including gifts, statics and trades')
    for name, count in (('Relic Castle', 7), ('Celestial Tower', 4), ('Seaside Cave', 2), ('Victory Road', 9),
                        ('Virbank Complex', 2), ('Reversal Mountain', 2), ('Pinwheel Forest', 2)):
        members = [index for index, old in enumerate(original) if old.startswith(name + ' - ')]
        check(len(members) == count and areas[members[0]]['n'] == name and
              all(areas[index].get('in') == members[0] and 'es' not in areas[index] for index in members[1:]),
              'standard: append-only merge %s %d -> 1' % (name, count))
    grottos = [(index, group) for index, area in enumerate(areas) for section in area.get('es', [])
               if section['k'] == 'special' for group in section['g'] if group.get('v', '').startswith('Hidden Grotto')]
    check(len(grottos) == 20, '20 published grotto mechanics, not tracker areas')
    check(all('r' not in row and set(row['t'].split(', ')) <= {'Common', 'Uncommon', 'Rare', 'Guaranteed'}
              for _, group in grottos for row in group['rows']), 'grotto rarity is text, never an invented percentage')
    expected_grottos = set()
    for grotto in wild['grottos']:
        name = locs.GROTTO_AREAS.get(grotto['name'], grotto['name'].split(' - ')[0])
        index = byarea[name]
        parent = areas[index].get('in', index)
        variant = 'Hidden Grotto' + (' - ' + grotto['name'].split(' - ', 1)[1] if ' - ' in grotto['name'] else '')
        for row in grotto['rows']:
            expected_grottos.add((parent, variant, locs.species_id(row['species']), row['rarity']))
    actual_grottos = {(index, group['v'], row['p'], rarity) for index, group in grottos
                      for row in group['rows'] for rarity in row['t'].split(', ')}
    check(actual_grottos == expected_grottos, 'all 206 source grotto rarity entries survive species coalescing')
    check(data['LOC'][areas[0]['l'][0]] == 'Aspertia City', 'Starter white box names Aspertia City')
    sample = {'P': [{'id': 'known', 'w': []}, {'id': 'unknown', 'w': []}], 'AR': [{'l': [0]}]}
    encounter = encstd.LevelAwareEnc()
    encounter.add('special', 'known', lv='30', v='Hidden Grotto')
    encounter.add('special', 'unknown', v='Hidden Grotto')
    encounter.write(sample, 0)
    group = sample['AR'][0]['es'][0]['g'][0]
    check('lv' not in group and group['rows'][0].get('lv') == '30' and 'lv' not in group['rows'][1],
          'known demonstration level never becomes an unspecified grotto species level')
    for builder, collapsed in ((encstd.Enc, True), (encstd.LevelAwareEnc, False)):
        encounter = builder()
        encounter.add('grass', 'known', 10, lv='4', when='sp')
        encounter.add('grass', 'known', 10, lv='5', when='su')
        encounter.write(sample, 0)
        rates = sample['AR'][0]['es'][0]['g'][0]['rows'][0]['r']
        check(('|' in rates) == collapsed, 'seasonal level opt-in; existing Enc behavior unchanged: ' + builder.__name__)

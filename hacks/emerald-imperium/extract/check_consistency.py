"""Check Part B invariants and preservation against a pre-Part-B data.json."""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from stage8_consistency import GYMS, finalise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline', type=Path)
    parser.add_argument('current', nargs='?', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'data.json')
    args = parser.parse_args()
    before = json.loads(args.baseline.read_text(encoding='utf8'))
    after = json.loads(args.current.read_text(encoding='utf8'))
    old_species = {pokemon['id']: pokemon for pokemon in before['P']}
    species = {pokemon['id']: pokemon for pokemon in after['P']}
    used = {mon['id'] for group in before['TR']['g'] for section in group['sec']
            for trainer in section['tr'] for mon in trainer['p']}
    obtainable_dex = {pokemon['dex'] for pokemon in before['P']
                      if pokemon['g'] == 0 and not pokemon.get('fc')}
    expected = {pokemon['id'] for pokemon in before['P']
                if pokemon['g'] == 0 or pokemon['id'] in used
                or (pokemon['g'] == 1 and pokemon['dex'] in obtainable_dex)}
    assert set(species) == expected
    assert len(species) == len(after['P'])
    assert [pokemon['id'] for pokemon in after['P']] == [pokemon['id'] for pokemon in before['P']
                                                        if pokemon['id'] in expected]
    for pokemon in after['P']:
        original = deepcopy(old_species[pokemon['id']])
        original['of'] = [target for target in original['of'] if target in expected]
        for field in ('ef', 'et'):
            original[field] = [entry for entry in original[field] if entry[1] in expected]
            assert all(entry[1] in species for entry in pokemon[field])
        assert pokemon == original, pokemon['id']
        assert all(target in species for target in pokemon['of'])
    assert used <= set(species)
    assert all(pokemon['id'] in species for pokemon in before['P'] if pokemon['w'])
    expected_areas = deepcopy(before['AR'])
    expected_areas[0].update(n='Starter', st=1)
    assert after['AR'] == expected_areas
    assert len(before['TR']['g']) == len(after['TR']['g']) == 20
    expected_trainers = deepcopy(before['TR'])
    for group in expected_trainers['g']:
        if group.get('cap') == 85:
            group['n'] = 'Elite Four Split [Cap 85]'
    assert after['TR'] == expected_trainers
    assert [split['n'] for split in after['WK']['splits']] == [
        f'{boss} Split [Cap {cap}]' for boss, cap in GYMS]
    for old_split, new_split in zip(before['WK']['splits'], after['WK']['splits']):
        assert len(old_split['st']) == len(new_split['st'])
        for old_stop, new_stop in zip(old_split['st'], new_split['st']):
            assert {key: value for key, value in old_stop.items() if key != 'it'} == {
                key: value for key, value in new_stop.items() if key != 'it'}
    mega_sections = {section['n'] for section in after['IT'] if section['k'] == 'mega'}
    expected_items = deepcopy(before['IT'])
    for section in expected_items:
        if section['k'] == 'mega':
            for row in section['r']:
                if row[2] and row[2] not in expected:
                    row[2] = None
    assert after['IT'] == expected_items, 'Item facts and ordering must not change'
    expected_walk = deepcopy(before['WK'])
    for split, (boss, cap) in zip(expected_walk['splits'], GYMS):
        split['n'] = f'{boss} Split [Cap {cap}]'
    for row in expected_walk['np'] + [row for split in expected_walk['splits']
                                    for stop in split['st'] for row in stop['it']]:
        if row[0] in mega_sections and row[3] and row[3] not in expected:
            row[3] = None
    assert after['WK'] == expected_walk, 'Only split names and removed-species item links may change'
    for section in after['IT']:
        if section['k'] == 'mega':
            assert all(not row[2] or row[2] in species for row in section['r'])
    for row in after['WK']['np'] + [row for split in after['WK']['splits']
                                  for stop in split['st'] for row in stop['it']]:
        if row[0] in mega_sections:
            assert not row[3] or row[3] in species
    for field in ('M', 'MV', 'AB', 'LOC', 'TC', 'built', 'src', 's7'):
        assert before[field] == after[field], field
    regenerated = deepcopy(before)
    removed = finalise(regenerated)
    assert regenerated == after, 'Finaliser must reproduce the published data from the baseline'
    assert finalise(regenerated) == [] and regenerated == after, 'Finaliser must be idempotent'
    print(f'PASS: {len(before["P"])} -> {len(species)} species; {len(used)} trainer species preserved; '
          f'{len(after["AR"])} area indices, 20 trainer boxes and all walkthrough stop/tick keys preserved')
    print('PASS: stable species/move/ability/location IDs, valid references, reproducible and idempotent finalisation')
    print('Removed IDs:', ', '.join(removed))


if __name__ == '__main__':
    main()

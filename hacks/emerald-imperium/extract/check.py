"""Check a built data.json: the Locations PDF's wild tables against the dex data and, given a pre-Part-B data.json, the
Part B invariants and preservation.

Usage: uv run python -I hacks/emerald-imperium/extract/check.py [baseline.json [current.json]]
"""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools'))
import itemstd  # noqa: E402
import extractlib  # noqa: E402
import pdfwild, prune, walk  # noqa: E402
from extractlib import split_name  # noqa: E402
from walk import GYMS  # noqa: E402


def finalise(data):
    """The build's finalisers on a finished data.json; returns the species ids pruned."""
    before = [pokemon['id'] for pokemon in data['P']]
    for group in data['TR']['g']:
        if group.get('cap') == 85:
            group['n'] = split_name('Elite Four', 85)
    walk.name_splits(data)
    extractlib.finalise(data, 'emerald-imperium', prune.build)
    data['AR'][0].update(n='Starter', st=1)
    kept = {pokemon['id'] for pokemon in data['P']}
    return [i for i in before if i not in kept]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline', nargs='?', type=Path)
    parser.add_argument('current', nargs='?', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'data.json')
    args = parser.parse_args()
    diffs = pdfwild.compare()
    assert not diffs, diffs[:10]
    print('PASS: Locations PDF wild tables match the dex data slot by slot')
    if not args.baseline:
        return
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
    extractlib.trainers_follow_walk({'WK': after['WK'], 'TR': expected_trainers})
    assert after['TR'] == expected_trainers, 'Trainers: the baseline in walkthrough order'
    assert [split['n'] for split in after['WK']['splits']] == [
        group['n'] for group in after['TR']['g']], 'Walkthrough splits are the trainer boxes'
    old_stops = {stop['k']: stop for split in before['WK']['splits'] for stop in split['st']}
    new_stops = {stop['k']: stop for split in after['WK']['splits'] for stop in split['st']}
    assert {key.split('.f', 1)[0] for key in new_stops} == set(old_stops), 'Every walkthrough stop key is kept'
    for key, old_stop in old_stops.items():
        assert new_stops[key]['n'].startswith(old_stop['n']), key     # Hot House parts take their badge section's name
        assert {k: v for k, v in old_stop.items() if k not in ('n', 'x', 'it', 'tr')} == {
            k: v for k, v in new_stops[key].items() if k not in ('n', 'x', 'it', 'tr')}, key
    old_tr = [k for stop in old_stops.values() for k in stop['tr']]
    new_tr = [k for stop in new_stops.values() for k in stop['tr']]
    assert sorted(old_tr) == sorted(new_tr), 'Every trainer stays in the walkthrough once'
    mega_sections = {section['n'] for section in after['IT'] if section['k'] == 'mega'}
    standard = deepcopy(before)      # items and walkthrough item rows are expected in the Items standard (tools/itemstd.py)
    itemstd.standardise(standard, itemstd.RULES['emerald-imperium'])
    expected_items = deepcopy(standard['IT'])
    for section in expected_items:
        if section['k'] == 'mega':
            for row in section['r']:
                if row[2] and row[2] not in expected:
                    row[2] = None
    assert after['IT'] == expected_items, 'Items must be the Items standard of the baseline'
    expected_walk = deepcopy(standard['WK'])
    if len(expected_walk['splits']) == len(GYMS):
        for split, (boss, cap) in zip(expected_walk['splits'], GYMS):
            split['n'] = f'{boss} Split [Cap {cap}]'
    walk.name_splits({'WK': expected_walk, 'TR': after['TR']})
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
    for field in ('M', 'MV', 'AB', 'LOC', 'TC', 'built'):
        assert before[field] == after[field], field
    regenerated = deepcopy(before)
    removed = finalise(regenerated)
    assert regenerated == after, 'Finaliser must reproduce the published data from the baseline'
    assert finalise(regenerated) == [] and regenerated == after, 'Finaliser must be idempotent'
    print(f'PASS: {len(before["P"])} -> {len(species)} species; {len(used)} trainer species preserved; '
          f'{len(after["AR"])} area indices, 20 trainer boxes and all walkthrough stop/tick keys preserved (cap splits)')
    print('PASS: stable species/move/ability/location IDs, valid references, reproducible and idempotent finalisation')
    print('Removed IDs:', ', '.join(removed))


if __name__ == '__main__':
    main()

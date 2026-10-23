"""Validate Part B data; optionally compare with a pre-Part-B data.json.

Usage: python -I hacks/eternal-x/extract/check.py [baseline.json]
"""
import json
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import HACK
import prune


def trainers(data):
    return {trainer['k']: trainer for group in data['TR']['g']
            for section in group['sec'] for trainer in section['tr']}


def check_prune():
    def entry(identifier, dex_number, **fields):
        return dict(id=identifier, dex=dex_number, w=[], et=[], ef=[], of=[], g=0) | fields

    sample = {'P': [entry('baby', 1, et=[['level', 'base']]),
                    entry('base', 2, w=[[0]], ef=[['level', 'baby']]),
                    entry('mega', 2, g=1, stone='Available stone'),
                    entry('unused-mega', 2, g=1, stone='Missing stone'),
                    entry('trainer-mega', 2, g=1, stone='Missing stone'),
                    entry('form', 2, fc=1), entry('unused-form', 3, fc=1), entry('trainer-form', 3, fc=1),
                    entry('trainer-only', 4), entry('partner-only', 5), entry('unused', 6)],
              'IT': [{'r': [['Available stone']]}],
              'TR': {'g': [{'sec': [{'tr': [{'p': [{'id': 'trainer-only'}, {'id': 'trainer-mega'}, {'id': 'trainer-form'}],
                                           'pt': [{'p': [{'id': 'partner-only'}]}]}]}]}]}}
    prune.build(sample)
    kept = {pokemon['id']: pokemon for pokemon in sample['P']}
    assert set(kept) == {'baby', 'base', 'mega', 'form', 'trainer-only', 'partner-only', 'trainer-mega', 'trainer-form'}
    assert kept['trainer-only']['g'] == kept['partner-only']['g'] == 3
    assert kept['trainer-mega']['nu'] == 1
    assert kept['trainer-form']['g'] == 3
    print('Availability fixture: evolution/breeding, usable Mega, form change, trainers, partners and pruning PASS.')


def check(data, baseline=None):
    species = {entry['id']: entry for entry in data['P']}
    assert len(species) == len(data['P'])
    assert not any('vc' in entry for entry in data['P'])
    for entry in data['P']:
        assert all(target in species for _, target in entry['ef'] + entry['et'])
        assert all(target in species for target in entry['of'])
    cards = trainers(data)
    for trainer in cards.values():
        for team in [trainer] + trainer.get('pt', []):
            assert all(member['id'] in species for member in team['p'])
    for area in data['AR']:
        for section in area.get('es', []):
            for group in section['g']:
                assert all(row['p'] in species for row in group['rows'])
    expected = [16, 25, 30, 36, 37, 42, 45, 46, 47, 49, 52, 53, 60, 61, 65, 66, 68, 72, 78, 82]
    assert [cap[1] for cap in data['TR']['caps']] == expected
    assert 'mini' not in data['TR']
    assert not any('Sycamore' in cap[0] for cap in data['TR']['caps'])
    assert data['TR']['caps'][17][0] == 'Shauna, Tierno & Trevor (Route 19)'
    groups, splits = data['TR']['g'], data['WK']['splits']
    stops_by_position = {f'{split_index}.{stop_index}': stop
                         for split_index, split in enumerate(splits) for stop_index, stop in enumerate(split['st'])}
    fragment_keys = [stop['k'] for stop in stops_by_position.values()]
    assert len(fragment_keys) == len(set(fragment_keys)), 'duplicate persistent fragment keys'
    assert all(re.fullmatch(r'\d+\.\d+(?:\.f[1-9]\d*)?', key) for key in fragment_keys)
    legacy_stops = {position: stop['k'].split('.f', 1)[0] for position, stop in stops_by_position.items()}   # dex.js migrateWalkState
    fragments_by_root = defaultdict(list)
    for position, stop in stops_by_position.items():
        root = stop['k'].split('.f', 1)[0]
        fragments_by_root[root].append(stop['k'])
    assert len(fragments_by_root) == 69
    for root, keys in fragments_by_root.items():
        assert set(keys) == {root} | {f'{root}.f{index}' for index in range(1, len(keys))}
    print(f'Fragment identities: {len(fragment_keys)} unique keys; all 69 legacy roots and every position mapped PASS.')
    assert [group['n'] for group in groups] == [split['n'] for split in splits]
    assert groups[-2]['n'] == 'Elite Four Split [Cap 82]'
    assert groups[-1]['n'] == 'Post-game'
    assert [group['cap'] for group in groups[:-1]] == expected
    for group, split in zip(groups, splits):
        keys = {trainer['k'] for section in group['sec'] for trainer in section['tr']}
        seen = {trainer_key for stop in split['st'] for trainer_key in stop['tr']}
        assert seen <= keys
        if group['cap']:
            assert keys == seen
            assert all(section['cap'][0] == group['cap'] for section in group['sec'])
        for section in group['sec']:
            if 'cap' in section:
                assert len(section['cap']) == 4 and isinstance(section['cap'][0], int)
        assert 'cap' not in split and all('cap' not in stop for stop in split['st'])
        if group['cap']:
            assert split['n'].endswith(f"[Cap {group['cap']}]")
    key_items = {row[0] for section in data['IT'] if section['n'] == 'Key Items' for row in section['r']}
    assert not key_items & {'Holo Caster', 'Running Shoes', 'Town Map', 'Adventure Rules', 'Honor of Kalos', 'Lens Case'}
    assert {'Poké Radar', 'Mega Ring', 'Exp. Share', 'Dowsing Machine', 'DNA Splicers'} <= key_items
    assert all(key in cards for split in splits for stop in split['st'] for key in stop['tr'])
    if baseline is not None:
        old_species = {entry['id']: entry for entry in baseline['P']}
        assert set(species) <= set(old_species)
        assert [entry['id'] for entry in data['P']] == [entry['id'] for entry in baseline['P'] if entry['id'] in species]
        for field in ('AR', 'ARO', 'LOC'):
            assert data[field] == baseline[field], field
        assert cards == trainers(baseline), 'trainer IDs, keys and complete teams must stay unchanged'
        old_stops = {f'{split_index}.{stop_index}': stop for split_index, split in enumerate(baseline['WK']['splits'])
                     for stop_index, stop in enumerate(split['st'])}
        new_stops = defaultdict(list)
        for position, stop in stops_by_position.items():
            new_stops[legacy_stops[position]].append(stop)
        assert set(new_stops) == set(old_stops)
        for key, old_stop in old_stops.items():
            fragments = new_stops[key]
            for field in ('a', 's', 'tr'):
                assert [value for fragment in fragments for value in fragment[field]] == old_stop[field], (key, field)
            assert all(fragment['n'] == old_stop['n'] for fragment in fragments)
        print('Baseline: stable species IDs/order; identical AR/ARO/LOC and all trainer cards; '
              '69 legacy stop keys, area attachments and checklist steps preserved in data.')
        print('Removed species IDs:', ', '.join(sorted(set(old_species) - set(species))) or 'none')
    print(f"PASS: {len(species)} species, {len(cards)} trainer cards, {len(expected)} caps, "
          f"{len(splits)} walkthrough splits, {len(key_items)} useful key items.")


if __name__ == '__main__':
    check_prune()
    with open(os.path.join(HACK, 'data.json'), encoding='utf-8') as source:
        data = json.load(source)
    baseline = None
    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding='utf-8') as source:
            baseline = json.load(source)
    check(data, baseline)

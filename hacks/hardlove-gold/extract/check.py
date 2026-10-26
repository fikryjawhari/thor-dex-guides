"""Check a built data.json; given an earlier data.json, also what the build kept from it.

Usage: uv run python -I hacks/hardlove-gold/extract/check.py [baseline.json]
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools'))
from calc_ui_check import check_metronome
from common import HACK


def trainers(data):
    return {trainer['k']: trainer for group in data['TR']['g']
            for section in group['sec'] for trainer in section['tr']}


def stops(data):
    return {stop['k']: stop for split in data['WK']['splits'] for stop in split['st']}


def check(data, baseline=None):
    flags = {name: data['MV'][index]['f'] for index, name in enumerate(data['M'])}
    assert 'contact' in flags['Drain Punch'] and 'punch' in flags['Drain Punch']
    assert 'sound' in flags['Boomburst']
    for name in ['Dark Pulse', 'Sunsteel Strike', 'Collision Course', 'Electro Drift', 'Thunderous Kick', 'Behemoth Blade']:
        assert 'contact' not in flags[name], name
    species = {entry['id']: entry for entry in data['P']}
    assert len(species) == len(data['P'])
    assert not any('vc' in entry for entry in data['P'])
    for entry in data['P']:
        assert all(target in species for _, target in entry['ef'] + entry['et'])
        assert all(target in species for target in entry['of'])
    cards = trainers(data)
    assert len(cards) == sum(len(section['tr']) for group in data['TR']['g'] for section in group['sec'])
    for trainer in cards.values():
        for team in [trainer] + trainer.get('pt', []):
            assert all(member['id'] in species for member in team['p'])
    for area in data['AR']:
        assert all(index < len(data['LOC']) for index in area['l'])
        for section in area.get('es', []):
            for group in section['g']:
                assert all(row['p'] in species for row in group['rows'])
    for entry in data['P']:
        assert all(row[0] < len(data['LOC']) for row in entry['w'])
    starters = [index for index, area in enumerate(data['AR']) if area.get('st')]
    assert starters == [61] and data['AR'][61]['n'] == 'Starter', starters
    groups, splits = data['TR']['g'], data['WK']['splits']
    assert len(groups) == len(splits)
    for group, split in zip(groups, splits):
        assert group['n'].split(' (')[0] == split['n'].split(' (')[0], (group['n'], split['n'])
        keys = {trainer['k'] for section in group['sec'] for trainer in section['tr']}
        seen = {key for stop in split['st'] for key in stop['tr']}
        assert seen <= keys, split['n']
        if re.search(r'\[Cap \d+\]$', group['n']):
            assert group['n'] == split['n'] and group['n'].endswith(f"[Cap {group['cap']}]")
    assert all(key in cards for split in splits for stop in split['st'] for key in stop['tr'])
    stop_keys = [stop['k'] for split in splits for stop in split['st']]
    assert len(stop_keys) == len(set(stop_keys)), 'duplicate stop keys'
    assert not any(stop['s'] for split in splits for stop in split['st']), 'checklist steps: LS keys assume none'
    boxes = [section['n'] for section in data['IT']]
    assert boxes == ['Valuables', 'Key Items', 'TMs and HMs', 'Move Tutors', 'Held Items', 'Evolution Items',
                     'Mega Stones', 'Useful NPCs'], boxes
    assert all(len(row) == 5 and row[4] for section in data['IT'] for row in section['r']), 'row without a sub-heading'
    if baseline is not None:
        old_species = {entry['id']: entry for entry in baseline['P']}
        assert set(species) <= set(old_species)
        assert [entry['id'] for entry in data['P']] == [entry['id'] for entry in baseline['P'] if entry['id'] in species]
        for field in ('M', 'AB', 'TC'):
            assert data[field] == baseline[field], field
        assert [area['n'] for area in data['AR'][:len(baseline['AR'])]] == [area['n'] for area in baseline['AR']]
        assert set(trainers(baseline)) <= set(cards), 'published trainer keys must stay'
        assert set(stops(baseline)) <= set(stops(data)), 'published stop keys must stay'
        print('Baseline: species order, move/ability tables, area names, trainer and stop keys kept.')
        print('Removed species IDs:', ', '.join(sorted(set(old_species) - set(species))) or 'none')
    print(f"PASS: {len(species)} species, {len(cards)} trainer cards, {len(splits)} splits, "
          f"{len(stop_keys)} stops, {len(data['AR'])} areas")


if __name__ == '__main__':
    with open(os.path.join(HACK, 'data.json'), encoding='utf-8') as source:
        data = json.load(source)
    baseline = None
    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding='utf-8') as source:
            baseline = json.load(source)
    check(data, baseline)
    check_metronome(data, 'hardlove-gold')

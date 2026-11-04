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
import encstd


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
    check_encounters(data)
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
    assert boxes == ['Key Items', 'Poké Balls', 'Medicine', 'Held Items', 'TMs and HMs', 'Evolution Items',
                     'Mega Stones', 'Valuables', 'Move Tutors', 'Useful NPCs'], boxes
    assert all(len(row) == 6 and (row[4] or section['n'] == 'Valuables') for section in data['IT'] for row in section['r']), 'row without a sub-heading'
    if baseline is not None:
        old_species = {entry['id']: entry for entry in baseline['P']}
        assert set(species) <= set(old_species)
        assert [entry['id'] for entry in data['P']] == [entry['id'] for entry in baseline['P'] if entry['id'] in species]
        for field in ('M', 'AB', 'TC'):
            assert data[field] == baseline[field], field
        assert [area['n'] for area in data['AR'][:len(baseline['AR'])]] == [area['n'] for area in baseline['AR']]
        assert [area['l'] for area in data['AR']] == [area['l'] for area in baseline['AR']], 'published tracker slots'
        for entry in data['P']:
            assert bool(entry['w']) == bool(old_species[entry['id']]['w']), entry['id']
        assert set(trainers(baseline)) <= set(cards), 'published trainer keys must stay'
        assert set(stops(baseline)) <= set(stops(data)), 'published stop keys must stay'
        print('Baseline: species order, move/ability tables, area names, trainer and stop keys kept.')
        print('Removed species IDs:', ', '.join(sorted(set(old_species) - set(species))) or 'none')
    print(f"PASS: {len(species)} species, {len(cards)} trainer cards, {len(splits)} splits, "
          f"{len(stop_keys)} stops, {len(data['AR'])} areas")


def check_encounters(data):
    assert data['ESV'] == 2
    encstd.finish(data)
    areas = {area['n']: area for area in data['AR']}
    assert len(data['AR']) == 62 and sum(not area.get('ns') for area in data['AR']) == 61
    assert not any('in' in area for area in data['AR'])
    assert data['LOC'][areas['Starter']['l'][0]] == 'New Bark Town'
    assert {group['v'] for section in areas['Starter']['es'] for group in section['g']} == {'Starter choice'}
    park = areas['National Park']
    assert {data['LOC'][location] for location in park['l']} == {'National Park'}
    assert park['es'][0]['k'] == 'grass' and len(park['es'][0]['g']) == 1 and 'fo' not in park
    rates = [row['r'] for row in park['es'][0]['g'][0]['rows']]
    assert {key for row in rates for key in row} == {'|', '|m', '|d', '|n'}
    assert all(sum(row.get('|' + when, row.get('|', 0)) for row in rates) == 100 for when in ('m', 'd', 'n'))
    assert any(set(row) == {'|'} for row in rates), 'identical morning/day/night rows collapse'
    assert areas['Mt. Mortar']['fo'] == ['1F (Entrance)', '1F (Back)', '2F', 'B1F']
    silver = {section['k']: {group.get('f', '') for group in section['g']} for section in areas['Mt. Silver']['es']}
    assert silver['grass'] == {'Mountainside', 'Snowy Area'}
    assert silver['cave'] == {'Entrance', 'Moltres Room'}
    alph = {section['k']: {group.get('f', '') for group in section['g']} for section in areas['Ruins of Alph']['es']}
    assert alph['grass'] == {'Outside'} and alph['cave'] == {'Inside'}
    assert areas['Azalea Town']['es'][0]['g'][0]['v'] == 'Headbutt'
    assert {section['k'] for section in areas['Safari Zone']['es']} == {'special'}
    assert {group['v'] for section in areas['Safari Zone']['es'] for group in section['g']} == {'Safari'}
    chips = {key.split('|')[0] for area in data['AR'] for section in area.get('es', [])
             for group in section['g'] for row in group['rows'] for key in row.get('r', {})}
    assert chips == {'', 'Su', 'F'}
    print('PASS: encounter standard; 62 -> 62 AR entries, 61 -> 61 tracker slots; National Park times collapse; '
          'source floor order, land kinds, water chips, special mechanics and Starter heading')


def check_gid(data):
    """The save importer's tables (template/calc/readers/README.md → gen4): every non-Mega species has a species:form key
    with a growth rate, every move and ability name a game id, items spelt as the trainer sets spell them."""
    gid = data['GID']
    mapped = set(gid['sp'].values())
    assert {p['id'] for p in data['P'] if p['g'] != 1} <= mapped, 'species without a game species:form'
    assert all(key in gid['gr'] and gid['gr'][key] in range(6) for key in gid['sp']), 'a species without a growth rate'
    assert set(i for i in gid['mv'] if i is not None) == set(range(len(data['M']))), 'moves without a game id'
    names = {name for name, *_ in data['AB']}
    assert {data['AB'][i][0] for i in gid['ab'] if i is not None} == names, 'abilities without a game id'
    assert gid['sp']['702:0'] == 'chesnaught'   # hg-engine numbers Gen 5 on 50 past the National Dex and gid['sp']['26:1'] == 'raichu_alolan'
    assert "King's Rock" in gid['it'] and 'Leftovers' in gid['it']
    print(f'PASS: GID maps {len(mapped)} species ({len(gid["sp"])} species:form keys), {len(data["M"])} moves, '
          f'{len(names)} ability names')


if __name__ == '__main__':
    with open(os.path.join(HACK, 'data.json'), encoding='utf-8') as source:
        data = json.load(source)
    baseline = None
    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding='utf-8') as source:
            baseline = json.load(source)
    check(data, baseline)
    check_gid(data)
    check_metronome(data, 'hardlove-gold')

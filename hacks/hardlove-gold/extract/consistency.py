"""Apply Part B without renumbering published species, areas or walkthrough stops.

Usage: python -I hacks/hardlove-gold/extract/consistency.py [data.json]
Also used by build.py and split_ui.py, so raw rebuilds use the same rules.
"""
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools'))
import datajson
from splits import split_name


def apply(data):
    starters = [(pokemon, encounter) for pokemon in data['P'] for encounter in pokemon['w']
                if encounter[1] == 'Starter choice']
    assert {pokemon['id'] for pokemon, encounter in starters} == {'turtwig', 'litten', 'froakie'}
    assert len(starters) == 3
    locations = data['LOC']
    if 'Starter' not in locations:
        locations.append('Starter')
    location = locations.index('Starter')
    areas = data['AR']
    starter_area = next((index for index, area in enumerate(areas) if area['n'] == 'Starter'), None)
    if starter_area is None:
        starter_area = len(areas)
        areas.append({'n': 'Starter', 'l': [location], 'st': 1})
    else:
        assert areas[starter_area]['l'] == [location]
        areas[starter_area]['st'] = 1
    for pokemon, encounter in starters:
        encounter[0] = location
    new_bark = next(index for index, area in enumerate(areas) if area['n'] == 'New Bark Town')
    first_stop = next(stop for split in data['WK']['splits'] for stop in split['st'] if new_bark in stop['a'])
    if starter_area not in first_stop['a']:
        first_stop['a'].insert(0, starter_area)
    for split in data['WK']['splits']:
        split['n'] = split_name(split['n'])
    for group in data['TR']['g']:
        if re.search(r'\[(?:Level )?Cap \d+\]$', group['n']):
            group['n'] = split_name(group['n'])


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'hacks/hardlove-gold/data.json'
    data, original = datajson.load(path)
    apply(data)
    datajson.save(path, data, original)

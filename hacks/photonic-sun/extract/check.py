"""Check a built data.json; given a pre-Part-B data.json, also what Part B kept from it.

Usage: uv run python -I hacks/photonic-sun/extract/check.py [baseline.json]
"""
from collections import Counter, defaultdict
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import HACK, split_name
from trainers import CAPS
from totems import BATTLES


def trainers(data):
    return {trainer['k']: trainer for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']}


def stops(data):
    return {f'{split_index}.{stop_index}': stop for split_index, split in enumerate(data['WK']['splits'])
            for stop_index, stop in enumerate(split['st'])}


def check_gid(data):
    gid = data['GID']
    assert set(gid['sp'].values()) == {pokemon['id'] for pokemon in data['P']}, 'P ids without a game species/form'
    assert all(':' in key and gid['gr'][key] in range(6) for key in gid['sp']), 'forms without a growth rate'
    assert {index for index in gid['mv'] if index is not None} == set(range(len(data['M']))), 'moves without a game id'
    assert {index for index in gid['ab'] if index is not None} == set(range(len(data['AB']))), 'abilities without a game id'
    assert gid['sp']['26:1'] == 'raichu-alola' and gid['sp']['479:1'] == 'heat-rotom', 'form keys lost'
    assert gid['it'][660] == 'Charizardite X', 'held item ids lost'
    print(f'PASS: GID maps all {len(data["P"])} species, {len(data["M"])} moves, {len(data["AB"])} abilities')


def check_current(new):
    check_gid(new)
    new_pokemon = {pokemon['id']: pokemon for pokemon in new['P']}
    assert len(new_pokemon) == len(new['P'])
    for pokemon in new['P']:
        assert all(other in new_pokemon for other in pokemon['of'])
        assert all(edge[1] in new_pokemon for edge in pokemon['ef'] + pokemon['et'])
    assert not any('vc' in pokemon for pokemon in new['P'])
    cards = trainers(new)
    for trainer in cards.values():
        for team in [trainer] + trainer.get('pt', []):
            assert all(mon['id'] in new_pokemon for mon in team['p'])
    assert 'mini' not in new['TR']
    assert len(new['TR']['caps']) == len(CAPS) == 29
    names = [group['n'] for group in new['TR']['g']]
    assert names == [split['n'] for split in new['WK']['splits']]
    assert names[-3:] == ['Elite Four Split [Cap 100]', 'Post-game: Episode RR', 'Post-game']
    for index, (name, level) in enumerate(new['TR']['caps']):
        boss = CAPS[index][2]
        assert names[index] == split_name(boss, level)
        assert boss in name
        assert not ('Dexio' in name and 'Heahea' in name) and 'Battle Royal' not in name
    for group in new['TR']['g']:
        for section in group['sec']:
            if group['cap']:
                assert section['cap'][0] == group['cap'] and isinstance(section['cap'][0], int)
            else:
                assert 'cap' not in section
    new_stops = stops(new)
    assert len({stop['k'] for stop in new_stops.values()}) == len(new_stops), 'duplicate stop keys'
    assert all(key in cards for stop in new_stops.values() for key in stop['tr'])
    check_totems(new, cards)
    print(f"PASS: {len(new_pokemon)} species, {len(cards)} trainer cards, {len(new['TR']['caps'])} caps, "
          f"{len(new['WK']['splits'])} walkthrough splits, {len(new_stops)} stops")


def check_totems(data, cards):
    expected = {
        'Totem Gumshoos': [0, 1, 0, 0, 0], 'Totem Raticate': [0, 1, 0, 0, 0],
        'Totem Araquanid': [0, 0, 0, 0, 2], 'Totem Marowak': [1] * 5,
        'Totem Lurantis': [1] * 5, 'Nihilego': [0, 0, 3, 0, 0],
        'Totem Togedemaru': [2] * 5, 'Totem Mimikyu': [2] * 5, 'Totem Kommo-o': [2] * 5,
        'Ultra Necrozma': [2] * 5, 'Totem Ribombee': [3] * 5,
        'Totem Gumshoos (Rematch)': [3] * 5, 'Totem Raticate (Rematch)': [3] * 5,
    }
    totems = [trainer for trainer in cards.values() if 'Totem' in trainer['tags']]
    assert len(totems) == len(expected) == 13
    assert {trainer['n'] for trainer in totems} == expected.keys()
    source = {('Totem ' + name if name not in ('Nihilego', 'Ultra Necrozma') else name): rows
              for name, _, rows in BATTLES}
    placements = {trainer['k']: index for index, group in enumerate(data['TR']['g'])
                  for section in group['sec'] for trainer in section['tr']}
    occurrences = Counter(key for stop in stops(data).values() for key in stop['tr'])
    for trainer in totems:
        name, team = trainer['n'], trainer['p']
        assert 'pt' not in trainer
        assert team[0]['au'] == expected[name], name
        assert len(team[0]['au']) == 5 and all(type(stage) is int and -6 <= stage <= 6
                                             for stage in team[0]['au']), name
        assert all('au' not in mon for mon in team[1:]), name
        assert occurrences[trainer['k']] == 1, name
        assert len(team) == len(source[name]), name
        for mon, row in zip(team, source[name]):
            species, level, ability, item, nature, evs, moves = row
            assert (mon['id'], mon['l'], mon['i'], mon['na'], mon['ev']) == (species, level, item, nature, evs)
            assert mon['iv'] == [31] * 6
            assert data['AB'][mon['a']][0] == ability
            assert [data['M'][index] for index in mon['m']] == moves.split('/')
        assert trainer['note'].count('IVs not in the doc: 31 assumed') == 1
        if 'Raticate' in name:
            assert 'Prismatic Moon' in trainer['tags'] and not trainer.get('st')
        if 'Gumshoos' in name:
            assert 'Photonic Sun' in trainer['tags'] and not trainer.get('st')
        if '(Rematch)' in name:
            assert placements[trainer['k']] == len(CAPS) + 1 and trainer['cap'] == 0
            assert trainer['loc'] == 'Verdant Cavern'
        else:
            cap_name = 'Totem Gumshoos' if name == 'Totem Raticate' else name
            target = next(index for index, cap in enumerate(CAPS) if cap[2] == cap_name)
            assert placements[trainer['k']] == target
            assert trainer['loc'] == CAPS[target][1]
            assert trainer['cap'] == data['TR']['g'][target]['cap']
    assert next(trainer for trainer in totems if trainer['n'] == 'Ultra Necrozma')['p'][0]['l'] == 100
    print('PASS: all 13 Totem battles, exact auras/sets, foe allies, version tags, cap boxes and walkthrough links')


def check(baseline_path):
    old = json.loads(Path(baseline_path).read_text(encoding='utf-8'))
    new = json.loads((Path(HACK) / 'data.json').read_text(encoding='utf-8'))
    old_pokemon = {pokemon['id']: pokemon for pokemon in old['P']}
    new_pokemon = {pokemon['id']: pokemon for pokemon in new['P']}
    assert trainers(old) == trainers(new), 'trainer keys, teams and all per-trainer data must survive'
    assert [area['n'] for area in old['AR']] == [area['n'] for area in new['AR']]
    for key in ('M', 'MV', 'AB', 'LOC', 'AR', 'ARO', 'TC'):
        assert old[key] == new[key], f'{key} IDs/data changed'
    used = {mon['id'] for trainer in trainers(new).values()
            for team in [trainer['p']] + [partner['p'] for partner in trainer.get('pt', [])] for mon in team}
    available_dex = {pokemon['dex'] for pokemon in old['P'] if pokemon['g'] == 0}
    expected = {pokemon['id'] for pokemon in old['P'] if pokemon['g'] == 0 or pokemon['id'] in used
                or pokemon['g'] == 1 and pokemon['dex'] in available_dex}
    assert set(new_pokemon) == expected
    for pokemon in new['P']:
        previous = old_pokemon[pokemon['id']]
        for key in pokemon.keys() - {'ef', 'et', 'of'}:
            assert pokemon[key] == previous[key], (pokemon['id'], key)
        assert all(other in new_pokemon for other in pokemon['of'])
        assert all(edge[1] in new_pokemon for edge in pokemon['ef'] + pokemon['et'])
    assert used <= new_pokemon.keys()
    poni = {trainer['k'] for group in old['TR']['g'] if group['n'] == 'Post-game: Guardians and Poni Grove'
            for section in group['sec'] for trainer in section['tr']}
    assert len(poni) == 2
    assert poni <= {trainer['k'] for section in new['TR']['g'][-1]['sec'] for trainer in section['tr']}
    old_stops, new_stops = stops(old), stops(new)
    legacy = {position: stop['k'].split('.f', 1)[0] for position, stop in new_stops.items()}   # dex.js migrateWalkState
    assert set(legacy) == set(new_stops) and set(legacy.values()) == set(old_stops)
    fragments = defaultdict(list)
    for current, previous in legacy.items():
        fragments[previous].append(new_stops[current])
        assert new_stops[current]['n'] == old_stops[previous]['n']
    assert len({stop['k'] for stop in new_stops.values()}) == len(new_stops)
    for previous, pieces in fragments.items():
        source = old_stops[previous]
        assert pieces[0]['k'] == previous
        assert not source['s'] and all(not piece['s'] for piece in pieces)
        assert Counter(key for piece in pieces for key in piece['tr']) == Counter(source['tr'])
        assert Counter(area for piece in pieces for area in piece['a']) == Counter(source['a'])
        expected_items = [row for row in source['it'] if row[1] != 'Surge Badge']
        assert [row for piece in pieces for row in piece['it']] == expected_items
        assert [piece['note'] for piece in pieces if piece['note']] == ([source['note']] if source['note'] else [])
    assert Counter(key for stop in new_stops.values() for key in stop['tr']) == Counter(
        key for stop in old_stops.values() for key in stop['tr'])
    assert all(key in trainers(new) for stop in new_stops.values() for key in stop['tr'])
    keys = next(section['r'] for section in new['IT'] if section['n'] == 'Key Items')
    old_keys = next(section['r'] for section in old['IT'] if section['n'] == 'Key Items')
    assert {row[0] for row in keys} == {row[0] for row in old_keys} - {'Surge Badge'}
    print('PASS: species/partner/evolution references, exact trainer keys/teams, all 73 area indices and indexed tables')
    print('PASS: 29 caps, 31 matching boxes, cap-free postgame order, both Poni Grove trainers in Post-game')
    print(f'PASS: {len(old_stops)} legacy stops cover {len(new_stops)} fragments; all trainer occurrences/areas/items retained except Surge Badge')
    shifted = [current for current, previous in legacy.items() if current != previous]
    print(f'INFO: {len(shifted)} stop coordinates change; runtime migration must preserve their semantics, not their raw coordinates')
    print('Removed species:', ', '.join(sorted(old_pokemon.keys() - new_pokemon.keys())))


if __name__ == '__main__':
    check_current(json.loads((Path(HACK) / 'data.json').read_text(encoding='utf-8')))
    if len(sys.argv) > 1:
        check(sys.argv[1])

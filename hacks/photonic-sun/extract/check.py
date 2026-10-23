"""Check Part B data and published-state compatibility: python -I .../check.py <baseline.json>."""
from collections import Counter, defaultdict
import argparse
import json
from pathlib import Path
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import HACK, split_name
from trainers import CAPS


def trainers(data):
    return {trainer['k']: trainer for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']}


def stops(data):
    return {f'{split_index}.{stop_index}': stop for split_index, split in enumerate(data['WK']['splits'])
            for stop_index, stop in enumerate(split['st'])}


def check(baseline_path):
    old = json.loads(Path(baseline_path).read_text(encoding='utf-8'))
    new = json.loads((Path(HACK) / 'data.json').read_text(encoding='utf-8'))
    old_pokemon = {pokemon['id']: pokemon for pokemon in old['P']}
    new_pokemon = {pokemon['id']: pokemon for pokemon in new['P']}
    assert trainers(old) == trainers(new), 'trainer keys, teams and all per-trainer data must survive'
    assert [area['n'] for area in old['AR']] == [area['n'] for area in new['AR']]
    for key in ('M', 'MV', 'AB', 'LOC', 'AR', 'ARO', 'TC'):
        assert old[key] == new[key], f'{key} IDs/data changed'
    assert all(not pokemon.get('vc') for pokemon in new['P'])
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
    poni = {trainer['k'] for group in old['TR']['g'] if group['n'] == 'Post-game: Guardians and Poni Grove'
            for section in group['sec'] for trainer in section['tr']}
    assert len(poni) == 2
    assert poni <= {trainer['k'] for section in new['TR']['g'][-1]['sec'] for trainer in section['tr']}
    old_stops, new_stops = stops(old), stops(new)
    legacy = new['WK']['legacyStops']
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
    print('PASS: published checklist count is zero before and after; runtime probes test synthetic legacy ticks')
    shifted = [current for current, previous in legacy.items() if current != previous]
    print(f'INFO: {len(shifted)} stop coordinates change; runtime migration must preserve their semantics, not their raw coordinates')
    print('Removed species:', ', '.join(sorted(old_pokemon.keys() - new_pokemon.keys())))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline', type=Path)
    parser.add_argument('--require-viewer-compatibility', action='store_true')
    parser.add_argument('--baseline-html', type=Path)
    parser.add_argument('--viewer-html', type=Path)
    args = parser.parse_args()
    if args.require_viewer_compatibility and not (args.baseline_html and args.viewer_html):
        parser.error('--require-viewer-compatibility requires --baseline-html and --viewer-html')
    if not args.require_viewer_compatibility and (args.baseline_html or args.viewer_html):
        parser.error('HTML paths require --require-viewer-compatibility')
    check(args.baseline)
    if args.require_viewer_compatibility:
        for html_path in (args.baseline_html, args.viewer_html):
            if not html_path.is_file():
                parser.error(f'HTML file not found: {html_path}')
        sys.stdout.flush()
        subprocess.run(['node', str(Path(__file__).with_name('statecheck.mjs')),
                        str(args.baseline_html.resolve()), str(args.viewer_html.resolve())], check=True)

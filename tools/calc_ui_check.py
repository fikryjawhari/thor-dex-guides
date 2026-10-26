"""Validate trainer sets against the calculator's single top-slot policy."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE_MOVES = {
    'Assurance', 'Revenge', 'Avalanche', 'Retaliate', 'Stomping Tantrum', 'Temper Flare', 'Lash Out',
    'Round', 'Fusion Bolt', 'Fusion Flare', 'Fickle Beam', 'Fire Pledge', 'Water Pledge', 'Grass Pledge',
    'Fury Cutter', 'Echoed Voice', 'Rollout', 'Ice Ball', 'Rage Fist', 'Last Respects',
}


def check_metronome(data, hack):
    config = json.loads((ROOT / 'hacks' / hack / 'hack.json').read_text(encoding='utf-8'))['cfg']['calc']
    profile = json.loads((ROOT / 'template' / 'calc' / 'profiles' / (config['base'] + '.json')).read_text(encoding='utf-8'))
    profile.update({key: value for key, value in config.items() if key != 'base'})
    state = profile.get('over', {}).get('state', {})
    conflicts = set(profile.get('multihit', {})) | set(profile.get('categoryInvert', []))
    conflicts |= {name for name in STATE_MOVES if state.get(name) is not False}
    holders = 0
    for group in data['TR']['g']:
        for section in group['sec']:
            for trainer in section['tr']:
                for pokemon in trainer['p']:
                    if pokemon.get('i') != 'Metronome':
                        continue
                    holders += 1
                    moves = [data['M'][index] for index in pokemon.get('m', [])]
                    label = f"{trainer['k']} {pokemon['id']}: {', '.join(moves)}"
                    assert not conflicts.intersection(moves), 'Metronome top-slot conflict: ' + label
                    print('Metronome holder:', label)
    print(f'PASS: {holders} Metronome trainer sets have no conflicting top-slot move')

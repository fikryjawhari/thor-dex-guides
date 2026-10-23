"""Finalise Part B after stage 7; safe to rerun on the published data."""
import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools'))
import datajson
import itemstd
from splits import split_name


GYMS = [('Roxanne', 15), ('Brawly', 25), ('Wattson', 34), ('Flannery', 47),
        ('Norman', 59), ('Winona', 68), ('Tate & Liza', 76), ('Juan', 82), ('Elite Four', 85)]


def finalise(data):
    if not data.get('s7'):
        raise ValueError('Run stage 7 before the consistency finaliser')
    itemstd.standardise(data, itemstd.RULES['emerald-imperium'])    # Items standard (plans/items-standard.md)
    species = data['P']
    used = {mon['id'] for group in data['TR']['g'] for section in group['sec']
            for trainer in section['tr'] for mon in trainer['p']}
    obtainable = {pokemon['id'] for pokemon in species if pokemon['g'] == 0}
    base_dex = {pokemon['dex'] for pokemon in species
                if pokemon['id'] in obtainable and not pokemon.get('fc')}
    obtainable.update(pokemon['id'] for pokemon in species
                      if pokemon['g'] == 1 and pokemon['dex'] in base_dex)
    kept = obtainable | used
    missing = used - {pokemon['id'] for pokemon in species}
    if missing:
        raise ValueError(f'Trainer species missing before pruning: {sorted(missing)}')
    removed = [pokemon['id'] for pokemon in species if pokemon['id'] not in kept]
    data['P'] = [pokemon for pokemon in species if pokemon['id'] in kept]
    for pokemon in data['P']:
        for field in ('ef', 'et'):
            pokemon[field] = [entry for entry in pokemon[field] if entry[1] in kept]
        pokemon['of'] = [target for target in pokemon['of'] if target in kept]
    for section in data['IT']:
        if section['k'] == 'mega':
            for row in section['r']:
                if row[2] and row[2] not in kept:
                    row[2] = None
    mega_sections = {section['n'] for section in data['IT'] if section['k'] == 'mega'}
    walk = data['WK']
    for row in walk['np'] + [row for split in walk['splits'] for stop in split['st'] for row in stop['it']]:
        if row[0] in mega_sections and row[3] and row[3] not in kept:
            row[3] = None
    data['AR'][0].update(n='Starter', st=1)
    if len(walk['splits']) != len(GYMS):
        raise ValueError('Expected nine gym/league walkthrough splits')
    for split, (boss, cap) in zip(walk['splits'], GYMS):
        split['n'] = split_name(boss, cap)
    for group in data['TR']['g']:
        if group.get('cap') == 85:
            group['n'] = split_name('Elite Four', 85)
    return removed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data', nargs='?', type=Path,
                        default=Path(__file__).resolve().parents[1] / 'data.json')
    args = parser.parse_args()
    data, raw = datajson.load(args.data)
    removed = finalise(data)
    datajson.save(args.data, data, raw)
    print(f'Kept {len(data["P"])} species; removed {len(removed)}: {", ".join(removed)}')


if __name__ == '__main__':
    main()

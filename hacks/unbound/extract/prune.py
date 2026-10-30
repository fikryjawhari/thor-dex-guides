"""Species kept in P (EI's rule, the user's call for Unbound 2026-10-29): obtainable species and forms, the species shown
trainers use, and the Megas whose base is obtainable. Mega stones and walkthrough item rows of a pruned Mega lose their link.
The 30 removed are the ones no source places (notes.md -> Locations, Availability).
"""
from common import report


def build(data):
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
    report('prune: kept', len(data['P']), 'removed', len(removed), ', '.join(removed))
    return removed

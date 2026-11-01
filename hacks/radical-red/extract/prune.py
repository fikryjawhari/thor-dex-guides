"""D8: obtainable species/forms, trainer species, and Megas of obtainable bases.

Incomplete integration must not prune: locations and trainer units start empty.
"""
from common import report
from extractlib import filter_species_links


def build(data):
    if not data['TR']['g'] or not data['LOC']:
        report('prune: deferred (locations or trainers not built yet); kept all %d species' % len(data['P']))
        return []
    species = data['P']
    used = {mon['id'] for group in data['TR']['g'] for section in group['sec']
            for trainer in section['tr'] for mon in trainer['p']}
    obtainable = {mon['id'] for mon in species if mon['g'] == 0}
    base_dex = {mon['dex'] for mon in species if mon['id'] in obtainable and not mon.get('fc')}
    obtainable.update(mon['id'] for mon in species if mon['g'] == 1 and mon['dex'] in base_dex)
    kept = obtainable | used
    missing = used - {mon['id'] for mon in species}
    if missing:
        raise ValueError('Trainer species missing before pruning: %s' % sorted(missing))
    removed = [mon['id'] for mon in species if mon['id'] not in kept]
    data['P'] = [mon for mon in species if mon['id'] in kept]
    filter_species_links(data['P'], kept)
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
    report('prune: kept %d; removed %d: %s' % (len(data['P']), len(removed), ', '.join(removed)))
    return removed

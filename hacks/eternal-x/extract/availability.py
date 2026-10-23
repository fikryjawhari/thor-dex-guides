"""Keep obtainable species/forms and species used by shown trainers or partners."""
from common import report


def build(data):
    species = data['P']
    by_id = {entry['id']: entry for entry in species}
    bases_by_dex = {}
    for entry in species:
        if not entry.get('fc') and entry['g'] != 1:
            bases_by_dex.setdefault(entry['dex'], []).append(entry['id'])
    obtainable = {entry['id'] for entry in species if entry['w']}
    items = {row[0] for section in data['IT'] for row in section['r']}
    previous = None
    while previous != obtainable:
        previous = set(obtainable)
        for entry in species:
            if entry['id'] in obtainable:
                obtainable.update(target for _, target in entry['et'] + entry['ef'])
            if any(base_id in obtainable for base_id in bases_by_dex.get(entry['dex'], [])):
                if entry.get('fc') or entry['g'] == 1 and entry.get('stone') in items:
                    obtainable.add(entry['id'])
    trainers = [trainer for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']]
    used = {member['id'] for trainer in trainers for team in [trainer] + trainer.get('pt', [])
            for member in team['p']}
    kept = obtainable | used
    removed = [entry['id'] for entry in species if entry['id'] not in kept]
    data['P'] = [entry for entry in species if entry['id'] in kept]
    for entry in data['P']:
        for field in ('et', 'ef'):
            entry[field] = [edge for edge in entry[field] if edge[1] in kept]
        entry['of'] = [target for target in entry['of'] if target in kept]
        if entry['id'] not in obtainable:
            if entry['g'] == 1:
                entry['nu'] = 1
            else:
                entry['g'] = 3
    assert used <= set(by_id), sorted(used - set(by_id))
    report('availability: obtainable', len(obtainable), 'trainer/partner species', len(used),
           'kept', len(data['P']), 'removed', len(removed))
    report('  removed species IDs:', ', '.join(removed) or 'none')

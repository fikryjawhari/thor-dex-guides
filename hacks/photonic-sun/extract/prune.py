"""Species kept in P: obtainable species and forms, the species shown trainers use, and their Megas."""
from common import report
from extractlib import filter_species_links


def build(data):
    pokemon = data['P']
    used = {mon['id'] for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']
            for team in [trainer['p']] + [partner['p'] for partner in trainer.get('pt', [])] for mon in team}
    obtainable = {entry['id'] for entry in pokemon if entry['g'] == 0}
    obtainable_dex = {entry['dex'] for entry in pokemon if entry['id'] in obtainable}
    keep = obtainable | used | {entry['id'] for entry in pokemon if entry['g'] == 1 and entry['dex'] in obtainable_dex}
    removed = [entry['id'] for entry in pokemon if entry['id'] not in keep]
    data['P'] = [entry for entry in pokemon if entry['id'] in keep]
    filter_species_links(data['P'], keep)
    report('species pruned:', len(removed), ', '.join(removed))
    report('species retained:', len(data['P']), 'obtainable:', len(obtainable), 'trainer-only:',
           sum(entry['g'] == 3 for entry in data['P']), 'Megas/Primals:', sum(entry['g'] == 1 for entry in data['P']))

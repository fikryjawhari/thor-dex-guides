"""Photonic Sun's cap grouping and obtainable/trainer species policy."""
from common import report, split_name


def trainer_splits(groups, caps, battles):
    out = [{'n': split_name(cap['n'], cap['l']), 'tab': cap['n'], 'cap': cap['l'], 'note': [], 'sec': []}
           for cap in caps]
    out.extend({'n': split_name(name), 'tab': name, 'cap': 0, 'note': [], 'sec': []}
               for name in ('Post-game: Episode RR', 'Post-game'))
    battle_of = {trainer_id: index for index, battle in enumerate(battles) for trainer_id in battle[2]}
    targets, legacy = {}, {}
    for old_group, group in enumerate(groups):
        for old_section, section in enumerate(group['sec']):
            if group['n'].startswith('Post-game') or group['n'] == 'Other trainers':
                target = len(caps) if group['n'] == 'Post-game: Episode RR' else len(caps) + 1
                copy = {key: value for key, value in section.items() if key not in ('at', 'cap')}
                legacy[f'{target}.{len(out[target]["sec"])}'] = f'{old_group}.{old_section}'
                out[target]['sec'].append(copy)
                targets.update((trainer['k'], target) for trainer in section['tr'])
                continue
            runs = []
            for trainer in section['tr']:
                index = battle_of[trainer['id']]
                target = next(index_cap for index_cap, cap in enumerate(caps)
                              if cap['cut'] >= index and cap['at'] >= section['at'])
                targets[trainer['k']] = target
                if not runs or runs[-1][0] != target:
                    runs.append((target, [], index))
                runs[-1][1].append(trainer)
            if not runs:
                target = next(index_cap for index_cap, cap in enumerate(caps) if cap['at'] >= section['at'])
                runs.append((target, [], caps[target]['cut']))
            for target, trainers, first in runs:
                cap = caps[target]
                copy = {key: value for key, value in section.items() if key not in ('at', 'tr', 'cap')}
                if old_section == 0 and first == runs[0][2] and group.get('note'):
                    copy['note'] = group['note'] + copy.get('note', [])
                copy['tr'] = trainers
                copy['cap'] = [cap['l'], cap['n'], cap['w'], sum(battle[3] for battle in battles[first:cap['cut']])]
                legacy[f'{target}.{len(out[target]["sec"])}'] = f'{old_group}.{old_section}'
                out[target]['sec'].append(copy)
    return out, targets, legacy


def walkthrough_splits(data, old_splits):
    caps, targets = data['_cap_splits'], data['_trainer_splits']
    stop_order = {(part, name): index for index, (part, name, _) in enumerate(data['_stops'])}
    out = [{'n': group['n'], 'cap': group['cap'], 'note': '', 'st': []} for group in data['TR']['g']]
    legacy = {}
    previous_at = 0
    for old_split, split in enumerate(old_splits):
        for old_stop, stop in enumerate(split['st']):
            if stop['s']:
                raise ValueError('Checklist steps require shared stable-key support before cap regrouping')
            part = stop['part']
            if part >= 29:
                target = len(caps) if part == 31 else len(caps) + 1
            else:
                at = stop_order.get((part, stop['n']), previous_at)
                previous_at = at
                target = next(index for index, cap in enumerate(caps) if cap['at'] >= at)
            buckets = {}
            for trainer_key in stop['tr']:
                buckets.setdefault(targets[trainer_key], []).append(trainer_key)
            buckets.setdefault(target, [])
            for fragment, destination in enumerate(sorted(buckets)):
                copy = {key: value for key, value in stop.items() if key != 'part'}
                old_key = f'{old_split}.{old_stop}'
                copy['k'] = old_key + (f'.f{fragment}' if fragment else '')
                copy['tr'] = buckets[destination]
                if fragment:
                    copy.update(a=[], it=[], note='')
                new_key = f'{destination}.{len(out[destination]["st"])}'
                legacy[new_key] = old_key
                out[destination]['st'].append(copy)
    data['WK']['legacyStops'] = legacy
    return out


def prune(data):
    pokemon = data['P']
    used = {mon['id'] for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']
            for team in [trainer['p']] + [partner['p'] for partner in trainer.get('pt', [])] for mon in team}
    obtainable = {entry['id'] for entry in pokemon if entry['g'] == 0}
    obtainable_dex = {entry['dex'] for entry in pokemon if entry['id'] in obtainable}
    keep = obtainable | used | {entry['id'] for entry in pokemon if entry['g'] == 1 and entry['dex'] in obtainable_dex}
    removed = [entry['id'] for entry in pokemon if entry['id'] not in keep]
    data['P'] = [entry for entry in pokemon if entry['id'] in keep]
    for entry in data['P']:
        entry['of'] = [other for other in entry['of'] if other in keep]
        for direction in ('ef', 'et'):
            entry[direction] = [edge for edge in entry[direction] if edge[1] in keep]
    report('species pruned:', len(removed), ', '.join(removed))
    report('species retained:', len(data['P']), 'obtainable:', len(obtainable), 'trainer-only:',
           sum(entry['g'] == 3 for entry in data['P']), 'Megas/Primals:', sum(entry['g'] == 1 for entry in data['P']))

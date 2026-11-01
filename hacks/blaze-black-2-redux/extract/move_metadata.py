"""Pinned Gen V metadata plus Redux docs; regenerate stock with move_source.mjs."""
import copy
import json
from collections import Counter
from pathlib import Path

from common import report
from moveprops import ALIASES, PROPS, effect_text, protect_flags


HERE = Path(__file__).resolve().parent


def effects(record, who='target', chance=100):
    result = []
    if record.get('status'):
        result.append(effect_text({'kind': 'status', 'status': record['status'], 'chance': chance}))
    if record.get('boosts'):
        result.append(effect_text({'kind': 'stages', 'stages': record['boosts'], 'who': who, 'chance': chance}))
    volatile = record.get('volatileStatus')
    if volatile in ('flinch', 'confusion'):
        row = effect_text({'kind': volatile, 'chance': chance})
        if who == 'user':
            row[1] = 'user ' + row[1]
        result.append(row)
    if record.get('self'):
        result.extend(effects(record['self'], 'user', chance))
    return result


def build(data):
    source = json.loads((HERE / 'move_source.json').read_text(encoding='utf-8'))
    for name, move in zip(data['M'], data['MV']):
        stock = copy.deepcopy(source['moves'][name])
        if stock is None:
            report('move metadata: no stock source for unused mirror-only move:', name)
            continue
        if name == 'Wild Charge':
            stock.pop('recoil', None)
        replacements = {
            'Crabhammer': {'chance': 10, 'boosts': {'def': -1}},
            'Octazooka': {'chance': 30, 'boosts': {'accuracy': -1}},
            'Poison Fang': {'chance': 50, 'status': 'tox'},
            'Power Gem': {'chance': 10, 'boosts': {'spd': -1}},
            'Rock Smash': {'chance': 100, 'boosts': {'def': -1}},
            'Scald': {'chance': 10, 'status': 'brn'},
            'Strength': {'chance': 10, 'self': {'boosts': {'atk': 1}}},
        }
        if name in replacements:
            stock.pop('secondaries', None)
            stock['secondary'] = replacements[name]
        if name == 'String Shot':
            stock['boosts'] = {'spe': -2}
        if name == 'Chatter':
            stock['secondary'] = {'chance': 100, 'volatileStatus': 'confusion'}
        if name == 'Psyshield Bash':
            stock['secondary'] = {'chance': 100, 'self': {'boosts': {'def': 1, 'spd': 1}}}
        if name == 'Headlong Rush':
            stock['self'] = {'boosts': {'def': -1, 'spd': -1}}
        if name == 'Esper Wing':
            stock.pop('secondary', None)
        target = stock['target']
        if name == 'Kinesis':
            target = 'allAdjacentFoes'
        if name == 'Howl':
            target = 'self'
        flags = [flag for flag in protect_flags(stock.get('flags', {}), target) if flag in PROPS]
        for flag in stock.get('flags', {}):
            if flag not in ALIASES:
                raise ValueError(f'{name}: unclassified Showdown flag {flag}')
        if name in ('Needle Arm', 'Rock Smash'):
            flags.append('punch')
        if 'sound' in flags:
            flags.append('bypasssub')
        secondaries = stock.get('secondaries') or ([stock['secondary']] if stock.get('secondary') else [])
        if secondaries:
            flags.append('secondary')
        for field in ('recoil', 'drain', 'multihit', 'hasCrashDamage', 'struggleRecoil'):
            if stock.get(field):
                flags.append({'hasCrashDamage': 'crash', 'struggleRecoil': 'recoil'}.get(field, field))
        if stock.get('volatileStatus') == 'partiallytrapped':
            flags.append('binding')
        added = effects(stock, 'user' if target == 'self' else 'target')
        for secondary in secondaries:
            added.extend(effects(secondary, chance=secondary.get('chance', 100)))
        if name == 'Tri Attack':
            added.extend(effect_text({'kind': 'status', 'status': status, 'chance': 20 / 3})
                         for status in ('brn', 'par', 'frz'))
        for field in ('recoil', 'drain', 'heal'):
            if stock.get(field):
                added.append(effect_text({'kind': field, 'fraction': stock[field]}))
        if stock.get('struggleRecoil'):
            added.append(effect_text({'kind': 'recoil', 'fraction': [1, 4], 'basis': 'maxhp'}))
        if name in ('Morning Sun', 'Synthesis', 'Moonlight', 'Rest'):
            added.append(effect_text({'kind': 'heal', 'fraction': [1, 1] if name == 'Rest' else [1, 2]}))
        if name in ('Morning Sun', 'Synthesis', 'Moonlight'):
            added[-1][1] += ' (normal weather)'
            for fraction, weather in (([2, 3], 'sun'), ([1, 4], 'rain, sandstorm or hail')):
                row = effect_text({'kind': 'heal', 'fraction': fraction})
                row[1] += ' (' + weather + ')'
                added.append(row)
        if name == 'Rest':
            added.append([100, 'user sleep for two turns'])
        if name == 'Wish':
            row = effect_text({'kind': 'heal', 'fraction': [1, 2]})
            row[1] += " (user's maximum HP; recipient in this slot next turn)"
            added.append(row)
        if name == 'Swallow':
            for layers, fraction in enumerate(([1, 4], [1, 2], [1, 1]), 1):
                row = effect_text({'kind': 'heal', 'fraction': fraction})
                row[1] += f' (Stockpile {layers}; removes Stockpile boosts)'
                added.append(row)
        if name in ('Charge', 'Skull Bash', 'Stockpile'):
            stages = {'spd': 1} if name == 'Charge' else {'def': 1} if name == 'Skull Bash' else {'def': 1, 'spd': 1}
            row = effect_text({'kind': 'stages', 'who': 'user', 'stages': stages})
            if name == 'Skull Bash':
                row[1] += ' (charging turn)'
            added.append(row)
        if name == 'Curse':
            row = effect_text({'kind': 'stages', 'who': 'user', 'stages': {'atk': 1, 'def': 1, 'spe': -1}})
            row[1] += ' (non-Ghost user only)'
            added.append(row)
        if name == 'Belly Drum':
            added.extend([[100, 'user Atk set to +6'], [100, 'Costs 50% of maximum HP']])
        if name == 'Acupressure':
            added.append([100, 'user or target: one random eligible stat +2'])
        if name == 'Growth':
            added[0][1] += ' (doubled in sun)'
        if name in ('Raging Fury', 'Outrage', 'Petal Dance'):
            row = effect_text({'kind': 'confusion'})
            row[1] = 'user ' + row[1] + ' after the attack ends'
            added.append(row)
        move.update(f=sorted(set(flags)), tg=target, se=added)
    counts = Counter(flag for move in data['MV'] for flag in move.get('f', []))
    report('move metadata: %d targets, %d moves with effects; %s' % (
        sum('tg' in move for move in data['MV']), sum(bool(move.get('se')) for move in data['MV']), dict(sorted(counts.items()))))
    report('move metadata source:', source['source'])

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
        for field in ('recoil', 'drain', 'heal'):
            if stock.get(field):
                added.append(effect_text({'kind': field, 'fraction': stock[field]}))
        if stock.get('struggleRecoil'):
            added.append(effect_text({'kind': 'recoil', 'fraction': [1, 4], 'basis': 'maxhp'}))
        if name in ('Morning Sun', 'Synthesis', 'Moonlight', 'Rest'):
            added.append(effect_text({'kind': 'heal', 'fraction': [1, 1] if name == 'Rest' else [1, 2]}))
        if name == 'Raging Fury':
            added.append([100, 'user confusion after the attack ends'])
        move.update(f=sorted(set(flags)), tg=target, se=added)
    counts = Counter(flag for move in data['MV'] for flag in move.get('f', []))
    report('move metadata: %d targets, %d moves with effects; %s' % (
        sum('tg' in move for move in data['MV']), sum(bool(move.get('se')) for move in data['MV']), dict(sorted(counts.items()))))
    report('move metadata source:', source['source'])

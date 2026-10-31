"""Shared move-page metadata and latest-generation property interactions.

TARGETS is data-only: text and a 2x3 grid, opponents above, user / adjacent
ally / far ally below; cells off, one-of (alternatives), all (simultaneous).
The plan enumerates 15 target codes, not 13. PROPS adds kick for EI's group.
Unknown metadata is never inferred from prose. Only extractors with reliable
Protect flags call protect_flags(), before dropping protect.

effect_text({kind, chance=100, who='target', ...}) returns MV.se [chance,text].
Kinds: status (status=brn/par/psn/tox/slp/frz), flinch, confusion, stages
(stages={atk:1, def:-1}), recoil/drain/heal (fraction=[numerator,denominator]).
Render chance before effect text; recoil/drain/heal are complete phrases.

apply(D,hack) normalises MV.f, reports invalid metadata, replaces MI. Items
exist if named in IT section r rows (row[0]) or trainer/partner/normal mon.i,
not merely mentioned in descriptions. AB contains [name,description,...].
M and MV are parallel. Invalid values/references report without crashing.

hacks/<hack>/extract/move_rules.json is a JSON list:
  [{"a":"Iron Fist","w":"u","e":"Power ×1.3","add":["Mach Punch"],
    "remove":["Thunder Punch"],"src":"battle_util.c:123 / version"}]
Exactly one of a (ability name) / i (item name); w=u/t; nonempty src required.
Optional match selects a stock rule by its original phrase if ambiguous.
Optional e replaces the phrase; add/remove contain move names. New owners
start empty. To add another rule for an existing owner, use match:null.
Unknown/ambiguous references report and skip. Changes get h=1,s=src; unchanged
stock moves survive additions/removals. Only present owners are emitted.
rules_path is a test seam; production uses the hack's extract directory.

Audit: local EI .src/repos/showdown abilities.js/items.js. The expansion
snapshot has moves_info.h but no battle_util.c, battle_script_commands.c or
battle_ai. Hack agents override historical/custom mechanics using source.

Exclusions: type (Blaze, Steelworker, -ate/Normalize/Liquid Voice, plates,
gems, absorb abilities); universal/category (Life Orb, Choice items, Huge
Power, Hustle, Parental Bond, Infiltrator, Sniper, Battle/Shell Armor,
Pressure, Protean/Libero, Magician, Stench, King's Rock, Razor Fang, Shell
Bell, generic damage-trigger items/abilities); status-immunity (Limber,
Insomnia, Immunity, Water Veil, Magma Armor, Own Tempo, Sweet Veil, Purifying
Salt); field (terrain/weather abilities including Psychic Surge); indirect
(item-loss, HP-threshold, species/form changes, generic stat reactions such
as Defiant, Competitive, Opportunist, White Herb). These are move-independent
descriptions, not near-complete move lists. Stat prevention/reflection is
included because it depends on added-effect kind. CAP/hack rules use overrides.
"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def _target(text, opponents, allies):
    return {'text': text, 'grid': [opponents.split(), allies.split()]}


TARGETS = {
    'normal': _target('One adjacent Pokémon', 'one-of one-of off', 'off one-of off'),
    'any': _target('Any one Pokémon, including distant Pokémon', 'one-of one-of one-of', 'off one-of one-of'),
    'adjacentFoe': _target('One adjacent opponent', 'one-of one-of off', 'off off off'),
    'adjacentAlly': _target('One adjacent ally', 'off off off', 'off one-of off'),
    'adjacentAllyOrSelf': _target('The user or one adjacent ally', 'off off off', 'one-of one-of off'),
    'allAdjacentFoes': _target('All adjacent opponents', 'all all off', 'off off off'),
    'allAdjacent': _target('All adjacent Pokémon except the user', 'all all off', 'off all off'),
    'randomNormal': _target('One random adjacent opponent', 'one-of one-of off', 'off off off'),
    'self': _target('The user', 'off off off', 'all off off'),
    'allies': _target("The user's side", 'off off off', 'all all all'),
    'allySide': _target("The user's side", 'off off off', 'all all all'),
    'allyTeam': _target("The user's team, including benched Pokémon", 'off off off', 'all all all'),
    'foeSide': _target('The opposing side', 'all all all', 'off off off'),
    'all': _target('The whole field', 'all all all', 'all all all'),
    'scripted': _target('Whoever last hit the user', 'one-of one-of one-of', 'off one-of one-of'),
}

PROPS = {
    'contact': 'Makes contact', 'punch': 'Punching', 'bite': 'Biting',
    'slicing': 'Slicing', 'sound': 'Sound', 'bullet': 'Ballistic', 'pulse': 'Pulse',
    'powder': 'Powder', 'wind': 'Wind', 'dance': 'Dance', 'heal': 'Healing',
    'kick': 'Kicking', 'secondary': 'Added effect', 'recoil': 'Recoil',
    'drain': 'Draining', 'multihit': 'Multiple hits', 'charge': 'Two-turn move',
    'recharge': 'Must recharge', 'binding': 'Binding', 'crash': 'Crash damage on a miss',
    'noprotect': 'Bypasses Protect', 'bypasssub': 'Bypasses Substitute',
    'gravity': 'Unusable under Gravity', 'defrost': 'Thaws the user',
    'reflectable': 'Can be reflected by Magic Bounce',
}
ALIASES = {name: name for name in PROPS} | {
    'punching': 'punch', 'biting': 'bite', 'ballistic': 'bullet',
    'healing': 'heal', 'kicking': 'kick', 'bypass-sub': 'bypasssub',
}
ALIASES.update(dict.fromkeys((
    'metronome', 'mirror', 'snatch', 'protect', 'distance', 'triple-distance',
    'no-sky', 'nonsky', 'animate-ally', 'allyanim', 'failinstruct', 'nosleeptalk',
    'failcopycat', 'noassist', 'noparentalbond', 'failencore', 'failmimic',
    'minimize', 'failmefirst', 'mustpressure', 'futuremove', 'nosketch',
    'pledgecombo', 'cantusetwice',
)))


def protect_flags(flags, target):
    """Canonical flags plus noprotect, ONLY from authoritative source flags."""
    result = [ALIASES[flag] for flag in flags if ALIASES.get(flag)]
    if 'protect' not in flags and target in {
        'normal', 'any', 'adjacentFoe', 'adjacentAlly', 'adjacentAllyOrSelf',
        'allAdjacentFoes', 'allAdjacent', 'randomNormal', 'scripted',
    }:
        result.append('noprotect')
    return list(dict.fromkeys(result))


STAT_NAMES = {'atk': 'Atk', 'def': 'Def', 'spa': 'SpA', 'spd': 'SpD',
              'spe': 'Speed', 'acc': 'Accuracy', 'eva': 'Evasion',
              'accuracy': 'Accuracy', 'evasion': 'Evasion'}
STATUS_NAMES = {'brn': 'burn', 'par': 'paralysis', 'psn': 'poison',
                'tox': 'bad poison', 'slp': 'sleep', 'frz': 'freeze'}


def effect_text(effect):
    """Build one [chance, text] pair; invalid structured input raises ValueError."""
    chance = effect.get('chance', 100)
    if isinstance(chance, bool) or not isinstance(chance, (int, float)) or not 0 <= chance <= 100:
        raise ValueError('chance must be a number from 0 to 100')
    kind = effect.get('kind')
    if kind == 'status':
        text = STATUS_NAMES.get(effect.get('status'))
        if not text:
            raise ValueError('unknown status')
    elif kind in ('flinch', 'confusion'):
        text = kind
    elif kind == 'stages':
        who = effect.get('who', 'target')
        stages = effect.get('stages', {})
        if who not in ('user', 'target') or not isinstance(stages, dict) or not stages:
            raise ValueError('stages need user/target and a nonempty stages mapping')
        parts = []
        for stat, amount in stages.items():
            if stat not in STAT_NAMES or isinstance(amount, bool) or not isinstance(amount, int) or not -6 <= amount <= 6 or not amount:
                raise ValueError('unknown stat or invalid stage amount')
            parts.append(f"{STAT_NAMES[stat]} {'+' if amount > 0 else '−'}{abs(amount)}")
        text = who + ' ' + ', '.join(parts)
    elif kind in ('recoil', 'drain', 'heal'):
        fraction = effect.get('fraction', [])
        if not isinstance(fraction, (list, tuple)) or len(fraction) != 2 or any(
            isinstance(value, bool) or not isinstance(value, (int, float)) or value <= 0 for value in fraction
        ) or fraction[0] > fraction[1]:
            raise ValueError('fraction must be [positive numerator, denominator], at most 1')
        percent = f'{100 * fraction[0] / fraction[1]:.2f}'.rstrip('0').rstrip('.') + '%'
        text = {'recoil': f'Recoil: {percent} of damage',
                'drain': f'Drains {percent} of damage',
                'heal': f'Heals {percent} of maximum HP'}[kind]
    else:
        raise ValueError(f'unknown effect kind: {kind}')
    return [chance, text]

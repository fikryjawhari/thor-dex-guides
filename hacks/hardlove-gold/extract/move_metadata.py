"""Move-page metadata for the pinned Hardlove hg-engine release.

Moves.c supplies target, contact, Protect/Magic Coat and effectChance. The
normalised engine tables in move_tables.json supply move groups. Effect names
below are mapped from data/battle_scripts/effects and their subscripts at that
same pin, not inferred from the move description. The cache's pinned Showdown
flags supply properties for which the released source has no exposed table.
"""
import json
import re
from pathlib import Path

from moveprops import ALIASES, effect_text, protect_flags


TABLES = json.loads(Path(__file__).with_name('move_tables.json').read_text(encoding='utf-8'))


def key(name):
    return re.sub('[^a-z0-9]', '', name.lower())


GROUPS = {prop: {key(name) for name in record['moves']} for prop, record in TABLES['tables'].items()}
TARGETS = {
    'RANGE_SINGLE_TARGET': 'normal',
    'RANGE_ADJACENT_OPPONENTS': 'allAdjacentFoes',
    'RANGE_USER': 'self',
    'RANGE_RANDOM_OPPONENT': 'randomNormal',
    'RANGE_USER_SIDE': 'allySide',
    'RANGE_ALL_ADJACENT': 'allAdjacent',
    'RANGE_FIELD': 'all',
    'RANGE_OPPONENT_SIDE': 'foeSide',
    'RANGE_SINGLE_TARGET_USER_SIDE': 'adjacentAllyOrSelf',
    'RANGE_ALLY': 'adjacentAlly',
    'RANGE_FRONT': 'adjacentFoe',
    'RANGE_ALL_ADJACENT | RANGE_USER': 'all',
}
STATS = {'ATTACK': 'atk', 'ATK': 'atk', 'DEFENSE': 'def', 'DEF': 'def',
         'SP_ATK': 'spa', 'SP_DEF': 'spd', 'SPEED': 'spe', 'ACCURACY': 'acc',
         'ACC': 'acc', 'EVA': 'eva'}
ALL_STATS = dict.fromkeys(('atk', 'def', 'spa', 'spd', 'spe'), 1)
STATUS = {
    'POISON_HIT': 'psn', 'POISON_MULTI_HIT': 'psn', 'HIGH_CRITICAL_POISON_HIT': 'psn',
    'BADLY_POISON_HIT': 'tox', 'BURN_HIT': 'brn', 'HIGH_CRITICAL_BURN_HIT': 'brn',
    'THAW_AND_BURN_HIT': 'brn', 'RECOIL_BURN_HIT': 'brn', 'SANDSEAR_STORM': 'brn',
    'FREEZE_HIT': 'frz', 'BLIZZARD': 'frz', 'PARALYZE_HIT': 'par',
    'RECOIL_PARALYZE_HIT': 'par', 'THUNDER': 'par', 'WILDBOLT_STORM': 'par',
    'SLEEP_HIT': 'slp', 'CHARGE_TURN_PARALYZE_HIT': 'par', 'BOUNCE': 'par',
    'CHARGE_TURN_BURN_HIT': 'brn',
}
FLINCH = {'FLINCH_HIT', 'FLINCH_MINIMIZE_DOUBLE_HIT', 'CHARGE_TURN_HIGH_CRIT_FLINCH',
          'FLINCH_DOUBLE_DAMAGE_FLY_OR_BOUNCE', 'FLINCH_WHILE_ASLEEP',
          'ALWAYS_FLINCH_FIRST_TURN_ONLY'}
CONFUSION = {'CONFUSE_HIT', 'HURRICANE', 'CHATTER', 'CONFUSE_HIT_CRASH_ON_MISS'}
USER_STAGES = {
    'USER_ATK_DEF_DOWN_HIT': {'atk': -1, 'def': -1},
    'USER_DEF_SP_DEF_DOWN_HIT': {'def': -1, 'spd': -1},
    'USER_DEF_SP_DEF_SPEED_DOWN_HIT': {'def': -1, 'spd': -1, 'spe': -1},
    'USER_DEF_DOWN_HIT': {'def': -1}, 'USER_DEF_DOWN_HIT_REMOVE_PROTECT': {'def': -1},
    'USER_SPEED_DOWN_HIT': {'spe': -1}, 'USER_SPEED_DOWN_2_HIT': {'spe': -2},
    'USER_SP_ATK_DOWN_2': {'spa': -2}, 'MAKE_IT_RAIN': {'spa': -1},
    'CHARGE_TURN_DEF_UP': {'def': 1}, 'CHARGE_TURN_SP_ATK_UP': {'spa': 1},
    'CHARGE_TURN_SP_ATK_UP_RAIN_SKIPS': {'spa': 1},
    'HIGH_CRITICAL_RAISE_SPEED_HIT': {'spe': 1},
    'REMOVE_HAZARDS_AND_BINDING': {'spe': 1},
}
RECOIL = {
    'RECOIL_QUARTER': ([1, 4], 'damage'), 'RECOIL_THIRD': ([1, 3], 'damage'),
    'RECOIL_BURN_HIT': ([1, 3], 'damage'), 'RECOIL_PARALYZE_HIT': ([1, 3], 'damage'),
    'RECOIL_HALF': ([1, 2], 'damage'), 'RECOIL_HALF_MAX_HP': ([1, 2], 'maxhp'),
    'STRUGGLE': ([1, 4], 'maxhp'), 'STEEL_BEAM': ([1, 2], 'maxhp'),
    'MIND_BLOWN': ([1, 2], 'maxhp'),
}
DRAIN = {'RECOVER_HALF_DAMAGE_DEALT': [1, 2], 'RECOVER_DAMAGE_SLEEP': [1, 2],
         'RECOVER_THREE_QUARTERS_DAMAGE_DEALT': [3, 4],
         'RECOVER_HALF_DAMAGE_DEALT_BURN_HIT': [1, 2]}
HEAL = {'RESTORE_HALF_HP': [1, 2], 'HEAL_HALF_REMOVE_FLYING_TYPE': [1, 2],
        'RECOVER_HEALTH_AND_SLEEP': [1, 1], 'HEAL_TARGET': [1, 2],
        'POLLEN_PUFF': [1, 2], 'LIFE_DEW': [1, 4]}
CHARGE = {'FLY', 'DIG', 'DIVE', 'BOUNCE', 'SHADOW_FORCE', 'SKY_DROP', 'BEAK_BLAST'}
BINDING = {'BIND_HIT', 'WHIRLPOOL'}


def added_effects(move):
    """Return structured effects; move chances apply only to indirect effects.

    ON_HIT recoil/drain/self drops are guaranteed, independent of effectChance.
    Tri Attack and Dire Claw choose one of three outcomes, not three independent
    rolls. Fang moves roll status and flinch separately in their subscript.
    """
    data = move['data']
    effect = data['effect'].removeprefix('MOVE_EFFECT_')
    chance = data['effectChance']
    result = []
    def add(kind, **values):
        result.append({'kind': kind, **values})

    if effect in STATUS:
        add('status', chance=chance, status=STATUS[effect])
    if effect in FLINCH:
        add('flinch', chance=chance)
    if effect in CONFUSION:
        add('confusion', chance=chance)
    if effect.startswith('FLINCH_') and effect in {'FLINCH_BURN_HIT', 'FLINCH_FREEZE_HIT', 'FLINCH_PARALYZE_HIT'}:
        add('status', chance=10, status={'FLINCH_BURN_HIT': 'brn', 'FLINCH_FREEZE_HIT': 'frz', 'FLINCH_PARALYZE_HIT': 'par'}[effect])
        add('flinch', chance=10)
    if effect in {'RANDOM_PRIMARY_STATUS_HIT', 'SLEEP_POISON_PARALYZE_HIT'}:
        for status in (('brn', 'frz', 'par') if effect == 'RANDOM_PRIMARY_STATUS_HIT' else ('slp', 'psn', 'par')):
            add('status', chance=chance / 3, status=status)
    stat = re.fullmatch(r'(LOWER|RAISE)_(ATTACK|ATK|DEFENSE|DEF|SP_ATK|SP_DEF|SPEED|ACCURACY|EVA)(_2)?_HIT', effect)
    if stat:
        direction, name, double = stat.groups()
        add('stages', chance=chance, who='user' if direction == 'RAISE' else 'target',
            stages={STATS[name]: (2 if double else 1) * (1 if direction == 'RAISE' else -1)})
    if effect == 'RAISE_ALL_STATS_HIT':
        add('stages', chance=chance, who='user', stages=ALL_STATS)
    if effect == 'BLEAKWIND_STORM':
        add('stages', chance=chance, stages={'spe': -1})
    if effect in USER_STAGES:
        add('stages', who='user', stages=USER_STAGES[effect])
    if effect in RECOIL:
        fraction, basis = RECOIL[effect]
        add('recoil', fraction=fraction, basis=basis)
    if effect in DRAIN:
        add('drain', fraction=DRAIN[effect])
    if effect == 'RECOVER_HALF_DAMAGE_DEALT_BURN_HIT':
        add('status', chance=chance, status='brn')
    if effect in HEAL:
        add('heal', fraction=HEAL[effect])
    return [effect for effect in result if effect.get('chance', 100) > 0]


def describe(move, standard):
    name = key(move['names']['name'])
    effect = move['data']['effect'].removeprefix('MOVE_EFFECT_')
    target = move['battle']['target']
    if target == 'RANGE_SINGLE_TARGET_SPECIAL':
        target = 'scripted' if name in {'counter', 'mirrorcoat', 'metalburst', 'comeuppance'} else 'self'
    else:
        target = TARGETS[target]
    flags = {ALIASES[flag] for flag in standard.get('flags', []) if ALIASES.get(flag)}
    for prop, members in GROUPS.items():
        if prop == 'triage':
            continue
        flags.discard(prop)
        if name in members:
            flags.add(prop)
    source_flags = str(move['battle']['flags']).split()
    flags.discard('contact')
    flags.discard('reflectable')
    flags.discard('defrost')
    if 'FLAG_CONTACT' in source_flags:
        flags.add('contact')
    if 'FLAG_MAGIC_COAT' in source_flags:
        flags.add('reflectable')
    if effect in {'THAW_AND_BURN_HIT', 'RECOIL_BURN_HIT', 'RECOVER_HALF_DAMAGE_DEALT_BURN_HIT'}:
        flags.add('defrost')
    if 'FLAG_PROTECT' in source_flags:
        flags.add('protect')
    if effect.startswith('CHARGE_TURN_') or effect in CHARGE:
        flags.add('charge')
    if effect == 'RECHARGE_AFTER':
        flags.add('recharge')
    if effect in BINDING:
        flags.add('binding')
    if effect in {'CRASH_ON_MISS', 'CONFUSE_HIT_CRASH_ON_MISS'}:
        flags.add('crash')
    effects = added_effects(move)
    for kind in ('recoil', 'drain', 'heal'):
        if any(part['kind'] == kind for part in effects):
            flags.add(kind)
    if name in GROUPS['triage'] or 'drain' in flags:
        flags.add('heal')
    if move['data']['split'] != 'SPLIT_STATUS' and (
        any(part['kind'] in {'status', 'flinch', 'confusion', 'stages'} and 'chance' in part for part in effects)
        or effect in {'PREVENT_ESCAPE_HIT', 'THROAT_CHOP', 'PREVENT_HEALING_HIT'}
    ):
        flags.add('secondary')
    return {'tg': target, 'f': sorted(protect_flags(sorted(flags), target)),
            'se': [effect_text(part) for part in effects]}

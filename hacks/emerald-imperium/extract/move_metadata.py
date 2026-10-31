"""EI move properties/effects from release moves_info.h; Showdown only fills targets.

Latest-generation move data/flags and frostbite match the release configuration
documented in notes.md. The dex site's properties resolve conditional group flags.
No flags or effects are guessed from prose. Nonstandard effect phrases live here
because the shared effect_text builder supports only statuses, stages and fractions.
"""
import json
from pathlib import Path
import re
import subprocess

from common import SRC, key, report
from moveprops import ALIASES, effect_text, protect_flags


GROUPS = {
    'makesContact': 'contact', 'punchingMove': 'punch', 'bitingMove': 'bite',
    'slicingMove': 'slicing', 'soundMove': 'sound', 'ballisticMove': 'bullet',
    'pulseMove': 'pulse', 'powderMove': 'powder', 'windMove': 'wind',
    'danceMove': 'dance', 'healingMove': 'heal', 'kickingMove': 'kick',
    'ignoresSubstitute': 'bypasssub', 'gravityBanned': 'gravity',
    'thawsUser': 'defrost', 'magicCoatAffected': 'reflectable',
}
TARGETS = {
    'MOVE_TARGET_SELECTED': 'normal', 'MOVE_TARGET_USER': 'self',
    'MOVE_TARGET_BOTH': 'allAdjacentFoes', 'MOVE_TARGET_FOES_AND_ALLY': 'allAdjacent',
    'MOVE_TARGET_ALL_BATTLERS': 'all', 'MOVE_TARGET_RANDOM': 'randomNormal',
    'MOVE_TARGET_OPPONENTS_FIELD': 'foeSide', 'MOVE_TARGET_ALLY': 'adjacentAlly',
    'MOVE_TARGET_USER | MOVE_TARGET_ALLY': 'adjacentAllyOrSelf',
}
STAT = {'ATK': 'atk', 'DEF': 'def', 'SP_ATK': 'spa', 'SP_DEF': 'spd',
        'SPD': 'spe', 'ACC': 'acc', 'EVS': 'eva'}
STATUS = {'BURN': 'brn', 'PARALYSIS': 'par', 'POISON': 'psn', 'TOXIC': 'tox',
          'SLEEP': 'slp', 'FREEZE': 'frz', 'FREEZE_OR_FROSTBITE': 'frz'}
STAGES = {
    'ALL_STATS_UP': dict.fromkeys(('atk', 'def', 'spa', 'spd', 'spe'), 1),
    'DEF_SPDEF_DOWN': {'def': -1, 'spd': -1},
    'ATK_DEF_DOWN': {'atk': -1, 'def': -1},
    'V_CREATE': {'def': -1, 'spd': -1, 'spe': -1},
}
OTHER = {
    'PAYDAY': 'Scatters coins', 'WRAP': 'Binds the target',
    'RECHARGE': 'User must recharge', 'THRASH': 'User becomes confused after the rampage',
    'FEINT': 'Removes protection', 'PREVENT_ESCAPE': 'Prevents the target from escaping',
    'REMOVE_STATUS': 'Cures the target of the status specified by the move',
    'STEAL_ITEM': "Steals the target's held item", 'RAPID_SPIN': 'Removes binding, Leech Seed and entry hazards from the user',
    'BUG_BITE': "Eats the target's Berry", 'SMACK_DOWN': 'Grounds the target',
    'REMOVE_ARG_TYPE': "Removes the move's specified type from the user",
    'KNOCK_OFF': "Removes the target's held item", 'UPROAR': 'Prevents sleep during the uproar',
    'SECRET_POWER': 'Terrain-dependent added effect', 'FLAME_BURST': 'Damages adjacent allies of the target',
    'ROUND': 'Enables allied Round to follow immediately at double power',
    'CLEAR_SMOG': "Resets the target's stat stages", 'INCINERATE': "Destroys the target's Berry or Gem",
    'THROAT_CHOP': 'Prevents sound moves for two turns', 'CORE_ENFORCER': "Suppresses the target's ability if it has already moved",
    'ION_DELUGE': 'Normal moves become Electric for the rest of the turn',
    'LIGHT_SCREEN': "Sets Light Screen on the user's side", 'REFLECT': "Sets Reflect on the user's side",
    'LEECH_SEED': 'Seeds the target', 'HAZE': 'Resets all stat stages',
    'EERIE_SPELL': "Removes 3 PP from the target's last move", 'STEALTH_ROCK': "Sets Stealth Rock on the target's side",
    'SPIKES': "Sets Spikes on the target's side", 'TERA_BLAST': 'User Atk −2, SpA −2 when Stellar Terastallized',
    'ORDER_UP': 'User stat rises according to the commanding Tatsugiri form',
    'SALT_CURE': 'Inflicts Salt Cure', 'SYRUP_BOMB': 'Lowers target Speed at the end of each turn for three turns',
    'PSYCHIC_NOISE': 'Prevents healing for two turns',
}


def _enabled(expression):
    expression = expression.replace('(', '').replace(')', '').strip()
    if expression in ('TRUE', 'FALSE', '0', '1'):
        return expression in ('TRUE', '1')
    def compare(term):
        match = re.fullmatch(r'(B_\w+)\s*(>=|<=|==|!=|<|>)\s*(GEN_\d+|TRUE|FALSE)', term.strip())
        if not match:
            raise ValueError(f'Unknown move configuration: {term}')
        setting, operation, value = match.groups()
        left = 1 if setting == 'B_USE_FROSTBITE' else 9
        right = int(value[4:]) if value.startswith('GEN_') else int(value == 'TRUE')
        return {'>=': left >= right, '<=': left <= right, '==': left == right,
                '!=': left != right, '<': left < right, '>': left > right}[operation]
    return any(all(compare(term) for term in part.split('&&')) for part in expression.split('||'))


def _latest(expression):
    expression = expression.strip()
    if '?' in expression:
        condition, choices = expression.split('?', 1)
        yes, no = choices.split(':', 1)
        return _latest(yes if _enabled(condition) else no)
    return expression


def _preprocess(source):
    active = [True]
    result = []
    for line in source.splitlines():
        directive = re.match(r'\s*#(if|else|endif)\b\s*(.*)', line)
        if directive:
            kind, condition = directive.groups()
            if kind == 'if':
                active.append(_enabled(condition))
            elif kind == 'else':
                active[-1] = not active[-1]
            else:
                active.pop()
        elif all(active):
            result.append(line)
    return '\n'.join(result)


def _field(entry, name, default=''):
    found = re.search(r'\.' + name + r'\s*=\s*([^,\n]+)', entry)
    return _latest(found[1]) if found else default


def _effect(code, chance, who):
    if code in STATUS:
        result = effect_text({'kind': 'status', 'status': STATUS[code], 'chance': chance})
        if code == 'FREEZE_OR_FROSTBITE':
            result[1] = 'frostbite'
        return result
    if code in ('FLINCH', 'CONFUSION'):
        return effect_text({'kind': code.lower(), 'chance': chance})
    stages = STAGES.get(code)
    match = re.fullmatch(r'(ATK|DEF|SP_ATK|SP_DEF|SPD|ACC|EVS)_(PLUS|MINUS)_(\d)', code)
    if match:
        stat, direction, amount = match.groups()
        stages = {STAT[stat]: int(amount) * (1 if direction == 'PLUS' else -1)}
    if stages:
        return effect_text({'kind': 'stages', 'stages': stages, 'who': who, 'chance': chance})
    if code in ('TRI_ATTACK', 'DIRE_CLAW'):
        statuses = ('brn', 'frz', 'par') if code == 'TRI_ATTACK' else ('psn', 'par', 'slp')
        words = [effect_text({'kind': 'status', 'status': status})[1] for status in statuses]
        return [chance, ', '.join(words) + ' (one at random)']
    if code == 'RECOIL_HP_25':
        return effect_text({'kind': 'recoil', 'fraction': [1, 4], 'basis': 'maxhp'})
    if code in OTHER:
        return [chance, OTHER[code]]
    if code != '0':
        raise ValueError(f'Unmapped added effect: {code}')


class Metadata:
    def __init__(self):
        source = _preprocess((Path(SRC) / 'repos/expansion/moves_info.h').read_text(encoding='utf-8'))
        self.entries = {}
        for entry in re.split(r'\n\s*\[MOVE_', source)[1:]:
            name = re.search(r'\.name = COMPOUND_STRING\("([^"]*)"\)', entry)
            if name:
                self.entries[key(name[1])] = entry
        showdown = Path(SRC) / 'repos/showdown/moves.js'
        loaded = subprocess.check_output(['node', '-e',
            'process.stdout.write(JSON.stringify(require(process.argv[1]).Moves))', str(showdown)], text=True, encoding='utf-8')
        self.showdown = json.loads(loaded)
        self.fallbacks = []

    def apply(self, name, move, dex):
        entry = self.entries.get(key(name))
        standard = self.showdown.get(key(name), {})
        if not entry:
            raise ValueError(f'No expansion move metadata: {name}')
        dex_flags = {ALIASES.get(flag, flag) for flag in dex.get('properties', [])}
        flags = []
        for field, flag in GROUPS.items():
            value = _field(entry, field, 'FALSE')
            enabled = flag in dex_flags if value == 'B_EXTRAPOLATED_MOVE_FLAGS' else _enabled(value)
            if enabled:
                flags.append(flag)
        target = _field(entry, 'target')
        if target == 'MOVE_TARGET_DEPENDS':
            if name in ('Counter', 'Mirror Coat', 'Metal Burst', 'Comeuppance'):
                target = 'scripted'
            else:
                target = standard.get('target', 'self')
                self.fallbacks.append(f'{name}: target ({target}; expansion DEPENDS)')
        else:
            target = TARGETS[target]
        if target == 'self' and standard.get('target') in ('allySide', 'allyTeam', 'allies'):
            target = standard['target']
            self.fallbacks.append(f'{name}: side/team target ({target}; expansion USER)')
        if name == 'Life Dew':
            target = 'allies'
        move['tg'] = target
        if not _enabled(_field(entry, 'ignoresProtect', 'FALSE')):
            flags.append('protect')
        flags = protect_flags(flags, target)
        effects = []
        primary = _field(entry, 'effect')
        for block in re.findall(r'\{\s*\.moveEffect\s*=\s*[^}]+\}', entry):
            code = _field(block, 'moveEffect').removeprefix('MOVE_EFFECT_')
            chance = int(_field(block, 'chance', '100'))
            who = 'user' if _enabled(_field(block, 'self', 'FALSE')) else 'target'
            effect = _effect(code, chance, who)
            if effect and move['c'] != 'Status':
                if _enabled(_field(block, 'onChargeTurnOnly', 'FALSE')):
                    effect[1] += ' (on the charge turn)'
                if _enabled(_field(block, 'onlyIfTargetRaisedStats', 'FALSE')):
                    effect[1] += ' (if the target raised stats this turn)'
                effects.append(effect)
            if code == 'WRAP':
                flags.append('binding')
            if code == 'RECHARGE':
                flags.append('recharge')
            sheer = _field(block, 'sheerForceBoost')
            if sheer == 'SHEER_FORCE_BOOST' or (sheer != 'SHEER_FORCE_NO_BOOST' and int(_field(block, 'chance', '0')) > 0):
                flags.append('secondary')
        recoil = int(_field(entry, 'recoil', '0'))
        if recoil:
            flags.append('recoil')
            effects.append(effect_text({'kind': 'recoil', 'fraction': [recoil, 100]}))
        if primary in ('EFFECT_ABSORB', 'EFFECT_DREAM_EATER'):
            flags.append('drain')
            effects.append(effect_text({'kind': 'drain', 'fraction': [int(_field(entry, 'argument', '50')), 100]}))
        if primary in ('EFFECT_MULTI_HIT', 'EFFECT_TRIPLE_KICK', 'EFFECT_BEAT_UP', 'EFFECT_POPULATION_BOMB') or int(_field(entry, 'strikeCount', '1')) > 1:
            flags.append('multihit')
        if primary in ('EFFECT_TWO_TURNS_ATTACK', 'EFFECT_SOLAR_BEAM', 'EFFECT_SEMI_INVULNERABLE', 'EFFECT_SKY_DROP', 'EFFECT_GEOMANCY'):
            flags.append('charge')
        if primary == 'EFFECT_RECOIL_IF_MISS':
            flags.append('crash')
        if primary == 'EFFECT_RECOIL_HP_25':
            effects.append(effect_text({'kind': 'recoil', 'fraction': [1, 4], 'basis': 'maxhp'}))
        if primary == 'EFFECT_RESTORE_HP':
            effects.append(effect_text({'kind': 'heal', 'fraction': [1, 2]}))
        if effects:
            move['se'] = effects
        move['f'] = list(dict.fromkeys(flags))

    def finish(self):
        report('move metadata: expansion moves_info.h; dex-site conditional group flags; Showdown target fallback:', '; '.join(self.fallbacks))

"""Shared move-page metadata and latest-generation property interactions.

TARGETS is data-only: text and a 2x3 grid, opponents above, user / adjacent
ally / far ally below; cells off, one-of (alternatives), all (simultaneous).
The plan enumerates 15 target codes, not 13. PROPS adds kick for EI's group.
Unknown metadata is never inferred from prose. Only extractors with reliable
Protect flags call protect_flags(), before dropping protect.

effect_text({kind, chance=100, who='target', ...}) returns MV.se [chance,text].
Kinds: status (status=brn/par/psn/tox/slp/frz), flinch, confusion, stages
(stages={atk:1, def:-1}), recoil/drain/heal (fraction=[numerator,denominator],
optional basis=damage/maxhp; defaults damage for recoil/drain, maxhp for heal).
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

Audit: local EI .src/repos/showdown abilities.js/items.js (Showdown 0.11.11),
and missing expansion sources fetched read-only to .tmp/u1 from
iriv24/pokeemerald-expansion 2576d0f3f4c861c760f0c55198e37e6d7b91683e:
src/battle_util.c, battle_script_commands.c, battle_ai_main.c. Inspect move
flags, secondaries, recoil, multihit, base power, priority and explicit lists,
including checks delegated to checkMoveMakesContact()/engine events. EI's
Iron Fist is 1.3 there, not stock 1.2: its agent must supply an override.
Showdown 0.11.11 dist/sim/pokemon.js was also checked for Utility Umbrella
effectiveWeather semantics; moves.js supplies its explicit move lists.

Exclusions: type (Blaze, Steelworker, -ate/Normalize/Liquid Voice, plates,
gems, absorb abilities); universal/category (Life Orb, Choice items, Huge
Power, Hustle, Parental Bond, Infiltrator, Sniper, Battle/Shell Armor,
Pressure, Protean/Libero, Magician, Shell Bell, Muscle Band, Wise Glasses,
Assault Vest, generic damage-trigger items/abilities); status-immunity (Limber,
Insomnia, Immunity, Water Veil, Magma Armor, Own Tempo, Sweet Veil, Purifying
Salt); field (terrain/weather abilities including Psychic Surge); indirect
(item-loss, HP-threshold, automatic species/form changes, Fling/Natural Gift
payloads). Move-specific form changes (Gulp Missile, King's Shield) are included.
These are move-independent descriptions, not near-complete move lists.
Stage/status reactions are included when their added-effect kind is known.
Primary status-move stage changes use explicit stock name lists; overrides
must update these for a hack that changes them. CAP/hack rules use overrides;
unreleased Future entries (Piercing Drill) and informational warning abilities
(Anticipation, Forewarn) are not stock interactions. Accuracy modifiers applying
to all moves (Compound Eyes, Victory Star, No Guard, Wide/Zoom Lens, evasion
items, Micle Berry, Blunder Policy) are universal, not property-selected rules.
"""

import json
import math
import re
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
    result = [ALIASES.get(flag, flag) for flag in flags if ALIASES.get(flag, flag)]
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
    if not isinstance(effect, dict):
        raise ValueError('effect must be a mapping')
    chance = effect.get('chance', 100)
    if not _number(chance) or not 0 <= chance <= 100:
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
            not _number(value) or value <= 0 for value in fraction
        ) or fraction[0] > fraction[1]:
            raise ValueError('fraction must be [positive numerator, denominator], at most 1')
        percent = f'{100 * fraction[0] / fraction[1]:.2f}'.rstrip('0').rstrip('.') + '%'
        basis = effect.get('basis', 'maxhp' if kind == 'heal' else 'damage')
        if basis not in ('damage', 'maxhp') or kind == 'drain' and basis != 'damage':
            raise ValueError('basis must be damage or maxhp')
        measure = 'damage' if basis == 'damage' else 'maximum HP'
        text = {'recoil': f'Recoil: {percent} of {measure}',
                'drain': f'Drains {percent} of damage',
                'heal': f'Heals {percent} of {measure}'}[kind]
    else:
        raise ValueError(f'unknown effect kind: {kind}')
    return [chance, text]


def _rule(kind, name, side, phrase, **test):
    return {kind: name, 'w': side, 'e': phrase, 'test': test}


RULES = [
    _rule('a', 'Iron Fist', 'u', 'Power ×1.2', flag='punch'),
    _rule('a', 'Strong Jaw', 'u', 'Power ×1.5', flag='bite'),
    _rule('a', 'Sharpness', 'u', 'Power ×1.5', flag='slicing'),
    _rule('a', 'Mega Launcher', 'u', 'Power ×1.5', flag='pulse', damaging=True),
    _rule('a', 'Mega Launcher', 'u', 'Healing ×1.5', names=['Heal Pulse']),
    _rule('a', 'Tough Claws', 'u', 'Power ×1.3', flag='contact', damaging=True),
    _rule('a', 'Punk Rock', 'u', 'Power ×1.3', flag='sound', damaging=True),
    _rule('a', 'Punk Rock', 't', 'Damage ×0.5', flag='sound', damaging=True),
    _rule('a', 'Reckless', 'u', 'Power ×1.2', flags_any=['recoil', 'crash'], not_names=['Struggle']),
    _rule('a', 'Rock Head', 'u', 'No recoil damage', flag='recoil', not_names=['Struggle']),
    _rule('a', 'Magic Guard', 'u', 'No recoil or crash damage', flags_any=['recoil', 'crash'], not_names=['Struggle']),
    _rule('a', 'Magic Guard', 'u', 'No indirect self-damage', names=['Mind Blown', 'Steel Beam', 'Chloroblast']),
    _rule('a', 'Magic Guard', 't', 'No binding damage (still trapped)', flag='binding'),
    _rule('a', 'Magic Guard', 't', 'No residual damage', names=['Leech Seed', 'Curse', 'Nightmare', 'Salt Cure', 'G-Max Vine Lash', 'G-Max Wildfire', 'G-Max Cannonade', 'G-Max Volcalith']),
    _rule('a', 'Technician', 'u', 'Power ×1.5 when effective power ≤60', damaging=True, any=[
        {'bp_max': 60}, {'names': ['Low Kick', 'Grass Knot', 'Heavy Slam', 'Heat Crash',
                                 'Gyro Ball', 'Electro Ball', 'Flail', 'Reversal',
                                 'Return', 'Frustration', 'Crush Grip', 'Wring Out',
                                 'Hard Press', 'Eruption', 'Water Spout', 'Dragon Energy',
                                 'Fling', 'Present', 'Trump Card', 'Beat Up', 'Punishment',
                                 'Stored Power', 'Power Trip', 'Magnitude']},
    ]),
    _rule('a', 'Sheer Force', 'u', 'Power ×1.3; removes added effects', flag='secondary', damaging=True),
    _rule('a', 'Serene Grace', 'u', 'Added-effect chance ×2 (up to 100%)', effect='chance'),
    _rule('a', 'Shield Dust', 't', 'Blocks added effects on the target', effect='secondary-target'),
    _rule('a', 'Skill Link', 'u', 'Maximum hits; one accuracy check', multihit='linked'),
    _rule('a', 'Long Reach', 'u', 'No contact', flag='contact'),
    _rule('a', 'Unseen Fist', 'u', 'Bypasses protection on contact', flag='contact', not_flag='noprotect'),
    _rule('a', 'Triage', 'u', 'Priority +3', flag='heal'),
    _rule('a', 'Prankster', 'u', 'Priority +1; blocked by opposing Dark Pokémon', status=True),
    _rule('a', 'Mycelium Might', 'u', 'Moves last in its priority bracket; ignores abilities', status=True),
    _rule('a', 'Good as Gold', 't', 'Blocks it', status=True, targets_other=True),
    _rule('a', 'Wonder Skin', 't', 'Accuracy capped at 50%', status=True, targets_other=True, accuracy_min=51),
    _rule('a', 'Queenly Majesty', 't', 'Blocks opposing priority moves against its side', priority_min=0, targets_other=True),
    _rule('a', 'Dazzling', 't', 'Blocks opposing priority moves against its side', priority_min=0, targets_other=True),
    _rule('a', 'Armor Tail', 't', 'Blocks opposing priority moves against its side', priority_min=0, targets_other=True),
    _rule('a', 'Bulletproof', 't', 'Blocks it', flag='bullet'),
    _rule('a', 'Soundproof', 't', 'Blocks it', flag='sound'),
    _rule('a', 'Overcoat', 't', 'Blocks it', flag='powder'),
    _rule('a', 'Wind Rider', 't', 'Blocks it; Atk +1', flag='wind'),
    _rule('a', 'Wind Rider', 'u', 'Atk +1', names=['Tailwind']),
    _rule('a', 'Wind Power', 't', 'Charges the next Electric attack', flag='wind'),
    _rule('a', 'Wind Power', 'u', 'Charges the next Electric attack', names=['Tailwind']),
    _rule('a', 'Dancer', 't', 'Copies the dance', flag='dance'),
    _rule('a', 'Magic Bounce', 't', 'Reflects it', flag='reflectable'),
    _rule('a', 'Damp', 't', 'Prevents use while on the field', names=['Explosion', 'Self-Destruct', 'Mind Blown', 'Misty Explosion']),
    _rule('a', 'Gulp Missile', 'u', 'Loads prey for a later counterattack (Cramorant)', names=['Surf', 'Dive']),
    _rule('a', 'Stance Change', 'u', 'Changes Aegislash to Shield Forme', names=["King's Shield"]),
    _rule('a', 'Liquid Ooze', 't', 'Draining hurts the user instead of healing', any=[{'flag': 'drain'}, {'names': ['Leech Seed', 'Strength Sap']}]),
    _rule('a', 'Inner Focus', 't', 'Prevents flinching', effect='flinch'),
    _rule('a', 'Steadfast', 't', 'Speed +1 when flinched', effect='flinch'),
    _rule('a', 'Fluffy', 't', 'Contact damage ×0.5 (Fire modifier separate)', flag='contact', damaging=True),
    _rule('a', 'Rough Skin', 't', 'Hurts the attacker: 1/8 maximum HP', flag='contact'),
    _rule('a', 'Iron Barbs', 't', 'Hurts the attacker: 1/8 maximum HP', flag='contact'),
    _rule('a', 'Static', 't', '30% chance to paralyse the attacker', flag='contact'),
    _rule('a', 'Flame Body', 't', '30% chance to burn the attacker', flag='contact'),
    _rule('a', 'Poison Point', 't', '30% chance to poison the attacker', flag='contact'),
    _rule('a', 'Effect Spore', 't', 'May sleep (11%), paralyse (10%) or poison (9%) the attacker', flag='contact'),
    _rule('a', 'Cute Charm', 't', '30% chance to infatuate the attacker', flag='contact'),
    _rule('a', 'Poison Touch', 'u', '30% chance to poison the target', flag='contact'),
    _rule('a', 'Stench', 'u', 'Adds 10% flinch', damaging=True, effect='no-flinch'),
    _rule('a', 'Gooey', 't', 'Attacker Speed −1', flag='contact'),
    _rule('a', 'Tangling Hair', 't', 'Attacker Speed −1', flag='contact'),
    _rule('a', 'Mummy', 't', "Replaces the attacker's ability with Mummy", flag='contact'),
    _rule('a', 'Lingering Aroma', 't', "Replaces the attacker's ability with Lingering Aroma", flag='contact'),
    _rule('a', 'Wandering Spirit', 't', 'Swaps abilities with the attacker', flag='contact'),
    _rule('a', 'Perish Body', 't', 'Starts a three-turn perish count for both Pokémon', flag='contact'),
    _rule('a', 'Aftermath', 't', 'Hurts the attacker: 1/4 maximum HP if the holder faints', flag='contact'),
    _rule('a', 'Pickpocket', 't', "Steals the attacker's item if empty-handed", flag='contact'),
    _rule('a', 'Suction Cups', 't', 'Prevents forced switching', names=['Roar', 'Whirlwind', 'Dragon Tail', 'Circle Throw']),
    _rule('a', 'Guard Dog', 't', 'Prevents forced switching', names=['Roar', 'Whirlwind', 'Dragon Tail', 'Circle Throw']),
    _rule('a', 'Sticky Hold', 't', 'Prevents item loss while the holder survives', names=['Knock Off', 'Thief', 'Covet', 'Trick', 'Switcheroo', 'Bug Bite', 'Pluck', 'Incinerate', 'Corrosive Gas']),
    _rule('a', 'Klutz', 'u', 'Prevents Fling', names=['Fling']),
    _rule('a', 'Oblivious', 't', 'Blocks it', names=['Attract', 'Captivate', 'Taunt']),
    _rule('a', 'Aroma Veil', 't', 'Protects its side from mental effects', names=['Attract', 'Disable', 'Encore', 'Heal Block', 'Taunt', 'Torment']),
    _rule('i', 'Punching Glove', 'u', 'Power ×1.1; no contact', flag='punch'),
    _rule('i', 'Protective Pads', 'u', 'Prevents contact-triggered effects (still makes contact)', flag='contact'),
    _rule('i', 'Rocky Helmet', 't', 'Hurts the attacker: 1/6 maximum HP', flag='contact'),
    _rule('i', 'Sticky Barb', 't', 'Transfers to an empty-handed attacker', flag='contact'),
    _rule('i', 'Safety Goggles', 't', 'Blocks it', flag='powder'),
    _rule('i', 'Covert Cloak', 't', 'Blocks added effects on the target', effect='secondary-target'),
    _rule('i', "King's Rock", 'u', 'Adds 10% flinch', damaging=True, effect='no-flinch'),
    _rule('i', 'Razor Fang', 'u', 'Adds 10% flinch', damaging=True, effect='no-flinch'),
    _rule('i', 'Throat Spray', 'u', 'SpA +1 after use; consumed', flag='sound'),
    _rule('i', 'Big Root', 'u', 'Recovery ×1.3', any=[{'flag': 'drain'}, {'names': ['Leech Seed', 'Ingrain', 'Aqua Ring', 'Strength Sap']}]),
    _rule('i', 'Power Herb', 'u', 'Skips the charging turn; consumed', flag='charge', not_names=['Sky Drop']),
    _rule('i', 'Loaded Dice', 'u', '4–5 hits', multihit='variable'),
    _rule('i', 'Loaded Dice', 'u', 'One accuracy check', names=['Triple Kick', 'Triple Axel']),
    _rule('i', 'Loaded Dice', 'u', '4–10 hits; one accuracy check', names=['Population Bomb']),
    _rule('i', 'Grip Claw', 'u', 'Binding lasts 7 turns', flag='binding'),
    _rule('i', 'Binding Band', 'u', 'Binding damage becomes 1/6 maximum HP', flag='binding'),
    _rule('i', 'Damp Rock', 'u', 'Rain lasts 8 turns', names=['Rain Dance', 'Max Geyser']),
    _rule('i', 'Heat Rock', 'u', 'Sun lasts 8 turns', names=['Sunny Day', 'Max Flare']),
    _rule('i', 'Smooth Rock', 'u', 'Sandstorm lasts 8 turns', names=['Sandstorm', 'Max Rockfall']),
    _rule('i', 'Icy Rock', 'u', 'Snow or hail lasts 8 turns', names=['Snowscape', 'Hail', 'Chilly Reception', 'Max Hailstorm']),
    _rule('i', 'Light Clay', 'u', 'Screens last 8 turns', names=['Reflect', 'Light Screen', 'Aurora Veil', 'Glitzy Glow', 'Baddy Bad', 'G-Max Resonance']),
    _rule('i', 'Terrain Extender', 'u', 'Terrain lasts 8 turns', names=['Electric Terrain', 'Grassy Terrain', 'Misty Terrain', 'Psychic Terrain', 'Max Lightning', 'Max Overgrowth', 'Max Starfall', 'Max Mindstorm']),
    _rule('i', 'Mental Herb', 't', 'Cures mental effects; consumed', names=['Attract', 'Disable', 'Encore', 'Heal Block', 'Taunt', 'Torment']),
    _rule('i', 'Utility Umbrella', 'u', 'Ignores sun/rain changes to recovery', names=['Synthesis', 'Morning Sun', 'Moonlight']),
    _rule('i', 'Utility Umbrella', 'u', 'Prevents sun from skipping the charging turn', names=['Solar Beam', 'Solar Blade']),
    _rule('i', 'Utility Umbrella', 'u', 'Ignores rain power reduction', names=['Solar Beam', 'Solar Blade']),
    _rule('i', 'Utility Umbrella', 'u', 'Prevents rain from skipping the charging turn', names=['Electro Shot']),
    _rule('i', 'Utility Umbrella', 'u', 'Prevents the extra stat boosts in sun', names=['Growth']),
    _rule('i', 'Utility Umbrella', 'u', 'Ignores sun/rain changes to type and power', names=['Weather Ball']),
    _rule('i', 'Utility Umbrella', 't', 'Ignores sun/rain changes to accuracy', names=['Thunder', 'Hurricane', 'Bleakwind Storm', 'Sandsear Storm', 'Wildbolt Storm']),
    _rule('i', 'Destiny Knot', 't', 'Infatuates the attacker too', names=['Attract']),
    _rule('i', 'Room Service', 'u', 'Speed −1 when Trick Room begins; consumed', names=['Trick Room']),
    _rule('i', 'Room Service', 't', 'Speed −1 when Trick Room begins; consumed', names=['Trick Room']),
    _rule('i', 'Ability Shield', 't', 'Prevents ability changes or suppression', names=['Simple Beam', 'Entrainment', 'Worry Seed', 'Gastro Acid', 'Core Enforcer', 'Skill Swap']),
    _rule('i', 'Ability Shield', 'u', 'Prevents changes to its own ability', names=['Role Play', 'Skill Swap', 'Doodle']),
    _rule('i', 'Ability Shield', 't', 'Keeps its ability active against ability-ignoring moves', names=['Sunsteel Strike', 'Moongeist Beam', 'Photon Geyser', 'Light That Burns the Sky', 'Searing Sunraze Smash', 'Menacing Moonraze Maelstrom', 'G-Max Drum Solo', 'G-Max Fireball', 'G-Max Hydrosnipe']),
    _rule('i', 'Float Stone', 'u', 'Halves user weight; may lower power', names=['Heavy Slam', 'Heat Crash']),
    _rule('i', 'Float Stone', 't', 'Halves target weight; may lower power', names=['Low Kick', 'Grass Knot']),
    _rule('i', 'Float Stone', 't', 'Halves target weight; may raise power', names=['Heavy Slam', 'Heat Crash']),
]

LOWERING_MOVES = {
    'atk': ['Growl', 'Charm', 'Feather Dance', 'Play Nice', 'Baby-Doll Eyes', 'Tickle',
            'Noble Roar', 'Parting Shot', 'Tearful Look', 'Venom Drench', 'Strength Sap', 'Memento'],
    'def': ['Tail Whip', 'Leer', 'Screech', 'Tickle', 'Octolock', 'Spicy Extract'],
    'spa': ['Confide', 'Captivate', 'Eerie Impulse', 'Noble Roar', 'Parting Shot',
            'Tearful Look', 'Venom Drench', 'Memento'],
    'spd': ['Fake Tears', 'Metal Sound', 'Octolock'],
    'spe': ['String Shot', 'Cotton Spore', 'Scary Face', 'Venom Drench',
            'Toxic Thread', 'Tar Shot', 'Sticky Web'],
    'acc': ['Sand Attack', 'Smokescreen', 'Flash', 'Kinesis'],
    'eva': ['Sweet Scent', 'Defog'],
}
for ability in ('Clear Body', 'White Smoke', 'Full Metal Body'):
    RULES.append(_rule('a', ability, 't', 'Prevents stat drops', lower='*'))
RULES.extend([
    _rule('a', 'Mirror Armor', 't', 'Reflects stat drops', lower='*'),
    _rule('a', 'Hyper Cutter', 't', 'Prevents Atk drops', lower='atk'),
    _rule('a', 'Big Pecks', 't', 'Prevents Def drops', lower='def'),
    _rule('a', 'Keen Eye', 't', 'Prevents accuracy drops', lower='acc'),
    _rule('a', 'Illuminate', 't', 'Prevents accuracy drops', lower='acc'),
    _rule('a', "Mind's Eye", 't', 'Prevents accuracy drops', lower='acc'),
    _rule('a', 'Flower Veil', 't', 'Prevents stat drops on Grass allies', lower='*'),
    _rule('i', 'Clear Amulet', 't', 'Prevents stat drops', lower='*'),
    _rule('a', 'Defiant', 't', 'Atk +2 after an opposing stat drop', lower='*'),
    _rule('a', 'Competitive', 't', 'SpA +2 after an opposing stat drop', lower='*'),
    _rule('i', 'White Herb', 't', 'Restores lowered stats; consumed', lower='*'),
    _rule('i', 'Eject Pack', 't', 'Switches out after a stat drop; consumed', lower='*'),
    _rule('i', 'White Herb', 'u', 'Restores lowered stats; consumed', effect='user-lower'),
    _rule('i', 'Eject Pack', 'u', 'Switches out after a stat drop; consumed', effect='user-lower'),
    _rule('a', 'Contrary', 'u', 'Reverses stat-stage changes', effect='user-stage'),
    _rule('a', 'Contrary', 't', 'Reverses stat-stage changes', effect='target-stage'),
    _rule('a', 'Simple', 'u', 'Stat-stage changes ×2', effect='user-stage'),
    _rule('a', 'Simple', 't', 'Stat-stage changes ×2', effect='target-stage'),
    _rule('a', 'Opportunist', 't', "Copies the opponent's stat boosts", effect='user-raise'),
    _rule('i', 'Mirror Herb', 't', "Copies the opponent's stat boosts; consumed", effect='user-raise'),
    _rule('a', 'Synchronize', 't', 'Passes burn, paralysis or poison back to the attacker', effect='synchronize'),
    _rule('a', 'Poison Puppeteer', 'u', 'Pecharunt also confuses targets it poisons', effect='poison'),
])

for item, terrain, maximum, stat in (
    ('Electric Seed', 'Electric Terrain', 'Max Lightning', 'Def'),
    ('Grassy Seed', 'Grassy Terrain', 'Max Overgrowth', 'Def'),
    ('Misty Seed', 'Misty Terrain', 'Max Starfall', 'SpD'),
    ('Psychic Seed', 'Psychic Terrain', 'Max Mindstorm', 'SpD'),
):
    for side in ('u', 't'):
        RULES.append(_rule('i', item, side, f'{stat} +1 when terrain begins; consumed', names=[terrain, maximum]))

RAISING_USER = {
    'Acid Armor', 'Agility', 'Amnesia', 'Autotomize', 'Barrier', 'Bulk Up',
    'Calm Mind', 'Charge', 'Clangorous Soul', 'Coil', 'Cosmic Power', 'Cotton Guard',
    'Defend Order', 'Defense Curl', 'Double Team', 'Dragon Dance', 'Extreme Evoboost',
    'Fillet Away', 'Geomancy', 'Growth', 'Harden', 'Hone Claws', 'Howl', 'Iron Defense',
    'Meditate', 'Minimize', 'Nasty Plot', 'No Retreat', 'Quiver Dance', 'Rock Polish',
    'Sharpen', 'Shell Smash', 'Shelter', 'Shift Gear', 'Swords Dance', 'Tail Glow',
    'Victory Dance', 'Withdraw', 'Work Up', 'Acupressure', 'Belly Drum', 'Curse',
    'Magnetic Flux', 'Gear Up', 'Rototiller', 'Flower Shield', 'Stuff Cheeks', 'Stockpile',
    'Take Heart', 'Tidy Up',
}
RAISING_TARGET = {
    'Aromatic Mist', 'Coaching', 'Decorate', 'Flatter', 'Spicy Extract', 'Swagger',
    'Acupressure', 'Magnetic Flux', 'Gear Up', 'Rototiller', 'Flower Shield', 'Howl',
}
STATUS_MOVES = {
    'burn': {'Will-O-Wisp'},
    'paralysis': {'Thunder Wave', 'Stun Spore', 'Glare'},
    'poison': {'Poison Powder', 'Poison Gas', 'Toxic', 'Toxic Thread'},
}

FIXED_MULTIHIT = {
    'doublekick', 'bonemerang', 'doublehit', 'dualchop', 'dualwingbeat',
    'geargrind', 'dragondarts', 'doubleironbash', 'surgingstrikes',
    'tripledive', 'twinbeam', 'tachyoncutter', 'beatup',
}


def _key(name):
    return re.sub(r'[^a-z0-9]', '', name.casefold())


def _number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _effects(move):
    return [(chance, text) for chance, text in move.get('se', []) if chance > 0]


def _matches(test, name, move):
    flags = move.get('f', [])
    move_key = _key(name)
    category = str(move.get('c', '')).casefold()
    damaging = category in ('physical', 'special', 'phys', 'spec', 'p', 's')
    status = category == 'status'
    for kind, value in test.items():
        if kind == 'any' and not any(_matches(part, name, move) for part in value):
            return False
        if kind == 'flag' and value not in flags:
            return False
        if kind == 'not_flag' and value in flags:
            return False
        if kind == 'flags_any' and not set(value).intersection(flags):
            return False
        if kind == 'names' and move_key not in {_key(part) for part in value}:
            return False
        if kind == 'not_names' and move_key in {_key(part) for part in value}:
            return False
        if kind == 'damaging' and damaging != value:
            return False
        if kind == 'status' and status != value:
            return False
        if kind == 'targets_other' and move.get('tg') not in {
            'normal', 'any', 'adjacentFoe', 'adjacentAlly', 'adjacentAllyOrSelf',
            'allAdjacentFoes', 'allAdjacent', 'randomNormal', 'scripted', 'all',
        }:
            return False
        if kind == 'bp_max' and not (_number(move.get('bp')) and 0 < move['bp'] <= value):
            return False
        if kind == 'priority_min' and not (_number(move.get('pr')) and move['pr'] > value):
            return False
        if kind == 'accuracy_min' and not (_number(move.get('ac')) and move['ac'] >= value):
            return False
        if kind == 'multihit' and not ('multihit' in flags and move_key not in FIXED_MULTIHIT):
            return False
        if kind == 'multihit' and value == 'variable' and move_key in {'triplekick', 'tripleaxel', 'populationbomb'}:
            return False
        if kind == 'effect':
            effects = _effects(move)
            if value == 'flinch' and not any(text == 'flinch' for _, text in effects):
                return False
            if value == 'no-flinch' and any(text == 'flinch' for _, text in effects):
                return False
            if value == 'chance' and not ('secondary' in flags and (not move.get('se') or any(chance < 100 for chance, _ in effects))):
                return False
            if value == 'secondary-target' and not ('secondary' in flags and (not move.get('se') or any(
                not text.startswith(('user ', 'Recoil:', 'Drains ', 'Heals ')) for _, text in effects
            ))):
                return False
            if value in ('user-stage', 'target-stage', 'user-raise', 'user-lower'):
                who, action = value.split('-')
                positive = action in ('stage', 'raise')
                negative = action in ('stage', 'lower')
                raising = RAISING_USER if who == 'user' else RAISING_TARGET
                lowering = {'Shell Smash', 'Curse'} if who == 'user' else {
                    part for names in LOWERING_MOVES.values() for part in names
                }
                explicit = (raising if positive else set()) | (lowering if negative else set())
                stages = any(text.startswith(who + ' ') and (
                    positive and ' +' in text or negative and ' −' in text
                ) for _, text in effects)
                if move_key not in {_key(part) for part in explicit} and not stages:
                    return False
            if value in ('synchronize', 'poison'):
                statuses = set(STATUS_MOVES) if value == 'synchronize' else {'poison'}
                names = {_key(part) for status in statuses for part in STATUS_MOVES[status]}
                status_text = statuses | ({'bad poison'} if 'poison' in statuses else set())
                if move_key not in names and not any(text in status_text for _, text in effects):
                    return False
        if kind == 'lower':
            stats = list(LOWERING_MOVES) if value == '*' else [value]
            explicit = {_key(part) for stat in stats for part in LOWERING_MOVES[stat]}
            lowered = any(text.startswith('target ') and any(
                f'{STAT_NAMES[stat]} −' in text for stat in stats
            ) for _, text in _effects(move))
            if move_key not in explicit and not lowered:
                return False
    return True


def _items(data):
    items = {}
    for section in data.get('IT', []):
        for row in section.get('r', []):
            if isinstance(row, list) and row and isinstance(row[0], str):
                items.setdefault(_key(row[0]), row[0])

    def held(node):
        if isinstance(node, dict):
            if 'id' in node and isinstance(node.get('i'), str) and node['i']:
                items.setdefault(_key(node['i']), node['i'])
            for child in node.values():
                held(child)
        elif isinstance(node, list):
            for child in node:
                held(child)

    held(data.get('TR', {}))
    return items


def _validate(data, report):
    for index, move in enumerate(data.get('MV', [])):
        name = data['M'][index] if index < len(data.get('M', [])) else f'MV[{index}]'
        prefix = f'moveprops: {name}:'
        if 'tg' in move and (not isinstance(move['tg'], str) or move['tg'] not in TARGETS):
            report(prefix, f"unknown target {move['tg']!r}")
            move.pop('tg')
        flags = move.get('f', [])
        if not isinstance(flags, list):
            report(prefix, f'invalid properties {flags!r}; expected a list')
            flags = []
        normalised = []
        for flag in flags:
            if not isinstance(flag, str) or flag not in ALIASES:
                report(prefix, f'unknown property {flag!r}')
            elif ALIASES[flag] and ALIASES[flag] not in normalised:
                normalised.append(ALIASES[flag])
        if 'f' in move:
            move['f'] = normalised
        effects = move.get('se', [])
        if not isinstance(effects, list):
            report(prefix, f'invalid added effects {effects!r}; expected a list')
            effects = []
        valid = []
        for effect in effects:
            if not isinstance(effect, (list, tuple)) or len(effect) != 2 or not (
                _number(effect[0]) and 0 <= effect[0] <= 100
                and isinstance(effect[1], str) and effect[1].strip()
            ):
                report(prefix, f'invalid added effect {effect!r}')
            else:
                valid.append(list(effect))
        if 'se' in move:
            move['se'] = valid
    if len(data.get('M', [])) != len(data.get('MV', [])):
        report('moveprops:', 'M/MV length mismatch')


def _overrides(rows, path, abilities, items, moves, report):
    if not path.is_file():
        return
    try:
        changes = json.loads(path.read_text(encoding='utf-8'))
    except (ValueError, OSError) as error:
        report('moveprops:', f'{path}: {error}')
        return
    if not isinstance(changes, list):
        report('moveprops:', f'{path}: expected a list of rules')
        return
    for index, change in enumerate(changes):
        prefix = f'moveprops: {path.name}[{index}]:'
        if not isinstance(change, dict) or set(change) - {'a', 'i', 'w', 'e', 'match', 'src', 'add', 'remove'}:
            report(prefix, 'invalid rule fields')
            continue
        kind = 'a' if 'a' in change else 'i'
        if ('a' in change) == ('i' in change) or not isinstance(change.get(kind), str) or change.get('w') not in ('u', 't'):
            report(prefix, 'requires exactly one a/i name and w=u/t')
            continue
        if not isinstance(change.get('src'), str) or not change['src'].strip():
            report(prefix, 'requires a source line')
            continue
        if 'e' in change and (not isinstance(change['e'], str) or not change['e'].strip()):
            report(prefix, 'e must be a nonempty phrase')
            continue
        if any(not isinstance(change.get(key, []), list) or any(not isinstance(name, str) for name in change.get(key, [])) for key in ('add', 'remove')):
            report(prefix, 'add/remove must be lists of move names')
            continue
        owners = abilities if kind == 'a' else items
        owner_key = _key(change[kind])
        if owner_key not in owners:
            report(prefix, f'owner is absent from guide: {change[kind]}')
            continue
        owner = owners[owner_key]
        candidates = [row for row in rows if row.get(kind) == owner and row['w'] == change['w']]
        if 'match' in change:
            if change['match'] is None:
                candidates = []
            else:
                candidates = [row for row in candidates if row['_phrase'] == change['match']]
                if not candidates:
                    report(prefix, f"unknown rule phrase {change['match']!r}")
                    continue
        if len(candidates) > 1:
            report(prefix, 'ambiguous rule; supply match with its original phrase')
            continue
        if not candidates:
            if 'e' not in change:
                report(prefix, 'a new rule requires e')
                continue
            row = {kind: owner, 'w': change['w'], 'e': change['e'], 'm': [], '_phrase': change['e']}
            rows.append(row)
        else:
            row = candidates[0]
        selected = set(row['m'])
        for operation in ('add', 'remove'):
            for name in change.get(operation, []):
                move_key = _key(name)
                if move_key not in moves:
                    report(prefix, f'unknown move {name!r}')
                elif operation == 'add':
                    selected.add(moves[move_key])
                else:
                    selected.discard(moves[move_key])
        row.update(e=change.get('e', row['e']), m=sorted(selected), h=1, s=change['src'])


def apply(data, hack, report=print, *, rules_path=None):
    """Normalise metadata, report problems and rebuild MI; idempotent, in place."""
    _validate(data, report)
    abilities = {_key(ability[0]): index for index, ability in enumerate(data.get('AB', []))}
    items = _items(data)
    moves = {_key(name): index for index, name in enumerate(data.get('M', []))}
    rows = []
    for rule in RULES:
        kind = 'a' if 'a' in rule else 'i'
        owners = abilities if kind == 'a' else items
        if _key(rule[kind]) not in owners:
            continue
        selected = [index for index, (name, move) in enumerate(zip(data.get('M', []), data.get('MV', [])))
                    if _matches(rule['test'], name, move)]
        rows.append({kind: owners[_key(rule[kind])], 'w': rule['w'], 'e': rule['e'],
                     'm': selected, '_phrase': rule['e']})
    path = Path(rules_path) if rules_path is not None else ROOT / 'hacks' / hack / 'extract' / 'move_rules.json'
    _overrides(rows, path, abilities, items, moves, report)
    merged = {}
    for row in rows:
        if not row['m']:
            continue
        row.pop('_phrase')
        signature = tuple((key, value) for key, value in row.items() if key != 'm')
        if signature in merged:
            merged[signature]['m'] = sorted(set(merged[signature]['m']) | set(row['m']))
        else:
            merged[signature] = row
    data['MI'] = list(merged.values())

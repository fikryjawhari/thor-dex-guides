"""Compare status Z metadata with USUM move bytes and a pinned CFRU battle_moves.c.

uv run python -I tools/calc/z_effects_check.py --cfru .tmp/z/cfru-battle_moves.c
Prints per hack the status moves whose Z effect differs from the shared Showdown table (`differences`) and fails
when the engine's record after the hack's calc_effects.json override still differs (`unresolved`).
The CFRU input is b637a27898b14e25dd24d0f69a3e302f0069deb8/src/Tables/battle_moves.c.
USUM offsets and effect indices follow pk3DS Move7 / MoveEditor7. Sources are read only.
"""
import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from ctrguide import read_move_records


def boost(stat, amount):
    return {'b': {stat: amount}}


def all_stats(amount):
    return {'b': dict.fromkeys(['atk', 'def', 'spa', 'spd', 'spe'], amount)}


EFFECTS = ['crit2', 'clearnegativeboost', 'heal', 'healreplacement', 'redirect', 'curse']
USUM = {0: None, **{index + 1: boost(stat, amount)
        for index, (stat, amount) in enumerate((stat, amount) for stat in
        ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'] for amount in [1, 2, 3])},
        **{21 + amount: all_stats(amount) for amount in [1, 2, 3]},
        **{25 + index: {'effect': effect} for index, effect in enumerate(EFFECTS)}}
CFRU = {'NONE': None, 'RESET_STATS': {'effect': 'clearnegativeboost'},
        'ALL_STATS_UP_1': all_stats(1), 'BOOST_CRITS': {'effect': 'crit2'},
        'FOLLOW_ME': {'effect': 'redirect'}, 'CURSE': {'effect': 'curse'},
        'RECOVER_HP': {'effect': 'heal'}, 'RESTORE_REPLACEMENT_HP': {'effect': 'healreplacement'},
        **{f'{label}_UP_{amount}': boost(stat, amount) for label, stat in
           [('ATK', 'atk'), ('DEF', 'def'), ('SPD', 'spe'), ('SPATK', 'spa'),
            ('SPDEF', 'spd'), ('ACC', 'acc'), ('EVSN', 'eva')] for amount in [1, 2, 3]}}


def key(name):
    return re.sub('[^a-z0-9]', '', name.lower())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cfru', type=Path, required=True)
    args = parser.parse_args()
    table = json.loads((ROOT / 'tools/calc/move-effects.json').read_text(encoding='utf-8'))['moves']
    cache = json.loads((ROOT / 'hacks/photonic-sun/.src/dex-rebalanced.json').read_text(encoding='utf-8'))
    archive = ROOT / 'hacks/photonic-sun/.src/romfs-dl/x/Rebalanced/luma/titles/00040000001B5000/romfs/a/0/1/1'
    records = read_move_records(archive)
    photonic = {move['name']: (USUM[records[move['id']][0x21]],
                f'a/0/1/1 record {move["id"]}, ZEffect byte 0x21={records[move["id"]][0x21]}')
                for move in cache['moves'] if move['cat'] == 'Status'}
    source = args.cfru.read_text(encoding='utf-8')
    cfru = {}
    for match in re.finditer(r'\[MOVE_(\w+)\]\s*=\s*\{([^}]+)\}', source):
        effect = re.search(r'\.z_move_effect\s*=\s*(Z_EFFECT_\w+|0)', match[2])
        if effect:
            value = None if effect[1] == '0' else CFRU[effect[1][9:]]
            cfru[key(match[1])] = (value, f'battle_moves.c:{source.count(chr(10), 0, match.start()) + 1} {effect[1]}')
    failed = False
    for hack, game in [('photonic-sun', photonic), ('unbound', cfru)]:
        data = json.loads((ROOT / f'hacks/{hack}/data.json').read_text(encoding='utf-8'))
        base = json.loads((ROOT / f'hacks/{hack}/hack.json').read_text(encoding='utf-8'))['cfg']['calc']['base']
        gen = json.loads((ROOT / f'template/calc/profiles/{base}.json').read_text(encoding='utf-8'))['gen']
        own_fx = json.loads((ROOT / f'hacks/{hack}/calc_effects.json').read_text(encoding='utf-8'))
        own, own_z = own_fx.get('moves', {}), own_fx.get('zmoves', {})
        differences, missing, unresolved = [], [], []
        count = 0
        for name, meta in zip(data['M'], data['MV']):
            if meta['c'] != 'Status':
                continue
            found = game.get(name if hack == 'photonic-sun' else key(name))
            if not found:
                missing.append(name)
                continue
            count += 1
            actual, cite = found
            # The engine's record: the shared table's entry for the profile's generation, then the hack's override
            # (a record replaces, null removes).
            shared = next((record for start, record in reversed(table.get(name, [])) if start <= gen), {})
            if shared.get('z') != actual:
                differences.append({'move': name, 'showdown': shared.get('z'), 'game': actual, 'source': cite,
                                    'override': name in own or name in own_z})
            effective = (own[name] or {}) if name in own else shared
            engine_z = own_z[name]['z'] if name in own_z else effective.get('z')
            if engine_z != actual:
                unresolved.append({'move': name, 'engine': engine_z, 'game': actual, 'source': cite})
        failed |= bool(unresolved)
        print(json.dumps({'hack': hack, 'gen': gen, 'checked': count, 'missing': missing,
                          'differences': differences, 'unresolved': unresolved}, indent=2))
    if failed:
        sys.exit('z_effects_check: the engine and the game data disagree (unresolved); add the game value to '
                 'calc_effects.json zmoves')

if __name__ == '__main__':
    main()

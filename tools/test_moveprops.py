"""Plain-assert regression checks: uv run python -I tools/test_moveprops.py."""
import sys
import copy
import json
import tempfile
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import moveprops
import schema
import extractlib


def test_vocabulary():
    assert len(moveprops.TARGETS) == 15
    for target in moveprops.TARGETS.values():
        assert len(target['grid']) == 2
        assert all(len(row) == 3 for row in target['grid'])
        assert set(sum(target['grid'], [])) <= {'off', 'one-of', 'all'}
    assert moveprops.TARGETS['normal']['grid'][0][2] == 'off'
    assert moveprops.TARGETS['any']['grid'][0][2] == 'one-of'
    for old, new in [('punching', 'punch'), ('biting', 'bite'), ('ballistic', 'bullet'),
                     ('healing', 'heal'), ('kicking', 'kick'), ('bypass-sub', 'bypasssub')]:
        assert moveprops.ALIASES[old] == new
    assert moveprops.protect_flags(['contact', 'protect'], 'normal') == ['contact']
    assert moveprops.protect_flags(['contact'], 'normal') == ['contact', 'noprotect']
    assert moveprops.protect_flags([], 'self') == []
    assert moveprops.protect_flags([], 'foeSide') == []


def test_effects():
    assert moveprops.effect_text({'kind': 'flinch', 'chance': 30}) == [30, 'flinch']
    assert moveprops.effect_text({'kind': 'status', 'status': 'brn', 'chance': 10}) == [10, 'burn']
    assert moveprops.effect_text({'kind': 'confusion', 'chance': 20}) == [20, 'confusion']
    assert moveprops.effect_text({'kind': 'stages', 'who': 'user', 'stages': {'def': -1, 'spd': -1}}) == [100, 'user Def −1, SpD −1']
    assert moveprops.effect_text({'kind': 'drain', 'fraction': [1, 2]}) == [100, 'Drains 50% of damage']
    assert moveprops.effect_text({'kind': 'heal', 'fraction': [1, 4]}) == [100, 'Heals 25% of maximum HP']
    assert moveprops.effect_text({'kind': 'recoil', 'fraction': [1, 3]}) == [100, 'Recoil: 33.33% of damage']
    assert moveprops.effect_text({'kind': 'recoil', 'fraction': [1, 2], 'basis': 'maxhp'}) == [100, 'Recoil: 50% of maximum HP']
    for effect in [{'kind': 'bad'}, {'kind': 'status', 'status': 'bad'},
                   {'kind': 'flinch', 'chance': True}, {'kind': 'flinch', 'chance': 101},
                   {'kind': 'heal', 'fraction': [1, 0]}, {'kind': 'heal', 'fraction': [float('inf'), float('inf')]},
                   {'kind': 'drain', 'fraction': [1, 2], 'basis': 'maxhp'},
                   {'kind': 'stages', 'stages': {'bad': 1}}]:
        try:
            moveprops.effect_text(effect)
        except ValueError:
            pass
        else:
            raise AssertionError(effect)


def fixture():
    return {
        'M': ['Mach Punch', 'Thunder Punch', 'Tackle', 'Flamethrower', 'Mystery'],
        'MV': [
            {'c': 'Physical', 'bp': 40, 'pr': 1, 'tg': 'normal', 'f': ['contact', 'punching', 'protect']},
            {'c': 'Physical', 'bp': 75, 'pr': 0, 'f': ['contact', 'punch', 'secondary'], 'se': [[10, 'paralysis']]},
            {'c': 'Physical', 'bp': 40, 'pr': 0, 'f': ['contact']},
            {'c': 'Special', 'bp': 90, 'pr': 0, 'f': ['secondary'], 'se': [[10, 'burn']]},
            {'c': 'Status', 'bp': 'Varies', 'tg': 'oops', 'f': ['oops', ['bad']], 'se': [[101, 'burn'], [30, 'flinch'], 'oops']},
        ],
        'AB': [[name, ''] for name in ['Iron Fist', 'Rough Skin', 'Technician', 'Custom Fist',
                                     'Serene Grace', 'Shield Dust', 'Inner Focus', 'Dazzling']],
        'IT': [{'n': 'Held items', 'r': [['Punching Glove', 'Found somewhere']]}],
        'TR': {'g': [{'sec': [{'tr': [{'p': [{'id': 'pikachu', 'i': 'Rocky Helmet'}],
                                      'normal': {'p': [{'id': 'raichu', 'i': 'Covert Cloak'}]},
                                      'pt': [{'p': [{'id': 'eevee', 'i': 'Big Root'}]}]}]}]}]},
    }


def test_apply():
    data = fixture()
    messages = []
    report = lambda *parts: messages.append(' '.join(map(str, parts)))
    with tempfile.TemporaryDirectory() as directory:
        rules = Path(directory) / 'move_rules.json'
        rules.write_text(json.dumps([
            {'a': 'Iron Fist', 'w': 'u', 'e': 'Power ×1.3', 'add': ['Tackle'],
             'remove': ['Thunder Punch'], 'src': 'test source:1'},
            {'a': 'Custom Fist', 'w': 'u', 'e': 'Custom power', 'add': ['Mach Punch'], 'src': 'test source:2'},
            {'i': 'Big Root', 'w': 'u', 'add': ['Mystery'], 'src': 'test source:3'},
        ]), encoding='utf-8')
        moveprops.apply(data, 'test', report, rules_path=rules)
        ability_rows = {data['AB'][row['a']][0]: row for row in data['MI'] if 'a' in row}
        assert ability_rows['Iron Fist']['m'] == [0, 2]
        assert ability_rows['Iron Fist']['e'] == 'Power ×1.3'
        assert ability_rows['Iron Fist']['h'] == 1
        assert ability_rows['Iron Fist']['s'] == 'test source:1'
        assert ability_rows['Custom Fist']['m'] == [0]
        assert ability_rows['Rough Skin']['m'] == [0, 1, 2]
        assert ability_rows['Technician']['m'] == [0, 2]
        assert ability_rows['Dazzling']['m'] == [0]
        assert ability_rows['Inner Focus']['m'] == [4]
        item_rows = {row['i']: row for row in data['MI'] if 'i' in row}
        assert item_rows['Rocky Helmet']['m'] == [0, 1, 2]
        assert item_rows['Punching Glove']['m'] == [0, 1]
        assert item_rows['Covert Cloak']['m'] == [1, 3]
        assert item_rows['Big Root']['m'] == [4]
        assert 'protect' not in data['MV'][0]['f']
        assert all('noprotect' not in move.get('f', []) for move in data['MV'])
        assert any('unknown target' in message for message in messages)
        assert any('unknown property' in message for message in messages)
        assert any('invalid added effect' in message for message in messages)
        before = copy.deepcopy(data)
        moveprops.apply(data, 'test', report, rules_path=rules)
        assert data == before
        assert len(messages) == 5


def test_rule_edges():
    def matches(owner, name, move, phrase=None):
        return any(moveprops._matches(rule['test'], name, move) for rule in moveprops.RULES
                   if rule.get('a', rule.get('i')) == owner and (phrase is None or rule['e'] == phrase))

    assert matches('Mega Launcher', 'Heal Pulse', {'c': 'Status', 'f': ['heal', 'pulse']})
    assert not matches('Mega Launcher', 'Floral Healing', {'c': 'Status', 'f': ['heal']})
    assert not matches('Dazzling', 'Protect', {'c': 'Status', 'tg': 'self', 'pr': 4})
    assert not matches('Technician', 'Seismic Toss', {'c': 'Physical', 'bp': 'Varies'})
    assert not matches('Rock Head', 'Struggle', {'f': ['recoil']})
    assert not matches('Power Herb', 'Sky Drop', {'f': ['charge']})
    assert not matches('Skill Link', 'Double Kick', {'f': ['multihit']})
    assert matches('Loaded Dice', 'Triple Axel', {'f': ['multihit']}, 'One accuracy check')
    assert matches('Skill Link', 'Population Bomb', {'f': ['multihit']})
    assert not matches('Shield Dust', 'Flame Charge', {'f': ['secondary'], 'se': [[100, 'user Speed +1']]})
    assert not matches('Serene Grace', 'Torch Song', {'f': ['secondary'], 'se': [[100, 'user SpA +1']]})
    assert matches('Clear Body', 'Growl', {'c': 'Status'})
    assert matches('Hyper Cutter', 'Breaking Swipe', {'se': [[100, 'target Atk −1']]})
    assert not matches('Hyper Cutter', 'Close Combat', {'se': [[100, 'user Def −1, SpD −1']]})
    assert matches('Contrary', 'Close Combat', {'se': [[100, 'user Def −1, SpD −1']]})
    assert matches('Simple', 'Tidy Up', {'c': 'Status'})
    assert matches('Synchronize', 'Thunderbolt', {'se': [[10, 'paralysis']]})
    assert not matches('Synchronize', 'Ice Beam', {'se': [[10, 'freeze']]})
    assert matches('Poison Puppeteer', 'Toxic', {'c': 'Status'})
    assert matches('Technician', 'Grass Knot', {'c': 'Special', 'bp': 'Varies'})


def test_all_rules():
    known = {'any', 'flag', 'not_flag', 'flags_any', 'names', 'not_names', 'damaging',
             'status', 'targets_other', 'bp_max', 'priority_min', 'accuracy_min',
             'multihit', 'effect', 'lower'}
    effects = {
        'flinch': [[30, 'flinch']], 'no-flinch': [], 'chance': [[30, 'burn']],
        'secondary-target': [[30, 'burn']], 'user-stage': [[100, 'user Atk +1']],
        'target-stage': [[100, 'target Atk −1']], 'user-raise': [[100, 'user Atk +1']],
        'user-lower': [[100, 'user Atk −1']], 'poison': [[30, 'poison']],
        'synchronize': [[30, 'paralysis']],
    }

    def example(test):
        assert set(test) <= known
        name = 'Example'
        move = {'c': 'Physical', 'f': [], 'bp': 40, 'pr': 1, 'ac': 100, 'tg': 'normal'}
        if 'any' in test:
            name, move = example(test['any'][0])
        if 'names' in test:
            name = test['names'][0]
        if 'flag' in test:
            move['f'].append(test['flag'])
        if 'flags_any' in test:
            move['f'].append(test['flags_any'][0])
        if test.get('status'):
            move['c'] = 'Status'
        if 'multihit' in test:
            name = 'Bullet Seed'
            move['f'].append('multihit')
        if 'effect' in test:
            move['f'].append('secondary')
            move['se'] = effects[test['effect']]
        if 'lower' in test:
            stat = 'atk' if test['lower'] == '*' else test['lower']
            move['se'] = [[100, f'target {moveprops.STAT_NAMES[stat]} −1']]
        return name, move

    for rule in moveprops.RULES:
        assert ('a' in rule) != ('i' in rule)
        assert rule['w'] in ('u', 't') and rule['e']
        name, move = example(rule['test'])
        assert moveprops._matches(rule['test'], name, move), rule


def test_schema():
    data = fixture()
    moveprops.apply(data, 'test', lambda *parts: None)
    for move in data['MV']:
        schema.order(move, 'MV')
    for row in data['MI']:
        schema.order(row, 'MI')
    schema.order(data, 'top')
    assert 'tg' in schema.ORDER['MV'] and 'se' in schema.ORDER['MV']
    assert 'MI' in schema.ORDER['top']


def test_override_errors():
    messages = []
    report = lambda *parts: messages.append(' '.join(map(str, parts)))
    data = fixture()
    data['AB'].append(['Mega Launcher', ''])
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'move_rules.json'
        for content in ['{', '{}', '[0]']:
            path.write_text(content, encoding='utf-8')
            moveprops.apply(copy.deepcopy(data), 'test', report, rules_path=path)
        path.write_text(json.dumps([
            {'a': 'Mega Launcher', 'w': 'u', 'e': 'ambiguous', 'src': 'test:1'},
            {'a': 'Iron Fist', 'w': 'u', 'match': 'wrong', 'src': 'test:2'},
            {'a': 'Absent', 'w': 'u', 'e': 'absent', 'src': 'test:3'},
            {'a': 'Iron Fist', 'w': 'u', 'add': ['No Such Move'], 'src': 'test:4'},
            {'a': 'Iron Fist', 'w': 'u', 'src': ''},
            {'a': 'Iron Fist', 'w': 'u', 'match': None, 'e': 'New rule', 'add': ['Tackle'], 'src': 'test:5'},
            {'a': 'Mega Launcher', 'w': 'u', 'match': 'Power ×1.5', 'add': ['Tackle'], 'src': 'test:6'},
        ]), encoding='utf-8')
        moveprops.apply(data, 'test', report, rules_path=path)
        assert any(row['e'] == 'New rule' and row['m'] == [2] for row in data['MI'])
        assert any(row.get('a') == 8 and row['e'] == 'Power ×1.5' and row['m'] == [2] for row in data['MI'])
        for fragment in ('ambiguous rule', 'unknown rule phrase', 'owner is absent', 'unknown move', 'requires a source line'):
            assert any(fragment in message for message in messages), fragment


def test_finalise_guides():
    root = Path(__file__).resolve().parent.parent
    with tempfile.TemporaryDirectory() as directory:
        temporary = Path(directory)
        for path in sorted((root / 'hacks').glob('*/data.json')):
            data = json.loads(path.read_text(encoding='utf-8'))
            original = copy.deepcopy(data)
            messages = []
            report = lambda *parts: messages.append(' '.join(map(str, parts)))
            moveprops.apply(data, path.parent.name, report)
            assert not messages, (path.parent.name, messages)
            before = copy.deepcopy(data)
            moveprops.apply(data, path.parent.name, report)
            assert data == before, path.parent.name
            for row in data['MI']:
                assert row['m'] == sorted(set(row['m']))
                assert all(0 <= index < len(data['M']) for index in row['m'])
            for key in original:
                if key != 'MV':
                    assert data[key] == original[key], (path.parent.name, key)
            schema.standardise(data)
            location = temporary / 'hacks' / path.parent.name / 'extract'
            location.mkdir(parents=True)
            keys = path.parent / 'extract' / 'trainer_keys.json'
            if keys.is_file():
                (location / keys.name).write_bytes(keys.read_bytes())
            with patch.object(extractlib, 'ROOT', str(temporary)):
                extractlib.finalise(copy.deepcopy(original), path.parent.name)
            print(f'PASS finalise/schema in memory: {path.parent.name}; {len(data["MI"])} interactions')


if __name__ == '__main__':
    test_vocabulary()
    test_effects()
    test_apply()
    test_rule_edges()
    test_all_rules()
    test_schema()
    test_override_errors()
    test_finalise_guides()
    print(f'PASS moveprops: vocabulary, effects, apply/overrides/idempotence, {len(moveprops.RULES)} rules')

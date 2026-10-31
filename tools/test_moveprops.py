"""Plain-assert regression checks: uv run python -I tools/test_moveprops.py."""
import sys
import copy
import json
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import moveprops


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
    for effect in [{'kind': 'bad'}, {'kind': 'status', 'status': 'bad'},
                   {'kind': 'flinch', 'chance': True}, {'kind': 'flinch', 'chance': 101},
                   {'kind': 'heal', 'fraction': [1, 0]},
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


if __name__ == '__main__':
    test_vocabulary()
    test_effects()
    test_apply()
    test_rule_edges()
    print(f'PASS moveprops: vocabulary, effects, apply/overrides/idempotence, {len(moveprops.RULES)} rules')

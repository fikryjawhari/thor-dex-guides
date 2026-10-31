"""Plain-assert regression checks: uv run python -I tools/test_moveprops.py."""
import sys
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


if __name__ == '__main__':
    test_vocabulary()
    test_effects()
    print('PASS moveprops: vocabulary and effects')

"""Focused tests for the shared CFRU metadata reader and Unbound snapshot."""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools'))
import cfru
import moveprops


class MoveMetadataTests(unittest.TestCase):
    def test_added_effects(self):
        result = cfru.move_metadata({'target': 'normal', 'flags': {'contact': 1},
                                    'secondary': {'chance': 30, 'volatileStatus': 'flinch'},
                                    'self': {'boosts': {'def': -1, 'spd': -1}}, 'drain': [1, 2]})
        self.assertEqual(result['se'], [[100, 'user Def −1, SpD −1'], [30, 'flinch'],
                                        [100, 'Drains 50% of damage']])
        self.assertEqual(result['f'], ['contact', 'drain', 'secondary'])

    def test_protect_requires_reliable_flags(self):
        self.assertNotIn('noprotect', cfru.move_metadata({'target': 'normal'})['f'])
        self.assertIn('noprotect', cfru.move_metadata({'target': 'normal', 'reliableProtect': True})['f'])
        self.assertNotIn('noprotect', cfru.move_metadata({'target': 'self', 'reliableProtect': True})['f'])

    def test_snapshot_preserves_stock_damage_flags(self):
        snapshot = json.loads(Path(__file__).with_name('move_metadata.json').read_text(encoding='utf-8'))
        for name, record in snapshot['moves'].items():
            with self.subTest(move=name):
                result = cfru.move_metadata(record)
                expected = {moveprops.ALIASES.get(flag, flag) for flag in record.get('calcFlags', [])}
                expected.discard(None)
                self.assertTrue(expected.issubset(result['f']), expected - set(result['f']))
                self.assertTrue(set(result['f']).issubset(moveprops.PROPS))
                self.assertIn(result['tg'], moveprops.TARGETS)


if __name__ == '__main__':
    unittest.main()

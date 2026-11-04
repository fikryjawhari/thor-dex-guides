"""Unbound encounter classifications and source reward tiers."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import WIKI
from encounters import method_info, raid_tables


class EncounterTests(unittest.TestCase):
    def test_floors_and_map_types(self):
        cases = [
            ('Icicle Cave', '4F Outside Area', 'Long Grass', ('grass', '', '', '4F Outside Area')),
            ('Crystal Peak', 'Exterior', 'Crystal Cliff', ('grass', '', '', 'Exterior')),
            ('Crystal Peak', '1F Main Chamber', 'Cave', ('cave', '', '', '1F Main Chamber')),
            ('Dehara City', 'Rift Cave · B1F', 'Grass/cave', ('cave', '', '', 'Rift Cave · B1F')),
            ('Great Desert', 'Tomb of Borrius · B2F', 'Grass/cave', ('cave', '', '', 'Tomb of Borrius · B2F')),
            ('Flower Paradise', '', 'Yellow Flowers', ('grass', 'Yellow Flowers', '', '')),
        ]
        for area, floor, method, expected in cases:
            with self.subTest(area=area, floor=floor, method=method):
                self.assertEqual(method_info(area, floor, method), expected)

    def test_water_and_patches(self):
        self.assertEqual(method_info('Cinder Volcano', '', 'Lava Surf'), ('water', 'Lava', 'Su', ''))
        self.assertEqual(method_info('Ruins of Void', 'B4F', 'Underwater'), ('water', 'Underwater', 'Su', 'B4F'))
        for rod, chip in [('Old Rod', 'O'), ('Good Rod', 'G'), ('Super Rod', 'S')]:
            with self.subTest(rod=rod):
                self.assertEqual(method_info('Crystal Peak', '1F Main Chamber', rod),
                                 ('water', '', chip, '1F Main Chamber'))
                self.assertEqual(method_info('Route 18', '', 'Central Two Islands ' + rod),
                                 ('water', '', chip, 'Central Two Islands'))

    def test_special_and_gift_kinds(self):
        for method in ('DexNav', 'DexNav (Surf)', 'DexNav (Underwater)'):
            with self.subTest(method=method):
                kind, variant, chip, floor = method_info('Route 16', '', method)
                self.assertEqual((kind, variant), ('special', 'DexNav'))
                self.assertEqual(chip, 'Su' if '(' in method else '')
        for method, expected in [('Swarm', ('special', 'Swarm')), ('Headbutt', ('special', 'Headbutt')),
                                 ('Rock Smash', ('special', 'Rock Smash')), ('Trade', ('trade', '')),
                                 ('Gift Pokemon (as Egg)', ('gift', 'Egg')), ('Revived Fossil', ('gift', 'Gift (fossil)')),
                                 ('Static Legendary Encounter', ('gift', 'Static')), ('Roaming', ('gift', 'Roaming')),
                                 ('Starter choice', ('gift', 'Starter choice'))]:
            with self.subTest(method=method):
                self.assertEqual(method_info('Frozen Heights', '', method)[:2], expected)

    def test_raid_rewards_have_one_list_per_tier(self):
        dens = WIKI.raid_dens()
        self.assertEqual(len(dens), 32)
        count = 0
        for den in dens:
            tiers = list(raid_tables(den))
            with self.subTest(den=den.title):
                self.assertTrue(tiers)
                self.assertEqual(len({tier for tier, level, drops in tiers}), len(tiers))
                for tier, level, drops in tiers:
                    self.assertRegex(tier, r'^[1-6](?:/[1-6])?$')
                    self.assertRegex(level, r'^\d+-\d+$')
                    self.assertIn('%', drops)
            count += len(tiers)
        self.assertEqual(count, 104)


if __name__ == '__main__':
    unittest.main()

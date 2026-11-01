"""Items standard regression cases. Run with uv run python -I tools/itemstd_test.py."""
import copy
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import itemstd


def data(boxes, rows=()):
    return {'IT': [{'n': name, 'r': items} for name, items in boxes],
            'WK': {'splits': [{'st': [{'n': 'Town', 'it': list(rows)}]}], 'np': []}}


class ItemsTest(unittest.TestCase):
    def test_shops_and_repeats(self):
        value = data([('Held Items', [['Leftovers', 'Found: Town · corner', None, 0, 'Battle gear'],
                                     ['Leftovers', 'Found: Town · corner', None, 0, 'Other held items']]),
                      ('Shops', [['Leftovers', 'City · 10 BP · Leftovers', None, 0, 'Held items'],
                                 ['Potion', 'City; $300', None, 0, 'Healing and repels']])])
        itemstd.standardise(value)
        self.assertEqual([box['n'] for box in value['IT']], ['Medicine', 'Held Items'])
        self.assertEqual(len(value['IT'][1]['r']), 1)
        self.assertEqual(value['IT'][1]['r'][0][1], 'Found: Town · corner\nShop: City · 10 BP')
        self.assertEqual(value['IT'][0]['r'][0][1], 'Shop: City; $300')
        before = copy.deepcopy(value)
        itemstd.standardise(value)
        self.assertEqual(value, before)

    def test_walk_additions(self):
        value = data([('Valuables', [['Nugget', 'Found: Town · tree', None, 0, 'Nugget']])],
                     [['Valuables', 'Nugget', 'Found: Town · rock', None],
                      ['Key Items', 'Costume Box', 'Also: Town · mother', None]])
        itemstd.standardise(value)
        self.assertEqual(value['IT'][1]['r'][0][1], 'Found: Town · tree\nFound: Town · rock')
        self.assertEqual(value['IT'][1]['r'][0][4], '')
        before = copy.deepcopy(value)
        itemstd.standardise(value)
        self.assertEqual(value, before)

    def test_cells_and_tutors(self):
        value = data([('Key Items', [['Zygarde Cell', 'Found: Town · tree', None, 0, 'Zygarde Cells'],
                                    ['Zygarde Cell', 'Found: Town · rock', None, 0, 'Zygarde Cells']]),
                      ('Move Tutors', [['Ice Punch', 'Town · 2 Shards', 1, 0, 'Blue Shard Tutor'],
                                       ['Ice Punch', 'Town · 2 Gems', 1, 0, 'Gem Family Brother (Ice)']])])
        itemstd.standardise(value, itemstd.RULES['unbound'])
        self.assertEqual(len(value['IT'][0]['r']), 2)
        self.assertEqual([row[4] for row in value['IT'][1]['r']], ['Shard tutors', 'Gem Family'])
        before = copy.deepcopy(value)
        itemstd.standardise(value, itemstd.RULES['unbound'])
        self.assertEqual(value, before)

    def test_machine_shop_place(self):
        value = data([('TMs', [['TM04 Calm Mind', 'Town', 1]]),
                      ('Shops', [['TM04 Calm Mind', 'Town · 10 BP · Calm Mind', None, 0, 'TMs']])])
        itemstd.standardise(value)
        self.assertEqual(value['IT'][0]['r'][0][1], 'Shop: Town · 10 BP')
        value = data([('TMs', [['TM04 Calm Mind', 'Found: Town · hidden in a rock', 1]]),
                      ('Shops', [['TM04 Calm Mind', 'Town · 10 BP', None, 0, 'TMs']])])
        itemstd.standardise(value)
        self.assertIn('Found: Town · hidden in a rock', value['IT'][0]['r'][0][1])

    def test_basculin(self):
        value = data([('Evolution Items', [['Blue-Striped Basculin: Deep Sea Scale (5% chance) Red-Striped Basculin: Deep Sea Tooth', '', None]])])
        itemstd.standardise(value)
        self.assertEqual([row[0] for row in value['IT'][0]['r']], ['Deep Sea Scale', 'Deep Sea Tooth'])


if __name__ == '__main__':
    unittest.main()

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

    def test_one_pickup_two_wordings(self):
        walk_line = 'Found: Bellin Town · requires Rock Climb · Near the northeast house, up a climbable wall'
        value = data([('TMs', [['TM097 Frost Breath', 'Next to a house in the North-East corner of Bellin Town; '
                                'Requires Rock Climb · needs Rock Climb', 1]])],
                     [['TMs and HMs', 'TM097 Frost Breath', walk_line, 1]])
        itemstd.standardise(value)
        self.assertEqual(value['IT'][0]['r'][0][1], walk_line)
        self.assertEqual(value['WK']['splits'][0]['st'][0]['it'][0][2], walk_line)
        before = copy.deepcopy(value)
        itemstd.standardise(value)
        self.assertEqual(value, before)

    def test_one_to_one(self):
        # two rows at the place of one line: which one it is can't be told, so both stay
        value = data([('Valuables', [['Nugget', 'Found: On the ground in Town', None, 0, 'Nugget']])],
                     [['Valuables', 'Nugget', 'Found: Town · rock', None], ['Valuables', 'Nugget', 'Found: Town · tree', None]])
        itemstd.standardise(value)
        self.assertEqual(len(value['IT'][0]['r'][0][1].splitlines()), 3)

    def test_lines(self):
        self.assertEqual(itemstd.pickup_lines(['Found: Nimbasa City — ×12; Challenge only']),
                         'Found: Nimbasa City — ×12; Challenge only')
        self.assertEqual(itemstd.pickup_lines(['Found: Iki Town; Malie Garden']), 'Found: Iki Town\nFound: Malie Garden')
        self.assertEqual(itemstd.pickup_lines(['Found: Whirl Islands 1F; at the rock (hidden)']),
                         'Found: Whirl Islands 1F; at the rock (hidden)')
        self.assertEqual(itemstd.pickup_lines(['Found: Nimbasa City — Held by traded Meowth; Held by traded Mankey']),
                         'Found: Nimbasa City — Held by traded Meowth\nFound: Nimbasa City — Held by traded Mankey')
        self.assertEqual(itemstd.pickup_lines(['Vermillion City, Fan Club. A gift from Teacher Colette.']),
                         'Also: Vermillion City, Fan Club. A gift from Teacher Colette')
        self.assertEqual(itemstd.pickup_lines(['Shop: A · Mart\nB · Mart']), 'Shop: A · Mart\nShop: B · Mart')
        self.assertEqual(itemstd.pickup_lines(['Was Round in Pokémon X. Route 1; Route 2']),
                         'Found: Route 1 · was Round in Pokémon X\nFound: Route 2')
        self.assertEqual(itemstd.pickup_lines(['Found: Dresco Town; Requires Surf · needs Surf']),
                         'Found: Dresco Town; Requires Surf')

    def test_machine_shop_wording(self):
        value = data([('TMs', [['TM015 Electroweb', "Dewford Town's outdoor Mart workers", 1]]),
                      ('Shops', [['TM015 Electroweb', "Dewford Town's Outdoor Clerks · ₽100", None, 0, 'TMs']])])
        itemstd.standardise(value)
        self.assertEqual(value['IT'][0]['r'][0][1], "Shop: Dewford Town's Outdoor Clerks · ₽100")

    def test_basculin(self):
        value = data([('Evolution Items', [['Blue-Striped Basculin: Deep Sea Scale (5% chance) Red-Striped Basculin: Deep Sea Tooth', '', None]])])
        itemstd.standardise(value)
        self.assertEqual([row[0] for row in value['IT'][0]['r']], ['Deep Sea Scale', 'Deep Sea Tooth'])


if __name__ == '__main__':
    unittest.main()

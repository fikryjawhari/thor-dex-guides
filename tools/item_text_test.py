"""Self-test for tools/item_text.py: python -I tools/item_text_test.py (unittest; no guide data needed)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import item_text  # noqa: E402


class KeyAndPick(unittest.TestCase):
    def test_spellings_share_a_key(self):
        for a, b in [("King's Rock", 'Kings Rock'), ('Never-Melt Ice', 'NeverMeltIce'), ('Up-Grade', 'Up Grade'),
                     ('Poké Ball', 'Poke Ball'), ('Silver Powder', 'SilverPowder')]:
            self.assertEqual(item_text.key(a), item_text.key(b), (a, b))

    def test_variant_pick(self):
        variants = {'gen<=5': 'old', '': 'new'}
        self.assertEqual(item_text.pick(variants, 5), 'old')
        self.assertEqual(item_text.pick(variants, 6), 'new')
        self.assertEqual(item_text.pick('plain', 9), 'plain')
        with self.assertRaises(ValueError):
            item_text.pick({'gen>=3': 'x', '': 'y'}, 4)


class Apply(unittest.TestCase):
    def data(self, it, wk=None, p=None, mi=None, ix=None):
        return {'IT': [{'n': 'Held Items', 'k': 'gen', 'r': it}], 'WK': wk or {'np': [], 'splits': []},
                'P': p or [], 'MI': mi or [], 'TR': {'g': []}, 'M': [], 'MV': [], 'IX': ix or {}}

    def test_renames_to_the_items_tab_spelling_everywhere(self):
        D = self.data([["King's Rock", 'd', None, 0, 'Held', ['p0', 0]]],
                      wk={'np': [], 'splits': [{'n': 'S', 'st': [{'k': '0.0', 'n': 'X', 'it': [
                          ['Held Items', 'Kings Rock', 'd', None, 'p0']]}]}]},
                      p=[{'id': '1', 'hi': [['Kings Rock', 5]]}], mi=[{'a': 1, 'i': 'Kings Rock'}])
        report = []
        item_text.apply(D, 'unbound', report.append)
        self.assertEqual(D['IT'][0]['r'][0][0], "King's Rock")
        self.assertEqual(D['WK']['splits'][0]['st'][0]['it'][0][1], "King's Rock")
        self.assertEqual(D['P'][0]['hi'][0][0], "King's Rock")
        self.assertEqual(D['MI'][0]['i'], "King's Rock")
        self.assertIn("item name: Kings Rock -> King's Rock (3 use(s), Items tab spelling)", report)

    def test_spelled_out_form_wins_over_the_most_used(self):
        D = self.data([], p=[{'id': '1', 'hi': [['Silver Powder', 1]]}, {'id': '2', 'hi': [['SilverPowder', 1]]},
                             {'id': '3', 'hi': [['SilverPowder', 1]]}])
        item_text.apply(D, 'hardlove-gold', lambda line: None)
        self.assertEqual({p['hi'][0][0] for p in D['P']}, {'Silver Powder'})

    def test_pool_takes_the_text_of_the_same_key_in_another_guide(self):
        D = self.data([['Lum Berry', 'd', None, 0, 'Held', ['p0', 0]]])
        item_text.apply(D, 'unbound', lambda line: None)
        self.assertEqual(D['IX']['Lum Berry'][2], 0)
        self.assertTrue(D['IX']['Lum Berry'][0])

    def test_mega_stones_get_no_battle_text(self):
        D = self.data([['Venusaurite', 'Stone', None, 0, 'Mega', ['p0', 0]]])
        D['IT'][0]['k'] = 'mega'
        item_text.apply(D, 'unbound', lambda line: None)
        self.assertFalse(D.get('IX', {}).get('Venusaurite', ['', ''])[1])

    def test_mega_stone_without_text_gets_the_standard_wording(self):
        D = self.data([['Zzzite X', 'Stone', None, 0, 'Mega', ['p0', 0]]], p=[{'id': '1', 'n': 'Mega Zzz X',
                                                                                  'stone': 'Zzzite X', 'hi': []}])
        D['IT'][0]['k'] = 'mega'
        item_text.apply(D, 'unbound', lambda line: None)
        self.assertEqual(D['IX']['Zzzite X'][0], item_text.MEGA_TEXT.format(species='Zzz'))
        self.assertEqual(D['IX']['Zzzite X'][2], 0)

    def test_mega_species_drops_the_mega_prefix_and_the_x_y_or_z(self):
        self.assertEqual(item_text.mega_species('Mega Charizard X'), 'Charizard')
        self.assertEqual(item_text.mega_species('Mega Raichu Y'), 'Raichu')
        self.assertEqual(item_text.mega_species('Mega Venusaur'), 'Venusaur')
        self.assertEqual(item_text.mega_species('Mega Absol Z'), 'Absol')

    def test_idempotent(self):
        D = self.data([["King's Rock", 'd', None, 0, 'Held', ['p0', 0]]])
        item_text.apply(D, 'unbound', lambda line: None)
        first = repr(D)
        item_text.apply(D, 'unbound', lambda line: None)
        self.assertEqual(first, repr(D))


if __name__ == '__main__':
    unittest.main()

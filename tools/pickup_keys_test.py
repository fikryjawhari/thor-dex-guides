"""Stable pickup identities across simulated updates and two builds of every guide."""
import copy
import json
import os
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pickup_keys

ROOT = pathlib.Path(__file__).resolve().parents[1]


def sample():
    return {'IT': [{'n': 'Held Items', 'r': [['Leftovers', 'Found: Town · tree\nFound: Town · rock\nShop: City', None, 0, 'Battle gear']]}],
            'WK': {'splits': [{'st': [{'n': 'Town', 'it': [['Held Items', 'Leftovers', 'Found: Town · rock', None]]}]}], 'np': []}}


class PickupKeysTest(unittest.TestCase):
    def test_updates(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, 'pickup_keys.json')
            value = sample()
            pickup_keys.stabilise(value, path, lambda line: None)
            self.assertEqual(value['IT'][0]['r'][0][5], ['p0', 'p1', 0])
            self.assertEqual(value['WK']['splits'][0]['st'][0]['it'][0][4], 'p1')
            original = pathlib.Path(path).read_bytes()
            pickup_keys.stabilise(value, path, lambda line: None)
            self.assertEqual(original, pathlib.Path(path).read_bytes())
            value['IT'][0]['r'][0][1] = 'Found: Town · rock\nFound: City · tree'
            pickup_keys.stabilise(value, path, lambda line: None)
            self.assertEqual(value['IT'][0]['r'][0][5][0], 'p1')
            self.assertEqual(len(pickup_keys.read(path)), 3)
            value = sample()
            pickup_keys.stabilise(value, path, lambda line: None)
            self.assertEqual(value['IT'][0]['r'][0][5], ['p0', 'p1', 0])

    def test_unique_loose_match(self):
        old = [{'k': 'p0', 'i': 'Potion', 'loc': 'Town', 't': 'old'}]
        entries = [{'i': 'Potion', 'loc': 'Town', 't': 'new'}]
        self.assertEqual(pickup_keys.match(old, entries), {0: (0, 2)})
        entries.append({'i': 'Potion', 'loc': 'Town', 't': 'different'})
        self.assertEqual(pickup_keys.match(old, entries), {})
        strict = [{'i': 'Potion', 'loc': 'Town', 't': 'old'}, entries[0]]
        self.assertEqual(pickup_keys.match(old, strict), {0: (0, 0)})

    def test_repeatable(self):
        for text in ('Shop: City', 'Wild: Chansey', 'Found: Town · daily', 'Also: Town · every day',
                     'Found: Town · Mondays', 'Also: City · repeatable reward'):
            self.assertFalse(pickup_keys.eligible(text, 'Medicine'), text)
        self.assertTrue(pickup_keys.eligible('Also: City · buy once for $500', 'Medicine'))
        self.assertFalse(pickup_keys.eligible('Found: City', 'Move Tutors'))
        self.assertTrue(pickup_keys.eligible('Shop: City · ₽10,000', 'TMs and HMs'))
        self.assertTrue(pickup_keys.eligible('Shop: City · 250,000', 'Key Items'))
        self.assertFalse(pickup_keys.eligible('Shop: City · ₽300', 'Medicine'))
        self.assertFalse(pickup_keys.eligible('Shop: City · ₽3,000', 'TMs and HMs', {'Key Items'}))

    def test_guides_twice(self):
        for source in (ROOT / 'hacks').glob('*/data.json'):
            with self.subTest(hack=source.parent.name), tempfile.TemporaryDirectory() as directory:
                value = json.loads(source.read_text(encoding='utf-8'))
                path = os.path.join(directory, 'pickup_keys.json')
                pickup_keys.stabilise(value, path, lambda line: None)
                first = copy.deepcopy(value)
                original = pathlib.Path(path).read_bytes()
                reports = []
                pickup_keys.stabilise(value, path, reports.append)
                self.assertEqual(value, first)
                self.assertEqual(pathlib.Path(path).read_bytes(), original)
                self.assertFalse(any('new keys' in line or 'matched loosely' in line for line in reports))
                self.assertEqual(pickup_keys.check(value, path), [])


if __name__ == '__main__':
    unittest.main()

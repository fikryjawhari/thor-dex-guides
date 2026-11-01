"""Item-page schema and legacy held-item compatibility regression checks."""
import copy
import json
import os
import pathlib
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema

ROOT = pathlib.Path(__file__).resolve().parents[1]


class SchemaTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'hacks/blaze-black-2-redux/data.json').read_text(encoding='utf-8'))

    def test_item_text_and_held_items(self):
        self.data['IX'] = {'Leftovers': ['Bag text', 'Restores 1/16 max HP each turn.', 1]}
        self.data['MV'][0]['b'] = 'In-battle move text'
        self.data['P'][0]['hi'] = ['Leftovers', 'Leftovers', ['Oran Berry', 5], ['Mystery Berry']]
        schema.standardise(self.data)
        self.assertEqual(self.data['P'][0]['hi'], [['Leftovers', None], ['Oran Berry', 5], ['Mystery Berry']])
        self.assertEqual(self.data['MV'][0]['b'], 'In-battle move text')
        before = copy.deepcopy(self.data)
        schema.standardise(self.data)
        self.assertEqual(self.data, before)

    def test_mega(self):
        self.data['P'][0].update(stone='Example Stone', hi=['Leftovers'])
        schema.standardise(self.data)
        self.assertNotIn('hi', self.data['P'][0])

    def test_invalid(self):
        for change in ('percent', 'item text', 'move text', 'item keys', 'walk key'):
            with self.subTest(change=change):
                value = copy.deepcopy(self.data)
                if change == 'percent':
                    value['P'][0]['hi'] = [['Leftovers', 101]]
                elif change == 'item text':
                    value['IX'] = {'Leftovers': ['missing battle text']}
                elif change == 'move text':
                    value['MV'][0]['b'] = 5
                elif change == 'item keys':
                    value['IT'][0]['r'][0][5] = []
                else:
                    next(stop for split in value['WK']['splits'] for stop in split['st'] if stop['it'])['it'][0][4] = 'unstable'
                with self.assertRaises(AssertionError):
                    schema.standardise(value)

    def test_guides(self):
        for path in (ROOT / 'hacks').glob('*/data.json'):
            with self.subTest(hack=path.parent.name):
                value = json.loads(path.read_text(encoding='utf-8'))
                before = copy.deepcopy(value)
                schema.standardise(value)
                self.assertEqual(value, before)

    def test_held_item_rendering(self):
        subprocess.run(['node', '-e', r"""
const assert = require('node:assert/strict');
const source = require('node:fs').readFileSync(process.argv[1], 'utf8').split(/\r?\n/)
  .find(line => line.includes('Wild held item${'));
assert(source, 'held-item rendering expression exists');
const render = new Function('p', 'esc', "let h='';" + source + ';return h;');
assert.match(render({hi: ['Leftovers']}, String), /Wild held item: Leftovers<\/div>/);
assert.match(render({hi: [['Leftovers', null]]}, String), /Wild held item: Leftovers<\/div>/);
assert.match(render({hi: [['Leftovers', 50], ['Oran Berry', 5]]}, String), /Leftovers \(50%\), Oran Berry \(5%\)/);
assert.match(render({hi: [['Mystery Berry']]}, String), /Wild held item: Mystery Berry<\/div>/);
""", str(ROOT / 'template/dex.js')], check=True, capture_output=True, text=True)


if __name__ == '__main__':
    unittest.main()

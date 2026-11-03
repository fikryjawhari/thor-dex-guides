"""Shared schema, gauntlet order and legacy held-item compatibility regression checks."""
import copy
import json
import os
import pathlib
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema
import extractlib

ROOT = pathlib.Path(__file__).resolve().parents[1]


class GauntletTest(unittest.TestCase):
    def trainer(self, key, starter='', player='', tags=None, **extra):
        return dict(k=key, n=key, st=starter, pl=player, tags=tags or [], p=[], **extra)

    def data(self, rows):
        return {'g': [{'sec': [{'tr': rows}]}]}

    def test_numbered_starter_chains(self):
        rows = [self.trainer(starter + str(number), starter=starter, tags=['Back to Back #' + str(number)])
                for number in (1, 2) for starter in ('Tepig', 'Snivy')]
        trainers = self.data(rows)
        rule = lambda group, section: extractlib.numbered_gauntlets(section)
        extractlib.gauntlets(trainers, rule)
        self.assertEqual(rows[0]['gc'], ['Tepig1', 'Tepig2'])
        self.assertEqual(rows[1]['gc'], ['Snivy1', 'Snivy2'])
        schema.check_gauntlets(trainers)
        before = copy.deepcopy(trainers)
        extractlib.gauntlets(trainers, rule)
        self.assertEqual(trainers, before)
        extractlib.gauntlets(trainers, None)
        self.assertTrue(all('gc' not in trainer for trainer in rows))

    def test_numbered_restarts_and_singletons(self):
        rows = [self.trainer(str(index), tags=['Back to Back #' + str(number)])
                for index, number in enumerate((1, 2, 1, 2, 3, 1))]
        self.assertEqual(list(extractlib.numbered_gauntlets({'tr': rows})), [rows[:2], rows[2:5]])
        rows[0]['tags'] = rows[1]['tags'] = ['Back to Back']
        rows[0]['n'], rows[1]['n'] = 'Grunt #1', 'Grunt #2'
        self.assertEqual(list(extractlib.numbered_gauntlets({'tr': rows[:2]}, name_numbers=True)), [rows[:2]])

    def test_partner_after_last_member(self):
        rows = [self.trainer('first'), self.trainer('last', pt=[{'n': 'Ally', 'p': []}])]
        trainers = self.data(rows)
        extractlib.gauntlets(trainers, lambda group, section: [section['tr']])
        schema.check_gauntlets(trainers)

    def test_invalid_chains(self):
        for change in ('short', 'type', 'duplicate', 'missing', 'self', 'different', 'starter', 'player',
                       'gap', 'partner', 'partner-key', 'reversed'):
            with self.subTest(change=change):
                rows = [self.trainer('first'), self.trainer('last')]
                trainers = self.data(rows)
                extractlib.gauntlets(trainers, lambda group, section: [section['tr']])
                if change == 'short':
                    rows[0]['gc'] = ['first']
                elif change == 'type':
                    rows[0]['gc'] = [1, 2]
                elif change == 'duplicate':
                    rows[0]['gc'] = ['first', 'first']
                elif change == 'missing':
                    rows[0]['gc'] = ['first', 'gone']
                elif change == 'self':
                    rows[0]['gc'] = ['last', 'gone']
                elif change == 'different':
                    del rows[1]['gc']
                elif change == 'starter':
                    rows[0]['st'], rows[1]['st'] = 'Tepig', 'Snivy'
                elif change == 'player':
                    rows[0]['pl'], rows[1]['pl'] = 'm', 'f'
                elif change == 'gap':
                    rows.insert(1, self.trainer('gap'))
                elif change == 'partner':
                    rows[0]['pt'] = [{'n': 'Ally', 'st': 'Snivy', 'p': []}]
                    rows[0]['st'] = rows[1]['st'] = 'Tepig'
                elif change == 'partner-key':
                    rows[0]['gc'] = ['first', 'first~p0']
                else:
                    for trainer in rows:
                        trainer['gc'].reverse()
                with self.assertRaises(AssertionError):
                    schema.check_gauntlets(trainers)

    def test_overlapping_rules(self):
        rows = [self.trainer('first'), self.trainer('last')]
        with self.assertRaises(AssertionError):
            extractlib.gauntlets(self.data(rows), lambda group, section: [rows, rows])

    def test_source_chain_inventory(self):
        expected = {
            'hardlove-gold': [
                ['1.3.2', '1.3.3'],
                ['4.1.3', '4.1.4', '4.1.5', '4.1.6', '4.1.7', '4.1.8'],
                ['6.4.1', '6.4.2'], ['6.4.3', '6.4.4'], ['6.4.5', '6.4.6'],
                ['7.0.0', '7.0.1', '7.0.2'], ['10.3.0', '10.3.1', '10.3.2'],
                ['10.11.0', '10.11.1', '10.11.2']],
            'blaze-black-2-redux': [['18.1.23', '18.1.24'], ['18.1.25', '18.1.26']],
            'emerald-imperium': [
                ['3.0.0', '3.0.1'], ['5.0.0', '5.0.1', '5.0.2', '5.0.3'],
                ['8.0.0', '8.0.1'], ['8.0.3', '8.0.4']],
            'radical-red': [
                ['8.1.0', '8.1.1'], ['9.2.2', '9.2.3'], ['9.3.0', '9.3.1', '9.3.2'],
                ['12.0.2', '12.0.3'], ['17.0.0', '17.0.1'],
                ['17.5.0', '17.5.1', '17.5.2', '17.5.3'], ['17.17.0', '17.17.1', '17.17.2', '17.17.3']],
            'unbound': [['5.2.1', '5.2.2', '5.2.3'], ['5.2.4', '5.2.5']],
            'photonic-sun': [],
            'eternal-x': [],
        }
        for hack, chains in expected.items():
            with self.subTest(hack=hack):
                directory = ROOT / 'hacks' / hack
                data = json.loads((directory / 'data.json').read_text(encoding='utf-8'))
                stable = {entry['k'] for entry in json.loads((directory / 'extract/trainer_keys.json').read_text(encoding='utf-8'))}
                actual = []
                for group in data['TR']['g']:
                    for section in group['sec']:
                        for trainer in section['tr']:
                            if 'gc' in trainer:
                                self.assertTrue(set(trainer['gc']) <= stable)
                                if trainer['gc'] not in actual:
                                    actual.append(trainer['gc'])
                self.assertEqual(actual, chains)
                schema.check_gauntlets(data['TR'])


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
        # heldBlock (dex.js): the Pokémon page's wild held items, highest % first, no % when the data has none, only
        # on a form met in the wild; '' when none. Run from the template's own source with stub helpers.
        subprocess.run(['node', '-e', r"""
const assert = require('node:assert/strict');
const lines = require('node:fs').readFileSync(process.argv[1], 'utf8').split(/\r?\n/);
const at = lines.findIndex(line => line.startsWith('function heldBlock(p){'));
assert(at >= 0, 'heldBlock exists');
let end = at;
while (!/^ return .*;}$/.test(lines[end])) end++;
const make = new Function('wildForm', 'PK', 'ilink', 'esc', lines.slice(at, end + 1).join('\n') + ';return heldBlock;');
const held = (p, wild = true) => make(() => wild, (k, j) => ` data-k="${k}"`, n => `<a>${n}</a>`, String)(p);
const items = h => [...h.matchAll(/<a>([^<]*)<\/a>(?:<span class="pct">([^<]*)%<\/span>)?/g)].map(m => [m[1], m[2] ?? null]);
assert.deepEqual(items(held({hi: ['Leftovers']})), [['Leftovers', null]]);
assert.deepEqual(items(held({hi: [['Leftovers', null]]})), [['Leftovers', null]]);
assert.deepEqual(items(held({hi: [['Oran Berry', 5], ['Leftovers', 50]]})), [['Leftovers', '50'], ['Oran Berry', '5']]);
assert.deepEqual(items(held({hi: [['Mystery Berry']]})), [['Mystery Berry', null]]);
assert.match(held({hi: ['Leftovers']}), /^<div class="phi">/);
assert.equal(held({hi: []}), '');
assert.equal(held({}), '');
assert.equal(held({hi: ['Leftovers']}, false), '', 'not a wild form: no section');
""", str(ROOT / 'template/dex.js')], check=True, capture_output=True, text=True)

if __name__ == '__main__':
    unittest.main()

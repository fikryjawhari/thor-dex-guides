"""Unit tests for the gate's helpers: text lint, accepted data differences, domcompare's build-stamp normalisation.
uv run python -X utf8 -I tools/gate_test.py"""
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import gateaccept  # noqa: E402
import textlint  # noqa: E402


class Lint(unittest.TestCase):
    def kinds(self, data):
        return [(line, kind) for line, kind, _ in textlint.problems(data)]

    def test_clean(self):
        self.assertEqual(self.kinds('a\tb\nNidoran♂ é →\n'.encode()), [])

    def test_crlf_bom(self):
        self.assertEqual(self.kinds(b'\xef\xbb\xbfa\nb\r\nc\r\n'), [(1, 'UTF-8 BOM'), (2, 'CRLF line endings (2 lines)')])
        self.assertEqual(textlint.fixed(b'\xef\xbb\xbfa\r\nb\r\n'), b'a\nb\n')

    def test_controls(self):
        self.assertEqual(self.kinds(b'a\nb\x00\nc\x1b[0m\rd\x7f\n'),
                         [(2, 'NUL'), (3, 'control byte 0x1b'), (3, 'lone CR'), (3, 'DEL')])
        self.assertFalse(any(fixable for _, _, fixable in textlint.problems(b'x = "\x01"\n')))

    def test_invalid_utf8(self):
        self.assertEqual(self.kinds(b'ok\n\xe9t\xe9\n'), [(2, 'invalid UTF-8 (invalid continuation byte)')])

    def test_scope(self):
        names = textlint.files()
        self.assertIn('assemble.py', names)
        self.assertIn('tools/gate.py', names)
        self.assertTrue(any(name.startswith('hacks/') and name.endswith('/hack.json') for name in names))
        self.assertFalse([name for name in names if '/.src/' in name or name.endswith(('.sav', '.png'))])


class AcceptData(unittest.TestCase):
    OLD = {'built': '2026-11-01', 'MV': [{'n': 'Tackle', 'bp': 40}, {'n': 'Ember', 'bp': 40}],
           'TR': {'g': [{'sec': [{'tr': [{'n': 'Joey'}, {'n': 'Ace', 'gc': 1}]}]}]}}

    def new(self):
        import copy
        data = copy.deepcopy(self.OLD)
        data['built'] = '2026-11-03'
        for move in data['MV']:
            move['aiEffect'] = 'x'
        data['TR']['g'][0]['sec'][0]['tr'][0]['gc'] = 2
        data['TR']['g'][0]['sec'][0]['tr'][1]['gc'] = 3
        return data

    def test_built_ignored(self):
        self.assertEqual(gateaccept.data_diff(self.OLD, dict(self.OLD, built='later')), ({}, {}))

    def test_named_paths(self):
        ok, rest = gateaccept.data_diff(self.OLD, self.new())
        self.assertEqual(ok, {})
        self.assertEqual(rest, {'MV[].aiEffect': {'e.g.': 'MV[0].aiEffect', 'added': 2},
                                'TR.g[].sec[].tr[].gc': {'e.g.': 'TR.g[0].sec[0].tr[0].gc', 'added': 1, 'changed': 1}})

    def test_accepted(self):
        ok, rest = gateaccept.data_diff(self.OLD, self.new(), ['TR.g[].sec[].tr[].gc', 'MV[].aiEffect'])
        self.assertEqual(rest, {})
        self.assertEqual(sorted(ok), ['MV[].aiEffect', 'TR.g[].sec[].tr[].gc'])
        ok, rest = gateaccept.data_diff(self.OLD, self.new(), ['MV[].aiEffect'])
        self.assertEqual(list(rest), ['TR.g[].sec[].tr[].gc'])

    def test_prefix_and_wildcard(self):
        self.assertTrue(gateaccept.covered('MV[3].aiEffect.x', ['MV[]']))
        self.assertTrue(gateaccept.covered('MV[3].aiEffect', ['MV[].*']))
        self.assertFalse(gateaccept.covered('MV[3]', ['MV[].aiEffect']))
        self.assertFalse(gateaccept.covered('MVX[3].aiEffect', ['MV[]']))
        self.assertTrue(gateaccept.covered('TR.g[1].sec[0].tr[4]', ['TR.g[].sec[].tr[]']))
        new = dict(self.OLD, MV=self.OLD['MV'][:1])
        self.assertEqual(gateaccept.data_diff(self.OLD, new)[1], {'MV[]': {'e.g.': 'MV[1]', 'removed': 1}})
        self.assertEqual(gateaccept.data_diff(self.OLD, dict(self.OLD, MV=[{'n': 'Tackle', 'bp': 40.0}, self.OLD['MV'][1]]))[1],
                         {'MV[].bp': {'e.g.': 'MV[0].bp', 'changed': 1}})

    def test_specs(self):
        import json
        import tempfile
        hacks = ['eternal-x', 'hardlove-gold']
        self.assertEqual(dict(gateaccept.parse(['MV[].a,hardlove-gold:TR.x', 'eternal-x:#/calc'], hacks)),
                         {'eternal-x': ['MV[].a', '#/calc'], 'hardlove-gold': ['MV[].a', 'TR.x']})
        self.assertEqual(dict(gateaccept.parse(['radical-red:MV[]'], hacks)), {})
        with self.assertRaises(ValueError):
            gateaccept.parse(['no-such-guide:MV[]'], hacks)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'accept.json'
            path.write_text(json.dumps({'data': {'*': ['P[].s'], 'eternal-x': 'MV[].a,MV[].b'},
                                        'routes': {'hardlove-gold': ['#/calc']}}), encoding='utf-8')
            self.assertEqual(dict(gateaccept.accepts('data', ['IT[]'], hacks, path)),
                             {'eternal-x': ['IT[]', 'P[].s', 'MV[].a', 'MV[].b'], 'hardlove-gold': ['IT[]', 'P[].s']})
            self.assertEqual(dict(gateaccept.accepts('routes', None, hacks, path)), {'hardlove-gold': ['#/calc']})
            self.assertEqual(gateaccept.accepts('data', None, hacks, Path(directory) / 'none.json'), {})


if __name__ == '__main__':
    unittest.main()

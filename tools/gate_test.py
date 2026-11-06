"""Unit tests for the gate's helpers: text lint, the Chrome 109 compat lint, accepted data differences, domcompare's build-stamp normalisation.
uv run python -X utf8 -I tools/gate_test.py"""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import compatlint  # noqa: E402
import gate  # noqa: E402
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


class DomNormalise(unittest.TestCase):
    def test_stamps_and_routes(self):
        subprocess.run(['node', '--input-type=module', '-e', """
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { normalise, routeMatcher } = await import(pathToFileURL(process.argv[1]).href);
const foot = d => `<div class="foot">Eternal X offline dex · 975 Pokémon · 40 trainers · built ${d} · credit</div>`;
assert.equal(normalise(foot('2026-11-02')), normalise(foot('2026-11-03')));
assert.equal(normalise(foot('2026-11-02')), foot('<date>'));
assert.equal(normalise('built 2026-11-02T10:31:05.123Z.'), 'built <date>.');
assert.equal(normalise('<p>prebuilt 2026-11-02</p><i>built by hand</i>'), '<p>prebuilt 2026-11-02</p><i>built by hand</i>');
// injected into the page as source: it must still work stringified
assert.equal(eval('(' + normalise.toString() + ')')(foot('2025-01-01')), foot('<date>'));
const accepted = routeMatcher(['#/calc', '#/tr/*', '']);
assert.ok(accepted('#/calc') && accepted('#/tr/t12'));
assert.ok(!accepted('#/calcx') && !accepted('#/') && !accepted('#/p/1'));
assert.ok(!routeMatcher([])('#/calc'));
""", str(ROOT / 'tools/domnorm.mjs')], check=True, capture_output=True, text=True)


class Compat(unittest.TestCase):
    def features(self, name, text):
        return [feature.split(' (')[0] for _, feature in compatlint.scan(Path(name), text)]

    def test_css(self):
        self.assertEqual(self.features('a.css', '@scope (body.x) {\n.a{color:red}\n}'), ['@scope'])
        self.assertEqual(self.features('a.css', '.a{color:red;&:hover{color:blue}}'), ['CSS nesting &'])
        self.assertEqual(self.features('a.css', '.a{content:"&"} /* & @scope */ .b{background:url(x?a&b)}'), [])

    def test_color_mix_fallback(self):
        mix = 'color-mix(in srgb,red 50%,blue)'
        self.assertEqual(self.features('a.css', '.a{background:' + mix + '}'), ['color-mix() with no background fallback before it'])
        self.assertEqual(self.features('a.css', '.a{background:red;background:' + mix + '}'), [])
        self.assertEqual(self.features('a.css', '.a{color:red;background:' + mix + '}'), ['color-mix() with no background fallback before it'])

    def test_js(self):
        self.assertEqual(self.features('a.js', 'a.toSorted();b.union(c);Object.groupBy(d,f)'),
                         ['Array change-by-copy', 'Object / Map.groupBy', 'Set methods'])
        self.assertEqual(self.features('a.js', '// a.toSorted()\nconst s="b.union(c)";x.findLast(f)'), [])

    def test_template_clean(self):
        self.assertEqual(compatlint.lint(out=lambda line: None), 0)


class CacheInputs(unittest.TestCase):
    """What invalidates a guide's cached passes."""

    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        for name in ('template/dex.js', 'template/README.md', 'template/calc.js', 'template/calc/engine.js',
                     'template/calc/ai/hardlove.js', 'template/calc/ai/ui.js', 'template/calc/readers/README.md',
                     'template/calc/readers/gen4.js', 'template/calc/readers/gen3.js', 'template/calc/readers/test.js',
                     'template/calc/profiles/expansion.json', 'template/calc/profiles/gen7.json',
                     'hack/hack.json', 'hack/watch.json', 'hack/data.json', 'hack/extract/trainer_keys.json'):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('x', encoding='utf-8')

    def names(self, *calc):
        template = self.root / 'template'
        return {path.relative_to(template).as_posix() for path in gate.template_inputs(template, *calc)}

    def test_docs_never_count(self):
        for calc in ((), (None,), ({'base': 'gen7'},)):
            self.assertFalse({name for name in self.names(*calc) if name.endswith('.md')})

    def test_other_guides_parts_do_not_count(self):
        self.assertEqual(self.names({'base': 'gen7', 'save': 'gen3'}), {
            'dex.js', 'calc.js', 'calc/engine.js', 'calc/readers/gen3.js', 'calc/readers/test.js',
            'calc/profiles/gen7.json'})

    def test_own_ai_counts(self):
        names = self.names({'ai': 'hardlove', 'base': 'expansion', 'save': 'gen4'})
        self.assertLessEqual({'calc/ai/hardlove.js', 'calc/ai/ui.js', 'calc/readers/gen4.js',
                              'calc/profiles/expansion.json'}, names)

    def test_no_calc_keeps_the_shared_page(self):
        self.assertEqual(self.names(None), {'dex.js', 'calc.js', 'calc/engine.js', 'calc/readers/test.js'})

    def test_no_guide_keeps_everything_but_docs(self):
        self.assertEqual(len(self.names()), 10)

    def test_watch_json_does_not_count(self):
        self.assertEqual({path.name for path in gate.hack_inputs(self.root / 'hack')},
                         {'hack.json', 'data.json', 'trainer_keys.json'})


class AutoBaseline(unittest.TestCase):
    """When `check` replaces .tmp/baseline, in a real repository: a1 - a2 (origin/main) - a3 (main), b1 off a2."""

    def setUp(self):
        temp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.email', 'test@example.invalid')
        self.git('config', 'user.name', 'test')
        self.a1, self.a2 = self.commit('a1'), self.commit('a2')
        self.git('update-ref', 'refs/remotes/origin/main', self.a2)
        self.a3 = self.commit('a3')
        self.base = self.root / '.tmp' / 'baseline'
        self.captured = []
        for name, value in (('ROOT', self.root), ('BASE', self.base), ('baseline', self.capture)):
            patcher = mock.patch.object(gate, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def git(self, *args):
        return subprocess.run(['git', *args], cwd=self.root, capture_output=True, text=True, check=True).stdout.strip()

    def commit(self, message):
        self.git('commit', '-q', '--allow-empty', '-m', message)
        return self.git('rev-parse', 'HEAD')

    def have(self, sha, keep=False):
        self.base.mkdir(parents=True, exist_ok=True)
        (self.base / 'manifest.json').write_text(json.dumps(dict(sha=sha, keep=keep)), encoding='utf-8')

    def capture(self, _gate, ref):
        self.captured.append(ref)
        self.have(ref)

    def run_auto(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            ok = gate.auto_baseline(None)
        return ok, output.getvalue()

    def test_no_baseline_on_main_is_what_is_published(self):
        self.assertTrue(self.run_auto()[0])
        self.assertEqual(self.captured, [self.a2])

    def test_stale_on_main_is_replaced_with_a_warning(self):
        self.have(self.a1)
        ok, output = self.run_auto()
        self.assertTrue(ok)
        self.assertEqual(self.captured, [self.a2])
        self.assertIn('WARNING', output)

    def test_kept_stays_with_a_warning(self):
        self.have(self.a1, keep=True)
        ok, output = self.run_auto()
        self.assertTrue(ok)
        self.assertEqual(self.captured, [])
        self.assertIn('WARNING', output)

    def test_current_and_newer_stay_silent(self):
        for sha in (self.a2, self.a3):
            self.have(sha)
            self.assertEqual(self.run_auto(), (True, ''))
        self.assertEqual(self.captured, [])

    def test_branch_compares_with_where_it_left_main(self):
        self.git('checkout', '-q', '-b', 'job', self.a2)
        job = self.commit('b1')
        self.have(self.a1)
        self.run_auto()
        self.assertEqual(self.captured, [self.a2])
        self.captured.clear()
        self.have(job)  # the job's own start commit: newer, stays
        self.assertEqual(self.run_auto(), (True, ''))
        self.assertEqual(self.captured, [])

    def test_outside_history_is_replaced(self):
        self.git('checkout', '-q', '-b', 'job', self.a2)
        self.have(self.a3)
        self.run_auto()
        self.assertEqual(self.captured, [self.a2])

    def test_no_origin_keeps_what_is_there(self):
        self.git('update-ref', '-d', 'refs/remotes/origin/main')
        self.have(self.a1)
        self.assertEqual(self.run_auto(), (True, ''))
        self.assertEqual(self.captured, [])


if __name__ == '__main__':
    unittest.main()

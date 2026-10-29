"""Scaffold safety checks; python -I tools/new_hack_test.py (stdlib and Node)."""
import argparse
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('new_hack', Path(__file__).with_name('new_hack.py'))
new_hack = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(new_hack)


class ScaffoldTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.original = new_hack.ROOT
        self.root_patch = patch.object(new_hack, 'ROOT', self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.write('hacks/sibling/data.json', '{}\n')
        self.write('hacks/sibling/hack.json', json.dumps({
            'id': 'sibling', 'title': 'Sibling Dex', 'game': 'Sibling', 'version': '1', 'platform': 'NDS',
            'cfg': {'name': 'Sibling', 'orig': 'Sibling provenance', 'evs': False,
                    'calc': {'base': 'expansion', 'save': 'nds'},
                    'ls': {'dex': 'sibdex4', 'calc': 'sibcalc'},
                    'txt': {'tc': 'Sibling mechanics', 'conf': ''}},
        }))
        self.write('tools/gate.py', "REBUILDS = {\n    'sibling': ['sibling.py'],\n}\n")
        self.write('tools/scenarios/calc-doubles.mjs', "const EXPECTED = { 'sibling': 2 };\n")
        self.write('tools/calc/package.json', json.dumps({'scripts': {'test': 'node test.mjs'}}))
        self.args = argparse.Namespace(hack='new-guide', like='sibling', title='New Guide', version='TODO',
                                      ls_prefix=None, force=False, dry_run=False)

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')
        return path

    def materialise(self):
        files = new_hack.scaffold(self.args)
        for path, text in files.items():
            self.write(path.relative_to(self.root), text)
        return files

    def test_complete_file_set_and_no_data(self):
        files = self.materialise()
        self.assertEqual(len(files), 17)
        config = json.loads((self.root / 'hacks/new-guide/hack.json').read_text())
        self.assertEqual(config['cfg']['ls'], {'dex': 'newguidedex', 'calc': 'newguidecalc'})
        self.assertIs(config['cfg']['calc'], False)
        self.assertEqual(config['cfg']['orig'], '')
        self.assertEqual(config['cfg']['txt']['tc'], 'TODO: tc')
        self.assertNotIn('Sibling', json.dumps(config))
        self.assertFalse((self.root / 'hacks/new-guide/data.json').exists())
        for path, text in files.items():
            if path.suffix == '.py':
                compile(text, str(path), 'exec')

    def test_explicit_metadata_and_prefix(self):
        self.args.title = 'A "quoted" title'
        self.args.version = '1.4.1 Complete / Challenge'
        self.args.ls_prefix = 'bb2r'
        config = json.loads(new_hack.scaffold(self.args)[self.root / 'hacks/new-guide/hack.json'])
        self.assertEqual(config['game'], self.args.title)
        self.assertEqual(config['version'], self.args.version)
        self.assertEqual(config['cfg']['ls']['dex'], 'bb2rdex')

    def test_collision_refused(self):
        self.args.ls_prefix = 'sib'
        with self.assertRaisesRegex(ValueError, 'collides'):
            new_hack.scaffold(self.args)
        self.assertFalse((self.root / 'hacks/new-guide').exists())

    def test_existing_file_refused_before_any_writes(self):
        self.write('hacks/new-guide/extract/items.py', 'owned by a data builder\n')
        with self.assertRaisesRegex(ValueError, 'refusing to overwrite'):
            new_hack.scaffold(self.args)
        self.assertFalse((self.root / 'hacks/new-guide/hack.json').exists())
        self.assertNotIn('new-guide', (self.root / 'tools/gate.py').read_text())

    def test_repeat_requires_force_and_force_is_idempotent(self):
        self.materialise()
        with self.assertRaisesRegex(ValueError, 'refusing to overwrite'):
            new_hack.scaffold(self.args)
        self.args.force = True
        self.assertEqual(new_hack.scaffold(self.args), {})

    def test_force_preserves_storage(self):
        self.materialise()
        self.args.force = True
        self.args.ls_prefix = 'changed'
        with self.assertRaisesRegex(ValueError, 'cannot change'):
            new_hack.scaffold(self.args)

    def test_sources_append_only_even_with_force(self):
        text = '# Existing source audit\n\nLeave this text alone.\n\n## Re-fetch\n\nKeep these commands.\n'
        path = self.write('hacks/new-guide/SOURCES.md', text)
        self.materialise()
        appended = path.read_text()
        self.assertTrue(appended.startswith(text))
        self.assertEqual(appended.count('## Re-fetch'), 1)
        for heading in new_hack.SOURCE_HEADINGS:
            self.assertIn('## ' + heading, appended)
        self.args.force = True
        self.assertNotIn(path, new_hack.scaffold(self.args))

    def test_invalid_ids_and_unbuilt_sibling(self):
        for hack in ('../outside', 'Upper', 'a--b', 'sibling'):
            self.args.hack = hack
            with self.assertRaises(ValueError):
                new_hack.scaffold(self.args)
        self.args.hack = 'valid'
        self.args.like = 'unbuilt'
        with self.assertRaisesRegex(ValueError, 'built guide'):
            new_hack.scaffold(self.args)

    def test_dry_run_writes_nothing(self):
        before = {path.relative_to(self.root): path.read_bytes() for path in self.root.rglob('*') if path.is_file()}
        with patch.object(sys, 'argv', ['new_hack.py', 'new-guide', '--like', 'sibling', '--dry-run']):
            with contextlib.redirect_stdout(io.StringIO()) as output:
                new_hack.main()
        after = {path.relative_to(self.root): path.read_bytes() for path in self.root.rglob('*') if path.is_file()}
        self.assertEqual(before, after)
        self.assertIn('DRY RUN: 17 files', output.getvalue())

    def test_engine_stub_skips_then_fails_when_enabled(self):
        self.materialise()
        command = ['node', str(self.root / 'tools/calc/new-guide_check.mjs')]
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
        self.write('hacks/new-guide/data.json', '{}')
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
        path = self.root / 'hacks/new-guide/hack.json'
        config = json.loads(path.read_text())
        config['cfg']['calc'] = {'base': 'gen5'}
        path.write_text(json.dumps(config))
        result = subprocess.run(command, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('TODO:', result.stderr)

    def test_scenario_stub_skips_other_guides_but_fails_for_enabled_target(self):
        self.materialise()
        self.write('tools/calc_check_lib.mjs', '''import {readFileSync} from 'node:fs';
export const guideArg = argv => argv[2];
export const readGuide = file => ({data: JSON.parse(readFileSync(file, 'utf8'))});
''')
        guide = self.root / 'sample.html'
        command = ['node', str(self.root / 'tools/scenarios/calc-new-guide.mjs'), str(guide)]
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
        for name, enabled, expected in [('Sibling', True, 0), ('New Guide', False, 0), ('New Guide', True, 1)]:
            guide.write_text(json.dumps({'cfg': {'name': name, 'calc': enabled}}))
            result = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(result.returncode, expected)
            if expected:
                self.assertIn('TODO:', result.stderr)

    def test_assemble_reports_unbuilt_guide_without_building(self):
        spec = importlib.util.spec_from_file_location('assemble', self.original / 'assemble.py')
        assemble = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(assemble)
        self.materialise()
        with patch.object(assemble, 'ROOT', str(self.root)):
            with patch.object(sys, 'argv', ['assemble.py', 'new-guide']):
                with patch.object(assemble, 'build') as build:
                    with contextlib.redirect_stdout(io.StringIO()) as output:
                        assemble.main()
        build.assert_not_called()
        self.assertIn('SKIP new-guide: no data.json', output.getvalue())


if __name__ == '__main__':
    unittest.main()

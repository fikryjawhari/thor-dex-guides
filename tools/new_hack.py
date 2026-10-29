"""Create an unbuilt guide: new_hack.py <hack> --like <built hack> [--dry-run]."""
import argparse
import copy
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
ID = re.compile(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*\Z')
NOTES_HEADINGS = ('Build', 'Sources and rules', 'Local storage', 'Hack-only data', 'Checks', 'History')
SOURCE_HEADINGS = ('Files', 'Re-fetch', 'Game files', 'Source checks')


def json_text(value):
    return json.dumps(value, ensure_ascii=False, indent=1) + '\n'


def source_notes(path, title):
    text = path.read_text(encoding='utf-8') if path.exists() else f'# {title} sources\n'
    headings = set(re.findall(r'^## (.+?)\s*$', text, re.MULTILINE))
    for heading in SOURCE_HEADINGS:
        if heading not in headings:
            text += f'\n\n## {heading}\n\nTODO: document {heading.lower()}.\n'
    return text


def scaffold(args):
    """Preflight the entire write set before creating or replacing any files."""
    if not ID.fullmatch(args.hack) or not ID.fullmatch(args.like):
        raise ValueError('hack IDs must be lowercase letters/digits separated by single hyphens')
    if args.hack == args.like:
        raise ValueError('the new guide and --like guide must differ')
    sibling = ROOT / 'hacks' / args.like
    if not (sibling / 'hack.json').is_file() or not (sibling / 'data.json').is_file():
        raise ValueError('--like must name a built guide (hack.json and data.json)')
    prefix = args.ls_prefix or args.hack.replace('-', '')
    if not re.fullmatch(r'[a-z][a-z0-9]*', prefix):
        raise ValueError('--ls-prefix must be lowercase letters/digits, starting with a letter')
    original = json.loads((sibling / 'hack.json').read_text(encoding='utf-8'))
    storage = {key: prefix + key for key in original['cfg']['ls']}
    for path in sorted((ROOT / 'hacks').glob('*/hack.json')):
        if path.parent.name == args.hack:
            continue
        existing = json.loads(path.read_text(encoding='utf-8'))['cfg']['ls']
        for key, value in existing.items():
            if value in storage.values() or value.startswith(prefix):
                raise ValueError(f'localStorage prefix {prefix!r} collides with {path.parent.name}: {key}={value}')
    title = args.title or args.hack.replace('-', ' ').title()
    configuration = copy.deepcopy(original)
    configuration.update(id=args.hack, title=title + ' Dex', game=title, version=args.version)
    cfg = configuration['cfg']
    cfg.update(name=title, orig='', calc=False, ls=storage)
    cfg['txt'] = {key: f'TODO: {key}' if value else '' for key, value in cfg['txt'].items()}
    directory = ROOT / 'hacks' / args.hack
    notes = f'# {title} build notes\n\nScaffold only, based on `{args.like}`. Feature switches need review.\n'
    for heading in NOTES_HEADINGS:
        detail = f'TODO: document {heading.lower()}.'
        if heading == 'Local storage':
            detail = f'Prefix `{prefix}`. Keep these keys once published.\n\n' + '\n'.join(f'- `{key}`: `{value}`' for key, value in storage.items())
        if heading == 'Build':
            detail = f'`uv run python -I hacks/{args.hack}/extract/build.py`\n\nTODO: implement extract modules; audit inherited cfg switches and cfg.txt wording.'
        if heading == 'Checks':
            detail = f'`uv run python -I tools/gate.py check {args.hack}`\n\n' + CALC_TODO
        notes += f'\n## {heading}\n\n{detail}\n'
    files = {directory / 'hack.json': json_text(configuration), directory / 'notes.md': notes,
             directory / 'sprites.json': '{}\n'}
    for name, text in extract_files(args.hack).items():
        files[directory / 'extract' / name] = text
    files[ROOT / 'tools' / 'scenarios' / f'calc-{args.hack}.mjs'] = scenario_stub(args.hack, title)
    files[ROOT / 'tools' / 'calc' / f'{args.hack}_check.mjs'] = engine_stub(args.hack)
    sources = directory / 'SOURCES.md'
    files[sources] = source_notes(sources, title)
    gate = ROOT / 'tools' / 'gate.py'
    text = gate.read_text(encoding='utf-8')
    entry = f"    '{args.hack}': ['hacks/{args.hack}/extract/build.py'],\n"
    if not re.search(rf"^    ['\"]{re.escape(args.hack)}['\"]:", text, re.MULTILINE):
        if text.count('REBUILDS = {\n') != 1:
            raise ValueError('cannot locate tools/gate.py REBUILDS insertion point')
        files[gate] = text.replace('REBUILDS = {\n', 'REBUILDS = {\n' + entry, 1)
    doubles = ROOT / 'tools' / 'scenarios' / 'calc-doubles.mjs'
    text = doubles.read_text(encoding='utf-8')
    if not re.search(rf"['\"]{re.escape(args.hack)}['\"]\s*:", text):
        if text.count('const EXPECTED = {') != 1:
            raise ValueError('cannot locate calc-doubles.mjs EXPECTED insertion point')
        files[doubles] = text.replace('const EXPECTED = {', f"const EXPECTED = {{ '{args.hack}': null,", 1)
    package = ROOT / 'tools' / 'calc' / 'package.json'
    settings = json.loads(package.read_text(encoding='utf-8'))
    command = f'node {args.hack}_check.mjs'
    if command not in settings['scripts']['test'].split(' && '):
        settings['scripts']['test'] += ' && ' + command
        files[package] = json.dumps(settings, ensure_ascii=False, indent=2) + '\n'
    conflicts = [str(path.relative_to(ROOT)) for path in files
                 if path.exists() and path not in (sources, gate, doubles, package)]
    if conflicts and not args.force:
        raise ValueError('refusing to overwrite existing files (use --force): ' + ', '.join(conflicts))
    existing_config = directory / 'hack.json'
    if args.force and existing_config.exists():
        existing = json.loads(existing_config.read_text(encoding='utf-8'))
        if existing['cfg']['ls'] != storage:
            raise ValueError('--force cannot change an existing guide\'s localStorage keys')
    return {path: text for path, text in files.items()
            if not path.exists() or path.read_text(encoding='utf-8') != text}


CALC_TODO = '''TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.'''


def extract_files(hack):
    files = {
        'common.py': f'''"""Paths shared by the {hack} extract modules."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
from extractlib import Hack

H = Hack('{hack}')
''',
        'build.py': f'''"""TODO: extract {hack} sources; never seed data from another guide."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import H
import extractlib
import dex
import locs
import trainers
import items
import walk


def main():
    data = {{}}
    for module in (dex, locs, trainers, items, walk):
        module.build(data)
    extractlib.finalise(data, H.name)
    extractlib.write_data(data, H)


if __name__ == '__main__':
    try:
        main()
    except NotImplementedError as error:
        sys.exit(str(error))
''',
        'check.py': f'''"""TODO: source-backed {hack} checks, including baseline comparisons."""
from pathlib import Path
import sys

data = Path(__file__).resolve().parents[1] / 'data.json'
if not data.is_file():
    print('SKIP {hack} extract-check: no data.json')
    sys.exit(0)
sys.exit('TODO: implement {hack} extract checks before accepting data')
''',
    }
    for module, fields in [('dex', 'M, MV, AB, P, TC'), ('locs', 'LOC, AR, ARO and species locations'),
                           ('trainers', 'TR and trainer field evidence'), ('items', 'IT'), ('walk', 'WK')]:
        files[module + '.py'] = f'''"""TODO: extract {fields} from this hack's audited sources."""


def build(data):
    raise NotImplementedError('TODO: implement {hack} {module} extraction')
'''
    return files


def scenario_stub(hack, title):
    return f'''import {{ existsSync }} from 'node:fs';
import {{ guideArg, readGuide }} from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/{hack}.html');
if (!existsSync(file)) {{
  console.log('SKIP calc-{hack}: no built guide');
  process.exit(0);
}}
const guide = readGuide(file);
if (guide.data.cfg.name !== {json.dumps(title)} || !guide.data.cfg.calc) {{
  console.log('SKIP calc-{hack}: requires its enabled calc profile');
  process.exit(0);
}}
throw new Error('TODO: implement {hack} profile scenarios before enabling cfg.calc');
'''


def engine_stub(hack):
    return f'''import {{ existsSync, readFileSync }} from 'node:fs';

const directory = new URL('../../hacks/{hack}/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
if (!existsSync(new URL('data.json', directory)) || !configuration.cfg.calc) {{
  console.log('SKIP {hack} calc-check: no data.json or cfg.calc');
  process.exit(0);
}}
throw new Error('TODO: implement {hack} source-backed engine fixtures before enabling cfg.calc');
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('hack')
    parser.add_argument('--like', required=True)
    parser.add_argument('--title', help='game name (the page title adds " Dex")')
    parser.add_argument('--version', default='TODO')
    parser.add_argument('--ls-prefix', help='localStorage prefix (default: hack ID without hyphens)')
    parser.add_argument('--force', action='store_true', help='replace stubs, never source text or saved-state keys')
    parser.add_argument('--dry-run', action='store_true', help='preflight and list writes without changing files')
    args = parser.parse_args()
    try:
        files = scaffold(args)
        for path, text in files.items():
            print(f'{"WOULD WRITE" if args.dry_run else "WRITE"} {path.relative_to(ROOT).as_posix()}')
            if not args.dry_run:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(text, encoding='utf-8', newline='\n')
        print(f'{"DRY RUN" if args.dry_run else "DONE"}: {len(files)} files; data.json deliberately absent; cfg.calc disabled')
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f'FAIL scaffold: {error}\n')


if __name__ == '__main__':
    main()

"""Reproducible data and browser gates; baseline [ref], check [hack ...] or scenarios [hack ...].

Baselines use git archive: only committed files reach the build, no checkout or
Git worktree registration changes, and no raw sources are needed.
Browser checks (domcompare, consistency, walk-state, the mockup checks, scenarios) run --jobs N at once
(default 7); a check that fails in the pool is rerun alone once, and passes then only as a timing flake.
Result cache: a browser check that passed is skipped while its inputs are byte-identical (the guide's dist and
JSON files, the check script and what it imports, the template parts it can reach, fixtures, the frame, Chrome and Node): one cache
in the main checkout's .tmp/check-cache, shared by every worktree. --fresh ignores it (still records passes).
`scenarios` runs only tools/scenarios/ on the built dist (no rebuild, no baseline):
--only names some of them (comma-separated stems, e.g. calc-layout,calc-controls).
"""
import concurrent.futures
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import threading
import time

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import gateaccept  # noqa: E402
import compatlint  # noqa: E402
import textlint  # noqa: E402

BASE = ROOT / '.tmp' / 'baseline'
REBUILDS = {
    'radical-red': ['hacks/radical-red/extract/build.py'],
    'unbound': ['hacks/unbound/extract/build.py'],
    'blaze-black-2-redux': ['hacks/blaze-black-2-redux/extract/build.py'],
    'eternal-x': ['hacks/eternal-x/extract/build.py'],
    'photonic-sun': ['hacks/photonic-sun/extract/build.py'],
    'hardlove-gold': ['hacks/hardlove-gold/extract/build.py'],
    'emerald-imperium': ['tools/itemstd.py', 'emerald-imperium'],
}
BROWSER_CHECK = r'(domcompare|consistency-check|walk-state-check|jumpcheck|zoomcheck|scenarios[/\\][^ ]+)\.mjs'
# Inputs every browser check may read besides its own scripts and the guide (readGuide's EI save tables, the
# injected test reader, the frame, save fixtures).
SHARED_INPUTS = ['tools/scenarios/fixtures','tools/mockup/thor-frame', 'hacks/emerald-imperium/data.json']
# Python children: UTF-8 I/O whatever the console code page (-I ignores PYTHONUTF8 / PYTHONIOENCODING, and a
# redirected cp1252 stdout crashed on a species name such as Nidoran♂).
PY = [sys.executable, '-X', 'utf8']
IMPORT = re.compile(r'''(?:from|import)\s*\(?\s*['"](\.{1,2}/[^'"]+)['"]''')


def main_checkout():
    common = subprocess.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd=ROOT,
                            capture_output=True, text=True, check=True).stdout.strip()
    return Path(common).resolve().parent


def template_inputs(template, calc=False):
    """The template files a guide's checks can read. calc: the guide's cfg.calc (None: no calc); left out, every
    guide's parts count (a check with no guide). What assemble.py inlines is in the guide's dist anyway; the rest of
    template/ stays in the key for checks that read it at run time. Docs and other guides' AI, save reader and base
    profile can't reach this guide, so they don't invalidate its passes."""
    def needed(path):
        parts = path.relative_to(template).parts
        if path.suffix == '.md' or '__pycache__' in parts:
            return False
        if calc is False or parts[:1] != ('calc',) or len(parts) < 3:
            return True
        own = calc or {}
        if parts[1] == 'ai':
            return bool(own.get('ai'))
        if parts[1] == 'readers':
            return path.stem in ('test', own.get('save'))
        if parts[1] == 'profiles':
            return path.stem == own.get('base')
        return True
    return {path for path in template.rglob('*') if path.is_file() and needed(path)}


def hack_inputs(directory):
    """A guide's JSON files; watch.json only tracks its sources: no check reads it."""
    return {path for path in {*directory.glob('*.json'), *(directory / 'extract').glob('*.json')}
            if path.name != 'watch.json'}


class Cache:
    """Passes of browser checks keyed by the sha256 of everything they read; failures are never stored."""

    def __init__(self, fresh=False):
        self.fresh = fresh
        self.dir = main_checkout() / '.tmp' / 'check-cache'
        self.dir.mkdir(parents=True, exist_ok=True)
        self.hashes = {}
        self.lock = threading.RLock()
        chrome = os.environ.get('CHROME') or next((p for p in ('C:/Program Files/Google/Chrome/Application/chrome.exe',
            'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') if Path(p).exists()), '')
        stat = Path(chrome).stat() if chrome else None
        node = subprocess.run(['node', '--version'], capture_output=True, text=True).stdout.strip()
        self.env = f'{chrome}:{stat.st_size if stat else 0}:{stat.st_mtime_ns if stat else 0}:{node}'

    def digest(self, path):
        with self.lock:
            if path not in self.hashes:
                if path.is_dir():
                    parts = [f'{p.relative_to(path).as_posix()}={self.digest(p)}' for p in sorted(path.rglob('*'))
                             if p.is_file() and '__pycache__' not in p.parts]
                    self.hashes[path] = hashlib.sha256('\n'.join(parts).encode()).hexdigest()
                else:
                    self.hashes[path] = hashlib.sha256(path.read_bytes()).hexdigest()
            return self.hashes[path]

    def scripts(self, script, seen=None):
        """A Node script and every relative module it imports, transitively."""
        seen = set() if seen is None else seen
        if script in seen or not script.is_file():
            return seen
        seen.add(script)
        for name in IMPORT.findall(script.read_text(encoding='utf-8', errors='replace')):
            self.scripts((script.parent / name).resolve(), seen)
        return seen

    def key(self, command, hack):
        inputs = set()
        words = []
        for part in map(str, command):
            if re.search(r'\.tmp[/\\]gate[/\\]', part):  # a shot prefix: this run's log folder
                words.append(re.sub(r'^.*[/\\]', '.tmp/gate/', part))
                continue
            path = Path(part) if Path(part).is_absolute() else ROOT / part
            if part.endswith(('.mjs', '.js')) and path.is_file():
                inputs |= self.scripts(path.resolve())
            elif path.suffix == '.html' and path.is_file():
                inputs.add(path.resolve())
            if path.exists():
                try:
                    part = path.resolve().relative_to(ROOT.resolve()).as_posix()
                except ValueError:
                    part = path.name
            words.append(part)
        inputs |= {ROOT / name for name in SHARED_INPUTS}
        if hack:
            directory = ROOT / 'hacks' / hack
            inputs |= hack_inputs(directory)
            inputs.add(ROOT / 'dist' / (hack + '.html'))
            inputs |= template_inputs(ROOT / 'template', load(directory / 'hack.json').get('cfg', {}).get('calc'))
        else:
            inputs |= template_inputs(ROOT / 'template')
        lines = [self.env, ' '.join(words)]
        for path in sorted(inputs):
            if path.exists():
                try:
                    name = path.resolve().relative_to(ROOT.resolve()).as_posix()
                except ValueError:
                    name = path.name
                lines.append(f'{name}={self.digest(path.resolve())}')
        return hashlib.sha256('\n'.join(lines).encode()).hexdigest()

    def get(self, key):
        entry = self.dir / (key + '.json')
        return None if self.fresh or not entry.exists() else load(entry)

    def put(self, key, label, seconds):
        (self.dir / (key + '.json')).write_text(json.dumps(dict(label=label, seconds=round(seconds, 1),
            at=datetime.datetime.now().isoformat(timespec='seconds'), root=str(ROOT))) + '\n', encoding='utf-8')


def guides(root):
    return sorted(path.name for path in (root / 'hacks').iterdir()
                  if (path / 'hack.json').is_file() and (path / 'data.json').is_file())


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def counts(data):
    return dict(species=len(data['P']), trainers=sum(len(section['tr'])
                for group in data['TR']['g'] for section in group['sec']),
                items=sum(len(box['r']) for box in data['IT']),
                stops=sum(len(split['st']) for split in data['WK']['splits']))


def browser_idle():
    if os.name == 'nt':
        command = ['powershell', '-NoProfile', '-Command',
                   "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | "
                   'Select-Object -ExpandProperty CommandLine']
    else:
        command = ['ps', '-eo', 'args=']
    processes = subprocess.run(command, capture_output=True, text=True, check=True).stdout
    busy = [line for line in processes.splitlines() if re.search(BROWSER_CHECK, line)]
    if busy:
        raise RuntimeError('another browser check is running: ' + '; '.join(busy))


class Gate:
    def __init__(self, fresh=False):
        self.started = time.monotonic()
        self.failed = 0
        self.total = 0
        self.cached = 0
        self.flaky = []
        self.cache = Cache(fresh)
        stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        self.logs = ROOT / '.tmp' / 'gate' / stamp
        self.logs.mkdir(parents=True)
        self.lock = threading.Lock()

    def result(self, label, passed, detail=''):
        with self.lock:
            self.total += 1
            self.failed += not passed
            line = f'{"PASS" if passed else "FAIL"} {label}: {detail}'
            print(line, flush=True)
            with (self.logs / 'summary.txt').open('a', encoding='utf-8') as output:
                output.write(line + '\n')
        return passed

    def run_browser(self, runs, jobs=7):
        """Browser runs [(label, command, hack)], `jobs` at once after one idle check, slowest kinds first.
        A cached pass is skipped; a run that fails in the pool is rerun alone once (pool load only causes timing
        flakes), and a pass then is reported as a flake."""
        try:
            browser_idle()
        except (OSError, subprocess.SubprocessError, RuntimeError) as error:
            self.result('browser-idle', False, str(error))
            return
        todo = []
        for label, command, hack in runs:
            key = self.cache.key(command, hack)
            hit = self.cache.get(key)
            if hit:
                with self.lock:
                    self.cached += 1
                self.result(label, True, f'cached ({hit["seconds"]}s on {hit["at"]})')
            else:
                todo.append((label, command, key))
        weight = lambda run: 0 if 'domcompare' in str(run[1]) else 1 if 'jumpcheck' in str(run[1]) else 2
        todo.sort(key=weight)
        if jobs > 1 and len(todo) > 1:
            with concurrent.futures.ThreadPoolExecutor(jobs) as pool:
                outcomes = list(pool.map(lambda run: (run, self.run(run[0], run[1], key=run[2], retry=True)), todo))
            again = [run for run, passed in outcomes if passed is None]
        else:
            again = todo
        for label, command, key in again:
            passed = self.run(label, command, key=key)
            if passed and jobs > 1 and len(todo) > 1:
                self.flaky.append(label)

    def run(self, label, command, cwd=ROOT, browser=False, key=None, retry=False):
        """One command; True / False as reported, or None (not reported) when it failed and retry is set."""
        logfile = self.logs / (re.sub(r'[^a-zA-Z0-9_.-]', '-', label) + ('-pool' if retry else '') + '.log')
        started = time.monotonic()
        try:
            if browser:
                browser_idle()
            completed = subprocess.run(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       encoding='utf-8', errors='replace', timeout=1800)
            text = completed.stdout
            logfile.write_text(' '.join(map(str, command)) + '\n' + text, encoding='utf-8')
            diagnostics = bool(re.search(r'(?im)^0 routes|^page errors:|tried \d+, bad [1-9]', text))
            tail = ' | '.join(text.strip().splitlines()[-2:])[-500:]
            if any(str(part).endswith('domcompare.mjs') for part in command):
                tail = ' | '.join(line for line in text.splitlines()
                                  if re.match(r'^\d+ routes|^page errors old:|^differing routes:|^accepted, differs', line)) or tail
            passed = completed.returncode == 0 and not diagnostics
            seconds = time.monotonic() - started
            if not passed and retry:
                print(f'RETRY {label}: failed in the pool after {seconds:.1f}s; rerunning alone at the end; '
                      f'log={logfile.relative_to(ROOT)}', flush=True)
                return None
            if passed and key:
                self.cache.put(key, label, seconds)
            return self.result(label, passed, f'{seconds:.1f}s; {tail}; log={logfile.relative_to(ROOT)}')
        except (OSError, subprocess.SubprocessError, RuntimeError) as error:
            logfile.write_text(str(error), encoding='utf-8')
            if retry:
                return None
            return self.result(label, False, str(error))

    def finish(self):
        if self.flaky:
            print(f'FLAKY (failed in the pool, passed alone): {", ".join(self.flaky)}', flush=True)
        print(f'{"FAIL" if self.failed else "PASS"} gate: {self.total - self.failed}/{self.total} checks '
              f'({self.cached} cached); {time.monotonic() - self.started:.1f}s; logs={self.logs.relative_to(ROOT)}',
              flush=True)
        return int(bool(self.failed))


def baseline(gate, ref, keep=False):
    sha = subprocess.run(['git', 'rev-parse', '--verify', ref + '^{commit}'], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout.strip()
    with tempfile.TemporaryDirectory(prefix='baseline-', dir=ROOT / '.tmp') as temporary:
        stage = Path(temporary)
        archive = stage / 'source.tar'
        subprocess.run(['git', 'archive', '--format=tar', '-o', str(archive), sha], cwd=ROOT, check=True)
        source = stage / 'source'
        source.mkdir()
        with tarfile.open(archive) as snapshot:
            snapshot.extractall(source, filter='data')
        if not gate.run('baseline-assemble', [*PY, 'assemble.py'], cwd=source):
            return
        output = stage / 'output'
        output.mkdir()
        shutil.copytree(source / 'dist', output / 'dist')
        names = guides(source)
        for hack in names:
            destination = output / 'hacks' / hack
            (destination / 'extract').mkdir(parents=True)
            shutil.copyfile(source / 'hacks' / hack / 'data.json', destination / 'data.json')
            report = source / 'hacks' / hack / 'extract' / 'report.txt'
            if report.exists():
                shutil.copyfile(report, destination / 'extract' / 'report.txt')
        hashes = {path.relative_to(output).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
                  for path in output.rglob('*') if path.is_file()}
        (output / 'manifest.json').write_text(json.dumps(dict(ref=ref, sha=sha, keep=keep, guides=names, hashes=hashes,
            created=datetime.datetime.now(datetime.timezone.utc).isoformat()), indent=2) + '\n', encoding='utf-8')
        if BASE.exists():
            if BASE.is_symlink() or BASE.resolve().parent != (ROOT / '.tmp').resolve():
                raise ValueError('baseline path must remain inside this workspace .tmp directory')
            shutil.rmtree(BASE)
        shutil.move(str(output), BASE)
        gate.result('baseline', True, f'{ref} {sha}; {len(names)} guides; git archive; {BASE.relative_to(ROOT)}')


def git_out(*args):
    """A git command's stdout, or None when it fails (an unknown ref, no origin)."""
    done = subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True)
    return done.stdout.strip() if done.returncode == 0 else None


def is_ancestor(older, newer):
    return subprocess.run(['git', 'merge-base', '--is-ancestor', older, newer], cwd=ROOT,
                          capture_output=True).returncode == 0


def expected_baseline():
    """(commit, its name) a check compares with: on main what's published, on a branch where it left main."""
    other = 'origin/main' if git_out('rev-parse', 'HEAD') == git_out('rev-parse', 'main') else 'main'
    return git_out('merge-base', 'HEAD', other), f'merge-base HEAD {other}'


def auto_baseline(gate):
    """No baseline, one outside HEAD's history, or one older than the expected commit (it would flag changes already
    in that commit as this job's): capture the expected commit first. `baseline <ref> --keep` only warns on the last."""
    manifest = BASE / 'manifest.json'
    base, name = expected_baseline()
    why = 'no baseline'
    if manifest.exists():
        kept = load(manifest)
        sha = kept.get('sha', '')
        if not is_ancestor(sha, 'HEAD'):
            why = f'baseline {sha[:12]} is not an ancestor of HEAD'
        elif not base or sha == base or not is_ancestor(sha, base):
            return True
        elif kept.get('keep'):
            print(f'WARNING: kept baseline {sha[:12]} is older than {name} = {base[:12]}: changes between them count '
                  'as this job\'s', flush=True)
            return True
        else:
            why = f'WARNING: baseline {sha[:12]} is older than {name}, replacing it'
    if not base:
        base, name = git_out('merge-base', 'HEAD', 'main'), 'merge-base HEAD main'
    print(f'Auto-baseline: {why}; capturing {name} = {base}', flush=True)
    baseline(gate, base)
    return manifest.exists() and load(manifest).get('sha') == base


def data_check(gate, hack, accepted=(), build=()):
    directory = ROOT / 'hacks' / hack
    baseline_data = BASE / 'hacks' / hack / 'data.json'
    if hack not in REBUILDS:
        gate.result(hack + '-rebuild', False, 'no reproducible command in REBUILDS; add this hack explicitly')
        return
    original = (directory / 'data.json').read_bytes()
    rebuilt = gate.run(hack + '-rebuild', [*PY, '-I', *REBUILDS[hack]])
    if rebuilt:
        current, before = load(directory / 'data.json'), load(baseline_data)
        current.pop('built', None)
        before.pop('built', None)
        if current == before:
            gate.result(hack + '-data', True, 'identical except built')
        else:
            ok, rest = gateaccept.data_diff(before, current, accepted)
            for line in gateaccept.describe(rest):
                print('  not accepted: ' + line, flush=True)
            for line in gateaccept.describe(ok):
                print('  accepted: ' + line, flush=True)
            gate.result(hack + '-data', not rest, (f'differs only under accepted paths ({len(ok)})' if not rest else
                        f'data.json differs from baseline at {len(rest)} path{"s" * (len(rest) != 1)} not accepted: '
                        + ', '.join(sorted(rest)[:8]) + (' ...' if len(rest) > 8 else '')))
        # build accepts (.tmp/accept.json "build": {hack: ["report", "counts.stops"]}): an intended report / count change.
        free = {item.split('.', 1)[1] for item in build if item.startswith('counts.')}
        now, was = counts(current), counts(before)
        same = {k: v for k, v in now.items() if k not in free} == {k: v for k, v in was.items() if k not in free}
        gate.result(hack + '-counts', same, f'current={now} baseline={was}'
                    + (f' (accepted: {", ".join(sorted(free))})' if free and now != was else ''))
        report = directory / 'extract' / 'report.txt'
        old_report = baseline_data.parent / 'extract' / 'report.txt'
        same_report = report.exists() == old_report.exists() and (
            not report.exists() or report.read_bytes() == old_report.read_bytes())
        gate.result(hack + '-report', same_report or 'report' in build,
                    'byte-identical' if same_report else 'report.txt differs' + (' (accepted)' if 'report' in build else ''))
        original_data = json.loads(original)
        original_data.pop('built', None)
        if original_data == current:
            (directory / 'data.json').write_bytes(original)
    gate.run(hack + '-trainer-keys', [*PY, '-I', 'tools/trainer_keys_test.py', hack])
    checker = directory / 'extract' / 'check.py'
    if checker.exists():
        gate.run(hack + '-extract-check', [*PY, '-I', str(checker)])


def lint_check(gate, fix=False):
    """tools/textlint.py over the repo's text, first in check / scenarios: False (and every hit listed) on a problem."""
    started = time.monotonic()
    hits = []
    left = textlint.lint(fix=fix, out=hits.append)
    for line in hits:
        print('  ' + line, flush=True)
    return gate.result('lint', not left, f'{time.monotonic() - started:.1f}s; ' + (
        'clean' if not left else f'{left} problem{"s" * (left != 1)} (above; CRLF / BOM: gate.py lint --fix)'))


def compat_check(gate):
    """tools/compatlint.py: no CSS / JS the Thor's WebView (Chrome 109) lacks in what a guide ships."""
    started = time.monotonic()
    hits = []
    left = compatlint.lint(out=hits.append)
    for line in hits:
        print('  ' + line, flush=True)
    return gate.result('compat', not left, f'{time.monotonic() - started:.1f}s; ' + (
        'clean' if not left else f'{left} problem{"s" * (left != 1)} (above; the Thor WebView is {compatlint.FLOOR})'))


def stale_inputs(hack):
    """What dist/<hack>.html is older than (assemble.py's inputs), or ['no build']."""
    built = ROOT / 'dist' / (hack + '.html')
    if not built.exists():
        return ['no build']
    since = built.stat().st_mtime
    inputs = [ROOT / 'assemble.py', ROOT / 'sprites' / 'index.json',
              *[ROOT / 'hacks' / hack / name for name in ('data.json', 'hack.json', 'sprites.json', 'calc_effects.json')],
              *(path for path in (ROOT / 'template').rglob('*') if path.is_file() and '__pycache__' not in path.parts)]
    return [path.relative_to(ROOT).as_posix() for path in inputs if path.exists() and path.stat().st_mtime > since]


def fresh_builds(gate, names):
    """Reassemble every guide whose dist is older than its inputs, before browser checks run on it."""
    stale = {hack: stale_inputs(hack) for hack in names}
    stale = {hack: newer for hack, newer in stale.items() if newer}
    if not stale:
        return True
    for hack, newer in stale.items():
        print(f'Build freshness: dist/{hack}.html is older than {", ".join(newer[:4])}'
              f'{f" (+{len(newer) - 4})" if len(newer) > 4 else ""}; reassembling', flush=True)
    return gate.run('assemble-stale', [*PY, 'assemble.py', *sorted(stale)])


def scenario_runs(names, only=None):
    """Every tools/scenarios/*.mjs (or the `only` stems) on each guide's dist: [(label, command, hack)]."""
    scenarios = sorted((ROOT / 'tools' / 'scenarios').glob('*.mjs'))
    if only:
        missing = set(only) - {scenario.stem for scenario in scenarios}
        if missing:
            raise ValueError('no such scenario: ' + ', '.join(sorted(missing)))
        scenarios = [scenario for scenario in scenarios if scenario.stem in only]
    return [(hack + '-scenario-' + scenario.stem, ['node', str(scenario), str(ROOT / 'dist' / (hack + '.html'))], hack)
            for scenario in scenarios for hack in names]


def template_check(gate, names, jobs=7, routes_ok=None):
    if not gate.run('assemble', [*PY, 'assemble.py']):
        return
    runs = []
    for hack in names:
        old = str(BASE / 'dist' / (hack + '.html'))
        new = str(ROOT / 'dist' / (hack + '.html'))
        accept = (routes_ok or {}).get(hack)
        accept = ['--accept-routes=' + ','.join(accept)] if accept else []
        for mode in ([], ['--kb']):
            runs.append((hack + '-dom' + ('-kb' if mode else ''),
                         ['node', 'tools/domcompare.mjs', old, new, '--jobs=2', *mode, *accept], hack))
        runs.append((hack + '-consistency', ['node', 'tools/consistency-check.mjs', hack], hack))
        gate.run(hack + '-tabs', [*PY, '-I', 'tools/tabs_check.py', hack])
        stops = [stop for split in load(ROOT / 'hacks' / hack / 'data.json')['WK']['splits'] for stop in split['st']]
        if stops and all('k' in stop for stop in stops):
            runs.append((hack + '-walk-state', ['node', 'tools/walk-state-check.mjs', old, new, '0.0'], hack))
        guide = str(ROOT / 'dist' / (hack + '.html'))
        for mode in ([], ['kb']):
            suffix = '-kb' if mode else ''
            for check in ('jumpcheck', 'zoomcheck'):
                runs.append((hack + '-' + check + suffix, ['node', f'tools/mockup/{check}.mjs', guide] + mode, hack))
    gate.run_browser(runs + scenario_runs(names), jobs)


def utf8_stdio():
    """stdout / stderr in UTF-8: a guide name, species (Nidoran♂) or log tail never fails a print."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8', errors='replace')


def main():
    utf8_stdio()
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    capture = commands.add_parser('baseline')
    capture.add_argument('ref', nargs='?', default='main')
    capture.add_argument('--keep', action='store_true', help='check warns instead of replacing it once it is out of date')
    check = commands.add_parser('check')
    check.add_argument('hacks', nargs='*')
    check.add_argument('--data', action='store_true')
    check.add_argument('--template', action='store_true')
    check.add_argument('--jobs', type=int, default=7, help='browser checks at once (default 7; 1: serial)')
    check.add_argument('--fresh', action='store_true', help='ignore cached passes (still records new ones)')
    check.add_argument('--accept-data', action='append', metavar='SPEC',
                       help='data paths that may differ, [hack:]path,... (tools/gateaccept.py; plus .tmp/accept.json)')
    check.add_argument('--accept-routes', action='append', metavar='SPEC',
                       help='routes whose DOM may differ, [hack:]glob,... e.g. #/calc (plus .tmp/accept.json)')
    scenarios = commands.add_parser('scenarios')
    scenarios.add_argument('hacks', nargs='*')
    scenarios.add_argument('--only', type=lambda text: [part for part in text.split(',') if part])
    scenarios.add_argument('--jobs', type=int, default=7, help='runs at once (default 7; 1: serial)')
    scenarios.add_argument('--fresh', action='store_true', help='ignore cached passes (still records new ones)')
    tidy = commands.add_parser('lint', help='text hygiene only (tools/textlint.py); also first in check / scenarios')
    tidy.add_argument('--fix', action='store_true', help='CRLF to LF and drop BOMs (control bytes: by hand)')
    args = parser.parse_args()
    gate = Gate(getattr(args, 'fresh', False))
    try:
        if args.command == 'baseline':
            baseline(gate, args.ref, args.keep)
        elif args.command == 'lint':
            lint_check(gate, args.fix)
            compat_check(gate)
        elif not lint_check(gate):
            print('Text hygiene first: fix the lines above, then rerun.', flush=True)
        elif not compat_check(gate):
            print('Browser floor first: the Thor WebView is ' + compatlint.FLOOR + '; rewrite the lines above, then rerun.', flush=True)
        elif args.command == 'scenarios':
            names = args.hacks or guides(ROOT)
            unknown = [hack for hack in names if hack not in guides(ROOT)]
            if unknown:
                raise ValueError('no built guide: ' + ', '.join(unknown))
            runs = scenario_runs(names, args.only)
            if fresh_builds(gate, names):
                gate.run_browser(runs, args.jobs)
        elif auto_baseline(gate):
            manifest = load(BASE / 'manifest.json')
            names = args.hacks or guides(ROOT)
            if not names:
                raise ValueError('no built guides')
            for hack in names:
                if hack not in guides(ROOT) or hack not in manifest['guides']:
                    raise ValueError(f'{hack}: no built guide or baseline; run baseline after adding a guide')
            for name, digest in manifest['hashes'].items():
                if hashlib.sha256((BASE / name).read_bytes()).hexdigest() != digest:
                    raise ValueError(f'baseline changed: {name}; recapture it explicitly')
            print(f'Baseline: {manifest["ref"]} {manifest["sha"]}', flush=True)
            data_ok = gateaccept.accepts('data', args.accept_data, names)
            routes_ok = gateaccept.accepts('routes', args.accept_routes, names)
            build_ok = gateaccept.accepts('build', [], names)
            for kind, table in (('data', data_ok), ('routes', routes_ok), ('build', build_ok)):
                for hack in names:
                    if table.get(hack):
                        print(f'Accepting {kind} on {hack}: {", ".join(table[hack])}', flush=True)
            if args.data or not args.template:
                for hack in names:
                    data_check(gate, hack, data_ok.get(hack, []), build_ok.get(hack, []))
            if args.template or not args.data:
                template_check(gate, names, args.jobs, routes_ok)
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        gate.result('gate-setup', False, str(error))
    return gate.finish()


if __name__ == '__main__':
    sys.exit(main())

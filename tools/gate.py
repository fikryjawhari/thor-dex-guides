"""Reproducible data and browser gates; baseline [ref], check [hack ...] or scenarios [hack ...].

Baselines use git archive: only committed files reach the build, no checkout or
Git worktree registration changes, and no raw sources are needed.
Browser checks run one at a time, except the scenario x guide runs with --jobs N
(N processes at once, each its own browser; the default 1 is serial).
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
BASE = ROOT / '.tmp' / 'baseline'
REBUILDS = {
    'blaze-black-2-redux': ['hacks/blaze-black-2-redux/extract/build.py'],
    'eternal-x': ['hacks/eternal-x/extract/build.py'],
    'photonic-sun': ['hacks/photonic-sun/extract/build.py'],
    'hardlove-gold': ['hacks/hardlove-gold/extract/build.py'],
    'emerald-imperium': ['tools/itemstd.py', 'emerald-imperium'],
}
BROWSER_CHECK = r'(domcompare|consistency-check|walk-state-check|pagecheck|walkcheck|jumpcheck|zoomcheck|scenarios[/\\][^ ]+)\.mjs'


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
    def __init__(self):
        self.started = time.monotonic()
        self.failed = 0
        self.total = 0
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

    def run_browser(self, runs, jobs=1):
        """Browser runs [(label, command)]: one at a time, or `jobs` at once after one idle check."""
        if jobs <= 1:
            for label, command in runs:
                self.run(label, command, browser=True)
            return
        try:
            browser_idle()
        except (OSError, subprocess.SubprocessError, RuntimeError) as error:
            self.result('browser-idle', False, str(error))
            return
        with concurrent.futures.ThreadPoolExecutor(jobs) as pool:
            list(pool.map(lambda run: self.run(*run), runs))

    def run(self, label, command, cwd=ROOT, browser=False):
        logfile = self.logs / (re.sub(r'[^a-zA-Z0-9_.-]', '-', label) + '.log')
        started = time.monotonic()
        try:
            if browser:
                browser_idle()
            completed = subprocess.run(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       encoding='utf-8', errors='replace', timeout=1800)
            text = completed.stdout
            logfile.write_text(' '.join(map(str, command)) + '\n' + text, encoding='utf-8')
            diagnostics = bool(re.search(r'(?im)^0 routes|^page errors:|^ERRS (?!none)|RJ WRONG|tried \d+, bad [1-9]', text))
            tail = ' | '.join(text.strip().splitlines()[-2:])[-500:]
            if any(str(part).endswith('domcompare.mjs') for part in command):
                tail = ' | '.join(line for line in text.splitlines()
                                  if re.match(r'^\d+ routes|^page errors old:|^differing routes:', line)) or tail
            return self.result(label, completed.returncode == 0 and not diagnostics,
                               f'{time.monotonic() - started:.1f}s; {tail}; log={logfile.relative_to(ROOT)}')
        except (OSError, subprocess.SubprocessError, RuntimeError) as error:
            logfile.write_text(str(error), encoding='utf-8')
            return self.result(label, False, str(error))

    def finish(self):
        print(f'{"FAIL" if self.failed else "PASS"} gate: {self.total - self.failed}/{self.total} checks; '
              f'{time.monotonic() - self.started:.1f}s; logs={self.logs.relative_to(ROOT)}', flush=True)
        return int(bool(self.failed))


def baseline(gate, ref):
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
        if not gate.run('baseline-assemble', [sys.executable, 'assemble.py'], cwd=source):
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
        (output / 'manifest.json').write_text(json.dumps(dict(ref=ref, sha=sha, guides=names, hashes=hashes,
            created=datetime.datetime.now(datetime.timezone.utc).isoformat()), indent=2) + '\n', encoding='utf-8')
        if BASE.exists():
            if BASE.is_symlink() or BASE.resolve().parent != (ROOT / '.tmp').resolve():
                raise ValueError('baseline path must remain inside this workspace .tmp directory')
            shutil.rmtree(BASE)
        shutil.move(str(output), BASE)
        gate.result('baseline', True, f'{ref} {sha}; {len(names)} guides; git archive; {BASE.relative_to(ROOT)}')


def data_check(gate, hack):
    directory = ROOT / 'hacks' / hack
    baseline_data = BASE / 'hacks' / hack / 'data.json'
    if hack not in REBUILDS:
        gate.result(hack + '-rebuild', False, 'no reproducible command in REBUILDS; add this hack explicitly')
        return
    original = (directory / 'data.json').read_bytes()
    rebuilt = gate.run(hack + '-rebuild', [sys.executable, '-I', *REBUILDS[hack]])
    if rebuilt:
        current, before = load(directory / 'data.json'), load(baseline_data)
        current.pop('built', None)
        before.pop('built', None)
        same = current == before
        gate.result(hack + '-data', same, 'identical except built' if same else 'data.json differs from baseline')
        gate.result(hack + '-counts', counts(current) == counts(before),
                    f'current={counts(current)} baseline={counts(before)}')
        report = directory / 'extract' / 'report.txt'
        old_report = baseline_data.parent / 'extract' / 'report.txt'
        same_report = report.exists() == old_report.exists() and (
            not report.exists() or report.read_bytes() == old_report.read_bytes())
        gate.result(hack + '-report', same_report, 'byte-identical' if same_report else 'report.txt differs')
        original_data = json.loads(original)
        original_data.pop('built', None)
        if original_data == current:
            (directory / 'data.json').write_bytes(original)
    gate.run(hack + '-trainer-keys', [sys.executable, '-I', 'tools/trainer_keys_test.py', hack])
    checker = directory / 'extract' / 'check.py'
    if checker.exists():
        gate.run(hack + '-extract-check', [sys.executable, '-I', str(checker)])


def scenario_runs(names, only=None):
    """Every tools/scenarios/*.mjs (or the `only` stems) on each guide's dist."""
    scenarios = sorted((ROOT / 'tools' / 'scenarios').glob('*.mjs'))
    if only:
        missing = set(only) - {scenario.stem for scenario in scenarios}
        if missing:
            raise ValueError('no such scenario: ' + ', '.join(sorted(missing)))
        scenarios = [scenario for scenario in scenarios if scenario.stem in only]
    return [(hack + '-scenario-' + scenario.stem, ['node', str(scenario), str(ROOT / 'dist' / (hack + '.html'))])
            for scenario in scenarios for hack in names]


def template_check(gate, names, jobs=1):
    if not gate.run('assemble', [sys.executable, 'assemble.py']):
        return
    for hack in names:
        old = str(BASE / 'dist' / (hack + '.html'))
        new = str(ROOT / 'dist' / (hack + '.html'))
        for mode in ([], ['--kb']):
            gate.run(hack + '-dom' + ('-kb' if mode else ''),
                     ['node', 'tools/domcompare.mjs', old, new, '--jobs=4', *mode], browser=True)
        gate.run(hack + '-consistency', ['node', 'tools/consistency-check.mjs', hack], browser=True)
        gate.run(hack + '-tabs', [sys.executable, '-I', 'tools/tabs_check.py', hack])
        stops = [stop for split in load(ROOT / 'hacks' / hack / 'data.json')['WK']['splits'] for stop in split['st']]
        if stops and all('k' in stop for stop in stops):
            gate.run(hack + '-walk-state', ['node', 'tools/walk-state-check.mjs', old, new, '0.0'], browser=True)
    sample = 'emerald-imperium' if 'emerald-imperium' in names else names[0]
    guide = str(ROOT / 'dist' / (sample + '.html'))
    for mode in ([], ['kb']):
        suffix = '-kb' if mode else ''
        for check in ('pagecheck', 'walkcheck', 'jumpcheck', 'zoomcheck'):
            command = ['node', f'tools/mockup/{check}.mjs', guide]
            if check in ('pagecheck', 'walkcheck'):
                command.append(str(gate.logs / (check + suffix)))
            gate.run(sample + '-' + check + suffix, command + mode, browser=True)
    gate.run_browser(scenario_runs(names), jobs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    capture = commands.add_parser('baseline')
    capture.add_argument('ref', nargs='?', default='main')
    check = commands.add_parser('check')
    check.add_argument('hacks', nargs='*')
    check.add_argument('--data', action='store_true')
    check.add_argument('--template', action='store_true')
    check.add_argument('--jobs', type=int, default=1, help='scenario runs at once (default 1: serial)')
    scenarios = commands.add_parser('scenarios')
    scenarios.add_argument('hacks', nargs='*')
    scenarios.add_argument('--only', type=lambda text: [part for part in text.split(',') if part])
    scenarios.add_argument('--jobs', type=int, default=1, help='runs at once (default 1: serial)')
    args = parser.parse_args()
    gate = Gate()
    try:
        if args.command == 'baseline':
            baseline(gate, args.ref)
        elif args.command == 'scenarios':
            names = args.hacks or guides(ROOT)
            unknown = [hack for hack in names if hack not in guides(ROOT)]
            if unknown:
                raise ValueError('no built guide: ' + ', '.join(unknown))
            gate.run_browser(scenario_runs(names, args.only), args.jobs)
        else:
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
            if args.data or not args.template:
                for hack in names:
                    data_check(gate, hack)
            if args.template or not args.data:
                template_check(gate, names, args.jobs)
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        gate.result('gate-setup', False, str(error))
    return gate.finish()


if __name__ == '__main__':
    sys.exit(main())

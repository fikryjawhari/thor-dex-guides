"""Claim a worktree, link source inputs from the main checkout and .claude/skills to .agents/skills, and uv sync."""
import argparse
import datetime
import json
import os
from pathlib import Path
import socket
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('hacks', nargs='*', help='default: every guide with data.json')
    parser.add_argument('--session', help='stable session name; default: hostname/branch')
    parser.add_argument('--release', action='store_true', help='remove only this session claim; no sync or links')
    args = parser.parse_args()
    branch = git('branch', '--show-current') or git('rev-parse', '--short', 'HEAD')
    session = args.session or socket.gethostname() + '/' + branch
    claim = ROOT / '.claude' / 'claim'
    legacy = ROOT / '.codex' / 'claim'
    if legacy.exists():
        raise ValueError(f'worktree held by {legacy}: {legacy.read_text(encoding="utf-8")}')
    if claim.exists():
        try:
            owner = json.loads(claim.read_text(encoding='utf-8'))
        except ValueError:
            raise ValueError(f'worktree held by {claim}: {claim.read_text(encoding="utf-8")}') from None
        if owner.get('session') != session or owner.get('branch') != branch:
            raise ValueError(f'worktree held by {owner}; do not overwrite or release another claim')
    if args.release:
        claim.unlink(missing_ok=True)
        print(f'Released {session}: {ROOT}')
        return
    common = Path(git('rev-parse', '--path-format=absolute', '--git-common-dir'))
    main_root = common.parent
    worktrees = [line[9:] for line in git('worktree', 'list', '--porcelain').splitlines() if line.startswith('worktree ')]
    if main_root.resolve() not in [Path(path).resolve() for path in worktrees]:
        raise ValueError('main checkout not found in git worktree list; bare repositories are unsupported')
    if main_root.resolve() == ROOT:
        raise ValueError('run setup in a worker worktree, not the main checkout')
    names = args.hacks or sorted(path.name for path in (ROOT / 'hacks').iterdir() if (path / 'data.json').is_file())
    links = []
    for hack in names:
        if hack not in [path.name for path in (ROOT / 'hacks').iterdir() if path.is_dir()]:
            raise ValueError(f'unknown hack: {hack}')
        source = main_root / 'hacks' / hack / '.src'
        target = ROOT / 'hacks' / hack / '.src'
        if not source.is_dir():
            raise ValueError(f'missing source directory: {source}')
        if os.path.lexists(target):
            if target.resolve() != source.resolve():
                raise ValueError(f'{target} already exists and is not linked to {source}; leave it intact')
        else:
            links.append((target, source))
    claim.parent.mkdir(exist_ok=True)
    if not claim.exists():
        with claim.open('x', encoding='utf-8') as output:
            json.dump(dict(provider='worker', session=session, branch=branch,
                           start=datetime.datetime.now(datetime.timezone.utc).isoformat()), output)
            output.write('\n')
    for target, source in links:
        if os.name == 'nt':
            subprocess.run(['cmd', '/d', '/c', 'mklink', '/J', str(target), str(source)], check=True)
        else:
            target.symlink_to(source, target_is_directory=True)
        print(f'Linked {target} -> {source}')
    # Claude Code reads project skills from .claude/skills (git-ignored); the versioned ones are in .agents/skills
    skills, versioned = ROOT / '.claude' / 'skills', ROOT / '.agents' / 'skills'
    if not os.path.lexists(skills):
        if os.name == 'nt':
            subprocess.run(['cmd', '/d', '/c', 'mklink', '/J', str(skills), str(versioned)], check=True)
        else:
            skills.symlink_to(Path('..') / '.agents' / 'skills', target_is_directory=True)
        print(f'Linked {skills} -> {versioned}')
    subprocess.run(['uv', 'sync'], cwd=ROOT, check=True)
    print(f'Ready: {session}; {branch}; {ROOT}')
    print('Source junctions are shared inputs: read only; generated caches may be written by existing extracts.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        print(f'FAIL setup: {error}', file=sys.stderr)
        sys.exit(1)

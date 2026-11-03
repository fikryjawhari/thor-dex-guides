"""Text hygiene: CRLF, C0 control bytes (other than tab and newline), a UTF-8 BOM and invalid UTF-8 in the repo's text.

    uv run python -X utf8 -I tools/textlint.py [--fix] [path ...]     (also: tools/gate.py lint [--fix])

Scope: tracked plus untracked-not-ignored files under tools/, template/, hacks/*/ (never .src), assemble.py and every
*.md. Binaries are skipped by extension and by git's `binary` / `-text` attribute.
--fix rewrites CRLF to LF and drops a BOM; control bytes and invalid UTF-8 are only reported (a raw control byte in a
JS / Python string is usually a typo for an escape: fix it by hand).
"""
import argparse
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SCOPE = ['tools', 'template', 'hacks', 'assemble.py', '*.md']
BINARY = {'.png', '.gif', '.jpg', '.jpeg', '.webp', '.ico', '.bmp', '.sav', '.srm', '.dsv', '.bin', '.dat', '.lz',
          '.nds', '.gba', '.gbc', '.3ds', '.cia', '.narc', '.garc', '.xlsx', '.xls', '.pdf', '.zip', '.gz', '.7z',
          '.tar', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.ogg', '.wav', '.pyc', '.exe', '.dll', '.so'}
CONTROL = re.compile(rb'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|\r(?!\n)')
BOM = b'\xef\xbb\xbf'


def problems(data):
    """[(line, kind, fixable)] for one file's bytes."""
    found = []
    line = lambda offset: data.count(b'\n', 0, offset) + 1
    if data.startswith(BOM):
        found.append((1, 'UTF-8 BOM', True))
    crlf = data.find(b'\r\n')
    if crlf >= 0:
        found.append((line(crlf), f'CRLF line endings ({data.count(b"\r\n")} lines)', True))
    for match in CONTROL.finditer(data):
        byte = match.group()[0]
        name = 'NUL' if byte == 0 else 'lone CR' if byte == 13 else 'DEL' if byte == 127 else f'control byte 0x{byte:02x}'
        found.append((line(match.start()), name, False))
    try:
        data.decode('utf-8')
    except UnicodeDecodeError as error:
        found.append((line(error.start), f'invalid UTF-8 ({error.reason})', False))
    return found


def fixed(data):
    if data.startswith(BOM):
        data = data[len(BOM):]
    return data.replace(b'\r\n', b'\n')


def files(paths=None):
    """The text files in scope (relative POSIX paths), or `paths` filtered the same way."""
    listed = subprocess.run(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--',
                             *(paths or SCOPE)], cwd=ROOT, capture_output=True, check=True).stdout
    names = sorted({name for name in listed.decode('utf-8').split('\0') if name})
    names = [name for name in names if '/.src/' not in name and Path(name).suffix.lower() not in BINARY
             and (ROOT / name).is_file() and (paths or not name.startswith('hacks/') or name.count('/') >= 2)]
    if not names:
        return []
    attrs = subprocess.run(['git', 'check-attr', '-z', '--stdin', 'binary', 'text'], cwd=ROOT, capture_output=True,
                           input='\0'.join(names).encode('utf-8'), check=True).stdout.decode('utf-8').split('\0')
    binary = set()
    for index in range(0, len(attrs) - 2, 3):
        name, attr, value = attrs[index:index + 3]
        if (attr == 'binary' and value == 'set') or (attr == 'text' and value == 'unset'):
            binary.add(name)
    return [name for name in names if name not in binary]


def lint(paths=None, fix=False, out=print):
    """Report every problem as `path:line: kind`; with fix, rewrite the fixable ones. Returns the count left."""
    left = 0
    for name in files(paths):
        path = ROOT / name
        data = path.read_bytes()
        found = problems(data)
        if not found:
            continue
        if fix and any(fixable for _, _, fixable in found):
            data = fixed(data)
            path.write_bytes(data)
            out(f'fixed {name}: ' + ', '.join(kind for _, kind, fixable in found if fixable))
            found = problems(data)
        for number, kind, _ in found:
            out(f'{name}:{number}: {kind}')
            left += 1
    return left


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('paths', nargs='*', help='default: the whole scope')
    parser.add_argument('--fix', action='store_true', help='CRLF to LF, drop a BOM (control bytes: by hand)')
    args = parser.parse_args(argv)
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8', errors='replace')
    left = lint(args.paths, args.fix)
    print(f'{"FAIL" if left else "PASS"} lint: {left} problem{"" if left == 1 else "s"}')
    return int(bool(left))


if __name__ == '__main__':
    sys.exit(main())

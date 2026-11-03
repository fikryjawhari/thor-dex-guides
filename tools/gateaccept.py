"""A job's intended changes, declared up front for tools/gate.py: data paths that may differ from the baseline and
routes whose DOM may differ.

Spec (the --accept-data / --accept-routes flags; either may be given more than once): a comma list of items, each
`path` (every guide) or `hack:path` (that guide only).
  data path   keys joined by `.`, `[]` for any list index: `TR.g[].sec[].tr[].gc`, `MV[].aiEffect`. `*` stands for
              any one key. A path also accepts everything under it (`MV[]` accepts any change to a move).
  route glob  `#/calc`, `#/tr/*` (`*`: any characters), matched against the whole route.
File: `.tmp/accept.json` in the checkout the gate runs in, read on every check and merged with the flags:
  {"data": {"*": ["MV[].aiEffect"], "hardlove-gold": ["TR.g[].sec[].tr[].gc"]}, "routes": {"*": ["#/calc"]}}
  (a value may also be one comma string). It's under .tmp/ so it never reaches a commit or outlives the job: the
  parent writes it for the job's merge and deletes it after.
The data check ignores the top-level `built` stamp always.
"""
import collections
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / '.tmp' / 'accept.json'
INDEX = re.compile(r'\[\d+\]')


def parse(specs, hacks):
    """{hack: [items]} from spec strings; an item without `hack:` goes to every hack in `hacks`."""
    out = collections.defaultdict(list)
    for spec in specs or []:
        for item in (part.strip() for part in spec.split(',')):
            if not item:
                continue
            hack, colon, rest = item.partition(':')
            if colon and not item.startswith('#') and re.fullmatch(r'[a-z0-9-]+', hack):
                if not (ROOT / 'hacks' / hack / 'hack.json').is_file():
                    raise ValueError(f'accept spec {item!r}: no guide {hack!r}')
                if hack in hacks:
                    out[hack].append(rest)
            else:
                for name in hacks:
                    out[name].append(item)
    return out


def from_file(kind, hacks, path=FILE):
    """The file's `kind` ("data" / "routes") as spec strings for parse()."""
    if not path.exists():
        return []
    table = json.loads(path.read_text(encoding='utf-8')).get(kind, {})
    specs = []
    for hack, items in table.items():
        items = items.split(',') if isinstance(items, str) else items
        specs.extend(item if hack == '*' else f'{hack}:{item}' for item in items)
    return specs


def accepts(kind, flags, hacks, path=FILE):
    """{hack: [items]} from the flags plus the accept file."""
    return parse(list(flags or []) + from_file(kind, hacks, path), hacks)


def walk(old, new, path=''):
    """Every difference between two JSON values: [(path, 'added' / 'removed' / 'changed')], paths like a.b[3].c."""
    if isinstance(old, dict) and isinstance(new, dict):
        out = []
        for key in list(old) + [key for key in new if key not in old]:
            child = f'{path}.{key}' if path else str(key)
            if key not in new:
                out.append((child, 'removed'))
            elif key not in old:
                out.append((child, 'added'))
            else:
                out.extend(walk(old[key], new[key], child))
        return out
    if isinstance(old, list) and isinstance(new, list):
        out = []
        for index in range(max(len(old), len(new))):
            child = f'{path}[{index}]'
            if index >= len(new):
                out.append((child, 'removed'))
            elif index >= len(old):
                out.append((child, 'added'))
            else:
                out.extend(walk(old[index], new[index], child))
        return out
    return [] if old == new and type(old) is type(new) else [(path, 'changed')]


def shape(path):
    """A concrete path's pattern form: indexes dropped (TR.g[3].tr[0].gc -> TR.g[].tr[].gc)."""
    return INDEX.sub('[]', path)


def _segments(path):
    return re.findall(r'\[\]|[^.\[\]]+', path)


def covered(path, accepted):
    """Is a concrete difference path at or under one of the accepted pattern paths?"""
    parts = _segments(shape(path))
    for pattern in accepted:
        want = _segments(pattern)
        if len(want) <= len(parts) and all(w == p or (w == '*' and p != '[]') for w, p in zip(want, parts)):
            return True
    return False


def data_diff(old, new, accepted=()):
    """(accepted, rest): differences grouped by pattern path -> {kind: count, 'e.g.': first concrete path}.
    The top-level `built` stamp is never a difference."""
    old = {key: value for key, value in old.items() if key != 'built'} if isinstance(old, dict) else old
    new = {key: value for key, value in new.items() if key != 'built'} if isinstance(new, dict) else new
    groups = ({}, {})
    for path, kind in walk(old, new):
        group = groups[0 if covered(path, accepted) else 1].setdefault(shape(path), {'e.g.': path})
        group[kind] = group.get(kind, 0) + 1
    return groups


def describe(groups, limit=40):
    """One line per pattern path: `TR.g[].sec[].tr[].gc: 120 added (e.g. TR.g[0].sec[2].tr[1].gc)`."""
    lines = []
    for pattern, group in sorted(groups.items()):
        kinds = ', '.join(f'{count} {kind}' for kind, count in group.items() if kind != 'e.g.')
        lines.append(f'{pattern}: {kinds} (e.g. {group["e.g."]})')
    return lines[:limit] + ([f'... {len(lines) - limit} more paths'] if len(lines) > limit else [])

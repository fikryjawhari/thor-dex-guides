"""Read and write a hack's data.json in its own layout: one line per entry for the lists written that way (M, MV, AB,
P, LOC, AR), everything else on one line. save() writes the same bytes load() read when nothing changed; write() makes
a fresh file in that layout (every hack's build.py)."""
import json

LINES = ('M', 'MV', 'AB', 'P', 'LOC', 'AR')    # the lists written one entry per line

def _j(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))

def load(path):
    s = open(path, encoding='utf8').read()
    return json.loads(s), s

def save(path, D, like):
    out = [_j(k) + ':[\n' + ',\n'.join(_j(x) for x in v) + '\n]' if isinstance(v, list) and f'{_j(k)}:[\n' in like
           else _j(k) + ':' + _j(v) for k, v in D.items()]
    open(path, 'w', encoding='utf8', newline='\n').write('{\n' + ',\n'.join(out) + '\n}' + like[len(like.rstrip()):])

def write(path, D, lines=LINES):
    parts = [_j(k) + ':[\n' + ',\n'.join(_j(x) for x in v) + '\n]' if k in lines else _j(k) + ':' + _j(v)
             for k, v in D.items() if not k.startswith('_')]
    open(path, 'w', encoding='utf8', newline='\n').write('{\n' + ',\n'.join(parts) + '\n}\n')


# hack.json: the same keys in the same order in every hack (the values are the hack's own).
HACK_ORDER = {
    'top': ['id', 'title', 'game', 'platform', 'version', 'cfg'],
    'cfg': ['name', 'orig', 'evs', 'starter', 'orbs', 'g3trainer', 'capLast', 'walkAreaNote', 'trw', 'ls', 'txt'],
    'ls': ['dex', 'calc', 'track', 'walk', 'cap', 'tr', 'recent', 'pos', 'mgm', 'loc', 'items', 'capset'],
    'txt': ['obt', 'nw', 'g3', 'conf', 'tc', 'chdoc', 'mvh', 'nodc', 'mvsrc', 'mvsrcx', 'absrc', 'ns', 'walk', 'capl',
            'capnone', 'noev', 'plm', 'plf'],
}


def _ordered(obj, kind):
    extra = [k for k in obj if k not in HACK_ORDER[kind]]
    if extra:
        raise KeyError(f'hack.json {kind}: key(s) {extra} are not in datajson.HACK_ORDER (the template reads none of them, '
                       'or add them there and in assemble.py / dex.js)')
    return {k: obj[k] for k in HACK_ORDER[kind] if k in obj}


def write_hack(path):
    """Rewrite a hack.json in the canonical key order and formatting (one space indent, UTF-8, final newline)."""
    h = json.load(open(path, encoding='utf8'))
    h['cfg']['ls'] = _ordered(h['cfg']['ls'], 'ls')
    h['cfg']['txt'] = _ordered(h['cfg']['txt'], 'txt')
    h['cfg'] = _ordered(h['cfg'], 'cfg')
    h = _ordered(h, 'top')
    open(path, 'w', encoding='utf8', newline='\n').write(json.dumps(h, ensure_ascii=False, indent=1) + '\n')


if __name__ == '__main__':      # python -I tools/datajson.py hacks/<hack>/hack.json ...
    import sys
    for arg in sys.argv[1:]:
        write_hack(arg)

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

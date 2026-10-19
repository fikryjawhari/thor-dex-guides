"""Read and write a hack's data.json in its own layout: one line per entry for the lists written that way (M, MV, AB,
P, LOC, AR), everything else on one line. save() writes the same bytes load() read when nothing changed."""
import json

def _j(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))

def load(path):
    s = open(path, encoding='utf8').read()
    return json.loads(s), s

def save(path, D, like):
    out = [_j(k) + ':[\n' + ',\n'.join(_j(x) for x in v) + '\n]' if isinstance(v, list) and f'{_j(k)}:[\n' in like
           else _j(k) + ':' + _j(v) for k, v in D.items()]
    open(path, 'w', encoding='utf8', newline='\n').write('{\n' + ',\n'.join(out) + '\n}' + like[len(like.rstrip()):])

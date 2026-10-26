"""Build the auto-effects mockup: sample Hardlove data into mock.src.html -> mock.html, then wrap it in the Thor frame.
python -I plans/calc-auto-effects-mockup/build.py   (writes dist/calc-auto-mock.html)"""
import json, subprocess, sys
from pathlib import Path
here = Path(__file__).resolve().parent
root = here.parents[1]
d = json.loads((root / 'hacks/hardlove-gold/data.json').read_text(encoding='utf8'))
P = {p['id']: p for p in d['P']}
AB = lambda n: d['AB'].index(next(a for a in d['AB'] if a[0] == n))
def mon(i, lv, item, ab, moves):
    p = P[i]
    return {'id': i, 'n': p['n'], 't': p['t'], 's': p['s'], 'l': lv, 'i': item, 'a': ab, 'm': moves}
mine = [mon('growlithe', 18, 'Sitrus Berry', 'Intimidate', ['Flame Wheel', 'Bite']),
        mon('hippopotas', 18, 'Weakness Policy', 'Sand Stream', ['Bulldoze', 'Bite']),
        mon('timburr', 18, 'Flame Orb', 'Guts', ['Karate Chop', 'Rock Tomb']),
        mon('dwebble', 18, '', 'Sturdy', ['Rock Tomb', 'Bug Bite']),
        mon('torchic', 18, 'Focus Sash', 'Speed Boost', ['Ember', 'Quick Attack'])]
trainers = []
for g in d['TR']['g']:
    for s in g['sec']:
        for t in s['tr']:
            if (t['n'], t.get('loc')) in (('Hiker Anthony', 'Route 33'), ('Hiker Daniel', 'Union Cave')):
                trainers.append({'n': t['n'], 'loc': t['loc'],
                                 'field': [e for f in t.get('field', []) for e in f['effects']],
                                 'p': [mon(p['id'], p['l'], p['i'], d['AB'][p['a']][0], [d['M'][m] for m in p['m']]) for p in t['p']]})
trainers.sort(key=lambda t: t['loc'] != 'Route 33')
moves = {m: {k: d['MV'][d['M'].index(m)][k] for k in ('t', 'c', 'bp')}
         for x in mine + [p for t in trainers for p in t['p']] for m in x['m']}
data = {'mine': mine, 'tr': trainers, 'mv': moves, 'tc': d['TC']}
src = (here / 'mock.src.html').read_text(encoding='utf8').replace('/*DATA*/', json.dumps(data, separators=(',', ':')))
(here / 'mock.html').write_text(src, encoding='utf8')
out = root / 'dist' / 'calc-auto-mock.html'
out.parent.mkdir(exist_ok=True)
subprocess.run([sys.executable, '-I', str(root / 'tools/mockup/thor-frame/build.py'), str(here / 'mock.html'), str(out),
                '--title', 'Calc: automatic effects', '--sub', 'decide mockup', '--panel', str(here / 'panel.html')], check=True)
print(out)

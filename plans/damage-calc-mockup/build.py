"""Damage calc mockup: python -I plans/damage-calc-mockup/build.py  ->  dist/damage-calc-mock.html

Samples Emerald Imperium's data.json (species, moves, abilities, type chart, every trainer) and inlines the template's
dex.css into mock.html. The damage maths in the page is a rough stand-in (the real engine is @smogon/calc); the point is
the UI. Wrap it for the phone: python -I tools/mockup/thor-frame/build.py dist/damage-calc-mock.html dist/damage-calc-frame.html
--panel plans/damage-calc-mockup/panel.html, then tools/preview.py."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import assemble  # noqa: E402
from sprite_keys import keys_for  # noqa: E402

keys, d = keys_for('emerald-imperium')
P = d['P']
spr = {}
for p in P:
    u = assemble.shared_sprite(keys[p['id']])
    if u:
        spr[p['id']] = assemble.cropped(u)
trs = []
for g in d['TR']['g']:
    for s in g['sec']:
        for t in s['tr']:
            trs.append({'g': g['n'], 's': s['h'], 'k': t['k'], 'n': t['n'], 'loc': t['loc'], 'cap': t.get('cap'),
                        'note': t.get('note') or [],
                        'p': [{k: v for k, v in x.items() if k in ('id', 'l', 'r', 'i', 'a', 'na', 'iv', 'ev', 'm')} for x in t['p']]})
# a made-up trainer with an incomplete set, for the "unknown set" state
trs.insert(3, {'g': 'Roxanne Split [Cap 15]', 's': 'Route 104', 'k': 'x.1', 'n': 'Rival Brendan (sheet only)', 'loc': 'Route 104',
               'cap': 15, 'note': ['No set in the hzla calc; values are from the sheet.'],
               'p': [{'id': '252', 'r': 0, 'i': '', 'a': None, 'na': '', 'iv': [31] * 6, 'ev': [0] * 6, 'm': []},
                     {'id': '255', 'r': -1, 'i': '', 'a': None, 'na': '', 'iv': [31] * 6, 'ev': [0] * 6, 'm': [70]}]})
items = sorted({x['i'] for t in trs for x in t['p'] if x['i']} | {'Leftovers', 'Choice Band', 'Choice Specs', 'Choice Scarf', 'Life Orb', 'Expert Belt', 'Assault Vest', 'Focus Sash'})
data = {'P': [{'id': p['id'], 'n': p['n'], 't': p['t'], 'a': p['a'], 'ha': p.get('ha'), 's': p['s'], 'lv': p.get('lv'), 'stone': p.get('stone')} for p in P],
        'M': d['M'], 'MV': [{'t': m['t'], 'c': m['c'], 'bp': m['bp']} for m in d['MV']], 'AB': [a[0] for a in d['AB']],
        'TC': d['TC'], 'TR': trs, 'IT': items, 'SPR': spr}
html = open(os.path.join(HERE, 'mock.html'), encoding='utf8').read()
css = open(os.path.join(ROOT, 'template', 'dex.css'), encoding='utf8').read()
out = html.replace('/*CSS*/', css).replace('/*DATA*/null', json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<' + chr(92) + '/'))
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
dst = os.path.join(ROOT, 'dist', 'damage-calc-mock.html')
open(dst, 'w', encoding='utf8').write(out)
print(round(len(out.encode('utf8')) / 1e6, 2), 'MB', dst)

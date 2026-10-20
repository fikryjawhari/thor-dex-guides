"""Walkthrough decide mockup: real stops from data.json, Now beside Proposed (empty stops dropped), a keep/drop
checklist, the split title changes and the things to check. python -I tools/mockup/ps-walk/build.py <out.html>"""
import json, re, sys, os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
D = json.load(open(os.path.join(ROOT, 'hacks/photonic-sun/data.json'), encoding='utf-8'))
AR = D['AR']
sp = []
for i, s in enumerate(D['WK']['splits']):
    p = int(re.match(r'(\d+)\.', s['n']).group(1))
    st = []
    for j, x in enumerate(s['st']):
        areas = [AR[a]['n'] for a in x['a'] if not AR[a].get('ns')]
        st.append({'n': x['n'], 'x': 1 if x.get('x') else 0, 'a': areas, 'i': len(x['it']), 't': len(x['tr']), 's': len(x['s']), 'note': 1 if x['note'] else 0})
    sp.append({'p': p, 'st': st})
data = json.dumps(sp, ensure_ascii=False, separators=(',', ':'))
html = open(os.path.join(os.path.dirname(__file__), 'tpl.html'), encoding='utf-8').read().replace('/*DATA*/[]', data)
open(sys.argv[1], 'w', encoding='utf-8').write(html)
print(len(html))

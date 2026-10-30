"""Build the dex-page decide mockup: python -I tools/mockup/dex-page/sample.py [out.html]

Samples a few Pokemon from Emerald Imperium's data.json (with the moves, abilities and places they reference and
their shared-set sprites), inlines template/dex.css and the shell's rail, and writes the inner page (default
.tmp/dex-page/index.html). Wrap it with the Thor frame (README.md)."""
import base64, json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root / 'tools'))
import pngpal  # noqa: E402  (the guide's own crop: every inlined sprite fills its box)
here = Path(__file__).parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / '.tmp/dex-page/index.html'
d = json.loads((root / 'hacks/emerald-imperium/data.json').read_text(encoding='utf8'))
hack = json.loads((root / 'hacks/emerald-imperium/hack.json').read_text(encoding='utf8'))

# id -> sprite file in the shared set: whole families, so the arrows and the Evolution box have neighbours
SAMPLE = {'1': '0001', '2': '0002', '3': '0003', '906': '0003-mega', '4': '0004', '5': '0005', '6': '0006',
          '907': '0006-mega-x', '908': '0006-mega-y', '129': '0129', '130': '0130', '917': '0130-mega',
          '744': '0744', '1172': '0744', '745': '0745', '1173': '0745-midnight', '1174': '0745-dusk'}
P = {p['id']: p for p in d['P']}
ps = [p for p in d['P'] if p['id'] in SAMPLE]  # the dex's own order
mv, ab, loc = set(), set(), set()
for p in ps:
    mv.update(m for _, m in p['lv']); mv.update(p['tm']); mv.update(p.get('tu', [])); mv.update(p['eg'])
    ab.update(p['a']); ab.add(p['ha']) if p['ha'] >= 0 else None
    loc.update(w[0] for w in p['w'])
stubs = {i: P[i]['n'] for p in ps for i in [x[1] for x in p['ef'] + p['et']] + p['of'] if i in P}

# Trainers that use each sampled Pokemon: any dict with a name and a team of {'id': ...}
used = {}
def walk(x, ctx):
    if isinstance(x, dict):
        if 'n' in x and isinstance(x.get('p'), list) and x['p'] and isinstance(x['p'][0], dict) and 'id' in x['p'][0]:
            for m in x['p']:
                if m['id'] in SAMPLE and len(used.setdefault(m['id'], [])) < 40 and x['n'] not in used[m['id']]:
                    used[m['id']].append([x['n'], ctx])
        ctx = x.get('n', ctx) if 'p' not in x else ctx
        for v in x.values(): walk(v, ctx)
    elif isinstance(x, list):
        for v in x: walk(v, ctx)
walk(d['TR'], '')

spr = {i: 'data:image/png;base64,' + base64.b64encode(pngpal.crop((root / f'sprites/png/{f}.png').read_bytes())).decode()
       for i, f in SAMPLE.items()}
data = {
    'P': ps, 'stubs': stubs, 'used': used, 'TC': d['TC'], 'orig': hack['cfg'].get('orig', ''),
    'M': {i: d['M'][i] for i in mv},
    'MV': {i: {k: v for k, v in d['MV'][i].items() if k in ('t', 'c', 'bp', 'ac', 'cf', 'x', 'dc')} | {'h': bool(d['MV'][i].get('h'))} for i in mv},
    'AB': {i: d['AB'][i] for i in ab}, 'LOC': {i: d['LOC'][i] for i in loc},
}
shell = (root / 'template/shell.html').read_text(encoding='utf8')
rail = re.search(r'<nav id="rail">.*?</nav>', shell, re.S).group(0)
rail = re.sub(r'<a href="#/calc".*?</a>', '', rail)
page = (here / 'src.html').read_text(encoding='utf8')
page = page.replace('/*DEXCSS*/', (root / 'template/dex.css').read_text(encoding='utf8'))
page = page.replace('<!--RAIL-->', rail)
page = page.replace('/*DATA*/null', json.dumps(data, ensure_ascii=True).replace('<', '\\u003c'))
page = page.replace('/*SPR*/null', json.dumps(spr))
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding='utf8')
print(round(len(page) / 1e3), 'kB', out)

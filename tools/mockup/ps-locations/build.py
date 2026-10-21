"""Build the Locations mockup: python -I build.py <repo> <lt.json> <maps.json> <out.html>
The built guide (dist/photonic-sun.html) goes into every frame with a hook (route from the frame's data-r) and the
design patch (patch.js, patch.css) after its own script."""
import json, sys
from pathlib import Path
here = Path(__file__).parent
repo, lt, maps, out = Path(sys.argv[1]), sys.argv[2], sys.argv[3], Path(sys.argv[4])
HOOK = '<base href="about:srcdoc"><script>try{history.replaceState(null,"","about:srcdoc"+frameElement.dataset.r)}catch(e){}</script>'
g = (repo / 'dist/photonic-sun.html').read_text(encoding='utf8')
g = g.replace('<head>', '<head>' + HOOK, 1)
i = g.rindex('</body>')
g = g[:i] + '<script>' + (here / 'patch.js').read_text(encoding='utf8') + '</script>' + g[i:]
D = json.loads((repo / 'hacks/photonic-sun/data.json').read_text(encoding='utf8'))
L = json.load(open(lt, encoding='utf8'))
M = {k: v for k, v in json.load(open(maps, encoding='utf8')).items() if k}
areas = [[a['l'][0], 'Starter' if i == 0 else a['n']] for i, a in enumerate(D['AR']) if str(i) in L or i == 0]
j = lambda x: json.dumps(x, ensure_ascii=True).replace('<', '\\u003c')
page = (here / 'outer.html').read_text(encoding='utf8')
for k, v in (('GUIDE', g), ('LT', L), ('MAPS', M), ('CSS', (here / 'patch.css').read_text(encoding='utf8')), ('AREAS', areas)):
    page = page.replace(f'/*{k}*/' + ('""' if k in ('GUIDE', 'CSS') else '[]' if k == 'AREAS' else '{}'), j(v), 1)
page = page.replace('/*FINDINGS*/', (here / 'findings.html').read_text(encoding='utf8'))
page = page.replace("const MK={", "const MK={mvId:331,abId:88,", 1)
out.write_text(page, encoding='utf8')
print(round(len(page.encode('utf8')) / 1e6, 2), 'MB')

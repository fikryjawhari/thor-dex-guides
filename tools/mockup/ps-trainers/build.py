"""Build the Trainers mockup: python -I build.py <repo> <head data.json> <out.html>
The built guide (dist/photonic-sun.html, this branch's data) goes into the design frames; the "Now" frame is the same
build with TR and WK from <head data.json> (git show HEAD:hacks/photonic-sun/data.json), so only the trainer data
differs. Every frame gets a hook (route from the frame's data-r) and the design patch (patch.js, patch.css)."""
import json, sys
from pathlib import Path
here = Path(__file__).parent
repo, head, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
HOOK = ('<base href="about:srcdoc"><script>window.__errs=[];addEventListener("error",e=>__errs.push(String(e.message)));'
        'try{history.replaceState(null,"","about:srcdoc"+frameElement.dataset.r)}catch(e){}</script>')
OPEN = '<script id="data" type="application/json">'


def hooked(g):
    g = g.replace('<head>', '<head>' + HOOK, 1)
    i = g.rindex('</body>')
    return g[:i] + '<script>' + (here / 'patch.js').read_text(encoding='utf8') + '</script>' + g[i:]


new = (repo / 'dist/photonic-sun.html').read_text(encoding='utf8')
a = new.index(OPEN) + len(OPEN)
b = new.index('</script>', a)
D = json.loads(new[a:b].replace('<\\/', '</'))
H = json.load(open(head, encoding='utf8'))
TR = D['TR']
D['TR'], D['WK'] = H['TR'], H['WK']
cur = new[:a] + json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + new[b:]
j = lambda x: json.dumps(x, ensure_ascii=True).replace('<', '\\u003c')
page = (here / 'outer.html').read_text(encoding='utf8')
for k, v in (('GUIDE', hooked(new)), ('CUR', hooked(cur)), ('CSS', (here / 'patch.css').read_text(encoding='utf8'))):
    page = page.replace(f'/*{k}*/""', j(v), 1)
caps = '<table class="f"><tr><th>Cap</th><th>Where</th><th>Set</th><th>Level</th></tr>' + ''.join(
    f'<tr class="{"drop" if c[4] else ""}"><td>{c[0]}</td><td>{c[1]}</td><td>{"trial" if c[3] == "trial" else "mini"}</td>'
    f'<td class="n">{c[2]}</td></tr>' for c in TR['mini']) + '</table>'
page = page.replace('/*FINDINGS*/', (here / 'findings.html').read_text(encoding='utf8').replace('/*CAPS*/', caps))
out.write_text(page, encoding='utf8')
print(round(len(page.encode('utf8')) / 1e6, 2), 'MB')

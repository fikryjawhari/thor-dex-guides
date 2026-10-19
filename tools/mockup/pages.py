"""Build the split pages mockup: python -I tools/mockup/pages.py <repo> <out.html>

Wraps the built guides (dist/, run assemble.py first) in pages-outer.html: each guide goes into an iframe srcdoc with a
small hook at the top of its <head> that sets the route and the mockup switches (data attributes on <html>) from the
parent's MK, and a <base href="about:srcdoc"> so the guide's own #/ links stay inside the frame."""
import json, sys
from pathlib import Path
repo, out = Path(sys.argv[1]), Path(sys.argv[2])
HOOK = ('<base href="about:srcdoc"><script>try{const M=parent.MK;history.replaceState(null,"","about:srcdoc#"+M.route);'
        'Object.assign(document.documentElement.dataset,M.ds)}catch(e){}</script>')
g = {}
for k, h in (('ei', 'emerald-imperium'), ('hg', 'hardlove-gold')):
    s = (repo / 'dist' / f'{h}.html').read_text(encoding='utf8')
    g[k] = s.replace('<head>', '<head>' + HOOK, 1)
# Every < escaped: the guides hold "<!--" and "<script", which would stop the outer script's own end tag being found.
j = json.dumps(g, ensure_ascii=False).replace('<', '\\u003c')
page = (repo / 'tools/mockup/pages-outer.html').read_text(encoding='utf8').replace('/*GUIDES*/', j)
out.write_text(page, encoding='utf8')
print(round(len(page.encode('utf8')) / 1e6, 2), 'MB')

"""Build the walkthrough mockup: python -I gen.py <repo> <scratch>"""
import json, re, sys
from pathlib import Path
repo, S = Path(sys.argv[1]), Path(sys.argv[2])
css = (repo / 'template/dex.css').read_text(encoding='utf8')
m = re.search(r'@media \(prefers-color-scheme:light\)\{:root\{([^}]*)\}\}', css)
light = m.group(1)
css = css.replace(m.group(0), '@media (prefers-color-scheme:light){:root:not(.dk){%s}}:root.lt{%s}' % (light, light))
shell = (repo / 'template/shell.html').read_text(encoding='utf8')
rail = re.search(r'<nav id="rail">.*?</nav>', shell, re.S).group(0)
up = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14 M12 9v11 M7 14l5-5 5 5"/></svg>'
dn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19.5h14 M12 4v11 M7 10l5 5 5-5"/></svg>'
rail = rail.replace('id="t-w"', 'id="t-w" class="on"').replace(
    '</nav>', f'<div class="rjump"><button data-j="-1" aria-label="Previous split">{up}</button><button data-j="1" aria-label="Next split">{dn}</button></div></nav>')
inner = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
         '<meta name="color-scheme" content="dark light"><style>' + css + (S / 'inner.css').read_text(encoding='utf8') + '</style></head><body>'
         + rail + '<header><div class="bar"><input type="search" id="q" placeholder="Search walkthrough" autocomplete="off"></div>'
         '<div id="sugg"></div><div class="bar" id="filters" style="margin-top:6px"></div></header><main id="app"></main>'
         '<script>' + (S / 'inner.js').read_text(encoding='utf8') + '</script></body></html>')
j = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
snap = {k: json.loads((S / f'{k}.json').read_text(encoding='utf8')) for k in ('ei', 'hg')}
out = (S / 'outer.html').read_text(encoding='utf8').replace('/*SNAP*/', j(snap)).replace('/*INNER*/', j(inner))
(S / 'walkthrough-mockup.html').write_text(out, encoding='utf8')
print(len(out.encode('utf8')) / 1e6, 'MB')

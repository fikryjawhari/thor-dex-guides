"""Build the Items-standard mockup: python -I build.py <repo> <hack> <out.html>
Runs model.py for the hack, puts the standard's data and patch.js into the built guide (dist/<hack>.html, run
assemble.py first) and wraps that in the Thor frame with panel.html's options."""
import subprocess, sys, tempfile
from pathlib import Path
here = Path(__file__).parent
repo, hack, out = Path(sys.argv[1]).resolve(), sys.argv[2], Path(sys.argv[3])
tmp = Path(tempfile.mkdtemp())
subprocess.run([sys.executable, '-I', str(here / 'model.py'), str(repo), hack, str(tmp / 'v.json')], check=True)
V = (tmp / 'v.json').read_text(encoding='utf8').replace('</', '<\\/')
g = (repo / f'dist/{hack}.html').read_text(encoding='utf8')
i = g.rindex('</body>')
g = g[:i] + f'<script>window.__V={V};</script><script>' + (here / 'patch.js').read_text(encoding='utf8') + '</script>' + g[i:]
(tmp / 'inner.html').write_text(g, encoding='utf8')
subprocess.run([sys.executable, '-I', str(repo / 'tools/mockup/thor-frame/build.py'), str(tmp / 'inner.html'), str(out),
                '--title', f'Items standard: {hack}', '--sub', 'This guide, Items tab. Now = its current boxes, Standard = the shared set.',
                '--panel', str(here / 'panel.html')], check=True)

"""Build the Items mockup: uv run python -I build.py <repo> <out.html>
Runs model.py for the variants, puts them and patch.js into the built guide (dist/photonic-sun.html, run assemble.py
first), and wraps that in the Thor frame with panel.html's options."""
import json, subprocess, sys, tempfile
from pathlib import Path
here = Path(__file__).parent
repo, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2])
tmp = Path(tempfile.mkdtemp())
subprocess.run([sys.executable, '-I', str(here / 'model.py'), str(repo), str(repo / 'hacks/photonic-sun/data.json'), str(tmp / 'v.json')], check=True)
V = (tmp / 'v.json').read_text(encoding='utf8').replace('</', '<\\/')
g = (repo / 'dist/photonic-sun.html').read_text(encoding='utf8')
i = g.rindex('</body>')
g = g[:i] + f'<script>window.__V={V};</script><script>' + (here / 'patch.js').read_text(encoding='utf8') + '</script>' + g[i:]
(tmp / 'inner.html').write_text(g, encoding='utf8')
subprocess.run([sys.executable, '-I', str(repo / 'tools/mockup/thor-frame/build.py'), str(tmp / 'inner.html'), str(out),
                '--title', 'Photonic Sun: Items, round 1', '--sub', 'The real build with the proposed Items data. Now = the current tab. Use the chips to try each choice.',
                '--panel', str(here / 'panel.html')], check=True)

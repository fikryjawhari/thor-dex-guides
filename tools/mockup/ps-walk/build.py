"""Walkthrough empty-stop mockup: python -I tools/mockup/ps-walk/build.py <repo> <out.html>
The built guide (dist/photonic-sun.html) gets patch.css / patch.js (the designs), then thor-frame/build.py wraps it with
a panel of option chips."""
import subprocess, sys, tempfile
from pathlib import Path
here = Path(__file__).parent
repo, out = Path(sys.argv[1]), sys.argv[2]
g = (repo / 'dist/photonic-sun.html').read_text(encoding='utf8')
i = g.rindex('</body>')
g = g[:i] + '<style>' + (here / 'patch.css').read_text(encoding='utf8') + '</style><script>' + (here / 'patch.js').read_text(encoding='utf8') + '</script>' + g[i:]
with tempfile.TemporaryDirectory() as t:
    p = Path(t) / 'g.html'
    p.write_text(g, encoding='utf8')
    subprocess.run([sys.executable, '-I', str(repo / 'tools/mockup/thor-frame/build.py'), str(p), out, '--title', 'Walkthrough: empty stops',
                    '--sub', 'Photonic Sun build with four ways to show the stops that have nothing in them.', '--panel', str(here / 'panel.html')], check=True)

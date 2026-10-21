"""Trainer cards mockup: python -I tools/mockup/trainer-cards/build.py <repo> <out.html>
The built guide (dist/photonic-sun.html) gets patch.css / patch.js (the designs), then thor-frame/build.py wraps it with
a panel of option chips. Put the result on the phone preview (tools/preview.py)."""
import subprocess, sys, tempfile
from pathlib import Path
here = Path(__file__).parent
repo, out = Path(sys.argv[1]), sys.argv[2]
g = (repo / 'dist/photonic-sun.html').read_text(encoding='utf8')
i = g.rindex('</body>')
g = g[:i] + '<style>' + (here / 'patch.css').read_text(encoding='utf8') + '</style><script>' + (here / 'patch.js').read_text(encoding='utf8') + '</script>' + g[i:]
if len(sys.argv) > 3 and sys.argv[3] == '--bare':  # the patched guide alone, for headless checks (shot.mjs)
    Path(out).write_text(g, encoding='utf8')
    sys.exit()
with tempfile.TemporaryDirectory() as t:
    p = Path(t) / 'g.html'
    p.write_text(g, encoding='utf8')
    subprocess.run([sys.executable, '-I', str(repo / 'tools/mockup/thor-frame/build.py'), str(p), out, '--title', 'Trainer cards',
                    '--sub', 'Photonic Sun build: five card designs (Now, A–D), smaller preview sprites, slimmer pinned headers.',
                    '--panel', str(here / 'panel.html')], check=True)

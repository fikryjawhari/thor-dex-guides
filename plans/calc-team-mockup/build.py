"""Build the calc-team decide mockup: the real Emerald Imperium build (live engine, real trainers) with patch.css /
patch.js injected and an imported save seeded (party 6 + 12 boxed), wrapped in the Thor frame with panel.html.

python -I plans/calc-team-mockup/build.py   (after python assemble.py emerald-imperium)
Writes .tmp/calc-team/mock.html (the inner page) and .tmp/calc-team/calc-team.html (framed); put the second on the
phone preview with python -I tools/preview.py .tmp/calc-team/calc-team.html calc-team.html."""
import json
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parents[1]
out = root / '.tmp' / 'calc-team'
out.mkdir(parents=True, exist_ok=True)
page = (root / 'dist' / 'emerald-imperium.html').read_text(encoding='utf8')
state = json.loads((here / 'seed.json').read_text(encoding='utf8'))
seed = ("<script>try{if(localStorage.getItem('mkseed')!=='5'){localStorage.setItem('eidmg',"
        + json.dumps(json.dumps(state)) + ");localStorage.removeItem('mkteam');localStorage.removeItem('mkopt');localStorage.setItem('mkseed','5');}"
        "if(!location.hash)location.hash='#/calc';}catch(e){}</script>")
css = '<style id="mk-css">' + (here / 'patch.css').read_text(encoding='utf8') + '</style>'
js = '<script id="mk-js">' + (here / 'patch.js').read_text(encoding='utf8') + '</script>'
head = page.index('<head>') + len('<head>')
page = page[:head] + seed + page[head:]
body = page.rindex('</body>')
page = page[:body] + css + js + page[body:]
(out / 'mock.html').write_text(page, encoding='utf8')
subprocess.run([sys.executable, '-I', str(root / 'tools/mockup/thor-frame/build.py'), str(out / 'mock.html'),
                str(out / 'calc-team.html'), '--title', 'Calc: teams', '--sub', 'calc-team decide mockup',
                '--panel', str(here / 'panel.html')], check=True)

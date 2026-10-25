"""Calc refine mockup (U1 Protean type, U2 residual): python -I plans/calc-refine-mockup/build.py
-> dist/calc-refine-mock.html, then the Thor frame with --panel plans/calc-refine-mockup/panel.html.

Takes the built Emerald Imperium guide, seeds the calc's storage with seed.json (a synthetic save import, Garchomp vs
Candice's Snover) and adds overlay.js, which draws the proposed controls on top of the real calc. Residual amounts
are the panel's scenarios, not engine output; KO text is recomputed from the row's real rolls."""
import json
from pathlib import Path

here = Path(__file__).parent
root = here.parent.parent
page = (root / 'dist' / 'emerald-imperium.html').read_text(encoding='utf8')
seed = json.loads((here / 'seed.json').read_text(encoding='utf8'))
head = ('<script>try{if(!localStorage.getItem(%s))localStorage.setItem(%s,%s);}catch(e){}</script>'
        % (json.dumps(seed['key']), json.dumps(seed['key']), json.dumps(json.dumps(seed['st']))))
overlay = '<script>' + (here / 'overlay.js').read_text(encoding='utf8') + '</script>'
page = page.replace('<head>', '<head>' + head, 1)
i = page.rindex('</body>')
page = page[:i] + overlay + page[i:]
(root / 'dist' / 'calc-refine-mock.html').write_text(page, encoding='utf8')
print('dist/calc-refine-mock.html')

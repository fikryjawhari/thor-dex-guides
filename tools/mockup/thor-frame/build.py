"""Wrap a page in the Thor frame: python -I build.py <page.html> <out.html> [--title T] [--sub S] [--panel P.html]
[--routes guide|none]

<page.html> is what the Thor screen shows: a built guide (dist/<hack>.html) or a decision mockup's inner page (a
plain standalone HTML at the viewer's size, no frame of its own). The frame gives it the viewer sizes, fit to screen,
keyboard mode (localStorage dvkb), route buttons, reload / clear saved state, and an error and width readout. On a
phone the screen pins to the top and the controls scroll under it.

--panel adds the mockup's own controls (an HTML fragment) above the frame's; its scripts reach the page inside with
window.thorFrame() (same origin), e.g. thorFrame().setOption('m','open') if the inner page defines setOption.
--routes guide (default for dist/ files) shows the guide's tabs; none hides them."""
import argparse, json
from pathlib import Path

here = Path(__file__).parent
ap = argparse.ArgumentParser()
ap.add_argument('page')
ap.add_argument('out')
ap.add_argument('--title', default='Thor screen')
ap.add_argument('--sub', default='')
ap.add_argument('--panel')
ap.add_argument('--routes', choices=('guide', 'none'))
a = ap.parse_args()
src = Path(a.page).read_text(encoding='utf8')
routes = a.routes or ('guide' if 'id="rail"' in src else 'none')
R = [['Pokémon', '#/'], ['Locations', '#/locs'], ['Trainers', '#/trainers'], ['Items', '#/items'],
     ['Walkthrough', '#/walk'], ['Calc', '#/calc']] if routes == 'guide' else []
esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;')
page = (here / 'frame.html').read_text(encoding='utf8')
page = page.replace('/*TITLE*/', esc(a.title)).replace('/*SUB*/', esc(a.sub))
page = page.replace('/*PANEL*/', Path(a.panel).read_text(encoding='utf8') if a.panel else '')
page = page.replace('/*ROUTES*/[]', json.dumps(R, ensure_ascii=False))
page = page.replace('/*SRC*/""', json.dumps(src, ensure_ascii=True).replace('<', '\\u003c'), 1)
Path(a.out).write_text(page, encoding='utf8')
print(round(len(page.encode('utf8')) / 1e6, 2), 'MB', Path(a.out))

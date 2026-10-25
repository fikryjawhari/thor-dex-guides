"""Build every guide: template/ + hacks/<hack>/{hack.json, data.json, sprites.json} -> dist/<hack>.html (one
self-contained file), plus dist/guides.json and dist/index.html. Stdlib only, no inputs outside the repo, so the
GitHub Action reruns it on every push.

Usage: python assemble.py [hack ...]      (no arguments = every folder in hacks/ with a hack.json)

Sprites: each guide's #spr maps its own species ids to data URIs. Every species gets a sprite key
(tools/sprite_keys.py: data.json `sk`, hack.json `sk` override, else worked out from dex number and name) and takes
the shared set's sprites/png/<key>.png (sprites/README.md). A hack's sprites.json is only a supplement, keyed by
species id or sprite key, for forms the shared set lacks; an entry there wins. Only the sprites a guide uses are
inlined, each cropped to its visible area. Species with no sprite from either are reported, never silently dropped.

Damage calc: only a hack whose cfg has `calc` gets it. Its profile is the base template/calc/profiles/<base>.json with
the hack's own keys laid over it (dicts merge key by key, anything else replaces), written to the page as cfg.calc. The
page then also inlines template/calc/engine.js, the save reader template/calc/readers/<save>.js when the profile names
one, template/calc.js after dex.js and template/calc.css after dex.css. Guides without `calc` are built as before.
"""
import base64, html, json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tools'))
from sprite_keys import keys_for  # noqa: E402
import pngpal  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = 'https://fikryjawhari.github.io/thor-dex-guides/'
sys.stdout.reconfigure(encoding='utf-8')


def read(*p):
    return open(os.path.join(ROOT, *p), encoding='utf-8').read()


def script_json(obj):
    # Inside <script>, "</" would end the tag early; JSON allows "<\/" for the same string.
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


SHARED = json.loads(read('sprites', 'index.json'))


def shared_sprite(key):
    """Data URI of the shared set's sprite for a sprite key, or None."""
    key = SHARED['same'].get(key, key)
    path = os.path.join(ROOT, 'sprites', 'png', f'{key}.png')
    if not key or not os.path.exists(path):
        return None
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def cropped(uri):
    """The sprite cropped to its visible area (a square box the Pokémon fills, small ones included; the user,
    2026-10-19). Sprites that aren't palette PNGs pass through unchanged."""
    head, _, b64 = uri.partition(',')
    try:
        return head + ',' + base64.b64encode(pngpal.crop(base64.b64decode(b64))).decode()
    except ValueError:
        return uri


def merged(base, over):
    """`over` laid over `base`: dicts merge key by key, anything else replaces."""
    out = dict(base)
    for k, v in over.items():
        out[k] = merged(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def calc_profile(c):
    """A hack's cfg.calc resolved against its base profile."""
    base = json.loads(read('template', 'calc', 'profiles', c['base'] + '.json'))
    return merged(base, c)


def calc_parts(prof):
    """(js, css) the calc adds to a guide: engine, save reader, page."""
    js = [read('template', 'calc', 'engine.js')]
    if prof.get('save'):
        js.append(read('template', 'calc', 'readers', prof['save'] + '.js'))
    js.append(read('template', 'calc.js'))
    return '\n'.join(js), read('template', 'calc.css')


def build(hid):
    h = json.loads(read('hacks', hid, 'hack.json'))
    keys, data = keys_for(hid)
    own = json.loads(read('hacks', hid, 'sprites.json')) if os.path.exists(os.path.join(ROOT, 'hacks', hid, 'sprites.json')) else {}
    data['cfg'] = dict(h['cfg'])
    js, css = read('template', 'dex.js'), read('template', 'dex.css')
    if 'calc' in h['cfg']:
        if not h['cfg'].get('ls', {}).get('dmg'):
            sys.exit(f'{hid}: cfg.calc needs its own storage key cfg.ls.dmg')
        data['cfg']['calc'] = calc_profile(h['cfg']['calc'])
        cjs, ccss = calc_parts(data['cfg']['calc'])
        js, css = js + '\n' + cjs, css + '\n' + ccss
    spr, missing, shared = {}, [], 0
    for p in data['P']:
        k = keys[p['id']]
        uri = own.get(p['id']) or own.get(k)
        if not uri:
            uri = shared_sprite(k)
            shared += bool(uri)
        if uri:
            spr[p['id']] = cropped(uri)
        else:
            missing.append(f'{p["id"]} {p["n"]}' + (f' ({k})' if k else ''))
    url = f'{PAGES}{hid}.html'
    vals = {
        'id': hid, 'title': h['title'], 'game': h['game'], 'platform': h['platform'], 'version': h['version'],
        'source': url,
    }
    out = read('template', 'shell.html')
    for k, v in vals.items():
        out = out.replace('{{' + k + '}}', html.escape(v))
    # Big parts last, so a "{{" inside them is never treated as a placeholder.
    out = out.replace('{{css}}', css).replace('{{js}}', js)
    out = out.replace('{{data}}', script_json(data)).replace('{{spr}}', script_json(spr))
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    open(os.path.join(ROOT, 'dist', hid + '.html'), 'w', encoding='utf-8', newline='\n').write(out)
    print(f'{hid}: {len(out.encode()) / 1e6:.2f} MB, {len(data["P"])} species, {len(spr)} sprites'
          + f' ({shared} shared, {len(spr) - shared} own)'
          + (f', NO SPRITE for {len(missing)}: {", ".join(missing[:10])}' if missing else ''))
    return {'id': hid, 'title': h['title'], 'game': h['game'], 'platform': h['platform'], 'version': h['version'],
            'built': data.get('built', ''), 'url': url}


def index(guides):
    rows = ''.join(
        f'<li><a href="{html.escape(g["id"])}.html">{html.escape(g["title"])}</a>'
        f'<span>{html.escape(g["platform"])} · version {html.escape(g["version"])} · built {html.escape(g["built"])}</span></li>'
        for g in guides)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><title>Thor Dex Guides</title>
<style>
:root{{--bg:#121417;--fg:#e8eaed;--mut:#9aa0a6;--acc:#7cc4ff;--line:#2e333b}}
@media (prefers-color-scheme:light){{:root{{--bg:#f6f7f9;--fg:#1b1e23;--mut:#5f6368;--acc:#0b63c5;--line:#d5d9de}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.45 system-ui,sans-serif}}
main{{max-width:640px;margin:0 auto;padding:24px 16px}}h1{{font-size:22px;margin:0 0 4px}}p{{color:var(--mut);margin:0 0 16px}}
ul{{list-style:none;padding:0;margin:0}}li{{border-top:1px solid var(--line);padding:12px 0}}
a{{color:var(--acc);font-weight:600;text-decoration:none;display:block;min-height:24px}}span{{color:var(--mut);font-size:14px}}
</style></head><body><main>
<h1>Thor Dex Guides</h1>
<p>Offline, single-file dex guides for ROM hacks. Each works in a phone browser or in Dex Viewer: open it, or copy its
link into Dex Viewer's "Add from link". Data and sprites belong to each hack's authors (credited in every guide).</p>
<ul>{rows}</ul>
</main></body></html>
'''


def main():
    ids = sys.argv[1:] or sorted(d for d in os.listdir(os.path.join(ROOT, 'hacks'))
                                 if os.path.exists(os.path.join(ROOT, 'hacks', d, 'hack.json')))
    guides = [build(h) for h in ids]
    if not sys.argv[1:]:
        open(os.path.join(ROOT, 'dist', 'guides.json'), 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'guides': guides}, ensure_ascii=False, indent=1) + '\n')
        open(os.path.join(ROOT, 'dist', 'index.html'), 'w', encoding='utf-8', newline='\n').write(index(guides))


if __name__ == '__main__':
    main()

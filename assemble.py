"""Build every guide: template/ + hacks/<hack>/{hack.json, data.json, sprites.json} -> dist/<hack>.html (one
self-contained file), plus dist/guides.json and dist/index.html. Stdlib only, no inputs outside the repo, so the
GitHub Action reruns it on every push.

Usage: python assemble.py [hack ...]      (no arguments = every folder in hacks/ with a hack.json)

Sprites: each guide's #spr maps its own species ids to data URIs. Today they all come from the hack's own
sprites.json. When the shared set lands (sprites/), a species the hack has no art for falls back to it by sprite key
(sprites/README.md); species with no sprite from either are reported, never silently dropped.
"""
import html, json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = 'https://fikryjawhari.github.io/thor-dex-guides/'
sys.stdout.reconfigure(encoding='utf-8')


def read(*p):
    return open(os.path.join(ROOT, *p), encoding='utf-8').read()


def script_json(obj):
    # Inside <script>, "</" would end the tag early; JSON allows "<\/" for the same string.
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def build(hid):
    h = json.loads(read('hacks', hid, 'hack.json'))
    data = json.loads(read('hacks', hid, 'data.json'))
    spr = json.loads(read('hacks', hid, 'sprites.json'))
    data['cfg'] = h['cfg']
    missing = [p['id'] for p in data['P'] if p['id'] not in spr]
    url = f'{PAGES}{hid}.html'
    vals = {
        'id': hid, 'title': h['title'], 'game': h['game'], 'platform': h['platform'], 'version': h['version'],
        'source': url,
    }
    out = read('template', 'shell.html')
    for k, v in vals.items():
        out = out.replace('{{' + k + '}}', html.escape(v))
    # Big parts last, so a "{{" inside them is never treated as a placeholder.
    out = out.replace('{{css}}', read('template', 'dex.css')).replace('{{js}}', read('template', 'dex.js'))
    out = out.replace('{{data}}', script_json(data)).replace('{{spr}}', script_json(spr))
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    open(os.path.join(ROOT, 'dist', hid + '.html'), 'w', encoding='utf-8', newline='\n').write(out)
    print(f'{hid}: {len(out.encode()) / 1e6:.2f} MB, {len(data["P"])} species, {len(spr)} sprites'
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

"""Put a page on the phone preview: python -I tools/preview.py <page.html> [name.html] [--rm name.html ...]

Copies the page into `preview/` in the main checkout (git-ignored; also from a worktree, so every session shares one
folder) and rewrites `preview/index.html`, the list of pages, newest first. `tailscale serve` serves that folder on
the tailnet only, so the phone and the Thor open it over Tailscale from anywhere. Prints the page's link.

Use a built guide, a Thor-frame build (tools/mockup/thor-frame/build.py) or a mockup page; it must be one
self-contained file. The name defaults to the file's own; the same name replaces the page (reload it on the phone).
--rm drops pages from the folder. One-time setup on a machine: README "Phone preview"."""
import argparse, datetime, html, json, shutil, subprocess
from pathlib import Path

repo = Path(subprocess.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], capture_output=True,
                           text=True, check=True, cwd=Path(__file__).parent).stdout.strip()).parent
out = repo / 'preview'


def host():
    try:
        st = json.loads(subprocess.run(['tailscale', 'status', '--json'], capture_output=True, text=True).stdout)
        return 'https://' + st['Self']['DNSName'].rstrip('.')
    except (OSError, ValueError, KeyError):
        return '(tailscale not running)'


def index():
    pages = sorted((p for p in out.glob('*.html') if p.name != 'index.html'), key=lambda p: -p.stat().st_mtime)
    rows = ''.join(
        f'<li><a href="{html.escape(p.name)}?v={int(p.stat().st_mtime)}">{html.escape(p.stem)}</a>'
        f'<small>{datetime.datetime.fromtimestamp(p.stat().st_mtime):%d %b %H:%M} · '
        f'{p.stat().st_size / 1e6:.1f} MB</small></li>' for p in pages)
    (out / 'index.html').write_text(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Previews</title><style>body{font:16px system-ui,sans-serif;margin:16px;background:#111;color:#eee}'
        'ul{list-style:none;padding:0}li{padding:10px 0;border-bottom:1px solid #333}a{color:#8cf;display:block}'
        'small{color:#999}</style><h1>Previews</h1><ul>' + (rows or '<li>None yet.</li>') + '</ul>', encoding='utf8')


ap = argparse.ArgumentParser()
ap.add_argument('page', nargs='?')
ap.add_argument('name', nargs='?')
ap.add_argument('--rm', nargs='+', default=[])
a = ap.parse_args()
out.mkdir(exist_ok=True)
for n in a.rm:
    (out / n).unlink(missing_ok=True)
if a.page:
    name = a.name or Path(a.page).name
    shutil.copyfile(a.page, out / name)
    print(f'{host()}/preview/{name}')
index()
print(f'{host()}/preview/  (all previews)')

"""Item pages decide mockup: the real built guide with an item route injected (plans/item-pages-mockup.js).

    python assemble.py emerald-imperium unbound
    uv run python -I plans/item-pages-mockup.py [hack ...]      # default: emerald-imperium unbound

Writes .tmp/item-pages-<hack>.html (the guide + the mockup script), wraps each in the Thor frame with
plans/item-pages-panel.html and puts it on the phone preview as item-pages-<hack>.html. Mockup only: the descriptions
and the kind line come from the data inventory (plans/item-pages-data.md), the icons from Showdown's item sheet
(.tmp/inv/sheet.png, fetched once) cropped to the items this guide names, so the size the icons add is the real one
for this guide's item count (the build would use the expansion's icons).
"""
import base64, io, json, re, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TMP = ROOT / '.tmp'
sys.stdout.reconfigure(encoding='utf8')
key = lambda name: re.sub(r'[^a-z0-9]', '', name.lower().replace('é', 'e'))


def expansion_text():
    """{key(name): description} from the expansion items.h EI pins (its own code; for Unbound only a stock stand-in)."""
    text = (ROOT / 'hacks/emerald-imperium/.src/repos/expansion/src/data/items.h').read_text(encoding='utf8')
    out = {}
    for block in text.split('\n    [ITEM_')[1:]:
        name = re.search(r'\.name = (?:_|COMPOUND_STRING)\("([^"]*)"\)', block)
        desc = re.search(r'\.description = COMPOUND_STRING\(((?:\s*"(?:[^"\\]|\\.)*")+)\s*\)', block)
        if name and desc:
            parts = re.findall(r'"((?:[^"\\]|\\.)*)"', desc[1])
            out.setdefault(key(name[1]), ''.join(parts).replace('\\n', ' ').replace('  ', ' ').strip())
    return out


def showdown_icons():
    """{key(name): spritenum} from Showdown items.js."""
    src = (ROOT / 'hacks/emerald-imperium/.src/repos/showdown/items.js').read_text(encoding='utf8')
    out = {}
    for entry in re.split(r'\n  [a-z0-9]+: \{', src)[1:]:
        name, num = re.search(r'name: "([^"]+)"', entry), re.search(r'spritenum: (\d+)', entry)
        if name and num:
            out[key(name[1])] = int(num[1])
    return out


def names_in(data):
    """Every item name the guide shows: Items tab rows (not Useful NPCs), wild held items, Mega Stones, trainer items."""
    found = {row[0] for sec in data['IT'] if sec.get('k') != 'npc' for row in sec['r']}
    for p in data['P']:
        found.update(p.get('hi') or [])
        if p.get('stone'):
            found.add(p['stone'])
    for group in data['TR']['g']:
        for sec in group['sec']:
            for trainer in sec['tr']:
                teams = [trainer['p']] + [mate.get('p', []) for mate in trainer.get('pt', [])]
                teams.append((trainer.get('normal') or {}).get('p', []))
                found.update(mon['i'] for team in teams for mon in team if mon.get('i'))
    found.update(row['i'] for row in data.get('MI', []) if row.get('i'))
    return found


def build(hack):
    data = json.loads((ROOT / 'hacks' / hack / 'data.json').read_text(encoding='utf8'))
    desc, sprite = expansion_text(), showdown_icons()
    names = sorted(names_in(data))
    sheet = Image.open(TMP / 'inv/sheet.png').convert('RGBA')
    cols = sheet.width // 24
    wanted = sorted({sprite[key(n)] for n in names if key(n) in sprite and not re.match(r'(TM|HM|TR)\d', n)})
    slot = {num: i for i, num in enumerate(wanted)}
    out = Image.new('RGBA', (16 * 24, max(1, (len(wanted) + 15) // 16) * 24))
    for num, i in slot.items():
        out.paste(sheet.crop((num % cols * 24, num // cols * 24, num % cols * 24 + 24, num // cols * 24 + 24)),
                  (i % 16 * 24, i // 16 * 24))
    buf = io.BytesIO()
    out.quantize(colors=255).save(buf, 'PNG', optimize=True)
    uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    items = {n: {'d': desc.get(key(n), ''), 'ic': slot.get(sprite.get(key(n)), -1)} for n in names}
    payload = {'items': items, 'sheet': uri, 'stock': hack != 'emerald-imperium'}
    page = (ROOT / 'dist' / f'{hack}.html').read_text(encoding='utf8')
    script = (ROOT / 'plans/item-pages-mockup.js').read_text(encoding='utf8')
    inject = ('<script>window.ITX=' + json.dumps(payload, ensure_ascii=True).replace('<', '\\u003c') + ';</script>'
              '<script>' + script + '</script>')
    cut = page.rindex('</body>')
    page = page[:cut] + inject + page[cut:]
    target = TMP / f'item-pages-{hack}.html'
    target.write_text(page, encoding='utf8')
    print(f'{hack}: {len(names)} items, {len(wanted)} icons, sheet {len(uri) // 1024} KB, '
          f'{sum(1 for v in items.values() if v["d"])} with a description')
    frame = TMP / f'item-pages-{hack}-frame.html'
    title = {'emerald-imperium': 'Emerald Imperium', 'unbound': 'Unbound'}.get(hack, hack)
    subprocess.run([sys.executable, '-I', str(ROOT / 'tools/mockup/thor-frame/build.py'), str(target), str(frame),
                    '--title', f'Item pages: {title}', '--sub', 'decide mockup',
                    '--panel', str(ROOT / 'plans/item-pages-panel.html')], check=True)
    subprocess.run([sys.executable, '-I', str(ROOT / 'tools/preview.py'), str(frame), f'item-pages-{hack}.html'],
                   check=True)


for hack in sys.argv[1:] or ['emerald-imperium', 'unbound']:
    build(hack)

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
ICONS = ROOT.parent / 't3-8ff58204'   # the worktree-move-pages-icons checkout
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


def showdown_text(kind):
    """{key(name): shortDesc} from Showdown data/text/<kind>.ts (.tmp/inv/sd, fetched from GitHub master)."""
    src = (TMP / 'inv/sd' / f'{kind}.ts').read_text(encoding='utf8')
    out = {}
    for entry in re.split(r'\n\t[a-z0-9]+: \{', src)[1:]:
        name = re.search(r'\n\t\tname: "([^"]+)"', entry)
        short = re.search(r'\n\t\tshortDesc: "((?:[^"\\]|\\.)*)"', entry)
        if name and short:
            out[key(name[1])] = short[1].replace('\\"', '"')
    return out


def held_odds(hack, data):
    """{P id: [[item, %]]}: EI from its game data (eidex heldItems = [common, rare] game ids), Unbound from its wiki
    ("Leftovers (50% chance)"). Gen 3: common 50%, rare 5%, the same item in both slots 100%. Mega forms: none
    (never met in the wild)."""
    out = {}
    if hack == 'emerald-imperium':
        import zipfile
        z = zipfile.ZipFile(ROOT / 'hacks/emerald-imperium/.src/repos/eidex.zip')
        root = z.namelist()[0].split('/')[0]
        species = json.loads(z.read(f'{root}/src/data/speciesData.json'))
        for p in data['P']:
            held = (species.get(p['id']) or {}).get('heldItems') or [0, 0]
            if p.get('g') == 1 or not any(held):
                continue
            names = [data['GID']['it'][x] if x else None for x in held]
            out[p['id']] = [[names[0], 100]] if names[0] and names[0] == names[1] else \
                [[n, pct] for n, pct in zip(names, (50, 5)) if n]
    elif hack == 'unbound':
        wiki = json.loads((ROOT / 'hacks/unbound/.src/unboundwiki/unboundwiki.json').read_text(encoding='utf8'))
        by_title = {}
        for row in wiki:
            text = re.sub(r'<[^>]+>', ' ', row.get('html', ''))
            found = re.search(r'Wild Held Items\s+(.*?)\s+(?:Evolution Line|Egg Groups|$)', re.sub(r'\s+', ' ', text))
            if found and found[1] not in ('None', ''):
                by_title[row['title'].lower()] = re.findall(r'([^,()]+?)\s*\((\d+)%[^)]*\)', found[1])
        for p in data['P']:
            pairs = by_title.get(p['n'].lower())
            if p.get('g') == 1 or not pairs:
                continue
            names = [n.strip() for n, _ in pairs]
            out[p['id']] = [[names[0], 100]] if len(names) == 2 and names[0] == names[1] else \
                [[n.strip(), int(pct)] for n, pct in pairs]
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
    desc = expansion_text()
    names = sorted(names_in(data))
    # Icons: the shared item set (sprites/items, branch worktree-move-pages-icons; ICONS = its checkout), packed into
    # one sheet of this guide's icons, 16 per row.
    full = json.loads((ICONS / 'sprites/items/index.json').read_text(encoding='utf8'))
    same = full['same']
    index = {k: same.get(v, v) for k, v in full['guides'][hack].items()}
    files = sorted({index[key(n)] for n in names if key(n) in index})
    slot = {f: i for i, f in enumerate(files)}
    out = Image.new('RGBA', (16 * 24, max(1, (len(files) + 15) // 16) * 24))
    for f, i in slot.items():
        icon = Image.open(ICONS / 'sprites/items/png' / f'{f}.png').convert('RGBA')
        if icon.size != (24, 24):
            icon = icon.resize((24, 24), Image.NEAREST)
        out.paste(icon, (i % 16 * 24, i // 16 * 24))
    buf = io.BytesIO()
    # 256-colour palette: about 60% smaller than RGBA, no visible difference (checked side by side)
    out.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.Dither.NONE).save(buf, 'PNG', optimize=True)
    uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    wanted = files
    items = {n: {'d': desc.get(key(n), ''), 'ic': slot.get(index.get(key(n)), -1)} for n in names}
    itfx, mvfx = showdown_text('items'), showdown_text('moves')
    for n, v in items.items():
        if itfx.get(key(n)):
            v['fx'] = itfx[key(n)]
    payload = {'items': items, 'sheet': uri, 'odds': held_odds(hack, data),
               'mvfx': [mvfx.get(key(m), '') for m in data['M']]}
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
    title = {'emerald-imperium': 'Emerald Imperium', 'unbound': 'Unbound', 'hardlove-gold': 'Hardlove Gold'}.get(hack, hack)
    subprocess.run([sys.executable, '-I', str(ROOT / 'tools/mockup/thor-frame/build.py'), str(target), str(frame),
                    '--title', f'Item pages: {title}', '--sub', 'decide mockup',
                    '--panel', str(ROOT / 'plans/item-pages-panel.html')], check=True)
    subprocess.run([sys.executable, '-I', str(ROOT / 'tools/preview.py'), str(frame), f'item-pages-{hack}.html'],
                   check=True)


for hack in sys.argv[1:] or ['emerald-imperium', 'unbound', 'hardlove-gold']:
    build(hack)

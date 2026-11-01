"""Rebuild shared 24px item icons, coverage and review contact sheet.

Usage: uv run python -I tools/item_icons.py [--fetch] [--check]
Pinned sources are cached in .tmp/item-icons, never in published guides.
"""
import argparse
import ast
import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
from pathlib import Path
import re
import time
import unicodedata
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.tmp/item-icons'
OUT = ROOT / 'sprites/items'
PINS = {
    'expansion': ('rh-hideout/pokeemerald-expansion', '73b3fbeb574327cd9420c89e56bef5aa3c08fead'),
    'imperium': ('iriv24/pokeemerald-expansion', '2576d0f3f4c861c760f0c55198e37e6d7b91683e'),
    'hardlove': ('kumakuma1/hardlove', '64838bf7dbe032cd87fd986f9c8699c1436c67c5'),
}


def key(name):
    return re.sub('[^a-z0-9]', '', unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower())


def download(url, target):
    if target.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        try:
            request = Request(url, headers={'User-Agent': 'thor-dex-guides-item-icons/1.0'})
            with urlopen(request, timeout=90) as response:
                payload = response.read()
            temporary = target.with_suffix(target.suffix + '.part')
            temporary.write_bytes(payload)
            temporary.replace(target)
            return
        except OSError:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def fetch_sources():
    for source, (repo, pin) in PINS.items():
        tree_file = CACHE / f'{source}-tree.json'
        download(f'https://api.github.com/repos/{repo}/git/trees/{pin}?recursive=1', tree_file)
        tree = json.loads(tree_file.read_bytes())
        if tree.get('truncated'):
            raise ValueError(f'{source}: truncated source tree')
        paths = [entry['path'] for entry in tree['tree'] if entry['type'] == 'blob' and (
            'graphics/items/' in entry['path'] or entry['path'] in {
                'src/data/items.h', 'src/data/graphics/items.h', 'include/constants/items.h'})]
        with ThreadPoolExecutor(max_workers=12) as pool:
            list(pool.map(lambda path: download(f'https://raw.githubusercontent.com/{repo}/{pin}/{path}',
                                               CACHE / source / path), paths))
        print(f'{source}: {len(paths)} source files cached', flush=True)


def inventory():
    """Reuse names_in without running the mockup's top-level build/preview loop."""
    module = ast.parse((ROOT / 'plans/item-pages-mockup.py').read_text(encoding='utf8'))
    function = next(node for node in module.body if isinstance(node, ast.FunctionDef) and node.name == 'names_in')
    namespace = {}
    exec(compile(ast.Module(body=[function], type_ignores=[]), 'names_in', 'exec'), namespace)
    guides = {}
    for path in sorted((ROOT / 'hacks').glob('*/data.json')):
        data = json.loads(path.read_text(encoding='utf8'))
        data = dict(data, IT=[section for section in data['IT'] if section.get('n') != 'Move Tutors'])
        guides[path.parent.name] = (data, sorted(namespace['names_in'](data)))
    return guides


def source_items(source):
    root = CACHE / source
    symbols = dict(re.findall(r'const\s+u(?:16|32)\s+(\w+)\[\]\s*=\s*INC\w+\("([^"]+)"',
                              (root / 'src/data/graphics/items.h').read_text(encoding='utf8')))
    symbols = {symbol: re.sub(r'\.4bpp(?:\.lz)?$', '.png', re.sub(r'\.gbapal(?:\.lz)?$', '.pal', path))
               for symbol, path in symbols.items()}
    text = (root / 'src/data/items.h').read_text(encoding='utf8')
    items = {}
    for block in re.split(r'\n\s*\[ITEM_', text)[1:]:
        constant = block.split(']', 1)[0]
        match = re.search(r'\.name\s*=\s*\w+\("([^"]+)"\)', block)
        pic = re.search(r'\.iconPic\s*=\s*(\w+)', block)
        palette = re.search(r'\.iconPalette\s*=\s*(\w+)', block)
        if match and pic and palette and pic[1] in symbols and palette[1] in symbols:
            record = {'source': source, 'picture': symbols[pic[1]], 'palette': symbols[palette[1]],
                      'constant': 'ITEM_' + constant}
            items[key(match[1])] = record
            items.setdefault(key(constant), record)
    return items, symbols


def palette_image(record):
    root = CACHE / record['source']
    with Image.open(root / record['picture']) as original:
        if original.mode != 'P':
            raise ValueError(f'Expected indexed source: {record}')
        pixels = original.copy()
    words = (root / record['palette']).read_text(encoding='utf8').split()
    if words[:2] != ['JASC-PAL', '0100']:
        raise ValueError(f'Expected JASC palette: {record}')
    colours = [int(word) for word in words[3:]]
    if len(colours) != int(words[2]) * 3:
        raise ValueError(f'Invalid palette: {record}')
    pixels.putpalette(colours + [0] * (768 - len(colours)))
    pixels.info['transparency'] = 0
    image = pixels.convert('RGBA')
    if image.size != (24, 24) or image.getbbox() is None:
        raise ValueError(f'Expected nonempty 24x24 icon: {record}')
    return image


def discs(data, symbols):
    result = {}
    for section in data['IT']:
        if section.get('k') == 'npc':
            continue
        for row in section['r']:
            match = re.match(r'^(TM|HM|TR)\s*\d', row[0])
            if not match:
                continue
            if len(row) < 3 or not isinstance(row[2], int) or not 0 <= row[2] < len(data['MV']):
                continue
            move_type = data['MV'][row[2]]['t']
            kind = match[1].lower()
            pic_symbol = 'gItemIcon_' + ('HM' if kind == 'hm' else 'TM')
            pal_symbol = f'gItemIconPalette_{move_type}TMHM'
            if pic_symbol in symbols and pal_symbol in symbols:
                result[row[0]] = (f'{kind}-{move_type.lower()}', {
                    'source': 'expansion', 'picture': symbols[pic_symbol], 'palette': symbols[pal_symbol],
                    'move': data['M'][row[2]], 'type': move_type})
    return result


def packed(images):
    sheet = Image.new('RGBA', (16 * 24, max(1, (len(images) + 15) // 16) * 24))
    for position, image in enumerate(images):
        sheet.paste(image, (position % 16 * 24, position // 16 * 24))
    buffer = io.BytesIO()
    sheet.save(buffer, 'PNG', optimize=True)
    return buffer.getvalue()


def build(check=False):
    guides = inventory()
    stock, symbols = source_items('expansion')
    custom, _ = source_items('imperium')
    candidates = dict(custom, **stock)
    images, provenance, mappings, missing = {}, {}, {}, {}
    for guide, (data, names) in guides.items():
        machines = discs(data, symbols)
        mappings[guide], missing[guide] = {}, {}
        for name in names:
            name_key = key(name)
            if name in machines:
                file_key, record = machines[name]
            elif re.match(r'^(TM|HM|TR)\s*\d', name):
                missing[guide][name] = 'No valid IT move link to determine the disc type.'
                continue
            elif name_key in candidates:
                file_key, record = name_key, candidates[name_key]
            else:
                missing[guide][name] = 'Absent from pinned expansion and Imperium item tables; fallback not yet sourced.'
                continue
            image = palette_image(record)
            if file_key in images and images[file_key].tobytes() != image.tobytes():
                raise ValueError(f'Conflicting artwork: {file_key}')
            images[file_key] = image
            provenance[file_key] = record
            mappings[guide][name_key] = file_key
    canonical, same, signatures = {}, {}, {}
    for file_key, image in sorted(images.items()):
        digest = hashlib.sha256(image.tobytes()).hexdigest()
        if digest in signatures:
            same[file_key] = signatures[digest]
        else:
            signatures[digest] = file_key
            canonical[file_key] = image
    keys, conflicts = {}, set()
    for mapping in mappings.values():
        for name_key, file_key in mapping.items():
            if name_key in keys and keys[name_key] != file_key:
                conflicts.add(name_key)
            keys.setdefault(name_key, file_key)
    for name_key in conflicts:
        keys.pop(name_key)
    index = {'keys': dict(sorted(keys.items())), 'same': same, 'guides': mappings,
             'pins': {source: pin for source, (_, pin) in PINS.items()}, 'ambiguous': sorted(conflicts)}
    report = {}
    for guide, (_, names) in guides.items():
        used = sorted({same.get(file_key, file_key) for file_key in mappings[guide].values()})
        sheet = packed([canonical[file_key] for file_key in used])
        report[guide] = {'names': len(names), 'with_icon': len(names) - len(missing[guide]),
                         'without_icon': len(missing[guide]), 'unique_icons': len(used),
                         'sheet_png_bytes': len(sheet), 'sheet_base64_bytes': len(base64.b64encode(sheet)),
                         'missing': missing[guide]}
        if not check:
            (CACHE / f'{guide}-sheet.png').write_bytes(sheet)
    outputs = {'index.json': json.dumps(index, ensure_ascii=False, indent=2) + '\n',
               'provenance.json': json.dumps(dict(sorted(provenance.items())), indent=2) + '\n',
               'coverage.json': json.dumps(report, ensure_ascii=False, indent=2) + '\n'}
    for filename, text in outputs.items():
        path = OUT / filename
        if check:
            if path.read_text(encoding='utf8') != text:
                raise ValueError(f'Stale generated file: {path}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf8')
    for file_key, image in canonical.items():
        path = OUT / 'png' / f'{file_key}.png'
        if check:
            with Image.open(path) as stored:
                if stored.size != (24, 24) or stored.convert('RGBA').tobytes() != image.tobytes():
                    raise ValueError(f'Stale icon: {path}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            image.save(path, 'PNG', optimize=True)
    if check:
        actual = {path.stem for path in (OUT / 'png').glob('*.png')}
        if actual != set(canonical):
            raise ValueError(f'Unexpected or absent icons: {actual ^ set(canonical)}')
    else:
        contact_sheet(images)
    print('| Guide | Names | With icon | Without | Unique art | Sheet base64 bytes |')
    print('| --- | ---: | ---: | ---: | ---: | ---: |')
    for guide, row in report.items():
        print(f"| {guide} | {row['names']} | {row['with_icon']} | {row['without_icon']} | {row['unique_icons']} | {row['sheet_base64_bytes']} |")
    print(f'{len(canonical)} PNGs, {len(same)} identical-art aliases, {len(conflicts)} ambiguous global keys')


def contact_sheet(images):
    width, height, columns = 150, 65, 8
    sheet = Image.new('RGB', (columns * width, ((len(images) + columns - 1) // columns) * height), '#dedede')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=11)
    for position, (file_key, image) in enumerate(sorted(images.items())):
        left, top = position % columns * width, position // columns * height
        sheet.paste(image, (left + (width - 24) // 2, top + 3), image)
        draw.text((left + 3, top + 31), file_key[:23], fill='black', font=font)
        if len(file_key) > 23:
            draw.text((left + 3, top + 44), file_key[23:], fill='black', font=font)
    sheet.save(ROOT / '.tmp/item-icons-contact.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true', help='Fetch missing pinned source files first')
    parser.add_argument('--check', action='store_true', help='Verify outputs without rewriting them')
    arguments = parser.parse_args()
    if arguments.fetch:
        fetch_sources()
    build(arguments.check)

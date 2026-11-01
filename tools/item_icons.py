"""Rebuild shared 24px item icons, coverage and review contact sheet.

Usage: uv run python -I tools/item_icons.py [--fetch] [--check]
Pinned sources are cached in .tmp/item-icons, never in published guides.
"""
import argparse
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
ALIASES = {
    'Beedrilite': 'Beedrillite', 'Luxite': 'Luxrite', 'Pasho Berry': 'Passho Berry',
    'Houndoomite': 'Houndoominite', 'Kangaskhite': 'Kangaskhanite',
    'Clever Wing': 'Clever Feather', 'Genius Wing': 'Genius Feather',
    'Health Wing': 'Health Feather', 'Muscle Wing': 'Muscle Feather',
    'Pretty Wing': 'Pretty Feather', 'Resist Wing': 'Resist Feather', 'Swift Wing': 'Swift Feather',
    'Stick': 'Leek', 'Lunar Wing': 'Lunar Feather', 'Link Cable': 'Linking Cord',
    'SS Aqua Ticket': 'S.S. Ticket', 'Mega Keystone': 'Key Stone',
    'Honey (Baile Style)': 'Honey', 'Red Nectar (Baile Style)': 'Red Nectar',
    'Fishing Rod': 'Fishing Rod SM',
    "Ilima's Normalium Z": 'Normalium Z',
}
SEREBII = {
    name: 'https://www.serebii.net/itemdex/sprites/' + key_name + '.png'
    for name, key_name in {
        'BridgeMail M': 'bridgemailm', 'BridgeMail T': 'bridgemailt', 'BridgeMail V': 'bridgemailv',
        'Favored Mail': 'favoredmail', 'Greet Mail': 'greetmail', 'Inquiry Mail': 'inquirymail',
        'Like Mail': 'likemail', 'RSVP Mail': 'rsvpmail', 'Reply Mail': 'replymail',
        'Thanks Mail': 'thanksmail',
        'Blue Petal': 'bluepetal', 'Colress Machine': 'colressmachine', 'Elevator Key': 'elevatorkey',
        'Fishing Rod': 'fishingrod', 'Forage Bag': 'foragebag', 'Green Petal': 'greenpetal',
        'Grubby Hanky': 'grubbyhanky', 'Intriguing Stone': 'intriguingstone',
        'Lab Key Card A': 'labkeycarda', 'Lab Key Card B': 'labkeycardb', 'Lab Key Card C': 'labkeycardc',
        'Left Poké Ball': 'leftpokeball', 'Looker Ticket': 'lookerticket', 'Orange Petal': 'orangepetal',
        'Permit': 'permit', 'Pink Petal': 'pinkpetal', 'Plasma Card': 'plasmacard',
        'Power Plant Pass': 'powerplantpass', "Professor's Mask": 'professorsmask',
        "Prof's Letter": "prof'sletter", 'Purple Petal': 'purplepetal', 'Rainbow Flower': 'rainbowflower',
        'Red Petal': 'redpetal', 'Ride Pager': 'ridepager', 'Roller Skates': 'rollerskates',
        'Sparkling Stone': 'sparklingstone', 'TMV Pass': 'tmvpass', 'Yellow Petal': 'yellowpetal',
    }.items()
}
MISSING_REASONS = {
    'Dropped Item': 'Ambiguous Xtransceiver: Curtis and Yancy have different artwork; the guide does not identify which.',
    'Pokégear Upgrade 1': 'A Pokégear feature upgrade, not a distinct bag item; no matching icon in the pinned Hardlove graphics.',
    'Blue-Striped Basculin: Deep Sea Scale (5% chance) Red-Striped Basculin: Deep Sea Tooth':
        'Malformed held-item label combines two different items. Both individual items have icons; selecting one would misrepresent this label.',
    'Silvally Memory': 'A generic memory label without a type. Type-specific memories have distinct palettes; the guide does not identify one.',
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
    candidates = hardlove_items()
    names = {name for _, guide_names in inventory().values() for name in guide_names}
    wanted = {key(ALIASES.get(name, name)) for name in names}
    paths = {record['picture'] for name_key, record in candidates.items() if name_key in wanted}
    repo, pin = PINS['hardlove']
    with ThreadPoolExecutor(max_workers=12) as pool:
        list(pool.map(lambda path: download(f'https://raw.githubusercontent.com/{repo}/{pin}/{path}',
                                           CACHE / 'hardlove' / path), sorted(paths)))
        list(pool.map(lambda pair: download(pair[1], CACHE / 'serebii' / (key(pair[0]) + '.png')),
                      SEREBII.items()))


def inventory():
    """Use the mockup's names_in inventory, retained here after plans are deleted."""
    guides = {}
    for path in sorted((ROOT / 'hacks').glob('*/data.json')):
        data = json.loads(path.read_text(encoding='utf8'))
        guides[path.parent.name] = (data, sorted(names_in(data)))
    return guides


def names_in(data):
    """The item-pages-mockup.py inventory, with Move Tutors excluded as requested."""
    found = {row[0] for section in data['IT'] if section.get('k') != 'npc'
             and section.get('n') != 'Move Tutors' for row in section['r']}
    for species in data['P']:
        found.update(species.get('hi') or [])
        if species.get('stone'):
            found.add(species['stone'])
    for group in data['TR']['g']:
        for section in group['sec']:
            for trainer in section['tr']:
                teams = [trainer['p']] + [mate.get('p', []) for mate in trainer.get('pt', [])]
                teams.append((trainer.get('normal') or {}).get('p', []))
                found.update(mon['i'] for team in teams for mon in team if mon.get('i'))
    found.update(row['i'] for row in data.get('MI', []) if row.get('i'))
    return found


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


def hardlove_items():
    tree = json.loads((CACHE / 'hardlove-tree.json').read_bytes())
    return {key(Path(entry['path']).stem): {'source': 'hardlove', 'picture': entry['path']}
            for entry in tree['tree'] if entry['path'].startswith('data/graphics/item/')
            and entry['path'].endswith('.png') and entry['sha'] != 'cd3bcb9e636866325bb3718c46ac6f73b6d78c00'}


def palette_image(record):
    root = CACHE / record['source']
    if 'palette' not in record:
        with Image.open(root / record['picture']) as original:
            pixels = original.copy()
        if record['source'] == 'hardlove':
            pixels.info['transparency'] = 0
        image = pixels.convert('RGBA')
        artwork = image.crop(image.getbbox())
        if artwork.width > 24 or artwork.height > 24:
            artwork.thumbnail((24, 24), Image.Resampling.NEAREST)
        canvas = Image.new('RGBA', (24, 24))
        canvas.paste(artwork, ((24 - artwork.width) // 2, (24 - artwork.height) // 2))
        return canvas
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
        if section.get('k') == 'npc' or section.get('n') == 'Move Tutors':
            continue
        for row in section['r']:
            match = re.match(r'^(TM|HM|TR)\s*\d', row[0])
            if not match:
                continue
            if len(row) < 3 or not isinstance(row[2], int) or not 0 <= row[2] < len(data['MV']):
                continue
            move_type = data['MV'][row[2]]['t']
            kind = match[1].lower()
            if kind == 'tr':
                continue
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
    candidates = dict(hardlove_items(), **custom)
    candidates.update(stock)
    images, provenance, mappings, missing = {}, {}, {}, {}
    fallback_pins = json.loads((OUT / 'fallbacks.json').read_bytes())
    for guide, (data, names) in guides.items():
        machines = discs(data, symbols)
        mappings[guide], missing[guide] = {}, {}
        for name in names:
            name_key = key(name)
            cleaned = re.sub(r'^\d+%\s+', '', name)
            lookup_key = key(ALIASES.get(cleaned, cleaned))
            if name in machines:
                file_key, record = machines[name]
            elif re.match(r'^(TM|HM|TR)\s*\d', name):
                missing[guide][name] = 'No valid IT move link to determine the disc type.'
                continue
            elif lookup_key in candidates:
                file_key, record = name_key, dict(candidates[lookup_key])
                if lookup_key != name_key:
                    record['alias'] = ALIASES.get(cleaned, cleaned)
            elif name in SEREBII:
                file_key = name_key
                record = {'source': 'serebii', 'picture': name_key + '.png', 'url': SEREBII[name]}
            else:
                missing[guide][name] = MISSING_REASONS.get(name,
                    'Unbound-specific item or collectible: no verified artwork in the pinned expansion, Imperium or Hardlove sets, or the Serebii item set. No substitute invented.')
                continue
            image = palette_image(record)
            if file_key in images and images[file_key].tobytes() != image.tobytes():
                raise ValueError(f'Conflicting artwork: {file_key}')
            images[file_key] = image
            for field in ['picture', 'palette']:
                if field in record:
                    record[field + '_sha256'] = hashlib.sha256((CACHE / record['source'] / record[field]).read_bytes()).hexdigest()
            if record['source'] == 'serebii':
                expected = fallback_pins[file_key]
                if expected['url'] != record['url'] or expected['sha256'] != record['picture_sha256']:
                    raise ValueError(f'Fallback source changed: {file_key}; review before updating fallbacks.json')
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
    outputs.update(documentation(report, provenance, canonical, same, conflicts))
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
    if not check:
        for path in (OUT / 'png').glob('*.png'):
            if path.stem not in canonical:
                path.unlink()
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


def documentation(report, provenance, canonical, same, conflicts):
    readme = ['# Shared item icon set', '',
        'Generated by `uv run python -I tools/item_icons.py`. Fetch on a fresh checkout with',
        '`uv run python -I tools/item_icons.py --fetch`; verify without rewriting with `--check`.',
        'Sources, pins, every asset URL and credits are in `SOURCES.md`. Do not edit generated PNGs or reports.', '',
        f'{len(canonical)} distinct 24 × 24 RGBA PNGs in `png/`; {len(same)} byte-identical artwork aliases.',
        'Keys are lower-case ASCII letters and digits (é becomes e). Discs use `tm-<type>` and `hm-<type>`.', '',
        '## Lookup contract', '',
        '`index.json` has `keys` (normalised item name → file key), `same` (file key → canonical file key),',
        '`guides` (guide → normalised item name → file key), `pins`, and `ambiguous`.',
        'Prefer `guides[guide][nameKey]`, falling back to `keys[nameKey]`, then follow `same` before loading',
        '`png/<canonical>.png`. Alias keys deliberately have no duplicate PNG. A missing key means no verified icon.',
        'The per-guide map is necessary because the same numbered HM can have different move types in different hacks:',
        ', '.join(f'`{name}`' for name in sorted(conflicts)) + '.',
        'TM/HM colour comes from that guide’s IT row move link into M/MV, never the machine number.',
        'There are no numbered TRs in the current inventory; future TR art needs an explicit source, not a TM stand-in.', '',
        '`provenance.json` records each logical icon’s source picture, actual palette, source hashes and explicit name aliases.',
        'Hack stones intentionally sharing a standard stone use the picture/palette assigned by the hack’s item table.',
        'For example, Imperium Butterfrite uses Abomasite art and Luxrite uses Beedrillite art in its pinned source.',
        'Known spelling errors, Wing/Feather and Stick/Leek names are explicit aliases, not fuzzy matches.',
        'Unbound held-item chance prefixes and Baile Style annotations are stripped for matching only; data is unchanged.',
        'Ilima’s Normalium Z uses the Normalium Z crystal; S.S. Aqua Ticket uses the S.S. Ticket.', '',
        '## Coverage and packed cost', '',
        'Inventory reuses `plans/item-pages-mockup.py`’s `names_in` logic, retained in the tool so deleting the completed',
        'plan does not break rebuilding: IT except NPC/Move Tutors, P.hi/P.stone, trainers/partners/normal teams and MI.i.',
        'Names are exact distinct displayed labels per guide, including misspellings and malformed labels.', '',
        '| Guide | Names | With icon | Without | Distinct art | Sheet PNG bytes | Base64 bytes |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: |']
    for guide, row in report.items():
        readme.append(f"| {guide} | {row['names']} | {row['with_icon']} | {row['without_icon']} | {row['unique_icons']} | {row['sheet_png_bytes']} | {row['sheet_base64_bytes']} |")
    readme += ['', 'Each guide sheet contains its canonical art only, sorted by file key, 16 icons per row, 24px cells,',
        'PNG `optimize=True`, lossless RGBA with no palette quantisation. Base64 counts exclude the 22-byte data URI prefix.',
        'These measured lossless costs exceed the earlier 70–100 KB estimate; the mockup used a lossy 255-colour sheet.',
        'Review sheets are written to `.tmp/item-icons/<guide>-sheet.png`, not published or committed.', '',
        '## Missing icons', '']
    for guide, row in report.items():
        readme += [f'### {guide}', '']
        readme += [f'- **{name}**: {reason}' for name, reason in row['missing'].items()] or ['None.']
        readme.append('')
    readme += ['## Validation', '',
        '`uv run python -I tools/test_item_icons.py` checks inventory, aliases, palette application, placeholder rejection,',
        'per-guide disc types, packed costs and deterministic output. `--check` compares every generated file and pixel.',
        '`.tmp/item-icons-contact.png` labels every logical icon for visual inspection. Hardlove’s shared question-mark',
        'placeholder blob is rejected, not counted as coverage. Browser/build gates do not apply: no guide inputs,',
        'templates, extraction scripts or dist files are changed.', '']
    sources = ['# Shared item icons: sources', '', 'Fetched 2026-11-01. Rebuilt by `tools/item_icons.py`.', '',
        '## Pins and fetch', '', '```sh', 'uv sync', 'uv run python -I tools/item_icons.py --fetch',
        'uv run python -I tools/item_icons.py --check', '```', '',
        'Fetch uses GitHub recursive trees at exact commits and raw URLs; sources stay in ignored `.tmp/item-icons/`.',
        'Each URL below is an input, not a runtime request. The script reapplies JASC palettes to expansion/EI indices;',
        'colour zero is transparent. Hardlove PNGs use their embedded palette with index zero transparent.',
        'Non-24px fallback frames are cropped to visible artwork, centred on 24px, and reduced with nearest-neighbour',
        'only if their visible bounds exceed 24px. Serebii uses the existing transparent RGBA pixels.', '',
        '## Counts', '', '| Source | Logical keys (including aliases) | Stored canonical PNGs |',
        '| --- | ---: | ---: |']
    for source in [*PINS, 'serebii']:
        logical = sum(record['source'] == source for record in provenance.values())
        stored = sum(provenance[file_key]['source'] == source for file_key in canonical)
        sources.append(f'| {source} | {logical} | {stored} |')
    sources += ['', 'Canonical counts assign shared art to its lexicographically first key; another source may provide',
        'identical art. `provenance.json` preserves the actual source for each logical key.', '',
        '## Terms and credits', '',
        'Pokémon and item art © Nintendo / Creatures Inc. / GAME FREAK inc.; guides are free and non-commercial.',
        'Credits: rh-hideout/pokeemerald-expansion, pret/pokeemerald, iriv24/Emerald Imperium, kumakuma1/Hardlove,',
        'BluRosie/hg-engine and their contributors; Serebii for the fallback item images.',
        'The expansion has no licence file; see the parent `sprites/SOURCES.md` and its upstream credits.',
        'https://github.com/rh-hideout/pokeemerald-expansion/blob/73b3fbeb574327cd9420c89e56bef5aa3c08fead/CREDITS.md', '',
        '## Exact source URLs', '']
    for source, (repo, pin) in PINS.items():
        sources += [f'### {source}: `{repo}`', '', f'Pin: `{pin}`.', '',
            f'https://api.github.com/repos/{repo}/git/trees/{pin}?recursive=1', '']
        paths = {record[field] for record in provenance.values() if record['source'] == source
                 for field in ['picture', 'palette'] if field in record}
        if source != 'hardlove':
            paths.update(['src/data/items.h', 'src/data/graphics/items.h', 'include/constants/items.h'])
        sources += [f'- https://raw.githubusercontent.com/{repo}/{pin}/{path}' for path in sorted(paths)] + ['']
    sources += ['### Serebii', '',
        'Unversioned URLs; SHA-256 of fetched source bytes is recorded in `fallbacks.json` and enforced on rebuild.',
        'The 29 Hardlove assets with blob `cd3bcb9e636866325bb3718c46ac6f73b6d78c00` are question-mark placeholders.',
        'They were rejected after contact-sheet review; 28 use Serebii replacements and Ilima’s crystal uses Normalium Z.', '']
    sources += [f'- {name}: {url}' for name, url in sorted(SEREBII.items())]
    sources += ['', '## Alias audit', '', '| Name key | Resolved item name |', '| --- | --- |']
    sources += [f"| {name} | {record['alias']} |" for name, record in sorted(provenance.items()) if 'alias' in record]
    return {'README.md': '\n'.join(readme), 'SOURCES.md': '\n'.join(sources) + '\n'}


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

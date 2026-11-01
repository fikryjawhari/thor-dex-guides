"""Per-guide item sheets. Rebuild with uv run python -I tools/item_sheets.py [--check] [hack ...].

Only build() needs Pillow; assembly uses the stdlib lookup and validation helpers.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / 'sprites' / 'items'
SHEETS = ICONS / 'sheets'


def names_in(data):
    found = {row[0] for section in data.get('IT', []) if section.get('k') != 'npc'
             and section.get('n') != 'Move Tutors' for row in section['r']}
    for species in data.get('P', []):
        found.update(species.get('hi') or [])
        if species.get('stone'):
            found.add(species['stone'])
    for group in data.get('TR', {}).get('g', []):
        for section in group['sec']:
            for trainer in section['tr']:
                teams = [trainer['p']] + [mate.get('p', []) for mate in trainer.get('pt', [])]
                teams.append((trainer.get('normal') or {}).get('p', []))
                found.update(mon['i'] for team in teams for mon in team if mon.get('i'))
    found.update(row['i'] for row in data.get('MI', []) if row.get('i'))
    walk = data.get('WK', {})
    rows = list(walk.get('np', []))
    rows.extend(row for split in walk.get('splits', []) for stop in split['st'] for row in stop.get('it', []))
    found.update(row[1] for row in rows if row[0] not in ('Useful NPCs', 'Move Tutors'))
    return sorted(found)


def lookup(guide, data):
    index = json.loads((ICONS / 'index.json').read_bytes())
    own = index['guides'].get(guide, {})
    mapped, missing = {}, []
    for name in names_in(data):
        name_key = re.sub('[^a-z0-9]', '', unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower())
        file_key = own.get(name_key, index['keys'].get(name_key))
        if file_key:
            mapped[name] = index['same'].get(file_key, file_key)
        else:
            missing.append(name)
    return mapped, missing


def source_hash(keys):
    digest = hashlib.sha256()
    for file_key in keys:
        digest.update(file_key.encode() + b'\0')
        digest.update((ICONS / 'png' / (file_key + '.png')).read_bytes())
    return digest.hexdigest()


def inline(guide, data):
    mapped, missing = lookup(guide, data)
    keys = sorted(set(mapped.values()))
    manifest = json.loads((SHEETS / (guide + '.json')).read_bytes())
    sheet = (SHEETS / (guide + '.png')).read_bytes()
    if (manifest['keys'] != keys or manifest['source_sha256'] != source_hash(keys)
            or manifest['sheet_sha256'] != hashlib.sha256(sheet).hexdigest()):
        raise ValueError(f'{guide}: stale item sheet; run uv run python -I tools/item_sheets.py {guide}')
    slots = {file_key: slot for slot, file_key in enumerate(keys)}
    return sheet, {name: slots[file_key] for name, file_key in mapped.items()}, missing


def build(guide, check=False):
    from PIL import Image

    data = json.loads((ROOT / 'hacks' / guide / 'data.json').read_bytes())
    mapped, missing = lookup(guide, data)
    keys = sorted(set(mapped.values()))
    sheet = Image.new('RGBA', (16 * 24, max(1, (len(keys) + 15) // 16) * 24))
    for slot, file_key in enumerate(keys):
        with Image.open(ICONS / 'png' / (file_key + '.png')) as image:
            if image.size != (24, 24):
                raise ValueError(f'{file_key}: item icon must be 24 x 24')
            sheet.paste(image.convert('RGBA'), (slot % 16 * 24, slot // 16 * 24))
    sheet = sheet.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    buffer = io.BytesIO()
    sheet.save(buffer, 'PNG', optimize=True)
    packed = buffer.getvalue()
    manifest = {'keys': keys, 'source_sha256': source_hash(keys), 'sheet_sha256': hashlib.sha256(packed).hexdigest()}
    text = json.dumps(manifest, indent=2) + '\n'
    if check:
        if (SHEETS / (guide + '.png')).read_bytes() != packed or (SHEETS / (guide + '.json')).read_text() != text:
            raise ValueError(f'{guide}: stale item sheet')
    else:
        SHEETS.mkdir(parents=True, exist_ok=True)
        (SHEETS / (guide + '.png')).write_bytes(packed)
        (SHEETS / (guide + '.json')).write_text(text, encoding='utf-8', newline='\n')
    print(f'{guide}: {len(keys)} icons, {len(mapped)} names, {len(missing)} missing, {len(packed)} sheet bytes')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('hacks', nargs='*')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    guides = args.hacks or sorted(path.parent.name for path in (ROOT / 'hacks').glob('*/data.json'))
    for guide in guides:
        build(guide, args.check)


if __name__ == '__main__':
    main()

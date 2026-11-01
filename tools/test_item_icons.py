"""Regression checks: uv run python -I tools/test_item_icons.py."""
import ast
import copy
import hashlib
import json
from pathlib import Path
import sys

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import item_icons


def test_inventory():
    data = {'IT': [{'n': 'Items', 'r': [['Potion']]},
                   {'n': 'Useful NPCs', 'k': 'npc', 'r': [['Not an item']]},
                   {'n': 'Move Tutors', 'k': 'tm', 'r': [['Not a machine']]}],
            'P': [{'hi': ['Held Berry'], 'stone': 'Mega Stone'}],
            'TR': {'g': [{'sec': [{'tr': [{'p': [{'i': 'Trainer Item'}],
                  'pt': [{'p': [{'i': 'Partner Item'}]}], 'normal': {'p': [{'i': 'Normal Item'}]}}]}]}]},
            'MI': [{'i': 'Move Item'}]}
    assert item_icons.names_in(data) == {'Potion', 'Held Berry', 'Mega Stone', 'Trainer Item',
                                         'Partner Item', 'Normal Item', 'Move Item'}
    data['P'][0]['hi'] = [['Held Berry', None], ['Rare Berry', 5]]
    assert {'Held Berry', 'Rare Berry'} <= item_icons.names_in(data)
    mockup = item_icons.ROOT / 'plans/item-pages-mockup.py'
    if mockup.exists():
        tree = ast.parse(mockup.read_text(encoding='utf8'))
        function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'names_in')
        namespace = {}
        exec(compile(ast.Module(body=[function], type_ignores=[]), 'mockup_inventory', 'exec'), namespace)
        for data, names in item_icons.inventory().values():
            filtered = copy.copy(data)
            filtered['IT'] = [section for section in data['IT'] if section.get('n') != 'Move Tutors']
            filtered['P'] = [dict(species, hi=[held[0] if isinstance(held, list) else held
                                             for held in species.get('hi', [])]) for species in data['P']]
            assert set(names) == namespace['names_in'](filtered)


def test_palettes_and_sources():
    records = json.loads((item_icons.OUT / 'provenance.json').read_bytes())
    index = json.loads((item_icons.OUT / 'index.json').read_bytes())
    for file_key, record in records.items():
        image = item_icons.palette_image(record)
        assert image.size == (24, 24)
        assert image.mode == 'RGBA'
        assert image.getbbox()
        assert image.getextrema()[3][0] == 0
        assert 'question_mark' not in record['picture']
        for field in ['picture', 'palette']:
            if field in record:
                raw = (item_icons.CACHE / record['source'] / record[field]).read_bytes()
                assert hashlib.sha256(raw).hexdigest() == record[field + '_sha256']
                if record['source'] == 'hardlove':
                    blob = b'blob ' + str(len(raw)).encode() + b'\0' + raw
                    assert hashlib.sha1(blob).hexdigest() != 'cd3bcb9e636866325bb3718c46ac6f73b6d78c00'
        canonical = index['same'].get(file_key, file_key)
        with Image.open(item_icons.OUT / 'png' / f'{canonical}.png') as stored:
            assert stored.convert('RGBA').tobytes() == image.tobytes()
    assert records['butterfrite']['source'] == 'imperium'
    assert records['butterfrite']['picture'].endswith('/abomasite.png')
    assert records['kickingshoes']['picture'].endswith('/heavy_duty_boots.png')
    assert records['luxite']['palette'].endswith('/beedrillite.pal')
    stock, _ = item_icons.source_items('expansion')
    record = stock['potion']
    with Image.open(item_icons.CACHE / 'expansion' / record['picture']) as indexed:
        image = item_icons.palette_image(record)
        colours = (item_icons.CACHE / 'expansion' / record['palette']).read_text().split()[3:]
        for position, colour_index in enumerate(indexed.get_flattened_data()):
            actual = image.getpixel((position % 24, position // 24))
            assert actual[:3] == tuple(int(channel) for channel in colours[3 * colour_index:3 * colour_index + 3])
            assert actual[3] == (255 if colour_index else 0)


def test_discs_and_coverage():
    index = json.loads((item_icons.OUT / 'index.json').read_bytes())
    report = json.loads((item_icons.OUT / 'coverage.json').read_bytes())
    _, symbols = item_icons.source_items('expansion')
    assert item_icons.key('Poké Ball') == 'pokeball'
    for guide, (data, names) in item_icons.inventory().items():
        row = report[guide]
        assert row['names'] == len(names)
        assert row['with_icon'] + row['without_icon'] == len(names)
        mapping = index['guides'][guide]
        for name in names:
            assert (item_icons.key(name) in mapping) != (name in row['missing'])
        for name, (file_key, record) in item_icons.discs(data, symbols).items():
            assert mapping[item_icons.key(name)] == file_key
            assert file_key.endswith('-' + record['type'].lower())
        used = sorted({index['same'].get(file_key, file_key) for file_key in mapping.values()})
        images = [Image.open(item_icons.OUT / 'png' / f'{file_key}.png').convert('RGBA') for file_key in used]
        packed = item_icons.packed(images)
        assert len(packed) == row['sheet_png_bytes']
        assert ((len(packed) + 2) // 3) * 4 == row['sheet_base64_bytes']
        assert len(used) == row['unique_icons']
    assert 'hm01cut' in index['ambiguous']
    assert 'hm01cut' not in index['keys']
    for file_key, target in index['same'].items():
        assert target not in index['same']
        assert not (item_icons.OUT / 'png' / f'{file_key}.png').exists()
        assert (item_icons.OUT / 'png' / f'{target}.png').exists()


if __name__ == '__main__':
    test_inventory()
    test_palettes_and_sources()
    test_discs_and_coverage()
    item_icons.build(check=True)
    print('PASS: item icon inventory, sources, palettes, aliases, discs, coverage and deterministic rebuild')

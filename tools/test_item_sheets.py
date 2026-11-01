"""Regression checks: uv run python -I tools/test_item_sheets.py."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import item_sheets


def test_inventory():
    data = {'IT': [{'n': 'Items', 'r': [['Potion']]},
                   {'n': 'Useful NPCs', 'k': 'npc', 'r': [['Not an item']]},
                   {'n': 'Move Tutors', 'r': [['Not a machine']]}],
            'P': [{'hi': ['Held Berry'], 'stone': 'Mega Stone'}],
            'TR': {'g': [{'sec': [{'tr': [{'p': [{'i': 'Trainer Item'}],
                   'pt': [{'p': [{'i': 'Partner Item'}]}], 'normal': {'p': [{'i': 'Normal Item'}]}}]}]}]},
            'MI': [{'i': 'Move Item'}],
            'WK': {'splits': [{'st': [{'it': [['Items', 'Walk-only Item', 'Found']]}]}],
                   'np': [['Key Items', 'No-place Item', 'Gift'], ['Useful NPCs', 'Not an item', 'Talk']]}}
    assert item_sheets.names_in(data) == sorted(['Potion', 'Held Berry', 'Mega Stone', 'Trainer Item',
                                               'Partner Item', 'Normal Item', 'Move Item',
                                               'Walk-only Item', 'No-place Item'])


def test_lookup():
    index = {'keys': {'pokeitem': 'global', 'fallback': 'alias'},
             'guides': {'test': {'pokeitem': 'own'}}, 'same': {'alias': 'canonical'}}
    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)
        (directory / 'index.json').write_text(json.dumps(index))
        with patch.object(item_sheets, 'ICONS', directory):
            mapped, missing = item_sheets.lookup('test', {'MI': [{'i': name} for name in ['Poké Item', 'Fallback', 'Missing']]})
    assert mapped == {'Fallback': 'canonical', 'Poké Item': 'own'}
    assert missing == ['Missing']


def test_sheets():
    for path in sorted((item_sheets.ROOT / 'hacks').glob('*/data.json')):
        guide = path.parent.name
        data = json.loads(path.read_bytes())
        packed, slots, missing = item_sheets.inline(guide, data)
        mapped, expected_missing = item_sheets.lookup(guide, data)
        assert missing == expected_missing
        assert set(slots) == set(mapped)
        keys = sorted(set(mapped.values()))
        with Image.open(item_sheets.SHEETS / (guide + '.png')) as sheet:
            assert sheet.mode == 'P' and len(sheet.getpalette()) == 256 * 3
            assert sheet.size == (384, max(1, (len(keys) + 15) // 16) * 24)
            rgba = sheet.convert('RGBA')
            for name, slot in slots.items():
                assert keys[slot] == mapped[name]
                cell = rgba.crop((slot % 16 * 24, slot // 16 * 24, slot % 16 * 24 + 24, slot // 16 * 24 + 24))
                with Image.open(item_sheets.ICONS / 'png' / (mapped[name] + '.png')) as source:
                    before = source.convert('RGBA').getchannel('A').tobytes()
                    after = cell.getchannel('A').tobytes()
                    assert all(new == 0 for old, new in zip(before, after) if old == 0)
                    assert all(new > 0 for old, new in zip(before, after) if old == 255)
        manifest = json.loads((item_sheets.SHEETS / (guide + '.json')).read_bytes())
        manifest['sheet_sha256'] = 'invalid'
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            (directory / (guide + '.json')).write_text(json.dumps(manifest))
            (directory / (guide + '.png')).write_bytes(packed)
            with patch.object(item_sheets, 'SHEETS', directory):
                try:
                    item_sheets.inline(guide, data)
                except ValueError as error:
                    assert 'stale item sheet' in str(error)
                else:
                    raise AssertionError('Corrupt sheet manifest accepted')
        assert hashlib.sha256(packed).hexdigest() != manifest['sheet_sha256']
        print(f'PASS {guide}: slots, dimensions, palette, transparency, stale-sheet rejection')


if __name__ == '__main__':
    test_inventory()
    test_lookup()
    test_sheets()
    print('PASS item sheets')

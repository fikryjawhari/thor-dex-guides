"""Item bag text from the user's Black 2 Redux ROM: writes extract/item_desc.json (committed; build.py reads it).

Reads hacks/blaze-black-2-redux/.src/rom/*.nds (read only, never committed). Text NARC a/0/0/2 (B2W2 system text):
member 64 holds the item names and member 63 the item descriptions, one line each, the same index in both (639).
Each line has an 8-byte entry at 0x18 (count, offset from 0x10). Characters are XOR-encrypted with a key that starts
at 0x2983 * line + 0xA60C and is rotated left 3 bits after each character; 0xFFFF ends a line and 0xFFFE is a line
break (a space). Line order is not item-id order, so the name decides the item.

Output {guide item name: [description, changed]}; changed is 0 (no vanilla text to compare with here). TMs / HMs:
no entry. A name repeated in the bank keeps its first line (the repeats are reported). Usage (repo root):
  python -I hacks/blaze-black-2-redux/extract/item_desc.py
"""
import glob
import json
import struct
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'tools'))
sys.path.insert(0, str(HERE))
import ndsrom  # noqa: E402
from common import report  # noqa: E402
import gid  # noqa: E402

TEXT = 'a/0/0/2'
NAMES, DESCRIPTIONS = 64, 63
LINE_TABLE, DATA = 0x18, 0x10
LINE_BREAK, END = 0xFFFE, 0xFFFF
# The bank's name for an item the guide names otherwise (the docs' 'X Defense').
ALIASES = {'X Defend': 'X Defense'}


def rotl3(key):
    return ((key << 3) | (key >> 13)) & 0xFFFF


def line(bank, index):
    """One decrypted line, read to its terminator; line 638's offset points past the bank, so reads stop there."""
    _, offset = struct.unpack_from('<II', bank, LINE_TABLE + 8 * index)
    key = (0x2983 * index + 0xA60C) & 0xFFFF
    out, pos = [], DATA + offset
    while pos + 2 <= len(bank):
        char = struct.unpack_from('<H', bank, pos)[0] ^ key
        pos += 2
        key = rotl3(key)
        if char in (0, END):
            break
        out.append(char)
    return out


def text(chars):
    return ''.join(' ' if c == LINE_BREAK else chr(c) for c in chars)


def read(rom_path):
    """{guide item name: [description, 0]} from the ROM's text bank, in bank order."""
    text_narc = ndsrom.Rom(rom_path).narc(TEXT)
    names_bank, desc_bank = text_narc.get(NAMES), text_narc.get(DESCRIPTIONS)
    count = struct.unpack_from('<H', names_bank, 2)[0]
    assert count == struct.unpack_from('<H', desc_bank, 2)[0] == 639, 'both banks: 639 lines'
    out, repeated, unlisted, garbage = {}, [], [], 0
    listed = set(json.loads((HERE / 'gen5-ids.json').read_text(encoding='utf-8'))['items'])
    for index in range(count):
        name = text(line(names_bank, index))
        if '?' in name or not (name.isprintable() and all(ord(ch) < 0x100 for ch in name)):
            garbage += 1            # an unused slot ('???') or an unreadable line: no item
            continue
        guide = ALIASES.get(gid.item_names([name])[0], gid.item_names([name])[0])
        if name not in listed:
            unlisted.append(f'{index} {name}')
        if guide.startswith(('TM', 'HM')):
            continue
        if guide in out:
            repeated.append(f'{index} {guide}')
            continue
        out[guide] = [' '.join(text(line(desc_bank, index)).split()), 0]
    print(f"unused or unreadable name lines: {garbage}")
    return out, repeated, unlisted


def main():
    rom_path = glob.glob(str(HERE.parent / '.src' / 'rom' / '*.nds'))
    assert len(rom_path) == 1, "put the user's ROM in hacks/blaze-black-2-redux/.src/rom/ (one .nds)"
    out, repeated, unlisted = read(rom_path[0])
    body = ',\n'.join(f'  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}'
                      for k, v in out.items())
    (HERE / 'item_desc.json').write_text('{\n' + body + '\n}\n', encoding='utf-8')
    print(f'item descriptions: {len(out)}; repeated names (first kept): {", ".join(repeated) or "none"}')
    print(f'names not in gen5-ids: {len(unlisted)}: {", ".join(unlisted)}')


def build(data):
    """IX from item_desc.json (no in-battle text yet: the shared battle_text set is a later unit)."""
    descriptions = json.loads((HERE / 'item_desc.json').read_text(encoding='utf-8'))
    data['IX'] = {name: [bag, '', changed] for name, (bag, changed) in descriptions.items()}
    report(f'item text: {len(data["IX"])} IX entries from the ROM bag text (no in-battle text yet)')


if __name__ == '__main__':
    main()

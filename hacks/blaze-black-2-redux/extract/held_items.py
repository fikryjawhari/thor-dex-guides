"""Wild held items from the user's Black 2 Redux ROM: writes extract/held_items.json (committed; build.py reads it).

Reads hacks/blaze-black-2-redux/.src/rom/*.nds (the user's dump, read only, never committed): NARC a/0/1/6 is the
personal table, 76 bytes per entry, base species at their national number (1..649), forms after them (650..709).
Three u16 wild held-item slots at 0x0C (50%), 0x0E (5%), 0x10 (1%); 0 = none. Item ids are the game's
(gen5-ids.json items). Only entries with a held item are written, as "dex:form" keys (gen5-ids forms rows):
a base species with no item is absent, so the build shows none.

The layout is checked on known entries (Latios / Latias / Giratina carry Soul Dew / Griseous Orb in all three
slots; Giratina Origin, member 691, is identified by its base stats). Usage (repo root):
  python -I hacks/blaze-black-2-redux/extract/held_items.py
"""
import glob
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'tools'))
import ndsrom  # noqa: E402

PERSONAL = 'a/0/1/6'
ENTRY = 76
PERSONAL_ENTRIES = 709                                     # 649 species + 60 forms; member 709 is a filler table
SLOTS = 0x0C
FORMS = {691: ('487:1', (150, 120, 100, 90, 120, 100))}     # member -> (gen5-ids key, base stats) for form entries


def main():
    rom_path = glob.glob(str(HERE.parent / '.src' / 'rom' / '*.nds'))
    assert len(rom_path) == 1, 'put the user\'s ROM in hacks/blaze-black-2-redux/.src/rom/ (one .nds)'
    personal = ndsrom.Rom(rom_path[0]).narc(PERSONAL)
    ids = json.loads((HERE / 'gen5-ids.json').read_text(encoding='utf-8'))
    species = ids['species']
    assert species[143] == 'Snorlax' and species[381] == 'Latios', 'gen5-ids species order'
    assert len(personal) == PERSONAL_ENTRIES + 1, 'personal NARC: 709 entries plus the filler table'
    held, skipped = {}, []
    for member in range(PERSONAL_ENTRIES):
        entry = personal.get(member)
        assert len(entry) == ENTRY, f'member {member}: {len(entry)} bytes'
        slots = [int.from_bytes(entry[SLOTS + i * 2:SLOTS + i * 2 + 2], 'little') for i in range(3)]
        if not any(slots):
            continue
        if max(slots) >= len(ids['items']):
            skipped.append(f'{member} (slots {slots})')
            continue
        if member <= 649:
            key = f'{member}:0'
        else:
            assert member in FORMS, f'member {member} holds {slots} and is not identified'
            key, base = FORMS[member]
            assert tuple(entry[:6]) == base, f'member {member} stats are not {base}'
        held[key] = slots
    lines = [f'  "{key}": [{", ".join(map(str, slots))}]'
             for key, slots in sorted(held.items(), key=lambda kv: tuple(map(int, kv[0].split(':'))))]
    source = f'{Path(rom_path[0]).name}, narc {PERSONAL} (76-byte entries, slots at 0x0C / 0x0E / 0x10)'
    (HERE / 'held_items.json').write_text('{\n  "source": ' + json.dumps(source) + ',\n  "held": {\n'
                                          + ',\n'.join(lines) + '\n  }\n}\n', encoding='utf-8')
    for key, slots in held.items():
        dex = int(key.split(':')[0])
        print(key, species[dex], [ids['items'][s] for s in slots])
    print('skipped (item ids outside the game table):', ', '.join(skipped) or 'none')


if __name__ == '__main__':
    main()

"""Read-only encounter merge audit against the user's BB2R ROM, not vanilla map names.

Zone numbers and the 48-byte a/0/1/2 header layout (place u16 at 26, low ten bits) are from
fuddlesworth/pokebw2 at 41f42ca1afe6291f00b0ba0ec3f6099b9ff1346c, generated/zones.txt and tools/data/zone_data.py.
Run with the same .src/rom/*.nds used by held_items.py. No ROM data is written or distributed.
"""
from pathlib import Path
import struct
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import H
import ndsrom

GROUPS = {
    'Relic Castle': (list(range(160, 191)), {35}),
    'Celestial Tower': (list(range(338, 343)), {56}),
    'Seaside Cave': ([515, 516], {141}),
    'Victory Road': (list(range(214, 229)) + [573] + list(range(587, 597)) + [602], {40, 134}),
    'Virbank Complex': ([456, 457], {131, 154}),
    'Reversal Mountain': ([461] + list(range(531, 543)), {132}),
    'Pinwheel Forest': ([154, 155], {33}),
}


def main():
    rom = list((Path(H.src) / 'rom').glob('*.nds'))
    assert len(rom) == 1, 'expected one user ROM in .src/rom/'
    headers = ndsrom.Rom(rom[0]).narc('a/0/1/2').get(0)
    assert len(headers) % 48 == 0
    for name, (zones, expected) in GROUPS.items():
        places = {struct.unpack_from('<H', headers, zone * 48 + 26)[0] & 1023 for zone in zones}
        assert places == expected, (name, places, expected)
        print('%s: %d map headers; place IDs %s' % (name, len(zones), ', '.join(map(str, sorted(places)))))
    print('Virbank has two place IDs; merged by the task default, not claimed to be one met location.')
    print('Victory Road 40 is the old BW maps; current B2W2 maps use 134 (including entrance zone 602).')


if __name__ == '__main__':
    main()

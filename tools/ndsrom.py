"""Read files out of a Nintendo DS ROM (.nds) and the NARC archives inside it, read-only, stdlib only.

ROM layout: header (FNT / FAT offsets at 0x40), the file name table (directories and names) and the file allocation
table (start / end per file id). A NARC is 'NARC' + 'BTAF' (per-member start / end) + 'BTNF' + 'GMIF' (the data).
Used by the extract scripts that read the user's own dump (hacks/<hack>/.src/rom/, never committed).

  python -I tools/ndsrom.py ls <rom.nds> [dir]          # file paths under dir (default: root)
  python -I tools/ndsrom.py narc <rom.nds> <path> [n]   # member count, or member n's size
"""
import struct
import sys


class Rom:
    def __init__(self, path):
        self.path = path
        self.file = open(path, 'rb')
        head = self.read(0, 0x200)
        fnt_off, fnt_size, fat_off, fat_size = struct.unpack_from('<IIII', head, 0x40)
        self.fat = [struct.unpack_from('<II', self.read(fat_off, fat_size), i * 8)
                    for i in range(fat_size // 8)]
        self.paths = {}
        self._walk(self.read(fnt_off, fnt_size))

    def read(self, offset, size):
        self.file.seek(offset)
        return self.file.read(size)

    def _walk(self, fnt):
        """Fill self.paths with 'a/0/1/6' -> file id, from the directory table (8 bytes per directory)."""
        dirs = [struct.unpack_from('<IHH', fnt, i * 8) for i in range(struct.unpack_from('<H', fnt, 6)[0])]
        names = {0xF000: ''}
        stack = [(0xF000, 0)]
        while stack:
            dir_id, _ = stack.pop()
            sub_off, first_file, _ = dirs[dir_id & 0xFFF]
            prefix = names[dir_id]
            pos, file_id = sub_off, first_file
            while True:
                length = fnt[pos]
                pos += 1
                if length == 0:
                    break
                is_dir = length & 0x80
                name = fnt[pos:pos + (length & 0x7F)].decode('utf-8', 'replace')
                pos += length & 0x7F
                if is_dir:
                    child = struct.unpack_from('<H', fnt, pos)[0]
                    pos += 2
                    names[child] = prefix + name + '/'
                    stack.append((child, 0))
                else:
                    self.paths[prefix + name] = file_id
                    file_id += 1

    def file_bytes(self, path):
        start, end = self.fat[self.paths[path.strip('/')]]
        return self.read(start, end - start)

    def narc(self, path):
        return Narc(self.file_bytes(path))


class Narc:
    """NARC members: data offset = the GMIF chunk's payload; BTAF lists start / end per member."""

    def __init__(self, data):
        assert data[:4] == b'NARC', 'not a NARC'
        self.data = data
        btaf = 0x10
        assert data[btaf:btaf + 4] == b'BTAF', 'no BTAF chunk'
        count = struct.unpack_from('<H', data, btaf + 8)[0]
        self.members = [struct.unpack_from('<II', data, btaf + 12 + i * 8) for i in range(count)]
        pos = 0x10
        while data[pos:pos + 4] != b'GMIF':
            pos += struct.unpack_from('<I', data, pos + 4)[0]
        self.base = pos + 8

    def __len__(self):
        return len(self.members)

    def get(self, index):
        start, end = self.members[index]
        return self.data[self.base + start:self.base + end]


def main(argv):
    rom = Rom(argv[1])
    if argv[0] == 'ls':
        prefix = argv[2].strip('/') + '/' if len(argv) > 2 else ''
        for path in sorted(rom.paths):
            if path.startswith(prefix):
                print(path)
    elif argv[0] == 'narc':
        narc = rom.narc(argv[2])
        if len(argv) > 3:
            print(len(narc.get(int(argv[3]))))
        else:
            print(len(narc))


if __name__ == '__main__':
    main(sys.argv[1:])

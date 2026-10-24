"""Read 3DS Pokémon GARC archives (XY / ORAS / SM / USUM), LZ11 entries, mini packs and game text files.

Ported from pk3DS (GARC.cs, LZSS.cs, Mini.cs, TextFile.cs). Import it, or run it:
  python -I garc.py ls <garc>                  # entry count and per-entry sizes
  python -I garc.py text <garc> <file#>        # print one text file from a text GARC, line = ID
"""
import os, struct, sys


def read_archive(roots, path):
    """Return raw GARC entries and the first root containing the archive."""
    for root in roots:
        archive_path = os.path.join(root, path)
        if os.path.exists(archive_path):
            return read_garc(archive_path), root
    raise FileNotFoundError(path)


def read_garc(path):
    """Return the list of entry payloads (bytes), first sub-entry of each, LZ11 left as is."""
    data = open(path, "rb").read()
    if data[:4] != b"CRAG":
        raise ValueError(f"{path}: not a GARC")
    header_size, = struct.unpack_from("<I", data, 4)
    data_offset, = struct.unpack_from("<I", data, 0x10)
    # FATO
    p = header_size
    assert data[p:p + 4] == b"OTAF"
    fato_size, count = struct.unpack_from("<IH", data, p + 4)
    p += fato_size
    # FATB
    assert data[p:p + 4] == b"BTAF"
    fatb_size, fatb_count = struct.unpack_from("<II", data, p + 4)
    q = p + 12
    out = []
    for _ in range(fatb_count):
        vector, = struct.unpack_from("<I", data, q)
        q += 4
        subs = []
        for bit in range(32):
            if vector >> bit & 1:
                start, end, length = struct.unpack_from("<III", data, q)
                q += 12
                subs.append(data[data_offset + start:data_offset + end])
        out.append(subs[0] if subs else b"")
    return out


def lz11(data):
    """Decompress an LZ11 block (first byte 0x11)."""
    assert data[0] == 0x11
    size = data[1] | data[2] << 8 | data[3] << 16
    p = 4
    if size == 0:
        size, = struct.unpack_from("<I", data, 4)
        p = 8
    out = bytearray()
    while len(out) < size:
        flags = data[p]
        p += 1
        for bit in range(7, -1, -1):
            if len(out) >= size:
                break
            if not flags >> bit & 1:
                out.append(data[p])
                p += 1
                continue
            b1 = data[p]
            ind = b1 >> 4
            if ind == 0:
                b2, b3 = data[p + 1], data[p + 2]
                n = ((b1 & 0xF) << 4 | b2 >> 4) + 0x11
                disp = ((b2 & 0xF) << 8 | b3) + 1
                p += 3
            elif ind == 1:
                b2, b3, b4 = data[p + 1], data[p + 2], data[p + 3]
                n = ((b1 & 0xF) << 12 | b2 << 4 | b3 >> 4) + 0x111
                disp = ((b3 & 0xF) << 8 | b4) + 1
                p += 4
            else:
                b2 = data[p + 1]
                n = ind + 1
                disp = ((b1 & 0xF) << 8 | b2) + 1
                p += 2
            for _ in range(n):
                out.append(out[-disp])
    return bytes(out)


def entry(data):
    """An entry's bytes, LZ11-decompressed when it looks compressed and decompresses cleanly."""
    if data[:1] == b"\x11" and len(data) > 4:
        try:
            return lz11(data)
        except (IndexError, AssertionError):
            pass
    return data


def mini(data):
    """Split a mini pack (2-char id, u16 count, count+1 u32 offsets). Returns (id, [bytes])."""
    ident = data[:2].decode("latin-1")
    count, = struct.unpack_from("<H", data, 2)
    offs = struct.unpack_from(f"<{count + 1}I", data, 4)
    return ident, [data[offs[i]:offs[i + 1]] for i in range(count)]


# 0xFFFD: XY and USUM store é in names and descriptions as U+FFFD (the only accented letter English text uses).
SPECIAL = {0xE08D: "…", 0xE08E: "♂", 0xE08F: "♀", 0xE07F: " ", 0x2019: "'", 0xFFFD: "é"}


def text(data):
    """Decode a Gen 6/7 text file into a list of lines."""
    sections, lines, total, key0, sec_off = struct.unpack_from("<HHIII", data, 0)
    out = []
    key = 0x7C89
    for i in range(lines):
        off, length = struct.unpack_from("<IH", data, sec_off + 4 + i * 8)
        start = sec_off + off
        raw = struct.unpack_from(f"<{length}H", data, start)
        k = key
        chars = []
        for c in raw:
            chars.append(c ^ k)
            k = (k << 3 | k >> 13) & 0xFFFF
        key = (key + 0x2983) & 0xFFFF
        s, j = [], 0
        while j < len(chars):
            c = chars[j]
            if c == 0:
                break
            if c == 0x10:  # variable: count, type, args
                n, var = chars[j + 1], chars[j + 2]
                if var == 0xBDFF:  # null text: an unused line, followed by its line number
                    j += 4
                    continue
                s.append(f"[VAR {var:04X}]")
                j += 2 + n
                continue
            if c in (0xBE00, 0xBE01, 0xBE02):
                s.append("\n")
            else:
                s.append(SPECIAL.get(c, chr(c)))
            j += 1
        out.append("".join(s))
    return out


if __name__ == "__main__":
    if sys.argv[1] == "ls":
        es = read_garc(sys.argv[2])
        print(len(es), "entries")
        for i, e in enumerate(es[:40]):
            print(i, len(e), e[:4])
    elif sys.argv[1] == "text":
        es = read_garc(sys.argv[2])
        for i, line in enumerate(text(entry(es[int(sys.argv[3])]))):
            print(i, line)

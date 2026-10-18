"""Palette PNGs (colour type 3, 4 or 8 bpp), the format every sprite here uses. Stdlib only.

Used by tools/sprites_pee.py (building the shared set) and assemble.py (cropping sprites to their visible area).
"""
import struct, zlib

SIG = b'\x89PNG\r\n\x1a\n'


def decode(b):
    """PNG bytes -> (rows of palette indices, palette [(r, g, b)], tRNS alphas)."""
    assert b[:8] == SIG
    i, idat, plte, trns = 8, b'', [], b''
    while i < len(b):
        n, t = struct.unpack('>I4s', b[i:i + 8])
        d = b[i + 8:i + 8 + n]
        if t == b'IHDR':
            w, h, depth, ctype, _, _, inter = struct.unpack('>IIBBBBB', d)
            if ctype != 3 or inter or depth not in (4, 8):
                raise ValueError(f'not a 4/8 bpp palette PNG (depth {depth}, colour type {ctype})')
        elif t == b'PLTE':
            plte = [tuple(d[j:j + 3]) for j in range(0, len(d), 3)]
        elif t == b'tRNS':
            trns = d
        elif t == b'IDAT':
            idat += d
        i += 12 + n
    raw, stride = zlib.decompress(idat), (w * depth + 7) // 8
    rows, prev = [], bytearray(stride)
    for y in range(h):
        f, line = raw[y * (stride + 1)], bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for x in range(stride):
            a = line[x - 1] if x else 0
            up, c = prev[x], (prev[x - 1] if x else 0)
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + up) & 255
            elif f == 3: line[x] = (line[x] + (a + up) // 2) & 255
            elif f == 4:
                p = a + up - c
                pa, pb, pc = abs(p - a), abs(p - up), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else up if pb <= pc else c)) & 255
        prev = line
        rows.append([line[x] for x in range(w)] if depth == 8 else
                    [(line[x >> 1] >> (0 if x & 1 else 4)) & 15 for x in range(w)])
    return rows, plte, trns


def encode(rows, pal, trns=b'\0'):
    """Rows of palette indices -> PNG bytes, 4 bpp when the palette fits, else 8."""
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d))
    w, h = len(rows[0]), len(rows)
    if len(pal) <= 16:
        depth = 4
        raw = b''.join(b'\0' + bytes((r[x] << 4) | (r[x + 1] if x + 1 < w else 0) for x in range(0, w, 2)) for r in rows)
    else:
        depth = 8
        raw = b''.join(b'\0' + bytes(r) for r in rows)
    return (SIG + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, depth, 3, 0, 0, 0))
            + chunk(b'PLTE', b''.join(bytes(c) for c in pal)) + (chunk(b'tRNS', trns) if trns else b'')
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def crop(b):
    """Crop a sprite to its visible pixels, padded to a square: centred across, standing on the bottom edge.
    Returns the PNG unchanged if it has no transparent colour or nothing visible."""
    rows, pal, trns = decode(b)
    clear = {i for i, a in enumerate(trns) if a == 0}
    if not clear:
        return b
    ys = [y for y, r in enumerate(rows) if any(v not in clear for v in r)]
    xs = [x for x in range(len(rows[0])) if any(r[x] not in clear for r in rows)]
    if not ys:
        return b
    x0, x1, y0, y1 = xs[0], xs[-1] + 1, ys[0], ys[-1] + 1
    s, bg = max(x1 - x0, y1 - y0), min(clear)
    left, top = (s - (x1 - x0)) // 2, s - (y1 - y0)
    out = [[bg] * s for _ in range(s)]
    for y in range(y0, y1):
        out[top + y - y0][left:left + x1 - x0] = rows[y][x0:x1]
    return encode(out, pal, trns)

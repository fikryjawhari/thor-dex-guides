"""Tiny PNG decode / crop / encode (stdlib). Non-interlaced; colour types 0, 2, 3, 4, 6 at bit depth <= 8."""
import zlib, struct
CH = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
def decode(b):
    assert b[:8] == b'\x89PNG\r\n\x1a\n'
    i = 8; chunks = []; idat = b''
    while i < len(b):
        n, = struct.unpack('>I', b[i:i + 4]); t = b[i + 4:i + 8]; d = b[i + 8:i + 8 + n]; i += 12 + n
        if t == b'IHDR': w, h, bd, ct, _, _, il = struct.unpack('>IIBBBBB', d)
        elif t == b'IDAT': idat += d
        elif t in (b'PLTE', b'tRNS'): chunks.append((t, d))
        elif t == b'IEND': break
    assert il == 0 and bd <= 8
    raw = zlib.decompress(idat); bpp = max(1, CH[ct] * bd // 8); stride = (w * CH[ct] * bd + 7) // 8
    rows = []; prev = bytearray(stride); p = 0
    for y in range(h):
        f = raw[p]; line = bytearray(raw[p + 1:p + 1 + stride]); p += 1 + stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0; up = prev[x]; c = prev[x - bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + up) & 255
            elif f == 3: line[x] = (line[x] + (a + up) // 2) & 255
            elif f == 4:
                pa, pb, pc = abs(up - c), abs(a - c), abs(a + up - 2 * c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else up if pb <= pc else c)) & 255
        rows.append(line); prev = line
    # unpack to one sample tuple per pixel
    px = []
    for line in rows:
        if bd == 8:
            n = CH[ct]; px.append([tuple(line[x * n:(x + 1) * n]) for x in range(w)])
        else:
            per = 8 // bd; mask = (1 << bd) - 1; r = []
            for x in range(w):
                byte = line[x // per]; sh = 8 - bd * (x % per + 1); r.append(((byte >> sh) & mask,))
            px.append(r)
    return {'w': w, 'h': h, 'bd': bd, 'ct': ct, 'px': px, 'chunks': chunks}
def crop(im, x0, y0, w, h):
    o = dict(im); o['px'] = [row[x0:x0 + w] for row in im['px'][y0:y0 + h]]; o['w'], o['h'] = w, h; return o
def encode(im):
    w, h, bd, ct = im['w'], im['h'], im['bd'], im['ct']; out = bytearray()
    for row in im['px']:
        out.append(0)
        if bd == 8:
            for s in row: out += bytes(s)
        else:
            per = 8 // bd; cur = 0; n = 0
            for s in row:
                cur = (cur << bd) | s[0]; n += 1
                if n == per: out.append(cur); cur = 0; n = 0
            if n: out.append(cur << (bd * (per - n)))
    def ck(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    b = b'\x89PNG\r\n\x1a\n' + ck(b'IHDR', struct.pack('>IIBBBBB', w, h, bd, ct, 0, 0, 0))
    for t, d in im['chunks']: b += ck(t, d)
    return b + ck(b'IDAT', zlib.compress(bytes(out), 9)) + ck(b'IEND', b'')
def transparent(im):
    """Predicate: is this pixel transparent (tRNS alpha 0 for palette images, alpha 0 for RGBA / grey+alpha)."""
    ct = im['ct']
    if ct == 3:
        trns = dict(im['chunks']).get(b'tRNS', b'')
        clear = {i for i, a in enumerate(trns) if a == 0}
        return lambda s: s[0] in clear
    if ct in (4, 6): return lambda s: s[-1] == 0
    return lambda s: False
def trim_square(im, pad=1):
    """Crop to a square around the visible pixels: centred across, sitting on the bottom edge of the content."""
    tr = transparent(im); xs = []; ys = []
    for y, row in enumerate(im['px']):
        for x, s in enumerate(row):
            if not tr(s): xs.append(x); ys.append(y)
    if not xs: return im
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    side = min(max(x1 - x0, y1 - y0) + 1 + 2 * pad, im['w'], im['h'])
    cx = (x0 + x1 + 1) // 2; left = max(0, min(im['w'] - side, cx - side // 2))
    top = max(0, min(im['h'] - side, y1 + 1 + pad - side))
    return crop(im, left, top, side, side)

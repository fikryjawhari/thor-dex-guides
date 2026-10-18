"""Build the shared sprite set (sprites/) from a pokeemerald-expansion checkout. Stdlib only.

Usage: python -I tools/sprites_pee.py <pokeemerald-expansion dir> [out dir, default sprites/]

Reads the species table (src/data/pokemon/species_info/*.h) for every species' national dex number, front pic,
palette and female front pic, and src/data/graphics/pokemon.h for the file behind each symbol (the modern sprite,
never the *_gba one). Writes the first 64x64 frame of each front pic with its normal palette, colour 0 transparent,
as a 4bpp palette PNG named by sprite key (sprites/README.md):

  png/<key>.png   one per distinct sprite
  index.json      {"keys": {key: species constant}, "same": {key: key it is identical to}, "commit": ...}

A form whose picture and palette are identical to an earlier key (battle-only forms such as Greninja-Bond,
cosmetic splits the expansion draws the same) is not written again; "same" points it at that key.
"""
import json, os, re, struct, subprocess, sys, zlib

sys.stdout.reconfigure(encoding='utf-8')
SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sprites')


def text(*p):
    return open(os.path.join(SRC, *p), encoding='utf-8').read()


# --- PNG (palette images only, which is all the expansion uses) ---

def png_read(path):
    b = open(path, 'rb').read()
    assert b[:8] == b'\x89PNG\r\n\x1a\n', path
    i, idat, plte = 8, b'', None
    while i < len(b):
        n, t = struct.unpack('>I4s', b[i:i + 8])
        d = b[i + 8:i + 8 + n]
        if t == b'IHDR':
            w, h, depth, ctype, _, _, inter = struct.unpack('>IIBBBBB', d)
            assert ctype == 3 and inter == 0 and depth in (4, 8), (path, depth, ctype)
        elif t == b'PLTE':
            plte = [tuple(d[j:j + 3]) for j in range(0, len(d), 3)]
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
    return w, h, rows, plte


def png_write(path, rows, pal):
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d))
    w, h = len(rows[0]), len(rows)
    raw = b''.join(b'\0' + bytes((r[x] << 4) | r[x + 1] for x in range(0, w, 2)) for r in rows)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 4, 3, 0, 0, 0))
                           + chunk(b'PLTE', b''.join(bytes(c) for c in pal)) + chunk(b'tRNS', b'\0')
                           + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def jasc(path):
    lines = open(path, encoding='utf-8').read().split()
    assert lines[0] == 'JASC-PAL', path
    return [tuple(int(v) for v in lines[3 + 3 * i:6 + 3 * i]) for i in range(int(lines[2]))]


# --- species table ---

def enum_values():
    """Species constant -> number, and number -> every constant naming it."""
    val, names = {}, {}
    for name, v in re.findall(r'^\s*(SPECIES_\w+)\s*=\s*(\w+),', text('include', 'constants', 'species.h'), re.M):
        if v.isdigit():
            val[name] = int(v)
        elif v in val:
            val[name] = val[v]
    for name, v in val.items():
        names.setdefault(v, []).append(name)
    return val, names


def dex_names():
    body = text('include', 'constants', 'pokedex.h')
    body = body[body.index('NATIONAL_DEX_NONE'):]
    return {n: i for i, n in enumerate(re.findall(r'^\s*NATIONAL_DEX_(\w+),', '\n' + body, re.M))}


def balanced(s, i):
    """Index just past the bracket group that opens at s[i]."""
    pair, depth = {'(': ')', '{': '}'}[s[i]], 0
    for j in range(i, len(s)):
        if s[j] == s[i]:
            depth += 1
        elif s[j] == pair:
            depth -= 1
            if not depth:
                return j + 1
    raise ValueError('unbalanced')


def split_args(s):
    out, depth, cur = [], 0, ''
    for c in s:
        if c == ',' and not depth:
            out.append(cur.strip())
            cur = ''
            continue
        depth += c in '({'
        depth -= c in ')}'
        cur += c
    return out + [cur.strip()]


def expand(s, macros, depth=0):
    """Expand the species_info macros (UNOWN_MISC_INFO(B, ...), MOTHIM_SPECIES_INFO, ...) inside s."""
    assert depth < 10
    pat = re.compile(r'\b(' + '|'.join(sorted(macros, key=len, reverse=True)) + r')\b')
    out, i = '', 0
    for m in pat.finditer(s):
        if m.start() < i:
            continue
        params, body = macros[m.group(1)]
        out += s[i:m.start()]
        i = m.end()
        if params is not None:
            j = i
            while j < len(s) and s[j] in ' \t\n':
                j += 1
            if j >= len(s) or s[j] != '(':
                out += m.group(1)
                continue
            end = balanced(s, j)
            args = split_args(s[j + 1:end - 1])
            i = end
            for p, a in zip(params, args):
                body = re.sub(r'\b' + re.escape(p) + r'\b', lambda _: a, body)
            body = re.sub(r'\s*##\s*', '', body)
        out += expand(body, macros, depth + 1)
    return out + s[i:]


def species_entries():
    """{SPECIES_X: {field: value}} for frontPic, palette, natDexNum, frontPicFemale, paletteFemale."""
    out = {}
    d = os.path.join(SRC, 'src', 'data', 'pokemon', 'species_info')
    for f in sorted(os.listdir(d)):
        if not f.startswith('gen_'):
            continue
        src = text('src', 'data', 'pokemon', 'species_info', f).replace('\\\n', ' ')
        macros = {}
        for name, params, body in re.findall(r'^\s*#define\s+(\w+)(\([^)]*\))?[ \t]*(.*)$', src, re.M):
            if name.endswith('_INFO'):
                macros[name] = ([p.strip() for p in params[1:-1].split(',')] if params else None, body)
        src = re.sub(r'^\s*#define.*$', '', src, flags=re.M)
        for m in re.finditer(r'\[(SPECIES_\w+)\]\s*=\s*', src):
            i = m.end()
            if src[i] == '{':
                body = src[i:balanced(src, i)]
            else:
                name = re.match(r'\w+', src[i:]).group(0)
                j = i + len(name)
                body = src[i:balanced(src, j) if src[j] == '(' else j]
            body = expand(body, macros) if macros else body
            e = {}
            for k in ('frontPic', 'palette', 'frontPicFemale', 'paletteFemale', 'natDexNum'):
                vs = sorted(set(v.strip() for v in re.findall(r'\.' + k + r'\s*=\s*([^,\n]+),', body)))
                if vs:
                    assert len(vs) == 1, (m.group(1), k, vs)
                    e[k] = vs[0]
            out[m.group(1)] = e
    return out


def gfx_paths():
    """Graphics symbol -> file, preferring the modern sprite over the *_gba one."""
    paths = {}
    for sym, p in re.findall(r'\b(gMon(?:FrontPic|Palette)\w*)\[\]\s*=\s*\w+\("([^"]+)"', text('src', 'data', 'graphics', 'pokemon.h')):
        if sym not in paths or '_gba' in paths[sym]:
            paths[sym] = p
    return paths


def main():
    val, names = enum_values()
    dex = dex_names()
    gfx = gfx_paths()
    sp = species_entries()
    os.makedirs(os.path.join(OUT, 'png'), exist_ok=True)
    for f in os.listdir(os.path.join(OUT, 'png')):
        os.remove(os.path.join(OUT, 'png', f))
    keys, same, seen, problems = {}, {}, {}, []

    def emit(key, const, pic, pal):
        if key in keys or key in same:
            problems.append(f'{key}: {const} clashes with {keys.get(key) or same[key]}')
            return
        pp, lp = gfx.get(pic), gfx.get(pal)
        if not pp or not lp or 'question_mark' in pp:
            problems.append(f'{key}: {const} has no sprite ({pic} -> {pp}, {pal} -> {lp})')
            return
        w, h, rows, _ = png_read(os.path.join(SRC, pp))
        pal16 = (jasc(os.path.join(SRC, lp)) + [(0, 0, 0)] * 16)[:16]
        rows = [r[:64] for r in rows[:64]]
        assert w >= 64 and h >= 64 and max(max(r) for r in rows) < 16, (const, pp, w, h)
        sig = (tuple(map(tuple, rows)), tuple(pal16[1:]))
        if sig in seen:
            same[key] = seen[sig]
        else:
            seen[sig] = key
            png_write(os.path.join(OUT, 'png', key + '.png'), rows, pal16)
        keys[key] = const

    # Every numbered species, bases first so a form identical to its base points at the base.
    base_suf = {}
    order = sorted(names, key=lambda v: (not any(x[8:] in dex for x in names[v]), v))
    for v in order:
        const = next((n for n in names[v] if n in sp), None)
        if not const or v == 0:
            continue
        e = sp[const]
        dn = e.get('natDexNum', '').replace('NATIONAL_DEX_', '')
        if dn not in dex or dex[dn] == 0:
            problems.append(f'{const}: no national dex number ({e.get("natDexNum")})')
            continue
        n = dex[dn]
        pre = f'SPECIES_{dn}_'
        if f'SPECIES_{dn}' in names[v]:
            form = ''
            # The base's own suffixes (MEOWSTIC_M, TATSUGIRI_CURLY, TOXTRICITY_AMPED), dropped from its forms' keys.
            base_suf[dn] = sorted((x[len(pre):] + '_' for x in names[v] if x.startswith(pre)), key=len, reverse=True)
        else:
            # Shortest name for this number that starts with the dex name: SPECIES_ALCREMIE_RUBY_CREAM, not
            # SPECIES_ALCREMIE_STRAWBERRY_RUBY_CREAM.
            cands = [x[len(pre):] for x in names[v] if x.startswith(pre)]
            if not cands:
                problems.append(f'{const}: name does not start with {pre}')
                continue
            form = min(cands, key=len)
            form = next((form[len(b):] for b in base_suf.get(dn, []) if form.startswith(b)), form)
            form = '-' + form.lower().replace('_', '-')
        key = f'{n:04d}{form}'
        emit(key, const, e.get('frontPic'), e.get('palette'))
        if 'frontPicFemale' in e:
            emit(key + '-f', const + ' (female)', e['frontPicFemale'], e.get('paletteFemale', e.get('palette')))

    commit = subprocess.run(['git', '-C', SRC, 'log', '-1', '--format=%H %cs'], capture_output=True, text=True).stdout.split()
    json.dump({'source': 'rh-hideout/pokeemerald-expansion', 'commit': commit[0] if commit else '',
               'date': commit[1] if len(commit) > 1 else '', 'keys': keys, 'same': same},
              open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8', newline='\n'), indent=0, ensure_ascii=False)
    have = {int(k[:4]) for k in keys}
    print(f'{len(keys)} keys, {len(keys) - len(same)} PNGs, {len(same)} identical to another key; '
          f'national dex 1-{max(have)}, missing numbers: {sorted(set(range(1, max(have) + 1)) - have) or "none"}')
    for p in problems:
        print('  ' + p)


if __name__ == '__main__':
    main()

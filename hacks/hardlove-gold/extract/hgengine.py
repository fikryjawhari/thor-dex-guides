"""Read the hack's hg-engine source files (hacks/hardlove-gold/.src/repos/hardlove, pinned commit in COMMIT): designated
initialisers like [SPECIES_X] = { .field = value, ... } become nested dicts/lists of strings and ints."""
import re, json, os

def strip_comments(t):
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    t = re.sub(r'//[^\n]*', '', t)
    return re.sub(r'(?m)^\s*#[^\n]*', '', t)  # preprocessor lines (#ifdef blocks are all kept)

def tokens(t):
    return re.findall(r'"(?:\\.|[^"\\])*"|\[[^\]]*\]|\.[A-Za-z_]\w*|[{}(),=|]|[^\s{}(),=|"]+', t)

def parse_value(tk, i):
    """Parse one initialiser value starting at tk[i]; returns (value, next index)."""
    if tk[i] == '{':
        i += 1; items = []; named = {}; keyed = {}
        while tk[i] != '}':
            if tk[i] == ',': i += 1; continue
            if tk[i].startswith('[') and tk[i + 1] == '=':
                k = tk[i][1:-1].strip(); v, i = parse_value(tk, i + 2); keyed[k] = v
            elif tk[i].startswith('.') and tk[i + 1] == '=':
                k = tk[i][1:]; v, i = parse_value(tk, i + 2); named[k] = v
            else:
                v, i = parse_value(tk, i); items.append(v)
        i += 1
        if keyed: return keyed, i
        if named: return named, i
        return items, i
    # scalar: everything up to the next , or } at depth 0 (handles MON_WITH_FORM(A, 1) and A | B)
    out = []; depth = 0
    while True:
        x = tk[i]
        if depth == 0 and x in (',', '}'): break
        if x == '(': depth += 1
        if x == ')': depth -= 1
        out.append(x); i += 1
    s = ' '.join(out)
    if len(out) == 1:
        x = out[0]
        if x.startswith('"'): return json.loads(x.replace('\\\\n', '\\n')), i
        if re.fullmatch(r'-?\d+', x): return int(x), i
        if re.fullmatch(r'0x[0-9a-fA-F]+', x): return int(x, 16), i
    return s, i

def table(path, start_pat):
    """The top-level array initialiser whose declaration matches start_pat (regex), as a dict or list."""
    t = strip_comments(open(path, encoding='utf-8').read())
    m = re.search(start_pat, t)
    tk = tokens(t[m.end():])
    i = tk.index('{')
    v, _ = parse_value(tk, i)
    return v

def species_form(s):
    """'MON_WITH_FORM ( SPECIES_ZIGZAGOON , 1 )' -> ('SPECIES_ZIGZAGOON', 1); 'SPECIES_X' -> ('SPECIES_X', 0)."""
    s = str(s)
    m = re.match(r'MON_WITH_FORM \( (\w+) , (\d+) \)', s)
    if m: return m.group(1), int(m.group(2))
    return s.strip(), 0

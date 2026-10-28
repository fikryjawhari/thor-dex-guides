"""Game ids, names and growth rates from a pokeemerald-expansion checkout, for a hack's save-import tables (data.json GID).

    defines(path, prefix)   {CONST: int} for every `#define <prefix>X value` (aliases and simple sums resolved)
    names(path, field)      {CONST: text} from `[CONST] = { .name = _("...") ... }` tables (moves, abilities, items);
                            field 'description' for the description (tells apart same-named entries)
    growth(paths)           {SPECIES_CONST: GROWTH_CONST} from species_info blocks (`.growthRate = ...`), also when
                            the block or the entry itself is a family macro (UNOWN_MISC_INFO(...), VIVILLON_...)
    key(name)               the loose name key the tables are matched on (lower case, letters and digits only)

Only the headers are read (no C compiler): each table is `[CONST] =` followed by a brace block. A hack's extract maps
these onto its own M / AB / P (see hacks/emerald-imperium/extract/gid.py); unmatched ids go in the build report.
"""
import ast, re

DEFINE = re.compile(r'^#define\s+([A-Z][A-Z0-9_]*)\s+(.+?)\s*(?://.*)?$', re.M)
ENTRY = re.compile(r'\[\s*([A-Z][A-Z0-9_]*)\s*\]\s*=\s*\{')
ENTRY_MACRO = re.compile(r'\[\s*(SPECIES_[A-Z0-9_]*)\s*\]\s*=\s*([A-Z][A-Z0-9_]*)\s*\(')
MACRO = re.compile(r'^#define\s+([A-Z][A-Z0-9_]*)\([^)]*\)((?:.*\\\n)*.*)$', re.M)
FIELD = lambda field: re.compile(r'\.' + field + r'\s*=\s*[A-Za-z_]*\(\s*"((?:[^"\\]|\\.)*)"')
GROWTH = re.compile(r'\.growthRate\s*=\s*(GROWTH_[A-Z_]+)')


def key(name):
    return re.sub(r'[^a-z0-9]', '', str(name).lower().replace('é', 'e'))


def _eval(expr, known):
    """An integer constant expression of numbers, known names, + - * << and parentheses; None if it uses anything else."""
    expr = re.sub(r'\b([A-Z][A-Z0-9_]*)\b', lambda m: str(known[m[1]]) if m[1] in known else m[0], expr)
    try:
        node = ast.parse(expr.replace('/', '//'), mode='eval').body
    except SyntaxError:
        return None
    ok = (ast.BinOp, ast.UnaryOp, ast.Constant, ast.Add, ast.Sub, ast.Mult, ast.FloorDiv, ast.LShift, ast.USub)
    if not all(isinstance(n, ok) or isinstance(n, ast.operator) and isinstance(n, ok) for n in ast.walk(node)):
        return None
    value = eval(compile(ast.Expression(node), '<define>', 'eval'))
    return value if isinstance(value, int) else None


def defines(path, prefix):
    raw = [(n, v) for n, v in DEFINE.findall(open(path, encoding='utf8').read())]
    known, pending = {}, [(n, v) for n, v in raw]
    while pending:                    # aliases may point forwards: resolve until nothing changes
        left = []
        for n, v in pending:
            value = _eval(v, known)
            (left.append((n, v)) if value is None else known.__setitem__(n, value))
        if len(left) == len(pending):
            break
        pending = left
    return {n: v for n, v in known.items() if n.startswith(prefix)}


def _blocks(text):
    """(CONST, block text) for every `[CONST] = { ... }` in text."""
    for m in ENTRY.finditer(text):
        depth, i = 1, m.end()
        while depth and i < len(text):
            depth += {'{': 1, '}': -1}.get(text[i], 0)
            i += 1
        yield m[1], text[m.end():i]


def names(path, field='name'):
    out, pattern = {}, FIELD(field)
    for const, block in _blocks(open(path, encoding='utf8').read()):
        m = pattern.search(block)
        if m and const not in out:
            out[const] = m[1].replace('\\n', ' ')
    return out


def growth(paths):
    texts = [open(path, encoding='utf8').read() for path in paths]
    macros = {name: body for text in texts for name, body in MACRO.findall(text)}

    def find(text, depth=0):
        m = GROWTH.search(text)
        if m or depth > 3:
            return m and m[1]
        for name in re.findall(r'\b([A-Z][A-Z0-9_]*)\s*\(', text):
            if name in macros and (rate := find(macros[name], depth + 1)):
                return rate
        return None

    out = {}
    for text in texts:
        for const, block in _blocks(text):
            if const.startswith('SPECIES_') and (rate := find(block)):
                out.setdefault(const, rate)
        for const, name in ENTRY_MACRO.findall(text):
            if name in macros and (rate := find(macros[name])):
                out.setdefault(const, rate)
    return out

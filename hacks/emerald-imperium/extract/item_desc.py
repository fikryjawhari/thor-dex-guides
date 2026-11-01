"""Item text (IX) from the hack's items.h: each item's in-game bag description, and whether the hack changed it.

build(D) sets D['IX'] = {item name as the guide shows it: [description, in-battle text, changed]} for every item name the
guide shows: IT rows (not Useful NPCs), P.hi, P.stone, trainer held items, MI items. A name matches its items.h constant
by the loose name key (as GID does); TMs and HMs get no entry (their page shows the move). changed = 1 when the text
differs (whitespace folded) from stock pokeemerald-expansion's items.h where the iriv24 fork branched off (572ea14, SOURCES.md), fetched
to .src/stock/items.h (SOURCES.md has the command); an item stock doesn't have counts as changed. The in-battle text
is hand-written (tools/battle_text), so it stays empty here. Also written to extract/item_desc.json (committed).
"""
import json, os, re
from common import H, key, report

HERE = os.path.dirname(os.path.abspath(__file__))
LIT = r'(?:\s*"(?:[^"\\]|\\.)*")+'
ITEM = re.compile(r'\[(ITEM_\w+)\]\s*=\s*\{(.*?)\n    \},?', re.S)
NAMED = re.compile(r'static const u8 (s\w+)\[\]\s*=\s*(?:COMPOUND_STRING|_)\(\s*(' + LIT + r')\s*\)\s*;')
DESC = re.compile(r'\.description\s*=\s*(?:(?:COMPOUND_STRING|_)\(\s*(' + LIT + r')\s*\)|(s\w+))\s*,')
NAME = re.compile(r'\.name\s*=\s*(?:COMPOUND_STRING|_|ITEM_NAME)\(\s*(' + LIT + r')\s*\)')
IF_BLOCK = re.compile(r'#if[^\n]*\n(.*?)(?:#else\n.*?)?#endif[^\n]*\n', re.S)
# the sheet's spelling, where the game's item is named differently (items.py)
ALIAS = {'Luxite': 'Luxrite', 'Beedrilite': 'Beedrillite'}
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')


def text(literals):
    """C string literals as game text: \\n, \\p, \\l are breaks, so spaces; whitespace folded."""
    body = ''.join(STR.findall(literals))
    body = re.sub(r'\\[npl]', ' ', body).replace('\\"', '"').replace('\\\\', '\\')
    return ' '.join(body.split())


def first_branch(source):
    """#if … #else … #endif keeps its first branch: the release builds at GEN_LATEST, where the #if conditions hold
    (Dream Ball's Gen 8 text)."""
    return IF_BLOCK.sub(r'\1', source)


def items_h(path, named):
    """{ITEM_CONST: (name, description or None)} from an items.h; named: the description constants (sXDesc) it uses."""
    source = first_branch(open(path, encoding='utf8').read())
    out = {}
    for m in ITEM.finditer(source):
        block = m[2]
        name = NAME.search(block)
        desc = DESC.search(block)
        desc_text = None
        if desc:
            desc_text = text(desc[1]) if desc[1] else named.get(desc[2])
        out[m[1]] = (text(name[1]) if name else None, desc_text)
    return out


def build(D):
    stock_path = os.path.join(H.src, 'stock', 'items.h')
    if not os.path.exists(stock_path):
        raise FileNotFoundError(f'{stock_path}: fetch it (hacks/emerald-imperium/SOURCES.md → Stock items.h)')
    # the description constants live in src/data/text/item_descriptions.h (the same pin), which items.h includes
    named = {}
    for path in (os.path.join(H.src, 'repos', 'expansion', 'src', 'data', 'text', 'item_descriptions.h'),
                 os.path.join(H.src, 'repos', 'expansion', 'src', 'data', 'items.h')):
        named.update((m[1], text(m[2])) for m in NAMED.finditer(first_branch(open(path, encoding='utf8').read())))
    hack = items_h(os.path.join(H.src, 'repos', 'expansion', 'src', 'data', 'items.h'), named)
    stock = items_h(stock_path, {})
    by_key = {}
    for const, (name, _) in hack.items():
        if name: by_key.setdefault(key(name), []).append(const)

    # every name the guide shows (in order, once)
    names = []
    for box in D['IT']:
        if box['n'] in ('Useful NPCs', 'Move Tutors'): continue
        names += [row[0] for row in box['r']]
    names += [h[0] for p in D['P'] for h in p.get('hi') or []]
    names += [p['stone'] for p in D['P'] if p.get('stone')]
    names += [m['i'] for g in D['TR']['g'] for s in g['sec'] for t in s.get('tr', []) for m in t.get('p', []) if m.get('i')]
    names += [m['i'] for m in D['MI'] if m.get('i')]
    names = list(dict.fromkeys(n for n in names if n))

    out, none, skipped = {}, [], 0
    for name in names:
        if re.match(r'(TM|HM)\d', name):
            skipped += 1
            continue
        consts = by_key.get(key(ALIAS.get(name, name)), [])
        if not consts:
            guess = 'ITEM_' + re.sub(r'[^A-Za-z0-9]+', '_', ALIAS.get(name, name)).strip('_').upper()
            if guess in hack:
                report(f'  ITEM TEXT: {name} matched by its constant {guess} (the game squeezes the name)')
                consts = [guess]
        if not consts:
            report(f'  ITEM TEXT: {name}: no items.h constant')
            none.append(name)
            continue
        if len(consts) > 1:
            report(f'  ITEM TEXT: {name}: several items.h constants {", ".join(consts)}; the first is used')
        const = consts[0]
        desc = hack[const][1]
        if not desc:
            report(f'  ITEM TEXT: {name} ({const}): no description')
            none.append(name)
            continue
        if const not in stock:
            report(f'  ITEM TEXT: {name} ({const}) is not in stock items.h: marked changed')
        changed = 0 if const in stock and stock[const][1] and ' '.join(stock[const][1].split()) == desc else 1
        out[name] = [desc, changed]

    D['IX'] = {name: [desc, '', changed] for name, (desc, changed) in sorted(out.items())}
    with open(os.path.join(HERE, 'item_desc.json'), 'w', encoding='utf8', newline='\n') as f:
        json.dump(out, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    changed = sum(1 for v in out.values() if v[1])
    report(f'ITEM TEXT: {len(out)} items with text ({changed} changed from stock), {skipped} TMs / HMs (the page shows the move), '
           f'{len(none)} with none: {", ".join(none) or "-"}')

"""GID: the save importer's game id tables (template/calc/readers/gen3.js reads a save in game ids; the page maps them).

    sp  game species id -> our P id     (our ids are the expansion's SPECIES_ numbers: checked by name here)
    mv  game move id    -> M index      (by name)
    ab  game ability id -> AB index     (by name)
    it  game item id    -> item name    (the game's, spelt as Showdown / the trainer sets do where the game squeezes a
                                         name into its 12-14 letters: Never-MeltIce -> Never-Melt Ice; the calc engine
                                         knows items by those names)
    gr  game species id -> growth rate  (0-5, GROWTH_ order; boxed Pokémon store only experience)

Lists indexed by game id, null where nothing maps. Runs after finalise (prune changes M / AB indexes).
Source: the release's pokeemerald-expansion (iriv24 at 2576d0f, SOURCES.md), read by tools/expansion_ids.py.
"""
import glob, os, re
import expansion_ids as X
from common import SRC, report

E = os.path.join(SRC, 'repos', 'expansion')
GROWTHS = ['GROWTH_MEDIUM_FAST', 'GROWTH_ERRATIC', 'GROWTH_FLUCTUATING', 'GROWTH_MEDIUM_SLOW', 'GROWTH_FAST', 'GROWTH_SLOW']


def table(ids, value):
    """[value(const) or None] indexed by game id, trailing Nones cut."""
    out = []
    for const, gid in sorted(ids.items(), key=lambda kv: kv[1]):
        v = value(const)
        if v is None:
            continue
        out += [None] * (gid + 1 - len(out))
        if out[gid] is None:
            out[gid] = v
    return out


def build(D):
    inc = lambda *p: os.path.join(E, 'include', 'constants', *p)
    sp = X.defines(inc('species.h'), 'SPECIES_')
    mv = X.defines(inc('moves.h'), 'MOVE_')
    ab = X.defines(inc('abilities.h'), 'ABILITY_')
    it = X.defines(inc('items.h'), 'ITEM_')
    move_names = X.names(os.path.join(E, 'moves_info.h'))
    ability_names = X.names(os.path.join(E, 'src', 'data', 'abilities.h'))
    ability_texts = X.names(os.path.join(E, 'src', 'data', 'abilities.h'), 'description')
    item_names = X.names(os.path.join(E, 'src', 'data', 'items.h'))
    growth = X.growth([os.path.join(E, 'src', 'data', 'pokemon', 'species_info.h')]     # the hack's own (Primal Dialga)
                      + sorted(glob.glob(os.path.join(E, 'src', 'data', 'pokemon', 'species_info', '*.h'))))

    # species: the same number; the growth rate falls back to the base form's (same dex number) when a form's block
    # takes it from a macro
    by_id = {p['id']: p for p in D['P']}
    base_growth = {}
    for const, gid in sorted(sp.items(), key=lambda kv: kv[1]):
        p = by_id.get(str(gid))
        if p and const in growth:
            base_growth.setdefault(p['dex'], GROWTHS.index(growth[const]))
    sp_table = table(sp, lambda c: str(sp[c]) if str(sp[c]) in by_id else None)
    gr_table = table(sp, lambda c: GROWTHS.index(growth[c]) if c in growth
                     else base_growth.get(by_id[str(sp[c])]['dex']) if str(sp[c]) in by_id else None)
    mapped = {v for v in sp_table if v}
    report(f'GID species: {len(mapped)} of {len(by_id)} P ids are game species ids')
    for p in D['P']:
        if p['id'] not in mapped:
            report(f'  GID: P {p["id"]} {p["n"]} is no game species id')
        elif gr_table[int(p['id'])] is None:
            report(f'  GID: no growth rate for {p["id"]} {p["n"]}')

    def by_name(ids, names, ours, what, texts=None, our_texts=None):
        """By name; a name ours has twice (As One) also by description."""
        index = {}
        for i, n in enumerate(ours):
            index.setdefault(X.key(n), []).append(i)

        def hit(c):
            found = index.get(X.key(names.get(c, '')), [])
            if len(found) > 1 and texts:
                found = [i for i in found if X.key(our_texts[i]) == X.key(texts.get(c, ''))]
            return found[0] if len(found) == 1 else None
        out = table(ids, hit)
        found = {v for v in out if v is not None}
        report(f'GID {what}: {len(found)} of {len(ours)} ours matched by name')
        for i, n in enumerate(ours):
            if i not in found:
                report(f'  GID: {what} {n} has no game id')
        return out

    # item spelling: Showdown's names (repos/showdown/items.js) and the trainer sets' items, matched loosely; only a
    # longer name replaces the game's (a squeezed one), so Poké Ball keeps its accent
    showdown = open(os.path.join(SRC, 'repos', 'showdown', 'items.js'), encoding='utf8').read()
    full = set(re.findall(r'^\s+name: "([^"]+)"', showdown, re.M))
    full |= {m['i'] for group in D['TR']['g'] for section in group['sec'] for t in section.get('tr', [])
             for m in t.get('p', []) if m.get('i')}
    spelt = {X.key(n): n for n in sorted(full)}
    respelt = []

    def item(c):
        name = item_names.get(c)
        if c == 'ITEM_NONE' or not name or name.startswith('?'):
            return None
        longer = spelt.get(X.key(name), name)
        if len(longer) <= len(name):
            return name
        respelt.append(f'{name} -> {longer}')
        return longer

    D['GID'] = {
        'sp': sp_table,
        'mv': by_name(mv, move_names, D['M'], 'move'),
        'ab': by_name(ab, ability_names, [a[0] for a in D['AB']], 'ability',
                      ability_texts, [a[1] if len(a) > 1 else '' for a in D['AB']]),
        'it': table(it, item),
        'gr': gr_table,
    }
    report(f'GID items: {len(set(respelt))} spelt in full: ' + ', '.join(sorted(set(respelt))))

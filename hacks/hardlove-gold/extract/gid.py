"""GID: the save importer's game id tables (template/calc/readers/gen4.js reads a save in game ids; the page maps them).

    sp  'species:form' -> our P id  (the save stores the base species and a form number; PokeFormDataTbl.c gives the
                                     form's own constant. A form the guide lacks whose battle data is its base's
                                     (Unown B, Shellos East) maps to the base)
    mv  game move id    -> M index  (by name)
    ab  game ability id -> AB index (by name)
    it  game item id    -> item name (the constant's, spelt as the trainer sets spell it)
    gr  'species:form'  -> growth rate (0-5, GROWTH_ order; boxed Pokémon store only experience)

Lists indexed by game id, null where nothing maps. Runs after finalise (prune changes M / AB indexes).
Source: the hack's hg-engine source at the pinned commit (include/constants/{species,moves,ability}.h,
asm/include/items.inc, data/Species.c, data/PokeFormDataTbl.c; SOURCES.md).
"""
import os, re
import expansion_ids as E
from common import REPORT, SRC, X, key, report
import hgsource

R = os.path.join(SRC, 'repos', 'hardlove')
GROWTHS = ['GROWTH_MEDIUM_FAST', 'GROWTH_ERRATIC', 'GROWTH_FLUCTUATING', 'GROWTH_MEDIUM_SLOW', 'GROWTH_FAST', 'GROWTH_SLOW']
ALIAS = {'SPECIES_WORMADAM_TRASH': 'wormadam_trashy'}     # dex-site ids that differ from the constant


def indexed(ids, value):
    """[value(const) or None] indexed by game id, trailing Nones cut; the first constant of an id wins."""
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
    HG = X.HG
    inc = lambda *p: os.path.join(R, 'include', 'constants', *p)
    sp = E.defines(inc('species.h'), 'SPECIES_')
    mv = E.defines(inc('moves.h'), 'MOVE_')
    ab = E.defines(inc('ability.h'), 'ABILITY_')
    it = {c: int(n) for c, n in re.findall(r'(?m)^\.equ\s+(ITEM_\w+),\s*(\d+)', open(os.path.join(R, 'asm', 'include', 'items.inc'), encoding='utf-8').read())}

    ours = {p['id'] for p in D['P']}
    data = lambda c: (HG.S.get(c) or {}).get('speciesData') if isinstance(HG.S.get(c), dict) else None
    battle = lambda d: d and (d.get('baseStats'), d.get('types'), d.get('abilities'))
    pid = lambda c: ALIAS.get(c) or (hgsource.Src.sid(c) if hgsource.Src.sid(c) in ours else None)

    species, growth, same = {}, {}, []
    bases = sorted((c for c, n in sp.items() if 0 < n and not any(c == f for f in HG.form.values())), key=sp.get)
    forms = {}
    for (b, n), f in HG.form.items():
        forms.setdefault(b, []).append((n, f))
    for b in bases:
        n = sp[b]
        for form, c in [(0, b)] + sorted(forms.get(b, [])):
            k = f'{n}:{form}'
            target = pid(c)
            if not target and form and pid(b) and battle(data(c)) and battle(data(c)) == battle(data(b)):
                target = pid(b); same.append(c[8:])
            if target:
                species[k] = target
            d = data(c) or data(b)
            if d and d.get('expRate') in GROWTHS:
                growth[k] = GROWTHS.index(d['expRate'])
    mapped = set(species.values())
    report(f'GID species: {len(species)} species:form keys for {len(mapped)} of {len(ours)} P ids;'
           f' {len(same)} forms with their base\'s battle data map to the base')
    for p in D['P']:
        if p['id'] not in mapped and p['g'] != 1:            # Megas are battle-only: a save never holds one
            report(f'  GID: P {p["id"]} {p["n"]} has no game species:form')

    def by_name(ids, name, names, what):
        index = {}
        for i, n in enumerate(names):
            index.setdefault(key(n), i)
        out = indexed(ids, lambda c: index.get(key(name(c))))
        missing = [n for i, n in enumerate(names) if i not in set(out) and index[key(n)] == i]   # a repeated name: the first
        report(f'GID {what}: {len(index) - len(missing)} of {len(index)} our names matched'
               + (': no game id for ' + ', '.join(missing) if missing else ''))
        return out

    def move_name(c):
        """The game's name, through the moves step's spelling when it differs from ours (quietly: most game moves are
        no species' and the spelling step reports every one it can't place)."""
        n = HG.move(c)
        if key(n) in {key(m) for m in D['M']}:
            return n
        size = len(REPORT); n = X.cname(n); del REPORT[size:]
        return n

    # items: the constant's name, spelt as the trainer sets spell it where only punctuation differs (Kings Rock -> King's
    # Rock: the calc engine knows items by those names)
    spelt = {key(m['i']): m['i'] for group in D['TR']['g'] for section in group['sec'] for t in section['tr']
             for m in t['p'] if m.get('i')}
    item = lambda c: None if c == 'ITEM_NONE' else spelt.get(key(hgsource.Src.title(c, 'ITEM_')), hgsource.Src.title(c, 'ITEM_'))

    D['GID'] = {
        'sp': species,
        'mv': by_name(mv, move_name, D['M'], 'move'),
        'ab': by_name(ab, X.abn, [a[0] for a in D['AB']], 'ability'),
        'it': indexed(it, item),
        'gr': growth,
    }

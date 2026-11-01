"""GID (the damage calc's save import tables) from the official dex's data.js, whose keys are the game's ids (species,
moves, items), checked id by id against hzla's save_constants/radical_red_*.js. Growth rates (boxed levels) from RR's
own Base_Stats.c (growth.json, below). Runs after finalise() so the M indexes and the pruned P are final.
notes.md → Save ID tables.

    build(D)    writes D['GID'] = {sp, mv, it, gr} (the cfru reader's tables; no ab: a CFRU Pokémon stores its
                ability slot, the reader returns abs)
    python -I gid.py --growth <Base_Stats.c>    rewrites growth.json from RR's Base_Stats.c (SOURCES.md)
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))     # run as a script (-I)
from common import DATA, FORM_KEYS, H, SPECIES, SPECIES_IDS, ability, item, key, move, report, sid  # noqa: E402
import cfru  # noqa: E402 (tools/, on the path once common is imported)

GROWTH = os.path.join(H.extract, 'growth.json')
HZLA = os.path.join(H.src, 'repos', 'Dynamic-Calc-Decomps', 'js', 'savereaders', 'save_constants')

# Forms that exist only in battle (they revert after it, so a save never holds one): a defensive map to the base, as
# Unbound's gid.py does. RR's data.js has more of them than Unbound's (Megas, Primals, Busted, Hangry, ...).
BATTLE_ONLY = re.compile(r'-(Mega(-[XYZ])?|Primal|Zen|Pirouette|Blade|School|Busted|Ultra|Noice|Hangry|Crowned|'
                         r'Eternamax|Complete|Ash|Sunshine|Gulping|Gorging|Terastal)$')


def base_of(ident):
    """A battle-only form's id -> its base form's game id (the same name, the form suffix dropped)."""
    form = FORM_KEYS[ident]
    m = BATTLE_ONLY.search(form)
    if not m:
        return ident
    base = form[:m.start()]
    found = [i for i, f in FORM_KEYS.items() if f == base]
    return found[0] if found else ident


def hzla(name):
    """hzla's UMD constants file -> its returned object (JSON in a `return {...};`)."""
    path = os.path.join(HZLA, name)
    if not os.path.exists(path):
        return None
    s = open(path, encoding='utf-8').read()
    body = s[s.index('return {') + 7:]
    return json.loads(body[:body.rindex('};') + 1])


def define_ids():
    """Base_Stats.c's SPECIES_ define (without the prefix) -> data.js species id, by name."""
    return lambda define: sid(define.replace('_', ' '))


def growth_table():
    """growth.json -> {game species id: GROWTH index}, and the notes on species it doesn't list. A form missing from it
    takes its base species' rate (forms share it), a species added after the 2023 file its evolution family's
    (data.js `ancestor`), else Medium Fast (RadicalHex: every such species seen in real saves has exp = level³)."""
    rates, notes = {}, {'fallback': [], 'unmatched': []}
    if not os.path.exists(GROWTH):
        return rates, notes
    src = json.load(open(GROWTH, encoding='utf-8'))
    by_define = {d: g for g, defines in src['rates'].items() for d in defines}
    to_id = define_ids()
    direct = {}
    for define, g in by_define.items():
        target = to_id(define)
        ident = next((i for i, s in SPECIES_IDS.items() if s == target), None) if target else None
        if ident is None:
            notes['unmatched'].append(define)
        else:
            direct.setdefault(ident, cfru.GROWTH.index(g))
    by_name, loose = {}, {}
    for define in notes['unmatched']:            # a form under a short define (BASCULIN_RED, GIMMIGHOUL_CHEST)
        target = to_id(define.split('_')[0])
        ident = next((i for i, s in SPECIES_IDS.items() if s == target), None) if target else None
        if ident:
            loose.setdefault(SPECIES[ident]['name'], cfru.GROWTH.index(by_define[define]))
    for ident, row in SPECIES.items():
        if ident in direct and not row.get('order', 0):
            by_name.setdefault(row['name'], direct[ident])
    for ident, row in SPECIES.items():
        if ident in direct:
            rates[ident] = direct[ident]
            continue
        anc = SPECIES.get(str(row.get('ancestor')))
        g = by_name.get(row['name'])
        how = 'its base form'
        if g is None and row['name'] in loose:
            g, how = loose[row['name']], 'its species under another define'
        if g is None and anc:
            g, how = direct.get(str(row['ancestor'])), 'its family (%s)' % anc['name']
        if g is None:
            g, how = 0, 'Medium Fast (not in the 2023 table, no family)'
        rates[ident] = g
        notes['fallback'].append('%s %s: %s' % (ident, FORM_KEYS[ident], how))
    return rates, notes


def build(D):
    ids = {p['id'] for p in D['P']}
    mi = {n: i for i, n in enumerate(D['M'])}
    size = max(int(i) for i in SPECIES) + 1
    sp, gr = [None] * size, [None] * size
    rates, gnotes = growth_table()
    notes = {'sp': [], 'mv': [], 'it': []}
    for ident in SPECIES:
        target = SPECIES_IDS[base_of(ident)]
        if target in ids:
            sp[int(ident)] = target
        else:
            notes['sp'].append('%s %s' % (ident, FORM_KEYS[ident]))
        gr[int(ident)] = rates.get(ident)      # every species keeps its rate (boxed levels), even a pruned one
    mv = [None] * (max(int(i) for i in DATA['moves']) + 1)
    for ident in DATA['moves']:
        if ident == '0':
            continue
        name = move(ident)
        if name in mi:
            mv[int(ident)] = mi[name]
        else:
            notes['mv'].append('%s %s' % (ident, DATA['moves'][ident]['name']))
    it = [None] * (max(int(i) for i in DATA['items']) + 1)
    for ident in DATA['items']:
        it[int(ident)] = item(ident)
    D['GID'] = {'sp': sp, 'mv': mv, 'it': it, 'gr': gr}
    used = {x for x in sp if x} | {SPECIES_IDS[i] for i in SPECIES if base_of(i) != i}
    report('GID (data.js game ids): sp %d ids (%d P entries reached or battle-only, %d not: %s), mv %d ids, it %d ids, gr %d'
           % (sum(1 for x in sp if x), len(used), len(ids - used), ', '.join(sorted(ids - used)) or '-',
              sum(1 for x in mv if x is not None), sum(1 for x in it if x), sum(1 for x in gr if x is not None)))
    report('  GID battle-only forms read as their base: %s' % ', '.join(
        '%s %s' % (i, FORM_KEYS[i]) for i in SPECIES if base_of(i) != i))
    for k, rows in notes.items():
        if rows:
            report('  GID %s unmapped (%d): %s' % (k, len(rows), '; '.join(rows)))
    if not os.path.exists(GROWTH):
        report('  GID gr: no growth.json, every boxed level unknown')
    else:
        report('  GID gr from growth.json (Base_Stats.c): %d species not listed, rate from elsewhere: %s'
               % (len(gnotes['fallback']), '; '.join(gnotes['fallback'])))
        if gnotes['unmatched']:
            report('  GID gr: %d Base_Stats.c species match no data.js species: %s'
                   % (len(gnotes['unmatched']), ', '.join(gnotes['unmatched'])))
    cross_check(D)


def cross_check(D):
    """hzla's save constants against data.js, id by id: species, moves and items by name, and each species' ability
    slots (the reader picks slot 0 / 1 / hidden from the guide's P a / ha, so their order has to be the game's)."""
    C, I, A = (hzla('radical_red_%s.js' % f) for f in ('constants', 'item_constants', 'dex_ability_constants'))
    if not C or not I or not A:
        report('  GID cross-check: hzla constants not found')
        return
    diff = {'species': [], 'moves': [], 'items': [], 'abilities': []}
    plain, blank = [], []
    for i, name in enumerate(C['mons']):
        if not i or name in ('-----', 'None') or name.startswith('-'):
            if str(i) in SPECIES:
                diff['species'].append('%d: data.js %s, hzla none' % (i, FORM_KEYS[str(i)]))
            continue
        ours = SPECIES_IDS.get(str(i))
        if ours != sid(name):
            row = SPECIES.get(str(i))
            if row and key(row['name']) == key(name):
                plain.append(FORM_KEYS[str(i)])
            else:
                diff['species'].append('%d: data.js %s, hzla %s' % (i, FORM_KEYS.get(str(i)), name))
    for i in SPECIES:
        if int(i) >= len(C['mons']):
            diff['species'].append('%s: data.js %s, hzla none' % (i, FORM_KEYS[i]))
    for i in range(1, max(len(C['moves']), len(DATA['moves']))):
        a = DATA['moves'].get(str(i), {}).get('name')
        b = C['moves'][i] if i < len(C['moves']) else None
        if key(a or '') == key(b or '') or a and b and key(move(a) or a) == key(move(b) or b):
            continue
        if b == '(No Move)':                     # moves RR took out of the game (OHKO, evasion, ...)
            blank.append('%d %s' % (i, a))
        else:
            diff['moves'].append('%d: data.js %s, hzla %s' % (i, a, b))
    for i in range(1, max(len(I['items']), len(DATA['items']) + 1)):
        a = DATA['items'].get(str(i), {}).get('name')
        b = I['items'][i] if i < len(I['items']) else None
        if key(a or '') != key(b or '') and key(item(i) or '') != key(item(b) or b or ''):
            diff['items'].append('%d: data.js %s, hzla %s' % (i, a, b))
    for i, slots in enumerate(A['abilityIdsBySpeciesId']):
        row = SPECIES.get(str(i))
        if not slots or not row:
            continue
        ours = [a[0] for a in row['abilities']]
        if ours != slots:
            diff['abilities'].append('%d %s: data.js %s, hzla %s' % (i, FORM_KEYS[str(i)], ours, slots))
    # The ability the game gives each (personality bit 0, hidden bit) state, against what the reader picks from P
    P = {p['id']: p for p in D['P']}
    AB = [a[0] for a in D['AB']]
    slot_diff = []
    for i, row in SPECIES.items():         # data.js order is [hidden, 1, 2]; P keeps a = [1, 2?], ha = hidden or -1
        p = P.get(SPECIES_IDS[i])
        if not p:
            continue
        hidden, a1, a2 = (ability(x) if x[0] else None for x in row['abilities'])
        game = [hidden if h and hidden else a2 if bit and a2 else a1 for h in (0, 1) for bit in (0, 1)]
        ha = p.get('ha', -1)
        mine = [AB[p['ha']] if h and ha is not None and ha >= 0 else AB[p['a'][1]] if bit and len(p['a']) > 1 else AB[p['a'][0]]
                for h in (0, 1) for bit in (0, 1)]
        if game != mine:
            slot_diff.append('%s %s: game %s, P %s' % (i, FORM_KEYS[i], game, mine))
    report('  GID cross-check vs hzla: %d cosmetic forms hzla names by their species (%s)' % (len(plain), ', '.join(plain)))
    report('  GID cross-check vs hzla: %d move ids hzla reads as no move, data.js keeps (moves out of RR: GID keeps them): %s'
           % (len(blank), ', '.join(blank)))
    for k, rows in diff.items():
        report('  GID cross-check vs hzla %s: %s' % (k, 'same for every id' if not rows else '%d differ: %s' % (len(rows), '; '.join(rows))))
    report('  GID ability slots, data.js vs P (the reader picks P a[0] / a[1] / ha): %s'
           % ('same for every species' if not slot_diff else '%d differ: %s' % (len(slot_diff), '; '.join(slot_diff))))


def write_growth(path):
    """RR's Base_Stats.c -> growth.json: {source, rates: {GROWTH_*: [defines]}} (the defines without SPECIES_)."""
    text = open(path, encoding='utf-8', errors='replace').read()
    rates = {}
    for chunk in text.split('[SPECIES_')[1:]:
        define = chunk.split(']', 1)[0]
        g = re.search(r'\.growthRate\s*=\s*(GROWTH_[A-Z_]+)', chunk)
        if g and define != 'NONE':
            rates.setdefault(g.group(1), []).append(define)
    out = {'source': 'ydarissep/Radical-Red-Pokedex 65712ed data/species/Base_Stats.c (RR, 2023-08-04; '
                     'sha256 2cd667a4a03079aa3f0674c08206d19b70fef34db0102dd3e23cc9a2f404a470)',
           'rates': {g: rates[g] for g in cfru.GROWTH if g in rates}}
    with open(GROWTH, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, indent=0, separators=(',', ':'))
        f.write('\n')
    print('growth.json: %d species' % sum(len(v) for v in rates.values()))


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--growth':
        write_growth(sys.argv[2])
    else:
        print(__doc__)

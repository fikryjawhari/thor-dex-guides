"""Compare Drayano's "Pokemon Changes" doc with a RomHackDex mirror: base stats, and level-up lists.
Usage: python -I drayano_check.py <PokemonChanges.txt> <romhackdex/pokedex dir>
For each species the doc lists, compares the doc's new stats (the "Complete" line where a doc has versions) and its
full level-up list with the RomHackDex page. Prints mismatches and totals. A quick cross-check on the readers a
guide's extract uses (tools/drayano.py, tools/romhackdex.py); level-up moves are compared after the doc's name fixes,
so only real differences show."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
import drayano  # noqa: E402
from romhackdex import Mirror  # noqa: E402

doc = drayano.read(sys.argv[1])
rd = Mirror(os.path.dirname(os.path.normpath(sys.argv[2])))
moves = drayano.Names('move', [m['n'] for m in rd.moves().values()])
names = drayano.Names('species', [sp.name for sp in rd.species().values()])

stat_bad = lv_bad = n = missing = 0
for sp in drayano.pokemon_changes(doc):
    page = rd.find(names(sp.name) or sp.name)
    if page is None:
        missing += 1
        print('? no RomHackDex page for', sp.num, sp.name)
        continue
    n += 1
    for f in sp.fields:
        if f.kind == 'Base Stats' and (not f.versions or 'Complete' in f.versions) and not f.form:
            want = drayano.parse_stats(f.old_new()[1])
            if want != page.stats:
                stat_bad += 1
                print(f'STATS {sp.num:03d} {sp.name}: doc {want} romhackdex {page.stats}')
    lv = sp.level_up()
    if lv:
        want = sorted((l, moves(m) or m) for l, m, _, _ in lv)
        got = sorted((l, moves(m) or m) for l, m in page.lv)
        if want != got:
            lv_bad += 1
            ws, gs = set(want), set(got)
            print(f'LEVEL {sp.num:03d} {sp.name}: doc-only {sorted(ws - gs)[:5]} romhackdex-only {sorted(gs - ws)[:5]}')
print(f'\n{n} changed species compared, {missing} without a page; {stat_bad} stat and {lv_bad} level-up differences')
print('name fixes:', moves.count(), 'move,', names.count(), 'species')

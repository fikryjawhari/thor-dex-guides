"""Checks on a built hacks/blaze-black-2-redux/data.json against the docs (re-read with tools/drayano.py).

Usage (repo root): python -I hacks/blaze-black-2-redux/extract/check.py
Dex: the doc's own counts, every doc-changed species' stats / types / abilities equal the doc (Complete), every doc
evolution is an edge, every move name in the docs resolves, indexes in range, the move conflicts the audit counted.
"""
from pathlib import Path
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
data = HERE.parent / 'data.json'
if not data.is_file():
    print('SKIP blaze-black-2-redux extract-check: no data.json')
    sys.exit(0)

from common import RD, doc, drayano  # noqa: E402
from dex import BASE_LABEL, FORMS, FORM_NAMES, VERSION  # noqa: E402

D = json.load(open(data, encoding='utf-8'))
M, MV, AB, P = D['M'], D['MV'], D['AB'], D['P']
fails = []


def check(ok, what):
    if not ok:
        fails.append(what)


# ---- shape ----
base = [p for p in P if p['dex'] <= 649 and p['id'] not in {f[0] for f in FORMS}]
check(len(base) == 649 and sorted(p['dex'] for p in base) == list(range(1, 650)), 'one base entry per dex 1-649')
check(len(P) == 649 + len(FORMS) + 4, 'P = 649 species + %d forms + 4 trainer-only creations' % len(FORMS))
check(len(MV) == len(M) and len(set(M)) == len(M), 'MV matches M, M unique')
for p in P:
    idx = [i for _, i in p['lv']] + p['tm'] + p.get('tu', []) + p['eg']
    check(all(0 <= i < len(M) for i in idx), p['id'] + ': move index out of range')
    check(all(0 <= i < len(AB) for i in p['a']) and -1 <= p['ha'] < len(AB) and p['a'], p['id'] + ': ability index')
    check(len(p['s']) == 6 and all(isinstance(x, int) and x > 0 for x in p['s']), p['id'] + ': stats')
    check(1 <= len(p['t']) <= 2, p['id'] + ': types')
    check(p['lv'], p['id'] + ': no level-up moves')
check(len(D['TC']) == 18 and all(len(r) == 18 for r in D['TC'].values()), 'type chart 18 x 18')

# ---- the doc's counts ----
pc = drayano.pokemon_changes(doc('Pokemon Changes'))
tc = drayano.type_changes(doc('Type Changes'))
ec = drayano.evolution_changes(doc('Evolution Changes'))
mc = drayano.move_changes(doc('Move Changes'))
check(len(pc) == 649 and len({s.name for s in pc}) == 649, 'Pokemon Changes: 649 species blocks (got %d)' % len(pc))
check(len(tc) == 51, 'Type Changes: 51 rows (got %d)' % len(tc))
check(len(ec) == 94 and len({x[1] for x in ec}) == 86, 'Evolution Changes: 94 methods for 86 species')
check(len(mc.replacements) == 26, 'Move Changes: 26 replacements')
stat_species = {s.name for s in pc for f in s.fields if f.kind == 'Base Stats'}
check(len(stat_species) == 189, 'Pokemon Changes: 189 species with stats (got %d)' % len(stat_species))

# ---- every doc-changed species equals the doc ----
byname = {p['n']: p for p in P}
byid = {p['id']: p for p in P}
names = drayano.Names('species', [p['n'] for p in base])
abn = [a[0] for a in AB]
abilities = drayano.Names('ability', abn)
conflicts = 0
for sp in pc:
    page = RD.find(names(sp.name))
    p = byid[page.slug.replace('-', '_')]
    entries = [(p, BASE_LABEL.get(page.slug), True)] + [(byid[f[0]], f[3], False) for f in FORMS
                                                        if f[1] == page.slug and any(x.form == f[3] for x in sp.fields)]
    for q, label, isbase in entries:
        kw = {'version': VERSION, 'form': label}
        ok = lambda f: f and (f.form == label or (f.form or '').startswith('All ') or isbase and f.form is None)
        f = sp.pick('Base Stats', **kw)
        if ok(f):
            check(q['s'] == drayano.parse_stats(f.old_new()[1]), '%s stats %s != doc' % (q['id'], q['s']))
            conflicts += isbase and page.stats != q['s']
        f = sp.pick('Type', **kw)
        if ok(f):
            check(q['t'] == [t for t in drayano.parse_slash(f.old_new()[1]) if t], q['id'] + ' types != doc')
        f = sp.pick('Ability', **kw)
        if ok(f):
            slots = drayano.parse_slash(f.old_new()[1])
            got = [abn[i] for i in q['a']] + [abn[q['ha']] if q['ha'] >= 0 else None]
            want = list(dict.fromkeys(abilities(a) for a in slots[:2] if a))
            check(got[:-1] == want, q['id'] + ' abilities != doc')
check(conflicts == 189, 'stat conflicts with the mirror: 189 (got %d)' % conflicts)
for dex, name, old, new, why, line in tc:
    p = byid[RD.find(names(name)).slug.replace('-', '_')]
    check(p['t'] == new, '%s Type Changes %s != %s' % (p['id'], new, p['t']))

# ---- evolutions ----
for dex, name, sentence, line in ec:
    e = drayano.evo_method(sentence)
    a = byid[RD.find(names(name)).slug.replace('-', '_')]
    k = drayano.key(e.into)
    b = FORM_NAMES.get(k) or RD.find(names(e.into)).slug.replace('-', '_')
    check([e.how, b] in a['et'] and [e.how, a['id']] in byid[b]['ef'], 'evolution %s -> %s %s missing' % (a['id'], b, e.how))
vague = [(p['id'], h) for p in P for h, _ in p['et'] if h in ('evolution item', 'friendship', 'trade', 'special')]
check(not vague, 'vague evolution methods: %s' % vague[:5])

# ---- every move name in the docs resolves ----
moves = drayano.Names('move', M + [o for o, n, _ in mc.replacements])
for sp in pc:
    for f in sp.fields:
        if f.kind == 'Level Up':
            for i, t in f.rows:
                m = __import__('re').match(r'\s*\d+\s*-\s*(.+?)\s*$', t)
                if m:
                    moves(drayano.LV_MARKS.sub(' ', m.group(1)).strip(), 'Pokemon Changes:%d' % i)
    for machine, move, line in sp.tm_compat(version=VERSION):
        moves(move, 'Pokemon Changes:%d' % line)
for bl in mc.blocks:
    if bl.name != 'Further Modifications':
        moves(bl.name, 'Move Changes:%d' % bl.line)
check(not moves.unresolved, 'move names not resolved: %s' % list(moves.unresolved)[:10])

# ---- moves: the doc wins, the audit's conflict count ----
cf = sum(len(v.get('cf', [])) for v in MV)
check(cf == 154, 'move fields where the mirror disagrees: 154 (got %d)' % cf)
mv = dict(zip(M, MV))
check(mv['Shadow Claw']['bp'] == 90, 'Shadow Claw power 90')
check(mv['Esper Wing']['pr'] == 1 and mv['Esper Wing']['bp'] == 70, 'Esper Wing 70 power, +1 priority')
check(mv['Cut']['t'] == 'Grass' and mv['Covet']['t'] == 'Fairy' and mv['Rock Climb']['t'] == 'Rock', 'move type changes')
check(mv['Whirlwind']['ac'] is None and mv['Absorb']['bp'] == 35, 'accuracy never-miss, Absorb 35')
check(not ({o for o, n, _ in mc.replacements} - {'Submisson'}) & set(M), 'replaced moves are gone from M')

records = drayano.trainers(doc('Trainer Changes'), 'bb2r')
check(len(records) == 468, '468 trainer battle records parsed')
check(sum(len(record['rows']) for record in records) == 1867, '1867 doc Pokemon resolved')
check(all(record['rows'] for record in records), 'no empty trainer records')
check(sum(record['mode'] == 'normal' for record in records) == 31, '31 Normal source records')
expected_caps = [['Cheren', 14], ['Roxie', 21], ['Brycen', 23], ['Burgh', 29], ['Lenora and Hawes', 33],
                 ['Subway Masters', 36], ['Elesa', 38], ['Charles', 39], ['Rood', 41], ['Clay', 45], ['Colress', 53],
                 ['Skyla', 55], ['Bianca', 56], ['Hugh', 58], ['Benga', 62], ['Drayden', 64], ['Marlon', 68],
                 ['Ghetsis', 72], ['Lance', 76], ['Elite Four et al', 78], ['Iris', 79]]
check(D['TR']['caps'] == expected_caps, 'caps = the user plan, exactly')
check([group['cap'] for group in D['TR']['g']] == [row[1] for row in expected_caps] + [None], 'only cap boundaries plus Post-game')
trainers = [trainer for group in D['TR']['g'] for section in group['sec'] for trainer in section['tr']]
check(len(trainers) == 466, '466 cards after starter, version and joint-team expansion')
check(sum('normal' in trainer for trainer in trainers) == 31, '31 collapsed Normal teams')
check(sum('Challenge only' in trainer['tags'] for trainer in trainers) == 3, '3 Challenge-only cards')
check(sum('st' in trainer for trainer in trainers if 'School Kid' in trainer['n']) == 6, 'school trainers follow your starter')
report_text = (HERE / 'report.txt').read_text(encoding='utf-8')
for group in D['TR']['g']:
    for section in group['sec']:
        for trainer in section['tr']:
            check(0 < len(trainer['p']) <= 6, trainer['n'] + ': legal opponent party size')
            if group['cap'] and max(mon['l'] for mon in trainer['p']) > group['cap']:
                check(any('split-cap exception:' in line and trainer['n'] + ', levels' in line and
                          '> split cap %d ' % group['cap'] in line for line in report_text.splitlines()),
                      trainer['n'] + ': over-cap card listed as an exception')
            for team in [trainer] + trainer.get('pt', []) + ([trainer['normal']] if 'normal' in trainer else []):
                for mon in team['p']:
                    check(mon['id'] in byid, trainer['n'] + ': Pokemon resolved')
                    check(1 <= mon['l'] <= 100 and ('sl' not in mon or 1 <= mon['sl'] < mon['l']), trainer['n'] + ': displayed/stat level pair')
                    check(len(mon['iv']) == 6 and all(0 <= value <= 31 for value in mon['iv']), trainer['n'] + ': six IVs')
                    check('na' in mon or any('IVs/nature unknown' in note for note in mon.get('hn', [])), trainer['n'] + ': IV/nature uncertainty explicit')
                    check(mon['m'] and all(0 <= index < len(M) for index in mon['m']), trainer['n'] + ': all moves resolved')
                    check(0 <= mon['a'] < len(AB), trainer['n'] + ': ability resolved')
            if 'normal' in trainer:
                check(trainer['normal']['easy'] in (1, 2, 3, 4), trainer['n'] + ': Easy decrement')
                check(all('sl' not in mon for mon in trainer['normal']['p']), trainer['n'] + ': Normal uses stated levels')
cheren = next(trainer for trainer in trainers if trainer['n'] == 'Leader Cheren')
munchlax = next(mon for mon in cheren['p'] if mon['id'] == 'munchlax')
check(munchlax['l'] == 14 and munchlax['sl'] == 13, 'Challenge Cheren Munchlax displayed 14 / stat 13')
red = next(trainer for trainer in trainers if trainer['n'] == 'Red')
check(all(mon['l'] == 100 for mon in red['p']) and any('+7' in note for note in red['note']), 'Red stays at 100, +7 retained as text')
colress = next(trainer for trainer in trainers if trainer['n'] == 'Colress' and 'Postgame' in trainer['tags'])
klinklang = next(mon for mon in colress['p'] if mon['id'] == 'klinklang')
check(klinklang['i'] == 'Air Balloon' and 'Earthquake' in [M[index] for index in klinklang['m']] and
      klinklang['l'] == 92 and klinklang['sl'] == 88, 'settled Klinklang Air Balloon / Earthquake, 88+4')
check(not any('Grab' == M[index] for trainer in trainers for mon in trainer['p'] for index in mon['m']), 'Grab repaired to Snatch')
keys = json.loads((HERE / 'trainer_keys.json').read_text(encoding='utf-8'))
check(len({trainer['k'] for trainer in trainers}) == len(trainers), 'unique stable trainer keys')

if fails:
    print('FAIL blaze-black-2-redux extract-check: %d' % len(fails))
    for f in fails[:40]:
        print('  ' + f)
    sys.exit(1)
print('PASS blaze-black-2-redux extract-check: P %d, M %d, AB %d; 649 species / 189 stat / 51 type / 94 evolution / '
      '154 move-conflict counts reproduced' % (len(P), len(M), len(AB)))
print('PASS BB2R trainers: 468 records / 1867 doc Pokemon; 466 cards; 31 Normal teams / 3 Challenge-only; exact 21 caps; level pairs and over-cap reports checked')

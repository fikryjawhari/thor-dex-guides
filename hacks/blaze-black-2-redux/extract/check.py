"""Checks on a built hacks/blaze-black-2-redux/data.json against the docs (re-read with tools/drayano.py).

Usage (repo root): python -I hacks/blaze-black-2-redux/extract/check.py
Dex: the doc's own counts, every doc-changed species' stats / types / abilities equal the doc (Complete), every doc
evolution is an edge, every move name in the docs resolves, indexes in range, the move conflicts the audit counted.
"""
from pathlib import Path
import copy
import json
import re
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
data = HERE.parent / 'data.json'
if not data.is_file():
    print('SKIP blaze-black-2-redux extract-check: no data.json')
    sys.exit(0)

from common import RD, doc, drayano  # noqa: E402
from dex import BASE_LABEL, FORMS, FORM_NAMES, VERSION  # noqa: E402
import itemstd
import items

D = json.load(open(data, encoding='utf-8'))
M, MV, AB, P = D['M'], D['MV'], D['AB'], D['P']
fails = []


def check(ok, what):
    if not ok:
        fails.append(what)


# ---- shape ----
base = [p for p in P if p['id'] not in {f[0] for f in FORMS}]
check(len(base) == 649 and sorted(p['dex'] for p in base) == list(range(1, 650)), 'one base entry per dex 1-649')
check(len(P) == 649 + len(FORMS), 'P = 649 species + %d forms' % len(FORMS))
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

item_doc = drayano.items(doc('Item Changes'), 'bb2r')
check(len(item_doc['placements']) == 655, 'items: 655 placement statements including 3 deletions')
check(sum(bool(row['item']) for row in item_doc['placements']) == 652, 'items: 652 nonempty doc destinations')
check(len({row['area'] for row in item_doc['placements']}) == 69, 'items: 69 doc placement areas')
check([row['number'] for row in item_doc['tms']] == list(range(1, 96)), 'items: exactly TM01-TM95')
check(len(item_doc['marts']) == 6 and len(item_doc['pickup']) == 4, 'items: 6 mart subsections and 4 Pickup deltas')
check(len(item_doc['prices']) == 8 and len(item_doc['uses']) == 13, 'items: 8 price changes and 13 Use-option items')
records = items.item_locations(D)
item_rows = [row for box in D['IT'] for row in box['r']]
text_by_item = {}
for row in item_rows:
    text_by_item.setdefault(row[0], []).append(row[1])
doc_by_line = {}
for record in records:
    if record['source'] == 'Item Changes':
        doc_by_line.setdefault(record['line'], []).append(record)
    check(record['item'] in text_by_item, 'items: location item missing from IT: ' + record['item'])
    if record['link'] is not None:
        check(0 <= record['link'] < len(M) and M[record['link']] == record['item'].split(' ', 1)[1],
              'items: machine move link ' + record['item'])
for source in item_doc['placements']:
    if not source['item']:
        continue
    found = doc_by_line.get(source['line'], [])
    check(len(found) == len(items.choices(source)), 'items: every doc destination/choice present at line %d' % source['line'])
    for record in found:
        check(record['hidden'] == source['hidden'] and record['quantity'] == source['quantity'],
              'items: hidden/quantity at doc line %d' % source['line'])
        check(record['mode'] == source['mode'] and record['available'] == (source['mode'] != 'Easy/Normal'),
              'items: Challenge availability at doc line %d' % source['line'])
        check(any('Item Changes:%d]' % source['line'] in text for text in text_by_item.get(record['item'], [])),
              'items: final IT lost doc line %d' % source['line'])
tm_rows = [row for box in D['IT'] if box['n'] == 'TMs and HMs' for row in box['r'] if row[0].startswith('TM')]
hm_rows = [row for box in D['IT'] if box['n'] == 'TMs and HMs' for row in box['r'] if row[0].startswith('HM')]
check(len(tm_rows) == 95 and len(hm_rows) == 6, 'items: final IT has 95 TMs and 6 HMs')
for source in item_doc['tms']:
    found = doc_by_line.get(source['line'], [])
    move_name = drayano.Names('move', M)(source['move'])
    check(len(found) == 1 and found[0]['link'] is not None and M[found[0]['link']] == move_name,
          'items: TM%02d resolved against M' % source['number'])
check(not any(re.search(r'mode only\.|Modified|sells:|TM #|\{\{|\s{2,}', row[0]) for row in item_rows),
      'items: no footnotes, headings or fused location text parsed as item names')
check(not any(row[0] in ('Oval Stone', 'Red Scarf') for row in item_rows), 'items: replaced item IDs not restored from vanilla')
check(not any(row['source'].startswith('Bulbapedia') and row['item'] in ('HM05 Waterfall', 'HM06 Dive') for row in records),
      'items: doc Waterfall/Dive placements override vanilla')
check(any(row['item'] == 'HM01 Cut' and row['source'].startswith('Bulbapedia') for row in records), 'items: vanilla HM01 gap filled')
for record in records:
    if record['source'].startswith('Bulbapedia') and record['area'] == 'Castelia City' and 'Harlequin/Clerk' in record['note']:
        check(items.POSTGAME_VENDOR in record['note'], 'items: artist is postgame-only in Challenge')
shops = next(box['r'] for box in D['IT'] if box['n'] == 'Shops')
for row in shops:
    for line in row[1].splitlines():
        if line.startswith(('Battle Subway', 'Pokémon World Tournament')):
            check(items.POSTGAME_VENDOR in line, 'items: BP vendor is postgame-only in Challenge')
check(any(row[0] == 'TM68 Giga Impact' and 'doc mart prose prints TM66' in row[1] for row in shops),
      'items: Giga Impact mart typo resolved against TM table')
check(not itemstd.checks(D), 'items: Items standard: %s' % itemstd.checks(D))
check(all(row[4] in itemstd.STATS_SUBS for box in D['IT'] if box['n'] == 'Stats and Abilities' for row in box['r']),
      'items: standard stat subheadings')
check(all(row[4] in itemstd.HELD_CLASSES for box in D['IT'] if box['n'] == 'Held Items' for row in box['r']),
      'items: standard held-item subheadings')
check(not any(record['source'].startswith('Bulbapedia') and record['area'] in ('Route 4', 'Route 7', 'Humilau City')
              and re.search(r'held by|traded', record['note'], re.I) for record in records),
      'items: changed NPC trades do not restore vanilla held items')
check(sum(record['source'] == 'Trade Changes' for record in records) == 3, 'items: three doc trade held items')
pickup = items.pickup_table(item_doc)
check(not set(pickup) & {'Leftovers', 'Sun Stone', 'Moon Stone', "King's Rock"}, 'items: every Pickup substitution applied')
check(all(sum(percent for bands in pickup.values() for level, percent in bands if level == source[0]) == 100
          for source in items.PICKUP) and len(items.PICKUP) == 10, 'items: ten complete Pickup probability bands')
again = copy.deepcopy(D)
itemstd.standardise(again)
check(again['IT'] == D['IT'], 'items: Items standard is idempotent')

if fails:
    print('FAIL blaze-black-2-redux extract-check: %d' % len(fails))
    for f in fails[:40]:
        print('  ' + f)
    sys.exit(1)
print('PASS blaze-black-2-redux extract-check: P %d, M %d, AB %d; 649 species / 189 stat / 51 type / 94 evolution / '
      '154 move-conflict counts reproduced' % (len(P), len(M), len(AB)))
print('PASS items: 652 doc destinations / 69 areas; 95 TMs linked to M, 6 HMs; 6 marts; mode, source, deletion and standard checks')

"""Checks on a built hacks/blaze-black-2-redux/data.json against the docs (re-read with tools/drayano.py).

Usage (repo root): python -I hacks/blaze-black-2-redux/extract/check.py
Dex: the doc's own counts, every doc-changed species' stats / types / abilities equal the doc (Complete), every doc
evolution is an edge, every move name in the docs resolves, indexes in range, the move conflicts the audit counted.
"""
from pathlib import Path
import copy
from copy import deepcopy
import json
import re
import sys
from collections import Counter
import hashlib
import re

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
import locs
from gid import build as build_gid, replacements, tables

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
        check(any(line.startswith('Found: ' + record['area']) for text in text_by_item.get(record['item'], [])
                  for line in text.splitlines()), 'items: final IT lost doc line %d' % source['line'])
        if record['mode'] == 'Easy/Normal':
            check(any(line.startswith('Found: ' + record['area']) and 'Easy/Normal only, not in Challenge' in line
                      for text in text_by_item[record['item']] for line in text.splitlines()),
                  'items: Easy/Normal-only placement flagged at doc line %d' % source['line'])
tm_rows = [row for box in D['IT'] if box['n'] == 'TMs and HMs' for row in box['r'] if row[0].startswith('TM')]
hm_rows = [row for box in D['IT'] if box['n'] == 'TMs and HMs' for row in box['r'] if row[0].startswith('HM')]
check(len(tm_rows) == 95 and len(hm_rows) == 6, 'items: final IT has 95 TMs and 6 HMs')
for source in item_doc['tms']:
    move_name = drayano.Names('move', M)(source['move'])
    row = [row for row in tm_rows if row[0].startswith('TM%02d ' % source['number'])]
    check(len(row) == 1 and row[0][2] is not None and M[row[0][2]] == move_name,
          'items: TM%02d resolved against M' % source['number'])
    check(any(record['item'] == row[0][0] and items.area_key(record['area']) == items.area_key(source['area'])
              for record in records) or source['number'] == 57, 'items: TM%02d at its TM-table place' % source['number'])
    # TM57: the TM table still says Lentimas Town; the placement list moves it to Chargestone Cave (line 393) and puts
    # TM24 in its Lentimas slot (line 473). The placement list wins (notes.md -> Items).
check(not any(re.search(r'\[(?:Item Changes|Bulbapedia|RomHackDex)|Item Changes:\d', row[1]) for row in item_rows),
      'items: no source / line tags in IT text')
loc_names = set(D['LOC'])
for area in sorted({record['area'] for record in records} | set(items.shop_places(D))):
    place, joined = items.area_join(area, loc_names)
    check(bool(joined) != (place in items.NO_WILD), 'items: area %r joins a LOC area or is listed in NO_WILD' % area)
check(not any(re.search(r'Item Changes|Bulbapedia', record['note']) for record in records),
      'items: no source tags in location notes (the walkthrough shows them)')
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
check(any(row[0] == 'TM68 Giga Impact' and 'Doc says TM66' in row[1] for row in shops),
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
check({trainer['k'] for trainer in trainers} <= {entry['k'] for entry in keys}, 'every card key is in trainer_keys.json')
check(sum('split-cap exception:' in line for line in report_text.splitlines()) == 4,
      'four split-cap exceptions: TM Protectors Melody / Nikola, Black / White Kyurem')
check(sum('trainer recorded fix:' in line for line in report_text.splitlines()) == 5,
      'five recorded trainer fixes: Hugh Pansage lv, Banette Snatch, Noctowl, Jellicent, Klinklang')
hugh = next(trainer for trainer in trainers if trainer['n'] == 'Hugh' and trainer.get('st') == 'Grass')
check(max(mon['l'] for mon in hugh['p']) <= 14, 'Floccesy Hugh (Snivy branch) Pansage lv.19 typo repaired')
check(all(trainer['tags'].count('Challenge only') <= 1 for trainer in trainers), 'Challenge only tagged once')
wild = drayano.wild(doc('Wild Area Changes'), 'bb2r')
groups = [(area, group) for area in wild['areas'] for group in area['groups'] if group['rows']]
rows = [row for area, group in groups for row in group['rows']]
check(len(wild['areas']) == 81, 'wild doc: 81 area headers')
check(len(rows) == 2057, 'wild doc: 2,057 rate rows accounted for')
raw_rates = Counter((line, int(rate)) for line, text in enumerate(doc('Wild Area Changes').lines)
                    if line < wild['grottos'][0]['line'] for rate in re.findall(r'(?<!\d)(\d+)%', text))
check(Counter((row['line'], row['rate']) for row in rows) == raw_rates, 'every printed percentage accounted for on its source line')
totals = [(area['name'], group['method'], sum(row['rate'] for row in group['rows'])) for area, group in groups]
digest = hashlib.sha256(json.dumps(totals, ensure_ascii=True, separators=(',', ':')).encode()).hexdigest()
check(digest == 'a4f19eb2e2794196e24adbeb0ba8caa91655f7850df9ccb236d92569456e0d8c',
      'all 384 percentage-group totals match the doc, including its 47 non-100 totals')
check(Counter(total for _, _, total in totals) == {100: 337, 95: 12, 110: 11, 105: 10, 90: 8, 130: 3, 96: 3},
      'percentage totals retained, never silently normalized')
check(len(wild['grottos']) == 20 and sum(len(grotto['rows']) for grotto in wild['grottos']) == 206,
      '20 grottos / 206 rarity entries')
check(Counter(row['rarity'] for grotto in wild['grottos'] for row in grotto['rows']) ==
      {'Common': 78, 'Uncommon': 67, 'Rare': 60, 'Guaranteed': 1}, 'grotto rarity groups and guarantee')
initial_areas = [area['n'] for area in D['AR'][:104]]
check(len(initial_areas) == 104 and hashlib.sha256(json.dumps(initial_areas, separators=(',', ':')).encode()).hexdigest() ==
      '064e9b5747db74c05140e9c9170af3d79f60e96c75d3dc38512557dea6d8e924',
      'initial 104 AR indexes must remain append-only (81 source headers are not 81 tracker slots)')
check(len(set(area['n'] for area in D['AR'])) == len(D['AR']), 'one tracker slot per canonical area')
check(D['AR'][0].get('st') == 1 and not any(area.get('sub') for area in D['AR']), 'one Starter slot; no seasonal/grotto/egg sub-slots')
check(sorted(D['ARO']) == list(range(len(D['AR']))), 'ARO is a permutation, without changing saved AR indexes')
areas = {area['n']: area for area in D['AR']}
for area in D['AR']:
    check(all(0 <= index < len(D['LOC']) for index in area['l']), 'location indexes: ' + area['n'])
for pokemon in P:
    check(all(0 <= row[0] < len(D['LOC']) for row in pokemon['w']), 'P.w location indexes: ' + pokemon['id'])
for heading, names in locs.AREA_ALIASES.items():
    check(all(name in areas for name in names), 'alias points to canonical areas: ' + heading)
expected_wild = Counter()
for source, group in groups:
    area = areas[locs.wild_area_name(source['name'], group['method'])]
    season = locs.SEASON.search(source['name'])
    label = season[1] if season else group['method']
    section = next((section for section in area['es'] if section['n'] == label), None)
    check(section is not None, 'wild method/season section missing: ' + source['name'] + '/' + group['method'])
    if section:
        method = season[1] + ' - ' + group['method'] if season else ''
        output = next((entry for entry in section['g'] if entry['m'] == method), None)
        check(output is not None and sum(row['r'][0] for row in output['rows']) == sum(row['rate'] for row in group['rows']),
              'published rate-group sum differs: ' + source['name'] + '/' + group['method'])
        if output:
            check(Counter((row['p'], row['r'][0], re.match(r'Lv\. ([\d-]+)', row['note'])[1]) for row in output['rows']) ==
                  Counter((locs.species_id(row['species']), row['rate'], row['levels']) for row in group['rows']),
                  'published slot species/rates/levels differ: ' + source['name'] + '/' + group['method'])
    for row in group['rows']:
        species = locs.species_id(row['species'])
        check(species in byid, 'wild species resolved: ' + row['species'])
        method = (season[1] + ' - ' if season else '') + group['method']
        expected_wild[(species, area['l'][0], method, str(row['rate']) + '%', row['levels'])] += 1
actual_wild = Counter((pokemon['id'], row[0], row[1], row[2], row[3]) for pokemon in P for row in pokemon['w']
                      if len(row) > 5 and row[5] == 1 and row[2].endswith('%'))
check(actual_wild == expected_wild, 'P.w reproduces all 2,057 source slots with season, method, level and rate')
grotto_sections = [section for area in D['AR'] for section in area.get('es', []) if section['n'].startswith('Hidden Grotto')]
check(len(grotto_sections) == 20, '20 published grotto sections, not tracker areas')
check(sum(len(group['rows']) for section in grotto_sections for group in section['g']) == 206, 'all grotto rarity rows published')
check(all(row['r'] == [0, 0] and row['note'].split(';')[0] in ('Common', 'Uncommon', 'Rare', 'Guaranteed')
          for section in grotto_sections for group in section['g'] for row in group['rows']), 'no invented grotto rates')
check(any(row[1] == 'Hidden Grotto - Guaranteed' and row[3] == '30' and D['LOC'][row[0]] == 'Route 5'
          for row in byid['stantler']['w']), 'guaranteed Stantler shares Route 5 slot')
check(any(row['species'] == 'Mime Jr.' and row['levels'] == '32-36' for row in rows), 'missing Lv. marker parsed')
check(all(any(row['species'] == name for row in rows) for name in ('Unown-!', 'Unown-?', 'Porygon2')), 'punctuation/digits in names')
check(any(group['method'] == 'Grass, Surface, Normal' for area, group in groups if area['name'].startswith('Dreamyard')),
      'Dreamyard heading without colon parsed')
check(len(drayano.gifts(doc('Gift Pokemon'), 'bb2r')) == 17 and len(locs.legendary_records()) == 47, '13 gifts + 4 statics; 47 legendary species')
check(len(locs.RANCH_EGG) == 17 and 'Audino' not in locs.RANCH_EGG, 'ranch egg is the 17-species random pool, never Audino')
for block, pool, area in zip(drayano.gifts(doc('Gift Pokemon'), 'bb2r'), locs.GIFT_POOLS, locs.GIFT_AREAS, strict=True):
    for name in pool:
        species = locs.species_id(name)
        check(species in byid and any(D['LOC'][row[0]] == area for row in byid[species]['w']),
              'gift/static species and area resolved: ' + block['name'] + '/' + name)
for name, record in locs.legendary_records().items():
    check(any(D['LOC'][row[0]] == record['area'] and row[1] == ('Egg' if name == 'Manaphy' else 'Static')
              for row in byid[locs.species_id(name)]['w']), 'legendary species/area/method: ' + name)
check(not any(row[2] for row in byid['aerodactyl']['w'] if row[1] == 'Gift (Fossil revival)'),
      'Aerodactyl is not in Roark\'s random fossil pool')
check(sum(row[1] == 'Choice (Roark fossil)' and row[2] == '1 of 8' for pokemon in P for row in pokemon['w']) == 8,
      'Roark offers one of eight fossils, with all nine species revivable')
check(all(row[2] == '' for species in ('pansage', 'pansear', 'panpour') for row in byid[species]['w'] if row[1] == 'Gift'),
      'monkey gift depends on starter, not a random one-of-three rate')
check({pokemon['n'] for pokemon in P if any(row[1] == 'Egg' and D['LOC'][row[0]] == 'Floccesy Ranch' for row in pokemon['w'])} ==
      set(locs.RANCH_EGG), 'ranch egg pool published completely')
check(sum(row[1] == 'Trade' for pokemon in P for row in pokemon['w']) == 30, '3 doc + 3 other vanilla + 24 Curtis/Yancy trades')
check(any(row[1] == 'Trade' and D['LOC'][row[0]] == 'Humilau City' and 'Provisional' in row[4] for row in byid['phione']['w']),
      'Phione Humilau provisional trade')
check({pokemon['id']: pokemon['hi'] for pokemon in P if pokemon.get('hi')} ==
      {'latios': ['Soul Dew'], 'latias': ['Soul Dew'], 'giratina': ['Griseous Orb']}, 'EVless wild held-item exceptions only')
comparison = locs.mirror_comparison(wild)
check((comparison['areas'], comparison['match'], comparison['doc_only'], comparison['mirror_only']) == (81, 1296, 761, 0),
      'RomHackDex audit reproduced: 81 areas / 1,296 match / 761 omissions / zero disagreements')
print('Locations: 81 source headers; 104 initial AR slots; 352 sections; 2,057 wild rows; 20 grottos / 206 entries; '
      '47 legendary species; 30 trades; all source percentage groups reproduced')
ids, gid = tables(), D['GID']
check(all(f'{dex}:0' in gid['sp'] for dex in range(1, 650)), 'GID covers every base species 1-649')
check(set(gid['sp'].values()) == {p['id'] for p in P} - {'F00', 'MT', 'MT2', 'UFO'},
      'GID covers every guide form except the four trainer-only Pokestar creations')
check(set(gid['sp']) == set(gid['gr']), 'GID growth and species keys agree')
unsupported = {f'351:{form}' for form in range(1, 4)} | {f'493:{form}' for form in range(1, 17)}
check(set(gid['sp']) == {f'{dex}:{form}' for dex, form, _ in ids['forms']} - unsupported,
      'GID covers personal forms except unrepresented Castform weather / typed Arceus forms')
replace = replacements(ids)
check(len(replace) == 26, '26 replacement slots')
check(all(gid['mv'][slot] is not None and M[gid['mv'][slot]] == name for slot, name in replace.items()), 'every replacement retains its game slot')
mapped = {index for index in gid['mv'] if index is not None}
used = {index for p in P for field in ('tm', 'tu', 'eg') for index in p.get(field, [])}
used.update(index for p in P for _, index in p['lv'])
check(used <= mapped, 'every move used by a BB2R species has a game slot')
missing = [name for index, name in enumerate(M) if index not in mapped]
check(len(mapped) == 559 and len(missing) == 18 and all(name.startswith('Shadow ') for name in missing),
      'all 559 BB2R moves resolve; only 18 unused XD mirror catalogue entries lack Gen 5 IDs')
check(len(gid['mv']) == 560 and all(index is not None for index in gid['mv'][1:]), 'all B2W2 move slots map')
check(len(gid['ab']) == 165 and all(index is not None for index in gid['ab'][1:]), 'all B2W2 ability slots map')
print('GID unmapped moves:', ', '.join(missing) or 'none')
print('GID unmapped abilities:', ', '.join(a[0] for index, a in enumerate(AB) if index not in {value for value in gid['ab'] if value is not None}) or 'none')
print('GID unmapped species: Castform weather 351:1..3, typed Arceus 493:1..16 (no P entries)')
print('GID items:', 'deferred: IT empty' if not D['IT'] else 'mapped by IT name; see report')
check(gid['sp']['646:1'] == 'kyurem_white' and gid['sp']['646:2'] == 'kyurem_black', 'Kyurem form order: White then Black')
check(gid['sp']['550:1'] == 'basculin_blue_striped' and gid['sp']['422:1'] == 'shellos_east_sea', 'Basculin Blue / Shellos East form keys')
gid_items = {name for name in gid['it'] if name}
holdable = {row[0] for box in D['IT'] if box['n'] not in ('Key Items', 'Shops', 'TMs and HMs') for row in box['r']}
check(holdable <= gid_items, 'every holdable IT item maps in GID: missing %s' % sorted(holdable - gid_items))
unmapped = {row[0] for box in D['IT'] for row in box['r']} - gid_items - {'Old Sea Map'}
check(not unmapped, 'GID items: only Old Sea Map (no PKHeX name for its reused slot) unmapped; also %s' % sorted(unmapped))
with_items = deepcopy(D)
with_items['IT'] = [{'n': 'test', 'r': [['Leftovers', '', None], ['NeverMeltIce', '', None], ['Not A Game Item', '', None]]}]
build_gid(with_items)
check(with_items['GID']['it'][234] == 'Leftovers' and with_items['GID']['it'][246] == 'NeverMeltIce', 'item mapping after items merge, including aliases')
check('Not A Game Item' not in with_items['GID']['it'], 'unknown items are not assigned invented IDs')

if fails:
    print('FAIL blaze-black-2-redux extract-check: %d' % len(fails))
    for f in fails[:40]:
        print('  ' + f)
    sys.exit(1)
print('PASS blaze-black-2-redux extract-check: P %d, M %d, AB %d; 649 species / 189 stat / 51 type / 94 evolution / '
      '154 move-conflict counts reproduced' % (len(P), len(M), len(AB)))
print('PASS items: 652 doc destinations / 69 areas; 95 TMs linked to M, 6 HMs; 6 marts; mode, source, deletion and standard checks')
print('PASS BB2R trainers: 468 records / 1867 doc Pokemon; 466 cards; 31 Normal teams / 3 Challenge-only; exact 21 caps; level pairs and over-cap reports checked')

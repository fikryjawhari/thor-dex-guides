"""Radical Red extract checks: data.json against data.js and the author's sheets. One function per tab; each unit
adds its own (trainer_checks asserts). Usage: uv run python -I hacks/radical-red/extract/check.py

Locations (LOC / AR / P.w / P.g): every data.js area is a sublocation, every encounter in data.js is a P.w row of its
area, every area is in one tracker place, and every row resolves to a dex species; the locations sheet's additions
(sheet_locs.json) are all placed: Starter choice, Mystery Gift place, gift levels, trade wants, egg pools,
unobtainables."""
from pathlib import Path
import collections
import json
import re
import sys
from collections import Counter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import DATA, sid   # noqa: E402
data = Path(__file__).resolve().parents[1] / 'data.json'
if not data.is_file():
    print('SKIP radical-red extract-check: no data.json')
    sys.exit(0)
D = json.loads(data.read_text(encoding='utf-8'))
FAIL = []


def expect(ok, what):
    if not ok:
        FAIL.append(what)


def check_items():
    """Items (notes.md → Items): every machine, Mega Stone and care package against data.js and the item sheet, and
    the Hardcore view (Main tab, the sheet's Hardcore notes)."""
    import items
    from common import DATA
    rows = {r[0]: (box['n'], r) for box in D['IT'] for r in box['r']}
    lines = {name: r[1].splitlines() for name, (box, r) in rows.items()}
    # machines: every data.js TM / HM has a row, except the ones Hardcore lacks (TM107 / TM118 teach no move: no item)
    machines = set(items.TM_MOVES)
    have = {n.split(' ', 1)[0] for n, (box, r) in rows.items() if box == 'TMs and HMs'}
    expect(machines - have == items.HC_NO_TM, 'machines without a row: %s' % sorted(machines - have))
    expect(not have & items.HC_NO_TM, 'Hardcore-unavailable TMs listed: %s' % sorted(have & items.HC_NO_TM))
    expect(len(have) == len(machines) - len(items.HC_NO_TM), 'TM / HM rows %d, data.js %d' % (len(have), len(machines)))
    # Mega Stones: every Mega form's stone has a row and a place on the Pokémon page (the Primal orbs no source places)
    megas = {p['stone']: p for p in D['P'] if p.get('stone') and re.search(r'_(mega|primal)', p['id'])}
    unplaced = {s for s, p in megas.items() if not p.get('sloc')}
    expect(unplaced <= {'Red Orb', 'Adamant Orb'}, 'Mega Stones with no place: %s' % sorted(unplaced))
    expect(sum(1 for b, r in rows.values() if b == 'Mega Stones') == len(megas) - len(unplaced),
           'Mega Stone rows %d, placed stones %d' % (sum(1 for b, r in rows.values() if b == 'Mega Stones'),
                                                     len(megas) - len(unplaced)))
    # Hardcore swaps (Main E24 / E26)
    for stone, where in (('Charizardite Y', 'Route 16'), ('Charizardite X', 'Blaine'), ('Gardevoirite', 'Mansion'),
                         ('Cameruptite', 'Sabrina')):
        expect(any(where in x for x in lines.get(stone, [])), '%s: not at %s' % (stone, where))
    # Hardcore removals: no row, no wild holder; no removed tutor
    for item in items.HC_UNOBTAINABLE:
        expect(item not in rows, 'Hardcore-unobtainable %s listed' % item)
        expect(not any(h[0] == item for p in D['P'] for h in p.get('hi', [])), '%s still held by wild Pokémon' % item)
    tutors = {n for n, (box, r) in rows.items() if box == 'Move Tutors'}
    for gone in ('Swords Dance', 'Stealth Rock', 'Dragon Dance', 'Substitute', 'Rock Polish', 'Tailwind'):
        expect(gone not in tutors, 'Hardcore-removed tutor move listed: %s' % gone)
    expect(len(tutors) == 34, 'tutor moves %d, expected 34 (sheet 33 Hardcore + data.js Uproar)' % len(tutors))
    # care packages: every item the sheet gives in Hardcore (not red / blue, not unobtainable) has its line
    care = [x for n, ls in lines.items() for x in ls if x.startswith('Also: Care package')]
    given = 0
    for row, cells in items.tab('Care Packages'):
        for col, (text, font, fill) in cells.items():
            m = re.match(r'^(.+?) \[x\d+\]$', items.fix(text))
            if m and fill not in (items.RED, items.BLUE):
                item = items.name(m.group(1)) or m.group(1)
                if item not in items.HC_UNOBTAINABLE and items.box_of(item)[0] != items.NOT_LISTED:
                    given += 1
    expect(len(care) == given, 'care package lines %d, the sheet gives %d listed items' % (len(care), given))
    # every data.js shop stocks a line: Any Poké Mart for the marts' common stock
    expect(any('Shop: Any Poké Mart' in x for x in lines.get('Ultra Ball', [])), 'no Any Poké Mart line')
    # pickups: each Found / Also line has a pickup key; shops and wild lines none
    for box in D['IT']:
        for r in box['r']:
            if box['n'] in ('Move Tutors', 'Useful NPCs'):
                continue
            for text, k in zip(r[1].splitlines(), r[5]):
                expect(bool(k) == bool(re.match(r'(Found|Also):', text)) or box['n'] in items.UNIQUE | {'Key Items'},
                       'pickup key %r on %s: %s' % (k, r[0], text))
    # item text: every shown item has a description
    shown = {n for n, (box, r) in rows.items() if box not in ('TMs and HMs', 'Move Tutors', 'Useful NPCs')}
    expect(not [n for n in shown if not D.get('IX', {}).get(n, [''])[0]],
           'items with no description: %s' % sorted(n for n in shown if not D.get('IX', {}).get(n, [''])[0]))
    print('items: %d rows, %d machines, %d Mega Stones, %d tutor moves, %d care package lines' % (
        len(rows), len(have), len(megas) - len(unplaced), len(tutors), len(care)))



METHODS = {'Grass/cave', 'Surf', 'Old Rod', 'Good Rod', 'Super Rod', 'Rock Smash', 'Raid', 'Static', 'Gift',
           'Trade', 'Roaming', 'Starter choice', 'Shard trade', 'Shard egg', 'Fossil (pick one)', 'Mystery Gift',
           'Wonder Egg', 'Paldea Egg', 'Sevii Egg'}
SHEET = json.loads((HERE / 'sheet_locs.json').read_text(encoding='utf-8'))


def expected_pairs():
    """(area index, species id) for every encounter entry in data.js (wild lists, raids, fixed tables)."""
    pairs = set()
    for area, record in enumerate(DATA['areas']):
        for key, table in record.items():
            if not isinstance(table, dict) or key in ('item-standard', 'item-hidden', 'item-cheat', 'item-shop',
                                                       'trainers', 'tutors'):
                continue
            for entries in table.values():
                for entry in entries:
                    if key.startswith('wild'):
                        values = [entry[0]]
                    elif key.startswith('raid'):
                        values = [entry[0]]
                    else:
                        values = [entry] if isinstance(entry, int) else []
                    for value in values:
                        pairs.add((area, sid(str(value))))
    return pairs


def check_locations(data, failures):
    areas = DATA['areas']
    if data['LOC'] != [area['name'] for area in areas] + [SHEET['mystery']['area']]:
        failures.append('LOC is not the %d data.js areas then the Mystery Gift place' % len(areas))
    covered = Counter(index for place in data['AR'] for index in place['l'])
    if sorted(covered) != list(range(len(data['LOC']))) or any(count != 1 for count in covered.values()):
        failures.append('AR.l does not place every LOC exactly once')
    ids = {mon['id'] for mon in data['P']}
    rows = {(row[0], mon['id']) for mon in data['P'] for row in mon['w']}
    for mon in data['P']:
        for row in mon['w']:
            if not 0 <= row[0] < len(data['LOC']):
                failures.append('%s: P.w LOC index %s out of range' % (mon['id'], row[0]))
            if row[1] not in METHODS:
                failures.append('%s: unknown P.w method %r' % (mon['id'], row[1]))
    for place in data['AR']:
        for section in place.get('es', []):
            for group in section['g']:
                for row in group['rows']:
                    if row['p'] not in ids:
                        failures.append('encounter species %r does not resolve' % row['p'])
    missing = sorted(pair for pair in expected_pairs() if pair not in rows and pair[1] is not None)
    if missing:
        failures.append('%d data.js encounters have no P.w row, e.g. %s' % (len(missing), missing[:5]))
    unresolved = sorted(area for area, species in expected_pairs() if species is None)
    if unresolved:
        failures.append('%d data.js encounter species do not resolve' % len(unresolved))
    obtainable = sum(mon['g'] == 0 for mon in data['P'])
    if not obtainable:
        failures.append('no obtainable species')
    check_sheet(data, failures)


def check_sheet(data, failures):
    by_id = {mon['id']: mon for mon in data['P']}
    loc = {name: index for index, name in enumerate(data['LOC'])}
    starters = [mon['id'] for mon in data['P'] if any(row[1] == 'Starter choice' for row in mon['w'])]
    lab = [place for place in data['AR'] if place.get('st')]
    if len(starters) != 27 or len(lab) != 1 or lab[0]['l'] != [loc[SHEET['starter']]]:
        failures.append('starter choice: %d species, %d starter places' % (len(starters), len(lab)))
    gift = loc[SHEET['mystery']['area']]
    place = next(place for place in data['AR'] if place['l'] == [gift])
    for name, _ in SHEET['mystery']['rows']:
        if not any(row[0] == gift and row[1] == 'Mystery Gift' and row[3] == '85' for row in by_id[sid(name)]['w']):
            failures.append('Mystery Gift %s has no Lv 85 row' % name)
    if not place.get('ns') or not place.get('es'):
        failures.append('Mystery Gift place should have encounters and no tracker slot')
    for area, mons in SHEET['gifts'].items():
        for name, (level, how) in mons.items():
            if not any(row[0] == loc[area] and row[1] == 'Gift' and row[3] == str(level) and how in row[4]
                       for row in by_id[sid(name)]['w']):
                failures.append('gift %s at %s has no Lv %d row' % (name, area, level))
    for area, wanted in SHEET['trades'].items():
        if not any(row[0] == loc[area] and row[1] == 'Trade' and row[4].endswith('for a ' + wanted)
                   for mon in data['P'] for row in mon['w']):
            failures.append('trade at %s does not say it wants %s' % (area, wanted))
    for egg in SHEET['eggs']:
        rate = '1 of %d' % len(egg['species'])
        for area, _, _ in egg['areas']:
            lacking = [name for name in egg['species'] if not any(
                row[0] == loc[area] and row[1] == egg['method'] and row[2] == rate for row in by_id[sid(name)]['w'])]
            if lacking:
                failures.append('%s at %s: %d species without a row, e.g. %s' % (egg['method'], area, len(lacking),
                                                                                lacking[:3]))
    unobtainable = {sid(name) for name in SHEET['unobtainable']}
    missing = sorted(mon['id'] for mon in data['P']
                     if mon['g'] == 3 and not mon.get('fc') and mon['id'] not in unobtainable)
    if missing:
        failures.append('%d species not found that the sheet calls available, e.g. %s' % (len(missing), missing[:5]))
    for name in SHEET['unobtainable']:     # pruned (gone from P) is fine too
        if sid(name) in by_id and by_id[sid(name)]['g'] != 3:
            failures.append('%s should be unobtainable (g 3)' % name)



def trainer_checks(D):
    """TR from data.js and the Hardcore workbook (notes.md → Trainers, Caps)."""
    from common import DATA, CAPS
    import bosssheet
    import trainers as T
    TR = D['TR']
    caps = [c['cap'][1] for c in CAPS]
    # the 18 Hardcore caps: Main E44:E78 = data.js caps = the boxes
    assert bosssheet.main_caps() == ['%s (%d)' % sc for sc in zip(T.SPLITS, caps)]
    assert [[g['n'], g['cap']] for g in TR['g']] == [['%s Split [Cap %d]' % sc, sc[1]] for sc in zip(T.SPLITS, caps)]
    assert TR['caps'] == [[n, c] for n, c in zip(T.SPLITS, caps)]
    cards = [(g, s, t) for g in TR['g'] for s in g['sec'] for t in s['tr']]
    for g, s, t in cards:
        assert t['cap'] == g['cap'], (g['n'], t['k'])
        assert t['loc'] == s['h'], t['k']
    # all 464 data.js trainers: a card each (by the key table's game id), the two partners, the two same-team copies
    keys = {e['k']: e for e in json.load(open(Path(__file__).with_name('trainer_keys.json'), encoding='utf-8'))}
    ids = [keys[t['k']]['id'] for _, _, t in cards]
    assert len(ids) == len(set(ids)) == 460, len(ids)
    every = set(ids) | set(T.PARTNERS) | set(T.SAME_TEAM)
    assert every == set(DATA['trainers']) and len(DATA['trainers']) == 464
    assert not set(ids) & (set(T.PARTNERS) | set(T.SAME_TEAM))
    split_of = {keys[t['k']]['id']: g['n'] for g, _, t in cards}
    # the user's answers: Justin (Route 12) in the Koga split, Lewis (Pokémon Mansion B1F) in the May split
    assert split_of['477'] == 'Pre-Koga Split [Cap 68]' and split_of['219'] == 'Pre-May Split [Cap 73]'
    by_id = {keys[t['k']]['id']: t for _, _, t in cards}
    assert all(m['l'] == 68 + {101: -2, 102: -1, 103: 0, 104: -3}[x['level']]
               for m, x in zip(by_id['477']['p'], DATA['trainers']['477']['hardcore']))
    # gym rematches: Pre-Koga, the cap box, the one note
    for i in T.REMATCHES:
        t = by_id[i]
        assert split_of[i] == 'Pre-Koga Split [Cap 68]' and all('r' in m for m in t['p']), i
        assert T.REMATCH_NOTE in t['note'] and 'Optional' not in t['tags'], i
    # the cap box: every range / open Trainer Order entry with scaled levels; nothing else relative
    relative = {i for i, t in by_id.items() if any('r' in m for m in t['p'])}
    order = bosssheet.trainer_order()
    assert len(order) == 115 and len(relative) == 46, (len(order), len(relative))
    for i in relative:
        assert not any('l' in m for m in by_id[i]['p']), i
    # the rival follows the starter type: each team set covers Fire / Grass / Water once
    rivals = collections.defaultdict(list)
    for i, t in by_id.items():
        if t['n'] in ('Rival Blue', 'Champion Blue'):
            rivals[(t['loc'], DATA['trainers'][i]['cap'])].append(t.get('st'))
    assert len(rivals) == 6 and all(sorted(v) == ['Fire', 'Grass', 'Water'] for v in rivals.values()), dict(rivals)
    # partners and shared battles
    assert [p['n'] for p in by_id['53']['pt']] == [p['n'] for p in by_id['54']['pt']] == ['PkMn Trainer Brendan']
    assert by_id['53']['bt'] == by_id['54']['bt'] and [p['n'] for p in by_id['69']['pt']] == ['Champion Lance']
    doubles = [t for _, _, t in cards if 'Double Battle' in t['tags']]
    assert len(doubles) == 47, len(doubles)
    print('PASS trainers: 464 data.js trainers (460 cards, 2 partners, 2 same-team), 18 Hardcore splits, '
          '%d cap-box cards, %d doubles, Justin / Lewis / rematch placement, rivals by starter type' %
          (len(relative), len(doubles)))


def check_walk(D):
    """WK (notes.md → Walkthrough): the 18 Trainers boxes in TR.caps order, every card in one stop of its own split,
    each split ending at its cap boss, every Found / Also pickup placed or in np, stop keys = walk.py's ROUTE."""
    import walk
    W, TR = D['WK'], D['TR']
    assert [s['n'] for s in W['splits']] == [g['n'] for g in TR['g']], 'walk: splits are not the Trainers boxes'
    assert [re.sub(r'(?: Split)? \[Cap \d+\]$', '', s['n']) for s in W['splits']] == [n for n, c in TR['caps']]
    assert [int(re.search(r'\[Cap (\d+)\]$', s['n']).group(1)) for s in W['splits']] == [c for n, c in TR['caps']]
    stops = [(si, st) for si, s in enumerate(W['splits']) for st in s['st']]
    keys = [st['k'] for _, st in stops]
    assert keys == [r[1] for r in walk.route()], 'walk: stop keys differ from ROUTE'
    assert len(set(keys)) == len(keys) and not any(re.match(r'\d+\.\d+', k) for k in keys)
    where = collections.defaultdict(list)
    for si, st in stops:
        for k in st['tr']:
            where[k].append(si)
    cards = {t['k']: gi for gi, g in enumerate(TR['g']) for s in g['sec'] for t in s['tr']}
    assert set(where) == set(cards), 'walk: trainers missing %s, unknown %s' % (
        sorted(set(cards) - set(where))[:5], sorted(set(where) - set(cards))[:5])
    wrong = [(k, v, cards[k]) for k, v in where.items() if v != [cards[k]]]
    assert not wrong, 'walk: a card twice or outside its box: %s' % wrong[:5]
    # each split's last stop ends with its cap boss (data.js trainer ids; the Champion's three starter teams)
    tid = {e['k']: e['id'] for e in json.load(open(HERE / 'trainer_keys.json', encoding='utf-8'))}
    bosses = ['414', '46', '415', '416', '417', '348', '54', '349', '420', '418', '61', '419', '68', '69', '74', '26',
              '438 439 440']
    for si, boss in enumerate(bosses):
        last = W['splits'][si]['st'][-1]['tr']
        assert last and tid[last[-1]] in boss.split(), (W['splits'][si]['n'], last[-1:])
    # pickups: every keyed Found / Also line of IT is a walkthrough row (a stop or np), each row keyed once
    rows = [r for _, st in stops for r in st['it']] + W['np']
    wk = [r[4] for r in rows]
    assert all(wk) and len(wk) == len(set(wk)), 'walk: an item row unkeyed or twice'
    it = {r[5][i] for b in D['IT'] for r in b['r'] for i, line in enumerate(r[1].splitlines())
          if r[5][i] and line.startswith(('Found:', 'Also:'))}
    assert it == set(wk), 'walk: pickups not in the walkthrough %d, rows with no Found / Also line %d' % (
        len(it - set(wk)), len(set(wk) - it))
    print('PASS walkthrough: %d splits = TR.caps, %d stops (keys from ROUTE), %d cards each in one stop of its box, '
          'cap bosses last, %d pickups placed, %d in np' % (len(W['splits']), len(stops), len(where),
                                                             len(rows) - len(W['np']), len(W['np'])))


check_items()
check_locations(D, FAIL)
trainer_checks(D)
check_walk(D)
if FAIL:
    print('FAIL radical-red extract-check:\n  ' + '\n  '.join(FAIL))
    sys.exit(1)
print('OK radical-red extract-check')

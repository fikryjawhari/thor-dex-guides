"""Radical Red extract checks: data.json against data.js and the author's sheets. One function per tab; each unit
adds its own (trainer_checks asserts). Usage: uv run python -I hacks/radical-red/extract/check.py

Locations (LOC / AR / P.w / P.g): every data.js area is a sublocation, every encounter in data.js is a P.w row of its
area, every area is in one tracker place, and every row resolves to a dex species; the locations sheet's additions
(sheet_locs.json) are all placed: Starter choice, Mystery Gift place, gift levels, trade wants, the egg each
vendor place sells (an area note; one row only for species an egg alone gives), unobtainables."""
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
    # tutors Hardcore removes: neither the Move Tutors box nor any species' P.tu lists them
    gone = items.hardcore_gone_tutors()
    expect(gone and not [n for n in gone if n in rows], 'Hardcore-removed tutors listed: %s' % sorted(gone & set(rows)))
    taught = {D['M'][i] for mon in D['P'] for i in mon['tu']}
    expect(not taught & gone, 'P.tu has Hardcore-removed tutor moves: %s' % sorted(taught & gone))
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
    egg_methods = {egg['method'] for egg in SHEET['eggs']}
    place = {index: ar for ar in data['AR'] for index in ar['l']}
    for egg in SHEET['eggs']:
        for area, _, _ in egg['areas']:
            if egg['method'] not in place[loc[area]].get('note', ''):
                failures.append('%s: the place note does not name the %s' % (area, egg['method']))
    egg_rows = collections.Counter(mon['id'] for mon in data['P'] for row in mon['w'] if row[1] in egg_methods)
    if any(count > 1 for count in egg_rows.values()):
        failures.append('species with more than one egg row: %s' % [k for k, v in egg_rows.items() if v > 1][:5])
    for ar in data['AR']:
        for section in ar.get('es', []):
            if any(group['m'].split(' · ')[0] in egg_methods for group in section['g']):
                failures.append('%s still lists an egg pool section' % ar['n'])
    pooled = {sid(name) for egg in SHEET['eggs'] for name in egg['species']}
    lost = sorted(i for i in pooled if i in by_id and by_id[i]['g'] == 3 and i not in
                  {sid(name) for name in SHEET['unobtainable']})
    if lost:
        failures.append('%d egg pool species not obtainable, e.g. %s' % (len(lost), lost[:5]))
    unobtainable = {sid(name) for name in SHEET['unobtainable']}
    missing = sorted(mon['id'] for mon in data['P']
                     if mon['g'] == 3 and not mon.get('fc') and mon['id'] not in unobtainable)
    if missing:
        failures.append('%d species not found that the sheet calls available, e.g. %s' % (len(missing), missing[:5]))
    for name in SHEET['unobtainable']:     # pruned (gone from P) is fine too
        if sid(name) in by_id and by_id[sid(name)]['g'] != 3:
            failures.append('%s should be unobtainable (g 3)' % name)



def trainer_order_ids():
    """[(the split its row sits in, data.js ids)] for each Trainer Order entry: the entry's trainers and its other teams
    (same name, place and data.js cap; Bugsy's post-Surge team), as trainers.py groups them."""
    import bosssheet
    import trainers as T
    matched = T.match_blocks()
    T_ = DATA['trainers']
    linked = [matched[(b.sheet, b.row)] for b in (T._link_block(e.link) for e in bosssheet.trainer_order())]
    direct = {i for ids in linked for i in ids}
    teams = {i for ids in matched.values() for i in ids}
    out, split = [], 0
    for e, ids in zip(bosssheet.trainer_order(), linked):
        f = T_[ids[0]]
        alts = [i for i in T_ if i not in direct and i in teams and (T_[i]['name'], T_[i]['areaName'], T_[i]['cap']) ==
                (f['name'], f['areaName'], f['cap'])]
        alts += [i for i, j in T.TEAM_OF.items() if j in ids]
        out.append((split, ids + alts))
        if split < len(T.ENDERS) and e.name == T.ENDERS[split]:
            split += 1
    return out


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
    by_id = {keys[t['k']]['id']: t for _, _, t in cards}
    # the user's rulings (2026-11-02): every Trainer Order entry in the split its row sits in (Justin, Route 12: Pre-Koga;
    # Lewis, Pokémon Mansion B1F: after May, Pre-Blaine at cap 76), apart from the Johto group
    rows = trainer_order_ids()
    for split, ids in rows:
        for i in (i for i in ids if i not in T.SAME_TEAM):
            want = T.GROUPS.get(i, T.SPLITS[split])
            assert split_of[i].startswith(want + ' Split'), (i, split_of[i], want)
    assert split_of['477'] == 'Pre-Koga Split [Cap 68]' and split_of['219'] == 'Pre-Blaine Split [Cap 76]'
    assert by_id['219']['cap'] == 76 and [m['l'] for m in by_id['219']['p']] == [
        76 + DATA['scaledLevels'][str(x['level'])] for x in DATA['trainers']['219']['hardcore']]
    # the optional Johto leaders (Bugsy after Lt. Surge, Whitney, Morty, Chuck) in Pre-Erika with the cap box; Bugsy
    # before Lt. Surge in Pre-Lt. Surge
    assert set(T.JOHTO) == {'8', '49', '52', '317'}
    for i in T.JOHTO:
        assert split_of[i] == 'Pre-Erika Split [Cap 44]' and all('r' in m for m in by_id[i]['p']), i
        assert 'Optional' in by_id[i]['tags'], i
    assert split_of['47'] == 'Pre-Lt. Surge Split [Cap 36]' and all('r' in m for m in by_id['47']['p'])
    # the hard line at Lt. Surge: nothing from Route 9, Rock Tunnel, Route 10, Route 8 or the Saffron Dojo before him
    later = ('Route 9', 'Rock Tunnel', 'Route 10', 'Route 8', 'Saffron City Fighting Dojo')
    early = [t['n'] for g, _, t in cards if g['n'].startswith('Pre-Lt. Surge ') and
             re.sub(r' (\d+F|B\d+F)$', '', t['loc']) in later]
    assert not early, early
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
    assert len(order) == 115 and len(relative) == 47, (len(order), len(relative))
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
          '%d cap-box cards, %d doubles, Trainer Order rows / Johto group / Lt. Surge line / rematch placement, rivals by '
          'starter type' %
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
    # the user's rulings (2026-11-02)
    import route
    import trainers as T
    card_of = {t['k']: t for g in TR['g'] for s in g['sec'] for t in s['tr']}
    mini = {i for _, ids in trainer_order_ids() for i in ids}
    stop_of = {tid[k]: (si, st['k']) for si, st in stops for k in st['tr']}
    # ordinary trainers: their box is the split of their walkthrough visit (route.py), whatever their data.js cap
    for i, (si, key) in stop_of.items():
        if i not in mini:
            assert route.visit_split(i, DATA['trainers'][i]['areaName'], DATA['trainers'][i]['cap']) == si, (i, key)
    # a place's mini bosses before its ordinary trainers in each stop (a gym: its trainers, then the leader; the cap
    # boss last)
    # Archer and Ariana end both their splits together (Silph Co. 11F tag battle; Cerulean Cave 1F, one after the other)
    cap_boss = {i for boss in bosses for i in boss.split()} | {'53', '67'}
    for si, st in stops:
        seen = collections.defaultdict(lambda: False)
        for k in st['tr']:
            loc, i = card_of[k]['loc'], tid[k]
            if 'Gym' in loc or i in cap_boss:
                continue
            assert not (i in mini and seen[loc]), ('walk: ordinary trainer before a mini boss', st['k'], i)
            seen[loc] |= i not in mini
    for st in (st for _, st in stops if 'gym' in st['k']):
        ids = [tid[k] for k in st['tr']]
        leaders = [n for n, i in enumerate(ids) if card_of[st['tr'][n]]['n'].startswith('Leader ')]
        assert not leaders or leaders == [len(ids) - 1], ('walk: gym leader not last', st['k'])
    # one S.S. Anne visit, in Pre-Lt. Surge after the Dig House Grunt and Camper Jeff
    anne = [(si, st['k']) for si, st in stops if any(card_of[k]['loc'].startswith('S.S. Anne') for k in st['tr'])]
    surge = [st['k'] for si, st in stops if si == 3]
    assert anne == [(3, 'ss-anne')] and surge.index('ss-anne') > max(surge.index('cerulean-dig-house'),
                                                                     surge.index('route-6-jeff')), anne
    # the Johto group: one stop in Pre-Erika (Bugsy after Lt. Surge, Whitney, Morty, Chuck); Bugsy before him in Pre-Lt. Surge
    assert [stop_of[i] for i in T.JOHTO] == [(4, 'johto-leaders')] * 4 and stop_of['47'][0] == 3
    # Lewis with the rest of the Mansion, after May
    assert stop_of['219'] == (11, 'pokemon-mansion')
    # pickups: every keyed Found / Also line of IT is a walkthrough row (a stop or np), each row keyed once
    rows = [r for _, st in stops for r in st['it']] + W['np']
    wk = [r[4] for r in rows]
    assert all(wk) and len(wk) == len(set(wk)), 'walk: an item row unkeyed or twice'
    it = {r[5][i] for b in D['IT'] for r in b['r'] for i, line in enumerate(r[1].splitlines())
          if r[5][i] and line.startswith(('Found:', 'Also:'))}
    assert it == set(wk), 'walk: pickups not in the walkthrough %d, rows with no Found / Also line %d' % (
        len(it - set(wk)), len(set(wk) - it))
    print('PASS walkthrough: %d splits = TR.caps, %d stops (keys from ROUTE), %d cards each in one stop of its box, '
          'cap bosses last, ordinary trainers in their visit split, mini bosses first, one S.S. Anne visit, the Johto '
          'group, %d pickups placed, %d in np' % (len(W['splits']), len(stops), len(where),
                                                             len(rows) - len(W['np']), len(W['np'])))


check_items()
check_locations(D, FAIL)
trainer_checks(D)
check_walk(D)
if FAIL:
    print('FAIL radical-red extract-check:\n  ' + '\n  '.join(FAIL))
    sys.exit(1)
print('OK radical-red extract-check')

"""Checks on a built data.json, reproduced from the raw sources (dex part; units 4-7 add theirs).
Usage: uv run python -I hacks/unbound/extract/check.py

- Counts: every RomHackDex page placed (a P entry, merged into one, or dropped for a known reason), M = moves.json less
  the Z / Max copies and the CFRU spellings of one move, AB = every ability a species has.
- Integrity: unique ids and names, valid move / ability indexes, evolutions both ways, every Mega's stone.
- Wiki vs the dex: the number of species whose types / abilities the wiki gives differently (EXPECTED; notes.md lists
  them), so a source update that changes them is noticed.
- Locations: every numeric-rate row of the wiki's location pages is a P.w row (area, method, rate, time) and the AR.es
  sections reproduce the rates; every species resolves through sid; 67 location pages, 54 with rated rows, 32 raid
  dens, one tracker slot per area; the doc / RomHackDex difference counts (LOC_EXPECTED; notes.md -> Locations).
- Game tables: when hzla's unbound_2_1_constants.js (generated from Skeli's Unbound-Cloud) is under .src/repos/, every
  species' types, stats and abilities against it.
"""
import collections
import glob
import json
import os
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402
from common import FORMS, H, RD, WIKI, cfru, key, pid  # noqa: E402

EXPECTED = {'wiki types': 0, 'wiki abilities': 16, 'dropped': 38, 'merged': 116, 'no stone': ['rayquaza_mega'],
            'no description': [], 'not in game table': ['shadow_warrior'],
            'no save id': ['aegislash_blade', 'darmanitan_g_zen', 'darmanitan_zen', 'eiscue_noice', 'greninja_ash',
                           'meloetta_pirouette', 'necrozma_ultra', 'shadow_warrior', 'zygarde_complete'],
            # prune.py (EI's rule): the species no source places (notes.md -> Locations, Availability)
            'pruned': ['calyrex', 'calyrex_ice_rider', 'calyrex_shadow_rider', 'cubone_a', 'eternatus', 'glastrier', 'kubfu',
                       'pikachu_belle', 'pikachu_cosplay', 'pikachu_libre', 'pikachu_phd', 'pikachu_pop_star',
                       'pikachu_rock_star', 'spectrier', 'urshifu', 'urshifu_rapid', 'zacian', 'zacian_crowned',
                       'zamazenta', 'zamazenta_crowned', 'zygarde_10'],
            'pruned abilities': ['As One (Glastrier)', 'As One (Spectrier)', 'Chilling Neigh', 'Dauntless Shield',
                                 'Grim Neigh']}    # battle-only forms read as their base (gid.py)
LOC_EXPECTED = {'areas': 69, 'slots': 63, 'pages': 67, 'rated pages': 54, 'rated rows': 1161, 'dens': 32,
                'raid rows': 462, 'doc wild rows added': 52, 'doc special added': 21, 'legend page added': 40,
                'mystery gifts': 34, 'rhd areas': 52, 'rhd only': 40, 'guide only': 297}
FAIL = []


def check(ok, msg):
    if not ok:
        FAIL.append(msg)


def main():
    path = os.path.join(H.dir, 'data.json')
    if not os.path.isfile(path):
        print('SKIP unbound extract-check: no data.json')
        return 0
    D = json.load(open(path, encoding='utf-8'))
    M, AB, P = D['M'], D['AB'], D['P']
    S = RD.species()
    ids = {p['id']: p for p in P}

    # ---- every mirror page placed ----
    placed, merged, dropped = 0, 0, collections.Counter()
    for slug, f in FORMS.items():
        if f.kind == 'drop':
            dropped[f.drop] += 1
            continue
        into = cfru.merge_into(f, FORMS, S)
        if into:
            merged += 1
            check(pid(into) in ids or pid(into) in EXPECTED['pruned'], 'merged page %s: target %s not in P' % (slug, pid(into)))
        else:
            placed += 1
            check(pid(slug) in ids or pid(slug) in EXPECTED['pruned'], 'mirror page %s not in P' % slug)
    check(placed == len(P) + len(EXPECTED['pruned']), 'P %d entries, mirror pages placed %d' % (len(P), placed))
    check(sum(dropped.values()) == EXPECTED['dropped'], 'dropped %s' % dict(dropped))
    check(merged == EXPECTED['merged'], 'merged %d' % merged)

    # ---- moves and abilities reproduced ----
    raw = json.load(open(os.path.join(H.src, 'romhackdex', 'moves.json'), encoding='utf-8'))
    names = {cfru.official(m['n']) for m in raw if not cfru.move_kind(m['n'])}
    check(set(M) == names and len(M) == len(names), 'M %d, moves.json gives %d official names' % (len(M), len(names)))
    used = {AB[i][0] for p in P for i in p['a'] + ([p['ha']] if p['ha'] >= 0 else [])}
    check({a[0] for a in AB} - used == set(EXPECTED['pruned abilities']), 'AB has abilities no species has: %s' % ({a[0] for a in AB} - used))
    nodesc = sorted(a[0] for a in AB if not a[1])
    check(nodesc == EXPECTED['no description'], 'abilities without a description: %s' % nodesc)

    # ---- integrity ----
    for k in ('id', 'n'):
        dup = [x for x, c in collections.Counter(p[k] for p in P).items() if c > 1]
        check(not dup, 'duplicate P %s: %s' % (k, dup))
    nm, na = len(M), len(AB)
    for p in P:
        check(all(0 <= i < nm for _, i in p['lv']) and all(0 <= i < nm for f in ('tm', 'tu', 'eg') for i in p[f]),
              '%s: a move index out of range' % p['id'])
        check(all(0 <= i < na for i in p['a']) and -1 <= p['ha'] < na, '%s: an ability index out of range' % p['id'])
        for how, t in p['et']:
            check(t in ids and [how, p['id']] in ids[t]['ef'], '%s -> %s: no matching ef' % (p['id'], t))
        check(all(t in ids for t in p['of']), '%s: of lists a missing id' % p['id'])
    nostone = [p['id'] for p in P if p['g'] == 1 and not p.get('stone')]
    check(nostone == EXPECTED['no stone'], 'Megas without a stone: %s' % nostone)

    # ---- wiki vs the dex (types, abilities of species the wiki has a page for) ----
    wm = {key(t): m for t, m in WIKI.pokemon().items()}
    abn = [a[0] for a in AB]
    count = collections.Counter()
    for p in P:
        w = wm.get(key(p['n']))
        if not w or p['g'] == 1 or p.get('fc') or common.FORMS_KIND(p['id']) not in ('base', 'regional'):
            continue
        count['wiki types'] += bool(w.types and w.types != p['t'])
        wab = {key(cfru.official(common.WIKI_ABILITY_FIX.get(a, a))) for a, _, _ in w.abilities}
        mine = {key(abn[i]) for i in p['a']} | ({key(abn[p['ha']])} if p['ha'] >= 0 else set())
        count['wiki abilities'] += bool(wab and wab != mine)
    for k in ('wiki types', 'wiki abilities'):
        check(count[k] == EXPECTED[k], '%s: %d species differ (expected %d)' % (k, count[k], EXPECTED[k]))

    # ---- the game's species table (hzla's constants from Unbound-Cloud), when unit 1 has pinned it ----
    found = glob.glob(os.path.join(H.src, 'repos', '**', 'unbound_2_1_constants.js'), recursive=True)
    if found:
        s = open(found[0], encoding='utf-8').read()
        body = s[s.index('return {') + 7:]
        C = json.loads(body[:body.rindex('});')].strip().rstrip(';').strip())
        an, sn = C['ABILITY_DISPLAY_NAMES_BY_DEFINE'], C['SPECIES_DISPLAY_NAMES_BY_DEFINE']
        seen, bad = set(), []
        for define, st in C['BASE_STATS_BY_SPECIES'].items():
            sl = cfru.define_slug(define, FORMS)
            i = (pid(cfru.merge_into(FORMS[sl], FORMS, S) or sl) if sl and FORMS[sl].kind != 'drop' else None) \
                or common.sid(sn.get(define, define))
            if i not in ids or i in seen:
                continue
            seen.add(i)
            p = ids[i]
            t = list(dict.fromkeys(x[5:].capitalize() for x in (st['type1'], st['type2'])))
            s6 = [st[k] for k in ('baseHP', 'baseAttack', 'baseDefense', 'baseSpAttack', 'baseSpDefense', 'baseSpeed')]
            ga = {an.get(st[k], st[k]) for k in ('ability1', 'ability2', 'hiddenAbility') if st.get(k, 'ABILITY_NONE') != 'ABILITY_NONE'}
            mine = {abn[x] for x in p['a']} | ({abn[p['ha']]} if p['ha'] >= 0 else set())
            if t != p['t'] or s6 != p['s'] or ga != mine:
                bad.append(i)
        check(not bad, 'species differing from the game table (%d): %s' % (len(bad), bad[:20]))
        missing = sorted(set(ids) - seen)
        check(missing == EXPECTED['not in game table'], 'P entries not in the game table: %s' % missing)
        print('game table: %d species checked (%s)' % (len(seen), os.path.relpath(found[0], H.dir)))
    else:
        print('game table: not checked (no .src/repos/**/unbound_2_1_constants.js yet; unit 1 pins it)')

    # ---- GID: every species a save can hold reached, every move mapped ----
    G = D.get('GID')
    if G:
        reached = {x for x in G['sp'] if x}
        unreached = sorted(i for i, p in ids.items() if p['g'] != 1 and i not in reached)
        check(unreached == EXPECTED['no save id'], 'P entries no save id reaches: %s' % unreached)
        check(all(x is None or 0 <= x < nm for x in G['mv']) and sum(1 for x in G['mv'] if x is not None) == len(G['mv']) - 1,
              'GID mv: a move id unmapped or out of range')
        check(all(y is not None for x, y in zip(G['sp'], G['gr']) if x is not None) and all(x in range(6) for x in G['gr'] if x is not None),
              'GID gr: a species id without a growth rate')
        print('GID: sp %d ids -> %d species, mv %d, it %d' % (sum(1 for x in G['sp'] if x), len(reached),
                                                           sum(1 for x in G['mv'] if x is not None), sum(1 for x in G['it'] if x)))
    else:
        print('GID: not in data.json (no Unbound-Cloud checkout)')

    check_locations(D, ids)
    check_items(D)
    check_walkthrough(D)

    print('dex: P %d (%d mirror pages: %d merged, %d dropped), M %d, AB %d, wiki differences %s'
          % (len(P), len(FORMS), merged, sum(dropped.values()), len(M), len(AB), dict(count)))
    if D['TR']['g']:
        trainer_checks(D)
    if FAIL:
        print('FAIL unbound extract-check:\n  ' + '\n  '.join(FAIL))
        return 1
    print('OK unbound extract-check')
    return 0


def check_locations(D, ids):
    import locs
    LOC, AR = D['LOC'], D['AR']
    got = collections.Counter()
    check(len(AR) == len(LOC) and all(a['l'] == [i] and a['n'] == LOC[i] for i, a in enumerate(AR)),
          'locations: an area is not one tracker slot (AR[i].l == [i])')
    check(len(set(LOC)) == len(LOC), 'locations: duplicate area names')
    got['areas'], got['slots'] = len(AR), sum(1 for a in AR if not a.get('ns'))
    rows = collections.defaultdict(list)
    for p in D['P']:
        for w in p.get('w', []):
            check(0 <= w[0] < len(LOC), 'locations: %s row outside LOC' % p['id'])
            rows[(w[0], p['id'])].append(w)
    pages = WIKI.locations()
    got['pages'] = len(pages)
    total, section_total = 0.0, 0.0
    for page in pages:
        area, rated = LOC.index(page.title), 0
        for floor, name, method, when, rate in page.encounters:
            if not re.fullmatch(r'\d+(?:\.\d+)?%', rate) or method == 'Starter':
                continue
            rated += 1
            low = when.lower()
            dn = 'day' if low in ('day',) else 'night' if low in ('night',) else ''
            for sid_ in locs.species_ids(name):
                check(sid_ in ids, 'locations: %s does not resolve' % name)
                hit = [w for w in rows[(area, sid_)] if len(w) > 5 and w[5] == 1 and w[2] == rate
                       and (locs.METHOD.get(method, method)) == w[1] and (not floor or floor in w[4])
                       and (not dn or dn in w[4])]
                check(hit, 'locations: %s / %s / %s %s %s %s not in P.w' % (page.title, floor, name, method, when, rate))
            total += float(rate[:-1]) * (1 if dn else 2) * len(locs.species_ids(name))
        got['rated rows'] += rated
        got['rated pages'] += rated > 0
    for a in AR:
        for box in a.get('es', []):
            for g in box['g']:
                for x in g['rows']:
                    check(x['p'] in ids, 'locations: section row %s unknown' % x['p'])
                    section_total += x['r'][0] + x['r'][1]
    check(abs(total - section_total) < 0.01, 'locations: section rates %.2f, wiki rates %.2f' % (section_total, total))
    got['dens'] = len(WIKI.raid_dens())
    got['raid rows'] = sum(1 for ws in rows.values() for w in ws if w[1] == 'Raid den')
    wild = {'Grass/cave', 'Surf', 'DexNav', 'Old Rod', 'Good Rod', 'Super Rod', 'Rock Smash', 'Swarm', 'Headbutt'}
    legend = {(LOC.index(area), method, how) for area, method, name, how in locs.legend_rows()}
    for kind, test in (('doc wild rows added', lambda w: w[4].startswith('Doc says') and w[1] in wild),
                       ('doc special added', lambda w: w[4].startswith('Doc says: ') and w[1] not in wild),
                       ('legend page added', lambda w: (w[0], w[1], w[4]) in legend),
                       ('mystery gifts', lambda w: w[1] == 'Mystery Gift' and w[4].startswith('Code '))):
        got[kind] = sum(1 for ws in rows.values() for w in ws if test(w))
    rhd = locs.membership_differences(D)
    got['rhd areas'], got['rhd only'], got['guide only'] = len(rhd), sum(len(x[2]) for x in rhd), sum(len(x[3]) for x in rhd)
    for k, v in LOC_EXPECTED.items():
        check(got[k] == v, 'locations: %s %s, expected %s' % (k, got[k], v))
    print('locations: %s' % dict(got))


ITEMS_EXPECTED = {'location pages': 67, 'location rows': 687, 'machines': 128, 'stones': 49, 'z': 34, 'tutors': 29,
                  'shop rows': 140, 'missions': 83, 'npcs': 34,
                  # Locations rows whose item no IT row places there (notes.md → Items says why)
                  'not placed': [],
                  # location-guide.xlsx differences (notes.md → Items)
                  'workbook': ['Z-Crystal: workbook only Incinium Z']}     # the workbook: "Currently Unavailable"


def check_items(D):
    """Items (unit 5): counts reproduced from the wiki export, every Locations row placed, GID names resolve."""
    if not D.get('IT'):
        print('items: no IT yet')
        return
    import items
    from wiki import text, item_crystal_parts, useful_npcs
    E = ITEMS_EXPECTED
    box = {b['n']: b['r'] for b in D['IT']}
    by_name = collections.defaultdict(list)
    for b in D['IT']:
        for r in b['r']:
            by_name[r[0]].append((b['n'], r))
    # machines: TM001-TM120 and HM01-HM08, each linked to its move
    tm = box.get('TMs and HMs', [])
    nums = {(m.group(1), int(m.group(2))) for m in (re.match(r'(TM|HM)(\d+) ', r[0]) for r in tm) if m}
    for r in tm:                                    # canon() names a TM by its number ("TM34 (Shockwave)")
        m = re.match(r'(TM|HM)(\d+) ', r[0])
        items.MACHINES[(m.group(1), int(m.group(2)))] = r[0]
    check(len(tm) == E['machines'] and nums == {('TM', i) for i in range(1, 121)} | {('HM', i) for i in range(1, 9)},
          'machines: %d rows, numbers %s' % (len(tm), sorted(nums)[:5]))
    check(all(isinstance(r[2], int) for r in tm), 'machines without a move link: %s'
          % [r[0] for r in tm if not isinstance(r[2], int)])
    # Mega Stones = the dex's stones
    stones = {p['stone']: p['id'] for p in D['P'] if p.get('stone')}
    ms = box.get('Mega Stones', [])
    check(len(ms) == E['stones'] == len(stones) and all(stones.get(r[0]) == r[2] for r in ms),
          'Mega Stones: %d rows, %d P stones' % (len(ms), len(stones)))
    z = box.get('Z-Crystals', [])
    check(len(z) == E['z'] == len(item_crystal_parts(WIKI)), 'Z-Crystals: %d rows' % len(z))
    tut = WIKI.tutors()
    check(len(tut) == E['tutors'] and len(box.get('Move Tutors', [])) == sum(len(t.moves) for t in tut),
          'tutors: %d, rows %d' % (len(tut), len(box.get('Move Tutors', []))))
    check(all(isinstance(r[2], int) for r in box.get('Move Tutors', [])), 'tutor rows without a move link')
    shops = WIKI.item_shops()
    sold = {r[0] for r in box.get('Shops', [])}
    check(len(shops) == E['shop rows'] and all(items.canon(s[2])[0] in sold for s in shops),
          'shops: %d stock rows; not in Shops: %s' % (len(shops), [s[2] for s in shops if items.canon(s[2])[0] not in sold]))
    mis = WIKI.item_missions()
    first = WIKI.page('All Missions')
    check(len(mis) == E['missions'] and first is not None and "A Hero's Journey" in text(first['html']),
          'missions: %d pages (+ #001 in All Missions)' % len(mis))
    npcs = box.get('Useful NPCs', [])
    check(len(npcs) == E['npcs'] == len(useful_npcs(WIKI)), 'Useful NPCs: %d' % len(npcs))
    # Locations pages: every row's place is a page title, every row's item placed there (or by its own page)
    pages = WIKI.item_areas()
    titles = {text(p['title']) for p in pages}
    rows = WIKI.item_locations()
    unmapped = sorted({pl for pl, _, _ in rows} - titles)
    check(len(pages) == E['location pages'] and len(rows) == E['location rows'] and not unmapped,
          'Locations: %d pages, %d rows, places that are no page title: %s' % (len(pages), len(rows), unmapped))
    zn = {r[0] for r in z}
    missing, other = [], []
    for place, raw, _ in rows:
        for one in items.split_names(raw):
            name = items.canon(one)[0]
            m = re.match(r'(TM|HM)\s*0*(\d+)', name)
            if m:
                if (m.group(1), int(m.group(2))) not in nums:
                    other.append('%s: %s (no such machine)' % (place, raw))
            elif name in stones or (re.search(r'ite( [XY])?$', name) and name not in by_name):
                if name not in stones:
                    other.append('%s: %s (not a dex stone)' % (place, raw))
            elif name.endswith(' Z'):
                if name not in zn:
                    other.append('%s: %s (not on the Z-Crystals page)' % (place, raw))
            elif name in items.KEY_DROP:
                pass
            elif not any(place in r[1] for _, r in by_name.get(name, ())):
                missing.append('%s: %s' % (place, raw))
    check(missing == E['not placed'], 'Locations rows no IT row places: %s' % missing)
    check(not other, 'Locations TMs / stones / Z-Crystals not matching their own pages: %s' % other)
    # GID: a game item name that is an IT item is spelled as IT spells it
    bad, hit = [], 0
    for n in (x for x in (D.get('GID') or {}).get('it', []) if x):
        c = items.canon(n)[0]
        if c in by_name:
            hit += 1
            if c != n:
                bad.append('%s -> %s' % (n, c))
    check(not bad, 'GID item names that differ from their IT name: %s' % bad)
    wb = workbook_items(tm, stones, zn)
    check(wb == E['workbook'], 'location-guide.xlsx differences: %s' % wb)
    print('items: %d boxes, %d rows; machines %d, stones %d, Z %d, tutors %d (%d rows), shop stock %d, missions %d, '
          'NPCs %d, Locations %d pages / %d rows (%d places, all page titles), GID items in IT %d'
          % (len(D['IT']), sum(len(b['r']) for b in D['IT']), len(tm), len(ms), len(z), len(tut),
             len(box.get('Move Tutors', [])), len(shops), len(mis), len(npcs), len(pages), len(rows),
             len({p for p, _, _ in rows}), hit))


def workbook_items(tm, stones, zn):
    """location-guide.xlsx sheets TM & HM, Megastone, Z-Crystal against IT (names by key; [] = they agree)."""
    path = os.path.join(H.src, 'research-2026-10-29', 'location-guide.xlsx')
    if not os.path.isfile(path):
        return []
    import openpyxl
    import items
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    out, kind, seen = [], 'TM', set()
    mine = {(m.group(1), int(m.group(2))): m.group(3) for m in (re.match(r'(TM|HM)(\d+) (.+)', r[0]) for r in tm)}
    for r in wb['TM & HM'].iter_rows(values_only=True):
        c = [x for x in r if x is not None]
        if c and str(c[0]).strip() == 'No.' and seen:
            kind = 'HM'
        if len(c) < 2 or not str(c[0]).strip().isdigit():
            continue
        k = (kind, int(c[0]))
        seen.add(k)
        theirs = str(c[1]).strip()
        if k in mine and key(cfru.official(theirs)) != key(mine[k]) and key(theirs) != key(mine[k]):
            out.append('%s%s: workbook %s' % (k[0], k[1], theirs))
    out += ['%s%s: not in the workbook' % k for k in sorted(set(mine) - seen)]
    for sheet, have in (('Megastone', set(stones)), ('Z-Crystal', zn)):
        names = set()
        for r in wb[sheet].iter_rows(values_only=True):
            c = [x for x in r if x is not None]
            if len(c) >= 2 and str(c[0]).strip().isdigit():
                names.add(items.canon(str(c[1]).strip())[0])
        out += ['%s: workbook only %s' % (sheet, n) for n in sorted(names - have)]
        out += ['%s: not in the workbook %s' % (sheet, n) for n in sorted(have - names)]
    return out


# ---- Trainers (unit 6): reproduced from the Expert workbook, hzla, the wiki list and LEVEL CAPS ----
SHEET_SLOTS = {'Gym Leaders': 45, 'Pokemon League': 30, 'Rival': 51, 'Team Shadow Bosses': 39,
               'Team Light Of Ruin Bosses': 42, 'Boss Wild Battles': 18, 'Mega Trainers': 63, 'Other Bosses': 55,
               'Title Defense': 48, 'Battleground': 48}
PARTNER_SLOTS = 24
# hzla's Expert sets against the sheet (plans/unbound-sources.md → the join audit): joined slots, distinct sets,
# sheet-only slots, malformed hzla species keys, and every slot that differs (raw: hzla's EV key 'def' counts).
HZLA = {'joined': 381, 'sets': 380, 'sheet only': 58, 'malformed': 3}
HZLA_DIFFER = {
    'Pokemon League!B85': 'nature', 'Pokemon League!F85': 'nature',
    'Pokemon League!D85': "EVs: hzla's key 'def' (read as Defense: the card shows no difference)",
    'Rival!J43': 'EVs (hzla none)', 'Rival!M62': 'moves', 'Rival!B81': 'moves', 'Rival!N81': 'moves',
    'Rival!P81': 'moves', 'Team Shadow Bosses!B86': 'level', 'Team Shadow Bosses!D86': 'level',
    'Team Shadow Bosses!E86': 'level', 'Team Shadow Bosses!F86': 'level', 'Team Light Of Ruin Bosses!B86': 'ability',
    'Team Light Of Ruin Bosses!D86': 'ability (hzla none)',
    'Mega Trainers!E225': 'a misattached hzla set (level, ability, moves, nature, EVs)',
    'Battleground!G65': 'a misattached hzla set (level, ability, moves, nature, EVs)'}
# Sheet-only slots, by why: hzla has no team (rivals 1-2, partners, Alexa, Annie, Battleground Galavan) or a malformed
# species key ('[2nd' = Light of Ruin Vega's Honchkrow, 'Supply and Demand', 'Rogue Electivire').
SHEET_ONLY = {'no hzla team': 9 + PARTNER_SLOTS + 5 + 6 + 6, 'malformed hzla key': 1 + 3 + 4}
# Unknown stats (no speed on the card): no IVs = the sheet-only slots + the Route 9 Shadow Warrior pair (hzla's set
# has no ivs); no EVs = the four partner Vaporeon with "?" EVs.
NO_EV = ['Boss Wild Battles!F193', 'Team Light Of Ruin Bosses!J46', 'Team Light Of Ruin Bosses!J66',
         'Team Shadow Bosses!J126']
WIKI_ROWS = {'rows': 309, 'ordinary': 292, 'boss cards': 17, 'name only': 15, 'name only, team unknown': 0}
RELATIVE = 81           # mons whose later-cap levels are all cap + one offset (76 + Reena's 5, relative to her notes)
ABSOLUTE_LADDER = 4     # Barbs (minimum levels); Reena is relative to her notes now


def trainer_checks(D):
    import bosssheet
    import trainers as T
    TR = D['TR']
    cards = [(g, s, t) for g in TR['g'] for s in g['sec'] for t in s['tr']]
    boss = [(g, s, t) for g, s, t in cards if 'Moves unknown' not in t['tags']]
    ordinary = [(g, s, t) for g, s, t in cards if 'Moves unknown' in t['tags']]

    # sheet: per-sheet counts; every foe slot on a card (species, level), every partner slot in a partner team
    blocks = bosssheet.blocks()
    per = collections.Counter()
    foe, part = collections.Counter(), collections.Counter()
    strip = lambda s: re.sub(r'\s*\[[^\]]*\]|\s*\((pre-burned|respawnable)\)', '', s).strip()
    for b in blocks:
        for g in b.groups:
            for m in g.mons:
                per[b.sheet] += 1
                if m.species == 'Starter (mega)':
                    part[('starter', m.level)] += 1
                else:
                    (foe if g.role == 'foe' else part)[(common.sid(strip(m.species)), m.level)] += 1
    check(dict(per) == SHEET_SLOTS, 'sheet slots per worksheet: %s' % dict(per))
    check(sum(part.values()) == PARTNER_SLOTS, 'partner slots: %d' % sum(part.values()))
    def lv(t, m):
        said = next((int(x[len('Sheet says Lv '):]) for x in m.get('x', []) if x.startswith('Sheet says Lv ')), None)
        return said if said is not None else m['l'] if 'l' in m else t['cap'] + m['r']    # Reena: the sheet's own cell
    have = collections.Counter((m['id'], lv(t, m)) for _, _, t in boss for m in t['p'])
    check(have == foe, 'boss cards vs the sheet foe slots: missing %s, extra %s' % (dict(foe - have), dict(have - foe)))
    seen, have_pt = set(), collections.Counter()
    for _, _, t in boss:
        for i, p in enumerate(t.get('pt', [])):
            if p.get('st') not in (None, 'Gible') or (t.get('bt') or t['k'], p['n'], i) in seen:
                continue
            seen.add((t.get('bt') or t['k'], p['n'], i))
            for m in p['p']:
                have_pt[('starter', m['l']) if m.get('x', [''])[-1].startswith('Nature and EVs from Rival 5')
                        else (m['id'], m['l'])] += 1
    check(have_pt == part, 'partner teams vs the sheet: missing %s, extra %s' % (dict(part - have_pt),
                                                                                 dict(have_pt - part)))

    # hzla join, reproduced
    hz, bad, total = T._hzla()
    joined, sets, only, differ = 0, set(), collections.Counter(), {}
    malformed_teams = {key('Light of Ruin Vega'), key('Science Society Scientist |Supply and Demand|'),
                       key('Science Society Scientist |Rogue Electivire|')}
    for b in blocks:
        for g in b.groups:
            for m in g.mons:
                label = T.LABEL_FIX.get((b.sheet, b.row))
                if b.sheet == 'Rival' and b.row == 40:
                    label = 'Rival 3 |Player Chose %s|' % g.starter
                label = key(label if label is not None else re.sub(r'\s*(- Expert|\[Expert\])$', '', m.label))
                pid = common.sid(strip(m.species)) if m.species != 'Starter (mega)' else None
                hit = [c for c in hz.get(label, []) if c[0] == pid]
                if not hit:
                    only['malformed hzla key' if label in malformed_teams and g.role == 'foe' else 'no hzla team'] += 1
                    continue
                joined += 1
                sets.add((hit[0][1], hit[0][2]))
                s = hit[0][3]
                diffs = []
                if s['level'] != m.level:
                    diffs.append('level')
                if key(s.get('ability', '')) not in {key(x) for x in re.split(r' / | → ', m.ability)}:
                    diffs.append('ability')
                if key(s.get('item') or '') != key(m.item.rstrip('?')):
                    diffs.append('item')
                fix = lambda x: T.MOVE_FIX.get(x, x)
                if sorted(key(fix(x)) for x in s['moves'] if x) != sorted(key(fix(x)) for x in m.moves
                                                                          if x != 'default moveset'):
                    diffs.append('moves')
                if key(s.get('nature', '')) != key(m.nature.rstrip('?')):
                    diffs.append('nature')
                ev = [T._num(x.rstrip('?')) for x in m.evs]
                if None not in ev and [s.get('evs', {}).get(k, 0) for k in T.EV_KEYS] != ev:
                    diffs.append('EVs')
                if diffs:
                    differ[m.cell] = diffs
    check(joined == HZLA['joined'] and len(sets) == HZLA['sets'] and sum(only.values()) == HZLA['sheet only']
          and len(bad) == HZLA['malformed'] and total == 383,
          'hzla join: %d joined, %d sets, %s sheet only, %d malformed of %d' % (joined, len(sets), dict(only),
                                                                               len(bad), total))
    check(dict(only) == SHEET_ONLY, 'sheet-only reasons: %s' % dict(only))
    check(set(differ) == set(HZLA_DIFFER), 'hzla differences unexplained: %s; gone: %s' % (
        sorted(set(differ) - set(HZLA_DIFFER)), sorted(set(HZLA_DIFFER) - set(differ))))
    hn = sum(1 for _, _, t in boss for m in t['p'] if m.get('hn'))
    check(hn == len(HZLA_DIFFER) - 1, 'cards with "hzla says": %d (expected %d: all but the def-key one)' %
          (hn, len(HZLA_DIFFER) - 1))

    # unknown stats: every boss / partner mon without IVs or EVs is a listed slot
    def slots():
        for _, _, t in boss:
            for m in t['p']:
                yield m
        seen = set()
        for _, _, t in boss:
            for i, p in enumerate(t.get('pt', [])):
                if p.get('st') not in (None, 'Gible') or (t.get('bt') or t['k'], i) in seen:
                    continue
                seen.add((t.get('bt') or t['k'], i))
                yield from p['p']
    mons = list(slots())
    no_iv = sum(1 for m in mons if 'iv' not in m)
    no_ev = sum(1 for m in mons if 'ev' not in m)
    check(no_iv == HZLA['sheet only'] + 2, 'mons without IVs: %d (sheet only %d + the Route 9 pair)' %
          (no_iv, HZLA['sheet only']))
    check(no_ev == len(NO_EV), 'mons without EVs: %d, expected %s' % (no_ev, NO_EV))
    check(all(m.get('src') == 's' for m in mons if 'iv' not in m and m['id'] != 'shadow_warrior'),
          'a mon without IVs is not marked sheet only')
    check(sum(1 for m in mons if m.get('src') == 's') == HZLA['sheet only'], 'sheet-only marks')
    check(not any(set(m['iv']) != {31} for m in mons if 'iv' in m), 'an hzla IV that is not 31')

    # wiki list: every row is a card (ordinary, or the boss card for a Mega Trainer / Alexa / Ryuzoji & Kenlawa)
    rows = WIKI.trainer_locations()
    names = collections.Counter(key(t['n']) for _, _, t in cards)
    ordn = collections.Counter((key(t['n']), t['loc']) for _, _, t in ordinary)
    shared = [r for r in rows if r.shared]
    unknown = [t for _, _, t in ordinary if not t['p']]
    check(len(rows) == WIKI_ROWS['rows'] and len(ordinary) == WIKI_ROWS['ordinary'] and
          len(rows) - len(ordinary) == WIKI_ROWS['boss cards'] and len(shared) == WIKI_ROWS['name only'] and
          len(unknown) == WIKI_ROWS['name only, team unknown'],
          'wiki rows: %d = %d ordinary + %d boss cards, %d name only, %d team unknown' % (
              len(rows), len(ordinary), len(rows) - len(ordinary), len(shared), len(unknown)))
    missing = [r.name for r in rows if not ordn[(key(r.name), r.area)] and not names[key(r.name)]]
    check(not missing, 'wiki rows with no card: %s' % missing)
    check(all(m['m'] == [] and 'iv' not in m for _, _, t in ordinary for m in t['p']),
          'an ordinary trainer with moves or IVs')

    # caps: re-read LEVEL CAPS!D2:D11; boxes in order, every trainer in a capped box has its cap
    T._caps_check()
    caps = [c for _, c in T.CAPS]
    check([c for _, c in TR['caps']] == caps, 'TR.caps: %s' % TR['caps'])
    check([g['cap'] for g in TR['g']] == caps + [None], 'box caps: %s' % [g['cap'] for g in TR['g']])
    check(all(t.get('cap') == g['cap'] for g, _, t in cards), 'a trainer whose cap is not its box\'s')

    # relative levels: each mon's later-cap line = cap + r at every cap it names
    rel = [(t, m) for _, _, t in boss for m in t['p'] if 'r' in m]
    bad_rel = []
    for t, m in rel:
        line = next(x for x in m['x'] if x.startswith('Lv '))
        for lv_, cap in re.findall(r'(\d+) at ([A-Za-z0-9 ]+?) cap', line):
            if int(lv_) != T.CAP_OF[cap] + m['r']:
                bad_rel.append((t['k'], m['id'], line))
    ladder = sum(1 for _, _, t in boss for m in t['p'] if any(x.startswith('Lv ') for x in m.get('x', [])))
    check(len(rel) == RELATIVE and not bad_rel and ladder == RELATIVE + ABSOLUTE_LADDER,
          'relative levels: %d (expected %d), ladder lines %d, inconsistent %s' % (len(rel), RELATIVE, ladder,
                                                                                  bad_rel))
    print('trainers: %d cards (%d boss, %d ordinary) in %d boxes; sheet %d slots; hzla %d joined / %d sets / %d '
          'differ / %d sheet only; %d relative-level mons' % (len(cards), len(boss), len(ordinary), len(TR['g']),
                                                             sum(per.values()), joined, len(sets), len(differ),
                                                             sum(only.values()), len(rel)))


def check_walkthrough(data):
    import copy
    import items
    import schema
    import tabs_check
    import walk
    from wiki import text

    splits = data['WK']['splits']
    stops = [stop for split in splits for stop in split['st']]
    source_parts = {number for number, page in WIKI.walkthrough_parts()}
    represented = {int(match[1]) for stop in stops
                   if (match := re.match(r'part-(\d+)/', stop['k']))}
    check(source_parts == represented == set(range(1, 41)),
          'walkthrough parts: source %s, represented %s' % (sorted(source_parts), sorted(represented)))
    check([split['n'] for split in splits] == [group['n'] for group in data['TR']['g']],
          'walkthrough splits differ from Trainers cap boxes')
    check(len(splits) == 11, 'walkthrough requires ten cap splits and Post-game')
    check(len({stop['k'] for stop in stops}) == len(stops), 'duplicate walkthrough stop key')
    check(all(stop['k'].startswith(('part-', 'postgame/')) for stop in stops),
          'walkthrough stop keys must identify a source part / semantic visit')
    check(all(index in range(len(data['AR'])) for stop in stops for index in stop['a']),
          'walkthrough has an unknown area')
    cards = [trainer for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']]
    placed = collections.Counter(trainer for stop in stops for trainer in stop['tr'])
    check(placed == collections.Counter(trainer['k'] for trainer in cards),
          'every trainer must appear in exactly one walkthrough stop')
    groups = {trainer['k']: group['n'] for group in data['TR']['g'] for section in group['sec'] for trainer in section['tr']}
    check(all(groups.get(trainer) == split['n'] for split in splits for stop in split['st'] for trainer in stop['tr']),
          'walkthrough trainers must stay in their own cap split')
    by_key = {stop['k']: stop for stop in stops}
    card_by_key = {trainer['k']: trainer for trainer in cards}
    check({card_by_key[trainer]['n'] for trainer in by_key['part-20/surf-route-3']['tr']} ==
          {'Fisherman Edgar', 'Fisherman Jason', 'Fisherman Cole'}, 'Route 3 Surf fishermen must follow Galavan')
    check(any(card_by_key[trainer]['n'] == 'Skier Charlie' for trainer in by_key['part-30/antisis-thundercap']['tr']),
          'Skier Charlie must be at the part-30 Thundercap revisit')
    expected_visits = {
        'Sinnoh Leader Candice': 'part-9/blizzard-city',
        'Ace Trainer Alexa': 'part-10/alexa',
        'Mega Trainer Yale': 'part-14/mega-yale',
        'Hiker Franklin': 'part-26/surf-route-2',
        'Mega Trainer Vivian': 'part-26/surf-route-2',
        'Mega Trainer Mathis': 'part-26/surf-route-2',
    }
    for name, stop_key in expected_visits.items():
        check(any(card_by_key[trainer]['n'] == name for trainer in by_key[stop_key]['tr']),
              name + ' must be at ' + stop_key)
    part_text = {number: key(text(page['html']))
                 for number, page in WIKI.walkthrough_parts()}
    placed_stops = {trainer: stop['k'] for stop in stops for trainer in stop['tr']}
    for split, group in zip(splits, data['TR']['g']):
        scope = {int(match[1]) for stop in split['st'] if (match := re.match(r'part-(\d+)/', stop['k']))}
        for section in group['sec']:
            for trainer in section['tr']:
                if 'Moves unknown' not in trainer['tags']:
                    continue
                named = {number for number in scope if key(trainer['n']) in part_text[number]}
                current = re.match(r'part-(\d+)/', placed_stops[trainer['k']])
                check(not named or current and int(current[1]) in named,
                      'ordinary trainer outside the wiki part naming it: ' + trainer['n'])
    check(tabs_check.check('unbound'), 'tabs_check: walkthrough / Trainers order or caps disagree')
    expected_items = collections.Counter((place, items.canon(one)[0]) for place, raw, description in WIKI.item_locations()
                                         for one in items.split_names(raw))
    actual_items = collections.Counter()
    for stop in stops:
        areas = [data['AR'][index]['n'] for index in stop['a']]
        for row in stop['it']:
            place = next((area for area in areas if (area, row[1]) in expected_items), None)
            actual_items[(place, row[1])] += 1
    check(actual_items == expected_items,
          'walkthrough Locations item rows: missing %s, extra %s' % (dict(expected_items - actual_items),
                                                                  dict(actual_items - expected_items)))
    missions = [step for stop in stops for step in stop['s'] if isinstance(step, dict)]
    source_missions = {mission['page']['link'].rstrip('/').rsplit('/', 1)[-1]
                       for mission in WIKI.walkthrough_missions()} | {'mission-001'}
    mission_keys = collections.Counter(mission.get('m') for mission in missions)
    check(len(missions) == 84 and mission_keys == collections.Counter(source_missions),
          'walkthrough missions must cover all 83 pages and #001 exactly once')
    check(len(WIKI.mission_index()) == 84, 'wiki mission index count changed')
    for stop in stops:
        for mission in (step for step in stop['s'] if isinstance(step, dict)):
            check(walk.MISSION_STOPS.get(int(mission['m'].split('-')[-1])) == stop['k'],
                  'mission at wrong unlock stop: ' + mission['m'])
            children = mission.get('s', [])
            child_keys = [child.get('k') for child in children]
            check(bool(children) and all(child_keys) and len(set(child_keys)) == len(children),
                  'empty mission or missing/duplicate child keys: ' + mission['m'])
            check(all(re.fullmatch(r'[a-z][a-z0-9-]*', child_key) for child_key in child_keys),
                  'mission children need semantic keys: ' + mission['m'])
    for source in WIKI.walkthrough_missions():
        slug = source['page']['link'].rstrip('/').rsplit('/', 1)[-1]
        mission = next(mission for mission in missions if mission['m'] == slug)
        check(mission['u'] == source['fields']['Unlock Requirements'], 'mission unlock note differs: ' + slug)
    try:
        schema.standardise(copy.deepcopy(data))
    except (AssertionError, KeyError, TypeError) as error:
        check(False, 'walkthrough schema: ' + str(error))
    ordinary = sum(isinstance(step, list) for stop in stops for step in stop['s'])
    print('walkthrough: %d parts, %d splits, %d stops, %d ordinary steps, %d missions / %d children, '
          '%d items, %d trainers' % (len(source_parts), len(splits), len(stops), ordinary, len(missions),
                                   sum(len(mission['s']) for mission in missions), sum(actual_items.values()), sum(placed.values())))


if __name__ == '__main__':
    sys.exit(main())

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
            'no description': [], 'not in game table': ['shadow_warrior']}
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
            check(pid(into) in ids, 'merged page %s: target %s not in P' % (slug, pid(into)))
        else:
            placed += 1
            check(pid(slug) in ids, 'mirror page %s not in P' % slug)
    check(placed == len(P), 'P %d entries, mirror pages placed %d' % (len(P), placed))
    check(sum(dropped.values()) == EXPECTED['dropped'], 'dropped %s' % dict(dropped))
    check(merged == EXPECTED['merged'], 'merged %d' % merged)

    # ---- moves and abilities reproduced ----
    raw = json.load(open(os.path.join(H.src, 'romhackdex', 'moves.json'), encoding='utf-8'))
    names = {cfru.official(m['n']) for m in raw if not cfru.move_kind(m['n'])}
    check(set(M) == names and len(M) == len(names), 'M %d, moves.json gives %d official names' % (len(M), len(names)))
    used = {AB[i][0] for p in P for i in p['a'] + ([p['ha']] if p['ha'] >= 0 else [])}
    check(used == {a[0] for a in AB}, 'AB has abilities no species has: %s' % ({a[0] for a in AB} - used))
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
        check(unreached == EXPECTED['not in game table'], 'P entries no save id reaches: %s' % unreached)
        check(all(x is None or 0 <= x < nm for x in G['mv']) and sum(1 for x in G['mv'] if x is not None) == len(G['mv']) - 1,
              'GID mv: a move id unmapped or out of range')
        check(all((x is None) == (y is None) for x, y in zip(G['sp'], G['gr'])) and all(x in range(6) for x in G['gr'] if x is not None),
              'GID gr: a species id without a growth rate')
        print('GID: sp %d ids -> %d species, mv %d, it %d' % (sum(1 for x in G['sp'] if x), len(reached),
                                                           sum(1 for x in G['mv'] if x is not None), sum(1 for x in G['it'] if x)))
    else:
        print('GID: not in data.json (no Unbound-Cloud checkout)')

    check_locations(D, ids)
    print('dex: P %d (%d mirror pages: %d merged, %d dropped), M %d, AB %d, wiki differences %s'
          % (len(P), len(FORMS), merged, sum(dropped.values()), len(M), len(AB), dict(count)))
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


if __name__ == '__main__':
    sys.exit(main())

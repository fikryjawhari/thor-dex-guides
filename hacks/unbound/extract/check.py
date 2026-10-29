"""Checks on a built data.json, reproduced from the raw sources (dex part; units 4-7 add theirs).
Usage: uv run python -I hacks/unbound/extract/check.py

- Counts: every RomHackDex page placed (a P entry, merged into one, or dropped for a known reason), M = moves.json less
  the Z / Max copies and the CFRU spellings of one move, AB = every ability a species has.
- Integrity: unique ids and names, valid move / ability indexes, evolutions both ways, every Mega's stone.
- Wiki vs the dex: the number of species whose types / abilities the wiki gives differently (EXPECTED; notes.md lists
  them), so a source update that changes them is noticed.
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
            'no description': ['Focus Belt', 'Nine Lives'], 'not in game table': ['shadow_warrior']}
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

    print('dex: P %d (%d mirror pages: %d merged, %d dropped), M %d, AB %d, wiki differences %s'
          % (len(P), len(FORMS), merged, sum(dropped.values()), len(M), len(AB), dict(count)))
    if FAIL:
        print('FAIL unbound extract-check:\n  ' + '\n  '.join(FAIL))
        return 1
    print('OK unbound extract-check')
    return 0


if __name__ == '__main__':
    sys.exit(main())

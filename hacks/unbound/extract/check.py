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
            'no description': [], 'not in game table': ['shadow_warrior']}
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
    if D['TR']['g']:
        trainer_checks(D)
    if FAIL:
        print('FAIL unbound extract-check:\n  ' + '\n  '.join(FAIL))
        return 1
    print('OK unbound extract-check')
    return 0


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
WIKI_ROWS = {'rows': 309, 'ordinary': 292, 'boss cards': 17, 'name only': 15, 'name only, team unknown': 2}
RELATIVE = 76           # mons whose later-cap levels are all cap + one offset
ABSOLUTE_LADDER = 9     # Reena (the sheet's "Level at E4 Cap" levels don't fit its notes) and Barbs (minimum levels)


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
    lv = lambda t, m: m['l'] if 'l' in m else t['cap'] + m['r']
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


if __name__ == '__main__':
    sys.exit(main())

"""Locations (LOC, P.w): the Pokemon Locations sheet (wild tables, random pools, Game Corner, trades, the starter choice)
checked slot by slot against the game's Encounters.c; the game's table replaces the sheet's where they differ.
starter() moves the three starter encounters to their own Starter area. Areas (AR) are built with the walkthrough, walk.py.
"""
from common import (X, S, SRC, collections, datetime, fid, json, key, lev, note1, os, re, report, unicodedata,
                    CALC, OLDP, SD, dexsite, enccheck, hgsource, xlsx)  # noqa: F401


def sheet(D):
    """The Pokemon Locations sheet: wild tables, random pools, Game Corner, trades, starters -> LOC and each page's rows (FIND)."""
    F, match = X.F, X.match
    # ---------------------------------------------------------------- Pokemon Locations sheet
    LS = {s.name: s for s in xlsx.load(os.path.join(SRC, 'Pokemon Locations.xlsx'))}
    def tab(sheets, start):
        for n, s in sheets.items():
            if n.startswith(start): return s
        raise KeyError(start)
    def pct(v):
        if isinstance(v, (int, float)):
            x = round(v * 100, 1)
            return (str(int(x)) if x == int(x) else str(x)) + '%'
        return S(v)
    LOC, LI = [], {}
    def loc(n):
        if n not in LI: LI[n] = len(LOC); LOC.append(n)
        return LI[n]
    FIND = collections.defaultdict(list)
    def add(f, e): FIND[f].append(e)
    SPECIAL = {}
    LOCNOTE = {}
    def grid(sh, prefix):
        H = {}
        for (r, c), v in sh.cells.items():
            if r == 1 and c >= 3 and S(v): H[c] = prefix + S(v)
        for c in sorted(H): loc(H[c])
        for (r, c), t in sh.notes.items():
            if r == 1 and c in H: LOCNOTE[H[c]] = note1(t)
        method = ''
        R = sh.rows()
        for r in sorted(R):
            if r <= 2: continue
            row = R[r]
            if S(row.get(1)): method = S(row.get(1))
            rate = pct(row.get(2))
            for c in sorted(H):
                lv, nm = S(row.get(c)), S(row.get(c + 1))
                if not nm or nm == 'Pokémon': continue
                note = note1(sh.notes.get((r, c + 1), '') or sh.notes.get((r, c), ''))
                f = match(nm)
                if f: add(f, [loc(H[c]), method, rate, lv, note])
                else: SPECIAL[key(nm)] = {'loc': H[c], 'lv': lv, 'note': note}
    enc = tab(LS, 'Encounter Tables'); saf = tab(LS, 'Safari Zone')
    grid(enc, ''); grid(saf, 'Safari Zone: ')
    ROAMNOTE = note1(enc.notes.get((1, 1), ''))
    SAFNOTE = note1(saf.notes.get((1, 1), ''))
    # Random pools: header "Pool name, Location"
    rp = tab(LS, 'Random Pools'); R = rp.rows(); pools = collections.OrderedDict(); pnote = {}
    for c, h in sorted(R[1].items()):
        pools[c] = (S(h).replace('"', ''), []); pnote[c] = note1(rp.notes.get((1, c), ''))
    for r in sorted(R):
        if r == 1: continue
        for c, v in R[r].items():
            if S(v) and c in pools: pools[c][1].append(S(v))
    for c, (h, lst) in pools.items():
        name = h.split(',')[0].strip(); sk = key(name)
        sp = SPECIAL.get(sk) or SPECIAL.get(key(re.sub(r'^Random ', '', name)))
        if not sp:
            sp = next((v for k, v in SPECIAL.items() if sk in k or k in sk), None)
        L = sp['loc'] if sp else ((h.split(',')[1] if ',' in h else 'Roaming').replace('*', '').strip())
        nt = 'Random pool: you get one of %d' % len(lst)
        if pnote[c]: nt += '. ' + pnote[c]
        if sp and sp.get('note'): nt += '. ' + sp['note']
        for nm in lst:
            f = match(nm)
            if f: add(f, [loc(L), name, '1 of %d' % len(lst), (sp or {}).get('lv', ''), nt])
            else: report('pool name not matched:', nm)
    gc = tab(LS, 'Game Corner')
    for r, row in sorted(gc.rows().items()):
        lv = S(row.get(2))
        if not re.fullmatch(r'\d+', lv): continue
        opts = [x.strip() for x in S(row.get(3)).split(',') if x.strip()]
        for n in opts:
            f = match(n)
            if f: add(f, [loc('Goldenrod City'), 'Game Corner prize', '1 of %d' % len(opts), lv, 'Unlocked with the %s Badge' % S(row.get(1))])
            else: report('game corner not matched:', n)
    GCNOTE = S(gc.v(1, 1))
    trd = tab(LS, 'Trades')
    for r, row in sorted(trd.rows().items()):
        if r <= 2 or not S(row.get(2)): continue
        for n in re.split(r',| or ', S(row.get(3))):
            f = match(n.strip())
            if f: add(f, [loc(S(row.get(2))), 'Trade', '', '', 'For ' + S(row.get(1))])
            else: report('trade not matched:', n)
    # the player's starter choice (Mechanics.txt "Starter Choice" table: Turtwig, Litten, Froakie) is in no location tab
    MECH = open(os.path.join(SRC, 'Mechanics.txt'), encoding='utf-8-sig').read()
    STARTERS = re.findall(r'^(\w+)\s{2,}\S', MECH.split('Starter Choice', 1)[1].split('Level Cap', 1)[0], re.M)
    for n in STARTERS:
        f = match(n)
        if f: add(f, [loc('New Bark Town'), 'Starter choice', '1 of %d' % len(STARTERS), '5', 'Your starter; the choice also decides some gifts and trades (Mechanics)'])
        else: report('starter not matched:', n)
    report('starters:', STARTERS)
    # "Starter: X" conditions in notes, with typos fixed (Turtig)
    def fixstarter(t):
        def f(m):
            out = []
            for x in m.group(2).split(','):
                x = x.strip(); b = min(STARTERS, key=lambda z: lev(key(x), key(z)))
                if lev(key(x), key(b)) <= 2 and b != x: report('starter name fixed:', x, '>', b); x = b
                out.append(x)
            return m.group(1) + ', '.join(out)
        return re.sub(r'(Starter:\s*)([A-Za-z ,]+?)(?=\.?\s*$)', f, t)
    for a_ in FIND.values():
        for e in a_: e[4] = fixstarter(e[4])
    encOrder = [S(enc.v(1, c)) for c in sorted(c for (r, c) in enc.cells if r == 1 and c >= 3)]
    ord_ = []
    for n in encOrder:
        ord_.append(n)
        if n == 'Safari Zone Gate': ord_ += [x for x in LOC if x.startswith('Safari Zone: ')]
    for n in LOC:
        if n not in ord_: ord_.append(n)
    if 'Blackthorn City' in ord_:
        ord_.remove('Blackthorn City')
        ix = max([i for i, n in enumerate(ord_) if re.search('Ice Path', n, re.I)] or [len(ord_) - 1])
        ord_.insert(ix + 1, 'Blackthorn City')
    remap = [ord_.index(n) for n in LOC]
    for a in FIND.values():
        for e in a: e[0] = remap[e[0]]
    LOC = ord_
    un = set()
    for (r, c), v in tab(LS, 'Unavailable').cells.items():
        if c == 2 and r > 1:
            for x in S(v).rstrip('.').split(','):
                f = match(x.strip())
                if f: un.add(f)
                elif x.strip(): report('unavailable not matched:', x.strip())
    base = set(FIND); OBT = set(base); q = list(base)
    while q:
        f = q.pop()
        for k in ('Evolves From', 'Evolves To'):
            for e in F[f]['sec'].get(k, []):
                l = e['l']
                if l and l in F and l not in OBT and l not in un: OBT.add(l); q.append(l)
    clash = sorted(fid(f) for f in base & un)
    if clash: report('in the location tables AND on the unavailable list (kept):', ', '.join(clash))
    report('obtainable', len(OBT), 'locations', len(LOC))
    X.FIND, X.GCNOTE, X.LOC, X.LOCNOTE, X.OBT, X.ROAMNOTE, X.SAFNOTE, X.add, X.un = FIND, GCNOTE, LOC, LOCNOTE, OBT, ROAMNOTE, SAFNOTE, add, un
    D['LOC'] = LOC


def verify(D):
    """Wild tables against the game's Encounters.c; the obtainable set (OBT) follows the game's evolutions too."""
    EVO, F, FIND, HG, LOC, OBT, TRONLY, add, un = X.EVO, X.F, X.FIND, X.HG, X.LOC, X.OBT, X.TRONLY, X.add, X.un
    # wild tables: the locations sheet against the game's Encounters.c. Where they differ, the game's table replaces the
    # sheet's rows for that location (Land, Surf, Rock Smash, Fishing = Old Rod; Good/Super Rod tables are placeholders).
    SIDG = lambda v: (lambda i: {'wormadam_trash': 'wormadam_trashy'}.get(i, i))(HG.sid(HG.species(v)))
    SHEETW = collections.defaultdict(lambda: collections.defaultdict(dict))
    WM = ('Land', 'Surf', 'Fishing', 'Rock Smash')
    for f, ws in FIND.items():
        for w in ws:
            if w[1] in WM and w[2].endswith('%'):
                d = SHEETW[LOC[w[0]]][w[1]]; d[fid(f)] = round(d.get(fid(f), 0) + float(w[2][:-1]), 1)
    ENCDIFF = {}; PATCHED = []
    for ln in LOC:
        if ln not in SHEETW or 'Headbutt' in ln or ln.startswith('Safari Zone'): continue
        li = LOC.index(ln)
        t, dd = enccheck.compare(ln, {m: {k_: (int(v) if v == int(v) else v) for k_, v in r.items()} for m, r in SHEETW[ln].items()}, HG.ENC, SIDG)
        if not dd: continue
        ENCDIFF[ln] = dd; report('wild table %s (%s): %s' % (ln, t, ' | '.join(dd)))
        if t is None:
            for ws in FIND.values():
                for w in ws:
                    if w[0] == li and w[1] in WM: w[4] = (w[4] + ' ' if w[4] else '') + "Not in the game's wild data, so the sheet may be out of date."
            continue
        if all('time of day' in x for x in dd): continue
        g = enccheck.game_rates(HG.ENC[t], SIDG, enccheck.TOD.get(ln, 'speciesDay'))
        for f in list(FIND):
            FIND[f] = [w for w in FIND[f] if not (w[0] == li and w[1] in WM)]
        for m, rows in g.items():
            mm = 'Fishing' if m.endswith('Rod') else m
            if m in ('goodRod', 'superRod') or (mm == 'Surf' and set(rows) <= {'goldeen'}): continue
            for i, (r, lvs) in rows.items():
                f = i + '.html'
                if f not in F: report('game wild species without a page:', ln, i); continue
                add(f, [li, mm, '%s%%' % r, '-'.join(str(x) for x in sorted({min(lvs), max(lvs)})), ''])
                if f not in OBT and f not in un: OBT.add(f); report("obtainable from the game's wild data:", i)
        PATCHED.append(ln)
    # Safari areas against SafariEncounters.c: 10 equal slots per method (the day list; bonus species need placed objects
    # and are not in the sheet). A method that differs is replaced from the game, as above.
    saf = open(os.path.join(SRC, 'repos', 'hardlove', 'data', 'SafariEncounters.c'), encoding='utf-8').read()
    SAFM = {'land': 'Land', 'surf': 'Surf', 'oldRod': 'Fishing'}
    for area, body in re.findall(r'\[SAFARI_ZONE_AREA_(\w+)\]\s*=\s*\{(.*?)\n    \},', saf, re.S):
        ln = 'Safari Zone: ' + area.replace('_', ' ').title()
        if ln not in LOC: report('safari area not in the sheet:', ln); continue
        li = LOC.index(ln)
        for m, block in re.findall(r'\.(land|surf|oldRod)\s*=\s*\{(.*?)\n        \},', body, re.S):
            day = re.search(r'\.speciesDay\s*=\s*\{(.*?)\}\s*,\s*\.speciesNight', block, re.S)
            slots = re.findall(r'\{\s*((?:MON_WITH_FORM\(\s*)?SPECIES_\w+(?:\s*,\s*\d+\s*\))?)\s*,\s*(\d+)\s*\}', day.group(1)) if day else []
            if not slots: continue
            g = collections.defaultdict(list)
            for v, lv in slots: g[SIDG(re.sub(r'\s*([(),])\s*', r' \1 ', v).strip())].append(int(lv))   # the parser's token spacing
            if m != 'land' and set(g) == {'goldeen'}: continue   # placeholder water tables, as in Encounters.c
            game = {i: round(100 * len(l) / len(slots), 1) for i, l in g.items()}
            sheet = SHEETW.get(ln, {}).get(SAFM[m], {})
            if {i: float(r) for i, r in game.items()} == {i: float(r) for i, r in sheet.items()}: continue
            report('wild table %s %s: sheet %s; game %s' % (ln, SAFM[m], sorted(set(sheet) - set(game)), sorted(set(game) - set(sheet))))
            for f in list(FIND):
                FIND[f] = [w for w in FIND[f] if not (w[0] == li and w[1] == SAFM[m])]
            for i, lvs in g.items():
                f = i + '.html'
                if f not in F: report('game wild species without a page:', ln, i); continue
                r = game[i]; r = int(r) if r == int(r) else r
                add(f, [li, SAFM[m], '%s%%' % r, '-'.join(str(x) for x in sorted({min(lvs), max(lvs)})), ''])
                if f not in OBT and f not in un: OBT.add(f); report("obtainable from the game's wild data:", i)
            PATCHED.append('%s (%s)' % (ln, SAFM[m]))
    report('wild tables checked against the game:', len(SHEETW), 'locations,', len(ENCDIFF), 'with differences; replaced from the game:', ', '.join(PATCHED))
    # the obtainable set follows the game's evolutions too (both directions)
    REV = collections.defaultdict(list)
    for a, lst in EVO.items():
        for how, b in lst: REV[b].append((how, a))
    q = list(OBT); added = []
    while q:
        f = q.pop(); i = fid(f)
        for how, j in EVO.get(i, []) + REV.get(i, []):
            g = j + '.html'
            if g in F and g not in OBT and g not in un: OBT.add(g); q.append(g); added.append(j)
    if added: report('obtainable through the game\'s evolutions (not the site\'s):', ', '.join(sorted(added)))
    TRONLY -= OBT
    X.REV, X.TRONLY = REV, TRONLY

def starter(D):
    """The three starter encounters get their own Starter area (appended, so published indexes stay), first in New Bark Town's
    stop and first on the Locations page (ARO)."""
    starters = [(pokemon, encounter) for pokemon in D['P'] for encounter in pokemon['w']
                if encounter[1] == 'Starter choice']
    assert {pokemon['id'] for pokemon, encounter in starters} == {'turtwig', 'litten', 'froakie'}
    assert len(starters) == 3
    locations = D['LOC']
    if 'Starter' not in locations:
        locations.append('Starter')
    location = locations.index('Starter')
    areas = D['AR']
    starter_area = next((index for index, area in enumerate(areas) if area['n'] == 'Starter'), None)
    if starter_area is None:
        starter_area = len(areas)
        areas.append({'n': 'Starter', 'l': [location], 'st': 1})
    else:
        assert areas[starter_area]['l'] == [location]
        areas[starter_area]['st'] = 1
    for pokemon, encounter in starters:
        encounter[0] = location
    new_bark = next(index for index, area in enumerate(areas) if area['n'] == 'New Bark Town')
    first_stop = next(stop for split in D['WK']['splits'] for stop in split['st'] if new_bark in stop['a'])
    if starter_area not in first_stop['a']:
        first_stop['a'].insert(0, starter_area)
    # Locations order: the Starter box first, like every guide (it sits at the end of AR so saved trackers keep their slots)
    D['ARO'] = [starter_area] + [index for index in range(len(areas)) if index != starter_area]

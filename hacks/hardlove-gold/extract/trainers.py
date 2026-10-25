"""Trainers (TR): the Trainer Battles sheet (order, splits, places, tags, notes) with the game's own sets (Trainers.c) and
the level caps from Mechanics.txt. sheet() reads the sheet, engine() looks the game's entries up, build() writes TR;
split() regroups the sheet's sections into one box per mini-split (the split UI).
"""
from common import (X, S, SRC, collections, datetime, fid, json, key, lev, note1, os, re, report, unicodedata,
                    CALC, OLDP, SD, dexsite, enccheck, hgsource, xlsx)  # noqa: F401
from extractlib import split_name


def sheet(D):
    """The Trainer Battles sheet (SPLITS: sections, trainers, sets) with every species matched to a dex page."""
    match = X.match
    # Trainer sheet first pass (needed to know which Megas / trainer-only species exist)
    ATX = SD['atext']
    TAGRE = re.compile(r'\s*\[([^\]]+)\]')
    TB = xlsx.load(os.path.join(SRC, 'Trainer Battles.xlsx'))
    TT = ['Falkner Split', 'Bugsy Split', 'Whitney Split', 'Morty Split', 'Chuck Split', 'Jasmine Split', 'Pryce Split', 'Clair Split', 'Victory Road', 'Elite Four', 'Mini Bosses']
    TBS = {s.name: s for s in TB}
    FIELDS = ['Pokémon', 'Level', 'Ability', 'Held Item', 'Nature', 'Moves']
    SPLITS = []
    for tn in TT:
        sh = TBS[tn]; R = sh.rows(); split = {'n': tn, 'sec': [], 'note': []}; sec = None; tr = None; field = ''; mv = 0
        def newsec(h, r):
            nonlocal sec
            sec = {'h': h, 'tr': [], 'row': r, 'note': []}; split['sec'].append(sec)
        rows = sorted(R)
        for r in rows:
            row = R[r]; c0 = S(row.get(1)); cells = {c: S(v) for c, v in row.items() if c >= 2}
            if re.match(r'^Name\s*-', c0):
                if not sec: newsec(tn, r)
                tid = re.search(r'(\d+)', c0)
                tr = {'n': cells.get(2, ''), 'id': int(tid.group(1)) if tid else None, 'p': {}, 'row': r, 'note': []}; sec['tr'].append(tr); field = ''; continue
            if c0 in FIELDS: field = c0; mv = 0
            elif not c0 and field == 'Moves' and tr and mv < 3 and any(cells.values()): mv += 1
            elif not c0 and cells.get(2) and (field in ('', 'Moves') or not tr):
                newsec(cells[2], r); tr = None; field = ''; continue
            if not tr: continue
            if field == 'Pokémon' and not c0:
                for c, v in cells.items():
                    if v and v != '-': tr['p'][c] = {'s': v, 'm': []}
            elif field and field != 'Pokémon':
                for c, v in cells.items():
                    p = tr['p'].get(c)
                    if not p: continue
                    if field == 'Level': p['l'] = v
                    elif field == 'Ability': p['a'] = v
                    elif field == 'Held Item': p['i'] = v
                    elif field == 'Nature': p['na'] = v
                    elif field == 'Moves' and v and v != '-': p['m'].append(v)
        # cell notes (column I): on a trainer's name row -> that trainer; on a section header row -> the section; else the
        # trainer whose block holds the row; before the first trainer -> the tab
        for (r, c), t in sorted(sh.notes.items()):
            t = note1(t)
            tgt = None
            for s_ in split['sec']:
                if s_['row'] == r and not any(t_['row'] == r for t_ in s_['tr']): tgt = s_; break
            if tgt is None:
                prev = [t_ for s_ in split['sec'] for t_ in s_['tr'] if t_['row'] <= r]
                tgt = max(prev, key=lambda t_: t_['row']) if prev else split
            if t not in tgt['note']: tgt['note'].append(t)
        for s_ in split['sec']:
            for t_ in s_['tr']: t_['p'] = [t_['p'][c] for c in sorted(t_['p'])]
        split['sec'] = [s_ for s_ in split['sec'] if s_['tr']]
        SPLITS.append(split)
    # tab-level text rows (Elite Four rule, Mini Bosses rule) live in column B above the first trainer in the old sheet;
    # they are captured as section headers when they don't look like places. Moved into the tab note here.
    for sp in SPLITS:
        pass

    # species matching for trainers
    TRONLY = set(); UNT = set(); FZ = set()
    for sp in SPLITS:
        for s_ in sp['sec']:
            for t_ in s_['tr']:
                for p in t_['p']:
                    f = match(p['s'], True)
                    if f:
                        p['f'] = f
                        if key(p['s']) != key(fid(f)) and not re.search(r'-(A|G|H|P|F|M|Galar)$', p['s'], re.I) and not re.search(r'-M-[XYZ]$', p['s']): FZ.add(p['s'] + ' > ' + fid(f))
                    else:
                        m = re.match(r'^(.*)-M(?:-([XYZ]))?$', p['s'])
                        if m: p['zam'] = (m.group(1), (m.group(2) or '').lower())
                        else: UNT.add(p['s'])
    report('trainer species fuzzy-matched:', '; '.join(sorted(FZ)))
    if UNT: report('trainer species NOT matched:', '; '.join(sorted(UNT)))
    X.ATX, X.FZ, X.SPLITS, X.TAGRE, X.TRONLY = ATX, FZ, SPLITS, TAGRE, TRONLY


def engine(D):
    """Game trainer lookups (Trainers.c) and the trainer-only species the game sets add."""
    F, HG, MEGAS, OBT, SPLITS, TAGRE, TRONLY = X.F, X.HG, X.MEGAS, X.OBT, X.SPLITS, X.TAGRE, X.TRONLY
    SIDFIX = {'wormadam_trash': 'wormadam_trashy'}
    def gsid(v):
        i = HG.sid(HG.species(v)); return SIDFIX.get(i, i)
    def name_ok(sheet, game):
        g = key(game); s_ = key(sheet)
        if g and g in s_: return True
        m = re.match(r'grunt(\d+)$', g)
        return bool(m and re.search(r'#%s$' % m.group(1), sheet)) or g == 'boy'
    def game_trainer(tid, name, species):
        """The trainer's entry in Trainers.c: by the sheet's id, or (when the id points at someone else) by name and team."""
        GT = HG.TR.get(str(tid)) if tid is not None else None
        if GT and name_ok(name, GT.get('name', '')): return tid, GT
        best = None
        for k_, v in HG.TR.items():
            if not isinstance(v, dict) or not name_ok(name, v.get('name', '')): continue
            sp_ = {gsid(m_['species']).split('_')[0] for m_ in v.get('party', []) if isinstance(m_, dict)}
            n = len(sp_ & {x.split('_')[0] for x in species})
            if n and (best is None or n > best[0]): best = (n, k_, v)
        if best: return int(best[1]), best[2]
        return tid, GT
    for sp in SPLITS:
        for s_ in sp['sec']:
            for t_ in s_['tr']:
                _, GT = game_trainer(t_['id'], TAGRE.sub('', t_['n']).strip(), [fid(p['f']) for p in t_['p'] if p.get('f')])
                for m_ in (GT or {}).get('party', []):
                    if not isinstance(m_, dict): continue
                    g = gsid(m_['species']) + '.html'
                    if g in F and g not in OBT and g not in MEGAS and g not in TRONLY: TRONLY.add(g); report('trainer-only species from the game sets:', fid(g))
    X.SIDFIX, X.game_trainer, X.name_ok = SIDFIX, game_trainer, name_ok


def build(D):
    """TR: trainers from the sheet with the game's sets, level caps from Mechanics.txt."""
    AB, ATX, FZ, HG, M, SIDFIX, SPLITS, TAGRE, abn, ai, byId, game_trainer, mi, name_ok = X.AB, X.ATX, X.FZ, X.HG, X.M, X.SIDFIX, X.SPLITS, X.TAGRE, X.abn, X.ai, X.byId, X.game_trainer, X.mi, X.name_ok
    # ---------------------------------------------------------------- trainers -> EI schema
    CAPS = []  # from Mechanics.txt
    mech = open(os.path.join(SRC, 'Mechanics.txt'), encoding='utf-8-sig').read()
    for m in re.finditer(r'^(.+?)\s+lvl (\d+)\s*$', mech, re.M): CAPS.append([m.group(1).strip(), int(m.group(2))])
    NATS = {'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'}
    SAMEAB = {'purepower': 'hugepower'}   # same effect: the sheet's Pure Power on a Huge Power set is not a difference
    G = []; TRFIX = []; TRSTAT = collections.Counter(); TRCF = []
    seen_gt = set()   # (game trainer id, name) already placed: the sheet lists Will (702) and Koga (703) [Double] twice
    cap_now = None
    for gi, sp in enumerate(SPLITS):
        g = {'n': sp['n'], 'tab': sp['n'], 'note': sp['note'], 'sec': []}
        for si, s_ in enumerate(sp['sec']):
            h = s_['h']; m = re.match(r'^(.*?\[Level Cap ([^\]]*)\])[,\s]*(.*)$', h)
            place = h; cap = cap_now
            if m:
                place = m.group(3) or m.group(1); cv = m.group(2).strip()
                if re.fullmatch(r'\d+', cv): cap = cap_now = int(cv)
                else: cap = None
            sec = {'h': h, 'note': s_['note'], 'tr': []}
            for ti, t_ in enumerate(s_['tr']):
                tags = TAGRE.findall(t_['n']); name = TAGRE.sub('', t_['n']).strip()
                st_ = next((x[8:].strip() for x in tags if x.startswith('Starter ')), '')
                tags = [x for x in tags if not x.startswith('Starter ')]
                k = '%d.%d.%d' % (gi, si, ti)
                T = {'k': k, 'n': name, 'id': t_['id'], 'loc': place, 'tags': tags, 'st': st_, 'cap': cap, 'note': t_['note'], 'p': []}
                gid_, GT = game_trainer(t_['id'], name, [fid(p['f']) for p in t_['p'] if p.get('f')])
                if gid_ != t_['id']: TRFIX.append('%s: sheet id %s, game trainer %s' % (name, t_['id'], gid_)); T['id'] = gid_
                if GT is not None and (gid_, name) in seen_gt:   # the key stays used, so later keys don't move
                    report('trainer listed twice in the sheet, dropped:', k, name, gid_); continue
                if GT is not None: seen_gt.add((gid_, name))
                gp = [m_ for m_ in (GT or {}).get('party', []) if isinstance(m_, dict)]
                if GT is None: TRSTAT['trainer not in the game data'] += 1; report('trainer not in the game data:', name, t_['id'])
                elif not name_ok(name, GT.get('name', '')): report('trainer id %s: sheet "%s", game "%s"' % (t_['id'], name, GT.get('name')))
                if GT and 'DOUBLE' in str(GT['data'].get('battleType', '')) and not any('Double' in x for x in tags): tags.append('Double')
                used_g = set()
                for p in t_['p']:
                    f = p.get('f'); x = {'id': fid(f) if f else None, 's': p['s']}
                    lvs = p.get('l', '')
                    mm = re.match(r'^X\s*([+-]\s*\d+)?$', lvs, re.I)
                    if re.fullmatch(r'\d+', lvs): x['l'] = int(lvs)
                    elif mm: x['r'] = int((mm.group(1) or '0').replace(' ', ''))
                    elif not lvs and cap is None: x['r'] = 0
                    else: x['l'] = None
                    na = p.get('na', '')
                    if na and na not in NATS:
                        bn = min(NATS, key=lambda z: lev(key(na), key(z)))
                        if lev(key(na), key(bn)) <= 2: TRFIX.append('nature %s > %s' % (na, bn)); na = bn
                    ab = p.get('a', '')
                    if ab and key(ab.split('/')[0]) not in ATX and key(p.get('i', '')) in ATX:
                        ab, p['i'] = p['i'], ab
                    abl = [a_.strip() for a_ in ab.split('/') if a_.strip() and a_.strip() != '-']
                    it = p.get('i', ''); it = '' if it in ('-', '') else it
                    mvs = [mi(v) for v in p['m']]
                    # the game's own set (Trainers.c): same slot if it is the same species line, else the first unused match
                    sid = x['id'] or ''; sbase = re.sub(r'^mega_|_[xyz]$', '', sid)
                    gm = None
                    def same(g_):
                        gid = HG.sid(HG.species(g_['species']))
                        return gid in (sid, sbase) or gid.split('_')[0] == sbase.split('_')[0]
                    j0 = len(used_g)
                    order_ = [j0] + [j for j in range(len(gp)) if j != j0]
                    for j in order_:
                        if j < len(gp) and j not in used_g and same(gp[j]): gm = gp[j]; used_g.add(j); break
                    if gm is None:
                        later = {k2 for k2, q2 in enumerate(t_['p']) if k2 > t_['p'].index(p) and q2.get('f') and any(j not in used_g and j < len(gp) and HG.sid(HG.species(gp[j]['species'])).split('_')[0] == fid(q2['f']).split('_')[0] for j in range(len(gp)))}
                        free = [j for j in range(len(gp)) if j not in used_g and not any(fid(t_['p'][k2]['f']).split('_')[0] == HG.sid(HG.species(gp[j]['species'])).split('_')[0] for k2 in later)]
                        if free: gm = gp[free[0]]; used_g.add(free[0])
                    if gm is None:
                        x.update({'na': na, 'a': ai(abl[0]) if abl else -1, 'i': it, 'm': mvs, 'iv': [31] * 6, 'ev': [0] * 6, 'src': 's'})
                        if len(abl) > 1: x['ao'] = ' / '.join(abl)
                        TRSTAT['sheet only (no game set)'] += 1
                        if GT is not None: report('no game set for', name, p['s'])
                        T['p'].append(x); continue
                    TRSTAT['game set'] += 1
                    gid = HG.sid(HG.species(gm['species']))
                    g_it = '' if gm.get('item', 'ITEM_NONE') == 'ITEM_NONE' else hgsource.Src.title(gm['item'], 'ITEM_')
                    if g_it and key(g_it) == key(it): g_it = it
                    g_ab = abn(gm['ability']) if gm.get('ability') and gm['ability'] != 'ABILITY_NONE' else None
                    g_na = gm['nature'].replace('NATURE_', '').title() if str(gm.get('nature', '')).startswith('NATURE_') else na
                    g_mv = [mi(HG.move(m_)) for m_ in gm.get('moves', []) if m_ not in ('MOVE_NONE', 0)]
                    if 'TRAINER_DATA_TYPE_MOVES' not in str(GT['data'].get('trainerType', '')): g_mv = mvs   # no custom moves: the game uses the level-up moves, as the sheet lists
                    iv = gm.get('setIvs') if isinstance(gm.get('setIvs'), list) else [gm.get('ivs', 0) * 31 // 255] * 6
                    cf = []
                    # Mega holders: the sheet names the Mega form; the game stores the base species with the stone
                    gid = SIDFIX.get(gid, gid)
                    fbase = lambda i_: re.sub(r'^(mega|primal)_|_(x|y|z|primal)$', '', i_)
                    if sid != gid and sid in byId and fbase(sid).split('_')[0] == gid.split('_')[0] and re.search(r'^(mega|primal)_|_primal$', sid): shown = sid
                    elif gid in byId: shown = gid
                    else: shown = sid or gid; report('game species without a page:', name, gid)
                    if shown != sid and sid: cf.append('species ' + p['s'])
                    if x.get('l') is not None and gm['level'] != x['l']: cf.append('level %s' % x['l'])
                    if 'l' in x: x['l'] = gm['level']   # cap-relative (X-2) sets keep r; the game stores them at Jasmine's cap - 2 and scales them
                    # spelling slips in the sheet (Msytic Water, Lighting Rod) are typos, not differences
                    if key(g_it) != key(it):
                        if g_it and it and lev(key(g_it), key(it)) <= 2: TRFIX.append('%s %s: item "%s" = %s' % (name, p['s'], it, g_it))
                        else: cf.append('item ' + (it or 'none'))
                    if g_na and na and g_na != na:
                        if na in NATS: cf.append('nature ' + na)
                        else: TRFIX.append('%s %s: sheet rows shifted (nature "%s")' % (name, p['s'], na))
                    same_ab = lambda a_: SAMEAB.get(key(a_), key(a_))
                    if g_ab and abl and same_ab(g_ab) not in [same_ab(AB[ai(a_)][0]) for a_ in abl]: cf.append('ability ' + ' / '.join(abl))
                    if mvs and sorted(g_mv) != sorted(mvs): cf.append('moves ' + ', '.join(M[i] for i in mvs))
                    if 'MOVE_HIDDEN_POWER' in gm.get('moves', []):
                        iv_ = gm.get('setIvs') if isinstance(gm.get('setIvs'), list) else [31] * 6
                        hpt = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark']
                        x['hp'] = hpt[sum((v_ & 1) << b_ for b_, v_ in enumerate(iv_)) * 15 // 63]   # setIvs order HP Atk Def Spe SpA SpD = the formula's bit order
                    x['id'] = shown; x['na'] = g_na; x['i'] = g_it; x['m'] = g_mv
                    x['iv'] = [iv[0], iv[1], iv[2], iv[4], iv[5], iv[3]]; x['ev'] = [0] * 6
                    if shown.startswith('mega_') and byId.get(shown) and byId[shown]['a']:
                        x['a0'] = ai(g_ab) if g_ab else -1; x['a'] = byId[shown]['a'][0]
                    else: x['a'] = ai(g_ab) if g_ab else (ai(abl[0]) if abl else -1)
                    if cf: x['cf'] = cf; TRSTAT['sets where the sheet differs'] += 1; TRCF.append('%s %s: sheet says %s' % (name, p['s'], '; '.join(cf)))
                    T['p'].append(x)
                for j, g_ in enumerate(gp):
                    if j in used_g: continue
                    gid = HG.sid(HG.species(g_['species']))
                    TRSTAT['game Pokemon missing from the sheet'] += 1; report('in the game but not the sheet:', name, gid, 'Lv', g_['level'])
                sec['tr'].append(T)
            g['sec'].append(sec)
        G.append(g)
    report('trainer sets:', dict(TRSTAT))
    for x in TRCF: report('  ' + x)
    if TRFIX: report('trainer fixes:', '; '.join(TRFIX))
    TRD = {'caps': CAPS, 'fix': sorted(FZ) + TRFIX, 'g': G}
    X.G = G
    D['TR'] = TRD



def split(D):
    """Boxes = the mini-splits the sheet's section headings start; places = the headings, repeats next to each other merged."""
    G = []
    for g in D['TR']['g']:
        first = True
        for s in g['sec']:
            h = s['h']; m = re.match(r'^(.*?) \[Level Cap (\d+)\],?\s*(.*)$', h)
            if m: G.append({'n': split_name(m[1], int(m[2])), 'cap': int(m[2]), 'tab': g['tab'], 'note': [], 'sec': []}); h = m[3] or m[1]
            elif g['n'] == 'Mini Bosses':
                if first: G.append({'n': 'Mini Bosses', 'tab': g['tab'], 'note': [], 'sec': []})
                h = re.sub(r'^\[Level Cap X-2\]\s*', '', h)
            assert G, h
            if first and g.get('note'): G[-1]['note'] += g['note']
            first = False
            sec = G[-1]['sec']
            if sec and sec[-1]['h'] == h and not s.get('note') and not s.get('rw'): sec[-1]['tr'] += s['tr']
            else: sec.append(dict(s, h=h))
    D['TR']['g'] = G

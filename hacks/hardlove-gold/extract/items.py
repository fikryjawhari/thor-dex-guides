"""Items (IT): the Item Location sheet (held items, berries, TMs and HMs checked against MachineMoves.c, tutors, evolution
items, Mega stones, the rest). split() makes Held Items and Berries one box with categories (r[4]) and Heart Scales and
Rare Candies one Valuables box (the split UI).
"""
from common import (X, S, SRC, collections, datetime, fid, json, key, lev, note1, os, re, report, unicodedata,
                    CALC, OLDP, SD, dexsite, enccheck, hgsource, xlsx)  # noqa: F401


def sheet(D):
    """The Item Location sheet's Mega Stones (MS)."""
    # Mega Stones sheet -> stone per Mega
    IL = {s.name: s for s in xlsx.load(os.path.join(SRC, 'Item Location.xlsx'))}
    MS = []  # [stone, location]
    for r, row in sorted(IL['Mega Stones'].rows().items()):
        if r == 1 or not S(row.get(1)): continue
        MS.append([S(row.get(1)), S(row.get(2))])
    X.IL, X.MS = IL, MS


def build(D):
    """IT: held items, berries, TMs and HMs, tutors, evolution items, Mega stones and the rest."""
    HG, IL, MS, P, cname, mi = X.HG, X.IL, X.MS, X.P, X.cname, X.mi
    # ---------------------------------------------------------------- items
    def rows_(sh): return sorted(sh.rows().items())
    IT = []
    miss = lambda t: 1 if re.search(r'miss permanently', t, re.I) else 0
    hi = [[S(r.get(1)), S(r.get(2))] for n, r in rows_(IL['Held Items']) if n > 1 and S(r.get(1))]
    IT.append({'n': 'Held Items', 'k': 'gen', 'note': '', 'r': [[a, b, None, miss(b)] for a, b in hi]})
    be = [[S(r.get(4)), (S(r.get(5)) + (' Yield: ' + S(r.get(6)) if S(r.get(6)) not in ('', '-') else '')).strip()] for n, r in rows_(IL['Held Items']) if n > 1 and S(r.get(4))]
    IT.append({'n': 'Berries', 'k': 'gen', 'note': '', 'r': [[a, b, None, miss(b)] for a, b in be]})
    for nm, tn in (('Heart Scales', 'Heart Scale'), ('Rare Candies', 'Rare Candy')):
        sh = IL[nm]
        IT.append({'n': nm, 'k': 'gen', 'note': '', 'r': [[tn, S(r.get(1)) + ', ' + S(r.get(2)), None, miss(S(r.get(2)))] for n, r in rows_(sh) if n > 1 and S(r.get(1))]})
    sh = IL['HMTMs and Move Tutors']; tms, hms, tus = [], [], []; inhm = False
    for n, r in rows_(sh):
        if n == 1: continue
        a, b, c = S(r.get(1)), S(r.get(2)), S(r.get(3))
        if a == 'HM': inhm = True; continue
        if inhm and a:
            hms.append([a + ' ' + b, c or 'Not listed', mi(b) if b else None, miss(c)])
        elif a:
            tms.append([(a + ' ' + b).strip(), c or 'Not listed', mi(b) if b else None, miss(c)])
        if S(r.get(5)) and S(r.get(5)) != 'Move':
            tus.append([S(r.get(5)), S(r.get(6)), mi(S(r.get(5))), miss(S(r.get(6)))])
    # TM/HM numbers and moves from the game (MachineMoves.c): blank sheet rows get their move, wrong numbers are relabelled
    GTM = {}; GLAB = {}
    for lab, mv in HG.TM:
        m = re.fullmatch(r'(TM|HM)0*(\d+)', lab)
        if m: GTM[(m.group(1), int(m.group(2)))] = HG.move(mv); GLAB.setdefault((m.group(1), key(HG.move(mv))), m.group(1) + '%02d' % int(m.group(2)))
    TMFIX = []
    for rows, kind in ((tms, 'TM'), (hms, 'HM')):
        parsed = []
        for r in rows:
            m = re.match(r'(TM|HM)0*(\d+)\s*(.*)', r[0]); parsed.append([int(m.group(2)), m.group(3).strip(), r])
        have = {}
        for n, mv, r in parsed:
            g = GTM.get((kind, n))
            if mv and g and key(cname(mv)) != key(g):
                lab = GLAB.get((kind, key(cname(mv))))
                if lab: TMFIX.append('%s%02d %s is %s in the game' % (kind, n, mv, lab)); n = int(lab[2:])
                else: TMFIX.append('%s%02d: sheet %s, game %s' % (kind, n, mv, g)); mv = g
            if not mv and g: mv = g; r[1] = 'Not listed in the items sheet'; TMFIX.append('%s%02d = %s' % (kind, n, g))
            if not mv: continue
            r[0] = '%s%02d %s' % (kind, n, cname(mv)); r[2] = mi(mv)
            if n not in have or have[n][1].startswith('Not listed'): have[n] = r
        rows[:] = [have[n] for n in sorted(have)]
    report('TM/HM fixes from the game:', '; '.join(TMFIX))
    IT += [{'n': 'TMs', 'k': 'tm', 'note': 'TMs are consumed on use (Mechanics).', 'r': tms}, {'n': 'HMs', 'k': 'tm', 'note': 'HMs do not need to be taught: having the HM and the badge is enough.', 'r': hms},
           {'n': 'Move Tutors', 'k': 'tm', 'note': '', 'r': tus}]
    sh = IL['Evolution Items']
    IT.append({'n': 'Evolution Items', 'k': 'gen', 'note': note1(S(sh.v(1, 1))), 'r': [[S(r.get(1)), S(r.get(2)), None, miss(S(r.get(2)))] for n, r in rows_(sh) if n > 2 and S(r.get(1))]})
    megaByStone = {key(p['stone']): p['id'] for p in P if p.get('stone')}
    IT.append({'n': 'Mega Stones', 'k': 'mega', 'note': '', 'r': [[a, b, megaByStone.get(key(a)), miss(b)] for a, b in MS]})
    sh = IL['Other']
    IT.append({'n': 'Other', 'k': 'gen', 'note': '', 'r': [[S(r.get(1)), S(r.get(2)), None, miss(S(r.get(2)))] for n, r in rows_(sh) if n > 1 and S(r.get(1))]})
    nolink = [r[0] for r in IT[-2]['r'] if r[2] is None and not re.match(r'^unavailable', r[1], re.I)]
    if nolink: report('mega stones with a location but no Mega page:', ', '.join(nolink))
    X.IT, X.rows_ = IT, rows_
    D['IT'] = IT



def split(D):
    """Held Items and Berries in one box with categories; Heart Scales and Rare Candies become Valuables."""
    TYPE = {'Miracle Seed', 'Nevermelt Ice', 'Poison Barb', 'Silk Scarf', 'Charcoal', 'Silver Powder', 'Soft Sand', 'Black Glasses',
            'Hard Stone', 'Magnet', 'Metal Coat', 'Twisted Spoon', 'Sharp Beak', 'Mystic Water', 'Black Belt', 'Spell Tag',
            'Pixie Plate', 'Dragon Fang'}
    CONS = {'White Herb', 'Power Herb', 'Throat Spray', 'Room Service', 'Eject Button', 'Red Card', 'Eject Pack', 'Booster Energy',
            'Focus Sash', 'Electric Seed', 'Psychic Seed', 'Grassy Seed', 'Misty Seed'}
    cat = lambda n: 'Gems' if n.endswith(' Gem') else 'Type boosting' if n in TYPE else 'Consumable' if n in CONS else 'Battle'
    ORDER = ['Type boosting', 'Battle', 'Consumable', 'Gems', 'Berries']
    S = {s['n']: s for s in D['IT']}
    held = [r + [cat(r[0])] for r in S['Held Items']['r']] + [r + ['Berries'] for r in S['Berries']['r']]
    held.sort(key=lambda r: ORDER.index(r[4]))
    val = [r + ['Heart Scale'] for r in S['Heart Scales']['r']] + [r + ['Rare Candy'] for r in S['Rare Candies']['r']]
    IT = [dict(S['Held Items'], r=held), {'n': 'Valuables', 'k': 'gen', 'note': '', 'r': val}]
    IT += [s for s in D['IT'] if s['n'] not in ('Held Items', 'Berries', 'Heart Scales', 'Rare Candies')]
    D['IT'] = IT

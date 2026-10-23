"""Walkthrough (AR, WK): the areas, and the walkthrough from the trainer boxes (one stop per place, split by cap), the encounter
areas and the items, plus the game docs (Mechanics, trainer AI, Post-KO switch-in scores).
"""
from common import (X, S, SRC, collections, datetime, fid, json, key, lev, note1, os, re, report, unicodedata,
                    CALC, OLDP, SD, dexsite, enccheck, hgsource, xlsx)  # noqa: F401


def build(D):
    """AR and WK: the areas, the walkthrough from the trainer boxes, items and docs."""
    G, GCNOTE, IT, LOC, LOCNOTE, ROAMNOTE, SAFNOTE, rows_ = X.G, X.GCNOTE, X.IT, X.LOC, X.LOCNOTE, X.ROAMNOTE, X.SAFNOTE, X.rows_
    # ---------------------------------------------------------------- areas + walkthrough (port of __buildWT)
    def areaOf(n):
        n = re.sub(r'^Safari Zone: .*$', 'Safari Zone', n)
        n = re.sub(r'\s*\((Headbutt|Morning|Day|Night|Surf|\d)\)\s*', ' ', n, flags=re.I)
        n = re.sub(r'\s+-\s+.*$', '', n); n = re.sub(r'\s+(B?\d+F)\b.*$', '', n); n = re.sub(r'\s*\([^)]*\)\s*$', '', n)
        n = re.sub(r' Entrance$', '', n).replace('Ilex Forrest', 'Ilex Forest')
        return n.strip()
    AN, AIx = [], {}
    locArea = []
    for l in LOC:
        a = areaOf(l)
        if a not in AIx: AIx[a] = len(AN); AN.append(a)
        locArea.append(AIx[a])
    AR = []
    for i, n in enumerate(AN):
        A = {'n': n, 'l': [j for j in range(len(LOC)) if locArea[j] == i]}
        notes = [LOCNOTE[LOC[j]] for j in A['l'] if LOC[j] in LOCNOTE]
        if n == 'Roaming': A['ns'] = 1; notes.append(ROAMNOTE)
        if n == 'Safari Zone' and SAFNOTE: notes.append(SAFNOTE)
        if notes: A['note'] = ' '.join(dict.fromkeys(notes))
        AR.append(A)
    def normw(s):
        s = unicodedata.normalize('NFD', s); s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
        return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', s)).strip()
    ALIASW = {'ilex forrest': 'Ilex Forest', 'tr hq': 'Team Rocket HQ', 'tr hideout': 'Team Rocket HQ', 'team rocket': 'Team Rocket HQ', 'azalea city': 'Azalea Town', 'mt mortar': 'Mt. Mortar',
              'ice patch': 'Ice Path', 'moomoo farm': 'Route 39', 'olivine lighthouse': 'Olivine City', 'lighthouse': 'Olivine City', 'ss aqua': 'Vermilion City',
              'underground path': 'Goldenrod City', 'radio tower': 'Goldenrod City', 'bill s grandfather': 'Route 25', 'indigo plateau': 'Victory Road', 'pokemon league': 'Victory Road',
              'tohjo falls': 'Route 27', 'dragon den': "Dragon's Den", 'vermillion city': 'Vermilion City', 'vermillion': 'Vermilion City', 'leader pryce': 'Mahogany Town',
              'pryce': 'Mahogany Town', 'kurt': 'Azalea Town', 'elder li': 'Cherrygrove City', 'goldenrod department store': 'Goldenrod City', 'goldenrod game corner': 'Goldenrod City'}
    for n in AN:
        m = re.match(r'^(.*) (City|Town)$', n)
        if m: ALIASW[normw(m.group(1))] = n
    CANDS = [(normw(n), i) for i, n in enumerate(AN)] + [(k, AIx.get(v)) for k, v in ALIASW.items()]
    def areaMatch(txt):
        t = ' ' + normw(txt) + ' '; best, bi, bl = None, 10 ** 9, 0
        for k, i in CANDS:
            if i is None: continue
            ix = t.find(' ' + k + ' ')
            if ix >= 0 and (ix < bi or (ix == bi and len(k) > bl)): bi, bl, best = ix, len(k), i
        return best, bi
    stops = []; split = None; splits = []; kk = 0
    for gi, g in enumerate(G):
        for si, s_ in enumerate(g['sec']):
            h = s_['h']; locn = h
            m = re.match(r'^(.*?\[Level Cap [^\]]*\])[,\s]*(.*)$', h)
            if m:
                nm = m.group(1).strip()
                if re.match(r'^\[Level Cap X', nm):
                    if not split or not split.get('mini'): split = {'n': 'Mini Bosses (optional)', 'mini': 1, 'note': g['note']}; splits.append(split)
                else:
                    split = {'n': nm, 'note': g['note'] if g['n'] == 'Elite Four' else []}; splits.append(split)
                locn = m.group(2) or nm
            if not split: split = {'n': g['n'], 'note': []}; splits.append(split)
            a, ix = areaMatch(locn); a = a if ix <= 2 else None
            trs = [t['k'] for t in s_['tr']]; last = stops[-1] if stops else None
            if last and last['split'] is split and not split.get('mini') and last['a'] is not None and last['a'] == a and not re.search('gym', locn, re.I) and not re.search('gym', last['n'], re.I):
                last['tr'] += trs; last['sn'] += s_['note']
            else:
                kk += 1; stops.append({'k': kk, 'split': split, 'n': locn, 'a': a, 'tr': trs, 'it': [], 'sn': list(s_['note'])})
    def firstStop(a):
        for s in stops:
            if s['a'] == a and not s['split'].get('mini'): return s['k']
        return None
    placed = {}; p_ = 0; extra = []
    for a, n in enumerate(AN):
        m = firstStop(a)
        later = [x for x in (firstStop(b) for b in range(a + 1, len(AN))) if x is not None]
        nextMin = min(later) if later else float('inf')
        if m is not None and m >= p_ and m <= nextMin:
            placed[a] = next(s for s in stops if s['k'] == m); p_ = m
        else:
            prev = sorted([s for s in stops + extra if s['k'] <= p_], key=lambda s: -s['k'])
            k2 = p_ + 0.001
            st2 = {'k': k2, 'split': prev[0]['split'] if prev else splits[0], 'n': n, 'a': a, 'tr': [], 'it': [], 'sn': [], 'x': 1}
            extra.append(st2); placed[a] = st2; p_ = k2
    allst = sorted(stops + extra, key=lambda s: s['k'])
    for s in allst:
        if s['a'] is not None and placed.get(s['a']) is s: s['enc'] = 1; s['n'] = AN[s['a']] if s.get('x') else s['n']
    def keep(s):
        if s.get('enc') or s['a'] is None or s['split'].get('mini') or re.search('gym', s['n'], re.I): return True
        e = placed.get(s['a'])
        if e and e['split'] is s['split'] and e is not s: e['tr'] += s['tr']; e['sn'] += s['sn']; return False
        return True
    allst = [s for s in allst if keep(s)]
    NP = []
    for sec in IT:
        for r in sec['r']:
            txt = r[1] or ''
            if re.fullmatch(r'(unavailable\.?|not listed.*)?', txt.strip(), re.I): continue
            a, ix = areaMatch(txt)
            tgt = placed.get(a) if a is not None else None
            e = [sec['n'], r[0], txt, r[2]]
            (tgt['it'] if tgt else NP).append(e)
    WK = {'splits': [{'n': s['n'], 'note': ' '.join(s.get('note') or []), 'st': [{'n': x['n'], 'a': [x['a']] if x.get('enc') else [], 's': [], 'note': ' '.join(dict.fromkeys(x['sn'])),
                                                                              'it': x['it'], 'tr': x['tr'], **({'x': 1} if x.get('x') else {})} for x in allst if x['split'] is s]} for s in splits],
          'np': NP}
    WK['splits'] = [s for s in WK['splits'] if s['st']]
    # game docs shown in the walkthrough tab
    def txt(f): return open(os.path.join(SRC, f), encoding='utf-8-sig').read().strip()
    ko = {s.name: s for s in xlsx.load(os.path.join(SRC, 'Post-KO Switch-in AI.xlsx'))}['Switch Scores']
    KO = [[S(r.get(1)), S(r.get(2))] for n, r in rows_(ko) if S(r.get(1)) or S(r.get(2))]
    KONOTE = [note1(t) for t in ko.notes.values()]
    WK['docs'] = [['Mechanics', re.sub(r'^-+\s*\nMechanic Changes\s*\n-+\s*', '', txt('Mechanics.txt'))], ['Trainer AI (work in progress)', txt('Hardlove Gold AI document_WIP.txt')]]
    WK['ko'] = {'rows': KO, 'note': KONOTE}
    WK['gc'] = GCNOTE
    D['AR'] = AR
    D['WK'] = WK

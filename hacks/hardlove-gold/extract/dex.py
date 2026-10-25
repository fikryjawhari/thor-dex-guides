"""Dex (M, MV, AB, P, TC): species, moves, abilities and the type chart.

The dex site's pages give the species list, order and names (site); Showdown the move names and Gen 9 baseline (moves);
Z-A Megas come from Showdown (megas); the hack's own source (hg-engine, hgsource.py) is the authority for types, stats,
abilities, learnsets, evolutions and move data (engine, species, abilities, movetable). The steps run in the order
build.py calls them: they share the working state X (common.py) with locs.py, trainers.py and items.py.
"""
from common import (X, S, SRC, collections, datetime, fid, json, key, lev, note1, os, re, report, unicodedata,
                    CALC, OLDP, SD, dexsite, enccheck, hgsource, xlsx)  # noqa: F401
import hgengine


# ---------------------------------------------------------------- Pokemon (site pages + Z-A Megas)
TC9 = lambda s: s.lower().title()
EVR = [(r'stone \(level (\d+)\+\) (.+)$', lambda m: ('using %s (level %s+)' % (m.group(2), m.group(1))) if int(m.group(1)) > 0 else 'using ' + m.group(2)),
       (r'EVO_FRIENDSHIP_NIGHT (\d+)', 'high friendship at night'), (r'EVO_FRIENDSHIP_DAY (\d+)', 'high friendship during the day'), (r'EVO_FRIENDSHIP (\d+)', 'high friendship'),
       (r'EVO_LEVEL_ELECTRIC_FIELD (\d+)', 'level up in a magnetic field area'), (r'EVO_LEVEL_ATK_GT_DEF (\d+)', r'level \1 with Attack > Defense'),
       (r'EVO_LEVEL_ATK_LT_DEF (\d+)', r'level \1 with Attack < Defense'), (r'EVO_LEVEL_ATK_EQ_DEF (\d+)', r'level \1 with Attack = Defense'),
       (r'EVO_HAS_MOVE (.+)$', r'level up knowing \1'), (r'EVO_BEAUTY (\d+)', 'level up with high Beauty'), (r'EVO_STONE_FEMALE (.+)$', r'using \1 (female only)'),
       (r'EVO_LEVEL_MALE (\d+)', r'level \1 (male only)'), (r'EVO_LEVEL_FEMALE (\d+)', r'level \1 (female only)'),
       (r'EVO_TRADE_SPECIFIC_MON SPECIES_(\w+)', lambda m: 'trading for ' + TC9(m.group(1))), (r'EVO_LEVEL_DAY (\d+)', r'level \1 during the day'),
       (r'EVO_LEVEL_NIGHT (\d+)', r'level \1 at night'), (r'EVO_LEVEL_RAIN (\d+)', r'level \1 while raining'), (r'EVO_LEVEL_PID_LO (\d+)', r'level \1 (personality value, form A)'),
       (r'EVO_LEVEL_PID_HI (\d+)', r'level \1 (personality value, form B)'), (r'EVO_LEVEL_NATURE_AMPED (\d+)', r'level \1 with an Amped nature'),
       (r'EVO_LEVEL_NATURE_LOW_KEY (\d+)', r'level \1 with a Low Key nature'), (r'level up to (\d+)', r'level \1')]
def hum(x):
    for a, b in EVR: x = re.sub(a, b, x)
    return x
SPECIALN = {'NIDORAN_F': 'Nidoran♀', 'NIDORAN_M': 'Nidoran♂', 'MR_MIME': 'Mr. Mime', 'MIME_JR': 'Mime Jr.', 'FARFETCHD': "Farfetch'd", 'SIRFETCHD': "Sirfetch'd",
            'HO_OH': 'Ho-Oh', 'PORYGON_Z': 'Porygon-Z', 'TYPE_NULL': 'Type: Null', 'JANGMO_O': 'Jangmo-o', 'HAKAMO_O': 'Hakamo-o', 'KOMMO_O': 'Kommo-o',
            'MR_RIME': 'Mr. Rime', 'FLABEBE': 'Flabébé'}
def pretty(n):
    n = n.strip()
    if n in SPECIALN: return SPECIALN[n]
    if not re.fullmatch(r'[A-Z0-9_]+', n): return n
    return ' '.join(w.capitalize() for w in n.lower().split('_'))
# Showdown dex number per base species
SDX = SD['dex']; NUM = {}
for k, v in SDX.items(): NUM.setdefault(key(v.get('baseSpecies') or v['name']), v.get('num', 0))
def dexnum(f):
    i = fid(f); i = re.sub(r'^mega_', '', i)
    for cand in (i, i.split('_')[0]):
        k = key(cand)
        if k in NUM: return NUM[k]
        if k in SDX: return SDX[k].get('num', 0)
    return 0


def site(D):
    """The dex site's pages: species order, names and forms (F, ORDER), and the matcher from sheet names to pages."""
    # ---------------------------------------------------------------- dex site
    import re as _re
    idx = open(os.path.join(SRC, 'site/pokedex/index.html'), encoding='utf-8').read()
    ORDER = [x[2:] for x in _re.findall(r"href='(\./[^']+\.html)'", idx)]
    F = {o['f']: o for o in dexsite.load(os.path.join(SRC, 'site/pokedex'))}
    for f in F:
        if f not in ORDER: ORDER.append(f); report('dex page not in index:', f)
    dexKey = {key(fid(f)): f for f in ORDER}
    baseKeys = list(dexKey)
    SUF = {'a': 'alolan', 'g': 'galarian', 'h': 'hisuian', 'p': 'paldean', 'galar': 'galarian', 'alola': 'alolan', 'hisui': 'hisuian', 'f': 'female', 't': 'therian', 'd': 'defense'}
    ALIAS = {'lycanrocm': 'lycanroc_midnight.html', 'lycanrockm': 'lycanroc_midnight.html', 'lycanrocd': 'lycanroc_dusk.html', 'golispod': 'golisopod.html', 'crygonal': 'cryogonal.html',
             'redgyarados': 'gyarados.html', 'taurospaldean': 'tauros_combat.html', 'floetteeternal': 'floette_eternal_flower.html'}
    # Z-A Megas missing from the dex site come from Showdown (stats/types/abilities, base form's moves); see addZA() below.
    ZA = {}
    def fuzzy(k):
        best, bd = None, 3
        for b in baseKeys:
            if b.startswith('mega'): continue
            d = lev(k, b)
            if d < bd: bd, best = d, b
        return dexKey[best] if best else None
    def mega_of(bf, tr):
        b = key(fid(bf))
        for k in ('mega' + b,):
            if k in dexKey: return dexKey[k]
        return None
    def match(x, tr=False):
        x = re.sub(r'\(.*?\)|\*|"|\bEgg\b', '', x, flags=re.I).strip()
        if not x: return None
        if key(x) in ALIAS: return ALIAS[key(x)]   # before the suffix rules: Lycanroc-M is Midnight, not Mega
        m = re.match(r'^(.*?)[-\s](A|G|H|P|F|M|T|D|Galar|Alola|Hisui)$', x, re.I)
        if m:
            b, s = key(m.group(1)), m.group(2).lower()
            if s == 'm':
                if tr and 'mega' + b in dexKey: return dexKey['mega' + b]
                bf = dexKey.get(b) or (tr and fuzzy(b))
                if bf and tr and mega_of(bf, tr): return mega_of(bf, tr)
                if bf: return bf
            else:
                k = b + SUF[s]
                if k in dexKey: return dexKey[k]
                if s != 'f' and tr:
                    bf = fuzzy(b)
                    if bf and key(fid(bf)) + SUF[s] in dexKey: return dexKey[key(fid(bf)) + SUF[s]]
        k = key(x)
        return ALIAS.get(k) or dexKey.get(k) or (fuzzy(k) if tr else None)
    X.F, X.ORDER, X.dexKey, X.match = F, ORDER, dexKey, match


def moves(D):
    """Move names against Showdown's: the M list grows as moves are used."""
    # ---------------------------------------------------------------- moves (Showdown + Move Changes sheet)
    SDM = {k: v for k, v in SD['moves'].items()}
    sdKeys = [k for k, v in SDM.items() if not v['isMax'] and not v['isZ']]
    CANON = {}; FZM = set()
    def cname(x):
        k = key(x)
        if k.startswith('hiddenpower'): k = 'hiddenpower'
        if k in CANON: return CANON[k]
        if k in SDM: r = SDM[k]['name']
        else:
            best, bd = None, 3
            for s in sdKeys:
                d = lev(k, s)
                if d < bd: bd, best = d, s
            r = SDM[best]['name'] if best else x
            if best: FZM.add(x + ' > ' + r)
            else: report('move not in Showdown:', x)
        CANON[k] = r; return r
    M, MI = [], {}
    def mi(x):
        n = cname(x)
        if n not in MI: MI[n] = len(M); M.append(n)
        return MI[n]
    X.FZM, X.M, X.SDM, X.cname, X.mi = FZM, M, SDM, cname, mi
    D['M'] = M


def megas(D):
    """Z-A Megas (not on the site, from Showdown), which Megas players can use, and the stone of each."""
    F, MS, OBT, ORDER, SPLITS, TRONLY, dexKey, match = X.F, X.MS, X.OBT, X.ORDER, X.SPLITS, X.TRONLY, X.dexKey, X.match
    # Z-A Megas (not on the dex site): Showdown entries with forme Mega/Mega-X/Y/Z whose base is on the site
    def za_id(sd):
        b = sd.get('baseSpecies'); fm = sd.get('forme')
        suf = {'Mega': '', 'Mega-X': '_x', 'Mega-Y': '_y', 'Mega-Z': '_z'}.get(fm)
        if suf is None: return None, None
        bf = dexKey.get(key(b))
        if not bf: return None, None
        return 'mega_' + fid(bf) + suf, bf
    ZAD = {}
    for k, v in SDX.items():
        i, bf = za_id(v)
        if i and i + '.html' not in F: ZAD[i] = (v, bf)
    def add_za(i):
        v, bf = ZAD[i]; b = F[bf]
        F[i + '.html'] = {'f': i + '.html', 'n': i.upper(), 't': v['types'], 'a': [a for a in v['abilities'].values()][:1], 's': [v['baseStats'][x] for x in ('hp', 'atk', 'def', 'spa', 'spd', 'spe')],
                          'sec': {k2: b['sec'].get(k2, []) for k2 in ('Level-Up Moves', 'Machine Moves', 'Tutor Moves', 'Egg Moves')}, 'za': 1, 'stone': v.get('requiredItem')}
        F[i + '.html']['sec']['Other Forms'] = []
        dexKey[key(i)] = i + '.html'
        b['sec'].setdefault('Other Forms', []).append({'x': pretty(i.upper()), 'l': i + '.html'})
        pos = ORDER.index(bf) + 1
        while pos < len(ORDER) and ORDER[pos].startswith('mega_') : pos += 1
        ORDER.insert(pos, i + '.html')
    # stones in the sheet + trainer -M holders decide which Z-A Megas are needed
    need = set()
    stoneKey = {key(v.get('requiredItem') or ''): i for i, (v, bf) in ZAD.items() if v.get('requiredItem')}
    for st_, lc in MS:
        i = stoneKey.get(key(st_))
        if i: need.add(i)
    for sp in SPLITS:
        for s_ in sp['sec']:
            for t_ in s_['tr']:
                for p in t_['p']:
                    if 'zam' in p or ('f' in p and not fid(p['f']).startswith('mega_') and re.search(r'-M(-[XYZ])?$', p['s'])):
                        b = p['zam'][0] if 'zam' in p else fid(p['f'])
                        bf = match(b, True)
                        if not bf: continue
                        sfx = ('_' + p['zam'][1]) if 'zam' in p and p['zam'][1] else ''
                        m = re.search(r'-M-([XYZ])$', p['s'])
                        if m: sfx = '_' + m.group(1).lower()
                        cand = 'mega_' + fid(bf) + sfx
                        if cand not in ZAD: cand = 'mega_' + fid(bf).split('_')[0] + sfx
                        it = key(p.get('i', ''))
                        if cand in ZAD and key(ZAD[cand][0].get('requiredItem') or '') == it: need.add(cand)
    for i in sorted(need): add_za(i)
    report('Z-A Megas from Showdown:', ', '.join(sorted(need)))
    # re-resolve trainer -M holders now that the Z-A pages exist
    for sp in SPLITS:
        for s_ in sp['sec']:
            for t_ in s_['tr']:
                for p in t_['p']:
                    m = re.match(r'^(.*)-M(?:-([XYZ]))?$', p['s'])
                    if not m: continue
                    bf = match(m.group(1), True)
                    if not bf: continue
                    cand = 'mega_' + fid(bf) + ('_' + m.group(2).lower() if m.group(2) else '')
                    if cand + '.html' not in F: cand = 'mega_' + fid(bf).split('_')[0] + ('_' + m.group(2).lower() if m.group(2) else '')
                    if cand + '.html' in F:
                        stn = F[cand + '.html'].get('stone')
                        mf = F[cand + '.html']
                        if key(p.get('i', '')).startswith(key(stn or '')[:5]) or 'ite' in key(p.get('i', '')): p['f'] = cand + '.html'; p.pop('zam', None)
                        else: p['f'] = bf; p.pop('zam', None)
                    else:
                        p['f'] = p.get('f') or bf; p.pop('zam', None)
    for sp in SPLITS:
        for s_ in sp['sec']:
            for t_ in s_['tr']:
                for p in t_['p']:
                    if 'zam' in p: report('trainer -M species unresolved:', p['s'], p.get('i')); continue
                    if p.get('f') and p['f'] not in OBT: TRONLY.add(p['f'])

    # Megas: player-usable when the stone is in the sheet with a location; else kept only if a trainer uses it
    MEGAS = set()
    for f in list(OBT):
        for e in F[f]['sec'].get('Other Forms', []):
            l = e['l']
            if l and re.match(r'^(mega_|primal)', l) and l in F: MEGAS.add(l)
    TRONLY -= MEGAS
    stoneLoc = {}
    def stone_for(mid):
        o = F[mid + '.html']
        if o.get('stone'):
            for st_, lc in MS:
                if key(st_) == key(o['stone']): return st_, lc
        b = re.sub(r'^mega_', '', mid); parts = b.split('_'); sfx = parts[-1] if parts[-1] in ('x', 'y', 'z') and len(parts) > 1 else ''
        stem = key(parts[0]); best, bl = None, 3
        for st_, lc in MS:
            m = re.match(r'^(.*?)(?: ([XYZ]))?$', st_.strip()); nk = key(m.group(1)); ss = (m.group(2) or '').lower()
            if ss != sfx: continue
            n = 0
            while n < min(len(nk), len(stem)) and nk[n] == stem[n]: n += 1
            if n > bl or (n == bl and best is None): best, bl = (st_, lc), n
        return best or (None, None)
    # ---------------------------------------------------------------- the hack's source (hg-engine repo): authority for species data
    X.MEGAS, X.TRONLY, X.stone_for = MEGAS, TRONLY, stone_for


def engine(D):
    """The hack's own source (hg-engine): HG, evolution text and the game's evolutions (EVO)."""
    HG = hgsource.Src(os.path.join(SRC, 'repos/hardlove'))
    report('hack source: kumakuma1/hardlove at', HG.commit)
    SPN = {k: v['textData']['name'] for k, v in HG.S.items() if isinstance(v, dict) and 'textData' in v}
    def evo_text(m, prm):
        it = lambda c: hgsource.Src.title(c, 'ITEM_')
        m = m.replace('EVO_', '')
        T = {'LEVEL': 'level %s', 'LEVEL_MALE': 'level %s (male)', 'LEVEL_FEMALE': 'level %s (female)', 'LEVEL_DAY': 'level %s during the day',
             'LEVEL_NIGHT': 'level %s at night', 'LEVEL_RAIN': 'level %s while raining', 'LEVEL_PID_LO': 'level %s (personality value, form A)',
             'LEVEL_PID_HI': 'level %s (personality value, form B)', 'LEVEL_ATK_GT_DEF': 'level %s with Attack > Defense', 'LEVEL_ATK_LT_DEF': 'level %s with Attack < Defense',
             'LEVEL_ATK_EQ_DEF': 'level %s with Attack = Defense', 'LEVEL_NATURE_AMPED': 'level %s with an Amped nature', 'LEVEL_NATURE_LOW_KEY': 'level %s with a Low Key nature',
             'LEVEL_NINJASK': 'level %s', 'LEVEL_SHEDINJA': 'level %s with a free party slot and a Poké Ball', 'HURT_IN_BATTLE_AMOUNT': 'after losing %s+ HP in battles without fainting'}
        if m in T: return T[m] % prm
        if m == 'STONE': return 'using ' + it(prm)
        if m == 'ITEM_DAY': return 'level up holding %s during the day' % it(prm)
        if m == 'ITEM_NIGHT': return 'level up holding %s at night' % it(prm)
        if m == 'TRADE_ITEM': return 'trade holding ' + it(prm)
        if m == 'TRADE': return 'trade'
        if m == 'TRADE_SPECIFIC_MON': return 'trade for ' + SPN.get(prm, prm)
        if m == 'HAS_MOVE': return 'level up knowing ' + HG.move(prm)
        if m == 'HAS_MOVE_TYPE': return 'level up knowing a %s move' % prm[5:].title()
        if m == 'OTHER_PARTY_MON': return 'level up with %s in the party' % SPN.get(prm, prm)
        if m == 'FRIENDSHIP': return 'high friendship'
        if m == 'FRIENDSHIP_DAY': return 'high friendship during the day'
        if m == 'FRIENDSHIP_NIGHT': return 'high friendship at night'
        if m == 'MAGNETIC_FIELD': return 'level up in a magnetic field area'
        if m == 'BEAUTY': return 'level up with high Beauty'
        if m == 'LETS_GO': return 'level up after walking 1,000 steps with it out of its ball'
        if m == 'FORM_ARGUMENT': return 'special condition (%s)' % prm
        report('evolution method not described:', m, prm); return m.lower().replace('_', ' ') + (' ' + str(prm) if prm else '')
    EVO = collections.defaultdict(list)   # site id -> [(how, target site id)]
    for k, v in HG.EV.items():
        if not isinstance(v, dict): continue
        for e in v.get('entries', []):
            if not isinstance(e, list) or e[0] == 'EVO_NONE': continue
            tgt = HG.species(e[2] if len(e) < 4 else 'MON_WITH_FORM ( %s , %s )' % (e[2], e[3]))
            EVO[HG.sid(k)].append((evo_text(e[0], e[1]), HG.sid(tgt)))
    X.EVO, X.HG = EVO, HG


def species(D):
    """P: the species list in dex order, types, the hack source's data over the site's, Megas nobody can use dropped."""
    ATX, EVO, F, FIND, HG, MEGAS, OBT, ORDER, REV, SPLITS, TRONLY, mi, stone_for = X.ATX, X.EVO, X.F, X.FIND, X.HG, X.MEGAS, X.OBT, X.ORDER, X.REV, X.SPLITS, X.TRONLY, X.mi, X.stone_for
    P = []
    INCL = [f for f in ORDER if f in OBT or f in MEGAS or f in TRONLY]
    # Megas right after their base form
    order2 = []
    for f in INCL:
        if f in MEGAS and not F[f].get('za'): continue
        if f in MEGAS: continue
        order2.append(f)
        for e in F[f]['sec'].get('Other Forms', []):
            if e['l'] in MEGAS and e['l'] not in order2: order2.append(e['l'])
    for f in INCL:
        if f not in order2: order2.append(f); report('placed at the end:', f)
    INCL = order2; INC = set(INCL)
    TYPEFIX = []
    for f in INCL:
        o = F[f]; i = fid(f)
        t = o['t']
        if not t:
            cp = CALC['poks'].get(i) or CALC['poks'].get(i.replace('_', ''))
            if cp: t = cp['types']; TYPEFIX.append(i + ' (calc)')
            elif i in OLDP: t = OLDP[i]['t']; TYPEFIX.append(i + ' (previous build)')
            else: report('NO TYPES for', i)
        sec = o['sec']
        lk = lambda e: [hum(e['x']), fid(e['l']) if e['l'] and e['l'] in INC else None]
        p = {'id': i, 'n': pretty(o['n']), 'dex': dexnum(f), 't': t, 'a_': o['a'], 's': o['s'],
             'ef': [lk(e) for e in sec.get('Evolves From', [])], 'et': [lk(e) for e in sec.get('Evolves To', [])],
             'of': [fid(e['l']) for e in sec.get('Other Forms', []) if e['l'] and e['l'] in INC],
             'lv': [[int(r[0]) if str(r[0]).isdigit() else 0, mi(r[1])] for r in sec.get('Level-Up Moves', [])],
             'tm': [mi(x) for x in sec.get('Machine Moves', [])], 'tu': [mi(x) for x in sec.get('Tutor Moves', [])], 'eg': [mi(x) for x in sec.get('Egg Moves', [])],
             'w': FIND.get(f, []), 'g': 1 if f in MEGAS else 3 if f in TRONLY else 0}
        if f in MEGAS:
            st_, lc = stone_for(i)
            if st_: p['stone'] = st_; p['sloc'] = lc
            else: report('no stone found for', i)
            if not st_ or re.match(r'^unavailable', lc or '', re.I): p['nu'] = 1
        P.append(p)
    report('types filled:', ', '.join(TYPEFIX))
    # Species data from the hack's source replaces the dex site's (the site was last rebuilt 2026-10-02, before the 0.8.0
    # learnset overhaul and the 0.8.1 ability changes, and never showed hidden abilities)
    INCID = {p['id'] for p in P}
    SDIFF = collections.Counter(); SEX = collections.defaultdict(list)
    def abn(c):
        k = key(c[8:])
        return ATX[k]['name'] if k in ATX else hgsource.Src.title(c, 'ABILITY_')
    for p in P:
        const = 'SPECIES_' + p['id'].upper(); s = HG.S.get(const)
        if not isinstance(s, dict) or 'speciesData' not in s: report('not in the hack source, site data kept:', p['id']); continue
        sd = s['speciesData']; st = sd['baseStats']
        stats = [st['hp'], st['attack'], st['defense'], st['spAttack'], st['spDefense'], st['speed']]
        types = list(dict.fromkeys(c[5:].title() for c in sd['types']))
        ab = list(dict.fromkeys(abn(a) for a in sd['abilities'] if a != 'ABILITY_NONE'))
        ha = HG.HA.get(const); ha = abn(ha) if ha and ha != 'ABILITY_NONE' else None
        if ha in ab: ha = None
        if stats != p['s']: SDIFF['stats'] += 1; SEX['stats'].append('%s %s > %s' % (p['id'], p['s'], stats))
        if types != p['t']: SDIFF['types'] += 1; SEX['types'].append('%s %s > %s' % (p['id'], '/'.join(p['t']) or '?', '/'.join(types)))
        if [key(a) for a in ab] != [key(a) for a in dict.fromkeys(p['a_'])]: SDIFF['abilities'] += 1; SEX['abilities'].append('%s %s > %s' % (p['id'], '/'.join(dict.fromkeys(p['a_'])), '/'.join(ab)))
        if ha: SDIFF['hidden abilities (not on the site)'] += 1
        p['s'], p['t'], p['a_'], p['h_'] = stats, types, ab, ha
        L = HG.learnset(const)
        if L:
            lv = [[x['Level'], mi(HG.move(x['Move']))] for x in L.get('LevelMoves', [])]
            if lv != p['lv']: SDIFF['level-up moves'] += 1
            p['lv'] = lv
            for f_, k_ in (('MachineMoves', 'tm'), ('TutorMoves', 'tu'), ('EggMoves', 'eg')):
                new = list(dict.fromkeys(mi(HG.move(x)) for x in L.get(f_, [])))
                if sorted(new) != sorted(p[k_]): SDIFF[k_ + ' moves'] += 1
                p[k_] = new
        else: report('no learnset in the hack source, site moves kept:', p['id'])
        et = [[h, j] for h, j in EVO.get(p['id'], []) if j in INCID]
        ef = [[h, j] for h, j in REV.get(p['id'], []) if j in INCID]
        if sorted(x[1] for x in et) != sorted(x[1] for x in p['et'] if x[1]): SDIFF['evolutions'] += 1; SEX['evolutions'].append('%s > %s' % (p['id'], ', '.join(x[1] for x in et) or 'none'))
        p['et'], p['ef'] = et, ef
    report('changed from the dex site by the hack source:', dict(SDIFF))
    for k_ in ('types', 'stats', 'abilities', 'evolutions'):
        if SEX[k_]: report('  %s (%d): %s' % (k_, len(SEX[k_]), '; '.join(SEX[k_])))
    # drop Megas nobody can use: stone unavailable and no trainer uses them
    used = {p.get('f') for sp in SPLITS for s_ in sp['sec'] for t_ in s_['tr'] for p in t_['p']}
    drop = {p['id'] for p in P if p['g'] == 1 and p.get('nu') and p['id'] + '.html' not in used}
    P = [p for p in P if p['id'] not in drop]
    for p in P: p['of'] = [x for x in p['of'] if x not in drop]
    report('Megas dropped (stone unavailable, no trainer uses them):', ', '.join(sorted(drop)))
    byId = {p['id']: p for p in P}
    X.P, X.abn, X.byId = P, abn, byId
    D['P'] = P


def abilities(D):
    """AB: abilities with Showdown's text and the Mechanics.txt overrides."""
    P = X.P
    # abilities
    AB, ABI = [], {}
    ATX = SD['atext']
    def ai(n):
        n = n.strip()
        k = key(n)
        if k not in ABI:
            d = ATX.get(k)
            if not d:
                best = min(ATX, key=lambda s: lev(k, s)) if ATX else None
                if best and lev(k, best) <= 2: d = ATX[best]; report('ability fuzzy:', n, '>', d['name']); n = d['name']
            ABI[k] = len(AB); AB.append([d['name'] if d else n, (d or {}).get('shortDesc') or ''])
            if not d: report('ability without description:', n)
        return ABI[k]
    for p in P:
        p['a'] = [ai(a) for a in p.pop('a_')]; h = p.pop('h_', None); p['ha'] = ai(h) if h else -1
    # Mechanics.txt overrides Showdown's Gen 9 text (changelog 0.8.1: Protean as Gen 9, Libero stays Gen 8, Battle Bond no Sp. Atk)
    HLAB = {'protean': "This Pokemon's type changes to the type of the move it is using. Once per switch-in (Gen 9 behaviour, Hardlove Mechanics).",
            'libero': "This Pokemon's type changes to the type of the move it is using, before every move, not just once per switch-in (Gen 8 behaviour, Hardlove Mechanics).",
            'battlebond': 'After KOing a Pokemon: raises Attack and Speed by 1 stage (Hardlove Mechanics; no Sp. Atk boost).'}
    for k, d in HLAB.items(): AB[ai(ATX[k]['name'])][1] = d
    X.AB, X.ATX, X.ai = AB, ATX, ai
    D['AB'] = AB


def movetable(D):
    """MV: move data from the game (Moves.c) with the sheet's change notes."""
    FZM, HG, M, SDM, cname = X.FZM, X.HG, X.M, X.SDM, X.cname
    # ---------------------------------------------------------------- moves table
    MC = {s.name: s for s in xlsx.load(os.path.join(SRC, 'Move Changes.xlsx'))}['Move Changes']
    chg, eff = {}, {}
    for r, row in sorted(MC.rows().items()):
        if r == 1: continue
        if S(row.get(1)): chg[key(cname(S(row.get(1))))] = [S(row.get(c)) for c in range(2, 7)]
        if S(row.get(8)): eff[key(cname(S(row.get(8))))] = S(row.get(9))
    def nv(v):
        if v and v != 'None' and '>' in v: return v.split('>')[-1].strip()
        return None
    MV = []; SDT = SD['mtext']
    for name in M:
        k = key(name); s = SDM.get(k)
        o = {'t': s['type'], 'c': s['category'], 'bp': s['basePower'] or None, 'ac': None if s['accuracy'] is True else s['accuracy'], 'pp': s['pp'], 'pr': s['priority'] or 0,
             'd': (SDT.get(k) or {}).get('shortDesc') or (SDT.get(k) or {}).get('desc') or '', 'f': [], 'h': []} if s else {'t': '', 'c': '', 'bp': None, 'ac': None, 'pp': None, 'pr': 0, 'd': '', 'f': [], 'h': []}
        ch = chg.get(k)
        if ch:
            for i, (lab, v) in enumerate(zip(['Power', 'PP', 'Accuracy', 'Effect chance', 'Type'], ch)):
                if v and v != 'None':
                    o['h'].append(lab + ': ' + v.replace('>', '→'))
                    n = nv(v)
                    if n is not None:
                        num = re.sub(r'%$', '', n)
                        val = int(num) if re.fullmatch(r'\d+', num) else n
                        if i == 0: o['bp'] = val
                        if i == 1: o['pp'] = val
                        if i == 2: o['ac'] = val
                        if i == 4: o['t'] = n
        if k in eff: o['h'].append(eff[k])
        if k == key('Hidden Power'): o['bp'] = 60
        MV.append(o)
    # The game's own move data (Moves.c, config.h flags resolved: CHAMPIONS_* changes are on) wins. Notes say where the sheet
    # disagrees and which differences from Gen 9 the sheet doesn't list.
    GMV = {key(v['names']['name']): v for v in HG.MV.values()}
    SPLIT = {'SPLIT_PHYSICAL': 'Physical', 'SPLIT_SPECIAL': 'Special', 'SPLIT_STATUS': 'Status'}
    MVSTAT = collections.Counter(); MVX = []
    for i, name in enumerate(M):
        o = MV[i]; g = GMV.get(key(name)); s = SDM.get(key(name))
        if not g: MVSTAT['not in the game data'] += 1; report('move not in the game data:', name); continue
        d, b = g['data'], g['battle']
        o['f'] = hgengine.move_flags(g, s or {})
        bp = HG.cfg(d['power']); ac = HG.cfg(d['accuracy']); pp = HG.cfg(d['pp'])
        gv = {'t': d['type'][5:].title(), 'c': SPLIT.get(d['split'], d['split']), 'bp': (None if bp in (0, 1) else bp), 'ac': (None if ac == 0 else ac), 'pp': pp, 'pr': HG.cfg(b['priority'])}
        if s and s['basePower'] and bp == 1: gv['bp'] = s['basePower']   # 1 marks variable power only when Showdown agrees
        sheet = {'t': o['t'], 'c': o['c'], 'bp': o['bp'], 'ac': o['ac'], 'pp': o['pp'], 'pr': o['pr']}
        sd = {'t': s['type'], 'c': s['category'], 'bp': s['basePower'] or None, 'ac': None if s['accuracy'] is True else s['accuracy'], 'pp': s['pp'], 'pr': s['priority'] or 0} if s else {}
        lab = {'t': 'Type', 'c': 'Category', 'bp': 'Power', 'ac': 'Accuracy', 'pp': 'PP', 'pr': 'Priority'}
        shw = lambda k_, v: ('never misses' if v is None else '%s%%' % v) if k_ == 'ac' else ('varies' if v is None and k_ == 'bp' else str(v))
        bad = [k_ for k_ in gv if str(gv[k_]) != str(sheet[k_]) and str(sheet[k_]) != str(sd.get(k_))]
        if bad: o['h'].append('The sheet says %s; the game data has %s.' % (', '.join('%s %s' % (lab[k_], shw(k_, sheet[k_])) for k_ in bad), ', '.join(shw(k_, gv[k_]) for k_ in bad))); MVSTAT['sheet disagrees with the game'] += 1; MVX.append(name + ' ' + '/'.join(bad))
        extra = [k_ for k_ in gv if sd and str(gv[k_]) != str(sd.get(k_)) and str(sheet[k_]) == str(sd.get(k_))]
        if extra: o['h'].append('Not in the Move Changes sheet: %s (game data vs standard Gen 9).' % '; '.join('%s %s → %s' % (lab[k_], shw(k_, sd[k_]), shw(k_, gv[k_])) for k_ in extra)); MVSTAT['changed in game, not in the sheet'] += 1
        o.update(gv)
    report('moves vs the game data:', dict(MVSTAT), '; sheet values the game contradicts:', ', '.join(MVX))
    applied = sum(1 for k in list(chg) + list(eff) if k in {key(m) for m in M})
    report('move changes in the sheet:', len(chg) + len(eff), 'on moves in the data:', applied, '; not learned or used by anyone:', ', '.join(sorted({k for k in list(chg) + list(eff)} - {key(m) for m in M})))
    report('move names fuzzy-matched:', '; '.join(sorted(FZM)))
    D['MV'] = MV


def types(D):
    """TC: the type chart."""
    # ---------------------------------------------------------------- type chart (Gen 6+; Mechanics: "assume Gen9")
    TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']
    CH = {'Normal': {'Rock': 5, 'Ghost': 0, 'Steel': 5}, 'Fire': {'Fire': 5, 'Water': 5, 'Grass': 20, 'Ice': 20, 'Bug': 20, 'Rock': 5, 'Dragon': 5, 'Steel': 20},
          'Water': {'Fire': 20, 'Water': 5, 'Grass': 5, 'Ground': 20, 'Rock': 20, 'Dragon': 5}, 'Electric': {'Water': 20, 'Electric': 5, 'Grass': 5, 'Ground': 0, 'Flying': 20, 'Dragon': 5},
          'Grass': {'Fire': 5, 'Water': 20, 'Grass': 5, 'Poison': 5, 'Ground': 20, 'Flying': 5, 'Bug': 5, 'Rock': 20, 'Dragon': 5, 'Steel': 5},
          'Ice': {'Fire': 5, 'Water': 5, 'Grass': 20, 'Ice': 5, 'Ground': 20, 'Flying': 20, 'Dragon': 20, 'Steel': 5},
          'Fighting': {'Normal': 20, 'Ice': 20, 'Poison': 5, 'Flying': 5, 'Psychic': 5, 'Bug': 5, 'Rock': 20, 'Ghost': 0, 'Dark': 20, 'Steel': 20, 'Fairy': 5},
          'Poison': {'Grass': 20, 'Poison': 5, 'Ground': 5, 'Rock': 5, 'Ghost': 5, 'Steel': 0, 'Fairy': 20}, 'Ground': {'Fire': 20, 'Electric': 20, 'Grass': 5, 'Poison': 20, 'Flying': 0, 'Bug': 5, 'Rock': 20, 'Steel': 20},
          'Flying': {'Electric': 5, 'Grass': 20, 'Fighting': 20, 'Bug': 20, 'Rock': 5, 'Steel': 5}, 'Psychic': {'Fighting': 20, 'Poison': 20, 'Psychic': 5, 'Dark': 0, 'Steel': 5},
          'Bug': {'Fire': 5, 'Grass': 20, 'Fighting': 5, 'Poison': 5, 'Flying': 5, 'Psychic': 20, 'Ghost': 5, 'Dark': 20, 'Steel': 5, 'Fairy': 5},
          'Rock': {'Fire': 20, 'Ice': 20, 'Fighting': 5, 'Ground': 5, 'Flying': 20, 'Bug': 20, 'Steel': 5}, 'Ghost': {'Normal': 0, 'Psychic': 20, 'Ghost': 20, 'Dark': 5},
          'Dragon': {'Dragon': 20, 'Steel': 5, 'Fairy': 0}, 'Dark': {'Fighting': 5, 'Psychic': 20, 'Ghost': 20, 'Dark': 5, 'Fairy': 5},
          'Steel': {'Fire': 5, 'Water': 5, 'Electric': 5, 'Ice': 20, 'Rock': 20, 'Steel': 5, 'Fairy': 20}, 'Fairy': {'Fire': 5, 'Fighting': 20, 'Poison': 5, 'Dragon': 20, 'Dark': 20, 'Steel': 5}}
    TC = {a: {d: CH[a].get(d, 10) for d in TYPES} for a in TYPES}
    D['TC'] = TC

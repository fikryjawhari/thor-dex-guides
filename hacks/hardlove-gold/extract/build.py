"""Hardlove Gold offline dex: data builder (stdlib only).
Usage: python build.py <docs/hardlove-gold> <work dir with sd.json, calc.json, old_data.json, old_spr.json> <out dir>
Writes data.json, spr.json and report.txt to <out dir>. See the notes comment in the guide for the rules."""
import sys, os, re, json, html, unicodedata, collections
sys.path.insert(0, os.path.dirname(__file__))
import xl, dex, png

SRC, WORK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
sys.stdout.reconfigure(encoding='utf-8')
REP = []
def rep(*a): REP.append(' '.join(str(x) for x in a))

def key(s):
    s = unicodedata.normalize('NFD', str(s).lower())
    s = ''.join(c for c in s if not unicodedata.combining(c)).replace('♀', 'f').replace('♂', 'm')
    return re.sub(r'[^a-z0-9]', '', s)
def lev(a, b):
    if abs(len(a) - len(b)) > 3: return 9
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        p = d[0]; d[0] = i
        for j in range(1, len(b) + 1):
            t = d[j]; d[j] = min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] != b[j - 1])); p = t
    return d[len(b)]
def S(v): return '' if v is None else str(v).strip()

SD = json.load(open(os.path.join(WORK, 'sd.json'), encoding='utf-8'))
CALC = json.load(open(os.path.join(WORK, 'calc.json'), encoding='utf-8'))
OLD = json.load(open(os.path.join(WORK, 'old_data.json'), encoding='utf-8'))
OLDSPR = json.load(open(os.path.join(WORK, 'old_spr.json'), encoding='utf-8'))
OLDP = {p['id']: p for p in OLD['P']}

# ---------------------------------------------------------------- dex site
import re as _re
idx = open(os.path.join(SRC, 'site/pokedex/index.html'), encoding='utf-8').read()
ORDER = [x[2:] for x in _re.findall(r"href='(\./[^']+\.html)'", idx)]
F = {o['f']: o for o in dex.load(os.path.join(SRC, 'site/pokedex'))}
for f in F:
    if f not in ORDER: ORDER.append(f); rep('dex page not in index:', f)
fid = lambda f: f[:-5]
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

# ---------------------------------------------------------------- Pokemon Locations sheet
LS = {s.name: s for s in xl.load(os.path.join(SRC, 'Pokemon Locations.xlsx'))}
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
def note1(t): return re.sub(r'\s+', ' ', t).strip()
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
        else: rep('pool name not matched:', nm)
gc = tab(LS, 'Game Corner')
for r, row in sorted(gc.rows().items()):
    lv = S(row.get(2))
    if not re.fullmatch(r'\d+', lv): continue
    opts = [x.strip() for x in S(row.get(3)).split(',') if x.strip()]
    for n in opts:
        f = match(n)
        if f: add(f, [loc('Goldenrod City'), 'Game Corner prize', '1 of %d' % len(opts), lv, 'Unlocked with the %s Badge' % S(row.get(1))])
        else: rep('game corner not matched:', n)
GCNOTE = S(gc.v(1, 1))
trd = tab(LS, 'Trades')
for r, row in sorted(trd.rows().items()):
    if r <= 2 or not S(row.get(2)): continue
    for n in re.split(r',| or ', S(row.get(3))):
        f = match(n.strip())
        if f: add(f, [loc(S(row.get(2))), 'Trade', '', '', 'For ' + S(row.get(1))])
        else: rep('trade not matched:', n)
# the player's starter choice (Mechanics.txt "Starter Choice" table: Turtwig, Litten, Froakie) is in no location tab
MECH = open(os.path.join(SRC, 'Mechanics.txt'), encoding='utf-8-sig').read()
STARTERS = re.findall(r'^(\w+)\s{2,}\S', MECH.split('Starter Choice', 1)[1].split('Level Cap', 1)[0], re.M)
for n in STARTERS:
    f = match(n)
    if f: add(f, [loc('New Bark Town'), 'Starter choice', '1 of %d' % len(STARTERS), '5', 'Your starter; the choice also decides some gifts and trades (Mechanics)'])
    else: rep('starter not matched:', n)
rep('starters:', STARTERS)
# "Starter: X" conditions in notes, with typos fixed (Turtig)
def fixstarter(t):
    def f(m):
        out = []
        for x in m.group(2).split(','):
            x = x.strip(); b = min(STARTERS, key=lambda z: lev(key(x), key(z)))
            if lev(key(x), key(b)) <= 2 and b != x: rep('starter name fixed:', x, '>', b); x = b
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
            elif x.strip(): rep('unavailable not matched:', x.strip())
base = set(FIND); OBT = set(base); q = list(base)
while q:
    f = q.pop()
    for k in ('Evolves From', 'Evolves To'):
        for e in F[f]['sec'].get(k, []):
            l = e['l']
            if l and l in F and l not in OBT and l not in un: OBT.add(l); q.append(l)
clash = sorted(fid(f) for f in base & un)
if clash: rep('in the location tables AND on the unavailable list (kept):', ', '.join(clash))
rep('obtainable', len(OBT), 'locations', len(LOC))

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
        else: rep('move not in Showdown:', x)
    CANON[k] = r; return r
M, MI = [], {}
def mi(x):
    n = cname(x)
    if n not in MI: MI[n] = len(M); M.append(n)
    return MI[n]

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

# Trainer sheet first pass (needed to know which Megas / trainer-only species exist)
ATX = SD['atext']
TAGRE = re.compile(r'\s*\[([^\]]+)\]')
TB = xl.load(os.path.join(SRC, 'Trainer Battles.xlsx'))
TT = ['Falkner Split', 'Bugsy Split', 'Whitney Split', 'Morty Split', 'Chuck Split', 'Jasmine Split', 'Pryce Split', 'Clair Split', 'Victory Road', 'Elite Four', 'Mini Bosses']
TBS = {s.name: s for s in TB}
FIELDS = ['Pokémon', 'Level', 'Ability', 'Held Item', 'Nature', 'Moves']
SPLITS = []
for tn in TT:
    sh = TBS[tn]; R = sh.rows(); split = {'n': tn, 'sec': [], 'note': []}; sec = None; tr = None; field = ''; mv = 0
    def newsec(h, r):
        global sec
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
rep('trainer species fuzzy-matched:', '; '.join(sorted(FZ)))
if UNT: rep('trainer species NOT matched:', '; '.join(sorted(UNT)))

# Mega Stones sheet -> stone per Mega
IL = {s.name: s for s in xl.load(os.path.join(SRC, 'Item Location.xlsx'))}
MS = []  # [stone, location]
for r, row in sorted(IL['Mega Stones'].rows().items()):
    if r == 1 or not S(row.get(1)): continue
    MS.append([S(row.get(1)), S(row.get(2))])

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
rep('Z-A Megas from Showdown:', ', '.join(sorted(need)))
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
                if 'zam' in p: rep('trainer -M species unresolved:', p['s'], p.get('i')); continue
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
import src as srcmod
HG = srcmod.Src(os.path.join(SRC, 'repos/hardlove'))
rep('hack source: kumakuma1/hardlove at', HG.commit)
SPN = {k: v['textData']['name'] for k, v in HG.S.items() if isinstance(v, dict) and 'textData' in v}
def evo_text(m, prm):
    it = lambda c: srcmod.Src.title(c, 'ITEM_')
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
    rep('evolution method not described:', m, prm); return m.lower().replace('_', ' ') + (' ' + str(prm) if prm else '')
EVO = collections.defaultdict(list)   # site id -> [(how, target site id)]
for k, v in HG.EV.items():
    if not isinstance(v, dict): continue
    for e in v.get('entries', []):
        if not isinstance(e, list) or e[0] == 'EVO_NONE': continue
        tgt = HG.species(e[2] if len(e) < 4 else 'MON_WITH_FORM ( %s , %s )' % (e[2], e[3]))
        EVO[HG.sid(k)].append((evo_text(e[0], e[1]), HG.sid(tgt)))
# wild tables: the locations sheet against the game's Encounters.c. Where they differ, the game's table replaces the
# sheet's rows for that location (Land, Surf, Rock Smash, Fishing = Old Rod; Good/Super Rod tables are placeholders).
import encv
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
    t, dd = encv.compare(ln, {m: {k_: (int(v) if v == int(v) else v) for k_, v in r.items()} for m, r in SHEETW[ln].items()}, HG.ENC, SIDG)
    if not dd: continue
    ENCDIFF[ln] = dd; rep('wild table %s (%s): %s' % (ln, t, ' | '.join(dd)))
    if t is None:
        for ws in FIND.values():
            for w in ws:
                if w[0] == li and w[1] in WM: w[4] = (w[4] + ' ' if w[4] else '') + "Not in the game's wild data (0.8.3 source), so the sheet may be out of date."
        continue
    if all('time of day' in x for x in dd): continue
    g = encv.game_rates(HG.ENC[t], SIDG, encv.TOD.get(ln, 'speciesDay'))
    for f in list(FIND):
        FIND[f] = [w for w in FIND[f] if not (w[0] == li and w[1] in WM)]
    for m, rows in g.items():
        mm = 'Fishing' if m.endswith('Rod') else m
        if m in ('goodRod', 'superRod') or (mm == 'Surf' and set(rows) <= {'goldeen'}): continue
        for i, (r, lvs) in rows.items():
            f = i + '.html'
            if f not in F: rep('game wild species without a page:', ln, i); continue
            add(f, [li, mm, '%s%%' % r, '-'.join(str(x) for x in sorted({min(lvs), max(lvs)})), ''])
            if f not in OBT and f not in un: OBT.add(f); rep("obtainable from the game's wild data:", i)
    PATCHED.append(ln)
rep('wild tables checked against the game:', len(SHEETW), 'locations,', len(ENCDIFF), 'with differences; replaced from the game:', ', '.join(PATCHED))
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
if added: rep('obtainable through the game\'s evolutions (not the site\'s):', ', '.join(sorted(added)))
TRONLY -= OBT
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
                if g in F and g not in OBT and g not in MEGAS and g not in TRONLY: TRONLY.add(g); rep('trainer-only species from the game sets:', fid(g))
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
    if f not in order2: order2.append(f); rep('placed at the end:', f)
INCL = order2; INC = set(INCL)
TYPEFIX = []
for f in INCL:
    o = F[f]; i = fid(f)
    t = o['t']
    if not t:
        cp = CALC['poks'].get(i) or CALC['poks'].get(i.replace('_', ''))
        if cp: t = cp['types']; TYPEFIX.append(i + ' (calc)')
        elif i in OLDP: t = OLDP[i]['t']; TYPEFIX.append(i + ' (previous build)')
        else: rep('NO TYPES for', i)
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
        else: rep('no stone found for', i)
        if not st_ or re.match(r'^unavailable', lc or '', re.I): p['nu'] = 1
    P.append(p)
rep('types filled:', ', '.join(TYPEFIX))
# Species data from the hack's source replaces the dex site's (the site was last rebuilt 2026-10-02, before the 0.8.0
# learnset overhaul and the 0.8.1 ability changes, and never showed hidden abilities)
INCID = {p['id'] for p in P}
SDIFF = collections.Counter(); SEX = collections.defaultdict(list)
def abn(c):
    k = key(c[8:])
    return ATX[k]['name'] if k in ATX else srcmod.Src.title(c, 'ABILITY_')
for p in P:
    const = 'SPECIES_' + p['id'].upper(); s = HG.S.get(const)
    if not isinstance(s, dict) or 'speciesData' not in s: rep('not in the hack source, site data kept:', p['id']); continue
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
    else: rep('no learnset in the hack source, site moves kept:', p['id'])
    et = [[h, j] for h, j in EVO.get(p['id'], []) if j in INCID]
    ef = [[h, j] for h, j in REV.get(p['id'], []) if j in INCID]
    if sorted(x[1] for x in et) != sorted(x[1] for x in p['et'] if x[1]): SDIFF['evolutions'] += 1; SEX['evolutions'].append('%s > %s' % (p['id'], ', '.join(x[1] for x in et) or 'none'))
    p['et'], p['ef'] = et, ef
rep('changed from the dex site by the hack source:', dict(SDIFF))
for k_ in ('types', 'stats', 'abilities', 'evolutions'):
    if SEX[k_]: rep('  %s (%d): %s' % (k_, len(SEX[k_]), '; '.join(SEX[k_])))
# drop Megas nobody can use: stone unavailable and no trainer uses them
used = {p.get('f') for sp in SPLITS for s_ in sp['sec'] for t_ in s_['tr'] for p in t_['p']}
drop = {p['id'] for p in P if p['g'] == 1 and p.get('nu') and p['id'] + '.html' not in used}
P = [p for p in P if p['id'] not in drop]
for p in P: p['of'] = [x for x in p['of'] if x not in drop]
rep('Megas dropped (stone unavailable, no trainer uses them):', ', '.join(sorted(drop)))
byId = {p['id']: p for p in P}

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
            if best and lev(k, best) <= 2: d = ATX[best]; rep('ability fuzzy:', n, '>', d['name']); n = d['name']
        ABI[k] = len(AB); AB.append([d['name'] if d else n, (d or {}).get('shortDesc') or ''])
        if not d: rep('ability without description:', n)
    return ABI[k]
for p in P:
    p['a'] = [ai(a) for a in p.pop('a_')]; h = p.pop('h_', None); p['ha'] = ai(h) if h else -1
# Mechanics.txt overrides Showdown's Gen 9 text (changelog 0.8.1: Protean as Gen 9, Libero stays Gen 8, Battle Bond no Sp. Atk)
HLAB = {'protean': "This Pokemon's type changes to the type of the move it is using. Once per switch-in (Gen 9 behaviour, Hardlove Mechanics).",
        'libero': "This Pokemon's type changes to the type of the move it is using, before every move, not just once per switch-in (Gen 8 behaviour, Hardlove Mechanics).",
        'battlebond': 'After KOing a Pokemon: raises Attack and Speed by 1 stage (Hardlove Mechanics; no Sp. Atk boost).'}
for k, d in HLAB.items(): AB[ai(ATX[k]['name'])][1] = d

# ---------------------------------------------------------------- trainers -> EI schema
CAPS = []  # from Mechanics.txt
mech = open(os.path.join(SRC, 'Mechanics.txt'), encoding='utf-8-sig').read()
for m in re.finditer(r'^(.+?)\s+lvl (\d+)\s*$', mech, re.M): CAPS.append([m.group(1).strip(), int(m.group(2))])
NATS = {'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'}
G = []; TRFIX = []; TRSTAT = collections.Counter(); TRCF = []
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
            gp = [m_ for m_ in (GT or {}).get('party', []) if isinstance(m_, dict)]
            if GT is None: TRSTAT['trainer not in the game data'] += 1; rep('trainer not in the game data:', name, t_['id'])
            elif not name_ok(name, GT.get('name', '')): rep('trainer id %s: sheet "%s", game "%s"' % (t_['id'], name, GT.get('name')))
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
                    if GT is not None: rep('no game set for', name, p['s'])
                    T['p'].append(x); continue
                TRSTAT['game set'] += 1
                gid = HG.sid(HG.species(gm['species']))
                g_it = '' if gm.get('item', 'ITEM_NONE') == 'ITEM_NONE' else srcmod.Src.title(gm['item'], 'ITEM_')
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
                else: shown = sid or gid; rep('game species without a page:', name, gid)
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
                if g_ab and abl and key(g_ab) not in [key(AB[ai(a_)][0]) for a_ in abl]: cf.append('ability ' + ' / '.join(abl))
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
                TRSTAT['game Pokemon missing from the sheet'] += 1; rep('in the game but not the sheet:', name, gid, 'Lv', g_['level'])
            sec['tr'].append(T)
        g['sec'].append(sec)
    G.append(g)
rep('trainer sets:', dict(TRSTAT))
for x in TRCF: rep('  ' + x)
if TRFIX: rep('trainer fixes:', '; '.join(TRFIX))
TRD = {'caps': CAPS, 'fix': sorted(FZ) + TRFIX, 'g': G}

# ---------------------------------------------------------------- moves table
MC = {s.name: s for s in xl.load(os.path.join(SRC, 'Move Changes.xlsx'))}['Move Changes']
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
    if not g: MVSTAT['not in the game data'] += 1; rep('move not in the game data:', name); continue
    d, b = g['data'], g['battle']
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
rep('moves vs the game data:', dict(MVSTAT), '; sheet values the game contradicts:', ', '.join(MVX))
applied = sum(1 for k in list(chg) + list(eff) if k in {key(m) for m in M})
rep('move changes in the sheet:', len(chg) + len(eff), 'on moves in the data:', applied, '; not learned or used by anyone:', ', '.join(sorted({k for k in list(chg) + list(eff)} - {key(m) for m in M})))
rep('move names fuzzy-matched:', '; '.join(sorted(FZM)))

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
rep('TM/HM fixes from the game:', '; '.join(TMFIX))
IT += [{'n': 'TMs', 'k': 'tm', 'note': 'TMs are consumed on use (Mechanics).', 'r': tms}, {'n': 'HMs', 'k': 'tm', 'note': 'HMs do not need to be taught: having the HM and the badge is enough.', 'r': hms},
       {'n': 'Move Tutors', 'k': 'tm', 'note': '', 'r': tus}]
sh = IL['Evolution Items']
IT.append({'n': 'Evolution Items', 'k': 'gen', 'note': note1(S(sh.v(1, 1))), 'r': [[S(r.get(1)), S(r.get(2)), None, miss(S(r.get(2)))] for n, r in rows_(sh) if n > 2 and S(r.get(1))]})
megaByStone = {key(p['stone']): p['id'] for p in P if p.get('stone')}
IT.append({'n': 'Mega Stones', 'k': 'mega', 'note': '', 'r': [[a, b, megaByStone.get(key(a)), miss(b)] for a, b in MS]})
sh = IL['Other']
IT.append({'n': 'Other', 'k': 'gen', 'note': '', 'r': [[S(r.get(1)), S(r.get(2)), None, miss(S(r.get(2)))] for n, r in rows_(sh) if n > 1 and S(r.get(1))]})
nolink = [r[0] for r in IT[-2]['r'] if r[2] is None and not re.match(r'^unavailable', r[1], re.I)]
if nolink: rep('mega stones with a location but no Mega page:', ', '.join(nolink))

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
ko = {s.name: s for s in xl.load(os.path.join(SRC, 'Post-KO Switch-in AI.xlsx'))}['Switch Scores']
KO = [[S(r.get(1)), S(r.get(2))] for n, r in rows_(ko) if S(r.get(1)) or S(r.get(2))]
KONOTE = [note1(t) for t in ko.notes.values()]
WK['docs'] = [['Mechanics', re.sub(r'^-+\s*\nMechanic Changes\s*\n-+\s*', '', txt('Mechanics.txt'))], ['Trainer AI (work in progress)', txt('Hardlove Gold AI document_WIP.txt')]]
WK['ko'] = {'rows': KO, 'note': KONOTE}
WK['gc'] = GCNOTE

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

# ---------------------------------------------------------------- sprites: left 80x80 frame of the site's 160x80 sheets, trimmed to a
# square around the visible pixels (small Pokemon filled a quarter of the 80x80 frame and looked tiny in 40px rows)
SPR = {}; nospr = []
for p in P:
    path = os.path.join(SRC, 'site/pokedex/sprites', p['id'] + '.png')
    raw = None
    alt = os.path.join(SRC, 'repos/sprites', p['id'] + '.png')
    if os.path.exists(path) and os.path.getsize(path) not in (0, 765): raw = open(path, 'rb').read()
    elif os.path.exists(alt): raw = open(alt, 'rb').read()
    elif p['id'] in OLDSPR and len(OLDSPR[p['id']]) > 40:
        import base64; raw = base64.b64decode(OLDSPR[p['id']].split(',', 1)[1])
    if raw is None:
        bid = re.sub(r'^mega_|_[xyz]$', '', p['id']); bp = os.path.join(SRC, 'site/pokedex/sprites', bid + '.png')
        if os.path.exists(bp) and os.path.getsize(bp) not in (0, 765): raw = open(bp, 'rb').read(); nospr.append(p['id'] + ' (base sprite)')
    if raw is None: nospr.append(p['id']); SPR[p['id']] = ''; continue
    try:
        im = png.decode(raw)
        if im['w'] == 2 * im['h']: im = png.crop(im, 0, 0, im['h'], im['h'])
        im = png.trim_square(im)
        out = png.encode(im)
    except Exception as e:
        rep('sprite left as is:', p['id'], e); out = raw
    import base64
    SPR[p['id']] = 'data:image/png;base64,' + base64.b64encode(out).decode()
if nospr: rep('sprites missing or borrowed:', ', '.join(nospr))

import datetime
D = {'M': M, 'MV': MV, 'AB': AB, 'P': P, 'LOC': LOC, 'AR': AR, 'IT': IT, 'WK': WK, 'TR': TRD, 'TC': TC, 'built': datetime.date.today().isoformat()}
os.makedirs(OUT, exist_ok=True)
json.dump(D, open(os.path.join(OUT, 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(SPR, open(os.path.join(OUT, 'spr.json'), 'w'), separators=(',', ':'))
rep('P', len(P), 'obtainable', sum(1 for p in P if p['g'] == 0), 'megas', sum(1 for p in P if p['g'] == 1), 'trainer only', sum(1 for p in P if p['g'] == 3),
    'moves', len(M), 'abilities', len(AB), 'trainers', sum(len(s['tr']) for g in G for s in g['sec']), 'areas', len(AR), 'stops', sum(len(s['st']) for s in WK['splits']), 'unplaced items', len(NP))
open(os.path.join(OUT, 'report.txt'), 'w', encoding='utf-8').write('\n'.join(REP) + '\n')
print('\n'.join(REP))

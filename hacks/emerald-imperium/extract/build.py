# Emerald Imperium offline dex: data builder (batch 1, Pokemon tab).
# Inputs: github.com/miriamlefae/eidex (the source of dex.emeraldimperium.net, data dated Mar 2026),
#         src/data/*.json + public/sprites/front/<speciesId>.png, and pokemon-showdown npm (move priority only).
# Output: data.json (the #data block) and spr.json (the #spr block).
import json, io, os, re, base64, datetime
from PIL import Image

R = '/home/claude/ei/miriamlefae_eidex/eidex-HEAD'
J = lambda f: json.load(open(f'{R}/src/data/{f}.json'))
S, MD, AD, ID, TD = J('speciesData'), J('moveData'), J('abilityData'), J('itemData'), J('typeData')
LBL, WE = J('speciesLabelMap'), J('wild_encounters')['wild_encounter_groups']
SD = json.load(open('/home/claude/ei/sdmoves.json')); SDA = json.load(open('/home/claude/ei/sdab.json'))
key = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
TN = {int(k): v['typeName'] for k, v in TD.items()}
item = lambda i: ID.get(str(i), {}).get('Name', f'item {i}')
log = []

# ---------- 1. choose which species/forms to keep
BANNED = {'totem', 'gigantamax', 'tera'}
sp = {int(k): v for k, v in S.items()}
cand = [v for v in sp.values() if not (set(v['forms'] or []) & BANNED)]
# collapse cosmetic forms: same dex number + identical types, stats, abilities and level-up moves -> keep lowest id
sig = {}; alias = {}
for v in sorted(cand, key=lambda v: v['speciesId']):
    k = (v['dexId'], tuple(v['types']), tuple(v['stats']), tuple(v['abilities']), tuple(map(tuple, v['levelUpMoves'])))
    if k in sig: alias[v['speciesId']] = sig[k]
    else: sig[k] = v['speciesId']
keep = {v['speciesId'] for v in cand if v['speciesId'] not in alias}
canon = lambda i: alias.get(i, i)
log.append(f'species {len(sp)}, banned forms {len(sp)-len(cand)}, cosmetic duplicates folded {len(alias)}, kept {len(keep)}')

# ---------- 2. display names
REG = {'Alola': 'Alolan', 'Galar': 'Galarian', 'Hisui': 'Hisuian', 'Paldea': 'Paldean'}
def disp(v):
    n, k = v['speciesName'], v['nameKey']
    forms = v['forms'] or []
    base_k = sp.get(v['dexId'], {}).get('nameKey', '')
    suf = k[len(base_k):].lstrip('-') if k.startswith(base_k) and k != base_k else ''
    if not suf:
        m = re.match(r'^[^-]+(?:-(?:Oh|Z|Jr|Mime|O|Koko|Lele|Bulu|Fini|Chien|Pao|Lu|Yu))?-(.*)$', k)
        suf = m.group(1) if (m and v['formId']) else ''
    if 'mega' in forms:
        x = re.sub(r'^Mega-?', '', suf)
        return f'Mega {n}' + (f' {x}' if x else '')
    if 'primal' in forms: return f'Primal {n}'
    parts = suf.split('-') if suf else []
    if parts and parts[0] in REG:
        rest = ' '.join(parts[1:])
        return f'{REG[parts[0]]} {n}' + (f' ({rest})' if rest else '')
    if suf and v['formId']:
        suf = {'M': 'Male', 'F': 'Female', 'Phd': 'PhD'}.get(suf, suf)
        return f'{n} ({suf.replace("-", " ")})'
    return n
# base forms with a form suffix (Lycanroc-Midday, Toxtricity-Amped) get it shown when another form is kept
dexcount = {}
for i in keep: dexcount[sp[i]['dexId']] = dexcount.get(sp[i]['dexId'], 0) + 1
NAME = {}
for i in keep:
    v = sp[i]; n = disp(v)
    if not v['formId'] and dexcount[v['dexId']] > 1 and '-' in v['nameKey'] and v['nameKey'] not in ('Nidoran-F','Nidoran-M','Mr-Mime','Mime-Jr','Ho-Oh','Porygon-Z','Jangmo-O','Hakamo-O','Kommo-O','Wo-Chien','Chien-Pao','Ting-Lu','Chi-Yu') and not v['nameKey'].startswith('Tapu'):
        x = v['nameKey'].split('-',1)[1]; x = {'M': 'Male', 'F': 'Female'}.get(x, x)
        n = f"{v['speciesName']} ({x.replace('-', ' ')})"
    NAME[i] = n

# ---------- 3. evolutions in plain words (codes from the dex site's parseEvo.ts)
mvname = lambda i: MD.get(str(i), {}).get('name', f'move {i}')
spname = lambda i: NAME.get(canon(i), sp.get(i, {}).get('speciesName', f'#{i}'))
EVO = {
 1: lambda p: 'level up with high friendship', 2: lambda p: 'level up with high friendship during the day',
 3: lambda p: 'level up with high friendship at night', 4: lambda p: f'level {p}', 5: lambda p: 'trade',
 6: lambda p: f'trade while holding {item(p)}', 7: lambda p: f'use {item(p)}',
 8: lambda p: f'level {p} with Attack higher than Defense', 9: lambda p: f'level {p} with Attack equal to Defense',
 10: lambda p: f'level {p} with Attack lower than Defense', 11: lambda p: f'level {p} (personality value decides)',
 12: lambda p: f'level {p} (personality value decides)', 13: lambda p: f'level {p}',
 14: lambda p: f'level {p} with a spare party slot and a Poké Ball', 15: lambda p: f'level up with Beauty {p} or higher',
 16: lambda p: f'level {p} (female)', 17: lambda p: f'level {p} (male)', 18: lambda p: f'level {p} at night',
 19: lambda p: f'level {p} during the day', 20: lambda p: f'level {p} at dusk',
 21: lambda p: f'level up holding {item(p)} during the day', 22: lambda p: f'level up holding {item(p)} at night',
 23: lambda p: f'level up knowing {mvname(p)}', 24: lambda p: f'level up with high friendship knowing a {TN.get(p, "?")}-type move',
 25: lambda p: 'level up at a special location', 26: lambda p: f'use {item(p)} (male)', 27: lambda p: f'use {item(p)} (female)',
 28: lambda p: f'level {p} while it rains in the overworld', 29: lambda p: f'level up with {spname(p)} in the party',
 30: lambda p: f'level {p} with a Dark type in the party', 31: lambda p: f'trade for {spname(p)}',
 32: lambda p: 'level up at a special location', 33: lambda p: f'level {p} with an Amped nature',
 34: lambda p: f'level {p} with a Low Key nature', 35: lambda p: f'land {p} critical hits in one battle',
 42: lambda p: f'level {p} in overworld fog', 43: lambda p: f'level up knowing {mvname(p)} (rare 1 in 100 form)',
 44: lambda p: f'level up knowing {mvname(p)}', 45: lambda p: f'level {p} (rare 1 in 100 form)', 46: lambda p: f'level {p}',
}
ET = {i: [] for i in keep}; EF = {i: [] for i in keep}; unk = set()
for i in keep:
    for m, t, p in sp[i]['evolutions'] or []:
        if m == 0: continue
        t = canon(t)
        if t not in keep: continue
        how = EVO[m](p) if m in EVO else (unk.add(m) or f'method {m}')
        if [how, t] not in ET[i]: ET[i].append([how, t])
        if [how, i] not in EF[t]: EF[t].append([how, i])
if unk: log.append(f'unknown evo methods {unk}')

# ---------- 4. wild encounters
def locname(m):
    m = m.replace('MAP_', '')
    m = re.sub(r'^ROUTE110_TRICK_HOUSE_PUZZLE(\d)', r'TRICK_HOUSE_PUZZLE_\1', m)
    m = re.sub(r'^UNDERWATER_(ROUTE\d+)', r'\1_UNDERWATER', m)
    m = re.sub(r'ROUTE(\d+)', r'ROUTE_\1', m)
    out = []
    for w in m.split('_'):
        if re.fullmatch(r'B?\d+F|\d+R', w): out.append(w)
        elif w == 'MT': out.append('Mt.')
        elif w.isdigit(): out.append(w)
        else: out.append(w.capitalize())
    s = ' '.join(out)
    s = re.sub(r'Room(\d)', r'Room \1', s).replace(' Of ', ' of ').replace('Stevens', "Steven's")
    return re.sub(r' (\d)R$', r' Room \1', s)
ORDER = ['ROUTE101','ROUTE103','ROUTE102','PETALBURG_CITY','ROUTE104','PETALBURG_WOODS','RUSTBORO_CITY','ROUTE116','RUSTURF_TUNNEL',
 'DEWFORD_TOWN','ROUTE105','ROUTE106','GRANITE_CAVE','ROUTE107','ROUTE108','ABANDONED_SHIP','ROUTE109','SLATEPORT_CITY','ROUTE110_TRICK','ROUTE110','ROUTE117','ROUTE111',
 'ROUTE112','FIERY_PATH','ROUTE113','ROUTE114','METEOR_FALLS','ROUTE115','JAGGED_PASS','NEW_MAUVILLE','MIRAGE_TOWER','DESERT_UNDERPASS',
 'ROUTE118','ROUTE119','ROUTE120','ROUTE121','SAFARI_ZONE','ROUTE122','MT_PYRE','ROUTE123','LILYCOVE_CITY','MAGMA_HIDEOUT','ROUTE124',
 'UNDERWATER_ROUTE124','MOSSDEEP_CITY','ROUTE125','SHOAL_CAVE','ROUTE126','UNDERWATER_ROUTE126','SOOTOPOLIS_CITY','ROUTE127','ROUTE128',
 'SEAFLOOR_CAVERN','CAVE_OF_ORIGIN','ROUTE129','ROUTE130','ROUTE131','PACIFIDLOG_TOWN','ROUTE132','ROUTE133','ROUTE134',
 'SKY_PILLAR','EVER_GRANDE_CITY','VICTORY_ROAD','DESERT_RUINS','ISLAND_CAVE','ANCIENT_TOMB','GRASSY_SLAB','ROCKY_SLAB','FLOATING_SLAB',
 'SCORCHED_SLAB','ARTISAN_CAVE','ALTERING_CAVE']
def okey(m):
    m = m.replace('MAP_', '')
    best = max((o for o in ORDER if m.startswith(o)), key=len, default=None)
    return ORDER.index(best) if best else len(ORDER)
encs = [e for e in WE[0]['encounters'] if 'UNUSED' not in e['map']]
seen_map = set(); E2 = []
for e in encs:  # Altering Cave has 9 alternate tables, only the first is live in Emerald
    if e['map'] in seen_map: continue
    seen_map.add(e['map']); E2.append(e)
E2 = sorted(enumerate(E2), key=lambda x: (okey(x[1]['map']), x[0]))
LOC = [locname(e['map']) for _, e in E2]
F = WE[0]['fields']; RATES = {f['type']: f['encounter_rates'] for f in F}; GROUPS = F[3]['groups']
MNAME = {'land_mons': 'Grass/cave', 'water_mons': 'Surf', 'rock_smash_mons': 'Rock Smash'}
RODS = {'old_rod': 'Old Rod', 'good_rod': 'Good Rod', 'super_rod': 'Super Rod'}
W = {}
for li, (_, e) in enumerate(E2):
    for t in ('land_mons', 'water_mons', 'rock_smash_mons', 'fishing_mons'):
        if t not in e: continue
        mons = e[t]['mons']; rates = RATES[t]
        groups = [(RODS[g], idx) for g, idx in GROUPS.items()] if t == 'fishing_mons' else [(MNAME[t], range(len(mons)))]
        for meth, idx in groups:
            tot = sum(rates[j] for j in idx); agg = {}
            for j in idx:
                if j >= len(mons): continue
                mm = mons[j]; s = LBL.get(mm['species'])
                if s is None: continue
                s = canon(s)
                a = agg.setdefault(s, [0, 99, 0]); a[0] += rates[j]; a[1] = min(a[1], mm['min_level']); a[2] = max(a[2], mm['max_level'])
            for s, (r, lo, hi) in agg.items():
                W.setdefault(s, []).append([li, meth, f'{round(r*100/tot)}%', f'{lo}' if lo == hi else f'{lo}-{hi}', ''])
log.append(f'locations {len(LOC)}, species with wild encounters {len(W)}')

# ---------- 5. obtainability: wild + evolution family both ways
fam = set(s for s in W if s in keep); q = list(fam)
while q:
    i = q.pop()
    for _, t in ET[i] + EF[i]:
        if t not in fam: fam.add(t); q.append(t)
MEGA = {i for i in keep if set(sp[i]['forms'] or []) & {'mega', 'primal'}}
# forms you switch into with an item, in battle or by a move follow the base form's availability
CHANGE = {351,421,386,479,487,492,493,483,484,555,641,642,645,905,646,647,648,658,681,718,720,746,773,774,778,800,845,875,877,888,889,890,898,964,1017,1024}
FC = {i for i in keep if sp[i]['formId'] and sp[i]['dexId'] in CHANGE and not (set(sp[i]['forms'] or []) & {'mega','primal'})}
def g(i):
    if i in MEGA: return 1
    if i in fam: return 0
    if i in FC: return g(sp[i]['dexId']) if sp[i]['dexId'] in keep else 3
    return 3
log.append(f'obtainable via wild+evolution {len(fam)}, megas/primals {len(MEGA)}, not in wild tables {sum(1 for i in keep if g(i)==3)}')

# ---------- 6. moves, abilities
order = sorted(keep, key=lambda i: (sp[i]['dexId'], 0 if not sp[i]['formId'] else 1, sp[i]['speciesId']))
Mi = {}; M = []; MV = []
CAT = ['Physical', 'Special', 'Status']
def m(mid):
    if mid in Mi: return Mi[mid]
    d = MD[str(mid)]; Mi[mid] = len(M); M.append(d['name'])
    sd = SD.get(key(d['name']))
    ac = None if d['acc'] in (0, 999) else d['acc']
    bp = d['power'] or None
    o = {'t': TN.get(d['type'], ''), 'c': CAT[d['cat']], 'bp': ('Varies' if bp == 1 else bp), 'ac': ac, 'pp': d['pp'],
         'pr': sd['pr'] if sd else 0, 'd': (d['description'] or '').replace('- ', ''), 'f': d.get('properties') or []}
    # changes versus standard Gen 9 (Showdown); EI originals have no Showdown entry
    h = []
    if not sd: o['x'] = 1
    else:
        sbp = sd['bp'] or 0; ebp = bp if isinstance(o['bp'], int) else 0
        if sbp != ebp and o['bp'] != 'Varies' and not (sbp == 0 and sd['c'] == o['c']): h.append(f"Power {sbp or '-'} → {ebp or '-'}")
        if sd['ac'] != ac and not (sd['ac'] is None and o['c'] == 'Status'): h.append(f"Accuracy {sd['ac'] or 'never misses'} → {ac or 'never misses'}")
        if sd['pp'] != d['pp']: h.append(f"PP {sd['pp']} → {d['pp']}")
        if sd['t'] != o['t']: h.append(f"Type {sd['t']} → {o['t']}")
        if sd['c'] != o['c']: h.append(f"Category {sd['c']} → {o['c']}")
    o['h'] = h; MV.append(o)
    return Mi[mid]
ABi = {}; AB = []
def ab(aid):
    if not aid: return -1
    if aid not in ABi:
        a = AD[str(aid)]; ABi[aid] = len(AB); AB.append([a['name'], a['description'], 0 if key(a['name']) in SDA or any(n.startswith(a['name'] + ' (') for n in SDA.values()) else 1])
    return ABi[aid]
nosd = set()
P = []
for i in order:
    v = sp[i]
    a1, a2, h = (v['abilities'] + [0, 0, 0])[:3]
    reg = [x for x in dict.fromkeys([a1, a2]) if x]
    sib = [canon(x) for x in (v['siblings'] or [])]
    of = sorted({x for x in sib if x in keep and x != i}, key=lambda x: order.index(x))
    P.append({'id': str(i), 'n': NAME[i], 'dex': v['dexId'], 't': [TN[t] for t in dict.fromkeys(v['types'])],
              'a': [ab(x) for x in reg], 'ha': ab(h) if h and h not in reg else -1, 's': [v['stats'][k] for k in (0, 1, 2, 4, 5, 3)],  # source order is HP,Atk,Def,Spe,SpA,SpD (Gen 3)
              'ef': [[how, str(t)] for how, t in EF[i]], 'et': [[how, str(t)] for how, t in ET[i]], 'of': [str(x) for x in of],
              'lv': [[l, m(x)] for x, l in v['levelUpMoves']], 'tm': [m(x) for x in v['tmMoves'] or []],
              'eg': [m(x) for x in v['eggMoves'] or []], 'w': W.get(i, []), 'g': g(i),
              'hi': [item(x) for x in v['heldItems'] if x], **({'fc': 1} if i in FC else {})})
for i, name in enumerate(M):
    if not SD.get(key(name)): nosd.add(name)
log.append(f'EI original abilities: {[a[0] for a in AB if a[2]]}'); log.append(f'changed vs Gen 9: {sum(1 for x in MV if x["h"])}'); log.append(f'moves {len(M)} (no Showdown match for priority: {len(nosd)}: {", ".join(sorted(nosd)[:15])}...), abilities {len(AB)}')
# type chart: attacking type -> multiplier x10 per defending type id
TCH = {TD[k]['typeName']: {TN[j]: TD[k]['matchup'][j] for j in TN if j < len(TD[k]['matchup'])} for k in TD}

D = {'M': M, 'MV': MV, 'AB': AB, 'P': P, 'LOC': LOC, 'TC': TCH, 'built': datetime.date.today().isoformat(), 'src': 'eidex repo (Mar 2026)'}
json.dump(D, open('/home/claude/ei/data.json', 'w'), separators=(',', ':'), ensure_ascii=False)

# ---------- 7. sprites: lossless palette PNG (GBA sprites have at most 16 colours)
SPR = {}
for i in order:
    f = f'{R}/public/sprites/front/{i}.png'
    im = Image.open(f).convert('RGBA'); b = io.BytesIO()
    px = list(im.getdata()); px = [(0,0,0,0) if p[3] == 0 else p for p in px]
    cols = list(dict.fromkeys(px))
    if len(cols) <= 256:
        cols.sort(key=lambda c: c[3]); ix = {c: k for k, c in enumerate(cols)}
        q = Image.new('P', im.size); q.putdata([ix[p] for p in px])
        q.putpalette([v for c in cols for v in c[:3]]); q.info['transparency'] = bytes(c[3] for c in cols)
        q.save(b, 'PNG', optimize=True, transparency=bytes(c[3] for c in cols))
    else: im.save(b, 'PNG', optimize=True)
    raw = b.getvalue() if len(b.getvalue()) < os.path.getsize(f) else open(f, 'rb').read()
    SPR[str(i)] = 'data:image/png;base64,' + base64.b64encode(raw).decode()
json.dump(SPR, open('/home/claude/ei/spr.json', 'w'), separators=(',', ':'))
print('\n'.join(log)); print('data', os.path.getsize('/home/claude/ei/data.json'), 'spr', os.path.getsize('/home/claude/ei/spr.json'))

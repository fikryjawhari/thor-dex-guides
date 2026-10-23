"""Locations (LOC, AR, P.w, P.g): the wild tables in the tracker's order and grouping, plus statics, gifts, eggs, roamers.

Wild tables are the dex site's wild_encounters.json (the Locations PDF agrees with it on every slot, see check.py). Areas
are the official Encounter Tracker's header (128 areas, its order and grouping; Underwater 124 and 126 count as one).
Statics, gifts, eggs, roamers and the multiple-choice encounters (PDF pages 70-77, tracker) are hand-transcribed in
specials.py. build() ends with each species' availability P.g (wild encounter plus its evolution family both ways);
split() is the split UI's reshaping of eggs and gift buildings and runs after every tab is built.
"""
import re
import specials as SPX
from common import TRACKER, key, report, workbook
from eidex import LBL, S, WE, canon

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


def wild_tables():
    """The map tables as LOC (names, tracker-friendly order) and W (species id -> wild rows)."""
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
    report(f'locations {len(LOC)}, species with wild encounters {len(W)}')
    return LOC, W


def tracker():
    """The Encounter Tracker's areas in its order, and the game maps each one covers."""
    bymap = {}
    for e in WE[0]['encounters']:
        if 'UNUSED' in e['map'] or e['map'] in bymap: continue
        bymap[e['map']]=e
    A = [str(c).strip() for c in next(workbook(TRACKER)['Encounters'].iter_rows(min_row=2, max_row=2, values_only=True)) if c]
    ALIAS={'Shoal Cave Entrace':['SHOAL_CAVE_LOW_TIDE_ENTRANCE_ROOM'],'Shoal Cave Ice':['SHOAL_CAVE_LOW_TIDE_ICE_ROOM'],'Shoal Cave Inner':['SHOAL_CAVE_LOW_TIDE_INNER_ROOM'],'Shoal Cave Lower':['SHOAL_CAVE_LOW_TIDE_LOWER_ROOM'],'Shoal Cave Stairs':['SHOAL_CAVE_LOW_TIDE_STAIRS_ROOM'],'New Mauville':['NEW_MAUVILLE_ENTRANCE','NEW_MAUVILLE_INSIDE'],'Abandoned Ship':['ABANDONED_SHIP_ROOMS_B1F','ABANDONED_SHIP_HIDDEN_FLOOR_CORRIDORS'],'Cave Of Origin':['CAVE_OF_ORIGIN_ENTRANCE','CAVE_OF_ORIGIN_1F'],"Meteor Falls Steven's Cave":['METEOR_FALLS_STEVENS_CAVE']}
    for i in (1,2,3): ALIAS[f'Trick House {i}']=[f'ROUTE110_TRICK_HOUSE_PUZZLE{i}']
    mk={key(m.replace('MAP_','')):m for m in bymap}
    def maps(a): return ['MAP_'+x for x in ALIAS[a]] if a in ALIAS else [mk[k] for k in [key(a)] if k in mk]
    AM = {a: maps(a) for a in A}
    return {'areas': A, 'maps': AM}


def build(D):
    LOC, W = wild_tables()
    for p in D['P']:
        p['w'] = W.get(int(p['id']), [])
    D['LOC'] = LOC
    P=D['P']; byid={p['id']:p for p in P}
    T = tracker()
    # --- areas: tracker order; Underwater 124 + 126 merged (tracker note: these two routes count as one encounter)
    AREAS=[]
    for a in T['areas']:
        if a=='Underwater Route 126': continue
        n={'Shoal Cave Entrace':'Shoal Cave Entrance','Mt Pyre 1F':'Mt. Pyre 1F'}.get(a,a).replace('Mt Pyre','Mt. Pyre')
        maps=T['maps'][a]+(T['maps']['Underwater Route 126'] if a=='Underwater Route 124' else [])
        if a=='Underwater Route 124': n='Underwater Routes 124 and 126'
        AREAS.append({'n':n,'t':a,'maps':maps,'subs':[]})
    AREAS.append({'n':'Altering Cave (not in the tracker, no slot)','t':'Altering Cave','maps':['MAP_ALTERING_CAVE'],'subs':[],'ns':1})
    AREAS.append({'n':'Artisan Cave (post-game, not in the tracker, no slot)','t':'Artisan Cave','maps':['MAP_ARTISAN_CAVE_1F','MAP_ARTISAN_CAVE_B1F'],'subs':[],'ns':1})
    for x in SPX.EXTRA_AREAS: AREAS.append({'n':x+(' (post-game, no slot)' if x!='Roaming' else ''),'t':x,'maps':[],'subs':[],'ns':1})
    AI={a['t']:i for i,a in enumerate(AREAS)}
    # --- species lookup for special names
    nk={}
    for k,v in S.items():
        nk.setdefault(key(v['nameKey']),k)
        if not v.get('formId'): nk.setdefault(key(v['speciesName']),k)
    def pid(n):
        k=nk.get(key(n))
        if k and k in byid: return k
        for p in P:  # folded cosmetic forms: fall back to the dex number's first kept form
            if k and p['dex']==S[k]['dexId']: return p['id']
        report('NO MATCH',n); return None
    # --- new LOC list
    LOC=[];oldidx={n:i for i,n in enumerate(D['LOC'])};remap={}
    def addloc(a,name):
        if name in LOC and LOC.index(name) in a.setdefault('l',[]): return LOC.index(name)
        LOC.append(name); a.setdefault('l',[]).append(len(LOC)-1); return len(LOC)-1
    for a in AREAS:
        for m in a['maps']:
            i=addloc(a,locname(m)); remap[oldidx[locname(m)]]=i
    lost=[n for n,i in oldidx.items() if i not in remap]; report('wild locs not in tracker areas:',lost)
    for p in P:
        p['w']=[[remap[w[0]]]+w[1:] for w in p['w'] if w[0] in remap]
    def add(sp,area,sub,meth,rate,lv,note):
        i=pid(sp); a=AREAS[AI[area]]
        if not i: return
        li=LOC.index(sub) if sub in LOC and LOC.index(sub) in a.get('l',[]) else addloc(a,sub)
        byid[i]['w'].append([li,meth,rate,str(lv) if lv else '',note])
    for sp,lv,area,sub,how in SPX.ST:
        add(sp,area,sub,'Gift' if re.search(r'gift|defeat|give the|say goodbye',how,re.I) else 'Static','',lv,how)
    for area,sub,meth,lv,lst,note in SPX.POOLS:
        if lst is None:
            n=sum(len(x) for _,x in SPX.HOT)
            for b,xs in SPX.HOT:
                for x in xs: add(x,area,sub,f'Hot House ({b}+ badges)','1 of '+str(n),lv,note)
        else:
            for x in lst: add(x,area,sub,meth,'1 of '+str(len(lst)),lv,note)
    AR=[{'n':a['n'],'l':a.get('l',[]),**({'ns':1} if a.get('ns') else {})} for a in AREAS]
    AR[AI['Hot House']]['note']='Tracker badge tiers: '+'; '.join(f'{b} badges: '+', '.join(x) for b,x in SPX.HOT)
    # --- availability: anything with an encounter, plus evolution families both ways
    ef={p['id']:[t for _,t in p['et']+p['ef']] for p in P}
    fam=set(p['id'] for p in P if p['w']);q=list(fam)
    while q:
        i=q.pop()
        for t in ef[i]:
            if t not in fam: fam.add(t); q.append(t)
    for p in P:
        if p['g']==1: continue
        if p['id'] in fam: p['g']=0
        elif p.get('fc'):
            b=next((x for x in P if x['dex']==p['dex'] and not x.get('fc') and x['g']!=1),None); p['g']=0 if b and b['id'] in fam else 3
        else: p['g']=3
    D['LOC']=LOC; D['AR']=AR; D['src']+='; Locations PDF (EI 1.3); Encounter Tracker (EI 1.3)'
    report('LOC',len(LOC),'areas',len(AR),'not found',sum(p['g']==3 for p in P))
    report('NOT FOUND:',', '.join(p['n'] for p in P if p['g']==3))


def split(D):
    """Eggs and gift buildings for the split UI. Hatch towns get one tracker slot per egg, appended to AR so saved trackers keep their indexes."""
    LOC, AR = D['LOC'], D['AR']
    byLoc = {}
    for p in D['P']:
        for w in p['w']: byLoc.setdefault(w[0], []).append((p, w))
    # ---------- eggs
    HATCH = [27, 31, 38, 40, 55]
    OLDLOC = {137, 195, 196} | set(range(140, 195))
    starters = [(p, w) for p, w in byLoc[140]]
    kind = lambda p: next(t for t in p['t'] if t in ('Fire', 'Water', 'Grass'))
    SHARD = {'Fire': 'Red', 'Water': 'Blue', 'Grass': 'Green'}
    POOLS = [(f'{k} egg', [p for p, w in starters if kind(p) == k], '1',
              f'Give a {SHARD[k]} Shard to the man in the Fallarbor Town Move Relearner House (random {k.lower()} starter)') for k in ('Fire', 'Water', 'Grass')]
    OLDALE = ('Oldale egg', [p for p, w in byLoc[137]], byLoc[137][0][1][3], 'Random egg from the man in the Oldale Town Pokémon Center')
    POOLS += [('Lavaridge egg', [p for p, w in byLoc[195]], byLoc[195][0][1][3], 'Give the lady in Lavaridge Town a Yellow Shard'),
              ('Pacifidlog egg', [p for p, w in byLoc[196]], byLoc[196][0][1][3], 'Random egg from the man in the Pacifidlog Town Pokémon Center 1F')]
    assert [len(x[1]) for x in POOLS] == [9, 9, 9, 9, 10] and len(OLDALE[1]) == 10, [len(x[1]) for x in POOLS]
    for p in D['P']: p['w'] = [w for w in p['w'] if w[0] not in OLDLOC]
    def egg(li, pool):
        name, sp, lv, note = pool
        for p in sp: p['w'].append([li, name, f'1 of {len(sp)}', lv, note])
    li = len(LOC); LOC.append('Oldale Town'); egg(li, OLDALE); AR[2]['l'] = [li]
    for a in HATCH:
        town = AR[a]['n']; AR[a]['l'] = []; AR[a]['sub'] = []
        for pool in POOLS:
            li = len(LOC); LOC.append(town); egg(li, pool)
            AR[a]['sub'].append(len(AR)); AR.append({'n': f'{town} {pool[0]}', 't': pool[0], 'l': [li], 'in': a})
    # ---------- buildings with gifts fold into their town
    for a in (0, 8, 85, 118):
        A = AR[a]; home = next(li for li in A['l'] if LOC[li] == A['n'])
        for li in [x for x in A['l'] if x != home]:
            b = LOC[li][len(A['n']) + 1:] if LOC[li].startswith(A['n'] + ' ') else LOC[li]
            for p, w in byLoc[li]:
                w[0] = home
                if w[1] in ('Gift', 'Static'): w[1] = f'{w[1]} ({b})'
        A['l'] = [home]
    AR[0].update(n='Starter', st=1)

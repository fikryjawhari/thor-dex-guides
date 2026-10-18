# Stage 3: locations in the official tracker's order and grouping, plus static/gift/egg/roaming/choice encounters.
# Inputs: data.json (after stage 2), ck/tracker_cmp.json (cmp_tracker.py), ck/specials.py (PDF pp70-77 + tracker).
import json,re,sys
sys.path.insert(0,'ck'); import specials as SPX
key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower())
R='/home/claude/ei/miriamlefae_eidex/eidex-HEAD/src/data/'
S=json.load(open(R+'speciesData.json')); D=json.load(open('data.json')); T=json.load(open('ck/tracker_cmp.json'))
P=D['P']; byid={p['id']:p for p in P}
def locname(m):  # same as build.py
    m=m.replace('MAP_',''); m=re.sub(r'^ROUTE110_TRICK_HOUSE_PUZZLE(\d)',r'TRICK_HOUSE_PUZZLE_\1',m); m=re.sub(r'^UNDERWATER_(ROUTE\d+)',r'\1_UNDERWATER',m); m=re.sub(r'ROUTE(\d+)',r'ROUTE_\1',m)
    out=[]
    for w in m.split('_'):
        if re.fullmatch(r'B?\d+F|\d+R',w): out.append(w)
        elif w=='MT': out.append('Mt.')
        elif w.isdigit(): out.append(w)
        else: out.append(w.capitalize())
    s=' '.join(out); s=re.sub(r'Room(\d)',r'Room \1',s).replace(' Of ',' of ').replace('Stevens',"Steven's"); return re.sub(r' (\d)R$',r' Room \1',s)
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
    print('NO MATCH',n); return None
# --- new LOC list
LOC=[];oldidx={n:i for i,n in enumerate(D['LOC'])};remap={}
def addloc(a,name):
    if name in LOC and LOC.index(name) in a.setdefault('l',[]): return LOC.index(name)
    LOC.append(name); a.setdefault('l',[]).append(len(LOC)-1); return len(LOC)-1
for a in AREAS:
    for m in a['maps']:
        i=addloc(a,locname(m)); remap[oldidx[locname(m)]]=i
lost=[n for n,i in oldidx.items() if i not in remap]; print('wild locs not in tracker areas:',lost)
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
json.dump(D,open('data.json','w'),separators=(',',':'),ensure_ascii=False)
print('LOC',len(LOC),'areas',len(AR),'not found',sum(p['g']==3 for p in P))
print('NOT FOUND:',', '.join(p['n'] for p in P if p['g']==3))

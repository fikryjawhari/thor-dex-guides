# Compare the Encounter Tracker (pasted text, rows saved in ck/tracker_rows.txt) with dex/PDF wild data.
import csv,io,json,re
key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower())
R='/home/claude/ei/miriamlefae_eidex/eidex-HEAD/src/data/'
S=json.load(open(R+'speciesData.json')); L=json.load(open(R+'speciesLabelMap.json'))
WE=json.load(open(R+'wild_encounters.json'))['wild_encounter_groups'][0]['encounters']
bymap={}
for e in WE:
    if 'UNUSED' in e['map'] or e['map'] in bymap: continue
    bymap[e['map']]=e
lines=open('ck/tracker_rows.txt').read().splitlines(); A=lines[0].split('|')[1:]
ALIAS={'Shoal Cave Entrace':['SHOAL_CAVE_LOW_TIDE_ENTRANCE_ROOM'],'Shoal Cave Ice':['SHOAL_CAVE_LOW_TIDE_ICE_ROOM'],'Shoal Cave Inner':['SHOAL_CAVE_LOW_TIDE_INNER_ROOM'],'Shoal Cave Lower':['SHOAL_CAVE_LOW_TIDE_LOWER_ROOM'],'Shoal Cave Stairs':['SHOAL_CAVE_LOW_TIDE_STAIRS_ROOM'],'New Mauville':['NEW_MAUVILLE_ENTRANCE','NEW_MAUVILLE_INSIDE'],'Abandoned Ship':['ABANDONED_SHIP_ROOMS_B1F','ABANDONED_SHIP_HIDDEN_FLOOR_CORRIDORS'],'Cave Of Origin':['CAVE_OF_ORIGIN_ENTRANCE','CAVE_OF_ORIGIN_1F'],"Meteor Falls Steven's Cave":['METEOR_FALLS_STEVENS_CAVE']}
for i in (1,2,3): ALIAS[f'Trick House {i}']=[f'ROUTE110_TRICK_HOUSE_PUZZLE{i}']
mk={key(m.replace('MAP_','')):m for m in bymap}
def maps(a): return ['MAP_'+x for x in ALIAS[a]] if a in ALIAS else [mk[k] for k in [key(a)] if k in mk]
SUF={'A':'Alola','G':'Galar','H':'Hisui','PC':'Paldea-Combat','PB':'Paldea-Blaze','PA':'Paldea-Aqua','P':'Paldea'}
def tnorm(n):
    m=re.match(r'^(.*)-(A|G|H|PC|PB|PA|P)$',n.strip())
    return key(m[1]+SUF[m[2]]) if m else key(n)
AM={a:maps(a) for a in A}
print('areas with wild data',sum(1 for v in AM.values() if v),'without',[a for a,v in AM.items() if not v])
diff=[]
for l in lines[1:]:
    row=next(csv.reader(io.StringIO(l)))[2:]; slot=int(l[1])-1
    for i,a in enumerate(A):
        lv,nm=row[3*i],row[3*i+1]
        if not AM[a]: continue
        e=bymap[AM[a][0]].get('land_mons',{}).get('mons',[])
        if not nm and not e: continue
        if not e: diff.append((a,slot,f'tracker {nm} {lv}, dex/PDF have no land table')); continue
        if not nm: diff.append((a,slot,'tracker empty, dex/PDF have land')); continue
        x=e[slot]; s=S[str(L[x['species']])]
        lvl=f"{x['min_level']}-{x['max_level']}"
        if tnorm(nm)!=key(s['nameKey']) and tnorm(nm)!=key(s['speciesName']): diff.append((a,slot,f"species tracker {nm}, dex {s['nameKey']} (PDF {s['speciesName']})"))
        if re.sub(r'[‒–]','-',lv)!=lvl: diff.append((a,slot,f'levels tracker {lv}, dex/PDF {lvl}'))
print('DIFFS',len(diff))
for d in diff: print(d)
json.dump({'areas':A,'maps':AM,'diff':diff},open('ck/tracker_cmp.json','w'))

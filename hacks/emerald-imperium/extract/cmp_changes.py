import openpyxl,json,re,collections
key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower().replace('♀','f').replace('♂','m'))
R='/home/claude/ei/miriamlefae_eidex/eidex-HEAD/src/data/'
S=json.load(open(R+'speciesData.json')); D=json.load(open('data.json'))
TN={int(k):v['typeName'] for k,v in json.load(open(R+'typeData.json')).items()}
AD=json.load(open(R+'abilityData.json'))
byk={}
for k,v in S.items():
    byk.setdefault(key(v['nameKey']),k); byk.setdefault(key(v['speciesName']) if not v.get('formId') else key(v['nameKey']),k)
alias={'alolan':'alola','galarian':'galar','hisuian':'hisui','paldean':'paldea','female':'f','male':'m'}
FIX={'TAUROS (PALDEAN, COMBAT)':'Tauros-Paldea-Combat','TAUROS (PALDEAN, BLAZE)':'Tauros-Paldea-Blaze','TAUROS (PALDEAN, AQUA)':'Tauros-Paldea-Aqua','DARMANITAN (ZEN MODE)':'Darmanitan-Zen','DARMANITAN (GALARIAN)':'Darmanitan-Galar-Standard','DARMANITAN (GALARIAN, ZEN MODE)':'Darmanitan-Galar-Zen','PUMPKABOO (SUPER SIZE)':'Pumpkaboo-Super','GOURGEIST (SUPER SIZE)':'Gourgeist-Super','ZYGARDE (10%)':'Zygarde-10-Aura-Break','MINIOR (CORE)':'Minior-Core-Red','EISCUE (NO ICE FACE)':'Eiscue-Noice','CALYREX (ICE RIDER)':'Calyrex-Ice','CALYREX (SHADOW RIDER)':'Calyrex-Shadow','ASH GRENINJA':'Greninja-Ash'}
NK={v['nameKey']:k for k,v in S.items()}
def find(n):
    if n in FIX: return NK.get(FIX[n])
    m=re.match(r'^(.*?)\s*\((.*)\)\s*$',n); base,form=(m.group(1),m.group(2)) if m else (n,'')
    f=' '.join(alias.get(w.lower(),w) for w in form.split())
    for c in [key(base+f), key(base)+key(f), key(base)]:
        if c in byk: return byk[c]
    return None
wb=openpyxl.load_workbook('/mnt/user-data/uploads/1_3_1_Emerald_Imperium_Changes__Stats__Types__Abilities__Moves_.xlsx',data_only=True)
rows=list(wb['Data Clean'].iter_rows(values_only=True))[2:]
miss=[];diff=[];n=0;cover=set()
for r in rows:
    nm=r[14]
    if not nm: continue
    n+=1; sid=find(nm)
    if not sid: miss.append(nm); continue
    cover.add(sid); v=S[sid]; st=v['stats']; st=[st[i] for i in (0,1,2,4,5,3)]
    d=[]
    doc=list(r[15:21])
    if doc!=st: d.append(f'stats doc {doc} dex {st}')
    dt=[t for t in (r[22],r[23]) if t]; xt=[TN[t] for t in dict.fromkeys(v['types'])]
    if [key(t) for t in dt]!=[key(t) for t in xt]: d.append(f'types doc {dt} dex {xt}')
    da=[r[24],r[25],r[26]]; xa=[AD[str(a)]['name'] if a else None for a in v['abilities']]
    if [key(a) if a else '' for a in da]!=[key(a) if a else '' for a in xa]:
        # treat missing ability II same as ability I
        if not (set(key(a) for a in da if a)==set(key(a) for a in xa if a)): d.append(f'abilities doc {da} dex {xa}')
    if d: diff.append((nm,v['nameKey'],d))
print('rows',n,'matched',n-len(miss),'unmatched',len(miss)); print('UNMATCHED',miss[:60])
print('DIFFS',len(diff))
for x in diff[:70]: print(x)
json.dump({'miss':miss,'diff':diff},open('ck/changes_species.json','w'))
# ---- per-species output for the merge stage: vanilla values (doc cols 0-12) and doc-vs-dex conflicts
TYPO={'WARTORTLE','GRIMER (ALOLAN)','MUK (ALOLAN)','NOSEPASS','ASH GRENINJA','CALYREX (ICE RIDER)','CALYREX (SHADOW RIDER)'}
out={}
tc=lambda t:str(t).title()
for r in rows:
    nm=r[14]
    if not nm: continue
    sid=find(nm)
    if not sid: continue
    v=S[sid]; st=[v['stats'][i] for i in (0,1,2,4,5,3)]
    o=out.setdefault(sid,{'doc':nm})
    van=list(r[1:7])
    if all(isinstance(x,int) for x in van) and van!=st: o['vs']=van
    vt=[tc(t) for t in (r[8],r[9]) if t]; xt=[TN[t] for t in dict.fromkeys(v['types'])]
    if vt and [key(t) for t in vt]!=[key(t) for t in xt]: o['vt']=vt
    va=[tc(a) for a in (r[10],r[11],r[12]) if a]; xa=[AD[str(a)]['name'] for a in v['abilities'] if a]
    if va and set(map(key,va))!=set(map(key,xa)): o['va']=list(dict.fromkeys(va))
    if nm not in TYPO:
        for (n2,_,d) in diff:
            if n2==nm: o['cf']=['Changes doc says '+x.replace(' dex ',', EI Dex says ').replace('doc ','',1) for x in d]
json.dump(out,open('ck/species_doc.json','w'))
print('species with vanilla diffs',sum(1 for o in out.values() if any(k in o for k in('vs','vt','va'))),'with conflicts',sum(1 for o in out.values() if 'cf' in o))

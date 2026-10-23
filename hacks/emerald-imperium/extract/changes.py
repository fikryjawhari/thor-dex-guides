"""The official 1.3.1 Emerald Imperium Changes doc (xlsx, by Vicfis) set against the dex data: vanilla values per species
(Data Clean), the doc's move and ability effect texts, and every place the doc and the dex disagree. dex.py merges the
result into P (vc, cf), MV (dc, e, cf) and AB.
"""
import re
from common import CHANGES, key, report, workbook
from eidex import S, AD, MD, TD, TN


def species():
    key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower().replace('♀','f').replace('♂','m'))
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
    wb = workbook(CHANGES, ints=True)
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
    report('changes doc: species rows', n, 'matched', n - len(miss), 'unmatched', len(miss), miss[:60])
    report('changes doc: species differing from the dex', len(diff))
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
    report('changes doc: species with vanilla diffs',sum(1 for o in out.values() if any(k in o for k in('vs','vt','va'))),'with conflicts',sum(1 for o in out.values() if 'cf' in o))
    return out


def moves(D):
    """Move and ability changes, keyed by key(name): {'mv': ..., 'conf': [(name, [diffs])], 'ab': ...}."""
    MDn = {key(m['name']): m for m in MD.values()}
    ADn = {key(a['name']): a for a in AD.values()}
    CAT=['PHYSICAL','SPECIAL','STATUS']
    wb = workbook(CHANGES, ints=True)
    mv={};conf=[];miss=[]
    for r in list(wb['Move Changes'].iter_rows(values_only=True))[1:]:
        if not r[1]: continue
        nm=re.sub(r'\(NEW!\)','',str(r[1])).strip(); k=key(nm)
        eff=(r[9] or '').strip(); mv[k]={'n':nm,'e':eff,'new':'NEW' in str(r[1])}
        m=MDn.get(k)
        if not m: miss.append(nm); continue
        d=[]
        if key(r[3])!=key(TN[m['type']]): d.append(f"type doc {r[3]} dex {TN[m['type']]}")
        if r[5]!=CAT[m['cat']]: d.append(f"category doc {r[5]} dex {CAT[m['cat']]}")
        bp=None if r[6] in ('—','-',None) else r[6]; dbp=m['power'] or None
        if bp!=dbp and not (dbp==1): d.append(f"power doc {r[6]} dex {m['power']}")
        ac=None if r[7] in ('—','-',None) else r[7]; dac=None if m['acc'] in (0,999) else m['acc']
        if ac!=dac: d.append(f"accuracy doc {r[7]} dex {m['acc']}")
        if r[8]!=m['pp']: d.append(f"PP doc {r[8]} dex {m['pp']}")
        if d: conf.append((nm,d))
    report('changes doc: moves', len(mv), 'not in dex', miss, 'conflicts', len(conf))
    ab={};amiss=[]
    for r in list(wb['Ability Changes'].iter_rows(values_only=True))[1:]:
        if not r[1]: continue
        nm=re.sub(r'\(NEW!\)','',str(r[1])).strip(); ab[key(nm)]={'n':nm,'e':r[2].strip(),'new':'NEW' in str(r[1])}
        if key(nm) not in ADn: amiss.append(nm)
    report('changes doc: abilities', len(ab), 'not in dex data', amiss)
    # moves the dex flagged changed vs Gen9 but the doc does not mention
    Mk=[key(n) for n in D['M']]
    und=[D['M'][i] for i,v in enumerate(D['MV']) if (v['h'] or v.get('x')) and Mk[i] not in mv]
    report('changes doc: dex-detected move changes not in the doc', len(und), und)
    return {'mv': mv, 'conf': conf, 'ab': ab}


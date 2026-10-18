# Stage 2: merge the official changes doc (1.3.1 Emerald Imperium Changes xlsx) into data.json.
# Inputs: data.json from build.py, ck/species_doc.json (cmp_changes.py), ck/changes_moves.json (cmp_moves.py).
import json,re
key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower())
D=json.load(open('data.json')); SP=json.load(open('ck/species_doc.json')); CM=json.load(open('ck/changes_moves.json'))
CM['mv'][key('Strange Steam')]=CM['mv'].pop(key('Strange Stream'))  # doc typo
for p in D['P']:
    o=SP.get(p['id'])
    if not o: continue
    vc={k[1]:o[k] for k in ('vs','vt','va') if k in o}
    if vc: p['vc']=vc
    if o.get('cf'): p['cf']=o['cf']
mconf=dict((key(n),d) for n,d in CM['conf'])
for i,n in enumerate(D['M']):
    d=CM['mv'].get(key(n)); v=D['MV'][i]
    if d:
        v['dc']=1
        if d['e']: v['e']=d['e']
    if key(n) in mconf: v['cf']=['Changes doc says '+x.replace(' dex ',', EI Dex says ').split(' ',1)[0]+' '+x.split(' ',1)[1].replace('doc ','',1).replace(' dex ',', EI Dex says ') for x in mconf[key(n)]]
for a in D['AB']:
    d=CM['ab'].get(key(a[0]))
    a.append(d['e'] if d else '')
D['src']+='; EI Changes doc 1.3.1'
json.dump(D,open('data.json','w'),separators=(',',':'),ensure_ascii=False)
print('P vc',sum('vc' in p for p in D['P']),'P cf',sum('cf' in p for p in D['P']),'MV dc',sum('dc' in v for v in D['MV']),'MV cf',[ (D['M'][i],v['cf']) for i,v in enumerate(D['MV']) if 'cf' in v][:3],'AB doc',sum(1 for a in D['AB'] if a[3]))

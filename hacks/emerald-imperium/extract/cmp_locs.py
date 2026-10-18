# Compare the Locations PDF wild tables with the EI Dex wild_encounters.json, slot by slot.
import json,re
key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower())
R='/home/claude/ei/miriamlefae_eidex/eidex-HEAD/src/data/'
S=json.load(open(R+'speciesData.json')); L=json.load(open(R+'speciesLabelMap.json'))
WE=json.load(open(R+'wild_encounters.json'))['wild_encounter_groups'][0]
F={f['type']:f['encounter_rates'] for f in WE['fields']}
PDF=json.load(open('ck/pdf_wild.json'))
pk={key(k.replace('Mt ','Mt. ')):k for k in PDF}
diffs=[];seen=set();nomatch=[]
M={'land_mons':'land','water_mons':'surf','fishing_mons':'fish','rock_smash_mons':'rock'}
for e in WE['encounters']:
    if 'UNUSED' in e['map'] or e['map'] in seen: continue
    seen.add(e['map']); k=key(e['map'].replace('MAP_',''))
    t=pk.get(k)
    if not t: nomatch.append(e['map']); continue
    for jm,pm in M.items():
        a=e.get(jm,{}).get('mons',[]); b=PDF[t].get(pm,[])
        if len(a)!=len(b): diffs.append((t,pm,f'slot count dex {len(a)} pdf {len(b)}')); continue
        for i,(x,y) in enumerate(zip(a,b)):
            sp=S[str(L[x['species']])]['speciesName']
            d=[]
            if key(sp)!=key(y[0]) and not ('?' in y[0] and key(sp).startswith(key(y[0].replace('?','')))): d.append(f'species dex {sp} pdf {y[0]}')
            if (x['min_level'],x['max_level'])!=(y[1],y[2]): d.append(f"levels dex {x['min_level']}-{x['max_level']} pdf {y[1]}-{y[2]}")
            if F[jm][i]!=y[3]: d.append(f'rate dex {F[jm][i]} pdf {y[3]}')
            if d: diffs.append((t,pm,i,d))
print('pdf locs',len(PDF),'matched',len(seen)-len(nomatch),'unmatched dex maps',nomatch,'unused pdf',[k for k in PDF if key(k.replace('Mt ','Mt. ')) not in {key(m.replace('MAP_','')) for m in seen}])
print('DIFFS',len(diffs))
for d in diffs[:40]: print(d)
json.dump(diffs,open('ck/locs_pdf_vs_dex.json','w'))

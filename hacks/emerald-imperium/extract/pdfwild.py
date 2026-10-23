"""Check: the official Locations PDF (EI 1.3, "Pokemon Routes, Gift Mons, and Eggs") wild tables against the dex site's
wild_encounters.json, slot by slot (species, levels, rates). The PDF's boxes are read by word position: columns by x band
(land < 165 < surf < 300 < fish < 435 < rock), rows "name" then "lo - hi rate%". Pages 70-77 (statics, gifts, eggs,
roamers) shift columns and are hand-transcribed in specials.py.
"""
import re
import pdfplumber
from common import SRC, key
from eidex import LBL as L, S, WE

PDF = SRC + '/Pokemon Routes, Gift Mons, and Eggs.pdf'


def read_pdf():
    """{area title: {land|surf|fish|rock: [[species, min, max, rate]]}} from the PDF's wild table pages."""
    out={}
    with pdfplumber.open(PDF) as pdf:
        for pi in range(7,69):
            pg=pdf.pages[pi]; W=pg.extract_words()
            # headers: the 'Land' words mark each box; title is the line just above
            lands=sorted([w for w in W if w['text'].strip()=='Land'],key=lambda w:w['top'])
            for bi,L in enumerate(lands):
                top=L['top']; bot=lands[bi+1]['top']-40 if bi+1<len(lands) else pg.height
                title=' '.join(w['text'] for w in sorted([w for w in W if top-40<w['top']<top-10],key=lambda w:w['x0'])).strip()
                cols={}
                for w in W:
                    if not (top+8<w['top']<bot): continue
                    c='land' if w['x0']<165 else 'surf' if w['x0']<300 else 'fish' if w['x0']<435 else 'rock'
                    cols.setdefault(c,[]).append(w)
                box={}
                for c,ws in cols.items():
                    ls=[];cur=[];ct=None
                    for w in sorted(ws,key=lambda w:(w['top'],w['x0'])):
                        if ct is None or w['top']-ct>4:
                            if cur: ls.append(' '.join(x['text'] for x in sorted(cur,key=lambda x:x['x0'])))
                            cur=[];ct=w['top']
                        cur.append(w)
                    if cur: ls.append(' '.join(x['text'] for x in sorted(cur,key=lambda x:x['x0'])))
                    ent=[];name=None
                    for l in ls:
                        m=re.match(r'^(\d+)\s*[–-]\s*(\d+)\s+(\d+)%$',l)
                        if m and name: ent.append([name,int(m[1]),int(m[2]),int(m[3])]);name=None
                        elif not l.startswith('Not avai') and l!='this area': name=l
                    if ent: box[c]=ent
                out[title]=box
    return out


def compare():
    """Differences between the PDF and the dex data: a list of (area, method, slot, [what]); empty when they agree."""
    PDF_ = read_pdf()
    WE0 = WE[0]
    F={f['type']:f['encounter_rates'] for f in WE0['fields']}
    pk={key(k.replace('Mt ','Mt. ')):k for k in PDF_}
    diffs=[];seen=set();nomatch=[]
    M={'land_mons':'land','water_mons':'surf','fishing_mons':'fish','rock_smash_mons':'rock'}
    for e in WE0['encounters']:
        if 'UNUSED' in e['map'] or e['map'] in seen: continue
        seen.add(e['map']); k=key(e['map'].replace('MAP_',''))
        t=pk.get(k)
        if not t: nomatch.append(e['map']); continue
        for jm,pm in M.items():
            a=e.get(jm,{}).get('mons',[]); b=PDF_[t].get(pm,[])
            if len(a)!=len(b): diffs.append((t,pm,f'slot count dex {len(a)} pdf {len(b)}')); continue
            for i,(x,y) in enumerate(zip(a,b)):
                sp=S[str(L[x['species']])]['speciesName']
                d=[]
                if key(sp)!=key(y[0]) and not ('?' in y[0] and key(sp).startswith(key(y[0].replace('?','')))): d.append(f'species dex {sp} pdf {y[0]}')
                if (x['min_level'],x['max_level'])!=(y[1],y[2]): d.append(f"levels dex {x['min_level']}-{x['max_level']} pdf {y[1]}-{y[2]}")
                if F[jm][i]!=y[3]: d.append(f'rate dex {F[jm][i]} pdf {y[3]}')
                if d: diffs.append((t,pm,i,d))
    unused = [k for k in PDF_ if key(k.replace('Mt ', 'Mt. ')) not in {key(m.replace('MAP_', '')) for m in seen}]
    if nomatch or unused:
        diffs.append(('unmatched', nomatch, unused))
    return diffs

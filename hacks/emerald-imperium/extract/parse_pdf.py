# Parse the official Locations PDF (EI 1.3) wild tables by word position.
import pdfplumber,re,json
P='/mnt/user-data/uploads/Pokemon_Routes__Gift_Mons__and_Eggs.pdf'
out={}
with pdfplumber.open(P) as pdf:
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
json.dump(out,open('ck/pdf_wild.json','w'),indent=0)
print(len(out)); print(list(out)[:8]); print(out.get('Route 101'))
print({k:{c:len(v) for c,v in b.items()} for k,b in list(out.items())[:5]})

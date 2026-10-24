"""Trainers (TR): the Boss Battles sheet (order, titles, places, leads, rewards) with the game's own sets from the hzla
calc backup (.src/repos/hzla/imp_1-3.js), and each trainer's stop in the walkthrough (WK stops get .tr).

The calc is the authority for sets (1,198 real sets of 2,396, the rest are vanilla leftovers); whole trainers are paired
by species overlap and name tokens, then each Pokemon. Moves and abilities the dex lacks are appended to M / MV / AB.
Level caps come from the Navigation tab's boundary fights. split() is the split UI's reshaping: boxes by level cap,
places by location, Gardenia moved to the Wattson split (match.py has the name matchers, bosssheet.py reads the xlsx).
"""
import collections, re
import bosssheet, match
from common import H, report, split_name
from eidex import SD, SDA, TN


def build(D):
    match.init(D)
    SK, FIX, MD, MDK, AD = match.SK, match.FIX, match.MD, match.MDK, match.AD
    species, move, ability, item, key, mega_ok = match.species, match.move, match.ability, match.item, match.key, match.mega_ok
    SK['keldeoresolute']='647'
    byId={p['id']:p for p in D['P']}

    # ---------- calc trainers (real sets only; Mega/Primal duplicates folded into the slot they replace)
    CD = H.calc_backup('repos/hzla/imp_1-3.js')['backup_data']
    G=collections.defaultdict(list)
    for sp,v in CD.items():
        for t,s in v.items():
            if 'ability' not in s: continue            # vanilla leftovers: Hardy, no item, no ability
            G[(s['tr_id'],re.sub(r'^Lvl -?\d+\*{0,2} ','',t).strip())].append(dict(s,sp=sp))
    CT={}
    for k,v in G.items():
        v.sort(key=lambda s:s['sub_index']);megas=[s for s in v if re.search(r'-(Mega|Primal)',s['sp'])];out=[]
        for s in v:
            if s in megas: continue
            mg=[x for x in megas if x['item']==s['item'] and x['moves']==s['moves'] and key(x['sp'].split('-')[0])==key(s['sp'].split('-')[0])]
            if mg: s=dict(mg[0],sub_index=s['sub_index'],base_ab=s.get('ability'))
            out.append(s)
        CT[k]=out
    cid=lambda s:species(s['sp'],s['item'])
    dex=lambda i:byId[i]['dex'] if i in byId else None

    # ---------- sheet trainers; the 7 badge Hot House block holds two teams under one title (Dwayne's title is missing)
    ST = bosssheet.trainers()
    HH='Hot House (Rewards Upto 7 Badge'
    for i,t in enumerate(ST[HH]):
        if t['title']=='Beauty Johanna' and len(t['p'])==12:
            d=dict(t,title='Sailor Dwayne',p=t['p'][6:],rw=[],paste='',fixnote='The sheet has no title for this team; the calc shows it is Sailor Dwayne.')
            t['p']=t['p'][:6];ST[HH].insert(i+1,d);break
    def sid(p):
        n=[x for x in p['pre'] if not x.startswith('(') and not re.match(r'^PRE-',x,re.I) and x not in TN.values()]
        return species(n[0],p.get('it','')) if n else None
    def lvl(x):
        x=str(x).strip();m=re.match(r'^Highest Lv\s*(-\s*\d+)?$',x)
        if m: return ('r',int((m[1] or '0').replace(' ','')))
        if re.match(r'^-?\d+$',x): return ('r',int(x)) if int(x)<=0 else ('l',int(x))
        return ('l',None)
    def toks(s): return set(re.findall(r'[a-z0-9]+',s.lower()))-{'the','and','fight','rival','trainer','leader','route','city','town','battle','double','true','optional','if','you','chose','starter','with'}
    TABS=[('Split 1: Roxanne','Badge 1 (Roxanne)',0),('Split 2: Brawly','Badge 2 (Brawly)',1),('Hot House (optional, by badges)',HH,2),
          ('Split 3: Wattson','Badge 3 (Wattson)',2),('Split 4: Flannery','Badge 4 (Flannery)',3),('Split 5: Norman','Badge 5 (Norman)',4),
          ('Split 6: Winona','Badge 6 (Winona)',5),('Split 7: Tate & Liza','Badge 7 (Tate & Liza)',6),('Split 8: Juan','Badge 8 (Juan)',7),
          ('Split 9: Ever Grande City','Evergrande City',8),('Split 9: Victory Road','Victory Road',8),('Split 9: Elite Four & Champion','Elite 4  Champion',8)]
    TABNAME={HH:'Hot House (Rewards Upto 7 Badges)','Elite 4  Champion':'Elite 4 / Champion'}   # full tab names from the text copy

    # ---------- pair whole trainers, then each Pokémon (doubles fall back to all calc trainers)
    used=collections.Counter()
    def pair_trainer(t,tab):
        ids=[sid(p) for p in t['p']];best=None
        for k,v in CT.items():
            c=collections.Counter(cid(s) for s in v);ov=sum(min(c[i],1) for i in set(ids) if i)
            if ov<max(2,len(set(ids))//2+1): continue
            sc=ov*10-abs(len(v)-len(ids))*3+len(toks(t['title'])&toks(k[1]))*2-(1 if re.search(r'\d$',k[1]) else 0)-used[k]*5
            if tab==HH and re.search(r'(\d) Badges',t.get('sec') or ''): sc+=4 if re.search(r'(\d) Badges',t['sec'])[1]+' Badges' in k[1] else 0
            if not best or sc>best[0]: best=(sc,k)
        if best: used[best[1]]+=1;return best[1]
    def mon_score(p,s):
        mv={key(move(x)[0]) for x in p['m']};cm={key(x) for x in s['moves']}
        return len(mv&cm)*3+(key(item(p.get('it','')))==key(s['item']))*2+(key(p.get('na',''))==key(s['nature']))+(lvl(p['lv'])==lvl(s['level']))*2
    def pair_mons(t,ck):
        out=[];taken=set()
        for p in t['p']:
            i=sid(p);pool=[(ck,CT[ck])] if ck else list(CT.items())
            cands=[(k,j,s) for k,v in pool for j,s in enumerate(v) if (k,j) not in taken and (cid(s)==i or (dex(cid(s)) is not None and dex(cid(s))==dex(i)))]
            if not cands and ck: cands=[(k,j,s) for k,v in CT.items() for j,s in enumerate(v) if (k,j) not in taken and cid(s)==i and mon_score(p,s)>=6]
            if not cands: out.append(None);continue
            k,j,s=max(cands,key=lambda c:(mon_score(p,c[2]),c[0]==ck,cid(c[2])==i));taken.add((k,j));out.append((k,s))
        return out

    # ---------- moves / abilities: indices into M/MV/AB, appending anything new
    MI={key(n):i for i,n in enumerate(D['M'])};CAT=['Physical','Special','Status'];NEWM=[];NEWA=[]
    def midx(name):
        n,hp=move(name);k=key(n)
        if k in MI: return MI[k],hp
        mid=MDK.get(k)
        if mid is None: report('MOVE NOT IN GAME DATA',name);return None,hp
        d=MD[str(mid)];sd=SD.get(k);ac=None if d['acc'] in (0,999) else d['acc'];bp=d['power'] or None
        o={'t':TN.get(d['type'],''),'c':CAT[d['cat']],'bp':('Varies' if bp==1 else bp),'ac':ac,'pp':d['pp'],'pr':sd['pr'] if sd else 0,'d':(d['description'] or '').replace('- ',''),'f':d.get('properties') or [],'h':[]}
        if not sd: o['x']=1
        D['M'].append(d['name']);D['MV'].append(o);MI[k]=len(D['M'])-1;NEWM.append(d['name']);return MI[k],hp
    AI={key(a[0]):i for i,a in enumerate(D['AB'])}
    def aidx(name):
        if re.search(r'As One.*(Shadow|Spectrier)',name): return next(i for i,a in enumerate(D['AB']) if a[0]=='As One' and 'Grim' in a[1])
        if re.search(r'As One.*(Ice|Glastrier)',name): return next(i for i,a in enumerate(D['AB']) if a[0]=='As One' and 'Chilling' in a[1])
        n=ability(name);k=key(n)
        if k in AI: return AI[k]
        a=[v for v in AD.values() if key(v['name'])==k]
        D['AB'].append([n,a[0]['description'] if a else '',0 if k in SDA else 1,'']);AI[k]=len(D['AB'])-1;NEWA.append(n);return AI[k]
    HPTYPES=['Fighting','Flying','Poison','Ground','Rock','Bug','Ghost','Steel','Fire','Water','Grass','Electric','Psychic','Ice','Dragon','Dark']
    def hp_type(iv):  # Gen 3+ formula, IVs in HP,Atk,Def,Spe,SpA,SpD bit order
        h,a,d,sa,sd,sp=iv;bits=[h,a,d,sp,sa,sd];return HPTYPES[sum((b&1)<<i for i,b in enumerate(bits))*15//63]

    # ---------- level caps (Navigation tab): a trainer's cap is the cap of the next boundary fight
    CAPS=[['Pre-Roxanne',15],['Pre-Rustboro Rival fight',20],['Pre-Brawly',25],['Pre-Aqua Museum fight',30],['Pre-Route 110 Rival fight',32],['Pre-Wattson',34],
          ['Pre-Mt. Chimney Magma bosses',44],['Pre-Flannery',47],['Pre-Trick House',56],['Pre-Norman',59],['Pre-Route 119 Rival fight',64],['Pre-Winona',68],
          ['Pre-Dawn battle in Lilycove',71],['Pre-Archie in Aqua Hideout',74],['Pre-Tate and Liza',76],['Pre-Seafloor Cavern',80],['Pre-Juan',82],['Pre-Wally in Victory Road',84],['Pre-Champion',85]]
    BOUND=[('Badge 1','^Roxanne'),('Badge 2','Rival Fight.*Rustboro'),('Badge 2','^Brawly'),('Badge 3','Slateport Museum'),('Badge 3','Rival Fight.*Route 110'),('Badge 3','^Wattson'),
           ('Badge 4','Mt\\. Chimney'),('Badge 4','^Flannery'),('Badge 5','Trick House'),('Badge 5','^Norman'),('Badge 6','Rival Fight.*Route 119'),('Badge 6','^Winona'),
           ('Badge 7','^Dawn - Lilycove'),('Badge 7','Archie'),('Badge 7','^Tate'),('Badge 8','Seafloor'),('Badge 8','^Juan'),('Victory Road','^Wally'),('Elite','^Champion')]
    HHCAP={2:30,3:44,4:56,5:64,6:71,7:80}
    seq=[(tab,t) for _,tab,_ in TABS if tab!=HH for t in ST[tab] if t['p']]
    bpos=[max(i for i,(tab,t) in enumerate(seq) if tab.startswith(b[0]) and re.search(b[1],t['title'])) for b in BOUND]
    capof={}
    for i,(tab,t) in enumerate(seq): capof[id(t)]=next(CAPS[j][1] for j,b in enumerate(bpos) if b>=i)

    # ---------- trainer title -> name, location, tags
    GYM={'Roxanne':'Rustboro City','Brawly':'Dewford Town','Wattson':'Mauville City','Flannery':'Lavaridge Town','Norman':'Petalburg City','Winona':'Fortree City','Tate & Liza':'Mossdeep City','Juan':'Sootopolis City'}
    def title(t):
        s=t['title'];tags=[];stc=None
        s=s.replace('(Brendan / May)','{BM}')
        for m in re.findall(r'\(([^)]*)\)',s):
            mm=re.match(r'If You Chose (\w+) Starter',m)
            if mm: stc=mm[1]
            else: tags.append(m.strip())
        s=re.sub(r'\s*\([^)]*\)','',s).replace('{BM}','(Brendan / May)')
        if re.search(r'\bDouble Battle\b',s): s=re.sub(r'\s*Double Battle','',s);tags.append('Double Battle')
        m4=re.match(r'^Elite Four\s*-\s*(\w+)(?:\s+aka\s+(.*))?$',s)
        if m4: return 'Elite Four '+m4[1],'Ever Grande City',[x for x in tags]+([m4[2]] if m4[2] else []),stc
        parts=re.split(r'\s*-\s+',s,1);n=parts[0].strip();loc=parts[1].strip() if len(parts)>1 else ''
        if not loc:   # "Team Aqua Grunt (Petalburg Woods)": the place is in brackets
            pl=[x for x in tags if not re.search(r'Optional|Double|Back to Back|Permanent|Surf|Badge|follower|Team \d|Chooses',x)]
            if pl: loc=pl[0];tags.remove(pl[0])
        n=re.sub(r'^Rival Fight','Rival',n)
        if not loc: loc=GYM.get(n,'Ever Grande City' if 'Elite Four' in n or 'Champion' in n else '')
        if t['tab']==HH: loc='Hot House (Route 109)'
        return n,loc,tags,stc
    STATS=['HP','Atk','Def','SpA','SpD','Spe'];CS=['hp','at','df','sa','sd','sp']
    def stat(b,i,iv,ev,lv,nat):
        from math import floor
        if i==0: return floor((2*b+iv+ev//4)*lv/100)+lv+10
        v=floor((2*b+iv+ev//4)*lv/100)+5;NAT={'Lonely':(1,2),'Brave':(1,5),'Adamant':(1,3),'Naughty':(1,4),'Bold':(2,1),'Relaxed':(2,5),'Impish':(2,3),'Lax':(2,4),'Timid':(5,1),'Hasty':(5,2),'Jolly':(5,3),'Naive':(5,4),'Modest':(3,1),'Mild':(3,2),'Quiet':(3,5),'Rash':(3,4),'Calm':(4,1),'Gentle':(4,2),'Sassy':(4,5),'Careful':(4,3)}
        n=NAT.get(nat)
        if n: v=floor(v*1.1) if n[0]==i else floor(v*0.9) if n[1]==i else v
        return v

    # ---------- build
    TRG=[];KEYS={};nmons=0;nsrc=collections.Counter();spdchk=collections.Counter();spdbad=[]
    for gi,(gname,tab,wk) in enumerate(TABS):
        grp={'n':gname,'tab':TABNAME.get(tab,tab),'wk':wk,'sec':[]};TRG.append(grp)
        for t in ST[tab]:
            if not t['p']: continue
            sec=t.get('sec') if tab==HH else ''
            if not grp['sec'] or grp['sec'][-1]['h']!=(sec or ''):
                grp['sec'].append({'h':sec or '','tr':[]})
                if tab==HH:
                    b=int(re.search(r'(\d) Badges',sec)[1]);grp['sec'][-1]['cap']=HHCAP[b]
            S=grp['sec'][-1];si=len(grp['sec'])-1
            if tab==HH and t['rw']: S['rw']=[x for x in t['rw'] if x!='Player Choice:']
            ck=pair_trainer(t,tab);pm=pair_mons(t,ck)
            n,loc,tags,stc=title(t);T={'k':f'{gi}.{si}.{len(S["tr"])}','n':n,'loc':loc,'tags':tags,'cap':S.get('cap') or capof[id(t)],'p':[],'note':[]}
            if stc: T['st']=stc
            if t.get('rw') and tab!=HH: T['rw']=t['rw']
            if t.get('paste'): T['pp']=t['paste']
            if t.get('fixnote'): T['note'].append(t['fixnote'])
            cn=sorted({x[0][1] for x in pm if x});T['c']=cn
            if not cn: T['note'].append('No set in the hzla calc; values are from the sheet.')
            for p,x in zip(t['p'],pm):
                nmons+=1;cf=[];o={}
                lead=[re.search(r'\d',q) for q in p['pre'] if q.startswith('(Lead')]
                if lead: o['ld']=int(lead[0][0]) if lead[0] else 1
                pre=[q for q in p['pre'] if re.match(r'^PRE-',q,re.I)]+re.findall(r'\[Pre-(\w+)\]',' '.join(p['ab']))
                sab=[a for a in p['ab'] if a.strip()]
                if x:
                    k,s=x;nsrc['calc']+=1;i=cid(s)
                    lv=lvl(s['level']);na=s['nature'];ab=s.get('ability','');it=item(s['item']);mv=s['moves']
                    iv=[s['ivs'][c] for c in CS];ev=[s['evs'][c] for c in CS]
                    if s.get('status'): pre.append(s['status'])
                    # sheet vs calc differences shown on the card
                    if lvl(p['lv'])!=lv: cf.append('level '+p['lv'])
                    if key(p.get('na',''))!=key(na): cf.append('nature '+p.get('na',''))
                    sa=[ability(z) for a in sab for z in re.split(r'\s*(?:/|->)\s*',a.replace('[Pre-Frostbitten]','').replace('[Pre-Burned]','')) if z.strip()]
                    if not any(key(a) in (key(ab),key(s.get('base_ab',''))) or aidx(a)==aidx(ab) for a in sa) and sa: cf.append('ability '+' '.join(sab))
                    if key(item(p.get('it','')))!=key(it): cf.append('item '+p.get('it',''))
                    if {key(move(z)[0]) for z in p['m']}!={key(z) for z in mv}: cf.append('moves '+', '.join(p['m']))
                    siv=[p['iv'].get(z,'') for z in STATS];sev=[p['ev'].get(z,'') for z in STATS]
                    if siv!=[str(z) for z in iv]: cf.append('IVs '+'/'.join(siv))
                    if sev!=[str(z) for z in ev]: cf.append('EVs '+'/'.join(sev))
                    sn=[q for q in p['pre'] if not q.startswith('(') and not re.match('^PRE-',q,re.I) and q not in TN.values()]
                    if sid(p)!=i: cf.append('species '+(sn[0] if sn else '?'))
                    if s.get('base_ab') and key(s['base_ab'])!=key(ab): o['a0']=aidx(s['base_ab'])
                else:
                    nsrc['sheet']+=1;i=sid(p);lv=lvl(p['lv']);na=p.get('na','');it=item(p.get('it',''))
                    ab=re.sub(r'\[.*?\]','',(sab[-1] if sab else '')).replace('->','').strip();mv=p['m']
                    if len(sab)>1: o['a0']=aidx(re.sub(r'\[.*?\]','',sab[0]))
                    iv=[int(p['iv'].get(z) or 31) for z in STATS];ev=[int(p['ev'].get(z) or 0) for z in STATS]
                    if p['lv'].isdigit() and int(p['lv'])<=5: na=''   # route 103 rival: nature is random
                if i and byId[i]['n']=='Mega Flapple': cf.append(f'holds {it}: the items sheet lists no stone for Mega Flapple and gives Applite to Mega Appletun')
                elif i and byId.get(i,{}).get('g')==1 and not mega_ok(i,it): cf.append(f'holds {it or "no item"}, not its Mega Stone')
                o.update({'id':i,'na':na,'a':aidx(ab) if ab else -1,'i':it,'iv':iv,'ev':ev})
                o['l' if lv[0]=='l' else 'r']=lv[1]
                ms=[];hp=None
                for z in mv:
                    j,h=midx(z)
                    if j is not None: ms.append(j)
                    hp=hp or h
                o['m']=ms
                if any(D['M'][j]=='Hidden Power' for j in ms):
                    sh=[move(z)[1] for z in p['m'] if move(z)[1]];o['hp']=hp_type(iv)
                    if sh and sh[0]!=o['hp']: cf.append(f'Hidden Power {sh[0]} (IVs give {o["hp"]})')
                if pre: o['pre']=sorted({q.replace('PRE-','').capitalize() for q in pre})
                xs=[q.strip() for z in ([p.get('spd','')]+p['x']) for q in z.split('\n') if q.strip()]
                o['x']=[q for q in xs[1:] if q]
                if not x: o['src']='s'
                if cf: o['cf']=cf
                if not i: report('UNMATCHED SPECIES',p['pre'])
                # check our speed formula against the sheet's "Speed Stat" (first number 0 EVs, bracket with EVs) at the sheet's own cap
                sp0=re.match(r'^(\d+)(?:\s*\((\d+)\))?',xs[0]) if xs else None
                cn_=re.search(r'was (\d+)',p.get('capnote',''));capS=int(cn_[1]) if cn_ else T['cap']
                if sp0 and i in byId and not cf:
                    L=o['l'] if 'l' in o else capS+o['r'];b=byId[i]['s'][5]
                    a0=stat(b,5,iv[5],0,L,na);a1=stat(b,5,iv[5],ev[5],L,na)
                    ok=int(sp0[1])==a0 and (not sp0[2] or int(sp0[2])==a1) or int(sp0[1])==a1
                    spdchk[ok]+=1
                    if not ok: spdbad.append(f"{n} {byId[i]['n']} L{L}: sheet {xs[0]} vs ours {a0} ({a1})")
                T['p'].append(o)
            if any(D['M'][j]=='Trick Room' for o in T['p'] for j in o['m']): T['tags'].append('Trick Room')
            S['tr'].append(T);KEYS[T['k']]=(tab,wk,T)
    report('trainers',len(KEYS),'mons',nmons,dict(nsrc));report('speed check vs sheet (True = matches)',dict(spdchk))
    for z in spdbad: report('  speed differs:',z)
    report('new moves',NEWM);report('new abilities',NEWA)

    # ---------- walkthrough placement
    WS=D['WK']['splits'];norm=lambda s:re.sub(r'\b(city|town)\b','',s.lower().replace('evergrande','ever grande')).strip()
    ALIAS={'route 111 ':'route 111 ','weather institute':'route 119','outside shoal cave':'shoal cave','slateport museum':'slateport','trick house':'trick house','hot house':'hot house','sky pillar':'sky pillar'}
    for st in WS:
        for s in st['st']: s['tr']=[]
    ptr=collections.defaultdict(int);unplaced=[]
    for k,(tab,wk,T) in KEYS.items():
        stops=WS[wk]['st'];l=norm(T['loc']);l=next((v for a,v in ALIAS.items() if a in l),l)
        hits=[j for j,s in enumerate(stops) if norm(s['n']) and (norm(s['n']) in l or l.startswith(norm(s['n'])))]
        leader=T['n'] in GYM or 'Elite Four' in T['n'] or 'Champion' in T['n']
        if 'Elite Four' in T['n'] or 'Champion' in T['n'] or tab=='Victory Road': hits=[j for j,s in enumerate(stops) if s['n']=='Victory Road']
        if not hits and wk==4 and 'route 111' in l: hits=[j for j,s in enumerate(stops) if s['n']=='Mirage Tower']
        if not hits:
            nm=T['n'].split()[-1].lower()
            hits=[j for j,s in enumerate(stops) if any(nm in z[0].lower() for z in s['s'])]
        if not hits: j=ptr[wk];unplaced.append(f"{T['n']} ({T['loc']}) -> {stops[j]['n']}")
        elif leader: j=hits[-1]
        else: j=next((h for h in hits if h>=ptr[wk]),hits[0])
        stops[j]['tr'].append(k);ptr[wk]=max(ptr[wk],j)
    report('placed by fallback (first stop or pointer):',unplaced)
    D['TR']={'g':TRG,'caps':CAPS,'src':'Boss Battles sheet (1A9iN3N2bZ8-0YCVrhfeZ0qo2runkbHd-HCgaH_TVyr4) + hzla calc backups/imp_1-3.js','fix':sorted({f'{a}: {b} -> {c}' for a,b,c in FIX if a in('species','move','item','ability')})}
    D['src'] += '; boss sheet + hzla calc (trainers)'
    report('name fixes',D['TR']['fix']);report('unresolved',sorted({f'{a}: {b}' for a,b,c in FIX if a.endswith('?')}))


def split(D):
    """Boxes by level cap, places by location."""
    # ---------- trainers: boxes by level cap, places by location
    CAPN = {c: re.sub(r'^Pre-|\s+(fight|battle)\b', '', n).replace(' in Victory Road', '').replace('Wally', 'Victory Road') for n, c in D['TR']['caps']}
    CAPN[84] = 'Victory Road'
    G = []
    def place(sec, h, t):
        if not sec or sec[-1]['h'] != h: sec.append({'h': h, 'tr': []})
        sec[-1]['tr'].append(t)
    MOVE = {('Gardenia', 20): (34, 'Mauville City')}   # (name, sheet cap): (new cap, goes before the first trainer at; the walkthrough follows: walk.name_splits)
    moved = []
    for g in D['TR']['g']:
        for s in g['sec']:
            for t in list(s['tr']):
                to = MOVE.get((t['n'], t['cap']))
                if to: s['tr'].remove(t); t['cap'] = to[0]; moved.append((t, to))
    for t, (c, at) in moved:
        s = next(s for g in D['TR']['g'] for s in g['sec'] if any(x['cap'] == c and x['loc'] == at for x in s['tr']))
        s['tr'].insert(next(i for i, x in enumerate(s['tr']) if x['cap'] == c and x['loc'] == at), t)
    for g in D['TR']['g']:
        if g['n'].startswith('Hot House'):
            G.append({'n': 'Hot House (optional, by badges)', 'tab': g['tab'], 'wk': g.get('wk'),
                      'sec': [dict(s, h=f"{s['h']} [Cap {s['tr'][0]['cap']}]") for s in g['sec']]}); continue
        for s in g['sec']:
            assert not s['h'] and not s.get('note') and not s.get('rw')
            for t in s['tr']:
                c = t['cap']
                if not G or G[-1].get('cap') != c: G.append({'n': split_name(CAPN[c], c), 'cap': c, 'tab': g['tab'], 'wk': g.get('wk'), 'sec': []})
                place(G[-1]['sec'], t['loc'], t)
    D['TR']['g'] = G
    for g in G:   # the league's box carries the Elite Four name
        if g.get('cap') == 85:
            g['n'] = split_name('Elite Four', 85)

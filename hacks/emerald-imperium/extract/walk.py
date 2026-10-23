"""Walkthrough (WK): the official walkthrough page (walk.txt, transcribed: S split, P place, - step, > note), the tracker
areas and the items, plus the cheat codes.

Tracker area groups are anchored to their first mention in a place heading or step text at or after the previous group (a
far-ahead first mention, like Route 118 via Wake in Split 5, does not move the pointer); unmentioned areas become "on the
way" stops after the previous group. Items are filed under the earliest area or town name in their location text.
name_splits() renames the nine splits after their gym and cap once trainers.py has used the page's own names.
"""
import os, re
from common import H, key, report, split_name

WALK = os.path.join(H.extract, 'walk.txt')
GYMS = [('Roxanne', 15), ('Brawly', 25), ('Wattson', 34), ('Flannery', 47),
        ('Norman', 59), ('Winona', 68), ('Tate & Liza', 76), ('Juan', 82), ('Elite Four', 85)]
BASES=['Granite Cave','Meteor Falls','Mt. Pyre','Mirage Tower','Magma Hideout','Seafloor Cavern','Shoal Cave','Safari Zone','Sky Pillar','Victory Road','Trick House','Cave Of Origin','New Mauville','Abandoned Ship']
def base(n):
    n=re.sub(r' \(.*\)$','',n)
    for b in BASES:
        if n.startswith(b): return b
    return n


def build(D):
    AR = D['AR']
    # --- parse walkthrough
    splits=[];stops=[]
    for line in open(WALK, encoding='utf-8').read().splitlines():
        if not line or line.startswith('#'): continue
        t,x=line.split('|',1)
        if t=='S': splits.append({'n':x,'note':[]});cur=None
        elif t=='P': cur={'n':x,'sp':len(splits)-1,'st':[],'a':[],'it':[]};stops.append(cur)
        elif t=='-': cur['st'].append([x,''])
        elif t=='>':
            if cur and cur['sp']==len(splits)-1 and cur['st']: cur['st'][-1][1]=(cur['st'][-1][1]+' '+x).strip()
            else: splits[-1]['note'].append(x)
    for i,s in enumerate(stops): s['o']=(i,0)
    # --- anchor tracker area groups
    groups=[]
    for i,A in enumerate(AR):
        b=base(A['n'])
        if groups and groups[-1][0]==b: groups[-1][1].append(i)
        else: groups.append([b,[i]])
    seq=0;extra=[];anch={};prev=0
    txt=[(s['n']+' | '+' | '.join(a+' '+b for a,b in s['st'])).lower() for s in stops]
    def mentions(b):
        pat=re.compile(r'(?<![a-z0-9])'+re.escape(b.lower()).replace('mt\\. ','mt\\.? ')+r'(?![a-z0-9])')
        return [i for i,t in enumerate(txt) if pat.search(t)]
    for b,ids in groups:
        ms=mentions(b)
        if ms:
            ge=[i for i in ms if i>=prev]; pos=ge[0] if ge else ms[0]
            hd=[i for i,s in enumerate(stops) if key(s['n'])==key(b) and i>=pos and s['sp']==stops[pos]['sp']]
            if hd: tgt=stops[hd[0]]
            else:
                seq+=1; tgt={'n':b,'sp':stops[pos]['sp'],'st':[],'a':[],'it':[],'o':(pos,seq),'x':1}; extra.append(tgt)
            if ge and pos-prev<=6: prev=max(prev,pos)  # a far-ahead first mention (Route 118 via Wake) must not drag later areas forward
        else:
            seq+=1; tgt={'n':b,'sp':stops[prev]['sp'],'st':[],'a':[],'it':[],'o':(prev,seq),'x':1}; extra.append(tgt)
        tgt['a']+=ids
        for i in ids: anch[i]=tgt
    allst=sorted(stops+extra,key=lambda s:s['o'])
    # --- items: earliest area/base name mentioned in the text
    names=sorted({(AR[i]['n'],i) for i in range(len(AR))}|{(b,ids[0]) for b,ids in groups},key=lambda x:-len(x[0]))
    ALIAS={'Evergrande':'Ever Grande City','Mt Pyre':'Mt. Pyre','Weather Institute':'Route 119','Game Corner':'Mauville City','Lilycove Department Store':'Lilycove City','Aqua Hideout':'Team Aqua Hideout','Space Center':'Mossdeep City','Trick House':'Trick House 1','Seashore House':'Hot House','Hot House':'Hot House','Cable Car':'Route 112','Battle Frontier':'Battle Frontier (post-game, no slot)'}
    AN={key(A['n']):i for i,A in enumerate(AR)}
    for A in AR:
        m=re.match(r'^(.*) (City|Town)$',A['n'])
        if m: ALIAS.setdefault(m[1],A['n'])
    ALIAS.update({'Mt. Pyre':'Mt. Pyre 1F','Granite Cave':'Granite Cave 1F','Meteor Falls':'Meteor Falls 1F 1R','Safari Zone':'Safari Zone Northwest','Magma Hideout':'Magma Hideout 1F','Shoal Cave':'Shoal Cave Entrance','Victory Road':'Victory Road 1F','Mirage Tower':'Mirage Tower 1F','Seafloor Cavern':'Seafloor Cavern Entrance','Sky Pillar':'Sky Pillar 1F'})
    for k,v in ALIAS.items():
        if key(v) in AN: names.append((k,AN[key(v)]))
    def area_of(txt):
        t=' '+txt.lower()+' ';best=None
        for n,i in names:
            m=re.search(r'(?<![a-z0-9])'+re.escape(n.lower())+r'(?![a-z0-9])',t)
            if m and (best is None or m.start()<best[0] or (m.start()==best[0] and len(n)>best[2])): best=(m.start(),i,len(n))
        return best[1] if best else None
    nop=[]
    for sec in D['IT']:
        for r in sec['r']:
            txt=(r[0]+' '+r[1]) if sec['k']=='npc' else r[1]
            if sec['n']=='Shops': txt=r[1]
            a=area_of(txt)
            ent=[sec['n'],r[0],r[1],r[2] if len(r)>2 else None]
            (anch[a]['it'] if a is not None and a in anch else nop).append(ent)
    WK={'cheats':[['DexAll','Dxa','See every Pokémon in the DexNav, even uncaught ones',1],['CaughtAll','Cal','Mark every Pokémon as caught in the Pokédex',0],['EZCatch','Ezc','Guaranteed 100% catch rate',1],['Mega','','Gives all Mega Stones',0],['ShinyS','Shs','Guaranteed shiny starters',1],['MaxMoney','Mmy',"Sets your money to the maximum",0],['Mono','','Monotype starter mode',0],['ShinyR','Shr','Guaranteed shiny roamers',0]],
     'cnote':"Enter codes by talking to the GameCube in your house or your rival's house. SO2Toxic and Woyaopp (Rare Candies and item care packages from Radical Red) are on by default, no need to enter them. Aliases by breadbeing.",
     'splits':[{'n':s['n'],'note':' '.join(s['note']),'st':[{'n':x['n'],'a':x['a'],'s':x['st'],'it':x['it'],**({'x':1} if x.get('x') else {})} for x in allst if x['sp']==si]} for si,s in enumerate(splits)],
     'np':nop,'src':'https://emeraldimperium.info/walkthrough.html'}
    D['WK'] = WK; D['src'] += '; walkthrough page; cheat codes doc'
    report('walkthrough: stops', len(allst), 'extra', len(extra), 'items placed', sum(len(s['it']) for s in allst), 'unplaced', len(nop))
    report('walkthrough: unplaced', [(x[0], x[1], x[2][:50]) for x in nop[:15]])

def name_splits(D):
    """Walkthrough splits are named after their gym and level cap (tools/splits.py)."""
    if len(D['WK']['splits']) != len(GYMS):
        raise ValueError('Expected nine gym/league walkthrough splits')
    for split, (boss, cap) in zip(D['WK']['splits'], GYMS):
        split['n'] = split_name(boss, cap)

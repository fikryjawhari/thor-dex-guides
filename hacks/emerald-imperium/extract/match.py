"""Name matching for the Boss Battles sheet and the calc's trainer sets: species, moves, abilities and items against the dex.

init(D) builds the lookups from the finished P / M of data.json; everything else is static (eidex.py's game data).
Fuzzy matches (Levenshtein <= 2) are recorded in FIX for the trainers report.
"""
import re
from eidex import AD, ID, MD
key=lambda s:re.sub(r'[^a-z0-9]','',str(s).lower().replace('é','e').replace('♀','f').replace('♂','m'))
def lev(a,b):
    if abs(len(a)-len(b))>2: return 9
    d=list(range(len(b)+1))
    for i in range(1,len(a)+1):
        p=d[0];d[0]=i
        for j in range(1,len(b)+1):
            t=d[j];d[j]=min(d[j]+1,d[j-1]+1,p+(a[i-1]!=b[j-1]));p=t
    return d[len(b)]
def fuzzy(k,keys,mx=2):
    best=None;bd=mx+1
    for c in keys:
        x=lev(k,c)
        if x<bd: bd=x;best=c
    return best
FIX=[]  # reported fixes
REG={'alola':'alolan','alolan':'alolan','a':'alolan','galar':'galarian','galarian':'galarian','g':'galarian','hisui':'hisuian','hisuian':'hisuian','h':'hisuian','paldea':'paldean','paldean':'paldean','p':'paldean'}
DEFAULT={'ice','normal','standard','shield','male','singlestrike','midday','meteorred','amped','hero','aria','teal','solo','incarnate','combat'}
SK = {}
STONE = {}
MK = {}


def init(D):
    global SK, STONE, MK
    SK = {}
    for p in D['P']:
        n=p['n'];k=key(n);SK.setdefault(k,p['id'])
        m=re.match(r'^(.*?) \((.*)\)$',n)
        if m:
            SK.setdefault(key(m[1]+m[2]),p['id'])
            if key(m[2]) in DEFAULT: SK.setdefault(key(m[1]),p['id'])
    SK.update({'aegislashboth':'681','minior':'774','silvally':'773','urshifu':'892','toxtricity':'849','basculegion':'902','darmanitan':'555','lycanroc':'745','oricorio':'741','meloetta':'648','zamazenta':'889','greninjabond':'1112','wishiwashischool':'1175','paldeantauros':SK.get('paldeantauroscombat')})
    STONE={p['id']:p.get('stone') for p in D['P']}
    MK = {key(n):i for i,n in enumerate(D['M'])}

def species(name,item=''):
    """sheet or calc name -> (dex id, note). Mega/Primal only with the matching held item."""
    raw=name.strip();n=raw.replace("'",'')
    n=re.sub(r'^(Alola|Galar|Hisui|Paldea)-(.*)$',r'\2-\1',n)              # Alola-Marowak
    n=re.sub(r'^Mega (.*)$',r'\1-Mega',n); n=re.sub(r'^(\S+) Mega$',r'\1-Mega',n)  # Mega Medicham, Flapple Mega
    parts=[x for x in re.split(r'[-\s]+',n) if x]
    base=[];reg='';mega='';rest=[]
    for i,x in enumerate(parts):
        xl=x.lower()
        if i>0 and xl in REG and len(xl)>1: reg=REG[xl]
        elif i>0 and xl in ('mega','primal'): mega=xl
        elif mega and len(xl)==1: rest.append(xl)
        elif i==0 or (not reg and not mega and not rest and xl not in ('f','m')): base.append(x)
        else: rest.append(xl)
    if 'f' in rest: rest=['female']
    if rest==['m']: rest=[]
    cands=[]
    if mega: cands.append(mega+''.join(base)+''.join(rest))
    cands.append(reg+''.join(base)+''.join(rest)); cands.append(reg+''.join(base))
    cands=[key(c) for c in cands]
    for c in cands:
        if c in SK: return SK[c]
    f=fuzzy(cands[0],SK.keys())
    if f: FIX.append(('species',raw,f));return SK[f]
    return None
def mega_ok(pid,item):
    st=STONE.get(pid)
    return not st or lev(key(st),key(item))<=3 or key(st)[:5]==key(item)[:5]
# ---------- moves
MDK={key(v['name']):int(k) for k,v in MD.items()}
HPT={'fire','water','grass','ice','electric','ground','rock','flying','bug','poison','ghost','steel','dark','dragon','psychic','fighting','fairy'}
def move(name):
    """-> (canonical name, hp type or None)"""
    n=name.strip().rstrip('.');hp=None
    m=re.match(r'^(?:HP|Hidden Power)\s+(\w+)$',n,re.I)
    if m and m[1].lower() in HPT: hp=m[1].capitalize();n='Hidden Power'
    k=key(n)
    if k in MDK: return MD[str(MDK[k])]['name'],hp
    f=fuzzy(k,MDK.keys())
    if f: FIX.append(('move',name,MD[str(MDK[f])]['name']));return MD[str(MDK[f])]['name'],hp
    FIX.append(('move?',name,''));return n,hp
# ---------- abilities / items
ABK={key(v['name']):v['name'] for v in AD.values()}
def ability(name):
    k=key(name)
    if k in ABK: return ABK[k]
    f=fuzzy(k,ABK.keys())
    if f: FIX.append(('ability',name,ABK[f]));return ABK[f]
    FIX.append(('ability?',name,''));return name.strip()
# items keep their readable names (the game's item data truncates to 12 letters, e.g. "BoosterEnergy"); only real typos are fixed
TYPO={'roseradeite':'Roseradite','infernite':'Infernapite','slakingite':'Slakite','luxrayite':'Luxrite','luxite':'Luxrite','grimmsnarlite':'Grimmite',
      'alakazamite':'Alakazite','chocieband':'Choice Band','icerock':'Icy Rock','kingsrock':"King's Rock",'empoleoniteo':'Empoleonite O','empoleonited':'Empoleonite D'}
def item(name):
    n=(name or '').strip();k=key(n)
    if k in ('','noitem','none','-'): return ''
    if k in TYPO:
        if TYPO[k]!=n: FIX.append(('item',n,TYPO[k]))
        return TYPO[k]
    return n


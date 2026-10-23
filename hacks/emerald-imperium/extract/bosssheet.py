"""The official Boss Battles sheet (xlsx; the LightGlory / Flash Ketchum / iamguitar / PrincessGlaceon / Cap sheet), read
into trainer blocks for trainers.py: title, section, rewards, paste link and each Pokemon's level, nature, ability, item,
moves, stats and Speed notes.

Block layout: title in col C (rewards in col R), species above the "Pokemon:" row in cols F/K/P, then Level / Nature /
Ability / Item / Moves in cols C/H/M, stats / IV / EV in +2/+3/+4, "Speed Stat: a (b)". xlsx truncates tab names to 31
characters (TABS). Hidden tabs and the "Hoenn/Sinnoh Gyms Only" duplicates (DUP) are not used for the guide's order.
"""
import re
from common import BOSS, workbook

TABS=['Badge 1 (Roxanne)','Badge 2 (Brawly)','Hot House (Rewards Upto 7 Badge','Badge 3 (Wattson)','Badge 4 (Flannery)','Badge 5 (Norman)','Badge 6 (Winona)','Badge 7 (Tate & Liza)','Badge 8 (Juan)','Evergrande City','Victory Road','Elite 4  Champion']
DUP=['Hoenn Gyms Only','Sinnoh Gyms Only']
FIELD={'Level:','Nature:','Ability:','Item:','Moves:','Pokemon:','Types:'}
STATRE=re.compile(r'^(HP|Atk|Def|SpA|SpD|Spe):\s*(.*)$')
def stopper(r):
    for c,v in r.items():
        if c>=17: continue
        for ln in v.split('\n'):
            ln=ln.strip()
            if not ln or re.match(r'^\(Lead',ln): continue
            if re.search(r'Speed Stat|\d\s*\)?\s*$|level cap used|Poke Paste|^\s*-\s|Rewards',ln): return True
        if c==1 and v.strip().rstrip(':') in ('Level','Nature','Ability','Item','Moves'): return True
    return 2 in r
def parse(R, tab):
    out=[];tr=None;sect=None
    for i,r in enumerate(R):
        c1=r.get(1,'').strip()
        if 1 in r and c1 not in FIELD and not c1.startswith('Poke Paste') and not c1.startswith('Pokemon') and not c1.startswith('Types') and 2 not in r:
            sect=c1;continue
        if 2 in r and 1 not in r and not r[2].startswith('-') and 'level cap' not in r[2].lower() and not re.match(r'^(Highest|\d)',r[2]) and not any(STATRE.match(r.get(c,'')) for c in (4,9,14)) and not (i+1<len(R) and R[i+1].get(1,'').strip()=='Ability:'):
            tr={'tab':tab,'sec':sect,'title':r[2].strip(),'row':i,'rw':[],'p':[],'paste':''};out.append(tr);continue
        if tr is None: continue
        for c in (17,18):
            if c in r and r[c].strip()!='Rewards': tr['rw'].append(r[c].strip())
        if c1.startswith('Poke Paste'):
            tr['paste']=c1.split(':',1)[1].strip();continue
        if c1=='Level:':
            for j in range(3):
                c=2+5*j
                if c not in r: continue
                p={'col':c,'lv':r[c].strip(),'pre':[],'st':{},'iv':{},'ev':{},'m':[],'x':[],'ab':[]}
                # species: walk up
                k=i-1
                while k>tr['row'] and not stopper(R[k]):
                    for cc in (c+2,c+3,c+4):
                        if cc in R[k]: p['pre'][:0]=[x.strip() for x in R[k][cc].split('\n') if x.strip()]
                    k-=1
                # fields below
                k=i+1;mv=False
                while k<len(R):
                    rr=R[k];l=rr.get(1,'').strip()
                    if l in ('Level:','Pokemon:','Types:') or l.startswith('Poke Paste') or (2 in rr and 1 not in rr and not rr[2].startswith('-') and 'level cap' not in rr[2].lower() and k>i+5 and not mv): break
                    v=rr.get(c,'').strip()
                    if l=='Nature:': p['na']=v
                    elif l=='Ability:': p['ab'].append(v)
                    elif l=='Item:': p['it']=v
                    elif l=='Moves:': mv=True
                    elif not l and v and not mv and k<i+6: p['ab'].append(v)   # "-> Parental Bond" style rows
                    if mv and v.startswith('-'): p['m'].append(v.lstrip('- ').strip())
                    elif mv and v and not v.startswith('-') and 'level cap' not in v.lower(): mv=False if v else mv
                    for cc in (c+2,):
                        mm=STATRE.match(rr.get(cc,'').strip())
                        if mm: p['st'][mm[1]]=mm[2];p['iv'][mm[1]]=rr.get(cc+1,'').strip();p['ev'][mm[1]]=rr.get(cc+2,'').strip()
                    for cc in range(c+1,c+5):
                        t=rr.get(cc,'').strip()
                        if t.startswith('Speed Stat'): p['spd']=t.split(':',1)[1].strip()
                        elif t and k>i+6 and cc>c+1 and re.search(r':|Fish|Proc|Up',t) and 'level cap' not in t.lower() and not STATRE.match(t): p['x'].append(t+(' '+rr[cc+1].strip() if cc+1 in rr and cc+1<=c+4 and 'Speed' in rr.get(cc+1,'') else ''))
                    if 'level cap' in v.lower(): p['capnote']=v
                    k+=1
                    if k>i+14: break
                tr['p'].append(p)
    return out

def rows(ws):
    """A tab as a list of {column index: text} per row (empty cells left out; whole numbers without '.0')."""
    def text(v):
        if isinstance(v, float) and v == int(v):
            v = int(v)
        return str(v)
    return [{c.column - 1: text(c.value) for c in row if c.value is not None and str(c.value).strip() != ''}
            for row in ws.iter_rows()]


def trainers():
    """{tab: [trainer block]} for the split tabs and the duplicate gym tabs."""
    wb = workbook(BOSS)
    return {t: parse(rows(wb[t]), t) for t in TABS + DUP}

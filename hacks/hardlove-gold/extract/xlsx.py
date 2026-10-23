"""Minimal stdlib xlsx reader: sheets -> {(row,col): value}, plus cell notes and merged ranges."""
import zipfile,re,xml.etree.ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def col2n(s):
    n=0
    for ch in s:n=n*26+ord(ch)-64
    return n
def ref(r):
    m=re.match(r'([A-Z]+)(\d+)',r);return int(m.group(2)),col2n(m.group(1))
class Sheet:
    def __init__(s,name,state,cells,notes,merged):s.name,s.state,s.cells,s.notes,s.merged=name,state,cells,notes,merged
    @property
    def max_row(s):return max([r for r,c in s.cells] or [0])
    @property
    def max_col(s):return max([c for r,c in s.cells] or [0])
    def v(s,r,c):return s.cells.get((r,c))
    def rows(s):
        R={}
        for (r,c),v in s.cells.items():R.setdefault(r,{})[c]=v
        return R
def load(path):
    z=zipfile.ZipFile(path)
    def x(n):return ET.fromstring(z.read(n))
    ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in x('xl/sharedStrings.xml').findall('m:si',NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%NS['m'])))
    wb=x('xl/workbook.xml');rels=x('xl/_rels/workbook.xml.rels')
    rmap={r.get('Id'):r.get('Target') for r in rels}
    out=[]
    for sh in wb.find('m:sheets',NS):
        name=sh.get('name');state=sh.get('state','visible');tgt=rmap[sh.get('{%s}id'%NS['r'])]
        p='xl/'+tgt.lstrip('/').replace('xl/','',1) if not tgt.startswith('/xl') else tgt[1:]
        root=x(p);cells={}
        for c in root.iter('{%s}c'%NS['m']):
            t=c.get('t');vv=c.find('m:v',NS);val=None
            if t=='s' and vv is not None:val=ss[int(vv.text)]
            elif t=='inlineStr':val=''.join(q.text or '' for q in c.iter('{%s}t'%NS['m']))
            elif vv is not None:
                val=vv.text
                if t not in ('str','e','b'):
                    try:f=float(val);val=int(f) if f==int(f) else f
                    except:pass
            if val is not None and val!='':cells[ref(c.get('r'))]=val.strip() if isinstance(val,str) else val
        merged=[m.get('ref') for m in root.iter('{%s}mergeCell'%NS['m'])]
        notes={}
        rp=p.replace('worksheets/','worksheets/_rels/')+'.rels'
        if rp in z.namelist():
            for r in x(rp):
                if r.get('Type').endswith('/comments'):
                    cp='xl/'+r.get('Target').replace('../','')
                    for cm in x(cp).iter('{%s}comment'%NS['m']):
                        notes[ref(cm.get('ref'))]=''.join(t.text or '' for t in cm.iter('{%s}t'%NS['m'])).strip()
        out.append(Sheet(name,state,cells,notes,merged))
    return out

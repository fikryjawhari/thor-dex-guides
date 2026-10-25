"""Calc step 8 mockup (Z button, Totem aura): python -I plans/calc-zmock/build.py -> dist/calc-zmock.html, then the
Thor frame with --panel plans/calc-zmock/panel.html.

Takes the built Photonic Sun guide, adds two sample Totem battles to Verdant Cavern (Gumshoos: Def +1; Marowak:
all +1, placed there only for the mockup), seeds the calc (a custom Decidueye vs Totem Gumshoos) and patches the
inlined calc / trainer code the way the build would. The Z damage is the engine's own (slot `z`)."""
import json
from pathlib import Path

here = Path(__file__).parent
root = here.parent.parent
page = (root / 'dist' / 'photonic-sun.html').read_text(encoding='utf8')


def sub(old, new, count=1):
    global page
    assert page.count(old) >= count, old[:80]
    page = page.replace(old, new, count)


# --- data: two Totem battles at the end of Verdant Cavern
a = page.index('<script id="data" type="application/json">') + len('<script id="data" type="application/json">')
b = page.index('</script>', a)
D = json.loads(page[a:b])
M = D['M']
mv = lambda *names: [M.index(n) for n in names]
g = 1
si = next(i for i, s in enumerate(D['TR']['g'][g]['sec']) if s['h'] == 'Verdant Cavern')
sec = D['TR']['g'][g]['sec'][si]
iv = [31] * 6
def tr(n, mons):
    k = f'mock.{len(sec["tr"])}'
    sec['tr'].append({'k': k, 'n': n, 'loc': 'Verdant Cavern', 'tags': ['Totem'], 'cap': 0, 'note': [], 'p': mons})
    return k
gum = tr('Totem Gumshoos', [
    {'id': 'gumshoos', 'l': 16, 'i': 'Sitrus Berry', 'a': 90, 'na': 'Adamant', 'iv': iv, 'ev': [200, 100, 100, 0, 100, 0],
     'm': mv('Super Fang', 'Bite', 'Tackle', 'Scary Face'), 'au': [0, 1, 0, 0, 0]},
    {'id': 'yungoos', 'l': 13, 'i': 'Oran Berry', 'a': 197, 'na': 'Timid', 'iv': iv, 'ev': [0] * 6,
     'm': mv('Leer', 'Tackle', 'Pursuit', 'Super Fang')}])
tr('Totem Marowak', [
    {'id': 'marowak-alola', 'l': 37, 'i': 'Thick Club', 'na': 'Adamant', 'a': -1, 'iv': iv, 'ev': [252, 0, 106, 0, 152, 0],
     'm': mv('Shadow Bone', 'Fire Punch', 'Brick Break', 'Detect'), 'au': [1, 1, 1, 1, 1]},
    {'id': 'salazzle', 'l': 35, 'i': 'Petaya Berry', 'na': 'Naive', 'a': -1, 'iv': iv, 'ev': [0] * 6,
     'm': mv('Toxic', 'Venoshock', 'Flame Burst', 'Torment')}])
page = page[:a] + json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + page[b:]

# --- trainer card: aura tag
sub("""+(x.src==='s'?'<span class="tag">sheet only</span>':'');""",
    """+(x.src==='s'?'<span class="tag">sheet only</span>':'')+(x.au?`<span class="tag aura">${auTxt(x.au)}</span>`:'');""")
sub('function monCard(x,cap,sel,trainerKey,index){',
    "const auTxt=au=>{const n=['Atk','Def','SpA','SpD','Spe'],s=v=>(v>0?'+':'−')+Math.abs(v);"
    "return 'Aura '+(au.every(v=>v===au[0])?s(au[0])+' all':au.map((v,i)=>v?n[i]+' '+s(v):'').filter(Boolean).join(' '));};\n"
    'function monCard(x,cap,sel,trainerKey,index){')

# --- calc: a Totem's aura becomes its stages, with a mark while they are unchanged
sub("ev:x.ev||[0,0,0,0,0,0],foe:true};}", "ev:x.ev||[0,0,0,0,0,0],...(x.au?{stg:x.au.slice(),aura:x.au}:{}),foe:true};}")
sub("${esc(r.name)}${r.edited?' *':r.saved?' •':''}</b></button>",
    "${esc(r.name)}${r.edited?' *':r.saved?' •':''}</b>${r.aura&&r.aura.every((v,i)=>v===r.stg[i])?'<span class=\"aum a1\">Aura</span>':''}</button>")
sub('<span class="mx">/${mx??\'?\'}</span></div>',
    '<span class="mx">/${mx??\'?\'}</span>${r.aura&&r.aura.every((v,i)=>v===r.stg[i])?\'<span class="aum a2">Aura</span>\':\'\'}</div>')

# --- calc: Z button per damaging move row
sub("{mv:mi,...ST.mvo[ck],hits:n,crit},F)", "{mv:mi,...ST.mvo[ck],hits:n,crit,z:!!(ST.z&&ST.z[ck])},F)")
zb = "${prof.zmove&&r&&mv.c!=='Status'?`<button class=\"rz\" data-a=\"zmv\" data-ck=\"${ck}\" aria-pressed=\"${!!r.z}\" aria-label=\"Z-move\">Z</button>`:''}"
sub('<div class="r1"><span class="mv"><i class="td" style="background:${tcol(mv.t)}"></i>${esc(M[mi])}</span><span class="hp">${imm',
    '<div class="r1">' + zb.replace('class="rz"', 'class="rz z1"') + '<span class="mv"><i class="td" style="background:${tcol(mv.t)}"></i>${r.z?esc(r.z):esc(M[mi])}</span><span class="hp">${imm')
sub("<div class=\"r2\"><span>${imm?'':",
    '<div class="r2">' + zb.replace('class="rz"', 'class="rz z2"') + "<span class=\"pc\">${imm?'':")
sub("return `<div class=\"mr ${maxTotal===best&&best>0?'best':''} ${open?'open':''}\">",
    "return `<div class=\"mr ${maxTotal===best&&best>0?'best':''} ${open?'open':''} ${r.z?'zon':''}\">")
sub('<div class="dd"><div class="eg">${types}${bp}${hits}</div>',
    '<div class="dd">${r.z?`<div class="zl">Z-move of ${esc(M[mi])}</div>`:\'\'}<div class="eg">${types}${bp}${hits}</div>')
sub(" else if(a==='crit'){", " else if(a==='zmv'){const ck=el.dataset.ck;ST.z=ST.z||{};ST.z[ck]=ST.z[ck]?0:1;save();refresh();}\n else if(a==='crit'){")

css = """<style>
.tag.aura{background:#4a3d12;color:#f3e3a6}
.aum{flex:none;font:700 9.5px system-ui;color:#f3e3a6;background:#4a3d12;border-radius:5px;padding:1px 4px;margin-left:4px;vertical-align:1px;white-space:nowrap}
.aum.a2{margin-left:auto;align-self:center}
body.am2 .aum.a1,body:not(.am2) .aum.a2{display:none}
.mr .rz{flex:none;width:22px;height:18px;padding:0;margin-right:4px;border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--mut);font:800 10px system-ui;cursor:pointer;touch-action:manipulation;align-self:center}
.mr .rz[aria-pressed=true]{background:#e8c547;border-color:#e8c547;color:#111}
.mr .r1,.mr .r2{align-items:center}
.mr .r2 .rz{height:15px;width:20px;font-size:9px}
.mr .r1 .mv{flex:1 1 auto}.mr .r2 .pc{flex:1 1 auto}
body.zp2 .rz.z1,body:not(.zp2) .rz.z2{display:none}
.mr.zon .mv{color:#f3e3a6}
.mr.zon .rh{visibility:hidden}
.mr .dd .zl{color:#f3e3a6;font-weight:600}
</style>"""
sub('</head>', css + '</head>')

# --- seed: custom Decidueye vs Totem Gumshoos
seed = {'dir': 'out', 'mine': {'src': 'custom', 'b': 0, 'i': 0}, 'foe': {'k': gum, 'i': 0}, 'field': {}, 'imp': None,
        'custom': [{'id': 'decidueye', 'l': 17, 'na': 'Adamant', 'a': 64, 'i': '', 'iv': iv, 'ev': [0] * 6, 'pid': 'cmock',
                    'm': mv('Spirit Shackle', 'Leaf Blade', 'Bullet Seed', 'Sucker Punch')}],
        'edits': {}, 'saved': {}, 'recent': [gum], 'crit': {}, 'hits': {}, 'mvo': {}, 'z': {}}
head = ('<script>try{if(!localStorage.getItem("psdmg"))localStorage.setItem("psdmg",%s);}catch(e){}'
        'window.setOption=(k,v)=>{document.body.classList.toggle(k==="zpos"?"zp2":"am2",v==="2");};</script>'
        % json.dumps(json.dumps(seed)))
sub('<head>', '<head>' + head)
(root / 'dist' / 'calc-zmock.html').write_text(page, encoding='utf8')
print('dist/calc-zmock.html', gum)

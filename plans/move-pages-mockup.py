"""Mockup of the move / ability pages (plans/move-pages.md): python -I plans/move-pages-mockup.py
Writes plans/move-pages-mockup.html (the inner page) and plans/move-pages-panel.html; data sampled from EI, the
properties, targets and interactions hand-filled (the data isn't normalised yet)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
d = json.loads((root / 'hacks/emerald-imperium/data.json').read_text(encoding='utf8'))
M, MV, AB = d['M'], d['MV'], d['AB']
css = (root / 'template/dex.css').read_text(encoding='utf8')


def mv(n, tg, f):
    r = dict(MV[M.index(n)])
    r.update(n=n, tg=tg, f=f)
    return r


moves = [
    mv('Mach Punch', 'normal', ['contact', 'punch']),
    mv('Earthquake', 'allAdjacent', []),
    mv('Aerial Ace', 'any', ['contact', 'slicing']),
    mv('Stealth Rock', 'foeSide', ['reflectable']),
    mv('Feint', 'normal', ['noprotect']),
    mv('Boomburst', 'allAdjacent', ['sound', 'bypasssub']),
    mv('Rock Slide', 'allAdjacentFoes', ['secondary']),
]
sample = lambda test, k=60: [m for m, r in zip(M, MV) if r.get('bp') not in (None, 'Varies') and test(r)][:k]
# Interactions: ability or item, side (u user / t target), what it does, moves, h = changed by the hack
MI = [
    dict(a='Iron Fist', w='u', e='Power ×1.3', h=1, m=sample(lambda r: 'punching' in r.get('f', []))),
    dict(i='Punching Glove', w='u', e='Power ×1.1, no contact', m=sample(lambda r: 'punching' in r.get('f', []))),
    dict(a='Tough Claws', w='u', e='Power ×1.3', m=sample(lambda r: 'contact' in r.get('f', []))),
    dict(a='Long Reach', w='u', e='No contact', m=sample(lambda r: 'contact' in r.get('f', []))),
    dict(i='Protective Pads', w='u', e='No contact', m=sample(lambda r: 'contact' in r.get('f', []))),
    dict(a='Technician', w='u', e='Power ×1.5', m=sample(lambda r: r['bp'] <= 60)),
    dict(a='Sharpness', w='u', e='Power ×1.5', m=sample(lambda r: 'slicing' in r.get('f', []))),
    dict(a='Sheer Force', w='u', e='Power ×1.3, no added effect', m=sample(lambda r: 'may' in (r.get('d') or '').lower(), 400)),
    dict(a='Serene Grace', w='u', e='Effect chance ×2', m=sample(lambda r: 'may' in (r.get('d') or '').lower(), 400)),
    dict(a='Punk Rock', w='u', e='Power ×1.3', m=sample(lambda r: 'sound' in r.get('f', []))),
    dict(a='Rough Skin', w='t', e='Hurts the attacker', m=sample(lambda r: 'contact' in r.get('f', []), 400)),
    dict(a='Iron Barbs', w='t', e='Hurts the attacker', m=[]),
    dict(i='Rocky Helmet', w='t', e='Hurts the attacker', m=[]),
    dict(a='Static', w='t', e='May paralyse the attacker', m=[]),
    dict(a='Flame Body', w='t', e='May burn the attacker', m=[]),
    dict(a='Poison Point', w='t', e='May poison the attacker', m=[]),
    dict(a='Effect Spore', w='t', e='May poison, paralyse or sleep the attacker', m=[]),
    dict(a='Gooey', w='t', e="Lowers the attacker's Speed", m=[]),
    dict(a='Mummy', w='t', e="Changes the attacker's ability", m=[]),
    dict(a='Fluffy', w='t', e='Damage ×0.5', m=[]),
    dict(a='Armor Tail', w='t', e='Blocks it', m=[]),
    dict(a='Queenly Majesty', w='t', e='Blocks it', m=[]),
    dict(a='Soundproof', w='t', e='Blocks it', m=[]),
    dict(a='Magic Bounce', w='t', e='Bounces it back', m=[]),
    dict(a='Shield Dust', w='t', e='No added effect', m=[]),
    dict(a='Infiltrator', w='u', e='Ignores Substitute and screens', m=[]),
]
# Mockup shortcuts: which moves each interaction lists on the move pages
per = {
    'Mach Punch': ['Iron Fist', 'Punching Glove', 'Tough Claws', 'Long Reach', 'Protective Pads', 'Technician',
                   'Rough Skin', 'Iron Barbs', 'Rocky Helmet', 'Static', 'Flame Body', 'Poison Point', 'Effect Spore',
                   'Gooey', 'Mummy', 'Fluffy', 'Armor Tail', 'Queenly Majesty'],
    'Aerial Ace': ['Sharpness', 'Tough Claws', 'Long Reach', 'Protective Pads', 'Technician', 'Rough Skin',
                   'Iron Barbs', 'Rocky Helmet', 'Static', 'Flame Body', 'Fluffy'],
    'Earthquake': [],
    'Stealth Rock': ['Magic Bounce'],
    'Feint': ['Technician', 'Armor Tail', 'Queenly Majesty'],
    'Boomburst': ['Punk Rock', 'Soundproof'],
    'Rock Slide': ['Sheer Force', 'Serene Grace', 'Shield Dust'],
}
abil = {a[0]: a for a in AB}
abilities = [dict(n=n, d=(abil.get(n) or [n, ''])[1], o=(abil.get(n) or [0] * 6)[5] if len(abil.get(n) or []) > 5 else '')
             for n in ['Iron Fist', 'Sheer Force', 'Rough Skin']]
data = dict(moves=moves, MI=MI, per=per, abilities=abilities, types={m: r['t'] for m, r in zip(M, MV)},
            cats={m: r['c'] for m, r in zip(M, MV)}, bps={m: r['bp'] for m, r in zip(M, MV)})

page = r'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>/*CSS*/
body{padding:8px 8px 40px;margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif}
.tgw{display:flex;gap:10px;align-items:center;margin-top:10px}
.tgg{display:grid;grid-template-columns:repeat(3,22px);gap:3px;flex:none}
.tgg i{height:15px;border-radius:4px;background:var(--panel2);border:1px solid var(--line);font:700 9px/13px system-ui;text-align:center;color:var(--mut);font-style:normal}
.tgg i.on{background:#d9534f;border-color:#d9534f;color:#fff}
.tgg i.one{background:none;border:1.5px dashed #d9534f;color:#d9534f}
.tgg i.me{background:var(--acc);border-color:var(--acc);color:#111}
.tgw .tgt{font-size:13px}
.props{margin:8px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px}
.props li{background:var(--panel2);border-radius:6px;padding:1px 7px;font-size:12.5px}
.props li.x{outline:1px solid var(--acc);color:var(--acc);font-weight:600}
.ix{margin:2px 0 8px}.ix .side{font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;margin:8px 0 2px}
.ix .r{display:flex;gap:8px;padding:3px 0;border-top:1px solid var(--line);font-size:13px}
.ix .r:first-of-type{border-top:0}.ix .r .e{flex:0 0 42%;color:var(--mut)}.ix .r .who{flex:1;overflow-wrap:anywhere}
.ml{display:grid;grid-template-columns:1fr auto auto;gap:2px 6px;align-items:center;font-size:13px}
.ml .bp{font-variant-numeric:tabular-nums;color:var(--mut);text-align:right;min-width:24px}
.chg{color:var(--acc);font-size:11px;font-weight:700;margin-left:4px}
</style></head><body><main id="app"></main>
<script>const D=/*DATA*/;
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
const TC={Normal:'#9fa19f',Fire:'#e62829',Water:'#2980ef',Grass:'#3fa129',Electric:'#fac000',Ice:'#3dcef3',Fighting:'#ff8000',Poison:'#9141cb',Ground:'#915121',Flying:'#81b9ef',Psychic:'#ef4179',Bug:'#91a119',Rock:'#afa981',Ghost:'#704170',Dragon:'#5060e1',Dark:'#624d4e',Steel:'#60a1b8',Fairy:'#ef70ef'};
const ty=t=>`<span class="ty" style="background:${TC[t]||'#888'}">${esc(t)}</span>`;
const cat=c=>`<span class="cat ${c}">${c==='Physical'?'Phys':c==='Special'?'Spec':'Status'}</span>`;
// Target grid: top row the opponents (two adjacent to the user, one far), bottom row the user (left end), adjacent ally, far ally.
// on = always hit, one = the player picks one of these
const TG={normal:['one one . | me one .','One adjacent Pokémon'],any:['one one one | me one one','Any one Pokémon, far ones too'],
 adjacentFoe:['one one . | me . .','One adjacent opponent'],adjacentAlly:['. . . | me one .','One adjacent ally'],
 adjacentAllyOrSelf:['. . . | one one .','The user or an adjacent ally'],allAdjacentFoes:['on on . | me . .','All adjacent opponents'],
 allAdjacent:['on on . | me on .','All adjacent Pokémon'],randomNormal:['one one . | me . .','A random adjacent opponent'],
 self:['. . . | on . .','The user'],allySide:['. . . | on on on',"The user's side"],foeSide:['on on on | me . .','The opposing side'],
 all:['on on on | on on on','The whole field'],scripted:['one one . | me . .','The last Pokémon to hit the user']};
const grid=k=>{const[g,t]=TG[k];const c=g.replace('|','').split(/\s+/).filter(Boolean);const L=['','','','','',''];
 return `<div class="tgw"><div class="tgg">${c.map((x,j)=>`<i class="${x==='.'?'':x}">${j===3?'You':''}</i>`).join('')}</div><div class="tgt"><div class="mut small">Targets</div>${t}</div></div>`;};
const PROP={contact:'Makes contact',punch:'Punching move',bite:'Biting move',slicing:'Slicing move',sound:'Sound move',bullet:'Ball / bomb move',pulse:'Pulse move',powder:'Powder move',wind:'Wind move',dance:'Dance move',heal:'Healing move',
 secondary:'Has an added effect',recoil:'Recoil',drain:'Drains HP',multihit:'Hits more than once',charge:'Two turns',recharge:'User must recharge',binding:'Traps and binds',crash:'Crash damage on a miss',
 noprotect:'Goes through Protect',bypasssub:'Hits through Substitute',gravity:'Unusable under Gravity',defrost:'Thaws the user'};
const EXC=new Set(['noprotect','bypasssub','gravity','defrost']);
const who=x=>x.a?`<a href="#/a/${esc(x.a)}">${esc(x.a)}</a>`:`<a href="#/i/${esc(x.i)}">${esc(x.i)}</a>`;
function move(n){const v=D.moves.find(m=>m.n===n);const f=v.f.filter(x=>PROP[x]);if(v.c!=='Status'&&!v.f.includes('contact'))f.unshift('nocontact');
 const mi=D.per[n].map(a=>D.MI.find(x=>(x.a||x.i)===a));
 const side=w=>{const rs=mi.filter(x=>x.w===w);if(!rs.length)return'';const g=new Map();rs.forEach(x=>{if(!g.has(x.e))g.set(x.e,[]);g.get(x.e).push(x);});
  return `${[...g].map(([e,xs])=>`<div class="r"><span class="e">${esc(e)}</span><span class="who">${xs.map(x=>who(x)+(x.h?'<span class="chg">changed</span>':'')).join(', ')}</span></div>`).join('')}`;};
 return `<a class="back" href="#/">‹ Back</a><div class="card"><h2 style="margin:0 0 6px">${esc(n)}</h2><div>${ty(v.t)} ${cat(v.c)}</div>
 <div class="mvst">${[['Power',v.bp??'-'],['Accuracy',v.ac!=null?v.ac+'%':'Never misses'],['PP',v.pp],['Priority',v.pr>0?'+'+v.pr:v.pr||0]].map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
 ${grid(v.tg)}
 <ul class="props">${f.map(x=>`<li class="${EXC.has(x)?'x':''}">${x==='nocontact'?'No contact':PROP[x]}</li>`).join('')}</ul>
 <p style="margin:8px 0 0">${esc(v.d)}</p></div>
 ${mi.some(x=>x.w==='u')?`<div class="card"><h3>Boosted / changed by</h3><div class="ix">${side('u')}</div></div>`:''}
 ${mi.some(x=>x.w==='t')?`<details class="card psec"><summary><h3>Against it (${mi.filter(x=>x.w==='t').length})</h3></summary><div class="pb"><div class="ix">${side('t')}</div></div></details>`:''}
 <div class="card"><h3>Learned by (…)</h3><div class="mut small">(unchanged)</div></div>`;}
function ability(n){const a=D.abilities.find(x=>x.n===n);const mi=D.MI.filter(x=>x.a===n);
 return `<a class="back" href="#/">‹ Back</a><div class="card"><h2 style="margin:0 0 6px">${esc(n)}</h2><p style="margin:0">${esc(a.d)}</p></div>
 ${mi.map(x=>`<details class="card psec"><summary><h3>Moves it affects (${x.m.length})</h3></summary><div class="pb"><div class="mut small" style="margin-bottom:6px">${x.w==='u'?'':'Against its holder: '}${esc(x.e)}${x.h?'<span class="chg">changed</span>':''}</div>
  <div class="ml">${x.m.map(m=>`<a href="#/m/${esc(m)}">${esc(m)}</a><span>${ty(D.types[m])}</span><span class="bp">${D.bps[m]??'-'}</span>`).join('')}</div></div></details>`).join('')}
 <div class="card"><h3>Pokémon with it (…)</h3><div class="mut small">(unchanged)</div></div>`;}
function home(){return `<div class="card"><h3>Moves</h3>${D.moves.map(m=>`<div><a href="#/m/${esc(m.n)}">${esc(m.n)}</a> <span class="mut small">${m.tg}</span></div>`).join('')}</div>
 <div class="card"><h3>Abilities</h3>${D.abilities.map(a=>`<div><a href="#/a/${esc(a.n)}">${esc(a.n)}</a></div>`).join('')}</div>`;}
function route(){const h=decodeURIComponent(location.hash);const app=document.getElementById('app');
 app.innerHTML=h.startsWith('#/m/')?move(h.slice(4)):h.startsWith('#/a/')&&D.abilities.some(a=>a.n===h.slice(4))?ability(h.slice(4)):h.startsWith('#/i/')||h.startsWith('#/a/')?`<a class="back" href="javascript:history.back()">‹ Back</a><div class="card"><h2>${esc(h.slice(4))}</h2><div class="mut small">(not in the mockup)</div></div>`:home();scrollTo(0,0);}
addEventListener('hashchange',route);route();
</script></body></html>'''
page = page.replace('/*CSS*/', css).replace('/*DATA*/', json.dumps(data, ensure_ascii=False).replace('<', '\\u003c'))
(root / 'plans/move-pages-mockup.html').write_text(page, encoding='utf8')
panel = '<div style="display:flex;flex-wrap:wrap;gap:4px">' + ''.join(
    f'<button onclick="thorFrame().location.hash={json.dumps(h)}">{t}</button>' for t, h in
    [('List', '#/')] + [(m['n'], '#/m/' + m['n']) for m in moves] + [(a, '#/a/' + a) for a in ['Iron Fist', 'Sheer Force', 'Rough Skin']]) + '</div>'
(root / 'plans/move-pages-panel.html').write_text(panel, encoding='utf8')
print('ok')

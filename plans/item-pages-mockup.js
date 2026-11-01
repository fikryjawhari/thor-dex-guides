// Item pages decide mockup, injected after the guide's own script by plans/item-pages-mockup.py. Mockup only: it
// reuses the template's globals (render, itemBox, moveDetail, detail, sectionHTML, pickCard, moveList, psec, sprl,
// plink, SR ...) and patches some of them in place. The Items tab layout (panel) is kept in localStorage 'itmock'.
(()=>{
const X=window.ITX,OPT=Object.assign({layout:'dex'},JSON.parse(localStorage.getItem('itmock')||'{}'));
const isTM=n=>/^(TM|HM|TR)\d/.test(n);
// ---- index: everything the guide says about each item, by name
const IS={},get=n=>IS[n]??={rows:[],walk:[],wild:[],tr:[],mi:[],mega:[]};
(D.IT||[]).forEach((sec,si)=>{if(sec.k==='npc'||sec.n==='Move Tutors')return;
 sec.r.forEach((r,ri)=>get(r[0]).rows.push({si,ri,box:sec.n,k:sec.k,sub:r[4]||'',text:r[1],miss:!!r[3],link:r[2]}));});
D.WK.splits.forEach((sp,si)=>sp.st.forEach((s,ti)=>(s.it||[]).forEach(i=>{const e=get(i[1]);if(!e.walk.some(w=>w[0]===si&&w[1]===ti))e.walk.push([si,ti,s.n]);})));
// Wild holders with odds (X.odds, one row per Pokémon; Mega forms never appear in the wild)
Object.entries(X.odds).forEach(([id,list])=>{const p=byId[id];if(p)list.forEach(([n,pct])=>get(n).wild.push([p,pct]));});
P.forEach(p=>{if(p.stone&&p.g===1)get(p.stone).mega.push(p);});
TRS.forEach(t=>{const by={};[...t.p,...(t.pt||[]).flatMap(x=>x.p||[])].forEach(m=>{if(m.i)(by[m.i]??=[]).push(m);});Object.entries(by).forEach(([n,ms])=>get(n).tr.push([t,ms]));});
(D.MI||[]).forEach(r=>{if(r.i)get(r.i).mi.push(r);});
const tmOf=move=>Object.keys(IS).filter(n=>IS[n].rows.some(r=>r.k==='tm'&&r.link===move));
// ---- battle text: hand-written for the panel's samples (the target wording), Showdown's shortDesc for the rest
const HAND={
 'Leech Seed':'Seeds the target. At the end of each turn it loses 1/8 of its max HP and the Pokémon in the user\'s spot recovers that much (×1.3 with Big Root). Ends when the target switches out or spins it off. Grass types can\'t be seeded.',
 'Calm Mind':'Raises the user\'s Sp. Atk and Sp. Def by 1 stage each.',
 'Toxic':'Badly poisons the target: it loses 1/16 of its max HP after its first turn, 2/16 after the next, and 1/16 more each turn after. Never misses when a Poison type uses it. Poison and Steel types are immune.',
 'Bullet Seed':'Hits 2-5 times: 2 or 3 hits 35% each, 4 or 5 hits 15% each. Always 5 with Skill Link.',
 'Life Orb':'Damaging moves do 1.3× damage. The holder then loses 1/10 of its max HP (not with Magic Guard, or on a move Sheer Force boosted).',
 'Leftovers':'Restores 1/16 of the holder\'s max HP at the end of every turn.',
 'Sitrus Berry':'Eaten when the holder drops to 1/2 HP or less: restores 1/4 of its max HP. Once.',
 'Dark Gem':'The holder\'s first Dark move does 1.3× damage; the gem is used up.',
 'Grass Gem':'The holder\'s first Grass move does 1.3× damage; the gem is used up.',
 'Abomasite':'Abomasnow holding it can Mega Evolve. It can\'t be knocked off, stolen or swapped away from Abomasnow.',
 'Butterfrite':'Butterfree holding it can Mega Evolve. It can\'t be knocked off, stolen or swapped away from Butterfree.',
 'Dream Ball':'Catch rate ×4 on a sleeping Pokémon, ×1 otherwise.'};
const fxItem=n=>HAND[n]||(X.items[n]||{}).fx||'';
const fxMove=i=>HAND[M[i]]||X.mvfx[i]||'';
const fxBox=t=>t?`<div class="ifx"><div class="ifxh">In battle</div>${esc(t)}</div>`:'';
// ---- look
const st0=document.createElement('style');st0.textContent=`
.iic{display:inline-block;width:24px;height:24px;flex:none;background-repeat:no-repeat;vertical-align:-6px;margin-right:4px;image-rendering:pixelated}
.iic.s{width:18px;height:18px;vertical-align:-4px;margin-right:3px}.iic.m{width:32px;height:32px;margin:0}
.ihd{display:flex;align-items:center;gap:6px;margin:0 0 4px}.ihd h2{margin:0}
.ikind{margin:0 0 6px}.ipg p{margin:6px 0 0}
.ifx{margin-top:8px;background:var(--panel2);border-left:3px solid var(--acc);border-radius:6px;padding:6px 8px;font-size:14px;line-height:1.4}
.ifxh{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--acc);margin-bottom:2px}
.iwhere ul{margin:2px 0 6px;padding-left:18px}.iwhere li{margin:2px 0;font-size:13px}.iwhere .ibox{margin-top:6px}
.iwalk{margin-top:8px;font-size:13px;line-height:1.7}.iwalk a{margin-right:10px;display:inline-block}
.imega{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}.imega .arrow{color:var(--mut)}
.it-held .learn-sprite{width:44px;padding-left:0;padding-right:4px;white-space:nowrap}.it-held .lrn td{padding-left:3px;padding-right:3px}
.it-held .learn-sprite .sprl+.sprl{margin-left:-8px}.it-held td.n{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.alsotm{margin-top:6px;font-size:14px}
.phi div{margin:3px 0}.phi .pct{color:var(--mut);font-variant-numeric:tabular-nums;margin-left:4px}.phi .sh{margin-top:8px}
.ilist{margin:4px 0}.ilist .row{padding:4px 8px;gap:8px}.ilist .rt{display:block}.ilist .nm{display:block}
.ilist .iloc{display:block;font-size:12px;color:var(--mut);line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ilist .ino{width:32px;flex:none}.ilist .bst{align-self:center}`;document.head.appendChild(st0);
const icon=(n,size)=>{const x=X.items[n];const z=size==='s'?18:size==='m'?32:24;if(!x||x.ic<0)return size==='m'?'<i class="ino"></i>':'';const s=z/24;
 return `<i class="iic ${size||''}" style="background-image:url(${X.sheet});background-size:${384*s}px auto;background-position:-${x.ic%16*z}px -${Math.floor(x.ic/16)*z}px"></i>`;};
const ihref=n=>'#/i/'+encodeURIComponent(n);
const ilink=(n,label)=>`<a class="itl" href="${ihref(n)}">${icon(n,'s')}${esc(label??n)}</a>`;
// ---- Items tab: every name opens its item page (TMs and Mega Stones too); Move Tutors keep the move page
itemRow=function(sec,r){const nm=sec.k==='npc'?esc(r[0]):sec.n==='Move Tutors'&&r[2]!=null?`<a href="#/m/${r[2]}">${esc(r[0])}</a>`:ilink(r[0]);
 return `<tr><td>${nm}</td><td>${esc(r[1]).replace(/\n/g,'<br>')}${r[3]?'<span class="warn">MISSABLE</span>':''}</td></tr>`;};
// Proposed layout: dex-style rows (icon, name, the first place under it, "+N" places) inside the same boxes and sub-headings
const dexRow=(sec,r)=>{const lines=String(r[1]).split('\n'),tm=sec.k==='tm'&&r[2]!=null&&MV[r[2]];
 const href=sec.n==='Move Tutors'&&r[2]!=null?'#/m/'+r[2]:ihref(r[0]);
 return `<a class="row" href="${href}">${sec.n==='Move Tutors'?'':icon(r[0],'m')}<span class="rt"><span class="nm">${esc(r[0])}${r[3]?'<span class="warn">MISSABLE</span>':''}</span><span class="iloc">${esc(lines[0])}</span></span>${tm&&tm.t?ty(tm.t):''}${lines.length>1?`<span class="bst">+${lines.length-1}</span>`:''}</a>`;};
const baseBox=itemBox;
itemBox=function(si){const sec=D.IT[si];if(OPT.layout!=='dex'||sec.k==='npc')return baseBox(si);
 const subs=[];sec.r.forEach(r=>{const g=r[4]||'';if(!subs.length||subs[subs.length-1][0]!==g)subs.push([g,[]]);subs[subs.length-1][1].push(r);});
 const list=rs=>`<div class="list ilist">${rs.map(r=>dexRow(sec,r)).join('')}</div>`;
 return (sec.note?`<div class="mut small" style="margin:6px 0">${esc(sec.note)}</div>`:'')+(subs.filter(([g])=>g).length>1?segBar('it-sp'):'')+
  subs.map(([g,rs])=>g?sectionHTML(esc(si+'.'+g),esc(g),`<span class="mut small">${rs.length}</span>`,list(rs),IO.s[si+'.'+g]===1):list(rs)).join('')+
  `<button class="endbar sp" hidden>${UPI}<span>Collapse ${esc(sec.n)}</span></button>`;};
// ---- the item page
function kindOf(e){const rows=e.rows.filter(r=>r.box!=='Shops'&&r.box!=='Valuables');const r=rows[0]||e.rows[0];
 if(!r)return e.wild.length?'Wild Pokémon hold it':e.tr.length?'Only trainers hold it':'';return r.box==='Shops'?r.sub:r.sub&&r.sub!==r.box?r.box+' · '+r.sub:r.box;}
function megaBlock(e){return e.mega.map(p=>{const b=P.find(x=>x.dex===p.dex&&x.g!==1&&!x.fc);
 return `<div class="imega">${b?sprl(b.id,'s40')+plink(b.id):''}<span class="arrow">→</span>${sprl(p.id,'s40')}${plink(p.id)}</div>${p.nu?`<div class="mut small">Not obtainable in ${esc(CF.name)}; trainers use it.</div>`:''}`;}).join('');}
function whereCard(n,e,title){const rows=e.rows;const lines=rows.reduce((a,r)=>a+String(r.text).split('\n').length,0);if(!rows.length&&!e.walk.length)return '';
 const boxes=new Set(rows.map(r=>r.box)).size>1;
 const body=rows.map(r=>`${boxes?`<div class="mut small ibox">${esc(r.box)}</div>`:''}<ul>${String(r.text).split('\n').map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${r.miss?'<span class="warn">MISSABLE</span>':''}`).join('')+
  (e.walk.length?`<div class="iwalk"><span class="mut small">Walkthrough:</span> ${e.walk.map(([si,ti,s])=>`<a href="javascript:SR.jumpStop(${si},${ti})">${esc(s)}</a>`).join('')}</div>`:'');
 return `<div class="card iwhere">${sectionHTML('iw',`${title||'Where to find'}${lines?' ('+lines+')':''}`,'',body,true)}</div>`;}
const heldGroups=e=>[{key:'w',label:'Wild',rows:[...e.wild].sort((a,b)=>b[1]-a[1]||a[0].name.localeCompare(b[0].name))},{key:'t',label:'Trainers',rows:e.tr}].filter(g=>g.rows.length);
const heldTable=rows=>`<table class="lrn">${rows.map(r=>r[0].k!=null?(([t,ms])=>`<tr><td class="learn-sprite">${ms.map(m=>sprl(m.id,'s40')).join('')}</td><td><a href="#/tr/${encodeURIComponent(t.k)}">${esc(t.n)}</a><div class="mut small">${esc(t.h||t.loc||'')} · ${esc(t.g)}</div></td></tr>`)(r)
 :(([p,pct])=>`<tr><td class="learn-sprite">${sprl(p.id,'s40')}</td><td>${plink(p.id)}<div>${p.t.map(ty).join('')}</div></td><td class="n">${pct}%</td></tr>`)(r)).join('')}</table>`;
function itemMoves(e){const rows=e.mi.filter(r=>r.m.length);if(!rows.length)return '';
 const body=['u','t'].map(side=>{const fx=new Map();rows.filter(r=>r.w===side).forEach(r=>{const f=fx.get(r.e)||{e:r.e,h:0,m:new Set()};r.m.forEach(m=>f.m.add(m));f.h||=r.h;fx.set(r.e,f);});
  return fx.size?`<div class="ab-side"><div class="mut small">${side==='u'?"Its holder's moves":'Moves used against its holder'}</div>${[...fx.values()].map(f=>`<div class="ab-effect">${esc(f.e)}${f.h?'<span class="interaction-changed">changed</span>':''}</div>${moveList(f.m)}`).join('')}</div>`:'';}).join('');
 return `<div class="card ab-affects">${sectionHTML('im',`Moves it affects (${new Set(rows.flatMap(r=>r.m)).size})`,'',body,false)}</div>`;}
function itemDetail(n){fil.innerHTML='';const e=IS[n],x=X.items[n];if(!e){app.innerHTML='<a class="back" href="javascript:history.back()">‹ Back</a><p>Not found.</p>';return;}
 const tm=isTM(n)&&e.rows.find(r=>r.k==='tm'&&r.link!=null);
 // A TM page is the move's row and where the TM is; the move page has the rest.
 const top=tm?moveList([tm.link]):(x&&x.d?`<p>${esc(x.d)}</p>`:'')+(e.mega.length?'':fxBox(fxItem(n)));
 const held=heldGroups(e);
 app.innerHTML=`<div class="backl"><a class="back" href="javascript:history.back()">‹ Back</a></div>
 <div class="card ipg"><div class="ihd">${icon(n,'m')}<h2>${esc(n)}</h2></div><div class="mut small ikind">${esc(kindOf(e))}</div>${top}${megaBlock(e)}</div>
 ${whereCard(n,e)}
 ${held.length?pickCard('it-held','Held by','Held by',held,held.reduce((a,g)=>a+g.rows.length,0),'ih:',heldTable):''}
 ${itemMoves(e)}`;
 if(held.length)bindPick('it-held',held,'ih:',heldTable);colBind(app);window.scrollTo(0,0);}
// ---- move page: In battle box, "Also TM006 Toxic" linking the TM page (instead of its place line), the TM's Where to find
const baseMove=moveDetail;
moveDetail=function(i){baseMove(i);const top=app.querySelector('.card');if(!top)return;const tms=tmOf(i);
 top.querySelectorAll(':scope>div').forEach(d=>{const b=d.querySelector(':scope>b');if(b&&/^(TM|HM|TR)\d+:$/.test(b.textContent))d.remove();});
 const desc=[...top.querySelectorAll(':scope>p')].pop()||top.querySelector('.move-effects')||top.querySelector('.move-props');
 const add=fxBox(fxMove(i))+(tms.length?`<div class="alsotm">Also ${tms.map(n=>ilink(n)).join(', ')}</div>`:'');
 if(desc)desc.insertAdjacentHTML('afterend',add);else top.insertAdjacentHTML('beforeend',add);
 if(tms.length)top.insertAdjacentHTML('afterend',tms.map(n=>whereCard(n,IS[n],'Where to find '+n.split(' ')[0])).join(''));colBind(app);};
// ---- Pokémon page: Held items (wild odds; what trainers give it), after Where to find
const baseDetail=detail;
detail=function(id){baseDetail(id);const p=byId[id];if(!p)return;
 app.querySelectorAll('.mut.small').forEach(d=>{if(/^Wild held item/.test(d.textContent))d.remove();});
 const wild=X.odds[id]||[],tc={};(TRUSE[id]||[]).forEach(t=>t.p.forEach(m=>{if(m.id===id&&m.i)tc[m.i]=(tc[m.i]||0)+1;}));
 const trs=Object.entries(tc).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));if(!wild.length&&!trs.length)return;
 const body=`<div class="phi">${wild.length?`<div class="mut small">Wild</div>${wild.map(([n,pct])=>`<div>${ilink(n)}<span class="pct">${pct}%</span></div>`).join('')}`:`<div class="mut small">Wild: none</div>`}${trs.length?`<div class="mut small sh">Trainers give it</div>${trs.map(([n,c])=>`<div>${ilink(n)}<span class="pct">×${c}</span></div>`).join('')}`:''}</div>`;
 const wh=app.querySelector('details.psec[data-s="wh"]');(wh||app.lastElementChild).insertAdjacentHTML('afterend',psec('hi','Held items',body));};
// ---- route #/i/<name>
const base=render;
render=function(fromInput){const h=location.hash||'#/';
 if(!h.startsWith('#/i/'))return base(fromInput);
 if(st.view===''&&!fromInput)st.listScroll=Object.assign(keepAnchor(),{z:cvSizes()});
 if(CF.calc){document.body.classList.remove('calc-route');window.CALC?.leave();}
 document.body.dataset.v='i';PB.hidden=true;if(RJ)RJ.hidden=true;setTab('i');itemDetail(decodeURIComponent(h.slice(4)));st.view='i';};
// ---- links from the other places that name an item (the build does these in the template; here a text pass)
const NAMES=Object.keys(IS).filter(n=>n.length>2).sort((a,b)=>b.length-a.length);
const RX=new RegExp('(?<![\\w-])('+NAMES.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\w-])','g');
function linkText(node){const s=node.data;RX.lastIndex=0;if(!RX.test(s))return;RX.lastIndex=0;const f=document.createDocumentFragment();let at=0;
 for(const m of s.matchAll(RX)){f.append(s.slice(at,m.index));const t=document.createElement('template');t.innerHTML=ilink(m[1]);f.append(t.content);at=m.index+m[1].length;}
 if(!at)return;f.append(s.slice(at));node.replaceWith(f);}
function linkify(){app.querySelectorAll('.itbl.wt td:first-child,.ab,.interaction-who>span,.card .mut').forEach(el=>{
  if(el.dataset.il||el.closest('a,.ipg,.iwhere,.it-held,.phi'))return;
  if(el.matches('.mut')&&!/^Mega form/.test(el.textContent))return;el.dataset.il=1;
  [...el.childNodes].forEach(c=>{if(c.nodeType===3)linkText(c);});
  // TM and Mega Stone names on walkthrough rows link to their item pages
  el.querySelectorAll(':scope>a[href^="#/p/"],:scope>a[href^="#/m/"]').forEach(a=>{if(IS[a.textContent])a.outerHTML=ilink(a.textContent);});});}
let raf=0;new MutationObserver(()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;linkify();});}).observe(app,{childList:true,subtree:true});
// ---- panel
const first=f=>Object.keys(IS).find(f);
const SAMPLES={
 life:()=>ihref('Life Orb'),leftovers:()=>ihref('Leftovers'),
 mega:()=>ihref(IS.Abomasite?'Abomasite':first(n=>IS[n].mega.length&&IS[n].rows.length)),
 tm:()=>ihref(first(n=>isTM(n)&&/Toxic|Calm Mind|Bullet Seed/.test(n))||first(n=>isTM(n)&&IS[n].rows.length)),
 berry:()=>ihref('Sitrus Berry'),
 key:()=>ihref(first(n=>IS[n].rows.some(r=>r.box==='Key Items'))||first(n=>IS[n].rows.some(r=>r.box==='Valuables'))||first(n=>IS[n].rows.some(r=>r.box==='Stats and Abilities'))),
 trainer:()=>ihref(first(n=>!IS[n].rows.length&&!IS[n].wild.length&&IS[n].tr.length)),
 nodesc:()=>ihref(first(n=>!isTM(n)&&IS[n].rows.length&&!(X.items[n]||{}).d)),
 hack:()=>ihref(['Butterfrite','Kicking Shoes'].find(n=>IS[n])||'Life Orb'),
 leech:()=>'#/m/'+M.indexOf('Leech Seed'),calm:()=>'#/m/'+M.indexOf('Calm Mind'),
 mon:()=>'#/p/'+(P.find(p=>p.n==='Butterfree')||{}).id};
window.setOption=(k,v)=>{if(k==='sample'){location.hash=SAMPLES[v]?.()||'#/items';return;}
 OPT[k]=v;localStorage.setItem('itmock',JSON.stringify(OPT));if(location.hash==='#/items')render(false);else location.hash='#/items';};
render(false);
})();

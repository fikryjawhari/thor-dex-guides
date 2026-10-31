// Item pages decide mockup, injected after the guide's own script by plans/item-pages-mockup.py. Mockup only: it
// reuses the template's globals (render, itemRow, sectionHTML, pickCard, moveList, sprl, plink, SR ...) and patches
// render / itemRow in place. Options (panel) are kept in localStorage 'itmock' so a reload keeps them.
(()=>{
const X=window.ITX,OPT=Object.assign({layout:'rows',icons:'on',tm:'move',mega:'item'},JSON.parse(localStorage.getItem('itmock')||'{}'));
const isTM=n=>/^(TM|HM|TR)\d/.test(n);
// ---- index: everything the guide says about each item, by name
const IS={},get=n=>IS[n]??={rows:[],walk:[],wild:[],tr:[],mi:[],mega:[]};
(D.IT||[]).forEach((sec,si)=>{if(sec.k==='npc'||sec.n==='Move Tutors')return;
 sec.r.forEach((r,ri)=>get(r[0]).rows.push({si,ri,box:sec.n,k:sec.k,sub:r[4]||'',text:r[1],miss:!!r[3],link:r[2]}));});
D.WK.splits.forEach((sp,si)=>sp.st.forEach((s,ti)=>(s.it||[]).forEach(i=>{const e=get(i[1]);if(!e.walk.some(w=>w[0]===si&&w[1]===ti))e.walk.push([si,ti,s.n,sp.n]);})));
P.forEach(p=>{(p.hi||[]).forEach(n=>get(n).wild.push(p));if(p.stone&&p.g===1)get(p.stone).mega.push(p);});
TRS.forEach(t=>{const by={};[...t.p,...(t.pt||[]).flatMap(x=>x.p||[])].forEach(m=>{if(m.i)(by[m.i]??=[]).push(m);});Object.entries(by).forEach(([n,ms])=>get(n).tr.push([t,ms]));});
(D.MI||[]).forEach(r=>{if(r.i)get(r.i).mi.push(r);});
// ---- look
const st0=document.createElement('style');st0.textContent=`
.iic{display:inline-block;width:24px;height:24px;flex:none;background-repeat:no-repeat;vertical-align:-6px;margin-right:4px;image-rendering:pixelated}
.iic.s{width:18px;height:18px;vertical-align:-4px;margin-right:3px}
.ihd{display:flex;align-items:center;gap:6px;margin:0 0 4px}.ihd h2{margin:0}.ihd .iic{width:32px;height:32px;margin:0}
.ikind{margin:0 0 6px}.ipg p{margin:6px 0 0}
.iwhere ul{margin:2px 0 6px;padding-left:18px}.iwhere li{margin:2px 0;font-size:13px}.iwhere .ibox{margin-top:6px}
.iwalk{margin-top:8px;font-size:13px;line-height:1.7}.iwalk a{margin-right:10px;display:inline-block}
.imega{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}.imega .arrow{color:var(--mut)}
.it-held .learn-sprite{width:44px;padding-left:0;padding-right:4px;white-space:nowrap}.it-held .lrn td{padding-left:3px;padding-right:3px}
.it-held .learn-sprite .sprl+.sprl{margin-left:-8px}
.itbl tr.ix1 td{width:auto}.itbl .imore{color:var(--mut);font-weight:400}`;document.head.appendChild(st0);
const icon=(n,small)=>{const x=X.items[n];if(OPT.icons!=='on'||!x||x.ic<0)return '';const z=small?18:32,s=z/24;
 return `<i class="iic${small?' s':''}" style="background-image:url(${X.sheet});background-size:${384*s}px auto;background-position:-${x.ic%16*z}px -${Math.floor(x.ic/16)*z}px"></i>`;};
const ihref=n=>'#/i/'+encodeURIComponent(n);
const ilink=(n,label)=>`<a class="itl" href="${ihref(n)}">${icon(n,true)}${esc(label??n)}</a>`;
// ---- Items tab: three row layouts; TMs go to the move page or their own item page
const tmToMove=(sec,r)=>sec.k==='tm'&&r[2]!=null&&(OPT.tm==='move'||sec.n==='Move Tutors');
itemRow=function(sec,r){const nm=sec.k==='npc'?esc(r[0]):tmToMove(sec,r)?`<a href="#/m/${r[2]}">${esc(r[0])}</a>`:ilink(r[0]);
 const miss=r[3]?'<span class="warn">MISSABLE</span>':'';
 if(OPT.layout==='index'&&sec.k!=='npc')return `<tr class="ix1"><td colspan="2">${nm}${miss}</td></tr>`;
 const lines=String(r[1]).split('\n');
 const text=OPT.layout==='line'&&sec.k!=='npc'?esc(lines[0])+(lines.length>1?` <span class="imore">+${lines.length-1} more</span>`:''):esc(r[1]).replace(/\n/g,'<br>');
 return `<tr><td>${nm}</td><td>${text}${miss}</td></tr>`;};
// ---- the item page
function kindOf(e){const rows=e.rows.filter(r=>r.box!=='Shops'&&r.box!=='Valuables');const r=rows[0]||e.rows[0];
 if(!r)return e.wild.length?'Not in the item lists; wild Pokémon hold it':e.tr.length?'Only trainers hold it':'';return r.box==='Shops'?r.sub:r.sub&&r.sub!==r.box?r.box+' · '+r.sub:r.box;}
function megaBlock(e){return e.mega.map(p=>{const b=P.find(x=>x.dex===p.dex&&x.g!==1&&!x.fc);
 return `<div class="imega">${b?sprl(b.id,'s40')+plink(b.id):''}<span class="arrow">→</span>${sprl(p.id,'s40')}${plink(p.id)}</div>${p.nu?`<div class="mut small">Not obtainable in ${esc(CF.name)}; trainers use it.</div>`:''}`;}).join('');}
function whereCard(n,e){const rows=e.rows;
 const lines=rows.reduce((a,r)=>a+String(r.text).split('\n').length,0);if(!rows.length&&!e.walk.length)return '';
 const boxes=new Set(rows.map(r=>r.box)).size>1;
 const body=rows.map(r=>`${boxes?`<div class="mut small ibox">${esc(r.box)}</div>`:''}<ul>${String(r.text).split('\n').map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${r.miss?'<span class="warn">MISSABLE</span>':''}`).join('')+
  (e.walk.length?`<div class="iwalk"><span class="mut small">Walkthrough:</span> ${e.walk.map(([si,ti,s])=>`<a href="javascript:SR.jumpStop(${si},${ti})">${esc(s)}</a>`).join('')}</div>`:'');
 return `<div class="card iwhere">${sectionHTML('iw',`Where to find${lines?' ('+lines+')':''}`,'',body,true)}</div>`;}
const heldGroups=e=>[{key:'w',label:'Wild',rows:e.wild},{key:'t',label:'Trainers',rows:e.tr}].filter(g=>g.rows.length);
const heldTable=rows=>`<table class="lrn">${rows.map(r=>Array.isArray(r)?(([t,ms])=>`<tr><td class="learn-sprite">${ms.map(m=>sprl(m.id,'s40')).join('')}</td><td><a href="#/tr/${encodeURIComponent(t.k)}">${esc(t.n)}</a><div class="mut small">${esc(t.h||t.loc||'')} · ${esc(t.g)}</div></td></tr>`)(r)
 :`<tr><td class="learn-sprite">${sprl(r.id,'s40')}</td><td>${plink(r.id)}<div>${r.t.map(ty).join('')}</div></td></tr>`).join('')}</table>`;
function itemMoves(e){const rows=e.mi.filter(r=>r.m.length);if(!rows.length)return '';
 const body=['u','t'].map(side=>{const fx=new Map();rows.filter(r=>r.w===side).forEach(r=>{const f=fx.get(r.e)||{e:r.e,h:0,m:new Set()};r.m.forEach(m=>f.m.add(m));f.h||=r.h;fx.set(r.e,f);});
  return fx.size?`<div class="ab-side"><div class="mut small">${side==='u'?"Its holder's moves":'Moves used against its holder'}</div>${[...fx.values()].map(f=>`<div class="ab-effect">${esc(f.e)}${f.h?'<span class="interaction-changed">changed</span>':''}</div>${moveList(f.m)}`).join('')}</div>`:'';}).join('');
 return `<div class="card ab-affects">${sectionHTML('im',`Moves it affects (${new Set(rows.flatMap(r=>r.m)).size})`,'',body,false)}</div>`;}
function itemDetail(n){fil.innerHTML='';const e=IS[n],x=X.items[n];if(!e){app.innerHTML='<a class="back" href="javascript:history.back()">‹ Back</a><p>Not found.</p>';return;}
 const tm=isTM(n)&&e.rows.find(r=>r.k==='tm'&&r.link!=null);
 const desc=tm?moveList([tm.link]):x&&x.d?`<p>${esc(x.d)}</p>`:'';
 const held=heldGroups(e);
 app.innerHTML=`<div class="backl"><a class="back" href="javascript:history.back()">‹ Back</a></div>
 <div class="card ipg"><div class="ihd">${icon(n)}<h2>${esc(n)}</h2></div><div class="mut small ikind">${esc(kindOf(e))}</div>${desc}${megaBlock(e)}</div>
 ${whereCard(n,e)}
 ${held.length?pickCard('it-held','Held by','Held by',held,held.reduce((a,g)=>a+g.rows.length,0),'ih:',heldTable):''}
 ${itemMoves(e)}`;
 if(held.length)bindPick('it-held',held,'ih:',heldTable);colBind(app);window.scrollTo(0,0);}
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
 for(const m of s.matchAll(RX)){if(isTM(m[1])&&OPT.tm==='move')continue;f.append(s.slice(at,m.index));const t=document.createElement('template');t.innerHTML=ilink(m[1]);f.append(t.content);at=m.index+m[1].length;}
 if(!at)return;f.append(s.slice(at));node.replaceWith(f);}
function linkify(){app.querySelectorAll('.itbl.wt td:first-child,.ab,.interaction-who>span,.hero~* .mut,.card .mut').forEach(el=>{
  if(el.dataset.il||el.closest('a,.ipg,.iwhere,.it-held'))return;const tx=el.textContent;
  if(el.matches('.mut')&&!/^(Wild held item|Mega form)/.test(tx))return;el.dataset.il=1;
  [...el.childNodes].forEach(c=>{if(c.nodeType===3)linkText(c);});
  // Mega Stone links on walkthrough rows go to the item page when the mega option says so
  if(OPT.mega==='item')el.querySelectorAll(':scope>a[href^="#/p/"]').forEach(a=>{if(IS[a.textContent]&&IS[a.textContent].mega.length)a.outerHTML=ilink(a.textContent);});});
 if(OPT.mega==='item')app.querySelectorAll('.itbl:not(.wt) td:first-child>a[href^="#/p/"]').forEach(a=>{if(IS[a.textContent]?.mega.length)a.outerHTML=ilink(a.textContent);});}
let raf=0;new MutationObserver(()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;linkify();});}).observe(app,{childList:true,subtree:true});
// ---- panel
const SAMPLES={
 life:()=>'Life Orb',leftovers:()=>'Leftovers',
 mega:()=>Object.keys(IS).find(n=>IS[n].mega.length&&IS[n].rows.length),
 tm:()=>Object.keys(IS).find(n=>isTM(n)&&IS[n].rows.length),
 berry:()=>IS['Sitrus Berry']?'Sitrus Berry':Object.keys(IS).find(n=>/Berry$/.test(n)),
 key:()=>Object.keys(IS).find(n=>IS[n].rows.some(r=>r.box==='Key Items'))||Object.keys(IS).find(n=>IS[n].rows.some(r=>r.box==='Valuables')),
 trainer:()=>Object.keys(IS).find(n=>!IS[n].rows.length&&!IS[n].wild.length&&IS[n].tr.length),
 nodesc:()=>Object.keys(IS).find(n=>!isTM(n)&&IS[n].rows.length&&!(X.items[n]||{}).d),
 hack:()=>['Butterfrite','Kicking Shoes','Dusknoirite'].find(n=>IS[n])||Object.keys(IS).find(n=>IS[n].mega.some(p=>p.nu))};
window.setOption=(k,v)=>{if(k==='sample'){const n=SAMPLES[v]?.();location.hash=n?ihref(n):'#/items';return;}
 OPT[k]=v;localStorage.setItem('itmock',JSON.stringify(OPT));location.reload();};
render(false);
})();

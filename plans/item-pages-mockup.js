// Item pages decide mockup, injected after the guide's own script by plans/item-pages-mockup.py. Mockup only: it
// reuses the template's globals (render, itemBox, moveDetail, detail, sectionHTML, pickCard, moveList, psec, sprl,
// plink, SR ...) and patches some of them in place. The Items tab layout (panel) is kept in localStorage 'itmock'.
(()=>{
const X=window.ITX,OPT=Object.assign({layout:'kinds'},JSON.parse(localStorage.getItem('itmock')||'{}'));
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
.iic{background-image:var(--isheet);display:inline-block;width:24px;height:24px;flex:none;background-repeat:no-repeat;vertical-align:-6px;margin-right:4px;image-rendering:pixelated}
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
.ilist .ino{width:32px;flex:none}.irow .iloc{white-space:normal;margin-top:1px}.irow .imore{display:block;font-size:12px;color:var(--acc)}.itabs{margin:4px 0 6px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.itabs button{flex:none}.irow .nm{overflow-wrap:anywhere}.ilist .irow{align-items:flex-start}.irow .iic.m,.irow .ino{margin-top:2px}.isub{margin:8px 0 2px}.ipg a.row{text-decoration:none}.iwk{font-size:12px;white-space:nowrap;margin-left:2px}.itbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 2px 6px}.itclr{background:var(--panel2);color:var(--fg);border:0;border-radius:8px;padding:5px 10px;font-size:13px;font-weight:600}.itk.iwt{float:left;margin:2px 6px 0 0;width:16px;height:16px;accent-color:var(--acc)}.irow .nm a{color:inherit}.irow .iloc.itl2,.iwl .iloc.itl2{display:flex;gap:6px;align-items:flex-start}.itl2 input{margin:1px 0 0;flex:none;width:16px;height:16px;accent-color:var(--acc)}.idone{opacity:.55}.iprog{font-size:12px;color:var(--mut);font-weight:600}.irow .imore{display:block;font-size:12px;color:var(--acc);margin-top:2px}.tut .tmoves{display:block;margin-top:6px;font-size:14px}.tut .tm1{margin:3px 0}.tut .tcost{font-size:12px;color:var(--mut)}.iwl .iloc{display:flex;font-size:13px;color:var(--fg);margin:4px 0}.iwl span.iloc{display:block}.ilist .bst{align-self:center}`;document.head.appendChild(st0);document.documentElement.style.setProperty('--isheet','url('+X.sheet+')');
const icon=(n,size)=>{const x=X.items[n];const z=size==='s'?18:size==='m'?32:24;if(!x||x.ic<0)return size==='m'?'<i class="ino"></i>':'';const s=z/24;
 return `<i class="iic ${size||''}" style="background-size:${384*s}px auto;background-position:-${x.ic%16*z}px -${Math.floor(x.ic/16)*z}px"></i>`;};
const ihref=n=>'#/i/'+encodeURIComponent(n);
const ilink=(n,label)=>`<a class="itl" href="${ihref(n)}">${icon(n,'s')}${esc(label??n)}</a>`;
// ---- Items tab: every name opens its item page (TMs and Mega Stones too); Move Tutors keep the move page
itemRow=function(sec,r){const nm=sec.k==='npc'?esc(r[0]):sec.n==='Move Tutors'&&r[2]!=null?`<a href="#/m/${r[2]}">${esc(r[0])}</a>`:ilink(r[0]);
 return `<tr><td>${nm}</td><td>${esc(r[1]).replace(/\n/g,'<br>')}${r[3]?'<span class="warn">MISSABLE</span>':''}</td></tr>`;};
// Every place an item is found, once: Shops rows become "Shop:" lines on the item itself, repeated lines go, and a
// shop line's trailing " · <item or move name>" (Unbound) is dropped.
function placesOf(n,e){const seen=new Set(),out=[],tm=isTM(n)?n.replace(/^\S+\s+/,''):n;
 e.rows.forEach(r=>String(r.text).split('\n').forEach(l=>{l=l.trim();if(!l)return;
  if(r.box==='Shops'){if(!/^(Shop|Found|Also|Wild):/.test(l))l='Shop: '+l;if(l.endsWith(' · '+tm))l=l.slice(0,-(3+tm.length));}
  const k=l.toLowerCase();if(!seen.has(k)){seen.add(k);out.push({l,miss:r.miss});}}));return out;}
// Old Items tab, kept for comparison: dex-style rows inside the same boxes
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
// ---- proposed Items tab: the kinds as the boxes (standard collapsible boxes, sticky yellow sub-headings), each item
// once as a card with its first 3 places, and a tick on every place you pick one up.
const CATS=[['Key Items'],['Poké Balls'],['Medicine'],['Held Items'],['TMs and HMs'],['Evolution Items'],['Stats and Abilities'],
 ['Mega Stones'],['Z-Crystals'],['Fossils'],['Valuables'],['Other']];
const SHOPCAT={'Poké Balls':'Poké Balls','Healing and repels':'Medicine','Evolution items':'Evolution Items','Power items':'Stats and Abilities',
 'Stats and abilities':'Stats and Abilities','TMs':'TMs and HMs','Mega Stones':'Mega Stones','Held items':'Held Items'};
// Its kind: the item's own box (not Shops) and sub-heading; a shop-only item goes by its shop kind.
function catOf(n,e){const r=e.rows.find(r=>r.box!=='Shops');if(r)return [r.box,r.sub&&r.sub!==r.box?r.sub:''];
 const c=SHOPCAT[e.rows[0].sub]||'Other';return [c,c==='Held Items'?(/Berry$/.test(n)?'Berries':'Other held items'):''];}
const SPLIT=new Set(['Zygarde Cell']);   // items with one card per place (each its own pickup)
// Ticks (mockup: localStorage 'itmock-ticks', key "item|place line"; the build keys them by a stable pickup key)
const TK=(()=>{try{return JSON.parse(localStorage.getItem('itmock-ticks')||'{}')}catch(e){return {}}})();
const tkey=(n,l)=>n+'|'+l;
const tickable=l=>!/^(Shop|Wild):/.test(l)&&!/repeatable|daily|every day|\((Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b|rematch/i.test(l);
const WSTOP=new Map();D.WK.splits.forEach((sp,si)=>sp.st.forEach((st,ti)=>(st.it||[]).forEach(i=>String(i[2]).split('\n').forEach(l=>WSTOP.set(tkey(i[1],l.trim()),[si,ti,st.n])))));
const stopOf=(n,l)=>WSTOP.get(tkey(n,l))||(IS[n]&&IS[n].walk.length===1?IS[n].walk[0]:null);
const walkLink=(n,l)=>{const w=stopOf(n,l);return w?` <a class="iwk" href="#/walk" data-w="${w[0]}.${w[1]}" data-l="${esc(l)}">${esc(w[2])} ›</a>`:'';};
// Into the walkthrough: the stop and its Items section open, landing on this place's row (as trainer links do).
document.addEventListener('click',ev=>{const a=ev.target.closest('a.iwk[data-w]');if(!a)return;ev.preventDefault();const [si,ti]=a.dataset.w.split('.').map(Number),sk=si+'.'+ti,l=a.dataset.l;
 SR.clear();WO.o[si]=1;WO.x[sk]=1;WO.s[sk+'.i']=1;woSave();
 SR.go('#/walk',()=>{const stp=app.querySelector(`details.stopd[data-k="${sk}"]`);if(!stp)return;const row=[...stp.querySelectorAll('.itbl.wt tr')].find(tr=>tr.textContent.includes(l.replace(/^(Found|Also):\s*/,'').slice(0,40)));land(row||stp.querySelector('summary'));});},true);
// Unticked pickups first, then shop / wild lines, then ticked ones: the three a card shows are always the next to get.
const ordered=(n,lines)=>[...lines.filter(p=>tickable(p.l)&&!TK[tkey(n,p.l)]),...lines.filter(p=>!tickable(p.l)),...lines.filter(p=>tickable(p.l)&&TK[tkey(n,p.l)])];
const lineHTML=(n,p)=>tickable(p.l)?`<label class="iloc itl2"><input type="checkbox" class="itk" data-k="${esc(tkey(n,p.l))}"${TK[tkey(n,p.l)]?' checked':''}><span>${esc(p.l2||p.l)}${p.miss?'<span class="warn">MISSABLE</span>':''}${walkLink(n,p.l)}</span></label>`
 :`<span class="iloc">${esc(p.l)}${p.miss?'<span class="warn">MISSABLE</span>':''}${walkLink(n,p.l)}</span>`;
function cardHTML(n,lines,max,title){const e=IS[n],tm=isTM(n)&&e.rows.find(r=>r.k==='tm'&&r.link!=null),mv=tm&&MV[tm.link];
 const tk=lines.filter(p=>tickable(p.l)),done=tk.filter(p=>TK[tkey(n,p.l)]).length;
 return `<div class="row irow${tk.length&&done===tk.length?' idone':''}" data-n="${esc(n)}"><a class="iico" href="${ihref(n)}">${icon(n,'m')}</a><span class="rt"><span class="nm"><a href="${ihref(n)}">${esc(title||n)}</a>${mv&&mv.t?' '+ty(mv.t):''}${tk.length>1?` <span class="iprog">${done}/${tk.length}</span>`:''}</span>${ordered(n,lines).slice(0,max).map(p=>lineHTML(n,p)).join('')}${lines.length>max?`<a class="imore" href="${ihref(n)}">+${lines.length-max} more</a>`:''}</span></div>`;}
const cards=ns=>`<div class="list ilist">${ns.flatMap(n=>SPLIT.has(n)?placesOf(n,IS[n]).map(p=>{const m=p.l.match(/^(?:Found|Also):\s*([^·]+?)\s*·\s*(.+)$/);return cardHTML(n,[m?{...p,l2:m[2]}:p],1,m?m[1]:'');}):[cardHTML(n,placesOf(n,IS[n]),3)]).join('')}</div>`;
// Unbound's tutors: one card per tutor (where, what it needs, each move with its cost), under four headings.
const TUTGRP=[[/Shard Tutor/,'Shard tutors'],[/^Gem Family/,'Gem Family'],[/Ultimate|Special Moves|Draco/,'Special moves'],[/^Move Tutor \d/,'Battle Frontier tutors']];
function tutorBox(sec){const tut=new Map();sec.r.forEach(r=>{const k=r[4]||sec.n;if(!tut.has(k))tut.set(k,[]);tut.get(k).push(r);});
 const groups=new Map();tut.forEach((rows,name)=>{const g=(TUTGRP.find(([re])=>re.test(name))||[0,'Other tutors'])[1];if(!groups.has(g))groups.set(g,[]);groups.get(g).push([name,rows]);});
 if(groups.size===1&&groups.has('Other tutors'))return null;
 const card=([name,rows])=>{const parts=String(rows[0][1]).split(' · ');
  return `<div class="row irow tut"><span class="rt"><span class="nm">${esc(name)}</span><span class="iloc">${esc(parts[0])}</span>${parts.length>2?`<span class="iloc">Needs: ${esc(parts.slice(2).join(' · '))}</span>`:''}<span class="tmoves">${rows.map(r=>{const mv=r[2]!=null&&MV[r[2]];
   return `<div class="tm1"><a href="#/m/${r[2]}">${esc(r[0])}</a> ${mv&&mv.t?ty(mv.t):''} <span class="tcost">${esc(String(r[1]).split(' · ')[1]||'')}</span></div>`;}).join('')}</span></span></div>`;};
 return [...groups].map(([g,ts])=>sectionHTML('kt.'+g,esc(g),`<span class="mut small">${ts.length}</span>`,`<div class="list ilist">${ts.map(card).join('')}</div>`,!!KO.s['kt.'+g])).join('');}
const KO=Object.assign({o:{},s:{}},(()=>{try{return JSON.parse(localStorage.getItem('itmock-open')||'{}')}catch(e){return {}}})());
const koSave=()=>localStorage.setItem('itmock-open',JSON.stringify(KO));
function kindGroups(){const by={};Object.entries(IS).forEach(([n,e])=>{if(!e.rows.length)return;let [c,sub]=catOf(n,e);if(sub===n)sub='';if(SPLIT.has(n))sub=n+'s';((by[c]??={})[sub]??=[]).push(n);});
 const gs=CATS.filter(([c])=>by[c]).map(([key])=>({key,subs:Object.entries(by[key]).map(([sb,ns])=>[sb,ns.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))]),
  count:Object.values(by[key]).reduce((a,x)=>a+x.length,0)}));
 (D.IT||[]).forEach((sec,si)=>{if(sec.k==='npc'||sec.n==='Move Tutors')gs.push({key:sec.n,si,count:sec.n==='Move Tutors'&&new Set(sec.r.map(r=>r[4])).size>1?new Set(sec.r.map(r=>r[4])).size+' tutors':sec.r.length});});return gs;}
function kindBody(g){if(g.si!=null){const sec=D.IT[g.si];return (sec.n==='Move Tutors'&&tutorBox(sec))||baseBox(g.si);}
 if(g.subs.length===1&&!g.subs[0][0])return cards(g.subs[0][1]);
 return g.subs.map(([sb,ns])=>sectionHTML('ks.'+g.key+'.'+sb,esc(sb||'Other'),`<span class="mut small">${SPLIT.has(ns[0])?placesOf(ns[0],IS[ns[0]]).length:ns.length}</span>`,cards(ns),!!KO.s['ks.'+g.key+'.'+sb])).join('');}
let KG=[];
const baseList=listItems;
listItems=function(){if(OPT.layout!=='kinds'||st.q)return baseList();fil.innerHTML='';KG=kindGroups();
 app.innerHTML=tickBar()+KG.map((g,gi)=>`<details class="split jt" data-ki="${gi}" ${KO.o[g.key]?'open':''}><summary>${esc(g.key)} <span class="mut small">${g.count}</span></summary><div class="body"></div></details>`).join('');
 app.querySelectorAll('details.split[data-ki][open]').forEach(fillKind);bars();};
function fillKind(d){const b=d.querySelector(':scope>.body');if(!b.innerHTML){b.innerHTML=kindBody(KG[+d.dataset.ki]);colBind(b);}}
app.addEventListener('toggle',ev=>{const d=ev.target;if(OPT.layout!=='kinds'||location.hash!=='#/items'||d.tagName!=='DETAILS')return;
 if(d.matches('details.split[data-ki]')){if(d.open)fillKind(d);const k=KG[+d.dataset.ki].key;if(d.open)KO.o[k]=1;else delete KO.o[k];koSave();}
 else if(d.matches('details.sec')&&/^k[st]\./.test(d.dataset.s)){if(d.open)KO.s[d.dataset.s]=1;else delete KO.s[d.dataset.s];koSave();}},true);
// A tick: saved at once (shared by the Items tab cards, the item page and the walkthrough's item rows); a card redraws
// so its next unticked places move up.
const tickCount=()=>Object.keys(TK).length;
function tickBar(){return `<div class="itbar"><span class="mut small">${tickCount()} ticked</span>${tickCount()?`<button type="button" class="itclr">Clear ticks</button>`:''}</div>`;}
app.addEventListener('change',ev=>{const c=ev.target;if(!c.matches('.itk'))return;if(c.checked)TK[c.dataset.k]=1;else delete TK[c.dataset.k];
 localStorage.setItem('itmock-ticks',JSON.stringify(TK));
 app.querySelectorAll('.itk').forEach(x=>{if(x!==c&&x.dataset.k===c.dataset.k)x.checked=c.checked;});
 const card=c.closest('.irow[data-n]');
 if(card){const n=card.dataset.n;if(SPLIT.has(n))card.classList.toggle('idone',c.checked);else{const t=document.createElement('template');t.innerHTML=cardHTML(n,placesOf(n,IS[n]),3);card.replaceWith(t.content);}}
 const bar=app.querySelector('.itbar');if(bar)bar.outerHTML=tickBar();});
// Clear ticks: a second tap confirms.
app.addEventListener('click',ev=>{const b=ev.target.closest('.itclr');if(!b)return;
 if(!b.dataset.sure){b.dataset.sure=1;b.textContent=`Tap again to clear ${tickCount()}`;return;}
 Object.keys(TK).forEach(k=>delete TK[k]);localStorage.setItem('itmock-ticks','{}');listItems();});
// ---- the item page
function kindOf(e){const rows=e.rows.filter(r=>r.box!=='Shops'&&r.box!=='Valuables');const r=rows[0]||e.rows[0];
 if(!r)return e.wild.length?'Wild Pokémon hold it':e.tr.length?'Only trainers hold it':'';return r.box==='Shops'?r.sub:r.sub&&r.sub!==r.box?r.box+' · '+r.sub:r.box;}
function megaBlock(e){return e.mega.map(p=>{const b=P.find(x=>x.dex===p.dex&&x.g!==1&&!x.fc);
 return `<div class="imega">${b?sprl(b.id,'s40')+plink(b.id):''}<span class="arrow">→</span>${sprl(p.id,'s40')}${plink(p.id)}</div>${p.nu?`<div class="mut small">Not obtainable in ${esc(CF.name)}; trainers use it.</div>`:''}`;}).join('');}
function whereCard(n,e,title){const pl=placesOf(n,e);if(!pl.length&&!e.walk.length)return '';
 const body=`<div class="iwl">${ordered(n,pl).map(p=>lineHTML(n,p)).join('')}</div>`+
  (e.walk.length?`<div class="iwalk"><span class="mut small">Walkthrough:</span> ${e.walk.map(([si,ti,s])=>`<a href="javascript:SR.jumpStop(${si},${ti})">${esc(s)}</a>`).join('')}</div>`:'');
 return `<div class="card iwhere">${sectionHTML('iw',`${title||'Where to find'}${pl.length?' ('+pl.length+')':''}`,'',body,true)}</div>`;}
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
function walkTicks(){app.querySelectorAll('.itbl.wt tr').forEach(tr=>{if(tr.dataset.tk)return;tr.dataset.tk=1;const c=tr.children;if(c.length<2)return;
  const n=(c[0].querySelector('a')||c[0]).childNodes[0]?.textContent?.trim()||'',l=c[1].childNodes[0]?.textContent?.trim()||'';if(!n||!l||!tickable(l))return;
  c[1].insertAdjacentHTML('afterbegin',`<input type="checkbox" class="itk iwt" data-k="${esc(tkey(n,l))}"${TK[tkey(n,l)]?' checked':''} aria-label="Got it">`);});}
function linkify(){walkTicks();app.querySelectorAll('.itbl.wt td:first-child,.ab,.interaction-who>span,.card .mut').forEach(el=>{
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

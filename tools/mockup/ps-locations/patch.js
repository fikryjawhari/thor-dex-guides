// Mockup layer over the real Photonic Sun build (runs after the guide's own script, in a srcdoc frame).
// frameElement.dataset.d = design ('cur' = untouched), parent.MK = {page, lt, maps, words, css, map}.
(()=>{const MK=parent.MK,DS=frameElement.dataset.d;if(!MK||DS==='cur')return;
const css=document.createElement('style');css.textContent=MK.css;document.head.appendChild(css);
// ---- width fixes (move and ability pages)
if(MK.page==='mv'){const o=moveDetail;moveDetail=i=>{o(i);const t=app.querySelector('.card table');if(!t)return;
  if(DS==='A')t.classList.add('wrapn');
  if(DS==='B')t.querySelectorAll('td').forEach(td=>{if(td.textContent==='Never misses')td.textContent='Sure hit';});
  if(DS==='C'){const v=[...t.rows[1].cells].map(c=>c.textContent),h=[...t.rows[0].cells].map(c=>c.textContent);
   t.outerHTML=`<div class="mvst">${h.map((x,j)=>`<div><span>${x}</span><b>${v[j]}</b></div>`).join('')}</div>`;}};render();return;}
if(MK.page==='ab'){const o=abilityDetail;abilityDetail=i=>{o(i);
  if(DS==='A'){app.querySelectorAll('.card table td.n').forEach(c=>{if(c.textContent==='Hidden'){c.textContent='HA';c.title='Hidden ability';}});return;}app.querySelectorAll('.card table tr').forEach(tr=>{const c=tr.cells[2];if(!c)return;
  if(c.textContent==='Hidden')tr.cells[1].querySelector('a').insertAdjacentHTML('afterend',' <span class="tag">Hidden ability</span>');c.remove();});};render();return;}
// ---- Locations
const LT=MK.lt,SUN='<svg class="dn s" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.4" fill="currentColor"/><path d="M8 .8v2.4M8 12.8v2.4M.8 8h2.4M12.8 8h2.4M2.9 2.9l1.7 1.7M11.4 11.4l1.7 1.7M2.9 13.1l1.7-1.7M11.4 4.6l1.7-1.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
 MOON='<svg class="dn m" viewBox="0 0 16 16"><path d="M11.2 1.2a6.8 6.8 0 1 0 3.6 11.6A5.6 5.6 0 0 1 11.2 1.2z" fill="currentColor"/></svg>',
 BUB='<svg class="dn b" viewBox="0 0 16 16"><circle cx="5" cy="10" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="11" cy="5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>';
AR[0].n='Starter';LOC[0]='Starter';LGRP.forEach(g=>{if(g.a[0]===0)g.n='Starter';});
// The starter picker in the tracker bar also fills the Starter box's encounter
document.addEventListener('change',e=>{if(e.target.matches('.tk-starter,.st-pick')){const p=P.find(x=>x.name===e.target.value);TK.s=e.target.value;if(p)TK.e[0]={p:p.id};else delete TK.e[0];tkSave();rerender();}},true);
const SPEC=/^(Starter choice|Island Scan|Trade|Gift|Static|Ultra Wormhole|Breed)/;
const pct=x=>Math.round(x*10)/10+'%';
const rate=(r,adj)=>{const [d,n]=r.map((x,j)=>adj?adj(x,j):x);if(r[0]===r[1])return r[0]?pct(d):'';
 return [r[0]?`<span class="rt">${SUN}${pct(d)}</span>`:'',r[1]?`<span class="rt">${MOON}${pct(n)}</span>`:''].filter(Boolean).join('');};
const when=w=>w==='day'?SUN:w==='night'?MOON:'';
const name=id=>byId[id]?byId[id].name:id;
// Every caller -> allies in this area, and ally -> callers (with the section each caller is in)
function sosIndex(a){const by={},secs=(LT[a]||{}).s||[];secs.forEach(s=>s.g.forEach(g=>g.rows.forEach(x=>(x.sos||[]).forEach(([al,w])=>{
 (by[al]=by[al]||[]).push({p:x.p,w,s:s.n+(g.m&&s.k!=='grass'?' · '+g.m:'')});}))));return by;}
const sosLine=x=>x.sos&&x.sos.length?x.sos:null;
function callerSOS(x){const al=sosLine(x);if(!al)return '';
 if(DS==='C')return `<div class="sosi">SOS → ${al.map(([p,w])=>`${when(w)}${plink(p)}`).join(', ')}</div>`;
 if(DS==='A')return `<details class="sosd"><summary><span class="sosk">SOS</span> ${al.map(([p,w])=>esc(name(p))).join(', ')}</summary><div class="sosl">${al.map(([p,w])=>
  `<div class="sosa">${spr(p,'s32')}<div>${plink(p)} ${when(w)}<div>${(byId[p]?.t||[]).map(ty).join('')}</div></div></div>`).join('')}</div></details>`;return '';}
function rows(g,cf,secName){const live=g.rows.filter(x=>!cf.has(FAM[x.p]));
 const sum=(k,j)=>live.reduce((s,x)=>s+((x[k]||[0,0])[j]||0),0),S={r:[sum('r',0),sum('r',1)],b:[sum('b',0),sum('b',1)]};
 const tot=(k,j)=>g.rows.reduce((s,x)=>s+((x[k]||[0,0])[j]||0),0),full={r:[tot('r',0),tot('r',1)],b:[tot('b',0),tot('b',1)]};
 const adj=k=>(x,j)=>S[k][j]&&full[k][j]!==S[k][j]?x/S[k][j]*100:x;
 const rs=[...g.rows].sort((a,b)=>Math.max(...b.r,...(b.b||[0]))-Math.max(...a.r,...(a.b||[0]))||name(a.p).localeCompare(name(b.p)));
 return `<table class="enc lt">${rs.map(x=>{const d=cf.has(FAM[x.p]);return `<tr class="${d?'dupe':''}"><td style="width:44px">${spr(x.p,'s40')}</td><td>${plink(x.p)}<div>${(byId[x.p]?.t||[]).map(ty).join('')}</div>${x.note?`<div class="mut small">${esc(x.note)}</div>`:''}${callerSOS(x)}</td>
  <td class="n">${rate(x.r,d?null:adj('r'))}</td>${g.bl!==undefined?`<td class="n bubc">${x.b?BUB+rate(x.b,d?null:adj('b')):''}</td>`:''}</tr>`;}).join('')}</table>`;}
const sub=(m,lv,bl,n)=>`<div class="ltsub"><b>${esc(m)}</b>${lv?` <span>Lv ${esc(lv)}</span>`:''}${bl?` <span class="bl">${BUB} bubbling Lv ${esc(bl)}</span>`:''}</div>`;
function secTags(rs,cf,lv){const allD=rs.length&&rs.every(x=>cf.has(FAM[x.p]));return (lv?`<span class="mut small">Lv ${esc(lv)}</span>`:'')+(allD?'<span class="tag">all dupes</span>':`<span class="mut small">· ${rs.length}</span>`);}
function sosBox(k,a,cf){const by=sosIndex(a),ws=(LT[a]||{}).ws||[];const al=Object.keys(by).sort((x,y)=>name(x).localeCompare(name(y)));if(!al.length&&!ws.length)return '';
 const body=`<table class="enc lt">${al.map(p=>{const c=by[p];const d=cf.has(FAM[p]);return `<tr class="${d?'dupe':''}"><td style="width:44px">${spr(p,'s40')}</td><td>${plink(p)}<div>${(byId[p]?.t||[]).map(ty).join('')}</div>${
  DS==='B'?`<details class="sosd"><summary><span class="sosk">Called by</span> ${[...new Set(c.map(x=>name(x.p)))].map(esc).join(', ')}</summary><div class="sosl">${c.map(x=>`<div class="sosa">${spr(x.p,'s32')}<div>${plink(x.p)} ${when(x.w)}<div class="mut small">${esc(x.s)}</div></div></div>`).join('')}</div></details>`
  :`<div class="sosi">Called by ${c.map(x=>`${when(x.w)}${plink(x.p)} <span class="mut">(${esc(x.s)})</span>`).join(', ')}</div>`}</td><td class="n"></td></tr>`;}).join('')}</table>`+
  (ws.length?`<div class="ltsub"><b>Weather</b> <span>any Pokémon here, in rain, sand or hail</span></div><table class="enc lt">${ws.map(p=>`<tr><td style="width:44px">${spr(p,'s40')}</td><td>${plink(p)}<div>${(byId[p]?.t||[]).map(ty).join('')}</div></td><td class="n"></td></tr>`).join('')}</table>`:'');
 return LSEC(k,'SOS allies',`<span class="mut small">· ${al.length+ws.length}</span>`,body);}
function mapBlock(a){const m=MK.maps[AR[a].n];if(!m||MK.map!=='img')return '';
 return `<details class="mapd"><summary>Map: grass patch numbers</summary>${m.map(x=>`<img src="${x.src}" alt="Map of ${esc(AR[a].n)}">`).join('')}<div class="mut small">From the Wild Pokémon Locations doc.</div></details>`;}
const hint=(a,n)=>MK.map==='words'&&MK.words[AR[a].n]&&MK.words[AR[a].n][n]?`<div class="mut small ltw">${esc(MK.words[AR[a].n][n])}</div>`:'';
function ltBody(a,p,cf){const k=a+'.'+p.j,L=LT[a];let h='';
 const spec=adjRows(p.ls,cf).filter(([m])=>SPEC.test(m));
 if(a===0){const cur=TK.s||'';h+=`<div class="trk"><span class="mut small">Your starter</span><select class="st-pick"><option value="">Not chosen</option>${STARTERS.map(s=>`<option ${cur===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
  <div class="mut small" style="margin:2px 0 6px">The same picker as the tracker bar: it records this encounter and sets the rival's teams. Ultra Sun gives the starter on Route 1.</div>`;}
 if(L){const anyDN=L.s.some(s=>s.g.some(g=>g.rows.some(x=>x.r[0]!==x.r[1]||(x.b&&x.b[0]!==x.b[1]))));
  if(anyDN)h+=`<div class="mut small ltkey">${SUN} day ${MOON} night: only where the rate changes with the time.</div>`;
  h+=mapBlock(a);
  h+=L.s.map(s=>{const all=s.g.flatMap(g=>g.rows);const one=s.g.length===1&&!s.g[0].m;
   const body=hint(a,s.n)+(one?rows(s.g[0],cf,s.n):s.g.map(g=>sub(g.m,g.lv,g.bl)+rows(g,cf,s.n)).join(''));
   return LSEC(k,s.n,secTags(all,cf,one?s.g[0].lv:''),body);}).join('');}
 if(spec.length)h+=LSEC(k,a===0?'Starter':'Special',`<span class="mut small">· ${spec.reduce((s,x)=>s+x[1].length,0)}</span>`,spec.map(([m,rows,allD,note])=>(spec.length>1||a!==0?sub(m):'')+encTable(rows,note)).join(''));
 if(DS!=='A')h+=sosBox(k,a,cf);
 return h;}
const oPlace=locPlace;
locPlace=(a,p,cf,trk)=>{if(!LT[a]&&a!==0&&!adjRows(p.ls,cf).some(([m])=>SPEC.test(m)))return oPlace(a,p,cf,trk);const k=a+'.'+p.j;
 return locStop(k,p.n,trk?encSummary(a):'',(trk?(a===0?'':trackerHTML(a))+(AR[a].note?`<div class="trnote">${esc(AR[a].note)}</div>`:''):'')+(ltBody(a,p,cf)||'<div class="mut small" style="margin:6px 0">No wild Pokémon here.</div>'));};
const oBox=locBox;locBox=(g,cf)=>g.a[0]===0?locPlace(0,places(0)[0],cf,false)+`<button class="endbar sp" hidden>${UPI}<span>Collapse Starter</span></button>`:oBox(g,cf);
// The one-area box puts the area's tracker above its place: hide it for the Starter box (its picker is the tracker)
render();})();

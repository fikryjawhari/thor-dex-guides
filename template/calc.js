
((sourceData) => {
if(!CF.calc)return;
const prof=CF.calc,AB=sourceData.AB.map(entry=>entry[0]);
const D={...sourceData,IT:[...new Set(sourceData.IT.flatMap(section=>section.r.map(row=>row[0])))]};
Object.defineProperty(D,'TR',{get:()=>TRS.filter(trainer=>!rivalHidden(trainer))});
const $=(selector,root)=>(root||document).querySelector(selector);
const html=(element,content)=>{element.innerHTML=content;return element;};
const nb=numBox,KEY=LS.dmg;
const range=prof.lv||[1,100],stageRange=prof.stages||[-6,6];
const stageMul=stage=>stage>=0?(2+stage)/2:2/(2-stage);
const defaults=()=>({dir:'out',mine:{src:'party',b:0,i:0},foe:{k:'',i:0},field:{},custom:[],imp:null,edits:{},saved:{},recent:[],crit:{},hits:{},mvo:{}});
let ST=defaults();try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored&&typeof stored==='object')ST={...ST,...stored};}catch(error){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(error){BAN={ok:0,h:'Storage full',t:'The current changes could not be remembered.'};}};
window.DMG.init(sourceData,prof);
const toEngine=mon=>({id:mon.id,lv:mon.l,nat:mon.na,ab:mon.a,it:mon.i||'',st:mon.status||'',iv:mon.iv,ev:EVS?mon.ev:[0,0,0,0,0,0],stg:[0,...(mon.stg||[0,0,0,0,0])],hp:mon.hp});
const koTxt=ko=>!ko.n?'5+ hits':(ko.n===1?'OHKO':ko.n+'HKO')+(ko.p<1?' '+Math.min(99,Math.max(1,Math.round(ko.p*100)))+'%':'');

const trByK=TRK;
const isRel=t=>t.p.some(x=>x.l==null);
function curMine(){const imp=ST.imp,m=ST.mine;if(m.src==='party'&&imp&&imp.party)return imp.party[m.i]||null;if(m.src==='box'&&imp&&imp.boxes&&imp.boxes[m.b])return imp.boxes[m.b][m.i]||null;if(m.src==='custom')return ST.custom[m.i]||null;return null;}
function applyEdits(base,key){ST.saved=ST.saved||{};const sv=key&&ST.saved[key],e=key&&ST.edits[key];const w=!!e&&Object.keys(e).length>0;if(!sv&&!w)return {...base};return {...base,...sv,...e,edited:w,saved:!!sv};}
function foeBase(t,i){const x=t.p[i];if(!x)return null;const p=byId[x.id];const cap=capOf(t),level=monLv(x,cap),knownAbility=Number.isInteger(x.a)&&x.a>=0;
 return {id:x.id,l:Number.isFinite(level)?Math.max(range[0],Math.min(range[1],level)):NaN,na:x.na||'Hardy',a:knownAbility?x.a:p.a[0],aGuess:!knownAbility,i:x.i||'',m:(x.m||[]).slice(),iv:x.iv||[31,31,31,31,31,31],ev:x.ev||[0,0,0,0,0,0],foe:true};}
function resolve(m){const p=byId[m.id],l=isNaN(m.l)?null:m.l;const st=l==null?null:window.DMG.stats(toEngine(m));
 return {...m,p,name:p.n,types:p.t,lv:l,stats:st,abil:AB[m.a]||'',stg:m.stg||[0,0,0,0,0],status:m.status||'',hp:st?Math.min(m.hp==null?st[0]:m.hp,st[0]):null};}


let BAN=null;const ROWOPEN=new Set();let SMODE='+';
ST.crit=ST.crit||{};ST.mvo=ST.mvo||{};ST.hits=ST.hits||{};
const MH={};Object.entries(prof.multihit||{}).forEach(([name,hits])=>{const index=M.indexOf(name);if(index>=0)MH[index]=hits;});
const hitsOf=(mi,ck)=>{const m=MH[mi];return m?Math.max(m[0],Math.min(m[1],ST.hits[ck]||m[2])):1;};
const TNAMES=Object.keys(D.TC);
const effMv=(mi,ck)=>({...MV[mi],...((prof.varpow||[]).includes(M[mi])?{bp:null}:{}),...Object.fromEntries(Object.entries(ST.mvo[ck]||{}).filter(([,v])=>v!=null))});
function sideInfo(side){const isM=side==='mine';const t=trByK[ST.foe.k];const base=isM?curMine():(t?foeBase(t,ST.foe.i):null);const custom=isM&&ST.mine.src==='custom';const key=isM?'mine:'+(base||{}).pid:'foe:'+ST.foe.k+':'+ST.foe.i;return {isM,key,base,custom};}
function getMon(side){const i=sideInfo(side);if(!i.base)return null;return i.custom?{...i.base}:applyEdits(i.base,i.key);}
function setField(side,f,v){const i=sideInfo(side);if(i.custom){if(v===undefined)delete i.base[f];else i.base[f]=v;}else{const e=(ST.edits[i.key]=ST.edits[i.key]||{});if(v===undefined)delete e[f];else e[f]=v;}save();}
const effSpe=r=>r.stats?(window.DMG.speed?window.DMG.speed(toEngine(r),ST.field):Math.floor(Math.floor(r.stats[5]*stageMul(r.stg[4]))*(r.status==='par'?(CF.calc.gen>=7?.5:.25):1))):null;
function mineList(){const imp=ST.imp,L=[];if(imp){imp.party.forEach((m,i)=>L.push({g:0,src:'party',b:0,i,m}));imp.boxes.forEach((bx,b)=>bx.forEach((m,i)=>L.push({g:1,src:'box',b,i,m})));}ST.custom.forEach((m,i)=>L.push({g:2,src:'custom',b:0,i,m}));return L;}
const isSel=x=>ST.mine.src===x.src&&(x.src!=='box'||ST.mine.b===x.b)&&ST.mine.i===x.i;
function mineGrid(){const L=mineList();
 if(!L.length)return `<div class="dempty"><button class="dbtn pri" data-a="import" ${prof.save?'':'hidden'}>Import save</button><button class="dbtn" data-a="newmon">New Pokémon</button></div>`;
 let h='',g=-1;L.forEach(x=>{g=x.g;const m=x.src==='custom'?x.m:applyEdits(x.m,'mine:'+x.m.pid);
  h+=`<button data-a="mpick" data-src="${x.src}" data-b="${x.b}" data-i="${x.i}" class="${isSel(x)?'on':''} ${x.src==='custom'?'cu':''}" aria-label="${esc(byId[m.id].n)}">${spr(m.id,'s28')}<span>${m.l}</span></button>`;});
 return `<div class="tools"><button data-a="import" ${prof.save?'':'hidden'}>↻ Import</button><button data-a="newmon">+ New</button><button data-a="findmine">⌕ Find</button></div><div class="dstrip fs">${h}</div>`;}
function foeSide(){const t=trByK[ST.foe.k];if(!t)return `<div class="fbar"><button class="dsrc" data-a="foesheet"><span class="nm mut">Pick a trainer</span></button></div>`;
 const rel=isRel(t),cap=capOf(t),own=+TCAP[t.k]>0,ti=D.TR.indexOf(t);
 const lvl=i=>{const m=applyEdits(foeBase(t,i),'foe:'+t.k+':'+i);return isNaN(m.l)?'?':m.l;};
 return `<div class="fbar"><button class="nav" data-a="tprev" aria-label="Previous trainer" ${ti>0?'':'disabled'}>‹</button><button class="dsrc" data-a="foesheet"><span class="nm">${esc(t.n)}</span></button><button class="nav" data-a="tnext" aria-label="Next trainer" ${ti<D.TR.length-1?'':'disabled'}>›</button>${rel?`<span class="dcap ${own?'own':''} ${cap?'':'need'}">Cap ${nb(`data-cap="${t.k}" data-clr="1"`,cap||'',{min:range[0],max:range[1],label:'Level cap'})}</span>`:''}</div>
 <div class="fteam">${t.p.map((x,i)=>{const m=applyEdits(foeBase(t,i),'foe:'+t.k+':'+i);return `<div role="button" tabindex="0" class="ft ${i===ST.foe.i?'on':''}" data-a="fpick" data-i="${i}">${spr(m.id,'s24')}<span class="tx"><span class="l1t"><b>${esc(byId[m.id].n)}</b><i>${isNaN(m.l)?'?':m.l}</i><em>${esc(m.i||'')}</em></span><span class="l2t">${m.m.length?m.m.map(k=>esc(M[k])).join(' · '):'No moves listed'}</span></span></div>`;}).join('')}</div>
 <div class="dstrip fs">${[0,1,2,3,4,5].map(i=>t.p[i]?`<button data-a="fpick" data-i="${i}" class="${i===ST.foe.i?'on':''}" aria-label="${esc(byId[t.p[i].id].n)}">${spr(t.p[i].id,'s28')}<span>${lvl(i)}</span></button>`:`<button class="ph" disabled></button>`).join('')}</div>`;}
const EDITOPEN={mine:false,foe:false};
const MEGA={};P.forEach(species=>{const forms=(species.of||[]).filter(id=>byId[id]?.g===1);if(species.g!==1&&forms.length)MEGA[species.id]=forms;});
function megaToggle(side){const m=getMon(side);const set=(id,a,i)=>{setField(side,'id',id);setField(side,'a',a);setField(side,'aGuess',false);setField(side,'i',i);};
 if(m.pre){const L=MEGA[m.pre.id]||[],ix=L.indexOf(m.id);if(ix>=0&&ix<L.length-1){const n=byId[L[ix+1]];set(n.id,n.a[0],n.stone||m.pre.i);}else{set(m.pre.id,m.pre.a,m.pre.i);setField(side,'pre',null);}}
 else if(MEGA[m.id]){const n=byId[MEGA[m.id][0]];setField(side,'pre',{id:m.id,a:m.a,i:m.i});set(n.id,n.a[0],n.stone||m.i);}}
function editor(r,side){const custom=side==='mine'&&ST.mine.src==='custom';const p=r.p,abils=[...new Set([...p.a,...(p.ha!=null?[p.ha]:[])])];
 const sel=(k,opts,cur)=>`<select data-e="${k}" data-s="${side}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 const row=(lab,fn)=>`<tr><td class="l">${lab}</td>${SN.map((n,i)=>`<td>${fn(i)}</td>`).join('')}</tr>`;
 const si=sideInfo(side),w=ST.edits[si.key]&&Object.keys(ST.edits[si.key]).length,sv=ST.saved&&ST.saved[si.key];
 return `<div class="ed"><div class="e2">${prof.natures!==false?sel('na',NATS.map(n=>[n,n]),r.na):''}${prof.abilities!==false?sel('ab',abils.filter(a=>a>=0).map(a=>[a,AB[a]+(r.aGuess&&a===r.a?' ?':'')]),r.a):''}</div>
 <div class="e2">${prof.items!==false?sel('it',[['','No item'],...D.IT.map(x=>[x,x])],r.i):''}${sel('status',prof.status||[['','No status']],r.status||'')}</div>
 <table><tr><th></th>${SN.map(n=>`<th>${n}</th>`).join('')}</tr>
 ${row('IV',i=>nb(`data-e="iv" data-x="${i}" data-s="${side}"`,r.iv[i],{min:0,max:31,label:'IV '+SN[i]}))}
 ${EVS?row('EV',i=>nb(`data-e="ev" data-x="${i}" data-s="${side}"`,r.ev[i],{min:0,max:252,step:4,label:'EV '+SN[i]})):''}
 ${row('Stat',i=>`<b>${r.stats?r.stats[i]:'?'}</b>`)}
 ${row('Stg',i=>i===0?`<button class="z" data-a="sreset" data-s="${side}" aria-label="Reset stages">0</button>`:`<button class="sc ${r.stg[i-1]>0?'up':r.stg[i-1]<0?'dn':''}" data-a="sstep" data-s="${side}" data-x="${i-1}">${r.stg[i-1]>0?'+':''}${r.stg[i-1]}</button>`).replace('<td class="l">Stg</td>',`<td class="l"><button class="sm" data-a="smode" aria-label="Raise or lower">${SMODE==='+'?'+':'−'}</button></td>`)}</table>
 <div class="e3">${side==='mine'&&!custom?`<button class="dbtn" data-a="esave" data-s="${side}" ${w?'':'disabled'}>Save</button>`:''}${custom?'':`<button class="dbtn" data-a="ereset" data-s="${side}" ${w||sv?'':'disabled'}>${w?'Reset':sv?'Original':'Reset'}</button>`}${custom?`<button class="dbtn" data-a="edel">Delete</button>`:''}</div></div>`;}
function chip(r,att,side,fast){if(!r)return `<div class="cc"><button class="cn" data-a="${side==='mine'?'findmine':'foesheet'}"><b class="mut">${side==='mine'?'Pick yours':'Pick foe'}</b></button></div>`;
 const spe=effSpe(r),mx=r.stats&&r.stats[0],mod=r.stg[4]?(r.stg[4]>0?'↑':'↓'):'',sg=r.stg.some(x=>x);
 const open=EDITOPEN[side],mega=r.pre||MEGA[r.id];
 return `<div class="cc ${att?'att':''}" data-a="sel" data-s="${side}"><div class="l1"><button class="cn" data-a="sel" data-s="${side}"><b>${esc(r.name)}${r.edited?' *':r.saved?' •':''}</b></button>${mega?`<button class="mg ${r.pre?'on':''}" data-a="mega" data-s="${side}" aria-label="Mega">M</button>`:''}<button class="stb ${open||sg?'on':''}" data-a="eopen" data-s="${side}">Edit ${open?'▴':'▾'}</button><span class="sp">Spe <i class="${fast?'f':''}">${spe??'?'}${mod}</i></span></div>
  <div class="cl"><span>Lv</span>${nb(`data-lv="${side}"`,r.lv??'',{min:range[0],max:range[1],label:'Level'})}<button class="hpl" data-a="hpfull" data-s="${side}" title="Full HP">HP</button>${nb(`data-hp="${side}"`,r.hp??'',{min:0,max:mx||999,label:'HP now'})}<span class="mx">/${mx??'?'}</span></div>${open?editor(r,side):''}</div>`;}
function movesHTML(att,def,side,F){const hpNow=def.hp,mx=def.stats[0];
 const D0=[0,1,2,3].map(slot=>{const mi=att.m[slot];if(mi==null)return {slot};const ck=sideInfo(side).key+':'+slot,crit=!!ST.crit[ck],n=hitsOf(mi,ck),mv=effMv(mi,ck);return {slot,mi,ck,mv,crit,n,r:((prof.varpow||[]).includes(M[mi])&&ST.mvo[ck]?.bp==null)?null:window.DMG.calc(toEngine(att),toEngine(def),{mv:mi,...ST.mvo[ck],hits:n,crit},F)};});
 const total=(result,mode)=>result.per?result.per.reduce((sum,rolls)=>sum+(mode==='min'?Math.min(...rolls):Math.max(...rolls)),0):result[mode]*result.hits;
 const best=Math.max(0,...D0.map(entry=>entry.r?total(entry.r,'max'):0));
 const percent=value=>Number(Number(value).toFixed(1));
 return D0.map(x=>{const {slot,mi,ck,mv,crit,n,r}=x;
  if(mi==null)return `<div class="mr em"><div class="mm" data-a="addmv" data-slot="${slot}" data-side="${side}">${slot===0&&side==='foe'&&ST.dir==='in'&&!att.m.some(move=>move!=null)?'No moves listed · ':''}+ Move</div></div>`;
  const open=ROWOPEN.has(ck),mh=MH[mi],ov=ST.mvo[ck];
  const types=`<label>Type<select data-mo="t" data-mi="${mi}" data-ck="${ck}">${TNAMES.map(t=>`<option ${t===mv.t?'selected':''}>${t}</option>`).join('')}</select></label>`;
  const bp=r||mv.c!=='Status'?`<label>Power${nb(`data-mo="bp" data-mi="${mi}" data-ck="${ck}"`,Number(mv.bp)||0,{min:0,max:250,label:'Power'})}</label>`:'';
  const hits=mh?`<label>Hits${nb(`data-mo="hits" data-mi="${mi}" data-ck="${ck}"`,n,{min:mh[0],max:mh[1],label:'Hits'})}</label>`:'';
  const tail=`<div class="mvfull">${esc(M[mi])}</div><div class="ab1"><button class="dbtn sm" data-a="chmv" data-slot="${slot}" data-side="${side}">Change move</button></div>${ov?`<div class="ab1"><button class="dbtn sm" data-a="mvreset" data-mi="${mi}" data-ck="${ck}">Reset power / type</button></div>`:''}`;
  if(!r)return `<div class="mr st ${open?'open':''}"><div class="mm" data-a="row" data-mi="${mi}" data-ck="${ck}"><div class="r1"><span class="mv"><i class="td" style="background:${tcol(mv.t)}"></i>${esc(M[mi])}</span><span class="hp">—</span></div><div class="dd"><div class="eg">${types}${bp}</div>${tail}</div></div></div>`;
  const imm=r.eff===0,ko=r.ko,minTotal=total(r,'min'),maxTotal=total(r,'max');
  return `<div class="mr ${maxTotal===best&&best>0?'best':''} ${open?'open':''}"><div class="mm" data-a="row" data-mi="${mi}" data-ck="${ck}"><div class="r1"><span class="mv"><i class="td" style="background:${tcol(mv.t)}"></i>${esc(M[mi])}</span><span class="hp">${imm?'No effect':r.min+'–'+r.max}</span></div>
   <div class="r2"><span>${imm?'':(n>1?'×'+n+' · ':'')+percent(r.pmin)+'–'+percent(r.pmax)+'%'}</span><span class="ko k${ko.n}">${imm?'':hpNow<=0?'fainted':koTxt(ko)}</span></div>
   <div class="dd"><div class="eg">${types}${bp}${hits}</div><div>${esc(mv.c)} · vs ${hpNow}/${mx} HP${n>1?` · ${n} hits: ${minTotal}–${maxTotal}`:''}</div>${r.per?r.per.map((rolls,index)=>`<div class="rolls">Hit ${index+1}: ${Math.min(...rolls)}–${Math.max(...rolls)}<br>${rolls.join(' ')}</div>`).join(''):`<div class="rolls">${r.rolls.join(' ')}</div>`}${r.notes.length?`<div>${r.notes.map(esc).join(' · ')}</div>`:''}
   <div class="ab"><button class="dbtn sm" data-a="sub" data-side="${side}" data-v="${minTotal}">HP −${minTotal}</button><button class="dbtn sm" data-a="sub" data-side="${side}" data-v="${maxTotal}">HP −${maxTotal}</button></div>${tail}</div></div>
   <div class="rcol ${mh?'two':''}">${mh?`<button class="rh" data-a="hits" data-mi="${mi}" data-ck="${ck}" aria-label="Hits">×${n}</button>`:''}<button class="rc" data-a="crit" data-mi="${mi}" data-ck="${ck}" aria-pressed="${crit}" aria-label="Crit">C</button></div></div>`;}).join('');}
function calcPage(){if(!host.isConnected)document.body.appendChild(host);if(prof.save&&!input.isConnected)document.body.appendChild(input);const gridScroll=$('.mg .dstrip')?.scrollTop||0;fil.innerHTML='';const A0=getMon('mine'),B0=getMon('foe');const a=A0&&resolve(A0),b=B0&&resolve(B0);const out=ST.dir==='out';
 const F=ST.field;const sa=a&&effSpe(a),sb=b&&effSpe(b);
 let ra='',rb='';
 if(!a||!b)ra=rb=`<div class="dnote">${!a?'Pick one of yours':'Pick a foe'}</div>`;
 else if(a.lv==null||b.lv==null)ra=rb=`<div class="dnote">Set the level cap</div>`;
 else{ra=movesHTML(a,b,'mine',F);rb=movesHTML(b,a,'foe',F);}
 const fs=(prof.field||[]).filter(entry=>F[entry.k]).map(entry=>entry.type==='toggle'?entry.l:(entry.o||[]).find(option=>option[0]===F[entry.k])?.[1]||F[entry.k]);
 const ban=BAN?`<div class="ban ${BAN.ok?'ok':'bad'}"><button class="bx" data-a="bandis" aria-label="Dismiss">×</button><b>${esc(BAN.h)}</b>${esc(BAN.t)}</div>`:'';
 html($('#app'),`<div class="fit">${ban}<div class="top"><div class="dside mg">${mineGrid()}</div><div class="dside">${foeSide()}</div></div>
 <div class="dmatch">${chip(a,out,'mine',sa>sb)}${chip(b,!out,'foe',sb>sa)}<div class="dres ${out?'':'na'}">${ra}</div><div class="dres ${out?'na':''}">${rb}</div></div></div>
 <details class="dfield" ${window.__fo?'open':''}><summary>Field <span class="mut">${esc(fs.join(' · ')||'none')}</span></summary><div class="dfb">
  ${fieldHTML(F)}</div></details>`);
 bindCap();bindMain();bindEd();fitTeam();if($('.mg .dstrip'))$('.mg .dstrip').scrollTop=gridScroll;jumpState();}

const TEAMNEED=222;
function fitTeam(){if(location.hash!=='#/calc')return;const app=$('#app');if(!app)return;const fit=app.querySelector('.fit'),dm=app.querySelector('.dmatch');if(!fit||!dm||innerWidth<480){app.classList.remove('tl');return;}
 const ban=fit.querySelector('.ban');const avail=fit.clientHeight-dm.offsetHeight-4-(ban?ban.offsetHeight+4:0);app.classList.toggle('tl',avail>=TEAMNEED);app.dataset.avail=Math.round(avail);}
window.addEventListener('resize',()=>fitTeam());
function bindMain(){document.querySelectorAll('[data-lv],[data-hp]').forEach(i=>{if(i.dataset.b)return;i.dataset.b=1;i.onchange=()=>{const side=i.dataset.lv||i.dataset.hp,f=i.dataset.lv?'l':'hp';const v=parseInt(i.value);if(isNaN(v))return;
  setField(side,f,f==='l'?Math.max(range[0],Math.min(range[1],v)):Math.max(0,Math.min(resolve(getMon(side)).stats?.[0]||0,v)));if(f==='l'){const mon=resolve(getMon(side));if(mon.hp!=null)setField(side,'hp',mon.hp);}refresh();};});
 document.querySelectorAll('[data-mo]').forEach(i=>{if(i.dataset.b)return;i.dataset.b=1;i.onchange=()=>{const mi=+i.dataset.mi,k=i.dataset.mo;
  const ck=i.dataset.ck;if(k==='t'){(ST.mvo[ck]=ST.mvo[ck]||{}).t=i.value;}else if(k==='bp'){const v=parseInt(i.value);(ST.mvo[ck]=ST.mvo[ck]||{}).bp=isNaN(v)?undefined:v;}else if(k==='hits'){ST.hits[ck]=parseInt(i.value)||1;}
  save();refresh();};});}
function bindEd(){document.querySelectorAll('[data-e]').forEach(i=>{if(i.dataset.b)return;i.dataset.b=1;i.onchange=()=>{const side=i.dataset.s,k=i.dataset.e,m=getMon(side);
  if(k==='na')setField(side,'na',i.value);else if(k==='ab'){setField(side,'a',+i.value);setField(side,'aGuess',false);}else if(k==='it')setField(side,'i',i.value);else if(k==='status')setField(side,'status',i.value);
  else if(k==='iv'||k==='ev'){const a=m[k].slice(),v=parseInt(i.value)||0;a[+i.dataset.x]=Math.max(0,Math.min(k==='iv'?31:252,v));setField(side,k,a);}
  refresh();};});}
function bindCap(root){(root||document).querySelectorAll('[data-cap]').forEach(i=>{if(i.dataset.b)return;i.dataset.b=1;i.onchange=()=>{const v=parseInt(i.value);const t=trByK[i.dataset.cap];if(v>=range[0]&&v<=range[1]&&v!==t.cap){TCAP[t.k]=v;if(CF.capLast)TCAP._last=v;}else delete TCAP[t.k];try{localStorage.setItem(LS.cap,JSON.stringify(TCAP));}catch(error){}save();refresh();};});}
function setMove(side,slot,mi){const ck=sideInfo(side).key+':'+slot;delete ST.crit[ck];delete ST.hits[ck];delete ST.mvo[ck];const arr=getMon(side).m.slice();arr[slot]=mi;setField(side,'m',arr);}
function pickMove(side,slot){picker({title:'Move '+(slot+1),none:getMon(side).m[slot]!=null?'Remove move':undefined,items:M.map((n,i)=>({label:n,sub:MV[i].t+' · '+MV[i].c+' · '+(MV[i].bp||'—'),v:i})),onPick:v=>{setMove(side,slot,v);refreshMainOnly();}});}
const refresh=()=>{const y=scrollY;route2();scrollTo(0,y);};
function route2(){calcPage();SH.redraw();}
document.addEventListener('click',e=>{if(location.hash!=='#/calc')return;const el=e.target.closest('[data-a],[data-f]');if(!el||!el.closest('#app'))return;
 const a=el.dataset.a;
 if(el.dataset.f&&el.tagName==='BUTTON'){const k=el.dataset.f;ST.field[k]=ST.field[k]?0:1;window.__fo=1;save();refresh();return;}
 if(a==='row'&&e.target.closest('.dd'))return;
 if(a==='mpick'){ST.mine={src:el.dataset.src,b:+el.dataset.b,i:+el.dataset.i};save();refresh();}
 else if(a==='fpick'){ST.foe.i=+el.dataset.i;save();refresh();}
 else if(a==='sel'){if(e.target.closest('input,select,.nv,.num,.ed,.stb,.mg,.hpl'))return;ST.dir=el.dataset.s==='mine'?'out':'in';save();refresh();}
 else if(a==='row'){const ck=el.dataset.ck;ROWOPEN.has(ck)?ROWOPEN.delete(ck):ROWOPEN.add(ck);el.closest('.mr').classList.toggle('open');}
 else if(a==='crit'){const ck=el.dataset.ck;ST.crit[ck]=ST.crit[ck]?0:1;save();refresh();}
 else if(a==='hits'){const mi=+el.dataset.mi,ck=el.dataset.ck,m=MH[mi],n=hitsOf(mi,ck);ST.hits[ck]=n>=m[1]?m[0]:n+1;save();refresh();}
 else if(a==='sub'){const side=el.dataset.side==='mine'?'foe':'mine',r=resolve(getMon(side));setField(side,'hp',Math.max(0,r.hp-(+el.dataset.v)));refresh();}
 else if(a==='hpfull'){const mon=resolve(getMon(el.dataset.s));setField(el.dataset.s,'hp',mon.stats?.[0]||0);refresh();}
 else if(a==='eopen'){EDITOPEN[el.dataset.s]=!EDITOPEN[el.dataset.s];refresh();}
 else if(a==='mega'){megaToggle(el.dataset.s);refresh();}
 else if(a==='esave'){const k=sideInfo(el.dataset.s).key;ST.saved=ST.saved||{};ST.saved[k]={...ST.saved[k],...ST.edits[k]};delete ST.edits[k];save();refresh();}
 else if(a==='ereset'){const k=sideInfo(el.dataset.s).key;if(ST.edits[k]&&Object.keys(ST.edits[k]).length)delete ST.edits[k];else if(ST.saved&&ST.saved[k])delete ST.saved[k];save();refresh();}
 else if(a==='edel'){ST.custom.splice(ST.mine.i,1);ST.mine={src:'party',b:0,i:0};EDITOPEN.mine=false;save();refresh();}
 else if(a==='smode'){SMODE=SMODE==='+'?'-':'+';refresh();}
 else if(a==='sstep'){const side=el.dataset.s,x=+el.dataset.x,arr=resolve(getMon(side)).stg.slice();arr[x]=Math.max(stageRange[0],Math.min(stageRange[1],arr[x]+(SMODE==='+'?1:-1)));setField(side,'stg',arr);refresh();}
 else if(a==='sreset'){setField(el.dataset.s,'stg',[0,0,0,0,0]);refresh();}
 else if(a==='chmv'||a==='addmv'){pickMove(el.dataset.side,+el.dataset.slot);}
 else if(a==='mvreset'){delete ST.mvo[el.dataset.ck];save();refresh();}
 else if(a==='tprev'||a==='tnext'){const ti=D.TR.findIndex(x=>x.k===ST.foe.k)+(a==='tnext'?1:-1);if(D.TR[ti]){ST.foe={k:D.TR[ti].k,i:0};recent(D.TR[ti].k);save();refresh();}}
 else if(a==='bandis'){BAN=null;refresh();}
 else if(a==='foesheet'){SH.foe();}
 else if(a==='import'){startImport();}else if(a==='newmon'){newMon();}
 else if(a==='findmine'){findMine();}

});
function findMine(){const L=mineList().map(entry=>({...entry,m:entry.src==='custom'?entry.m:applyEdits(entry.m,'mine:'+entry.m.pid)}));picker({title:'Find yours',items:L.map(x=>({label:byId[x.m.id].n,sub:(x.src==='party'?'Party':x.src==='box'?'Box '+(x.b+1):'Custom')+' · Lv '+x.m.l,id:x.m.id,v:x})),onPick:x=>{ST.mine={src:x.src,b:x.b,i:x.i};save();refreshMainOnly();}});}
document.addEventListener('change',e=>{if(location.hash!=='#/calc')return;const s=e.target.closest('select[data-f]');if(s){ST.field[s.dataset.f]=s.value;window.__fo=1;save();refresh();}});
document.addEventListener('toggle',e=>{if(e.target.matches('details.dfield'))window.__fo=e.target.open;},true);
const recent=k=>{ST.recent=[k,...ST.recent.filter(x=>x!==k)].slice(0,6);};


const SHEETS=[];
function closeAll(){SHEETS.length=0;KB.close();host.innerHTML='';}
function pushSheet(s){history.pushState({...history.state,calcDepth:SHEETS.length+1},'',location.href);SHEETS.push(s);SH.redraw();}
function popSheet(){if(history.state?.calcDepth)history.back();else{KB.close();SHEETS.pop();SH.redraw();}}
const SH={redraw(){const host=$('#sheets');if(!SHEETS.length){host.innerHTML='';return;}
  host.innerHTML='';SHEETS.forEach((s,i)=>{const d=document.createElement('div');d.className='sheet';d.innerHTML=`<div class="shh"><button class="bk" data-s="back">‹ ${i?'Back':'Done'}</button><div class="tt">${esc(s.title())}</div>${s.actions?s.actions():''}</div><div class="shb">${s.body()}</div>`;host.appendChild(d);if(s.bind)s.bind(d);});
  host.querySelectorAll('[data-s="back"]').forEach(b=>b.onclick=()=>{popSheet();refreshMainOnly();});},
 foe(){pushSheet(foeSheet());}};
function refreshMainOnly(){calcPage();}



function defMoves(p,l){const m=(p.lv||[]).filter(x=>x[0]<=l).map(x=>x[1]);return [...new Set(m)].slice(-4);}
function newMon(){picker({title:'New Pokémon',items:P.map(p=>({label:p.n,sub:p.t.join(' / '),id:p.id,v:p.id})),onPick:id=>{const p=byId[id];let l=50;try{l=capOf(trByK[ST.foe.k])||50}catch(e){}
  l=Math.max(range[0],Math.min(range[1],l));const m={id,l,na:'Hardy',a:p.a[0],i:'',m:defMoves(p,l),iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0],pid:'c'+Date.now()};ST.custom.push(m);ST.mine={src:'custom',b:0,i:ST.custom.length-1};save();
  dismissSheets();EDITOPEN.mine=true;refreshMainOnly();}});}

const trCap=t=>capOf(t)?'Cap '+capOf(t):'';
function trRow(t,sel){return `<div role="button" tabindex="0" class="mrow ${sel?'sel':''}" data-s="pickfoe" data-k="${t.k}"><span class="tx"><b>${esc(t.n)}</b><small>${esc([t.loc,trCap(t)].filter(Boolean).join(' · '))}</small><span class="mini">${t.p.map(x=>spr(x.id,'s24')).join('')}</span></span></div>`;}
function foeSheet(){return {title:()=>'Foe',
 body(){const groups=[];D.TR.forEach(t=>{let g=groups[groups.length-1];if(!g||g.n!==t.g){g={n:t.g,t:[]};groups.push(g);}g.t.push(t);});
  const rec=ST.recent.map(k=>trByK[k]).filter(trainer=>trainer&&!rivalHidden(trainer));
  return `<div role="button" tabindex="0" class="fbtn" data-s="findtr"><span>Find trainer…</span></div>`+(trByK[ST.foe.k]?trRow(trByK[ST.foe.k],true):'')+(rec.length?`<div class="sec2">Recent</div>`+rec.map(t=>trRow(t,t.k===ST.foe.k)).join(''):'')+`<div class="sec2">All trainers</div>`+
   groups.map(g=>`<details class="grp" ><summary>${esc(g.n)} <span class="mut small">${g.t.length}</span></summary><div class="gb">${g.t.map(t=>trRow(t,t.k===ST.foe.k)).join('')}</div></details>`).join('');},
 bind(d){d.querySelectorAll('[data-s="pickfoe"]').forEach(x=>x.onclick=()=>pickFoe(x.dataset.k));
  const f=$('[data-s="findtr"]',d);if(f)f.onclick=()=>picker({title:'Find trainer',items:D.TR.map(t=>({label:t.n,sub:[t.loc,trCap(t),t.g.replace(/ Split.*/,'')].filter(Boolean).join(' · '),id:t.p[0].id,v:t.k})),onPick:pickFoe});}};}
function pickFoe(k){ST.foe={k,i:0};recent(k);save();dismissSheets();refreshMainOnly();}

function picker({title,items,onPick,none}){let q='';
 const s={title:()=>title,
  body(){return `<div class="fl"></div>`;},
  bind(d){const body=$('.shb',d),hd=$('.shh',d);
   const box=document.createElement('div');box.className='kbsh';
   box.innerHTML=INV?`<div class="disp2"><span class="q" data-ph="Search"></span><button class="x" aria-label="Clear">×</button></div>`:`<input type="search" placeholder="Search" autocomplete="off">`;
   hd.insertBefore(box,$('.tt',hd));$('.tt',hd).style.display='none';
   const paint=()=>{const n=norm(q);let L=items;if(n){L=items.filter(it=>norm(it.label).includes(n)).sort((a,b)=>(norm(b.label).startsWith(n)-norm(a.label).startsWith(n))||a.label.length-b.label.length);}
    const tot=L.length;L=L.slice(0,60);body.innerHTML=(none?`<div role="button" tabindex="0" class="mrow" data-n="1"><span class="tx"><b>${esc(none)}</b></span></div>`:'')+L.map((it,i)=>`<div role="button" tabindex="0" class="mrow" data-i="${i}">${it.id?spr(it.id,'s32'):''}<span class="tx"><b>${esc(it.label)}</b>${it.sub?`<small>${esc(it.sub)}</small>`:''}</span></div>`).join('')+(tot>60?`<div class="dnote">${tot-60} more · keep typing</div>`:'')+(!tot?'<div class="dnote">No match</div>':'');
    body.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{const it=L[+x.dataset.i];dismissSheets();onPick(it.v);});
    const nn=$('[data-n]',body);if(nn)nn.onclick=()=>{dismissSheets();onPick(null);};};
   const upd=()=>{const e=$('.q',box);if(e)e.textContent=q;paint();};
   if(INV){const openKeyboard=()=>KB.open({full:true,mode:'abc',value:q,input:value=>{q=value;upd();}});openKeyboard();$('.disp2',box).onclick=event=>{if(!event.target.closest('.x'))openKeyboard();};$('.x',box).onclick=()=>{q='';KB.buf='';if(KB.o)KB.show();upd();};}
   else{const inp=$('input',box);inp.oninput=()=>{q=inp.value;paint();};setTimeout(()=>inp.focus(),30);}
   paint();}};
 pushSheet(s);}


function fieldHTML(values){const entries=prof.field||[];return '<div class="dfr">'+entries.filter(entry=>entry.type==='select').map(entry=>`<label>${esc(entry.l)}<select data-f="${esc(entry.k)}">${(entry.o||[]).map(([value,label])=>`<option value="${esc(value)}" ${String(values[entry.k]??'')===String(value)?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`).join('')+'</div><div class="dtg">'+entries.filter(entry=>entry.type==='toggle').map(entry=>`<button data-f="${esc(entry.k)}" aria-pressed="${!!values[entry.k]}">${esc(entry.l)}</button>`).join('')+'</div>';}
const host=document.createElement('div');host.id='sheets';
const input=document.createElement('input');input.type='file';input.accept='.sav,.dsv,.bin,main';input.hidden=true;input.id='calc-file';
function startImport(){if(prof.save)input.click();}
const natureOrder=['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed','Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky'];
function importMon(mon,ours,index){const tables=sourceData.GID||{},lookup=(kind,value)=>ours?value:tables[kind]?.[value];const id=lookup('sp',mon.sp);if(!byId[id])throw {code:'wrong',game:'Unmapped species '+mon.sp};const species=byId[id];const ability=mon.abs!=null?(mon.abs===2?species.ha:species.a[mon.abs]):lookup('ab',mon.ab);return {pid:encodeURIComponent(String(mon.pid??index)),id,l:Math.max(range[0],Math.min(range[1],Number(mon.lv)||range[0])),na:typeof mon.nat==='string'?mon.nat:natureOrder[mon.nat||0],a:Number.isInteger(ability)&&sourceData.AB[ability]?ability:species.a[0],i:lookup('it',mon.it)||'',m:(mon.mv||[]).slice(0,4).map(move=>{const mapped=lookup('mv',move);return Number.isInteger(mapped)&&MV[mapped]?mapped:null;}),iv:Array.from({length:6},(_,slot)=>Math.max(0,Math.min(31,Number(mon.iv?.[slot]??31)||0))),ev:Array.from({length:6},(_,slot)=>Math.max(0,Math.min(252,Number(mon.ev?.[slot])||0)))};}
async function importFile(file){try{const reader=window.READERS?.[prof.save];if(!reader)throw {code:'unreadable'};const result=reader(new Uint8Array(await file.arrayBuffer()),sourceData);if(!result.party?.length)throw {code:'empty'};const ours=result.ids==='ours';const party=result.party.map((mon,index)=>importMon(mon,ours,'p'+index));const boxes=(result.boxes||[]).map((box,boxIndex)=>box.map((mon,index)=>importMon(mon,ours,boxIndex+':'+index)));const keys=new Set([...Object.keys(ST.edits),...Object.keys(ST.saved)].filter(key=>key.startsWith('mine:')&&!ST.custom.some(mon=>key==='mine:'+mon.pid)));keys.forEach(key=>{delete ST.edits[key];delete ST.saved[key];});for(const container of [ST.crit,ST.hits,ST.mvo])Object.keys(container).filter(key=>key.startsWith('mine:')&&!ST.custom.some(mon=>key.startsWith('mine:'+mon.pid+':'))).forEach(key=>delete container[key]);ST.imp={file:file.name,at:Date.now(),party,boxes};if(ST.mine.src!=='custom')ST.mine={src:'party',b:0,i:0};BAN={ok:1,h:'Imported '+file.name,t:party.length+' in the party, '+boxes.reduce((count,box)=>count+box.length,0)+' in boxes'+(keys.size?' · '+keys.size+' edited Pokémon reset':'')};save();}catch(error){const messages={wrong:['Wrong game',error.game?String(error.game):'This save is for a different game or platform.'],state:['Save state','Pick the battery .sav file, not an emulator save state.'],unreadable:['Unreadable','Both save slots fail their checksum. Save again in-game.'],empty:['No Pokémon yet','This save has no party. Get your starter and save first.']};const message=messages[error.code]||messages.unreadable;BAN={ok:0,h:message[0],t:message[1]};}calcPage();}
input.onchange=async()=>{if(input.files[0])await importFile(input.files[0]);input.value='';};
document.addEventListener('keydown',event=>{if(location.hash!=='#/calc'||!['Enter',' '].includes(event.key))return;const target=event.target.closest('[role="button"]');if(target){event.preventDefault();target.click();}});
function dismissSheets(){const count=SHEETS.length;closeAll();if(count&&history.state?.calcDepth)history.go(-count);}
addEventListener('popstate',()=>{const depth=history.state?.calcDepth||0;if(SHEETS.length>depth){KB.close();SHEETS.length=depth;SH.redraw();}});
addEventListener('hashchange',()=>{if(location.hash!=='#/calc')closeAll();});
function stops(){const foe=$('.fbar'),last=$('.dres:not(.na) .mr:last-child');if(!foe)return [0];const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);const values=[0,last?last.getBoundingClientRect().bottom+scrollY-innerHeight+3:0,foe.getBoundingClientRect().top+scrollY-2].map(value=>Math.round(Math.max(0,Math.min(max,value)))).sort((left,right)=>left-right);const out=[];for(const value of values){if(out.length>1&&value-out[out.length-1]<24)out[out.length-1]=value;else if(!out.length||value-out[out.length-1]>=24)out.push(value);}return out;}
function openMatch(){if(location.hash==='#/calc')calcPage();else location.hash='#/calc';requestAnimationFrame(()=>{const bar=$('.fbar');if(location.hash==='#/calc'&&bar)scrollTo(0,bar.getBoundingClientRect().top+scrollY-2);});}
window.CALC={leave(){closeAll();host.remove();input.remove();app.classList.remove('tl');if(!app.className)app.removeAttribute('class');delete app.dataset.avail;},render:calcPage,importFile,state:()=>ST,stops,enter(trainer,index){ST.foe={k:trainer,i:index};ST.dir='out';recent(trainer);save();openMatch();},use(species){const state=calcState(species),level=Math.max(range[0],Math.min(range[1],state.l));ST.custom.push({id:species.id,pid:'c'+Date.now(),l:level,na:state.n,a:species.a[0],i:'',iv:state.iv.slice(),ev:state.ev.slice(),m:defMoves(species,level)});ST.mine={src:'custom',b:0,i:ST.custom.length-1};save();openMatch();}};
if(location.hash==='#/calc'){document.body.classList.add('calc-route');calcPage();}
})(D);

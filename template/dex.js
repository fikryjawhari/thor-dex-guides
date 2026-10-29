// ===== APP START. Shared template (thor-dex-guides/template/dex.js). Data + sprites are parsed from the JSON script
// tags above; each hack's rules and schema are in hacks/<hack>/notes.md in the guides repo.
const D=JSON.parse(document.getElementById('data').textContent);
const SPR=JSON.parse(document.getElementById('spr').textContent);
// Per-hack settings from hacks/<hack>/hack.json (assemble.py puts them in D.cfg): names, storage keys, wording.
const CF=D.cfg,LS=CF.ls,TX=CF.txt;
const M=D.M,MV=D.MV,AB=D.AB,P=D.P,LOC=D.LOC,byId={};P.forEach((p,i)=>{p.tu=p.tu||[];p.i=i;p.name=p.n;p.key=(p.n+' '+p.dex).toLowerCase();byId[p.id]=p;});
// Saved state names moves, abilities, species and places, not their positions in the data: a guide update that inserts
// one shifts every later position. A repeated name (Hardlove's duplicate ability slots, Photonic Sun's Z-moves) carries
// its occurrence ("Swarm#2"). nameOf(list, index) gives the name to store, idxOf(list, name) this build's index (undefined
// = gone); a number (state saved before names) passes through as an index.
const NAMES=new Map();
function nameKeys(list){let keys=NAMES.get(list);if(!keys){const seen={};keys={names:[],index:new Map()};list.forEach((x,i)=>{const n=typeof x==='string'?x:Array.isArray(x)?x[0]:x.n,k=seen[n]=(seen[n]||0)+1,key=k>1?n+'#'+k:n;keys.names.push(key);keys.index.set(key,i);});NAMES.set(list,keys);}return keys;}
const nameOf=(list,i)=>Number.isInteger(i)?nameKeys(list).names[i]:i;
const idxOf=(list,v)=>typeof v==='string'?nameKeys(list).index.get(v):v;
const TC={normal:'#9fa19f',fire:'#e62829',water:'#2980ef',electric:'#d8b000',grass:'#3fa129',ice:'#3dcef3',fighting:'#ff8000',poison:'#9141cb',ground:'#915121',flying:'#81b9ef',psychic:'#ef4179',bug:'#91a119',rock:'#afa981',ghost:'#704170',dragon:'#5060e1',dark:'#624d4e',steel:'#60a1b8',fairy:'#ef70ef'};
const tcol=t=>TC[(t||'').toLowerCase()]||'#777';
const SN=['HP','Atk','Def','SpA','SpD','Spe'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Black text on the light type colours (white is under 3:1 on them), white on the rest, in both themes.
const BT=new Set(['normal','electric','ice','fighting','flying','bug','rock','steel','fairy']);
const btc=t=>BT.has((t||'').toLowerCase())?' bt':'';
const ty=t=>`<span class="ty${btc(t)}" style="background:${tcol(t)}">${esc(t)}</span>`;
// Sprites become blob: URLs on first use, so rendered HTML carries a short URL instead of the base64 (re-rendering
// the Pokemon list or walkthrough used to parse megabytes of data URIs and took seconds on the Thor).
const SPRU={};const sprUrl=id=>{if(SPRU[id]!==undefined)return SPRU[id];const d=SPR[id];let u='';
 if(d){try{const i=d.indexOf(',');const b=atob(d.slice(i+1));const a=new Uint8Array(b.length);for(let j=0;j<b.length;j++)a[j]=b.charCodeAt(j);u=URL.createObjectURL(new Blob([a],{type:d.slice(5,d.indexOf(';'))}));}catch(e){u=d;}}
 return SPRU[id]=u;};
// No sprite: a circle in the primary type's colour with the name's first letter, text coloured like that type's tag.
const spr=(id,c)=>{const u=sprUrl(id);if(u)return `<div class="spr ${c}" style="background-image:url(${u})"></div>`;
 const p=byId[id],t=p?p.t[0]:'',l=p?(p.n.match(/[A-Za-z0-9]/)||['?'])[0].toUpperCase():'?';
 return `<div class="spr ${c} sprph${btc(t)}" style="background:${tcol(t)}"><span>${esc(l)}</span></div>`;};
const plink=id=>byId[id]?`<a href="#/p/${id}">${esc(byId[id].name)}</a>`:'';
const mlink=i=>`<a href="#/m/${i}">${esc(M[i])}</a>`;
const alink=i=>`<a href="#/a/${i}">${esc(AB[i][0])}</a>`;
const cat=c=>c?`<span class="cat ${c}">${c==='Physical'?'Phys':c==='Special'?'Spec':'Status'}</span>`:'';
// Features show only when the hack's data has them: tutor moves, EVs (CF.evs), starter picker (CF.starter).
const HASTU=P.some(p=>p.tu.length),EVS=CF.evs!==false,PICK=['pick','type'].includes(CF.starter);
function tag(p){let r='';if(p.g===1)r+='&#8203;<span class="tag">Mega</span>';if(p.fc)r+='&#8203;<span class="tag">Form change</span>';else if(p.g===3||p.nu)r+=CF.g3trainer||TRUSE&&TRUSE[p.id]?'&#8203;<span class="tag">Trainer only</span>':'&#8203;<span class="tag">Not found</span>';return r;}
const NAT={Lonely:[1,2],Brave:[1,5],Adamant:[1,3],Naughty:[1,4],Bold:[2,1],Relaxed:[2,5],Impish:[2,3],Lax:[2,4],Timid:[5,1],Hasty:[5,2],Jolly:[5,3],Naive:[5,4],Modest:[3,1],Mild:[3,2],Quiet:[3,5],Rash:[3,4],Calm:[4,1],Gentle:[4,2],Sassy:[4,5],Careful:[4,3]};
const NATS=['Hardy','Docile','Serious','Bashful','Quirky',...Object.keys(NAT)].sort();
function stat(b,i,iv,ev,lv,nat){if(i===0)return b===1?1:Math.floor((2*b+iv+Math.floor(ev/4))*lv/100)+lv+10;let v=Math.floor((2*b+iv+Math.floor(ev/4))*lv/100)+5;const n=NAT[nat];if(n){if(n[0]===i)v=Math.floor(v*1.1);else if(n[1]===i)v=Math.floor(v*0.9);}return v;}
const natLabel=n=>{const x=NAT[n];return x?n+' (+'+SN[x[0]]+' -'+SN[x[1]]+')':n+' (neutral)';};
// learn[moveIdx] = [[pokemon, how]] reverse index used by move pages and move filters
const learn={};const L=(i,p,how)=>{(learn[i]=learn[i]||[]).push([p,how]);};
P.forEach(p=>{p.lv.forEach(([l,m])=>L(m,p,l?'Lv '+l:'Evo'));p.tm.forEach(m=>L(m,p,'TM'));p.tu.forEach(m=>L(m,p,'Tutor'));p.eg.forEach(m=>L(m,p,'Egg'));});
P.forEach(p=>{p.ms=new Set([...p.lv.map(x=>x[1]),...p.tm,...p.tu,...p.eg]);p.ls=new Set(p.w.map(w=>w[0]));p.as=new Set([...p.a,p.ha].filter(x=>x>=0));});
const locs={};P.forEach(p=>p.w.forEach(w=>{(locs[w[0]]=locs[w[0]]||[]).push([p,w]);}));
const abUsers={};P.forEach(p=>p.as.forEach(a=>{(abUsers[a]=abUsers[a]||[]).push(p);}));
const types=[...new Set(P.flatMap(p=>p.t))].sort();
const usedMoves=M.map((m,i)=>i).filter(i=>learn[i]);
const st={q:'',f:[],sort:'dex',av:'all',listScroll:null,view:''};
// Move, ability and place filters are stored by name (nameOf); one that no longer exists drops out.
const FLIST={mv:M,ab:AB,loc:LOC},fname=f=>FLIST[f.k]?{...f,v:nameOf(FLIST[f.k],f.v)}:f;
try{const s=JSON.parse(localStorage.getItem(LS.dex)||'{}');['f','sort','av'].forEach(k=>{if(s[k]!=null)st[k]=s[k];});}catch(e){}
if(!Array.isArray(st.f))st.f=[];st.f=st.f.map(f=>FLIST[f?.k]?{...f,v:idxOf(FLIST[f.k],f.v)}:f).filter(f=>f&&f.v!=null&&(!FLIST[f.k]||FLIST[f.k][f.v]!=null));
if(st.sort==='bst')st.sort='dex';if(st.av==='chg')st.av='all';
const save=()=>{try{localStorage.setItem(LS.dex,JSON.stringify({f:st.f.map(fname),sort:st.sort,av:st.av}))}catch(e){}};
// ===== IN-PAGE KEYBOARD (Dex Viewer only). The viewer's window never takes the Android keyboard, so there the search
// box and number boxes are buttons, and these keyboards type into them. Elsewhere (a phone browser) the page keeps its
// real inputs. The viewer is recognised by its host; localStorage "dvkb" = "1" forces the keyboard for testing.
const INV=/\.appassets\.androidplatform\.net$/.test(location.hostname)||(()=>{try{return localStorage.getItem('dvkb')==='1'}catch(e){return false}})();
// Name matching that ignores punctuation, spaces, accents and the gender signs: "mrmime", "typenull", "flabebe".
const norm=x=>String(x).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const KROWS=['1234567890','QWERTYUIOP','ASDFGHJKL:',"ZXCVBNM.'-"];
// One keyboard at a time. o = {mode:'abc'|'num', value, input(text), strip(text) for a results strip, pick(id),
// target + done(text) for a number box, label, onClose(quiet)}.
const KB={o:null,el:null,buf:'',fresh:false,rep:false,
 open(o){if(this.o)this.close(true);this.o=o;this.buf=o.value==null?'':String(o.value);this.fresh=o.mode==='num';
  document.body.classList.add('kbopen');this.draw();
  // keep the box being edited in sight, between the sticky header and the pad
  const t=o.target;if(t){const r=t.getBoundingClientRect(),hd=document.querySelector('header'),top=(hd&&hd.offsetParent!==null?hd.getBoundingClientRect().bottom:0)+8,lim=innerHeight-this.el.offsetHeight-8;
   if(r.bottom>lim)window.scrollBy(0,r.bottom-lim);else if(r.top<top)window.scrollBy(0,r.top-top);}},
 close(quiet){const o=this.o;if(!o)return;this.o=null;if(this.el)this.el.remove();this.el=null;document.body.classList.remove('kbopen');if(o.onClose)o.onClose(quiet);},
 // Keys are 42px tall when there's room, never under 30, leaving the sticky header and a row of results visible.
 size(rows,extra){const hd=document.querySelector('header');const hh=hd&&hd.offsetParent!==null?hd.offsetHeight:0;
  return Math.max(30,Math.min(42,Math.floor((innerHeight-hh-extra-13-4*(rows-1))/rows)));},
 draw(){const o=this.o,num=o.mode==='num';
  // The full-window search's keyboard (o.full) has 4 rows, so its keys are taller; 123 swaps the top row for digits.
  const h=o.full?Math.max(34,Math.min(46,Math.floor((innerHeight-44-96-25)/4))):this.size(num?2:5,num?24:o.strip?48:60);
  const k=(t,c,a)=>`<button type="button" class="k ${c||''}" ${a||''}>${t}</button>`,ks=r=>[...r].map(ch=>k(ch,'',`data-c="${ch}"`)).join('');
  const html=o.full?`<div class="r">${ks(o.digits?'1234567890':'QWERTYUIOP')}</div><div class="r r9">${ks('ASDFGHJKL')}</div>
<div class="r r3">${k(o.digits?'ABC':'123','fn','data-a="dig"')}${ks('ZXCVBNM')}${k('⌫','fn','data-a="bs" aria-label="Delete"')}</div><div class="r rb">${k('Space','fn','data-c=" "')}${k('Done','done','data-a="done"')}</div>`
   :num?`<div class="lbl"><span>${esc(o.label)}</span><b class="kv"></b></div><div class="r">${[...'1234567890'].map(d=>k(d,'',`data-c="${d}"`)).join('')}</div>
<div class="r nb">${k('Clear','fn','data-a="clear"')}${k('−','fn','data-a="dn" aria-label="Less"')}${k('+','fn','data-a="up" aria-label="More"')}${k('⌫','fn','data-a="bs" aria-label="Delete"')}${k('Done','done','data-a="done"')}</div>`
   :(o.strip?`<div class="kbs"><span class="kq" data-ph="${esc(o.label||'Name')}"></span><div class="kres"></div></div>`:'')+KROWS.map(r=>`<div class="r">${[...r].map(ch=>k(esc(ch),'',`data-c="${ch==="'"?'&#39;':ch}"`)).join('')}</div>`).join('')+
    `<div class="r b">${k('Clear','fn','data-a="clear"')}${k('Space','fn','data-c=" "')}${k('⌫','fn','data-a="bs" aria-label="Delete"')}${k('Done','done','data-a="done"')}</div>`;
  if(!this.el){this.el=document.createElement('div');this.el.className='kb';document.body.appendChild(this.el);this.bind();}
  this.el.style.setProperty('--kh',h+'px');this.el.style.setProperty('--kf',(h<34?15:17)+'px');this.el.innerHTML=`<div class="in">${html}</div>`;
  document.documentElement.style.setProperty('--kbh',this.el.offsetHeight+'px');this.show();},
 show(){const o=this.o;if(o.mode==='num')this.el.querySelector('.kv').textContent=this.buf||'–';
  else if(o.strip){this.el.querySelector('.kq').textContent=this.buf;this.el.querySelector('.kres').innerHTML=o.strip(this.buf);}},
 bind(){const el=this.el;let t1,t2;const stop=()=>{clearTimeout(t1);clearInterval(t2);};
  // Holding ⌫ repeats; the click that ends a repeat doesn't delete once more.
  el.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-a="bs"]'))return;this.rep=false;stop();t1=setTimeout(()=>{t2=setInterval(()=>{this.rep=true;this.key(null,'bs');},70);},420);});
  ['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,stop));
  el.addEventListener('click',e=>{const p=e.target.closest('.kpick');if(p&&this.o){this.o.picked=true;this.o.pick(p.dataset.id);return;}
   const b=e.target.closest('.k');if(!b)return;if(b.dataset.a==='bs'&&this.rep){this.rep=false;return;}this.key(b.dataset.c,b.dataset.a);});},
 key(c,a){const o=this.o;if(!o)return;
  if(o.mode==='num'){const st=+o.target.dataset.step||1;
   if(c!=null)this.buf=((this.fresh?'':this.buf)+c).slice(-3);
   else if(a==='clear')this.buf='';else if(a==='bs')this.buf=this.buf.slice(0,-1);
   else if(a==='up'||a==='dn')this.buf=String(clampNum(o.target,(parseInt(this.buf)||0)+(a==='up'?st:-st)));
   else if(a==='done'){const v=this.buf;this.close();o.done(v);return;}
   this.fresh=false;this.show();return;}
  if(c!=null){if(c===' '&&(!this.buf||this.buf.endsWith(' ')))return;this.buf+=c.toLowerCase();}
  else if(a==='clear')this.buf='';else if(a==='bs')this.buf=this.buf.slice(0,-1);
  else if(a==='dig'){o.digits=!o.digits;this.draw();return;}
  else if(a==='done'){this.close();return;}
  this.show();if(o.input)o.input(this.buf);}};
window.addEventListener('resize',()=>{if(KB.o)KB.draw();});
// The search box as a button with value/placeholder properties, so the code below uses it like the <input>. Tapping it
// opens the full-window search, in the viewer and in a browser alike.
function searchDisp(inp){const b=document.createElement('button');b.type='button';b.id='q';b.className='disp';b.setAttribute('aria-label','Search');
 b.innerHTML='<span class="tx"></span><span class="x" aria-label="Clear search">×</span>';let val='',ph=inp.placeholder||'';
 const show=()=>{const t=b.firstChild;t.textContent=val;t.dataset.ph=ph;b.classList.toggle('has',!!val);};
 Object.defineProperty(b,'value',{get:()=>val,set:v=>{val=String(v);show();}});
 Object.defineProperty(b,'placeholder',{get:()=>ph,set:v=>{ph=v;show();}});
 inp.replaceWith(b);show();
 b.addEventListener('click',e=>{if(e.target.closest('.x')){b.value='';b.dispatchEvent(new Event('input'));return;}SR.open();});
 return b;}
// Number box: an <input type="number"> outside the viewer; inside it, a button showing the value that opens the number
// pad (with − and + beside it when steppers). Buttons have a value property and fire input/change, so handlers read
// them like inputs.
function numBox(attrs,v,{min,max,step=1,steppers=false,label=''}){if(!INV)return `<input type="number" ${attrs} min="${min}" max="${max}"${step>1?` step="${step}"`:''} value="${v}">`;
 const b=`<button type="button" class="nv" ${attrs} value="${v}" data-min="${min}" data-max="${max}" data-step="${step}" data-label="${esc(label)}">${v===''?'–':v}</button>`;
 return steppers?`<span class="num"><button type="button" class="st" data-d="-1" aria-label="Less">−</button>${b}<button type="button" class="st" data-d="1" aria-label="More">+</button></span>`:b;}
function clampNum(b,v){const lo=+b.dataset.min,hi=+b.dataset.max,st=+b.dataset.step||1;v=Math.max(lo,Math.min(hi,v));if(st>1)v=Math.round(v/st)*st;return Math.max(lo,Math.min(hi,v));}
function setNum(b,v){b.value=String(v);b.textContent=v;b.dispatchEvent(new Event('input',{bubbles:true}));b.dispatchEvent(new Event('change',{bubbles:true}));}
document.addEventListener('click',e=>{if(!INV)return;
 const s=e.target.closest('.num .st');if(s){const b=s.parentElement.querySelector('.nv');const st=+b.dataset.step||1;setNum(b,clampNum(b,(parseInt(b.value)||+b.dataset.min)+(+s.dataset.d)*st));return;}
 const b=e.target.closest('button.nv');if(!b||(KB.o&&KB.o.target===b))return;
 b.classList.add('open');KB.open({mode:'num',target:b,value:b.value,label:`${b.dataset.label} (${b.dataset.min}–${b.dataset.max})`,
  done:v=>{if(CF.calc&&b.dataset.clr&&v===''){setNum(b,'');return;}const n=parseInt(v);if(!isNaN(n))setNum(b,clampNum(b,n));},onClose:()=>b.classList.remove('open')});});
// Encounter "Other…": the letters keyboard with matching Pokemon in a strip above the keys.
function otherKb(a){const A=AR[a];const res=x=>{const n=norm(x);return n.length<2?[]:P.filter(p=>p.g===0&&(p.nk??=norm(p.n)).includes(n)).slice(0,12);};
 KB.open({mode:'abc',value:'',label:A?A.n:'Name',strip:x=>{const r=res(x);return r.length?r.map(p=>`<button type="button" class="kpick" data-id="${esc(p.id)}">${spr(p.id,'s32')}<span>${esc(p.name)}</span></button>`).join('')
   :`<span class="mut small">${norm(x).length<2?'Type a Pokémon name':'No match'}</span>`;},
  pick:id=>{TK.e[a]={p:id};tkSave();KB.close();rerender();},onClose(quiet){if(!quiet&&!this.picked)rerender();}});}
const app=document.getElementById('app'),q=searchDisp(document.getElementById('q')),fil=document.getElementById('filters');
document.getElementById('sugg').style.display='none';
// Typing on a page with no list (Pokemon, move, ability or trainer page) goes to its section's list as a new history
// entry, so the results show and Back returns to the page. The keyboard stays open (see hashchange).
const UP={p:'#/',m:'#/',a:'#/',tr:'#/trainers'};let searchNav=false;
q.addEventListener('input',()=>{st.q=q.value.trim().toLowerCase();if(st.q&&UP[st.view]){searchNav=true;location.hash=UP[st.view];return;}render(true);});
// The rail's top button opens the full-window search (the search box shows only while a query is set: dex.css).
document.getElementById('t-s').addEventListener('click',e=>{e.preventDefault();SR.open();});
// The search stays set across pages (detail pages hide it) until its × clears it, or a tap on the tab you're already on.
document.getElementById('rail').addEventListener('click',e=>{const a=e.target.closest('a[href^="#/"]');
 if(a&&a.getAttribute('href')===(location.hash||'#/')&&q.value){e.preventDefault();q.value='';q.dispatchEvent(new Event('input'));window.scrollTo(0,0);}});
if(!CF.calc)document.getElementById('t-c').remove();
function setTab(t){['p','l','t','i','w','c'].forEach(x=>document.getElementById('t-'+x)?.classList.toggle('on',x===t));}
// ===== POKEMON TAB: chip filters (type / ability / move / location)
const FL={type:'Type',ab:'Ability',mv:'Move',loc:'Found at'};
const fval=f=>f.k==='mv'?M[f.v]:f.k==='loc'?LOC[f.v]:f.k==='ab'?AB[f.v][0]:f.v;
function filtersPokemon(){fil.innerHTML=`<div class="chips">${st.f.map((f,j)=>`<span class="chip"><b>${FL[f.k]}</b>${f.k==='type'?ty(f.v):esc(fval(f))}<button data-j="${j}" aria-label="Remove">×</button></span>`).join('')}</div>
<div class="sorts"><select id="fs">${[['dex','Dex order'],['name','Name'],...SN.map((s,i)=>['s'+i,s])].map(([v,l])=>`<option value="${v}" ${st.sort===v?'selected':''}>${l}</option>`).join('')}</select>
<select id="fa">${[['all','All Pokémon'],['obt',TX.obt],['nomega','Hide Megas'],['nw',TX.nw]].map(([v,l])=>`<option value="${v}" ${st.av===v?'selected':''}>${l}</option>`).join('')}</select></div>`;
 fil.querySelectorAll('.chip button').forEach(b=>b.onclick=()=>{st.f.splice(+b.dataset.j,1);save();render(true);});
 fil.querySelector('#fs').onchange=e=>{st.sort=e.target.value;save();render(true)};
 fil.querySelector('#fa').onchange=e=>{st.av=e.target.value;save();render(true)};}
function howLearn(p,i){const r=[];p.lv.forEach(([l,m])=>{if(m===i)r.push(l?'Lv '+l:'Evo')});if(p.tm.includes(i))r.push('TM');if(p.tu.includes(i))r.push('Tutor');if(p.eg.includes(i))r.push('Egg');return r.join(', ');}
const avOk=p=>st.av==='all'||(st.av==='obt'&&p.g===0)||(st.av==='nomega'&&p.g!==1)||(st.av==='nw'&&(p.g===3||!!p.nu));
function listPokemon(){const typeF=st.f.filter(f=>f.k==='type').map(f=>f.v),abF=st.f.filter(f=>f.k==='ab').map(f=>f.v),mvF=st.f.filter(f=>f.k==='mv').map(f=>f.v),locF=st.f.filter(f=>f.k==='loc').map(f=>f.v);
 const nq=norm(st.q);
 let a=P.filter(p=>avOk(p)&&typeF.every(t=>p.t.includes(t))&&abF.every(x=>p.as.has(x))&&mvF.every(i=>p.ms.has(i))&&locF.every(i=>p.ls.has(i))&&(!st.q||p.key.includes(st.q)||(nq&&(p.nk??=norm(p.n)).includes(nq))));
 const s=st.sort;if(s==='name')a=[...a].sort((x,y)=>x.name.localeCompare(y.name));else if(s[0]==='s'&&s!=='dex'){const k=+s.slice(1);a=[...a].sort((x,y)=>y.s[k]-x.s[k]);}
 const extra=p=>{let r=(s[0]==='s'&&s!=='dex')?SN[+s.slice(1)]+' '+p.s[+s.slice(1)]:'';if(mvF.length===1)r=esc(howLearn(p,mvF[0]))+(r?'<br>'+r:'');return r?`<span class="bst">${r}</span>`:'';};
 app.innerHTML=`<div class="list">${a.map(p=>`<a class="row" href="#/p/${p.id}">${spr(p.id,'s40')}<span class="rt"><span class="nm">${esc(p.name)}${tag(p)}</span><span>${p.t.map(ty).join('')}</span></span>${extra(p)}</a>`).join('')}</div>`;
}
// ===== POKEMON PAGE
function whereTable(p){let h='';
 if(p.g===1)h=p.nu?`<div class="mut">Mega form. ${p.stone?esc(p.stone)+' is':'Its stone is'} not obtainable in ${esc(CF.name)}; listed because trainers use it.</div>`:`<div class="mut">Mega form. ${p.stone?(p.sloc?esc(p.stone)+': '+esc(p.sloc):'Mega Stone: '+esc(p.stone)+'.'):CF.orbs&&(p.n.startsWith('Primal')||/Rayquaza/.test(p.n))?'Orb or move based (see Useful NPCs in Items).':'No stone location in the items sheet.'}</div>`;
 else if(p.fc){const b=P.find(x=>x.dex===p.dex&&!x.fc&&x.g!==1);h=`<div class="mut">Form change of ${b?plink(b.id):'its base form'} (held item, move or in battle), so it is available whenever ${b?esc(b.name):'the base form'} is.</div>`;}
 else if(p.g===3)h=`<div class="mut">${TX.g3}</div>`;
 else if(!p.w.length)h=`<div class="mut">No direct wild encounter. Obtained by evolving or breeding (see Evolution).</div>`;
 else h=`<table class="wh"><tr><th>Location</th><th>Method</th><th>Rate</th><th>Lv</th></tr>${[...p.w].sort((a,b)=>locRank(a[0])-locRank(b[0])||a[0]-b[0]).map(w=>`<tr><td><a href="#/l/${w[0]}">${esc(LOC[w[0]])}</a>${w[4]?`<div class="mut small">${esc(w[4])}</div>`:''}</td><td>${esc(w[1])}</td><td class="n">${esc(w[2])}</td><td class="n">${esc(w[3])}</td></tr>`).join('')}</table>`;
 if(p.hi&&p.hi.length)h+=`<div class="mut small" style="margin-top:6px">Wild held item${p.hi.length>1?'s':''}: ${p.hi.map(esc).join(', ')}</div>`;
 return h;}
function confBox(cf){return cf&&cf.length?`<div class="card conf"><h3>Sources disagree</h3><ul>${cf.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="mut small" style="margin-top:4px">${TX.conf}</div></div>`:'';}
function evoBlock(p){const li=arr=>arr.map(([how,id])=>`<li>${plink(id)} <span class="mut">${esc(how)}</span></li>`).join('');
 let h='';if(p.ef.length)h+=`<div class="mut small">Evolves from</div><ul class="evo">${li(p.ef)}</ul>`;
 if(p.et.length)h+=`<div class="mut small"${p.ef.length?' style="margin-top:6px"':''}>Evolves into</div><ul class="evo">${li(p.et)}</ul>`;
 if(p.of.length)h+=`<div style="margin-top:6px" class="mut">Other forms: ${p.of.map(plink).join(', ')}</div>`;
 return h||'<div class="mut">Does not evolve.</div>';}
function defBlock(p){const g={};types.forEach(a=>{let m=1;p.t.forEach(d=>{m*=((D.TC[a]||{})[d]??10)/10;});if(m!==1)(g[m]=g[m]||[]).push(a);});
 const row=(m,l)=>g[m]?`<div style="margin:3px 0"><span class="mut" style="display:inline-block;width:44px">${l}</span>${g[m].map(ty).join('')}</div>`:'';
 return row(4,'4×')+row(2,'2×')+row(0.5,'½×')+row(0.25,'¼×')+row(0,'0×')+`<div class="mut small" style="margin-top:4px">${TX.tc} Abilities (Levitate and so on) not included.</div>`;}
const mcells=i=>{const v=MV[i]||{};return `<td>${mlink(i)}${v.x?` <span class="tag">${CF.orig}</span>`:v.dc||(v.h&&v.h.length)?' <span class="tag">changed</span>':''}${v.cf?'<span class="warn">!</span>':''}</td><td>${v.t?ty(v.t):''}</td><td>${cat(v.c)}</td><td class="n">${v.bp??'-'}</td><td class="n">${v.ac!=null?v.ac+'%':'-'}</td>`;};
const mhead='<th>Move</th><th>Type</th><th>Cat</th><th>Pow</th><th>Acc</th>';
let moveTab='lv';
const abLine=i=>`${alink(i)}${AB[i][2]?` <span class="tag">${CF.orig}</span>`:AB[i][3]?' <span class="tag">changed</span>':''}<div class="mut small">${esc(AB[i][3]||AB[i][1])}</div>`;
function detail(id){const p=byId[id];if(!p){app.innerHTML='<p>Not found.</p>';return;}fil.innerHTML='';
 const byName=a=>[...a].sort((x,y)=>M[x].localeCompare(M[y]));
 const tbl=(a,lv)=>a.length?`<table><tr>${lv?'<th>Lv</th>':''}${mhead}</tr>${a.map(x=>lv?`<tr><td class="n">${x[0]||'Evo'}</td>${mcells(x[1])}</tr>`:`<tr>${mcells(x)}</tr>`).join('')}</table>`:'<div class="mut">None</div>';
 const mv={lv:['Level-up',p.lv.length,()=>tbl(p.lv,true)],tm:['TM/HM',p.tm.length,()=>tbl(byName(p.tm))],...HASTU?{tu:['Tutor',p.tu.length,()=>tbl(byName(p.tu))]}:{},eg:['Egg',p.eg.length,()=>tbl(byName(p.eg))]};
 if(!mv[moveTab])moveTab='lv';
 app.innerHTML=`<a class="back" href="#/">‹ All Pokémon</a>
 <div class="card hero">${spr(p.id,'s112')}<div><h2>${esc(p.name)}${tag(p)}</h2>${p.dex?`<div class="mut small">#${p.dex}</div>`:''}<div style="margin-top:4px">${p.t.map(ty).join('')}</div></div></div>
 ${confBox(p.cf)}
 <div class="card"><h3>Abilities</h3>${p.a.map(i=>`<div style="margin:4px 0">${abLine(i)}</div>`).join('')}${p.ha>=0?`<div style="margin:6px 0 0"><span class="mut small">Hidden</span> ${abLine(p.ha)}</div>`:''}</div>
 <div class="card"><h3>Base stats</h3>${p.s.map((v,i)=>`<div class="stat"><span class="mut">${SN[i]}</span><span class="v">${v}</span><span class="b"><i style="width:${Math.min(100,v/160*100)}%;background:${v<60?'#e05252':v<90?'#e0a030':v<120?'#5cb85c':'#3aa0d8'}"></i></span></div>`).join('')}</div>
 ${calcCard(p)}<div class="card"><h3>Type defences</h3>${defBlock(p)}</div>
 <div class="card"><h3>Where to find</h3>${whereTable(p)}</div>
 <div class="card"><h3>Evolution</h3>${evoBlock(p)}</div>
 ${usedByCard(p)}
 <div class="card"><h3>Moves</h3><div class="sub">${Object.entries(mv).map(([k,v])=>`<button data-k="${k}" class="${k===moveTab?'on':''}">${v[0]} (${v[1]})</button>`).join('')}</div><div id="mvb" style="overflow-x:auto">${mv[moveTab][2]()}</div></div>`;
 app.querySelectorAll('.sub button').forEach(b=>b.onclick=()=>{moveTab=b.dataset.k;app.querySelectorAll('.sub button').forEach(x=>x.classList.toggle('on',x===b));app.querySelector('#mvb').innerHTML=mv[moveTab][2]();});
 bindCalc(p);window.scrollTo(0,0);}
// Stat calculator state, one key per species by name (LS.calc + ':' + nameOf(P, i)); one stored by species id (before
// names: in Emerald Imperium the id is the game's species number) moves to its name once, at load.
const calcKey=p=>LS.calc+':'+nameOf(P,p.i);
try{const pre=LS.calc+':',ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(pre))ks.push(k);}
 for(const k of ks){const v=k.slice(pre.length),p=byId[v];if(!p||nameKeys(P).index.has(v))continue;const nk=calcKey(p);if(localStorage.getItem(nk)==null)localStorage.setItem(nk,localStorage.getItem(k));localStorage.removeItem(k);}}catch(e){}
function calcState(p){let s=null;try{s=JSON.parse(localStorage.getItem(calcKey(p))||'null')}catch(e){}if(!s){let l=50;try{l=+(localStorage.getItem(LS.calc+':lastlv')||50)}catch(e){}s={l,n:'Hardy',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]};}return s;}
function calcCard(p){const s=calcState(p);return `<div class="card calc"><h3>Stat calculator</h3>
 <div class="bar" style="margin:0 0 8px"><span class="mut small">Level ${numBox('id="c-l"',s.l,{min:1,max:100,steppers:true,label:'Level'})}</span><select id="c-n">${NATS.map(n=>`<option value="${n}" ${n===s.n?'selected':''}>${natLabel(n)}</option>`).join('')}</select></div>
 <div style="overflow-x:auto"><table><tr><th></th>${SN.map(n=>`<th>${n}</th>`).join('')}</tr>
 <tr><th>IV</th>${SN.map((n,i)=>`<td>${numBox(`data-iv="${i}"`,s.iv[i],{min:0,max:31,label:'IV '+n})}</td>`).join('')}</tr>
 ${EVS?`<tr><th>EV</th>${SN.map((n,i)=>`<td>${numBox(`data-ev="${i}"`,s.ev[i],{min:0,max:252,step:4,label:'EV '+n})}</td>`).join('')}</tr>`:''}
 <tr><th>Stat</th>${SN.map((n,i)=>`<td class="res" id="c-r${i}"></td>`).join('')}</tr></table></div>
 ${EVS?'':`<div class="mut small" style="margin-top:6px">${TX.noev}</div>`}<div class="mut small" style="margin-top:8px">Speed by level (rare candy planning)</div><div class="lvrow" id="c-lv"></div></div>`;}
function bindCalc(p){const g=id=>app.querySelector(id);if(!g('#c-l'))return;
 if(CF.calc){const button=document.createElement('button');button.className='calc-use';button.textContent='Use in calc ▸';button.onclick=()=>window.CALC?.use(p);g('.calc').appendChild(button);}
 const upd=()=>{const s={l:Math.max(1,Math.min(100,parseInt(g('#c-l').value)||1)),n:g('#c-n').value,iv:[...app.querySelectorAll('[data-iv]')].map(e=>Math.max(0,Math.min(31,parseInt(e.value)||0))),ev:EVS?[...app.querySelectorAll('[data-ev]')].map(e=>Math.max(0,Math.min(252,parseInt(e.value)||0))):[0,0,0,0,0,0]};
  SN.forEach((n,i)=>{g('#c-r'+i).textContent=stat(p.s[i],i,s.iv[i],s.ev[i],s.l,s.n);});
  const lv=[];for(let L=Math.max(1,s.l-2);L<=Math.min(100,s.l+6);L++)lv.push(`<span class="${L===s.l?'cur':''}">Lv ${L}: <b>${stat(p.s[5],5,s.iv[5],s.ev[5],L,s.n)}</b></span>`);g('#c-lv').innerHTML=lv.join('');
  try{localStorage.setItem(calcKey(p),JSON.stringify(s));localStorage.setItem(LS.calc+':lastlv',s.l);}catch(e){}};
 app.querySelectorAll('.calc input,.calc select,.calc .nv').forEach(e=>e.addEventListener('input',upd));upd();}
// ===== MOVE PAGE
function moveDetail(i){fil.innerHTML='';const v=MV[i]||{};const r=(learn[i]||[]);const tms=(D.IT||[]).filter(s=>s.k==='tm').flatMap(s=>s.r.filter(x=>x[2]===i).map(x=>[s.n==='Move Tutors'?'Tutor':x[0].split(' ')[0],x[1]]));
 const order={Evo:0,Lv:0,TM:1,Tutor:2,Egg:3};r.sort((a,b)=>(order[a[1].split(' ')[0]]-order[b[1].split(' ')[0]])||a[0].i-b[0].i);
 app.innerHTML=`<a class="back" href="javascript:history.back()">‹ Back</a>
 <div class="card"><h2 style="margin:0 0 6px">${esc(M[i])}${v.x?` <span class="tag">${CF.orig} original</span>`:''}</h2><div>${v.t?ty(v.t):''} ${cat(v.c)}</div>
 <div class="mvst">${[['Power',v.bp??'-'],['Accuracy',v.ac!=null?v.ac+'%':'Never misses'],['PP',v.pp??'-'],['Priority',v.pr>0?'+'+v.pr:v.pr||0]].map(([n,x])=>`<div><span>${n}</span><b>${x}</b></div>`).join('')}</div>
 ${v.d?`<p style="margin:8px 0 0">${esc(v.d)}</p>`:''}${tms.map(t=>`<div style="margin-top:6px"><b>${esc(t[0])}:</b> ${esc(t[1])}</div>`).join('')}${v.f&&v.f.length?`<div class="mut small" style="margin-top:4px">Flags: ${v.f.map(esc).join(', ')}</div>`:''}
 ${v.e?`<div style="margin-top:8px"><b style="color:var(--acc)">${TX.chdoc}</b><div>${esc(v.e).replace(/\n/g,'<br>')}</div></div>`:''}
 ${v.h&&v.h.length?`<div style="margin-top:8px"><b style="color:var(--acc)">${TX.mvh}</b><ul>${v.h.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${v.dc||!TX.nodc?'':`<div class="mut small">${TX.nodc}</div>`}</div>`:''}${v.cf?confBox(v.cf):''}
 <div class="mut small" style="margin-top:8px">${TX.mvsrc}${v.x&&TX.mvsrcx?TX.mvsrcx:''}.</div></div>
 <div class="card"><h3>Learned by (${r.length})</h3><table class="lrn">${r.map(([p,h])=>`<tr><td style="width:44px">${spr(p.id,'s40')}</td><td>${plink(p.id)}${tag(p)}<div>${p.t.map(ty).join('')}</div></td><td class="n">${h}</td></tr>`).join('')}</table>
 <div style="margin-top:8px"><a href="#/" onclick="st.f=[{k:'mv',v:${i}}];save();">Show in Pokémon list as a filter ›</a></div></div>`;window.scrollTo(0,0);}
// ===== ABILITY PAGE
const abSlot=(p,i)=>{const n=new Set(p.a).size,r=[];if(p.a.includes(i))r.push(n===1?'Only ability':'Ability '+(p.a.indexOf(i)+1));if(p.ha===i)r.push('Hidden ability');return r.join(', ');};
function abilityDetail(i){fil.innerHTML='';const a=AB[i];if(!a){app.innerHTML='<p>Not found.</p>';return;}const us=abUsers[i]||[];
 app.innerHTML=`<a class="back" href="javascript:history.back()">‹ Back</a>
 <div class="card"><h2 style="margin:0 0 6px">${esc(a[0])}${a[2]?` <span class="tag">${CF.orig} original</span>`:''}</h2><p style="margin:0">${esc(a[1]||'No description.')}</p>${a[3]?`<div style="margin-top:8px"><b style="color:var(--acc)">${TX.chdoc}</b><div>${esc(a[3])}</div></div>`:''}${TX.absrc?`<div class="mut small" style="margin-top:6px">${TX.absrc}</div>`:''}</div>
 <div class="card"><h3>Pokémon with it (${us.length})</h3><table class="lrn">${us.map(p=>`<tr><td style="width:44px">${spr(p.id,'s40')}</td><td>${plink(p.id)}&#8203;<span class="tag">${abSlot(p,i)}</span><div>${p.t.map(ty).join('')}</div></td></tr>`).join('')}</table>
 <div style="margin-top:8px"><a href="#/" onclick="st.f=[{k:'ab',v:${i}}];save();">Show in Pokémon list as a filter ›</a></div></div>`;window.scrollTo(0,0);}

// ===== LOCATIONS + ENCOUNTER TRACKER (state in localStorage LS.track {s starter, e:{area:{p}|{f}}, t:{trade}}; see hacks/<hack>/notes.md)
// FAM = evolution family via union-find over evolution links (dupes clause); Megas and form changes join their base.
const AR=D.AR||[];const LOC2A={};AR.forEach((A,i)=>A.l.forEach(l=>LOC2A[l]=i));
// Locations order (D.ARO, optional): areas added later go at the end of AR so saved trackers (keyed by area index) keep
// their slots, and ARO puts them in place. ARK: an area's rank in it.
const ARO=D.ARO||AR.map((A,i)=>i),ARK={};ARO.forEach((a,i)=>ARK[a]=i);
const locRank=li=>D.ARO?ARK[LOC2A[li]]??1e9:0;
// Saving and lazy filling on the collapsible pages other than the walkthrough (which binds its own): TOG[view](details),
// called from one toggle listener on #app (COLLAPSIBLE PAGES).
const TOG={};
const FAM={};(()=>{const par={};const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};P.forEach(p=>par[p.id]=p.id);
 P.forEach(p=>[...p.ef,...p.et].forEach(([x,id])=>{if(id&&par[id]!==undefined){const a=f(p.id),b=f(id);if(a!==b)par[a]=b;}}));
 P.forEach(p=>{if((p.g===1||p.fc)&&p.dex){const b=P.find(x=>x.dex===p.dex&&x.g!==1&&!x.fc);if(b){const a=f(p.id),c=f(b.id);if(a!==c)par[a]=c;}}});
 P.forEach(p=>FAM[p.id]=f(p.id));})();
// Tracked and traded species are stored by name (spOut), and read back by name or, saved before names, by id (spIn;
// a species no longer in the guide drops). The backup code is the stored form.
const spOut=id=>byId[id]?nameOf(P,byId[id].i):id;
const spIn=v=>{const i=typeof v==='string'?nameKeys(P).index.get(v):undefined;return i!=null?P[i].id:byId[v]?v:undefined;};
const tkIn=o=>{const e={},t={};for(const [a,x] of Object.entries(o.e||{})){if(x&&x.p!=null){const p=spIn(x.p);if(p!=null)e[a]={...x,p};}else if(x)e[a]=x;}
 for(const [k,v] of Object.entries(o.t||{})){const p=spIn(v);if(p!=null)t[k]=p;}return {e,t};};
const tkOut=()=>JSON.stringify({...TK,e:Object.fromEntries(Object.entries(TK.e).map(([a,x])=>[a,x&&x.p!=null?{...x,p:spOut(x.p)}:x])),t:Object.fromEntries(Object.entries(TK.t||{}).map(([k,v])=>[k,spOut(v)]))});
const TK={s:'',pl:'',e:{},t:{}};try{Object.assign(TK,JSON.parse(localStorage.getItem(LS.track)||'{}'));}catch(e){}Object.assign(TK,tkIn(TK));
const tkSave=()=>{try{localStorage.setItem(LS.track,tkOut())}catch(e){}};
const caughtFams=(skip)=>{const s=new Set();for(const v of Object.values(TK.t||{})){if(v)s.add(FAM[v]||v);}for(const [a,e] of Object.entries(TK.e)){if(e&&e.p&&+a!==skip)s.add(FAM[e.p]||e.p);}return s;};
const areaSpecies=a=>{const seen=new Set(),out=[];(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]==='Trade')return;if(!seen.has(p.id)){seen.add(p.id);out.push(p);}}));return out;};
// Areas split into tracker slots (AR[i].sub, e.g. one per egg; each slot has .in = the area): ARS(a) = the slots, or
// the area itself. An encounter saved on the area before the split moves to the slot whose species it is.
const ARS=a=>AR[a].sub||[a];
AR.forEach((A,a)=>{const e=A.sub&&TK.e[a];if(!e)return;const t=A.sub.find(x=>e.p&&areaSpecies(x).some(p=>p.id===e.p))??A.sub[0];if(!TK.e[t])TK.e[t]=e;delete TK.e[a];tkSave();});
// CF.starter 'pick': a starter picker in the tracker bar decides some gifts, trades and the rival's team ("Starter: X" in
// notes, t.st on trainers). Otherwise the rival follows the type of the starter caught in tracker area 0.
// Player picker (TK.pl 'm' boy / 'f' girl): shown when some trainer or partner has t.pl (Eternal X's rival is the
// other character); its labels are CF.txt.plm / plf.
const PLAYER=!!(D.TR&&D.TR.g.some(g=>g.sec.some(s=>s.tr.some(t=>t.pl||(t.pt||[]).some(p=>p.pl)))));
const PLN={m:TX.plm||'Boy',f:TX.plf||'Girl'};
const playerSel=(c,none='Not chosen')=>PLAYER?`<select class="${c}"><option value="">${none}</option>${['m','f'].map(v=>`<option value="${v}" ${TK.pl===v?'selected':''}>${esc(PLN[v])}</option>`).join('')}</select>`:'';
const plOk=x=>!(x.pl&&TK.pl&&x.pl!==TK.pl);
const STARTER_AREA=Math.max(AR.findIndex(A=>A.st),CF.starter==='type'?0:-1);
const STARTERS=PICK?[...new Set((CF.starter==='type'?areaSpecies(STARTER_AREA):P.filter(p=>p.w.some(w=>w[1]==='Starter choice'))).map(p=>p.name))]:[];
const syncStarter=()=>{if(STARTER_AREA<0)return;const entry=TK.e[STARTER_AREA];TK.s=entry&&!entry.f&&byId[entry.p]?.name||'';};
if(PICK&&STARTER_AREA>=0){if(TK.e[STARTER_AREA])syncStarter();else if(TK.s){const starter=P.find(p=>p.name===TK.s);if(starter)TK.e[STARTER_AREA]={p:starter.id};}tkSave();}
const starterOk=txt=>{const m=String(txt||'').match(/Starter:\s*([A-Za-z ,]+?)\.?\s*$/);return !(m&&TK.s)||m[1].split(',').map(x=>x.trim()).includes(TK.s);};
function tradeHTML(a){const g={};(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]!=='Trade'||!starterOk(w[4]))return;(g[w[4]]=g[w[4]]||[]).push(p);}));
 return Object.entries(g).map(([n,ps])=>{const k=a+'|'+n;const cur=(TK.t||{})[k]||'';return `<div class="trk"><span class="mut small">Trade (${esc(n.replace(/^For /,'for '))})</span><select class="tk-trade" data-k="${esc(k)}"><option value="">Not traded</option>${ps.map(p=>`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`;}).join('');}
function adjRows(li,cf,keep){const r=[].concat(li).flatMap(l=>locs[l]||[]).filter(([p,w])=>!keep||keep(w));const by={};r.forEach(([p,w])=>{const m=w[1]||'Other';(by[m]=by[m]||{});const o=by[m][p.id]=by[m][p.id]||{p,r:0,rs:'',lv:new Set(),note:w[4]};const x=parseFloat(w[2]);if(!isNaN(x)&&/%/.test(w[2]))o.r+=x;else if(w[2])o.rs=w[2];if(w[3])o.lv.add(w[3]);});
 const out=[];for(const [m,o] of Object.entries(by)){const rows=Object.values(o);rows.forEach(x=>x.d=cf.has(FAM[x.p.id]));const live=rows.filter(x=>!x.d);const sum=live.reduce((a,x)=>a+x.r,0);
  rows.forEach(x=>{if(x.d){x.show=x.r?x.r+'%':x.rs;return;}if(x.r&&sum>0){const v=Math.round(x.r/sum*1000)/10;x.show=v+'%';x.chg=Math.abs(v-x.r)>0.05;}else if(/^1 of \d+/.test(x.rs)){x.show='1 of '+live.length;x.chg=live.length!==rows.length;}else x.show=x.r?x.r+'%':x.rs;});
  rows.sort((a,b)=>(a.d-b.d)||(b.r-a.r));const notes=[...new Set(rows.map(x=>x.note).filter(Boolean))];out.push([m,rows,live.length===0,notes.length===1?notes[0]:'']);}return out;}
// lab: the label before the picker (undefined = "Encounter", '' = none, else a short area tag; the walkthrough uses the last two).
function trackerHTML(a,lab){if(AR[a]?.ns)return `<div class="mut small" style="margin:6px 0">${TX.ns}</div>`;return trackerHTML0(a,lab)+tradeHTML(a);}
function trackerHTML0(a,lab){
 const e=TK.e[a];const sp=areaSpecies(a);const cf=caughtFams(a);let cur=e?(e.f?'__fail':e.p):'';
 const extra=e&&e.p&&!sp.some(p=>p.id===e.p)&&byId[e.p]?[byId[e.p]]:[];
 const opt=p=>`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)}${cf.has(FAM[p.id])?' (dupe)':''}</option>`;
 return `<div class="trk" data-a="${a}">${lab===undefined?'<span class="mut small">Encounter</span>':lab?`<span class="atag">${esc(lab)}</span>`:''}<select class="tk-sel"><option value="">None yet</option><option value="__fail" ${cur==='__fail'?'selected':''}>Failed / fled</option>${extra.map(opt).join('')}${sp.map(opt).join('')}<option value="__other">Other…</option></select>${e?'<button class="tk-x" title="Clear">×</button>':''}
 <div class="tk-other" style="display:none"><input type="search" placeholder="Type a Pokémon name"><div class="tk-res"></div></div></div>`;}
function bindTrackers(){app.querySelectorAll('.trk').forEach(el=>{if(el.dataset.b)return;el.dataset.b=1;const a=+el.dataset.a;const sel=el.querySelector('.tk-sel'),oth=el.querySelector('.tk-other');if(!sel)return;
 sel.onchange=()=>{const v=sel.value;if(v==='__other'&&INV){otherKb(a);return;}if(v==='__other'){oth.style.display='block';const inp=oth.querySelector('input');inp.focus();inp.oninput=()=>{const s=inp.value.trim().toLowerCase();const res=s.length<2?[]:P.filter(p=>p.g===0&&p.key.includes(s)).slice(0,8);
   oth.querySelector('.tk-res').innerHTML=res.map(p=>`<div class="tk-opt" data-id="${p.id}">${spr(p.id,'s40')}<span>${esc(p.name)}</span></div>`).join('');oth.querySelectorAll('.tk-opt').forEach(o=>o.onclick=()=>{TK.e[a]={p:o.dataset.id};tkSave();rerender();});};return;}
  if(v==='')delete TK.e[a];else if(v==='__fail')TK.e[a]={f:1};else TK.e[a]={p:v};tkSave();rerender();};
 const x=el.querySelector('.tk-x');if(x)x.onclick=()=>{delete TK.e[a];tkSave();rerender();};});
 app.querySelectorAll('.tk-reset').forEach(b=>{if(b.dataset.b)return;b.dataset.b=1;b.onclick=()=>{if(confirm(PICK?'Clear every tracked encounter, trade and the starter choice?':'Clear every tracked encounter?')){TK.e={};TK.t={};TK.s='';TK.pl='';tkSave();rerender();}};});
 app.querySelectorAll('.tk-export').forEach(b=>b.onclick=()=>{prompt('Copy this backup code:',tkOut());});
 app.querySelectorAll('.tk-import').forEach(b=>b.onclick=()=>{const t=prompt('Paste a backup code:');if(!t)return;try{const o=JSON.parse(t);TK.s=o.s||'';Object.assign(TK,tkIn(o));tkSave();rerender();}catch(e){alert('That code could not be read.');}});
 app.querySelectorAll('.tk-trade').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.t=TK.t||{};if(s.value)TK.t[s.dataset.k]=s.value;else delete TK.t[s.dataset.k];tkSave();rerender();};});
 app.querySelectorAll('.tk-starter,.st-pick').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.s=s.value;const sa=STARTER_AREA,sp=P.find(x=>x.name===s.value);if(sa>=0){if(sp)TK.e[sa]={p:sp.id};else delete TK.e[sa];}tkSave();rerender();};});
 app.querySelectorAll('.tk-player').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.pl=s.value;tkSave();rerender();};});}
// Scroll anchor: the element nearest the top of the window, saved as a selector plus its offset, so a re-render can put it back.
const ANCH='.list>a.row,details.split[data-a],details.split[data-wo],details.split[data-gi],details.split[data-si],details.stopd[data-k],details.wmis[data-m],.trk[data-a],details.trd';
const anchorSel=e=>e.matches('a.row')?`a.row[href="${e.getAttribute('href')}"]`:e.matches('details.trd')?`details.trd[data-k="${e.dataset.k}"]`:
 e.matches('.trk')?`.trk[data-a="${e.dataset.a}"]`:e.matches('details.stopd')?`details.stopd[data-k="${e.dataset.k}"]`:e.matches('details.wmis')?`details.wmis[data-m="${CSS.escape(e.dataset.m)}"]`:
 `details.split[${['a','wo','gi','si'].map(k=>'data-'+k).find(k=>e.hasAttribute(k))}="${e.getAttribute(['a','wo','gi','si'].map(k=>'data-'+k).find(k=>e.hasAttribute(k)))}"]`;
// Found by hit-testing down the window: reading the geometry of anything inside a skipped block forces it to lay out.
function keepAnchor(){const r=app.getBoundingClientRect(),x=r.left+r.width/2;
 for(let y=1;y<innerHeight;y+=12){const h=document.elementFromPoint(x,y);const e=h&&h.closest(ANCH);if(e&&app.contains(e))return {sel:anchorSel(e),off:e.getBoundingClientRect().top,y:scrollY};}
 return {y:scrollY};}
function toAnchor(a){if(!a)return;const go=()=>{const e=a.sel&&app.querySelector(a.sel);window.scrollTo(0,e?e.getBoundingClientRect().top+scrollY-a.off:a.y);};go();
 // Blocks near the window render for real in the next frame; correct again after that layout, before it paints.
 if(a.sel){const ro=new ResizeObserver(go);ro.observe(app);const stop=()=>{ro.disconnect();removeEventListener('touchstart',stop);};
  addEventListener('touchstart',stop,{passive:true});setTimeout(stop,400);}}
// Blocks with content-visibility keep their last height as the estimate across a re-render, so nothing shifts when
// the ones near the window render for real.
const CVB=[['details.split[data-a]>.body','a'],['details.split[data-wo]>.body','wo'],['details.split[data-gi]>.body','gi'],['details.stopd[data-k]>.stop','k'],['details.trd[data-k]>.trb','k']];
// Skipped blocks, from content-visibility's own events; blocks inside them aren't measured (that would force their layout).
const SKIP=new WeakSet();document.addEventListener('contentvisibilityautostatechange',e=>{if(e.skipped)SKIP.add(e.target);else SKIP.delete(e.target);},true);
const inSkip=e=>{for(let p=e.parentElement;p&&p!==app;p=p.parentElement)if(SKIP.has(p))return true;return false;};
function cvSizes(){const m={};CVB.forEach(([sel,k])=>app.querySelectorAll(sel).forEach(e=>{if(!inSkip(e))m[sel+'|'+e.parentElement.dataset[k]]=e.offsetHeight;}));
 let row=0;for(const r of app.querySelectorAll('.list>.row'))if(!SKIP.has(r)){row=r.offsetHeight;break;}return {m,row};}
function cvApply(z){if(!z)return;CVB.forEach(([sel,k])=>app.querySelectorAll(sel).forEach(e=>{const h=z.m[sel+'|'+e.parentElement.dataset[k]];if(h)e.style.containIntrinsicSize='auto '+h+'px';}));
 const l=app.querySelector('.list');if(l&&z.row)l.style.setProperty('--rowh',z.row+'px');}
function rerender(){if(PICK){syncStarter();tkSave();}const a=keepAnchor(),z=cvSizes();render(true);cvApply(z);toAnchor(a);}
const starterSel=(c,none='Not chosen')=>`<select class="${c}"><option value="">${none}</option>${STARTERS.map(s=>`<option ${TK.s===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
const trackerButtons=()=>'<button class="btn tk-export">Export</button><button class="btn tk-import">Import</button><button class="btn danger tk-reset">Reset all</button>';
function tkBar(){const [n,f]=tkCounts();
 const cnt=`${n} caught · ${f} failed`;
 return `<div class="card tkbar">${PICK?`<div class="bar tkchoices" style="margin:0"><label><span class="mut small">Starter</span>${starterSel('tk-starter')}</label>${PLAYER?`<label><span class="mut small">Player</span>${playerSel('tk-player')}</label>`:''}</div>
 <div class="mut small" style="margin-top:6px">${cnt}</div>`:`<div class="bar" style="margin:0"><span class="mut small">${cnt}</span></div>`}
 <div class="bar" style="margin:8px 0 0">${trackerButtons()}</div></div>`;}
const encAll=a=>ARS(a).map(encSummary).join('');
function encSummary(a){const e=TK.e[a];if(!e)return '';if(e.f)return '<span class="tag">failed</span>';const p=byId[e.p];return p?`<span class="tag got">${esc(p.name)}</span>`:'';}
// The page is boxes (one area, or next-to-each-other areas whose names share their first two words: Granite Cave 1F,
// B1F...) → places (an area's own places, same names merged; one place = the area's own name) → methods. One area: its
// tracker sits above its places; a box of several areas: each place is one area and carries its tracker. An area with
// several places of its own never joins a box. State in LS.loc {o:{<first area>:1 open}, x:{<area>.<place>:0 closed},
// s:{<area>.<place>.<method>:0 closed}, layout (relayout)}: boxes start closed, places and methods open. Layout: template/README.md.
// Open state saved by position (a box's index, "box.place", either with a ".rest") keeps the names it was saved under
// (S.layout, as the walkthrough's WO.layout): when an update adds, drops or moves boxes or places, relayout moves each
// key to the position that now has its name (a repeated name counts its occurrence) and drops one whose name is gone.
// lay: [[box name, [place names]]] in this build's order; kinds: {state map: 1 keyed by box, 2 by box.place}. Returns
// true when the stored state needs saving (moved, or saved before layouts); the layout goes with the next save anyway.
function relayout(S,lay,kinds){if(JSON.stringify(S.layout)===JSON.stringify(lay))return false;const had=Array.isArray(S.layout)||Object.keys(kinds).some(k=>Object.keys(S[k]||{}).length);
 const occ=list=>{const seen={};return list.map(n=>{const k=seen[n]=(seen[n]||0)+1;return k>1?n+'#'+k:n;});};
 if(Array.isArray(S.layout)){const old=S.layout,ob=occ(old.map(x=>x[0])),nb=new Map(occ(lay.map(x=>x[0])).map((n,i)=>[n,i]));
  const box=i=>nb.get(ob[i]),place=(i,j)=>{const b=box(i),n=b!=null&&occ(old[i][1]||[])[j];const nj=n!=null&&n!==false?occ(lay[b][1]).indexOf(n):-1;return nj<0?undefined:b+'.'+nj;};
  for(const [kind,depth] of Object.entries(kinds)){const out={};for(const [k,v] of Object.entries(S[kind]||{})){const m=depth===1?k.match(/^(\d+)(.*)$/s):k.match(/^(\d+)\.(\d+)(.*)$/s);
   if(!m){out[k]=v;continue;}const to=depth===1?box(+m[1]):place(+m[1],+m[2]);if(to!=null)out[to+(depth===1?m[2]:m[3])]=v;}S[kind]=out;}}
 S.layout=lay;return had;}
const LO=(()=>{try{return Object.assign({o:{},x:{},s:{}},JSON.parse(localStorage.getItem(LS.loc)||'{}'))}catch(e){return {o:{},x:{},s:{}}}})();
const loSave=()=>{try{localStorage.setItem(LS.loc,JSON.stringify(LO))}catch(e){}};
const places=a=>{const m=new Map();AR[a].l.forEach(li=>{const n=LOC[li];if(!m.has(n))m.set(n,[]);m.get(n).push(li);});return [...m].map(([n,ls],j)=>({n,ls,j}));};
relayout(LO,AR.map((A,a)=>[String(a),places(a).map(p=>p.n)]),{x:2,s:2})&&loSave();
const LGRP=(()=>{const out=[],two=n=>n.split(' ').length>2?n.split(' ').slice(0,2).join(' '):null;
 ARO.forEach(i=>{const A=AR[i];if(A.in!=null)return;const k=two(A.n),one=places(i).length===1,p=out[out.length-1];
  if(k&&one&&p&&p.one&&p.k===k)p.a.push(i);else out.push({k,one,a:[i]});});
 out.forEach(g=>g.n=g.a.length>1?g.k:AR[g.a[0]].n);return out;})();
const LSEC=(k,m,tags,body)=>sectionHTML(esc(k+'.'+m),esc(m),tags,body,LO.s[k+'.'+m]!==0);
const encTable=(rows,note)=>(note?`<div class="mut small" style="margin:4px 0 2px">${esc(note)}</div>`:'')+`<table class="enc">${rows.map(x=>`<tr class="${x.d?'dupe':''}"><td style="width:44px">${spr(x.p.id,'s40')}</td><td>${plink(x.p.id)}<div>${x.p.t.map(ty).join('')}</div>${x.note&&!note?`<div class="mut small">${esc(x.note)}</div>`:''}</td><td class="n">${esc(x.show)}${x.chg?'<div class="mut small">was '+(x.r?x.r+'%':esc(x.rs))+'</div>':''}</td><td class="n">${x.lv.size?'Lv '+esc([...x.lv].join(', ')):''}</td></tr>`).join('')}</table>`;
const mTags=(rows,allD)=>allD?'<span class="tag">all dupes</span>':`<span class="mut small">${rows.length}</span>`;
const locStop=(k,n,tags,body)=>`<details class="stopd" data-k="${k}" ${LO.x[k]===0&&!st.q?'':'open'}><summary class="stoph"><span class="pn">${esc(n)}</span>${tags}</summary><div class="stop">${body}<button class="endbar st" hidden>${UPI}<span>Collapse ${esc(n)}</span></button></div></details>`;
function locPlace(a,p,cf,trk){const k=a+'.'+p.j;
 const ms=AR[a].es||AR[a].st?placeSecs(a,p,cf):adjRows(p.ls,cf).map(([m,rows,allD,note])=>LSEC(k,m,mTags(rows,allD),encTable(rows,note))).join('');
 return locStop(k,p.n,trk?encSummary(a):'',(trk?(AR[a].st?'':trackerHTML(a))+(AR[a].note?`<div class="trnote">${esc(AR[a].note)}</div>`:''):'')+(ms||'<div class="mut small" style="margin:6px 0">No wild Pokémon here.</div>'));}
// A town split into tracker slots (EI's eggs): one place with the town's name, a yellow section per slot with its tracker.
const locSlots=(a,cf)=>locStop(a+'.0',AR[a].n,encAll(a),AR[a].sub.map(x=>adjRows(AR[x].l,cf).map(([m,rows,allD,note])=>LSEC(a+'.0',m,encSummary(x)+mTags(rows,allD),trackerHTML(x,'')+encTable(rows,note))).join('')).join(''));
// Encounter sections (AR[i].es, from the hack's extract; Photonic Sun): one per game table (a grass patch, cave,
// building), Water (Fishing with the bubbling spot as a second rate, Surfing) and Other (berry piles, ambush...). A
// section's groups are {m label, lv, bl bubbling levels, rows:[{p, r:[day,night], b:[day,night], sos:[[ally,when]],
// note}]}. Day and night share a row: a sun or moon marks a rate that only holds then. The P.w rows flagged w[5]===1
// repeat these for Pokémon pages, search and the tracker, so the page adds only the others (gifts, trades, weather
// SOS). AR[i].st: the starter picker is the area's tracker. AR[i].map: the doc's maps (data URIs).
const ICON={s:'<svg class="dn s" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.4" fill="currentColor"/><path d="M8 .8v2.4M8 12.8v2.4M.8 8h2.4M12.8 8h2.4M2.9 2.9l1.7 1.7M11.4 11.4l1.7 1.7M2.9 13.1l1.7-1.7M11.4 4.6l1.7-1.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
 m:'<svg class="dn m" viewBox="0 0 16 16"><path d="M11.2 1.2a6.8 6.8 0 1 0 3.6 11.6A5.6 5.6 0 0 1 11.2 1.2z" fill="currentColor"/></svg>',
 b:'<svg class="dn b" viewBox="0 0 16 16"><circle cx="5" cy="10" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="11" cy="5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'};
const notSec=w=>w[5]!==1,pct=x=>Math.round(x*10)/10+'%',whenI=w=>w==='day'?ICON.s:w==='night'?ICON.m:'';
function rateCell(r,f){if(r[0]===r[1])return r[0]?pct(f(r[0],0)):'';return (r[0]?`<span class="rt">${ICON.s}${pct(f(r[0],0))}</span>`:'')+(r[1]?`<span class="rt">${ICON.m}${pct(f(r[1],1))}</span>`:'');}
// Rates rescale over the rows that aren't dupes: day, night and bubbling each on their own
function secAdj(g,cf){const sum=(k,j,all)=>g.rows.reduce((s,x)=>s+(x[k]&&(all||!cf.has(FAM[x.p]))?x[k][j]:0),0);
 return k=>(x,j)=>{const live=sum(k,j),full=sum(k,j,1);return live&&live!==full?x/live*100:x;};}
// A caller's allies drop down under it; a search for an ally opens the drop-downs it's in
function sosDrop(x,cf){if(!x.sos||!x.sos.length)return '';const hit=st.q&&x.sos.some(([p])=>byId[p]&&byId[p].key.includes(st.q));
 return `<details class="sosd" ${hit?'open':''}><summary><span class="sosk">SOS</span> ${x.sos.map(([p])=>esc(byId[p]?byId[p].name:p)).join(', ')}</summary><div class="sosl">${x.sos.map(([p,w])=>`<div class="sosa${cf.has(FAM[p])?' dupe':''}">${spr(p,'s32')}<div>${plink(p)} ${whenI(w)}<div>${(byId[p]?byId[p].t:[]).map(ty).join('')}</div></div></div>`).join('')}</div></details>`;}
function secRows(g,cf){const adj=secAdj(g,cf),raw=()=>x=>x,top=x=>Math.max(...x.r,...(x.b||[0]));
 return `<table class="enc lt">${[...g.rows].sort((a,b)=>top(b)-top(a)||byId[a.p].name.localeCompare(byId[b.p].name)).map(x=>{const d=cf.has(FAM[x.p]),f=d?raw:adj;
  return `<tr class="${d?'dupe':''}"><td style="width:44px">${spr(x.p,'s40')}</td><td>${plink(x.p)}<div>${byId[x.p].t.map(ty).join('')}</div>${x.note?`<div class="mut small">${esc(x.note)}</div>`:''}${sosDrop(x,cf)}</td><td class="n">${rateCell(x.r,f('r'))}</td>${g.bl!=null?`<td class="n">${x.b?ICON.b+rateCell(x.b,f('b')):''}</td>`:''}</tr>`;}).join('')}</table>`;}
const secSub=g=>`<div class="ltsub"><b>${esc(g.m)}</b>${g.lv?`<span>Lv ${esc(g.lv)}</span>`:''}${g.bl?`<span>${ICON.b}bubbling Lv ${esc(g.bl)}</span>`:''}</div>`;
function secTags(rows,cf,lv){const allD=rows.length&&rows.every(x=>cf.has(FAM[x.p]));return (lv?`<span class="mut small">Lv ${esc(lv)}</span>`:'')+(allD?'<span class="tag">all dupes</span>':`<span class="mut small">· ${rows.length}</span>`);}
function placeSecs(a,p,cf){const k=a+'.'+p.j,T=AR[a].es||[];let h='';
 if(AR[a].st)h+=`<div class="trk"><span class="mut small">Your starter</span>${starterSel('st-pick')}</div><div class="mut small" style="margin:2px 0 6px">The same picker as the tracker bar: it records this encounter and sets the rival's teams.</div>`;
 if(T.some(s=>s.g.some(g=>g.rows.some(x=>x.r[0]!==x.r[1]||(x.b&&x.b[0]!==x.b[1])))))h+=`<div class="mut small ltkey">${ICON.s}day ${ICON.m}night: the rate only holds then.</div>`;
 if(AR[a].map)h+=`<details class="mapd"><summary>Map: grass patch numbers</summary>${AR[a].map.map(u=>`<img src="${u}" alt="Map of ${esc(AR[a].n)}">`).join('')}<div class="mut small">From the Wild Pokémon Locations doc.</div></details>`;
 h+=T.map(s=>{const one=s.g.length===1&&!s.g[0].m;return LSEC(k,s.n,secTags(s.g.flatMap(g=>g.rows),cf,one?s.g[0].lv:''),one?secRows(s.g[0],cf):s.g.map(g=>secSub(g)+secRows(g,cf)).join(''));}).join('');
 const ws=adjRows(p.ls,cf,w=>w[1]==='Weather SOS');
 if(ws.length)h+=LSEC(k,'Weather SOS',`<span class="mut small">· ${ws[0][1].length}</span>`,`<div class="mut small" style="margin:4px 0 2px">Any Pokémon here can call these in rain, sand or hail.</div>`+encTable(ws[0][1],''));
 const sp=adjRows(p.ls,cf,notSec);
 if(sp.length)h+=LSEC(k,AR[a].st?'Starter':'Special',`<span class="mut small">· ${sp.reduce((n,x)=>n+x[1].length,0)}</span>`,sp.map(([m,rows,allD,note])=>(AR[a].st?'':secSub({m}))+encTable(rows,note)).join(''));
 return h;}
// The walkthrough's one-line-per-method summary, from the sections
function secLines(a,cf){const out=[],txt=r=>r[0]===r[1]?r[0]+'%':!r[1]?r[0]+'% day':!r[0]?r[1]+'% night':r[0]+'% day, '+r[1]+'% night';
 (AR[a].es||[]).forEach(s=>s.g.forEach(g=>{const lab=s.k==='grass'?s.n:s.k==='water'?s.n+' · '+g.m:g.m;
  const row=k=>g.rows.filter(x=>x[k]&&(x[k][0]||x[k][1])).map(x=>({p:byId[x.p],d:cf.has(FAM[x.p]),show:txt(x[k])}));
  const n=row('r'),b=row('b');if(n.length)out.push([AR[a].l[0],[lab,n]]);if(b.length)out.push([AR[a].l[0],[lab+' (bubbling)',b]]);}));return out;}
function locBox(g,cf){const one=g.a.length===1&&!AR[g.a[0]].sub,a=g.a[0];let n=0,h;
 if(AR[a].sub){n=1;h=locSlots(a,cf);}
 else if(one){const ps=places(a);n=ps.length;h=(AR[a].st?'':trackerHTML(a))+(AR[a].note?`<div class="trnote">${esc(AR[a].note)}</div>`:'')+ps.map(p=>locPlace(a,p,cf,false)).join('');}
 else{n=g.a.length;h=g.a.map(a=>locPlace(a,places(a)[0],cf,true)).join('');}
 return (n>1?segBar('lc-sp'):'')+h+`<button class="endbar sp" hidden>${UPI}<span>Collapse ${esc(g.n)}</span></button>`;}
TOG.locs=TOG.l=d=>{if(d.matches('details.split[data-a]')){const b=d.querySelector(':scope>.body');if(d.open&&!b.innerHTML){b.innerHTML=locBox(LGRP[+d.dataset.g],caughtFams(-1));colBind(b);bindTrackers();}
  if(!st.q){if(d.open)LO.o[d.dataset.a]=1;else delete LO.o[d.dataset.a];loSave();}}
 else if(st.q)return;else if(d.matches('details.stopd')){if(d.open)delete LO.x[d.dataset.k];else LO.x[d.dataset.k]=0;loSave();}
 else if(d.matches('details.sec')){if(d.open)delete LO.s[d.dataset.s];else LO.s[d.dataset.s]=0;loSave();}};
function listLocs2(scroll){fil.innerHTML='';const s=st.q;const li=st.lopenLi;st.lopenLi=null;
 // Opened from a Pokemon page (#/l/<place>): open its box and place, then scroll it under the search bar.
 let tk=null;if(li!=null&&LOC2A[li]!=null){const a=LOC2A[li];LO.o[LGRP.find(g=>g.a.includes(AR[a].in??a)).a[0]]=1;tk=AR[a].in!=null?AR[a].in+'.0':a+'.'+places(a).find(p=>p.ls.includes(li)).j;delete LO.x[tk];loSave();}
 const hit=i=>ARS(i).some(i=>AR[i].n.toLowerCase().includes(s)||AR[i].l.some(li=>LOC[li].toLowerCase().includes(s)||(locs[li]||[]).some(([p])=>p.key.includes(s))));
 const list=LGRP.map((g,gi)=>gi).filter(gi=>!s||LGRP[gi].a.some(hit));
 app.innerHTML=tkBar()+(s?'':segBar('lc-all all'))+
  list.map(gi=>{const g=LGRP[gi];return `<details class="split jt" data-a="${g.a[0]}" data-g="${gi}" ${LO.o[g.a[0]]||s?'open':''}><summary>${esc(g.n)} ${g.a.map(encAll).join('')}</summary><div class="body"></div></details>`;}).join('');
 app.querySelectorAll('details.split[data-a][open]').forEach(d=>TOG.locs(d));bindTrackers();bars();
 if(scroll&&tk)land(app.querySelector(`details.stopd[data-k="${tk}"]>summary`));}


// ===== ITEMS TAB (D.IT sections from the items xlsx; r = [item, text, link, missable?])
function itemRow(sec,r){const nm=sec.k==='tm'&&r[2]!=null?`<a href="#/m/${r[2]}">${esc(r[0])}</a>`:sec.k==='mega'&&r[2]?`<a href="#/p/${r[2]}">${esc(r[0])}</a>`:esc(r[0]);
 return `<tr><td>${nm}</td><td>${esc(r[1]).replace(/\n/g,'<br>')}${r[3]?'<span class="warn">MISSABLE</span>':''}</td></tr>`;}
function listItems(){fil.innerHTML='';const s=st.q;const IT=D.IT||[];
 if(s){const html=IT.map(sec=>{const rows=sec.r.filter(r=>(r[0]+' '+r[1]).toLowerCase().includes(s));return rows.length?`<div class="sech">${esc(sec.n)}</div><table class="itbl ix">${rows.map(r=>itemRow(sec,r)).join('')}</table>`:'';}).join('');
  app.innerHTML=html;return;}
 app.innerHTML=segBar('it-all all')+IT.map((sec,si)=>`<details class="split jt" data-si="${si}" ${IO.o[si]?'open':''}><summary>${esc(sec.n)} <span class="mut small">${sec.r.length}</span></summary><div class="body"></div></details>`).join('');
 app.querySelectorAll('details.split[open]').forEach(d=>TOG.items(d));bars();}
// Inside a box: its name again as a sticky heading, then the rows, under yellow sub-headings where the data gives them
// (r[4]: EI shops, Hardlove's held item kinds; two or more get an Expand / Collapse all bar). State in LS.items {o:{<box>:1 open}, x:{<box>:0 closed heading},
// s:{<box>.<sub>:0 closed}, layout (relayout)}: boxes start closed, the rest open. Filled when first opened.
const IO=(()=>{try{return Object.assign({o:{},x:{},s:{}},JSON.parse(localStorage.getItem(LS.items)||'{}'))}catch(e){return {o:{},x:{},s:{}}}})();
if(relayout(IO,(D.IT||[]).map(sec=>[sec.n,[]]),{o:1,x:1,s:1}))try{localStorage.setItem(LS.items,JSON.stringify(IO))}catch(e){}
function itemBox(si){const sec=D.IT[si],tbl=rs=>`<table class="itbl ix">${rs.map(r=>itemRow(sec,r)).join('')}</table>`,subs=[];
 sec.r.forEach(r=>{const g=r[4]||'';if(!subs.length||subs[subs.length-1][0]!==g)subs.push([g,[]]);subs[subs.length-1][1].push(r);});
 // No stop header: the box's sub-headings (every row has one) pin straight under the search bar.
 return (sec.note?`<div class="mut small" style="margin:6px 0">${esc(sec.note)}</div>`:'')+
  (subs.filter(([g])=>g).length>1?segBar('it-sp'):'')+
  subs.map(([g,rs])=>g?sectionHTML(esc(si+'.'+g),esc(g),`<span class="mut small">${rs.length}</span>`,tbl(rs),IO.s[si+'.'+g]!==0):tbl(rs)).join('')+
  `<button class="endbar sp" hidden>${UPI}<span>Collapse ${esc(sec.n)}</span></button>`;}
TOG.items=d=>{if(st.q)return;const iS=()=>{try{localStorage.setItem(LS.items,JSON.stringify(IO))}catch(e){}};
 if(d.matches('details.split[data-si]')){const si=+d.dataset.si,b=d.querySelector(':scope>.body');if(d.open&&!b.innerHTML){b.innerHTML=itemBox(si);colBind(b);}if(d.open)IO.o[si]=1;else delete IO.o[si];}
 else if(d.matches('details.sec')){if(d.open)delete IO.s[d.dataset.s];else IO.s[d.dataset.s]=0;}else return;iS();};


// ===== COLLAPSIBLE PAGES (template/README.md). Pages built from details.split use these: header taps that never
// scroll, collapse bars at the bottom of blocks taller than the window, the rail's jump buttons (to details.split.jt),
// sticky stop and section headers (CSS, --hh and --sh) and the flash on a header you land on.
const hdr=document.querySelector('header'),html=document.documentElement,GAP=8;
// The search bar's height while it sticks (0 when it doesn't: very short windows), as --hh for the sticky headers.
const hdrH=()=>getComputedStyle(hdr).position==='sticky'?hdr.getBoundingClientRect().height:0;
const T=()=>hdrH()+GAP;
// Border box: the bar's padding changes at 420 px wide without its content box changing.
new ResizeObserver(()=>html.style.setProperty('--hh',hdrH()+'px')).observe(hdr,{box:'border-box'});
// Each stop carries its header's height (one or two lines) as --sh, so its section headers stick right under it, and
// each section its own header's as --ch (for trainer headers that stick under it). colBind observes new ones.
// Fractional heights: offsetHeight rounds, which left a hairline gap under a pinned stop header on the Thor (2.3x).
const SHO=new ResizeObserver(es=>es.forEach(e=>{const d=e.target.parentElement;d.style.setProperty(d.matches('.sec')?'--ch':'--sh',e.target.getBoundingClientRect().height+'px');}));
function colBind(root){root.querySelectorAll('details.stopd>summary,details.sec>summary').forEach(s=>{if(s.dataset.ro)return;s.dataset.ro=1;SHO.observe(s,{box:'border-box'});});barsSoon();}
app.addEventListener('toggle',e=>{const d=e.target,f=TOG[document.body.dataset.v];if(f&&d.tagName==='DETAILS'){f(d);barsSoon();}},true);
const flash=e=>{e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash');};
// Browser scroll anchoring is off while we move things ourselves (it adds its own correction a frame later), and the
// header is then held where it landed for a moment: blocks above it that content-visibility skipped render at their
// real height as they come into view and would push it down. Any press, wheel or key ends the hold.
const noAnchor=()=>{html.style.overflowAnchor='none';};
function hold(el){const y=el.getBoundingClientRect().top,t0=performance.now();let stop=false;const end=()=>{stop=true;};
 ['pointerdown','wheel','keydown'].forEach(k=>addEventListener(k,end,{once:true,passive:true}));
 const f=()=>{if(stop||performance.now()-t0>450){html.style.overflowAnchor='';return;}
  const dy=el.getBoundingClientRect().top-y;if(Math.abs(dy)>.5)scrollBy(0,dy);requestAnimationFrame(f);};requestAnimationFrame(f);}
// Opening or closing from a header: the header stays at the same pixel and the bottom bars settle in the same frame.
function flip(d,open){const sm=d.querySelector(':scope>summary'),y=sm.getBoundingClientRect().top;noAnchor();
 d.open=open;bars();const dy=sm.getBoundingClientRect().top-y;if(dy)scrollBy(0,dy);hold(sm);jumpState();}
// Collapse bars (.endbar, inside their details) show only where the open block, with its header and the bar itself,
// doesn't fit under the search bar. Blocks inside a skipped content-visibility block are left until they render.
const BH={};const barH=b=>{const k=b.className;if(BH[k]==null){b.hidden=false;const cs=getComputedStyle(b);BH[k]=b.offsetHeight+parseFloat(cs.marginTop)+parseFloat(cs.marginBottom);b.hidden=true;}return BH[k];};
function bars(){const room=innerHeight-hdrH(),bs=[...app.querySelectorAll('.endbar')].map(b=>[b,b.closest('details')]).filter(([b,d])=>d&&!inSkip(d));
 bs.forEach(([b])=>b.hidden=true);bs.filter(([b,d])=>d.open&&d.offsetHeight+barH(b)>room).forEach(([b])=>b.hidden=false);}
let bq=0;const barsSoon=()=>{if(!bq)bq=requestAnimationFrame(()=>{bq=0;bars();});};
document.addEventListener('contentvisibilityautostatechange',e=>{if(!e.skipped&&app.querySelector('.endbar'))barsSoon();},true);
addEventListener('resize',()=>{if(app.querySelector('.endbar'))barsSoon();});
new ResizeObserver(()=>{if(!app.querySelector('.endbar'))return;for(const key in BH)delete BH[key];barsSoon();}).observe(app);
// Height of the Show row pinned above a Trainers-page element (less the 2px the place header overlaps it: dex.css).
const trPinH=el=>{const bx=document.body.dataset.v==='trainers'&&!el.matches('details.split')&&el.closest('details.split');const w=bx&&bx.querySelector('.trsw');return w?w.getBoundingClientRect().height-2:0;};
// A collapse bar. Anything but a split lands right under the headers pinned above it (the search bar, its stop's and
// section's): a stop's or section's own header is pinned there already, so it closes in place; a trainer row's (not
// sticky) is scrolled there if it's off the top. A split closes and its header goes to the top. All flash.
// (Animated versions were tried and rejected: template/README.md.)
function pinTop(d){let y=hdrH()+trPinH(d);for(let p=d.parentElement.closest('details');p&&app.contains(p);p=p.parentElement.closest('details'))
 if(p.open&&p.matches('details.stopd,details.sec'))y+=p.querySelector(':scope>summary').offsetHeight;return y;}
function foldUp(d){const sm=d.querySelector(':scope>summary'),split=d.matches('details.split'),t=split?T():pinTop(d);
 if(!split&&sm.getBoundingClientRect().top>=t-1){flip(d,false);flash(sm);return;}
 noAnchor();d.open=false;bars();const y=sm.getBoundingClientRect().top-t;if(y<0||!split)scrollBy(0,y);flash(sm);hold(sm);jumpState();}
// Expand all / Collapse all bars (.seg): open or close their list; the bar you pressed stays where it is.
function segAll(b,list){const open=b.dataset.a==='1',y=b.getBoundingClientRect().top;noAnchor();
 list.forEach(d=>d.open=open);bars();scrollBy(0,b.getBoundingClientRect().top-y);hold(b);jumpState();}
// Rail jump buttons: up = top of the split you're in, or the previous one when this one's header already sits at the
// top with the gap above it; down = the next split to that same spot, so up and down undo each other.
const RJ=document.querySelector('.rjump');
const jts=()=>[...app.querySelectorAll('details.split.jt')];
function jump(dir){if(CF.calc&&location.hash==='#/calc'&&window.CALC){const stops=window.CALC.stops();const target=dir>0?stops.find(stop=>stop>scrollY+3):stops.slice().reverse().find(stop=>stop<scrollY-3);scrollTo(0,target??(dir>0?stops[stops.length-1]:0));jumpState();return;}const t=T(),sp=jts(),hs=sp.map(d=>d.getBoundingClientRect().top);let i;
 if(dir<0){i=-1;hs.forEach((y,j)=>{if(y<t-2)i=j;});if(i<0){scrollTo(0,0);jumpState();return;}}
 else{i=hs.findIndex(y=>y>t+2);if(i<0){scrollTo(0,html.scrollHeight);jumpState();return;}}
 scrollBy(0,hs[i]-t);flash(sp[i].querySelector(':scope>summary'));jumpState();}
function jumpState(){if(!RJ||RJ.hidden)return;if(CF.calc&&location.hash==='#/calc'&&window.CALC){const stops=window.CALC.stops();RJ.querySelector('[data-j="-1"]').disabled=!stops.some(stop=>stop<scrollY-3);RJ.querySelector('[data-j="1"]').disabled=!stops.some(stop=>stop>scrollY+3);return;}const t=T(),atEnd=scrollY+innerHeight>=html.scrollHeight-1;
 RJ.querySelector('[data-j="-1"]').disabled=scrollY<=0;RJ.querySelector('[data-j="1"]').disabled=atEnd||!jts().some(d=>d.getBoundingClientRect().top>t+2);}
if(RJ){RJ.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>jump(+b.dataset.j));
 let raf=0;addEventListener('scroll',()=>{if(!raf&&!RJ.hidden)raf=requestAnimationFrame(()=>{raf=0;jumpState();});},{passive:true});}
const UPI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"/></svg>';
const sectionHTML=(key,label,tags,body,open)=>`<details class="sec" data-s="${key}" ${open?'open':''}><summary><span class="sn">${label}</span>${tags}</summary><div class="secb">${body}</div><button class="endbar sb" hidden>${UPI}<span>${label}</span></button></details>`;
const segBar=(cls,a='Expand all',c='Collapse all')=>`<div class="seg ${cls}"><button data-a="1">${a}</button><button data-a="0">${c}</button></div>`;

// ===== WALKTHROUGH TAB (D.WK; state in localStorage LS.walk {c:{stepKey:1}, o:{splitIdx:1, gi:1 Guide info},
// x:{stopKey:0 closed, doc*:1 open}, s:{stopKey.c/e/i/t: 1 open, 0 closed}}; sections c checklist, e encounters,
// i items, t trainers; the checklist starts closed, the rest open). Layout and behaviour: template/README.md.
// Optional parts, each shown when the data has it: cheat codes (WK.cheats), checklist steps (stop.s), stop notes
// (stop.note), game docs (WK.docs, WK.ko), items with no place (WK.np).
const WO=(()=>{try{return Object.assign({c:{},o:{},x:{},s:{}},JSON.parse(localStorage.getItem(LS.walk)||'{}'))}catch(e){return {c:{},o:{},x:{},s:{}}}})();
const woSave=()=>{try{localStorage.setItem(LS.walk,JSON.stringify(WO))}catch(e){}};
// Missions: a stop.s entry that is an object, not a [text, note] pair ({m slug, n, u unlock, r reward, note?, s:[{k, t, n?}]}),
// is a card in the stop's checklist with its own steps. Saved in WO.missions {slug:{o:open, c:{stepKey:1}}}, by slug
// and step key, never by position: a record whose mission or step is gone stays in the save, unused, and comes back
// with its key. Ordinary steps keep their key (split.stop.j, j counting only the pairs), so missions among them shift
// nothing. A malformed mission (no slug, no steps, a step with no key or a repeated one) or a repeated slug is left out.
const MIS=new Map(),MISAT=new Map();
const misOk=x=>{if(!x||Array.isArray(x)||typeof x!=='object'||typeof x.m!=='string'||!x.m||!Array.isArray(x.s)||!x.s.length)return false;
 const ks=new Set();return x.s.every(c=>c&&typeof c.k==='string'&&c.k&&typeof c.t==='string'&&!ks.has(c.k)&&ks.add(c.k));};
// A stop's checklist in data order: {j, x} for an ordinary step, {m} for a mission.
const stopEnt=s=>s._e??=(()=>{let j=0;const out=[];(s.s||[]).forEach(x=>{if(Array.isArray(x))out.push({j:j++,x});else if(misOk(x)&&!MIS.has(x.m)){MIS.set(x.m,x);out.push({m:x});}});return out;})();
D.WK.splits.forEach((sp,si)=>sp.st.forEach((s,ti)=>stopEnt(s).forEach(e=>{if(e.m)MISAT.set(e.m.m,[si,ti]);})));
const misMap=()=>WO.missions&&typeof WO.missions==='object'&&!Array.isArray(WO.missions)?WO.missions:null;
const misRec=m=>{const r=misMap()?.[m];return r&&typeof r==='object'&&!Array.isArray(r)?r:null;};
const misDone=(m,k)=>{const c=misRec(m)?.c;return !!(c&&typeof c==='object'&&c[k]===1);};
function misSet(m,f){if(!misMap())WO.missions={};let r=misRec(m);if(!r)r=WO.missions[m]={o:false,c:{}};
 if(!r.c||typeof r.c!=='object'||Array.isArray(r.c))r.c={};f(r);woSave();}
// Every checkbox of a stop's checklist, in order (the one list behind the counts, Next step and reset): ordinary steps
// {j, x} and, at their place, each mission's steps {m, c}.
const stopLeaves=(s,si,ti)=>stopEnt(s).flatMap(e=>e.m?e.m.s.map(c=>({si,ti,s,m:e.m,c})):[{si,ti,s,j:e.j,x:e.x}]);
const leafDone=l=>l.m?misDone(l.m.m,l.c.k):!!WO.c[l.si+'.'+l.ti+'.'+l.j];
const misTx=x=>x.tx??=[x.n,x.u,x.r,x.note,...x.s.flatMap(c=>[c.t,c.n])].filter(Boolean).join(' ').toLowerCase();
// Search recents (LS.recent) are stored by identity (recOut): a species, move, ability or place by name, a walkthrough
// stop by its key (w), an item by its box and row names; recIn reads them back as this build's positions (an index or
// id saved before names passes through, a gone one drops). A stop saved by position (before keys) takes the key it had
// in the layout it was saved under, before migrateWalkState replaces that layout (no layout: the stop whose key root,
// its legacy position, is that position).
const STOPK=new Map();D.WK.splits.forEach((sp,si)=>sp.st.forEach((x,ti)=>{if(x.k!=null&&!STOPK.has(String(x.k)))STOPK.set(String(x.k),[si,ti]);}));
const recOut=o=>o.k==='p'?{k:'p',v:spOut(o.v)}:o.k==='f'?{k:'f',v:fname(o.v)}:o.k==='w'?{k:'w',w:String(D.WK.splits[o.si].st[o.ti].k??o.si+'.'+o.ti)}:
 o.k==='i'?{k:'i',si:nameOf(D.IT,o.si),ri:nameOf(D.IT[o.si].r,o.ri)}:o;
const recIn=o=>{if(!o||typeof o!=='object')return null;
 if(o.k==='p'){const v=spIn(o.v);return v==null?null:{k:'p',v};}
 if(o.k==='f'){const f=o.v;if(!f||typeof f!=='object')return null;if(!FLIST[f.k])return o;const v=idxOf(FLIST[f.k],f.v);return v==null||FLIST[f.k][v]==null?null:{k:'f',v:{...f,v}};}
 if(o.k==='w'){const at=o.w!=null?STOPK.get(String(o.w)):D.WK.splits[o.si]?.st[o.ti]?[o.si,o.ti]:null;return at?{k:'w',si:at[0],ti:at[1]}:null;}
 if(o.k==='ms'){const x=typeof o.m==='string'&&MIS.get(o.m);if(!x)return null;return o.c!=null&&x.s.some(c=>c.k===o.c)?{k:'ms',m:o.m,c:o.c}:{k:'ms',m:o.m};}
 if(o.k==='i'){const si=idxOf(D.IT||[],o.si),sec=(D.IT||[])[si],ri=sec?idxOf(sec.r,o.ri):null;return sec&&sec.r[ri]?{k:'i',si,ri}:null;}
 return o;};
const recRead=()=>{let r=[];try{r=JSON.parse(localStorage.getItem(LS.recent)||'[]')}catch(e){}return Array.isArray(r)?r.map(recIn).filter(Boolean):[];};
const recSave=r=>{try{localStorage.setItem(LS.recent,JSON.stringify(r.map(recOut)))}catch(e){}};
try{const r=JSON.parse(localStorage.getItem(LS.recent)||'[]'),lay=Array.isArray(WO.layout)?WO.layout:null;
 if(Array.isArray(r)&&r.some(o=>o&&o.k==='w'&&o.w==null))localStorage.setItem(LS.recent,JSON.stringify(r.map(o=>{if(!(o&&o.k==='w'&&o.w==null))return o;
  const k=lay?lay[o.si]?.[o.ti]:STOPK.has(o.si+'.'+o.ti)?o.si+'.'+o.ti:null;return k==null?null:{k:'w',w:String(k)};}).filter(Boolean)));}catch(e){}
function migrateWalkState(){
 const layout=D.WK.splits.map((split,splitIndex)=>split.st.map(stop=>String(stop.k)));
 if(JSON.stringify(WO.layout)===JSON.stringify(layout))return;
 const previous=new Map(),remap=new Map(),splitMap=new Map();
 if(Array.isArray(WO.layout))WO.layout.forEach((split,splitIndex)=>split.forEach((key,stopIndex)=>{
  const positions=previous.get(key)||[];positions.push(splitIndex+'.'+stopIndex);previous.set(key,positions);
 }));
 const old={c:WO.c,o:WO.o,x:WO.x,s:WO.s};
 const next={c:{},o:{},x:{},s:{}};
 for(const kind of ['c','o','x','s'])for(const [key,value] of Object.entries(old[kind]))if(!/^\d+(?:\.|$)/.test(key))next[kind][key]=value;
 layout.forEach((split,splitIndex)=>split.forEach((key,stopIndex)=>{
  const position=splitIndex+'.'+stopIndex,legacy=key.replace(/\.f\d+$/,'');
  const sources=previous.size?(previous.get(key)||previous.get(legacy)||[]):[legacy];
  for(const source of sources){
   if(!remap.has(source))remap.set(source,position);
   const oldSplit=source.split('.')[0];if(!splitMap.has(oldSplit))splitMap.set(oldSplit,String(splitIndex));
   if(old.o[oldSplit])next.o[splitIndex]=1;
   if(old.x[source]===0)next.x[position]=0;
   for(const section of ['c','e','i','t']){
    const value=old.s[source+'.'+section],target=position+'.'+section;
    if(value!==undefined&&(next.s[target]===undefined||value===0))next.s[target]=value;
   }
   for(const [step,value] of Object.entries(old.c))if(step.startsWith(source+'.')&&/^\d+$/.test(step.slice(source.length+1)))next.c[position+step.slice(source.length)]=value;
  }
 }));
 const changed=Array.isArray(WO.layout)||layout.some((split,splitIndex)=>split.some((key,stopIndex)=>key!==splitIndex+'.'+stopIndex));
 if(changed){
  Object.assign(WO,next);
  try{
   const position=JSON.parse(localStorage.getItem(LS.pos)||'null');
   if(position&&/^#\/walk(?:\/|$)/.test(position.h)&&position.a?.sel){
    position.a.sel=position.a.sel.replace(/data-k="(\d+\.\d+)"/,(match,key)=>'data-k="'+(remap.get(key)??key)+'"')
     .replace(/data-wo="(\d+)"/,(match,key)=>'data-wo="'+(splitMap.get(key)??key)+'"');
    localStorage.setItem(LS.pos,JSON.stringify(position));
   }
  }catch(e){}
 }
 WO.layout=layout;woSave();
}
migrateWalkState();
const CHK=D.WK.splits.some((sp,si)=>sp.st.some((s,ti)=>stopLeaves(s,si,ti).length));
const tkCounts=()=>[Object.values(TK.e).filter(e=>e&&e.p).length+Object.values(TK.t||{}).filter(Boolean).length,Object.values(TK.e).filter(e=>e&&e.f).length];
// Guide info: tracker and checklist tools, then the game docs (cheat codes and unplaced items count as docs), then the
// intro. Built when opened.
function guideInfoHTML(){const W=D.WK,[n,f]=tkCounts();
 const para=t=>esc(t).split(/\n\s*\n/).map(x=>/\S(?: {2,}|\t)\S/.test(x)?`<pre class="dpre">${x}</pre>`:`<p style="margin:6px 0">${x.replace(/\n/g,'<br>')}</p>`).join('');
 const doc=(k,n,body,cls='')=>`<details class="stopd" data-k="${k}" ${WO.x[k]===1?'open':''}><summary class="stoph"><span class="pn">${n}</span></summary><div class="stop${cls}">${body}</div></details>`;
 const docs=(W.cheats?doc('doccheat','Cheat codes',`<div class="mut small" style="margin:6px 0">${esc(W.cnote)}</div><table class="itbl">${W.cheats.map(c=>`<tr><td><b>${esc(c[0])}</b>${c[1]?`<div class="mut small">or ${esc(c[1])}</div>`:''}</td><td>${esc(c[2])}${c[3]?' <span class="tag">toggle</span>':''}</td></tr>`).join('')}</table>`):'')+
  (W.docs||[]).map(([t,x],j)=>doc('doc'+j,esc(t),para(x),' small doc')).join('')+
  (W.ko?doc('docko','Post-KO switch-in AI',`<table class="itbl">${W.ko.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>${W.ko.note.map(x=>`<div class="mut small" style="margin-top:6px">${esc(x)}</div>`).join('')}`):'')+
  (W.np.length?doc('docnp',`Items with no walkthrough place <span class="mut small">${W.np.length}</span>`,`<table class="itbl wt">${W.np.map(i=>`<tr><td>${esc(i[1])}<div class="mut small">${esc(i[0])}</div></td><td>${esc(i[2])}</td></tr>`).join('')}</table>`):'');
 return (HAS_MGM?`<label class="mgm"><input type="checkbox" class="mgm-toggle" ${MGM?'checked':''}> MGM</label>`:'')+`<div class="psec">Encounter tracker</div><div class="mut small">${n} caught · ${f} failed</div>`+
  `<div class="bar pbar">${trackerButtons()}${CHK?'<button class="btn danger wk-reset">Reset checklist</button>':''}</div>`+
  (docs?`<div class="psec">Game docs</div>`+docs:'')+`<div class="mut small" style="margin:12px 0 4px">${TX.walk}</div>`;}
// Next step: the first unticked checklist step, in walkthrough order.
function nextStep(){const W=D.WK;for(let si=0;si<W.splits.length;si++){const sp=W.splits[si];for(let ti=0;ti<sp.st.length;ti++){const l=stopLeaves(sp.st[ti],si,ti).find(l=>!leafDone(l));if(l)return l;}}return null;}
const nextInner=()=>{const n=nextStep();return n?`<b>Next step</b><span>${esc(n.s.n)} · ${n.m?esc(n.m.n||n.m.m)+' · '+esc(n.c.t):esc(n.x[0])}</span>`:'<b>Checklist done</b>';};
// Starter picker: named choices stored in TK.s, shared with the tracker bar and Trainers.
function starterRow(){let sel='';
 if(PICK)sel=starterSel('tk-starter','Not chosen (show all)');
 return (sel?`<div class="card strow"><span class="mut small">Starter</span>${sel}</div>`:'')+(PLAYER?`<div class="card strow"><span class="mut small">Player</span>${playerSel('tk-player','Not chosen (show all)')}</div>`:'');}
// Sections inside a stop, opened and closed from their yellow header; the header shows a summary.
const SECN={c:'Checklist',e:'Encounters',i:'Items',t:'Trainers'};
function walkSec(k,t,tags,body,force){const sk=k+'.'+t,v=WO.s[sk],open=force||(v===undefined?t!=='c':!!v);
 return sectionHTML(sk,SECN[t],tags,body,open);}
// A mission card: name and progress on the header; open, its unlock, reward and note, then its steps. It starts closed;
// on a filtered page (st.q) one that matches opens. data-w is the open state it was drawn with (bindWalk saves changes).
function misHTML(x){const nd=x.s.filter(c=>misDone(x.m,c.k)).length,open=misRec(x.m)?.o===true||!!st.q&&misTx(x).includes(st.q),m=esc(x.m);
 const meta=(b,t)=>t?`<div class="mmeta">${b?`<b>${b}</b> `:''}${esc(t)}</div>`:'';
 return `<details class="wmis" data-m="${m}" data-w="${open?1:0}" ${open?'open':''}><summary><span class="mn">${esc(x.n||x.m)}</span><span class="tag${nd===x.s.length?' got':''}">${nd}/${x.s.length}</span></summary><div class="misb">`+
  meta('Unlock:',x.u)+meta('Reward:',x.r)+meta('',x.note)+x.s.map(c=>{const done=misDone(x.m,c.k);return `<label class="wstep ${done?'done':''}"><input type="checkbox" data-mk="${m}" data-ck="${esc(c.k)}" ${done?'checked':''}><span>${esc(c.t)}${c.n?`<div class="mut small">${esc(c.n)}</div>`:''}</span></label>`;}).join('')+
  `</div><button class="endbar sb" hidden>${UPI}<span>Collapse ${esc(x.n||x.m)}</span></button></details>`;}
function walkStop(s,si,ti,cf,shown){const k=si+'.'+ti;const closed=WO.x[k]===0;
 const lv=stopLeaves(s,si,ti),nd=lv.filter(leafDone).length,mq=!!st.q&&stopEnt(s).some(e=>e.m&&misTx(e.m).includes(st.q));
 const steps=stopEnt(s).map(({j,x,m})=>{if(m)return misHTML(m);const sk=k+'.'+j;const done=!!WO.c[sk];return `<label class="wstep ${done?'done':''}"><input type="checkbox" data-sk="${sk}" ${done?'checked':''}><span>${esc(x[0])}${x[1]?`<div class="mut small">${esc(x[1])}</div>`:''}</span></label>`;}).join('');
 const ts=(s.tr||[]).map(k=>TRK[k]).filter(t=>t&&!rivalHidden(t));
 // Encounters: one box per area with its own tracker; several areas get a short tag (the area name minus the stop's).
 const areas=[];s.a.flatMap(ARS).forEach(ai=>{if(shown.has(ai))return;shown.add(ai);const A=AR[ai];const enc=A.es?secLines(ai,cf).concat(A.l.flatMap(li=>adjRows(li,cf,notSec).map(r=>[li,r]))):A.l.flatMap(li=>adjRows(li,cf).map(r=>[li,r]));if(!enc.length&&A.ns)return;areas.push([ai,A,enc]);});
 const multi=areas.length>1;
 const enc=areas.map(([ai,A,enc])=>{const tag=multi?(A.n.startsWith(s.n+' ')?A.n.slice(s.n.length+1):A.n):'';
  return `<div class="area">${A.ns&&tag?`<span class="atag">${esc(tag)}</span>`:''}${trackerHTML(ai,tag)}${CF.walkAreaNote&&A.note?`<div class="trnote">${esc(A.note)}</div>`:''}`+enc.map(([li,[m,rows]])=>`<div class="encl"><span class="mut">${A.l.length>1||LOC[li]!==A.n?esc(LOC[li])+' · ':''}${esc(m)}:</span> ${rows.map(x=>`<span class="${x.d?'dupe':''}"><a href="#/p/${x.p.id}">${esc(x.p.name)}</a> ${esc(x.show)}</span>`).join(', ')}</div>`).join('')+'</div>';}).join('');
 const its=s.it.filter(i=>starterOk(i[2]));
 // A stop with nothing in it is just a direction ("back to Iki Town"): a grey sign, not a box that opens nothing.
 if(!lv.length&&!areas.length&&!its.length&&!ts.length&&!s.note)return `<div class="wsign" data-k="${k}">${esc(s.n)}</div>`;
 const split=D.WK.splits[si],cap=+(split.n.match(/\[(?:Level )?Cap (\d+)\]/)?.[1]||0);
 let h=`<details class="stopd" ${closed?'':'open'} data-k="${k}"><summary class="stoph"><span class="pn">${esc(s.n)}${s.x?' <span class="mut small">(on the way)</span>':''}</span>${s.a.map(encAll).join('')}${ts.length?walkPt(ts,cap):''}</summary><div class="stop">`+
  (s.note?`<div class="trnote" style="margin:6px 0">${esc(s.note)}</div>`:'')+
  (lv.length?walkSec(k,'c',`<span class="tag${nd===lv.length?' got':''}">${nd}/${lv.length}</span>`,`<div class="chkb">${steps}</div>`,mq):'')+
  (areas.length?walkSec(k,'e',areas.map(([ai])=>encSummary(ai)).join(''),enc):'')+
  (its.length?walkSec(k,'i',`<span class="tag">${its.length}</span>${its.some(i=>/miss permanently/i.test(i[2]))?'<span class="tag miss">MISSABLE</span>':''}`,`<table class="itbl wt ix">${its.map(i=>`<tr><td>${i[3]!=null&&(i[0]==='TMs and HMs'||i[0]==='Move Tutors')?`<a href="#/m/${i[3]}">${esc(i[1])}</a>`:i[0]==='Mega Stones'&&i[3]?`<a href="#/p/${i[3]}">${esc(i[1])}</a>`:esc(i[1])}<div class="mut small">${esc(i[0])}</div></td><td>${esc(i[2]).replace(/\n/g,'<br>')}${/miss permanently/i.test(i[2])?'<span class="warn">MISSABLE</span>':''}</td></tr>`).join('')}</table>`):'')+
  (ts.length?walkSec(k,'t',`<span class="tag">${ts.length}</span>`,walkTrainers(ts)):'');
 return h+`<button class="endbar st" hidden>${UPI}<span>Collapse ${esc(s.n)}</span></button></div></details>`;}
// What a walkthrough search matches: the stop's name, notes, steps, items, areas (and their Pokemon) and trainers.
const stopText=s=>s.tx??=(s.n+' '+(s.note?s.note+' ':'')+stopEnt(s).map(e=>e.m?misTx(e.m):e.x.join(' ')).join(' ')+' '+s.it.map(i=>i[1]+' '+i[2]).join(' ')+' '+s.a.flatMap(ARS).map(ai=>AR[ai].n+' '+areaSpecies(ai).map(p=>p.name).join(' ')).join(' ')+' '+(s.tr||[]).map(k=>TRK[k]?TRK[k].key:'').join(' ')).toLowerCase();
function listWalk(){fil.innerHTML='';const W=D.WK;const cf=caughtFams(-1);const shown=new Set();const q=st.q;
 if(q){const hits=[];W.splits.forEach((sp,si)=>sp.st.forEach((s,ti)=>{if(stopText(s).includes(q))hits.push([si,ti]);}));
  app.innerHTML=hits.map(([si,ti])=>`<div class="sech">${esc(W.splits[si].n)}</div>`+walkStop(W.splits[si].st[ti],si,ti,cf,shown)).join('');bindWalk();return;}
 const [n,f]=tkCounts();
 // Top: Guide info, Starter, Next step, then Expand / Collapse all for the splits.
 app.innerHTML=`<div class="wtool"><details class="split" data-wo="gi" ${WO.o.gi?'open':''}><summary>Guide info <span class="mut small">${n} caught · ${f} failed</span></summary><div class="body pbody" data-gi="1"></div></details>`+
  starterRow()+(CHK?`<button class="resume wk-next">${nextInner()}</button>`:'')+segBar('wk-all all')+`</div>`+
  W.splits.map((sp,si)=>{const all=sp.st.flatMap((s,ti)=>stopLeaves(s,si,ti));const done=all.filter(leafDone).length;
   return `<details class="split jt" data-wo="${si}" ${WO.o[si]?'open':''}><summary>${esc(sp.n)} ${CHK?`<span class="tag ${done===all.length&&all.length?'got':''}">${done}/${all.length}</span>`:`<span class="mut small">${sp.st.length} stop${sp.st.length===1?'':'s'}</span>`}</summary>${sp.note?`<div class="trnote" style="margin:8px 2px">${esc(sp.note)}</div>`:''}<div class="body" data-si="${si}"></div></details>`;}).join('');
 app.querySelectorAll('details.split[data-wo]').forEach(d=>{const fill=()=>{const b=d.querySelector('.body');if(b&&d.open&&!b.innerHTML){if(b.dataset.gi){b.innerHTML=guideInfoHTML();bindWalk();return;}const si=+b.dataset.si;
   b.innerHTML=segBar('wk-sp')+W.splits[si].st.map((s,ti)=>walkStop(s,si,ti,cf,shown)).join('')+`<button class="endbar sp" hidden>${UPI}<span>Collapse ${esc(W.splits[si].n)}</span></button>`;bindWalk();}};
  d.addEventListener('toggle',()=>{if(d.open)WO.o[d.dataset.wo]=1;else delete WO.o[d.dataset.wo];woSave();fill();barsSoon();});fill();});
 bindWalk();bars();}
function bindWalk(){bindTrackers();bindTrd();bindHead();app.querySelectorAll('.wstep input').forEach(c=>{if(c.dataset.b)return;c.dataset.b=1;c.onchange=()=>{const mk=c.dataset.mk;if(mk)misSet(mk,r=>{if(c.checked)r.c[c.dataset.ck]=1;else delete r.c[c.dataset.ck];});else{if(c.checked)WO.c[c.dataset.sk]=1;else delete WO.c[c.dataset.sk];woSave();}c.closest('.wstep').classList.toggle('done',c.checked);
  const tag=d=>{if(!d)return;const all=[...d.querySelectorAll('.wstep input')],n=all.filter(x=>x.checked).length,t=d.querySelector(':scope>summary .tag');if(t){t.textContent=n+'/'+all.length;t.classList.toggle('got',n===all.length);}};
  const mi=mk&&c.closest('details.wmis');tag(mi);tag(c.closest('details.sec'));tag(c.closest('details.split'));const nx=app.querySelector('.wk-next');if(nx)nx.innerHTML=nextInner();
  // The tick that completes a mission closes it, its header landing under the pinned ones.
  if(mi&&c.checked&&[...mi.querySelectorAll('.wstep input')].every(x=>x.checked)){foldUp(mi);mi.querySelector(':scope>summary').focus({preventScroll:true});}};});
 colBind(app);app.querySelectorAll('details.stopd').forEach(d=>{if(d.dataset.bd)return;d.dataset.bd=1;d.addEventListener('toggle',()=>{const k=d.dataset.k;if(/^doc/.test(k)){if(d.open)WO.x[k]=1;else delete WO.x[k];}else if(d.open)delete WO.x[k];else WO.x[k]=0;woSave();barsSoon();});});
 app.querySelectorAll('details.sec').forEach(d=>{if(d.dataset.bd)return;d.dataset.bd=1;d.addEventListener('toggle',()=>{WO.s[d.dataset.s]=d.open?1:0;woSave();barsSoon();});});
 app.querySelectorAll('details.wmis').forEach(d=>{if(d.dataset.bd)return;d.dataset.bd=1;d.addEventListener('toggle',()=>{if(+d.dataset.w===+d.open)return;d.dataset.w=d.open?1:0;misSet(d.dataset.m,r=>{r.o=d.open;});barsSoon();});});
 const r=app.querySelector('.wk-reset');if(r&&!r.dataset.b){r.dataset.b=1;r.onclick=()=>{if(confirm('Clear every walkthrough checkbox?')){WO.c={};const mm=misMap();if(mm)Object.values(mm).forEach(r=>{if(r&&typeof r==='object')r.c={};});woSave();rerender();}};}
 barsSoon();}
// Taps on the collapsible pages: header taps (flip), the expand / collapse bars (.all = the page's boxes, else the blocks
// of the box it sits in; the Trainers page has its own controls: trShow, trTeams, trAll),
// collapse bars and the walkthrough's Next step.
const COLV={walk:1,locs:1,l:1,trainers:1,items:1};
app.addEventListener('click',e=>{if(!COLV[document.body.dataset.v])return;
 if(document.body.dataset.v==='trainers'){const w=e.target.closest('.trsw button'),pt=e.target.closest('button.pt');
  if(w){trShow(w.closest('details.split'),+w.dataset.v);return;}if(pt){e.preventDefault();e.stopPropagation();trTeams(pt.closest('details.stopd'),pt);return;}}
 const wk=e.target.closest('button.pt.wk');if(wk){e.preventDefault();e.stopPropagation();walkTeams(wk.closest('details.stopd'));return;}
 const b=e.target.closest('.seg button');
 if(b){const s=b.closest('.seg');if(s.matches('.tr-all')){trAll(b);return;}segAll(b,s.matches('.all')?app.querySelectorAll('details.split.jt'):s.matches('.it-sp')?b.closest('.body').querySelectorAll('details.sec'):b.closest('.body').querySelectorAll(':scope>details'));return;}
 const end=e.target.closest('.endbar,.trfold');if(end){foldUp(end.closest('details'));return;}
 if(e.target.closest('.wk-next')){const n=nextStep();if(!n)return;const k=n.si+'.'+n.ti;WO.o[n.si]=1;delete WO.x[k];WO.s[k+'.c']=1;if(n.m)misSet(n.m.m,r=>{r.o=true;});woSave();render(true);
  const inp=app.querySelector(n.m?`.wstep input[data-mk="${CSS.escape(n.m.m)}"][data-ck="${CSS.escape(n.c.k)}"]`:`.wstep input[data-sk="${k}.${n.j}"]`);if(!inp)return;land(inp.closest('.wstep'),GAP);return;}
 const sm=e.target.closest('summary');
 if(sm&&sm.parentElement.tagName==='DETAILS'&&app.contains(sm)&&!e.target.closest('a,select,input,button')){e.preventDefault();flip(sm.parentElement,!sm.parentElement.open);}});
// ===== TRAINERS TAB (D.TR, see notes). Speeds use each Pokemon's real IVs and nature, and its EVs unless the Minimal
// Grinding Mode switch (LS.mgm) is on; hacks with no EVs at all (CF.evs false) have no switch. Relative levels (r:-1) use the trainer's level cap, which can be
// overridden per trainer (LS.cap; CF.capLast also remembers the last one set, for trainers with no cap).
// Rival teams (t.st) follow the starter: its type from tracker area 0, or its name from the picker (CF.starter 'pick').
const TRD=D.TR||{g:[],caps:[]};const TRS=[];const TRK={};
if(TRD.mini){TRD.caps=TRD.mini.filter(c=>!c[4]).map(c=>[c[0],c[2]]);delete TRD.mini;}
TRD.g.forEach(g=>g.sec.forEach(s=>{if(Array.isArray(s.cap?.[0]))s.cap=s.cap[1];}));
TRD.g.forEach((g,gi)=>g.sec.forEach((s,si)=>s.tr.forEach(t=>{t.g=g.n;t.h=s.h;t.tab=g.tab;t.at=[gi,si];
 t.key=(t.n+' '+t.loc+' '+t.tags.join(' ')+' '+g.n+' '+s.h+' '+t.p.map(x=>(byId[x.id]?byId[x.id].name:'')+' '+(x.i||'')).join(' ')+' '+(t.st?t.st+' starter':'')).toLowerCase();TRS.push(t);TRK[t.k]=t;})));
const TRUSE={};TRS.forEach(t=>t.p.forEach(x=>{(TRUSE[x.id]=TRUSE[x.id]||[]).includes(t)||TRUSE[x.id].push(t);}));
let TCAP={};try{TCAP=JSON.parse(localStorage.getItem(LS.cap)||'{}')}catch(e){}
const HAS_MGM=EVS&&CF.mgm!==false&&!!D.TR?.g.some(g=>g.sec.some(s=>s.tr.some(t=>(t.p||[]).some(p=>p.ev?.some(v=>v>0))||(t.pt||[]).some(partner=>(partner.p||[]).some(p=>p.ev?.some(v=>v>0))))));
let MGM=false;try{MGM=HAS_MGM&&localStorage.getItem(LS.mgm)==='1'}catch(e){}
const capOf=t=>+TCAP[t.k]||t.cap||(CF.capLast&&+TCAP._last)||0;
const starterType=()=>{if(PICK&&CF.starter!=='type')return TK.s;const e=TK.e&&TK.e[STARTER_AREA>=0?STARTER_AREA:0];const p=e&&e.p&&!e.f&&byId[e.p];return p?(p.t.find(x=>['Grass','Fire','Water'].includes(x))||''):'';};
const rivalHidden=t=>{const s=starterType();return !!(t.st&&s&&t.st!==s)||!plOk(t);};
const PRE={Burned:'BRN',Poisoned:'PSN',Frostbitten:'FRB',Burn:'BRN',Poison:'PSN',Frostbite:'FRB'};
const evTxt=ev=>ev.map((v,i)=>v?v+' '+SN[i]:'').filter(Boolean).join(' / ');
// A Pokemon's level: its own, or the trainer's cap plus its offset (r) for relative levels.
const monLv=(x,cap)=>x.l!=null?x.l:x.r!=null&&cap?cap+x.r:NaN;
// One Pokemon (template/README.md): sprite, name and level; types, tags and speed; ability · item · nature; moves
// two across; EVs. No IVs (speeds still use them).
// A Totem's aura (mon.au: stages Atk, Def, SpA, SpD, Spe): "Aura Def +1", "Aura +2 all".
const auTxt=au=>{const n=['Atk','Def','SpA','SpD','Spe'],s=v=>(v>0?'+':'−')+Math.abs(v);return 'Aura '+(au.every(v=>v===au[0])?s(au[0])+' all':au.map((v,i)=>v?n[i]+' '+s(v):'').filter(Boolean).join(' '));};
function monCard(x,cap,sel,trainerKey,index){const p=byId[x.id];const lv=monLv(x,cap);
 // No speed when the source gives no IVs, or no EVs where they count (unknown, not assumed).
 const spe=EVS&&!MGM?x.ev?.[5]:0;const main=p&&lv&&x.iv&&spe!=null?stat(p.s[5],5,x.iv[5],spe,x.sl??lv,x.na):null;
 const spd=main==null?'':`<span class="spd"><span class="nw">Spe <b>${main}</b></span>${/choice scarf/i.test(x.i)?` <span class="mut small">Scarf ${Math.floor(main*1.5)}</span>`:''}</span>`;
 const lvs=x.l!=null||x.r==null?`Lv ${x.l??'?'}`:`Lv ${lv||'?'} <span class="mut small">cap${x.r?(x.r>0?'+':'−')+Math.abs(x.r):''}</span>`;
 const tags=(x.ld?`<span class="tag">Lead ${x.ld}</span>`:'')+(x.pre||[]).map(z=>`<span class="tag warnb">${esc(PRE[z]||z)}</span>`).join('')+(x.src==='s'?'<span class="tag">sheet only</span>':'')+(x.au?`<span class="tag aura">${auTxt(x.au)}</span>`:'');
 const ab=x.ao?esc(x.ao):(x.a0!=null&&x.a0>=0?alink(x.a0)+' → ':'')+(x.a>=0?alink(x.a):'');const ev=EVS&&!MGM&&x.ev?evTxt(x.ev):'';
 return `<div class="mon${sel?' sel':''}"><div class="mh">${spr(x.id,'s32')}<div class="mt"><div class="l1"><span class="mn">${p?`<a href="#/p/${x.id}">${esc(p.name)}</a>`:'?'}</span><b>${lvs}</b></div><div class="l2">${p?p.t.map(ty).join(''):''}${tags} ${spd}</div></div></div>
 <div class="small ab">${ab}${x.i?' · '+esc(x.i):''}${x.na?` · <span title="${esc(natLabel(x.na))}">${esc(x.na)}</span>`:''}</div>
 <div class="mv">${x.m.map(i=>`<a href="#/m/${i}"><span class="dot" style="background:${tcol(M[i]==='Hidden Power'&&x.hp?x.hp:(MV[i]||{}).t)}"></span>${M[i]==='Hidden Power'&&x.hp?'HP '+esc(x.hp):esc(M[i])}</a>`).join('')}</div>
 ${ev?`<div class="mut small ex">EVs ${ev}</div>`:''}${(x.x||[]).length?`<div class="mut small ex">Sheet: ${x.x.map(esc).join('; ')}</div>`:''}
 ${(x.cf||[]).length?`<div class="cfx">Sheet says ${x.cf.map(esc).join('; ')}</div>`:''}${(x.hn||[]).length?`<div class="cfx">hzla says ${x.hn.map(esc).join('; ')}</div>`:''}${CF.calc&&trainerKey?`<button class="calc-versus" data-trainer="${esc(trainerKey)}" data-index="${index}">Calc vs ${esc(p?.name||'?')} ▸</button>`:''}</div>`;}
// A team. Under 500 px wide (dex.css) a team of two or more is a strip of sprite buttons with levels over one Pokemon,
// the first to start (a tap shows another; not saved); wider, every Pokemon, three across at most.
function teamHTML(ps,cap,trainerKey){if(ps.length<2)return `<div class="team">${ps.map((x,index)=>monCard(x,cap,false,trainerKey,index)).join('')}</div>`;
 return `<div class="tpick">${ps.map((x,i)=>{const l=monLv(x,cap);return `<button type="button" data-i="${i}"${i?'':' class="on"'}>${spr(x.id,'s28')}<small>${isNaN(l)?'?':l}</small></button>`;}).join('')}</div><div class="team tB">${ps.map((x,i)=>monCard(x,cap,!i,trainerKey,i)).join('')}</div>`;}
document.addEventListener('click',e=>{const b=e.target.closest('.tpick button');if(!b)return;const bar=b.parentElement,t=bar.nextElementSibling;
 [...bar.children].forEach(x=>x.classList.toggle('on',x===b));[...t.children].forEach((m,i)=>m.classList.toggle('sel',i===+b.dataset.i));});
// A partner fighting at your side (t.pt [{n, st, p}], one team per starter where it depends on it): a closed drop-down
// with the team. Only your starter's team when you've chosen one.
const ptName=n=>n.replace(/^(Pokémon Trainer|Team Skull) /,'');
const ptOf=t=>{const s=starterType();const ps=(t.pt||[]).filter(p=>(!p.st||!s||p.st===s)&&plOk(p));return ps.length?ps:t.pt||[];};
function partnerBlock(t){const ps=ptOf(t);if(!ps.length)return '';
 return `<details class="ptd"><summary><span class="ptk">Your partner</span> ${esc(ptName(ps[0].n))}${ps.length>1?` <span class="mut small">(${ps.length} teams, by starter)</span>`:''}<span class="trmini">${ps[0].p.map(x=>spr(x.id,'s24')).join('')}</span></summary>
 ${ps.map(p=>`${ps.length>1?`<div class="mut small" style="margin:4px 0 2px">${[p.st?'If your starter is '+esc(p.st):'',p.pl?'If you play '+esc(PLN[p.pl]):''].filter(Boolean).join(', ')}</div>`:''}${teamHTML(p.p,0)}`).join('')}</details>`;}
// row: the card sits in a trainer row (Trainers page, walkthrough), so its bottom line starts with Collapse. inRow: in
// a row whose partner block is shown once above its cards (bindTrd), and whose summary already gives the name, place
// and tags: the card starts at its team (with the trainer's name as a small label where the row has several, multi).
function trainerBlock(t,mini,row,inRow,multi){const rel=t.p.some(x=>x.l==null);const cap=capOf(t);const own=TCAP[t.k]!=null;
 return `<div class="card trc" id="tr-${t.k}">${inRow?(multi?`<div class="trn trn2">${esc(t.n)}</div>`:'')+(t.st||t.pl?`<div class="trtg">${t.st?`<span class="tag">If your starter is ${esc(t.st)}</span>`:''}${t.pl?`<span class="tag">If you play ${esc(PLN[t.pl])}</span>`:''}</div>`:''):`<div class="trn">${mini?'':`<a href="#/tr/${t.k}">`}${esc(t.n)}${mini?'':'</a>'} <span class="mut small">${esc(t.loc)}</span></div>
 <div class="trtg">${t.st?`<span class="tag">If your starter is ${esc(t.st)}</span>`:''}${t.pl?`<span class="tag">If you play ${esc(PLN[t.pl])}</span>`:''}${t.tags.map(z=>`<span class="tag">${esc(z)}</span>`).join('')}</div>`}
 ${(t.note||[]).length?`<div class="trnote">${t.note.map(esc).join('<br>')}</div>`:''}
 ${t.rw?`<div class="trnote"><b>Rewards:</b> ${t.rw.map(esc).join(', ')}</div>`:''}
 ${rel?`<details class="capd" data-k="${t.k}" ${CAPO.has(t.k)?'open':''}><summary>Level cap <b>${t.cap||'–'}</b>${own?` <span class="mut small">· yours</span> <b>${TCAP[t.k]}</b>`:!t.cap&&cap?` <span class="mut small">· using</span> <b>${cap}</b>`:''}</summary><div class="trk"><span class="mut small">Your level</span>${INV?numBox(`data-k="${t.k}"`,cap||'',{min:1,max:100,steppers:true,label:TX.capl}).replace('class="nv"','class="nv capin"'):`<input class="capin" type="number" inputmode="numeric" min="1" max="100" style="width:72px" data-k="${t.k}" value="${cap||''}">`}<span class="mut small">${own&&t.cap?`<a href="#" class="capreset" data-k="${t.k}">reset to cap ${t.cap}</a>`:t.cap?'':TX.capnone}</span></div></details>`:''}
 ${inRow?'':partnerBlock(t)}${teamHTML(t.p,cap,t.k)}${t.normal?`<details class="normal-team"><summary>Normal team</summary>${teamHTML(t.normal.p,0)}<p class="trnote">Easy: same team, levels ${t.normal.easy?'−'+t.normal.easy:'unchanged'}.</p></details>`:''}
 ${row||t.pp?`<div class="trf mut small">${row?`<button class="trfold">${UPI}<span>Collapse</span></button>`:''}${t.pp?`<span class="trpp"><a href="${esc(t.pp)}" target="_blank" rel="noopener">Pokepaste</a></span>`:''}</div>`:''}</div>`;}
// The level box under a trainer starts closed; it stays open across re-renders (setting the level re-renders) but not
// across reloads.
const CAPO=new Set();
function bindTrainers(root){(root||app).querySelectorAll('details.capd').forEach(d=>{if(d.dataset.b)return;d.dataset.b=1;d.addEventListener('toggle',()=>{if(d.open)CAPO.add(d.dataset.k);else CAPO.delete(d.dataset.k);});});
 (root||app).querySelectorAll('.capin').forEach(i=>{if(i.dataset.b)return;i.dataset.b=1;i.onchange=()=>{const v=+i.value;if(v>0&&v<=100){if(CF.capLast)TCAP._last=v;if(v!==TRK[i.dataset.k]?.cap)TCAP[i.dataset.k]=v;else delete TCAP[i.dataset.k];}else delete TCAP[i.dataset.k];try{localStorage.setItem(LS.cap,JSON.stringify(TCAP))}catch(e){}rerender();};});
 (root||app).querySelectorAll('.capreset').forEach(a=>{if(a.dataset.b)return;a.dataset.b=1;a.onclick=e=>{e.preventDefault();delete TCAP[a.dataset.k];try{localStorage.setItem(LS.cap,JSON.stringify(TCAP))}catch(e){}rerender();};});}
let TOPEN={};try{TOPEN=JSON.parse(localStorage.getItem(LS.tr)||'{}')}catch(e){}
function trHead(){const r1=(HAS_MGM?`<label class="mgm"><input type="checkbox" class="mgm-toggle" ${MGM?'checked':''}> MGM</label>`:'')+(PICK?starterSel('tk-starter','Starter'):'')+playerSel('tk-player','Player');
 const rows=TRD.caps;
 const tbl=rows.length?`<table class="itbl">${rows.map(c=>`<tr><td>${esc(c[0])}</td><td>${c[1]}</td></tr>`).join('')}</table>`:'';
 const h=(r1?`<div class="r1">${r1}</div>`:'')+(tbl?`<details class="capsd" ${CAPSO?'open':''}><summary class="mut small">Level caps</summary>${tbl}</details>`:'');
 return h?`<div class="card trh">${h}</div>`:'';}
let CAPSO=false;
const capOfSec=s=>Array.isArray(s.cap?.[0])?s.cap[1]:typeof s.cap==='number'?[s.cap]:s.cap;
// A place's (or walkthrough stop's) trainer button: open cards / trainers, then the level cap where there is one (the
// place's own, else its box's).
const ptText=(n,m,cap)=>n+'/'+m+(cap?' | '+cap:'');
const capLine=s=>{const c=capOfSec(s);if(!c)return '';const n=c[3];
 return `<div class="capl">Level cap <b>${c[0]}</b>${c[1]?` · ${esc(c[1])}${c[2]?', '+esc(c[2]):''} · ${n?`${n} battle${n===1?'':'s'}`:'next'}`:''}</div>`;};
function bindHead(){app.querySelectorAll('.mgm-toggle').forEach(m=>{m.onchange=()=>{MGM=m.checked;try{localStorage.setItem(LS.mgm,MGM?'1':'0')}catch(e){}rerender();};});
 const d=app.querySelector('details.capsd');if(d)d.addEventListener('toggle',()=>{CAPSO=d.open;});}
function listTrainers(){fil.innerHTML='';const s=st.q;
 if(s){const a=TRS.filter(t=>t.key.includes(s)&&!rivalHidden(t));app.innerHTML=a.map(t=>`<div class="mut small" style="margin-top:10px">${esc(t.g)}${t.h?' · '+esc(t.h):''}</div>`+trainerBlock(t)).join('');bindTrainers();return;}
 app.innerHTML=trHead()+segBar('tr-all all')+TRD.g.map((g,gi)=>{const n=g.sec.reduce((a,x)=>a+x.tr.filter(t=>!rivalHidden(t)).length,0);return `<details class="split jt" data-gi="${gi}" ${TOPEN.o[gi]?'open':''}><summary>${esc(g.n)} <span class="mut small">${n} trainers</span></summary><div class="body"></div></details>`;}).join('');
 bindHead();bindTrackers();app.querySelectorAll('details.split[data-gi][open]').forEach(d=>TOG.trainers(d));bars();}
// The page is boxes (D.TR.g: one per level cap, "Roxanne Split [Cap 15]"; Hot House, Mini Bosses) → places (the
// box's locations) → trainers (name, tags and team preview; open, the full card). State in LS.tr {o:{<box>:1 open},
// p:{<box>.<place>:0 closed}, t:{<trainer key>:0 closed}, layout (relayout)}: boxes start closed, places and trainers
// open. (Numeric keys and x are from before the boxes were mini-splits, and no longer read.)
TOPEN.o=TOPEN.o||{};TOPEN.p=TOPEN.p||{};TOPEN.t=TOPEN.t||{};
const trSave=()=>{try{localStorage.setItem(LS.tr,JSON.stringify(TOPEN))}catch(e){}};if(relayout(TOPEN,TRD.g.map(g=>[g.n,g.sec.map(x=>x.h)]),{o:1,p:2}))trSave();
function trGroup(gi){const g=TRD.g[gi];
 const secs=g.sec.map((s,si)=>{const ts=s.tr.filter(t=>!rivalHidden(t));
  const head=((s.note||[]).length?`<div class="trnote">${s.note.map(esc).join('<br>')}</div>`:'')+(s.rw?`<div class="trnote"><b>Reward, pick one:</b> ${s.rw.map(z=>{const p=P.find(q=>q.name===z||q.name.startsWith(z+' ('));return p?plink(p.id):esc(z);}).join(', ')}</div>`:'');
  const rows=trRows(ts,t=>TOPEN.t[t.k]!==0,!s.h);if(!s.h){return head+rows;}
  const k=gi+'.'+si;return `<details class="stopd" data-k="${k}" ${TOPEN.p[k]===0?'':'open'}><summary class="stoph"><span class="pn">${esc(s.h)}</span>${s.opt?'<span class="tag">optional</span>':''}<button class="pt" type="button" data-cap="${capOfSec(s)?capOfSec(s)[0]:g.cap||''}"></button></summary><div class="stop">${capLine(s)}${head}${rows}<button class="endbar st" hidden>${UPI}<span>Collapse ${esc(s.h)}</span></button></div></details>`;}).join('');
 return trSwitch(g.sec.some(s=>s.h))+(g.note&&g.note.length?`<div class="trnote" style="margin:8px 2px">${g.note.map(esc).join('<br>')}</div>`:'')+secs+`<button class="endbar sp" hidden>${UPI}<span>Collapse ${esc(g.n)}</span></button>`;}
TOG.trainers=d=>{if(st.q)return;const k=d.dataset.k;
 if(d.matches('details.split[data-gi]')){const b=d.querySelector(':scope>.body');if(d.open&&!b.innerHTML){b.innerHTML=trGroup(+d.dataset.gi);colBind(b);bindTrd(b);trObs(d);trSync(d);}if(d.open)TOPEN.o[d.dataset.gi]=1;else delete TOPEN.o[d.dataset.gi];}
 else if(d.matches('details.stopd')){if(d.open)delete TOPEN.p[k];else TOPEN.p[k]=0;}
 else if(d.matches('details.trd')){if(d.open)delete TOPEN.t[k];else TOPEN.t[k]=0;}else return;trSave();
 if(!d.matches('details.split')){const bx=d.closest('details.split');if(bx&&bx.querySelector('.trsw'))trSyncSoon(bx);}};
// Trainers page controls (template/README.md). State is read from the page: the Show switch from which places and
// cards are open (0 Places, 1 Trainers, 2 Teams, -1 mixed), the place buttons from their cards. Rows are the cards (one per
// battle where trainers share one). Actions change the DOM in place (cards built at once: d._f) and keep TOPEN.p / TOPEN.t.
// The Show row is pinned under the search bar and the place header under it (--sw measured below).
const trSwitch=hp=>`<div class="trsw"><span>Show</span><div class="o" role="group" aria-label="Show">${['Places','Trainers','Teams'].map((x,i)=>hp||i?`<button type="button" data-v="${i}">${x}</button>`:'').join('')}</div><span class="mx" hidden>mixed</span></div>`;
const IHO=new ResizeObserver(es=>es.forEach(e=>{const b=e.target.closest('details.split');if(b)b.style.setProperty('--sw',e.target.getBoundingClientRect().height+'px');}));
const trObs=d=>{const w=d.querySelector('.trsw');if(w)IHO.observe(w,{box:'border-box'});};
const trRowsOf=p=>[...p.querySelectorAll('details.trd')];
const trLoose=b=>[...b.querySelectorAll('details.trd')].filter(d=>!d.closest('details.stopd'));
function trLive(b,ps){const op=ps.filter(p=>p.open);if(ps.length&&!op.length)return 0;const cs=op.flatMap(trRowsOf).concat(trLoose(b));if(!cs.length)return 1;const n=cs.filter(d=>d.open).length;return n?n===cs.length?2:-1:1;}
function trSync(b){const w=b.querySelector('.trsw');if(!w)return;const ps=[...b.querySelectorAll('details.stopd')],v=trLive(b,ps),part=ps.some(p=>!p.open);
 w.querySelectorAll('button').forEach(x=>{const i=+x.dataset.v;x.setAttribute('aria-pressed',v===i);x.className=v===i?i===0||!part?'on':'part':'';});w.querySelector('.mx').hidden=v!==-1;w.classList.toggle('m',v===-1);
 ps.forEach(p=>{const t=p.querySelector('.pt'),r=trRowsOf(p),n=r.filter(d=>d.open).length;t.textContent=ptText(n,r.length,t.dataset.cap);t.className='pt'+(n&&n===r.length?' on':n?' part':'');t.hidden=!r.length;});}
const TRQ=new Set();let trq=0;
const trSyncSoon=b=>{TRQ.add(b);if(!trq)trq=requestAnimationFrame(()=>{trq=0;TRQ.forEach(trSync);TRQ.clear();});};
const trSet=(d,v)=>{if(d.open!==v){d.open=v;if(d._f)d._f();}if(v)delete TOPEN.t[d.dataset.k];else TOPEN.t[d.dataset.k]=0;};
const trOpenP=(p,v)=>{if(p.open!==v)p.open=v;if(v)delete TOPEN.p[p.dataset.k];else TOPEN.p[p.dataset.k]=0;};
// View anchoring: the first trainer row whose top edge is at or below the pinned stack (else the row spanning its edge,
// else its place header, its island header, the pressed button); after the change it goes back to the same pixel, or just
// under the pinned stack if it would sit beneath it.
function trLim(){let lim=hdrH();for(let i=0;i<6;i++){const el=document.elementFromPoint(innerWidth/2,lim+1),s=el&&el.closest('details.split>summary,.trsw,details.stopd>summary');
  if(!s||!app.contains(s))break;const r=s.getBoundingClientRect();if(r.top>lim+1.5||r.bottom<=lim+.5)break;lim=r.bottom;}return lim;}
function trGrab(btn){const lim=trLim(),x=innerWidth/2;let y=lim+2,fb=null,pl=null,is=null,row=null;
 const chain=el=>{const a=[el],sm=e=>e&&e.querySelector(':scope>summary'),p=el.closest('details.stopd'),b=el.closest('details.split');
  if(p&&sm(p)!==el)a.push(sm(p));if(b&&sm(b)!==el)a.push(sm(b));a.push(btn);return a.map(e=>[e,e.getBoundingClientRect().top]);};
 for(let i=0;i<150&&y<innerHeight;i++){const el=document.elementFromPoint(x,y);if(!el){y+=6;continue;}
  const r=el.closest('details.trd');
  if(r&&app.contains(r)){const t=r.getBoundingClientRect();if(t.top>=lim-1){row=r;break;}fb=fb||r;y=Math.max(y+1,t.bottom+1);continue;}
  if(!pl)pl=el.closest('details.stopd>summary');if(!is)is=el.closest('details.split');y+=6;}
 if(row)return{c:chain(row),row:1};if(fb)return{c:chain(fb),fb:1};
 const a=pl||(is&&is.querySelector(':scope>summary'));return{c:a?chain(a):[[btn,btn.getBoundingClientRect().top]]};}
function trRestore(g){const a=g.c.find(([e])=>e.isConnected&&e.getClientRects().length);if(!a)return;const [el,top]=a;
 scrollBy(0,el.getBoundingClientRect().top-top);
 if(g.row&&a===g.c[0]){const t=el.getBoundingClientRect().top,lim=trLim();if(t<lim-.5)scrollBy(0,t-lim);}
 flash(el.matches('details')?el.querySelector(':scope>summary'):el);hold(el);jumpState();}
function trShow(b,v){const ps=[...b.querySelectorAll('details.stopd')],lv=trLive(b,ps),part=ps.some(p=>!p.open);
 if(v===0?lv===0:lv===v&&!part)return;
 const g=trGrab(b.querySelector('.trsw'));noAnchor();
 if(v===0)ps.forEach(p=>trOpenP(p,false));
 else{let tg=ps.filter(p=>p.open);if(!tg.length||lv===v){ps.forEach(p=>trOpenP(p,true));tg=ps;}
  tg.flatMap(trRowsOf).concat(trLoose(b)).forEach(d=>trSet(d,v===2));}
 trSave();trSync(b);bars();trRestore(g);}
function trTeams(p,btn){const r=trRowsOf(p),full=r.every(d=>d.open),g=trGrab(btn);noAnchor();
 trOpenP(p,true);r.forEach(d=>trSet(d,!full));trSave();trSync(p.closest('details.split'));bars();trRestore(g);}
function trAll(btn){const open=btn.dataset.a==='1',g=trGrab(btn);noAnchor();
 app.querySelectorAll('details.split.jt').forEach(d=>{if(d.open!==open){d.open=open;TOG.trainers(d);}});bars();trRestore(g);}
function trainerDetail(k){fil.innerHTML='';const t=TRK[k];if(!t){app.innerHTML='<p>Not found.</p>';return;}
 app.innerHTML=`<a class="back" href="javascript:history.back()">‹ Back</a><div class="mut small" style="margin-top:6px">${esc(t.g)}${t.h?' · '+esc(t.h):''}${t.c&&t.c.length?' · calc: '+t.c.map(esc).join(', '):''}</div>`+trainerBlock(t,true);bindTrainers();window.scrollTo(0,0);}
// Trainer rows (Trainers page and walkthrough stops): name, tags (and the place, where no heading gives it) and the
// team preview; open, the full card, built when first opened (bindTrd), with Collapse on its bottom line. open(t):
// whether a row starts open.
// With battle ids (t.bt), one row per battle: trainers fought at once share a row ("Grunt + Grunt"), the format and
// partner as a tag, and the other version's teams (tag Prismatic Moon) fold into a drop-down at the end.
// The rows: trainers fought at once (same battle id) share one.
const trGroups=ts=>{const gs=[];ts.forEach(t=>{const l=gs[gs.length-1];if(l&&t.bt&&l[0].bt===t.bt)l.push(t);else gs.push([t]);});return gs;};
function trRows(ts,open,loc){
 if(!ts.some(t=>t.bt))return ts.map(t=>`<details class="trd" data-k="${t.k}" ${open(t)?'open':''}><summary>${esc(t.n)} <span class="mut small">${[loc?t.loc:'',...t.tags.filter(z=>!/Optional/.test(z))].filter(Boolean).map(esc).join(' · ')}${t.tags.some(z=>/Optional/.test(z))?' · optional':''}</span><span class="trmini">${t.p.map(x=>spr(x.id,'s24')).join('')}</span></summary><div class="trb" data-k="${t.k}"></div></details>`).join('');
 const gs=trGroups(ts);
 const FMT=/^(Double|Multi|Triple|Rotation) Battle$|^Battle Royal$/,MOON='Prismatic Moon';
 const row=g=>{const t=g[0],f=t.tags.find(z=>FMT.test(z)),ps=ptOf(t);
  const nm=g.length>1?g.map(x=>esc(x.n.replace(/^(Pokémon Trainer|Team Skull Boss|Team Skull|Aether Foundation|Team Rainbow Rocket|Aether Branch Chief) /,''))).join(' + '):esc(t.n);
  const rest=[loc?t.loc:'',...t.tags.filter(z=>!FMT.test(z)&&z!==MOON)].filter(Boolean).map(esc).join(' · ');
  return `<details class="trd" data-k="${t.k}" data-ks="${g.map(x=>x.k).join(',')}" ${open(t)?'open':''}><summary>${nm} ${f?`<span class="tag fmt">${esc(f.replace(/ Battle$/,''))}${ps.length?' · with '+esc(ptName(ps[0].n)):''}</span>`:''}${t.tags.includes(MOON)?`<span class="tag moon">${MOON}</span>`:''}${rest?` <span class="mut small">${rest}</span>`:''}<span class="trmini">${g.flatMap(x=>x.p).map(x=>spr(x.id,'s24')).join('')}</span></summary><div class="trb" data-k="${t.k}"></div></details>`;};
 const moon=gs.filter(g=>g[0].tags.includes(MOON));
 return gs.filter(g=>!moon.includes(g)).map(row).join('')+(moon.length?`<details class="moond"><summary>${MOON} only <span class="tag">${moon.length}</span> <span class="mut small">the other version's teams</span></summary>${moon.map(row).join('')}</details>`:'');}
const walkTrainers=ts=>trRows(ts,t=>TRDO.has(t.k),false);
// A walkthrough stop with trainers: "n/N | cap" in its header (open cards / rows, the highest level cap of their places).
// It opens or closes all the stop's cards, like a Trainers place's (walkTeams); walkPtSync keeps
// it in step, touching the text only when it changed.
const trCapOf=t=>{const g=TRD.g[t.at[0]],c=capOfSec(g.sec[t.at[1]]);return c?c[0]:g.cap||t.cap||0;};
function walkPt(ts,fallback=0){const gs=trGroups(ts),n=gs.filter(g=>TRDO.has(g[0].k)).length,cap=fallback||Math.max(0,...ts.map(trCapOf));
 return `<button class="pt wk${n&&n===gs.length?' on':n?' part':''}" type="button" data-cap="${cap||''}">${ptText(n,gs.length,cap)}</button>`;}
function walkPtSync(d){const b=d&&d.querySelector(':scope>summary>.pt.wk');if(!b)return;const r=[...d.querySelectorAll('details.trd')],n=r.filter(x=>x.open).length;
 const tx=ptText(n,r.length,b.dataset.cap),c='pt wk'+(n&&n===r.length?' on':n?' part':'');if(b.textContent!==tx)b.textContent=tx;if(b.className!==c)b.className=c;}
function walkTeams(d){const sm=d.querySelector(':scope>summary'),y=sm.getBoundingClientRect().top;noAnchor();
 if(!d.open)d.open=true;const sec=d.querySelector('details.sec[data-s$=".t"]');if(sec&&!sec.open)sec.open=true;
 const r=[...d.querySelectorAll('details.trd')],full=r.every(x=>x.open);r.forEach(x=>{if(x.open===full){x.open=!full;if(x._f)x._f();}});
 walkPtSync(d);bars();const dy=sm.getBoundingClientRect().top-y;if(dy)scrollBy(0,dy);hold(sm);jumpState();}
// Walkthrough trainer rows start closed and remember being opened until a reload.
const TRDO=new Set();
function bindTrd(root){(root||app).querySelectorAll('details.trd').forEach(d=>{if(d.dataset.b)return;d.dataset.b=1;const fill=()=>{const b=d.querySelector('.trb');if(document.body.dataset.v==='walk'){if(d.open)TRDO.add(d.dataset.k);else TRDO.delete(d.dataset.k);walkPtSync(d.closest('details.stopd'));}if(d.open&&b&&!b.innerHTML){const ks=(d.dataset.ks||d.dataset.k).split(',');
  b.innerHTML=partnerBlock(TRK[ks[0]])+ks.map((k,i)=>trainerBlock(TRK[k],false,i===ks.length-1,true,ks.length>1)).join('<div class="vs">and</div>');bindTrainers(b);}};d._f=fill;d.addEventListener('toggle',fill);fill();});}
function usedByCard(p){const u=TRUSE[p.id];if(!u)return '';return `<div class="card"><h3>Used by trainers (${u.length})</h3>${u.map(t=>`<div><a href="#/tr/${t.k}">${esc(t.n)}</a> <span class="mut small">${esc(t.loc)} · ${esc(t.g)}${t.st?(PICK?' · if your starter is '+esc(t.st):' · '+esc(t.st)+' starter'):''}</span></div>`).join('')}</div>`;}

// ===== FULL-WINDOW SEARCH. Tapping the search box covers the page with a query strip, results from every section and
// a 4-row keyboard. In the viewer the query is typed on the in-page keyboard (KB); in a browser the strip holds a real
// input for the device's own keyboard (Enter = Done, Esc = back).
// The first row (and Done / Enter) searches the page you're on for the text as typed; the page keeps that search when
// you change tab. Every other row is a thing (Pokemon, filter, place, walkthrough stop, trainer, item) with its actions
// as buttons under it, the page you're on first; tapping the row does the first one. An action either opens a page
// (Dex entry, move, ability, trainer), jumps to the thing on its page (open its boxes, put it under the pinned headers,
// flash it) or searches a page for the thing's full name. Sections: the page you're on first and in full, then
// Pokemon, filters, places, trainers, items, walkthrough, 8 each until "Show all". Recent picks (LS.recent) show when
// the query is empty.
const SR={el:null,q:'',more:{},items:[],after:null,
 ico(k){const sel={l:'#t-l',t:'#t-t',i:'#t-i',w:'#t-w'}[k];const s=sel&&document.querySelector(sel+' svg');
  return `<span class="ic">${s?s.outerHTML:k==='q'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>'}</span>`;},
 open(){if(this.el)return;this.q=q.value;this.more={};const el=this.el=document.createElement('div');el.className='srch';
  el.innerHTML=`<div class="sst"><button type="button" class="ib" data-a="back" aria-label="Back to the page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
${INV?`<button type="button" class="sq" data-a="kb" aria-label="Search"><span class="tx" data-ph="Search everything"></span></button>`
  :`<input type="search" class="sq" placeholder="Search everything" aria-label="Search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">`}
<button type="button" class="ib sx" data-a="clear" aria-label="Clear">×</button>${INV?`<button type="button" class="ib hk" data-a="hide" aria-label="Hide or show the keyboard"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>`:''}</div><div class="sres"></div>`;
  document.body.appendChild(el);document.body.classList.add('sopen');
  const inp=INV?null:el.querySelector('input.sq');
  if(inp){inp.value=this.q;inp.addEventListener('input',()=>{this.q=inp.value;this.more={};this.draw(true);});
   inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.done();}else if(e.key==='Escape'){e.preventDefault();this.close();}});}
  el.addEventListener('click',e=>{const b=e.target.closest('[data-a],[data-i],[data-more]');if(!b)return;
   if(b.dataset.i!=null){this.pick(+b.dataset.i,+(b.dataset.x||0));return;}
   if(b.dataset.more){this.more[b.dataset.more]=1;this.draw();return;}
   const a=b.dataset.a;if(a==='back')this.close();else if(a==='here')this.done();else if(a==='clear'){this.q='';if(KB.o)KB.buf='';if(inp){inp.value='';inp.focus();}this.draw(true);}
   else if(a==='hide'){if(KB.o)KB.close(true);else this.kb();}else if(a==='kb'&&!KB.o)this.kb();});
  if(inp)inp.focus();else this.kb();this.draw(true);},
 kb(){this.el.classList.remove('nokb');
  KB.open({mode:'abc',full:true,value:this.q,input:v=>{this.q=v;this.more={};this.draw(true);},
   onClose:quiet=>{if(!this.el)return;if(quiet)this.el.classList.add('nokb');else this.done();}});},
 close(){if(!this.el)return;const el=this.el;this.el=null;el.remove();document.body.classList.remove('sopen');KB.close(true);},
 // Done: the query goes to the page's search box, which filters its list (on a page with no list, the section's list).
 done(){const v=this.q.trim();this.close();if(v===q.value)return;q.value=v;q.dispatchEvent(new Event('input'));window.scrollTo(0,0);},
 // Open a route, then run then() once it has rendered (see hashchange).
 go(h,then){if(location.hash===h){render(false);if(then)then();}else{this.after=then||null;location.hash=h;}},
 cur(){const v=(location.hash||'#/').slice(2).split('/')[0];return {locs:'l',l:'l',trainers:'t',tr:'t',items:'i',walk:'w'}[v]||'p';},
 pick(i,x){const it=this.items[i];if(!it)return;const o=it.o,a=it.acts[x]||it.acts[0];
  const r=[o,...recRead().filter(y=>JSON.stringify(y)!==JSON.stringify(o))].slice(0,6);recSave(r);
  this.close();a[1]();},
 // Actions. find: search a list page for text; clear: no search, so the page shows in full for a jump.
 find(h,t){q.value=t;st.q=t.toLowerCase();this.go(h);},
 clear(){q.value='';st.q='';},
 jumpStop(si,ti){this.clear();WO.o[si]=1;delete WO.x[si+'.'+ti];woSave();this.go('#/walk',()=>land(app.querySelector(`details.stopd[data-k="${si}.${ti}"]>summary,.wsign[data-k="${si}.${ti}"]`)));},
 // A mission (a hit on its name) or one of its steps: open its split, stop, checklist and card; a gone step lands on the card.
 jumpMis(m,c){const at=MISAT.get(m);if(!at)return;const k=at.join('.');this.clear();WO.o[at[0]]=1;delete WO.x[k];WO.s[k+'.c']=1;misSet(m,r=>{r.o=true;});
  this.go('#/walk',()=>{const d=app.querySelector(`details.wmis[data-m="${CSS.escape(m)}"]`),i=d&&c!=null&&d.querySelector(`input[data-ck="${CSS.escape(c)}"]`);land(i?i.closest('.wstep'):d&&d.querySelector(':scope>summary'));});},
 // A trainer fought alongside others shares their row, which goes by the first one's key: open them all, find it by data-ks.
 jumpWalkTr(k){const w=walkOf(k);if(!w)return;const sk=w[0]+'.'+w[1];this.clear();WO.o[w[0]]=1;delete WO.x[sk];WO.s[sk+'.t']=1;trMates(k).forEach(x=>TRDO.add(x));woSave();
  this.go('#/walk',()=>land(trRowOf(app.querySelector(`details.stopd[data-k="${sk}"]`),k)));},
 jumpTr(k){const t=TRK[k];if(!t)return;this.clear();const [gi,si]=t.at;TOPEN.o[gi]=1;delete TOPEN.p[gi+'.'+si];trMates(k).forEach(x=>delete TOPEN.t[x]);trSave();
  this.go('#/trainers',()=>land(trRowOf(app.querySelector(`details.split[data-gi="${gi}"]`),k)));},
 jumpItem(si,ri){const sec=D.IT[si],g=sec.r[ri][4];this.clear();IO.o[si]=1;if(g)delete IO.s[si+'.'+g];try{localStorage.setItem(LS.items,JSON.stringify(IO))}catch(e){}
  this.go('#/items',()=>land(app.querySelectorAll(`details.split[data-si="${si}"] .body tr`)[ri]));},
 place(a){this.clear();this.go('#/l/'+AR[ARS(a)[0]].l[0]);},
 // A result's actions, [label, run, page], the page you're on first (on the Pokemon tab, a Pokemon's Dex entry).
 acts(o){const L=[],cur=this.cur(),add=(lb,pg,f)=>L.push([lb,f,pg]);
  if(o.k==='p'){const p=byId[o.v];if(!p)return null;const nm=p.name,lc=nm.toLowerCase();
   add('Dex','p',()=>this.go('#/p/'+p.id));
   if(TRUSE[p.id])add('Trainers','t',()=>this.find('#/trainers',nm));
   if(locFound().has(p.id))add('Places','l',()=>this.find('#/locs',nm));
   if(walkStops().some(([s])=>stopText(s).includes(lc)))add('Walk','w',()=>this.find('#/walk',nm));}
  else if(o.k==='f'){const v=o.v;add('Filter','p',()=>{if(!st.f.some(f=>f.k===v.k&&f.v===v.v))st.f.push(v);save();this.clear();this.go('#/');});
   if(v.k==='mv')add('Move','m',()=>this.go('#/m/'+v.v));if(v.k==='ab')add('Ability','a',()=>this.go('#/a/'+v.v));}
  else if(o.k==='l'){if(!AR[o.v])return null;const vs=visits(o.v);add('Places','l',()=>this.place(o.v));
   if(vs.length===1)add('Walk','w',()=>this.jumpStop(...vs[0]));else if(vs.length)add('Walk','w',()=>this.find('#/walk',AR[o.v].n));}
  else if(o.k==='w'){const s=(D.WK.splits[o.si]||{st:[]}).st[o.ti];if(!s)return null;add('Walk','w',()=>this.jumpStop(o.si,o.ti));
   const a=s.a.find(a=>AR[a]);if(a!=null)add('Places','l',()=>this.place(a));}
  else if(o.k==='ms'){if(!MIS.has(o.m))return null;add('Walk','w',()=>this.jumpMis(o.m,o.c));}
  else if(o.k==='t'){if(!TRK[o.v])return null;add('Trainers','t',()=>this.jumpTr(o.v));if(walkOf(o.v))add('Walk','w',()=>this.jumpWalkTr(o.v));add('Full page','tp',()=>this.go('#/tr/'+o.v));}
  else if(o.k==='i'){const sec=(D.IT||[])[o.si],r=sec&&sec.r[o.ri];if(!r)return null;const lc=r[0].toLowerCase();
   add('Items','i',()=>this.jumpItem(o.si,o.ri));
   if(walkStops().some(([s])=>s.it.some(i=>i[1].toLowerCase().includes(lc))))add('Walk','w',()=>this.find('#/walk',r[0]));
   if(TRS.some(t=>!rivalHidden(t)&&t.p.some(x=>x.i&&x.i.toLowerCase().includes(lc))))add('Trainers','t',()=>this.find('#/trainers',r[0]));}
  else return null;
  const j=L.findIndex(a=>a[2]===cur);if(j>0)L.unshift(...L.splice(j,1));
  return L;},
 row(o,sub){const acts=this.acts(o);if(!acts)return '';let ic,lb,sb='';
  if(o.k==='p'){const p=byId[o.v];ic=spr(p.id,'s32');lb=esc(p.name);sb=p.t.map(ty).join('');}
  else if(o.k==='f'){ic=this.ico('f');lb=o.v.k==='type'?ty(o.v.v):esc(fval(o.v));sb=esc(FL[o.v.k]+' filter');}
  else if(o.k==='l'){ic=this.ico('l');lb=esc(AR[o.v].n);sb=esc(sub||'');}
  else if(o.k==='w'){const sp=D.WK.splits[o.si];ic=this.ico('w');lb=esc(sp.st[o.ti].n);sb=esc(sp.n);}
  else if(o.k==='ms'){const x=MIS.get(o.m),c=o.c!=null&&x.s.find(c=>c.k===o.c),at=MISAT.get(o.m);ic=this.ico('w');lb=esc(c?c.t:x.n||x.m);sb=esc(D.WK.splits[at[0]].st[at[1]].n+(c?' · '+(x.n||x.m):''));}
  else if(o.k==='t'){const t=TRK[o.v];ic=this.ico('t');lb=esc(t.n);sb=esc(t.loc);}
  else{const sec=D.IT[o.si],r=sec.r[o.ri];ic=this.ico('i');lb=esc(r[0]);sb=esc(sec.n+' · '+r[1]);}
  this.items.push({o,acts});const i=this.items.length-1;
  return `<div class="sri"><button type="button" class="sr" data-i="${i}">${ic}<span class="st"><span class="sl">${lb}</span>${sb?`<span class="ss">${sb}</span>`:''}</span></button>`+
   (acts.length>1?`<div class="sac">${acts.map((a,x)=>`<button type="button" class="sc${x?'':' on'}" data-i="${i}" data-x="${x}">${esc(a[0])}</button>`).join('')}</div>`:'')+'</div>';},
 // Each section: [[pick, sub text]] in display order.
 sections(s){const n=norm(s),out={};if(!n)return out;const cur=this.cur();
  out.p=P.filter(p=>(p.nk??=norm(p.n)).includes(n)||p.key.includes(s)).sort((a,b)=>(b.nk.startsWith(n)-a.nk.startsWith(n))||a.i-b.i).map(p=>[{k:'p',v:p.id}]);
  const f=[],has=(k,v)=>st.f.some(x=>x.k===k&&x.v===v),pre=x=>norm(x).startsWith(n)?0:1;
  if(n.length>=2){types.filter(t=>norm(t).startsWith(n)&&!has('type',t)).forEach(t=>f.push({k:'type',v:t}));
   AB.map((a,i)=>i).filter(i=>abUsers[i]&&norm(AB[i][0]).includes(n)&&!has('ab',i)).sort((a,b)=>pre(AB[a][0])-pre(AB[b][0])).forEach(i=>f.push({k:'ab',v:i}));
   usedMoves.filter(i=>norm(M[i]).includes(n)&&!has('mv',i)).sort((a,b)=>pre(M[a])-pre(M[b])).forEach(i=>f.push({k:'mv',v:i}));
   LOC.map((l,i)=>i).filter(i=>locs[i]&&norm(LOC[i]).includes(n)&&!has('loc',i)).forEach(i=>f.push({k:'loc',v:i}));}
  out.f=f.map(v=>[{k:'f',v}]);
  // Places by name (or the name of a place inside them); walkthrough stops by name. On the walkthrough a place shows
  // as its visits, one row each; elsewhere as one place row, and stops it covers aren't listed again.
  const pl=[];AR.forEach((A,a)=>{if(A.in!=null)return;const other=A.l.map(li=>LOC[li]).filter(x=>x!==A.n);
   if(norm(A.n).includes(n)||other.some(x=>norm(x).includes(n)))pl.push([a,other.join(', ')]);});
  const seen=new Set(),ws=[],addW=(si,ti)=>{const k=si+'.'+ti;if(!seen.has(k)){seen.add(k);ws.push([{k:'w',si,ti}]);}};
  walkStops().forEach(([s,si,ti])=>{if(norm(s.n).includes(n))addW(si,ti);});
  if(cur==='w'){pl.forEach(([a])=>visits(a).forEach(v=>addW(...v)));out.l=pl.filter(([a])=>!visits(a).length).map(([a,o])=>[{k:'l',v:a},o]);out.w=ws;}
  else{const cov=new Set(pl.flatMap(([a])=>visits(a).map(v=>v.join('.'))));out.l=pl.map(([a,o])=>[{k:'l',v:a},o]);out.w=ws.filter(([o])=>!cov.has(o.si+'.'+o.ti));}
  // Missions, after the stops: one row for a hit on the name, unlock, reward or note; else a row for each step that matches.
  if(n.length>=2)MIS.forEach(x=>{const nk=t=>!!t&&norm(t).includes(n);if([x.n,x.u,x.r,x.note].some(nk))out.w.push([{k:'ms',m:x.m}]);else x.s.forEach(c=>{if(nk(c.t)||nk(c.n))out.w.push([{k:'ms',m:x.m,c:c.k}]);});});
  out.t=TRS.filter(t=>!rivalHidden(t)&&norm(t.n).includes(n)).map(t=>[{k:'t',v:t.k}]);
  out.i=(D.IT||[]).flatMap((sec,si)=>sec.r.map((r,ri)=>[r,ri]).filter(([r])=>norm(r[0]).includes(n)).map(([r,ri])=>[{k:'i',si,ri}]));
  return out;},
 draw(top){if(!this.el)return;const s=this.q.trim().toLowerCase();
  const tx=this.el.querySelector('.sq .tx');if(tx)tx.textContent=this.q;this.el.classList.toggle('empty',!this.q);this.items=[];let h='';
  const cur=this.cur(),T={p:'Pokémon',f:'Filters',l:'Locations',t:'Trainers',i:'Items',w:'Walkthrough'};
  if(!norm(s)){const r=recRead();
   const rr=r.map(o=>this.row(o,'')).join('');
   h=rr?`<div class="ssh">Recent</div>`+rr:`<div class="shint">Search Pokémon, types, abilities, moves, places, trainers, items and the walkthrough. Pick a result to open it or jump to it, or search this page for what you typed.</div>`;}
  else{const S=this.sections(s);
   h=`<button type="button" class="sr shere" data-a="here">${this.ico('q')}<span class="st"><span class="sl">Search “${esc(this.q.trim())}”</span><span class="ss">in ${T[cur]}</span></span></button>`;
   for(const k of [cur,...['p','f','l','t','i','w'].filter(x=>x!==cur)]){const a=S[k];if(!a||!a.length)continue;
    const lim=this.more[k]?a.length:k===cur?100:8;
    h+=`<div class="ssh">${T[k]}<span>${a.length}</span></div>`+a.slice(0,lim).map(([o,sub])=>this.row(o,sub)).join('')+
     (a.length>lim?`<button type="button" class="smore" data-more="${k}">Show all ${a.length}</button>`:'');}}
  const r=this.el.querySelector('.sres');r.innerHTML=h;if(top)r.scrollTop=0;}};
// Search helpers: every walkthrough stop as [stop, split, index]; the stops that visit a place (linked to it, or a
// later visit: a stop with its name, which only the first visit links); the stop a trainer is fought at; the Pokemon
// found at some place.
let WSTOPS=null,WTR=null,LFOUND=null;
const walkStops=()=>WSTOPS??=D.WK.splits.flatMap((sp,si)=>sp.st.map((s,ti)=>[s,si,ti]));
function visits(a){const A=AR[a];return A.vis??=walkStops().filter(([s])=>s.n===A.n||s.a.some(x=>x===a||ARS(x).includes(a)||ARS(a).includes(x))).map(([s,si,ti])=>[si,ti]);}
function walkOf(k){if(!WTR){WTR={};walkStops().forEach(([s,si,ti])=>(s.tr||[]).forEach(t=>{if(!WTR[t])WTR[t]=[si,ti];}));}return WTR[k];}
const trMates=k=>{const t=TRK[k];return t&&t.bt?TRS.filter(x=>x.bt===t.bt).map(x=>x.k):[k];};
const trRowOf=(root,k)=>{const d=root&&(root.querySelector(`details.trd[data-k="${k}"]`)||[...root.querySelectorAll('details.trd[data-ks]')].find(d=>d.dataset.ks.split(',').includes(k)));return d&&d.querySelector(':scope>summary');};
const locFound=()=>LFOUND??=new Set(Object.values(locs).flatMap(l=>l.map(([p])=>p.id)));
// Land a jump: put el under the headers pinned above it (the search bar, its stop's and section's) and flash it. The
// page has only just rendered, so the scroll is repeated each frame for a moment: the first one can stop short at the
// bottom of a page that content-visibility hasn't laid out yet. Any press, wheel or key ends it. Boxes around el that
// are still closed (a Prismatic Moon drop-down) are opened, and the ones content-visibility skips are laid out for real
// until it ends: a skipped box counts at its 400 px estimate, so a target deep inside a long one sat past the page's end.
// gap: room above el (Next step leaves GAP, as the jump buttons do).
let landEnd=null;
function land(el,gap=0){if(!el)return;const st0=el.tagName==='SUMMARY'?el.parentElement.parentElement:el;
 for(let p=st0.closest('details');p&&app.contains(p);p=p.parentElement.closest('details'))if(!p.open){p.open=true;if(p._f)p._f();}
 const cv=[];for(let p=el.parentElement;p&&p!==app;p=p.parentElement)if(getComputedStyle(p).contentVisibility==='auto'){p.style.contentVisibility='visible';cv.push(p);}
 const pin=()=>{let y=hdrH()+gap+trPinH(st0);for(let p=st0.closest('details');p&&app.contains(p);p=p.parentElement.closest('details'))if(p.open&&p.matches('details.stopd,details.sec'))y+=p.querySelector(':scope>summary').offsetHeight;return y;};
 const to=()=>{const dy=el.getBoundingClientRect().top-pin();if(Math.abs(dy)>.5)scrollBy(0,dy);};
 noAnchor();to();flash(el);const t0=performance.now();let stop=false;const end=()=>{stop=true;};if(landEnd)landEnd();landEnd=end;
 ['pointerdown','wheel','keydown'].forEach(k=>addEventListener(k,end,{once:true,passive:true}));
 const f=()=>{if(stop||performance.now()-t0>700){html.style.overflowAnchor='';cv.forEach(p=>p.style.contentVisibility='');jumpState();return;}to();requestAnimationFrame(f);};requestAnimationFrame(f);}

document.addEventListener('click',event=>{const button=CF.calc&&event.target.closest('.calc-versus');if(button)window.CALC?.enter(button.dataset.trainer,+button.dataset.index);});
// ===== CALC
function calcPage(){if(window.CALC)window.CALC.render();}
// ===== ROUTER
function render(fromInput){const h=location.hash||'#/';const parts=h.slice(2).split('/');const v=parts[0]||'';
 if(v==='calc'&&!CF.calc){history.replaceState(history.state,'','#/');render(fromInput);return;}
 if(CF.calc){document.body.classList.toggle('calc-route',v==='calc');if(v!=='calc')window.CALC?.leave();}
 if(st.view===''&&v!==''&&!fromInput)st.listScroll=Object.assign(keepAnchor(),{z:cvSizes()});
 // The search stays set from page to page, except into a place (#/l/, a link from a Pokemon page): that's a jump to it.
 if(v==='l'&&!fromInput){q.value='';st.q='';}
 document.body.dataset.v=v;if(RJ)RJ.hidden=!(COLV[v]&&!st.q||CF.calc&&v==='calc');
 if(v==='p'){setTab('p');detail(decodeURIComponent(parts[1]));}
 else if(v==='m'){setTab('p');moveDetail(+parts[1]);}
 else if(v==='a'){setTab('p');abilityDetail(+parts[1]);}
 else if(v==='locs'){setTab('l');listLocs2(false);}
 // #/l/<place>: a navigation (also one typed from search, st.lgo) opens and scrolls to the place once; re-renders don't.
 else if(v==='l'){setTab('l');const go=!fromInput||st.lgo;st.lgo=false;if(go)st.lopenLi=+parts[1];listLocs2(go);}
 else if(v==='trainers'){setTab('t');listTrainers();}
 else if(v==='tr'){setTab('t');trainerDetail(decodeURIComponent(parts[1]));}
 else if(v==='items'){setTab('i');listItems();}
 else if(v==='walk'){setTab('w');listWalk();}
 else if(v==='calc'){setTab('c');calcPage();}
 else{setTab('p');filtersPokemon();listPokemon();if(!fromInput&&st.view!==''&&st.listScroll){cvApply(st.listScroll.z);toAnchor(st.listScroll);}}
 q.placeholder=v==='walk'?'Search walkthrough':v==='trainers'||v==='tr'?'Search trainers':v==='items'?'Search items':v==='locs'||v==='l'?'Search locations':'Search, or add filters';
 st.view=v;jumpState();}
// Back and forward put each page back where it was (the browser's own restore would use a raw scrollY, which lands
// wrong with estimated heights). The anchor is also saved (LS.pos) for Dex Viewer, which calls dexViewer.restoreScroll
// after reopening the guide (screen swap, reboot) instead of setting a raw scrollY.
try{history.scrollRestoration='manual'}catch(e){}
const SNAP={};let curKey=null;
const entryKey=()=>{let k=history.state&&history.state.dk;if(!k){k=Date.now()+'.'+Math.random().toString(36).slice(2,6);try{history.replaceState({dk:k},'')}catch(e){}}return k;};
// A Pokémon, move, ability or place page is named beside its route (n), and so is the anchor's link (an): when an
// update moves one, the route and anchor follow the name (a gone page: the Pokémon list; a gone anchor: none).
const RLIST={m:M,a:AB,l:LOC},hrefOf=a=>(/href="([^"]*)"/.exec(a&&a.sel||'')||[])[1];
const routeName=h=>{const m=/^#\/([pmal])\/([^/]*)$/.exec(h||'');if(!m)return;const v=decodeURIComponent(m[2]);return m[1]==='p'?(byId[v]?spOut(v):undefined):nameOf(RLIST[m[1]],+v);};
const routeOf=(h,n)=>{const m=/^#\/([pmal])\//.exec(h);if(m[1]==='p'){const id=spIn(n);return id==null?null:'#/p/'+id;}const i=idxOf(RLIST[m[1]],n);return i==null?null:'#/'+m[1]+'/'+i;};
try{const c=JSON.parse(localStorage.getItem(LS.pos)||'null');let moved=false;
 if(c&&c.n!=null&&routeName(c.h)!==c.n){const h=routeOf(c.h,c.n);if(h)c.h=h;else{c.h='#/';delete c.a;}moved=true;}
 const ah=c&&c.an!=null&&hrefOf(c.a);if(ah&&routeName(ah)!==c.an){const h=routeOf(ah,c.an);if(h)c.a.sel=c.a.sel.replace('href="'+ah+'"','href="'+h+'"');else delete c.a;moved=true;}
 if(moved)localStorage.setItem(LS.pos,JSON.stringify(c));}catch(e){}
const posSave=()=>{try{const a=keepAnchor(),h=location.hash;localStorage.setItem(LS.pos,JSON.stringify({h,a,n:routeName(h),an:routeName(hrefOf(a))}))}catch(e){}};
let posT=0;window.addEventListener('scroll',()=>{clearTimeout(posT);posT=setTimeout(posSave,300);},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)posSave();});
window.dexViewer={restoreScroll(y){let c=null;try{c=JSON.parse(localStorage.getItem(LS.pos)||'null')}catch(e){}
 if(c&&c.h===location.hash&&c.a&&c.a.sel&&app.querySelector(c.a.sel))toAnchor(c.a);else window.scrollTo(0,y);}};
window.addEventListener('hashchange',()=>{const typed=searchNav;searchNav=false;if(!typed){SR.close();KB.close(true);}if(curKey)SNAP[curKey]={a:keepAnchor(),z:cvSizes()};
 st.lgo=typed;render(typed);curKey=entryKey();if(typed){if(!/^#\/l\//.test(location.hash))window.scrollTo(0,0);return;}const sn=SNAP[curKey];if(sn){if(landEnd)landEnd();cvApply(sn.z);toAnchor(sn.a);}
 if(SR.after){const f=SR.after;SR.after=null;f();}});
// Opened without a route (the viewer always loads the bare file): go back to the page it was on.
if(!location.hash||location.hash==='#'){try{const c=JSON.parse(localStorage.getItem(LS.pos)||'null');if(c&&/^#\/[\w\/%.-]*$/.test(c.h))history.replaceState(null,'',c.h);}catch(e){}}
render(false);curKey=entryKey();
app.insertAdjacentHTML('afterend',`<div class="foot">${esc(CF.name)} offline dex · ${P.length} Pokémon and forms (${P.filter(p=>p.g===0).length} obtainable) · ${MV.filter(m=>m.h.length).length} changed moves · ${TRS.length} ${CF.trw[2]} · built ${D.built}${CF.credit?` · ${CF.credit}`:''}</div>`);

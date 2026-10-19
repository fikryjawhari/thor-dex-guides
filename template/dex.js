// ===== APP START. Shared template (thor-dex-guides/template/dex.js). Data + sprites are parsed from the JSON script
// tags above; each hack's rules and schema are in hacks/<hack>/notes.md in the guides repo.
const D=JSON.parse(document.getElementById('data').textContent);
const SPR=JSON.parse(document.getElementById('spr').textContent);
// Per-hack settings from hacks/<hack>/hack.json (assemble.py puts them in D.cfg): names, storage keys, wording.
const CF=D.cfg,LS=CF.ls,TX=CF.txt;
const M=D.M,MV=D.MV,AB=D.AB,P=D.P,LOC=D.LOC,byId={};P.forEach((p,i)=>{p.tu=p.tu||[];p.i=i;p.bst=p.s.reduce((a,b)=>a+b,0);p.name=p.n;p.key=(p.n+' '+p.dex).toLowerCase();byId[p.id]=p;});
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
// Features show only when the hack's data has them: tutor moves, vanilla comparison, EVs (CF.evs), starter picker (CF.starter).
const HASTU=P.some(p=>p.tu.length),HASVC=P.some(p=>p.vc),EVS=CF.evs!==false,PICK=CF.starter==='pick';
function tag(p){let r='';if(p.g===1)r+='<span class="tag">Mega</span>';if(p.fc)r+='<span class="tag">Form change</span>';else if(p.g===3||p.nu)r+=CF.g3trainer||TRUSE&&TRUSE[p.id]?'<span class="tag">Trainer only</span>':'<span class="tag">Not found</span>';if(p.g===0&&!p.w.length&&!p.fc)r+='<span class="tag">evo/breed</span>';return r;}
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
try{const s=JSON.parse(localStorage.getItem(LS.dex)||'{}');['f','sort','av'].forEach(k=>{if(s[k]!=null)st[k]=s[k];});}catch(e){}
if(st.sort==='bst')st.sort='dex';if(st.av==='chg'&&!HASVC)st.av='all';
const save=()=>{try{localStorage.setItem(LS.dex,JSON.stringify({f:st.f,sort:st.sort,av:st.av}))}catch(e){}};
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
// The search box as a button with value/placeholder properties, so the code below uses it like the <input>.
function searchDisp(inp){const b=document.createElement('button');b.type='button';b.id='q';b.className='disp';b.setAttribute('aria-label','Search');
 b.innerHTML='<span class="tx"></span><span class="x" aria-label="Clear search">×</span>';let val='',ph=inp.placeholder||'';
 const show=()=>{const t=b.firstChild;t.textContent=val;t.dataset.ph=ph;b.classList.toggle('has',!!val);if(KB.o&&KB.o.disp)KB.buf=val;};
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
  done:v=>{const n=parseInt(v);if(!isNaN(n))setNum(b,clampNum(b,n));},onClose:()=>b.classList.remove('open')});});
// Encounter "Other…": the letters keyboard with matching Pokemon in a strip above the keys.
function otherKb(a){const A=AR[a];const res=x=>{const n=norm(x);return n.length<2?[]:P.filter(p=>p.g===0&&(p.nk??=norm(p.n)).includes(n)).slice(0,12);};
 KB.open({mode:'abc',value:'',label:A?A.n:'Name',strip:x=>{const r=res(x);return r.length?r.map(p=>`<button type="button" class="kpick" data-id="${esc(p.id)}">${spr(p.id,'s32')}<span>${esc(p.name)}</span></button>`).join('')
   :`<span class="mut small">${norm(x).length<2?'Type a Pokémon name':'No match'}</span>`;},
  pick:id=>{TK.e[a]={p:id};tkSave();KB.close();rerender();},onClose(quiet){if(!quiet&&!this.picked)rerender();}});}
const app=document.getElementById('app'),q=INV?searchDisp(document.getElementById('q')):document.getElementById('q'),fil=document.getElementById('filters'),sug=document.getElementById('sugg');
// Typing on a page with no list (Pokemon, move, ability or trainer page) goes to its section's list as a new history
// entry, so the results show and Back returns to the page. The keyboard stays open (see hashchange).
const UP={p:'#/',m:'#/',a:'#/',tr:'#/trainers'};let searchNav=false;
q.addEventListener('input',()=>{st.q=q.value.trim().toLowerCase();if(st.q&&UP[st.view]){searchNav=true;location.hash=UP[st.view];return;}render(true);});
q.addEventListener('keydown',e=>{if(e.key==='Enter'){q.blur();sug.style.display='none';}});
function setTab(t){['p','l','t','i','w','c'].forEach(x=>document.getElementById('t-'+x).classList.toggle('on',x===t));}
// ===== POKEMON TAB: chip filters (type / ability / move / location) with typed suggestions
const FL={type:'Type',ab:'Ability',mv:'Move',loc:'Found at'};
const fval=f=>f.k==='mv'?M[f.v]:f.k==='loc'?LOC[f.v]:f.k==='ab'?AB[f.v][0]:f.v;
function suggestions(){const s=st.q;if(s.length<2||INV){sug.style.display='none';return;}
 const has=(k,v)=>st.f.some(f=>f.k===k&&f.v===v);const out=[];
 types.filter(t=>t.toLowerCase().startsWith(s)&&!has('type',t)).forEach(t=>out.push({k:'type',v:t}));
 AB.map((a,i)=>i).filter(i=>abUsers[i]&&AB[i][0].toLowerCase().includes(s)&&!has('ab',i)).slice(0,5).forEach(i=>out.push({k:'ab',v:i}));
 usedMoves.filter(i=>M[i].toLowerCase().includes(s)&&!has('mv',i)).sort((a,b)=>M[a].toLowerCase().indexOf(s)-M[b].toLowerCase().indexOf(s)).slice(0,6).forEach(i=>out.push({k:'mv',v:i}));
 LOC.map((l,i)=>i).filter(i=>locs[i]&&LOC[i].toLowerCase().includes(s)&&!has('loc',i)).slice(0,4).forEach(i=>out.push({k:'loc',v:i}));
 if(!out.length){sug.style.display='none';return;}
 sug.innerHTML=out.map((o,j)=>`<div class="s" data-j="${j}"><span>${o.k==='type'?ty(o.v):esc(fval(o))}</span><span class="k">${FL[o.k]} filter</span></div>`).join('');sug.style.display='block';
 sug.querySelectorAll('.s').forEach(el=>el.onclick=()=>{st.f.push(out[+el.dataset.j]);save();q.value='';st.q='';sug.style.display='none';render(true);});}
function filtersPokemon(){fil.innerHTML=`<div class="chips">${st.f.map((f,j)=>`<span class="chip"><b>${FL[f.k]}</b>${f.k==='type'?ty(f.v):esc(fval(f))}<button data-j="${j}" aria-label="Remove">×</button></span>`).join('')}</div>
<div class="sorts"><select id="fs">${[['dex','Dex order'],['name','Name'],...SN.map((s,i)=>['s'+i,s])].map(([v,l])=>`<option value="${v}" ${st.sort===v?'selected':''}>${l}</option>`).join('')}</select>
<select id="fa">${[['all','All Pokémon'],['obt',TX.obt],['nomega','Hide Megas'],['nw',TX.nw],...HASVC?[['chg','Changed from vanilla']]:[]].map(([v,l])=>`<option value="${v}" ${st.av===v?'selected':''}>${l}</option>`).join('')}</select></div>`;
 fil.querySelectorAll('.chip button').forEach(b=>b.onclick=()=>{st.f.splice(+b.dataset.j,1);save();render(true);});
 fil.querySelector('#fs').onchange=e=>{st.sort=e.target.value;save();render(true)};
 fil.querySelector('#fa').onchange=e=>{st.av=e.target.value;save();render(true)};}
function howLearn(p,i){const r=[];p.lv.forEach(([l,m])=>{if(m===i)r.push(l?'Lv '+l:'Evo')});if(p.tm.includes(i))r.push('TM');if(p.tu.includes(i))r.push('Tutor');if(p.eg.includes(i))r.push('Egg');return r.join(', ');}
const avOk=p=>st.av==='all'||(st.av==='obt'&&p.g===0)||(st.av==='nomega'&&p.g!==1)||(st.av==='nw'&&(p.g===3||!!p.nu))||(st.av==='chg'&&!!p.vc);
function listPokemon(){const typeF=st.f.filter(f=>f.k==='type').map(f=>f.v),abF=st.f.filter(f=>f.k==='ab').map(f=>f.v),mvF=st.f.filter(f=>f.k==='mv').map(f=>f.v),locF=st.f.filter(f=>f.k==='loc').map(f=>f.v);
 const anyF=st.f.length>0,nq=norm(st.q);
 let a=P.filter(p=>avOk(p)&&typeF.every(t=>p.t.includes(t))&&abF.every(x=>p.as.has(x))&&mvF.every(i=>p.ms.has(i))&&locF.every(i=>p.ls.has(i))&&(!st.q||p.key.includes(st.q)||(nq&&(p.nk??=norm(p.n)).includes(nq))));
 const s=st.sort;if(s==='name')a=[...a].sort((x,y)=>x.name.localeCompare(y.name));else if(s[0]==='s'&&s!=='dex'){const k=+s.slice(1);a=[...a].sort((x,y)=>y.s[k]-x.s[k]);}
 const extra=p=>{let r=(s[0]==='s'&&s!=='dex')?SN[+s.slice(1)]+' '+p.s[+s.slice(1)]:'';if(mvF.length===1)r=esc(howLearn(p,mvF[0]))+(r?'<br>'+r:'');return r?`<span class="bst">${r}</span>`:'';};
 app.innerHTML=`<div class="mut small" style="margin-bottom:6px">${a.length} Pokémon${!anyF&&!st.q?'. Type in the search box to filter by type, ability, move or location.':''}</div><div class="list">${a.map(p=>`<a class="row" href="#/p/${p.id}">${spr(p.id,'s40')}<span class="rt"><span class="nm">${esc(p.name)}${tag(p)}</span><span>${p.t.map(ty).join('')}</span></span>${extra(p)}</a>`).join('')}</div>`;
 suggestions();}
// ===== POKEMON PAGE
function whereTable(p){let h='';
 if(p.g===1)h=p.nu?`<div class="mut">Mega form. ${p.stone?esc(p.stone)+' is':'Its stone is'} not obtainable in ${esc(CF.name)}; listed because trainers use it.</div>`:`<div class="mut">Mega form. ${p.stone?esc(p.stone)+': '+esc(p.sloc||''):CF.orbs&&(p.n.startsWith('Primal')||/Rayquaza/.test(p.n))?'Orb or move based (see Useful NPCs in Items).':'No stone location in the items sheet.'}</div>`;
 else if(p.fc){const b=P.find(x=>x.dex===p.dex&&!x.fc&&x.g!==1);h=`<div class="mut">Form change of ${b?plink(b.id):'its base form'} (held item, move or in battle), so it is available whenever ${b?esc(b.name):'the base form'} is.</div>`;}
 else if(p.g===3)h=`<div class="mut">${TX.g3}</div>`;
 else if(!p.w.length)h=`<div class="mut">No direct wild encounter. Obtained by evolving or breeding (see Evolution).</div>`;
 else h=`<table class="wh"><tr><th>Location</th><th>Method</th><th>Rate</th><th>Lv</th></tr>${[...p.w].sort((a,b)=>a[0]-b[0]).map(w=>`<tr><td><a href="#/l/${w[0]}">${esc(LOC[w[0]])}</a>${w[4]?`<div class="mut small">${esc(w[4])}</div>`:''}</td><td>${esc(w[1])}</td><td class="n">${esc(w[2])}</td><td class="n">${esc(w[3])}</td></tr>`).join('')}</table>`;
 if(p.hi&&p.hi.length)h+=`<div class="mut small" style="margin-top:6px">Wild held item${p.hi.length>1?'s':''}: ${p.hi.map(esc).join(', ')}</div>`;
 return h;}
function confBox(cf){return cf&&cf.length?`<div class="card conf"><h3>Sources disagree</h3><ul>${cf.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="mut small" style="margin-top:4px">${TX.conf}</div></div>`:'';}
function vanCard(p){const v=p.vc;if(!v)return '';const r=[];
 if(v.s){const ch=SN.map((n,i)=>v.s[i]!==p.s[i]?`${n} ${v.s[i]} → ${p.s[i]}`:null).filter(Boolean);if(ch.length)r.push('<b>Stats:</b> '+esc(ch.join(', ')));}
 if(v.t)r.push('<b>Type:</b> '+v.t.map(ty).join('')+' → '+p.t.map(ty).join(''));
 if(v.a)r.push('<b>Abilities:</b> '+esc(v.a.join(', '))+' → '+esc([...p.a,p.ha].filter(x=>x>=0).map(i=>AB[i][0]).join(', ')));
 return r.length?`<div class="card"><h3>Changes from vanilla</h3>${r.map(x=>`<div style="margin:4px 0">${x}</div>`).join('')}<div class="mut small">${TX.van}</div></div>`:'';}
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
function detail(id){const p=byId[id];if(!p){app.innerHTML='<p>Not found.</p>';return;}fil.innerHTML='';sug.style.display='none';
 const byName=a=>[...a].sort((x,y)=>M[x].localeCompare(M[y]));
 const tbl=(a,lv)=>a.length?`<table><tr>${lv?'<th>Lv</th>':''}${mhead}</tr>${a.map(x=>lv?`<tr><td class="n">${x[0]||'Evo'}</td>${mcells(x[1])}</tr>`:`<tr>${mcells(x)}</tr>`).join('')}</table>`:'<div class="mut">None</div>';
 const mv={lv:['Level-up',p.lv.length,()=>tbl(p.lv,true)],tm:['TM/HM',p.tm.length,()=>tbl(byName(p.tm))],...HASTU?{tu:['Tutor',p.tu.length,()=>tbl(byName(p.tu))]}:{},eg:['Egg',p.eg.length,()=>tbl(byName(p.eg))]};
 if(!mv[moveTab])moveTab='lv';
 app.innerHTML=`<a class="back" href="#/">‹ All Pokémon</a>
 <div class="card hero">${spr(p.id,'s112')}<div><h2>${esc(p.name)}${tag(p)}</h2>${p.dex?`<div class="mut small">#${p.dex}</div>`:''}<div style="margin-top:4px">${p.t.map(ty).join('')}</div></div></div>
 ${confBox(p.cf)}${vanCard(p)}
 <div class="card"><h3>Abilities</h3>${p.a.map(i=>`<div style="margin:4px 0">${abLine(i)}</div>`).join('')}${p.ha>=0?`<div style="margin:6px 0 0"><span class="mut small">Hidden</span> ${abLine(p.ha)}</div>`:''}</div>
 <div class="card"><h3>Base stats</h3>${p.s.map((v,i)=>`<div class="stat"><span class="mut">${SN[i]}</span><span class="v">${v}</span><span class="b"><i style="width:${Math.min(100,v/160*100)}%;background:${v<60?'#e05252':v<90?'#e0a030':v<120?'#5cb85c':'#3aa0d8'}"></i></span></div>`).join('')}</div>
 ${calcCard(p)}<div class="card"><h3>Type defences</h3>${defBlock(p)}</div>
 <div class="card"><h3>Where to find</h3>${whereTable(p)}</div>
 <div class="card"><h3>Evolution</h3>${evoBlock(p)}</div>
 ${usedByCard(p)}
 <div class="card"><h3>Moves</h3><div class="sub">${Object.entries(mv).map(([k,v])=>`<button data-k="${k}" class="${k===moveTab?'on':''}">${v[0]} (${v[1]})</button>`).join('')}</div><div id="mvb" style="overflow-x:auto">${mv[moveTab][2]()}</div></div>`;
 app.querySelectorAll('.sub button').forEach(b=>b.onclick=()=>{moveTab=b.dataset.k;app.querySelectorAll('.sub button').forEach(x=>x.classList.toggle('on',x===b));app.querySelector('#mvb').innerHTML=mv[moveTab][2]();});
 bindCalc(p);window.scrollTo(0,0);}
function calcState(p){let s=null;try{s=JSON.parse(localStorage.getItem(LS.calc+':'+p.id)||'null')}catch(e){}if(!s){let l=50;try{l=+(localStorage.getItem(LS.calc+':lastlv')||50)}catch(e){}s={l,n:'Hardy',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]};}return s;}
function calcCard(p){const s=calcState(p);return `<div class="card calc"><h3>Stat calculator</h3>
 <div class="bar" style="margin:0 0 8px"><span class="mut small">Level ${numBox('id="c-l"',s.l,{min:1,max:100,steppers:true,label:'Level'})}</span><select id="c-n">${NATS.map(n=>`<option value="${n}" ${n===s.n?'selected':''}>${natLabel(n)}</option>`).join('')}</select></div>
 <div style="overflow-x:auto"><table><tr><th></th>${SN.map(n=>`<th>${n}</th>`).join('')}</tr>
 <tr><th>IV</th>${SN.map((n,i)=>`<td>${numBox(`data-iv="${i}"`,s.iv[i],{min:0,max:31,label:'IV '+n})}</td>`).join('')}</tr>
 ${EVS?`<tr><th>EV</th>${SN.map((n,i)=>`<td>${numBox(`data-ev="${i}"`,s.ev[i],{min:0,max:252,step:4,label:'EV '+n})}</td>`).join('')}</tr>`:''}
 <tr><th>Stat</th>${SN.map((n,i)=>`<td class="res" id="c-r${i}"></td>`).join('')}</tr></table></div>
 ${EVS?'':`<div class="mut small" style="margin-top:6px">${TX.noev}</div>`}<div class="mut small" style="margin-top:8px">Speed by level (rare candy planning)</div><div class="lvrow" id="c-lv"></div></div>`;}
function bindCalc(p){const g=id=>app.querySelector(id);if(!g('#c-l'))return;
 const upd=()=>{const s={l:Math.max(1,Math.min(100,parseInt(g('#c-l').value)||1)),n:g('#c-n').value,iv:[...app.querySelectorAll('[data-iv]')].map(e=>Math.max(0,Math.min(31,parseInt(e.value)||0))),ev:EVS?[...app.querySelectorAll('[data-ev]')].map(e=>Math.max(0,Math.min(252,parseInt(e.value)||0))):[0,0,0,0,0,0]};
  SN.forEach((n,i)=>{g('#c-r'+i).textContent=stat(p.s[i],i,s.iv[i],s.ev[i],s.l,s.n);});
  const lv=[];for(let L=Math.max(1,s.l-2);L<=Math.min(100,s.l+6);L++)lv.push(`<span class="${L===s.l?'cur':''}">Lv ${L}: <b>${stat(p.s[5],5,s.iv[5],s.ev[5],L,s.n)}</b></span>`);g('#c-lv').innerHTML=lv.join('');
  try{localStorage.setItem(LS.calc+':'+p.id,JSON.stringify(s));localStorage.setItem(LS.calc+':lastlv',s.l);}catch(e){}};
 app.querySelectorAll('.calc input,.calc select,.calc .nv').forEach(e=>e.addEventListener('input',upd));upd();}
// ===== MOVE PAGE
function moveDetail(i){fil.innerHTML='';sug.style.display='none';const v=MV[i]||{};const r=(learn[i]||[]);const tms=(D.IT||[]).filter(s=>s.k==='tm').flatMap(s=>s.r.filter(x=>x[2]===i).map(x=>[s.n==='Move Tutors'?'Tutor':x[0].split(' ')[0],x[1]]));
 const order={Evo:0,Lv:0,TM:1,Tutor:2,Egg:3};r.sort((a,b)=>(order[a[1].split(' ')[0]]-order[b[1].split(' ')[0]])||a[0].i-b[0].i);
 app.innerHTML=`<a class="back" href="javascript:history.back()">‹ Back</a>
 <div class="card"><h2 style="margin:0 0 6px">${esc(M[i])}${v.x?` <span class="tag">${CF.orig} original</span>`:''}</h2><div>${v.t?ty(v.t):''} ${cat(v.c)}</div>
 <table style="margin-top:8px"><tr><th>Power</th><th>Accuracy</th><th>PP</th><th>Priority</th></tr><tr><td class="n">${v.bp??'-'}</td><td class="n">${v.ac!=null?v.ac+'%':'Never misses'}</td><td class="n">${v.pp??'-'}</td><td class="n">${v.pr>0?'+'+v.pr:v.pr||0}</td></tr></table>
 ${v.d?`<p style="margin:8px 0 0">${esc(v.d)}</p>`:''}${tms.map(t=>`<div style="margin-top:6px"><b>${esc(t[0])}:</b> ${esc(t[1])}</div>`).join('')}${v.f&&v.f.length?`<div class="mut small" style="margin-top:4px">Flags: ${v.f.map(esc).join(', ')}</div>`:''}
 ${v.e?`<div style="margin-top:8px"><b style="color:var(--acc)">${TX.chdoc}</b><div>${esc(v.e).replace(/\n/g,'<br>')}</div></div>`:''}
 ${v.h&&v.h.length?`<div style="margin-top:8px"><b style="color:var(--acc)">${TX.mvh}</b><ul>${v.h.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${v.dc||!TX.nodc?'':`<div class="mut small">${TX.nodc}</div>`}</div>`:''}${v.cf?confBox(v.cf):''}
 <div class="mut small" style="margin-top:8px">${TX.mvsrc}${v.x&&TX.mvsrcx?TX.mvsrcx:''}.</div></div>
 <div class="card"><h3>Learned by (${r.length})</h3><table>${r.map(([p,h])=>`<tr><td style="width:44px">${spr(p.id,'s40')}</td><td>${plink(p.id)}${tag(p)}<div>${p.t.map(ty).join('')}</div></td><td class="n">${h}</td></tr>`).join('')}</table>
 <div style="margin-top:8px"><a href="#/" onclick="st.f=[{k:'mv',v:${i}}];save();">Show in Pokémon list as a filter ›</a></div></div>`;window.scrollTo(0,0);}
// ===== ABILITY PAGE
function abilityDetail(i){fil.innerHTML='';sug.style.display='none';const a=AB[i];if(!a){app.innerHTML='<p>Not found.</p>';return;}const us=abUsers[i]||[];
 app.innerHTML=`<a class="back" href="javascript:history.back()">‹ Back</a>
 <div class="card"><h2 style="margin:0 0 6px">${esc(a[0])}${a[2]?` <span class="tag">${CF.orig} original</span>`:''}</h2><p style="margin:0">${esc(a[1]||'No description.')}</p>${a[3]?`<div style="margin-top:8px"><b style="color:var(--acc)">${TX.chdoc}</b><div>${esc(a[3])}</div></div>`:''}${TX.absrc?`<div class="mut small" style="margin-top:6px">${TX.absrc}</div>`:''}</div>
 <div class="card"><h3>Pokémon with it (${us.length})</h3><table>${us.map(p=>`<tr><td style="width:44px">${spr(p.id,'s40')}</td><td>${plink(p.id)}${tag(p)}<div>${p.t.map(ty).join('')}</div></td><td class="n">${p.ha===i?'Hidden':''}</td></tr>`).join('')}</table>
 <div style="margin-top:8px"><a href="#/" onclick="st.f=[{k:'ab',v:${i}}];save();">Show in Pokémon list as a filter ›</a></div></div>`;window.scrollTo(0,0);}

// ===== LOCATIONS + ENCOUNTER TRACKER (state in localStorage LS.track {s starter, e:{area:{p}|{f}}, t:{trade}}; see hacks/<hack>/notes.md)
// FAM = evolution family via union-find over evolution links (dupes clause); Megas and form changes join their base.
const AR=D.AR||[];const LOC2A={};AR.forEach((A,i)=>A.l.forEach(l=>LOC2A[l]=i));
const FAM={};(()=>{const par={};const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};P.forEach(p=>par[p.id]=p.id);
 P.forEach(p=>[...p.ef,...p.et].forEach(([x,id])=>{if(id&&par[id]!==undefined){const a=f(p.id),b=f(id);if(a!==b)par[a]=b;}}));
 P.forEach(p=>{if((p.g===1||p.fc)&&p.dex){const b=P.find(x=>x.dex===p.dex&&x.g!==1&&!x.fc);if(b){const a=f(p.id),c=f(b.id);if(a!==c)par[a]=c;}}});
 P.forEach(p=>FAM[p.id]=f(p.id));})();
const TK={s:'',e:{},t:{}};try{Object.assign(TK,JSON.parse(localStorage.getItem(LS.track)||'{}'));}catch(e){}
const tkSave=()=>{try{localStorage.setItem(LS.track,JSON.stringify(TK))}catch(e){}};
const caughtFams=(skip)=>{const s=new Set();for(const v of Object.values(TK.t||{})){if(v)s.add(FAM[v]||v);}for(const [a,e] of Object.entries(TK.e)){if(e&&e.p&&+a!==skip)s.add(FAM[e.p]||e.p);}return s;};
const areaSpecies=a=>{const seen=new Set(),out=[];(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]==='Trade')return;if(!seen.has(p.id)){seen.add(p.id);out.push(p);}}));return out;};
// CF.starter 'pick': a starter picker in the tracker bar decides some gifts, trades and the rival's team ("Starter: X" in
// notes, t.st on trainers). Otherwise the rival follows the type of the starter caught in tracker area 0.
const STARTERS=PICK?[...new Set(P.flatMap(p=>p.w.filter(w=>w[1]==='Starter choice').map(()=>p.name)))]:[];
const starterOk=txt=>{const m=String(txt||'').match(/Starter:\s*([A-Za-z ,]+?)\.?\s*$/);return !(m&&TK.s)||m[1].split(',').map(x=>x.trim()).includes(TK.s);};
function tradeHTML(a){const g={};(AR[a]?.l||[]).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]!=='Trade'||!starterOk(w[4]))return;(g[w[4]]=g[w[4]]||[]).push(p);}));
 return Object.entries(g).map(([n,ps])=>{const k=a+'|'+n;const cur=(TK.t||{})[k]||'';return `<div class="trk"><span class="mut small">Trade (${esc(n.replace(/^For /,'for '))})</span><select class="tk-trade" data-k="${esc(k)}"><option value="">Not traded</option>${ps.map(p=>`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`;}).join('');}
function adjRows(li,cf){const r=locs[li]||[];const by={};r.forEach(([p,w])=>{const m=w[1]||'Other';(by[m]=by[m]||{});const o=by[m][p.id]=by[m][p.id]||{p,r:0,rs:'',lv:new Set(),note:w[4]};const x=parseFloat(w[2]);if(!isNaN(x)&&/%/.test(w[2]))o.r+=x;else if(w[2])o.rs=w[2];if(w[3])o.lv.add(w[3]);});
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
 app.querySelectorAll('.tk-reset').forEach(b=>{if(b.dataset.b)return;b.dataset.b=1;b.onclick=()=>{if(confirm(PICK?'Clear every tracked encounter, trade and the starter choice?':'Clear every tracked encounter?')){TK.e={};TK.t={};TK.s='';tkSave();rerender();}};});
 app.querySelectorAll('.tk-export').forEach(b=>b.onclick=()=>{prompt('Copy this backup code:',JSON.stringify(TK));});
 app.querySelectorAll('.tk-import').forEach(b=>b.onclick=()=>{const t=prompt('Paste a backup code:');if(!t)return;try{const o=JSON.parse(t);TK.s=o.s||'';TK.e=o.e||{};TK.t=o.t||{};tkSave();rerender();}catch(e){alert('That code could not be read.');}});
 app.querySelectorAll('.tk-trade').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.t=TK.t||{};if(s.value)TK.t[s.dataset.k]=s.value;else delete TK.t[s.dataset.k];tkSave();rerender();};});
 app.querySelectorAll('.tk-starter').forEach(s=>{if(s.dataset.b)return;s.dataset.b=1;s.onchange=()=>{TK.s=s.value;tkSave();rerender();};});}
// Scroll anchor: the element nearest the top of the window, saved as a selector plus its offset, so a re-render can put it back.
const ANCH='.list>a.row,details.split[data-a],details.split[data-wo],details.split[data-gi],details.stopd[data-k],.trk[data-a],details.trd';
const anchorSel=e=>e.matches('a.row')?`a.row[href="${e.getAttribute('href')}"]`:e.matches('details.trd')?`details.trd[data-k="${e.dataset.k}"]`:
 e.matches('.trk')?`.trk[data-a="${e.dataset.a}"]`:e.matches('details.stopd')?`details.stopd[data-k="${e.dataset.k}"]`:
 `details.split[${['a','wo','gi'].map(k=>'data-'+k).find(k=>e.hasAttribute(k))}="${e.getAttribute(['a','wo','gi'].map(k=>'data-'+k).find(k=>e.hasAttribute(k)))}"]`;
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
function rerender(){const a=keepAnchor(),z=cvSizes();render(true);cvApply(z);toAnchor(a);}
function tkBar(){const n=Object.values(TK.e).filter(e=>e&&e.p).length+Object.values(TK.t||{}).filter(Boolean).length,f=Object.values(TK.e).filter(e=>e&&e.f).length;
 const cnt=`${n} caught · ${f} failed · dupes clause on whole evolution lines`;
 return `<div class="card tkbar">${PICK?`<div class="bar" style="margin:0"><span class="mut small">Starter</span><select class="tk-starter"><option value="">Not chosen (show all)</option>${STARTERS.map(s=>`<option ${TK.s===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
 <div class="mut small" style="margin-top:6px">${cnt}</div>`:`<div class="bar" style="margin:0"><span class="mut small">${cnt}</span></div>`}
 <div class="bar" style="margin:8px 0 0"><button class="btn tk-export">Export</button><button class="btn tk-import">Import</button><button class="btn danger tk-reset">Reset all</button></div></div>`;}
function encSummary(a){const e=TK.e[a];if(!e)return '';if(e.f)return '<span class="tag">failed</span>';const p=byId[e.p];return p?`<span class="tag got">${esc(p.name)}</span>`:'';}
function locBody(a){const A=AR[a];const cf=caughtFams(-1);let h=trackerHTML(a);if(A.note)h+=`<div class="trnote">${esc(A.note)}</div>`;
 A.l.forEach(li=>{const t=adjRows(li,cf);if(!t.length)return;if(A.l.length>1||LOC[li]!==A.n)h+=`<div class="sech">${esc(LOC[li])}</div>`;
  h+=t.map(([m,rows,allD,note])=>`<div class="card"><h3>${esc(m)}${allD?' <span class="mut small">(all dupes)</span>':''}</h3>${note?`<div class="mut small" style="margin:-4px 0 6px">${esc(note)}</div>`:''}<table class="enc">${rows.map(x=>`<tr class="${x.d?'dupe':''}"><td style="width:44px">${spr(x.p.id,'s40')}</td><td>${plink(x.p.id)}<div>${x.p.t.map(ty).join('')}</div>${x.note&&!note?`<div class="mut small">${esc(x.note)}</div>`:''}</td><td class="n">${esc(x.show)}${x.chg?'<div class="mut small">was '+(x.r?x.r+'%':esc(x.rs))+'</div>':''}</td><td class="n">${x.lv.size?'Lv '+esc([...x.lv].join(', ')):''}</td></tr>`).join('')}</table></div>`).join('');});
 return h;}
function listLocs2(scroll){fil.innerHTML='';sug.style.display='none';const s=st.q;st.lopen=st.lopen||{};const target=st.lopenArea;if(target!=null)st.lopen[target]=true;
 const list=AR.map((A,i)=>i).filter(i=>!s||AR[i].n.toLowerCase().includes(s)||AR[i].l.some(li=>LOC[li].toLowerCase().includes(s)||(locs[li]||[]).some(([p])=>p.key.includes(s))));
 app.innerHTML=tkBar()+`<div class="mut small" style="margin:6px 0">${list.length} ${TX.locs} Rates are recalculated for the dupes clause from your tracked encounters. Search matches places or Pokémon.</div>`+list.map(i=>`<details class="split" id="area-${i}" data-a="${i}" ${st.lopen[i]||s?'open':''}><summary>${esc(AR[i].n)} ${encSummary(i)}</summary><div class="body"></div></details>`).join('');
 app.querySelectorAll('details.split').forEach(d=>{const a=+d.dataset.a;const fill=()=>{const b=d.querySelector('.body');if(d.open&&!b.innerHTML){b.innerHTML=locBody(a);bindTrackers();}if(!s)st.lopen[a]=d.open;};d.addEventListener('toggle',fill);fill();});
 bindTrackers();st.lopenArea=null;
 if(scroll&&target!=null){const el=document.getElementById('area-'+target);if(el)requestAnimationFrame(()=>el.scrollIntoView());}}


// ===== ITEMS TAB (D.IT sections from the items xlsx; r = [item, text, link, missable?])
function itemRow(sec,r){const nm=sec.k==='tm'&&r[2]!=null?`<a href="#/m/${r[2]}">${esc(r[0])}</a>`:sec.k==='mega'&&r[2]?`<a href="#/p/${r[2]}">${esc(r[0])}</a>`:esc(r[0]);
 return `<tr><td>${nm}</td><td>${esc(r[1]).replace(/\n/g,'<br>')}${r[3]?'<span class="warn">MISSABLE</span>':''}</td></tr>`;}
function listItems(){fil.innerHTML='';sug.style.display='none';const s=st.q;const IT=D.IT||[];
 if(s){let n=0;const html=IT.map(sec=>{const rows=sec.r.filter(r=>(r[0]+' '+r[1]).toLowerCase().includes(s));n+=rows.length;return rows.length?`<div class="sech">${esc(sec.n)}</div><div class="card"><table class="itbl">${rows.map(r=>itemRow(sec,r)).join('')}</table></div>`:'';}).join('');
  app.innerHTML=`<div class="mut small" style="margin-bottom:6px">${n} matches. Search covers item names and locations.</div>`+html;return;}
 st.iopen=st.iopen||{};
 app.innerHTML=`<div class="mut small" style="margin-bottom:6px">${TX.items}</div>`+IT.map((sec,si)=>`<details class="split" data-si="${si}" ${st.iopen[si]?'open':''}><summary>${esc(sec.n)} <span class="mut small">${sec.r.length}</span></summary>${sec.note?`<div class="mut small" style="margin:6px 2px">${esc(sec.note)}</div>`:''}<div class="card"><table class="itbl">${sec.r.map(r=>itemRow(sec,r)).join('')}</table></div></details>`).join('');
 app.querySelectorAll('details.split').forEach(d=>d.addEventListener('toggle',()=>{st.iopen[+d.dataset.si]=d.open;}));}


// ===== COLLAPSIBLE PAGES (plans/split-ui.md). Pages built from details.split use these: header taps that never
// scroll, collapse bars at the bottom of blocks taller than the window, the rail's jump buttons (to details.split.jt),
// sticky stop and section headers (CSS, --hh and --sh) and the flash on a header you land on.
const hdr=document.querySelector('header'),html=document.documentElement,GAP=8;
// The search bar's height while it sticks (0 when it doesn't: very short windows), as --hh for the sticky headers.
const hdrH=()=>getComputedStyle(hdr).position==='sticky'?hdr.offsetHeight:0;
const T=()=>hdrH()+GAP;
new ResizeObserver(()=>html.style.setProperty('--hh',hdrH()+'px')).observe(hdr);
// Each stop carries its header's height (one or two lines) as --sh, so its section headers stick right under it.
const SHO=new ResizeObserver(es=>es.forEach(e=>e.target.parentElement.style.setProperty('--sh',e.target.offsetHeight+'px')));
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
// A collapse bar: a stop's or section's header is pinned at the top already, so it closes in place; a split closes and
// its header goes to the top. Both flash. (Animated versions were tried and rejected: plans/split-ui.md.)
function foldUp(d){const sm=d.querySelector(':scope>summary');
 if(!d.matches('details.split')&&sm.getBoundingClientRect().top>=hdrH()-1){flip(d,false);flash(sm);return;}
 noAnchor();d.open=false;bars();const y=sm.getBoundingClientRect().top-T();if(y<0)scrollBy(0,y);flash(sm);hold(sm);jumpState();}
// Expand all / Collapse all bars (.seg): open or close their list; the bar you pressed stays where it is.
function segAll(b,list){const open=b.dataset.a==='1',y=b.getBoundingClientRect().top;noAnchor();
 list.forEach(d=>d.open=open);bars();scrollBy(0,b.getBoundingClientRect().top-y);hold(b);jumpState();}
// Rail jump buttons: up = top of the split you're in, or the previous one when this one's header already sits at the
// top with the gap above it; down = the next split to that same spot, so up and down undo each other.
const RJ=document.querySelector('.rjump');
const jts=()=>[...app.querySelectorAll('details.split.jt')];
function jump(dir){const t=T(),sp=jts(),hs=sp.map(d=>d.getBoundingClientRect().top);let i;
 if(dir<0){i=-1;hs.forEach((y,j)=>{if(y<t-2)i=j;});if(i<0){scrollTo(0,0);jumpState();return;}}
 else{i=hs.findIndex(y=>y>t+2);if(i<0){scrollTo(0,html.scrollHeight);jumpState();return;}}
 scrollBy(0,hs[i]-t);flash(sp[i].querySelector(':scope>summary'));jumpState();}
function jumpState(){if(!RJ||RJ.hidden)return;const t=T(),atEnd=scrollY+innerHeight>=html.scrollHeight-1;
 RJ.querySelector('[data-j="-1"]').disabled=scrollY<=0;RJ.querySelector('[data-j="1"]').disabled=atEnd||!jts().some(d=>d.getBoundingClientRect().top>t+2);}
if(RJ){RJ.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>jump(+b.dataset.j));
 let raf=0;addEventListener('scroll',()=>{if(!raf&&!RJ.hidden)raf=requestAnimationFrame(()=>{raf=0;jumpState();});},{passive:true});}
const UPI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"/></svg>';
const segBar=cls=>`<div class="seg ${cls}"><button data-a="1">Expand all</button><button data-a="0">Collapse all</button></div>`;

// ===== WALKTHROUGH TAB (D.WK; state in localStorage LS.walk {c:{stepKey:1}, o:{splitIdx:1, gi:1 Guide info},
// x:{stopKey:0 closed, doc*:1 open}, s:{stopKey.c/e/i/t: 1 open, 0 closed}}; sections c checklist, e encounters,
// i items, t trainers; the checklist starts closed, the rest open). Layout and behaviour: plans/split-ui.md.
// Optional parts, each shown when the data has it: cheat codes (WK.cheats), checklist steps (stop.s), stop notes
// (stop.note), game docs (WK.docs, WK.ko), items with no place (WK.np).
const WO=(()=>{try{return Object.assign({c:{},o:{},x:{},s:{}},JSON.parse(localStorage.getItem(LS.walk)||'{}'))}catch(e){return {c:{},o:{},x:{},s:{}}}})();
const woSave=()=>{try{localStorage.setItem(LS.walk,JSON.stringify(WO))}catch(e){}};
const CHK=D.WK.splits.some(sp=>sp.st.some(s=>(s.s||[]).length));
const tkCounts=()=>[Object.values(TK.e).filter(e=>e&&e.p).length+Object.values(TK.t||{}).filter(Boolean).length,Object.values(TK.e).filter(e=>e&&e.f).length];
// Guide info: tracker and checklist tools, then the game docs (cheat codes and unplaced items count as docs), then the
// intro. Built when opened.
function guideInfoHTML(){const W=D.WK,[n,f]=tkCounts();
 const para=t=>esc(t).split(/\n\s*\n/).map(x=>/\S(?: {2,}|\t)\S/.test(x)?`<pre class="dpre">${x}</pre>`:`<p style="margin:6px 0">${x.replace(/\n/g,'<br>')}</p>`).join('');
 const doc=(k,n,body,cls='')=>`<details class="stopd" data-k="${k}" ${WO.x[k]===1?'open':''}><summary class="stoph">${n}</summary><div class="stop${cls}">${body}</div></details>`;
 const docs=(W.cheats?doc('doccheat','Cheat codes',`<div class="mut small" style="margin:6px 0">${esc(W.cnote)}</div><table class="itbl">${W.cheats.map(c=>`<tr><td><b>${esc(c[0])}</b>${c[1]?`<div class="mut small">or ${esc(c[1])}</div>`:''}</td><td>${esc(c[2])}${c[3]?' <span class="tag">toggle</span>':''}</td></tr>`).join('')}</table>`):'')+
  (W.docs||[]).map(([t,x],j)=>doc('doc'+j,esc(t),para(x),' small doc')).join('')+
  (W.ko?doc('docko','Post-KO switch-in AI',`<table class="itbl">${W.ko.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>${W.ko.note.map(x=>`<div class="mut small" style="margin-top:6px">${esc(x)}</div>`).join('')}`):'')+
  (W.np.length?doc('docnp',`Items with no walkthrough place <span class="mut small">${W.np.length}</span>`,`<table class="itbl wt">${W.np.map(i=>`<tr><td>${esc(i[1])}<div class="mut small">${esc(i[0])}</div></td><td>${esc(i[2])}</td></tr>`).join('')}</table>`):'');
 return `<div class="psec">Encounter tracker</div><div class="mut small">${n} caught · ${f} failed · dupes clause on whole evolution lines</div>`+
  `<div class="bar pbar"><button class="btn tk-export">Export</button><button class="btn tk-import">Import</button><button class="btn danger tk-reset">Reset all</button>${CHK?'<button class="btn danger wk-reset">Reset checklist</button>':''}</div>`+
  (docs?`<div class="psec">Game docs</div>`+docs:'')+`<div class="mut small" style="margin:12px 0 4px">${TX.walk}</div>`;}
// Next step: the first unticked checklist step, in walkthrough order.
function nextStep(){const W=D.WK;for(let si=0;si<W.splits.length;si++){const sp=W.splits[si];for(let ti=0;ti<sp.st.length;ti++){const s=sp.st[ti];for(let j=0;j<(s.s||[]).length;j++)if(!WO.c[si+'.'+ti+'.'+j])return {si,ti,j,s};}}return null;}
const nextInner=()=>{const n=nextStep();return n?`<b>Next step</b><span>${esc(n.s.n)} · ${esc(n.s.s[n.j][0])}</span>`:'<b>Checklist done</b>';};
// Starter picker: pick guides choose TK.s; slot guides (the rival follows the starter caught in tracker area 0) pick
// area 0's starter here, the same value as that area's tracker.
function starterRow(){let sel='';
 if(PICK)sel=`<select class="tk-starter"><option value="">Not chosen (show all)</option>${STARTERS.map(s=>`<option ${TK.s===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
 else if(CF.starter==='slot'&&AR[0]&&!AR[0].ns){const cur=(TK.e[0]||{}).p||'';const g=[];(AR[0].l).forEach(li=>(locs[li]||[]).forEach(([p,w])=>{if(w[1]==='Starter choice'&&!g.includes(p))g.push(p);}));
  sel=`<select class="wk-starter"><option value="">Not chosen</option>${(g.length?g:areaSpecies(0)).map(p=>`<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;}
 return sel?`<div class="card strow"><span class="mut small">Starter</span>${sel}</div>`:'';}
// Sections inside a stop, opened and closed from their yellow header; the header shows a summary.
const SECN={c:'Checklist',e:'Encounters',i:'Items',t:'Trainers'};
function walkSec(k,t,tags,body){const sk=k+'.'+t,v=WO.s[sk],open=v===undefined?t!=='c':!!v;
 return `<details class="sec" data-s="${sk}" ${open?'open':''}><summary><span class="sn">${SECN[t]}</span>${tags}</summary><div class="secb">${body}</div><button class="endbar sb" hidden>${UPI}<span>${SECN[t]}</span></button></details>`;}
function walkStop(s,si,ti,cf,shown){const k=si+'.'+ti;const closed=WO.x[k]===0;
 const ss=s.s||[],nd=ss.filter((x,j)=>WO.c[k+'.'+j]).length;
 const steps=ss.map((x,j)=>{const sk=k+'.'+j;const done=!!WO.c[sk];return `<label class="wstep ${done?'done':''}"><input type="checkbox" data-sk="${sk}" ${done?'checked':''}><span>${esc(x[0])}${x[1]?`<div class="mut small">${esc(x[1])}</div>`:''}</span></label>`;}).join('');
 const ts=(s.tr||[]).map(k=>TRK[k]).filter(t=>t&&!rivalHidden(t));
 // Encounters: one box per area with its own tracker; several areas get a short tag (the area name minus the stop's).
 const areas=[];s.a.forEach(ai=>{if(shown.has(ai))return;shown.add(ai);const A=AR[ai];const enc=A.l.flatMap(li=>adjRows(li,cf).map(r=>[li,r]));if(!enc.length&&A.ns)return;areas.push([ai,A,enc]);});
 const multi=areas.length>1;
 const enc=areas.map(([ai,A,enc])=>{const tag=multi?(A.n.startsWith(s.n+' ')?A.n.slice(s.n.length+1):A.n):'';
  return `<div class="area">${A.ns&&tag?`<span class="atag">${esc(tag)}</span>`:''}${trackerHTML(ai,tag)}${CF.walkAreaNote&&A.note?`<div class="trnote">${esc(A.note)}</div>`:''}`+enc.map(([li,[m,rows]])=>`<div class="encl"><span class="mut">${A.l.length>1||LOC[li]!==A.n?esc(LOC[li])+' · ':''}${esc(m)}:</span> ${rows.map(x=>`<span class="${x.d?'dupe':''}"><a href="#/p/${x.p.id}">${esc(x.p.name)}</a> ${esc(x.show)}</span>`).join(', ')}</div>`).join('')+'</div>';}).join('');
 const its=s.it.filter(i=>starterOk(i[2]));
 let h=`<details class="stopd" ${closed?'':'open'} data-k="${k}"><summary class="stoph">${esc(s.n)}${s.x?' <span class="mut small">(on the way)</span>':''}${s.a.map(encSummary).join('')}${ts.length?' <span class="tag">'+ts.length+' '+CF.trw[ts.length>1?1:0]+'</span>':''}</summary><div class="stop">`+
  (s.note?`<div class="trnote" style="margin:6px 0">${esc(s.note)}</div>`:'')+
  (ss.length?walkSec(k,'c',`<span class="tag${nd===ss.length?' got':''}">${nd}/${ss.length}</span>`,`<div class="chkb">${steps}</div>`):'')+
  (areas.length?walkSec(k,'e',areas.map(([ai])=>encSummary(ai)).join(''),enc):'')+
  (its.length?walkSec(k,'i',`<span class="tag">${its.length}</span>${its.some(i=>/miss permanently/i.test(i[2]))?'<span class="tag miss">MISSABLE</span>':''}`,`<table class="itbl wt">${its.map(i=>`<tr><td>${i[3]!=null&&(i[0]==='TMs'||i[0]==='HMs'||i[0]==='Move Tutors')?`<a href="#/m/${i[3]}">${esc(i[1])}</a>`:i[0]==='Mega Stones'&&i[3]?`<a href="#/p/${i[3]}">${esc(i[1])}</a>`:esc(i[1])}<div class="mut small">${esc(i[0])}</div></td><td>${esc(i[2])}${/miss permanently/i.test(i[2])?'<span class="warn">MISSABLE</span>':''}</td></tr>`).join('')}</table>`):'')+
  (ts.length?walkSec(k,'t',`<span class="tag">${ts.length}</span>`,walkTrainers(ts)):'');
 return h+`<button class="endbar st" hidden>${UPI}<span>Collapse ${esc(s.n)}</span></button></div></details>`;}
// What a walkthrough search matches: the stop's name, notes, steps, items, areas (and their Pokemon) and trainers.
const stopText=s=>s.tx??=(s.n+' '+(s.note?s.note+' ':'')+(s.s||[]).map(x=>x.join(' ')).join(' ')+' '+s.it.map(i=>i[1]+' '+i[2]).join(' ')+' '+s.a.map(ai=>AR[ai].n+' '+areaSpecies(ai).map(p=>p.name).join(' ')).join(' ')+' '+(s.tr||[]).map(k=>TRK[k]?TRK[k].key:'').join(' ')).toLowerCase();
function listWalk(){fil.innerHTML='';sug.style.display='none';const W=D.WK;const cf=caughtFams(-1);const shown=new Set();const q=st.q;
 if(q){const hits=[];W.splits.forEach((sp,si)=>sp.st.forEach((s,ti)=>{if(stopText(s).includes(q))hits.push([si,ti]);}));
  app.innerHTML=`<div class="mut small" style="margin-bottom:6px">${hits.length} stops match.</div>`+hits.map(([si,ti])=>`<div class="sech">${esc(W.splits[si].n)}</div>`+walkStop(W.splits[si].st[ti],si,ti,cf,shown)).join('');bindWalk();return;}
 const [n,f]=tkCounts();
 // Top: Guide info, Next step, Starter, then Expand / Collapse all for the splits.
 app.innerHTML=`<div class="wtool"><details class="split" data-wo="gi" ${WO.o.gi?'open':''}><summary>Guide info <span class="mut small">${n} caught · ${f} failed</span></summary><div class="body pbody" data-gi="1"></div></details>`+
  (CHK?`<button class="resume wk-next">${nextInner()}</button>`:'')+starterRow()+segBar('wk-all')+`</div>`+
  W.splits.map((sp,si)=>{const all=sp.st.flatMap((s,ti)=>(s.s||[]).map((x,j)=>si+'.'+ti+'.'+j));const done=all.filter(k=>WO.c[k]).length;
   return `<details class="split jt" data-wo="${si}" ${WO.o[si]?'open':''}><summary>${esc(sp.n)} ${CHK?`<span class="tag ${done===all.length&&all.length?'got':''}">${done}/${all.length}</span>`:`<span class="mut small">${sp.st.length} stop${sp.st.length===1?'':'s'}</span>`}</summary>${sp.note?`<div class="trnote" style="margin:8px 2px">${esc(sp.note)}</div>`:''}<div class="body" data-si="${si}"></div></details>`;}).join('');
 app.querySelectorAll('details.split[data-wo]').forEach(d=>{const fill=()=>{const b=d.querySelector('.body');if(b&&d.open&&!b.innerHTML){if(b.dataset.gi){b.innerHTML=guideInfoHTML();bindWalk();return;}const si=+b.dataset.si;
   b.innerHTML=segBar('wk-sp')+W.splits[si].st.map((s,ti)=>walkStop(s,si,ti,cf,shown)).join('')+`<button class="endbar sp" hidden>${UPI}<span>Collapse ${esc(W.splits[si].n)}</span></button>`;bindWalk();}};
  d.addEventListener('toggle',()=>{if(d.open)WO.o[d.dataset.wo]=1;else delete WO.o[d.dataset.wo];woSave();fill();barsSoon();});fill();});
 const ws=app.querySelector('.wk-starter');if(ws)ws.onchange=()=>{if(ws.value)TK.e[0]={p:ws.value};else delete TK.e[0];tkSave();rerender();};
 bindWalk();bars();}
function bindWalk(){bindTrackers();bindTrd();app.querySelectorAll('.wstep input').forEach(c=>{if(c.dataset.b)return;c.dataset.b=1;c.onchange=()=>{if(c.checked)WO.c[c.dataset.sk]=1;else delete WO.c[c.dataset.sk];woSave();c.closest('.wstep').classList.toggle('done',c.checked);
  const tag=d=>{if(!d)return;const all=[...d.querySelectorAll('.wstep input')],n=all.filter(x=>x.checked).length,t=d.querySelector(':scope>summary .tag');if(t){t.textContent=n+'/'+all.length;t.classList.toggle('got',n===all.length);}};
  tag(c.closest('details.sec'));tag(c.closest('details.split'));const nx=app.querySelector('.wk-next');if(nx)nx.innerHTML=nextInner();};});
 app.querySelectorAll('details.stopd').forEach(d=>{if(d.dataset.bd)return;d.dataset.bd=1;SHO.observe(d.querySelector(':scope>summary'));d.addEventListener('toggle',()=>{const k=d.dataset.k;if(/^doc/.test(k)){if(d.open)WO.x[k]=1;else delete WO.x[k];}else if(d.open)delete WO.x[k];else WO.x[k]=0;woSave();barsSoon();});});
 app.querySelectorAll('details.sec').forEach(d=>{if(d.dataset.bd)return;d.dataset.bd=1;d.addEventListener('toggle',()=>{WO.s[d.dataset.s]=d.open?1:0;woSave();barsSoon();});});
 const r=app.querySelector('.wk-reset');if(r&&!r.dataset.b){r.dataset.b=1;r.onclick=()=>{if(confirm('Clear every walkthrough checkbox?')){WO.c={};woSave();rerender();}};}
 barsSoon();}
// Taps on the walkthrough: header taps (flip), the expand / collapse bars, collapse bars and Next step.
app.addEventListener('click',e=>{if(document.body.dataset.v!=='walk')return;
 const b=e.target.closest('.seg button');
 if(b){segAll(b,b.closest('.wk-all')?app.querySelectorAll('details.split.jt'):b.closest('.body').querySelectorAll(':scope>details.stopd'));return;}
 const end=e.target.closest('.endbar');if(end){foldUp(end.closest('details'));return;}
 if(e.target.closest('.wk-next')){const n=nextStep();if(!n)return;const k=n.si+'.'+n.ti;WO.o[n.si]=1;delete WO.x[k];WO.s[k+'.c']=1;woSave();render(true);
  const inp=app.querySelector(`.wstep input[data-sk="${k}.${n.j}"]`);if(!inp)return;const l=inp.closest('.wstep'),stop=l.closest('details.stopd'),sec=l.closest('details.sec');
  noAnchor();scrollBy(0,l.getBoundingClientRect().top-(T()+stop.querySelector(':scope>summary').offsetHeight+sec.querySelector(':scope>summary').offsetHeight));flash(l);hold(l);jumpState();return;}
 const sm=e.target.closest('summary');
 if(sm&&sm.parentElement.tagName==='DETAILS'&&app.contains(sm)&&!e.target.closest('a,select,input,button')){e.preventDefault();flip(sm.parentElement,!sm.parentElement.open);}});
// ===== TRAINERS TAB (D.TR, see notes). Speeds use each Pokemon's real IVs and nature; with EVs (CF.evs), on or off
// via the Minimal Grinding Mode switch (LS.mgm). Relative levels (r:-1) use the trainer's level cap, which can be
// overridden per trainer (LS.cap; CF.capLast also remembers the last one set, for trainers with no cap).
// Rival teams (t.st) follow the starter: its type from tracker area 0, or its name from the picker (CF.starter 'pick').
const TRD=D.TR||{g:[],caps:[]};const TRS=[];const TRK={};
TRD.g.forEach((g,gi)=>g.sec.forEach((s,si)=>s.tr.forEach(t=>{t.g=g.n;t.h=s.h;t.tab=g.tab;
 t.key=(t.n+' '+t.loc+' '+t.tags.join(' ')+' '+g.n+' '+s.h+' '+t.p.map(x=>byId[x.id]?byId[x.id].name:'').join(' ')+' '+(t.st?t.st+' starter':'')).toLowerCase();TRS.push(t);TRK[t.k]=t;})));
const TRUSE={};TRS.forEach(t=>t.p.forEach(x=>{(TRUSE[x.id]=TRUSE[x.id]||[]).includes(t)||TRUSE[x.id].push(t);}));
let TCAP={};try{TCAP=JSON.parse(localStorage.getItem(LS.cap)||'{}')}catch(e){}
let MGM=false;try{MGM=EVS&&localStorage.getItem(LS.mgm)==='1'}catch(e){}
const capOf=t=>+TCAP[t.k]||t.cap||(CF.capLast&&+TCAP._last)||0;
const starterType=()=>{if(PICK)return TK.s;const e=TK.e&&TK.e[0];const p=e&&e.p&&byId[e.p];return p?(p.t.find(x=>['Grass','Fire','Water'].includes(x))||''):'';};
const rivalHidden=t=>{const s=starterType();return !!(t.st&&s&&t.st!==s);};
const PRE={Burned:'BRN',Poisoned:'PSN',Frostbitten:'FRB',Burn:'BRN',Poison:'PSN',Frostbite:'FRB'};
const evTxt=ev=>ev.map((v,i)=>v?v+' '+SN[i]:'').filter(Boolean).join(' / ');
function monCard(x,cap){const p=byId[x.id];const lv=x.l!=null?x.l:x.r!=null&&cap?cap+x.r:NaN;
 const sp=e=>p&&lv?stat(p.s[5],5,x.iv[5],e,lv,x.na):null;const s0=sp(0),s1=EVS?sp(x.ev[5]):s0;
 const main=MGM?s0:s1,alt=MGM?s1:s0;
 const spd=main==null?'':`<div class="spd">Spe <b>${main}</b>${x.ia?'<span class="mut" title="IVs assumed 31">*</span>':''}${alt!==main?` <span class="mut small">${MGM?'with EVs':'no EVs'} ${alt}</span>`:''}${x.t0?` <span class="mut small">0 IV ${stat(p.s[5],5,0,0,lv,x.na)}</span>`:''}${/choice scarf/i.test(x.i)?` <span class="mut small">Scarf ${Math.floor(main*1.5)}</span>`:''}</div>`;
 const lvs=x.l!=null||x.r==null?`Lv ${x.l??'?'}`:`Lv ${lv||'?'} <span class="mut small">cap${x.r?(x.r>0?'+':'−')+Math.abs(x.r):''}</span>`;
 const tags=(x.ld?`<span class="tag">Lead ${x.ld}</span>`:'')+(x.pre||[]).map(z=>`<span class="tag warnb">${esc(PRE[z]||z)}</span>`).join('')+(x.src==='s'?'<span class="tag">sheet only</span>':'');
 const ab=x.ao?esc(x.ao):(x.a0!=null&&x.a0>=0?alink(x.a0)+' → ':'')+(x.a>=0?alink(x.a):'');
 const iv=x.iv.every(v=>v===31)?'':`<div class="mut small">IVs ${x.iv.join('/')}</div>`;const ev=EVS&&x.ev?evTxt(x.ev):'';
 return `<div class="mon"><div class="top">${spr(x.id,'s32')}<div><div>${p?`<a href="#/p/${x.id}">${esc(p.name)}</a>`:esc(x.s||'?')} <b>${lvs}</b></div></div></div><div style="margin-top:3px">${p?p.t.map(ty).join(''):''}${tags}</div>${spd}
 <div class="small" style="margin-top:3px">${ab}${x.i?' · '+esc(x.i):''}${x.na?` · <span title="${esc(natLabel(x.na))}">${esc(x.na)}</span>`:''}</div>
 <div class="mv">${x.m.map(i=>`<a href="#/m/${i}"><span class="dot" style="background:${tcol(M[i]==='Hidden Power'&&x.hp?x.hp:(MV[i]||{}).t)}"></span>${M[i]==='Hidden Power'&&x.hp?'HP '+esc(x.hp):esc(M[i])}</a>`).join('')}</div>
 ${ev?`<div class="mut small" style="margin-top:3px">EVs ${ev}</div>`:''}${iv}${(x.x||[]).length?`<div class="mut small">Sheet: ${x.x.map(esc).join('; ')}</div>`:''}
 ${(x.cf||[]).length?`<div class="cfx">Sheet says ${x.cf.map(esc).join('; ')}</div>`:''}</div>`;}
function trainerBlock(t,mini){const rel=t.p.some(x=>x.l==null);const cap=capOf(t);const own=TCAP[t.k]!=null;
 return `<div class="card trc" id="tr-${t.k}"><div class="trn">${mini?'':`<a href="#/tr/${t.k}">`}${esc(t.n)}${mini?'':'</a>'} <span class="mut small">${esc(t.loc)}</span></div>
 <div style="margin:-2px 0 6px">${t.st?`<span class="tag">If your starter is ${esc(t.st)}</span>`:''}${t.tags.map(z=>`<span class="tag">${esc(z)}</span>`).join('')}</div>
 ${(t.note||[]).length?`<div class="trnote">${t.note.map(esc).join('<br>')}</div>`:''}
 ${t.rw?`<div class="trnote"><b>Rewards:</b> ${t.rw.map(esc).join(', ')}</div>`:''}
 ${rel?`<div class="trk"><span class="mut small">${TX.capl}</span>${INV?numBox(`data-k="${t.k}"`,cap||'',{min:1,max:100,steppers:true,label:TX.capl}).replace('class="nv"','class="nv capin"'):`<input class="capin" type="number" inputmode="numeric" min="1" max="100" style="width:72px" data-k="${t.k}" value="${cap||''}">`}<span class="mut small">${own&&t.cap?`<a href="#" class="capreset" data-k="${t.k}">reset to cap ${t.cap}</a>`:t.cap?`${TX.capw} ${t.cap}`:TX.capnone}</span></div>`:''}
 <div class="team">${t.p.map(x=>monCard(x,cap)).join('')}</div>
 ${t.pp?`<div class="mut small" style="margin-top:6px"><a href="${esc(t.pp)}" target="_blank" rel="noopener">Pokepaste</a> (online)</div>`:''}</div>`;}
function bindTrainers(root){(root||app).querySelectorAll('.capin').forEach(i=>{if(i.dataset.b)return;i.dataset.b=1;i.onchange=()=>{const v=+i.value;if(v>0&&v<=100){TCAP[i.dataset.k]=v;if(CF.capLast)TCAP._last=v;}else delete TCAP[i.dataset.k];try{localStorage.setItem(LS.cap,JSON.stringify(TCAP))}catch(e){}rerender();};});
 (root||app).querySelectorAll('.capreset').forEach(a=>{if(a.dataset.b)return;a.dataset.b=1;a.onclick=e=>{e.preventDefault();delete TCAP[a.dataset.k];try{localStorage.setItem(LS.cap,JSON.stringify(TCAP))}catch(e){}rerender();};});}
let TOPEN={};try{TOPEN=JSON.parse(localStorage.getItem(LS.tr)||'{}')}catch(e){}
function trHead(){const s=starterType();return `<div class="card">${EVS?`<label class="row" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mgm" ${MGM?'checked':''}> <span>Minimal Grinding Mode <span class="mut small">(speeds without trainer EVs)</span></span></label>
 <div class="mut small" style="margin-top:6px">`:'<div class="mut small">'}${TX.trh.replace('{ev}',MGM?', no EVs':' and EVs')} ${s?TX.trs.replace('{s}',esc(s)):TX.trs0}</div>
 <details style="margin-top:6px"><summary class="mut small">Level caps</summary><table class="itbl">${TRD.caps.map(c=>`<tr><td>${esc(c[0])}</td><td>${c[1]}</td></tr>`).join('')}</table></details></div>`;}
function bindHead(){const m=app.querySelector('#mgm');if(m)m.onchange=()=>{MGM=m.checked;try{localStorage.setItem(LS.mgm,MGM?'1':'0')}catch(e){}rerender();};}
function listTrainers(){fil.innerHTML='';sug.style.display='none';const s=st.q;
 if(s){const a=TRS.filter(t=>t.key.includes(s)&&!rivalHidden(t));app.innerHTML=`<div class="mut small" style="margin-bottom:6px">${a.length} trainers match. Search covers trainer names, places, tags and Pokémon.</div>`+a.map(t=>`<div class="mut small" style="margin-top:10px">${esc(t.g)}${t.h?' · '+esc(t.h):''}</div>`+trainerBlock(t)).join('');bindTrainers();return;}
 app.innerHTML=trHead()+TRD.g.map((g,gi)=>{const n=g.sec.reduce((a,x)=>a+x.tr.filter(t=>!rivalHidden(t)).length,0);return `<details class="split" data-gi="${gi}" ${TOPEN[gi]?'open':''}><summary>${esc(g.n)} <span class="mut small">${n} trainers</span></summary><div class="body"></div></details>`;}).join('')+
 `<div class="mut small" style="margin:10px 2px">Sheet tab names: ${TRD.g.map(g=>esc(g.tab)).filter((x,i,a)=>a.indexOf(x)===i).join(', ')}.</div>`;
 bindHead();
 app.querySelectorAll('details.split').forEach(d=>{const fill=()=>{const gi=+d.dataset.gi;const b=d.querySelector('.body');if(d.open&&!b.innerHTML){const g=TRD.g[gi];b.innerHTML=(g.note&&g.note.length?`<div class="trnote" style="margin:8px 2px">${g.note.map(esc).join('<br>')}</div>`:'')+g.sec.map(s=>(s.h?`<div class="sech">${esc(s.h)}</div>${(s.note||[]).length?`<div class="trnote">${s.note.map(esc).join('<br>')}</div>`:''}${s.rw?`<div class="trnote"><b>Reward, pick one:</b> ${s.rw.map(z=>{const p=P.find(q=>q.name===z||q.name.startsWith(z+' ('));return p?plink(p.id):esc(z);}).join(', ')}</div>`:''}`:'')+s.tr.filter(t=>!rivalHidden(t)).map(t=>trainerBlock(t)).join('')).join('');bindTrainers(b);}
  if(d.open)TOPEN[d.dataset.gi]=1;else delete TOPEN[d.dataset.gi];try{localStorage.setItem(LS.tr,JSON.stringify(TOPEN))}catch(e){}};d.addEventListener('toggle',fill);fill();});}
function trainerDetail(k){fil.innerHTML='';sug.style.display='none';const t=TRK[k];if(!t){app.innerHTML='<p>Not found.</p>';return;}
 app.innerHTML=`<a class="back" href="javascript:history.back()">‹ Back</a><div class="mut small" style="margin-top:6px">${esc(t.g)}${t.h?' · '+esc(t.h):''}${t.c&&t.c.length?' · calc: '+t.c.map(esc).join(', '):''}</div>`+trainerBlock(t,true);bindTrainers();window.scrollTo(0,0);}
// The trainer rows of a walkthrough stop (ts: its trainers, rivals for the other starters already left out).
function walkTrainers(ts){
 return ts.map(t=>`<details class="trd" data-k="${t.k}" ${TRDO.has(t.k)?'open':''}><summary>${esc(t.n)} <span class="mut small">${t.tags.filter(z=>!/Optional/.test(z)).map(esc).join(' · ')}${t.tags.some(z=>/Optional/.test(z))?' · optional':''}</span><span class="trmini">${t.p.map(x=>spr(x.id,'s32')).join('')}</span></summary><div class="trb" data-k="${t.k}"></div></details>`).join('');}
// Boss teams inside walkthrough stops are built when first opened (bindWalk), not with the stop.
const TRDO=new Set();
function bindTrd(){app.querySelectorAll('details.trd').forEach(d=>{if(d.dataset.b)return;d.dataset.b=1;const fill=()=>{const b=d.querySelector('.trb');if(d.open)TRDO.add(d.dataset.k);else TRDO.delete(d.dataset.k);if(d.open&&b&&!b.innerHTML){b.innerHTML=trainerBlock(TRK[b.dataset.k]);bindTrainers(b);}};d.addEventListener('toggle',fill);fill();});}
function usedByCard(p){const u=TRUSE[p.id];if(!u)return '';return `<div class="card"><h3>Used by trainers (${u.length})</h3>${u.map(t=>`<div><a href="#/tr/${t.k}">${esc(t.n)}</a> <span class="mut small">${esc(t.loc)} · ${esc(t.g)}${t.st?(PICK?' · if your starter is '+esc(t.st):' · '+esc(t.st)+' starter'):''}</span></div>`).join('')}</div>`;}

// ===== FULL-WINDOW SEARCH (Dex Viewer only). Tapping the search box covers the page with a query strip, results from
// every section and a 4-row keyboard. The section of the page you're on comes first and in full, then the others in a
// fixed order (Pokemon, filters, locations, trainers, items, walkthrough), 8 each until "Show all". Picking a result
// opens it; Done filters the page's own list with the query, as typing in the box used to. Recent picks (LS.recent)
// show when the query is empty.
const SR={el:null,q:'',more:{},items:[],
 ico(k){const sel={l:'#t-l',t:'#t-t',i:'#t-i',w:'#t-w'}[k];const s=sel&&document.querySelector(sel+' svg');
  return `<span class="ic">${s?s.outerHTML:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>'}</span>`;},
 open(){if(this.el)return;this.q=q.value;this.more={};const el=this.el=document.createElement('div');el.className='srch';
  el.innerHTML=`<div class="sst"><button type="button" class="ib" data-a="back" aria-label="Back to the page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
<button type="button" class="sq" data-a="kb" aria-label="Search"><span class="tx" data-ph="Search everything"></span></button>
<button type="button" class="ib sx" data-a="clear" aria-label="Clear">×</button><button type="button" class="ib hk" data-a="hide" aria-label="Hide or show the keyboard"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></div><div class="sres"></div>`;
  document.body.appendChild(el);document.body.classList.add('sopen');
  el.addEventListener('click',e=>{const b=e.target.closest('[data-a],[data-i],[data-more]');if(!b)return;
   if(b.dataset.i!=null){this.pick(this.items[+b.dataset.i]);return;}
   if(b.dataset.more){this.more[b.dataset.more]=1;this.draw();return;}
   const a=b.dataset.a;if(a==='back')this.close();else if(a==='clear'){this.q='';if(KB.o)KB.buf='';this.draw(true);}
   else if(a==='hide'){if(KB.o)KB.close(true);else this.kb();}else if(a==='kb'&&!KB.o)this.kb();});
  this.kb();this.draw(true);},
 kb(){this.el.classList.remove('nokb');
  KB.open({mode:'abc',full:true,value:this.q,input:v=>{this.q=v;this.more={};this.draw(true);},
   onClose:quiet=>{if(!this.el)return;if(quiet)this.el.classList.add('nokb');else this.done();}});},
 close(){if(!this.el)return;const el=this.el;this.el=null;el.remove();document.body.classList.remove('sopen');KB.close(true);},
 // Done: the query goes to the page's search box, which filters its list (on a page with no list, the section's list).
 done(){const v=this.q.trim();this.close();if(v===q.value)return;q.value=v;q.dispatchEvent(new Event('input'));window.scrollTo(0,0);},
 go(h){if(location.hash===h)render(false);else location.hash=h;},
 pick(o){let r=[];try{r=JSON.parse(localStorage.getItem(LS.recent)||'[]')}catch(e){}
  r=[o,...r.filter(x=>JSON.stringify(x)!==JSON.stringify(o))].slice(0,6);try{localStorage.setItem(LS.recent,JSON.stringify(r))}catch(e){}
  this.close();
  if(o.k==='p')this.go('#/p/'+o.v);else if(o.k==='t')this.go('#/tr/'+o.v);
  else if(o.k==='f'){if(!st.f.some(f=>f.k===o.v.k&&f.v===o.v.v))st.f.push(o.v);save();q.value='';st.q='';this.go('#/');}
  else if(o.k==='l'){q.value='';st.q='';this.go('#/l/'+AR[o.v].l[0]);}
  else{q.value=o.n;st.q=o.n.toLowerCase();this.go(o.k==='i'?'#/items':'#/walk');}},
 row(o,sub){let ic,lb,sb='';
  if(o.k==='p'){const p=byId[o.v];if(!p)return '';ic=spr(p.id,'s32');lb=esc(p.name);sb=p.t.map(ty).join('');}
  else if(o.k==='f'){ic=this.ico('f');lb=o.v.k==='type'?ty(o.v.v):esc(fval(o.v));sb=FL[o.v.k]+' filter';}
  else if(o.k==='l'){if(!AR[o.v])return '';ic=this.ico('l');lb=esc(AR[o.v].n);sb=esc(sub||'');}
  else if(o.k==='t'){const t=TRK[o.v];if(!t)return '';ic=this.ico('t');lb=esc(t.n);sb=esc(t.loc+' · '+t.p.map(x=>byId[x.id]?byId[x.id].name:'').join(', '));}
  else{ic=this.ico(o.k);lb=esc(o.n);sb=esc(o.s||'');}
  this.items.push(o);return `<button type="button" class="sr" data-i="${this.items.length-1}">${ic}<span class="st"><span class="sl">${lb}</span>${sb?`<span class="ss">${sb}</span>`:''}</span></button>`;},
 // Each section: [[pick, sub text]] in display order.
 sections(s){const n=norm(s),out={};if(!n)return out;
  out.p=P.filter(p=>(p.nk??=norm(p.n)).includes(n)||p.key.includes(s)).sort((a,b)=>(b.nk.startsWith(n)-a.nk.startsWith(n))||a.i-b.i).map(p=>[{k:'p',v:p.id}]);
  const f=[],has=(k,v)=>st.f.some(x=>x.k===k&&x.v===v),pre=x=>norm(x).startsWith(n)?0:1;
  if(n.length>=2){types.filter(t=>norm(t).startsWith(n)&&!has('type',t)).forEach(t=>f.push({k:'type',v:t}));
   AB.map((a,i)=>i).filter(i=>abUsers[i]&&norm(AB[i][0]).includes(n)&&!has('ab',i)).sort((a,b)=>pre(AB[a][0])-pre(AB[b][0])).forEach(i=>f.push({k:'ab',v:i}));
   usedMoves.filter(i=>norm(M[i]).includes(n)&&!has('mv',i)).sort((a,b)=>pre(M[a])-pre(M[b])).forEach(i=>f.push({k:'mv',v:i}));
   LOC.map((l,i)=>i).filter(i=>locs[i]&&norm(LOC[i]).includes(n)&&!has('loc',i)).forEach(i=>f.push({k:'loc',v:i}));}
  out.f=f.map(v=>[{k:'f',v}]);
  const ln=[],lv=[];AR.forEach((A,a)=>{const other=A.l.map(li=>LOC[li]).filter(x=>x!==A.n);
   if(norm(A.n).includes(n)||other.some(x=>norm(x).includes(n)))ln.push([{k:'l',v:a},other.join(', ')]);
   else{const ms=areaSpecies(a).filter(p=>(p.nk??=norm(p.n)).includes(n));if(ms.length)lv.push([{k:'l',v:a},ms.map(p=>p.name).join(', ')]);}});
  out.l=[...ln,...lv];
  out.t=TRS.filter(t=>!rivalHidden(t)&&(t.key.includes(s)||norm(t.key).includes(n))).map(t=>[{k:'t',v:t.k}]);
  out.i=(D.IT||[]).flatMap(sec=>sec.r.filter(r=>(r[0]+' '+r[1]).toLowerCase().includes(s)||norm(r[0]).includes(n)).map(r=>[{k:'i',n:r[0],s:sec.n+' · '+r[1]}]));
  out.w=D.WK.splits.flatMap(sp=>sp.st.filter(x=>stopText(x).includes(s)).map(x=>[{k:'w',n:x.n,s:sp.n}]));
  return out;},
 draw(top){if(!this.el)return;const s=this.q.trim().toLowerCase();
  const tx=this.el.querySelector('.sq .tx');tx.textContent=this.q;this.el.classList.toggle('empty',!this.q);this.items=[];let h='';
  if(!norm(s)){let r=[];try{r=JSON.parse(localStorage.getItem(LS.recent)||'[]')}catch(e){}
   h=r.length?`<div class="ssh">Recent</div>`+r.map(o=>this.row(o,'')).join(''):`<div class="shint">Search Pokémon, types, abilities, moves, places, trainers, items and the walkthrough. Pick a result to open it, or Done to filter this page's list.</div>`;}
  else{const S=this.sections(s);const v=(location.hash||'#/').slice(2).split('/')[0];
   const cur={locs:'l',l:'l',trainers:'t',tr:'t',items:'i',walk:'w'}[v]||'p';
   const T={p:'Pokémon',f:'Filters',l:'Locations',t:'Trainers',i:'Items',w:'Walkthrough'};
   for(const k of [cur,...['p','f','l','t','i','w'].filter(x=>x!==cur)]){const a=S[k];if(!a||!a.length)continue;
    const lim=this.more[k]?a.length:k===cur?100:8;
    h+=`<div class="ssh">${T[k]}<span>${a.length}</span></div>`+a.slice(0,lim).map(([o,sub])=>this.row(o,sub)).join('')+
     (a.length>lim?`<button type="button" class="smore" data-more="${k}">Show all ${a.length}</button>`:'');}
   if(!h)h='<div class="shint">No matches.</div>';}
  const r=this.el.querySelector('.sres');r.innerHTML=h;if(top)r.scrollTop=0;}};

// ===== CALC (empty for now; the stat calculator is on each Pokemon page)
function calcPage(){fil.innerHTML='';sug.style.display='none';app.innerHTML=`<div class="card"><h3>Calc</h3><p style="margin:0">Coming soon. Each Pokémon page has a stat calculator in the meantime.</p></div>`;}
// ===== TABS NOT BUILT YET (later batches)
function soon(name,what){fil.innerHTML='';sug.style.display='none';app.innerHTML=`<div class="card"><h3>${name}</h3><p style="margin:0">Coming in a later batch: ${what}</p></div>`;}
// ===== ROUTER
function render(fromInput){const h=location.hash||'#/';const parts=h.slice(2).split('/');const v=parts[0]||'';
 if(st.view===''&&v!==''&&!fromInput)st.listScroll=Object.assign(keepAnchor(),{z:cvSizes()});
 if(v!==''&&v!=='locs'&&v!=='items'&&v!=='walk'&&v!=='trainers'&&!fromInput){q.value='';st.q='';}
 document.body.dataset.v=v;if(RJ)RJ.hidden=!(v==='walk'&&!st.q);
 if(v==='p'){setTab('p');detail(decodeURIComponent(parts[1]));}
 else if(v==='m'){setTab('p');moveDetail(+parts[1]);}
 else if(v==='a'){setTab('p');abilityDetail(+parts[1]);}
 else if(v==='locs'){setTab('l');listLocs2(false);}
 else if(v==='l'){setTab('l');st.lopenArea=LOC2A[+parts[1]];listLocs2(!fromInput);}
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
const posSave=()=>{try{localStorage.setItem(LS.pos,JSON.stringify({h:location.hash,a:keepAnchor()}))}catch(e){}};
let posT=0;window.addEventListener('scroll',()=>{clearTimeout(posT);posT=setTimeout(posSave,300);},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)posSave();});
window.dexViewer={restoreScroll(y){let c=null;try{c=JSON.parse(localStorage.getItem(LS.pos)||'null')}catch(e){}
 if(c&&c.h===location.hash&&c.a&&c.a.sel&&app.querySelector(c.a.sel))toAnchor(c.a);else window.scrollTo(0,y);}};
window.addEventListener('hashchange',()=>{const typed=searchNav;searchNav=false;if(!typed){SR.close();KB.close(true);}if(curKey)SNAP[curKey]={a:keepAnchor(),z:cvSizes()};
 render(typed);curKey=entryKey();if(typed){window.scrollTo(0,0);return;}const sn=SNAP[curKey];if(sn){cvApply(sn.z);toAnchor(sn.a);}});
// Opened without a route (the viewer always loads the bare file): go back to the page it was on.
if(!location.hash||location.hash==='#'){try{const c=JSON.parse(localStorage.getItem(LS.pos)||'null');if(c&&/^#\/[\w\/%.-]*$/.test(c.h))history.replaceState(null,'',c.h);}catch(e){}}
render(false);curKey=entryKey();
app.insertAdjacentHTML('afterend',`<div class="foot">${esc(CF.name)} offline dex · ${P.length} Pokémon and forms (${P.filter(p=>p.g===0).length} obtainable) · ${MV.filter(m=>m.h.length).length} changed moves · ${TRS.length} ${CF.trw[2]} · built ${D.built}${CF.credit?` · ${CF.credit}`:''}</div>`);

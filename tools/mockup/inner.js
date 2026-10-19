// Mockup layer over a snapshot of the real walkthrough page. State lives in the parent (localStorage there).
(function(){
const P=parent,G=P.CUR,ST=P.loadState(G),save=()=>P.saveState(G,ST);
const GAP=8,esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const app=document.getElementById('app'),hdr=document.querySelector('header');
app.innerHTML=P.SNAP[G];
app.querySelectorAll('[data-b],[data-bd]').forEach(e=>{e.removeAttribute('data-b');e.removeAttribute('data-bd');});
app.querySelectorAll('details[open]').forEach(d=>d.open=false);
const isSplit=d=>/^\d+$/.test(d.dataset.wo||'');
const splits=[...app.querySelectorAll('details.split[data-wo]')].filter(isSplit);
const top=[];for(let e=app.firstElementChild;e&&e!==splits[0];e=e.nextElementSibling)top.push(e);
const cheat=top.find(e=>e.dataset.wo==='ch'),docs=top.find(e=>e.dataset.wo==='doc'),tk=top.find(e=>e.classList.contains('tkbar')),intro=top.find(e=>e.matches('div.mut.small'));
const np=[...app.querySelectorAll('details.split:not([data-wo])')].pop();
const wkr=app.querySelector('.wk-reset');
const CHK=!!app.querySelector('.wstep');
const hgStarter=tk.querySelector('.tk-starter');
const UP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"/></svg>';
const doc=(k,n,inner)=>`<details class="stopd" data-p="${k}"><summary class="stoph">${n}</summary><div class="stop">${inner}</div></details>`;
const nameOf=sm=>sm.firstChild.textContent.trim();

// Starter picker. Hardlove's is its own choice; EI's (new) sets the Littleroot Town encounter (tracker area 0).
const a0=app.querySelector('.trk[data-a="0"] .tk-sel');
let starter='';
if(hgStarter){starter=hgStarter.outerHTML.replace('class="tk-starter"','class="tk-starter" id="starter"');}
else if(a0){starter=`<select class="tk-starter" id="starter"><option value="">Not chosen</option>${[...a0.options].filter(o=>/^\d+$/.test(o.value)).map(o=>`<option value="${o.value}">${esc(o.textContent)}</option>`).join('')}</select>`;}

// Guide info: tracker and checklist tools, then game docs (cheat codes and unplaced items are docs too), then the intro.
let gi=`<div class="psec">Encounter tracker</div><div class="mut small" style="margin:0 2px" id="tkcount"></div>`+
 `<div class="bar" style="margin:6px 0 0"><button class="btn">Export</button><button class="btn">Import</button><button class="btn danger" data-confirm="Tap again to clear">Reset all</button>`+
 (CHK?`<button class="btn danger" id="ckreset" data-confirm="Tap again to clear">Reset checklist</button>`:'')+`</div>`;
const docList=(cheat?doc('ch','Cheat codes',cheat.querySelector('.card').outerHTML):'')+(docs?docs.querySelector('.body').innerHTML:'')+
 (np?doc('np',np.querySelector('summary').innerHTML,np.querySelector('table').outerHTML):'');
if(docList)gi+=`<div class="psec">Game docs</div>`+docList;
if(intro)gi+=`<div class="mut small" style="margin:12px 2px 4px">${intro.innerHTML}</div>`;
let h=`<details class="split pre" data-wo="pre"><summary>Guide info <span class="mut small" id="ginfo"></span></summary><div class="pbody">${gi}</div></details>`;
if(CHK)h+=`<button class="resume" id="resume"></button>`;
if(starter)h+=`<div class="card tkbar strow"><span class="mut small">Starter</span>${starter}</div>`;
h+=`<div class="seg" id="allseg"><button data-a="open">Expand all</button><button data-a="close">Collapse all</button></div>`;
top.forEach(e=>e.remove());if(np)np.remove();if(wkr)wkr.parentElement.remove();
splits[0].insertAdjacentHTML('beforebegin',`<div class="wtool" id="wtool">${h}</div>`);
const pre=app.querySelector('details.pre');
pre.querySelectorAll('details[data-k]').forEach(d=>{d.dataset.p=d.dataset.k;d.removeAttribute('data-k');});

// Stops: note on top, then Checklist, Encounters, Items, Trainers, each opened and closed from its own header.
const SEC={c:'Checklist',e:'Encounters',i:'Items',t:'Trainers'};
function restructure(s){const k=s.dataset.k,stop=s.querySelector(':scope>.stop'),stopName=nameOf(s.querySelector('summary'));
 const kids=[...stop.children],note=[],parts={c:[],e:[],i:[],t:[]};let cur=null,areas=[];
 for(let j=0;j<kids.length;j++){const e=kids[j];
  if(e.matches('label.wstep'))parts.c.push(e);
  else if(e.matches('table.itbl.wt'))parts.i.push(e);
  else if(e.matches('details.trd'))parts.t.push(e);
  else if(e.matches('div.sech')){if(e.textContent==='Trainers'&&kids[j+1]&&kids[j+1].matches('details.trd')){e.remove();cur=null;continue;}
   cur={n:e.textContent,nodes:[]};areas.push(cur);e.remove();}
  else if(cur)cur.nodes.push(e);
  else note.push(e);}
 const multi=areas.length>1;
 areas.forEach(A=>{const box=document.createElement('div');box.className='area';
  A.nodes.forEach(n=>box.append(n));
  const lab=box.querySelector('.trk[data-a]>span.mut');
  const short=A.n.startsWith(stopName+' ')?A.n.slice(stopName.length+1):A.n;
  if(lab){if(multi){lab.className='atag';lab.textContent=short;}else lab.remove();}
  else if(multi)box.insertAdjacentHTML('afterbegin',`<div class="atag solo">${esc(short)}</div>`);
  parts.e.push(box);});
 stop.innerHTML='';note.forEach(n=>stop.append(n));
 Object.keys(SEC).forEach(t=>{if(!parts[t].length)return;const d=document.createElement('details');d.className='sec';d.dataset.s=k+'.'+t;d.dataset.t=t;
  d.innerHTML=`<summary><span class="sn">${SEC[t]}</span><span class="si"></span></summary><div class="secb${t==='c'?' chkb':''}"></div><button class="endbar sb" data-end="sec">${UP}<span>${SEC[t]}</span></button>`;
  parts[t].forEach(n=>d.querySelector('.secb').append(n));stop.append(d);});
 stop.insertAdjacentHTML('beforeend',`<button class="endbar st" data-end="stop">${UP}<span>Collapse ${esc(stopName)}</span></button>`);}

splits.forEach(d=>{const body=d.querySelector('.body');
 body.insertAdjacentHTML('afterbegin','<div class="seg split-ctl"><button data-a="open">Expand all</button><button data-a="close">Collapse all</button></div>');
 body.querySelectorAll(':scope>details.stopd').forEach(restructure);
 body.insertAdjacentHTML('beforeend',`<button class="endbar sp" data-end="split">${UP}<span>Collapse ${esc(nameOf(d.querySelector('summary')))}</span></button>`);});

// Saved state onto the page. Stops and sections start open, checklists closed.
ST.e=ST.e||{};ST.sec=ST.sec||{};
pre.open=!!ST.pre;
splits.forEach(d=>d.open=!!ST.o[d.dataset.wo]);
app.querySelectorAll('details.stopd[data-k]').forEach(s=>s.open=ST.x[s.dataset.k]!==0);
app.querySelectorAll('details.sec').forEach(d=>{const v=ST.sec[d.dataset.s];d.open=v===undefined?d.dataset.t!=='c':!!v;});
app.querySelectorAll('.wstep input').forEach(c=>{c.checked=!!ST.c[c.dataset.sk];c.closest('.wstep').classList.toggle('done',c.checked);});
app.querySelectorAll('.trk[data-a] .tk-sel').forEach(s=>{const a=s.closest('.trk').dataset.a;if(ST.e[a])s.value=ST.e[a];});
const stSel=document.getElementById('starter');
if(stSel){if(hgStarter)stSel.value=ST.st||'';else stSel.value=/^\d+$/.test(ST.e[0]||'')?ST.e[0]:'';}

// Header summaries: done/total, caught or failed, item count with MISSABLE, trainer count.
const encTag=v=>!v?'':v==='__fail'?'<span class="tag">failed</span>':(()=>{const o=app.querySelector(`.tk-sel option[value="${CSS.escape(v)}"]`);return o?`<span class="tag got">${esc(o.textContent.replace(/ \(dupe\)$/,''))}</span>`:'';})();
function counts(){
 app.querySelectorAll('details.sec').forEach(d=>{const si=d.querySelector('summary .si'),t=d.dataset.t;let x='';
  if(t==='c'){const a=[...d.querySelectorAll('.wstep input')],n=a.filter(z=>z.checked).length;x=`<span class="tag${n===a.length?' got':''}">${n}/${a.length}</span>`;}
  else if(t==='e'){x=[...d.querySelectorAll('.trk[data-a] .tk-sel')].map(s=>encTag(s.value)).join('');}
  else if(t==='i'){const r=d.querySelectorAll('tr').length,m=d.querySelectorAll('.warn').length;x=`<span class="tag">${r}</span>${m?'<span class="tag miss">MISSABLE</span>':''}`;}
  else x=`<span class="tag">${d.querySelectorAll('details.trd').length}</span>`;
  si.innerHTML=x;});
 app.querySelectorAll('details.stopd[data-k]').forEach(s=>{const sm=s.querySelector('summary');sm.querySelectorAll('.tag.got,.tag.enc').forEach(t=>{if(!t.closest('.sec'))t.remove();});
  const tags=[...s.querySelectorAll('.trk[data-a] .tk-sel')].map(z=>encTag(z.value)).join('').replace(/class="tag(?! got)/g,'class="tag enc');
  const tp=document.createElement('template');tp.innerHTML=tags;(sm.querySelector('.mut.small')||sm.firstChild).after(tp.content);});
 splits.forEach(d=>{const t=d.querySelector('summary .tag');if(!t)return;const a=[...d.querySelectorAll('.wstep input')],n=a.filter(x=>x.checked).length;t.textContent=n+'/'+a.length;t.classList.toggle('got',a.length&&n===a.length);});
 const vals=Object.values(ST.e),cg=vals.filter(v=>v&&v!=='__fail').length,fl=vals.filter(v=>v==='__fail').length;
 document.getElementById('ginfo').textContent=`${cg} caught · ${fl} failed`;
 document.getElementById('tkcount').textContent=`${cg} caught · ${fl} failed · dupes clause on whole evolution lines`;
 const r=document.getElementById('resume');if(r){const nx=next();r.innerHTML=nx?`<b>Next step</b><span>${esc(nameOf(nx.closest('details.stopd').querySelector('summary')))} · ${esc(nx.closest('.wstep').querySelector('span').firstChild.textContent)}</span>`:'<b>Checklist done</b>';}}
const next=()=>[...app.querySelectorAll('.wstep input')].find(x=>!x.checked);
counts();

// Bottom collapse bars only where the open block (its header, content and the bar itself) doesn't fit in the part of
// the window under the sticky search bar, so its header can't be reached without scrolling.
let bq=0;const barsSoon=()=>{if(!bq)bq=requestAnimationFrame(()=>{bq=0;bars();});};
const BH={};const barH=b=>{const k=b.className;if(BH[k]==null){b.hidden=false;const cs=getComputedStyle(b);BH[k]=b.offsetHeight+parseFloat(cs.marginTop)+parseFloat(cs.marginBottom);b.hidden=true;}return BH[k];};
function bars(){const all=[...app.querySelectorAll('.endbar')];all.forEach(b=>b.hidden=true);
 const room=innerHeight-hdr.offsetHeight;
 const show=all.filter(b=>{const d=b.closest('details');return d&&d.open&&d.offsetHeight+barH(b)>room;});
 show.forEach(b=>b.hidden=false);}

const T=()=>hdr.offsetHeight+GAP;
const flash=e=>{e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash');};
const toTop=e=>scrollBy(0,e.getBoundingClientRect().top-T());
const intoView=e=>{if(e.getBoundingClientRect().top<T())toTop(e);};
// Browser scroll anchoring is switched off while we move things ourselves, or it adds its own correction a frame later.
const html=document.documentElement;
const noAnchor=()=>{html.style.overflowAnchor='none';};
const anchorBack=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!folding)html.style.overflowAnchor='';}));
// After a toggle, keep the header where it landed for a moment: blocks above it that content-visibility skipped render
// at their real height as they come into view and would push it down. Any press, wheel or key ends the hold.
function hold(el){const y=el.getBoundingClientRect().top,t0=performance.now();let stop=false;const end=()=>{stop=true;};
 ['pointerdown','wheel','keydown'].forEach(k=>addEventListener(k,end,{once:true,passive:true}));
 const f=()=>{if(stop||performance.now()-t0>450){if(!folding)html.style.overflowAnchor='';return;}
  const dy=el.getBoundingClientRect().top-y;if(Math.abs(dy)>.5)scrollBy(0,dy);requestAnimationFrame(f);};requestAnimationFrame(f);}
// Opening or closing from a header never scrolls: the header stays exactly where it was, and the bottom bars are
// settled in the same frame (updating them a frame later made the block below jump after the toggle).
function flip(d,open){const sm=d.querySelector(':scope>summary'),y=sm.getBoundingClientRect().top;noAnchor();
 d.open=open;bars();const dy=sm.getBoundingClientRect().top-y;if(dy)scrollBy(0,dy);hold(sm);jumpState();}
// Collapsing from the bottom. Three styles to compare (the mockup's "Collapse style"):
// snap   - close, put the header at the top and flash it. No motion.
// seq    - a short scroll up to the header (it flashes as it arrives), then the content folds up into it.
// sticky - an open stop's header sticks under the search bar while you read it, so it is already at the top when you
//          collapse: it stays put and the content under it changes. Sections and splits snap.
// Scroll is set from the header's live position every frame, since blocks above can change height as they render.
let folding=0;
const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,easeOut=p=>1-(1-p)*(1-p);
function foldUp(d){if(folding)return;const sm=d.querySelector(':scope>summary');noAnchor();
 const mode=P.foldStyle();
 // in sticky style a section's header has to land under its stop's stuck header, not under it
 // sticky: a stop's or section's header is pinned at the top already, so it just closes in place (a split snaps)
 if(mode==='sticky'&&!d.matches('details.split')&&sm.getBoundingClientRect().top>=hdr.offsetHeight-1){flip(d,false);flash(sm);return;}
 const snap=()=>{d.open=false;bars();const y=sm.getBoundingClientRect().top-T();if(y<0)scrollBy(0,y);flash(sm);hold(sm);jumpState();};
 if(RM||mode!=='seq'){snap();return;}
 folding=1;
 const room=innerHeight-T();let y=sm.getBoundingClientRect().top-T();
 if(y<-room){scrollBy(0,y+room);y=sm.getBoundingClientRect().top-T();}
 const S=y<0?170:0,F=170;
 d.open=false;const hs=d.offsetHeight;d.open=true;
 const kids=[...d.children].filter(c=>c!==sm);let flashed=false,h1=0,t0=performance.now();
 const fold=v=>{d.style.height=(hs+h1*(1-v))+'px';kids.forEach(c=>c.style.transform=`translateY(${-h1*v}px)`);};
 const step=now=>{const t=now-t0;
  if(S){const e=ease(Math.min(1,t/S));scrollBy(0,sm.getBoundingClientRect().top-(T()+y*(1-e)));}
  if(!flashed&&sm.getBoundingClientRect().top>=T()-GAP-1){flashed=true;flash(sm);}
  if(t>=S){if(!d.classList.contains('folding')){h1=Math.max(0,Math.min(d.offsetHeight-hs,innerHeight-d.getBoundingClientRect().top-hs));
    d.classList.add('folding');d.style.overflow='hidden';}
   fold(easeOut(Math.min(1,(t-S)/F)));}
  if(t>=S+F){folding=0;d.classList.remove('folding');d.style.height=d.style.overflow='';kids.forEach(c=>c.style.transform='');
   d.open=false;bars();if(y<0)toTop(sm);hold(sm);jumpState();return;}
  requestAnimationFrame(step);};
 requestAnimationFrame(step);}

app.addEventListener('toggle',e=>{const d=e.target;
 if(d.matches('details.pre'))ST.pre=d.open?1:0;
 else if(d.matches('details.split')&&isSplit(d)){if(d.open)ST.o[d.dataset.wo]=1;else delete ST.o[d.dataset.wo];}
 else if(d.matches('details.stopd[data-k]')){if(d.open)delete ST.x[d.dataset.k];else ST.x[d.dataset.k]=0;}
 else if(d.matches('details.sec'))ST.sec[d.dataset.s]=d.open?1:0;
 else{barsSoon();return;}
 save();barsSoon();jumpState();},true);

function setEnc(a,v){if(v)ST.e[a]=v;else delete ST.e[a];app.querySelectorAll(`.trk[data-a="${a}"] .tk-sel`).forEach(s=>s.value=v||'');}
app.addEventListener('change',e=>{const c=e.target;
 if(c.matches('.wstep input')){if(c.checked)ST.c[c.dataset.sk]=1;else delete ST.c[c.dataset.sk];c.closest('.wstep').classList.toggle('done',c.checked);}
 else if(c.matches('.trk[data-a] .tk-sel')){const a=c.closest('.trk').dataset.a;if(c.value==='__other'){c.value=ST.e[a]||'';return;}setEnc(a,c.value);
  if(a==='0'&&stSel&&!hgStarter)stSel.value=/^\d+$/.test(c.value)?c.value:'';}
 else if(c.id==='starter'){if(hgStarter)ST.st=c.value;else setEnc('0',c.value);}
 else return;
 save();counts();bars();});

app.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="#"]');if(a){e.preventDefault();return;}
 const cf=e.target.closest('[data-confirm]');
 if(cf){if(!cf.dataset.armed){e.preventDefault();cf.dataset.armed=cf.textContent;cf.textContent=cf.dataset.confirm;setTimeout(()=>{if(cf.dataset.armed){cf.textContent=cf.dataset.armed;delete cf.dataset.armed;}},2500);return;}
  cf.textContent=cf.dataset.armed;delete cf.dataset.armed;
  if(cf.id==='ckreset'){ST.c={};app.querySelectorAll('.wstep input').forEach(c=>{c.checked=false;c.closest('.wstep').classList.remove('done');});}
  else{ST.e={};ST.st='';app.querySelectorAll('.tk-sel').forEach(s=>s.value='');if(stSel)stSel.value='';}
  save();counts();return;}
 const b=e.target.closest('.seg button');
 if(b){const open=b.dataset.a==='open';
  noAnchor();
  // the bar you pressed stays where it is
  const y=b.getBoundingClientRect().top;
  (b.closest('#allseg')?splits:b.closest('.body').querySelectorAll(':scope>details.stopd')).forEach(d=>d.open=open);
  bars();scrollBy(0,b.getBoundingClientRect().top-y);
  anchorBack();jumpState();return;}
 const end=e.target.closest('.endbar');
 if(end){foldUp(end.closest('details'));return;}
 const sm=e.target.closest('summary');
 if(sm&&sm.parentElement.tagName==='DETAILS'&&!e.target.closest('select,input,button')){e.preventDefault();if(!folding)flip(sm.parentElement,!sm.parentElement.open);return;}
 if(e.target.closest('#resume')){const nx=next();if(!nx)return;const s=nx.closest('details.stopd'),c=nx.closest('details.sec');
  nx.closest('details.split').open=true;s.open=true;c.open=true;bars();toTop(c.querySelector('summary'));flash(nx.closest('.wstep'));}});

// Jump: up = top of the split you're in, or the previous one when this one's header already sits at the top with the
// gap above it. Down = the next split at that same spot.
function jump(dir){const t=T(),hs=splits.map(d=>d.getBoundingClientRect().top);let i;
 if(dir<0){i=-1;hs.forEach((y,j)=>{if(y<t-2)i=j;});if(i<0){scrollTo(0,0);jumpState();return;}}
 else{i=hs.findIndex(y=>y>t+2);if(i<0){scrollTo(0,document.documentElement.scrollHeight);jumpState();return;}}
 toTop(splits[i]);flash(splits[i].querySelector('summary'));jumpState();}
const atEnd=()=>scrollY+innerHeight>=document.documentElement.scrollHeight-1;
function jumpState(){const t=T();const more=splits.some(d=>d.getBoundingClientRect().top>t+2)&&!atEnd();
 document.querySelectorAll('[data-j="-1"]').forEach(b=>b.disabled=scrollY<=0);
 document.querySelectorAll('[data-j="1"]').forEach(b=>b.disabled=!more);}
document.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>jump(+b.dataset.j));
let raf=0;addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;jumpState();});},{passive:true});
const hh=()=>html.style.setProperty('--hh',hdr.offsetHeight+'px');hh();
// Section headers pin under their stop's pinned header, whose height (one or two lines) each stop carries as --sh.
const sro=new ResizeObserver(es=>es.forEach(e=>e.target.parentElement.style.setProperty('--sh',e.target.offsetHeight+'px')));
app.querySelectorAll('details.stopd[data-k]>summary').forEach(x=>sro.observe(x));
addEventListener('resize',()=>{hh();bars();jumpState();});
P.applyOpts(document);bars();jumpState();
})();

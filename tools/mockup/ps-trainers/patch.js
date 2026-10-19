// Mockup layer over the real Photonic Sun build (runs after the guide's own script, in a srcdoc frame).
// frameElement.dataset.d = design ('cur' = the current build, untouched apart from the jump), parent.MK = {css, focus}.
// A: one row per trainer, format tags in the row, partner team in the card, cap tag on each place heading.
// B: one row per battle (trainers fought at once share t.bt), a cap line at the top of each place, Prismatic Moon
//    teams folded away at the end of their place.
(()=>{const MK=parent.MK,DS=frameElement.dataset.d;
// ---- jump to a place (every frame): open its box, then its heading, and scroll to it
function focus(){const F=MK.focus;if(!F||location.hash!=='#/trainers')return;
 const [b,f,nth=0]=DS==='cur'?F.cur:F.new;
 const has=g=>g.sec.some(s=>s.h===f||s.h.startsWith(f));
 let gi=TRD.g.findIndex(g=>g.n.includes(b)&&has(g));if(gi<0)gi=TRD.g.findIndex(has);if(gi<0)return;
 const d=app.querySelector(`details.split[data-gi="${gi}"]`);if(!d)return;if(!d.open){d.open=true;TOG.trainers(d);}
 // Cards above render lazily (content-visibility) and grow the page after the first scroll: scroll until it settles
 const go=n=>{const h=[...d.querySelectorAll('details.stopd>summary')].filter(x=>x.textContent.startsWith(f))[nth];if(!h)return;
  h.parentElement.open=true;const hh=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh'))||0;
  const y=h.parentElement.getBoundingClientRect().top+scrollY-hh;if(Math.abs(scrollY-y)>2)scrollTo(0,y);if(n)setTimeout(()=>go(n-1),120);};
 setTimeout(()=>go(8),60);}
window.addEventListener('mk-focus',focus);
if(DS==='cur'){setTimeout(focus,80);return;}
const css=document.createElement('style');css.textContent=MK.css;document.head.appendChild(css);
let SET=0;try{SET=+localStorage.getItem('mkcapset')||0}catch(e){}
const MINI=TRD.mini||[];
const capOfSec=s=>s.cap?s.cap[SET]:0;
const capWho=(s)=>{const l=capOfSec(s);if(!l)return null;
 // the cap that sets this level: the next one at or after the section, in the chosen set
 return MINI.find(c=>c[2]===l&&(SET||c[3]==='trial')&&!c[4]);};
// ---- header: Minimal Grinding Mode as before, then the caps with a switch
const oHead=trHead;
trHead=()=>{const h=oHead().replace(/<details style="margin-top:6px"><summary class="mut small">Level caps<\/summary>[\s\S]*?<\/details>/,'');
 const rows=MINI.filter(c=>SET?!c[4]:c[3]==='trial');
 return h.replace(/<\/div>$/,`<details class="capsd" ${MK.capsOpen?'open':''}><summary class="mut small">Level caps <b>${SET?'with mini caps':'trials and Kahunas'}</b></summary>
  <div class="capsw" role="group" aria-label="Level caps"><button data-s="0" aria-pressed="${!SET}">Trials and Kahunas</button><button data-s="1" aria-pressed="${!!SET}">With mini caps</button></div>
  <table class="itbl capt">${rows.map(c=>`<tr class="${c[3]}"><td>${esc(c[0])}<div class="mut small">${esc(c[1])}</div></td><td>${c[3]==='mini'?'<span class="tag">mini</span>':''}</td><td class="n"><b>${c[2]}</b></td></tr>`).join('')}</table>
  <div class="mut small" style="margin-top:4px">${SET?'Mini caps are forced boss fights between trials. One right before a higher trial is left out (the trial is enough).':'The usual rule: the next trial or grand trial.'} Ultra Necrozma (100) comes before Mina (95) and Hapu (96).</div></details></div>`);};
const oBindHead=bindHead;
bindHead=()=>{oBindHead();app.querySelectorAll('.capsw button').forEach(b=>b.onclick=()=>{SET=+b.dataset.s;MK.capsOpen=true;try{localStorage.setItem('mkcapset',SET)}catch(e){}rerender();});
 const d=app.querySelector('details.capsd');if(d)d.addEventListener('toggle',()=>{MK.capsOpen=d.open;});};
// ---- partner team (both designs): the one for your starter, else all of them with their starter
function partnerBlock(t){const pt=t.pt;if(!pt||!pt.length)return '';const s=starterType();
 const ps=pt.filter(p=>!p.st||!s||p.st===s);
 return `<details class="ptd"><summary><span class="ptk">Your partner</span> ${esc(ps[0].n.replace(/^Pokémon Trainer |^Team Skull /,''))}${ps.length>1?` <span class="mut small">(${ps.length} teams, by starter)</span>`:''}<span class="trmini">${ps[0].p.map(x=>spr(x.id,'s24')).join('')}</span></summary>
  ${ps.map(p=>`${ps.length>1?`<div class="mut small" style="margin:4px 0 2px">If your starter is ${esc(p.st)}</div>`:''}<div class="team">${p.p.map(x=>monCard(x,0)).join('')}</div>`).join('')}</details>`;}
const oBlock=trainerBlock;
trainerBlock=(t,mini,row)=>{let h=oBlock(t,mini,row);
 h=h.replace(/<span class="tag">Prismatic Moon<\/span>/,'<span class="tag moon">Prismatic Moon</span>');
 const pb=partnerBlock(t);if(!pb)return h;
 const i=h.indexOf('<div class="team">');return h.slice(0,i)+pb+h.slice(i);};
// ---- rows
const fmtTag=t=>{const f=t.tags.find(z=>/Battle/.test(z));if(!f)return '';
 const w=t.pt&&t.pt.length?' · with '+esc(t.pt[0].n.replace(/^Pokémon Trainer |^Team Skull /,'')):'';
 return `<span class="tag fmt">${esc(f.replace(' Battle',''))}${w}</span>`;};
const moonTag=t=>t.tags.includes('Prismatic Moon')?'<span class="tag moon">Prismatic Moon</span>':'';
const rowSum=(ts,loc)=>{const t=ts[0];
 const names=ts.length>1?ts.map(x=>esc(x.n.replace(/^(Pokémon Trainer|Team Skull|Aether Foundation|Team Rainbow Rocket|Team Skull Boss) /,''))).join(' + '):esc(t.n);
 return `<summary>${names} ${fmtTag(t)}${moonTag(t)}${loc&&t.loc?`<span class="mut small">${esc(t.loc)}</span>`:''}<span class="trmini">${ts.flatMap(x=>x.p).map(x=>spr(x.id,ts.length>1?'s24':'s32')).join('')}</span></summary>`;};
trRows=(ts,open,loc)=>{
 if(DS==='A')return ts.map(t=>`<details class="trd${moonTag(t)?' mrow':''}" data-k="${t.k}" ${open(t)?'open':''}>${rowSum([t],loc)}<div class="trb" data-k="${t.k}"></div></details>`).join('');
 // B: one row per battle
 const gs=[];ts.forEach(t=>{const l=gs[gs.length-1];if(l&&t.bt&&l[0].bt===t.bt)l.push(t);else gs.push([t]);});
 const row=g=>`<details class="trd" data-k="${g[0].k}" data-ks="${g.map(t=>t.k).join(',')}" ${open(g[0])?'open':''}>${rowSum(g,loc)}<div class="trb" data-k="${g[0].k}"></div></details>`;
 const sun=gs.filter(g=>!moonTag(g[0])),moon=gs.filter(g=>moonTag(g[0]));
 return sun.map(row).join('')+(moon.length?`<details class="moond"><summary>Prismatic Moon only <span class="tag">${moon.length}</span> <span class="mut small">the other version's teams</span></summary>${moon.map(row).join('')}</details>`:'');};
bindTrd=root=>{(root||app).querySelectorAll('details.trd').forEach(d=>{if(d.dataset.b)return;d.dataset.b=1;
 const fill=()=>{const b=d.querySelector('.trb');if(document.body.dataset.v==='walk'){if(d.open)TRDO.add(d.dataset.k);else TRDO.delete(d.dataset.k);}
  if(d.open&&b&&!b.innerHTML){const ks=(d.dataset.ks||d.dataset.k).split(',');
   b.innerHTML=ks.map((k,i)=>{let h=trainerBlock(TRK[k],false,i===ks.length-1);
    if(ks.length>1&&i<ks.length-1)h=h.replace(/<details class="ptd">[\s\S]*?<\/details>/,'');  // partner once, on the last card
    return h;}).join(ks.length>1?'<div class="vs">and</div>':'');bindTrainers(b);}};
 d.addEventListener('toggle',fill);fill();});};
// ---- place headings: cap tag (A) or cap line (B)
const oGroup=trGroup;
trGroup=gi=>{let h=oGroup(gi);const g=TRD.g[gi];
 g.sec.forEach((s,si)=>{const l=capOfSec(s);if(!l||!s.h)return;const k=gi+'.'+si,c=capWho(s);
  if(DS==='A')h=h.replace(new RegExp(`(<details class="stopd" data-k="${k}"[^>]*><summary class="stoph">[\\s\\S]*?)(</summary>)`),`$1<span class="tag capg">cap ${l}</span>$2`);
  else h=h.replace(new RegExp(`(<details class="stopd" data-k="${k}"[^>]*><summary class="stoph">[\\s\\S]*?</summary><div class="stop">)`),`$1<div class="capl">Level cap <b>${l}</b>${c?` · ${esc(c[0])}, ${esc(c[1])}`:''}</div>`);});
 return h;};
setTimeout(()=>{rerender();setTimeout(focus,80);},0);
})();

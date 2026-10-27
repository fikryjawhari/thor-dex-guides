// calc-team decide mockup: re-lays out the real calc page after every render (grid areas on .fit), adds the player's
// team row with drag and drop (pointer events: hold to lift), and exposes MK for the Thor-frame panel.
(()=>{
const app=document.getElementById('app');
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d;}catch(e){return d;}};
let OPT={lay:'B',pv:'two',fb:'bottom',tp:'below',fbw:'box',...load('mkopt',{})};
let TEAM=load('mkteam',null)||[{src:'party',b:0,i:0},{src:'party',b:0,i:1},{src:'party',b:0,i:2},{src:'party',b:0,i:3}];
const keep=()=>{localStorage.setItem('mkteam',JSON.stringify(TEAM));localStorage.setItem('mkopt',JSON.stringify(OPT));};
const same=(a,b)=>a&&b&&a.src===b.src&&(a.src!=='box'||+a.b===+b.b)&&+a.i===+b.i;
const monOf=ref=>{const s=CALC.state();if(ref.src==='party')return s.imp?.party?.[ref.i];if(ref.src==='box')return s.imp?.boxes?.[ref.b]?.[ref.i];return s.custom?.[ref.i];};
const refOf=el=>({src:el.dataset.src,b:+el.dataset.b||0,i:+el.dataset.i});
const wide=()=>innerWidth>=480;

function teamRow(){
 const mine=CALC.state().mine;TEAM=TEAM.filter(monOf);
 const cells=[0,1,2,3,4,5].map(n=>{const ref=TEAM[n];if(!ref)return `<button class="mks mkempty" data-t="${n}" aria-label="Empty team slot"></button>`;
  const m=monOf(ref),name=byId[m.id]?.n||'?';
  return `<button class="mks ${same(ref,mine)?'on':''}" data-t="${n}" data-a="mpick" data-src="${ref.src}" data-b="${ref.b||0}" data-i="${ref.i}" aria-label="${name}">${spr(m.id,'s28')}<span>${m.l}</span></button>`;}).join('');
 return `<div class="dstrip fs mkrow">${cells}</div>`;}

// Grid areas per layout: narrow (< 480, page scrolls) and wide (two columns, one window).
function areas(){
 const w=wide(),top=OPT.fb==='top',L=OPT.lay;
 if(w){const side=OPT.fbw==='box';const rows=side?['ban ban','box tside','fight tside','cm cf','mv mf']:['ban ban','box tside',...(top?['fight fight']:[]),'cm cf','mv mf',...(top?[]:['fight fight'])];
  return {cols:'minmax(0,1fr) minmax(0,1fr)',rows,sizes:rows.map(r=>r==='box tside'?'minmax(0,1fr)':'auto')};}
 if(L==='B'){const open=!!app.querySelector('.dmatch>.cc .ed');const rows=['ban ban','box box','tside tside',...(top?['fight fight']:[]),'team foe',...(open?['cm cm','cf cf']:['cm cf']),'mv mv',...(top?[]:['fight fight'])];return {cols:'minmax(0,1fr) minmax(0,1fr)',rows};}
 const rows=['ban','box','team','tside',...(top?['fight']:[]),'cm','cf','mv',...(top?[]:['fight'])];return {cols:'minmax(0,1fr)',rows};}

function apply(){
 if(location.hash!=='#/calc')return;const fit=app.querySelector('.fit');if(!fit||!window.CALC)return;
 app.classList.add('mk');['A','B','C'].forEach(l=>app.classList.toggle('mk-'+l,OPT.lay===l));
 ['two','full','off'].forEach(p=>app.classList.toggle('mk-pv-'+p,OPT.pv===p));
 app.classList.toggle('mk-wide',wide());app.classList.toggle('mk-narrow',!wide());app.classList.toggle('mk-fbtop',OPT.fb==='top');
 if(!fit.dataset.mk){fit.dataset.mk=1;
  const sides=fit.querySelectorAll('.top>.dside'),dm=fit.querySelector('.dmatch');
  const team=document.createElement('div');team.className='dside mkteam';fit.appendChild(team);
  const foe=document.createElement('div');foe.className='dside mkfoe';fit.appendChild(foe);
  const fight=app.querySelector('.dfight');if(fight)fit.appendChild(fight);
  const set=(el,a)=>{if(el)el.style.gridArea=a;};
  set(fit.querySelector(':scope>.ban'),'ban');set(sides[0],'box');set(sides[1],'tside');set(team,'team');set(foe,'foe');set(fight,'fight');
  const cards=dm?dm.querySelectorAll(':scope>.cc'):[],res=dm?dm.querySelectorAll(':scope>.dres'):[];
  set(cards[0],'cm');set(cards[1],'cf');set(res[0],'mv');set(res[1],'mf');
 }
 const fit2=fit,sides=fit2.querySelectorAll('.top>.dside'),foe=fit2.querySelector('.mkfoe'),strip=fit2.querySelector('.dstrip.fs:not(.mkrow):not(.mg .dstrip)')||sides[1]?.querySelector('.dstrip');
 // A / C narrow keep the foe strip inside the trainer panel (one box); B and wide give it its own cell.
 const own=wide()||OPT.lay==='B';if(strip){if(own&&strip.parentElement!==foe)foe.appendChild(strip);if(!own&&strip.parentElement===foe)sides[1].appendChild(strip);}
 foe.style.display=own&&!wide()?'':'none';fit2.querySelector('.mkteam').style.display=wide()?'none':'';
 if(!wide()){const res=fit2.querySelectorAll('.dmatch>.dres');res.forEach(r=>r.style.gridArea='mv');}else{const res=fit2.querySelectorAll('.dmatch>.dres');if(res[1])res[1].style.gridArea='mf';}
 const g=areas();fit2.style.gridTemplateColumns=g.cols;fit2.style.gridTemplateAreas=g.rows.filter(r=>r.split(' ')[0]!=='ban'||fit2.querySelector(':scope>.ban')).map(r=>`"${r}"`).join(' ');
 fit2.style.gridTemplateRows=g.sizes?g.rows.filter(r=>r.split(' ')[0]!=='ban'||fit2.querySelector(':scope>.ban')).map(r=>r==='box tside'?'minmax(0,1fr)':'auto').join(' '):'';
 fit2.querySelector('.mkteam').innerHTML=teamRow();
 // A narrow: a copy of the row lives at the top of the trainer panel.
 sides[1]?.querySelector(':scope>.mkrow')?.remove();sides[0]?.querySelector(':scope>.mkbox')?.remove();
 // Wide: my team row is part of the box panel, split off by a line (below or above the grid).
 if(wide()&&sides[0]){const w=document.createElement('div');w.className='mkbox mk'+OPT.tp;w.innerHTML=teamRow();if(OPT.tp==='above')sides[0].querySelector('.tools')?.after(w);else sides[0].appendChild(w);}if(OPT.lay==='A'&&!wide()&&sides[1])sides[1].insertAdjacentHTML('afterbegin',teamRow());
 // Box cells already in the team get a dot.
 fit2.querySelectorAll('.mg .dstrip button[data-a="mpick"]').forEach(b=>b.classList.toggle('mkin',TEAM.some(r=>same(r,refOf(b)))));
 const cards=fit2.querySelectorAll('.dmatch>.cc');if(cards[0])cards[0].classList.toggle('mkname',!TEAM.some(r=>same(r,CALC.state().mine)));
 measure();}

// Readout for the panel: does the first frame hold my team, foe team, both cards, four moves and the fight bar?
function frameTop(){const w=wide();if(w)return 0;const el=OPT.lay==='B'||OPT.lay==='A'?app.querySelector('.top>.dside:not(.mg)'):app.querySelector('.mkteam');return el?el.getBoundingClientRect().top+scrollY-1:0;}
function measure(){const need=['.mkrow','.dmatch>.cc:nth-of-type(1)','.dmatch>.cc:nth-of-type(2)','.dfight',wide()?'.dmatch>.dres':'.dmatch>.dres:not(.na)'].map(s=>[...app.querySelectorAll(s)]).flat();
 const foeStrip=app.querySelector('.mkfoe .dstrip')||app.querySelector('.top>.dside:not(.mg) .dstrip');if(foeStrip)need.push(foeStrip);
 const top=frameTop()-(wide()?0:0),y=wide()?0:top;let bottom=0;need.forEach(el=>{const r=el.getBoundingClientRect();bottom=Math.max(bottom,r.bottom+scrollY-(wide()?0:y));});
 const res=[...app.querySelectorAll(wide()?'.dmatch>.dres .mr':'.dmatch>.dres:not(.na) .mr')];
 window.MK.fit={need:Math.round(bottom),have:innerHeight,top:Math.round(y)};}
const goFirst=()=>requestAnimationFrame(()=>{if(!wide())scrollTo(0,frameTop());});

// Drag and drop: touch / pen = press and hold 250 ms without moving (a move first is a scroll); mouse = move 5 px.
let D=null,SUPPRESS=0;
const ghostOf=src=>{const g=src.cloneNode(true);g.classList.add('mkghost');g.removeAttribute('data-a');const r=src.getBoundingClientRect();g.style.width=r.width+'px';g.style.height=r.height+'px';document.body.appendChild(g);return g;};
function start(){D.on=true;D.ghost=ghostOf(D.el);D.el.classList.add('mklift');document.body.classList.add('mkdrag');move(D.x,D.y);}
function target(x,y){D.ghost.style.display='none';const el=document.elementFromPoint(x,y);D.ghost.style.display='';return el?.closest('.mkrow .mks')||null;}
function move(x,y){D.x=x;D.y=y;D.ghost.style.transform=`translate(${x-D.ghost.offsetWidth/2}px,${y-D.ghost.offsetHeight*0.9}px) scale(1.2)`;
 const t=target(x,y);document.querySelectorAll('.mks.over').forEach(e=>e!==t&&e.classList.remove('over'));if(t)t.classList.add('over');
 D.ghost.classList.toggle('mkrm',D.from==='team'&&!t);
 cancelAnimationFrame(D.raf);const edge=40;if(!wide()&&(y<edge||y>innerHeight-edge)){const step=y<edge?-6:6;const loop=()=>{if(!D?.on)return;scrollBy(0,step);D.raf=requestAnimationFrame(loop);};D.raf=requestAnimationFrame(loop);}}
function drop(){const t=target(D.x,D.y),ref=refOf(D.el);
 if(D.from==='team'){const n=+D.el.dataset.t;if(!t)TEAM.splice(n,1);else{const m=+t.dataset.t;if(m>=TEAM.length){TEAM.push(TEAM.splice(n,1)[0]);}else{[TEAM[n],TEAM[m]]=[TEAM[m],TEAM[n]];}}}
 else if(t){const m=+t.dataset.t,at=TEAM.findIndex(r=>same(r,ref));if(at>=0){if(m<TEAM.length&&m!==at)[TEAM[at],TEAM[m]]=[TEAM[m],TEAM[at]];}else if(m<TEAM.length)TEAM[m]=ref;else TEAM.push(ref);}
 TEAM=TEAM.slice(0,6);keep();end();apply();}
function end(){if(!D)return;clearTimeout(D.timer);cancelAnimationFrame(D.raf);if(D.on){SUPPRESS=Date.now();D.ghost.remove();D.el.classList.remove('mklift');document.body.classList.remove('mkdrag');document.querySelectorAll('.mks.over').forEach(e=>e.classList.remove('over'));}D=null;}
document.addEventListener('pointerdown',e=>{if(location.hash!=='#/calc'||e.button>0)return;const el=e.target.closest('.mg .dstrip button[data-a="mpick"],.mkrow .mks[data-a]');if(!el)return;
 D={el,from:el.classList.contains('mks')?'team':'box',x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,mouse:e.pointerType==='mouse',on:false,id:e.pointerId};
 if(!D.mouse)D.timer=setTimeout(()=>{if(D&&!D.on)start();},250);},true);
document.addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.id)return;if(D.on){move(e.clientX,e.clientY);return;}
 const dist=Math.hypot(e.clientX-D.x0,e.clientY-D.y0);if(D.mouse&&dist>5){D.x=e.clientX;D.y=e.clientY;start();}else if(!D.mouse&&dist>8)end();},true);
document.addEventListener('pointerup',e=>{if(!D||e.pointerId!==D.id)return;if(D.on)drop();else end();},true);
document.addEventListener('pointercancel',()=>end(),true);
document.addEventListener('touchmove',e=>{if(D?.on)e.preventDefault();},{passive:false,capture:true});
document.addEventListener('contextmenu',e=>{if(e.target.closest('.mg .dstrip button,.mkrow .mks'))e.preventDefault();},true);
document.addEventListener('click',e=>{if(Date.now()-SUPPRESS<400&&e.target.closest('.mg .dstrip,.mkrow')){e.stopPropagation();e.preventDefault();}},true);

new MutationObserver(()=>apply()).observe(app,{childList:true});
addEventListener('resize',()=>{const f=app.querySelector('.fit');if(f)apply();});
addEventListener('hashchange',()=>{if(location.hash==='#/calc')goFirst();});
window.MK={get opt(){return {...OPT};},set(o){OPT={...OPT,...o};keep();apply();goFirst();},team:()=>TEAM.slice(),clearTeam(){TEAM=[];keep();apply();},fillParty(){TEAM=[0,1,2,3,4,5].map(i=>({src:'party',b:0,i}));keep();apply();},first:goFirst,stress(){CALC.set('mine','status','tox');CALC.set('mine','i','Sitrus Berry');const m=CALC.mon('mine');CALC.render();CALC.set('mine','hp',40);CALC.render();},calm(){CALC.set('mine','status','');CALC.set('mine','i','');CALC.set('mine','hp',null);CALC.render();},measure:()=>{measure();return window.MK.fit;}};
apply();goFirst();
})();

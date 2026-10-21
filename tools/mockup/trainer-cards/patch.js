// Trainer cards mockup layer over the real Photonic Sun build (runs after the guide's own script, in the Thor frame).
// Options (html data attributes, saved in localStorage 'mocktc', set by the panel through setOption):
//   cd  card design: now | A boxed compact | B pager (sprite strip, one Pokémon at a time) | C accordion rows | D flat list
//   pv  preview sprite size under each trainer row: now (32, wraps 5 + 1) | 28 | 24 | 20, always 6 across
//   hd  place header: now | slim (one line, the cap tag stays in the cap line under it)
//   rp  repeated trainer name / place / tags inside an opened card: show | hide (the row above already says them)
//   sw  Show row (Places | Trainers | Teams): pinned (now) | scrolls away
(function(){
 const R=document.documentElement,K='mocktc';
 const DEF={cd:'B',pv:'24',hd:'slim',rp:'hide',sw:'pin',sp:'500'};
 const O=Object.assign({},DEF);try{Object.assign(O,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
 const apply=()=>{for(const k in O)R.dataset[k]=O[k];R.style.setProperty('--ms',(O.pv==='now'?32:+O.pv)+'px');};
 apply();

 // ---- search as the top button of the rail (opens the same full-window search as the search box)
 const rail=document.getElementById('rail');
 if(rail&&!document.getElementById('t-s')){const a=document.createElement('a');a.href='#';a.id='t-s';a.setAttribute('aria-label','Search');a.title='Search';
  a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M16 16l4.5 4.5"/></svg>';
  a.onclick=e=>{e.preventDefault();document.getElementById('q').click();};rail.insertBefore(a,rail.firstChild);}
 const _mc=monCard;
 // ---- Pokémon blocks. Same content as the template's monCard, laid out for each design.
 monCard=function(x,cap){
  if(O.cd==='now')return _mc(x,cap);
  const p=byId[x.id];const lv=x.l!=null?x.l:x.r!=null&&cap?cap+x.r:NaN;
  const sp=e=>p&&lv?stat(p.s[5],5,x.iv[5],e,lv,x.na):null;const s0=sp(0),s1=EVS?sp(x.ev[5]):s0;
  const main=MGM?s0:s1,alt=MGM?s1:s0;
  const spd=main==null?'':`<span class="spd"><span class="nw">Spe <b>${main}</b>${x.ia?'<span class="mut" title="IVs assumed 31">*</span>':''}</span>${alt!==main?` <span class="mut small">${MGM?'with EVs':'no EVs'} ${alt}</span>`:''}${/choice scarf/i.test(x.i)?` <span class="mut small">Scarf ${Math.floor(main*1.5)}</span>`:''}</span>`;
  const lvs=x.l!=null||x.r==null?`Lv ${x.l??'?'}`:`Lv ${lv||'?'} <span class="mut small">cap${x.r?(x.r>0?'+':'−')+Math.abs(x.r):''}</span>`;
  const tags=(x.ld?`<span class="tag">Lead ${x.ld}</span>`:'')+(x.pre||[]).map(z=>`<span class="tag warnb">${esc(PRE[z]||z)}</span>`).join('')+(x.src==='s'?'<span class="tag">sheet only</span>':'');
  const ab=x.ao?esc(x.ao):(x.a0!=null&&x.a0>=0?alink(x.a0)+' → ':'')+(x.a>=0?alink(x.a):'');
  const abl=`${ab}${x.i?' · '+esc(x.i):''}${x.na?` · <span title="${esc(natLabel(x.na))}">${esc(x.na)}</span>`:''}`;
  const iv=x.iv.every(v=>v===31)?'':`IVs ${x.iv.join('/')}`;const ev=EVS&&x.ev?evTxt(x.ev):'';
  const extra=ev?`EVs ${ev}`:''; // IVs left out (the user, 2026-10-21)
  const nm=p?`<a href="#/p/${x.id}">${esc(p.name)}</a>`:esc(x.s||'?');
  const types=p?p.t.map(ty).join(''):'';
  const mv=x.m.map(i=>`<a href="#/m/${i}"><span class="dot" style="background:${tcol(M[i]==='Hidden Power'&&x.hp?x.hp:(MV[i]||{}).t)}"></span>${M[i]==='Hidden Power'&&x.hp?'HP '+esc(x.hp):esc(M[i])}</a>`).join('');
  const tail=(extra?`<div class="mut small ex">${extra}</div>`:'')+((x.x||[]).length?`<div class="mut small ex">Sheet: ${x.x.map(esc).join('; ')}</div>`:'')+((x.cf||[]).length?`<div class="cfx">Sheet says ${x.cf.map(esc).join('; ')}</div>`:'');
  if(O.cd==='C')
   return `<details class="mon m2 mC"><summary>${spr(x.id,'s32')}<span class="cm"><span class="cn">${p?esc(p.name):esc(x.s||"?")}</span><span class="cl"><b class="lv">${lvs}</b>${main!=null?` · Spe <b>${main}</b>`:""}</span></span></summary>
    <div class="cb"><div class="l2">${nm} ${types}${tags}${spd&&alt!==main||x.t0||/scarf/i.test(x.i||'')?' '+spd:''}</div><div class="small ab">${abl}</div><div class="mv">${mv}</div>${tail}</div></details>`;
  return `<div class="mon m2"><div class="mh">${spr(x.id,'s32')}<div class="mt"><div class="l1">${nm} <b>${lvs}</b></div><div class="l2">${types}${tags} ${spd}</div></div></div>
   <div class="small ab">${abl}</div><div class="mv">${mv}</div>${tail}</div>`;};
 // ---- DOM upgrades after each render: card header hide, B's strip, C's "all" button, slim place header
 const slim=()=>{document.querySelectorAll('.stoph:not([data-w])').forEach(s=>{s.dataset.w=1;
   const t=[...s.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(!t)return;
   const sp=document.createElement('span');sp.className='pn';sp.textContent=t.textContent.trim();s.replaceChild(sp,t);});};
 const upgrade=()=>{
  if(O.rp==='hide')document.querySelectorAll('details.trd .trc:not([data-m])').forEach(c=>{c.dataset.m=1;
   const d=c.closest('details.trd'),n=(d.dataset.ks||d.dataset.k).split(',').length;
   const h=c.querySelector(':scope>.trn');
   if(n<2){if(h)h.remove();} else if(h){h.classList.add('trn2');const l=h.querySelector('.mut');if(l)l.remove();}
   const tg=h&&h.nextElementSibling;
   const tags=c.querySelector(':scope>div[style*="margin:-2px"]');
   if(tags){tags.querySelectorAll('.tag').forEach(z=>{if(!/^If your starter/.test(z.textContent))z.remove();});if(!tags.children.length)tags.remove();}});
  document.querySelectorAll('.trc:not([data-m]),.ptd:not([data-m])').forEach(c=>c.dataset.m=1);
  if(O.cd==='B')document.querySelectorAll('.team:not([data-s])').forEach(t=>{t.dataset.s=1;const ms=[...t.children].filter(m=>m.classList.contains('mon'));
   if(ms.length<2)return;t.classList.add('tB');
   const bar=document.createElement('div');bar.className='tpick';
   bar.innerHTML=ms.map((m,i)=>`<button type="button" data-i="${i}"${i?'':' class="on"'}>${m.querySelector('.spr').outerHTML}<small>${(m.querySelector('.l1 b')||{textContent:''}).textContent.replace(/^Lv\s*/,'')}</small></button>`).join('');
   ms[0].classList.add('sel');t.parentNode.insertBefore(bar,t);});
  if(O.cd==='C')document.querySelectorAll('.team:not([data-s])').forEach(t=>{t.dataset.s=1;if([...t.children].filter(m=>m.classList.contains('mC')).length<2)return;
   const b=document.createElement('button');b.type='button';b.className='tall';b.textContent='Open all';t.parentNode.insertBefore(b,t);});
  if(O.hd==='slim'){slim();document.querySelectorAll('.stoph').forEach(s=>{const pt=s.querySelector('.pt'),c=s.querySelector('.capg');
    if(!pt)return;const m=c&&c.textContent.match(/\d+/);if(m)pt.dataset.cap=m[0];else delete pt.dataset.cap;
    if(/^teams /.test(pt.textContent))pt.textContent=pt.textContent.replace(/^teams /,'');});}};
 new MutationObserver(upgrade).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('click',e=>{
  const b=e.target.closest('.tpick button');
  if(b){const bar=b.parentNode,t=bar.nextElementSibling;[...bar.children].forEach(x=>x.classList.toggle('on',x===b));
   [...t.children].forEach((m,i)=>m.classList.toggle('sel',i==b.dataset.i));return;}
  const a=e.target.closest('.tall');
  if(a){const t=a.nextElementSibling,ds=[...t.querySelectorAll('details.mC')],all=ds.every(d=>d.open);ds.forEach(d=>d.open=!all);a.textContent=all?'Open all':'Close all';}});
 window.setOption=(k,v)=>{O[k]=v;try{localStorage.setItem(K,JSON.stringify(O))}catch(e){}apply();
  document.querySelectorAll('[data-m],[data-s],[data-w]').forEach(e=>{if(!e.matches('.stoph'))e.removeAttribute('data-m');});
  rerender();};
 // ---- demo jumps: box index, place index, name of the trainer to open (or '' for none, 'all' for every card)
 window.demo=(gi,si,who)=>{
  if(location.hash!=='#/trainers'){location.hash='#/trainers';return setTimeout(()=>demo(gi,si,who),900);}
  const b=app.querySelector(`details.split[data-gi="${gi}"]`);if(!b)return;if(!b.open){b.open=true;TOG.trainers(b);}
  setTimeout(()=>{const p=b.querySelector(`details.stopd[data-k="${gi}.${si}"]`);if(!p)return;if(!p.open)p.open=true;
   setTimeout(()=>{p.querySelectorAll('details.trd').forEach(d=>{const w=who==='all'||(who&&d.querySelector('summary').textContent.includes(who));if(w!==d.open)d.open=w;});
    const o=who&&who!=='all'&&[...p.querySelectorAll('details.trd')].find(d=>d.open);setTimeout(()=>land(o?o.querySelector(':scope>summary'):p.querySelector(':scope>summary')),300);},300);},500);};
 // ===== Round 3 =====
 // Trainers header: MGM, the caps switch visible, caps table behind "Level caps"; no explanatory text
 const _th=trHead;
 trHead=function(){
  if(!(typeof TRD!=='undefined'&&TRD.mini))return _th();
  const rows=TRD.mini.filter(c=>CSET?!c[4]:c[3]==='trial');
  return `<div class="card trh2"><div class="r1">${EVS?`<label><input type="checkbox" id="mgm" ${MGM?'checked':''}> MGM</label>`:''}${PICK?starterSel('tk-starter').replace('Not chosen','Starter'):''}
   <div class="capsw" role="group" aria-label="Level caps"><button data-s="0" aria-pressed="${!CSET}">Trials</button><button data-s="1" aria-pressed="${!!CSET}">+ Mini caps</button></div></div>
   <details class="capsd" ${CAPSO?'open':''}><summary class="mut small">Level caps</summary>
   <table class="itbl capt">${rows.map(c=>`<tr class="${c[3]}"><td>${esc(c[0])}<div class="mut small">${esc(c[1])}${c[3]==='mini'?' <span class="tag">mini</span>':''}</div></td><td class="n"><b>${c[2]}</b></td></tr>`).join('')}</table></details></div>`;};
 // no intro lines, no dupes-clause note
 const clean=()=>{
  document.querySelectorAll('#app>.mut.small').forEach(e=>e.remove());
  document.querySelectorAll('#app .mut.small').forEach(e=>{if(/dupes clause on whole evolution lines/.test(e.textContent)&&!e.children.length)e.textContent=e.textContent.replace(/\s*·\s*dupes clause on whole evolution lines/,'');});
  walkBadges();};
 // walkthrough: a stop with trainers shows "n/N | cap" in its sticky header (the button opens / closes all its cards)
 let CAPM=null;
 const capMap=()=>{if(CAPM)return CAPM;CAPM={};try{TRD.g.forEach(g=>g.sec.forEach(s=>{const c=s.cap&&s.cap[CSET];s.tr.forEach(t=>{if(c)CAPM[t.k]=c[0];});}));}catch(e){}return CAPM;};
 function walkBadges(){
  if(document.body.dataset.v!=='walk')return;
  document.querySelectorAll('details.stopd').forEach(d=>{
   const sm=d.querySelector(':scope>summary'),ts=[...d.querySelectorAll('details.trd')];
   let b=sm.querySelector('.pt.wk');
   if(!ts.length){if(b)b.remove();return;}
   sm.querySelectorAll(':scope>.tag').forEach(t=>{if(/trainer|battle|fight|boss|rival|grunt|^\d+\s/i.test(t.textContent))t.remove();});
   if(!b){b=document.createElement('button');b.type='button';b.className='pt wk';b.onclick=e=>{e.preventDefault();e.stopPropagation();
     const all=[...d.querySelectorAll('details.trd')],full=all.every(x=>x.open);if(!d.open)d.open=true;all.forEach(x=>{if(x.open===full)x.open=!full;});setTimeout(walkBadges,50);};
    sm.insertBefore(b,sm.firstChild);}
   const n=ts.filter(x=>x.open).length,m=ts.map(x=>capMap()[(x.dataset.ks||x.dataset.k).split(',')[0]]).filter(Boolean),cap=m.length?Math.max(...m):'';
   const tx=n+'/'+ts.length+(cap?' | '+cap:'');if(b.textContent!==tx)b.textContent=tx;
   b.classList.toggle('on',n===ts.length);b.classList.toggle('part',n>0&&n<ts.length);});}
 document.addEventListener('toggle',()=>setTimeout(walkBadges,30),true);
 new MutationObserver(clean).observe(document.getElementById('app'),{childList:true,subtree:true});
 // startup rerender: pages drawn before this layer loaded pick up the new functions
 setTimeout(()=>{try{rerender();}catch(e){}clean();},0);
 // ---- search bar / spacing sliders (--sbh height px, --sbf font px, --g gap px)
 const VK='mocktcv',V=Object.assign({sbh:30,sbf:13,g:6},JSON.parse(localStorage.getItem(VK)||'{}'));
 const applyV=()=>{R.style.setProperty('--sbh',V.sbh+'px');R.style.setProperty('--sbf',V.sbf+'px');R.style.setProperty('--g',V.g+'px');};
 applyV();
 window.setVar=(k,v)=>{V[k]=+v;applyV();try{localStorage.setItem(VK,JSON.stringify(V))}catch(e){}};
 window.getVars=()=>V;
})();

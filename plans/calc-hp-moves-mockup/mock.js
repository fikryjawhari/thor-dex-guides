// Mockup layer over the built EI guide (plans/calc-hp-moves-mockup): HP-changing moves. Values come from simple
// formulas here, not the engine. Variant 'a': the chip is one use (the target loses the top roll, the user gets the
// matching change). Variant 'b': the chip is the user's own change only; the opened row's HP −min / −max buttons also
// apply the matching change.
(function(){
const OPT={set:'self',variant:'a'};
const SETS={
  fixed:['Seismic Toss','Super Fang','Endeavor','Counter'],
  self:['Soft-Boiled','Double-Edge','Drain Punch','Belly Drum'],
  swap:['Pain Split','Mind Blown','Wish','Explosion'],
};
const SELF={ // kind, amount(user max, user now, target now, top roll dealt) -> signed change to the user
  'Soft-Boiled':['heal',(mx)=>Math.floor(mx/2)],'Recover':['heal',(mx)=>Math.floor(mx/2)],
  'Wish':['heal',(mx)=>Math.floor(mx/2),'next turn'],
  'Belly Drum':['cost',(mx)=>-Math.floor(mx/2)],'Substitute':['cost',(mx)=>-Math.floor(mx/4)],
  'Mind Blown':['cost',(mx)=>-Math.ceil(mx/2)],'Explosion':['cost',(mx,now)=>-now],
  'Double-Edge':['recoil',(mx,now,t,dealt)=>-Math.max(1,Math.round(dealt/3))],
  'Drain Punch':['drain',(mx,now,t,dealt)=>Math.max(1,Math.round(dealt/2))],
  'Pain Split':['split',null],
};
const FIXED={'Seismic Toss':(lv)=>lv,'Super Fang':(lv,u,t)=>Math.max(1,Math.floor(t/2)),'Endeavor':(lv,u,t)=>Math.max(0,t-u)};
const hpBox=s=>document.querySelector(`[data-hp="${s}"]`);
const maxOf=s=>Number(hpBox(s)?.closest('.cl')?.querySelector('.mx')?.textContent.replace(/\D/g,''))||Number(hpBox(s)?.max)||0;
const setHp=(s,v)=>{const b=hpBox(s);b.value=String(Math.max(0,Math.min(maxOf(s),v)));b.dispatchEvent(new Event('change',{bubbles:true}));};
const now=s=>Number(hpBox(s)?.value)||0;
const signed=v=>v>0?'+'+v:v<0?'−'+(-v):'±0';
let busy=false;
function decorate(){
  if(busy||!document.querySelector('.dres'))return;busy=true;
  try{
    const um=maxOf('mine'),un=now('mine'),tm=maxOf('foe'),tn=now('foe');
    const lv=Number(document.querySelector('.cc[data-s="mine"] [data-lv]')?.value)||50;
    document.querySelectorAll('.dres:not(.na) .mr').forEach(row=>{
      if(row.dataset.mk)return;row.dataset.mk=1;
      const name=row.querySelector('.mv')?.textContent.trim(),hp=row.querySelector('.r1 .hp');
      if(!name||!hp)return;
      if(FIXED[name]){
        const v=Math.min(tn,FIXED[name](lv,un,tn));row.classList.remove('st');
        hp.textContent=String(v);
        if(!row.querySelector('.r2'))row.querySelector('.r1').insertAdjacentHTML('afterend',`<div class="r2"><span>${(v*100/tm).toFixed(1)}%</span><span class="ko">${v>=tn?'OHKO':Math.ceil(tn/Math.max(1,v))+'HKO'}</span></div>`);
      }
      if(name==='Counter'){
        row.classList.remove('st');hp.textContent='2× taken';
        if(!row.querySelector('.r2'))row.querySelector('.r1').insertAdjacentHTML('afterend',`<div class="r2"><span>type what it took</span><span></span></div>`);
        const dd=row.querySelector('.dd');if(dd&&!dd.querySelector('.mk-taken'))dd.insertAdjacentHTML('afterbegin',`<div class="mk-taken"><label>Taken <input value="0" inputmode="numeric" style="width:46px"></label> <span class="mut">(power box becomes this)</span></div>`);
      }
      const self=SELF[name];if(!self)return;
      const range=hp.textContent.split('–').map(Number),dealt=Math.min(tn,range[range.length-1]||0);
      let label,apply;
      if(self[0]==='split'){const avg=Math.floor((un+tn)/2);label='↔'+avg;apply=()=>{setHp('mine',avg);setHp('foe',avg);};}
      else{const v=self[1](um,un,tn,dealt);label=signed(v)+(self[2]?' ↻':'');
        apply=()=>{if(OPT.variant==='a'&&dealt)setHp('foe',tn-dealt);setHp('mine',un+v);};}
      const chip=`<button class="dturn mk-chip ${label.startsWith('−')?'dn':'up'}" title="${OPT.variant==='a'&&dealt?'Use once: foe −'+dealt+', you '+label:'Apply to you: '+label}">${label}</button>`;
      if(row.classList.contains('st')){hp.innerHTML=chip;row.querySelector('.mm').style.opacity='1';}
      else{const r2=row.querySelector('.r2');(r2.querySelector('.rz')||r2.firstElementChild).insertAdjacentHTML(r2.querySelector('.rz')?'afterend':'beforebegin',chip);}
      row.querySelector('.mk-chip').addEventListener('click',e=>{e.stopPropagation();apply();},true);
      if(OPT.variant==='b'&&dealt){row.querySelectorAll('[data-a="sub"]').forEach(b=>{const d=Number(b.dataset.v),v=self[1](um,un,tn,Math.min(tn,d));b.textContent=`HP −${d} · you ${signed(v)}`;b.addEventListener('click',()=>setTimeout(()=>setHp('mine',un+v),0));});}
    });
  }finally{busy=false;}
}
function load(){
  const s=CALC.state();let m=s.custom.find(x=>x.mk);
  if(!m){CALC.use(P.find(e=>e.n==='Blissey'));m=s.custom.at(-1);m.mk=1;}
  m.l=50;m.hp=undefined;m.m=SETS[OPT.set].map(n=>M.indexOf(n));s.mine={src:'custom',b:0,i:s.custom.indexOf(m)};
  CALC.enter((TRS.find(t=>t.p.length&&t.p.every(p=>p.l>=45))||TRS.at(-1)).k,0);s.dir='out';CALC.render();
}
window.setOption=(k,v)=>{OPT[k]=v;if(k==='set')load();else CALC.render();};
const css=document.createElement('style');css.textContent='.mk-chip{min-width:max-content;flex:none!important;margin:0 4px 0 0!important;min-height:16px!important;font-size:10.5px!important}.mr .r2 .mk-chip{line-height:14px}.mr.st .hp:has(.mk-chip){overflow:visible;width:auto;min-width:max-content;max-width:none;flex:none;margin-right:2px}.mr.st .hp .mk-chip{min-height:20px!important;margin:0!important}.dturn.dn{color:var(--bad,#e66)}.dturn.up{color:var(--good,#5c5)}';
document.head.appendChild(css);
new MutationObserver(()=>requestAnimationFrame(decorate)).observe(document.body,{subtree:true,childList:true});
addEventListener('load',()=>{location.hash='#/calc';setTimeout(load,300);});
})();

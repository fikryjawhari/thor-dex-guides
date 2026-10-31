// Calc layout prototype: frame-panel switches as body classes, the Δn fight-changes button, short-wide scroll.
(()=>{
 const opts={moves:'l2',short:'auto',fx:'sum'};
 const KEY='calcLayoutProto';try{Object.assign(opts,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
 const isShort=()=>opts.short==='on'||(opts.short==='auto'&&innerWidth>=480&&innerHeight<420);
 const OPEN=new Set();
 const apply=()=>{const b=document.body;for(const c of [...b.classList])if(c.startsWith('px-'))b.classList.remove(c);
  b.classList.add('px-moves-'+opts.moves,'px-fx-'+opts.fx);b.classList.toggle('px-short',opts.short!=='off'&&isShort()&&innerWidth>=480);};
 // Δn: one button per card for this fight's changes (types / ability / item); tap shows the card's chips.
 const deltas=()=>{for(const card of document.querySelectorAll('.dmatch>.cc')){const chips=card.querySelector(':scope>.dfch'),old=card.querySelector('.px-dsum'),n=chips?chips.children.length:0;
  if(!n){old?.remove();card.classList.remove('px-fopen');continue;}
  const btn=old||Object.assign(document.createElement('button'),{className:'px-dsum',type:'button'});if(btn.textContent!=='Δ'+n)btn.textContent='Δ'+n;btn.setAttribute('aria-label',n+' fight changes');btn.setAttribute('aria-expanded',OPEN.has(card.dataset.s));
  if(!old){const line=card.querySelector('.cl'),first=line?.querySelector(':scope>.dvol,:scope>.aum,:scope>.dend');line?(first?first.before(btn):line.append(btn)):card.append(btn);}
  card.classList.toggle('px-fopen',OPEN.has(card.dataset.s));}};
 document.addEventListener('click',e=>{const btn=e.target.closest('.px-dsum');if(!btn)return;e.stopPropagation();e.preventDefault();const s=btn.closest('.cc').dataset.s;OPEN.has(s)?OPEN.delete(s):OPEN.add(s);deltas();},true);
 const mo=new MutationObserver(()=>{mo.disconnect();deltas();mo.observe(document.body,{childList:true,subtree:true});});mo.observe(document.body,{childList:true,subtree:true});
 const toBar=()=>{if(location.hash!=='#/calc'||!document.body.classList.contains('px-short'))return;requestAnimationFrame(()=>{const bar=document.querySelector('.fbar');if(bar)scrollTo(0,bar.getBoundingClientRect().top+scrollY-2);});};
 addEventListener('hashchange',toBar);addEventListener('resize',()=>{const was=document.body.classList.contains('px-short');apply();if(!was&&document.body.classList.contains('px-short'))toBar();});
 window.setOption=(k,v)=>{opts[k]=v;try{localStorage.setItem(KEY,JSON.stringify(opts));}catch(e){}apply();deltas();if(k==='short')toBar();};
 apply();deltas();setTimeout(toBar,300);
})();

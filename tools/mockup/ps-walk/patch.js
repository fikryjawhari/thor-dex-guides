(function(){
 const R=document.documentElement,K='mocksg';
 const get=()=>{try{return localStorage.getItem(K)||'a'}catch(e){return 'a'}};
 R.dataset.sg=get();
 // An empty stop: its body has no section and no note (what the template would test in walkStop).
 function convert(){const app=document.getElementById('app');if(!app)return;
  app.querySelectorAll('details.stopd:not(.emp):not(.chk)').forEach(d=>{if(!/^\d+\.\d+$/.test(d.dataset.k||''))return;d.classList.add('chk');
   const b=d.querySelector(':scope>.stop');if(!b||b.querySelector('.sec,.trnote'))return;
   d.classList.add('emp');const s=document.createElement('div');s.className='sign';s.dataset.k=d.dataset.k;
   s.innerHTML='<span>'+d.querySelector('summary').firstChild.textContent.trim()+'</span>';d.after(s);});
  // first sign of a run (no sign right before it, hidden stops skipped)
  app.querySelectorAll('.sign').forEach(s=>{let p=s.previousElementSibling;while(p&&p.classList.contains('emp'))p=p.previousElementSibling;s.classList.toggle('run0',!(p&&p.classList.contains('sign')));});}
 new MutationObserver(()=>{convert();}).observe(document.documentElement,{childList:true,subtree:true});
 R.style.setProperty('--sgfs',(()=>{try{return localStorage.getItem('mocksgfs')||'15'}catch(e){return '15'}})()+'px');
 window.setSize=n=>{R.style.setProperty('--sgfs',n+'px');try{localStorage.setItem('mocksgfs',n)}catch(e){}};
 window.setOption=(k,v)=>{R.dataset.sg=v;try{localStorage.setItem(K,v)}catch(e){}convert();};
 window.showPart=n=>{if(location.hash!=='#/walk'){location.hash='#/walk';setTimeout(()=>showPart(n),700);return;}const d=document.querySelector('details.split[data-wo="'+(n-1)+'"]');if(!d)return;d.open=true;setTimeout(()=>{convert();d.scrollIntoView();},150);};
})();

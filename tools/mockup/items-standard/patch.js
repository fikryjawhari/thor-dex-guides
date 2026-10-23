// Mockup layer over a real build: swaps D.IT for the standard's data (window.__V, model.py) and re-renders Items.
// setOption('m','cur'|'new') = the guide's own Items now / the standard. setOption('l','plain'|'tint') = row labels.
(()=>{const CUR=D.IT,NEW=window.__V;D.IT=NEW;
const oBox=itemBox;
itemBox=si=>{const h=oBox(si);return h.replace(/(<td>|<br>)(Found|Wild|Shop|Also):/g,'$1<span class="lb">$2:</span>');};
const st=document.createElement('style');
st.textContent='body.tint .lb{color:var(--acc);font-weight:700}';document.head.appendChild(st);
window.setOption=(k,v)=>{if(k==='l'){document.body.classList.toggle('tint',v==='tint');return;}
 if(k!=='m')return;D.IT=v==='cur'?CUR:NEW;
 Object.keys(IO).forEach(x=>{IO[x]={}});try{localStorage.removeItem(LS.items)}catch(e){}
 if(location.hash!=='#/items')location.hash='#/items';else rerender();};
})();

// Mockup layer over the real Photonic Sun build: swaps D.IT for the proposed data (window.__V, model.py) and
// re-renders the Items page. 'cur' = the build's own Items data. The frame's panel calls setOption('m','cur'|'new').
// Also the one template change in the spec: an Expand all / Collapse all bar (.seg.it-sp) at the top of each box that
// has sub-headings, opening or closing that box's sub-headings.
(()=>{const CUR=D.IT,NEW=window.__V;D.IT=NEW;
const oBox=itemBox;
itemBox=si=>{const h=oBox(si);if((h.match(/<details class="sec"/g)||[]).length<2)return h;
 return h.replace(/(<div class="stop">(?:<div class="mut small"[^>]*>[\s\S]*?<\/div>)?)/,'$1'+segBar('it-sp'));};
app.addEventListener('click',e=>{const b=e.target.closest('.seg.it-sp button');if(!b)return;e.stopPropagation();
 segAll(b,b.closest('.stop').querySelectorAll('details.sec'));},true);
window.setOption=(k,v)=>{if(k!=='m')return;D.IT=v==='cur'?CUR:NEW;
 Object.keys(IO).forEach(x=>{IO[x]={}});try{localStorage.removeItem(LS.items)}catch(e){}
 if(location.hash!=='#/items')location.hash='#/items';else rerender();};
})();

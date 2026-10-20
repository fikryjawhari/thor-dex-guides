// Mockup layer over the real Photonic Sun build: swaps D.IT for one of the variants in window.__V (model.py) and
// re-renders the Items page. 'cur' = the build's own Items data. The frame's panel calls setOption(key, value).
(()=>{const V=window.__V,CUR=D.IT,o={m:'cur',s:'S',h:'S',o:'A',t:'F'};
function apply(){D.IT=o.m==='cur'?CUR:V[[o.s,o.h,o.o,o.t].join('.')];
 Object.keys(IO).forEach(k=>{IO[k]={}});try{localStorage.removeItem(LS.items)}catch(e){}
 if(location.hash!=='#/items')location.hash='#/items';else rerender();}
window.setOption=(k,v)=>{o[k]=v;apply();};
})();

(() => {
window.READERS=window.READERS||{};
window.READERS.test=(bytes,data)=>{let result;try{result=JSON.parse(new TextDecoder().decode(bytes));}catch(error){throw {code:'unreadable'};}if(result.magic!=='dexcalc-test')throw {code:'wrong',game:result.game};if(result.error)throw {code:['wrong','state','unreadable','empty'].includes(result.error)?result.error:'unreadable',game:result.game};if(!Array.isArray(result.party)||!result.party.length)throw {code:'empty'};if(!Array.isArray(result.boxes)||result.boxes.some(box=>!Array.isArray(box)))throw {code:'unreadable'};return result;};
})();

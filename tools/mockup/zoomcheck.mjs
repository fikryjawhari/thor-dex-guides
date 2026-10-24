// node tools/mockup/zoomcheck.mjs <guide.html> [kb]: text zoom vs collapse bars, at 260x316 and 480x392 (kb = `dvkb` set).
// Android WebView textZoom (the viewer's A-/A+) scales text, not the viewport, and fires no resize. Headless Chrome has no
// such setting, so zoom() scales every px font-size in the page's rules by a factor: text size changes,
// the viewport and window.resize don't. Limit: only font sizes scale (as in the WebView); px-sized boxes stay.
// For Locations, Trainers and Items (a few block states each), at zoom 1 -> 2 -> .5 -> 1 -> 2 (no toggle in between) it
// compares each bar's shown / hidden state a few frames after the change with what bars() decides after a forced resize.
// Prints the mismatching bars per step and a final pass / fail; page errors too.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from '../browser.mjs';
const [file, kb] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
const browser = await startBrowser({ profilePrefix: 'zoom-', flags: ['--hide-scrollbars'],
  onEvent: message => { if (message.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(message.params.exceptionDetails).slice(0, 600)); } });
const { send } = browser;
try {
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 800)); return m.result?.result?.value; };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
const url = pathToFileURL(resolve(file)).href;
let fails = 0;
for (const [w, h] of [[260, 316], [480, 392]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: false }, sessionId);
  for (const route of ['#/locs', '#/trainers', '#/items']) for (const state of ['all', 'mixed']) {
    await send('Page.navigate', { url: 'about:blank' }, sessionId);
    await send('Page.navigate', { url: url + route }, sessionId); await sleep(1500);
    if (kb) { await ev(`localStorage.setItem('dvkb','1')`); await send('Page.reload', {}, sessionId); await sleep(1500); }
    const res = await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const fr=()=>new Promise(r=>requestAnimationFrame(r));const d=document,o=[];
     // the zoom shim: original px font sizes are kept, each step rewrites them from the originals
     const rules=[];const walk=l=>[...l].forEach(r=>{if(r.style&&/px$/.test(r.style.fontSize))rules.push([r,parseFloat(r.style.fontSize)]);if(r.cssRules)walk(r.cssRules);});
     [...d.styleSheets].forEach(s=>{try{walk(s.cssRules);}catch{}});
     const zoom=f=>rules.forEach(([r,px])=>{r.style.fontSize=(px*f)+'px';});
     const dets=()=>[...d.querySelectorAll('details')];
     // block states: all open, or about every third one closed (pseudo-random by index; closed parents hide their bars)
     dets().forEach((x,i)=>{x.open=${JSON.stringify(state)}==='all'||(i*7+3)%3!==0;});
     // open boxes can be far down a long page: stay at the top and use what is rendered there
     scrollTo(0,0);await sleep(600);
     const snap=()=>[...d.querySelectorAll('.endbar')].map(b=>b.hidden?0:1);
     const tag=i=>{const b=d.querySelectorAll('.endbar')[i];const x=b.closest('details');return b.className.replace('endbar ','')+':'+((x.querySelector('summary')||x).textContent.trim().slice(0,22));};
     const total=d.querySelectorAll('.endbar').length;
     if(!total)return 'no bars on this page';
     for(const f of [1,2,.5,1,2]){zoom(f);await fr();await fr();await fr();await sleep(80);
      const got=snap();d.defaultView.dispatchEvent(new Event('resize'));await fr();await fr();await sleep(80);const want=snap();
      const bad=got.map((g,i)=>g!==want[i]?i:-1).filter(i=>i>=0);
      o.push('zoom '+f+': bars '+total+' shown(fresh) '+want.filter(Boolean).length+' stale '+bad.length+(bad.length?' ['+bad.slice(0,6).map(i=>tag(i)+(got[i]?' extra':' missing')).join('; ')+']':''));}
     return o.join('\\n');})()`);
    const bad = /stale [1-9]/.test(res);
    console.log(`${w}x${h}${kb ? ' dvkb' : ''} ${route} ${state}:\n${res.split('\n').map(l => '  ' + l).join('\n')}`);
    if (bad) fails++;
  }
}
console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
console.log(fails ? `FAIL: ${fails} page states with stale bars` : 'PASS: bars follow text zoom');
process.exitCode = fails || errs.length ? 1 : 0;
} finally { await browser.close(); }

// node tools/mockup/zoomcheck.mjs <guide.html> [kb]: text zoom vs collapse bars, at 260x316 and 480x392 (kb = `dvkb` set).
// Android WebView textZoom (the viewer's A-/A+) scales text, not the viewport, and fires no resize. Headless Chrome has no
// such setting, so zoom() scales every px font-size in the page's rules by a factor: text size changes,
// the viewport and window.resize don't. Limit: only font sizes scale (as in the WebView); px-sized boxes stay.
// For Locations, Trainers and Items (a few block states each), at zoom 1 -> 2 -> .5 -> 1 -> 2 (no toggle in between) it
// compares each bar's shown / hidden state a few frames after the change with what bars() decides after a forced resize.
// Prints the mismatching bars per step and a final pass / fail; page errors too. Stale states are retried once after
// the pass (in-check, like jumpcheck): only a second failure counts.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { navigate, startBrowser } from '../browser.mjs';
const [file, kb] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
const browser = await startBrowser({ profilePrefix: 'zoom-', flags: ['--hide-scrollbars'],
  onEvent: message => { if (message.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(message.params.exceptionDetails).slice(0, 600)); } });
const { send } = browser;
try {
const url = pathToFileURL(resolve(file)).href;
const SIZES = [[260, 316], [480, 392]], ROUTES = ['#/locs', '#/trainers', '#/items'], STATES = ['all', 'mixed'];
const KEYS = SIZES.flatMap(([w, h]) => ROUTES.flatMap(route => STATES.map(state => ({ w, h, route, state, key: `${w}x${h}${kb ? ' dvkb' : ''} ${route} ${state}` }))));

// One pass in a fresh browser context (clean storage), every state in order in one tab, up to the last of `count`
// (default: all). Saved state carries from one state to the next (some states show bars only because of it), so a
// retry replays the run up to the state it retries. Returns {key: report} for the states counted.
async function pass(count = null) {
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 800)); return m.result?.result?.value; };
  await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
  const last = count ? Math.max(...KEYS.map((k, i) => (count.has(k.key) ? i : -1))) : KEYS.length - 1;
  const out = {};
  try {
    for (const { w, h, route, state, key } of KEYS.slice(0, last + 1)) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: false }, sessionId);
      // waits are for the boot, not a fixed 1.5 s
      await send('Page.navigate', { url: 'about:blank' }, sessionId);
      await navigate(send, sessionId, url + route);
      if (kb) { await ev(`localStorage.setItem('dvkb','1')`); await send('Page.navigate', { url: 'about:blank' }, sessionId); await navigate(send, sessionId, url + route); }
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
      if (!count || count.has(key)) out[key] = res;
    }
  } finally {
    await send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  }
  return out;
}

const stale = res => /stale [1-9]/.test(res);
const first = await pass();
const indent = text => text.split('\n').map(line => '  ' + line).join('\n');
for (const [key, res] of Object.entries(first)) console.log(`${key}:\n${indent(res)}`);
// Under load a bar can be read before bars() has run (fewer frames in the wait): the stale states are retried once,
// after the pass, in a fresh context; only a second failure counts. Retried states are named, so a state that keeps
// needing it shows (the Thor is slower than this PC).
const failed = new Set(Object.keys(first).filter(key => stale(first[key])));
let fails = failed.size;
if (failed.size) {
  console.log(`RETRY ${failed.size} stale state(s) in a fresh context: ${[...failed].join(' | ')}`);
  const again = await pass(failed);
  fails = 0;
  for (const key of failed) {
    const bad = stale(again[key]);
    if (bad) fails++;
    console.log(`retry ${key}: ${bad ? 'STALE AGAIN' : 'fresh (a timing flake)'}\n${indent(again[key])}`);
  }
}
console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
console.log(fails ? `FAIL: ${fails} page states with stale bars${failed.size ? ' (retried)' : ''}` : `PASS: bars follow text zoom${failed.size ? ` (${failed.size} passed on retry: ${[...failed].join(' | ')})` : ''}`);
process.exitCode = fails || errs.length ? 1 : 0;
} finally { await browser.close(); }

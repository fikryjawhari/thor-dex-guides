// node tools/mockup/jumpcheck.mjs <guide.html> [kb] [N] [T]: runs the full-window search's jumps (trainer, walkthrough
// trainer, walkthrough stop, item, place) at 260x316 in headless Chrome, from another tab with a search set and closed
// boxes, and prints each one that doesn't end open and on screen under the pinned headers. N: how many of each to try
// (default 40). T: tabs the jumps are split over, each its own browser context (default 4).
// Waits are events, not fixed delays: a route change waits for its hashchange and two frames; a jump waits until
// land()'s correction loop (700 ms by design, dex.js) has ended and one more frame has run.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from '../browser.mjs';
const [file, kb, nArg, tArg] = process.argv.slice(2);
const N = +nArg || 40, TABS = +tArg || 4;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
const browser = await startBrowser({ profilePrefix: 'jc-', flags: ['--hide-scrollbars', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  onEvent: m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); } });
const { send } = browser;
const url = pathToFileURL(resolve(file)).href;

async function tab() {
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 800)); return m.result?.result?.value; };
  await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2, mobile: false }, sessionId);
  if (kb) await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('dvkb','1')}catch(e){}` }, sessionId);
  await send('Page.navigate', { url: url + '#/' }, sessionId);
  for (let i = 0; i < 200 && !(await ev('document.readyState==="complete"&&typeof SR!=="undefined"&&document.querySelector("#app").children.length>0').catch(() => 0)); i++) await sleep(50);
  return ev;
}

// One jump: start on `from` with a search set and every box closed, scrolled down, run it, wait for the landing to end,
// then check the target. sel: the target's selector once landed; it must exist, have every <details> above it open, and
// sit on screen under the pinned headers (its top within 2 px of where land() puts it, or at least fully between them
// and the bottom).
const job = only => `(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const frames=n=>new Promise(r=>{const f=()=>--n<=0?r():requestAnimationFrame(f);requestAnimationFrame(f);});
 const out=[];let tried=0;const N=${N};
 let landed=0;const L=window.land;window.land=function(...a){landed=performance.now();return L.apply(this,a);};
 const hashTo=async h=>{if(location.hash===h)return;const done=new Promise(r=>addEventListener('hashchange',r,{once:true}));location.hash=h;await Promise.race([done,sleep(3000)]);await frames(2);};
 const pick=(a,n)=>{if(a.length<=n)return a;const s=a.length/n;return Array.from({length:n},(_,i)=>a[Math.floor(i*s)]);};
 const jobs=[];
 pick(TRS.filter(t=>!rivalHidden(t)),N).forEach(t=>jobs.push(['tr '+t.n+' ('+t.k+')',()=>SR.jumpTr(t.k),()=>{const [gi]=t.at;return app.querySelector('details.split[data-gi="'+gi+'"] details.trd[data-k="'+t.k+'"]>summary')||[...app.querySelectorAll('details.split[data-gi="'+gi+'"] details.trd')].find(d=>(d.dataset.ks||'').split(',').includes(t.k))?.querySelector(':scope>summary');},'#/trainers',1]));
 pick(TRS.filter(t=>!rivalHidden(t)&&walkOf(t.k)),N).forEach(t=>jobs.push(['walktr '+t.n+' ('+t.k+')',()=>SR.jumpWalkTr(t.k),()=>{const w=walkOf(t.k);return app.querySelector('details.stopd[data-k="'+w[0]+'.'+w[1]+'"] details.trd[data-k="'+t.k+'"]>summary')||[...app.querySelectorAll('details.stopd[data-k="'+w[0]+'.'+w[1]+'"] details.trd')].find(d=>(d.dataset.ks||'').split(',').includes(t.k))?.querySelector(':scope>summary');},'#/walk',1]));
 pick(walkStops(),N).forEach(([s,si,ti])=>jobs.push(['stop '+s.n+' ('+si+'.'+ti+')',()=>SR.jumpStop(si,ti),()=>app.querySelector('details.stopd[data-k="'+si+'.'+ti+'"]>summary,.wsign[data-k="'+si+'.'+ti+'"]'),'#/walk',0]));
 pick((D.IT||[]).flatMap((sec,si)=>sec.r.map((r,ri)=>[r[0],si,ri])),N).forEach(([n,si,ri])=>jobs.push(['item '+n+' ('+si+'.'+ri+')',()=>SR.jumpItem(si,ri),()=>app.querySelector('details.split[data-si="'+si+'"] .body [data-ri~="'+ri+'"]'),'#/items',0]));
 pick(AR.map((A,a)=>[A,a]).filter(([A])=>A.in==null),N).forEach(([A,a])=>jobs.push(['place '+A.n+' ('+a+')',()=>SR.place(a),()=>{const li=AR[ARS(a)[0]].l[0],b=LOC2A[li];if(b==null)return null;const tk=AR[b].in!=null?AR[b].in+'.0':b+'.'+places(b).find(p=>p.ls.includes(li)).j;return app.querySelector('details.stopd[data-k="'+tk+'"]>summary');},'#/locs',0]));
 const froms=['#/trainers','#/items','#/walk','#/locs','#/'];
 const only=${JSON.stringify(only)};const bad=[];
 for(const j of only){if(j>=jobs.length)continue;const [name,run,find,page,card]=jobs[j];tried++;const n0=out.length;
  // start elsewhere (or on the same page every third job), with a search set and the target page's boxes closed
  const from=(j+1)%3===0?page:froms[(j-Math.floor((j+1)/3))%froms.length];
  await hashTo(from);
  q.value='a';q.dispatchEvent(new Event('input'));await frames(2);
  scrollTo(0,400);await frames(1);
  // a jump to another page lands after its hashchange render; wait for land() to start, then for its loop to end
  landed=0;const t0=performance.now();run();
  while(!landed&&performance.now()-t0<3000)await frames(1);
  while(landed&&performance.now()-landed<720)await frames(1);
  await frames(2);
  const el=find();
  if(!el){out.push('MISSING  '+name+' on '+location.hash+' q="'+q.value+'"'+(landed?'':' (no land)'));bad.push(j);continue;}
  const closed=[];for(let p=el.closest('details');p;p=p.parentElement.closest('details'))if(!p.open&&!(el.tagName==='SUMMARY'&&p===el.parentElement))closed.push(p.className+'['+(p.dataset.k||p.dataset.gi||p.dataset.si||p.dataset.a||'')+']');
  const r=el.getBoundingClientRect(),hh=document.querySelector('header').getBoundingClientRect().height;
  const cardOk=!card||(el.parentElement.open&&el.parentElement.querySelector('.trc'));
  const vis=r.height>0&&r.top>=hh-2&&r.top<innerHeight-20;
  if(closed.length||!vis||!cardOk||q.value)out.push((closed.length?'CLOSED ':'')+(!vis?'OFFSCREEN ':'')+(!cardOk?'NOCARD ':'')+(q.value?'QUERY ':'')+name+' from '+from+' top '+Math.round(r.top)+' h '+Math.round(r.height)+' hh '+Math.round(hh)+(closed.length?' closed: '+closed.join(','):''));if(out.length>n0)bad.push(j);}
 return {tried,out,bad};})()`;

const t0 = Date.now();
// tab i runs jobs i, i+T, i+2T ... (the job count is only known in the page: indexes past it are skipped)
const stripe = i => Array.from({ length: Math.ceil(5 * N / TABS) + 1 }, (_, k) => i + k * TABS);
const parts = await Promise.all(Array.from({ length: TABS }, async (_, i) => (await tab())(job(stripe(i)))));
const tried = parts.reduce((n, p) => n + p.tried, 0);
// A jump that failed while the tabs ran at once is tried again alone, in a fresh tab, once the others are done: land()
// corrects the scroll for a fixed 700 ms, and under the gate's load too few frames fit in it.
// Only a jump that fails again counts; one that passes is listed as a timing flake.
let out = parts.flatMap(p => p.out), flaky = [];
const failed = parts.flatMap(p => p.bad);
if (failed.length) {
  const again = await (await tab())(job(failed));
  const key = line => line.replace(/^[A-Z ]+/, '').split(' from ')[0].split(' on #')[0];
  flaky = out.filter(line => !again.out.some(other => key(other) === key(line)));
  out = again.out;
}
const res = 'tried ' + tried + ', bad ' + out.length + '\n' + out.join('\n');
console.log(res);
if (flaky.length) console.log('passed when tried again alone (timing under load):\n' + flaky.join('\n'));
console.log(`${TABS} tabs, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (errs.length) console.log('page errors:\n' + errs.join('\n'));
await browser.close();
process.exitCode = errs.length || !/^tried \d+, bad 0(?:\n|$)/.test(res) ? 1 : 0;

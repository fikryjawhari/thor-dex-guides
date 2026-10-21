// node tools/mockup/jumpcheck.mjs <guide.html> [kb] [N]: runs the full-window search's jumps (trainer, walkthrough trainer,
// walkthrough stop, item, place) at 260x316 in headless Chrome, from another tab with a search set and closed boxes, and
// prints each one that doesn't end open and on screen under the pinned headers. N: how many of each to try (default 40).
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [file, kb, nArg] = process.argv.slice(2);
const N = +nArg || 40;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'jc-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 800)); return m.result?.result?.value; };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2, mobile: false }, sessionId);
const url = pathToFileURL(resolve(file)).href;
await send('Page.navigate', { url: url + '#/' }, sessionId); await sleep(1200);
if (kb) { await ev(`localStorage.setItem('dvkb','1')`); await send('Page.reload', {}, sessionId); await sleep(1200); }
// One jump: start on `from` with a search set and every box closed, scrolled down, run it, wait, then check the target.
// sel: the target's selector once landed; it must exist, have every <details> above it open, and sit on screen under the
// pinned headers (its top within 2 px of where land() puts it, or at least fully between them and the bottom).
const res = await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const out=[];let tried=0;const N=${N};
 const pick=(a,n)=>{if(a.length<=n)return a;const s=a.length/n;return Array.from({length:n},(_,i)=>a[Math.floor(i*s)]);};
 const jobs=[];
 pick(TRS.filter(t=>!rivalHidden(t)),N).forEach(t=>jobs.push(['tr '+t.n+' ('+t.k+')',()=>SR.jumpTr(t.k),()=>{const [gi]=t.at;return app.querySelector('details.split[data-gi="'+gi+'"] details.trd[data-k="'+t.k+'"]>summary')||[...app.querySelectorAll('details.split[data-gi="'+gi+'"] details.trd')].find(d=>(d.dataset.ks||'').split(',').includes(t.k))?.querySelector(':scope>summary');},'#/trainers',1]));
 pick(TRS.filter(t=>!rivalHidden(t)&&walkOf(t.k)),N).forEach(t=>jobs.push(['walktr '+t.n+' ('+t.k+')',()=>SR.jumpWalkTr(t.k),()=>{const w=walkOf(t.k);return app.querySelector('details.stopd[data-k="'+w[0]+'.'+w[1]+'"] details.trd[data-k="'+t.k+'"]>summary')||[...app.querySelectorAll('details.stopd[data-k="'+w[0]+'.'+w[1]+'"] details.trd')].find(d=>(d.dataset.ks||'').split(',').includes(t.k))?.querySelector(':scope>summary');},'#/walk',1]));
 pick(walkStops(),N).forEach(([s,si,ti])=>jobs.push(['stop '+s.n+' ('+si+'.'+ti+')',()=>SR.jumpStop(si,ti),()=>app.querySelector('details.stopd[data-k="'+si+'.'+ti+'"]>summary,.wsign[data-k="'+si+'.'+ti+'"]'),'#/walk',0]));
 pick((D.IT||[]).flatMap((sec,si)=>sec.r.map((r,ri)=>[r[0],si,ri])),N).forEach(([n,si,ri])=>jobs.push(['item '+n+' ('+si+'.'+ri+')',()=>SR.jumpItem(si,ri),()=>app.querySelectorAll('details.split[data-si="'+si+'"] .body tr')[ri],'#/items',0]));
 pick(AR.map((A,a)=>[A,a]).filter(([A])=>A.in==null),N).forEach(([A,a])=>jobs.push(['place '+A.n+' ('+a+')',()=>SR.place(a),()=>{const li=AR[ARS(a)[0]].l[0],b=LOC2A[li];if(b==null)return null;const tk=AR[b].in!=null?AR[b].in+'.0':b+'.'+places(b).find(p=>p.ls.includes(li)).j;return app.querySelector('details.stopd[data-k="'+tk+'"]>summary');},'#/locs',0]));
 const froms=['#/trainers','#/items','#/walk','#/locs','#/'];let fi=0;
 for(const [name,run,find,page,card] of jobs){tried++;
  // start elsewhere (or on the same page every third job), with a search set and the target page's boxes closed
  const from=tried%3===0?page:froms[fi++%froms.length];
  if(location.hash!==from){location.hash=from;await sleep(250);}
  q.value='a';q.dispatchEvent(new Event('input'));await sleep(150);
  scrollTo(0,400);await sleep(80);
  run();await sleep(1100);
  const el=find();
  if(!el){out.push('MISSING  '+name+' on '+location.hash+' q="'+q.value+'"');continue;}
  const closed=[];for(let p=el.closest('details');p;p=p.parentElement.closest('details'))if(!p.open&&!(el.tagName==='SUMMARY'&&p===el.parentElement))closed.push(p.className+'['+(p.dataset.k||p.dataset.gi||p.dataset.si||p.dataset.a||'')+']');
  const r=el.getBoundingClientRect(),hh=document.querySelector('header').getBoundingClientRect().height;
  const cardOk=!card||(el.parentElement.open&&el.parentElement.querySelector('.trc'));
  const vis=r.height>0&&r.top>=hh-2&&r.top<innerHeight-20;
  if(closed.length||!vis||!cardOk||q.value)out.push((closed.length?'CLOSED ':'')+(!vis?'OFFSCREEN ':'')+(!cardOk?'NOCARD ':'')+(q.value?'QUERY ':'')+name+' from '+from+' top '+Math.round(r.top)+' h '+Math.round(r.height)+' hh '+Math.round(hh)+(closed.length?' closed: '+closed.join(','):''));}
 return 'tried '+tried+', bad '+out.length+'\\n'+out.join('\\n');})()`);
console.log(res);
if (errs.length) console.log('page errors:\n' + errs.join('\n'));
ws.close(); chrome.kill();

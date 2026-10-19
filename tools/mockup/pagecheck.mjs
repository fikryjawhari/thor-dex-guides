// node tools/mockup/pagecheck.mjs <guide.html> <shot-prefix> [kb]: exercises Locations, Trainers and Items at 260x316 in headless Chrome
// (boxes, places, sections, header taps, sticky headers, bars, jumps, state after a reload) and prints what it saw plus any page errors.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [file, out, kb] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'tw-'));
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
const go = async h => { await send('Page.navigate', { url: url + h }, sessionId); await sleep(1500); };
await go('#/locs');
if (kb) { await ev(`localStorage.setItem('dvkb','1')`); }
const shot = async name => { const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId); writeFileSync(`${out}-${name}.png`, Buffer.from(s.result.data, 'base64')); };
// One page: open the box whose header contains pick, look inside, then taps, sticky headers, bars, jumps, Expand / Collapse all.
const page = async (route, pick) => { await go(route); return ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const fr=()=>new Promise(r=>requestAnimationFrame(r));const o=[];const d=document;
 const T=()=>d.querySelector('header').offsetHeight+8;const sp=()=>[...d.querySelectorAll('details.split.jt')];
 o.push('${route} docW '+d.documentElement.scrollWidth+' boxes '+sp().length+' open '+sp().filter(x=>x.open).length+' rjump hidden '+d.querySelector('.rjump').hidden+' top bar '+!!d.querySelector('.seg.all'));
 const s0=sp().find(x=>x.querySelector('summary').textContent.includes(${JSON.stringify(pick)}))||sp()[0];scrollBy(0,s0.getBoundingClientRect().top-T());await sleep(200);
 const y0=Math.round(s0.querySelector('summary').getBoundingClientRect().top);s0.querySelector('summary').click();await sleep(400);
 const lv=s=>[...s0.querySelectorAll(s)];
 o.push('open "'+s0.querySelector('summary').textContent.trim().slice(0,40)+'" header '+y0+' -> '+Math.round(s0.querySelector('summary').getBoundingClientRect().top)+' | places '+lv('details.stopd').length+' ('+lv('details.stopd').map(x=>x.querySelector('summary').textContent.trim().slice(0,28)).slice(0,6).join(' / ')+') secs '+lv('details.sec').length+' open '+lv('details.sec[open]').length+' trainers '+lv('details.trd').length+' open '+lv('details.trd[open]').length+' cards '+lv('.trc').length+' level boxes '+lv('details.capd').length+' open '+lv('details.capd[open]').length+' trackers '+lv('.trk[data-a]').length+' tables '+lv('table').length+' inner bar '+!!s0.querySelector('.body>.seg'));
 // a header tap on the first place or trainer holds the header still
 const inner=s0.querySelector('details.stopd[open],details.trd[open]');
 if(inner){const h=inner.querySelector(':scope>summary');scrollBy(0,h.getBoundingClientRect().top-150);await sleep(300);const y=Math.round(h.getBoundingClientRect().top);h.click();const ys=[];for(let i=0;i<15;i++){ys.push(Math.round(h.getBoundingClientRect().top));await fr();}
  o.push('tap '+inner.className+' header '+y+' -> '+[...new Set(ys)].join(',')+' open '+inner.open);h.click();await sleep(500);}
 // sticky: the middle of the tallest open block at each level
 for(const sel of ['details.stopd[open]','details.sec[open]','details.trd[open]']){const b=lv(sel).sort((a,b)=>b.offsetHeight-a.offsetHeight)[0];if(!b)continue;scrollBy(0,b.getBoundingClientRect().top+b.offsetHeight/2-T());await sleep(300);
  const sm=b.querySelector(':scope>summary');o.push('sticky '+sel+' h '+b.offsetHeight+' header top '+Math.round(sm.getBoundingClientRect().top)+' (hh '+d.querySelector('header').offsetHeight+') bar shown '+[...b.querySelectorAll(':scope>.endbar,:scope>.stop>.endbar')].some(x=>!x.hidden));}
 // a section or trainer bar closes its block in place
 const eb=[...s0.querySelectorAll('details.sec>.endbar,details.trd>.endbar')].find(x=>!x.hidden);
 if(eb){const dd=eb.closest('details');eb.scrollIntoView({block:'end'});await sleep(300);eb.click();await sleep(600);o.push('inner bar: '+dd.className+' open '+dd.open+' header '+Math.round(dd.querySelector('summary').getBoundingClientRect().top));}
 const spb=s0.querySelector('.endbar.sp');o.push('box bar shown '+!spb.hidden);if(!spb.hidden){spb.scrollIntoView({block:'end'});await sleep(300);spb.click();await sleep(700);o.push('box bar: header '+Math.round(s0.querySelector('summary').getBoundingClientRect().top)+' T '+T()+' open '+s0.open);}
 scrollTo(0,0);await sleep(200);const dn=d.querySelector('.rjump [data-j="1"]'),up=d.querySelector('.rjump [data-j="-1"]');
 dn.click();await sleep(50);const a1=Math.round(sp()[0].getBoundingClientRect().top);dn.click();await sleep(50);const a2=Math.round(sp()[1].getBoundingClientRect().top);up.click();await sleep(50);
 o.push('jump down '+a1+' down '+a2+' up '+Math.round(sp()[0].getBoundingClientRect().top)+' (T '+T()+')');
 const seg=d.querySelector('.seg.all');const yy=Math.round(seg.getBoundingClientRect().top);seg.children[0].click();await sleep(500);const n1=sp().filter(x=>x.open).length;const y2=Math.round(seg.getBoundingClientRect().top);seg.children[1].click();await sleep(400);
 o.push('top seg '+yy+' -> '+y2+' -> '+Math.round(seg.getBoundingClientRect().top)+' open after expand '+n1+' after collapse '+sp().filter(x=>x.open).length);
 // leave the picked box open with its first place or trainer closed, for the reload check
 s0.open=true;await sleep(300);const p=s0.querySelector('details.stopd,details.trd');if(p){p.open=false;await sleep(200);}
 return o.join('\\n');})()`); };
const pages = [['#/locs', 'Granite Cave'], ['#/locs', 'Littleroot'], ['#/trainers', 'Hot House'], ['#/trainers', 'Falkner'], ['#/items', 'TMs']];
for (const [r, p] of pages) { console.log(await page(r, p)); await shot(r.slice(2) + '-' + p.replace(/\W/g, '')); }
// after a reload the open boxes and the closed places / trainers inside them come back
for (const r of ['#/locs', '#/trainers', '#/items']) { await go(r); console.log(r + ' after reload: ' + await ev(`[...document.querySelectorAll('details.split.jt[open]')].map(d=>d.querySelector('summary').textContent.trim().slice(0,24)+' (closed inside: '+d.querySelectorAll('details.stopd:not([open]),details.trd:not([open])').length+')').join(' | ')`)); }
// a place link (Pokemon page) opens its box and place and lands the place under the search bar
await go('#/l/16'); console.log('#/l/16: ' + await ev(`(()=>{const f=document.querySelector('.flash');return f?f.textContent.trim().slice(0,40)+' at '+Math.round(f.getBoundingClientRect().top):'no flash';})()`)); await shot('place-link');
await go('#/walk'); console.log('walk docW ' + await ev('document.documentElement.scrollWidth'));
console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
chrome.kill(); process.exit(0);

// node tools/mockup/ps-locations/guidecheck.mjs <guide.html> <shot-prefix> [kb]: Photonic Sun pass 2 checks at 260x316 in headless
// Chrome: the Starter box and picker, Route 1's sections, SOS drop-downs, map, an ally search, the walkthrough lines,
// every location / move / ability page's width, and page errors.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [file, out, kb] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'pc-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(), errs = [];
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
  return m.result?.result?.value ?? ('EXC ' + JSON.stringify(m.result?.exceptionDetails || '').slice(0, 400)); };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2.30625, mobile: false }, sessionId);
const url = pathToFileURL(resolve(file)).href;
const go = async h => { await send('Page.navigate', { url: url + h }, sessionId); await sleep(1500); };
await go('#/locs'); await ev(`localStorage.clear();${kb ? "localStorage.setItem('dvkb','1');" : ''}`); await go('#/locs');
const shot = async name => { const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId); writeFileSync(`${out}-${name}.png`, Buffer.from(s.result.data, 'base64')); };
// Starter box: picker records the encounter and syncs the bar
await go('#/l/0');
console.log(await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const o=[];
 const sp=document.querySelector('.st-pick');o.push('starter box: picker '+!!sp+' tracker selects in box '+document.querySelectorAll('details.split[data-a="0"] .tk-sel').length+' secs '+[...document.querySelectorAll('details.split[data-a="0"] details.sec .sn')].map(x=>x.textContent).join('|'));
 sp.value='Litten';sp.dispatchEvent(new Event('change'));await sleep(300);
 o.push('after pick: TK.s '+TK.s+' TK.e[0] '+JSON.stringify(TK.e[0])+' bar shows '+document.querySelector('.tk-starter').value+' box tag '+(document.querySelector('details.split[data-a="0"]>summary .tag')||{}).textContent);
 const b=document.querySelector('.tkbar');o.push('tracker bar right '+Math.round(b.getBoundingClientRect().right)+' select right '+Math.round(document.querySelector('.tk-starter').getBoundingClientRect().right)+' docW '+document.documentElement.scrollWidth);
 return o.join('\\n');})()`));
await shot('starter');
await go('#/l/1');
console.log(await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const o=[];const d=document;
 const box=d.querySelector('details.split[data-a="1"]');o.push('Route 1 open '+box.open+' secs '+[...box.querySelectorAll('details.sec')].map(x=>x.querySelector('.sn').textContent+' ('+x.querySelectorAll('table.lt tr').length+')').join(' | '));
 o.push('sos drop-downs '+box.querySelectorAll('.sosd').length+' map imgs '+box.querySelectorAll('.mapd img').length+' day/night key '+!!box.querySelector('.ltkey')+' bubbling cells '+box.querySelectorAll('.dn.b').length);
 const water=[...box.querySelectorAll('details.sec')].find(x=>x.querySelector('.sn').textContent==='Water');o.push('water rows: '+[...water.querySelectorAll('tr')].slice(0,3).map(t=>t.textContent.replace(/\\s+/g,' ').trim()).join(' / '));
 const g1=[...box.querySelectorAll('details.sec')][0];o.push('grass 1 rows: '+[...g1.querySelectorAll('tr')].map(t=>t.textContent.replace(/\\s+/g,' ').trim()).join(' / '));
 // sticky gap: scroll a section header under the place header
 const sec=g1;scrollBy(0,sec.getBoundingClientRect().top+60-d.querySelector('header').offsetHeight);await sleep(300);
 const sh=box.querySelector('details.stopd>summary').getBoundingClientRect(),ss=sec.querySelector('summary').getBoundingClientRect();o.push('sticky: place header bottom '+sh.bottom.toFixed(2)+' section header top '+ss.top.toFixed(2)+' (gap '+(ss.top-sh.bottom).toFixed(2)+')');
 o.push('docW '+d.documentElement.scrollWidth);return o.join('\\n');})()`));
await shot('route1');
// Ally search: Snorlax
console.log(await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));st.q='snorlax';render(true);await sleep(400);
 return 'search snorlax: boxes '+[...document.querySelectorAll('details.split.jt')].map(x=>x.querySelector('summary').textContent.trim().slice(0,20)).join('|')+' open sos drop-downs '+[...document.querySelectorAll('.sosd[open] summary')].map(x=>x.textContent).join(' ; ');})()`));
await ev(`st.q='';render(true)`);
// Pokemon page rows, walkthrough lines
await go('#/p/mareanie');
console.log(await ev(`'mareanie where: '+[...document.querySelectorAll('table.wh tr')].slice(1).map(t=>t.textContent.replace(/\\s+/g,' ').trim()).join(' / ')`));
await go('#/walk');
console.log(await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const s=document.querySelector('details.split');s.open=true;await sleep(500);
 return 'walk first split encounter lines: '+[...document.querySelectorAll('.encl')].slice(0,4).map(x=>x.textContent.slice(0,90)).join(' / ');})()`));
// Widths: every location, move and ability page
await go('#/');
console.log(await ev(`(async()=>{const wide=[];const W=()=>document.documentElement.scrollWidth;
 for(let i=0;i<MV.length;i++){moveDetail(i);if(W()>260)wide.push('m'+i+':'+W());}
 for(let i=0;i<AB.length;i++){abilityDetail(i);if(W()>260)wide.push('a'+i+':'+W());}
 location.hash='#/locs';await new Promise(r=>setTimeout(r,500));document.querySelectorAll('details.split.jt').forEach(d=>d.open=true);await new Promise(r=>setTimeout(r,800));
 document.querySelectorAll('.sosd,.mapd').forEach(d=>d.open=true);await new Promise(r=>setTimeout(r,300));
 return 'wide pages: '+(wide.slice(0,10).join(' ')||'none')+' | all locations open docW '+W()+' sections '+document.querySelectorAll('details.sec').length;})()`));
await go('#/m/331'); await shot('move'); await go('#/a/88'); await shot('ability');
console.log('page errors', errs.length, errs.slice(0, 3).join('\n'));
ch.kill(); process.exit(0);

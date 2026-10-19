// node check.mjs <mockup.html> <shot.png> [tab]: loads the mockup, reports each frame's width, sections and errors.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [file, shot, tab = 'loc', area = ''] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'mk-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(), errs = [];
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId); return m.result?.result?.value ?? JSON.stringify(m.result?.exceptionDetails || '').slice(0, 300); };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 1260, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url: file.startsWith('http') ? file : pathToFileURL(resolve(file)).href }, sessionId); await sleep(2500);
if (tab !== 'loc') { await ev(`document.querySelector('.tabs [data-p="${tab}"]').click()`); await sleep(2500); }
if (area) { await ev(`(()=>{const s=document.getElementById('area');s.value=[...s.options].find(o=>o.text===${JSON.stringify(area)}).value;s.onchange();})()`); await sleep(1500); }
console.log(await ev(`JSON.stringify([...document.querySelectorAll('#row iframe')].map(f=>{const d=f.contentDocument;const a=d.getElementById('app');
 return {d:f.dataset.d,w:d.documentElement.scrollWidth,secs:[...a.querySelectorAll('details.sec>summary .sn')].map(x=>x.textContent).join(' | ').slice(0,300),
  sos:a.querySelectorAll('.sosd,.sosi').length,txt:(a.querySelector('.card table,.mvst')||{}).textContent?.slice(0,80)};}),null,1)`));
console.log('errors', errs.length, errs.slice(0, 5).join('\n'));
const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId); writeFileSync(shot, Buffer.from(s.result.data, 'base64'));
ch.kill(); process.exit(0);

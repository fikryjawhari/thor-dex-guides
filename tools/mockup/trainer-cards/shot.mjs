// node shot.mjs <page.html> <out.png> [WxH=260x316] [js to run before the shot] [hash] [kb]: headless screenshot at the
// viewer size (DPR 2.30625 like the Thor). `js` runs after load; the result is printed.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const [page, out, size = '260x316', js0 = '', hash = '', kb = ''] = process.argv.slice(2);
const js = js0.startsWith('@') ? readFileSync(js0.slice(1), 'utf8') : js0; // @file.js reads the script from a file
const [W, H] = size.split('x').map(Number);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'sh-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId); return m.result?.result?.value ?? JSON.stringify(m.result?.exceptionDetails || '').slice(0, 300); };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2.30625, mobile: true }, sessionId);
if (process.env.PRE) await send('Page.addScriptToEvaluateOnNewDocument', { source: process.env.PRE }, sessionId); // e.g. localStorage.setItem('mocktc','{"cd":"A"}')
if (process.env.OPT) await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('mocktc',${JSON.stringify(process.env.OPT)})` }, sessionId); // OPT='{"cd":"C","pv":"24"}'
if (kb) await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('dvkb','1')" }, sessionId);
await send('Page.navigate', { url: 'file:///' + resolve(page).replace(/\\/g, '/') + hash }, sessionId); await sleep(2500);
if (js) { console.log(await ev(js)); await sleep(800); }
const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
ch.kill(); process.exit(0);

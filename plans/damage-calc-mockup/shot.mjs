// node plans/damage-calc-mockup/shot.mjs <page.html> <out.png> [--w 260 --h 316 --kb --light --js "<expr run after load>" --hash "#/calc"]
// Headless Chrome screenshot of the mockup page (state reset per run); prints page errors and the js result.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const a = process.argv.slice(2); const [file, out] = a; const opt = n => { const i = a.indexOf('--' + n); return i < 0 ? null : (a[i + 1]?.startsWith('--') ? true : a[i + 1] ?? true); };
const W = +(opt('w') || 260), H = +(opt('h') || 316);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'dc-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 500)); };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId); if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 600)); return m.result?.result?.value; };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false }, sessionId);
if (opt('light')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] }, sessionId);
const url = pathToFileURL(resolve(file)).href;
await send('Page.navigate', { url: url + (opt('hash') || '') }, sessionId); await sleep(1200);
if (opt('kb')) { await ev(`localStorage.setItem('dvkb','1')`); await send('Page.navigate', { url: url + (opt('hash') || '') }, sessionId); await sleep(1200); }
let r; if (opt('js')) { r = await ev(opt('js')); await sleep(400); }
const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId); writeFileSync(out, Buffer.from(s.result.data, 'base64'));
const dim = await ev(`document.documentElement.scrollWidth+'x'+document.documentElement.scrollHeight`);
console.log('doc', dim, 'js:', r === undefined ? '' : JSON.stringify(r)); if (errs.length) console.log('ERRORS', errs); else console.log('no page errors');
ws.close(); chrome.kill();

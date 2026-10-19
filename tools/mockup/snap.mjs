// Snapshot a guide's walkthrough page (top matter + every split opened) as static HTML for a mockup.
// node snap.mjs <guide.html> <out.json>
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [file, out] = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'snap-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const ct = await send('Target.createTarget', { url: 'about:blank' }); if (!ct.result) { console.log(JSON.stringify(ct)); process.exit(1); } const { targetId } = ct.result;
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails)); return m.result?.result?.value; };
await send('Page.navigate', { url: pathToFileURL(resolve(file)).href + '#/walk' }, sessionId);
await sleep(1500);
const res = await ev(`(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  document.querySelectorAll('#app details.split[data-wo]').forEach(d=>d.open=true);
  await sleep(800);
  // blob sprite URLs -> data URIs
  const urls=new Map();
  for(const el of document.querySelectorAll('#app [style*="blob:"]')){const m=el.getAttribute('style').match(/blob:[^)"']+/);if(m&&!urls.has(m[0])){const b=await (await fetch(m[0])).blob();urls.set(m[0],await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);}));}}
  let h=document.getElementById('app').innerHTML;for(const [k,v] of urls)h=h.split(k).join(v);
  return h;})()`);
writeFileSync(out, JSON.stringify(res));
console.log('ok', res.length);
chrome.kill(); process.exit(0);

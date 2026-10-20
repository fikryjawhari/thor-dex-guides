// node check.mjs <mockup url> <shot dir>: the Items mockup (Now and Proposed) at 260x316 and 480x392: page errors, page
// width, box and sub-heading counts, the box-level Expand all / Collapse all, and screenshots of Shops. Serve over http
// (python -m http.server): srcdoc frames get an opaque origin on file://.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, dir] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'mk-'));
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
await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url }, sessionId); await sleep(3500);
const shot = async name => { const r = await ev(`(()=>{const b=document.getElementById('fr').getBoundingClientRect();return [b.x,b.y,b.width,b.height]})()`);
  const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: r[0], y: r[1], width: r[2], height: r[3], scale: 1 } }, sessionId);
  writeFileSync(join(dir, name + '.png'), Buffer.from(s.result.data, 'base64')); };
const inner = body => `(()=>{const w=thorFrame(),d=w.document;${body}})()`;
const openBox = name => inner(`d.querySelectorAll('details.split.jt').forEach(x=>{if(x.open){x.open=false;x.dispatchEvent(new w.Event('toggle'))}});
  const b=[...d.querySelectorAll('details.split.jt')].find(x=>x.textContent.trim().startsWith('${name}'));b.open=true;b.dispatchEvent(new w.Event('toggle'));return new Promise(r=>setTimeout(()=>{b.scrollIntoView();r(1)},500))`);
const secs = inner(`return [...d.querySelectorAll('details.split.jt[open] details.sec')].map(x=>x.open?1:0).join('')`);
const click = a => inner(`d.querySelector('.seg.it-sp button[data-a="${a}"]').click();return new Promise(r=>setTimeout(r,500))`);
for (const [W, H] of [[260, 316], [480, 392]]) {
  await ev(`document.querySelector('#sizes button[data-w="${W}"][data-h="${H}"]').click()`); await sleep(1500);
  for (const m of ['cur', 'new']) {
    await ev(inner(`w.setOption('m','${m}')`)); await sleep(700);
    const st = await ev(inner(`d.querySelectorAll('details.split.jt').forEach(x=>{if(!x.open){x.open=true;x.dispatchEvent(new w.Event('toggle'))}});
      return new Promise(res=>setTimeout(()=>res({errs:w.__errs,sw:d.documentElement.scrollWidth,iw:w.innerWidth,boxes:d.querySelectorAll('details.split.jt').length,subs:d.querySelectorAll('details.sec').length,bars:d.querySelectorAll('.seg.it-sp').length,rows:d.querySelectorAll('table.ix tr').length}),800))`));
    console.log(`${W}x${H} ${m}`, JSON.stringify(st));
  }
  await ev(inner(`w.setOption('m','new')`)); await sleep(500);
  await ev(openBox('Held')); const a = await ev(secs); await ev(click(0)); const b = await ev(secs); await ev(click(1)); const c = await ev(secs);
  console.log(`  Held sub-headings open: start ${a}, after Collapse all ${b}, after Expand all ${c}`);
  await ev(openBox('Shops')); await ev(click(0)); await sleep(300); await shot(`shops-${W}x${H}`);
}
ws.close(); ch.kill();

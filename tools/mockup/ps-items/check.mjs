// node check.mjs <mockup url> <shot dir>: every variant of the Items mockup at 260x316 and 480x392: page errors, page
// width, box and sub-heading counts with every box opened, and screenshots. Serve over http (python -m http.server):
// srcdoc frames get an opaque origin on file://.
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
const opts = (m, s, h, o, t) => inner(`w.setOption('s','${s}');w.setOption('h','${h}');w.setOption('o','${o}');w.setOption('t','${t}');w.setOption('m','${m}');`);
for (const [W, H] of [[260, 316], [480, 392]]) {
  await ev(`(()=>{document.querySelector('#sizes button[data-w="${W}"][data-h="${H}"]').click()})()`); await sleep(1500);
  for (const m of ['cur', 'new']) for (const s of m === 'cur' ? ['S'] : ['S', 'K']) for (const h of m === 'cur' ? ['S'] : ['S', 'B']) for (const o of m === 'cur' ? ['A'] : ['A', 'G']) for (const t of m === 'cur' ? ['F'] : ['F', 'C']) {
    await ev(opts(m, s, h, o, t)); await sleep(500);
    const r = await ev(inner(`d.querySelectorAll('details.split.jt').forEach(x=>{if(!x.open){x.open=true;}});
      w.document.querySelectorAll('details.split.jt').forEach(x=>x.dispatchEvent(new w.Event('toggle')));
      return new Promise(res=>setTimeout(()=>{const hs=[...d.querySelectorAll('details.split.jt>summary')].map(s=>s.firstChild.textContent.trim()+' '+s.querySelector('span').textContent);
       res({errs:w.__errs,sw:d.documentElement.scrollWidth,iw:w.innerWidth,boxes:hs.length,subs:d.querySelectorAll('details.sec').length,rows:d.querySelectorAll('table.ix tr').length,
       wide:[...d.querySelectorAll('#app *')].filter(e=>e.getBoundingClientRect().right>w.innerWidth+1&&e.getClientRects().length).slice(0,3).map(e=>e.tagName+'.'+e.className)})},900))`));
    const tag = `${W}x${H} ${m} ${s}${h}${o}${t}`;
    console.log(tag, JSON.stringify(r));
  }
}
await ev(opts('new', 'S', 'S', 'G', 'C')); await sleep(600);
await ev(inner(`d.querySelectorAll('details.split.jt').forEach(x=>{if(x.open)x.open=false});const b=[...d.querySelectorAll('details.split.jt')].find(x=>x.textContent.startsWith('Held'));b.open=true;b.dispatchEvent(new w.Event('toggle'));b.scrollIntoView();`)); await sleep(800);
await shot('held-new'); await ev(`(()=>{document.querySelector('#sizes button[data-w="260"][data-h="316"]').click()})()`); await sleep(1200); await shot('held-new-min');
ws.close(); ch.kill();

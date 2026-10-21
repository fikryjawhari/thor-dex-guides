// node check.mjs <mockup url> <shot dir> [size, e.g. 260x316]: for every "Jump to" place, each frame's errors, width
// (document wider than the frame = sideways scroll), the place heading it landed on, and a screenshot of the row.
// Serve the mockup over http (python -m http.server): srcdoc frames get an opaque origin on file://.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, dir, size = '260x316'] = process.argv.slice(2);
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
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url }, sessionId); await sleep(3000);
await ev(`(()=>{const s=document.getElementById('sz');s.value='${size}';s.onchange();})()`); await sleep(5000);
const n = await ev(`document.getElementById('jump').options.length`);
const out = [];
for (let i = 0; i < n; i++) {
  await ev(`(()=>{const s=document.getElementById('jump');s.value='${i}';s.onchange();})()`); await sleep(900);
  const r = await ev(`(()=>{const lab=document.getElementById('jump').selectedOptions[0].text;return {lab,fr:[...document.querySelectorAll('#row iframe')].map(f=>{const w=f.contentWindow,d=w.document;
    const hs=[...d.querySelectorAll('details.stopd>summary')].filter(h=>{const b=h.getBoundingClientRect();return b.bottom>0&&b.top<w.innerHeight;}).map(h=>h.textContent.slice(0,40));
    return {d:f.dataset.d,errs:w.__errs,sw:d.documentElement.scrollWidth,w:w.innerWidth,head:hs[0]||'',
     pt:[...d.querySelectorAll('.ptd>summary')].map(s=>s.textContent.replace(/\\s+/g,' ').trim()).filter((x,i,a)=>a.indexOf(x)===i).join(' | '),
     wide:[...d.querySelectorAll('#app *')].filter(e=>e.getBoundingClientRect().right>w.innerWidth+1&&e.getClientRects().length).slice(0,3).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))};})};})()`);
  out.push(r);
  console.log(`${i} ${r.lab}`); for (const f of r.fr) console.log(`   ${f.d}: width ${f.sw}/${f.w} ${f.errs.length ? 'ERRORS ' + f.errs.join(' | ') : ''} at "${f.head}" ${f.wide.length ? 'WIDE ' + f.wide.join(', ') : ''}${f.pt ? ' partners: ' + f.pt : ''}`);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1400, height: 760, scale: 1 } }, sessionId);
  writeFileSync(join(dir, `jump${i}.png`), Buffer.from(shot.result.data, 'base64'));
}
writeFileSync(join(dir, 'check.json'), JSON.stringify(out, null, 1));
ch.kill(); process.exit(0);

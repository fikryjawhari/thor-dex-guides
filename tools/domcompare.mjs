// Render two builds of a guide route by route in headless Chrome and compare the DOM (scripts removed), with every
// <details> opened so lazily built sections are compared too. Used to check a template change renders the same.
// Usage: node tools/domcompare.mjs <old.html> <new.html> [--kb] [--routes=pattern]
//   --kb   sets localStorage "dvkb" = "1" (the in-viewer keyboard and number boxes)
// Needs Chrome or Edge (CHROME env var, or the usual Windows install paths). Node 22+ (fetch, WebSocket).
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--')).map(f => pathToFileURL(resolve(f)).href);
const KB = args.includes('--kb');
const PAT = (args.find(a => a.startsWith('--routes=')) || '').slice(9);
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const PORT = +(process.env.PORT || 9555), prof = mkdtempSync(join(tmpdir(), 'domcmp-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`,
  '--allow-file-access-from-files', '--window-size=480,800', 'about:blank'], { stdio: 'ignore' });
chrome.on('exit', c => { console.log('Chrome exited', c); process.exit(2); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map();
async function connect() {
  for (let i = 0; i < 50; i++) { try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = t.find(x => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r); ws.onclose = () => { console.log('Chrome connection closed: aborting'); process.exit(2); }; ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } }; return; } } catch { } await sleep(200); }
  throw new Error('no Chrome');
}
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
async function ev(expr) {
  const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 800));
  return m.result?.result?.value;
}

// Runs in the page: visit each route, open every <details> until none are left closed, hash the body.
const PAGE = `async (routes, want) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const snap = () => { const b = document.body.cloneNode(true); b.querySelectorAll('script').forEach(s => s.remove());
    return b.innerHTML.replace(/blob:[^)"]+/g, 'blob').replace(/ class=""/g, '').replace(/>\\s+</g, '><').trim(); };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; };
  const out = {}, errs = [], slow = [];
  window.addEventListener('error', e => errs.push(e.message));
  for (const r of routes) {
    // hashchange (and so the render) fires asynchronously: wait for it, or the old page gets snapshotted.
    if (location.hash !== r) { const done = new Promise(res => addEventListener('hashchange', () => setTimeout(res, 0), { once: true })); location.hash = r; if (await Promise.race([done.then(() => 0), sleep(1500).then(() => 1)])) slow.push(r); }
    await sleep(5);
    for (let k = 0; k < 6; k++) { const ds = [...document.querySelectorAll('#app details:not([open])')]; if (!ds.length) break; ds.forEach(d => d.open = true); await sleep(5); }
    // Lazy sections fill on toggle events and timers: wait until two snapshots in a row match.
    let s = snap(), prev = '';
    for (let k = 0; k < 40 && s !== prev; k++) { await sleep(25); prev = s; s = snap(); }
    out[r] = want.includes(r) ? s : hash(s);
  }
  return { out, errs, slow };
}`;

async function run(url, routes, want) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Page.navigate', { url }); await sleep(300);
  await ev(`localStorage.clear();${KB ? "localStorage.setItem('dvkb','1');" : ''}0`);
  await send('Page.navigate', { url: url + '#/' });
  for (let i = 0; i < 100 && !(await ev('typeof P!=="undefined"&&document.querySelector("#app").children.length>0')); i++) await sleep(100);
  // Big list pages last: their scroll-restore timers can still be running when the next route is snapshotted.
  if (!routes) return ev(`(()=>{const r=[];
    P.forEach(p=>r.push('#/p/'+p.id));M.forEach((m,i)=>r.push('#/m/'+i));AB.forEach((a,i)=>r.push('#/a/'+i));
    LOC.forEach((l,i)=>r.push('#/l/'+i));TRS.forEach(t=>r.push('#/tr/'+t.k));
    return r.concat(['#/','#/locs','#/trainers','#/items','#/walk']);})()`);
  return ev(`(${PAGE})(${JSON.stringify(routes)}, ${JSON.stringify(want)})`);
}

try {
  await connect(); await send('Runtime.enable');
  let routes = await run(files[0]);
  if (PAT) routes = routes.filter(r => PAT.startsWith('=') ? r === PAT.slice(1) : r.includes(PAT));
  console.log(routes.length, 'routes', KB ? '(keyboard mode)' : '');
  const a = await run(files[0], routes, []), b = await run(files[1], routes, []);
  const bad = routes.filter(r => a.out[r] !== b.out[r]);
  console.log('no hashchange (old/new):', a.slow.length, b.slow.length, a.slow.slice(0, 5));
  console.log('page errors old:', a.errs.length, a.errs.slice(0, 3), ' new:', b.errs.length, b.errs.slice(0, 3));
  console.log('differing routes:', bad.length, bad.slice(0, 40).join(' '));
  for (const r of bad.slice(0, +(process.env.SHOW || 2))) {
    const upTo = routes.slice(0, routes.indexOf(r) + 1);  // same history as the sweep, since state carries over
    const [x, y] = [(await run(files[0], upTo, [r])).out[r], (await run(files[1], upTo, [r])).out[r]];
    let i = 0; while (i < x.length && x[i] === y[i]) i++;
    console.log(`\n== ${r} (lengths ${x.length} / ${y.length}) first difference at ${i}:\n old: ${x.slice(Math.max(0, i - 150), i + 250)}\n new: ${y.slice(Math.max(0, i - 150), i + 250)}`);
  }
} finally { chrome.kill(); await sleep(300); try { rmSync(prof, { recursive: true, force: true }); } catch { } }

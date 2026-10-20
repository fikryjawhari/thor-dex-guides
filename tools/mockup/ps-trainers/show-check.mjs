// node show-check.mjs <guide.html> [outdir]: checks the Trainers page Show switch / place "teams" toggle / anchoring
// (plans/trainers-show-switch.md) on Photonic Sun in headless Chrome at 260x316 and 538x425, normal and dvkb.
// Per run: page errors, sideways overflow, the pinned stack (search bar, island header, Show row, place header) gaps,
// the Melemele scenario (switch states), the Route 4 / Sightseer Scotty scenario (anchor tops before / after), and that
// pressing a place's teams button doesn't toggle the place. Clicks are real mouse events. Exit code 1 on any FAIL.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [file, dir] = process.argv.slice(2);
const URL_ = pathToFileURL(resolve(file)).href;
if (dir) mkdirSync(dir, { recursive: true });
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const prof = mkdtempSync(join(tmpdir(), 'shc-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--hide-scrollbars', '--disable-ipc-flooding-protection', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); let errs = [];
for (let i = 0; i < 100; i++) { try { const port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); break; } catch { } await sleep(100); }
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200));
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error ' + m.params.args.map(a => a.value || a.description).join(' ').slice(0, 200)); };
const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
const ev = async expr => { const m = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 400)); return m.result?.result?.value; };
await S('Runtime.enable'); await S('Page.enable');
let fails = 0; const out = []; const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const check = (ok, msg) => { if (!ok) fails++; log(ok ? '  ok  ' : '  FAIL', msg); };
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t;

async function load(w, h, kb, tr) {
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await S('Page.navigate', { url: URL_ }); await sleep(1500);
  await ev(`localStorage.clear();${kb ? "localStorage.setItem('dvkb','1');" : ''}${tr ? `localStorage.setItem('pstr',${JSON.stringify(JSON.stringify(tr))});` : ''}location.hash='#/trainers';0`);
  errs = []; await S('Page.navigate', { url: URL_ + '#/trainers' }); await S('Page.reload'); await sleep(2500);
}
// real click at the middle of the element found by `finder` (js expression returning an element), scrolled into view first
async function click(finder, keep) {
  // the click point: the middle of the element, or if something else covers it, scroll it just under the pinned stack
  // (the point is nudged left of a summary's teams button so it can't land on that)
  let r; for (let pass = 0; pass < 3; pass++) { r = await measure(finder); if (!r || (pass > 0 && r[2])) break; await sleep(250); }
  if (r) r = [r[0], r[1]];
  async function measure(finder) { return ev(`(()=>{const e=${finder};if(!e)return null;
    const pt=()=>{const b=e.getBoundingClientRect();return [e.matches('summary')?b.left+20:b.left+b.width/2,b.top+Math.min(b.height/2,e.matches('summary')?10:99)];};
    const hit=()=>{const [x,y]=pt(),h=document.elementFromPoint(x,y);return h&&e.contains(h);};
    if(!hit()){const lim=[...document.querySelectorAll('header,details.split[open]>summary,.trsw,details.stopd[open]>summary')].reduce((m,s)=>{const r=s.getBoundingClientRect();return r.top<=m+1.5&&r.bottom>m?r.bottom:m;},0);
      scrollBy(0,e.getBoundingClientRect().top-lim-12);}
    return [...pt(),hit()];})()`); }
  if (!r) throw new Error('no element: ' + finder);
  if (process.env.DEBUG) log('   click', finder.slice(0, 50), r.map(Math.round), await ev(`(()=>{const e=document.elementFromPoint(${r[0]},${r[1]});return e&&e.tagName+'.'+e.className+' '+e.textContent.slice(0,20)})()`));
  await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r[0], y: r[1] });
  await S('Input.dispatchMouseEvent', { type: 'mousePressed', x: r[0], y: r[1], button: 'left', clickCount: 1 });
  await S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r[0], y: r[1], button: 'left', clickCount: 1 });
  await sleep(700);
}
const box = i => `document.querySelector('details.split[data-gi="${i}"]')`;
const place = (i, k) => `document.querySelector('details.stopd[data-k="${i}.${k}"]')`;
const sw = (i, v) => `${box(i)}.querySelector('.trsw button[data-v="${v}"]')`;
const pt = (i, k) => `${place(i, k)}.querySelector('.pt')`;
const state = i => ev(`(()=>{const b=${box(i)},w=b.querySelector('.trsw'),on=[...w.querySelectorAll('button')].map(x=>x.className||'-').join('/');return {sw:on,mixed:!w.querySelector('.mx').hidden,
  places:[...b.querySelectorAll('details.stopd')].map(p=>(p.open?'O':'c')+(p.querySelector('.pt').textContent.replace('teams ',''))).join(' ')};})()`);
// first trainer row whose top edge is at/below the pinned stack, found independently of the template's own code
const probe = `(()=>{let lim=document.querySelector('header').getBoundingClientRect().bottom;const b=document.querySelector('details.split[open]');
  for(const s of ['details.split[open]>summary','.trsw']){document.querySelectorAll(s).forEach(e=>{const r=e.getBoundingClientRect();if(r.top<=lim+1.5&&r.bottom>lim)lim=r.bottom;});}
  document.querySelectorAll('details.stopd[open]>summary').forEach(e=>{const r=e.getBoundingClientRect();if(r.top<=lim+1.5&&r.bottom>lim)lim=r.bottom;});
  const rows=[...document.querySelectorAll('details.trd')].filter(d=>d.getClientRects().length&&d.getBoundingClientRect().top>=lim-1&&d.getBoundingClientRect().top<innerHeight);
  const d=rows[0];return d?{k:d.dataset.k,name:d.querySelector('summary').textContent.trim().slice(0,24),top:d.getBoundingClientRect().top,lim,sy:scrollY}:{lim,sy:scrollY};})()`;
const topOf = k => ev(`(()=>{const d=document.querySelector('details.trd[data-k="${k}"]');return d&&d.getClientRects().length?d.getBoundingClientRect().top:null;})()`);

for (const [w, h] of [[260, 316], [538, 425]]) for (const kb of [false, true]) {
  if (process.env.ONLY && process.env.ONLY !== `${w}${kb ? 'kb' : ''}`) continue;
  log(`\n=== ${w}x${h} ${kb ? 'dvkb' : 'normal'}`);
  await load(w, h, kb, { o: { 0: 1, 1: 1 } });
  check(errs.length === 0, 'no page errors on load ' + errs.join(' | '));
  // pinned stack gaps, inside a long place (Hau'oli City, 16 trainers: 0.11)
  await ev(`(()=>{const p=${place(0, 11)};p.scrollIntoView();scrollBy(0,170);})()`); await sleep(500);
  const g = await ev(`(()=>{const h=document.querySelector('header').getBoundingClientRect(),s=${box(0)}.querySelector(':scope>summary').getBoundingClientRect(),w=${box(0)}.querySelector('.trsw').getBoundingClientRect(),
    p=[...${box(0)}.querySelectorAll('details.stopd[open]>summary')].find(x=>{const r=x.getBoundingClientRect();return r.top>=w.bottom-3&&r.top<=w.bottom+3;});const pr=p&&p.getBoundingClientRect();
    return {hdrB:h.bottom,isT:s.top,isB:s.bottom,swT:w.top,swB:w.bottom,plT:pr&&pr.top,plTxt:p&&p.textContent.slice(0,20),wide:document.documentElement.scrollWidth,iw:innerWidth};})()`);
  log('  stack', JSON.stringify(g));
  check(g.isB < g.hdrB && near(g.swT - g.hdrB, -1, 1) && g.plT != null && near(g.plT - g.swB, -2, 1), 'pinned stack flush (search bar / Show / place; island header scrolled away)');
  check(g.wide <= g.iw, `no horizontal overflow (${g.wide} <= ${g.iw})`);
  const wide = await ev(`[...document.querySelectorAll('#app *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+1).slice(0,3).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))`);
  check(wide.length === 0, 'nothing wider than the window ' + wide.join(', '));
  if (dir) { const shot = await S('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(dir, `stack-${w}-${kb ? 'kb' : 'n'}.png`), Buffer.from(shot.result.data, 'base64')); }

  // --- scenario 1: Melemele mixed -> Trainers -> Trainers
  await load(w, h, kb, { o: { 0: 1 } });
  await ev(`scrollTo(0,0)`);
  await click(sw(0, 2)); let s0 = await state(0); log('  Teams:', JSON.stringify(s0));
  await click(sw(0, 1)); s0 = await state(0); log('  Trainers:', JSON.stringify(s0));
  await click(pt(0, 0)); await click(pt(0, 4));          // Route 1, Route 2: teams open
  await click(`${place(0, 0)}.querySelector(':scope>summary')`); // close Route 1 by hand (summary tap)
  s0 = await state(0); log('  mixed setup:', JSON.stringify(s0));
  check(s0.mixed && !/on|part/.test(s0.sw) && /^c3\/3|^c/.test(s0.places) , 'switch shows mixed, nothing lit; Route 1 closed with cards open');
  if (dir) { await ev(`${box(0)}.scrollIntoView()`); await sleep(300); const shot = await S('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(dir, `mixed-${w}-${kb ? 'kb' : 'n'}.png`), Buffer.from(shot.result.data, 'base64')); }
  const r1 = s0.places.split(' ')[0];
  await click(sw(0, 1)); s0 = await state(0); log('  Trainers (1st):', JSON.stringify(s0));
  check(s0.places.split(' ')[0] === r1 && s0.places.split(' ')[0][0] === 'c', 'Trainers: Route 1 still closed with its cards as left (' + r1 + ')');
  check(s0.places.split(' ')[4].endsWith('0/9') && s0.places.split(' ')[4][0] === 'O', 'Trainers: Route 2 cards closed');
  check(/part/.test(s0.sw.split('/')[1]) && !s0.mixed, 'switch: Trainers outlined (' + s0.sw + ')');
  await click(sw(0, 1)); s0 = await state(0); log('  Trainers (2nd):', JSON.stringify(s0));
  check(/^O.*0\//.test(s0.places.split(' ')[0]) && s0.places.split(' ').every(p => p[0] === 'O'), 'Trainers again: every place open, Route 1 cards closed');
  check(/on/.test(s0.sw.split('/')[1]) && !/part/.test(s0.sw), 'switch: Trainers solid (' + s0.sw + ')');
  const ls = await ev(`localStorage.getItem('pstr')`); check(!ls.includes('"p":{"0.0":0') , 'LS.tr: Route 1 open again after Trainers x2');
  await click(sw(0, 0)); s0 = await state(0); log('  Places:', JSON.stringify(s0)); check(s0.places.split(' ').every(p => p[0] === 'c') && /on/.test(s0.sw.split('/')[0]), 'Places closes every place (solid)');
  await click(sw(0, 2)); s0 = await state(0); check(s0.places.split(' ').every(p => p[0] === 'O' && /(\d+)\/\1$/.test(p)), 'Teams with no place open: every place open, every card open');

  // --- scenario 2: Route 4 (gi 1, si 1), Sightseer Scotty
  await load(w, h, kb, { o: { 1: 1 } });
  await ev(`${box(1)}.scrollIntoView()`); await sleep(300);
  let ps = (await state(1)).places.split(' ')[1]; log('  Route 4 at start:', ps);
  await click(pt(1, 1)); ps = (await state(1)).places.split(' ')[1]; if (!/ 0\/5/.test(' ' + ps.slice(1))) { await click(pt(1, 1)); }
  ps = (await state(1)).places.split(' ')[1]; log('  Route 4 now:', ps);
  const kScotty = await ev(`[...${place(1, 1)}.querySelectorAll('details.trd')].find(d=>/Scotty/.test(d.textContent)).dataset.k`);
  await click(`${place(1, 1)}.querySelector('details.trd[data-k="${kScotty}"]>summary')`);  // open Scotty
  // scroll so Scotty's row sits ~60px under the pinned stack
  await ev(`(()=>{const d=document.querySelector('details.trd[data-k="${kScotty}"]');const lim=${box(1)}.querySelector('.trsw').getBoundingClientRect().bottom+${place(1, 1)}.querySelector(':scope>summary').getBoundingClientRect().height;scrollBy(0,d.getBoundingClientRect().top-lim-8);})()`); await sleep(400);
  const pr0 = await ev(probe); const t0 = await topOf(kScotty); log('  before:', JSON.stringify(pr0), 'Scotty top', t0);
  const openBefore = await ev(`${place(1, 1)}.open`);
  await click(pt(1, 1), 'true');
  const openAfter = await ev(`${place(1, 1)}.open`);
  const pr1 = await ev(probe); const t1 = await topOf(kScotty); ps = (await state(1)).places.split(' ')[1];
  log('  after teams (->5/5):', JSON.stringify(pr1), 'Scotty top', t1, ps);
  check(openBefore && openAfter, 'place toggle click did not toggle the place (open stays ' + openAfter + ')');
  check(ps.endsWith('5/5') && near(t1, t0, 1.5), `Scotty doesn't move on 5/5 (${t0} -> ${t1})`);
  await click(pt(1, 1), 'true');
  const t2 = await topOf(kScotty); ps = (await state(1)).places.split(' ')[1]; const pr2 = await ev(probe);
  log('  after teams (->0/5):', JSON.stringify(pr2), 'Scotty top', t2, ps);
  const lim2 = pr2.lim;
  check(ps.endsWith('0/5') && near(t2, t0, 1.5) && t2 >= lim2 - 1, `Scotty's row stays put on 0/5 (${t0} -> ${t2}, pinned stack bottom ${lim2})`);
  check(pr0.k === kScotty && pr2.k === kScotty, 'first row under the stack is still Scotty: ' + pr2.name);
  if (dir) { const shot = await S('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(dir, `scotty-${w}-${kb ? 'kb' : 'n'}.png`), Buffer.from(shot.result.data, 'base64')); }
  // top bar and Show switch Places from deep in the page: anchor holds
  await click(sw(1, 0)); const pr3 = await ev(probe); log('  after Places:', JSON.stringify(pr3));
  // --- hand toggles update the place button and the switch; a reload derives the same state; no new storage key
  await click(sw(1, 2)); await click(sw(1, 2)); let s1 = await state(1); log('  Teams solid:', JSON.stringify(s1));
  const kOne = await ev(`${place(1, 1)}.querySelector('details.trd').dataset.k`);
  await click(`${place(1, 1)}.querySelector('details.trd[data-k="${kOne}"]>summary')`); s1 = await state(1); log('  one card closed by hand:', JSON.stringify(s1));
  check(s1.places.split(' ')[1] === 'O4/5' && s1.mixed && !/on|part/.test(s1.sw), 'hand toggle: Route 4 button 4/5, switch mixed');
  const keys0 = await ev(`Object.keys(localStorage).sort().join(',')`);
  await S('Page.reload'); await sleep(2500); const s2 = await state(1); log('  after reload:', JSON.stringify(s2));
  check(s2.places === s1.places && s2.sw === s1.sw && s2.mixed === s1.mixed, 'reload: same switch and place buttons');
  const keys1 = await ev(`Object.keys(localStorage).sort().join(',')`); check(keys0 === keys1, 'no new localStorage key (' + keys1 + ')');
  // keyboard: Enter on a focused teams button presses it and leaves the place open
  await ev(`${pt(1, 1)}.focus()`);
  for (const type of ['keyDown', 'keyUp']) await S('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, ...(type === 'keyDown' ? { text: String.fromCharCode(13) } : {}) });
  await sleep(500); const s3 = await state(1); log('  Enter on Route 4 teams:', s3.places.split(' ')[1]);
  check(s3.places.split(' ')[1] === 'O5/5', 'keyboard Enter on the teams button fills the place, place stays open');
  check(errs.length === 0, 'no page errors after the scenarios ' + errs.join(' | '));
}
log(fails ? `\n${fails} FAIL` : '\nall ok');
if (dir) writeFileSync(join(dir, 'show-check.log'), out.join('\n'));
ch.kill(); process.exit(fails ? 1 : 0);

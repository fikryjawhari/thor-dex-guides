// Render two builds of a guide route by route in headless Chrome and compare the DOM (scripts removed), with every
// <details> opened so lazily built sections are compared too. Used to check a template change renders the same.
// Visits every Pokemon, move, ability, item, nonempty move property, location and trainer route, then the list pages.
// Usage: node tools/domcompare.mjs <old.html> <new.html> [--kb] [--routes=pattern] [--jobs=N] [--ignore=regex ...]
//          [--accept-routes=glob,glob]
//   --kb      sets localStorage "dvkb" = "1" (the in-viewer keyboard and number boxes)
//   --routes  keep routes containing pattern (=pattern: exactly that route)
//   --jobs    split the routes into N chunks, each swept in its own old and new tab at once (default: a quarter of the CPU threads).
//             Each tab is its own browser context (own localStorage), and old and new see the same routes in the
//             same order, so state carried over between routes is the same on both sides.
//   --ignore  remove what matches regex from every snapshot before comparing (expected changes, e.g. --ignore=" bt"
//             for a new class); can be given more than once.
//   --accept-routes  routes whose DOM is expected to change (comma globs, `*` any characters: '#/calc', '#/tr/*'): a
//             differing one is listed as "accepted, differs" and doesn't fail. tools/gate.py passes the job's accepts
//             (--accept-routes, .tmp/accept.json).
// Build stamps (the footer's "built <date>") are normalised away first: tools/domnorm.mjs.
// Flagged routes are loaded fresh first (up to FRESH=n of them, default 100; the rest count as differing); those that
// still differ are replayed alone with their chunk's history (REPLAY=n, default 3), and only a route that differs again
// counts and is printed (SHOW=n, default 2; LIST=1 lists every differing route).
// Exit code 0: identical and no page errors, 1: not, 2: Chrome failed.
// Needs Chrome or Edge (CHROME env var, or the usual Windows install paths). Node 22+ (fetch, WebSocket).
// Picks a free debugging port; run whole sweeps one at a time to avoid layout-timing noise from CPU contention.
// content-visibility is forced to visible in every tab (see tab()): offscreen skipped parts are not observed or measured, so DOM that depends on them varied from run to run.
// IPC flooding protection is off: each route makes 2 history updates and Chrome stalls a tab for ~10 s after 200.
// Timing --jobs: tools/README.md.
import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from './browser.mjs';
import { normalise, routeMatcher } from './domnorm.mjs';

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--')).map(f => pathToFileURL(resolve(f)).href);
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const KB = args.includes('--kb'), PAT = opt('routes'), JOBS = Math.max(1, +opt('jobs') || Math.max(2, availableParallelism() >> 2));
const IGN = args.filter(a => a.startsWith('--ignore=')).map(a => a.slice(9));
const ACCEPTED = routeMatcher(args.filter(a => a.startsWith('--accept-routes=')).flatMap(a => a.slice(16).split(',')));
let closing = false, browser;
const fail = msg => { if (!closing) { console.log(msg); cleanup().then(() => process.exit(2)); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now(), secs = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

// One browser-level connection; each tab is a flat session on it.
const connect = async () => {
  browser = await startBrowser({ profilePrefix: 'domcmp-', onDisconnect: fail, flags: ['--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-ipc-flooding-protection'] });
};
const send = (method, params, sessionId) => browser.send(method, params, sessionId);

async function tab() {
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId, width: 480, height: 800 });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  // content-visibility:auto skips what is off screen, and nothing inside a skipped subtree is observed (ResizeObserver: the
  // guide's --sh / --ch header heights) or measured (the collapse bars): which parts were rendered at snapshot time depended
  // on scroll and timing, so identical builds differed from run to run. Render everything in the harness.
  await send('Page.enable', {}, sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `new MutationObserver((m, o) => { if (document.head) {
    document.head.appendChild(document.createElement('style')).textContent = '*{content-visibility:visible!important}'; o.disconnect(); } })
    .observe(document, { childList: true, subtree: true })` }, sessionId);
  const ev = async expr => {
    const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (m.error || m.result?.exceptionDetails) throw new Error(JSON.stringify(m.error || m.result.exceptionDetails).slice(0, 800));
    return m.result?.result?.value;
  };
  const nav = url => send('Page.navigate', { url }, sessionId);
  const close = () => send('Target.disposeBrowserContext', { browserContextId });
  return { ev, nav, close };
}

// Runs in the page: visit each route, open every <details> until none are left closed, hash the body.
const PAGE = `async (routes, want, ign) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // Attributes are put in name order first: their serialised order is the order they were set in, so a style that a
  // ResizeObserver wrote before or after a box's open attribute made identical pages differ (Photonic #/walk, 2026-11-02).
  const snap = () => { const b = document.body.cloneNode(true); b.querySelectorAll('script').forEach(s => s.remove());
    // The rail's jump buttons are enabled or not by the scroll position (dex.js jumpState), which under load lagged and
    // then carried from route to route (Radical Red, 2026-11-02): left out here; tools/scenarios/blocks.mjs tests them.
    b.querySelectorAll('.rjump [data-j]').forEach(x => x.removeAttribute('disabled'));
    for (const el of b.querySelectorAll('*')) { if (el.attributes.length < 2) continue;
      const at = [...el.attributes].map(a => [a.name, a.value]).sort((p, q) => p[0] < q[0] ? -1 : 1);
      for (const [n] of at) el.removeAttribute(n); for (const [n, v] of at) el.setAttribute(n, v); }
    let h = (${normalise.toString()})(b.innerHTML); for (const p of ign) h = h.replace(new RegExp(p, 'g'), '');
    return h.replace(/blob:[^)"]+/g, 'blob').replace(/ class=""/g, '').replace(/>\\s+</g, '><').trim(); };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; };
  // Lazy sections fill on toggle events and timers: wait until the DOM has had no change for a while.
  let muts = 0; new MutationObserver(() => muts++).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  const quiet = async (ms, max) => { const end = performance.now() + max; let n; do { n = muts; await sleep(ms); if (muts === n) return true; } while (performance.now() < end); return false; };
  // The guide's rAF work (the collapse bars) and ResizeObserver callbacks run in rendering frames: after the DOM is quiet,
  // also wait until a whole frame pair (and a task turn: DC_SLEEP ms, default 0; it was 25 until 2026-11-02, which
  // cost a third of the sweep with no route ever differing) passes with nothing changing.
  const frame = () => Promise.race([new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), sleep(500)]);
  const settled = async max => { const end = performance.now() + max; let n; do { n = muts; await frame(); await sleep(${+(process.env.DC_SLEEP ?? 0)}); } while (muts !== n && performance.now() < end); return muts === n; };
  const out = {}, errs = [], slow = [], busy = [], kinds = {};
  window.addEventListener('error', e => errs.push(e.message));
  for (const r of routes) {
    const t0 = performance.now();
    // Wait for this route's own hashchange (render runs inside the guide's handler, registered first). Matching the
    // URL keeps a late event from an earlier route from being taken for this one.
    if (location.hash !== r) {
      let f; const done = new Promise(res => addEventListener('hashchange', f = e => { if (e.newURL === location.href) res(0); }));
      location.hash = r;
      if (await Promise.race([done, sleep(5000).then(() => 1)])) slow.push(r);
      removeEventListener('hashchange', f);
    }
    for (let k = 0; k < 6; k++) { const ds = [...document.querySelectorAll('#app details:not([open])')]; if (!ds.length) break; ds.forEach(d => d.open = true); await quiet(10, 1000); }
    if (!await settled(1500)) busy.push(r);
    // Trainer cards fill lazily (IntersectionObserver) without re-running the collapse bars, so which bars are shown depends on
    // when the last fill landed: recompute them from the final layout.
    if (typeof bars === 'function') { bars(); await frame(); }
    const s = snap();
    out[r] = want.includes(r) ? s : hash(s);
    const kind = r.split('/').slice(0, 2).join('/'), k = kinds[kind] || (kinds[kind] = [0, 0]);
    k[0]++; k[1] += performance.now() - t0;
  }
  return { out, errs, slow, busy, kinds };
}`;

// Load the file fresh in tab t (localStorage cleared, dvkb set before the guide boots), then sweep routes.
async function run(t, url, routes, want = []) {
  await t.nav(url);
  for (let i = 0; i < 100 && !(await t.ev('document.readyState==="complete"').catch(() => 0)); i++) await sleep(50);
  await t.ev(`localStorage.clear();${KB ? "localStorage.setItem('dvkb','1');" : ''}0`);
  await t.nav('about:blank'); await t.nav(url + '#/');
  for (let i = 0; i < 200 && !(await t.ev('typeof P!=="undefined"&&document.querySelector("#app").children.length>0').catch(() => 0)); i++) await sleep(50);
  // Big list pages last: their scroll-restore timers can still be running when the next route is snapshotted.
  if (!routes) return t.ev(`(()=>{const r=[];
    P.forEach(p=>r.push('#/p/'+p.id));M.forEach((m,i)=>r.push('#/m/'+i));AB.forEach((a,i)=>r.push('#/a/'+i));
    Object.keys(itemIdx()).forEach(n=>r.push(ihref(n)));
    Object.keys(MOVE_PROPS).filter(prop=>propertyMoves(prop).length).forEach(prop=>r.push('#/mp/'+prop));
    LOC.forEach((l,i)=>r.push('#/l/'+i));TRS.forEach(t=>r.push('#/tr/'+t.k));
    return r.concat(['#/','#/locs','#/trainers','#/items','#/walk','#/calc']);})()`);
  return t.ev(`(${PAGE})(${JSON.stringify(routes)}, ${JSON.stringify(want)}, ${JSON.stringify(IGN)})`);
}

async function cleanup() { closing = true; await browser?.close(); }

let code = 0;
try {
  await connect();
  const first = await tab();
  let routes = await run(first, files[0]); await first.close();
  if (PAT) routes = routes.filter(r => PAT.startsWith('=') ? r === PAT.slice(1) : r.includes(PAT));
  // Routes are dealt round-robin: kinds cost very different amounts (a location page ~600 ms, the rest ~90 ms), and
  // contiguous chunks left one tab pair with every location page while the others sat idle. The list pages stay last.
  const n = Math.min(JOBS, routes.length || 1), size = Math.ceil(routes.length / n);
  const chunks = Array.from({ length: n }, (_, i) => routes.filter((_, j) => j % n === i)).filter(c => c.length);
  console.log(routes.length, 'routes', KB ? '(keyboard mode)' : '', `in ${chunks.length} chunks of up to ${size}`);
  const sweep = async (url, c) => { const t = await tab(); try { return await run(t, url, c); } finally { await t.close(); } };
  const res = await Promise.all(chunks.map(c => Promise.all([sweep(files[0], c), sweep(files[1], c)])));
  const a = { out: {}, slow: [], busy: [], errs: [] }, b = { out: {}, slow: [], busy: [], errs: [] };
  for (const [x, y] of res) for (const [s, d] of [[x, a], [y, b]]) { Object.assign(d.out, s.out); for (const k of ['slow', 'busy', 'errs']) d[k].push(...s[k]); }
  console.log(`swept in ${secs()}`);
  const kinds = {};
  for (const [x, y] of res) for (const s of [x, y]) for (const [kind, [n, ms]] of Object.entries(s.kinds || {})) { const k = kinds[kind] || (kinds[kind] = [0, 0]); k[0] += n; k[1] += ms; }
  console.log('time by route kind (both builds, tab-seconds):', Object.entries(kinds).sort((p, q) => q[1][1] - p[1][1])
    .map(([kind, [n, ms]]) => `${kind} ${n} ${(ms / 1000).toFixed(1)}s (${Math.round(ms / n)} ms)`).join(', '));
  const differs = routes.filter(r => a.out[r] !== b.out[r]);
  const accepted = differs.filter(ACCEPTED), flagged = differs.filter(r => !ACCEPTED(r));
  if (routes.some(ACCEPTED)) console.log(`accepted, differs: ${accepted.length}`, accepted.join(' '),
    `| accepted, identical: ${routes.filter(r => ACCEPTED(r) && !accepted.includes(r)).join(' ') || '-'}`);
  console.log('no hashchange (old/new):', a.slow.length, b.slow.length, a.slow.slice(0, 5));
  console.log('never settled (old/new):', a.busy.length, b.busy.length, a.busy.slice(0, 5));
  console.log('page errors old:', a.errs.length, a.errs.slice(0, 3), ' new:', b.errs.length, b.errs.slice(0, 3));
  // Load each flagged route fresh in both builds (spread over the same number of tab pairs).
  const fresh = new Set();
  if (flagged.length) {
    const q = flagged.slice(0, +(process.env.FRESH ?? 100));
    await Promise.all(chunks.map(async () => {
      const [ta, tb] = [await tab(), await tab()];
      for (let r; (r = q.shift());) { const [x, y] = await Promise.all([run(ta, files[0], [r]), run(tb, files[1], [r])]); if (x.out[r] === y.out[r]) fresh.add(r); }
      await ta.close(); await tb.close();
    }));
  }
  let bad = flagged.filter(r => !fresh.has(r));
  console.log(`flagged by the sweep: ${flagged.length}, rechecked fresh: ${Math.min(flagged.length, +(process.env.FRESH ?? 100))}, identical on a fresh load: ${fresh.size}`, [...fresh].slice(0, 10).join(' '));
  // Still differing: replay each (up to REPLAY, default 3: a replay sweeps the chunk up to the route) alone, after the
  // sweep. Identical on replay: timing (a huge page such as #/walk not settled while 8 checks ran at once). Differing
  // again: printed (SHOW, default 2) and counted. Past REPLAY, every remaining route counts.
  const replayed = [], shown = [];
  for (const r of bad.slice(0, +(process.env.REPLAY ?? 3))) {
    const c = chunks.find(c => c.includes(r)), upTo = c.slice(0, c.indexOf(r) + 1);  // same history as the sweep
    const [ta, tb] = [await tab(), await tab()];
    const [x, y] = (await Promise.all([run(ta, files[0], upTo, [r]), run(tb, files[1], upTo, [r])])).map(o => o.out[r]);
    await ta.close(); await tb.close();
    if (x === y) { replayed.push(r); continue; }
    if (shown.length >= +(process.env.SHOW || 2)) continue;
    shown.push(r);
    let i = 0; while (i < x.length && x[i] === y[i]) i++;
    console.log(`\n== ${r} (lengths ${x.length} / ${y.length}) first difference at ${i}:\n old: ${x.slice(Math.max(0, i - 150), i + 250)}\n new: ${y.slice(Math.max(0, i - 150), i + 250)}`);
  }
  bad = bad.filter(r => !replayed.includes(r));
  if (replayed.length) console.log('identical when replayed alone (timing under load):', replayed.join(' '));
  console.log('differing routes:', bad.length, bad.slice(0, process.env.LIST ? bad.length : 40).join(' '));
  if (bad.length || a.errs.length || b.errs.length) code = 1;
  console.log(`done in ${secs()}`);
} catch (e) { console.log(e.message); code = 2; }
await cleanup();
process.exit(code);

// Shared harness for the calc checks: tools/scenarios/calc-*.mjs (the spec's checks 1-26) and tools/calc_save_check.mjs.
// It lives outside tools/scenarios/ because the gate runs every *.mjs there as a scenario.
//
//   const file = prepareGuide(dist, { tag, edit })   a copy of a built guide in .tmp/calc-checks/ (null: no cfg.calc)
//   await runChecks({ name, file, checks })         each check at its sizes and modes; table, screenshots, exit code
//   const page = await Page.open(browser, opts)      one isolated page (own storage); taps, number boxes, file input
//
// Preparation only: when the profile names no save reader, the `test` reader is injected (template/calc/readers/test.js)
// and `save: 'test'` set in the copy, so the real file input imports JSON fixtures. `edit(data)` patches a copy's data
// (fixtures only, e.g. a long trainer name); the built dist is never changed. Every calc guide runs the same checks: the
// copy's trainers are picked by role from its own data (trainerRoles) and the save fixtures, written in EI's ids, are
// copied into its ids (guideSaves); a check whose role the guide lacks is skipped (runChecks: `skip`).
// Taps are real mouse events at the element's centre, after checking that element is what the point hits (a covered
// control fails the check, as it would under a finger). Number boxes are driven as the page shows them: an input in a
// browser, the number pad in dvkb mode.
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startBrowser } from './browser.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, '.tmp', 'calc-checks');
export const FIXTURES = join(ROOT, 'tools', 'scenarios', 'fixtures', 'calc');
const TEST_READER = join(ROOT, 'template', 'calc', 'readers', 'test.js');
const sleep = ms => new Promise(done => setTimeout(done, ms));

export function readGuide(file) {
  const html = readFileSync(file, 'utf8');
  const match = html.match(/(<script id="data"[^>]*>)([\s\S]*?)(<\/script>)/);
  if (!match) throw new Error(`no #data script in ${file}`);
  return { html, match, data: JSON.parse(match[2]) };
}

// The guide a scenario runs on (prepareGuide sets it): its data, its trainer roles, its species ids and the folder
// with the save fixtures in its own ids. Setup and import read it, so one scenario runs on every calc guide.
let GUIDE = null;
export const guide = () => GUIDE;

export function prepareGuide(file, { tag, edit } = {}) {
  const { html, match, data } = readGuide(file);
  if (!data.cfg.calc) return null;
  const trainers = trainerRoles(data);
  edit?.(data);
  let page = html;
  let injected = false;
  if (!data.cfg.calc.save) {
    data.cfg.calc.save = 'test';
    injected = true;
  }
  page = page.replace(match[0], () => match[1] + JSON.stringify(data).replaceAll('</', '<\\/') + match[3]);
  if (injected) page = page.replace('window.DMG.init(sourceData,prof);', () => readFileSync(TEST_READER, 'utf8') + '\nwindow.DMG.init(sourceData,prof);');
  mkdirSync(OUT, { recursive: true });
  const name = file.split(/[\\/]/).pop();
  const out = join(OUT, `${tag || 'guide'}-${name}`);
  writeFileSync(out, page);
  GUIDE = { name: name.replace(/\.html$/, ''), data, trainers, species: speciesId(data), saves: guideSaves(data, `${tag || 'guide'}-${name.replace(/\.html$/, '')}`) };
  return out;
}

// The fixture saves are written in Emerald Imperium's ids ("ids": "ours"). guideSaves copies them into a guide's own ids
// by name (an id the guide has under the same name stays, so EI's copies are the fixtures unchanged): species (a missing
// one becomes the guide's species with that dex number, else its first), moves (a missing one an empty slot), abilities
// (a missing one the species' first). The file names stay, since the banner shows them. Returns the folder.
const EI_DATA = join(ROOT, 'hacks', 'emerald-imperium', 'data.json');
export function guideSaves(data, tag) {
  const ei = JSON.parse(readFileSync(EI_DATA, 'utf8'));
  const eiSpecies = new Map(ei.P.map(entry => [String(entry.id), entry]));
  const byId = new Map(data.P.map(entry => [String(entry.id), entry]));
  const byName = new Map(data.P.map(entry => [entry.n, String(entry.id)]));
  const byDex = new Map([...data.P].reverse().map(entry => [entry.dex, String(entry.id)]));
  const species = id => {
    const source = eiSpecies.get(String(id));
    if (!source) return String(id);
    if (byId.get(String(id))?.n === source.n) return String(id);
    return byName.get(source.n) ?? byDex.get(source.dex) ?? String(data.P[0].id);
  };
  const index = (list, eiList, value, name = entry => entry) => {
    if (value == null || value < 0 || !eiList[value]) return value;
    const wanted = name(eiList[value]);
    if (list[value] != null && name(list[value]) === wanted) return value;
    const found = list.findIndex(entry => name(entry) === wanted);
    return found >= 0 ? found : null;
  };
  const mon = entry => ({ ...entry, sp: species(entry.sp), mv: (entry.mv || []).map(move => index(data.M, ei.M, move)),
    ab: index(data.AB, ei.AB, entry.ab, ability => ability[0]) });
  const folder = join(OUT, 'saves', tag);
  mkdirSync(folder, { recursive: true });
  for (const name of readdirSync(FIXTURES).filter(name => name.endsWith('.json'))) {
    const save = JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));
    if (save.ids === 'ours' && Array.isArray(save.party)) {
      save.party = save.party.map(mon);
      save.boxes = (save.boxes || []).map(box => box.map(mon));
    }
    writeFileSync(join(folder, name), JSON.stringify(save, null, 1));
  }
  return folder;
}

// A species' id in this guide by name (EI's 445 is Garchomp; Photonic's ids are names).
export const speciesId = data => name => String(data.P.find(entry => entry.n === name)?.id ?? '');

// The trainers the checks need, picked from the guide's own data (walkthrough order, the first that fits; Pokémon with
// species the guide has and moves listed, singles battles). null where the guide has none: the check that needs it is skipped.
// - sheetOnly: the first trainer; fixturePatches takes its first Pokémon's moves and ability (the unknown-set rules).
// - four: four Pokémon (setup's default foe; check 1 fits its rows, check 13 takes its cap as a new set's level).
// - relative: a cap and at least three Pokémon, some with levels relative to the cap (check 3, the cap box).
// - six: six Pokémon with fixed levels (check 20, the foe list).
// - longName: the first other trainer; fixturePatches gives it a long name (check 17).
export function trainerRoles(data) {
  const list = data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr));
  const known = new Set(data.P.map(entry => String(entry.id)));
  // singles only: a double / triple / multi battle switches the calc's layout (tags differ by guide)
  const singles = trainer => !(trainer.tags || []).some(tag => /double|triple|multi|2on2/i.test(tag));
  const usable = trainer => singles(trainer) && trainer.p.length > 0 && trainer.p.every(mon => known.has(String(mon.id)) && mon.m?.length);
  const first = list[0];
  const find = test => list.find(trainer => trainer !== first && usable(trainer) && test(trainer)) ?? null;
  const four = find(trainer => trainer.p.length === 4);
  const relative = find(trainer => trainer.cap != null && trainer.p.length >= 3 && trainer.p.some(mon => mon.l == null));
  const six = find(trainer => trainer.p.length === 6 && trainer.p.every(mon => mon.l != null));
  const taken = new Set([first, four, relative, six]);
  const longName = list.find(trainer => !taken.has(trainer)) ?? null;
  const role = trainer => trainer && { k: trainer.k, n: trainer.n, cap: trainer.cap ?? null, size: trainer.p.length };
  return { sheetOnly: role(first), four: role(four), relative: role(relative), six: role(six), longName: role(longName) };
}

// Fixture patches to the data copy the checks run on (never the dist): the sheet-only trainer (trainerRoles) loses its
// first Pokémon's moves and ability (no guide has a Pokémon with a missing set, so the unknown-set rules need one), and
// the long-name trainer gets the spec's long name (no guide has one that long). Every scenario applies this to its copy.
export function fixturePatches(data) {
  const roles = trainerRoles(data);
  for (const group of data.TR.g) for (const section of group.sec) for (const trainer of section.tr) {
    if (trainer.k === roles.sheetOnly?.k) {
      trainer.n = 'Rival Brendan (sheet only)';
      trainer.p[0].m = [];
      delete trainer.p[0].a;
    }
    if (trainer.k === roles.longName?.k) trainer.n = 'Team Aqua Grunt Petalburg Woods';
  }
}

export class Page {
  static async open(browser, opts) {
    const page = new Page(browser, opts);
    await page.init();
    return page;
  }

  constructor(browser, { file, width, height, dvkb = false, ready }) {
    this.browser = browser;
    this.file = file;
    this.ready = ready || Page.booted;
    this.width = width;
    this.height = height;
    this.dvkb = dvkb;
    this.errors = [];
  }

  async init() {
    const { result: { browserContextId } } = await this.browser.send('Target.createBrowserContext');
    this.contextId = browserContextId;
    const { result: { targetId } } = await this.browser.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { result: { sessionId } } = await this.browser.send('Target.attachToTarget', { targetId, flatten: true });
    this.sessionId = sessionId;
    this.browser.register(sessionId, this.errors);
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Log.enable');
    await this.send('Emulation.setDeviceMetricsOverride', { width: this.width, height: this.height, deviceScaleFactor: 1, mobile: false });
    await this.send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('dvkb',${JSON.stringify(this.dvkb ? '1' : '0')});}catch(e){}` });
    await this.goto('#/', this.ready);
  }

  send(method, params = {}) {
    return this.browser.send(method, params, this.sessionId).then(reply => {
      if (reply.error) throw new Error(`${method}: ${JSON.stringify(reply.error)}`);
      return reply.result;
    });
  }

  // Runs an expression in the page; throws on a page exception.
  async value(expression) {
    const reply = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (reply.exceptionDetails) throw new Error(`page exception: ${reply.exceptionDetails.exception?.description || reply.exceptionDetails.text}\n  in: ${expression.slice(0, 160)}`);
    return reply.result?.value;
  }

  async waitFor(expression, label, timeout = 6000) {
    for (let waited = 0; waited < timeout; waited += 50) {
      if (await this.value(expression)) return;
      await sleep(50);
    }
    throw new Error(`timed out waiting for ${label}`);
  }

  // Two animation frames plus a short pause: the page renders synchronously, but scroll and open work may land a frame later.
  async settle() {
    await this.value('new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(done,20))))');
  }

  // Rendered: the route's first paint (window.CALC only exists in guides with cfg.calc, so it is not waited for).
  static booted = 'document.readyState==="complete"&&typeof P!=="undefined"&&document.querySelector("#app").children.length>0';

  async goto(hash = '', ready = this.ready) {
    await this.send('Page.navigate', { url: pathToFileURL(this.file).href + hash });
    await this.waitFor(ready, 'the guide to boot');
    await this.settle();
  }

  async reload() {
    await this.send('Page.reload');
    await this.waitFor(Page.booted, 'the guide to reload');
    await this.settle();
  }

  // Hash change inside the same document (route change, no reload).
  async route(hash) {
    await this.value(`location.hash=${JSON.stringify(hash)}`);
    await this.settle();
  }

  async resize(width, height) {
    this.width = width;
    this.height = height;
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await this.settle();
  }

  // Where a tap would land: the element is what the point hits, and the point is on screen.
  async locate(selector, { index = 0, at } = {}) {
    const info = await this.value(`(() => {
      const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r = el.getBoundingClientRect();
      const x = ${at ? `r.left + ${Number(at[0])}` : 'r.left + r.width / 2'};
      const y = ${at ? `r.top + ${Number(at[1])}` : 'r.top + r.height / 2'};
      const hit = document.elementFromPoint(x, y);
      const onScreen = x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight;
      return { x, y, onScreen, covered: !hit || !(hit === el || el.contains(hit)),
        hit: hit ? hit.tagName.toLowerCase() + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.trim().split(/\\s+/).join('.') : '') + ' "' + (hit.textContent || '').trim().slice(0, 24) + '"' : 'nothing' };
    })()`);
    if (!info) throw new Error(`no element for ${selector} [${index}]`);
    return info;
  }

  async tap(selector, options = {}) {
    const info = await this.locate(selector, options);
    if (!info.onScreen) throw new Error(`${selector} [${options.index || 0}] is off screen at ${info.x},${info.y}`);
    if (info.covered) throw new Error(`${selector} [${options.index || 0}] is covered: the point ${info.x},${info.y} hits ${info.hit}`);
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: info.x, y: info.y, button: 'left', clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: info.x, y: info.y, button: 'left', clickCount: 1 });
    await this.settle();
  }

  // Tap a point inside an element (offset from its top-left): for the card's own background, not its controls.
  async tapAt(selector, offset, options = {}) {
    await this.tap(selector, { ...options, at: offset });
  }

  async count(selector) {
    return this.value(`document.querySelectorAll(${JSON.stringify(selector)}).length`);
  }

  async text(selector, index = 0) {
    return this.value(`(document.querySelectorAll(${JSON.stringify(selector)})[${index}]||{}).textContent?.trim() ?? null`);
  }

  // A number box: an input in a browser (change event), the number pad in dvkb (open, digits, Done).
  async setBox(selector, value, { index = 0 } = {}) {
    const tag = await this.value(`(document.querySelectorAll(${JSON.stringify(selector)})[${index}]||{}).tagName||null`);
    assert(tag, `no number box ${selector} [${index}]`);
    if (tag === 'INPUT') {
      await this.value(`(()=>{const el=document.querySelectorAll(${JSON.stringify(selector)})[${index}];el.value=${JSON.stringify(String(value))};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await this.settle();
      return;
    }
    await this.tap(selector, { index });
    await this.padEntry(value);
  }

  // Digits (or Clear) then Done on the open number pad.
  async padEntry(value) {
    if (value === '') await this.tap('.kb .k[data-a="clear"]');
    else for (const ch of String(value)) await this.tap(`.kb .k[data-c="${ch}"]`);
    await this.tap('.kb .k[data-a="done"]');
  }

  // +/− on a number pad (dvkb), for a box with no stepper buttons of its own (the cap box).
  async padStep(selector, direction, { index = 0 } = {}) {
    await this.tap(selector, { index });
    await this.tap(`.kb .k[data-a="${direction > 0 ? 'up' : 'dn'}"]`);
    await this.tap('.kb .k[data-a="done"]');
  }

  // Types into the open picker or the full-window search: the search input in a browser, the letters keyboard in dvkb.
  async typeSearch(text) {
    if (!this.dvkb) {
      await this.value(`(()=>{const el=document.querySelector('#sheets input[type=search]');el.value=${JSON.stringify(text)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await this.settle();
      return;
    }
    for (const ch of text.toUpperCase()) {
      if (ch === ' ') await this.tap('.kb .k[data-c=" "]');
      else await this.tap(`.kb .k[data-c="${ch}"]`);
    }
    await this.tap('.kb .k[data-a="done"]');
  }

  // A fixture by name (tools/scenarios/fixtures/calc/), or any file by absolute path.
  async importSave(name) {
    await this.importPath(join(GUIDE?.saves || FIXTURES, name), name);
  }

  // Every import ends in a re-render of #app (a green or red banner, with or without a new grid). A banner from an earlier
  // import can't stand in for the new one, so the wait counts re-renders from the moment the file is set.
  async importPath(path, label = path) {
    await this.value(`(()=>{window.__importRenders=0;window.__importWatch?.disconnect();window.__importWatch=new MutationObserver(()=>window.__importRenders++);window.__importWatch.observe(document.getElementById('app'),{childList:true,subtree:true});})()`);
    const { root } = await this.send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await this.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#calc-file' });
    assert(nodeId, 'missing #calc-file: the guide has no save reader');
    await this.send('DOM.setFileInputFiles', { nodeId, files: [path] });
    await this.waitFor('window.__importRenders>0', `the import of ${label}`);
    await this.settle();
  }

  async banner() {
    return this.value(`(()=>{const b=document.querySelector('.ban');return b?{ok:b.classList.contains('ok'),text:b.textContent.replace(/\\s+/g,' ').trim()}:null;})()`);
  }

  async assertFits(label = 'page') {
    const { scroll, inner } = await this.value('({scroll: document.documentElement.scrollWidth, inner: innerWidth})');
    assert.equal(scroll, this.width, `${label}: documentElement.scrollWidth ${scroll} is not the viewport ${this.width}`);
    assert.equal(inner, this.width, `${label}: innerWidth ${inner} is not ${this.width}`);
  }

  async screenshot(name) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    mkdirSync(OUT, { recursive: true });
    const file = join(OUT, `${name}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }

  async close() {
    await this.browser.send('Target.disposeBrowserContext', { browserContextId: this.contextId }).catch(() => {});
  }
}

// One browser for a whole check file. Errors are collected per page session (uncaught exceptions and console errors).
export async function openBrowser(name) {
  const sessions = new Map();
  const lost = [];
  const browser = await startBrowser({
    profilePrefix: 'calc-checks-',
    flags: ['--hide-scrollbars'],
    onEvent({ method, params, sessionId }) {
      const list = sessions.get(sessionId);
      if (!list) return;
      if (method === 'Runtime.exceptionThrown') list.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text);
      else if (method === 'Runtime.consoleAPICalled' && params.type === 'error') list.push(params.args.map(arg => arg.value ?? arg.description).join(' '));
      else if (method === 'Log.entryAdded' && params.entry.level === 'error') list.push(params.entry.text);
    },
    onDisconnect(reason) {
      lost.push(reason);
      console.error(`${name}: browser lost: ${reason}`);
      process.exit(2);
    },
  });
  return {
    send: browser.send,
    register(sessionId, list) { sessions.set(sessionId, list); },
    close: browser.close,
    lost,
  };
}

// checks: [{ id, title, sizes?, modes?, run(page, info), file?, ready?, fit? }]. Sizes default to 260 x 316; modes to normal
// and dvkb. file / ready: another page than the run's (a frame around the guide); fit: false skips the overflow assertion.
export const SIZE_SMALL = [[260, 316]];
export const SIZE_STAR = [[260, 316], [537, 424], [832, 424]];
export const MODES = ['normal', 'dvkb'];

// A check with skip (a reason) is reported as SKIP and passes: the guide lacks what it tests (a trainer role).
export async function runChecks({ name: scenario, file, checks }) {
  // one report and one set of screenshots per scenario and guide (gate.py runs guides in parallel)
  const guideName = GUIDE?.name || basename(file, '.html');
  const name = scenario.endsWith(guideName) ? scenario : `${scenario}-${guideName}`;
  const browser = await openBrowser(name);
  const results = [];
  let failed = 0;
  try {
    const roles = GUIDE?.trainers || {};
    console.log(`trainers: ${Object.entries(roles).map(([role, trainer]) => `${role} ${trainer ? `${trainer.k} ${trainer.n}` : '-'}`).join(' | ')}`);
    for (const check of checks) {
      if (check.skip) {
        console.log(`SKIP ${check.id}: ${check.skip}`);
        results.push({ id: check.id, title: check.title, skipped: check.skip, ok: true });
        continue;
      }
      for (const [width, height] of check.sizes || SIZE_SMALL) {
        for (const mode of check.modes || MODES) {
          const label = `${check.id} ${width}x${height} ${mode}`;
          const shot = `${name}-${check.id}-${width}x${height}-${mode}`;
          let message = null;
          let page = null;
          try {
            page = await Page.open(browser, { file: check.file || file, width, height, dvkb: mode === 'dvkb', ready: check.ready });
            await check.run(page, { width, height, mode, dvkb: mode === 'dvkb' });
            if (check.fit !== false) await page.assertFits(label);
            if (page.errors.length) throw new Error(`page errors: ${page.errors.join(' | ').slice(0, 600)}`);
          } catch (error) {
            message = error.message;
          } finally {
            if (message && page) await page.screenshot(shot + '-FAIL').catch(() => {});
            await page?.close();
          }
          const ok = !message;
          if (!ok) failed++;
          results.push({ id: check.id, title: check.title, width, height, mode, ok, message });
          console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${message ? '\n     ' + message.split('\n').join('\n     ') : ''}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(results, null, 2));
  printMatrix(results);
  console.log(`${name}: ${results.length - failed} passed, ${failed} failed (${join(OUT, name + '.json')})`);
  if (failed) process.exitCode = 1;
  return results;
}

function printMatrix(results) {
  const columns = [...new Map(results.map(r => [`${r.width}x${r.height} ${r.mode === 'dvkb' ? 'kb' : 'nm'}`, true])).keys()];
  const ids = [...new Set(results.map(r => r.id))];
  const width = Math.max(...ids.map(id => id.length), 6);
  console.log(['check'.padEnd(width), ...columns.map(c => c.padEnd(10))].join('  '));
  for (const id of ids) {
    const cells = columns.map(column => {
      const hit = results.find(r => r.id === id && `${r.width}x${r.height} ${r.mode === 'dvkb' ? 'kb' : 'nm'}` === column);
      return (hit ? (hit.ok ? 'PASS' : 'FAIL') : '-').padEnd(10);
    });
    console.log([id.padEnd(width), ...cells].join('  '));
  }
}

export function guideArg(argv, fallback = 'dist/emerald-imperium.html') {
  return resolve(argv[2] || join(ROOT, fallback));
}



// Flows shared by the calc scenarios. They drive the page the way a user does (taps, number boxes, the picker); setup
// seeds through the same calls the entry points make (CALC.enter), so a check that is about one control never depends on
// another control being right.
export const calcState = page => page.value('(()=>{const s=CALC.state();return {dir:s.dir,mine:s.mine,foe:s.foe,recent:s.recent,custom:s.custom,field:s.field,mvo:s.mvo,crit:s.crit,hits:s.hits};})()');
export const attackerSide = page => page.value(`document.querySelector('.dmatch .cc.att')?.dataset.s ?? null`);
// The attacker's non-empty rows as the page shows them: name, damage per hit, percent line, KO text.
export const attackerRows = page => page.value(`[...document.querySelectorAll('.dres:not(.na) .mr:not(.em)')].map(r=>({name:r.querySelector('.mv')?.textContent.trim(),hp:r.querySelector('.r1 .hp')?.textContent.trim(),pct:r.querySelector('.r2 span')?.textContent.trim(),ko:r.querySelector('.r2 .ko')?.textContent.trim()}))`);
export const attackerCrit = page => page.value(`[...document.querySelectorAll('.dres:not(.na) .rc')].map(b=>b.getAttribute('aria-pressed'))`);
export const pickCell = (page, src, index) => page.tap(`[data-a="mpick"][data-src="${src}"][data-i="${index}"]`);

export const dismissBanner = page => page.count('.ban .bx').then(n => (n ? page.tap('.ban .bx') : null));

// The imported party is the attacker's pool. Default: Cloyster (party slot 5) against the guide's four-Pokémon trainer,
// the Mine side attacking.
export async function setupCalc(page, { save = 'good.json', mine = ['party', 5], trainer = GUIDE?.trainers.four?.k } = {}) {
  await page.route('#/calc');
  if (save) {
    await page.importSave(save);
    await dismissBanner(page);
  }
  if (mine) await pickCell(page, mine[0], mine[1]);
  if (trainer) await page.value(`CALC.enter(${JSON.stringify(trainer)},0)`);
  await page.settle();
}

// Taps a Field toggle. Narrow Fields show one side at a time (Player | Foe switch): the toggle's side is picked first.
export async function tapField(page, key) {
  const side = await page.value(`(()=>{const section=document.querySelector('[data-f="${key}"]')?.closest('section[data-field-side]');return section&&section.closest('.dfside.one')&&!section.classList.contains('on')?section.dataset.fieldSide:'';})()`);
  if (side) await page.tap(`[data-a="fside"][data-v="${side}"]`);
  const group = await page.value(`(()=>{const details=document.querySelector('[data-f="${key}"]')?.closest('details[data-fgroup]');return details&&!details.open?details.dataset.fgroup:'';})()`);
  if (group) await page.tap(`details[data-fgroup="${group}"] > summary`);
  await page.tap(`[data-f="${key}"]`);
}

// Opens the attacker's row in a slot (Change move, power, type, crit live in the row's details). Open rows stay open.
export async function openSlot(page, slot) {
  const open = await page.value(`!!document.querySelector('.dres:not(.na) [data-a="chmv"][data-slot="${slot}"]')?.closest('.mr').classList.contains('open')`);
  if (!open) await page.tap(`.dres:not(.na) .mr:has([data-slot="${slot}"]) > .mm`);
}

// Change move on the attacker's slot: the row opens, the picker takes the search, the first match.
export async function changeMove(page, slot, name) {
  await openSlot(page, slot);
  await page.tap(`.dres:not(.na) [data-a="chmv"][data-slot="${slot}"]`);
  await page.typeSearch(name);
  await page.tap('.mrow[data-i="0"]');
}

// A number box touched but not changed: a browser input is only focused; dvkb opens the pad, closed with Done.
export async function touchBox(page, selector) {
  await page.tap(selector);
  if (page.dvkb) await page.tap('.kb .k[data-a="done"]');
}

// One step of the cap box: ArrowUp / ArrowDown on the input in a browser, the pad's + / − in dvkb.
export async function spinCap(page, direction, key = GUIDE?.trainers.relative?.k) {
  const selector = `[data-cap="${key}"]`;
  if (page.dvkb) return page.padStep(selector, direction);
  const keyName = direction > 0 ? 'ArrowUp' : 'ArrowDown', code = direction > 0 ? 38 : 40;
  await page.tap(selector);
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code: keyName, windowsVirtualKeyCode: code });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code: keyName, windowsVirtualKeyCode: code });
  await page.tap('.dmatch .cc[data-s="mine"] .cl > span'); // focus leaves the input: the change event
}

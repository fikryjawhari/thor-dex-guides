// Shared harness for the calc checks: tools/scenarios/calc-*.mjs (the spec's checks 1-26) and tools/calc_save_check.mjs.
// It lives outside tools/scenarios/ because the gate runs every *.mjs there as a scenario.
//
//   const file = prepareGuide(dist, { tag, edit })   a copy of a built guide in .tmp/calc-checks/ (null: no cfg.calc)
//   await runChecks({ name, file, checks })         each check at its sizes and modes; table, screenshots, exit code
//   const page = await Page.open(browser, opts)      one isolated page (own storage); taps, number boxes, file input
//
// Preparation only: when the profile names no save reader, the `test` reader is injected (template/calc/readers/test.js)
// and `save: 'test'` set in the copy, so the real file input imports JSON fixtures. `edit(data)` patches a copy's data
// (fixtures only, e.g. a long trainer name); the built dist is never changed.
// Taps are real mouse events at the element's centre, after checking that element is what the point hits (a covered
// control fails the check, as it would under a finger). Number boxes are driven as the page shows them: an input in a
// browser, the number pad in dvkb mode.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

export function prepareGuide(file, { tag, edit } = {}) {
  const { html, match, data } = readGuide(file);
  if (!data.cfg.calc) return null;
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
  const out = join(OUT, `${tag || 'guide'}-${file.split(/[\\/]/).pop()}`);
  writeFileSync(out, page);
  return out;
}

// Fixture patches to the EI data copy the checks run on (never the dist): the sheet-only trainer loses its first
// Pokémon's moves and ability (the EI data has no Pokémon with missing sets, so the unknown-set rules need one), and two
// trainers get the spec's long names (the data has none that long). Every scenario applies this to its copy.
export function fixturePatches(data) {
  for (const group of data.TR.g) for (const section of group.sec) for (const trainer of section.tr) {
    if (trainer.k === '0.0.0') {
      trainer.n = 'Rival Brendan (sheet only)';
      trainer.p[0].m = [];
      delete trainer.p[0].a;
    }
    if (trainer.k === '3.0.0') trainer.n = 'Team Aqua Grunt Petalburg Woods';
  }
}

// Trainer keys in the EI data that the checks name (checked against the data by runChecks, so a data rebuild that moves
// one fails loudly instead of testing the wrong trainer).
export const EI_TRAINERS = {
  candice: '0.0.3',       // four Pokémon, relative levels, cap 15: check 1 (fit), entry points
  gardenia: '1.0.0',      // relative levels, cap 34 by default: check 3 (cap box)
  flannery: '4.0.15',     // six Pokémon, fixed levels: check 20 (foe team list / strip)
  sheetOnly: '0.0.0',     // the only trainer whose values are marked "from the sheet"; patched in fixtures (check 16/17)
  longName: '3.0.0',      // patched name in fixtures (check 17)
};

export class Page {
  static async open(browser, opts) {
    const page = new Page(browser, opts);
    await page.init();
    return page;
  }

  constructor(browser, { file, width, height, dvkb = false }) {
    this.browser = browser;
    this.file = file;
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
    await this.goto('#/');
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

  async goto(hash = '') {
    await this.send('Page.navigate', { url: pathToFileURL(this.file).href + hash });
    await this.waitFor(Page.booted, 'the guide to boot');
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
    await this.importPath(join(FIXTURES, name), name);
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

// checks: [{ id, title, sizes?, modes?, run(page, info) }]. Sizes default to 260 x 316; modes to normal and dvkb.
export const SIZE_SMALL = [[260, 316]];
export const SIZE_STAR = [[260, 316], [537, 424], [832, 424]];
export const MODES = ['normal', 'dvkb'];

export async function runChecks({ name, file, checks, expectTrainers = true }) {
  const browser = await openBrowser(name);
  const results = [];
  let failed = 0;
  try {
    if (expectTrainers) {
      const data = readGuide(file).data;
      const keys = new Set(data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr.map(trainer => trainer.k))));
      for (const [label, key] of Object.entries(EI_TRAINERS)) if (!keys.has(key)) throw new Error(`trainer ${label} (${key}) is not in this guide's data`);
    }
    for (const check of checks) {
      for (const [width, height] of check.sizes || SIZE_SMALL) {
        for (const mode of check.modes || MODES) {
          const label = `${check.id} ${width}x${height} ${mode}`;
          const page = await Page.open(browser, { file, width, height, dvkb: mode === 'dvkb' });
          const shot = `${name}-${check.id}-${width}x${height}-${mode}`;
          let message = null;
          try {
            await check.run(page, { width, height, mode, dvkb: mode === 'dvkb' });
            await page.assertFits(label);
            if (page.errors.length) throw new Error(`page errors: ${page.errors.join(' | ').slice(0, 600)}`);
          } catch (error) {
            message = error.message;
          } finally {
            if (message) await page.screenshot(shot + '-FAIL').catch(() => {});
            await page.close();
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

export function skipWithoutCalc(file, name) {
  if (file) return false;
  console.log(`SKIP ${name}: no cfg.calc`);
  return true;
}

export { sleep, pathToFileURL };

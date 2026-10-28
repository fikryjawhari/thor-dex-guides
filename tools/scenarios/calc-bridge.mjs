// Calc import through Dex Viewer's save bridge (thor-offline-viewer docs/SAVE_BRIDGE.md), with a fake window.dexViewerApp
// installed before the guide's scripts run. Import with nothing imported opens the picker only when no save is linked;
// with an import it is ↻ refresh (save() only, never the picker); Change file / Pick on the banner call pickSave().
// The fake's state is window.__fb: linked (the save save() returns, or null), next (what pickSave() gives: a save, null
// for cancel, or an error code), err (save() rejects with it), picks (how often the picker opened).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dismissBanner, FIXTURES, fixturePatches, guide, guideArg, prepareGuide, runChecks } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-bridge', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-bridge: no cfg.calc');
  process.exit(0);
}

const fixture = name => [...readFileSync(join(guide()?.saves || FIXTURES, name))];
const T0 = new Date(2026, 9, 28, 14, 32).getTime();
const save = (name, modified = T0) => ({ name, modified, size: fixture(name).length, bytes: fixture(name) });

const FAKE = `(()=>{const fb=window.__fb={linked:null,next:null,err:null,picks:0,calls:[]};
const out=s=>s&&{name:s.name,modified:s.modified,size:s.size,bytes:new Uint8Array(s.bytes)};
const fail=code=>Promise.reject({code,message:'fake '+code});
window.dexViewerApp=Object.freeze({version:1,
 save:()=>{fb.calls.push('save');return fb.err?fail(fb.err):Promise.resolve(out(fb.linked));},
 pickSave:()=>{fb.calls.push('pick');fb.picks++;const n=fb.next;if(typeof n==='string')return fail(n);if(n)fb.linked=n;return Promise.resolve(out(n));},
 saveInfo:()=>{fb.calls.push('info');return fb.err?fail(fb.err):Promise.resolve(fb.linked&&{name:fb.linked.name,modified:fb.linked.modified,size:fb.linked.size});},
 clearSave:()=>{fb.linked=null;return Promise.resolve();}});})();`;

const install = async page => {
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE });
  await page.reload();
  await page.route('#/calc');
};
const set = (page, state) => page.value(`Object.assign(window.__fb,${JSON.stringify(state)}),true`);
const fb = page => page.value('({picks:__fb.picks,calls:__fb.calls.slice()})');
// Taps and waits for the bridge's promise chain and the re-render.
const tapWait = async (page, selector) => {
  await page.tap(selector);
  await page.settle();
  await page.settle();
};
const banner = page => page.banner();
const pickButton = page => page.value(`document.querySelector('.ban [data-a="savepick"]')?.textContent.trim()??null`);
const imported = page => page.value('(()=>{const i=CALC.state().imp;return i&&{file:i.file,mod:i.mod,party:i.party.map(m=>m.id+":"+m.l).join(",")};})()');
const IMPORT = '.tools [data-a="import"], .dempty [data-a="import"]';

const checks = [
  {
    id: 'B1 first import',
    title: 'nothing linked: Import calls save(), gets null, opens the picker once; the picked save imports with its time and a Change file button',
    run: async page => {
      await install(page);
      assert.equal(await page.value(`document.getElementById('calc-file')?.hidden??true`), true, 'the file input is hidden');
      await set(page, { next: save('good.json') });
      await tapWait(page, IMPORT);
      const calls = await fb(page);
      assert.deepEqual(calls.calls, ['save', 'pick'], `save() then pickSave(): ${calls.calls}`);
      const ban = await banner(page);
      assert(ban.ok && /Imported good\.json · saved 14:32/.test(ban.text), `banner: ${ban.text}`);
      assert.equal(await pickButton(page), 'Change file');
      assert.equal((await imported(page)).mod, T0, 'modified is stored with the import');
    },
  },
  {
    id: 'B2 refresh',
    title: '↻ with the same modified: "No new save", nothing re-imported (edits kept); newer: re-imported; the picker never opens',
    run: async page => {
      await install(page);
      await set(page, { next: save('good.json') });
      await tapWait(page, IMPORT);
      await dismissBanner(page);
      await page.tap('[data-a="mpick"][data-src="party"][data-i="0"]');
      await page.setBox('[data-lv="mine"]', 30);
      const edits = await page.value('Object.keys(CALC.state().edits).length');
      assert(edits > 0, 'an edit to keep');
      await tapWait(page, '.tools [data-a="import"]');
      let ban = await banner(page);
      assert(ban.ok && /No new save/.test(ban.text) && /good\.json · saved 14:32/.test(ban.text), `banner: ${ban.text}`);
      assert.equal(await page.value('Object.keys(CALC.state().edits).length'), edits, 'the edit is kept');
      await set(page, { linked: save('reimport.json', T0 + 60000) });
      await tapWait(page, '.tools [data-a="import"]');
      ban = await banner(page);
      assert(ban.ok && /Imported reimport\.json · saved 14:33/.test(ban.text), `banner: ${ban.text}`);
      assert.equal((await imported(page)).file, 'reimport.json');
      assert.equal((await fb(page)).picks, 1, 'only the first import opened the picker');
    },
  },
  {
    id: 'B3 newer on entry',
    title: 'saveInfo() on entering the calc: a newer save marks ↻ Import with a dot; importing clears it',
    run: async page => {
      await install(page);
      await set(page, { next: save('good.json') });
      await tapWait(page, IMPORT);
      await set(page, { linked: save('good.json', T0 + 120000) });
      await page.route('#/');
      await page.route('#/calc');
      await page.settle();
      assert.equal(await page.text('.tools [data-a="import"]'), '↻ Import •', 'the dot');
      await tapWait(page, '.tools [data-a="import"]');
      assert.equal(await page.text('.tools [data-a="import"]'), '↻ Import', 'cleared');
    },
  },
  {
    id: 'B4 refresh errors',
    title: 'gone: "Save file not found" + Pick, no picker; nothing linked: "No save file linked" + Pick; too-big; busy is ignored; the import is kept',
    run: async page => {
      await install(page);
      await set(page, { next: save('good.json') });
      await tapWait(page, IMPORT);
      const before = await imported(page);
      await set(page, { err: 'gone' });
      await tapWait(page, '.tools [data-a="import"]');
      let ban = await banner(page);
      assert(!ban.ok && /Save file not found/.test(ban.text), `gone: ${ban.text}`);
      assert.equal(await pickButton(page), 'Pick');
      assert.equal((await fb(page)).picks, 1, 'refresh did not open the picker');
      assert.deepEqual(await imported(page), before, 'gone keeps the import');
      await set(page, { err: null, linked: null });
      await tapWait(page, '.tools [data-a="import"]');
      ban = await banner(page);
      assert(!ban.ok && /No save file linked/.test(ban.text), `null: ${ban.text}`);
      assert.equal((await fb(page)).picks, 1, 'null on refresh did not open the picker');
      await set(page, { next: 'too-big' });
      await tapWait(page, '.ban [data-a="savepick"]');
      ban = await banner(page);
      assert(!ban.ok && /Not a save file/.test(ban.text), `too-big: ${ban.text}`);
      await set(page, { next: 'busy' });
      await tapWait(page, '.ban [data-a="savepick"]');
      assert.equal((await banner(page)).text, ban.text, 'busy changes nothing');
      await set(page, { next: 'failed' });
      await tapWait(page, '.ban [data-a="savepick"]');
      ban = await banner(page);
      assert(!ban.ok && /Unreadable/.test(ban.text), `failed: ${ban.text}`);
      assert.deepEqual(await imported(page), before, 'errors keep the import');
    },
  },
  {
    id: 'B5 change file',
    title: 'Change file: cancelled keeps the import and banner; a wrong game gives Wrong game + Pick; a good file replaces the import',
    run: async page => {
      await install(page);
      await set(page, { next: save('good.json') });
      await tapWait(page, IMPORT);
      const before = await imported(page);
      await set(page, { next: null });
      await tapWait(page, '.ban [data-a="savepick"]');
      assert.deepEqual(await imported(page), before, 'cancel keeps the import');
      assert.equal(await pickButton(page), 'Change file', 'the banner stays');
      await set(page, { next: save('wrong.json') });
      await tapWait(page, '.ban [data-a="savepick"]');
      let ban = await banner(page);
      assert(!ban.ok && /Wrong game/.test(ban.text), `wrong: ${ban.text}`);
      assert.equal(await pickButton(page), 'Pick');
      assert.deepEqual(await imported(page), before, 'wrong keeps the import');
      await set(page, { next: save('reimport.json', T0 + 300000) });
      await tapWait(page, '.ban [data-a="savepick"]');
      ban = await banner(page);
      assert(ban.ok && /Imported reimport\.json/.test(ban.text), `good: ${ban.text}`);
    },
  },
  {
    id: 'B6 no bridge',
    title: 'in a browser (no dexViewerApp) the banner has no Pick / Change file button',
    run: async page => {
      await page.route('#/calc');
      await page.importSave('good.json');
      assert.equal(await pickButton(page), null);
      await page.importSave('wrong.json');
      assert.equal(await pickButton(page), null);
    },
  },
];

await runChecks({ name: 'calc-bridge', file, checks });

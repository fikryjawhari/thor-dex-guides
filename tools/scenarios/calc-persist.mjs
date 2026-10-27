// Calc persistence: spec check 26 (every kind of state comes back after a reload; Clear saved state in the Thor frame goes
// back to the defaults). 26 runs at 260 x 316 in normal and dvkb mode; the frame check runs once, in a browser, with the
// frame built by tools/mockup/thor-frame/build.py. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { OUT, ROOT, attackerCrit, attackerRows, attackerSide, calcState, fixturePatches, guide, guideArg, openSlot, prepareGuide, runChecks, setupCalc, touchBox } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-persist', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-persist: no cfg.calc');
  process.exit(0);
}

const mineName = page => page.value(`document.querySelector('.dmatch .cc[data-s="mine"] .cn b').textContent.trim()`);
const foeName = page => page.value(`document.querySelector('.dmatch .cc[data-s="foe"] .cn b').textContent.trim()`);
const weatherValue = page => page.value(`document.querySelector('select[data-f="weather"]')?.value ?? null`);
const fieldSummary = page => page.value(`document.querySelector('.dfield summary').textContent.replace(/\\s+/g,' ').trim()`);
const boxValue = (page, selector) => page.value(`document.querySelector(${JSON.stringify(selector)})?.value ?? null`);

const checks = [
  {
    id: '26 persistence',
    title: 'foe, dir, field, crit, a hit count, a power override, an unsaved edit and a saved change all come back after a reload',
    run: async page => {
      await setupCalc(page);
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      await page.tap('.dres:not(.na) .rc', { index: 3 });
      await page.tap('.dres:not(.na) .rh');
      await openSlot(page, 2);
      await touchBox(page, '[data-mo="bp"][data-ck$=":2"]');
      await page.setBox('[data-mo="bp"][data-ck$=":2"]', 100);
      await page.tap('.dfield > summary');
      await page.value(`(()=>{const s=document.querySelector('select[data-f="weather"]');s.value='Rain';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await page.tap('.dmatch .cc[data-s="foe"] .cl > span');
      await page.setBox('[data-lv="mine"]', 30);
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      await page.tap('[data-a="esave"][data-s="mine"]');
      await page.setBox('[data-lv="foe"]', 9);
      const beforeFoe = await foeName(page), beforeWeather = await weatherValue(page);
      const beforeState = await calcState(page);
      assert.equal(beforeState.dir, 'in');
      assert.equal(await mineName(page), 'Cloyster •', 'saved (•) before the reload');
      assert(beforeFoe.endsWith('*'), `the foe edit is unsaved before the reload: ${beforeFoe}`);
      await page.reload();
      const after = await calcState(page);
      assert.equal(after.dir, 'in', 'dir');
      assert.deepEqual(after.foe, beforeState.foe, 'foe');
      assert.equal(await weatherValue(page), 'Rain', 'the field (weather) is restored');
      assert.match(await fieldSummary(page), /Rain/, 'and shown in the Field summary');
      assert.equal(await mineName(page), 'Cloyster •', 'the saved change (•) is restored');
      assert.equal(await boxValue(page, '[data-lv="mine"]'), '30', 'and its level');
      assert.equal(await foeName(page), beforeFoe, 'the unsaved foe edit (*) is kept');
      assert.equal(await boxValue(page, '[data-lv="foe"]'), '9', 'and its level');
      await page.tap('.dmatch .cc[data-s="mine"] .cl > span');
      assert.equal(await attackerSide(page), 'mine');
      assert.deepEqual(await attackerCrit(page), ['false', 'false', 'false', 'true'], 'crit on Ice Beam (slot 3) is restored');
      // the hit count lives on the row's cycle button (calc-retest R2), not in the % line
      assert((await attackerRows(page))[0].name === 'Icicle Spear' && await page.value(`document.querySelector('.dres:not(.na) .mr:not(.em) [data-a=hits]')?.textContent.trim()`) === '×4', 'the hit count (×4) is restored');
      assert.equal(await page.value(`document.querySelector('[data-mo="bp"][data-ck$=":2"]').value`), '100', 'the power override on Surf is restored');
      assert.equal((await calcState(page)).dir, 'out');
      assert.equal(beforeWeather, 'Rain');
    },
  },
];

// The frame case: the page is the frame around the guide (its own file and ready state), and the guide inside is driven
// through its contentWindow (same origin, srcdoc). Its page is not the 260-wide calc page, so no overflow assertion.
mkdirSync(OUT, { recursive: true });
const frameFile = join(OUT, 'frame-' + basename(file));
execFileSync('python', ['-I', join(ROOT, 'tools', 'mockup', 'thor-frame', 'build.py'), file, frameFile], { stdio: 'pipe' });
const frameReady = `(()=>{const w=document.getElementById('fr')?.contentWindow;try{return !!w&&w.eval('typeof P!=="undefined"&&document.querySelector("#app").children.length>0');}catch(e){return false;}})()`;
const inner = page => expression => page.value(`document.getElementById('fr').contentWindow.eval(${JSON.stringify(expression)})`);
const frameCheck = {
  id: '26b frame clear',
  title: 'Clear saved state in the Thor frame: the guide comes back with the defaults (no foe, Mine attacking)',
  sizes: [[800, 600]],
  modes: ['normal'],
  file: frameFile,
  ready: frameReady,
  fit: false,
  run: async page => {
    const evalInner = inner(page);
    await evalInner(`location.hash='#/calc'`);
    const key = guide().trainers.four.k;
    await evalInner(`CALC.enter(${JSON.stringify(key)},1)`);
    assert.equal(await evalInner(`CALC.state().foe.k`), key, 'the frame guide has a foe set');
    await page.tap('#clr');
    await page.waitFor(`(()=>{try{return document.getElementById('fr').contentWindow.CALC.state().foe.k===''}catch(e){return false}})()`, 'the frame to reload with the defaults');
    const reset = await evalInner(`(()=>{const s=CALC.state();return {dir:s.dir,foe:s.foe,mine:s.mine,edits:Object.keys(s.edits).length};})()`);
    assert.equal(reset.dir, 'out', 'Mine attacks again');
    assert.deepEqual(reset.foe, { k: '', i: 0 }, 'no foe');
    assert.deepEqual(reset.mine, { src: 'party', b: 0, i: 0 }, 'the first party Pokémon');
    assert.equal(reset.edits, 0, 'no edits');
  },
};

const persist = checks[0];
await runChecks({ name: 'calc-persist', file, checks: [persist, frameCheck] });

// Calc persistence: spec check 26 (every kind of state comes back after a reload; Clear saved state in the Thor frame goes
// back to the defaults). 26 runs at 260 x 316 in normal and dvkb mode; the frame check runs once, in a browser, with the
// frame built by tools/mockup/thor-frame/build.py. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { OUT, ROOT, SIZE_SMALL, attackerCrit, attackerRows, attackerSide, calcState, fixturePatches, guide, guideArg, openSlot, prepareGuide, runChecks, setupCalc, touchBox } from '../calc_check_lib.mjs';
// Edit opens and closes per side (the narrow card's Lv box is there only while it is open); idempotent.
const editorOpen = async (page, side, open) => {
  if (!!(await page.count(`.cc[data-s="${side}"] .ed`)) !== open) await page.tap(`.dmatch .cc[data-s="${side}"] [data-a="eopen"]`);
};

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
      await page.tap('.dmatch .cc[data-s="foe"] .cl .mx');
      await editorOpen(page, 'mine', true);
      await page.setBox('[data-lv="mine"]', 30);
      await page.tap('[data-a="esave"][data-s="mine"]');
      await editorOpen(page, 'mine', false);
      await editorOpen(page, 'foe', true);
      await page.setBox('[data-lv="foe"]', 9);
      await editorOpen(page, 'foe', false);
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
      await page.tap('.dmatch .cc[data-s="mine"] .cl .mx');
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

// Stored sets and the Pokémon list's filters name species, abilities and moves (template/README.md → Damage
// calculator), so a guide update that inserts one keeps them. The update is simulated from the storage side: names
// written by hand resolve to this build's indices, gone ones fall back, older index storage loads as before. A
// repeated name (Hardlove's ability slots, Photonic Sun's Z-moves, EI's As One) is stored with its occurrence.
const namesCheck = {
  id: '26c names',
  title: 'stored sets name species, ability and moves; on load names map back, gone ones fall back, index storage still loads',
  sizes: SIZE_SMALL,
  modes: ['normal'],
  run: async page => {
    await setupCalc(page);
    const pick = await page.value(`(()=>{const dup=list=>{const seen=new Set();return list.findIndex(x=>{const n=Array.isArray(x)?x[0]:x;if(seen.has(n))return true;seen.add(n);return false;});};
      const p=P.find(p=>p.a.length>1&&p.g===0)||P[0],mv=[dup(M)>=0?dup(M):3,M.length-1,1,2],ab=dup(AB)>=0?dup(AB):AB.length-1;
      CALC.use(p);CALC.set('mine','m',mv);CALC.set('mine','a',ab);
      return {id:p.id,n:p.n,a0:p.a[0],mv,ab,names:mv.map(i=>nameOf(M,i)),abName:nameOf(AB,ab),dup:dup(M)>=0||dup(AB)>=0};})()`);
    if (pick.dup) assert([...pick.names, pick.abName].some(name => /#2$/.test(name)), `a repeated name carries its occurrence: ${JSON.stringify(pick)}`);
    const raw = await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg)),c=s.custom.at(-1),m=s.imp.party[0];return {c,imp:{sn:m.sn,a:typeof m.a,m:m.m.map(x=>x===null||typeof x==='string')}};})()`);
    assert.deepEqual([raw.c.sn, raw.c.id, raw.c.a, raw.c.m], [pick.n, pick.id, pick.abName, pick.names], 'a custom set is stored by name');
    assert.equal(typeof raw.imp.sn, 'string', 'an imported Pokémon names its species');
    assert.deepEqual([raw.imp.a, raw.imp.m.every(Boolean)], ['string', true], 'and its ability and moves');
    await page.reload();
    const back = await page.value(`(()=>{const c=CALC.state().custom.at(-1);return {id:c.id,a:c.a,m:c.m,sn:'sn' in c};})()`);
    assert.deepEqual(back, { id: pick.id, a: pick.ab, m: pick.mv, sn: false }, 'names map back to indices in memory');
    // The "update": a move and an ability that no longer exist, a species that no longer exists (before the selected
    // set, which moves up one), and a set stored with indices (before names).
    const count = await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg)),c=s.custom.at(-1);
      s.custom.push({...c,pid:'gone',sn:'No Such Pokémon',id:'no-such-id'},{...c,pid:'old',sn:undefined,a:${pick.ab},m:[1,2]});
      c.m=[${JSON.stringify(pick.names[1])},'No Such Move'];c.a='No Such Ability';s.mine={src:'custom',b:0,i:s.custom.length-1};
      localStorage.setItem(LS.dmg,JSON.stringify(s));
      localStorage.setItem(LS.dex,JSON.stringify({f:[{k:'mv',v:nameOf(M,5)},{k:'ab',v:'No Such Ability'},{k:'mv',v:7},{k:'type',v:'Fire'}],sort:'dex',av:'all'}));
      return s.custom.length;})()`);
    await page.reload();
    const loaded = await page.value(`(()=>{const s=CALC.state(),c=s.custom;save();return {n:c.length,named:{a:c.at(-2).a,m:c.at(-2).m},old:{pid:c.at(-1).pid,a:c.at(-1).a,m:c.at(-1).m},mine:s.mine.i,cur:CALC.mon('mine').pid,f:st.f,stored:JSON.parse(localStorage.getItem(LS.dex)).f};})()`);
    assert.equal(loaded.n, count - 1, 'the set whose species is gone drops');
    assert.deepEqual(loaded.named, { a: pick.a0, m: [pick.mv[1], null] }, "a gone move empties its slot, a gone ability falls back to the species' first");
    assert.deepEqual(loaded.old, { pid: 'old', a: pick.ab, m: [1, 2] }, 'a set stored with indices loads as before');
    assert.deepEqual([loaded.mine, loaded.cur], [count - 2, 'old'], 'the selection follows its set');
    assert.deepEqual(loaded.f, [{ k: 'mv', v: 5 }, { k: 'mv', v: 7 }, { k: 'type', v: 'Fire' }], 'list filters: names map back, a gone one drops, an index loads');
    assert.deepEqual(loaded.stored, [{ k: 'mv', v: await page.value('nameOf(M,5)') }, { k: 'mv', v: await page.value('nameOf(M,7)') }, { k: 'type', v: 'Fire' }], 'list filters are stored by name');
  },
};

const persist = checks[0];
await runChecks({ name: 'calc-persist', file, checks: [persist, namesCheck, frameCheck] });

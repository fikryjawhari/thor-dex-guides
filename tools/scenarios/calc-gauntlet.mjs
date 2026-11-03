// Gauntlets (template/README.md → Damage calculator → Fight state; trainers with the same `gc` list): one fight across
// the chain. Stepping between members carries the player's HP / status / used items and keeps each member's foe state
// and foe slot; per-battle state (stages, manual Field, S / D, Mega, broken) is fresh on each member; a forward step
// takes the player's-side snapshot; ↺ resets the member to it, then (at it, or on the first member) the gauntlet;
// leaving the chain is a new fight, entering one from outside starts it there; reload keeps it, a stale ST.gc loads as
// none; dots under the trainer name and accent ‹ › only within the chain. The chain: the guide's longest one with a
// Double member (Hardlove: the Kimono Girls), else its longest; members must be consecutive in the calc's order (the
// data check). A guide without chains (or without cfg.calc): skip. Layout at the viewer sizes: calc-layout.mjs.
import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-gauntlet', edit: fixturePatches});
if (!file) {
  console.log('SKIP calc-gauntlet: no cfg.calc');
  process.exit(0);
}
const data = readGuide(file).data;
const trainers = data.TR.g.flatMap(g => g.sec.flatMap(s => s.tr));
const chains = [...new Map(trainers.filter(t => t.gc && !t.st).map(t => [t.gc.join('|'), t.gc])).values()];
const byKey = new Map(trainers.map(t => [t.k, t]));
const doubles = gc => gc.some(k => (byKey.get(k)?.tags || []).includes('Double'));
const C = chains.sort((a, b) => (doubles(b) - doubles(a)) || (b.length - a.length))[0];
const skip = C ? '' : 'no gauntlet chain';
const [C0, C1] = C || [];
const LASTK = C?.at(-1);
const FOESLOT = C ? Math.min(1, byKey.get(C0).p.length - 1) : 0;
const OUTSIDE = trainers.find(t => !t.gc && !t.st && t.p.length)?.k;
const adjacent = trainers.flatMap((trainer, index) => {
  const next = trainers[index + 1];
  return trainer.gc && next?.gc && !trainer.gc.includes(next.k) ? [[trainer.k, next.k]] : [];
});
const J = JSON.stringify;

const sizes = [[260, 316]];
const modes = ['normal'];
// Three custom Pokémon (pids cg0..cg2), the first selected, then the chain's first trainer (a new fight).
const setup = async page => {
  await page.route('#/calc');
  await page.value(`(()=>{const names=['Blissey','Snorlax','Gyarados','Lapras','Pikachu','Geodude'];let ps=names.map(n=>P.find(p=>p.n===n)).filter(Boolean);
    if(ps.length<3)ps=P.filter(p=>p.a&&p.a.length).slice(10,13);
    ps.slice(0,3).forEach((p,n)=>{CALC.use(p);CALC.state().custom.at(-1).pid='cg'+n;});CALC.state().mine={src:'custom',b:0,i:0};CALC.render();
    CALC.enter(${J(C0)},0);})()`);
  await page.settle();
};
const st = page => page.value(`(()=>{const s=CALC.state();return {foe:s.foe,gc:s.gc??null,gcSel:s.gcSel??null,fman:s.fman,field:s.field,mine:s.custom[0],foeKeys:Object.keys(s.edits).filter(k=>k.startsWith('foe:')).sort(),edits:s.edits};})()`);
const hit = async (page, side, hp) => {
  await page.value(`(()=>{CALC.set(${J(side)},'hp',${hp});CALC.render();})()`);
  await page.settle();
};
const step = async (page, dir) => {
  await page.tap(`.fbar [data-a="${dir === 1 ? 'tnext' : 'tprev'}"]`);
  await page.settle();
};
const resetBtn = page => page.value(`(()=>{const b=document.querySelector('[data-a="fightreset"]');return b&&{label:b.getAttribute('aria-label'),title:b.title,text:b.textContent.trim(),acc:b.classList.contains('gcnav'),svg:!!b.querySelector('svg')};})()`);
const pressReset = async page => {
  await page.value(`document.querySelector('#calc-log')?.remove()`);
  if (!(await page.value(`document.querySelector('.dfield').open`))) await page.tap('.dfield > summary');
  await page.tap('[data-a="fightreset"]');
  await page.settle();
};
const markers = page => page.value(`(()=>{const d=[...document.querySelectorAll('.fbar .gcdots i')],nav=a=>{const b=document.querySelector('.fbar [data-a="'+a+'"]');return b&&{acc:b.classList.contains('gcnav'),label:b.getAttribute('aria-label'),title:b.title};};
  return {dots:d.length,cur:d.findIndex(i=>i.classList.contains('cur')),done:d.filter(i=>i.classList.contains('done')).length,prev:nav('tprev'),next:nav('tnext')};})()`);
// The label names the first trainer as the trainer bar does (with its tag prefix, e.g. [B3B]).
const isGauntlet = b => !!b && b.acc && b.svg && b.title === b.label && b.label.startsWith('Reset gauntlet (back to ') && b.label.includes(byKey.get(C0)?.n ?? '\u0000') && b.label.endsWith(')');

const checks = [{
  id: 'carry',
  title: 'a step carries the player\'s side and keeps each member\'s foe state; forward takes the snapshot, back none',
  sizes, modes, skip,
  run: async page => {
    await setup(page);
    let s = await st(page);
    assert.equal(s.foe.k, C0);
    assert.deepEqual(s.gc, {first: C0, snap: {[C0]: {}}}, 'entering the chain: a snapshot of the first member');
    await hit(page, 'mine', 5);
    await page.value(`(()=>{CALC.set('mine','used',true);CALC.state().foe.i=${FOESLOT};CALC.render();})()`);
    await page.settle();
    await hit(page, 'foe', 1);
    await step(page, 1);
    s = await st(page);
    assert.equal(s.foe.k, C1, '› stays in the chain');
    assert.equal(s.mine.hp, 5, 'mine\'s HP carried');
    assert.equal(s.mine.used, true, 'used item carried');
    assert.ok(!s.foeKeys.some(k => k.startsWith(`foe:${C1}:`)), `${C1}'s team full: ${s.foeKeys}`);
    assert.equal(s.edits[`foe:${C0}:${FOESLOT}`]?.hp, 1, 'the first member\'s foe state kept');
    assert.equal(s.foe.i, 0, 'the new member opens on its first slot');
    assert.deepEqual(s.gc.snap[C1], {'mine:cg0': {hp: 5, used: true}}, 'forward: snapshot taken');
    assert.deepEqual(s.gcSel, {[C0]: FOESLOT, [C1]: 0}, 'foe slot per member');
    await hit(page, 'mine', 3);
    await step(page, -1);
    s = await st(page);
    assert.equal(s.foe.k, C0);
    assert.equal(s.foe.i, FOESLOT, '‹ back: the member\'s foe slot as left');
    assert.equal(s.edits[`foe:${C0}:${FOESLOT}`]?.hp, 1, '‹ back: its foes as left');
    assert.equal(s.mine.hp, 3, 'carried back');
    assert.deepEqual(s.gc.snap[C1], {'mine:cg0': {hp: 5, used: true}}, 'back: no new snapshot');
    assert.deepEqual(s.gc.snap[C0], {}, 'back: the member\'s own snapshot unchanged');
    await step(page, 1);
    s = await st(page);
    assert.deepEqual(s.gc.snap[C1], {'mine:cg0': {hp: 3, used: true}}, '› again: snapshot retaken');
  },
}, {
  id: 'per-battle',
  title: 'stages, manual weather, S / D, Mega and broken at one member are gone at the next; each opens in its own Auto format',
  sizes, modes, skip,
  run: async page => {
    await setup(page);
    await page.value(`(()=>{const s=CALC.state(),m=s.custom[0];CALC.set('mine','stg',[1,0,0,0,0]);CALC.set('mine','broken',true);m.mega={id:m.id,a:m.a,i:''};
      s.field.weather='Rain';s.fman.push('weather');s.field.gameType=${J(doubles([C0]) ? 'Singles' : 'Doubles')};s.fman.push('gameType');CALC.render();})()`);
    await page.settle();
    assert.deepEqual(await page.value(`CALC.mon('mine').stg`), [1, 0, 0, 0, 0], 'the stage is set');
    await step(page, 1);
    const s = await st(page);
    assert.equal(s.foe.k, C1);
    assert.ok(!(await page.value(`(CALC.mon('mine').stg||[]).some(Boolean)`)), 'stages fresh');
    assert.deepEqual(s.fman, [], 'no manual Field');
    assert.equal(s.mine.broken, undefined, 'broken cleared');
    assert.equal(s.mine.mega, undefined, 'Mega cleared');
    assert.equal(s.field.gameType || 'Singles', doubles([C1]) ? 'Doubles' : 'Singles', 'its own Auto format');
    while ((await st(page)).foe.k !== LASTK) await step(page, 1);
    assert.equal((await st(page)).field.gameType || 'Singles', doubles([LASTK]) ? 'Doubles' : 'Singles', 'the last member\'s own Auto format');
  },
}, {
  id: 'reset',
  title: '↺ in a chain: the member back to its snapshot, then (⇤) the gauntlet from its first trainer; on the first member one press',
  sizes, modes, skip,
  run: async page => {
    await setup(page);
    await hit(page, 'mine', 5);
    await hit(page, 'foe', 1);
    let b = await resetBtn(page);
    assert.ok(isGauntlet(b), `first member: always the gauntlet reset ${J(b)}`);
    await step(page, 1);
    b = await resetBtn(page);
    assert.ok(isGauntlet(b), `at its snapshot: the gauntlet reset ${J(b)}`);
    await hit(page, 'mine', 2);
    await hit(page, 'foe', 1);
    b = await resetBtn(page);
    assert.deepEqual(b, {label: 'Reset this fight', title: 'Reset this fight', text: '↺', acc: false, svg: false}, 'off its snapshot: the member reset');
    await pressReset(page);
    let s = await st(page);
    assert.equal(s.foe.k, C1, 'member reset stays');
    assert.equal(s.mine.hp, 5, 'mine back to the snapshot');
    assert.ok(!s.foeKeys.some(k => k.startsWith(`foe:${C1}:`)), 'its foe team fresh');
    assert.equal(s.edits[`foe:${C0}:0`]?.hp, 1, 'other members untouched');
    b = await resetBtn(page);
    assert.ok(isGauntlet(b), `then ⇤ ${J(b)}`);
    await pressReset(page);
    s = await st(page);
    assert.equal(s.foe.k, C0, 'gauntlet reset: the first trainer');
    assert.deepEqual(s.foeKeys, [], 'every member fresh');
    assert.equal(s.mine.hp, undefined, 'mine full');
    assert.deepEqual(s.gc, {first: C0, snap: {[C0]: {}}}, 'snapshots fresh');
    await hit(page, 'mine', 4);
    await hit(page, 'foe', 1);
    await pressReset(page);
    s = await st(page);
    assert.equal(s.foe.k, C0);
    assert.equal(s.mine.hp, undefined, 'first member: one press is the full reset');
    assert.deepEqual(s.foeKeys, []);
  },
}, {
  id: 'leave-enter',
  title: 'stepping out of the chain is a new fight; entering a member from outside starts the chain there (⇤ to the first)',
  sizes, modes, skip,
  run: async page => {
    await setup(page);
    while ((await st(page)).foe.k !== LASTK) await step(page, 1);
    await hit(page, 'mine', 5);
    await hit(page, 'foe', 1);
    let m = await markers(page);
    assert.equal(m.next.acc, false, `the step out is plain ${J(m.next)}`);
    if (await page.value(`!document.querySelector('.fbar [data-a="tnext"]').disabled`)) {
      await step(page, 1);
      const s = await st(page);
      assert.ok(!C.includes(s.foe.k), 'left the chain');
      const chain = byKey.get(s.foe.k).gc;
      assert.deepEqual(s.gc, chain ? {first: chain[0], snap: {[s.foe.k]: {}}} : null, 'fresh state for the destination');
      assert.deepEqual(s.foeKeys, [], 'all fresh');
      assert.equal(s.mine.hp, undefined, 'mine full');
      if (!chain) assert.equal((await resetBtn(page)).label, 'Reset fight');
    }
    await page.value(`CALC.enter(${J(C0)},0)`);
    await page.settle();
    assert.ok(OUTSIDE, 'a trainer in no chain exists');
    await hit(page, 'mine', 5);
    await hit(page, 'foe', 1);
    await page.value(`CALC.enter(${J(OUTSIDE)},0)`);
    await page.settle();
    const outside = await st(page);
    assert.equal(outside.foe.k, OUTSIDE, 'a trainer in no chain');
    assert.equal(outside.gc, null, 'no chain state');
    assert.equal(outside.gcSel, null, 'no chain slots');
    assert.deepEqual(outside.foeKeys, [], 'all fresh');
    assert.equal(outside.mine.hp, undefined, 'mine full');
    assert.equal((await resetBtn(page)).label, 'Reset fight');
    await hit(page, 'mine', 5);
    await page.value(`CALC.enter(${J(C1)},0)`);
    await page.settle();
    const s = await st(page);
    assert.equal(s.mine.hp, undefined, 'entering: a new fight');
    assert.deepEqual(s.gc, {first: C0, snap: {[C1]: {}}}, 'entering: a snapshot of that member');
    const b = await resetBtn(page);
    assert.ok(isGauntlet(b), `at its snapshot: ⇤ ${J(b)}`);
    await pressReset(page);
    assert.equal((await st(page)).foe.k, C0, '⇤ goes to the first trainer');
  },
}, {
  id: 'reload',
  title: 'a reload mid-chain keeps the carried side, every member\'s foe state, slots and snapshots; a stale ST.gc loads as none',
  sizes, modes, skip,
  run: async page => {
    await setup(page);
    await hit(page, 'mine', 5);
    await page.value(`(()=>{CALC.state().foe.i=${FOESLOT};CALC.render();})()`);
    await page.settle();
    await hit(page, 'foe', 1);
    await step(page, 1);
    await hit(page, 'mine', 3);
    const was = await st(page);
    await page.reload();
    await page.route('#/calc');
    const now = await st(page);
    for (const f of ['foe', 'gc', 'gcSel', 'foeKeys']) assert.deepEqual(now[f], was[f], `${f} kept`);
    assert.equal(now.mine.hp, 3);
    assert.equal(now.edits[`foe:${C0}:${FOESLOT}`]?.hp, 1, 'the other member\'s foe state kept');
    let b = await resetBtn(page);
    assert.equal(b.label, 'Reset this fight', 'off its snapshot after reload');
    await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.gc.first='no-such-trainer';localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
    await page.reload();
    await page.route('#/calc');
    const stale = await st(page);
    assert.equal(stale.gc, null, 'a stale ST.gc loads as none');
    assert.equal(stale.mine.hp, 3, 'the rest loads');
    b = await resetBtn(page);
    assert.ok(isGauntlet(b), `no snapshot: the gauntlet reset ${J(b)}`);
  },
}, {
  id: 'markers',
  title: 'one dot per member (done / current / later), accent ‹ › only within the chain, labels to match',
  sizes: [[260, 316], [480, 316]],
  modes: ['normal', 'dvkb'],
  skip,
  run: async page => {
    await setup(page);
    for (let n = 0; n < C.length; n++) {
      const m = await markers(page);
      assert.deepEqual([m.dots, m.cur, m.done], [C.length, n, n], `dots at member ${n}`);
      const inPrev = n > 0, inNext = n < C.length - 1;
      assert.equal(m.prev.acc, inPrev, `‹ accent at ${n}`);
      assert.equal(m.next.acc, inNext, `› accent at ${n}`);
      assert.equal(m.prev.label, inPrev ? 'Previous in gauntlet' : 'Previous trainer');
      assert.equal(m.next.label, inNext ? 'Next in gauntlet' : 'Next trainer');
      assert.equal(m.next.title, m.next.label);
      // the trainer bar's name and arrows stay 22 px at the narrow size (the dots add no height); the Cap box is its own
      const h = await page.value(`[...document.querySelectorAll('.fbar .nav,.fbar .dsrc')].map(e=>Math.round(e.getBoundingClientRect().height))`);
      if (page.width < 480) assert.deepEqual(h, [22, 22, 22], 'trainer bar 22 px');
      if (inNext) await step(page, 1);
    }
    assert.ok(OUTSIDE, 'a trainer in no chain exists');
    await page.value(`CALC.enter(${J(OUTSIDE)},0)`);
    await page.settle();
    const outside = await markers(page);
    assert.equal(outside.dots, 0, 'no dots outside a chain');
    assert.equal(outside.prev.acc, false, 'no previous gauntlet arrow outside a chain');
    assert.equal(outside.next.acc, false, 'no next gauntlet arrow outside a chain');
  },
}, {
  id: 'adjacent-chains',
  title: 'stepping into an adjacent chain starts a new fight with its own snapshot, slots and dots',
  sizes: [[260, 316], [480, 316]],
  modes: ['normal', 'dvkb'],
  skip: skip || (!adjacent.length ? 'no adjacent chains' : ''),
  run: async page => {
    await setup(page);
    for (const [before, after] of adjacent) {
      for (const dir of [1, -1]) {
        const source = dir === 1 ? before : after, target = dir === 1 ? after : before;
        const chain = byKey.get(target).gc, at = chain.indexOf(target);
        await page.value(`CALC.enter(${J(source)},0)`);
        await page.settle();
        await hit(page, 'mine', 5);
        await page.value(`CALC.set('mine','used',true)`);
        await hit(page, 'foe', 1);
        assert.equal((await markers(page))[dir === 1 ? 'next' : 'prev'].acc, false, 'cross-chain arrow plain');
        await step(page, dir);
        const state = await st(page), dots = await markers(page);
        assert.equal(state.foe.k, target, 'entered the adjacent chain');
        assert.equal(state.mine.hp, undefined, 'new fight: player HP fresh');
        assert.equal(state.mine.used, undefined, 'new fight: player item fresh');
        assert.deepEqual(state.foeKeys, [], 'new fight: previous foes cleared');
        assert.deepEqual(state.gc, {first: chain[0], snap: {[target]: {}}}, 'only the new chain and entered member snapshot');
        assert.deepEqual(state.gcSel, {[target]: 0}, 'only the new member slot');
        assert.deepEqual([dots.dots, dots.cur, dots.done], [chain.length, at, at], 'dots belong to the new chain');
      }
    }
  },
}];

await runChecks({name: 'calc-gauntlet', file, checks});

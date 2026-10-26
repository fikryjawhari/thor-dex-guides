// Calc move rules in the page: Return / Frustration show power 102 by default (a typed power wins); Ash-Greninja's
// Water Shuriken is a fixed ×3 (power 20); Loaded Dice makes Population Bomb a 1 / 4-10 choice; allied Emperor's Presence
// boosts only its own side, in Doubles. Parts whose species or
// move the guide lacks are skipped. Every viewer size, normal and dvkb. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-moves', edit: fixturePatches});
if (!file) {
  console.log('SKIP calc-moves: no cfg.calc');
  process.exit(0);
}
const data = readGuide(file).data;
const sizes = [[260, 316], [480, 392], [832, 424]];
const has = name => data.M.includes(name);
const ash = data.P.find(entry => /Greninja/.test(entry.n) && /\bAsh\b/.test(entry.n));
const items = JSON.stringify(data.IT || '');

// A custom attacker of `species` with `moves`, `item`, against the first trainer; the player attacks.
const mine = (species, moves, item = '') => `(()=>{
  CALC.use(P.find(entry=>entry.n===${JSON.stringify(species)}));
  const state=CALC.state(),mon=state.custom.at(-1);
  mon.l=50;mon.i=${JSON.stringify(item)};mon.m=${JSON.stringify(moves)}.map(name=>M.indexOf(name));
  CALC.enter(TRS.find(trainer=>trainer.p.every(p=>p.l>0)).k,0);state.dir='out';CALC.render();
})()`;
const row = name => `[...document.querySelectorAll('.dres:not(.na) .mr')].find(r=>r.querySelector('.mv')?.textContent.trim()===${JSON.stringify(name)})`;
const rowInfo = name => `(()=>{const r=${row(name)};if(!r)return null;return {hp:r.querySelector('.r1 .hp')?.textContent.trim()||'',btn:r.querySelector('.rh')?.textContent||'',act:r.querySelector('.rh')?.dataset.a||''};})()`;

const checks = [{
  id: 'return-default',
  title: 'Return / Frustration: rolls without a typed power, Power box 102, a typed power wins',
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(mine('Snorlax', ['Return', 'Frustration']));
    for (const name of ['Return', 'Frustration']) {
      const info = await page.value(rowInfo(name));
      assert.ok(info && /\d/.test(info.hp), `${name} has damage: ${JSON.stringify(info)}`);
    }
    await page.tap(`.dres:not(.na) .mr:has([data-slot="0"]) > .mm`);
    assert.equal(await page.value(`Number(${row('Return')}.querySelector('[data-mo="bp"]').value)`), 102, 'Power box shows 102');
    const before = (await page.value(rowInfo('Return'))).hp;
    await page.value(`(()=>{const input=${row('Return')}.querySelector('[data-mo="bp"]');input.value='51';input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    assert.notEqual((await page.value(rowInfo('Return'))).hp, before, 'typed 51 changes the rolls');
  },
}, ...(ash && has('Water Shuriken') ? [{
  id: 'ash-shuriken',
  title: "Ash-Greninja's Water Shuriken: fixed ×3 inspection, no count choice",
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(mine(ash.n, ['Water Shuriken']));
    const info = await page.value(rowInfo('Water Shuriken'));
    assert.equal(info.btn, '×3');
    assert.equal(info.act, 'hitv', 'inspection button, not a count cycle');
  },
}] : []), ...(has('Population Bomb') && items.includes('Loaded Dice') ? [{
  id: 'popbomb-dice',
  title: 'Population Bomb: fixed ×10, with Loaded Dice a 10 / 1 / 4-9 count cycle',
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(mine('Snorlax', ['Population Bomb']));
    let info = await page.value(rowInfo('Population Bomb'));
    assert.equal(info.btn, '×10');
    assert.equal(info.act, 'hitv', 'no dice: inspection');
    await page.value(mine('Snorlax', ['Population Bomb'], 'Loaded Dice'));
    info = await page.value(rowInfo('Population Bomb'));
    assert.equal(info.btn, '×10', 'dice: default 10');
    assert.equal(info.act, 'hits', 'dice: count cycle');
    const seen = [];
    for (let step = 0; step < 8; step++) {
      await page.tap(`.dres:not(.na) .mr .rh[data-a="hits"]`);
      seen.push((await page.value(rowInfo('Population Bomb'))).btn);
    }
    assert.deepEqual(seen, ['×1', '×4', '×5', '×6', '×7', '×8', '×9', '×10']);
  },
}] : []), ...(data.AB.some(entry => entry[0] === "Emperor's Presence") ? [{
  id: 'emperor-ally',
  title: "allied Emperor's Presence: the Player toggle raises the Player's Water move in Doubles only; the Foe toggle does not",
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(mine('Snorlax', ['Surf', 'Tackle']));
    const max = async () => Number((await page.value(rowInfo('Surf'))).hp.split('–').pop());
    const set = async field => { await page.value(`(()=>{Object.assign(CALC.state().field,${JSON.stringify(field)});CALC.render();})()`); return max(); };
    const singles = await set({gameType: 'Singles', atkEmperorPresence: 0, defEmperorPresence: 0});
    assert.equal(await set({atkEmperorPresence: 1}), singles, 'Singles: no effect');
    const doubles = await set({gameType: 'Doubles', atkEmperorPresence: 0});
    const ally = await set({atkEmperorPresence: 1});
    assert.ok(ally > doubles * 1.25 && ally < doubles * 1.35, `Player ally ×1.3: ${doubles} → ${ally}`);
    assert.equal(await set({atkEmperorPresence: 0, defEmperorPresence: 1}), doubles, "the Foe's ally does not boost the Player");
  },
}] : [])];

await runChecks({name: 'calc-moves', file, checks, expectTrainers: false});

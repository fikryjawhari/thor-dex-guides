// Calc entry points: spec check 21. "Calc ▸" on a trainer (a row's team preview line, a lone card's name line) lands on
// #/calc with that trainer as the foe, lead first (Mine kept, the foe defends); "Use in calc ▸" on a Pokémon page lands with a custom set selected. Both at 260 x 316 in normal
// and dvkb mode. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { attackerSide, calcState, guide, guideArg, prepareGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-entry' });
if (!file) {
  console.log('SKIP calc-entry: no cfg.calc');
  process.exit(0);
}

const { trainers: { four }, species } = guide();
const garchomp = species('Garchomp');

const checks = [
  {
    id: '21 entry points',
    title: 'Calc on a trainer row or card selects that foe; Use in calc on a Pokémon page selects a custom set',
    run: async page => {
      await setupCalc(page, { trainer: null });
      const before = await calcState(page);
      await page.route(`#/tr/${four.k}`);
      assert.equal(await page.count('.trcalc'), 1, 'one Calc button on a lone trainer card (its name line)');
      assert.equal(await page.count('.mon .trcalc'), 0, 'none on the Pokémon cards');
      await page.tap('.trcalc');
      assert.equal(await page.value('location.hash'), '#/calc', 'lands on the calc page');
      const foe = await calcState(page);
      assert.deepEqual(foe.foe, { k: four.k, i: 0 }, 'that trainer is the foe, lead first');
      assert.deepEqual(foe.mine, before.mine, 'Mine is kept');
      assert.equal(await attackerSide(page), 'mine', 'the foe defends (Mine attacks)');
      await page.route('#/trainers');
      await page.value(`SR.jumpTr(${JSON.stringify(four.k)})`);
      const row = `details.trd[data-k="${four.k}"]`;
      await page.value(`(()=>{const d=document.querySelector('${row}');d.open=false;d.dispatchEvent(new Event('toggle'));})()`);
      assert.equal(await page.count(`${row}>summary .trcalc`), 1, 'a closed trainer row has the Calc button on its team preview line');
      await page.tap(`${row}>summary .trcalc`);
      assert.equal(await page.value('location.hash'), '#/calc', 'the row button lands on the calc page without opening the row first');
      assert.deepEqual((await calcState(page)).foe, { k: four.k, i: 0 }, 'with that trainer as the foe');
      await page.route(`#/p/${garchomp}`);
      assert.equal(await page.count('.calc-use'), 1, 'Use in calc on the Pokémon page');
      await page.tap('.calc-use');
      assert.equal(await page.value('location.hash'), '#/calc', 'lands on the calc page');
      const custom = await calcState(page);
      assert.equal(custom.mine.src, 'custom', 'a custom set is selected');
      const made = custom.custom.at(-1);
      assert.equal(made.id, garchomp, 'for this Pokémon');
      assert(made.l >= 1 && made.l <= 100, `level ${made.l}`);
      assert.equal(custom.mine.i, custom.custom.length - 1, 'and it is the one selected');
    },
  },
];

await runChecks({ name: 'calc-entry', file, checks });

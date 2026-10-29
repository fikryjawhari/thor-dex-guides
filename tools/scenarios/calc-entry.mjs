// Calc entry points: spec check 21. "Calc vs <name> ▸" on a trainer card lands on #/calc with that foe selected (Mine
// kept, the foe defends); "Use in calc ▸" on a Pokémon page lands with a custom set selected. Both at 260 x 316 in normal
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
    title: 'Calc vs on a trainer card selects that foe; Use in calc on a Pokémon page selects a custom set',
    run: async page => {
      await setupCalc(page, { trainer: null });
      const before = await calcState(page);
      await page.route(`#/tr/${four.k}`);
      assert.equal(await page.value("document.querySelector('.tpick').querySelectorAll('button').length"), four.size, 'the team strip (under 500 px): one button per Pokémon (a Normal-mode team has its own strip)');
      await page.tap('.tpick button', { index: 2 });
      assert.equal(await page.count('.mon.sel .calc-versus'), 1, 'one Calc vs button shows: the selected Pokémon');
      await page.tap('.mon.sel .calc-versus');
      assert.equal(await page.value('location.hash'), '#/calc', 'lands on the calc page');
      const foe = await calcState(page);
      assert.deepEqual(foe.foe, { k: four.k, i: 2 }, 'that trainer and Pokémon are the foe');
      assert.deepEqual(foe.mine, before.mine, 'Mine is kept');
      assert.equal(await attackerSide(page), 'mine', 'the foe defends (Mine attacks)');
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

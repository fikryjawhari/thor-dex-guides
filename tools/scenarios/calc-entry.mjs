// Calc entry points: spec check 21. "Calc vs <name> ▸" on a trainer card lands on #/calc with that foe selected (Mine
// kept, the foe defends); "Use in calc ▸" on a Pokémon page lands with a custom set selected. Both at 260 x 316 in normal
// and dvkb mode. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { EI_TRAINERS, attackerSide, calcState, guideArg, prepareGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-entry' });
if (!file) {
  console.log('SKIP calc-entry: no cfg.calc');
  process.exit(0);
}

const checks = [
  {
    id: '21 entry points',
    title: 'Calc vs on a trainer card selects that foe; Use in calc on a Pokémon page selects a custom set',
    run: async page => {
      await setupCalc(page, { trainer: null });
      const before = await calcState(page);
      await page.route(`#/tr/${EI_TRAINERS.gardenia}`);
      assert.equal(await page.count('.tpick button'), 5, 'the team strip (under 500 px): one button per Pokémon');
      await page.tap('.tpick button', { index: 2 });
      assert.equal(await page.count('.mon.sel .calc-versus'), 1, 'one Calc vs button shows: the selected Pokémon');
      await page.tap('.mon.sel .calc-versus');
      assert.equal(await page.value('location.hash'), '#/calc', 'lands on the calc page');
      const foe = await calcState(page);
      assert.deepEqual(foe.foe, { k: EI_TRAINERS.gardenia, i: 2 }, 'that trainer and Pokémon are the foe');
      assert.deepEqual(foe.mine, before.mine, 'Mine is kept');
      assert.equal(await attackerSide(page), 'mine', 'the foe defends (Mine attacks)');
      await page.route('#/p/445');
      assert.equal(await page.count('.calc-use'), 1, 'Use in calc on the Pokémon page');
      await page.tap('.calc-use');
      assert.equal(await page.value('location.hash'), '#/calc', 'lands on the calc page');
      const custom = await calcState(page);
      assert.equal(custom.mine.src, 'custom', 'a custom set is selected');
      const made = custom.custom.at(-1);
      assert.equal(made.id, '445', 'for this Pokémon');
      assert(made.l >= 1 && made.l <= 100, `level ${made.l}`);
      assert.equal(custom.mine.i, custom.custom.length - 1, 'and it is the one selected');
    },
  },
];

await runChecks({ name: 'calc-entry', file, checks, expectTrainers: false });

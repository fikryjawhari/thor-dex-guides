// Calc field from data: spec check 25. The Field box draws exactly the profile's field list. Here a copy's list gets a
// weather (Hail) and loses a toggle (Magic Room); a selection reaches the engine by key (Rain boosts Surf: about ×1.5 on
// the Water move), and survives a reload. 260 x 316 in normal and dvkb mode. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { attackerRows, fixturePatches, guideArg, prepareGuide, readGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {
  tag: 'calc-field',
  edit(data) {
    fixturePatches(data);
    const calc = data.cfg.calc;
    calc.field = calc.field
      .filter(entry => entry.k !== 'magicRoom')
      .map(entry => (entry.k === 'weather' ? { ...entry, o: [...entry.o, ['Hail', 'Hail']] } : entry));
  },
});
if (!file) {
  console.log('SKIP calc-field: no cfg.calc');
  process.exit(0);
}
const entries = readGuide(file).data.cfg.calc.field;

const checks = [
  {
    id: '25 field from data',
    title: 'the Field box draws the profile list; a selection reaches the engine by key and survives a reload',
    run: async page => {
      await setupCalc(page);
      const selects = entries.filter(entry => entry.type === 'select' && entry.k !== 'gameType').map(entry => entry.k);
      const toggles = entries.filter(entry => entry.type === 'toggle').map(entry => entry.k).sort();
      await page.tap('.dfield > summary');
      assert.deepEqual(await page.value(`[...document.querySelectorAll('.dfr select[data-f]')].map(s=>s.dataset.f)`), selects, "the selects are the profile's");
      assert.deepEqual(await page.value(`[...document.querySelectorAll('.dtg button[data-f]')].map(b=>b.dataset.f).sort()`), toggles, "the toggles are the profile's");
      assert.equal(await page.count('[data-f="magicRoom"]'), 0, 'the removed toggle is gone');
      const weatherOptions = await page.value(`[...document.querySelector('select[data-f="weather"]').options].map(o=>o.value)`);
      assert(weatherOptions.includes('Hail'), `the added weather is offered: ${weatherOptions}`);
      assert.deepEqual(weatherOptions, entries.find(entry => entry.k === 'weather').o.map(([value]) => value), 'every profile option, in order');

      const surfBefore = (await attackerRows(page))[2];
      assert.equal(surfBefore.name, 'Surf', 'the Water move is row 3 of Cloyster');
      await page.value(`(()=>{const s=document.querySelector('select[data-f="weather"]');s.value='Rain';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await page.settle();
      assert.equal(await page.value('CALC.state().field.weather'), 'Rain', 'the selection is stored under its key');
      const surfRain = (await attackerRows(page))[2];
      const range = s => s.split('–').map(Number);
      const [lo, hi] = range(surfBefore.hp), [rlo, rhi] = range(surfRain.hp);
      assert(rlo / lo > 1.4 && rlo / lo < 1.6 && rhi / hi > 1.4 && rhi / hi < 1.6, `Rain should boost Surf about ×1.5: ${surfRain.hp} vs ${surfBefore.hp}`);

      await page.tap('.dtg button[data-f="gravity"]');
      assert.equal(await page.value('CALC.state().field.gravity'), 1, 'a toggle is stored under its key');
      assert.equal(await page.text('.dtg button[data-f="gravity"]'), 'Gravity');

      await page.reload();
      assert.equal(await page.value(`document.querySelector('select[data-f="weather"]')?.value ?? null`), 'Rain', 'the weather is restored after a reload');
      assert.match(await page.text('.dfield summary'), /Rain/, 'and the Field summary shows it');
      assert.equal(await page.value(`document.querySelector('.dtg button[data-f="gravity"]').getAttribute('aria-pressed')`), 'true', 'the toggle is restored');
    },
  },
];

await runChecks({ name: 'calc-field', file, checks, expectTrainers: false });

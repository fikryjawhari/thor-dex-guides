import assert from 'node:assert/strict';
import {guideArg, readGuide, runChecks, tapField} from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/hardlove-gold.html');
const guide = readGuide(file).data;
if (guide.cfg.name !== 'Hardlove Gold' || !guide.cfg.calc) {
  console.log('SKIP calc-hardlove: requires the Hardlove Gold profile');
  process.exit(0);
}
const entries = guide.cfg.calc.field;
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424], [832, 316]];
const checks = [{
  id: 'hardlove profile',
  title: 'profile controls, damage page and persistence at every viewer size',
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(`(()=>{
      CALC.use(byId.snorlax);
      const mon=CALC.state().custom[0];
      mon.l=50;mon.m=[M.indexOf('Tackle')];
      const trainer=TRS.find(trainer=>trainer.p.some(mon=>mon.l>0));
      CALC.enter(trainer.k,0);CALC.render();
    })()`);
    assert.ok(await page.count('.dres .mr:not(.em)'), 'damage rows rendered');
    await page.tap('.dfield > summary');
    assert.deepEqual(await page.value(`[...new Set([...document.querySelectorAll('[data-f]')].map(element=>element.dataset.f))].sort()`),
      entries.map(entry => entry.k).sort());
    const weather = entries.find(entry => entry.k === 'weather');
    assert.ok(weather.o.some(([value]) => value === 'Snow'));
    assert.ok(!weather.o.some(([value]) => value === 'Hail'));
    assert.equal(await page.count('[data-f$="Protected"],[data-f$="Protect"]'), 0, 'Protect is reserved for Z-move profiles');
    for (const key of ['atkFlowerGift', 'defFlowerGift', 'atkPowerTrick', 'defPowerTrick']) {
      await tapField(page, key);
      assert.equal(await page.value(`CALC.state().field[${JSON.stringify(key)}]`), 1);
    }
    await page.reload();
    await page.route('#/calc');
    for (const key of ['atkFlowerGift', 'defFlowerGift', 'atkPowerTrick', 'defPowerTrick']) {
      assert.equal(await page.value(`CALC.state().field[${JSON.stringify(key)}]`), 1, key + ' persisted');
    }
  },
}];
await runChecks({name: 'calc-hardlove', file, checks});

import assert from 'node:assert/strict';
import {guideArg, readGuide, runChecks, tapField} from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/eternal-x.html');
const guide = readGuide(file).data;
if (guide.cfg.name !== 'Eternal X' || !guide.cfg.calc) {
  console.log('SKIP calc-eternal: requires the Eternal X profile');
  process.exit(0);
}
const entries = guide.cfg.calc.field;
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424], [832, 316]];
const checks = [{
  id: 'eternal fields',
  title: 'actual Gen 6 field controls reach the engine and survive reload at every viewer size',
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
    await page.tap('[data-f=gameType][data-value=Doubles]');
    assert.equal(await page.value('CALC.state().field.gameType'),'Doubles');
    for (const entry of entries.filter(entry => entry.type === 'select' && entry.k !== 'gameType')) {
      assert.deepEqual(await page.value(`[...document.querySelector('[data-f="${entry.k}"]').options].map(option=>option.value)`), entry.o.map(([value]) => value));
      const value = {weather: 'Harsh Sunshine', terrain: 'Misty', gameType: 'Doubles'}[entry.k];
      await page.value(`(()=>{const control=document.querySelector('[data-f="${entry.k}"]');control.value=${JSON.stringify(value)};control.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      assert.equal(await page.value(`CALC.state().field[${JSON.stringify(entry.k)}]`), value);
    }
    for (const entry of entries.filter(entry => entry.type === 'toggle')) {
      await tapField(page, entry.k);
      assert.equal(await page.value(`CALC.state().field[${JSON.stringify(entry.k)}]`), 1);
    }
    const before = await page.value('JSON.stringify(CALC.state().field)');
    await page.reload();
    await page.route('#/calc');
    assert.equal(await page.value('JSON.stringify(CALC.state().field)'), before, 'all field values persisted');
    await page.tap('.dfield > summary');
    for (const entry of entries.filter(entry => entry.type === 'toggle')) {
      assert.equal(await page.value(`document.querySelector('[data-f="${entry.k}"]').getAttribute('aria-pressed')`), 'true', entry.k);
    }
  },
}];
await runChecks({name: 'calc-eternal', file, checks});

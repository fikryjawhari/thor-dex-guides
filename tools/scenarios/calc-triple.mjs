// Calc move rows. Triple Kick / Triple Axel hit button: ×n (total) → H1 → H2 → H3 → ×n, the row's outside number follows it,
// percent and KO text stay on the total, the choice persists. Weight / HP / speed moves get their power automatically,
// shown in the Power box, which still overrides. Every viewer size, normal and dvkb. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import {changeMove, fixturePatches, guideArg, prepareGuide, readGuide, runChecks, setupCalc} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-triple', edit: fixturePatches});
if (!file) {
  console.log('SKIP calc-triple: no cfg.calc');
  process.exit(0);
}
const guide = readGuide(file).data;
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424], [832, 316]];
const row = `[...document.querySelectorAll('.dres:not(.na) .mr')].find(r=>r.querySelector('.mv')?.textContent.trim()==='Triple Kick')`;
const read = page => page.value(`(()=>{const r=${row};return {hp:r.querySelector('.r1 .hp').textContent,r2:r.querySelector('.r2').textContent,btn:r.querySelector('.rh')?.textContent,box:!!r.querySelector('[data-mo="hits"]')};})()`);
const perHit = page => page.value(`(()=>{const r=${row};return [...r.querySelectorAll(".rolls")].map(d=>d.innerHTML);})()`).then(list => list.map(html => html.split('<br>')[0].split(': ')[1].split('–').map(Number)));

const checks = [{
  id: 'triple hit button',
  title: 'cycles ×3 / H1 / H2 / H3, outside number follows, percent and KO stay on the total',
  sizes,
  run: async page => {
    await setupCalc(page, {mine: ['party', 0]});
    await changeMove(page, 0, 'Triple Kick');
    const first = await read(page);
    assert.equal(first.btn, '×3', 'default: total');
    assert.equal(first.box, false, 'no Hits box for a fixed three-hit move');
    const per = await perHit(page);
    assert.equal(per.length, 3, 'three hits listed');
    const sum = [per.reduce((s, h) => s + h[0], 0), per.reduce((s, h) => s + h[1], 0)];
    assert.equal(first.hp, sum.join('–'), 'total range outside');
    for (let hit = 1; hit <= 3; hit++) {
      await page.tap('.dres:not(.na) .mr:has(.rh[data-a="hitv"]) .rh');
      const now = await read(page);
      assert.equal(now.btn, 'H' + hit);
      assert.equal(now.hp, per[hit - 1].join('–'), `hit ${hit} range outside`);
      assert.equal(now.r2, first.r2, 'percent and KO unchanged');
    }
    await page.tap('.dres:not(.na) .mr:has(.rh[data-a="hitv"]) .rh');
    assert.equal((await read(page)).btn, '×3', 'wraps to the total');
    assert.equal(await page.value(`Object.values(CALC.state().hits).includes(0)`), true, 'kept in ST.hits');
  },
}, {
  id: 'automatic power',
  title: 'Low Kick has rolls without a set power; the Power box shows it and overrides it',
  sizes,
  run: async page => {
    await setupCalc(page, {mine: ['party', 0]});
    await changeMove(page, 0, 'Low Kick');
    const kick = `[...document.querySelectorAll('.dres:not(.na) .mr')].find(r=>r.querySelector('.mv')?.textContent.trim()==='Low Kick')`;
    const hp = () => page.value(`${kick}.querySelector('.r1 .hp').textContent`);
    const auto = await hp();
    assert.match(auto, /^\d+–\d+$/, 'rolls without a set power');
    const box = `.dres:not(.na) .mr.open [data-mo="bp"]`;
    const shown = Number(await page.value(`(()=>{const b=document.querySelector('${box}');return b.value;})()`));
    assert.ok([20, 40, 60, 80, 100, 120].includes(shown), `weight band power shown (${shown})`);
    await page.setBox(box, shown === 20 ? 120 : 20);
    assert.notEqual(await hp(), auto, 'a set power changes the rolls');
    await page.tap('.dres:not(.na) .mr.open [data-a="mvreset"]');
    assert.equal(await hp(), auto, 'reset goes back to the automatic power');
  },
}];

if (!guide.cfg.calc || guide.cfg.name !== 'Emerald Imperium') {
  // EI's save fixture and trainers drive these checks; the engine side for every base is in tools/calc/test.mjs.
  console.log('SKIP calc-triple: Emerald Imperium fixtures only');
  process.exit(0);
}
await runChecks({name: 'calc-triple', file, checks});

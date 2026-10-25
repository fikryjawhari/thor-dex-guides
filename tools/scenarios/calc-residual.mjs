// Calc turn end (residual per side in the KO text), Protean / Libero type choice, HP reset and the Field block under
// an open editor. Every viewer size, normal and dvkb. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, readGuide, runChecks, setupCalc} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-residual', edit: fixturePatches});
if (!file) {
  console.log('SKIP calc-residual: no cfg.calc');
  process.exit(0);
}
const guide = readGuide(file).data;
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424], [832, 316]];
const box = selector => `(()=>{const r=document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect();return r?{l:Math.round(r.left),r:Math.round(r.right),t:Math.round(r.top),b:Math.round(r.bottom)}:null;})()`;
const changer = name => `P.find(p=>[...p.a,p.ha].some(a=>a!=null&&a>=0&&AB[a][0]===${JSON.stringify(name)}))`;

const checks = [{
  id: 'turn end',
  title: 'each side under its own card, tap applies a turn, arrow lists the parts, KO text counts it',
  sizes,
  run: async page => {
    await setupCalc(page, {mine: ['party', 0]});
    const plainKo = await page.value(`[...document.querySelectorAll('.dres:not(.na) .ko')].map(k=>k.textContent)`);
    assert.equal(await page.count('.deot'), 0, 'no strip without residual');
    // Sandstorm only hurts the foe (Garchomp is Ground): one cell, on the foe's side.
    await page.value(`(()=>{CALC.state().field.weather='Sand';CALC.render();})()`);
    assert.equal(await page.count('.deot .dq'), 1, 'only the affected side has a cell');
    const foeCard = await page.value(box('.dmatch .cc[data-s="foe"]'));
    const foeCell = await page.value(box('.deot .dq'));
    const strip = await page.value(box('.deot'));
    assert.ok(foeCell.l > (strip.l + strip.r) / 2 - 4, 'the foe cell sits on the right half');
    if (page.width >= 480) assert.ok(Math.abs(foeCell.l - foeCard.l) <= 1 && Math.abs(foeCell.r - foeCard.r) <= 1, 'aligned with the foe card');
    assert.equal(await page.value(`getComputedStyle(document.querySelector('.deot .n')).display`),
      page.width >= 480 ? 'block' : 'none', 'names only from 480px');
    const hp = Number(await page.value(`document.querySelector('[data-hp="foe"]').value`));
    const max = Number(await page.value(`document.querySelector('.cc[data-s="foe"] .mx').textContent.slice(1)`));
    const loss = Math.max(1, Math.floor(max / 16));
    assert.equal(await page.text('.deot .dqa .v'), '−' + loss);
    await page.tap('[data-a="eot"][data-s="foe"]');
    assert.equal(Number(await page.value(`document.querySelector('[data-hp="foe"]').value`)), hp - loss, 'tap takes one turn off');
    assert.equal(await page.text('.cc[data-s="foe"] .hpl'), '↺', 'HP not full: reset button');
    await page.tap('[data-a="eotx"][data-s="foe"]');
    assert.deepEqual(await page.value(`[...document.querySelectorAll('.dqp div')].map(d=>d.innerText.replace(/\\s+/g,' ').trim())`), [`Sandstorm −${loss}`]);
    if (page.width >= 480) {
      const field = await page.value(box('.dfield'));
      const rows = await page.value(`Math.max(...[...document.querySelectorAll('.dres .mr')].map(r=>r.getBoundingClientRect().bottom))`);
      assert.ok(field.t >= rows - 1, 'Field stays below the rows with the parts open');
    }
    await page.tap('.cc[data-s="foe"] .hpl');
    assert.equal(Number(await page.value(`document.querySelector('[data-hp="foe"]').value`)), max, 'reset to full');
    assert.equal(await page.text('.cc[data-s="foe"] .hpl'), 'HP');
    // Mine holds Black Sludge: both cells, Mine's on the left; foe attacking counts it in the KO text.
    await page.value(`(()=>{CALC.state().field.weather='';CALC.render();})()`);
    await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
    await page.value(`(()=>{const s=document.querySelector('[data-e="it"][data-s="mine"]');s.value='Black Sludge';s.dispatchEvent(new Event('change'));})()`);
    await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
    const mineCell = await page.value(box('.deot .dq'));
    const mineCard = await page.value(box('.dmatch .cc[data-s="mine"]'));
    assert.ok(mineCell.r < (strip.l + strip.r) / 2 + 4, 'the Mine cell sits on the left half');
    if (page.width >= 480) assert.ok(Math.abs(mineCell.r - mineCard.r) <= 1, 'ends at the centre line like the card');
    await page.tap('.dmatch .cc[data-s="foe"] .cl > span');
    await page.tap('.dres:not(.na) .mr:not(.em):not(.st) > .mm');
    assert.match(await page.text('.dres:not(.na) .mr.open .eotl'), /^Turn end: −\d+ Black Sludge$/);
    assert.ok(plainKo.length > 0);
  },
}, {
  id: 'protean libero type',
  title: 'the edit menu offers a type for Protean / Libero only; it shows on the card, persists, clears on ability change',
  sizes,
  run: async page => {
    for (const name of ['Protean', 'Libero']) {
      const present = await page.value(`!!${changer(name)}`);
      if (!present) continue;
      await page.route('#/calc');
      await page.value(`(()=>{const p=${changer(name)};CALC.use(p);const s=CALC.state(),m=s.custom[s.custom.length-1];m.a=[...p.a,p.ha].find(a=>a!=null&&a>=0&&AB[a][0]===${JSON.stringify(name)});m.l=50;CALC.enter(TRS.find(t=>t.p.every(x=>x.l>0)).k,0);CALC.render();})()`);
      if (!(await page.count('.dmatch .cc[data-s="mine"] .ed'))) await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      assert.equal(await page.count('.ed [data-e="pty"]'), 1, `${name}: type choice`);
      await page.value(`(()=>{const s=document.querySelector('.ed [data-e="pty"]');s.value='Fire';s.dispatchEvent(new Event('change'));})()`);
      assert.equal(await page.count('.dmatch .cc[data-s="mine"] .cn .td'), 1, `${name}: dot on the name`);
      await page.reload();
      await page.route('#/calc');
      assert.equal(await page.value(`(()=>{const s=CALC.state();return s.custom[s.custom.length-1].pty;})()`), 'Fire', `${name}: persisted`);
      assert.equal(await page.count('.dmatch .cc[data-s="mine"] .cn .td'), 1, `${name}: dot after reload`);
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      const other = await page.value(`[...document.querySelectorAll('.ed [data-e="ab"] option')].map(o=>o.value).find(v=>AB[v][0]!==${JSON.stringify(name)})`);
      if (other != null) {
        await page.value(`(()=>{const s=document.querySelector('.ed [data-e="ab"]');s.value=${JSON.stringify(String(other))};s.dispatchEvent(new Event('change'));})()`);
        assert.equal(await page.count('.ed [data-e="pty"]'), 0, `${name}: no type choice for another ability`);
        assert.equal(await page.count('.dmatch .cc[data-s="mine"] .cn .td'), 0, `${name}: choice cleared`);
      }
    }
    await page.route('#/calc');
    assert.equal(await page.count('.ed [data-e="pty"]'), 0);
  },
}, {
  id: 'toxic turn',
  title: 'the parts list sets the toxic counter; Turn and its number share a baseline',
  sizes,
  run: async page => {
    await setupCalc(page, {mine: ['party', 0]});
    await page.tap('.dmatch .cc[data-s="foe"] [data-a="eopen"]');
    await page.value(`(()=>{const s=document.querySelector('[data-e="status"][data-s="foe"]');s.value='tox';s.dispatchEvent(new Event('change'));})()`);
    await page.tap('.dmatch .cc[data-s="foe"] [data-a="eopen"]');
    const max = Number(await page.value(`document.querySelector('.cc[data-s="foe"] .mx').textContent.slice(1)`));
    const tick = turn => '−' + Math.max(1, Math.floor(max * turn / 16));
    assert.equal(await page.text('.deot .dqa .v'), tick(1));
    const base = await page.value(`(()=>{const b=s=>{const r=document.createRange();r.selectNodeContents(document.querySelector(s));return r.getBoundingClientRect().bottom;};return [b('.dqa .l'),b('.dqa .v')];})()`);
    assert.ok(Math.abs(base[0] - base[1]) <= 2, `label and number share a baseline (${base})`);
    await page.tap('[data-a="eotx"][data-s="foe"]');
    assert.equal(await page.count('.dqp [data-tox="foe"]'), 1, 'turn box on the toxic part');
    await page.setBox('.dqp [data-tox="foe"]', 4);
    assert.equal(await page.text('.deot .dqa .v'), tick(4), 'turn 4 damage');
    await page.tap('[data-a="eot"][data-s="foe"]');
    assert.equal(await page.text('.deot .dqa .v'), tick(5), 'applying a turn moves the counter on');
    assert.equal(String(await page.value(`document.querySelector('.dqp [data-tox="foe"]').value`)), '5');
  },
}, {
  id: 'field under an open editor',
  title: 'New Pokémon (editor open) then a trainer: Field stays below the match',
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(`(()=>{localStorage.removeItem(LS.dmg);})()`);
    await page.reload();
    await page.route('#/calc');
    await page.tap('[data-a="newmon"]');
    await page.typeSearch('Garchomp');
    await page.tap('.mrow[data-i="0"]');
    await page.tap('[data-a="foesheet"]');
    await page.tap('.sheet details.grp:nth-of-type(2) > summary');
    await page.tap('.sheet details.grp:nth-of-type(2) .gb .mrow[data-s="pickfoe"]');
    const field = await page.value(box('.dfield'));
    const rows = await page.value(`Math.max(...[...document.querySelectorAll('.dmatch > *')].map(r=>r.getBoundingClientRect().bottom))`);
    assert.ok(field.t >= rows - 1, `Field (${field.t}) below the match (${rows})`);
  },
}];

if (!guide.cfg.calc || guide.cfg.name !== 'Emerald Imperium') {
  // EI's save fixture and trainers drive these checks; the engine side for every base is in tools/calc/test.mjs.
  console.log('SKIP calc-residual: Emerald Imperium fixtures only');
  process.exit(0);
}
await runChecks({name: 'calc-residual', file, checks});

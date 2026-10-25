// Calc Z-moves (profile zmove: a Z toggle on each damaging row's % line) and Totem auras (a trainer mon's `au` becomes
// its stat stages, with an "Aura" mark while they are unchanged). Every viewer size, normal and dvkb. Photonic only
// (the one guide with zmove and Totems); others skip.
import assert from 'node:assert/strict';
import {guideArg, prepareGuide, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv, 'dist/photonic-sun.html'), {tag: 'calc-zmove'});
if (!file) {
  console.log('SKIP calc-zmove: no cfg.calc');
  process.exit(0);
}
const guide = readGuide(file).data;
if (!guide.cfg.calc?.zmove) {
  console.log('SKIP calc-zmove: no zmove profile');
  process.exit(0);
}
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424], [832, 316]];
const TOTEM = 'totem-gumshoos';
const rows = `[...document.querySelectorAll('.dres:not(.na) .mr:not(.em)')]`;

// A fresh calc: Decidueye (New Pokémon) attacking Totem Gumshoos (Def +1 aura).
async function setup(page) {
  await page.route('#/calc');
  await page.value(`(()=>{localStorage.removeItem(LS.dmg);})()`);
  await page.reload();
  await page.route('#/calc');
  await page.tap('[data-a="newmon"]');
  await page.typeSearch('Decidueye');
  await page.tap('.mrow[data-i="0"]');
  await page.value(`CALC.enter(${JSON.stringify(TOTEM)},0)`);
  await page.settle();
}

const checks = [{
  id: 'z toggle',
  title: 'Z on a damaging row: Z-move name and damage, one hit, back off; centred under the type dot; persists',
  sizes,
  run: async page => {
    await setup(page);
    const before = await page.value(`${rows}.map(r=>({mv:r.querySelector('.mv').textContent,hp:r.querySelector('.hp').textContent,z:!!r.querySelector('.rz'),st:r.classList.contains('st')}))`);
    assert.ok(before.some(r => r.z), 'a damaging row has Z');
    before.forEach(r => assert.equal(r.z, !r.st, `Z only on damaging rows (${r.mv})`));
    const i = before.findIndex(r => r.z);
    const geo = await page.value(`(()=>{const r=${rows}[${i}],c=e=>{const b=e.getBoundingClientRect();return b.left+b.width/2;};
      const t=e=>{const g=document.createRange();g.selectNodeContents(e);return g.getBoundingClientRect().left;};
      const name=[...r.querySelector('.mv').childNodes].find(n=>n.nodeType===3);const g=document.createRange();g.selectNodeContents(name);
      return {dot:c(r.querySelector('.td')),z:c(r.querySelector('.rz')),name:g.getBoundingClientRect().left,pc:r.querySelector('.pc').getBoundingClientRect().left};})()`);
    assert.ok(Math.abs(geo.dot - geo.z) <= 1, `Z centred under the dot (${geo.dot} / ${geo.z})`);
    assert.ok(Math.abs(geo.name - geo.pc) <= 1, `name and % text start together (${geo.name} / ${geo.pc})`);
    await page.tap(`.dres:not(.na) .mr:nth-child(${i + 1}) .rz`);
    const on = await page.value(`(()=>{const r=${rows}[${i}];return {zon:r.classList.contains('zon'),mv:r.querySelector('.mv').textContent,pressed:r.querySelector('.rz').getAttribute('aria-pressed'),rh:r.querySelectorAll('.rh').length};})()`);
    assert.ok(on.zon, 'row marked Z');
    assert.notEqual(on.mv, before[i].mv, 'Z-move name shown');
    assert.equal(on.pressed, 'true');
    assert.equal(on.rh, 0, 'no hits button on a Z-move');
    await page.reload();
    await page.route('#/calc');
    assert.equal(await page.value(`${rows}[${i}].querySelector('.mv').textContent`), on.mv, 'Z kept after a reload');
    await page.tap(`.dres:not(.na) .mr:nth-child(${i + 1}) .rz`);
    assert.equal(await page.value(`${rows}[${i}].querySelector('.mv').textContent`), before[i].mv, 'Z off: the move again');
    assert.equal(await page.value(`${rows}[${i}].querySelector('.hp').textContent`), before[i].hp, 'Z off: the same damage');
    if (page.width < 480) {
      const span = await page.value(`(()=>{const f=document.querySelector('.fbar').getBoundingClientRect().top;return ${rows}.at(-1).getBoundingClientRect().bottom-f;})()`);
      assert.ok(span <= page.height, `trainer bar to the last move fits the window (${Math.round(span)} / ${page.height})`);
    }
  },
}, {
  id: 'totem aura',
  title: 'Totem in the calc: aura as stages with the Aura mark; a changed stage drops it, Reset brings it back',
  sizes,
  run: async page => {
    await setup(page);
    const stg = () => page.value(`[...document.querySelectorAll('.dmatch .cc[data-s="foe"] [data-a="sstep"]')].map(b=>b.textContent)`);
    assert.equal(await page.count('.cc[data-s="foe"] .aum'), 1, 'Aura mark on the Totem');
    assert.equal(await page.count('.cc[data-s="mine"] .aum'), 0, 'none on Mine');
    const mark = await page.value(`(()=>{const a=document.querySelector('.cc[data-s="foe"] .aum').getBoundingClientRect(),c=document.querySelector('.cc[data-s="foe"]').getBoundingClientRect(),l=document.querySelector('.cc[data-s="foe"] .cl').getBoundingClientRect();return {in:a.right<=c.right+0.5,line:a.top>=l.top-1&&a.bottom<=l.bottom+1};})()`);
    assert.ok(mark.in, 'mark inside the card');
    assert.ok(mark.line, 'mark on the Lv / HP line');
    await page.tap('.dmatch .cc[data-s="foe"] [data-a="eopen"]');
    assert.deepEqual(await stg(), ['0', '+1', '0', '0', '0'], 'Def +1 from the aura');
    await page.tap('.dmatch .cc[data-s="foe"] [data-a="sstep"][data-x="0"]');
    assert.equal(await page.count('.cc[data-s="foe"] .aum'), 0, 'changed stages: no mark');
    await page.tap('.dmatch .cc[data-s="foe"] [data-a="ereset"]');
    assert.deepEqual(await stg(), ['0', '+1', '0', '0', '0'], 'Reset: the aura again');
    assert.equal(await page.count('.cc[data-s="foe"] .aum'), 1, 'mark back');
    await page.tap('.dmatch .cc[data-s="foe"] [data-a="eopen"]');
    await page.value(`CALC.enter(${JSON.stringify(TOTEM)},1)`);
    await page.settle();
    assert.equal(await page.count('.cc[data-s="foe"] .aum'), 0, 'the ally has no aura');
  },
}];

await runChecks({name: 'calc-zmove', file, checks, expectTrainers: false});

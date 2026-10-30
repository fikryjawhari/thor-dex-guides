// Move effects in the page (plans/calc-move-effects.md): status moves get a button showing their effect, which applies
// to the side that owns the row (a foe's Swords Dance raises the foe); a move that would fail says Fails and changes
// nothing; damaging moves' guaranteed effects come with the damage endpoint (Close Combat lowers the user, Nuzzle
// paralyses). The button fits the closed row at every size, normal and dvkb. Parts whose moves the guide lacks are
// skipped. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-effects', edit: fixturePatches});
if (!file) {
  console.log('SKIP calc-effects: no cfg.calc');
  process.exit(0);
}
const data = readGuide(file).data;
const sizes = [[260, 316], [480, 392], [832, 424]];
const has = (...names) => names.every(name => data.M.includes(name));
const species = data.P.find(entry => entry.n === 'Blissey') ? 'Blissey' : data.P.find(entry => entry.t.length === 1 && entry.t[0] === 'Normal').n;

// The player's custom `species` with `moves` against a level 30+ trainer lead that is neither Ground, Electric nor
// Ghost (so Nuzzle and Close Combat land), the foe's moves optionally set; `dir` who attacks.
const duel = (moves, foeMoves, dir = 'out') => `(()=>{
  CALC.use(P.find(entry=>entry.n===${JSON.stringify(species)}));
  const state=CALC.state(),mon=state.custom.at(-1);
  mon.l=50;mon.i='';mon.m=${JSON.stringify(moves)}.map(name=>M.indexOf(name));
  const plain=x=>{const p=P.find(e=>e.id===x.id);return p&&!p.t.some(t=>['Ground','Electric','Ghost','Steel','Rock'].includes(t));};
  const trainer=TRS.find(t=>t.p.length&&t.p[0].l>=30&&plain(t.p[0]))||TRS.find(t=>t.p.length&&plain(t.p[0]));
  CALC.enter(trainer.k,0);state.dir=${JSON.stringify(dir)};
  ${foeMoves ? `state.edits['foe:'+trainer.k+':0']={...(state.edits['foe:'+trainer.k+':0']||{}),m:${JSON.stringify(foeMoves)}.map(name=>M.indexOf(name)),a:-1,i:''};` : `state.edits['foe:'+trainer.k+':0']={...(state.edits['foe:'+trainer.k+':0']||{}),a:-1,i:''};`}
  CALC.render();
})()`;
const row = name => `[...document.querySelectorAll('.dres:not(.na) .mr')].find(r=>r.querySelector('.mv')?.textContent.trim()===${JSON.stringify(name)})`;
const fxButton = name => `${row(name)}?.querySelector('[data-a="fx"]')`;
const tapFx = async (page, name) => {
  assert.ok(await page.value(`!!${fxButton(name)}`), `${name}: an effect button`);
  await page.value(`${fxButton(name)}.click()`);
  await page.settle();
};
const stages = (page, side) => page.value(`[...(CALC.mon(${JSON.stringify(side)}).stg||[0,0,0,0,0])]`);
const mon = (page, side) => page.value(`(()=>{const m=CALC.mon(${JSON.stringify(side)});return {stg:[...(m.stg||[0,0,0,0,0])],status:m.status||'',used:!!m.used};})()`);

const checks = [{
  id: 'status buttons',
  title: 'Swords Dance raises the player, Leer lowers the foe; the label is the effect; +6 caps to Fails',
  sizes,
  skip: has('Swords Dance', 'Leer') ? '' : 'no Swords Dance / Leer',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Swords Dance', 'Leer', 'Soft-Boiled', 'Tackle']));
    assert.equal(await page.value(`${fxButton('Swords Dance')}.textContent.trim()`), 'Atk+2');
    assert.equal(await page.value(`${row('Swords Dance')}.querySelector('.r1 .hp').textContent.includes('—')`), false, 'no dash');
    await tapFx(page, 'Swords Dance');
    assert.deepEqual(await stages(page, 'mine'), [2, 0, 0, 0, 0]);
    await tapFx(page, 'Leer');
    assert.equal((await stages(page, 'foe'))[1], -1, 'foe Def −1');
    for (let i = 0; i < 2; i++) await tapFx(page, 'Swords Dance');
    assert.equal((await stages(page, 'mine'))[0], 6);
    assert.equal(await page.value(`${fxButton('Swords Dance')}.textContent.trim()`), 'Fails');
    await tapFx(page, 'Swords Dance');
    assert.equal((await stages(page, 'mine'))[0], 6, 'Fails changes nothing');
    // equal closed-row heights with the button in place
    const heights = await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr:not(.open)')].map(r=>Math.round(r.getBoundingClientRect().height))`);
    assert.equal(new Set(heights).size, 1, `closed rows ${heights}`);
    const fits = await page.value(`(()=>{const r=${row('Swords Dance')}.getBoundingClientRect(),b=${fxButton('Swords Dance')}.getBoundingClientRect();return b.right<=r.right+0.5&&b.left>=r.left;})()`);
    assert.ok(fits, 'button inside its row');
  },
}, {
  id: 'foe owns its move',
  title: "the foe's Swords Dance raises the foe; its Thunder Wave paralyses the player (or Fails with the reason)",
  sizes,
  skip: has('Swords Dance', 'Thunder Wave') ? '' : 'no Swords Dance / Thunder Wave',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Tackle'].filter(name => data.M.includes(name)), ['Swords Dance', 'Thunder Wave'], 'in'));
    await tapFx(page, 'Swords Dance');
    assert.deepEqual(await stages(page, 'foe'), [2, 0, 0, 0, 0]);
    assert.deepEqual(await stages(page, 'mine'), [0, 0, 0, 0, 0]);
    await tapFx(page, 'Thunder Wave');
    assert.equal((await mon(page, 'mine')).status, 'par');
    assert.equal(await page.value(`${fxButton('Thunder Wave')}.textContent.trim()`), 'Fails', 'already paralysed');
  },
}, {
  id: 'status vs berry',
  title: 'Will-O-Wisp into a Rawst Berry: burned, cured, berry used',
  sizes: [[260, 316]],
  skip: has('Will-O-Wisp') ? '' : 'no Will-O-Wisp',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Will-O-Wisp']));
    const fire = await page.value(`CALC.types('foe').includes('Fire')`);
    if (fire) return;
    await page.value(`CALC.set('foe','i','Rawst Berry');CALC.render()`);
    await tapFx(page, 'Will-O-Wisp');
    const foe = await mon(page, 'foe');
    assert.equal(foe.status, '');
    assert.equal(foe.used, true);
  },
}, {
  id: 'damage effects',
  title: 'Close Combat lowers the user after the hit; Nuzzle paralyses the target with the damage',
  sizes,
  skip: has('Close Combat') ? '' : 'no Close Combat',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Close Combat', ...(has('Nuzzle') ? ['Nuzzle'] : [])]));
    await page.value(`CALC.set('foe','l',100);CALC.render()`);
    await page.value(`${row('Close Combat')}.querySelector('[data-a="sub"][data-roll="min"]').click()`);
    await page.settle();
    assert.deepEqual(await stages(page, 'mine'), [0, -1, 0, -1, 0]);
    if (has('Nuzzle')) {
      await page.value(`${row('Nuzzle')}.querySelector('[data-a="sub"][data-roll="min"]').click()`);
      await page.settle();
      const foe = await mon(page, 'foe');
      assert.equal(foe.status, 'par', 'Nuzzle paralyses');
    }
    await page.value(`${row('Close Combat')}.querySelector('.mm').click()`);
    await page.settle();
    assert.match(await page.value(`${row('Close Combat')}.querySelector('.dafter')?.textContent||''`), /Def −1/);
  },
}];

await runChecks({name: 'calc-effects', file, checks});

// This fight's types / ability / item (plans/move-pages.md → Calc: type, ability and item changes for the fight): the
// moves that change them really do (Worry Seed, Soak, Trick), ↺ on the card and Reset fight put the set's back, Edit
// keeps showing the set's; Edit → Fight… sets one by hand for any Pokémon, the card's chip shows it and a tap clears
// it. Damaging rows show their added-effect odds beside the KO text with no sideways scroll. Parts whose moves the
// guide lacks are skipped. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-fight-state', edit: fixturePatches});
if (!file) {
  console.log('SKIP calc-fight-state: no cfg.calc');
  process.exit(0);
}
const data = readGuide(file).data;
const sizes = [[260, 316], [480, 392], [832, 424]];
const has = (...names) => names.every(name => data.M.includes(name));
const ability = name => data.AB.findIndex(entry => entry[0] === name);
const species = data.P.find(entry => entry.n === 'Blissey') ? 'Blissey' : data.P.find(entry => entry.t.length === 1 && entry.t[0] === 'Normal').n;

// The player's custom `species` with `moves` and `item` against a level 30+ trainer lead that is not Water / Grass /
// Ghost and has no Sticky Hold, its ability set to `foeAbility` (an AB name; none: no ability) and item `foeItem`.
const duel = (moves, {item = '', foeItem = '', foeAbility = ''} = {}) => `(()=>{
  CALC.use(P.find(entry=>entry.n===${JSON.stringify(species)}));
  const state=CALC.state(),mon=state.custom.at(-1);
  mon.l=50;mon.i=${JSON.stringify(item)};mon.m=${JSON.stringify(moves)}.map(name=>M.indexOf(name));
  const plain=x=>{const p=P.find(e=>e.id===x.id);return p&&!p.t.some(t=>['Water','Grass','Ghost'].includes(t));};
  const trainer=TRS.find(t=>t.p.length&&t.p[0].l>=30&&plain(t.p[0]))||TRS.find(t=>t.p.length&&plain(t.p[0]));
  CALC.enter(trainer.k,0);state.dir='out';
  state.edits['foe:'+trainer.k+':0']={...(state.edits['foe:'+trainer.k+':0']||{}),a:${ability(foeAbility)},i:${JSON.stringify(foeItem)}};
  CALC.render();
})()`;
const row = name => `[...document.querySelectorAll('.dres:not(.na) .mr')].find(r=>r.querySelector('.mv')?.textContent.trim()===${JSON.stringify(name)})`;
const tapFx = async (page, name) => {
  assert.ok(await page.value(`!!${row(name)}?.querySelector('[data-a="fx"]')`), `${name}: an effect button`);
  await page.value(`${row(name)}.querySelector('[data-a="fx"]').click()`);
  await page.settle();
};
const abilityName = (page, side) => page.value(`AB[CALC.mon(${JSON.stringify(side)}).a]?.[0]??''`);
const chips = (page, side) => page.value(`[...document.querySelectorAll('.cc[data-s=${side}] .dfch .dfc')].map(b=>b.textContent.trim())`);
const resetCard = async (page, side) => {
  await page.tap(`.cc[data-s=${side}] [data-a="hpfull"]`);
};
const resetFight = async page => {
  await page.value(`document.querySelector('#calc-log')?.remove()`);
  if (!(await page.value(`document.querySelector('.dfield').open`))) await page.tap('.dfield > summary');
  await page.tap('[data-a="fightreset"]');
};
const noScroll = page => page.value(`document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.dres:not(.na) .mr')].every(r=>r.scrollWidth<=r.clientWidth+1)`);

const checks = [{
  id: 'worry-seed',
  title: 'Worry Seed gives the foe Insomnia (chip, Edit keeps the set\'s); ↺ on the foe card puts its own back',
  sizes,
  skip: has('Worry Seed') && ability('Insomnia') >= 0 && ability('Thick Fat') >= 0 ? '' : 'no Worry Seed / Insomnia',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Worry Seed', 'Tackle'].filter(name => data.M.includes(name)), {foeAbility: 'Thick Fat'}));
    assert.equal(await abilityName(page, 'foe'), 'Thick Fat');
    await tapFx(page, 'Worry Seed');
    assert.equal(await abilityName(page, 'foe'), 'Insomnia');
    assert.deepEqual(await chips(page, 'foe'), ['Insomnia']);
    assert.equal(await page.value(`CALC.state().edits[CALC.key('foe')].fa`), 'Insomnia', 'stored by name');
    await page.tap('[data-a=eopen][data-s=foe]');
    assert.match(await page.value(`document.querySelector('.cc[data-s=foe] .ed [data-e=ab]')?.value??document.querySelector('.cc[data-s=foe] .ed [data-e=ab]')?.textContent??''`), new RegExp(String(ability('Thick Fat')) + '|Thick Fat'), 'Edit shows the set\'s ability');
    await page.tap('[data-a=eopen][data-s=foe]');
    await resetCard(page, 'foe');
    assert.equal(await abilityName(page, 'foe'), 'Thick Fat', '↺ restores');
    assert.deepEqual(await chips(page, 'foe'), []);
  },
}, {
  id: 'soak',
  title: 'Soak makes the foe pure Water (chip); Reset fight restores its own types',
  sizes: [[260, 316]],
  skip: has('Soak') ? '' : 'no Soak',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Soak']));
    const own = await page.value(`CALC.types('foe')`);
    await tapFx(page, 'Soak');
    assert.deepEqual(await page.value(`CALC.types('foe')`), ['Water']);
    assert.deepEqual(await chips(page, 'foe'), ['Water']);
    assert.equal(await page.value(`${row('Soak')}.querySelector('[data-a="fx"]').textContent.trim()`), 'Fails', 'already Water');
    await resetFight(page);
    assert.deepEqual(await page.value(`CALC.types('foe')`), own, 'Reset fight restores');
  },
}, {
  id: 'trick',
  title: 'Trick swaps both items for the fight; the saved set keeps its item; ↺ on each card puts it back',
  sizes: [[260, 316], [832, 424]],
  skip: has('Trick') ? '' : 'no Trick',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Trick'], {item: 'Choice Scarf', foeItem: 'Leftovers'}));
    await tapFx(page, 'Trick');
    assert.equal(await page.value(`CALC.mon('mine').i`), 'Leftovers');
    assert.equal(await page.value(`CALC.mon('foe').i`), 'Choice Scarf');
    assert.equal(await page.value(`CALC.state().custom.at(-1).i`), 'Choice Scarf', 'the set keeps its item');
    assert.deepEqual(await chips(page, 'mine'), ['Item: Leftovers']);
    await resetCard(page, 'mine');
    await resetCard(page, 'foe');
    assert.equal(await page.value(`CALC.mon('mine').i`), 'Choice Scarf');
    assert.equal(await page.value(`CALC.mon('foe').i`), 'Leftovers');
  },
}, {
  id: 'manual',
  title: 'Edit → Fight… adds a type to the foe by hand; the chip shows it and a tap clears it; survives a reload',
  sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Tackle'].filter(name => data.M.includes(name))));
    const own = await page.value(`CALC.types('foe')`);
    await page.tap('[data-a=eopen][data-s=foe]');
    await page.tap('.cc[data-s=foe] [data-a="fightpick"]');
    await page.value(`[...document.querySelectorAll('.mrow')].find(x=>x.textContent.startsWith('+Ghost')).click()`);
    await page.settle();
    assert.deepEqual(await page.value(`CALC.types('foe')`), [...own.filter(t => t !== 'Ghost'), 'Ghost']);
    await page.tap('[data-a=eopen][data-s=foe]');
    assert.deepEqual(await chips(page, 'foe'), ['+Ghost']);
    await page.reload();
    await page.route('#/calc');
    assert.deepEqual(await chips(page, 'foe'), ['+Ghost'], 'kept for the fight');
    const fits = await page.value(`(()=>{const c=document.querySelector('.cc[data-s=foe]').getBoundingClientRect(),b=document.querySelector('.cc[data-s=foe] .dfc').getBoundingClientRect();return b.right<=c.right+0.5&&b.left>=c.left-0.5;})()`);
    await page.screenshot('fs-manual-' + await page.value('innerWidth'));
    assert.ok(fits, 'chip inside its card');
    await page.tap('.cc[data-s=foe] .dfc');
    assert.deepEqual(await page.value(`CALC.types('foe')`), own, 'chip tap clears');
    assert.deepEqual(await chips(page, 'foe'), []);
  },
}, {
  id: 'odds',
  title: 'damaging rows show their effect odds beside the KO text, inside the row, no sideways scroll; the open row lists them',
  sizes: [[260, 316], [480, 392], [537, 424], [832, 424]],
  skip: has('Body Slam', 'Fire Fang') ? '' : 'no Body Slam / Fire Fang',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Body Slam', 'Fire Fang', 'Tackle'].filter(name => data.M.includes(name))));
    const text = await page.value(`${row('Body Slam')}.querySelector('.r2 .dodds')?.textContent??''`);
    assert.match(text, /^30% paralysis/);
    const shown = await page.value(`(()=>{const r=${row('Fire Fang')}.querySelector('.r2'),o=r.querySelector('.dodds');if(!o)return 'missing';const a=r.getBoundingClientRect(),b=o.getBoundingClientRect();return b.width>8&&b.right<=a.right+0.5&&b.left>=a.left-0.5;})()`);
    assert.equal(shown, true, 'odds visible inside the row');
    assert.ok(await noScroll(page), 'no sideways scroll');
    await page.value(`${row('Fire Fang')}.querySelector('.mm').click()`);
    await page.settle();
    assert.match(await page.value(`${row('Fire Fang')}.querySelector('.dodds2')?.textContent||''`), /burn.*flinch|flinch.*burn/);
    assert.ok(await noScroll(page), 'no sideways scroll, open');
  },
}];

await runChecks({name: 'calc-fight-state', file, checks});

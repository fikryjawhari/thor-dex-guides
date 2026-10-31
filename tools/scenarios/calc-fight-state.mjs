// This fight's types / ability / item (plans/move-pages.md → Calc: type, ability and item changes for the fight): the
// moves that change them really do (Worry Seed, Soak, Trick), ↺ on the card and Reset fight put the set's back, Edit
// keeps showing the set's; Edit → Fight… sets one by hand for any Pokémon, the card's Δn counts the changes and opens
// their chips, a chip tap clears one. Damaging rows show their added-effect odds on line 2 after the range (the KO text
// on line 1) with no sideways scroll; the open row starts with the KO chance in full. Parts whose moves the
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
// The card's fight changes, read through Δn: the button counts them (none: no button, no chip row), the chip row is
// hidden until Δ opens it; returns the chip texts.
const chips = async (page, side) => {
  const m = await page.value(`(()=>{const c=document.querySelector('.cc[data-s=${side}]'),d=c?.querySelector('.dfxn'),row=c?.querySelector(':scope>.dfch');return {d:d?.textContent.trim()??null,open:d?.getAttribute('aria-expanded')??null,shown:!!row&&getComputedStyle(row).display!=='none',list:[...(row?.querySelectorAll('.dfc')||[])].map(b=>b.textContent.trim())};})()`);
  assert.equal(m.d, m.list.length ? 'Δ' + m.list.length : null, `${side}: Δn counts the changes ${JSON.stringify(m)}`);
  assert.equal(m.shown, m.open === 'true', `${side}: the chip row shows only while Δ is open ${JSON.stringify(m)}`);
  return m.list;
};
const resetCard = async (page, side) => {
  await page.tap(`.cc[data-s=${side}] [data-a="hpfull"]`);
};
const resetFight = async page => {
  await page.value(`document.querySelector('#calc-log')?.remove()`);
  if (!(await page.value(`document.querySelector('.dfield').open`))) await page.tap('.dfield > summary');
  await page.tap('[data-a="fightreset"]');
};
const innerWidthOf = page => page.width;
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
  title: 'Edit → Fight… adds a type to the foe by hand; Δ1 opens its chip, a tap clears it (Δ goes); survives a reload, closed',
  sizes: [[260, 316], [537, 424]],
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
    assert.equal(await page.value(`document.querySelector('.cc[data-s=foe] .dfxn').getAttribute('aria-expanded')`), 'false', 'Δ1 closed after the change');
    // Narrow: Δ starts the card's third line (below the HP box); wide: on the HP line.
    const place = await page.value(`(()=>{const d=document.querySelector('.cc[data-s=foe] .dfxn').getBoundingClientRect(),h=document.querySelector('.cc[data-s=foe] [data-hp]').getBoundingClientRect();return {below:d.top>=h.bottom-1,same:Math.abs((d.top+d.bottom)/2-(h.top+h.bottom)/2)<=3};})()`);
    assert.ok(innerWidthOf(page) < 480 ? place.below : place.same, `Δ on the ${innerWidthOf(page) < 480 ? 'third' : 'HP'} line ${JSON.stringify(place)}`);
    await page.reload();
    await page.route('#/calc');
    assert.deepEqual(await chips(page, 'foe'), ['+Ghost'], 'kept for the fight');
    assert.equal(await page.value(`document.querySelector('.cc[data-s=foe] .dfxn').getAttribute('aria-expanded')`), 'false', 'closed on load');
    await page.tap('.cc[data-s=foe] .dfxn');
    assert.deepEqual(await chips(page, 'foe'), ['+Ghost'], 'Δ opens the chips');
    assert.equal(await page.value(`document.querySelector('.cc[data-s=foe] .dfxn').getAttribute('aria-expanded')`), 'true', 'Δ open');
    await page.tap('.cc[data-s=foe] .dfxn');
    assert.deepEqual(await chips(page, 'foe'), ['+Ghost'], 'Δ closes the chips');
    await page.tap('.cc[data-s=foe] .dfxn');
    const fits = await page.value(`(()=>{const c=document.querySelector('.cc[data-s=foe]').getBoundingClientRect(),b=document.querySelector('.cc[data-s=foe] .dfc').getBoundingClientRect();return b.right<=c.right+0.5&&b.left>=c.left-0.5;})()`);
    assert.ok(fits, 'chip inside its card');
    await page.tap('.cc[data-s=foe] .dfc');
    assert.deepEqual(await page.value(`CALC.types('foe')`), own, 'chip tap clears');
    assert.deepEqual(await chips(page, 'foe'), []);
  },
}, {
  id: 'odds',
  title: 'damaging rows show their effect odds on line 2 after the range, KO on line 1, inside the row, no sideways scroll; the open row lists them and the KO chance in full',
  sizes: [[260, 316], [480, 392], [537, 424], [832, 424]],
  skip: has('Body Slam', 'Fire Fang') ? '' : 'no Body Slam / Fire Fang',
  run: async page => {
    await page.route('#/calc');
    await page.value(duel(['Body Slam', 'Fire Fang', 'Tackle'].filter(name => data.M.includes(name))));
    const text = await page.value(`${row('Body Slam')}.querySelector('.r2 .dodds')?.textContent??''`);
    assert.match(text, /^30% paralysis/);
    const shown = await page.value(`(()=>{const m=${row('Fire Fang')}.querySelector('.mm'),o=m.querySelector('.dodds'),k=m.querySelector('.ko'),v=m.querySelector('.mv'),pc=[...m.querySelectorAll('.r2>span')].find(x=>/%$/.test(x.textContent.trim()));if(!o||!pc)return 'missing';const a=m.getBoundingClientRect(),b=o.getBoundingClientRect(),c=pc.getBoundingClientRect(),kr=k.getBoundingClientRect(),vr=v.getBoundingClientRect();return {inside:b.width>8&&b.right<=a.right+0.5&&b.left>=a.left-0.5,afterRange:b.left>=c.right-0.5&&Math.abs(b.top-c.top)<=3,koLine1:Math.abs(kr.top-vr.top)<=3&&kr.bottom<=c.top+1,ellipsis:getComputedStyle(o).textOverflow==='ellipsis'};})()`);
    assert.deepEqual(shown, {inside: true, afterRange: true, koLine1: true, ellipsis: true}, 'odds inside the row on line 2 after the range, KO on line 1, cut with …');
    assert.ok(await noScroll(page), 'no sideways scroll');
    await page.value(`${row('Fire Fang')}.querySelector('.mm').click()`);
    await page.settle();
    assert.match(await page.value(`${row('Fire Fang')}.querySelector('.dodds2')?.textContent||''`), /burn.*flinch|flinch.*burn/);
    // The KO chance in full at the top of the open row (the closed row's KO text can be cut off at 260).
    const ko = await page.value(`(()=>{const r=${row('Fire Fang')},k=r.querySelector('.dd .dkof');if(!k)return null;const a=r.getBoundingClientRect(),b=k.getBoundingClientRect();return {t:k.textContent,first:k===r.querySelector('.dd').firstElementChild,fits:b.right<=a.right+0.5&&k.scrollWidth<=k.clientWidth+0.5};})()`);
    assert.ok(ko, 'KO line in the open row');
    assert.match(ko.t, /^((\d+\.\d|<0\.1|>99\.9)% chance to |Guaranteed )(OHKO|\dHKO)$|^No KO in 4 hits$/, ko.t);
    assert.ok(ko.first && ko.fits, `KO line first and whole: ${JSON.stringify(ko)}`);
    assert.ok(await noScroll(page), 'no sideways scroll, open');
  },
}];

await runChecks({name: 'calc-fight-state', file, checks});

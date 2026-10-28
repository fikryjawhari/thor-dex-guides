// Calc team (plans/calc-team.md → Layout, Jump arrows, Build units → 3, unit 3b part 1): the first frame at the five viewer
// sizes (plain and busiest card), open move rows / the editor never reach the Field, and CALC.stops() follows the rule.
// Each check runs at the sizes and modes the spec gives (runChecks in tools/calc_check_lib.mjs). Without cfg.calc: skip.
// Usage: node tools/scenarios/calc-team.mjs [dist/<hack>.html]
import assert from 'node:assert/strict';
import { fixturePatches, guide, guideArg, prepareGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-team', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-team: no cfg.calc');
  process.exit(0);
}

const FRAME_SIZES = [[260, 316], [260, 394], [480, 392], [537, 424], [832, 424]];
const OVERLAP_SIZES = [[480, 392], [560, 424]];
const STOP_SIZES = [[260, 316], [260, 394], [537, 424]];
// Species with a Mega form in the stock data, tried in order for the busiest card (the first one that shows the Mega toggle).
const MEGA_CANDIDATES = ['Charizard', 'Gengar', 'Alakazam', 'Mewtwo', 'Tyranitar', 'Blaziken', 'Lucario', 'Gyarados', 'Venusaur', 'Blastoise', 'Scizor', 'Mawile'];
// The guide's longest species names (letters and spaces): the busiest card shows a long name.
const longNames = () => guide().data.P.filter(entry => /^[A-Za-z ]+$/.test(entry.n)).sort((a, b) => b.n.length - a.n.length || a.n.localeCompare(b.n)).slice(0, 2).map(entry => entry.n);

// Runs in the page: the rects of each named selector (every match), and whether a team strip / preview clips its content.
function measure(selectors) {
  const rect = el => { const r = el.getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, h: r.height }; };
  const out = { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, rects: {}, clipped: {} };
  for (const [name, selector] of Object.entries(selectors)) {
    const els = [...document.querySelectorAll(selector)];
    out.rects[name] = els.map(rect);
    out.clipped[name] = els.some(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
  }
  return out;
}

// Runs in the page: the spec's rule (plans/calc-team.md → Jump arrows), computed from the DOM (not CALC.stops()).
// Top, the trainer bar top − 2 (narrow), the fourth move's bottom (narrow; only when ≥ 24 px past the first frame), Field top − 2;
// clamped to the scroll range; stops closer than 24 px merge.
function ruleStops() {
  const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const bar = document.querySelector('.fbar');
  const field = document.querySelector('details.dfield');
  const rows = [...document.querySelectorAll('.dres:not(.na) .mr')];
  const values = [0];
  let end = null;
  if (innerWidth < 480 && bar) {
    const top = bar.getBoundingClientRect().top + scrollY - 2;
    values.push(top);
    end = rows.at(-1).getBoundingClientRect().bottom + scrollY - innerHeight + 3;
    if (end >= top + 24) values.push(end);
    else end = null;
  }
  if (field) values.push(field.getBoundingClientRect().top + scrollY - 2);
  const sorted = values.map(v => Math.round(Math.max(0, Math.min(max, v)))).sort((a, b) => a - b);
  const stops = [];
  for (const v of sorted) if (!stops.length || v - stops.at(-1) >= 24) stops.push(v);
  return stops;
}

// The action log (#calc-log, top of the window) auto-hides after 3 s: close it by its button and assert it is gone.
async function closeLog(page) {
  if (await page.count('#calc-log')) await page.tap('#calc-log button');
  assert.equal(await page.count('#calc-log'), 0, 'action log closed');
}

// openMatch's landing: narrow = the trainer bar (2 px below its top), wide = the top.
async function landOnFrame(page) {
  await closeLog(page);
  await page.value(`(()=>{const bar=document.querySelector('.fbar');scrollTo(0,innerWidth<480&&bar?bar.getBoundingClientRect().top+scrollY-2:0);})()`);
  await page.settle();
  await closeLog(page);
}

// The busiest card, built the way calc-retest "R1 HP" builds its card (Sitrus, Toxic, residual) plus a long name, the Mega
// toggle and a stat stage ("state"), the card closed (the editor is not in the first frame); then CALC.fit(). Returns the species used, or null.
async function busyCard(page) {
  const names = [...longNames(), ...MEGA_CANDIDATES];
  const picked = await page.value(`(()=>{const names=${JSON.stringify(names)};for(const n of names){const mon=P.find(m=>m.n===n);if(!mon)continue;CALC.use(mon);CALC.render();if(document.querySelector('.cc[data-s=mine] [data-a=mega]'))return n;}return null;})()`);
  if (!picked) return null;
  await page.value(`(()=>{CALC.set('mine','l',50);CALC.set('mine','i','Sitrus Berry');CALC.set('mine','status','tox');CALC.render();CALC.set('mine','hp',40);CALC.set('mine','stg',[1,0,0,0,0]);CALC.render();})()`);
  await page.tap('.cc[data-s=mine] [data-a=mega]');
  await page.value('CALC.fit()');
  await page.settle();
  return picked;
}

// First frame at the spec's sizes: my team, the foe's team, both cards, the attacker's four moves (wide: both lists) and the
// fight bar all fully inside the viewport, nothing clipped, the page not wider than the window.
function firstFrameCheck(busy) {
  return async (page, { width }) => {
    // The six-Pokemon trainer (the foe preview shows six rows at wide); a guide without one uses the four-Pokemon trainer.
    const trainer = guide().trainers.six?.k ?? guide().trainers.four?.k;
    await setupCalc(page, { trainer });
    if (busy) assert.ok(await busyCard(page), 'a Mega species on the page (for the busiest card)');
    await landOnFrame(page);
    const narrow = width < 480;
    const m = await page.value(`(${measure.toString()})(${JSON.stringify({
      team: '.dteamrow',
      foe: narrow ? '.dfoe .dstrip' : '.fteam .ft',
      fteam: '.fteam',
      cardMine: '.cc[data-s=mine]',
      cardFoe: '.cc[data-s=foe]',
      moves: narrow ? '.dres:not(.na) .mr:not(.em)' : '.dres .mr:not(.em)',
      fight: '.dfight',
    })})`);
    const inside = r => r.h > 0 && r.t >= -0.5 && r.b <= m.vh + 0.5 && r.l >= -0.5 && r.r <= m.vw + 0.5;
    const outside = (name, rects) => rects.filter(r => !inside(r)).map(r => `${name} ${Math.round(r.t)}-${Math.round(r.b)} x ${Math.round(r.l)}-${Math.round(r.r)}`);
    const bad = [];
    assert.equal(m.rects.team.length, 1, 'my team row (.dteamrow) drawn once');
    bad.push(...outside('my team', m.rects.team));
    const foeCount = guide().trainers.six ? 6 : guide().trainers.four?.p.length;
    if (narrow) assert.ok(m.rects.foe.length >= 1, 'foe strip drawn');
    else assert.equal(m.rects.foe.length, foeCount, `all ${foeCount} foe preview rows (.fteam .ft) drawn`);
    bad.push(...outside("foe's team", m.rects.foe));
    assert.equal(m.clipped.fteam, false, 'the foe preview is not clipped (no inner scroll)');
    assert.equal(m.rects.cardMine.length, 1, 'my card');
    assert.equal(m.rects.cardFoe.length, 1, 'the foe card');
    bad.push(...outside('my card', m.rects.cardMine), ...outside('foe card', m.rects.cardFoe));
    assert.equal(m.rects.moves.length, narrow ? 4 : 8, `attacker's four moves${narrow ? '' : ' plus the foe list'} drawn`);
    bad.push(...outside('move row', m.rects.moves));
    assert.equal(m.rects.fight.length, 1, 'fight bar');
    bad.push(...outside('fight bar', m.rects.fight));
    assert.ok(m.sw <= m.vw, `page width ${m.sw} within the viewport ${m.vw}`);
    assert.deepEqual(bad, [], 'first frame: everything inside the viewport');
  };
}

// Open move rows / the editor never reach the Field: the open content's bottom is above details.dfield's top.
async function fieldOverlapCheck(page) {
  await setupCalc(page);
  await landOnFrame(page);
  const bottomOf = (selector) => page.value(`(()=>{const els=[...document.querySelectorAll(${JSON.stringify(selector)})];return els.length?Math.max(...els.map(el=>el.getBoundingClientRect().bottom)):null;})()`);
  const fieldTop = () => page.value(`document.querySelector('details.dfield').getBoundingClientRect().top`);
  for (const side of ['mine', 'foe']) {
    const list = side === 'mine' ? '.dres:not(.na)' : '.dres.na';
    await page.tap(`${list} .mr .mm`);
    const rowBottom = await bottomOf(`${list} .mr.open`);
    assert.ok(rowBottom !== null, `${side}: a move row opened`);
    const top = await fieldTop();
    assert.ok(rowBottom <= top, `${side} open move row bottom ${Math.round(rowBottom)} is above the Field top ${Math.round(top)}`);
    await landOnFrame(page);
    await page.tap(`[data-a=eopen][data-s=${side}]`);
    const cardBottom = await bottomOf(`.cc[data-s=${side}]`);
    const editTop = await fieldTop();
    assert.ok(cardBottom <= editTop, `${side} open editor card bottom ${Math.round(cardBottom)} is above the Field top ${Math.round(editTop)}`);
    await closeLog(page);
    await landOnFrame(page);
  }
}

// CALC.stops() equals the rule, Field closed and open; each stop is reached by the rail (down and back up).
async function stopsCheck(page) {
  await setupCalc(page);
  await landOnFrame(page);
  await page.value('scrollTo(0,0)');
  await page.settle();
  const check = async label => {
    const want = await page.value(`(${ruleStops.toString()})()`);
    const got = await page.value('CALC.stops()');
    assert.deepEqual(got, want, `${label}: CALC.stops() ${JSON.stringify(got)}, the rule gives ${JSON.stringify(want)} (window ${await page.value('innerHeight')})`);
    for (let i = 1; i < want.length; i++) {
      await page.tap('.rjump [data-j="1"]');
      const y = await page.value('scrollY');
      assert.ok(Math.abs(y - want[i]) <= 1, `${label}: down to stop ${i} lands at ${y}, want ${want[i]}`);
    }
    for (let i = want.length - 2; i >= 0; i--) {
      await page.tap('.rjump [data-j="-1"]');
      const y = await page.value('scrollY');
      assert.ok(Math.abs(y - want[i]) <= 1, `${label}: up to stop ${i} lands at ${y}, want ${want[i]}`);
    }
    await page.value('scrollTo(0,0)');
    await page.settle();
  };
  await check('Field closed');
  await page.value(`document.querySelector('details.dfield').open=true`);
  await page.settle();
  await check('Field open');
  await page.value(`document.querySelector('details.dfield').open=false`);
  await page.settle();
}

const checks = [
  {
    id: 'first frame plain',
    title: 'trainer picked, scrolled as openMatch does: my team, foe team, both cards, four moves (wide: eight), fight bar inside the viewport',
    sizes: FRAME_SIZES,
    run: firstFrameCheck(false),
  },
  {
    id: 'first frame busy',
    title: 'the same, with the busiest card (long name, Mega, stat stage, berry, Toxic, residual; CALC.fit())',
    sizes: FRAME_SIZES,
    run: firstFrameCheck(true),
  },
  {
    id: 'field overlap',
    title: 'an open move row and an open editor, each side, end above details.dfield',
    sizes: OVERLAP_SIZES,
    run: fieldOverlapCheck,
  },
  {
    id: 'jump stops',
    title: 'CALC.stops() = the rule (top, trainer bar − 2, fourth-move bottom when ≥ 24 px past, Field − 2), Field closed and open',
    sizes: STOP_SIZES,
    run: stopsCheck,
  },
];

await runChecks({ name: 'calc-team', file, checks });

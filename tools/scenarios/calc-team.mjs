// Calc team (template/README.md → Both teams in the first frame): the first frame at the five viewer
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

// Runs in the page: the spec's rule (template/README.md → Both teams in the first frame: jump arrows), computed from the DOM (not CALC.stops()).
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

// The busiest card (or, with `need` = the Intimidate toggle, the ability card), built the way calc-retest "R1 HP" builds its
// card (Sitrus, Toxic, residual) plus a long name, the Mega toggle when the species has one and a stat stage ("state"), the
// card closed (the editor is not in the first frame); then CALC.fit(). Returns the species used, or null.
async function busyCard(page, { names = [...longNames(), ...MEGA_CANDIDATES], need = '.cc[data-s=mine] [data-a=mega]' } = {}) {
  const picked = await page.value(`(()=>{const names=${JSON.stringify(names)},need=${JSON.stringify(need)};for(const n of names){const mon=P.find(m=>m.n===n);if(!mon)continue;CALC.use(mon);CALC.render();if(document.querySelector(need))return n;}return null;})()`);
  if (!picked) return null;
  await page.value(`(()=>{CALC.set('mine','l',50);CALC.set('mine','i','Sitrus Berry');CALC.set('mine','status','tox');CALC.render();CALC.set('mine','hp',40);CALC.set('mine','stg',[1,0,0,0,0]);CALC.render();})()`);
  if (!need.includes('intim') && await page.count('.cc[data-s=mine] [data-a=mega]')) await page.tap('.cc[data-s=mine] [data-a=mega]');
  await page.value('CALC.fit()');
  await page.settle();
  return picked;
}

// First frame at the spec's sizes: my team, the foe's team, both cards, the attacker's four moves (wide: both lists) and the
// fight bar all fully inside the viewport, nothing clipped, the page not wider than the window.
function firstFrameCheck(mode) {
  return async (page, { width }) => {
    // The six-Pokemon trainer (the foe preview shows six rows at wide); a guide without one uses the four-Pokemon trainer.
    const trainer = guide().trainers.six?.k ?? guide().trainers.four?.k;
    await setupCalc(page, { trainer });
    // a guide without Megas (BB2R, Gen V) gets the busiest card without the Mega toggle: a long name
    if (mode === 'busy') assert.ok(await busyCard(page) || !guide().data.P.some(entry => entry.g === 1) && await busyCard(page, { names: longNames(), need: '.cc[data-s=mine]' }), 'a Mega species on the page (for the busiest card)');
    if (mode === 'ability') assert.ok(await busyCard(page, { names: ABILITY_CANDIDATES, need: '.cc[data-s=mine] [data-e=intim]' }), 'an Intimidate species on the page (for the ability card)');
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
    if (mode === 'ability') {
      assert.equal(await page.count('.cc[data-s=mine] [data-e=intim]'), 1, 'the Intimidate toggle on the closed card');
      assert.ok(await page.count('.cc[data-s=mine] .cn b') >= 1, 'the name line (the Pokémon is not in the team)');
      assert.equal(m.clipped.cardMine, false, 'the card is not clipped');
      if (narrow) assert.ok(m.rects.cardMine[0].h <= 64, `closed narrow card ${Math.round(m.rects.cardMine[0].h)} px, at most three lines (64 px)`);
    }
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

// Ability species for the ability card: the first on the page with an Intimidate toggle. No Mega: a Mega form has its own ability (Gyarados loses Intimidate).
const ABILITY_CANDIDATES = ['Arcanine', 'Incineroar', 'Staraptor', 'Krookodile', 'Granbull', 'Mightyena', 'Garchomp', 'Salamence', 'Gyarados'];
// Doubles evidence (as calc-doubles.mjs reads it): a trainer with a gameType Doubles record and every Pokémon on the page.
const doublesRecord = trainer => (trainer.field || []).find(record => !record.label && (record.effects || []).some(effect => effect.kind === 'gameType' && effect.value === 'Doubles'));
const allTrainers = () => guide().data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr));
const doublesTrainer = () => allTrainers().find(trainer => doublesRecord(trainer) && trainer.p.length > 0 && trainer.p.every(mon => mon.m?.length && guide().data.P.some(entry => String(entry.id) === String(mon.id))));

// Team drag (touch): CDP touch events become the page's pointer events. The source is scrolled into view, pressed and held
// 300 ms (the page starts a drag at 250 ms), then the finger goes to the target. While the target is off the window (narrow:
// the page auto-scrolls near the top / bottom 40 px) the finger waits at that edge; once the target is in view it moves
// onto it and lifts. 450 ms after the lift the click window (400 ms) has closed.
const sleep = ms => new Promise(done => setTimeout(done, ms));
const touchOn = page => page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
const touchAt = (page, type, x, y) => page.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
const SPOT = sel => `(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return null;const r=el.getBoundingClientRect(),y=r.top+r.height/2;return{x:r.left+r.width/2,y,dir:r.top<0?-1:1,ok:r.top>=0&&r.bottom<=innerHeight&&y>=12&&y<=innerHeight-12};})()`;
const BOX = i => `.mg .dstrip:not(.dteamrow) button[data-a=mpick][data-src=party][data-i="${i}"]`;
const SLOT = n => `.dteamrow button[data-t="${n}"]`;
const teamOf = page => page.value('CALC.team().map(x=>x.src+":"+x.pid)');

async function drag(page, from, to) {
  await page.value(`document.querySelector(${JSON.stringify(from)})?.scrollIntoView({block:'center'})`);
  await page.settle();
  const start = await page.value(SPOT(from));
  assert.ok(start, `drag source ${from} is drawn`);
  await touchAt(page, 'touchStart', start.x, start.y);
  await sleep(300);
  const height = await page.value('innerHeight');
  for (let step = 0; ; step++) {
    const t = await page.value(SPOT(to));
    assert.ok(t, `drag target ${to} is drawn`);
    if (t.ok) {
      await touchAt(page, 'touchMove', (start.x + t.x) / 2, (start.y + t.y) / 2);
      await touchAt(page, 'touchMove', t.x, t.y);
      await sleep(80);
      break;
    }
    assert.ok(step < 40, `drag target ${to} never came into the window`);
    await touchAt(page, 'touchMove', start.x, t.dir < 0 ? 6 : height - 6);
    await sleep(120);
  }
  await touchAt(page, 'touchEnd');
  await sleep(450);
  await page.settle();
}

// A quick swipe: moved 24 px before 250 ms, so the press is a scroll, not a drag. Returns whether a lifted copy showed.
async function swipe(page, from) {
  await page.value(`document.querySelector(${JSON.stringify(from)})?.scrollIntoView({block:'center'})`);
  await page.settle();
  const s = await page.value(SPOT(from));
  assert.ok(s, `swipe source ${from} is drawn`);
  await touchAt(page, 'touchStart', s.x, s.y);
  await sleep(50);
  await touchAt(page, 'touchMove', s.x, s.y + 24);
  await sleep(400);
  const lifted = await page.value(`!!document.querySelector('.dlift,.dghost')`);
  await touchAt(page, 'touchMove', s.x, s.y + 60);
  await touchAt(page, 'touchEnd');
  await sleep(450);
  await page.settle();
  return lifted;
}

async function dragCheck(page) {
  await setupCalc(page);
  await touchOn(page);
  const want = async (list, label) => assert.deepEqual(await teamOf(page), list, label);
  await drag(page, BOX(0), SLOT(0));
  await want(['party:0'], 'box → empty slot appends');
  await drag(page, BOX(1), SLOT(1));
  await want(['party:0', 'party:1'], 'box → empty slot appends (second)');
  await drag(page, BOX(2), SLOT(0));
  await want(['party:2', 'party:1'], 'box → filled slot replaces that member');
  await drag(page, BOX(1), SLOT(0));
  await want(['party:1', 'party:2'], 'box Pokémon already in the team → swaps with the slot dropped on');
  await drag(page, SLOT(0), SLOT(1));
  await want(['party:2', 'party:1'], 'team → team slot swaps');
  await drag(page, SLOT(0), SLOT(3));
  await want(['party:1', 'party:2'], 'team → empty slot moves to the end');
  await drag(page, SLOT(0), '.dfight');
  await want(['party:2'], 'team → outside the row removes');
  assert.equal(await swipe(page, BOX(4)), false, 'a quick swipe (moved before 250 ms) starts no drag');
  await want(['party:2'], 'quick swipe leaves the team unchanged');
  await page.tap(BOX(4));
  await page.tap(SLOT(0));
  const sent = await page.value(`(()=>{const s=CALC.state().mine,t=CALC.team()[0];return{got:{src:s.src,b:s.b,i:s.i},want:{src:t.src,b:t.b,i:t.i}};})()`);
  assert.deepEqual(sent.got, sent.want, 'a tap on a team cell sends that Pokémon in');
}

// A foe Pokémon dropped on my team becomes one custom copy (pid f:<trainer>:<slot>); a partner ([P]) follows its multi.
async function foeDragCheck(page) {
  const partnered = allTrainers().find(trainer => trainer.pt?.length);
  await setupCalc(page, partnered ? { trainer: partnered.k } : {});
  await touchOn(page);
  if (partnered) {
    await page.tap('[data-a="tnext"]');
    assert.match(await page.text('.dsrc .nm'), /^\[P\] /, 'the partner follows its battle, marked [P]');
    assert.ok((await page.value('CALC.state().foe.k')).startsWith(partnered.k + '~p'), 'partner key <trainer>~p<n>');
  }
  const k = await page.value('CALC.state().foe.k'), wide = await page.value('innerWidth>=480');
  const FOE = i => wide ? `.fteam .ft[data-a=fpick][data-i="${i}"]` : `.dside:not(.mg) .dstrip button[data-a=fpick][data-i="${i}"]`;
  const id = await page.value('CALC.mon("foe").id');
  await drag(page, FOE(0), SLOT(0));
  assert.deepEqual(await teamOf(page), [`custom:f:${k}:0`], 'foe → empty slot appends a custom copy');
  await drag(page, FOE(0), SLOT(1));
  assert.deepEqual(await teamOf(page), [`custom:f:${k}:0`], 'the same foe Pokémon again: still one entry');
  assert.equal(await page.value(`CALC.state().custom.filter(m=>m.pid===${JSON.stringify('f:' + k + ':0')}).length`), 1, 'one custom copy');
  assert.equal(await page.value('CALC.state().foe.i'), 0, 'dragging does not pick a foe');
  await page.tap(SLOT(0));
  assert.equal(await page.value('CALC.mon("mine").id'), id, 'the copy is sent in on my side');
}

// ↺ on a card resets that Pokémon's battle state (HP, status, stages; template/README.md → Reset fight) and keeps its set
// edits; the other side is untouched.
async function monResetCheck(page) {
  await setupCalc(page);
  await page.value(`(()=>{CALC.set('mine','na','Adamant');CALC.set('mine','hp',1);CALC.set('mine','status','brn');CALC.set('mine','stg',[2,0,0,0,0]);CALC.set('foe','hp',1);CALC.render();})()`);
  await page.settle();
  const reset = '.cc[data-s=mine] [data-a=hpfull]';
  assert.equal(await page.value(`document.querySelector('${reset}').classList.contains('rs')`), true, '↺ is lit while the Pokémon has battle state');
  await page.tap(reset);
  const mon = await page.value(`(()=>{const m=CALC.mon('mine');return{hp:m.hp??null,status:m.status||'',stg:(m.stg||[]).filter(Boolean).length,na:m.na,max:+(document.querySelector('.cc[data-s=mine] .mx').textContent.match(/[0-9]+/)[0]),box:+document.querySelector('[data-hp=mine]').value};})()`);
  assert.equal(mon.box, mon.max, 'HP back to full');
  assert.equal(mon.status, '', 'status cleared');
  assert.equal(mon.stg, 0, 'stat stages cleared');
  assert.equal(mon.na, 'Adamant', 'set edits stay');
  assert.equal(await page.value(`CALC.mon('foe').hp`), 1, "the foe's battle state stays");
  assert.equal(await page.value(`document.querySelector('${reset}').classList.contains('rs')`), false, '↺ unlit after the reset');
}

// A tap on the Pokémon already in opens its dex page (box cell, team cell, foe); the first tap only picks; a drag never opens it.
async function dexLinkCheck(page) {
  await setupCalc(page);
  await touchOn(page);
  const wide = await page.value('innerWidth>=480');
  const FOE = i => wide ? `.fteam .ft[data-a=fpick][data-i="${i}"]` : `.dside:not(.mg) .dstrip button[data-a=fpick][data-i="${i}"]`;
  const hash = () => page.value('location.hash');
  const back = async () => { await page.route('#/calc'); await page.settle(); };
  let id = await page.value(`CALC.mon('mine').id`);
  await page.tap(BOX(5));
  assert.equal(await hash(), `#/p/${id}`, 'a tap on the selected box Pokémon opens its dex page');
  await back();
  await page.tap(BOX(0));
  assert.equal(await hash(), '#/calc', 'a tap on another Pokémon only picks it');
  assert.equal(await page.value('CALC.state().mine.i'), 0, 'picked');
  await drag(page, BOX(0), SLOT(0));
  assert.equal(await hash(), '#/calc', 'dragging the selected Pokémon into the team does not open its page');
  assert.deepEqual(await teamOf(page), ['party:0'], 'and it joined the team');
  id = await page.value(`CALC.mon('mine').id`);
  await page.tap(SLOT(0));
  assert.equal(await hash(), `#/p/${id}`, 'a tap on the selected Pokémon in the team row opens its page');
  await back();
  id = await page.value(`CALC.mon('foe').id`);
  await page.tap(FOE(0));
  assert.equal(await hash(), `#/p/${id}`, 'a tap on the selected foe opens its page');
}

// An empty team stays empty through an import (a fresh page: nothing dragged in yet).
async function emptyTeamCheck(page) {
  assert.deepEqual(await teamOf(page), [], 'an import into an empty team never fills it');
  await page.importSave('good.json');
  assert.deepEqual(await teamOf(page), [], 'a re-import into an empty team leaves it empty');
}

async function persistCheck(page) {
  await setupCalc(page);
  await touchOn(page);
  await emptyTeamCheck(page);
  await drag(page, BOX(0), SLOT(0));
  await drag(page, BOX(2), SLOT(1));
  const before = await teamOf(page);
  assert.deepEqual(before, ['party:0', 'party:2'], 'two members dragged in');
  await page.reload();
  assert.deepEqual(await teamOf(page), before, 'the team survives a reload');
  await page.importSave('good.json');
  assert.deepEqual(await teamOf(page), before, 're-import keeps the team by pid');
  await page.value(`CALC.use(P.find(m=>m.n==='Gengar'))`);
  await page.settle();
  const custom = '.mg .dstrip:not(.dteamrow) button[data-a=mpick][data-src=custom]';
  await drag(page, custom, SLOT(2));
  const withCustom = await teamOf(page);
  assert.equal(withCustom.length, 3, 'a custom set dragged into the team');
  assert.ok(withCustom[2].startsWith('custom:'), 'the third member is the custom set');
  // CALC.use sent the custom set in already: a second tap would open its dex page.
  if (await page.value("CALC.state().mine.src") !== 'custom') await page.tap(custom);
  await page.tap('[data-a=eopen][data-s=mine]');
  await page.tap('[data-a=edel]');
  assert.deepEqual(await teamOf(page), before, 'deleting a custom set removes it from the team');
}

// The HP bar and the grey fainted sprite: my team cell, the foe's cell (the strip at narrow, the .ft row at wide).
async function hpCheck(page) {
  await setupCalc(page);
  await touchOn(page);
  await drag(page, BOX(0), SLOT(0));
  await drag(page, BOX(1), SLOT(1));
  await page.tap(SLOT(0));
  const maxOf = side => page.value(`(()=>{const t=(document.querySelector('.cc[data-s=${side}] .mx')?.textContent||'').match(/(\\d+)/);return t?+t[1]:null;})()`);
  const setHp = async (side, fraction) => {
    const max = await maxOf(side);
    const hp = fraction === 0 ? 0 : `Math.max(1,Math.round(${max}*${fraction}))`;
    await page.value(`(()=>{CALC.set('${side}','hp',${hp});CALC.render();})()`);
    await page.settle();
  };
  const cell = sel => page.value(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>e.getClientRects().length);if(!el)return null;const b=el.querySelector('.thp > i');const s=el.querySelector('.spr');return{ko:el.classList.contains('ko'),cls:b?b.className:'',w:b?parseFloat(b.style.width):null,gray:s?getComputedStyle(s).filter:''};})()`);
  const check = (state, want, label) => {
    assert.ok(state, `${label} drawn`);
    assert.equal(state.ko, want.ko, `${label}: .ko ${want.ko}`);
    assert.equal(state.cls, want.cls, `${label}: bar class "${want.cls}" (got "${state.cls}")`);
    assert.ok(Math.abs(state.w - want.w) <= 2, `${label}: bar ${state.w}% want ${want.w}%`);
    if (want.ko) assert.match(state.gray, /grayscale/, `${label}: sprite grey`);
    else assert.doesNotMatch(state.gray, /grayscale/, `${label}: sprite not grey`);
  };
  const T0 = SLOT(0), T1 = SLOT(1), F0 = '[data-a=fpick][data-i="0"]';
  await setHp('mine', 0);
  check(await cell(T0), { ko: true, cls: 'r', w: 0 }, 'team 0 at 0 HP');
  check(await cell(T1), { ko: false, cls: '', w: 100 }, 'team 1 (not selected) full');
  await setHp('mine', 0.45);
  check(await cell(T0), { ko: false, cls: 'y', w: 45 }, 'team 0 at 45%');
  await setHp('mine', 0.15);
  check(await cell(T0), { ko: false, cls: 'r', w: 15 }, 'team 0 at 15%');
  await setHp('mine', 1);
  check(await cell(T0), { ko: false, cls: '', w: 100 }, 'team 0 full');
  await setHp('foe', 0);
  check(await cell(F0), { ko: true, cls: 'r', w: 0 }, 'foe 0 at 0 HP');
  await setHp('foe', 0.4);
  check(await cell(F0), { ko: false, cls: 'y', w: 40 }, 'foe 0 at 40%');
  await setHp('mine', 0);
  await setHp('foe', 0);
  await page.tap('[data-a=fightreset]');
  check(await cell(T0), { ko: false, cls: '', w: 100 }, 'Reset fight: team 0 full');
  check(await cell(F0), { ko: false, cls: '', w: 100 }, 'Reset fight: foe 0 full');
  await setHp('foe', 0);
  const other = guide().trainers.six?.k ?? guide().trainers.relative?.k;
  assert.ok(other && other !== guide().trainers.four?.k, 'a second trainer to change to');
  await page.value(`CALC.enter(${JSON.stringify(other)},0)`);
  await page.settle();
  check(await cell(F0), { ko: false, cls: '', w: 100 }, 'a trainer change refills the foe');
}

// A doubles trainer opens in D (Auto: dashed, no A mark) and the D button sits inside the fight bar, not clipped, inside the window.
async function doublesCheck(page) {
  await setupCalc(page, { trainer: doublesTrainer().k });
  const d = await page.value(`(()=>{const D=[...document.querySelectorAll('.dfight [data-f="gameType"]')].find(b=>b.dataset.value==='Doubles');if(!D)return null;const F=D.closest('.dfight'),r=D.getBoundingClientRect(),f=F.getBoundingClientRect();return{pressed:D.getAttribute('aria-pressed'),auto:D.classList.contains('dauto'),mark:!!D.querySelector('sup'),inside:r.width>0&&r.left>=f.left-0.5&&r.right<=f.right+0.5&&r.top>=f.top-0.5&&r.bottom<=f.bottom+0.5,clipped:D.scrollWidth>D.clientWidth+1,right:f.right,vw:innerWidth};})()`);
  assert.ok(d, 'the D button is drawn in the fight bar');
  assert.equal(d.pressed, 'true', 'a doubles trainer opens in D');
  assert.ok(d.auto && !d.mark, 'D is the Auto one (dashed), with no A mark');
  assert.ok(d.inside && !d.clipped, 'the D button fits inside the fight bar, not clipped');
  assert.ok(d.right <= d.vw + 0.5, `the fight bar (right ${Math.round(d.right)}) is within the window ${d.vw}`);
}

const checks = [
  {
    id: 'first frame plain',
    title: 'trainer picked, scrolled as openMatch does: my team, foe team, both cards, four moves (wide: eight), fight bar inside the viewport',
    sizes: FRAME_SIZES,
    run: firstFrameCheck('plain'),
  },
  {
    id: 'first frame busy',
    title: 'the same, with the busiest card (long name, Mega, stat stage, berry, Toxic, residual; CALC.fit())',
    sizes: FRAME_SIZES,
    run: firstFrameCheck('busy'),
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
  {
    id: 'first frame ability card',
    title: 'the same, with a closed card of an Intimidate species (toggle and name line, the Pokémon not in the team): at most three lines at narrow, not clipped; CALC.fit()',
    sizes: FRAME_SIZES,
    run: firstFrameCheck('ability'),
  },
  {
    id: 'team drag',
    title: 'box → empty appends, → filled replaces, a box member already in the team swaps, team → team swaps, → empty moves to the end, → outside removes; a quick swipe does not drag; a tap sends in',
    sizes: [[260, 316], [480, 392]],
    run: dragCheck,
  },
  {
    id: 'foe drag',
    title: 'a foe Pokémon dropped on my team is one custom copy, sent in by a tap; a partner trainer ([P]) follows its multi',
    sizes: [[260, 316], [832, 424]],
    run: foeDragCheck,
  },
  {
    id: 'team persistence',
    title: 'the team survives a reload; a re-import keeps it by pid and never fills an empty team; deleting a custom set removes it from the team',
    sizes: [[260, 316]],
    run: persistCheck,
  },
  {
    id: 'team hp',
    title: 'HP bar colours by percent and the grey fainted sprite on the team row, the foe strip (narrow) and the foe rows (wide); Reset fight and a foe trainer change refill',
    sizes: [[260, 316], [480, 392]],
    run: hpCheck,
  },
  {
    id: 'mon reset',
    title: "↺ on a card clears that Pokémon's HP, status and stages, keeps its set edits, leaves the foe alone",
    sizes: [[260, 316], [832, 424]],
    run: monResetCheck,
  },
  {
    id: 'dex link',
    title: 'a tap on the Pokémon already in (box, team row, foe) opens its dex page; the first tap only picks; a drag never opens it',
    sizes: [[260, 316], [480, 392], [832, 424]],
    run: dexLinkCheck,
  },
  {
    id: 'auto doubles wide',
    title: 'a doubles trainer opens in D (Auto, dashed); the D button fits inside the fight bar',
    sizes: [[480, 392], [832, 424]],
    skip: doublesTrainer() ? undefined : 'no trainer with doubles evidence',
    run: doublesCheck,
  },
];

await runChecks({ name: 'calc-team', file, checks });

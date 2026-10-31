import assert from 'node:assert/strict';
import { MODES, SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424]];
const labels = {
  contact: 'Makes contact', nocontact: 'No contact', punch: 'Punching move', bite: 'Biting move', slicing: 'Slicing move',
  sound: 'Sound move', bullet: 'Ball / bomb move', pulse: 'Pulse move', powder: 'Powder move', wind: 'Wind move',
  dance: 'Dance move', heal: 'Healing move', kick: 'Kicking move', secondary: 'Has an added effect', recoil: 'Recoil', drain: 'Drains HP',
  multihit: 'Hits more than once', charge: 'Two turns', recharge: 'User must recharge', binding: 'Traps and binds',
  crash: 'Crash damage on a miss', noprotect: 'Goes through Protect', bypasssub: 'Hits through Substitute',
  gravity: 'Unusable under Gravity', defrost: 'Thaws the user',
};
const targets = {
  normal: ['one one . me one .', 'One adjacent Pokémon'], any: ['one one one me one one', 'Any one Pokémon, far ones too'],
  adjacentFoe: ['one one . me . .', 'One adjacent opponent'], adjacentAlly: ['. . . me one .', 'One adjacent ally'],
  adjacentAllyOrSelf: ['. . . one one .', 'The user or an adjacent ally'], allAdjacentFoes: ['on on . me . .', 'All adjacent opponents'],
  allAdjacent: ['on on . me on .', 'All adjacent Pokémon'], randomNormal: ['one one . me . .', 'A random adjacent opponent'],
  self: ['. . . on . .', 'The user'], allies: ['. . . on on on', "The user's side"], allySide: ['. . . on on on', "The user's side"],
  allyTeam: ['. . . on on on', "The user's team"], foeSide: ['on on on me . .', 'The opposing side'],
  all: ['on on on on on on', 'The whole field'], scripted: ['one one . me . .', 'The last Pokémon to hit the user'],
};
const props = move => Object.keys(labels).filter(prop => prop === 'nocontact'
  ? move.c && move.c !== 'Status' && !(move.f || []).includes('contact') : (move.f || []).includes(prop));
const pick = predicate => data.MV.findIndex(predicate);
const samples = [...new Set([
  pick(move => move.f?.includes('contact') && move.f.includes('punch')) >= 0
    ? pick(move => move.f?.includes('contact') && move.f.includes('punch')) : pick(move => move.f?.includes('contact')),
  pick(move => move.tg === 'allAdjacent'), pick(move => move.c === 'Status' && move.tg === 'foeSide'),
  pick(move => move.se?.some(([chance]) => chance < 100)),
  pick(move => move.se?.some(([chance]) => chance === 100)),
])];
assert(samples.every(index => index >= 0), 'contact, spread, status, chance and guaranteed-effect samples');
const kicking = pick(move => move.f?.includes('kick'));
if (kicking >= 0 && !samples.includes(kicking)) samples.push(kicking);
const open = async (page, index) => {
  await page.route('#/m/' + index);
  await page.waitFor('!!document.querySelector(".move-learn")', 'move page');
};
const tap = async (page, selector) => {
  await page.value(`dispatchEvent(new Event('wheel'));document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);
  await page.settle();
  await page.tap(selector);
};
const expectedGroups = index => {
  const machines = [...new Set((data.IT || []).filter(section => section.k === 'tm').flatMap(section => section.r)
    .filter(row => row[2] === index).map(row => /^HM\d/i.test(row[0]) ? 'HM' : /^TM\d/i.test(row[0]) ? 'TM' : null).filter(Boolean))];
  const groups = Object.fromEntries(['Lv', 'TM', 'HM', 'Tutor', 'Egg', 'Evo'].map(method => [method, []]));
  for (const pokemon of data.P) {
    for (const [level, move] of pokemon.lv) if (move === index) groups[level ? 'Lv' : 'Evo'].push(String(pokemon.id));
    if (pokemon.tm.includes(index)) for (const method of machines.length ? machines : ['TM']) groups[method].push(String(pokemon.id));
    for (const [field, method] of [['tu', 'Tutor'], ['eg', 'Egg']]) {
      for (const move of pokemon[field] || []) if (move === index) groups[method].push(String(pokemon.id));
    }
  }
  return Object.entries(groups).filter(([, rows]) => rows.length);
};
async function targetCheck(page, move) {
  const expected = targets[move.tg];
  if (!expected) {
    assert.equal(await page.value('!!document.querySelector(".tgg")'), false, 'no invented target');
    return;
  }
  assert.deepEqual(await page.value(`[...document.querySelectorAll('.tgg i')].map(cell=>cell.className||'.')`), expected[0].split(' '));
  assert.equal(await page.value(`document.querySelector('.tgt').lastChild.textContent`), expected[1]);
  assert.equal(await page.value(`document.querySelectorAll('.tgg i')[3].textContent`), 'You');
}
async function interactionsCheck(page, index) {
  for (const side of ['u', 't']) {
    const rows = (data.MI || []).filter(row => row.w === side && row.m.includes(index));
    const selector = `.move-affected[data-side="${side}"]`;
    assert.equal(await page.value(`!!document.querySelector(${JSON.stringify(selector)})`), !!rows.length);
    if (!rows.length) continue;
    assert.equal(await page.value(`document.querySelector('${selector} details').open`), side === 'u', 'interaction defaults');
    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.e)) grouped.set(row.e, []);
      grouped.get(row.e).push({ name: row.a != null ? data.AB[row.a][0] : row.i, href: row.a != null ? '#/a/' + row.a : null, changed: !!row.h });
    }
    const actual = await page.value(`[...document.querySelectorAll('${selector} .interaction-row')].map(row=>[row.querySelector('.interaction-effect').textContent,[...row.querySelectorAll('.interaction-who>span')].map(who=>({name:who.querySelector('a')?.textContent||who.firstChild.textContent,href:who.querySelector('a')?.getAttribute('href')||null,changed:!!who.querySelector('.interaction-changed')}))])`);
    assert.deepEqual(actual, [...grouped], 'effect groups, links and changed tags match MI');
    if (side === 't') {
      assert.equal(await page.value(`document.querySelector('${selector} summary .sn').textContent`), `Against it (${rows.length})`);
      await tap(page, selector + ' summary');
      assert.equal(await page.value(`document.querySelector('${selector} details').open`), true);
    }
    await page.assertFits('interactions ' + data.M[index]);
  }
}
const checks = [
  {
    id: 'page', title: 'targets, properties and lists, effects, grouped interactions and method filtering', sizes, modes: MODES,
    run: async page => {
      for (const index of samples) {
        const move = data.MV[index];
        await open(page, index);
        await targetCheck(page, move);
        assert.deepEqual(await page.value(`[...document.querySelectorAll('.move-props a')].map(link=>[link.getAttribute('href'),link.textContent])`),
          props(move).map(prop => ['#/mp/' + prop, labels[prop]]));
        assert.deepEqual(await page.value(`[...document.querySelectorAll('.move-effects li')].map(row=>row.textContent)`),
          (move.se || []).map(([chance, text]) => (chance === 100 && /^[A-Z]/.test(text) ? '' : chance + '% ') + text));
        const filter = await page.value(`(()=>{const line=document.querySelector('#app>.backl'),back=line?.querySelector('.back:not(.fadd)'),add=line?.querySelector('.fadd'),probe=document.createElement('a');probe.className='back';probe.textContent='x';document.body.append(probe);const one=probe.getBoundingClientRect().height;probe.remove();return add?{text:add.textContent,href:add.getAttribute('href'),click:add.getAttribute('onclick'),same:Math.abs(add.getBoundingClientRect().top-back.getBoundingClientRect().top)<2,height:line.getBoundingClientRect().height,one,right:Math.abs(add.getBoundingClientRect().right-line.getBoundingClientRect().right)<1,rest:document.querySelectorAll('#app a[onclick*="st.f"]').length}:null})()`);
        if (true) {
          assert(filter, '+ Filter on the Back line');
          assert.deepEqual([filter.text, filter.href, filter.click, filter.same, filter.right, filter.rest], ['+ Filter', '#/', `st.f=[{k:'mv',v:${index}}];save();`, true, true, 1], 'Back left, + Filter right, the only filter link');
          assert(filter.height <= filter.one + 1, `one line high: ${filter.height} vs ${filter.one}`);
        } else assert.equal(filter, null, 'no filter without Pokémon');
        await interactionsCheck(page, index);
        const groups = expectedGroups(index), count = groups.reduce((total, [, rows]) => total + rows.length, 0);
        assert.deepEqual(await page.value(String.raw`[...document.querySelectorAll('.move-learn [data-method]')].map(button=>[button.dataset.method,+button.textContent.match(/\((\d+)\)/)[1]])`),
          [['all', count], ...groups.map(([method, rows]) => [method, rows.length])]);
        assert.deepEqual(await page.value(`[...document.querySelectorAll('.learn-groups details')].map(group=>group.open)`), groups.map(() => false));
        for (const [method, rows] of groups) {
          await tap(page, `.move-learn [data-method="${method}"]`);
          assert.deepEqual(await page.value(`[...document.querySelectorAll('.learn-groups details')].map(group=>[group.dataset.s,group.open])`), [['ml:' + method, true]]);
          assert.deepEqual(await page.value(`[...document.querySelectorAll('.learn-groups tr td:nth-child(2)>a')].map(link=>link.hash.slice(4))`), rows);
          const style = await page.value(`(()=>{const style=getComputedStyle(document.querySelector('.learn-groups summary'));return [style.position,style.backgroundColor,style.boxShadow]})()`);
          assert.equal(style[0], 'sticky');
          assert.notEqual(style[1], 'rgba(0, 0, 0, 0)');
          assert.notEqual(style[2], 'none', 'paint above the sticky header');
          await page.assertFits(data.M[index] + ' ' + method);
        }
        await tap(page, '.move-learn [data-method="all"]');
        assert.equal(await page.value(`[...document.querySelectorAll('.learn-groups details')].every(group=>!group.open)`), true);
        await page.value(`document.querySelectorAll('.learn-groups details').forEach(group=>group.open=true)`);
        await page.settle();
        await page.assertFits('all learners expanded');
        for (const prop of props(move)) {
          await tap(page, `.move-props a[href="#/mp/${prop}"]`);
          await page.waitFor(`location.hash==='#/mp/${prop}'&&!!document.querySelector('.move-list')`, 'property move list');
          const expected = data.MV.map((entry, moveIndex) => props(entry).includes(prop) ? moveIndex : -1).filter(moveIndex => moveIndex >= 0)
            .sort((first, second) => data.M[first].localeCompare(data.M[second]));
          assert.deepEqual(await page.value(`[...document.querySelectorAll('.move-list a')].map(link=>+link.hash.slice(4))`), expected, 'whole alphabetical property list');
          assert.equal(await page.value(`document.querySelector('.move-list a[href="#/m/${index}"] .nm').textContent`), data.M[index]);
          await page.assertFits('property ' + prop);
          await tap(page, `.move-list a[href="#/m/${index}"]`);
          await page.waitFor(`!!document.querySelector('.move-learn')`, 'move reopened');
          assert.equal(await page.value(`[...document.querySelectorAll('.learn-groups details')].every(group=>!group.open)`), true, 'learner state is not saved');
        }
      }
    },
  },
  {
    id: 'targets', title: 'every target vocabulary value in this guide', sizes: SIZE_SMALL, modes: MODES,
    run: async page => {
      const seen = new Set();
      for (const [index, move] of data.MV.entries()) if (!seen.has(move.tg)) {
        seen.add(move.tg);
        await open(page, index);
        await targetCheck(page, move);
        await page.assertFits('target ' + move.tg);
      }
    },
  },
  {
    id: 'routes', title: 'stable property hash, reopen, rail memory and gone-property fallback', sizes: SIZE_SMALL, modes: MODES,
    run: async page => {
      await page.route('#/mp/contact');
      await page.value('posSave()');
      const saved = await page.value(`JSON.parse(localStorage.getItem(LS.pos))`);
      assert.equal(saved.h, '#/mp/contact');
      assert.equal(saved.n, undefined, 'no move index mapping for a property hash');
      await page.goto('');
      assert.equal(await page.value('location.hash'), '#/mp/contact', 'bare guide reopens the property');
      await tap(page, '#t-i');
      await tap(page, '#t-p');
      assert.equal(await page.value('location.hash'), '#/mp/contact', 'rail remembers property route');
      await page.route('#/mp/not-a-property');
      assert.equal(await page.value('location.hash'), '#/');
      await page.value(`MV.forEach(move=>move.f=(move.f||[]).filter(prop=>prop!=='contact'))`);
      await page.route('#/mp/contact');
      assert.equal(await page.value('location.hash'), '#/', 'gone property falls back to Pokémon list');
    },
  },
];

await runChecks({ name: 'move-page', file, checks });

import assert from 'node:assert/strict';
import { MODES, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424]];
const MI = (data.MI || []).filter(row => row.a != null && data.AB[row.a] && row.m.length);
const abilities = p => new Set([...p.a, p.ha].filter(index => index >= 0));
const users = index => data.P.filter(p => abilities(p).has(index));
const byName = list => [...list].sort((first, second) => data.M[first].localeCompare(data.M[second]));
// An ability with MI records (a well-known one when the guide has it) and one that has users but no record.
const named = ['Iron Fist', 'Technician', 'Sheer Force'].map(name => data.AB.findIndex(ability => ability[0] === name))
  .find(index => index >= 0 && MI.some(row => row.a === index) && users(index).length);
const withRows = named ?? MI.find(row => users(row.a).length).a;
const without = data.AB.findIndex((ability, index) => users(index).length && !MI.some(row => row.a === index));
assert(withRows >= 0 && without >= 0, 'an ability with MI records and one without');
// A Pokémon whose own ability affects a level-up move, with two or more abilities when there is one.
const boosted = p => {
  const own = abilities(p), out = new Map();
  for (const row of MI) if (row.w === 'u' && own.has(row.a)) for (const move of row.m) out.set(move, [...(out.get(move) || []), row]);
  return out;
};
const marked = data.P.map(p => [p, boosted(p)]).filter(([p, map]) => p.lv.some(([, move]) => map.has(move)));
const [mon, monBoosts] = marked.find(([p]) => abilities(p).size > 1 && abilities(p).has(withRows)) ?? marked.find(([p]) => abilities(p).size > 1) ?? marked[0];
assert(mon, 'a Pokémon with a marked level-up move');
const tap = async (page, selector) => {
  await page.value(`dispatchEvent(new Event('wheel'));document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);
  await page.settle();
  await page.tap(selector);
};
const open = async (page, index) => {
  await page.route('#/a/' + index);
  await page.waitFor('!!document.querySelector(".ab-users")', 'ability page');
};
async function movesCheck(page, index) {
  const rows = MI.filter(row => row.a === index);
  assert.equal(await page.value(`!!document.querySelector('.ab-affects')`), !!rows.length, 'Moves it affects only with MI records');
  if (!rows.length) return;
  assert.equal(await page.value(`document.querySelector('.ab-affects details').open`), false, 'collapsed by default');
  assert.equal(await page.value(`document.querySelector('.ab-affects summary .sn').textContent`), `Moves it affects (${new Set(rows.flatMap(row => row.m)).size})`);
  await tap(page, '.ab-affects summary');
  for (const side of ['u', 't']) {
    const effects = new Map();
    for (const row of rows.filter(entry => entry.w === side)) {
      const effect = effects.get(row.e) || { moves: new Set(), changed: false };
      row.m.forEach(move => effect.moves.add(move));
      effect.changed ||= !!row.h;
      effects.set(row.e, effect);
    }
    const selector = `.ab-side[data-side="${side}"]`;
    assert.equal(await page.value(`!!document.querySelector('${selector}')`), !!effects.size);
    if (!effects.size) continue;
    const actual = await page.value(`[...document.querySelectorAll('${selector} .ab-effect')].map(effect=>[effect.firstChild.textContent,!!effect.querySelector('.interaction-changed'),[...effect.nextElementSibling.querySelectorAll('a')].map(link=>+link.hash.slice(4))])`);
    assert.deepEqual(actual, [...effects].map(([effect, entry]) => [effect, entry.changed, byName(entry.moves)]), 'effects, changed tags and moves match MI');
  }
  await page.assertFits('moves it affects ' + data.AB[index][0]);
}
async function usersCheck(page, index) {
  const list = users(index);
  const groups = [['n', list.filter(p => p.a.includes(index))], ['h', list.filter(p => p.ha === index)]].filter(([, rows]) => rows.length);
  assert.deepEqual(await page.value(String.raw`[...document.querySelectorAll('.ab-users [data-method]')].map(button=>[button.dataset.method,+button.textContent.match(/\((\d+)\)/)[1]])`),
    [['all', list.length], ...groups.map(([key, rows]) => [key, rows.length])]);
  assert.deepEqual(await page.value(`[...document.querySelectorAll('.ab-users .learn-groups details')].map(group=>group.open)`), groups.map(() => false), 'collapsed under All');
  for (const [key, rows] of groups) {
    await tap(page, `.ab-users [data-method="${key}"]`);
    assert.deepEqual(await page.value(`[...document.querySelectorAll('.ab-users .learn-groups details')].map(group=>[group.dataset.s,group.open])`), [['au:' + key, true]]);
    assert.deepEqual(await page.value(`[...document.querySelectorAll('.ab-users .learn-groups tr td:nth-child(2)>a')].map(link=>link.hash.slice(4))`), rows.map(p => String(p.id)));
    const style = await page.value(`(()=>{const style=getComputedStyle(document.querySelector('.ab-users .learn-groups summary'));return [style.position,style.backgroundColor,style.boxShadow]})()`);
    assert.equal(style[0], 'sticky');
    assert.notEqual(style[1], 'rgba(0, 0, 0, 0)');
    assert.notEqual(style[2], 'none', 'paint above the sticky header');
    await page.assertFits(data.AB[index][0] + ' ' + key);
  }
  await tap(page, '.ab-users [data-method="all"]');
  assert.equal(await page.value(`[...document.querySelectorAll('.ab-users .learn-groups details')].every(group=>!group.open)`), true);
}
const checks = [
  {
    id: 'page', title: 'filter link in the top card, Moves it affects from MI, Normal / Hidden picker', sizes, modes: MODES,
    run: async page => {
      for (const index of [withRows, without]) {
        await open(page, index);
        const filter = await page.value(`(()=>{const line=document.querySelector('#app>.backl'),back=line?.querySelector('.back:not(.fadd)'),add=line?.querySelector('.fadd'),probe=document.createElement('a');probe.className='back';probe.textContent='x';document.body.append(probe);const one=probe.getBoundingClientRect().height;probe.remove();return add?{text:add.textContent,href:add.getAttribute('href'),click:add.getAttribute('onclick'),same:Math.abs(add.getBoundingClientRect().top-back.getBoundingClientRect().top)<2,height:line.getBoundingClientRect().height,one,right:Math.abs(add.getBoundingClientRect().right-line.getBoundingClientRect().right)<1,rest:document.querySelectorAll('#app a[onclick*="st.f"]').length}:null})()`);
        if (users(index).length) {
          assert(filter, '+ Filter on the Back line');
          assert.deepEqual([filter.text, filter.href, filter.click, filter.same, filter.right, filter.rest], ['+ Filter', '#/', `st.f=[{k:'ab',v:${index}}];save();`, true, true, 1], 'Back left, + Filter right, the only filter link');
          assert(filter.height <= filter.one + 1, `one line high: ${filter.height} vs ${filter.one}`);
        } else assert.equal(filter, null, 'no filter without Pokémon');
        await movesCheck(page, index);
        await usersCheck(page, index);
        await page.assertFits('ability ' + data.AB[index][0]);
      }
    },
  },
  {
    id: 'marks', title: "a move its own ability affects is marked; the tap says which ability and what it does", sizes, modes: MODES,
    run: async page => {
      await page.route('#/p/' + mon.id);
      await page.waitFor('!!document.querySelector("#mvb")', 'Pokémon page');
      await page.value(`document.querySelector('details.psec[data-s="mv"]').open=true`);
      await tap(page, '.psec[data-s="mv"] .sub button[data-k="lv"]');
      const expected = mon.lv.filter(([, move]) => monBoosts.has(move)).map(([, move]) => move);
      assert.deepEqual(await page.value(`[...document.querySelectorAll('#mvb .abm')].map(mark=>+mark.dataset.m)`), expected, 'marks on exactly the affected level-up moves');
      const move = expected[0], rows = monBoosts.get(move);
      await tap(page, `#mvb .abm[data-m="${move}"]`);
      const lines = await page.value(`[...document.querySelector('#mvb tr.abd').querySelectorAll('div')].map(line=>[line.querySelector('a').textContent,line.textContent])`);
      assert.deepEqual(lines.map(([name]) => name), rows.map(row => data.AB[row.a][0]), 'names the ability');
      lines.forEach(([, text], line) => assert(text.includes(': ' + rows[line].e), `says what it does: ${text}`));
      assert.equal(await page.value(`document.querySelector('#mvb .abm[data-m="${move}"]').getAttribute('aria-expanded')`), 'true');
      await page.assertFits('mark open ' + mon.n);
      await tap(page, `#mvb .abm[data-m="${move}"]`);
      assert.equal(await page.value(`!!document.querySelector('#mvb tr.abd')`), false, 'second tap closes');
      for (const tab of ['tm', 'eg']) {
        await tap(page, `.psec[data-s="mv"] .sub button[data-k="${tab}"]`);
        const list = tab === 'tm' ? mon.tm : mon.eg;
        assert.deepEqual(await page.value(`[...document.querySelectorAll('#mvb .abm')].map(mark=>+mark.dataset.m)`), byName(list.filter(entry => monBoosts.has(entry))), tab + ' marks');
        await page.assertFits(tab + ' marks');
      }
    },
  },
];

await runChecks({ name: 'ability-page', file, checks });

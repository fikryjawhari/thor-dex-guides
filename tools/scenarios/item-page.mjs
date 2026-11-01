// The item page #/i/<name> (plans/item-pages.md §1, §2, the tick plumbing of §6; template/README.md → Item page).
//   page   cards present / absent per data (top card, In battle, Where to find, Held by, Moves it affects), the TM page
//          (the move's row only), a Mega Stone (base → Mega, no In battle), a `nu` stone, Not found; fit at every size.
//   ticks  a pickup tick is saved in LS.items g by key, every copy on screen follows, it survives a reload and moves the
//          line to the end; the stop link opens the Walkthrough with that stop's Items open and lands on the row.
//   links  item names link to their page: Items tab rows, walkthrough rows, trainer cards, the Pokémon page's held
//          items and Mega stone, the move page's Affected by and TM line, search results (Page).
import assert from 'node:assert/strict';
import { MODES, SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424]];
const IX = data.IX || {};
const ihref = n => '#/i/' + encodeURIComponent(n).replace(/[!'()*~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const J = JSON.stringify;

// The index the page reads, rebuilt from data.json.
const I = {};
const get = n => (I[n] ??= { n, rows: [], wild: [], tr: 0, mi: [], mega: [] });
for (const sec of data.IT || []) if (sec.k !== 'npc' && sec.n !== 'Move Tutors') for (const r of sec.r) get(r[0]).rows.push({ sec, r });
// Wild holders: forms you can meet in the wild (a base form, or a form with its own P.w; not Castform Sunny).
const BASE = new Set(data.P.filter((p, i) => data.P.findIndex(b => b.dex === p.dex) === i).map(p => p.id));
const wildForm = p => p.g !== 1 && (BASE.has(p.id) || p.w.length > 0);
const NOWILD = data.P.find(p => /^Castform \(/.test(p.n) && (p.hi || []).length && !wildForm(p)) || data.P.find(p => (p.hi || []).length && !wildForm(p));
for (const p of data.P) {
  if (wildForm(p)) for (const h of p.hi || []) { const [n, pct] = Array.isArray(h) ? h : [h, null]; if (n) get(n).wild.push([p, pct]); }
  if (p.g === 1 && p.stone) get(p.stone).mega.push(p);
}
const trainers = data.TR.g.flatMap(g => g.sec.flatMap(s => s.tr));
for (const t of trainers) for (const n of new Set([...t.p, ...(t.pt || []).flatMap(x => x.p || [])].map(m => m.i).filter(Boolean))) get(n).tr++;
for (const r of data.MI || []) if (r.i && r.m.length) get(r.i).mi.push(r);
for (const n of Object.keys(IX)) get(n);
const lines = e => {
  const seen = new Set(), out = [];
  for (const { r } of e.rows) String(r[1]).split('\n').forEach((l, j) => {
    l = l.trim(); const k = (r[5] || [])[j] || 0;
    if (l && !seen.has(k + '|' + l)) { seen.add(k + '|' + l); out.push({ l, k }); }
  });
  return out;
};
const isTM = n => /^(TM|HM|TR)\d/.test(n);
const tmMove = e => (isTM(e.n) ? e.rows.find(x => x.sec.k === 'tm' && x.r[2] != null)?.r[2] ?? null : null);
const all = Object.values(I);
const pick = (names, ok) => names.map(n => I[n]).find(e => e && ok(e)) || all.find(ok);
const plain = pick(['Leftovers', 'Life Orb', 'Sitrus Berry'], e => !isTM(e.n) && !e.mega.length && IX[e.n]?.[1] && lines(e).length);
const tm = all.find(e => tmMove(e) != null && lines(e).length);
const mega = all.find(e => e.mega.length && !e.mega.some(p => p.nu) && e.rows.length);
const nu = all.find(e => e.mega.some(p => p.nu));
const nowildItem = NOWILD && I[(Array.isArray(NOWILD.hi[0]) ? NOWILD.hi[0][0] : NOWILD.hi[0])];
const held = (nowildItem && nowildItem.wild.length ? nowildItem : null) || all.filter(e => e.wild.length && e.tr).sort((a, b) => b.wild.length - a.wild.length)[0] || all.find(e => e.wild.length);
const mi = all.find(e => e.mi.length && !tmMove(e));
const trOnly = all.find(e => !e.rows.length && !e.wild.length && e.tr);
// Ticks: an item with two or more pickups, one with a walkthrough row.
const walkKeys = new Map();
data.WK.splits.forEach((sp, si) => sp.st.forEach((st, ti) => (st.it || []).forEach(i => { if (i[4] && !walkKeys.has(i[4])) walkKeys.set(i[4], [si, ti, st]); })));
const multi = all.find(e => lines(e).filter(x => x.k).length >= 2 && lines(e).some(x => x.k && walkKeys.has(x.k)) && lines(e).some(x => !x.k))
  || all.find(e => lines(e).filter(x => x.k).length >= 2 && lines(e).some(x => x.k && walkKeys.has(x.k)));
console.log('samples: plain, tm, mega, nu, held, mi, trOnly, multi', J([plain, tm, mega, nu, held, mi, trOnly, multi].map(e => e?.n ?? null)));
assert(plain && tm && held && multi, `sample items: ${J([plain?.n, tm?.n, held?.n, multi?.n])}`);

const open = async (page, n) => {
  await page.route(ihref(n));
  await page.waitFor(`document.body.dataset.v==='i'&&!!document.querySelector('#app .back')`, 'item page ' + n);
};
const tap = async (page, selector) => {
  await page.value(`dispatchEvent(new Event('wheel'));document.querySelector(${J(selector)}).scrollIntoView({block:'center'})`);
  await page.settle();
  await page.tap(selector);
};
const cards = page => page.value(`({
  name:document.querySelector('.ipg h2')?.textContent,kind:document.querySelector('.ipg .ikind')?.textContent??null,
  desc:document.querySelector('.ipg>p')?.textContent??null,fx:document.querySelector('.ipg .ifx')?.textContent??null,
  moves:[...document.querySelectorAll('.ipg .move-list a.row')].map(a=>a.hash),mega:[...document.querySelectorAll('.ipg .imega a:not(.sprl)')].map(a=>a.hash),
  where:document.querySelector('.iwhere summary .sn')?.textContent??null,whereOpen:document.querySelector('.iwhere details')?.open??null,
  lines:[...document.querySelectorAll('.iwhere .iline')].map(l=>[l.querySelector('input.itk')?.dataset.pk||0,l.querySelector('input.itk')?.checked||false]),
  held:[...document.querySelectorAll('.it-held [data-method]')].map(b=>[b.dataset.method,+b.textContent.match(/\\((\\d+)\\)/)[1]]),
  affects:document.querySelector('.ab-affects summary .sn')?.textContent??null,affectsOpen:document.querySelector('.ab-affects details')?.open??null,
  tab:document.querySelector('#t-i').classList.contains('on'),text:document.querySelector('#app').innerText})`);

async function pageCheck(page, e) {
  await open(page, e.n);
  const c = await cards(page), x = IX[e.n] || [], move = tmMove(e), ls = lines(e);
  assert.equal(c.name, e.n, 'the name');
  assert.ok(c.tab, 'the Items rail tab is lit');
  const box = e.rows[0];
  const kind = box ? box.sec.n + (box.r[4] && box.r[4] !== box.sec.n && box.r[4] !== e.n ? ' · ' + box.r[4] : '') : e.wild.length ? 'Wild Pokémon hold it' : e.tr ? 'Only trainers hold it' : null;
  assert.equal(c.kind, kind, 'the kind line');
  if (move != null) {
    assert.deepEqual(c.moves, ['#/m/' + move], "a TM page is the move's row");
    assert.equal(c.desc, null, 'no description on a TM page');
    assert.equal(c.fx, null, 'no In battle box on a TM page');
  } else {
    assert.equal(c.desc?.replace(/changed$/, ''), x[0] || null, 'the description');
    assert.equal(c.fx, e.mega.length || !x[1] ? null : 'In battle' + x[1], e.mega.length ? 'no In battle box on a Mega Stone' : 'the In battle box');
  }
  if (e.mega.length) {
    const base = p => data.P.find(b => b.dex === p.dex && b.g !== 1 && !b.fc);
    assert.deepEqual(c.mega, e.mega.flatMap(p => [...(base(p) ? ['#/p/' + base(p).id] : []), '#/p/' + p.id]), 'base → Mega links');
    assert.equal(c.text.includes('Not obtainable in '), e.mega.some(p => p.nu), 'the nu line only for an unobtainable Mega');
  }
  assert.equal(c.where, ls.length ? `Where to find (${ls.length})` : null, 'Where to find (N)');
  if (ls.length) assert.equal(c.whereOpen, true, 'Where to find starts open');
  assert.deepEqual(c.lines.map(([k]) => k), [...ls.filter(l => l.k), ...ls.filter(l => !l.k)].map(l => l.k), 'pickups first (nothing ticked), then the other lines');
  const groups = [['w', e.wild.length], ['t', e.tr]].filter(([, n]) => n);
  assert.deepEqual(c.held.map(([k]) => k), groups.length ? ['all', ...groups.map(([k]) => k)] : [], 'Held by groups present');
  const wild = c.held.find(([k]) => k === 'w');
  if (wild) assert.equal(wild[1], e.wild.length, 'one wild row per species');
  const trn = c.held.find(([k]) => k === 't');
  if (trn) assert.ok(trn[1] >= 1 && trn[1] <= e.tr, 'trainers holding it');
  assert.equal(c.affects, e.mi.length ? `Moves it affects (${new Set(e.mi.flatMap(r => r.m)).size})` : null, 'Moves it affects (N)');
  if (e.mi.length) assert.equal(c.affectsOpen, false, 'Moves it affects starts collapsed');
  if (wild) {
    await tap(page, '.it-held [data-method="w"]');
    const pct = await page.value(`[...document.querySelectorAll('.it-held .learn-groups tr')].map(tr=>[tr.querySelector('td:nth-child(2)>a').hash,tr.querySelector('td.n').textContent])`);
    const want = [...e.wild].sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1) || a[0].n.localeCompare(b[0].n));
    assert.deepEqual(pct.map(([h]) => h).sort(), want.map(([p]) => '#/p/' + p.id).sort(), 'wild rows are the species with it');
    if (NOWILD && e === nowildItem) assert(!pct.some(([h]) => h === '#/p/' + NOWILD.id), 'no wild row for ' + NOWILD.n + ' (no wild encounters)');
    assert.deepEqual(pct.map(([, v]) => v), want.map(([, v]) => (v != null ? v + '%' : '')), 'highest % first');
    await page.assertFits('held by wild ' + e.n);
  }
  await page.assertFits('item ' + e.n);
}

const checks = [
  {
    id: 'page', title: 'cards per data, TM page, Mega Stone, nu stone, Not found; fit', sizes, modes: MODES,
    run: async page => {
      await page.goto('#/');
      for (const e of [plain, tm, mega, nu, held, mi, trOnly, multi].filter(Boolean).filter((e, i, a) => a.indexOf(e) === i)) await pageCheck(page, e);
      await page.route('#/i/' + encodeURIComponent('No Such Item'));
      assert.equal(await page.value(`document.querySelector('#app').innerText.replace(/\\s+/g,' ').trim()`), '‹ Back Not found.', 'Not found');
    },
  },
  {
    id: 'ticks', title: 'ticks saved by key, shared on screen, kept on reload, ordered last; the stop link lands on the row', sizes: SIZE_SMALL, modes: MODES,
    run: async page => {
      await page.goto('#/');
      await page.value(`localStorage.setItem(LS.items,JSON.stringify({o:{},x:{},s:{},g:{'gone-key':1}}))`);
      await page.reload();
      await open(page, multi.n);
      const ls = lines(multi), keys = ls.filter(l => l.k).map(l => l.k), k = keys.find(k => walkKeys.has(k));
      // A second copy of the same tick box (the Items tab card and a walkthrough row do this): it follows the tap.
      await page.value(`document.querySelector('.iwhere .iwl').insertAdjacentHTML('beforeend','<div id="copy">'+tickBox(${J(k)})+'</div>');window.HOOKED=[];TICKHOOK.push((k,on)=>HOOKED.push([k,on]))`);
      await tap(page, `.iwhere .iline input.itk[data-pk="${k}"]`);
      assert.deepEqual(await page.value(`[document.querySelector('#copy input').checked,JSON.parse(localStorage.getItem(LS.items)).g,HOOKED,tickCount()]`),
        [true, { 'gone-key': 1, [k]: 1 }, [[k, true]], 1], 'saved by key (a gone key waits), the copy follows, the hook runs, the count skips the gone key');
      await page.reload();
      await open(page, multi.n);
      const c = await cards(page);
      assert.deepEqual(c.lines.at(-1), [k, true], 'a ticked pickup goes to the end, still ticked after a reload');
      assert.deepEqual(c.lines.slice(0, keys.length - 1).map(([x]) => x), keys.filter(x => x !== k), 'the unticked pickups first');
      // The stop link: Walkthrough, search cleared, the stop and its Items open, the row on screen under the pinned headers.
      await page.value(`q.value='zzz';st.q='zzz'`);
      const [si, ti] = walkKeys.get(k);
      await tap(page, `.iwhere a.iwk[data-pk="${k}"]`);
      await page.waitFor(`location.hash==='#/walk'`, 'the walkthrough');
      await page.value('new Promise(r=>setTimeout(r,800))');
      const at = await page.value(`(()=>{const d=document.querySelector('details.stopd[data-k="${si}.${ti}"]'),row=d&&d.querySelector('tr[data-pk="${k}"]'),r=row&&row.getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect().bottom;
        return {q:st.q,open:!!d&&d.open,items:!!row&&row.closest('details.sec')?.open,top:r?Math.round(r.top):null,bottom:r?Math.round(r.bottom):null,h:Math.round(h),inner:innerHeight,saved:WO.s['${si}.${ti}.i']};})()`);
      assert.equal(at.q, '', 'search cleared');
      assert.ok(at.open && at.items && at.saved === 1, `stop and its Items open: ${J(at)}`);
      assert.ok(at.top != null && at.top >= at.h && at.top < at.inner, `the row lands on screen under the headers: ${J(at)}`);
      await page.value(`tickClear()`);
      assert.deepEqual(await page.value(`JSON.parse(localStorage.getItem(LS.items)).g`), {}, 'tickClear empties g, gone keys too');
    },
  },
  {
    id: 'links', title: 'every place that names an item links to its page', sizes: SIZE_SMALL, modes: ['normal'],
    run: async page => {
      await page.goto('#/');
      const hrefs = sel => page.value(`[...document.querySelectorAll(${J(sel)})].map(a=>a.getAttribute('href'))`);
      // Items tab: open the box of the TM and of a plain item
      for (const e of [tm, plain, mega].filter(Boolean)) {
        const si = data.IT.indexOf(e.rows[0].sec);
        await page.value(`IO.o[D.IT[${si}].n]=1;Object.keys(IO.s).forEach(k=>delete IO.s[k]);(D.IT[${si}].r.map(r=>r[4]).filter(Boolean)).forEach(g=>IO.s[D.IT[${si}].n+'.'+g]=1)`);
        await page.route('#/');
        await page.route('#/items');
        assert.ok((await hrefs(`details.split[data-si="${si}"] .irow .nm a`)).includes(ihref(e.n)), 'Items tab card of ' + e.n);
      }
      // Walkthrough: the multi item's stop row
      const [si, ti] = walkKeys.get(lines(multi).find(l => l.k && walkKeys.has(l.k)).k);
      await page.value(`WO.o[${si}]=1;WO.x['${si}.${ti}']=1;WO.s['${si}.${ti}.i']=1`);
      await page.route('#/walk');
      assert.ok((await hrefs(`details.stopd[data-k="${si}.${ti}"] .itbl.wt a.itl`)).includes(ihref(multi.n)), 'walkthrough row');
      // Trainer card
      const t = trainers.find(t => t.p.some(m => m.i && I[m.i]));
      await page.route('#/tr/' + encodeURIComponent(t.k));
      assert.ok((await hrefs('.ab a.itl')).includes(ihref(t.p.find(m => m.i && I[m.i]).i)), 'trainer card item');
      // Pokémon page: wild held item, Mega stone
      const w = held.wild[0][0];
      await page.route('#/p/' + w.id);
      assert.ok((await hrefs('#app a.itl')).includes(ihref(held.n)), 'Pokémon page held item');
      if (mega) {
        await page.route('#/p/' + mega.mega[0].id);
        assert.ok((await hrefs('#app a.itl')).includes(ihref(mega.n)), 'Mega form stone');
      }
      // Move page: the TM line, Affected by
      await page.route('#/m/' + tmMove(tm));
      assert.ok((await hrefs('#app .card a.itl')).includes(ihref(tm.n)), 'TM line on the move page');
      if (mi) {
        await page.route('#/m/' + mi.mi[0].m[0]);
        assert.ok((await hrefs('.move-affected a.itl')).includes(ihref(mi.n)), 'Affected by item');
      }
      // Search: a Page action on an item result
      const sec = data.IT.indexOf(plain.rows[0].sec), ri = plain.rows[0].sec.r.indexOf(plain.rows[0].r);
      assert.ok((await page.value(`SR.acts({k:'i',si:${sec},ri:${ri}}).map(a=>a[0])`)).includes('Page'), 'search Page action');
      await page.value(`SR.acts({k:'i',si:${sec},ri:${ri}}).find(a=>a[0]==='Page')[1]()`);
      await page.settle();
      assert.equal(await page.value('location.hash'), ihref(plain.n), 'Page opens the item page');
    },
  },
];

await runChecks({ name: 'item-page', file, checks });

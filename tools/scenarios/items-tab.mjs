// The Items tab (template/README.md → Items tab).
//   boxes    box names and counts from the data, in its order; one card per item (no item twice), a nomerge item's
//            card per pickup titled by its place (Unbound's Zygarde Cells), tutor cards under their group headings
//            (Unbound) or the table (no groups); nothing wider than the screen with every box open.
//   ticks    a card's next 3 lines, done/total and fade follow its ticks; ticks are shared with the walkthrough rows
//            and the item page; Clear ticks arms on the first tap, disarms on another tap or leaving the tab, clears
//            on the second; DOM and localStorage after each tap; the tick bar is on screen and not covered.
//   stop     a card line's stop link opens the Walkthrough on that row.
//   search   matching cards under their box names, ticks working.
//   migrate  LS.items open state saved by box index (with a layout) is dropped once; names stay.
import assert from 'node:assert/strict';
import { MODES, SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const IT = data.IT || [];
const J = JSON.stringify;
const ihref = n => '#/i/' + encodeURIComponent(n).replace(/[!'()*~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const isCard = sec => sec.k !== 'npc' && sec.n !== 'Move Tutors';
const grouped = sec => sec.n === 'Move Tutors' && new Set(sec.r.map(r => r[4])).size > 1;
const tutorsOf = rows => new Set(rows.map(r => { const p = String(r[1]).split(' · '); return p[0] + '|' + p.slice(2).join(' · '); })).size;
const nameRows = sec => sec.r.reduce((a, r) => ((a[r[0]] = (a[r[0]] || 0) + 1), a), {});
// nomerge: 2+ rows of a name in a box, each one pickup line; a card per row. Another repeat is one card.
const split = (sec, n) => nameRows(sec)[n] > 1 && sec.r.every(r => r[0] !== n || ((r[5] || []).length === 1 && !!r[5][0]));
const cardCount = (sec, rows) => rows.filter(r => split(sec, r[0])).length + new Set(rows.filter(r => !split(sec, r[0])).map(r => r[0])).size;
// Every line of an item over all its rows (as the item page and a card read them).
const rowsOf = {};
for (const sec of IT) if (isCard(sec)) for (const r of sec.r) (rowsOf[r[0]] ??= []).push(r);
const lines = n => {
  const seen = new Set(), out = [];
  for (const r of rowsOf[n] || []) String(r[1]).split('\n').forEach((l, j) => {
    l = l.trim(); const k = (r[5] || [])[j] || 0;
    if (l && !seen.has(k + '|' + l)) { seen.add(k + '|' + l); out.push({ l, k }); }
  });
  return out;
};
const walkKeys = new Map();
data.WK.splits.forEach((sp, si) => sp.st.forEach((st, ti) => (st.it || []).forEach(i => { if (i[4] && !walkKeys.has(i[4])) walkKeys.set(i[4], [si, ti]); })));
// Sample: a card item with 4+ pickups whose first pickup has a walkthrough row (else the most pickups).
const cands = IT.flatMap((sec, si) => isCard(sec) ? sec.r.map((r, ri) => ({ si, ri, n: r[0], sec, sub: r[4] })).filter(x => nameRows(sec)[x.n] === 1) : []);
for (const sec of IT) if (isCard(sec)) for (const n of Object.keys(nameRows(sec))) if (nameRows(sec)[n] > 1 && !split(sec, n)) console.log(`data: ${n} on ${nameRows(sec)[n]} rows of ${sec.n} (one card)`);
const pkOf = n => lines(n).filter(x => x.k).map(x => x.k);
const multi = cands.find(x => pkOf(x.n).length >= 4 && walkKeys.has(pkOf(x.n)[0]))
  || [...cands].sort((a, b) => pkOf(b.n).length - pkOf(a.n).length)[0];
const walked = cands.find(x => pkOf(x.n).length && walkKeys.has(pkOf(x.n)[0]));
console.log('samples: multi, walked', J([multi?.n, pkOf(multi?.n || '').length, walked?.n]));
assert(multi && pkOf(multi.n).length >= 2, 'an item with two or more pickups');

const tap = async (page, selector) => {
  await page.value(`dispatchEvent(new Event('wheel'));document.querySelector(${J(selector)}).scrollIntoView({block:'center'})`);
  await page.settle();
  await page.tap(selector);
};
// Open boxes / sub-headings (by name) and show the tab.
const openItems = async (page, list) => {
  await page.value(`(()=>{IO.o={};IO.s={};for(const [b,s] of ${J(list)}){IO.o[b]=1;if(s)IO.s[b+'.'+s]=1;}ioSave();})()`);
  await page.route('#/');
  await page.route('#/items');
  await page.waitFor(`document.body.dataset.v==='items'&&!!document.querySelector('#app details.split')`, 'the Items tab');
};
const cardSel = x => `details.split[data-si="${x.si}"] .irow[data-n=${J(x.n)}]`;
const card = (page, x) => page.value(`(()=>{const c=document.querySelector(${J(cardSel(x))});if(!c)return null;return {
  keys:[...c.querySelectorAll('.iline')].map(l=>l.querySelector('input.itk')?.dataset.pk||0),checked:[...c.querySelectorAll('input.itk')].map(i=>i.checked),
  prog:c.querySelector('.iprog')?.textContent??null,more:c.querySelector('.imore')?.textContent??null,done:c.classList.contains('idone'),
  name:c.querySelector('.nm a')?.getAttribute('href')};})()`);
const saved = page => page.value(`JSON.parse(localStorage.getItem(LS.items)||'{}')`);
const bar = page => page.value(`(()=>{const b=document.querySelector('.itbar');return b&&{t:b.querySelector('.mut').textContent,btn:b.querySelector('.itclr')?.textContent??null};})()`);
// The card's expected first lines: unticked pickups, other lines, ticked pickups.
const order = (n, g) => { const ls = lines(n); return [...ls.filter(x => x.k && !g[x.k]), ...ls.filter(x => !x.k), ...ls.filter(x => x.k && g[x.k])].map(x => x.k); };

const checks = [
  {
    id: 'boxes', title: 'box names / counts from data, one card per item, nomerge split, tutor groups; fit with every box open', sizes: SIZE_SMALL, modes: MODES,
    run: async page => {
      await page.goto('#/');
      await openItems(page, IT.flatMap(sec => [...new Set(sec.r.map(r => r[4] || ''))].map(s => [sec.n, s])));
      const got = await page.value(`[...document.querySelectorAll('#app>details.split')].map(d=>({n:d.querySelector(':scope>summary').firstChild.textContent.trim(),c:d.querySelector(':scope>summary .mut').textContent,
        subs:[...d.querySelectorAll('details.sec>summary')].map(s=>[s.querySelector('.sn').textContent,s.querySelector('.mut').textContent]),
        cards:[...d.querySelectorAll('.irow[data-n]')].map(c=>[c.dataset.n,c.querySelector('.nm a').textContent]),tut:d.querySelectorAll('.irow.tut').length,rows:d.querySelectorAll('table.itbl tr').length}))`);
      assert.deepEqual(got.map(b => b.n), IT.map(s => s.n), 'the boxes are the data\'s kinds, in order');
      const seen = new Map();
      IT.forEach((sec, i) => {
        const b = got[i], nr = nameRows(sec);
        const want = sec.n === 'Move Tutors' ? tutorsOf(sec.r) + ' tutors' : isCard(sec) ? String(Object.keys(nr).length) : String(sec.r.length);
        assert.equal(b.c, want, `${sec.n}: box count`);
        const subs = [...new Set(sec.r.map(r => r[4]).filter(Boolean))];
        assert.deepEqual(b.subs.map(([s]) => s), subs, `${sec.n}: sub-headings`);
        if (isCard(sec)) {
          assert.equal(b.cards.length, cardCount(sec, sec.r), `${sec.n}: a card per item (per pickup for nomerge)`);
          for (const [n, title] of b.cards) {
            if (split(sec, n)) { assert.notEqual(title, n, `${sec.n}: a ${n} card is titled by its place`); continue; }
            assert.equal(title, n, `${sec.n}: card title`);
            assert.ok(!seen.has(n), `${n} twice (${seen.get(n)} and ${sec.n})`); seen.set(n, sec.n);
          }
          b.subs.forEach(([s, c]) => assert.equal(c, String(cardCount(sec, sec.r.filter(r => r[4] === s))), `${sec.n} · ${s}: count`));
        } else if (grouped(sec)) {
          assert.equal(b.tut, tutorsOf(sec.r), 'a card per tutor');
          b.subs.forEach(([s, c]) => assert.equal(c, tutorsOf(sec.r.filter(r => r[4] === s)) + ' tutors', `tutors · ${s}: count`));
        } else assert.equal(b.rows, sec.r.length, `${sec.n}: the table`);
      });
      if (IT.some(s => s.r.some(r => r[0] === 'Zygarde Cell'))) {
        const ki = IT.findIndex(s => s.r.some(r => r[0] === 'Zygarde Cell')), z = IT[ki].r.filter(r => r[0] === 'Zygarde Cell').length;
        assert.ok(z > 1 && got[ki].subs.some(([s, c]) => s === 'Zygarde Cells' && c === String(z)), `Zygarde Cells (${z})`);
        const t = got[IT.findIndex(s => s.n === 'Move Tutors')];
        assert.deepEqual(t.subs.map(([s]) => s), ['Shard tutors', 'Gem Family', 'Special moves', 'Battle Frontier tutors'], 'Unbound tutor groups');
      }
    },
  },
  {
    id: 'ticks', title: 'card order / count / fade, shared with walk rows and the item page, Clear ticks two taps; bar not covered', sizes: SIZE_SMALL,
    run: async page => {
      await page.goto('#/');
      await page.value(`localStorage.setItem(LS.items,JSON.stringify({o:{},x:{},s:{},g:{'gone-key':1}}))`);
      await page.reload();
      const x = multi, ks = pkOf(x.n), all = lines(x.n);
      await openItems(page, [[x.sec.n, x.sub]]);
      let c = await card(page, x);
      assert.deepEqual(c.keys, order(x.n, {}).slice(0, 3), 'the first 3 lines, pickups first');
      assert.equal(c.prog, `0/${ks.length}`, 'done/total');
      assert.equal(c.more, all.length > 3 ? `+${all.length - 3} more` : null, '+N more');
      assert.equal(c.name, ihref(x.n), 'the name opens the item page');
      assert.deepEqual(await bar(page), { t: '0 ticked', btn: null }, 'no Clear ticks at 0 (the gone key not counted)');
      // The bar is on screen at the top, nothing over it.
      await page.value(`scrollTo(0,0)`);
      const cov = await page.value(`(()=>{const b=document.querySelector('.itbar'),r=b.getBoundingClientRect(),e=document.elementFromPoint(r.left+10,r.top+r.height/2);return {in:r.top>=0&&r.bottom<=innerHeight,own:b.contains(e)};})()`);
      assert.deepEqual(cov, { in: true, own: true }, 'the tick bar is on screen and not covered');
      // Tick the first line on the card: saved, the card redraws with it moved back.
      await tap(page, `${cardSel(x)} input.itk[data-pk="${ks[0]}"]`);
      let g = (await saved(page)).g;
      assert.deepEqual(g, { 'gone-key': 1, [ks[0]]: 1 }, 'saved by key');
      c = await card(page, x);
      assert.deepEqual(c.keys, order(x.n, g).slice(0, 3), 'the next lines move up');
      assert.equal(c.prog, `1/${ks.length}`, 'done/total follows');
      assert.equal(c.done, false, 'not faded with pickups left');
      assert.deepEqual(await bar(page), { t: '1 ticked', btn: 'Clear ticks' }, 'the bar counts it');
      // Every pickup ticked: faded.
      await page.value(`${J(ks.slice(1))}.forEach(k=>tickSet(k,true))`);
      c = await card(page, x);
      assert.deepEqual([c.prog, c.done], [`${ks.length}/${ks.length}`, true], 'all ticked: N/N and faded');
      // Shared with the walkthrough row and the item page.
      const wk = ks.find(k => walkKeys.has(k));
      if (wk) {
        const [si, ti] = walkKeys.get(wk);
        await page.value(`WO.o[${si}]=1;WO.x['${si}.${ti}']=1;WO.s['${si}.${ti}.i']=1;woSave()`);
        await page.route('#/walk');
        const row = `details.stopd[data-k="${si}.${ti}"] tr[data-pk="${wk}"] input.itk`;
        assert.equal(await page.value(`document.querySelector(${J(row)})?.checked`), true, 'the walk row shows the tick');
        const tags = () => page.value(`[...document.querySelectorAll('details.stopd[data-k="${si}.${ti}"] .tag')].map(t=>t.textContent)`);
        const before = await tags();
        await tap(page, row);
        g = (await saved(page)).g;
        assert.equal(g[wk], undefined, 'unticked from the walk row');
        await page.route(ihref(x.n));
        await page.waitFor(`document.body.dataset.v==='i'`, 'item page');
        assert.equal(await page.value(`document.querySelector('.iwhere input.itk[data-pk="${wk}"]').checked`), false, 'the item page follows');
        await tap(page, `.iwhere input.itk[data-pk="${wk}"]`);
        assert.equal((await saved(page)).g[wk], 1, 'ticked on the item page');
        await page.route('#/walk');
        assert.equal(await page.value(`document.querySelector(${J(row)}).checked`), true, 'the walk row follows');
        assert.deepEqual(await tags(), before, 'stop counts stay checklist-only');
        await page.route('#/items');
        assert.equal((await card(page, x)).done, true, 'the card follows');
      }
      // Clear ticks: arm, disarm by another tap, disarm by leaving, then clear.
      const n = ks.length;
      await tap(page, '.itclr');
      assert.deepEqual(await bar(page), { t: `${n} ticked`, btn: `Tap again to clear ${n}` }, 'the first tap arms');
      assert.equal(Object.keys((await saved(page)).g).length, n + 1, 'nothing cleared yet');
      await tap(page, '.itbar .mut');
      assert.equal((await bar(page)).btn, 'Clear ticks', 'another tap disarms');
      await tap(page, '.itclr');
      await page.route('#/');
      await page.route('#/items');
      assert.equal((await bar(page)).btn, 'Clear ticks', 'leaving the tab disarms');
      await tap(page, '.itclr');
      await tap(page, '.itclr');
      assert.deepEqual((await saved(page)).g, {}, 'the second tap clears every tick');
      assert.deepEqual(await bar(page), { t: '0 ticked', btn: null }, 'the bar redraws');
      c = await card(page, x);
      assert.deepEqual([c.prog, c.done, c.keys], [`0/${n}`, false, order(x.n, {}).slice(0, 3)], 'the card redraws');
    },
  },
  {
    id: 'stop', title: "a card line's stop link lands on the walkthrough row", sizes: SIZE_SMALL, skip: !walked,
    run: async page => {
      await page.goto('#/');
      const x = walked, k = pkOf(x.n)[0], [si, ti] = walkKeys.get(k);
      await openItems(page, [[x.sec.n, x.sub]]);
      await tap(page, `${cardSel(x)} a.iwk[data-pk="${k}"]`);
      await page.waitFor(`location.hash==='#/walk'`, 'the walkthrough');
      await page.value('new Promise(r=>setTimeout(r,800))');
      const at = await page.value(`(()=>{const d=document.querySelector('details.stopd[data-k="${si}.${ti}"]'),row=d&&d.querySelector('tr[data-pk="${k}"]'),r=row&&row.getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect().bottom;
        return {open:!!d&&d.open,items:!!row&&row.closest('details.sec')?.open,top:r?Math.round(r.top):null,h:Math.round(h),inner:innerHeight};})()`);
      assert.ok(at.open && at.items && at.top != null && at.top >= at.h && at.top < at.inner, `the row on screen under the headers: ${J(at)}`);
    },
  },
  {
    id: 'search', title: 'search: matching cards under their box names, ticks working', sizes: SIZE_SMALL, modes: ['normal'],
    run: async page => {
      await page.goto('#/');
      await page.route('#/items');
      const x = multi, k = pkOf(x.n)[0];
      await page.value(`q.value=${J(x.n)};st.q=${J(x.n.toLowerCase())};listItems()`);
      const got = await page.value(`({h:[...document.querySelectorAll('#app .sech')].map(e=>e.textContent),n:[...document.querySelectorAll('#app .irow[data-n]')].map(c=>c.dataset.n)})`);
      assert.ok(got.h.includes(x.sec.n), `under its box name: ${J(got.h)}`);
      assert.ok(got.n.includes(x.n), 'its card');
      assert.ok(got.n.every(n => n.toLowerCase().includes(x.n.toLowerCase()) || lines(n).some(l => l.l.toLowerCase().includes(x.n.toLowerCase())) || IT.some(s => s.r.some(r => r[0] === n && String(r[1]).toLowerCase().includes(x.n.toLowerCase())))), 'only matches');
      await tap(page, `.irow[data-n=${J(x.n)}] input.itk[data-pk="${k}"]`);
      assert.equal((await saved(page)).g[k], 1, 'a tick in the results is saved');
      assert.equal(await page.value(`document.querySelector('.irow[data-n=${J(x.n).replace(/'/g, "\\'")}] .iprog')?.textContent`), `1/${pkOf(x.n).length}`, 'and its card follows');
      await page.value(`tickClear();q.value='';st.q=''`);
    },
  },
  {
    id: 'migrate', title: 'open state saved by box index is dropped once; by name it stays', sizes: SIZE_SMALL, modes: ['normal'],
    run: async page => {
      await page.goto('#/');
      const b = IT[1] || IT[0], s = b.r[0][4];
      await page.value(`localStorage.setItem(LS.items,JSON.stringify({o:{0:1,2:1,[${J(b.n)}]:1},x:{1:0},s:{'0.Berries':1,'3.TMs':1,[${J(b.n + '.' + s)}]:1},layout:[['Shops',[]]],g:{p0:1}}))`);
      await page.reload();
      const want = { o: { [b.n]: 1 }, x: {}, s: { [b.n + '.' + s]: 1 }, g: { p0: 1 } };
      assert.deepEqual(await saved(page), want, 'index entries and the layout dropped and saved; names and ticks kept');
      await page.route('#/items');
      assert.deepEqual(await page.value(`[...document.querySelectorAll('#app>details.split[open]')].map(d=>+d.dataset.si)`), [IT.indexOf(b)], 'only the box saved by name is open');
      await page.reload();
      assert.deepEqual(await saved(page), want, 'once: nothing more changes');
    },
  },
];

await runChecks({ name: 'items-tab', file, checks: checks.filter(c => !c.skip) });

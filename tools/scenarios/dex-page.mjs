// Pokémon page (template/README.md → Pokémon page): collapsible sections with one saved open state for every Pokémon and
// Reset all, the name bar, ‹ › through the list as it stands, the forms menu, switching Pokémon that keeps your place,
// the family in Evolution, and the fit at the viewer sizes (every section open, every move tab, the widest names).
// Runs on every guide: node tools/scenarios/dex-page.mjs dist/<hack>.html
import assert from 'node:assert/strict';
import { MODES, SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const P = data.P, byId = Object.fromEntries(P.map(p => [p.id, p]));
const forms = p => P.filter(x => p.dex && x.dex === p.dex);
// F: a Pokémon with forms that evolves from E by level (Charizard and Charmeleon where the guide has them), and whose
// next Pokémon in dex order is one of its forms.
const levelFrom = p => p.ef.find(([how, id]) => /^level \d/i.test(how) && byId[id]);
const next = p => P[P.indexOf(p) + 1];
const cands = P.filter(p => p.g === 0 && forms(p).length > 1 && levelFrom(p) && next(p) && next(p).dex === p.dex && p.lv.length >= 8);
const F = cands.find(p => p.n === 'Charizard') || cands[0];
assert(F, 'a Pokémon with forms that evolves by level');
const E = byId[levelFrom(F)[1]], FORM = next(F);
const ONE = P.find(p => p.g === 0 && forms(p).length === 1 && p.lv.length >= 4);
const TYPE = F.t[0];
const LISTED = P.filter(p => p.t.includes(TYPE));
const OUTSIDE = P.find((p, i) => !p.t.includes(TYPE) && P.slice(i + 1).some(x => x.t.includes(TYPE)) && P.slice(0, i).some(x => x.t.includes(TYPE)));
const SIZES = [[260, 316], [260, 350], [480, 392], [537, 424], [832, 424]];
const DEF = { ab: true, bs: true, sc: false, td: false, wh: false, ev: true, tr: false, mv: true };

// Scripted scrolls send a wheel first: a press, wheel or key ends hold() (template), as a finger on the screen does.
// The bar slides (120 ms): wait it out before reading or tapping what it may cover.
const slid = page => page.value('new Promise(d=>setTimeout(d,180))');
// Tap a page control: scrolled to the middle of the window first (the tap helper's nearest scroll would put it under the bar).
const tapIn = async (page, sel, opts) => { await page.value(`dispatchEvent(new Event('wheel'));document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center'})`); await slid(page); await page.tap(sel, opts); };
const open = async (page, id) => { await page.route(`#/p/${id}`); await page.waitFor(`!!document.querySelector('.hero')`, 'the Pokémon page'); };
const states = page => page.value(`Object.fromEntries([...document.querySelectorAll('details.psec')].map(d=>[d.dataset.s,d.open]))`);
const saved = page => page.value(`(JSON.parse(localStorage.getItem(LS.dex)||'{}').o)??null`);
// The first keyed row under the bar, and where it sits.
const ANCHOR = `(()=>{const line=document.getElementById('pbar').classList.contains('off')?0:document.getElementById('pbar').offsetHeight;
  const r=[...document.querySelectorAll('#app [data-pk]')].filter(e=>e.getClientRects().length).find(e=>e.getBoundingClientRect().top>=line-1);
  return r?{k:r.dataset.pk,top:Math.round(r.getBoundingClientRect().top)}:null})()`;
const topOf = k => `(()=>{const r=[...document.querySelectorAll('#app [data-pk]')].find(e=>e.dataset.pk===${JSON.stringify(k)}&&e.getClientRects().length);return r?Math.round(r.getBoundingClientRect().top):null})()`;
const expandAll = page => page.value(`document.querySelector('.seg.all [data-a="1"]').click()`).then(() => page.settle());
// Scroll so the n-th keyed row of a section sits a little under the bar.
const scrollTo = (page, sel, n) => page.value(`(()=>{dispatchEvent(new Event('wheel'));const r=document.querySelectorAll(${JSON.stringify(sel)})[${n}];scrollTo(0,r.getBoundingClientRect().top+scrollY-90)})()`).then(() => slid(page));
const keepCheck = async (page, act, what) => {
  const before = await page.value(ANCHOR);
  assert(before, `${what}: a keyed row on screen`);
  const len = await page.value('history.length');
  await act();
  await page.settle();
  const after = await page.value(topOf(before.k));
  if (after != null) assert(Math.abs(after - before.top) <= 2, `${what}: ${before.k} at ${before.top} before, ${after} after`);
  else {
    const now = await page.value(ANCHOR);
    assert(now && Math.abs(now.top - before.top) <= 40, `${what}: ${before.k} is gone and the nearest row (${now && now.k}) is not near ${before.top}`);
  }
  return { before, after, len };
};

const checks = [
  {
    id: 'sections',
    title: 'defaults, one open state for every Pokémon (saved by name, kept on reload), Collapse all → Reset all → defaults',
    sizes: [[260, 316], [480, 392]],
    run: async page => {
      await open(page, F.id);
      const s0 = await states(page);
      for (const k in s0) assert.equal(s0[k], DEF[k], `${k} default ${DEF[k] ? 'open' : 'closed'}`);
      assert.equal(await saved(page), null, 'nothing saved at first');
      await tapIn(page, 'details.psec[data-s=td]>summary');
      await tapIn(page, 'details.psec[data-s=ab]>summary');
      assert.deepEqual(await saved(page), { td: 1, ab: 0 }, 'saved by section name, only what differs from the default');
      await open(page, E.id);
      const s1 = await states(page);
      assert.equal(s1.td, true, 'Type defences open on the next Pokémon');
      assert.equal(s1.ab, false, 'Abilities closed on the next Pokémon');
      await page.reload();
      const s2 = await states(page);
      assert.equal(s2.td && !s2.ab, true, 'kept on reload');
      await tapIn(page, '.seg.all [data-a="0"]');
      assert.equal(await page.text('.seg.all [data-a="0"]'), 'Reset all', 'Collapse all reads Reset all once every section is closed');
      assert.equal(Object.values(await states(page)).every(o => !o), true, 'all closed');
      await tapIn(page, '.seg.all [data-a="0"]');
      const s3 = await states(page);
      for (const k in s3) assert.equal(s3[k], DEF[k], `${k} back to its default`);
      assert.equal(await saved(page), null, 'saved open state cleared');
      await tapIn(page, '.seg.all [data-a="1"]');
      assert.equal(Object.values(await states(page)).every(o => o), true, 'Expand all opens all');
      // old or unknown saved names: ignored, a missing one takes its default
      await page.value(`localStorage.setItem(LS.dex,JSON.stringify({f:[],sort:'dex',av:'all',o:{zz:1,sc:1}}))`);
      await page.reload();
      await open(page, F.id);
      const s4 = await states(page);
      assert.equal(s4.sc && s4.ab && !s4.td, true, 'a known saved name applies, an unknown one is ignored');
    },
  },
  {
    id: 'bar',
    title: 'the name bar is out at the top, in past the top card; ↑ goes to the top',
    sizes: SIZE_SMALL,
    run: async page => {
      await open(page, F.id);
      assert.equal(await page.value(`document.getElementById('pbar').classList.contains('off')`), true, 'out at the top');
      await page.value(`dispatchEvent(new Event('wheel'));scrollTo(0,400)`);
      await slid(page);
      assert.equal(await page.value(`document.getElementById('pbar').classList.contains('off')`), false, 'in after the top card');
      assert.equal(await page.text('#pbar .nm'), F.n + ' ▾', 'name with the forms mark');
      await page.tap('#pbar .up');
      assert.equal(await page.value('scrollY'), 0, '↑: top of the page');
      await page.route('#/');
      assert.equal(await page.value(`document.getElementById('pbar').hidden`), true, 'not on the list');
    },
  },
  {
    id: 'order',
    title: '‹ › step through the list as it is filtered; from a page outside it, the nearest listed; ends disabled; history replaced',
    sizes: SIZE_SMALL,
    run: async page => {
      await page.value(`st.f=[{k:'type',v:${JSON.stringify(TYPE)}}];save()`);
      await open(page, LISTED[0].id);
      assert.equal(await page.count('.pnav .gap'), 1, 'the first listed: no previous link');
      assert.equal(await page.value(`document.querySelector('#pbar .ar[data-d="-1"]').disabled`), true, '‹ disabled at the start');
      const len = await page.value('history.length');
      for (const want of LISTED.slice(1, 4)) {
        await page.value(`dispatchEvent(new Event('wheel'));scrollTo(0,400)`);
        await slid(page);
        await page.tap('#pbar .ar[data-d="1"]');
        assert.equal(await page.value('location.hash'), '#/p/' + want.id, `› goes to ${want.n}`);
      }
      assert.equal(await page.value('history.length'), len, 'the arrows replace the history entry');
      await tapIn(page, '.pnav a.pv');
      assert.equal(await page.value('location.hash'), '#/p/' + LISTED[2].id, 'the top link ‹ goes back one');
      await open(page, OUTSIDE.id);
      const i = P.indexOf(OUTSIDE);
      const nx = P.slice(i + 1).find(p => p.t.includes(TYPE)), pv = P.slice(0, i).reverse().find(p => p.t.includes(TYPE));
      assert.equal(await page.value(`document.querySelector('.pnav a.nx').getAttribute('href')`), '#/p/' + nx.id, 'outside the list: › is the nearest listed after');
      assert.equal(await page.value(`document.querySelector('.pnav a.pv').getAttribute('href')`), '#/p/' + pv.id, 'outside the list: ‹ the nearest listed before');
      await open(page, LISTED.at(-1).id);
      assert.equal(await page.value(`document.querySelector('#pbar .ar[data-d="1"]').disabled`), true, '› disabled at the end');
      await page.value(`st.f=[];save()`);
      await open(page, F.id);
      assert.equal(await page.value(`document.querySelector('.pnav a.nx').getAttribute('href')`), '#/p/' + FORM.id, 'no filter: dex order, the forms after their Pokémon');
      assert.match(await page.text('.pnav a.nx .r'), new RegExp(FORM.g === 1 ? 'Mega' : 'Form'), 'relation: Mega / Form');
      await open(page, E.id);
      assert.match(await page.text('.pnav a.nx .r'), /Lv \d+/, 'relation: the evolution level');
    },
  },
  {
    id: 'keep-place',
    title: 'switching Pokémon (› to a form, ‹ › along the family, the forms menu, an Evolution row) keeps the row under the bar in place',
    sizes: SIZES,
    run: async page => {
      await open(page, F.id);
      await expandAll(page);
      await scrollTo(page, '#mvb tr[data-pk]', 6);
      await keepCheck(page, () => page.tap('#pbar .ar[data-d="1"]'), `${F.n} → ${FORM.n} (moves)`);
      assert.equal(await page.value('location.hash'), '#/p/' + FORM.id, `on ${FORM.n}`);
      await open(page, E.id);
      await scrollTo(page, '#mvb tr[data-pk]', 4);
      const { before } = await keepCheck(page, () => page.tap('#pbar .ar[data-d="1"]'), `${E.n} → ${F.n} (moves)`);
      assert.match(before.k, /^mv:/, 'the anchor is a move row');
      // Base stats, through the forms menu: the menu lists every form, picking one replaces the history entry
      await open(page, F.id);
      await scrollTo(page, 'details.psec[data-s=bs] [data-pk]', 2);
      const len = await page.value('history.length');
      await page.tap('#pbar .who');
      assert.equal(await page.count('.fmenu button'), forms(F).length, 'the menu lists every form');
      assert.equal(await page.count('.fmenu button.on'), 1, 'the current form highlighted');
      await keepCheck(page, () => page.tap('.fmenu button:not(.on)'), 'forms menu (base stats)');
      assert.equal(await page.value('history.length'), len, 'the forms menu replaces the history entry');
      // an Evolution row adds an entry
      await open(page, F.id);
      await page.value(`dispatchEvent(new Event('wheel'));document.querySelector('details.psec[data-s=ev]').scrollIntoView()`);
      await page.value('scrollBy(0,-60)');
      await slid(page);
      const len2 = await page.value('history.length');
      await keepCheck(page, () => page.tap(`.fam a.fr[href="#/p/${E.id}"]`), 'Evolution row');
      assert.equal(await page.value('history.length'), len2 + 1, 'an Evolution row adds a history entry');
      // at the very top: stays at the top
      await page.value(`dispatchEvent(new Event('wheel'));scrollTo(0,0)`);
      await slid(page);
      await page.tap('.pnav a.nx');
      assert.equal(await page.value('scrollY'), 0, 'from the top: the top');
    },
  },
  {
    id: 'forms-family',
    title: 'the top card opens the forms menu (one form: no menu); Evolution lists the whole family, the current row not a link',
    sizes: SIZE_SMALL,
    run: async page => {
      await open(page, F.id);
      assert.match(await page.text('.hero .hm'), new RegExp(`${forms(F).length} forms ▾`), 'forms count in the top card');
      await page.tapAt('.hero', [8, 8]);
      assert.equal(await page.count('.fmenu button'), forms(F).length, 'tapping the top card opens the menu');
      await page.tapAt('.fmask', [2, 300]);
      assert.equal(await page.count('.fmenu'), 0, 'a tap outside closes it');
      await tapIn(page, 'details.psec[data-s=ev]>summary');
      const fam = await page.value(`[...document.querySelectorAll('.fam .fr')].map(r=>r.dataset.pk)`);
      for (const p of [E, F, ...forms(F)]) assert(fam.includes('ev:' + p.id), `${p.n} in the family`);
      assert.equal(await page.count('.fam .fr.cur'), 1, 'one current row');
      assert.equal(await page.value(`document.querySelector('.fam .fr.cur').tagName`), 'DIV', 'the current row is not a link');
      await open(page, ONE.id);
      assert.equal(await page.count('.hero.hasf'), 0, 'one form: no menu');
      await page.tapAt('.hero', [8, 8]);
      assert.equal(await page.count('.fmenu'), 0, 'one form: tapping does nothing');
    },
  },
  {
    id: 'fit',
    title: 'no sideways scroll with every section open and every move tab; the widest names never break inside a word',
    sizes: SIZES,
    run: async page => {
      for (const id of [F.id, E.id, ONE.id]) {
        await open(page, id);
        await expandAll(page);
        for (let t = 0; t < await page.count('.sub button'); t++) {
          await page.value(`document.querySelectorAll('.sub button')[${t}].click()`);
          const over = await page.value(`(()=>{const m=document.querySelector('#mvb'),t=m.querySelector('table');return t&&t.scrollWidth>m.clientWidth+1?t.scrollWidth+'/'+m.clientWidth:null})()`);
          assert.equal(over, null, `${byId[id].n} moves tab ${t} fits`);
          await page.assertFits(`${byId[id].n} tab ${t}`);
        }
        const wide = await page.value(`[...document.querySelectorAll('#app *')].filter(e=>e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX==='auto').map(e=>e.id||e.className)`);
        assert.deepEqual(wide, [], `${byId[id].n}: no sideways scrollers`);
      }
      // the widest name words in the top card, the bar and the top links
      const bad = await page.value(`(()=>{const f=byId[${JSON.stringify(F.id)}],e=byId[${JSON.stringify(E.id)}],n0=f.name,e0=e.name,bad=[];
        for(const n of ['Crabominable','Brambleghast','Squawkabilly','Basculin (Blue-Striped)','Ogerpon (Hearthflame)']){f.name=n;e.name=n;detail(f.id);pbState();
         for(const x of [document.querySelector('.hero h2'),document.querySelector('#pbar .nm'),...document.querySelectorAll('.pnav a .t b')])if(x.scrollWidth>x.clientWidth+1)bad.push(n+' in '+(x.closest('#pbar')?'bar':x.closest('.pnav')?'top link':'top card'));}
        f.name=n0;e.name=e0;detail(f.id);return bad})()`);
      assert.deepEqual(bad, [], 'widest words fit');
    },
  },
];

await runChecks({ name: 'dex-page', file, checks: checks.map(c => ({ modes: MODES, ...c })) });

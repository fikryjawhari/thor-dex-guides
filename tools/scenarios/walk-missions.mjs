// Walkthrough missions (template/README.md → What the data switches on: missions): a stop.s entry that is an object is
// a bordered card in the stop's checklist, closed by default, with its own steps, saved by mission slug and step key.
// Skips on guides with no missions. Checks (plans/unbound-missions.md → Checks):
//   m1 card: open / close from the header (saved), tick / untick (mission, checklist and split counts), the tick that
//      completes a mission closes it (header focused, under the pinned headers), reopened it stays open, untick; reload
//      keeps it all; 44 px header and rows; every viewer size, normal and dvkb.
//   m2 next: Next step opens split, stop, checklist and mission to land on a mission step (no tick, the same target
//      again), leaves a finished mission for the next ordinary step, finds a stop with only missions, and the mission
//      steps when every ordinary step is done; all done is harmless.
//   m3 search: a step hit and a name hit open the closed chain, land under the pinned headers and flash; one row per
//      mission for a name hit; no results changes nothing; the search-this-page action filters to the stop with the
//      mission open.
//   m4 reset: cancel keeps everything; confirm clears ordinary and mission ticks (orphans too), keeps open states and
//      the tracker.
//   m5 update: a renamed mission keeps its state, a removed step / mission keeps its record unused, a new step starts
//      unticked, a moved mission keeps its ticks, an ordinary tick after an inserted mission keeps its step; putting the
//      keys back brings the ticks back. Old saves with no missions map load unchanged.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, MODES, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { html, match, data } = readGuide(file);
const name = file.split(/[\\/]/).pop().replace(/\.html$/, '');
const SIZES = [[260, 316], [260, 350], [480, 392], [537, 424], [832, 424]];
const stops = data.WK.splits.flatMap((sp, si) => sp.st.map((st, ti) => ({ st, si, ti })));
const isM = x => x && !Array.isArray(x) && typeof x === 'object';
// A stop with ordinary steps and at least two missions; a stop with only missions.
const MIXED = stops.find(({ st }) => (st.s || []).some(Array.isArray) && (st.s || []).filter(isM).length >= 2);
const ONLY = stops.find(({ st }) => (st.s || []).length && st.s.every(isM));
const skip = MIXED && ONLY ? null : 'no walkthrough missions';
const M1 = MIXED && MIXED.st.s.filter(isM)[0], M2 = MIXED && MIXED.st.s.filter(isM)[1];
const MK = MIXED && MIXED.si + '.' + MIXED.ti;

const q = s => JSON.stringify(s);
const card = m => `details.wmis[data-m=${q(m)}]`;
// A header tap holds its header in place for 450 ms (flip): wait it out, as a finger would, before the next tap.
const tapHeader = async (page, sel) => { await page.tap(sel + '>summary'); await page.value('new Promise(r=>setTimeout(r,500))'); };
const walk = async page => { await page.route('#/walk'); await page.settle(); };
// Saved state, set through the guide's own code: ticks = leaf ids ('o:si.ti.j' or 'm:slug:key'), open = slugs.
const LEAVES = `D.WK.splits.flatMap((sp,si)=>sp.st.flatMap((s,ti)=>stopLeaves(s,si,ti))).map(l=>({l,id:l.m?'m:'+l.m.m+':'+l.c.k:'o:'+l.si+'.'+l.ti+'.'+l.j}))`;
const seed = (page, { until = null, all = false, ticks = [], open = [], closed = [], extra = '' } = {}) => page.value(`(()=>{
  WO.c={};WO.missions={};WO.o={};WO.x={};WO.s={};const L=${LEAVES},tick=({l})=>{if(l.m)misSet(l.m.m,r=>{r.c[l.c.k]=1;});else WO.c[l.si+'.'+l.ti+'.'+l.j]=1;};
  if(${q(until)}!==null){for(const e of L){if(e.id===${q(until)})break;tick(e);}}
  if(${all})L.forEach(tick);
  L.filter(e=>${q(ticks)}.includes(e.id)).forEach(tick);
  ${q(open)}.forEach(m=>misSet(m,r=>{r.o=true;}));${q(closed)}.forEach(m=>misSet(m,r=>{r.o=false;}));${extra};woSave();})()`);
const saved = page => page.value(`JSON.parse(localStorage.getItem(LS.walk)||'{}')`);
const tagOf = (page, sel) => page.value(`document.querySelector(${q(sel)})?.querySelector(':scope>summary .tag')?.textContent`);
// The pinned headers' bottom edge above el, and el's top: a landing puts el right there, on screen.
const landing = (page, sel, row = false) => page.value(`(()=>{let el=document.querySelector(${q(sel)});if(el&&${row})el=el.closest('.wstep');if(!el)return null;let y=hdrH();
  for(let p=el.closest('details');p;p=p.parentElement.closest('details'))if(p.open&&p.matches('details.stopd,details.sec')&&p.querySelector(':scope>summary')!==el)y+=p.querySelector(':scope>summary').offsetHeight;
  const t=el.getBoundingClientRect().top;return {pin:y,top:t,h:innerHeight,end:scrollY+innerHeight>=document.documentElement.scrollHeight-1,flash:el.classList.contains('flash')};})()`);
const assertLanded = (at, label) => {
  assert.ok(at, `${label}: the target is on the page`);
  assert.ok(at.top >= at.pin - 2 && (at.top <= at.pin + 12 || at.end) && at.top < at.h - 20, `${label}: lands under the pinned headers (${JSON.stringify(at)})`);
};
const openChain = async page => { await page.value(`document.querySelector('details.split[data-wo="${MIXED?.si}"]').open=true`); await page.settle(); await openStop(page); };
const openStop = page => page.value(`(()=>{const st=document.querySelector('details.stopd[data-k="${MK}"]');st.open=true;st.querySelector('details.sec[data-s="${MK}.c"]').open=true;})()`);
const leafSel = id => id.startsWith('m:') ? (([, m, k]) => `${card(m)} input[data-ck=${q(k)}]`)(id.split(':')) : `input[data-sk=${q(id.slice(2))}]`;
const leafBox = id => `${leafSel(id)}`;

// Types into the full-window search: the input in a browser, the letters keyboard in dvkb (no Done: that filters the page).
async function search(page, text, dvkb) {
  await page.tap('#t-s');
  if (!dvkb) await page.value(`(()=>{const el=document.querySelector('.srch input.sq');el.value=${q(text)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  else for (const ch of text.toUpperCase()) await page.tap(`.kb .k[data-c="${ch === ' ' ? ' ' : ch}"]`);
  await page.settle();
}
const srIndex = (page, test) => page.value(`SR.items.findIndex(it=>{const o=it.o;return ${test};})`);
async function pickResult(page, test, label) {
  if (await page.value('!!KB.o')) await page.tap('.srch [data-a="hide"]');
  const i = await srIndex(page, test);
  assert.ok(i >= 0, `${label}: a search result`);
  await page.value(`document.querySelector('.srch .sr[data-i="${i}"]').scrollIntoView({block:'center'})`);
  await page.tap(`.srch .sr[data-i="${i}"]`);
  await page.value('new Promise(r=>setTimeout(r,800))');
}

const checks = [
  {
    id: 'm1 card', title: 'mission card: open / close, ticks and counts, auto-close on the completing tick, reload', sizes: SIZES, modes: MODES, skip,
    run: async (page, { width }) => {
      await seed(page);
      await page.reload();
      await walk(page);
      await openChain(page);
      await page.settle();
      const c1 = card(M1.m);
      assert.equal(await page.value(`document.querySelector(${q(c1)}).open`), false, 'a mission starts closed');
      assert.equal(await tagOf(page, c1), `0/${M1.s.length}`, 'closed header shows done / total');
      const total = await page.value(`document.querySelectorAll('details.stopd[data-k="${MK}"] .wstep input').length`);
      assert.equal(await tagOf(page, `details.sec[data-s="${MK}.c"]`), `0/${total}`, 'the checklist counts ordinary and mission steps');
      assert.equal(total, MIXED.st.s.filter(Array.isArray).length + MIXED.st.s.filter(isM).reduce((n, x) => n + x.s.length, 0), 'every leaf once, no container');
      const hs = await page.value(`document.querySelector(${q(c1)}+'>summary').getBoundingClientRect().height`);
      assert.ok(hs >= 44, `header is at least 44 px (${hs})`);
      await tapHeader(page, c1);
      assert.equal(await page.value(`document.querySelector(${q(c1)}).open`), true, 'header tap opens');
      assert.equal((await saved(page)).missions?.[M1.m]?.o, true, 'open saved');
      assert.ok(await page.value(`document.querySelector(${q(c1)}+' .misb').textContent.includes(${q(M1.r)})`), 'reward shown when open');
      const rows = await page.value(`[...document.querySelectorAll(${q(c1)}+' .wstep')].map(r=>r.getBoundingClientRect().height)`);
      assert.ok(rows.every(h => h >= 44), `mission rows are at least 44 px (${rows})`);
      const k0 = M1.s[0].k, row = i => `${c1} .wstep:nth-of-type(${i + 1})`;
      const split = `details.split[data-wo="${MIXED.si}"]`, splitTag0 = await tagOf(page, split);
      await page.tap(row(0));
      assert.equal((await saved(page)).missions[M1.m].c[k0], 1, 'tick saved by mission slug and step key');
      assert.equal(await tagOf(page, c1), `1/${M1.s.length}`, 'mission count');
      assert.equal(await tagOf(page, `details.sec[data-s="${MK}.c"]`), `1/${total}`, 'checklist count');
      assert.equal(+(await tagOf(page, split)).split('/')[0], +splitTag0.split('/')[0] + 1, 'split count');
      await page.tap(row(0));
      assert.equal((await saved(page)).missions[M1.m].c[k0], undefined, 'untick saved');
      assert.equal(await tagOf(page, c1), `0/${M1.s.length}`, 'untick counts');
      // Every step: the last one completes the mission and closes it.
      for (let i = 0; i < M1.s.length; i++) {
        if (i === M1.s.length - 1) assert.equal(await page.value(`document.querySelector(${q(c1)}).open`), true, 'open until the last tick');
        await page.value(`document.querySelector(${q(row(i))}).scrollIntoView({block:'center'})`);
        await page.tap(row(i));
      }
      await page.value('new Promise(r=>setTimeout(r,900))');
      assert.equal(await page.value(`document.querySelector(${q(c1)}).open`), false, 'the completing tick closes the mission');
      assert.equal((await saved(page)).missions[M1.m].o, false, 'closed state saved');
      assert.equal(await page.value(`document.activeElement===document.querySelector(${q(c1)}+'>summary')`), true, 'its header has focus');
      const at = await landing(page, c1 + '>summary');
      assert.ok(at.top >= at.pin - 2 && at.top < at.h - 20, `closed header is on screen under the pinned headers (${JSON.stringify(at)})`);
      assert.equal(await page.value(`document.querySelector(${q(c1)}+'>summary .tag').classList.contains('got')`), true, 'complete badge');
      assert.equal(await page.value(`document.querySelector('details.stopd[data-k="${MK}"]').open&&document.querySelector('details.sec[data-s="${MK}.c"]').open`), true, 'stop and checklist stay open');
      await tapHeader(page, c1);
      assert.equal(await page.value(`document.querySelector(${q(c1)}).open`), true, 'a complete mission reopens and stays open');
      await page.tap(row(1));
      assert.equal(await tagOf(page, c1), `${M1.s.length - 1}/${M1.s.length}`, 'untick after complete');
      assert.equal(await page.value(`document.querySelector(${q(c1)}).open`), true, 'untick keeps it open');
      // The other mission: closed explicitly, then reload.
      await tapHeader(page, card(M2.m));
      await tapHeader(page, card(M2.m));
      assert.equal((await saved(page)).missions[M2.m].o, false, 'explicit close saved');
      await page.reload();
      await walk(page);
      assert.equal(await page.value(`document.querySelector(${q(c1)})?.open`), true, 'reload: open mission still open');
      assert.equal(await page.value(`document.querySelector(${q(card(M2.m))})?.open`), false, 'reload: closed mission still closed');
      assert.equal(await tagOf(page, c1), `${M1.s.length - 1}/${M1.s.length}`, 'reload: ticks kept');
      if (width === 260) {
        await page.value(`document.querySelectorAll('details.wmis').forEach(d=>d.open=true)`);
        await page.settle();
      }
    },
  },
  {
    id: 'm2 next', title: 'Next step goes through missions in data order, opening only the target chain', sizes: [[260, 316], [537, 424]], modes: MODES, skip,
    run: async page => {
      const first = 'm:' + M1.m + ':' + M1.s[0].k;
      await seed(page, { until: first });
      await page.reload();
      await walk(page);
      assert.ok((await page.text('.wk-next')).includes(M1.n), 'Next names the mission');
      for (const pass of [1, 2]) {
        await page.tap('.wk-next');
        await page.value('new Promise(r=>setTimeout(r,900))');
        assert.equal(await page.value(`document.querySelector(${q(card(M1.m))}).open`), true, `pass ${pass}: the mission is opened`);
        assertLanded(await landing(page, leafSel(first), true), `pass ${pass}: Next into a closed mission`);
        assert.equal(await page.value(`document.querySelector(${q(leafBox(first))}).checked`), false, `pass ${pass}: no tick`);
      }
      assert.equal(await page.value(`document.querySelector(${q(card(M2.m))}).open`), false, 'only the target mission opens');
      // Both missions done: the next ordinary step after them, the finished missions left as they were.
      const after = await page.value(`(()=>{const L=${LEAVES};const i=L.findIndex(e=>e.id===${q(first)});return L.slice(i).find(e=>!e.l.m)?.id;})()`);
      await seed(page, { until: after, open: [M1.m] });
      await page.reload();
      await walk(page);
      await page.tap('.wk-next');
      await page.value('new Promise(r=>setTimeout(r,900))');
      assertLanded(await landing(page, leafSel(after), true), 'Next out of a mission to the ordinary step');
      assert.equal(await page.value(`document.querySelector(${q(card(M1.m))}).open`), true, 'a finished open mission is not closed by Next');
      // A stop with only missions.
      const om = ONLY.st.s[0], oid = 'm:' + om.m + ':' + om.s[0].k;
      await seed(page, { until: oid });
      await page.reload();
      await walk(page);
      await page.tap('.wk-next');
      await page.value('new Promise(r=>setTimeout(r,900))');
      assertLanded(await landing(page, leafSel(oid), true), 'Next into a stop with only missions');
      assert.equal(await page.count(`.wsign[data-k="${ONLY.si}.${ONLY.ti}"]`), 0, 'a mission-only stop is a stop, not a sign');
      // Every ordinary step done: the first mission step, not "Checklist done".
      await seed(page, { extra: `${LEAVES}.filter(e=>!e.l.m).forEach(({l})=>WO.c[l.si+'.'+l.ti+'.'+l.j]=1)` });
      await page.reload();
      await walk(page);
      const firstM = await page.value(`${LEAVES}.find(e=>e.l.m).l.c.t`);
      assert.ok((await page.text('.wk-next')).includes(firstM), 'only missions left: Next names a mission step');
      await seed(page, { all: true });
      await page.reload();
      await walk(page);
      assert.ok((await page.text('.wk-next')).includes('Checklist done'), 'all ticked');
      const y = await page.value('scrollY');
      await page.tap('.wk-next');
      assert.equal(await page.value('scrollY'), y, 'all done: Next is harmless');
    },
  },
  {
    id: 'm3 search', title: 'search: mission steps and names land in the closed chain; no results; search this page', sizes: [[260, 316], [537, 424]], modes: MODES, skip,
    run: async (page, { dvkb }) => {
      await seed(page, { ticks: ['m:' + M2.m + ':' + M2.s[0].k] });
      await page.reload();
      await walk(page);
      // A step hit (the second mission's second step), everything closed.
      const step = M2.s[1], word = step.t.split(/[^A-Za-z]+/).filter(w => w.length >= 6).sort((a, b) => b.length - a.length)[0];
      await search(page, word, dvkb);
      await pickResult(page, `o.k==='ms'&&o.m===${q(M2.m)}&&o.c===${q(step.k)}`, 'step hit');
      assert.equal(await page.count('.srch'), 0, 'the overlay closes');
      const id = 'm:' + M2.m + ':' + step.k;
      assertLanded(await landing(page, leafSel(id), true), 'step hit');
      assert.equal(await page.value(`document.querySelector(${q(leafBox(id))}).checked`), false, 'no tick');
      assert.equal((await saved(page)).missions[M2.m].o, true, 'opened chain saved');
      // A name hit: one row for the mission, landing on its header.
      await page.value(`document.querySelector(${q(card(M2.m))}).open=false`);
      await page.settle();
      const nameWord = M1.n.split(/[^A-Za-z]+/).filter(w => w.length >= 4).sort((a, b) => b.length - a.length)[0];
      await search(page, nameWord, dvkb);
      const rows = await page.value(`SR.items.filter(it=>it.o.k==='ms'&&it.o.m===${q(M1.m)}).length`);
      assert.equal(rows, 1, 'one row per mission for a name hit');
      await pickResult(page, `o.k==='ms'&&o.m===${q(M1.m)}&&o.c==null`, 'name hit');
      assertLanded(await landing(page, card(M1.m) + '>summary'), 'name hit');
      assert.equal(await page.value(`document.querySelector(${q(card(M1.m))}).open`), true, 'name hit opens the mission');
      // No results: nothing changes.
      const before = JSON.stringify(await saved(page));
      await search(page, 'qxzjv', dvkb);
      assert.equal(await page.value(`SR.items.filter(it=>it.o.k==='ms').length`), 0, 'no mission rows');
      await page.tap('.srch [data-a="back"]');
      assert.equal(JSON.stringify(await saved(page)), before, 'no results changes no saved state');
      // Recents keep the mission by slug.
      assert.ok(await page.value(`recRead().some(o=>o.k==='ms'&&o.m===${q(M1.m)}&&o.c==null)`), 'recent stored by mission slug');
      assert.ok(await page.value(`JSON.parse(localStorage.getItem(LS.recent)).some(o=>o.k==='ms'&&o.m===${q(M2.m)}&&o.c===${q(step.k)})`), 'recent stored by slug and step key');
      // Search this page: the stop with the mission open.
      await page.value(`(()=>{const d=document.querySelector(${q(card(M1.m))});d.open=false;})()`);
      await page.settle();
      await search(page, nameWord, dvkb);
      await page.tap('.srch [data-a="here"]');
      await page.settle();
      assert.ok(await page.count(`details.stopd[data-k="${MK}"]`), 'filtered page shows the stop');
      assert.equal(await page.value(`document.querySelector(${q(card(M1.m))}).open`), true, 'the matching mission shows open');
    },
  },
  {
    id: 'm4 reset', title: 'Reset checklist clears ordinary and mission ticks (orphans too), keeps open states and the tracker', sizes: [[260, 316]], modes: MODES, skip,
    run: async page => {
      const o = await page.value(`${LEAVES}.find(e=>!e.l.m).id`);
      await seed(page, { ticks: [o, 'm:' + M1.m + ':' + M1.s[0].k], open: [M1.m],
        extra: `WO.missions['mission-gone']={o:true,c:{a:1}};WO.missions[${q(M1.m)}].c['gone-step']=1;localStorage.setItem(LS.track,JSON.stringify({e:{0:{f:1}},t:{}}))` });
      await page.reload();
      await walk(page);
      const track = await page.value('localStorage.getItem(LS.track)');
      await page.value(`document.querySelector('details.split[data-wo="gi"]').open=true`);
      await page.settle();
      const was = JSON.stringify(await saved(page));
      await page.value('window.confirm=()=>false');
      await page.tap('.wk-reset');
      assert.equal(JSON.stringify(await saved(page)), was, 'cancel changes nothing');
      await page.value('window.confirm=()=>true');
      await page.tap('.wk-reset');
      const s = await saved(page);
      assert.deepEqual(s.c, {}, 'ordinary ticks cleared');
      assert.deepEqual(s.missions[M1.m].c, {}, 'mission ticks cleared, gone steps too');
      assert.deepEqual(s.missions['mission-gone'].c, {}, 'orphan mission ticks cleared');
      assert.equal(s.missions[M1.m].o, true, 'open state kept');
      assert.equal(s.missions['mission-gone'].o, true, 'orphan record kept');
      assert.equal(await page.value('localStorage.getItem(LS.track)'), track, 'tracker untouched');
    },
  },
];

// m5: an update that renames, removes, adds and moves missions and steps, and puts a mission before the ordinary steps.
function updated() {
  const D = JSON.parse(JSON.stringify(data));
  const st = D.WK.splits[MIXED.si].st[MIXED.ti];
  const m1 = st.s.find(x => isM(x) && x.m === M1.m);
  m1.n += ' (renamed)';
  m1.s = [{ k: 'brand-new-step', t: 'A step added by the update.' }, ...m1.s.filter(c => c.k !== M1.s[0].k)];
  st.s = st.s.filter(x => !(isM(x) && x.m === M2.m));
  st.s.unshift({ m: 'mission-brand-new', n: 'Brand New Mission', u: 'Added by the update.', r: 'Nothing', s: [{ k: 'accept', t: 'Accept it.' }] });
  // A mission from the only-missions stop moves here (end of the list).
  const os = D.WK.splits[ONLY.si].st[ONLY.ti], mv = os.s.pop();
  if (!os.s.length) os.s = [];
  st.s.push(mv);
  return { D, moved: mv };
}
const write = (tag, D) => {
  mkdirSync(join(OUT, 'walk-missions-' + tag), { recursive: true });
  const out = join(OUT, 'walk-missions-' + tag, name + '.html');
  writeFileSync(out, html.replace(match[0], () => match[1] + JSON.stringify(D).replaceAll('</', '<\\/') + match[3]));
  return out;
};
if (!skip) {
  const before = write('before', data), { D: upd, moved } = updated(), after = write('after', upd);
  checks.push({
    id: 'm5 update', title: 'renamed / removed / added / moved missions and steps keep their saved state by key', sizes: [[260, 316]], modes: ['normal'], file: before,
    run: async page => {
      const ord = MIXED.st.s.filter(Array.isArray), lastJ = ord.length - 1, ordId = `o:${MK}.${lastJ}`;
      const mvId = 'm:' + moved.m + ':' + moved.s[0].k;
      // An old save with no missions map: ordinary state loads, nothing is reset.
      await page.value(`(()=>{localStorage.setItem(LS.walk,JSON.stringify({c:{'${MK}.${lastJ}':1},o:{'${MIXED.si}':1},x:{},s:{'${MK}.c':1},layout:WO.layout}));})()`);
      await page.reload();
      await walk(page);
      assert.equal(await page.value(`document.querySelector(${q(leafBox(ordId))}).checked`), true, 'old save: ordinary tick kept');
      assert.equal((await saved(page)).missions, undefined, 'old save: no missions map until one is used');
      await seed(page, { ticks: [ordId, 'm:' + M1.m + ':' + M1.s[0].k, 'm:' + M1.m + ':' + M1.s[1].k, 'm:' + M2.m + ':' + M2.s[0].k, mvId], open: [M1.m], closed: [M2.m] });
      const ordText = await page.value(`D.WK.splits[${MIXED.si}].st[${MIXED.ti}].s.filter(Array.isArray)[${lastJ}][0]`);
      page.file = after;
      await page.goto('#/walk');
      await openChain(page);
      await page.settle();
      const row = await page.value(`(()=>{const i=document.querySelector(${q(leafBox(ordId))});return i&&{on:i.checked,t:i.closest('.wstep').textContent};})()`);
      assert.ok(row && row.on && row.t.includes(ordText), `the ordinary tick after an inserted mission keeps its step (${JSON.stringify(row)})`);
      assert.ok((await page.text(card(M1.m) + '>summary .mn')).endsWith('(renamed)'), 'renamed mission shows its new name');
      assert.equal(await page.value(`document.querySelector(${q(card(M1.m))}).open`), true, 'renamed mission keeps its open state');
      assert.equal(await page.value(`document.querySelector(${q(card(M1.m) + ' input[data-ck="brand-new-step"]')}).checked`), false, 'a new step starts unticked');
      assert.equal(await page.value(`document.querySelector(${q(leafBox('m:' + M1.m + ':' + M1.s[1].k))}).checked`), true, 'a kept step keeps its tick');
      assert.equal(await tagOf(page, card(M1.m)), `1/${M1.s.length}`, 'the removed step is out of the count, the new one in');
      assert.equal(await page.count(card(M2.m)), 0, 'the removed mission is gone from the page');
      assert.equal(await page.value(`document.querySelector(${q(card('mission-brand-new'))}).open`), false, 'a new mission starts closed');
      assert.equal(await page.value(`document.querySelector(${q(leafBox(mvId))})?.closest('details.stopd').dataset.k`), MK, 'the moved mission is at its new stop');
      assert.equal(await page.value(`document.querySelector(${q(leafBox(mvId))}).checked`), true, 'the moved mission keeps its tick');
      const raw = await saved(page);
      assert.equal(raw.missions[M2.m]?.c?.[M2.s[0].k], 1, 'the removed mission keeps its record');
      assert.equal(raw.missions[M2.m]?.o, false, 'and its closed state');
      assert.equal(raw.missions[M1.m]?.c?.[M1.s[0].k], 1, 'the removed step keeps its record');
      assert.ok(!/"\d+\.\d+\.\d+"/.test(JSON.stringify(raw.missions)), 'mission records hold no positions');
      // The keys come back.
      page.file = before;
      await page.goto('#/walk');
      await openChain(page);
      await page.settle();
      assert.equal(await page.value(`document.querySelector(${q(leafBox('m:' + M2.m + ':' + M2.s[0].k))}).checked`), true, 'a reintroduced mission gets its tick back');
      assert.equal(await page.value(`document.querySelector(${q(leafBox('m:' + M1.m + ':' + M1.s[0].k))}).checked`), true, 'a reintroduced step gets its tick back');
      assert.equal(await page.value(`document.querySelector(${q(card(M2.m))}).open`), false, 'and its closed state');
    },
  });
}

await runChecks({ name: 'walk-missions-' + name, file, checks });

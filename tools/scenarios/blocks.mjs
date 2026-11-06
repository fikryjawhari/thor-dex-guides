// node tools/scenarios/blocks.mjs [dist/<hack>.html]: the open / close behaviour of the box pages (Locations, Trainers,
// Items, the walkthrough), asserted at 260 x 316 and 537 x 424, normal and dvkb (the search bar's height moves every pinned
// header).
// Per page, on the box with the most to it (picked by structure, so any guide's data works):
//   - a box header tap opens the box and the header stays at its pixel (dex.js flip(): every frame, not just the last);
//   - a place / trainer / section header tap the same, closing and reopening it;
//   - pinned headers: in the middle of the tallest open place and section, every header that should be stuck sits at
//     its CSS top, nothing covers it, and the stack (search bar, trainer switch strip, place, section) has no gap; a tap
//     on the pinned header closes the block and reopens it with the header held at its pixel;
//   - an inner collapse bar closes its block, whose header lands under the headers pinned above it (pinTop()); the
//     box's own bar closes the box with its header at the top (T());
//   - the rail's jump buttons: down, down, up land box headers at T(), up disabled only at the top (the search's jumps
//     are jumpcheck.mjs);
//   - Expand all / Collapse all open and close every box and the bar stays where it was;
//   - a reload brings back the open box and the closed place inside it.
// Also: a place link (#/l/<i>) lands the place under the search bar; the walkthrough's Next step lands a step on
// screen; the rail shows on exactly the box pages, the calc and Pokémon pages.
import assert from 'node:assert/strict';
import { MODES, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const SIZES = [[260, 316], [537, 424]];
const PAGES = [['locs', '.seg.all'], ['trainers', '.seg.all'], ['items', '.seg.all'], ['walk', '.wk-all']];

// In-page helpers (window.__B), installed after every navigation. Uses the template's own T(), pinTop() and jts().
const HELPERS = `window.__B={
  fr:()=>new Promise(r=>requestAnimationFrame(r)),
  wait:ms=>new Promise(r=>setTimeout(r,ms)),
  top:el=>Math.round(el.getBoundingClientRect().top*2)/2+0,
  sm:d=>d.querySelector(':scope>summary'),
  // Scripted scrolls start with a wheel event, as a user's do: it ends hold() / land(), which would otherwise keep
  // their element in place for up to 700 ms against the scroll.
  user:()=>dispatchEvent(new WheelEvent('wheel',{bubbles:true})),
  by:dy=>{__B.user();scrollBy(0,dy);return true;},
  to:y=>{__B.user();scrollTo(0,y);return true;},
  // Scrolls el to the bottom edge until it stays there: blocks rendered on the way (content-visibility) take their real
  // height a frame later and move it.
  end:async el=>{let ok=0;for(let i=0;i<60&&ok<2;i++){__B.user();el.scrollIntoView({block:'end'});await __B.fr();await __B.fr();await __B.wait(16);ok=Math.abs(el.getBoundingClientRect().bottom-innerHeight)<1?ok+1:0;}return ok>=2;},
  // Scrolls the middle of el to the top edge (under the pinned headers) until it stays there, as end() does. An element
  // inside a block the browser skipped (content-visibility: auto, off screen) reports stale positions: first the
  // nearest block that is rendered, its placeholder, comes on screen, so the browser lays out the real one.
  mid:async el=>{let ok=0;for(let i=0;i<80&&ok<2;i++){
    if(!el.checkVisibility({contentVisibilityAuto:true})){let p=el.parentElement;while(p&&!p.checkVisibility({contentVisibilityAuto:true}))p=p.parentElement;
      const sk=[...p.children].find(c=>c.contains(el))||p;__B.user();sk.scrollIntoView({block:'start'});ok=0;}
    else{const dy=el.getBoundingClientRect().top+el.offsetHeight/2-T();if(Math.abs(dy)<1)ok++;else{ok=0;__B.by(dy);}}
    await __B.fr();await __B.fr();await __B.wait(16);}return ok>=2;},
  inner:box=>[...box.querySelectorAll('details.stopd,details.sec,details.trd')],
  // Forced open (d.open, lazy bodies filled): only for measuring in pick(). It is not a state the page makes (sizes and
  // deferred rendering differ from the template's own opening), so pick() is followed by a reload.
  forceOpen:async box=>{for(let pass=0;pass<4;pass++){__B.inner(box).forEach(d=>{if(!d.open){d.open=true;if(d._f)d._f();}});await __B.fr();}await __B.wait(60);},
  // Opens the box's places / sections / trainers the way a user can: the walkthrough's and Trainers' Show switch (All /
  // Teams), the Expand all bars inside a box (Locations' sections, Items' groups), then a header tap on anything still
  // closed and rendered. Waits for the holds those leave (450 ms) to end.
  openAll:async box=>{const tap=el=>{if(el)el.click();};
    tap(box.querySelector('.wksw button[data-v="2"]'));tap(box.querySelector('.trsw button[data-v="2"]'));await __B.wait(100);
    box.querySelectorAll('.seg.lc-pl [data-a="1"],.seg.it-sp [data-a="1"]').forEach(tap);await __B.wait(100);
    for(let i=0;i<60;i++){const d=__B.inner(box).find(x=>!x.open&&x.checkVisibility({contentVisibilityAuto:true}));if(!d)break;tap(__B.sm(d));await __B.fr();}
    await __B.wait(500);__B.user();return true;},
  // The point a tap at the element's left part would hit is the element (nothing pinned over it). No scrollIntoView: a
  // pinned header's own position is elsewhere in the page.
  hit:el=>{const r=el.getBoundingClientRect(),h=document.elementFromPoint(r.left+Math.min(12,r.width/2),r.top+r.height/2);if(h&&el.contains(h))return '';const hs=h&&h.closest('summary'),hd=hs&&hs.parentElement,me=el.parentElement;
    return 'covered by '+(h?h.className||h.tagName:'nothing')+' at '+Math.round(r.top)+(hd?' (the header of '+hd.className+' '+(hd.dataset.s||hd.dataset.k||'')+' at '+Math.round(hs.getBoundingClientRect().top)+'-'+Math.round(hs.getBoundingClientRect().bottom)+', CSS top '+getComputedStyle(hs).top+(me.contains(hd)?', inside this block':hd.contains(me)?', around this block':'')+'; this one '+(me.dataset.s||me.dataset.k||'')+' '+Math.round(r.top)+'-'+Math.round(r.bottom)+')':'');},
  // The box with the most inside it among the first 12: opened, measured, closed again.
  pick:async()=>{let best=0,h=-1;const bs=jts().slice(0,12);
    for(let i=0;i<bs.length;i++){const d=bs[i];d.open=true;if(d._f)d._f();await __B.forceOpen(d);const x=__B.inner(d).length*100000+d.offsetHeight;if(x>h){h=x;best=i;}}
    bs.forEach(d=>{d.open=false;__B.inner(d).forEach(x=>x.open=false);});await __B.fr();await __B.fr();return best;},
  // Clicks the element and samples its top for n frames: [before, ...after].
  tapHold:async(el,n=15)=>{const ys=[__B.top(el)];el.click();for(let i=0;i<n;i++){ys.push(__B.top(el));await __B.fr();}return ys;},
  // Every sticky element that should be stuck now: rendered (not in a content-visibility block the browser skipped,
  // whose children report placeholder positions) and its parent spans its CSS top. Returns the problems found.
  stack:()=>{const bad=[],stuck=[];
    for(const el of [document.querySelector('header'),...document.querySelectorAll('#app summary,#app .trsw')]){
      if(!el||!el.checkVisibility({contentVisibilityAuto:true}))continue;const cs=getComputedStyle(el);if(cs.position!=='sticky')continue;const r=el.getBoundingClientRect();if(!r.height)continue;
      const top=parseFloat(cs.top),p=el.parentElement.getBoundingClientRect();if(!(p.top<top-1&&p.bottom>top+r.height+1))continue;
      const name=(el.tagName==='HEADER'?'search bar':el.className||el.parentElement.className)+' "'+el.textContent.trim().slice(0,24)+'"';
      if(Math.abs(r.top-top)>1)bad.push(name+' at '+Math.round(r.top)+', CSS top '+top);
      const hit=document.elementFromPoint(r.left+Math.min(12,r.width/2),r.top+r.height/2);if(hit&&!el.contains(hit))bad.push(name+' covered by '+(hit.className||hit.tagName));
      stuck.push({name,top:r.top,bottom:r.bottom});}
    stuck.sort((a,b)=>a.top-b.top);
    for(let i=1;i<stuck.length;i++)if(stuck[i].top>stuck[i-1].bottom+.5)bad.push('gap '+Math.round(stuck[i].top-stuck[i-1].bottom)+' px between '+stuck[i-1].name+' and '+stuck[i].name);
    return {bad,stuck:stuck.map(s=>s.name+' '+Math.round(s.top))};},
};true`;

// A header held still: every sampled frame within 1 px of where it was (scrolls are whole pixels at this scale, so a
// header at a half pixel can't be put back exactly; half a pixel doesn't show).
const still = ys => Math.max(...ys) - Math.min(...ys) <= 1;

async function go(page, hash) {
  await page.goto(hash);
  await page.value(HELPERS);
}

// The open / close checks for one box page.
async function boxPage(page, view, segSel) {
  await go(page, '#/' + view);
  const n = await page.value('jts().length');
  assert.ok(n > 1, `#/${view}: ${n} boxes`);
  assert.equal(await page.value(`document.querySelector('.rjump').hidden`), false, `#/${view}: the rail's jump buttons show`);
  const pick = await page.value('__B.pick()');
  await page.reload();
  await page.value(HELPERS);
  const where = `#/${view} box ${pick} "${await page.value(`__B.sm(jts()[${pick}]).textContent.trim().slice(0,30)`)}"`;
  await page.value(`(()=>{const d=jts()[${pick}];d.dataset.qa='box';__B.sm(d).dataset.qa='boxh';__B.by(__B.sm(d).getBoundingClientRect().top-T());return true;})()`);
  await page.settle();

  // box header tap: opens, the header holds still
  await page.locate('[data-qa="boxh"]');
  let ys = await page.value(`__B.tapHold(document.querySelector('[data-qa="boxh"]'))`);
  assert.ok(await page.value(`document.querySelector('[data-qa="box"]').open`), `${where}: the header tap opens it`);
  assert.ok(still(ys), `${where}: the header moved on opening (${ys.join(',')})`);
  await page.value(`__B.openAll(document.querySelector('[data-qa="box"]'))`);

  // an inner header tap (place / trainer / section): closes and reopens in place
  const inner = await page.value(`(()=>{const box=document.querySelector('[data-qa="box"]');const d=box.querySelector('details.stopd[open],details.trd[open]')||box.querySelector('details.sec[open]');if(!d)return null;
    d.dataset.qa='inner';__B.sm(d).dataset.qa='innerh';__B.by(__B.sm(d).getBoundingClientRect().top-Math.round(innerHeight/2));return d.className;})()`);
  if (inner) {
    await page.settle();
    assert.equal(await page.value(`__B.hit(document.querySelector('[data-qa="innerh"]'))`), '', `${where}: the ${inner} header can be tapped`);
    for (const open of [false, true]) {
      ys = await page.value(`__B.tapHold(document.querySelector('[data-qa="innerh"]'))`);
      assert.equal(await page.value(`document.querySelector('[data-qa="inner"]').open`), open, `${where}: a ${inner} header tap ${open ? 'reopens' : 'closes'} it`);
      assert.ok(still(ys), `${where}: the ${inner} header moved on ${open ? 'opening' : 'closing'} (${ys.join(',')})`);
    }
  }

  // pinned headers in the middle of the tallest open place and section
  for (const sel of ['details.stopd[open]', 'details.sec[open]', 'details.trd[open]']) {
    const h = await page.value(`(async()=>{document.querySelectorAll('[data-qa="pin"]').forEach(e=>delete e.dataset.qa);
      const b=[...document.querySelectorAll('[data-qa="box"] ${sel}')].sort((a,b)=>b.offsetHeight-a.offsetHeight)[0];if(!b)return 0;
      b.dataset.qa='pin';await __B.mid(b);return b.offsetHeight;})()`);
    if (!h) continue;
    await page.settle();
    const { bad, stuck } = await page.value('__B.stack()');
    assert.deepEqual(bad, [], `${where}: pinned headers in the middle of a ${h} px ${sel} (stuck: ${stuck.join(' | ')})`);
    if (sel === 'details.trd[open]') continue; // trainer headers aren't pinned
    // its own header is pinned at its CSS top, and a tap there hits it
    const [top, css] = await page.value(`(()=>{const s=__B.sm(document.querySelector('[data-qa="pin"]'));return [__B.top(s),parseFloat(getComputedStyle(s).top)];})()`);
    assert.ok(Math.abs(top - css) <= 1, `${where}: the ${h} px ${sel}'s header at ${top}, not pinned at ${css}`);
    assert.equal(await page.value(`__B.hit(__B.sm(document.querySelector('[data-qa="pin"]')))`), '', `${where}: the pinned ${sel} header can be tapped`);
    // a tap on the pinned header closes the block and the header stays at its pixel (flip()); a second tap reopens it
    for (const open of [false, true]) {
      const ys = await page.value(`__B.tapHold(__B.sm(document.querySelector('[data-qa="pin"]')),30)`);
      assert.equal(await page.value(`document.querySelector('[data-qa="pin"]').open`), open, `${where}: a tap on the pinned ${sel} header ${open ? 'reopens' : 'closes'} it`);
      assert.ok(still(ys), `${where}: the pinned ${sel} header moved on ${open ? 'opening' : 'closing'} (${ys.join(',')})`);
    }
  }

  // an inner collapse bar: the block closes, its header under the headers pinned above it
  await page.waitFor(`[...document.querySelectorAll('[data-qa="box"] details.stopd>.endbar,[data-qa="box"] details.stopd>.stop>.endbar,[data-qa="box"] details.sec>.endbar,[data-qa="box"] details.trd>.endbar')].some(b=>!b.hidden)||!document.querySelector('[data-qa="box"] .endbar:not(.sp)')`, `${where}: inner collapse bars`);
  const bar = await page.value(`(async()=>{const b=[...document.querySelectorAll('[data-qa="box"] .endbar:not(.sp)')].find(x=>!x.hidden);if(!b)return null;const d=b.closest('details');
    b.dataset.qa='bar';d.dataset.qa2='barblock';await __B.end(b);return d.className;})()`);
  if (bar) {
    await page.settle();
    // foldUp(): a header still on screen closes in place; one above the pinned headers comes down under them
    const [before, pin] = await page.value(`(()=>{const d=document.querySelector('[data-qa2="barblock"]');return [__B.top(__B.sm(d)),pinTop(d)];})()`);
    const want = before >= pin - 1 ? before : pin;
    await page.tap('[data-qa="bar"]');
    await page.waitFor(`!document.querySelector('[data-qa2="barblock"]').open`, `${where}: the ${bar} collapse bar to close it`);
    const got = await page.value(`__B.top(__B.sm(document.querySelector('[data-qa2="barblock"]')))`);
    assert.ok(Math.abs(got - want) <= 1.5, `${where}: the ${bar} header after its collapse bar is at ${got}, not ${want} (it was at ${before}, the pinned headers end at ${pin})`);
  }

  // the box's own collapse bar: the box closes with its header at the top
  const boxBar = await page.value(`(async()=>{const b=document.querySelector('[data-qa="box"] .endbar.sp');if(!b||b.hidden)return false;await __B.end(b);return true;})()`);
  if (boxBar) {
    await page.settle();
    // foldUp(): the box header comes to the top if it was above it, else stays
    const before = await page.value(`__B.top(document.querySelector('[data-qa="boxh"]'))`);
    await page.tap('[data-qa="box"] .endbar.sp');
    await page.waitFor(`!document.querySelector('[data-qa="box"]').open`, `${where}: the box's collapse bar to close it`);
    const [got, top, atEnd] = await page.value(`[__B.top(document.querySelector('[data-qa="boxh"]')),T(),scrollY+innerHeight>=document.documentElement.scrollHeight-1]`);
    // up to the top, unless the page below is too short to scroll it that far (then it sits lower, at the end)
    const want = before < top ? top : before;
    assert.ok(Math.abs(got - want) <= 1 || (before < top && atEnd && got > top), `${where}: the box header after its collapse bar is at ${got}, not ${want} (it was at ${before})`);
  }

  // rail jumps from the top, every box closed: down, down, up
  await page.value(`(()=>{jts().forEach(d=>d.open=false);__B.to(0);return true;})()`);
  await page.settle();
  // at the top: up disabled, down enabled (jumpState(); domcompare leaves this state out, it follows the scroll)
  await page.waitFor(`document.querySelector('.rjump [data-j="-1"]').disabled&&!document.querySelector('.rjump [data-j="1"]').disabled`, `#/${view}: at the top, the rail's up disabled and down enabled`);
  for (const [dir, index] of [[1, 0], [1, 1], [-1, 0]]) {
    await page.tap(`.rjump [data-j="${dir}"]`);
    const [got, want, atEnd] = await page.value(`[__B.top(__B.sm(jts()[${index}])),T(),scrollY+innerHeight>=document.documentElement.scrollHeight-1]`);
    // at the top, unless the page below is too short to scroll it that far
    assert.ok(Math.abs(got - want) <= 1 || (atEnd && got > want), `#/${view}: rail ${dir > 0 ? 'down' : 'up'} left box ${index}'s header at ${got}, not ${want}`);
    if (dir > 0) await page.waitFor(`!document.querySelector('.rjump [data-j="-1"]').disabled`, `#/${view}: the rail's up enabled after a jump down`);
  }

  // Expand all / Collapse all: every box, the bar holds still
  await page.value('__B.to(0)');
  await page.settle();
  for (const [a, open] of [['1', true], ['0', false]]) {
    const before = await page.value(`__B.top(document.querySelector('${segSel}'))`);
    await page.tap(`${segSel} [data-a="${a}"]`);
    const [after, states] = await page.value(`[__B.top(document.querySelector('${segSel}')),jts().map(d=>d.open)]`);
    assert.ok(states.every(s => s === open), `#/${view}: ${open ? 'Expand' : 'Collapse'} all left ${states.filter(s => s !== open).length} of ${states.length} boxes ${open ? 'closed' : 'open'}`);
    assert.ok(Math.abs(after - before) <= 1, `#/${view}: the ${open ? 'Expand' : 'Collapse'} all bar moved ${before} -> ${after}`);
  }

  // reload: the picked box open, the place / trainer closed inside it stays closed
  const kept = await page.value(`(async()=>{const d=jts()[${pick}];d.querySelector(':scope>summary').click();await __B.wait(500);await __B.openAll(d);
    const p=d.querySelector('details.stopd,details.trd');if(p)p.querySelector(':scope>summary').click();await __B.wait(100);return p?p.dataset.k||p.querySelector(':scope>summary').textContent.trim().slice(0,30):null;})()`);
  await page.reload();
  await page.value(HELPERS);
  const after = await page.value(`(()=>{const d=jts()[${pick}];const p=d.querySelector('details.stopd,details.trd');return {open:d.open,inner:p?p.open:null};})()`);
  assert.equal(after.open, true, `${where}: open again after a reload`);
  if (kept != null) assert.equal(after.inner, false, `${where}: its first ${view === 'trainers' ? 'place' : 'place / stop'} (${kept}) closed again after a reload`);
}

const checks = PAGES.map(([view, seg]) => ({
  id: view, title: `#/${view}: header taps, pinned headers, collapse bars, rail jumps, Expand / Collapse all, reload`,
  sizes: SIZES, modes: MODES,
  run: page => boxPage(page, view, seg),
}));

checks.push({
  id: 'place link', title: 'a place link (#/l/<i>) opens its box and place, the place header under the search bar',
  sizes: SIZES, modes: MODES,
  run: async page => {
    const index = Math.min(16, data.LOC.length - 1);
    await go(page, `#/l/${index}`);
    await page.waitFor(`!!document.querySelector('#app .flash')`, 'the flashed place');
    await page.value('new Promise(r=>setTimeout(r,800))'); // land()'s correction loop: 700 ms by design
    // a flashed header lands under the headers pinned above its block (pinTop)
    const r = await page.value(`(()=>{const f=document.querySelector('#app .flash');const d=f.tagName==='SUMMARY'?f.parentElement:f.closest('details');
      return {name:f.textContent.trim().slice(0,30),header:f.tagName==='SUMMARY',top:__B.top(f),want:d?pinTop(d):hdrH(),open:!!d&&d.open};})()`);
    assert.ok(r.header, `#/l/${index}: the flashed element is the place's header`);
    assert.ok(r.open, `#/l/${index}: ${r.name}'s place is open`);
    assert.ok(Math.abs(r.top - r.want) <= 2, `#/l/${index}: ${r.name} at ${r.top}, not under the search bar (${r.want})`);
  },
});

checks.push({
  id: 'next step', title: 'Next step lands the next unticked step on screen, under the pinned headers',
  sizes: SIZES, modes: MODES, skip: data.WK?.splits?.some(split => split.st.some(stop => (stop.s || []).length)) ? undefined : 'no checklist steps',
  run: async page => {
    await go(page, '#/walk');
    await page.tap('.wk-next');
    await page.waitFor(`!!document.querySelector('.wstep.flash')`, 'the flashed step');
    await page.value('new Promise(r=>setTimeout(r,800))');
    const r = await page.value(`(()=>{const s=document.querySelector('.wstep.flash').getBoundingClientRect();return {top:s.top,bottom:s.bottom,min:hdrH(),h:innerHeight};})()`);
    assert.ok(r.top >= r.min - 1 && r.bottom <= r.h + 1, `the next step at ${Math.round(r.top)}-${Math.round(r.bottom)}, not on screen below ${r.min}`);
  },
});

checks.push({
  id: 'rail', title: 'the rail jump buttons show on the box pages, the calc and Pokémon pages, and nowhere else',
  run: async page => {
    const rail = ['#/locs', '#/trainers', '#/items', '#/walk', ...((await page.value(`!!(typeof CF!=='undefined'&&CF.calc)`)) ? ['#/calc'] : []), `#/p/${data.P[0].id}`];
    for (const hash of ['#/', ...rail]) {
      await page.goto(hash);
      assert.equal(await page.value(`document.querySelector('.rjump').hidden`), !rail.includes(hash), `${hash}: the rail ${rail.includes(hash) ? 'is hidden' : 'shows'}`);
    }
  },
});

await runChecks({ name: 'blocks', file, checks });

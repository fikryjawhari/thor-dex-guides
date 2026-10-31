// Calc layout: spec checks 1 (fit), 17 (long names), 18 (scroll stops), 19 (box size), 20 (wide window), 22 (big box),
// the two-line move rows and the short-wide page (template/README.md → Calc page), Field's box passing the wheel on.
// Each check runs at the sizes and modes the spec gives (see runChecks in tools/calc_check_lib.mjs). Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { dismissBanner, fixturePatches, guide, guideArg, pickCell, prepareGuide, runChecks, setupCalc, SIZE_SMALL, SIZE_STAR, tapField } from '../calc_check_lib.mjs';

const WIDE = [[480, 392], [537, 424], [832, 424]];
const SHORT = [[480, 316], [537, 360]];
const D = new Proxy({}, { get: (_, key) => guide().data[key] });

// The foe's card on three lines: Toxic (T box + residual), a battle state (Dig) and a fight change (+Ghost: Δ1).
const threeLineFoe = `(()=>{CALC.set('foe','status','tox');CALC.set('foe','fadd','Ghost');CALC.state().tgt[CALC.key('foe')]='dig';CALC.render();})()`;

// Every closed damaging row on two lines (template README → Calc page): at most 33 px; name, KO and min–max on line 1;
// range, odds and controls on line 2; nothing past the row's right edge; min–max and the range not clipped.
const rowShape = page => page.value(`(()=>{const bad=[];for(const r of document.querySelectorAll('.dres .mr:not(.st):not(.em):not(.open)')){const mm=r.querySelector('.mm'),a=mm.getBoundingClientRect(),n=r.querySelector('.mv').textContent.trim(),q=s=>mm.querySelector(s),rc=e=>e.getBoundingClientRect(),mv=rc(q('.mv')),hp=q('.hp'),ko=q('.ko');
 if(a.height>33.5)bad.push(n+': '+a.height+' px');
 if(Math.abs(rc(hp).top-mv.top)>2)bad.push(n+': .hp not on line 1');
 if(ko&&ko.textContent.trim()&&Math.abs(rc(ko).top-mv.top)>2)bad.push(n+': .ko not on line 1');
 for(const e of mm.querySelectorAll('.r2>*:not(.ko)'))if(rc(e).width&&rc(e).top<mv.bottom-1)bad.push(n+': '+e.className+' not on line 2');
 for(const e of mm.querySelectorAll('.r1 *,.r2 *'))if(rc(e).width&&rc(e).right>a.right+0.5)bad.push(n+': '+(e.className||e.tagName)+' past the right edge');
 const pc=[...mm.querySelectorAll('.r2>span')].find(x=>/%$/.test(x.textContent.trim()));for(const e of [hp,pc])if(e&&e.scrollWidth>e.clientWidth+0.5)bad.push(n+': '+e.className+' clipped');}
 return bad;})()`);

// A custom attacker (Blissey or a Normal type) at level 50 with these moves and item against the four-Pokémon trainer.
const attackerName = () => (D.P.find(e => e.n === 'Blissey') ? 'Blissey' : D.P.find(e => e.t.length === 1 && e.t[0] === 'Normal').n);
const attacker = (moves, item = '') => `(()=>{CALC.use(P.find(e=>e.n===${JSON.stringify(attackerName())}));const s=CALC.state(),m=s.custom.at(-1);m.l=50;m.i=${JSON.stringify(item)};m.m=${JSON.stringify(moves)}.filter(n=>M.includes(n)).map(n=>M.indexOf(n));CALC.enter(${JSON.stringify(guide().trainers.four?.k)},0);s.dir='out';CALC.render();})()`;
const longMoveOf = () => ['Light That Burns the Sky', ...D.M.map((n, i) => [n, D.MV[i]]).filter(([, m]) => m?.bp > 1 && m.c !== 'Status').map(([n]) => n).sort((a, b) => b.length - a.length)].find(n => D.M.includes(n));
const rowOf = name => `[...document.querySelectorAll('.dres:not(.na) .mr')].find(r=>r.querySelector('.mv')?.textContent.trim()===${JSON.stringify(name)})`;

// The page passes the wheel on: over Field's open box, scrolled to its end, the page itself scrolls.
async function wheelOverField(page) {
  await setupCalc(page);
  await page.value(`document.querySelector('details.dfield').open=true`);
  await page.settle();
  await page.value(`(()=>{const f=document.querySelector('details.dfield');scrollTo(0,f.getBoundingClientRect().top+scrollY-innerHeight/2);})()`);
  await page.settle();
  const at = await page.value(`(()=>{const b=document.querySelector('details.dfield .dfb').getBoundingClientRect();return {x:b.left+b.width/2,y:Math.max(b.top+4,Math.min(b.bottom-4,innerHeight/2)),max:document.documentElement.scrollHeight-innerHeight};})()`);
  let tried = 0;
  for (const [dy, dir] of [[-120, 'up'], [120, 'down']]) {
    const before = await page.value('scrollY');
    if (dy < 0 ? before <= 0 : before >= at.max) continue;
    tried++;
    await page.value(`(()=>{const b=document.querySelector('details.dfield .dfb');b.scrollTop=${dy < 0 ? 0 : 'b.scrollHeight'};})()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: at.x, y: at.y, deltaX: 0, deltaY: dy });
    await page.value('new Promise(r=>setTimeout(r,300))');
    const after = await page.value('scrollY');
    assert(dy < 0 ? after < before : after > before, `wheel ${dir} over Field's box at its end: the page stays at ${before} (now ${after})`);
  }
  assert(tried, 'the page can scroll from Field at all');
}

// Same for the box grid (61 Pokémon): scrolled to its end, the wheel over it scrolls the page.
async function wheelOverGrid(page) {
  await setupCalc(page);
  await page.value('scrollTo(0,0)');
  await page.settle();
  const at = await page.value(`(()=>{const g=document.querySelector('.mg .dstrip');g.scrollTop=g.scrollHeight;const r=g.getBoundingClientRect();return {over:g.scrollHeight>g.clientHeight,x:r.left+r.width/2,y:Math.min(r.bottom-4,innerHeight-4)};})()`);
  assert(at.over, 'the grid scrolls (the check has nothing to prove otherwise)');
  await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: at.x, y: at.y, deltaX: 0, deltaY: 120 });
  await page.value('new Promise(r=>setTimeout(r,300))');
  assert((await page.value('scrollY')) > 0, 'wheel down over the grid at its end: the page stays at the top');
}


// Every failing condition of a check, not only the first: one run then shows the whole picture.
function allOf(conditions) {
  const failed = conditions.filter(([ok]) => !ok).map(([, message]) => message);
  if (failed.length) throw new Error(failed.join('\n'));
}

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-layout', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-layout: no cfg.calc');
  process.exit(0);
}

const T = guide().trainers;
// The guide's two longest species names that the dvkb pad can type (letters and spaces; check 17 picks them as new sets).
const longest = guide().data.P.filter(entry => /^[A-Za-z ]+$/.test(entry.n)).sort((a, b) => b.n.length - a.n.length || a.n.localeCompare(b.n)).slice(0, 2).map(entry => entry.n);

// Check 18 body, shared by the spec's window (316 high) and a taller one (400) where the stops separate.
// The expected stops come from the spec's rule (Layout → Jump arrows), computed here from the DOM, not from CALC.stops().
const expectedStops = page => page.value(`(()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);const bar=document.querySelector('.fbar');const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];const field=document.querySelector('details.dfield');const v=[0];let end=null;if((innerWidth<480||innerHeight<392)&&bar){const top=bar.getBoundingClientRect().top+scrollY-2;v.push(top);end=rows.at(-1).getBoundingClientRect().bottom+scrollY-innerHeight+3;if(end>=top+24)v.push(end);else end=null;}if(field)v.push(field.getBoundingClientRect().top+scrollY-2);const c=v.map(x=>Math.round(Math.max(0,Math.min(max,x)))).sort((a,b)=>a-b);const out=[];for(const x of c)if(!out.length||x-out.at(-1)>=24)out.push(x);return {stops:out,end:end===null?null:Math.round(Math.max(0,Math.min(max,end))),window:innerHeight};})()`);

// Walks the rail down through every stop and back up, checking each lands on its stop and the ends are disabled.
async function walkStops(page, stops) {
  for (let i = 1; i < stops.length; i++) {
    await page.tap('.rjump [data-j="1"]');
    assert(Math.abs((await page.value('scrollY')) - stops[i]) <= 1, `down to stop ${i} lands at ${await page.value('scrollY')}, want ${stops[i]}`);
  }
  if (stops.length > 1) assert.equal(await page.value('document.querySelector(\'.rjump [data-j="1"]\').disabled'), true, 'down is disabled at the last stop');
  for (let i = stops.length - 2; i >= 0; i--) {
    await page.tap('.rjump [data-j="-1"]');
    assert(Math.abs((await page.value('scrollY')) - stops[i]) <= 1, `up to stop ${i} lands at ${await page.value('scrollY')}, want ${stops[i]}`);
  }
  assert.equal(await page.value('scrollY'), 0, 'up returns to the top');
  assert.equal(await page.value('document.querySelector(\'.rjump [data-j="-1"]\').disabled'), true, 'up is disabled at the top');
}

async function scrollStops(page) {
  await setupCalc(page);
  await page.value('scrollTo(0,0)');
  await page.settle();
  const want = await expectedStops(page);
  const stops = await page.value('CALC.stops()');
  assert.deepEqual(stops, want.stops, `CALC.stops() ${JSON.stringify(stops)}, the rule gives ${JSON.stringify(want.stops)} (window ${want.window}, last row at the bottom ${want.end})`);
  await walkStops(page, stops);
  // Field open: its stop joins the list (or merges with a stop within 24 px), the rule still holds.
  await page.value(`document.querySelector('details.dfield').open=true`);
  await page.settle();
  const openWant = await expectedStops(page);
  const openStops = await page.value('CALC.stops()');
  assert.deepEqual(openStops, openWant.stops, `Field open: CALC.stops() ${JSON.stringify(openStops)}, the rule gives ${JSON.stringify(openWant.stops)}`);
  await walkStops(page, openStops);
  await page.value(`document.querySelector('details.dfield').open=false`);
  await page.settle();
  // When the last move row is the stop (the fourth-move stop), it puts that row on the bottom edge.
  if (want.end !== null && stops.includes(want.end)) {
    await page.value(`scrollTo(0,0)`);
    await page.settle();
    for (let i = 0; i < stops.indexOf(want.end); i++) await page.tap('.rjump [data-j="1"]');
    const bottom = await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr')].at(-1).getBoundingClientRect().bottom`);
    assert(Math.abs(bottom - (innerHeight - 3)) <= 2, `fourth move row bottom ${bottom} at the end stop, want ${innerHeight - 3}`);
  }
}

const checks = [
  {
    id: '1 fit',
    title: 'trainer bar at the top, foe card on three lines (Toxic, Dig, Δ1): the four rows end within the window (both columns when wide); battle-state row 20 px',
    sizes: [[260, 316], [260, 350], [480, 316], [480, 392], [537, 424], [832, 424]],
    run: async page => {
      await setupCalc(page);
      await page.value(threeLineFoe);
      await page.settle();
      assert.equal(await page.value(`document.querySelector('.cc[data-s=foe] .dfxn')?.textContent`), 'Δ1', 'the foe card has a fight change');
      if (page.width < 480) assert.equal(await page.value(`Math.round(document.querySelector('.dfight select').getBoundingClientRect().height)`), 20, 'battle-state row 20 px');
      await page.value(`scrollTo(0, document.querySelector('.fbar').getBoundingClientRect().top + scrollY - 2)`);
      await page.settle();
      const m = await page.value(`(()=>{const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];return {bar:document.querySelector('.fbar').getBoundingClientRect().top,rows:rows.length,bottom:rows.at(-1)?.getBoundingClientRect().bottom??null,edits:document.querySelectorAll('.ed').length,height:innerHeight};})()`);
      assert.equal(m.edits, 0, 'Edit is closed');
      const atEnd = await page.value('Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<=1');
      assert(Math.abs(m.bar - 2) < 2 || (atEnd && m.bar > 2), `trainer bar at ${m.bar}, want 2 (or the page scrolled to its end)`);
      assert.equal(m.rows, 4, 'attacker rows');
      // Z-move guides have 36 px rows: the fourth row ends inside the window, not 12 px above it (template README → Z-moves).
      const limit = page.height;
      assert(m.bottom <= limit, `fourth move row bottom ${m.bottom} is past ${limit}`);
      if (page.width >= 480) {
        const cols = await page.value(`[...document.querySelectorAll('.dres')].map(d=>[...d.querySelectorAll('.mr')].at(-1)?.getBoundingClientRect().bottom??0)`);
        assert(cols.every(b => b <= limit), `a column's fourth row ends past ${limit}: ${cols}`);
      }
    },
  },
  {
    id: '17 long names',
    title: 'names truncate on one line inside their boxes, with a 1.2 line box',
    run: async page => {
      await setupCalc(page, { trainer: T.longName.k });
      for (const name of longest) await pickMineCustom(page, name);
      const names = await page.value(`(()=>{const pick=(el,label)=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect(),box=el.closest('.cc,.fbar,.mr,.dsrc,.dmatch,.fit')?.getBoundingClientRect();return {label,text:el.textContent.trim(),truncated:el.scrollWidth>el.clientWidth+0.5,nowrap:cs.whiteSpace==='nowrap',ellipsis:cs.textOverflow==='ellipsis',lineRatio:parseFloat(cs.lineHeight)/parseFloat(cs.fontSize),height:r.height,fontSize:parseFloat(cs.fontSize),padBottom:parseFloat(cs.paddingBottom),inside:box?r.right<=box.right+0.5:true};};
        const out=[];out.push(pick(document.querySelector('.fbar .nm'),'trainer'));
        for(const el of document.querySelectorAll('.dmatch .cc .cn b'))out.push(pick(el,'card'));
        for(const el of document.querySelectorAll('.dres:not(.na) .mr .mv'))out.push(pick(el,'move'));
        return out;})()`);
      assert(names.length >= 3, 'expected names on the page');
      const bad = names.filter(n => !n.nowrap || !n.inside || n.height > n.fontSize * 1.8 || n.lineRatio < 1.2 || (n.truncated && !n.ellipsis));
      assert.deepEqual(bad, [], 'names that wrap, leave their box, or have a line box under 1.2');
      console.log('     note: bottom padding (phone-preview note) ' + JSON.stringify(names.map(n => n.text + '=' + n.padBottom + 'px')));
      const trainer = names.find(n => n.label === 'trainer');
      assert(trainer.truncated, `"${trainer.text}" should truncate at this width (it did not: the check has nothing to prove)`);
      assert.match(trainer.text, /Petalburg/);
    },
  },
  {
    id: '18 scroll stops',
    title: 'rail up/down: top, the box above the trainer block, the trainer bar; collapse on a short page (short-wide too)',
    sizes: [...SIZE_SMALL, [480, 316]],
    run: scrollStops,
  },
  {
    id: '18c scroll stops, taller',
    title: 'diagnostic: the same rule at 260 x 400, where the stops separate',
    sizes: [[260, 400]],
    run: scrollStops,
  },
  {
    id: '18b short page stops',
    title: 'a short page (party only) has no two stops within 24 px',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page, { trainer: T.four.k, save: 'party-only.json' });
      await page.value('scrollTo(0,0)');
      await page.settle();
      const stops = await page.value('CALC.stops()');
      for (let i = 1; i < stops.length; i++) assert(stops[i] - stops[i - 1] >= 24, `stops too close: ${JSON.stringify(stops)}`);
      if (stops.length > 1) {
        await page.tap('.rjump [data-j="1"]');
        assert(Math.abs((await page.value('scrollY')) - stops[1]) <= 1, 'down goes to the next distinct stop');
      }
    },
  },
  {
    id: '19 box size',
    title: 'box cells 28 px, six per row, no divider lines; team cells match the foe strip (24 px, same sprite size)',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page);
      const m = await page.value(`(()=>{const media=e=>{const i=e?.querySelector('img,svg,canvas');if(!i)return null;const r=i.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];};const box=[...document.querySelectorAll('.mg .dstrip button')];const top0=box[0].getBoundingClientRect().top;const team=[...document.querySelectorAll('.dteamrow button[data-t]')];const foe=[...document.querySelectorAll('.dfoe .dstrip button:not(.ph)')];return {boxH:box[0].getBoundingClientRect().height,perRow:box.filter(c=>Math.abs(c.getBoundingClientRect().top-top0)<1).length,dividers:document.querySelectorAll('.mg hr,.dside hr,.mg .sep').length,strip:getComputedStyle(document.querySelector('.mg .dstrip')).borderTopWidth,teamH:team[0]?.getBoundingClientRect().height??null,foeH:foe[0]?.getBoundingClientRect().height??null,teamMedia:media(team[0]),foeMedia:media(foe[0])};})()`);
      allOf([
        [m.boxH === 28, `box cell height ${m.boxH}, want 28`],
        [m.perRow === 6, `box cells per row ${m.perRow}`],
        [m.dividers === 0, `divider lines ${m.dividers}`],
        [m.strip === '0px', 'border on the grid'],
        [m.teamH === 24 && m.foeH === 24, `team cell ${m.teamH} vs foe strip cell ${m.foeH}, want 24 and 24`],
        [JSON.stringify(m.teamMedia) === JSON.stringify(m.foeMedia), `sprite size team ${m.teamMedia} vs foe strip ${m.foeMedia}`],
      ]);
    },
  },
  {
    id: '20 wide columns',
    title: 'wide window: two equal columns, both movesets aligned, grid scrolls inside its card',
    sizes: WIDE,
    run: async (page, { height }) => {
      await setupCalc(page);
      await page.value('scrollTo(0,0)');
      await page.settle();
      const m = await page.value(`(()=>{const widths=s=>[...document.querySelectorAll(s)].map(e=>Math.round(e.getBoundingClientRect().width*10)/10);const mine=[...document.querySelectorAll('.dres:not(.na) .mr')].map(e=>e.getBoundingClientRect());const foe=[...document.querySelectorAll('.dres.na .mr')].map(e=>e.getBoundingClientRect());const grid=document.querySelector('.mg .dstrip');return {cols:widths('.top > .dbox, .top > .dside.dtrainer'),res:widths('.dmatch > .dres'),chips:widths('.dmatch > .cc'),mineRows:mine.length,foeRows:foe.length,mineTops:mine.map(r=>Math.round(r.top)),foeTops:foe.map(r=>Math.round(r.top)),rowHeights:mine.map(r=>Math.round(r.height)),fit:document.querySelector('.fit').getBoundingClientRect().height,innerH:innerHeight,gridOverflow:getComputedStyle(grid).overflowY,gridScrolls:grid.scrollHeight>grid.clientHeight,dfieldTop:document.querySelector('.dfield').getBoundingClientRect().top,rowsBottom:Math.max(...mine.map(r=>r.bottom),...foe.map(r=>r.bottom))};})()`);
      allOf([
        [m.cols.length === 2, `two columns, found ${m.cols.length}`],
        [Math.abs(m.cols[0] - m.cols[1]) < 0.5, `column widths ${m.cols}`],
        [Math.abs(m.res[0] - m.res[1]) < 0.5, `result widths ${m.res}`],
        [Math.abs(m.chips[0] - m.chips[1]) < 0.5, `card widths ${m.chips}`],
        [m.mineRows === 4, `attacker rows ${m.mineRows}`],
        [m.foeRows === 4, `defender rows ${m.foeRows} (both movesets are shown)`],
        [m.mineTops.every((top, i) => Math.abs(top - m.foeTops[i]) <= 1), `row tops differ: ${m.mineTops} vs ${m.foeTops}`],
        // The fit block leaves a 4 px margin top and bottom (8 px short of the window is accepted).
        [m.fit <= m.innerH && m.fit >= m.innerH - 9, `block height ${m.fit}, want the window ${m.innerH} less a 4 px margin top and bottom`],
        [['auto', 'scroll'].includes(m.gridOverflow) && m.gridScrolls, 'the Mine grid scrolls inside its card'],
        [m.dfieldTop >= m.innerH, `Field row starts at ${m.dfieldTop} of a ${m.innerH} px window: it should be below the fold (the block is ${m.fit} px)`],
        [m.rowsBottom <= m.innerH, `move rows end at ${m.rowsBottom}, past the window ${m.innerH}`],
      ]);
    },
  },
  {
    id: '20b foe team rows',
    title: 'six foe Pokémon: all six trainer rows inside the window at 480 x 392, 537 x 424 and 832 x 424, the list does not scroll',
    sizes: WIDE,
    run: async page => {
      await setupCalc(page, { trainer: T.six.k });
      await page.value('scrollTo(0,0)');
      await page.settle();
      const m = await page.value(`(()=>{const rows=[...document.querySelectorAll('.fteam .ft')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);const team=document.querySelector('.fteam');return {rows:rows.map(r=>[Math.round(r.top),Math.round(r.bottom)]),scroll:team?team.scrollHeight-team.clientHeight:null,innerH:innerHeight};})()`);
      assert.equal(m.rows.length, 6, 'six trainer rows visible');
      for (const [top, bottom] of m.rows) assert(top >= 0 && bottom <= m.innerH, `row ${top}-${bottom} is outside the ${m.innerH} px window`);
      assert(m.scroll !== null && m.scroll <= 1, `the trainer list scrolls by ${m.scroll} px, want none`);
    },
  },
  {
    id: '20c resize',
    title: 'resizing 537 wide between 392 and 424 high: six rows inside the window at every height, the list never scrolls or switches',
    sizes: [[537, 424]],
    run: async page => {
      await setupCalc(page, { trainer: T.six.k });
      const probe = `(()=>{const rows=[...document.querySelectorAll('.fteam .ft')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);const team=document.querySelector('.fteam');return {n:rows.length,inside:rows.every(r=>r.bottom<=innerHeight),scroll:team?team.scrollHeight-team.clientHeight:null,tl:document.getElementById('app').classList.contains('tl'),h:innerHeight};})()`;
      const heights = [];
      for (let h = 392; h <= 424; h += 4) heights.push(h);
      const down = heights.slice().reverse();
      for (const order of [heights, down]) {
        for (const h of order) {
          await page.resize(537, h);
          await page.settle();
          const m = await page.value(probe);
          assert.equal(m.h, h, `window ${m.h}, want ${h}`);
          assert.equal(m.n, 6, `at ${h} high: ${m.n} trainer rows visible, want 6`);
          assert(m.inside, `at ${h} high: a trainer row ends below the window`);
          assert(m.scroll !== null && m.scroll <= 1, `at ${h} high: the list scrolls by ${m.scroll} px`);
          assert.equal(m.tl, false, `at ${h} high: the page switched to a list-only view`);
        }
      }
    },
  },
  {
    id: '22 big box',
    title: '61 Pokémon: the grid card is at most 136 px and scrolls; the page grows only by the grid, up to its cap',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page, { trainer: T.four.k, save: 'eleven.json' });
      await page.value('scrollTo(0,0)');
      const eleven = await page.value(`({doc:document.documentElement.scrollHeight,gridH:document.querySelector('.mg .dstrip').getBoundingClientRect().height})`);
      await page.importSave('good.json');
      await dismissBanner(page);
      // the import selects party slot 0: back to the same attacker (slot 5), so only the box differs between the two
      await pickCell(page, 'party', 5);
      await page.value('scrollTo(0,0)');
      await page.settle();
      const m = await page.value(`(()=>{const grid=document.querySelector('.mg .dstrip');const cells=[...document.querySelectorAll('.mg .dstrip button')];const bottom=i=>cells[i]?.getBoundingClientRect().bottom??null;return {doc:document.documentElement.scrollHeight,gridH:grid.getBoundingClientRect().height,overflow:getComputedStyle(grid).overflowY,scrolls:grid.scrollHeight>grid.clientHeight,cells:cells.length,fourthRow:bottom(23)??bottom(cells.length-1),foeBar:document.querySelector('.fbar').getBoundingClientRect().bottom,foeTeam:document.querySelector('.dside:not(.mg) .dstrip').getBoundingClientRect().bottom,h:innerHeight};})()`);
      // Fewer Pokémon make the grid shorter (Layout: 11 is two rows), so the page may only grow by the grid's own growth
      // up to its 136 px cap: the box never lengthens the page beyond four rows.
      allOf([
        [m.cells === 61, `grid cells ${m.cells}`],
        [m.gridH <= 136, `grid card ${m.gridH}px, want at most 136`],
        [['auto', 'scroll'].includes(m.overflow) && m.scrolls, 'the grid scrolls by touch'],
        [m.doc - eleven.doc <= m.gridH - eleven.gridH + 1, `page ${m.doc}px with 61 vs ${eleven.doc}px with 11 grows more than the grid (${eleven.gridH} → ${m.gridH}px)`],
        [m.foeBar <= m.h && m.foeTeam <= m.h, `foe bar ${m.foeBar} / team ${m.foeTeam} should be on screen (${m.h})`],
        [m.fourthRow <= m.h, `the grid's fourth row ends at ${m.fourthRow}, past ${m.h}`],
      ]);
    },
  },
  {
    id: 'two-line rows',
    title: 'closed damaging rows: two lines, KO on line 1, nothing past the row; a long move name truncates first',
    sizes: [...SIZE_STAR, [480, 316]],
    run: async page => {
      await setupCalc(page);
      allOf((await rowShape(page)).map(text => [false, text]));
      const longMove = longMoveOf();
      await page.value(attacker([longMove, 'Tackle', 'Fire Fang', 'Body Slam']));
      await page.settle();
      const long = await page.value(`(()=>{const r=${rowOf(longMove)},v=r.querySelector('.mv'),h=r.querySelector('.hp');return {cut:v.scrollWidth>v.clientWidth,hp:h.scrollWidth<=h.clientWidth+0.5,st:r.classList.contains('st')};})()`);
      assert(!long.st, `${longMove} is a damaging row`);
      if (page.width < 480) assert(long.cut, `${longMove} should truncate at ${page.width}`);
      assert(long.hp, `${longMove}: min–max not clipped`);
      allOf((await rowShape(page)).map(text => [false, text]));
    },
  },
  {
    id: 'edge rows',
    title: 'HP chip + odds, H1 / ×n, Z on, immune, Protected, fainted: still two lines inside the row',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page);
      const failed = [];
      const shape = async label => failed.push(...(await rowShape(page)).map(text => `${label}: ${text}`));
      // HP chip + odds: Life Orb recoil beside Fire Fang's odds, a drain move; multi-hit: Bullet Seed's H1 / ×n.
      await page.value(attacker(['Fire Fang', 'Giga Drain', 'Bullet Seed', 'Tackle'], 'Life Orb'));
      await page.settle();
      await shape('HP chip + odds');
      if (D.M.includes('Bullet Seed')) assert(await page.value(`!!${rowOf('Bullet Seed')}?.querySelector('.rh')`), 'Bullet Seed has its hit buttons');
      // Z on (Z profiles): the first damaging row's Z pressed.
      if (await page.count('.dres:not(.na) .mr:not(.st) .rz')) {
        await page.tap('.dres:not(.na) .mr:not(.st) .rz');
        await shape('Z on');
        await page.tap('.dres:not(.na) .mr:not(.st) .rz');
      }
      // Immune: the foe's types for the fight set to one its attacker's move can't touch (the first pair the guide's chart honours).
      let immune = '';
      for (const [move, type] of [['Tackle', 'Ghost'], ['Earthquake', 'Flying'], ['Thunderbolt', 'Ground'], ['Psychic', 'Dark']].filter(([move]) => D.M.includes(move))) {
        await page.value(attacker(['Fire Fang', move, 'Bullet Seed', 'Giga Drain'], 'Life Orb'));
        await page.value(`(()=>{CALC.set('foe','ft',[${JSON.stringify(type)}]);CALC.render();})()`);
        await page.settle();
        if ((await page.value(`${rowOf(move)}?.querySelector('.hp').textContent.trim()`)) === 'No effect') { immune = move; break; }
      }
      assert(immune, 'an immune row (No effect)');
      await shape('immune');
      await page.value(`(()=>{CALC.set('foe','ft',undefined);CALC.render();})()`);
      // Protected: the defender's Protect in Field.
      await page.value(`document.querySelector('details.dfield').open=true`);
      await page.settle();
      const protect = await page.value(`[...document.querySelectorAll('[data-f]')].find(b=>/^Protect/.test(b.textContent.trim()))?.dataset.f??''`);
      if (protect) {
        await tapField(page, protect);
        if (await page.value(`[...document.querySelectorAll('.dres .mr .hp')].some(h=>/Protected/.test(h.textContent))`)) await shape('Protected');
        await tapField(page, protect);
      }
      await page.value(`document.querySelector('details.dfield').open=false`);
      // Fainted.
      await page.value(`(()=>{CALC.set('foe','hp',0);CALC.render();})()`);
      await page.settle();
      assert(await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr .ko')].some(k=>k.textContent.trim()==='fainted')`), 'fainted KO text');
      await shape('fainted');
      allOf(failed.map(text => [false, text]));
    },
  },
  {
    id: 'short wide',
    title: '480+ wide, under 392 tall: no trainer list, foe strip of six, trainer bar and battle state on one line, lands on the trainer bar, Field right under the rows',
    sizes: SHORT,
    run: async (page, { dvkb }) => {
      await setupCalc(page);
      await page.value(`CALC.enter(${JSON.stringify(T.four.k)},0)`);
      await page.settle();
      await page.value('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      const m = await page.value(`(()=>{const q=s=>document.querySelector(s),r=s=>q(s)?.getBoundingClientRect(),bar=r('.fbar'),fight=r('.dfight'),cells=[...document.querySelectorAll('.dfoe .dstrip button')].map(b=>b.getBoundingClientRect()),rows=[...document.querySelectorAll('.dres')].map(d=>[...d.querySelectorAll('.mr')].at(-1).getBoundingClientRect().bottom),field=r('details.dfield');return {short:document.body.classList.contains('calc-short'),fteam:q('.fteam')?getComputedStyle(q('.fteam')).display:'none',foe:getComputedStyle(q('.dfoe')).display,cells:cells.length,oneRow:cells.every(c=>Math.abs(c.top-cells[0].top)<1),barTop:bar.top,atEnd:Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<=1,shareLine:Math.abs(bar.top-fight.top)<=4&&bar.right<=fight.left+1,gap:field.top-Math.max(...rows),sideways:document.documentElement.scrollWidth>innerWidth+1};})()`);
      allOf([
        [m.short, 'body.calc-short is set'],
        [m.fteam === 'none', `trainer list shows (${m.fteam})`],
        [m.foe !== 'none' && m.cells >= 1 && m.oneRow, `foe strip: ${m.foe}, ${m.cells} cells, one row ${m.oneRow}`],
        [m.shareLine, 'trainer bar and battle-state row share a line'],
        [Math.abs(m.barTop - 2) <= 2 || (m.atEnd && m.barTop > 2), `opening the calc scrolls to the trainer bar or as far as the page goes (bar at ${m.barTop})`],
        [m.gap >= 0 && m.gap <= 4, `Field ${m.gap} px under the rows, want at most 4`],
        [!m.sideways, 'no sideways scroll'],
      ]);
      // A taller window leaves it; back under 392 tall it returns, but not while a calc input has focus.
      const height = page.height;
      await page.resize(page.width, 424);
      assert.equal(await page.value(`document.body.classList.contains('calc-short')`), false, 'no short-wide at 424 tall');
      // (dvkb: the HP box is the viewer's pad, not an input, and the viewer never resizes: nothing to hold)
      if (dvkb) return;
      await page.value(`document.querySelector('.cc [data-hp]').focus()`);
      await page.resize(page.width, height);
      assert.equal(await page.value(`document.body.classList.contains('calc-short')`), false, 'held while the HP box has focus');
      await page.value(`document.activeElement.blur()`);
      await page.resize(page.width, height + 1);
      assert.equal(await page.value(`document.body.classList.contains('calc-short')`), true, 'short again once the box loses focus');
    },
  },
  {
    id: 'field wheel',
    title: 'the wheel over Field\'s open box scrolls the page once the box is at its end',
    sizes: [[260, 316], [480, 392]],
    modes: ['normal'],
    run: wheelOverField,
  },
  {
    id: 'grid wheel',
    title: 'the wheel over the box grid scrolls the page once the grid is at its end',
    sizes: [[260, 316], [480, 392]],
    modes: ['normal'],
    run: wheelOverGrid,
  },
];

// A custom set named by species, through the + New picker (typed search, then the first match).
async function pickMineCustom(page, species) {
  await page.tap('[data-a="newmon"]');
  await page.typeSearch(species);
  await page.tap('.mrow[data-i="0"]');
}

await runChecks({ name: 'calc-layout', file, checks });

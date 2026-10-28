// Calc layout: spec checks 1 (fit), 17 (long names), 18 (scroll stops), 19 (box size), 20 (wide window), 22 (big box).
// Each check runs at the sizes and modes the spec gives (see runChecks in tools/calc_check_lib.mjs). Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { dismissBanner, fixturePatches, guide, guideArg, pickCell, prepareGuide, runChecks, setupCalc, SIZE_SMALL, SIZE_STAR } from '../calc_check_lib.mjs';

const WIDE = [[480, 392], [537, 424], [832, 424]];

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
const expectedStops = page => page.value(`(()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);const bar=document.querySelector('.fbar');const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];const field=document.querySelector('details.dfield');const v=[0];let end=null;if(innerWidth<480&&bar){const top=bar.getBoundingClientRect().top+scrollY-2;v.push(top);end=rows.at(-1).getBoundingClientRect().bottom+scrollY-innerHeight+3;if(end>=top+24)v.push(end);else end=null;}if(field)v.push(field.getBoundingClientRect().top+scrollY-2);const c=v.map(x=>Math.round(Math.max(0,Math.min(max,x)))).sort((a,b)=>a-b);const out=[];for(const x of c)if(!out.length||x-out.at(-1)>=24)out.push(x);return {stops:out,end:end===null?null:Math.round(Math.max(0,Math.min(max,end))),window:innerHeight};})()`);

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
    title: 'trainer bar at the top: the attacker\'s four rows end within the window',
    sizes: SIZE_STAR,
    run: async page => {
      await setupCalc(page);
      await page.value(`scrollTo(0, document.querySelector('.fbar').getBoundingClientRect().top + scrollY - 2)`);
      await page.settle();
      const m = await page.value(`(()=>{const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];return {bar:document.querySelector('.fbar').getBoundingClientRect().top,rows:rows.length,bottom:rows.at(-1)?.getBoundingClientRect().bottom??null,edits:document.querySelectorAll('.ed').length,height:innerHeight};})()`);
      assert.equal(m.edits, 0, 'Edit is closed');
      assert(Math.abs(m.bar - 2) < 2, `trainer bar at ${m.bar}, want 2`);
      assert.equal(m.rows, 4, 'attacker rows');
      // Z-move guides have 36 px rows: the fourth row ends inside the window, not 12 px above it (template README → Z-moves).
      const limit = page.height;
      assert(m.bottom <= limit, `fourth move row bottom ${m.bottom} is past ${limit}`);
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
    title: 'rail up/down: top, the box above the trainer block, the trainer bar; collapse on a short page',
    sizes: SIZE_SMALL,
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
];

// A custom set named by species, through the + New picker (typed search, then the first match).
async function pickMineCustom(page, species) {
  await page.tap('[data-a="newmon"]');
  await page.typeSearch(species);
  await page.tap('.mrow[data-i="0"]');
}

await runChecks({ name: 'calc-layout', file, checks });

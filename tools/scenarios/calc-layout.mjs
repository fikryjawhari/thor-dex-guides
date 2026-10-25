// Calc layout: spec checks 1 (fit), 17 (long names), 18 (scroll stops), 19 (box size), 20 (wide window), 22 (big box).
// Each check runs at the sizes and modes the spec gives (see runChecks in tools/calc_check_lib.mjs). Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { dismissBanner, EI_TRAINERS, fixturePatches, guideArg, pickCell, prepareGuide, runChecks, setupCalc, SIZE_SMALL, SIZE_STAR } from '../calc_check_lib.mjs';

const WIDE = [[480, 392], [537, 424], [832, 424], [832, 316]];

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

// Check 18 body, shared by the spec's window (316 high, where the stops collapse) and a taller one (400) that separates them.
async function scrollStops(page) {
  await setupCalc(page);
  await page.value('scrollTo(0,0)');
  await page.settle();
  const stops = await page.value('CALC.stops()');
  const geometry = await page.value(`(()=>{const bar=document.querySelector('.fbar').getBoundingClientRect().top+scrollY;const last=[...document.querySelectorAll('.dres:not(.na) .mr')].at(-1).getBoundingClientRect().bottom+scrollY;return {bar:Math.round(bar),last:Math.round(last),window:innerHeight};})()`);
  // Stops 2 and 3 closer than 24 px collapse into one, and the trainer bar (the default view) is the one kept.
  const s2 = geometry.last - geometry.window + 3, s3 = geometry.bar - 2;
  if (Math.abs(s3 - s2) < 24) {
    assert.equal(stops.length, 2, `stops ${JSON.stringify(stops)}: stop 2 (${s2}) and the trainer bar (${s3}) are within 24 px and collapse`);
    assert(Math.abs(stops[1] - s3) <= 1, `the collapsed stop keeps the trainer bar at the top: ${stops[1]} vs ${s3}`);
    await page.tap('.rjump [data-j="1"]');
    assert(Math.abs((await page.value('scrollY')) - stops[1]) <= 1, 'down lands on the trainer bar');
    await page.tap('.rjump [data-j="-1"]');
    assert.equal(await page.value('scrollY'), 0, 'up returns to the top');
    return;
  }
  assert.equal(stops.length, 3, `stops ${JSON.stringify(stops)}: last row at the bottom would be ${geometry.last - geometry.window + 3}, trainer bar at the top ${geometry.bar - 2}; the 24 px rule keeps one of them (trainer block ${geometry.last - geometry.bar} px in a ${geometry.window} px window)`);
  assert.equal(stops[0], 0);
  await page.tap('.rjump [data-j="1"]');
  assert(Math.abs((await page.value('scrollY')) - stops[1]) <= 1, `down 1 lands at ${await page.value('scrollY')}, want stop 2 at ${stops[1]}`);
  const atStop2 = await page.value(`(()=>{const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];return {lastBottom:rows.at(-1).getBoundingClientRect().bottom,grid:document.querySelector('.mg').getBoundingClientRect().bottom,h:innerHeight};})()`);
  assert(Math.abs(atStop2.lastBottom - (atStop2.h - 3)) <= 2, `last move row at ${atStop2.lastBottom}, want the viewport bottom ${atStop2.h - 3}`);
  assert(atStop2.grid > 0, 'the box above should still show at stop 2');
  await page.tap('.rjump [data-j="1"]');
  // The bar at the top is stop 3 only where the page can scroll that far; a shorter page stops at its end (the nearest reachable one).
  const reach = await page.value(`(()=>({at:scrollY,max:document.documentElement.scrollHeight-innerHeight,bar:document.querySelector('.fbar').getBoundingClientRect().top+scrollY}))()`);
  const want = Math.min(reach.bar - 2, reach.max);
  assert(Math.abs(reach.at - want) <= 1, `stop 3 lands at ${reach.at}, want ${want} (the bar at the top, or the page end at ${reach.max})`);
  await page.tap('.rjump [data-j="1"]').catch(() => {});
  assert.equal(await page.value('document.querySelector(\'.rjump [data-j="1"]\').disabled'), true, 'down is disabled at the last stop');
  await page.tap('.rjump [data-j="-1"]');
  assert(Math.abs((await page.value('scrollY')) - stops[1]) <= 1, 'up returns to stop 2');
  await page.tap('.rjump [data-j="-1"]');
  assert.equal(await page.value('scrollY'), 0, 'up returns to the top');
  assert.equal(await page.value('document.querySelector(\'.rjump [data-j="-1"]\').disabled'), true, 'up is disabled at the top');
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
      const limit = page.height === 316 ? 304 : page.height - 8;
      assert(m.bottom <= limit, `fourth move row bottom ${m.bottom} is past ${limit}`);
    },
  },
  {
    id: '17 long names',
    title: 'names truncate on one line inside their boxes, with a 1.2 line box',
    run: async page => {
      await setupCalc(page, { trainer: EI_TRAINERS.longName });
      await pickMineCustom(page, 'Galarian Slowbro');
      await pickMineCustom(page, 'Mega Charizard X');
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
    title: 'diagnostic: the same stops at 260 x 400, where the 24 px rule keeps all three',
    sizes: [[260, 400]],
    run: scrollStops,
  },
  {
    id: '18b short page stops',
    title: 'a short page (party only) has no two stops within 24 px',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page, { trainer: EI_TRAINERS.candice, save: 'party-only.json' });
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
    title: 'grid cells match the trainer strip; six per row; no divider lines',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page);
      const m = await page.value(`(()=>{const cells=[...document.querySelectorAll('.mg .dstrip button')];const foe=[...document.querySelectorAll('.dside:not(.mg) .dstrip button:not(.ph)')];const media=e=>{const i=e.querySelector('img,svg,canvas');if(!i)return null;const r=i.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];};const top0=cells[0].getBoundingClientRect().top;return {cellH:cells[0].getBoundingClientRect().height,foeH:foe[0]?.getBoundingClientRect().height,cellMedia:media(cells[0]),foeMedia:media(foe[0]),perRow:cells.filter(c=>Math.abs(c.getBoundingClientRect().top-top0)<1).length,dividers:document.querySelectorAll('.mg hr,.dside hr,.mg .sep').length,strip:getComputedStyle(document.querySelector('.mg .dstrip')).borderTopWidth};})()`);
      assert.equal(m.cellH, m.foeH, 'cell height vs the trainer strip');
      assert.deepEqual(m.cellMedia, m.foeMedia, 'sprite size vs the trainer strip');
      assert.equal(m.perRow, 6, 'cells per row');
      assert.equal(m.dividers, 0, 'divider lines');
      assert.equal(m.strip, '0px', 'border on the grid');
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
      const m = await page.value(`(()=>{const widths=s=>[...document.querySelectorAll(s)].map(e=>Math.round(e.getBoundingClientRect().width*10)/10);const mine=[...document.querySelectorAll('.dres:not(.na) .mr')].map(e=>e.getBoundingClientRect());const foe=[...document.querySelectorAll('.dres.na .mr')].map(e=>e.getBoundingClientRect());const grid=document.querySelector('.mg .dstrip');return {cols:widths('.top > .dside'),res:widths('.dmatch > .dres'),chips:widths('.dmatch > .cc'),mineRows:mine.length,foeRows:foe.length,mineTops:mine.map(r=>Math.round(r.top)),foeTops:foe.map(r=>Math.round(r.top)),rowHeights:mine.map(r=>Math.round(r.height)),fit:document.querySelector('.fit').getBoundingClientRect().height,innerH:innerHeight,gridOverflow:getComputedStyle(grid).overflowY,gridScrolls:grid.scrollHeight>grid.clientHeight,dfieldTop:document.querySelector('.dfield').getBoundingClientRect().top,rowsBottom:Math.max(...mine.map(r=>r.bottom),...foe.map(r=>r.bottom))};})()`);
      allOf([
        [m.cols.length === 2, `two columns, found ${m.cols.length}`],
        [Math.abs(m.cols[0] - m.cols[1]) < 0.5, `column widths ${m.cols}`],
        [Math.abs(m.res[0] - m.res[1]) < 0.5, `result widths ${m.res}`],
        [Math.abs(m.chips[0] - m.chips[1]) < 0.5, `card widths ${m.chips}`],
        [m.mineRows === 4, `attacker rows ${m.mineRows}`],
        [m.foeRows === 4, `defender rows ${m.foeRows} (both movesets are shown)`],
        [m.mineTops.every((top, i) => Math.abs(top - m.foeTops[i]) <= 1), `row tops differ: ${m.mineTops} vs ${m.foeTops}`],
        [Math.abs(m.fit - (m.innerH - 8)) <= 1, `block height ${m.fit}, want the window ${m.innerH - 8}`],
        [['auto', 'scroll'].includes(m.gridOverflow) && m.gridScrolls, 'the Mine grid scrolls inside its card'],
        [m.dfieldTop >= m.innerH, `Field row starts at ${m.dfieldTop} of a ${m.innerH} px window: it should be below the fold (the block is ${m.fit} px)`],
        [m.rowsBottom <= m.innerH, `move rows end at ${m.rowsBottom}, past the window ${m.innerH}`],
      ]);
    },
  },
  {
    id: '20b foe list or strip',
    title: 'six foe Pokémon: list at 537 and 832 wide by 424 high, strip at 480 by 392 and 832 by 316',
    sizes: WIDE,
    run: async (page, { width, height }) => {
      await setupCalc(page, { trainer: EI_TRAINERS.flannery });
      const m = await page.value(`(()=>{const app=document.getElementById('app');const card=document.querySelector('.dside:not(.mg)').getBoundingClientRect();const visible=r=>r.width>0&&r.height>0;const list=[...document.querySelectorAll('.fteam .ft')].map(e=>e.getBoundingClientRect()).filter(visible);const strip=[...document.querySelectorAll('.dside:not(.mg) .dstrip button:not(.ph)')].map(e=>e.getBoundingClientRect()).filter(visible);const team=document.querySelector('.fteam');return {tl:app.classList.contains('tl'),avail:+app.dataset.avail,card:{top:card.top,bottom:card.bottom},list:list.map(r=>[r.top,r.bottom]),strip:strip.map(r=>[r.top,r.bottom,r.left,r.right]),teamScroll:team?team.scrollHeight-team.clientHeight:null,innerH:innerHeight,innerW:innerWidth};})()`);
      const wantList = (width === 537 || width === 832) && height === 424;
      assert.equal(m.tl, wantList, `team list ${m.tl}, want ${wantList} (available ${m.avail})`);
      if (wantList) {
        assert.equal(m.list.length, 6, 'six list rows visible');
        for (const [top, bottom] of m.list) assert(top >= m.card.top - 0.5 && bottom <= m.card.bottom + 0.5, `list row ${top}-${bottom} is outside the card ${m.card.top}-${m.card.bottom}`);
        assert.equal(m.teamScroll, 0, 'the list does not scroll');
        assert.equal(m.strip.length, 0, 'the strip is hidden under the list');
      } else {
        assert.equal(m.strip.length, 6, 'six sprites in the strip');
        for (const [top, bottom] of m.strip) assert(bottom <= m.innerH && top >= 0, `sprite at ${top}-${bottom} is off screen`);
      }
    },
  },
  {
    id: '20c resize',
    title: 'resizing across the 222 px threshold switches the foe view once, with no loop',
    sizes: [[537, 424]],
    run: async page => {
      await setupCalc(page, { trainer: EI_TRAINERS.flannery });
      const tl = () => page.value(`document.getElementById('app').classList.contains('tl')`);
      const sweep = async heights => {
        const seen = [];
        for (const h of heights) {
          await page.resize(537, h);
          seen.push(await tl());
        }
        return seen;
      };
      const down = [];
      for (let h = 424; h >= 316; h -= 4) down.push(h);
      const up = down.slice().reverse();
      const seenDown = await sweep(down);
      const seenUp = await sweep(up);
      const switches = seq => seq.slice(1).filter((value, i) => value !== seq[i]).length;
      assert(seenDown.includes(true) && seenDown.includes(false), `the sweep down should cross the threshold: ${seenDown.join(',')}`);
      assert(switches(seenDown) <= 1, `down: ${switches(seenDown)} switches (${seenDown.join(',')})`);
      assert(switches(seenUp) <= 1, `up: ${switches(seenUp)} switches (${seenUp.join(',')})`);
    },
  },
  {
    id: '22 big box',
    title: '61 Pokémon: the grid card is at most 136 px and scrolls; the page grows only by the grid, up to its cap',
    sizes: SIZE_SMALL,
    run: async page => {
      await setupCalc(page, { trainer: EI_TRAINERS.candice, save: 'eleven.json' });
      await page.value('scrollTo(0,0)');
      const eleven = await page.value(`({doc:document.documentElement.scrollHeight,gridH:document.querySelector('.mg .dstrip').getBoundingClientRect().height})`);
      await page.importSave('good.json');
      await dismissBanner(page);
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

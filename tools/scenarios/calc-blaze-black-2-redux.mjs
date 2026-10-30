import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/blaze-black-2-redux.html');
if (!existsSync(file)) {
  console.log('SKIP calc-blaze-black-2-redux: no built guide');
  process.exit(0);
}
const guide = readGuide(file).data;
if (guide.cfg.name !== 'Blaze Black 2 Redux' || !guide.cfg.calc) {
  console.log('SKIP calc-blaze-black-2-redux: requires its enabled calc profile');
  process.exit(0);
}
const entries = guide.cfg.calc.field;
const sizes = [[260, 316], [480, 392], [537, 424], [832, 424], [832, 316]];
const fieldKeys = `[...new Set([...document.querySelectorAll('[data-f]')].map(element=>element.dataset.f))].sort()`;
// The first trainer Pokemon with the Challenge level bug (sl below its shown level; notes.md → Damage calc).
const enterBugged = `(()=>{
  CALC.use(byId.snorlax);
  const mon=CALC.state().custom[0];
  mon.l=50;mon.m=[M.indexOf('Tackle')];
  const trainer=TRS.find(trainer=>trainer.p.some(mon=>Number.isFinite(mon.sl)&&mon.sl<mon.l));
  const slot=trainer.p.findIndex(mon=>Number.isFinite(mon.sl)&&mon.sl<mon.l);
  CALC.enter(trainer.k,slot);CALC.render();
  return {l:trainer.p[slot].l,sl:trainer.p[slot].sl};
})()`;
// The page's engine input for a side (calc.js toEngine, without the battle state).
const engine = `const eng=x=>({id:x.id,lv:x.l,...(x.sd?{sl:x.l-x.sd}:{}),nat:x.na,ab:x.a,it:'',st:'',iv:x.iv,ev:[0,0,0,0,0,0],stg:[0,0,0,0,0,0]});`;
const checks = [{
  id: 'bb2r profile',
  title: 'Gen V field controls, no EV row, and the level-bug marker at every viewer size',
  sizes,
  run: async page => {
    await page.route('#/calc');
    const bug = await page.value(enterBugged);
    assert.ok(await page.count('.dres .mr:not(.em)'), 'damage rows rendered');

    // Level bug: the foe card shows Lv l and s<sl>; stats are the ones at sl; Seismic Toss deals sl (hzla
    // handleFixedDamageMoves); the player's Pokemon is unaffected.
    const foe = await page.value(`(()=>{${engine}const m=CALC.mon('foe'),me=CALC.mon('mine'),F=CALC.state().field;
      const {sl,...shown}=eng(m);
      return {l:m.l,sd:m.sd,stats:DMG.stats(eng(m)),atSl:DMG.stats({...shown,lv:sl}),atL:DMG.stats(shown),
        toss:DMG.calc(eng(m),eng(me),{mv:M.indexOf('Seismic Toss')},F).max,
        mineToss:DMG.calc(eng(me),eng(m),{mv:M.indexOf('Seismic Toss')},F).max};})()`);
    assert.equal(foe.l, bug.l, 'shown level');
    assert.equal(foe.l - foe.sd, bug.sl, 'stat level kept');
    assert.deepEqual(foe.stats, foe.atSl, 'stats at the stat level');
    assert.notDeepEqual(foe.stats, foe.atL, 'not at the shown level');
    assert.equal(foe.toss, bug.sl, 'foe Seismic Toss deals the stat level');
    assert.equal(foe.mineToss, 50, 'player Seismic Toss deals its own level');
    // The marker: in the card from 480 px; under 480 the compact card hides it (with the level box) and the editor
    // shows it.
    const markerAt = `(()=>{const el=document.querySelector('.dsl');if(!el)return null;
      const box=el.getBoundingClientRect(),card=el.closest('.cc').getBoundingClientRect(),row=el.closest('.cl');
      return {text:el.textContent,n:document.querySelectorAll('.dsl').length,shown:box.width>0,inside:box.left>=card.left-0.5&&box.right<=card.right+0.5,rowFits:row.scrollWidth<=row.clientWidth+1};})()`;
    const compact = await page.value('innerWidth<480');
    let marker = await page.value(markerAt);
    assert.ok(marker, 'level-bug marker rendered');
    assert.equal(marker.n, 1, 'only the foe has the marker');
    assert.equal(marker.text, 's' + bug.sl);
    assert.equal(marker.shown, !compact, compact ? 'hidden on the compact card' : 'shown on the card');

    // EVless: the foe editor has no EV row.
    await page.value(`(()=>{const b=document.querySelector('.dsl').closest('.cc').querySelector('.stb');if(b.getAttribute('aria-expanded')!=='true')b.click();})()`);
    await page.settle();
    assert.equal(await page.count('[data-e="ev"]'), 0, 'no EV row');
    marker = await page.value(markerAt);
    assert.ok(marker.shown, 'marker shown with the editor open');
    assert.ok(marker.inside, 'marker inside its card');
    assert.ok(marker.rowFits, 'level row does not overflow');

    // Gen V field: Hail (no Snow), no terrain; Doubles adds its controls.
    const weather = entries.find(entry => entry.k === 'weather');
    assert.ok(weather.o.some(([value]) => value === 'Hail'));
    assert.ok(!weather.o.some(([value]) => value === 'Snow'));
    assert.ok(!entries.some(entry => entry.k === 'terrain'), 'no terrain in Gen V');
    await page.route('#/calc');
    await page.tap('.dfield > summary');
    assert.deepEqual(await page.value(fieldKeys), entries.filter(entry => !entry.doubles).map(entry => entry.k).sort());
    await page.tap('[data-f=gameType][data-value=Doubles]');
    assert.deepEqual(await page.value(fieldKeys), entries.map(entry => entry.k).sort());
  },
}, {
  id: 'level-bug card lines',
  title: "a level-bug foe's card (Hugh's Lv 50 Samurott, stats at 47) stays within three lines",
  sizes: [[260, 316], [480, 392]],
  run: async page => {
    await page.route('#/calc');
    const entered = await page.value(`(()=>{
      CALC.use(byId.snorlax);
      const mon=CALC.state().custom[0];mon.l=50;mon.m=[M.indexOf('Tackle')];
      const ok=x=>x.id==='samurott'&&Number.isFinite(x.sl)&&x.sl<x.l;
      const trainer=TRS.find(t=>t.n==='Hugh'&&t.p.some(ok));
      const slot=trainer.p.findIndex(ok);
      CALC.enter(trainer.k,slot);CALC.render();
      return {k:trainer.k,l:trainer.p[slot].l,sl:trainer.p[slot].sl};
    })()`);
    assert.ok(entered.sl < entered.l, 'a level-bug foe');
    await page.settle();
    // Lines of the closed foe card: its visible leaf boxes (the HP bar is not a line), grouped by overlap.
    const lines = await page.value(`(()=>{const card=[...document.querySelectorAll('.dmatch>.cc')].find(c=>c.querySelector('.dsl'));
      const boxes=[],walk=el=>{for(const child of el.children){if(child.matches('.dhpbar,.ed'))continue;const style=getComputedStyle(child);if(style.display==='none')continue;
        const kids=[...child.children].some(k=>getComputedStyle(k).display!=='none');const r=child.getBoundingClientRect();
        if(style.display==='contents'||kids&&!child.matches('button,label'))walk(child);else if(r.height&&r.width)boxes.push(r);}};
      walk(card);boxes.sort((a,b)=>a.top-b.top);let lines=0,bottom=-1e9;
      for(const r of boxes){if(r.top>=bottom-2){lines++;bottom=r.bottom;}else bottom=Math.max(bottom,r.bottom);}return lines;})()`);
    assert.ok(lines <= 3, `foe card takes ${lines} lines (Hugh ${entered.k}, Lv ${entered.l} stats ${entered.sl})`);
  },
}];
await runChecks({name: 'calc-blaze-black-2-redux', file, checks});

import assert from 'node:assert/strict';
import {guideArg, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/emerald-imperium.html');
const data = readGuide(file).data;
if (data.cfg.name !== 'Emerald Imperium' || !data.cfg.calc?.monControls) {
  console.log('SKIP calc-imperium: requires the refined Imperium profile');
  process.exit(0);
}
const ability = name => data.AB.findIndex(entry => entry[0] === name);
const sizes = [[260,316],[260,350],[480,392],[537,424],[832,424]];
const controls = '[data-ms="abilityOn"]';
await runChecks({name: 'calc-imperium', file, checks: [{
  id: 'individual-controls', title: 'per-mon state, category inversion and allied field persist without changing direction', sizes,
  run: async page => {
    await page.route('#/calc');
    await page.value(`(()=>{
      CALC.use(P.find(entry=>entry.n==='Snorlax'));
      const state=CALC.state(),mon=state.custom.at(-1),trainer=TRS[0];
      mon.a=${ability('Bull Rush')};mon.l=50;mon.m=[M.indexOf('Draco Barrage'),M.indexOf('Psychic')];
      TCAP[trainer.k]=50;
      CALC.enter(trainer.k,0);
      state.edits['foe:'+trainer.k+':0']={a:${ability('Illusion')}};
      const original=window.DMG.calc;window.__calcCalls=[];
      window.DMG.calc=(...args)=>{const result=original(...args);window.__calcCalls.push({args,result});return result;};
      CALC.render();
    })()`);
    assert.equal(await page.count(controls), 2, 'one state checkbox on each relevant mon');
    assert.equal(await page.value('CALC.state().dir'), 'out');
    const mine = controls + '[data-s="mine"]';
    const foe = controls + '[data-s="foe"]';
    await page.tap(mine);
    assert.equal(await page.value('CALC.state().custom.at(-1).abilityOn'), true);
    assert.equal(await page.value('CALC.state().dir'), 'out', 'own checkbox does not select another attacker');
    assert.ok(await page.value('window.__calcCalls.some(call=>call.args[0].abilityOn===true&&call.result?.notes.includes("First turn out"))'));
    await page.tap(foe);
    assert.equal(await page.value('CALC.state().dir'), 'out', 'foe checkbox does not switch attack direction');
    assert.equal(await page.value(`document.querySelector('${foe}').checked`), true);
    const label = await page.value('document.querySelector(".dres:not(.na) .dcategory").getAttribute("title")');
    assert.ok(label.includes('Auto'), label);
    await page.tap('.dres:not(.na) .mr:has([data-mo="invert"]) > .mm');
    await page.tap('.dres:not(.na) [data-mo="invert"]');
    const inverted = await page.value('document.querySelector(".dres:not(.na) .dcategory").getAttribute("title")');
    assert.ok(inverted.includes('Inverted'), inverted);
    assert.notEqual(label.split(' · ')[0], inverted.split(' · ')[0], 'category actually changes');
    await page.tap('.dres:not(.na) .mr:has([data-mo="invert"]) .r1');
    assert.equal(await page.value('document.querySelector(".dres:not(.na) .mr:has([data-mo=\'invert\']) ").classList.contains("open")'), false, 'move is actually collapsed');
    assert.equal(await page.value('document.querySelector(".dres:not(.na) .dcategory").getAttribute("title")'), inverted, 'inversion is visible even when collapsed');
    if (!page.dvkb && [260,832].includes(page.width)) await page.screenshot('calc-imperium-controls-' + page.width);
    await page.tap('.dfield > summary');
    await page.tap('[data-f=gameType][data-value=Doubles]');
    await page.tap('[data-f="atkEmperorPresence"]');
    assert.equal(await page.value('CALC.state().field.atkEmperorPresence'), 1);
    const snapshot = await page.value('JSON.stringify(CALC.state())');
    await page.reload();
    await page.route('#/calc');
    assert.equal(await page.value('JSON.stringify(CALC.state())'), snapshot, 'existing storage key preserves all new state');
    assert.equal(await page.value(`document.querySelector('${mine}').checked`), true);
    assert.equal(await page.value(`document.querySelector('${foe}').checked`), true);
    assert.equal(await page.value('document.querySelector(".dres:not(.na) .dcategory").getAttribute("title")'), inverted);
    await page.tap('.cc[data-s="mine"] [data-a="eopen"]');
    await page.value(`(()=>{const input=document.querySelector('[data-e="ab"][data-s="mine"]');input.selectedIndex=0;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    assert.equal(await page.count(mine), 0, 'irrelevant ability has no toggle');
    assert.equal(await page.value('CALC.state().custom.at(-1).abilityOn'), false, 'changing ability clears its battle state');
  },
}]});

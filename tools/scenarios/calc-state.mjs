import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, runChecks, setupCalc} from '../calc_check_lib.mjs';

const file=prepareGuide(guideArg(process.argv),{tag:'calc-state',edit:fixturePatches});
if(!file){console.log('SKIP calc-state: no cfg.calc');process.exit(0);}
await runChecks({name:'calc-state',file,checks:[{
  id:'card-state',title:'direct residuals, paired editors and stable team geometry',
  sizes:[[260,316],[260,350],[480,392],[537,424],[832,424]],
  run:async page=>{
    await setupCalc(page,{mine:['party',0]});
    const teamHeight=await page.value('document.querySelector(".top").offsetHeight');
    await page.value("CALC.state().field.weather='Sand';CALC.render()");
    assert.equal(await page.value('document.querySelector(".top").offsetHeight'),teamHeight,'residuals do not shrink the team');
    const before=await page.value('Number(document.querySelector("[data-hp=foe]").value)');
    await page.tap('[data-a=eot][data-s=foe]');
    assert.ok(await page.value('Number(document.querySelector("[data-hp=foe]").value)')<before,'amount applies a turn directly');
    await page.tap('[data-a=eopen][data-s=foe]');
    assert.equal(await page.count('.ed'),page.width>=480?2:1,'wide editors open together');
    assert.equal(await page.value('document.querySelector(".top").offsetHeight'),teamHeight,'Edit grows downward');
    assert.ok(await page.text('.cc[data-s=foe] .dfull'),'full form name in Edit');
    await page.value(`(()=>{const input=document.querySelector('[data-e=vol][data-s=foe]');input.value='dig';input.dispatchEvent(new Event('change'));})()`);
    assert.equal(await page.value('document.querySelector("[data-e=vol][data-s=foe]").value'),'dig');
    assert.ok(Object.values(await page.value('CALC.state().tgt')).includes('dig'),'target state persists per card');
    await page.tap('[data-a=eopen][data-s=foe]');
    assert.equal(await page.count('.ed'),0,'paired collapse');
    await page.tap('.dres:not(.na) .mr .mm');
    assert.ok(await page.value('document.querySelector(".dfield").getBoundingClientRect().top>=Math.max(...[...document.querySelectorAll(".dres")].map(element=>element.getBoundingClientRect().bottom))-1'),'Field follows expanded moves');
  },
}]});

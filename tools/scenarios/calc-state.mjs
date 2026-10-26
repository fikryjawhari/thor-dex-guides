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
},{
  id:'field-sides',title:'segmented format and stable side-specific engine inputs',
  run:async page=>{
    await setupCalc(page);
    await page.tap('.dfield > summary');
    await page.tap('[data-f=gameType][data-value=Doubles]');
    assert.equal(await page.value('CALC.state().field.gameType'),'Doubles');
    assert.equal(await page.value('document.querySelector("[data-value=Doubles]").getAttribute("aria-pressed")'),'true');
    assert.equal(await page.count('[data-field-side]'),2);
    await page.tap('[data-f=atkFocus]');
    const inputs=await page.value(`(()=>{const original=DMG.calc,calls=[];DMG.calc=(att,def,slot,field)=>{calls.push(field);return original(att,def,slot,field);};CALC.render();DMG.calc=original;return calls;})()`);
    assert.ok(inputs.some(field=>field.atkFocus===1&&!field.defFocus),'player Focus while attacking');
    assert.ok(inputs.some(field=>field.defFocus===1&&!field.atkFocus),'player Focus while defending');
    await page.tap('.cc[data-s=foe] .cn');
    assert.equal(await page.value('CALC.state().field.atkFocus'),1,'side does not follow attacker selection');
    await page.reload();
    assert.equal(await page.value('CALC.state().field.atkFocus'),1,'canonical field persists');
  },
}]});

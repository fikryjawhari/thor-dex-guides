import assert from 'node:assert/strict';
import {fixturePatches, guideArg, prepareGuide, readGuide, runChecks, setupCalc} from '../calc_check_lib.mjs';

const file=prepareGuide(guideArg(process.argv),{tag:'calc-state',edit:fixturePatches});
if(!file){console.log('SKIP calc-state: no cfg.calc');process.exit(0);}
const guide=readGuide(file).data;
const fixtureChecks=[{
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
}];
const seed=async(page,moves)=>{
  await page.route('#/calc');
  await page.value(`(()=>{CALC.use(byId.snorlax);const state=CALC.state(),mon=state.custom.at(-1),trainer=TRS.find(trainer=>trainer.p.length);mon.l=50;mon.m=${JSON.stringify(moves)}.map(name=>M.indexOf(name));TCAP[trainer.k]=50;CALC.enter(trainer.k,0);state.edits['foe:'+trainer.k+':0']={id:byId.snorlax.id,l:50,a:byId.snorlax.a[0],i:'',m:[M.indexOf('Tackle')],stg:[0,0,0,0,0]};CALC.render();})()`);
};
const checks=[...(guide.cfg.name==='Emerald Imperium'?fixtureChecks:[]),{
  id:'move-states',title:'row state cycles, power, Doubles gate, Z suppression and persistence',sizes:[[260,316],[537,424]],
  run:async page=>{
    await seed(page,['Fury Cutter','Assurance','Round','Facade']);
    const row='.dres:not(.na) .mr';
    const heights=await page.value(`[...document.querySelectorAll('${row}')].map(element=>element.offsetHeight)`);
    assert.ok(heights.every(height=>height===heights[3]),'state controls add no row height');
    assert.equal(await page.count(`${row}:nth-child(3) [data-a=state]`),0,'combo hidden in Singles');
    if(guide.cfg.calc.over?.state?.['Fury Cutter']!==false){
      const before=Number(await page.value(`document.querySelector('${row}:nth-child(1) [data-mo=bp]').value`));
      await page.tap(`${row}:nth-child(1) [data-a=state]`);
      assert.equal(await page.text(`${row}:nth-child(1) [data-a=state]`),'1');
      assert.equal(Number(await page.value(`document.querySelector('${row}:nth-child(1) [data-mo=bp]').value`)),Math.min(160,before*2));
    }
    await page.tap(`${row}:nth-child(2) [data-a=state]`);
    assert.equal(await page.value(`document.querySelector('${row}:nth-child(2) [data-a=state]').getAttribute('aria-pressed')`),'true');
    await page.tap('.dfield > summary');
    await page.tap('[data-f=gameType][data-value=Doubles]');
    assert.equal(await page.count(`${row}:nth-child(3) [data-a=state]`),guide.cfg.calc.over?.state?.Round===false?0:1);
    if(guide.cfg.calc.zmove){
      await page.tap(`${row}:nth-child(2) [data-a=zmv]`);
      assert.equal(await page.count(`${row}:nth-child(2) [data-a=state]`),0,'Z hides top slot');
      assert.ok(!String(await page.text(`${row}:nth-child(2) .zl`)).includes('Z-move of'),'full Z name');
      await page.tap(`${row}:nth-child(2) [data-a=zmv]`);
      assert.equal(await page.value(`document.querySelector('${row}:nth-child(2) [data-a=state]').getAttribute('aria-pressed')`),'true');
    }
    const stored=await page.value('JSON.stringify(CALC.state().st)');
    await page.reload();
    assert.equal(await page.value('JSON.stringify(CALC.state().st)'),stored);
    await page.value("CALC.state().custom.at(-1).status='brn';CALC.render()");
    assert.equal(Number(await page.value(`document.querySelector('${row}:nth-child(4) [data-mo=bp]').value`)),140,'Facade used power');
    assert.match(await page.text(`${row}:nth-child(4) .dd`),/listed 70/);
  },
},{
  id:'multi-hit',title:'total damage, one-hit choice and item/ability hit restrictions',
  run:async page=>{
    await seed(page,['Icicle Spear','Tackle']);
    const row='.dres:not(.na) .mr:first-child';
    const parts=await page.value(`(()=>{const original=DMG.calc,results=[];DMG.calc=(...args)=>{const result=original(...args);results.push(result);return result;};CALC.render();DMG.calc=original;return results[0];})()`);
    const total=mode=>parts.per?parts.per.reduce((sum,rolls)=>sum+(mode==='min'?Math.min(...rolls):Math.max(...rolls)),0):parts[mode]*parts.hits;
    assert.equal(await page.text(`${row} .hp`),total('min')+'–'+total('max'),'collapsed damage is total');
    await page.value("CALC.state().custom.at(-1).i='Loaded Dice';CALC.render()");
    const dice=[];
    for(let count=0;count<3;count++){dice.push(await page.text(`${row} [data-a=hits]`));await page.tap(`${row} [data-a=hits]`);}
    assert.deepEqual(new Set(dice),new Set(['×1','×4','×5']));
    if(guide.AB.some(entry=>entry[0]==='Skill Link')){
      await page.value("CALC.state().custom.at(-1).a=AB.findIndex(entry=>entry[0]==='Skill Link');CALC.render()");
      const skill=[];
      for(let count=0;count<2;count++){skill.push(await page.text(`${row} [data-a=hits]`));await page.tap(`${row} [data-a=hits]`);}
      assert.deepEqual(new Set(skill),new Set(['×1','×5']));
    }
  },
}];
await runChecks({name:'calc-state',file,expectTrainers:false,checks});

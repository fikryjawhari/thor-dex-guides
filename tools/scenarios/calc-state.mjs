import assert from 'node:assert/strict';
import {changeMove, fixturePatches, guideArg, prepareGuide, readGuide, runChecks, setupCalc} from '../calc_check_lib.mjs';

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
    if(page.width<480){
      const width=page.width,height=page.height;
      await page.tap('[data-a=eopen][data-s=mine]');
      await page.resize(537,424);
      assert.equal(await page.count('.ed'),2,'resize populates both wide editors');
      await page.tap('[data-a=eopen][data-s=foe]');
      assert.equal(await page.count('.ed'),0,'resize keeps paired collapse');
      await page.resize(width,height);
    }
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
  await page.value(`(()=>{CALC.use(P.find(entry=>entry.n==='Snorlax'));const state=CALC.state(),mon=state.custom.at(-1),trainer=TRS.find(trainer=>trainer.p.length);mon.l=50;mon.m=${JSON.stringify(moves)}.map(name=>M.indexOf(name));TCAP[trainer.k]=50;CALC.enter(trainer.k,0);state.edits['foe:'+trainer.k+':0']={id:P.find(entry=>entry.n==='Snorlax').id,l:50,a:P.find(entry=>entry.n==='Snorlax').a[0],i:'',m:[M.indexOf('Tackle')],stg:[0,0,0,0,0]};CALC.render();})()`);
};
// Every guide: open panels fit one window; search by move / item / ability
const windowChecks=[{
  id:'one-window',title:'an open card, Field and move each fit one window; Field toggles never break a word',
  sizes:[[260,316],[480,316],[537,316],[832,316],[480,392],[537,424],[832,424]],
  run:async page=>{
    await seed(page,['Body Slam','Rock Blast','Crunch','Rest']);
    const room='innerHeight-8';
    await page.tap('[data-a=eopen][data-s=mine]');
    assert.ok(await page.value(`document.querySelector('.cc[data-s=mine]').offsetHeight<=${room}`),'open card: '+await page.value(`document.querySelector('.cc[data-s=mine]').offsetHeight`));
    assert.equal(new Set(await page.value(`[...document.querySelectorAll('.cc[data-s=mine] .ed .sm,.cc[data-s=mine] .ed .z,.cc[data-s=mine] .ed .sc')].map(button=>button.offsetHeight)`)).size,1,'stage buttons one size');
    // with residuals (toxic, Leftovers, sand) the parts stay folded behind Turn end and the card still fits
    await page.value("(()=>{const state=CALC.state(),mon=state.custom.at(-1);mon.i='Leftovers';mon.status='tox';state.field.weather='Sand';CALC.render();})()");
    assert.equal(await page.count('.cc[data-s=mine] .cl [data-tox=mine]'),1,'toxic turn on the HP line');
    assert.equal(await page.count('.cc[data-s=mine] .dqp'),0,'parts folded');
    assert.ok(await page.value(`document.querySelector('.cc[data-s=mine]').offsetHeight<=${room}`),'open card with residuals');
    await page.tap('[data-a=resopen][data-s=mine]');
    assert.ok(await page.count('.cc[data-s=mine] .dqp'),'parts open');
    await page.tap('[data-a=resopen][data-s=mine]');
    await page.value("(()=>{const state=CALC.state(),mon=state.custom.at(-1);mon.i='';mon.status='';state.field.weather='';CALC.render();})()");
    await page.tap('[data-a=eopen][data-s=mine]');
    for(let index=0;index<await page.count('.dres:not(.na) .mr:not(.em)');index++){
      await page.tap('.dres:not(.na) .mr:not(.em) > .mm',{index});
      assert.ok(await page.value(`document.querySelectorAll('.dres:not(.na) .mr:not(.em)')[${index}].offsetHeight<=${room}`),'open move '+index);
      await page.tap('.dres:not(.na) .mr:not(.em) .r1',{index});
    }
    await page.tap('.dfield > summary');
    assert.ok(await page.value(`document.querySelector('details.dfield').offsetHeight<=${room}`),'open Field: '+await page.value(`document.querySelector('details.dfield').offsetHeight`));
    const broken=await page.value(`[...document.querySelectorAll('.dfield .dtg button')].filter(button=>button.offsetParent).filter(button=>{const range=document.createRange(),words=[];const text=button.firstChild;let start=0;for(const word of text.textContent.split(' ')){range.setStart(text,start);range.setEnd(text,start+word.length);if(range.getClientRects().length>1)words.push(word);start+=word.length+1;}return words.length;}).map(button=>button.textContent)`);
    assert.deepEqual(broken,[],'no word breaks across lines');
    const one=await page.value('document.querySelector(".dfside").classList.contains("one")');
    if(one){
      assert.equal(await page.count('.dfside section:not(.on) button'),await page.value('document.querySelectorAll(".dfside section:not(.on) button").length'));
      await page.tap('[data-a=fside][data-v=def]');
      assert.ok(await page.value('document.querySelector("section[data-field-side=def]").offsetParent!==null&&document.querySelector("section[data-field-side=atk]").offsetParent===null'),'Foe side shown');
      await page.tap('[data-a=fside][data-v=atk]');
    }else assert.equal(await page.value('getComputedStyle(document.querySelector(".dfsw")).display'),'none','both sides shown, no switch');
  },
},{
  id:'search-terms',title:'Find trainer and Find yours match moves, items and abilities as well as names',
  run:async page=>{
    await seed(page,['Body Slam','Rock Blast','Crunch','Rest']);
    const trainer=await page.value("(()=>{const list=TRS.filter(t=>t.p.some(x=>x.m&&x.m.length));const x=list[0].p.find(x=>x.m.length);return {name:list[0].n,move:M[x.m[0]]};})()");
    await page.tap('.fbar .dsrc');
    await page.tap('[data-s=findtr]');
    await page.typeSearch(trainer.move);
    const rows=await page.value('[...document.querySelectorAll(".sheet:last-child .mrow")].map(row=>row.textContent)');
    assert.ok(rows.some(row=>row.includes(trainer.name)&&row.includes(trainer.move)),`trainer found by ${trainer.move}, the move shown`);
    await page.value('history.go(-2)');await page.settle();
    await page.tap('[data-a=findmine]');
    await page.typeSearch('Rock Blast');
    assert.ok((await page.value('[...document.querySelectorAll(".sheet:last-child .mrow")].map(row=>row.textContent)')).some(row=>row.includes('Snorlax')&&row.includes('Rock Blast')),'own Pokémon found by move');
  },
}];
const checks=[...(guide.cfg.name==='Emerald Imperium'?fixtureChecks:[]),...windowChecks,{
  id:'move-states',title:'row state cycles, power, Doubles gate, Z suppression and persistence',sizes:[[260,316],[537,424]],
  run:async page=>{
    await seed(page,['Fury Cutter','Assurance','Round','Facade']);
    const row='.dres:not(.na) .mr';
    const heights=await page.value(`[...document.querySelectorAll('${row}')].map(element=>element.offsetHeight)`);
    assert.ok(heights.every(height=>height===heights[3]),'state controls add no row height');
    if(page.width===260){
      const fit=await page.value(`(()=>{const bar=document.querySelector('.fbar').getBoundingClientRect().top+scrollY;return document.querySelector('${row}:nth-child(4)').getBoundingClientRect().bottom+scrollY-(bar-2);})()`);
      assert.ok(fit<=309,'trainer plus four state rows fit at minimum size: '+fit);
    }
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
    for(const suppression of ['magicRoom','Klutz']){
      if(suppression==='Klutz'&&!guide.AB.some(entry=>entry[0]==='Klutz'))continue;
      await page.value(`(()=>{const state=CALC.state();state.hits={};state.field.magicRoom=${suppression==='magicRoom'};state.custom.at(-1).a=${suppression==='Klutz'?"AB.findIndex(entry=>entry[0]==='Klutz')":'-1'};CALC.render();})()`);
      assert.equal(await page.text(`${row} [data-a=hits]`),'×3','suppressed Dice uses the ordinary default');
      const choices=[];
      for(let count=0;count<5;count++){choices.push(await page.text(`${row} [data-a=hits]`));await page.tap(`${row} [data-a=hits]`);}
      assert.deepEqual(new Set(choices),new Set(['×1','×2','×3','×4','×5']),suppression+' restores all hit counts');
    }
    await page.value('CALC.state().field.magicRoom=false;CALC.render()');
    if(guide.AB.some(entry=>entry[0]==='Skill Link')){
      await page.value("CALC.state().custom.at(-1).a=AB.findIndex(entry=>entry[0]==='Skill Link');CALC.render()");
      const skill=[];
      for(let count=0;count<2;count++){skill.push(await page.text(`${row} [data-a=hits]`));await page.tap(`${row} [data-a=hits]`);}
      assert.deepEqual(new Set(skill),new Set(['×1','×5']));
    }
  },
},{
  id:'state-contract',title:'all state kinds, hack suppressions, reset semantics and own pre-hit changes',
  run:async page=>{
    await seed(page,['Tackle']);
    await page.value(`(()=>{const original=DMG.calc;window.__stateCalls=[];DMG.calc=(...args)=>{const result=original(...args);window.__stateCalls.push({slot:args[2],result});return result;};})()`);
    const first='.dres:not(.na) .mr:first-child';
    const counters={'Fury Cutter':4,'Echoed Voice':4,Rollout:4,'Ice Ball':4,'Rage Fist':6,'Last Respects':5};
    for(const [name,max] of Object.entries(counters).filter(([name])=>guide.M.includes(name))){
      await page.value(`CALC.state().custom.at(-1).m=[M.indexOf(${JSON.stringify(name)})];CALC.state().st={};CALC.render()`);
      if(guide.cfg.calc.over?.state?.[name]===false){assert.equal(await page.count(`${first} [data-a=state]`),0,name+' suppressed');continue;}
      for(let count=1;count<=max+1;count++){
        await page.tap(`${first} [data-a=state]`);
        assert.equal(await page.text(`${first} [data-a=state]`),String(count%(max+1)),name+' cycle');
      }
      if(['Rollout','Ice Ball'].includes(name))assert.equal(await page.count(`${first} [data-mo=curl]`),guide.cfg.calc.over?.state?.[name]?.curl===false?0:1,'Curl follows hack contract');
    }
    for(const name of ['Assurance','Revenge','Avalanche','Retaliate','Stomping Tantrum','Temper Flare','Lash Out','Fickle Beam'].filter(name=>guide.M.includes(name))){
      await page.value(`CALC.state().custom.at(-1).m=[M.indexOf(${JSON.stringify(name)})];CALC.state().st={};CALC.render()`);
      if(guide.cfg.calc.over?.state?.[name]===false){assert.equal(await page.count(`${first} [data-a=state]`),0,name+' suppressed');continue;}
      await page.tap(`${first} [data-a=state]`);
      assert.ok(await page.value(`window.__stateCalls.some(call=>call.slot.mv===M.indexOf(${JSON.stringify(name)})&&call.slot.st===true)`),name+' boolean input');
    }
    await page.value("CALC.state().custom.at(-1).m=[M.indexOf('Tackle')];CALC.state().custom.at(-1).i='Metronome';CALC.state().st={};CALC.render()");
    await page.tap(`${first} [data-a=state]`);
    assert.ok(await page.value('window.__stateCalls.some(call=>call.slot.met===1)'),'Metronome uses met, not timesUsed');
    await page.value("CALC.state().custom.at(-1).m=[M.indexOf('Assurance')];CALC.state().st={};CALC.render()");
    await page.tap(`${first} [data-a=state]`);
    await page.tap(`${first} .mm`);
    await page.setBox(`${first} [data-mo=bp]`,33);
    await page.tap(`${first} [data-a=mvreset]`);
    assert.ok(await page.value('Object.values(CALC.state().st).includes(true)'),'power reset preserves state');
    assert.equal(await page.text(`${first} [data-a=state]`),'Hit','one top control, not Metronome');
    await changeMove(page,0,'Tackle');
    assert.equal(await page.value('Object.keys(CALC.state().st).length'),0,'changing the move clears its state');
    await page.value("CALC.state().custom.at(-1).m=[M.indexOf('Fire Pledge')];CALC.state().field.gameType='Doubles';CALC.render()");
    if(guide.M.includes('Fire Pledge')&&guide.cfg.calc.over?.state?.['Fire Pledge']!==false){
      await page.tap(`${first} [data-a=state]`);
      assert.ok(await page.value("Object.values(CALC.state().st).includes('Water Pledge')"),'pledge sends partner name');
    }
    await page.value("CALC.state().custom.at(-1).m=[M.indexOf('Skull Bash')];CALC.state().mvo={};CALC.render()");
    assert.match(await page.text(`${first} .dpre`),/Before the hit.*Def.*Skull Bash/);
    if(!await page.value(`document.querySelector('${first}').classList.contains('open')`))await page.tap(`${first} .mm`);
    await page.tap(`${first} [data-mo=pre]`);
    assert.equal(await page.count(`${first} .dpre`),0,'own stat change can be omitted');
    await page.value("CALC.state().custom.at(-1).m=[M.indexOf('Earthquake')];CALC.state().custom.at(-1).i='';CALC.state().mvo={};CALC.render()");
    const normal=Number((await page.text(`${first} .hp`)).split('–')[1]);
    await page.tap('[data-a=eopen][data-s=foe]');
    await page.value("(()=>{const input=document.querySelector('[data-e=vol][data-s=foe]');input.value='dig';input.dispatchEvent(new Event('change'));})()");
    const digging=Number((await page.text(`${first} .hp`)).split('–')[1]);
    assert.ok(digging/normal>1.8&&digging/normal<2.2,'target Dig reaches the engine');
    assert.equal(await page.text('.cc[data-s=foe] .dvol'),'Dig','target badge on HP line');
    await page.value("(()=>{const input=document.querySelector('[data-e=vol][data-s=foe]');input.value='';input.dispatchEvent(new Event('change'));})()");
    assert.equal(await page.count('.cc[data-s=foe] .dvol'),0);
  },
},{
  id:'entry-crit',title:'Download cycle, entry-off input and forced/blocked criticals',
  run:async page=>{
    await seed(page,['Tackle']);
    await page.value("CALC.state().custom.at(-1).a=AB.findIndex(entry=>entry[0]==='Download');CALC.render()");
    // Ability controls sit on the header line left of Edit, and the card is no taller than one without them
    const headerHeight=()=>page.value('[...document.querySelectorAll(".cc .l1")].map(line=>line.offsetHeight)');
    const [mineHeader,foeHeader]=await headerHeight();
    assert.equal(mineHeader,foeHeader,'Download does not make the header taller');
    assert.ok(await page.value('document.querySelector(".cc[data-s=mine] .l1 [data-a=download]").compareDocumentPosition(document.querySelector(".cc[data-s=mine] .l1 .stb"))&Node.DOCUMENT_POSITION_FOLLOWING'),'Download left of Edit');
    assert.match(await page.text('[data-a=download]'),/^A·(Atk|SpA)$/);
    assert.match(await page.value('document.querySelector("[data-a=download]").title'),/Download: Auto → (Atk|Sp. Atk)/);
    for(const [value,label] of [['atk','M·Atk'],['spa','M·SpA'],['off','None']]){
      await page.tap('[data-a=download]');
      assert.equal(await page.value("CALC.state().custom.at(-1).dl||''"),value);
      assert.equal(await page.text('[data-a=download]'),label);
    }
    await page.tap('[data-a=download]');
    assert.equal(await page.value("CALC.state().custom.at(-1).dl||''"),'');
    await page.tap('[data-a=eopen][data-s=mine]');
    assert.equal(await page.count('.ed [data-a=download]'),0,'Download is not inside Edit');
    await page.tap('[data-a=eopen][data-s=mine]');
    if(guide.AB.some(entry=>entry[0]==='Intrepid Sword')){
      await page.value("CALC.state().custom.at(-1).a=AB.findIndex(entry=>entry[0]==='Intrepid Sword');CALC.render()");
      assert.equal(await page.value('document.querySelector(".cc[data-s=mine] .l1 [data-e=entry]").checked'),true,'on by default');
      assert.deepEqual(await headerHeight(),[mineHeader,foeHeader],'the entry box does not make the header taller');
      await page.tap('[data-e=entry][data-s=mine]');
      assert.equal(await page.value('CALC.state().custom.at(-1).entry'),false);
      await page.tap('[data-e=entry][data-s=mine]');
      assert.equal(await page.value('CALC.state().custom.at(-1).entry'),undefined);
    }
    await page.value("CALC.state().custom.at(-1).a=P.find(entry=>entry.n==='Snorlax').a[0];CALC.state().custom.at(-1).m=[M.indexOf('Frost Breath')];CALC.render()");
    const crit='.dres:not(.na) .mr:first-child .rc';
    if(guide.M.includes('Frost Breath')&&guide.MV[guide.M.indexOf('Frost Breath')].cr===6){
      assert.equal(await page.value(`document.querySelector('${crit}').disabled`),true,'forced crit locked');
      assert.equal(await page.value(`document.querySelector('${crit}').getAttribute('aria-pressed')`),'true');
    }
    await page.value("(()=>{const state=CALC.state();state.custom.at(-1).m=[M.indexOf('Tackle')];state.edits['foe:'+state.foe.k+':0'].a=AB.findIndex(entry=>entry[0]==='Battle Armor');CALC.render();})()");
    assert.equal(await page.value(`document.querySelector('${crit}').disabled`),true,'blocked crit disabled');
  },
},...(guide.cfg.name==='Emerald Imperium'?[{
  id:'parental-bond',title:'outside sums both strikes; one top-slot cycles individual hits',
  run:async page=>{
    await seed(page,['Power-Up Punch']);
    await page.value("(()=>{const mon=CALC.state().custom.at(-1);mon.id=P.find(entry=>entry.n==='Mega Kangaskhan').id;mon.a=AB.findIndex(entry=>entry[0]==='Parental Bond');CALC.render();})()");
    const first='.dres:not(.na) .mr:first-child';
    const ranges=await page.value(`[...document.querySelectorAll('${first} .rolls')].map(element=>element.innerHTML.split('<br>')[0].match(/Hit \\d+: (\\d+)–(\\d+)/).slice(1).map(Number))`);
    assert.equal(ranges.length,2);
    const total=[0,1].map(index=>ranges.reduce((sum,range)=>sum+range[index],0)).join('–');
    assert.equal(await page.text(`${first} .hp`),total);
    assert.equal(await page.count(`${first} .rcol .rh`),1,'no stacked controls');
    await page.tap(`${first} [data-a=hitv]`);
    assert.equal(await page.text(`${first} .hp`),ranges[0].join('–'));
    await page.tap(`${first} [data-a=hitv]`);
    assert.equal(await page.text(`${first} .hp`),ranges[1].join('–'));
    await page.tap(`${first} [data-a=hitv]`);
    assert.equal(await page.text(`${first} .hp`),total);
  },
}]:[])];
await runChecks({name:'calc-state',file,expectTrainers:false,checks});

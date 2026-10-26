import assert from 'node:assert/strict';
import {guideArg, prepareGuide, readGuide, runChecks, tapField} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-field-states'});
if (!file) process.exit(0);
const guide = readGuide(file).data;
const sizes = [[260,316],[480,316],[537,316],[832,316],[480,392],[537,424],[832,424]];
const seed = async page => {
  await page.goto('#/calc');
  await page.value(`(()=>{const state=CALC.state(),species=P.find(mon=>mon.n==='Snorlax'),trainer=TRS.find(trainer=>trainer.p.length>=2),base={l:50,na:'Hardy',a:-1,i:'',status:'',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0],stg:[0,0,0,0,5],m:[M.indexOf('Tackle'),M.indexOf('Earthquake')]};state.field={};state.custom=[];for(let index=0;index<2;index++){CALC.use(species);Object.assign(state.custom.at(-1),structuredClone(base));}TCAP[trainer.k]=50;CALC.enter(trainer.k,0);for(let index=0;index<2;index++)state.edits['foe:'+trainer.k+':'+index]={...structuredClone(base),id:species.id};CALC.render();})()`);
};
const openHazards = async (page, side='atk') => {
  if (!await page.value("document.querySelector('.dfield').open")) await page.tap('.dfield > summary');
  if (await page.value(`document.querySelector('.dfside').classList.contains('one')&&!document.querySelector('[data-field-side="${side}"]').classList.contains('on')`)) await page.tap(`[data-a=fside][data-v=${side}]`);
  if (!await page.value(`document.querySelector('[data-fgroup="${side}:hazards"]').open`)) await page.tap(`[data-fgroup="${side}:hazards"] > summary`);
};
const hp = (page, side='mine') => page.value(`Number(document.querySelector('[data-hp=${side}]').value)`);
const selectStatus = async (page, value) => {
  if (!await page.count('.cc[data-s=mine] select[data-e=status]')) await page.tap('[data-a=eopen][data-s=mine]');
  await page.value(`(()=>{const select=document.querySelector('.cc[data-s=mine] select[data-e=status]');select.value=${JSON.stringify(value)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
};

await runChecks({name:'calc-field-states', file, checks:[{
  id:'entry lifecycle', title:'entry once, manual HP/status/Web reapply independently, no redraw/reload damage', sizes,
  run:async page=>{
    await seed(page);
    const max=await hp(page);
    await page.value("Object.assign(CALC.state().field,{atkStealthRock:1,atkSpikes:2,atkToxicSpikes:2,atkStickyWeb:1});CALC.render()");
    assert.equal(await hp(page),max,'setting layers never subtracts HP');
    await page.tap('[data-a=mpick][data-src=custom][data-i="0"]');
    const loss=Math.floor(max/8)+Math.floor(max/6);
    assert.equal(await hp(page),max-loss,'Rocks and two Spikes layers apply once');
    assert.equal(await page.value('CALC.state().custom[0].status'),'tox');
    assert.equal(await page.value('CALC.mon("mine").stg[4]'),-1,'Web replaces +5 with -1');
    await page.value('CALC.render();CALC.render()');
    assert.equal(await hp(page),max-loss,'redraw does not apply entry');
    await openHazards(page);
    assert.equal(await page.value('document.querySelector("[data-a=hazards][data-s=mine]").disabled'),true);
    await page.tap('[data-a=hpfull][data-s=mine]');
    assert.equal(await hp(page),max,'Full HP wins');
    await openHazards(page);
    await page.tap('[data-a=hazards][data-s=mine]');
    assert.equal(await hp(page),max-loss,'manual reapplication');
    await page.setBox('[data-hp=mine]',max-1);
    assert.equal(await hp(page),max-1,'direct HP entry wins');
    await openHazards(page);
    await page.tap('[data-a=hazards][data-s=mine]');
    assert.equal(await hp(page),max-1-loss,'direct HP entry re-arms damage');
    await page.tap('[data-a=hpfull][data-s=mine]');
    await openHazards(page);
    await page.tap('[data-a=hazards][data-s=mine]');
    await selectStatus(page,'');
    assert.equal(await page.value('CALC.state().custom[0].status'),'','manual clear persists');
    await page.value('CALC.render()');
    assert.equal(await page.value('CALC.state().custom[0].status'),'');
    await openHazards(page);
    await page.tap('[data-a=hazards][data-s=mine]');
    assert.equal(await page.value('CALC.state().custom[0].status'),'tox');
    assert.equal(await hp(page),max-loss,'re-poisoning never reapplies damage');
    await page.tap('[data-a=sstep][data-s=mine][data-x="4"]');
    await page.value('CALC.set("mine","stg",[0,0,0,0,5]);CALC.render()');
    await openHazards(page);
    await page.tap('[data-a=hazards][data-s=mine]');
    assert.equal(await page.value('CALC.mon("mine").stg[4]'),-1);
    assert.equal(await hp(page),max-loss,'Web replay never reapplies damage');
    await page.route('#/');
    await page.route('#/calc');
    assert.equal(await hp(page),max-loss,'route return does not apply entry');
    await page.reload();
    await page.goto('#/calc');
    assert.equal(await hp(page),max-loss,'reload marker persists');
    await page.tap('[data-a=mpick][data-src=custom][data-i="1"]');
    await page.tap('[data-a=mpick][data-src=custom][data-i="0"]');
    assert.equal(await hp(page),max-2*loss,'return after a different selection is a fresh entry');
  },
},{
  id:'entry immunity edits', title:'blocked hazards stay pending when an item, ability or grounding changes', sizes,
  run:async page=>{
    await seed(page);
    const max=await hp(page);
    const loss=Math.floor(max/8);
    const cases=[
      ...(guide.cfg.calc.gen>=8?[{before:"mon.i='Heavy-Duty Boots'",after:"mon.i=''",field:{atkStealthRock:1,atkToxicSpikes:2,atkStickyWeb:1},damage:true}]:[]),
      ...(guide.cfg.calc.gen>=8?[{before:"mon.i='Heavy-Duty Boots'",after:"mon.i=''",field:{atkStealthRock:1,atkToxicSpikes:2,atkStickyWeb:1},damage:true,legacy:true}]:[]),
      {before:"mon.a=AB.findIndex(entry=>entry[0]==='Magic Guard')",after:'mon.a=-1',field:{atkStealthRock:1,atkStickyWeb:1},damage:true},
      {before:'state.field.atkMagnetRise=1',after:'state.field.atkMagnetRise=0',field:{atkStealthRock:1,atkSpikes:1,atkStickyWeb:1},damage:true},
      {before:"mon.a=AB.findIndex(entry=>entry[0]==='Immunity')",after:'mon.a=-1',field:{atkStealthRock:1,atkToxicSpikes:2},damage:false},
    ];
    for(const fixture of cases){
      await page.value(`(()=>{const state=CALC.state(),mon=state.custom[0];state.mine={src:'custom',b:0,i:0};state.hazardEntry={};state.field=${JSON.stringify(fixture.field)};mon.hp=${max};mon.a=-1;mon.i='';mon.status='';mon.stg=[0,0,0,0,5];CALC.set('mine','stg',[0,0,0,0,5]);${fixture.before};CALC.render();})()`);
      if(fixture.legacy){
        await page.value("(()=>{const state=CALC.state();state.hazardEntry.mine={key:'mine:'+state.custom[0].pid,status:true,web:true};localStorage.setItem(LS.dmg,JSON.stringify(state));})()");
        await page.reload();await page.goto('#/calc');
        assert.equal(await page.value('CALC.state().hazardEntry.mine.v'),2,'legacy Full HP marker migrates without a damage flag');
      }
      const entered=await hp(page);
      await openHazards(page);
      assert.equal(await page.value('document.querySelector("[data-a=hazards][data-s=mine]").disabled'),true,'immunity blocks pending effects');
      await page.value(`(()=>{const state=CALC.state(),mon=state.custom[0];${fixture.after};CALC.render();})()`);
      assert.equal(await hp(page),entered,'eligibility edits never apply damage automatically');
      await openHazards(page);
      assert.equal(await page.value('document.querySelector("[data-a=hazards][data-s=mine]").disabled'),false,'newly eligible effects can be applied');
      await page.tap('[data-a=hazards][data-s=mine]');
      assert.equal(await hp(page),entered-(fixture.damage?loss:0),'only pending damage applies, not previously consumed hazards');
      if(fixture.field.atkToxicSpikes)assert.equal(await page.value('CALC.state().custom[0].status'),'tox');
      if(fixture.field.atkStickyWeb)assert.equal(await page.value('CALC.mon("mine").stg[4]'),-1);
      await page.value('CALC.render()');
      await openHazards(page);
      assert.equal(await page.value('document.querySelector("[data-a=hazards][data-s=mine]").disabled'),true,'applied components remain consumed');
    }
  },
},{
  id:'field groups', title:'profile gating, layer cycling, folded active counts and one-window expanded groups', sizes,
  run:async page=>{
    await seed(page);
    await page.tap('.dfield > summary');
    assert.ok(await page.value('document.querySelector(".dfield").offsetHeight<=innerHeight-8'),'automatic source lines and closed groups fit one window, with internal scrolling if needed');
    assert.equal(await page.count('[data-f$=Steelsurge]'),0,'steel hazard is engine-only');
    assert.equal(await page.count('[data-f=atkProtect]'),guide.cfg.calc.zmove?1:0);
    if(!guide.cfg.calc.zmove)assert.equal(await page.count('[data-f$=Protected]'),0,'no legacy Protect outside Z profiles');
    for(const key of ['SaltCure','TarShot','GlaiveRush']){
      const source={SaltCure:'Salt Cure',TarShot:'Tar Shot',GlaiveRush:'Glaive Rush'}[key];
      assert.equal(await page.count(`[data-f=atk${key}]`),guide.M.includes(source)&&guide.cfg.calc.gen>=({SaltCure:9,TarShot:8,GlaiveRush:9}[key])?1:0);
    }
    for(let count=1;count<=4;count++){
      await tapField(page,'atkSpikes');
      assert.equal(await page.value('CALC.state().field.atkSpikes'),count%4);
      assert.equal(await page.text('[data-f=atkSpikes]'),'Spikes '+count%4);
    }
    await tapField(page,'atkToxicSpikes');
    assert.equal(await page.text('[data-fgroup="atk:hazards"] > summary'),'Hazards · 1');
    await page.tap('[data-fgroup="atk:hazards"] > summary');
    assert.match(await page.text('.dfield > summary'),/Player Toxic Spikes 1/);
    for(const group of ['battle','turn','hazards']){
      await page.tap(`[data-fgroup="atk:${group}"] > summary`);
      assert.ok(await page.value('document.querySelector(".dfield").offsetHeight<=innerHeight-8'),'Field fits with '+group+' open');
      assert.equal(await page.value('document.documentElement.scrollWidth>innerWidth'),false,'no horizontal overflow');
    }
    const boxes=()=>page.value(`[...document.querySelectorAll('[data-field-side=atk] .dtg button')].filter(button=>button.getClientRects().length).map(button=>({key:button.dataset.f,height:button.offsetHeight,content:button.scrollHeight,room:button.clientHeight}))`);
    const before=await boxes();
    assert.ok(await page.value('[...document.querySelector(".dfb").children].every(element=>getComputedStyle(element).flexShrink==="0")'),'field content must scroll instead of shrinking');
    await tapField(page,'atkStealthRock');
    const after=await boxes();
    assert.deepEqual(after.map(box=>[box.key,box.height]),before.map(box=>[box.key,box.height]),'pressing a toggle preserves the natural box height');
    assert.ok(after.every(box=>box.content<=box.room+1),'wrapped labels fit inside their boxes');
    await page.goto('#/');await page.goto('#/calc');
    assert.equal(await page.value('CALC.state().field.atkToxicSpikes'),1,'layers persist');
  },
},{
  id:'sides and residuals',title:'entry and turn-end effects belong to fixed Player/Foe sides, not attack direction',sizes,
  run:async page=>{
    await seed(page);
    const max=await hp(page,'foe');
    await page.value('Object.assign(CALC.state().field,{defStealthRock:1,defStickyWeb:1,atkCursed:1,defIngrain:1});CALC.render()');
    await page.tap('[data-a=fpick][data-i="1"]',{index:await page.value('[...document.querySelectorAll(\'[data-a=fpick][data-i="1"]\')].findIndex(element=>element.offsetWidth>0)')});
    assert.equal(await hp(page,'foe'),max-Math.floor(max/8));
    const amounts=await page.value('[...document.querySelectorAll(".dturn")].map(button=>button.textContent)');
    assert.ok(amounts.includes('−'+Math.floor(max/4)),'Player curse');
    assert.ok(amounts.includes('+'+Math.floor(max/16)),'Foe Ingrain');
    await page.tap('.cc[data-s=foe] .cn');
    assert.equal(await hp(page,'foe'),max-Math.floor(max/8),'direction change is not entry');
    assert.deepEqual(await page.value('[...document.querySelectorAll(".dturn")].map(button=>button.textContent)'),amounts);
    assert.equal(await page.value('Number(document.querySelector(".cc[data-s=foe] .sp i").textContent.replace(/[^0-9]/g,""))'),await page.value('DMG.speed({id:CALC.state().edits["foe:"+CALC.state().foe.k+":1"].id,lv:50,ab:-1,stg:[0,0,0,0,0,-1]},CALC.state().field,"def")'));
  },
},{
  id:'top-filled team',title:'added Pokemon fill compact rows from the top of the player box',sizes,
  run:async page=>{
    await seed(page);
    await page.value("(()=>{for(let index=0;index<15;index++)CALC.use(P.find(mon=>mon.n==='Snorlax'));})()");
    const packing=await page.value(`(()=>{const grid=document.querySelector('.mg .dstrip'),buttons=[...grid.children],top=grid.getBoundingClientRect().top,rows=[...new Set(buttons.map(button=>button.offsetTop))];return {first:buttons[0].getBoundingClientRect().top-top,steps:rows.slice(1).map((row,index)=>row-rows[index]),height:buttons[0].offsetHeight,gap:parseFloat(getComputedStyle(grid).rowGap)};})()`);
    assert.ok(Math.abs(packing.first)<1,'first row sits at the top');
    assert.ok(packing.steps.length>0,'multiple rows exercise vertical packing');
    assert.ok(packing.steps.every(step=>Math.abs(step-packing.height-packing.gap)<1),'rows have only the normal gap, not distributed empty space');
  },
},...(guide.cfg.calc.field.some(entry=>entry.k==='inverse')?[{
  id:'inverse immunity',title:'inverse chart rules never turn Magnet Rise or Telekinesis into a Ground weakness',
  sizes:[[260,316],[537,424]],
  run:async page=>{
    await seed(page);
    await page.tap('.dfield > summary');
    await tapField(page,'inverse');
    const damage='.dres:not(.na) .mr:nth-child(2) .hp';
    await tapField(page,'defMagnetRise');
    assert.equal(await page.text(damage),'No effect');
    await tapField(page,'defMagnetRise');
    await tapField(page,'defTelekinesis');
    assert.equal(await page.text(damage),'No effect');
    await tapField(page,'gravity');
    assert.notEqual(await page.text(damage),'No effect','Gravity overrides temporary Ground immunity');
  },
}]:[])]});

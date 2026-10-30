import assert from 'node:assert/strict';
import {guideArg, prepareGuide, readGuide, runChecks, tapField} from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), {tag: 'calc-field-states'});
if (!file) process.exit(0);
const guide = readGuide(file).data;
const sizes = [[260,316],[480,316],[537,316],[832,316],[480,392],[537,424],[832,424]];
const seed = async page => {
  await page.goto('#/calc');
  await page.value(`(()=>{const state=CALC.state(),species=P.find(mon=>mon.n==='Snorlax'),trainer=TRS.find(trainer=>trainer.p.length>=2),base={l:50,na:'Hardy',a:-1,i:'',status:'',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0],stg:[0,0,0,0,5],m:[M.indexOf('Tackle'),M.indexOf('Earthquake')]};state.field={};state.custom=[];for(let index=0;index<2;index++){CALC.use(species);Object.assign(state.custom.at(-1),structuredClone(base));}TCAP[trainer.k]=50;CALC.enter(trainer.k,0);for(let index=0;index<2;index++)state.edits['foe:'+trainer.k+':'+index]={...structuredClone(base),id:species.id,sd:0};CALC.render();})()`);
};
const hp = (page, side='mine') => page.value(`Number(document.querySelector('[data-hp=${side}]').value)`);
const selectStatus = async (page, value) => {
  if (!await page.count('.cc[data-s=mine] select[data-e=status]')) await page.tap('[data-a=eopen][data-s=mine]');
  await page.value(`(()=>{const select=document.querySelector('.cc[data-s=mine] select[data-e=status]');select.value=${JSON.stringify(value)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
};

const globalKeys = ['allyFairyAura','allyDarkAura','allyAuraBreak','waterSport','mudSport','powerSplit','guardSplit'];
const engineInput = `mon=>({id:mon.id,lv:mon.l,...(mon.sd?{sl:Math.max(1,mon.l-mon.sd)}:{}),nat:mon.na,ab:mon.a,it:mon.i,st:mon.status,iv:mon.iv,ev:${guide.cfg.calc.evs===false}?[0,0,0,0,0,0]:mon.ev,stg:[0,...mon.stg],hp:mon.hp})`;
const globalEntries = guide.cfg.calc.field.filter(entry=>globalKeys.includes(entry.k));
// Gen VI field effects: the auras and Sticky Web (a Gen V profile, BB2R, has neither)
const gen6 = guide.cfg.calc.gen >= 6;
const web = guide.cfg.calc.field.some(entry=>entry.k==='atkStickyWeb');
const openGlobals = async page => {
  if (!await page.value('document.querySelector(".dfield").open')) await page.tap('.dfield > summary');
  if (!await page.value('document.querySelector(".dffield").open')) await page.tap('[data-fgroup="field:battle"] > summary');
};

await runChecks({name:'calc-field-states', file, checks:[{
  id:'global rooms',title:'rooms move into Global with unchanged keys and persistence',sizes:[[260,316]],
  run:async page=>{
    await seed(page);
    for(const key of ['gravity','wonderRoom','magicRoom']){
      if(!guide.cfg.calc.field.some(entry=>entry.k===key))continue;
      assert.equal(await page.value(`document.querySelector('[data-f="${key}"]').closest('[data-fgroup]').dataset.fgroup`),'field:battle');
      await openGlobals(page);
      await tapField(page,key);
      assert.equal(await page.value(`!!CALC.state().field.${key}`),true);
      await page.reload();await page.goto('#/calc');
      assert.equal(await page.value(`!!CALC.state().field.${key}`),true);
      await openGlobals(page);
      await tapField(page,key);
      assert.equal(await page.value(`!!CALC.state().field.${key}`),false);
    }
  },
},{
  id:'global damage', title:'all global toggles match engine damage, profile and Doubles gates, measured labels and one-window Field', sizes,
  run:async page=>{
    await seed(page);
    await page.tap('.dfield > summary');
    await page.tap('[data-f=gameType][data-value=Singles]');
    assert.deepEqual(globalEntries.map(entry=>entry.k).sort(),globalKeys.filter(key=>(key!=='allyDarkAura'||guide.cfg.name!=='Hardlove Gold')&&(gen6||!key.startsWith('ally'))).sort(),'A3 profile gates remain unchanged');
    for(const entry of guide.cfg.calc.field.filter(entry=>entry.doubles))assert.equal(await page.count(`[data-f="${entry.k}"]`),0,entry.k+' hidden in Singles');
    await page.tap('[data-f=gameType][data-value=Doubles]');
    assert.equal(await page.count('[data-f=allyDarkAura]'),guide.cfg.name==='Hardlove Gold'||!gen6?0:1);
    const closed=await page.value('(()=>{const body=document.querySelector(".dfb");return {height:body.closest("details").offsetHeight,scroll:body.scrollHeight,room:body.clientHeight};})()');
    assert.ok(closed.height<=316-8,'closed groups fit the minimum-height window');
    // In Doubles the ally effects join the side grid (grouped by what they affect), so only Singles must fit unscrolled.
    await page.tap('[data-f=gameType][data-value=Singles]');
    const single=await page.value('(()=>{const body=document.querySelector(".dfb");return {scroll:body.scrollHeight,room:body.clientHeight};})()');
    assert.ok(single.scroll<=single.room+1,'closed groups do not require Field-body scrolling in Singles: '+JSON.stringify(single));
    await page.tap('[data-f=gameType][data-value=Doubles]');
    const moves={waterSport:'Flamethrower',mudSport:'Thunderbolt',powerSplit:'Tackle',guardSplit:'Tackle',allyFairyAura:'Moonblast',allyDarkAura:'Dark Pulse',allyAuraBreak:'Moonblast'};
    for(const entry of globalEntries){
      const move=moves[entry.k];
      assert.ok(guide.M.includes(move),move+' fixture is available');
      await page.value(`(()=>{const state=CALC.state();state.dir='out';state.mine={src:'custom',b:0,i:0};state.fman=['gameType'];state.field={gameType:'Doubles',${entry.k==='allyAuraBreak'?'allyFairyAura:1,':''}};state.custom[0].m=[M.indexOf(${JSON.stringify(move)})];state.edits['foe:'+state.foe.k+':0'].id=P.find(mon=>mon.n==='Chansey').id;CALC.render();})()`);
      const expected=await page.value(`(()=>{const convert=${engineInput},state=CALC.state(),att=convert(CALC.mon('mine')),def=convert(CALC.mon('foe')),slot={mv:state.custom[0].m[0]};return [0,1].map(value=>{const result=DMG.calc(att,def,slot,{...state.field,[${JSON.stringify(entry.k)}]:value});return [result.min*result.hits,result.max*result.hits];});})()`);
      assert.notDeepEqual(expected[0],expected[1],entry.k+' fixture changes engine damage');
      const damage='.dres:not(.na) .mr:first-child .r1 .hp';
      assert.equal(await page.text(damage),expected[0].join('–'),entry.k+' baseline range');
      await openGlobals(page);
      const label=await page.value(`document.querySelector('[data-f="${entry.k}"]').title`);
      assert.equal(label,entry.l,'full tooltip');
      await tapField(page,entry.k);
      assert.equal(await page.value(`CALC.state().field.${entry.k}`),1);
      assert.ok(await page.value(`CALC.state().fman.includes('${entry.k}')`),'manual tracking');
      assert.equal(await page.text(damage),expected[1].join('–'),entry.k+' toggled range');
      assert.ok(await page.value('document.querySelector(".dfield").offsetHeight<=innerHeight-8'),'expanded global group stays in one window');
      assert.match(await page.text('[data-fgroup="field:battle"] > summary'),/^Global · [12]$/);
      const broken=await page.value(`(()=>{const buttons=[...document.querySelectorAll('[data-fgroup="field:battle"] button')];return buttons.filter(button=>{const text=button.firstChild,range=document.createRange();let start=0;return text.textContent.split(' ').some(word=>{range.setStart(text,start);range.setEnd(text,start+word.length);start+=word.length+1;return range.getClientRects().length>1;})||button.scrollHeight>button.clientHeight+1;}).map(button=>button.textContent);})()`);
      assert.deepEqual(broken,[],'measured global labels do not break words or clip');
      await tapField(page,entry.k);
      assert.equal(await page.text(damage),expected[0].join('–'),entry.k+' reverses cleanly');
    }
    await page.tap('[data-f=gameType][data-value=Singles]');
    for(const entry of globalEntries)assert.equal(await page.count(`[data-f="${entry.k}"]`),entry.doubles?0:1,entry.k+' Singles availability');
    assert.doesNotMatch(await page.text('.dfield > summary'),/Fairy Aura/,'inactive Doubles-only state omitted from summary');
  },
},{
  id:'global lifecycle', title:'global manual state persists and Auto, Reset fight and trainer changes clear every key', sizes,
  run:async page=>{
    await seed(page);
    const enable=async()=>{
      if(!await page.value('document.querySelector(".dfield").open'))await page.tap('.dfield > summary');
      await page.tap('[data-f=gameType][data-value=Doubles]');
      for(const entry of globalEntries)await tapField(page,entry.k);
    };
    const cleared=async label=>{
      const state=await page.value('({field:CALC.state().field,manual:CALC.state().fman})');
      for(const entry of globalEntries){assert.ok(!state.field[entry.k],label+' clears '+entry.k);assert.ok(!state.manual.includes(entry.k),label+' clears manual '+entry.k);}
    };
    await enable();
    await page.reload();await page.goto('#/calc');
    for(const entry of globalEntries){assert.equal(await page.value(`CALC.state().field.${entry.k}`),1,'reload '+entry.k);assert.ok(await page.value(`CALC.state().fman.includes('${entry.k}')`));}
    await openGlobals(page);
    for(const entry of globalEntries)assert.equal(await page.value(`document.querySelector('[data-f="${entry.k}"]').getAttribute('aria-pressed')`),'true');
    await page.tap('[data-a=fieldauto]');await cleared('Auto');
    await enable();await page.tap('[data-a=fightreset]');await cleared('Reset fight');
    await enable();await page.value('CALC.enter(TRS.find(trainer=>trainer.k!==CALC.state().foe.k&&trainer.p.length>=2).k,0)');await cleared('trainer change');
  },
},{
  id:'entry lifecycle', title:'hazards never apply by themselves: the card chip offers them on a switch-in, ↺ and a new fight, goes on any other action, survives reload', sizes,
  run:async page=>{
    await seed(page);
    const max=await hp(page);
    const chip='[data-a=hzapply][data-s=mine]';
    const closeLog=async()=>{if(await page.count('#calc-log'))await page.tap('#calc-log button');};
    await page.value("Object.assign(CALC.state().field,{atkStealthRock:1,atkSpikes:2,atkToxicSpikes:2,atkStickyWeb:1});CALC.render()");
    assert.equal(await hp(page),max,'setting layers never subtracts HP');
    await page.tap('[data-a=mpick][data-src=custom][data-i="0"]');
    await closeLog();
    const loss=Math.floor(max/8)+Math.floor(max/6);
    assert.equal(await hp(page),max,'a switch-in changes no HP');
    assert.equal(await page.value('CALC.state().custom[0].status||""'),'','nor status');
    assert.equal(await page.value('CALC.mon("mine").stg[4]'),5,'nor stages');
    assert.equal(await page.count(chip),1,'the hazard chip is offered');
    assert.equal(await page.count('.cc[data-s=mine] .dberry'),1,'one chip in the berry spot');
    assert.equal(await page.text(chip),'−'+loss,'its label is the net HP change');
    assert.match(await page.value(`document.querySelector('${chip}').title`),/Stealth Rock −\d+.*Spikes −\d+.*Badly poisoned/);
    assert.match(await page.value(`document.querySelector('${chip}').getAttribute('aria-label')`),/Apply entry hazards/);
    await page.value('CALC.render();CALC.render()');
    assert.equal(await hp(page),max,'redraw does not apply entry');
    await page.reload();await page.goto('#/calc');
    assert.equal(await hp(page),max,'reload does not apply entry');
    assert.equal(await page.count(chip),1,'the offer survives reload');
    const speed=await page.value('(CALC.mon("mine").stg||[])[4]||0');
    await page.tap(chip);
    await closeLog();
    assert.equal(await hp(page),max-loss,'one tap: Rocks and two Spikes layers');
    assert.equal(await page.value('CALC.state().custom[0].status'),'tox');
    assert.equal(await page.value('(CALC.mon("mine").stg||[])[4]||0'),web?speed-1:speed,'Web lowers Speed by one stage');
    assert.equal(await page.count(chip),0,'gone once tapped');
    await page.value('CALC.render()');
    assert.equal(await hp(page),max-loss,'applied once');
    // ↺: a fresh send-out, offered again; an HP edit ends the moment.
    await page.tap('[data-a=hpfull][data-s=mine]');
    assert.equal(await hp(page),max);
    assert.equal(await page.count(chip),1,'↺ offers it again');
    await page.setBox('[data-hp=mine]',max-1);
    assert.equal(await page.count(chip),0,'an HP edit ends it');
    assert.equal(await hp(page),max-1);
    // A move / damage tap on either side ends it, for both cards.
    await page.tap('[data-a=hpfull][data-s=mine]');
    await page.value("Object.assign(CALC.state().field,{defStealthRock:1});CALC.state().hzOffer.foe=CALC.key('foe');CALC.render()");
    assert.equal(await page.count('[data-a=hzapply][data-s=foe]'),1,'the foe card has its own chip');
    await page.value("document.querySelector('[data-a=sub]:not([disabled])').scrollIntoView({block:'center'})");
    await page.tap('[data-a=sub]:not([disabled])');
    await closeLog();
    assert.equal(await page.count('[data-a=hzapply]'),0,'a damage tap ends both');
    // The turn end ends it too; the berry chip comes back in that spot.
    await page.tap('[data-a=hpfull][data-s=mine]');
    await page.value(`(()=>{const state=CALC.state();state.field={atkToxicSpikes:1};CALC.set('mine','i','Sitrus Berry');CALC.set('mine','hp',Math.floor(${max}/2));state.hzOffer.mine=CALC.key('mine');CALC.render();})()`);
    assert.equal(await page.count(chip),1,'the hazard chip takes the berry spot');
    assert.equal(await page.count('.cc[data-s=mine] [data-a=berry]'),0,'no berry chip beside it');
    assert.equal(await page.text(chip),'Psn','only a status: its short label');
    await page.tap(chip);
    await closeLog();
    assert.equal(await page.value('CALC.state().custom[0].status'),'psn');
    assert.equal(await page.count('.cc[data-s=mine] [data-a=berry]'),1,'the berry chip returns');
    // Reset fight / trainer change offer both sides again.
    await page.tap('[data-a=fightreset]');
    assert.equal(await page.value("CALC.state().hzOffer.foe===CALC.key('foe')"),true,'Reset fight offers the foe');
    // Older builds' applied-markers load without applying anything.
    await page.value("(()=>{const state=CALC.state();state.field={atkStealthRock:1};state.hazardEntry={mine:{key:CALC.key('mine'),damage:{},status:false,web:false,v:2}};delete state.hzOffer;localStorage.setItem(LS.dmg,JSON.stringify(state));})()");
    await page.reload();await page.goto('#/calc');
    assert.equal(await hp(page),max,'a stored marker never applies damage');
    assert.equal(await page.value('CALC.state().hazardEntry===undefined'),true,'the old marker is dropped');
    assert.equal(await page.count(chip),0,'and offers nothing');
  },
},{
  id:'entry immunity edits', title:'blocked hazards show no chip; lifting the block shows it, never applies it', sizes,
  run:async page=>{
    await seed(page);
    const max=await hp(page);
    const chip='[data-a=hzapply][data-s=mine]';
    const eighth=Math.floor(max/8);
    const cases=[
      ...(guide.cfg.calc.gen>=8?[{before:"mon.i='Heavy-Duty Boots'",after:"mon.i=''",field:{atkStealthRock:1,atkToxicSpikes:2,atkStickyWeb:1},loss:eighth}]:[]),
      {before:"mon.a=AB.findIndex(entry=>entry[0]==='Magic Guard')",after:'mon.a=-1',field:{atkStealthRock:1},loss:eighth},
      {before:'state.field.atkMagnetRise=1',after:'state.field.atkMagnetRise=0',field:{atkSpikes:1,atkStickyWeb:1},loss:eighth},
      {before:"mon.a=AB.findIndex(entry=>entry[0]==='Immunity')",after:'mon.a=-1',field:{atkToxicSpikes:2},loss:0},
    ];
    for(const fixture of cases){
      await page.value(`(()=>{const state=CALC.state(),mon=state.custom[0];state.mine={src:'custom',b:0,i:0};state.field=${JSON.stringify(fixture.field)};mon.hp=${max};mon.a=-1;mon.i='';mon.status='';CALC.render();CALC.set('mine','stg',[0,0,0,0,5]);state.hzOffer={mine:CALC.key('mine')};${fixture.before};CALC.render();})()`);
      assert.equal(await page.count(chip),0,'a blocked hazard offers nothing');
      await page.value(`(()=>{const state=CALC.state(),mon=state.custom[0];${fixture.after};CALC.render();})()`);
      assert.equal(await hp(page),max,'eligibility edits never apply damage');
      assert.equal(await page.count(chip),1,'newly eligible hazards are offered');
      await page.tap(chip);
      if(await page.count('#calc-log'))await page.tap('#calc-log button');
      assert.equal(await hp(page),max-fixture.loss);
      if(fixture.field.atkToxicSpikes)assert.equal(await page.value('CALC.state().custom[0].status'),'tox');
      if(fixture.field.atkStickyWeb&&web)assert.equal(await page.value('CALC.mon("mine").stg[4]'),4);
      assert.equal(await page.count(chip),0,'applied once');
    }
  },
},{
  id:'field groups', title:'profile gating, layer cycling, folded active counts and one-window expanded groups', sizes,
  run:async page=>{
    await seed(page);
    await page.tap('.dfield > summary');
    assert.ok(await page.value('document.querySelector(".dfield").offsetHeight<=innerHeight-8'),'automatic source lines and closed groups fit one window, with internal scrolling if needed');
    assert.equal(await page.count('[data-f$=Steelsurge]'),0,'steel hazard is engine-only');
    assert.equal(await page.count('[data-f=atkProtect]'),guide.cfg.calc.field.some(entry=>entry.k==='atkProtect')?1:0);
    assert.equal(await page.count('[data-f$=Protected]'),0,'no legacy Protected keys');
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
    assert.equal(await hp(page,'foe'),max,'the switch-in changes nothing');
    assert.equal(await page.count('[data-a=hzapply][data-s=mine]'),0,'Foe hazards are not offered to the player');
    await page.tap('[data-a=hzapply][data-s=foe]');
    if(await page.count('#calc-log'))await page.tap('#calc-log button');
    assert.equal(await hp(page,'foe'),max-Math.floor(max/8));
    const amounts=await page.value('[...document.querySelectorAll(".dturn")].map(button=>button.textContent)');
    assert.ok(amounts.includes(String(Math.floor(max/4))),'Player curse');
    assert.ok(amounts.includes(String(Math.floor(max/16))),'Foe Ingrain');
    await page.tap('.cc[data-s=foe] .sp');
    assert.equal(await hp(page,'foe'),max-Math.floor(max/8),'direction change is not entry');
    assert.deepEqual(await page.value('[...document.querySelectorAll(".dturn")].map(button=>button.textContent)'),amounts);
    assert.equal(await page.value('Number(document.querySelector(".cc[data-s=foe] .sp i").textContent.replace(/[^0-9]/g,""))'),await page.value(`DMG.speed({id:CALC.state().edits["foe:"+CALC.state().foe.k+":1"].id,lv:50,ab:-1,stg:[0,0,0,0,0,${web?4:5}]},CALC.state().field,"def")`));
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

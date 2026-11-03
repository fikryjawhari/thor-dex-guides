import assert from 'node:assert/strict';
import {evaluateSingles, evaluateDoubles} from '../../template/calc/ai/hardlove/index.mjs';
import {prepareGuide, guideArg, fixturePatches, guide, setupCalc, runChecks, MODES} from '../calc_check_lib.mjs';

const file=prepareGuide(guideArg(process.argv),{tag:'calc-ai',edit:fixturePatches});
if(!file){console.log('SKIP calc-ai: no cfg.calc');process.exit(0);}
const enabled=guide().data.cfg.calc.ai==='hardlove';
const sizes=[[260,316],[480,316]];
const rows=page=>page.value(`[...document.querySelectorAll('.aicol')].map(column=>({index:+column.dataset.aiIndex,percent:+column.dataset.aiPercent,probability:+column.dataset.aiProbability,score:column.querySelector('small').textContent}))`);
const score=value=>String(value??'—').replace(/-/g,'−');
async function compare(page){
 const state=await page.value('CALC.ai.input()'),actual=await rows(page);
 const result=state.foes?evaluateDoubles(state):evaluateSingles(state);
 if(!state.foes){
  assert.deepEqual(actual,result.moves.map(move=>({index:move.index,percent:move.percent,probability:move.probability,score:score(move.score)})),'column equals the independent node engine call');
  assert.equal(actual.reduce((total,move)=>total+move.percent,0)+result.switch.percent,100,'move % + Sw = 100');
  assert.equal(await page.value(`document.querySelector('.aiswitch')?.textContent||''`),result.switch.percent?`Sw ${result.switch.percent}%`:'','switch chip equals engine');
 }else{
  const viewed=await page.value('({...CALC.ai.viewed})'),foe=result.foes.find(foe=>foe.slot===viewed.foe);
  for(const row of actual){
   const pair=foe.pairs.find(pair=>pair.index===row.index&&pair.target.side==='player'&&pair.target.slot===viewed.mine);
   const ally=foe.pairs.find(pair=>pair.index===row.index&&pair.target.side==='foe');
   const move=state.foes[viewed.foe].moves[row.index];
   const allyOnly=move.target==='adjacentAlly'||move.target==='self'||!foe.pairs.some(pair=>pair.index===row.index&&pair.target.side==='player'&&pair.probability>0)&&ally?.probability>0;
   const expected=allyOnly?ally:pair;
   assert.equal(row.percent,expected?.percent||0,'doubles displayed target %');
   assert.equal(row.probability,expected?.probability||0,'doubles exact marginal');
   assert.equal(row.score,score(expected?.score),'doubles score label');
  }
  for(const foe of result.foes)assert.equal(foe.pairs.reduce((total,pair)=>total+pair.percent,0),100,'all target pairs sum to 100');
 }
 return result;
}
const checks=[{
 id:'profile',title:'AI resources and columns exist only for the Hardlove profile',sizes,modes:MODES,
 run:async page=>{
  await setupCalc(page);
  assert.equal(await page.value(`typeof window.createCalcAI==='function'`),enabled,'adapter is profile gated');
  assert.equal(await page.count('.aicol')>0,enabled,'foe move odds');
  assert.equal(await page.count('.dres:first-of-type .aicol'),0,'no player odds');
  if(!enabled){assert.equal(await page.count('.aiswitch,.airow,.aidetail'),0,'no AI UI');assert.equal(await page.value(`typeof GUIDE_AI`),'undefined','no AI engine');}
 },
}];
if(enabled)checks.push({
 id:'singles',title:'status/damage odds match node, Auto first-turn scratch and lock/taunt hooks',sizes,modes:MODES,
 run:async page=>{
  await setupCalc(page,{mine:['party',0]});
  await page.value(`CALC.set('foe','m',['Tackle','Toxic','Fake Out','Protect'].map(name=>M.indexOf(name)));CALC.state().dir='in';CALC.render()`);
  await compare(page);
  assert.equal(await page.count('.dres.na .aicol'),0,'no columns in the player result column');
  assert.equal(await page.count('.mr.st .aicol'),2,'status rows have columns');
  assert.equal(await page.value('CALC.ai.input().attacker.facts.firstTurnOut'),true,'first turn defaults on');
  await page.value(`CALC.ai.setFacts('foe',{lastUsedMove:'Tackle',encoredTurns:2});CALC.render()`);
  const locked=await compare(page);assert.equal(locked.moves[0].percent,100,'Encore hook is ready for 3b');assert.equal(locked.moves[0].score,'Lock');
  await page.value(`CALC.ai.setFacts('foe',{encoredTurns:0,tauntTurns:2});CALC.render()`);
  const taunted=await compare(page);assert.equal(taunted.moves[1].percent,0,'Taunt zeroes Toxic');assert.equal(taunted.moves[3].percent,0,'Taunt zeroes Protect');
  await page.tap('.dres:not(.na) .dendpoint[data-roll="max"]');
  assert.equal(await page.value('CALC.ai.input().attacker.facts.firstTurnOut'),false,'damage tap clears foe Auto');
  assert.equal(await page.value('CALC.ai.input().defender.facts.firstTurnOut'),false,'damage tap clears player Auto');
  await page.tap('[data-a="hpfull"][data-s="foe"]');
  assert.equal(await page.value('CALC.ai.input().attacker.facts.firstTurnOut'),true,'card reset clears facts');
  assert.equal(await page.value(`CALC.ai.evaluate()===CALC.ai.evaluate()`),true,'same-input result is cached');
  assert.equal(await page.value(`JSON.stringify(localStorage.getItem(LS.dmg)).includes('firstTurnOut')`),false,'facts never persist');
 },
},{
 id:'doubles',title:'target rows and ally-only odds, stable implicit slots when viewing either active',sizes,modes:MODES,
 run:async page=>{
  await setupCalc(page,{mine:['party',0]});
  await page.value(`(()=>{const state=CALC.state();state.team=state.imp.party.slice(0,2).map(mon=>({src:'party',pid:mon.pid}));state.field.gameType='Doubles';state.fman.push('gameType');CALC.set('foe','m',['Tackle','Toxic','Helping Hand','Protect'].map(name=>M.indexOf(name)));state.dir='in';CALC.ai.clear();CALC.render();})()`);
  await compare(page);
  assert.equal(await page.count('.aiswitch'),0,'no doubles switch chip');
  const before=await page.value('CALC.ai.input().foePartySlots');
  await page.tap('.dres:not(.na) .mr:first-child>.mm');
  const detail=await page.text('.dres:not(.na) .mr:first-child .aitargets');
  assert.ok(detail.split('→').length>=4,'every player and ally target listed');
  assert.ok(await page.count('.dres:not(.na) .mr:first-child .aibranches'),'score branches follow targets');
  const allyBefore=(await rows(page))[2];assert.ok(allyBefore.score.startsWith('A'),'ally-only score has A prefix');
  await page.value(`CALC.state().mine={src:'party',b:0,i:1};CALC.render()`);
  assert.deepEqual(await page.value('CALC.ai.input().foePartySlots'),before,'viewing leaves foe slots stable');
  await compare(page);
  assert.equal((await rows(page))[2].probability,allyBefore.probability,'ally odds do not depend on viewed player');
  await page.value(`CALC.state().foe.i=1;CALC.render()`);
  assert.deepEqual(await page.value('CALC.ai.input().foePartySlots'),before,'viewing leaves opposite slots stable');
  await compare(page);
 },
});
await runChecks({name:'calc-ai',file,checks});

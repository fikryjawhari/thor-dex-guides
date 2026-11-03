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
  if(!enabled){assert.equal(await page.count('.aiswitch,.airow,.aidetail,.aigrid,.airank,.dfai,[data-aifact]'),0,'no AI UI (columns, grids, ranks, Field AI)');assert.equal(await page.value(`typeof GUIDE_AI`),'undefined','no AI engine');}
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
// Unit 3b: grids (order, bench ranks, taps after a reorder), doubles controls and Field → AI.
const wait=ms=>new Promise(done=>setTimeout(done,ms));
const team=format=>`(()=>{const state=CALC.state();state.team=state.imp.party.slice(0,4).map(mon=>({src:'party',pid:mon.pid}));${format==='Doubles'?"state.field.gameType='Doubles';state.fman.push('gameType');":''}CALC.set('foe','m',['Tackle','Toxic','Fake Out','Protect'].map(name=>M.indexOf(name)));state.dir='in';CALC.ai.clear();CALC.render();})()`;
const cells=page=>page.value(`[...document.querySelectorAll('.dfoe .dstrip>button:not(.ph)')].map(cell=>{const r=cell.getBoundingClientRect();return {i:+cell.dataset.i,name:cell.getAttribute('aria-label'),rank:+(cell.querySelector('.airank')?.textContent||0),ko:cell.classList.contains('ko'),field:cell.classList.contains('aifld'),x:Math.round(r.left),y:Math.round(r.top)};})`);
const slotIndices=page=>page.value(`CALC.ai.slots.foe.map(key=>+key.split(':').pop())`);
async function ranksMatch(page,label){
 const order=(await page.value('CALC.ai.switchInOrder()')).order,list=await cells(page);
 const ranked=list.filter(cell=>cell.rank).sort((a,b)=>a.rank-b.rank);
 assert.deepEqual(ranked.map(cell=>cell.i),order.filter(index=>list.some(cell=>cell.i===index&&!cell.ko)),label+': bench numbers follow switchInOrder');
 assert.deepEqual(ranked.map(cell=>cell.rank),ranked.map((cell,n)=>n+1),label+': ranks 1..n');
 assert.ok(list.every(cell=>!cell.rank||!cell.ko&&!cell.field),label+': no rank on the field or fainted');
 return list;
}
async function tapIn(page,selector){await page.value(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await page.tap(selector);}
async function openAI(page){
 await page.value(`(()=>{const field=document.querySelector('details.dfield');if(field&&!field.open)field.open=true;})()`);await page.settle();
 if(!await page.value(`document.querySelector('details[data-fgroup="ai"]').open`))await tapIn(page,'details[data-fgroup="ai"]>summary');
}
const buttons=page=>page.value(`Object.fromEntries([...document.querySelectorAll('.dfai [data-aifact]')].map(button=>[button.dataset.aifact,{on:button.getAttribute('aria-pressed')==='true',auto:button.classList.contains('dauto'),disabled:button.disabled,text:button.textContent}]))`);
async function lastMove(page,name){await page.value(`(()=>{const select=document.querySelector('select[data-ailast]');select.value=${JSON.stringify(name)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await page.settle();}
if(enabled)checks.push({
 id:'grid',title:'singles foe grid: field r1c1, then the switch-in order down the columns with rank numbers, fainted last; a double tap follows the Pokemon',sizes,modes:MODES,
 run:async page=>{
  await setupCalc(page,{mine:['party',0]});await page.value(team('Singles'));await page.settle();
  let list=await ranksMatch(page,'start');
  assert.equal(list[0].i,await page.value('CALC.state().foe.i'),'the foe on the field is r1c1');
  if(page.width<480)assert.ok(list[1].x===list[0].x&&list[1].y>list[0].y,'narrow grid reads down, then right');
  const next=list.find(cell=>cell.rank===1);
  await page.value(`(()=>{const state=CALC.state();state.edits['foe:'+state.foe.k+':'+${next.i}]={hp:0};CALC.render();})()`);
  list=await ranksMatch(page,'fainted');
  assert.equal(list.at(-1).i,next.i,'a fainted foe goes last');assert.ok(list.at(-1).ko,'and grey');
  const bench=list.find(cell=>cell.rank===1),at=list.indexOf(bench)+1;
  await wait(400);
  await page.tap(`.dfoe .dstrip>button:nth-child(${at})`);
  assert.equal((await cells(page))[0].i,bench.i,'a picked foe moves to r1c1');
  await page.tap(`.dfoe .dstrip>button:nth-child(${at})`);
  assert.equal(await page.value(`P.find(entry=>String(entry.id)===location.hash.slice(4))?.n||location.hash`),bench.name,'the second tap of a double tap follows the moved Pokemon to its dex page');
 },
},{
 id:'doubles grid',title:'doubles: the field in column 1, the replacements next; a bench tap takes the viewed cell, a foe replacement the fainted one',sizes,modes:MODES,
 run:async page=>{
  await setupCalc(page,{mine:['party',0]});await page.value(team('Doubles'));await page.settle();
  let list=await ranksMatch(page,'doubles');
  const slots=await slotIndices(page);
  assert.deepEqual(list.slice(0,2).map(cell=>cell.i),slots,'column 1 is the two on the field');
  assert.deepEqual(list.slice(2,4).map(cell=>cell.rank),[1,2],'column 2 holds the first and second replacement');
  const mine=await page.value(`[...document.querySelectorAll('.dteamrow>button.aifld')].map(cell=>cell.dataset.pid)`);
  assert.deepEqual(mine,await page.value(`CALC.ai.slots.mine.map(key=>key.slice(5))`),'my two on the field first');
  const viewed=await page.value('CALC.ai.viewed.foe'),first=list.find(cell=>cell.rank===1);
  await wait(400);await page.tap(`.dfoe .dstrip>button[data-i="${first.i}"]`);
  const after=await slotIndices(page);
  assert.equal(after[viewed],first.i,'a bench tap takes the viewed cell');assert.equal(after[1-viewed],slots[1-viewed],'the other stays');
  assert.ok((await cells(page)).find(cell=>cell.i===slots[viewed]).rank>0,'the replaced one goes back to the bench with a rank');
  await page.value(`(()=>{const state=CALC.state();state.edits['foe:'+state.foe.k+':'+${slots[1-viewed]}]={hp:0};CALC.render();})()`);
  list=await ranksMatch(page,'after a KO');
  const replacement=list.find(cell=>cell.rank===1);
  await wait(400);await page.tap(`.dfoe .dstrip>button[data-i="${replacement.i}"]`);
  const refilled=await slotIndices(page);
  assert.equal(refilled[1-viewed],replacement.i,'the replacement takes the fainted one\'s cell');assert.equal(refilled[viewed],first.i,'the viewed one stays');
  await compare(page);
 },
},{
 id:'field ai',title:'Field → AI above Global: Encored waits for Last move, then locks it; Taunt zeroes status rows; Auto first turn; Player side; scratch only',sizes,modes:MODES,
 run:async page=>{
  await setupCalc(page,{mine:['party',0]});await page.value(team('Singles'));await page.settle();
  await openAI(page);
  assert.ok(await page.value(`!!(document.querySelector('details[data-fgroup="ai"]').compareDocumentPosition(document.querySelector('details[data-fgroup="field:battle"]'))&Node.DOCUMENT_POSITION_FOLLOWING)`),'AI sits above Global');
  assert.equal(await page.value(`document.querySelector('.dfai [data-aiside][aria-pressed="true"]').dataset.aiside`),'foe','Foe first');
  let state=await buttons(page);
  assert.ok(state.firstTurnOut.on&&state.firstTurnOut.auto&&state.firstTurnOut.text.includes('·A'),'First turn: Auto on');
  assert.ok(state.encoredTurns.disabled,'Encored disabled without Last move');
  await tapIn(page,'[data-aifact="tauntTurns"]');
  assert.deepEqual(await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr.st .aicol')].map(column=>+column.dataset.aiPercent)`),[0,0],'Taunted zeroes the status rows');
  await compare(page);
  await tapIn(page,'[data-aifact="tauntTurns"]');
  await lastMove(page,'Tackle');
  assert.ok(!(await buttons(page)).encoredTurns.disabled,'Encored enabled with Last move');
  await tapIn(page,'[data-aifact="encoredTurns"]');
  const locked=await compare(page);
  assert.equal(locked.moves[0].percent,100,'the locked move shows 100 %');
  assert.equal(await page.value(`+document.querySelector('.dres:not(.na) .aicol[data-ai-index="0"]').dataset.aiPercent`),100,'its row says 100 %');
  await ranksMatch(page,'after toggles');
  await lastMove(page,'');
  assert.equal(await page.value('CALC.ai.input().attacker.facts.encoredTurns'),0,'clearing Last move clears Encore');
  await tapIn(page,'[data-aifact="firstTurnOut"]');
  state=await buttons(page);assert.ok(!state.firstTurnOut.on&&!state.firstTurnOut.auto,'a tap overrides Auto');
  await tapIn(page,'.dfai [data-aiside="mine"]');
  state=await buttons(page);
  assert.ok(['firstTurnOut','confusion','attract'].every(name=>state[name]),'Player toggles');
  await tapIn(page,'[data-aifact="confusion"]');
  assert.equal(await page.value('CALC.ai.input().defender.facts.confusion'),true,'Confused feeds the engine');
  assert.ok(await page.value(`/AI · \\d/.test(document.querySelector('.dfai>summary').textContent)`),'summary counts set facts');
  assert.equal(await page.value(`Object.values(localStorage).join().includes('confusion')`),false,'no saved keys');
  await page.value('CALC.ai.clear();CALC.render()');
  assert.equal(await page.value('CALC.ai.dirty()'),false,'clearBattle clears the toggles');
 },
});
await runChecks({name:'calc-ai',file,checks});

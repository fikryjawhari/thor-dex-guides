window.createCalcAI=function(ctx){
const api=GUIDE_AI,data=ctx.data,profile=ctx.profile,byId=Object.fromEntries(data.P.map(mon=>[mon.id,mon]));
const id=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const stages=['attack','defense','spAttack','spDefense','speed'];
const forms=new Map(),bases=new Map(),stones=new Set(data.P.map(mon=>mon.stone).filter(Boolean));
for(const [key,value] of Object.entries(data.GID.sp)){const [species,form]=key.split(':').map(Number);if(!forms.has(value))forms.set(value,{species,form});if(form===0)bases.set(species,byId[value]?.n);}
const facts={},manual={},slots={mine:[],foe:[]},viewed={mine:0,foe:0};
let cacheKey='',cached=null,lastInput=null,lastParties=null;
const empty=()=>({species:'',level:1,types:[],ability:'',item:'',status:'',attack:1,defense:1,spAttack:1,spDefense:1,speed:1,currentHP:0,totalHP:1,statBoosts:{},moves:[],facts:{}});
const metadata=(kind,name)=>api.metadata[kind][id(name)]||{};
function party(side){
 const selected=ctx.sideInfo(side),trainer=ctx.trainer();
 if(side==='foe')return (trainer?.p||[]).map((unused,index)=>{const key='foe:'+trainer.k+':'+index;return {key,mon:ctx.applyEdits(ctx.foeBase(trainer,index),key)};});
 let members=ctx.team().map(entry=>({key:'mine:'+entry.m.pid,mon:entry.src==='custom'?entry.m:ctx.applyEdits(entry.m,'mine:'+entry.m.pid)}));
 if(!members.length)members=(ctx.state().imp?.party||[]).map(mon=>({key:'mine:'+mon.pid,mon:ctx.applyEdits(mon,'mine:'+mon.pid)}));
 if(!members.some(entry=>entry.key===selected.key)&&selected.base){if(members.length===6)members.pop();members.push({key:selected.key,mon:selected.custom?selected.base:ctx.applyEdits(selected.base,selected.key)});}
 return members;
}
function syncSlots(side,party,doubles){
 const key=ctx.sideInfo(side).key,count=doubles?2:1;
 const old=slots[side].slice();
 slots[side]=slots[side].slice(0,count).map(value=>party.some(entry=>entry.key===value)?value:null);
 // A picked bench Pokemon takes the viewed one's cell (switching it in); a foe replacement takes a fainted one's cell.
 if(!slots[side].includes(key)){const view=Math.min(viewed[side],count-1),down=slot=>{const entry=party.find(entry=>entry.key===slots[side][slot]);return !!entry&&!(ctx.resolve(ctx.megaView(entry.mon)).hp>0);},fainted=side==='foe'&&!down(view)?[0,1].slice(0,count).find(down):undefined;slots[side][fainted??view]=key;}
 while(slots[side].length<count)slots[side].push(null);
 for(let slot=0;slot<count;slot++)if(!slots[side][slot])slots[side][slot]=party.find(entry=>!slots[side].includes(entry.key))?.key||null;
 for(const previous of old)if(previous&&!slots[side].includes(previous)){delete facts[previous];delete manual[previous];}
 viewed[side]=Math.max(0,slots[side].indexOf(key));
}
function move(index,key,slot,active){
 const source=data.MV[index],override=active?ctx.state().mvo[key+':'+slot]||{}:{};
 if(!source.aiEffect)throw new Error('Missing Hardlove AI move effect: '+data.M[index]);
 const targets={normal:'SINGLE_TARGET',allAdjacentFoes:'ADJACENT_OPPONENTS',allAdjacent:'ALL_ADJACENT'};
 return {name:data.M[index],type:override.t||source.t,category:source.c,power:override.bp??source.bp??(source.c==='Status'?0:1),effect:source.aiEffect,secondaryEffectChance:source.aiChance,priority:source.pr||0,flags:source.f||[],target:targets[source.tg]||source.tg};
}
function mon(entry,side,active,field){
 let input=ctx.megaView(entry.mon);
 if(active)input=entry.key===ctx.sideInfo(side).key?ctx.getMon(side):ctx.fightView({...input,...ctx.scratch[entry.key],vol:ctx.state().tgt[entry.key]||''});
 if(!Number.isFinite(input.l))return null;
 const resolved=ctx.resolve(input),species=byId[input.id],form=forms.get(input.id)||{form:0},prefix=side==='foe'?'def':'atk';
 let [totalHP,attack,defense,spAttack,spDefense,speed]=resolved.stats;
 if(active&&field[prefix+'PowerTrick'])[attack,defense]=[defense,attack];
 const item=input.used?'':input.i||'',itemData=metadata('items',item),moves=(input.m||[]).flatMap((index,slot)=>index==null?[]:[move(index,entry.key,slot,active)]);
 const iv=input.iv||[31,31,31,31,31,31],ability=resolved.abil;
 const baseFacts={firstTurnOut:true,lastUsedMove:'',moveNoChoice:'',encoredTurns:0,encoredMove:'',tauntTurns:0,disabledTurns:0,disabledMove:'',torment:false,sleepCounter:0,protectSuccessTurns:0,substitute:false,confusion:false,attract:false,yawn:false,ingrain:false,aquaRing:false,lockOn:false,imprisoned:false,healBlock:false,throatChopTimer:0,laserFocusTimer:0,bindingTurns:0,futurePredictionCount:0,wishCount:0,magnetRise:false,roost:false,lastResortCount:0,recycleItem:'',furyCutterCount:0,metronomeCount:0,slowStartCount:0,flashFire:false,abilityActivated:false,transformed:false,failedLastMove:false,teammateFaintedLastTurn:false,canBelch:false,cantEscape:false,perishSong:false,
  hiddenPowerType:api.GetHiddenPowerType(iv[0],iv[1],iv[2],iv[5],iv[3],iv[4]),flingPower:itemData.fling?.basePower||0,naturalGiftType:itemData.naturalGift?.type||'Normal',naturalGiftPower:itemData.naturalGift?.basePower||0,heldItemRemovable:!!item&&!stones.has(item),isMegaStone:stones.has(item),canEvolve:!!species.et?.length};
 baseFacts.sleepCounter=resolved.status==='slp'?2:0;
 if(active){
  Object.assign(baseFacts,{focusEnergy:!!field[prefix+'Focus'],laserFocusTimer:field[prefix+'LaserFocus']?1:0,leechSeed:!!field[prefix+'Seeded'],ingrain:!!field[prefix+'Ingrain'],aquaRing:!!field[prefix+'AquaRing'],magnetRise:!!field[prefix+'MagnetRise'],roost:!!field[prefix+'Roost'],dig:input.vol==='dig',fly:input.vol==='fly',dive:input.vol==='dive',minimized:input.vol==='min',isSwitching:input.vol==='switch',knockOffFlag:!!input.used,flashFire:ability==='Flash Fire'&&!!input.abilityOn,abilityActivated:!!input.abilityOn});
  baseFacts.magnetRiseTurns=baseFacts.magnetRise?1:0;baseFacts.roostFlag=baseFacts.roost;baseFacts.isEnemy=side==='foe';baseFacts.flashFireActivated=baseFacts.flashFire;baseFacts.wideOpen=!!field[prefix+'GlaiveRush'];baseFacts.toxicCounter=Math.max(0,(ctx.toxic[entry.key]||1)-1);
  Object.assign(baseFacts,facts[entry.key]);
 }
 if(!baseFacts.moveNoChoice&&baseFacts.lastUsedMove)baseFacts.moveNoChoice=baseFacts.lastUsedMove;
 if(!baseFacts.encoredMove&&baseFacts.encoredTurns)baseFacts.encoredMove=baseFacts.lastUsedMove;
 if(!baseFacts.disabledMove&&baseFacts.disabledTurns)baseFacts.disabledMove=baseFacts.lastUsedMove;
 if((ability==='Protosynthesis'&&(['Sun','Harsh Sunshine'].includes(field.weather)||item==='Booster Energy'))||(ability==='Quark Drive'&&(field.terrain==='Electric'||item==='Booster Energy')))baseFacts.paradoxBoostedStat=api.BattleAI_GetHighestParadoxStat(attack,defense,spAttack,spDefense,speed);
 baseFacts.itemRemovable=baseFacts.heldItemRemovable;
 const stock=[api.speciesName(species.n),...api.weightNames(species.n)].map(name=>metadata('species',name)).find(entry=>entry.weightkg);
 return {species:bases.get(form.species)||species.n,form:form.form,level:input.l,types:resolved.types.slice(),ability,item,status:resolved.status,attack,defense,spAttack,spDefense,speed,totalHP,currentHP:resolved.hp,weight:Math.trunc(10*(profile.over?.species?.[species.id]?.weightkg??stock?.weightkg??1)),statBoosts:Object.fromEntries(stages.map((name,index)=>[name,active?resolved.stg[index]||0:0])),moves,facts:baseFacts};
}
function input(){
 if(!ctx.getMon('mine')||!ctx.getMon('foe'))return null;
 const original=ctx.field(),doubles=original.gameType==='Doubles',parties={mine:party('mine'),foe:party('foe')};
 for(const side of ['mine','foe'])syncSlots(side,parties[side],doubles);
 const field={...original,attacker:{},defender:{}};
 for(const [key,value] of Object.entries(original))for(const [prefix,side] of [['def','attacker'],['atk','defender']])if(key.startsWith(prefix)&&key.length>prefix.length){const name=key.slice(prefix.length);field[side][name[0].toLowerCase()+name.slice(1)]=value;}
 const partyMons={},actives={},partySlots={};
 for(const side of ['mine','foe']){
  partyMons[side]=parties[side].map(entry=>mon(entry,side,false,original));
  if(partyMons[side].some(value=>!value))return null;
  partySlots[side]=slots[side].map(key=>{const index=parties[side].findIndex(entry=>entry.key===key);if(index>=0)return index;partyMons[side].push(empty());return partyMons[side].length-1;});
  actives[side]=slots[side].map(key=>{const entry=parties[side].find(entry=>entry.key===key);return entry?mon(entry,side,true,original):empty();});
  if(actives[side].some(value=>!value))return null;
  for(let slot=0;slot<actives[side].length;slot++){
   const current=actives[side][slot];
   if(partySlots[side][slot]>=0)partyMons[side][partySlots[side][slot]]={...partyMons[side][partySlots[side][slot]],currentHP:current.currentHP,status:current.status};
  }
 }
 for(const side of ['mine','foe'])for(const current of actives[side]){
  const opponents=actives[side==='foe'?'mine':'foe'];
  current.facts.cantEscape ||= opponents.some(other=>other.currentHP>0&&(other.ability==='Shadow Tag'&&current.ability!=='Shadow Tag'||other.ability==='Magnet Pull'&&current.types.includes('Steel')||other.ability==='Arena Trap'&&!current.types.includes('Flying')&&current.ability!=='Levitate'))&&current.item!=='Shed Shell'&&!current.types.includes('Ghost');
 }
 field.weatherSuppressed=[...actives.mine,...actives.foe].some(current=>current.currentHP>0&&['Air Lock','Cloud Nine'].includes(current.ability));
 field.possibleHits=actives.mine.filter(current=>current.currentHP>0).length;
 lastParties=parties;
 if(doubles)return {foes:actives.foe,players:actives.mine,foeParty:partyMons.foe,playerParty:partyMons.mine,foePartySlots:partySlots.foe,playerPartySlots:partySlots.mine,firstRequestedSlot:0,field};
 return {attacker:actives.foe[0],defender:actives.mine[0],attackerParty:partyMons.foe,defenderParty:partyMons.mine,attackerPartySlot:partySlots.foe[0],field};
}
function evaluate(){
 const state=input();lastInput=state;
 const foes=state?.foes||[state?.attacker],players=state?.players||[state?.defender];
 if(!state||!players.some(current=>current?.currentHP>0)||foes.some(current=>current?.currentHP>0&&!current.moves.length)){cached=null;cacheKey='';return null;}
 const key=JSON.stringify(state);if(key===cacheKey)return cached;
 cached=state.foes?api.evaluateDoubles(state):state.attacker.currentHP>0?api.evaluateSingles(state):null;cacheKey=key;return cached;
}
// Grid order (display only, never saved): foe = the field, then the switch-in order, fainted last; mine = party order,
// in doubles my two on the field first. Zoroark (+0-2 random) gives several orders: the most likely one is shown.
let orderKey='',orderCached=null;
function switchOrder(state){
 const key=JSON.stringify(state);if(key===orderKey)return orderCached;
 let result=null;try{result=api.switchInOrder(state.foes?state:{foes:[state.attacker],players:[state.defender],foeParty:state.attackerParty,foePartySlots:[state.attackerPartySlot],field:state.field});}catch(error){result=null;}
 orderKey=key;orderCached=result?.order||(result?.orders?.length?result.orders.reduce((best,order)=>order.probability>best.probability?order:best).partySlots:null);return orderCached;
}
function grid(side){
 const state=input();if(!state||!lastParties)return null;
 const doubles=!!state.foes,party=lastParties[side],mons=side==='foe'?state.foeParty||state.attackerParty:state.playerParty||state.defenderParty;
 const alive=index=>mons[index]?.currentHP>0,field=slots[side].filter(key=>party.some(entry=>entry.key===key)),rank={};
 if(side==='mine'&&!doubles)return {keys:party.map(entry=>entry.key),field:0,rank};
 const bench=party.map((entry,index)=>index).filter(index=>!field.includes(party[index].key));
 let ranked=[];
 if(side==='foe'){const order=switchOrder(state)||[];ranked=order.filter(index=>bench.includes(index)&&alive(index));ranked.forEach((index,n)=>{rank[party[index].key]=n+1;});}
 const rest=bench.filter(index=>!ranked.includes(index)),keys=[...field,...[...ranked,...(side==='foe'?rest.filter(alive):rest),...(side==='foe'?rest.filter(index=>!alive(index)):[])].map(index=>party[index].key)];
 return {keys,field:doubles?field.length:0,rank};
}
function damage(){for(const side of ['mine','foe']){const key=ctx.sideInfo(side).key;if(!manual[key]?.has('firstTurnOut'))(facts[key]||={}).firstTurnOut=false;}}
function clear(){for(const key of Object.keys(facts))delete facts[key];for(const key of Object.keys(manual))delete manual[key];slots.mine=[];slots.foe=[];viewed.mine=viewed.foe=0;cached=null;cacheKey='';orderKey='';orderCached=null;lastInput=null;lastParties=null;}
// Field → AI (template/README.md → Damage calculator, AI): the battle facts the AI reads that the calc can't know, for the
// viewed on-field Pokemon of each side. Battle scratch (facts / manual): cleared on a switch, a new fight, ↺ and clearBattle.
// on: the value a tap sets; cycle: values in turn; last: needs Last move; when: shown only then; derived: the input can set it.
const TOGGLES={
 foe:[{k:'firstTurnOut',l:'First turn',auto:true},{k:'protectSuccessTurns',cycle:[0,1,2],l:value=>['Protect ×0','Protect last turn','Protect 2 turns'][value]},{k:'tauntTurns',l:'Taunted',on:3},{k:'encoredTurns',l:'Encored',on:3,last:true},{k:'disabledTurns',l:'Disabled',on:4,last:true},{k:'torment',l:'Torment',last:true},{k:'substitute',l:'Substitute'},{k:'sleepCounter',cycle:[1,2,3],l:value=>'Sleep '+value,when:mon=>mon.status==='slp'},{k:'throatChopTimer',l:'Throat Chop',on:2},{k:'wishCount',l:'Wish',on:1},{k:'cantEscape',l:'Can’t escape',derived:true},{k:'perishSong',l:'Perish Song'},{k:'canBelch',l:'Ate berry',when:mon=>mon.moves.some(move=>move.name==='Belch')}],
 mine:[{k:'firstTurnOut',l:'First turn',auto:true},{k:'confusion',l:'Confused'},{k:'attract',l:'Infatuated'},{k:'yawn',l:'Yawn'},{k:'nightmare',l:'Nightmare'},{k:'lockOn',l:'Lock-On'},{k:'imprisoned',l:'Imprison'},{k:'bindingTurns',l:'Bound',on:4},{k:'futurePredictionCount',l:'Future Sight',on:2},{k:'noCritical',l:'Lucky Chant'}],
};
let aiSide='foe';
function activeOf(state,side){if(!state)return null;return state.foes?(side==='foe'?state.foes:state.players)[viewed[side]]:side==='foe'?state.attacker:state.defender;}
const html=value=>String(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
function section(){
 const state=input();let count=0;
 const side=aiSide,mon=activeOf(state,side),key=ctx.sideInfo(side).key,own=facts[key]||{},set=manual[key]||new Set();
 for(const each of ['mine','foe']){const other=ctx.sideInfo(each).key,stored=facts[other]||{},mine=manual[other]||new Set();count+=Object.keys(stored).filter(name=>name!=='firstTurnOut'||mine.has(name)).length;}
 const segment=`<div class="dfsw" role="group" aria-label="AI side">${[['mine','Player'],['foe','Foe']].map(([value,label])=>`<button data-aiside="${value}" aria-pressed="${side===value}">${label}</button>`).join('')}</div>`;
 if(!mon||!mon.species)return {count,body:segment+'<div class="dtg aitg"><span class="aiempty">No Pokémon on the field</span></div>'};
 const last=mon.facts.lastUsedMove||'';
 const buttons=TOGGLES[side].filter(toggle=>!toggle.when||toggle.when(mon)).map(toggle=>{
  const value=mon.facts[toggle.k],auto=toggle.auto&&!set.has(toggle.k),derived=toggle.derived&&!own[toggle.k]&&!!value,disabled=toggle.last&&!last;
  const label=typeof toggle.l==='function'?toggle.l(value||0):toggle.l,pressed=toggle.k==='sleepCounter'?false:!!value;
  return `<button class="${auto||derived?'dauto':''}" data-aifact="${toggle.k}" aria-pressed="${pressed}"${disabled?' disabled title="Set Last move first"':''}>${html(label)}${auto||derived?'<sup>·A</sup>':''}</button>`;
 }).join('');
 const select=`<select class="ailast" data-ailast="${side}" aria-label="Last move"><option value="">Last move: none</option>${mon.moves.map(move=>`<option value="${html(move.name)}"${move.name===last?' selected':''}>Last: ${html(move.name)}</option>`).join('')}</select>`;
 return {count,body:segment+`<div class="dtg aitg">${select}${buttons}</div>`};
}
function setFact(side,name,value){
 const key=ctx.sideInfo(side).key,own=facts[key]||={};(manual[key]||=new Set()).add(name);
 if(name==='firstTurnOut')own[name]=!!value;else if(value===undefined||value===false||value===0||value==='')delete own[name];else own[name]=value;
 if(name==='lastUsedMove'&&!value)for(const locked of ['encoredTurns','disabledTurns','torment'])delete own[locked];
 if(!Object.keys(own).length)delete facts[key];
}
function tapFact(name){
 const side=aiSide,toggle=TOGGLES[side].find(toggle=>toggle.k===name),mon=activeOf(input(),side);if(!toggle||!mon)return;
 const value=mon.facts[name];
 if(toggle.cycle){const next=toggle.cycle[(toggle.cycle.indexOf(value||toggle.cycle[0])+1)%toggle.cycle.length];setFact(side,name,toggle.k==='sleepCounter'&&next===2?undefined:next);}
 else setFact(side,name,value?(toggle.auto?false:undefined):toggle.on??true);
}
document.addEventListener('click',event=>{if(location.hash!=='#/calc')return;const button=event.target.closest('[data-aiside],[data-aifact]');if(!button||!button.closest('#app')||button.disabled)return;
 if(button.dataset.aiside)aiSide=button.dataset.aiside;else tapFact(button.dataset.aifact);ctx.refresh();});
document.addEventListener('change',event=>{if(location.hash!=='#/calc')return;const select=event.target.closest('select[data-ailast]');if(!select)return;setFact(select.dataset.ailast,'lastUsedMove',select.value);ctx.refresh();});
const scoreText=value=>String(value??'—').replace(/-/g,'−');
function chip(side){const result=side==='foe'?evaluate():null;return result&&!result.foes&&result.switch.percent>0?`<span class="dvol aiswitch" title="AI hard-switch chance">Sw ${result.switch.percent}%</span>`:'';}
function displayed(){
 const result=evaluate();if(!result)return [];
 if(!result.foes)return result.moves;
 const foe=result.foes.find(foe=>foe.slot===viewed.foe);if(!foe)return [];
 return lastInput.foes[viewed.foe].moves.map((move,index)=>{
  const pairs=foe.pairs.filter(pair=>pair.index===index),ally=pairs.find(pair=>pair.target.side==='foe'),target=pairs.find(pair=>pair.target.side==='player'&&pair.target.slot===viewed.mine);
  const allyOnly=move.target==='adjacentAlly'||move.target==='self'||!pairs.some(pair=>pair.target.side==='player'&&pair.probability>0)&&ally?.probability>0;
  return {...(allyOnly?ally:target),index,name:move.name,percent:(allyOnly?ally:target)?.percent||0,probability:(allyOnly?ally:target)?.probability||0,pairs};
 });
}
function rows(output){
 const entries=displayed();if(!entries.length)return output;
 const highest=Math.max(...entries.map(entry=>entry.percent)),template=document.createElement('template');template.innerHTML=output;
 for(const row of template.content.querySelectorAll('.mr:not(.em)')){
  const body=row.querySelector('.mm'),entry=entries.find(entry=>entry.name===data.M[Number(body.dataset.mi)]);if(!entry)continue;
  row.classList.add('airow');row.classList.toggle('aitop',entry.percent===highest&&highest>0);
  const column=document.createElement('span');column.className='aicol'+(entry.percent?'':' aizero');column.dataset.aiIndex=entry.index;column.dataset.aiPercent=entry.percent;column.dataset.aiProbability=entry.probability;column.setAttribute('aria-label',`AI ${entry.percent}%, score ${scoreText(entry.score)}`);
  const percent=document.createElement('b'),score=document.createElement('small');percent.textContent=entry.percent+'%';score.textContent=scoreText(entry.score);column.append(percent,score);body.prepend(column);
  if(entry.pairs){
   const detail=document.createElement('div');detail.className='aidetail';
   const targets=document.createElement('div');targets.className='aitargets';
   // The open row: every target, the viewed one first (`→ Scizor 40 % +8 · → Typhlosion 14 % +6 · → ally Arceus 6 %`), then
   // the shown pair's score branches on one line (`base +6 · +2 25 %`; the slower foe's mixture: one per distinct context).
   const signed=value=>scoreText(value>0?'+'+value:value),order=pair=>pair.target.side==='foe'?2:pair.target.slot===viewed.mine?0:1;
   targets.textContent=entry.pairs.slice().sort((a,b)=>order(a)-order(b)).map(pair=>{
    const side=pair.target.side==='foe'?'foe':'mine',key=slots[side][pair.target.slot],target=lastParties[side].find(entry=>entry.key===key),name=target?ctx.resolve(ctx.megaView(target.mon)).name:'empty';
    const top=Math.max(...(pair.scoreContexts||[{branches:pair.branches}]).flatMap(context=>(context.branches||[]).map(branch=>branch.score)));
    return `→ ${side==='foe'?'ally ':''}${name} ${pair.percent} %${side==='foe'||!Number.isFinite(top)?'':' '+signed(top)}`;
   }).join(' · ');detail.append(targets);
   const shown=entry.pairs.find(pair=>pair.target.side===entry.target?.side&&pair.target.slot===entry.target?.slot);
   const texts=[...new Set((shown?.scoreContexts||[{branches:shown?.branches}]).map(context=>{
    const branches=context.branches||[];if(!branches.length)return '';
    const base=Math.min(...branches.map(branch=>branch.score));
    return [`base ${signed(base)}`,...branches.filter(branch=>branch.score!==base).map(branch=>`${signed(branch.score-base)} ${Number((branch.probability*100).toFixed(1))} %`)].join(' · ');
   }).filter(Boolean))];
   if(texts.length){const line=document.createElement('div');line.className='aibranches';line.textContent=texts.join(' | ');detail.append(line);}
   body.querySelector('.dd')?.prepend(detail);
  }
 }
 return template.innerHTML;
}
return {input,evaluate,damage,clear,grid,facts,slots,viewed,rows,chip,displayed,parties:()=>lastParties,current:()=>cached,lastInput:()=>lastInput,dirty:()=>Object.keys(facts).length>0,
 setFacts(side,patch){Object.assign(facts[ctx.sideInfo(side).key]||={},patch);},
 reset(key){delete facts[key];delete manual[key];},
 section,
 switchInOrder(options){const state=input();if(!state)return null;return api.switchInOrder(state.foes?state:{foes:[state.attacker],players:[state.defender],foeParty:state.attackerParty,foePartySlots:[state.attackerPartySlot],field:state.field},options);}
};
};

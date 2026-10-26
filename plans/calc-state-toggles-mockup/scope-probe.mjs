import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createEngine} from '../../tools/calc/run.mjs';

const load=async path=>JSON.parse(await readFile(path,'utf8'));
const data=await load('hacks/emerald-imperium/data.json');
const config=await load('hacks/emerald-imperium/hack.json');
const engine=await createEngine(data,config.cfg.calc);
const ability=name=>{
  const index=data.AB.findIndex(entry=>entry[0]===name);
  assert.ok(index>=0,name);
  return index;
};
const mon=(name,extra={})=>{
  const species=data.P.find(entry=>entry.n===name);
  assert.ok(species,name);
  return {id:species.id,lv:50,nat:'Serious',...extra};
};
const calculate=(attacker,defender,name,extra={},field={})=>{
  const index=data.M.indexOf(name);
  assert.ok(index>=0,name);
  return engine.calc(attacker,defender,{mv:index,...extra},field);
};
for(const name of ['Return','Frustration']){
  assert.equal(calculate(mon('Kangaskhan'),mon('Blissey'),name).bp,102,name+' defaults to 102');
  assert.ok(calculate(mon('Kangaskhan'),mon('Blissey'),name,{bp:102}),name+' accepts explicit 102');
}
const punch=calculate(mon('Mega Kangaskhan',{ab:ability('Parental Bond')}),mon('Blissey'),'Power-Up Punch');
const firstRange=[Math.min(...punch.per[0]),Math.max(...punch.per[0])];
const secondRange=[Math.min(...punch.per[1]),Math.max(...punch.per[1])];
assert.deepEqual(firstRange,[146,174]);
assert.deepEqual(secondRange,[54,64]);
assert.ok(secondRange[0]>Math.ceil(firstRange[0]/4),'child already benefits from Attack boost');
const stamina=calculate(mon('Cloyster'),mon('Mudsdale',{ab:ability('Stamina')}),'Icicle Spear',{hits:3});
assert.deepEqual(Array.from(stamina.per,rolls=>[Math.min(...rolls),Math.max(...rolls)]),[[30,36],[20,26],[14,20]]);
assert.equal(stamina.pre.length,2);
for(const extra of [{it:'Loaded Dice'},{ab:ability('Skill Link')}]){
  for(const hits of [1,2,3,4,5])assert.equal(calculate(mon('Cloyster',extra),mon('Blissey'),'Icicle Spear',{hits}).hits,hits);
}
const fixtures=await load('hacks/emerald-imperium/calc_matchups.json');
const fixtureResult=name=>{
  const matchup=fixtures.matchups.find(entry=>entry.name===name);
  assert.ok(matchup,name);
  return engine.calc(matchup.atk,matchup.def,matchup.slot,matchup.field);
};
const allyOff=fixtureResult('emperor-ally-off');
const allyOn=fixtureResult('emperor-ally-water');
const stacked=fixtureResult('emperor-ally-stack');
assert.deepEqual([allyOff.min,allyOff.max],[31,37]);
assert.deepEqual([allyOn.min,allyOn.max],[40,48]);
assert.deepEqual([stacked.min,stacked.max],[52,63]);
console.log('PASS engine-scope probes: Return / Frustration 102 by default; existing PuP, Stamina and Emperor; explicit hit counts');

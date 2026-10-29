import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createEngine, resolveProfile} from './run.mjs';
import {unboundCases} from './unbound_cases.mjs';
import {assumedTrainerSet} from './unbound_assumed.mjs';

const directory = new URL('../../hacks/unbound/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
if (!existsSync(new URL('data.json', directory)) || !configuration.cfg.calc) {
  console.log('SKIP unbound calc-check: no data.json or cfg.calc');
  process.exit(0);
}
const data = JSON.parse(readFileSync(new URL('data.json', directory), 'utf8'));
const fixtures = JSON.parse(readFileSync(new URL('unbound_expected.json', import.meta.url), 'utf8'));
const profile = await resolveProfile(configuration.cfg.calc);
const engine = await createEngine(data, profile);
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(profile.gen, 8);
assert.equal(profile.save, 'cfru');
assert.equal(profile.evs, true);
assert.equal(profile.zmove, true);
assert.equal(profile.assumedSets, 'level-up');
assert.ok(!profile.dynamax);
const cases = unboundCases(data);
assert.equal(fixtures.sha, 'ff6c3e339e276e6b4e8e44db58750b6534bc26aa');
assert.deepEqual(fixtures.results.map(test => test.name), cases.map(test => test.name));
let differences = 0;
for (const [index, test] of cases.entries()) {
  const result = plain(engine.calc(test.atk, test.def, test.slot, test.field));
  assert.ok(result, test.name);
  const per = result.per || Array.from({length:result.hits}, () => result.rolls);
  const expected = fixtures.results[index];
  assert.deepEqual(per, expected.ours || expected.per, test.name+' exact 16-roll distribution');
  assert.equal(result.priority, expected.priority, test.name+' priority');
  if (test.difference) {
    differences++;
    assert.equal(expected.difference, test.difference, test.name+' disagreement recorded');
    assert.notDeepEqual(per, expected.per, test.name+' oracle disagreement remains explicit');
  } else assert.equal(expected.ours, undefined, test.name+' must match hzla, not an alternate expectation');
}
const expectedByName = new Map(fixtures.results.map(test=>[test.name,test]));
for (const name of ['Multieye','Multiscale','Shadow Shield']) {
  assert.notDeepEqual(expectedByName.get(name+' full').per, expectedByName.get(name+' rocks').per, name+' rocks really disable the shield');
  assert.notDeepEqual(expectedByName.get(name+' full').per, expectedByName.get(name+' spikes').per, name+' spikes really disable the shield');
  assert.deepEqual(expectedByName.get(name+' full').per, expectedByName.get(name+' boots').per, name+' boots really preserve the shield');
}
const mon = (name='Mew', ab) => ({id:data.P.find(entry=>entry.n===name).id, lv:50, ab:ab ? data.AB.findIndex(entry=>entry[0]===ab) : -1});
const slot = {mv:data.M.indexOf('Tackle')};
for (const name of ['Focus Belt','Nine Lives']) {
  assert.equal(engine.hit(mon(), mon('Mew', name), {...slot,bp:10000}).def.hp, 1, name+' assumed Sturdy');
  assert.equal(engine.hit(mon('Mew','Mold Breaker'), mon('Mew',name), {...slot,bp:10000}).def.hp, 0, name+' bypass');
}
for (const [name, stat] of [['Pride',1],['Fiery Neigh',1],['Shocking Neigh',1],['Royal Roar',3]]) {
  assert.equal(engine.hit(mon('Mew',name), {...mon(),hp:1}, slot, {}, 'max').atk.stg[stat], 1, name+' KO boost');
}
for (const name of ['Cotton Cloud','Tangling Wool']) {
  assert.equal(engine.hit(mon(), mon('Mew',name), slot).atk.stg[5], -1, name+' speed drop');
}
const victim = mon();
const sand = plain(engine.residual(victim, {weather:'Vicious Sandstorm'}));
assert.equal(sand.find(part=>part.l==='Vicious Sandstorm').v[0], -Math.floor(engine.stats(victim)[0]/8));
assert.equal(fixtures.residual['Vicious Sandstorm'].damage, 0, 'hzla has no Vicious residual: documented disagreement');
assert.equal(fixtures.residual.Sand.damage, -Math.floor(engine.stats(victim)[0]/16), 'oracle residual harness really sees ordinary sand');
assert.equal(engine.residual(mon('Garchomp'), {weather:'Vicious Sandstorm'}).length, 0);
assert.equal(engine.residual({...victim,it:'Safety Goggles'}, {weather:'Vicious Sandstorm'}).length, 0);
assert.equal(engine.residual(victim, {weather:'Vicious Sandstorm'}, mon('Mew','Cloud Nine')).length, 0);
const trainers = data.TR.g.flatMap(group=>group.sec.flatMap(section=>section.tr));
const ordinary = trainers.filter(trainer=>trainer.p.every(mon=>!mon.m?.length));
assert.equal(ordinary.length, 292, 'unit 6 ordinary cards, not the superseded 310 catalogue assumption');
const bulbasaur = {id:data.P.find(entry=>entry.n==='Bulbasaur').id};
const assumed = assumedTrainerSet(data,bulbasaur,15);
assert.deepEqual(assumed.m.map(index=>data.M[index]), ['Leech Seed','Razor Leaf','Poison Powder','Sleep Powder']);
assert.deepEqual(assumed.iv, Array(6).fill(31));
assert.deepEqual(assumed.ev, Array(6).fill(0));
assert.equal(assumed.na,'Hardy');
assert.equal(assumed.mGuess,true);
assert.deepEqual(bulbasaur,{id:bulbasaur.id}, 'no trainer-card mutation');
assert.deepEqual(assumedTrainerSet(data,{...bulbasaur,m:[slot.mv]},50).m,[slot.mv], 'never replace sourced moves');
assert.notDeepEqual(assumedTrainerSet(data,bulbasaur,14).m,assumed.m, 'resolved level controls the move set');
assert.throws(()=>assumedTrainerSet(data,bulbasaur,NaN));
console.log(`PASS Unbound: ${cases.length-differences} exact hzla fixtures, ${differences} explicit disagreements; custom actions and Vicious residual`);

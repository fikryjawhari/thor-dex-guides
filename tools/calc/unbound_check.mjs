import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createEngine, resolveProfile} from './run.mjs';
import {unboundCases} from './unbound_cases.mjs';

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
assert.equal(engine.residual(mon('Garchomp'), {weather:'Vicious Sandstorm'}).length, 0);
assert.equal(engine.residual({...victim,it:'Safety Goggles'}, {weather:'Vicious Sandstorm'}).length, 0);
assert.equal(engine.residual(victim, {weather:'Vicious Sandstorm'}, mon('Mew','Cloud Nine')).length, 0);
console.log(`PASS Unbound: ${cases.length-differences} exact hzla fixtures, ${differences} explicit disagreements; custom actions and Vicious residual`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createEngine, resolveProfile} from './run.mjs';

const require = createRequire(import.meta.url);
const {Generations, Pokemon, Move, Field, calculate} = require('@smogon/calc');
const load = async path => JSON.parse(await readFile(new URL('../../' + path, import.meta.url), 'utf8'));
const data = await load('hacks/emerald-imperium/data.json');
const config = await load('hacks/emerald-imperium/hack.json');
const fixtures = await load('hacks/emerald-imperium/calc_matchups.json');
const profile = await resolveProfile(config.cfg.calc);
const engine = await createEngine(data, profile);
const plain = value => JSON.parse(JSON.stringify(value));
const unchanged = JSON.stringify({data, profile, fixtures});
const results = new Map(fixtures.matchups.map(matchup => [matchup.name,
  plain(engine.calc(matchup.atk, matchup.def, matchup.slot, matchup.field))]));
const fixture = name => fixtures.matchups.find(matchup => matchup.name === name);
const result = name => results.get(name);
const same = (first, second) => assert.deepEqual(result(first).rolls, result(second).rolls, first);
const round = value => Math.ceil(value - 0.5);
const staged = (stat, stage = 0) => Math.floor(stat * (stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)));

function sourceCategory(matchup) {
  const attacker = engine.stats(matchup.atk);
  const defender = engine.stats(matchup.def);
  const estimate = (attack, defense) => Math.floor(Math.floor(
    (Math.floor(2 * matchup.atk.lv / 5) + 2) * 100 *
    staged(attacker[attack], matchup.atk.stg?.[attack]) /
    staged(defender[defense], matchup.def.stg?.[defense])) / 50);
  const physical = estimate(1, 2);
  const special = estimate(3, 4);
  return {automatic: physical > special ? 'Physical' : 'Special', tie: physical === special};
}

function handDamage(matchup, modifier) {
  const move = data.MV[matchup.slot.mv];
  const attacker = engine.stats(matchup.atk);
  const defender = engine.stats(matchup.def);
  const physical = move.c === 'Physical';
  const attack = round(attacker[physical ? 1 : 3] * modifier / 4096);
  const defense = defender[physical ? 2 : 4];
  const base = Math.floor(Math.floor((Math.floor(2 * matchup.atk.lv / 5) + 2) * (matchup.slot.bp ?? move.bp) * attack / defense) / 50) + 2;
  const stab = data.P.find(entry => entry.id === matchup.atk.id).t.includes(move.t);
  return Array.from({length: 16}, (_, index) => {
    const rolled = Math.floor(base * (85 + index) / 100);
    return stab ? round(rolled * 1.5) : rolled;
  });
}

for (const ability of ['bull-rush', 'quill-rush', 'illusion']) {
  for (const category of ['physical', 'special']) {
    const on = `${ability}-${category}-on`;
    const off = `${ability}-${category}-off`;
    assert.deepEqual(result(on).rolls, handDamage(fixture(on), ability === 'illusion' ? 5325 : 4915), on);
    assert.deepEqual(result(off).rolls, handDamage(fixture(off), 4096), off);
    assert.ok(result(on).max > result(off).max, on);
    for (const power of [7, 17, 25, 41]) {
      const matchup = structuredClone(fixture(on));
      matchup.slot.bp = power;
      assert.deepEqual(plain(engine.calc(matchup.atk, matchup.def, matchup.slot, {}).rolls),
        handDamage(matchup, ability === 'illusion' ? 5325 : 4915), on + ' power ' + power);
    }
  }
}
same('ability-toggle-unrelated', 'bull-rush-physical-off');
same('ability-toggle-defender-only', 'bull-rush-physical-off');
assert.ok(result('emperor-ally-water').max > result('emperor-ally-off').max);
assert.ok(result('emperor-ally-stack').max > result('emperor-ally-water').max);
for (const name of fixtures.matchups.filter(matchup => matchup.name.startsWith('draco-')).map(matchup => matchup.name)) {
  const matchup = fixture(name);
  const expected = sourceCategory(matchup);
  assert.deepEqual(result(name).categoryChoice, {...expected, inverted: !!matchup.slot.invert}, name);
  assert.equal(result(name).cat, matchup.slot.invert ? expected.automatic === 'Physical' ? 'Special' : 'Physical' : expected.automatic, name);
}
assert.equal(result('draco-lower-atk-physical-auto').cat, 'Physical');
assert.equal(result('draco-higher-atk-special-auto').cat, 'Special');
assert.equal(result('draco-integer-near-tie-auto').categoryChoice.tie, true);
assert.equal(result('blazing-soul-full').priority, 1);
assert.equal(result('blazing-soul-hurt').priority, 0);
assert.equal(result('blazing-soul-not-fire').priority, 0);
assert.equal(result('blazing-soul-psychic-terrain').max, 0);
assert.ok(result('unable-attacker-slp').max > 0);
assert.ok(result('unable-attacker-frz').max > 0);
assert.ok(result('evs-enabled').max > result('bull-rush-physical-off').max);
assert.ok(result('spread-doubles').max < result('spread-singles').max);
same('doubles-veil', 'doubles-light-screen');
same('doubles-screens-not-stacked', 'doubles-light-screen');
assert.ok(result('snow-ice-defense').max < result('hail-no-ice-defense').max);
assert.equal(result('ice-eater-immune').max, 0);
assert.equal(result('ice-eater-ability-shield').max, 0);
for (const name of ['ice-eater-other-type', 'ice-eater-mold-breaker', 'ice-eater-neutralizing-gas']) assert.ok(result(name).max > 0, name);
for (const matchup of fixtures.matchups.filter(entry => entry.name.startsWith('gas-suppresses-'))) {
  const baseline = engine.calc({...matchup.atk, ab: -1}, matchup.def, matchup.slot, {});
  assert.deepEqual(result(matchup.name).rolls, plain(baseline.rolls), matchup.name);
  assert.equal(result(matchup.name).priority, baseline.priority, matchup.name + ' priority');
}

const statNames = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const statTable = (values, fallback) => Object.fromEntries(statNames.map((name, index) => [name, values?.[index] ?? fallback]));
function stock(matchup, generation = 9, powerModifier = 4096) {
  const gen = Generations.get(generation);
  const mon = set => {
    const entry = data.P.find(species => species.id === set.id);
    return new Pokemon(gen, entry.n, {level: set.lv, ability: 'Guide no ability', nature: set.nat || 'Serious',
      ivs: statTable(set.iv, 31), evs: statTable(set.ev, 0), boosts: statTable(set.stg, 0),
      overrides: {baseStats: statTable(entry.s, 1), types: entry.t}});
  };
  const entry = data.MV[matchup.slot.mv];
  const move = new Move(gen, data.M[matchup.slot.mv], {isCrit: !!matchup.slot.crit,
    overrides: {basePower: round(entry.bp * powerModifier / 4096), type: entry.t, category: entry.c}});
  const field = matchup.field || {};
  const damage = calculate(gen, mon(matchup.atk), mon(matchup.def), move, new Field({gameType: field.gameType,
    weather: field.weather, defenderSide: {isReflect: !!field.defReflect, isLightScreen: !!field.defLightScreen,
      isAuroraVeil: !!field.defAuroraVeil}})).damage;
  return typeof damage === 'number' ? Array(16).fill(damage) : damage;
}
const fieldCases = ['spread-singles', 'spread-doubles', 'doubles-sun', 'doubles-rain', 'doubles-reflect',
  'doubles-light-screen', 'doubles-veil', 'doubles-screens-not-stacked', 'doubles-screen-crit',
  'snow-ice-defense', 'hail-no-ice-defense'];
for (const name of fieldCases) {
  assert.deepEqual(result(name).rolls, plain(stock(fixture(name))), name);
  if (!name.startsWith('snow-')) assert.deepEqual(stock(fixture(name), 8), stock(fixture(name), 9), name + ' Gen 8/9');
}
for (const matchup of fixtures.matchups.filter(entry => entry.name.startsWith('emperor-ally-'))) {
  const affected = ['Water', 'Steel'].includes(data.MV[matchup.slot.mv].t);
  const own = data.AB[matchup.atk.ab]?.[0] === "Emperor's Presence";
  const ally = matchup.field?.gameType === 'Doubles' && matchup.field.atkEmperorPresence;
  const count = affected ? Number(own) + Number(!!ally) : 0;
  const modifier = count === 2 ? Math.floor((5325 * 5325 + 2048) / 4096) : count === 1 ? 5325 : 4096;
  assert.deepEqual(result(matchup.name).rolls, plain(stock(matchup, 9, modifier)), matchup.name + ' source power chain');
}
const orderCase = {...fixture('physical-neutral'), slot: {mv: data.M.indexOf('Payback')}};
const order = value => engine.calc(orderCase.atk, orderCase.def, {...orderCase.slot, order: value}, {});
assert.ok(order('last').max > order('first').max, 'explicit order feeds order-dependent base power');
assert.equal(JSON.stringify({data, profile, fixtures}), unchanged, 'inputs untouched');
console.log(`Emerald Imperium: ${results.size} fixtures; source modifier/category checks, field parity and priority/order checks passed`);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createEngine, resolveProfile} from './run.mjs';
import {speciesName} from './src/names.js';

const require = createRequire(import.meta.url);
const {Generations, Pokemon, Move, Field, calculate, toID} = require('@smogon/calc');
const root = new URL('../../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await load('hacks/eternal-x/data.json');
const configuration = await load('hacks/eternal-x/hack.json');
const fixtures = await load('hacks/eternal-x/calc_matchups.json');
const profile = await resolveProfile(configuration.cfg.calc);
const engine = await createEngine(data, profile);
const generation = Generations.get(6);
const statNames = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const stats = (values, fallback) => Object.fromEntries(statNames.map((name, index) => [name, values?.[index] ?? fallback]));
const plain = value => JSON.parse(JSON.stringify(value));
const results = new Map();
const alwaysCrit = new Set(['cut-neutral', 'self-destruct-neutral', 'explosion-neutral']);

const formWeights = new Map([
  ['nidoran-f', 7], ['nidoran-m', 9], ['castform-normal', 0.8], ['deoxys-normal', 60.8],
  ['burmy-plant', 3.4], ['wormadam-plant', 6.5], ['cherrim-overcast', 9.3],
  ['shellos-west-sea', 6.3], ['gastrodon-west-sea', 29.9],
  ['heat-rotom', 0.3], ['wash-rotom', 0.3], ['frost-rotom', 0.3], ['fan-rotom', 0.3], ['mow-rotom', 0.3],
  ['giratina-altered', 750], ['shaymin-land', 2.1], ['basculin-red-striped', 18],
  ['darmanitan-standard', 92.9], ['deerling-spring', 19.5], ['sawsbuck-spring', 92.5],
  ['tornadus-incarnate', 63], ['thundurus-incarnate', 61], ['landorus-incarnate', 68],
  ['white-kyurem', 325], ['black-kyurem', 325], ['keldeo-ordinary', 48.5], ['meloetta-aria', 6.5],
  ['vivillon-icy-snow', 17], ['flabebe-red', 0.1], ['floette-red', 0.9], ['floette-yellow', 0.9],
  ['florges-red', 10], ['furfrou-natural', 28], ['meowstic-male', 8.5], ['meowstic-female', 8.5],
  ['pumpkaboo-average', 5], ['gourgeist-average', 12.5], ['xerneas-neutral', 215],
]);

function stockWeight(entry) {
  const weight = formWeights.get(entry.id) ?? generation.species.get(toID(speciesName(entry.n)))?.weightkg;
  assert.ok(Number.isFinite(weight) && weight > 0, `Missing stock weight: ${entry.id}`);
  return weight;
}

function reference(matchup, weights = {}) {
  const mon = set => {
    const entry = data.P.find(species => species.id === set.id);
    return new Pokemon(generation, entry.n, {
      level: set.lv, nature: set.nat || 'Serious', ability: data.AB[set.ab]?.[0] || 'Guide no ability',
      item: set.it, status: set.st, curHP: set.hp, ivs: stats(set.iv, 31), evs: stats(set.ev, 0), boosts: stats(set.stg, 0),
      overrides: {baseStats: stats(entry.s, 1), types: entry.t, nfe: !!entry.et?.length,
        weightkg: weights[entry.id] ?? stockWeight(entry)},
    });
  };
  const entry = data.MV[matchup.slot.mv];
  const move = new Move(generation, data.M[matchup.slot.mv], {isCrit: !!matchup.slot.crit,
    overrides: {basePower: entry.bp, type: entry.t, category: entry.c, priority: entry.pr ?? 0}});
  const values = matchup.field;
  const side = prefix => Object.fromEntries(['Reflect', 'LightScreen', 'Tailwind',
    'HelpingHand', 'FriendGuard', 'FlowerGift'].map(name => ['is' + name, !!values[prefix + name]]));
  const field = new Field({gameType: values.gameType || 'Singles', weather: values.weather,
    terrain: values.terrain, isGravity: !!values.gravity, isMagicRoom: !!values.magicRoom,
    isWonderRoom: !!values.wonderRoom, attackerSide: side('atk'), defenderSide: side('def')});
  const damage = calculate(generation, mon(matchup.atk), mon(matchup.def), move, field).damage;
  return typeof damage === 'number' ? Array(16).fill(damage) : damage;
}

for (const matchup of fixtures.matchups) {
  const result = plain(engine.calc(matchup.atk, matchup.def, matchup.slot, matchup.field));
  assert.equal(result.rolls.length, 16, matchup.name);
  // Always-critical moves (over.rules critical rule): the stock reference has no such rule, so the neutral
  // fixtures are checked against their crit fixtures below instead of the reference.
  if (!matchup.field.inverse && !alwaysCrit.has(matchup.name)) assert.deepEqual(result.rolls, plain(reference(matchup)), matchup.name);
  results.set(matchup.name, result);
}
const same = (first, second) => assert.deepEqual(results.get(first).rolls, results.get(second).rolls, first);
const lower = (first, second) => assert.ok(results.get(first).max < results.get(second).max, first);
const handRolls = (baseDamage, stab = false) => Array.from({length: 16}, (_, index) => {
  const randomDamage = Math.floor(baseDamage * (85 + index) / 100);
  return stab ? Math.ceil(randomDamage * 1.5 - 0.5) : randomDamage;
});
assert.deepEqual(results.get('wonder-room-Tackle').rolls, handRolls(20, true));
assert.deepEqual(results.get('wonder-room-Psychic').rolls, handRolls(136));
assert.deepEqual(results.get('wonder-room-Psyshock').rolls, handRolls(25));
assert.deepEqual(results.get('flower-gift-defense-Sun').rolls, handRolls(20));
assert.deepEqual(results.get('flower-gift-defense-Harsh Sunshine').rolls, handRolls(20));
same('cut-neutral', 'cut-critical');
same('self-destruct-neutral', 'self-destruct-critical');
same('explosion-neutral', 'explosion-critical');
same('magic-room-choice-band-disabled', 'physical-neutral');
lower('wonder-room-Tackle', 'wonder-room-Tackle-baseline');
lower('wonder-room-Psychic-baseline', 'wonder-room-Psychic');
lower('flower-gift-defense-Sun', 'special-neutral');
same('flower-gift-defense-Sun', 'flower-gift-defense-Harsh Sunshine');
same('flower-gift-defense-Rain', 'special-neutral');
lower('tailwind-payback-atkTailwind', 'tailwind-payback-');
same('tailwind-payback-atkTailwind-defTailwind', 'tailwind-payback-');
for (const [name, effectiveness] of Object.entries({weakness: 0.5, resistance: 2, immunity: 2,
  'double-weakness': 0.25, 'double-resistance': 4, 'mixed-immunity': 4})) {
  assert.equal(results.get('inverse-' + name).eff, effectiveness, name);
}
assert.equal(results.get('inverse-levitate-still-immune').max, 0);
assert.equal(results.get('inverse-freeze-dry').eff, 0.5);
assert.equal(results.get('inverse-flying-press').eff, 1);
assert.equal(results.get('weather-Harsh Sunshine-water').max, 0);
assert.equal(results.get('weather-Heavy Rain-fire').max, 0);
same('weather-air-lock-harsh-sunshine', 'weather-air-lock-neutral');
assert.equal(results.get('gravity-flying-immune-baseline').max, 0);
assert.equal(results.get('gravity-levitate-immune-baseline').max, 0);
assert.ok(results.get('gravity-flying-grounded').max > 0);
assert.ok(results.get('gravity-levitate-grounded').max > 0);
lower('terrain-Electric-airborne', 'terrain-electric-gravity');
lower('terrain-misty-gravity', 'terrain-Misty-airborne');
lower('Doubles-spread', 'Singles-spread');
same('Doubles-single-target', 'Singles-single-target');
same('reflect-special-negative', 'special-neutral');
same('light-screen-physical-negative', 'physical-neutral');
same('opposite-side-support-negative', 'special-neutral');
lower('Singles-Reflect-Tackle', 'Doubles-Reflect-Tackle');
lower('Singles-LightScreen-Psychic', 'Doubles-LightScreen-Psychic');
for (const mode of ['Singles', 'Doubles']) {
  lower(mode + '-friend-guard', 'physical-neutral');
  lower('physical-neutral', mode + '-helping-hand');
}
assert.deepEqual(profile.field.find(entry => entry.k === 'terrain').o.map(([value]) => value),
  ['', 'Electric', 'Grassy', 'Misty']);
assert.ok(profile.field.every(entry => !/Battery|AuroraVeil/.test(entry.k)));
assert.equal(profile.gen, 6);
assert.equal(new Set(profile.field.map(entry => entry.k)).size, profile.field.length);
assert.deepEqual(profile.field.find(entry => entry.k === 'weather').o.map(([value]) => value),
  ['', 'Sun', 'Rain', 'Sand', 'Hail', 'Harsh Sunshine', 'Heavy Rain', 'Strong Winds']);
console.log(`PASS Eternal X: ${fixtures.matchups.length} fixtures; non-inverse rolls versus stock Gen 6 with guide stats; inverse effectiveness and field-effect assertions`);

const weightPower = weight => weight >= 200 ? 120 : weight >= 100 ? 100 : weight >= 50 ? 80
  : weight >= 25 ? 60 : weight >= 10 ? 40 : 20;
const automatic = (name, attacker, defender, move, power) => {
  const matchup = {name, atk: {lv: 50, ab: -1, ...attacker}, def: {lv: 50, ab: -1, ...defender},
    slot: {mv: data.M.indexOf(move)}, field: {}};
  const result = plain(engine.calc(matchup.atk, matchup.def, matchup.slot, matchup.field));
  assert.equal(result.bp, power, `${name} automatic power`);
  assert.deepEqual(result.rolls, plain(reference(matchup)), `${name} stock rolls`);
};
for (const entry of data.P) {
  automatic(`weight-${entry.id}`, {id: 'blastoise'}, {id: entry.id}, 'Grass Knot', weightPower(stockWeight(entry)));
}
for (const id of formWeights.keys()) assert.ok(data.P.some(entry => entry.id === id), `Missing form: ${id}`);
for (const [id, power] of [['kakuna', 40], ['seadra', 60], ['zweilous', 80], ['venusaur', 100], ['crustle', 120]]) {
  for (const move of ['Low Kick', 'Grass Knot']) automatic(`boundary-${id}-${move}`, {id: 'snorlax'}, {id}, move, power);
}
const boundaryEngine = await createEngine(data, profile);
const specialForms = data.P.filter(entry => formWeights.has(entry.id) || /^Mega /.test(entry.n));
for (const entry of specialForms) {
  for (const offset of [-0.1, 0]) {
    const weightkg = stockWeight(entry) * 5 + offset;
    boundaryEngine.init(data, {...profile, over: {...profile.over, species: {blastoise: {weightkg}}}});
    const result = boundaryEngine.calc({id: 'blastoise', lv: 50, ab: -1}, {id: entry.id, lv: 50, ab: -1},
      {mv: data.M.indexOf('Heavy Slam')}, {});
    assert.equal(result.bp, offset ? 100 : 120, `${entry.id} exact stock weight at ${weightkg} kg attacker`);
  }
}
let boundaryCases = 0;
for (const kind of ['weight', 'ratio']) {
  const thresholds = kind === 'weight' ? [10, 25, 50, 100, 200] : [200, 300, 400, 500];
  for (const threshold of thresholds) {
    for (const offset of [-0.1, 0, 0.1]) {
      const weight = threshold + offset;
      const weights = kind === 'weight' ? {snorlax: 100, blastoise: weight} : {snorlax: weight, blastoise: 100};
      const species = Object.fromEntries(Object.entries(weights).map(([id, weightkg]) => [id, {weightkg}]));
      boundaryEngine.init(data, {...profile, over: {...profile.over, species}});
      const power = kind === 'weight' ? weightPower(weight) : weight >= 500 ? 120 : weight >= 400 ? 100
        : weight >= 300 ? 80 : weight >= 200 ? 60 : 40;
      for (const move of kind === 'weight' ? ['Low Kick', 'Grass Knot'] : ['Heavy Slam', 'Heat Crash']) {
        const matchup = {atk: {id: 'snorlax', lv: 50, ab: -1}, def: {id: 'blastoise', lv: 50, ab: -1},
          slot: {mv: data.M.indexOf(move)}, field: {}};
        const result = plain(boundaryEngine.calc(matchup.atk, matchup.def, matchup.slot, matchup.field));
        assert.equal(result.bp, power, `${move}: ${weight} kg`);
        assert.deepEqual(result.rolls, plain(reference(matchup, weights)), `${move}: ${weight} kg stock rolls`);
        boundaryCases++;
      }
    }
  }
}
const automaticPowers = {'w2-low-kick': 80, 'w2-grass-knot': 20, 'w2-heavy-slam': 120,
  'w2-heat-crash': 120, 'w2-form-floette': 20, 'w2-mega-venusaur': 120};
for (const [name, power] of Object.entries(automaticPowers)) {
  const fixture = fixtures.matchups.find(matchup => matchup.name === name);
  assert.ok(fixture, `Missing fixture: ${name}`);
  assert.equal(fixture.slot.bp, undefined, `${name} must not set power`);
  assert.equal(results.get(name).bp, power, name);
}
console.log(`PASS Eternal W2: ${data.P.length} species weight bands, ${specialForms.length} exact form/Mega weights, ${boundaryCases} weight/ratio boundaries, 6 automatic fixtures`);

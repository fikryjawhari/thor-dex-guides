import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createEngine, resolveProfile} from './run.mjs';

const require = createRequire(import.meta.url);
const {Generations, Pokemon, Move, Field, calculate} = require('@smogon/calc');
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

function reference(matchup) {
  const mon = set => {
    const entry = data.P.find(species => species.id === set.id);
    return new Pokemon(generation, entry.n, {
      level: set.lv, nature: set.nat || 'Serious', ability: data.AB[set.ab]?.[0] || 'Guide no ability',
      item: set.it, status: set.st, ivs: stats(set.iv, 31), evs: stats(set.ev, 0), boosts: stats(set.stg, 0),
      overrides: {baseStats: stats(entry.s, 1), types: entry.t, nfe: !!entry.et?.length},
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
  if (!matchup.field.inverse) assert.deepEqual(result.rolls, plain(reference(matchup)), matchup.name);
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

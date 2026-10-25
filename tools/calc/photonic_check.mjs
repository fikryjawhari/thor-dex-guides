import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createEngine, resolveProfile} from './run.mjs';

const require = createRequire(import.meta.url);
const {Generations, Pokemon, Move, Field, calculate, toID} = require('@smogon/calc');
const root = new URL('../../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await load('hacks/photonic-sun/data.json');
const configuration = await load('hacks/photonic-sun/hack.json');
const fixtures = await load('hacks/photonic-sun/calc_matchups.json');
const profile = await resolveProfile(configuration.cfg.calc);
const engine = await createEngine(data, profile);
const generation = Generations.get(7);
const statNames = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const stats = (values, fallback) => Object.fromEntries(statNames.map((name, index) => [name, values?.[index] ?? fallback]));
const plain = value => JSON.parse(JSON.stringify(value));
const results = new Map();
const alwaysCrit = new Set(['self-destruct-neutral', 'explosion-neutral']);
const formWeights = new Map([
  ['nidoran-f', 7], ['nidoran-m', 9], ['castform-normal', 0.8], ['deoxys-normal', 60.8],
  ['burmy-plant', 3.4], ['wormadam-plant', 6.5], ['cherrim-overcast', 9.3],
  ['shellos-west-sea', 6.3], ['shellos-east-sea', 6.3],
  ['gastrodon-west-sea', 29.9], ['gastrodon-east-sea', 29.9],
  ['heat-rotom', 0.3], ['wash-rotom', 0.3], ['frost-rotom', 0.3], ['fan-rotom', 0.3], ['mow-rotom', 0.3],
  ['giratina-altered', 750], ['shaymin-land', 2.1], ['basculin-red-striped', 18],
  ['darmanitan-standard', 92.9], ['deerling-spring', 19.5], ['sawsbuck-spring', 92.5],
  ['tornadus-incarnate', 63], ['thundurus-incarnate', 61], ['landorus-incarnate', 68],
  ['white-kyurem', 325], ['black-kyurem', 325], ['keldeo-ordinary', 48.5], ['meloetta-aria', 6.5],
  ['ash-greninja', 40], ['vivillon-icy-snow', 17], ['flabebe-red', 0.1],
  ['floette-red', 0.9], ['floette-orange', 0.9], ['floette-white', 0.9], ['florges-red', 10],
  ['furfrou-natural', 28], ['meowstic-male', 8.5], ['meowstic-female', 8.5],
  ['pumpkaboo-average', 5], ['gourgeist-average', 12.5], ['xerneas-neutral', 215],
  ['zygarde-50', 305], ['zygarde-50-power-construct', 305], ['hoopa-confined', 9],
  ['oricorio-baile', 3.4], ['rockruff-own-tempo', 9.2], ['lycanroc-midday', 25],
  ['wishiwashi-solo', 0.3], ['minior-red-core', 0.3], ['mimikyu-disguised', 0.7], ['ultra-necrozma', 230],
]);

function stockWeight(entry) {
  const name = entry.n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('♀', '-F').replace('♂', '-M')
    .replace(/^Mega (.+?)(?: ([XY]))?$/, (_, base, suffix) => `${base}-Mega${suffix ? '-' + suffix : ''}`)
    .replace(/^Primal (.+)$/, '$1-Primal');
  const weight = formWeights.get(entry.id) ?? generation.species.get(toID(name))?.weightkg;
  assert.ok(Number.isFinite(weight) && weight > 0, `Missing stock weight: ${entry.id}`);
  return weight;
}

function reference(matchup, weights = {}) {
  const mon = set => {
    const entry = data.P.find(species => species.id === set.id);
    return new Pokemon(generation, entry.n, {
      level: set.lv, nature: set.nat || 'Serious', ability: data.AB[set.ab]?.[0] || 'Guide no ability',
      item: set.it, status: set.st, curHP: set.hp,
      ivs: stats(set.iv, 31), evs: stats(set.ev, 0), boosts: stats(set.stg, 0),
      overrides: {baseStats: stats(entry.s, 1), types: entry.t, nfe: !!entry.et?.length,
        weightkg: weights[entry.id] ?? stockWeight(entry)},
    });
  };
  const entry = data.MV[matchup.slot.mv];
  const move = new Move(generation, data.M[matchup.slot.mv], {isCrit: !!matchup.slot.crit,
    overrides: {basePower: entry.bp, type: entry.t, category: entry.c, priority: entry.pr ?? 0}});
  const values = matchup.field;
  const side = prefix => Object.fromEntries(['Reflect', 'LightScreen', 'AuroraVeil', 'Tailwind',
    'HelpingHand', 'FriendGuard', 'FlowerGift', 'Battery'].map(name => ['is' + name, !!values[prefix + name]]));
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
  // fixture is checked against the crit fixture below instead of the reference.
  if (!matchup.slot.z && !matchup.field.inverse && !alwaysCrit.has(matchup.name)) assert.deepEqual(result.rolls, plain(reference(matchup)), matchup.name);
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
same('Doubles-battery-physical-negative', 'physical-neutral');
lower('special-neutral', 'Doubles-battery-special');
for (const [name, effectiveness] of Object.entries({weakness: 0.5, resistance: 2, immunity: 2,
  'double-weakness': 0.25, 'double-resistance': 4, 'mixed-immunity': 4})) {
  assert.equal(results.get('inverse-' + name).eff, effectiveness, name);
}
assert.equal(results.get('inverse-levitate-still-immune').max, 0);
assert.equal(results.get('weather-Harsh Sunshine-water').max, 0);
assert.equal(results.get('weather-Heavy Rain-fire').max, 0);
assert.equal(results.get('psychic-priority-block').max, 0);
assert.ok(results.get('psychic-priority-airborne').max > 0);
assert.equal(new Set(profile.field.map(entry => entry.k)).size, profile.field.length);
assert.deepEqual(profile.field.find(entry => entry.k === 'weather').o.map(([value]) => value),
  ['', 'Sun', 'Rain', 'Sand', 'Hail', 'Harsh Sunshine', 'Heavy Rain', 'Strong Winds']);
console.log(`PASS Photonic Sun: ${fixtures.matchups.length} fixtures; non-Z non-inverse rolls versus stock Gen 7 with guide stats; inverse effectiveness and field-effect assertions`);

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
const maximumHP = engine.stats({id: 'snorlax', lv: 50, ab: -1})[0];
assert.equal(maximumHP, 235);
for (let currentHP = 1; currentHP <= maximumHP; currentHP++) {
  const proportion = Math.floor(48 * currentHP / maximumHP);
  const power = proportion <= 1 ? 200 : proportion <= 4 ? 150 : proportion <= 9 ? 100
    : proportion <= 16 ? 80 : proportion <= 32 ? 40 : 20;
  for (const move of ['Flail', 'Reversal']) {
    automatic(`hp-${currentHP}-${move}`, {id: 'snorlax', hp: currentHP}, {id: 'blastoise'}, move, power);
  }
}
const stageSpeed = (speed, stage) => Math.floor(speed * (stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)));
const attackerSpeed = engine.stats({id: 'snorlax', lv: 50, ab: -1})[5];
const defenderSpeed = engine.stats({id: 'electrode', lv: 50, ab: -1})[5];
for (let attackerStage = -6; attackerStage <= 6; attackerStage++) {
  for (let defenderStage = -6; defenderStage <= 6; defenderStage++) {
    const attackSpeed = stageSpeed(attackerSpeed, attackerStage);
    const defendSpeed = stageSpeed(defenderSpeed, defenderStage);
    const ratio = Math.floor(attackSpeed / defendSpeed);
    const powers = {'Gyro Ball': Math.min(150, Math.floor(25 * defendSpeed / attackSpeed) + 1),
      'Electro Ball': ratio >= 4 ? 150 : ratio >= 3 ? 120 : ratio >= 2 ? 80 : ratio >= 1 ? 60 : 40};
    for (const [move, power] of Object.entries(powers)) {
      automatic(`speed-${attackerStage}-${defenderStage}-${move}`,
        {id: 'snorlax', stg: [0, 0, 0, 0, 0, attackerStage]},
        {id: 'electrode', stg: [0, 0, 0, 0, 0, defenderStage]}, move, power);
    }
  }
}
const boundaryEngine = await createEngine(data, profile);
const specialForms = data.P.filter(entry => formWeights.has(entry.id) || /^(Mega |Primal )|\(Alola\)/.test(entry.n));
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
const automaticPowers = { 'w2-low-kick': 80, 'w2-grass-knot': 20, 'w2-heavy-slam': 120,
  'w2-heat-crash': 120, 'w2-flail': 200, 'w2-reversal': 200, 'w2-gyro-ball': 86,
  'w2-electro-ball': 120, 'w2-regional-raichu': 40, 'w2-mega-steelix': 120 };
for (const [name, power] of Object.entries(automaticPowers)) {
  const fixture = fixtures.matchups.find(matchup => matchup.name === name);
  assert.ok(fixture, `Missing fixture: ${name}`);
  assert.equal(fixture.slot.bp, undefined, `${name} must not set power`);
  assert.equal(results.get(name).bp, power, name);
}
console.log(`PASS Photonic W2: ${data.P.length} species weight bands, ${specialForms.length} exact form/Mega/Primal/regional weights, ${boundaryCases} weight/ratio boundaries, ${maximumHP * 2} HP cases, 338 speed cases, 10 automatic fixtures`);

const documentedZPowers = new Map([
  ['Wing Attack', [160, 'Supersonic Skystrike', 6]],
  ['Submission', [175, 'All-Out Pummeling', 9]],
  ['Chatter', [175, 'Supersonic Skystrike', 10]],
  ['Shadow Punch', [160, 'Never-Ending Nightmare', 12]],
  ['Water Pulse', [160, 'Hydro Vortex', 13]],
  ['Arm Thrust', [140, 'All-Out Pummeling', 15]],
  ['Mystical Fire', [170, 'Inferno Overdrive', 21]],
  ['Parabolic Charge', [175, 'Gigavolt Havoc', 23]],
  ['Horn Leech', [175, 'Bloom Doom', 25]],
  ['Draining Kiss', [140, 'Twinkle Tackle', 26]],
  ['Freeze-Dry', [180, 'Subzero Slammer', 31]],
  ['Twineedle', [175, 'Savage Spin-Out', 34]],
  ['Steel Wing', [175, 'Corkscrew Crash', 38]],
  ['Power Gem', [175, 'Continental Crush', 39]],
  ['Needle Arm', [175, 'Bloom Doom', 40]],
  ['Cross Poison', [175, 'Acid Downpour', 41]],
]);
const otherZPowers = new Map([
  ['z2-absorb-band-100', [100, 'Bloom Doom']],
  ['z2-mega-drain-band-120', [120, 'Bloom Doom']],
  ['z2-sparkling-aria-band-180', [180, 'Hydro Vortex']],
  ['z2-multi-attack-band-190', [190, 'Breakneck Blitz']],
  ['z2-earthquake', [180, 'Tectonic Rage']],
  ['z2-weather-ball-stock-exception', [160, 'Breakneck Blitz']],
  ['z2-low-kick-variable', [160, 'All-Out Pummeling']],
  ['z2-double-kick-one-hit', [100, 'All-Out Pummeling']],
  ['z2-catastropika', [210, 'Catastropika']],
]);
const zFixtures = fixtures.matchups.filter(matchup => matchup.name.startsWith('z2-'));
assert.equal(zFixtures.length, documentedZPowers.size + otherZPowers.size);
assert.equal(data.MV[data.M.indexOf('Catastropika')].bp, 210);
assert.equal(data.MV[data.M.indexOf('Weather Ball')].bp, 50);
assert.equal(data.MV[data.M.indexOf('Mega Drain')].bp, 60);
const fixedZRolls = (matchup, power) => {
  const entry = data.MV[matchup.slot.mv];
  const control = {mv: data.M.indexOf(entry.c === 'Physical' ? 'Tackle' : 'Psychic'),
    bp: power, t: entry.t, hits: 1};
  const result = plain(engine.calc(matchup.atk, matchup.def, control, matchup.field));
  assert.equal(result.z, undefined);
  assert.equal(result.cat, entry.c);
  assert.equal(result.hits, 1);
  return result.rolls;
};
const zPowerFailures = [];
const checkZPower = (matchup, power, name, source) => {
  assert.equal(matchup.slot.z, 1, matchup.name);
  assert.equal(matchup.slot.bp, undefined, `${matchup.name} must not set power`);
  const result = results.get(matchup.name);
  assert.equal(result.z, name, `${matchup.name} Z name`);
  assert.equal(result.cat, data.MV[matchup.slot.mv].c, `${matchup.name} category`);
  assert.equal(result.hits, 1, `${matchup.name} one hit`);
  assert.ok(result.max > 0, `${matchup.name} must deal damage`);
  try {
    assert.deepEqual(result.rolls, fixedZRolls(matchup, power), `${matchup.name}: ${power} BP; ${source}`);
  } catch (error) {
    zPowerFailures.push(error);
    const observed = [100, 120, 140, 160, 170, 175, 180, 185, 190, 195, 200, 210]
      .find(candidate => JSON.stringify(result.rolls) === JSON.stringify(fixedZRolls(matchup, candidate)));
    console.error(`FAIL Photonic Z2 ${matchup.name}: doc ${power}, engine ${observed ?? 'unknown'} BP; ${source}`);
  }
};
for (const [move, [power, name, line]] of documentedZPowers) {
  const matchup = zFixtures.find(fixture => data.M[fixture.slot.mv] === move);
  assert.ok(matchup, `Missing documented Z fixture: ${move}`);
  checkZPower(matchup, power, name, `Move Changes.txt:${line}`);
}
for (const [fixtureName, [power, name]] of otherZPowers) {
  const matchup = zFixtures.find(fixture => fixture.name === fixtureName);
  assert.ok(matchup, `Missing Z fixture: ${fixtureName}`);
  checkZPower(matchup, power, name, 'guide power / stock Gen 7 Z exception');
}
for (const move of ['Arm Thrust', 'Twineedle', 'Double Kick']) {
  const matchup = zFixtures.find(fixture => data.M[fixture.slot.mv] === move);
  const forcedHits = plain(engine.calc(matchup.atk, matchup.def, {...matchup.slot, hits: 5}, matchup.field));
  assert.equal(forcedHits.hits, 1, `${move} Z ignores an explicit multi-hit count`);
  assert.deepEqual(forcedHits.rolls, results.get(matchup.name).rolls, `${move} Z is one hit`);
}
console.log(`Photonic Z2: ${zFixtures.length} Z names/categories/single-hit checks; ${documentedZPowers.size} doc powers; ${zPowerFailures.length} power failures`);
assert.equal(zPowerFailures.length, 0, 'Needs Opus 4: documented Z powers must all match; see FAIL Photonic Z2 lines');

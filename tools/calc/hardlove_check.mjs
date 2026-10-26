import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createEngine} from './run.mjs';

const require = createRequire(import.meta.url);
const {Generations, Pokemon, Move, Field, calculate} = require('@smogon/calc');
const root = new URL('../../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await load('hacks/hardlove-gold/data.json');
const configuration = await load('hacks/hardlove-gold/hack.json');
const fixtures = await load('hacks/hardlove-gold/calc_matchups.json');
const engine = await createEngine(data, configuration.cfg.calc);
const gen = Generations.get(9);
const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const statObject = (values, fallback) => Object.fromEntries(stats.map((name, index) => [name, values?.[index] ?? fallback]));
const plain = value => JSON.parse(JSON.stringify(value));
const toID = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const hitsOf = result => result.per || Array.from({length: result.hits}, () => result.rolls);

function reference(matchup) {
  const adjustments = matchup.reference || {};
  const mon = (set, attacking) => {
    const entry = data.P.find(species => species.id === set.id);
    return new Pokemon(gen, entry.n, {
      level: set.lv, nature: set.nat || 'Serious', ability: (attacking && adjustments.ability !== undefined ? adjustments.ability : data.AB[set.ab]?.[0]) || 'Guide no ability',
      item: attacking ? adjustments.item ?? set.it : set.it, status: set.st,
      ivs: statObject(set.iv, 31), evs: statObject(undefined, 0), boosts: statObject(set.stg, 0), curHP: set.hp,
      overrides: {baseStats: statObject(entry.s, 1), types: entry.t, nfe: !!entry.et?.length,
        ...configuration.cfg.calc.over.species?.[entry.id]},
    });
  };
  const name = data.M[matchup.slot.mv];
  const entry = data.MV[matchup.slot.mv];
  const upstream = gen.moves.get(toID(name));
  const flagNames = {ballistic: 'bullet', biting: 'bite', punching: 'punch'};
  const flags = entry.f === undefined ? upstream?.flags : {
    ...Object.fromEntries(Object.keys(upstream?.flags || {}).map(flag => [flag, 0])),
    ...Object.fromEntries(entry.f.map(flag => [flagNames[flag] || flag, 1])),
  };
  const overrides = {basePower: adjustments.power ?? Number(entry.bp), type: matchup.slot.t || entry.t,
    category: entry.c, priority: entry.pr ?? upstream?.priority ?? 0, flags};
  if (adjustments.plainMove) overrides.name = 'Reference fixed power';
  const move = new Move(gen, name, {overrides, isCrit: !!matchup.slot.crit, hits: matchup.slot.hits || 1});
  move.hits = matchup.slot.hits || 1;
  const values = {...matchup.field, ...adjustments.field};
  const side = prefix => ({isReflect: !!values[prefix + 'Reflect'], isLightScreen: !!values[prefix + 'LightScreen'],
    isAuroraVeil: !!values[prefix + 'AuroraVeil'], isTailwind: !!values[prefix + 'Tailwind'],
    isHelpingHand: !!values[prefix + 'HelpingHand'], isFlowerGift: !!values[prefix + 'FlowerGift'],
    isPowerTrick: !!values[prefix + 'PowerTrick'], isProtected: !!values[prefix + 'Protected']});
  const field = new Field({gameType: values.gameType || 'Singles', weather: values.weather,
    terrain: values.terrain, isGravity: !!values.gravity, isMagicRoom: !!values.magicRoom,
    isWonderRoom: !!values.wonderRoom, attackerSide: side('atk'), defenderSide: side('def')});
  const damage = calculate(gen, mon(matchup.atk, true), mon(matchup.def, false), move, field).damage;
  const normalise = rolls => typeof rolls === 'number' ? Array(16).fill(rolls) : rolls;
  return Array.isArray(damage) && (Array.isArray(damage[0]) || damage.length === 2)
    ? damage.map(normalise) : Array.from({length: move.hits}, () => normalise(damage));
}

const results = [];
for (const matchup of fixtures.matchups) {
  try {
    const result = plain(engine.calc(matchup.atk, matchup.def, matchup.slot, matchup.field));
    const expected = plain(reference(matchup));
    assert.deepEqual(hitsOf(result), expected);
    if (matchup.expectedBP !== undefined) assert.equal(result.bp, matchup.expectedBP);
    results.push({name: matchup.name, status: 'pass', per: hitsOf(result), ...(result.bp ? {bp: result.bp} : {})});
    console.log(`PASS ${matchup.name}`);
  } catch (error) {
    results.push({name: matchup.name, status: 'fail', error: error.stack});
    console.error(`FAIL ${matchup.name}\n${error.stack}`);
  }
}

const caseByName = name => fixtures.matchups.find(matchup => matchup.name === name);
const resultByName = name => results.find(result => result.name === name);
const check = (name, run) => {
  try {
    run();
    results.push({name, status: 'pass'});
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({name, status: 'fail', error: error.stack});
    console.error(`FAIL ${name}\n${error.stack}`);
  }
};
const weightEngine = await createEngine(data, {...configuration.cfg.calc, over: {
  ...configuration.cfg.calc.over,
  rules: [...configuration.cfg.calc.over.rules, {phase: 'movePower', note: {ref: 'def.weightkg'}}],
}});
check('w2-source-species-weights-reach-engine', () => {
  const sample = caseByName('w2-inclusive-10kg');
  const weights = {mega_absol_z: 49, mega_garchomp_z: 99, mega_lucario_z: 49.4, maushold: 2.8,
    golem_alolan: 316, growlithe_hisuian: 22.7};
  for (const [id, weightkg] of Object.entries(weights)) {
    const result = weightEngine.calc(sample.atk, {id, lv: 50, ab: -1}, sample.slot, {});
    assert.ok(result.notes.includes(String(weightkg)), `${id}: expected ${weightkg} kg`);
  }
});
check('w2-hp-bands-and-manual-power-override', () => {
  const sample = caseByName('w2-flail-p32');
  const maximum = engine.stats(sample.atk)[0];
  for (let hp = 1; hp <= maximum; hp++) {
    const band = Math.floor(48 * hp / maximum);
    const power = band >= 32 ? 20 : band >= 17 ? 40 : band >= 10 ? 80 : band >= 5 ? 100 : band >= 2 ? 150 : 200;
    assert.equal(engine.calc({...sample.atk, hp}, sample.def, sample.slot, {}).bp, power, `Flail HP ${hp}/${maximum}`);
  }
  for (const name of ['weight-low-kick-exact-10kg-source-boundary', 'weight-heavy-slam-mega-aggron',
    'w2-flail-p32', 'w2-gyro-ball-equal-speed']) {
    const matchup = caseByName(name);
    const slot = {...matchup.slot, bp: 77};
    const actual = engine.calc(matchup.atk, matchup.def, slot, {});
    assert.deepEqual(plain(hitsOf(actual)), plain(reference({...matchup, slot, reference: {power: 77, plainMove: true}})));
    assert.ok(!actual.notes.some(note => note.startsWith('Hardlove ')));
  }
});
check('w2-hard-press-source-minimum-at-full-hp', () => {
  const matchup = caseByName('w2-hard-press-zero-power-before-modifiers');
  const defender = {...matchup.def};
  delete defender.hp;
  const result = engine.calc(matchup.atk, defender, matchup.slot, matchup.field);
  assert.equal(result.bp, 1);
  assert.deepEqual(plain(hitsOf(result)), plain(reference({...matchup, def: defender})));
});
check('hand-calculated-neutral-gem-and-critical-rolls', () => {
  const sample = caseByName('physical-neutral');
  assert.equal(engine.stats(sample.atk)[1], 130);
  assert.equal(engine.stats(sample.def)[2], 120);
  const expected = baseDamage => Array.from({length: 16}, (_, index) =>
    Math.ceil(Math.floor(baseDamage * (85 + index) / 100) * 1.5 - 0.5));
  assert.deepEqual(resultByName('physical-neutral').per[0], expected(21));
  assert.deepEqual(resultByName('normal-gem').per[0], expected(30));
  assert.deepEqual(resultByName('critical').per[0], expected(31));
});
check('evs-ignored-by-stats-and-damage', () => {
  const sample = caseByName('evs-ignored');
  assert.deepEqual(plain(engine.stats(sample.atk)), plain(engine.stats({...sample.atk, ev: [0, 0, 0, 0, 0, 0]})));
  assert.deepEqual(resultByName('evs-ignored').per, resultByName('physical-neutral').per);
});
check('battle-bond-does-not-boost-special-attack', () => {
  const sample = caseByName('battle-bond-no-special-boost');
  const unboosted = engine.calc({...sample.atk, stg: [0, 0, 0, 0, 0, 0]}, sample.def, sample.slot, {});
  assert.deepEqual(resultByName(sample.name).per, plain(hitsOf(unboosted)));
});
check('protect-contact-boundary', () => {
  assert.ok(resultByName('protect-blocks').per[0].every(value => value === 0));
  assert.ok(resultByName('unseen-fist-contact').per[0].every(value => value > 0));
  assert.ok(resultByName('unseen-fist-noncontact-still-blocked').per[0].every(value => value === 0));
});
check('gem-disabled-and-negative-cases-have-no-custom-boost', () => {
  for (const name of ['wrong-gem', 'gem-klutz', 'gem-magic-room']) {
    assert.deepEqual(resultByName(name).per, resultByName('physical-neutral').per);
  }
});

// Batch 1 (Hidden Power, Frustration, Return, Rage Fist, Explosion family): hand formula, level 50.
const handBase = (bp, attack, defence) => Math.floor(Math.floor(Math.floor(2 * 50 / 5 + 2) * bp * attack / defence) / 50) + 2;
const handRolls = (base, {stab = false, mult = 1} = {}) => Array.from({length: 16}, (_, index) => {
  let damage = Math.floor(base * (85 + index) / 100);
  if (stab) damage = Math.ceil(damage * 1.5 - 0.5);
  return Math.floor(damage * mult);
});
check('batch1-hand-calculated-rolls', () => {
  assert.equal(engine.stats(caseByName('special-neutral').atk)[3], 155);
  assert.equal(engine.stats(caseByName('special-neutral').def)[4], 125);
  assert.equal(handBase(60, 155, 125), 34);
  assert.deepEqual(resultByName('hidden-power-data-type-normal').per[0], handRolls(34));
  assert.deepEqual(resultByName('hidden-power-fire-typed').per[0], handRolls(34, {mult: 0.5}));
  assert.equal(handBase(51, 130, 120), 26);
  assert.deepEqual(resultByName('frustration-happiness-127').per[0], handRolls(26, {stab: true}));
  assert.equal(handBase(102, 130, 120), 50);
  assert.deepEqual(resultByName('frustration-happiness-0').per[0], handRolls(50, {stab: true}));
  assert.equal(handBase(50, 130, 120), 25);
  assert.deepEqual(resultByName('return-happiness-127').per[0], handRolls(25, {stab: true}));
  assert.equal(handBase(100, 130, 120), 49);
  assert.deepEqual(resultByName('rage-fist-flat-100').per[0], handRolls(49));
  assert.equal(handBase(250, 130, 120), 121);
  assert.deepEqual(resultByName('explosion-defense-not-halved').per[0], handRolls(121, {stab: true}));
  assert.equal(handBase(200, 130, 120), 97);
  assert.deepEqual(resultByName('self-destruct-defense-not-halved').per[0], handRolls(97, {stab: true}));
  assert.equal(handBase(200, 155, 125), 111);
  assert.deepEqual(resultByName('misty-explosion-no-terrain').per[0], handRolls(111));
  // Misty Terrain x1.5 applies to base power (200 -> 300) before the base damage formula.
  assert.equal(handBase(300, 155, 125), 165);
  assert.deepEqual(resultByName('misty-explosion-misty-terrain').per[0], handRolls(165));
});
check('batch1-negative-and-boundary-cases', () => {
  assert.ok(resultByName('rage-fist-normal-target-immune').per[0].every(value => value === 0));
  assert.notDeepEqual(resultByName('frustration-happiness-0').per, resultByName('frustration-happiness-127').per);
  assert.ok(resultByName('misty-explosion-misty-terrain').per[0][15] > resultByName('misty-explosion-no-terrain').per[0][15]);
  // Current behaviour: no Defense halving for Explosion / Self-Destruct (source and Gen 9 stock). See Needs Opus.
  assert.notDeepEqual(resultByName('explosion-defense-not-halved').per[0], handRolls(handBase(250, 130, 60), {stab: true}));
});
// Kee / Maranga Berry fire after the whole move (ServerDoPostMoveEffects step 17), so no later hit sees the boost;
// Luminous Moss fires on the hit (CheckDefenderItemEffectOnHit) and still raises hit 2.
check('kee-maranga-after-the-move', () => {
  const mon = (name, extra = {}) => ({id: data.P.find(entry => entry.n === name).id, lv: 50, nat: 'Serious', ...extra});
  const hits = (item, move) => plain(engine.calc(mon('Cloyster'), mon('Blissey', {it: item}), {mv: data.M.indexOf(move), hits: 3}, {}));
  for (const [item, move] of [['Kee Berry', 'Rock Blast'], ['Maranga Berry', 'Water Shuriken']]) {
    const result = hits(item, move);
    assert.equal(result.per, undefined, `${item}: every hit alike`);
    assert.equal(result.pre, undefined, `${item}: no between-hit event`);
  }
  assert.ok(hits('Luminous Moss', 'Water Shuriken').pre, 'Luminous Moss still between hits');
});

const counts = {pass: results.filter(result => result.status === 'pass').length,
  fail: results.filter(result => result.status === 'fail').length};
await mkdir(new URL('.tmp/calc-hardlove-gold/', root), {recursive: true});
await writeFile(new URL('.tmp/calc-hardlove-gold/check.json', root), JSON.stringify({
  guideVersion: configuration.version, independentHackOracle: false, oracle: fixtures.oracle, counts, results,
}, null, 2) + '\n');
console.log(`Hardlove source/stock checks: ${counts.pass} passed; ${counts.fail} failed; NOT an independent hack oracle`);
if (counts.fail) process.exitCode = 1;

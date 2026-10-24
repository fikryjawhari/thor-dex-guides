import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createEngine, resolveProfile, runMatchups} from './run.mjs';

const require = createRequire(import.meta.url);
const {Generations, Pokemon, Move, Field, calculate} = require('@smogon/calc');
const root = new URL('../../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await load('hacks/emerald-imperium/data.json');
const profiles = Object.fromEntries(await Promise.all(['expansion', 'cfru', 'gen4', 'gen5', 'gen6', 'gen7']
  .map(async name => [name, await load(`template/calc/profiles/${name}.json`)])));
const unchanged = JSON.stringify({data, profiles});
const engine = await createEngine(data, profiles.expansion);
const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const toID = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const plain = value => JSON.parse(JSON.stringify(value));
const statObject = (values, fallback) => Object.fromEntries(stats.map((stat, index) => [stat, values?.[index] ?? fallback]));
const set = (name, extra = {}) => {
  const species = data.P.find(entry => entry.n === name);
  assert.ok(species, `Missing fixture species ${name}`);
  return {id: species.id, lv: 50, nat: 'Serious', ab: -1, it: '', st: '',
    iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], stg: [0, 0, 0, 0, 0, 0], ...extra};
};
const ability = name => {
  const index = data.AB.findIndex(entry => entry[0] === name);
  assert.notEqual(index, -1, `Missing fixture ability ${name}`);
  return index;
};
const slot = (name, extra = {}) => {
  const index = data.M.indexOf(name);
  assert.notEqual(index, -1, `Missing fixture move ${name}`);
  return {mv: index, ...extra};
};

function reference(atk, def, selected, options = {}, profile = profiles.expansion, guide = data) {
  const gen = Generations.get(profile.gen);
  const stockTypes = gen.types;
  gen.types = {get(id) {
    const original = stockTypes.get(id) || Generations.get(9).types.get(id);
    const effectiveness = {...original.effectiveness};
    for (const [target, value] of Object.entries(guide.TC?.[original.name] || {})) effectiveness[target] = value / 10;
    return {...original, effectiveness};
  }};
  const mon = config => {
    const entry = guide.P.find(species => species.id === config.id);
    const name = entry.n.replace(/^Mega (.+?)(?: ([XY]))?$/, (_, base, suffix) => `${base}-Mega${suffix ? '-' + suffix : ''}`);
    const original = gen.species.get(toID(name)) || Generations.get(9).species.get(toID(name));
    return new Pokemon(gen, name, {
      level: config.lv, nature: config.nat, ability: guide.AB[config.ab]?.[0] || 'Guide no ability',
      item: config.it, status: config.st, ivs: statObject(config.iv, 31), evs: statObject(config.ev, 0),
      boosts: statObject(config.stg, 0), curHP: config.hp,
      overrides: {...original, name, baseStats: statObject(entry.s, 1), types: entry.t, nfe: !!entry.et.length, abilities: {0: ''}},
    });
  };
  const name = guide.M[selected.mv];
  const entry = guide.MV[selected.mv];
  const source = gen.moves.get(toID(name)) || Generations.get(9).moves.get(toID(name));
  const flags = entry.f === undefined ? source?.flags || {} : Object.fromEntries(entry.f
    .map(flag => [{ballistic: 'bullet', biting: 'bite', punching: 'punch'}[flag] || flag, 1]));
  const attacker = mon(atk);
  const defender = mon(def);
  const variable = entry.bp === 'Varies' || profile.varpow.includes(name);
  const move = new Move(gen, variable ? 'Guide fixed power' : name, {
    ability: attacker.ability, item: attacker.item, isCrit: !!selected.crit,
    hits: selected.hits || 1,
    overrides: {...source, name: variable ? 'Guide fixed power' : name,
      basePower: selected.bp ?? entry.bp, type: selected.t || entry.t, category: entry.c,
      priority: entry.pr, flags},
  });
  move.hits = selected.hits ?? move.hits;
  move.overrides = {...move.overrides, multihit: [move.hits, move.hits]};
  return {result: calculate(gen, attacker, defender, move, new Field(options)), attacker, defender};
}

function distributions(damage, hits) {
  const rolls = value => typeof value === 'number' ? Array(16).fill(value) : [...value];
  return Array.isArray(damage) && (Array.isArray(damage[0]) || damage.length === 2)
    ? damage.map(rolls) : Array.from({length: hits}, () => rolls(damage));
}

let passed = 0;
let failed = 0;
let parity = 0;
async function test(name, run) {
  try {
    await run();
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}\n${error.stack}`);
  }
}

async function compare(name, atk, def, selected, field = {}, options = {}, profile = profiles.expansion, guide = data) {
  await test(name, () => {
    engine.init(guide, profile);
    const actual = plain(engine.calc(atk, def, selected, field));
    const expected = reference(atk, def, selected, options, profile, guide);
    const per = distributions(expected.result.damage, actual.hits);
    assert.deepEqual(actual.rolls, per[0]);
    assert.deepEqual(actual.per || Array.from({length: actual.hits}, () => actual.rolls), per);
    assert.equal(actual.min, Math.min(...per[0]));
    assert.equal(actual.max, Math.max(...per[0]));
    assert.equal(actual.pmin, per.reduce((sum, hit) => sum + Math.min(...hit), 0) * 100 / expected.defender.maxHP());
    assert.equal(actual.pmax, per.reduce((sum, hit) => sum + Math.max(...hit), 0) * 100 / expected.defender.maxHP());
    parity++;
  });
}

await compare('physical non-STAB', set('Charizard'), set('Blastoise'), slot('Tackle'));
await compare('special STAB and super effective', set('Venusaur'), set('Blastoise'), slot('Magical Leaf'));
await compare('fire STAB', set('Charizard'), set('Snorlax'), slot('Flamethrower'));
await compare('fourfold super effective', set('Charizard'), set('Scizor'), slot('Flamethrower'));
await compare('type immunity', set('Snorlax'), set('Gengar'), slot('Tackle'));
await compare('critical hit', set('Charizard'), set('Snorlax'), slot('Flamethrower', {crit: true}));
await compare('burn', set('Charizard', {st: 'brn'}), set('Blastoise'), slot('Tackle'));
await compare('Reflect', set('Charizard'), set('Blastoise'), slot('Tackle'), {defReflect: true}, {defenderSide: {isReflect: true}});
await compare('Light Screen', set('Charizard'), set('Blastoise'), slot('Flamethrower'), {defLightScreen: true}, {defenderSide: {isLightScreen: true}});
await compare('critical bypasses screen and negative stage', set('Charizard', {stg: [0, -2, 0, -2, 0, 0]}),
  set('Snorlax', {stg: [0, 0, 2, 0, 2, 0]}), slot('Flamethrower', {crit: true}), {defLightScreen: true}, {defenderSide: {isLightScreen: true}});
await compare('rain', set('Blastoise'), set('Snorlax'), slot('Surf'), {weather: 'Rain'}, {weather: 'Rain'});
await compare('sun', set('Charizard'), set('Snorlax'), slot('Flamethrower'), {weather: 'Sun'}, {weather: 'Sun'});
await compare('attack stage', set('Charizard', {stg: [0, 2, 0, 0, 0, 0]}), set('Snorlax'), slot('Tackle'));
await compare('two hits', set('Cloyster'), set('Snorlax'), slot('Icicle Spear', {hits: 2}));
await compare('five hits', set('Cloyster'), set('Snorlax'), slot('Icicle Spear', {hits: 5}));
await compare('Choice Band', set('Charizard', {it: 'Choice Band'}), set('Blastoise'), slot('Tackle'));
await compare('Life Orb', set('Charizard', {it: 'Life Orb'}), set('Blastoise'), slot('Flamethrower'));
await compare('Huge Power', set('Azumarill', {ab: ability('Huge Power')}), set('Blastoise'), slot('Tackle'));
await compare('Levitate', set('Charizard'), set('Gengar', {ab: ability('Levitate')}), slot('Earthquake'));
await compare('Mega stats and types', set('Mega Charizard X', {ab: ability('Tough Claws')}), set('Snorlax'), slot('Dragon Claw'));
await compare('hack-original move', set('Blastoise'), set('Snorlax'), slot('Aqua Fang'));
await compare('original move flags with Strong Jaw', set('Blastoise', {ab: ability('Strong Jaw')}), set('Snorlax'), slot('Aqua Fang'));
await compare('variable power with explicit input', set('Charizard'), set('Snorlax'), slot('Grass Knot', {bp: 80}));
await compare('type and power input', set('Charizard'), set('Blastoise'), slot('Tackle', {bp: 75, t: 'Electric'}));
await compare('nature, IVs and EVs', set('Charizard', {nat: 'Modest', iv: [19, 22, 25, 31, 21, 26], ev: [0, 0, 0, 252, 4, 252]}), set('Snorlax'), slot('Flamethrower'));
await compare('nonuniform Triple Axel', set('Cloyster'), set('Snorlax'), slot('Triple Axel', {hits: 3}));
await compare('nonuniform Triple Kick', set('Machamp'), set('Blastoise'), slot('Triple Kick', {hits: 3}));
await compare('Parental Bond', set('Snorlax', {ab: ability('Parental Bond')}), set('Blastoise'), slot('Tackle'));
await compare('Helping Hand and doubles spread', set('Blastoise'), set('Snorlax'), slot('Surf'),
  {gameType: 'Doubles', atkHelpingHand: true}, {gameType: 'Doubles', attackerSide: {isHelpingHand: true}});
await compare('terrain and screen', set('Pikachu'), set('Blastoise'), slot('Thunderbolt'),
  {terrain: 'Electric', defAuroraVeil: true}, {terrain: 'Electric', defenderSide: {isAuroraVeil: true}});
await compare('gravity removes Flying immunity', set('Snorlax'), set('Charizard'), slot('Earthquake'), {gravity: true}, {isGravity: true});
for (const base of ['gen4', 'gen5', 'gen6', 'gen7', 'cfru']) {
  await compare(`${base} physical and item`, set('Charizard', {it: 'Choice Band'}), set('Blastoise'), slot('Tackle'), {}, {}, profiles[base]);
  await compare(`${base} special critical`, set('Charizard'), set('Snorlax'), slot('Flamethrower', {crit: true}), {}, {}, profiles[base]);
}

await test('variable power without input and status moves return null', () => {
  engine.init(data, profiles.expansion);
  assert.equal(engine.calc(set('Charizard'), set('Blastoise'), slot('Grass Knot'), {}), null);
  assert.equal(engine.calc(set('Charizard'), set('Blastoise'), slot('Growl'), {}), null);
  assert.equal(engine.calc(set('Charizard'), set('Blastoise'), slot('Tackle', {bp: 0}), {}), null);
});

await test('stats are unstaged and match direct calc', () => {
  engine.init(data, profiles.expansion);
  const attacker = set('Charizard', {nat: 'Modest', stg: [0, 4, -3, 2, -2, 6], ev: [252, 0, 4, 252, 0, 0]});
  const expected = reference(attacker, set('Blastoise'), slot('Tackle')).attacker.rawStats;
  assert.deepEqual(plain(engine.stats(attacker)), stats.map(stat => expected[stat]));
  assert.equal(engine.stats(set('Shedinja'))[0], 1);
});

await test('KO probability uses current HP and independent hit rolls', () => {
  engine.init(data, profiles.expansion);
  const attacker = set('Cloyster');
  const defender = set('Snorlax');
  const initial = plain(engine.calc(attacker, defender, slot('Icicle Spear', {hits: 2}), {}));
  const hp = initial.min + initial.max;
  let success = 0;
  for (const first of initial.rolls) for (const second of initial.rolls) if (first + second >= hp) success++;
  const actual = plain(engine.calc(attacker, {...defender, hp}, slot('Icicle Spear', {hits: 2}), {}));
  assert.deepEqual(actual.ko, {n: 1, p: success / 256});
  assert.ok(actual.ko.p > 0 && actual.ko.p < 1);
  assert.equal(actual.pmin, initial.pmin);
  assert.equal(engine.calc(attacker, {...defender, hp: 0}, slot('Tackle'), {}).ko.n, 0);
});

await test('nonuniform KO probability uses all three hit distributions', () => {
  engine.init(data, profiles.expansion);
  const attacker = set('Cloyster');
  const defender = set('Snorlax');
  const initial = plain(engine.calc(attacker, defender, slot('Triple Axel', {hits: 3}), {}));
  assert.equal(initial.per.length, 3);
  const hp = initial.per.reduce((sum, hit) => sum + hit[7], 0);
  let success = 0;
  for (const first of initial.per[0]) for (const second of initial.per[1]) for (const third of initial.per[2]) {
    if (first + second + third >= hp) success++;
  }
  const actual = plain(engine.calc(attacker, {...defender, hp}, slot('Triple Axel', {hits: 3}), {}));
  assert.deepEqual(actual.ko, {n: 1, p: success / 4096});
});

await test('unknown moves, species, abilities and items do not throw', () => {
  const guide = structuredClone(data);
  guide.M.push('A wholly new move');
  guide.MV.push({t: 'Fire', c: 'Special', bp: 70, f: [], x: 1});
  guide.P.push({...structuredClone(data.P[0]), id: 'custom', n: 'A wholly new species'});
  guide.AB.push(['A wholly new ability', '', 1]);
  engine.init(guide, profiles.expansion);
  const attacker = {...set('Charizard'), id: 'custom', ab: guide.AB.length - 1, it: 'A wholly new item'};
  assert.ok(engine.calc(attacker, set('Blastoise'), {mv: guide.M.length - 1}, {}).max > 0);
});

await test('data changes override stock species stats, move power/type/category and chart', async () => {
  const guide = structuredClone(data);
  guide.P.find(entry => entry.id === '6').s[1] = 160;
  const index = guide.M.indexOf('Tackle');
  Object.assign(guide.MV[index], {bp: 95, t: 'Electric', c: 'Special'});
  guide.TC.Electric.Water = 5;
  const customEngine = await createEngine(guide, profiles.expansion);
  const actual = plain(customEngine.calc(set('Charizard'), set('Blastoise'), {mv: index}, {}));
  const expected = reference(set('Charizard'), set('Blastoise'), {mv: index}, {}, profiles.expansion, guide);
  assert.deepEqual(actual.rolls, expected.result.damage);
  assert.equal(actual.cat, 'Special');
  assert.equal(actual.eff, 0.5);
});

await test('profile defaults have generation-appropriate field options', () => {
  for (const profile of Object.values(profiles)) {
    assert.deepEqual(profile.lv, [1, 100]);
    assert.deepEqual(profile.stages, [-6, 6]);
    assert.equal(profile.field.some(entry => entry.to === 'terrain'), profile.gen >= 6);
    assert.equal(profile.field.some(entry => entry.to === 'isAuroraVeil'), profile.gen >= 7);
    const terrain = profile.field.find(entry => entry.to === 'terrain');
    if (terrain) assert.equal(terrain.o.some(([value]) => value === 'Psychic'), profile.gen >= 7);
  }
});

await test('declared field controls only, safe select values', () => {
  engine.init(data, profiles.gen4);
  const attacker = set('Charizard');
  const defender = set('Blastoise');
  const baseline = plain(engine.calc(attacker, defender, slot('Flamethrower'), {}));
  assert.deepEqual(plain(engine.calc(attacker, defender, slot('Flamethrower'), {terrain: 'Electric', weather: 'nonsense', arbitrary: true})), baseline);
});

await test('notes identify modifiers and immunity', () => {
  engine.init(data, profiles.expansion);
  const result = engine.calc(set('Charizard', {it: 'Life Orb'}), set('Venusaur'), slot('Flamethrower', {crit: true}), {weather: 'Sun'});
  for (const note of ['STAB', 'Super effective', 'Crit', 'Sun', 'Life Orb']) assert.ok(result.notes.includes(note), note);
  const immune = engine.calc(set('Snorlax'), set('Gengar'), slot('Tackle'), {});
  assert.equal(immune.eff, 0);
  assert.ok(immune.notes.includes('No effect'));
});

const ref = path => ({ref: path});
const operation = (op, ...args) => ({op, args});
function withOverrides(over, selected = slot('Tackle'), attacker = set('Charizard'), defender = set('Blastoise'), base = profiles.expansion, field = {}) {
  engine.init(data, {...structuredClone(base), over});
  return plain(engine.calc(attacker, defender, selected, field));
}

await test('hand-checked attack modifier: 104 attack becomes 208, base damage 32', () => {
  const result = withOverrides({rules: [{phase: 'attackMods', append: [8192], note: 'Test strength'}]});
  assert.deepEqual(result.rolls, [27, 27, 27, 28, 28, 28, 29, 29, 29, 30, 30, 30, 31, 31, 31, 32]);
  assert.ok(result.notes.includes('Test strength'));
});

for (const base of [profiles.gen4, profiles.gen5, profiles.expansion]) {
  await test(`generation ${base.gen} power and stat modifier phases`, () => {
    const multiplier = base.gen === 4 ? 2 : 8192;
    const power = withOverrides({rules: [{phase: 'movePower', value: operation('mul', ref('value'), 2)}]}, slot('Tackle'), undefined, undefined, base);
    assert.deepEqual(withOverrides({rules: [{phase: 'powerMods', append: [multiplier]}]}, slot('Tackle'), undefined, undefined, base).rolls, power.rolls);
    const attack = withOverrides({rules: [{phase: 'attack', value: operation('mul', ref('value'), 2)}]}, slot('Tackle'), undefined, undefined, base);
    assert.deepEqual(withOverrides({rules: [{phase: 'attackMods', append: [multiplier]}]}, slot('Tackle'), undefined, undefined, base).rolls, attack.rolls);
    const defense = withOverrides({rules: [{phase: 'defense', value: operation('mul', ref('value'), 2)}]}, slot('Tackle'), undefined, undefined, base);
    assert.deepEqual(withOverrides({rules: [{phase: 'defenseMods', append: [multiplier]}]}, slot('Tackle'), undefined, undefined, base).rolls, defense.rolls);
    assert.ok(defense.max < withOverrides({}, slot('Tackle'), undefined, undefined, base).max);
  });
  await test(`generation ${base.gen} final modifier and roll phases`, () => {
    const baseline = withOverrides({}, slot('Tackle'), undefined, undefined, base);
    const expected = baseline.rolls.map(value => value * 2);
    const final = withOverrides({rules: [{phase: 'finalMods', append: [base.gen === 4 ? 2 : 8192]}]}, slot('Tackle'), undefined, undefined, base);
    assert.deepEqual(final.rolls, expected);
    const roll = withOverrides({rules: [{phase: 'roll', value: operation('mul', ref('value'), 2)}]}, slot('Tackle'), undefined, undefined, base);
    assert.deepEqual(roll.rolls, expected);
  });
  await test(`generation ${base.gen} hit-dependent power, base damage and crit`, () => {
    const selected = slot('Tackle', {hits: 3});
    const power = withOverrides({rules: [{phase: 'movePower', value: operation('mul', 40, ref('state.hit'))}]}, selected, undefined, undefined, base);
    assert.equal(power.per.length, 3);
    for (let hit = 1; hit <= 3; hit++) {
      assert.deepEqual(power.per[hit - 1], withOverrides({}, slot('Tackle', {bp: 40 * hit}), undefined, undefined, base).rolls);
    }
    const baseDamage = withOverrides({rules: [{phase: 'baseDamage', value: operation('add', ref('value'), 10)}]}, selected, undefined, undefined, base);
    assert.equal(baseDamage.per, undefined);
    const crit = withOverrides({rules: [{phase: 'critical', value: operation('eq', ref('state.hit'), 2)}]}, selected, undefined, undefined, base);
    const normalRolls = withOverrides({}, slot('Tackle'), undefined, undefined, base).rolls;
    const critRolls = withOverrides({}, slot('Tackle', {crit: true}), undefined, undefined, base).rolls;
    assert.deepEqual(crit.per, [normalRolls, critRolls, normalRolls]);
  });
  await test(`generation ${base.gen} before-roll inputs apply per hit`, () => {
    const result = withOverrides({rules: [{phase: 'beforeRolls', set: {'value.baseDamage': 40}}]}, slot('Tackle', {hits: 2}), undefined, undefined, base);
    assert.deepEqual(result.rolls, Array.from({length: 16}, (_, index) => Math.floor(40 * (85 + index) / 100)));
    assert.equal(result.per, undefined);
  });
}

await test('modifier lists can replace, remove and replace the whole list', () => {
  const attacker = set('Charizard', {it: 'Choice Band'});
  const replaced = withOverrides({rules: [{phase: 'attackMods', when: operation('eq', ref('names.atkItem'), 'Choice Band'),
    replace: [{from: 6144, to: 8192}]}]}, slot('Tackle'), attacker);
  assert.deepEqual(replaced.rolls, withOverrides({rules: [{phase: 'attackMods', append: [8192]}]}).rolls);
  for (const action of [{remove: [6144]}, {value: []}]) {
    assert.deepEqual(withOverrides({rules: [{phase: 'attackMods', ...action}]}, slot('Tackle'), attacker).rolls, withOverrides({}).rolls);
  }
});

await test('beforeStats applies boosts before native stat computation', () => {
  const actual = withOverrides({rules: [{phase: 'beforeStats', set: {'atk.boosts.atk': 2}}]});
  const expected = reference(set('Charizard', {stg: [0, 2, 0, 0, 0, 0]}), set('Blastoise'), slot('Tackle')).result.damage;
  assert.deepEqual(actual.rolls, expected);
});

await test('afterMoveType and per-target effectiveness rules', () => {
  const electric = withOverrides({rules: [{phase: 'afterMoveType', set: {'move.type': 'Electric'}}]});
  assert.deepEqual(electric.rolls, withOverrides({}, slot('Tackle', {t: 'Electric'})).rolls);
  const immune = withOverrides({}, slot('Tackle'), set('Snorlax'), set('Gengar'));
  const changed = withOverrides({rules: [{phase: 'effectiveness', when: operation('eq', ref('state.effectivenessType'), 'Ghost'), value: 1}]},
    slot('Tackle'), set('Snorlax'), set('Gengar'));
  assert.equal(immune.max, 0);
  assert.ok(changed.max > 0);
  assert.equal(changed.eff, 1);
});

await test('type chart and chart-generation overrides have precedence', () => {
  const result = withOverrides({typeChart: {Electric: {Water: 0}}}, slot('Thunderbolt'), set('Pikachu'));
  assert.equal(result.eff, 0);
  assert.equal(result.max, 0);
  assert.equal(withOverrides({typeGen: 4}, slot('Shadow Ball'), set('Gengar'), set('Scizor')).eff, 0.5);
});

await test('critical multiplier changes the base step rather than final rolls', () => {
  const actual = withOverrides({critMultiplier: 2}, slot('Tackle', {crit: true}));
  const expected = Array.from({length: 16}, (_, index) => Math.floor(34 * (85 + index) / 100));
  assert.deepEqual(actual.rolls, expected);
  for (const base of [profiles.gen4, profiles.gen5]) {
    const rolls = withOverrides({critMultiplier: 1.5}, slot('Tackle', {crit: true}), undefined, undefined, base).rolls;
    assert.deepEqual(rolls, withOverrides({}, slot('Tackle', {crit: true})).rolls);
  }
});

await test('turn order phase affects speed-dependent move power', () => {
  const basePower = data.MV[data.M.indexOf('Payback')].bp;
  const actual = withOverrides({rules: [{phase: 'turnOrder', value: 'last'}]}, slot('Payback'));
  const expected = withOverrides({}, slot('Payback', {bp: basePower * 2}));
  assert.deepEqual(actual.rolls, expected.rolls);
});

await test('beforeWeather can suppress just the weather damage modifier', () => {
  const selected = slot('Surf');
  const attacker = set('Blastoise');
  const defender = set('Snorlax');
  const actual = withOverrides({rules: [{phase: 'beforeWeather', set: {'field.weather': ''}}]}, selected, attacker, defender, profiles.expansion, {weather: 'Rain'});
  assert.deepEqual(actual.rolls, withOverrides({}, selected, attacker, defender).rolls);
});

await test('effect aliases, move/species metadata and status mappings', () => {
  const attacker = set('Charizard', {ab: ability('Feline Prowess'), it: 'Test Band'});
  const actual = withOverrides({abilities: {'Feline Prowess': {effect: 'Huge Power'}}, items: {'Test Band': {effect: 'Choice Band'}}}, slot('Tackle'), attacker);
  const expected = withOverrides({}, slot('Tackle'), {...attacker, ab: ability('Huge Power'), it: 'Choice Band'});
  assert.deepEqual(actual.rolls, expected.rolls);
  const custom = withOverrides({moves: {Tackle: {basePower: 80}}, species: {'6': {baseStats: {atk: 188}}}});
  assert.deepEqual(custom.rolls, withOverrides({rules: [{phase: 'attackMods', append: [8192]}]}, slot('Tackle', {bp: 80})).rolls);
  const alias = withOverrides({moves: {'Aqua Fang': {effect: 'Weather Ball'}}}, slot('Aqua Fang'), undefined, undefined, profiles.expansion, {weather: 'Rain'});
  const weatherBall = withOverrides({moves: {'Weather Ball': {category: 'Physical'}}}, slot('Weather Ball', {bp: 80}), undefined, undefined, profiles.expansion, {weather: 'Rain'});
  assert.deepEqual(alias.rolls, weatherBall.rolls);
  const profile = {...structuredClone(profiles.expansion), status: [...profiles.expansion.status, ['custom', 'Custom burn']], over: {status: {custom: 'brn'}}};
  assert.deepEqual(withOverrides(profile.over, slot('Tackle'), set('Charizard', {st: 'custom'}), undefined, profile).rolls,
    withOverrides({}, slot('Tackle'), set('Charizard', {st: 'brn'})).rolls);
});

await test('custom field flags and hit-dependent final shields', () => {
  const profile = {...structuredClone(profiles.expansion), field: [...profiles.expansion.field,
    {k: 'shield', l: 'Shield', type: 'toggle', side: 'field', to: 'customShield'}]};
  const over = {rules: [{phase: 'finalMods', when: operation('and', ref('field.customShield'), operation('eq', ref('state.hitCount'), 0)), append: [2048], note: 'Custom shield'}]};
  const actual = withOverrides(over, slot('Icicle Spear', {hits: 2}), set('Cloyster'), set('Snorlax'), profile, {shield: true});
  const base = withOverrides({}, slot('Icicle Spear', {hits: 2}), set('Cloyster'), set('Snorlax'), profile);
  assert.ok(actual.per[0][15] < base.max);
  assert.deepEqual(actual.per[1], base.rolls);
  assert.ok(actual.notes.includes('Custom shield'));
});

await test('bad rule phases, unsafe paths and invalid mechanics options fail explicitly', () => {
  for (const over of [{rules: [{phase: 'typo'}]}, {rules: [{phase: 'beforeStats', set: {'atk.__proto__.test': 1}}]}, {typeGen: 0}, {critMultiplier: -1}]) {
    assert.throws(() => engine.init(data, {...profiles.expansion, over}));
  }
});

await test('node entry handles single/batch requests and merged profiles', async () => {
  const matchup = {atk: set('Charizard'), def: set('Blastoise'), slot: slot('Tackle'), field: {}};
  const profile = await resolveProfile({base: 'expansion'});
  const single = plain(await runMatchups(data, profile, matchup));
  const batch = plain(await runMatchups(data, profile, [matchup, matchup]));
  assert.deepEqual(batch, [single, single]);
  const cli = spawnSync(process.execPath, [fileURLToPath(new URL('run.mjs', import.meta.url)),
    fileURLToPath(new URL('hacks/emerald-imperium/data.json', root)),
    fileURLToPath(new URL('template/calc/profiles/expansion.json', root)), '-'], {
    input: JSON.stringify(matchup), encoding: 'utf8',
  });
  assert.equal(cli.status, 0, cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), single);
});

// Hand-checked: Charizard Tackle into Blastoise at 104 Attack. Gen 5+ base damage is
// floor(floor(22*40*104/120)/50)+2 = 17. Rolls are floor(base*(85+i)/100).
const secondHalf = {phase: 'hitBaseDamage', when: operation('gte', ref('state.hit'), 2),
  value: operation('floor', operation('mul', ref('value'), 0.5))};
const extraHit = {phase: 'hits', when: operation('eq', ref('value'), 1), value: 2};

await test('hand-checked second hit: base 17 on hit 1, floor(17 / 2) = 8 on hit 2', () => {
  for (const base of [profiles.expansion, profiles.gen5]) {
    const result = withOverrides({rules: [extraHit, secondHalf]}, slot('Tackle'), undefined, undefined, base);
    assert.equal(result.hits, 2);
    assert.deepEqual(result.per, [
      [...Array(4).fill(14), ...Array(6).fill(15), ...Array(5).fill(16), 17],
      [...Array(3).fill(6), ...Array(12).fill(7), 8],
    ]);
    assert.deepEqual(result.rolls, result.per[0]);
  }
});

await test('hand-checked Gen 4 second hit: the hook sees 15 before the +2, so hit 2 is 7 + 2 = 9', () => {
  // Gen 4 adds its +2 inside the DPP final modifiers, after screens, spread and weather.
  const result = withOverrides({rules: [extraHit, secondHalf]}, slot('Tackle'), undefined, undefined, profiles.gen4);
  assert.deepEqual(result.per, [
    [...Array(4).fill(14), ...Array(6).fill(15), ...Array(5).fill(16), 17],
    [...Array(4).fill(7), ...Array(11).fill(8), 9],
  ]);
});

await test('hand-checked burn input halves each physical roll once', () => {
  const result = withOverrides({rules: [{phase: 'beforeRolls', set: {'value.isBurned': true}}]}, slot('Tackle'));
  assert.deepEqual(result.rolls, [...Array(10).fill(7), ...Array(6).fill(8)]);
});

await test('frostbite-style status halves special rolls only, after type effectiveness', () => {
  const profile = {...structuredClone(profiles.expansion),
    status: [...profiles.expansion.status.filter(([key]) => key !== 'frz'), ['frz', 'Frostbite']]};
  const over = {rules: [{phase: 'beforeRolls', when: operation('and', operation('eq', ref('input.atk.st'), 'frz'),
    operation('eq', ref('move.category'), 'Special')), set: {'value.isBurned': true}}]};
  const attacker = set('Snorlax', {st: 'frz'});
  const halved = withOverrides(over, slot('Flamethrower'), attacker, set('Blastoise'), profile);
  const normal = withOverrides({}, slot('Flamethrower'), set('Snorlax'), set('Blastoise'), profile);
  assert.deepEqual(halved.rolls, normal.rolls.map(value => Math.floor(value / 2)));
  assert.equal(halved.eff, normal.eff);
  const physical = withOverrides(over, slot('Tackle'), attacker, set('Blastoise'), profile);
  assert.deepEqual(physical.rolls, withOverrides({}, slot('Tackle'), set('Snorlax'), set('Blastoise'), profile).rolls);
});

await test('a hit-count rule that returns a non-number fails explicitly', () => {
  engine.init(data, {...structuredClone(profiles.expansion), over: {rules: [{phase: 'hits', value: operation('mul', ref('value'), 'x')}]}});
  assert.throws(() => engine.calc(set('Charizard'), set('Blastoise'), slot('Tackle'), {}), /hit count must be a number/);
});

await test('initialisation and calculations leave guide/profile inputs unchanged', () => {
  assert.equal(JSON.stringify({data, profiles}), unchanged);
});

const bundle = await readFile(new URL('template/calc/engine.js', root));
console.log(`engine.js: ${bundle.length} bytes; gzip ${gzipSync(bundle).length} bytes`);
console.log(`${passed} passed; ${failed} failed; ${parity} direct @smogon/calc parity cases`);
if (failed) process.exitCode = 1;

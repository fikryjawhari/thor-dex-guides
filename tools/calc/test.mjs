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

await test('initialisation and calculations leave guide/profile inputs unchanged', () => {
  assert.equal(JSON.stringify({data, profiles}), unchanged);
});

const bundle = await readFile(new URL('template/calc/engine.js', root));
console.log(`engine.js: ${bundle.length} bytes; gzip ${gzipSync(bundle).length} bytes`);
console.log(`${passed} passed; ${failed} failed; ${parity} direct @smogon/calc parity cases`);
if (failed) process.exitCode = 1;

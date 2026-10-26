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
await compare('nonuniform Triple Kick', set('Machamp'), set('Blastoise'), slot('Triple Kick', {hits: 3, bp: 10}));
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
  assert.equal(engine.calc(set('Charizard'), set('Blastoise'), slot('Present'), {}), null);
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

await test('Triple Kick and Triple Axel scale a changed power per hit', () => {
  for (const [base, move] of [['gen6', 'Triple Kick'], ['gen7', 'Triple Kick'], ['expansion', 'Triple Axel']]) {
    engine.init(data, profiles[base]);
    const hit = bp => plain(engine.calc(set('Machamp'), set('Blastoise'), slot(move, {bp, hits: 1}), {})).rolls;
    const three = plain(engine.calc(set('Machamp'), set('Blastoise'), slot(move, {bp: 25, hits: 3}), {}));
    assert.deepEqual(three.per, [hit(25), hit(50), hit(75)], `${base} ${move}`);
  }
});

await test('residual parts: weather, items, status, terrain, profile abilities', () => {
  engine.init(data, profiles.expansion);
  const snorlax = set('Snorlax', {it: 'Leftovers'});
  const max = engine.stats(snorlax)[0];
  const sixteenth = Math.floor(max / 16);
  const parts = plain(engine.residual(snorlax, {weather: 'Sand'}));
  assert.deepEqual(parts, [{l: 'Sandstorm', v: Array(4).fill(-sixteenth)}, {l: 'Leftovers', v: Array(4).fill(sixteenth)}]);
  assert.deepEqual(plain(engine.residual(set('Garchomp'), {weather: 'Sand'})), [], 'Ground is immune to sand');
  const toxic = plain(engine.residual(set('Snorlax', {st: 'tox', toxn: 2}), {}));
  assert.deepEqual(toxic[0].v, [2, 3, 4, 5].map(n => -Math.floor(max * n / 16)), 'toxic rises from the counter');
  assert.deepEqual(plain(engine.residual(set('Snorlax', {st: 'brn'}), {}))[0].v[0], -Math.floor(max / 16), 'Gen 7+ burn');
  engine.init(data, profiles.gen6);
  assert.deepEqual(plain(engine.residual(set('Snorlax', {st: 'brn'}), {}))[0].v[0], -Math.floor(max / 8), 'Gen 6 burn');
  engine.init(data, {...profiles.expansion, residual: {abilities: {'Huge Power': [1, 16]}, status: {frz: [-1, 16, 'Frostbite']}}});
  assert.deepEqual(plain(engine.residual(set('Snorlax', {ab: ability('Huge Power'), st: 'frz'}), {})).map(part => [part.l, part.v[0]]),
    [['Frostbite', -sixteenth], ['Huge Power', sixteenth]]);
});

await test('KO text counts the defender residual each turn; rolls and percentages do not', () => {
  engine.init(data, profiles.expansion);
  const attacker = set('Charizard');
  const plainDefender = set('Snorlax');
  const sludge = set('Snorlax', {it: 'Black Sludge'});
  const base = plain(engine.calc(attacker, plainDefender, slot('Tackle'), {}));
  const withSludge = plain(engine.calc(attacker, sludge, slot('Tackle'), {}));
  assert.deepEqual(withSludge.rolls, base.rolls);
  assert.equal(withSludge.pmax, base.pmax);
  assert.deepEqual(withSludge.eot, [{l: 'Black Sludge', v: Array(4).fill(-Math.floor(engine.stats(sludge)[0] / 8))}]);
  // Brute force over two turns at an HP where two plain hits rarely KO.
  const loss = -withSludge.eot[0].v[0];
  const hp = base.rolls[3] * 2 + loss;
  let hits = 0;
  for (const first of base.rolls) for (const second of base.rolls) {
    if (first + loss + second + loss >= hp) hits++; // KO on the second hit or the second end of turn
  }
  const actual = plain(engine.calc(attacker, {...sludge, hp}, slot('Tackle'), {}));
  assert.equal(actual.ko.n, 2);
  assert.ok(Math.abs(actual.ko.p - hits / 256) < 1e-12, `${actual.ko.p} vs ${hits / 256}`);
  const recovery = plain(engine.calc(attacker, {...set('Snorlax', {it: 'Leftovers'}), hp}, slot('Tackle'), {}));
  assert.ok(recovery.ko.n > 2 || recovery.ko.p < actual.ko.p, 'Leftovers makes the KO later or less likely');
});

await test('Protean / Libero: STAB on every move in Gen 4, 6, 7 and 9; a defender takes the chosen type', () => {
  for (const base of ['gen4', 'gen6', 'gen7', 'expansion']) {
    engine.init(data, profiles[base]);
    for (const name of ['Protean', 'Libero']) {
      const plainHit = plain(engine.calc(set('Charizard'), set('Snorlax'), slot('Tackle'), {}));
      const changer = plain(engine.calc(set('Charizard', {ab: ability(name)}), set('Snorlax'), slot('Tackle'), {}));
      assert.ok(changer.notes.includes('STAB'), `${base} ${name} STAB note`);
      assert.ok(changer.max > plainHit.max, `${base} ${name} STAB damage`);
    }
    const immune = engine.calc(set('Snorlax'), set('Charizard', {ab: ability('Protean')}), slot('Earthquake'), {});
    const chosen = plain(engine.calc(set('Snorlax'), set('Charizard', {ab: ability('Protean'), pty: 'Fire'}), slot('Earthquake'), {}));
    const ignored = plain(engine.calc(set('Snorlax'), set('Charizard', {ab: ability('Blaze'), pty: 'Fire'}), slot('Earthquake'), {}));
    assert.equal(immune.max, 0, `${base} Flying stays immune by default`);
    assert.equal(chosen.eff, 2, `${base} chosen Fire type takes Ground super effectively`);
    assert.equal(ignored.max, 0, `${base} the type choice needs Protean / Libero`);
  }
});

await test('weight, HP, speed and boost powers are automatic; a set power still wins', () => {
  for (const base of ['gen4', 'gen5', 'gen6', 'gen7', 'expansion']) {
    engine.init(data, profiles[base]);
    const power = (atk, def, move, extra = {}) => plain(engine.calc(atk, def, slot(move, extra), {}))?.bp;
    assert.equal(power(set('Pikachu'), set('Snorlax'), 'Low Kick'), 120, `${base} Low Kick vs 460 kg`);
    assert.equal(power(set('Snorlax'), set('Pikachu'), 'Grass Knot'), 20, `${base} Grass Knot vs 6 kg`);
    assert.equal(power(set('Snorlax', {hp: 1}), set('Pikachu'), 'Flail'), 200, `${base} Flail at 1 HP`);
    assert.equal(power(set('Snorlax'), set('Pikachu'), 'Reversal'), 20, `${base} Reversal at full HP`);
    assert.ok(power(set('Snorlax'), set('Pikachu'), 'Gyro Ball') >= 55, `${base} slow Gyro Ball (25 x 110 / 50)`);
    assert.equal(power(set('Snorlax'), set('Pikachu', {stg: [0, 0, 0, 0, 0, 2]}), 'Punishment'), 100, `${base} Punishment +2`);
    if (base !== 'gen4') {
      assert.equal(power(set('Snorlax'), set('Pikachu'), 'Heavy Slam'), 120, `${base} Heavy Slam 460 / 6 kg`);
      assert.equal(power(set('Pikachu'), set('Snorlax'), 'Electro Ball'), 80, `${base} Electro Ball 110 / 50 speed`);
    }
    assert.equal(power(set('Snorlax', {it: 'Iron Ball'}), set('Pikachu'), 'Fling'), 130, `${base} Fling Iron Ball`);
    const fixed = plain(engine.calc(set('Pikachu'), set('Snorlax'), slot('Low Kick', {bp: 60}), {}));
    assert.equal(fixed.bp, undefined, `${base} a set power is not reported back`);
    assert.ok(fixed.max < plain(engine.calc(set('Pikachu'), set('Snorlax'), slot('Low Kick'), {})).max, `${base} set power 60 < 120`);
    for (const move of ['Return', 'Frustration']) {
      const preset = plain(engine.calc(set('Snorlax'), set('Pikachu'), slot(move), {}));
      assert.equal(preset.bp, 102, `${base} ${move} defaults to 102`);
      assert.deepEqual(preset.rolls, plain(engine.calc(set('Snorlax'), set('Pikachu'), slot(move, {bp: 102}), {})).rolls,
        `${base} ${move} default = typed 102`);
      assert.equal(plain(engine.calc(set('Snorlax'), set('Pikachu'), slot(move, {bp: 51}), {})).bp, undefined, `${base} a typed power wins`);
    }
    assert.equal(power(set('Snorlax'), set('Nidoran♀'), 'Low Kick'), 20, `${base} Nidoran-F keeps its own entry (7 kg)`);
    assert.ok(engine.stats(set('Nidoran♀'))[1] < engine.stats(set('Nidoran♂'))[1], `${base} Nidoran-F and -M keep their own stats`);
    assert.equal(power(set('Snorlax'), set('Flabébé'), 'Low Kick'), 20, `${base} an accented name builds`);
    assert.equal(power(set('Snorlax'), set('Alolan Golem'), 'Low Kick'), 120, `${base} a regional form takes its stock weight (316 kg)`);
    assert.equal(power(set('Snorlax'), set('Mega Butterfree'), 'Low Kick'), 60, `${base} a hack Mega takes its base species' weight (32 kg)`);
  }
  engine.init(data, profiles.expansion);
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

await test('hit rules reproduce the native Parental Bond second hit (0.25, half down)', () => {
  const attacker = set('Snorlax', {ab: ability('Parental Bond')});
  const hitsOf = result => result.per || Array.from({length: result.hits}, () => result.rolls);
  const native = withOverrides({}, slot('Tackle'), attacker);
  const ruled = withOverrides({abilities: {'Parental Bond': {effect: ''}}, rules: [
    {phase: 'hits', when: operation('and', operation('eq', ref('names.atkAbility'), 'Parental Bond'),
      operation('eq', ref('value'), 1)), value: 2},
    {phase: 'hitBaseDamage', when: operation('and', operation('eq', ref('names.atkAbility'), 'Parental Bond'),
      operation('gte', ref('state.hit'), 2)), value: operation('floor', operation('div',
      operation('add', operation('mul', ref('value'), 1024), 2047), 4096))},
  ]}, slot('Tackle'), attacker);
  assert.equal(ruled.hits, 2);
  assert.deepEqual(hitsOf(ruled), hitsOf(native));
});

await test('Kee / Maranga Berry raise the stage once, before hit 2 only (stock re-applied them every hit)', () => {
  engine.init(data, profiles.expansion);
  for (const [item, move] of [['Kee Berry', 'Rock Blast'], ['Maranga Berry', 'Water Shuriken']]) {
    const result = plain(engine.calc(set('Greninja'), set('Blissey', {it: item}), slot(move, {hits: 3}), {}));
    assert.notDeepEqual(result.per[1], result.per[0], `${item} raises before hit 2`);
    assert.deepEqual(result.per[2], result.per[1], `${item} is used up: hit 3 = hit 2`);
    assert.equal(result.pre.length, 1, `${item} reported once`);
  }
});

await test('a Gem boosts every hit of a multi-hit move (one activation before the move, as in the games)', () => {
  engine.init(data, profiles.expansion);
  const gem = plain(engine.calc(set('Snorlax', {it: 'Normal Gem'}), set('Blissey'), slot('Double Hit'), {}));
  const none = plain(engine.calc(set('Snorlax'), set('Blissey'), slot('Double Hit'), {}));
  assert.equal(gem.per, undefined, 'both hits alike');
  assert.ok(gem.max > none.max, 'both boosted');
});

await test("Ash-Greninja's Water Shuriken: power 20, three hits by default (guide names, not stock's)", () => {
  engine.init(data, profiles.expansion);
  const ash = plain(engine.calc(set('Greninja (Ash)', {ab: ability('Battle Bond')}), set('Blissey'), slot('Water Shuriken'), {}));
  assert.equal(ash.bp, 20);
  assert.equal(ash.hits, 3);
  assert.equal(plain(engine.calc(set('Greninja'), set('Blissey'), slot('Water Shuriken'), {})).bp, undefined, 'plain Greninja keeps 15');
});

await test('fixed / fraction damage: level, half HP, Endeavor, Final Gambit, immunities, OHKO, Taken', () => {
  engine.init(data, profiles.expansion);
  const hit = (atk, def, move, extra = {}) => plain(engine.calc(atk, def, slot(move, extra), {}));
  const blissey = set('Blissey', {hp: 301});
  assert.deepEqual([hit(set('Snorlax'), blissey, 'Seismic Toss').min, hit(set('Snorlax'), blissey, 'Seismic Toss').max], [50, 50]);
  assert.equal(hit(set('Snorlax'), blissey, 'Night Shade').eff, 0, 'Normal is immune to Night Shade');
  assert.equal(hit(set('Snorlax'), set('Blissey', {hp: 10}), 'Endeavor').eff, 1, 'Endeavor at 0 is not an immunity');
  assert.equal(hit(set('Snorlax'), set('Gengar'), 'Seismic Toss').max, 0, 'Ghost is immune to Seismic Toss');
  assert.equal(hit(set('Snorlax'), blissey, 'Super Fang').max, 150, 'half current HP, rounded down');
  assert.equal(hit(set('Snorlax', {hp: 40}), blissey, 'Endeavor').max, 261);
  assert.equal(hit(set('Snorlax', {hp: 40}), blissey, 'Final Gambit').max, 40);
  const psywave = hit(set('Snorlax'), blissey, 'Psywave');
  assert.deepEqual([psywave.min, psywave.max], [25, 75]);
  assert.equal(engine.calc(set('Snorlax'), blissey, slot('Counter'), {}), null, 'Counter needs the damage taken');
  assert.equal(hit(set('Snorlax'), blissey, 'Counter', {bp: 60}).max, 120);
  assert.equal(hit(set('Snorlax'), blissey, 'Metal Burst', {bp: 61}).max, 91);
  assert.equal(hit(set('Snorlax'), set('Blissey', {hp: 100}), 'Seismic Toss').ko.n, 2);
});

await test('DMG.hp: the user own HP change per group (heals, costs, recoil, drain, items, swaps)', () => {
  engine.init(data, profiles.expansion);
  const change = (atk, move, dealt = 0, def = set('Blissey'), field = {}) => plain(engine.hp(atk, def, slot(move), field, dealt));
  const snorlax = set('Snorlax');
  const max = engine.stats(snorlax)[0];
  assert.equal(change(snorlax, 'Recover').v, Math.floor(max / 2));
  assert.equal(change(snorlax, 'Moonlight', 0, set('Blissey'), {weather: 'Sun'}).v, Math.floor(max * 2 / 3));
  assert.equal(change(snorlax, 'Moonlight', 0, set('Blissey'), {weather: 'Rain'}).v, Math.floor(max / 4));
  assert.equal(change(snorlax, 'Belly Drum').v, -Math.floor(max / 2));
  assert.deepEqual(change(set('Snorlax', {hp: 100}), 'Rest'), {v: max - 100, l: 'Rest', st: 'slp'});
  assert.equal(change(set('Snorlax', {hp: 100}), 'Explosion').v, -100);
  assert.equal(change(snorlax, 'Double-Edge', 90).v, -30);
  assert.equal(change(set('Snorlax', {ab: ability('Rock Head')}), 'Double-Edge', 90), null);
  assert.equal(change(snorlax, 'Drain Punch', 91).v, 46, 'half, rounded half up');
  assert.equal(change(set('Snorlax', {it: 'Big Root'}), 'Drain Punch', 91).v, Math.floor(46 * 5324 / 4096));
  assert.equal(change(snorlax, 'Drain Punch', 91, set('Tentacruel', {ab: ability('Liquid Ooze')})).v, -46);
  assert.equal(change(set('Snorlax', {it: 'Life Orb'}), 'Body Slam', 50).v, -Math.floor(max / 10));
  assert.equal(change(snorlax, 'Mind Blown').v, -Math.ceil(max / 2));
  const split = change(set('Snorlax', {hp: 100}), 'Pain Split', 0, set('Blissey', {hp: 300}));
  assert.deepEqual(split.set, {atk: 200, def: 200});
  assert.equal(change(snorlax, 'Body Slam', 50), null, 'no change without an effect');
  assert.equal(change(snorlax, 'Curse'), null, 'non-Ghost Curse costs nothing');
});

await test('a hit-count rule that returns a non-number fails explicitly', () => {
  engine.init(data, {...structuredClone(profiles.expansion), over: {rules: [{phase: 'hits', value: operation('mul', ref('value'), 'x')}]}});
  assert.throws(() => engine.calc(set('Charizard'), set('Blastoise'), slot('Tackle'), {}), /hit count must be a number/);
});

await test('stackable residuals use the requested side and preserve the two-argument API', () => {
  engine.init(data, profiles.expansion);
  const target = set('Snorlax', {st: 'slp'});
  const max = engine.stats(target)[0];
  const field = Object.fromEntries(['Trapped', 'Seeded', 'SaltCure', 'Cursed', 'Nightmare', 'Ingrain', 'AquaRing', 'SeaOfFire']
    .map(key => ['def' + key, true]));
  assert.deepEqual(plain(engine.residual(target, field)), []);
  assert.deepEqual(plain(engine.residual(target, field, null, 'def')).map(part => [part.l, part.v]), [
    ['Trapped', -Math.floor(max / 8)], ['Leech Seed', -Math.floor(max / 8)], ['Salt Cure', -Math.floor(max / 8)],
    ['Curse', -Math.floor(max / 4)], ['Nightmare', -Math.floor(max / 4)], ['Ingrain', Math.floor(max / 16)],
    ['Aqua Ring', Math.floor(max / 16)], ['Sea of Fire', -Math.floor(max / 8)],
  ].map(([label, value]) => [label, Array(4).fill(value)]));
  assert.equal(engine.residual(set('Blastoise'), {atkSaltCure: true})[0].v[0], -Math.floor(engine.stats(set('Blastoise'))[0] / 4));
  assert.equal(engine.residual(set('Metagross'), {atkSaltCure: true})[0].v[0], -Math.floor(engine.stats(set('Metagross'))[0] / 4));
  assert.deepEqual(plain(engine.residual(set('Charizard'), {atkSeaOfFire: true, atkNightmare: true})), []);
});

const fieldGuide = structuredClone(data);
const fieldAbility = name => {
  let index = fieldGuide.AB.findIndex(entry => entry[0] === name && !entry[2]);
  if (index < 0) index = fieldGuide.AB.push([name, '']) - 1;
  return index;
};
for (const name of ['Magic Guard', 'Liquid Ooze', 'Bad Dreams', 'Comatose', 'Levitate', 'Klutz', 'Swift Swim',
  'Clear Body', 'Contrary', 'Mirror Armor', 'Immunity', 'Leaf Guard', 'Purifying Salt', 'Full Metal Body', 'White Smoke']) fieldAbility(name);

await test('opposing Binding Band and generation-specific trapping fractions', () => {
  const target = set('Snorlax');
  for (const gen of [4, 5, 6, 7, 8, 9]) {
    engine.init(fieldGuide, {...profiles.expansion, gen});
    const max = engine.stats(target)[0];
    const hit = (other, own = target, field = {}) => engine.residual(own, {atkTrapped: true, ...field}, other)[0].v[0];
    assert.equal(hit(set('Blastoise')), -Math.floor(max / (gen >= 6 ? 8 : 16)));
    assert.equal(hit(set('Blastoise', {it: 'Binding Band'})), -Math.floor(max / (gen >= 6 ? 6 : gen === 5 ? 8 : 16)));
    assert.equal(hit(set('Blastoise'), {...target, it: 'Binding Band'}), -Math.floor(max / (gen >= 6 ? 8 : 16)));
    assert.equal(hit(set('Blastoise', {it: 'Binding Band', ab: fieldAbility('Klutz')})), -Math.floor(max / (gen >= 6 ? 8 : 16)));
  }
});

await test('seed transfer, Big Root rounding, Liquid Ooze and Magic Guard on either side', () => {
  engine.init(fieldGuide, profiles.expansion);
  const seeded = set('Snorlax');
  const healer = set('Blastoise', {it: 'Big Root', ev: [48, 0, 0, 0, 0, 0]});
  const seed = Math.floor(engine.stats(seeded)[0] / 8);
  assert.equal(engine.residual(healer, {defSeeded: true}, seeded)[0].v[0], Math.floor(seed * 13 / 10));
  const ooze = {...seeded, ab: fieldAbility('Liquid Ooze')};
  assert.equal(engine.residual(healer, {defSeeded: true}, ooze)[0].v[0], -Math.floor(seed * 13 / 10));
  const guard = fieldAbility('Magic Guard');
  assert.deepEqual(plain(engine.residual({...healer, ab: guard}, {defSeeded: true}, ooze)), []);
  assert.deepEqual(plain(engine.residual(healer, {defSeeded: true}, {...seeded, ab: guard})), []);
  assert.deepEqual(plain(engine.residual({...seeded, ab: guard}, {atkSeeded: true})), []);
  const healing = plain(engine.residual(healer, {atkIngrain: true, atkAquaRing: true}));
  assert.equal(engine.stats(healer)[0], 160);
  assert.deepEqual(healing.map(part => part.v[0]), [13, 13]);
  const blocked = plain(engine.residual({...healer, ab: guard}, {atkTrapped: true, atkSeeded: true,
    atkSaltCure: true, atkCursed: true, atkNightmare: true, atkSeaOfFire: true, atkIngrain: true}));
  assert.deepEqual(blocked.map(part => part.l), ['Ingrain']);
  const asleep = set('Snorlax', {st: 'slp'});
  assert.equal(engine.residual(asleep, {}, set('Gengar', {ab: fieldAbility('Bad Dreams')}))[0].l, 'Bad Dreams');
  assert.equal(engine.residual({...asleep, st: '', ab: fieldAbility('Comatose')}, {}, set('Gengar', {ab: fieldAbility('Bad Dreams')}))[0].l, 'Bad Dreams');
  assert.deepEqual(plain(engine.residual(set('Snorlax'), {}, set('Gengar', {ab: fieldAbility('Bad Dreams')}))), []);
});

await test('field speed includes stages, Swamp, Tailwind, paralysis, weather and items', () => {
  engine.init(fieldGuide, profiles.expansion);
  const target = set('Blastoise');
  const raw = engine.stats(target)[5];
  assert.equal(engine.speed(target), raw);
  assert.equal(engine.speed(target, {atkSwamp: true}), Math.ceil(raw / 4 - 0.5));
  assert.equal(engine.speed(target, {atkSwamp: true, atkTailwind: true}), Math.ceil(raw / 2 - 0.5));
  assert.equal(engine.speed(target, {defSwamp: true}), raw);
  assert.equal(engine.speed(target, {defSwamp: true}, 'def'), Math.ceil(raw / 4 - 0.5));
  assert.equal(engine.speed({...target, ab: fieldAbility('Swift Swim')}, {weather: 'Rain', atkSwamp: true}), Math.ceil(raw / 2 - 0.5));
  assert.equal(engine.speed({...target, st: 'par'}, {atkSwamp: true}), Math.floor(Math.ceil(raw / 4 - 0.5) / 2));
  assert.equal(engine.speed({...target, it: 'Choice Scarf'}, {atkSwamp: true}), Math.ceil(raw * 3 / 8 - 0.5));
  assert.equal(engine.speed({...target, stg: [0, 0, 0, 0, 0, 2]}, {atkSwamp: true}), Math.ceil(raw / 2 - 0.5));
  const gyro = field => engine.calc(set('Snorlax'), target, slot('Gyro Ball'), field).bp;
  assert.ok(gyro({defSwamp: true}) < gyro({}), 'Swamp changes internal speed-dependent power too');
});

await test('direct field inputs work without profile entries across all engine generations', () => {
  for (const gen of [4, 5, 6, 7, 8, 9]) {
    engine.init(fieldGuide, {...profiles.expansion, gen, field: []});
    const attack = (name, defender, field, attacker = set('Snorlax')) => plain(engine.calc(attacker, defender, slot(name), field));
    assert.equal(attack('Tackle', set('Gengar'), {}).max, 0);
    assert.ok(attack('Tackle', set('Gengar'), {defForesight: true}).max > 0);
    assert.equal(attack('Psychic', set('Umbreon'), {}).max, 0);
    assert.ok(attack('Psychic', set('Umbreon'), {defMiracleEye: true}).max > 0);
    const normal = attack('Thunderbolt', set('Blastoise'), {});
    const charged = attack('Thunderbolt', set('Blastoise'), {atkCharge: true});
    assert.ok(charged.min > normal.max);
    const fire = attack('Flamethrower', set('Blastoise'), {});
    const tar = attack('Flamethrower', set('Blastoise'), {defTarShot: true});
    assert.equal(tar.eff, fire.eff * 2);
    assert.ok(tar.min > fire.max);
    const glaive = attack('Tackle', set('Blastoise'), {defGlaiveRush: true});
    const base = attack('Tackle', set('Blastoise'), {});
    assert.deepEqual(glaive.rolls, base.rolls.map(value => value * 2));
    assert.equal(attack('Tackle', set('Blastoise'), {defProtect: true}).max, 0);
    const levitate = set('Gengar', {ab: fieldAbility('Levitate')});
    assert.equal(attack('Earthquake', levitate, {}).max, 0);
    assert.ok(attack('Earthquake', levitate, {defGrounded: true}).max > 0);
    assert.ok(attack('Earthquake', levitate, {defIngrain: true}).max > 0);
    assert.equal(attack('Earthquake', set('Blastoise'), {defMagnetRise: true}).max, 0);
    assert.equal(attack('Earthquake', set('Blastoise'), {defTelekinesis: true}).max, 0);
    assert.ok(attack('Earthquake', set('Blastoise'), {defMagnetRise: true, defGrounded: true}).max > 0);
    assert.ok(attack('Earthquake', set('Charizard'), {defGrounded: true}).max > 0);
    assert.ok(attack('Earthquake', set('Charizard'), {defRoost: true}).max > 0);
    const pureFlying = fieldGuide.P.find(species => species.t.length === 1 && species.t[0] === 'Flying');
    assert.ok(pureFlying, 'fixture has a pure Flying species');
    assert.ok(attack('Earthquake', {id: pureFlying.id, lv: 50, ab: -1}, {defRoost: true}).max > 0);
    if (gen >= 6) assert.ok(attack('Thousand Arrows', set('Blastoise'), {defTelekinesis: true}).max > 0);
    if (gen >= 5) assert.ok(attack('Earthquake', set('Blastoise', {it: 'Air Balloon'}), {defGrounded: true}).max > 0);
  }
});

for (const gen of [4, 5, 6, 7, 8, 9]) {
  for (const name of ['Charizard', 'Skarmory']) {
    const profile = {...profiles.expansion, gen};
    await compare(`Iron Ball dual-type parity Gen ${gen} ${name}`, set('Snorlax'),
      set(name, {it: 'Iron Ball'}), slot('Earthquake'), {}, {}, profile, fieldGuide);
  }
}

await test('volatile Ground immunity and Tar Shot survive inverse chart rules in the right order', () => {
  engine.init(fieldGuide, {...profiles.expansion, over: {rules: [{phase: 'effectiveness',
    when: {ref: 'input.field.inverse'}, value: {op: 'if', args: [
      {op: 'eq', args: [{ref: 'value'}, 0]}, 2, {op: 'div', args: [1, {ref: 'value'}]},
    ]}}]}});
  const attack = (move, defender, values) => engine.calc(set('Snorlax'), set(defender), slot(move), {inverse: true, ...values});
  assert.equal(attack('Earthquake', 'Blastoise', {defMagnetRise: true}).max, 0);
  assert.equal(attack('Earthquake', 'Blastoise', {defTelekinesis: true}).max, 0);
  assert.equal(attack('Earthquake', 'Charizard', {defGrounded: true}).eff, 0.5);
  assert.equal(attack('Psychic', 'Umbreon', {defMiracleEye: true}).eff, 1);
  assert.equal(attack('Tackle', 'Gengar', {defForesight: true}).eff, 1);
  const plainFire = attack('Flamethrower', 'Blastoise', {});
  assert.equal(attack('Flamethrower', 'Blastoise', {defTarShot: true}).eff, plainFire.eff * 2);
});

await test('hazards are pure, side-specific and generation-aware, including engine-only Steelsurge', () => {
  const target = set('Snorlax');
  for (const gen of [4, 5, 6, 7, 8, 9]) {
    engine.init(fieldGuide, {...profiles.expansion, gen});
    const max = engine.stats(target)[0];
    const field = {defStealthRock: true, defSpikes: 3, defToxicSpikes: 2, defStickyWeb: true, defSteelsurge: true};
    const before = JSON.stringify({target, field});
    assert.deepEqual(plain(engine.entry(target, field)), {parts: []});
    const result = plain(engine.entry(target, field, 'def'));
    assert.deepEqual(result.parts, [
      {l: 'Stealth Rock', v: -Math.floor(max / 8)},
      ...(gen >= 8 ? [{l: 'Steelsurge', v: -Math.floor(max / 8)}] : []),
      {l: 'Spikes', v: -Math.floor(max / 4)},
    ]);
    assert.equal(result.status, 'tox');
    assert.equal(result.spe, gen >= 6 ? -1 : undefined);
    assert.equal(JSON.stringify({target, field}), before);
    for (const [layers, divisor] of [[1, 8], [2, 6], [3, 4]]) {
      assert.equal(engine.entry(target, {atkSpikes: layers}).parts[0].v, -Math.floor(max / divisor));
    }
    assert.equal(engine.entry(target, {atkToxicSpikes: 1}).status, 'psn');
    assert.equal(engine.entry({...target, st: 'brn'}, {atkToxicSpikes: 2}).status, undefined);
    assert.equal(engine.entry(set('Metagross'), {atkToxicSpikes: 2}).status, undefined);
    assert.equal(engine.entry(set('Gengar'), {atkToxicSpikes: 2}).status, undefined);
    assert.deepEqual(plain(engine.entry(set('Charizard'), {atkSpikes: 3, atkToxicSpikes: 2, atkStickyWeb: true})), {parts: []});
    assert.ok(engine.entry(set('Charizard'), {atkSpikes: 3, atkGrounded: true}).parts.length);
    assert.deepEqual(plain(engine.entry({...target, ab: fieldAbility('Levitate')}, {atkSpikes: 3})), {parts: []});
    assert.deepEqual(plain(engine.entry(target, {atkSpikes: 3, atkMagnetRise: true})), {parts: []});
    const charizard = set('Charizard');
    assert.equal(engine.entry(charizard, {atkStealthRock: true}).parts[0].v, -Math.floor(engine.stats(charizard)[0] / 2));
    if (gen >= 8) assert.deepEqual(plain(engine.entry({...target, it: 'Heavy-Duty Boots'}, field, 'def')), {parts: []});
    const guard = plain(engine.entry({...target, ab: fieldAbility('Magic Guard')}, field, 'def'));
    assert.deepEqual(guard.parts, []);
    assert.equal(guard.status, 'tox');
  }
});

await test('Protect admits only quarter-strength Z damage; residual immunity respects effective held items', () => {
  engine.init(fieldGuide, {...profiles.expansion, gen: 7, zmove: true, field: []});
  const attacker = set('Snorlax', {it: 'Electrium Z'});
  const defender = set('Blastoise');
  const z = slot('Thunderbolt', {z: true});
  const base = engine.calc(attacker, defender, z);
  const protectedZ = engine.calc(attacker, defender, z, {defProtect: true});
  assert.ok(protectedZ.min > 0);
  assert.deepEqual(plain(protectedZ.rolls), plain(base.rolls).map(value => Math.max(1, Math.floor(value / 4))));
  engine.init(fieldGuide, profiles.expansion);
  const band = set('Snorlax', {it: 'Binding Band'});
  const max = engine.stats(defender)[0];
  assert.equal(engine.residual(defender, {atkTrapped: true, magicRoom: true}, band)[0].v[0], -Math.floor(max / 8));
  const balloon = {...defender, it: 'Air Balloon'};
  assert.deepEqual(plain(engine.residual(balloon, {terrain: 'Grassy'})), []);
  assert.equal(engine.residual(balloon, {terrain: 'Grassy', magicRoom: true})[0].l, 'Grassy Terrain');
  assert.equal(engine.residual(balloon, {terrain: 'Grassy', atkGrounded: true})[0].l, 'Grassy Terrain');
  assert.deepEqual(plain(engine.residual(defender, {terrain: 'Grassy', atkTelekinesis: true})), []);
});

await test('entry immunity, grounding overrides and absolute Web stages do not invent reciprocal effects', () => {
  engine.init(fieldGuide, profiles.expansion);
  const field = {atkStickyWeb: true, atkToxicSpikes: 2};
  const boosted = set('Snorlax', {stg: [0, 0, 0, 0, 0, 5]});
  assert.equal(engine.entry(boosted, field).spe, -1);
  assert.equal(boosted.stg[5], 5);
  assert.equal(engine.entry({...boosted, ab: fieldAbility('Contrary')}, field).spe, 1);
  for (const name of ['Clear Body', 'White Smoke', 'Full Metal Body', 'Mirror Armor']) {
    assert.equal(engine.entry({...boosted, ab: fieldAbility(name)}, field).spe, undefined, name);
  }
  assert.equal(engine.entry({...boosted, it: 'Clear Amulet'}, field).spe, undefined);
  assert.equal(engine.entry({...boosted, ab: fieldAbility('Immunity')}, field).status, undefined);
  assert.equal(engine.entry({...boosted, ab: fieldAbility('Purifying Salt')}, field).status, undefined);
  assert.equal(engine.entry({...boosted, ab: fieldAbility('Comatose')}, field).status, undefined);
  assert.equal(engine.entry(boosted, {...field, terrain: 'Misty'}).status, undefined);
  assert.equal(engine.entry({...boosted, ab: fieldAbility('Leaf Guard')}, {...field, weather: 'Sun'}).status, undefined);
  assert.equal(engine.entry({...boosted, it: 'Heavy-Duty Boots', ab: fieldAbility('Klutz')}, field).spe, -1);
  assert.equal(engine.entry({...boosted, it: 'Heavy-Duty Boots'}, {...field, magicRoom: true}).spe, -1);
  assert.equal(engine.entry(set('Charizard', {it: 'Iron Ball'}), {...field, atkMagnetRise: true}).spe, -1);
  assert.equal(engine.entry(boosted, {...field, atkMagnetRise: true, gravity: true}).spe, -1);
  assert.equal(engine.entry(boosted, {...field, atkTelekinesis: true}).spe, undefined);
  const snapshot = JSON.stringify(field);
  engine.entry(set('Gengar'), field);
  assert.equal(JSON.stringify(field), snapshot, 'Poison entrants do not absorb layers');
  assert.equal(engine.entry(boosted, field).spe, -1, 'reapplication remains absolute');
});

await test('KO residuals read both cards and the defending field only', () => {
  engine.init(fieldGuide, profiles.expansion);
  const attacker = set('Snorlax', {it: 'Binding Band'});
  const defender = set('Blastoise');
  const active = engine.calc(attacker, defender, slot('Tackle'), {defTrapped: true});
  assert.deepEqual(plain(active.eot), [{l: 'Trapped', v: Array(4).fill(-Math.floor(engine.stats(defender)[0] / 6))}]);
  assert.equal(engine.calc(attacker, defender, slot('Tackle'), {atkTrapped: true}).eot, undefined);
  const seeded = engine.calc(attacker, defender, slot('Tackle'), {atkSeeded: true});
  assert.equal(seeded.eot[0].v[0], Math.floor(engine.stats(attacker)[0] / 8));
  const original = JSON.stringify({attacker, defender});
  engine.residual(defender, {defSeeded: true}, attacker, 'def');
  engine.speed(attacker, {atkSwamp: true});
  assert.equal(JSON.stringify({attacker, defender}), original);
});

await test('initialisation and calculations leave guide/profile inputs unchanged', () => {
  assert.equal(JSON.stringify({data, profiles}), unchanged);
});

const bundle = await readFile(new URL('template/calc/engine.js', root));
console.log(`engine.js: ${bundle.length} bytes; gzip ${gzipSync(bundle).length} bytes`);
console.log(`${passed} passed; ${failed} failed; ${parity} direct @smogon/calc parity cases`);
if (failed) process.exitCode = 1;

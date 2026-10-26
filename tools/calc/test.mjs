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
    const result = new Pokemon(gen, name, {
      level: config.lv, nature: config.nat, ability: guide.AB[config.ab]?.[0] || 'Guide no ability',
      item: config.it, status: config.st, abilityOn: !!config.abilityOn, ivs: statObject(config.iv, 31), evs: statObject(config.ev, 0),
      boosts: statObject(config.stg, 0), curHP: config.hp,
      overrides: {...original, name, baseStats: statObject(entry.s, 1), types: entry.t, nfe: !!entry.et.length, abilities: {0: ''}},
    });
    Object.assign(result.rawStats, config.raw || {});
    Object.assign(result.stats, config.raw || {});
    return result;
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
  const direct = atk.raw || def.raw ? profile.gen === 4 ? require('@smogon/calc/dist/mechanics/gen4').calculateDPP
    : profile.gen <= 6 ? require('@smogon/calc/dist/mechanics/gen56').calculateBWXY
      : require('@smogon/calc/dist/mechanics/gen789').calculateSMSSSV : calculate;
  return {result: direct(gen, attacker, defender, move, new Field(options)), attacker, defender};
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

await test('automatic entry: Protosynthesis and Quark Drive activate only with their trigger', () => {
  engine.init(data, profiles.expansion);
  const tusk = set('Great Tusk', {ab: ability('Protosynthesis')});
  const target = set('Blastoise');
  const damage = (user, field = {}) => engine.calc(user, target, slot('Earthquake'), field).max;
  const base = damage(tusk);
  assert.ok(damage(tusk, {weather: 'Sun'}) > base);
  assert.ok(damage({...tusk, it: 'Booster Energy'}) > base);
  assert.equal(damage(tusk, {weather: 'Rain'}), base);
  const quark = set('Iron Bundle', {ab: ability('Quark Drive'), ev: [0, 0, 0, 0, 0, 252]});
  assert.ok(engine.speed(quark, {terrain: 'Electric'}) > engine.speed(quark));
  assert.ok(engine.speed({...quark, it: 'Booster Energy'}) > engine.speed(quark));
});

await test('automatic entry: Intimidate reactions, marks, caps, off switch and speed never write input', () => {
  const guide = {...data, AB: [...data.AB, ['Guard Dog', ''], ['Mirror Armor', ''], ['Rattled', '']]};
  const ability = name => guide.AB.findIndex(entry => entry[0] === name);
  engine.init(guide, profiles.expansion);
  const holder = set('Gyarados', {ab: ability('Intimidate')});
  const target = name => set('Blastoise', {ab: ability(name)});
  for (const [name, mark] of [['Simple', -2], ['Contrary', 1], ['Defiant', 1], ['Guard Dog', 1],
    ['Clear Body', 0], ['White Smoke', 0], ['Full Metal Body', 0], ['Hyper Cutter', 0],
    ['Inner Focus', 0], ['Oblivious', 0], ['Own Tempo', 0], ['Scrappy', 0]]) {
    assert.equal(engine.intimidate(holder, target(name)).def, mark, name);
  }
  assert.deepEqual(plain(engine.intimidate(holder, target('Mirror Armor'))), {atk: -1, def: 0});
  assert.equal(engine.intimidate(holder, set('Blastoise', {it: 'Clear Amulet'})).def, 0);
  assert.equal(engine.intimidate({...holder, intim: false}, target('Simple')).def, 0);
  assert.equal(engine.intimidate({...holder, hp: 0}, target('Simple')).def, 0);
  for (const other of [target('Rattled'), set('Blastoise', {it: 'Adrenaline Orb'})]) {
    assert.ok(engine.speed(other, {}, 'def', holder) > engine.speed(other));
  }
  const inputs = JSON.stringify({holder, target: target('Competitive')});
  const result = engine.calc(holder, target('Competitive'), slot('Tackle'));
  assert.ok(result.pre.some(event => event.src === 'Intimidate' && event.by === -1));
  assert.ok(result.pre.some(event => event.src === 'Competitive' && event.stat === 'spa' && event.by === 2));
  assert.equal(JSON.stringify({holder, target: target('Competitive')}), inputs);
});

await test('automatic entry: generation defaults, setterStays and added crit stages', () => {
  for (const gen of [4, 5, 6, 7, 8, 9]) {
    engine.init(data, {...profiles.expansion, gen});
    assert.equal(engine.settings().setterStays, gen <= 5);
    const result = engine.calc(set('Blastoise'), set('Blastoise'), slot('Tackle'), {atkCritBonus: 1});
    assert.equal(result.crit.stage, 1);
    assert.equal(engine.calc(set('Blastoise'), set('Blastoise'), slot('Tackle'), {defCritBonus: 2}).crit.stage, 0);
    assert.equal(engine.calc(set('Blastoise'), set('Blastoise'), slot('Tackle'), {atkCritBonus: 99}).crit.stage,
      gen <= 5 ? 4 : 3);
  }
  engine.init(data, {...profiles.expansion, setterStays: true});
  assert.equal(engine.settings().setterStays, true);
});

const autoGuide = {...data, AB: [...data.AB, ...['Guard Dog', 'Mirror Armor', 'Rattled', 'Ripen', 'Cheek Pouch',
  'Anger Shell', 'Electromorphosis', 'Wind Power', 'Toxic Debris', 'Seed Sower', 'Sand Spit', 'Berserk',
  'Cotton Down', 'Chilling Neigh', 'Grim Neigh', 'As One (Glastrier)', 'As One (Spectrier)', 'Soul-Heart',
  'Snow Warning', 'Drought', 'Drizzle', 'Sand Stream', 'Desolate Land', 'Primordial Sea', 'Delta Stream',
  'Orichalcum Pulse', 'Hadron Engine', 'Electric Surge', 'Misty Surge', 'Grassy Surge', 'Psychic Surge',
  'Water Veil', 'Water Bubble', 'Thermal Exchange', 'Purifying Salt', 'Pastel Veil', 'Flower Veil', 'Leaf Guard',
  'Shields Down', 'Comatose', 'Klutz', 'Stamina', 'Water Compaction', 'Steam Engine', 'Justified',
  'Weak Armor', 'Anger Point'].map(name => [name, ''])]};
const autoSet = (name, ab, extra = {}) => set(name, {...extra, ab: autoGuide.AB.findIndex(entry => entry[0] === ab)});

await test('automatic derivation: all setters, effect aliases and profile Snow availability', () => {
  engine.init(autoGuide, profiles.expansion);
  for (const [ab, weather] of Object.entries({Drought: 'Sun', Drizzle: 'Rain', 'Sand Stream': 'Sand',
    'Snow Warning': 'Snow', 'Desolate Land': 'Harsh Sunshine', 'Primordial Sea': 'Heavy Rain',
    'Delta Stream': 'Strong Winds', 'Orichalcum Pulse': 'Sun'})) {
    const result = engine.derived(autoSet('Blastoise', ab));
    assert.equal(result.weather, weather);
    assert.equal(!!result.primal, ['Harsh Sunshine', 'Heavy Rain', 'Strong Winds'].includes(weather));
  }
  for (const [ab, terrain] of Object.entries({'Electric Surge': 'Electric', 'Hadron Engine': 'Electric',
    'Misty Surge': 'Misty', 'Grassy Surge': 'Grassy', 'Psychic Surge': 'Psychic'})) {
    assert.equal(engine.derived(autoSet('Blastoise', ab)).terrain, terrain);
  }
  engine.init(autoGuide, {...profiles.expansion, gen: 7});
  assert.equal(engine.derived(autoSet('Blastoise', 'Snow Warning')).weather, 'Snow');
  engine.init(autoGuide, {...profiles.gen7, gen: 9});
  assert.equal(engine.derived(autoSet('Blastoise', 'Snow Warning')).weather, 'Hail');
  engine.init(autoGuide, profiles.gen4);
  assert.deepEqual(plain(engine.derived(autoSet('Blastoise', 'Primordial Sea'))), {});
  assert.deepEqual(plain(engine.derived(autoSet('Blastoise', 'Electric Surge'))), {});
  engine.init(autoGuide, profiles.expansion);
  assert.deepEqual(plain(engine.derived(autoSet('Blastoise', 'Drought', {hp: 0}))), {});
  engine.init(autoGuide, {...profiles.expansion, over: {abilities: {Torrent: {effect: 'Drought'}},
    items: {'Custom Orb': {effect: 'Flame Orb'}}}});
  assert.deepEqual(plain(engine.derived(autoSet('Blastoise', 'Torrent', {it: 'Custom Orb'}))), {weather: 'Sun', status: 'brn'});
  engine.init(autoGuide, {...profiles.expansion, abilities: false, items: false});
  assert.deepEqual(plain(engine.derived(autoSet('Blastoise', 'Drought', {it: 'Flame Orb'}))), {});
});

await test('automatic derivation: Orb immunities, status precedence, used items and Magic Room', () => {
  engine.init(autoGuide, profiles.expansion);
  assert.equal(engine.derived(set('Blastoise', {it: 'Toxic Orb'})).status, 'tox');
  for (const name of ['Comatose', 'Purifying Salt', 'Water Veil', 'Water Bubble', 'Thermal Exchange']) {
    assert.equal(engine.derived(autoSet('Blastoise', name, {it: 'Flame Orb'})).status, undefined, name);
  }
  for (const name of ['Immunity', 'Pastel Veil']) assert.equal(engine.derived(autoSet('Blastoise', name, {it: 'Toxic Orb'})).status, undefined);
  for (const mon of [set('Charizard', {it: 'Flame Orb'}), set('Venusaur', {it: 'Toxic Orb'}),
    set('Metagross', {it: 'Toxic Orb'}), set('Blastoise', {it: 'Flame Orb', used: true}),
    set('Blastoise', {it: 'Flame Orb', st: 'par'}), set('Blastoise', {it: 'Flame Orb', hp: 0})]) {
    assert.equal(engine.derived(mon).status, undefined);
  }
  assert.equal(engine.derived(set('Blastoise', {it: 'Flame Orb'}), {terrain: 'Misty'}).status, undefined);
  assert.equal(engine.derived(set('Charizard', {it: 'Toxic Orb'}), {terrain: 'Misty'}).status, 'tox');
  assert.equal(engine.derived(set('Blastoise', {it: 'Flame Orb'}), {magicRoom: true}).status, undefined);
});

await test('automatic berries: generation fractions and thresholds, pinch stages and Lansat', () => {
  for (const gen of [4, 5, 6, 7, 8, 9]) {
    engine.init(autoGuide, {...profiles.expansion, gen});
    const max = engine.stats(set('Blastoise'))[0];
    const mon = it => set('Blastoise', {it, hp: Math.floor(max / 4)});
    assert.equal(engine.berry(mon('Sitrus Berry')).heal, Math.floor(max / 4), `Gen ${gen} Sitrus`);
    assert.equal(engine.berry(mon('Figy Berry')).heal, Math.floor(max * (gen === 7 ? 1 / 2 : gen >= 8 ? 1 / 3 : 1 / 8)));
    const threshold = Math.floor(max / (gen >= 7 ? 4 : 2));
    assert.equal(engine.berry(set('Blastoise', {it: 'Figy Berry', hp: threshold + 1})), null);
    for (const [it, stat] of [['Liechi', 1], ['Ganlon', 2], ['Petaya', 3], ['Apicot', 4], ['Salac', 5]]) {
      assert.equal(engine.berry(mon(`${it} Berry`)).atk.stg[stat], 1);
    }
    assert.equal(engine.berry(mon('Lansat Berry')).atk.toggles.Focus, true);
  }
});

await test('automatic berries: aliases, custom fractions, Ripen, Cheek Pouch, Gluttony, suppression', () => {
  engine.init(autoGuide, {...profiles.expansion, over: {items: {'Custom Berry': {effect: 'Sitrus Berry', heal: 0.5, threshold: 0.75}}}});
  const max = engine.stats(set('Blastoise'))[0];
  assert.equal(engine.berry(set('Blastoise', {it: 'Custom Berry', hp: 50})).heal, Math.floor(max / 2));
  engine.init(autoGuide, {...profiles.expansion, over: {items: {'Sitrus Berry': {heal: 0}}}});
  assert.equal(engine.berry(set('Blastoise', {it: 'Sitrus Berry', hp: 1})), null);
  engine.init(autoGuide, profiles.expansion);
  assert.equal(engine.berry(autoSet('Blastoise', 'Ripen', {it: 'Sitrus Berry', hp: 1})).heal, Math.floor(max / 4) * 2);
  assert.equal(engine.berry(autoSet('Blastoise', 'Ripen', {it: 'Salac Berry', hp: 1})).atk.stg[5], 2);
  assert.equal(engine.berry(autoSet('Blastoise', 'Cheek Pouch', {it: 'Sitrus Berry', hp: 1})).heal, Math.floor(max / 4) + Math.floor(max / 3));
  assert.ok(engine.berry(autoSet('Blastoise', 'Gluttony', {it: 'Salac Berry', hp: Math.floor(max / 2)})));
  const mon = set('Blastoise', {it: 'Sitrus Berry', hp: 1});
  assert.equal(engine.berry({...mon, used: true}), null);
  assert.equal(engine.berry(mon, {}, autoSet('Blastoise', 'Unnerve')), null);
  assert.equal(engine.berry(mon, {magicRoom: true}), null);
  assert.equal(engine.berry(autoSet('Blastoise', 'Klutz', mon)), null);
  const result = engine.berry(autoSet('Blastoise', 'Unburden', mon));
  assert.ok(engine.speed({...mon, ab: ability('Unburden'), ...result.atk}) > engine.speed({...mon, ab: ability('Unburden')}));
});

await test('automatic hit: Sash, Sturdy, exact-damage mode and attacker KO boosts', () => {
  engine.init(autoGuide, profiles.expansion);
  const user = set('Blastoise');
  const selected = slot('Tackle', {bp: 10000});
  const target = set('Blastoise', {it: 'Focus Sash'});
  assert.equal(engine.hit(user, target, selected).def.hp, 1);
  assert.equal(engine.hit(user, target, selected).def.used, true);
  assert.equal(engine.hit(user, {...target, used: true}, selected).def.hp, 0);
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Sturdy'), selected).def.hp, 1);
  assert.equal(engine.hit(autoSet('Blastoise', 'Mold Breaker'), autoSet('Blastoise', 'Sturdy'), selected).def.hp, 0);
  assert.equal(engine.hit(user, target, selected, {}, 'max', {damage: 10000}).def.hp, 0);
  assert.equal(engine.hit(user, target, {...selected, hits: 2}).def.hp, 0);
  for (const [ab, stat] of [['Moxie', 1], ['Chilling Neigh', 1], ['As One (Glastrier)', 1],
    ['Grim Neigh', 3], ['As One (Spectrier)', 3], ['Soul-Heart', 3], ['Beast Boost', 4]]) {
    assert.equal(engine.hit(autoSet('Blastoise', ab), user, selected).atk.stg[stat], 1, ab);
  }
  assert.equal(engine.hit(autoSet('Blastoise', 'Moxie'), user, selected, {}, 'max', {damage: 10000}).atk.stg, undefined);
  assert.throws(() => engine.hit(user, target, selected, {}, 'median'));
  assert.throws(() => engine.hit(user, target, selected, {}, 'max', {damage: -1}));
});

await test('automatic hit: chosen roll each hit, scaling, Parental Bond and between-hit defenses', () => {
  engine.init(autoGuide, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Blissey', {ev: [252, 0, 252, 0, 0, 0]});
  for (const selected of [slot('Tackle', {hits: 3}), slot('Triple Axel'), slot('Triple Kick')]) {
    for (const roll of ['min', 'max']) {
      const result = engine.calc(user, target, selected);
      const damage = (result.per || Array(result.hits).fill(result.rolls)).reduce((total, values) => total + (roll === 'min' ? Math.min(...values) : Math.max(...values)), 0);
      assert.equal(engine.hit(user, target, selected, {}, roll).dealt, Math.min(engine.stats(target)[0], damage));
    }
  }
  const parent = autoSet('Blastoise', 'Parental Bond');
  const result = engine.calc(parent, target, slot('Tackle'));
  assert.equal(engine.hit(parent, target, slot('Tackle')).dealt, result.per.reduce((total, values) => total + Math.max(...values), 0));
  const normalMulti = engine.calc(parent, target, slot('Tackle', {hits: 2}));
  assert.equal(engine.hit(parent, target, slot('Tackle', {hits: 2})).dealt, normalMulti.max * 2);
  const stamina = autoSet('Blissey', 'Stamina', target);
  const many = slot('Tackle', {hits: 3});
  const boosted = engine.calc(user, stamina, many);
  assert.equal(engine.hit(user, stamina, many).dealt, boosted.per.reduce((sum, rolls) => sum + Math.max(...rolls), 0));
  assert.equal(engine.hit(user, stamina, many).def.stg[2], 3);
});

await test('automatic hit: item use, thresholds, Berserk before single-hit berries and exact-only reactions', () => {
  engine.init(autoGuide, profiles.expansion);
  const user = set('Blastoise');
  const selected = slot('Tackle');
  assert.equal(engine.hit({...user, it: 'Normal Gem'}, user, selected).atk.used, true);
  assert.equal(engine.hit(user, {...user, it: 'Air Balloon'}, selected).def.used, true);
  const max = engine.stats(user)[0];
  const exact = (target, damage) => engine.hit(user, target, selected, {}, 'max', {damage});
  assert.equal(exact({...user, it: 'Sitrus Berry'}, max - 1).def.hp, 1 + Math.floor(max / 4));
  assert.equal(exact({...user, it: 'Sitrus Berry', hp: 1}, 0).def.hp, 1 + Math.floor(max / 4));
  const berserk = autoSet('Blastoise', 'Berserk');
  assert.equal(exact(berserk, Math.ceil(max / 2)).def.stg[3], 1);
  assert.equal(exact({...berserk, it: 'Sitrus Berry'}, Math.ceil(max / 2)).def.stg[3], 1);
  const shell = exact(autoSet('Blastoise', 'Anger Shell'), Math.ceil(max / 2));
  assert.deepEqual(plain(shell.def.stg), [0, 1, -1, 1, -1, 1]);
  assert.equal(exact(autoSet('Blastoise', 'Stamina', {it: 'Air Balloon'}), 10).def.used, undefined);
  assert.equal(exact(autoSet('Blastoise', 'Stamina'), 10).def.stg, undefined);
});

await test('automatic hit: defensive items and abilities, field setters, suppression and aliases', () => {
  engine.init(autoGuide, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Blastoise');
  const selected = (type = 'Normal', extra = {}) => slot('Tackle', {bp: 1, t: type, ...extra});
  for (const [ab, type, stat, by] of [['Stamina', 'Normal', 2, 1], ['Water Compaction', 'Water', 2, 2],
    ['Justified', 'Dark', 1, 1], ['Weak Armor', 'Normal', 5, 2], ['Steam Engine', 'Fire', 5, 6],
    ['Rattled', 'Ghost', 5, 1], ['Anger Point', 'Normal', 1, 6]]) {
    assert.equal(engine.hit(user, autoSet('Blastoise', ab), selected(type, {crit: ab === 'Anger Point'})).def.stg[stat], by, ab);
  }
  for (const [it, type, stat, by] of [['Weakness Policy', 'Electric', 1, 2], ['Kee Berry', 'Normal', 2, 1],
    ['Luminous Moss', 'Water', 4, 1], ['Absorb Bulb', 'Water', 3, 1], ['Cell Battery', 'Electric', 1, 1],
    ['Snowball', 'Ice', 1, 1]]) {
    const action = engine.hit(user, {...target, it}, selected(type));
    assert.equal(action.def.used, true, it);
    assert.equal(action.def.stg[stat], by, it);
  }
  assert.equal(engine.hit(user, {...target, it: 'Maranga Berry'}, slot('Water Gun', {bp: 1})).def.stg[4], 1);
  assert.equal(engine.hit(user, {...target, it: 'Wacan Berry'}, selected('Electric')).def.used, true);
  assert.equal(engine.hit(autoSet('Blastoise', 'Unnerve'), {...target, it: 'Wacan Berry'}, selected('Electric')).def.used, undefined);
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Seed Sower'), selected()).field.terrain, 'Grassy');
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Sand Spit'), selected()).field.weather, 'Sand');
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Toxic Debris'), selected('Normal', {hits: 3})).field.hazards.atkToxicSpikes, 2);
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Electromorphosis'), selected()).def.toggles.Charge, true);
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Wind Power'), slot('Gust', {bp: 1})).def.toggles.Charge, true);
  assert.equal(engine.hit(user, autoSet('Blastoise', 'Cotton Down'), selected()).atk.stg[5], -1);
  engine.init(autoGuide, {...profiles.expansion, over: {abilities: {Torrent: {effect: 'Moxie'}}, items: {'Custom Policy': {effect: 'Weakness Policy'}}}});
  assert.equal(engine.hit(autoSet('Blastoise', 'Torrent'), target, selected('Normal', {bp: 10000})).atk.stg[1], 1);
  assert.equal(engine.hit(user, {...target, it: 'Custom Policy'}, selected('Electric')).def.stg[1], 2);
});

await test('automatic hit: reactions respect stage caps, used seeds, weather and item use on later hits', () => {
  engine.init(autoGuide, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Blissey', {ev: [252, 0, 252, 0, 0, 0]});
  const selected = slot('Tackle', {bp: 10, hits: 2});
  const seed = engine.hit({...user, it: 'Electric Seed'}, target, selected, {terrain: 'Electric'});
  assert.equal(seed.atk.used, true);
  assert.equal(seed.atk.stg[2], 1);
  assert.equal(engine.hit({...user, it: 'Electric Seed'}, target, slot('Seismic Toss'), {terrain: 'Electric'}).atk.used, true);
  const intimidation = autoSet('Blastoise', 'Intimidate');
  assert.equal(engine.hit(intimidation, {...target, it: 'Electric Seed'}, selected, {terrain: 'Electric'}).def.stg[1], 0);
  const berserk = autoSet('Blissey', 'Berserk', {...target, it: 'Sitrus Berry'});
  const max = engine.stats(berserk)[0];
  const hit = engine.hit(user, {...berserk, hp: Math.floor(max / 2) + 1}, slot('Tackle', {bp: 1, hits: 2}));
  assert.equal(hit.def.used, true);
  assert.equal(hit.def.stg, undefined, 'multi-hit berry heals above Berserk threshold before end-of-move check');
  const orb = set('Blastoise', {it: 'Adrenaline Orb', ab: autoGuide.AB.findIndex(entry => entry[0] === 'Rattled')});
  assert.equal(engine.speed(orb, {}, 'def', intimidation), engine.speed({...orb, stg: [0, 0, 0, 0, 0, 2]}));
  assert.equal(engine.intimidate(intimidation, {...user, stg: [0, -6, 0, 0, 0, 0]}).def, 0);
  assert.equal(engine.intimidate(intimidation, autoSet('Blastoise', 'Defiant', {stg: [0, -6, 0, 0, 0, 0]})).def, 0);
});

await test('automatic turn: ordered residuals, fainting, Speed Boost, one berry, side and purity', () => {
  engine.init(autoGuide, profiles.expansion);
  const mon = autoSet('Blastoise', 'Speed Boost', {it: 'Sitrus Berry', hp: 70, st: 'brn'});
  const field = {};
  const snapshot = JSON.stringify({mon, field});
  const action = engine.turn(mon, field, null, 'def');
  assert.equal(action.def.used, true);
  assert.equal(action.def.stg[5], 1);
  assert.equal(action.def.hp, mon.hp + action.parts[0].v[0] + Math.floor(engine.stats(mon)[0] / 4));
  assert.equal(engine.turn({...mon, hp: 1}).atk.hp, 0);
  assert.equal(engine.turn({...mon, hp: 1}).atk.stg, undefined);
  assert.equal(engine.turn({...mon, used: true}).atk.used, undefined);
  engine.hit(set('Blastoise'), mon, slot('Tackle'));
  assert.equal(JSON.stringify({mon, field}), snapshot);
});

await test('automatic KO: full-HP single-hit Sash/Sturdy and one healing berry', () => {
  engine.init(autoGuide, profiles.expansion);
  const mon = set('Blastoise');
  const selected = slot('Tackle', {bp: 10000});
  for (const target of [{...mon, it: 'Focus Sash'}, autoSet('Blastoise', 'Sturdy')]) {
    const result = engine.calc(mon, target, selected);
    assert.equal(result.ko.n, 2);
    assert.equal(result.ko.p, 1);
    assert.ok(result.notes.includes(target.it ? 'Sash' : 'Sturdy'));
    assert.equal(engine.calc(mon, {...target, hp: 1}, selected).ko.n, 1);
  }
  assert.equal(engine.calc(mon, {...mon, it: 'Focus Sash'}, {...selected, hits: 2}).ko.n, 1);
  const berry = engine.calc({...mon, lv: 60}, {...mon, it: 'Sitrus Berry'}, slot('Seismic Toss'));
  assert.equal(berry.ko.n, 4);
  assert.ok(berry.notes.includes('after Sitrus'));
  assert.equal(engine.calc({...mon, lv: 60}, {...mon, it: 'Sitrus Berry', used: true}, slot('Seismic Toss')).ko.n, 3);
});

await test('A2 Stockpile powers and healing default, clamp and typed power', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise');
  const max = engine.stats(user)[0];
  for (const [count, power, fraction] of [[undefined, 100, 4], [0, 100, 4], [1, 100, 4], [2, 200, 2], [3, 300, 1], [9, 300, 1]]) {
    assert.equal(engine.calc(user, user, slot('Spit Up', {st: count})).bp, power);
    assert.equal(engine.hp(user, user, slot('Swallow', {st: count})).v, Math.floor(max / fraction));
  }
  assert.equal(engine.calc(user, user, slot('Spit Up', {st: 3, bp: 42})).bp, undefined);
  assert.deepEqual(plain(engine.calc(user, user, slot('Spit Up', {st: 3, bp: 42})).rolls),
    plain(engine.calc(user, user, slot('Spit Up', {st: 1, bp: 42})).rolls));
});

await test('A2 crit fields: Laser Focus, Lucky Chant, Dragon Cheer and Focus exclusion', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise');
  const selected = slot('Tackle');
  const crit = (field, atk = user, def = user) => plain(engine.calc(atk, def, selected, field).crit);
  assert.equal(crit({atkLaserFocus: true}).forced, true);
  assert.equal(crit({defLaserFocus: true}).forced, false);
  assert.equal(crit({atkLaserFocus: true, defLuckyChant: true}).p, 0);
  assert.equal(crit({defLuckyChant: true}, {...user, ab: ability('Mold Breaker')}).p, 0);
  assert.equal(crit({atkLuckyChant: true, atkLaserFocus: true}).p, 1);
  assert.equal(crit({atkDragonCheer: true}).stage, 0);
  assert.equal(crit({gameType: 'Doubles', atkDragonCheer: true}).stage, 1);
  assert.equal(crit({gameType: 'Doubles', atkDragonCheer: true}, set('Dragonite')).stage, 2);
  assert.equal(crit({gameType: 'Doubles', atkDragonCheer: true, atkFocus: true}).stage, 2);
  assert.equal(crit({atkLaserFocus: true}, user, {...user, ab: ability('Battle Armor')}).p, 0);
  engine.init(data, profiles.gen6);
  assert.equal(crit({atkLaserFocus: true}).forced, false);
  assert.equal(crit({gameType: 'Doubles', atkDragonCheer: true}).stage, 0);
});

await test('A2 Lucky Chant also blocks stock always-crit fallback without MV crit data', () => {
  const fallback = {...data, MV: data.MV.map(entry => entry ? {...entry, cr: 0} : entry)};
  engine.init(fallback, profiles.expansion);
  const user = set('Blastoise');
  const selected = slot('Storm Throw');
  assert.equal(engine.calc(user, user, selected).crit.forced, true);
  const result = engine.calc(user, user, selected, {defLuckyChant: true});
  assert.equal(result.crit.p, 0);
  assert.equal(result.notes.includes('Crit'), false);
});

await test('A2 Foul Play reads target stages and changes between Parental Bond hits', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Blastoise', {stg: [0, 2, 0, 0, 0, 0]});
  const selected = slot('Foul Play');
  assert.ok(engine.calc(user, target, selected).max > engine.calc(user, user, selected).max);
  assert.deepEqual(plain(engine.calc({...user, stg: [0, 4, 0, 0, 0, 0]}, target, selected).rolls),
    plain(engine.calc(user, target, selected).rolls));
  assert.deepEqual(plain(engine.calc({...user, ab: ability('Intimidate')}, target, selected).rolls),
    plain(engine.calc(user, {...target, stg: [0, 1, 0, 0, 0, 0]}, selected).rolls));
  for (const extra of [{ab: ability('Justified')}, {it: 'Weakness Policy', pty: 'Ghost', ab: ability('Protean')}]) {
    const parent = {...user, ab: ability('Parental Bond')};
    const foe = {...target, ...extra};
    const result = engine.calc(parent, foe, selected);
    const unchanged = engine.calc(parent, {...foe, ab: -1, it: ''}, selected);
    assert.ok(result.per[1][15] > unchanged.per[1][15]);
    const action = engine.hit(parent, foe, selected);
    assert.equal(action.dealt, Math.min(engine.stats(foe)[0], result.max + result.per[1][15]));
  }
});

await test('A2 Disguise absorbs once, later hits land, bust HP is not dealt or drain', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Mimikyu', {ab: ability('Disguise')});
  const max = engine.stats(target)[0];
  const loss = Math.floor(max / 8);
  const selected = slot('Thunder Punch');
  const result = engine.calc(user, target, selected);
  assert.equal(result.max, 0);
  assert.equal(result.eff, 1);
  assert.deepEqual(plain(result.bust), {ability: 'Disguise', loss});
  assert.equal(engine.hit(user, target, selected).def.hp, max - loss);
  assert.equal(engine.hit(user, target, selected).def.broken, true);
  assert.equal(engine.hit(user, target, selected).dealt, 0);
  assert.ok(engine.calc(user, {...target, broken: true}, selected).max > 0);
  assert.equal(engine.calc(user, target, slot('Tackle')).bust, undefined);
  assert.equal(engine.calc(user, target, selected, {defProtect: true}).bust, undefined);
  assert.equal(engine.calc({...user, ab: ability('Mold Breaker')}, target, selected).bust, undefined);
  assert.equal(engine.hit(user, target, selected, {}, 'max', {damage: 1}).def.broken, undefined);
  const multi = engine.calc(user, target, {...selected, hits: 2});
  const broken = engine.calc(user, {...target, broken: true}, selected);
  assert.deepEqual(plain(multi.per[0]), Array(16).fill(0));
  assert.deepEqual(plain(multi.per[1]), plain(broken.rolls));
  assert.equal(multi.pmax, broken.pmax);
  const action = engine.hit(user, target, {...selected, hits: 2});
  assert.ok(action.log[0].startsWith('Disguise: broken'));
  assert.equal(action.dealt, Math.min(max - loss, broken.max));
  assert.equal(action.def.hp, Math.max(0, max - loss - broken.max));
  assert.equal(action.hits, 1);
  assert.equal(engine.hp(user, target, slot('Draining Kiss'), {}, 100), null);
  assert.equal(engine.calc(user, target, slot('Night Shade')).max, 0);
  assert.equal(engine.calc(user, {...target, hp: 1}, selected).ko.n, 1);
  assert.equal(engine.hit(user, {...target, hp: 1}, selected).dealt, 0);
  engine.init(data, profiles.gen7);
  assert.equal(engine.calc(user, target, selected).bust.loss, 0);
  assert.equal(engine.hit(user, target, selected).def.hp, max);
  assert.equal(engine.calc(user, {...target, hp: 1}, selected).ko.n, 2);
  engine.init(data, profiles.gen6);
  assert.ok(engine.calc(user, target, selected).max > 0);
});

await test('A2 Disguise Parental Bond, berries after bust, and delayed resist berry', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise', {ab: ability('Parental Bond')});
  const target = set('Mimikyu', {ab: ability('Disguise')});
  const selected = slot('Thunder Punch');
  const result = engine.calc(user, target, selected);
  const broken = engine.calc(user, {...target, broken: true}, selected);
  assert.equal(result.hits, 2);
  assert.deepEqual(plain(result.per[1]), plain(broken.per[1]));
  const max = engine.stats(target)[0];
  const hp = Math.floor(max / 2) + 1;
  const action = engine.hit({...user, ab: -1}, {...target, hp, it: 'Sitrus Berry'}, selected);
  assert.equal(action.def.used, true);
  assert.equal(action.def.hp, hp - Math.floor(max / 8) + Math.floor(max / 4));
  assert.equal(action.dealt, 0);
  const foe = {...target, it: 'Babiri Berry'};
  const steel = slot('Iron Head', {hits: 2});
  const protectedHit = engine.calc({...user, ab: -1}, foe, steel);
  const one = engine.calc({...user, ab: -1}, {...foe, broken: true}, {...steel, hits: 1});
  assert.deepEqual(plain(protectedHit.per[1]), plain(one.rolls));
  assert.equal(engine.hit({...user, ab: -1}, foe, steel).def.used, true);
});

await test('A2 Ice Face blocks physical only, explicit form state and weather re-entry', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Eiscue (Ice)', {ab: ability('Ice Face')});
  const selected = slot('Tackle');
  assert.equal(engine.calc(user, target, selected).max, 0);
  assert.equal(engine.hit(user, target, selected).def.hp, engine.stats(target)[0]);
  assert.equal(engine.hit(user, target, selected).def.broken, true);
  assert.ok(engine.calc(user, target, slot('Water Gun')).max > 0);
  assert.ok(engine.calc(user, {...target, broken: true}, selected).max > 0);
  const noice = set('Eiscue (Noice)', {ab: ability('Ice Face')});
  assert.ok(engine.calc(user, noice, selected).max > 0);
  assert.equal(engine.calc(user, {...noice, broken: false}, selected).max, 0);
  assert.equal(engine.derived({...target, broken: true}, {weather: 'Snow'}).restore, true);
  assert.equal(engine.derived(noice, {weather: 'Snow'}).restore, true);
  assert.equal(engine.derived({...target, broken: true}).restore, undefined);
  assert.equal(engine.derived({...target, broken: true, hp: 0}, {weather: 'Snow'}).restore, undefined);
  assert.equal(engine.derived({...target, broken: true}, {weather: 'Snow'}, {...user, ab: ability('Cloud Nine')}).restore, undefined);
  engine.init(data, {...profiles.gen7, gen: 9});
  assert.equal(engine.derived({...target, broken: true}, {weather: 'Hail'}).restore, true);
});

await test('A2 contact costs per damaging hit including Parental Bond, exact hit report only', () => {
  engine.init({...data, AB: [...data.AB, ['Long Reach', '']]}, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Blissey', {it: 'Rocky Helmet', ab: ability('Rough Skin')});
  const max = engine.stats(user)[0];
  const cost = Math.floor(max / 6) + Math.floor(max / 8);
  const selected = slot('Tackle');
  assert.equal(engine.hp(user, target, selected, {}, 10).v, -cost);
  assert.equal(engine.hp(user, target, {...selected, hits: 3}, {}, 30).v, -cost * 3);
  assert.equal(engine.hp(user, target, {...selected, hits: 3}, {}, 30, {hits: 1}).v, -cost);
  assert.equal(engine.hp({...user, ab: ability('Parental Bond')}, target, selected, {}, 30).v, -cost * 2);
  const action = engine.hit(user, target, {...selected, hits: 3});
  assert.equal(action.hits, 3);
  assert.equal(action.contact.v, -cost * 3);
  assert.equal(action.contact.parts.length, 6);
  assert.equal(action.atk.hp, undefined);
  assert.equal(engine.hit(user, target, selected, {}, 'max', {damage: 10}).contact, undefined);
  assert.equal(engine.hit(user, {...target, hp: 1}, {...selected, hits: 3}).hits, 1);
  assert.equal(engine.hp(user, target, slot('Water Gun'), {}, 30), null);
  assert.equal(engine.hp(user, target, selected, {}, 0), null);
  for (const extra of [{ab: ability('Magic Guard')}, {ab: data.AB.length}, {it: 'Protective Pads'}]) {
    assert.equal(engine.hp({...user, ...extra}, target, selected, {}, 30), null);
  }
  assert.equal(engine.hp({...user, it: 'Punching Glove'}, target, slot('Thunder Punch'), {}, 30), null);
  assert.equal(engine.hp({...user, it: 'Punching Glove'}, target, selected, {}, 30).v, -cost);
  assert.equal(engine.hp(user, {...target, used: true}, selected, {}, 30).v, -Math.floor(max / 8));
  assert.equal(engine.hp(user, target, selected, {magicRoom: true}, 30).v, -Math.floor(max / 8));
  assert.equal(engine.hp(user, {...target, ab: ability('Iron Barbs')}, selected, {}, 30).v, -cost);
  engine.init(data, profiles.gen4);
  assert.equal(engine.hp(user, target, selected, {}, 30).v, -Math.floor(max / 8));
});

await test('A2 crash previews are separate misses, generation-aware and Magic Guard safe', () => {
  engine.init(data, profiles.expansion);
  const user = set('Blastoise');
  const target = set('Blissey');
  const max = engine.stats(user)[0];
  for (const name of ['Jump Kick', 'High Jump Kick', 'Axe Kick', 'Supercell Slam']) {
    assert.deepEqual(plain(engine.hp(user, target, slot(name), {}, 100, {miss: true})),
      {v: -Math.floor(max / 2), l: 'miss', crash: Math.floor(max / 2)});
    assert.equal(engine.hp({...user, ab: ability('Magic Guard')}, target, slot(name), {}, 100, {miss: true}).v, 0);
  }
  assert.equal(engine.hp(user, target, slot('Tackle'), {}, 100, {miss: true}), null);
  engine.init(data, profiles.gen4);
  assert.equal(engine.hp(user, target, slot('High Jump Kick'), {}, 0, {miss: true, damage: 40}).crash, 20);
  assert.equal(engine.hp(user, target, slot('High Jump Kick'), {}, 0, {miss: true, damage: 10000}).crash,
    Math.floor(engine.stats(target)[0] / 2));
  const ghost = set('Gengar');
  assert.equal(engine.hp(user, ghost, slot('High Jump Kick'), {}, 0, {miss: true}).crash,
    Math.floor(engine.stats(ghost)[0] / 2));
});

await test('A3 ally effects: stock parity, side ownership, Singles exclusion and no Ruin stacking', () => {
  engine.init(data, profiles.expansion);
  const user = set('Snorlax'), target = set('Blissey');
  for (const [key, move, weather, scope] of [
    ['PowerSpot', 'Tackle', '', 'side'], ['SteelySpirit', 'Iron Head', '', 'side'],
    ['FlowerGift', 'Tackle', 'Sun', 'side'], ['FairyAura', 'Moonblast', '', 'aura'],
    ['DarkAura', 'Dark Pulse', '', 'aura'], ['TabletsOfRuin', 'Tackle', '', 'ruin'],
    ['SwordOfRuin', 'Tackle', '', 'ruin'], ['VesselOfRuin', 'Flamethrower', '', 'ruin'],
    ['BeadsOfRuin', 'Flamethrower', '', 'ruin'],
  ]) {
    const selected = slot(move), toggle = (scope === 'aura' ? 'ally' : 'atk') + key;
    const field = {gameType: 'Doubles', weather, [toggle]: true};
    const options = {gameType: 'Doubles', weather, ...(scope === 'side'
      ? {attackerSide: {['is' + key]: true}} : {['is' + key]: true})};
    assert.deepEqual(plain(engine.calc(user, target, selected, field).rolls),
      distributions(reference(user, target, selected, options).result.damage, 1)[0], key);
    assert.deepEqual(engine.calc(user, target, selected, {...field, gameType: 'Singles'}).rolls,
      engine.calc(user, target, selected, {weather}).rolls, key + ' Singles');
    if (scope === 'side' && key !== 'FlowerGift') assert.deepEqual(
      engine.calc(user, target, selected, {gameType: 'Doubles', ['def' + key]: true}).rolls,
      engine.calc(user, target, selected, {gameType: 'Doubles'}).rolls);
    if (scope !== 'side') assert.deepEqual(plain(engine.calc(target, user, selected, field).rolls),
      distributions(reference(target, user, selected, options).result.damage, 1)[0], key + ' reverse');
    if (scope === 'ruin') {
      assert.deepEqual(engine.calc(user, target, selected, {...field, ['def' + key]: true}).rolls,
        engine.calc(user, target, selected, field).rolls);
      assert.deepEqual(engine.calc(user, target, selected, {gameType: 'Doubles', ['def' + key]: true}).rolls,
        engine.calc(user, target, selected, field).rolls);
    }
  }
  assert.deepEqual(plain(engine.calc(user, target, slot('Moonblast'),
    {gameType: 'Doubles', allyFairyAura: true, allyAuraBreak: true}).rolls),
  distributions(reference(user, target, slot('Moonblast'),
    {gameType: 'Doubles', isFairyAura: true, isAuraBreak: true}).result.damage, 1)[0]);
  assert.deepEqual(plain(engine.calc(user, target, slot('Flamethrower'),
    {gameType: 'Doubles', weather: 'Sun', defFlowerGift: true}).rolls),
  distributions(reference(user, target, slot('Flamethrower'),
    {gameType: 'Doubles', weather: 'Sun', defenderSide: {isFlowerGift: true}}).result.damage, 1)[0]);
  const holder = {...user, ab: ability('Tablets of Ruin')};
  assert.deepEqual(engine.calc(holder, target, slot('Tackle'), {gameType: 'Doubles', atkTabletsOfRuin: true}).rolls,
    engine.calc(holder, target, slot('Tackle'), {gameType: 'Doubles'}).rolls);
});

await test('A3 Plus/Minus and Power Trick: all generations, saved stats unchanged', () => {
  for (const profile of [profiles.gen4, profiles.gen5, profiles.gen6, profiles.gen7, profiles.expansion]) {
    engine.init(data, profile);
    const target = set('Blissey');
    for (const name of ['Plus', 'Minus']) {
      const user = set('Snorlax', {ab: ability(name)}), selected = slot('Flamethrower');
      assert.deepEqual(plain(engine.calc(user, target, selected, {gameType: 'Doubles', atkPlusMinus: true}).rolls),
        distributions(reference({...user, abilityOn: true}, target, selected, {gameType: 'Doubles'}, profile).result.damage, 1)[0]);
      assert.deepEqual(engine.calc(user, target, selected, {atkPlusMinus: true}).rolls,
        engine.calc(user, target, selected, {}).rolls);
    }
    const user = set('Shuckle'), selected = slot('Tackle'), before = engine.stats(user);
    for (const side of ['atk', 'def']) assert.deepEqual(
      plain(engine.calc(user, target, selected, {[side + 'PowerTrick']: true}).rolls),
      distributions(reference(user, target, selected,
        {[side === 'atk' ? 'attackerSide' : 'defenderSide']: {isPowerTrick: true}}, profile).result.damage, 1)[0]);
    assert.deepEqual(engine.stats(user), before);
  }
});

await test('A3 sports: Gen 4 halves BP, Gen 5+ chains 1352, type override and Technician', () => {
  for (const profile of [profiles.gen4, profiles.gen5, profiles.gen6, profiles.gen7, profiles.expansion]) {
    engine.init(data, profile);
    const user = set('Snorlax'), target = set('Blissey');
    for (const [key, type] of [['waterSport', 'Fire'], ['mudSport', 'Electric']]) {
      const selected = slot('Tackle', {bp: 101, t: type});
      const power = profile.gen === 4 ? 50 : 33;
      for (const [attacker, defender] of [[user, target], [target, user]]) {
        assert.deepEqual(engine.calc(attacker, defender, selected, {[key]: true}).rolls,
          engine.calc(attacker, defender, {...selected, bp: power}, {}).rolls);
      }
      assert.deepEqual(engine.calc(user, target, slot('Tackle'), {[key]: true}).rolls,
        engine.calc(user, target, slot('Tackle'), {}).rolls);
      assert.ok(engine.calc(user, target, selected, {[key]: true}).notes.includes(key === 'waterSport' ? 'Water Sport' : 'Mud Sport'));
      const tech = {...user, ab: ability('Technician')};
      assert.deepEqual(engine.calc(tech, target, slot('Tackle', {bp: 100, t: type}), {[key]: true}).rolls,
        engine.calc(user, target, slot('Tackle', {bp: profile.gen === 4 ? 50 : 33, t: type}), {}).rolls);
    }
    assert.deepEqual(engine.calc(user, target, slot('Thunderbolt'), {mudSport: true, waterSport: true}).rolls,
      engine.calc(user, target, slot('Thunderbolt'), {mudSport: true}).rolls);
    assert.deepEqual(engine.calc(user, target, slot('Seismic Toss'), {waterSport: true, mudSport: true}).rolls,
      engine.calc(user, target, slot('Seismic Toss'), {}).rolls);
  }
});

await test('A3 Gen 4 sport rounding is before Blaze and Dry Skin, after Technician and held power', () => {
  engine.init(data, profiles.gen4);
  const user = set('Snorlax', {hp: 1, ab: ability('Blaze')}), target = set('Blissey');
  const selected = slot('Tackle', {bp: 47, t: 'Fire'});
  assert.deepEqual(engine.calc(user, target, selected, {waterSport: true}).rolls,
    engine.calc({...user, ab: -1}, target, {...selected, bp: 34}, {}).rolls);
  assert.deepEqual(engine.calc({...user, ab: -1}, {...target, ab: ability('Dry Skin')}, selected, {waterSport: true}).rolls,
    engine.calc({...user, ab: -1}, target, {...selected, bp: 28}, {}).rolls);
  assert.deepEqual(engine.calc({...user, ab: ability('Technician'), it: 'Charcoal'}, target,
    {...selected, bp: 49}, {waterSport: true}).rolls,
  engine.calc({...user, ab: -1}, target, {...selected, bp: 43}, {}).rolls);
});

await test('A3 splits: floor raw averages before stages, both directions, special stat users and purity', () => {
  for (const profile of [profiles.gen5, profiles.gen6, profiles.gen7, profiles.expansion]) {
    engine.init(data, profile);
    const user = set('Shuckle', {stg: [0, 2, -1, 1, 2, 0]}), target = set('Blissey', {stg: [0, -1, 2, 2, -1, 0]});
    const saved = JSON.stringify([user, target]), rawUser = engine.stats(user), rawTarget = engine.stats(target);
    for (const field of [{powerSplit: true}, {guardSplit: true}, {powerSplit: true, guardSplit: true}]) {
      const raw = {};
      for (const stat of [...(field.powerSplit ? ['atk', 'spa'] : []), ...(field.guardSplit ? ['def', 'spd'] : [])]) {
        const index = stats.indexOf(stat);
        raw[stat] = Math.floor((rawUser[index] + rawTarget[index]) / 2);
      }
      for (const [attacker, defender] of [[user, target], [target, user]]) {
        for (const move of ['Tackle', 'Flamethrower', 'Foul Play', 'Body Press']) {
          if (move === 'Body Press' && profile.gen < 8) continue;
          for (const crit of [false, true]) {
            const selected = slot(move, {crit});
            assert.deepEqual(plain(engine.calc(attacker, defender, selected, field).rolls),
              distributions(reference({...attacker, raw}, {...defender, raw}, selected, {}, profile).result.damage, 1)[0],
              `Gen ${profile.gen} ${move} ${JSON.stringify(field)}`);
          }
        }
      }
    }
    assert.equal(JSON.stringify([user, target]), saved);
    assert.deepEqual(engine.stats(user), rawUser);
  }
  engine.init(data, profiles.gen4);
  assert.deepEqual(engine.calc(set('Shuckle'), set('Blissey'), slot('Tackle'), {powerSplit: true, guardSplit: true}).rolls,
    engine.calc(set('Shuckle'), set('Blissey'), slot('Tackle'), {}).rolls);
});

await test('A3 splits persist through multi-hit and Parental Bond recalculations', () => {
  engine.init(data, profiles.expansion);
  const user = set('Snorlax', {ab: ability('Parental Bond')}), target = set('Blissey');
  for (const field of [{powerSplit: true}, {guardSplit: true}, {powerSplit: true, guardSplit: true}]) {
    const result = engine.calc(user, target, slot('Tackle'), field);
    const expected = engine.hit(user, target, slot('Tackle'), field, 'max', {userChange: false});
    assert.equal(result.max + Math.max(...result.per[1]), expected.dealt);
    const multi = engine.calc({...user, ab: -1}, target, slot('Double Kick'), field);
    assert.equal(multi.hits, 2);
    assert.deepEqual(multi.per?.[1] || multi.rolls, multi.rolls);
  }
});

await test('A3 assembly gates new fields by moves, abilities and generation, without duplicates', () => {
  const source = `import assemble,json
entries=json.load(open('template/calc/field-states.json',encoding='utf-8'))
names={'PowerSpot','SteelySpirit','FlowerGift','PlusMinus','allyFairyAura','allyDarkAura','allyAuraBreak','TabletsOfRuin','SwordOfRuin','VesselOfRuin','BeadsOfRuin','PowerTrick','waterSport','mudSport','powerSplit','guardSplit'}
def selected(profile):
 return {entry['k']:entry for entry in profile['field'] if entry['k'] in names or entry['k'][3:] in names}
out={}
for base in ['gen4','gen5','gen6','gen7','expansion']:
 data={'M':list({move for entry in entries for move in entry.get('moves',[])}),'AB':[[name] for entry in entries for name in entry.get('abilities',[])]}
 out[base]=selected(assemble.calc_profile({'base':base},data))
out['empty']=selected(assemble.calc_profile({'base':'expansion'},{'M':[],'AB':[]}))
out['noabilities']=selected(assemble.calc_profile({'base':'expansion','abilities':False},data))
for hack in ['emerald-imperium','hardlove-gold','photonic-sun','eternal-x']:
 config=json.load(open('hacks/'+hack+'/hack.json',encoding='utf-8'))['cfg']['calc']
 guide=json.load(open('hacks/'+hack+'/data.json',encoding='utf-8'))
 profile=assemble.calc_profile(config,guide)
 assert len(profile['field'])==len({field['k'] for field in profile['field']})
 out[hack]=selected(profile)
print(json.dumps(out))`;
  const result = spawnSync('python', ['-X', 'utf8', '-c', source], {cwd: fileURLToPath(root), encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const offered = JSON.parse(result.stdout);
  assert.deepEqual(offered.empty, {});
  assert.deepEqual(Object.keys(offered.noabilities).sort(),
    ['waterSport', 'mudSport', 'powerSplit', 'guardSplit', 'atkPowerTrick', 'defPowerTrick'].sort());
  assert.ok(offered.gen4.waterSport && offered.gen4.mudSport && offered.gen4.atkPowerTrick);
  assert.ok(!offered.gen4.powerSplit && !offered.gen4.allyFairyAura && !offered.gen4.atkPowerSpot);
  assert.ok(offered.gen5.powerSplit && offered.gen5.guardSplit && !offered.gen5.allyFairyAura);
  assert.ok(offered.gen6.allyFairyAura && !offered.gen6.atkPowerSpot);
  assert.ok(offered.expansion.atkPowerSpot && offered.expansion.atkTabletsOfRuin);
  for (const hack of ['emerald-imperium', 'hardlove-gold', 'photonic-sun', 'eternal-x']) {
    for (const key of ['waterSport', 'mudSport', 'powerSplit', 'guardSplit']) assert.equal(offered[hack][key].side, 'field');
    for (const key of ['atkFlowerGift', 'defFlowerGift', 'atkPlusMinus', 'defPlusMinus']) assert.equal(offered[hack][key].doubles, true);
  }
  assert.ok(!offered['hardlove-gold'].allyDarkAura && !offered['hardlove-gold'].atkTabletsOfRuin);
});

await test('initialisation and calculations leave guide/profile inputs unchanged', () => {
  assert.equal(JSON.stringify({data, profiles}), unchanged);
});

const bundle = await readFile(new URL('template/calc/engine.js', root));
console.log(`engine.js: ${bundle.length} bytes; gzip ${gzipSync(bundle).length} bytes`);
console.log(`${passed} passed; ${failed} failed; ${parity} direct @smogon/calc parity cases`);
if (failed) process.exitCode = 1;

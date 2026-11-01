import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine, resolveProfile} from './run.mjs';

const directory = new URL('../../hacks/radical-red/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
assert.ok(configuration.cfg.calc, 'RR calc must stay configured for the finishing unit');
const profile = await resolveProfile(configuration.cfg.calc);
const data = {
  P: [{id: '151', n: 'Mew', s: [100, 100, 100, 100, 100, 100], t: ['Psychic'], a: [], et: []}],
  AB: ['Toxic Boost', 'Flare Boost', 'Iron Fist', 'Striker', 'Illusion', 'Feline Prowess',
    'Sage Power', 'Bull Rush', 'Quill Rush', 'Defeatist', 'Corrosion', 'Mountaineer',
    'Water Compaction', 'Fatal Precision', 'Primal Armor', 'Liquid Voice', 'Reckless',
    'ORAORAORAORA', 'ORAORAORAORA!', 'Bone Zone', 'Bone Zone ', 'Self Sufficient',
    'Blubber Defense', 'Cash Splash', 'WaterCompaction', 'Levitate', 'Sharpness',
    'Bulletproof', 'Mega Launcher', 'Thick Fat', 'Solar Power', 'Rivalry', 'Klutz', 'Blazing Soul', 'Ice Scales', 'Mold Breaker',
    'Flower Gift', 'Bad Company', 'Rock Head', 'Neutralize Gas'].map(name => [name, '']),
  M: ['Tackle', 'Ember'],
  MV: [
    {bp: 40, t: 'Normal', c: 'Physical', f: ['contact']},
    {bp: 40, t: 'Fire', c: 'Special', f: []},
  ],
};
for (const [name, power, type, category, flags] of [
  ['Fire Punch', 75, 'Fire', 'Physical', ['punch', 'contact']],
  ['Double Kick', 30, 'Fighting', 'Physical', ['kick', 'contact']],
  ['Mega Kick', 120, 'Normal', 'Physical', ['kick', 'contact']],
  ['Hyper Voice', 90, 'Normal', 'Special', ['sound']],
  ['Sludge', 65, 'Poison', 'Special', []],
  ['Rock Throw', 50, 'Rock', 'Physical', []],
  ['Water Gun', 40, 'Water', 'Special', []],
  ['Flamethrower', 90, 'Fire', 'Special', []],
  ['Aura Sphere', 80, 'Fighting', 'Special', ['pulse', 'bullet']],
  ['Explosion', 150, 'Normal', 'Physical', []],
  ['Self-Destruct', 100, 'Normal', 'Physical', []],
  ['Misty Explosion', 100, 'Fairy', 'Special', []],
  ['Bonemerang', 50, 'Ground', 'Physical', ['bone']],
  ['Beat Up', 25, 'Dark', 'Physical', []],
  ['Shell Side Arm', 100, 'Poison', 'Special', []],
  ['Raging Bull', 90, 'Normal', 'Physical', []],
  ['Sonic Slash', 1, 'Flying', 'Physical', []],
  ['Bitter Malice', 60, 'Ghost', 'Special', []],
  ['Barb Barrage', 60, 'Poison', 'Physical', []],
  ['Infernal Parade', 60, 'Ghost', 'Special', []],
  ['Facade', 70, 'Normal', 'Physical', []],
  ['Flash Cannon', 80, 'Steel', 'Special', ['pulse', 'bullet']],
  ['Wicked Blow', 75, 'Dark', 'Physical', ['punch']],
  ['Snipe Shot', 70, 'Water', 'Special', ['pulse', 'bullet']],
  ['Rapid Spin', 50, 'Normal', 'Physical', ['contact']],
  ['Ice Spinner', 80, 'Ice', 'Physical', ['contact']],
  ['Steel Roller', 130, 'Steel', 'Physical', ['contact']],
  ['Splintered Stormshards', 190, 'Rock', 'Physical', []],
  ['Octazooka', 80, 'Water', 'Special', ['bullet', 'pulse']],
  ['Ice Hammer', 100, 'Ice', 'Physical', ['contact']],
  ['Razor Shell', 75, 'Water', 'Physical', ['contact', 'slicing']],
  ['Acupressure', 0, 'Normal', 'Status', []],
  ['Muddy Water', 95, 'Water', 'Special', []],
  ['Cut', 75, 'Steel', 'Physical', ['slicing', 'contact']],
  ['Multi-Attack', 90, 'Normal', 'Physical', ['contact']],
  ['Draco Barrage', 100, 'Dragon', 'Special', []],
  ['Charge Beam', 50, 'Electric', 'Special', []],
  ['Volt Tackle', 120, 'Electric', 'Physical', ['contact']],
  ['Inferno Parade', 60, 'Ghost', 'Special', []],
]) {
  data.M.push(name);
  data.MV.push({bp: power, t: type, c: category, f: flags});
}
for (const [species, types] of [['Electivire', ['Electric']], ['Sunflora', ['Grass']],
  ["Farfetch'd", ['Normal', 'Flying']], ["Sirfetch'd", ['Fighting']], ['Cherrim', ['Grass']]]) {
  data.P.push({id: species, n: species, s: [100, 100, 100, 100, 100, 100], t: types, a: [], et: []});
}
const unchanged = JSON.stringify({data, profile});
const engine = await createEngine(data, profile);
const plain = value => JSON.parse(JSON.stringify(value));
const mon = (extra = {}) => ({id: '151', lv: 50, nat: 'Serious', ab: -1, it: '', st: '',
  iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], stg: [0, 0, 0, 0, 0, 0], ...extra});
const reference = 'RR calc 7f354003: calc/src/mechanics/';
const formula = reference + 'util.ts:480-488,540-562; gen789.ts:1086-1099';
const toxicSource = 'RR changes v3.1:46; Showdown 54955790 gen9rr/abilities.ts:691-700';
const flareSource = 'RR changes v3.1:49; Showdown 54955790 gen9rr/abilities.ts:240-249';
const neutral = [16, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 19];
const boosted = [23, 24, 24, 24, 24, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 28];
let passed = 0;
let failed = 0;
const check = (name, source, run) => {
  try {
    run();
    passed++;
    console.log('PASS ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name + '\nSource: ' + source + '\n' + error.message);
  }
};
const rolls = (attacker, move) => plain(engine.calc(attacker, mon(), {mv: move}).rolls);
check('neutral physical 16-19 (base damage 19)', formula, () => {
  assert.deepEqual(rolls(mon(), 0), neutral);
});
check('neutral special 16-19 (base damage 19)', formula, () => {
  assert.deepEqual(rolls(mon(), 1), neutral);
});
for (const status of ['psn', 'tox']) {
  check('Toxic Boost ' + status + ' physical 23-28 (power 60, base damage 28)', formula, () => {
    assert.deepEqual(rolls(mon({ab: 0, st: status}), 0), boosted);
  });
  check('Toxic Boost ' + status + ' does not boost special damage', formula, () => {
    assert.deepEqual(rolls(mon({ab: 0, st: status}), 1), neutral);
  });
}
check('Flare Boost burned special 23-28 (power 60, base damage 28)', formula, () => {
  assert.deepEqual(rolls(mon({ab: 1, st: 'brn'}), 1), boosted);
});
for (const ability of [0, 1]) {
  check(data.AB[ability][0] + ' does not boost a healthy holder', formula, () => {
    assert.deepEqual(rolls(mon({ab: ability}), ability), neutral);
  });
}
for (const [ability, status, source] of [[0, 'psn', toxicSource], [0, 'tox', toxicSource], [1, 'brn', flareSource]]) {
  check(data.AB[ability][0] + ' blocks ' + status + ' residual', source, () => {
    assert.deepEqual(plain(engine.residual(mon({ab: ability, st: status}))), []);
  });
  check(data.AB[ability][0] + ' still takes Sand chip while healthy', source, () => {
    assert.deepEqual(plain(engine.residual(mon({ab: ability}), {weather: 'Sand'})),
      [{l: 'Sandstorm', v: [-10, -10, -10, -10]}]);
  });
}
const ability = name => data.AB.findIndex(entry => entry[0] === name);
const move = name => data.M.indexOf(name);
const holder = (name, extra = {}) => mon({ab: ability(name), ty: ['???'], ...extra});
const target = extra => mon({ty: ['???'], ...extra});
const result = (attacker, name, defender = target(), field = {}, slot = {}) =>
  plain(engine.calc(attacker, defender, {mv: move(name), ...slot}, field));
const round = value => Math.ceil(value - 0.5);
const expected = (power, {attack = 120, defense = 120, effectiveness = 1, stab = 1,
  final = 4096, frostbite = false, child = false, weather = 1} = {}) => {
  let base = Math.floor(Math.floor(22 * power * attack / defense) / 50) + 2;
  if (child) base = round(base / 2);
  base = round(base * weather);
  return Array.from({length: 16}, (_, index) => {
    let damage = Math.floor(round(Math.floor(base * (85 + index) / 100) * stab) * effectiveness);
    if (frostbite) damage = Math.floor(damage / 2);
    return round(Math.max(1, damage * final / 4096));
  });
};
const rr = line => reference + 'gen789.ts:' + line;
for (const [name, attackMove, power, active] of [
  ['Iron Fist', 'Fire Punch', 98, {}], ['Striker', 'Mega Kick', 156, {}],
  ['Illusion', 'Tackle', 52, {atkIllusion: true}],
]) {
  check(name + ' power and negative case', rr('1130-1134'), () => {
    assert.deepEqual(result(holder(name), attackMove, target(), active).rolls, expected(power));
    assert.deepEqual(result(holder(name), 'Ember').rolls, expected(40));
  });
}
check('Illusion broken does not boost', 'Showdown abilities.ts:324-334', () => {
  assert.deepEqual(result(holder('Illusion'), 'Tackle').rolls, expected(40));
});
for (const [name, multiplier] of [['Feline Prowess', 2], ['Sage Power', 1.5]]) {
  check(name + ' special attack, not physical', rr('1344-1349'), () => {
    assert.deepEqual(result(holder(name), 'Ember').rolls, expected(40, {attack: 120 * multiplier}));
    assert.deepEqual(result(holder(name), 'Tackle').rolls, expected(40));
  });
}
for (const name of ['Bull Rush', 'Quill Rush']) {
  check(name + ' first-turn physical attack toggle', rr('1404-1407'), () => {
    assert.deepEqual(result(holder(name), 'Tackle', target(), {atkBullRush: true}).rolls, expected(40, {attack: 144}));
    assert.deepEqual(result(holder(name), 'Tackle').rolls, expected(40));
    assert.deepEqual(result(holder(name), 'Ember', target(), {atkBullRush: true}).rolls, expected(40));
  });
}
check('Defeatist at one third, not half', 'Showdown abilities.ts:170-183', () => {
  for (const name of ['Tackle', 'Ember']) {
    assert.deepEqual(result(holder('Defeatist', {hp: 58}), name).rolls, expected(40, {attack: 60}));
    assert.deepEqual(result(holder('Defeatist', {hp: 59}), name).rolls, expected(40));
  }
});
check('Corrosion Poison hits Steel; unrelated types retain immunities', 'Showdown abilities.ts:152-163', () => {
  assert.deepEqual(result(holder('Corrosion'), 'Sludge', target({ty: ['Steel']})).rolls, expected(65));
  assert.equal(result(holder(''), 'Sludge', target({ty: ['Steel']})).max, 0);
  assert.equal(result(holder('Corrosion'), 'Tackle', target({ty: ['Ghost']})).max, 0);
});
check('Mountaineer Rock immunity only', 'Showdown abilities.ts:364-379', () => {
  assert.equal(result(holder(''), 'Rock Throw', target({ab: ability('Mountaineer')})).max, 0);
  assert.deepEqual(result(holder(''), 'Tackle', target({ab: ability('Mountaineer')})).rolls, expected(40));
});
for (const name of ['Water Compaction', 'WaterCompaction']) {
  check(name + ' Water reduction; other type unchanged', rr('1355-1359'), () => {
    assert.deepEqual(result(holder(''), 'Water Gun', target({ab: ability(name)})).rolls, expected(40, {attack: 60}));
    assert.deepEqual(result(holder(''), 'Ember', target({ab: ability(name)})).rolls, expected(40));
  });
}
for (const [name, modifier, side] of [['Fatal Precision', 4915, 'atk'], ['Primal Armor', 2048, 'def']]) {
  check(name + ' only super effective', rr(side === 'atk' ? '1638' : '1677'), () => {
    const attacker = holder(side === 'atk' ? name : '');
    const defender = target({ty: ['Grass'], ab: side === 'def' ? ability(name) : -1});
    assert.deepEqual(result(attacker, 'Ember', defender).rolls, expected(40, {effectiveness: 2, final: modifier}));
    assert.deepEqual(result(attacker, 'Tackle', defender).rolls, expected(40));
  });
}
check('Liquid Voice converts sound to Water and adds 1.2x power', rr('1165'), () => {
  assert.deepEqual(result(holder('Liquid Voice'), 'Hyper Voice').rolls, expected(108));
  assert.deepEqual(result(holder('Liquid Voice'), 'Hyper Voice', target({ty: ['Fire']})).rolls, expected(108, {effectiveness: 2}));
  assert.deepEqual(result(holder('Liquid Voice'), 'Ember').rolls, expected(40));
});
check('Frostbite halves special, not physical; chip independent of Snow', rr('553-557') + '; Showdown conditions.ts:16-19', () => {
  assert.deepEqual(result(holder('', {st: 'frz'}), 'Ember').rolls, expected(40, {frostbite: true}));
  assert.deepEqual(result(holder('', {st: 'frz'}), 'Tackle').rolls, expected(40));
  assert.deepEqual(plain(engine.residual(holder('', {st: 'frz'}), {weather: 'Snow'})), [{l: 'Frostbite', v: [-10, -10, -10, -10]}]);
});
check('Snow boosts Ice physical defense, no chip or special defense boost', rr('1460-1463'), () => {
  assert.deepEqual(result(holder(''), 'Tackle', target({ty: ['Ice']}), {weather: 'Snow'}).rolls, expected(40, {defense: 180}));
  assert.deepEqual(result(holder(''), 'Water Gun', target({ty: ['Ice']}), {weather: 'Snow'}).rolls, expected(40));
  assert.deepEqual(plain(engine.residual(target(), {weather: 'Snow'})), []);
});
for (const [name, power] of [['Explosion', 150], ['Self-Destruct', 100], ['Misty Explosion', 100]]) {
  check(name + ' halves defending stat; Reckless power', rr('1465-1468,1161-1167'), () => {
    assert.deepEqual(result(holder(''), name).rolls, expected(power, {defense: 60}));
    assert.deepEqual(result(holder('Reckless'), name).rolls, expected(round(power * 4915 / 4096), {defense: 60}));
  });
}
for (const name of ['ORAORAORAORA', 'ORAORAORAORA!']) {
  check(name + ' independent second strike, not multi-hit or Z', rr('588-593,1571-1573'), () => {
    const punch = result(holder(name), 'Fire Punch');
    assert.equal(punch.hits, 2);
    assert.deepEqual(punch.per, [expected(75), expected(75, {child: true})]);
    assert.equal(result(holder(name), 'Tackle').hits, 1);
    assert.equal(result(holder(name), 'Fire Punch', target(), {}, {z: true}).hits, 1);
    const applied = plain(engine.hit(holder(name), target(), {mv: move('Fire Punch')}, {}, 'max'));
    assert.equal(applied.def.hp, 175 - expected(75)[15] - expected(75, {child: true})[15]);
  });
}
for (const name of ['Bone Zone', 'Bone Zone ']) {
  check(name + ' type immunity and resisted strike', rr('299,1027,1646'), () => {
    const single = {hits: 1};
    assert.deepEqual(result(holder(name), 'Bonemerang', target({ty: ['Flying']}), {}, single).rolls, expected(50));
    assert.deepEqual(result(holder(name), 'Bonemerang', target({ty: ['Grass']}), {}, single).rolls, expected(50, {effectiveness: 0.5, final: 8192}));
  });
}
for (const [item, species, attackMove, power] of [['Electirizer', 'Electivire', 'Aura Sphere', 120], ['Burnt Seed', 'Sunflora', 'Ember', 60]]) {
  check(item + ' species/type gate and Magic Room', rr('1195-1197'), () => {
    const attacker = holder('', {id: species, it: item});
    assert.deepEqual(result(attacker, attackMove).rolls, expected(power));
    assert.deepEqual(result(holder('', {it: item}), attackMove).rolls, expected(item === 'Electirizer' ? 80 : 40));
    assert.deepEqual(result(attacker, attackMove, target(), {magicRoom: true}).rolls, expected(item === 'Electirizer' ? 80 : 40));
  });
}
check('type gems use RR 1.5x, not vanilla 1.3x; consumed item off', rr('1193-1199'), () => {
  assert.deepEqual(result(holder('', {it: 'Fire Gem'}), 'Ember').rolls, expected(60));
  assert.deepEqual(result(holder('', {it: 'Fire Gem', used: true}), 'Ember').rolls, expected(40));
  assert.deepEqual(result(holder('', {it: 'Fire Gem'}), 'Tackle').rolls, expected(40));
  assert.deepEqual(result(holder('Klutz', {it: 'Fire Gem'}), 'Ember').rolls, expected(40));
  assert.deepEqual(result(holder('', {it: 'Fire Gem'}), 'Ember', target(), {magicRoom: true}).rolls, expected(40));
  assert.equal(plain(engine.hit(holder('', {it: 'Fire Gem'}), target(), {mv: move('Ember')}, {}, 'max')).atk.used, true);
});
check('Blazing Soul Fire priority only at full HP', 'Showdown abilities.ts:51-58', () => {
  assert.equal(result(holder('Blazing Soul'), 'Ember').priority, 1);
  assert.equal(result(holder('Blazing Soul', {hp: 174}), 'Ember').priority, 0);
  assert.equal(result(holder('Blazing Soul'), 'Tackle').priority, 0);
});
check('RR pulse, bullet, kick and slicing flags reach base effects', 'Showdown moves.ts:368,961,1185; v4.0 changelog:474-475', () => {
  assert.equal(result(holder(''), 'Flash Cannon', target({ab: ability('Bulletproof')})).max, 0);
  assert.deepEqual(result(holder('Mega Launcher'), 'Flash Cannon').rolls, expected(120));
  assert.deepEqual(result(holder('Sharpness'), 'Cut').rolls, expected(112));
  const wicked = result(holder('Iron Fist'), 'Wicked Blow');
  assert.equal(wicked.bp, undefined);
  assert.equal(wicked.crit.forced, true);
});
check('Snipe Shot has two high-critical stages; Leek Stick species stages', 'Showdown moves.ts:961-966; items.ts:902-922', () => {
  assert.equal(result(holder(''), 'Snipe Shot').crit.stage, 2);
  for (const [species, stage] of [["Farfetch'd", 1], ["Sirfetch'd", 2]]) {
    assert.equal(result(holder('', {id: species, it: 'Leek Stick'}), 'Tackle').crit.stage, stage);
  }
});
check('Hardcore Rapid Spin clears hazards but does not boost Speed', 'Hardcore Main!E28', () => {
  const applied = plain(engine.hit(holder(''), target(), {mv: move('Rapid Spin')}, {atkSpikes: 1}, 'max'));
  assert.equal(applied.field.changes.atkSpikes, false);
  assert.equal(applied.atk?.stg, undefined);
});
check('Hardcore attacks do not clear terrain', 'Hardcore Main!E12', () => {
  for (const name of ['Ice Spinner', 'Steel Roller', 'Splintered Stormshards']) {
    const applied = plain(engine.hit(holder(''), target(), {mv: move(name)}, {terrain: 'Psychic'}, 'max'));
    assert.equal(applied.field?.changes?.terrain, undefined, name);
  }
});
check('RR changed move effect records replace native effects', 'Showdown gen9rr/moves.ts:4,492,665,717,780,888', () => {
  assert.deepEqual(plain(engine.effect(holder(''), target(), {mv: move('Acupressure')})).atk.stg, [0, 1, 0, 0, 0, 0]);
  assert.deepEqual(plain(engine.hit(holder(''), target(), {mv: move('Octazooka')}, {}, 'max')).def.stg, [0, 0, 0, 0, 0, -1]);
  assert.equal(plain(engine.hit(holder(''), target(), {mv: move('Ice Hammer')}, {}, 'max')).atk?.stg, undefined);
  assert.equal(engine.effects('Muddy Water').sec[0].c, 40);
  assert.deepEqual(plain(engine.effects('Muddy Water').sec[0].b), {atk: -1});
  assert.equal(engine.effects('Razor Shell').sec, undefined);
  assert.equal(engine.effects('Shell Side Arm').sec[0].c, 10);
});
check('Beat Up uses flat power 25 for every selected strike', 'Showdown moves.ts:80-96; official dex move 251', () => {
  const attack = result(holder(''), 'Beat Up', target(), {}, {hits: 3});
  assert.equal(attack.hits, 3);
  assert.deepEqual(attack.per || Array(attack.hits).fill(attack.rolls), Array(3).fill(expected(25)));
});
check('Shell Side Arm stays Special and bypasses defensive abilities', 'Showdown moves.ts:888-905', () => {
  const attacker = holder('', {stg: [0, 6, 0, 0, 0, 0]});
  assert.deepEqual(result(attacker, 'Shell Side Arm').rolls, expected(100));
  assert.deepEqual(result(attacker, 'Shell Side Arm', target({ab: ability('Ice Scales')})).rolls, expected(100));
});
check('Mold Breaker bypasses custom defenses, but not Primal Armor', rr('134-165'), () => {
  assert.deepEqual(result(holder('Mold Breaker'), 'Rock Throw', target({ab: ability('Mountaineer')})).rolls, expected(50));
  assert.deepEqual(result(holder('Mold Breaker'), 'Water Gun', target({ab: ability('Water Compaction')})).rolls, expected(40));
  assert.deepEqual(result(holder('Mold Breaker'), 'Ember', target({ab: ability('Primal Armor'), ty: ['Grass']})).rolls, expected(40, {effectiveness: 2, final: 2048}));
});
check('Sonic Slash exact speed thresholds', rr('741-745'), () => {
  for (const [speed, power] of [[239, 80], [240, 120], [359, 120], [360, 140]]) {
    assert.deepEqual(result(holder('', {rs: {spe: speed}}), 'Sonic Slash').rolls, expected(power));
  }
});
for (const name of ['Bitter Malice', 'Barb Barrage', 'Infernal Parade', 'Inferno Parade']) {
  check(name + ' doubles for every major status', rr('757-763'), () => {
    assert.deepEqual(result(holder(''), name, target({st: 'par'})).rolls, expected(120));
    assert.deepEqual(result(holder(''), name).rolls, expected(60));
  });
}
check('Frostbite Facade doubles without a physical penalty', rr('992-993,553-556'), () => {
  assert.deepEqual(result(holder('', {st: 'frz'}), 'Facade').rolls, expected(140));
});
check('Self Sufficient heals one sixteenth', 'Showdown abilities.ts:638-647', () => {
  assert.deepEqual(plain(engine.residual(holder('Self Sufficient'))), [{l: 'Self Sufficient', v: [10, 10, 10, 10]}]);
});
check('Solar Power boosts Special in Sun with no sun chip', 'Showdown abilities.ts:665-670; RR changes v3.1:64', () => {
  assert.deepEqual(result(holder('Solar Power'), 'Ember', target(), {weather: 'Sun'}).rolls,
    expected(40, {attack: 180, weather: 1.5}));
  assert.deepEqual(plain(engine.residual(holder('Solar Power'), {weather: 'Sun'})), []);
  assert.deepEqual(result(holder('Solar Power'), 'Ember').rolls, expected(40));
});
check('Blubber Defense and Cash Splash use their native equivalents', 'Showdown abilities.ts:60-71,113-151', () => {
  assert.deepEqual(result(holder(''), 'Ember', target({ab: ability('Blubber Defense')})).rolls, expected(40, {final: 2048}));
  assert.deepEqual(result(holder('Cash Splash'), 'Water Gun').rolls, expected(40, {attack: 240}));
});
check('EV-less player defaults preserve Ghost Marowak 252 HP EVs', 'Hardcore Main!E95; Photonic Sun notes.md EV-less precedent', () => {
  assert.equal(profile.evs, true);
  assert.equal(engine.stats(mon())[0], 175);
  assert.equal(engine.stats(mon({ev: [252, 0, 0, 0, 0, 0]}))[0], 207);
});
check('Flower Gift: Cherrim Attack in Sun only; no Special Defense boost', 'Showdown gen9rr/abilities.ts:251-269; ' + rr('1294-1302'), () => {
  const cherrim = extra => holder('Flower Gift', {id: 'Cherrim', ...extra});
  assert.deepEqual(result(cherrim(), 'Tackle', target(), {weather: 'Sun'}).rolls, expected(40, {attack: 180}));
  assert.deepEqual(result(cherrim(), 'Tackle').rolls, expected(40));
  assert.deepEqual(result(cherrim(), 'Ember', target(), {weather: 'Sun'}).rolls, expected(40, {weather: 1.5}));
  assert.deepEqual(result(holder('Flower Gift'), 'Tackle', target(), {weather: 'Sun'}).rolls, expected(40));
  assert.deepEqual(result(holder(''), 'Ember', cherrim(), {weather: 'Sun'}).rolls, expected(40, {weather: 1.5}));
});
check('Bad Company takes no recoil, like Rock Head', 'Showdown gen9rr/abilities.ts:2-25', () => {
  const recoil = name => plain(engine.hp(holder(name), target(), {mv: move('Volt Tackle')}, {}, 100));
  assert.equal(recoil('').v, -25);
  assert.equal(recoil('Bad Company'), null);
  assert.equal(recoil('Rock Head'), null);
});
check('Multi-Attack takes the primary type of its user', 'Showdown gen9rr/moves.ts:685-692; ' + rr('211-216'), () => {
  assert.deepEqual(result(mon(), 'Multi-Attack', target({ty: ['Fighting']})).rolls, expected(90, {stab: 1.5, effectiveness: 2}));
  assert.deepEqual(result(mon(), 'Multi-Attack', target({ty: ['Dark']})).max, 0);
});
check('Draco Barrage hits Fairy; Physical only when boosted Attack is higher', 'Showdown gen9rr/moves.ts:247-266; ' + reference + 'util.ts:167-168', () => {
  assert.deepEqual(result(holder(''), 'Draco Barrage', target({ty: ['Fairy']})).rolls, expected(100));
  assert.equal(result(holder(''), 'Draco Barrage', target({ty: ['Fairy']})).max > 0, true);
  assert.deepEqual(result(holder('', {stg: [0, 1, 0, 0, 0, 0]}), 'Draco Barrage').rolls, expected(100, {attack: 180}));
  assert.deepEqual(result(holder('', {stg: [0, 1, 0, 0, 0, 0]}), 'Draco Barrage', target({stg: [0, 0, 1, 0, 0, 0]})).rolls,
    expected(100, {attack: 180, defense: 180}));
  assert.deepEqual(result(holder('', {stg: [0, 1, 0, 1, 0, 0]}), 'Draco Barrage', target({stg: [0, 0, 1, 0, 0, 0]})).rolls,
    expected(100, {attack: 180}));
});
check('Charge Beam always raises Special Attack', 'Showdown gen9rr/moves.ts:149-160', () => {
  assert.deepEqual(plain(engine.hit(holder(''), target(), {mv: move('Charge Beam')}, {}, 'min')).atk.stg, [0, 0, 0, 1, 0, 0]);
});
check('Hardcore AI weather and terrain stay after the setter leaves', 'Hardcore Main!E10', () => {
  assert.equal(engine.settings().setterStays, true);
});
check('CFRU raw ability names reach their engine effects', 'tools/cfru.py CFRU_NAMES', () => {
  const thick = target({ab: ability('Thick Fat')});
  assert.deepEqual(result(holder('Neutralize Gas'), 'Ember', thick).rolls, expected(40));
  assert.notDeepEqual(result(holder(''), 'Ember', thick).rolls, expected(40));
});
check('fixture inputs remain unchanged', 'tools/calc/README.md: Public contract', () => {
  assert.equal(JSON.stringify({data, profile}), unchanged);
});
console.log(`Radical Red source/formula checks: ${passed} passed, ${failed} failed; configured CFRU profile`);
if (failed) {
  process.exitCode = 1;
}

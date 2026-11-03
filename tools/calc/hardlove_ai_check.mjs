import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {Fraction, enumerateRandomBranches, highestScoreOdds, enumerateDamageScores, roundedPercentages, scoreLabel} from '../../template/calc/ai/enumerate.mjs';
import {evaluateSingles, BuildStateVariables} from '../../template/calc/ai/hardlove/index.mjs';
import {BattleAI_CalcBaseDamage, BattleAI_CalcDamage, BattleAI_GetDynamicMoveType, BattleAI_GetTypeEffectiveness, BattleAI_IsParentalBondMove} from '../../template/calc/ai/hardlove/damage.mjs';
import * as calc from '../../template/calc/ai/hardlove/calc.mjs';
import * as helpers from '../../template/calc/ai/hardlove/helpers.mjs';
import {BattleAI_CalcEffectiveSpeed, AI_IsClient2Faster} from '../../template/calc/ai/hardlove/speed.mjs';

const results = [];
const zero = new Fraction();
const one = new Fraction(1n);
const exact = value => value.toJSON();
function check(name, run) {
  try {
    run();
    results.push({name, status: 'pass'});
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({name, status: 'fail', error: error.stack});
    console.error(`FAIL ${name}\n${error.stack}`);
  }
}

function bruteOdds(tables, scorer) {
  const result = tables.map(() => zero);
  const visitScores = (distributions, index, chosen, weight) => {
    if (index === distributions.length) {
      const maximum = Math.max(...chosen);
      const winners = chosen.flatMap((score, moveIndex) => score === maximum ? [moveIndex] : []);
      for (const winner of winners) result[winner] = result[winner].add(weight.divide(winners.length));
      return;
    }
    for (const branch of distributions[index]) visitScores(distributions, index + 1, [...chosen, branch.score], weight.multiply(branch.weight));
  };
  const visitRolls = (index, selected, weight) => {
    if (index === tables.length) {
      const context = {maximum: Math.max(...selected.map(roll => roll.damage)), anyKO: selected.some(roll => roll.canOneShot)};
      const distributions = selected.map((roll, moveIndex) => enumerateRandomBranches(random => scorer(moveIndex, roll, context, random)));
      visitScores(distributions, 0, [], weight);
      return;
    }
    for (const roll of tables[index]) visitRolls(index + 1, [...selected, roll], weight.divide(tables[index].length));
  };
  visitRolls(0, [], one);
  return result;
}

check('exact rational arithmetic and conditional random branches', () => {
  assert.deepEqual(exact(new Fraction(1n, 3n).add(new Fraction(1n, 6n))), {numerator: '1', denominator: '2'});
  const branches = enumerateRandomBranches(random => random(10) < 7 ? 6 + (random(4) === 0 ? 2 : 0) : -20);
  assert.deepEqual(branches.map(branch => [branch.score, exact(branch.weight)]), [
    [-20, {numerator: '3', denominator: '10'}], [6, {numerator: '21', denominator: '40'}], [8, {numerator: '7', denominator: '40'}],
  ]);
});

check('uniform ties use the reciprocal of the number of winners', () => {
  const plain = score => [{score, weight: one}];
  assert.deepEqual(highestScoreOdds([plain(6), plain(6), plain(6)]).map(exact), Array(3).fill({numerator: '1', denominator: '3'}));
  assert.deepEqual(highestScoreOdds([plain(6), plain(8), plain(6)]).map(Number), [0, 1, 0]);
});

check('independent highest-damage bonuses: 75/25 is not a global shared coin', () => {
  const branches = enumerateRandomBranches(random => 6 + (random(4) === 0 ? 2 : 0));
  assert.deepEqual(highestScoreOdds([branches, [{score: 7, weight: one}]]).map(exact), [
    {numerator: '1', denominator: '4'}, {numerator: '3', denominator: '4'},
  ]);
});

check('joint damage maximum and any-KO correlations match exhaustive enumeration', () => {
  const tables = [
    [{damage: 1}, {damage: 3}, {damage: 5, canOneShot: true}],
    [{damage: 0}, {damage: 4}, {damage: 7, canOneShot: false}],
    [{damage: 2}, {damage: 5, canOneShot: true}],
  ];
  const scorer = (index, roll, context, random) => {
    let score = roll.damage === context.maximum ? 6 + (random(4) === 0 ? 2 : 0) : 0;
    if (roll.canOneShot) score += 3;
    if (index === 2 && !context.anyKO && random(3) === 0) score += 5;
    if (index === 1 && context.maximum < 5) score += 2;
    return score;
  };
  const actual = enumerateDamageScores(tables, scorer);
  assert.deepEqual(actual.map(result => exact(result.weight)), bruteOdds(tables, scorer).map(exact));
  for (const result of actual) {
    assert.deepEqual(exact(result.scores.reduce((total, branch) => total.add(branch.weight), zero)), exact(one));
  }
});

check('independent sixteen-roll tables aggregate duplicate damage and kill caps', () => {
  const tables = [Array.from({length: 16}, (_, roll) => ({damage: roll < 8 ? 4 : 10, canOneShot: roll >= 8})),
    Array(16).fill({damage: 10, canOneShot: true})];
  const result = enumerateDamageScores(tables, (index, roll, context) => (roll.damage === context.maximum ? 6 : 0) + (roll.canOneShot ? 6 : 0));
  assert.deepEqual(result.map(move => exact(move.weight)), [{numerator: '1', denominator: '4'}, {numerator: '3', denominator: '4'}]);
  assert.deepEqual(result[0].scores.map(branch => branch.score), [0, 12]);
});

check('four-move cost is per-move conditional tables, not Cartesian products', () => {
  let evaluations = 0;
  const tables = Array.from({length: 4}, (_, index) => Array.from({length: 16}, (_, roll) => ({damage: roll + index * 16})));
  const result = enumerateDamageScores(tables, (index, roll, context) => {
    evaluations++;
    return roll.damage === context.maximum ? 6 : 0;
  });
  assert.deepEqual(result.map(move => Number(move.weight)), [0, 0, 0, 1]);
  assert.ok(evaluations < 2000, `too many scorer evaluations: ${evaluations}`);
});

check('percent rounding remainder goes to largest, preserving exact probability', () => {
  assert.deepEqual(roundedPercentages([new Fraction(1n, 3n), new Fraction(1n, 3n), new Fraction(1n, 3n)]), [34, 33, 33]);
  assert.deepEqual(roundedPercentages([0.3333, 0.6667], 1), [33.3, 66.7]);
  assert.equal(scoreLabel([8, 6, 8]), '+6/+8');
  assert.equal(scoreLabel([-80, -20]), '-80/-20');
  assert.equal(scoreLabel([1006], true), 'Lock');
  assert.throws(() => roundedPercentages([0.2, 0.2]), /sum to one/);
});

check('invalid branch and roll inputs fail explicitly', () => {
  assert.throws(() => enumerateRandomBranches(random => random(0)), /positive integer/);
  assert.throws(() => enumerateRandomBranches(() => NaN), /finite integer/);
  assert.throws(() => enumerateDamageScores([[{damage: -1}]], () => 6), /nonnegative/);
});

// Fixtures from the AI doc's rules (Hardlove Gold AI document_WIP.md), checked against the C (src/trainerai/main.c).
// Moves carry the C's effect names (data/Moves.c, MOVE_EFFECT_ dropped). Scores are relative to the C's base 1000.
const mon = extra => ({level: 50, attack: 120, defense: 100, spAttack: 120, spDefense: 100, speed: 100, currentHP: 150,
  totalHP: 150, statBoosts: {}, ability: 'Pressure', item: '', status: '', facts: {}, ...extra});
const mv = (name, type, category, power, effect = 'HIT', extra = {}) => ({name, type, category, power, effect, flags: [], priority: 0, ...extra});
const EQ = mv('Earthquake', 'Ground', 'Physical', 100);
const CLAW = mv('Dragon Claw', 'Dragon', 'Physical', 80);
const SD = mv('Swords Dance', 'Normal', 'Status', 0, 'ATK_UP_2');
const GROWL = mv('Growl', 'Normal', 'Status', 0, 'ATK_DOWN');
const chomp = extra => mon({species: 'Garchomp', types: ['Dragon', 'Ground'], speed: 130, moves: [EQ, CLAW], ...extra});
const lax = extra => mon({species: 'Snorlax', types: ['Normal'], speed: 50, currentHP: 250, totalHP: 250, moves: [GROWL], ...extra});
const odds = (attacker, defender = lax(), field = {}) => evaluateSingles({attacker, defender, field});
const table = result => Object.fromEntries(result.map(move => [move.name, [move.percent, move.score]]));
const sumsTo100 = result => assert.equal(result.reduce((total, move) => total + move.percent, 0), 100);
const branchesOf = move => move.branches.map(branch => [branch.score, `${branch.exact.numerator}/${branch.exact.denominator}`]);

check('doc: highest damaging move +6 (75 %) / +8 (25 %)', () => {
  const result = odds(chomp());
  assert.deepEqual(table(result), {Earthquake: [100, '+6/+8'], 'Dragon Claw': [0, '0']});
  assert.deepEqual(branchesOf(result[0]), [[6, '3/4'], [8, '1/4']]);
});

check('doc: offensive setup +6, +2 faster and not KOd, +3 / +1 taking under 1/3 (Swords Dance +12 beats +6/+8)', () => {
  const result = odds(chomp({moves: [EQ, CLAW, SD]}));
  assert.deepEqual(table(result), {Earthquake: [0, '+6/+8'], 'Dragon Claw': [0, '0'], 'Swords Dance': [100, '+12']});
});

check('doc: Unaware leaves setup a 25 % chance to score', () => {
  const result = odds(chomp({moves: [EQ, CLAW, SD]}), lax({ability: 'Unaware'}));
  assert.deepEqual(table(result), {Earthquake: [75, '+6/+8'], 'Dragon Claw': [0, '0'], 'Swords Dance': [25, '0/+12']});
  sumsTo100(result);
});

check('C: equal damage tables are independent rolls, highest roll wins (ties split)', () => {
  const pulse = mv('Dragon Pulse', 'Dragon', 'Special', 80);
  const result = odds(chomp({moves: [CLAW, pulse]}));
  assert.deepEqual(result.map(move => move.percent), [50, 50]);
  assert.deepEqual(result[0].exact, {numerator: '1', denominator: '2'});
  assert.equal(result[0].score, '0/+6/+8');
});

check('doc: fast kill +12/+14, both killing moves count as highest (capped at target HP)', () => {
  const result = odds(chomp(), lax({currentHP: 1}));
  assert.deepEqual(table(result), {Earthquake: [50, '+12/+14'], 'Dragon Claw': [50, '+12/+14']});
  assert.equal(odds(chomp({ability: 'Moxie'}), lax({currentHP: 1}))[0].score, '+13/+15');
});

check('doc: slow kill +9/+11; a priority kill while slower is a fast kill', () => {
  assert.equal(odds(chomp({speed: 30}), lax({currentHP: 1}))[0].score, '+9/+11');
  const fast = mv('Extreme Speed', 'Normal', 'Physical', 80, 'HIT', {priority: 2});
  const result = odds(chomp({speed: 30, moves: [EQ, fast]}), lax({currentHP: 1}));
  assert.deepEqual(table(result), {Earthquake: [0, '+9/+11'], 'Extreme Speed': [100, '+12/+14']});
});

check('C: Explosion returns zero despite leaving its nonzero damageRange; Tackle gets highest damage', () => {
  const boom = mv('Explosion', 'Normal', 'Physical', 250, 'HALVE_DEFENSE');
  const tackle = mv('Tackle', 'Normal', 'Physical', 40);
  const result = odds(chomp({currentHP: 75, moves: [boom, tackle]}));
  assert.deepEqual(table(result), {Explosion: [38, '0/+7'], Tackle: [62, '+6/+8']});
  assert.deepEqual(result[0].exact, {numerator: '3', denominator: '8'});
});

check('doc: trapping moves +6 (80 %) / +8 (20 %), never into a Ghost', () => {
  const pool = mv('Whirlpool', 'Water', 'Special', 35, 'BIND_HIT');
  assert.deepEqual(branchesOf(odds(chomp({moves: [pool]}))[0]), [[6, '4/5'], [8, '1/5']]);
  assert.equal(odds(chomp({moves: [pool, GROWL]}), lax({types: ['Ghost']}))[0].score, '-20');
});

check('C: move types come from the move table (TYPE_NORMAL is 0): immunity -40, super effective damage', () => {
  const bird = lax({types: ['Flying']});
  assert.deepEqual(table(odds(chomp(), bird)), {Earthquake: [0, '-40'], 'Dragon Claw': [100, '+6/+8']});
  const ai = BuildStateVariables({attacker: chomp(), defender: lax({types: ['Dragon']}), field: {}});
  assert.equal(ai.effectivenessOnPlayer[1], 20);
  assert.ok(ai.attackerDamageRanges[1][0] > ai.attackerDamageRanges[0][15], 'Dragon Claw into a Dragon beats Earthquake');
});

check('locks: Encore and choice lock take 100 % with the Lock label', () => {
  const encored = odds(chomp({moves: [EQ, CLAW, SD], facts: {encoredTurns: 2, encoredMove: 'Dragon Claw', moveNoChoice: 'Dragon Claw'}}));
  assert.deepEqual(table(encored)['Dragon Claw'], [100, 'Lock']);
  const banded = odds(chomp({item: 'Choice Band', moves: [EQ, CLAW, SD], facts: {moveNoChoice: 'Dragon Claw'}}));
  assert.deepEqual(table(banded)['Dragon Claw'], [100, 'Lock']);
  sumsTo100(banded);
});

check('impossible: Taunt (status), Disable, Torment and 0 PP give 0 %', () => {
  const taunted = table(odds(chomp({moves: [EQ, CLAW, SD], facts: {tauntTurns: 3}})));
  assert.deepEqual(taunted['Swords Dance'], [0, '-68']); // -80 (BasicScoring) + 12 (SetupScoring still adds)
  assert.equal(taunted.Earthquake[0], 100);
  // -80, and -40 more: an unusable move is never damage-calced, so effectivenessOnPlayer stays 0 (immune) as in the C.
  const expected = {Earthquake: [0, '-120'], 'Dragon Claw': [100, '+6/+8']};
  assert.deepEqual(table(odds(chomp({facts: {disabledTurns: 2, disabledMove: 'Earthquake'}}))), expected);
  assert.deepEqual(table(odds(chomp({facts: {torment: true, lastUsedMove: 'Earthquake'}}))), expected);
  assert.deepEqual(table(odds(chomp({moves: [{...EQ, pp: 0}, CLAW]}))), expected);
});

check('sums: every result adds to 100, the largest takes the rounding remainder', () => {
  const pulse = mv('Dragon Pulse', 'Dragon', 'Special', 80);
  const rush = mv('Dragon Rush', 'Dragon', 'Physical', 80);
  const three = odds(chomp({moves: [CLAW, pulse, rush]}));
  sumsTo100(three);
  assert.deepEqual(three.map(move => move.percent).sort(), [33, 33, 34]);
});

check('C: Triple Axel rolls each hit (16^3 outcomes), weights sum to one', () => {
  const axel = mv('Triple Axel', 'Ice', 'Physical', 20);
  const ai = BuildStateVariables({attacker: chomp({moves: [axel]}), defender: lax(), field: {}});
  const rolls = ai.attackerRollTables[0];
  assert.ok(rolls.every(roll => 4096n % roll.weight.denominator === 0n) && rolls.some(roll => roll.weight.denominator > 16n), 'expected 16^3 weights');
  const total = rolls.reduce((sum, roll) => sum.add(roll.weight), new Fraction());
  assert.equal(total.numerator, total.denominator);
  assert.equal(Math.max(...rolls.map(roll => roll.damage)), ai.attackerDamageRanges[0][15]);
  sumsTo100(odds(chomp({moves: [axel, CLAW]})));
});

check('review: unusual damage effects, immunity, per-hit assumptions and integer HP', () => {
  const attacker = chomp({level: 51, currentHP: 51});
  const defender = lax({currentHP: 101});
  const adjust = (effect, extra = {}, move = 'Tackle', effectiveness = 10) => calc.BattleAI_AdjustUnusualMoveDamage({...attacker, ...extra}, defender, 11, effect, move, effectiveness);
  for (const [effect, expected] of Object.entries({UP_TO_10_HITS: 33, HIT_THREE_TIMES_ALWAYS_CRITICAL: 33, HIT_THREE_TIMES: 33, MULTI_HIT: 33, LEVEL_DAMAGE_FLAT: 51, RANDOM_DAMAGE_1_TO_150_LEVEL: 51, '10_DAMAGE_FLAT': 20, '40_DAMAGE_FLAT': 40, HIT_TWICE_AND_FLINCH: 22, POISON_MULTI_HIT: 22, HIT_TWICE: 22, HALVE_HP: 50, AVERAGE_HP: 25, SET_HP_EQUAL_TO_USER: 50, ONE_HIT_KO: 101, HIT: 11})) {
    assert.equal(adjust(effect), expected, effect);
    assert.equal(adjust(effect, {}, 'Tackle', 0), 0, effect + ' immunity');
  }
  assert.equal(adjust('UP_TO_10_HITS', {ability: 'Skill Link'}), 110);
  assert.equal(adjust('UP_TO_10_HITS', {item: 'Loaded Dice'}), 55);
  assert.equal(adjust('MULTI_HIT', {ability: 'Skill Link'}), 55);
  assert.equal(adjust('MULTI_HIT', {item: 'Loaded Dice'}), 44);
  assert.equal(adjust('HALVE_HP', {ability: 'Parental Bond'}), 75);
  assert.equal(adjust('LEVEL_DAMAGE_FLAT', {ability: 'Parental Bond'}), 102);
  assert.equal(adjust('HIT_TWICE', {}, 'Dragon Darts'), 11);
});

check('review: KO checks deliberately ignore Sash, Sturdy and Disguise, but not Ice Face', () => {
  const attacker = chomp();
  for (const extra of [{item: 'Focus Sash'}, {ability: 'Sturdy'}, {ability: 'Disguise'}]) assert.equal(calc.CanAttackerOneShotDefender(250, 'Physical', EQ, attacker, lax(extra)), true);
  assert.equal(calc.CanAttackerOneShotDefender(249, 'Physical', EQ, attacker, lax()), false);
  const ice = lax({ability: 'Ice Face', form: 0});
  assert.equal(calc.CanAttackerOneShotDefender(999, 'Physical', EQ, attacker, ice), false);
  assert.equal(calc.CanAttackerOneShotDefender(999, 'Special', EQ, attacker, ice), true);
  assert.equal(calc.CanAttackerOneShotDefender(999, 'Physical', EQ, {...attacker, ability: 'Mold Breaker'}, ice), true);
});

check('fix: Parental Bond uses the C blacklist, not an optional caller flag', () => {
  const attacker = chomp({ability: 'Parental Bond'}), defender = lax();
  const state = {attacker, defender, field: {}};
  for (const name of ['Bullet Seed', 'Dragon Darts', 'Beat Up', 'Fissure', 'Fling', 'Explosion', 'Endeavor', 'Fly', 'Solar Beam', 'Electro Shot', 'Present', 'Max Flare', 'Breakneck Blitz Physical']) assert.equal(BattleAI_IsParentalBondMove(state, {name}), false, name);
  const seed = mv('Bullet Seed', 'Grass', 'Physical', 25, 'MULTI_HIT');
  assert.equal(BattleAI_CalcDamage(state, seed).hitRanges.length, 1);
  assert.equal(BattleAI_CalcDamage(state, CLAW).hitRanges.length, 2);
  assert.equal(BattleAI_IsParentalBondMove({...state, field: {gameType: 'Doubles'}}, {...EQ, target: 'ALL_ADJACENT'}), false);
  assert.equal(BattleAI_IsParentalBondMove({...state, field: {gameType: 'Tag'}}, {...EQ, target: 'ALL_ADJACENT'}), true);
});

check('fix: dynamic Normal moves cannot be converted or boosted by -ate', () => {
  const attacker = chomp({ability: 'Pixilate', facts: {hiddenPowerType: 'Fire'}}), defender = lax();
  const state = {attacker, defender, field: {weather: 'Rain'}};
  for (const [name, type] of [['Hidden Power', 'Fire'], ['Weather Ball', 'Water'], ['Judgment', 'Normal'], ['Techno Blast', 'Normal'], ['Multi-Attack', 'Normal'], ['Terrain Pulse', 'Normal']]) assert.equal(BattleAI_GetDynamicMoveType(state, mv(name, 'Normal', 'Special', 60), attacker), type, name);
  assert.equal(BattleAI_GetDynamicMoveType(state, mv('Hyper Voice', 'Normal', 'Special', 90), attacker), 'Fairy');
  const move = mv('Terrain Pulse', 'Normal', 'Special', 50);
  assert.equal(BattleAI_CalcBaseDamage({...state, field: {}}, move), BattleAI_CalcBaseDamage({...state, field: {}}, move, {...attacker, ability: 'Pressure'}, defender));
});

check('fix: guide slicing/bullet flags and expired Grassy Glide priority', () => {
  const attacker = chomp({ability: 'Sharpness'}), defender = lax();
  const state = {attacker, defender, field: {}};
  const move = mv('Crush Claw', 'Normal', 'Physical', 75, 'LOWER_DEFENSE_HIT', {flags: ['slicing']});
  assert.equal(BattleAI_CalcBaseDamage(state, move), BattleAI_CalcBaseDamage(state, {...move, flags: ['slice']}));
  assert.equal(BattleAI_GetTypeEffectiveness(state, mv('Bullet Seed', 'Grass', 'Physical', 25, 'MULTI_HIT', {flags: ['bullet']}), attacker, {...defender, ability: 'Bulletproof'}), 0);
  const glide = mv('Grassy Glide', 'Grass', 'Physical', 55);
  assert.equal(calc.HasMovePriority({...state, field: {terrain: 'Grassy', terrainTurns: 0}}, attacker, glide, defender), false);
  assert.equal(calc.HasMovePriority({...state, field: {terrain: 'Grassy', terrainTurns: 1}}, attacker, glide, defender), true);
  assert.equal(calc.HasMovePranksterPriority(state, {...attacker, ability: 'Prankster'}, GROWL, {...defender, facts: {sameSide: true}}), false);
});

check('fix: Fly alone does not imply SEMI_INVULNERABLE in the C damage gate', () => {
  const attacker = chomp(), defender = lax({speed: 20, facts: {fly: true}});
  const state = {attacker, defender, field: {}};
  assert.ok(BattleAI_CalcDamage(state, CLAW).damageRange[15] > 0);
  assert.equal(BattleAI_CalcDamage(state, CLAW, attacker, {...defender, facts: {fly: true, semi_invulnerable: true}}).damageRange[15], 0);
  assert.equal(BattleAI_CalcDamage(state, CLAW, attacker, {...defender, facts: {fly: true, semiInvulnerable: true}}).damageRange[15], 0);
  assert.equal(calc.AI_IsClientGrounded(state, {...defender, facts: {effectOfMoves: ['MOVE_EFFECT_FLAG_PHANTOM_FORCE']}}), false);
});

check('fix: item suppression changes damage, speed and choice lock, not raw residual items', () => {
  for (const extra of [{ability: 'Klutz'}, {facts: {embargoFlag: true}}, {field: {magicRoom: true}}]) {
    const {field = {}, ...changes} = extra;
    const attacker = chomp({item: 'Choice Scarf', moves: [EQ, CLAW], facts: {moveNoChoice: 'Dragon Claw'}, ...changes});
    const ai = BuildStateVariables({attacker, defender: lax(), field});
    assert.equal(ai.attackerMon.item, '');
    assert.equal(ai.attackerMon.speed, 130);
    assert.deepEqual(ai.attackerMoveUsable.slice(0, 2), [true, true]);
    assert.notEqual(evaluateSingles({attacker, defender: lax(), field})[1].score, 'Lock');
  }
  const attacker = chomp({item: 'Chesto Berry'}), defender = lax({ability: 'Unnerve'});
  assert.equal(BuildStateVariables({attacker, defender, field: {}}).attackerMon.item, '');
  assert.equal(calc.IsMoveUsable({attacker, defender}, {...attacker, facts: {torment: true, lastUsedMove: 'Earthquake'}}, EQ), false);
  assert.equal(helpers.MonDiesFromResidualDamage({field: {magicRoom: true}}, chomp({item: 'Leftovers', currentHP: 1, totalHP: 160, status: 'brn'})), false);
});

check('fix: screens belong to the damaged side in both damage tables', () => {
  const attacker = chomp(), defender = lax({moves: [CLAW]});
  const build = field => BuildStateVariables({attacker, defender, field});
  const plain = build({}), playerScreen = build({defender: {reflect: true}}), aiScreen = build({attacker: {reflect: true}});
  assert.ok(playerScreen.attackerDamageRanges[0][15] < plain.attackerDamageRanges[0][15]);
  assert.deepEqual(playerScreen.defenderDamageRanges, plain.defenderDamageRanges);
  assert.ok(aiScreen.defenderDamageRanges[0][15] < plain.defenderDamageRanges[0][15]);
  assert.deepEqual(aiScreen.attackerDamageRanges, plain.attackerDamageRanges);
});

check('review: effective Speed modifiers, rounding, stage clamp and explicit held effect', () => {
  const speed = (extra = {}, field = {}, party = false) => { const attacker = chomp({speed: 101, ...extra}); return BattleAI_CalcEffectiveSpeed({attacker, defender: lax(), field}, attacker, 'attacker', party); };
  for (const [extra, field, expected] of [[{status: 'par'}, {}, 51], [{ability: 'Quick Feet', status: 'par'}, {}, 151], [{ability: 'Slow Start'}, {}, 50], [{item: 'Choice Scarf'}, {}, 151], [{item: 'Iron Ball'}, {}, 50], [{item: 'Iron Ball', ability: 'Klutz'}, {}, 101], [{ability: 'Swift Swim'}, {weather: 'Rain'}, 202], [{ability: 'Surge Surfer'}, {terrain: 'Electric'}, 202], [{ability: 'Unburden', facts: {knockOffFlag: true}}, {}, 202], [{ability: 'Quark Drive', facts: {paradoxBoostedStat: 'speed'}}, {}, 151], [{species: 'Ditto', item: 'Quick Powder'}, {}, 202], [{item: 'Choice Scarf', item_held_effect: 'NONE'}, {}, 101], [{statBoosts: {speed: 9}}, {}, 404], [{}, {attacker: {tailwind: true}}, 202]]) assert.equal(speed(extra, field), expected, JSON.stringify([extra, field]));
  assert.equal(speed({ability: 'Contrary'}, {attacker: {stickyWeb: true}}, true), 151);
  assert.equal(speed({}, {attacker: {stickyWeb: true}}, true), 67);
  assert.equal(speed({ability: 'Unburden', item: 'Electric Seed'}, {terrain: 'Electric'}, true), 202);
});

check('review: AI_IsClient2Faster ties, Trick Room, 8192 modulus, Stall and move-last items', () => {
  const compare = (first, second, field = {}) => AI_IsClient2Faster({field}, chomp(first), lax(second));
  assert.equal(compare({speed: 100}, {speed: 100}), 2);
  assert.equal(compare({speed: 200}, {speed: 100}), 0);
  assert.equal(compare({speed: 200}, {speed: 100}, {trickRoom: true}), 1);
  assert.equal(compare({speed: 8193}, {speed: 2}), 1);
  assert.equal(compare({speed: 200, item: 'Lagging Tail'}, {speed: 100}), 1);
  assert.equal(compare({speed: 200, ability: 'Stall'}, {speed: 100, item: 'Lagging Tail'}), 0);
  assert.equal(compare({speed: 200, item: 'Lagging Tail'}, {speed: 100, item: 'Full Incense'}), 1);
  assert.equal(compare({speed: 200, item: 'Lagging Tail'}, {speed: 100, item: 'Full Incense'}, {trickRoom: true}), 0);
});

check('review: residual death nets recovery and source omissions instead of real turn ordering', () => {
  const dies = (extra, field = {}) => helpers.MonDiesFromResidualDamage({field}, chomp({currentHP: 10, totalHP: 160, ...extra}));
  assert.equal(dies({status: 'brn'}), true);
  assert.equal(dies({status: 'brn', item: 'Leftovers'}), false);
  assert.equal(dies({status: 'brn', ability: 'Magic Guard'}), true);
  assert.equal(dies({status: 'tox', ability: 'Poison Heal'}), false);
  assert.equal(dies({status: 'tox', currentHP: 160, facts: {toxicCounter: 15}}), false);
  assert.equal(dies({status: 'tox', currentHP: 150, facts: {toxicCounter: 15}}), true);
  assert.equal(dies({facts: {leechSeed: true}}), true);
  assert.equal(dies({facts: {curse: true}}), true);
  assert.equal(dies({types: ['Normal']}, {weather: 'Sand'}), true);
  assert.equal(dies({types: ['Ground']}, {weather: 'Sand'}), false);
  assert.equal(dies({}, {weather: 'Hail'}), false);
  assert.equal(dies({ability: 'Solar Power'}, {weather: 'Sun'}), true);
  assert.equal(dies({ability: 'Rain Dish', status: 'brn'}, {weather: 'Rain'}), false);
  assert.equal(dies({status: 'brn', types: ['Flying']}, {terrain: 'Grassy'}), false);
});

check('review: helper move lists, positive stages, status and Encore policy', () => {
  assert.equal(helpers.BattlerPositiveStatChangesSum({statBoosts: {attack: 2, defense: -2, accuracy: 1}}), 3);
  assert.equal(helpers.BattlerKnowsMove({moves: [EQ]}, 'Earthquake'), true);
  assert.equal(helpers.BattlerKnowsMoveWithEffect({moves: [SD]}, 'ATK_UP_2'), true);
  for (const [name, checkMove] of [['Iron Head', helpers.BattlerKnowsFlinchingMove], ['Matcha Gotcha', helpers.BattlerKnowsThawingMove], ['Confide', helpers.BattlerHasSoundBasedMove]]) assert.equal(checkMove({moves: [{name}]}), true);
  assert.equal(helpers.IsMonInflictedWithAnyNegativeStatus(chomp({status: 'slp'})), false);
  assert.equal(helpers.IsMonInflictedWithAnyNegativeStatus(chomp({ability: 'Poison Heal', status: 'tox', facts: {curse: true}})), false);
  assert.equal(helpers.IsUsedMoveEncouragedToEncore('Rapid Spin'), true);
  assert.equal(helpers.IsUsedMoveEncouragedToEncore({name: 'Recover', effect: 'RESTORE_HALF_HP'}), true);
  assert.equal(helpers.IsUsedMoveEncouragedToEncore(CLAW), false);
});

check('fix: source trait tables cover Triage, sound and powder without caller hints', () => {
  const attacker = chomp({ability: 'Triage'}), defender = lax();
  const state = {attacker, defender, field: {terrain: 'Psychic'}};
  const punch = mv('Drain Punch', 'Fighting', 'Physical', 75);
  assert.equal(calc.HasMovePriority(state, attacker, punch, defender), true);
  assert.equal(BattleAI_CalcDamage(state, punch).damageRange[15], 0);
  assert.equal(BattleAI_GetTypeEffectiveness(state, mv('Hyper Voice', 'Normal', 'Special', 90), attacker, {...defender, ability: 'Soundproof'}), 0);
  assert.equal(BattleAI_GetTypeEffectiveness(state, mv('Spore', 'Grass', 'Status', 0), attacker, {...defender, types: ['Grass']}), 0);
});

check('fix: QMul retains 32-bit overflow and the assembly identity fast path', () => {
  const attacker = chomp({attack: 65535, level: 255, ability: 'Pressure', item: 'Life Orb'});
  const defender = lax({defense: 1});
  const move = mv('Overflow probe', 'Ground', 'Physical', 65535);
  const state = {attacker, defender, field: {}};
  const base = Number((104n * 65535n * 65535n % 4294967296n) / 50n) + 2;
  assert.equal(BattleAI_CalcBaseDamage(state, move), base);
  const q = (value, modifier) => modifier === 4096n ? value : ((value * modifier + 2047n) % 4294967296n) >> 12n;
  const expected = Array.from({length: 16}, (_, index) => Number(q(q(BigInt(base) * BigInt(85 + index) / 100n, 6144n), 5324n) % 65536n));
  assert.deepEqual(BattleAI_CalcDamage(state, move).damageRange, expected);
});

check('fix: Explosion-family scalar returns differ from the max-roll damage tables', () => {
  for (const name of ['Explosion', 'Self-Destruct', 'Misty Explosion', 'Final Gambit']) {
    const move = mv(name, 'Normal', 'Physical', 250);
    const ai = BuildStateVariables({attacker: chomp({moves: [move, CLAW]}), defender: lax({moves: [move]}), field: {}});
    assert.ok(ai.attackerDamageRanges[0][15] > 0);
    assert.ok(ai.defenderDamageRanges[0][15] > 0);
    assert.ok(ai.attackerRollTables[0].every(roll => roll.damage === 0 && !roll.canOneShot));
  }
});

await mkdir(new URL('../../.tmp/ai-engine/', import.meta.url), {recursive: true});

await mkdir(new URL('../../.tmp/ai-engine/', import.meta.url), {recursive: true});
await writeFile(new URL('../../.tmp/ai-engine/results.json', import.meta.url), JSON.stringify({results}, null, 2));
const failed = results.filter(result => result.status === 'fail').length;
console.log(`Hardlove AI: ${results.length - failed}/${results.length} passed`);
if (failed) process.exitCode = 1;

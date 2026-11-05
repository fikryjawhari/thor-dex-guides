import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {Fraction, enumerateRandomBranches, highestScoreOdds, enumerateDamageScores, roundedPercentages, scoreLabel} from '../../template/calc/ai/enumerate.mjs';
import {evaluateSingles as evaluateSinglesResult, BuildStateVariables, CalculateSwitch, getVarianceFromDamage} from '../../template/calc/ai/hardlove/index.mjs';
const evaluateSingles = (state, options) => evaluateSinglesResult(state, options).moves;
import {FindTargets, ChooseMove, doublesPickOrder, pickDoublesMon, presentDoublesMon, evaluateDoubles} from '../../template/calc/ai/hardlove/doubles.mjs';
import {switchInOrder, BattleAI_PostKOSwitchIn_Internal, getNormalScore, FillDamageStructFromPartyMon} from '../../template/calc/ai/hardlove/postKO.mjs';
import {BattleAI_CalcBaseDamage, BattleAI_CalcDamage, BattleAI_GetDynamicMoveType, BattleAI_GetTypeEffectiveness, BattleAI_IsParentalBondMove} from '../../template/calc/ai/hardlove/damage.mjs';
import * as calc from '../../template/calc/ai/hardlove/calc.mjs';
import {SOURCE_MOVE_TRAITS} from '../../template/calc/ai/hardlove/damage-data.mjs';
import * as helpers from '../../template/calc/ai/hardlove/helpers.mjs';
import {BattleAI_CalcEffectiveSpeed, AI_IsClient2Faster} from '../../template/calc/ai/hardlove/speed.mjs';
import {BasicScoring, DamagingMoveScoring, HarassmentScoring, RecoveryScoring, shouldRecover, GetRecoverAmountPercent, ScoreMovesAgainstAlly} from '../../template/calc/ai/hardlove/scoring.mjs';

const results = [];
check('review: source punching table deliberately substitutes Growl for Double Shock', () => {
  assert.equal(SOURCE_MOVE_TRAITS.punch.has('GROWL'), true);
  assert.equal(SOURCE_MOVE_TRAITS.punch.has('DOUBLESHOCK'), false);
});
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

const scoringBranches = (scorer, move, atk = {}, def = {}, field = {}, facts = {}) => {
  const state = {attacker: chomp({moves: [move], ...atk}), defender: lax(def), field, facts};
  const ai = BuildStateVariables(state);
  return enumerateRandomBranches(random => scorer(state, 0, {...ai}, random)).map(branch => [branch.score, `${branch.weight.numerator}/${branch.weight.denominator}`]);
};
const THUNDER_WAVE = mv('Thunder Wave', 'Electric', 'Status', 0, 'STATUS_PARALYZE');
const WISP = mv('Will-O-Wisp', 'Fire', 'Status', 0, 'STATUS_BURN');
const SPORE = mv('Spore', 'Grass', 'Status', 0, 'STATUS_SLEEP');
const TOXIC = mv('Toxic', 'Poison', 'Status', 0, 'STATUS_BADLY_POISON');
const HEX = mv('Hex', 'Ghost', 'Special', 65);
const RECOVER = mv('Recover', 'Normal', 'Status', 0, 'RESTORE_HALF_HP');

check('doc: paralysis +7 or +8 with an independent 50% subtraction', () => {
  assert.deepEqual(scoringBranches(HarassmentScoring, THUNDER_WAVE), [[6, '1/2'], [7, '1/2']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, THUNDER_WAVE, {}, {speed: 200}), [[7, '1/2'], [8, '1/2']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, THUNDER_WAVE, {moves: [THUNDER_WAVE, HEX]}), [[7, '1/2'], [8, '1/2']]);
  assert.deepEqual(scoringBranches(BasicScoring, THUNDER_WAVE, {}, {types: ['Electric']}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(BasicScoring, THUNDER_WAVE, {}, {types: ['Ground']}), [[-20, '1/1']]);
});

check('doc: burn checks physical moves and Hex on the same one-third branch', () => {
  assert.deepEqual(scoringBranches(HarassmentScoring, WISP), [[6, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, WISP, {}, {moves: [CLAW]}), [[6, '2/3'], [7, '1/3']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, WISP, {moves: [WISP, HEX]}, {moves: [CLAW]}), [[6, '2/3'], [8, '1/3']]);
  for (const def of [{status: 'brn'}, {types: ['Fire']}, {ability: 'Water Veil'}]) assert.deepEqual(scoringBranches(BasicScoring, WISP, {}, def), [[-20, '1/1']]);
});

check('doc: sleep support, Prankster, Yawn and poison support branches', () => {
  assert.deepEqual(scoringBranches(HarassmentScoring, SPORE), [[6, '3/4'], [7, '1/4']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, SPORE, {ability: 'Prankster', moves: [SPORE, HEX, mv('Dream Eater', 'Psychic', 'Special', 100)]}), [[8, '3/4'], [11, '1/4']]);
  const yawn = mv('Yawn', 'Normal', 'Status', 0, 'STATUS_SLEEP_NEXT_TURN');
  assert.deepEqual(scoringBranches(HarassmentScoring, yawn, {ability: 'Prankster'}), [[6, '3/4'], [7, '1/4']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, TOXIC, {moves: [TOXIC, HEX]}), [[6, '2/3'], [8, '1/3']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, TOXIC, {moves: [TOXIC, HEX]}, {currentHP: 50}), [[6, '1/1']]);
  assert.deepEqual(scoringBranches(BasicScoring, SPORE, {}, {ability: 'Insomnia'}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(BasicScoring, SPORE, {}, {types: ['Grass']}), [[-40, '1/1']]);
  assert.deepEqual(scoringBranches(BasicScoring, SPORE, {}, {}, {terrain: 'Electric'}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(BasicScoring, TOXIC, {}, {types: ['Steel']}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(BasicScoring, TOXIC, {ability: 'Corrosion'}, {types: ['Steel']}), [[0, '1/1']]);
});

check('doc: confusion and Leech Seed bonuses plus existing-status restrictions', () => {
  const confuse = mv('Confuse Ray', 'Ghost', 'Status', 0, 'STATUS_CONFUSE');
  const seed = mv('Leech Seed', 'Grass', 'Status', 0, 'STATUS_LEECH_SEED');
  assert.deepEqual(scoringBranches(HarassmentScoring, confuse), [[6, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, confuse, {}, {status: 'par'}), [[8, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, seed), [[7, '1/2'], [8, '1/2']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, seed, {}, {status: 'psn', facts: {confusion: true}}), [[9, '1/2'], [10, '1/2']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, seed, {}, {facts: {leechSeed: true}}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, seed, {}, {types: ['Grass']}), [[-20, '1/1']]);
});

check('doc: hazard scores, first-turn odds, existing layers and terminal restrictions', () => {
  for (const [name, effect, key, maximum] of [['Stealth Rock', 'STEALTH_ROCK', 'stealthRock', 1], ['Spikes', 'SET_SPIKES', 'spikes', 3], ['Toxic Spikes', 'TOXIC_SPIKES', 'toxicSpikes', 2], ['Sticky Web', 'STICKY_WEB', 'stickyWeb', 1]]) {
    const move = mv(name, 'Normal', 'Status', 0, effect);
    const facts = {livingMembersDefender: 6};
    const web = effect === 'STICKY_WEB';
    assert.deepEqual(scoringBranches(HarassmentScoring, move, {}, {}, {}, facts), [[6, '1/4'], [web ? 9 : 7, '3/4']], name);
    assert.deepEqual(scoringBranches(HarassmentScoring, move, {facts: {firstTurnOut: true}}, {}, {}, facts), [[web ? 9 : 8, '1/4'], [web ? 12 : 9, '3/4']], name);
    assert.deepEqual(scoringBranches(BasicScoring, move, {}, {}, {defender: {[key]: maximum}}, facts), [[-20, '1/1']], name);
    assert.deepEqual(scoringBranches(BasicScoring, move), [[-20, '1/1']], name + ' final foe');
    assert.deepEqual(scoringBranches(BasicScoring, move, {}, {ability: 'Magic Bounce'}, {}, facts), [[-20, '1/1']], name + ' bounce');
    assert.deepEqual(scoringBranches(BasicScoring, move, {ability: 'Mold Breaker'}, {ability: 'Magic Bounce'}, {}, facts), [[0, '1/1']], name + ' mold breaker');
    if (maximum > 1) assert.deepEqual(scoringBranches(HarassmentScoring, move, {}, {}, {defender: {[key]: 1}}, facts), [[5, '1/4'], [6, '3/4']], name + ' extra layer');
  }
});

check('doc: standard recovery thresholds, toxic, Heal Block, full HP and pending Wish', () => {
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 50}), [[7, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 75}), [[5, '1/2'], [7, '1/2']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 60}), [[5, '1/2'], [7, '1/2']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 99}), [[5, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 128}), [[-1, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 50, status: 'tox'}), [[5, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {currentHP: 50, facts: {healBlockTurns: 2}}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, mv('Wish', 'Normal', 'Status', 0, 'HEAL_IN_3_TURNS'), {currentHP: 50, facts: {wishCount: 1}}), [[-80, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, RECOVER, {speed: 20, currentHP: 90}), [[5, '1/4'], [7, '3/4']]);
});

check('doc: recovery uses max incoming damage, healing cap, and strict thresholds', () => {
  const state = {attacker: chomp({moves: [RECOVER], currentHP: 60}), defender: lax(), field: {}};
  const ai = BuildStateVariables(state);
  assert.equal(shouldRecover(state, 0, {...ai, aiMovesFirst: true, playerCanOneShotMonWithAnyMove: true, maxDamageReceived: 74}, () => 0), 1);
  assert.equal(shouldRecover(state, 0, {...ai, aiMovesFirst: true, playerCanOneShotMonWithAnyMove: true, maxDamageReceived: 75}, () => 0), 1);
  assert.equal(shouldRecover(state, 0, {...ai, aiMovesFirst: true, playerCanOneShotMonWithAnyMove: true, maxDamageReceived: 76}, () => 0), 0);
  assert.equal(shouldRecover(state, 0, {...ai, aiMovesFirst: false, maxDamageReceived: 0}, () => 0), 1);
});

check('doc: weather recovery amounts and Rest sleep support/terrain restrictions', () => {
  const synthesis = mv('Synthesis', 'Grass', 'Status', 0, 'HEAL_HALF_DIFFERENT_IN_WEATHER');
  const shore = {...synthesis, name: 'Shore Up'};
  for (const [move, weather, expected] of [[synthesis, 'Sun', 67], [synthesis, 'Rain', 25], [synthesis, '', 50], [shore, 'Sand', 67], [shore, 'Sun', 50]]) assert.deepEqual(scoringBranches(GetRecoverAmountPercent, move, {}, {}, {weather}), [[expected, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, synthesis, {currentHP: 50}, {}, {weather: 'Sun'}), [[7, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, synthesis, {currentHP: 50}, {}, {weather: 'Rain'}), [[5, '1/1']]);
  const rest = mv('Rest', 'Psychic', 'Status', 0, 'RECOVER_HEALTH_AND_SLEEP');
  assert.deepEqual(scoringBranches(RecoveryScoring, rest, {currentHP: 50}), [[7, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, rest, {currentHP: 50, item: 'Chesto Berry'}), [[8, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, rest, {currentHP: 50, status: 'tox'}), [[7, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, rest, {currentHP: 50}, {}, {terrain: 'Electric'}), [[-80, '1/1']]);
  assert.deepEqual(scoringBranches(RecoveryScoring, rest, {currentHP: 50}, {}, {terrain: 'Electric', terrainTurns: 0}), [[7, '1/1']]);
});

check('status/recovery/hazards: mixed four-slot odds remain exact, finite and sum to 100', () => {
  for (const moves of [[THUNDER_WAVE, WISP, SPORE, TOXIC], [RECOVER, WISP, mv('Spikes', 'Ground', 'Status', 0, 'SET_SPIKES'), CLAW]]) {
    const result = evaluateSingles({attacker: chomp({currentHP: 75, moves}), defender: lax(), field: {}, facts: {livingMembersDefender: 6}});
    sumsTo100(result);
    assert.deepEqual(result.reduce((sum, row) => sum.add(new Fraction(BigInt(row.exact.numerator), BigInt(row.exact.denominator))), zero).toJSON(), one.toJSON());
  }
});

check('review: IV Hidden Power type and Paradox helper preserve C order, ties and u8 arguments', () => {
  assert.equal(calc.GetHiddenPowerType(0, 0, 0, 0, 0, 0), 'Fighting');
  assert.equal(calc.GetHiddenPowerType(31, 31, 31, 31, 31, 31), 'Dark');
  assert.equal(calc.GetHiddenPowerType(31, 30, 31, 30, 31, 30), 'Bug');
  assert.equal(calc.BattleAI_GetHighestParadoxStat(100, 100, 100, 100, 100), 'attack');
  assert.equal(calc.BattleAI_GetHighestParadoxStat(100, 101, 101, 101, 101), 'defense');
  assert.equal(calc.BattleAI_GetHighestParadoxStat(100, 100, 100, 100, 200), 'speed');
  assert.equal(calc.BattleAI_GetHighestParadoxStat(200, 300, 100, 100, 100), 'attack');
});

check('C vs doc: Rest does not reject Insomnia/Leaf Guard/asleep; Wish/terrain use -80', () => {
  const rest = mv('Rest', 'Psychic', 'Status', 0, 'RECOVER_HEALTH_AND_SLEEP');
  for (const extra of [{ability: 'Insomnia'}, {ability: 'Vital Spirit'}, {ability: 'Comatose'}, {ability: 'Leaf Guard'}, {status: 'slp'}]) assert.deepEqual(scoringBranches(RecoveryScoring, rest, {currentHP: 50, ...extra}), [[7, '1/1']]);
});

check('review: AI formula deliberately omits Wonder Room, sports and Ruin', () => {
  const attacker = chomp(), defender = lax({defense: 150, spDefense: 50});
  const state = {attacker, defender, field: {}};
  const reference = BattleAI_CalcBaseDamage(state, CLAW);
  assert.equal(BattleAI_CalcBaseDamage({...state, field: {wonderRoom: true, waterSport: true, mudSport: true}}, CLAW), reference);
  for (const ability of ['Sword of Ruin', 'Beads of Ruin', 'Tablets of Ruin', 'Vessel of Ruin']) assert.equal(BattleAI_CalcBaseDamage(state, CLAW, {...attacker, ability}, defender), reference);
});

await mkdir(new URL('../../.tmp/ai-engine/', import.meta.url), {recursive: true});
const doubleState = extra => ({foes: [chomp({moves: [CLAW]}), chomp({speed: 80, moves: [CLAW]})], players: [lax(), lax()], field: {}, ...extra});

check('doubles faster: target-first ties then tied move, not uniform across all pairs', () => {
  assert.deepEqual(FindTargets([{score: 1006, mask: 3}, {score: 1006, mask: 1}, {score: 0, mask: 15}]), [0, 1]);
  assert.deepEqual(ChooseMove({mask: 3}).map(move => [move.index, exact(move.weight)]), [[0, {numerator: '1', denominator: '2'}], [1, {numerator: '1', denominator: '2'}]]);
  const state = doubleState();
  const result = presentDoublesMon(state, 0, pickDoublesMon(state, 0));
  assert.deepEqual(result.pairs.filter(pair => pair.target.side === 'player').map(pair => pair.percent), [50, 50]);
  assert.equal(result.pairs.reduce((sum, pair) => sum + pair.percent, 0), 100);
});

check('doubles order: Trick Room, Lagging Tail, Stall and speed tie keep the initial slot', () => {
  assert.deepEqual(doublesPickOrder(doubleState()), [0, 1]);
  assert.deepEqual(doublesPickOrder(doubleState({field: {trickRoom: true}})), [1, 0]);
  assert.deepEqual(doublesPickOrder(doubleState({foes: [chomp({item: 'Lagging Tail'}), chomp({speed: 50})]})), [1, 0]);
  assert.deepEqual(doublesPickOrder(doubleState({foes: [chomp({ability: 'Stall'}), chomp({speed: 50})]})), [1, 0]);
  assert.deepEqual(doublesPickOrder(doubleState({foes: [chomp(), chomp()]})), [0, 1]);
  assert.deepEqual(doublesPickOrder(doubleState({foes: [chomp(), chomp()], firstRequestedSlot: 1})), [1, 0]);
});

check('doubles mixture: 10/16 fast KO rolls ignore P0, otherwise slower picks P0 at 13/16', () => {
  const state = doubleState({players: [lax({currentHP: 60}), lax()]});
  const result = evaluateDoubles(state);
  const pair = result.foes[1].pairs.find(move => move.target.slot === 0);
  assert.deepEqual(pair.exact, {numerator: '39', denominator: '128'});
  assert.equal(result.firstBranches.filter(branch => branch.ignoredPlayer === 0).reduce((total, branch) => total + branch.probability, 0), 5 / 8);
  for (const foe of result.foes) assert.equal(foe.pairs.reduce((total, move) => total + move.percent, 0), 100);
});

check('C partner-ignore (0.8.8): Encore makes the other moves unusable without a Choice lock, so their OHKO no longer counts', () => {
  const weak = mv('Tackle', 'Normal', 'Physical', 1);
  const state = doubleState({foes: [chomp({moves: [CLAW, weak], facts: {encoredTurns: 1, encoredMove: 'Tackle'}}), chomp({speed: 80, moves: [CLAW]})],
    players: [lax({currentHP: 50}), lax()]});
  const result = evaluateDoubles(state);
  assert.ok(result.firstBranches.every(branch => branch.index === 1 && branch.ignoredPlayer === -1));
  assert.equal(result.foes[1].pairs.find(move => move.target.slot === 0).probability, 1);
  const onePlayer = evaluateDoubles({...state, players: [state.players[0], lax({currentHP: 0})]});
  assert.ok(onePlayer.firstBranches.every(branch => branch.ignoredPlayer === -1));
});

check('doc ally: Helping Hand target-first race is 23/48; ally score labels are prefixed A', () => {
  const helping = mv('Helping Hand', 'Normal', 'Status', 0, 'BOOST_ALLY_POWER_BY_50_PERCENT');
  const state = doubleState({foes: [chomp({moves: [CLAW, helping]}), chomp({speed: 80, moves: [CLAW]})]});
  const result = evaluateDoubles(state);
  const pair = result.foes[0].pairs.find(pair => pair.name === 'Helping Hand' && pair.target.side === 'foe');
  assert.deepEqual(pair.exact, {numerator: '23', denominator: '48'});
  assert.equal(pair.score, 'A+6/+8');
  assert.ok(result.foes[0].pairs.filter(pair => pair.name === 'Helping Hand' && pair.target.side === 'player').every(pair => pair.probability === 0));
  for (const foe of result.foes) assert.equal(foe.pairs.reduce((sum, pair) => sum + pair.percent, 0), 100);
});

check('doc ally: all support distributions, boosts, healing speed and Weakness Policy', () => {
  const fixture = (move, attackerExtra = {}, allyExtra = {}, playerExtra = {}) => {
    const attacker = chomp({moves: [move], ...attackerExtra});
    const ally = chomp({...allyExtra});
    const state = {attacker, defender: lax(playerExtra), attackerAlly: ally, defenderAlly: lax(), isDoubleBattle: true};
    const ai = BuildStateVariables(state);
    return enumerateRandomBranches(random => ScoreMovesAgainstAlly(state, 0, ai, random)).map(branch => [branch.score, Number(branch.weight)]);
  };
  const status = name => mv(name, 'Normal', 'Status', 0);
  assert.deepEqual(fixture(status('Decorate')), [[1006, 0.5], [1008, 0.5]]);
  assert.deepEqual(fixture(status('Coaching'), {}, {statBoosts: {attack: 2, defense: 2}}), [[1004, 0.5], [1006, 0.5]]);
  assert.deepEqual(fixture(status('Skill Swap'), {}, {species: 'Slaking', ability: 'Truant'}), [[1006, 0.5], [1009, 0.5]]);
  assert.deepEqual(fixture(status('Role Play'), {}, {ability: 'Huge Power'}), [[1009, 0.75], [1012, 0.25]]);
  assert.deepEqual(fixture(status('Heal Pulse'), {}, {currentHP: 75}), [[1007, 1]]);
  assert.deepEqual(fixture(status('Heal Pulse'), {}, {currentHP: 75}, {speed: 200}), [[0, 1]]);
  assert.deepEqual(fixture(mv('Aqua Jet', 'Water', 'Physical', 40), {}, {types: ['Fire'], item: 'Weakness Policy'}), [[1006, 0.25], [1009, 0.5], [1012, 0.25]]);
});

check('C ally quirk: ally scoring bypasses PP, Taunt, Disable and Encore bonuses', () => {
  const move = mv('Helping Hand', 'Normal', 'Status', 0, 'BOOST_ALLY_POWER_BY_50_PERCENT', {pp: 0});
  const state = doubleState({foes: [chomp({moves: [move], facts: {tauntTurns: 1, disabledTurns: 1, disabledMove: move.name}}), chomp({speed: 80, moves: [CLAW]})]});
  const result = evaluateDoubles(state);
  assert.equal(result.foes[0].pairs.find(pair => pair.target.side === 'foe').percent, 100);
});

check('post-KO: normal score table preserves speed-tie-as-fast and strict damage inequalities', () => {
  assert.equal(getNormalScore(2, true, true, 100, 100), 5);
  assert.equal(getNormalScore(1, false, false, 50, 50), 3);
  assert.equal(getNormalScore(1, false, false, 49, 50), 1);
  assert.equal(getNormalScore(0, true, false, 100, 0), 4);
  assert.equal(getNormalScore(0, false, false, 50, 50), 0);
  assert.equal(getNormalScore(0, false, true, 101, 100), 2);
  assert.equal(getNormalScore(0, false, true, 100, 100), -1);
});

check('post-KO: both players summed, dead targets omitted, ties first slot and double KO skips first', () => {
  const state = doubleState();
  const bench = [chomp({speed: 150}), chomp({speed: 150}), chomp({speed: 10})];
  state.foeParty = [...state.foes, ...bench];
  state.foePartySlots = [0, 1];
  const result = BattleAI_PostKOSwitchIn_Internal(state);
  assert.equal(result.candidates[0].scores[0].score, 106);
  assert.deepEqual(switchInOrder(state).order, [2, 3, 4]);
  assert.deepEqual(switchInOrder({...state, reservedPartySlots: [2]}).order, [3, 4]);
  assert.deepEqual(switchInOrder({...state, foes: state.foes.map(mon => ({...mon, currentHP: 0}))}).order, [2, 3, 4]);
  const down = {...state, players: [lax({currentHP: 0}), lax()]};
  assert.equal(BattleAI_PostKOSwitchIn_Internal(down).candidates[0].scores[0].score, 103);
  assert.deepEqual(switchInOrder({...down, players: down.players.map(mon => ({...mon, currentHP: 0}))}).order, [2, 3, 4]);
});

check('post-KO: Zoroark random bonus yields per-rank rational probabilities', () => {
  const active = chomp();
  const state = {attacker: active, defender: lax(), attackerParty: [active, chomp(), chomp({species: 'Zoroark'})]};
  const ranking = switchInOrder(state);
  assert.equal(ranking.order, null);
  assert.deepEqual(ranking.ranks[1].ranks.map(rank => rank.exact), [{numerator: '2', denominator: '3'}, {numerator: '1', denominator: '3'}]);
  assert.equal(ranking.orders.length, 2);
  assert.deepEqual(switchInOrder({...state, reservedPartySlots: [1]}).order, [2]);
});

check('post-KO: party snapshot resets battle boosts/history; raw held item and entry speed retained', () => {
  const state = {attacker: chomp(), defender: lax(), field: {magicRoom: true, attacker: {stickyWeb: true}}};
  const mon = chomp({item: 'Choice Scarf', statBoosts: {attack: 6, speed: 6}, facts: {firstTurnOut: false, flashFireActivated: true, metronomeTurns: 4}});
  const party = FillDamageStructFromPartyMon(state, mon, true);
  assert.equal(party.item, 'Choice Scarf');
  assert.equal(party.states.attack, 0);
  assert.equal(party.speed, 129);
  assert.equal(party.firstTurnOut, true);
  assert.equal(party.isSwitching, true);
  assert.equal(party.facts.metronomeTurns, undefined);
});

check('hard switch: party producer supplies post-KO score, rank and variance without synthetic AI facts', () => {
  const attacker = chomp({moves: [CLAW]});
  const defender = lax({moves: [EQ], attack: 400});
  const bench = chomp({types: ['Flying'], speed: 150, moves: [mv('Dragon Claw', 'Dragon', 'Physical', 500)]});
  const state = {attacker, defender, attackerParty: [attacker, bench]};
  const best = BattleAI_PostKOSwitchIn_Internal(state, {calcWithHighestDamageHit: true}).choices[0];
  assert.equal(best.score, 106);
  assert.equal(best.highestDamageHitPrct, 1);
  assert.equal(evaluateSinglesResult(state).switch.percent, 34);
});

check('post-KO: two Zoroark reroll on each successive call, rather than freezing a sampled sorting key', () => {
  const active = chomp();
  const state = {attacker: active, defender: lax({speed: 80}), attackerParty: [active,
    chomp({species: 'Zoroark'}), chomp({species: 'Zoroark'}), chomp({speed: 10, moves: [mv('Dragon Claw', 'Dragon', 'Physical', 500)]})]};
  const result = switchInOrder(state);
  const orders = Object.fromEntries(result.orders.map(order => [order.partySlots.join(','), order.exact]));
  assert.deepEqual(orders['1,2,3'], {numerator: '10', denominator: '27'});
  assert.deepEqual(orders['1,3,2'], {numerator: '5', denominator: '27'});
  assert.deepEqual(orders['2,1,3'], {numerator: '2', denominator: '9'});
  assert.deepEqual(orders['2,3,1'], {numerator: '1', denominator: '9'});
  assert.deepEqual(orders['3,1,2'], {numerator: '2', denominator: '27'});
  assert.deepEqual(orders['3,2,1'], {numerator: '1', denominator: '27'});
});

check('post-KO: Explosion uses maximum range, and opponent-only Wobbuffet bonus is preserved', () => {
  const active = chomp();
  const explosion = mv('Explosion', 'Normal', 'Physical', 250, 'SELFDESTRUCT');
  const state = {attacker: active, defender: lax(), attackerParty: [active, chomp({moves: [explosion], attack: 500})]};
  const candidate = BattleAI_PostKOSwitchIn_Internal(state).candidates[0];
  assert.equal(candidate.matchups[0].outgoingKO, true);
  assert.equal(candidate.scores[0].score, 105);
  const double = doubleState();
  double.players = [lax({moves: []}), lax({moves: [CLAW], attack: 1000})];
  double.foeParty = [...double.foes, chomp({species: 'Wobbuffet'})];
  double.foePartySlots = [0, 1];
  const opposite = BattleAI_PostKOSwitchIn_Internal(double).candidates[0].scores[0].score;
  const across = BattleAI_PostKOSwitchIn_Internal({...double, attackerSlot: 1}).candidates[0].scores[0].score;
  assert.equal(opposite - across, 2);
});

check('doubles: known Helping Hand affects slower damage before KO detection', () => {
  const state = doubleState({players: [lax({currentHP: 80}), lax()]});
  const move = mv('Helping Hand', 'Normal', 'Status', 0, 'BOOST_ALLY_POWER_BY_50_PERCENT');
  const normal = pickDoublesMon(state, 1);
  const boosted = pickDoublesMon(state, 1, {partnerMove: move});
  const ordinary = normal.targets.find(target => target.target.side === 'player' && target.target.slot === 0);
  const helped = boosted.targets.find(target => target.target.side === 'player' && target.target.slot === 0);
  assert.equal(ordinary.ai.attackerRollTables[0].some(roll => roll.canOneShot), false);
  assert.equal(helped.ai.attackerRollTables[0].every(roll => roll.canOneShot), true);
});

check('hard switch: rolled any-KO and the global switch coin remain correlated', () => {
  const state = {attacker: chomp({moves: [CLAW]}), defender: lax({currentHP: 60, moves: [EQ], attack: 400}),
    facts: {livingMembersAttacker: 2, highestPostKoScoreFromParty: 104, highestDamageHitPrct: 17}};
  const result = evaluateSinglesResult(state);
  assert.deepEqual(result.switch.exact, {numerator: '27', denominator: '800'});
  assert.deepEqual(result.moves[0].exact, {numerator: '773', denominator: '800'});
});

check('hard switch: a valid pivot spends the switch coin on +3 scoring instead of hard switching', () => {
  const move = mv('U-turn', 'Bug', 'Physical', 1, 'SWITCH_HIT');
  const state = {attacker: chomp({moves: [move, CLAW]}), defender: lax(),
    facts: {livingMembersAttacker: 2, highestPostKoScoreFromParty: 106, highestDamageHitPrct: 1}};
  const result = evaluateSinglesResult(state);
  assert.equal(result.switch.percent, 0);
  assert.deepEqual(result.moves[0].exact, {numerator: '47', denominator: '80'});
  assert.equal(result.moves[0].score, '+6/+9');
  assert.deepEqual(result.moves[0].branches.map(branch => branch.exact), [{numerator: '33', denominator: '50'}, {numerator: '17', denominator: '50'}]);
});

check('doubles: opposite ally weather/item abilities and side-specific incoming damage are respected', () => {
  const state = doubleState({foes: [chomp({ability: 'Swift Swim', speed: 60}), chomp({speed: 100})],
    players: [lax(), lax({ability: 'Cloud Nine'})], field: {weather: 'Rain'}});
  assert.deepEqual(doublesPickOrder(state), [1, 0]);
  const ai = BuildStateVariables({attacker: chomp({item: 'Sitrus Berry'}), defender: lax(),
    attackerAlly: chomp(), defenderAlly: lax({ability: 'Unnerve'}), isDoubleBattle: true});
  assert.equal(ai.attackerMon.item, '');
  const balloon = FillDamageStructFromPartyMon({attacker: chomp(), defender: lax(), field: {magicRoom: true}}, chomp({item: 'Air Balloon'}));
  assert.equal(balloon.isGrounded, false);
  const pair = {attacker: chomp(), defender: lax({moves: [mv('Water Pulse', 'Water', 'Special', 60)]}), isDoubleBattle: true,
    attackerAlly: chomp({ability: 'Battery'}), defenderAlly: lax({ability: 'Pressure'})};
  const unboosted = BuildStateVariables(pair).maxDamageReceived;
  assert.equal(BuildStateVariables({...pair, attackerAlly: chomp({ability: 'Pressure'})}).maxDamageReceived, unboosted);
  assert.ok(BuildStateVariables({...pair, defenderAlly: lax({ability: 'Battery'})}).maxDamageReceived > unboosted);
});

check('API: inputs stay immutable, JSON serializes and merged self targets still total 100', () => {
  const state = doubleState({foes: [chomp({moves: [mv('Milk Drink', 'Normal', 'Status', 0, 'RESTORE_HALF_HP')], currentHP: 30}), chomp({speed: 80})]});
  const before = JSON.stringify(state);
  const result = evaluateDoubles(state);
  assert.equal(JSON.stringify(state), before);
  assert.ok(JSON.stringify(result).length > 0);
  const pairs = result.foes[0].pairs;
  assert.ok(pairs.every(pair => pair.target.side === 'foe'));
  assert.equal(new Set(pairs.map(pair => `${pair.index}:${pair.target.side}:${pair.target.slot}`)).size, pairs.length);
  assert.equal(pairs.reduce((total, pair) => total + pair.percent, 0), 100);
});

check('doubles: opposite-slot KO check wins even when faster picks the across target', () => {
  const state = doubleState({players: [lax({currentHP: 50}), lax({currentHP: 50})]});
  const result = evaluateDoubles(state);
  assert.ok(result.firstBranches.every(branch => branch.ignoredPlayer === 0));
  assert.ok(result.firstBranches.some(branch => branch.target.side === 'player' && branch.target.slot === 1));
  const swapped = evaluateDoubles({...state, foes: [state.foes[1], state.foes[0]]});
  assert.ok(swapped.firstBranches.every(branch => branch.ignoredPlayer === 1));
});

check('doubles: Encore/choice lock, Taunt, Disable, Torment and zero PP follow defender scoring', () => {
  const tackle = mv('Tackle', 'Normal', 'Physical', 40);
  for (const facts of [{encoredTurns: 1, encoredMove: 'Tackle'}, {moveNoChoice: 'Tackle'}]) {
    const state = doubleState({foes: [chomp({moves: [CLAW, tackle], item: 'Choice Band', facts}), chomp({speed: 80, moves: [CLAW]})]});
    const result = evaluateDoubles(state).foes[0];
    assert.equal(result.pairs.filter(pair => pair.name === 'Tackle').reduce((sum, pair) => sum + pair.probability, 0), 1);
    assert.ok(result.pairs.filter(pair => pair.name === 'Tackle' && pair.target.side === 'player').every(pair => pair.score === 'Lock'));
  }
  for (const extra of [{facts: {disabledTurns: 1, disabledMove: 'Dragon Claw'}}, {facts: {torment: true, lastUsedMove: 'Dragon Claw'}}, {moves: [{...CLAW, pp: 0}, tackle]}]) {
    const state = doubleState({foes: [chomp({moves: [CLAW, tackle], ...extra}), chomp({speed: 80, moves: [CLAW]})]});
    assert.ok(evaluateDoubles(state).foes[0].pairs.filter(pair => pair.name === 'Dragon Claw').every(pair => pair.probability === 0));
  }
  const taunted = doubleState({foes: [chomp({moves: [CLAW, SD], facts: {tauntTurns: 1}}), chomp({speed: 80, moves: [CLAW]})]});
  assert.ok(evaluateDoubles(taunted).foes[0].pairs.filter(pair => pair.name === 'Swords Dance').every(pair => pair.probability === 0));
});

check('doubles: four-slot mixed damage and support scores are finite and exact', () => {
  const state = doubleState({foes: [chomp({moves: [EQ, CLAW, SD, mv('Helping Hand', 'Normal', 'Status', 0, 'BOOST_ALLY_POWER_BY_50_PERCENT')]}),
    chomp({speed: 80, moves: [CLAW, mv('Aqua Jet', 'Water', 'Physical', 40), mv('Coaching', 'Fighting', 'Status', 0), mv('Protect', 'Normal', 'Status', 0, 'PROTECT')]})]});
  const result = evaluateDoubles(state, {digits: 2});
  for (const foe of result.foes) {
    const sum = foe.pairs.reduce((total, pair) => total.add(new Fraction(pair.exact.numerator, pair.exact.denominator)), zero);
    assert.deepEqual(exact(sum), exact(one));
    assert.ok(Math.abs(foe.pairs.reduce((total, pair) => total + pair.percent, 0) - 100) < 1e-8);
    assert.ok(foe.pairs.every(pair => Number.isFinite(pair.probability)));
  }
});

check('double KO: source slot-sensitive Wobbuffet exception recomputes the second call without entry effects', () => {
  const state = doubleState({players: [lax({moves: []}), lax({moves: [CLAW], attack: 1000})]});
  state.foeParty = [...state.foes, chomp({attack: 2000, moves: [CLAW]}), chomp({species: 'Wobbuffet'}), chomp({species: 'Ditto'})];
  state.foePartySlots = [0, 1];
  state.foes = state.foes.map(mon => ({...mon, currentHP: 0}));
  assert.deepEqual(switchInOrder(state).order, [2, 4, 3]);
  assert.deepEqual(switchInOrder(state, {replacementSlots: [0]}).order, [2, 3, 4]);
});

check('doubles: fainted ally leaves one active picker, both player targets, and no partner-ignore', () => {
  const state = doubleState({foes: [chomp({moves: [CLAW]}), chomp({currentHP: 0})], players: [lax({currentHP: 50}), lax()]});
  const result = evaluateDoubles(state);
  assert.deepEqual(result.order, [0]);
  assert.equal(result.foes.length, 1);
  assert.ok(result.foes[0].pairs.every(pair => pair.target.side === 'player'));
  assert.ok(result.firstBranches.every(branch => branch.ignoredPlayer === -1));
  assert.equal(result.foes[0].switch.percent, 0);
});

check('API: singles rejects doubles and no living player requests switch-in ranking instead', () => {
  assert.throws(() => evaluateSinglesResult({attacker: chomp(), defender: lax(), field: {doubles: true}}), /evaluateDoubles/);
  assert.throws(() => evaluateSinglesResult({attacker: chomp(), defender: lax(), attackerAlly: chomp()}), /evaluateDoubles/);
  assert.throws(() => evaluateDoubles(doubleState({players: [lax({currentHP: 0}), lax({currentHP: 0})]})), /switchInOrder/);
  assert.throws(() => switchInOrder({attacker: chomp(), defender: lax(), attackerParty: [chomp(), chomp()]}), /activePartySlots/);
});

check('doubles: positive CalculateSwitch coin affects pivot scores but never creates a hard switch', () => {
  const pivot = mv('U-turn', 'Bug', 'Physical', 1, 'SWITCH_HIT');
  const state = doubleState({foes: [chomp({moves: [pivot, CLAW]}), chomp({speed: 80, moves: [CLAW]})]});
  state.foeParty = [...state.foes, chomp({speed: 150, moves: [mv('Dragon Claw', 'Dragon', 'Physical', 500)]})];
  state.foePartySlots = [0, 1];
  const result = evaluateDoubles(state);
  assert.equal(result.foes[0].switch.percent, 0);
  const pair = result.foes[0].pairs.find(pair => pair.name === 'U-turn' && pair.target.side === 'player');
  assert.equal(pair.score, '+6/+9');
  assert.deepEqual(pair.branches[1].exact, {numerator: '17', denominator: '50'});
});

check('hard switch: hand-calculated integer variance, thresholds and Perish Song', () => {
  const state = {attacker: chomp(), defender: lax()};
  const ai = {...BuildStateVariables(state), livingMembersAttacker: 2, highestPostKoScoreFromParty: 104,
    highestDamageHitPrct: 17, maxDamageReceived: 150, attackerMaxRollDamage: 10, monCanOneShotPlayerWithAnyMove: false};
  assert.equal(getVarianceFromDamage(ai), 19);
  assert.deepEqual(exact(CalculateSwitch(state, ai)), {numerator: '9', denominator: '100'});
  assert.equal(Number(CalculateSwitch(state, {...ai, highestPostKoScoreFromParty: 105})), 0.24);
  assert.equal(Number(CalculateSwitch({...state, attacker: chomp({facts: {perishSong: true}})}, ai)), 0.6);
  assert.equal(Number(CalculateSwitch({...state, attacker: chomp({facts: {perishSong: true}})}, {...ai, highestPostKoScoreFromParty: 106})), 1);
  for (const facts of [{cantEscape: true}, {substitute: true}]) assert.equal(Number(CalculateSwitch({...state, attacker: chomp({facts})}, ai)), 0);
});

check('singles API: switch and all moves have exact total one and rounded total 100', () => {
  const result = evaluateSinglesResult({attacker: chomp({moves: [CLAW]}), defender: lax({moves: [EQ], attack: 400}),
    facts: {livingMembersAttacker: 2, highestPostKoScoreFromParty: 104, highestDamageHitPrct: 17, postKoScoringPosition: 2}});
  assert.equal(result.switch.percent, 9);
  assert.equal(result.switch.partySlot, 2);
  assert.equal(result.moves[0].percent, 91);
  assert.deepEqual(result.moves[0].exact, {numerator: '91', denominator: '100'});
});

// 0.8.8 (4a8d4a6308..f715235073): src/trainerai/{main,calc,pick_command}.c
check('0.8.8: Soak / Magic Powder need a pure type; Trick-or-Treat / Forest\'s Curse any type', () => {
  const SOAK = mv('Soak', 'Water', 'Status', 0, 'CHANGE_TO_WATER_TYPE');
  const POWDER = mv('Magic Powder', 'Psychic', 'Status', 0, 'CHANGE_TO_PSYCHIC_TYPE');
  const TRICK = mv('Trick-or-Treat', 'Ghost', 'Status', 0, 'ADD_TYPE_GHOST');
  const CURSE = mv("Forest's Curse", 'Grass', 'Status', 0, 'ADD_TYPE_GRASS');
  assert.deepEqual(scoringBranches(HarassmentScoring, SOAK, {}, {types: ['Water']}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, SOAK, {}, {types: ['Water', 'Ground']}), [[6, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, POWDER, {}, {types: ['Psychic']}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, POWDER, {}, {types: ['Psychic', 'Fairy']}), [[6, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, TRICK, {}, {types: ['Ghost', 'Dark']}), [[-20, '1/1']]);
  assert.deepEqual(scoringBranches(HarassmentScoring, CURSE, {}, {types: ['Normal']}), [[6, '1/1']]);
});

check('0.8.8: Meteor Beam has no penalty without Power Herb; Snap Trap scores as a binding move', () => {
  const BEAM = mv('Meteor Beam', 'Rock', 'Special', 120);
  const TRAP = mv('Snap Trap', 'Steel', 'Physical', 35, 'BIND_HIT');
  assert.ok(scoringBranches(DamagingMoveScoring, BEAM).every(([score]) => score > -10));
  assert.ok(scoringBranches(DamagingMoveScoring, BEAM, {item: 'Power Herb'}).every(([score]) => score >= 9));
  assert.deepEqual(scoringBranches(DamagingMoveScoring, TRAP, {}, {types: ['Ghost']}).map(([score]) => score), [-20]);
  assert.deepEqual(scoringBranches(DamagingMoveScoring, TRAP).map(([score, weight]) => `${score}:${weight}`).sort(), ['6:4/5', '8:1/5']);
});

check('0.8.8: Thunderclap shares Sucker Punch\'s repeat coin, either move last used', () => {
  const CLAP = mv('Thunderclap', 'Electric', 'Special', 70, 'HIT', {priority: 1});
  const SUCKER = mv('Sucker Punch', 'Dark', 'Physical', 70, 'HIT', {priority: 1});
  const penalised = branches => branches.filter(([score]) => score <= -10).reduce((total, [, weight]) => total + Number(weight.split('/')[0]) / Number(weight.split('/')[1]), 0);
  for (const move of [CLAP, SUCKER]) assert.equal(penalised(scoringBranches(DamagingMoveScoring, move)), 0);
  for (const [move, last] of [[CLAP, 'Thunderclap'], [CLAP, 'Sucker Punch'], [SUCKER, 'Thunderclap'], [SUCKER, 'Sucker Punch']])
    assert.equal(penalised(scoringBranches(DamagingMoveScoring, move, {facts: {lastUsedMove: last}})), 1 / 2, `${move.name} after ${last}`);
});

check('0.8.8: Encore restricts moves without a Choice lock; switch percents cap at 100', () => {
  const attacker = chomp({facts: {encoredTurns: 2, encoredMove: 'Dragon Claw'}});
  assert.equal(calc.IsMoveUsable({attacker, defender: lax()}, attacker, EQ), false);
  assert.equal(calc.IsMoveUsable({attacker, defender: lax()}, attacker, CLAW), true);
  assert.equal(calc.GetCappedDamagePercent(300, 100), 100);
  assert.equal(calc.GetCappedDamagePercent(99, 100), 99);
});

await writeFile(new URL('../../.tmp/ai-engine/results.json', import.meta.url), JSON.stringify({results}, null, 2));
const failed = results.filter(result => result.status === 'fail').length;
console.log(`Hardlove AI: ${results.length - failed}/${results.length} passed`);
if (failed) process.exitCode = 1;

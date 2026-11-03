import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {Fraction, enumerateRandomBranches, highestScoreOdds, enumerateDamageScores, roundedPercentages, scoreLabel} from '../../template/calc/ai/enumerate.mjs';
import {evaluateSingles, BuildStateVariables} from '../../template/calc/ai/hardlove/index.mjs';

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

check('C: Explosion never gets the highest-damage bonus, but its roll still sets the maximum', () => {
  const boom = mv('Explosion', 'Normal', 'Physical', 250, 'HALVE_DEFENSE');
  const tackle = mv('Tackle', 'Normal', 'Physical', 40);
  // 50 % HP: +7 on half the branches; otherwise both 0 and tied (the doc implies Tackle would get +6).
  assert.deepEqual(table(odds(chomp({currentHP: 75, moves: [boom, tackle]}))), {Explosion: [75, '0/+7'], Tackle: [25, '0']});
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

await mkdir(new URL('../../.tmp/ai-engine/', import.meta.url), {recursive: true});
await writeFile(new URL('../../.tmp/ai-engine/results.json', import.meta.url), JSON.stringify({results}, null, 2));
const failed = results.filter(result => result.status === 'fail').length;
console.log(`Hardlove AI: ${results.length - failed}/${results.length} passed`);
if (failed) process.exitCode = 1;

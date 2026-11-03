import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {Fraction, enumerateRandomBranches, highestScoreOdds, enumerateDamageScores, roundedPercentages, scoreLabel} from '../../template/calc/ai/enumerate.mjs';

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

await mkdir(new URL('../../.tmp/ai-engine/', import.meta.url), {recursive: true});
await writeFile(new URL('../../.tmp/ai-engine/results.json', import.meta.url), JSON.stringify({results}, null, 2));
const failed = results.filter(result => result.status === 'fail').length;
console.log(`Hardlove AI: ${results.length - failed}/${results.length} passed`);
if (failed) process.exitCode = 1;

function gcd(first, second) {
  let left = first < 0n ? -first : first;
  let right = second < 0n ? -second : second;
  while (right) [left, right] = [right, left % right];
  return left;
}

export class Fraction {
  constructor(numerator = 0n, denominator = 1n) {
    let top = BigInt(numerator);
    let bottom = BigInt(denominator);
    if (!bottom) throw new RangeError('A probability denominator cannot be zero');
    if (bottom < 0n) { top = -top; bottom = -bottom; }
    const divisor = gcd(top, bottom);
    this.numerator = top / divisor;
    this.denominator = bottom / divisor;
  }
  add(other) {
    return new Fraction(this.numerator * other.denominator + other.numerator * this.denominator, this.denominator * other.denominator);
  }
  subtract(other) {
    return new Fraction(this.numerator * other.denominator - other.numerator * this.denominator, this.denominator * other.denominator);
  }
  multiply(other) {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
  }
  divide(divisor) {
    return new Fraction(this.numerator, this.denominator * BigInt(divisor));
  }
  valueOf() { return Number(this.numerator) / Number(this.denominator); }
  toJSON() { return {numerator: String(this.numerator), denominator: String(this.denominator)}; }
}

const ZERO = new Fraction();
const ONE = new Fraction(1n);
const sum = values => values.reduce((total, value) => total.add(value), ZERO);
const product = values => values.reduce((total, value) => total.multiply(value), ONE);

class BranchPoint {
  constructor(modulus) { this.modulus = modulus; }
}

export function enumerateRandomBranches(evaluate, {maxEvaluations = 1000000} = {}) {
  const scores = new Map();
  const pending = [{trace: [], weight: ONE}];
  let evaluations = 0;
  while (pending.length) {
    if (++evaluations > maxEvaluations) throw new RangeError('Random branch evaluation limit exceeded');
    const {trace, weight} = pending.pop();
    let cursor = 0;
    const random = modulus => {
      if (!Number.isSafeInteger(modulus) || modulus < 1) throw new RangeError('Random modulus must be a positive integer');
      if (cursor === trace.length) throw new BranchPoint(modulus);
      const draw = trace[cursor++];
      if (draw.modulus !== modulus) throw new Error('A random trace changed its branch modulus');
      return draw.value;
    };
    try {
      const score = evaluate(random);
      if (!Number.isSafeInteger(score)) throw new TypeError('A move score must be a finite integer');
      scores.set(score, (scores.get(score) || ZERO).add(weight));
    } catch (error) {
      if (!(error instanceof BranchPoint)) throw error;
      for (let value = 0; value < error.modulus; value++) {
        pending.push({trace: [...trace, {modulus: error.modulus, value}], weight: weight.divide(error.modulus)});
      }
    }
  }
  return [...scores].sort(([left], [right]) => left - right).map(([score, weight]) => ({score, weight}));
}

export function highestScoreOdds(distributions) {
  return distributions.map((candidate, index) => {
    let probability = ZERO;
    for (const {score, weight} of candidate) {
      let polynomial = [ONE];
      for (const [otherIndex, other] of distributions.entries()) {
        if (index === otherIndex) continue;
        const below = sum(other.filter(branch => branch.score < score).map(branch => branch.weight));
        const equal = sum(other.filter(branch => branch.score === score).map(branch => branch.weight));
        const next = Array(polynomial.length + 1).fill(ZERO);
        for (const [degree, coefficient] of polynomial.entries()) {
          next[degree] = next[degree].add(coefficient.multiply(below));
          next[degree + 1] = next[degree + 1].add(coefficient.multiply(equal));
        }
        polynomial = next;
      }
      probability = probability.add(weight.multiply(sum(polynomial.map((coefficient, degree) => coefficient.divide(degree + 1)))));
    }
    return probability;
  });
}

function groupedRolls(table) {
  if (!table.length) throw new RangeError('Each move needs at least one damage outcome');
  const groups = new Map();
  for (const roll of table) {
    if (!Number.isSafeInteger(roll.damage) || roll.damage < 0) throw new RangeError('Damage outcomes must be nonnegative integers');
    const code = `${roll.damage}:${Boolean(roll.canOneShot)}`;
    const weight = roll.weight ?? ONE.divide(table.length);
    const prior = groups.get(code);
    if (prior) prior.weight = prior.weight.add(weight);
    else groups.set(code, {...roll, canOneShot: Boolean(roll.canOneShot), weight});
  }
  const result = [...groups.values()];
  const total = sum(result.map(roll => roll.weight));
  if (total.numerator !== total.denominator) throw new RangeError('Each damage table must sum to one');
  return result;
}

function eventWeight(tables, maximum, anyKO) {
  const mass = (strict, noKO) => product(tables.map(table => sum(table
    .filter(roll => (strict ? roll.damage < maximum : roll.damage <= maximum) && (!noKO || !roll.canOneShot))
    .map(roll => roll.weight))));
  const noKO = mass(false, true).subtract(mass(true, true));
  return anyKO ? mass(false, false).subtract(mass(true, false)).subtract(noKO) : noKO;
}

export function enumerateDamageScores(damageTables, scoreMove) {
  if (!damageTables.length) return [];
  const tables = damageTables.map(groupedRolls);
  const maxima = [...new Set(tables.flatMap(table => table.map(roll => roll.damage)))].sort((left, right) => left - right);
  const totals = tables.map(() => ZERO);
  const scoreWeights = tables.map(() => new Map());
  const cache = new Map();
  for (const maximum of maxima) {
    for (const anyKO of [false, true]) {
      if (!eventWeight(tables, maximum, anyKO).numerator) continue;
      const records = tables.map((table, index) => table.filter(roll => roll.damage <= maximum && (anyKO || !roll.canOneShot)).map(roll => {
        const cacheKey = `${index}:${roll.damage}:${roll.canOneShot}:${maximum}:${anyKO}`;
        if (!cache.has(cacheKey)) cache.set(cacheKey, enumerateRandomBranches(random => scoreMove(index, roll, {maximum, anyKO}, random)));
        const distribution = cache.get(cacheKey);
        const otherTables = tables.map((other, otherIndex) => otherIndex === index ? [{...roll, weight: ONE}] : other);
        const contextWeight = eventWeight(otherTables, maximum, anyKO).multiply(roll.weight);
        if (contextWeight.numerator) {
          for (const branch of distribution) {
            const prior = scoreWeights[index].get(branch.score) || ZERO;
            scoreWeights[index].set(branch.score, prior.add(contextWeight.multiply(branch.weight)));
          }
        }
        return {roll, distribution};
      }));
      const evaluate = (strict, noKO) => {
        const distributions = records.map(perMove => {
          const combined = new Map();
          for (const {roll, distribution} of perMove) {
            if ((strict && roll.damage === maximum) || (noKO && roll.canOneShot)) continue;
            for (const branch of distribution) {
              combined.set(branch.score, (combined.get(branch.score) || ZERO).add(roll.weight.multiply(branch.weight)));
            }
          }
          return [...combined].map(([score, weight]) => ({score, weight}));
        });
        return highestScoreOdds(distributions);
      };
      const closed = evaluate(false, !anyKO);
      const open = evaluate(true, !anyKO);
      const noKOClosed = anyKO ? evaluate(false, true) : null;
      const noKOOpen = anyKO ? evaluate(true, true) : null;
      for (let index = 0; index < totals.length; index++) {
        let contribution = closed[index].subtract(open[index]);
        if (anyKO) contribution = contribution.subtract(noKOClosed[index]).add(noKOOpen[index]);
        totals[index] = totals[index].add(contribution);
      }
    }
  }
  const total = sum(totals);
  if (total.numerator !== total.denominator) throw new Error('Move probabilities did not sum to one');
  return totals.map((weight, index) => ({weight, probability: Number(weight), scores: [...scoreWeights[index]]
    .sort(([left], [right]) => left - right).map(([score, branchWeight]) => ({score, weight: branchWeight}))}));
}

export function highestScoreGroups(distributions) {
  let groups = [{score: -Infinity, mask: 0, weight: ONE}];
  for (const [index, distribution] of distributions.entries()) {
    const next = new Map();
    for (const group of groups) for (const branch of distribution) {
      const score = Math.max(group.score, branch.score);
      const mask = branch.score > group.score ? 1 << index : branch.score === group.score ? group.mask | (1 << index) : group.mask;
      const code = `${score}:${mask}`;
      const weight = group.weight.multiply(branch.weight);
      const prior = next.get(code);
      next.set(code, {score, mask, weight: (prior?.weight ?? ZERO).add(weight)});
    }
    groups = [...next.values()];
  }
  return groups;
}

export function enumerateDamageScoreGroups(damageTables, scoreMove) {
  const tables = damageTables.map(groupedRolls);
  const maxima = [...new Set(tables.flatMap(table => table.map(roll => roll.damage)))];
  const groups = new Map();
  const scores = tables.map(() => new Map());
  for (const maximum of maxima) for (const anyKO of [false, true]) {
    if (!eventWeight(tables, maximum, anyKO).numerator) continue;
    const records = tables.map((table, index) => table.filter(roll => roll.damage <= maximum && (anyKO || !roll.canOneShot)).map(roll => {
      const distribution = enumerateRandomBranches(random => scoreMove(index, roll, {maximum, anyKO}, random));
      const conditional = tables.map((other, otherIndex) => otherIndex === index ? [{...roll, weight: ONE}] : other);
      const weight = eventWeight(conditional, maximum, anyKO).multiply(roll.weight);
      for (const branch of distribution) scores[index].set(branch.score, (scores[index].get(branch.score) ?? ZERO).add(weight.multiply(branch.weight)));
      return {roll, distribution};
    }));
    const accumulate = (strict, noKO, sign) => {
      const distributions = records.map(perMove => {
        const combined = new Map();
        for (const {roll, distribution} of perMove) {
          if ((strict && roll.damage === maximum) || (noKO && roll.canOneShot)) continue;
          for (const branch of distribution) combined.set(branch.score, (combined.get(branch.score) ?? ZERO).add(roll.weight.multiply(branch.weight)));
        }
        return [...combined].map(([score, weight]) => ({score, weight}));
      });
      for (const group of highestScoreGroups(distributions)) {
        const code = `${anyKO}:${group.score}:${group.mask}`;
        const weight = group.weight.multiply(new Fraction(sign));
        const prior = groups.get(code);
        groups.set(code, {...group, anyKO, weight: (prior?.weight ?? ZERO).add(weight)});
      }
    };
    accumulate(false, !anyKO, 1);
    accumulate(true, !anyKO, -1);
    if (anyKO) { accumulate(false, true, -1); accumulate(true, true, 1); }
  }
  return {groups: [...groups.values()].filter(group => group.weight.numerator), scores: scores.map(distribution => [...distribution]
    .filter(([, weight]) => weight.numerator).sort(([left], [right]) => left - right).map(([score, weight]) => ({score, weight})))};
}

export function roundedPercentages(probabilities, digits = 0) {
  if (!Number.isInteger(digits) || digits < 0 || digits > 6) throw new RangeError('Use zero to six percentage decimal places');
  if (!probabilities.length) return [];
  const scale = 10 ** digits;
  const values = probabilities.map(value => Number(value));
  if (values.some(value => !Number.isFinite(value) || value < 0) || Math.abs(values.reduce((total, value) => total + value, 0) - 1) > 1e-10) {
    throw new RangeError('Probabilities must be nonnegative and sum to one');
  }
  const rounded = values.map(value => Math.round(value * 100 * scale));
  const largest = values.indexOf(Math.max(...values));
  rounded[largest] += 100 * scale - rounded.reduce((total, value) => total + value, 0);
  return rounded.map(value => value / scale);
}

export function scoreLabel(scores, locked = false) {
  if (locked) return 'Lock';
  return [...new Set(scores)].sort((left, right) => left - right).map(score => score > 0 ? `+${score}` : String(score)).join('/');
}

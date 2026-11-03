import {Fraction, enumerateDamageScoreGroups, roundedPercentages, scoreLabel} from '../enumerate.mjs';
import {BuildStateVariables} from './state.mjs';
import {scoreMove} from './scoring.mjs';

const ZERO = new Fraction();
const ONE = new Fraction(1n);
export const moveKey = value => String(value?.name ?? value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
export const maskIndices = mask => [0, 1, 2, 3].filter(index => mask & (1 << index));

export function getVarianceFromDamage(ai) {
  if (ai.highestDamageHitPrct <= 0) return 30;
  if (ai.highestDamageHitPrct >= 50) return 0;
  return Math.trunc((50 - ai.highestDamageHitPrct) * 3 / 5);
}

export function CalculateSwitch(state, ai) {
  const facts = state.attacker.facts ?? {};
  if (facts.cantEscape || ai.livingMembersAttacker < 2) return ZERO;
  if (ai.monCanOneShotPlayerWithAnyMove && (ai.aiMovesFirst || (ai.playerMovesFirst && !ai.playerCanOneShotMonWithAnyMove))) return ZERO;
  if (ai.attackerPositiveStatChangesSum > 0 || facts.substitute) return ZERO;
  if (!ai.attackerHasValidSwitchingMove) {
    if (ai.attackerMon.percenthp < 67) return ZERO;
    if (Math.trunc(100 * ai.maxDamageReceived / ai.attackerMon.hp) < Math.trunc(100 * ai.attackerMaxRollDamage / ai.defenderMon.hp)) return ZERO;
  }
  if (ai.highestPostKoScoreFromParty < 103) return ZERO;
  const addon = ai.isDoubleBattle && state.defender.currentHP > 0 && state.allies?.[1]?.currentHP > 0 ? 3 : 0;
  let score = 0;
  if (facts.perishSong) {
    if (ai.highestPostKoScoreFromParty >= 103 + addon) score = 30 * (ai.highestPostKoScoreFromParty - 102 - addon);
  } else if (ai.highestPostKoScoreFromParty === 104 + addon) score = Math.trunc(getVarianceFromDamage(ai) / 2);
  else if (ai.highestPostKoScoreFromParty >= 105 + addon) score = 5 + getVarianceFromDamage(ai);
  return new Fraction(BigInt(Math.max(0, Math.min(100, score))), 100n);
}

export function damageScores(state, baseAi, shouldSwitch = false) {
  return enumerateDamageScoreGroups(baseAi.attackerRollTables.slice(0, state.attacker.moves.length), (index, roll, context, random) => {
    const ai = {...baseAi, shouldSwitch, attackerRolledMaxDamage: context.maximum, monCanOneShotPlayerWithAnyMove: context.anyKO,
      attackerRolledMoveDamages: baseAi.attackerRolledMoveDamages.map((damage, moveIndex) => moveIndex === index ? roll.damage : damage),
      monCanOneShotPlayerWithMove: baseAi.monCanOneShotPlayerWithMove.map((canKO, moveIndex) => moveIndex === index ? roll.canOneShot : canKO)};
    return scoreMove(state, index, ai, random);
  });
}

export function isLocked(state, ai, move) {
  const facts = state.attacker.facts ?? {};
  return !!((facts.encoredTurns > 0 && moveKey(move) === moveKey(facts.encoredMove))
    || (['choiceband', 'choicescarf', 'choicespecs'].includes(moveKey(ai.attackerMon.item)) && facts.moveNoChoice && moveKey(move) === moveKey(facts.moveNoChoice)));
}

export function presentMove(state, ai, index, weight, scores, percent, ally = false) {
  return {index, name: state.attacker.moves[index].name, probability: Number(weight), exact: weight.toJSON(), percent,
    score: (ally ? 'A' : '') + scoreLabel(scores.map(branch => branch.score), !ally && isLocked(state, ai, state.attacker.moves[index])),
    branches: scores.map(branch => ({score: branch.score, probability: Number(branch.weight), exact: branch.weight.toJSON()}))};
}

export function pickSingles(state, {digits = 0} = {}) {
  const baseAi = BuildStateVariables(state);
  if (baseAi.isDoubleBattle) throw new RangeError('evaluateSingles requires singles; use evaluateDoubles');
  const count = state.attacker.moves.length;
  if (!count || count > 4) throw new RangeError('Move odds require one to four moves');
  const weights = Array(count).fill(ZERO);
  const scoreWeights = Array.from({length: count}, () => new Map());
  let switchWeight = ZERO;
  for (const shouldSwitch of [false, true]) {
    const distribution = damageScores(state, baseAi, shouldSwitch);
    for (const group of distribution.groups) {
      const chance = CalculateSwitch(state, {...baseAi, monCanOneShotPlayerWithAnyMove: group.anyKO});
      const weight = group.weight.multiply(shouldSwitch ? chance : ONE.subtract(chance));
      if (!weight.numerator) continue;
      const hardSwitch = shouldSwitch && (!baseAi.attackerHasValidSwitchingMove || (baseAi.playerMovesFirst && baseAi.playerCanOneShotMonWithAnyMove));
      if (hardSwitch) switchWeight = switchWeight.add(weight);
      else {
        const winners = maskIndices(group.mask);
        for (const index of winners) weights[index] = weights[index].add(weight.divide(winners.length));
      }
    }
    for (const [index, branches] of distribution.scores.entries()) for (const branch of branches) {
      if (!shouldSwitch) scoreWeights[index].set(branch.score, branch.weight);
    }
  }
  const percentages = roundedPercentages([...weights, switchWeight], digits);
  return {moves: weights.map((weight, index) => presentMove(state, baseAi, index, weight,
    [...scoreWeights[index]].map(([score, branchWeight]) => ({score, weight: branchWeight})), percentages[index])),
    switch: {probability: Number(switchWeight), exact: switchWeight.toJSON(), percent: percentages[count], partySlot: baseAi.postKoScoringPosition}};
}

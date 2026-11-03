import {Fraction, roundedPercentages, enumerateRandomBranches, highestScoreGroups} from '../enumerate.mjs';
import {BuildStateVariables, snapshotMon} from './state.mjs';
import {AI_IsClient2Faster} from './speed.mjs';
import {commandScores, maskIndices, presentMove, moveKey} from './pick_command.mjs';
import {ScoreMovesAgainstAlly} from './scoring.mjs';
import {BattleAI_PostKOSwitchIn_Internal} from './postKO.mjs';

const ZERO = new Fraction();
const ONE = new Fraction(1n);
const alive = mon => mon?.currentHP > 0;

export function OverrideWrongTargetForMove(move, target, attackerSlot) {
  if (['milkdrink', 'acupressure'].includes(moveKey(move)) && !(target.side === 'foe' && target.slot === (attackerSlot ^ 1))) return {side: 'foe', slot: attackerSlot};
  return target;
}

export function FindTargets(groups) {
  const maximum = Math.max(...groups.map(group => group.score));
  return groups.flatMap((group, index) => group.score === maximum ? [index] : []);
}

export function ChooseMove(group) {
  const moves = maskIndices(group.mask);
  return moves.map(index => ({index, weight: ONE.divide(moves.length)}));
}

export function CalcTurnStateDamagesAndScores(state, slot, {partnerMove, ignoredPlayer = -1} = {}) {
  const attacker = state.foes[slot];
  const ally = state.foes[slot ^ 1];
  const targets = [];
  for (const playerSlot of [slot, slot ^ 1]) {
    if (!alive(state.players[playerSlot]) || ignoredPlayer === playerSlot) continue;
    const pairState = {...state, attacker, defender: state.players[playerSlot], attackerAlly: ally, defenderAlly: state.players[playerSlot ^ 1], partnerMove,
      allies: [ally, state.players[playerSlot ^ 1]], attackerParty: state.foeParty ?? state.foes, defenderParty: state.playerParty ?? state.players,
      isDoubleBattle: true, field: {...state.field, isDoubleBattle: true}};
    const ai = BuildStateVariables(pairState);
    ai.partnerMoveNo = partnerMove?.name ?? '';
    ai.partnerClicksAttackingMove = Boolean(partnerMove && partnerMove.category !== 'Status');
    ai.attackerMon.partnerMoveNo = ai.partnerMoveNo;
    targets.push({target: {side: 'player', slot: playerSlot}, state: pairState, ai});
  }
  const best = state.foeParty ? BattleAI_PostKOSwitchIn_Internal({...state, attackerSlot: slot}, {calcWithHighestDamageHit: true}).choices[0] : undefined;
  const anyIncomingKO = targets.some(target => target.ai.playerCanOneShotMonWithAnyMove);
  for (const target of targets) {
    target.ai.anyPlayerMonCanOneShotMonWithAnyMove = anyIncomingKO;
    target.ai.defenderAllySpeed = targets.find(other => other !== target)?.ai.defenderMon.speed ?? 0;
    if (best) Object.assign(target.ai, {highestPostKoScoreFromParty: best.score, postKoScoringPosition: best.partySlot, highestDamageHitPrct: best.highestDamageHitPrct});
    const distribution = commandScores(target.state, target.ai);
    target.groups = distribution.groups.map(group => ({...group, score: group.score + 1000}));
    target.scores = distribution.scores;
  }
  if (alive(ally) && targets.length) {
    const reference = targets.find(target => target.target.slot === slot) ?? targets[0];
    const distributions = attacker.moves.map((move, index) => enumerateRandomBranches(random => ScoreMovesAgainstAlly(reference.state, index, reference.ai, random)));
    targets.push({target: {side: 'foe', slot: slot ^ 1}, state: reference.state, ai: reference.ai,
      groups: highestScoreGroups(distributions), scores: distributions.map(branches => branches.map(branch => ({...branch, score: branch.score > 0 ? branch.score - 1000 : branch.score})))});
  }
  return targets;
}

export function pickDoublesMon(state, slot, condition = {}) {
  const targets = CalcTurnStateDamagesAndScores(state, slot, condition);
  if (!targets.length) throw new RangeError('Move odds require a living player target; use switchInOrder after both players faint');
  const weights = targets.map(() => state.foes[slot].moves.map(() => ZERO));
  const branches = new Map();
  const visit = (index, selected, weight) => {
    if (index < targets.length) {
      for (const group of targets[index].groups) visit(index + 1, [...selected, group], weight.multiply(group.weight));
      return;
    }
    const bestTargets = FindTargets(selected);
    for (const targetIndex of bestTargets) for (const move of ChooseMove(selected[targetIndex])) {
      const mass = weight.divide(bestTargets.length).multiply(move.weight);
      weights[targetIndex][move.index] = weights[targetIndex][move.index].add(mass);
      let ignoredPlayer = -1;
      if (alive(state.foes[slot ^ 1]) && state.players.every(alive) && state.foes[slot].moves[move.index].category !== 'Status') {
        const fastKO = targets.findIndex((target, targetSlot) => target.target.side === 'player' && selected[targetSlot].anyKO && target.ai.aiMovesFirst);
        if (fastKO >= 0) ignoredPlayer = targets[fastKO].target.slot;
      }
      const code = `${targetIndex}:${move.index}:${ignoredPlayer}`;
      const prior = branches.get(code);
      branches.set(code, {index: move.index, target: OverrideWrongTargetForMove(state.foes[slot].moves[move.index], targets[targetIndex].target, slot), ignoredPlayer, weight: (prior?.weight ?? ZERO).add(mass)});
    }
  };
  visit(0, [], ONE);
  return {targets, weights, branches: [...branches.values()]};
}

export function doublesPickOrder(state) {
  const living = [0, 1].filter(slot => alive(state.foes[slot]));
  if (living.length < 2) return living;
  const speedState = {attacker: state.foes[0], defender: state.players[0], attackerAlly: state.foes[1], defenderAlly: state.players[1], field: state.field};
  const first = snapshotMon(speedState, state.foes[0], 'attacker');
  const second = snapshotMon(speedState, state.foes[1], 'attacker');
  const comparison = AI_IsClient2Faster(speedState, first, second);
  if (comparison === 2 && state.firstRequestedSlot === 1) return [1, 0];
  return comparison === 1 ? [1, 0] : [0, 1];
}

export function presentDoublesMon(state, slot, result, digits = 0) {
  const flat = result.weights.flat();
  const percentages = roundedPercentages(flat, digits);
  let offset = 0;
  const selections = result.targets.flatMap((target, targetIndex) => result.weights[targetIndex].map((weight, index) => ({
    ...presentMove(target.state, target.ai, index, weight, target.scores[index], percentages[offset++], target.target.side === 'foe'),
    target: OverrideWrongTargetForMove(state.foes[slot].moves[index], target.target, slot), selectionTarget: target.target,
  })));
  const combined = new Map();
  for (const selection of selections) {
    const code = `${selection.index}:${selection.target.side}:${selection.target.slot}`;
    const prior = combined.get(code);
    const weight = new Fraction(selection.exact.numerator, selection.exact.denominator);
    if (prior) {
      const total = new Fraction(prior.exact.numerator, prior.exact.denominator).add(weight);
      prior.probability = Number(total);
      prior.exact = total.toJSON();
      prior.percent += selection.percent;
      prior.scoreContexts.push({selectionTarget: selection.selectionTarget, score: selection.score, branches: selection.branches});
      prior.score = [...new Set(prior.scoreContexts.flatMap(context => context.score.split('/')))].join('/');
      delete prior.branches;
    } else combined.set(code, {...selection, scoreContexts: [{selectionTarget: selection.selectionTarget, score: selection.score, branches: selection.branches}]});
  }
  const pairs = [...combined.values()];
  const rounded = roundedPercentages(pairs.map(pair => pair.probability), digits);
  pairs.forEach((pair, index) => { pair.percent = rounded[index]; });
  return {slot, pairs, switch: {probability: 0, exact: ZERO.toJSON(), percent: 0}};
}

export function evaluateDoubles(state, {digits = 0} = {}) {
  if (state.foes?.length !== 2 || state.players?.length !== 2) throw new RangeError('Doubles requires two foe slots and two player slots (fainted slots retain their mon with HP zero)');
  for (const mon of state.foes.filter(alive)) if (!mon.moves?.length || mon.moves.length > 4) throw new RangeError('Move odds require one to four moves');
  const order = doublesPickOrder(state);
  if (!order.length) return {order, foes: [], firstBranches: []};
  const [first, second] = order;
  const firstResult = pickDoublesMon(state, first);
  const output = [presentDoublesMon(state, first, firstResult, digits)];
  if (second !== undefined) {
    const mixture = CalcTurnStateDamagesAndScores(state, second);
    const weights = mixture.map(() => state.foes[second].moves.map(() => ZERO));
    const scores = mixture.map(() => state.foes[second].moves.map(() => new Map()));
    const cache = new Map();
    for (const branch of firstResult.branches) {
      const code = `${branch.index}:${branch.ignoredPlayer}`;
      if (!cache.has(code)) cache.set(code, pickDoublesMon(state, second, {partnerMove: state.foes[first].moves[branch.index], ignoredPlayer: branch.ignoredPlayer}));
      const conditional = cache.get(code);
      for (const [targetIndex, target] of conditional.targets.entries()) {
        const destination = mixture.findIndex(other => other.target.side === target.target.side && other.target.slot === target.target.slot);
        for (const [index, weight] of conditional.weights[targetIndex].entries()) {
          weights[destination][index] = weights[destination][index].add(weight.multiply(branch.weight));
          for (const score of target.scores[index]) {
            const prior = scores[destination][index].get(score.score) ?? ZERO;
            scores[destination][index].set(score.score, prior.add(score.weight.multiply(branch.weight)));
          }
        }
      }
    }
    const targets = mixture.map((target, targetIndex) => ({...target, scores: scores[targetIndex].map(distribution => [...distribution]
      .sort(([left], [right]) => left - right).map(([score, weight]) => ({score, weight})))}));
    output.push(presentDoublesMon(state, second, {targets, weights}, digits));
  }
  return {order, foes: output.sort((left, right) => left.slot - right.slot),
    firstBranches: firstResult.branches.map(({weight, ...branch}) => ({...branch, probability: Number(weight), exact: weight.toJSON()}))};
}

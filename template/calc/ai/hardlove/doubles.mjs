import {Fraction, roundedPercentages} from '../enumerate.mjs';
import {BuildStateVariables, snapshotMon} from './state.mjs';
import {AI_IsClient2Faster} from './speed.mjs';
import {damageScores, maskIndices, presentMove} from './pick_command.mjs';

const ZERO = new Fraction();
const ONE = new Fraction(1n);
const alive = mon => mon?.currentHP > 0;

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
    const pairState = {...state, attacker, defender: state.players[playerSlot], attackerAlly: ally, defenderAlly: state.players[playerSlot ^ 1],
      allies: [ally, state.players[playerSlot ^ 1]], attackerParty: state.foeParty ?? state.foes, defenderParty: state.playerParty ?? state.players,
      isDoubleBattle: true, field: {...state.field, isDoubleBattle: true}};
    const ai = BuildStateVariables(pairState);
    ai.partnerMoveNo = partnerMove?.name ?? '';
    ai.partnerClicksAttackingMove = Boolean(partnerMove && partnerMove.category !== 'Status');
    ai.attackerMon.partnerMoveNo = ai.partnerMoveNo;
    targets.push({target: {side: 'player', slot: playerSlot}, state: pairState, ai});
  }
  const anyIncomingKO = targets.some(target => target.ai.playerCanOneShotMonWithAnyMove);
  for (const target of targets) {
    target.ai.anyPlayerMonCanOneShotMonWithAnyMove = anyIncomingKO;
    target.ai.defenderAllySpeed = targets.find(other => other !== target)?.ai.defenderMon.speed ?? 0;
    const distribution = damageScores(target.state, target.ai);
    target.groups = distribution.groups.map(group => ({...group, score: group.score + 1000}));
    target.scores = distribution.scores;
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
      if (state.players.every(alive) && state.foes[slot].moves[move.index].category !== 'Status') {
        const fastKO = targets.findIndex((target, targetSlot) => target.target.side === 'player' && selected[targetSlot].anyKO && target.ai.aiMovesFirst);
        if (fastKO >= 0) ignoredPlayer = targets[fastKO].target.slot;
      }
      const code = `${targetIndex}:${move.index}:${ignoredPlayer}`;
      const prior = branches.get(code);
      branches.set(code, {index: move.index, target: targets[targetIndex].target, ignoredPlayer, weight: (prior?.weight ?? ZERO).add(mass)});
    }
  };
  visit(0, [], ONE);
  return {targets, weights, branches: [...branches.values()]};
}

export function doublesPickOrder(state) {
  const living = [0, 1].filter(slot => alive(state.foes[slot]));
  if (living.length < 2) return living;
  const speedState = {attacker: state.foes[0], defender: state.players[0], field: state.field};
  const first = snapshotMon(speedState, state.foes[0], 'attacker');
  const second = snapshotMon(speedState, state.foes[1], 'attacker');
  return AI_IsClient2Faster(speedState, first, second) === 1 ? [1, 0] : [0, 1];
}

export function presentDoublesMon(state, slot, result, digits = 0) {
  const flat = result.weights.flat();
  const percentages = roundedPercentages(flat, digits);
  let offset = 0;
  const pairs = result.targets.flatMap((target, targetIndex) => result.weights[targetIndex].map((weight, index) => ({
    ...presentMove(target.state, target.ai, index, weight, target.scores[index], percentages[offset++]), target: target.target,
  })));
  return {slot, pairs, switch: {probability: 0, exact: ZERO.toJSON(), percent: 0}};
}

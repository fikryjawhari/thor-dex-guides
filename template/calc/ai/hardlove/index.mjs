import {BuildStateVariables} from './state.mjs';
import {scoreMove} from './scoring.mjs';
import {enumerateDamageScores, roundedPercentages, scoreLabel} from '../enumerate.mjs';

export {SetupStateVariables, BuildStateVariables, ApplyDamageRolls} from './state.mjs';
export {BattleAI_CalcBaseDamage, BattleAI_CalcDamageInternal, BattleAI_CalcDamage} from './damage.mjs';
export {BattleAI_CalcEffectiveSpeed, AI_IsClient2Faster} from './speed.mjs';
export * from './scoring.mjs';

const key = value => String(value?.name ?? value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();

export function evaluateSinglesMoves(state, {digits = 0} = {}) {
  const baseAi = BuildStateVariables(state);
  const moves = state.attacker.moves;
  if (!moves.length || moves.length > 4) throw new RangeError('Singles move odds require one to four moves');
  const enumerated = enumerateDamageScores(baseAi.attackerRollTables.slice(0, moves.length), (index, roll, context, random) => {
    const ai = {...baseAi,
      attackerRolledMaxDamage: context.maximum,
      monCanOneShotPlayerWithAnyMove: context.anyKO,
      attackerRolledMoveDamages: baseAi.attackerRolledMoveDamages.map((damage, moveIndex) => moveIndex === index ? roll.damage : damage),
      monCanOneShotPlayerWithMove: baseAi.monCanOneShotPlayerWithMove.map((canKO, moveIndex) => moveIndex === index ? roll.canOneShot : canKO),
    };
    return scoreMove(state, index, ai, random);
  });
  const percentages = roundedPercentages(enumerated.map(move => move.weight), digits);
  return enumerated.map((result, index) => {
    const move = moves[index];
    const input = state.attacker.facts || {};
    const encoreMove = input.encoredMove ?? input.lastUsedMove ?? input.lastMove;
    const choiceMove = input.moveNoChoice ?? input.choiceMove;
    const locked = !!(((input.encoredTurns || input.encored) && key(move) === key(encoreMove))
      || (['choiceband', 'choicescarf', 'choicespecs'].includes(key(baseAi.attackerMon.item)) && choiceMove && key(move) === key(choiceMove)));
    return {index, name: move.name, probability: result.probability, exact: result.weight.toJSON(), percent: percentages[index],
      score: scoreLabel(result.scores.map(branch => branch.score), locked),
      branches: result.scores.map(branch => ({score: branch.score, probability: Number(branch.weight), exact: branch.weight.toJSON()})),
    };
  });
}

export {pickSingles as evaluateSingles, CalculateSwitch, getVarianceFromDamage} from './pick_command.mjs';

export {SetupStateVariables, BuildStateVariables, ApplyDamageRolls} from './state.mjs';
export {BattleAI_CalcBaseDamage, BattleAI_CalcDamageInternal, BattleAI_CalcDamage} from './damage.mjs';
export {BattleAI_CalcEffectiveSpeed, AI_IsClient2Faster} from './speed.mjs';
export * from './scoring.mjs';

export {pickSingles as evaluateSingles, CalculateSwitch, getVarianceFromDamage} from './pick_command.mjs';
export {evaluateDoubles};
export {FindTargets, ChooseMove, CalcTurnStateDamagesAndScores, OverrideWrongTargetForMove} from './doubles.mjs';
export {switchInOrder, BattleAI_PostKOSwitchIn_Internal, calcPlayerAsDefender, calcPlayerAsAttacker, getNormalScore, FillDamageStructFromPartyMon} from './postKO.mjs';

export function TrainerAI_PickCommand(state, options) {
  return state.foes ? evaluateDoubles(state, options) : pickSingles(state, options);
}
import {pickSingles} from './pick_command.mjs';
import {evaluateDoubles} from './doubles.mjs';

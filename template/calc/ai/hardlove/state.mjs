import {BattleAI_CalcDamage, BattleAI_GetTypeEffectiveness, BattleAI_RolledDamageOutcomes} from './damage.mjs';
import {Fraction} from '../enumerate.mjs';
import {AI_IsClientGrounded, IsMoveUsable, BattleAI_AdjustUnusualMoveDamage, CanAttackerOneShotDefender, IsMoveUsefulSoundMove, IsMoveForceSwitching, IsMoveValidSwitchingMove} from './calc.mjs';
import {BattleAI_CalcEffectiveSpeed, AI_IsClient2Faster} from './speed.mjs';
import {BattlerKnowsThawingMove, BattlerPositiveStatChangesSum} from './helpers.mjs';

const statNames = ['attack', 'defense', 'speed', 'spAttack', 'spDefense', 'accuracy', 'evasion'];

function snapshotMon(state, mon, side) {
  const facts = {...mon.facts};
  const snapshot = {...mon, ...facts, facts, moves: (mon.moves ?? []).slice(0, 4).map(move => ({...move, flags: [...(move.flags ?? [])]})), types: [...(mon.types ?? [])], statBoosts: {...mon.statBoosts}};
  snapshot.hp = mon.currentHP;
  snapshot.maxhp = mon.totalHP;
  snapshot.percenthp = Math.trunc(100 * snapshot.hp / snapshot.maxhp);
  snapshot.states = Object.fromEntries(statNames.map(name => [name, mon.statBoosts?.[name] ?? 0]));
  snapshot.sp_attack = mon.spAttack;
  snapshot.sp_defense = mon.spDefense;
  snapshot.condition = mon.status ?? '';
  snapshot.type1 = snapshot.types[0];
  snapshot.type2 = snapshot.types[1] ?? snapshot.types[0];
  snapshot.type3 = snapshot.types[2] ?? 'Typeless';
  snapshot.form = mon.form ?? facts.form ?? 0;
  snapshot.hasMoldBreaker = mon.hasMoldBreaker ?? facts.hasMoldBreaker ?? ['Mold Breaker', 'Teravolt', 'Turboblaze'].includes(mon.ability);
  snapshot.item_held_effect = mon.item_held_effect ?? facts.item_held_effect ?? (mon.item === 'Clear Amulet' ? 'PREVENT_STAT_DROPS' : '');
  snapshot.isGrounded = AI_IsClientGrounded(state, snapshot);
  snapshot.speed = BattleAI_CalcEffectiveSpeed(state, snapshot, side);
  return snapshot;
}

function partyFacts(state, side) {
  const suffix = side === 'attacker' ? 'Attacker' : 'Defender';
  const party = state[`${side}Party`] ?? state[side].party ?? [state[side]];
  const living = party.filter(mon => (mon.currentHP ?? mon.hp ?? 0) > 0 && mon.species && mon.species !== 'Egg');
  return {
    [`partySize${suffix}`]: state.facts?.[`partySize${suffix}`] ?? party.length,
    [`livingMembers${suffix}`]: state.facts?.[`livingMembers${suffix}`] ?? living.length,
    ...(side === 'attacker' ? {monWithMegaInParty: state.facts?.monWithMegaInParty ?? living.some(mon => Boolean(mon.facts?.isMegaStone))} : {}),
  };
}

function damageTable(state, move, attacker, defender) {
  const result = BattleAI_CalcDamage(state, move, attacker, defender);
  if (!Array.isArray(result.damageRange) || result.damageRange.length !== 16) throw new TypeError('AI damage calculation must return sixteen rolls');
  return {
    raw: [...result.damageRange],
    adjusted: result.damageRange.map(damage => BattleAI_AdjustUnusualMoveDamage(attacker, defender, damage, move.effect, move, result.moveEffectiveness)),
    effectiveness: result.moveEffectiveness,
    outcomes: BattleAI_RolledDamageOutcomes(result.hitRanges ?? [result.damageRange]),
    hits: (result.hitRanges ?? [result.damageRange]).length,
  };
}

export function BuildStateVariables(state) {
  if (state.isDoubleBattle || state.field?.isDoubleBattle || state.field?.doubles || ['doubles', 'multi', 'tag'].includes(String(state.battleType ?? state.format ?? state.gameType ?? state.field?.gameType ?? '').toLowerCase()) || state.allies?.some(mon => mon && (mon.currentHP ?? mon.hp ?? 1) > 0)) throw new RangeError('Hardlove AI state currently supports singles only');
  const attackerMon = snapshotMon(state, state.attacker, 'attacker');
  const defenderMon = snapshotMon(state, state.defender, 'defender');
  const field = state.field ?? {};
  const attackerLastUsedMove = state.attacker.facts?.lastUsedMove ?? '';
  const defenderLastUsedMove = state.defender.facts?.lastUsedMove ?? '';
  const defenderLastUsedMoveEffect = state.defender.facts?.lastUsedMoveEffect ?? defenderMon.moves.find(move => move.name === (defenderLastUsedMove?.name ?? defenderLastUsedMove))?.effect ?? '';
  const ai = {
    attackerMon, defenderMon, attacker: 'attacker', defender: 'defender', attackerSide: 'attacker', defenderSide: 'defender',
    isDoubleBattle: false, isAllyAlive: false, partnerCanAttack: false, isPartnerGrounded: false, defenderAllyHasMagicBounce: false,
    partnerClicksAttackingMove: false, ignoreTarget: false, partnerMoveNo: '', attackerMove: '', attackerMoveEffect: '',
    highestPostKoScoreFromParty: state.facts?.highestPostKoScoreFromParty ?? 0,
    postKoScoringPosition: state.facts?.postKoScoringPosition ?? -1,
    highestDamageHitPrct: state.facts?.highestDamageHitPrct ?? 0,
    anyPlayerMonCanOneShotMonWithAnyMove: state.facts?.anyPlayerMonCanOneShotMonWithAnyMove ?? false,
    attackerLastUsedMove, defenderLastUsedMove, defenderLastUsedMoveEffect,
    playerMovesFirst: false, aiMovesFirst: false, isSpeedTie: false, maxDamageReceived: 0,
    attackerSpeed: attackerMon.speed, defenderSpeed: defenderMon.speed,
    defenderKnowsThawingMove: BattlerKnowsThawingMove(defenderMon),
    defenderHasAtleastOneUsefulSoundMove: false, defenderCanForceSwitching: false,
    defenderHasSturdyOrFocusSashActive: defenderMon.hp === defenderMon.maxhp && (defenderMon.item === 'Focus Sash' || (defenderMon.ability === 'Sturdy' && !attackerMon.hasMoldBreaker)),
    attackerHasSturdyOrFocusSashActive: attackerMon.hp === attackerMon.maxhp && (attackerMon.item === 'Focus Sash' || (attackerMon.ability === 'Sturdy' && !defenderMon.hasMoldBreaker)),
    defenderHasAtleastOneStatusMove: false, defenderHasAtleastOnePhysicalMove: false, defenderHasAtleastOneSpecialMove: false,
    playerCanOneShotMonWithAnyMove: false, playerCanOneShotMonWithMove: [false, false, false, false],
    attackerHasAttackingMoves: false, attackerHasValidDamagingMove: false, attackerHasValidSwitchingMove: false,
    shouldSwitch: state.facts?.shouldSwitch ?? false, attackerMovesKnown: attackerMon.moves.length,
    attackerPositiveStatChangesSum: BattlerPositiveStatChangesSum(state.attacker),
    effectivenessOnPlayer: [0, 0, 0, 0], effectivenessOnAttacker: [0, 0, 0, 0],
    attackerRawDamageRanges: Array.from({length: 4}, () => Array(16).fill(0)),
    defenderRawDamageRanges: Array.from({length: 4}, () => Array(16).fill(0)),
    attackerDamageRanges: Array.from({length: 4}, () => Array(16).fill(0)),
    defenderDamageRanges: Array.from({length: 4}, () => Array(16).fill(0)),
    attackerRollTables: Array.from({length: 4}, () => Array.from({length: 16}, () => ({damage: 0, canOneShot: false}))),
    attackerMoveUsable: [false, false, false, false], defenderMoveUsable: [false, false, false, false],
    ...partyFacts(state, 'attacker'), ...partyFacts(state, 'defender'),
  };
  attackerMon.partnerMoveNo = ai.partnerMoveNo;
  const speed = AI_IsClient2Faster(state, defenderMon, attackerMon);
  ai.playerMovesFirst = speed === 0;
  ai.aiMovesFirst = speed !== 0;
  ai.isSpeedTie = speed === 2;
  ai.isDefenderIncapacitated = defenderMon.status === 'slp' || (defenderMon.status === 'frz' && !ai.defenderKnowsThawingMove) || Boolean(defenderMon.facts.recharge || defenderMon.facts.truant);
  ai.defenderHasMagicBounce = defenderMon.ability === 'Magic Bounce' && !attackerMon.hasMoldBreaker;
  const mistyGrounded = defenderMon.isGrounded && ['Misty', 'Misty Terrain'].includes(field.terrain);
  const statusImmune = Boolean(defenderMon.status) || ai.defenderHasMagicBounce
    || (!attackerMon.hasMoldBreaker && (['Good as Gold', 'Purifying Salt'].includes(defenderMon.ability) || (defenderMon.ability === 'Shields Down' && defenderMon.percenthp > 50) || (defenderMon.ability === 'Leaf Guard' && ['Sun', 'Harsh Sunshine', 'Desolate Land'].includes(field.weather))))
    || (defenderMon.ability === 'Hydration' && ['Rain', 'Heavy Rain', 'Primordial Sea'].includes(field.weather))
    || defenderMon.ability === 'Comatose' || Boolean(field.defender?.safeguard);
  ai.defenderImmuneToPoison = statusImmune || ['Magic Guard', 'Immunity', 'Poison Heal', 'Pastel Veil'].includes(defenderMon.ability) || mistyGrounded || (defenderMon.types.some(type => ['Poison', 'Steel'].includes(type)) && attackerMon.ability !== 'Corrosion');
  ai.defenderImmuneToParalysis = statusImmune || defenderMon.ability === 'Limber' || mistyGrounded || defenderMon.types.includes('Electric');
  ai.defenderImmuneToBurn = statusImmune || ['Water Veil', 'Thermal Exchange', 'Magic Guard', 'Water Bubble'].includes(defenderMon.ability) || mistyGrounded || defenderMon.types.includes('Fire');
  ai.defenderImmuneToSleep = statusImmune || ['Vital Spirit', 'Insomnia'].includes(defenderMon.ability) || (defenderMon.isGrounded && ['Misty', 'Misty Terrain', 'Electric', 'Electric Terrain'].includes(field.terrain));
  ai.defenderImmuneToStatDrop = defenderMon.ability === 'Full Metal Body' || ['PREVENT_STAT_DROPS', 'HOLD_EFFECT_PREVENT_STAT_DROPS'].includes(defenderMon.item_held_effect) || (!attackerMon.hasMoldBreaker && ['Clear Body', 'Contrary', 'White Smoke'].includes(defenderMon.ability));
  ai.defenderImmuneToFlinch = defenderMon.item === 'Covert Cloak' || (!attackerMon.hasMoldBreaker && ['Shield Dust', 'Inner Focus'].includes(defenderMon.ability));
  for (const [index, move] of defenderMon.moves.entries()) {
    const usable = Boolean(IsMoveUsable(state, defenderMon, move, defenderLastUsedMove, index));
    ai.defenderMoveUsable[index] = usable;
    if (!usable) continue;
    if (move.category === 'Status') {
      ai.defenderHasAtleastOneStatusMove = true;
      if (IsMoveUsefulSoundMove(move) && !defenderMon.facts.throatChopTimer) ai.defenderHasAtleastOneUsefulSoundMove = true;
      if (IsMoveForceSwitching(move)) ai.defenderCanForceSwitching = true;
    } else if (move.power) {
      const table = damageTable(state, move, defenderMon, attackerMon);
      ai.defenderRawDamageRanges[index] = table.raw;
      ai.defenderDamageRanges[index] = table.adjusted;
      ai.effectivenessOnAttacker[index] = table.effectiveness;
      ai.playerCanOneShotMonWithMove[index] = Boolean(CanAttackerOneShotDefender(table.adjusted[15], move.category, move, defenderMon, attackerMon));
      ai.playerCanOneShotMonWithAnyMove ||= ai.playerCanOneShotMonWithMove[index];
      ai.maxDamageReceived = Math.max(ai.maxDamageReceived, table.adjusted[15]);
      if (table.effectiveness >= 10) {
        if (move.category === 'Special') ai.defenderHasAtleastOneSpecialMove = true;
        else ai.defenderHasAtleastOnePhysicalMove = true;
      }
      if (IsMoveUsefulSoundMove(move) && !defenderMon.facts.throatChopTimer && table.effectiveness >= 10) ai.defenderHasAtleastOneUsefulSoundMove = true;
      if (IsMoveForceSwitching(move)) ai.defenderCanForceSwitching = true;
    }
  }
  for (const [index, move] of attackerMon.moves.entries()) {
    const usable = Boolean(IsMoveUsable(state, attackerMon, move, attackerLastUsedMove, index));
    ai.attackerMoveUsable[index] = usable;
    if (move.category === 'Status' && usable) ai.effectivenessOnPlayer[index] = BattleAI_GetTypeEffectiveness(state, move, attackerMon, defenderMon);
    else if (move.power && usable) {
      ai.attackerHasAttackingMoves = true;
      const table = damageTable(state, move, attackerMon, defenderMon);
      ai.attackerRawDamageRanges[index] = table.raw;
      ai.attackerDamageRanges[index] = table.adjusted;
      ai.effectivenessOnPlayer[index] = table.effectiveness;
      // The AI's own roll (setupStateVariables.c): rolled damage -> BattleAI_AdjustUnusualMoveDamage -> kill check ->
      // a killing roll capped at the target's HP. One roll per hit (Triple Axel / Kick, Parental Bond: summed).
      const denominator = 16n ** BigInt(table.hits);
      const outcomes = table.hits === 1 ? table.raw.map(raw => [raw, 1]) : [...table.outcomes]; // single hit: index = roll
      ai.attackerRollTables[index] = outcomes.map(([raw, count]) => {
        const damage = BattleAI_AdjustUnusualMoveDamage(attackerMon, defenderMon, raw, move.effect, move, table.effectiveness);
        const canOneShot = Boolean(CanAttackerOneShotDefender(damage, move.category, move, attackerMon, defenderMon));
        return {damage: canOneShot ? defenderMon.hp : damage, canOneShot, weight: new Fraction(BigInt(count), denominator)};
      });
      if (table.effectiveness >= 10) ai.attackerHasValidDamagingMove = true;
    }
    if (IsMoveValidSwitchingMove(move) && ai.effectivenessOnPlayer[index] > 0) ai.attackerHasValidSwitchingMove = true;
  }
  ai.attackerMaxRollDamage = Math.max(...ai.attackerDamageRanges.map(range => range[15]));
  ai.anyPlayerMonCanOneShotMonWithAnyMove = state.facts?.anyPlayerMonCanOneShotMonWithAnyMove ?? ai.playerCanOneShotMonWithAnyMove;
  return ApplyDamageRolls(ai);
}

export function ApplyDamageRolls(baseAi, rolls = [0, 0, 0, 0]) {
  if (!Array.isArray(rolls) || rolls.length !== 4 || rolls.some((roll, index) => !Number.isInteger(roll) || roll < 0 || roll >= Math.max(1, baseAi.attackerRollTables[index].length))) throw new RangeError('Provide one roll-outcome index per move slot (0-15 for a single hit)');
  const selected = baseAi.attackerRollTables.map((table, index) => table[rolls[index]]);
  const attackerRolledMoveDamages = selected.map(roll => roll.damage);
  const monCanOneShotPlayerWithMove = selected.map(roll => roll.canOneShot);
  return {...baseAi, selectedDamageRolls: [...rolls], attackerRolledMoveDamages, monCanOneShotPlayerWithMove, monCanOneShotPlayerWithAnyMove: monCanOneShotPlayerWithMove.some(Boolean), attackerRolledMaxDamage: Math.max(...attackerRolledMoveDamages)};
}

export function SetupStateVariables(state, rolls = [0, 0, 0, 0]) {
  return ApplyDamageRolls(BuildStateVariables(state), rolls);
}

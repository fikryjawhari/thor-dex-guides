import {Fraction, roundedPercentages} from '../enumerate.mjs';
import {snapshotMon} from './state.mjs';
import {BattleAI_CalcDamage} from './damage.mjs';
import {BattleAI_AdjustUnusualMoveDamage, BattleAI_GetHighestParadoxStat, CanAttackerOneShotDefender, IsMoveUsable} from './calc.mjs';
import {AI_IsClient2Faster, BattleAI_CalcEffectiveSpeed} from './speed.mjs';

const ZERO = new Fraction();
const ONE = new Fraction(1n);
const alive = mon => mon?.currentHP > 0 && mon.species && mon.species !== 'Egg';

export function FillDamageStructFromPartyMon(state, mon, calcWithHighestDamageHit = false) {
  const facts = Object.fromEntries(['hiddenPowerType', 'flingPower', 'naturalGiftType', 'naturalGiftPower', 'heldItemRemovable', 'isMegaStone', 'item_held_effect', 'item_power'].filter(name => mon.facts?.[name] !== undefined).map(name => [name, mon.facts[name]]));
  facts.firstTurnOut = true;
  facts.isSwitching = calcWithHighestDamageHit;
  const statBoosts = {};
  if (mon.ability === 'Dauntless Shield') statBoosts.defense = 1;
  else if (mon.ability === 'Intrepid Sword') statBoosts.attack = 1;
  const source = {...mon, facts, statBoosts};
  const result = snapshotMon(state, source, 'attacker');
  result.item = mon.item ?? '';
  result.item_held_effect = mon.item_held_effect ?? facts.item_held_effect;
  result.isSwitching = calcWithHighestDamageHit;
  result.firstTurnOut = true;
  if ((mon.ability === 'Protosynthesis' && (state.field?.weather === 'Sun' || result.item === 'Booster Energy'))
    || (mon.ability === 'Quark Drive' && ((['Electric', 'Electric Terrain'].includes(state.field?.terrain) && (state.field?.terrainTurns ?? 1) > 0) || result.item === 'Booster Energy'))) {
    result.paradoxBoostedStat = BattleAI_GetHighestParadoxStat(mon.attack, mon.defense, mon.spAttack, mon.spDefense, mon.speed);
  }
  result.speed = BattleAI_CalcEffectiveSpeed(state, {...result, speed: mon.speed}, 'attacker', true);
  return result;
}

function maxDamage(state, moves, attacker, defender, usable, defendingSide) {
  let damage = 0;
  let selectedMove;
  const side = state.field?.[defendingSide] ?? {};
  const field = {...state.field, ...Object.fromEntries(['reflect', 'lightScreen', 'auroraVeil'].map(name => [name, side[name] ?? (defendingSide === 'defender' ? state.field?.[name] : false)]))};
  const foeAlly = state.attackerAlly?.currentHP > 0 ? snapshotMon(state, state.attackerAlly, 'attacker') : state.attackerAlly;
  const playerAlly = state.defenderAlly?.currentHP > 0 ? snapshotMon(state, state.defenderAlly, 'defender') : state.defenderAlly;
  for (const [index, move] of moves.entries()) {
    if (!move.name || move.name === 'None' || move.category === 'Status' || !move.power || !usable(move, index)) continue;
    const result = BattleAI_CalcDamage({...state, field, attackerAlly: defendingSide === 'defender' ? foeAlly : playerAlly,
      defenderAlly: defendingSide === 'defender' ? playerAlly : foeAlly}, move, attacker, defender);
    const rolled = BattleAI_AdjustUnusualMoveDamage(attacker, defender, result.damageRange[15], move.effect, move, result.moveEffectiveness);
    if (rolled > damage) { damage = rolled; selectedMove = move; }
  }
  return {damage, move: selectedMove};
}

export function calcPlayerAsDefender(state, partyMon, playerMon) {
  return maxDamage(state, partyMon.moves, partyMon, playerMon, move => move.pp !== 0, 'defender');
}

export function calcPlayerAsAttacker(state, partyMon, playerMon) {
  return maxDamage(state, playerMon.moves, playerMon, partyMon, (move, index) => IsMoveUsable(state, playerMon, move, playerMon.facts?.lastUsedMove, index), 'attacker');
}

export function getNormalScore(speedCalc, aiMonCanOneshotPlayer, playerCanOneShotAiMon, percentDealt, percentReceived) {
  if (speedCalc > 0) return aiMonCanOneshotPlayer ? 5 : percentDealt >= percentReceived ? 3 : 1;
  if (aiMonCanOneshotPlayer && !playerCanOneShotAiMon) return 4;
  if (percentDealt > percentReceived) return 2;
  return playerCanOneShotAiMon ? -1 : 0;
}

function roster(state) {
  const party = state.foeParty ?? state.attackerParty ?? state.foes ?? [state.attacker];
  const actives = state.foes ?? [state.attacker];
  const activePartySlots = state.activePartySlots ?? state.foePartySlots ?? (state.attackerPartySlot !== undefined ? [state.attackerPartySlot] : actives.map(mon => mon?.partySlot ?? party.indexOf(mon)));
  if (activePartySlots.some(slot => !Number.isInteger(slot) || slot < 0 || slot >= party.length)) throw new RangeError('Provide activePartySlots (or foePartySlots / attackerPartySlot) matching the supplied party, including fainted actives');
  return {party, activePartySlots};
}

export function BattleAI_PostKOSwitchIn_Internal(state, {calcWithHighestDamageHit = false, excludedPartySlots = []} = {}) {
  const {party, activePartySlots} = roster(state);
  const players = state.players ?? [state.defender];
  const doubles = players.length === 2;
  const opponentSlot = state.attackerSlot ?? 0;
  const orderedPlayers = doubles ? [players[opponentSlot], players[opponentSlot ^ 1]] : players;
  const excluded = new Set([...activePartySlots, ...(state.reservedPartySlots ?? []), ...excludedPartySlots]);
  const candidates = [];
  for (const [partySlot, mon] of party.entries()) {
    if (!alive(mon) || excluded.has(partySlot)) continue;
    const baseState = {...state, attacker: mon, defender: orderedPlayers.find(alive) ?? orderedPlayers[0], field: {...state.field, isDoubleBattle: doubles}};
    const partyMon = FillDamageStructFromPartyMon(baseState, mon, calcWithHighestDamageHit);
    const matchups = orderedPlayers.map((player, playerSlot) => {
      if (!alive(player)) return {active: false, speed: 0, percentReceived: 1, percentDealt: 1, incomingKO: false, outgoingKO: false};
      const defender = snapshotMon(baseState, player, 'defender');
      const pairState = {...baseState, defender: player, attackerAlly: state.foes?.[opponentSlot ^ 1], defenderAlly: orderedPlayers[playerSlot ^ 1]};
      const outgoing = calcPlayerAsDefender(pairState, partyMon, defender);
      const incoming = calcPlayerAsAttacker(pairState, partyMon, defender);
      return {active: true, speed: AI_IsClient2Faster(pairState, defender, partyMon),
        percentDealt: Math.trunc(100 * outgoing.damage / defender.hp) % 65536,
        percentReceived: Math.trunc(100 * incoming.damage / partyMon.hp) % 65536,
        outgoingKO: CanAttackerOneShotDefender(outgoing.damage, outgoing.move?.category, outgoing.move, partyMon, defender),
        incomingKO: CanAttackerOneShotDefender(incoming.damage, incoming.move?.category, incoming.move, defender, partyMon)};
    });
    const opposite = matchups[0];
    let score = 100;
    let highestDamageHitPrct = 0;
    if (calcWithHighestDamageHit) {
      if (opposite.percentReceived >= 100 || (opposite.speed === 0 && 2 * opposite.percentReceived >= 100)) score -= 10;
      if (mon.facts?.isMegaStone) score -= 10;
      highestDamageHitPrct = Math.max(...matchups.map(matchup => matchup.percentReceived), 1);
      if (highestDamageHitPrct <= 25) score++;
    }
    for (const matchup of matchups) if (matchup.active) score += getNormalScore(matchup.speed, matchup.outgoingKO, matchup.incomingKO, matchup.percentDealt, matchup.percentReceived);
    const faster = matchups.some(matchup => matchup.speed > 0);
    if (!calcWithHighestDamageHit) {
      if (!opposite.incomingKO && ['Wynaut', 'Wobbuffet'].includes(mon.species)) score += 2;
      if (faster && mon.species === 'Ditto') score += 2;
    }
    const zoroark = !calcWithHighestDamageHit && faster && mon.species === 'Zoroark';
    const scores = (zoroark ? [0, 1, 2] : [0]).map(bonus => ({score: (score + bonus) % 65536, weight: ONE.divide(zoroark ? 3 : 1)}));
    candidates.push({partySlot, species: mon.species, highestDamageHitPrct, matchups, scores});
  }
  if (!players.some(alive)) return {candidates: candidates.map(candidate => ({...candidate, scores: [{score: 0, weight: ONE}]})), choices: candidates.length ? [{partySlot: candidates[0].partySlot, score: 0, highestDamageHitPrct: 0, weight: ONE}] : []};
  let choices = [{partySlot: -1, score: 0, highestDamageHitPrct: 0, weight: ONE}];
  for (const candidate of candidates) {
    const combined = new Map();
    for (const choice of choices) for (const branch of candidate.scores) {
      const next = branch.score > choice.score ? {...candidate, score: branch.score} : choice;
      const code = `${next.partySlot}:${next.score}`;
      const prior = combined.get(code);
      combined.set(code, {partySlot: next.partySlot, score: next.score, highestDamageHitPrct: next.highestDamageHitPrct,
        weight: (prior?.weight ?? ZERO).add(choice.weight.multiply(branch.weight))});
    }
    choices = [...combined.values()];
  }
  return {candidates, choices: choices.filter(choice => choice.partySlot >= 0)};
}

export function switchInOrder(state, {digits = 0} = {}) {
  const cache = new Map();
  const visit = excluded => {
    const code = [...excluded].sort((left, right) => left - right).join(',');
    if (cache.has(code)) return cache.get(code);
    const {choices} = BattleAI_PostKOSwitchIn_Internal(state, {excludedPartySlots: excluded});
    const orders = new Map();
    if (!choices.length) orders.set('', {partySlots: [], weight: ONE});
    for (const choice of choices) for (const suffix of visit([...excluded, choice.partySlot])) {
      const partySlots = [choice.partySlot, ...suffix.partySlots];
      const key = partySlots.join(',');
      const prior = orders.get(key);
      orders.set(key, {partySlots, weight: (prior?.weight ?? ZERO).add(choice.weight.multiply(suffix.weight))});
    }
    const result = [...orders.values()];
    cache.set(code, result);
    return result;
  };
  const orders = visit([]);
  const candidates = BattleAI_PostKOSwitchIn_Internal(state).candidates;
  const ranks = candidates.map(candidate => {
    const weights = candidates.map((_, rank) => orders.filter(order => order.partySlots[rank] === candidate.partySlot).reduce((sum, order) => sum.add(order.weight), ZERO));
    const percentages = roundedPercentages(weights, digits);
    return {partySlot: candidate.partySlot, species: candidate.species, ranks: weights.map((weight, rank) => ({rank: rank + 1, probability: Number(weight), exact: weight.toJSON(), percent: percentages[rank]}))};
  });
  return {order: orders.length === 1 ? orders[0].partySlots : null, ranks,
    orders: orders.map(({partySlots, weight}) => ({partySlots, probability: Number(weight), exact: weight.toJSON()}))};
}

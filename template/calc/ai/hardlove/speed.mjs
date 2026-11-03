function roundUp(value, modifier) {
  return modifier === 4096 ? value : ((Math.imul(value, modifier) + 2048) >>> 0) >>> 12;
}

function heldEffect(mon, effect, items) {
  const explicit = mon.item_held_effect ?? mon.facts?.item_held_effect;
  return explicit === undefined ? items.includes(mon.item) : [effect, `HOLD_EFFECT_${effect}`].includes(explicit);
}

export function BattleAI_CalcEffectiveSpeed(state, mon, side = 'attacker', inParty = false) {
  const field = state.field ?? {};
  const facts = mon.facts ?? {};
  const sideState = field[side] ?? {};
  let stage = Math.min(6, mon.statBoosts?.speed ?? mon.states?.speed ?? 0);
  if (inParty && sideState.stickyWeb && (mon.isGrounded ?? facts.isGrounded ?? !((mon.types ?? []).includes('Flying') || ['Levitate', 'Eelevate'].includes(mon.ability))) && !heldEffect(mon, 'IGNORE_ENTRY_HAZARDS', ['Heavy-Duty Boots'])) {
    if (mon.ability === 'Contrary') stage++;
    else if (!['Full Metal Body', 'Clear Body', 'White Smoke', 'Mirror Armor'].includes(mon.ability)) stage--;
  }
  if (inParty && field.trickRoom && heldEffect(mon, 'DROP_SPEED_IN_TRICK_ROOM', ['Room Service'])) stage--;
  stage = Math.max(-6, stage);
  if (stage > 6) throw new RangeError('Source speed stage exceeds StatBoostModifiers table after Sticky Web');
  let speed = Math.trunc(mon.speed * (stage >= 0 ? 2 + stage : 2) / (stage >= 0 ? 2 : 2 - stage)) % 65536;
  let modifier = 4096;
  const weatherSuppressed = field.weatherSuppressed || [state.attacker, state.defender, state.attackerAlly, state.defenderAlly, ...(state.allies ?? [])].some(battler => battler && (battler.currentHP ?? battler.hp ?? 1) > 0 && ['Cloud Nine', 'Air Lock'].includes(battler.ability));
  if (!weatherSuppressed && ((mon.ability === 'Swift Swim' && ['Rain', 'Heavy Rain', 'Primordial Sea'].includes(field.weather)) || (mon.ability === 'Chlorophyll' && ['Sun', 'Harsh Sunshine', 'Desolate Land'].includes(field.weather)) || (mon.ability === 'Sand Rush' && ['Sand', 'Sandstorm'].includes(field.weather)) || (mon.ability === 'Slush Rush' && ['Hail', 'Snow'].includes(field.weather)))) modifier = roundUp(modifier, 8192);
  const terrainActive = (field.terrainTurns ?? 1) > 0;
  if (terrainActive && ['Electric', 'Electric Terrain'].includes(field.terrain) && mon.ability === 'Surge Surfer') modifier = roundUp(modifier, 8192);
  if (mon.ability === 'Unburden') {
    if ((mon.knockOffFlag ?? facts.knockOffFlag) && !mon.item) modifier = roundUp(modifier, 8192);
    if (inParty && terrainActive) {
      const terrain = (field.terrain ?? '').replace(' Terrain', '');
      const seedEffects = {Electric: 'BOOST_DEF_ON_ELECRIC_TERRAIN', Grassy: 'BOOST_DEF_ON_GRASSY_TERRAIN', Misty: 'BOOST_SPDEF_ON_MISTY_TERRAIN', Psychic: 'BOOST_SPDEF_ON_PSYCHIC_TERRAIN'};
      if (seedEffects[terrain] && heldEffect(mon, seedEffects[terrain], [`${terrain} Seed`])) modifier = roundUp(modifier, 8192);
    }
  }
  if (mon.ability === 'Quick Feet' && mon.status) modifier = roundUp(modifier, 6144);
  if (mon.ability === 'Slow Start' && (mon.slowStartCount ?? facts.slowStartCount ?? 0) < 5) modifier = roundUp(modifier, 2048);
  if (['Protosynthesis', 'Quark Drive'].includes(mon.ability) && (mon.paradoxBoostedStat ?? facts.paradoxBoostedStat) === 'speed') modifier = roundUp(modifier, 6144);
  if (heldEffect(mon, 'DITTO_SPEED_UP', ['Quick Powder']) && mon.species === 'Ditto' && !facts.transform) modifier = roundUp(modifier, 8192);
  if (heldEffect(mon, 'CHOICE_SPEED', ['Choice Scarf'])) modifier = roundUp(modifier, 6144);
  if (heldEffect(mon, 'SPEED_DOWN_GROUNDED', ['Iron Ball']) && mon.ability !== 'Klutz') modifier = roundUp(modifier, 2048);
  if (sideState.tailwind) modifier = roundUp(modifier, 8192);
  modifier = Math.max(410, modifier);
  speed = modifier === 4096 ? speed : ((Math.imul(speed, modifier) + 2047) >>> 0) >>> 12;
  if (mon.ability !== 'Quick Feet' && mon.status === 'par') speed = roundUp(speed, 2048);
  return Math.min(10000, speed % 65536);
}

export function AI_IsClient2Faster(state, client1, client2) {
  const speed1 = ((state.field?.trickRoom ? 10000 - client1.speed : client1.speed) % 8192);
  const speed2 = ((state.field?.trickRoom ? 10000 - client2.speed : client2.speed) % 8192);
  let last1 = heldEffect(client1, 'PRIORITY_DOWN', ['Lagging Tail', 'Full Incense']);
  let last2 = heldEffect(client2, 'PRIORITY_DOWN', ['Lagging Tail', 'Full Incense']);
  if (!last1 && !last2) {
    last1 = client1.ability === 'Stall';
    last2 = client2.ability === 'Stall';
  }
  if (last1 !== last2) return last1 ? 1 : 0;
  if (speed1 === speed2) return 2;
  return (last1 ? speed1 < speed2 : speed1 > speed2) ? 0 : 1;
}

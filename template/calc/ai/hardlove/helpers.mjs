const flinchingMoves = new Set(['Air Slash', 'Astonish', 'Bite', 'Bone Club', 'Dark Pulse', 'Double Iron Bash', 'Dragon Rush', 'Extrasensory', 'Fiery Wrath', 'Fire Fang', 'Floaty Fall', 'Headbutt', 'Heart Stamp', 'Hyper Fang', 'Ice Fang', 'Icicle Crash', 'Iron Head', 'Mountain Gale', 'Needle Arm', 'Rock Slide', 'Rolling Kick', 'Steamroller', 'Stomp', 'Thunder Fang', 'Triple Arrows', 'Twister', 'Waterfall', 'Zen Headbutt', 'Zing Zap']);
const thawingMoves = new Set(['Flame Wheel', 'Sacred Fire', 'Flare Blitz', 'Fusion Flare', 'Scald', 'Steam Eruption', 'Burn Up', 'Pyro Ball', 'Scorching Sands', 'Matcha Gotcha']);
const soundMoves = new Set(['Alluring Voice', 'Boomburst', 'Bug Buzz', 'Chatter', 'Clanging Scales', 'Clangorous Soul', 'Clangorous Soulblaze', 'Confide', 'Disarming Voice', 'Echoed Voice', 'Eerie Spell', 'Grass Whistle', 'Growl', 'Heal Bell', 'Howl', 'Hyper Voice', 'Metal Sound', 'Noble Roar', 'Overdrive', 'Parting Shot', 'Perish Song', 'Psychic Noise', 'Relic Song', 'Roar', 'Round', 'Screech', 'Sing', 'Snarl', 'Snore', 'Sparkling Aria', 'Supersonic', 'Torch Song', 'Uproar']);
const encoreMoves = new Set(['Fake Out', 'First Impression', 'Circle Throw', 'Dragon Tail', 'Rapid Spin']);
const encoreEffects = new Set(`FORCE_SWITCH PROTECT PROTECT_USER_SIDE STATUS_PARALYZE STATUS_POISON STATUS_BADLY_POISON ATK_DOWN ATK_DOWN_2 DEF_DOWN DEF_DOWN_2 SP_ATK_DOWN SP_ATK_DOWN_2 SP_DEF_DOWN SP_DEF_DOWN_2 SPEED_DOWN SPEED_DOWN_2 ATK_DEF_DOWN ATK_SP_ATK_DOWN COPY_MOVE_FOR_BATTLE SET_LIGHT_SCREEN SET_REFLECT SET_AURORA_VEIL RECOVER_HEALTH_AND_SLEEP CURSE SET_SPIKES TOXIC_SPIKES STICKY_WEB STEALTH_ROCK ATK_UP_2_STATUS_CONFUSION STATUS_CONFUSE CURE_PARTY_STATUS PREVENT_STATUS AVERAGE_HP SWALLOW TORMENT SP_ATK_UP_CAUSE_CONFUSION MAKE_GLOBAL_TARGET BOOST_ALLY_POWER_BY_50_PERCENT COPY_ABILITY HEAL_IN_3_TURNS GROUND_TRAP_USER_CONTINUOUS_HEAL RESTORE_HP_EVERY_TURN SWITCH_ABILITIES MAKE_SHARED_MOVES_UNUSEABLE HEAL_STATUS CAMOUFLAGE RESTORE_HALF_HP LIFE_DEW HEAL_HALF_REMOVE_FLYING_TYPE HEAL_HALF_DIFFERENT_IN_WEATHER GRAVITY GIVE_GROUND_IMMUNITY DOUBLE_SPEED_3_TURNS TRANSFER_STATUS SUPRESS_ABILITY SET_ABILITY_TO_INSOMNIA SET_ABILITY_TO_SIMPLE ENTRAINMENT REMOVE_HAZARDS_SCREENS_EVA_DOWN TRICK_ROOM CHANGE_TO_WATER_TYPE ADD_TYPE_GHOST ADD_TYPE_GRASS CHANGE_TO_PSYCHIC_TYPE APPLY_TERRAINS`.split(' '));

export function BattlerPositiveStatChangesSum(mon) {
  return Object.values(mon.statBoosts ?? mon.states ?? {}).reduce((sum, stage) => sum + Math.max(0, stage), 0);
}

export function BattlerKnowsMove(mon, move) {
  return (mon.moves ?? []).slice(0, 4).some(known => known.name === (move?.name ?? move));
}

export function BattlerKnowsMoveWithEffect(mon, effect) {
  return (mon.moves ?? []).slice(0, 4).some(move => move.effect === effect);
}

export function BattlerHasSoundBasedMove(mon) {
  return (mon.moves ?? []).slice(0, 4).some(move => soundMoves.has(move.name));
}

export function BattlerKnowsFlinchingMove(mon) {
  return (mon.moves ?? []).slice(0, 4).some(move => flinchingMoves.has(move.name));
}

export function BattlerKnowsThawingMove(mon) {
  return (mon.moves ?? []).slice(0, 4).some(move => thawingMoves.has(move.name));
}

export function MonDiesFromResidualDamage(state, mon, status = mon.status, isSeeded = mon.facts?.leechSeed) {
  const field = state.field ?? {};
  const maximum = mon.totalHP ?? mon.maxhp;
  const hp = mon.currentHP ?? mon.hp;
  const ability = mon.ability;
  const item = mon.item;
  const types = mon.types ?? [];
  const portion = divisor => Math.trunc(maximum / divisor);
  let damage = 0;
  if (['Sand', 'Sandstorm'].includes(field.weather)) {
    if (!types.some(type => ['Rock', 'Ground', 'Steel'].includes(type)) && !['Sand Force', 'Sand Rush', 'Sand Veil', 'Overcoat', 'Magic Guard'].includes(ability) && item !== 'Safety Goggles') damage += portion(16);
  } else if (['Snow', 'Hail'].includes(field.weather)) {
    if (ability === 'Ice Body') damage -= portion(16);
  } else if (['Sun', 'Harsh Sunshine', 'Desolate Land'].includes(field.weather)) {
    if (['Dry Skin', 'Solar Power'].includes(ability)) damage += portion(8);
  } else if (['Rain', 'Heavy Rain', 'Primordial Sea'].includes(field.weather)) {
    if (ability === 'Rain Dish') damage -= portion(16);
  }
  if (item === 'Leftovers' || (types.includes('Poison') && item === 'Black Sludge')) damage -= portion(16);
  if (['Grassy', 'Grassy Terrain'].includes(field.terrain) && (field.terrainTurns ?? 1) > 0) damage -= portion(16);
  if (isSeeded) damage += portion(8);
  if (mon.facts?.curse) damage += portion(4);
  if (status === 'brn') damage += portion(16);
  else if (status === 'psn') damage += ability === 'Poison Heal' ? -portion(8) : portion(8);
  else if (status === 'tox') {
    if (ability === 'Poison Heal') damage -= portion(8);
    else damage += Math.trunc(Math.min(15, (mon.facts?.toxicCounter ?? 0) + 1) * maximum / 16);
  }
  return damage > 0 && damage >= hp;
}

export function IsMonInflictedWithAnyNegativeStatus(mon) {
  if (mon.ability === 'Poison Heal' && ['psn', 'tox'].includes(mon.status)) return false;
  if (['psn', 'tox', 'brn', 'par'].includes(mon.status)) return true;
  return ['yawn', 'leechSeed', 'perishSong', 'attract', 'curse'].some(key => Boolean(mon.facts?.[key]));
}

export function IsUsedMoveEncouragedToEncore(move, effect = move?.effect) {
  return encoreMoves.has(move?.name ?? move) || encoreEffects.has(effect);
}

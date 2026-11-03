const key = value => String(typeof value === 'object' && value ? value.name : value ?? '').replace(/^(MOVE|ABILITY|ITEM|TYPE)_/, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const effectKey = value => String(value ?? '').replace(/^MOVE_EFFECT_/, '');
const has = (value, ...names) => names.some(name => key(value) === key(name));
const hp = mon => mon.currentHP ?? mon.hp;
const facts = mon => mon.facts || {};
const moldBreaker = mon => mon.hasMoldBreaker ?? has(mon.ability, 'Mold Breaker', 'Teravolt', 'Turboblaze');

export function IsMoveUsefulSoundMove(move) {
  return has(move, 'Alluring Voice', 'Boomburst', 'Bug Buzz', 'Chatter', 'Clanging Scales',
    'Clangorous Soulblaze', 'Eerie Spell', 'Grass Whistle', 'Hyper Voice', 'Overdrive',
    'Perish Song', 'Psychic Noise', 'Relic Song', 'Roar', 'Sing', 'Snarl', 'Snore',
    'Sparkling Aria', 'Torch Song', 'Uproar');
}

export function IsMoveValidSwitchingMove(move) {
  return has(move, 'Flip Turn', 'U-turn', 'Volt Switch', 'Parting Shot');
}

export function IsMoveForceSwitching(move) {
  return has(move, 'Roar', 'Whirlwind', 'Dragon Tail', 'Circle Throw');
}

export function BattleAI_AdjustUnusualMoveDamage(attacker, defender, damage, effect, move, effectiveness) {
  if (effectiveness === 0) return 0;
  const fixedDamageHits = has(attacker.ability, 'Parental Bond') ? 2 : 1;
  switch (effectKey(effect)) {
    case 'UP_TO_10_HITS':
      return damage * (has(attacker.ability, 'Skill Link') ? 10 : has(attacker.item, 'Loaded Dice') ? 5 : 3);
    case 'HIT_THREE_TIMES_ALWAYS_CRITICAL':
    case 'HIT_THREE_TIMES': return damage * 3;
    case 'MULTI_HIT':
      return damage * (has(attacker.ability, 'Skill Link') ? 5 : has(attacker.item, 'Loaded Dice') ? 4 : 3);
    case 'LEVEL_DAMAGE_FLAT':
    case 'RANDOM_DAMAGE_1_TO_150_LEVEL': return attacker.level * fixedDamageHits;
    case '10_DAMAGE_FLAT': return 20;
    case '40_DAMAGE_FLAT': return 40;
    case 'HIT_TWICE_AND_FLINCH':
    case 'POISON_MULTI_HIT':
    case 'HIT_TWICE': return has(move, 'Dragon Darts') ? damage : damage * 2;
    case 'HALVE_HP': {
      const first = Math.trunc(hp(defender) / 2);
      return first + (fixedDamageHits === 2 ? Math.trunc((hp(defender) - first) / 2) : 0);
    }
    case 'AVERAGE_HP':
      return hp(attacker) < hp(defender) ? hp(defender) - Math.trunc((hp(attacker) + hp(defender)) / 2) : 0;
    case 'SET_HP_EQUAL_TO_USER': return Math.max(0, hp(defender) - hp(attacker));
    case 'ONE_HIT_KO': return hp(defender);
    default: return damage;
  }
}

export function CanAttackerOneShotDefender(damage, category, move, attacker, defender) {
  if (!moldBreaker(attacker) && has(defender.ability, 'Ice Face') && (defender.form ?? 0) === 0 && has(category, 'Physical')) return false;
  return damage >= hp(defender);
}

export function BattleAI_AttackerHasOnlyIneffectiveMoves(state, attacker, knownMoves, effectiveness) {
  return attacker.moves.slice(0, knownMoves).every((move, index) =>
    has(move.category, 'Status') || !(move.power > 0) || move.pp === 0 || ![10, 20, 30, 40].includes(effectiveness[index]));
}

export function IsChoicedMoveConsidedUseless(move, category = move.category) {
  return has(category, 'Status') || has(move, 'Fake Out', 'First Impression');
}

export function IsBattleMonSlowerThanOpposition(state, ai, attacker) {
  const trickRoom = !!(state.field?.trickRoom ?? state.field?.facts?.trickRoom);
  return (trickRoom ? attacker.speed > ai.defenderMon.speed : attacker.speed < ai.defenderMon.speed)
    || !!(ai.isDoubleBattle && (trickRoom ? attacker.speed > ai.defenderAllySpeed : attacker.speed < ai.defenderAllySpeed));
}

export function BattleAI_GetWeather(state, mon) {
  if (has(mon?.ability ?? mon, 'Mega Sol')) return 'Sun';
  if ([state.attacker, state.defender, ...(state.allies || [])].some(candidate =>
    candidate && has(candidate.ability, 'Cloud Nine', 'Air Lock') && hp(candidate) !== 0)) return '';
  return state.field?.weather || '';
}

export function HasMovePranksterPriority(state, attacker, move, defender) {
  const target = key(move.target || 'single target');
  return has(attacker.ability, 'Prankster') && has(move.category, 'Status')
    && ['adjacentopponents', 'singletarget', 'normal', 'alladjacentfoes'].includes(target)
    && attacker !== defender;
}

export function IsMoveUsable(state, mon, move, lastMove = facts(mon).lastMove, index = mon.moves.indexOf(move)) {
  const input = facts(mon);
  if (move.pp === 0) return false;
  if ((input.disabledTurns || input.disabled) && has(move, input.disabledMove)) return false;
  if (input.torment && has(move, lastMove)) return false;
  if ((input.tauntTurns || input.taunted) && has(move.category, 'Status')) return false;
  const choiceMove = input.moveNoChoice ?? input.choiceMove;
  if (choiceMove && !has(choiceMove, 'None')) {
    if ((input.encoredTurns || input.encored) && !has(move, input.encoredMove ?? lastMove)) return false;
    if (has(mon.item, 'Choice Band', 'Choice Scarf', 'Choice Specs') && !has(move, choiceMove)) return false;
  }
  return true;
}

export function HasMovePriority(state, attacker, move, defender) {
  if (has(move, 'Grassy Glide') && has(state.field?.terrain, 'Grassy')) return true;
  if (has(attacker.ability, 'Triage') && (move.triage ?? move.flags?.includes('triage'))) return true;
  return HasMovePranksterPriority(state, attacker, move, defender) || (move.priority ?? 0) > 0;
}

export function AI_MonHasType(mon, type) {
  return (mon.types || [mon.type1, mon.type2]).some(value => has(value, type));
}

export function AI_IsClientGrounded(state, mon) {
  const input = facts(mon);
  if (input.fly || input.dig || input.dive || input.phantomForce) return false;
  if (state.field?.gravity || input.ingrain || input.grounded || has(mon.item, 'Iron Ball')) return true;
  return !(input.magnetRiseTurns ?? input.magnetRise) && !AI_MonHasType(mon, 'Flying')
    && !has(mon.ability, 'Levitate', 'Eelevate') && !has(mon.item, 'Air Balloon');
}

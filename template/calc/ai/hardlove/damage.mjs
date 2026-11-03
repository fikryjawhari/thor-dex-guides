import {TYPE_CHART, TYPE_ITEMS, RESIST_BERRIES, SHEER_FORCE_EFFECTS, SHEER_FORCE_MOVES, RECKLESS_EFFECTS, EFFECTIVENESS_CODES, EFFECTIVENESS_MULTIPLIERS} from './damage-data.mjs';

const floor = Math.floor;
const Q = {quarter: 1024, half: 2048, twoThirds: 2732, threeQuarters: 3072, one: 4096, onePointOne: 4505, glove: 4506, onePointTwo: 4915, onePointTwoFive: 5120, lifeOrb: 5324, onePointThree: 5325, aura: 5448, fourThirds: 5461, onePointFour: 5734, onePointFive: 6144, onePointSix: 6553, onePointEight: 7372, two: 8192};
const qDown = (value, modifier) => floor((value * modifier + 2047) / 4096);
const qUp = (value, modifier) => floor((value * modifier + 2048) / 4096);
const has = (value, ...names) => names.includes(value);
const fact = (mon, name, otherwise = false) => mon?.[name] ?? mon?.facts?.[name] ?? otherwise;
const fieldOf = state => state.field ?? {};
const hp = mon => mon?.hp ?? mon?.currentHP;
const maxhp = mon => mon.maxhp ?? mon.totalHP;
const itemOf = mon => has(mon?.item, 'None', '(none)', 'ITEM_NONE') ? '' : mon?.item ?? '';
const typesOf = mon => mon?.types ?? [mon?.type1, mon?.type2, mon?.type3].filter(Boolean);
const isType = (mon, type) => typesOf(mon).includes(type);
const ability = (mon, ...names) => has(mon?.ability, ...names);
const moldBreaker = mon => fact(mon, 'hasMoldBreaker', ability(mon, 'Mold Breaker', 'Teravolt', 'Turboblaze'));
const moveEffect = move => (move.effect ?? '').replace(/^MOVE_EFFECT_/, '');
const flagsOf = mon => mon.effect_of_moves ?? mon.effectOfMoves ?? mon.facts?.effectOfMoves ?? [];
const effectFlag = (mon, flag) => (Array.isArray(flagsOf(mon)) ? flagsOf(mon) : []).some(value => value.replace(/^MOVE_EFFECT_FLAG_/, '').toUpperCase() === flag) || fact(mon, flag.toLowerCase());
const stage = (mon, stat) => mon.statBoosts?.[stat] ?? mon.facts?.statBoosts?.[stat] ?? 0;
const boosted = (value, boost) => floor(value * (boost >= 0 ? 2 + boost : 2) / (boost >= 0 ? 2 : 2 - boost)) % 65536;
const terrain = state => fieldOf(state).terrain ?? '';
const terrainActive = state => !!terrain(state) && terrain(state) !== 'None' && (fieldOf(state).terrainTurns ?? 1) > 0;
const doubles = state => !!(fieldOf(state).isDoubleBattle || has(fieldOf(state).gameType, 'Doubles', 'Multi', 'Tag'));
const partner = (state, side) => state[`${side}Ally`] ?? fieldOf(state)[`${side}Ally`];
const living = mon => !!mon && hp(mon) > 0;
const transformed = mon => fact(mon, 'transformed');
const count = (mon, name) => fact(mon, name, 0);
const weatherIs = (weather, kind) => ({Sun: ['Sun', 'Harsh Sunshine', 'Extremely Harsh Sunlight'], Rain: ['Rain', 'Heavy Rain'], Sand: ['Sand', 'Sandstorm'], Snow: ['Snow'], Hail: ['Hail']}[kind] ?? [kind]).includes(weather);
const fieldAbility = (state, attacker, defender, name) => ability(attacker, name) || ability(defender, name) || [partner(state, 'attacker'), partner(state, 'defender'), ...(fieldOf(state).battlers ?? [])].some(mon => living(mon) && ability(mon, name)) || (fieldOf(state).abilities ?? []).includes(name);

function moveTrait(move, name) {
  if (move.facts?.[name] !== undefined) return !!move.facts[name];
  if (move[name] !== undefined) return !!move[name];
  return (move.flags ?? []).some(flag => flag.replace(/^FLAG_/, '').replace(/[^a-z]/gi, '').toLowerCase() === name.replace(/[^a-z]/gi, '').toLowerCase());
}

function contact(move, attacker, defender) {
  return moveTrait(move, 'contact') && !ability(attacker, 'Long Reach') && itemOf(attacker) !== 'Protective Pads' && itemOf(defender) !== 'Protective Pads' && !(itemOf(attacker) === 'Punching Glove' && moveTrait(move, 'punch'));
}

export function AI_IsClientGrounded(state, mon) {
  const grounded = (!ability(mon, 'Levitate', 'Eelevate') && itemOf(mon) !== 'Air Balloon' && !count(mon, 'magnetRiseTurns') && !isType(mon, 'Flying')) || itemOf(mon) === 'Iron Ball' || effectFlag(mon, 'INGRAIN') || fieldOf(state).gravity || fact(mon, 'grounded');
  return !!grounded && !['FLY', 'DIG', 'DIVE', 'PHANTOM_FORCE'].some(flag => effectFlag(mon, flag));
}

const grounded = (state, mon) => mon.isGrounded ?? mon.facts?.isGrounded ?? AI_IsClientGrounded(state, mon);

export function BattleAI_GetWeather(state, attackerAbility) {
  if (attackerAbility === 'Mega Sol') return 'Sun';
  if (fieldAbility(state, state.attacker, state.defender, 'Cloud Nine') || fieldAbility(state, state.attacker, state.defender, 'Air Lock')) return '';
  return fieldOf(state).weather ?? '';
}

export function BattleAI_GetDynamicMoveType(state, move, attacker) {
  let type = move.type;
  const weather = BattleAI_GetWeather({...state, attacker}, attacker.ability);
  switch (move.name) {
    case 'Natural Gift': type = fact(attacker, 'naturalGiftType', 'Normal'); break;
    case 'Judgment': type = itemOf(attacker).endsWith(' Plate') ? TYPE_ITEMS[itemOf(attacker)] ?? 'Normal' : 'Normal'; break;
    case 'Hidden Power': type = fact(attacker, 'hiddenPowerType', 'Normal'); break;
    case 'Weather Ball':
      if (weatherIs(weather, 'Rain')) type = 'Water';
      if (weatherIs(weather, 'Sand')) type = 'Rock';
      if (weatherIs(weather, 'Sun')) type = 'Fire';
      if (weatherIs(weather, 'Snow') || weatherIs(weather, 'Hail')) type = 'Ice';
      if (weather === 'Fog') type = 'Normal';
      if (weather === 'Shadowy Aura') type = 'Typeless';
      break;
    case 'Techno Blast': type = {'Burn Drive': 'Fire', 'Douse Drive': 'Water', 'Shock Drive': 'Electric', 'Chill Drive': 'Ice'}[itemOf(attacker)] ?? 'Normal'; break;
    case 'Revelation Dance': case 'Tera Blast': case 'Tera Starstorm': break;
    case 'Multi-Attack': type = itemOf(attacker).endsWith(' Memory') ? itemOf(attacker).slice(0, -7) : 'Normal'; break;
    case 'Aura Wheel': type = attacker.species === 'Morpeko' ? ['Electric', 'Dark'][attacker.form ?? 0] ?? 'Typeless' : 'Typeless'; break;
    case 'Terrain Pulse': type = terrainActive(state) && grounded(state, attacker) ? {Grassy: 'Grass', Electric: 'Electric', Misty: 'Fairy', Psychic: 'Psychic'}[terrain(state)] ?? 'Normal' : 'Normal'; break;
    case 'Raging Bull': type = attacker.species === 'Tauros' ? ['Normal', 'Fighting', 'Fire', 'Water'][attacker.form ?? 0] ?? 'Normal' : 'Normal'; break;
    case 'Ivy Cudgel': type = attacker.species === 'Ogerpon' ? ['Grass', 'Water', 'Fire', 'Rock'][attacker.form ?? 0] ?? 'Grass' : 'Grass'; break;
    default: type = 'Normal'; break;
  }
  if (ability(attacker, 'Normalize')) type = 'Normal';
  else if (move.type === 'Normal' && !moveTrait(move, 'normalizeExcluded')) type = {Pixilate: 'Fairy', Refrigerate: 'Ice', Aerilate: 'Flying', Galvanize: 'Electric', Dragonize: 'Dragon'}[attacker.ability] ?? 'Normal';
  if (ability(attacker, 'Liquid Voice') && moveTrait(move, 'sound')) type = 'Water';
  if (type === 'Normal' && fieldOf(state).ionDeluge) type = 'Electric';
  return type;
}

function priority(state, move, attacker, defender, includeGaleWings = true) {
  const prankster = ability(attacker, 'Prankster') && move.category === 'Status' && (move.target === 'ADJACENT_OPPONENTS' || (!move.target || move.target === 'SINGLE_TARGET') && !fact(defender, 'sameSide'));
  return (move.priority ?? 0) > 0 || prankster || move.name === 'Grassy Glide' && terrainActive(state) && terrain(state) === 'Grassy' || ability(attacker, 'Triage') && moveTrait(move, 'triage') || includeGaleWings && ability(attacker, 'Gale Wings') && BattleAI_GetDynamicMoveType(state, move, attacker) === 'Flying' && hp(attacker) === maxhp(attacker);
}

function blocked(state, move, attacker, defender, type, hasPriority) {
  if (hasPriority && !moldBreaker(attacker) && doubles(state) && living(partner(state, 'defender')) && ability(partner(state, 'defender'), 'Dazzling', 'Queenly Majesty', 'Armor Tail')) return true;
  if (!moldBreaker(attacker)) {
    if (type === 'Fire' && ability(defender, 'Flash Fire', 'Well-Baked Body')) return true;
    if (type === 'Electric' && ability(defender, 'Lightning Rod', 'Volt Absorb', 'Motor Drive')) return true;
    if (type === 'Water' && ability(defender, 'Water Absorb', 'Storm Drain', 'Dry Skin')) return true;
    if (type === 'Grass' && ability(defender, 'Sap Sipper')) return true;
    if (type === 'Ground' && (ability(defender, 'Earth Eater') || ability(defender, 'Levitate', 'Eelevate') && !grounded(state, defender))) return true;
    if (ability(defender, 'Bulletproof') && moveTrait(move, 'ball')) return true;
    if (hasPriority && ability(defender, 'Dazzling', 'Queenly Majesty', 'Armor Tail')) return true;
    if (ability(defender, 'Soundproof') && moveTrait(move, 'sound')) return true;
  }
  return type === 'Ground' && !grounded(state, defender) && (itemOf(defender) === 'Air Balloon' || !fact(defender, 'isSwitching') && count(defender, 'magnetRiseTurns') > 0);
}

export function BattleAI_GetTypeEffectiveness(state, move, attacker = state.attacker, defender = state.defender) {
  const type = BattleAI_GetDynamicMoveType({...state, attacker, defender}, move, attacker);
  const prankster = ability(attacker, 'Prankster') && move.category === 'Status' && (move.target === 'ADJACENT_OPPONENTS' || (!move.target || move.target === 'SINGLE_TARGET') && !fact(defender, 'sameSide'));
  if (prankster && isType(defender, 'Dark')) return 0;
  if (blocked(state, move, attacker, defender, type, prankster || (move.priority ?? 0) > 0)) return 0;
  if (moveTrait(move, 'powder') && (itemOf(defender) === 'Safety Goggles' || isType(defender, 'Grass') || ability(defender, 'Overcoat') && !moldBreaker(attacker))) return 0;
  let multiplier = 1;
  for (const defenseType of new Set(typesOf(defender))) {
    for (const attackType of move.name === 'Flying Press' ? [type, 'Flying'] : [type]) {
      let value = TYPE_CHART[attackType]?.[defenseType] ?? 1;
      if (defenseType === 'Ghost' && has(attackType, 'Normal', 'Fighting') && (fact(defender, 'foresight') || ability(attacker, 'Scrappy', "Mind's Eye"))) value = 1;
      if (defenseType === 'Flying' && value === 2 && weatherIs(BattleAI_GetWeather(state, attacker.ability), 'Strong Winds')) value = 1;
      if (defenseType === 'Flying' && (fact(defender, 'roostFlag') || attackType === 'Ground' && (fieldOf(state).gravity || itemOf(defender) === 'Iron Ball' || effectFlag(defender, 'INGRAIN') || fact(defender, 'grounded')))) value = 1;
      if (defenseType === 'Dark' && value === 0 && effectFlag(defender, 'MIRACLE_EYE')) value = 1;
      if (move.name === 'Freeze-Dry' && defenseType === 'Water' && TYPE_CHART[attackType]?.Water !== undefined) value = 2;
      if (move.name === 'Thousand Arrows' && defenseType === 'Flying' && TYPE_CHART[attackType]?.Flying !== undefined) value = 1;
      multiplier *= value;
    }
  }
  return EFFECTIVENESS_CODES.get(multiplier) ?? 0;
}

function powerFor(state, move, attacker, defender, options, weather) {
  let power = move.power;
  switch (move.name) {
    case 'Gyro Ball': power = attacker.speed === 0 ? 1 : Math.min(150, floor(25 * defender.speed / attacker.speed) + 1); break;
    case 'Electro Ball': power = defender.speed === 0 ? 40 : [40, 60, 80, 120][floor(attacker.speed / defender.speed)] ?? 150; break;
    case 'Low Kick': case 'Grass Knot': power = [100, 250, 500, 1000, 2000].findIndex(weight => defender.weight <= weight); power = power < 0 ? 120 : [20, 40, 60, 80, 100][power]; break;
    case 'Heavy Slam': case 'Heat Crash': power = defender.weight === 0 ? 120 : [40, 40, 60, 80, 100][floor(attacker.weight / defender.weight)] ?? 120; break;
    case 'Eruption': case 'Water Spout': power = floor(150 * hp(attacker) / maxhp(attacker)); break;
    case 'Reversal': case 'Flail': {
      const band = floor(48 * hp(attacker) / maxhp(attacker));
      power = band >= 32 ? 20 : band >= 17 ? 40 : band >= 10 ? 80 : band >= 5 ? 100 : band >= 2 ? 150 : 200;
      break;
    }
    case 'Crush Grip': case 'Wring Out': power = floor(qDown(12000, floor(hp(defender) * 4096 / maxhp(defender))) / 100); break;
    case 'Fury Cutter': power = power * 2 ** count(attacker, 'furyCutterCount') % 65536; break;
    case 'Power Trip': case 'Stored Power': power = 20 + 20 * Object.values(attacker.statBoosts ?? {}).reduce((sum, value) => sum + Math.max(0, value), 0); break;
    case 'Acrobatics': if (!itemOf(attacker) || itemOf(attacker) === 'Flying Gem') power *= 2; break;
    case 'Gust': case 'Twister': if (effectFlag(defender, 'FLY')) power *= 2; break;
    case 'Hex': if (defender.status || ability(defender, 'Comatose')) power *= 2; break;
    case 'Smelling Salts': if (defender.status === 'par') power *= 2; break;
    case 'Temper Flare': case 'Stomping Tantrum': if (fact(attacker, 'attackerHasMoveFailureLastTurn')) power *= 2; break;
    case 'Wake-Up Slap': if (defender.status === 'slp' || ability(defender, 'Comatose')) power *= 2; break;
    case 'Weather Ball': if (weather && weather !== 'Strong Winds') power *= 2; break;
    case 'Water Shuriken': if (attacker.species === 'Greninja' && attacker.form === 1) power = 20; break;
    case 'Bolt Beak': case 'Fishious Rend': if (attacker.speed >= defender.speed || fact(defender, 'isSwitching')) power *= 2; break;
    case 'Rising Voltage': if (terrainActive(state) && terrain(state) === 'Electric' && grounded(state, defender)) power = 140; break;
    case 'Fling': power = fact(attacker, 'flingPower', 0); break;
    case 'Natural Gift': power = fact(attacker, 'naturalGiftPower', 0); break;
    case 'Hidden Power': power = 60; break;
    case 'Magnitude': power = 71; break;
    case 'Triple Axel': case 'Triple Kick': power = options.pow ?? move.power; break;
    case 'Terrain Pulse': if (terrainActive(state) && grounded(state, attacker)) power *= 2; break;
    case 'Psyblade': if (terrainActive(state) && terrain(state) === 'Electric' && grounded(state, attacker)) power = 120; break;
  }
  return power % 65536;
}

export function BattleAI_CalcBaseDamage(state, move, attacker = state.attacker, defender = state.defender, options = {}) {
  state = {...state, attacker, defender};
  const field = fieldOf(state);
  const type = BattleAI_GetDynamicMoveType(state, move, attacker);
  const weather = BattleAI_GetWeather(state, attacker.ability);
  const physical = move.category === 'Physical';
  if (move.category === 'Status') throw new TypeError('BattleAI_CalcBaseDamage requires a damaging category');
  const bypass = moldBreaker(attacker) || move.name === 'Sunsteel Strike';
  const ally = partner(state, 'attacker');
  const defenderAlly = partner(state, 'defender');
  const activeAlly = doubles(state) && living(ally);
  const activeDefenderAlly = doubles(state) && living(defenderAlly);
  const critical = (options.critical ?? 1) > 1;
  let power = powerFor(state, move, attacker, defender, options, weather);
  let powerModifier = Q.one;
  const modifyPower = (condition, modifier) => { if (condition) powerModifier = qUp(powerModifier, modifier); };
  modifyPower(move.name === 'Facade' && has(attacker.status, 'brn', 'psn', 'tox', 'par'), Q.two);
  modifyPower(move.name === 'Brine' && hp(defender) <= floor(maxhp(defender) / 2), Q.two);
  modifyPower(move.name === 'Knock Off' && itemOf(defender) && fact(defender, 'itemRemovable', true), Q.onePointFive);
  modifyPower(move.name === 'Venoshock' && has(defender.status, 'psn', 'tox'), Q.two);
  modifyPower(move.name === 'Retaliate' && fact(attacker, 'teammateFaintedLastTurn'), Q.two);
  modifyPower(move.name === 'Grav Apple' && field.gravity, Q.onePointFive);
  modifyPower(move.name === 'Expanding Force' && terrainActive(state) && terrain(state) === 'Psychic', Q.onePointFive);
  modifyPower(move.name === 'Misty Explosion' && terrainActive(state) && terrain(state) === 'Misty', Q.onePointFive);
  modifyPower(fact(attacker, 'partnerMoveNo', '') === 'Helping Hand', Q.onePointFive);
  modifyPower(effectFlag(attacker, 'CHARGE') && type === 'Electric', Q.two);
  modifyPower(has(move.name, 'Solar Beam', 'Solar Blade') && ['Fog', 'Snow', 'Hail', 'Sand', 'Rain'].some(kind => weatherIs(weather, kind)), Q.half);
  if (terrainActive(state)) {
    modifyPower(grounded(state, attacker) && ({Grassy: 'Grass', Electric: 'Electric', Psychic: 'Psychic'}[terrain(state)] === type), Q.onePointThree);
    modifyPower(terrain(state) === 'Grassy' && grounded(state, defender) && has(move.name, 'Earthquake', 'Magnitude', 'Bulldoze'), Q.half);
    modifyPower(terrain(state) === 'Misty' && grounded(state, defender) && type === 'Dragon', Q.half);
  }
  for (const [auraType, auraAbility] of [['Fairy', 'Fairy Aura'], ['Dark', 'Dark Aura']]) modifyPower(type === auraType && fieldAbility(state, attacker, defender, auraAbility), fieldAbility(state, attacker, defender, 'Aura Break') ? Q.threeQuarters : Q.aura);
  if (ability(attacker, 'Rivalry') && fact(attacker, 'sex', 'Unknown') !== 'Unknown' && fact(defender, 'sex', 'Unknown') !== 'Unknown') modifyPower(true, fact(attacker, 'sex') === fact(defender, 'sex') ? Q.onePointTwoFive : Q.threeQuarters);
  const ate = {Aerilate: 'Flying', Pixilate: 'Fairy', Galvanize: 'Electric', Refrigerate: 'Ice', Dragonize: 'Dragon'};
  modifyPower(!moveTrait(move, 'normalizeExcluded') && (ate[attacker.ability] === type && move.type === 'Normal' || ability(attacker, 'Normalize') && type === 'Normal'), Q.onePointTwo);
  modifyPower(ability(attacker, 'Iron Fist') && moveTrait(move, 'punch'), Q.onePointTwo);
  modifyPower(ability(attacker, 'Reckless') && RECKLESS_EFFECTS.has(moveEffect(move)), Q.onePointTwo);
  modifyPower(ability(attacker, 'Sheer Force') && (SHEER_FORCE_EFFECTS.has(moveEffect(move)) || SHEER_FORCE_MOVES.has(move.name)), Q.onePointThree);
  modifyPower(ability(attacker, 'Sand Force') && weatherIs(weather, 'Sand') && has(type, 'Ground', 'Rock', 'Steel'), Q.onePointThree);
  const analyticOpponents = [defender, ...(field.battlers ?? []).filter(mon => mon !== attacker && mon !== defender), ...(activeAlly ? [ally] : []), ...(activeDefenderAlly ? [defenderAlly] : [])];
  modifyPower(ability(attacker, 'Analytic') && moveEffect(move) !== 'HIT_IN_3_TURNS' && analyticOpponents.every(mon => !living(mon) || mon === defender && fact(defender, 'isSwitching') || attacker.speed <= mon.speed), Q.onePointThree);
  modifyPower(ability(attacker, 'Tough Claws') && contact(move, attacker, defender), Q.onePointThree);
  modifyPower(ability(attacker, 'Technician') && move.name !== 'Struggle' && power <= 60, Q.onePointFive);
  modifyPower(ability(attacker, 'Flare Boost') && attacker.status === 'brn' && !physical, Q.onePointFive);
  modifyPower(ability(attacker, 'Toxic Boost') && has(attacker.status, 'psn', 'tox') && physical, Q.onePointFive);
  for (const [name, trait] of [['Strong Jaw', 'bite'], ['Mega Launcher', 'pulse'], ['Sharpness', 'slice']]) modifyPower(ability(attacker, name) && moveTrait(move, trait), Q.onePointFive);
  modifyPower(ability(attacker, 'Punk Rock') && moveTrait(move, 'sound'), Q.onePointThree);
  modifyPower(ability(attacker, 'Steely Spirit') && type === 'Steel', Q.onePointFive);
  modifyPower(ability(attacker, 'Stakeout') && fact(defender, 'isSwitching'), Q.two);
  modifyPower(activeAlly && ability(ally, 'Power Spot'), Q.onePointThree);
  modifyPower(activeAlly && ability(ally, 'Battery') && !physical, Q.onePointThree);
  modifyPower(activeAlly && ability(ally, 'Steely Spirit') && type === 'Steel', Q.onePointFive);
  modifyPower(type === 'Fire' && ability(defender, 'Dry Skin') && !bypass, Q.onePointTwoFive);
  modifyPower(itemOf(attacker) === 'Muscle Band' && physical, Q.onePointOne);
  modifyPower(itemOf(attacker) === 'Wise Glasses' && !physical, Q.onePointOne);
  modifyPower(TYPE_ITEMS[itemOf(attacker)] === type, Q.onePointTwo);
  for (const [species, items, supported] of [['Dialga', ['Adamant Orb', 'Adamant Crystal'], ['Dragon', 'Steel']], ['Palkia', ['Lustrous Orb', 'Lustrous Globe'], ['Dragon', 'Water']], ['Giratina', ['Griseous Orb', 'Griseous Core'], ['Dragon', 'Ghost']], ['Latios', ['Soul Dew'], ['Dragon', 'Psychic']], ['Latias', ['Soul Dew'], ['Dragon', 'Psychic']]]) modifyPower(attacker.species === species && items.includes(itemOf(attacker)) && supported.includes(type), Q.onePointTwo);
  modifyPower(itemOf(attacker).endsWith(' Gem') && itemOf(attacker).slice(0, -4) === type, Q.onePointFive);
  modifyPower(itemOf(attacker) === 'Punching Glove' && moveTrait(move, 'punch'), Q.glove);
  for (const [item, forms] of [['Wellspring Mask', [1, 5]], ['Hearthflame Mask', [2, 6]], ['Cornerstone Mask', [3, 7]]]) modifyPower(itemOf(attacker) === item && attacker.species === 'Ogerpon' && forms.includes(attacker.form), Q.onePointTwo);
  power = Math.max(1, qDown(power, powerModifier)) % 65536;
  let attackStage = stage(attacker, physical ? 'attack' : 'spAttack');
  if (!bypass && ability(defender, 'Unaware')) attackStage = 0;
  let rawAttack = physical ? attacker.attack : attacker.spAttack ?? attacker.sp_attack;
  if (move.name === 'Foul Play') { rawAttack = defender.attack; attackStage = stage(defender, 'attack'); }
  if (move.name === 'Body Press') { rawAttack = attacker.defense; attackStage = stage(attacker, 'defense'); }
  if (critical) attackStage = Math.max(0, attackStage);
  let attack = boosted(rawAttack, attackStage);
  if (physical && ability(attacker, 'Hustle')) attack = qDown(attack, Q.onePointFive);
  let attackModifier = Q.one;
  const modifyAttack = (condition, modifier) => { if (condition) attackModifier = qUp(attackModifier, modifier); };
  modifyAttack(ability(attacker, 'Slow Start') && count(attacker, 'slowStartCount') < 5 && (physical || moveTrait(move, 'zMove')), Q.half);
  modifyAttack(ability(attacker, 'Defeatist') && hp(attacker) <= floor(maxhp(attacker) / 2), Q.half);
  modifyAttack(weatherIs(weather, 'Sun') && ability(attacker, 'Solar Power') && !physical, Q.onePointFive);
  modifyAttack(weatherIs(weather, 'Sun') && (ability(attacker, 'Flower Gift') || activeAlly && ability(ally, 'Flower Gift')) && physical, Q.onePointFive);
  modifyAttack(weatherIs(weather, 'Sun') && ability(attacker, 'Orichalcum Pulse') && physical, Q.fourThirds);
  modifyAttack(ability(attacker, 'Guts') && attacker.status && physical, Q.onePointFive);
  for (const [name, boostedType] of [['Overgrow', 'Grass'], ['Blaze', 'Fire'], ['Torrent', 'Water'], ['Swarm', 'Bug']]) modifyAttack(ability(attacker, name) && type === boostedType && hp(attacker) <= floor(maxhp(attacker) / 3), Q.onePointFive);
  modifyAttack(fact(attacker, 'flashFireActivated') && type === 'Fire', Q.onePointFive);
  modifyAttack(ability(attacker, 'Plus', 'Minus') && activeAlly && ability(ally, 'Plus', 'Minus') && !physical, Q.onePointFive);
  modifyAttack(ability(attacker, 'Steelworker') && type === 'Steel', Q.onePointFive);
  modifyAttack(ability(attacker, 'Huge Power', 'Pure Power') && physical, Q.two);
  modifyAttack(ability(attacker, 'Water Bubble') && type === 'Water', Q.two);
  modifyAttack(ability(attacker, 'Gorilla Tactics') && physical, Q.onePointFive);
  modifyAttack(ability(attacker, "Dragon's Maw") && type === 'Dragon', Q.onePointFive);
  modifyAttack(ability(attacker, 'Transistor') && type === 'Electric', Q.onePointThree);
  modifyAttack(ability(attacker, 'Rocky Payload') && type === 'Rock', Q.onePointFive);
  modifyAttack(ability(attacker, 'Protosynthesis', 'Quark Drive') && fact(attacker, 'paradoxBoostedStat') === (physical ? 'attack' : 'spAttack'), Q.onePointThree);
  modifyAttack(ability(attacker, 'Hadron Engine') && !physical && terrainActive(state) && terrain(state) === 'Electric', Q.fourThirds);
  modifyAttack(ability(attacker, 'Fire Mane') && type === 'Fire', Q.onePointFive);
  modifyAttack(!bypass && ability(defender, 'Heatproof') && type === 'Fire', Q.half);
  modifyAttack(!bypass && ability(defender, 'Thick Fat') && has(type, 'Fire', 'Ice'), Q.half);
  modifyAttack(!bypass && ability(defender, 'Water Bubble') && type === 'Fire', Q.half);
  modifyAttack(!bypass && ability(defender, 'Purifying Salt') && type === 'Ghost', Q.half);
  modifyAttack(itemOf(attacker) === 'Choice Band' && physical, Q.onePointFive);
  modifyAttack(itemOf(attacker) === 'Choice Specs' && !physical, Q.onePointFive);
  modifyAttack(itemOf(attacker) === 'Thick Club' && has(attacker.species, 'Cubone', 'Marowak') && !transformed(attacker) && physical, Q.two);
  modifyAttack(itemOf(attacker) === 'Deep Sea Tooth' && attacker.species === 'Clamperl' && !transformed(attacker) && !physical, Q.two);
  modifyAttack(itemOf(attacker) === 'Light Ball' && attacker.species === 'Pikachu' && !transformed(attacker), Q.two);
  attack = Math.max(1, qDown(attack, attackModifier)) % 65536;
  const physicalDefense = physical || has(move.name, 'Psyshock', 'Psystrike', 'Secret Sword');
  let defenseStage = stage(defender, physicalDefense ? 'defense' : 'spDefense');
  if (terrainActive(state) && defenseStage < 6 && (physicalDefense && (terrain(state) === 'Electric' && itemOf(defender) === 'Electric Seed' || terrain(state) === 'Grassy' && itemOf(defender) === 'Grassy Seed') || !physicalDefense && (terrain(state) === 'Misty' && itemOf(defender) === 'Misty Seed' || terrain(state) === 'Psychic' && itemOf(defender) === 'Psychic Seed'))) defenseStage++;
  if (ability(attacker, 'Unaware') || has(move.name, 'Chip Away', 'Sacred Sword', 'Darkest Lariat')) defenseStage = 0;
  if (critical) defenseStage = Math.min(0, defenseStage);
  let defense = boosted(physicalDefense ? defender.defense : defender.spDefense ?? defender.sp_defense, defenseStage);
  if (physicalDefense && weatherIs(weather, 'Snow') && typesOf(defender).slice(0, 2).includes('Ice') || !physicalDefense && weatherIs(weather, 'Sand') && typesOf(defender).slice(0, 2).includes('Rock')) defense = qDown(defense, Q.onePointFive);
  let defenseModifier = Q.one;
  const modifyDefense = (condition, modifier) => { if (condition) defenseModifier = qUp(defenseModifier, modifier); };
  modifyDefense(weatherIs(weather, 'Sun') && !physicalDefense && (!bypass && ability(defender, 'Flower Gift') || activeDefenderAlly && ability(defenderAlly, 'Flower Gift')), Q.onePointFive);
  modifyDefense(!bypass && ability(defender, 'Marvel Scale') && defender.status && physicalDefense, Q.onePointFive);
  modifyDefense(!bypass && ability(defender, 'Grass Pelt') && terrainActive(state) && terrain(state) === 'Grassy' && physicalDefense, Q.onePointFive);
  modifyDefense(!bypass && ability(defender, 'Fur Coat') && physicalDefense, Q.two);
  modifyDefense(ability(defender, 'Protosynthesis', 'Quark Drive') && fact(defender, 'paradoxBoostedStat') === (physicalDefense ? 'defense' : 'spDefense'), Q.onePointThree);
  modifyDefense(itemOf(defender) === 'Eviolite' && fact(defender, 'canEvolve'), Q.onePointFive);
  modifyDefense(itemOf(defender) === 'Assault Vest' && !physicalDefense, Q.onePointFive);
  modifyDefense(itemOf(defender) === 'Deep Sea Scale' && defender.species === 'Clamperl' && !transformed(defender) && !physicalDefense, Q.two);
  modifyDefense(itemOf(defender) === 'Metal Powder' && defender.species === 'Ditto' && !transformed(defender) && physicalDefense, Q.two);
  defense = Math.max(1, qDown(defense, defenseModifier)) % 65536;
  const numerator = ((floor(2 * attacker.level / 5) + 2) * power * attack) >>> 0;
  return floor((defense ? floor(numerator / defense) : 0) / 50) + 2;
}

function makeResult(range, effectiveness, options, forcedRoll) {
  const result = {damageRange: range, moveEffectiveness: effectiveness};
  if (options.roll !== undefined) {
    if (!Number.isInteger(options.roll) || options.roll < 0 || options.roll > 15) throw new RangeError('roll must be an integer from 0 through 15');
    result.damageRoll = forcedRoll ?? range[options.roll];
  }
  return result;
}

export function BattleAI_CalcDamageInternal(state, move, attacker = state.attacker, defender = state.defender, options = {}) {
  state = {...state, attacker, defender};
  const field = fieldOf(state);
  const type = BattleAI_GetDynamicMoveType(state, move, attacker);
  const weather = BattleAI_GetWeather(state, attacker.ability);
  const physical = move.category === 'Physical';
  const bypass = moldBreaker(attacker) || move.name === 'Sunsteel Strike';
  const hasPriority = priority(state, move, attacker, defender);
  const zero = () => makeResult(Array(16).fill(0), 0, options);
  let canHit = true;
  if (effectFlag(defender, 'SEMI_INVULNERABLE') || ['FLY', 'DIVE', 'DIG', 'PHANTOM_FORCE'].some(flag => effectFlag(defender, flag))) {
    canHit = has(move.name, 'Surf', 'Whirlpool') && effectFlag(defender, 'DIVE') || has(move.name, 'Earthquake', 'Fissure', 'Magnitude') && effectFlag(defender, 'DIG') || has(move.name, 'Sky Uppercut', 'Gust', 'Twister', 'Hurricane', 'Thunder', 'Smack Down', 'Thousand Arrows') && effectFlag(defender, 'FLY');
  }
  if (!canHit && !ability(defender, 'No Guard') && !ability(attacker, 'No Guard') && (hasPriority || attacker.speed > defender.speed)) return zero();
  if (blocked(state, move, attacker, defender, type, hasPriority)) return zero();
  if (move.name === 'Dream Eater' && defender.status !== 'slp') return zero();
  if (move.name === 'Steel Roller' && (!terrain(state) || terrain(state) === 'None')) return zero();
  if (move.name === 'Belch' && !fact(defender, 'canBelch')) return zero();
  if (move.name === 'Poltergeist' && !itemOf(defender)) return zero();
  if (moveEffect(move) === 'ONE_HIT_KO' && ability(defender, 'Sturdy') && !bypass) return zero();
  if (move.name === 'Burn Up' && !isType(attacker, 'Fire') || move.name === 'Double Shock' && !isType(attacker, 'Electric')) return zero();
  if (!bypass && ability(defender, 'Ice Face') && (defender.form ?? 0) === 0 && !transformed(defender) && physical) return zero();
  if (moveEffect(move) === 'HIT_FIRST_IF_TARGET_ATTACKING' && fact(defender, 'isSwitching')) return zero();
  if (hasPriority && grounded(state, defender) && terrainActive(state) && terrain(state) === 'Psychic') return zero();
  if (has(field.weather, 'Harsh Sunshine', 'Extremely Harsh Sunlight') && type === 'Water' || field.weather === 'Heavy Rain' && type === 'Fire') return zero();
  if (field.gravity && has(move.name, 'Fly', 'Bounce', 'Jump Kick', 'High Jump Kick', 'Flying Press')) return zero();
  if (count(attacker, 'throatChopTimer') && moveTrait(move, 'sound')) return zero();
  if (!fact(attacker, 'firstTurnOut') && has(move.name, 'Fake Out', 'First Impression')) return zero();
  let critCondition = 1;
  if (fact(attacker, 'focusEnergy') || has(itemOf(attacker), 'Leek', 'Stick') && has(attacker.species, 'Farfetch’d', "Farfetch'd", 'Sirfetch’d', "Sirfetch'd")) critCondition += 2;
  if (has(itemOf(attacker), 'Scope Lens', 'Razor Claw')) critCondition++;
  if (ability(attacker, 'Super Luck')) critCondition++;
  if (moveEffect(move) === 'HIGH_CRITICAL') critCondition++;
  if (has(field.permanentOverworldWeather, 7, 8) && fact(attacker, 'isEnemy')) critCondition++;
  const critical = (critCondition >= 4 || count(attacker, 'laserFocusTimer')) && !(!bypass && ability(defender, 'Shell Armor', 'Battle Armor'));
  let damage = BattleAI_CalcBaseDamage(state, move, attacker, defender, {...options, critical: critical ? 2 : 1});
  if (doubles(state) && (field.possibleHits ?? 1) > 1 && has(move.target, 'ADJACENT_OPPONENTS', 'ALL_ADJACENT')) damage = qDown(damage, Q.threeQuarters);
  if (options.isParentalBondSecondHit) damage = qDown(damage, Q.quarter);
  if (weatherIs(weather, 'Rain') && itemOf(defender) !== 'Utility Umbrella') {
    if (type === 'Fire') damage = qDown(damage, Q.half);
    if (type === 'Water') damage = qDown(damage, Q.onePointFive);
  }
  if (weatherIs(weather, 'Sun')) {
    if (type === 'Fire' && itemOf(defender) !== 'Utility Umbrella') damage = qDown(damage, Q.onePointFive);
    if (type === 'Water') {
      if (move.name === 'Hydro Steam' && itemOf(attacker) !== 'Utility Umbrella') damage = qDown(damage, Q.onePointFive);
      else if (itemOf(defender) !== 'Utility Umbrella') damage = qDown(damage, Q.half);
    }
  }
  if (fact(defender, 'wideOpen')) damage *= 2;
  if (critical) damage = floor(damage * 150 / 100);
  let range = Array.from({length: 16}, (_, index) => floor(damage * (85 + index) / 100));
  if (isType(attacker, type) || ability(attacker, 'Libero') || ability(attacker, 'Protean') && !fact(attacker, 'abilityActivated')) range = range.map(value => qDown(value, ability(attacker, 'Adaptability') ? Q.two : Q.onePointFive));
  let effectiveness = BattleAI_GetTypeEffectiveness(state, move, attacker, defender);
  if (move.name === 'Sheer Cold' && isType(defender, 'Ice')) effectiveness = 0;
  if (has(move.name, 'Sheer Cold', 'Fissure', 'Guillotine', 'Horn Drill') && (!ability(attacker, 'No Guard') && attacker.level < defender.level || !bypass && ability(defender, 'Sturdy'))) effectiveness = 0;
  if (ability(defender, 'Wonder Guard') && !bypass && effectiveness < 20) effectiveness = 0;
  if (has(move.name, 'Self-Destruct', 'Explosion', 'Misty Explosion', 'Final Gambit')) return makeResult(range, effectiveness, options, 0);
  range = range.map(value => floor(value * (EFFECTIVENESS_MULTIPLIERS.get(effectiveness) ?? 0)));
  if (physical && attacker.status === 'brn' && !ability(attacker, 'Guts') && move.name !== 'Facade') range = range.map(value => qDown(value, Q.half));
  let modifier = Q.one;
  const modify = (condition, value) => { if (condition) modifier = qUp(modifier, value); };
  modify(effectFlag(defender, 'MINIMIZE') && moveTrait(move, 'minimize'), Q.two);
  modify(effectFlag(defender, 'DIG') && has(move.name, 'Earthquake', 'Magnitude'), Q.two);
  modify(effectFlag(defender, 'DIVE') && has(move.name, 'Surf', 'Whirlpool'), Q.two);
  modify(effectiveness >= 20 && has(move.name, 'Collision Course', 'Electro Drift'), Q.fourThirds);
  modify((physical ? field.reflect : field.lightScreen) || field.auroraVeil, !critical && moveEffect(move) !== 'REMOVE_SCREENS' && !ability(attacker, 'Infiltrator') ? doubles(state) ? Q.twoThirds : Q.half : Q.one);
  modify(effectiveness > 0 && effectiveness < 10 && ability(attacker, 'Tinted Lens'), Q.onePointTwoFive);
  modify(effectiveness >= 20 && ability(attacker, 'Neuroforce'), Q.onePointTwoFive);
  modify(effectiveness >= 20 && !bypass && ability(defender, 'Solid Rock', 'Filter', 'Prism Armor'), Q.threeQuarters);
  modify(ability(attacker, 'Sniper') && critical, Q.onePointFive);
  modify(!bypass && ability(defender, 'Fluffy') && contact(move, attacker, defender), Q.half);
  modify(!bypass && ability(defender, 'Fluffy') && type === 'Fire', Q.two);
  modify(!bypass && ability(defender, 'Aura Guard') && contact(move, attacker, defender), Q.half);
  modify(!bypass && ability(defender, 'Multiscale', 'Shadow Shield') && hp(defender) === maxhp(defender), Q.half);
  modify(doubles(state) && !bypass && living(partner(state, 'defender')) && ability(partner(state, 'defender'), 'Friend Guard'), Q.threeQuarters);
  modify(!bypass && ability(defender, 'Punk Rock') && moveTrait(move, 'sound'), Q.half);
  modify(!bypass && ability(defender, 'Ice Scales') && !physical, Q.half);
  if (itemOf(attacker) === 'Metronome' && count(attacker, 'metronomeTurns')) modifier = qUp(modifier, [Q.one, Q.onePointTwo, Q.onePointFour, Q.onePointSix, Q.onePointEight, Q.two][Math.min(5, count(attacker, 'metronomeTurns'))]);
  modify(effectiveness >= 20 && itemOf(attacker) === 'Expert Belt', Q.onePointTwo);
  modify((type === 'Normal' || effectiveness >= 20) && itemOf(defender) === RESIST_BERRIES[type], Q.half);
  modify(itemOf(attacker) === 'Life Orb', Q.lifeOrb);
  range = range.map(value => { const final = qDown(value, modifier); return (final === 0 && effectiveness !== 0 ? 1 : final) % 65536; });
  if (move.name === 'Dragon Darts' && (!doubles(state) || isType(partner(state, 'defender') ?? {}, 'Fairy'))) range = range.map(value => value * 2);
  return makeResult(range, effectiveness, options);
}

export function BattleAI_IsParentalBondMove(state, move, attacker = state.attacker, defender = state.defender, options = {}) {
  if (moveTrait(move, 'parentalBondBanned')) return false;
  if (doubles(state) && fieldOf(state).gameType !== 'Tag' && has(move.target, 'ADJACENT_OPPONENTS', 'ALL_ADJACENT')) return false;
  return true;
}

export function BattleAI_CalcDamage(state, move, attacker = state.attacker, defender = state.defender, options = {}) {
  if (has(move.name, 'Triple Axel', 'Triple Kick')) {
    const hits = [1, 2, 3].map(hit => BattleAI_CalcDamageInternal(state, move, attacker, defender, {...options, pow: hit * (move.name === 'Triple Axel' ? 20 : 10)}));
    const range = Array.from({length: 16}, (_, index) => hits.reduce((sum, hit) => sum + hit.damageRange[index], 0));
    const result = makeResult(range, hits[2].moveEffectiveness, options, options.roll === undefined ? undefined : hits.reduce((sum, hit) => sum + hit.damageRoll, 0));
    result.hitRanges = hits.map(hit => [...hit.damageRange]); // each hit has its own BattleRand % 16
    return result;
  }
  const result = BattleAI_CalcDamageInternal(state, move, attacker, defender, options);
  const first = [...result.damageRange];
  if (ability(attacker, 'Parental Bond') && BattleAI_IsParentalBondMove(state, move, attacker, defender, options)) {
    const second = BattleAI_CalcDamageInternal(state, move, attacker, defender, {...options, isParentalBondSecondHit: true});
    result.damageRange = result.damageRange.map((value, index) => value + second.damageRange[index]);
    if (options.roll !== undefined) result.damageRoll += second.damageRoll;
    result.hitRanges = [first, [...second.damageRange]];
    return result;
  }
  result.hitRanges = [[...result.damageRange]];
  return result;
}

// The rolled damage's distribution: one independent BattleRand % 16 per hit (Triple Axel / Kick: three, Parental
// Bond: two), summed as BattleAI_CalcDamage sums each hit's damageRoll. Map raw damage -> count out of 16^hits.
export function BattleAI_RolledDamageOutcomes(hitRanges) {
  let outcomes = new Map([[0, 1]]);
  for (const range of hitRanges) {
    const next = new Map();
    for (const [total, count] of outcomes) for (const damage of range) next.set(total + damage, (next.get(total + damage) ?? 0) + count);
    outcomes = next;
  }
  return outcomes;
}

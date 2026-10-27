import catalog from 'guide-calc-data';
import {Pokemon} from '@smogon/calc/src/pokemon';
import {Move} from '@smogon/calc/src/move';
import {Field} from '@smogon/calc/src/field';
import {calculateDPP} from '@smogon/calc/src/mechanics/gen4';
import {calculateBWXY} from '@smogon/calc/src/mechanics/gen56';
import {calculateSMSSSV} from '@smogon/calc/src/mechanics/gen789';
import {getModifiedStat, getFinalSpeed, isGrounded, checkItem, checkForecast, checkAirLock} from '@smogon/calc/src/mechanics/util';
import {applyPhase, prepareRules} from './rules.js';
import {speciesName, weightNames} from './names.js';

const statNames = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const toID = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const table = values => ({get: id => values[toID(id)], *[Symbol.iterator]() { yield* Object.values(values); }});
const statTable = (values, fallback) => Object.fromEntries(statNames.map((name, index) => [name, values?.[index] ?? fallback]));
let data;
let profile;
let generation;
let speciesByID;
let speciesNames;
let koCache;
let stockMoves;
let dataCrit;

function mergeRecord(base, override) {
  const result = {...base};
  for (const [key, value] of Object.entries(override || {})) {
    if (key === 'effect') continue;
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeRecord(result[key], value) : value;
  }
  return result;
}

function stockData(number) {
  const result = {};
  for (let current = 4; current <= number; current++) {
    for (const [collection, entries] of Object.entries(catalog[current])) {
      result[collection] ||= {};
      for (const [id, value] of Object.entries(entries)) {
        if (value === null) delete result[collection][id];
        else result[collection][id] = {...value};
      }
    }
  }
  return result;
}

function effectName(collection, name, original = false) {
  const effect = profile.over?.[collection]?.[name]?.effect;
  if (effect !== undefined) return effect;
  return original ? '' : name;
}

function hitCount(value) {
  const count = Math.max(1, Math.min(10, Math.trunc(Number(value))));
  if (!Number.isFinite(count)) throw new Error('DMG: hit count must be a number');
  return count;
}

function init(guide, configuration) {
  if (![4, 5, 6, 7, 8, 9].includes(configuration.gen)) throw new Error('DMG: supported generations are 4-9');
  if (configuration.over?.typeGen !== undefined && ![4, 5, 6, 7, 8, 9].includes(configuration.over.typeGen)) {
    throw new Error('DMG: typeGen must be 4-9');
  }
  if (configuration.over?.critMultiplier !== undefined && !(Number.isFinite(configuration.over.critMultiplier) && configuration.over.critMultiplier > 0)) {
    throw new Error('DMG: critMultiplier must be positive');
  }
  data = guide;
  profile = configuration;
  koCache = new Map();
  const stock = stockData(profile.gen);
  stockMoves = stock.moves;
  // The hack's data gives every move's crit stage (MV.cr); without it, stock's high-crit and always-crit moves.
  dataCrit = data.MV.some(entry => entry?.cr);
  const modern = stockData(9);
  const species = {};
  speciesByID = new Map(data.P.map(entry => [String(entry.id), entry]));
  speciesNames = new Map();
  for (const entry of data.P) {
    const overrides = profile.over?.species?.[entry.id] || profile.over?.species?.[entry.n];
    const name = overrides?.effect || speciesName(entry.n);
    speciesNames.set(String(entry.id), name);
    const id = toID(name);
    const known = stock.species[id] || modern.species[id] || {};
    const ability = data.AB?.[entry.a?.[0]];
    species[id] = mergeRecord({
      ...known, id, kind: 'Species', name,
      baseStats: statTable(entry.s, 1), types: entry.t,
      weightkg: known.weightkg ?? weightNames(entry.n).map(form => stock.species[toID(form)] || modern.species[toID(form)])
        .find(form => form?.weightkg)?.weightkg ?? 1,
      nfe: !!entry.et?.length,
      abilities: {0: ''},
    }, overrides);
    if (ability) species[id].abilities = {0: effectName('abilities', ability[0], !!ability[2])};
  }
  const moves = {};
  for (let index = 0; index < data.M.length; index++) {
    const name = data.M[index];
    const entry = data.MV[index];
    if (!entry) continue;
    const engineName = effectName('moves', name, !!entry.x) || `Guide move ${index}`;
    const id = toID(engineName);
    const known = stock.moves[id] || modern.moves[id] || {};
    const flagNames = {ballistic: 'bullet', biting: 'bite', punching: 'punch'};
    const flags = entry.f === undefined ? {...known.flags} : Object.fromEntries(
      entry.f.map(flag => [flagNames[flag] || flag, 1]));
    moves[toID(name)] = mergeRecord({
      ...known, id, kind: 'Move', name: engineName,
      basePower: Number(entry.bp) || 0, type: entry.t, category: entry.c,
      priority: entry.pr ?? known.priority ?? 0, flags,
    }, profile.over?.moves?.[name]);
    moves[id] = moves[toID(name)];
  }
  const items = {...modern.items, ...stock.items};
  for (const [name, overrides] of Object.entries(profile.over?.items || {})) {
    items[toID(overrides.effect || name)] = mergeRecord(items[toID(overrides.effect || name)] || {name}, overrides);
  }
  const chart = profile.over?.typeGen ? stockData(profile.over.typeGen).types : stock.types;
  const types = {};
  const typeNames = new Set([...Object.values(chart).map(entry => entry.name), ...Object.keys(data.TC || {})]);
  for (const name of typeNames) {
    const effectiveness = {...chart[toID(name)]?.effectiveness};
    for (const target of typeNames) {
      effectiveness[target] = profile.over?.typeChart?.[name]?.[target]
        ?? (profile.over?.typeGen || data.TC?.[name]?.[target] === undefined ? effectiveness[target] ?? 1 : data.TC[name][target] / 10);
    }
    types[toID(name)] = {id: toID(name), name, kind: 'Type', effectiveness};
  }
  generation = {
    num: profile.gen, critMultiplier: profile.over?.critMultiplier, afterMoveItems: profile.over?.afterMove || [],
    species: table(species), moves: table({...stock.moves, ...moves}),
    items: table(items), abilities: table({...modern.abilities, ...stock.abilities}),
    natures: table(stock.natures), types: table(types),
    guideRules: prepareRules(profile.over),
  };
  // A target in the state a move punishes (`def.vol`, Gen 5+): double damage, ahead of the hack's own final rules.
  (generation.guideRules.finalMods ||= []).unshift({phase: 'finalMods', when: {ref: 'state.volDouble'}, append: [8192]});
}

function pokemon(set) {
  const entry = speciesByID.get(String(set.id));
  if (!entry) throw new Error(`DMG: unknown species id ${set.id}`);
  const ability = data.AB?.[set.ab];
  const abilityName = profile.abilities !== false && ability
    ? effectName('abilities', ability[0], !!ability[2]) : '';
  const itemName = profile.items !== false && !set.used ? effectName('items', set.it || '') : '';
  const statusEntry = profile.status?.find(([key]) => key === set.st);
  const status = statusEntry ? profile.over?.status?.[set.st] ?? set.st : '';
  const result = new Pokemon(generation, speciesNames.get(String(set.id)), {
    level: set.lv ?? 50,
    nature: profile.natures === false ? 'Serious' : set.nat || 'Serious',
    ability: abilityName || 'Guide no ability', item: itemName,
    status, ivs: statTable(set.iv, 31), evs: statTable(profile.evs === false ? undefined : set.ev, 0),
    boosts: statTable(set.stg, 0), curHP: set.hp,
    boostedStat: ['Protosynthesis', 'Quark Drive'].includes(abilityName) ? 'auto' : undefined,
  });
  if (set.hp !== undefined) result.originalCurHP = Math.max(0, Math.min(result.maxHP(), set.hp));
  if (result.hasAbility('Unburden') && set.used) result.abilityOn = true;
  result.guideItem = set.it || '';
  return result;
}

function stats(set) {
  const mon = pokemon(set);
  return statNames.map(stat => mon.rawStats[stat]);
}

function battleField(values) {
  const options = {attackerSide: {}, defenderSide: {}};
  for (const entry of profile.field || []) {
    const value = values[entry.k];
    if (value === undefined || !entry.to) continue;
    if (entry.type === 'select' && !entry.o.some(([option]) => option === value)) continue;
    const target = entry.side === 'atk' ? options.attackerSide : entry.side === 'def' ? options.defenderSide : options;
    target[entry.to] = entry.type === 'toggle' ? !!value : value;
  }
  const result = new Field(options);
  for (const side of ['atk', 'def']) {
    const target = side === 'atk' ? result.attackerSide : result.defenderSide;
    for (const [key, property] of Object.entries({Charge: 'isCharge', Protect: 'isProtected',
      Foresight: 'isForesight', Swamp: 'isSwamp', PowerTrick: 'isPowerTrick'})) {
      if (values[side + key] !== undefined) target[property] = !!values[side + key];
    }
    for (const [key, property] of Object.entries({PowerSpot: 'isPowerSpot', SteelySpirit: 'isSteelySpirit',
      FlowerGift: 'isFlowerGift'})) {
      const legacy = key === 'FlowerGift' && profile.field?.some(entry => entry.k === side + key
        && entry.to === property && !entry.doubles);
      target[property] = (result.gameType === 'Doubles' || legacy) && !!values[side + key];
    }
  }
  for (const key of ['FairyAura', 'DarkAura', 'AuraBreak']) {
    if (values['ally' + key] !== undefined) result['is' + key] = result.gameType === 'Doubles' && !!values['ally' + key];
  }
  for (const key of ['TabletsOfRuin', 'SwordOfRuin', 'VesselOfRuin', 'BeadsOfRuin']) {
    if (values['atk' + key] !== undefined || values['def' + key] !== undefined) {
      result['is' + key] = result.gameType === 'Doubles' && !!(values['atk' + key] || values['def' + key]);
    }
  }
  for (const entry of profile.field || []) {
    const target = entry.side === 'atk' ? result.attackerSide : entry.side === 'def' ? result.defenderSide : result;
    const source = entry.side === 'atk' ? options.attackerSide : entry.side === 'def' ? options.defenderSide : options;
    if (!(entry.to in target) && Object.prototype.hasOwnProperty.call(source, entry.to)) target[entry.to] = source[entry.to];
  }
  return result;
}

const typeChangers = ['Protean', 'Libero'];
const changesType = (mon, set) => typeChangers.includes(data.AB?.[set.ab]?.[0]) || mon.hasAbility(...typeChangers);

function fieldPokemon(set, values, side) {
  const mon = pokemon(set);
  if (mon.hasAbility('Plus', 'Minus')) mon.abilityOn = values.gameType === 'Doubles' && !!values[side + 'PlusMinus'];
  if (set.pty && changesType(mon, set)) mon.types = [set.pty];
  if (values[side + 'Roost'] && mon.hasType('Flying')) {
    mon.types = mon.types.filter(type => type !== 'Flying');
    if (!mon.types.length) mon.types = [profile.gen === 4 ? 'Normal' : '???'];
  }
  mon.guideGrounded = !!(values[side + 'Grounded'] || values[side + 'Ingrain']);
  mon.guideAirborne = !!(values[side + 'MagnetRise'] || values[side + 'Telekinesis']);
  return mon;
}

function speed(set, values = {}, side = 'atk', otherSet = null) {
  const mon = fieldPokemon(set, values, side);
  const field = battleField(values);
  if (otherSet) {
    const otherSide = side === 'atk' ? 'def' : 'atk';
    const other = fieldPokemon(otherSet, values, otherSide);
    intimidate(other, mon, otherSet, [], side, field);
    intimidate(mon, other, set, [], otherSide, field);
    checkAirLock(other, field);
  }
  checkAirLock(mon, field);
  checkForecast(mon, field.weather);
  checkItem(mon, field.isMagicRoom);
  return getFinalSpeed(generation, mon, field, side === 'def' ? field.defenderSide : field.attackerSide);
}

function entry(set, values = {}, side = 'atk') {
  const mon = fieldPokemon(set, values, side);
  const field = battleField(values);
  checkItem(mon, field.isMagicRoom);
  const result = {parts: []};
  if (profile.gen >= 8 && mon.hasItem('Heavy-Duty Boots')) return result;
  const max = mon.maxHP();
  const damage = (label, divisor, effectiveness = 1) => {
    if (!mon.hasAbility('Magic Guard') && effectiveness > 0) {
      result.parts.push({l: label, v: -Math.max(1, Math.floor(max * effectiveness / divisor))});
    }
  };
  const effectiveness = type => mon.types.reduce((total, target) =>
    total * (generation.types.get(toID(type))?.effectiveness[target] ?? 1), 1);
  const layers = (key, limit) => Math.max(0, Math.min(limit, Math.trunc(Number(values[side + key])) || 0));
  if (profile.gen >= 4 && values[side + 'StealthRock']) damage('Stealth Rock', 8, effectiveness('Rock'));
  if (profile.gen >= 8 && values[side + 'Steelsurge']) damage('Steelsurge', 8, effectiveness('Steel'));
  if (!isGrounded(mon, field)) return result;
  const spikes = layers('Spikes', 3);
  if (spikes && profile.gen >= 2) damage('Spikes', [0, 8, 6, 4][spikes]);
  const toxic = layers('ToxicSpikes', 2);
  const poisonImmune = mon.hasType('Poison', 'Steel') || mon.hasAbility('Immunity', 'Pastel Veil', 'Comatose', 'Purifying Salt')
    || (mon.hasAbility('Leaf Guard') && field.hasWeather('Sun', 'Harsh Sunshine'))
    || (mon.hasAbility('Flower Veil') && mon.hasType('Grass'))
    || (mon.hasAbility('Shields Down') && mon.name === 'Minior-Meteor');
  if (profile.gen >= 4 && toxic && !values[side + 'Safeguard'] && !mon.status && !poisonImmune && !field.hasTerrain('Misty')) {
    result.status = toxic === 2 ? 'tox' : 'psn';
  }
  if (profile.gen >= 6 && values[side + 'StickyWeb']
    && !mon.hasAbility('Clear Body', 'White Smoke', 'Full Metal Body', 'Mirror Armor')
    && !(profile.gen >= 9 && mon.hasItem('Clear Amulet'))) result.spe = mon.hasAbility('Contrary') ? 1 : -1;
  return result;
}

// End-of-turn HP change for one Pokémon, part by part: [{l, v: [turn 1..4]}], negative = damage. Mirrors stock
// getEndOfTurn for the effects the page can state; the profile's `residual` adds a hack's
// own abilities and statuses ({abilities: {Name: [sign, divisor]}, status: {key: [sign, divisor, label]}}).
function residual(set, values = {}, otherSet = null, side = 'atk') {
  const mon = fieldPokemon(set, values, side);
  const otherSide = side === 'atk' ? 'def' : 'atk';
  const other = otherSet ? fieldPokemon(otherSet, values, otherSide) : null;
  const field = battleField(values);
  checkAirLock(mon, field);
  if (other) checkAirLock(other, field);
  checkForecast(mon, field.weather);
  if (other) checkForecast(other, field.weather);
  checkItem(mon, field.isMagicRoom);
  if (other) checkItem(other, field.isMagicRoom);
  const max = mon.maxHP();
  const guard = mon.hasAbility('Magic Guard');
  const items = !field.isMagicRoom && !mon.hasAbility('Klutz');
  const parts = [];
  const add = (label, sign, divisor) => {
    if (sign < 0 && guard) return;
    const value = Math.max(1, Math.floor(max / divisor));
    parts.push({l: label, v: Array(4).fill(sign * value)});
  };
  if (field.hasWeather('Sun', 'Harsh Sunshine')) {
    if (mon.hasAbility('Dry Skin', 'Solar Power')) add(mon.ability, -1, 8);
  } else if (field.hasWeather('Rain', 'Heavy Rain')) {
    if (mon.hasAbility('Dry Skin')) add('Dry Skin', 1, 8);
    else if (mon.hasAbility('Rain Dish')) add('Rain Dish', 1, 16);
  } else if (field.hasWeather('Sand')) {
    if (!mon.hasType('Rock', 'Ground', 'Steel') && !mon.hasAbility('Overcoat', 'Sand Force', 'Sand Rush', 'Sand Veil')
      && !(items && mon.hasItem('Safety Goggles'))) add('Sandstorm', -1, 16);
  } else if (field.hasWeather('Hail', 'Snow')) {
    if (mon.hasAbility('Ice Body')) add('Ice Body', 1, 16);
    else if (field.hasWeather('Hail') && !mon.hasType('Ice') && !mon.hasAbility('Overcoat', 'Snow Cloak')
      && !(items && mon.hasItem('Safety Goggles'))) add('Hail', -1, 16);
  }
  if (items && mon.hasItem('Leftovers')) add('Leftovers', 1, 16);
  else if (items && mon.hasItem('Black Sludge')) add('Black Sludge', mon.hasType('Poison') ? 1 : -1, mon.hasType('Poison') ? 16 : 8);
  else if (items && mon.hasItem('Sticky Barb')) add('Sticky Barb', -1, 8);
  if (profile.gen >= 6 && field.hasTerrain('Grassy') && isGrounded(mon, field)) add('Grassy Terrain', 1, 16);
  const own = profile.residual?.status?.[set.st];
  if (own) add(own[2], own[0], own[1]);
  else if ((set.st === 'psn' || set.st === 'tox') && mon.hasAbility('Poison Heal')) add('Poison Heal', 1, 8);
  else if (set.st === 'psn') add('Poison', -1, 8);
  else if (set.st === 'tox' && !guard) {
    const counter = Math.max(1, set.toxn || 1);
    parts.push({l: 'Toxic', v: [0, 1, 2, 3].map(turn => -Math.max(1, Math.floor(max * Math.min(15, counter + turn) / 16)))});
  } else if (set.st === 'brn') add(mon.hasAbility('Heatproof') ? 'Burn (Heatproof)' : 'Burn', -1,
    (profile.gen > 6 ? 16 : 8) * (mon.hasAbility('Heatproof') ? 2 : 1));
  const ability = profile.residual?.abilities?.[data.AB?.[set.ab]?.[0]];
  if (ability) add(data.AB[set.ab][0], ability[0], ability[1]);
  const active = key => !!values[side + key];
  const root = items && mon.hasItem('Big Root');
  const healing = label => {
    const amount = Math.max(1, Math.floor(max / 16));
    parts.push({l: label, v: Array(4).fill(root ? Math.floor(amount * 13 / 10) : amount)});
  };
  if (active('Trapped')) {
    const band = other && holdsItem(other, field) && other.hasItem('Binding Band');
    add('Trapped', -1, profile.gen >= 6 ? band ? 6 : 8 : profile.gen === 5 && band ? 8 : 16);
  }
  if (active('Seeded')) add('Leech Seed', -1, profile.gen === 1 ? 16 : 8);
  if (other && values[otherSide + 'Seeded'] && !other.hasAbility('Magic Guard')) {
    const amount = Math.max(1, Math.floor(other.maxHP() / (profile.gen === 1 ? 16 : 8)));
    const value = root ? Math.floor(amount * 13 / 10) : amount;
    if (!other.hasAbility('Liquid Ooze') || !guard) {
      parts.push({l: other.hasAbility('Liquid Ooze') ? 'Leech Seed (Liquid Ooze)' : 'Leech Seed recovery',
        v: Array(4).fill(other.hasAbility('Liquid Ooze') ? -value : value)});
    }
  }
  if (active('SaltCure')) add('Salt Cure', -1, mon.hasType('Water', 'Steel') ? 4 : 8);
  if (active('Cursed')) add('Curse', -1, 4);
  if (active('Nightmare') && (mon.hasStatus('slp') || mon.hasAbility('Comatose'))) add('Nightmare', -1, 4);
  if (active('Ingrain')) healing('Ingrain');
  if (active('AquaRing')) healing('Aqua Ring');
  if (profile.gen >= 5 && active('SeaOfFire') && !mon.hasType('Fire')) add('Sea of Fire', -1, 8);
  if (other?.hasAbility('Bad Dreams') && (mon.hasStatus('slp') || mon.hasAbility('Comatose'))) add('Bad Dreams', -1, 8);
  return parts;
}

// KO count with the defender's end-of-turn change after each turn (eot: four per-turn totals; room: HP missing).
function knockout(per, hp, eot = [0, 0, 0, 0], room = 0) {
  if (hp <= 0) return {n: 0, p: 0};
  const max = per.reduce((sum, rolls) => sum + Math.max(...rolls), 0);
  const drain = eot.reduce((sum, value) => sum + Math.max(0, -value), 0);
  if (max * 4 + drain < hp || !max) return {n: 0, p: 0};
  const key = `${per.map(rolls => rolls.join(',')).join(';')};${hp};${eot.join(',')};${room}`;
  if (koCache.has(key)) return {...koCache.get(key)};
  if (eot.some(Boolean)) {
    const result = turnKnockout(per, hp, eot, room);
    if (koCache.size >= 256) koCache.clear();
    koCache.set(key, result);
    return {...result};
  }
  const frequencies = per.map(rolls => {
    const counts = new Map();
    for (const roll of rolls) counts.set(roll, (counts.get(roll) || 0) + 1 / 16);
    return counts;
  });
  let distribution = new Float64Array(hp);
  distribution[0] = 1;
  let probability = 0;
  let result = {n: 0, p: 0};
  for (let hit = 1; hit <= per.length * 4; hit++) {
    const next = new Float64Array(hp);
    for (let damage = 0; damage < hp; damage++) {
      if (!distribution[damage]) continue;
      for (const [roll, chance] of frequencies[(hit - 1) % per.length]) {
        if (damage + roll >= hp) probability += distribution[damage] * chance;
        else next[damage + roll] += distribution[damage] * chance;
      }
    }
    distribution = next;
    if (hit % per.length === 0 && probability > 0) {
      result = {n: hit / per.length, p: Math.min(1, probability)};
      break;
    }
  }
  if (koCache.size >= 256) koCache.clear();
  koCache.set(key, result);
  return {...result};
}

function turnKnockout(per, hp, eot, room) {
  const frequencies = per.map(rolls => {
    const counts = new Map();
    for (const roll of rolls) counts.set(roll, (counts.get(roll) || 0) + 1 / 16);
    return counts;
  });
  let distribution = new Map([[0, 1]]);
  let probability = 0;
  for (let turn = 1; turn <= 4; turn++) {
    for (const counts of frequencies) {
      const next = new Map();
      for (const [damage, chance] of distribution) {
        for (const [roll, rollChance] of counts) {
          if (damage + roll >= hp) probability += chance * rollChance;
          else next.set(damage + roll, (next.get(damage + roll) || 0) + chance * rollChance);
        }
      }
      distribution = next;
    }
    const next = new Map();
    for (const [damage, chance] of distribution) {
      const after = Math.max(-room, damage - eot[turn - 1]);
      if (after >= hp) probability += chance;
      else next.set(after, (next.get(after) || 0) + chance);
    }
    distribution = next;
    if (probability > 0) return {n: turn, p: Math.min(1, probability)};
  }
  return {n: 0, p: 0};
}

const AUTO_POWER = new Set(['Low Kick', 'Grass Knot', 'Heavy Slam', 'Heat Crash', 'Flail', 'Reversal', 'Gyro Ball',
  'Electro Ball', 'Crush Grip', 'Wring Out', 'Hard Press', 'Punishment', 'Fling', 'Natural Gift']);
// Moves with a listed power that stock scales by HP: the result reports the power used, as for AUTO_POWER.
const HP_POWER = new Set(['Eruption', 'Water Spout', 'Dragon Energy']);
// Variable-power moves with a default when the page sets none: Return / Frustration at maximum happiness / none
// (Gen 3+ floor(255 * 10 / 25) = 102 in every guide's source). Reported as `bp`, like AUTO_POWER; a slot `bp` overrides.
const DEFAULT_POWER = {Return: 102, Frustration: 102};

// Z-move power (Gen 7, profile `zmove`): the hack's own Z power (profile `zpow`, by move name), else stock's own Z power
// for a move the hack leaves alone where that is not the band (`catalog.zpow`), else the game's band for its power.
function zPower(moveData, power, listed) {
  const id = toID(moveData.name);
  if (profile.zpow?.[moveData.name]) return profile.zpow[moveData.name];
  if (catalog.zpow[id] && (listed || stockMoves[id]?.basePower === moveData.basePower)) return catalog.zpow[id];
  return power <= 55 ? 100 : power <= 65 ? 120 : power <= 75 ? 140 : power <= 85 ? 160 : power <= 95 ? 175
    : power <= 100 ? 180 : power <= 110 ? 185 : power <= 125 ? 190 : power <= 130 ? 195 : 200;
}

// Battle state the page passes per row (README → Battle state): `slot.st` is a toggle or the earlier count,
// `slot.curl` Defense Curl before Rollout / Ice Ball, `slot.met` earlier uses with a held Metronome, `atk.fnt` fainted
// allies (Supreme Overlord), `def.vol` the target's state. Stock has none of these counters (its `timesUsed` repeats
// the whole hit over turns). A hack's `over.state` changes one move: `false` = the state does nothing (flat in its
// source), `{curl: false}` = Defense Curl doesn't double it, `{vol: false}` / `{vol: 'power'}` = the target's state
// doesn't double it / doubles its power instead of its damage.
const COUNTERS = {
  'Fury Cutter': [4, (power, count) => Math.min(160, power * 2 ** count)],
  'Echoed Voice': [4, (power, count) => Math.min(200, power * (count + 1))],
  'Rollout': [4, (power, count) => power * 2 ** count],
  'Ice Ball': [4, (power, count) => power * 2 ** count],
  'Rage Fist': [6, (power, count) => power + 50 * count],
  'Last Respects': [100, (power, count) => power + 50 * count],
};
// Doubled power when the row's toggle is on (Revenge / Avalanche: hit by this target first; Lash Out: a stat dropped
// this turn; Fusion / Round: the partner move went just before; Fickle Beam: the 30% double).
const TOGGLES = new Set(['Assurance', 'Revenge', 'Avalanche', 'Retaliate', 'Stomping Tantrum', 'Temper Flare',
  'Lash Out', 'Fusion Flare', 'Fusion Bolt', 'Round', 'Fickle Beam']);
// Pledge combos (`slot.st` = the partner's pledge): power 150, the pair's type, always STAB.
const PLEDGES = {'Fire Pledge': 'Fire', 'Water Pledge': 'Water', 'Grass Pledge': 'Grass'};
const pledgeType = pair => pair.includes('Water') ? (pair.includes('Fire') ? 'Water' : 'Grass') : 'Fire';
// Double damage against a target in that state (`def.vol`): [first generation, last generation]. Before Gen 5 (Gen 6
// for Minimize) the power doubles instead.
const VOLATILE = {
  dig: {'Earthquake': [4], 'Magnitude': [4]},
  dive: {'Surf': [4], 'Whirlpool': [4]},
  fly: {'Gust': [4], 'Twister': [4]},
  min: {'Stomp': [4], 'Steamroller': [5], 'Body Slam': [6], 'Dragon Rush': [6], 'Flying Press': [6],
    'Phantom Force': [6, 6], 'Shadow Force': [6, 6], 'Heat Crash': [6], 'Heavy Slam': [7], 'Malicious Moonsault': [7],
    'Supercell Slam': [9]},
};
const VOLATILE_NOTES = {dig: 'Dig', dive: 'Dive', fly: 'Fly', min: 'Minimize'};

// The move's power from the row's state, and whether the target's state doubles the damage. A power the page sets
// (variable moves) keeps only the target's state.
function statePower(name, power, def, slot, fixed) {
  const own = profile.over?.state?.[name];
  let result = power;
  let double = false;
  if (!fixed && own !== false && slot.st !== undefined && slot.st !== false) {
    const counter = COUNTERS[name];
    if (counter) {
      const count = Math.max(0, Math.min(counter[0], Math.trunc(Number(slot.st)) || 0));
      result = counter[1](power, count);
    } else if (TOGGLES.has(name) && slot.st === true) result = power * 2;
  }
  if (!fixed && (name === 'Rollout' || name === 'Ice Ball') && slot.curl && own?.curl !== false) result *= 2;
  const range = VOLATILE[def.vol]?.[name];
  if (range && own?.vol !== false && profile.gen >= range[0] && profile.gen <= (range[1] ?? 9)) {
    if (own?.vol === 'power' || profile.gen < (def.vol === 'min' ? 6 : 5)) result *= 2;
    else double = true;
  }
  return {power: result, double};
}

// Crit chance by counted stage (Bulbapedia, Critical hit): Gen 4-5, Gen 6, Gen 7+; a profile's `critStages` replaces
// it (Hardlove's five-entry table). The stage counts the move's `cr` (data.json; 6+ = always a crit, not a stage), the
// pumped state (field `atkFocus`: Focus Energy, Dire Hit or an eaten Lansat, +2), one held item and Super Luck, capped
// at the table's last index. `over.critItems` changes an item ({Leek: {"Farfetch'd": 1}}: by species name).
const CRIT_TABLES = {4: [1 / 16, 1 / 8, 1 / 4, 1 / 3, 1 / 2], 6: [1 / 16, 1 / 8, 1 / 2, 1], 7: [1 / 24, 1 / 8, 1 / 2, 1]};
const CRIT_ITEMS = {'Scope Lens': 1, 'Razor Claw': 1, 'Leek': {"Farfetch'd": 2, "Sirfetch'd": 2},
  'Stick': {"Farfetch'd": 2, "Sirfetch'd": 2}, 'Lucky Punch': {'Chansey': 2}};
const FOCUS = {atk: 'atkFocus', def: 'defFocus'};

// {stage, p, forced}: forced = always-crit move, Merciless on a poisoned target or a stage the table makes certain;
// Battle Armor / Shell Armor (unless the attacker breaks molds) make it p 0 and not forced.
function critChance(entry, moveData, attacker, defender, values) {
  const table = profile.critStages || profile.over?.critStages
    || CRIT_TABLES[profile.gen >= 7 ? 7 : profile.gen === 6 ? 6 : 4];
  const own = dataCrit ? entry.cr || 0 : moveData.willCrit ? 6 : (moveData.critRatio || 1) - 1;
  const item = {...CRIT_ITEMS, ...profile.over?.critItems}[attacker.item];
  const species = toID(attacker.name);
  const itemStage = typeof item === 'number' ? item
    : Object.entries(item || {}).find(([name]) => species.includes(toID(name)))?.[1] || 0;
  const cheer = profile.gen >= 9 && profile.over?.state?.['Dragon Cheer'] !== false
    && values.gameType === 'Doubles' && values.atkDragonCheer ? (attacker.hasType('Dragon') ? 2 : 1) : 0;
  const counted = (own < 6 ? own : 0) + Math.max(values[FOCUS.atk] ? 2 : 0, cheer) + itemStage + (attacker.hasAbility('Super Luck') ? 1 : 0)
    + Math.max(0, Math.trunc(Number(values.atkCritBonus)) || 0);
  const stage = Math.min(table.length - 1, counted);
  const blocked = !!values.defLuckyChant || defender.hasAbility('Battle Armor', 'Shell Armor')
    && !attacker.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze');
  const forced = !blocked && (profile.gen >= 7 && values.atkLaserFocus || own >= 6 || table[stage] >= 1
    || (attacker.hasAbility('Merciless') && defender.hasStatus('psn', 'tox')));
  return {stage, p: blocked ? 0 : forced ? 1 : table[stage], forced};
}

// Stat changes before the hit (`pre`: [{who, stat, by, src, hit?}], actual changes only). The input stages are the
// starting point, never a trigger of their own; Simple doubles and Contrary reverses each change on the battler that
// receives it. First-hit events change the stages the hit uses: a held terrain seed (consumed); on entry Dauntless
// Shield and Intrepid Sword (unless the set's `entry` is false) and Download (the set's `dl`: missing = from the target's
// stats, 'atk' / 'spa' = the boost it got, 'off' = none); stock's own copies are switched off. The move's own: the
// charge turn of Skull Bash / Meteor Beam / Electro Shot and Spectral Thief (target's losses, then the attacker's gains;
// a hack's `over.state['Spectral Thief']`: `false` = no theft, `{theft: 'headroom'}` = expansion's: a stat at +6 is
// skipped, the gain is cut to the room left before Simple / Contrary); `slot.pre: false` leaves them out. Between-hit
// events (after each strike that reaches the target, before the next: `hit` = that next hit) are listed; stock works the
// stage changes it knows into the later hits' damage (Stamina, Water Compaction, Weak Armor, Kee / Maranga, Luminous Moss).
// `over.afterMove` lists held items the hack fires after the whole move instead (Hardlove: Kee / Maranga Berry).
const STAGES = ['atk', 'def', 'spa', 'spd', 'spe'];
const SEEDS = {'Electric Seed': ['Electric', 'def'], 'Grassy Seed': ['Grassy', 'def'],
  'Misty Seed': ['Misty', 'spd'], 'Psychic Seed': ['Psychic', 'spd']};
const ENTRY = {'Dauntless Shield': [8, 'def'], 'Intrepid Sword': [8, 'atk']};
const CHARGE = {'Skull Bash': 'def', 'Meteor Beam': 'spa', 'Electro Shot': 'spa'};
// Between-hit items: [first generation, condition, stat, stages], consumed once.
const HIT_ITEMS = {
  'Weakness Policy': [6, hit => hit.eff > 1, ['atk', 'spa'], 2],
  'Kee Berry': [6, hit => hit.cat === 'Physical', ['def'], 1],
  'Maranga Berry': [6, hit => hit.cat === 'Special', ['spd'], 1],
  'Luminous Moss': [6, hit => hit.type === 'Water', ['spd'], 1],
  'Absorb Bulb': [5, hit => hit.type === 'Water', ['spa'], 1],
  'Cell Battery': [5, hit => hit.type === 'Electric', ['atk'], 1],
  'Snowball': [6, hit => hit.type === 'Ice', ['atk'], 1],
};

function stageChanger(pre) {
  return (mon, who, stat, amount, src, hit) => {
    const by = amount * (mon.hasAbility('Simple') ? 2 : 1) * (mon.hasAbility('Contrary') ? -1 : 1);
    const before = mon.boosts[stat];
    mon.boosts[stat] = Math.max(-6, Math.min(6, before + by));
    if (mon.boosts[stat] !== before) pre.push({who, stat, by: mon.boosts[stat] - before, src, ...(hit ? {hit} : {})});
  };
}

const holdsItem = (mon, field) => !!mon.item && !field.isMagicRoom && !mon.hasAbility('Klutz');

function intimidate(source, target, set, pre, who, field, reflected = false) {
  if (!source.hasAbility('Intimidate') || set.intim === false || source.originalCurHP === 0 || target.originalCurHP === 0) return;
  if (target.hasAbility('Clear Body', 'White Smoke', 'Full Metal Body', 'Hyper Cutter')
    || (profile.gen >= 8 && target.hasAbility('Inner Focus', 'Oblivious', 'Own Tempo', 'Scrappy'))
    || (profile.gen >= 9 && holdsItem(target, field) && target.hasItem('Clear Amulet'))) return;
  if (profile.gen >= 8 && target.hasAbility('Mirror Armor') && !reflected) {
    intimidate({...target, hasAbility: name => name === 'Intimidate'}, source, {}, pre,
      who === 'atk' ? 'def' : 'atk', field, true);
    return;
  }
  const change = stageChanger(pre);
  const before = target.boosts.atk;
  change(target, who, 'atk', profile.gen >= 9 && target.hasAbility('Guard Dog') ? 1 : -1, 'Intimidate');
  if (target.boosts.atk < before) {
    if (profile.gen >= 5 && target.hasAbility('Defiant')) change(target, who, 'atk', 2, 'Defiant');
    if (profile.gen >= 6 && target.hasAbility('Competitive')) change(target, who, 'spa', 2, 'Competitive');
  }
  if (profile.gen >= 8 && target.hasAbility('Rattled')) change(target, who, 'spe', 1, 'Rattled');
  if (profile.gen >= 7 && holdsItem(target, field) && target.hasItem('Adrenaline Orb')) change(target, who, 'spe', 1, 'Adrenaline Orb');
}

function intimidateMarks(atk, def, values = {}) {
  const mons = [fieldPokemon(atk, values, 'atk'), fieldPokemon(def, values, 'def')];
  const pre = [];
  const field = battleField(values);
  intimidate(mons[0], mons[1], atk, pre, 'def', field);
  intimidate(mons[1], mons[0], def, pre, 'atk', field);
  return Object.fromEntries(['atk', 'def'].map(who => [who,
    pre.filter(event => event.who === who && event.stat === 'atk').reduce((sum, event) => sum + event.by, 0)]));
}

function settings() {
  return {setterStays: profile.setterStays ?? profile.gen <= 5};
}

function derived(set, values = {}, otherSet = null) {
  const mon = fieldPokemon(set, values, 'atk');
  const field = battleField(values);
  const result = {};
  if (!mon.curHP()) return result;
  const available = (kind, value) => profile.field?.some(entry => entry.to === kind && entry.o?.some(([key]) => key === value));
  const weather = {Drizzle: 'Rain', Drought: 'Sun', 'Sand Stream': 'Sand',
    'Snow Warning': profile.field?.some(entry => entry.to === 'weather' && entry.o?.some(([key]) => key === 'Snow')) ? 'Snow' : 'Hail', 'Desolate Land': 'Harsh Sunshine',
    'Primordial Sea': 'Heavy Rain', 'Delta Stream': 'Strong Winds', 'Orichalcum Pulse': 'Sun'}[mon.ability];
  const terrain = {'Electric Surge': 'Electric', 'Hadron Engine': 'Electric', 'Grassy Surge': 'Grassy',
    'Psychic Surge': 'Psychic', 'Misty Surge': 'Misty'}[mon.ability];
  if (weather && available('weather', weather)) {
    result.weather = weather;
    if (['Harsh Sunshine', 'Heavy Rain', 'Strong Winds'].includes(weather)) result.primal = true;
  }
  if (terrain && available('terrain', terrain)) result.terrain = terrain;
  checkItem(mon, field.isMagicRoom);
  checkAirLock(mon, field);
  if (otherSet) checkAirLock(fieldPokemon(otherSet, values, 'def'), field);
  if (profile.gen >= 8 && mon.hasAbility('Ice Face') && /Eiscue/i.test(guideName(set))
    && (set.broken || /Noice/i.test(guideName(set))) && field.hasWeather('Hail', 'Snow')) result.restore = true;
  if (mon.curHP() && !set.st && !mon.status && holdsItem(mon, field) && !mon.hasAbility('Comatose', 'Purifying Salt')
    && !(mon.hasAbility('Shields Down') && mon.curHP() > mon.maxHP() / 2)
    && !(mon.hasAbility('Leaf Guard') && field.hasWeather('Sun', 'Harsh Sunshine'))
    && !(mon.hasAbility('Flower Veil') && mon.hasType('Grass'))
    && !(field.hasTerrain('Misty') && isGrounded(mon, field))) {
    if (mon.hasItem('Flame Orb') && !mon.hasType('Fire') && !mon.hasAbility('Water Veil', 'Water Bubble', 'Thermal Exchange')) result.status = 'brn';
    if (mon.hasItem('Toxic Orb') && !mon.hasType('Poison', 'Steel') && !mon.hasAbility('Immunity', 'Pastel Veil')) result.status = 'tox';
  }
  return result;
}

const PINCH_STATS = {'Liechi Berry': 'atk', 'Ganlon Berry': 'def', 'Petaya Berry': 'spa',
  'Apicot Berry': 'spd', 'Salac Berry': 'spe'};
const CONFUSION_BERRIES = new Set(['Figy Berry', 'Wiki Berry', 'Mago Berry', 'Aguav Berry', 'Iapapa Berry']);
const RESIST_BERRIES = {Occa: 'Fire', Passho: 'Water', Wacan: 'Electric', Rindo: 'Grass', Yache: 'Ice',
  Chople: 'Fighting', Kebia: 'Poison', Shuca: 'Ground', Coba: 'Flying', Payapa: 'Psychic', Tanga: 'Bug',
  Charti: 'Rock', Kasib: 'Ghost', Haban: 'Dragon', Colbur: 'Dark', Babiri: 'Steel', Chilan: 'Normal', Roseli: 'Fairy'};

function berryEffect(mon, field, other, hp, hit = {}) {
  if (hp <= 0 || !holdsItem(mon, field) || other?.hasAbility('Unnerve', 'As One (Glastrier)', 'As One (Spectrier)')) return null;
  const item = mon.item;
  const config = profile.over?.items?.[mon.guideItem] || profile.over?.items?.[item] || {};
  const ripen = profile.gen >= 8 && mon.hasAbility('Ripen') ? 2 : 1;
  let threshold = 1 / 2;
  let heal = 0;
  let stat;
  let focus = false;
  if (item === 'Sitrus Berry') heal = Math.max(1, Math.floor(mon.maxHP() / 4));
  else if (item === 'Oran Berry') heal = 10;
  else if (item === 'Berry Juice') heal = 20;
  else if (CONFUSION_BERRIES.has(item)) {
    threshold = profile.gen >= 7 ? 1 / 4 : 1 / 2;
    heal = Math.max(1, Math.floor(mon.maxHP() * (profile.gen === 7 ? 1 / 2 : profile.gen >= 8 ? 1 / 3 : 1 / 8)));
  } else if (item === 'Enigma Berry') {
    if (!(hit.eff > 1)) return null;
    threshold = 1;
    heal = Math.max(1, Math.floor(mon.maxHP() / 4));
  } else if (PINCH_STATS[item] || item === 'Lansat Berry') {
    threshold = 1 / 4;
    stat = PINCH_STATS[item];
    focus = item === 'Lansat Berry';
    if (stat && (mon.hasAbility('Contrary') ? mon.boosts[stat] <= -6 : mon.boosts[stat] >= 6)) return null;
  } else return null;
  threshold = config.threshold ?? threshold;
  if (threshold === 1 / 4 && mon.hasAbility('Gluttony')) threshold = 1 / 2;
  if (hp > Math.floor(mon.maxHP() * threshold)) return null;
  if (config.heal !== undefined) heal = config.heal <= 1 ? Math.max(0, Math.floor(mon.maxHP() * config.heal)) : Math.trunc(config.heal);
  const berry = item.endsWith(' Berry');
  const recovery = heal * (berry ? ripen : 1)
    + (berry && profile.gen >= 6 && mon.hasAbility('Cheek Pouch') ? Math.max(1, Math.floor(mon.maxHP() / 3)) : 0);
  if (!stat && !focus && (!recovery || hp >= mon.maxHP())) return null;
  return {item, heal: Math.min(mon.maxHP() - hp, recovery), ...(stat ? {stat, by: ripen} : {}), ...(focus ? {focus: true} : {})};
}

function actionState(set, values, side) {
  const mon = fieldPokemon(set, values, side);
  const update = {};
  const stages = statNames.map((name, index) => set.stg?.[index] ?? 0);
  const logs = [];
  const change = (stat, amount, src, absolute = false) => {
    const events = [];
    if (absolute) {
      const before = mon.boosts[stat];
      mon.boosts[stat] = Math.max(-6, Math.min(6, amount));
      if (before !== mon.boosts[stat]) events.push({by: mon.boosts[stat] - before});
    } else stageChanger(events)(mon, side, stat, amount, src);
    for (const event of events) {
      const index = statNames.indexOf(stat);
      stages[index] = Math.max(-6, Math.min(6, stages[index] + event.by));
      update.stg = [...stages];
      logs.push(`${src}: ${stat} ${event.by > 0 ? '+' : ''}${event.by}`);
    }
  };
  const consume = label => {
    update.used = true;
    mon.item = '';
    if (mon.hasAbility('Unburden')) mon.abilityOn = true;
    logs.push(`${label}: used`);
  };
  const persist = (stat, by) => {
    const index = statNames.indexOf(stat);
    stages[index] = Math.max(-6, Math.min(6, stages[index] + by));
    update.stg = [...stages];
  };
  return {mon, update, logs, change, consume, persist};
}

function applyBerry(state, field, other, hp, hit) {
  const effect = berryEffect(state.mon, field, other, hp, hit);
  if (!effect) return hp;
  state.consume(effect.item);
  if (effect.stat) state.change(effect.stat, effect.by, effect.item);
  if (effect.focus) state.update.toggles = {...state.update.toggles, Focus: true};
  if (effect.heal) state.logs.push(`${effect.item}: +${effect.heal} HP`);
  return hp + effect.heal;
}

function turn(set, values = {}, otherSet = null, side = 'atk') {
  const state = actionState(set, values, side);
  const field = battleField(values);
  const other = otherSet ? fieldPokemon(otherSet, values, side === 'atk' ? 'def' : 'atk') : null;
  checkItem(state.mon, field.isMagicRoom);
  const parts = residual(set, values, otherSet, side);
  let hp = state.mon.curHP();
  for (const part of parts) {
    if (!hp) break;
    const next = Math.max(0, Math.min(state.mon.maxHP(), hp + part.v[0]));
    if (next !== hp) state.logs.push(`${part.l}: ${next - hp} HP`);
    hp = next;
  }
  if (hp && state.mon.hasAbility('Speed Boost')) state.change('spe', 1, 'Speed Boost');
  hp = applyBerry(state, field, other, hp);
  return {[side]: {...state.update, hp}, log: state.logs, parts};
}

function berry(set, values = {}, otherSet = null, side = 'atk') {
  const state = actionState(set, values, side);
  const field = battleField(values);
  const other = otherSet ? fieldPokemon(otherSet, values, side === 'atk' ? 'def' : 'atk') : null;
  checkItem(state.mon, field.isMagicRoom);
  const effect = berryEffect(state.mon, field, other, state.mon.curHP());
  if (!effect) return null;
  const hp = applyBerry(state, field, other, state.mon.curHP());
  return {[side]: {...state.update, hp}, log: state.logs, ...effect};
}

function hit(atk, def, slot, values = {}, roll = 'max', options = {}) {
  if (!['min', 'max'].includes(roll)) throw new Error('DMG: hit roll must be min or max');
  const exact = options.damage !== undefined;
  if (exact && !(Number.isInteger(options.damage) && options.damage >= 0)) throw new Error('DMG: exact damage must be a nonnegative integer');
  const calculated = calculateMove(atk, def, slot, values);
  if (calculated?.protected) return {atk: {}, def: {}, dealt: 0, hits: 0, log: ['Protected']};
  const result = exact ? null : calculated;
  if (!result && !exact) return null;
  const user = actionState(atk, values, 'atk');
  const target = actionState(def, values, 'def');
  const field = battleField(values);
  checkAirLock(user.mon, field);
  checkAirLock(target.mon, field);
  checkItem(user.mon, field.isMagicRoom);
  checkItem(target.mon, field.isMagicRoom);
  const output = {def: target.update, atk: user.update, log: [], hits: 0};
  let current = target.mon.curHP();
  let dealt = 0;
  const move = generation.moves.get(toID(data.M[slot.mv]));
  const type = exact ? slot.t || move?.type : generation.guideContext?.move.type || slot.t || move?.type;
  const info = {type, cat: result?.cat, eff: result?.eff || 0};
  const strikes = exact ? [[options.damage]] : result.per || Array.from({length: result.hits}, () => result.rolls);
  const parental = !exact && result.hits === 2 && user.mon.hasAbility('Parental Bond') && generation.guideContext?.move.hits === 1;
  const thresholdAbility = profile.gen >= 7 && target.mon.hasAbility('Berserk')
    || profile.gen >= 9 && target.mon.hasAbility('Anger Shell');
  const delayedBerry = thresholdAbility && strikes.length === 1;
  let crossedHalf = false;
  const contact = [];
  const events = result?.pre || (!exact && result.fixed
    ? firstHitStages(fieldPokemon(atk, values, 'atk'), fieldPokemon(def, values, 'def'), atk, def, slot,
      new Move(generation, data.M[slot.mv]), field, profile.over?.state) : []);
  for (const event of events.filter(event => !event.hit)) {
    const state = event.who === 'atk' ? user : target;
    state.mon.boosts[event.stat] = Math.max(-6, Math.min(6, state.mon.boosts[event.stat] + event.by));
    if (SEEDS[state.mon.item] && event.src === state.mon.item) {
      state.persist(event.stat, event.by);
      state.consume(state.mon.item);
    }
  }
  const stateSet = (set, state, hp) => ({...set, hp, used: state.update.used || set.used,
    broken: state.update.broken ?? set.broken,
    stg: statNames.map(stat => state.mon.boosts[stat]), entry: false, dl: 'off', intim: false});
  const actionField = {...values};
  const fieldChange = (key, value) => {
    (output.field ||= {})[key] = value;
    actionField[key] = value;
    field[key] = value;
    output.log.push(`${key}: ${value}`);
  };
  for (let index = 0; index < strikes.length && current > 0; index++) {
    if (!exact && !index && result.bust) {
      target.update.broken = true;
      current = Math.max(0, current - result.bust.loss);
      output.log.push(`${result.bust.ability}: broken${result.bust.loss ? ` (-${result.bust.loss} HP)` : ''}`);
      if (current) current = applyBerry(target, field, user.mon, current);
      continue;
    }
    const followup = index && !exact && !result.fixed ? calcCore(stateSet(atk, user, user.mon.curHP()),
      stateSet(def, target, current), slot, actionField, {hit: index + 1, parental}) : null;
    let damage = (roll === 'min' ? Math.min : Math.max)(...(followup?.rolls || strikes[index]));
    if (!damage) {
      if (exact) current = applyBerry(target, field, user.mon, current);
      continue;
    }
    const before = current;
    if (!exact && damage >= current && current === target.mon.maxHP()) {
      const sash = holdsItem(target.mon, field) && target.mon.hasItem('Focus Sash');
      const sturdy = profile.gen >= 5 && target.mon.hasAbility('Sturdy')
        && !user.mon.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze');
      if (sash || sturdy) {
        damage = current - 1;
        if (sash) target.consume('Focus Sash');
        else target.logs.push('Sturdy: 1 HP');
      }
    }
    current = Math.max(0, current - damage);
    dealt += before - current;
    if (!exact && before > current) {
      output.hits++;
      contact.push(...contactEffects(user.mon, target.mon, move, field, info.cat));
    }
    output.log.push(`Hit ${index + 1}: -${before - current} HP`);
    if (!exact) {
      const item = target.mon.item;
      if (holdsItem(target.mon, field) && (item === 'Air Balloon'
        || (!user.mon.hasAbility('Unnerve', 'As One (Glastrier)', 'As One (Spectrier)')
          && RESIST_BERRIES[item.replace(/ Berry$/, '')] === type && (info.eff > 1 || type === 'Normal')))) {
        target.consume(item);
        if (current && item.endsWith(' Berry') && target.mon.hasAbility('Cheek Pouch')) {
          const heal = Math.min(target.mon.maxHP() - current, Math.floor(target.mon.maxHP() / 3));
          current += heal;
          target.logs.push(`Cheek Pouch: +${heal} HP`);
        }
      }
    }
    if (!current) continue;
    crossedHalf ||= before > target.mon.maxHP() / 2 && current <= target.mon.maxHP() / 2;
    if (!delayedBerry) current = applyBerry(target, field, user.mon, current, exact ? {} : info);
    if (exact) continue;
    const item = HIT_ITEMS[target.mon.item];
    if (item && profile.gen >= item[0] && holdsItem(target.mon, field) && item[1](info)
      && (!(target.mon.item.endsWith(' Berry') && user.mon.hasAbility('Unnerve', 'As One (Glastrier)', 'As One (Spectrier)')))
      && (!profile.over?.afterMove?.includes(target.mon.item) || index === strikes.length - 1)) {
      const name = target.mon.item;
      for (const stat of item[2]) target.change(stat, item[3] * (profile.gen >= 8 && name.endsWith(' Berry') && target.mon.hasAbility('Ripen') ? 2 : 1), name);
      target.consume(name);
      if (name.endsWith(' Berry') && target.mon.hasAbility('Cheek Pouch')) current = Math.min(target.mon.maxHP(), current + Math.floor(target.mon.maxHP() / 3));
    }
    if (profile.gen >= 7 && target.mon.hasAbility('Stamina')) target.change('def', 1, 'Stamina');
    if (profile.gen >= 7 && target.mon.hasAbility('Water Compaction') && type === 'Water') target.change('def', 2, 'Water Compaction');
    if (profile.gen >= 5 && target.mon.hasAbility('Justified') && type === 'Dark') target.change('atk', 1, 'Justified');
    if (profile.gen >= 5 && target.mon.hasAbility('Weak Armor') && info.cat === 'Physical') {
      target.change('def', -1, 'Weak Armor');
      target.change('spe', profile.gen >= 7 ? 2 : 1, 'Weak Armor');
    }
    if (profile.gen >= 8 && target.mon.hasAbility('Steam Engine') && ['Water', 'Fire'].includes(type)) target.change('spe', 6, 'Steam Engine');
    if (profile.gen >= 5 && target.mon.hasAbility('Rattled') && ['Bug', 'Dark', 'Ghost'].includes(type)) target.change('spe', 1, 'Rattled');
    if (target.mon.hasAbility('Anger Point') && (slot.crit && result.crit.p || result.crit.forced)) target.change('atk', 6, 'Anger Point', true);
    if (profile.gen >= 9 && (target.mon.hasAbility('Electromorphosis') || target.mon.hasAbility('Wind Power') && move?.flags?.wind)) {
      target.update.toggles = {...target.update.toggles, Charge: true};
      target.logs.push(`${target.mon.ability}: Charge`);
    }
    if (profile.gen >= 8 && target.mon.hasAbility('Cotton Down')) user.change('spe', -1, 'Cotton Down');
    if (profile.gen >= 9 && target.mon.hasAbility('Toxic Debris') && info.cat === 'Physical') {
      const layers = Math.min(2, (output.field?.hazards?.atkToxicSpikes ?? values.atkToxicSpikes ?? 0) + 1);
      (output.field ||= {}).hazards = {atkToxicSpikes: layers};
      target.logs.push('Toxic Debris: Toxic Spikes');
    }
    if (profile.gen >= 9 && target.mon.hasAbility('Seed Sower')) fieldChange('terrain', 'Grassy');
    if (profile.gen >= 8 && target.mon.hasAbility('Sand Spit')) fieldChange('weather', 'Sand');
  }
  if (current && crossedHalf && current <= target.mon.maxHP() / 2 && thresholdAbility) {
    if (target.mon.hasAbility('Berserk')) target.change('spa', 1, 'Berserk');
    else {
      for (const stat of ['def', 'spd']) target.change(stat, -1, 'Anger Shell');
      for (const stat of ['atk', 'spa', 'spe']) target.change(stat, 1, 'Anger Shell');
    }
  }
  if (delayedBerry) current = applyBerry(target, field, user.mon, current, exact ? {} : info);
  if (!exact && dealt > 0 && holdsItem(user.mon, field) && user.mon.item.endsWith(' Gem')
    && user.mon.item === `${type} Gem`) user.consume(user.mon.item);
  if (!exact && def.hp !== 0 && current === 0 && dealt > 0) {
    const ability = user.mon.ability;
    if (profile.gen >= 5 && ability === 'Moxie' || profile.gen >= 8 && ['Chilling Neigh', 'As One (Glastrier)'].includes(ability)) user.change('atk', 1, ability);
    if (profile.gen >= 8 && ['Grim Neigh', 'As One (Spectrier)'].includes(ability) || profile.gen >= 7 && ability === 'Soul-Heart') user.change('spa', 1, ability);
    if (profile.gen >= 7 && ability === 'Beast Boost') {
      const stat = STAGES.reduce((best, stat) => user.mon.rawStats[stat] > user.mon.rawStats[best] ? stat : best, 'atk');
      user.change(stat, 1, ability);
    }
  }
  target.update.hp = current;
  if (contact.length) {
    output.contact = {v: contact.reduce((sum, part) => sum + part.v, 0), parts: contact};
    output.log.push(...contact.map(part => `${part.l}: ${part.v} HP (user change)`));
  }
  output.log.push(...target.logs, ...user.logs);
  output.dealt = dealt;
  return output;
}

// First-hit events, applied to the battlers' stages before the calculation.
function firstHitStages(attacker, defender, atk, def, slot, move, field, own) {
  const pre = [];
  const change = stageChanger(pre);
  const sides = [[attacker, 'atk', atk, defender], [defender, 'def', def, attacker]];
  intimidate(attacker, defender, atk, pre, 'def', field);
  intimidate(defender, attacker, def, pre, 'atk', field);
  for (const [mon, who] of sides) {
    const seed = SEEDS[mon.item];
    if (profile.gen >= 7 && seed && holdsItem(mon, field) && field.hasTerrain(seed[0])) {
      change(mon, who, seed[1], 1, mon.item);
      mon.item = '';
    }
  }
  for (const [mon, who, set, other] of sides) {
    const entry = ENTRY[mon.ability];
    if (entry && set.entry !== false && profile.gen >= entry[0]) change(mon, who, entry[1], 1, mon.ability);
    if (mon.hasAbility('Download') && set.dl !== 'off') {
      // The target's Defense and Special Defense with their stages (Wonder Room doesn't swap them for Download).
      const [defense, special] = ['def', 'spd'].map(stat => getModifiedStat(other.rawStats[stat], other.boosts[stat], generation));
      change(mon, who, ['atk', 'spa'].includes(set.dl) ? set.dl : special <= defense ? 'spa' : 'atk', 1, 'Download');
    }
    if (entry || mon.hasAbility('Download')) mon.ability = 'Guide no ability';
  }
  const charge = CHARGE[move.name];
  if ((charge || move.name === 'Spectral Thief') && slot.pre === false) move.name = `Guide ${move.name}`;
  else if (charge) {
    // Stock's Gen 7+ code raises Meteor Beam / Electro Shot itself: only reported there.
    change(profile.gen >= 7 && charge === 'spa' ? snapshot(attacker, field) : attacker, 'atk', charge, 1, move.name);
  }
  else if (move.name === 'Spectral Thief') {
    const theft = own?.['Spectral Thief'];
    const immune = defender.types.some(type => generation.types.get(toID(move.type))?.effectiveness[type] === 0);
    if (theft === false || immune) move.name = 'Guide Spectral Thief';
    else {
      const stolen = [];
      for (const stat of STAGES) {
        const amount = defender.boosts[stat];
        if (amount <= 0 || (theft?.theft === 'headroom' && attacker.boosts[stat] >= 6)) continue;
        stolen.push([stat, theft?.theft === 'headroom' ? Math.min(amount, 6 - attacker.boosts[stat]) : amount]);
        pre.push({who: 'def', stat, by: -amount, src: 'Spectral Thief'});
        defender.boosts[stat] = 0;
      }
      for (const [stat, amount] of stolen) change(attacker, 'atk', stat, amount, 'Spectral Thief');
    }
  }
  return pre;
}

// A battler's stages and the ability / item that react to them, before the calculation changes them.
const snapshot = (mon, field) => ({ability: mon.ability, item: holdsItem(mon, field) ? mon.item : '', boosts: {...mon.boosts},
  hasAbility: (...names) => names.includes(mon.ability)});

// Between-hit events for hits 2..n (`hit`: the strike's type, category and effectiveness).
function betweenHitStages(atk, def, hits, hit) {
  const pre = [];
  const change = stageChanger(pre);
  const item = HIT_ITEMS[def.item];
  let used = !(item && profile.gen >= item[0]) || !!profile.over?.afterMove?.includes(def.item);
  for (let next = 2; next <= hits; next++) {
    if (profile.gen >= 7 && def.hasAbility('Stamina')) change(def, 'def', 'def', 1, 'Stamina', next);
    if (profile.gen >= 7 && def.hasAbility('Water Compaction') && hit.type === 'Water') {
      change(def, 'def', 'def', 2, 'Water Compaction', next);
    }
    if (profile.gen >= 5 && def.hasAbility('Weak Armor') && hit.cat === 'Physical') {
      change(def, 'def', 'def', -1, 'Weak Armor', next);
      change(def, 'def', 'spe', profile.gen >= 7 ? 2 : 1, 'Weak Armor', next);
    }
    if (profile.gen >= 5 && def.hasAbility('Justified') && hit.type === 'Dark') change(def, 'def', 'atk', 1, 'Justified', next);
    if (profile.gen >= 8 && def.hasAbility('Steam Engine') && ['Fire', 'Water'].includes(hit.type)) {
      change(def, 'def', 'spe', 6, 'Steam Engine', next);
    }
    if (profile.gen >= 8 && def.hasAbility('Cotton Down')) change(atk, 'atk', 'spe', -1, 'Cotton Down', next);
    if (!used && item[1](hit)) {
      for (const stat of item[2]) change(def, 'def', stat, item[3], def.item, next);
      used = true;
    }
  }
  return pre;
}

const isAshGreninja = set => /Greninja/.test(guideName(set)) && /\bAsh\b/.test(guideName(set));
const guideName = set => data.P.find(entry => String(entry.id) === String(set.id))?.n || '';
const stockpile = slot => Math.max(1, Math.min(3, Math.trunc(Number(slot.st)) || 1));

function calcCore(atk, def, slot, values = {}, action = null) {
  const entry = data.MV[slot.mv];
  const name = data.M[slot.mv];
  if (!entry) return null;
  const moveData = generation.moves.get(toID(name));
  if (moveData.category === 'Status') return null;
  const listed = entry.bp === 'Varies' || profile.varpow?.includes(name);
  // Power from the battle state (weights, HP, speeds, boosts): stock works it out unless the page sets a power.
  const auto = listed && AUTO_POWER.has(moveData.name);
  const variable = listed && !auto;
  const preset = slot.bp === undefined ? name === 'Spit Up' ? 100 * stockpile(slot)
    : variable ? DEFAULT_POWER[moveData.name] : undefined : undefined;
  if (variable && slot.bp === undefined && !preset) return null;
  const state = statePower(name, slot.bp ?? preset ?? (auto ? 1 : moveData.basePower), def, slot, slot.bp !== undefined || listed);
  const pledge = PLEDGES[name] && PLEDGES[slot.st] && slot.st !== name && slot.bp === undefined
    && profile.over?.state?.[name] !== false ? pledgeType([PLEDGES[name], PLEDGES[slot.st]]) : '';
  const power = pledge ? 150 : state.power;
  if (!(Number(power) > 0)) return null;
  const attacker = fieldPokemon(atk, values, 'atk');
  const defender = fieldPokemon(def, values, 'def');
  for (const [key, stats] of [['powerSplit', ['atk', 'spa']], ['guardSplit', ['def', 'spd']]]) {
    if (values[key] && profile.gen >= 5) {
      for (const stat of stats) {
        const average = Math.floor((attacker.rawStats[stat] + defender.rawStats[stat]) / 2);
        for (const mon of [attacker, defender]) {
          mon.rawStats[stat] = average;
          mon.stats[stat] = getModifiedStat(average, mon.boosts[stat], generation);
        }
      }
    }
  }
  // Stock gives Water Shuriken power 20 only to a Pokémon named 'Greninja-Ash'; the guides call it "Ash-Greninja",
  // "Greninja (Ash)" or "Greninja Ash" (EI / Hardlove / Photonic sources: power 20, always 3 hits).
  if (moveData.name === 'Water Shuriken' && isAshGreninja(atk)) attacker.name = 'Greninja-Ash';
  const moveType = slot.t || pledge || moveData.type;
  // Protean / Libero: the attacker turns into the move's type (STAB and anything reading its type); a defender keeps
  // the type the page chose for it.
  if (changesType(attacker, atk)) attacker.types = [moveType];
  if (pledge && !attacker.hasType(pledge)) attacker.types = [...attacker.types, pledge];
  if (atk.fnt > 0) attacker.alliesFainted = Math.min(5, Math.trunc(atk.fnt));
  const field = battleField(values);
  if (def.vol === 'switch') field.defenderSide.isSwitching = 'out';
  const overrides = {...moveData, basePower: Number(power), type: moveType};
  overrides.willCrit = false;
  const crit = critChance(entry, moveData, attacker, defender, values);
  const useZ = !!(profile.zmove && slot.z && moveData.category !== 'Status');
  if (useZ) overrides.zMove = {basePower: zPower(moveData, Number(power), listed)};
  if (listed && (slot.bp !== undefined || preset)) {
    overrides.name = 'Guide fixed power';
    overrides.id = 'guidefixedpower';
  }
  const hitRange = profile.multihit?.[name];
  const stockHits = moveData.multihit;
  const defaultHits = moveData.name === 'Water Shuriken' && isAshGreninja(atk) ? 3 : hitRange?.[2] ??(typeof stockHits === 'number' ? stockHits : Array.isArray(stockHits) ? stockHits[0] + 1 : 1);
  const selected = useZ ? 1 : hitCount(slot.hits ?? defaultHits);
  const move = new Move(generation, moveData.name, {
    overrides, isCrit: crit.forced || (!!slot.crit && crit.p > 0), hits: selected, ability: attacker.ability, item: attacker.item, useZ,
    ...(slot.met > 0 ? {timesUsedWithMetronome: Math.trunc(slot.met)} : {}),
  });
  move.hits = selected;
  if (action) {
    move.hits = 1;
    if (attacker.hasAbility('Parental Bond')) attacker.ability = action.parental ? 'Parental Bond (Child)' : 'Guide no ability';
    if (['Triple Kick', 'Triple Axel'].includes(moveData.name)) move.bp *= action.hit;
  }
  const context = {
    atk: attacker, def: defender, move, field, desc: {}, notes: new Set(),
    input: {atk, def, slot, field: values},
    mechanics: profile.gen,
    meta: {atkItem: generation.items.get(toID(attacker.item || '')),
      defItem: generation.items.get(toID(defender.item || '')), move: moveData},
    names: {atk: data.P.find(entry => String(entry.id) === String(atk.id)).n,
      def: data.P.find(entry => String(entry.id) === String(def.id)).n,
      atkAbility: data.AB[atk.ab]?.[0] || '', defAbility: data.AB[def.ab]?.[0] || '',
      atkItem: atk.it || '', defItem: def.it || '', move: name},
    state: {hit: action?.hit || 1, hitCount: action ? action.hit - 1 : 0, hits: action ? 1 : selected, originalPower: Number(power), volDouble: state.double},
  };
  if (state.double) context.notes.add(VOLATILE_NOTES[def.vol]);
  generation.guideContext = context;
  const hits = action ? 1 : hitCount(applyPhase(generation, 'hits', {}, selected));
  move.hits = hits;
  context.state.hits = hits;
  const pre = action ? [] : firstHitStages(attacker, defender, atk, def, slot, move, field, profile.over?.state);
  applyPhase(generation, 'beforeStats', {}, undefined);
  const before = [snapshot(attacker, field), snapshot(defender, field)];
  const calculate = profile.gen === 4 ? calculateDPP : profile.gen <= 6 ? calculateBWXY : calculateSMSSSV;
  const result = calculate(generation, attacker, defender, move, field);
  const normalise = damage => typeof damage === 'number' ? Array(16).fill(damage) : [...damage];
  const per = Array.isArray(result.damage) && (Array.isArray(result.damage[0]) || result.damage.length === 2)
    ? result.damage.map(normalise) : Array.from({length: hits}, () => normalise(result.damage));
  if (values.defGlaiveRush && !context.state.fieldGlaiveApplied) {
    for (const hit of per) for (let index = 0; index < hit.length; index++) hit[index] *= 2;
  }
  if (!per.every(rolls => rolls.length === 16 && rolls.every(value => Number.isInteger(value) && value >= 0))) {
    throw new Error(`DMG: invalid damage rolls for ${name}`);
  }
  const rolls = per[0];
  const perHit = per.some(hit => hit.some((value, index) => value !== rolls[index]));
  // The power the hit used (state, stock power changes like Facade or Hex, the hack's own power rules), reported
  // whenever it differs from the listed power; moves whose power changes hit by hit keep their per-hit rolls instead.
  // Stock reports a power modifier unrounded (Knock Off 97.5); the game rounds it (Gen 5+ half down, Gen 4 floor).
  const rawPower = result.rawDesc.moveBP ?? context.state.firstPower ?? Number(power);
  const shownPower = Number.isInteger(rawPower) ? rawPower : profile.gen >= 5 ? Math.ceil(rawPower - 0.5) : Math.floor(rawPower);
  const min = Math.min(...rolls);
  const max = Math.max(...rolls);
  let eff = context.state.typeEffectiveness ?? 1;
  if (!max) eff = 0;
  if (per.length > 1 && eff) {
    const stages = before.map(mon => ({...mon.boosts}));
    const events = betweenHitStages(...before, per.length, {type: move.type, cat: move.category, eff});
    pre.push(...events);
    if ((name === 'Foul Play' || values.powerSplit || values.guardSplit) && !action) {
      const sets = [atk, def].map((set, index) => ({...set, entry: false, dl: 'off', intim: false,
        stg: statNames.map(stat => stages[index][stat])}));
      for (let index = 1; index < per.length; index++) {
        for (const event of events.filter(event => event.hit === index + 1)) {
          const set = sets[event.who === 'atk' ? 0 : 1];
          set.stg[statNames.indexOf(event.stat)] += event.by;
          if (HIT_ITEMS[set.it] && event.src === set.it) set.used = true;
        }
        const next = calcCore(...sets, slot, values, {hit: index + 1,
          parental: per.length === 2 && selected === 1 && attacker.hasAbility('Parental Bond')});
        per[index] = next.rolls;
      }
    }
  }
  const description = result.rawDesc;
  const notes = [...context.notes];
  // Residual damage / recovery counts in the KO text only, never in the rolls or percentages.
  const parts = residual(def, values, atk, 'def');
  const eot = [0, 1, 2, 3].map(turn => parts.reduce((sum, part) => sum + part.v[turn], 0));
  const current = Math.max(0, Math.min(defender.maxHP(), def.hp ?? defender.maxHP()));
  if (attacker.hasType(move.type) && max) notes.push('STAB');
  if (!eff) notes.push('No effect');
  else if (eff > 1) notes.push('Super effective');
  else if (eff < 1) notes.push('Not very effective');
  for (const [key, label] of Object.entries({isCritical: 'Crit', isBurned: 'Burn', isReflect: 'Reflect',
    isLightScreen: 'Light Screen', isAuroraVeil: 'Aurora Veil', isHelpingHand: 'Helping Hand', isFriendGuard: 'Friend Guard'})) {
    if (description[key]) notes.push(label);
  }
  for (const key of ['weather', 'terrain', 'attackerItem', 'defenderItem', 'attackerAbility', 'defenderAbility']) {
    if (description[key]) notes.push(description[key]);
  }
  return {
    cat: move.category, rolls: [...rolls], hits: per.length, min, max, crit,
    ...(description.isProtected && !max ? {protected: true} : {}),
    ...(preset ? {bp: preset} : (auto || HP_POWER.has(moveData.name)) && slot.bp === undefined && description.moveBP
      ? {bp: description.moveBP} : !listed && !useZ && slot.bp === undefined && !perHit && shownPower !== moveData.basePower
        ? {bp: shownPower} : {}),
    priority: context.move.priority,
    ...(context.move.useZ ? {z: context.move.name} : {}),
    ...(context.state.categoryAuto ? {categoryChoice: {automatic: context.state.categoryAuto,
      inverted: context.state.categoryInverted, tie: context.state.categoryTie}} : {}),
    ...(per.some(hit => hit.some((value, index) => value !== rolls[index])) ? {per} : {}),
    pmin: per.reduce((sum, hit) => sum + Math.min(...hit), 0) * 100 / defender.maxHP(),
    pmax: per.reduce((sum, hit) => sum + Math.max(...hit), 0) * 100 / defender.maxHP(),
    ko: knockout(per, current, eot, defender.maxHP() - current), eff, notes: [...new Set(notes)],
    ...(parts.length ? {eot: parts} : {}),
    ...(pre.length ? {pre} : {}),
  };
}

// Fixed / fraction damage (tools/calc/README.md, HP moves): damage from levels and HP, not from power. The type
// chart (and immunities) come from an ordinary run of the move at power 100. Counter / Mirror Coat / Bide (2x) and
// Metal Burst / Comeuppance (1.5x) take the damage taken in `slot.bp`.
const FIXED = {
  'Seismic Toss': c => c.lv, 'Night Shade': c => c.lv, 'Dragon Rage': () => 40, 'Sonic Boom': () => 20,
  'Super Fang': c => Math.max(1, Math.floor(c.def / 2)), "Nature's Madness": c => Math.max(1, Math.floor(c.def / 2)),
  Ruination: c => Math.max(1, Math.floor(c.def / 2)), 'Guardian of Alola': c => Math.max(1, Math.floor(c.def * 3 / 4)),
  Endeavor: c => Math.max(0, c.def - c.atk), 'Final Gambit': c => c.atk,
  Psywave: c => Array.from({length: 16}, (_, i) => profile.gen >= 5
    ? Math.max(1, Math.floor(c.lv * (Math.round(i * 100 / 15) + 50) / 100))
    : Math.max(1, Math.floor(c.lv * (Math.round(i * 10 / 15) * 10 + 50) / 100))),
};
const OHKO = new Set(['Fissure', 'Guillotine', 'Horn Drill', 'Sheer Cold']);
const TAKEN = {Counter: 2, 'Mirror Coat': 2, Bide: 2, 'Metal Burst': 1.5, Comeuppance: 1.5};

function unshieldedMove(atk, def, slot, values = {}) {
  const name = data.M[slot.mv];
  const taken = TAKEN[name];
  if (!FIXED[name] && !OHKO.has(name) && !taken) return calcCore(atk, def, slot, values);
  if (taken && !(slot.bp > 0)) return null;
  const base = calcCore(atk, def, {...slot, bp: 100, hits: 1, z: false}, values);
  if (!base) return null;
  if (base.protected) return base;
  const attacker = pokemon(atk), defender = pokemon(def);
  const max = defender.maxHP();
  const current = Math.max(0, Math.min(max, def.hp ?? max));
  const own = Math.max(0, Math.min(attacker.maxHP(), atk.hp ?? attacker.maxHP()));
  let value;
  if (taken) value = Math.floor(slot.bp * taken);
  else if (OHKO.has(name)) {
    const fails = (def.lv ?? 50) > (atk.lv ?? 50)
      || (defender.hasAbility('Sturdy') && !attacker.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze'))
      || (name === 'Sheer Cold' && profile.gen >= 7 && defender.hasType('Ice'));
    value = fails ? 0 : current;
  } else value = FIXED[name]({lv: atk.lv ?? 50, def: current, atk: own});
  const rolls = (Array.isArray(value) ? value : Array(16).fill(value)).map(v => base.eff ? v : 0);
  const eot = [0, 1, 2, 3].map(turn => (base.eot || []).reduce((sum, part) => sum + part.v[turn], 0));
  const result = {...base, fixed: true, rolls, hits: 1, min: Math.min(...rolls), max: Math.max(...rolls),
    pmin: Math.min(...rolls) * 100 / max, pmax: Math.max(...rolls) * 100 / max,
    ko: knockout([rolls], current, eot, max - current),
    notes: base.notes.filter(note => !['STAB', 'Crit'].includes(note) && !/^(Super|Not very) effective$/.test(note))};
  delete result.per; delete result.bp; delete result.pre;
  return result;
}

function shield(atk, def, slot, values, result) {
  if (def.broken || !result?.max) return null;
  const target = fieldPokemon(def, values, 'def');
  const user = fieldPokemon(atk, values, 'atk');
  const name = guideName(def);
  if (!target.curHP() || user.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze')
    || ['Sunsteel Strike', 'Moongeist Beam', 'Photon Geyser', 'Light That Burns the Sky',
      'Searing Sunraze Smash', 'Menacing Moonraze Maelstrom'].includes(data.M[slot.mv])) return null;
  if (profile.gen >= 7 && target.hasAbility('Disguise') && /Mimikyu/i.test(name)
    && (def.broken === false || !/Busted/i.test(name))) {
    return {ability: 'Disguise', loss: profile.gen >= 8 ? Math.max(1, Math.floor(target.maxHP() / 8)) : 0};
  }
  if (profile.gen >= 8 && target.hasAbility('Ice Face') && /Eiscue/i.test(name) && result.cat === 'Physical'
    && (def.broken === false || !/Noice/i.test(name))) return {ability: 'Ice Face', loss: 0};
  return null;
}

function calculateMove(atk, def, slot, values = {}) {
  const result = unshieldedMove(atk, def, slot, values);
  const bust = shield(atk, def, slot, values, result);
  if (!bust) return result;
  const per = Array.from({length: result.hits}, () => Array(16).fill(0));
  const sets = [atk, {...def, broken: true, hp: Math.max(0, (def.hp ?? stats(def)[0]) - bust.loss)}]
    .map(set => ({...set, stg: statNames.map((stat, index) => set.stg?.[index] || 0),
      entry: false, dl: 'off', intim: false}));
  const pre = (result.pre || []).filter(event => !event.hit);
  const apply = events => {
    for (const event of events) {
      const set = sets[event.who === 'atk' ? 0 : 1];
      set.stg[statNames.indexOf(event.stat)] += event.by;
      if (event.src === set.it && (HIT_ITEMS[set.it] || SEEDS[set.it])) set.used = true;
    }
  };
  apply(pre);
  for (let index = 1; index < per.length; index++) {
    if (index > 1) {
      const field = battleField(values);
      const events = betweenHitStages(...sets.map((set, side) => snapshot(fieldPokemon(set, values, side ? 'def' : 'atk'), field)),
        2, {type: slot.t || generation.moves.get(toID(data.M[slot.mv])).type, cat: result.cat, eff: result.eff})
        .map(event => ({...event, hit: index + 1}));
      apply(events);
      pre.push(...events);
    }
    const next = calcCore(...sets, slot, values, {hit: index + 1,
      parental: result.hits === 2 && (slot.hits ?? 1) === 1 && pokemon(atk).hasAbility('Parental Bond')});
    per[index] = next.rolls;
  }
  return {...result, bust, rolls: per[0], min: 0, max: 0, per,
    pmin: per.reduce((sum, rolls) => sum + Math.min(...rolls), 0) * 100 / stats(def)[0],
    pmax: per.reduce((sum, rolls) => sum + Math.max(...rolls), 0) * 100 / stats(def)[0],
    pre, notes: [...result.notes, bust.ability]};
}

function calc(atk, def, slot, values = {}) {
  const result = calculateMove(atk, def, slot, values);
  if (!result) return result;
  const target = fieldPokemon(def, values, 'def');
  const user = fieldPokemon(atk, values, 'atk');
  const field = battleField(values);
  checkItem(target, field.isMagicRoom);
  const full = target.curHP() === target.maxHP();
  const sash = full && holdsItem(target, field) && target.hasItem('Focus Sash');
  const sturdy = full && profile.gen >= 5 && target.hasAbility('Sturdy')
    && !user.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze');
  const berry = berryEffect(target, field, user, 1, {eff: result.eff});
  const healing = berry?.heal > 0;
  const survival = result.hits === 1 && (sash || sturdy);
  if (!survival && !healing && !result.bust || !target.curHP() || !result.max && !result.bust) return result;
  if (survival) result.notes.push(sash ? 'Sash' : 'Sturdy');
  if (healing) result.notes.push(`after ${target.item.replace(/ Berry$/, '')}`);
  const per = result.per || Array.from({length: result.hits}, () => result.rolls);
  const frequencies = hits => hits.map(rolls => {
    const counts = new Map();
    for (const value of rolls) counts.set(value, (counts.get(value) || 0) + 1 / 16);
    return counts;
  });
  const first = frequencies(per);
  const laterResult = result.bust ? unshieldedMove(atk, {...def, broken: true}, slot, values) : result;
  const later = result.bust ? frequencies(laterResult.per || Array.from({length: laterResult.hits}, () => laterResult.rolls)) : first;
  let distribution = new Map([[`${target.curHP()},0,0`, 1]]);
  let probability = 0;
  const eot = [0, 1, 2, 3].map(turn => (result.eot || []).reduce((sum, part) => sum + part.v[turn], 0));
  result.ko = {n: 0, p: 0};
  for (let turn = 0; turn < 4; turn++) {
    for (const [index, counts] of (turn ? later : first).entries()) {
      const next = new Map();
      for (const [key, chance] of distribution) {
        const [before, consumed, saved] = key.split(',').map(Number);
        for (const [damage, weight] of counts) {
          const protects = survival && !saved && before === target.maxHP() && damage >= before;
          let hp = protects ? 1 : before - damage - (!turn && !index ? result.bust?.loss || 0 : 0);
          let used = consumed;
          if (hp <= 0) { probability += chance * weight; continue; }
          if (healing && !used) {
            const effect = berryEffect(target, field, user, hp, {eff: result.eff});
            if (effect) { hp += effect.heal; used = 1; }
          }
          const state = `${hp},${used},${saved || protects && sash ? 1 : 0}`;
          next.set(state, (next.get(state) || 0) + chance * weight);
        }
      }
      distribution = next;
    }
    const next = new Map();
    for (const [key, chance] of distribution) {
      const [before, consumed, saved] = key.split(',').map(Number);
      let hp = Math.min(target.maxHP(), before + eot[turn]);
      let used = consumed;
      if (hp <= 0) { probability += chance; continue; }
      if (healing && !used) {
        const effect = berryEffect(target, field, user, hp);
        if (effect) { hp += effect.heal; used = 1; }
      }
      const state = `${hp},${used},${saved}`;
      next.set(state, (next.get(state) || 0) + chance);
    }
    distribution = next;
    if (probability > 0) { result.ko = {n: turn + 1, p: Math.min(1, probability)}; break; }
  }
  return result;
}

// The user's own HP change from one use of a move (tools/calc/README.md, HP moves), given the damage it dealt: {v, l, set?,
// st?, later?} or null. `v` is the signed change; `set` new HPs for both (Pain Split); `st: 'slp'` (Rest); `later`: lands
// next turn (Wish). Damage-based amounts: Gen 5+ round half up, Gen 4 floor, at least 1.
const HEAL_HALF = new Set(['Recover', 'Soft-Boiled', 'Milk Drink', 'Slack Off', 'Heal Order', 'Roost']);
const HEAL_QUARTER = new Set(['Life Dew', 'Jungle Healing', 'Lunar Blessing']);
const WEATHER_HEAL = new Set(['Moonlight', 'Morning Sun', 'Synthesis']);
const SELF_KO = new Set(['Explosion', 'Self-Destruct', 'Misty Explosion', 'Final Gambit', 'Memento', 'Healing Wish', 'Lunar Dance']);
const COSTS = {'Belly Drum': 2, Substitute: 4, 'Fillet Away': 2, 'Clangorous Soul': 3, 'Shed Tail': 2};
const CRASH = new Set(['Jump Kick', 'High Jump Kick', 'Axe Kick', 'Supercell Slam']);

function contactEffects(user, target, move, field, category) {
  if (!move || !(move.flags?.contact || move.name === 'Shell Side Arm' && category === 'Physical')
    || user.hasAbility('Magic Guard')
    || profile.gen >= 7 && (user.hasAbility('Long Reach') || user.hasItem('Protective Pads'))
    || profile.gen >= 9 && user.hasItem('Punching Glove') && move.flags?.punch
    || profile.over?.contact?.defenderPads && target.hasItem('Protective Pads')) return [];
  const parts = [];
  if (target.hasAbility('Rough Skin') || profile.gen >= 5 && target.hasAbility('Iron Barbs')) {
    parts.push({l: target.ability, v: -Math.max(1, Math.floor(user.maxHP() / 8))});
  }
  if (profile.gen >= 5 && holdsItem(target, field) && target.hasItem('Rocky Helmet')) {
    parts.push({l: 'Rocky Helmet', v: -Math.max(1, Math.floor(user.maxHP() / 6))});
  }
  return parts;
}

function hp(atk, def, slot, values = {}, dealt = 0, options = {}) {
  const name = data.M[slot.mv];
  if (!name) return null;
  const moveData = generation.moves.get(toID(name));
  if (!moveData) return null;
  const user = fieldPokemon(atk, values, 'atk');
  const target = fieldPokemon(def, values, 'def');
  const field = battleField(values);
  checkAirLock(user, field);
  checkAirLock(target, field);
  checkItem(user, field.isMagicRoom);
  checkItem(target, field.isMagicRoom);
  const max = user.maxHP();
  const now = Math.max(0, Math.min(max, atk.hp ?? max));
  const part = (amount, num, den) => Math.max(1, profile.gen >= 5 ? Math.round(amount * num / den) : Math.floor(amount * num / den));
  const guard = user.hasAbility('Magic Guard');
  const items = !field.isMagicRoom && !user.hasAbility('Klutz');
  const root = heal => items && user.hasItem('Big Root') ? Math.floor(heal * 5324 / 4096) : heal;
  dealt = Math.max(0, Math.trunc(dealt || 0));
  if (options.miss) {
    if (!CRASH.has(name)) return null;
    let crash = Math.max(1, Math.floor(max / 2));
    if (profile.gen === 4) {
      const result = unshieldedMove(atk, {...def, broken: true}, slot, {...values, defProtect: false});
      const damage = options.damage ?? result?.max ?? 0;
      crash = Math.max(1, Math.floor(Math.min(target.maxHP(), result?.eff ? damage : target.maxHP()) / 2));
    }
    if (guard) crash = 0;
    return {v: crash ? -crash : 0, l: 'miss', crash};
  }
  if (SELF_KO.has(name)) return {v: -now, l: 'faints'};
  if (name === 'Pain Split') {
    const tmax = target.maxHP(), tnow = Math.max(0, Math.min(tmax, def.hp ?? tmax)), avg = Math.floor((now + tnow) / 2);
    return {v: Math.min(max, avg) - now, l: 'Pain Split', set: {atk: Math.min(max, avg), def: Math.min(tmax, avg)}};
  }
  if (name === 'Rest') return {v: max - now, l: 'Rest', st: 'slp'};
  if (name === 'Wish') return {v: Math.max(1, Math.floor(max / 2)), l: 'Wish', later: true};
  if (HEAL_HALF.has(name)) return {v: Math.max(1, Math.floor(max / 2)), l: name};
  if (HEAL_QUARTER.has(name)) return {v: Math.max(1, Math.floor(max / 4)), l: name};
  if (name === 'Shore Up') return {v: Math.max(1, Math.floor(max * (field.hasWeather('Sand') ? 2 / 3 : 1 / 2))), l: name};
  if (WEATHER_HEAL.has(name)) {
    const share = field.hasWeather('Sun', 'Harsh Sunshine') ? 2 / 3 : field.weather && !field.hasWeather('Strong Winds') ? 1 / 4 : 1 / 2;
    return {v: Math.max(1, Math.floor(max * share)), l: name};
  }
  if (name === 'Swallow') return {v: Math.max(1, Math.floor(max / [4, 2, 1][stockpile(slot) - 1])),
    l: `Swallow (${stockpile(slot)} Stockpile)`};
  if (name === 'Purify') return target.status ? {v: Math.max(1, Math.floor(max / 2)), l: name} : null;
  if (name === 'Curse') return user.hasType('Ghost') ? {v: -Math.max(1, Math.floor(max / 2)), l: 'Curse'} : null;
  if (COSTS[name]) return {v: -Math.max(1, Math.floor(max / COSTS[name])), l: name};
  if (name === 'Strength Sap') {
    const heal = root(target.stats.atk);
    return {v: target.hasAbility('Liquid Ooze') ? (guard ? 0 : -heal) : heal, l: name};
  }
  if (moveData.category === 'Status') return null;
  let landed = 0;
  if (dealt) {
    const result = calculateMove(atk, def, slot, values);
    landed = options.hits === undefined ? Math.max(0, (result?.hits || 1) - (result?.bust ? 1 : 0))
      : Math.max(0, Math.min(10, Math.trunc(Number(options.hits)) || 0));
    if (!landed) dealt = 0;
  }
  const parts = [];
  if (moveData.drain && dealt && (name !== 'Dream Eater' || target.hasStatus('slp') || target.hasAbility('Comatose'))) {
    const heal = root(part(dealt, ...moveData.drain));
    parts.push(target.hasAbility('Liquid Ooze') ? (guard ? 0 : -heal) : heal);
  }
  if (!guard) {
    if (moveData.struggleRecoil) parts.push(-Math.max(1, Math.floor(max / 4)));
    else if (moveData.mindBlownRecoil) parts.push(-Math.ceil(max / 2));
    else if (moveData.recoil && dealt && !user.hasAbility('Rock Head')) parts.push(-part(dealt, ...moveData.recoil));
    if (items && user.hasItem('Life Orb') && dealt && !(user.hasAbility('Sheer Force') && moveData.secondaries)) {
      parts.push(-Math.max(1, Math.floor(max / 10)));
    }
  }
  if (items && user.hasItem('Shell Bell') && dealt) parts.push(Math.max(1, Math.floor(dealt / 8)));
  const contact = contactEffects(user, target, moveData, field, slot.cat || moveData.category);
  for (let index = 0; index < landed; index++) parts.push(...contact.map(part => part.v));
  if (!parts.length) return null;
  return {v: parts.reduce((sum, value) => sum + value, 0), l: name};
}

window.DMG = {items: () => [...generation.items].map(item => item.name), init, stats, calc, residual, speed, entry, hp, hit, turn, berry, derived, settings, intimidate: intimidateMarks};

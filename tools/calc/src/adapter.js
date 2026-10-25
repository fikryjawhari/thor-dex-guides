import catalog from 'guide-calc-data';
import {Pokemon} from '@smogon/calc/src/pokemon';
import {Move} from '@smogon/calc/src/move';
import {Field} from '@smogon/calc/src/field';
import {calculateDPP} from '@smogon/calc/src/mechanics/gen4';
import {calculateBWXY} from '@smogon/calc/src/mechanics/gen56';
import {calculateSMSSSV} from '@smogon/calc/src/mechanics/gen789';
import {isGrounded} from '@smogon/calc/src/mechanics/util';
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
    num: profile.gen, critMultiplier: profile.over?.critMultiplier,
    species: table(species), moves: table({...stock.moves, ...moves}),
    items: table(items), abilities: table({...modern.abilities, ...stock.abilities}),
    natures: table(stock.natures), types: table(types),
    guideRules: prepareRules(profile.over),
  };
}

function pokemon(set) {
  const entry = speciesByID.get(String(set.id));
  if (!entry) throw new Error(`DMG: unknown species id ${set.id}`);
  const ability = data.AB?.[set.ab];
  const abilityName = profile.abilities !== false && ability
    ? effectName('abilities', ability[0], !!ability[2]) : '';
  const itemName = profile.items !== false ? effectName('items', set.it || '') : '';
  const statusEntry = profile.status?.find(([key]) => key === set.st);
  const status = statusEntry ? profile.over?.status?.[set.st] ?? set.st : '';
  const result = new Pokemon(generation, speciesNames.get(String(set.id)), {
    level: set.lv ?? 50,
    nature: profile.natures === false ? 'Serious' : set.nat || 'Serious',
    ability: abilityName || 'Guide no ability', item: itemName,
    status, ivs: statTable(set.iv, 31), evs: statTable(profile.evs === false ? undefined : set.ev, 0),
    boosts: statTable(set.stg, 0), curHP: set.hp,
  });
  if (set.hp !== undefined) result.originalCurHP = Math.max(0, Math.min(result.maxHP(), set.hp));
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
  for (const entry of profile.field || []) {
    const target = entry.side === 'atk' ? result.attackerSide : entry.side === 'def' ? result.defenderSide : result;
    const source = entry.side === 'atk' ? options.attackerSide : entry.side === 'def' ? options.defenderSide : options;
    if (!(entry.to in target) && Object.prototype.hasOwnProperty.call(source, entry.to)) target[entry.to] = source[entry.to];
  }
  return result;
}

const typeChangers = ['Protean', 'Libero'];
const changesType = (mon, set) => typeChangers.includes(data.AB?.[set.ab]?.[0]) || mon.hasAbility(...typeChangers);

// End-of-turn HP change for one Pokémon, part by part: [{l, v: [turn 1..4]}], negative = damage. Mirrors stock
// getEndOfTurn for the effects the page can state (no Leech Seed / trapping); the profile's `residual` adds a hack's
// own abilities and statuses ({abilities: {Name: [sign, divisor]}, status: {key: [sign, divisor, label]}}).
function residual(set, values = {}, mon = pokemon(set)) {
  if (set.pty && changesType(mon, set)) mon.types = [set.pty];
  const field = battleField(values);
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

function calc(atk, def, slot, values = {}) {
  const entry = data.MV[slot.mv];
  const name = data.M[slot.mv];
  if (!entry) return null;
  const moveData = generation.moves.get(toID(name));
  if (moveData.category === 'Status') return null;
  const listed = entry.bp === 'Varies' || profile.varpow?.includes(name);
  // Power from the battle state (weights, HP, speeds, boosts): stock works it out unless the page sets a power.
  const auto = listed && AUTO_POWER.has(moveData.name);
  const variable = listed && !auto;
  if (variable && slot.bp === undefined) return null;
  const power = slot.bp ?? (auto ? 1 : moveData.basePower);
  if (!(Number(power) > 0)) return null;
  const attacker = pokemon(atk);
  const defender = pokemon(def);
  // Protean / Libero: the attacker turns into the move's type (STAB and anything reading its type); a defender keeps
  // the type the page chose for it.
  if (changesType(attacker, atk)) attacker.types = [slot.t || moveData.type];
  if (def.pty && changesType(defender, def)) defender.types = [def.pty];
  const field = battleField(values);
  const overrides = {...moveData, basePower: Number(power), type: slot.t || moveData.type};
  if (listed && slot.bp !== undefined) {
    overrides.name = 'Guide fixed power';
    overrides.id = 'guidefixedpower';
  }
  const hitRange = profile.multihit?.[name];
  const stockHits = moveData.multihit;
  const defaultHits = hitRange?.[2] ?? (typeof stockHits === 'number' ? stockHits : Array.isArray(stockHits) ? stockHits[0] + 1 : 1);
  const selected = hitCount(slot.hits ?? defaultHits);
  const move = new Move(generation, moveData.name, {
    overrides, isCrit: !!slot.crit, hits: selected, ability: attacker.ability, item: attacker.item,
  });
  move.hits = selected;
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
    state: {hit: 1, hitCount: 0, hits: selected, originalPower: Number(power)},
  };
  generation.guideContext = context;
  const hits = hitCount(applyPhase(generation, 'hits', {}, selected));
  move.hits = hits;
  context.state.hits = hits;
  applyPhase(generation, 'beforeStats', {}, undefined);
  const calculate = profile.gen === 4 ? calculateDPP : profile.gen <= 6 ? calculateBWXY : calculateSMSSSV;
  const result = calculate(generation, attacker, defender, move, field);
  const normalise = damage => typeof damage === 'number' ? Array(16).fill(damage) : [...damage];
  const per = Array.isArray(result.damage) && (Array.isArray(result.damage[0]) || result.damage.length === 2)
    ? result.damage.map(normalise) : Array.from({length: hits}, () => normalise(result.damage));
  if (!per.every(rolls => rolls.length === 16 && rolls.every(value => Number.isInteger(value) && value >= 0))) {
    throw new Error(`DMG: invalid damage rolls for ${name}`);
  }
  const rolls = per[0];
  const min = Math.min(...rolls);
  const max = Math.max(...rolls);
  let eff = context.state.typeEffectiveness ?? 1;
  if (!max) eff = 0;
  const description = result.rawDesc;
  const notes = [...context.notes];
  // Residual damage / recovery counts in the KO text only, never in the rolls or percentages.
  const parts = residual(def, values);
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
    cat: move.category, rolls: [...rolls], hits: per.length, min, max,
    ...(auto && slot.bp === undefined && description.moveBP ? {bp: description.moveBP} : {}),
    priority: context.move.priority,
    ...(context.state.categoryAuto ? {categoryChoice: {automatic: context.state.categoryAuto,
      inverted: context.state.categoryInverted, tie: context.state.categoryTie}} : {}),
    ...(per.some(hit => hit.some((value, index) => value !== rolls[index])) ? {per} : {}),
    pmin: per.reduce((sum, hit) => sum + Math.min(...hit), 0) * 100 / defender.maxHP(),
    pmax: per.reduce((sum, hit) => sum + Math.max(...hit), 0) * 100 / defender.maxHP(),
    ko: knockout(per, current, eot, defender.maxHP() - current), eff, notes: [...new Set(notes)],
    ...(parts.length ? {eot: parts} : {}),
  };
}

window.DMG = {init, stats, calc, residual: (set, values) => residual(set, values)};

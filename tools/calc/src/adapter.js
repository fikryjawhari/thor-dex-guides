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
    num: profile.gen, critMultiplier: profile.over?.critMultiplier,
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
// Moves with a listed power that stock scales by HP: the result reports the power used, as for AUTO_POWER.
const HP_POWER = new Set(['Eruption', 'Water Spout', 'Dragon Energy']);

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
  const counted = (own < 6 ? own : 0) + (values[FOCUS.atk] ? 2 : 0) + itemStage + (attacker.hasAbility('Super Luck') ? 1 : 0);
  const stage = Math.min(table.length - 1, counted);
  const blocked = defender.hasAbility('Battle Armor', 'Shell Armor')
    && !attacker.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze');
  const forced = !blocked && (own >= 6 || table[stage] >= 1
    || (attacker.hasAbility('Merciless') && defender.hasStatus('psn', 'tox')));
  return {stage, p: blocked ? 0 : forced ? 1 : table[stage], forced};
}

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
  const state = statePower(name, slot.bp ?? (auto ? 1 : moveData.basePower), def, slot, slot.bp !== undefined || listed);
  const pledge = PLEDGES[name] && PLEDGES[slot.st] && slot.st !== name && slot.bp === undefined
    && profile.over?.state?.[name] !== false ? pledgeType([PLEDGES[name], PLEDGES[slot.st]]) : '';
  const power = pledge ? 150 : state.power;
  if (!(Number(power) > 0)) return null;
  const attacker = pokemon(atk);
  const defender = pokemon(def);
  const moveType = slot.t || pledge || moveData.type;
  // Protean / Libero: the attacker turns into the move's type (STAB and anything reading its type); a defender keeps
  // the type the page chose for it.
  if (changesType(attacker, atk)) attacker.types = [moveType];
  if (def.pty && changesType(defender, def)) defender.types = [def.pty];
  if (pledge && !attacker.hasType(pledge)) attacker.types = [...attacker.types, pledge];
  if (atk.fnt > 0) attacker.alliesFainted = Math.min(5, Math.trunc(atk.fnt));
  const field = battleField(values);
  if (def.vol === 'switch') field.defenderSide.isSwitching = 'out';
  const overrides = {...moveData, basePower: Number(power), type: moveType};
  if (dataCrit) overrides.willCrit = false;
  const crit = critChance(entry, moveData, attacker, defender, values);
  const useZ = !!(profile.zmove && slot.z && moveData.category !== 'Status');
  if (useZ) overrides.zMove = {basePower: zPower(moveData, Number(power), listed)};
  if (listed && slot.bp !== undefined) {
    overrides.name = 'Guide fixed power';
    overrides.id = 'guidefixedpower';
  }
  const hitRange = profile.multihit?.[name];
  const stockHits = moveData.multihit;
  const defaultHits = hitRange?.[2] ?? (typeof stockHits === 'number' ? stockHits : Array.isArray(stockHits) ? stockHits[0] + 1 : 1);
  const selected = useZ ? 1 : hitCount(slot.hits ?? defaultHits);
  const move = new Move(generation, moveData.name, {
    overrides, isCrit: crit.forced || (!!slot.crit && crit.p > 0), hits: selected, ability: attacker.ability, item: attacker.item, useZ,
    ...(slot.met > 0 ? {timesUsedWithMetronome: Math.trunc(slot.met)} : {}),
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
    state: {hit: 1, hitCount: 0, hits: selected, originalPower: Number(power), volDouble: state.double},
  };
  if (state.double) context.notes.add(VOLATILE_NOTES[def.vol]);
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
    cat: move.category, rolls: [...rolls], hits: per.length, min, max, crit,
    ...((auto || HP_POWER.has(moveData.name)) && slot.bp === undefined && description.moveBP
      ? {bp: description.moveBP} : !listed && !useZ && slot.bp === undefined && !perHit && shownPower !== moveData.basePower
        ? {bp: shownPower} : {}),
    priority: context.move.priority,
    ...(context.move.useZ ? {z: context.move.name} : {}),
    ...(context.state.categoryAuto ? {categoryChoice: {automatic: context.state.categoryAuto,
      inverted: context.state.categoryInverted, tie: context.state.categoryTie}} : {}),
    ...(perHit ? {per} : {}),
    pmin: per.reduce((sum, hit) => sum + Math.min(...hit), 0) * 100 / defender.maxHP(),
    pmax: per.reduce((sum, hit) => sum + Math.max(...hit), 0) * 100 / defender.maxHP(),
    ko: knockout(per, current, eot, defender.maxHP() - current), eff, notes: [...new Set(notes)],
    ...(parts.length ? {eot: parts} : {}),
  };
}

window.DMG = {init, stats, calc, residual: (set, values) => residual(set, values)};

import catalog from 'guide-calc-data';
import {Pokemon} from '@smogon/calc/src/pokemon';
import {Move} from '@smogon/calc/src/move';
import {Field} from '@smogon/calc/src/field';
import {calculateDPP} from '@smogon/calc/src/mechanics/gen4';
import {calculateBWXY} from '@smogon/calc/src/mechanics/gen56';
import {calculateSMSSSV} from '@smogon/calc/src/mechanics/gen789';
import {applyPhase, prepareRules} from './rules.js';

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

function speciesName(name) {
  return name.replace(/^Mega (.+?)(?: ([XY]))?$/, (_, base, suffix) => `${base}-Mega${suffix ? '-' + suffix : ''}`)
    .replace(/^Primal (.+)$/, '$1-Primal');
}

function effectName(collection, name, original = false) {
  const effect = profile.over?.[collection]?.[name]?.effect;
  if (effect !== undefined) return effect;
  return original ? '' : name;
}

function init(guide, configuration) {
  if (![4, 5, 6, 7, 8, 9].includes(configuration.gen)) throw new Error('DMG: supported generations are 4-9');
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
      weightkg: known.weightkg ?? 1,
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
    status, ivs: statTable(set.iv, 31), evs: statTable(set.ev, 0),
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
    if (!(entry.to in target) && Object.hasOwn(source, entry.to)) target[entry.to] = source[entry.to];
  }
  return result;
}

function knockout(per, hp) {
  if (hp <= 0) return {n: 0, p: 0};
  const max = per.reduce((sum, rolls) => sum + Math.max(...rolls), 0);
  if (max * 4 < hp || !max) return {n: 0, p: 0};
  const key = `${per.map(rolls => rolls.join(',')).join(';')};${hp}`;
  if (koCache.has(key)) return {...koCache.get(key)};
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

function calc(atk, def, slot, values = {}) {
  const entry = data.MV[slot.mv];
  const name = data.M[slot.mv];
  if (!entry) return null;
  const moveData = generation.moves.get(toID(name));
  if (moveData.category === 'Status') return null;
  const variable = entry.bp === 'Varies' || profile.varpow?.includes(name);
  if (variable && slot.bp === undefined) return null;
  const power = slot.bp ?? moveData.basePower;
  if (!(Number(power) > 0)) return null;
  const attacker = pokemon(atk);
  const defender = pokemon(def);
  const field = battleField(values);
  const overrides = {...moveData, basePower: Number(power), type: slot.t || moveData.type};
  if (variable && slot.bp !== undefined) {
    overrides.name = 'Guide fixed power';
    overrides.id = 'guidefixedpower';
  }
  const hitRange = profile.multihit?.[name];
  const stockHits = moveData.multihit;
  const defaultHits = hitRange?.[2] ?? (typeof stockHits === 'number' ? stockHits : Array.isArray(stockHits) ? stockHits[0] + 1 : 1);
  const hits = Math.max(1, Math.min(10, Math.trunc(slot.hits ?? defaultHits)));
  const move = new Move(generation, name, {
    overrides, isCrit: !!slot.crit, hits, ability: attacker.ability, item: attacker.item,
  });
  move.hits = hits;
  const context = {
    atk: attacker, def: defender, move, field, desc: {}, notes: new Set(),
    input: {atk, def, slot, field: values},
    names: {atk: data.P.find(entry => String(entry.id) === String(atk.id)).n,
      def: data.P.find(entry => String(entry.id) === String(def.id)).n,
      atkAbility: data.AB[atk.ab]?.[0] || '', defAbility: data.AB[def.ab]?.[0] || '',
      atkItem: atk.it || '', defItem: def.it || '', move: name},
    state: {hit: 1, hitCount: 0, hits, originalPower: Number(power)},
  };
  generation.guideContext = context;
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
    ...(per.some(hit => hit.some((value, index) => value !== rolls[index])) ? {per} : {}),
    pmin: per.reduce((sum, hit) => sum + Math.min(...hit), 0) * 100 / defender.maxHP(),
    pmax: per.reduce((sum, hit) => sum + Math.max(...hit), 0) * 100 / defender.maxHP(),
    ko: knockout(per, def.hp ?? defender.maxHP()), eff, notes: [...new Set(notes)],
  };
}

window.DMG = {init, stats, calc};

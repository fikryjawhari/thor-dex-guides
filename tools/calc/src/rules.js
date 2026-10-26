import {sportPowerDPP} from './gen4-sport.js';

const phases = new Set(['hits', 'beforeStats', 'afterMoveType', 'effectiveness', 'critical', 'turnOrder',
  'movePower', 'powerMods', 'attackMods', 'defenseMods', 'attack', 'defense',
  'hitBaseDamage', 'beforeWeather', 'baseDamage', 'finalMods', 'beforeRolls', 'roll']);
const forbidden = new Set(['__proto__', 'prototype', 'constructor', 'gen']);
const writeRoots = new Set(['atk', 'def', 'move', 'field', 'state', 'desc', 'value']);

export function fieldGrounded(mon, field) {
  if (field.isGravity || mon.guideGrounded || (mon.hasItem('Iron Ball') && !mon.hasAbility('Klutz') && !field.isMagicRoom)) return true;
  if (mon.guideAirborne) return false;
  return undefined;
}

function fieldPhase(gen, phase, context, after = false) {
  const values = context.input.field;
  if (!after && phase === 'powerMods') {
    const sport = context.move.hasType('Fire') && values.waterSport ? 'Water Sport'
      : context.move.hasType('Electric') && values.mudSport ? 'Mud Sport' : '';
    if (sport) {
      if (gen.num >= 5) context.value.unshift(1352);
      context.notes.add(sport);
    }
  }
  if (phase === 'effectiveness') {
    const type = context.state.effectivenessType;
    if (context.move.hasType('Ground')) {
      const grounded = fieldGrounded(context.def, context.field);
      if (after && grounded === false && !context.move.named('Thousand Arrows')) context.value = 0;
      else if (!after && grounded && type === 'Flying' && (context.field.isGravity || context.def.guideGrounded)) context.value = 1;
    }
    if (!after && values.defMiracleEye && type === 'Dark' && context.move.hasType('Psychic')) context.value = 1;
    if (after && values.defTarShot && context.move.hasType('Fire') && type === context.def.types[0]) context.value *= 2;
  }
  if (!after && phase === 'finalMods' && values.defGlaiveRush) {
    context.value.push(gen.num === 4 ? 2 : 8192);
    context.state.fieldGlaiveApplied = true;
  }
}

function parts(path) {
  if (typeof path !== 'string' || !path.length) throw new Error('DMG rule: expected a path');
  const keys = path.split('.');
  if (keys.some(key => forbidden.has(key))) throw new Error(`DMG rule: forbidden path ${path}`);
  return keys;
}

function read(context, path) {
  return parts(path).reduce((value, key) => value == null ? undefined : value[key], context);
}

function write(context, path, value) {
  const keys = parts(path);
  if (!writeRoots.has(keys[0])) throw new Error(`DMG rule: read-only root ${keys[0]}`);
  let target = context;
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null) target[key] = {};
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
}

function expression(node, context, depth = 0) {
  if (depth > 40) throw new Error('DMG rule: expression too deep');
  if (node === null || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(value => expression(value, context, depth + 1));
  if ('ref' in node) return read(context, node.ref);
  if ('literal' in node) return JSON.parse(JSON.stringify(node.literal));
  const evaluate = value => expression(value, context, depth + 1);
  const args = node.args || [];
  if (node.op === 'and') return args.every(value => !!evaluate(value));
  if (node.op === 'or') return args.some(value => !!evaluate(value));
  if (node.op === 'if') return evaluate(args[0]) ? evaluate(args[1]) : evaluate(args[2]);
  const values = args.map(evaluate);
  const [left, right] = values;
  switch (node.op) {
  case 'eq': return left === right;
  case 'ne': return left !== right;
  case 'gt': return left > right;
  case 'gte': return left >= right;
  case 'lt': return left < right;
  case 'lte': return left <= right;
  case 'not': return !left;
  case 'in': return right?.includes(left) || false;
  case 'includes': return left?.includes(right) || false;
  case 'startsWith': return typeof left === 'string' && left.startsWith(right);
  case 'intersects': return Array.isArray(left) && left.some(value => right?.includes(value));
  case 'add': return values.reduce((total, value) => total + value, 0);
  case 'sub': return left - right;
  case 'mul': return values.reduce((total, value) => total * value, 1);
  case 'div': return left / right;
  case 'mod': return left % right;
  case 'min': return Math.min(...values);
  case 'max': return Math.max(...values);
  case 'floor': return Math.floor(left);
  case 'ceil': return Math.ceil(left);
  case 'round': return Math.round(left);
  case 'pokeRound': return Math.ceil(left - 0.5);
  case 'of32': return left >>> 0;
  case 'of16': return left & 65535;
  case 'coalesce': return values.find(value => value !== null && value !== undefined);
  case 'lookup': {
    if (forbidden.has(String(right))) throw new Error('DMG rule: forbidden lookup');
    return left?.[String(right)];
  }
  case 'positiveSum': return Object.values(left || {}).reduce((total, value) => total + Math.max(0, value), 0);
  default: throw new Error(`DMG rule: unknown expression ${node.op}`);
  }
}

export function prepareRules(over = {}) {
  if (!Array.isArray(over.rules || [])) throw new Error('DMG: over.rules must be an array');
  const result = {};
  for (const rule of over.rules || []) {
    if (!phases.has(rule.phase)) throw new Error(`DMG: unknown rule phase ${rule.phase}`);
    (result[rule.phase] ||= []).push(rule);
    for (const path of Object.keys(rule.set || {})) {
      const root = parts(path)[0];
      if (!writeRoots.has(root)) throw new Error(`DMG rule: read-only root ${root}`);
    }
  }
  return result;
}

export function applyPhase(gen, phase, local, value) {
  const base = gen.guideContext;
  if (!base) return value;
  // The loop's hit counters are authoritative. Native functions can carry their own hit parameter
  // (Gen 5 base-power modifiers default it to 1), which must not overwrite the current hit.
  const {hit, hitCount, ...native} = local?.state || {};
  const state = Object.assign(base.state, native);
  const context = {...base, ...local, state, value};
  context.atk = context.attacker || base.atk;
  context.def = context.defender || base.def;
  fieldPhase(gen, phase, context);
  if (local?.desc) base.desc = local.desc;
  if (phase === 'afterMoveType') base.move = context.move;
  for (const rule of gen.guideRules?.[phase] || []) {
    if (rule.when !== undefined && !expression(rule.when, context)) continue;
    for (const [path, node] of Object.entries(rule.set || {})) write(context, path, expression(node, context));
    if ('value' in rule) context.value = expression(rule.value, context);
    for (const node of rule.remove || []) {
      const index = context.value.indexOf(expression(node, context));
      if (index !== -1) context.value.splice(index, 1);
    }
    for (const replacement of rule.replace || []) {
      const index = context.value.lastIndexOf(expression(replacement.from, context));
      if (index !== -1) context.value[index] = expression(replacement.to, context);
    }
    for (const node of rule.append || []) context.value.push(expression(node, context));
    if (rule.note) base.notes.add(String(expression(rule.note, context)));
  }
  fieldPhase(gen, phase, context, true);
  if (phase === 'critical') state.isCritical = context.value;
  if (phase === 'movePower') {
    state.basePower = context.value;
    if (state.hit === 1) state.firstPower = context.value;
  }
  if (phase === 'effectiveness') state.effectivenessType = local.state.effectivenessType;
  return context.value;
}

export function legacyMods(gen, phase, local, value) {
  if (phase === 'powerMods') {
    const base = gen.guideContext;
    const values = base.input.field;
    if (local.move.hasType('Fire') && values.waterSport || local.move.hasType('Electric') && values.mudSport) {
      value = sportPowerDPP({...base, ...local, state: base.state, atk: local.attacker, def: local.defender});
    }
  }
  const modifiers = applyPhase(gen, phase, local, []);
  return modifiers.reduce((amount, multiplier) => Math.floor(amount * multiplier), value);
}

export function guideRoll(gen, calculate, baseDamage, rollIndex, effectiveness, isBurned, stabMod, finalMod, protect) {
  const context = gen.guideContext;
  if (rollIndex === 0) {
    context.state.rollInputs = applyPhase(gen, 'beforeRolls', {}, {baseDamage, effectiveness, isBurned, stabMod, finalMod, protect});
  }
  const inputs = context.state.rollInputs;
  return applyPhase(gen, 'roll', {state: {rollIndex}}, calculate(inputs.baseDamage, rollIndex,
    inputs.effectiveness, inputs.isBurned, inputs.stabMod, inputs.finalMod, inputs.protect));
}

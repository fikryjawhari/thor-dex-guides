import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const [showdown, mods] = process.argv.slice(2);
if (!showdown || !mods) throw new Error('Usage: node refresh_moves.mjs PINNED/moves.ts PINNED/moves-gen8.ts');
const context = {module: {exports: {}}};
runInNewContext(stripTypeScriptTypes(readFileSync(showdown, 'utf8')).replace('export const Moves', 'globalThis.Moves'), context);
const base = context.Moves;
const modSource = stripTypeScriptTypes(readFileSync(mods, 'utf8')).replace('export const Moves', 'globalThis.Moves');
const modContext = {};
runInNewContext(modSource, modContext);
const official = {};
for (const [id, move] of Object.entries(base)) {
  const override = modContext.Moves[id];
  official[id] = override ? (override.inherit ? {...move, ...override} : override) : move;
}
const calcSource = readFileSync(resolve(here, '../.src/unboundcalc/PokemonUnboundDamageCalculator_files/moves_YA0k.js'), 'utf8');
const util = {
  toID: value => String(value).toLowerCase().replace(/[^a-z0-9]/g, ''),
  extend: (deep, target, ...objects) => {
    if (typeof deep !== 'boolean') { objects.unshift(target); target = deep; }
    for (const object of objects) for (const [name, value] of Object.entries(object)) {
      target[name] = value && typeof value === 'object' && !Array.isArray(value)
        ? util.extend(true, {...target[name]}, value) : value;
    }
    return target;
  },
  assignWithout: (target, object, excluded) => {
    for (const [name, value] of Object.entries(object)) if (!excluded.has(name)) target[name] = value;
  },
};
const calcContext = {exports: {}, require: () => util};
runInNewContext(calcSource, calcContext);
const calc = calcContext.exports.MOVES[8];
const engine = readFileSync(resolve(root, 'template/calc/engine.js'), 'utf8');
const engineContext = {window: {}};
const patched = engine.replace(/(var \w+=)(\{4:\{moves:)/, '$1globalThis.catalog=$2');
if (patched === engine) throw new Error('Cannot locate stock engine move catalog');
runInNewContext(patched, engineContext);
const catalog = engineContext.catalog;
const stock = {};
for (let gen = 4; gen <= 8; gen++) Object.assign(stock, catalog[gen].moves);
const modern = {...stock, ...catalog[9].moves};
const data = JSON.parse(readFileSync(resolve(here, '../data.json'), 'utf8'));
const fields = ['flags', 'target', 'secondary', 'secondaries', 'self', 'status', 'boosts', 'volatileStatus',
  'recoil', 'drain', 'heal', 'multihit', 'hasCrashDamage'];
const calcFields = ['makesContact', 'isPunch', 'isBite', 'isBullet', 'isSound', 'isPulse', 'isDrill', 'isTail',
  'recoil', 'drain', 'multihit', 'hasCrashDamage'];
const moves = {};
const missing = [];
for (const [index, name] of data.M.entries()) {
  const id = util.toID(name);
  const move = official[id];
  if (!move) { missing.push(name); continue; }
  const record = Object.fromEntries(fields.filter(field => move[field] !== undefined).map(field => [field, move[field]]));
  record.reliableProtect = true;
  const custom = calc[name];
  if (custom) {
    for (const field of calcFields) if (custom[field] !== undefined) record[field] = custom[field];
    if (custom.target) record.target = custom.target;
    if (custom.secondaries !== undefined && !custom.secondaries) {
      delete record.secondary;
      delete record.secondaries;
    }
  }
  const known = data.MV[index].x ? {} : stock[id] || modern[id] || {};
  record.calcFlags = Object.keys(known.flags || {}).filter(flag => flag !== 'protect');
  moves[name] = record;
}
const snapshot = {
  sources: {
    fallback: 'Showdown ccfaa20f32af363569cd21a9d501b2bc1ded26b1 moves.ts + moves-gen8.ts',
    calc: 'Saved Unbound calculator moves_YA0k.js, fetched 2026-10-29 (SOURCES.md)',
    compatibility: 'Stock damage flags from guide engine at 959deb5 (@smogon/calc 0.12.0)',
  },
  moves,
};
writeFileSync(resolve(here, 'move_metadata.json'), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`metadata: ${Object.keys(moves).length}; missing: ${missing.join(', ')}`);

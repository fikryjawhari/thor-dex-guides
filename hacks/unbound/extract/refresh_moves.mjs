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
  'recoil', 'drain', 'heal', 'multihit', 'hasCrashDamage', 'mindBlownRecoil'];
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
  if (id === 'struggle') {
    record.recoil = [1, 4];
    record.recoilBasis = 'maxhp';
  }
  if (['triattack', 'direclaw'].includes(id)) {
    const statuses = id === 'triattack' ? ['brn', 'par', 'frz'] : ['psn', 'par', 'slp'];
    if (!statuses.every(status => String(move.secondary.onHit).includes(`'${status}'`))) throw new Error(`${name}: secondary callback drift`);
    record.effectOverrides = [{chance: move.secondary.chance, alternatives: statuses.map(status => ({kind: 'status', status}))}];
  }
  if (id === 'fakeout') record.effectOverrides = [{kind: 'flinch', condition: 'first turn out only'}]; // Showdown onTry; Unbound text
  if (id === 'burningjealousy') record.effectOverrides = [{kind: 'status', status: 'brn', condition: 'target raised stats this turn'}];
  if (id === 'secretpower') record.effectOverrides = [
    {kind: 'status', status: 'par', chance: 30, condition: 'no terrain or Electric Terrain'},
    {kind: 'status', status: 'slp', chance: 30, condition: 'Grassy Terrain'},
    {kind: 'stages', stages: {spa: -1}, chance: 30, condition: 'Misty Terrain'},
    {kind: 'stages', stages: {spe: -1}, chance: 30, condition: 'Psychic Terrain'},
  ];
  if (id === 'rest') record.heal = [1, 1];
  if (id === 'junglehealing') record.heal = [1, 4];
  if (id === 'healpulse') record.heal = [1, 2];
  if (id === 'pollenpuff') record.effectOverrides = [{kind: 'heal', fraction: [1, 2], condition: 'ally target only'}];
  if (id === 'purify') record.effectOverrides = [{kind: 'heal', fraction: [1, 2], condition: 'user, after curing the target'}];
  if (['moonlight', 'morningsun', 'synthesis'].includes(id)) record.effectOverrides = [
    {kind: 'heal', fraction: [1, 2], condition: 'no weather'},
    {kind: 'heal', fraction: [2, 3], condition: 'sun'},
    {kind: 'heal', fraction: [1, 4], condition: 'other weather'},
  ];
  if (id === 'shoreup') record.effectOverrides = [
    {kind: 'heal', fraction: [1, 2], condition: 'no sandstorm'},
    {kind: 'heal', fraction: [2, 3], condition: 'sandstorm'},
  ];
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
writeFileSync(resolve(here, 'move_metadata.json'), '{\n  "sources": ' + JSON.stringify(snapshot.sources, null, 2)
  + ',\n  "moves": {\n' + Object.entries(moves).map(([name, record]) => '    ' + JSON.stringify(name) + ': ' + JSON.stringify(record)).join(',\n') + '\n  }\n}\n');
const properties = record => {
  const flags = new Set(Object.keys(record.flags || {}));
  for (const [key, flag] of Object.entries({makesContact: 'contact', isSound: 'sound'})) {
    if (key in record) { flags.delete(flag); if (record[key]) flags.add(flag); }
  }
  for (const flag of record.calcFlags) flags.add(flag);
  return flags;
};
const sound = Object.keys(moves).filter(name => properties(moves[name]).has('sound') && data.MV[data.M.indexOf(name)].c !== 'Status');
const noncontact = Object.keys(moves).filter(name => !properties(moves[name]).has('contact') && data.MV[data.M.indexOf(name)].c !== 'Status');
const rules = [];
for (const ability of ['Bellow', 'Sound Waves']) {
  rules.push({a: ability, w: 'u', e: 'Power ×1.3', add: sound, src: 'unboundcalc/gen78_YA0k.js:690-691; hzla/calc/mechanics/romhacks/profiles/unbound.js basePowerMods'});
  rules.push({a: ability, w: 't', e: 'Damage ×0.5', add: sound, src: 'unboundcalc/gen78_YA0k.js:993-995; hzla/calc/mechanics/romhacks/profiles/unbound.js finalMods'});
}
rules.push({a: 'Drill Beak', w: 'u', e: 'Always critical (unless blocked)', add: Object.keys(moves).filter(name => moves[name].isDrill), src: 'unboundcalc/gen78_YA0k.js:60; moves_YA0k.js:3733-3734,3836; hzla/calc/mechanics/gen789.js:178'});
rules.push({a: 'Slippery Tail', w: 'u', e: 'Priority becomes +1', add: Object.keys(moves).filter(name => moves[name].isTail), src: 'unboundcalc/gen78_YA0k.js:150-152; moves_YA0k.js isTail (includes Tail Glow and Tail Whip); hzla Unbound profile afterMoveType'});
rules.push({a: 'Portal Power', w: 't', e: 'Damage ×0.75', add: noncontact, src: 'unboundcalc/gen78_YA0k.js:1002-1003; hzla Unbound profile finalMods (!move.flags.contact)'});
const typed = (type, damaging) => Object.keys(moves).filter(name => data.MV[data.M.indexOf(name)].t === type
  && (!damaging || data.MV[data.M.indexOf(name)].c !== 'Status'));
rules.push({a: 'Gale Wings', w: 'u', e: 'Priority becomes +1', add: typed('Flying', false), src: 'unboundwiki.json Gale Wings ("Flying-type moves hit first", no HP condition); unboundcalc/gen78_YA0k.js:146-150 (no HP check)'});
rules.push({a: 'Grass Dash', w: 'u', e: 'Priority becomes +1', add: typed('Grass', false), src: 'unboundwiki.json Grass Dash ("Grass-type moves hit first"); unboundcalc/gen78_YA0k.js:146-150'});
rules.push({a: 'Evaporate', w: 't', e: 'Blocks it; ups Sp. Atk', add: typed('Water', true), src: 'unboundwiki.json Evaporate ("Nullifies all water to up Sp. Atk."); unboundcalc/gen78_YA0k.js:207 (water immunity only; the calc has no boost)'});
writeFileSync(resolve(here, 'move_rules.json'), JSON.stringify(rules, null, 2) + '\n');
console.log(`metadata: ${Object.keys(moves).length}; missing: ${missing.join(', ')}`);

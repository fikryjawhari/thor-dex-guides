// pokemon-showdown dist/data files -> one JSON. Usage: node tools/showdown.js <dist/data dir> <out.json>
// Reads what the folder has: moves.js (moves), text/moves.js (mtext), pokedex.js (dex), text/abilities.js (atext),
// abilities.js (abilities: id -> name). Hardlove Gold needs the first four, Emerald Imperium moves.js + abilities.js.
const fs = require('fs'), path = require('path');
const d = process.argv[2];
const has = f => fs.existsSync(path.join(d, f));
const ld = f => { const m = { exports: {} }; new Function('module', 'exports', 'require', fs.readFileSync(path.join(d, f), 'utf8'))(m, m.exports, require); return m.exports; };
const o = {};
if (has('moves.js')) {
  o.moves = {};
  for (const [k, v] of Object.entries(ld('moves.js').Moves)) o.moves[k] = { name: v.name, type: v.type, category: v.category, basePower: v.basePower, accuracy: v.accuracy, pp: v.pp, priority: v.priority, isMax: !!v.isMax, isZ: !!v.isZ, flags: Object.keys(v.flags || {}) };
}
if (has('text/moves.js')) {
  o.mtext = {};
  for (const [k, v] of Object.entries(ld('text/moves.js').MovesText)) o.mtext[k] = { shortDesc: v.shortDesc, desc: v.desc };
}
if (has('pokedex.js')) {
  o.dex = {};
  for (const [k, v] of Object.entries(ld('pokedex.js').Pokedex)) o.dex[k] = { num: v.num, name: v.name, baseSpecies: v.baseSpecies, forme: v.forme, types: v.types, baseStats: v.baseStats, abilities: v.abilities, requiredItem: v.requiredItem };
}
if (has('text/abilities.js')) {
  o.atext = {};
  for (const [k, v] of Object.entries(ld('text/abilities.js').AbilitiesText)) o.atext[k] = { name: v.name, shortDesc: v.shortDesc || v.desc };
}
if (has('abilities.js')) {
  o.abilities = {};
  for (const [k, v] of Object.entries(ld('abilities.js').Abilities)) o.abilities[k] = { name: v.name };
}
fs.writeFileSync(process.argv[3], JSON.stringify(o));
console.log(Object.keys(o).map(k => k + ' ' + Object.keys(o[k]).length).join(', '));

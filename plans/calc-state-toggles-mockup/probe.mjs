import fs from 'node:fs';
const root = process.argv[2];
globalThis.window = globalThis;
(0, eval)(fs.readFileSync(root + '/template/calc/engine.js', 'utf8'));
const data = JSON.parse(fs.readFileSync(root + '/hacks/photonic-sun/data.json', 'utf8'));
const prof = JSON.parse(fs.readFileSync(root + '/template/calc/profiles/gen7.json', 'utf8'));
DMG.init(data, prof);
const P = data.P, M = data.M, MV = data.MV;
const AB = data.AB.map(e => e[0]);
const pid = n => { const p = P.find(x => x.n === n); if (!p) throw new Error('no species ' + n); return p.id; };
const mi = n => { const i = M.indexOf(n); if (i < 0) throw new Error('no move ' + n); return i; };
const mon = (name, x = {}) => ({ id: pid(name), lv: 50, nat: 'Serious', ab: 0, it: '', st: '', iv: [31,31,31,31,31,31], ev: [0,0,0,0,0,0], stg: [0,0,0,0,0,0], abilityOn: false, pty: '', toxn: 1, ...x });
const run = (move, atk, def, F = {}, slot = {}) => {
  const r = DMG.calc(atk, def, { mv: mi(move), ...slot }, F);
  if (!r) return 'null';
  return `${r.min}-${r.max}${r.bp !== undefined ? ' bp=' + r.bp : ''}`;
};
const A = mon('Garchomp'), D = mon('Snorlax'), G = mon('Garchomp', {nat:'Serious'});
const cases = [
  ['Lash Out', 'base', A, D],
  ['Lash Out', 'atk -1 atk', mon('Garchomp', {stg: [0,-1,0,0,0,0]}), D],
  ['Facade', 'base', A, D],
  ['Facade', 'atk burned', mon('Garchomp', {st: 'brn'}), D],
  ['Facade', 'atk paralysed', mon('Garchomp', {st: 'par'}), D],
  ['Acrobatics', 'base', A, D],
  ['Acrobatics', 'atk no item', A, D],
  ['Acrobatics', 'atk Oran Berry', mon('Garchomp', {it: 'Oran Berry'}), D],
  ['Brine', 'def full', A, D],
  ['Brine', 'def half', A, mon('Snorlax', {hp: 100})],
  ['Venoshock', 'def healthy', A, D],
  ['Venoshock', 'def psn', A, mon('Snorlax', {st: 'psn'})],
  ['Hex', 'def healthy', A, D],
  ['Hex', 'def slp', A, mon('Snorlax', {st: 'slp'})],
  ['Knock Off', 'def no item', A, D],
  ['Knock Off', 'def Leftovers', A, mon('Snorlax', {it: 'Leftovers'})],
  ['Stored Power', 'atk +0', A, D],
  ['Stored Power', 'atk +2 spa', mon('Garchomp', {stg: [0,0,2,0,0,0]}), D],
  ['Power Trip', 'atk +2 atk', mon('Garchomp', {stg: [0,2,0,0,0,0]}), D],
  ['Punishment', 'def +2 atk', A, mon('Snorlax', {stg: [0,2,0,0,0,0]})],
  ['Weather Ball', 'no weather', A, D],
  ['Weather Ball', 'sun', A, D, {weather: 'Sun'}],
  ['Assurance', 'def full', A, D],
  ['Assurance', 'def hit (no hp state)', A, mon('Snorlax', {hp: 200})],
  ['Retaliate', 'base', A, D],
  ['Revenge', 'base', A, D],
  ['Avalanche', 'base', A, D],
  ['Stomping Tantrum', 'base', A, D],
  ['Bolt Beak', 'atk faster (Garchomp 102 base spe vs Snorlax 30)', A, D],
  ['Bolt Beak', 'atk slower', D, A],
  ['Fishious Rend', 'atk faster', A, D],
  ['Fishious Rend', 'atk slower', D, A],
  ['Payback', 'base', A, D],
  ['Payback', 'def moved first (not modelled)', A, D],
  ['Fury Cutter', 'base', A, D],
  ['Rollout', 'base', A, D],
  ['Ice Ball', 'base', A, D],
  ['Rage Fist', 'base', A, D],
  ['Echoed Voice', 'base', A, D],
  ['Last Respects', 'base', A, D],
  ['Smelling Salts', 'def par', A, mon('Snorlax', {st: 'par'})],
  ['Smelling Salts', 'def healthy', A, D],
  ['Wake-Up Slap', 'def slp', A, mon('Snorlax', {st: 'slp'})],
  ['Terrain Pulse', 'no terrain', A, D],
  ['Electro Drift', 'base', A, D],
  ['Collision Course', 'base', A, D],
  ['Solar Beam', 'no weather', A, D],
  ['Solar Beam', 'sun', A, D, {weather: 'Sun'}],
  ['Grav Apple', 'base', A, D],
  ['Expanding Force', 'base', A, D],
  ['Psyblade', 'base', A, D],
  ['Infernal Parade', 'def healthy', A, D],
  ['Infernal Parade', 'def psn', A, mon('Snorlax', {st: 'psn'})],
  ['Barb Barrage', 'def healthy', A, D],
  ['Barb Barrage', 'def psn', A, mon('Snorlax', {st: 'psn'})],
  ['Gust', 'base', A, D],
  ['Earthquake', 'base', A, D],
  ['Magnitude', 'base', A, D],
  ['Surf', 'base', A, D],
  ['Stomp', 'base', A, D],
  ['Round', 'base', A, D],
  ['Fusion Bolt', 'base', A, D],
  ['Fusion Flare', 'base', A, D],
  ['Fickle Beam', 'base', A, D],
  ['Pursuit', 'base', A, D],
  ['Meteor Beam', 'base', A, D],
  ['Skull Bash', 'base', A, D],
  ['Spectral Thief', 'base', A, D],
];
let last = '';
for (const [move, label, atk, def, F] of cases) {
  try {
    const row = [move, label, run(move, atk, def, F || {})];
    console.log(row.join(' | '));
  } catch (e) { console.log(move, '|', label, '| ERR', e.message); }
}
console.log('--- Hex vs non-immune (Garchomp as defender)');
console.log('Hex | def healthy |', run('Hex', mon('Snorlax'), G));
console.log('Hex | def slp |', run('Hex', mon('Snorlax'), mon('Garchomp', {st: 'slp'})));

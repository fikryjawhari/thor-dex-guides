import fs from 'node:fs';
const root = process.argv[2];
const want = ['Assurance','Revenge','Avalanche','Retaliate','Stomping Tantrum','Temper Flare','Lash Out','Fury Cutter','Echoed Voice','Rollout','Ice Ball','Rage Fist','Last Respects','Gust','Twister','Earthquake','Magnitude','Surf','Whirlpool','Stomp','Pursuit','Round','Fusion Bolt','Fusion Flare','Fire Pledge','Water Pledge','Grass Pledge','Fickle Beam','Weather Ball','Facade','Acrobatics','Brine','Venoshock','Hex','Knock Off','Smelling Salts','Wake-Up Slap','Stored Power','Power Trip','Punishment','Solar Beam','Grav Apple','Terrain Pulse','Psyblade','Expanding Force','Electro Drift','Collision Course'];
const hacks = ['photonic-sun','eternal-x','hardlove-gold','emerald-imperium'];
const sets = Object.fromEntries(hacks.map(h => [h, new Set(JSON.parse(fs.readFileSync(`${root}/hacks/${h}/data.json`, 'utf8')).M)]));
for (const n of want) console.log(n.padEnd(18), hacks.map(h => sets[h].has(n) ? 'Y' : '-').join(' '));
console.log('(columns: photonic eternal hardlove emerald)');

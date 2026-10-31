import {readFileSync, writeFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = process.argv[2];
if (!source) throw new Error('Usage: node move_source.mjs <local .tmp/showdown directory>');
const load = name => {
  const text = stripTypeScriptTypes(readFileSync(path.join(source, name), 'utf8'));
  return new Function(text.replace('export const Moves', 'const Moves') + '\nreturn Moves;')();
};
const latest = load('moves.ts');
let stock = {...latest};
for (const generation of [8, 7, 6, 5]) {
  for (const [name, entry] of Object.entries(load(`moves-gen${generation}.ts`))) {
    stock[name] = entry.inherit ? {...stock[name], ...entry} : entry;
  }
}
const guide = JSON.parse(readFileSync(path.join(here, '../data.json'), 'utf8'));
const fields = ['flags', 'target', 'secondary', 'secondaries', 'self', 'boosts', 'status',
  'volatileStatus', 'recoil', 'drain', 'heal', 'multihit', 'hasCrashDamage', 'struggleRecoil'];
const moves = {};
for (const name of guide.M) {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const modern = latest[id];
  const move = modern?.gen > 5 || modern?.num > 559 ? modern : stock[id];
  if (!move?.target && name.startsWith('Shadow ')) {
    moves[name] = null;
    continue;
  }
  if (!move?.target) throw new Error(`Missing stock move: ${name}`);
  moves[name] = Object.fromEntries(fields.filter(field => move[field] !== undefined)
    .map(field => [field, move[field]]));
}
writeFileSync(path.join(here, 'move_source.json'), JSON.stringify({
  source: 'smogon/pokemon-showdown ccfaa20f32af363569cd21a9d501b2bc1ded26b1; moves.ts + mods 8,7,6,5; post-Gen-V replacements use base',
  moves,
}, null, 2) + '\n');
console.log(`Stock move metadata: ${Object.keys(moves).length}`);

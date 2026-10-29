// CFRU save oracles (local research only): runs hzla's savereader_unbound.js and Unbound-Cloud's own Python reader
// (cfru_oracle_cloud.py) on every save under a directory and writes one normalised JSON per save, plus summary.json.
// Neither reference is copied into the guide: template/calc/readers/cfru.js is written from the format notes.
//
//   node tools/calc/cfru_oracles.mjs [--hack unbound] [--out .tmp/unbound-reader/oracles]
//
// Inputs (git-ignored): hacks/<hack>/.src/saves/Unbound-Cloud/**.sav, .src/repos/hzla, .src/repos/Unbound-Cloud.
// A normalised mon: {box?, slot?, pid?, sp, lv, nat 0-24, abs, it, mv [4], iv, ev} in game ids, IVs / EVs in the game's
// order HP Atk Def Spe SpA SpD. hzla gives no pid or box position (its boxes are one list in slot order).
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (name, fallback) => {const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback;};
const hack = arg('--hack', 'unbound'), src = join(root, 'hacks', hack, '.src');
const out = resolve(root, arg('--out', `.tmp/${hack}-reader/oracles`));
const savesDir = join(src, 'saves', 'Unbound-Cloud'), cloudDir = join(src, 'repos', 'Unbound-Cloud');
const hzlaPath = join(src, 'repos', 'hzla', 'js', 'savereaders', 'savereader_unbound.js');
for (const p of [savesDir, cloudDir, hzlaPath]) if (!existsSync(p)) {console.log(`skip: ${relative(root, p)} missing`); process.exit(0);}

const walk = dir => readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(join(dir, e.name))
  : /\.(sav|srm)$/i.test(e.name) ? [join(dir, e.name)] : []).sort();
const saves = walk(savesDir);
const require = createRequire(import.meta.url);
const hzla = require(hzlaPath), constants = require(join(dirname(hzlaPath), 'save_constants', 'unbound_2_1_constants.js'));
const natureIndex = name => constants.NATURE_DISPLAY_NAMES.indexOf(name);

function runHzla(file) {
  const bytes = readFileSync(file);
  try {
    const r = hzla.parseUnboundSaveFile(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const mon = m => ({sp: m.speciesId, lv: m.level, nat: natureIndex(m.natureName), abs: m.abilitySlot, it: m.itemId,
      mv: m.moveIds, iv: m.ivs, ev: m.evs});
    return {accepted: true, signature: '0x' + r.fileSignature.toString(16).toUpperCase().padStart(8, '0'),
      party: r.parsedParty.map(mon), boxes: r.parsedBoxes.map(mon)};
  } catch (e) {return {accepted: false, reason: e.message};}
}

const cloudLines = execFileSync('uv', ['run', 'python', '-I', join(root, 'tools', 'calc', 'cfru_oracle_cloud.py'), cloudDir, ...saves],
  {cwd: root, encoding: 'utf8', maxBuffer: 1 << 28}).trim().split('\n').map(l => JSON.parse(l));
const cloudBy = new Map(cloudLines.map(c => [resolve(c.file), c]));
const summary = [];
for (const file of saves) {
  const name = relative(savesDir, file).replace(/\\/g, '/');
  const cloud = cloudBy.get(resolve(file)), h = runHzla(file);
  delete cloud.file;
  const target = join(out, name.replace(/\.(sav|srm)$/i, '.json'));
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, JSON.stringify({save: name, bytes: readFileSync(file).length, hzla: h, cloud}, null, 1));
  summary.push({save: name, hzla: h.accepted ? `accepted: ${h.party.length} party, ${h.boxes.length} boxed` : `rejected: ${h.reason}`,
    cloud: cloud.accepted ? `accepted${cloud.randomizer ? ' (randomizer flag set)' : ''}: ${cloud.boxes.filter(m => !m.egg).length} boxed`
      : `rejected: ${cloud.reason}`});
}
writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 1));
for (const s of summary) console.log(`${s.save.padEnd(48)} hzla ${s.hzla.padEnd(70)} cloud ${s.cloud}`);

// The CFRU reader's Radical Red profile on the synthetic saves of cfru_rr.mjs (tools/calc/cfru_rr/: the saves and
// their expected imports, written from the encoder's specs, not from the reader): party and all 25 boxes in the guide's
// names, the refusals, and the Unbound guide (which names no profile) refusing an RR save. Provisional until a real
// RR save (plans/radical-red.md D7, in git history).
//
//   node tools/calc/cfru_rr_check.mjs
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {loadReader, guideData, named} from './cfru_lib.mjs';
import {dir, root} from './cfru_rr.mjs';

if (!existsSync(join(root, 'hacks', 'radical-red', 'data.json'))) {console.log('cfru radical-red: skipped (no data.json)'); process.exit(0);}
const read = loadReader(root), D = guideData(root, 'radical-red');
D.cfg = {...D.cfg, calc: {...(D.cfg.calc || {}), save: 'cfru', cfru: 'radicalred41'}};   // until hack.json sets it
const code = (bytes, data) => {try {read(bytes, data); return 'read';} catch (e) {return e.code;}};
let mons = 0, saves = 0;
for (const name of readdirSync(dir).filter(n => n.endsWith('.expected.json')).sort()) {
  const want = JSON.parse(readFileSync(join(dir, name), 'utf8')), bytes = new Uint8Array(readFileSync(join(dir, want.save)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), want.sha256, `${want.save}: not the fixture's file`);
  saves++;
  if (want.error) {assert.equal(code(bytes, D), want.error, want.save); continue;}
  const got = read(bytes, D), list = ms => ms.map(m => named(D, m));
  assert.equal(got.game, 'Pokémon Radical Red 4.1');
  assert.deepEqual(list(got.party), want.party, `${want.save}: party`);
  assert.equal(got.boxes.length, 25, `${want.save}: box count`);
  got.boxes.forEach((box, b) => assert.deepEqual(list(box), want.boxes[b], `${want.save}: box ${b + 1}`));
  mons += want.party.length + want.boxes.flat().length;
}
// the Unbound guide names no profile: an RR save is another game's there, as before the RR profile
const U = existsSync(join(root, 'hacks', 'unbound', 'data.json')) ? guideData(root, 'unbound') : null;
if (U) assert.equal(code(new Uint8Array(readFileSync(join(dir, 'main.sav'))), U), 'wrong', 'Unbound guide, RR save');
console.log(`cfru radical-red: ${saves} synthetic saves, ${mons} Pokémon match their specs${U ? '; the Unbound guide refuses them' : ''}`);

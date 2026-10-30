// The CFRU save reader (template/calc/readers/cfru.js) on every local save with a fixture: party and every box, in
// the guide's names, against hacks/<hack>/.src/saves/expected/<save>.expected.json (git-ignored, beside the saves) (written from the two oracles by
// cfru_compare.mjs --write-fixtures; refused saves give their error code). The saves are not in git: without
// hacks/<hack>/.src/saves/ the check skips.
//
//   node tools/calc/cfru_check.mjs [hack]
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReader, guideData, named} from './cfru_lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const hack = process.argv[2] || 'unbound';
const fixtures = join(root, 'hacks', hack, '.src', 'saves', 'expected'), saves = join(root, 'hacks', hack, '.src', 'saves', 'Unbound-Cloud');
if (!existsSync(saves)) {console.log(`cfru ${hack}: skipped (no ${saves.slice(root.length + 1)})`); process.exit(0);}
const read = loadReader(root), D = guideData(root, hack);
const load = name => JSON.parse(readFileSync(join(fixtures, name), 'utf8'));
let mons = 0, checked = 0, refused = 0;
for (const name of readdirSync(fixtures).filter(n => n.endsWith('.expected.json')).sort()) {
  const fixture = load(name), file = join(saves, fixture.save);
  assert.ok(existsSync(file), `${fixture.save}: missing from ${saves}`);
  const bytes = new Uint8Array(readFileSync(file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), fixture.sha256, `${fixture.save}: not the fixture's file`);
  const want = fixture.same ? load(fixture.same) : fixture;
  let got;
  try {got = read(bytes, D);} catch (e) {
    assert.equal(e.code, want.error, `${fixture.save}: threw ${e.code}${e.game ? ' (' + e.game + ')' : ''}`);
    refused++; checked++; continue;
  }
  assert.ok(!want.error, `${fixture.save}: read, expected ${want.error}`);
  const list = ms => ms.map(m => named(D, m)).filter(Boolean);
  assert.deepEqual(list(got.party), want.party, `${fixture.save}: party`);
  assert.equal(got.boxes.length, want.boxes.length, `${fixture.save}: box count`);
  got.boxes.forEach((box, b) => assert.deepEqual(list(box), want.boxes[b], `${fixture.save}: box ${b + 1}`));
  mons += want.party.length + want.boxes.flat().length; checked++;
}
// controls: the reader's refusals without a real save
const blank = new Uint8Array(0x20000).fill(0xFF), code = bytes => {try {read(bytes, D); return 'read';} catch (e) {return e.code;}};
assert.equal(code(blank), 'empty', 'erased flash');
assert.equal(code(new Uint8Array(0x10000)), 'wrong', '64 KB save');
assert.equal(code(new TextEncoder().encode('RASTATE\x01' + 'x'.repeat(100))), 'state', 'RetroArch state');
const base = new Uint8Array(readFileSync(join(saves, 'flex.sav'))), patched = edit => {const b = base.slice(); edit(b, new DataView(b.buffer)); return b;};
assert.equal(code(patched((b, v) => {for (let s = 0; s < 28; s++) v.setUint32(s * 0x1000 + 0xFF8, 0x08012025, true);})), 'wrong', 'vanilla signature');
assert.equal(code(patched(b => {b[0x5000] ^= 1; b[0xE000 + 0x5000] ^= 1;})), 'unreadable', 'both slots damaged');
assert.equal(code(patched(b => b.fill(0xFF, 0, 0x1C000))), 'empty', 'slots erased');
console.log(`cfru ${hack}: ${checked} saves (${refused} refused as expected), ${mons} Pokémon match the oracle fixtures`);

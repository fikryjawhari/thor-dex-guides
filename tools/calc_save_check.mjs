// The done-check for a save reader: import a save into a built guide through its real file input, then compare the
// imported party and boxes with an expected file written in names.
// Usage: node tools/calc_save_check.mjs <guide.html> <save file> <expected.json>
//   exit 0: every Pokémon matches; 1: a mismatch (the diff is printed); 2: the import or the setup failed.
// A .json save is a fixture in the test format (tools/scenarios/fixtures/calc/*.json) and goes through the `test`
// reader (template/calc/readers/test.js); any other file through the guide's reader as built (cfg.calc.save).
//
// expected.json: { "party": [mon, ...], "boxes": [[mon, ...], ...] }, with mon =
//   { "species": "Garchomp", "level": 34, "nature": "Hardy", "ability": "Rough Skin", "item": "",
//     "moves": ["Earthquake", "Ice Punch"], "ivs": [31,31,31,31,31,31], "evs": [0,0,0,0,0,0] }
// Names are the guide's own (data.json: species, AB ability names, M move names). The counts of party and boxes
// must match exactly. Inside a mon, each field that is present is compared (omit a field to skip it); moves are
// compared in order, with "" for an empty slot. Expected files are easiest to write from data.json, not by reading
// the page's output back: that would check the page against itself.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, prepareGuide, Page, openBrowser, readGuide } from './calc_check_lib.mjs';

const [guideArg, saveArg, expectedArg] = process.argv.slice(2);
if (!guideArg || !saveArg || !expectedArg) {
  console.error('usage: node tools/calc_save_check.mjs <guide.html> <save file> <expected.json>');
  process.exit(2);
}
const guide = resolve(guideArg), save = resolve(saveArg), expectedFile = resolve(expectedArg);
const expected = JSON.parse(readFileSync(expectedFile, 'utf8'));
if (!Array.isArray(expected.party) || !Array.isArray(expected.boxes)) {
  console.error(`${expectedFile}: needs "party" (array) and "boxes" (array of arrays)`);
  process.exit(2);
}

const fixture = /\.json$/i.test(save);
const file = prepareGuide(guide, { tag: 'save-check', realReader: !fixture });
if (!file) {
  console.error(`${guide}: no cfg.calc, so there is no import to check`);
  process.exit(2);
}
const { data } = readGuide(guide);
const reader = fixture ? 'test' : data.cfg.calc.save;
if (!reader) {
  console.error(`${guide}: the guide names no save reader (cfg.calc.save), so only .json fixtures can be checked`);
  process.exit(2);
}
console.log(`reader: ${reader}${fixture ? ' (a .json fixture)' : ''}`);

const byId = Object.fromEntries(data.P.map(p => [String(p.id), p]));
const abilityName = index => data.AB[index]?.[0] ?? `ability ${index}`;
const moveName = index => (index == null ? '' : data.M[index] ?? `move ${index}`);
// The page's imported model (after the guide's own id mapping) as names, to compare with the expected file.
const named = mon => ({
  species: byId[mon.id]?.n ?? `species ${mon.id}`,
  level: mon.l,
  nature: mon.na,
  ability: abilityName(mon.a),
  item: mon.i || '',
  moves: [0, 1, 2, 3].map(slot => moveName(mon.m?.[slot])),
  ivs: mon.iv,
  evs: mon.ev,
});

const browser = await openBrowser('calc-save-check');
let code = 0;
try {
  const page = await Page.open(browser, { file, width: 260, height: 316, dvkb: false });
  try {
    await page.route('#/calc');
    await page.importPath(save, save.split(/[\\/]/).pop());
    const banner = await page.banner();
    if (!banner?.ok) {
      console.log(`import failed: ${banner ? banner.text : 'no banner'}`);
      code = 2;
    } else {
      console.log(`import: ${banner.text}`);
      const imported = await page.value('(()=>{const s=CALC.state().imp;return s?{party:s.party,boxes:s.boxes}:null;})()');
      const diffs = [];
      const compare = (path, want, got) => {
        if (Array.isArray(want)) {
          if (JSON.stringify(want) !== JSON.stringify(got)) diffs.push(`${path}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
          return;
        }
        if (want !== got) diffs.push(`${path}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      };
      const check = (path, want, mon) => {
        if (!mon) return diffs.push(`${path}: expected a Pokémon, the save has none`);
        const got = named(mon);
        for (const field of Object.keys(want)) compare(`${path}.${field}`, want[field], got[field]);
      };
      if (imported.party.length !== expected.party.length) diffs.push(`party: expected ${expected.party.length} Pokémon, got ${imported.party.length}`);
      expected.party.forEach((want, index) => check(`party[${index}]`, want, imported.party[index]));
      const boxSizes = imported.boxes.map(box => box.length), wantBoxSizes = expected.boxes.map(box => box.length);
      if (JSON.stringify(boxSizes) !== JSON.stringify(wantBoxSizes)) diffs.push(`boxes: expected sizes ${JSON.stringify(wantBoxSizes)}, got ${JSON.stringify(boxSizes)}`);
      expected.boxes.forEach((box, boxIndex) => box.forEach((want, index) => check(`boxes[${boxIndex}][${index}]`, want, imported.boxes[boxIndex]?.[index])));
      const total = imported.party.length + boxSizes.reduce((sum, size) => sum + size, 0);
      if (diffs.length) {
        console.log(`MISMATCH: ${diffs.length} difference(s) from ${expectedFile}`);
        for (const line of diffs) console.log('  ' + line);
        code = 1;
      } else {
        console.log(`OK: ${total} Pokémon (${imported.party.length} party, ${total - imported.party.length} boxed) match ${expectedFile}`);
      }
    }
    if (page.errors.length) {
      console.log('page errors: ' + page.errors.join(' | '));
      code = 2;
    }
  } finally {
    await page.close();
  }
} finally {
  await browser.close();
}
process.exit(code);

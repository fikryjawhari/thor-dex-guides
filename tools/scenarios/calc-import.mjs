// Calc import: spec checks 12 (save and reset), 14 (import errors), 15 (empty states). Each runs at 260 x 316 in normal and
// dvkb mode. Without cfg.calc: skip. The import is the guide's real file input (the test reader on the fixtures).
import assert from 'node:assert/strict';
import { fixturePatches, guideArg, pickCell, prepareGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-import', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-import: no cfg.calc');
  process.exit(0);
}

const mineName = page => page.value(`document.querySelector('.dmatch .cc[data-s="mine"] .cn b').textContent.trim()`);
const mineLevel = page => page.value(`+document.querySelector('[data-lv="mine"]').value`);
// Edit's open state belongs to the side, not the Pokémon: open it only when it is closed.
const editMine = async page => {
  if (!(await page.count('.dmatch .cc[data-s="mine"] .ed'))) await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
};
// The imported party and boxes as the page holds them (names and levels), for before / after comparisons.
const imported = page => page.value(`(()=>{const s=CALC.state();return s.imp?{party:s.imp.party.map(m=>[m.id,m.l,m.na,m.a,m.i,m.m.join('|')].join(':')),boxes:s.imp.boxes.map(b=>b.length),file:s.imp.file}:null;})()`);
const banner = page => page.banner();

const checks = [
  {
    id: '12 save and reset',
    title: 'unsaved (*) survives a reload; Save makes it (•); Original goes back to the save file; a re-import clears both',
    run: async page => {
      await setupCalc(page);
      await editMine(page);
      await page.setBox('[data-lv="mine"]', 30);
      assert.equal(await mineName(page), 'Cloyster *', 'unsaved change marked');
      await page.reload();
      assert.equal(await mineName(page), 'Cloyster *', 'the unsaved change is kept across a reload');
      await editMine(page);
      assert.equal(await mineLevel(page), 30, 'at 30');
      await editMine(page);
      await page.tap('[data-a="esave"][data-s="mine"]');
      assert.equal(await mineName(page), 'Cloyster •', 'saved (•)');
      assert.equal(await page.text('[data-a="ereset"][data-s="mine"]'), 'Original', 'Reset reads Original with nothing unsaved');
      await page.tap('[data-a="ereset"][data-s="mine"]');
      assert.equal(await mineLevel(page), 33, "Original: back to the save file's level");
      assert.equal(await mineName(page), 'Cloyster', 'no mark');
      // edits on two Pokémon, then a re-import: both cleared, and the banner says how many
      await editMine(page);
      await page.setBox('[data-lv="mine"]', 30);
      await pickCell(page, 'party', 0);
      await editMine(page);
      await page.setBox('[data-lv="mine"]', 36);
      await editMine(page);
      await page.tap('[data-a="esave"][data-s="mine"]');
      await page.importSave('reimport.json');
      const ban = await banner(page);
      assert(ban.ok && /Imported reimport\.json/.test(ban.text), `banner: ${ban.text}`);
      assert(/2 edited Pokémon reset/.test(ban.text), `the banner should count two: ${ban.text}`);
      const keys = await page.value(`Object.keys(CALC.state().edits).concat(Object.keys(CALC.state().saved)).filter(k=>k.startsWith('mine:'))`);
      assert.deepEqual(keys, [], 'the edits and saved changes are cleared');
      assert.equal(await mineLevel(page), 35, "the new file's Garchomp level (35) is in the grid (selected party slot 0)");
    },
  },
  {
    id: '14 import errors',
    title: 'each error file gives a red banner and keeps the grid, the selection and the previous import; a good file replaces them',
    run: async page => {
      await setupCalc(page);
      await pickCell(page, 'party', 3);
      const before = { mine: await page.value('CALC.state().mine'), imp: await imported(page), cells: await page.count('.mg .dstrip button') };
      const errors = [
        ['wrong.json', 'Wrong game', 'Pokémon Platinum'],
        ['state.json', 'Save state', 'battery .sav'],
        ['unreadable.json', 'Unreadable', 'checksum'],
        ['empty.json', 'No Pokémon yet', 'no party'],
      ];
      for (const [name, title, detail] of errors) {
        await page.importSave(name);
        const ban = await banner(page);
        assert(ban && !ban.ok, `${name}: want a red banner, got ${JSON.stringify(ban)}`);
        assert(ban.text.includes(title), `${name}: "${title}" in "${ban.text}"`);
        assert(ban.text.includes(detail), `${name}: "${detail}" in "${ban.text}"`);
        assert.deepEqual(await page.value('CALC.state().mine'), before.mine, `${name}: the selection is unchanged`);
        assert.deepEqual(await imported(page), before.imp, `${name}: the previous import is kept`);
        assert.equal(await page.count('.mg .dstrip button'), before.cells, `${name}: the grid is unchanged`);
      }
      await page.importSave('reimport.json');
      const good = await banner(page);
      assert(good.ok && good.text.includes('Imported reimport.json'), `a good file after errors: ${good.text}`);
      assert.equal((await imported(page)).party[0].split(':')[1], '35', 'the grid is replaced by the new import');
    },
  },
  {
    id: '15 empty states',
    title: 'nothing imported: two big buttons, Pick yours, Pick a trainer, Pick one of yours; a cleared state is the same',
    run: async page => {
      await page.route('#/calc');
      const empty = async () => {
        assert.equal(await page.count('.mg .dempty .dbtn'), 2, 'two big buttons');
        assert.deepEqual(await page.value(`[...document.querySelectorAll('.mg .dempty .dbtn')].map(b=>b.textContent.trim())`), ['Import save', 'New Pokémon']);
        assert.equal(await page.text('.dmatch .cc .cn b'), 'Pick yours', 'Mine card');
        assert.equal(await page.text('.fbar .nm'), 'Pick a trainer', 'foe unset');
        const notes = await page.value(`[...document.querySelectorAll('.dres .dnote')].map(n=>n.textContent.trim())`);
        assert(notes.includes('Pick one of yours'), `results: ${JSON.stringify(notes)}`);
      };
      await empty();
      await page.value('localStorage.clear()');
      await page.reload();
      await page.route('#/calc');
      await empty();
    },
  },
];

await runChecks({ name: 'calc-import', file, checks });

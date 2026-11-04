import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { SIZE_SMALL, readGuide, runChecks } from '../../../tools/calc_check_lib.mjs';

const before = resolve(process.argv[2] || '.tmp/start/emerald-imperium.html');
const after = resolve(process.argv[3] || 'dist/emerald-imperium.html');
const original = readGuide(before).data;
const updated = readGuide(after).data;
const parents = updated.AR.map((area, index) => index).filter(index => updated.AR[index].fo
  && updated.AR.some(area => area.in === index) && !updated.AR[index].sub);
const members = parent => updated.AR.map((area, index) => index)
  .filter(index => updated.AR[index].in === parent && !original.AR[index].ns);
const eggs = original.AR.flatMap(area => area.sub || []);
const species = index => original.P.find(pokemon => pokemon.w.some(row => original.AR[index].l.includes(row[0]))).id;
const slots = parents.flatMap(parent => [parent, ...members(parent)]);
assert.equal(slots.length, 58);
assert.equal(eggs.length, 25);
assert.deepEqual(original.LOC, updated.LOC);
assert.equal(original.AR.length, updated.AR.length);
for (const key of Object.keys(original).filter(key => !['AR', 'P', 'WK', 'built'].includes(key))) {
  assert.deepEqual(updated[key], original[key], key + ' is unchanged');
}
assert.deepEqual(updated.P.map(({ w, ...pokemon }) => pokemon), original.P.map(({ w, ...pokemon }) => pokemon));
const walkthrough = JSON.parse(JSON.stringify(original.WK));
for (const split of walkthrough.splits) for (const stop of split.st) stop.a = stop.a.filter(index => index !== 100);
assert.deepEqual(updated.WK, walkthrough, 'only the redundant Underwater encounter reference changes');
original.AR.forEach((area, index) => {
  assert.deepEqual(updated.AR[index].l, area.l, 'published location keys ' + index);
  assert.deepEqual(updated.AR[index].sub, area.sub, 'published egg sub-slot keys ' + index);
});

await runChecks({
  name: 'ei-published-encounters', file: before,
  checks: [
    {
      id: 'published floor and egg keys',
      title: 'all real published floor entries and egg sub-slots survive the conversion',
      sizes: SIZE_SMALL, modes: ['normal', 'dvkb'],
      run: async page => {
        const entries = Object.fromEntries([...slots, ...eggs].map(index => [index, { p: species(index) }]));
        await page.route('#/locs');
        await page.value(`(()=>{TK.e=${JSON.stringify(entries)};tkSave();LO.o={'15':1,'27':1};loSave();})()`);
        const counts = await page.value('tkCounts()');
        page.file = after;
        await page.goto('#/locs');
        assert.equal(await page.value(`document.querySelector('details.split[data-a="15"]').open`), true);
        assert.deepEqual(await page.value('TK.e'), entries);
        assert.deepEqual(await page.value('tkCounts()'), counts);
        for (const parent of parents) {
          await page.value(`(async()=>{const card=document.querySelector('details.split[data-a="${parent}"]');
            card.open=true;await new Promise(resolve=>setTimeout(resolve,150));})()`);
          assert.equal(await page.value(`document.querySelectorAll('details.split[data-a="${parent}"] .tk-also').length`), members(parent).length);
        }
        assert.equal(await page.value(`document.querySelector('details.split[data-a="27"]').open`), true);
        for (const index of eggs) assert.deepEqual(await page.value(`TK.e[${index}]`), entries[index]);
        await page.reload();
        assert.deepEqual(await page.value('TK.e'), entries);
      },
    },
    {
      id: 'published underwater split',
      title: 'the real combined underwater key moves by species, preserves collisions and counts, and reloads',
      sizes: SIZE_SMALL, modes: ['normal', 'dvkb'],
      run: async page => {
        const legacy = 100, choices = original.P.filter(pokemon => pokemon.w.some(row => original.AR[legacy].l.includes(row[0])));
        const cases = [...choices.map(pokemon => ({ p: pokemon.id })), { f: 1 }, { p: 'Unknown underwater species' }];
        for (const entry of cases) {
          const destination = updated.AR[legacy].to.find(([, ids]) => ids.includes(entry.p))?.[0] ?? updated.AR[legacy].in;
          for (const taken of [false, true]) {
            page.file = before;
            await page.goto('#/locs');
            const entries = { [legacy]: entry };
            if (taken) entries[destination] = { p: species(destination) };
            await page.value(`(()=>{TK.e=${JSON.stringify(entries)};tkSave();})()`);
            const counts = await page.value('tkCounts()');
            page.file = after;
            await page.goto('#/locs');
            const expected = taken ? entries : { [destination]: entry };
            assert.deepEqual(await page.value('TK.e'), expected);
            assert.deepEqual(await page.value('tkCounts()'), counts);
            assert.equal(await page.value(`!!document.querySelector('details.split[data-a="${legacy}"]')`), false);
            if (taken) {
              await page.value(`(async()=>{const card=document.querySelector('details.split[data-a="${destination}"]');
                card.open=true;await new Promise(resolve=>setTimeout(resolve,150));})()`);
              assert.match(await page.value(`document.querySelector('details.split[data-a="${destination}"] .tk-also').textContent`),
                /Underwater Routes 124 and 126/);
            }
            await page.reload();
            assert.deepEqual(await page.value('TK.e'), expected);
          }
        }
      },
    },
    {
      id: 'published member-only entries',
      title: 'a lone recorded member moves to its real parent; failed entries and eggs also survive',
      sizes: SIZE_SMALL, modes: ['normal', 'dvkb'],
      run: async page => {
        const entries = {}, expected = {};
        parents.forEach((parent, order) => {
          const member = members(parent).at(-1), entry = order % 2 ? { f: 1 } : { p: species(member) };
          entries[member] = entry;
          expected[parent] = entry;
        });
        eggs.forEach(index => { entries[index] = expected[index] = { p: species(index) }; });
        await page.value(`(()=>{TK.e=${JSON.stringify(entries)};tkSave();})()`);
        const counts = await page.value('tkCounts()');
        page.file = after;
        await page.goto('#/locs');
        assert.deepEqual(await page.value('TK.e'), expected);
        assert.deepEqual(await page.value('tkCounts()'), counts);
        await page.reload();
        assert.deepEqual(await page.value('TK.e'), expected);
      },
    },
  ],
});

// The encounter standard on the Locations page (plans/encounters.md, template/README.md → Encounters). Guides whose
// data is in the standard (D.ESV 2); others skip.
//   e1 cards: a card per location, the Extra card last; in a white box, sections in the standard's order (per floor),
//      floor headings and the floor in the yellow header when there are 2+; the picker grouped by section, each
//      species once, then Other…; a Water chip on a rate.
//   e2 extra: rows added on the Extra card (place, species, failed) are saved in the tracker (TK.x, by name), counted,
//      kept across a reload, in the backup code; removing them and Reset all clear them; an older backup (no x) loads.
//   e3 old saves: a tracker save from before the standard (no x) loads unchanged; open sections saved by the old
//      section names ('area.place.Grass') open the same section by code; other names drop.
import assert from 'node:assert/strict';
import { SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { data } = readGuide(file);
const ESV = data.ESV === 2;
const skip = ESV ? undefined : 'guide not in the encounter standard yet';
const KINDS = ['grass', 'cave', 'water', 'special', 'raid', 'gift', 'trade'];
const NAMES = { grass: 'Grass', cave: 'Cave', water: 'Water', special: 'Special', raid: 'Raids', gift: 'Gifts & static', trade: 'Trades' };
const AR = data.AR || [];
// A slot with the most sections (and floors when the guide has them), and one with a water chip.
const rank = a => (AR[a].es || []).length * 10 + (AR[a].fo || []).length;
const slots = AR.map((A, a) => a).filter(a => AR[a].es && AR[a].in == null && !AR[a].st && !AR[a].ns);
const BIG = slots.sort((x, y) => rank(y) - rank(x))[0];
const FLOORS = slots.find(a => (AR[a].fo || []).length > 1);
const species = slots.length ? AR[slots[0]].es[0].g[0].rows[0].p : null;
const nameOf = id => data.P.find(p => p.id === id)?.n;

const openCard = a => `(async()=>{const d=document.querySelector('details.split[data-a="${a}"]');if(!d.open){d.open=true;await new Promise(r=>setTimeout(r,150));}return !!d.querySelector('.stop');})()`;

const checks = [
  {
    id: 'e1 cards',
    title: 'cards, sections in order, floors and the grouped picker',
    skip, sizes: SIZE_SMALL, modes: ['normal'],
    run: async page => {
      await page.route('#/locs');
      const cards = await page.value(`[...document.querySelectorAll('#app>details.split[data-a]')].map(d=>d.dataset.a)`);
      assert.equal(cards.at(-1), 'x', 'the Extra card is last');
      assert.equal(new Set(cards).size, cards.length, 'a card per location, never twice');
      assert.ok(!cards.some(a => a !== 'x' && AR[a].in != null), 'merged members have no card');
      for (const a of [BIG, FLOORS].filter(x => x != null)) {
        assert.ok(await page.value(openCard(a)), `card ${AR[a].n} opens with its white box`);
        const got = await page.value(`(()=>{const d=document.querySelector('details.split[data-a="${a}"]');
          return {secs:[...d.querySelectorAll('.stop>details.sec')].map(s=>s.dataset.s),floors:[...d.querySelectorAll('.stop>.esfl')].map(f=>f.textContent),
           heads:[...d.querySelectorAll('.stop>details.sec>summary')].map(s=>s.textContent),groups:[...d.querySelectorAll('.tk-sel>optgroup')].map(g=>[g.label,[...g.children].map(o=>o.value)]),
           opts:[...d.querySelectorAll('.tk-sel option')].map(o=>o.value),open:d.querySelectorAll('details.sec[open]').length};})()`);
        const fo = AR[a].fo || [''];
        const want = fo.flatMap(f => KINDS.filter(k => AR[a].es.some(s => s.k === k && s.g.some(g => (g.f || '') === f))).map(k => `${a}|${f}|${k}`));
        assert.deepEqual(got.secs, want, `${AR[a].n}: sections by floor, in the standard's order`);
        assert.equal(got.open, 0, `${AR[a].n}: sections start closed`);
        if (fo.length > 1) {
          assert.deepEqual(got.floors, fo.filter(Boolean), `${AR[a].n}: a heading per floor`);
          got.secs.forEach((k, i) => { const f = k.split('|')[1]; if (f) assert.ok(got.heads[i].includes(f), `${AR[a].n}: the yellow header names its floor (${got.heads[i]})`); });
        }
        got.secs.forEach((k, i) => assert.ok(got.heads[i].startsWith(NAMES[k.split('|')[2]]), `section name ${got.heads[i]}`));
        const order = got.groups.map(g => g[0]);
        assert.deepEqual(order, KINDS.filter(k => k !== 'trade').map(k => NAMES[k]).filter(n => order.includes(n)), `${AR[a].n}: picker groups in section order`);
        const ids = got.groups.flatMap(g => g[1]);
        assert.equal(new Set(ids).size, ids.length, `${AR[a].n}: each species once in the picker`);
        for (const [, g] of got.groups) assert.deepEqual(g, [...g].sort((x, y) => nameOf(x).localeCompare(nameOf(y))), 'A–Z inside a group');
        assert.deepEqual([got.opts[0], got.opts[1], got.opts.at(-1)], ['', '__fail', '__other'], 'None yet, Failed / fled first, Other… last');
      }
      const water = slots.find(a => AR[a].es.some(s => s.k === 'water'));
      if (water != null) {
        await page.value(openCard(water));
        const chips = await page.value(`(()=>{const d=document.querySelector('details.split[data-a="${water}"] details.sec[data-s$="|water"]');d.open=true;return [...d.querySelectorAll('.q')].map(q=>q.textContent);})()`);
        assert.ok(chips.length && chips.every(c => ['Surf', 'Surf ripple', 'Old', 'Good', 'Super', 'Fish', 'Fish ripple', 'Bubbling'].includes(c)), `water rates carry how chips: ${chips.slice(0, 6)}`);
      }
    },
  },
  {
    id: 'e2 extra',
    title: 'Extra card rows: saved by name, counted, reloaded, in the backup, cleared',
    skip, sizes: SIZE_SMALL, modes: ['normal', 'dvkb'],
    run: async (page, { dvkb }) => {
      await page.route('#/locs');
      const before = await page.value('tkCounts()');
      await page.value(`(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const d=document.querySelector('details.split[data-a="x"]');d.open=true;await w(150);
        for(let i=0;i<2;i++){document.querySelector('details.split[data-a="x"] .xadd').click();await w(150);if(KB.o)KB.close();}})()`);
      const pid = JSON.stringify(species);
      if (dvkb) {
        // the in-page keyboard: the place with capitals, then a species from the strip and failed
        await page.value(`(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),key=c=>document.querySelector('.kb .k[data-c="'+c+'"]').click();
          document.querySelectorAll('details.split[data-a="x"] .xw')[0].click();await w(80);[...'NEW PLACE'].forEach(key);document.querySelector('.kb [data-a="done"]').click();await w(150);
          document.querySelectorAll('details.split[data-a="x"] .xs')[0].click();await w(80);[...norm(byId[${pid}].n).toUpperCase().slice(0,5)].forEach(key);await w(80);document.querySelector('.kb .kpick[data-id="${species}"]').click();await w(150);
          document.querySelectorAll('details.split[data-a="x"] .xs')[0].click();await w(80);[...'FAIL'].forEach(key);await w(80);document.querySelector('.kb .kpick[data-id="__f"]').click();await w(150);})()`);
      } else {
        await page.value(`(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelectorAll('details.split[data-a="x"] '+s);
          const x=q('.xw')[0];x.value='New Place';x.dispatchEvent(new Event('input'));
          const s=q('.xs')[0];s.value=byId[${pid}].n;s.dispatchEvent(new Event('input'));q('.tk-opt[data-id="${species}"]')[0].click();await w(150);
          const t=q('.xs')[0];t.value='fail';t.dispatchEvent(new Event('input'));q('.tk-opt[data-id="__f"]')[0].click();await w(150);})()`);
      }
      const saved = await page.value(`JSON.parse(localStorage.getItem(LS.track)).x`);
      assert.deepEqual(saved, [{ w: 'New Place', p: nameOf(species) }, { w: '', f: 1 }], 'rows saved by name');
      assert.deepEqual(await page.value('tkCounts()'), [before[0] + 1, before[1] + 1], 'counted in caught / failed');
      assert.equal(await page.value(`caughtFams(-1).has(FAM[${pid}])`), true, 'its species counts for dupes');
      await page.reload();
      await page.route('#/locs');
      assert.deepEqual(await page.value(`TK.x`), [{ w: 'New Place', p: species }, { w: '', f: 1 }], 'kept across a reload');
      assert.match(await page.value(`document.querySelector('details.split[data-a="x"]>summary').textContent`), /Extra\s*·\s*2/, 'the card counts its rows');
      const code = await page.value('tkOut()');
      assert.deepEqual(JSON.parse(code).x, saved, 'in the backup code');
      await page.value(`(async()=>{const d=document.querySelector('details.split[data-a="x"]');d.open=true;await new Promise(r=>setTimeout(r,150));document.querySelectorAll('details.split[data-a="x"] .xdel')[1].click();})()`);
      assert.deepEqual(await page.value(`JSON.parse(localStorage.getItem(LS.track)).x`), [saved[0]], 'removed');
      // an older backup has no x: importing it leaves none; the code from before brings them back
      await page.value(`(()=>{const o=JSON.parse(tkOut());delete o.x;window.prompt=()=>JSON.stringify(o);document.querySelector('.tk-import').click();})()`);
      assert.equal(await page.value('TK.x'), undefined, 'an older backup loads without rows');
      await page.value(`(()=>{window.prompt=()=>${JSON.stringify(code)};document.querySelector('.tk-import').click();})()`);
      assert.equal(await page.value('TK.x.length'), 2, 'the backup brings them back');
      await page.value(`(()=>{window.confirm=()=>true;document.querySelector('.tk-reset').click();})()`);
      assert.equal(await page.value(`JSON.parse(localStorage.getItem(LS.track)).x`), undefined, 'Reset all clears them');
    },
  },
  {
    id: 'e3 old saves',
    title: 'a tracker and open sections saved before the standard load',
    skip, sizes: SIZE_SMALL, modes: ['normal'],
    run: async page => {
      const a = BIG, k0 = AR[a].es[0].k, f0 = AR[a].es[0].g[0].f || '';
      const old = { s: '', pl: '', e: { [a]: { p: nameOf(species) } }, t: {} };
      await page.value(`(()=>{localStorage.setItem(LS.track,${JSON.stringify(JSON.stringify(old))});
        localStorage.setItem(LS.loc,JSON.stringify({o:{},x:{},s:{'${a}.0.${NAMES[k0]}':1,'${a}.0.Other':1}}));})()`);
      await page.reload();
      await page.route('#/locs');
      assert.deepEqual(await page.value('[TK.e,TK.x??null]'), [{ [a]: { p: species } }, null], 'the old tracker loads unchanged');
      const lo = await page.value(`JSON.parse(localStorage.getItem(LS.loc))`);
      assert.deepEqual(lo.s, { [`${a}|${f0}|${k0}`]: 1 }, 'old section names move to codes; others drop');
      assert.equal(lo.ev, 2, 'migrated once');
      await page.value(openCard(a));
      assert.equal(await page.value(`document.querySelector('details.sec[data-s="${a}|${f0}|${k0}"]').open`), true, 'that section opens');
    },
  },
];

await runChecks({ name: 'encounters', file, checks });

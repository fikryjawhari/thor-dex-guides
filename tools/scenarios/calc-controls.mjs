// Calc controls: spec checks 2 (tap to attack), 3 (cap box), 4 (trainer stepping), 5 (trainer sheet), 6 (speed and stages),
// 7 (HP workflow), 8 (crit per move), 9 (multi-hit), 10 (move swap), 11 (Mega), 13 (custom set), 16 (unknown set),
// 23 (per-slot crit). Each check runs at 260 x 316 in normal and dvkb mode. Without cfg.calc: skip.
import assert from 'node:assert/strict';
import { attackerCrit, attackerRows, attackerSide, calcState, changeMove, EI_TRAINERS, fixturePatches, guideArg, openSlot, pickCell, prepareGuide, readGuide, runChecks, setupCalc, spinCap, touchBox } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-controls', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-controls: no cfg.calc');
  process.exit(0);
}
const DATA = readGuide(file).data;
const moveIndex = name => DATA.M.indexOf(name);

const checks = [
  {
    id: '2 tap to attack',
    title: 'tap a card (not a control) to attack with it; Lv, HP, Edit and M leave the attacker alone',
    run: async page => {
      await setupCalc(page, { mine: ['party', 0] });
      assert.equal((await calcState(page)).dir, 'out', 'Mine attacks to start');
      await page.tap('.dmatch .cc[data-s="foe"] .cl > span');
      assert.equal(await attackerSide(page), 'foe', 'the foe card is the attacker after a tap on its label');
      assert.equal((await calcState(page)).dir, 'in');
      assert(await page.count('.dres:not(.na) .mr:not(.em)') > 0, "the foe's moves are listed");
      await page.tap('.dmatch .cc[data-s="mine"] .cn');
      assert.equal(await attackerSide(page), 'mine', "Mine's name makes Mine attack again");
      await touchBox(page, '[data-lv="mine"]');
      assert.equal(await attackerSide(page), 'mine', 'Lv leaves the attacker alone');
      await touchBox(page, '[data-hp="mine"]');
      assert.equal(await attackerSide(page), 'mine', 'HP leaves the attacker alone');
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      assert.equal(await attackerSide(page), 'mine', 'Edit leaves the attacker alone');
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      await page.tap('.dmatch .cc[data-s="mine"] .mg[data-a="mega"]');
      assert.equal(await attackerSide(page), 'mine', 'M leaves the attacker alone (Garchomp has a Mega)');
      await page.tap('.dmatch .cc[data-s="mine"] .mg[data-a="mega"]');
    },
  },
  {
    id: '3 cap box',
    title: "cap box steps the trainer's levels; clearing returns the default in grey; the trainer card shows it",
    run: async page => {
      await setupCalc(page, { trainer: EI_TRAINERS.gardenia });
      const cap = () => page.value(`document.querySelector('[data-cap="1.0.0"]').value`);
      const foeLv = () => page.value(`+document.querySelector('.dmatch .cc[data-s="foe"] [data-lv="foe"]').value`);
      const strip = () => page.value(`[...document.querySelectorAll('.dside:not(.mg) .dstrip button span')].map(s=>+s.textContent)`);
      assert.equal(await cap(), '34', 'the default cap');
      assert.equal(await page.count('.dcap.own'), 0, "the default is not the user's own");
      const levels = await strip();
      const foeStart = await foeLv();
      const resultsStart = await attackerRows(page);
      await spinCap(page, +1);
      assert.equal(await cap(), '35', 'one step up');
      assert.equal(await page.count('.dcap.own'), 1, "the user's value is in the accent colour");
      const relative = DATA.TR.g.flatMap(group => group.sec.flatMap(section => section.tr)).find(t => t.k === EI_TRAINERS.gardenia).p.map(mon => mon.l == null);
      const after = await strip();
      after.forEach((level, index) => assert.equal(level - levels[index], relative[index] ? 1 : 0, `strip level ${index} (relative: ${relative[index]})`));
      assert.equal(await foeLv(), foeStart + 1, "the selected foe's level follows");
      assert.notDeepEqual(await attackerRows(page), resultsStart, 'the results follow');
      await page.route('#/tr/1.0.0');
      assert.equal(await page.value(`document.querySelector('.capin').value`), '35', 'the trainer card shows 35');
      await page.route('#/calc');
      await page.settle();
      await spinCap(page, -1);
      assert.equal(await cap(), '34', 'one step back down');
      await page.setBox('[data-cap="1.0.0"]', '');
      assert.equal(await cap(), '34', 'clearing returns the default');
      assert.equal(await page.count('.dcap.own'), 0, 'grey again');
      assert.equal(await foeLv(), foeStart, "the foe's level goes back");
    },
  },
  {
    id: '4 trainer stepping',
    title: '‹ and › step through the trainers, select the first Pokémon, and disable at the ends',
    run: async page => {
      await setupCalc(page, { save: null, mine: null, trainer: null });
      // The trainers in the calc's order (TRS, minus the rival rows the Trainers page hides)
      const order = await page.value('TRS.filter(t=>!rivalHidden(t)).map(t=>t.k)');
      assert(order.length > 2, 'trainers in the guide');
      await page.value(`CALC.enter(${JSON.stringify(order[0])},0)`);
      await page.settle();
      assert.equal(await page.value(`document.querySelector('.fbar .nav[aria-label="Previous trainer"]').disabled`), true, '‹ is disabled at the first trainer');
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 2 });
      assert.equal((await calcState(page)).foe.i, 2, 'a team member picked');
      await page.tap('.fbar .nav[aria-label="Next trainer"]');
      const next = await calcState(page);
      assert.equal(next.foe.k, order[1], 'next trainer');
      assert.equal(next.foe.i, 0, '› selects the first Pokémon');
      await page.tap('.fbar .nav[aria-label="Previous trainer"]');
      assert.equal((await calcState(page)).foe.k, order[0], '‹ goes back');
      await page.value(`CALC.enter(${JSON.stringify(order.at(-1))},0)`);
      await page.settle();
      assert.equal(await page.value(`document.querySelector('.fbar .nav[aria-label="Next trainer"]').disabled`), true, '› is disabled at the last trainer');
      await page.tap('.fbar .nav[aria-label="Previous trainer"]');
      assert.equal((await calcState(page)).foe.k, order.at(-2), '‹ from the last trainer');
    },
  },
  {
    id: '5 trainer sheet',
    title: 'trainer sheet: full name under Find, a pick in a split closes it, Recent holds six, newest first',
    run: async page => {
      await setupCalc(page, { save: null, mine: null, trainer: EI_TRAINERS.candice });
      const groupRow = g => `.sheet details.grp:nth-of-type(${g + 1}) .gb .mrow[data-s="pickfoe"]`;
      const pickFromGroup = async g => {
        await page.tap('.fbar .dsrc');
        assert.equal(await page.count('#sheets .sheet'), 1, 'the sheet opens');
        await page.tap(`.sheet details.grp:nth-of-type(${g + 1}) > summary`);
        const key = await page.value(`document.querySelector(${JSON.stringify(groupRow(g))}).dataset.k`);
        await page.tap(groupRow(g));
        return key;
      };
      await page.tap('.fbar .dsrc');
      assert.equal(await page.count('#sheets .sheet'), 1, 'the sheet opens');
      assert.equal(await page.text('.sheet .fbtn'), 'Find trainer…');
      assert.equal(await page.text('.sheet .mrow.sel b'), 'Candice', 'the selected trainer in full');
      await page.value(`document.querySelector('.sheet .fbtn').scrollIntoView()`);
      // close without a pick, then the real picks
      await page.tap('.sheet .bk');
      const picks = [];
      for (let group = 1; group <= 7; group++) {
        const key = await pickFromGroup(group);
        assert.equal(await page.count('#sheets .sheet'), 0, 'the sheet closes on a pick');
        assert.equal((await calcState(page)).foe.k, key, 'the picked trainer is the foe');
        assert.equal((await calcState(page)).recent[0], key, 'Recent lists it first');
        picks.push(key);
      }
      assert.equal(new Set(picks).size, picks.length, 'seven different trainers');
      const recent = (await calcState(page)).recent;
      assert.equal(recent.length, 6, 'Recent holds six');
      assert.deepEqual(recent, picks.slice(-6).reverse(), 'newest first');
    },
  },
  {
    id: '6 speed and stages',
    title: 'Spe with stages (+ and − modes), 0 clears; the faster side is accent; paralysis halves the shown value',
    run: async page => {
      await setupCalc(page);
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      const base = await page.value(`(()=>{const row=[...document.querySelectorAll('.cc[data-s="mine"] .ed tr')].find(tr=>tr.querySelector('td.l')?.textContent.trim()==='Stat');return +row.querySelector('td:last-child').textContent;})()`);
      const shown = () => page.value(`document.querySelector('.dmatch .cc[data-s="mine"] .sp i').textContent.trim()`);
      assert.equal(await shown(), String(base), 'unstaged Spe is the stat');
      await page.tap('.cc[data-s="mine"] .ed .sc[data-x="4"]');
      await page.tap('.cc[data-s="mine"] .ed .sc[data-x="4"]');
      assert.equal(await shown(), `${Math.floor(base * 2)}↑`, '+ twice: double, with ↑');
      assert.equal(await page.count('.ed'), 1, 'nothing else opened');
      await page.tap('.cc[data-s="mine"] .ed .sm[data-a="smode"]');
      assert.equal(await page.text('.cc[data-s="mine"] .ed .sm'), '−', '− mode');
      await page.tap('.cc[data-s="mine"] .ed .sc[data-x="4"]');
      assert.equal(await shown(), `${Math.floor(base * 1.5)}↑`, '− once: stage +1, ×1.5');
      await page.tap('.cc[data-s="mine"] .ed .z[data-a="sreset"]');
      assert.equal(await shown(), String(base), '0 clears the stages');
      assert.equal(await page.count('.dmatch .cc[data-s="mine"] .sp i.f'), 1, 'the faster side is accent-coloured');
      assert.equal(await page.count('.dmatch .cc[data-s="foe"] .sp i.f'), 0, 'and the slower side is not');
      await page.value(`(()=>{const s=document.querySelector('.cc[data-s="mine"] select[data-e="status"]');s.value='par';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await page.settle();
      const paralysed = await shown();
      const hook = await page.value('typeof window.DMG.speed');
      assert.equal(paralysed, String(Math.floor(base / 2)), `paralysis halves the shown value (got ${paralysed}, base ${base}; window.DMG.speed is ${hook})`);
    },
  },
  {
    id: '7 HP workflow',
    title: 'HP −min takes that damage off the defender and recomputes; HP label refills; 0 HP says fainted',
    run: async page => {
      await setupCalc(page);
      const hpOf = () => page.value(`+document.querySelector('[data-hp="foe"]').value`);
      const maxOf = () => page.value(`+document.querySelector('.dmatch .cc[data-s="foe"] .mx').textContent.replace('/','')`);
      await page.tap('.dres:not(.na) .mr:not(.em) .mm', { index: 0 });
      const minTotal = await page.value(`+document.querySelector('.dres:not(.na) .mr.open .ab [data-a="sub"]').dataset.v`);
      const before = await hpOf();
      const koBefore = await attackerRows(page);
      await page.tap('.dres:not(.na) .mr.open .ab [data-a="sub"]', { index: 0 });
      const after = await hpOf();
      assert.equal(after, Math.max(0, before - minTotal), `defender HP ${before} − ${minTotal}`);
      const koAfter = await attackerRows(page);
      assert.notDeepEqual(koAfter.map(r => r.ko), koBefore.map(r => r.ko), 'the KO text recomputes against the new HP');
      assert(await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr .dd div')].some(d=>d.textContent.includes('vs ${after}/'))`), `rows say vs ${after}/max`);
      await page.tap('.hpl[data-s="foe"]');
      assert.equal(await hpOf(), await maxOf(), 'the HP label refills');
      await page.setBox('[data-hp="foe"]', 0);
      const live = (await attackerRows(page)).filter(r => r.ko);
      assert(live.length > 0, 'some rows have a KO text');
      live.forEach(r => assert.equal(r.ko, 'fainted', `${r.name}: ${r.ko}`));
    },
  },
  {
    id: '8 crit per move',
    title: 'C toggles one row (≈×1.5); a screen on the defender halves the non-crit rows, not the crit row',
    run: async page => {
      await setupCalc(page);
      const before = await attackerRows(page);
      await page.tap('.dres:not(.na) .rc', { index: 3 });
      assert.deepEqual(await attackerCrit(page), ['false', 'false', 'false', 'true'], 'only that row is pressed');
      const crit = await attackerRows(page);
      crit.forEach((row, i) => { if (i !== 3) assert.equal(row.hp, before[i].hp, `${row.name} changed`); });
      const range = s => s.split('–').map(Number);
      const [lo, hi] = range(before[3].hp), [clo, chi] = range(crit[3].hp);
      assert(clo / lo > 1.4 && clo / lo < 1.6 && chi / hi > 1.4 && chi / hi < 1.6, `crit ${crit[3].hp} vs ${before[3].hp}: want about ×1.5`);
      await page.tap('.dres:not(.na) .rc', { index: 3 });
      assert.deepEqual(await attackerRows(page), before, 'toggled off: back to the start');
      await page.tap('.dres:not(.na) .rc', { index: 3 });
      await page.tap('.dfield > summary');
      const noScreen = await attackerRows(page);
      await page.tap('.dtg button[data-f="defLightScreen"]');
      const screened = await attackerRows(page);
      assert.equal(screened[0].hp, noScreen[0].hp, 'physical: no change from Light Screen');
      assert.equal(screened[3].hp, noScreen[3].hp, 'the crit row ignores the screen');
      const surf = range(noScreen[2].hp), surfNow = range(screened[2].hp);
      assert(Math.abs(surfNow[1] - surf[1] / 2) <= 1, `Surf (special, no crit) ${screened[2].hp} vs ${noScreen[2].hp}: want about half`);
      await page.tap('.dtg button[data-f="defLightScreen"]');
      assert.deepEqual(await attackerRows(page), noScreen, 'screen off: back to the start');
    },
  },
  {
    id: '9 multi-hit',
    title: 'Icicle Spear includes one hit; total damage, % and KO scale with the count',
    run: async page => {
      await setupCalc(page);
      const label = () => page.value(`document.querySelector('.dres:not(.na) .rh').textContent.trim()`);
      assert.equal(await label(), '×3', 'default three hits');
      const seen = [];
      for (let i = 0; i < 8; i++) {
        await page.tap('.dres:not(.na) .rh');
        seen.push(+(await label()).slice(1));
      }
      assert.deepEqual(seen, [4, 5, 1, 2, 3, 4, 5, 1], 'one-hit inspection plus normal counts, wrapping from 3');
      const byCount = {};
      for (const n of [2, 3, 4, 5]) {
        while (+(await label()).slice(1) !== n) await page.tap('.dres:not(.na) .rh');
        byCount[n] = (await attackerRows(page))[0];
      }
      const perHit = Object.entries(byCount).map(([count,row]) => row.hp.split('–').map(value=>Number(value)/Number(count)).join('–'));
      assert(perHit.every(hp => hp === perHit[0]), `total damage divided by count stays constant: ${perHit}`);
      const percentPerHit = n => +byCount[n].pct.match(/–([\d.]+)%/)[1] / n;
      assert(Math.abs(percentPerHit(2) - percentPerHit(5)) < 0.2, `% per hit should not depend on the count: ${[2, 3, 4, 5].map(percentPerHit).map(x => x.toFixed(2))}`);
      const uses = n => { const ko = byCount[n].ko; return ko.startsWith('OHKO') ? 1 : ko.startsWith('5+') ? 5 : +ko.match(/^(\d)HKO/)[1]; };
      assert(uses(5) <= uses(3) && uses(3) <= uses(2), `KO uses by hit count: 2=${uses(2)} 3=${uses(3)} 5=${uses(5)}`);
    },
  },
  {
    id: '10 move swap',
    title: 'Change move, power and type edits recompute, Reset power / type clears them, + Move fills a three-move slot',
    run: async page => {
      await setupCalc(page, { mine: ['party', 0] });
      await changeMove(page, 0, 'Earthquake');
      assert.equal((await attackerRows(page))[0].name, 'Earthquake', 'slot 0 changed');
      const eq = (await attackerRows(page))[0];
      await page.setBox(`[data-mo="bp"][data-mi="${moveIndex('Earthquake')}"]`, 150);
      const boosted = (await attackerRows(page))[0];
      assert.notEqual(boosted.hp, eq.hp, 'power recomputes');
      await page.value(`(()=>{const s=document.querySelector('select[data-mo="t"][data-mi="${moveIndex('Earthquake')}"]');s.value='Water';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await page.settle();
      assert.notEqual((await attackerRows(page))[0].hp, boosted.hp, 'type recomputes');
      assert.equal(await page.count('[data-a="mvreset"]'), 1, 'Reset power / type appears');
      await page.tap('[data-a="mvreset"]');
      assert.equal((await attackerRows(page))[0].hp, eq.hp, 'Reset power / type clears the edits');
      assert.equal(await page.count('[data-a="mvreset"]'), 0, 'and the button goes');
      await openSlot(page, 3);
      await page.tap('.dres:not(.na) [data-a="chmv"][data-slot="3"]');
      await page.tap('.mrow[data-n="1"]');
      assert.equal(await page.count('.dres:not(.na) .mr:not(.em)'), 3, 'three moves now');
      await page.tap('[data-a="addmv"][data-slot="3"]');
      await page.typeSearch('Ice Beam');
      await page.tap('.mrow[data-i="0"]');
      const names = (await attackerRows(page)).map(r => r.name);
      assert.equal(names.length, 4, `four moves after + Move (${names})`);
      assert.equal(names[3], 'Ice Beam', '+ Move fills the fourth slot');
    },
  },
  {
    id: '11 Mega',
    title: 'M on Garchomp: name, stats and ability change; M again restores; Save persists over a reload; Original goes back',
    run: async page => {
      await setupCalc(page, { mine: ['party', 0] });
      const name = () => page.value(`document.querySelector('.dmatch .cc[data-s="mine"] .cn b').textContent.trim()`);
      const spe = () => page.value(`document.querySelector('.dmatch .cc[data-s="mine"] .sp i').textContent.trim()`);
      // the stat row and the ability sit in the Edit dropdown, so open it first
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      const stats = () => page.value(`[...document.querySelectorAll('.cc[data-s="mine"] .ed tr')].find(tr=>tr.querySelector('td.l')?.textContent.trim()==='Stat').textContent.replace(/\\s+/g,' ').trim()`);
      const ability = () => page.value(`document.querySelector('select[data-e="ab"][data-s="mine"]').selectedOptions[0].textContent.trim()`);
      const base = { spe: await spe(), stats: await stats(), ability: await ability() };
      assert.equal(await name(), 'Garchomp');
      await page.tap('.dmatch .cc[data-s="mine"] .mg[data-a="mega"]');
      assert.equal(await name(), 'Mega Garchomp *', 'the Mega name, unsaved');
      assert.notEqual(await stats(), base.stats, 'the stats change');
      assert.notEqual(await ability(), base.ability, 'the ability changes');
      // EI's data gives Mega Garchomp the base Speed (102), so Speed can't show the change here: noted, not asserted
      console.log(`     note: Mega Garchomp Spe ${await spe()} (base ${base.spe}) in this data`);
      await page.tap('.dmatch .cc[data-s="mine"] .mg[data-a="mega"]');
      assert.equal(await name(), 'Garchomp *', 'M again restores the base');
      assert.equal(await stats(), base.stats, 'the base stats are back');
      assert.equal(await ability(), base.ability, 'and the base ability');
      await page.tap('.dmatch .cc[data-s="mine"] .mg[data-a="mega"]');
      await page.tap('[data-a="esave"][data-s="mine"]');
      assert.equal(await name(), 'Mega Garchomp •', 'saved');
      await page.reload();
      assert.equal(await name(), 'Mega Garchomp •', 'the Mega persists across a reload');
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="eopen"]');
      await page.tap('[data-a="ereset"][data-s="mine"]');
      assert.equal(await name(), 'Garchomp', 'Original: back to base');
    },
  },
  {
    id: '13 custom set',
    title: '+ New: species selected, Edit open, four default moves, dashed cell; Delete selects the first party Pokémon',
    run: async page => {
      await setupCalc(page, { mine: null });
      await page.tap('[data-a="newmon"]');
      await page.typeSearch('Pikachu');
      await page.tap('.mrow[data-i="0"]');
      const s = await calcState(page);
      assert.equal(s.mine.src, 'custom', 'selected');
      assert.equal(s.custom.length, 1);
      assert.equal(s.custom[0].l, 15, "level is the foe's cap (Candice 15)");
      assert.equal(s.custom[0].na, 'Hardy');
      assert.equal(s.custom[0].i, '');
      assert.deepEqual(s.custom[0].iv, [31, 31, 31, 31, 31, 31]);
      assert.deepEqual(s.custom[0].ev, [0, 0, 0, 0, 0, 0]);
      assert.equal(await page.count('.dmatch .cc[data-s="mine"] .ed'), 1, 'Edit is open');
      assert.equal(await page.count('.dres:not(.na) .mr:not(.em)'), 4, 'four default moves');
      assert.equal(await page.value(`getComputedStyle(document.querySelector('.mg .dstrip button.cu')).borderTopStyle`), 'dashed', 'a dashed cell');
      await page.tap('[data-a="edel"]');
      const after = await calcState(page);
      assert.equal(after.custom.length, 0, 'deleted');
      assert.deepEqual(after.mine, { src: 'party', b: 0, i: 0 }, 'the first party Pokémon is selected');
    },
  },
  {
    id: '16 unknown set',
    title: 'a sheet-only trainer: its first Pokémon shows + Move rows when it attacks, and its ability shows ?',
    run: async page => {
      await setupCalc(page, { trainer: EI_TRAINERS.sheetOnly });
      await page.tap('.dmatch .cc[data-s="foe"] [data-a="eopen"]');
      const ability = await page.value(`document.querySelector('select[data-e="ab"][data-s="foe"] option:checked').textContent`);
      assert(ability.endsWith(' ?'), `ability shows "${ability}"`);
      await page.tap('.dmatch .cc[data-s="foe"] .cl > span');
      const slots = await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr.em .mm')].map(m=>m.textContent.replace(/\\s+/g,' ').trim())`);
      assert.equal(slots.length, 4, `four slots show + Move when it attacks (${JSON.stringify(slots)})`);
      assert(slots[0].includes('No moves listed'), `first slot says "${slots[0]}"`);
      slots.slice(1).forEach(text => assert.equal(text, '+ Move'));
    },
  },
  {
    id: '23 per-slot crit',
    title: 'crit is per Pokémon and slot: the same move on another Pokémon is unaffected; changing the slot move clears it',
    run: async page => {
      await setupCalc(page, { mine: ['party', 0] });
      await changeMove(page, 0, 'Earthquake');
      await pickCell(page, 'party', 5);
      await changeMove(page, 1, 'Earthquake');
      await page.tap('.dres:not(.na) .rc', { index: 1 });
      assert.deepEqual(await attackerCrit(page), ['false', 'true', 'false', 'false'], "Cloyster's Earthquake crit is on");
      await pickCell(page, 'party', 0);
      assert.equal((await attackerRows(page))[0].name, 'Earthquake', 'Garchomp slot 0 is Earthquake too');
      assert.equal((await attackerCrit(page))[0], 'false', 'the same move on another Pokémon is unaffected');
      await page.tap('.dres:not(.na) .rc', { index: 0 });
      assert.equal((await attackerCrit(page))[0], 'true', "crit on for Garchomp's Earthquake");
      await changeMove(page, 0, 'Ice Punch');
      assert.equal((await attackerRows(page))[0].name, 'Ice Punch');
      assert.equal((await attackerCrit(page))[0], 'false', "changing the slot's move clears its crit");
      await changeMove(page, 0, 'Earthquake');
      assert.equal((await attackerCrit(page))[0], 'false', 'and Earthquake again: still off');
    },
  },
];

await runChecks({ name: 'calc-controls', file, checks });

// Calc hidden without data: spec check 24. A guide whose hack.json has no cfg.calc (Hardlove Gold, for one) has five rail
// tabs, #/calc lands on the Pokémon page, and no Calc vs / Use in calc buttons. A guide with cfg.calc (Emerald Imperium)
// gets the other half: the Calc tab, the page, and both buttons. Both at 260 x 316 in normal and dvkb mode.
// The guide runs as built (no copy). Usage: node tools/scenarios/calc-hidden.mjs [guide.html]
import assert from 'node:assert/strict';
import { basename } from 'node:path';
import { guideArg, readGuide, runChecks, SIZE_SMALL } from '../calc_check_lib.mjs';

const guide = guideArg(process.argv, 'dist/hardlove-gold.html');
const data = readGuide(guide).data;
const trainerKey = data.TR.g[0].sec[0].tr[0].k;
const speciesId = String(data.P[0].id);
const railHrefs = page => page.value(`[...document.querySelectorAll('#rail a[href^="#/"]')].map(a=>a.getAttribute('href'))`);
// The rendered page (#app): the script text inlined in the body also contains these words.
const bodyHas = (page, text) => page.value(`document.getElementById('app').textContent.includes(${JSON.stringify(text)})`);

const hidden = {
  id: '24 hidden without data',
  title: 'no cfg.calc: five rail tabs; #/calc lands on the Pokémon page; no Calc vs / Use in calc',
  sizes: SIZE_SMALL,
  run: async page => {
    assert.deepEqual(await railHrefs(page), ['#/', '#/locs', '#/trainers', '#/items', '#/walk'], 'five rail tabs');
    await page.route('#/calc');
    assert.equal(await page.value('location.hash'), '#/', '#/calc lands on the Pokémon page');
    assert.equal(await page.value('document.body.dataset.v'), '', 'the Pokémon list is the route');
    assert.equal(await page.value(`document.getElementById('t-p').classList.contains('on')`), true, 'the Pokémon tab is on');
    assert.equal(await page.value('typeof window.CALC'), 'undefined', 'the calc page is not in the guide');
    await page.route(`#/tr/${trainerKey}`);
    assert.equal(await page.count('.calc-versus'), 0, 'no Calc vs button on a trainer card');
    assert.equal(await bodyHas(page, 'Calc vs'), false, 'no Calc vs text');
    await page.route(`#/p/${speciesId}`);
    assert.equal(await page.count('.calc-use'), 0, 'no Use in calc button on a Pokémon page');
    assert.equal(await bodyHas(page, 'Use in calc'), false, 'no Use in calc text');
  },
};

const shown = {
  id: '24 shown with data',
  title: 'cfg.calc present: the Calc tab, #/calc renders the calc page, and both entry buttons are there',
  sizes: SIZE_SMALL,
  run: async page => {
    assert.deepEqual(await railHrefs(page), ['#/', '#/locs', '#/trainers', '#/items', '#/walk', '#/calc'], 'six rail tabs, Calc last');
    await page.route('#/calc');
    assert.equal(await page.value('location.hash'), '#/calc');
    assert.equal(await page.count('.fit'), 1, 'the calc page renders');
    assert.equal(await page.value(`document.getElementById('t-c').classList.contains('on')`), true, 'the Calc tab is on');
    await page.route(`#/tr/${trainerKey}`);
    assert(await page.count('.calc-versus') > 0, 'Calc vs buttons on a trainer card');
    await page.route(`#/p/${speciesId}`);
    assert.equal(await page.count('.calc-use'), 1, 'Use in calc on a Pokémon page');
  },
};

await runChecks({ name: 'calc-hidden-' + basename(guide, '.html'), file: guide, checks: [data.cfg.calc ? shown : hidden], expectTrainers: false });

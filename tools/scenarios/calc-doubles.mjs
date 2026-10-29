// Auto Doubles (template/README.md → Auto Doubles): a trainer's doubles evidence (tools/trainer_fields.py:
// a `gameType: Doubles` effect on a trainer-tag / trainer-partner field record) makes S / D automatic. Per guide: the
// count of trainers with the evidence; a doubles trainer opens in D (dashed, no A mark, tooltip and Area line name the tag),
// a singles one in S; tapping the trainer's own format is Auto; a manual S survives a move / HP change and is cleared by Reset fight, Field's Auto and the next
// trainer; Hardlove "Back2Back" (no Double tag) and Eternal X "Rotation Battle" stay S; the partner record names
// "partner". 260 x 316, normal and dvkb. Usage: node tools/scenarios/calc-doubles.mjs [dist/<hack>.html]
import assert from 'node:assert/strict';
import { changeMove, fixturePatches, guide, guideArg, prepareGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-doubles', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-doubles: no cfg.calc');
  process.exit(0);
}

const EXPECTED = { 'blaze-black-2-redux': null, 'emerald-imperium': 14, 'hardlove-gold': 92, 'photonic-sun': 60, 'eternal-x': 62 };
const all = () => guide().data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr));
const doublesRecord = trainer => (trainer.field || []).find(record => !record.label && (record.effects || []).some(effect => effect.kind === 'gameType' && effect.value === 'Doubles'));
const sourceOf = trainer => { const record = doublesRecord(trainer); return record.effects.find(effect => effect.kind === 'gameType').source || record.text; };
const known = () => new Set(guide().data.P.map(entry => String(entry.id)));
const usable = trainer => trainer.p.length > 0 && trainer.p.every(mon => known().has(String(mon.id)) && mon.m?.length);
const doublesTrainers = () => all().filter(trainer => doublesRecord(trainer) && usable(trainer));

const format = page => page.value('(()=>{const s=CALC.state();return {format:s.field.gameType||"Singles",manual:s.fman.includes("gameType")};})()');
const buttons = page => page.value(`[...document.querySelectorAll('.dfight [data-f="gameType"]')].map(b=>({v:b.dataset.value,pressed:b.getAttribute('aria-pressed'),auto:b.classList.contains('dauto'),a:!!b.querySelector('sup'),title:b.title}))`);
const openField = async page => {
  if (!(await page.value(`document.querySelector('.dfield').open`))) await page.tap('.dfield > summary');
};
const doublesEntries = () => (guide().data.cfg.calc.field || []).filter(entry => entry.doubles && entry.type !== 'select').map(entry => entry.k);
async function expectAuto(page, trainer, label) {
  assert.deepEqual(await format(page), { format: 'Doubles', manual: false }, label + ': opens in D (auto)');
  const [single, double] = await buttons(page);
  assert.equal(double.pressed, 'true', label + ': D pressed');
  assert.ok(double.auto && !double.a, label + ': D dashed, no A mark');
  assert.equal(double.title, 'Auto: ' + sourceOf(trainer), label + ': the tooltip names the tag');
  assert.ok(!single.auto && single.pressed === 'false', label + ': S plain');
}
async function expectSingles(page, label, manual = false) {
  assert.deepEqual(await format(page), { format: 'Singles', manual }, label + ': S' + (manual ? ' (manual)' : ' (auto)'));
  const [single, double] = await buttons(page);
  assert.equal(single.pressed, 'true', label + ': S pressed');
  assert.ok(!double.auto && !double.a && double.pressed === 'false', label + ': D plain');
}
const enter = (page, trainer) => page.value(`CALC.enter(${JSON.stringify(trainer.k)},0)`).then(() => page.settle());

const checks = [
  {
    id: 'doubles evidence',
    title: "the guide's count of trainers with doubles evidence; the role trainers other checks use are singles",
    modes: ['normal'],
    fit: false,
    run: async () => {
      const count = all().filter(doublesRecord).length;
      assert.equal(typeof EXPECTED[guide().name], 'number', `TODO: audit ${guide().name} doubles EXPECTED count`);
      assert.equal(count, EXPECTED[guide().name], `${guide().name}: ${count} trainers with doubles evidence`);
      for (const [role, trainer] of Object.entries(guide().trainers)) if (trainer) assert.ok(!doublesRecord(all().find(other => other.k === trainer.k)), `${role} trainer ${trainer.k} is singles`);
      if (guide().name === 'hardlove-gold') {
        const back = all().filter(trainer => (trainer.tags || []).some(tag => /^Back2Back/.test(tag)) && !(trainer.tags || []).some(tag => /Double/.test(tag)));
        assert.ok(back.length, 'Back2Back trainers exist');
        assert.ok(back.every(trainer => !doublesRecord(trainer)), 'Back2Back without a Double tag: no evidence');
      }
      if (guide().name === 'eternal-x') {
        const rotation = all().filter(trainer => (trainer.tags || []).includes('Rotation Battle'));
        assert.ok(rotation.length, 'Rotation Battle trainers exist');
        assert.ok(rotation.every(trainer => !doublesRecord(trainer)), 'Rotation Battle: no evidence');
      }
    },
  },
  {
    id: 'auto doubles',
    title: 'doubles trainer opens in D (auto), singles in S; manual S survives move / HP, cleared by Reset fight, Auto and the next trainer',
    run: async page => {
      await setupCalc(page);
      await expectSingles(page, 'singles trainer');
      const [first, second] = doublesTrainers();
      assert.ok(first && second, 'two usable doubles trainers');
      await enter(page, first);
      await expectAuto(page, first, first.k);
      await openField(page);
      const extra = doublesEntries();
      if (extra.length) assert.ok((await page.count(extra.map(k => `.dtg [data-f="${k}"]`).join(','))) > 0, 'the Doubles-only Field entries are drawn');
      const area = await page.value(`[...document.querySelectorAll('.dfarea [data-a="areainfo"]')].map(b=>b.textContent)`);
      assert.ok(area.includes(sourceOf(first)), `the Area line names the tag: ${area}`);
      assert.ok(!area.includes('Doubles'), `not the value: ${area}`);
      assert.match(await page.text('.dfsource'), new RegExp('Doubles: ' + sourceOf(first).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

      await page.tap('.dfight [data-f="gameType"][data-value="Singles"]');
      await expectSingles(page, 'tapped S', true);
      if (extra.length) assert.equal(await page.count(extra.map(k => `.dtg [data-f="${k}"]`).join(',')), 0, 'Doubles-only entries gone in S');
      assert.match(await page.text('.dfsource'), /Format set by you \(auto: Doubles\)/);
      await page.setBox('[data-hp="foe"]', 1);
      await expectSingles(page, 'after an HP change', true);
      await changeMove(page, 0, 'Ice Beam');
      await expectSingles(page, 'after a move change', true);

      await page.tap('[data-a="fightreset"]');
      await expectAuto(page, first, 'Reset fight');
      await page.tap('.dfight [data-f="gameType"][data-value="Singles"]');
      await openField(page);
      await page.tap('[data-a="fieldauto"]');
      await expectAuto(page, first, 'Field Auto');

      await page.tap('.dfight [data-f="gameType"][data-value="Singles"]');
      await enter(page, second);
      await expectAuto(page, second, 'next trainer (doubles)');
      await page.reload();
      await expectAuto(page, second, 'after a reload');
      await page.tap('.dfight [data-f="gameType"][data-value="Singles"]');
      await page.tap('.dfight [data-f="gameType"][data-value="Doubles"]');
      await expectAuto(page, second, "tapping the trainer's own format goes back to Auto");
      await enter(page, all().find(trainer => trainer.k === guide().trainers.four.k));
      await expectSingles(page, 'next trainer (singles)');
      await page.tap('.dfight [data-f="gameType"][data-value="Singles"]');
      await expectSingles(page, "tapping S on a singles trainer stays Auto");
      assert.equal(await page.count('.dfsource [data-a="fieldauto"]'), 0, 'no Auto button for it');
      await page.tap('.dfight [data-f="gameType"][data-value="Doubles"]');
      assert.deepEqual(await format(page), { format: 'Doubles', manual: true }, 'tapping D on a singles trainer is manual');
      await enter(page, all().find(trainer => trainer.k === guide().trainers.six?.k || trainer.k === guide().trainers.relative?.k));
      await expectSingles(page, 'next trainer (singles) clears a manual D');
    },
  },
  {
    id: 'stays singles',
    title: 'Hardlove Back2Back and Eternal X Rotation Battle open in S; the partner record names "partner"',
    skip: ['hardlove-gold', 'eternal-x'].includes(guide().name) ? null : 'no Back2Back / Rotation trainers',
    run: async page => {
      await setupCalc(page);
      const tagged = test => all().find(trainer => usable(trainer) && (trainer.tags || []).some(test) && !doublesRecord(trainer));
      const trainer = guide().name === 'hardlove-gold' ? tagged(tag => /^Back2Back/.test(tag)) : tagged(tag => tag === 'Rotation Battle');
      assert.ok(trainer, 'a usable Back2Back / Rotation trainer');
      const [first] = doublesTrainers();
      await enter(page, first);
      await expectAuto(page, first, first.k);
      await enter(page, trainer);
      await expectSingles(page, trainer.k + ' ' + trainer.tags.join(', '));
      if (guide().name === 'eternal-x') {
        const partner = all().find(trainer => usable(trainer) && doublesRecord(trainer)?.scope === 'trainer-partner');
        assert.ok(partner, 'a partner trainer');
        await enter(page, partner);
        await expectAuto(page, partner, 'partner ' + partner.k);
        await openField(page);
        const area = await page.value(`[...document.querySelectorAll('.dfarea [data-a="areainfo"]')].map(b=>b.textContent)`);
        assert.ok(area.includes('partner'), `the Area line names the partner: ${area}`);
      }
    },
  },
];

await runChecks({ name: 'calc-doubles', file, checks });

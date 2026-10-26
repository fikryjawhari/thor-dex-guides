// Calc fight state (plans/calc-auto-effects.md, unit C rows of Checks): the scratch lifecycle (battle condition lives
// only while a Pokémon is selected; HP / status / broken are kept; unsaved set edits go on a switch, saved ones stay),
// a trainer change (foe fresh, player HP kept, manual Field overrides cleared), Reset fight (all HP 100 %, statuses
// cleared, same trainer and Pokémon), reload / migration of older storage, and (C2) Mega and foe set edits kept for
// the fight. Default foe: the guide's four-Pokémon trainer (calc_check_lib trainerRoles); 260 x 316, normal and dvkb. Usage: node tools/scenarios/calc-auto.mjs [dist/<hack>.html]
import assert from 'node:assert/strict';
import { fixturePatches, guide, guideArg, pickCell, prepareGuide, runChecks, setupCalc } from '../calc_check_lib.mjs';

const file = prepareGuide(guideArg(process.argv), { tag: 'calc-auto', edit: fixturePatches });
if (!file) {
  console.log('SKIP calc-auto: no cfg.calc');
  process.exit(0);
}

const hpOf = (page, side) => page.value(`+document.querySelector('[data-hp="${side}"]').value`);
const maxOf = (page, side) => page.value(`+document.querySelector('.dmatch .cc[data-s="${side}"] .mx').textContent.replace('/','')`);
const mon = (page, side) => page.value(`(()=>{const m=CALC.mon('${side}');return {na:m.na,hp:m.hp??null,status:m.status||'',stg:(m.stg||[0,0,0,0,0]).join(','),abilityOn:m.abilityOn??null,dl:m.dl??null,pty:m.pty??null,vol:m.vol||'',broken:m.broken??null};})()`);
const nameOf = (page, side) => page.value(`document.querySelector('.dmatch .cc[data-s="${side}"] .cn b').textContent.trim()`);
const rowState = (page, side) => page.value(`(()=>{const k=CALC.key('${side}')+':';return Object.keys(CALC.state().st).filter(ck=>ck.startsWith(k)).length;})()`);
const editorOpen = async (page, side, open) => {
  if (!!(await page.count(`.cc[data-s="${side}"] .ed`)) !== open) await page.tap(`.dmatch .cc[data-s="${side}"] [data-a="eopen"]`);
};
const choose = (page, selector, value) => page.value(`(()=>{const s=document.querySelector(${JSON.stringify(selector)});s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
const otherNature = (page, side) => page.value(`[...document.querySelector('.cc[data-s="${side}"] select[data-e="na"]').options].map(o=>o.value).find(v=>v!==CALC.mon('${side}').na)`);
const openField = async page => {
  if (!(await page.value(`document.querySelector('.dfield').open`))) await page.tap('.dfield > summary');
};
// A manual weather: the first non-empty option
const setWeather = async page => {
  await openField(page);
  const value = await page.value(`[...document.querySelector('select[data-f="weather"]').options].map(o=>o.value).find(v=>v)`);
  await choose(page, 'select[data-f="weather"]', value);
  return value;
};

const checks = [
  {
    id: 'scratch lifecycle',
    title: 'stage / ability box / Download / target / row state reset on switch-back; HP, status and broken kept; unsaved set edit dropped, saved kept',
    run: async page => {
      await setupCalc(page);
      const max = await maxOf(page, 'mine');
      await page.setBox('[data-hp="mine"]', max - 10);
      await editorOpen(page, 'mine', true);
      await choose(page, '.cc[data-s="mine"] select[data-e="status"]', 'par');
      await page.tap('.cc[data-s="mine"] .ed .sc[data-x="0"]');
      const nature = (await mon(page, 'mine')).na, edited = await otherNature(page, 'mine');
      await choose(page, '.cc[data-s="mine"] select[data-e="na"]', edited);
      await choose(page, '.cc[data-s="mine"] select[data-e="vol"]', 'dig');
      // battle state with no control on every guide's card: through the page's own setter
      await page.value(`(()=>{CALC.set('mine','abilityOn',true);CALC.set('mine','dl','atk');CALC.set('mine','broken',true);CALC.state().st[CALC.key('mine')+':0']=1;CALC.render();})()`);
      const before = await mon(page, 'mine');
      assert.deepEqual(before, { na: edited, hp: max - 10, status: 'par', stg: '1,0,0,0,0', abilityOn: true, dl: 'atk', pty: null, vol: 'dig', broken: true });
      assert.ok((await nameOf(page, 'mine')).endsWith('*'), 'the nature is an unsaved edit');
      await pickCell(page, 'party', 0);
      await pickCell(page, 'party', 5);
      assert.deepEqual(await mon(page, 'mine'), { na: nature, hp: max - 10, status: 'par', stg: '0,0,0,0,0', abilityOn: null, dl: null, pty: null, vol: '', broken: true },
        'back fresh: HP, status and broken kept, battle condition and the unsaved nature gone');
      assert.equal(await rowState(page, 'mine'), 0, 'row state gone');
      assert.ok(!(await nameOf(page, 'mine')).endsWith('*'), 'no unsaved mark');
      // Save keeps set edits, never battle condition
      await editorOpen(page, 'mine', true);
      await choose(page, '.cc[data-s="mine"] select[data-e="na"]', edited);
      await page.tap('.cc[data-s="mine"] .ed .sc[data-x="0"]');
      await page.tap('[data-a="esave"][data-s="mine"]');
      const saved = await page.value(`CALC.state().saved[CALC.key('mine')]`);
      assert.deepEqual(Object.keys(saved), ['na'], 'only the set edit is saved: ' + JSON.stringify(saved));
      await pickCell(page, 'party', 0);
      await pickCell(page, 'party', 5);
      const back = await mon(page, 'mine');
      assert.equal(back.na, edited, 'the saved nature stays');
      assert.equal(back.stg, '0,0,0,0,0', 'the stage does not');
      assert.equal(back.hp, max - 10, 'HP still kept');
      assert.ok((await nameOf(page, 'mine')).endsWith('•'), 'saved mark');
      // The foe: HP / status kept for this fight across foe switches, stages fresh
      await editorOpen(page, 'mine', false);
      const foeMax = await maxOf(page, 'foe');
      await page.setBox('[data-hp="foe"]', 1);
      await page.value(`(()=>{CALC.set('foe','status','brn');CALC.set('foe','stg',[0,2,0,0,0]);CALC.render();})()`);
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 0 });
      const foe = await mon(page, 'foe');
      assert.equal(foe.hp, 1, `foe HP kept for the fight (max ${foeMax})`);
      assert.equal(foe.status, 'brn', 'foe status kept');
      assert.equal(foe.stg, '0,0,0,0,0', 'foe stages fresh');
    },
  },
  {
    id: 'trainer change',
    title: 'next trainer: foe team fresh at full HP, slot 1; player HP kept, scratch and broken gone; manual Field overrides cleared, format kept',
    run: async page => {
      await setupCalc(page);
      const max = await maxOf(page, 'mine'), trainer = await page.value('CALC.state().foe.k');
      await page.setBox('[data-hp="mine"]', max - 10);
      await page.setBox('[data-hp="foe"]', 1);
      await page.value(`(()=>{CALC.set('mine','stg',[1,0,0,0,0]);CALC.set('mine','broken',true);CALC.set('foe','status','par');CALC.render();})()`);
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      await page.setBox('[data-hp="foe"]', 2);
      await setWeather(page);
      await page.tap('[data-f="gameType"][data-value="Doubles"]');
      assert.deepEqual(await page.value('CALC.state().fman'), ['weather'], 'the weather is a manual override; the format is not');
      await page.tap('[data-a="tnext"]');
      const state = await page.value('(()=>{const s=CALC.state();return {k:s.foe.k,i:s.foe.i,weather:s.field.weather??null,format:s.field.gameType??null,fman:s.fman,foeEdits:Object.keys(s.edits).filter(k=>k.startsWith("foe:"))};})()');
      assert.notEqual(state.k, trainer, 'another trainer');
      assert.equal(state.i, 0, 'slot 1 selected');
      assert.equal(state.weather, null, 'manual weather cleared');
      assert.equal(state.format, 'Doubles', 'format kept');
      assert.deepEqual(state.fman, [], 'no manual overrides');
      assert.deepEqual(state.foeEdits, [], 'nothing kept for the foe');
      assert.equal(await hpOf(page, 'foe'), await maxOf(page, 'foe'), 'foe at full HP');
      const mine = await mon(page, 'mine');
      assert.equal(mine.hp, max - 10, 'player HP kept');
      assert.equal(mine.stg, '0,0,0,0,0', 'player scratch cleared');
      assert.equal(mine.broken, null, 'broken ends with the fight');
      await page.tap('[data-a="tprev"]');
      assert.equal(await page.value('CALC.state().foe.k'), trainer);
      assert.equal(await hpOf(page, 'foe'), await maxOf(page, 'foe'), 'back to the earlier trainer: a fresh fight');
      await page.tap('[data-f="gameType"][data-value="Singles"]');
    },
  },
  {
    id: 'reset fight',
    title: 'Reset fight (Field first row, right of Singles / Doubles, fits): all HP 100 %, statuses, scratch, broken and manual overrides cleared; same trainer and Pokémon',
    run: async page => {
      await setupCalc(page);
      const sel = await page.value('JSON.stringify([CALC.state().foe,CALC.state().mine])');
      await page.setBox('[data-hp="mine"]', 5);
      await page.setBox('[data-hp="foe"]', 1);
      await page.value(`(()=>{CALC.set('mine','status','par');CALC.set('foe','status','brn');CALC.set('foe','broken',true);CALC.set('mine','stg',[2,0,0,0,0]);CALC.render();})()`);
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      await page.setBox('[data-hp="foe"]', 3);
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 0 });
      await setWeather(page);
      const box = await page.value(`(()=>{const b=document.querySelector('[data-a="fightreset"]').getBoundingClientRect(),f=document.querySelector('.dformat').getBoundingClientRect(),d=document.querySelector('.dfield').getBoundingClientRect();return {top:Math.abs(b.top-f.top)<1,right:b.right<=d.right+0.5,after:b.left>=f.right,h:b.height,w:f.width};})()`);
      assert.ok(box.top && box.right && box.after, 'Reset fight on the format row, right of it, inside the Field: ' + JSON.stringify(box));
      assert.ok(box.h >= 26, 'tap height ' + box.h);
      await page.tap('[data-a="fightreset"]');
      assert.equal(await page.value('JSON.stringify([CALC.state().foe,CALC.state().mine])'), sel, 'same trainer and Pokémon');
      assert.equal(await hpOf(page, 'mine'), await maxOf(page, 'mine'), 'player HP 100 %');
      assert.equal(await hpOf(page, 'foe'), await maxOf(page, 'foe'), 'foe HP 100 %');
      const [mine, foe] = [await mon(page, 'mine'), await mon(page, 'foe')];
      assert.equal(mine.status, '', 'player status cleared');
      assert.equal(foe.status, '', 'foe status cleared');
      assert.equal(foe.broken, null, 'broken cleared');
      assert.equal(mine.stg, '0,0,0,0,0', 'scratch cleared');
      assert.equal(await page.value('CALC.state().field.weather??null'), null, 'manual weather cleared');
      assert.ok(await page.value(`document.querySelector('.dfield').open`), 'the Field stays open');
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      assert.equal(await hpOf(page, 'foe'), await maxOf(page, 'foe'), 'the rest of the foe team too');
    },
  },
  {
    id: 'reload and migration',
    title: 'reload mid-fight keeps HP / status / manual Field, drops scratch; older storage keeps only HP / status / the current fight',
    run: async page => {
      await setupCalc(page);
      const max = await maxOf(page, 'mine');
      await page.setBox('[data-hp="mine"]', max - 10);
      await page.setBox('[data-hp="foe"]', 1);
      await page.value(`(()=>{CALC.set('mine','stg',[1,0,0,0,0]);CALC.set('mine','status','par');CALC.state().tgt[CALC.key('foe')]='dig';CALC.render();})()`);
      const weather = await setWeather(page);
      await page.reload();
      await page.route('#/calc');
      assert.equal(await hpOf(page, 'mine'), max - 10, 'player HP kept');
      assert.equal(await hpOf(page, 'foe'), 1, 'foe HP of this fight kept');
      const mine = await mon(page, 'mine');
      assert.equal(mine.status, 'par', 'status kept');
      assert.equal(mine.stg, '0,0,0,0,0', 'stages gone');
      assert.equal((await mon(page, 'foe')).vol, '', 'target state gone');
      assert.equal(await page.value('CALC.state().field.weather'), weather, 'manual weather of this fight kept');
      // Seeded storage from an older build: battle condition stored everywhere
      const seeded = await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg)),mk=CALC.key('mine'),fk=CALC.key('foe'),other='mine:'+s.imp.party[0].pid,fk1='foe:'+s.foe.k+':1',gone='foe:old-trainer:0';
        s.edits={[mk]:{na:'Adamant',hp:5,status:'par',stg:[1,0,0,0,0],abilityOn:true,dl:'atk',entry:false,pty:'Fire'},[other]:{na:'Modest',hp:7,status:'brn',stg:[2,0,0,0,0]},[fk]:{hp:3,stg:[0,1,0,0,0],dl:'spa'},[fk1]:{hp:4,na:'Bold'},[gone]:{hp:2}};
        s.saved={[other]:{na:'Timid',hp:9,stg:[0,0,1,0,0]},[fk1]:{status:'slp'}};s.st={[mk+':0']:2};s.tgt={[mk]:'dig'};s.field={weather:${JSON.stringify(weather)},gameType:'Singles'};delete s.fman;
        localStorage.setItem(LS.dmg,JSON.stringify(s));return {mk,fk,other,fk1};})()`);
      await page.reload();
      await page.route('#/calc');
      const after = await page.value('(()=>{const s=CALC.state();return {edits:s.edits,saved:s.saved,st:s.st,tgt:s.tgt,fman:s.fman,stored:JSON.parse(localStorage.getItem(LS.dmg))};})()');
      assert.deepEqual(after.edits, {
        [seeded.mk]: { na: 'Adamant', hp: 5, status: 'par' },
        [seeded.other]: { hp: 7, status: 'brn' },
        [seeded.fk]: { hp: 3 },
        // foe set edits are kept for the fight (C2): the other foe of this fight keeps its nature
        [seeded.fk1]: { hp: 4, na: 'Bold', status: 'slp' },
      }, 'selected cards and the foes of this fight keep set edits; other player cards HP / status; scratch and other fights gone');
      assert.deepEqual(after.saved, { [seeded.other]: { na: 'Timid' } }, 'saved sets keep only set fields');
      assert.deepEqual([after.st, after.tgt], [{}, {}], 'row and target state gone');
      assert.deepEqual(after.fman, ['weather'], 'an older stored Field counts as manual');
      assert.deepEqual(after.stored.edits, after.edits, 'the migration is stored');
      assert.ok(!('st' in after.stored) && !('tgt' in after.stored), 'scratch is never stored');
      assert.equal(await hpOf(page, 'mine'), 5);
      assert.equal(await page.value(`CALC.mon('mine').na`), 'Adamant');
    },
  },
  {
    id: 'mega kept',
    title: 'Mega is kept for the fight: survives a switch-back and reload, is no set edit, cleared by Reset fight',
    run: async page => {
      await setupCalc(page);
      let slot = -1;
      for (let i = 0; i < 6 && slot < 0; i++) {
        await pickCell(page, 'party', i);
        if (await page.count('.dmatch .cc[data-s="mine"] [data-a="mega"]')) slot = i;
      }
      if (slot < 0) return console.log('  (no party Pokémon with a Mega form in this guide)');
      const base = await page.value(`CALC.mon('mine').id`);
      await page.tap('.dmatch .cc[data-s="mine"] [data-a="mega"]');
      const mega = await page.value(`CALC.mon('mine').id`);
      assert.notEqual(mega, base, 'Mega form on');
      assert.ok(!(await nameOf(page, 'mine')).endsWith('*'), 'Mega is not an unsaved set edit');
      await pickCell(page, 'party', slot === 5 ? 0 : 5);
      await pickCell(page, 'party', slot);
      assert.equal(await page.value(`CALC.mon('mine').id`), mega, 'Mega kept after a switch-back');
      await page.reload();
      await page.route('#/calc');
      assert.equal(await page.value(`CALC.mon('mine').id`), mega, 'Mega kept after reload');
      await openField(page);
      await page.tap('[data-a="fightreset"]');
      assert.equal(await page.value(`CALC.mon('mine').id`), base, 'Reset fight ends the Mega');
      assert.equal(await page.value(`CALC.mon('mine').pre??null`), null);
    },
  },
  {
    id: 'foe edits kept',
    title: 'a foe set edit (ability, else nature) survives switching foes and reload; trainer change clears it; no foe Save',
    run: async page => {
      await setupCalc(page);
      await editorOpen(page, 'foe', true);
      assert.equal(await page.count('[data-a="esave"][data-s="foe"]'), 0, 'no foe Save');
      const field = (await page.value(`document.querySelectorAll('.cc[data-s="foe"] select[data-e="a"] option').length`)) > 1 ? 'a' : 'na';
      const sel = `.cc[data-s="foe"] select[data-e="${field}"]`;
      const was = await page.value(`document.querySelector('${sel}').value`);
      const edited = await page.value(`[...document.querySelector('${sel}').options].map(o=>o.value).find(v=>v!==${JSON.stringify(was)})`);
      await choose(page, sel, edited);
      const now = await page.value(`String(CALC.mon('foe').${field})`);
      await editorOpen(page, 'foe', false);
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 0 });
      assert.equal(await page.value(`String(CALC.mon('foe').${field})`), now, `foe ${field} edit kept after switching foes`);
      await page.reload();
      await page.route('#/calc');
      assert.equal(await page.value(`String(CALC.mon('foe').${field})`), now, 'kept after reload');
      // player behaviour unchanged: checked in 'scratch lifecycle' (unsaved nature dropped on a switch)
      await page.tap('[data-a="tnext"]');
      await page.tap('[data-a="tprev"]');
      assert.deepEqual(await page.value('Object.keys(CALC.state().edits).filter(k=>k.startsWith("foe:"))'), [], 'trainer change clears foe edits');
      assert.notEqual(await page.value(`String(CALC.mon('foe').${field})`), now, 'back to the trainer data');
    },
  },
];

await runChecks({ name: 'calc-auto', file, checks });

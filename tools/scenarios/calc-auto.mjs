// Calc fight state (plans/calc-auto-effects.md, unit C rows of Checks): the scratch lifecycle (battle condition lives
// only while a Pokémon is selected; HP / status / broken are kept; unsaved set edits go on a switch, saved ones stay),
// a trainer change (foe fresh, player HP kept, manual Field overrides cleared), Reset fight (all HP 100 %, statuses
// cleared, same trainer and Pokémon), reload / migration of older storage, and (C2) Mega and foe set edits kept for
// the fight. Default foe: the guide's four-Pokémon trainer (calc_check_lib trainerRoles); 260 x 316, normal and dvkb. Usage: node tools/scenarios/calc-auto.mjs [dist/<hack>.html]
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fixturePatches, guide, guideArg, pickCell, prepareGuide, runChecks, setupCalc, tapField } from '../calc_check_lib.mjs';

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
const otherNature = (page, side) => page.value(`NATS.find(value=>value!==CALC.mon('${side}').na)`);
const openField = async page => {
  if (!(await page.value(`document.querySelector('.dfield').open`))) await page.tap('.dfield > summary');
};
// A manual weather: the first non-empty option
const setWeather = async page => {
  await openField(page);
  const value = await page.value(`[...document.querySelector('select[data-f="weather"]').options].map(o=>o.value).find(v=>v&&v!=='@auto')`);
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
      await choose(page, '.cc[data-s="mine"] [data-e="na"]', edited);
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
      await choose(page, '.cc[data-s="mine"] [data-e="na"]', edited);
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
      assert.ok(!state.fman.includes('weather'), 'manual weather cleared; automatic weather may apply');
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
      assert.ok(!(await page.value('CALC.state().fman')).includes('weather'), 'manual weather cleared; automatic weather may apply');
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
      const field = (await page.value(`document.querySelectorAll('.cc[data-s="foe"] select[data-e="ab"] option:not([value="@other"])').length`)) > 1 ? 'a' : 'na';
      const sel = `.cc[data-s="foe"] [data-e="${field === 'a' ? 'ab' : 'na'}"]`;
      const was = await page.value(`document.querySelector('${sel}').value`);
      const edited = field === 'a' ? await page.value(`[...document.querySelector('${sel}').options].map(option=>option.value).find(value=>value!=='@other'&&value!==${JSON.stringify(was)})`) : await page.value(`NATS.find(value=>value!==${JSON.stringify(was)})`);
      await choose(page, sel, edited);
      const now = await page.value(`String(CALC.mon('foe').${field})`);
      console.log(`     note: foe ${field} ${was} -> ${now}`);
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

const configure = (page, mine, foe) => page.value(`(()=>{
  for(const [side,config] of Object.entries(${JSON.stringify({ mine, foe })})){
    if(!config)continue;
    const species=P.find(p=>p.n===config.name);if(!species)throw new Error('Missing species '+config.name);
    const fields={id:species.id,l:50,na:'Hardy',a:species.a[0],i:'',m:[M.indexOf('Tackle')],hp:undefined,status:undefined,stg:[0,0,0,0,0],used:false,toggles:{},intim:true,broken:false,...config};
    if(config.ability)fields.a=D.AB.findIndex(entry=>entry[0]===config.ability);
    if(config.moves)fields.m=config.moves.map(name=>M.indexOf(name));
    for(const [key,value] of Object.entries(fields))if(!['name','ability','moves'].includes(key))CALC.set(side,key,value);
  }CALC.render();return true;
})()`);
const reloadCalc = async page => { await page.reload(); await page.route('#/calc'); };
const effectTrainer = predicate => guide().data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr)).find(predicate);
const engineInput = `m=>({id:m.id,lv:m.l,nat:m.na,ab:m.a,it:m.i,st:m.status,iv:m.iv,ev:m.ev,stg:[0,...(m.stg||[0,0,0,0,0])],hp:m.hp,intim:m.intim,used:m.used,broken:m.broken,entry:m.entry,abilityOn:m.abilityOn})`;
const expectedHit = (page, roll = 'min', side = 'mine') => page.value(`(()=>{const input=${engineInput},side='${side}',other=side==='mine'?'foe':'mine',field=side==='mine'?CALC.state().field:Object.fromEntries(Object.entries(CALC.state().field).map(([key,value])=>[key.startsWith('atk')?'def'+key.slice(3):key.startsWith('def')?'atk'+key.slice(3):key,value]));return DMG.hit(input(CALC.mon(side)),input(CALC.mon(other)),{mv:CALC.mon(side).m[0]},field,'${roll}');})()`);
const hitFirst = async (page, roll = 'min') => {
  if(await page.count('#calc-log'))await page.tap('#calc-log button');
  if (!(await page.count('.dres:not(.na) .mr:first-child.open'))) await page.tap('.dres:not(.na) .mr:first-child .mm');
  await page.tap(`.dres:not(.na) .mr:first-child [data-a="sub"][data-roll="${roll}"]`);
};

checks.push(
  {
    id: 'weather layers',
    title: 'both leads slower wins, reversed in Trick Room; manual and Auto; setter lifetime comes from settings',
    run: async page => {
      await setupCalc(page);
      await configure(page, { name: 'Politoed', ability: 'Drizzle' }, { name: 'Torkoal', ability: 'Drought' });
      await reloadCalc(page);
      assert.equal(await page.value('CALC.state().field.weather'), 'Sun', 'slower Torkoal wins together');
      await openField(page);
      assert.equal(await page.value(`document.querySelector('[data-f="weather"]').value`), '@auto');
      assert.equal(await page.count('[data-a="fieldauto"]'),0,'Auto button only exists with a manual override');
      assert.match(await page.text('.dfsource'), /Sun: foe Torkoal.*Drought/s);
      await choose(page, '[data-f="weather"]', 'Rain');
      assert.equal(await page.value('CALC.state().field.weather'), 'Rain');
      assert.match(await page.text('.dfsource'), /Weather set by you.*auto: Sun/s);
      await page.tap('[data-a="fieldauto"]');
      assert.equal(await page.value('CALC.state().field.weather'), 'Sun');
      await page.tap('[data-f="trickRoom"]');
      await reloadCalc(page);
      assert.equal(await page.value('CALC.state().field.weather'), 'Rain', 'faster Politoed wins under Trick Room');
      await openField(page);
      await page.tap('[data-a="fieldauto"]');
      await page.tap('.dside:not(.mg) .dstrip [data-a="fpick"]', { index: 1 });
      const stays = await page.value('DMG.settings().setterStays');
      assert.equal(await page.value('CALC.state().field.weather'), 'Rain', 'active player setter beats area');
      await pickCell(page, 'party', 0);
      if (stays) assert.equal(await page.value('CALC.state().field.weather'), 'Rain', 'Hardlove setter remains after departure');
      else assert.notEqual(await page.value('CALC.state().field.weather'), 'Rain', 'non-sticky setter leaves');
      const rain = effectTrainer(trainer => trainer.field?.some(record => record.effects?.some(effect => effect.kind === 'weather' && effect.value === 'Rain')));
      if(rain){
        await page.value(`CALC.enter(${JSON.stringify(rain.k)},0)`);
        await configure(page,{name:'Torkoal',ability:'Drought'},{name:'Bibarel',ability:'Simple'});
        await reloadCalc(page);
        assert.equal(await page.value('CALC.state().field.weather'),'Sun','setter beats the real area Rain');
        await page.value(`CALC.set('mine','hp',0);CALC.render()`);
        await reloadCalc(page);
        assert.equal(await page.value('CALC.state().field.weather'),'Rain','fainted entrant contributes no setter');
      }
      const primal = guide().data.cfg.calc.field.find(entry => entry.k === 'weather').o.some(([value]) => value === 'Heavy Rain') && guide().data.AB.some(entry => entry[0] === 'Primordial Sea');
      if(primal){
        await configure(page,{name:'Kyogre',ability:'Primordial Sea'},{name:'Torkoal',ability:'Drought'});
        await reloadCalc(page);
        assert.equal(await page.value('CALC.state().field.weather'),'Heavy Rain','ordinary slower setter cannot replace primal weather');
      }
      await configure(page,{name:'Bibarel',ability:'Simple'},{name:'Torkoal',ability:'Drought',l:null});
      await reloadCalc(page);
      await page.value(`CALC.set('foe','l',50);CALC.render()`);
      assert.equal(await page.value('CALC.state().field.weather'),'Sun','entry waiting for a level cap resolves when its level becomes known');
      await configure(page,{name:'Torkoal',ability:'Drought'},{name:'Politoed',ability:'Drizzle',l:null});
      await reloadCalc(page);
      await page.value(`CALC.set('foe','l',50);CALC.render()`);
      assert.equal(await page.value('CALC.state().field.weather'),'Sun','both leads still resolve slower-first priority after the missing cap is entered');
    },
  },
  {
    id: 'area conditions',
    title: 'real trainer evidence: weather, Tailwind and crit deduplication, lead-exempt hazards, Trick Room and text-only effects',
    run: async page => {
      await setupCalc(page);
      const all = guide().data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr));
      for (const trainer of all.filter(trainer => trainer.field?.some(record => !record.label)).filter((trainer, index, list) => index === list.findIndex(other => JSON.stringify(other.field?.flatMap(record => record.effects)) === JSON.stringify(trainer.field?.flatMap(record => record.effects))))) {
        await page.value(`CALC.enter(${JSON.stringify(trainer.k)},0)`);
        await openField(page);
        const state = await page.value('CALC.state().field');
        const effects = trainer.field.filter(record => !record.label).flatMap(record => record.effects);
        if(effects.some(effect => effect.kind === 'critical-bonus')) { assert.equal(state.defCritBonus, 1, trainer.k+' crit '+JSON.stringify(state)); assert.match(await page.text('.dfarea'), /\+1 crit \(foe, guess\)/); }
        if(effects.some(effect => effect.kind === 'side-condition')) { assert.equal(state.defTailwind, true); assert.equal(await page.count('[data-f="defTailwind"].dauto sup'), 1); }
        if(effects.some(effect => effect.value === 'Trick Room')) assert.equal(state.trickRoom, true);
        if(effects.some(effect => effect.value === 'Fog')) assert.match(await page.text('.dfarea'), /Fog: accuracy ×0.6, no damage effect/);
        if(effects.some(effect => effect.value === 'random')) assert.notEqual(state.terrain, 'random');
        if(effects.some(effect => effect.kind === 'hazard')) {
          assert.equal(state.atkSpikes, 1,trainer.k+' Spikes '+JSON.stringify(state)); assert.equal(state.atkToxicSpikes, 1,trainer.k+' Toxic Spikes '+JSON.stringify(state));
          assert.ok(await page.value('CALC.state().hazardEntry.mine.status'), 'lead exempt');
          const lead = await hpOf(page, 'mine');
          await pickCell(page, 'party', 0);
          assert.ok((await hpOf(page, 'mine')) < (await maxOf(page, 'mine')), 'next grounded entrant takes Spikes');
          assert.match(await page.text('#calc-log'), /entry.*Spikes/s);
          assert.ok(lead > 0);
          await pickCell(page, 'party', 5);
        }
      }
      const thunder = effectTrainer(trainer => trainer.field?.some(record => /Thunderstorm/.test(record.text)));
      if(thunder) { await page.value(`CALC.enter(${JSON.stringify(thunder.k)},0)`); assert.equal(await page.value('CALC.state().field.weather'), 'Rain'); assert.equal(await page.value('CALC.state().field.terrain'), 'Electric'); }
      const sand = effectTrainer(trainer => /Route 111/.test(trainer.loc) && trainer.field?.some(record => /Permanent Sand/.test(record.text)));
      if(sand) { await page.value(`CALC.enter(${JSON.stringify(sand.k)},0)`); assert.equal(await page.value('CALC.state().field.weather'), 'Sand'); }
      const hazards=effectTrainer(trainer=>trainer.field?.some(record=>record.effects?.some(effect=>effect.timing==='after-first-send-out')));
      if(hazards){
        await pickCell(page,'party',0);
        await page.value(`CALC.set('mine','hp',undefined);CALC.set('mine','status',undefined);CALC.state().mine={src:'party',b:0,i:99};CALC.render();CALC.enter(${JSON.stringify(hazards.k)},0)`);
        await reloadCalc(page);
        await pickCell(page,'party',0);
        assert.equal(await hpOf(page,'mine'),await maxOf(page,'mine'),'first selection is exempt even when trainer was picked before the player');
        assert.equal(await page.value('CALC.mon("mine").status??""'),'','first selection is not poisoned');
      }
    },
  },
  {
    id: 'intimidate',
    title: 'Intimidate holder box; engine net marks for Simple and Defiant; untouched stages and no header overflow',
    run: async page => {
      await setupCalc(page);
      for (const [name, ability, delta] of [['Bibarel','Simple',-2],['Bisharp','Defiant',1]]) {
        await configure(page, { name: 'Growlithe', ability: 'Intimidate' }, { name, ability });
        assert.deepEqual(await page.value(`(()=>{const box=document.querySelector('[data-e="intim"]');return {text:box.parentElement.textContent.trim(),title:box.parentElement.title,aria:box.getAttribute('aria-label')};})()`),{text:'',title:'Intimidate',aria:'Intimidate'},'plain accessible checkbox');
        assert.match(await page.text('.cc[data-s="foe"] .dintmark'), new RegExp(delta<0?'Int −2':'Int \\+1'));
        assert.deepEqual(await page.value('CALC.mon("foe").stg'), [0,0,0,0,0]);
        await page.value(`(()=>{const box=document.querySelector('[data-e="intim"]');box.checked=false;box.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        assert.equal(await page.count('.dintmark'), 0);
        const fits = await page.value(`(()=>{const card=document.querySelector('.cc[data-s="mine"] .l1');return card.scrollWidth<=card.clientWidth+1;})()`);
        assert.ok(fits, 'Intim. header fits at 260');
      }
    },
  },
  {
    id: 'hit patches',
    title: 'HP actions apply engine Sash, Sturdy, berry, Weakness Policy, Balloon and Moxie patches in both directions',
    run: async page => {
      await setupCalc(page);
      const cases = [
        [{ name:'Gyarados',l:100,moves:['Seismic Toss'] },{ name:'Bibarel',l:1,i:'Focus Sash' },/Focus Sash/],
        [{ name:'Gyarados',l:100,moves:['Seismic Toss'] },{ name:'Bibarel',l:1,ability:'Sturdy' },/Sturdy/],
        [{ name:'Gyarados',l:50,moves:['Seismic Toss'] },{ name:'Bibarel',l:50,i:'Sitrus Berry',hp:100 },/Sitrus/],
        [{ name:'Politoed',moves:['Water Gun'] },{ name:'Torkoal',i:'Weakness Policy' },/Weakness Policy/],
        [{ name:'Gyarados',moves:['Tackle'] },{ name:'Bibarel',i:'Air Balloon' },/Air Balloon/],
        [{ name:'Gyarados',i:'Normal Gem',moves:['Tackle'] },{ name:'Bibarel' },/Gem/],
        [{ name:'Gyarados',l:100,ability:'Moxie',moves:['Seismic Toss'] },{ name:'Bibarel',l:1 },/Moxie/],
      ];
      for(const [mine,foe,note] of cases){
        await configure(page,mine,foe);
        const result=await expectedHit(page);
        assert.ok(result, 'engine hit result');
        await hitFirst(page);
        assert.equal(await hpOf(page,'foe'),result.def.hp);
        if(result.def.hp===0)assert.equal(await page.value(`document.querySelector('.dres:not(.na) [data-a="sub"]').disabled`),true,'HP actions disabled on a fainted target');
        if(result.def.used)assert.equal(await page.value('CALC.mon("foe").used'),true);
        for(const [side,patch] of [['mine',result.atk],['foe',result.def]])if(patch.used){
          await editorOpen(page,side,true);
          assert.match(await page.value(`document.querySelector('.cc[data-s="${side}"] [data-e="it"]').value`),/\(used\)$/,'consumed item visible after actual hit');
          await editorOpen(page,side,false);
        }
        if(result.def.stg)assert.deepEqual(await page.value('CALC.mon("foe").stg'),result.def.stg.slice(1));
        if(result.atk.stg)assert.deepEqual(await page.value('CALC.mon("mine").stg'),result.atk.stg.slice(1));
        assert.match(await page.text('#calc-log'),note);
      }
      await configure(page,{name:'Bibarel',l:1,i:'Focus Sash'},{name:'Gyarados',l:100,moves:['Seismic Toss']});
      await page.value(`CALC.state().dir='in';CALC.render()`);
      const reverse=await expectedHit(page,'max','foe');
      await hitFirst(page,'max');
      assert.equal(await hpOf(page,'mine'),reverse.def.hp);
      assert.equal(await page.value('CALC.mon("mine").used'),true,'incoming max hit uses player Sash');
    },
  },
  {
    id: 'turn berry orb',
    title: 'Speed Boost turn, Sitrus / Salac chips, derived Orb immunities and kept explicit None override',
    sizes: [[260,316],[316,316],[260,350],[480,392],[537,424],[832,424]],
    run: async page => {
      await setupCalc(page);
      await configure(page,{ name:'Blaziken',ability:'Speed Boost' },{ name:'Bibarel' });
      assert.match(await page.text('[data-a="eot"][data-s="mine"]'),/↑1/);
      await page.tap('[data-a="eot"][data-s="mine"]');
      assert.equal(await page.value('CALC.mon("mine").stg[4]'),1);
      for(const item of ['Sitrus Berry','Salac Berry']){
        await configure(page,{ name:'Bibarel',hp:20,moves:['Tackle','Swift','Surf','Flamethrower'] },{name:'Growlithe',ability:'Intimidate'});
        const closedHeight=await page.value(`document.querySelector('.dmatch .cc[data-s="mine"]').offsetHeight`);
        await page.value(`CALC.set('mine','i','${item}');CALC.set('mine','status','tox');CALC.render()`);
        await page.assertFits('berry, Toxic, turn end and Intimidate together');
        assert.equal(await page.value(`document.querySelector('.dmatch .cc[data-s="mine"]').offsetHeight`),closedHeight,'crowded HP controls never grow the closed card');
        await page.value(`scrollTo(0,document.querySelector('.fbar').getBoundingClientRect().top+scrollY-2)`);
        assert.ok(await page.value(`document.querySelector('.dres:not(.na) .mr:last-child').getBoundingClientRect().bottom<=innerHeight`),'fourth attacker move still visible');
        await editorOpen(page,'mine',true);
        assert.ok(await page.value(`document.querySelector('.cc[data-s="mine"]').offsetHeight<=innerHeight-8`),'open card with berry, Toxic and Intimidate fits one window');
        const before=await page.value(`(()=>{const input=${engineInput};return DMG.berry(input(CALC.mon('mine')),CALC.state().field,input(CALC.mon('foe')),'atk');})()`);
        assert.ok(before);
        assert.match(await page.text('[data-a="berry"][data-s="mine"]'),/^\+\d*$/);
        await page.tap('[data-a="berry"][data-s="mine"]');
        assert.equal(await hpOf(page,'mine'),before.atk.hp);
        assert.equal(await page.count('[data-a="berry"][data-s="mine"]'),0);
        await editorOpen(page,'mine',false);
        assert.equal(await page.value(`document.querySelector('.dmatch .cc[data-s="mine"]').offsetHeight`),closedHeight,'consumed berry does not change the closed height');
        await page.assertFits('Toxic, turn end and Intimidate after consuming a berry');
      }
      await configure(page,{ name:'Machamp',ability:'Guts',i:'Flame Orb' },null);
      assert.equal(await page.value('CALC.mon("mine").status'),'brn');
      const guts=await expectedHit(page);
      await editorOpen(page,'mine',true);
      assert.match(await page.value(`document.querySelector('.cc[data-s="mine"] select[data-e="status"] option:checked').textContent`),/Burn.*Orb/);
      await choose(page,'.cc[data-s="mine"] select[data-e="status"]','');
      assert.equal(await page.value('CALC.mon("mine").status??""'),'');
      assert.ok(guts.dealt>(await expectedHit(page)).dealt,'derived Burn activates Guts damage');
      await reloadCalc(page);
      assert.equal(await page.value('CALC.mon("mine").status??""'),'');
      await configure(page,{ name:'Charizard',i:'Flame Orb' },null);
      assert.equal(await page.value('CALC.mon("mine").status??""'),'');
    },
  },
  {
    id: 'overlay field layout',
    title: 'fixed dismissible non-persisted overlay, above dvkb number pad; Field internal scrolling fits minimum height',
    run: async (page,{dvkb}) => {
      await setupCalc(page);
      await configure(page,{name:'Gyarados',moves:['Tackle']},{name:'Bibarel'});
      await hitFirst(page);
      const geometry=await page.value(`(()=>{const log=document.querySelector('#calc-log');return {position:getComputedStyle(log).position,max:getComputedStyle(log.firstChild).maxHeight,bottom:log.getBoundingClientRect().bottom};})()`);
      assert.equal(geometry.position,'fixed');
      if(dvkb){await page.tap('[data-hp="mine"]');assert.ok(await page.value(`document.querySelector('#calc-log').getBoundingClientRect().bottom<=document.querySelector('.kb').getBoundingClientRect().top`),'overlay above keyboard');await page.tap('.kb [data-a="done"]');}
      await page.tap('#calc-log button');assert.equal(await page.count('#calc-log'),0);
      await openField(page);
      const fits=await page.value(`(()=>{const body=document.querySelector('.dfb');body.scrollIntoView({block:'start'});return body.getBoundingClientRect().height<=innerHeight;})()`);
      assert.ok(fits,'Field body stays within one window');
      await reloadCalc(page);assert.equal(await page.count('#calc-log'),0);
    },
  },
);

checks.push({
  id: 'broken box', title: 'Disguise and Ice Face header boxes follow real holders, HP actions, switches and Reset fight',
  sizes: [[260,316],[260,350],[480,392],[537,424],[832,424]],
  run: async page => {
    await setupCalc(page);
    const profile=guide().data.cfg.calc;
    for (const [pattern,ability,minGen] of [['Mimikyu','Disguise',7],['Eiscue','Ice Face',8]]) {
      const species=guide().data.P.find(mon=>mon.n.includes(pattern)&&!/Busted|Noice/.test(mon.n)&&mon.a.some(index=>guide().data.AB[index]?.[0]===ability));
      if (!species || profile.gen<minGen || profile.abilities===false) continue;
      const selected=await page.value(`(()=>{CALC.use(P.find(mon=>mon.id===${JSON.stringify(species.id)}));const state=CALC.state(),mon=state.custom.at(-1);Object.assign(mon,{l:50,a:D.AB.findIndex(entry=>entry[0]==='${ability}'),i:'',m:[M.indexOf('Bite')],hp:undefined});state.dir='in';CALC.render();return state.mine.i;})()`);
      await configure(page,null,{name:'Bibarel',moves:['Bite']});
      assert.equal(await page.count('[data-ms="broken"][data-s="mine"]'),1);
      assert.equal(await page.value(`document.querySelector('[data-ms="broken"][data-s="mine"]').checked`),false);
      await page.tap('[data-ms="broken"][data-s="mine"]');
      assert.equal(await page.value(`CALC.mon('mine').broken`),true,'manual Broken writes fight state');
      await page.tap('[data-ms="broken"][data-s="mine"]');
      await hitFirst(page);
      assert.equal(await page.value(`document.querySelector('[data-ms="broken"][data-s="mine"]').checked`),true,'HP minus bust ticks Broken');
      await page.tap('#calc-log button');
      await pickCell(page,'party',0);
      await pickCell(page,'custom',selected);
      assert.equal(await page.value(`document.querySelector('[data-ms="broken"][data-s="mine"]').checked`),true,'Broken survives switching');
      await openField(page);
      await page.tap('[data-a="fightreset"]');
      assert.equal(await page.value(`document.querySelector('[data-ms="broken"][data-s="mine"]').checked`),false,'Reset fight restores intact');
      await page.value(`CALC.set('mine','a',D.AB.findIndex(entry=>entry[0]==='Intimidate'));CALC.render()`);
      assert.equal(await page.count('[data-ms="broken"][data-s="mine"]'),0,'no box without the shield ability');
      await page.value(`CALC.set('mine','a',D.AB.findIndex(entry=>entry[0]==='${ability}'));CALC.set('mine','id',P.find(mon=>mon.n==='Bibarel').id);CALC.render()`);
      assert.equal(await page.count('[data-ms="broken"][data-s="mine"]'),0,'no box for a form lacking the ability');
    }
  },
}, {
  id: 'crit field controls', title: 'per-side crit states gated by moves, generation and profile; Dragon Cheer only in Doubles; Field scroll stays inside one window',
  sizes: [[260,316],[260,350],[480,392],[537,424],[832,424]],
  run: async page => {
    await setupCalc(page);
    const data=guide().data,profile=data.cfg.calc;
    await openField(page);
    await page.tap('[data-f="gameType"][data-value="Singles"]');
    for (const [key,name,generation] of [['LaserFocus','Laser Focus',7],['LuckyChant','Lucky Chant',4],['DragonCheer','Dragon Cheer',9]]) {
      const offered=profile.gen>=generation&&data.M.includes(name)&&profile.over?.state?.[name]!==false;
      for (const prefix of ['atk','def']) {
        const field=prefix+key;
        assert.equal(profile.field.some(entry=>entry.k===field),offered,field+' build-time gating');
        assert.equal(await page.count(`[data-f="${field}"]`),offered&&key!=='DragonCheer'?1:0,field+' Singles availability');
      }
    }
    if(data.cfg.name==='Emerald Imperium'){
      for(const key of ['atkLaserFocus','atkLuckyChant'])assert.ok(profile.field.some(entry=>entry.k===key),'EI explicitly offers '+key);
      assert.ok(!profile.field.some(entry=>entry.k.endsWith('DragonCheer')),'Dragon Cheer is not in EI');
    }
    for(const entry of profile.field.filter(entry=>/^(atk|def)(LaserFocus|LuckyChant)$/.test(entry.k))){
      await tapField(page,entry.k);
      assert.equal(await page.value(`document.querySelector('[data-f="${entry.k}"]').getAttribute('aria-pressed')`),'true',entry.k+' visible and tappable in Singles States');
      await tapField(page,entry.k);
    }
    await page.tap('[data-f="gameType"][data-value="Doubles"]');
    for (const entry of profile.field.filter(entry=>/^(atk|def)(LaserFocus|LuckyChant|DragonCheer)$/.test(entry.k))) {
      assert.equal(await page.count(`[data-f="${entry.k}"]`),1);
      await tapField(page,entry.k);
      assert.equal(await page.value(`!!CALC.state().field.${entry.k}`),true,'toggle writes '+entry.k);
      const fits=await page.value(`(()=>{const field=document.querySelector('.dfield'),body=field.querySelector('.dfb');field.scrollIntoView({block:'start'});return field.getBoundingClientRect().height<=innerHeight&&body.scrollHeight>=body.clientHeight;})()`);
      assert.ok(fits,'expanded crit group stays in the one-window Field');
    }
    await page.tap('[data-f="gameType"][data-value="Singles"]');
    assert.equal(await page.count('[data-f$="DragonCheer"]'),0,'Dragon Cheer disappears in Singles');
    if (data.cfg.name==='Hardlove Gold') assert.equal(profile.field.some(entry=>entry.k.endsWith('DragonCheer')),false,'Hardlove has no functional Dragon Cheer');
  },
});

checks.push({
  id: 'used item fight', title: 'all consumed items stay visibly used across switches/reload, replacement and new fight clear them',
  run: async page => {
    await setupCalc(page);
    await page.value(`CALC.use(P.find(mon=>mon.n==='Snorlax'));CALC.render()`);
    for(const item of ['Focus Sash','Weakness Policy','Sitrus Berry','Air Balloon','Normal Gem']){
      await configure(page,{name:'Snorlax',i:item},null);
      await page.value(`CALC.set('mine','used',true);CALC.render()`);
      await editorOpen(page,'mine',true);
      assert.equal(await page.value(`document.querySelector('.cc[data-s="mine"] [data-e="it"]').value`),'No item (used)');
      assert.equal(await page.value(`document.querySelector('.cc[data-s="mine"] [data-e="it"]').title`),item+' (used)');
      assert.equal(await page.value(`document.querySelector('.cc[data-s="mine"] [data-e="it"]').value`),'No item (used)');
      const index=await page.value('CALC.state().mine.i');
      await page.value(`CALC.state().custom.push({...CALC.state().custom[${index}],pid:'other'});CALC.state().mine.i=CALC.state().custom.length-1;CALC.render();CALC.state().mine.i=${index};CALC.render()`);
      await reloadCalc(page);
      assert.equal(await page.value('CALC.mon("mine").used'),true,item+' kept after switch and reload');
      await editorOpen(page,'mine',true);
      await choose(page,'.cc[data-s="mine"] [data-e="it"]',item);
      assert.ok(!await page.value('CALC.mon("mine").used'),'item replacement clears used');
      await page.value(`CALC.set('mine','used',true);CALC.render()`);
      await page.tap('[data-a="tnext"]');
      assert.ok(!await page.value('CALC.mon("mine").used'),'trainer change clears used');
      await page.value(`CALC.set('mine','used',true);CALC.render()`);
      await openField(page);
      await page.tap('[data-a="fightreset"]');
      assert.ok(!await page.value('CALC.mon("mine").used'),'Reset fight clears used');
    }
  },
});

checks.push({
  id: 'berry amount once', title: 'ready berry is chip-only; residual crossing includes and consumes the berry',
  run: async page => {
    await setupCalc(page);
    await configure(page,{name:'Snorlax',i:'Sitrus Berry',hp:100},null);
    assert.equal(await page.count('[data-a="eot"][data-s="mine"]'),0,'no duplicate green turn amount');
    assert.equal(await page.count('[data-a="berry"][data-s="mine"]'),1);
    await page.value(`CALC.set('mine','status','tox');CALC.render()`);
    const before=await hpOf(page,'mine');
    await page.tap('[data-a="eot"][data-s="mine"]');
    assert.ok(await hpOf(page,'mine')<before,'residual only');
    assert.ok(!await page.value('CALC.mon("mine").used'),'ready berry is not silently consumed');
    await page.value(`CALC.set('mine','hp',Math.floor(DMG.stats((${engineInput})(CALC.mon('mine')))[0]/2)+1);CALC.render()`);
    assert.equal(await page.count('[data-a="berry"][data-s="mine"]'),0,'not ready before residual');
    await page.tap('[data-a="eot"][data-s="mine"]');
    assert.equal(await page.value('CALC.mon("mine").used'),true,'residual crossing consumes berry');
  },
});

checks.push({
  id: 'phone presets', title: 'every phone preset uses real custom sets, matching Edit or reporting not available',
  run: async page => {
    await setupCalc(page);
    const panel=readFileSync(new URL('../mockup/thor-frame/calc-presets.html',import.meta.url),'utf8').split('<script>')[1].split('let builtWait')[0];
    const results=await page.value(`(()=>{const thorFrame=()=>window;const host=document.createElement('div');host.innerHTML='<div id="calc-presets"></div><p id="calc-preset-status"></p>';document.body.append(host);${panel};return builtPresets.map(([label,request])=>{const before=JSON.stringify(CALC.state().custom);builtPreset(request);const message=document.querySelector('#calc-preset-status').textContent;if(message.startsWith('That preset'))return {label,missing:true,preserved:before===JSON.stringify(CALC.state().custom)};if(!document.querySelector('.cc[data-s="mine"] .ed'))document.querySelector('[data-a="eopen"][data-s="mine"]').click();const item=document.querySelector('.cc[data-s="mine"] [data-e="it"]'),ability=document.querySelector('.cc[data-s="mine"] select[data-e="ab"]'),mon=CALC.mon('mine');return {label,item:item?.value,expected:request.item||'',ability:ability?.value??document.querySelector('.cc[data-s="mine"] input[data-e="ab"]')?.value,actual:ability?String(mon.a):AB[mon.a][0],moves:mon.m.length,status:mon.status,statusLabel:document.querySelector('.cc[data-s="mine"] select[data-e="status"] option:checked').textContent};});})()`);
    for(const result of results){if(result.missing){assert.equal(result.preserved,true,result.label+' unavailable preserves the current team');continue;}assert.equal(result.item,result.expected,result.label+' held item in Edit');assert.equal(result.ability,result.actual,result.label+' ability in Edit');assert.equal(result.moves,4,result.label+' four available moves');if(result.label==='Orb'){assert.equal(result.status,'brn');assert.equal(result.statusLabel,'Burn (Orb)');}}
  },
});

await runChecks({ name: 'calc-auto', file, checks });

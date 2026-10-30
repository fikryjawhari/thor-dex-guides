// Unbound's calc end to end (plans/unbound.md → Unit 8c, the 2026-10-30 calc answers): the sheet Mega / Z bosses,
// every fight gimmick applied from the trainer's area rules through the page (not only the engine), the D2 assumed
// sets of ordinary trainers and the boxes-only import. Unbound only; others skip.
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {guideArg, readGuide, runChecks} from '../calc_check_lib.mjs';
import {assumedTrainerSet} from '../calc/unbound_assumed.mjs';

const file = guideArg(process.argv, 'dist/unbound.html');
if (!existsSync(file)) {
  console.log('SKIP calc-unbound: no built guide');
  process.exit(0);
}
const guide = readGuide(file).data;
if (guide.cfg.name !== 'Pokémon Unbound' || !guide.cfg.calc) {
  console.log('SKIP calc-unbound: requires its enabled calc profile');
  process.exit(0);
}
const trainers = guide.TR.g.flatMap(group=>group.sec.flatMap(section=>section.tr));
const byKey = key => {const trainer = trainers.find(entry=>entry.k===key);assert.ok(trainer,'trainer '+key);return trainer;};
const enter = async (page,key,slot=0) => {
  await page.route('#/calc');
  await page.value(`(()=>{if(!CALC.mon('mine'))CALC.use(byId.mew);CALC.enter(${JSON.stringify(key)},${slot});CALC.render();CALC.fit();})()`);
  await page.settle();
};
// A fresh calc (nothing saved), your Pokémon `species` (a custom set) against trainer `key`'s slot.
const fresh = async page => {
  await page.route('#/calc');
  await page.value(`localStorage.removeItem(LS.dmg)`);
  await page.reload();
  await page.route('#/calc');
};
const fight = async (page,key,species,slot=0,moves=null) => {
  await page.value(`(()=>{CALC.use(byId[${JSON.stringify(species)}]);${moves?`CALC.set('mine','m',${JSON.stringify(moves)}.map(n=>n==null?null:M.indexOf(n)));`:''}CALC.enter(${JSON.stringify(key)},${slot});CALC.render();CALC.fit();})()`);
  await page.settle();
};
const field = page => page.value(`CALC.field()`);
const notes = page => page.value(`[...document.querySelectorAll('.dfrule')].map(e=>e.textContent)`);
const note = async (page,name) => (await notes(page)).find(line=>line.startsWith(name+':'))||'';
const click = (page,selector) => page.value(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('no '+${JSON.stringify(selector)});e.click();})()`);
const pick = (page,value) => page.value(`(()=>{const s=document.querySelector('.dfight select[data-f="weather"]');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
const rule = key => `[data-a="arearule"][data-k="${key}"]`;
const saved = page => page.value(`JSON.parse(localStorage.getItem(LS.dmg)||'{}')`);
// A trainer slot by species id (the boss sheets' order is not the check's business).
const slotOf = (key,id) => {const index = byKey(key).p.findIndex(mon=>mon.id===id);return index<0?0:index;};

const checks = [{
  id:'unbound Mega boss',
  title:'Zeph uses the sheet Mega Houndoom, its EVs and moves in the calc',
  run:async page=>{
    const trainer=byKey('2.0.1');
    const index=trainer.p.findIndex(mon=>mon.id==='houndoom_mega');
    assert.ok(index>=0,'source boss Mega Houndoom');
    await enter(page,trainer.k,index);
    const mon=await page.value(`CALC.mon('foe')`);
    const source=trainer.p[index];
    assert.equal(mon.id,source.id);
    assert.equal(mon.i,'Houndoomite');
    assert.deepEqual(mon.ev,[6,252,0,0,0,252]);
    assert.deepEqual(mon.m,source.m);
    assert.ok(await page.count('.dres .mr:not(.em)'),'damage rows');
    assert.ok(await page.value(`typeof READERS.cfru==='function'`),'CFRU reader bundled');
  },
},{
  id:'unbound Z holder',
  title:'Expert Ryuzoji Mimikyu keeps its crystal and produces the signature Z-move',
  run:async page=>{
    const trainer=byKey('10.3.0');
    const index=trainer.p.findIndex(mon=>mon.i==='Mimikium Z');
    assert.ok(index>=0,'sheet Z holder');
    await enter(page,trainer.k,index);
    const result=await page.value(`(()=>{const m=CALC.mon('foe');return {item:m.i,z:DMG.calc({id:m.id,lv:m.l,nat:m.na,ab:m.a,it:m.i,iv:m.iv,ev:m.ev},{id:'mew',lv:50,ab:-1},{mv:M.indexOf('Play Rough'),z:true},{}).z};})()`);
    assert.equal(result.item,'Mimikium Z');
    assert.equal(result.z,"Let's Snuggle Forever");
  },
},{
  id:'unbound locked weather',
  title:'Moleman: permanent Vicious Sandstorm from the area, locked against the select, setters and old manual saves; the area switch turns the rule off, saved by trainer key; Reset fight brings it back',
  run:async page=>{
    const trainer=byKey('9.2.0');
    assert.ok(trainer.field.some(record=>record.effects?.some(effect=>effect.value==='Vicious Sandstorm'&&effect.locked)),'source lock');
    await fresh(page);
    await fight(page,trainer.k,'mew');
    assert.ok(await page.count('.dfarea'),'field evidence line');
    let f=await field(page);
    assert.equal(f.weather,'Vicious Sandstorm');
    assert.equal(f.weatherLock,'Vicious Sandstorm');
    assert.equal(await page.value(`document.querySelector('.dfight select[data-f="weather"]').disabled`),true,'weather select read-only');
    await pick(page,'Sun');
    await page.settle();
    assert.equal((await field(page)).weather,'Vicious Sandstorm','a weather pick cannot replace the lock');
    // A Drought setter entering does not replace it, nor does an old manual weather in the save.
    await fight(page,trainer.k,'groudon');
    assert.equal((await field(page)).weather,'Vicious Sandstorm','Drought cannot replace it');
    await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.field.weather='Sun';s.fman=[...(s.fman||[]),'weather'];localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
    await page.reload();
    await page.route('#/calc');
    assert.equal((await field(page)).weather,'Vicious Sandstorm','an old manual weather cannot bypass it');
    // The area switch: off removes the default weather and the lock; saved by trainer key; reload keeps it.
    assert.equal(await page.value(`document.querySelector('${rule('weather:Vicious Sandstorm:field')}').getAttribute('aria-pressed')`),'true');
    assert.match(await page.text(rule('weather:Vicious Sandstorm:field')),/Permanent Vicious Sandstorm/);
    await click(page,rule('weather:Vicious Sandstorm:field'));
    await page.settle();
    f=await field(page);
    assert.notEqual(f.weather,'Vicious Sandstorm','switched off');
    assert.equal(f.weatherLock,undefined);
    assert.deepEqual((await saved(page)).areaByTrainer,{[trainer.k]:{disabled:{'weather:Vicious Sandstorm:field':true},fogCleared:false}},'saved by trainer key and effect name');
    await page.reload();
    await page.route('#/calc');
    assert.equal((await field(page)).weatherLock,undefined,'still off after reload');
    await click(page,'[data-a="fightreset"]');
    await page.settle();
    f=await field(page);
    assert.equal(f.weatherLock,'Vicious Sandstorm','Reset fight restores the area rule');
    assert.equal((await saved(page)).areaByTrainer,undefined);
  },
},{
  id:'unbound Tessy',
  title:'Tessy: permanent Heavy Rain (Fire does nothing) and Camomons on both sides from the first two moves (a duplicate counts twice); an unknown first move waits; move edits retype',
  run:async page=>{
    const trainer=byKey('7.7.0');
    await fresh(page);
    await fight(page,trainer.k,'mew',0,['Flamethrower','Ice Beam','Psychic','Tackle']);
    const f=await field(page);
    assert.equal(f.weatherLock,'Heavy Rain');
    assert.equal(f.camomons,1,'Camomons from the area');
    assert.deepEqual(await page.value(`CALC.types('mine')`),['Fire','Ice'],'your types = first two moves');
    const foe=await page.value(`CALC.mon('foe')`);
    const foeTypes=foe.m.slice(0,2).map(index=>guide.MV[index]?.t).filter(Boolean);
    assert.deepEqual(await page.value(`CALC.types('foe')`),foeTypes,'foe types = its first two moves');
    assert.match(await note(page,'Camomons'),/You Fire\/Ice/);
    const fire=await page.value(`[...document.querySelectorAll('.dres:not(.na) .mr')].map(r=>[r.querySelector('.mv')?.textContent,r.querySelector('.hp')?.textContent])`);
    const flame=fire.find(([name])=>name==='Flamethrower');
    assert.ok(flame,'Flamethrower row');
    assert.equal(flame[1],'No effect','Fire does nothing in Heavy Rain: '+JSON.stringify(fire));
    // Edits: two Normal moves make Normal/Normal; an unknown first move waits for one.
    await page.value(`(()=>{CALC.set('mine','m',['Tackle','Body Slam','Psychic',null].map(n=>n==null?null:M.indexOf(n)));CALC.render();})()`);
    await page.settle();
    assert.deepEqual(await page.value(`CALC.types('mine')`),['Normal','Normal'],'a duplicate type counts twice (official calc)');
    await page.value(`(()=>{CALC.set('mine','m',[null,'Tackle',null,null].map(n=>n==null?null:M.indexOf(n)));CALC.render();})()`);
    await page.settle();
    assert.match(await page.text('.dres .dnote'),/Choose first move for Camomons/);
    assert.equal(await page.count('.dres .mr'),0,'no damage rows while it waits');
    // Mega keeps Camomons typing (types come from moves, not the form).
    await fight(page,trainer.k,'abomasnow_mega',0,['Earthquake','Ice Shard','Blizzard',null]);
    assert.deepEqual(await page.value(`CALC.types('mine')`),['Ground','Ice']);
  },
},{
  id:'unbound typed Tailwind',
  title:'Alice: Tailwind for Flying types on both sides (Charizard doubles, Mew does not); the area switch turns it off; ordinary Tailwind does not stack',
  run:async page=>{
    const trainer=byKey('2.6.1');
    await fresh(page);
    await fight(page,trainer.k,'charizard');
    const on=await page.value(`CALC.speed('mine')`);
    assert.match(await note(page,'Tailwind'),/You active/);
    await click(page,rule('typed-side-condition:Tailwind:both'));
    await page.settle();
    const off=await page.value(`CALC.speed('mine')`);
    assert.equal(on,off*2,'Flying-only Tailwind doubles Charizard');
    await click(page,rule('typed-side-condition:Tailwind:both'));
    await page.value(`(()=>{CALC.state().field.atkTailwind=1;CALC.state().fman.push('atkTailwind');CALC.render();})()`);
    await page.settle();
    assert.equal(await page.value(`CALC.speed('mine')`),on,'ordinary Tailwind on top does not double twice');
    await fight(page,trainer.k,'mew');
    await page.value(`(()=>{CALC.state().field.atkTailwind=0;CALC.render();})()`);
    await page.settle();
    assert.match(await note(page,'Tailwind'),/You not Flying/);
  },
},{
  id:'unbound typed Magnet Rise',
  title:'Galavan: Electric / Steel float on both sides; Gravity grounds them again; the readout follows',
  run:async page=>{
    const trainer=byKey('5.6.0');
    await fresh(page);
    await fight(page,trainer.k,'magnezone');
    assert.match(await note(page,'Magnet Rise'),/You active/);
    assert.deepEqual((await field(page)).atkMagnetRiseTypes,['Electric','Steel']);
    await page.value(`(()=>{CALC.state().field.gravity=1;CALC.state().fman.push('gravity');CALC.render();})()`);
    await page.settle();
    assert.match(await note(page,'Magnet Rise'),/You grounded/,'Gravity wins');
  },
},{
  id:'unbound weight Speed',
  title:'Big Mo: Speed = weight in kg on both sides, then Scarf / stages as usual (Abomasnow 135, Scarf 202, Mega 185); not Trick Room',
  run:async page=>{
    const trainer=byKey('6.13.1');
    await fresh(page);
    await fight(page,trainer.k,'abomasnow');
    assert.equal((await field(page)).weightSpeed,1);
    assert.equal(await page.value(`CALC.speed('mine')`),135);
    assert.match(await note(page,'Weight Speed'),/You 135/);
    await page.value(`(()=>{CALC.set('mine','i','Choice Scarf');CALC.render();})()`);
    await page.settle();
    assert.equal(await page.value(`CALC.speed('mine')`),202,'official order: Scarf after weight');
    await fight(page,trainer.k,'abomasnow_mega');
    assert.equal(await page.value(`CALC.speed('mine')`),185);
    assert.ok(!(await field(page)).trickRoom,'not Trick Room');
  },
},{
  id:'unbound field rules',
  title:'Elias Shadowy Veil (full HP Ghost only), Mel inverse, Vega Negative Energy, Arabella Misty + Pixies, Penny Rainbow, Marlon plain Rain: each from the area, on both sides',
  run:async page=>{
    await fresh(page);
    await fight(page,'9.2.1','gengar');
    assert.equal((await field(page)).shadowyVeil,1);
    assert.match(await note(page,'Shadowy Veil'),/You half damage/);
    await page.value(`(()=>{CALC.set('mine','hp',1);CALC.render();})()`);
    await page.settle();
    assert.match(await note(page,'Shadowy Veil'),/You no \(damaged\)/,'damaged Ghost loses it');
    await fight(page,'3.4.0','mew');
    assert.equal((await field(page)).inverse,1);
    await fight(page,'1.5.0','mew');
    assert.equal((await field(page)).negativeEnergy,1);
    await fight(page,'9.2.2','mew');
    let f=await field(page);
    assert.equal(f.terrain,'Misty');
    assert.equal(f.pixies,1);
    await fight(page,'9.2.3','mew');
    assert.equal((await field(page)).rainbow,1);
    await fight(page,'4.0.13','mew');
    f=await field(page);
    assert.equal(f.weather,'Rain');
    assert.equal(f.weatherLock,undefined,'Marlon rain is not locked');
    assert.equal(await page.value(`document.querySelector('.dfight select[data-f="weather"]').disabled`),false);
  },
},{
  id:'unbound Fog',
  title:'Mirskle: Fog from the area (accuracy readout); a manual weather replaces it and Auto brings it back; Defog clears it for the fight (saved), Reset fight returns it',
  run:async page=>{
    const trainer=byKey('0.4.0');
    await fresh(page);
    await fight(page,trainer.k,'mew',0,['Defog','Tackle',null,null]);
    assert.equal((await field(page)).weather,'Fog');
    assert.match(await note(page,'Fog accuracy'),/You ×0\.6/);
    await pick(page,'Rain');
    await page.settle();
    assert.equal((await field(page)).weather,'Rain','manual weather replaces Fog');
    await pick(page,'@auto');
    await page.settle();
    assert.equal((await field(page)).weather,'Fog','Fog returns');
    await click(page,'[data-a="defog"]');
    await page.settle();
    assert.notEqual((await field(page)).weather,'Fog','Defog clears it');
    assert.equal((await saved(page)).areaByTrainer?.[trainer.k]?.fogCleared,true);
    await page.reload();
    await page.route('#/calc');
    assert.notEqual((await field(page)).weather,'Fog','still cleared after reload');
    await click(page,'[data-a="fightreset"]');
    await page.settle();
    assert.equal((await field(page)).weather,'Fog','Reset fight brings it back');
  },
},{
  id:'unbound D2 assumed moves',
  title:'ordinary trainer calc set uses D2 defaults without changing the trainer card',
  run:async page=>{
    const trainer=byKey('0.1.0');
    const source=trainer.p[0];
    assert.deepEqual(source.m,[],'trainer card still moves unknown');
    await enter(page,trainer.k);
    const mon=await page.value(`CALC.mon('foe')`);
    const expected=assumedTrainerSet(guide,source,mon.l);
    assert.deepEqual(mon.m,expected.m,'TEMPLATE HANDOFF: foeBase must use assumedTrainerSet after resolving level');
    assert.equal(mon.mGuess,true,'TEMPLATE HANDOFF: guessed moves need a visible assumed marker');
  },
}];
const sizes = [[260,316],[480,392],[537,424],[832,424],[832,316]];
// The gimmick checks walk many states: the narrow and one wide size cover them (calc-layout covers every size).
const few = [[260,316],[832,424]];
await runChecks({name:'calc-unbound',file,checks:checks.map(check=>({...check,sizes:check.id.startsWith('unbound ')&&!['unbound Mega boss','unbound Z holder','unbound D2 assumed moves'].includes(check.id)?few:sizes}))});

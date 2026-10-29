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
const enter = async (page,key,slot=0) => {
  await page.route('#/calc');
  await page.value(`(()=>{if(!CALC.mon('mine'))CALC.use(byId.mew);CALC.enter(${JSON.stringify(key)},${slot});CALC.render();CALC.fit();})()`);
  await page.settle();
};
const checks = [{
  id:'unbound Mega boss',
  title:'Zeph uses the sheet Mega Houndoom, its EVs and moves in the calc',
  run:async page=>{
    const trainer=trainers.find(entry=>entry.k==='2.0.1');
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
    const trainer=trainers.find(entry=>entry.k==='10.3.0');
    const index=trainer.p.findIndex(mon=>mon.i==='Mimikium Z');
    assert.ok(index>=0,'sheet Z holder');
    await enter(page,trainer.k,index);
    const result=await page.value(`(()=>{const m=CALC.mon('foe');return {item:m.i,z:DMG.calc({id:m.id,lv:m.l,nat:m.na,ab:m.a,it:m.i,iv:m.iv,ev:m.ev},{id:'mew',lv:50,ab:-1},{mv:M.indexOf('Play Rough'),z:true},{}).z};})()`);
    assert.equal(result.item,'Mimikium Z');
    assert.equal(result.z,"Let's Snuggle Forever");
  },
},{
  id:'unbound field review',
  title:'Moleman retains the sheet comment and pending field; Vicious weather is available but not silently applied',
  run:async page=>{
    const trainer=trainers.find(entry=>entry.k==='9.2.0');
    const record=trainer.field.find(record=>record.text.startsWith('Vicious Sandstorm:'));
    assert.equal(record.review,true);
    assert.deepEqual(record.effects,[]);
    await enter(page,trainer.k);
    assert.ok(await page.count('.dfarea'),'field evidence card');
    const weather=await page.value(`({weather:CALC.state().field.weather||'',options:CF.calc.field.find(entry=>entry.k==='weather').o.map(entry=>entry[0])})`);
    assert.ok(weather.options.includes('Vicious Sandstorm'));
    assert.notEqual(weather.weather,'Vicious Sandstorm','unaccepted proposal stays off');
  },
},{
  id:'unbound D2 assumed moves',
  title:'ordinary trainer calc set uses D2 defaults without changing the trainer card',
  run:async page=>{
    const trainer=trainers.find(entry=>entry.k==='0.1.0');
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
await runChecks({name:'calc-unbound',file,checks:checks.map(check=>({...check,sizes}))});

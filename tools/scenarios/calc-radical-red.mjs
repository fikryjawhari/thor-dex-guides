// Radical Red's calc end to end (hacks/radical-red/notes.md → Damage calc, plans/radical-red.md → unit 9): a Hardcore
// boss's permanent primal weather from its battle effect, the AI's weather staying after its setter leaves
// (setterStays, Hardcore Main!E10), Ghost Marowak's 252 HP EVs (the only boss with EVs), the status-chip immunities
// (statusImmune: Toxic Boost / Flare Boost), unit 11's Speed modifiers (speedMods) and hazard immunity (hazardImmune) and
// the radicalred41 save profile refusing an Unbound save. RR only.
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {guideArg, readGuide, runChecks} from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/radical-red.html');
if (!existsSync(file)) {
  console.log('SKIP calc-radical-red: no built guide');
  process.exit(0);
}
const guide = readGuide(file).data;
if (guide.cfg.name !== 'Pokémon Radical Red' || !guide.cfg.calc) {
  console.log('SKIP calc-radical-red: requires its enabled calc profile');
  process.exit(0);
}
const trainers = guide.TR.g.flatMap(group=>group.sec.flatMap(section=>section.tr));
const byKey = key => {const trainer = trainers.find(entry=>entry.k===key);assert.ok(trainer,'trainer '+key);return trainer;};
const fresh = async page => {
  await page.route('#/calc');
  await page.value(`localStorage.removeItem(LS.dmg)`);
  await page.reload();
  await page.route('#/calc');
};
const fight = async (page,key,species,slot=0) => {
  await page.value(`(()=>{CALC.use(byId[${JSON.stringify(species)}]);CALC.enter(${JSON.stringify(key)},${slot});CALC.render();CALC.fit();})()`);
  await page.settle();
};
const field = page => page.value(`CALC.field()`);
const abilityName = index => guide.AB[index]?.[0];
const WEATHER_SETTERS = {Drought: 'Sun', Drizzle: 'Rain', 'Sand Stream': 'Sand', 'Snow Warning': 'Snow'};

const checks = [{
  id:'radical-red permanent weather',
  title:'Leader Blaine: the Hardcore battle effect Permanent Desolate Land locks Harsh Sunshine (the select is read-only)',
  run:async page=>{
    const trainer=byKey('11.5.7');
    assert.ok(trainer.field.some(record=>record.text==='Permanent Desolate Land'
      &&record.effects.some(effect=>effect.value==='Harsh Sunshine'&&effect.locked)),'source: the sheet battle effect');
    await fresh(page);
    await fight(page,trainer.k,'mew');
    const f=await field(page);
    assert.equal(f.weather,'Harsh Sunshine');
    assert.equal(f.weatherLock,'Harsh Sunshine');
    assert.equal(await page.value(`document.querySelector('.dfight select[data-f="weather"]').disabled`),true,'weather select read-only');
    assert.ok(await page.count('.dres .mr:not(.em)'),'damage rows');
  },
},{
  id:'radical-red setter stays',
  title:'a Hardcore weather setter with no battle effect: its weather stays when the trainer switches to another Pokémon',
  run:async page=>{
    assert.equal(await page.value('DMG.settings().setterStays'),true,'cfg.calc.setterStays (Hardcore Main!E10)');
    const found=trainers.map(trainer=>{
      if(trainer.field?.some(record=>record.effects?.some(effect=>effect.kind==='weather')))return null;
      const setter=trainer.p.findIndex(mon=>WEATHER_SETTERS[abilityName(mon.a)]);
      const other=trainer.p.findIndex(mon=>!WEATHER_SETTERS[abilityName(mon.a)]&&abilityName(mon.a)!=='Cloud Nine'&&abilityName(mon.a)!=='Air Lock');
      return setter>=0&&other>=0&&{trainer,setter,other,weather:WEATHER_SETTERS[abilityName(trainer.p[setter].a)]};
    }).find(Boolean);
    assert.ok(found,'a setter team without a battle effect');
    await fresh(page);
    await fight(page,found.trainer.k,'mew',found.setter);
    assert.equal((await field(page)).weather,found.weather,found.trainer.n+': the setter sets it');
    await fight(page,found.trainer.k,'mew',found.other);
    assert.equal((await field(page)).weather,found.weather,found.trainer.n+': it stays after the setter leaves');
  },
},{
  id:'radical-red Ghost Marowak',
  title:'Pokémon Tower Ghost: Alolan Marowak with its 252 HP EVs; player sets start at 0 EVs',
  run:async page=>{
    const trainer=byKey('6.1.0');
    const source=trainer.p[0];
    assert.equal(source.id,'marowak_alola');
    assert.deepEqual(source.ev,[252,0,0,0,0,0],'source EVs (data.js)');
    await fresh(page);
    await fight(page,trainer.k,'mew');
    const mon=await page.value(`CALC.mon('foe')`);
    assert.equal(mon.id,'marowak_alola');
    assert.deepEqual(mon.ev,[252,0,0,0,0,0]);
    assert.equal(mon.i,'Thick Club');
    assert.deepEqual(await page.value(`CALC.mon('mine').ev`),[0,0,0,0,0,0],'player EVs default to 0');
    assert.equal(await page.value(`!!document.querySelector('[data-ev]')||CF.calc.evs===true`),true,'EVs stay on');
  },
},{
  id:'radical-red status chip immunity',
  title:'Toxic Boost takes no poison chip and Flare Boost no burn chip (statusImmune); other holders do',
  run:async page=>{
    await page.route('#/calc');
    const chip=(species,ability,status)=>page.value(`(()=>{const ab=AB.findIndex(a=>a[0]===${JSON.stringify(ability)});
      return DMG.residual({id:${JSON.stringify(species)},lv:50,nat:'Serious',ab,it:'',st:${JSON.stringify(status)},iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]})
        .filter(r=>/poison|burn/i.test(r.l)).length;})()`);
    assert.equal(await chip('zangoose','Toxic Boost','psn'),0,'Toxic Boost: no poison chip');
    assert.equal(await chip('zangoose','Toxic Boost','tox'),0,'Toxic Boost: no bad poison chip');
    assert.equal(await chip('drifblim','Flare Boost','brn'),0,'Flare Boost: no burn chip');
    assert.ok(await chip('zangoose','Immunity','brn'),'another ability is burned');
    assert.ok(await chip('drifblim','Unburden','psn'),'another ability is poisoned');
  },
},{
  id:'radical-red speed modifiers',
  title:'the Speed readout follows RR: Upgrade Porygon-Z and Leek Stick Farfetch’d 1.5x, Quick Feet 2x when statused (speedMods rules)',
  run:async page=>{
    await fresh(page);
    await fight(page,byKey('11.5.7').k,'porygon_z');
    const bare=await page.value(`CALC.speed('mine')`);
    await page.value(`(()=>{CALC.set('mine','i','Upgrade');CALC.render();})()`);
    await page.settle();
    assert.equal(await page.value(`CALC.speed('mine')`),Math.ceil(bare*1.5-0.5),'Upgrade Porygon-Z');
    await fight(page,byKey('11.5.7').k,'farfetchd');
    const leekless=await page.value(`CALC.speed('mine')`);
    await page.value(`(()=>{CALC.set('mine','i','Leek Stick');CALC.render();})()`);
    await page.settle();
    assert.equal(await page.value(`CALC.speed('mine')`),Math.ceil(leekless*1.5-0.5),'Leek Stick Farfetch’d');
    const speed=status=>page.value(`(()=>{const ab=AB.findIndex(a=>a[0]==='Quick Feet');
      return DMG.speed({id:'ursaring',lv:50,nat:'Serious',ab,it:'',st:${JSON.stringify(status)},iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]},{});})()`);
    const healthy=await speed('');
    assert.equal(await speed('psn'),healthy*2,'Quick Feet poisoned');
    assert.equal(await speed('par'),healthy*2,'Quick Feet paralysed: no paralysis cut');
  },
},{
  id:'radical-red hazard immunity',
  title:'Shield Dust takes no entry hazard (hazardImmune); another ability takes the Stealth Rock and Spikes chip',
  run:async page=>{
    await page.route('#/calc');
    const entry=ability=>page.value(`(()=>{const ab=AB.findIndex(a=>a[0]===${JSON.stringify(ability)});
      const set={id:'ursaring',lv:50,nat:'Serious',ab,it:'',st:'',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]};
      const field={atkStealthRock:1,atkSpikes:1,atkToxicSpikes:1,atkStickyWeb:1};
      return {parts:DMG.entry(set,field).parts.length,hazards:DMG.hazards(set,field)};})()`);
    assert.deepEqual(await entry('Shield Dust'),{parts:0,hazards:null});
    const other=await entry('Compound Eyes');
    assert.ok(other.parts>=2&&other.hazards&&other.hazards.net<0,'Compound Eyes: '+JSON.stringify(other));
  },
},{
  id:'radical-red refuses an Unbound save',
  title:'the radicalred41 profile reads only RR saves: a valid Unbound 2.1 save is "Wrong game" and keeps the previous state',
  run:async page=>{
    await fresh(page);
    assert.equal(await page.value(`CF.calc.save+'/'+CF.calc.cfru`),'cfru/radicalred41');
    // 14 sectors signed by Unbound 2.1 (0x01121999), one save counter, right checksums; filled so the retail
    // checksum windows don't fit (else it reads as a vanilla save).
    const result=await page.value(`(()=>{const b=new Uint8Array(0x20000).fill(1),v=new DataView(b.buffer);
      const windows={0:0xF24,4:0xD98,13:0x450};
      for(let s=0;s<14;s++){const o=s*0x1000;b.fill(0,o+0xFF0,o+0x1000);let sum=0;
        for(let i=0;i<(windows[s]||0xFF0);i+=4)sum=(sum+v.getUint32(o+i,true))>>>0;
        v.setUint16(o+0xFF4,s,true);v.setUint16(o+0xFF6,((sum>>>16)+sum)&0xFFFF,true);v.setUint32(o+0xFF8,0x01121999,true);v.setUint32(o+0xFFC,1,true);}
      let direct;try{READERS.cfru(b,{cfg:{calc:{cfru:'unbound21'}},P:[],GID:{}});direct='read';}catch(e){direct=e.code;}
      let mine;try{READERS.cfru(b,{cfg:CF});mine='read';}catch(e){mine=e.code+': '+e.game;}
      return {direct,mine};})()`);
    assert.notEqual(result.direct,'wrong','the synthetic save is a readable Unbound save ('+result.direct+')');
    assert.equal(result.mine,'wrong: Pokémon Unbound 2.1 save');
    await page.value(`CALC.importFile(new File([(()=>{const b=new Uint8Array(0x20000).fill(1),v=new DataView(b.buffer);
      const windows={0:0xF24,4:0xD98,13:0x450};
      for(let s=0;s<14;s++){const o=s*0x1000;b.fill(0,o+0xFF0,o+0x1000);let sum=0;
        for(let i=0;i<(windows[s]||0xFF0);i+=4)sum=(sum+v.getUint32(o+i,true))>>>0;
        v.setUint16(o+0xFF4,s,true);v.setUint16(o+0xFF6,((sum>>>16)+sum)&0xFFFF,true);v.setUint32(o+0xFF8,0x01121999,true);v.setUint32(o+0xFFC,1,true);}
      return b;})()],'unbound.sav'))`);
    await page.settle();
    const ban=await page.value(`(()=>{const b=document.querySelector('.ban');return b?{t:b.textContent,ok:b.classList.contains('ok')}:null;})()`);
    assert.ok(ban&&!ban.ok&&/Wrong game/.test(ban.t)&&/Unbound/.test(ban.t),'banner: '+JSON.stringify(ban));
    assert.equal(await page.value(`CALC.state().imp||null`),null,'nothing imported');
  },
}];
const sizes =[[260,316],[480,392],[537,424],[832,424],[832,316]];
const few = [[260,316],[832,424]];
await runChecks({name:'calc-radical-red',file,checks:checks.map(check=>({...check,sizes:check.id==='radical-red permanent weather'||check.id==='radical-red Ghost Marowak'?sizes:few}))});

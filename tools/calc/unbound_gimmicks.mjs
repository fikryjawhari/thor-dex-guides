import assert from 'node:assert/strict';
import {savedUnboundOracle} from './unbound_saved_oracle.mjs';

export function checkUnboundGimmicks(data, engine) {
  const mon = (name = 'Mew', extra = {}) => {
    const species = data.P.find(entry => entry.n === name);
    assert.ok(species, name);
    return {id:species.id, lv:50, ab:-1, nat:'Hardy', iv:Array(6).fill(31), ev:Array(6).fill(0), ...extra};
  };
  const ability = name => {
    const index = data.AB.findIndex(entry => entry[0] === name);
    assert.ok(index >= 0, name);
    return index;
  };
  const move = name => {
    const index = data.M.indexOf(name);
    assert.ok(index >= 0, name);
    return index;
  };
  const plain = value => JSON.parse(JSON.stringify(value));
  const damage = (attack, defend, name, field = {}, slot = {}) => plain(engine.calc(attack, defend, {mv:move(name), ...slot}, field));
  const round = value => Math.ceil(value - 0.5);
  const rolls = (base, stab = 1, effectiveness = 1, final = 1) => Array.from({length:16}, (_, index) =>
    Math.max(1, round(Math.floor(round(Math.floor(base * (85 + index) / 100) * stab) * effectiveness) * final)));
  const base = (power, attack, defense) => Math.floor(Math.floor(22 * power * attack / defense) / 50) + 2;
  const neutral = mon();
  assert.deepEqual(plain(engine.stats(neutral)), [175,120,120,120,120,120]);
  const bond = damage(mon('Mew', {ab:ability('Brain Bond')}), neutral, 'Tackle');
  assert.deepEqual(bond.per, [rolls(19), rolls(5)], 'Brain Bond: 19 base, child round(19/4)=5 before random');
  const face = damage(neutral, mon('Mew', {ab:ability('Face Shield')}), 'Tackle');
  assert.deepEqual(face.rolls, rolls(base(40,120,180)), 'Face Shield: 120 Defense -> 180, base 13');
  assert.equal(face.pre.find(event => event.src === 'Dauntless Shield').by, 1);
  assert.deepEqual(damage(neutral, mon('Mew', {ab:ability('Face Shield'),entry:false}), 'Tackle').rolls, rolls(19));
  assert.deepEqual(damage(neutral, mon('Mew', {ab:ability('Face Shield')}), 'Tackle').rolls, face.rolls, 'fresh entry applies again without mutating the set');

  for (const [name, expected] of [['Abomasnow',135],['Mega Abomasnow',185],['Pikachu',6],['Bulbasaur',6]]) {
    assert.equal(engine.speed(mon(name), {weightSpeed:true}), expected, name+' weight Speed');
    assert.equal(engine.speed(mon(name, {it:'Choice Scarf',st:'par',stg:[0,0,0,0,0,6]}), {weightSpeed:true,atkTailwind:true}), expected, name+' final replacement, not a base-stat modifier');
  }
  assert.equal(damage(mon(), mon('Pikachu'), 'Gyro Ball', {weightSpeed:true}).bp, 38, 'internal weight speeds 4 vs 6: floor(25*6/4)+1');
  const typedWind = {atkTailwindTypes:['Flying'],defTailwindTypes:['Flying']};
  for (const side of ['atk','def']) {
    assert.equal(engine.speed(mon('Charizard'), typedWind, side), 240);
    assert.equal(engine.speed(neutral, typedWind, side), 120);
  }
  assert.equal(damage(neutral,mon('Charizard'),'Gyro Ball',typedWind).bp,51,'typed Tailwind reaches internal speed-dependent power');
  const rise = {atkMagnetRiseTypes:['Electric','Steel'],defMagnetRiseTypes:['Electric','Steel']};
  for (const name of ['Pikachu','Metagross']) {
    assert.equal(damage(neutral, mon(name), 'Earthquake', rise).max, 0, name+' typed Magnet Rise');
    assert.ok(damage(neutral, mon(name), 'Earthquake', {...rise,gravity:true}).min > 0);
    assert.ok(damage(neutral, mon(name,{it:'Iron Ball'}), 'Earthquake', rise).min > 0);
    assert.ok(damage(neutral, mon(name), 'Earthquake', {...rise,defGrounded:true}).min > 0);
  }
  assert.ok(damage(neutral, neutral, 'Earthquake', rise).min > 0);
  assert.deepEqual(plain(engine.entry(mon('Metagross'),{...rise,atkSpikes:3,atkToxicSpikes:2,atkStickyWeb:true})),{parts:[]},'typed Magnet Rise also grounds entry effects correctly');
  const attacker = mon('Mew', {moves:[move('Flamethrower'),move('Ice Beam')]});
  const defender = mon('Mew', {moves:[move('Vine Whip'),move('Tackle')]});
  const camomons = {camomons:true};
  assert.deepEqual(plain(engine.fieldEffects(attacker,camomons).types), ['Fire','Ice']);
  const camoHit = damage(attacker,defender,'Flamethrower',camomons);
  assert.deepEqual(camoHit.rolls, rolls(41,1.5,2), 'Camomons: base 41, Fire STAB and Grass weakness');
  assert.equal(camoHit.eff,2);
  assert.deepEqual(damage(attacker,defender,'Psychic',camomons).rolls, rolls(41), 'original Psychic STAB removed');
  assert.deepEqual(plain(engine.fieldEffects({...attacker,moves:[move('Tackle'),move('Tackle')]},camomons).types), ['Normal']);
  assert.deepEqual(plain(engine.fieldEffects({...attacker,moves:[move('Tackle')]},camomons).types), ['Normal']);
  assert.throws(() => engine.fieldEffects(neutral,camomons), /known first move/);
  assert.equal(engine.speed({...attacker,moves:[move('Fly'),move('Tackle')]}, {...camomons,...typedWind}),240);
  assert.equal(damage(attacker,{...defender,moves:[move('Thunderbolt'),move('Tackle')]},'Earthquake',{...camomons,...rise}).max,0);
  const rain = {weather:'Sun',weatherLock:'Heavy Rain'};
  assert.equal(damage(neutral,neutral,'Flamethrower',rain).max,0);
  assert.deepEqual(damage(neutral,neutral,'Surf',rain).rolls, rolls(61), 'Heavy Rain: base 41 -> half-down 61.5 = 61 before random');
  assert.equal(engine.derived(mon('Mew',{ab:ability('Drought')}),rain).weather,undefined);
  assert.deepEqual(damage(neutral,neutral,'Flamethrower',rain).rolls, damage(neutral,neutral,'Flamethrower',{weather:'Heavy Rain'}).rolls);
  const sand = {weather:'Sun',weatherLock:'Vicious Sandstorm'};
  assert.deepEqual(plain(engine.residual(mon('Pikachu'),sand)), [{l:'Vicious Sandstorm',v:[-13,-13,-13,-13]}]);
  assert.equal(engine.derived(mon('Mew',{ab:ability('Drought')}),sand).weather,undefined);
  assert.deepEqual(damage(neutral,mon('Garchomp'),'Surf',sand).rolls, damage(neutral,mon('Garchomp'),'Surf',{weather:'Vicious Sandstorm'}).rolls);
  assert.deepEqual(damage(mon('Mew',{ab:ability('Cloud Nine')}),mon('Garchomp'),'Surf',sand).rolls,damage(neutral,mon('Garchomp'),'Surf').rolls,'Cloud Nine suppresses Ground sand defence, without removing lock');
  const trainers = data.TR.g.flatMap(group => group.sec.flatMap(section => section.tr));
  const mel = trainers.find(trainer => trainer.k === '3.4.0');
  const normalFoe = mon(data.P.find(species => species.id === mel.p[0].id).n);
  assert.ok(engine.fieldEffects(normalFoe).types.includes('Normal'), 'fixture uses Mel actual lead');
  assert.equal(damage(neutral,normalFoe,'Shadow Ball').max,0);
  assert.equal(damage(neutral,normalFoe,'Shadow Ball',{inverse:true}).eff,2);
  assert.equal(damage(neutral,normalFoe,'Close Combat',{inverse:true}).eff,0.5);
  assert.equal(damage(neutral,mon('Gengar',{ab:ability('Levitate')}),'Earthquake',{inverse:true}).max,0,'inverse does not invert ability immunities');
  assert.deepEqual(damage(neutral,neutral,'Surf',{weather:'Rain'}).rolls,rolls(61),'Marlon ordinary Rain, not Heavy Rain');

  const ghost = mon('Gengar');
  const veil = {shadowyVeil:true};
  const ghostBase = base(90,120,95);
  assert.deepEqual(damage(neutral,ghost,'Psychic',veil).rolls, rolls(ghostBase,1.5,2,0.5));
  assert.deepEqual(damage(neutral,{...ghost,hp:134},'Psychic',veil).rolls, rolls(ghostBase,1.5,2), 'damaged Ghost has no veil');
  assert.deepEqual(damage(neutral,neutral,'Psychic',veil).rolls, rolls(41,1.5,0.5));
  assert.deepEqual(plain(engine.entry(ghost,{...veil,atkStealthRock:true,atkSpikes:3,atkToxicSpikes:2,atkStickyWeb:true})), {parts:[]});
  assert.ok(engine.entry({...ghost,hp:134},{...veil,atkStealthRock:true}).parts.length);
  assert.deepEqual(plain(engine.fieldEffects(neutral,veil).blockedMoves), ['Safeguard','Substitute']);
  assert.deepEqual(plain(engine.fieldEffects(ghost,veil).blockedMoves), []);
  assert.equal(engine.hp(neutral,ghost,{mv:move('Substitute')},veil),null);
  assert.ok(engine.hp(ghost,neutral,{mv:move('Substitute')},veil));
  const multiVeil = damage(neutral,ghost,'Psychic',veil,{hits:2});
  assert.deepEqual(multiVeil.per, [rolls(ghostBase,1.5,2,0.5),rolls(ghostBase,1.5,2)], 'veil only first hit');
  assert.equal(engine.fieldEffects(neutral,{weather:'Fog'}).accuracyMultiplier,0.6);
  for (const ab of ['Keen Eye','Infiltrator']) assert.equal(engine.fieldEffects(mon('Mew',{ab:ability(ab)}),{weather:'Fog'}).accuracyMultiplier,1);
  assert.equal(engine.fieldEffects(mon('Mew',{it:'Utility Umbrella'}),{weather:'Fog'}).accuracyMultiplier,1);
  assert.equal(engine.fieldEffects(mon('Mew',{it:'Utility Umbrella',ab:ability('Klutz')}),{weather:'Fog'}).accuracyMultiplier,0.6);
  assert.deepEqual(damage(neutral,neutral,'Tackle',{weather:'Fog'}).rolls,rolls(19));
  const negative = {negativeEnergy:true};
  assert.deepEqual(plain(engine.residual(mon('Pikachu'),negative)), [{l:'Negative Energy',v:[-9,-9,-9,-9]}]);
  for (const name of ['Mew','Gengar','Umbreon']) assert.deepEqual(plain(engine.residual(mon(name),negative)), []);
  for (const name of ['Unaware','Oblivious','Magic Guard']) assert.deepEqual(plain(engine.residual(mon('Pikachu',{ab:ability(name)}),negative)), []);
  assert.equal(engine.residual(mon('Pikachu'),{...negative,weather:'Sand'})[0].v[0],-9, 'negative energy stacks, independent of weather');
  const pixies = {pixies:true};
  for (const [name,stat] of [['Clefable','def'],['Mawile','spd']]) {
    const result = damage(neutral,mon(name),'Tackle',pixies);
    assert.equal(result.pre.find(event => event.src === 'Pixies').stat,stat);
  }
  const pixiePhysical = damage(neutral,mon('Clefable'),'Tackle',pixies);
  assert.deepEqual(pixiePhysical.rolls, rolls(base(40,120,139)), 'Clefable Defense 93 -> floor(93*1.5)=139');
  assert.equal(damage(mon('Clefable'),neutral,'Tackle',pixies).pre.find(event => event.src === 'Pixies').who,'atk');
  assert.equal(damage(neutral,mon('Clefable',{entry:false}),'Tackle',pixies).pre?.some(event => event.src === 'Pixies') || false,false);
  const fairy = {...neutral,moves:[move('Moonblast'),move('Tackle')]};
  assert.equal(engine.fieldEffects(fairy,{...pixies,camomons:true}).entryBoost,'def','ties choose Defense');
  assert.equal(engine.fieldEffects({...fairy,entry:false},{...pixies,camomons:true}).entryBoost,null);
  assert.equal(engine.fieldEffects(neutral,pixies).entryBoost,null);
  for (const [name,by] of [['Simple',2],['Contrary',-1]]) {
    const result = damage({...fairy,ab:ability(name)},defender,'Tackle',{...pixies,camomons:true});
    assert.equal(result.pre.find(event => event.src === 'Pixies').by,by,'Pixies uses ordinary stage modification '+name);
  }
  const dragon = mon('Dragonite',{ab:ability('Serene Grace')});
  const rainbow = engine.fieldEffects(dragon,{rainbow:true});
  assert.equal(rainbow.secondaryMultiplier,4);
  assert.equal(rainbow.flinchMultiplier,2);
  assert.equal(rainbow.poisonTouchMultiplier,2);
  assert.equal(engine.secondaryChance(dragon,30,{rainbow:true}),100);
  assert.equal(engine.secondaryChance(dragon,30,{rainbow:true},'flinch'),60);
  assert.equal(engine.secondaryChance(dragon,30,{rainbow:true},'poisonTouch'),60);
  assert.equal(engine.secondaryChance(mon('Dragonite'),10,{rainbow:true}),20);
  assert.equal(engine.fieldEffects(neutral,{rainbow:true}).secondaryMultiplier,1);
  const official = savedUnboundOracle();
  if (official) {
    const calc = official.calc;
    const generation = calc.Generations.get(8);
    const theirMon = (name, options = {}) => new calc.Pokemon(generation,name,{level:50,ability:'No Ability',nature:'Hardy',...options});
    const theirDamage = (attack,defend,name,field = {},overrides = {}) => plain(calc.calculate(generation,attack,defend,new calc.Move(generation,name,{overrides}),new calc.Field(field)).damage);
    assert.deepEqual(theirDamage(theirMon('Mew'),theirMon('Mew',{ability:'Face Shield'}),'Tackle'),face.rolls,'saved official Face Shield');
    assert.deepEqual(theirDamage(theirMon('Mew',{ability:'Parental Bond'}),theirMon('Mew'),'Tackle'),bond.per,'saved official standard Parental Bond (Brain Bond user alias)');
    assert.deepEqual(theirDamage(theirMon('Mew',{ability:'Brain Bond'}),theirMon('Mew'),'Tackle'),rolls(19),'official native Brain Bond name has no alias; user overrides it');
    assert.deepEqual(theirDamage(theirMon('Mew'),theirMon('Mew'),'Flamethrower',{weather:'Heavy Rain'}),0);
    for (const [name,expected] of [['Abomasnow',135],['Abomasnow-Mega',185],['Pikachu',6],['Bulbasaur',6]]) {
      const field = new calc.Field({isBigMoField:true});
      assert.equal(calc.getFinalSpeed(generation,theirMon(name),field,field.attackerSide),expected,'saved official weight '+name);
    }
    const weightField = new calc.Field({isBigMoField:true});
    assert.equal(calc.getFinalSpeed(generation,theirMon('Abomasnow',{item:'Choice Scarf'}),weightField,weightField.attackerSide),202,'official weight then modifiers; user literal final Speed is 135');
    const theirCamoAttack = theirMon('Mew',{overrides:{types:['Fire','Ice']}});
    const theirCamoDefense = theirMon('Mew',{overrides:{types:['Grass','Normal']}});
    assert.deepEqual(theirDamage(theirCamoAttack,theirCamoDefense,'Flamethrower'),rolls(43,1.5,2),'official native Flamethrower is 95 BP: explicit data disagreement');
    assert.deepEqual(theirDamage(theirCamoAttack,theirCamoDefense,'Flamethrower',{}, {basePower:90}),camoHit.rolls,'same 90 BP input agrees; Camomons controls copy the first two move types');
    assert.deepEqual(theirDamage(theirMon('Mew'),theirMon('Mew'),'Shadow Ball',{isInverseBattle:true}),damage(neutral,neutral,'Shadow Ball',{inverse:true}).rolls);
    assert.equal(theirDamage(theirMon('Mew'),theirMon('Gengar',{curHP:134}),'Psychic',{isShadowyVeil:true})[0],66,'official says always-on Ghost half damage, unlike sheet full-HP rule');
    console.log(`PASS saved official Unbound oracle: Face Shield, Parental Bond, Heavy Rain, weight Speed, Camomons, inverse; explicit Brain Bond/Flamethrower/Shadowy Veil differences (${official.files.length} hashed sources)`);
  } else console.log('PENDING official Unbound comparison: no saved page; host protection not bypassed');
  console.log('PASS Unbound hand fixtures: weight Speed, typed Tailwind/Magnet Rise, Camomons, locked weather, Mel inverse, Shadowy Veil, Fog, Negative Energy, Pixies, Rainbow');
}

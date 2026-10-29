import assert from 'node:assert/strict';

export function unboundCases(data) {
  const species = name => { const mon = data.P.find(entry => entry.n === name); assert.ok(mon, name); return mon.id; };
  const ability = name => { const index = data.AB.findIndex(entry => entry[0] === name); assert.notEqual(index, -1, name); return index; };
  const move = name => { const index = data.M.indexOf(name); assert.notEqual(index, -1, name); return index; };
  const mon = (name = 'Mew', extra = {}) => ({id: species(name), lv: 50, ab: -1, nat: 'Hardy', iv: Array(6).fill(31), ev: Array(6).fill(0), ...extra});
  const cases = [];
  const add = (name, attack, defend, attackMove, field = {}, slot = {}, difference) => cases.push({name, atk: mon('Mew', attack), def: mon('Mew', defend), slot: {mv: move(attackMove), ...slot}, field, ...(difference ? {difference} : {})});
  const atk = name => ({ab: ability(name)});
  const def = atk;
  const sand = {weather: 'Vicious Sandstorm'};
  add('Gen 8 neutral', {}, {}, 'Tackle');
  add('Gen 8 critical', {}, {}, 'Tackle', {}, {crit:true});
  add('Gen 8 burn', {st:'brn'}, {}, 'Tackle');
  add('Gen 8 EVs retained', {ev:[0,252,0,0,0,0]}, {}, 'Tackle');
  add('Gen 8 Z-move', {}, {}, 'Tackle', {}, {z:true});
  add('Vicious Weather Ball', {}, {}, 'Weather Ball', sand);
  add('Vicious Solar Beam', {}, {}, 'Solar Beam', sand);
  add('Vicious Solar Blade', {}, {}, 'Solar Blade', sand);
  add('Vicious Sand Force', atk('Sand Force'), {}, 'Earthquake', sand);
  add('Vicious Sand Force negative', atk('Sand Force'), {}, 'Tackle', sand);
  for (const name of ['Garchomp','Tyranitar','Rhyperior','Mew']) {
    add('Vicious SpD '+name, {}, {id:species(name)}, 'Psychic', sand);
    add('Vicious physical '+name, {}, {id:species(name)}, 'Tackle', sand);
  }
  for (const [name, hit] of [['Grass Dash','Energy Ball'],['Slippery Tail','Iron Tail']]) {
    add(name, atk(name), {}, hit);
    add(name+' low HP', {...atk(name),hp:1}, {}, hit);
    add(name+' negative', atk(name), {}, 'Tackle');
    add(name+' Psychic Terrain', atk(name), {}, hit, {terrain:'Psychic'});
    add(name+' Dazzling', atk(name), def('Dazzling'), hit);
  }
  for (const name of ['Bellow','Sound Waves']) {
    add(name+' attack', atk(name), {}, 'Hyper Voice');
    add(name+' defend', {}, def(name), 'Hyper Voice');
    add(name+' negative', atk(name), def(name), 'Tackle');
  }
  for (const name of ['Multieye','Multiscale','Shadow Shield']) {
    add(name+' full', {}, def(name), 'Psychic');
    add(name+' damaged', {}, {...def(name),hp:100}, 'Psychic');
    add(name+' rocks', {}, def(name), 'Psychic', {defStealthRock:true});
    add(name+' spikes', {}, def(name), 'Psychic', {defSpikes:1});
    add(name+' boots', {}, {...def(name),it:'Heavy-Duty Boots'}, 'Psychic', {defStealthRock:true,defSpikes:1});
  }
  for (const name of ['Icy Skin','Dusty Scales']) {
    add(name+' special', {}, def(name), 'Psychic');
    add(name+' physical negative', {}, def(name), 'Tackle');
  }
  add('Crabby Tactics physical', atk('Crabby Tactics'), {}, 'Tackle');
  add('Crabby Tactics special negative', atk('Crabby Tactics'), {}, 'Psychic');
  add('Honey Armor physical', {}, def('Honey Armor'), 'Tackle');
  add('Honey Armor special negative', {}, def('Honey Armor'), 'Psychic');
  add('Portal Power noncontact', {}, def('Portal Power'), 'Psychic');
  add('Portal Power contact negative', {}, def('Portal Power'), 'Tackle');
  add('Evaporate Water immunity', {}, def('Evaporate'), 'Surf');
  add('Evaporate negative', {}, def('Evaporate'), 'Psychic');
  add('Drill Beak', atk('Drill Beak'), {}, 'Drill Peck');
  add('Drill Beak negative', atk('Drill Beak'), {}, 'Tackle');
  add('Shadowy Veil Ghost', {}, {id:species('Gengar')}, 'Psychic', {shadowyVeil:true});
  add('Shadowy Veil negative', {}, {}, 'Psychic', {shadowyVeil:true});
  const docDifference = name => `${name}: guide ability description; hzla ff6c3e3 has no corresponding custom-name effect`;
  for (const name of ['Brain Bond','Face Shield','Subterfuge']) {
    add(name, name === 'Face Shield' ? {} : atk(name), name === 'Face Shield' ? def(name) : {}, name === 'Subterfuge' ? 'Flamethrower' : 'Tackle', {}, {}, docDifference(name));
  }
  for (const name of ['Cotton Cloud','Tangling Wool','Fiery Neigh','Shocking Neigh','Pride','Royal Roar','Focus Belt','Nine Lives']) {
    add(name+' initial damage', {}, def(name), 'Tackle');
  }
  for (const name of ['Endless Edge','InfernalRage','Metal Bash']) add(name, {}, {}, name);
  return cases;
}

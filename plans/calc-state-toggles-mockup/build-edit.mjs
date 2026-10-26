import {readFile, writeFile, mkdir} from 'node:fs/promises';

const data=JSON.parse(await readFile('hacks/photonic-sun/data.json','utf8'));
const trainers=data.TR.g.flatMap(group=>group.sec.flatMap(section=>section.tr));
const trainer=trainers.find(entry=>entry.n==='Captain Mallow'&&entry.p.length===6);
if(!trainer)throw new Error('Missing six-Pokemon Captain Mallow sample');
const sampleMon=async(name,level=50,item='',moves=[])=>{
  const species=data.P.find(entry=>entry.n===name);
  if(!species)throw new Error('Missing species '+name);
  const key=String(species.dex).padStart(4,'0')+(name.startsWith('Mega ')?'-mega':'');
  const sprite='data:image/png;base64,'+(await readFile('sprites/png/'+key+'.png')).toString('base64');
  return {name,level,item,moves,sprite};
};
const team=await Promise.all(trainer.p.map(mon=>sampleMon(data.P.find(entry=>entry.id===mon.id).n,mon.l,mon.i,mon.m.map(index=>data.M[index]))));
const inventory=await Promise.all(['Alakazam','Greninja','Gliscor','Snorlax','Gengar','Dragonite','Heracross','Mamoswine','Volcarona','Marshadow','Gigalith','Cloyster'].map(name=>sampleMon(name)));
const sample={trainer:trainer.n,team,inventory,player:await sampleMon('Greninja')};
const source=await readFile('plans/calc-state-toggles-mockup/edit.html','utf8');
await mkdir('dist',{recursive:true});
await writeFile('dist/calc-state-edit-mock.html',source.replace('__SAMPLE__',JSON.stringify(sample).replaceAll('<','\\u003c')));
console.log('Built sampled-data mock: dist/calc-state-edit-mock.html');

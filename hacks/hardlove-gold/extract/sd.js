// Showdown dist/data files -> one JSON (moves, move text, pokedex, ability text).
const fs=require('fs'),path=require('path');const d=process.argv[2];
const ld=f=>{const m={exports:{}};new Function('module','exports','require',fs.readFileSync(path.join(d,f),'utf8'))(m,m.exports,require);return m.exports;};
const mv=ld('moves.js').Moves,mt=ld('text/moves.js').MovesText,px=ld('pokedex.js').Pokedex,at=ld('text/abilities.js').AbilitiesText;
const o={moves:{},mtext:{},dex:{},atext:{}};
for(const[k,v] of Object.entries(mv))o.moves[k]={name:v.name,type:v.type,category:v.category,basePower:v.basePower,accuracy:v.accuracy,pp:v.pp,priority:v.priority,isMax:!!v.isMax,isZ:!!v.isZ,flags:Object.keys(v.flags||{})};
for(const[k,v] of Object.entries(mt))o.mtext[k]={shortDesc:v.shortDesc,desc:v.desc};
for(const[k,v] of Object.entries(px))o.dex[k]={num:v.num,name:v.name,baseSpecies:v.baseSpecies,forme:v.forme,types:v.types,baseStats:v.baseStats,abilities:v.abilities,requiredItem:v.requiredItem};
for(const[k,v] of Object.entries(at))o.atext[k]={name:v.name,shortDesc:v.shortDesc||v.desc};
fs.writeFileSync(process.argv[3],JSON.stringify(o));console.log(Object.keys(o).map(k=>k+' '+Object.keys(o[k]).length).join(', '));

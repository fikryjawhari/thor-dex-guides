if(typeof window==='undefined')globalThis.window=globalThis;
(() => {
window.READERS=window.READERS||{};
window.READERS.test=(bytes,data)=>{let result;try{result=JSON.parse(new TextDecoder().decode(bytes));}catch(error){throw {code:'unreadable'};}if(result.magic!=='dexcalc-test')throw {code:'wrong',game:result.game};if(result.error)throw {code:['wrong','state','unreadable','empty'].includes(result.error)?result.error:'unreadable',game:result.game};if(!Array.isArray(result.party)||!result.party.length)throw {code:'empty'};if(!Array.isArray(result.boxes)||result.boxes.some(box=>!Array.isArray(box)))throw {code:'unreadable'};return result;};
})();

if(typeof module!=='undefined'&&require.main===module){
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
for(const family of ['expansion','gen4','gen5','gen67'])require('./'+family+'.js');
let checks=0;
function equal(actual,expected,label){assert.deepStrictEqual(actual,expected,label);checks++;}
function rejects(bytes,code,game){assert.throws(()=>READERS.gen5(bytes,{}),error=>error.code===code&&(!game||error.game?.includes(game)));checks++;}
function crc(bytes){let value=65535;for(const byte of bytes){value^=byte<<8;for(let bit=0;bit<8;bit++)value=((value<<1)^((value&32768)?0x1021:0))&65535;}return value;}
function seal(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 function block(start,length,checksum,id){const actual=crc(bytes.subarray(start,start+length));view.setUint16(checksum,actual,true);view.setUint16(0x25F00+id*2,actual,true);}
 block(0,0x3E0,0x3E2,0);block(0x18E00,0x534,0x19336,26);block(0x19400,0xB0,0x194B2,27);
 for(let box=0;box<24;box++){const start=0x400+box*0x1000;block(start,0xFF0,start+0xFF2,box+1);}
 view.setUint16(0x25FA2,crc(bytes.subarray(0x25F00,0x25F94)),true);return bytes;}
function specimen(party=false){const raw=new Uint8Array(party?220:136),view=new DataView(raw.buffer);
 view.setUint32(0,1,true);view.setUint16(8,25,true);view.setUint16(0x0A,234,true);view.setUint32(0x10,125000,true);raw[0x15]=9;raw[0x41]=24;raw[0x8C]=50;
 raw.set([1,2,3,6,4,5],0x18);view.setUint32(0x38,31,true);view.setUint16(0x28,85,true);
 view.setUint16(0x48,0xC9,true);view.setUint16(0x4A,0x246D,true);view.setUint16(0x4C,0xFFFF,true);raw.set([10,0,0,0],0x30);raw[0x34]=3;
 let sum=0;for(let offset=8;offset<136;offset+=2)sum+=view.getUint16(offset,true);view.setUint16(6,sum&65535,true);
 function crypt(start,end,seed){for(let offset=start;offset<end;offset+=2){seed=Number((BigInt(seed)*0x41C64E6Dn+0x6073n)&0xFFFFFFFFn);view.setUint16(offset,view.getUint16(offset,true)^(seed>>>16),true);}}
 crypt(8,136,sum&65535);if(party)crypt(136,220,1);return raw;}
function blank(){const bytes=new Uint8Array(0x80000);bytes[0x1941F]=23;return seal(bytes);}
const bytes=blank();bytes[0x18E04]=1;bytes.set(specimen(true),0x18E08);bytes.set(specimen(),0x17400+29*136);seal(bytes);
const data={GID:{gr:{'25:0':0}}},copy=bytes.slice(),parsed=READERS.gen5(bytes,data);
equal(parsed.game,'B2W2','game');equal(parsed.party.length,1,'party');equal(parsed.boxes.length,24,'retained boxes');equal(parsed.boxes[23].length,1,'last slot');
equal(parsed.party[0],{pid:1,sp:'25:0',lv:50,nat:24,ab:9,it:234,mv:[85,0,0,0],iv:[31,0,0,0,0,0],ev:[1,2,3,4,5,6],nickname:'É♂',pp:[10,0,0,0],ppUps:[3,0,0,0]},'all fields');
equal(parsed.boxes[23][0].lv,50,'experience level');equal(bytes,copy,'input immutable');
const wrapped=Buffer.concat([Buffer.alloc(7),Buffer.from(bytes),Buffer.alloc(9)]);equal(READERS.gen5(wrapped.subarray(7,7+bytes.length),data),parsed,'nonzero byte offset');
equal(READERS.gen5(Buffer.concat([bytes,Buffer.from('|-DESMUME SAVE-|')]),data),parsed,'dsv footer');
rejects(Buffer.concat([bytes,Buffer.from('not a footer')]),'wrong');rejects(Buffer.concat([bytes,Buffer.alloc(200),Buffer.from('|-DESMUME SAVE-|')]),'wrong');
rejects(bytes.subarray(0,0x7FFFF),'unreadable');rejects(new Uint8Array(0x80000),'empty');rejects(new Uint8Array(0x80000).fill(255),'empty');rejects(blank(),'empty');
for(const header of ['\x89PNG','RASTATE','MELN','DeSmuME','\x1F\x8B'])rejects(Uint8Array.from(header,char=>char.charCodeAt(0)),'state');
for(const offset of [0x18E10,0x400,0x17400+29*136,0x25F00,0x19336,0x25FA2,0x19400]){const changed=bytes.slice();changed[offset]^=1;rejects(changed,'unreadable');}
const badMon=bytes.slice();badMon[0x18E10]^=1;rejects(seal(badMon),'unreadable');
const badCount=bytes.slice();badCount[0x18E04]=7;rejects(seal(badCount),'unreadable');
const badVersion=bytes.slice();badVersion[0x1941F]=21;rejects(seal(badVersion),'wrong');
const onlyBoxes=bytes.slice();onlyBoxes[0x18E04]=0;equal(READERS.gen5(seal(onlyBoxes),data).party,[],'box only');
equal(READERS.gen5(bytes,{}).boxes[23][0].lv,null,'missing growth');
for(let rate=0;rate<6;rate++)equal(typeof READERS.gen5(bytes,{GID:{gr:{'25:0':rate}}}).boxes[23][0].lv,'number','growth '+rate);
const testFixture={magic:'dexcalc-test',game:'test',party:[{}],boxes:[[]]};equal(READERS.test(new TextEncoder().encode(JSON.stringify(testFixture))),testFixture,'synthetic reader unchanged');
for(const family of ['expansion','gen4','gen67']){assert.throws(()=>READERS[family](Uint8Array.from([0x89,80,78,71]),{}),error=>error.code==='state');checks++;}
console.log('PASS readers: '+checks+' self-contained assertions; expansion/gen4/gen67 state controls; gen5 fields/CRC/containers');
const root=path.resolve(__dirname,'../../..'),saveDir=path.join(root,'hacks/blaze-black-2-redux/.src/saves');
if(fs.existsSync(path.join(saveDir,'pkhex-b2w2-black2.sav'))){
 const ids=JSON.parse(fs.readFileSync(path.join(root,'hacks/blaze-black-2-redux/extract/gen5-ids.json'),'utf8'));
 const oracleData={GID:{gr:Object.fromEntries(ids.forms.map(([species,form,growth])=>[species+':'+form,growth]))}};
 let count=0,fields=0;
 for(const name of ['black2','white2','box-only']){const stem=path.join(saveDir,'pkhex-b2w2-'+name),input=fs.readFileSync(stem+'.sav'),snapshot=Buffer.from(input),expected=JSON.parse(fs.readFileSync(stem+'.expected.json','utf8')),actual=READERS.gen5(input,oracleData);
  equal(actual,expected,name+' complete PKHeX result');equal(input,snapshot,name+' immutable');
  for(const pokemon of actual.party.concat(actual.boxes.flat())){count++;fields+=Object.keys(pokemon).length;}
 }
 const controls={bw1:['wrong','BW1'],gen4:['wrong','Gen 4'],'party-crc':['unreadable'],'box-crc':['unreadable'],'table-crc':['unreadable'],mirror:['unreadable'],'pk5-checksum':['unreadable'],count:['unreadable'],game:['wrong'],truncated:['unreadable'],state:['state']};
 for(const [name,[code,game]] of Object.entries(controls))rejects(fs.readFileSync(path.join(saveDir,'pkhex-b2w2-control-'+name+'.sav')),code,game);
 for(const name of ['empty','egg-only'])rejects(fs.readFileSync(path.join(saveDir,'pkhex-b2w2-'+name+'.sav')),'empty');
 console.log('PASS gen5 PKHeX oracle: '+count+' Pokemon, '+fields+' fields, 0 mismatches; '+(Object.keys(controls).length+2)+' controls rejected');
}else{
 if(process.env.GEN5_ORACLE_REQUIRED==='1')throw new Error('Generate PKHeX B2W2 oracle fixtures first (README recipe)');
 console.log('SKIP gen5 PKHeX oracle: local fixtures absent (set GEN5_ORACLE_REQUIRED=1 to require them)');
}
}

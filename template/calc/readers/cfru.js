// Save reader: CFRU (Complete FireRed Upgrade) GBA hacks. Format notes: template/calc/readers/README.md → cfru.
// READERS.cfru(bytes, data) -> {game, party, boxes} in game ids (data.GID maps them; GID.gr gives boxed levels),
// or throws {code: 'wrong' | 'state' | 'unreadable' | 'empty', game}.
(() => {
window.READERS=window.READERS||{};
// One profile per hack's save format: its sector signature, box count, randomiser flags and experience table. A guide
// names its own in cfg.calc.cfru; unset, any profile here is accepted. Radical Red adds its own entry (README → cfru).
const PROFILES={
 unbound21:{game:'Pokémon Unbound 2.1',signature:0x01121999,boxes:25,randomiser:[0x9FD,0x9FE],exp:'unbound'}},
OTHER={0x08012025:'FireRed / LeafGreen or Emerald (not CFRU)',0x01122000:'Pokémon Unbound 2.2 or later',0x01121998:'Pokémon Unbound 2.0',0x29012004:'A CFRU base build (CFRE)'};
const SECTOR=0x1000,DATA=0xFF0,SLOT=14,CHECKED={0:0xF24,4:0xD98,13:0x450},BOX=58,PARTY=100,
STATS=[0,1,2,4,5,3];                                  // the game's HP Atk Def Spe SpA SpD -> HP Atk Def SpA SpD Spe
// Box storage in CFRU's 25-box layout: [sector id, from, to] runs joined in order; boxes 1-19 fill the vanilla storage
// sectors, 20-22 the slot-independent sectors 30 / 31, 23-24 the ends of 2 / 3, box 25 the end of sector 0.
const RUNS=[[[5,4,DATA],[6,0,DATA],[7,0,DATA],[8,0,DATA],[9,0,DATA],[10,0,DATA],[11,0,DATA],[12,0,DATA],[13,0,DATA]],
 [[30,0xB0C,DATA],[31,0,0xF80]],[[2,0xF18,DATA],[3,0,0xCC0]],[[0,0xB0,0xB0+30*BOX]]],RUN_BOXES=[19,3,2,1];
// Experience for a level by growth rate (GROWTH_ order: medium fast, erratic, fluctuating, medium slow, fast, slow):
// pokefirered's formulas, or with u = 'unbound' Unbound's own table, which differs at a few levels (README → cfru).
const expFor=(rate,n,u)=>{if(n<=1)return n;const c=n*n*n,d=Math.floor;switch(rate){case 0:return c;case 1:return n<=50?d((100-n)*c/50):n<=68?d((150-n)*c/100):n<=98?(u?d((1911-10*n)*c/1500):d(d((1911-10*n)/3)*c/500)):d((160-n)*c/100);case 2:return (n<=15?d((d((n+1)/3)+24)*c/50):n<=36?d((n+14)*c/50):d((d(n/2)+32)*c/50))-(u&&[5,37,45,85].includes(n));case 3:return d(6*c/5)-15*n*n+100*n-140-(u&&n%10===5);case 4:return d(4*c/5);case 5:return d(5*c/4);}return null;};
const levelFor=(rate,exp,u)=>{if(rate==null)return null;let level=1;while(level<=100&&expFor(rate,level,u)<=exp)level++;return level-1;};
function isState(bytes){const head=String.fromCharCode(...bytes.subarray(0,8));return head.startsWith('\x89PNG')||head.startsWith('RASTATE')||bytes[0]===0x1f&&bytes[1]===0x8b;}
// A slot is its 14 sectors: every id 0-13 once, one signature and save counter, each checksum right.
function readSlot(view,base){const ids=new Map();let signature=null,counter=null;
 for(let s=0;s<SLOT;s++){const o=base+s*SECTOR,id=view.getUint16(o+0xFF4,true),sig=view.getUint32(o+0xFF8,true),count=view.getUint32(o+0xFFC,true);
  if(id>=SLOT||ids.has(id))return {signature:s?signature:sig};
  if(signature===null){signature=sig;counter=count;}else if(sig!==signature||count!==counter)return {signature};
  let sum=0;for(let i=0;i<(CHECKED[id]||DATA);i+=4)sum=(sum+view.getUint32(o+i,true))>>>0;
  if((((sum>>>16)+sum)&0xFFFF)!==view.getUint16(o+0xFF6,true))return {signature};
  ids.set(id,o);}
 return {signature,counter,ids};}
// The newest valid slot whose signature is one this guide reads (the game ignores a slot signed by another build).
function pick(bytes,view,accepted){const slots=[readSlot(view,0),readSlot(view,SLOT*SECTOR)],ok=slots.filter(s=>s.ids&&accepted.has(s.signature));
 if(ok.length===2){const [a,b]=ok.map(s=>s.counter);return a===0xFFFFFFFF&&b===0?ok[1]:b===0xFFFFFFFF&&a===0?ok[0]:b>a?ok[1]:ok[0];}
 if(ok.length)return ok[0];
 const signed=slots.map(s=>s.signature).filter(s=>s!=null&&s!==0xFFFFFFFF&&s!==0);
 if(signed.some(s=>accepted.has(s)))throw {code:'unreadable'};                       // this game's slot, damaged
 const known=signed.map(s=>OTHER[s]||Object.values(PROFILES).find(p=>p.signature===s)?.game).find(Boolean);
 if(known)throw {code:'wrong',game:known+' save'};
 if(!signed.length&&bytes.subarray(0,SLOT*2*SECTOR).every(b=>b===0xFF||b===0))throw {code:'empty'};
 throw {code:'wrong'};}
function flag(sector,f){const i=f-0x900,byte=i>>3,size=DATA-CHECKED[0];     // CFRU flags 0x900+: end of sector 0, then sector 4
 return (byte<size?sector(0)[CHECKED[0]+byte]:sector(4)[CHECKED[4]+byte-size])>>(i&7)&1;}
// Ability slot as the game picks it: hidden if the bit is set and the species has one, else personality bit 0 when
// the species has a second ability, else the first (the species from the guide's data, when the id maps).
function slotOf(species,pid,hidden){if(!species)return hidden?2:pid&1;if(hidden&&species.ha>=0)return 2;return pid&1&&species.a?.[1]!=null?1:0;}
function boxMon(b,o,ctx){const v=new DataView(b.buffer,b.byteOffset+o,BOX),pid=v.getUint32(0,true),sp=v.getUint16(28,true),sanity=v.getUint8(19),ivs=v.getUint32(54,true);
 if(!sp||sanity&1||sanity&4||ivs>>>30&1)return null;            // empty, Bad Egg, egg
 const packed=v.getUint32(39,true)+v.getUint8(43)*2**32;          // four 10-bit moves in 5 bytes
 return {pid,sp,lv:levelFor(ctx.gr?.[sp],v.getUint32(32,true),ctx.exp==='unbound'),nat:pid%25,abs:slotOf(ctx.species(sp),pid,ivs>>>31),it:v.getUint16(30,true),
  mv:[0,1,2,3].map(i=>Math.floor(packed/2**(10*i))&0x3FF),iv:STATS.map(i=>ivs>>>(5*i)&31),ev:STATS.map(i=>v.getUint8(44+i))};}
function partyMon(b,o,ctx){const v=new DataView(b.buffer,b.byteOffset+o,PARTY),pid=v.getUint32(0,true),flags=v.getUint8(19),sp=v.getUint16(0x20,true),ivs=v.getUint32(0x48,true);
 if(!(flags&2)||flags&1||flags&4||!sp||ivs>>>30&1)return null;    // no species, Bad Egg, egg
 return {pid,sp,lv:v.getUint8(0x54),nat:pid%25,abs:slotOf(ctx.species(sp),pid,ivs>>>31),it:v.getUint16(0x22,true),
  mv:[0,1,2,3].map(i=>v.getUint16(0x2C+2*i,true)),iv:STATS.map(i=>ivs>>>(5*i)&31),ev:STATS.map(i=>v.getUint8(0x38+i))};}
window.READERS.cfru=(bytes,data)=>{
 if(isState(bytes))throw {code:'state'};
 if(bytes.length<0x20000||bytes.length>0x20000+64)throw {code:'wrong',game:bytes.length===0x10000?'A 64 KB save: not this game':undefined};
 const want=data?.cfg?.calc?.cfru,profiles=want?[PROFILES[want]].filter(Boolean):Object.values(PROFILES);
 if(!profiles.length)throw {code:'unreadable'};
 const view=new DataView(bytes.buffer,bytes.byteOffset,0x20000),slot=pick(bytes,view,new Set(profiles.map(p=>p.signature)));
 const profile=profiles.find(p=>p.signature===slot.signature);
 const sector=id=>id>=SLOT?bytes.subarray(id*SECTOR,id*SECTOR+DATA):bytes.subarray(slot.ids.get(id),slot.ids.get(id)+DATA);
 // Randomised saves (species / learnset randomiser flags, or the Egglocke tool's trainer) map to the wrong species.
 const s0=sector(0),egglocke=[0xBF,0xDB,0xDB,0xE0,0xE3,0xD7,0xDF].every((c,i)=>s0[i]===c)&&new DataView(s0.buffer,s0.byteOffset).getUint32(0xA,true)===0x3CEAB505;
 if(egglocke||profile.randomiser.some(f=>flag(sector,f)))throw {code:'wrong',game:'A randomised '+profile.game+' save: not supported'};
 const P=data?.P?new Map(data.P.map(p=>[p.id,p])):null,ctx={gr:data?.GID?.gr,exp:profile.exp,species:sp=>P?.get(data.GID?.sp?.[sp])};
 const block1=sector(1),count=block1[0x34];
 if(count>6)throw {code:'unreadable'};
 const party=[];for(let i=0;i<count;i++){const m=partyMon(block1,0x38+PARTY*i,ctx);if(m)party.push(m);}
 const boxes=[];
 RUNS.forEach((runs,r)=>{if(boxes.length>=profile.boxes)return;
  const parts=runs.map(([id,from,to])=>sector(id).subarray(from,to)),all=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));
  let at=0;for(const p of parts){all.set(p,at);at+=p.length;}
  for(let b=0;b<RUN_BOXES[r]&&boxes.length<profile.boxes;b++){const box=[];for(let i=0;i<30;i++){const m=boxMon(all,(b*30+i)*BOX,ctx);if(m)box.push(m);}boxes.push(box);}});
 if(!party.length&&!boxes.some(b=>b.length))throw {code:'empty'};
 return {game:profile.game,party,boxes};};
})();

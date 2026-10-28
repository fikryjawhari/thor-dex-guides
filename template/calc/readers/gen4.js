// Save reader: Gen 4 NDS (HeartGold hg-engine). Format notes: template/calc/readers/README.md → gen4.
// READERS.gen4(bytes, data) -> {game, party, boxes} in game ids (data.GID maps them; GID.gr gives boxed levels),
// or throws {code: 'wrong' | 'state' | 'unreadable' | 'empty', game}.
(() => {
window.READERS=window.READERS||{};
const STORED=136,PARTY=236,MAGIC=0x20060623,FILE=0x80000,HALF=0x40000,STATS=[0,1,2,4,5,3],     // the game's HP Atk Def Spe SpA SpD -> HP Atk Def SpA SpD Spe
ORDERS=['0123','0132','0213','0312','0231','0321','1023','1032','2013','3012','2031','3021','1203','1302','2103','3102','2301','3201','1230','1320','2130','3120','2310','3210'],
// hg-engine HGSS: both blocks enlarged (vanilla HGSS is 0xF628 / 0x12310 at 0xF700 with 18 boxes)
LAYOUT={game:'HeartGold (hg-engine)',general:0xFFA0,storage:0x10000,storageSize:0x1E4FC,boxes:30,partyCount:0x94,party:0x98};
const expFor=(rate,n)=>{if(n<=1)return 0;const c=n*n*n,d=Math.floor;switch(rate){case 0:return c;case 1:return n<=50?d((100-n)*c/50):n<=68?d((150-n)*c/100):n<=98?d(d((1911-10*n)/3)*c/500):d((160-n)*c/100);case 2:return n<=15?d((d((n+1)/3)+24)*c/50):n<=36?d((n+14)*c/50):d((d(n/2)+32)*c/50);case 3:return d(6*c/5)-15*n*n+100*n-140;case 4:return d(4*c/5);case 5:return d(5*c/4);}return null;};
const levelFor=(rate,exp)=>{if(!Number.isInteger(rate)||rate<0||rate>5)return null;let level=1;while(level<100&&expFor(rate,level+1)<=exp)level++;return level;};
function isState(bytes){const head=String.fromCharCode(...bytes.subarray(0,8));return head.startsWith('\x89PNG')||head.startsWith('RASTATE')||head.startsWith('MELN')||bytes[0]===0x1f&&bytes[1]===0x8b;}
function crc(bytes){let value=0xFFFF;for(const byte of bytes){value^=byte<<8;for(let bit=0;bit<8;bit++)value=((value<<1)^((value&0x8000)?0x1021:0))&0xFFFF;}return value;}
// A block's footer (last 16 bytes): u32 save count, u32 size, u32 magic, u16 block id, u16 CRC-16/CCITT of the rest.
function footer(view,offset,size,id){const at=offset+size-16;
 return view.getUint32(at+4,true)===size&&view.getUint32(at+8,true)===MAGIC&&view.getUint16(at+12,true)===id?{count:view.getUint32(at,true),crc:view.getUint16(at+14,true)}:null;}
// The newer of the two partitions' copies of a block whose CRC holds; found counts footers whatever their CRC.
function newest(bytes,view,offset,size,id){let best=null,found=0;
 for(const base of [0,HALF]){const f=footer(view,base+offset,size,id);if(!f)continue;found++;
  if(crc(bytes.subarray(base+offset,base+offset+size-16))===f.crc&&(!best||f.count>best.count))best={count:f.count,at:base+offset};}
 return {best,found};}
function crypt(bytes,seed){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 for(let offset=0;offset<bytes.length;offset+=2){seed=(Math.imul(seed,0x41C64E6D)+0x6073)>>>0;view.setUint16(offset,view.getUint16(offset,true)^(seed>>>16),true);}}
function mon(bytes,offset,party,data){const raw=bytes.slice(offset,offset+(party?PARTY:STORED));
 if(raw.every(byte=>byte===0))return null;
 const head=new DataView(raw.buffer),pid=head.getUint32(0,true),checksum=head.getUint16(6,true);
 crypt(raw.subarray(8,STORED),checksum);if(party)crypt(raw.subarray(STORED),pid);
 let sum=0;for(let i=8;i<STORED;i+=2)sum+=head.getUint16(i,true);if((sum&0xFFFF)!==checksum)return null;       // a Bad Egg
 const can=raw.slice(),order=ORDERS[((pid>>>13)&31)%24];
 for(let block=0;block<4;block++)can.set(raw.subarray(8+Number(order[block])*32,8+(Number(order[block])+1)*32),8+block*32);
 const view=new DataView(can.buffer),species=view.getUint16(0x08,true),exp=view.getUint32(0x10,true),ivs=view.getUint32(0x38,true);
 if(!species||ivs>>>30&1)return null;                                                                 // empty or an egg
 const sp=species+':'+(can[0x40]>>>3),mint=view.getUint16(0x42,true)>>>1&31,gr=data?.GID?.gr||{};
 const lv=party?can[0x8C]:levelFor(gr[sp]??gr[species+':0'],exp&0x1FFFFF);
 return {pid,sp,lv,nat:mint?mint-1:pid%25,ab:can[0x15]|(exp>>>31)<<8,it:view.getUint16(0x0A,true),
  mv:[0,1,2,3].map(slot=>view.getUint16(0x28+slot*2,true)),iv:STATS.map(stat=>ivs>>>(stat*5)&31),ev:STATS.map(stat=>can[0x18+stat])};}
window.READERS.gen4=(bytes,data)=>{
 if(isState(bytes))throw {code:'state'};
 const tail=String.fromCharCode(...bytes.subarray(FILE,FILE+128));                // DeSmuME .dsv: the 512 KB, then its own footer
 if(bytes.length<FILE||bytes.length>FILE&&!tail.includes('DESMUME'))throw {code:'wrong',game:bytes.length===0x20000||bytes.length===0x10000?'A GBA-sized save: not this game':undefined};
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),L=LAYOUT;
 const general=newest(bytes,view,0,L.general,0),storage=newest(bytes,view,L.storage,L.storageSize,1);
 if(!general.found&&!storage.found){if(bytes.subarray(0,FILE).every(byte=>byte===0xFF)||bytes.subarray(0,FILE).every(byte=>byte===0))throw {code:'empty'};throw {code:'wrong',game:'Not a '+L.game+' save'};}
 if(!general.best||!storage.best)throw {code:'unreadable'};
 const count=view.getUint32(general.best.at+L.partyCount,true);if(count>6)throw {code:'unreadable'};
 const party=[];for(let i=0;i<count;i++){const m=mon(bytes,general.best.at+L.party+i*PARTY,true,data);if(m)party.push(m);}
 if(!party.length)throw {code:'empty'};
 const boxes=Array.from({length:L.boxes},(_,box)=>{const out=[];
  for(let slot=0;slot<30;slot++){const m=mon(bytes,storage.best.at+box*0x1000+slot*STORED,false,data);if(m)out.push(m);}return out;});
 return {game:L.game,party,boxes};};
})();

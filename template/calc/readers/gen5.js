(() => {
window.READERS=window.READERS||{};
const FILE=0x80000,STORED=136,PARTY=220,STATS=[0,1,2,4,5,3];
const ORDERS=['0123','0132','0213','0312','0231','0321','1023','1032','2013','3012','2031','3021','1203','1302','2103','3102','2301','3201','1230','1320','2130','3120','2310','3210'];
function fail(){throw {code:'unreadable'};}
function crc(bytes){let value=0xFFFF;for(const byte of bytes){value^=byte<<8;
 for(let bit=0;bit<8;bit++)value=((value<<1)^((value&0x8000)?0x1021:0))&0xFFFF;}return value;}
function crypt(bytes,seed){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 for(let offset=0;offset<bytes.length;offset+=2){seed=(Math.imul(seed,0x41C64E6D)+0x6073)>>>0;view.setUint16(offset,view.getUint16(offset,true)^(seed>>>16),true);}}
const expFor=(rate,level)=>{if(level<=1)return 0;const cube=level**3,floor=Math.floor;
 switch(rate){case 0:return cube;case 1:return level<=50?floor((100-level)*cube/50):level<=68?floor((150-level)*cube/100):level<=98?floor(floor((1911-10*level)/3)*cube/500):floor((160-level)*cube/100);
 case 2:return level<=15?floor((floor((level+1)/3)+24)*cube/50):level<=36?floor((level+14)*cube/50):floor((floor(level/2)+32)*cube/50);
 case 3:return floor(6*cube/5)-15*level**2+100*level-140;case 4:return floor(4*cube/5);case 5:return floor(5*cube/4);}};
function levelFor(rate,exp){if(!Number.isInteger(rate)||rate<0||rate>5)return null;let level=1;while(level<100&&expFor(rate,level+1)<=exp)level++;return level;}
function nickname(view){let text='';for(let offset=0x48;offset<0x5E;offset+=2){const code=view.getUint16(offset,true);if(code===0||code===0xFFFF)break;
 text+=String.fromCharCode(code===0x246D?0x2642:code===0x246E?0x2640:code);}return text;}
function mon(bytes,offset,party,data){const raw=Uint8Array.from(bytes.subarray(offset,offset+(party?PARTY:STORED)));if(raw.every(byte=>byte===0))return null;
 const head=new DataView(raw.buffer),pid=head.getUint32(0,true),checksum=head.getUint16(6,true);if(head.getUint16(4,true)!==0)fail();
 crypt(raw.subarray(8,STORED),checksum);if(party)crypt(raw.subarray(STORED),pid);
 let sum=0;for(let at=8;at<STORED;at+=2)sum+=head.getUint16(at,true);if((sum&0xFFFF)!==checksum)fail();
 const canonical=raw.slice(),order=ORDERS[((pid>>>13)&31)%24];
 for(let block=0;block<4;block++){const start=8+Number(order[block])*32;canonical.set(raw.subarray(start,start+32),8+block*32);}
 const view=new DataView(canonical.buffer),species=view.getUint16(8,true),ivs=view.getUint32(0x38,true);if(!species||ivs>>>30&1)return null;
 const sp=species+':'+(canonical[0x40]>>>3),growth=data?.GID?.gr||{},lv=party?canonical[0x8C]:levelFor(growth[sp]??growth[species+':0'],view.getUint32(0x10,true));
 if(species>649||canonical[0x41]>24||party&&(lv<1||lv>100))fail();
 return {pid,sp,lv,nat:canonical[0x41],ab:canonical[0x15],it:view.getUint16(0x0A,true),
  mv:[0,1,2,3].map(slot=>view.getUint16(0x28+slot*2,true)),iv:STATS.map(stat=>ivs>>>(stat*5)&31),ev:STATS.map(stat=>canonical[0x18+stat]),
  nickname:nickname(view),pp:Array.from(canonical.subarray(0x30,0x34)),ppUps:Array.from(canonical.subarray(0x34,0x38))};}
window.READERS.gen5=(bytes,data)=>{
 const header=String.fromCharCode(...bytes.subarray(0,16));
 if(header.startsWith('\x89PNG')||header.startsWith('RASTATE')||header.startsWith('MELN')||header.startsWith('DeSmuME')||bytes[0]===0x1F&&bytes[1]===0x8B)throw {code:'state'};
 if(bytes.length<FILE)fail();
 if(bytes.length>FILE&&(bytes.length>FILE+128||!String.fromCharCode(...bytes.subarray(FILE)).includes('|-DESMUME SAVE-|')))throw {code:'wrong',game:'Not a raw B2W2 save'};
 bytes=bytes.subarray(0,FILE);if(bytes.every(byte=>byte===0)||bytes.every(byte=>byte===0xFF))throw {code:'empty'};
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),tableValid=(at,length,checksum)=>crc(bytes.subarray(at,at+length))===view.getUint16(checksum,true);
 if(!tableValid(0x25F00,0x94,0x25FA2)){
  if(tableValid(0x23F00,0x8C,0x23F9A))throw {code:'wrong',game:'Black / White (BW1), not B2W2'};
  for(let at=8;at<0x40000-4;at+=4){const magic=view.getUint32(at,true),size=view.getUint32(at-4,true);
   if((magic===0x20060623||magic===0x20070903)&&size>=16&&size<=0x40000&&at+8>=size)throw {code:'wrong',game:'Gen 4, not B2W2'};}
  fail();
 }
 function block(start,length,checksum,id){const actual=crc(bytes.subarray(start,start+length));if(actual!==view.getUint16(checksum,true)||actual!==view.getUint16(0x25F00+id*2,true))fail();}
 block(0,0x3E0,0x3E2,0);block(0x18E00,0x534,0x19336,26);block(0x19400,0xB0,0x194B2,27);
 for(let box=0;box<24;box++){const start=0x400+box*0x1000;block(start,0xFF0,start+0xFF2,box+1);}
 if(![22,23].includes(bytes[0x1941F]))throw {code:'wrong',game:'Not Black 2 / White 2'};
 const count=bytes[0x18E04];if(count>6)fail();const party=[];
 for(let slot=0;slot<count;slot++){const value=mon(bytes,0x18E08+slot*PARTY,true,data);if(value)party.push(value);}
 const boxes=Array.from({length:24},(_,box)=>{const out=[];for(let slot=0;slot<30;slot++){const value=mon(bytes,0x400+box*0x1000+slot*STORED,false,data);if(value)out.push(value);}return out;});
 if(!party.length&&!boxes.some(box=>box.length))throw {code:'empty'};
 return {game:'B2W2',party,boxes};
};
})();

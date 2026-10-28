(() => {
window.READERS=window.READERS||{};
const STORED=232,PARTY=260,STATS=[0,1,2,4,5,3];
const ORDERS=['0123','0132','0213','0312','0231','0321','1023','1032','2013','3012','2031','3021','1203','1302','2103','3102','2301','3201','1230','1320','2130','3120','2310','3210'];
const LAYOUTS=[
 {game:'XY',size:0x65600,party:0x14200,box:0x22600,boxes:31,status:0x14000,blocks:55,partyId:18,boxId:53,statusId:17,versions:[24,25],gen:6},
 {game:'ORAS',size:0x76000,party:0x14200,box:0x33000,boxes:31,status:0x14000,blocks:58,partyId:18,boxId:56,statusId:17,versions:[26,27],gen:6},
 {game:'SM',size:0x6BE00,party:0x1400,box:0x4E00,boxes:32,status:0x1200,blocks:37,partyId:4,boxId:14,statusId:3,versions:[30,31],gen:7},
 {game:'USUM',size:0x6CC00,party:0x1600,box:0x5200,boxes:32,status:0x1400,blocks:39,partyId:4,boxId:14,statusId:3,versions:[32,33],gen:7}
];
function fail(){throw {code:'unreadable'};}
function crypt(bytes,seed){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 for(let offset=0;offset<bytes.length;offset+=2){seed=(Math.imul(seed,0x41C64E6D)+0x6073)>>>0;view.setUint16(offset,view.getUint16(offset,true)^(seed>>>16),true);}}
function crc(bytes,gen,signature=false){let value=0xFFFF;
 for(let offset=0;offset<bytes.length;offset++){const byte=signature&&offset>=0x100&&offset<0x180?0:bytes[offset];
  if(gen===6){value^=byte<<8;for(let bit=0;bit<8;bit++)value=((value<<1)^((value&0x8000)?0x1021:0))&0xFFFF;}
  else{value^=byte;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xA001:0);}}
 return gen===6?value:value^0xFFFF;}
function validate(bytes,layout){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),footer=bytes.length-0x200;
 if(view.getUint32(footer+0x10,true)!==0x42454546)fail();
 let offset=0;
 for(let index=0;index<layout.blocks;index++){const entry=footer+0x14+index*8,length=view.getUint32(entry,true);
  if(view.getUint16(entry+4,true)!==index||!length||offset+length>footer)fail();
  if(index===layout.partyId&&(offset!==layout.party||length!==0x61C))fail();
  if(index===layout.boxId&&(offset!==layout.box||length!==layout.boxes*30*STORED))fail();
  if(index===layout.statusId&&offset!==layout.status)fail();
  if(crc(bytes.subarray(offset,offset+length),layout.gen,layout.gen===7&&index===36)!==view.getUint16(entry+6,true))fail();
  offset+=Math.ceil(length/0x200)*0x200;
 }
 if(offset!==footer)fail();
 if(!layout.versions.includes(bytes[layout.status+4]))throw {code:'wrong',game:'The game marker does not match '+layout.game};
}
function experience(rate,level){if(level<=1)return 0;const cube=level**3,floor=Math.floor;
 switch(rate){case 0:return cube;
  case 1:return level<=50?floor(cube*(100-level)/50):level<=68?floor(cube*(150-level)/100):level<=98?floor(cube*floor((1911-10*level)/3)/500):floor(cube*(160-level)/100);
  case 2:return level<=15?floor(cube*(floor((level+1)/3)+24)/50):level<=36?floor(cube*(level+14)/50):floor(cube*(floor(level/2)+32)/50);
  case 3:return floor(6*cube/5)-15*level**2+100*level-140;
  case 4:return floor(4*cube/5);case 5:return floor(5*cube/4);}
 fail();}
function levelFor(rate,exp){if(!Number.isInteger(rate)||rate<0||rate>5)fail();let level=1;while(level<100&&experience(rate,level+1)<=exp)level++;return level;}
function pokemon(bytes,offset,party,layout,data){const encrypted=bytes.subarray(offset,offset+(party?PARTY:STORED));
 if(encrypted.every(byte=>byte===0))return null;
 const raw=encrypted.slice(),header=new DataView(raw.buffer),constant=header.getUint32(0,true);
 if(header.getUint16(4,true)!==0)fail();
 crypt(raw.subarray(8,STORED),constant);if(party)crypt(raw.subarray(STORED),constant);
 let sum=0;for(let index=8;index<STORED;index+=2)sum+=header.getUint16(index,true);
 if((sum&0xFFFF)!==header.getUint16(6,true))fail();
 const canonical=raw.slice(),order=ORDERS[((constant>>>13)&31)%24];
 for(let block=0;block<4;block++)canonical.set(raw.subarray(8+Number(order[block])*56,8+(Number(order[block])+1)*56),8+block*56);
 const view=new DataView(canonical.buffer),species=view.getUint16(8,true),ivs=view.getUint32(0x74,true);
 if(!species||ivs>>>30&1)return null;
 const sp=species+':'+(canonical[0x1D]>>>3),nat=canonical[0x1C],flags=layout.gen===7?canonical[0xDE]:0;
 const lv=party?canonical[0xEC]:levelFor(data?.GID?.gr?.[sp],view.getUint32(0x10,true));
 if(lv<1||lv>100||nat>24)fail();
 return {pid:view.getUint32(0x18,true),sp,lv,nat,ab:canonical[0x14],it:view.getUint16(0x0A,true),
  mv:[0,1,2,3].map(slot=>view.getUint16(0x5A+slot*2,true)),
  iv:STATS.map((stat,index)=>flags>>>index&1?31:ivs>>>(stat*5)&31),ev:STATS.map(stat=>canonical[0x1E+stat])};
}
window.READERS.gen67=(bytes,data)=>{
 const head=String.fromCharCode(...bytes.subarray(0,8));
 if(head.startsWith('\x89PNG')||head.startsWith('RASTATE')||head.startsWith('CST\x1b')||bytes[0]===0x1F&&bytes[1]===0x8B)throw {code:'state'};
 const layout=LAYOUTS.find(candidate=>candidate.size===bytes.length);
 if(!layout){
  for(const candidate of LAYOUTS){if(bytes.length>=candidate.size||bytes.length<candidate.party+6*PARTY+1||!candidate.versions.includes(bytes[candidate.status+4]))continue;
   let recognised=false;try{recognised=!!pokemon(bytes,candidate.party,true,candidate,data);}catch{}
   if(recognised)fail();}
  throw {code:'wrong'};
 }
 validate(bytes,layout);
 const base=data?.cfg?.calc?.base,target=base==='gen7'?'USUM':base==='gen6'?'XY':null;
 if(target&&layout.game!==target)throw {code:'wrong',game:layout.game+' save; this guide uses '+target};
 const count=bytes[layout.party+6*PARTY];if(count>6)fail();
 const party=[];for(let index=0;index<count;index++){const mon=pokemon(bytes,layout.party+index*PARTY,true,layout,data);if(mon)party.push(mon);}
 if(!party.length)throw {code:'empty'};
 const boxes=Array.from({length:layout.boxes},(_,box)=>{const result=[];
  for(let slot=0;slot<30;slot++){const mon=pokemon(bytes,layout.box+(box*30+slot)*STORED,false,layout,data);if(mon)result.push(mon);}return result;});
 return {game:layout.game,party,boxes};
};
})();

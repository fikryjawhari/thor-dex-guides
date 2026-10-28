// Save reader: pokeemerald-expansion (GBA). Format notes: template/calc/readers/README.md → expansion.
// READERS.expansion(bytes, data) -> {game, party, boxes} in game ids (data.GID maps them; GID.gr gives boxed levels),
// or throws {code: 'wrong' | 'state' | 'unreadable' | 'empty', game}.
(() => {
window.READERS=window.READERS||{};
const SECTOR=4096,DATA=4084,SIGNATURE=0x08012025,STATS=[0,1,2,4,5,3],     // the game's HP Atk Def Spe SpA SpD -> HP Atk Def SpA SpD Spe
ORDERS=['0123','0132','0213','0312','0231','0321','1023','1032','2013','3012','2031','3021','1203','1302','2103','3102','2301','3201','1230','1320','2130','3120','2310','3210'];
// Experience for a level by growth rate (GROWTH_ order: medium fast, erratic, fluctuating, medium slow, fast, slow).
const expFor=(rate,n)=>{if(n<=1)return n;const c=n*n*n,d=Math.floor;switch(rate){case 0:return c;case 1:return n<=50?d((100-n)*c/50):n<=68?d((150-n)*c/100):n<=98?d(d((1911-10*n)/3)*c/500):d((160-n)*c/100);case 2:return n<=15?d((d((n+1)/3)+24)*c/50):n<=36?d((n+14)*c/50):d((d(n/2)+32)*c/50);case 3:return d(6*c/5)-15*n*n+100*n-140;case 4:return d(4*c/5);case 5:return d(5*c/4);}return null;};
const levelFor=(rate,exp)=>{if(rate==null)return null;let level=1;while(level<=100&&expFor(rate,level)<=exp)level++;return level-1;};
function isState(bytes){const head=String.fromCharCode(...bytes.subarray(0,8));return head.startsWith('\x89PNG')||head.startsWith('RASTATE')||bytes[0]===0x1f&&bytes[1]===0x8b;}
// The newest complete slot: sectors grouped by save counter; 14 per slot (stock layout, two slots) or 28 (one slot).
function slot(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),groups=new Map();let signed=0;
 for(let s=0;s<32&&(s+1)*SECTOR<=bytes.length;s++){const o=s*SECTOR;if(view.getUint32(o+0xFF8,true)!==SIGNATURE)continue;signed++;
  let sum=0;for(let i=0;i<DATA;i+=4)sum=(sum+view.getUint32(o+i,true))>>>0;const check=((sum>>>16)+sum)&0xFFFF;
  if(check!==view.getUint16(o+0xFF6,true))continue;const counter=view.getUint32(o+0xFFC,true);if(!groups.has(counter))groups.set(counter,new Map());groups.get(counter).set(view.getUint16(o+0xFF4,true),o);}
 if(!signed)throw {code:'empty'};
 for(const counter of [...groups.keys()].sort((a,b)=>b-a)){const ids=groups.get(counter);for(const count of [28,14]){if([...Array(count).keys()].every(id=>ids.has(id)))return {ids,count};}}
 throw {code:'unreadable'};}
function join(bytes,ids,from,to,size){const out=new Uint8Array((to-from+1)*size);for(let id=from;id<=to;id++)out.set(bytes.subarray(ids.get(id),ids.get(id)+size),(id-from)*size);return out;}
function mon(bytes,o,party,data){const view=new DataView(bytes.buffer,bytes.byteOffset+o,party?100:80),pid=view.getUint32(0,true),ot=view.getUint32(4,true),flags=view.getUint8(19);
 if(!(flags&2)||flags&1)return null;                  // no species, or a Bad Egg
 const raw=new DataView(new ArrayBuffer(48));let sum=0;for(let i=0;i<12;i++)raw.setUint32(i*4,(view.getUint32(32+i*4,true)^pid^ot)>>>0,true);
 for(let i=0;i<24;i++)sum+=raw.getUint16(i*2,true);if((sum&0xFFFF)!==view.getUint16(28,true))return null;
 const order=ORDERS[pid%24],at=type=>+order[type]*12,s0=at(0),s1=at(1),s2=at(2),s3=at(3);
 const sp=raw.getUint16(s0,true)&0x7FF,it=raw.getUint16(s0+2,true)&0x3FF,exp=raw.getUint32(s0+4,true)&0x1FFFFF;
 const ivs=raw.getUint32(s3+4,true),misc=raw.getUint32(s3+8,true);if(!sp||ivs>>>30&1||flags&4)return null;     // empty or an egg
 return {pid,sp,lv:party?view.getUint8(84):levelFor(data?.GID?.gr?.[sp],exp),nat:(pid%25)^(view.getUint8(18)>>3),abs:misc>>>29&3,it,
  mv:[0,1,2,3].map(i=>raw.getUint16(s1+i*2,true)&0x7FF),iv:STATS.map(i=>ivs>>>(5*i)&31),ev:STATS.map(i=>raw.getUint8(s2+i))};}
window.READERS.expansion=(bytes,data)=>{
 if(isState(bytes))throw {code:'state'};
 if(bytes.length<0x20000||bytes.length>0x20000+64)throw {code:'wrong',game:bytes.length===0x10000?'A 64 KB save: not this game':undefined};
 const {ids,count}=slot(bytes),size=count===28?DATA:3968,last=count===28?16:4;      // SaveBlock1 sectors 1..last, storage after
 const block1=join(bytes,ids,1,last,size),storage=join(bytes,ids,last+1,count-1,size),partyCount=block1[0x234];
 if(partyCount>6)throw {code:'unreadable'};
 const party=[];for(let i=0;i<partyCount;i++){const m=mon(block1,0x238+100*i,true,data);if(m)party.push(m);}
 if(!party.length)throw {code:'empty'};
 const boxes=[];for(let b=0;b<14;b++){const box=[];for(let i=0;i<30;i++){const o=4+80*(b*30+i);if(o+80<=storage.length){const m=mon(storage,o,false,data);if(m)box.push(m);}}boxes.push(box);}
 return {game:'pokeemerald-expansion',party,boxes};};
})();

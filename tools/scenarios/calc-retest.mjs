import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {fixturePatches, guide, guideArg, prepareGuide, runChecks, setupCalc} from '../calc_check_lib.mjs';

const file=prepareGuide(guideArg(process.argv),{tag:'calc-retest',edit:fixturePatches});
if(!file){console.log('SKIP calc-retest: no cfg.calc');process.exit(0);}
const sizes=[[260,316],[260,394],[480,392],[537,424],[832,424]];
const checks=[{
  id:'R1 frame',
  title:'six across; both cards and player moves fit, wide moves pinned and trainer preview scrolls',
  sizes,
  run:async(page,{width,height,mode})=>{
    await setupCalc(page,{trainer:guide().trainers.six.k});
    await page.value(width<480?`scrollTo(0,document.querySelector('.fbar').getBoundingClientRect().top+scrollY-2)`:'scrollTo(0,0)');
    await page.settle();
    const geometry=await page.value(`(()=>{const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};return {bar:rect(document.querySelector('.fbar')),cards:[...document.querySelectorAll('.dmatch>.cc')].map(rect),moves:[...document.querySelectorAll('${width<480?'.dres:not(.na) .mr':'.dres .mr'}')].map(rect),cols:getComputedStyle(document.querySelector('.mg .dstrip')).gridTemplateColumns.split(' ').length,teamCols:getComputedStyle(document.querySelector('.dstrip.fs')).gridTemplateColumns.split(' ').length,expanded:document.querySelector('#app').classList.contains('tl'),preview:[...document.querySelectorAll('.fteam .ft')].map(row=>({text:row.innerText,parts:row.querySelectorAll('.l2t').length})),team:getComputedStyle(document.querySelector('.fteam')).overflowY,fight:rect(document.querySelector('.dfight')),field:rect(document.querySelector('.dfield'))};})()`);
    assert.equal(geometry.cols,6,'box six across');
    assert.equal(geometry.teamCols,6,'trainer strip six across');
    assert.equal(geometry.moves.length,width<480?4:8);
    for(const rect of [...geometry.cards,...geometry.moves])assert(rect.top>=0&&rect.bottom<=height+1,`frame ${JSON.stringify(rect)}`);
    if(width<480)assert(geometry.bar.top>=0,'trainer bar in frame');
    else{
      const lists=await page.value(`[...document.querySelectorAll('.dres')].map(list=>Math.max(...[...list.querySelectorAll('.mr')].map(row=>row.getBoundingClientRect().bottom)))`);
      assert.equal(lists.length,2,'both move lists');
      for(const bottom of lists)assert(bottom<=height+1&&height-bottom<=4,'both move lists end at the viewport bottom (4 px margin)');
      assert(geometry.fight.bottom<=Math.min(...geometry.moves.map(rect=>rect.top)),'fight bar above the moves (wide left column)');
      if(height===424){assert.equal(geometry.team,'visible','preview does not scroll: all six rows visible (two-line rows)');assert(await page.value(`[...document.querySelectorAll('.fteam .ft')].every(row=>row.getBoundingClientRect().bottom<=innerHeight)`),'all six preview rows inside the window');assert.equal(geometry.preview.length,6,'all six full preview rows');assert(geometry.preview.every(row=>row.parts===1&&row.text.length>20),'item / ability line and move line in every row');}
    }
    assert(geometry.field.top>=geometry.fight.bottom,'Field follows fight bar');
    if(mode==='normal'&&(width!==260||height===316)){
      mkdirSync('.tmp/R1',{recursive:true});
      const shot=await page.send('Page.captureScreenshot',{format:'png'});
      writeFileSync(`.tmp/R1/${guide().name}-${width}x${height}.png`,Buffer.from(shot.data,'base64'));
    }
  },
},{
  id:'R1 fight',
  title:'fight controls outside Field; native selects remain unintercepted in either mode',
  run:async page=>{
    await setupCalc(page);
    assert.equal(await page.count('.dfight select[data-f="weather"]'),1);
    assert.equal(await page.count('.dfight [aria-label="Reset fight"]'),1);
    assert.equal(await page.count('.dfb select[data-f="weather"],.dfb select[data-f="terrain"],.dfb [data-f="gameType"],.dfb [data-a="fightreset"]'),0);
    const native=await page.value(`(()=>{const select=document.querySelector('.dfight select');const event=new MouseEvent('click',{bubbles:true,cancelable:true});select.dispatchEvent(event);return {tag:select.tagName,prevented:event.defaultPrevented,sheets:document.querySelectorAll('.sheet').length};})()`);
    assert.deepEqual(native,{tag:'SELECT',prevented:false,sheets:0});
  },
}];
checks.push({
  id:'R1 HP',
  title:'toxic, residual and berry share one short line; individual parts apply independently',
  run:async page=>{
    await setupCalc(page);
    await page.value(`CALC.use(P.find(mon=>mon.n==='Snorlax'));CALC.set('mine','l',50);CALC.set('mine','i','Sitrus Berry');CALC.set('mine','status','tox');CALC.render();CALC.set('mine','hp',40);CALC.render()`);
    const row=await page.value(`(()=>{const card=document.querySelector('.cc[data-s=mine]');const R=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};const shown=els=>[...els].filter(el=>el.getBoundingClientRect().width>0).map(R);return {card:R(card),hp:shown(card.querySelectorAll('.hpl,[data-hp],.mx')),line:shown(card.querySelectorAll('.dberry,.dtoxl,[data-tox],[data-a=eot]')),berry:card.querySelector('.dberry').textContent,residual:card.querySelector('[data-a=eot]').textContent};})()`);
    assert(row.card.bottom-row.card.top<=63,'busiest narrow card stays at three lines (62 px)');
    assert(row.hp.every(rect=>rect.left>=row.card.left-1&&rect.right<=row.card.right+1),'HP controls inside the card');
    assert(Math.max(...row.hp.map(rect=>(rect.top+rect.bottom)/2))-Math.min(...row.hp.map(rect=>(rect.top+rect.bottom)/2))<=3,'HP controls on one line (line 1, centres)');
    assert(row.line.length>=3,'berry, toxic and residual on line 3');
    for(const rect of row.line){assert(rect.left>=row.card.left-1&&rect.right<=row.card.right+1,'line 3 controls inside the card');assert(rect.bottom-rect.top<=22);}
    assert(Math.max(...row.line.map(rect=>(rect.top+rect.bottom)/2))-Math.min(...row.line.map(rect=>(rect.top+rect.bottom)/2))<=3,'toxic, residual and berry share one line (line 3, centres)');
    assert.match(row.residual,/^\d/,'unsigned residual');
    await page.tap('[data-a=eopen][data-s=mine]');
    await page.tap('[data-a=resopen][data-s=mine]');
    const before=await page.value(`CALC.mon('mine').hp`);
    const amount=Number(await page.text('.cc[data-s=mine] .dqp button b'));
    await page.tap('.cc[data-s=mine] .dqp button');
    assert.equal(await page.value(`CALC.mon('mine').hp`),Math.max(0,before-amount));
    assert.equal(await page.value(`CALC.mon('mine').used||false`),false,'part does not also consume berry');
  },
},{
  id:'R1 pickers',
  title:'Item and Nature text pickers, Other ability and clear, native status select; query/results/keyboard fit',
  run:async(page,{mode})=>{
    await setupCalc(page);
    await page.tap('[data-a=eopen][data-s=mine]');
    for(const [kind,query] of [['it','Leftovers'],['na','Adamant']]){
      assert.equal(await page.value(`document.querySelector('.cc[data-s=mine] [data-e=${kind}]').tagName`),'INPUT');
      await page.tap(`.cc[data-s=mine] [data-pick=${kind}]`);
      if(mode==='dvkb'){
        const geometry=await page.value(`(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom};};return {query:box('.kbsh'),results:box('.sheet .shb'),keyboard:box('.kb')};})()`);
        assert(geometry.query.bottom<=geometry.results.top&&geometry.results.bottom<=geometry.keyboard.top+1,'query/results/keyboard visible together');
        assert(geometry.results.bottom-geometry.results.top>=40,'room for results');
      }
      const shot=await page.send('Page.captureScreenshot',{format:'png'});
      writeFileSync(`.tmp/R1/${guide().name}-${kind}-${mode}.png`,Buffer.from(shot.data,'base64'));
      await page.typeSearch(query);
      await page.tap('.sheet .mrow[data-i="0"]');
      assert.equal(await page.value(`CALC.mon('mine').${kind==='it'?'i':'na'}`),query);
    }
    await page.value(`(()=>{const select=document.querySelector('.cc[data-s=mine] select[data-e=ab]');select.value='@other';select.dispatchEvent(new Event('change'));})()`);
    await page.typeSearch('Levitate');
    await page.tap('.sheet .mrow[data-i="0"]');
    assert.equal(await page.value(`AB[CALC.mon('mine').a][0]`),'Levitate');
    assert.equal(await page.count('.cc[data-s=mine] input[data-e=ab]'),1);
    await page.reload();await page.route('#/calc');
    await page.tap('[data-a=eopen][data-s=mine]');
    assert.equal(await page.count('.cc[data-s=mine] input[data-e=ab]'),1,'off-species ability reopens as text');
    await page.tap('[data-a=abclear][data-s=mine]');
    assert.equal(await page.count('.cc[data-s=mine] select[data-e=ab]'),1);
    await page.value(`document.querySelector('.dres:not(.na) .mr .mm').click()`);
    const selects=await page.value(`[...document.querySelectorAll('select')].map(select=>{const event=new MouseEvent('click',{bubbles:true,cancelable:true});select.dispatchEvent(event);return {kind:select.dataset.e||select.dataset.mo||select.dataset.f,prevented:event.defaultPrevented,sheets:document.querySelectorAll('.sheet').length};})`);
    assert(selects.some(select=>select.kind==='t'),'move Type remains a native select');
    assert(selects.some(select=>select.kind==='vol'),'Battle state remains a native select');
    assert(selects.every(select=>!select.prevented&&!select.sheets),'no native select intercepted');
    const native=await page.value(`(()=>{const select=document.querySelector('.cc[data-s=mine] select[data-e=status]');const event=new MouseEvent('click',{bubbles:true,cancelable:true});select.dispatchEvent(event);return event.defaultPrevented||!!document.querySelector('.sheet');})()`);
    assert.equal(native,false,'native select not intercepted');
    await page.tap('.cc[data-s=mine] [data-pick=it]');
    const unavailable=await page.value(`DMG.items().find(item=>!D.IT.some(section=>section.r.some(row=>row[0]===item)))`);
    assert(unavailable,'stock item missing from guide availability');
    await page.typeSearch(unavailable);
    assert.equal(await page.count('.sheet .mrow[data-i="0"]'),1,'all stock items, not just guide availability');
  },
});
const r2Mon=`mon=>({id:mon.id,lv:mon.l,...(mon.sd?{sl:Math.max(1,mon.l-mon.sd)}:{}),nat:mon.na,ab:mon.a,it:mon.i,st:mon.status,iv:mon.iv,ev:${guide().data.cfg.calc.evs===false}?[0,0,0,0,0,0]:mon.ev,stg:[0,...(mon.stg||[0,0,0,0,0])],hp:mon.hp,used:mon.used,broken:mon.broken,vol:mon.vol})`;
const r2Row='.dres:not(.na) .mr:first-child';
const r2Duel=async(page,moves=['Double-Edge','Drain Punch','Bullet Seed','Reflect'])=>{
  await setupCalc(page);
  await page.value(`CALC.use(P.find(mon=>mon.n==='Blissey'));CALC.set('mine','l',50);CALC.set('mine','a',-1);CALC.set('mine','i','');CALC.set('mine','m',${JSON.stringify(moves)}.map(name=>M.indexOf(name)));CALC.set('foe','id',P.find(mon=>mon.n==='Snorlax').id);CALC.set('foe','l',50);CALC.set('foe','a',-1);CALC.set('foe','i','');CALC.set('foe','m',${JSON.stringify(moves)}.map(name=>M.indexOf(name)));CALC.render();CALC.set('mine','hp',200);CALC.set('foe','hp',200);CALC.render()`);
};
checks.push({
  id:'R2 rows',title:'equal closed rows with all controls inside, unsigned noninteractive ranges; frame retained',sizes,
  run:async(page,{width,height,mode})=>{
    await r2Duel(page,['Double-Edge','Bullet Seed','Spit Up','Reflect']);
    const rows=await page.value(`(()=>{const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];return rows.map(row=>{const box=row.getBoundingClientRect();return {height:box.height,controls:[...row.querySelectorAll('.rh,.rc,.dstock')].every(control=>row.querySelector('.mm .r1,.mm .r2')&&control.closest('.r1,.r2')),endpoints:row.querySelectorAll('.r1 [data-a=sub]').length,openActions:row.querySelectorAll('.dd [data-a=sub]').length,range:row.querySelector('span.hu')?.textContent,rangeButton:!!row.querySelector('button.hu[data-a=use]')};});})()`);
    assert(Math.max(...rows.map(row=>row.height))-Math.min(...rows.map(row=>row.height))<1,'equal closed row heights including status, stock and multi-hit');
    assert(rows.every(row=>row.controls&&row.openActions===0),'all controls on bar, no old HP actions');
    assert.equal(rows[0].endpoints,2);assert.match(rows[0].range,/^\d+–\d+$/);assert.equal(rows[0].rangeButton,false);
    assert.equal(await page.value(`(()=>{const select=document.querySelector('.dres:not(.na) [data-mo=stock]'),event=new MouseEvent('click',{bubbles:true,cancelable:true});select.dispatchEvent(event);return event.defaultPrevented||select.closest('.mr').classList.contains('open');})()`),false,'bar Stockpile stays native and does not open the row');
    if(mode==='normal'&&((width===260&&height===316)||(width===537&&height===424))){
      mkdirSync('.tmp/R2',{recursive:true});
      await page.value(width<480?`scrollTo(0,document.querySelector('.fbar').getBoundingClientRect().top+scrollY-2)`:'scrollTo(0,0)');await page.settle();
      writeFileSync(`.tmp/R2/${guide().name}-${width}x${height}-closed.png`,Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
      await page.tap(`${r2Row} .mm`);
      writeFileSync(`.tmp/R2/${guide().name}-${width}x${height}-open.png`,Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    }
  },
},{
  id:'R2 exact',title:'roll fills custom amount, number pad works, both sides apply exact HP plus Life Orb/contact/recoil',
  run:async(page,{mode})=>{
    await r2Duel(page,['Double-Edge']);
    for(const side of ['mine','foe']){
      const other=side==='mine'?'foe':'mine';
      await page.value(`CALC.state().dir='${side==='mine'?'out':'in'}';CALC.set('${side}','hp',200);CALC.set('${other}','hp',200);CALC.set('${side}','i','Life Orb');CALC.set('${other}','i','Rocky Helmet');CALC.render()`);
      await page.tap(`${r2Row} .mm`);
      const roll=Number(await page.text(`${r2Row} .rolls button`));await page.tap(`${r2Row} .rolls button`);
      assert.equal(await page.value(`+document.querySelector('${r2Row} [data-hx=d]').value`),roll,'roll fills Damage amount');
      await page.setBox(`${r2Row} [data-hx=d]`,30);
      const expected=await page.value(`(()=>{const convert=${r2Mon},att=convert(CALC.mon('${side}')),def=convert(CALC.mon('${other}')),slot={mv:M.indexOf('Double-Edge')},hit=DMG.hit(att,def,slot,{},'max',{damage:30,reactions:true}),hp=DMG.hp(att,def,slot,{},hit.dealt,{hits:hit.hits});return {target:hit.def.hp,user:att.hp+hp.v};})()`);
      await page.tap(`${r2Row} [data-a=damage]`);
      assert.equal(await page.value(`CALC.mon('${other}').hp`),expected.target);
      assert.equal(await page.value(`CALC.mon('${side}').hp`),expected.user);
      assert.equal(await page.count('#calc-log'),1,'log overlay');await page.tap('#calc-log button');
      await page.tap(`${r2Row} .mm`);
    }
  },
},{
  id:'R2 endpoints',title:'closed min/max are real hit actions, current crit/hit totals, Sash and ready berries react',
  run:async page=>{
    await r2Duel(page,['Double-Edge','Bullet Seed','Tackle','Reflect']);
    for(const side of ['mine','foe'])for(const roll of ['min','max']){
      const other=side==='mine'?'foe':'mine';
      await page.value(`CALC.state().dir='${side==='mine'?'out':'in'}';CALC.set('${side}','hp',200);CALC.set('${other}','hp',200);CALC.set('${side}','i','Life Orb');CALC.set('${other}','i','Rocky Helmet');CALC.render()`);
      const expected=await page.value(`(()=>{const convert=${r2Mon},att=convert(CALC.mon('${side}')),def=convert(CALC.mon('${other}')),slot={mv:M.indexOf('Double-Edge')},hit=DMG.hit(att,def,slot,{},'${roll}'),hp=DMG.hp(att,def,slot,{},hit.dealt,{hits:hit.hits});return {target:hit.def.hp,user:Math.max(0,att.hp+hp.v)};})()`);
      assert.equal(await page.count(`${r2Row}.open`),0);await page.tap(`${r2Row} [data-a=sub][data-roll=${roll}]`);
      assert.equal(await page.value(`CALC.mon('${other}').hp`),expected.target);assert.equal(await page.value(`CALC.mon('${side}').hp`),expected.user);await page.tap('#calc-log button');
    }
    await page.value(`CALC.state().dir='out';CALC.set('mine','i','');CALC.set('foe','i','');CALC.render()`);
    const multi='.dres:not(.na) .mr:nth-child(2)';
    for(let count=0;count<6;count++){
      await page.value(`CALC.set('mine','hp',200);CALC.set('foe','hp',200);CALC.render()`);
      const numbers=await page.value(`(()=>{const row=document.querySelector('${multi}');return {n:Number(row.querySelector('[data-a=hits]').textContent.replace('×','')),min:+row.querySelector('[data-roll=min]').textContent};})()`);
      const before=await page.value(`CALC.mon('foe').hp`);await page.tap(`${multi} [data-roll=min]`);assert.equal(await page.value(`CALC.mon('foe').hp`),Math.max(0,before-numbers.min));await page.tap('#calc-log button');await page.tap(`${multi} [data-a=hits]`);
    }
    for(const item of ['Focus Sash','Sitrus Berry']){
      await page.value(`CALC.set('mine','id',P.find(mon=>mon.n==='Snorlax').id);CALC.set('mine','m',[M.indexOf('Double-Edge')]);CALC.set('foe','id',P.find(mon=>mon.n==='Blissey').id);CALC.set('foe','i','${item}');CALC.set('foe','used',false);CALC.set('foe','hp',undefined);CALC.render();${item==='Sitrus Berry'?"CALC.set('foe','hp',80);CALC.render();":''}`);
      const expected=await page.value(`(()=>{const convert=${r2Mon},hit=DMG.hit(convert(CALC.mon('mine')),convert(CALC.mon('foe')),{mv:M.indexOf('Double-Edge')},{},'max');return hit.def;})()`);
      await page.tap(`${r2Row} [data-roll=max]`);assert.equal(await page.value(`CALC.mon('foe').hp`),expected.hp);assert.equal(await page.value(`CALC.mon('foe').used||false`),expected.used||false);await page.tap('#calc-log button');
    }
  },
});
const ownMoves={Reflect:['Reflect'],LightScreen:['Light Screen'],AuroraVeil:['Aurora Veil'],Tailwind:['Tailwind'],Safeguard:['Safeguard'],Protect:['Protect','Detect',"King's Shield",'Spiky Shield','Baneful Bunker','Obstruct','Silk Trap','Burning Bulwark'],Focus:['Focus Energy'],LaserFocus:['Laser Focus'],LuckyChant:['Lucky Chant'],DragonCheer:['Dragon Cheer'],PowerTrick:['Power Trick'],Charge:['Charge'],Roost:['Roost'],MagnetRise:['Magnet Rise'],Ingrain:['Ingrain'],AquaRing:['Aqua Ring'],GlaiveRush:['Glaive Rush'],HelpingHand:['Helping Hand']};
const opponentMoves={StealthRock:['Stealth Rock','Stone Axe'],Spikes:['Spikes','Ceaseless Edge'],ToxicSpikes:['Toxic Spikes'],StickyWeb:['Sticky Web'],Seeded:['Leech Seed'],SaltCure:['Salt Cure'],Nightmare:['Nightmare'],Cursed:['Curse'],Trapped:['Bind','Wrap','Fire Spin','Whirlpool','Sand Tomb','Clamp','Magma Storm','Infestation','Snap Trap','Thunder Cage'],Foresight:['Foresight','Odor Sleuth'],MiracleEye:['Miracle Eye'],TarShot:['Tar Shot'],Grounded:['Smack Down','Thousand Arrows'],Telekinesis:['Telekinesis']};
const globalMoves={trickRoom:['Trick Room'],gravity:['Gravity'],wonderRoom:['Wonder Room'],magicRoom:['Magic Room'],waterSport:['Water Sport'],mudSport:['Mud Sport'],powerSplit:['Power Split'],guardSplit:['Guard Split']};
checks.push({
  id:'R2 move sync',title:'all offered move-to-Field mappings sync both directions, correct absolute side and hazard layers',
  run:async(page,{mode})=>{
    await r2Duel(page,['Reflect']);
    const mappings=[];
    for(const side of ['mine','foe'])for(const [map,prefix] of [[ownMoves,side==='mine'?'atk':'def'],[opponentMoves,side==='mine'?'def':'atk'],[globalMoves,'']])for(const [key,names] of Object.entries(map))for(const name of names){
      const control=guide().data.cfg.calc.field.find(entry=>entry.k===prefix+key);if(!control||!guide().data.M.includes(name))continue;
      const result=await page.value(`(()=>{const side='${side}',key='${prefix+key}',state=CALC.state();state.dir=side==='mine'?'out':'in';state.field.gameType='Doubles';state.fman.push('gameType',key);state.field[key]=0;CALC.set(side,'id',P.find(mon=>mon.n==='Gengar').id);CALC.set(side,'m',[M.indexOf(${JSON.stringify(name)})]);CALC.render();const button=document.querySelector('${r2Row} [data-a=movetoggle]');if(!button)return {missing:true};button.click();const value=state.field[key],pressed=document.querySelector('${r2Row} [data-a=movetoggle]').getAttribute('aria-pressed');document.querySelector('button[data-f="'+key+'"]').click();const second=state.field[key],off=document.querySelector('${r2Row} [data-a=movetoggle]').getAttribute('aria-pressed');return {value,pressed,second,off};})()`);
      assert(!result.missing,name+' offers '+prefix+key);assert(result.value,name+' sets '+prefix+key);assert.equal(result.pressed,'true',name);assert.equal(result.second,control.max?2:0,name+' Field updates same value');assert.equal(result.off,control.max?'true':'false',name+' reflected back');
      mappings.push({side,move:name,key:prefix+key});
    }
    mkdirSync('.tmp/R2',{recursive:true});writeFileSync(`.tmp/R2/${guide().name}-move-map.json`,JSON.stringify(mappings,null,2));
    assert(mappings.length>50,'broad profile-specific map coverage');
    for(const side of ['mine','foe'])for(const [name,vol] of [['Dig','dig'],['Fly','fly'],['Bounce','fly'],['Dive','dive'],['Minimize','min']]){
      if(!guide().data.M.includes(name))continue;
      await page.value(`CALC.state().dir='${side==='mine'?'out':'in'}';CALC.set('${side}','m',[M.indexOf('${name}')]);CALC.render();document.querySelector('${r2Row} [data-a=movetoggle]').click()`);
      assert.equal(await page.value(`CALC.mon('${side}').vol`),vol,name+' user state');
      await page.tap(`[data-a=eopen][data-s=${side}]`);await page.value(`(()=>{const select=document.querySelector('.cc[data-s=${side}] select[data-e=vol]');select.value='';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);assert.equal(await page.value(`document.querySelector('${r2Row} [data-a=movetoggle]').getAttribute('aria-pressed')`),'false');await page.tap(`[data-a=eopen][data-s=${side}]`);
    }
    for(const [name,key,value] of [['Hail','weather',guide().data.cfg.calc.field.find(entry=>entry.k==='weather').o.some(entry=>entry[0]==='Snow')?'Snow':'Hail'],['Rain Dance','weather','Rain'],['Electric Terrain','terrain','Electric']]){
      if(!guide().data.M.includes(name))continue;
      await page.value(`CALC.set('foe','m',[M.indexOf('${name}')]);CALC.render();document.querySelector('${r2Row} [data-a=movetoggle]').click()`);assert.equal(await page.value(`CALC.state().field.${key}`),value,name+' own profile weather/terrain');await page.value(`(()=>{const select=document.querySelector('.dfight select[data-f=${key}]');select.value='';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);assert.equal(await page.value(`document.querySelector('${r2Row} [data-a=movetoggle]').getAttribute('aria-pressed')`),'false');
    }
  },
},{
  id:'R2 Protect',title:'both sides Protect show zero/Protected; min/max and exact are no-ops; Feint and Z bypass',
  run:async page=>{
    await r2Duel(page,['Tackle','Feint','Protect','Safeguard']);
    for(const side of ['mine','foe']){
      const other=side==='mine'?'foe':'mine',prefix=other==='mine'?'atk':'def';
      await page.value(`CALC.state().dir='${side==='mine'?'out':'in'}';CALC.state().field.${prefix}Protect=true;CALC.state().fman.push('${prefix}Protect');CALC.set('${side}','i','Life Orb');CALC.render()`);
      assert.match(await page.text(`${r2Row} .hp`),/Protected/);const before=await page.value(`['mine','foe'].map(side=>CALC.mon(side).hp)`);
      await page.value(`(()=>{document.querySelector('${r2Row} .mm').click();const input=document.querySelector('${r2Row} [data-hx=d]');input.value=50;input.dispatchEvent(new Event('change'));document.querySelector('${r2Row} [data-a=damage]').click();})()`);
      assert.deepEqual(await page.value(`['mine','foe'].map(side=>CALC.mon(side).hp)`),before,'Protected exact no-op');
      if(guide().data.M.includes('Feint'))assert(await page.value(`+document.querySelector('.dres:not(.na) .mr:nth-child(2) [data-roll=max]').textContent`)>0,'Feint bypass');
      await page.value(`document.querySelector('${r2Row} .mm').click();CALC.state().field.${prefix}Protect=false;CALC.render()`);
    }
  },
});

// R3: Field groups stacked in one column with per-group collapse bars; two-line trainer preview rows; short fight selects.
const r3Shot=async(page,name)=>{mkdirSync('.tmp/R3',{recursive:true});const shot=await page.send('Page.captureScreenshot',{format:'png'});writeFileSync(`.tmp/R3/${guide().name}-${name}.png`,Buffer.from(shot.data,'base64'));};
const r3Field=async(page,doubles=false)=>{
  await setupCalc(page);
  if(!await page.value('document.querySelector(".dfield").open'))await page.tap('.dfield > summary');
  if(doubles)await page.tap('[data-f=gameType][data-value=Doubles]');
};
const r3Groups=`[...document.querySelectorAll('.dfb details[data-fgroup]')].filter(d=>d.offsetParent)`;
checks.push({
  id:'R3 groups',title:"Global first, then Player | Foe, then the side's groups stacked in one column at every size",sizes,
  run:async(page,{width,height,mode})=>{
    await r3Field(page,true);
    const layout=await page.value(`(()=>{const body=document.querySelector('.dfb'),kids=[...body.children].filter(el=>el.offsetParent&&!el.matches('.dfsource,.dfarea'));const global=body.querySelector(':scope>details[data-fgroup="field:battle"]');return {globalIndex:kids.indexOf(global),switchIndex:kids.indexOf(body.querySelector(':scope>.dfside')),loose:body.querySelectorAll(':scope>.dtg button').length,outside:[...body.querySelectorAll('button[data-f]')].filter(el=>!el.closest('[data-field-side]')&&!el.closest('[data-fgroup="field:battle"]')).map(el=>el.dataset.f),switchShown:getComputedStyle(document.querySelector('.dfsw')).display!=='none',bars:document.querySelectorAll('.dfield .endbar').length,groupBars:document.querySelectorAll('.dfield details[data-fgroup]>.endbar').length,groups:document.querySelectorAll('.dfield details[data-fgroup]').length,trick:document.querySelector('[data-f=trickRoom]')?.closest('[data-fgroup]')?.dataset.fgroup??'none'};})()`);
    assert.equal(layout.globalIndex,0,'Global is the first Field block');
    assert(layout.switchIndex>layout.globalIndex,'side switch after Global');
    assert.equal(layout.loose,0,'no global toggles outside Global');
    assert.deepEqual(layout.outside,[],'every global toggle sits in Global');
    assert(['field:battle','none'].includes(layout.trick),'Trick Room inside Global');
    assert(layout.switchShown,'Player | Foe switch at every width');
    assert.equal(layout.bars,layout.groupBars,'collapse bars only inside groups (no whole-Field bar)');
    assert.equal(layout.groupBars,layout.groups,'one collapse bar per group');
    for(const side of ['atk','def']){
      await page.tap(`[data-a=fside][data-v=${side}]`);
      for(const id of await page.value(`${r3Groups}.map(d=>d.dataset.fgroup)`))if(!await page.value(`document.querySelector('[data-fgroup="${id}"]').open`))await page.tap(`[data-fgroup="${id}"] > summary`);
      const rects=await page.value(`${r3Groups}.map(d=>{const r=d.getBoundingClientRect();return {id:d.dataset.fgroup,top:r.top,bottom:r.bottom,left:r.left,width:r.width,open:d.open};})`);
      const labels=await page.value(`${r3Groups}.map(d=>d.querySelector(':scope>summary').textContent.replace(/ · .*/,''))`);
      assert(rects.length>=2&&rects.every(r=>r.open),side+' groups open: '+JSON.stringify(rects));
      assert.equal(labels[0],'Global');
      const own=labels.slice(1),order=['States','Turn end','Hazards'];
      assert.deepEqual(own,order.filter(label=>own.includes(label)),side+' group order');
      for(let i=1;i<rects.length;i++){
        assert(Math.abs(rects[i].left-rects[0].left)<=1.5&&Math.abs(rects[i].width-rects[0].width)<=1.5,`one column: ${JSON.stringify(rects[i])} vs ${JSON.stringify(rects[0])}`);
        assert(rects[i].top>=rects[i-1].bottom-1,`stacked: ${rects[i].id} below ${rects[i-1].id}`);
      }
      const grids=await page.value(`${r3Groups}.map(d=>getComputedStyle(d.querySelector(':scope>.dtg')).display)`);
      assert(grids.every(display=>display==='grid'),'open groups use the normal toggle grid');
      if(side==='atk'&&mode==='normal'&&((width===260&&height===316)||(width===537&&height===424))){
        await page.value(`(()=>{const d=document.querySelector('.dfield');d.scrollIntoView({block:'start'});})()`);await page.settle();
        await r3Shot(page,`field-${width}x${height}`);
      }
    }
    // Open / closed state survives a redraw (session state, as before).
    await page.value('CALC.render()');await page.settle();
    assert(await page.value(`${r3Groups}.every(d=>d.open)`),'open groups stay open after a redraw');
  },
},{
  id:'R3 bars',title:"a group's collapse bar shows only when the open group is taller than the window, and closes that group",sizes:[[260,316],[537,424]],
  run:async page=>{
    await r3Field(page);
    await page.tap('[data-fgroup="atk:hazards"] > summary');
    await page.settle();
    assert(await page.value(`document.querySelector('[data-fgroup="atk:hazards"]>.endbar').hidden`),'short group: no bar');
    // Make the open group taller than the window (as a long group at big text zoom would be): its bar appears.
    await page.value(`(()=>{const d=document.querySelector('[data-fgroup="atk:hazards"]'),pad=document.createElement('div');pad.style.height=innerHeight+'px';d.querySelector(':scope>.dtg').after(pad);dispatchEvent(new Event('resize'));})()`);
    await page.settle();
    assert.equal(await page.value(`document.querySelector('[data-fgroup="atk:hazards"]>.endbar').hidden`),false,'tall group shows its bar');
    assert.equal(await page.text('[data-fgroup="atk:hazards"]>.endbar'),'Collapse Hazards');
    await page.value(`document.querySelector('[data-fgroup="atk:hazards"]>.endbar').scrollIntoView({block:'nearest'})`);
    await page.settle();
    await page.tap('[data-fgroup="atk:hazards"]>.endbar');
    const after=await page.value(`(()=>{const d=document.querySelector('[data-fgroup="atk:hazards"]'),r=d.querySelector(':scope>summary').getBoundingClientRect();return {open:d.open,top:r.top,bottom:r.bottom,room:innerHeight,field:document.querySelector('.dfield').open};})()`);
    assert.equal(after.open,false,'bar closes its group');
    assert.equal(after.field,true,'Field stays open');
    assert(after.top>=0&&after.bottom<=after.room,'group heading in view: '+JSON.stringify(after));
    await page.value('CALC.render()');await page.settle();
    assert.equal(await page.value(`document.querySelector('[data-fgroup="atk:hazards"]').open`),false,'closed state kept');
  },
},{
  id:'R3 preview',title:'six two-line trainer preview rows visible without scrolling; a row picks its foe',sizes:[[537,424],[832,424]],
  run:async(page,{width,height,mode})=>{
    await setupCalc(page,{trainer:guide().trainers.six.k});
    await page.value('scrollTo(0,0)');await page.settle();
    const rows=await page.value(`(()=>{const team=document.querySelector('.fteam'),t=team.getBoundingClientRect();const lines=el=>{const range=document.createRange();range.selectNodeContents(el);return new Set([...range.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.bottom))).size;};return {team:{top:t.top,bottom:t.bottom,scroll:team.scrollHeight,client:team.clientHeight},rows:[...team.querySelectorAll('.ft')].map(row=>{const r=row.getBoundingClientRect(),l1=row.querySelector('.l1t');return {top:r.top,bottom:r.bottom,l1:lines(l1),l1h:l1.getBoundingClientRect().height,l2:row.querySelectorAll('.l2t').length,l2w:lines(row.querySelector('.l2t')),text:row.innerText};})};})()`);
    assert.equal(rows.rows.length,6,'six rows');
    assert(rows.team.scroll<=rows.team.client+1,'no scrolling needed: '+JSON.stringify(rows.team));
    for(const row of rows.rows){
      assert(row.top>=rows.team.top-1&&row.bottom<=rows.team.bottom+1&&row.bottom<=height+1,'row visible: '+JSON.stringify(row));
      assert(row.l1<=2&&row.l1h<=20&&row.l2===1&&row.l2w===1,'exactly two lines: '+JSON.stringify(row));
    }
    if(mode==='normal')await r3Shot(page,`preview-${width}x${height}`);
    await page.tap('.fteam .ft',{index:2});
    assert.equal(await page.value('CALC.state().foe.i'),2,'tapping a row picks that foe');
  },
},{
  id:'R3 fight text',title:'closed weather / terrain selects read in full at 260',sizes:[[260,316],[260,394]],
  run:async page=>{
    await setupCalc(page);
    const fits=async label=>{
      const out=await page.value(`(()=>{const canvas=document.createElement('canvas').getContext('2d');return [...document.querySelectorAll('.dfight select')].map(select=>{const style=getComputedStyle(select);canvas.font=style.font;const text=select.options[select.selectedIndex].text;return {text,need:canvas.measureText(text).width,room:select.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-18};});})()`);
      for(const item of out)assert(item.need<=item.room,`${label}: "${item.text}" ${item.need.toFixed(1)} > ${item.room.toFixed(1)}`);
    };
    await fits('auto');
    for(const [key,value] of [['weather',''],['terrain',''],['weather','Rain'],['terrain','Grassy'],['weather','Sand']]){
      if(!await page.value(`[...(document.querySelector('.dfight select[data-f=${key}]')?.options||[])].some(o=>o.value===${JSON.stringify(value)})`))continue; // Gen V: no terrain
      await page.value(`(()=>{const select=document.querySelector('.dfight select[data-f=${key}]');select.value=${JSON.stringify(value)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await page.settle();
      await fits(`${key}=${value||'none'}`);
    }
  },
});
checks.push({
  id:'R3 regroup',title:'entries grouped by what they affect; no Ally labels; Ruin is one global toggle and old per-side saves migrate',sizes:[[260,316]],
  run:async page=>{
    const field=await page.value('CF.calc.field'),key=name=>field.find(entry=>entry.k===name);
    await setupCalc(page);
    await page.tap('.dfield > summary');
    await page.tap('[data-f=gameType][data-value=Doubles]');
    const where=await page.value(`[...document.querySelectorAll('.dfb button[data-f]')].map(button=>({k:button.dataset.f,text:button.textContent,group:button.closest('[data-fgroup]')?.dataset.fgroup||(button.closest('[data-field-side]')?'side':'')}))`);
    assert.deepEqual(where.filter(item=>/\bAlly\b|\(ally\)/.test(item.text)),[],'no Ally labels');
    const groupOf=k=>where.find(item=>item.k===k)?.group;
    for(const k of ['trickRoom','gravity','wonderRoom','magicRoom','waterSport','mudSport','powerSplit','guardSplit','allyFairyAura','allyDarkAura','allyAuraBreak','tabletsOfRuin','swordOfRuin','vesselOfRuin','beadsOfRuin'])if(key(k))assert.equal(groupOf(k),'field:battle',k+' in Global');
    for(const name of ['Reflect','LightScreen','AuroraVeil','Tailwind','Safeguard','LuckyChant','SeaOfFire','Swamp','HelpingHand','FriendGuard','PowerSpot','SteelySpirit','FlowerGift','PlusMinus','DragonCheer','Battery','EmperorPresence'])if(key('atk'+name))assert.equal(groupOf('atk'+name),'side','atk'+name+' in the side grid');
    for(const name of ['Focus','LaserFocus','Charge','PowerTrick','Protect','Roost','MagnetRise','Telekinesis','Foresight','MiracleEye','TarShot','GlaiveRush','Grounded'])if(key('atk'+name))assert.equal(groupOf('atk'+name),'atk:battle','atk'+name+' in States');
    for(const name of ['Trapped','Seeded','SaltCure','Cursed','Nightmare','Ingrain','AquaRing'])if(key('atk'+name))assert.equal(groupOf('atk'+name),'atk:turn','atk'+name+' in Turn end');
    assert.equal(field.filter(entry=>/^(atk|def)(TabletsOf|SwordOf|VesselOf|BeadsOf)Ruin$/.test(entry.k)).length,0,'no per-side Ruin keys');
    if(!key('tabletsOfRuin'))return;
    assert.equal(where.find(item=>item.k==='tabletsOfRuin').text.replace(/A$/,''),'Tablets of Ruin');
    await page.tap('[data-f=gameType][data-value=Singles]');
    assert.equal(await page.count('[data-f=tabletsOfRuin]'),0,'Ruin is Doubles-only');
    // A save from before: per-side Ruin keys, on for one side, become the one global toggle.
    await page.value(`(()=>{const key=Object.keys(localStorage).find(name=>{try{return 'fman' in JSON.parse(localStorage.getItem(name));}catch(e){return false;}});const state=JSON.parse(localStorage.getItem(key));state.field={...state.field,gameType:'Doubles',defTabletsOfRuin:1,atkTabletsOfRuin:0,atkSwordOfRuin:0};state.fman=[...(state.fman||[]),'defTabletsOfRuin'];localStorage.setItem(key,JSON.stringify(state));})()`);
    await page.reload();await page.route('#/calc');
    const state=await page.value('(()=>{const state=CALC.state();return {field:state.field,fman:state.fman};})()');
    assert.equal(state.field.tabletsOfRuin,1,'either side on → global on');
    assert(!('swordOfRuin' in state.field)||!state.field.swordOfRuin,'off stays off');
    assert(!Object.keys(state.field).some(k=>/^(atk|def)\w+OfRuin$/.test(k)),'old keys removed');
    assert(state.fman.includes('tabletsOfRuin')&&!state.fman.some(k=>/^(atk|def)\w+OfRuin$/.test(k)),'manual mark migrated');
  },
});
await runChecks({name:'calc-retest',file,checks});

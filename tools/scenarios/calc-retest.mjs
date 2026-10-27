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
      assert(Math.abs(Math.max(...geometry.moves.map(rect=>rect.bottom))-height)<=1,'fourth rows end at viewport bottom');
      assert(geometry.fight.top>=height,'fight below moves');
      if(height===424){assert(geometry.expanded,'full preview at 424');assert.equal(geometry.team,'auto','preview scrolls internally');assert.equal(geometry.preview.length,6,'all six full preview rows');assert(geometry.preview.every(row=>row.parts===2&&row.text.length>20),'ability and full move text in every row');}
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
    const row=await page.value(`(()=>{const card=document.querySelector('.cc[data-s=mine]'),line=card.querySelector('.cl'),rect=line.getBoundingClientRect();return {height:rect.height,children:[...line.querySelectorAll('[data-lv],[data-hp],[data-tox],.dturn')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};}),left:rect.left,right:rect.right,berry:line.querySelector('.dberry').textContent,residual:line.querySelector('[data-a=eot]').textContent};})()`);
    assert(row.height<=22,'HP row shorter than mockup');
    assert(row.children.length>=5,'level, HP, toxic, residual, berry');
    for(const rect of row.children){assert(rect.left>=row.left-1&&rect.right<=row.right+1,'HP controls inside row');assert(rect.bottom-rect.top<=22);}
    assert(Math.max(...row.children.map(rect=>rect.top))-Math.min(...row.children.map(rect=>rect.top))<=3,'one HP line');
    assert.match(row.berry,/^\+\d*$/,'nameless positive berry');
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
await runChecks({name:'calc-retest',file,checks});

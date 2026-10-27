import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {startBrowser} from '../../tools/browser.mjs';

await mkdir('.tmp/M1', {recursive:true});
const errors=[],results=[];
const browser=await startBrowser({profilePrefix:'calc-retest-',flags:['--hide-scrollbars'],onEvent:message=>{if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);}});
try {
 const target=await browser.send('Target.createTarget',{url:'about:blank'});
 const session=(await browser.send('Target.attachToTarget',{targetId:target.result.targetId,flatten:true})).result.sessionId;
 const send=(method,params={})=>browser.send(method,params,session);
 const evaluate=async expression=>{const reply=await send('Runtime.evaluate',{expression,returnByValue:true});assert.ok(!reply.result.exceptionDetails,JSON.stringify(reply.result.exceptionDetails));return reply.result.result.value;};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const change=(selector,value)=>evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const pause=()=>new Promise(done=>setTimeout(done,150));
 const shot=async name=>{await pause();const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`.tmp/M1/${name}.png`,Buffer.from(image.result.data,'base64'));};
 const geometry=async name=>{const layout=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('main *')].filter(element=>element.getClientRects().length&&element.getBoundingClientRect().right>innerWidth+.5).map(element=>element.className).slice(0,8),rows:[...document.querySelectorAll('.hp-line')].map(element=>({client:element.clientWidth,scroll:element.scrollWidth})),six:['#box','#team'].map(selector=>[...document.querySelector(selector).children].slice(0,6).map(element=>element.getBoundingClientRect().top))})`);assert.equal(layout.scroll,layout.width,name+' page overflow');assert.deepEqual(layout.wide,[],name+' clipped child');for(const row of layout.rows)assert.ok(row.scroll<=row.client,name+' HP row overflow');for(const row of layout.six)assert.equal(new Set(row).size,1,name+' six sprites');results.push({name,...layout});};
 await send('Runtime.enable');await send('Page.enable');
 for(const [width,height] of [[260,316],[260,394],[480,392]])for(const keyboard of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(resolve('plans/calc-retest-mockup/mock.html')).href});await pause();
  await evaluate(`localStorage.setItem('dvkb','${keyboard?'1':'0'}');location.reload()`);await pause();
  const label=`${width}x${height}-${keyboard?'dvkb':'normal'}`;
  await geometry(label+'-closed');await shot(label+'-closed');
  await evaluate(`demo('cards')`);await shot(label+'-cards');
  await click('[data-damage="73"][data-side="0"]');
  assert.deepEqual(await evaluate('mons.map(mon=>mon.hp)'),[101,107],'player damage, recoil and Helmet');
  await evaluate('resetFight()');await click('[data-damage="73"][data-side="1"]');
  assert.deepEqual(await evaluate('mons.map(mon=>mon.hp)'),[145,162],'foe damage and target berry');
  await evaluate('resetFight();demo("edit")');await geometry(label+'-edit');await shot(label+'-edit');
  await click('[data-part="14"][data-side="0"]');assert.equal(await evaluate('mons[0].hp'),172);
  if(keyboard){await click('[data-ability="0"]');await click('[data-choice="Other…"]');}else await change('[data-ability="0"]','Other…');await geometry(label+'-ability');await shot(label+'-ability-picker');
  await evaluate(`document.querySelector('#query').value='lev';paintPicker()`);
  await click('[data-choice="Levitate"]');assert.equal(await evaluate('mons[0].ability'),'Levitate');
  await click('[data-other-clear="0"]');assert.equal(await evaluate('!!mons[0].other'),false);
  await click('[data-combo="item"][data-side="0"]');
  if(keyboard){for(const letter of 'LIFE')await click(`[data-key="${letter}"]`);}else await evaluate(`document.querySelector('#query').value='Life';paintPicker()`);
  await geometry(label+'-item-picker');await shot(label+'-item-picker');
  await click('[data-choice="Life Orb"]');assert.equal(await evaluate('mons[0].item'),'Life Orb');
  await evaluate('resetFight();demo("move")');await geometry(label+'-move');await shot(label+'-move');
  assert.equal(await evaluate('document.querySelectorAll("#move-0-0 .rolls button").length'),16);
  await click('#move-0-0 [data-roll="86"]');assert.equal(await evaluate('document.querySelector("#amount-0-0").value'),'86');
  if(keyboard){await click('#amount-0-0');await click('[data-clear-query]');await click('[data-key="5"]');await click('[data-key="0"]');await shot(label+'-number-pad');await click('[data-done]');}else await evaluate('document.querySelector("#amount-0-0").value=50');
  await click('[data-apply="0"][data-side="0"]');assert.deepEqual(await evaluate('mons.map(mon=>mon.hp)'),[107,130]);
  await change('[data-hits="0"]','5');assert.equal(await evaluate('document.querySelector("#move-0-2 .damage button").textContent'),'60');
  await click('[data-toggle-move="4"][data-side="0"]');assert.equal(await evaluate('field.atkReflect'),true);
  await click('[data-field="atkReflect"]');assert.equal(await evaluate('enabled(MOVES[4],0)'),false);
  await click('[data-toggle-move="6"][data-side="0"]');assert.equal(await evaluate('field.defSpikes'),1);
  await click('[data-toggle-move="9"][data-side="0"]');assert.equal(await evaluate('field.weather'),'Rain');
  await click('[data-toggle-move="11"][data-side="0"]');assert.equal(await evaluate('mons[0].vol'),'dig');
  await evaluate('demo("field")');await geometry(label+'-field');await shot(label+'-field');
  await click('[data-reset-fight]');assert.equal(await evaluate('field.gameType'),'Singles');assert.equal(await evaluate('field.defSpikes||0'),0);
  assert.equal(await evaluate('document.querySelector("[data-residual]").textContent'),'14');
  await evaluate(`mons[1].hp=235;mons[1].item='Focus Sash';mons[0].item='Life Orb';render();applyDamage(0,300,0)`);
  assert.equal(await evaluate('mons[1].hp'),1);assert.equal(await evaluate('mons[1].item'),'No item');assert.ok((await evaluate('document.querySelector("#log").textContent')).includes('Life Orb'));
  await evaluate(`resetFight();mons[1].hp=235;mons[1].ability='Sturdy';render();applyDamage(0,300,0)`);assert.equal(await evaluate('mons[1].hp'),1);
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});await evaluate('resetFight();demo("cards")');await geometry('light');await shot('480-light');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:800,height:720,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:pathToFileURL(resolve('dist/calc-retest-mock.html')).href});await pause();
 const frames=[];
 for(const [width,height] of [[260,316],[260,394],[480,392]])for(const keyboard of [false,true]){
  await evaluate(`localStorage.setItem('dvkb','${keyboard?'1':'0'}');W=${width};H=${height};FIT=false;scale();load()`);await pause();
  const frame=await evaluate(`({width:thorFrame().innerWidth,height:thorFrame().innerHeight,scroll:thorFrame().document.documentElement.scrollWidth,keyboard:thorFrame().document.body.classList.contains('dvkb'),errors:thorFrame().__errs})`);
  assert.equal(frame.width,width);assert.equal(frame.height,height);assert.equal(frame.scroll,width);assert.equal(frame.keyboard,keyboard);assert.deepEqual(frame.errors,[]);frames.push(frame);
 }
 await shot('thor-frame-480-dvkb');
 assert.deepEqual(errors,[]);await writeFile('.tmp/M1/checks.json',JSON.stringify({results,frames,errors},null,2));console.log(`PASS: ${results.length} layouts; six scenario passes; six framed viewports; no exceptions`);
}finally{await browser.close();}

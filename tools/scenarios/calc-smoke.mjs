import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startBrowser } from '../browser.mjs';
import { guideSaves } from '../calc_check_lib.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const guide=resolve(process.argv[2]||join(root,'dist/emerald-imperium.html'));
let page=readFileSync(guide,'utf8');
const dataMatch=page.match(/(<script id="data"[^>]*>)([\s\S]*?)(<\/script>)/);
assert(dataMatch,'missing #data');
const data=JSON.parse(dataMatch[2]);
if(!data.cfg.calc){console.log('SKIP calc-smoke: no cfg.calc');process.exit(0);}
const saves=guideSaves(data,'calc-smoke-'+basename(guide,'.html'));
data.cfg.calc.save='test';
page=page.replace(dataMatch[0],()=>dataMatch[1]+JSON.stringify(data).replaceAll('</','<\\/')+dataMatch[3]);
page=page.replace('window.DMG.init(sourceData,prof);',()=>readFileSync(join(root,'template/calc/readers/test.js'),'utf8')+'\nwindow.DMG.init(sourceData,prof);');
const output=join(root,'.tmp/calc',basename(guide,'.html'));mkdirSync(output,{recursive:true});
const built=join(output,'test.html');writeFileSync(built,page);
const failures=[];
const browser=await startBrowser({profilePrefix:'calc-smoke-',flags:['--hide-scrollbars'],onEvent:event=>{if(event.method==='Runtime.exceptionThrown')failures.push(event.params.exceptionDetails.exception?.description||event.params.exceptionDetails.text);}});
try{
 const {result:{browserContextId}}=await browser.send('Target.createBrowserContext');
 const {result:{targetId}}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const {result:{sessionId}}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
 const send=(method,params={})=>browser.send(method,params,sessionId);
 const evaluate=async expression=>{const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!reply.result?.exceptionDetails,JSON.stringify(reply.result?.exceptionDetails));return reply.result?.result?.value;};
 const waitFor=async expression=>{for(let attempt=0;attempt<100;attempt++){if(await evaluate(expression))return;await new Promise(done=>setTimeout(done,50));}assert.fail('Timed out: '+expression);};
 const importFixture=async(name,expected)=>{const {result:{root:document}}=await send('DOM.getDocument');const {result:{nodeId}}=await send('DOM.querySelector',{nodeId:document.nodeId,selector:'#calc-file'});assert(nodeId,'missing file input');await send('DOM.setFileInputFiles',{nodeId,files:[join(saves,name)]});await waitFor(expected);};
 await send('Page.enable');await send('Runtime.enable');
 for(const [width,height,keyboard] of [[260,316,false],[260,316,true],[480,392,false],[537,424,false],[832,424,false]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();localStorage.setItem('dvkb',${JSON.stringify(keyboard?'1':'0')});`});
  await send('Page.navigate',{url:pathToFileURL(built).href+'#/calc'});
  for(let attempt=0;attempt<100;attempt++){if(await evaluate('!!window.CALC'))break;await new Promise(done=>setTimeout(done,50));}
  assert(await evaluate('!!window.CALC'),'calc did not initialize');
  await importFixture('good.json',`document.querySelector('.ban')?.textContent.includes('Imported good.json')`);
  assert.equal(await evaluate(`document.querySelectorAll('.mg .dstrip button').length`),61,'import grid');
  await evaluate(`(()=>{const trainer=TRS.find(entry=>entry.p.length>=4&&entry.p.every(mon=>byId[mon.id]));CALC.state().mine={src:'party',b:0,i:5};CALC.enter(trainer.k,0);CALC.render();document.querySelector('[data-a="bandis"]').click();scrollTo(0,document.querySelector('.fbar').getBoundingClientRect().top+scrollY-2);})()`);
  const dimensions=await evaluate(`(()=>{const rows=[...document.querySelectorAll('.dres:not(.na) .mr')];return {width:document.documentElement.scrollWidth,bottom:rows.at(-1)?.getBoundingClientRect().bottom,trainer:document.querySelector('.fbar').getBoundingClientRect().top,mine:document.querySelector('.mg .dstrip button').getBoundingClientRect().height,foe:document.querySelector('.dside:not(.mg) .dstrip button').getBoundingClientRect().height};})()`);
  assert.equal(dimensions.width,width,'horizontal overflow');if(width===260)assert.equal(dimensions.mine,dimensions.foe,'cell size mismatch');
  if(width===260){assert(Math.abs(dimensions.trainer-2)<2,JSON.stringify(dimensions));assert(dimensions.bottom<=316,`Fit (all four moves inside 260 × 316, plans/calc-retest.md item 2): ${JSON.stringify(dimensions)}`);}
  const screenshot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(output,`${width}x${height}${keyboard?'-dvkb':''}.png`),Buffer.from(screenshot.result.data,'base64'));
  const selection=await evaluate(`JSON.stringify(CALC.state().mine)`);
  await importFixture('wrong.json',`document.querySelector('.ban.bad')?.textContent.includes('Wrong game')`);
  assert.equal(await evaluate(`document.querySelectorAll('.mg .dstrip button').length`),61,'error replaced grid');
  assert.equal(await evaluate(`JSON.stringify(CALC.state().mine)`),selection,'error replaced selection');
  assert(await evaluate(`document.querySelector('.ban.bad')?.textContent.includes('Wrong game')`),'missing error banner');
  assert.deepEqual(failures,[],'page errors');
  console.log('PASS calc-smoke',width,height,keyboard?'dvkb':'normal',JSON.stringify(dimensions));
 }
}finally{await browser.close();}

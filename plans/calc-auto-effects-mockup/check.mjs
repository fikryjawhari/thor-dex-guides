// Scenario run of the auto-effects mockup (inner page): node plans/calc-auto-effects-mockup/check.mjs
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {startBrowser} from '../../tools/browser.mjs';
const errors=[];
const browser=await startBrowser({profilePrefix:'calc-auto-mock-',onEvent:m=>{if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,400));}});
try{
  const target=await browser.send('Target.createTarget',{url:'about:blank'});
  const session=(await browser.send('Target.attachToTarget',{targetId:target.result.targetId,flatten:true})).result.sessionId;
  const send=(method,params={})=>browser.send(method,params,session);
  const v=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};
  await send('Runtime.enable');await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:260,height:316,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(resolve('plans/calc-auto-effects-mockup/mock.html')).href});
  await new Promise(r=>setTimeout(r,800));
  await v(`localStorage.clear();location.reload()`);await new Promise(r=>setTimeout(r,800));
  const click=sel=>v(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw new Error('missing '+${JSON.stringify(sel)});e.click();return true})()`);
  const txt=sel=>v(`document.querySelector(${JSON.stringify(sel)}).innerText`);
  const out=[];const note=async l=>out.push(l+'\n  mine: '+(await txt('#cm')).replace(/\n/g,' | ')+'\n  foe:  '+(await txt('#cf')).replace(/\n/g,' | ')+'\n  field: '+(await txt('#fsum')));
  await note('start Route 33');
  await click('[data-a=row][data-k="0"]');out.push('  move0: '+(await txt('#mv')).replace(/\n/g,' | '));
  await click('[data-a=intim]');await note('intimidate off');await click('[data-a=intim]');
  await click('[data-a=pick][data-s=mine][data-i="1"]');await note('Hippopotas in (sand vs area rain)');
  await click('[data-a=pick][data-s=mine][data-i="0"]');await note('Growlithe back');
  await click('[data-a=dir]');await click('[data-a=pick][data-s=foe][data-i="3"]');await click('[data-a=row][data-k="2"]');
  out.push('  lombre moves: '+(await txt('#mv')).replace(/\n/g,' | '));
  for(let i=0;i<3;i++){await click('.mr.open [data-a=sub]:last-child');}
  await note('after Lombre PuP x3 on Growlithe');
  await click('[data-a=pick][data-s=mine][data-i="3"]');await click('[data-a=row][data-k="0"]');await click('.mr.open [data-a=sub]');await note('Dwebble hit');
  await click('[data-a=pick][data-s=mine][data-i="2"]');await note('Timburr (Flame Orb)');
  await click('[data-a=turn][data-s=mine]');await note('Timburr turn end');
  await click('[data-a=tn]');await note('Union Cave');
  await click('[data-a=pick][data-s=mine][data-i="0"]');await click('[data-a=pick][data-s=foe][data-i="2"]');await note('Growlithe vs Bibarel (Simple)');
  const over=await v('document.documentElement.scrollWidth>innerWidth');
  await writeFile('.tmp/calc-auto-mock-check.txt',out.join('\n'));console.log(out.join('\n'));
  assert.equal(over,false,'no horizontal overflow at 260');
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  await writeFile('.tmp/calc-auto-mock.png',Buffer.from(shot.result.data,'base64'));
}finally{await browser.close();}
assert.deepEqual(errors,[]);

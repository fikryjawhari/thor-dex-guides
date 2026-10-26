import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {startBrowser} from '../../tools/browser.mjs';

const errors=[];
const browser=await startBrowser({profilePrefix:'calc-edit-mock-',onEvent:message=>{
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
}});
try{
  const target=await browser.send('Target.createTarget',{url:'about:blank'});
  const attached=await browser.send('Target.attachToTarget',{targetId:target.result.targetId,flatten:true});
  const session=attached.result.sessionId;
  const send=(method,params={})=>browser.send(method,params,session);
  const value=async expression=>{
    const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(reply.result.exceptionDetails)throw new Error(JSON.stringify(reply.result.exceptionDetails));
    return reply.result.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  const file=pathToFileURL(resolve('dist/calc-state-edit-mock.html')).href;
  for(const [width,height] of [[260,316],[260,350],[480,392],[537,424],[832,424]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:file});
    let ready=false;
    for(let attempt=0;attempt<50;attempt++){
      ready=await value('typeof window.mockMeasurements === "function"');
      if(ready)break;
      await new Promise(done=>setTimeout(done,100));
    }
    assert.ok(ready,'mock loaded');
    for(const keyboard of [false,true]){
      await value(`localStorage.setItem('dvkb',${JSON.stringify(keyboard?'1':'0')});setOption('reset',true)`);
      const before=await value('mockMeasurements()');
      assert.equal(before.overflow,false,`${width}: no overflow`);
      if(width===260&&height===316)assert.ok(before.fourthMove<=309,`fourth move ends at ${before.fourthMove}`);
      await value(`setOption('residual',false)`);
      const plain=await value('mockMeasurements()');
      await value(`document.querySelector('[data-action="apply-turn"][data-side="0"]')?.click()`);
      assert.equal(plain.teamHeight,before.teamHeight,'residuals do not resize team');
      assert.equal(plain.teamList,before.teamList,'residuals do not change team presentation');
      await value(`setOption('residual',true);document.querySelector('[data-action="edit"][data-side="0"]').click()`);
      const edited=await value('mockMeasurements()');
      assert.equal(edited.teamHeight,before.teamHeight,'Edit does not resize team');
      assert.equal(edited.teamTop,before.teamTop,'Edit does not move team');
      assert.equal(edited.teamList,before.teamList,'Edit does not change team presentation');
      assert.equal(edited.editors,width>=480?2:1,'both wide editors populated');
      assert.equal(edited.overflow,false,'editor does not overflow');
      await value(`document.querySelector('[data-action="move"]').click()`);
      const expanded=await value('mockMeasurements()');
      assert.ok(expanded.fieldTop>=expanded.movesBottom,'Field below expanded moves');
      await value(`document.querySelector('[data-action="edit"][data-side="0"]').click()`);
      assert.equal((await value('mockMeasurements()')).editors,0,'collapse both');
      for(const [preset,selector] of [['download','[data-key="download"]'],['sword','[data-key="entryOff"][data-side="0"]'],['shield','[data-key="entryOff"][data-side="1"]'],['rush','[aria-label="First turn out"]'],['form','[aria-label="Disguised"]']]){
        await value(`setOption('preset',${JSON.stringify(preset)});document.querySelector('[data-action="edit"][data-side="${preset==='shield'?1:0}"]').click()`);
        assert.ok(await value(`document.querySelector(${JSON.stringify(selector)})!==null`),preset+' control');
        assert.equal((await value('mockMeasurements()')).overflow,false,preset+' fits');
      }
      console.log(`PASS ${width}x${height} ${keyboard?'dvkb':'normal'}: fourth move ${before.fourthMove}px, team ${before.teamHeight}px, Edit/residual stable, Field below details`);
    }
    if(width===537){
      await value(`setOption('reset',true)`);
      const screenshot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile('dist/calc-state-edit-closed.png',Buffer.from(screenshot.result.data,'base64'));
      await value(`setOption('preset','download');document.querySelector('[data-action="edit"][data-side="0"]').click()`);
      const expanded=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      await writeFile('dist/calc-state-edit-open.png',Buffer.from(expanded.result.data,'base64'));
    }
  }
  assert.deepEqual(errors,[],'no browser exceptions');
}finally{
  await browser.close();
}

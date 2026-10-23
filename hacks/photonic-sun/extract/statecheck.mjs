import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [baseline, current] = process.argv.slice(2);
const chromePath = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const profile = mkdtempSync(join(tmpdir(), 'ps-state-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = milliseconds => new Promise(done => setTimeout(done, milliseconds));
const pending = new Map(), errors = [];
let socket, sequence = 0;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      socket = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
      break;
    } catch { await sleep(100); }
  }
  assert(socket, 'Chrome connection');
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  };
  const send = (method, params = {}, sessionId) => new Promise(done => {
    const commandId = ++sequence;
    pending.set(commandId, done);
    socket.send(JSON.stringify({ id: commandId, method, params, sessionId }));
  });
  for (const keyboard of [false, true]) {
    const { result: { browserContextId } } = await send('Target.createBrowserContext');
    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
    const evaluate = async expression => {
      const message = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
      assert(!message.error && !message.result.exceptionDetails, JSON.stringify(message));
      return message.result.result.value;
    };
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2.3, mobile: true }, sessionId);
    const navigate = async file => {
      await send('Page.navigate', { url: pathToFileURL(resolve(file)).href + '#/walk' }, sessionId);
      await sleep(250);
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(`document.readyState==='complete' && typeof WO!=='undefined'`)) return;
        await sleep(100);
      }
      throw Error('Guide readiness timeout');
    };
    await navigate(baseline);
    const seed = await evaluate(`(()=>{
      const encounters={};AR.forEach((area,index)=>{const found=P.find(p=>p.g===0&&p.w.some(row=>row[0]===index));
        if(found)encounters[index]={p:found.id};});
      encounters[0]={p:'rowlet'};
      return {dvkb:'${keyboard ? '1' : '0'}',[LS.track]:JSON.stringify({s:'Rowlet',pl:'',e:encounters,t:{}}),
        [LS.dex]:JSON.stringify({f:[{k:'loc',v:1},{k:'mv',v:1},{k:'ab',v:0}],sort:'name',av:'all'}),
        [LS.cap]:JSON.stringify({'0.0.0':13}),[LS.walk]:JSON.stringify({c:{'0.0.0':1,'1.0.0':1},o:{1:1},x:{'1.0':0},s:{'1.0.e':0}})};
    })()`);
    await send('Page.navigate', { url: 'about:blank' }, sessionId);
    await sleep(250);
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `if(!sessionStorage.psStateSeeded){Object.entries(${JSON.stringify(seed)}).forEach(([key,value])=>localStorage.setItem(key,value));sessionStorage.psStateSeeded='1';}` }, sessionId);
    await navigate(baseline);
    assert(await evaluate(`WO.x['1.0']===0 && WO.s['1.0.e']===0`));
    const baselineRendering=await evaluate(`(()=>{
      const stop=app.querySelector('details.stopd[data-k="1.0"]'),section=app.querySelector('details.sec[data-s="1.0.e"]');
      const closed=stop.open===false,sectionClosed=section.open===false;
      D.WK.splits[1].st[0].s=[['Legacy tick probe','']];render();
      return {closed,sectionClosed,tickChecked:app.querySelector('input[data-sk="1.0.0"]').checked};
    })()`);
    assert(baselineRendering.closed && baselineRendering.sectionClosed && baselineRendering.tickChecked);
    await navigate(current);
    const result = await evaluate(`(()=>{
      const mapping=D.WK.legacyStops,now=Object.keys(mapping).find(key=>mapping[key]==='1.0');
      return {storage:Object.fromEntries(Object.keys(${JSON.stringify(seed)}).map(key=>[key,localStorage.getItem(key)])),
        tracked:Object.values(TK.e).filter(entry=>entry.p).length,allTrackedResolve:Object.values(TK.e).every(entry=>!entry.p||!!byId[entry.p]),
        filters:st.f,cap:TCAP['0.0.0'],tick:WO.c['0.0.0'],oldStop:'1.0',newStop:now,
        oldClosed:WO.x['1.0']===0,newClosed:WO.x[now]===0,oldSectionClosed:WO.s['1.0.e']===0,newSectionClosed:WO.s[now+'.e']===0,
        checklistSteps:D.WK.splits.flatMap(split=>split.st).reduce((count,stop)=>count+stop.s.length,0),width:document.documentElement.scrollWidth};
    })()`);
    for (const key of ['dvkb','psdex','pscap','pstrack']) assert.equal(result.storage[key],seed[key],key+' survives');
    const storedWalk=JSON.parse(result.storage.pswalk),oldWalk=JSON.parse(seed.pswalk);
    assert.deepEqual(storedWalk.c,oldWalk.c);
    assert.equal(storedWalk.x['1.0'],0);
    assert.equal(storedWalk.s['1.0.e'],0);
    assert(result.allTrackedResolve && result.tracked > 0);
    assert.equal(result.filters.length, 3);
    assert.equal(result.cap, 13);
    assert.equal(result.tick, 1);
    assert.equal(result.checklistSteps, 0);
    assert.equal(result.width, 260);
    const {storage,...summary}=result;
    console.log(keyboard ? 'dvkb' : 'normal', JSON.stringify(summary));
    console.log('PASS: baseline dex filters, tracker species IDs, per-trainer cap and stored tick bytes survive');
    console.log(result.newClosed && result.newSectionClosed ? 'PASS: open-state migration' :
      'BLOCKER: saved Route 1 stop/section collapse is not transferred from 1.0 to '+result.newStop);
    const currentRendering=await evaluate(`(()=>{
      const now=Object.keys(D.WK.legacyStops).find(key=>D.WK.legacyStops[key]==='1.0'),[splitIndex,stopIndex]=now.split('.').map(Number);
      WO.o[splitIndex]=1;D.WK.splits[splitIndex].st[stopIndex].s=[['Legacy tick probe','']];render();
      return {closed:app.querySelector('details.stopd[data-k="'+now+'"]').open===false,
        sectionClosed:app.querySelector('details.sec[data-s="'+now+'.e"]').open===false,
        tickChecked:app.querySelector('input[data-sk="'+now+'.0"]').checked,
        legacyTickStillStored:!!WO.c['1.0.0']};
    })()`);
    console.log('actual rendering',JSON.stringify({baseline:baselineRendering,current:currentRendering}));
    assert(currentRendering.legacyTickStillStored);
    console.log(currentRendering.tickChecked ? 'PASS: synthetic legacy checklist rendering' :
      'BLOCKER: synthetic legacy tick remains stored but new rendered checklist checkbox is unchecked (PS itself has zero steps)');
    await send('Target.disposeBrowserContext', { browserContextId });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: no browser page errors');
} finally {
  socket?.close();
  chrome.kill();
}

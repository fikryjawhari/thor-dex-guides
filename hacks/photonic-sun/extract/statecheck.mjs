import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [baseline, current] = process.argv.slice(2);
assert(process.argv.length === 4 && existsSync(baseline) && existsSync(current),
  'Usage: node hacks/photonic-sun/extract/statecheck.mjs <baseline.html> <current.html>');
const chromePath = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
assert(chromePath, 'Chrome or Edge required (or set CHROME)');
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
  for (const keyboard of [false, true]) for (const stamped of [false, true]) {
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
      const walk={c:{},o:{gi:1},x:{doc0:1},s:{}};
      const layout=D.WK.splits.map((split,splitIndex)=>{
        walk.o[splitIndex]=1;
        return split.st.map((stop,stopIndex)=>{
          const key=splitIndex+'.'+stopIndex;
          walk.c[key+'.0']=1;walk.x[key]=0;
          for(const [section,value] of Object.entries({e:0,c:1,i:1,t:1}))walk.s[key+'.'+section]=value;
          return String(stop.k??key);
        });
      });
      if(${stamped})walk.layout=layout;
      return {dvkb:'${keyboard ? '1' : '0'}',[LS.track]:JSON.stringify({s:'Rowlet',pl:'',e:encounters,t:{}}),
        [LS.dex]:JSON.stringify({f:[{k:'loc',v:1},{k:'mv',v:1},{k:'ab',v:0}],sort:'name',av:'all'}),
        [LS.cap]:JSON.stringify({'0.0.0':13}),[LS.walk]:JSON.stringify(walk)};
    })()`);
    await send('Page.navigate', { url: 'about:blank' }, sessionId);
    await sleep(250);
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `if(!sessionStorage.psStateSeeded){Object.entries(${JSON.stringify(seed)}).forEach(([key,value])=>localStorage.setItem(key,value));sessionStorage.psStateSeeded='1';}` }, sessionId);
    await navigate(baseline);
    assert(await evaluate(`WO.x['1.0']===0 && WO.s['1.0.e']===0`));
    const inspectRendering = async () => evaluate(`(()=>{
      D.WK.splits.forEach(split=>split.st.forEach(stop=>stop.s=[['Legacy tick probe',''],['Unchecked probe','']]));
      render();
      return D.WK.splits.flatMap((split,splitIndex)=>split.st.map((stop,stopIndex)=>{
        const key=splitIndex+'.'+stopIndex,element=app.querySelector('details.stopd[data-k="'+key+'"]');
        const section=element?.querySelector('details.sec[data-s="'+key+'.e"]');
        return {key,splitOpen:app.querySelector('details[data-wo="'+splitIndex+'"]').open,
          closed:element?.open===false,sectionClosed:section?section.open===false:null,
          checklistOpen:element?.querySelector('details.sec[data-s="'+key+'.c"]')?.open===true,
          tickChecked:element?.querySelector('input[data-sk="'+key+'.0"]')?.checked===true,
          secondUnchecked:element?.querySelector('input[data-sk="'+key+'.1"]')?.checked===false};
      }));
    })()`);
    const assertRendering = (rows, label) => {
      assert(rows.length > 0, label+' has stops');
      for (const row of rows) assert(row.splitOpen && row.closed && row.sectionClosed !== false &&
        row.checklistOpen && row.tickChecked && row.secondUnchecked, label+' '+JSON.stringify(row));
    };
    const baselineRendering=await inspectRendering();
    assertRendering(baselineRendering, 'baseline rendering');
    await navigate(current);
    const result = await evaluate(`(()=>{
      const mapping=D.WK.legacyStops,now=Object.keys(mapping).find(key=>mapping[key]==='1.0');
      return {storage:Object.fromEntries(Object.keys(${JSON.stringify(seed)}).map(key=>[key,localStorage.getItem(key)])),
        tracked:Object.values(TK.e).filter(entry=>entry.p).length,allTrackedResolve:Object.values(TK.e).every(entry=>!entry.p||!!byId[entry.p]),
        filters:st.f,cap:TCAP['0.0.0'],oldStop:'1.0',newStop:now,mapping,
        layout:D.WK.splits.map((split,splitIndex)=>split.st.map((stop,stopIndex)=>String(stop.k??(splitIndex+'.'+stopIndex)))),
        checklistSteps:D.WK.splits.flatMap(split=>split.st).reduce((count,stop)=>count+stop.s.length,0),width:document.documentElement.scrollWidth};
    })()`);
    for (const key of ['dvkb','psdex','pscap','pstrack']) assert.equal(result.storage[key],seed[key],key+' survives');
    const storedWalk=JSON.parse(result.storage.pswalk),oldWalk=JSON.parse(seed.pswalk);
    assert(result.mapping && result.newStop, 'current viewer must contain the PS legacy stop mapping');
    assert(result.allTrackedResolve && result.tracked > 0);
    assert.equal(result.filters.length, 3);
    assert.equal(result.cap, 13);
    assert.equal(result.checklistSteps, 0);
    assert.equal(result.width, 260);
    const currentRendering=await inspectRendering();
    assertRendering(currentRendering, 'migrated rendering (shared template migration required)');
    const expected={c:{},o:{gi:oldWalk.o.gi},x:{doc0:oldWalk.x.doc0},s:{}};
    for (const [position,legacy] of Object.entries(result.mapping)) {
      expected.c[position+'.0']=oldWalk.c[legacy+'.0'];
      expected.x[position]=oldWalk.x[legacy];
      for(const section of ['e','c','i','t'])expected.s[position+'.'+section]=oldWalk.s[legacy+'.'+section];
      if(oldWalk.o[legacy.split('.')[0]])expected.o[position.split('.')[0]]=1;
    }
    for(const kind of ['c','o','x','s'])assert.deepEqual(storedWalk[kind],expected[kind],kind+' follows logical stops/fragments');
    assert.deepEqual(storedWalk.layout,result.layout,'layout records current stable identities');
    await sleep(150);
    const migrated=await evaluate('JSON.stringify(WO)');
    await navigate(current);
    assert.equal(await evaluate('JSON.stringify(WO)'),migrated,'reload is idempotent');
    assertRendering(await inspectRendering(), 'reloaded rendering');
    await evaluate(`(()=>{
      const key=${JSON.stringify(result.newStop)},checkbox=app.querySelector('input[data-sk="'+key+'.0"]');
      checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
      app.querySelector('details.stopd[data-k="'+key+'"]').open=true;return true;
    })()`);
    await sleep(150);
    await navigate(current);
    const edited=(await inspectRendering()).find(row=>row.key===result.newStop);
    assert(!edited.tickChecked && !edited.closed && edited.sectionClosed !== false,
      'uncheck/reopen survive reload without resurrecting legacy state: '+JSON.stringify(edited));
    await evaluate('WO.c={};woSave();true');
    await navigate(current);
    assert.equal(await evaluate('Object.keys(WO.c).length'),0,'cleared ticks stay cleared on reload');
    assert((await inspectRendering()).every(row=>!row.tickChecked),'reset renders all checkboxes unchecked');
    console.log('PASS:',keyboard?'dvkb':'normal',stamped?'layout-stamped save':'legacy save',
      baselineRendering.length+' stops -> '+currentRendering.length+' fragments',
      'rendered collapse/sections/ticks/split expansion, semantic c/o/x/s, layout, reload, uncheck/reopen/reset;',
      result.tracked+' tracker picks, dex filters, trainer cap, width 260');
    await send('Target.disposeBrowserContext', { browserContextId });
  }
  assert.deepEqual(errors, []);
  console.log('PASS: no browser page errors');
} finally {
  socket?.close();
  chrome.kill();
}

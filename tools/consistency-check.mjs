import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

// node tools/consistency-check.mjs [hack ...]: after python assemble.py, the shared behaviour checks on every built guide
// (or the ones named): saved state, starter / player pickers, single caps, MGM, five viewer sizes, expanded pages, light
// theme, normal and dvkb. A guide is checked when hacks/<hack>/hack.json and dist/<hack>.html both exist.
const ARGS = process.argv.slice(2);

const chromePath = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const profile = mkdtempSync(join(tmpdir(), 'consistency-'));
mkdirSync('.tmp', { recursive: true });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--allow-file-access-from-files', '--disable-ipc-flooding-protection', 'about:blank'], { stdio: 'ignore' });
const sleep = milliseconds => new Promise(done => setTimeout(done, milliseconds));
const pending = new Map();
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
  };
  const send = (method, params = {}, sessionId) => new Promise(done => {
    const commandId = ++sequence;
    pending.set(commandId, done);
    socket.send(JSON.stringify({ id: commandId, method, params, sessionId }));
  });
  const hacks = ARGS.length ? ARGS : readdirSync('hacks').filter(hack => existsSync(`hacks/${hack}/hack.json`) && existsSync(`dist/${hack}.html`));
  let shot = false;
  for (const hack of hacks) for (const keyboard of [false, true]) {
    const { result: { browserContextId } } = await send('Target.createBrowserContext');
    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
    const evaluate = async expression => {
      const message = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
      assert(!message.error && !message.result?.exceptionDetails, JSON.stringify(message));
      return message.result.result.value;
    };
    await send('Page.enable', {}, sessionId);
    const config = JSON.parse(readFileSync(`hacks/${hack}/hack.json`, 'utf8')).cfg;
    const data = JSON.parse(readFileSync(`hacks/${hack}/data.json`, 'utf8'));
    const starter = data.P.find(pokemon => pokemon.n === 'Treecko');
    const evOn = mons => (mons || []).some(mon => mon.ev?.some(value => value > 0));
    const mgm = config.evs !== false && (data.TR?.g || []).some(group => group.sec.some(section => section.tr.some(trainer =>
      evOn(trainer.p) || (trainer.pt || []).some(partner => evOn(partner.p)))));
    const seed = { [config.ls.dex]: JSON.stringify({ av: 'chg' }), [config.ls.walk]: JSON.stringify({c:{'0.0.0':1}}), dvkb: keyboard ? '1' : '0' };
    if (config.starter === 'type' && starter) seed[config.ls.track] = JSON.stringify({ e: { 0: { p: starter.id }, 1: { f: 1 } }, t: {} });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `for (const [key,value] of Object.entries(${JSON.stringify(seed)}))localStorage.setItem(key,value); window.checkErrors=[];addEventListener('error',event=>checkErrors.push(event.message));` }, sessionId);
    await send('Page.navigate', { url: pathToFileURL(resolve(`dist/${hack}.html`)).href + '#/trainers' }, sessionId);
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`document.readyState==='complete'&&typeof HAS_MGM!=='undefined'`)) break;
      await sleep(100);
    }
    const result = await evaluate(`(async()=>{
      const checks=[];
      const check=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
      const go=async hash=>{history.replaceState(null,'',hash);render();await new Promise(requestAnimationFrame);};
      check(st.av==='all','obsolete changed filter restored');
      check(HAS_MGM===${mgm},'MGM availability');
      check(!document.querySelector('.capsw,.capt'),'single cap UI');
      check(!TRD.mini&&TRD.g.every(group=>group.sec.every(section=>!Array.isArray(section.cap?.[0]))),'legacy caps normalized');
      check(WO.c['0.0.0']===1,'saved walkthrough ticks retained');
      check(document.querySelector('.tr-all')?.textContent==='Expand allCollapse all','split wording');
      check(capOfSec({cap:40})[0]===40&&capOfSec({cap:[42,'Boss','Place',2]})[0]===42,'both single cap schemas');
      if(CF.starter==='type'&&${!!starter}){
        check(TK.s==='Treecko'&&starterType()==='Grass'&&TK.e[1].f,'old type-starter save migrated without shifting tracker');
        check(TRS.filter(trainer=>trainer.st&&!rivalHidden(trainer)).every(trainer=>trainer.st==='Grass'),'rivals follow starter type');
      }
      if(PICK){
        const select=document.querySelector('.tk-starter');select.value=STARTERS[1];select.onchange();
        check(TK.s===STARTERS[1],'named picker writes starter choice');
        if(STARTER_AREA>=0){
          check(byId[TK.e[STARTER_AREA].p].name===TK.s,'named picker writes starter tracker');
          TK.e[STARTER_AREA]={f:1};rerender();check(TK.s==='','failed starter clears choice');
          delete TK.e[STARTER_AREA];rerender();check(TK.s==='','cleared starter clears choice');
        }
      }
      if(HAS_MGM){
        let toggle=document.querySelector('.mgm-toggle');toggle.checked=true;toggle.onchange();
        await go('#/walk');document.querySelector('[data-wo="gi"]').open=true;
        await new Promise(done=>setTimeout(done,50));toggle=document.querySelector('.mgm-toggle');
        check(toggle?.checked&&localStorage.getItem(LS.mgm)==='1','Guide info shares MGM state');
        toggle.checked=false;toggle.onchange();await go('#/trainers');
        check(!document.querySelector('.mgm-toggle').checked,'Guide info updates Trainers MGM');
      }
      check(!guideInfoHTML().includes('mgm-toggle')||HAS_MGM,'no MGM on EV-less walkthrough');
      const stop=D.WK.splits.flatMap(split=>split.st).find(stop=>stop.tr?.length);
      const custom={...stop,cap:undefined};const original=D.WK.splits[0];
      D.WK.splits[0]={...original,n:'Test Split [Cap 73]',cap:undefined};
      check(walkStop(custom,0,0,new Set(),new Set()).includes('data-cap="73"'),'walk cap from split name');
      D.WK.splits[0]=original;
      return checks;
    })()`);
    console.log(hack, keyboard ? 'dvkb' : 'normal', result.join('; '));
    for (const [width, height] of [[260,316],[260,350],[480,392],[537,424],[832,424]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2.3, mobile: true }, sessionId);
      await evaluate(`(async()=>{for(const route of ['#/','#/locs','#/trainers','#/items','#/walk','#/calc','#/p/'+P[0].id,'#/tr/'+TRS[0].k]){
        history.replaceState(null,'',route);render();await new Promise(requestAnimationFrame);
        if(document.documentElement.scrollWidth>${width})throw Error(route+' overflow '+document.documentElement.scrollWidth+' at ${width}');
      }return true;})()`);
    }
    await send('Emulation.setEmulatedMedia', { features: [{ name:'prefers-color-scheme', value:'light' }] }, sessionId);
    await evaluate(`history.replaceState(null,'','#/locs');render();if(document.documentElement.scrollWidth>832)throw Error('light overflow');true`);
    await evaluate(`(()=>{if(!(PLAYER&&PICK))return true;const labels=[...document.querySelectorAll('.tkchoices label')];if(labels.length!==2||Math.abs(labels[0].getBoundingClientRect().top-labels[1].getBoundingClientRect().top)>2)throw Error('pickers do not share wide row');return true})()`);
    await send('Emulation.setDeviceMetricsOverride', { width:260, height:316, deviceScaleFactor:2.3, mobile:true }, sessionId);
    await evaluate(`(async()=>{
      for(const route of ['#/locs','#/trainers','#/walk']){
        history.replaceState(null,'',route);render();
        for(let pass=0;pass<4;pass++){
          document.querySelectorAll('#app details:not([open])').forEach(details=>details.open=true);
          await new Promise(done=>setTimeout(done,50));
        }
        if(document.documentElement.scrollWidth>260)throw Error(route+' expanded overflow '+document.documentElement.scrollWidth);
      }
      return true;
    })()`);
    if (!shot && keyboard) {
      shot = true;
      await evaluate(`history.replaceState(null,'','#/trainers');render();true`);
      const { result: { data: screenshot } } = await send('Page.captureScreenshot', { format:'png' }, sessionId);
      writeFileSync(`.tmp/consistency-${hack}.png`, Buffer.from(screenshot, 'base64'));
    }
    assert.deepEqual(await evaluate('checkErrors'), [], `${hack} page errors`);
    console.log(hack, keyboard ? 'dvkb' : 'normal', 'five viewer sizes and light theme PASS');
    await send('Target.disposeBrowserContext', { browserContextId });
  }
} finally {
  socket?.close();
  chrome.kill();
}

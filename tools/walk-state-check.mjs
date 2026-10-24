// Walkthrough saved-state migration check (template/dex.js migrateWalkState), then a browser run per guide and mode.
//   node tools/walk-state-check.mjs <old.html> <new.html> <legacy-stop-key>
//   node tools/walk-state-check.mjs                  (each .tmp/state-before/<hack>.html against dist/<hack>.html, key 0.0)
// <old.html> is an earlier build of the guide, <new.html> the build to check. <legacy-stop-key> is a stop's position
// in the old layout whose key the new data still carries (e.g. 1.8 Eternal X, 1.0 Photonic Sun against a build from
// before the stop keys were stamped; 0.0 always exists). The same build on both sides also passes (old keys that are
// not positions are read as the positions of the old layout), so a fresh baseline build against dist/ works too.
// The synthetic migration cases at the top run on template/dex.js alone.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { startBrowser } from './browser.mjs';

const source = readFileSync('template/dex.js', 'utf8');
const migration = source.slice(source.indexOf('function migrateWalkState(){'), source.indexOf('\nmigrateWalkState();'));
const store = new Map();
const state = { c: { '1.0.0': 1 }, o: { 1: 1, gi: 1 }, x: { '1.0': 0, doc0: 1 }, s: { '1.0.e': 0, '1.0.c': 1 } };
const context = { WO: state, D: { WK: { splits: [{ st: [{ k: '1.0', s: [] }, { k: '1.0.f1', s: [] }] }] } }, LS: { pos: 'pos' },
  localStorage: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) }, woSave() {} };
const migrate = () => vm.runInNewContext('(' + migration + ')()', context);
store.set('pos', JSON.stringify({ h: '#/walk', a: { sel: 'details.stopd[data-k="1.0"]', off: 12 } }));
migrate();
assert.deepEqual(JSON.parse(JSON.stringify(state.c)), { '0.0.0': 1, '0.1.0': 1 });
assert.equal(state.x['0.0'], 0);
assert.equal(state.x['0.1'], 0);
assert.equal(state.x.doc0, 1);
assert.equal(state.s['0.0.e'], 0);
assert.equal(state.s['0.1.c'], 1);
assert.equal(state.o[0], 1);
assert.equal(state.o.gi, 1);
assert.equal(JSON.parse(store.get('pos')).a.sel, 'details.stopd[data-k="0.0"]');
delete state.c['0.0.0'];
delete state.x['0.0'];
state.s['0.0.e'] = 1;
const saved = JSON.stringify(state);
migrate();
assert.equal(JSON.stringify(state), saved, 'reload must not replay old state');
context.D.WK.splits.reverse();
context.D.WK.splits[0].st.reverse();
migrate();
assert.equal(state.c['0.0.0'], 1, 'later regroup follows previous fragment identity');
assert.equal(state.c['0.1.0'], undefined, 'unchecked fragment stays unchecked');
assert.equal(state.x['0.1'], undefined, 'reopened fragment stays open');
assert.equal(state.s['0.1.e'], 1);
console.log('PASS: fragment inheritance, collision-safe remap, later regroup, scroll anchor and idempotence');

const fragments = { c: {}, o: {}, x: { '0.0': 0 }, s: { '0.0.e': 0, '0.1.e': 1, '0.2.e': 1 } };
const fragmentData = { WK: { splits: [{ st: [
  { k: '2.4', tr: ['trainer-a'] }, { k: '2.4.f1', tr: ['trainer-b'] }, { k: '2.4.f2', tr: ['trainer-c'] }
] }] } };
const fragmentContext = { ...context, WO: fragments, D: fragmentData };
vm.runInNewContext('(' + migration + ')()', fragmentContext);
fragments.x = { '0.0': 0 };
fragments.s = { '0.0.e': 0, '0.1.e': 1, '0.2.e': 1 };
store.set('pos', JSON.stringify({ h: '#/walk', a: { sel: 'details.stopd[data-k="0.1"]', off: 12 } }));
fragmentData.WK.splits[0].st.push({ k: '9.9', tr: ['unrelated-trainer'] });
vm.runInNewContext('(' + migration + ')()', fragmentContext);
assert.deepEqual(JSON.parse(JSON.stringify(fragments.x)), { '0.0': 0 });
assert.deepEqual(JSON.parse(JSON.stringify(fragments.s)), { '0.0.e': 0, '0.1.e': 1, '0.2.e': 1 });
assert.equal(JSON.parse(store.get('pos')).a.sel, 'details.stopd[data-k="0.1"]');
fragmentData.WK.splits[0].st.reverse();
vm.runInNewContext('(' + migration + ')()', fragmentContext);
assert.equal(fragments.x['0.3'], 0);
assert.equal(fragments.x['0.1'], undefined);
assert.equal(fragments.s['0.1.e'], 1);
assert.equal(JSON.parse(store.get('pos')).a.sel, 'details.stopd[data-k="0.2"]');
console.log('PASS: unique EX fragment keys retain independent states and anchors after later changes');

// A guide whose stop keys are its positions (Emerald Imperium, Hardlove Gold) and a save that has no layout yet: nothing moves.
const positional = { c: { '0.1.0': 1, '1.0.2': 1 }, o: { 0: 1, gi: 1 }, x: { '0.1': 0, '1.0': 0, doc0: 1 }, s: { '0.1.e': 0, '1.0.c': 1 } };
const positionalSaved = JSON.stringify(positional);
vm.runInNewContext('(' + migration + ')()', { ...context, WO: positional,
  D: { WK: { splits: [{ st: [{ k: '0.0' }, { k: '0.1' }] }, { st: [{ k: '1.0' }] }] } } });
delete positional.layout;
assert.equal(JSON.stringify(positional), positionalSaved, 'position keys leave an old save as it is');
console.log('PASS: position-keyed guides keep an old save untouched');

const args = process.argv.slice(2);
assert(args.length === 0 || args.length === 3, 'Usage: node tools/walk-state-check.mjs [old.html new.html legacy-stop-key]');
const guides = args.length ? [args] : readdirSync('.tmp/state-before').filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
  .filter(hack => existsSync('dist/' + hack + '.html'))
  .map(hack => ['.tmp/state-before/' + hack + '.html', 'dist/' + hack + '.html', '0.0']);
mkdirSync('.tmp/walk-state', { recursive: true });
const sleep = milliseconds => new Promise(done => setTimeout(done, milliseconds));
const browser = await startBrowser({ profilePrefix: 'walk-state-', flags: ['--disable-ipc-flooding-protection'] });
const { send } = browser;
try {
  for (const [before, after, legacyKey] of guides) for (const keyboard of [false, true]) {
    const readData = file => JSON.parse(readFileSync(file, 'utf8').match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    const originalData = readData(before), updatedData = readData(after);
    const identities=updatedData.WK.splits.flatMap((split,splitIndex)=>split.st.map((stop,stopIndex)=>stop.k));
    assert.equal(new Set(identities).size, identities.length, 'all walkthrough fragment identities must be unique');
    // An unstamped save (no layout) names stops by the keys the new data carries, minus .fN (the old positions);
    // a stamped save names them by position in its own layout. Parity of a source's split / stop number picks what was
    // seeded, so the expectation holds when the old build's keys are not its positions (e.g. baseline against itself).
    const legacyOf = (splitIndex, stopIndex, stop) => String(stop.k ?? (splitIndex + '.' + stopIndex)).replace(/\.f\d+$/, '');
    for (const stamped of [false, true]) {
      const baselineState = { c: {}, o: { gi: 1 }, x: { doc0: 1 }, s: {} };
      const seedKey = key => {
        const [seedSplit, seedStop] = key.split('.').map(Number);
        if (seedSplit % 2 === 0) baselineState.o[seedSplit] = 1;
        baselineState.c[key + '.0'] = 1;
        if (seedStop % 2 === 0) baselineState.x[key] = 0;
        for (const section of ['c', 'e', 'i', 't']) baselineState.s[key + '.' + section] = seedStop % 2;
      };
      originalData.WK.splits.forEach((split, splitIndex) => split.st.forEach((stop, stopIndex) => seedKey(splitIndex + '.' + stopIndex)));
      if (!stamped) updatedData.WK.splits.forEach((split, splitIndex) => split.st.forEach((stop, stopIndex) => seedKey(legacyOf(splitIndex, stopIndex, stop))));
      let previousLayout;
      if (stamped) previousLayout = baselineState.layout = originalData.WK.splits.map((split, splitIndex) =>
        split.st.map((stop, stopIndex) => String(stop.k ?? (splitIndex + '.' + stopIndex)))); // the old build may have no keys
      vm.runInNewContext('(' + migration + ')()', { ...context, WO: baselineState, D: updatedData });
      updatedData.WK.splits.forEach((split, splitIndex) => split.st.forEach((stop, stopIndex) => {
        const position = splitIndex + '.' + stopIndex;
        const legacy = legacyOf(splitIndex, stopIndex, stop);
        const find = wanted => previousLayout.flatMap((oldSplit, oldSplitIndex) => oldSplit.flatMap((key, oldStopIndex) =>
          key === wanted ? [oldSplitIndex + '.' + oldStopIndex] : []));
        const sourceList = !stamped ? [legacy] : find(String(stop.k ?? position)).length ? find(String(stop.k ?? position)) : find(legacy);
        const parts = sourceList.map(source => source.split('.').map(Number));
        assert(parts.length, 'old position known for ' + position);
        assert.equal(baselineState.c[position + '.0'], 1, 'tick ' + position);
        assert.equal(baselineState.x[position], parts.some(([, oldStop]) => oldStop % 2 === 0) ? 0 : undefined, 'stop ' + position);
        for (const section of ['c', 'e', 'i', 't']) assert.equal(baselineState.s[position + '.' + section],
          parts.some(([, oldStop]) => oldStop % 2 === 0) ? 0 : 1, 'section ' + position);
        if (parts.some(([oldSplit]) => oldSplit % 2 === 0)) assert.equal(baselineState.o[splitIndex], 1);
      }));
      const preferences=new Map();
      baselineState.layout.forEach((split,splitIndex)=>split.forEach((key,stopIndex)=>{
        const position=splitIndex+'.'+stopIndex;
        if(stopIndex%2)delete baselineState.x[position];else baselineState.x[position]=0;
        baselineState.s[position+'.e']=stopIndex%2;
        preferences.set(key,{closed:baselineState.x[position],section:baselineState.s[position+'.e']});
      }));
      const laterData=JSON.parse(JSON.stringify(updatedData));
      laterData.WK.splits[0].st.push({k:'unrelated-stop',s:[],tr:[]});
      vm.runInNewContext('(' + migration + ')()', { ...context, WO: baselineState, D: laterData });
      baselineState.layout.forEach((split,splitIndex)=>split.forEach((key,stopIndex)=>{
        if(!preferences.has(key))return;
        const position=splitIndex+'.'+stopIndex,expected=preferences.get(key);
        assert.equal(baselineState.x[position],expected.closed,'independent later fragment '+key);
        assert.equal(baselineState.s[position+'.e'],expected.section,'independent later section '+key);
      }));
    }
    const fixture = (file, name, current) => {
      let target;
      const html = readFileSync(file, 'utf8').replace(/(<script id="data" type="application\/json">)([\s\S]*?)(<\/script>)/,
        (match, start, json, end) => {
          const data = JSON.parse(json);
          data.WK.splits.forEach((split, splitIndex) => split.st.forEach((stop, stopIndex) => {
            stop.s = [];
            const position = splitIndex + '.' + stopIndex;
            if (!target && (current ? stop.k === legacyKey : position === legacyKey)) {
              target = position;
              stop.s = [['Migration probe one', ''], ['Migration probe two', '']];
            }
          }));
          return start + JSON.stringify(data).replaceAll('</', '<\\/') + end;
        });
      assert(target, 'Fixture stop ' + legacyKey);
      const path = '.tmp/walk-state/' + name + '.html';
      writeFileSync(path, html);
      return { path, target };
    };
    const old = fixture(before, 'old', false), current = fixture(after, 'new', true);
    const { result: { browserContextId } } = await send('Target.createBrowserContext');
    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
    const evaluate = async expression => {
      const message = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
      assert(!message.error && !message.result?.exceptionDetails, JSON.stringify(message));
      return message.result.result.value;
    };
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 1, mobile: false }, sessionId);
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.stateErrors=[];addEventListener('error',event=>stateErrors.push(event.message));
      if(!sessionStorage.walkSeeded){localStorage.clear();localStorage.setItem('dvkb','${keyboard ? '1' : '0'}');}` }, sessionId);
    const navigate = async path => {
      await send('Page.navigate', { url: 'about:blank' }, sessionId);
      await sleep(100);
      await send('Page.navigate', { url: pathToFileURL(resolve(path)).href + '#/walk' }, sessionId);
      await sleep(150);
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(`document.readyState==='complete'&&typeof WO!=='undefined'`)) return;
        await sleep(100);
      }
      throw Error('Guide readiness timeout');
    };
    await navigate(old.path);
    await evaluate(`(()=>{sessionStorage.walkSeeded='1';localStorage.setItem(LS.walk,JSON.stringify({
      c:{'${legacyKey}.0':1},o:{'${legacyKey.split('.')[0]}':1,gi:1},x:{'${legacyKey}':0,doc0:1},
      s:{'${legacyKey}.c':1,'${legacyKey}.e':0,'${legacyKey}.i':0,'${legacyKey}.t':0}}));
      localStorage.setItem(LS.pos,JSON.stringify({h:'#/walk',a:{sel:'details.stopd[data-k="${legacyKey}"]',off:12}}));return true;})()`);
    await navigate(old.path);
    assert(await evaluate(`app.querySelector('input[data-sk="${legacyKey}.0"]')?.checked`), await evaluate(`JSON.stringify({state:WO,hash:location.hash,checks:[...app.querySelectorAll('input[data-sk]')].map(input=>input.dataset.sk),errors:stateErrors})`));
    await navigate(current.path);
    const inspect = async () => evaluate(`(()=>{const key='${current.target}',stop=app.querySelector('details.stopd[data-k="'+key+'"]');
      return {checked:app.querySelector('input[data-sk="'+key+'.0"]').checked,closed:!stop.open,
        sectionClosed:WO.s[key+'.e']===0&&(!stop.querySelector('details.sec[data-s="'+key+'.e"]')?.open),
        checklistOpen:stop.querySelector('details.sec[data-s="'+key+'.c"]').open,doc:WO.x.doc0,guide:WO.o.gi,
        next:nextStep().j,width:document.documentElement.scrollWidth,errors:stateErrors};})()`);
    let result = await inspect();
    assert(result.checked && result.closed && result.sectionClosed && result.checklistOpen, JSON.stringify(result));
    assert.equal(result.doc, 1);
    assert.equal(result.guide, 1);
    assert.equal(result.next, 1);
    assert(result.width <= 260, 'no horizontal overflow');
    assert.deepEqual(result.errors, []);
    const migrated = await evaluate(`JSON.stringify(WO)`);
    await navigate(current.path);
    assert.equal(await evaluate(`JSON.stringify(WO)`), migrated, 'second load is idempotent');
    await evaluate(`(()=>{const checkbox=app.querySelector('input[data-sk="${current.target}.0"]');checkbox.checked=false;
      checkbox.dispatchEvent(new Event('change',{bubbles:true}));app.querySelector('.wk-next').click();return true;})()`);
    await sleep(150);
    result = await inspect();
    assert(!result.checked && !result.closed && result.next === 0, 'uncheck and Next step use migrated coordinates');
    await navigate(current.path);
    result = await inspect();
    assert(!result.checked && !result.closed && result.sectionClosed, 'edits survive reload without resurrecting legacy values');
    await evaluate(`WO.c={};woSave();true`);
    await navigate(current.path);
    assert.equal(await evaluate(`Object.keys(WO.c).length`), 0, 'reset survives reload');
    assert.deepEqual(await evaluate('stateErrors'), []);
    console.log('PASS:', before, '->', after, keyboard ? 'dvkb' : 'normal', legacyKey, '->', current.target,
      'closed stop/sections, ticks, split expansion, Next step, uncheck, reset and reload');
    await send('Target.disposeBrowserContext', { browserContextId });
  }
} finally {
  await browser.close();
}

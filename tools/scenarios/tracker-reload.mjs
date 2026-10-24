import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from '../browser.mjs';

const guide = process.argv[2];
assert(guide, 'usage: tracker-reload.mjs <guide.html>');
const data = JSON.parse(readFileSync(guide, 'utf8').match(/<script id="data"[^>]*>([\s\S]*?)<\/script>/)[1]);
const area = data.AR.findIndex(entry => !entry.ns && !entry.sub && !entry.st && entry.l?.length);
assert(area >= 0, 'guide has a trackable area');
const key = data.cfg.ls.track;
const selector = `.trk[data-a="${area}"]`;
const errors = [];
const browser = await startBrowser({ profilePrefix: 'tracker-reload-', onEvent(message) {
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
} });
try {
  const { send } = browser;
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const evaluate = async expression => {
    const message = await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
    assert(!message.error && !message.result?.exceptionDetails, JSON.stringify(message));
    return message.result.result.value;
  };
  const ready = async (previous = '') => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`document.readyState==='complete'&&window.scenarioDocumentId!==${JSON.stringify(previous)}&&!!document.querySelector('${selector} .tk-sel')`)) return;
      await new Promise(done => setTimeout(done, 100));
    }
    throw Error('tracker did not render in a new document');
  };
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2, mobile: true }, sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.scenarioDocumentId=Math.random().toString();
    if(!sessionStorage.getItem('scenario-seeded')){localStorage.clear();localStorage.setItem('dvkb','1');
    localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify({ e: { [area]: { f: 1 } }, t: {} }))});
    sessionStorage.setItem('scenario-seeded','1');}` }, sessionId);
  await send('Page.navigate', { url: pathToFileURL(resolve(guide)).href + '#/l/' + data.AR[area].l[0] }, sessionId);
  await ready();
  assert.equal(await evaluate(`document.querySelector('${selector} .tk-sel').value`), '__fail', 'seeded failed encounter visible');
  await evaluate(`document.querySelector('${selector} .tk-x').click()`);
  assert.equal(await evaluate(`!!JSON.parse(localStorage.getItem(${JSON.stringify(key)})).e[${area}]?.f`), false, 'clear saved');
  const previous = await evaluate('scenarioDocumentId');
  await send('Page.reload', {}, sessionId);
  await ready(previous);
  assert.equal(await evaluate(`document.querySelector('${selector} .tk-sel').value`), '', 'tracker survives reload');
  assert.equal(await evaluate(`localStorage.getItem('dvkb')`), '1', 'keyboard mode preserved');
  assert.equal(await evaluate('innerWidth'), 260, 'viewer width');
  assert.equal(await evaluate('innerHeight'), 316, 'viewer height');
  assert.equal(await evaluate('INV'), true, 'viewer keyboard active');
  assert.deepEqual(errors, [], 'page errors');
  console.log('PASS tracker reload: seeded state, click, save, reload; 260 x 316 dvkb; 0 page errors');
} finally {
  await browser.close();
}

import { startBrowser } from '../../browser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const out = resolve('.tmp/unbound-missions');
mkdirSync(out, { recursive: true });
const errors = [];
const browser = await startBrowser({ profilePrefix: 'unbound-missions-', onEvent: event => {
  if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
} });
const target = await browser.send('Target.createTarget', { url: 'about:blank' });
const attached = await browser.send('Target.attachToTarget', { targetId: target.result.targetId, flatten: true });
const session = attached.result.sessionId;
const send = async (method, params = {}) => {
  const reply = await browser.send(method, params, session);
  if (reply.error) throw new Error(JSON.stringify(reply.error));
  return reply.result;
};
const value = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const settle = () => value('new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))');
const file = pathToFileURL(resolve('tools/mockup/unbound-missions/index.html')).href;
async function load() {
  await send('Page.navigate', { url: file });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await value('document.readyState === "complete" && !!window.mockup')) { await settle(); return; }
    await new Promise(done => setTimeout(done, 50));
  }
  throw new Error('Mockup did not load');
}
async function shot(name) {
  const image = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(resolve(out, name + '.png'), Buffer.from(image.data, 'base64'));
}
const reports = [];
try {
  await send('Runtime.enable');
  await send('Page.enable');
  for (const [width, height] of [[260,316], [260,350], [480,392], [537,424], [832,424]]) {
    for (const mode of ['normal', 'dvkb']) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2.3, mobile: true });
      await load();
      await value(`localStorage.clear();${mode === 'dvkb' ? "localStorage.setItem('dvkb','1');" : ''}`);
      await load();
      for (const style of ['line', 'card']) {
        await value(`setOption('style','${style}');demo('partial');document.querySelectorAll('details').forEach(details=>details.open=true)`);
        await settle();
        assert.equal(await value('document.documentElement.scrollWidth'), width, `${width} ${mode} ${style} overflow`);
        assert.equal(await value('[...document.querySelectorAll("summary,.wstep,.collapse")].filter(el=>el.getClientRects().length).every(el=>el.getBoundingClientRect().height>=44)'), true, '44px row targets');
      }
      await value("setOption('style','line');demo('missions-only');document.querySelectorAll('details').forEach(details=>details.open=false)");
      await settle();
      await value('document.querySelector(".wk-next").click()');
      await settle();
      assert.equal(await value('document.querySelector(".mission").open'), true, 'Next opens closed mission');
      assert.equal(await value('Object.keys(mockup.state.ticks).length'), 6, 'Next never ticks');
      assert.equal(await value('document.activeElement.closest(".wstep").dataset.id'), '["mission","mission-007","accept"]');
      await value("demo('fresh');mockup.state.ticks[mockup.all[0].id]=true;mockup.land(mockup.nextStep())");
      await settle();
      assert.equal(await value('document.activeElement.closest(".mission").dataset.m'), 'mission-007', 'ordinary to mission');
      await value("mockup.all.filter(entry=>entry.mission?.m==='mission-007').forEach(entry=>mockup.state.ticks[entry.id]=true);mockup.land(mockup.nextStep())");
      await settle();
      assert.equal(await value('document.activeElement.closest(".wstep").dataset.id'), '["stop","icicle-cave","route-two"]', 'mission to ordinary');
      for (const auto of [false, true]) {
        await value(`{demo('fresh');setOption('auto',${auto});const mission=mockup.all.filter(entry=>entry.mission?.m==='mission-003');mission.slice(0,-1).forEach(entry=>mockup.state.ticks[entry.id]=true);mockup.land(mission.at(-1))}`);
        await settle();
        await value('document.activeElement.click()');
        await settle();
        assert.equal(await value('document.querySelector("[data-m=mission-003]").open'), !auto, 'completion alternative');
        assert.equal(await value('mockup.progress("mission-003")[0]'), 3, 'completion count');
      }
      await value("demo('partial');document.querySelectorAll('details').forEach(details=>details.open=false);mockup.setQuery('');mockup.openSearch()");
      await settle();
      if (mode === 'dvkb') {
        for (const letter of 'underwater') await value(`document.querySelector('[data-key="${letter.toUpperCase()}"]').click()`);
        assert.equal(await value('mockup.state.query'), 'underwater', 'viewer keyboard types');
        assert.equal(await value('[...document.querySelectorAll(".keyrow button")].every(el=>el.getBoundingClientRect().height>=34)'), true);
        if (width === 260 && height === 316) await shot('260x316-dvkb-search');
      } else {
        await value(`const input=document.querySelector('#query-slot input');input.value='underwater';input.dispatchEvent(new Event('input'))`);
      }
      assert.equal(await value('document.documentElement.scrollWidth'), width, 'search overflow');
      assert.equal(await value('document.querySelectorAll(".hit").length'), 1, 'nested step result');
      await value('document.querySelector(".hit").click()');
      await settle();
      assert.equal(await value('document.querySelector(".mission").open'), true, 'search opens mission');
      assert.equal(await value('document.querySelector(".stopd").open'), true, 'search opens stop');
      assert.equal(await value('!!document.querySelector(".wstep.flash")'), true, 'search flashes step');
      assert.equal(await value('document.activeElement.closest(".wstep").getBoundingClientRect().top >= 86'), true, 'landing below pinned headers');
      if ((width === 260 && height === 316) || width === 480) await shot(`${width}x${height}-${mode}-landing`);
      await load();
      assert.equal(await value('mockup.state.query'), 'underwater', 'query retained');
      assert.equal(await value('mockup.progress("mission-007")[0]'), 2, 'ticks survive reload');
      assert.equal(await value('document.querySelector(".mission").open'), true, 'mission open survives reload');
      await value("demo('done')");
      assert.equal(await value('document.querySelector(".wk-next").disabled'), true, 'all done disabled');
      await value("demo('last');document.querySelector('.wk-next').click()");
      await settle();
      await value('document.activeElement.click()');
      assert.equal(await value('document.querySelector(".wk-next").textContent'), 'Checklist done');
      await value("demo('partial');setOption('style','line')");
      if (width === 260 && height === 316) await shot(`260x316-${mode}-closed`);
      reports.push(`${width}x${height} ${mode}: PASS (both styles, targets, Next, completion, search, reload, all done)`);
    }
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2.3, mobile: true });
  await value("demo('partial');document.body.style.fontSize='19.5px';document.querySelectorAll('details').forEach(details=>details.open=true)");
  await settle();
  assert.equal(await value('document.documentElement.scrollWidth'), 260, 'light + 130% base text overflow');
  await shot('260x316-light-zoom');
  assert.deepEqual(errors, [], 'console exceptions');
  reports.push('Light theme + 130% base font: PASS; runtime exceptions: 0');
  writeFileSync(resolve(out, 'checks.txt'), reports.join('\n') + '\n');
  console.log(reports.join('\n'));
} finally {
  await browser.close();
}

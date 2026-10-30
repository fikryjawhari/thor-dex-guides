// Dex-page mockup check: node tools/mockup/dex-page/check.mjs (after sample.py). Screenshots to .tmp/dex-page/.
import { startBrowser } from '../../browser.mjs';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = resolve('.tmp/dex-page'), errors = [], lines = [];
const browser = await startBrowser({ profilePrefix: 'dex-page-', onEvent: e => {
  if (e.method === 'Runtime.exceptionThrown') errors.push(e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text);
} });
const t = await browser.send('Target.createTarget', { url: 'about:blank' });
const s = (await browser.send('Target.attachToTarget', { targetId: t.result.targetId, flatten: true })).result.sessionId;
const send = async (m, p = {}) => { const r = await browser.send(m, p, s); if (r.error) throw new Error(JSON.stringify(r.error)); return r.result; };
const val = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
const settle = () => val('new Promise(d=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(d,200))))');
await send('Runtime.enable');
const file = pathToFileURL(resolve('.tmp/dex-page/index.html')).href;
const shot = async n => writeFileSync(`${out}/${n}.png`, Buffer.from((await send('Page.captureScreenshot')).data, 'base64'));
for (const [w, h] of [[260, 316], [260, 350], [480, 392], [537, 424], [832, 424]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  for (const cols of ['narrow', 'full']) {
    await send('Page.navigate', { url: file + '#/p/6' }); await settle();
    await val(`localStorage.clear();setOption('cols','${cols}');location.hash='#/p/6';`); await settle();
    const r = await val(`(()=>{const m=document.querySelector('#mvb'),t=m.querySelector('table');window.scrollTo(0,m.getBoundingClientRect().top+scrollY-60);
      const rows=[...t.rows].map(r=>r.getBoundingClientRect().height);
      return {over:t.scrollWidth>m.clientWidth+1,doc:document.documentElement.scrollWidth>innerWidth,maxRow:Math.max(...rows),tw:t.scrollWidth,mw:m.clientWidth}})()`);
    await settle();
    const bar = await val(`!document.getElementById('pbar').classList.contains('off')`);
    lines.push(`${w}x${h} ${cols}: table ${r.tw}/${r.mw} overflow=${r.over} page-overflow=${r.doc} tallest-row=${Math.round(r.maxRow)} bar-shown=${bar}`);
    await shot(`${w}x${h}-${cols}-moves`);
  }
  await val(`setOption('cols','narrow');location.hash='#/p/1'`); await settle(); await val('scrollTo(0,0)'); await settle(); await shot(`${w}x${h}-top`);
  await val(`document.querySelector('.pall [data-a="0"]').click()`); await settle(); await shot(`${w}x${h}-collapsed`);
}
// Every sampled Pokemon, every move tab, at 260 wide with letters: no sideways scroll
await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2, mobile: true });
const all = await val(`(async()=>{setOption('cols','narrow');const bad=[];for(const p of D.P){location.hash='#/p/'+p.id;await new Promise(r=>setTimeout(r,60));
  for(const b of document.querySelectorAll('.sub button')){b.click();const m=document.querySelector('#mvb'),t=m.querySelector('table');if(t&&t.scrollWidth>m.clientWidth+1)bad.push(p.n+' '+b.textContent+' '+t.scrollWidth+'/'+m.clientWidth);}}return bad;})()`);
lines.push('260 letters, all sampled Pokemon and tabs: ' + (all.length ? 'OVERFLOW ' + all.join('; ') : 'no overflow'));
lines.push('errors: ' + (errors.length ? errors.join(' | ') : 0));
console.log(lines.join('\n')); writeFileSync(`${out}/checks.txt`, lines.join('\n'));
await browser.close?.(); process.exit(0);

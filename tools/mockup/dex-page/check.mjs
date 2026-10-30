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
const settle = () => val('new Promise(d=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(d,250))))');
await send('Runtime.enable');
const file = pathToFileURL(resolve('.tmp/dex-page/index.html')).href;
const shot = async n => writeFileSync(`${out}/${n}.png`, Buffer.from((await send('Page.captureScreenshot')).data, 'base64'));
const open = async (id, opts = '') => { await val(`localStorage.clear();${opts}location.hash='#/p/${id}'`); await settle(); };
// where a section's title sits relative to the bar's bottom
const secTop = k => `(()=>{const d=document.querySelector('details.psec[data-s="${k}"]');return Math.round(d.getBoundingClientRect().top-document.getElementById('pbar').offsetHeight)})()`;
await send('Page.navigate', { url: file }); await settle();
for (const [w, h] of [[260, 316], [260, 350], [480, 392], [537, 424], [832, 424]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await open(6, "setOption('calc','vert');");
  const over = await val(`(()=>{const r=[];document.querySelectorAll('details.psec').forEach(d=>d.open=true);
    for(const e of document.querySelectorAll('#app *'))if(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX==='auto')r.push(e.id||e.className);
    return {doc:document.documentElement.scrollWidth>innerWidth,scrollers:r}})()`);
  await shot(`${w}x${h}-top`);
  // scroll into Base stats, then step with the bar's arrow: Base stats stays at the same place
  await val(`(()=>{const d=document.querySelector('details.psec[data-s=bs]');scrollTo(0,d.getBoundingClientRect().top+scrollY-40+30)})()`); await settle();
  const before = await val(secTop('bs'));
  await val(`document.querySelector('#pbar .ar[data-d="1"]').click()`); await settle();
  const after = await val(secTop('bs')), now = await val('location.hash');
  await shot(`${w}x${h}-bar`);
  await val(`document.querySelector('#pbar .who').click()`); await settle(); await shot(`${w}x${h}-forms`);
  const forms = await val(`document.querySelectorAll('.fmenu button').length`);
  await val(`document.querySelectorAll('.fmenu button')[0].click()`); await settle();
  const afterForm = await val(secTop('bs')), now2 = await val('location.hash');
  lines.push(`${w}x${h}: page-overflow=${over.doc} sideways-scrollers=[${over.scrollers.join(',')}] | next: bs ${before}->${after} (${now}) | forms menu ${forms}, picked ${now2}: bs ${afterForm}`);
  // every section open, a Level-up row near the top: the same move (or the nearest level) stays at the same height
  for (const [from, dir, row] of [[6, 1, 5], [5, 1, 9], [129, 1, 2]]) {
    await open(from); await val(`document.querySelector('.pall [data-a="1"]').click()`); await settle();
    const r0 = await val(`(()=>{const r=[...document.querySelectorAll('#mvb tr[data-k]')][${row}];scrollTo(0,r.getBoundingClientRect().top+scrollY-120);return r.dataset.k+' lv'+r.dataset.o})()`); await settle();
    const y0 = await val(`(()=>{const line=document.getElementById('pbar').offsetHeight;const r=[...document.querySelectorAll('[data-k]')].filter(e=>e.getClientRects().length).find(e=>e.getBoundingClientRect().top>=line-1);return [r.dataset.k,Math.round(r.getBoundingClientRect().top)]})()`);
    await val(`document.querySelector('#pbar .ar[data-d="${dir}"]').click()`); await settle();
    const y1 = await val(`(()=>{const r=document.querySelector('[data-k="${'${'}y0[0]${'}'}"]');return r?Math.round(r.getBoundingClientRect().top):'missing'})()`.replace("${y0[0]}", '')) ;
    lines.push(`  ${w}x${h} #${from}→${await val('location.hash')}: anchor ${y0[0]} at ${y0[1]} → ${await val(`(()=>{const r=document.querySelector('[data-k="${y0[0]}"]');if(!r)return 'missing (nearest: '+(()=>{const line=document.getElementById('pbar').offsetHeight;const e=[...document.querySelectorAll('[data-k]')].filter(e=>e.getClientRects().length).find(e=>e.getBoundingClientRect().top>=line-1);return e.dataset.k+' at '+Math.round(e.getBoundingClientRect().top)})()+')';return Math.round(r.getBoundingClientRect().top)})()`)}`);
  }
  await shot(`${w}x${h}-switched`);
  // Collapse all, then again: Reset all, back to the defaults
  await open(6); await val(`document.querySelector('.pall [data-a="0"]').click()`); await settle();
  const lab = await val(`document.querySelector('.pall [data-a="0"]').textContent`);
  await val(`document.querySelector('.pall [data-a="0"]').click()`); await settle();
  const st = await val(`[...document.querySelectorAll('details.psec')].map(d=>d.dataset.s+(d.open?'+':'-')).join(' ')+' / '+document.querySelector('.pall [data-a="0"]').textContent`);
  lines.push(`  collapse → "${lab}" → ${st}`);
  // the widest name words never break inside: hero, bar, top links
  const br = await val(`(()=>{const P6=byId[6],n0=P6.n,bad=[];for(const n of ['Crabominable','Brambleghast','Squawkabilly','Basculin (Blue-Striped)','Ogerpon (Hearthflame)']){P6.n=n;byId[5].n=n;detail('6');
    for(const e of [document.querySelector('.hero h2'),document.querySelector('#pbar .nm'),...document.querySelectorAll('.pnav a .t b')])if(e.scrollWidth>e.clientWidth+1)bad.push(n+' in '+(e.closest('#pbar')?'bar':e.closest('.pnav')?'top link':'top card'));}
    P6.n=n0;byId[5].n='Charmeleon';return bad})()`);
  lines.push('  widest words: ' + (br.length ? 'OVERFLOW ' + br.join('; ') : 'fit'));
  await open(5); await val(`document.querySelector('details.psec[data-s=ev]').scrollIntoView()`); await settle(); await shot(`${w}x${h}-evo`);
  await open(6); await val(`document.querySelector('details.psec[data-s=sc]').open=true;document.querySelector('details.psec[data-s=sc]').scrollIntoView()`); await settle(); await shot(`${w}x${h}-calc`);
}
await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2, mobile: true });
const all = await val(`(async()=>{localStorage.clear();const bad=[];for(const p of D.P){location.hash='#/p/'+p.id;await new Promise(r=>setTimeout(r,60));
  for(const b of document.querySelectorAll('.sub button')){b.click();const m=document.querySelector('#mvb'),t=m.querySelector('table');if(t&&t.scrollWidth>m.clientWidth+1)bad.push(p.n+' '+b.textContent+' '+t.scrollWidth+'/'+m.clientWidth);}}return bad;})()`);
lines.push('260 moves, all sampled Pokemon and tabs: ' + (all.length ? 'OVERFLOW ' + all.join('; ') : 'no overflow'));
lines.push('errors: ' + (errors.length ? errors.join(' | ') : 0));
console.log(lines.join('\n')); writeFileSync(`${out}/checks.txt`, lines.join('\n'));
process.exit(0);

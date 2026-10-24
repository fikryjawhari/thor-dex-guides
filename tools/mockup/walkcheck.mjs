// node tools/mockup/walkcheck.mjs <guide.html> <shot-prefix> [kb]: exercises the walkthrough at 260x316 in headless Chrome (taps, bars, jumps, Next step, starter, reload, other routes) and prints what it saw plus any page errors.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startBrowser } from '../browser.mjs';
const [file, out, kb] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errs = [];
const browser = await startBrowser({ profilePrefix: 'tw-', flags: ['--hide-scrollbars'],
  onEvent: m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 600)); } });
const { send } = browser;
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async expr => { const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 800)); return m.result?.result?.value; };
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 260, height: 316, deviceScaleFactor: 2, mobile: false }, sessionId);
const url = pathToFileURL(resolve(file)).href;
const go = async h => { await send('Page.navigate', { url: url + h }, sessionId); await sleep(1500); };
await go('#/walk');
if (kb) { await ev(`localStorage.setItem('dvkb','1')`); await go('#/walk'); }
const shot = async name => { const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId); writeFileSync(`${out}-${name}.png`, Buffer.from(s.result.data, 'base64')); };
const R = await ev(`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const fr=()=>new Promise(r=>requestAnimationFrame(r));const o=[];const d=document;
 const T=()=>d.querySelector('header').offsetHeight+8;const sp=()=>[...d.querySelectorAll('details.split.jt')];
 o.push('docW '+d.documentElement.scrollWidth+' hh '+getComputedStyle(d.documentElement).getPropertyValue('--hh')+' top: '+[...d.querySelector('.wtool').children].map(e=>e.className||e.tagName).join(' | ')+' rjump hidden '+d.querySelector('.rjump').hidden);
 // open split 1 via its header
 const s0=sp()[0];s0.querySelector('summary').click();await sleep(300);
 o.push('split0 open '+s0.open+' stops '+s0.querySelectorAll('details.stopd').length+' secs '+s0.querySelectorAll('details.sec').length+' open secs '+s0.querySelectorAll('details.sec[open]').length+' bars '+[...s0.querySelectorAll('.endbar')].filter(b=>!b.hidden).length);
 // header tap stability on a section
 const sec=s0.querySelector('details.sec[open][data-s$=".e"]');scrollBy(0,sec.getBoundingClientRect().top-120);await sleep(600);const h=sec.querySelector('summary');const y0=Math.round(h.getBoundingClientRect().top);h.click();
 const ys=[];for(let i=0;i<20;i++){ys.push(Math.round(h.getBoundingClientRect().top));await fr();}o.push('tap sec header '+y0+' -> '+[...new Set(ys)].join(',')+' open '+sec.open+' saved '+JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/walk/i.test(k)))).s[sec.dataset.s]);
 h.click();await sleep(600);
 // sticky: scroll into the middle of a long stop
 const st=[...s0.querySelectorAll('details.stopd[open]')].sort((a,b)=>b.offsetHeight-a.offsetHeight)[0];scrollBy(0,st.getBoundingClientRect().top+st.offsetHeight/2-T());await sleep(400);
 o.push('long stop '+st.dataset.k+' h '+st.offsetHeight+' header top '+Math.round(st.querySelector('summary').getBoundingClientRect().top)+' stop bar shown '+!st.querySelector('.endbar.st').hidden);
 // its stop bar: collapse in place
 const eb=st.querySelector('.endbar.st');eb.scrollIntoView({block:'end'});await sleep(300);const yb=Math.round(st.querySelector('summary').getBoundingClientRect().top);eb.click();await sleep(600);
 o.push('stop bar: header '+yb+' -> '+Math.round(st.querySelector('summary').getBoundingClientRect().top)+' open '+st.open);
 // split bar
 const spb=s0.querySelector('.endbar.sp');o.push('split bar shown '+!spb.hidden);spb.scrollIntoView({block:'end'});await sleep(300);spb.click();await sleep(700);o.push('split bar: header '+Math.round(s0.querySelector('summary').getBoundingClientRect().top)+' T '+T()+' open '+s0.open);
 // jump buttons
 scrollTo(0,0);await sleep(200);const dn=d.querySelector('.rjump [data-j="1"]'),up=d.querySelector('.rjump [data-j="-1"]');
 dn.click();await sleep(50);const a1=Math.round(sp()[0].getBoundingClientRect().top);dn.click();await sleep(50);const a2=Math.round(sp()[1].getBoundingClientRect().top);up.click();await sleep(50);const a3=Math.round(sp()[0].getBoundingClientRect().top);
 o.push('jump down '+a1+' down '+a2+' up '+a3+' (T '+T()+') btn h '+dn.offsetHeight);
 // top bar expand/collapse keeps the bar still
 const seg=d.querySelector('.wk-all');const yy=Math.round(seg.getBoundingClientRect().top);seg.children[0].click();await sleep(400);const y2=Math.round(seg.getBoundingClientRect().top);seg.children[1].click();await sleep(400);
 o.push('top seg '+yy+' -> '+y2+' -> '+Math.round(seg.getBoundingClientRect().top)+' open splits '+sp().filter(x=>x.open).length);
 // next step
 const nx=d.querySelector('.wk-next');if(nx){nx.click();await sleep(500);const inp=d.querySelector('.wstep.flash');o.push('next: '+(inp?Math.round(inp.getBoundingClientRect().top)+' '+inp.textContent.slice(0,40):'no flashed step'));}
 // starter picker
 const ws=d.querySelector('.wk-starter,.tk-starter');if(ws){ws.value=ws.options[2].value;ws.dispatchEvent(new Event('change'));await sleep(400);const ws2=d.querySelector('.wk-starter,.tk-starter');
  o.push('starter '+ws2.className+' = '+ws2.value+' area0 tracker '+((d.querySelector('.trk[data-a="0"] .tk-sel')||{}).value)+' guide info: '+d.querySelector('.wtool summary .mut').textContent);}
 // guide info
 const gi=d.querySelector('details[data-wo=gi]');gi.querySelector('summary').click();await sleep(300);o.push('guide info: '+[...gi.querySelectorAll('.psec,details.stopd>summary')].map(e=>e.textContent.trim().slice(0,30)).join(' | '));
 return o.join('\\n');})()`);
console.log(R);
await shot('a');
// reload: state must come back
await go('#/walk');
console.log(await ev(`'after reload: open splits '+[...document.querySelectorAll('details.split.jt[open]')].length+' gi open '+document.querySelector('details[data-wo=gi]').open+' docW '+document.documentElement.scrollWidth`));
// other routes still render
for (const h of ['#/', '#/locs', '#/trainers', '#/items', '#/calc', '#/p/1']) { await go(h); const r = await ev(`(document.querySelector('.rjump').hidden===!['#/locs','#/trainers','#/items'].includes(location.hash)?'':'RJ WRONG ')+document.getElementById('app').children.length+' w'+document.documentElement.scrollWidth`); console.log(h, r); }
console.log('ERRS', errs.length ? errs : 'none');
await browser.close(); process.exit(0);

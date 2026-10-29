// Saved state across a guide update that shifts every index (as Hardlove 0.8.5 did when it inserted a move): state saved
// on the guide as built must point at the same things in a copy with one new entry at the front of M (and MV), AB, P,
// the Trainers boxes and the first walkthrough split, every reference to them shifted. Rule: saved state never stores
// a position in the data (template/README.md → What the data switches on). Runs on every guide.
//   28a same state: calc sets (species, ability, moves), the calc's foe, recent trainers and foe edits, list filters,
//       level caps, Trainers open state, search recents, the stat calc, walkthrough ticks and the tracker, compared
//       by name before and after the update.
//   28b same pages: a Pokémon page and a trainer card read the same in both copies (the shifted copy is consistent).
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { html, match, data } = readGuide(file);
const name = file.split(/[\\/]/).pop().replace(/\.html$/, '');
const trainers = data.TR.g.flatMap((g, gi) => g.sec.flatMap((s, si) => s.tr.map((t, ti) => ({ t, gi, si, ti }))));
const used = new Set(trainers.flatMap(({ t }) => [...t.p, ...(t.pt || []).flatMap(x => x.p)].map(m => m.id)));
const X = trainers.find(({ t }) => t.p.length >= 2 && !t.st && !t.pl && !t.pt) || trainers[0];
const S = data.P.find(p => p.g === 0 && p.a.length > 1 && p.lv.length >= 4 && !used.has(p.id)) || data.P.find(p => p.g === 0);
const STOP = data.WK.splits.flatMap((sp, si) => sp.st.map((st, ti) => ({ st, si, ti }))).find(({ st }) => (st.s || []).length) || null;

// The update: one new entry at the front of each list, every index into M and AB moved up one.
function shifted() {
  const D = JSON.parse(JSON.stringify(data));
  const mv = i => (typeof i === 'number' ? i + 1 : i), ab = i => (typeof i === 'number' && i >= 0 ? i + 1 : i);
  D.M.unshift('Brand New Move');
  D.MV.unshift({ ...D.MV[0], d: 'A move added by the update.', h: [] });
  D.AB.unshift(['Brand New Ability', 'An ability added by the update.']);
  for (const p of D.P) {
    p.lv = p.lv.map(([l, m]) => [l, mv(m)]);
    for (const f of ['tm', 'tu', 'eg']) if (p[f]) p[f] = p[f].map(mv);
    p.a = p.a.map(ab);
    p.ha = ab(p.ha);
  }
  const mons = D.TR.g.flatMap(g => g.sec.flatMap(s => s.tr.flatMap(t => [...t.p, ...(t.pt || []).flatMap(x => x.p)])));
  for (const m of mons) {
    if (m.m) m.m = m.m.map(mv);
    m.a = ab(m.a);
    if ('a0' in m) m.a0 = ab(m.a0);
  }
  for (const sec of D.IT || []) for (const r of sec.r) if (typeof r[2] === 'number') r[2] = mv(r[2]);
  for (const sp of D.WK.splits) for (const st of sp.st) for (const it of st.it || []) if (typeof it[3] === 'number') it[3] = mv(it[3]);
  for (const it of D.WK.np || []) if (typeof it[3] === 'number') it[3] = mv(it[3]);
  if (D.GID) {
    if (D.GID.mv) D.GID.mv = D.GID.mv.map(mv);
    if (D.GID.ab) D.GID.ab = D.GID.ab.map(ab);   // CFRU saves store the ability slot: no ab table
  }
  D.P.unshift({ id: 'brand-new-species', n: 'Brand New Species', dex: 0, t: ['Normal'], a: [1], ha: -1, s: [50, 50, 50, 50, 50, 50],
    ef: [], et: [], of: [], lv: [[1, 1]], tm: [], eg: [], w: [], g: 3 });
  const x = D.TR.g[X.gi].sec[X.si].tr[X.ti];
  D.TR.g.unshift({ n: 'Brand New Box', cap: D.TR.g[0].cap, tab: 'Brand New Box', note: [], sec: [{ h: 'Brand New Place',
    tr: [{ ...JSON.parse(JSON.stringify(x)), k: 't-brand-new', n: 'Brand New Trainer', loc: 'Brand New Place', bt: undefined, p: [JSON.parse(JSON.stringify(x.p[0]))] }] }] });
  D.WK.splits[0].st.unshift({ ...D.WK.splits[0].st[0], k: 'brand-new-stop', n: 'Brand New Stop', s: [], it: [], tr: [] });
  return D;
}

const write = (tag, D) => {
  mkdirSync(join(OUT, 'guide-update-' + tag), { recursive: true });
  const out = join(OUT, 'guide-update-' + tag, name + '.html');
  writeFileSync(out, html.replace(match[0], () => match[1] + JSON.stringify(D).replaceAll('</', '<\\/') + match[3]));
  return out;
};
const before = write('before', data), after = write('after', shifted());
const openAfter = async (page, hash = '#/') => {
  page.file = after;
  await page.goto(hash);
};

// Every kind of saved state, as names: what the stored keys point at in the guide that loaded them.
const SNAPSHOT = `(()=>{const C=CF.calc?CALC.state():null,tn=k=>TRK[k]?.n??'gone:'+k;
  const stopOf=k=>{const [si,ti,step]=k.split('.');const s=D.WK.splits[si]?.st[ti];return s?s.n+' | '+(s.s?.[step]?.[0]??''):'gone:'+k;};
  return {
    custom:C?C.custom.map(c=>[byId[c.id]?.n,AB[c.a]?.[0],(c.m||[]).map(i=>i==null?null:M[i])]):null,
    foe:C?[tn(C.foe.k),C.foe.i]:null,
    recentTrainers:C?C.recent.map(tn):null,
    foeEdits:C?Object.entries(C.edits).filter(([k])=>k.startsWith('foe:')).map(([k,e])=>{const i=k.lastIndexOf(':');return [tn(k.slice(4,i)),k.slice(i+1),e.l];}):null,
    filters:st.f.map(f=>[f.k,f.k==='type'?f.v:fval(f)]),
    caps:Object.entries(TCAP).filter(([k])=>k!=='_last').map(([k,v])=>[tn(k),v]),
    trOpen:[Object.keys(TOPEN.o).map(g=>TRD.g[g]?.n),Object.keys(TOPEN.t).map(tn)],
    recents:recRead().map(o=>o.k==='p'?byId[o.v]?.n:o.k==='f'?fval(o.v):o.k==='t'?tn(o.v):o.k==='w'?D.WK.splits[o.si].st[o.ti].n:o.k==='i'?D.IT[o.si].r[o.ri][0]:o.k==='l'?AR[o.v].n:'?'),
    statCalc:P.filter(p=>localStorage.getItem(calcKey(p))).map(p=>[p.n,calcState(p).l]),
    walkTicks:Object.entries(WO.c).filter(([,v])=>v).map(([k])=>stopOf(k)),
    walkClosed:Object.entries(WO.x).filter(([k,v])=>v===0&&/^[0-9]+[.][0-9]+$/.test(k)).map(([k])=>stopOf(k+'.x')),
    tracker:Object.entries(TK.e).map(([a,e])=>[AR[a]?.n,e.p?byId[e.p]?.n:'failed']),
  };})()`;

const checks = [
  {
    id: '28a same state',
    title: 'every kind of saved state points at the same things after an update that shifts every index',
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      const k = JSON.stringify(X.t.k), sid = JSON.stringify(S.id);
      const area = data.AR.findIndex(A => !A.st && A.in == null && !A.ns && A.l.length);
      // Saved through the guide's own code, as a player would leave it.
      await page.value(`(()=>{const p=byId[${sid}],last=M.length-1,mid=usedMoves[Math.floor(usedMoves.length/2)];
        st.f.push({k:'mv',v:last},{k:'ab',v:p.a[p.a.length-1]},{k:'loc',v:LOC.length-1},{k:'type',v:p.t[0]});save();
        TCAP[${k}]=42;localStorage.setItem(LS.cap,JSON.stringify(TCAP));
        const t=TRK[${k}];TOPEN.o[t.at[0]]=1;TOPEN.t[t.k]=0;trSave();
        recSave([{k:'p',v:p.id},{k:'f',v:{k:'mv',v:mid}},{k:'t',v:t.k},...(${STOP ? 1 : 0}?[{k:'w',si:${STOP?.si},ti:${STOP?.ti}}]:[]),...((D.IT||[]).length?[{k:'i',si:0,ri:0}]:[])]);
        localStorage.setItem(calcKey(p),JSON.stringify({l:37,n:'Adamant',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]}));
        ${STOP ? `WO.c['${STOP.si}.${STOP.ti}.0']=1;` : ''}WO.x['0.'+(D.WK.splits[0].st.length>1?1:0)]=0;woSave();
        TK.e[${area}]={p:p.id};tkSave();})()`);
      if (data.cfg.calc) {
        await page.value(`(()=>{const p=byId[${sid}];CALC.enter(${k},1);CALC.use(p);
          CALC.set('mine','m',[M.length-1,usedMoves[0],usedMoves[1],usedMoves[2]]);CALC.set('mine','a',p.a[p.a.length-1]);})()`);
        await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.edits['foe:'+${k}+':1']={l:77};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
      }
      await page.reload();
      const was = await page.value(SNAPSHOT);
      for (const [kind, v] of Object.entries(was)) if (v !== null && (STOP || kind !== 'walkTicks')) assert.ok(JSON.stringify(v).length > 4, `nothing saved for ${kind}: ${JSON.stringify(v)}`);
      assert.ok(!JSON.stringify(was).includes('gone:'), `the guide as built reads its own state: ${JSON.stringify(was)}`);
      await openAfter(page);
      const now = await page.value(SNAPSHOT);
      for (const kind of Object.keys(was)) assert.deepEqual(now[kind], was[kind], `${kind} points at the same things after the update`);
      await page.route('#/calc').catch(() => {});
    },
  },
  {
    id: '28b same pages',
    title: "the shifted copy is consistent: a Pokémon page and a trainer card read the same as in the guide as built",
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      const text = () => page.value(`document.querySelector('#app').innerText.replace(/\\s+/g,' ').trim()`);
      await page.route('#/p/' + S.id);
      const pokemon = await text();
      await page.route('#/tr/' + X.t.k);
      const trainer = await text();
      await openAfter(page, '#/p/' + S.id);
      assert.equal(await text(), pokemon, 'the Pokémon page (moves, abilities)');
      await page.route('#/tr/' + X.t.k);
      assert.equal(await text(), trainer, 'the trainer card (team moves, abilities)');
    },
  },
];

await runChecks({ name: 'guide-update-' + name, file: before, checks });

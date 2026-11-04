// Saved state across a guide update that shifts every index (as Hardlove 0.8.5 did when it inserted a move): state saved
// on the guide as built must point at the same things in a copy with one new entry at the front of M (and MV), AB, P,
// the Trainers boxes and the first walkthrough split, every reference to them shifted. Rule: saved state never stores
// a position in the data (template/README.md → What the data switches on). Runs on every guide.
//   28a same state: calc sets (species, ability, moves), the calc's foe, Z slots (ST.z, by set / trainer key), recent trainers and foe edits (with this fight's
//   types / ability / item: FIGHT ft / fadd / fa / fi, by name), the hazard chip's offer, gauntlet chain state (ST.gc /
//       ST.gcSel, guides with chains), area rule
//       switches / Defog (guides with area rules), list filters, the Pokémon page's open sections,
//       level caps, Trainers open state, search recents, the stat calc, walkthrough ticks and the tracker, compared
//       by name before and after the update; pickup ticks (LS.items g, by pickup key) name the same item and line.
//   28c merged slots (encounter standard): two floors of one place recorded as their own slots before an update that
//       merges them (the second floor's area becomes a member, AR.in = the slot): the slot shows the first floor's
//       entry, the other stays stored, counted and shown as "also:" until cleared; a member's lone entry moves up.
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
const AREARULES = trainers.some(({ t }) => (t.field || []).some(r => (r.effects || []).some(e => e.kind === 'typed-side-condition' || e.locked)));
// A gauntlet member past the first when the guide has one (its chain state, ST.gc / ST.gcSel, is only kept while the
// calc's foe is in that chain).
const plainTr = ({ t }) => t.p.length >= 2 && !t.st && !t.pl && !t.pt;
const X = trainers.find(x => plainTr(x) && x.t.gc && x.t.gc.indexOf(x.t.k) > 0) || trainers.find(plainTr) || trainers[0];
const S = data.P.find(p => p.g === 0 && p.a.length > 1 && p.lv.length >= 4 && !used.has(p.id)) || data.P.find(p => p.g === 0);
const STOP = data.WK.splits.flatMap((sp, si) => sp.st.map((st, ti) => ({ st, si, ti }))).find(({ st }) => (st.s || []).some(Array.isArray)) || null;
// Walkthrough missions (stop.s objects): the first stop with two, and an ordinary step in a later stop.
const isM = x => x && !Array.isArray(x) && typeof x === 'object';
const WSTOPS = data.WK.splits.flatMap((sp, si) => sp.st.map((st, ti) => ({ st, si, ti })));
const MSTOP = WSTOPS.find(({ st }) => (st.s || []).filter(isM).length >= 2) || null;
const MS = MSTOP ? MSTOP.st.s.filter(isM).slice(0, 2) : [];
const LATER = MSTOP ? WSTOPS.slice(WSTOPS.indexOf(MSTOP) + 1).find(({ st }) => (st.s || []).some(Array.isArray)) : null;

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
  // A new item with a new pickup at the front of the first box: every IT row and pickup line moves down one.
  if (D.IT?.length) D.IT[0].r.unshift(['Brand New Item', 'Found: Brand New Place', null, 0, D.IT[0].r[0]?.[4] || '', ['p-brand-new']]);
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
  // Missions: reordered, their steps reordered, a new step and a new mission inserted, the second one moved to a later stop.
  if (MSTOP) {
    const st = D.WK.splits[MSTOP.si].st[MSTOP.ti + (MSTOP.si === 0 ? 1 : 0)];
    const ms = st.s.filter(isM);
    for (const m of ms) m.s = [{ k: 'brand-new-step', t: 'A step added by the update.' }, ...m.s.reverse()];
    const moved = ms[1];
    st.s = [{ m: 'mission-brand-new', n: 'Brand New Mission', u: '', r: '', s: [{ k: 'accept', t: 'Accept it.' }] }, ...st.s.filter(x => x !== moved && !isM(x)), ...ms.filter(x => x !== moved).reverse()];
    const later = D.WK.splits[LATER.si].st[LATER.ti + (LATER.si === 0 ? 1 : 0)];
    later.s = [moved, ...later.s];
  }
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
  const stopOf=k=>{const [si,ti,step]=k.split('.');const s=D.WK.splits[si]?.st[ti];return s?s.n+' | '+((s.s||[]).filter(Array.isArray)[step]?.[0]??''):'gone:'+k;};
  const ms=typeof MIS!=='undefined'&&MIS.size?Object.entries(misMap()||{}):null,mn=m=>MIS.get(m)?.n??'gone:'+m;
  return {
    custom:C?C.custom.map(c=>[byId[c.id]?.n,AB[c.a]?.[0],(c.m||[]).map(i=>i==null?null:M[i])]):null,
    foe:C?[tn(C.foe.k),C.foe.i]:null,
    zSlots:C?Object.keys(C.z).filter(k=>C.z[k]).map(k=>{const [side,...rest]=k.split(':'),slot=rest.pop();return side==='foe'?[side,tn(rest.slice(0,-1).join(':')),rest.at(-1),slot]:[side,byId[C.custom.find(c=>String(c.pid)===rest.join(':'))?.id]?.n??'gone:'+rest.join(':'),slot];}).sort():null,
    recentTrainers:C?C.recent.map(tn):null,
    foeEdits:C?Object.entries(C.edits).filter(([k])=>k.startsWith('foe:')).map(([k,e])=>{const i=k.lastIndexOf(':');return [tn(k.slice(4,i)),k.slice(i+1),e.l,e.ft,e.fadd,e.fa,e.fi];}):null,
    filters:st.f.map(f=>[f.k,f.k==='type'?f.v:fval(f)]),
    dexOpen:Object.entries(PO).map(([k,o])=>[PSECS.find(x=>x[0]===k)?.[1]??'gone:'+k,o]).sort(),
    caps:Object.entries(TCAP).filter(([k])=>k!=='_last').map(([k,v])=>[tn(k),v]),
    trOpen:[Object.keys(TOPEN.o).map(g=>TRD.g[g]?.n),Object.keys(TOPEN.t).map(tn)],
    recents:recRead().map(o=>o.k==='p'?byId[o.v]?.n:o.k==='f'?fval(o.v):o.k==='t'?tn(o.v):o.k==='w'?D.WK.splits[o.si].st[o.ti].n:o.k==='i'?D.IT[o.si].r[o.ri][0]:o.k==='l'?AR[o.v].n:o.k==='ms'?mn(o.m)+(o.c!=null?' | '+o.c:''):'?'),
    statCalc:P.filter(p=>localStorage.getItem(calcKey(p))).map(p=>[p.n,calcState(p).l]),
    walkTicks:Object.entries(WO.c).filter(([,v])=>v).map(([k])=>stopOf(k)),
    walkClosed:Object.entries(WO.x).filter(([k,v])=>v===0&&/^[0-9]+[.][0-9]+$/.test(k)).map(([k])=>stopOf(k+'.x')),
    missionsOpen:ms&&ms.filter(([m])=>MIS.has(m)).map(([m,r])=>[m,mn(m),r.o===true]).sort(),
    missionTicks:ms&&ms.filter(([m])=>MIS.has(m)).flatMap(([m,r])=>Object.keys(r.c||{}).filter(k=>r.c[k]===1).map(k=>[m,k,MIS.get(m).s.find(c=>c.k===k)?.t??'gone:'+k])).sort(),
    tracker:Object.entries(TK.e).map(([a,e])=>[AR[a]?.n,e.p?byId[e.p]?.n:'failed']),
    extra:(TK.x||[]).map(r=>[r.w,r.f?'failed':byId[r.p]?.n??'gone:'+r.p]),
    foeSpecies:C&&C.foeSp?Object.entries(C.foeSp).map(([k,v])=>{const i=k.lastIndexOf(':');return [tn(k.slice(4,i)),k.slice(i+1),byId[v]?.n??'gone:'+v];}):null,
    hazardOffer:C&&C.hzOffer&&Object.keys(C.hzOffer).length?Object.entries(C.hzOffer).map(([side,v])=>{const k=typeof v==='string'?v:v.k,off=typeof v==='object'&&v.off===true,i=k.lastIndexOf(':');return k.startsWith('foe:')?[side,tn(k.slice(4,i)),k.slice(i+1),off]:[side,byId[C.custom.find(c=>'mine:'+c.pid===k)?.id]?.n??'gone:'+k,off];}).sort():null,
    itemsOpen:(D.IT||[]).length?[...Object.keys(IO.o),...Object.keys(IO.s)].sort():null,
    itemTicks:Object.keys(IO.g).map(k=>{const p=pickupOf(k);return p?p.n+' | '+p.l:'gone:'+k;}).sort(),
    gauntlet:C&&C.gc?[tn(C.gc.first),Object.entries(C.gc.snap||{}).map(([k,v])=>[tn(k),Object.entries(v).map(([m,x])=>[byId[C.custom.find(c=>'mine:'+c.pid===m)?.id]?.n??'gone:'+m,x.hp??null,x.status??null,x.used===true])])]:null,
    gauntletSlots:C&&C.gcSel?Object.entries(C.gcSel).map(([k,i])=>[tn(k),i]):null,
    areaRules:C&&C.areaByTrainer?Object.entries(C.areaByTrainer).map(([k,v])=>[tn(k),Object.keys(v.disabled||{}).sort(),v.fogCleared===true]):null,
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
        st.f.push({k:'mv',v:last},{k:'ab',v:p.a[p.a.length-1]},{k:'loc',v:LOC.length-1},{k:'type',v:p.t[0]});PO.td=1;PO.mv=0;save();
        TCAP[${k}]=42;localStorage.setItem(LS.cap,JSON.stringify(TCAP));
        const t=TRK[${k}];TOPEN.o[t.at[0]]=1;TOPEN.t[t.k]=0;trSave();
        recSave([{k:'p',v:p.id},{k:'f',v:{k:'mv',v:mid}},{k:'t',v:t.k},...(${STOP ? 1 : 0}?[{k:'w',si:${STOP?.si},ti:${STOP?.ti}}]:[]),...((D.IT||[]).length?[{k:'i',si:0,ri:0}]:[])]);
        localStorage.setItem(calcKey(p),JSON.stringify({l:37,n:'Adamant',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]}));
        ${STOP ? `WO.c['${STOP.si}.${STOP.ti}.0']=1;` : ''}WO.x['0.'+(D.WK.splits[0].st.length>1?1:0)]=0;woSave();
        TK.e[${area}]={p:p.id};TK.x=[{w:'Extra place',p:p.id},{w:'',f:1}];tkSave();
        const pk=(D.IT||[]).flatMap(sec=>sec.r.flatMap(r=>(r[5]||[]).filter(Boolean)));[pk[1],pk[pk.length-1]].forEach(k=>k&&tickSet(k,true));
        const sec=(D.IT||[]).at(-1);if(sec){IO.o[sec.n]=1;if(sec.r[0][4])IO.s[sec.n+'.'+sec.r[0][4]]=1;ioSave();}})()`);
      if (MSTOP) await page.value(`(()=>{const [a,b]=${JSON.stringify(MS.map(m => [m.m, m.s.map(c => c.k)]))};
        misSet(a[0],r=>{r.o=true;r.c[a[1][0]]=1;});misSet(b[0],r=>{r.o=false;r.c[b[1][b[1].length-1]]=1;});
        WO.c['${LATER?.si}.${LATER?.ti}.0']=1;woSave();recSave([...recRead(),{k:'ms',m:a[0]},{k:'ms',m:b[0],c:b[1][0]}]);})()`);
      if (data.cfg.calc) {
        await page.value(`(()=>{const p=byId[${sid}];CALC.enter(${k},1);CALC.use(p);
          CALC.set('mine','m',[M.length-1,usedMoves[0],usedMoves[1],usedMoves[2]]);CALC.set('mine','a',p.a[p.a.length-1]);})()`);
        // Z slots (ST.z, by slot key: set pid / trainer key + index, then the move slot).
        await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.z={...s.z,['mine:'+s.custom.at(-1).pid+':1']:1,['foe:'+${k}+':1:0']:1};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
        await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));const t=Object.keys(D.TC);s.edits['foe:'+${k}+':1']={l:77,ft:[t[1]],fadd:t[2],fa:AB[byId[${sid}].a[0]][0],fi:'Leftovers'};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
        // The hazard chip's offer (ST.hzOffer: side → card key, trainer key + slot / custom pid, or {k, off} toggled out).
        await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.hzOffer={foe:{k:'foe:'+${k}+':1',off:true},mine:'mine:'+s.custom.at(-1).pid};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
        // Gauntlet chain state (ST.gc: first trainer key, the player's side by trainer key and mine:<pid>; ST.gcSel: foe
        // slot by trainer key), seeded when the foe is a chain member.
        if (X.t.gc) await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg)),g=${JSON.stringify(X.t.gc)};s.gc={first:g[0],snap:{[${k}]:{['mine:'+s.custom.at(-1).pid]:{hp:1,status:'psn',used:true}}}};s.gcSel={[g[0]]:1,[${k}]:1};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
        // Assumed sets (Unbound): the foe edit remembers its species (ST.foeSp, a species id, dropped when another is there).
        if (data.cfg.calc.assumedSets) await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.foeSp={['foe:'+${k}+':1']:TRK[${k}].p[1].id};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
        // Area rule switches and Defog (Unbound), keyed by trainer key and effect name.
        if (AREARULES) await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.areaByTrainer={[${k}]:{disabled:{'typed-side-condition:Tailwind:both':true,'weather:Heavy Rain:field':true},fogCleared:true}};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
      }
      await page.reload();
      const was = await page.value(SNAPSHOT);
      for (const [kind, v] of Object.entries(was)) if (v !== null && (STOP || kind !== 'walkTicks')) assert.ok(JSON.stringify(v).length > 4, `nothing saved for ${kind}: ${JSON.stringify(v)}`);
      assert.ok(!JSON.stringify(was).includes('gone:'), `the guide as built reads its own state: ${JSON.stringify(was)}`);
      if (data.cfg.calc && X.t.gc) assert.ok(was.gauntlet && was.gauntletSlots, `gauntlet chain state loads: ${JSON.stringify([was.gauntlet, was.gauntletSlots])}`);
      if (MSTOP) {
        assert.deepEqual(was.missionsOpen.map(x => x[2]), [true, false], 'one mission open, one closed');
        assert.ok(!/"\d+(\.\d+)+"/.test(await page.value(`JSON.stringify(misMap())`)), 'mission records hold no positions');
      }
      await openAfter(page);
      const now = await page.value(SNAPSHOT);
      for (const kind of Object.keys(was)) assert.deepEqual(now[kind], was[kind], `${kind} points at the same things after the update`);
      if (MSTOP) {
        await page.route('#/walk');
        assert.equal(await page.value(`stopLeaves(...(([s,si,ti])=>[s,si,ti])(walkStops().find(([s])=>s.k===${JSON.stringify(String(MSTOP.st.k))}))).filter(l=>l.m&&l.c.k==='brand-new-step').every(l=>!leafDone(l))`), true, 'new mission steps start unticked');
      }
      await page.route('#/calc').catch(() => {});
    },
  },
  {
    id: '28b same pages',
    title: "the shifted copy is consistent: a Pokémon page and a trainer card read the same as in the guide as built",
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      // the Pokémon page's pager left out: the update's new species can be its neighbour
      const text = () => page.value(`(()=>{const a=document.querySelector('#app'),n=a.querySelector('.pnav');if(n)n.style.display='none';const t=a.innerText.replace(/\\s+/g,' ').trim();if(n)n.style.display='';return t})()`);
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

// 28c: a place with a second floor that was its own slot (before) and is a member of the place's slot (after).
const SLOT = data.ESV === 2 ? data.AR.findIndex(A => A.es && !A.st && A.in == null && !A.ns && !A.sub) : -1;
if (SLOT >= 0) {
  const fam = data.P.filter(p => p.g === 0 && !p.w.length).slice(0, 2).map(p => p.id);
  const floor = (merged) => {
    const D = JSON.parse(JSON.stringify(data)), li = D.LOC.length, b = D.AR.length;
    D.LOC.push(D.AR[SLOT].n + ' B9F');
    D.AR.push({ n: D.AR[SLOT].n + ' B9F', l: [li], ...(merged ? { in: SLOT } : { es: [{ k: 'cave', g: [{ rows: [{ p: fam[1], r: { '|': 100 } }] }] }] }) });
    if (merged) D.AR[SLOT].es.push({ k: 'cave', g: [{ f: 'B9F', rows: [{ p: fam[1], r: { '|': 100 } }] }] });
    D.P.find(p => p.id === fam[1]).w.push([li, 'Cave', '100%', '5', '', 1]);
    if (D.ARO && !merged) D.ARO.push(b);
    return D;
  };
  const pre = write('premerge', floor(false)), post = write('merged', floor(true)), B = data.AR.length;
  checks.push({
    id: '28c merged slots',
    title: 'two floors recorded before a merge: the slot shows the first, the other stays as "also:"',
    sizes: SIZE_SMALL,
    modes: ['normal'],
    file: pre,
    run: async page => {
      const ids = JSON.stringify(fam);
      await page.value(`(()=>{const f=${ids};TK.e[${SLOT}]={p:f[0]};TK.e[${B}]={p:f[1]};tkSave();})()`);
      const counts = await page.value('tkCounts()');
      page.file = post;
      await page.goto('#/locs');
      assert.deepEqual(await page.value(`[TK.e[${SLOT}]?.p,TK.e[${B}]?.p]`), fam, 'both entries kept');
      assert.deepEqual(await page.value('tkCounts()'), counts, 'both still count');
      assert.equal(await page.value(`caughtFams(${SLOT}).has(FAM[${JSON.stringify(fam[1])}])`), true, "the other floor's species counts for dupes");
      assert.equal(await page.value(`!!document.querySelector('details.split[data-a="${B}"]')`), false, 'the member has no card');
      await page.value(`(async()=>{const d=document.querySelector('details.split[data-a="${SLOT}"]');d.open=true;await new Promise(r=>setTimeout(r,150));})()`);
      assert.equal(await page.value(`document.querySelector('.trk[data-a="${SLOT}"] .tk-sel').value`), fam[0], 'the slot shows its first floor');
      assert.match(await page.value(`document.querySelector('details.split[data-a="${SLOT}"] .tk-also').textContent`), /also: .+ \(B9F\)/, 'the other as "also: <species> (<floor>)"');
      await page.value(`document.querySelector('details.split[data-a="${SLOT}"] .tk-ax').click()`);
      assert.equal(await page.value(`JSON.parse(localStorage.getItem(LS.track)).e[${B}]??null`), null, 'cleared');
      // a member's lone entry (only the second floor recorded) moves to the slot
      await page.value(`(()=>{const f=${ids};delete TK.e[${SLOT}];TK.e[${B}]={p:f[1]};tkSave();})()`);
      await page.reload();
      assert.deepEqual(await page.value(`[TK.e[${SLOT}]?.p,TK.e[${B}]??null]`), [fam[1], null], "a member's lone entry moves to the slot");
    },
  });
}

await runChecks({ name: 'guide-update-' + name, file: before, checks });

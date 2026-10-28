// Saved state across a simulated guide update (template/README.md → What the data switches on, "stored by name" and
// "stable trainer keys"). Each check saves state on the guide as built, then opens an "updated" copy in the same
// browser context (same storage): a new first Trainers box with a new trainer, a new trainer before the chosen one, a
// new first walkthrough stop, a new first Items box and a new first row in the old first box, a new first place in an
// area, and one species with a new id (EI's ids are the game's species numbers). Old storage formats load too.
//   27a trainers: level cap, Trainers page open state, the calc's foe, recent trainers, foe edit and a copied foe.
//   27b search recents: a species, a filter, a stop, a trainer and an item, stored by identity; old positional ones.
//   27c species: the Dex stat calc (old id key moves to the name) and the tracker (old ids load, saved by name).
//   27d open boxes (Items, Locations) and the reopen route and anchor (LS.pos).
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OUT, SIZE_SMALL, guideArg, readGuide, runChecks } from '../calc_check_lib.mjs';

const file = guideArg(process.argv);
const { html, match, data } = readGuide(file);
const name = file.split(/[\\/]/).pop().replace(/\.html$/, '');
const trainers = data.TR.g.flatMap((g, gi) => g.sec.flatMap((s, si) => s.tr.map((t, ti) => ({ t, gi, si, ti }))));
const usedIds = new Set(trainers.flatMap(({ t }) => [...t.p, ...(t.pt || []).flatMap(x => x.p)].map(m => m.id)));
const X = trainers.find(({ t }) => t.p.length >= 2 && !t.st && !t.pl && !t.pt) || trainers[0];
const S = data.P.find(p => p.g === 0 && !(p.of || []).length && p.w.length && !usedIds.has(p.id)
  && !data.P.some(q => (q.of || []).includes(p.id)));
const NEW_ID = 'moved-' + S?.id;
const AREA = data.AR.findIndex(A => !A.st && A.in == null && !A.ns && A.l.length);

function renameSpecies(D, from, to) {
  const id = v => (v === from ? to : v);
  for (const p of D.P) {
    p.id = id(p.id);
    for (const f of ['ef', 'et']) p[f] = (p[f] || []).map(([how, x]) => [how, id(x)]);
    if (p.of) p.of = p.of.map(id);
  }
  for (const A of D.AR) for (const s of A.es || []) for (const g of s.g || []) for (const r of g.rows || []) {
    r.p = id(r.p);
    if (r.sos) r.sos = r.sos.map(x => (Array.isArray(x) ? x.map(id) : id(x)));
  }
  for (const { t } of trainers) for (const m of [...t.p, ...(t.pt || []).flatMap(x => x.p)]) m.id = id(m.id);
  if (Array.isArray(D.GID?.sp)) D.GID.sp = D.GID.sp.map(id);
  else if (D.GID?.sp) for (const k of Object.keys(D.GID.sp)) D.GID.sp[k] = id(D.GID.sp[k]);
}

function updated() {
  const D = JSON.parse(JSON.stringify(data));
  const box = D.TR.g[X.gi], sec = box.sec[X.si];
  const fresh = (k, n) => ({ ...JSON.parse(JSON.stringify(sec.tr[X.ti])), k, n, loc: 'New Place', bt: undefined });
  sec.tr.splice(X.ti, 0, fresh('t-new-2', 'Newer Trainer'));
  D.TR.g.unshift({ n: 'New Box', cap: box.cap, tab: 'New Box', note: [], sec: [{ h: 'New Place', tr: [fresh('t-new-1', 'New Trainer')] }] });
  D.WK.splits[0].st.unshift({ ...D.WK.splits[0].st[0], k: 'new-stop', n: 'New Stop', s: [], it: [], tr: [] });
  if (D.IT?.length) {
    D.IT[0].r.unshift(['New Row', 'Somewhere']);
    D.IT.unshift({ n: 'New Section', k: 'gen', r: [['New Item', 'Somewhere']] });
  }
  D.AR[AREA].l.unshift(D.LOC.push('Brand New Place') - 1);
  renameSpecies(D, S.id, NEW_ID);
  return D;
}

mkdirSync(OUT, { recursive: true });
const write = (tag, D) => {
  mkdirSync(join(OUT, 'stable-keys-' + tag), { recursive: true });
  const out = join(OUT, 'stable-keys-' + tag, name + '.html');
  writeFileSync(out, html.replace(match[0], () => match[1] + JSON.stringify(D).replaceAll('</', '<\\/') + match[3]));
  return out;
};
const before = S && write('before', data);
const after = S && write('after', updated());
const toUpdate = async page => {
  page.file = after;
  await page.goto('#/');
};
const CALC = !!data.cfg.calc;

const checks = [
  {
    id: '27a trainers',
    title: "a trainer's cap, open state and calc state stay on it when an update inserts trainers and a box before it",
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      const k = X.t.k;
      await page.value(`(()=>{const t=TRK[${JSON.stringify(k)}];TCAP[t.k]=42;localStorage.setItem(LS.cap,JSON.stringify(TCAP));
        TOPEN.o[t.at[0]]=1;TOPEN.p[t.at[0]+'.'+t.at[1]]=0;TOPEN.t[t.k]=0;trSave();})()`);
      if (CALC) {
        await page.value(`(()=>{CALC.enter(${JSON.stringify(k)},1);CALC.use(P.find(p=>p.g===0));})()`);
        await page.value(`(()=>{const s=JSON.parse(localStorage.getItem(LS.dmg));s.edits['foe:'+${JSON.stringify(k)}+':1']={l:77};
          s.custom.at(-1).pid='f:'+${JSON.stringify(k)}+':1';s.recent=[${JSON.stringify(k)},...s.recent.filter(x=>x!==${JSON.stringify(k)})];
          s.mine={src:'party',b:0,i:0};localStorage.setItem(LS.dmg,JSON.stringify(s));})()`);
      }
      await toUpdate(page);
      const got = await page.value(`(()=>{const t=TRK[${JSON.stringify(k)}];return {n:t&&t.n,at:t&&t.at,cap:capOf(t),own:TCAP[t.k],o:TOPEN.o,p:TOPEN.p,t:TOPEN.t[t.k]};})()`);
      assert.equal(got.n, X.t.n, 'the key still names the trainer');
      assert.deepEqual(got.at, [X.gi + 1, X.si], 'it moved one box down');
      assert.deepEqual([got.cap, got.own], [42, 42], 'its level cap stays');
      assert.deepEqual(got.o, { [X.gi + 1]: 1 }, 'its box stays open (the open state moved with the box name)');
      assert.deepEqual(got.p, { [`${X.gi + 1}.${X.si}`]: 0 }, 'its place stays closed');
      assert.equal(got.t, 0, 'the trainer stays closed');
      await page.route('#/trainers');
      assert.equal(await page.value(`document.querySelector('details.split[data-gi="${X.gi + 1}"]').open`), true, 'the open box on the Trainers page');
      assert.equal(await page.value(`document.querySelector('details.split[data-gi="0"]').open`), false, 'the new box is closed');
      if (CALC) {
        const s = await page.value(`(()=>{const s=CALC.state();return {foe:s.foe,recent:s.recent,edit:s.edits['foe:'+${JSON.stringify(k)}+':1'],pid:s.custom.some(c=>c.pid==='f:'+${JSON.stringify(k)}+':1')};})()`);
        assert.deepEqual(s.foe, { k, i: 1 }, "the calc's foe");
        assert.equal(s.recent[0], k, 'recent trainers');
        assert.equal(s.edit?.l, 77, 'the foe edit');
        assert.equal(s.pid, true, 'the copied foe');
        await page.route('#/calc');
        assert.equal(await page.count('.dmatch .cc[data-s="foe"]'), 1, 'the calc page shows the foe');
      }
    },
  },
  {
    id: '27b recents',
    title: 'search recents are stored by identity and come back at their new positions; positional ones load or drop',
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      const stop = await page.value(`(()=>{const sp=D.WK.splits[0];return {ti:sp.st.length>1?1:0,k:String(sp.st[sp.st.length>1?1:0].k)};})()`);
      const stored = await page.value(`(()=>{const mv=usedMoves[0];recSave([{k:'p',v:${JSON.stringify(S.id)}},{k:'f',v:{k:'mv',v:mv}},{k:'w',si:0,ti:${stop.ti}},
        {k:'t',v:${JSON.stringify(X.t.k)}},...((D.IT||[]).length?[{k:'i',si:0,ri:0}]:[])]);return {mv:M[mv],raw:JSON.parse(localStorage.getItem(LS.recent))};})()`);
      assert.deepEqual(stored.raw[0], { k: 'p', v: S.n }, 'a species by name');
      assert.deepEqual(stored.raw[1], { k: 'f', v: { k: 'mv', v: stored.mv } }, 'a filter by name');
      assert.deepEqual(stored.raw[2], { k: 'w', w: stop.k }, 'a stop by its key');
      if (data.IT?.length) assert.deepEqual(stored.raw[4], { k: 'i', si: data.IT[0].n, ri: data.IT[0].r[0][0] }, 'an item by box and row names');
      await toUpdate(page);
      const back = await page.value(`(()=>{const r=recRead();return {r,mv:r[1]&&M[r[1].v.v]};})()`);
      assert.deepEqual(back.r[0], { k: 'p', v: NEW_ID }, 'the species, now under its new id');
      assert.equal(back.mv, stored.mv, 'the filter');
      assert.deepEqual(back.r[2], { k: 'w', si: 0, ti: stop.ti + 1 }, 'the stop, one down');
      assert.deepEqual(back.r[3], { k: 't', v: X.t.k }, 'the trainer');
      if (data.IT?.length) assert.deepEqual(back.r[4], { k: 'i', si: 1, ri: 1 }, 'the item, in its box one down, one row down');
      // Saved before identities: a stop by position takes its key from the layout it was saved under (WO.layout, here
      // the "before" guide's), a species by id and an item by position load as they are, a gone species drops.
      await page.value(`(()=>{const w=JSON.parse(localStorage.getItem(LS.walk));w.layout=${JSON.stringify(data.WK.splits.map(sp => sp.st.map(x => String(x.k))))};
        localStorage.setItem(LS.walk,JSON.stringify(w));
        localStorage.setItem(LS.recent,JSON.stringify([{k:'w',si:0,ti:${stop.ti}},{k:'p',v:${JSON.stringify(NEW_ID)}},{k:'p',v:'no-such-id'},{k:'i',si:0,ri:0}]));})()`);
      await page.reload();
      const old = await page.value('recRead()');
      assert.deepEqual(old[0], { k: 'w', si: 0, ti: stop.ti + 1 }, 'a positional stop follows its key');
      assert.deepEqual(old[1], { k: 'p', v: NEW_ID }, 'a species by id loads');
      assert.equal(old.length, data.IT?.length ? 3 : 2, 'a gone species drops');
      if (data.IT?.length) assert.deepEqual(old[2], { k: 'i', si: 0, ri: 0 }, 'an item by position loads as it is');
      assert.deepEqual(JSON.parse(await page.value('localStorage.getItem(LS.recent)'))[0], { k: 'w', w: stop.k }, 'and is stored by key');
    },
  },
  {
    id: '27c species',
    title: 'the stat calc and the tracker keep a species whose id changes; id-keyed storage loads and moves to names',
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      await page.value(`(()=>{localStorage.setItem(LS.calc+':'+${JSON.stringify(S.id)},JSON.stringify({l:37,n:'Adamant',iv:[31,31,31,31,31,31],ev:[0,0,0,0,0,0]}));
        localStorage.setItem(LS.track,JSON.stringify({s:'',pl:'',e:{${AREA}:{p:${JSON.stringify(S.id)}}},t:{}}));})()`);
      await page.reload();
      const mid = await page.value(`(()=>{const p=byId[${JSON.stringify(S.id)}];return {l:calcState(p).l,old:localStorage.getItem(LS.calc+':'+p.id),key:calcKey(p),named:!!localStorage.getItem(calcKey(p)),tk:TK.e[${AREA}]};})()`);
      assert.equal(mid.l, 37, 'the stat calc state saved by id loads');
      assert.equal(mid.key, `${data.cfg.ls.calc}:${S.n}`, 'keyed by name');
      assert.deepEqual([mid.old, mid.named], [null, true], 'the id key moved to the name');
      assert.deepEqual(mid.tk, { p: S.id }, 'a tracker entry saved by id loads');
      await page.value('tkSave()');
      assert.deepEqual(JSON.parse(await page.value('localStorage.getItem(LS.track)')).e[AREA], { p: S.n }, 'and is saved by name');
      await toUpdate(page);
      const got = await page.value(`(()=>{const p=byId[${JSON.stringify(NEW_ID)}];return {l:calcState(p).l,tk:TK.e[${AREA}],code:JSON.parse(tkOut()).e[${AREA}]};})()`);
      assert.equal(got.l, 37, 'the stat calc state follows the species to its new id');
      assert.deepEqual(got.tk, { p: NEW_ID }, 'so does the tracker entry');
      assert.deepEqual(got.code, { p: S.n }, 'the backup code names it');
      await page.route('#/p/' + NEW_ID);
      assert.equal(await page.value(`document.querySelector('#c-l')?.value`), '37', 'the stat calculator shows it');
    },
  },
  {
    id: '27d boxes and route',
    title: 'open Items / Locations boxes follow their names; the reopen route and anchor follow their names',
    sizes: SIZE_SMALL,
    modes: ['normal'],
    run: async page => {
      await page.value(`(()=>{if((D.IT||[]).length){IO.o[0]=1;IO.x[0]=0;localStorage.setItem(LS.items,JSON.stringify(IO));}
        LO.x[${AREA}+'.0']=0;LO.s[${AREA}+'.0.Grass']=0;loSave();})()`);
      await page.route('#/m/7');
      await page.value('posSave()');
      const pos = JSON.parse(await page.value('localStorage.getItem(LS.pos)'));
      assert.deepEqual([pos.h, pos.n], ['#/m/7', data.M[7]], 'the route names its move');
      // A move that moved: the stored route points at another index, the name at move 7. (The page saves its own
      // position when it is hidden, as on leaving it: not this one, so the seeded state is what the next page reads.)
      await page.value(`clearTimeout(posT);Object.defineProperty(document,'hidden',{get:()=>false});localStorage.setItem(LS.pos,JSON.stringify({h:'#/m/5',n:M[7],a:{sel:'a.row[href="#/p/${S.id}"]',dy:0},an:${JSON.stringify(S.n)}}))`);
      // LS.pos as the boot left it (the page saves its own position soon after).
      await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `document.addEventListener('DOMContentLoaded',()=>{window.__pos=localStorage.getItem(${JSON.stringify(data.cfg.ls.pos)});});` });
      page.file = after;
      await page.goto('');
      assert.equal(await page.value('location.hash'), '#/m/7', 'the route follows the move name');
      const got = await page.value(`(()=>({io:IO.o,ix:IO.x,lx:LO.x,ls:LO.s,pos:JSON.parse(window.__pos)}))()`);
      if (data.IT?.length) assert.deepEqual([got.io, got.ix], [{ 1: 1 }, { 1: 0 }], 'the open Items box moved with its name');
      assert.deepEqual(got.lx, { [`${AREA}.1`]: 0 }, 'the closed place moved with its name');
      assert.deepEqual(got.ls, { [`${AREA}.1.Grass`]: 0 }, 'and its closed method');
      assert.equal(got.pos.a?.sel, `a.row[href="#/p/${NEW_ID}"]`, 'the anchor follows the species to its new id');
      // A route to a page that is gone: the Pokémon list.
      await page.value(`clearTimeout(posT);Object.defineProperty(document,'hidden',{get:()=>false});localStorage.setItem(LS.pos,JSON.stringify({h:'#/a/3',n:'No Such Ability',a:{sel:'x'}}))`);
      await page.goto('');
      assert.equal(await page.value('location.hash'), '#/', 'a gone page opens the list');
    },
  },
];

if (!S) checks.forEach(check => (check.skip = 'no species fits'));
await runChecks({ name: 'stable-keys-' + name, file: before || file, checks });

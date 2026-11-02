// The synthetic Radical Red saves (cfru_rr.mjs) through two independent RR readers, slot by slot against cfru.js:
// hzla's savereader_radicalred.js (hacks/radical-red/.src, reference only) in the guide's names, and RadicalHex's
// src/core.js (jajaa17/RadicalHex 3697412, GPLv3; fetched to .tmp, run in a bare vm context) in raw game ids by box
// position. Every difference is named as one oracle's own rule or counted unexplained (the target is 0).
//
//   gh api "repos/jajaa17/RadicalHex/contents/src/core.js?ref=3697412c9a18e805886497e23284fc25efa5af74" --jq .content \
//     | base64 -d > .tmp/radicalhex/core.js
//   node tools/calc/cfru_rr_oracles.mjs [--radicalhex .tmp/radicalhex/core.js]
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import vm from 'node:vm';
import {loadReader, guideData, named} from './cfru_lib.mjs';
import {dir, root, HZLA, SAVES} from './cfru_rr.mjs';

const arg = process.argv.indexOf('--radicalhex'), rhPath = arg > 0 ? process.argv[arg + 1] : join(root, '.tmp', 'radicalhex', 'core.js');
if (!existsSync(HZLA)) {console.log('skip: no hzla in hacks/radical-red/.src'); process.exit(0);}
const hzla = createRequire(import.meta.url)(join(HZLA, 'savereader_radicalred.js'));
let RH = null;
if (existsSync(rhPath)) {const ctx = {}; ctx.globalThis = ctx; vm.runInNewContext(readFileSync(rhPath, 'utf8'), ctx); RH = ctx.RHCore;}
const read = loadReader(root), D = guideData(root, 'radical-red');
D.cfg = {...D.cfg, calc: {...(D.cfg.calc || {}), save: 'cfru', cfru: 'radicalred41'}};
const key = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const tally = {}, unexplained = [];
const explain = (rule, where) => {(tally[rule] ||= []).push(where);};

for (const name of readdirSync(dir).filter(n => n.endsWith('.expected.json')).sort()) {
  const want = JSON.parse(readFileSync(join(dir, name), 'utf8')), bytes = new Uint8Array(readFileSync(join(dir, want.save)));
  let mine, h, r;
  try {mine = read(bytes, D);} catch (e) {mine = {error: e.code};}
  try {h = hzla.parseRadicalRedSaveFile(bytes.slice().buffer, {});} catch (e) {h = {error: e.message};}
  try {r = RH ? RH.load(bytes) : null;} catch (e) {r = {error: e.message};}
  const accepted = x => x && !x.error && (x.parsedParty ? x.parsedParty.length + x.parsedBoxes.length : true);
  console.log(`${want.save.padEnd(28)} cfru.js ${(mine.error || 'read').padEnd(10)} hzla ${h.error ? 'throws' : h.parsedParty.length + h.parsedBoxes.length + ' mons'}`.padEnd(70) +
    ` RadicalHex ${!RH ? 'not run' : r.error ? 'refuses' : 'loads'}`);
  if (mine.error) {
    // what the other readers do with a save cfru.js refuses
    if (want.save === 'ability-randomiser.sav' && accepted(h)) explain('hzla reads ability-randomised saves (re-rolls each ability); cfru.js refuses them', want.save);
    else if (want.save === 'vanilla-firered.sav' && accepted(h)) explain('hzla checks no signature or checksum: it reads a vanilla FireRed save; cfru.js and RadicalHex refuse it', want.save);
    else if (want.save === 'unbound-signature.sav' && accepted(h)) explain('hzla checks no signature: it reads an Unbound-signed save as RR', want.save);
    if (RH && !r.error) explain('RadicalHex (an editor) loads randomised saves; cfru.js refuses the ability randomiser', want.save);
    continue;
  }
  // hzla: party by order, boxes as one list in order (it scans boxes 1-19 only)
  const ours = {party: mine.party.map(m => named(D, m)), boxes: mine.boxes.map(b => b.map(m => named(D, m)))};
  const cmp = (a, b, where, isBox) => {
    if (key(a.species) !== key(b.speciesName)) {
      if (['jellicentf', 'unown', 'darmanitanzen'].includes(key(b.speciesName))) explain('hzla names a cosmetic or battle-only form its own way (Jellicent-F, Unown, Darmanitan-Zen; cfru.js: GID)', where);
      else unexplained.push(`${where} species ${a.species} / hzla ${b.speciesName}`);
    }
    if (isBox && a.level !== b.level) {if (b.level === 100) explain('hzla gives every boxed Pokémon the level cap (100 without its page), not the level from experience', where); else unexplained.push(`${where} level ${a.level} / hzla ${b.level}`);}
    if (!isBox && a.level !== b.level) unexplained.push(`${where} level ${a.level} / hzla ${b.level}`);
    if (key(a.nature) !== key(b.natureName)) unexplained.push(`${where} nature ${a.nature} / hzla ${b.natureName}`);
    if (key(a.ability) !== key(b.abilityName)) {
      if (key(b.speciesName) === 'jellicentf' || key(b.speciesName) === 'darmanitanzen' || key(b.speciesName) === 'jellicent') explain("hzla takes a form's abilities from its by-name table (the base form's, Cursed Body where data.js has Damp)", where);
      else unexplained.push(`${where} ability ${a.ability} / hzla ${b.abilityName}`);
    }
    if (key(a.item) !== key(b.itemName)) unexplained.push(`${where} item ${a.item} / hzla ${b.itemName}`);
    const mv = a.moves.filter(Boolean);
    if (mv.map(key).join() !== b.moveNames.map(key).join()) unexplained.push(`${where} moves ${mv} / hzla ${b.moveNames}`);
  };
  if (h.error) unexplained.push(`${want.save}: hzla throws ${h.error}`);
  else {
    ours.party.forEach((m, i) => h.parsedParty[i] ? cmp(m, h.parsedParty[i], `${want.save} party ${i + 1}`, false) : unexplained.push(`${want.save} party ${i + 1}: hzla none`));
    // a stream slot across two sectors (hzla joins whole 0x1000 sectors, the footer and padding included)
    const spec = SAVES.find(x => x.name + '.sav' === want.save), slotOf = (b, i) => (spec.boxes[b] || []).map(([s]) => s).sort((x, y) => x - y)[i];
    const seam = (b, s) => {const at = 4 + (b * 30 + s) * 58; return Math.floor(at / 0xFF0) !== Math.floor((at + 57) / 0xFF0);};
    const flat = ours.boxes.slice(0, 19).flatMap((b, i) => b.map((m, j) => [m, i + 1, seam(i, slotOf(i, j))]));
    let at = 0;
    for (const [m, box, across] of flat) {
      const b = h.parsedBoxes[at];
      if (across) {
        explain('hzla misreads or misses a boxed Pokémon across two sectors (it joins whole sectors, footers included)', `${want.save} box ${box} ${m.species}`);
        if (b && key(b.speciesName) === key(m.species)) at++;
        continue;
      }
      if (b && key(b.speciesName) === key(m.species) || b && ['jellicentf', 'unown', 'darmanitanzen'].includes(key(b.speciesName))) {cmp(m, b, `${want.save} box ${box} ${m.species}`, true); at++;}
      else explain('hzla misses a boxed Pokémon that straddles two sectors (it joins whole 0x1000 sectors, footers included)', `${want.save} box ${box} ${m.species}`);
    }
    if (at !== h.parsedBoxes.length) unexplained.push(`${want.save}: hzla has ${h.parsedBoxes.length - at} boxed Pokémon cfru.js doesn't`);
    ours.boxes.slice(19).forEach((b, i) => b.forEach(m => explain('hzla reads boxes 1-19 only (not 20-25)', `${want.save} box ${20 + i} ${m.species}`)));
  }
  // RadicalHex: raw ids by position, against cfru.js's raw result (present Pokémon in order)
  if (RH && !r.error) {
    const M = RH.mon, raw = ref => ({sp: M.species(ref), it: M.item(ref), exp: M.exp(ref), mv: M.moves(ref), iv: M.ivs(ref), ev: M.evs(ref), pid: M.pid(ref), egg: M.isEgg(ref), ha: M.hiddenAbility(ref)});
    const same = (a, b, where) => {
      const diffs = ['sp', 'it', 'pid'].filter(k => a[k] !== b[k]).concat(['mv', 'iv', 'ev'].filter(k => a[k].join() !== b[k].join()));
      if ((a.abs === 2) !== b.ha && !(a.abs !== 2 && b.ha)) diffs.push('hidden');
      if (diffs.length) unexplained.push(`${where}: RadicalHex differs in ${diffs}`);
    };
    const party = Array.from({length: RH.partyCount(r)}, (_, i) => raw(RH.partyRef(r, i))).filter(m => m.sp);
    if (party.length !== mine.party.length) unexplained.push(`${want.save}: RadicalHex party ${party.length}, cfru.js ${mine.party.length}`);
    mine.party.forEach((m, i) => party[i] && same(m, party[i], `${want.save} party ${i + 1}`));
    for (let b = 0; b < 25; b++) {
      const slots = Array.from({length: 30}, (_, s) => raw(RH.boxRef(r, b, s))).filter(m => m.sp);
      const kept = slots.filter(m => !m.egg);
      if (slots.length !== kept.length) explain('RadicalHex lists eggs in the boxes; cfru.js skips them', `${want.save} box ${b + 1}`);
      const bad = kept.filter(m => !mine.boxes[b].some(x => x.pid === m.pid));
      bad.forEach(() => explain('RadicalHex lists a Bad Egg (sanity bit 0) as its species; cfru.js skips it', `${want.save} box ${b + 1}`));
      const rest = kept.filter(m => !bad.includes(m));
      if (rest.length !== mine.boxes[b].length) unexplained.push(`${want.save} box ${b + 1}: RadicalHex ${rest.length}, cfru.js ${mine.boxes[b].length}`);
      mine.boxes[b].forEach((m, i) => rest[i] && same(m, rest[i], `${want.save} box ${b + 1} slot ${i + 1}`));
    }
  }
}
console.log('\nexplained (one oracle\'s own rule):');
for (const [rule, where] of Object.entries(tally)) console.log(`  ${String(where.length).padStart(3)}  ${rule}`);
console.log(`unexplained: ${unexplained.length}${unexplained.length ? '\n  ' + unexplained.join('\n  ') : ''}`);
process.exit(unexplained.length ? 1 : 0);

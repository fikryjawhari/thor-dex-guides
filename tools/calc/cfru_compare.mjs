// template/calc/readers/cfru.js against the two oracles' dumps (cfru_oracles.mjs), slot by slot, on every save.
// Prints one line per save and writes .tmp/<hack>-reader/compare.json; every difference is either explained (a named,
// documented rule of one oracle) or counted as unexplained (exit 1).
//
//   node tools/calc/cfru_oracles.mjs && node tools/calc/cfru_compare.mjs [--hack unbound] [--write-fixtures]
//
// --write-fixtures writes hacks/<hack>/.src/saves/expected/<save>.expected.json (what cfru_check.mjs asserts) once
// the comparison has no unexplained mismatch.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReader, guideData, named, fixtureText} from './cfru_lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (name, fallback) => {const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback;};
const hack = arg('--hack', 'unbound'), src = join(root, 'hacks', hack, '.src'), tmp = join(root, '.tmp', `${hack}-reader`);
const oracles = join(tmp, 'oracles'), savesDir = join(src, 'saves', 'Unbound-Cloud');
if (!existsSync(oracles) || !existsSync(savesDir)) {console.log('skip: run cfru_oracles.mjs first (needs .src/saves)'); process.exit(0);}
const require = createRequire(import.meta.url);
const constants = require(join(src, 'repos', 'hzla', 'js', 'savereaders', 'save_constants', 'unbound_2_1_constants.js'));
const read = loadReader(root), D = guideData(root, hack), G = D.GID, byId = new Map(D.P.map(p => [p.id, p]));
const CALC = [0, 1, 2, 4, 5, 3], toCalc = a => CALC.map(i => a[i]);           // game HP Atk Def Spe SpA SpD -> calc
const cloudSpecies = JSON.parse(readFileSync(join(src, 'repos', 'Unbound-Cloud', 'server', 'src', 'data', 'unbound_2_1', 'Species.json'), 'utf8'));
const cloudSpId = Object.fromEntries(Object.entries(cloudSpecies).map(([k, v]) => [v, +k]));
const baseStats = JSON.parse(readFileSync(join(src, 'repos', 'Unbound-Cloud', 'server', 'src', 'data', 'unbound_2_1', 'BaseStats.json'), 'utf8'));

const walk = dir => readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.json') && e.name !== 'summary.json' ? [join(dir, e.name)] : []).sort();
const all = {explained: {}, unexplained: [], saves: []}, dumps = new Map();
const explain = (save, kind, detail) => {(all.explained[kind] ||= []).push(`${save}: ${detail}`);};
const miss = (save, detail) => all.unexplained.push(`${save}: ${detail}`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// the page's ability for a slot (calc.js importMon), so a slot difference that lands on the same ability is not one
const abilityOf = (sp, slot) => {const s = byId.get(G.sp[sp]); return s ? (slot === 2 ? s.ha : s.a[slot]) : null;};

for (const file of walk(oracles)) {
  const o = JSON.parse(readFileSync(file, 'utf8')), save = o.save, bytes = new Uint8Array(readFileSync(join(savesDir, save)));
  let mine;
  try {mine = read(bytes, D);} catch (e) {mine = {error: e.code, game: e.game};}
  const row = {save, sha256: createHash('sha256').update(bytes).digest('hex'), cloud: o.cloud.accepted ? (o.cloud.randomizer ? 'randomizer' : 'accepted') : 'rejected',
    hzla: o.hzla.accepted ? 'accepted' : 'rejected', cfru: mine.error ? mine.error : 'accepted', party: mine.party?.length ?? 0,
    boxed: mine.boxes?.flat().length ?? 0, mismatches: 0, explained: 0};
  all.saves.push(row);
  dumps.set(save, o);
  const before = all.unexplained.length, beforeExplained = Object.values(all.explained).flat().length;
  // acceptance: cfru.js refuses what hzla refuses (randomised, no valid 2.1 slot); Cloud only flags randomisers
  if (o.hzla.accepted !== !mine.error && !(mine.error === 'empty' && o.hzla.accepted && !o.hzla.party.length && !o.hzla.boxes.length))
    miss(save, `acceptance: hzla ${o.hzla.accepted ? 'accepts' : 'rejects (' + o.hzla.reason + ')'}, cfru.js ${mine.error ? 'throws ' + mine.error + (mine.game ? ' (' + mine.game + ')' : '') : 'accepts'}`);
  if (o.cloud.accepted && o.cloud.randomizer && mine.error) explain(save, 'Cloud reads randomised saves (flags them); hzla and cfru.js refuse them', mine.game);
  if (!o.cloud.accepted && mine.error) explain(save, 'rejected by all', `Cloud: ${o.cloud.reason}; cfru.js: ${mine.error}`);
  if (mine.error) {row.mismatches = all.unexplained.length - before; continue;}

  // party: hzla only (Cloud reads boxes alone); fields in calc order
  const party = mine.party, hp = o.hzla.party;
  if (party.length !== hp.length) miss(save, `party count ${party.length} vs hzla ${hp.length}`);
  party.forEach((m, i) => {const h = hp[i]; if (!h) return; compare(save, `party ${i}`, m, {...h, iv: toCalc(h.iv), ev: toCalc(h.ev)}, 'hzla');});

  // boxes vs Cloud, by box and order within the box (Cloud keeps positions; cfru.js keeps present mons in order)
  const cloudBoxes = Array.from({length: 25}, () => []);
  for (const c of o.cloud.boxes) if (!c.egg) cloudBoxes[c.box].push(c);
  if (mine.boxes.length !== 25) miss(save, `${mine.boxes.length} boxes`);
  mine.boxes.forEach((box, b) => {
    const cb = cloudBoxes[b];
    if (box.length !== cb.length) miss(save, `box ${b + 1}: ${box.length} vs Cloud ${cb.length}`);
    box.forEach((m, i) => {const c = cb[i]; if (!c) return;
      const where = `box ${b + 1} #${i + 1} (slot ${c.slot + 1})`;
      if (m.pid !== c.pid) miss(save, `${where} pid ${m.pid} vs Cloud ${c.pid}`);
      if (m.sp !== c.sp) miss(save, `${where} species id ${m.sp} vs Cloud ${c.sp}`);
      // Cloud's define is after its out-of-battle normalisation: compare it in guide ids with the raw id's page
      if (c.spDefine && cloudSpId[c.spDefine] !== c.sp && G.sp[cloudSpId[c.spDefine]] !== G.sp[m.sp])
        explain(save, 'Cloud and hzla rename in-battle-only forms to the base species; the save holds the form id (GID decides)', `${where} ${cloudSpecies[c.sp]} -> ${c.spDefine} (guide ${G.sp[m.sp]} vs ${G.sp[cloudSpId[c.spDefine]]})`);
      // Cloud's ability slot is raw (hidden bit, else personality bit 0); cfru.js falls back as the game does
      let cloudAbs = c.abs;
      if (cloudAbs !== m.abs && abilityOf(m.sp, m.abs) != null && (abilityOf(m.sp, cloudAbs) == null || abilityOf(m.sp, cloudAbs) < 0)) {
        explain(save, 'Cloud keeps the raw ability slot where the species has no ability in it; cfru.js (and hzla, and the game) fall back', `${where} ${G.sp[m.sp]} Cloud slot ${c.abs} -> ${m.abs}`);
        cloudAbs = m.abs;
      }
      let cloudMv = c.mv;
      if (!same(cloudMv, m.mv)) {
        const known = m.mv.filter(x => x && constants.MOVES_BY_ID[String(x)]);
        const compacted = [...known, 0, 0, 0, 0].slice(0, 4);
        if (same(cloudMv, compacted) || same(cloudMv, [constants.MOVES_BY_ID ? +Object.keys(constants.MOVES_BY_ID).find(k => constants.MOVES_BY_ID[k] === 'MOVE_POUND') : 1, 0, 0, 0]) && !known.length) {
          explain(save, 'Cloud drops move ids outside the game\'s table and closes the gap (Pound if none is left)', `${where} ${JSON.stringify(m.mv)} -> Cloud ${JSON.stringify(cloudMv)}`);
          cloudMv = m.mv;
        }
      }
      let cloudIt = c.it;
      if (cloudIt !== m.it && cloudIt === 0 && !constants.ITEMS_BY_ID[String(m.it)]) {explain(save, 'Cloud drops item ids outside the table', `${where} ${m.it}`); cloudIt = m.it;}
      let cloudNat = c.nat;
      if (!baseStats[cloudSpecies[m.sp]] && (c.nat !== m.nat || cloudAbs !== m.abs)) {
        explain(save, 'Cloud gives nature 0 / slot 0 to a species id with no base stats (no page in the guide either)', `${where} species ${m.sp} (${cloudSpecies[m.sp] || 'no name'}, guide ${G.sp[m.sp]})`);
        cloudNat = m.nat; cloudAbs = m.abs;
      }
      compare(save, where, m, {sp: c.sp, lv: c.lv, nat: cloudNat, abs: cloudAbs, it: cloudIt, mv: cloudMv, iv: toCalc(c.iv), ev: toCalc(c.ev)}, 'Cloud', true);
    });
  });

  // boxes vs hzla: one list in slot order; hzla also skips personality 0 and species ids outside its table
  const flat = mine.boxes.flatMap((box, b) => box.map((m, i) => ({m, where: `box ${b + 1} #${i + 1}`})));
  let k = 0;
  for (const {m, where} of flat) {
    if (!m.pid || !constants.SPECIES_BY_ID[String(m.sp)]) {
      explain(save, m.pid ? 'hzla skips species ids outside its table (Cloud and cfru.js keep them; the page counts them as missing)' : 'hzla skips personality 0 (a valid Pokémon to the game, Cloud and cfru.js)', `${where} species ${m.sp} pid ${m.pid}`);
      continue;
    }
    const h = o.hzla.boxes[k++];
    if (!h) {miss(save, `${where} missing in hzla`); continue;}
    compare(save, where, m, {...h, iv: toCalc(h.iv), ev: toCalc(h.ev)}, 'hzla');
  }
  if (k !== o.hzla.boxes.length) miss(save, `hzla has ${o.hzla.boxes.length - k} more boxed`);
  row.mismatches = all.unexplained.length - before;
  row.explained = Object.values(all.explained).flat().length - beforeExplained;
}

function compare(save, where, m, other, who, rawSpecies) {
  // hzla's species id is after its out-of-battle normalisation; compare in guide ids, explaining the rename
  if (!rawSpecies && other.sp !== m.sp) {
    const a = G.sp[m.sp], b = G.sp[other.sp];
    if (constants.SPECIES_BY_ID[String(m.sp)] && constants.SPECIES_BY_ID[String(other.sp)] && constants.SPECIES_BY_ID[String(m.sp)].includes(constants.SPECIES_BY_ID[String(other.sp)].slice(8)))
      explain(save, 'Cloud and hzla rename in-battle-only forms to the base species; the save holds the form id (GID decides)', `${where} ${who} ${constants.SPECIES_BY_ID[String(m.sp)]} -> ${constants.SPECIES_BY_ID[String(other.sp)]} (guide ${a} vs ${b})`);
    else miss(save, `${where} species ${m.sp} vs ${who} ${other.sp}`);
  }
  // the game's table can list one ability in both slots, where the guide lists it once: cfru.js picks slot 0 (the
  // guide's), hzla slot 1; the same ability either way
  const stats = baseStats[cloudSpecies[m.sp]];
  if (m.abs !== other.abs && stats && stats.ability1 === stats.ability2 && [m.abs, other.abs].every(x => x < 2)) {
    explain(save, "the game lists one ability in both slots, the guide once: same ability, slot 0 in cfru.js", `${where} ${who} ${cloudSpecies[m.sp]} ${stats.ability1}`);
    other = {...other, abs: m.abs};
  }
  for (const f of ['lv', 'nat', 'abs', 'it', 'mv', 'iv', 'ev'])
    if (!same(m[f], other[f])) miss(save, `${where} ${f} ${JSON.stringify(m[f])} vs ${who} ${JSON.stringify(other[f])}`);
}

mkdirSync(tmp, {recursive: true});
writeFileSync(join(tmp, 'compare.json'), JSON.stringify(all, null, 1));
for (const r of all.saves) console.log(`${r.save.padEnd(42)} cloud ${r.cloud.padEnd(10)} hzla ${r.hzla.padEnd(8)} cfru ${r.cfru.padEnd(10)} party ${String(r.party).padStart(1)} boxed ${String(r.boxed).padStart(3)} explained ${String(r.explained).padStart(3)} unexplained ${r.mismatches}`);
for (const [kind, rows] of Object.entries(all.explained)) console.log(`explained (${rows.length}): ${kind}\n  ${rows.slice(0, 4).join('\n  ')}${rows.length > 4 ? '\n  ...' : ''}`);
console.log(`unexplained: ${all.unexplained.length}`); for (const u of all.unexplained.slice(0, 40)) console.log('  ' + u);
// The expected import per save, from the oracles (not from cfru.js): party from hzla, boxes from Cloud by position,
// with the explained rules applied (the game's ability fallback; Cloud's level, nature, moves, item as they are).
function expectedFrom(o) {
  const slot = (sp, pid, raw) => {const s = baseStats[cloudSpecies[sp]]; if (!s) return raw;
    if (raw === 2 && s.hiddenAbility && s.hiddenAbility !== 'ABILITY_NONE') return 2;
    return pid & 1 && s.ability2 && s.ability2 !== 'ABILITY_NONE' && s.ability2 !== s.ability1 ? 1 : 0;};
  const game = m => ({...m, iv: toCalc(m.iv), ev: toCalc(m.ev)});
  const party = o.hzla.party.map(m => named(D, game(m))).filter(Boolean);
  const boxes = Array.from({length: 25}, () => []);
  for (const c of o.cloud.boxes) if (!c.egg) {const m = named(D, game({...c, abs: slot(c.sp, c.pid, c.abs)})); if (m) boxes[c.box].push(m);}
  return {party, boxes};
}
if (process.argv.includes('--write-fixtures')) {
  if (all.unexplained.length) {console.log('not writing fixtures: unexplained mismatches'); process.exit(1);}
  const dir = join(root, 'hacks', hack, '.src', 'saves', 'expected'), written = new Map();
  mkdirSync(dir, {recursive: true});
  for (const r of all.saves) {
    const name = r.save.replace(/\//g, '__').replace(/\.(sav|srm)$/i, '.expected.json'), o = dumps.get(r.save);
    const head = {save: r.save, sha256: r.sha256, oracles: {cloud: r.cloud, hzla: r.hzla}};
    let body;
    if (r.cfru !== 'accepted') body = {error: r.cfru};
    else {
      const e = expectedFrom(o), key = JSON.stringify(e);
      body = written.has(key) ? {same: written.get(key)} : e;
      if (!written.has(key)) written.set(key, name);
    }
    writeFileSync(join(dir, name), fixtureText({...head, ...body}));
  }
  console.log(`wrote ${all.saves.length} fixtures to ${relative(root, dir)}`);
}
process.exit(all.unexplained.length ? 1 : 0);

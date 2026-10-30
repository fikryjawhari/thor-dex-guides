#!/usr/bin/env node
// Generates tools/calc/move-effects.json: the damage calc's move-effect table, built from
// Pokémon Showdown's move data (MIT, https://github.com/smogon/pokemon-showdown) at the pinned commit.
//
//   node move_effects.mjs            write move-effects.json
//   node move_effects.mjs --check    regenerate in memory; exit 1 if the committed file differs
//   node move_effects.mjs --report   per-generation counts and the unmapped status-move list (stdout)
//   node move_effects.mjs --src DIR  Showdown checkout's data/ folder layout (default: see findSource)
//
// Input is read only, never fetched. The Showdown TS files are compiled with esbuild and imported
// through a data: URL; their function-valued properties are inspected (names, source text) and never run.
//
// Showdown mod semantics: data/mods/genN/moves.ts entries with `inherit: true` shallow-merge over the
// newer generation's entry (gen 8 over base, gen 7 over gen 8, ...). Gen N's effective data is base
// with mods 8, 7, ..., N applied in that order. Nested objects (secondary, self, flags) are replaced
// whole. A key set to undefined in a mod (`onHit: undefined, // no inherit`) removes it.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transform } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'move-effects.json');
const SHA = 'ccfaa20f32af363569cd21a9d501b2bc1ded26b1';
const REPO = 'smogon/pokemon-showdown';
const BASE_FILE = 'moves.ts';
const MOD_FILES = { 8: 'moves-gen8.ts', 7: 'moves-gen7.ts', 6: 'moves-gen6.ts', 5: 'moves-gen5.ts', 4: 'moves-gen4.ts' };
const GENS = [4, 5, 6, 7, 8, 9];
const ALL_STATS = ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'];
const FLAG_KEYS = ['powder', 'sound', 'bullet', 'reflectable', 'bypasssub', 'contact'];
// Target values that act on the user (the calc's `s`); every other target is the opposing side (`o`).
const SELF_TARGETS = new Set(['self', 'adjacentAllyOrSelf', 'allies', 'allySide', 'allyTeam']);
const STAT_NAME = { atk: 'atk', def: 'def', spa: 'spa', spd: 'spd', spe: 'spe', accuracy: 'acc', evasion: 'eva' };
// Field-setting keys: the move changes the field, so it gets no record unless it also has stages / status.
const FIELD_KEYS = ['sideCondition', 'pseudoWeather', 'weather', 'terrain', 'slotCondition', 'onHitSide', 'onHitField'];

// Hand-mapped kinds: moves whose effect is a Showdown function. `fn` is the Showdown property that
// carries it (checked to exist in the effective entry; its file is cited in `n`). `top` kinds sit on
// the move's record; `sec` kinds are a guaranteed secondary (c 100) of a damaging move.
const HAND = {
  haze: { k: 'haze', fn: 'onHitField' },
  clearsmog: { sec: 'clear', fn: 'onHit' },
  psychup: { k: 'copy', fn: 'onHit' },
  heartswap: { k: 'swap', stats: ALL_STATS, fn: 'onHit' },
  powerswap: { k: 'swap', stats: ['atk', 'spa'], fn: 'onHit' },
  guardswap: { k: 'swap', stats: ['def', 'spd'], fn: 'onHit' },
  topsyturvy: { k: 'invert', fn: 'onHit' },
  bellydrum: { k: 'maxatk', fn: 'onHit' },
  curse: { k: 'curse', b: { atk: 1, def: 1, spe: -1 }, tg: 's', fn: 'onTryHit' },
  refresh: { k: 'cure', only: ['brn', 'par', 'psn', 'tox'], fn: 'onHit' },
  healbell: { k: 'cure', fn: 'onHit' },
  aromatherapy: { k: 'cure', fn: 'onHit' },
  junglehealing: { k: 'cure', fn: 'onHit' },
  lunarblessing: { k: 'cure', fn: 'onHit' },
  takeheart: { k: 'cure', b: { spa: 1, spd: 1 }, tg: 's', fn: 'onHit' },
  psychoshift: { k: 'shift', fn: 'onTryHit' },
  stockpile: { k: 'stockpile', b: { def: 1, spd: 1 }, tg: 's', fn: 'condition.onStart' },
  growth: { k: 'growth', fn: 'onModifyMove', growth: true },
  venomdrench: { k: 'venom', b: { atk: -1, spa: -1, spe: -1 }, tg: 'o', fn: 'onHit' },
  memento: { k: 'memento', fn: null },
  strengthsap: { k: 'sap', b: { atk: -1 }, tg: 'o', fn: 'onHit' },
  trick: { k: 'trick', fn: 'onHit' },
  switcheroo: { k: 'trick', fn: 'onHit' },
  yawn: { k: 'drowsy', fn: 'onTryHit' },
  // Switches out after (not modelled): only the stage drops are recorded.
  partingshot: { b: { atk: -1, spa: -1 }, tg: 'o', fn: 'onHit' },
  skillswap: { k: 'ability', fn: 'onHit' },
  roleplay: { k: 'ability', fn: 'onHit' },
  worryseed: { k: 'ability', fn: 'onHit' },
  simplebeam: { k: 'ability', fn: 'onHit' },
  entrainment: { k: 'ability', fn: 'onHit' },
  gastroacid: { k: 'ability', fn: 'onTryHit' },
  doodle: { k: 'ability', fn: 'onHit' },
  soak: { k: 'type', fn: 'onHit' },
  forestscurse: { k: 'type', fn: 'onHit' },
  trickortreat: { k: 'type', fn: 'onHit' },
  conversion: { k: 'type', fn: 'onHit' },
  conversion2: { k: 'type', fn: 'onHit' },
  reflecttype: { k: 'type', fn: 'onHit' },
  magicpowder: { k: 'type', fn: 'onHit' },
  burnup: { k: 'type', tg: 's', fn: 'self.onHit' },
  acupressure: { k: 'random', fn: 'onHit' },
  // Damaging moves: guaranteed secondaries.
  knockoff: { sec: 'knock', fn: 'onAfterHit' },
  thief: { sec: 'steal', fn: 'onAfterHit' },
  covet: { sec: 'steal', fn: 'onAfterHit' },
  bugbite: { sec: 'eat', fn: 'onHit' },
  pluck: { sec: 'eat', fn: 'onHit' },
  incinerate: { sec: 'burnitem', fn: 'onHit' },
  coreenforcer: { sec: 'ability', fn: 'onHit' },
  fellstinger: { sec: 'ko3', fn: 'onAfterMoveSecondarySelf', ko3: true },
};

// Corrections to Showdown's data, each with its source line. Showdown's gen 4-7 Rapid Spin still
// carries the gen 9 secondary (Speed +1 on use), which the plan's spec places from Gen VIII on.
const CORRECTIONS = {
  rapidspin: { below: 8, dropSec: true, n: 'Speed +1 from Gen VIII (plan spec); Showdown gen 4-7 data keeps the gen 9 secondary' },
};

function die(msg) {
  process.stderr.write(`move_effects: ${msg}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const o = { check: false, report: false, src: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') o.check = true;
    else if (a === '--report') o.report = true;
    else if (a === '--src') o.src = argv[++i];
    else die(`unknown argument ${a}`);
  }
  return o;
}

// The worktree sits at <main>/.claude/worktrees/<name>, so the main checkout is three levels up; the
// git common dir gives it directly. The worktree's own .tmp is the last resort.
function findSource(override) {
  if (override) return path.resolve(override);
  const root = path.resolve(HERE, '..', '..');
  const candidates = [];
  try {
    const common = execFileSync('git', ['-C', root, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim();
    candidates.push(path.join(path.dirname(common), '.tmp', 'showdown'));
  } catch {
    // no git: fall through to the relative candidates
  }
  candidates.push(path.resolve(root, '..', '..', '..', '.tmp', 'showdown'));
  candidates.push(path.join(root, '.tmp', 'showdown'));
  const hit = candidates.find((c) => existsSync(path.join(c, BASE_FILE)));
  if (!hit && process.argv.includes('--check')) {
    // A clone without the fetched source can still run npm test; the table is checked where the source is.
    console.log('SKIP move_effects --check: no Showdown source in .tmp/showdown (tools/calc/README.md → Move effects)');
    process.exit(0);
  }
  if (!hit) die(`no Showdown data found (looked in: ${candidates.join(', ')}); pass --src`);
  return hit;
}

// The fetched checkout records what it was fetched at in .git/FETCH_HEAD (it has no commits).
function checkPin(src) {
  const fh = path.join(src, '.git', 'FETCH_HEAD');
  if (!existsSync(fh)) {
    process.stderr.write(`move_effects: warning: ${src} has no .git/FETCH_HEAD, the pin ${SHA} is not verified\n`);
    return;
  }
  const shas = readFileSync(fh, 'utf8').split('\n').filter(Boolean).map((l) => l.split(/\s/)[0]);
  if (!shas.includes(SHA)) die(`${src} was fetched at ${shas.join(', ')}, expected the pinned ${SHA}`);
}

// Compile one Showdown TS file and import it through a temp file (data: URLs can't be used for every
// Node build with the esbuild output's relative imports, and a temp file keeps errors readable).
async function loadMoves(src, file, tmpDir) {
  const code = readFileSync(path.join(src, file), 'utf8');
  const { code: js } = await transform(code, { loader: 'ts', format: 'esm' });
  const tmp = path.join(tmpDir, file.replace(/\W/g, '_') + '.mjs');
  writeFileSync(tmp, js);
  const mod = await import(pathToFileURL(tmp).href);
  if (!mod.Moves || typeof mod.Moves !== 'object') die(`${file} exports no Moves table`);
  return mod.Moves;
}

function sortObj(o) {
  const out = {};
  for (const k of Object.keys(o).sort()) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

function boostsOf(b) {
  if (!b) return null;
  const out = {};
  for (const [k, v] of Object.entries(b)) {
    if (!v) continue;
    const s = STAT_NAME[k];
    if (!s) die(`unknown boost stat ${k}`);
    out[s] = v;
  }
  return Object.keys(out).length ? sortObj(out) : null;
}

// Effective entry for one generation: base, then mods 8..gen in order, each by inherit semantics.
function effective(tables, gen, id) {
  const base = tables.base[id];
  if (!base) return null;
  let entry = { ...base };
  let srcOf = Object.fromEntries(Object.keys(base).map((k) => [k, BASE_FILE]));
  for (let g = 8; g >= gen; g--) {
    const m = tables.mods[g][id];
    if (!m) continue;
    const { inherit, ...rest } = m;
    if (inherit === true) {
      entry = { ...entry, ...rest };
      for (const k of Object.keys(rest)) srcOf[k] = MOD_FILES[g];
    } else {
      entry = { ...rest };
      srcOf = Object.fromEntries(Object.keys(rest).map((k) => [k, MOD_FILES[g]]));
    }
    for (const k of Object.keys(entry)) if (entry[k] === undefined) delete entry[k];
  }
  return { entry, srcOf };
}

function isSkipped(entry) {
  return Boolean(entry.isZ || entry.isMax);
}

function fnKeys(entry) {
  return Object.keys(entry).filter((k) => typeof entry[k] === 'function');
}

function fnAt(entry, label) {
  const parts = label.split('.');
  let v = entry;
  for (const p of parts) v = v?.[p];
  return typeof v === 'function' ? v : null;
}

// Record from the declarative fields (stages, status, volatile, self stages, secondaries, immunity, flags).
function declarative(entry) {
  const r = {};
  const isStatus = entry.category === 'Status';
  if (isStatus) {
    const b = boostsOf(entry.boosts);
    if (b) r.b = b;
    if (entry.status) r.st = entry.status;
    if (entry.volatileStatus) r.v = entry.volatileStatus;
    if (entry.ignoreImmunity === false) r.ti = 1;
  }
  const sb = boostsOf(entry.self?.boosts) ?? boostsOf(entry.selfBoost?.boosts);
  if (sb) r.sb = sb;
  const secs = [];
  const list = [entry.secondary, ...(Array.isArray(entry.secondaries) ? entry.secondaries : [entry.secondaries])].filter(Boolean);
  for (const s of list) {
    const it = { c: s.chance ?? 100 };
    const b = boostsOf(s.boosts);
    if (b) it.b = b;
    if (s.status) it.st = s.status;
    if (s.volatileStatus) it.v = s.volatileStatus;
    const ssb = boostsOf(s.self?.boosts);
    if (ssb) it.sb = ssb;
    if (Object.keys(it).length === 1) {
      // Only an onHit / other function: the calc can't model it; listed in the report.
      if (typeof s.onHit === 'function' || fnKeys(s).length) it.k = 'fn';
      else continue;
    }
    secs.push(it);
  }
  if (secs.length) r.sec = secs;
  return r;
}

function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) if (v[k] !== undefined) o[k] = canon(v[k]);
    return o;
  }
  return v;
}

function isEmpty(r) {
  return Object.keys(r).length === 0;
}

// Full record for one move in one generation (before deltas).
function recordFor(tables, gen, id) {
  const eff = effective(tables, gen, id);
  if (!eff) return {};
  const { entry, srcOf } = eff;
  if (isSkipped(entry)) return {};
  const r = declarative(entry);
  const tgOf = (e) => (SELF_TARGETS.has(e.target) ? 's' : 'o');
  let tgOverride = null;
  const hand = HAND[id];
  const notes = [];
  if (hand) {
    const label = hand.fn === null ? 'boosts' : hand.fn;
    let fnFile = BASE_FILE;
    // Gen 4 Growth sets onModifyMove to undefined (no sun doubling in gen 4): only gen 5+ has it.
    if (hand.fn && !(hand.growth && gen < 5)) {
      const fn = fnAt(entry, label);
      if (!fn) die(`${id}: hand kind expects ${label} in the effective entry`);
      fnFile = srcOf[label.split('.')[0]] || BASE_FILE;
    }
    const isSec = Boolean(hand.sec);
    const cite = `Showdown ${fnFile} ${id} ${label}`;
    if (hand.ko3) {
      // Fell Stinger: the Atk stages the on-KO boost gives, read from that generation's source. Gen 6+ only.
      if (gen < 6) return {};
      const fn = fnAt(entry, label);
      const m = fn.toString().match(/boost\(\s*\{\s*atk:\s*(\d+)/);
      if (!m) die(`${id}: no Atk boost in ${label} (gen ${gen})`);
      const sec = { c: 100, k: 'ko3', by: Number(m[1]) };
      r.sec = [...(r.sec || []), sec];
      notes.push(cite);
    } else if (isSec) {
      r.sec = [...(r.sec || []), { c: 100, k: hand.sec }];
      notes.push(cite);
    } else {
      r.k = hand.k;
      if (hand.stats) r.stats = hand.stats;
      if (hand.only) r.only = hand.only;
      if (hand.b) r.b = { ...(r.b || {}), ...hand.b };
      if (hand.growth) {
        // Gen 4: Sp. Atk +1 only; Gen 5+: Atk and Sp. Atk +1, doubled in sun (source onModifyMove).
        r.b = gen >= 5 ? { atk: 1, spa: 1 } : { spa: 1 };
        if (gen >= 5) r.sun = 2;
      }
      if (hand.tg) tgOverride = hand.tg;
      notes.push(cite);
    }
  }
  // Curse's Ghost branch and other gen-specific hand records take their target from the table.
  const correction = CORRECTIONS[id];
  if (correction && gen < correction.below) {
    if (correction.dropSec) delete r.sec;
    notes.push(correction.n);
  }
  if (!r.sec?.length) delete r.sec;
  if (r.b || r.st || r.v || r.k) r.tg = tgOverride || tgOf(entry);
  if (r.sec) {
    // Sec items carry their own target logic; nothing to add.
  }
  const flags = entry.flags || {};
  const fl = FLAG_KEYS.filter((f) => flags[f]);
  if (fl.length && Object.keys(r).some((k) => k !== 'fl')) r.fl = fl;
  // A note alone is not an effect: the record is empty without the other keys.
  if (isEmpty(r)) return {};
  if (notes.length) r.n = notes.join('; ');
  return canon(r);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const src = findSource(opts.src);
  checkPin(src);
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'move-effects-'));
  try {
    const tables = { base: await loadMoves(src, BASE_FILE, tmpDir), mods: {} };
    for (const g of [8, 7, 6, 5, 4]) tables.mods[g] = await loadMoves(src, MOD_FILES[g], tmpDir);
    const ids = new Set([...Object.keys(tables.base)]);
    for (const g of [8, 7, 6, 5, 4]) for (const id of Object.keys(tables.mods[g])) if (!tables.base[id]) die(`mod ${MOD_FILES[g]} has ${id} not in base`);

    // Names are the output keys: Showdown's display name. Each record is per gen; then deltas.
    const byName = new Map();
      for (const id of [...ids].sort()) {
      const base = tables.base[id];
      if (!base || isSkipped(base)) continue;
      const name = base.name;
      if (byName.has(name)) die(`duplicate move name ${name}`);
      const recs = {};
      for (const g of GENS) recs[g] = recordFor(tables, g, id);
      byName.set(name, { id, category: base.category, recs, entry: base });
    }

    if (opts.report) return report(byName);

    const moves = {};
    for (const name of [...byName.keys()].sort()) {
      const { recs } = byName.get(name);
      const list = [];
      let prev = null;
      for (const g of GENS) {
        const r = recs[g] ?? {};
        const key = JSON.stringify(r);
        if (key !== prev) {
          list.push([g, r]);
          prev = key;
        }
      }
      // Drop a leading run of empty records: a move with no record in any gen is omitted.
      while (list.length && isEmpty(list[0][1])) list.shift();
      if (!list.length) continue;
      moves[name] = list;
    }

    const sourceFiles = [BASE_FILE, ...Object.values(MOD_FILES).reverse()];
    const doc = {
      source: { repo: REPO, sha: SHA, license: 'MIT', files: sourceFiles },
      moves,
    };
    const text = render(doc);
    if (opts.check) {
      const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
      if (have !== text) {
        process.stderr.write(`move_effects: ${OUT} is stale; run: node tools/calc/move_effects.mjs\n`);
        process.exit(1);
      }
      process.stdout.write(`move_effects: ${OUT} is current (${Object.keys(moves).length} moves)\n`);
      return;
    }
    writeFileSync(OUT, text);
    process.stdout.write(`wrote ${OUT} (${Object.keys(moves).length} moves)\n`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// One move per line; keys sorted; records as compact JSON.
function render(doc) {
  const lines = ['{'];
  lines.push(`  "source": ${JSON.stringify(doc.source)},`);
  lines.push('  "moves": {');
  const names = Object.keys(doc.moves);
  names.forEach((name, i) => {
    const comma = i < names.length - 1 ? ',' : '';
    lines.push(`    ${JSON.stringify(name)}: ${JSON.stringify(doc.moves[name])}${comma}`);
  });
  lines.push('  }');
  lines.push('}');
  return lines.join('\n') + '\n';
}

function report(byName) {
  const out = [];
  const counts = {};
  for (const g of GENS) counts[g] = { any: 0, status: 0, dmgCertain: 0 };
  const fnMoves = [];
  const unmapped = { field: [], useless: [], function: [] };
  for (const [name, { category, recs, entry }] of byName) {
    for (const g of GENS) {
      const r = recs[g];
      if (!r || isEmpty(r)) continue;
      counts[g].any++;
      if (category === 'Status') counts[g].status++;
      const certain = (r.sec || []).some((s) => s.c === 100) || r.sb;
      if (category !== 'Status' && certain) counts[g].dmgCertain++;
      if ((r.sec || []).some((s) => s.k === 'fn')) fnMoves.push(`${name} gen${g}`);
    }
    if (category !== 'Status') continue;
    const empty = GENS.every((g) => !recs[g] || isEmpty(recs[g]));
    if (!empty) continue;
    if (FIELD_KEYS.some((k) => entry[k] !== undefined)) unmapped.field.push(name);
    else if (fnKeys(entry).length) unmapped.function.push(`${name} (${fnKeys(entry).join(',')})`);
    else unmapped.useless.push(name);
  }
  out.push('Records per generation (moves with any non-empty record):');
  for (const g of GENS) out.push(`  gen ${g}: any ${counts[g].any}, status-move records ${counts[g].status}, damaging with a 100% secondary or sb ${counts[g].dmgCertain}`);
  out.push('');
  out.push(`Function-only secondaries (k fn, not modelled): ${fnMoves.length ? fnMoves.join('; ') : 'none'}`);
  out.push('');
  out.push(`Status moves with no record (${unmapped.field.length + unmapped.useless.length + unmapped.function.length}):`);
  out.push(`  field-setters (no record by design, ${unmapped.field.length}): ${unmapped.field.sort().join(', ')}`);
  out.push(`  no effect fields at all (${unmapped.useless.length}): ${unmapped.useless.sort().join(', ')}`);
  out.push(`  function effects not mapped (${unmapped.function.length}):`);
  for (const f of unmapped.function.sort()) out.push(`    ${f}`);
  process.stdout.write(out.join('\n') + '\n');
}

main().catch((e) => die(e.stack || String(e)));

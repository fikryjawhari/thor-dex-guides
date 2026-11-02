// Synthetic Radical Red 4.1 saves for the CFRU reader (no real RR save exists yet: plans/radical-red.md D7, in git history). The
// encoder writes the format as RadicalHex (jajaa17/RadicalHex 3697412, src/core.js) and PKForge (sofianeelhor/PKForge
// 2df0443, RadicalRedFormat.cs) document it from real RR saves: the retail signature 0x08012025, CFRU's checksum
// windows, the game's slot rotation (newest slot = counter % 2, sector id k at slot position (k + counter) % 14), the
// party in SaveBlock1, 25 boxes (stream 1-19, sectors 30 / 31 20-22, SaveBlock1 tail 23-24, SaveBlock2 25), flags from
// 0x900 in the section tails (0x940-0x942: species / learnset / ability randomisers, hzla's 0xF2C bits 0-2).
// Names -> game ids through hzla's save constants (not our GID), so the fixtures check GID too. The expected imports
// are the specs below in the guide's names, written by hand, never from the reader.
//
//   node tools/calc/cfru_rr.mjs --write    writes tools/calc/cfru_rr/<name>.sav and <name>.expected.json
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureText, NATURES} from './cfru_lib.mjs';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const dir = join(root, 'tools', 'calc', 'cfru_rr');
export const HZLA = join(root, 'hacks', 'radical-red', '.src', 'repos', 'Dynamic-Calc-Decomps', 'js', 'savereaders');
const SECTOR = 0x1000, SLOT = 14, BOX = 58, PARTY = 100, STRIDE = 30 * BOX;
const CFRU = [0xF24, 0xFF0, 0xFF0, 0xFF0, 0xD98, 0xFF0, 0xFF0, 0xFF0, 0xFF0, 0xFF0, 0xFF0, 0xFF0, 0xFF0, 0x450];
const VANILLA = [0xF2C, 0xF80, 0xF80, 0xF80, 0xF08, 0xF80, 0xF80, 0xF80, 0xF80, 0xF80, 0xF80, 0xF80, 0xF80, 0x7D0];
const STATS = [0, 1, 2, 4, 5, 3];      // calc order HP Atk Def SpA SpD Spe -> the game's HP Atk Def Spe SpA SpD slot

// A Pokémon: sp (hzla's species name, or id for a form hzla names by its species), name (the guide's), level, exp
// (boxes: an exact value from the growth table, the level written by hand), nature, ability (by name: its slot from
// hzla's abilitiesBySpecies [1, 2, hidden]), item (hzla's name; shown as the guide's), moves (hzla's names), ivs, evs.
const IV = [31, 31, 31, 31, 31, 31], EV0 = [0, 0, 0, 0, 0, 0];
const mon = (o) => ({ivs: IV, evs: EV0, item: '', moves: [], ...o});
const PARTY_MAIN = [
  mon({sp: 'Venusaur', name: 'Venusaur', level: 52, exp: 140608, nature: 'Modest', ability: 'Chlorophyll', item: 'Leftovers',
    moves: ['Giga Drain', 'Sludge Bomb', 'Earth Power', 'Synthesis'], ivs: [31, 0, 30, 31, 29, 28], evs: [252, 0, 4, 252, 0, 0]}),
  // hzla's by-name table has only the male's abilities (and Cursed Body where data.js and hzla's id table have Damp)
  mon({sp: 705, name: 'Jellicent (Female)', level: 40, exp: 64000, nature: 'Calm', ability: 'Damp', slot: 1, item: 'Sitrus Berry',
    moves: ['Scald', 'Hex', 'Recover', 'Will-O-Wisp'], ivs: [20, 21, 22, 23, 24, 25], evs: [6, 0, 252, 0, 252, 0]}),
  mon({sp: 'Kabutops', name: 'Kabutops', level: 100, exp: 1000000, nature: 'Adamant', ability: 'Swift Swim', item: 'Life Orb',
    moves: ['Leech Life', 'Liquidation', 'Stone Edge', 'Draining Kiss'], evs: [0, 252, 0, 0, 4, 252]}),
];
// boxes[b] = [[slot, mon]]; slots chosen to cross the stream's sector ends and the raw region's sector 30 / 31 seam
const BOXES_MAIN = {
  0: [[0, mon({sp: 'Caterpie', name: 'Caterpie', level: 37, exp: 50653, nature: 'Hardy', ability: 'Shield Dust', moves: ['Tackle', 'String Shot']})],
      [1, mon({sp: 'Caterpie', name: 'Caterpie', level: 50, exp: 125999, nature: 'Jolly', ability: 'Run Away', moves: ['Bug Bite']})]],
  // box 3 slot 11 (stream bytes 4 + 70 * 58 = 0xFE0 to 0x101A) sits across stream sectors 5 / 6
  2: [[10, mon({sp: 'Volbeat', name: 'Volbeat', level: 80, exp: 378880, nature: 'Bold', ability: 'Prankster', item: 'Damp Rock',
    moves: ['Rain Dance', 'Encore', 'Thunder Wave', 'U-turn'], ivs: [31, 0, 31, 31, 31, 31], evs: [252, 0, 252, 0, 4, 0]})]],
  4: [[29, mon({sp: 'Seviper', name: 'Seviper', level: 37, exp: 50653, nature: 'Naive', ability: 'Shed Skin', moves: ['Glare', 'Poison Jab']})]],
  // box 19 is the last stream box (sector 13), box 20 the first in sectors 30 / 31 (slot 22 crosses into sector 31)
  18: [[29, mon({sp: 413, name: 'Unown (B)', level: 15, exp: 3375, nature: 'Serious', ability: 'Levitate', moves: ['Hidden Power']})]],
  19: [[0, mon({sp: 'Bulbasaur', name: 'Bulbasaur', level: 15, exp: 2035, nature: 'Lax', ability: 'Overgrow', moves: ['Vine Whip']})],
       [21, mon({sp: 'Clefairy', name: 'Clefairy', level: 50, exp: 100000, nature: 'Calm', ability: 'Magic Guard', item: 'Eviolite',
         moves: ['Moonblast', 'Soft-Boiled', 'Stealth Rock', 'Thunder Wave']})]],
  21: [[29, mon({sp: 'Growlithe', name: 'Growlithe', level: 50, exp: 156250, nature: 'Adamant', ability: 'Intimidate', moves: ['Flare Blitz']})]],
  // box 23 (SaveBlock1 at 0x1F08: sector 2 then 3; slot 4 crosses), 24, and 25 (SaveBlock2 at 0xB0)
  22: [[3, mon({sp: 'Garchomp', name: 'Garchomp', level: 100, exp: 1250000, nature: 'Jolly', ability: 'Rough Skin', item: 'Choice Scarf',
    moves: ['Earthquake', 'Outrage', 'Stone Edge', 'Fire Fang']})]],
  23: [[29, mon({sp: 737, slotsOf: 'Darmanitan', name: 'Darmanitan', level: 50, exp: 117360, nature: 'Brave', ability: 'Sheer Force', moves: ['Flare Blitz']})]],
  24: [[0, mon({sp: 'Eevee', name: 'Eevee', level: 5, exp: 125, nature: 'Docile', ability: 'Adaptability', moves: ['Tackle', 'Growl']})],
       [29, mon({sp: 'Shuckle', name: 'Shuckle', level: 100, exp: 1059860, nature: 'Impish', ability: 'Contrary', item: 'Mental Herb',
         moves: ['Sticky Web', 'Stealth Rock', 'Encore', 'Infestation']})]],
};
// Not imported: an egg, a Bad Egg, and an empty slot with leftover bytes
const SKIPPED = {1: [[0, {egg: true, sp: 'Pichu'}], [1, {bad: true, sp: 'Pichu'}]]};

export const SAVES = [
  {name: 'main', party: PARTY_MAIN, boxes: BOXES_MAIN},
  {name: 'species-randomiser', party: PARTY_MAIN.slice(0, 1), boxes: {}, flags: [0x940, 0x941]},
  {name: 'ability-randomiser', party: PARTY_MAIN.slice(0, 1), boxes: {}, flags: [0x942], error: 'wrong'},
  {name: 'vanilla-firered', party: PARTY_MAIN.slice(0, 1), boxes: {}, windows: VANILLA, error: 'wrong'},
  {name: 'unbound-signature', party: PARTY_MAIN.slice(0, 1), boxes: {}, signature: 0x01121999, error: 'wrong'},
  {name: 'boxes-only', party: [], boxes: {0: BOXES_MAIN[0]}, footer: true},
  {name: 'empty', party: [], boxes: {}, error: 'empty'},
];

const hz = name => createRequire(import.meta.url)(join(HZLA, 'save_constants', name));
export function tables() {
  const C = hz('radical_red_constants.js'), I = hz('radical_red_item_constants.js');
  const index = list => {const m = new Map(); list.forEach((n, i) => {if (n && !m.has(n)) m.set(n, i);}); return m;};
  return {C, species: index(C.mons), moves: index(C.moves), items: index(I.items)};
}

function encode(T, m, party, pidSeed) {
  const b = new Uint8Array(party ? PARTY : BOX), v = new DataView(b.buffer), id = typeof m.sp === 'number' ? m.sp : T.species.get(m.sp);
  if (id == null) throw new Error('no hzla species ' + m.sp);
  const name = m.slotsOf || T.C.mons[id], slots = T.C.abilitiesBySpecies[name] || [];
  const nat = NATURES.indexOf(m.nature ?? 'Hardy'), hidden = m.slot != null ? m.slot === 2 : m.ability != null && slots[2] === m.ability && slots[0] !== m.ability;
  const bit = m.slot != null ? m.slot & 1 : !hidden && m.ability != null && slots[1] === m.ability && slots[0] !== m.ability ? 1 : 0;
  if (m.slot == null && m.ability != null && !hidden && slots[bit] !== m.ability) throw new Error(`${name}: no ability ${m.ability} (${slots})`);
  let pid = (pidSeed * 2654435761 >>> 0) - ((pidSeed * 2654435761 >>> 0) % 50) + nat;   // % 25 = nature
  if ((pid & 1) !== bit) pid = (pid + 25) >>> 0;
  const moves = m.moves.map(n => {const x = T.moves.get(n); if (x == null) throw new Error('no hzla move ' + n); return x;});
  while (moves.length < 4) moves.push(0);
  const item = m.item ? T.items.get(m.item) : 0;
  if (item == null) throw new Error('no hzla item ' + m.item);
  let ivs = 0; STATS.forEach((slot, i) => {ivs += (m.ivs[i] & 31) * 2 ** (5 * slot);});
  ivs += (m.egg ? 2 ** 30 : 0) + (hidden ? 2 ** 31 : 0);
  v.setUint32(0, pid, true); v.setUint32(4, 0x1234ABCD, true);
  b.set([0xC7, 0xBB, 0xC8, 0xC9, 0xBF, 0xFF], 8);            // a nickname, so the slot has bytes besides the species
  b[18] = 2;                                                 // English
  if (party) {
    b[19] = (m.bad ? 1 : 0) | 2 | (m.egg ? 4 : 0);
    v.setUint16(0x20, id, true); v.setUint16(0x22, item, true); v.setUint32(0x24, m.exp ?? 0, true);
    moves.forEach((x, i) => v.setUint16(0x2C + 2 * i, x, true));
    STATS.forEach((slot, i) => {b[0x38 + slot] = m.evs[i];});
    v.setUint32(0x48, ivs >>> 0, true); b[0x54] = m.level;
  } else {
    b[19] = (m.bad ? 1 : 0) | 2 | (m.egg ? 4 : 0);
    v.setUint16(28, id, true); v.setUint16(30, item, true); v.setUint32(32, m.exp ?? 0, true);
    const packed = moves.reduce((s, x, i) => s + x * 2 ** (10 * i), 0);
    v.setUint32(39, packed % 2 ** 32, true); b[43] = Math.floor(packed / 2 ** 32);
    STATS.forEach((slot, i) => {b[44 + slot] = m.evs[i];});
    v.setUint32(54, ivs >>> 0, true);
  }
  return b;
}

function checksum(bytes, at, size) {
  let sum = 0; const v = new DataView(bytes.buffer, bytes.byteOffset);
  for (let i = 0; i < size; i += 4) sum = (sum + v.getUint32(at + i, true)) >>> 0;
  return ((sum >>> 16) + sum) & 0xFFFF;
}

// One slot's 14 sections (data only) for a party and boxes
function sections(T, spec) {
  const s = Array.from({length: SLOT}, () => new Uint8Array(0xFF0)), raw = new Uint8Array(3 * STRIDE), ext = new Uint8Array(3 * STRIDE);
  const stream = new Uint8Array(8 * 0xFF0 + 0x450);
  s[1][0x34] = spec.party.length;
  spec.party.forEach((m, i) => s[1].set(encode(T, m, true, i + 1), 0x38 + PARTY * i));
  const put = (b, slot, bytes) => {
    if (b < 19) stream.set(bytes, 4 + (b * 30 + slot) * BOX);
    else if (b < 22) raw.set(bytes, (b - 19) * STRIDE + slot * BOX);
    else ext.set(bytes, (b - 22) * STRIDE + slot * BOX);
  };
  let seed = 100;
  for (const [b, list] of Object.entries(spec.boxes)) for (const [slot, m] of list) put(+b, slot, encode(T, m, false, seed++));
  if (spec.name === 'main') for (const [b, list] of Object.entries(SKIPPED)) for (const [slot, m] of list) put(+b, slot, encode(T, mon({...m, level: 5, exp: 125}), false, seed++));
  let at = 0;
  for (let id = 5; id <= 13; id++) {s[id].set(stream.subarray(at, at + CFRU[id])); at += CFRU[id];}
  // boxes 23-24: SaveBlock1 from 0x1F08 (section 2 at 0xF18, then 3); box 25: SaveBlock2 at 0xB0
  s[2].set(ext.subarray(0, 0xFF0 - 0xF18), 0xF18); s[3].set(ext.subarray(0xFF0 - 0xF18, 2 * STRIDE));
  s[0].set(ext.subarray(2 * STRIDE), 0xB0);
  if (spec.windows === VANILLA) {           // a retail save's data past CFRU's windows: storage's box names, SaveBlock1's end
    s[13].fill(0xBB, 0x450, 0x7D0); s[4].fill(0x11, 0xD98, 0xF08); s[0].fill(0x22, 0xF24, 0xF2C);
  }
  for (const f of spec.flags || []) {const i = f - 0x900, byte = i >> 3; s[byte < 0xCC ? 0 : 4][(byte < 0xCC ? 0xF24 + byte : 0xD98 + byte - 0xCC)] |= 1 << (i & 7);}
  return {s, raw};
}

export function build(T, spec) {
  const file = new Uint8Array(0x20000 + (spec.footer ? 16 : 0)).fill(0);
  if (spec.error === 'empty') {file.fill(0xFF, 0, 0x20000); return file;}
  const windows = spec.windows || CFRU, signature = spec.signature ?? 0x08012025;
  // the newest save (counter 0x51) and the one before it, with a different party, in the other slot
  const older = {...spec, party: [mon({sp: 'Rattata', name: 'Rattata', level: 3, exp: 27, nature: 'Hasty', ability: 'Run Away', moves: ['Tackle']})], boxes: {}};
  for (const [counter, which] of [[0x50, older], [0x51, spec]]) {
    const {s, raw} = sections(T, which), base = (counter % 2) * SLOT * SECTOR;
    for (let id = 0; id < SLOT; id++) {
      const o = base + ((id + counter) % SLOT) * SECTOR, v = new DataView(file.buffer);
      file.set(s[id], o);
      v.setUint16(o + 0xFF4, id, true); v.setUint32(o + 0xFF8, signature, true); v.setUint32(o + 0xFFC, counter, true);
      v.setUint16(o + 0xFF6, checksum(file, o, windows[id]), true);
    }
    if (which === spec) {file.set(raw.subarray(0, 0xFF0 - 0xB0C), 0x1E000 + 0xB0C); file.set(raw.subarray(0xFF0 - 0xB0C), 0x1F000);}
  }
  return file;
}

export function expected(spec, bytes) {
  const out = {save: spec.name + '.sav', sha256: createHash('sha256').update(bytes).digest('hex')};
  if (spec.error) return {...out, error: spec.error};
  const named = m => ({species: m.name, level: m.level, nature: m.nature, ability: m.ability, item: m.itemName ?? m.item,
    moves: [...m.moves, '', '', '', ''].slice(0, 4), ivs: m.ivs, evs: m.evs});
  const boxes = Array.from({length: 25}, (_, b) => (spec.boxes[b] || []).slice().sort((x, y) => x[0] - y[0]).map(([, m]) => named(m)));
  return {...out, party: spec.party.map(named), boxes};
}

if (process.argv[2] === '--write') {
  if (!existsSync(HZLA)) {console.log('cfru_rr: needs hzla in hacks/radical-red/.src (SOURCES.md)'); process.exit(1);}
  const T = tables();
  mkdirSync(dir, {recursive: true});
  for (const spec of SAVES) {
    const bytes = build(T, spec);
    writeFileSync(join(dir, spec.name + '.sav'), bytes);
    writeFileSync(join(dir, spec.name + '.expected.json'), fixtureText(expected(spec, bytes)));
  }
  console.log(`cfru_rr: ${SAVES.length} saves written to ${dir.slice(root.length + 1)}`);
}

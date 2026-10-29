// Shared by cfru_compare.mjs and cfru_check.mjs: the guide's reader in a fake window, the guide's data as the page
// sees it (data.json with hack.json's cfg), and a reader result in the guide's names (the expected.json format of
// tools/calc_save_check.mjs: tools/README.md → Calc checks and the save check).
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';

export function loadReader(root) {
  const window = {};
  vm.runInNewContext(readFileSync(join(root, 'template', 'calc', 'readers', 'cfru.js'), 'utf8'), {window});
  const reader = window.READERS.cfru;          // results as plain objects: the vm context has its own Array
  return (bytes, data) => JSON.parse(JSON.stringify(reader(bytes, data)));
}

export function guideData(root, hack) {
  const data = JSON.parse(readFileSync(join(root, 'hacks', hack, 'data.json'), 'utf8'));
  data.cfg = JSON.parse(readFileSync(join(root, 'hacks', hack, 'hack.json'), 'utf8')).cfg;
  return data;
}

export const NATURES = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy',
  'Careful', 'Quirky'];

// A mon in game ids (reader or oracle, IVs / EVs in calc order, abs already the game's fallback) -> guide names, or
// null when the species has no page (the page skips it and counts it).
export function named(D, m) {
  const G = D.GID, species = D.P.find(p => p.id === G.sp[m.sp]);
  if (!species) return null;
  const ability = m.abs === 2 ? species.ha : species.a[m.abs];
  return {species: species.n, level: m.lv, nature: NATURES[m.nat], ability: ability >= 0 && D.AB[ability] ? D.AB[ability][0] : '',
    item: G.it[m.it] || '', moves: m.mv.map(x => Number.isInteger(G.mv[x]) ? D.M[G.mv[x]] : ''), ivs: m.iv, evs: m.ev};
}

// A fixture as JSON with one Pokémon per line (diffs stay readable).
export function fixtureText(f) {
  const mon = m => '  ' + JSON.stringify(m);
  const lines = Object.entries(f).map(([k, v]) => k === 'party' ? `"party": [\n${v.map(m => ' ' + mon(m)).join(',\n')}\n ]`
    : k === 'boxes' ? `"boxes": [\n${v.map(b => b.length ? '  [\n' + b.map(m => ' ' + mon(m)).join(',\n') + '\n  ]' : '  []').join(',\n')}\n ]`
    : `${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return '{\n ' + lines.join(',\n ') + '\n}\n';
}

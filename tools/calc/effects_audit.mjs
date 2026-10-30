// Move effects audit (tools/calc/README.md → Move effects): every move of a guide with the record the engine resolves
// for its profile (Showdown table + hacks/<hack>/calc_effects.json), next to the guide's own description and change
// notes, to find where the hack differs. Usage: node tools/calc/effects_audit.mjs <hack> [--changed] [--json]
//   --changed  only moves whose data carries change notes (MV.h) or a doc paragraph (MV.e)
import {readFile} from 'node:fs/promises';
import {createEngine, resolveProfile} from './run.mjs';

const [hack, ...flags] = process.argv.slice(2);
if (!hack) throw new Error('Usage: node tools/calc/effects_audit.mjs <hack> [--changed] [--json]');
const root = new URL('../../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await load(`hacks/${hack}/data.json`);
const config = (await load(`hacks/${hack}/hack.json`)).cfg.calc;
let own = {};
try { own = await load(`hacks/${hack}/calc_effects.json`); } catch { /* none yet */ }
const profile = await resolveProfile({...config, over: {...config.over, effects: own}});
const engine = await createEngine(data, profile);
const rows = data.M.map((name, index) => {
  const mv = data.MV[index] || {};
  return {move: name, c: mv.c, gen: profile.gen, record: engine.effects(name) ? JSON.parse(JSON.stringify(engine.effects(name))) : null,
    d: mv.d || '', h: mv.h || [], e: mv.e || '', x: mv.x || 0};
}).filter(row => !flags.includes('--changed') || row.h.length || row.e);
if (flags.includes('--json')) console.log(JSON.stringify(rows, null, 1));
else for (const row of rows) {
  console.log([row.move, row.c, row.record ? JSON.stringify(row.record) : '-', row.d, row.h.join(' | '), row.x ? 'original' : ''].join('\t'));
}

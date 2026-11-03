// Dev check (not in npm test): calc_matchups.json through our engine and the AI port of calcDamage.c; prints the
// matchups whose 16 rolls differ. Classify each: the adapter below, or a real formula gap (notes.md -> Damage calc / AI).
import {readFile} from 'node:fs/promises';
import {createEngine} from './run.mjs';
import {BattleAI_CalcDamage} from '../../template/calc/ai/hardlove/damage.mjs';
const load = async p => JSON.parse(await readFile(new URL('../../' + p, import.meta.url), 'utf8'));
const data = await load('hacks/hardlove-gold/data.json');
const cfg = (await load('hacks/hardlove-gold/hack.json')).cfg.calc;
const {matchups} = await load('hacks/hardlove-gold/calc_matchups.json');
const engine = await createEngine(data, cfg);
const stageNames = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];
const status = {brn: 'brn', par: 'par', psn: 'psn', tox: 'tox', slp: 'slp', frz: 'frz'};
function mon(set) {
  const entry = data.P.find(p => p.id === set.id);
  const [hp, atk, def, spa, spd, spe] = engine.stats(set);
  const stg = set.stg || [];
  return {species: entry.n, level: set.lv, types: [...entry.t], ability: data.AB[set.ab]?.[0] || '', item: set.it || '', status: status[set.st] || '',
    attack: atk, defense: def, spAttack: spa, spDefense: spd, speed: spe, totalHP: hp, currentHP: set.hp ?? hp,
    statBoosts: Object.fromEntries(stageNames.map((n, i) => [n, stg[i + 1] ?? 0])), facts: {}, moves: []};
}
const rows = [];
for (const m of matchups) {
  const e = data.MV[m.slot.mv];
  const move = {name: data.M[m.slot.mv], type: m.slot.t || e.t, category: e.c, power: m.slot.bp ?? e.bp, effect: 'HIT', flags: e.f || [], priority: e.pr || 0, target: e.tg};
  let ours, theirs, err = '';
  try { ours = engine.calc(m.atk, m.def, m.slot, m.field || {}); } catch (x) { err += 'engine:' + x.message; }
  const a = mon(m.atk), d = mon(m.def);
  try { theirs = BattleAI_CalcDamage({attacker: a, defender: d, field: m.field || {}}, move, a, d); } catch (x) { err += ' ai:' + x.message; }
  const eng = ours ? (ours.per ? ours.per.reduce((s, h) => s.map((v, i) => v + h[i])) : ours.rolls.map(v => v * (ours.hits || 1))) : null;
  const ai = theirs?.damageRange;
  const same = eng && ai && eng.join() === ai.join();
  rows.push({name: m.name, move: move.name, field: JSON.stringify(m.field || {}), same, eng: eng && [eng[0], eng[15]], ai: ai && [ai[0], ai[15]], err});
}
console.log('same', rows.filter(r => r.same).length, 'of', rows.length);
for (const r of rows.filter(r => !r.same)) console.log(r.name, '|', r.move, r.field.length > 2 ? r.field : '', '| engine', r.eng?.join('-'), '| ai', r.ai?.join('-'), r.err);

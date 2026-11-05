// Dev check (not in npm test): calc_matchups.json through our engine and the AI port of calcDamage.c; prints the
// matchups whose 16 rolls differ. Classify each: the adapter below, or a real formula gap (notes.md -> Damage calc / AI).
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createEngine} from './run.mjs';
import {createRequire} from 'node:module';
import {speciesName, weightNames} from './src/names.js';
import {BattleAI_CalcDamage} from '../../template/calc/ai/hardlove/damage.mjs';
import {BattleAI_AdjustUnusualMoveDamage} from '../../template/calc/ai/hardlove/calc.mjs';
import {BattleAI_CalcEffectiveSpeed} from '../../template/calc/ai/hardlove/speed.mjs';
const load = async p => JSON.parse(await readFile(new URL('../../' + p, import.meta.url), 'utf8'));
const data = await load('hacks/hardlove-gold/data.json');
const cfg = (await load('hacks/hardlove-gold/hack.json')).cfg.calc;
const {matchups} = await load('hacks/hardlove-gold/calc_matchups.json');
const expectedGaps = await load('tools/calc/hardlove_ai_damage_gaps.json');
assert.equal(expectedGaps.sourcePin, 'f715235073f9a6ab91be697e277c6c23d9e7caf4');
assert.equal(new Set(expectedGaps.cases.map(entry => entry.name)).size, expectedGaps.cases.length);
assert.ok(expectedGaps.cases.every(entry => matchups.some(matchup => matchup.name === entry.name)));
const engine = await createEngine(data, cfg);
const {Generations} = createRequire(import.meta.url)('@smogon/calc');
const species = Generations.get(9).species;
const id = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const source = await readFile(new URL('../../hacks/hardlove-gold/.src/repos/hardlove/data/Moves.c', import.meta.url), 'utf8');
const effects = new Map([...source.matchAll(/\[MOVE_(\w+)\] = \{([\s\S]*?)(?=\n    \[MOVE_|\n\};)/g)].map(([, name, body]) => [id(name), body.match(/\.effect = MOVE_EFFECT_(\w+)/)?.[1]]));
const stageNames = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];
const status = {brn: 'brn', par: 'par', psn: 'psn', tox: 'tox', slp: 'slp', frz: 'frz'};
function mon(set, field, prefix) {
  const entry = data.P.find(p => p.id === set.id);
  let [hp, atk, def, spa, spd, spe] = engine.stats(set);
  if (field[prefix + 'PowerTrick']) [atk, def] = [def, atk];
  const stg = set.stg || [];
  const ability = data.AB[set.ab]?.[0] || '';
  return {species: entry.n, level: set.lv, types: [...entry.t], ability, item: ability === 'Klutz' || field.magicRoom || set.embargo ? '' : set.it || '', status: status[set.st] || '',
    attack: atk, defense: def, spAttack: spa, spDefense: spd, speed: spe, totalHP: hp, currentHP: set.hp ?? hp,
    weight: Math.trunc(10 * (cfg.over?.species?.[entry.id]?.weightkg ?? [speciesName(entry.n), ...weightNames(entry.n)].map(name => species.get(id(name))).find(value => value?.weightkg)?.weightkg ?? 1)),
    statBoosts: Object.fromEntries(stageNames.map((n, i) => [n, stg[i + 1] ?? 0])), facts: {canEvolve: !!entry.et?.length, partnerMoveNo: field[prefix + 'HelpingHand'] ? 'Helping Hand' : ''}, moves: []};
}
const rows = [];
for (const m of matchups) {
  const e = data.MV[m.slot.mv];
  const flagNames = {bullet: 'ball', slicing: 'slice'};
  const targets = {allAdjacentFoes: 'ADJACENT_OPPONENTS', allAdjacent: 'ALL_ADJACENT', normal: 'SINGLE_TARGET'};
  const move = {name: data.M[m.slot.mv], type: m.slot.t || e.t, category: e.c, power: m.slot.bp ?? e.bp, effect: effects.get(id(data.M[m.slot.mv])), flags: (e.f || []).map(flag => flagNames[flag] || flag), priority: e.pr || 0, target: targets[e.tg] ?? e.tg};
  if (!move.effect) throw new Error('Missing source effect: ' + move.name);
  let ours, theirs, err = '';
  try { ours = engine.calc(m.atk, m.def, m.slot, m.field || {}); } catch (x) { err += 'engine:' + x.message; }
  const values = m.field || {};
  const field = {...values, reflect: values.defReflect, lightScreen: values.defLightScreen, auroraVeil: values.defAuroraVeil, possibleHits: values.gameType === 'Doubles' ? 2 : 1};
  const a = mon(m.atk, field, 'atk'), d = mon(m.def, field, 'def');
  if (m.slot.crit) a.facts.laserFocusTimer = 1;
  if (values.atkFlowerGift) field.attackerAlly = {ability: 'Flower Gift', hp: 1};
  if (values.defFlowerGift) field.defenderAlly = {ability: 'Flower Gift', hp: 1};
  if (values.atkFlowerGift || values.defFlowerGift) field.isDoubleBattle = true;
  const state = {attacker: a, defender: d, field};
  a.speed = BattleAI_CalcEffectiveSpeed(state, a);
  d.speed = BattleAI_CalcEffectiveSpeed(state, d, 'defender');
  try { theirs = BattleAI_CalcDamage(state, move, a, d); } catch (x) { err += ' ai:' + x.message; }
  const eng = ours ? (ours.per ? ours.per.reduce((s, h) => s.map((v, i) => v + h[i])) : ours.rolls.map(v => v * (ours.hits || 1))) : null;
  const ai = theirs?.damageRange.map(damage => BattleAI_AdjustUnusualMoveDamage(a, d, damage, move.effect, move, theirs.moveEffectiveness));
  const same = eng && ai && eng.join() === ai.join();
  rows.push({name: m.name, move: move.name, field: JSON.stringify(m.field || {}), same, engine: eng, ai, err});
}
const gaps = Object.fromEntries(expectedGaps.cases.map(entry => [entry.name, entry.difference]));
for (const row of rows) {
  row.difference = row.same ? null : gaps[row.name] ?? null;
  row.status = row.err || !row.same && !row.difference ? 'unexplained' : row.same ? 'match' : 'known-difference';
  if (row.same && gaps[row.name]) row.status = 'stale-difference';
  if (row.status === 'known-difference') {
    const expected = expectedGaps.cases.find(entry => entry.name === row.name);
    if (!expected || JSON.stringify([row.engine, row.ai]) !== JSON.stringify([expected.engine, expected.ai])) row.status = 'changed-difference';
  }
}
await mkdir(new URL('../../.tmp/ai-engine/', import.meta.url), {recursive: true});
await writeFile(new URL('../../.tmp/ai-engine/damage-comparison.json', import.meta.url), JSON.stringify({sourcePin: 'f715235073f9a6ab91be697e277c6c23d9e7caf4', rows}, null, 2));
console.log('same', rows.filter(row => row.same).length, 'of', rows.length);
for (const row of rows.filter(row => !row.same)) console.log(row.name, '| engine', row.engine?.[0], row.engine?.[15], '| ai', row.ai?.[0], row.ai?.[15], '|', row.difference ?? row.err ?? 'UNEXPLAINED');
const unexplained = rows.filter(row => !['match', 'known-difference'].includes(row.status));
console.log(`${rows.length} cases: ${rows.filter(row => row.same).length} identical, ${rows.filter(row => row.status === 'known-difference').length} explained, ${unexplained.length} unexplained/stale/changed`);
if (unexplained.length) process.exitCode = 1;

// Battle-state fixtures: runs every hacks/<hack>/calc_states.json through the built engine and checks each `expect`
// ({bp}, {ref: slot overrides or {slot, atk, def, field}}, {rolls: [16]}, {pre: [...]}, {crit: {stage, p, forced}}).
// Usage: node state_check.mjs [hack ...]
import {readdir, readFile} from 'node:fs/promises';
import {createEngine} from './run.mjs';

const root = new URL('../../hacks/', import.meta.url);
// Expectation kinds the engine does not produce yet: counted, not failed.
const PENDING = new Set();
// Results come from the engine's vm context (other-realm arrays), so compare as JSON.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Every hit's rolls (`per`, or `hits` copies of `rolls`).
const hits = result => result.per ?? Array.from({length: result.hits}, () => result.rolls);
const load = async (hack, name) => JSON.parse(await readFile(new URL(`${hack}/${name}.json`, root), 'utf8'));
const hacks = process.argv.slice(2).length ? process.argv.slice(2) : (await Promise.all((await readdir(root))
  .map(async hack => (await readFile(new URL(`${hack}/calc_states.json`, root)).then(() => hack, () => null)))))
  .filter(Boolean);

let failed = 0;
for (const hack of hacks) {
  const data = await load(hack, 'data');
  const engine = await createEngine(data, (await load(hack, 'hack')).cfg.calc);
  const {cases} = await load(hack, 'calc_states');
  const counts = {pass: 0, fail: 0, pending: 0};
  const names = new Set();
  for (const fixture of cases) {
    const kind = Object.keys(fixture.expect)[0];
    const problem = (() => {
      if (names.has(fixture.name)) return 'duplicate name';
      names.add(fixture.name);
      if (!fixture.src) return 'no src';
      if (Object.keys(fixture.expect).length !== 1) return 'expect needs exactly one kind';
      let result;
      try {
        result = engine.calc(fixture.atk, fixture.def, fixture.slot, fixture.field || {});
      } catch (error) {
        return `error ${error.message}`;
      }
      if (!result) return 'null result';
      const want = fixture.expect[kind];
      if (PENDING.has(kind) && result[kind] === undefined) return 'pending';
      if (kind === 'bp') {
        const got = result.bp ?? Number(data.MV[fixture.slot.mv].bp);
        return got === want ? '' : `bp ${got}, want ${want}`;
      }
      if (kind === 'rolls') return same(result.rolls, want) ? '' : `rolls ${result.rolls}, want ${want}`;
      if (kind === 'ref') {
        // Slot overrides, or {slot, atk, def, field}: each merged over the case's own.
        const parts = ['slot', 'atk', 'def', 'field'].some(key => key in want) ? want : {slot: want};
        const twin = engine.calc({...fixture.atk, ...parts.atk}, {...fixture.def, ...parts.def},
          {...fixture.slot, ...parts.slot}, {...fixture.field, ...parts.field});
        if (!twin) return 'twin is null';
        return same(hits(result), hits(twin)) ? '' : `per ${JSON.stringify(hits(result))}, twin ${JSON.stringify(hits(twin))}`;
      }
      if (kind === 'pre') return same(result.pre ?? [], want) ? '' : `pre ${JSON.stringify(result.pre)}, want ${JSON.stringify(want)}`;
      if (kind === 'crit') {
        return same(result[kind], want) ? '' : `${kind} ${JSON.stringify(result[kind])}, want ${JSON.stringify(want)}`;
      }
      return `unknown expect ${kind}`;
    })();
    if (problem === 'pending') counts.pending++;
    else if (problem) {
      counts.fail++;
      console.log(`FAIL ${hack} ${fixture.name}: ${problem}`);
    } else counts.pass++;
  }
  failed += counts.fail;
  console.log(`${hack}: ${counts.pass} pass, ${counts.fail} fail${counts.pending ? `, ${counts.pending} pending` : ''}`);
}
if (failed) process.exit(1);

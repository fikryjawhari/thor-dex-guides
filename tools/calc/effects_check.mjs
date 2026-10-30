// Move effects (plans/calc-move-effects.md, tools/calc/README.md → Move effects): the resolver's blockers and order,
// on Emerald Imperium's data with each base profile, then every guide's own `calc_effects.json` fixtures.
// Run: node tools/calc/effects_check.mjs (part of npm test).
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {createEngine} from './run.mjs';

const root = new URL('../../', import.meta.url);
const load = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await load('hacks/emerald-imperium/data.json');
const engines = {};
const engine = async (base, extra = {}) => {
  const key = base + JSON.stringify(extra);
  engines[key] ||= await createEngine(data, {...await load(`template/calc/profiles/${base}.json`), ...extra});
  return engines[key];
};
const ability = name => {
  const index = data.AB.findIndex(entry => entry[0] === name);
  assert.notEqual(index, -1, `Missing fixture ability ${name}`);
  return index;
};
const mon = (name, extra = {}) => {
  const species = data.P.find(entry => entry.n === name);
  assert.ok(species, `Missing fixture species ${name}`);
  const {ab, ...rest} = extra;
  return {id: species.id, lv: 50, nat: 'Serious', ab: ab ? ability(ab) : -1, it: '', st: '',
    iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], stg: [0, 0, 0, 0, 0, 0], ...rest};
};
const slot = name => {
  const index = data.M.indexOf(name);
  assert.notEqual(index, -1, `Missing fixture move ${name}`);
  return {mv: index};
};
const stg = (...values) => [0, ...values];
let count = 0;
const check = async (title, fn) => {
  try {
    await fn();
    count++;
  } catch (error) {
    error.message = `${title}: ${error.message}`;
    throw error;
  }
};
// A status move from `user` at `target`; returns the effect.
const plain = value => value == null ? value : JSON.parse(JSON.stringify(value));
const use = async (base, user, target, move, field = {}, extra) => plain((await engine(base, extra)).effect(user, target, slot(move), field));
// A damaging move's max roll, then its effects.
const strike = async (base, user, target, move, field = {}, extra) => plain((await engine(base, extra)).hit(user, target, slot(move), field, 'max'));

const pika = mon('Pikachu');
const mew = mon('Blissey');

await check('Swords Dance +2 on the user', async () => {
  const out = await use('expansion', mew, pika, 'Swords Dance');
  assert.deepEqual(out.atk.stg, stg(2, 0, 0, 0, 0));
  assert.equal(out.def.stg, undefined);
  assert.equal(out.label, 'Atk+2');
  assert.equal(out.cls, 'up');
});
await check('Swords Dance at +5 gives +1, at +6 fails', async () => {
  assert.deepEqual((await use('expansion', mon('Blissey', {stg: stg(5, 0, 0, 0, 0)}), pika, 'Swords Dance')).atk.stg, stg(6, 0, 0, 0, 0));
  const capped = await use('expansion', mon('Blissey', {stg: stg(6, 0, 0, 0, 0)}), pika, 'Swords Dance');
  assert.ok(capped.fails, 'fails at +6');
  assert.equal(capped.label, 'Fails');
});
await check('Simple doubles (Gen 5+), Contrary inverts Shell Smash', async () => {
  assert.deepEqual((await use('expansion', mon('Blissey', {ab: 'Simple'}), pika, 'Swords Dance')).atk.stg, stg(4, 0, 0, 0, 0));
  assert.deepEqual((await use('expansion', mon('Blissey', {ab: 'Contrary'}), pika, 'Shell Smash')).atk.stg, stg(-2, 1, -2, 1, -2));
  assert.deepEqual((await use('expansion', mew, pika, 'Shell Smash')).atk.stg, stg(2, -1, 2, -1, 2));
});
await check('Shell Smash + White Herb: the drops restored, the herb used', async () => {
  const out = await use('expansion', mon('Blissey', {it: 'White Herb'}), pika, 'Shell Smash');
  assert.deepEqual(out.atk.stg, stg(2, 0, 2, 0, 2));
  assert.equal(out.atk.used, true);
});
await check('Leer lowers the target; Defiant / Competitive answer (Competitive Gen 6+)', async () => {
  assert.deepEqual((await use('expansion', mew, pika, 'Leer')).def.stg, stg(0, -1, 0, 0, 0));
  assert.deepEqual((await use('expansion', mew, mon('Pikachu', {ab: 'Defiant'}), 'Leer')).def.stg, stg(2, -1, 0, 0, 0));
  assert.deepEqual((await use('expansion', mew, mon('Pikachu', {ab: 'Competitive'}), 'Leer')).def.stg, stg(0, -1, 2, 0, 0));
  assert.deepEqual((await use('gen5', mew, mon('Pikachu', {ab: 'Competitive'}), 'Leer')).def.stg, stg(0, -1, 0, 0, 0));
});
await check('Clear Body / Hyper Cutter / Mold Breaker / Mist / Clear Amulet (Gen 9)', async () => {
  assert.ok((await use('expansion', mew, mon('Pikachu', {ab: 'Clear Body'}), 'Leer')).fails);
  assert.ok((await use('expansion', mew, mon('Pikachu', {ab: 'Hyper Cutter'}), 'Growl')).fails);
  assert.deepEqual((await use('expansion', mew, mon('Pikachu', {ab: 'Hyper Cutter'}), 'Leer')).def.stg, stg(0, -1, 0, 0, 0));
  assert.deepEqual((await use('expansion', mon('Blissey', {ab: 'Mold Breaker'}), mon('Pikachu', {ab: 'Clear Body'}), 'Leer')).def.stg, stg(0, -1, 0, 0, 0));
  assert.ok((await use('expansion', mew, pika, 'Leer', {defMist: true})).fails, 'Mist');
  assert.deepEqual((await use('expansion', mew, pika, 'Leer', {atkMist: true})).def.stg, stg(0, -1, 0, 0, 0), 'own Mist');
  assert.ok((await use('expansion', mew, mon('Pikachu', {it: 'Clear Amulet'}), 'Leer')).fails, 'Clear Amulet');
  assert.deepEqual((await use('cfru', mew, mon('Pikachu', {it: 'Clear Amulet'}), 'Leer')).def.stg, stg(0, -1, 0, 0, 0), 'no Clear Amulet in Gen 8');
});
if (data.AB.some(entry => entry[0] === 'Mirror Armor')) await check('Mirror Armor (Gen 8+) reflects the drop to the user', async () => {
  const out = await use('expansion', mew, mon('Pikachu', {ab: 'Mirror Armor'}), 'Leer');
  assert.deepEqual(out.atk.stg, stg(0, -1, 0, 0, 0));
  assert.equal(out.def.stg, undefined);
});
await check('Thunder Wave: Ground immune, Electric immune from Gen 6, Limber, already statused', async () => {
  assert.equal((await use('expansion', mew, pika, 'Thunder Wave')).fails, 'Electric type', 'Electric Gen 9');
  assert.equal((await use('gen5', mew, pika, 'Thunder Wave')).def.status, 'par', 'Electric Gen 5');
  assert.ok((await use('expansion', mew, mon('Garchomp'), 'Thunder Wave')).fails, 'Ground');
  assert.equal((await use('expansion', mew, mon('Garchomp'), 'Glare')).def.status, 'par', 'Glare ignores Ground');
  assert.equal((await use('expansion', mew, mon('Blissey', {ab: 'Limber'}), 'Thunder Wave')).fails, 'Limber');
  assert.ok((await use('expansion', mew, mon('Blissey', {st: 'brn'}), 'Thunder Wave')).fails, 'already burned');
  const out = await use('expansion', mew, mew, 'Thunder Wave');
  assert.equal(out.def.status, 'par');
  assert.equal(out.label, 'Par');
});
await check('Will-O-Wisp: Fire immune; Rawst / Lum cure and are used; Safeguard (Infiltrator Gen 6+)', async () => {
  assert.ok((await use('expansion', mew, mon('Charmander'), 'Will-O-Wisp')).fails);
  for (const item of ['Rawst Berry', 'Lum Berry']) {
    const out = await use('expansion', mew, mon('Blissey', {it: item}), 'Will-O-Wisp');
    assert.equal(out.def.status, '', item);
    assert.equal(out.def.used, true, item);
  }
  assert.equal((await use('expansion', mew, mew, 'Will-O-Wisp', {defSafeguard: true})).fails, 'Safeguard');
  assert.equal((await use('expansion', mon('Blissey', {ab: 'Infiltrator'}), mew, 'Will-O-Wisp', {defSafeguard: true})).def.status, 'brn');
});
await check('Misty Terrain (grounded), Electric Terrain sleep, Leaf Guard sun', async () => {
  assert.ok((await use('expansion', mew, mew, 'Toxic', {terrain: 'Misty'})).fails);
  assert.equal((await use('expansion', mew, mon('Pidgey'), 'Toxic', {terrain: 'Misty'})).def.status, 'tox', 'airborne');
  assert.ok((await use('expansion', mew, mew, 'Hypnosis', {terrain: 'Electric'})).fails);
  assert.ok((await use('expansion', mew, mon('Blissey', {ab: 'Leaf Guard'}), 'Hypnosis', {weather: 'Sun'})).fails);
  assert.ok((await use('expansion', mew, mew, 'Confuse Ray', {terrain: 'Misty'})).fails, 'Misty confusion Gen 7+');
});
await check('Powder: Grass, Overcoat, Safety Goggles from Gen 6', async () => {
  assert.ok((await use('expansion', mew, mon('Bulbasaur'), 'Spore')).fails, 'Grass');
  assert.ok((await use('expansion', mew, mon('Blissey', {ab: 'Overcoat'}), 'Spore')).fails, 'Overcoat');
  assert.ok((await use('expansion', mew, mon('Blissey', {it: 'Safety Goggles'}), 'Spore')).fails, 'Goggles');
  assert.equal((await use('gen5', mew, mon('Bulbasaur', {st: ''}), 'Spore')).def.status, 'slp', 'Grass Gen 5');
});
await check('Soundproof, Magic Bounce (reflects), Prankster vs Dark (Gen 7+), Good as Gold', async () => {
  assert.equal((await use('expansion', mew, mon('Blissey', {ab: 'Soundproof'}), 'Growl')).fails, 'Soundproof');
  const bounced = await use('expansion', mew, mon('Blissey', {ab: 'Magic Bounce'}), 'Leer');
  assert.deepEqual(bounced.atk.stg, stg(0, -1, 0, 0, 0));
  assert.equal(bounced.def.stg, undefined);
  assert.ok((await use('expansion', mon('Blissey', {ab: 'Prankster'}), mon('Umbreon'), 'Thunder Wave')).fails);
  assert.equal((await use('gen6', mon('Blissey', {ab: 'Prankster'}), mon('Umbreon'), 'Thunder Wave')).def.status, 'par');
  assert.ok((await use('expansion', mew, mon('Blissey', {ab: 'Good as Gold'}), 'Leer')).fails);
});
await check('Synchronize passes the status back (Gen 4: Toxic as poison)', async () => {
  const out = await use('expansion', mew, mon('Blissey', {ab: 'Synchronize'}), 'Toxic');
  assert.equal(out.def.status, 'tox');
  assert.equal(out.atk.status, 'tox');
  assert.equal((await use('gen4', mew, mon('Blissey', {ab: 'Synchronize'}), 'Toxic')).atk.status, 'psn');
});
await check('Swagger: +2 Atk and confusion; Persim cures; Own Tempo blocks only the confusion', async () => {
  const out = await use('expansion', mew, mon('Blissey', {it: 'Persim Berry'}), 'Swagger');
  assert.deepEqual(out.def.stg, stg(2, 0, 0, 0, 0));
  assert.equal(out.def.used, true);
  const tempo = await use('expansion', mew, mon('Blissey', {ab: 'Own Tempo'}), 'Swagger');
  assert.deepEqual(tempo.def.stg, stg(2, 0, 0, 0, 0));
  assert.ok(tempo.log.some(line => /Own Tempo/.test(line)));
});
await check('Belly Drum: +6 at more than half HP, fails at half; Contrary to −6', async () => {
  assert.deepEqual((await use('expansion', mew, pika, 'Belly Drum')).atk.stg, stg(6, 0, 0, 0, 0));
  const max = (await engine('expansion')).stats(mew)[0];
  assert.ok((await use('expansion', mon('Blissey', {hp: Math.floor(max / 2)}), pika, 'Belly Drum')).fails);
  assert.deepEqual((await use('expansion', mon('Blissey', {ab: 'Contrary'}), pika, 'Belly Drum')).atk.stg, stg(-6, 0, 0, 0, 0));
});
await check('Haze, Psych Up, Heart Swap, Topsy-Turvy', async () => {
  const up = mon('Blissey', {stg: stg(2, 0, 0, 0, -1)});
  const down = mon('Pikachu', {stg: stg(0, -2, 1, 0, 0)});
  const haze = await use('expansion', up, down, 'Haze');
  assert.deepEqual([haze.atk.stg, haze.def.stg], [stg(0, 0, 0, 0, 0), stg(0, 0, 0, 0, 0)]);
  assert.deepEqual((await use('expansion', up, down, 'Psych Up')).atk.stg, stg(0, -2, 1, 0, 0));
  const swap = await use('expansion', up, down, 'Heart Swap');
  assert.deepEqual([swap.atk.stg, swap.def.stg], [stg(0, -2, 1, 0, 0), stg(2, 0, 0, 0, -1)]);
  assert.deepEqual((await use('expansion', up, down, 'Topsy-Turvy')).def.stg, stg(0, 2, -1, 0, 0));
});
await check('Curse: stages for a non-Ghost, nothing for a Ghost (its switch + HP)', async () => {
  assert.deepEqual((await use('expansion', mew, pika, 'Curse')).atk.stg, stg(1, 1, 0, 0, -1));
  assert.equal(await use('expansion', mon('Gengar'), pika, 'Curse'), null);
});
await check('Stuff Cheeks eats the berry then Def +2 (fails without one); Purify cures the target; Tidy Up', async () => {
  const cheeks = await use('expansion', mon('Blissey', {it: 'Sitrus Berry'}), pika, 'Stuff Cheeks');
  assert.deepEqual([cheeks.atk.stg, cheeks.atk.used], [stg(0, 2, 0, 0, 0), true]);
  assert.ok((await use('expansion', mew, pika, 'Stuff Cheeks')).fails);
  assert.equal((await use('expansion', mew, mon('Pikachu', {st: 'brn'}), 'Purify')).def.status, '');
  assert.ok((await use('expansion', mew, pika, 'Purify')).fails);
  assert.deepEqual((await use('expansion', mew, pika, 'Tidy Up')).atk.stg, stg(1, 0, 0, 0, 1));
});
await check('Growth: +1 / +1, +2 / +2 in sun (Gen 5+); Gen 4 SpA +1', async () => {
  assert.deepEqual((await use('expansion', mew, pika, 'Growth')).atk.stg, stg(1, 0, 1, 0, 0));
  assert.deepEqual((await use('expansion', mew, pika, 'Growth', {weather: 'Sun'})).atk.stg, stg(2, 0, 2, 0, 0));
  assert.deepEqual((await use('gen4', mew, pika, 'Growth')).atk.stg, stg(0, 0, 1, 0, 0));
});
await check('Close Combat: the user loses Def / SpD after the hit; White Herb restores; not on an immune target', async () => {
  const out = await strike('expansion', mew, pika, 'Close Combat');
  assert.deepEqual(out.atk.stg, stg(0, -1, 0, -1, 0));
  const herb = await strike('expansion', mon('Blissey', {it: 'White Herb'}), pika, 'Close Combat');
  assert.deepEqual(herb.atk.stg, stg(0, 0, 0, 0, 0));
  assert.equal(herb.atk.used, true);
  assert.equal((await strike('expansion', mew, mon('Gengar'), 'Close Combat')).atk.stg, undefined);
});
await check('Draco Meteor SpA −2; Power-Up Punch Atk +1 (not with Sheer Force); Close Combat with Sheer Force still drops', async () => {
  assert.deepEqual((await strike('expansion', mew, pika, 'Draco Meteor')).atk.stg, stg(0, 0, -2, 0, 0));
  assert.deepEqual((await strike('expansion', mew, pika, 'Power-Up Punch')).atk.stg, stg(1, 0, 0, 0, 0));
  assert.equal((await strike('expansion', mon('Blissey', {ab: 'Sheer Force'}), pika, 'Power-Up Punch')).atk.stg, undefined);
  assert.deepEqual((await strike('expansion', mon('Blissey', {ab: 'Sheer Force'}), pika, 'Close Combat')).atk.stg, stg(0, -1, 0, -1, 0));
});
await check('Nuzzle: paralyses; not a Ground type, Limber, Electric (Gen 6+), Shield Dust / Covert Cloak; Lum / Cheri cure', async () => {
  const big = mon('Snorlax', {lv: 100});
  assert.equal((await strike('expansion', mew, big, 'Nuzzle')).def.status, 'par');
  assert.equal((await strike('expansion', mew, mon('Garchomp'), 'Nuzzle')).def.status, undefined, 'Ground');
  assert.equal((await strike('expansion', mew, mon('Snorlax', {lv: 100, ab: 'Limber'}), 'Nuzzle')).def.status, undefined, 'Limber');
  assert.equal((await strike('expansion', mew, mon('Raichu', {lv: 100}), 'Nuzzle')).def.status, undefined, 'Electric Gen 9');
  assert.equal((await strike('gen5', mew, mon('Raichu', {lv: 100}), 'Nuzzle')).def.status, 'par', 'Electric Gen 5');
  assert.equal((await strike('expansion', mew, mon('Snorlax', {lv: 100, ab: 'Shield Dust'}), 'Nuzzle')).def.status, undefined, 'Shield Dust');
  assert.equal((await strike('expansion', mon('Blissey', {ab: 'Mold Breaker'}), mon('Snorlax', {lv: 100, ab: 'Shield Dust'}), 'Nuzzle')).def.status, 'par', 'Mold Breaker');
  assert.equal((await strike('expansion', mew, mon('Snorlax', {lv: 100, it: 'Covert Cloak'}), 'Nuzzle')).def.status, undefined, 'Covert Cloak');
  for (const item of ['Lum Berry', 'Cheri Berry']) {
    const out = await strike('expansion', mew, mon('Snorlax', {lv: 100, it: item}), 'Nuzzle');
    assert.equal(out.def.status, '', item);
    assert.equal(out.def.used, true, item);
  }
});
await check('Chance effects never apply; Serene Grace makes a 50 % one certain', async () => {
  const big = mon('Snorlax', {lv: 100});
  assert.equal((await strike('expansion', mew, big, 'Thunderbolt')).def.status, undefined);
  assert.equal((await strike('expansion', mon('Blissey', {ab: 'Serene Grace'}), big, 'Thunderbolt')).def.status, undefined);
  assert.equal((await strike('expansion', mon('Blissey', {ab: 'Serene Grace'}), big, 'Poison Fang')).def.status, 'tox');
});
await check('Knock Off removes the item (Sticky Hold keeps it); Clear Smog resets the target', async () => {
  const big = mon('Snorlax', {lv: 100, it: 'Leftovers'});
  assert.equal((await strike('expansion', mew, big, 'Knock Off')).def.used, true);
  assert.equal((await strike('expansion', mew, mon('Snorlax', {lv: 100, it: 'Leftovers', ab: 'Sticky Hold'}), 'Knock Off')).def.used, undefined);
  assert.deepEqual((await strike('expansion', mew, mon('Snorlax', {lv: 100, stg: stg(2, 2, 0, 0, 0)}), 'Clear Smog')).def.stg, stg(0, 0, 0, 0, 0));
});
await check('Exact damage (You / Dealt Apply) has no effects', async () => {
  const out = plain((await engine('expansion')).hit(mew, mon('Snorlax', {lv: 100}), slot('Nuzzle'), {}, 'max', {damage: 10}));
  assert.equal(out.def.status, undefined);
});

// Each guide's own differences (hacks/<hack>/calc_effects.json → fixtures): [{title, profile?, move, user, target,
// field, kind: 'effect' | 'hit', expect: {dotted.path: value}}] on that guide's data and profile.
for (const hack of await readdir(new URL('hacks/', root))) {
  let own;
  try {
    own = await load(`hacks/${hack}/calc_effects.json`);
  } catch {
    continue;
  }
  const guide = await load(`hacks/${hack}/data.json`);
  const config = (await load(`hacks/${hack}/hack.json`)).cfg.calc;
  const hackEngine = await createEngine(guide, {...config, over: {...config.over, effects: own}});
  for (const fixture of own.fixtures || []) {
    await check(`${hack}: ${fixture.title}`, async () => {
      const set = spec => {
        const species = guide.P.find(entry => entry.n === spec.n);
        assert.ok(species, `Missing species ${spec.n}`);
        return {id: species.id, lv: spec.lv || 50, nat: 'Serious', ab: spec.ab ? guide.AB.findIndex(entry => entry[0] === spec.ab) : -1,
          it: spec.it || '', st: spec.st || '', iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], stg: [0, ...(spec.stg || [0, 0, 0, 0, 0])],
          ...(spec.hp !== undefined ? {hp: spec.hp} : {})};
      };
      const index = guide.M.indexOf(fixture.move);
      assert.notEqual(index, -1, `Missing move ${fixture.move}`);
      const result = fixture.kind === 'hit'
        ? hackEngine.hit(set(fixture.user), set(fixture.target), {mv: index}, fixture.field || {}, 'max')
        : hackEngine.effect(set(fixture.user), set(fixture.target), {mv: index}, fixture.field || {});
      for (const [path, value] of Object.entries(fixture.expect)) {
        const actual = plain(path ? path.split('.').reduce((node, key) => node?.[key], result) : result);
        assert.deepEqual(actual ?? null, value, path);
      }
    });
  }
}
console.log(`effects_check: ${count} checks pass`);

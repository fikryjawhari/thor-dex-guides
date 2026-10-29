// Blaze Black 2 Redux: the profile's own mechanics that the hzla comparison cannot see (crit ratio, recoil), the
// Challenge level bug on the fixtures, and the profile settings (hacks/blaze-black-2-redux/notes.md → Damage calc).
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createEngine, resolveProfile} from './run.mjs';

const directory = new URL('../../hacks/blaze-black-2-redux/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
if (!existsSync(new URL('data.json', directory)) || !configuration.cfg.calc) {
  console.log('SKIP blaze-black-2-redux calc-check: no data.json or cfg.calc');
  process.exit(0);
}
const data = JSON.parse(readFileSync(new URL('data.json', directory), 'utf8'));
const fixtures = JSON.parse(readFileSync(new URL('calc_matchups.json', directory), 'utf8'));
const profile = await resolveProfile(configuration.cfg.calc);
const base = await resolveProfile({base: 'gen5'});
const engine = await createEngine(data, profile);
const stock = await createEngine(data, base);
const plain = value => JSON.parse(JSON.stringify(value));
const mv = name => { const index = data.M.indexOf(name); assert.notEqual(index, -1, name); return index; };
const ab = name => { const index = data.AB.findIndex(entry => entry[0] === name); assert.notEqual(index, -1, name); return index; };
const set = (id, extra = {}) => ({id, lv: 50, ab: -1, nat: 'Serious', iv: [31, 31, 31, 31, 31, 31], ...extra});
let passed = 0;
const check = (name, body) => { body(); passed++; };

check('profile settings', () => {
  assert.equal(profile.gen, 5);
  assert.equal(profile.save, 'gen5');
  assert.equal(profile.evs, false);
  assert.equal(profile.setterStays, true);
  assert.equal(profile.over.critMultiplier, undefined, 'Gen 5 crits stay x2');
  assert.ok(data.MV.every(entry => entry.f === undefined), 'MV.f omitted: stock Gen 5 flags');
});

// Triple Axel (Move Changes: power 30, successive hits +10, "Triple Kick mechanics"): hits of 30 / 40 / 50, a typed
// power shifts all three, and the hit actions take the same powers (profile over.moves step; hzla gives 30 x 3).
check('Triple Axel 30 / 40 / 50', () => {
  const one = bp => plain(engine.calc(set('weavile'), set('garchomp'), {mv: mv('Tackle'), bp, t: 'Ice', hits: 1}, {})).rolls;
  const three = plain(engine.calc(set('weavile'), set('garchomp'), {mv: mv('Triple Axel'), hits: 3}, {}));
  assert.deepEqual(three.per, [one(30), one(40), one(50)]);
  const typed = plain(engine.calc(set('weavile'), set('garchomp'), {mv: mv('Triple Axel'), bp: 60, hits: 3}, {}));
  assert.deepEqual(typed.per, [one(60), one(70), one(80)]);
  const onSnorlax = bp => Math.max(...plain(engine.calc(set('weavile'), set('snorlax'), {mv: mv('Tackle'), bp, t: 'Ice', hits: 1}, {})).rolls);
  const hp = engine.stats(set('snorlax'))[0];
  const action = plain(engine.hit(set('weavile'), {...set('snorlax'), hp}, {mv: mv('Triple Axel'), hits: 3}, {}, 'max'));
  assert.equal(action.def.hp, hp - onSnorlax(30) - onSnorlax(40) - onSnorlax(50), 'hit actions: 30 / 40 / 50');
  const stockThree = plain(stock.calc(set('weavile'), set('garchomp'), {mv: mv('Triple Axel'), hits: 3}, {}));
  assert.deepEqual(stockThree.per ?? Array(3).fill(stockThree.rolls), [one(30), one(30), one(30)], 'base gen5 without the step: 30 x 3');
});

check('EVless: supplied EVs are ignored', () => {
  const low = engine.stats(set('snorlax')), high = engine.stats(set('snorlax', {ev: [252, 252, 252, 252, 252, 252]}));
  assert.deepEqual(plain(low), plain(high));
});

// MV.cr (extract/dex.py): Gen V's high-crit list, then Move Changes: Cut, Dragon Claw, Octazooka, X-Scissor gain high
// crit; Crabhammer loses it. Negative: Tackle stays at stage 0. Frost Breath / Storm Throw always crit.
check('crit ratio changes', () => {
  const user = set('snorlax'), target = set('blastoise');
  const crit = name => plain(engine.calc(user, target, {mv: mv(name)})).crit;
  for (const name of ['Cut', 'Dragon Claw', 'Octazooka', 'X-Scissor', 'Slash', 'Stone Edge', 'Shadow Claw']) {
    assert.equal(crit(name).stage, 1, name);
    assert.equal(crit(name).p, 1 / 8, `${name}: Gen 5 stage 1 = 1/8`);
  }
  for (const name of ['Crabhammer', 'Tackle', 'Esper Wing']) assert.equal(crit(name).stage, 0, name);
  for (const name of ['Frost Breath', 'Storm Throw']) assert.equal(crit(name).forced, true, name);
  assert.equal(crit('Slash').p, 1 / 8);
  assert.equal(plain(engine.calc(user, target, {mv: mv('Slash')}, {atkFocus: true})).crit.p, 1 / 3, 'Focus Energy +2');
});

// Wild Charge: "Recoil -> No Recoil"; Double-Edge keeps its recoil.
check('Wild Charge has no recoil', () => {
  const user = set('zebstrika'), target = set('blastoise');
  const change = (eng, name) => plain(eng.hp(user, target, {mv: mv(name)}, {}, 100))?.v ?? 0;
  assert.equal(change(engine, 'Wild Charge'), 0);
  assert.ok(change(stock, 'Wild Charge') < 0, 'stock Wild Charge recoils');
  assert.ok(change(engine, 'Double-Edge') < 0, 'Double-Edge recoils');
});

// Iron Fist: Needle Arm / Rock Smash (doc) and real punches; not other moves.
check('Iron Fist moves', () => {
  const user = set('cacturne', {ab: ab('Iron Fist')}), none = set('cacturne'), target = set('snorlax');
  const max = (who, name) => Math.max(...plain(engine.calc(who, target, {mv: mv(name)})).rolls);
  for (const name of ['Needle Arm', 'Rock Smash', 'Drain Punch']) assert.ok(max(user, name) > max(none, name), name);
  for (const name of ['Seed Bomb', 'Sucker Punch']) assert.equal(max(user, name), max(none, name), name);
});

// Sound moves: Soundproof blocks them (stock Gen 5 flags); a non-sound move is not blocked.
check('sound flags', () => {
  const user = set('exploud'), target = set('exploud', {ab: ab('Soundproof')});
  assert.equal(plain(engine.calc(user, target, {mv: mv('Hyper Voice')})).eff, 0);
  assert.ok(plain(engine.calc(user, target, {mv: mv('Return'), bp: 102})).max > 0);
});

// Level bug: Cheren's Munchlax (Lv 14 shown, stats at 13) and every fixture with sl.
check('level bug on the fixtures', () => {
  const munchlax = fixtures.matchups.find(matchup => matchup.name === 'level-bug-munchlax-tackle').atk;
  assert.equal(munchlax.lv, 14);
  assert.equal(munchlax.sl, 13);
  assert.deepEqual(plain(engine.stats(munchlax)), plain(engine.stats({...munchlax, lv: 13, sl: undefined})));
  let applied = 0;
  for (const matchup of fixtures.matchups) {
    for (const side of ['atk', 'def']) {
      const mon = matchup[side];
      if (mon.sl === undefined) continue;
      assert.ok(mon.sl < mon.lv, `${matchup.name}: sl below the shown level`);
      assert.deepEqual(plain(engine.stats(mon)), plain(engine.stats({...mon, lv: mon.sl, sl: undefined})));
      applied++;
    }
  }
  assert.ok(applied >= 15, `${applied} level-bug sides`);
  const shade = fixtures.matchups.find(matchup => matchup.name === 'level-bug-night-shade');
  assert.deepEqual(plain(engine.calc(shade.atk, shade.def, shade.slot)).rolls, Array(16).fill(shade.atk.sl));
});

// Trainer data: every sl is below its shown level, at most +5.
check('trainer stat levels', () => {
  let count = 0;
  for (const group of data.TR.g) for (const section of group.sec) for (const trainer of section.tr) {
    for (const mon of trainer.p) {
      if (mon.sl === undefined) continue;
      assert.ok(mon.sl < mon.l && mon.l - mon.sl <= 5, `${trainer.k} ${mon.id} ${mon.l}/${mon.sl}`);
      count++;
    }
  }
  assert.ok(count > 1000, `${count} trainer Pokemon with a stat level`);
});

console.log(`blaze-black-2-redux: ${passed} pass, 0 fail`);

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine, resolveProfile} from './run.mjs';

const directory = new URL('../../hacks/radical-red/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
const profile = await resolveProfile(configuration.cfg.calc || {base: 'cfru', evs: false});
const data = {
  P: [{id: '151', n: 'Mew', s: [100, 100, 100, 100, 100, 100], t: ['Psychic'], a: [], et: []}],
  AB: [['Toxic Boost', ''], ['Flare Boost', '']],
  M: ['Tackle', 'Ember'],
  MV: [
    {bp: 40, t: 'Normal', c: 'Physical', f: ['contact']},
    {bp: 40, t: 'Fire', c: 'Special', f: []},
  ],
};
const unchanged = JSON.stringify({data, profile});
const engine = await createEngine(data, profile);
const plain = value => JSON.parse(JSON.stringify(value));
const mon = (extra = {}) => ({id: '151', lv: 50, nat: 'Serious', ab: -1, it: '', st: '',
  iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], stg: [0, 0, 0, 0, 0, 0], ...extra});
const reference = 'RR calc 7f354003: calc/src/mechanics/';
const formula = reference + 'util.ts:480-488,540-562; gen789.ts:1086-1099';
const toxicSource = 'RR changes v3.1:46; Showdown 54955790 gen9rr/abilities.ts:691-700';
const flareSource = 'RR changes v3.1:49; Showdown 54955790 gen9rr/abilities.ts:240-249';
const neutral = [16, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 19];
const boosted = [23, 24, 24, 24, 24, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 28];
let passed = 0;
let failed = 0;
const check = (name, source, run) => {
  try {
    run();
    passed++;
    console.log('PASS ' + name);
  } catch (error) {
    failed++;
    console.error('FAIL ' + name + '\nSource: ' + source + '\n' + error.message);
  }
};
const rolls = (attacker, move) => plain(engine.calc(attacker, mon(), {mv: move}).rolls);
check('neutral physical 16-19 (base damage 19)', formula, () => {
  assert.deepEqual(rolls(mon(), 0), neutral);
});
check('neutral special 16-19 (base damage 19)', formula, () => {
  assert.deepEqual(rolls(mon(), 1), neutral);
});
for (const status of ['psn', 'tox']) {
  check('Toxic Boost ' + status + ' physical 23-28 (power 60, base damage 28)', formula, () => {
    assert.deepEqual(rolls(mon({ab: 0, st: status}), 0), boosted);
  });
  check('Toxic Boost ' + status + ' does not boost special damage', formula, () => {
    assert.deepEqual(rolls(mon({ab: 0, st: status}), 1), neutral);
  });
}
check('Flare Boost burned special 23-28 (power 60, base damage 28)', formula, () => {
  assert.deepEqual(rolls(mon({ab: 1, st: 'brn'}), 1), boosted);
});
for (const ability of [0, 1]) {
  check(data.AB[ability][0] + ' does not boost a healthy holder', formula, () => {
    assert.deepEqual(rolls(mon({ab: ability}), ability), neutral);
  });
}
for (const [ability, status, source] of [[0, 'psn', toxicSource], [0, 'tox', toxicSource], [1, 'brn', flareSource]]) {
  check(data.AB[ability][0] + ' blocks ' + status + ' residual', source, () => {
    assert.deepEqual(plain(engine.residual(mon({ab: ability, st: status}))), []);
  });
  check(data.AB[ability][0] + ' still takes Sand chip while healthy', source, () => {
    assert.deepEqual(plain(engine.residual(mon({ab: ability}), {weather: 'Sand'})),
      [{l: 'Sandstorm', v: [-10, -10, -10, -10]}]);
  });
}
check('fixture inputs remain unchanged', 'tools/calc/README.md: Public contract', () => {
  assert.equal(JSON.stringify({data, profile}), unchanged);
});
console.log(`Radical Red inventory checkpoint: ${passed} passed, ${failed} failed; ` +
  (configuration.cfg.calc ? 'configured profile' : 'calc disabled; testing CFRU base only'));
if (failed) {
  console.error('BLOCKED: RR needs ability-conditioned residual suppression in the shared engine. ' +
    'See hacks/radical-red/notes.md Damage calc; do not accept these failures as oracle differences.');
  process.exitCode = 1;
}

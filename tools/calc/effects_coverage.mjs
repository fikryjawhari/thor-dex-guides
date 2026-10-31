import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createEngine, resolveProfile} from './run.mjs';

const root = new URL('../../', import.meta.url);
const load = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const hacks = ['emerald-imperium', 'hardlove-gold', 'photonic-sun', 'eternal-x', 'blaze-black-2-redux', 'unbound'];
const page = await readFile(new URL('template/calc.js', root), 'utf8');
const maps = Object.fromEntries(['MOVE_GLOBAL', 'MOVE_OWN', 'MOVE_OTHER'].map(name => {
  const literal = page.match(new RegExp(`const ${name}=(.*);`))?.[1];
  if (!literal) throw new Error(`Missing page control catalogue ${name}`);
  return [name, runInNewContext(`(${literal})`)];
}));
const weather = {'Sunny Day': 'Sun', 'Rain Dance': 'Rain', Sandstorm: 'Sand', Hail: 'Hail', Snowscape: 'Snow'};
const terrain = {'Electric Terrain': 'Electric', 'Grassy Terrain': 'Grassy', 'Misty Terrain': 'Misty', 'Psychic Terrain': 'Psychic'};
const kinds = new Set(['haze', 'clear', 'copy', 'swap', 'invert', 'maxatk', 'growth', 'venom', 'cheeks', 'purify',
  'cure', 'shift', 'knock', 'steal', 'eat', 'burnitem', 'trick', 'bestow', 'type', 'ability', 'drowsy', 'random',
  'log', 'stockpile', 'curse', 'memento', 'sap', 'rest', 'speedswap', 'recycle', 'defog']);

function switches(name, profile) {
  for (const [map, prefix] of [[maps.MOVE_GLOBAL, ''], [maps.MOVE_OWN, 'atk'], [maps.MOVE_OTHER, 'def']]) {
    for (const [key, names] of Object.entries(map)) {
      if (names.includes(name) && profile.field?.some(entry => entry.k === prefix + key)) return prefix + key;
    }
  }
  if (['Dig', 'Fly', 'Bounce', 'Dive', 'Minimize'].includes(name)) return 'battle volatile';
  for (const [key, value] of [['weather', weather[name]], ['terrain', terrain[name]]]) {
    if (value && profile.field?.some(entry => entry.k === key && entry.o?.some(option => option[0] === value))) return key;
  }
  return '';
}

export async function coverage(hack) {
  const data = await load(`hacks/${hack}/data.json`);
  const config = (await load(`hacks/${hack}/hack.json`)).cfg.calc;
  const own = await load(`hacks/${hack}/calc_effects.json`);
  const profile = await resolveProfile({...config, over: {...config.over, effects: own}});
  const built = JSON.parse(execFileSync('python', ['-c', 'import assemble,json,sys; h=sys.argv[1]; print(json.dumps(assemble.calc_profile(json.loads(assemble.read("hacks",h,"hack.json"))["cfg"]["calc"],json.loads(assemble.read("hacks",h,"data.json")))))', hack], {cwd: root, encoding: 'utf8'}));
  profile.field = built.field;
  const engine = await createEngine(data, profile);
  const mon = {id: data.P[0].id, lv: 50, nat: 'Serious', ab: -1, it: '', st: '', hp: 1,
    iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], stg: [0, 0, 0, 0, 0, 0]};
  const rows = data.M.map((name, index) => {
    const category = data.MV[index]?.c;
    const record = engine.effects(name);
    const actions = [];
    const control = switches(name, profile);
    if (control) actions.push('switch: ' + control);
    if (category === 'Status' && engine.hp(mon, mon, {mv: index}, {}, 0)) actions.push('HP chip');
    let calculationError = '';
    if (category !== 'Status') {
      try { if (engine.calc(mon, mon, {mv: index, bp: Number(data.MV[index]?.bp) || 80}, {})) actions.push('damage'); }
      catch (error) { calculationError = error.message; }
    }
    const applies = record && (record.b || record.sb || record.st || record.v || kinds.has(record.k));
    if (applies) actions.push(['log', 'random', 'drowsy'].includes(record.k) ? 'logs only' : 'applies: ' +
      [record.k, record.b && 'stages', record.st, record.v, record.sb && 'self stages'].filter(Boolean).join(', '));
    if (record?.sec?.some(part => part.b || part.st || part.v || part.sb || kinds.has(part.k))) actions.push('secondary (guaranteed applies; chance text)');
    const reason = record?.nm || '';
    const noop = record?.noop || '';
    const unmapped = record?.k && !kinds.has(record.k) || record?.sec?.some(part => part.k && !kinds.has(part.k));
    const gap = !reason && !noop && (!actions.length || unmapped);
    return {move: name, category, actions, reason, noop, gap: !!gap, ...(calculationError ? {calculationError} : {})};
  });
  const reasons = {};
  for (const row of rows) if (row.reason) reasons[row.reason] = (reasons[row.reason] || 0) + 1;
  return {hack, scope: 'every move in M', total: rows.length, implemented: rows.filter(row => row.actions.length).length,
    notModelled: rows.filter(row => row.reason).length, reasons, noops: rows.filter(row => row.noop).map(row => row.move),
    gaps: rows.filter(row => row.gap), rows};
}

async function main() {
  const args = process.argv.slice(2);
  const selected = args.includes('--all') ? hacks : args.filter(arg => !arg.startsWith('--'));
  if (!selected.length || selected.some(hack => !hacks.includes(hack))) throw new Error('Usage: effects_coverage.mjs <hack>|--all [--json]');
  const results = [];
  for (const hack of selected) results.push(await coverage(hack));
  if (args.includes('--json')) console.log(JSON.stringify(results, null, 2));
  else for (const result of results) {
    console.log(`${result.hack}: all M ${result.total}; implemented ${result.implemented}; Not modelled ${result.notModelled}; no-ops ${result.noops.length}; GAP ${result.gaps.length}`);
    for (const [reason, count] of Object.entries(result.reasons).sort()) console.log(`  ${count} ${reason}`);
    for (const row of result.gaps) console.log(`  GAP ${row.move} (${row.category}): ${row.actions.join('; ') || 'nothing'}`);
  }
  if (results.some(result => result.gaps.length)) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();

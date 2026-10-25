import {readFileSync, existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {dirname, resolve, relative, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createContext, runInContext} from 'node:vm';
import {resolveProfile, runMatchups} from './run.mjs';
import {speciesName, weightNames} from './src/names.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pin = 'ff6c3e339e276e6b4e8e44db58750b6534bc26aa';
const upstream = 'https://github.com/hzla/Dynamic-Calc-Decomps.git';
const legacyPin = '42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74';
const legacyUpstream = 'https://github.com/hzla/Dynamic-Calc.git';
const statNames = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const toID = name => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
const statObject = (values, fallback) => Object.fromEntries(statNames.map((name, index) => [name, values?.[index] ?? fallback]));
const plain = value => JSON.parse(JSON.stringify(value));

export function oracleName(name, kind, translations = {}) {
  if (translations[kind]?.[name] !== undefined) return translations[kind][name];
  if (kind !== 'species') return name;
  return speciesName(name).replace(/^Mega (.+?)(?: ([XY]))?$/, (_, base, suffix) => `${base}-Mega${suffix ? '-' + suffix : ''}`)
    .replace(/^Primal (.+)$/, '$1-Primal')
    .replace(/^(Alolan|Galarian|Hisuian|Paldean) (.+)$/, (_, region, species) =>
      `${species}-${{Alolan: 'Alola', Galarian: 'Galar', Hisuian: 'Hisui', Paldean: 'Paldea'}[region]}`);
}

function git(repo, args) {
  const result = spawnSync('git', ['-C', repo, ...args], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'git failed');
  return result.stdout.trim();
}

async function oracleRepository(repo, fetch, legacy) {
  const expected = legacy ? legacyPin : pin;
  if (!existsSync(repo)) {
    if (!fetch) throw new Error(`Missing local oracle: ${repo}; rerun with --fetch`);
    await mkdir(dirname(repo), {recursive: true});
    const clone = spawnSync('git', ['clone', '--filter=blob:none', '--no-checkout', legacy ? legacyUpstream : upstream, repo], {encoding: 'utf8'});
    if (clone.status !== 0) throw new Error(clone.stderr || clone.error?.message || 'clone failed');
    git(repo, ['checkout', '--detach', expected]);
  }
  const head = git(repo, ['rev-parse', 'HEAD']);
  if (head !== expected) throw new Error(`Oracle HEAD ${head} differs from pinned ${expected}; use a separate clean clone`);
  if (git(repo, ['status', '--porcelain', '--untracked-files=no'])) throw new Error('Oracle has tracked modifications');
  return head;
}

function loadOracle(repo, options) {
  const settings = {
    damageGen: options.damageGen, critGen: options.critGen, type_chart: options.types,
    typeChart: options.types, noSwitch: true, switchIn: 0, challengeMode: false,
    hasEvs: true, ...options.settings,
  };
  const context = createContext({console, TITLE: options.title, settings, gameGen: options.damageGen,
    localStorage: {dynamicTypeBug: '0'}, calcingForSwitchIns: false, pokedex: {}, backup_moves: {}});
  const modules = new Map();
  const load = path => {
    let filename = resolve(path);
    if (existsSync(`${filename}.js`)) filename += '.js';
    else if (existsSync(resolve(filename, 'index.js'))) filename = resolve(filename, 'index.js');
    const location = relative(repo, filename);
    if (location === '..' || location.startsWith(`..${sep}`)) throw new Error('Oracle import escaped its checkout');
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = {exports: {}};
    modules.set(filename, module);
    const wrapper = runInContext(`(function(require,module,exports){\n${readFileSync(filename, 'utf8')}\n})`, context,
      {filename, timeout: 10000});
    wrapper(request => {
      if (!request.startsWith('.')) throw new Error(`Unsupported oracle dependency ${request}`);
      return load(resolve(dirname(filename), request));
    }, module, module.exports);
    return module.exports;
  };
  if (options.backup) {
    if (!/^[a-zA-Z0-9_-]+$/.test(options.backup)) throw new Error('Invalid backup name');
    const filename = resolve(repo, 'backups', `${options.backup}.js`);
    runInContext(readFileSync(filename, 'utf8'), context, {filename, timeout: 10000});
  }
  let calc;
  if (options.repository === 'Dynamic-Calc') {
    Object.assign(context, {damageGen: options.damageGen, type_chart: options.types, type_mod: '',
      challengeMode: false, URLSearchParams,
      window: {location: {search: `?dmgGen=${options.damageGen}&gen=${options.gen}&types=${options.types}`}}});
    context.invert = false;
    context.switchIn = 0;
    context.npoint_data = context.backup_data || {moves: {}};
    context.backup_moves = context.npoint_data.moves;
    context.exports = {};
    context.require = () => context.exports;
    context.__createBinding = (target, source, key) => { target[key] = source[key]; };
    const html = readFileSync(resolve(repo, 'index.html'), 'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src="\.\/(calc\/[^"?]+)(?:\?[^" ]*)?"/g)];
    if (!scripts.length) throw new Error('Legacy oracle has no calc scripts');
    for (const [, path] of scripts) {
      const filename = resolve(repo, path);
      if (!filename.startsWith(resolve(repo, 'calc') + sep)) throw new Error('Legacy oracle script escaped calc');
      runInContext(readFileSync(filename, 'utf8'), context, {filename, timeout: 10000});
    }
    calc = context.exports;
  } else calc = load(resolve(repo, 'calc/index.js'));
  context.typeChart = calc.TYPE_CHART[options.types];
  if (!context.typeChart) throw new Error(`Missing oracle type chart ${options.types}`);
  return {calc, context};
}

function oracleGeneration(calc, data, options, profile) {
  const stock = calc.Generations.get(options.gen);
  const modern = calc.Generations.get(8);
  const translations = options.names || {};
  const species = new Map(data.P.map(entry => {
    const name = oracleName(entry.n, 'species', translations);
    const lookup = form => stock.species.get(toID(form)) || modern.species.get(toID(form));
    const known = lookup(name);
    // Same weight as our engine: the profile's own, the stock record, a stock form name, then the base species.
    const weightkg = (profile.over?.species?.[entry.id] || profile.over?.species?.[entry.n])?.weightkg
      ?? known?.weightkg ?? weightNames(entry.n).map(lookup).find(form => form?.weightkg)?.weightkg ?? 1;
    return [toID(name), {...plain(known || {}), kind: 'Species', id: toID(name), name,
      baseStats: statObject(entry.s, 1), types: entry.t, weightkg,
      nfe: !!entry.et?.length, abilities: {0: ''}}];
  }));
  return {...stock, species: {get: id => species.get(id)},
    moves: {get: id => stock.moves.get(id) || modern.moves.get(id)}};
}

function oracleSet(calc, gen, data, set, translations) {
  const entry = data.P.find(species => String(species.id) === String(set.id));
  if (!entry) throw new Error(`Unknown guide species ${set.id}`);
  if (set.ab !== undefined && set.ab !== -1 && !data.AB[set.ab]) throw new Error(`Unknown ability ${set.ab}`);
  return new calc.Pokemon(gen, oracleName(entry.n, 'species', translations), {
    level: set.lv ?? 50, nature: set.nat || 'Serious',
    ability: set.ab >= 0 ? oracleName(data.AB[set.ab][0], 'abilities', translations) : 'Guide no ability',
    item: oracleName(set.it || '', 'items', translations), status: set.st || '', curHP: set.hp,
    ivs: statObject(set.iv, 31), evs: statObject(set.ev, 0), boosts: statObject(set.stg, 0),
    abilityOn: set.abilityOn === true,
  });
}

function oracleField(calc, profile, values) {
  const options = {attackerSide: {}, defenderSide: {}};
  for (const entry of profile.field || []) {
    if (values[entry.k] === undefined) continue;
    if (entry.type === 'select' && !entry.o.some(([value]) => value === values[entry.k])) continue;
    const target = entry.side === 'atk' ? options.attackerSide : entry.side === 'def' ? options.defenderSide : options;
    target[entry.to] = entry.type === 'toggle' ? !!values[entry.k] : values[entry.k];
  }
  return new calc.Field(options);
}

function normaliseDamage(damage, hits) {
  const rolls = value => typeof value === 'number' ? Array(16).fill(value) : Array.from(value);
  const per = Array.isArray(damage) && Array.isArray(damage[0])
    ? damage.map(rolls) : Array.from({length: hits}, () => rolls(damage));
  if (!per.every(hit => hit.length === 16 && hit.every(value => Number.isInteger(value) && value >= 0))) {
    throw new Error('Oracle did not return 16 integer rolls per hit');
  }
  return per;
}

function oracleMatchup(oracle, gen, data, profile, options, matchup) {
  const {calc, context} = oracle;
  const names = options.names || {};
  const attacker = oracleSet(calc, gen, data, matchup.atk, names);
  const defender = oracleSet(calc, gen, data, matchup.def, names);
  const entry = data.MV[matchup.slot.mv];
  const guideName = data.M[matchup.slot.mv];
  if (!entry || !guideName) throw new Error(`Unknown guide move ${matchup.slot.mv}`);
  if (entry.c === 'Status') throw new Error('Comparison cases must be damaging moves');
  const name = oracleName(guideName, 'moves', names);
  const imported = context.backup_moves?.[name];
  const known = gen.moves.get(toID(name));
  const variable = entry.bp === 'Varies' || profile.varpow?.includes(guideName);
  // A variable-power move with no set power is worked out by the oracle's own rule for that move (weight, HP, speed).
  const fixed = variable && matchup.slot.bp > 0;
  if (variable && !fixed && !known && !imported) throw new Error(`${guideName} needs explicit power`);
  const hits = matchup.slot.hits ?? profile.multihit?.[guideName]?.[2] ?? 1;
  const flags = {...known?.flags};
  const flagNames = {makesContact: 'contact', isPunch: 'punch', isBite: 'bite', isBullet: 'bullet',
    isSound: 'sound', isPulse: 'pulse', isSlicing: 'slicing', isKick: 'kick', isBone: 'bone',
    isWind: 'wind', isTail: 'tail', isDrill: 'drill'};
  for (const [source, target] of Object.entries(flagNames)) {
    if (imported?.[source] || imported?.flags?.[source] || imported?.flags?.[target]) flags[target] = 1;
  }
  const move = new calc.Move(gen, name, {ability: attacker.ability, item: attacker.item,
    hits, isCrit: !!matchup.slot.crit, overrides: {
      ...known, ...imported, name, flags, basePower: matchup.slot.bp ?? (variable ? known?.basePower ?? imported?.basePower : entry.bp),
      type: matchup.slot.t || entry.t, category: entry.c,
      ...(fixed ? {name: 'Guide fixed power', id: 'guidefixedpower'} : {}),
    }});
  move.hits = hits;
  const result = calc.calculate(gen, attacker, defender, move, oracleField(calc, profile, matchup.field || {}));
  const per = normaliseDamage(result.damage, hits);
  let ko;
  try { ko = plain(result.kochance(false)); } catch (error) { ko = {unavailable: error.message}; }
  return {per, ko, description: plain(result.rawDesc),
    input: {attacker: attacker.name, defender: defender.name, move: name, hits}};
}

export async function compare(hack, {repo, fetch = false, output, caseName} = {}) {
  if (!/^[a-z0-9-]+$/.test(hack)) throw new Error('Invalid hack directory');
  const load = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const data = await load(`hacks/${hack}/data.json`);
  const config = await load(`hacks/${hack}/hack.json`);
  const fixtures = await load(`hacks/${hack}/calc_matchups.json`);
  const options = fixtures.oracle;
  const legacy = options?.repository === 'Dynamic-Calc';
  if (options?.repository && !['Dynamic-Calc', 'Dynamic-Calc-Decomps'].includes(options.repository)) {
    throw new Error('Unsupported oracle repository');
  }
  if (!options?.title || ![4, 5, 6, 7, 8, 9].includes(options.gen)
    || ![4, 5, 6, 7, 8, 9].includes(options.damageGen) || ![4, 5, 6, 7, 8, 9].includes(options.types)) {
    throw new Error('Fixtures require oracle title, gen, damageGen and types (4-9)');
  }
  repo = resolve(repo || resolve(root, legacy ? '.tmp/hzla-eternal-x' : '.tmp/hzla'));
  const sha = await oracleRepository(repo, fetch, legacy);
  const profile = await resolveProfile(config.cfg.calc);
  const cases = fixtures.matchups.filter(matchup => !caseName || matchup.name === caseName);
  if (!cases.length || new Set(cases.map(matchup => matchup.name)).size !== cases.length) {
    throw new Error('Cases must be nonempty and have unique names');
  }
  const oracle = loadOracle(repo, options);
  const gen = oracleGeneration(oracle.calc, data, options, profile);
  const results = [];
  for (const matchup of cases) {
    try {
      const ours = plain(await runMatchups(data, profile, matchup));
      if (!ours) throw new Error('Our engine returned null for a damaging case');
      const theirs = oracleMatchup(oracle, gen, data, profile, options, matchup);
      const per = ours.per || Array.from({length: ours.hits}, () => ours.rolls);
      const equal = JSON.stringify(per) === JSON.stringify(theirs.per);
      const koComparable = per.length === 1 && theirs.ko.n === 1 && ours.ko.n === 1
        && !matchup.def.st && !matchup.def.it && !matchup.field?.weather;
      const koEqual = !koComparable || Math.abs(ours.ko.p - theirs.ko.chance) < 1e-10;
      const status = equal && koEqual ? 'match' : matchup.difference ? 'known-difference' : 'mismatch';
      if (status === 'known-difference' && (!matchup.difference.source || !matchup.difference.reason)) {
        throw new Error('Known differences need source and reason');
      }
      results.push({name: matchup.name, status, ...(matchup.difference ? {difference: matchup.difference} : {}),
        ours, oracle: theirs, koComparable, koEqual});
    } catch (error) {
      results.push({name: matchup.name, status: 'error', error: error.stack});
    }
  }
  const counts = Object.fromEntries(['match', 'known-difference', 'mismatch', 'error'].map(status =>
    [status, results.filter(result => result.status === status).length]));
  const report = {hack, guideVersion: config.version, oracleSHA: sha, settings: options,
    dataMode: 'Shared guide stats/types/power/category; independent oracle flags, effects and mechanics. No over rules passed to oracle.',
    counts, results};
  const destination = resolve(output || resolve(root, `.tmp/calc-${hack}/compare.json`));
  if (!relative(root, destination).startsWith(`.tmp${sep}`)) throw new Error('Reports must stay under .tmp/');
  await mkdir(dirname(destination), {recursive: true});
  await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
  for (const result of results) console.log(`${result.status.toUpperCase()} ${result.name}${result.error ? ': ' + result.error.split('\n')[0] : ''}`);
  console.log(JSON.stringify(counts), relative(root, destination));
  return report;
}

async function main() {
  const [hack, ...args] = process.argv.slice(2);
  const options = {};
  while (args.length) {
    const argument = args.shift();
    if (argument === '--fetch') options.fetch = true;
    else if (['--repo', '--output', '--case'].includes(argument) && args.length) {
      options[{'--repo': 'repo', '--output': 'output', '--case': 'caseName'}[argument]] = args.shift();
    } else throw new Error('Usage: node tools/calc/hzla_compare.mjs <hack> [--fetch] [--repo path] [--output .tmp/path.json] [--case name]');
  }
  const report = await compare(hack, options);
  if (report.counts.mismatch || report.counts.error) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(`hzla_compare: ${error.stack}`); process.exitCode = 1; });
}

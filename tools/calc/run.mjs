import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createContext, runInContext} from 'node:vm';

function merged(base, override) {
  const result = {...base};
  for (const [key, value] of Object.entries(override)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])
      ? merged(result[key], value) : value;
  }
  return result;
}

export async function resolveProfile(profile) {
  if (!profile.base) return profile;
  if (!/^[a-z0-9-]+$/.test(profile.base)) throw new Error('Invalid profile base');
  const base = JSON.parse(await readFile(new URL(`../../template/calc/profiles/${profile.base}.json`, import.meta.url), 'utf8'));
  return merged(base, profile);
}

export async function createEngine(data, profile) {
  const source = await readFile(new URL('../../template/calc/engine.js', import.meta.url), 'utf8');
  const context = createContext({window: {}});
  runInContext(source, context, {filename: 'engine.js', timeout: 10000});
  const engine = context.window.DMG;
  engine.init(data, await resolveProfile(profile));
  return engine;
}

export async function runMatchups(data, profile, matchups) {
  const engine = await createEngine(data, profile);
  const run = matchup => {
    if (!matchup || !matchup.atk || !matchup.def || !matchup.slot) {
      throw new Error('A matchup needs atk, def and slot');
    }
    return engine.calc(matchup.atk, matchup.def, matchup.slot, matchup.field || {});
  };
  return Array.isArray(matchups) ? matchups.map(run) : run(matchups);
}

async function main() {
  const [dataPath, profilePath, matchupPath] = process.argv.slice(2);
  if (!dataPath || !profilePath || !matchupPath || process.argv.length !== 5) {
    throw new Error('Usage: node tools/calc/run.mjs data.json profile.json matchups.json|-');
  }
  const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
  let matchups;
  if (matchupPath === '-') {
    let input = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) input += chunk;
    matchups = JSON.parse(input);
  } else matchups = await readJSON(matchupPath);
  const result = await runMatchups(await readJSON(dataPath), await readJSON(profilePath), matchups);
  process.stdout.write(JSON.stringify(result) + '\n');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write(`calc: ${error.message}\n`);
    process.exitCode = 1;
  });
}

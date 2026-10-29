import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';

export function savedUnboundOracle() {
  const root = new URL('../../hacks/unbound/.src/unboundcalc/', import.meta.url);
  const html = new URL('PokemonUnboundDamageCalculator.htm', root);
  if (!existsSync(html)) return null;
  const context = createContext({console});
  context.exports = {};
  context.require = () => context.exports;
  context.__createBinding = (target, source, key) => { target[key] = source[key]; };
  const files = [];
  const allowed = /^(util|stats|species|gen[1-8]|types|natures|abilities|moves|items|index|move|pokemon|field|util_002|items_002|gen78|gen56|gen4_002|gen3_002|gen12|calc|desc|result|adaptable)_YA0k\.js$/;
  for (const [, path] of readFileSync(html, 'utf8').matchAll(/<script[^>]+src="(PokemonUnboundDamageCalculator_files\/([^"/]+))"/g)) {
    const name = path.split('/').at(-1);
    if (!allowed.test(name)) continue;
    const source = readFileSync(new URL(path, root), 'utf8');
    files.push({name, sha256:createHash('sha256').update(source).digest('hex')});
    runInContext(source, context, {filename:name, timeout:10000});
  }
  const controls = readFileSync(new URL('PokemonUnboundDamageCalculator_files/shared_controls_YA0k.js',root));
  files.push({name:'shared_controls_YA0k.js',sha256:createHash('sha256').update(controls).digest('hex')});
  const manifest = JSON.parse(readFileSync(new URL('./unbound_official_manifest.json',import.meta.url),'utf8'));
  assert.deepEqual(files,manifest.files,'saved official source hashes: update requires an explicit source review');
  return {calc:context.exports, files};
}

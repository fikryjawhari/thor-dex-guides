import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {instrument} from './instrument.mjs';

const require = createRequire(import.meta.url);
const {Generations} = require('@smogon/calc');
const root = fileURLToPath(new URL('../../', import.meta.url));
const upstream = fileURLToPath(new URL('./node_modules/@smogon/calc/src/', import.meta.url));
const destination = `${root}template/calc/engine.js`;
const records = {};
let previous = {};
for (let generation = 4; generation <= 9; generation++) {
  const source = Generations.get(generation);
  const current = {};
  for (const collection of ['moves', 'species', 'items', 'abilities', 'types', 'natures']) {
    current[collection] = {};
    for (const entry of source[collection]) {
      let value = {...entry};
      delete value.kind;
      delete value.id;
      if (collection === 'species') {
        value = {name: entry.name, weightkg: entry.weightkg};
        for (const key of ['nfe', 'gender', 'baseSpecies']) {
          if (entry[key] !== undefined) value[key] = entry[key];
        }
      }
      if (collection === 'moves') {
        delete value.zMove;
        delete value.maxMove;
      }
      current[collection][entry.id] = value;
    }
  }
  const delta = {};
  for (const collection of Object.keys(current)) {
    delta[collection] = {};
    for (const [id, value] of Object.entries(current[collection])) {
      if (JSON.stringify(value) !== JSON.stringify(previous[collection]?.[id])) {
        delta[collection][id] = value;
      }
    }
    for (const id of Object.keys(previous[collection] || {})) {
      if (!current[collection][id]) delta[collection][id] = null;
    }
  }
  records[generation] = delta;
  previous = current;
}

// Gen 7 Z powers that are not the plain band for the move's power (profile `zmove`; adapter `zPower`).
const zBand = power => power <= 55 ? 100 : power <= 65 ? 120 : power <= 75 ? 140 : power <= 85 ? 160 : power <= 95 ? 175
  : power <= 100 ? 180 : power <= 110 ? 185 : power <= 125 ? 190 : power <= 130 ? 195 : 200;
records.zpow = {};
for (const move of Generations.get(7).moves) {
  if (move.zMove?.basePower && move.zMove.basePower !== zBand(move.basePower)) records.zpow[move.id] = move.zMove.basePower;
}

const license = `/*!
 * @smogon/calc 0.12.0 - MIT License
 * Copyright (c) 2013-2025 Honko and other contributors
 * https://github.com/smogon/damage-calc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */`;

const patches = {
  'gen4.ts': [
    ['baseDamage *= 3;', 'baseDamage = Math.floor(baseDamage * ((attacker.gen as any).critMultiplier ?? 2) * 1.5);'],
    ['baseDamage *= 2;', 'baseDamage = Math.floor(baseDamage * ((attacker.gen as any).critMultiplier ?? 2));'],
  ],
  'gen56.ts': [
    ['baseDamage * (gen.num > 5 ? 1.5 : 2)', 'baseDamage * ((gen as any).critMultiplier ?? (gen.num > 5 ? 1.5 : 2))'],
  ],
  'gen789.ts': [
    ['baseDamage = Math.floor(OF32(baseDamage * 1.5));', 'baseDamage = Math.floor(OF32(baseDamage * ((gen as any).critMultiplier ?? 1.5)));'],
  ],
};

const result = await build({
  absWorkingDir: root,
  entryPoints: ['tools/calc/src/adapter.js'],
  outfile: destination,
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2019',
  legalComments: 'none',
  banner: {js: license},
  metafile: true,
  plugins: [{
    name: 'guide-data-and-critical-multiplier',
    setup(builder) {
      builder.onResolve({filter: /^guide-calc-data$/}, () => ({path: 'data', namespace: 'guide'}));
      builder.onResolve({filter: /^guide-calc-rules$/}, () => ({path: `${root}tools/calc/src/rules.js`}));
      builder.onLoad({filter: /.*/, namespace: 'guide'}, () => ({
        contents: `export default ${JSON.stringify(records)}`, loader: 'js',
      }));
      builder.onLoad({filter: /[\\/]mechanics[\\/](?:gen4|gen56|gen789|util)\.ts$/}, async ({path}) => {
        let contents = await readFile(path, 'utf8');
        const filename = path.split(/[\\/]/).pop();
        for (const [before, after] of patches[filename] || []) {
          if (contents.split(before).length !== 2) throw new Error(`Upstream patch drift: ${path}: ${before}`);
          contents = contents.replace(before, after);
        }
        return {contents: instrument(contents, filename), loader: 'ts', resolveDir: upstream + 'mechanics'};
      });
    },
  }],
});
const output = await readFile(destination);
console.log(`engine.js: ${output.length} bytes; gzip ${gzipSync(output).length} bytes`);
const contributions = Object.values(result.metafile.outputs).find(output => output.entryPoint)?.inputs || {};
for (const [path, value] of Object.entries(contributions).sort((left, right) => right[1].bytesInOutput - left[1].bytesInOutput).slice(0, 7)) {
  console.log(`  ${value.bytesInOutput} bytes: ${path}`);
}

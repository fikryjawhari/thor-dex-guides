import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {stat} from 'node:fs/promises';

const {Generations} = createRequire(import.meta.url)('@smogon/calc');
const generation = Generations.get(9);
const metadata = {
  species: Object.fromEntries([...generation.species].map(entry => [entry.id, {weightkg: entry.weightkg}])),
  items: Object.fromEntries([...generation.items].filter(entry => entry.fling || entry.naturalGift).map(entry => [entry.id, {fling: entry.fling, naturalGift: entry.naturalGift}])),
};
const output = fileURLToPath(new URL('../../template/calc/ai/hardlove.js', import.meta.url));
await build({
  entryPoints: [fileURLToPath(new URL('../../template/calc/ai/browser.mjs', import.meta.url))],
  outfile: output, bundle: true, minify: true, format: 'iife', globalName: 'GUIDE_AI', target: 'es2020', legalComments: 'none',
  plugins: [{name: 'ai-metadata', setup(builder) {
    builder.onResolve({filter: /^guide-ai-metadata$/}, () => ({path: 'metadata', namespace: 'ai'}));
    builder.onLoad({filter: /.*/, namespace: 'ai'}, () => ({contents: `export default ${JSON.stringify(metadata)}`, loader: 'js'}));
  }}],
});
console.log(`AI bundle: ${(await stat(output)).size} bytes`);

import { existsSync, readFileSync } from 'node:fs';

const directory = new URL('../../hacks/blaze-black-2-redux/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
if (!existsSync(new URL('data.json', directory)) || !configuration.cfg.calc) {
  console.log('SKIP blaze-black-2-redux calc-check: no data.json or cfg.calc');
  process.exit(0);
}
throw new Error('TODO: implement blaze-black-2-redux source-backed engine fixtures before enabling cfg.calc');

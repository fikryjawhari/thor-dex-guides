import { existsSync, readFileSync } from 'node:fs';

const directory = new URL('../../hacks/unbound/', import.meta.url);
const configuration = JSON.parse(readFileSync(new URL('hack.json', directory), 'utf8'));
if (!existsSync(new URL('data.json', directory)) || !configuration.cfg.calc) {
  console.log('SKIP unbound calc-check: no data.json or cfg.calc');
  process.exit(0);
}
throw new Error('TODO: implement unbound source-backed engine fixtures before enabling cfg.calc');

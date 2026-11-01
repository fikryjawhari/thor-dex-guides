import { existsSync } from 'node:fs';
import { guideArg, readGuide } from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/radical-red.html');
if (!existsSync(file)) {
  console.log('SKIP calc-radical-red: no built guide');
  process.exit(0);
}
const guide = readGuide(file);
if (guide.data.cfg.name !== "Pok\u00e9mon Radical Red" || !guide.data.cfg.calc) {
  console.log('SKIP calc-radical-red: requires its enabled calc profile');
  process.exit(0);
}
throw new Error('TODO: implement radical-red profile scenarios before enabling cfg.calc');

import { existsSync } from 'node:fs';
import { guideArg, readGuide } from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/unbound.html');
if (!existsSync(file)) {
  console.log('SKIP calc-unbound: no built guide');
  process.exit(0);
}
const guide = readGuide(file);
if (guide.data.cfg.name !== "Pok\u00e9mon Unbound" || !guide.data.cfg.calc) {
  console.log('SKIP calc-unbound: requires its enabled calc profile');
  process.exit(0);
}
throw new Error('TODO: implement unbound profile scenarios before enabling cfg.calc');

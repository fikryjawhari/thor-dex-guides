import { existsSync } from 'node:fs';
import { guideArg, readGuide } from '../calc_check_lib.mjs';

const file = guideArg(process.argv, 'dist/blaze-black-2-redux.html');
if (!existsSync(file)) {
  console.log('SKIP calc-blaze-black-2-redux: no built guide');
  process.exit(0);
}
const guide = readGuide(file);
if (guide.data.cfg.name !== "Blaze Black 2 Redux" || !guide.data.cfg.calc) {
  console.log('SKIP calc-blaze-black-2-redux: requires its enabled calc profile');
  process.exit(0);
}
throw new Error('TODO: implement blaze-black-2-redux profile scenarios before enabling cfg.calc');

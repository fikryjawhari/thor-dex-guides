import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {runInContext} from 'node:vm';
import {loadOracle, oracleGeneration, oracleMatchup} from './hzla_compare.mjs';
import {resolveProfile} from './run.mjs';
import {unboundCases} from './unbound_cases.mjs';

const repo = resolve(process.argv[2] || '.tmp/hzla');
const head = spawnSync('git', ['-C',repo,'rev-parse','HEAD'], {encoding:'utf8'});
assert.equal(head.status,0,head.stderr);
assert.equal(head.stdout.trim(),'ff6c3e339e276e6b4e8e44db58750b6534bc26aa','complete oracle checkout pin');
const status = spawnSync('git', ['-C',repo,'status','--porcelain','--untracked-files=no'], {encoding:'utf8'});
assert.equal(status.status,0,status.stderr);
assert.equal(status.stdout.trim(),'','oracle has no tracked edits');
for (const [path, expected] of Object.entries({
  'calc/mechanics/romhacks/profiles/unbound.js':'42eb9896924205f8042d57030c863bd26515abb0',
  'calc/mechanics/gen789.js':'034de2610d94bb603fcfea9224f7d36da6901776',
  'backups/unbound.js':'132f40351fc72af8278d998c068f6bb0c5a511ef',
  'js/unbound_adapter.js':'e677a7334114396d2da53ea830cca043a8265678',
})) {
  const hash = spawnSync('git', ['hash-object', resolve(repo,path)], {encoding:'utf8'});
  assert.equal(hash.status, 0, hash.stderr);
  assert.equal(hash.stdout.trim(), expected, path+' pinned blob');
}
const data = JSON.parse(readFileSync(new URL('../../hacks/unbound/data.json', import.meta.url),'utf8'));
const config = JSON.parse(readFileSync(new URL('../../hacks/unbound/hack.json', import.meta.url),'utf8'));
const profile = await resolveProfile(config.cfg.calc);
const options = {title:'Pokemon Unbound', gen:8, damageGen:8, critGen:6, types:6, backup:'unbound'};
const oracle = loadOracle(repo, {...options, backup:undefined});
runInContext(readFileSync(resolve(repo,'js/unbound_adapter.js'),'utf8'),oracle.context);
runInContext(readFileSync(resolve(repo,'backups/unbound.js'),'utf8'),oracle.context);
const normalized = oracle.context.normalizeUnboundDataSource(oracle.context, 'expert');
assert.ok(Object.keys(normalized.formatted_sets).length, 'Expert sets selected');
oracle.context.backup_moves = normalized.moves;
const generation = oracleGeneration(oracle.calc, data, options, profile);
const results = unboundCases(data).map(test => ({name:test.name, ...oracleMatchup(oracle,generation,data,profile,options,test)}));
const descriptionModule = {exports:{}};
const descriptionSource = readFileSync(resolve(repo,'calc/desc.js'),'utf8');
const exposeEndOfTurn = runInContext(`(function(require,module,exports){${descriptionSource}\nexports.guideEndOfTurn=getEndOfTurn;})`,oracle.context);
exposeEndOfTurn(request=>oracle.load(resolve(repo,'calc',request)),descriptionModule,descriptionModule.exports);
const neutral = new oracle.calc.Pokemon(generation,'Mew',{level:50,ability:'Guide no ability'});
const tackle = new oracle.calc.Move(generation,'Tackle');
const residual = {};
for (const weather of ['Sand','Vicious Sandstorm']) {
  residual[weather] = descriptionModule.exports.guideEndOfTurn(generation,neutral,neutral,tackle,new oracle.calc.Field({weather}));
}
const output = {sha:'ff6c3e339e276e6b4e8e44db58750b6534bc26aa', options, residual, results};
const destination = resolve(process.argv[3] || '.tmp/unbound-calc/oracle.json');
writeFileSync(destination, JSON.stringify(output,null,2)+'\n');
console.log(`Unbound oracle: ${results.length} cases -> ${destination}`);

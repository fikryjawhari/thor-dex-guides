import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../template/dex.js',import.meta.url),'utf8');
const start=source.indexOf('const icon=');
const end=source.indexOf('const plink=',start);
assert.ok(start>=0&&end>start);
const context=vm.createContext({D:{IC:{First:0,LastColumn:15,NextRow:16,Last:424}}});
vm.runInContext(source.slice(start,end),context);
for(const [name,slot] of Object.entries(context.D.IC)){
 for(const size of [16,24,32,48]){
  const markup=vm.runInContext(`icon(${JSON.stringify(name)},${size})`,context);
  assert.ok(markup.includes(`--icon-size:${size}px`));
  assert.ok(markup.includes(`background-position:${-(slot%16)*size}px ${-Math.floor(slot/16)*size}px`));
  assert.ok(markup.includes('aria-hidden="true"'));
  assert.ok(!markup.includes('data:image'));
 }
}
assert.ok(vm.runInContext('icon("First")',context).includes('--icon-size:24px'));
assert.ok(vm.runInContext('iconCard("First")',context).includes('--icon-size:32px'));
for(const name of ['Missing','toString','__proto__','<script>']){
 assert.equal(vm.runInContext(`icon(${JSON.stringify(name)},24)`,context),'');
 assert.equal(vm.runInContext(`iconCard(${JSON.stringify(name)})`,context),'<span class="item-icon-spacer" aria-hidden="true"></span>');
}
context.D={};
assert.equal(vm.runInContext('icon("First")',context),'');
console.log('PASS item icon helpers: slot zero, columns/rows, scaling, unknown names, card spacer, absent map');

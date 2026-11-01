"""Committed RR Showdown + RR calculator metadata. Builds require no Node.

Refresh after updating the pinned sources: uv run python -I hacks/radical-red/extract/moves.py --refresh
Only the pinned Showdown/calc TypeScript is loaded in a restricted Node context; never data.js.
"""
import json
from pathlib import Path
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import DATA, H, key, move, report
import cfru


READER = r"""
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
const root = process.argv[2];
function table(path, name) {
  const source = stripTypeScriptTypes(readFileSync(resolve(root, path), 'utf8'))
    .replace(/^import .*;\s*$/gm, '').replace(`export const ${name}`, `globalThis.${name}`);
  const context = {};
  runInNewContext(source, context, {timeout: 10000});
  return context[name];
}
const moves = table('pokemon-showdown/data/moves.ts', 'Moves');
const patches = table('pokemon-showdown/data/mods/gen9rr/moves.ts', 'Moves');
const abilities = table('pokemon-showdown/data/abilities.ts', 'Abilities');
const abilityPatches = table('pokemon-showdown/data/mods/gen9rr/abilities.ts', 'Abilities');
const merged = {...moves};
for (const [name, patch] of Object.entries(patches)) {
  merged[name] = patch.inherit ? {...moves[name], ...patch} : patch;
}
function extend(deep, target, ...objects) {
  for (const object of objects) for (const [name, value] of Object.entries(object)) {
    target[name] = value && typeof value === 'object' && !Array.isArray(value)
      ? extend(true, {...target[name]}, value) : value;
  }
  return target;
}
let source = stripTypeScriptTypes(readFileSync(resolve(root, 'damage-calc/calc/src/data/moves.ts'), 'utf8'));
source = source.slice(0, source.indexOf('export class Moves')).replace(/^import .*;\s*$/gm, '')
  .replace('export const MOVES', 'globalThis.MOVES');
const context = {extend};
runInNewContext(source, context, {timeout: 10000});
const calc = context.MOVES[9];
const fields = ['name', 'flags', 'target', 'secondary', 'secondaries', 'self', 'status', 'boosts',
  'volatileStatus', 'recoil', 'drain', 'heal', 'multihit', 'hasCrashDamage', 'mindBlownRecoil',
  'accuracy', 'basePower', 'category', 'type', 'pp', 'priority', 'desc', 'shortDesc', 'willCrit', 'critRatio'];
const numeric = ['type', 'category', 'basePower', 'accuracy', 'pp', 'priority', 'target'];
const calcFields = ['makesContact', 'isPunch', 'isBite', 'isBullet', 'isSound', 'isPulse', 'isSlicing',
  'isWind', 'isKick', 'isBone', 'recoil', 'drain', 'multihit', 'hasCrashDamage', 'secondaries', 'target', 'willCrit'];
const records = {};
for (const [id, move] of Object.entries(merged)) {
  const record = Object.fromEntries(fields.filter(field => move[field] != null).map(field => [field, move[field]]));
  record.reliableProtect = true;
  record.original = Object.fromEntries(numeric.filter(field => moves[id]?.[field] != null).map(field => [field, moves[id][field]]));
  if (patches[id]) record.rrText = patches[id].shortDesc || patches[id].desc || '';
  const custom = calc[move.name];
  if (custom) {
    for (const field of calcFields) if (custom[field] != null) record[field] = custom[field];
    if (custom.secondaries === false) { delete record.secondary; delete record.secondaries; }
  }
  if (record.flags) {
    record.flags = {...record.flags};
    for (const [field, flag] of Object.entries({isSlicing:'slicing', isWind:'wind', isKick:'kick', isBone:'bone'})) {
      if (custom && field in custom) { delete record.flags[flag]; if (custom[field]) record.flags[flag] = 1; }
    }
  }
  if (['triattack', 'direclaw'].includes(id)) {
    const statuses = id === 'triattack' ? ['brn', 'par', 'frz'] : ['psn', 'par', 'slp'];
    if (!statuses.every(status => String(move.secondary.onHit).includes(`'${status}'`))) throw new Error(id + ' callback drift');
    record.effectOverrides = [{chance: move.secondary.chance, alternatives: statuses.map(status => ({kind:'status', status}))}];
  }
  if (id === 'fakeout') record.effectOverrides = [{kind:'flinch', condition:'first turn out only'}];
  if (id === 'burningjealousy') record.effectOverrides = [{kind:'status', status:'brn', condition:'target raised stats this turn'}];
  if (id === 'struggle') { record.recoil = [1,4]; record.recoilBasis = 'maxhp'; }
  if (id === 'rest') record.heal = [1,1];
  if (id === 'junglehealing') record.heal = [1,4];
  if (id === 'healpulse') record.heal = [1,2];
  if (id === 'pollenpuff') record.effectOverrides = [{kind:'heal', fraction:[1,2], condition:'ally target only'}];
  if (id === 'purify') record.effectOverrides = [{kind:'heal', fraction:[1,2], condition:'user, after curing the target'}];
  if (['morningsun', 'synthesis', 'moonlight'].includes(id)) record.effectOverrides = [
    {kind:'heal', fraction:[1,2], condition:'no weather'},
    {kind:'heal', fraction:[2,3], condition:'sun'},
    {kind:'heal', fraction:[1,4], condition:'other weather'},
  ];
  if (id === 'shoreup') record.effectOverrides = [
    {kind:'heal', fraction:[1,2], condition:'no sandstorm'},
    {kind:'heal', fraction:[2,3], condition:'sandstorm'},
  ];
  if (id === 'secretpower') record.effectOverrides = [
    {kind:'status', status:'par', chance:30, condition:'no terrain or Electric Terrain'},
    {kind:'status', status:'slp', chance:30, condition:'Grassy Terrain'},
    {kind:'stages', stages:{spa:-1}, chance:30, condition:'Misty Terrain'},
    {kind:'stages', stages:{spe:-1}, chance:30, condition:'Psychic Terrain'},
  ];
  records[id] = record;
}
const abilityRecords = {};
for (const [id, patch] of Object.entries(abilityPatches)) {
  abilityRecords[id] = {original:abilities[id]?.desc || abilities[id]?.shortDesc || '',
    text:patch.desc || patch.shortDesc || '', new:!abilities[id]};
}
console.log(JSON.stringify({moves:records, abilities:abilityRecords}));
"""


ALIASES = {'Soupercell Slam': 'supercellslam', 'Faint Attack': 'feintattack', 'Infernal Parade': 'infernalparade',
           'Hidden Power': 'hiddenpower', 'Vise Grip': 'visegrip'}
HAND = {'Metal Bash': {'target': 'normal', 'flags': {'contact': 1}}}


def refresh():
    result = subprocess.run(['node', '--input-type=module', '-', str(Path(H.src) / 'repos')], input=READER,
                            text=True, encoding='utf-8', capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    raw = json.loads(result.stdout)
    moves, missing = {}, []
    names = sorted({move(ident) for ident in DATA['moves'] if move(ident)}, key=str.lower)
    for name in names:
        record = raw['moves'].get(ALIASES.get(name, key(name)))
        if record is None:
            missing.append(name)
        else:
            moves[name] = record
    snapshot = {'sources': {'showdown': 'RadicalRedShowdown/pokemon-showdown 54955790eb71a0fb0a881850f1e8afed3bfe25bd: data/moves.ts + data/mods/gen9rr/moves.ts',
                            'calc': 'RadicalRedShowdown/damage-calc 7f3540035176b3db4386871956eec1c309aea26e: calc/src/data/moves.ts MOVES[9]',
                            'abilities': 'same Showdown pin: data/abilities.ts + data/mods/gen9rr/abilities.ts'},
                'moves': moves, 'abilities': raw['abilities'], 'missing': missing}
    path = Path(__file__).with_name('move_metadata.json')
    lines = ['{', ' "sources": ' + json.dumps(snapshot['sources'], ensure_ascii=False) + ',', ' "moves": {']
    lines.append(',\n'.join('  ' + json.dumps(name, ensure_ascii=False) + ': ' + json.dumps(record, ensure_ascii=False)
                           for name, record in moves.items()))
    lines.extend([' },', ' "abilities": ' + json.dumps(snapshot['abilities'], ensure_ascii=False) + ',',
                  ' "missing": ' + json.dumps(missing), '}'])
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('snapshot: %d moves; no structured source: %s' % (len(moves), ', '.join(missing) or 'none'))


def build(data):
    snapshot = json.loads(Path(__file__).with_name('move_metadata.json').read_text(encoding='utf-8'))
    missing, disagreements, changed = [], [], 0
    source_moves = {move(ident): row for ident, row in DATA['moves'].items() if move(ident)}
    for name, entry in zip(data['M'], data['MV']):
        record = snapshot['moves'].get(name) or HAND.get(name)
        if record is None:
            missing.append(name)
            continue
        record = json.loads(json.dumps(record))
        row = source_moves[name]
        if row['secondaryEffectChance'] and isinstance(record.get('secondary'), dict):
            chance = record['secondary'].get('chance', 100)
            if chance != row['secondaryEffectChance']:
                disagreements.append('%s secondary chance: official %s; Showdown %s'
                                     % (name, row['secondaryEffectChance'], chance))
                record['secondary']['chance'] = row['secondaryEffectChance']
        entry.update(cfru.move_metadata(record, entry['c'] != 'Status'))
        if name in HAND:
            report('  description-derived metadata: %s: %s' % (name, row['description']))
        if entry.get('se'):
            for effect in entry['se']:
                effect[1] = effect[1].replace('freeze', 'frostbite')
        if record.get('willCrit'):
            entry['cr'] = 6
        elif record.get('critRatio', 1) > 1:
            entry['cr'] = record['critRatio'] - 1
        for field, source_field in (('basePower', 'power'), ('accuracy', 'accuracy'), ('pp', 'pp'), ('priority', 'priority')):
            theirs = record.get(field)
            if theirs is not None and theirs != row[source_field] and not (theirs is True and not row[source_field]):
                disagreements.append('%s %s: official %s; Showdown %s' % (name, field, row[source_field], theirs))
        original = record.get('original', {})
        comparisons = [('type', 'Type', entry['t']), ('category', 'Category', entry['c']), ('basePower', 'Power', entry['bp']),
                       ('accuracy', 'Accuracy', entry['ac'] if entry['ac'] is not None else True),
                       ('pp', 'PP', entry['pp']), ('priority', 'Priority', entry['pr'])]
        for field, label, value in comparisons:
            if field in original and original[field] != value:
                entry['h'].append('%s: %s -> %s' % (label, original[field], value))
        if record.get('rrText'):
            entry['h'].append(record['rrText'])
        if entry['h']:
            entry['dc'] = 1
            changed += 1
    for entry in data['AB']:
        row = snapshot['abilities'].get(key(entry[0]))
        if row:
            text = row['text'] or entry[1]
            entry[:] = [entry[0], entry[1], int(row['new']), text, entry[1], row['original']]
    report('move metadata: %d structured; %d description-derived; %d missing; %d changed markers'
           % (len(data['M']) - len(missing) - len(HAND), len(HAND), len(missing), changed))
    for name in missing:
        report('  no structured source: %s: %s' % (name, source_moves[name]['description']))
    report('move metadata number disagreements (official dex retained): %d' % len(disagreements))
    for line in disagreements:
        report('  ' + line)
    report('ability changed markers: %d from RR Showdown; descriptions remain official in-game text'
           % sum(len(row) > 3 for row in data['AB']))


if __name__ == '__main__':
    if sys.argv[1:] != ['--refresh']:
        raise SystemExit('Usage: moves.py --refresh')
    refresh()

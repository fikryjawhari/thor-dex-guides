"""Simulated hack updates against tools/trainer_keys.py on each built guide's data.json and table (temporary copies;
nothing in the repo is written). uv run python -I tools/trainer_keys_test.py [hack ...]"""
import copy
import json
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import trainer_keys  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.stdout.reconfigure(encoding='utf-8')


def run(hack, ids):
    D = json.load(open(os.path.join(ROOT, 'hacks', hack, 'data.json'), encoding='utf-8'))
    src = os.path.join(ROOT, 'hacks', hack, 'extract', 'trainer_keys.json')
    tmp = tempfile.mkdtemp()
    path = os.path.join(tmp, 'trainer_keys.json')
    shutil.copy(src, path)
    lines = []
    assert not trainer_keys.check(D, path), trainer_keys.check(D, path)
    if ids:     # as a fresh extract has them (the schema drops them from data.json)
        by_key = {e['k']: e for e in json.load(open(src, encoding='utf-8'))}
        if not any('id' in e for e in by_key.values()):
            return
        for t in trainer_keys.trainers(D):
            if 'id' in by_key[t['k']]:
                t['id'] = by_key[t['k']]['id']
    # Re-finishing the published data changes nothing: same keys, same table.
    same = copy.deepcopy(D)
    trainer_keys.stabilise(same, path, lines.append)
    assert same == D and not lines and open(path, encoding='utf-8').read() == open(src, encoding='utf-8').read(), lines
    # An update: every trainer renumbered by position as an extract would ("g.s.t"), a trainer inserted at the front
    # of the first section, the second trainer's team changed, the third moved to another place, the fourth renamed, the
    # fifth removed.
    U = copy.deepcopy(D)
    ts = trainer_keys.trainers(U)
    want = {id(t): t['k'] for t in ts}
    first = U['TR']['g'][0]['sec'][0]['tr']
    added = copy.deepcopy(first[0])
    added.update(n='Inserted Trainer', loc='Nowhere')
    first.insert(0, added)
    ts[1]['p'] = ts[1]['p'][::-1] + ts[1]['p'][:1]
    ts[2]['loc'] = 'Somewhere Else'
    ts[3]['n'] += ' Renamed'
    removed = ts[4]
    for g in U['TR']['g']:
        for s in g['sec']:
            if removed in s['tr']:
                s['tr'].remove(removed)
    old = {}
    for gi, g in enumerate(U['TR']['g']):
        for si, s in enumerate(g['sec']):
            for ti, t in enumerate(s['tr']):
                old[t['k']] = f'{gi}.{si}.{ti}' if t is not added else old.get(t['k'])
                t['k'] = f'{gi}.{si}.{ti}'
    added_key = added['k']
    for split in U['WK']['splits']:
        for stop in split['st']:
            if 'tr' in stop:
                stop['tr'] = [old[k] for k in stop['tr'] if k in old]
    lines.clear()
    trainer_keys.stabilise(U, path, lines.append)
    got = {id(t): t['k'] for t in trainer_keys.trainers(U)}
    table = json.load(open(path, encoding='utf-8'))
    assert got[id(added)] == f't{len(table) - 1}', got[id(added)]
    wrong = [(want[i], got[i]) for i in want if i in got and want[i] != got[i]]
    assert not wrong, wrong[:5]
    keys = [t['k'] for t in trainer_keys.trainers(U)]
    assert all(k in keys for split in U['WK']['splits'] for stop in split['st'] for k in stop.get('tr', [])), 'walk refs'
    W = copy.deepcopy(D['WK'])
    for split in W['splits']:
        for stop in split['st']:
            if 'tr' in stop:
                stop['tr'] = [k for k in stop['tr'] if k != want[id(removed)]]
    for split in U['WK']['splits']:
        for stop in split['st']:
            if 'tr' in stop:
                stop['tr'] = [k for k in stop['tr'] if k != added['k']]
    assert W == U['WK'], 'walkthrough references follow the keys'
    assert any(line.startswith('  ' + want[id(removed)] + ':') for line in lines), 'a removed trainer is reported'
    heads = [line for line in lines if not line.startswith('  ')]
    print(hack, 'with game ids' if ids else 'as data.json', 'ok:', '; '.join(heads), '| first new key', got[id(added)], '(was', added_key + ')')
    shutil.rmtree(tmp)


for hack in sys.argv[1:] or ['emerald-imperium', 'eternal-x', 'hardlove-gold', 'photonic-sun']:
    run(hack, False)
    run(hack, True)

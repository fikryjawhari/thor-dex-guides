"""Stable trainer keys: a trainer's k is set once and never changes, so saved state keyed by it (level caps, the calc's
foe, recents and edits, the Trainers page's open boxes) keeps its meaning when a hack update adds or moves trainers.

    stabilise(D, path, report)   extractlib.finalise runs it on every build, before the schema drops trainer ids

The extracts still number trainers by position ("g.s.t" while they build); the table hacks/<hack>/extract/trainer_keys.json
(committed, one entry per key ever given, in the order given) maps each trainer to its key by identity:
    {"k": key, "n": name, "loc": place, ["st": starter variant], ["pl": player variant], ["id": game trainer id], "sp": [species ids]}
Matching goes in rounds, strictest first; within a round equal identities pair in order. A round with "id" only pairs
trainers and entries that both have a game id (a fresh extract has them; a re-finished data.json has none). Matched entries take the trainer's
current identity (an "id" stays when the data has none). A trainer nothing matches gets a new key "t<N>" (N = the
table's length, so no key is ever given twice). An entry nothing matches stays in the table (a trainer removed, or
renamed with a new team: then the user's state for it is lost unless its entry is edited by hand to the new name).
No table yet (a guide's first build, or the 2026-10-29 switch): the current keys are written as the table unchanged.
Everything but strict matches is reported (the build report): loose matches, new keys, entries left unmatched.
"""
import json
import os

ROUNDS = [
    ('id', 'n', 'loc', 'st', 'pl', 'sp'),
    ('id', 'n', 'st', 'pl'),
    ('n', 'loc', 'st', 'pl', 'sp'),
    ('n', 'loc', 'st', 'pl'),
    ('n', 'st', 'pl', 'sp'),
    ('id', 'st', 'pl', 'sp'),      # renamed: same game trainer and team
    ('loc', 'st', 'pl', 'sp'),     # renamed: same place and team
]
FIELDS = ('k', 'n', 'loc', 'st', 'pl', 'id', 'sp')


def trainers(D):
    return [t for g in D['TR']['g'] for s in g['sec'] for t in s['tr']]


def identity(t):
    """A trainer's identity as the table stores it (no empty st / pl, id only when the extract has one)."""
    out = {'n': t['n'], 'loc': t.get('loc', '')}
    for f in ('st', 'pl', 'id'):
        if t.get(f) not in (None, ''):
            out[f] = t[f]
    out['sp'] = [m['id'] for m in t['p']]
    return out


def sig(x, fields):
    return json.dumps([x.get(f) for f in fields], ensure_ascii=False)


def read(path):
    if not os.path.exists(path):
        return None
    return json.load(open(path, encoding='utf-8'))


def write(path, table):
    lines = [json.dumps({f: e[f] for f in FIELDS if f in e}, ensure_ascii=False, separators=(',', ':')) for e in table]
    text = '[\n' + ',\n'.join(lines) + '\n]\n'
    if not os.path.exists(path) or open(path, encoding='utf-8').read() != text:
        open(path, 'w', encoding='utf-8', newline='\n').write(text)


def match(table, ts):
    """Pairs (table index, trainer index) by identity, and the round each matched in."""
    free_e, free_t, pairs = list(range(len(table))), list(range(len(ts))), {}
    idents = [identity(t) for t in ts]
    for r, fields in enumerate(ROUNDS):
        groups = {}
        for i in free_e:
            if 'id' in fields and 'id' not in table[i]:
                continue
            groups.setdefault(sig(table[i], fields), []).append(i)
        for j in free_t:
            if 'id' in fields and 'id' not in idents[j]:
                continue
            q = groups.get(sig(idents[j], fields))
            if q:
                pairs[j] = (q.pop(0), r)
        used = {i for i, _ in pairs.values()}
        free_e = [i for i in free_e if i not in used]
        free_t = [j for j in free_t if j not in pairs]
    return pairs


def stabilise(D, path, report):
    """Give every trainer its key from the table at path (adding new ones), rename the walkthrough's references."""
    ts = trainers(D)
    assert len({t['k'] for t in ts}) == len(ts), 'trainer keys: the extract gave two trainers one key'
    table = read(path)
    if table is None:
        write(path, [dict(k=t['k'], **identity(t)) for t in ts])
        report(f'trainer keys: new table {os.path.relpath(path)} ({len(ts)} trainers, keys as they are)')
        return
    pairs = match(table, ts)
    remap, loose, new = {}, [], []
    for j, t in enumerate(ts):
        ident = identity(t)
        if j in pairs:
            i, r = pairs[j]
            e = table[i]
            if r != (0 if 'id' in ident else 2):
                loose.append(f"  {e['k']}: {e['n']} ({e.get('loc', '')}) matched on {', '.join(ROUNDS[r])}")
            if 'id' not in ident and 'id' in e:
                ident['id'] = e['id']
            table[i] = dict(k=e['k'], **ident)
        else:
            table.append(dict(k=f't{len(table)}', **ident))
            new.append(f"  {table[-1]['k']}: {t['n']} ({t.get('loc', '')})")
        remap[t['k']] = table[pairs[j][0]]['k'] if j in pairs else table[-1]['k']
    assert len(set(remap.values())) == len(ts), 'trainer keys: two trainers got one key'
    for t in ts:
        t['k'] = remap[t['k']]
    for split in D['WK']['splits']:
        for stop in split['st']:
            if 'tr' in stop:
                assert all(k in remap for k in stop['tr']), f"walkthrough stop {stop.get('k')}: a trainer key not in TR"
                stop['tr'] = [remap[k] for k in stop['tr']]
    used = {i for i, _ in pairs.values()}
    gone = [f"  {e['k']}: {e['n']} ({e.get('loc', '')})" for i, e in enumerate(table) if i not in used and i < len(table) - len(new)]
    for title, lines in (('matched loosely', loose), ('new keys', new), ('table entries no trainer matched', gone)):
        if lines:
            report(f'trainer keys: {len(lines)} {title}')
            for line in lines:
                report(line)
    write(path, table)


def check(D, path):
    """Problems with a built data.json's trainer keys against its table: keys missing from the table, or not unique."""
    table = read(path) or []
    known = {e['k'] for e in table}
    keys = [t['k'] for t in trainers(D)]
    out = [f'{k}: not in {os.path.basename(path)}' for k in keys if k not in known]
    if len(set(keys)) != len(keys):
        out.append('duplicate trainer keys')
    return out

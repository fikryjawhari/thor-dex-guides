"""The data.json schema, applied at the end of every build (extractlib.finalise): the same keys in the same order in
every hack's data.json, so the four files look like one template with only the data changed.

    standardise(D)     drops what nothing reads, omits empty optional fields, gives every walkthrough stop its key,
                       puts every object's keys in the canonical order below. Idempotent (a built data.json goes through
                       it unchanged), so a published data.json can be re-finished without its raw sources.

What the template reads is in hacks/emerald-imperium/notes.md (Data schema). A key that is not in ORDER raises: add it
there (and to the notes) when a hack gets a new field.
Trainer normal {easy, p} is an optional secondary Normal team; easy is its Easy level decrement. Mon l is displayed,
sl is an optional different stat level, hn is a list of hzla disagreement notes. Missing data changes no rendering.
"""

# Canonical key order per object kind. Optional fields (omitted when empty) are marked in the notes, not here.
ORDER = {
    'top': ['M', 'MV', 'AB', 'P', 'LOC', 'AR', 'ARO', 'IT', 'WK', 'TR', 'TC', 'GID', 'built'],
    'P': ['id', 'n', 'dex', 't', 'a', 'ha', 's', 'ef', 'et', 'of', 'lv', 'tm', 'tu', 'eg', 'w', 'g', 'hi',
          'stone', 'sloc', 'nu', 'fc', 'cf'],
    'MV': ['t', 'c', 'bp', 'ac', 'pp', 'pr', 'cr', 'd', 'f', 'h', 'dc', 'e', 'cf', 'x'],
    'AR': ['n', 'l', 'st', 'sub', 'in', 'es', 'map', 'ns', 'note'],
    'IT': ['n', 'k', 'note', 'r'],
    'WK': ['splits', 'np', 'docs', 'ko', 'cheats', 'cnote'],
    'split': ['n', 'note', 'st'],
    'stop': ['k', 'n', 'a', 's', 'note', 'it', 'tr', 'x'],
    'mission': ['m', 'n', 'u', 'r', 'note', 's'],
    'mission_step': ['k', 't', 'n'],
    'TR': ['g', 'caps'],
    'group': ['n', 'cap', 'tab', 'note', 'sec'],
    'section': ['h', 'cap', 'note', 'opt', 'rw', 'tr'],
    'trainer': ['k', 'n', 'loc', 'tags', 'st', 'cap', 'note', 'field', 'rw', 'pp', 'c', 'bt', 'pl', 'pt', 'p', 'normal'],
    'normal': ['easy', 'p'],
    'partner': ['n', 'st', 'pl', 'p'],
    'mon': ['id', 'l', 'sl', 'r', 'i', 'a0', 'a', 'ao', 'na', 'iv', 'ev', 'm', 'hp', 'ld', 'au', 'pre', 'x', 'cf', 'hn', 'src'],
}


def order(obj, kind):
    """obj's keys in ORDER[kind]; any key the list lacks is an error (a new field must be added to it)."""
    keys = ORDER[kind]
    extra = [k for k in obj if k not in keys and not k.startswith('_')]    # '_x' keys are build scratch (not written)
    if extra:
        raise KeyError(f'{kind}: key(s) {extra} are not in tools/schema.py ORDER')
    out = {k: obj[k] for k in keys if k in obj} | {k: v for k, v in obj.items() if k.startswith('_')}
    obj.clear()
    obj.update(out)
    return obj


def empty(v):
    return v is None or v == '' or v == [] or v == {}


def drop_empty(obj, *keys):
    for key in keys:
        if key in obj and empty(obj[key]):
            del obj[key]


def standardise(D):
    # Fields nothing reads: build markers and provenance strings, an old comparison log, ids the page never shows.
    for key in ('s7', 'su', 'src'):
        D.pop(key, None)
    for p in D['P']:
        p.pop('vc', None)
        drop_empty(p, 'hi')
        order(p, 'P')
    for a in D['AB']:
        while len(a) > 2 and not a[-1]:
            a.pop()
    for m in D['MV']:
        order(m, 'MV')
    for a in D['AR']:
        a.pop('t', None)
        order(a, 'AR')
    for section in D['IT']:
        order(section, 'IT')

    wk = D['WK']
    for key in ('src', 'gc', 'legacyStops'):
        wk.pop(key, None)
    missions = set()
    for si, split in enumerate(wk['splits']):
        split.pop('cap', None)       # the cap is in the name: "Name Split [Cap N]"
        drop_empty(split, 'note')
        for ti, stop in enumerate(split['st']):
            stop.pop('cap', None)
            drop_empty(stop, 'note')
            # The stop's key: the identity saved ticks / collapse state follow when the layout changes (dex.js
            # migrateWalkState). A guide's stops get their first key from their position; it never changes after.
            stop.setdefault('k', f'{si}.{ti}')
            for step in stop.get('s', []):
                if not isinstance(step, dict):
                    assert isinstance(step, list) and len(step) == 2 and all(isinstance(part, str) for part in step), \
                        'walkthrough ordinary steps must be [text, note] pairs'
                    continue
                assert all(isinstance(step.get(field), str) and step[field].strip() for field in ('m', 'n')), \
                    'walkthrough missions require nonempty m and n'
                assert all(isinstance(step.get(field), str) for field in ('u', 'r')), \
                    'walkthrough missions require u and r strings'
                assert step['m'] not in missions, 'walkthrough mission keys must be globally unique'
                missions.add(step['m'])
                assert isinstance(step.get('s'), list) and step['s'], 'walkthrough missions require nonempty s'
                children = set()
                for child in step['s']:
                    assert isinstance(child, dict) and all(isinstance(child.get(field), str) and child[field].strip()
                                                          for field in ('k', 't')), \
                        'walkthrough mission children require nonempty k and t'
                    assert child['k'] not in children, 'walkthrough mission child keys must be unique within a mission'
                    children.add(child['k'])
                    assert 'n' not in child or isinstance(child['n'], str), 'mission child n must be a string'
                    order(child, 'mission_step')
                assert 'note' not in step or isinstance(step['note'], str), 'mission note must be a string'
                order(step, 'mission')
            order(stop, 'stop')
        order(split, 'split')
    keys = [stop['k'] for split in wk['splits'] for stop in split['st']]
    assert len(keys) == len(set(keys)), 'walkthrough stop keys must be unique'
    order(wk, 'WK')

    tr = D['TR']
    for key in ('fix', 'src', 'legacySections'):
        tr.pop(key, None)
    for group in tr['g']:
        group.pop('wk', None)
        drop_empty(group, 'note')
        for section in group['sec']:
            drop_empty(section, 'note')
            for t in section['tr']:
                t.pop('id', None)
                drop_empty(t, 'st', 'cap', 'c')
                for team in [t] + t.get('pt', []) + ([t['normal']] if 'normal' in t else []):
                    for mon in team['p']:
                        mon.pop('s', None)
                        drop_empty(mon, 'x')
                        order(mon, 'mon')
                for partner in t.get('pt', []):
                    order(partner, 'partner')
                if 'normal' in t:
                    order(t['normal'], 'normal')
                order(t, 'trainer')
            order(section, 'section')
        order(group, 'group')
    order(tr, 'TR')

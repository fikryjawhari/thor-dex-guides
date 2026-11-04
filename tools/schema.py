"""The data.json schema, applied at the end of every build (extractlib.finalise): the same keys in the same order in
every hack's data.json, so the four files look like one template with only the data changed.

    standardise(D)     drops what nothing reads, omits empty optional fields, gives every walkthrough stop its key,
                       puts every object's keys in the canonical order below. Idempotent (a built data.json goes through
                       it unchanged), so a published data.json can be re-finished without its raw sources.

What the template reads is in hacks/emerald-imperium/notes.md (Data schema). A key that is not in ORDER raises: add it
there (and to the notes) when a hack gets a new field.
Trainer normal {easy, p} is an optional secondary Normal team; easy is its Easy level decrement. Mon l is displayed,
sl is an optional different stat level, hn is a list of hzla disagreement notes. Missing data changes no rendering.
Walkthrough s accepts legacy [text, note] pairs or mission {m, n, u, r, note?, s}; mission children are {k, t, n?}.
IX is {item: [description, in-battle text, changed?]}; MV.b is optional in-battle text.
P.hi is [[item, percent?]] (null = unknown). Legacy names become [item, null], never guessed odds.
IT r[5] parallels text.splitlines(): pickup key or 0. WK it[4] is the matching key (or 0).
Trainer gc is the same ordered list of stable trainer keys on every member of a 2+ fight gauntlet; absent otherwise.
"""

# Canonical key order per object kind. Optional fields (omitted when empty) are marked in the notes, not here.
ORDER = {
    'top': ['M', 'MV', 'MI', 'AB', 'P', 'LOC', 'AR', 'ARO', 'ESV', 'IT', 'IX', 'WK', 'TR', 'TC', 'GID', 'built'],
    'P': ['id', 'n', 'dex', 't', 'a', 'ha', 's', 'ef', 'et', 'of', 'lv', 'tm', 'tu', 'eg', 'w', 'g', 'hi',
          'stone', 'sloc', 'nu', 'fc', 'cf'],
    'MV': ['t', 'c', 'bp', 'ac', 'pp', 'pr', 'cr', 'd', 'b', 'tg', 'f', 'se', 'h', 'dc', 'e', 'cf', 'x', 'aiEffect', 'aiChance'],
    'MI': ['a', 'i', 'w', 'e', 'm', 'h', 's'],
    'AR': ['n', 'l', 'st', 'sub', 'in', 'card', 'on', 'to', 'es', 'fo', 'map', 'ns', 'note'],
    'IT': ['n', 'k', 'note', 'r'],
    'WK': ['splits', 'np', 'docs', 'ko', 'cheats', 'cnote'],
    'split': ['n', 'note', 'st'],
    'stop': ['k', 'n', 'a', 'e', 's', 'note', 'it', 'tr', 'x'],
    'mission': ['m', 'n', 'u', 'r', 'note', 's'],
    'mission_step': ['k', 't', 'n'],
    'TR': ['g', 'caps'],
    'group': ['n', 'cap', 'tab', 'note', 'sec'],
    'section': ['h', 'cap', 'note', 'opt', 'rw', 'tr'],
    'trainer': ['k', 'n', 'loc', 'tags', 'st', 'cap', 'note', 'field', 'rw', 'pp', 'c', 'bt', 'pl', 'gc', 'pt', 'p', 'normal'],
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


def pickup_key(value):
    return value == 0 or isinstance(value, str) and value.startswith('p') and value[1:].isdigit()


def check_gauntlets(trainers):
    """Mirror dex.js TRS/rivalHidden/ptOf and calc.js D.TR, after finalise's walkthrough ordering."""
    rows = [trainer for group in trainers['g'] for section in group['sec'] for trainer in section['tr']]
    chains = []
    by_key = {trainer['k']: trainer for trainer in rows}
    for trainer in rows:
        if 'gc' not in trainer:
            continue
        chain = trainer['gc']
        assert isinstance(chain, list) and len(chain) >= 2, ('invalid gc list', trainer['k'])
        assert all(isinstance(key, str) and key and '~p' not in key for key in chain), 'gc must use trainer keys'
        assert len(set(chain)) == len(chain) and trainer['k'] in chain, ('invalid gc membership', trainer['k'])
        assert all(key in by_key for key in chain), ('unresolved gc key', chain)
        assert all(by_key[key].get('gc') == chain for key in chain), ('inconsistent gc lists', chain)
        assert len({by_key[key].get('st', '') for key in chain}) == 1, ('mixed gc starters', chain)
        assert len({by_key[key].get('pl', '') for key in chain}) == 1, ('mixed gc players', chain)
        if chain not in chains:
            chains.append(chain)
    if not chains:
        return
    starters = {trainer['st'] for trainer in rows if trainer.get('st')} or {''}
    players = {trainer['pl'] for trainer in rows if trainer.get('pl')} | {''}
    for starter in starters:
        for player in players:
            visible = lambda entry: (not entry.get('st') or not starter or entry['st'] == starter) and (
                not entry.get('pl') or not player or entry['pl'] == player)
            order = []
            for trainer in rows:
                if not visible(trainer):
                    continue
                order.append(trainer['k'])
                partners = trainer.get('pt', [])
                chosen = [index for index, partner in enumerate(partners) if visible(partner)]
                order.extend(trainer['k'] + '~p' + str(index) for index in (chosen or range(len(partners))))
            positions = {key: index for index, key in enumerate(order)}
            for chain in chains:
                if chain[0] not in positions:
                    continue
                start = positions[chain[0]]
                assert order[start:start + len(chain)] == chain, ('nonconsecutive gc', starter, player, chain)


def standardise(D):
    # Fields nothing reads: build markers and provenance strings, an old comparison log, ids the page never shows.
    for key in ('s7', 'su', 'src'):
        D.pop(key, None)
    for p in D['P']:
        p.pop('vc', None)
        if p.get('hi'):
            p['hi'] = [[held, None] if isinstance(held, str) else held for held in p['hi']]
            p['hi'] = [held for index, held in enumerate(p['hi']) if held not in p['hi'][:index]]
            assert all(isinstance(held, list) and 1 <= len(held) <= 2 and isinstance(held[0], str)
                       and (len(held) == 1 or held[1] is None or isinstance(held[1], (int, float))
                            and not isinstance(held[1], bool) and 0 <= held[1] <= 100) for held in p['hi']), 'invalid P.hi'
            assert len({held[0] for held in p['hi']}) == len(p['hi']), 'duplicate P.hi item'
            if p.get('stone'):
                p.pop('hi')
        drop_empty(p, 'hi')
        order(p, 'P')
    for a in D['AB']:
        while len(a) > 2 and not a[-1]:
            a.pop()
    for m in D['MV']:
        assert 'aiEffect' not in m or isinstance(m['aiEffect'], str), 'MV.aiEffect must be text'
        assert 'aiChance' not in m or isinstance(m['aiChance'], int) and 0 <= m['aiChance'] <= 100, 'MV.aiChance must be 0..100'
        assert 'b' not in m or isinstance(m['b'], str), 'MV.b must be text'
        drop_empty(m, 'b')
        order(m, 'MV')
    for name, text in D.setdefault('IX', {}).items():
        assert isinstance(name, str) and isinstance(text, list) and 2 <= len(text) <= 3, 'invalid IX entry'
        assert all(isinstance(value, str) for value in text[:2]), 'IX description and in-battle text must be strings'
        assert len(text) == 2 or text[2] in (False, True), 'IX changed marker must be boolean / 0 / 1'
    for interaction in D.get('MI', []):
        order(interaction, 'MI')
    for a in D['AR']:
        a.pop('t', None)
        order(a, 'AR')
    # Encounter standard: a member with its own card (card = the slot's floors it shows) and a plain member on it (on).
    for i, a in enumerate(D['AR']):
        if 'card' in a:
            slot = D['AR'][a['in']] if isinstance(a.get('in'), int) else None
            assert slot is not None and 'sub' not in slot and 'es' not in a, f'AR[{i}].card needs in = a slot and no es'
            floors = slot.get('fo') or sorted({g.get('f', '') for s in slot.get('es', []) for g in s['g']})
            assert a['card'] and all(isinstance(f, str) and f in floors for f in a['card']), f'AR[{i}].card: not floors of AR[{a["in"]}]'
        if 'to' in a:
            ok = lambda s: isinstance(s, int) and 0 <= s < len(D['AR']) and 'in' not in D['AR'][s] and 'sub' not in D['AR'][s]
            assert ok(a.get('in')) and 'es' not in a and 'card' not in a, f'AR[{i}].to needs in = a slot, no es / card'
            assert a['to'] and all(isinstance(t, list) and len(t) == 2 and ok(t[0]) and t[0] != a['in'] and t[1]
                                   and all(isinstance(p, str) for p in t[1]) for t in a['to']), f'AR[{i}].to: [[slot, [species id...]]...]'
        if 'on' in a:
            on = D['AR'][a['on']] if isinstance(a['on'], int) and 0 <= a['on'] < len(D['AR']) else None
            assert on is not None and 'card' in on and on['in'] == a.get('in'), f'AR[{i}].on needs a card member of the same slot'
    for section in D['IT']:
        for row in section['r']:
            assert len(row) == 6 and isinstance(row[5], list) and len(row[5]) == len(row[1].splitlines()), 'invalid IT pickup keys'
            assert all(pickup_key(key) for key in row[5]), 'invalid IT pickup key'
        order(section, 'IT')

    wk = D['WK']
    for row in wk['np'] + [row for split in wk['splits'] for stop in split['st'] for row in stop['it']]:
        assert len(row) == 5 and pickup_key(row[4]), 'invalid WK item pickup key'
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
            if 'e' in stop:  # a return visit's new encounter lines: {slot AR index: [line label, ...]}
                e = stop['e']
                assert isinstance(e, dict) and e and all(k.isdigit() and int(k) < len(D['AR']) and isinstance(v, list) and v
                    and all(isinstance(x, str) for x in v) for k, v in e.items()), f'stop {stop["k"]}: e = {{slot: [label...]}}'
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
    check_gauntlets(tr)

"""P, M/MV, AB and TC from the official 4.1 dex, checked against RomHackDex.

Source ability slots: hidden/primary/secondary; stats: HP/Atk/Def/Spe/SpA/SpD.
No source is executed. Evolution templates are decoded explicitly, not evaluated.
"""
from collections import Counter, defaultdict
from pathlib import Path

import cfru
from romhackdex import Mirror, key
from common import (DATA, FORM_KEYS, H, MOVE_IDS, SPECIES, SPECIES_NAMES, ability, item, move,
                    report, sid, type_name)


TARGETS = {0: 'normal', 1: 'scripted', 2: 'adjacentAllyOrSelf', 4: 'randomNormal', 8: 'allAdjacentFoes',
           16: 'self', 32: 'allAdjacent', 64: 'foeSide'}


def evolution_text(edge):
    method, value, target, extra = edge
    level = 'level %d' % value
    if method in (1, 2, 3):
        return 'level up with high friendship' + {1: '', 2: ' (day)', 3: ' (night)'}[method]
    if method in (4, 13):
        return cfru.evo_text('Level %d' % value)
    if method == 7:
        return 'using ' + item(value) + ((' (female)' if extra == 254 else ' (male)') if value == 101 else '')
    if method in (8, 9, 10):
        return level + ' with Attack ' + {8: '>', 9: '=', 10: '<'}[method] + ' Defence'
    if method in (11, 12):
        return level + ' (50% chance)'
    if method == 14:
        return 'evolve Nincada with a spare party slot and a Poké Ball'
    if method == 16:
        return level + ' with overworld rain'
    if method == 17:
        return 'level up with high friendship knowing a ' + type_name(value) + '-type move'
    if method == 18:
        return level + ' with a ' + type_name(extra) + '-type Pokémon in the party'
    if method in (20, 21, 22, 23):
        return level + ' (' + {20: 'male', 21: 'female', 22: 'night', 23: 'day'}[method] + ')'
    if method == 26:
        return 'level up knowing ' + move(value)
    if method == 27:
        return 'level up with ' + SPECIES_NAMES[sid(value)] + ' in the party'
    if method == 28:
        return level + ' (' + {1041: 'day', 5144: 'night'}.get(extra, 'dusk') + ')'
    if method in (30, 31):
        natures = ('Adamant, Brave, Docile, Hardy, Hasty, Impish, Jolly, Lax, Naive, Naughty, Rash, Quirky or Sassy'
                   if method == 30 else 'Bashful, Bold, Calm, Careful, Gentle, Lonely, Mild, Modest, Quiet, Relaxed, Serious or Timid')
        return level + ' with a ' + natures + ' nature'
    if method == 254:
        return 'knowing ' + move(value) if extra == 2 else 'holding ' + item(value)
    raise ValueError('Unknown evolution method: %s' % edge)


def egg_groups(value):
    """The source's egg groups (P.eg is egg moves, not breeding groups)."""
    record = SPECIES[str(value)] if str(value) in SPECIES else next(p for p in SPECIES.values() if sid(p['ID']) == sid(value))
    return list(dict.fromkeys(DATA['eggGroups'][str(group)] for group in record['eggGroup']))


def _cross_check(data):
    mirror = Mirror(str(Path(H.src) / 'romhackdex'))
    forms = cfru.forms(mirror)
    by_id = {row['id']: row for row in data['P']}
    duplicate_keys = defaultdict(list)
    for ident, record in SPECIES.items():
        duplicate_keys[key(record['key'])].append(ident)
    direct = {key(name): sid(ident) for ident, name in FORM_KEYS.items()}
    for group in duplicate_keys.values():
        if len(group) > 1:
            for index, ident in enumerate(group):
                raw_key = SPECIES[ident]['key'] + ('-' + str(index) if index else '')
                direct[key(raw_key)] = sid(ident)
    mapped, missing, differences = set(), [], Counter()
    for slug, page in mirror.species().items():
        form = forms[slug]
        base = mirror.species().get(cfru.VIRTUAL_BASE.get(form.base, form.base))
        base_name = cfru.species_name(base or page)
        ident = direct.get(key(slug)) or sid(slug) or sid(form.name(base_name))
        if ident is None:
            aliases = {'a': 'Alola', 'g': 'Galar', 'h': 'Hisui', 's': 'Sevii', 'p': 'Paldea',
                       'f': 'F', 'n': 'Midnight', 'giga': 'Mega', 'mega-giga': 'Mega', 'ice-rider': 'Ice',
                       'shadow-rider': 'Shadow', 'xl': 'Super', 'l': 'Large', 'm': '', 'small': 'Small'}
            suffix = aliases.get(form.suffix, form.suffix)
            ident = sid(base_name + ('-' + suffix if suffix else ''))
        if ident not in by_id:
            missing.append(slug)
            continue
        mapped.add(ident)
        ours = by_id[ident]
        fields = {'stats': (ours['s'], page.stats), 'types': (ours['t'], page.types),
                  'abilities': ({data['AB'][index][0] for index in ours['a']}, {cfru.official(name) for name in page.abilities}),
                  'hidden': (data['AB'][ours['ha']][0] if ours['ha'] >= 0 else None, cfru.official(page.hidden) if page.hidden else None),
                  'level-up': ({(level, data['M'][index]) for level, index in ours['lv']}, {(level, move(name) or name) for level, name in page.lv}),
                  'TM/HM': ({(label, data['M'][index]) for label, index in ours['tm']}, {(label, move(name) or name) for label, name in page.tm}),
                  'tutor': ({data['M'][index] for index in ours['tu']}, {move(name) or name for name in page.tutor}),
                  'egg': ({data['M'][index] for index in ours['eg']}, {move(name) or name for name in page.egg})}
        for field, (official, other) in fields.items():
            if official != other:
                differences[field] += 1
                if isinstance(official, set):
                    official_only, mirror_only = sorted(official - other, key=str), sorted(other - official, key=str)
                    report('  RomHackDex %s %s: official only %s; mirror only %s' % (slug, field, official_only, mirror_only))
                else:
                    report('  RomHackDex %s %s: official %s; mirror %s' % (slug, field, official, other))
    report('RomHackDex: %d pages; %d distinct P entries matched; %d pages unmatched; %d P entries not mirrored'
           % (len(forms), len(mapped), len(missing), len(by_id.keys() - mapped)))
    report('  RomHackDex unmatched pages: ' + ', '.join(missing))
    report('  Official species not mirrored: ' + ', '.join(sorted(by_id.keys() - mapped)))
    report('RomHackDex species differences (official data retained): ' + str(dict(differences)))
    move_diff, move_missing = Counter(), []
    mirror_moves = {move(row['n']) or row['n']: row for row in mirror.moves().values()}
    for name, entry in zip(data['M'], data['MV']):
        other = mirror_moves.get(name)
        if other is None:
            move_missing.append(name)
            continue
        for field in ('t', 'c', 'bp', 'ac', 'pp', 'pr'):
            ours = entry[field] or None if field == 'bp' else entry[field]
            if ours != other.get(field):
                move_diff[field] += 1
                report('  RomHackDex move %s %s: official %s; mirror %s' % (name, field, entry[field], other.get(field)))
    report('RomHackDex moves: %d in M; %d not mirrored; differences %s' % (len(data['M']), len(move_missing), dict(move_diff)))
    report('  Moves not mirrored: ' + ', '.join(move_missing))
    chart = mirror.type_chart()
    changed = [(attack, defend, value, chart.get(attack, {}).get(defend))
               for attack, row in data['TC'].items() for defend, value in row.items()
               if chart.get(attack, {}).get(defend) != value]
    report('type chart: %d types, %d RomHackDex differences: %s' % (len(data['TC']), len(changed), changed))


def build(data):
    names = sorted(set(MOVE_IDS.values()), key=str.lower)
    indexes = {name: index for index, name in enumerate(names)}
    ability_rows = {ability([row['ID'], index]): row['description'] for row in DATA['abilities'].values()
                    for index in range(len(row['names']))}
    abilities = sorted(ability_rows, key=str.lower)
    ability_indexes = {name: index for index, name in enumerate(abilities)}
    source_moves = {move(ident): row for ident, row in DATA['moves'].items() if move(ident)}
    calc_names = cfru.calc_names()
    move_rows = []
    for name in names:
        row = source_moves[name]
        entry = {'t': type_name(row['type']), 'c': DATA['splits'][str(row['split'])],
                 'bp': row['power'], 'ac': row['accuracy'] or None, 'pp': row['pp'], 'pr': row['priority'],
                 'd': cfru.clean(row['description']), 'tg': TARGETS[row['target']], 'h': []}
        if row['secondaryEffectChance']:
            entry['e'] = row['secondaryEffectChance']
        if name in cfru.HIGH_CRIT or name in cfru.ALWAYS_CRIT:
            entry['cr'] = 6 if name in cfru.ALWAYS_CRIT else 1
        if name not in calc_names:
            entry['x'] = 1
        move_rows.append(entry)
    pokemon = []
    for ident, row in sorted(SPECIES.items(), key=lambda pair: (pair[1]['dexID'], pair[1].get('order', 0), int(pair[0]))):
        form_key = FORM_KEYS[ident]
        mega = '-Mega' in form_key or '-Primal' in form_key
        species_id = sid(ident)
        entry = {'id': species_id, 'n': SPECIES_NAMES[species_id], 'dex': row['dexID'],
                 't': list(dict.fromkeys(type_name(value) for value in row['type'])),
                 'a': list(dict.fromkeys(ability_indexes[ability(value)] for value in row['abilities'][1:] if ability(value))),
                 'ha': ability_indexes[ability(row['abilities'][0])] if ability(row['abilities'][0]) else -1,
                 's': [row['stats'][index] for index in (0, 1, 2, 4, 5, 3)],
                 'ef': [], 'et': [], 'of': [], 'lv': [], 'tm': [], 'tu': [], 'eg': [], 'w': [], 'g': 1 if mega else 0}

        def mi(value):
            name = move(value)
            if name not in indexes:
                raise ValueError('Unknown learned move %s on %s' % (value, species_id))
            return indexes[name]

        entry['lv'] = [[level, mi(value)] for value, level in row['levelupMoves']]
        for slot in row.get('tmMoves', []):
            value = DATA['tmMoves'][str(slot)]
            if value:
                label = 'TM%02d' % (slot + 1) if slot < 120 else 'HM%02d' % (slot - 119)
                entry['tm'].append([label, mi(value)])
        entry['tu'] = list(dict.fromkeys(mi(DATA['tutorMoves'][str(slot)]) for slot in row.get('tutorMoves', [])
                                        if DATA['tutorMoves'][str(slot)]))
        entry['eg'] = list(dict.fromkeys(mi(value) for value in row.get('eggMoves', [])))
        held = defaultdict(int)
        common, rare = row['items']
        if common and common == rare:
            held[item(common)] = 100
        else:
            for value, chance in zip(row['items'], (50, 5)):
                if value:
                    held[item(value)] += chance
        if held:
            entry['hi'] = [[name, chance] for name, chance in held.items()]
        suffix = form_key[len(row['name']):].strip('-').lower()
        if not mega and (suffix in cfru.FORM_CHANGE or row['name'].lower() in cfru.TYPE_FORMS
                         or suffix in ('ice', 'shadow', 'hero', 'bloodmoon') and suffix != 'bloodmoon'):
            entry['fc'] = 1
        pokemon.append(entry)
    by_id = {row['id']: row for row in pokemon}
    families = defaultdict(list)
    for entry in pokemon:
        families[entry['dex']].append(entry)
    for entries in families.values():
        for entry in entries:
            entry['of'] = [other['id'] for other in entries if other != entry]
    for ident, row in SPECIES.items():
        parent = by_id[sid(ident)]
        for edge in row.get('evolutions', []):
            target = by_id[sid(edge[2])]
            how = evolution_text(edge)
            if edge[0] == 254:
                if edge[3] != 2:
                    target['stone'] = item(edge[1])
                if target['g'] != 1:
                    target['fc'] = 1
                continue
            parent['et'].append([how, target['id']])
            target['ef'].append([how, parent['id']])
    chart = {row['name']: {other['name']: {0: 10, 1: 0, 5: 5, 20: 20}[row['matchup'][int(ident)]]
                           for ident, other in DATA['types'].items()} for row in DATA['types'].values()}
    data.update({'M': names, 'MV': move_rows, 'AB': [[name, cfru.clean(ability_rows[name]), int(name not in calc_names)]
                                                  for name in abilities], 'P': pokemon, 'TC': chart})
    report('dex: P %d (%d National Dex numbers, %d Mega/Primal); M %d; AB %d'
           % (len(pokemon), len(families), sum(row['g'] == 1 for row in pokemon), len(names), len(abilities)))
    report('official dex: %d species records; %d ordinary moves; %d generated/placeholder move records excluded'
           % (len(SPECIES), len(names), len(DATA['moves']) - len(MOVE_IDS)))
    report('egg groups: %d species decoded; source groups available via dex.egg_groups (no breeding-group field in P schema)' % len(SPECIES))
    changed = [row for row in SPECIES.values() if row.get('changes')]
    report('species changes: %d source records; retained in common.DATA, not a template changes card (shared UI rule)' % len(changed))
    for row in changed:
        report('  species changes %s: %s' % (FORM_KEYS[str(row['ID'])], row['changes']))
    report('wild held items: %d species; common/rare 50/5; equal nonzero slots 100%%' % sum(bool(row.get('hi')) for row in pokemon))
    report('Mega/form items: %d assigned from evolution records' % sum(bool(row.get('stone')) for row in pokemon))
    _cross_check(data)

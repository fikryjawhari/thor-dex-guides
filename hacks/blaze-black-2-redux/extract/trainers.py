"""Challenge rosters, paired Normal teams and the user's cap spine; docs win over pinned hzla sets.

The shared reader keeps source records and line numbers. This module expands starter/version/side/partner branches,
joins whole teams by content and trainer-order proximity, then attaches IVs/natures per Pokemon, never by name alone.
"""
import collections
import copy
import json
from pathlib import Path
import re

from common import H, RD, SPECIES, MOVES, ABILITIES, doc, drayano, report

CAPS = [('Cheren', 14), ('Roxie', 21), ('Brycen', 23), ('Burgh', 29), ('Lenora and Hawes', 33),
        ('Subway Masters', 36), ('Elesa', 38), ('Charles', 39), ('Rood', 41), ('Clay', 45), ('Colress', 53),
        ('Skyla', 55), ('Bianca', 56), ('Hugh', 58), ('Benga', 62), ('Drayden', 64), ('Marlon', 68),
        ('Ghetsis', 72), ('Lance', 76), ('Elite Four et al', 78), ('Iris', 79)]
ANCHORS = [433, 520, 548, 831, 1053, 1061, 1287, 1229, 1302, 1516, 1897, 1974, 2017, 2113,
           2382, 2626, 2835, 3081, 3368, 3484, 3502]
STARTERS = {'Tepig': 'Fire', 'Oshawott': 'Water', 'Snivy': 'Grass'}
STATS = ('hp', 'at', 'df', 'sa', 'sd', 'sp')
OPTIONAL_CAPS = {'ROXANNE': 13, 'BRAWLY': 20, 'WATTSON': 29, 'FLANNERY': 37, 'NORMAN': 44,
                 'JUAN': 54, 'WINONA': 63, 'TATE AND LIZA': 67}
SPECIAL = {'F-00': 'F00', 'MT': 'MT', 'MT2': 'MT2', 'UFO': 'UFO'}
FORM_ALIASES = {'Rotom-Wash': 'rotom_wash', 'Rotom-Heat': 'rotom_heat', 'Rotom-Frost': 'rotom_frost',
                'Giratina-Origin': 'giratina_origin', 'Black Kyurem': 'kyurem_black', 'White Kyurem': 'kyurem_white',
                'Kyurem-Black': 'kyurem_black', 'Kyurem-White': 'kyurem_white'}


def display_name(header):
    name = re.sub(r'\{[^}]*\}|\[[^]]*\]|\((?:2x|3x|Rot|Tag)\)', '', header, flags=re.I)
    name = re.sub(r'\s*-\s*(?:Hoenn Leader|Round Two).*$', '', name, flags=re.I).strip(' -:')
    return name.title().replace('Caitline', 'Caitlin').replace(' And ', ' and ')


def family(identity):
    return next((name for name in ('rotom', 'basculin', 'darmanitan', 'giratina', 'keldeo')
                 if identity and (identity == name or identity.startswith(name + '_'))), identity)


def branches(record):
    """One <=6 Pokemon team per side/starter; partners have their own branch families."""
    rows = {row['line']: row for row in record['rows']}
    channels = collections.OrderedDict()
    channel, starter, version = ('foe', ''), None, None
    for line, text in record['body']:
        if line in rows:
            channels.setdefault(channel, []).append((starter, version, rows[line]))
            continue
        picked = re.search(r'If you picked (Tepig|Oshawott|Snivy)', text)
        if picked:
            starter = picked[1]
        elif text == '---':
            starter = None
        elif text.startswith('FIRST BATTLE:'):
            version = text.split(':', 1)[1].strip()
        elif text == 'Or' and channel[0] == 'partner':
            starter = {'Tepig': 'Oshawott', 'Oshawott': 'Snivy'}.get(starter, 'Oshawott')
        elif re.search(r'partner|team - \(Partner', text, re.I):
            name = 'Nate/Rosa' if 'Nate/Rosa' in text else 'Cheren' if 'Cheren' in text else 'Hugh'
            channel, starter = ('partner', name), 'Tepig' if name == 'Nate/Rosa' else None
        elif re.search(r'(?:Left|Right) side', text, re.I):
            side = 'Left' if re.search('Left', text, re.I) else 'Right'
            label = re.sub(r'\s*-?\s*\((?:Left|Right) Side\):?$', '', text, flags=re.I)
            if re.fullmatch(r'(?:Left|Right) side:?\s*', label, re.I):
                label = ''
            if text in ('Left side: Liza', 'Right side: Tate'):
                label = text.split(': ')[1]
            channel, starter = ('foe', label or side), None
    result = []
    for (role, side), entries in channels.items():
        variants = list(dict.fromkeys((starter, version) for starter, version, row in entries if starter or version)) or [(None, None)]
        for starter, version in variants:
            team = [row for choice, game, row in entries if (choice is None or choice == starter) and
                    (game is None or game == version)]
            result.append(dict(role=role, side=side, starter=starter, version=version, rows=team))
    return result


class Hzla:
    """Whole-party matching, using the pinned navigation order as the tie breaker for identical teams."""

    def __init__(self, species):
        source = Path(H.src) / 'repos/hzla'
        self.raw = json.loads((source / 'bb2redux1-4.json').read_text(encoding='utf-8'))['backup_data']
        self.teams = collections.defaultdict(list)
        self.species = species
        for name, sets in self.raw['formatted_sets'].items():
            for label, values in sets.items():
                self.teams[values['tr_id']].append(dict(values, species=self.species(name), label=label))
        for team in self.teams.values():
            team.sort(key=lambda mon: mon['sub_index'])
        order = json.loads((source / 'backups__trainer_orders__bb2redux1-4.js').read_text().split('=', 1)[1].strip().rstrip(';'))
        self.rank = {}
        current = 164
        while current is not None and current not in self.rank:
            self.rank[current] = len(self.rank)
            current = order.get(str(current), {}).get('next')
        self.used = set()
        self.cursor = 0
        self.coverage = self.total = 0
        self.disagreements = collections.Counter()
        self.unmatched = []
        self.joins = []

    def join(self, record, branch, team):
        want = collections.Counter(family(mon['id']) for mon in team)
        candidates = []
        for number, party in self.teams.items():
            have = collections.Counter(family(mon['species']) for mon in party)
            overlap = sum((want & have).values())
            if not overlap or overlap < max(1, len(team) - 2):
                continue
            label = drayano.key(party[0]['label'])
            identity = re.findall(r'#[0-9]+', record['header'])
            name = drayano.key(branch['side'] or display_name(record['header']).split(' - ')[0].split()[-1])
            named = bool(name and name in label)
            if overlap != len(team) and not named:
                continue
            score = 100 * overlap - 45 * (sum(want.values()) + sum(have.values()) - 2 * overlap)
            score += 22 * named
            score += 80 * bool(identity and str(number) in [entry[1:] for entry in identity])
            score += sum(5 for mon in team for other in party if family(mon['id']) == family(other['species']) and
                         mon['l'] == min(100, other['level'] + (0 if other.get('noCh') else other.get('diff', 0))))
            score += sum(3 for mon in team for other in party if family(mon['id']) == family(other['species']) and
                         mon['i'] == (other.get('item') if other.get('item') != 'None' else ''))
            rank = self.rank.get(number)
            score += 15 if rank is not None and self.cursor <= rank <= self.cursor + 8 else 0
            score -= 8 if number in self.used else 0
            score += sum(2 * len(set(mon['_moves']) & set(other['moves'])) for mon in team for other in party
                         if family(mon['id']) == family(other['species']))
            distance = abs(rank - self.cursor) if rank is not None else 10000 + number
            candidates.append((score, -distance, number))
        candidates.sort(reverse=True)
        if not candidates or candidates[0][0] < 40 * len(team):
            self.unmatched.append((record['line'], record['header'], branch['side'], branch['starter']))
            return [None] * len(team), None
        score, distance, number = candidates[0]
        self.used.add(number)
        if number in self.rank:
            self.cursor = self.rank[number] + 1
        self.joins.append((record['line'], branch['side'], branch['starter'], number, score))
        remaining = self.teams[number].copy()
        result = []
        for mon in team:
            matches = [other for other in remaining if family(other['species']) == family(mon['id'])]
            other = max(matches, key=lambda value: sum(move in value['moves'] for move in mon['_moves'])) if matches else None
            result.append(other)
            if other:
                remaining.remove(other)
        if remaining or any(other is None for other in result):
            report('  hzla disagreement: doc line %d, %s, species: doc %s; hzla says %s (trainer %d)' %
                   (record['line'], record['header'], list(want.elements()), [mon['species'] for mon in self.teams[number]], number))
        return result, number


def build(data):
    records = drayano.trainers(doc('Trainer Changes'), 'bb2r')
    assert len(records) == 468 and sum(len(record['rows']) for record in records) == 1867
    pokemon = {entry['n']: entry['id'] for entry in data['P']}
    aliases = dict(FORM_ALIASES)
    aliases.update({name: value.replace('-', '_') for name, value in SPECIAL.items()})
    species = drayano.Names('species', list(pokemon) + list(SPECIAL), aliases={key: key for key in SPECIAL})
    hz_names = drayano.Names('species', list(pokemon) + list(SPECIAL), aliases={'F00': 'F-00',
                                 "Farfetch�d": "Farfetch'd", 'Nidoran-F': 'Nidoran♀', 'Nidoran-M': 'Nidoran♂'})

    def species_id(name):
        if name == 'Keldeo-Resolute':
            return 'keldeo'
        if name in aliases:
            return aliases[name]
        canonical = hz_names(name)
        return pokemon.get(canonical, aliases.get(canonical))

    hzla = Hzla(species_id)
    for name, raw_name in SPECIAL.items():
        raw = hzla.raw['poks'][raw_name]
        ability = ABILITIES(raw['abs'][0])
        data['P'].append(dict(id=aliases[name], n=name, dex=raw['num'], t=raw['types'], a=[next(index for index, entry in
                       enumerate(data['AB']) if entry[0] == ability)], ha=-1, s=[raw['bs'][stat] for stat in STATS],
                       ef=[], et=[], of=[], lv=[[1, data['M'].index('Pound')]], tm=[], eg=[], w=[], g=3,
                       cf=['Trainer-only Pokéstar creation: stats/types from the pinned hzla species table.']))
        pokemon[name] = aliases[name]
    species = drayano.Names('species', list(pokemon), aliases={'Wormadam-Plant': 'Wormadam'})
    moves = drayano.Names('move', data['M'], typos={'Grab': 'Snatch'})
    item_names = {value.get('item', '') for team in hzla.teams.values() for value in team} - {'None', ''}
    items = drayano.Names('item', item_names)
    abilities = drayano.Names('ability', [entry[0] for entry in data['AB']])
    move_index = {name: index for index, name in enumerate(data['M'])}
    ability_index = {entry[0]: index for index, entry in enumerate(data['AB'])}
    repairs = []

    def roster(record, branch, normal=False):
        team = []
        for row in branch['rows']:
            where = 'Trainer Changes:%d' % row['line']
            canonical = species(row['species'], where)
            identity = pokemon.get(canonical) or FORM_ALIASES.get(row['species'])
            if record['line'] in (3075, 3078):
                identity = 'kyurem_black' if record['line'] == 3075 else 'kyurem_white'
            if row['species'] == 'Darmanitan' and row['ability'] == 'Zen Mode':
                identity = 'darmanitan_zen'
            if row['species'] == 'Giratina' and row['item'] == 'Griseous Orb':
                identity = 'giratina_origin'
            ability_raw, item_raw, move_raw = row['ability'], row['item'], row['moves'].copy()
            if row['line'] == 2488:
                ability_raw = 'Tinted Lens'
                repairs.append((row['line'], 'Noctowl: Doc says Wacan Berry as ability; Tinted Lens @ Colbur Berry.'))
            if row['line'] == 3572:
                ability_raw, item_raw = 'Cursed Body', 'Leftovers'
                repairs.append((row['line'], 'Jellicent: Doc says Water Absorb @ Water Absorb; Cursed Body @ Leftovers.'))
            if row['line'] == 3705:
                item_raw = 'Air Balloon'
                move_raw = ['Earthquake' if move == 'Superpower' else move for move in move_raw]
                repairs.append((row['line'], 'Klinklang: Doc says no item / Superpower; Air Balloon / Earthquake.'))
            if 'Grab' in move_raw:
                repairs.append((row['line'], 'Banette: Doc says Grab; Snatch.'))
            ability = abilities(ability_raw, where)
            item = items(item_raw, where) if item_raw else ''
            resolved = [moves(move, where) for move in move_raw]
            assert identity and ability and all(resolved) and (item is not None), (where, row)
            level = row['level'] if normal or record['mode'] == 'challenge' else min(100, row['level'] + record['increment'])
            mon = dict(id=identity, l=level, i=item, a=ability_index[ability], iv=[0] * 6,
                       m=[move_index[move] for move in resolved], _moves=resolved, _row=row)
            if not normal and record['mode'] == 'shared' and row['level'] != level:
                mon['sl'] = row['level']
            team.append(mon)
        matched, number = hzla.join(record, branch, team)
        for slot, (mon, other) in enumerate(zip(team, matched)):
            hzla.total += 1
            if other:
                mon['iv'] = [other['ivs'][stat] for stat in STATS]
                mon['na'] = other['nature']
                hzla.coverage += 1
                if not normal and record['mode'] == 'challenge' and not other.get('noCh'):
                    stat_level = other['level']
                    if min(100, stat_level + other.get('diff', 0)) == mon['l'] and stat_level != mon['l']:
                        mon['sl'] = stat_level
                compare = {'species': (mon['id'], other['species']),
                           'level': (mon['l'], min(100, other['level'] + (0 if normal or other.get('noCh') else other.get('diff', 0)))),
                           'stat level': (mon.get('sl', mon['l']), other['level']),
                           'ability': (data['AB'][mon['a']][0], other['ability']),
                           'item': (mon['i'], '' if other['item'] == 'None' else other['item']),
                           'moves': (mon['_moves'], [move for move in other['moves'] if move != '-----'])}
                for field, (ours, theirs) in compare.items():
                    differs = ({drayano.key(value) for value in ours} != {drayano.key(value) for value in theirs}) if field == 'moves' else drayano.key(str(ours)) != drayano.key(str(theirs))
                    if differs:
                        hzla.disagreements[field] += 1
                        value = ', '.join(theirs) if isinstance(theirs, list) else str(theirs) or 'no item'
                        mon.setdefault('hn', []).append('stat-level model differs' if field == 'stat level' else '%s %s' % (field, value))
                        report('  hzla disagreement: doc line %d, %s, %s, %s: doc %s; hzla says %s (trainer %d)' %
                               (mon['_row']['line'], record['header'], mon['id'], field, ours, theirs, number))
            else:
                mon['hn'] = ['no matching set; IVs/nature unknown (zero-IV placeholder, not a claim)']
                if number:
                    alternative = next((value for value in hzla.teams[number] if value['sub_index'] == slot), None)
                    if alternative:
                        mon['hn'].append('species ' + str(alternative['species']))
                        hzla.disagreements['species'] += 1
                report('  hzla unmatched Pokemon: doc line %d, %s, %s' % (mon['_row']['line'], record['header'], mon['id']))
            mon.pop('_moves')
            mon.pop('_row')
        return team, number

    paired = {}
    selected = []
    for index, record in enumerate(records):
        if record['mode'] == 'normal':
            challenge = records[index + 1]
            assert challenge['mode'] == 'challenge', record['header']
            paired[challenge['line']] = record
        else:
            if record['line'] == 577:
                for name, version in [('Policeman Braven', 'Blaze Black 2 Redux'), ('Backpacker Clifford', 'Volt White 2 Redux')]:
                    selected.append(dict(record, header=name, version=version))
            else:
                selected.append(record)
    groups = [dict(n=('%s Split [Cap %d]' % (name, cap)), cap=cap, tab='', sec=[]) for name, cap in CAPS]
    groups.append(dict(n='Post-game', cap=None, tab='', sec=[]))
    count = normal_count = 0
    for record in selected:
        expanded = branches(record)
        partners = []
        for branch in expanded:
            if branch['role'] == 'partner':
                team, number = roster(record, branch)
                partner = dict(n=branch['side'], p=team)
                if branch['starter']:
                    partner['st'] = STARTERS[branch['starter']]
                partners.append(partner)
        opponents = [branch for branch in expanded if branch['role'] == 'foe']
        normal_record = paired.get(record['line'])
        normal = None
        if normal_record:
            normal_team = []
            for branch in branches(normal_record):
                if branch['role'] == 'foe':
                    normal_team.extend(roster(normal_record, branch, normal=True)[0])
            normal = dict(p=normal_team, easy=record['easy_increment'])
            normal_count += 1
        for position, branch in enumerate(opponents):
            team, number = roster(record, branch)
            assert 0 < len(team) <= 6, (record['header'], branch['side'], len(team))
            name = display_name(record['header'])
            tags, notes = [], []
            if record['optional']:
                tags.append('Optional')
            if len({other['side'] for other in opponents}) > 1:
                name += ' (' + branch['side'] + ')'
                tags.append('Double Battle')
            for marker, tag in [('(2x)', 'Double Battle'), ('(3x)', 'Triple Battle'), ('(Rot)', 'Rotation Battle'),
                                 ('(Tag)', 'Tag Battle')]:
                if marker in record['header'] and tag not in tags:
                    tags.append(tag)
            if record['line'] in (342, 701, 3368):
                tags.append('Challenge only')
            if record['line'] >= 3535 or 'Postgame' in record['context']:
                tags.append('Postgame')
            if record['line'] >= 3559 and record['line'] <= 3645:
                tags.append('Round two')
            if record['line'] >= 3649 and any(name in record['header'] for name in ('HUGH', 'COLRESS', 'LEADER')):
                tags.append('Rematch')
            if record['context'] and record['context'] not in name:
                notes.append(record['context'])
            if record['increment'] == 7:
                notes.append('Doc says Levels +7(!) on Challenge Mode; displayed level is capped at 100.')
            notes.extend(text.lstrip('- ') for line, text in record['body'] if text.startswith('- Permanent'))
            if 3336 <= record['line'] <= 3368:
                notes.append('Weather gauntlet: Hail then Sun, heal, Rain then Sand, heal, then Lance. No team changes between fights in each pair.')
            if record['line'] == 701:
                notes.append('Before Burgh only; afterwards the Guardian blocks the lighthouse until the postgame Striaton visit.')
            reward = re.search(r'\{([^}]+)\}', record['header'])
            version = branch['version'] or record['version']
            if version:
                tags.append(version)
            if branch['starter']:
                notes.append('If you picked ' + branch['starter'])
            for line, fix in repairs:
                if line in [row['line'] for row in branch['rows']]:
                    notes.append(fix)
            trainer = dict(k='', n=name, loc=record['location'].replace('Adundant', 'Abundant'), tags=tags, note=notes, p=team)
            if number:
                trainer['id'] = number
            if reward:
                trainer['rw'] = [reward[1]]
            if branch['starter']:
                trainer['st'] = STARTERS[branch['starter']]
            school = re.search(r'^If you picked (Tepig|Oshawott|Snivy)', record['context'])
            if school:
                trainer['st'] = STARTERS[school[1]]
                trainer['tags'].append('Back to Back #' + ('1' if 'Seymour' in name else '2'))
            if partners:
                trainer['pt'] = copy.deepcopy(partners)
            if record['location'] == 'Reversal Mountain' and '(Tag)' in record['header']:
                bianca = next(trainer for group in groups for section in group['sec'] for trainer in section['tr']
                              if trainer['n'] == 'Bianca')
                trainer['pt'] = [dict(n='Bianca', p=copy.deepcopy(bianca['normal']['p']))]
            if len({other['side'] for other in opponents}) > 1:
                trainer['bt'] = 'bb2r-' + str(record['line'])
            if position == 0 and normal:
                trainer['normal'] = normal
            group_index = next((index for index, line in enumerate(ANCHORS) if record['line'] <= line), len(CAPS))
            if record['line'] == 1229:
                group_index = 7
            if re.search(r'after|After', record['context']):
                minimum = {'Cheren': 1, 'Roxie': 2, 'Elesa': 7, 'Clay': 10, 'Drayden': 16}
                floor = max([group_index] + [index for boss, index in minimum.items() if boss in record['context']])
                highest = max(mon['l'] for mon in team)
                group_index = next((index for index in range(floor, len(CAPS)) if CAPS[index][1] >= highest), len(CAPS))
            if 'Postgame' in tags:
                group_index = len(CAPS)
            group = groups[group_index]
            cap = group['cap']
            optional_cap = next((value for boss, value in OPTIONAL_CAPS.items() if record['optional'] and boss in record['header']), None)
            if optional_cap:
                trainer['cap'] = optional_cap
            elif cap:
                trainer['cap'] = cap
            section_cap = [optional_cap, name] if optional_cap else None
            if not group['sec'] or group['sec'][-1]['h'] != trainer['loc'] or group['sec'][-1].get('cap') != section_cap:
                group['sec'].append(dict(h=trainer['loc'], tr=[]))
            section = group['sec'][-1]
            if section_cap:
                section['cap'] = section_cap
            trainer['k'] = '%d.%d.%d' % (group_index, len(group['sec']) - 1, len(section['tr']))
            section['tr'].append(trainer)
            count += 1
            if cap and any(mon['l'] > cap for mon in team):
                report('  split-cap exception: doc line %d, %s, levels %s > split cap %d (%s); doc levels retained' %
                       (record['line'], name, [mon['l'] for mon in team], cap, group['n']))
    data['TR'] = dict(g=groups, caps=[list(row) for row in CAPS])
    report('trainers: 468 records, 1867 doc Pokemon, %d cards, %d Normal teams, 3 Challenge-only battles' % (count, normal_count))
    report('hzla coverage: %d/%d Pokemon with IVs+nature; disagreements %s' % (hzla.coverage, hzla.total, dict(hzla.disagreements)))
    for unmatched in hzla.unmatched:
        report('  hzla unmatched: doc line %s, %s, side %s, starter %s' % unmatched)
    for joined in hzla.joins:
        report('  hzla join: doc line %d, side %s, starter %s -> trainer %d (score %d)' % joined)
    for line, fix in repairs:
        report('  trainer recorded fix: doc line %d, %s' % (line, fix))
    for fixer in (species, moves, items, abilities):
        for line in fixer.lines():
            report(line)
        assert not fixer.unresolved, (fixer.kind, fixer.unresolved)

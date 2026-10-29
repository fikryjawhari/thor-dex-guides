"""BB2R Locations and tracker: doc tables first, mirror only as a measured cross-check.

AREA_ALIASES maps walkthrough source headings to one or more canonical AR names. Seasonal source headers map
through area_name(). Doc floor/room boundaries stay intact, like EI's tracker-defined map boundaries. Gift buildings
fold into their town; grottos and seasons are sections, never extra tracker slots. AR order is frozen by check.py.
"""
from collections import Counter
import html
from pathlib import Path
import re

from common import H, RD, SPECIES, doc, drayano, report


SEASON = re.compile(r' - (Spring|Summer|Autumn|Winter|Spring, Summer, Autumn|Spring/Summer/Autumn)$')
FLOOR_AREAS = {
    'Relic Castle - Lower Floors': ('Room Left of Pots', 'Room Right of Pots', 'Furthest Room Right',
                                   'Furthest Room Left', 'Room with Pots', 'Volcarona Room'),
    'Celestial Tower': ('2F', '3F', '4F', 'Roof'),
    'Victory Road - Connecting Caves I': ('Main', 'Dark'),
    'Victory Road - Connecting Caves II': ('Dragons', 'Top'),
    'Dragonspiral Tower - Indoors': ('First Room', 'Second Room', 'Roof'),
    'Dreamyard - All Areas': ('Surface', 'Basement'),
}
FLOOR_ALIASES = {name: tuple(name + ' - ' + floor for floor in floors) for name, floors in FLOOR_AREAS.items()}
FLOOR_ALIASES['Twist Mountain - All Seasons'] = ('Twist Mountain - All Seasons', 'Twist Mountain - Ice Room')
FLOOR_ALIASES['Underground Ruins - All Areas'] = ('Underground Ruins - All Areas', 'Underground Ruins - Regi Rooms')
MIRROR_ALIASES = {
    'Driftveil Drawbridge, Charizard Bridge': 'Driftveil Drawbridge',
    'Giants Chasm - Route 13': 'Giant Chasm - Route 13',
    'Giants Chasm - Entrance Cave': 'Giant Chasm - Entrance Cave',
    'Giants Chasm - Plasma Airship Area': 'Giant Chasm - Plasma Airship Area',
    'Giants Chasm - Kyurems Cave': 'Giant Chasm - Kyurems Cave',
    'Route 8, Moor of Icirrus - All Seasons': 'Route 8 - Moor of Icirrus',
    'Icirrus City - All Seasons': 'Icirrus City',
    'Twist Mountain - All Seasons': 'Twist Mountain',
}
AREA_ALIASES = {
    'Trainer School': ('Aspertia City',),
    "Aspertia City - Trainer School and Cheren's Gym": ('Aspertia City',),
    "Virbank City and Roxie's Gym": ('Virbank City',),
    'Virbank Complex': ('Virbank Complex - Outside', 'Virbank Complex - Inside'),
    'Outer Complex': ('Virbank Complex - Outside',),
    'Inner Complex': ('Virbank Complex - Inside',),
    'Castelia City - Battle Company': ('Castelia City',),
    'Castelia City': ('Castelia City', 'Castelia Gardens'),
    "Castelia City - Various + Burgh's Gym": ('Castelia City', 'Castelia Gardens'),
    'Relic Passage - Castelia Side': ('Relic Passage - Castelia',),
    'Relic Passage': ('Relic Passage - Castelia', 'Relic Passage - Driftveil Side', 'Relic Passage - Center (Main) Room'),
    'Route 4 - Pre-Burgh/Castelia Side': ('Route 4',),
    'Route 4 - Post-Burgh': ('Route 4',),
    'Relic Castle': ('Relic Castle - Upper Floors', 'Relic Castle - Lower Floors'),
    'Driftveil Drawbridge': ('Driftveil Drawbridge, Charizard Bridge',),
    'Charizard Bridge': ('Driftveil Drawbridge, Charizard Bridge',),
    "Amusement Park and Elesa's Gym": ('Nimbasa City',),
    'Driftveil Market': ('Driftveil City',),
    "Clay's Gym": ('Driftveil City',),
    'Clay Tunnel': ('Clay Tunnel - All Areas',),
    'Reversal Mountain': ('Reversal Mountain - Outside', 'Reversal Mountain - Inside'),
    'Adundant Shrine': ('Abundant Shrine',),
    'Seaside Cave': ('Seaside Cave - Upper Floor', 'Seaside Cave - Lower Floor'),
    "Humilau City and Marlon's Gym": ('Humilau City',),
    'Route 9 Shopping Mall': ('Route 9',),
    'Shopping Mall Nine': ('Route 9',),
    'Giant Chasm': ('Giants Chasm - Route 13', 'Giants Chasm - Entrance Cave', 'Giants Chasm - Plasma Airship Area', 'Giants Chasm - Kyurems Cave'),
    'Giant Chasm and Plasma Frigate - Third Visit': ('Giants Chasm - Route 13', 'Giants Chasm - Entrance Cave', 'Giants Chasm - Plasma Airship Area', 'Giants Chasm - Kyurems Cave'),
    'Victory Road': ('Victory Road - Ruined Area', 'Victory Road - Lower Mountainside', 'Victory Road - Forest', 'Victory Road - Connecting Caves I', 'Victory Road - Upper Mountainside', 'Victory Road - Connecting Caves II', "Victory Road - N's Castle, Entrance"),
    "N's Castle": ("Victory Road - N's Castle, Entrance",),
    'Route 8': ('Route 8, Moor of Icirrus - All Seasons',),
    'Moor of Icirrus': ('Route 8, Moor of Icirrus - All Seasons',),
    'Icirrus City': ('Icirrus City - All Seasons',),
    'Icirrus City, Postgame': ('Icirrus City - All Seasons',),
    'Twist Mountain': ('Twist Mountain - All Seasons',),
    'Twist Mountain - Mistralton Side': ('Twist Mountain - All Seasons',),
    'Dragonspiral Tower': ('Dragonspiral Tower', 'Dragonspiral Tower - Indoors'),
    'Underground Ruins': ('Underground Ruins - All Areas',),
    'Pinwheel Forest': ('Pinwheel Forest - Inside', 'Pinwheel Forest - Outside'),
    'Wellspring Cave': ('Wellspring Cave - Both Floors',),
    'Dreamyard': ('Dreamyard - All Areas',),
    'Striaton City': ('Striation City',),
    'Straiton City': ('Striation City',),
    'Nature Preserve': ('The Nature Preserve',),
    'Marvelous Bridge': ('Marvellous Bridge',),
    'Season Research Lab': ('Route 6',),
    'Guidance Chamber': ('Mistralton Cave',),
    "Team Plasma's Safehouse": ('Driftveil City',),
}
AREA_ALIASES = {heading: tuple(child for name in names for child in FLOOR_ALIASES.get(name, (name,)))
                for heading, names in AREA_ALIASES.items()}
AREA_ALIASES.update(FLOOR_ALIASES)
GROTTO_AREAS = {'Giant Chasm': 'Giants Chasm - Plasma Airship Area',
               'Pinwheel Forest - Deep in the Woods': 'Pinwheel Forest - Inside',
               "Pinwheel Forest - Challenger's Rock": 'Pinwheel Forest - Outside'}
RANCH_EGG = ('Pichu', 'Igglybuff', 'Teddiursa', 'Slugma', 'Tyrogue', 'Smoochum', 'Elekid', 'Magby',
             'Carvanha', 'Spheal', 'Budew', 'Munna', 'Blitzle', 'Vanillite', 'Litwick', 'Elgyem', 'Cubchoo')
GIFT_POOLS = (
    ('Snivy', 'Tepig', 'Oshawott'), ('Pansage', 'Pansear', 'Panpour'), RANCH_EGG,
    ('Bulbasaur', 'Charmander', 'Squirtle'), ('Meditite',), ('Eevee',), ('Chikorita', 'Cyndaquil', 'Totodile'),
    ('Bonsly', 'Mime Jr.', 'Glameow', 'Stunky'),
    ('Omanyte', 'Kabuto', 'Lileep', 'Anorith', 'Cranidos', 'Shieldon', 'Tirtouga', 'Archen', 'Aerodactyl'),
    ('Treeko', 'Torchic', 'Mudkip'), ('Turtwig', 'Chimchar', 'Piplup'), ('Zorua',), ('Corsola',),
    ('Stantler',), ('Volcarona',), ('Lapras',), ('Rotom',),
)
GIFT_AREAS = ('Starter', 'Floccesy Town', 'Floccesy Ranch', 'Virbank City', 'Virbank City', 'Castelia City',
              'Castelia City', 'Castelia City', 'Relic Castle - Upper Floors', 'Anville Town', 'Driftveil City',
              'Driftveil City', 'Route 6', 'Route 5', 'Relic Castle - Lower Floors - Volcarona Room', 'Village Bridge', 'Route 9')
LEGEND_AREAS = {
    'Articuno': 'Giants Chasm - Route 13', 'Zapdos': 'Chargestone Cave', 'Moltres': 'Reversal Mountain - Outside',
    'Mewtwo': 'Wellspring Cave - Both Floors', 'Mew': 'Faraway Island', 'Raikou': 'Chargestone Cave',
    'Entei': 'Route 23', 'Suicune': 'Route 13', 'Lugia': 'Route 17', 'Ho-Oh': 'Aspertia City', 'Celebi': 'Entralink',
    'Regirock': 'Underground Ruins - Regi Rooms', 'Regice': 'Underground Ruins - Regi Rooms',
    'Registeel': 'Underground Ruins - Regi Rooms', 'Latias': 'Route 15', 'Latios': 'Route 18',
    'Kyogre': 'Abyssal Ruins', 'Groudon': 'Desert Resort', 'Rayquaza': 'Celestial Tower - Roof', 'Jirachi': 'Dreamyard - All Areas - Surface',
    'Deoxys': 'Giants Chasm - Plasma Airship Area', 'Uxie': 'Nacrene City', 'Mesprit': 'Celestial Tower - Roof', 'Azelf': 'Route 23',
    'Dialga': 'Mistralton Cave', 'Palkia': 'Route 18', 'Giratina': 'Unity Tower', 'Arceus': 'The Nature Preserve',
    'Heatran': 'Reversal Mountain - Inside', 'Regigigas': 'Twist Mountain - All Seasons', 'Cresselia': 'Marvellous Bridge',
    'Darkrai': 'Strange House', 'Manaphy': 'Route 3', 'Shaymin': 'Pinwheel Forest - Inside', 'Victini': 'Liberty Garden',
    'Cobalion': 'Route 13', 'Virizion': 'Route 11', 'Terrakion': 'Route 22', 'Tornadus': 'Route 8, Moor of Icirrus - All Seasons',
    'Thundurus': 'Dragonspiral Tower', 'Landorus': 'Abundant Shrine', 'Reshiram': 'Dragonspiral Tower - Indoors - Roof',
    'Zekrom': 'Dragonspiral Tower - Indoors - Roof', 'Kyurem': 'Giants Chasm - Kyurems Cave', 'Keldeo': 'Pledge Grove',
    'Meloetta': 'Accumula Town', 'Genesect': 'P2 Laboratory',
}
VANILLA_TRADES = (
    ('Route 15', 'Rotom', 'Ditto', '60', 'Lillian, trailer west of the Poke Transfer Lab; Calm; Levitate; Max Elixir.'),
    ('Accumula Town', 'Ambipom', 'Excadrill', '40', 'Diana, southwestern house; Jolly; Pickup; Sitrus Berry.'),
    ('Accumula Town', 'Alakazam', 'Hippowdon', '40', 'Diana, after the first trade and battle; Timid; Synchronize; Lum Berry.'),
)
PHONE_TRADES = {
    'Yancy (male player)': ('Meowth', 'Wobbuffet', 'Ralts', 'Shieldon', 'Rhyhorn', 'Shellos-W', 'Mawile', 'Spiritomb', 'Snorlax', 'Teddiursa', 'Spinda', 'Togepi'),
    'Curtis (female player)': ('Mankey', 'Wobbuffet', 'Ralts', 'Cranidos', 'Rhyhorn', 'Shellos-E', 'Sableye', 'Spiritomb', 'Snorlax', 'Phanpy', 'Spinda', 'Togepi'),
}


def area_name(name):
    return SEASON.sub('', name)


def area_names(heading):
    """Walkthrough join: exact source heading -> canonical names, with explicit multi-area mappings."""
    return AREA_ALIASES.get(heading, (area_name(heading),))


def wild_area_name(source, method):
    """EI-style named floor/room slots; never infer individual floors from an undivided All Areas/Both Floors table."""
    name = area_name(source)
    if source == 'Castelia City' and method.startswith('Grass'):
        return 'Castelia Gardens'
    if name in FLOOR_AREAS:
        floor = next((floor for floor in FLOOR_AREAS[name] if floor in method), None)
        if name == 'Dreamyard - All Areas' and floor is None:
            floor = 'Surface'
        if floor is None:
            raise ValueError('unmapped encounter floor: ' + source + ' / ' + method)
        return name + ' - ' + floor
    if name == 'Twist Mountain - All Seasons' and 'Ice Room' in method:
        return 'Twist Mountain - Ice Room'
    if name == 'Underground Ruins - All Areas' and 'Regi Rooms' in method:
        return 'Underground Ruins - Regi Rooms'
    return name


def species_id(name):
    forms = {'Basculin-B': 'basculin_blue_striped', 'Basculin-R': 'basculin', 'Shellos-E': 'shellos_east_sea',
             'Shellos-W': 'shellos', 'Gastrodon-E': 'gastrodon_east_sea', 'Gastrodon-W': 'gastrodon',
             'Darmanitan-Z': 'darmanitan_zen', 'Jellicent♂': 'jellicent', 'Jellicent♀': 'jellicent'}
    if name in forms:
        return forms[name]
    slug_forms = {value.replace('_', '-'): value for value in forms.values()}
    slug_forms['basculin-red-striped'] = 'basculin'
    slug_forms['shellos-west-sea'] = 'shellos'
    slug_forms['gastrodon-west-sea'] = 'gastrodon'
    slug_forms['shellos-east'] = 'shellos_east_sea'
    slug_forms['gastrodon-east'] = 'gastrodon_east_sea'
    if name in slug_forms:
        return slug_forms[name]
    if name.lower().startswith('unown-'):
        return 'unown'
    name = re.sub(r'\s*\(\*+\)', '', name)
    fixed = SPECIES(name, 'Locations')
    page = RD.find(fixed) if fixed else None
    if not page:
        raise ValueError('unresolved encounter species: ' + name)
    return page.slug.replace('-', '_')


def legendary_records():
    """The 25 quest blocks provide unlock prose; the explicit species table supplies stable area joins."""
    records = {}
    for title, line, start, end in doc('Legendary Locations').blocks():
        if title == 'General Information':
            continue
        body = ' '.join(text.strip() for text in doc('Legendary Locations').lines[start:end] if text.strip())
        names = [name for name in LEGEND_AREAS if re.search(r'(?<!\w)' + re.escape(name) + r'(?!\w)', title, re.I)]
        for name in names:
            records[name] = {'area': LEGEND_AREAS[name], 'note': body, 'line': line}
    if set(records) != set(LEGEND_AREAS):
        raise ValueError('legendary blocks missing: ' + str(set(LEGEND_AREAS) - set(records)))
    return records


def mirror_comparison(wild):
    """Method-insensitive multiset comparison, exactly the source audit's row/level/rate key; no rows discarded."""
    def species_key(name):
        species = species_id(name)
        return species.replace('_', '')

    actual, mirror = Counter(), Counter()
    paths = sorted((Path(H.src) / 'romhackdex' / 'locations').glob('*/index.html'))
    for area in wild['areas']:
        name = drayano.key(MIRROR_ALIASES.get(area['name'], area['name']))
        for group in area['groups']:
            for row in group['rows']:
                levels = list(map(int, row['levels'].split('-')))
                actual[(name, species_key(row['species']), row['rate'], levels[0], levels[-1])] += 1
    mapped = set()
    for path in paths:
        raw = path.read_text(encoding='utf-8')
        title = html.unescape(re.search(r'<h1[^>]*>(.*?)</h1>', raw, re.S)[1]).strip()
        name = drayano.key(title)
        mapped.add(name)
        for row in re.findall(r'<tr\b[^>]*\bencounter-row\b.*?</tr>', raw, re.S):
            attrs = dict(re.findall(r'data-([\w-]+)="([^"]*)"', row))
            cells = re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S)
            level_text = html.unescape(re.sub(r'<[^>]+>', ' ', cells[-2])).strip()
            levels = [int(level) for level in re.findall(r'\d+', level_text)]
            mirror[(name, species_key(attrs['id']), int(attrs['rate']), levels[0], levels[-1])] += 1
    if mapped != {key[0] for key in actual}:
        raise ValueError('mirror area names differ: ' + str(mapped ^ {key[0] for key in actual}))
    return {'areas': len(paths), 'match': sum((actual & mirror).values()), 'doc_only': sum((actual - mirror).values()),
            'mirror_only': sum((mirror - actual).values()), 'disagreements': list((mirror - actual).items())}


def build(data):
    wild = drayano.wild(doc('Wild Area Changes'), 'bb2r')
    gifts = drayano.gifts(doc('Gift Pokemon'), 'bb2r')
    trades = drayano.trades(doc('Trade Changes'), 'bb2r')
    legends = legendary_records()
    locations, areas, byarea = [], [], {}
    byid = {pokemon['id']: pokemon for pokemon in data['P']}
    for pokemon in data['P']:
        pokemon['w'] = []
        pokemon.pop('hi', None)

    def add_area(name):
        if name not in byarea:
            byarea[name] = len(areas)
            areas.append({'n': name, 'l': [len(locations)], 'es': []})
            locations.append(name)
        return areas[byarea[name]]

    def add(name, area, method, rate='', levels='', note='', section=False):
        target = add_area(area)
        species = species_id(name)
        if species not in byid:
            raise ValueError('encounter species not in P: ' + species)
        row = [target['l'][0], method, rate, str(levels), note]
        if section:
            row.append(1)
        if row not in byid[species]['w'] or section:
            byid[species]['w'].append(row)
        return species

    add_area('Starter')['st'] = 1
    for source in wild['areas']:
        if source['name'] == 'Castelia City':
            add_area('Castelia City')
        season = SEASON.search(source['name'])
        for group in source['groups']:
            if not group['rows']:
                continue
            area = add_area(wild_area_name(source['name'], group['method']))
            label = season[1] if season else group['method']
            section = next((entry for entry in area['es'] if entry['n'] == label), None)
            if section is None:
                section = {'n': label, 'k': 'other' if season else 'grass', 'g': []}
                area['es'].append(section)
            rows = []
            for row in group['rows']:
                note = '; '.join(part for part in (('Form: ' + row['species']) if row['species'].startswith('Unown-') else '', row['note']) if part)
                method = (season[1] + ' - ' if season else '') + group['method']
                species = add(row['species'], area['n'], method, str(row['rate']) + '%', row['levels'], note, True)
                rows.append({'p': species, 'r': [row['rate'], row['rate']], 'note': 'Lv. ' + row['levels'] + ('; ' + note if note else '')})
            section['g'].append({'m': season[1] + ' - ' + group['method'] if season else '', 'lv': '', 'rows': rows})
    for grotto in wild['grottos']:
        name = GROTTO_AREAS.get(grotto['name'], grotto['name'].split(' - ')[0])
        if name not in byarea:
            raise ValueError('grotto has no parent area: ' + grotto['name'])
        section = {'n': 'Hidden Grotto' + (' - ' + grotto['name'].split(' - ', 1)[1] if ' - ' in grotto['name'] else ''), 'k': 'other', 'g': []}
        add_area(name)['es'].append(section)
        for rarity in ('Guaranteed', 'Common', 'Uncommon', 'Rare'):
            rows = []
            for row in grotto['rows']:
                if row['rarity'] != rarity:
                    continue
                species = add(row['species'], name, section['n'] + ' - ' + rarity, rarity, row['levels'],
                              'Bianca demonstration; guaranteed Lv. 30 Stantler' if rarity == 'Guaranteed' else '', True)
                rows.append({'p': species, 'r': [0, 0], 'note': rarity + ('; Lv. ' + row['levels'] if row['levels'] else '')})
            if rows:
                section['g'].append({'m': rarity, 'lv': '', 'rows': rows})
    for index, (block, pool, area) in enumerate(zip(gifts, GIFT_POOLS, GIFT_AREAS, strict=True)):
        if block['name'] == 'Stantler':
            continue
        method = 'Static' if block['kind'] == 'Static' else 'Egg' if 'Egg' in block['name'] else 'Gift'
        if index == 0:
            method = 'Starter choice'
        elif len(pool) > 1 and method == 'Gift':
            method = 'Choice (' + block['name'] + ')'
        note = block['location'] + '. ' + block['text']
        if block['name'] == 'Volcarona':
            note += ' Gift doc says Relic Passage; Wild Area Changes places it in Relic Castle - Lower Floors.'
        for name in pool:
            extra = ''
            rate = '1 of ' + str(len(pool)) if len(pool) > 1 else ''
            species_method = method
            if index == 1:
                species_method, rate = 'Gift', ''
                extra = ' Starter: ' + {'Pansage': 'Tepig', 'Panpour': 'Snivy', 'Pansear': 'Oshawott'}[name] + '.'
            elif index == 8:
                if name == 'Aerodactyl':
                    species_method, rate = 'Gift (Fossil revival)', ''
                    extra = ' Revive Old Amber found elsewhere; not in Roark\'s eight-fossil random pool.'
                else:
                    species_method, rate = 'Choice (Roark fossil)', '1 of 8'
                    extra = ' Roark offers one of these eight fossils at random; all can also be found elsewhere and revived.'
            add(name, area, species_method, rate, block['levels'], note + extra)
    event_levels = {species_id(event['species']): event['levels'] for event in wild['events']}
    for name, record in legends.items():
        note = 'Speak to the Key Gift Guy in Aspertia City first. Save before interacting; new scripted legendary encounters are one-time. ' + record['note']
        if name == 'Victini':
            note += ' Provisional: quest prose places Victini in Liberty Garden lighthouse; the summary says Castelia Gardens.'
        add(name, record['area'], 'Egg' if name == 'Manaphy' else 'Static', '', event_levels.get(species_id(name), ''), note)
    for event in wild['events']:
        species = species_id(event['species'])
        if species in {species_id(name) for name in legends} or species in {'corsola', 'volcarona'}:
            continue
        if event['note'] == 'VW2':
            continue
        add(event['species'], area_name(event['area']), 'Static', '', event['levels'],
            'Wild Area Changes event; ' + (event['note'] or 'one-time encounter'))
    for block in trades:
        area = 'Humilau City' if block['species'] == 'Phione' else block['location']
        note = 'For ' + block['requested'] + '. ' + block['text']
        if block['species'] == 'Phione':
            note += ' Provisional: doc header says Route 7; NPC prose says Humilau City.'
        add(block['species'], area, 'Trade', '', '', note)
    for area, species, requested, level, note in VANILLA_TRADES:
        add(species, area, 'Trade', '', level, 'For ' + requested + '. Vanilla B2W2 (Bulbapedia; Redux not independently verified). ' + note)
    for npc, pool in PHONE_TRADES.items():
        for order, species in enumerate(pool, 1):
            add(species, 'Nimbasa City', 'Trade', '', '50',
                'For any Pokemon. ' + npc + ', daily trade ' + str(order) + '/12. Vanilla B2W2 (Bulbapedia); Redux doc says unchanged. '
                'Return the Dropped Item, complete the calls and meet at the Ferris wheel. Hidden Ability; random nature.')
    for species, item in (('latios', 'Soul Dew'), ('latias', 'Soul Dew'), ('giratina', 'Griseous Orb')):
        byid[species]['hi'] = [item]
    obtainable = {pokemon['id'] for pokemon in data['P'] if pokemon['w']}
    pending = list(obtainable)
    while pending:
        species = pending.pop()
        for _, relative in byid[species]['ef'] + byid[species]['et']:
            if relative not in obtainable:
                obtainable.add(relative)
                pending.append(relative)
    for pokemon in data['P']:
        if pokemon['id'] in obtainable:
            pokemon['g'] = 0
        elif pokemon.get('fc') and any(other['id'] in obtainable for other in data['P'] if other['dex'] == pokemon['dex']):
            pokemon['g'] = 0
        else:
            pokemon['g'] = 3
    data['LOC'], data['AR'] = locations, areas
    order = list(range(len(areas)))
    for name, after in (('Floccesy Town', 'Route 19'), ('Liberty Garden', 'Castelia Gardens'),
                        ('Nimbasa City', 'Relic Castle - Upper Floors'), ('Anville Town', 'Nimbasa City'),
                        ('Driftveil City', 'Driftveil Drawbridge, Charizard Bridge')):
        order.remove(byarea[name])
        order.insert(order.index(byarea[after]) + 1, byarea[name])
    data['ARO'] = order
    comparison = mirror_comparison(wild)
    report('Locations: source areas %d; tracker areas %d; sections %d; wild rate rows %d; grotto sections %d / entries %d' %
           (len(wild['areas']), len(areas), sum(len(area['es']) for area in areas),
            sum(len(group['rows']) for area in wild['areas'] for group in area['groups']), len(wild['grottos']),
            sum(len(grotto['rows']) for grotto in wild['grottos'])))
    report('Locations: gifts 13 (ranch egg 17 species); gift-doc statics 4; legendaries %d; trades 3 doc + 3 vanilla + 24 phone' % len(legends))
    for index, area in enumerate(areas):
        report('  Tracker area %d: %s' % (index, area['n']))
    report('Locations mirror: %s' % comparison)
    for area in wild['areas']:
        for group in area['groups']:
            total = sum(row['rate'] for row in group['rows'])
            if total and total != 100:
                report('Doc rate total: %s / %s = %d%% (line %d), kept as printed' % (area['name'], group['method'], total, group['line']))

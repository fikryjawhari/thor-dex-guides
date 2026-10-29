"""Locations (LOC, AR, P.w): the wiki's 67 location pages (method, time, rate; no source has wild levels), its 32 raid
dens, Legendary Pokémon and Mystery Gift pages, checked against the public 2.1.1.1 location guide workbook ("Doc says"
rows where only it lists an encounter) and RomHackDex's location pages (membership, report only).

One tracker slot per area (EI's floor rule): floors, sub-places and dens are sections of their area. Numeric-rate rows
are AR.es sections (rows r [day, night]) repeated in P.w with w[5] = 1; everything else (gifts, statics, trades,
legendaries, the doc's rows) is a plain P.w row and shows under the area's Special section.
"""
from collections import Counter, defaultdict
from pathlib import Path
import re

import openpyxl

from common import H, RD, WIKI, report, sid
from wiki import key, legendaries, mystery_gifts, text

# Game order: the walkthrough parts' headings (Parts 1-40); then the post-game places. Areas added later go at the
# end of AR (saved trackers are keyed by AR index).
ORDER = ['Shadow Base', 'Frozen Heights', 'Route 1', 'Bellin Town', 'Icicle Cave', 'Route 2', 'Dresco Town',
         'Route 3', 'Flower Paradise', 'Grim Woods', 'Route 4', 'Cinder Volcano', 'Route 5', 'Crater Town',
         'KBT Expressway', 'Valley Cave', 'Route 6', 'Route 7', 'Frost Mountain', 'Route 8', 'Blizzard City',
         'Frozen Forest', 'Fallshore City', 'Route 11', 'Epidimy Town', 'Route 10', 'Tehl Town / Underground Pass',
         'Route 9', 'Thundercap Mountain', 'Cliff Cave', 'Tarmigan Town', 'Tarmigan Mansion', 'Route 12',
         'Dehara City', 'Ruins of Void', 'Cinder Volcano Depths', 'Route 13', 'Route 14', 'Auburn Waterway',
         'Lost Tunnel', 'Great Desert', 'Gurun Town', 'Vivill Woods', 'Vivill Town', 'Vivill Warehouse', 'Route 15',
         'Route 16', 'Antisis City', 'Antisis Port', 'Antisis Sewers', 'Ferrothorn Turf', 'Icy Hole', 'Route 17',
         'Seaport City', 'Seaport Warehouses', 'S.S. Marine', 'Polder Town', 'Cootes Bog', 'Magnolia Town',
         'Crystal Peak', 'Magnolia Fields', 'Redwood Village', 'Redwood Forest', 'Route 18', 'Victory Road',
         'Battle Frontier', 'Cube Corp.']
GIFT_AREA = 'Mystery Gift'      # no tracker slot (AR.ns): any Pokémon Center after the Elite Four

# Places the wiki has no location page for, by the page that covers them (walkthrough / Legendary page)
AREA_ALIASES = {'Ice Hole': 'Icy Hole', 'Thundercap Mt.': 'Thundercap Mountain', 'Frozen Height': 'Frozen Heights',
                'Route 9 + Autl Woods': 'Route 9', 'Tehl Town': 'Tehl Town / Underground Pass',
                'Underground Pass': 'Tehl Town / Underground Pass', 'RoV (Underwater)': 'Ruins of Void',
                'Mision HQ': 'Fallshore City', 'Mission HQ': 'Fallshore City', 'Fallshore Mission HQ': 'Fallshore City',
                'Safari Zone': 'Polder Town', 'Magnolia Café': 'Magnolia Town', 'Battleground': 'Seaport City',
                'Seaport Battleground': 'Seaport City', 'Rift Cave': 'Dehara City', 'Distortion World': 'Dehara City',
                'Tomb of Borrius': 'Great Desert', 'Dream Lab': 'Tarmigan Town', 'Nightmare': 'Tarmigan Town',
                'Outside the Dream Research Lab': 'Tarmigan Town', 'Fullmoon Island': 'Tarmigan Town',
                'Newmoon Island': 'Tarmigan Town', 'Cave of Being': 'Route 10', 'Crystal Cave': 'Crystal Peak',
                'Pokémon Center': GIFT_AREA, 'Pokemon Center': GIFT_AREA}
# Doc headings that only respell an area (the others are sub-places, named in the row)
RESPELL = {'Ice Hole', 'Thundercap Mt.', 'Frozen Height', 'Route 9 + Autl Woods', 'Tehl Town', 'Mision HQ'}
# A doc place whose bracket names another area
PLACE_FIX = {'Blizzard City (Frozen Forest)': 'Frozen Forest', 'Seaport City (Warehouse)': 'Seaport Warehouses'}
# Legendary page rows with no place: where the player goes for them
LEGEND_PLACE = {'Entei': 'Great Desert', 'Raikou': 'Great Desert', 'Thundurus': 'Magnolia Fields',
                'Tornadus': 'Magnolia Fields', 'Latias': 'Fallshore City', 'Latios': 'Fallshore City',
                'Phione': 'Ruins of Void'}

NAME_FIX = {'Klank': 'Klang', 'Whirlpide': 'Whirlipede', 'Amoongus': 'Amoonguss', 'Spheal Egg': 'Spheal',
            'Flabebe': 'Flabébé', 'Nidoran♂️': 'Nidoran♂', 'Nidoran♀️': 'Nidoran♀', 'Indeedee♀️': 'Indeedee (F)',
            'Surfing Pikachu': 'Pikachu (Surfing)', 'Flying Pikachu': 'Pikachu (Flying)',
            'Balloon Pikachu': 'Pikachu (Flying)'}     # own forms, not cosmetic
GROUPS = {'One of the Borrius Starters': ['Beldum', 'Gible', 'Larvitar'],
          'Unova Starters': ['Snivy', 'Tepig', 'Oshawott'], 'Sinnoh Starters': ['Turtwig', 'Chimchar', 'Piplup'],
          'Alola Starters': ['Rowlet', 'Litten', 'Popplio'], 'Kanto Starters': ['Bulbasaur', 'Charmander', 'Squirtle'],
          'Kalos Starters': ['Chespin', 'Fennekin']}
METHOD = {'Special Encounter': 'DexNav', 'Special Encounter (Surf)': 'DexNav (Surf)',
          'Special Encounter (Underwater)': 'DexNav (Underwater)', '#Super Rod': 'Super Rod',
          'Blue-Yellow Flowers (actually Yellow, in the north elevated part of Flower Paradise)':
              'Yellow Flowers (north, raised part)'}
NOT_RHD = re.compile(r'dexnav|raid|^(?:gift|static|egg|trade|game corner|mission reward|random egg)', re.I)
NUMERIC = re.compile(r'\d+(?:\.\d+)?%$')
NOTE_GEN8 = 'Gen 8 rows: register any Galar Pokémon first (a trade, or a Mystery Gift after the Elite Four).'
NOTE_SWARM = 'Swarm: 50% in the grass or cave for its hour (one swarm at a time).'
NOTE_GIFT = 'Codes at any Pokémon Center, after the Elite Four.'


def species_names(name):
    if name == 'Jellicent (M, F)':
        return ['Jellicent', 'Jellicent (F)']
    if name == 'Basculin (Red and Blue)':
        return ['Basculin (Red Striped)', 'Basculin (Blue Striped)']
    return [NAME_FIX.get(name, name)]


def species_ids(name):
    out = list(dict.fromkeys(sid(value) for value in species_names(name)))
    if None in out:
        raise ValueError('Unresolved location species: %s' % name)
    return out


def area_name(value):
    value = re.sub(r'\s+', ' ', str(value)).strip()
    if value in PLACE_FIX:
        return PLACE_FIX[value]
    if value in AREA_ALIASES:
        return AREA_ALIASES[value]
    names = [(name, name) for name in ORDER + [GIFT_AREA]] + list(AREA_ALIASES.items())
    for name, area in sorted(names, key=lambda pair: len(pair[0]), reverse=True):
        if key(value).startswith(key(name)):
            return area
    raise ValueError('Unresolved location: %s' % value)


def related(area):
    """Areas a source may file the same place under (Cinder Volcano and its Depths)."""
    return {name for name in ORDER if name.startswith(area) or area.startswith(name)} | {area}


def workbook():
    return openpyxl.load_workbook(Path(H.src) / 'research-2026-10-29/location-guide.xlsx', data_only=True)


def doc_wild(book):
    """The two wide membership sheets: location columns, floor/method separators, colour-coded time."""
    records, labels = [], Counter()
    for sheet_name, header in [('Grass & Cave Encounters', 1), ('Surfing, Fishing, Rock Smash', 3)]:
        sheet = book[sheet_name]
        for column in range(1, sheet.max_column + 1):
            heading = sheet.cell(header, column).value
            if not heading:
                continue
            area = area_name(heading)
            method, floor = ('Grass/cave' if header == 1 else 'Surf'), ''
            for row in range(header + 1, sheet.max_row + 1):
                cell = sheet.cell(row, column)
                if not cell.value:
                    continue
                value = str(cell.value).strip()
                value = re.sub(r'\s+', ' ', value)
                candidate = re.sub(r'\s*\((?:Daily|Weekly|Specific days)\)', '', value, flags=re.I).strip()
                names = GROUPS.get(candidate, species_names(candidate))
                if all(sid(name) for name in names):
                    colour = cell.fill.fgColor
                    colour = colour.rgb if colour.type == 'rgb' else str(colour.indexed)
                    records.append((area, str(heading).strip(), floor, method, names, colour, cell.coordinate))
                elif value in ('Swarm', 'Special Encounter', 'Old Rod', 'Good Rod', 'Super Rod', 'Rock Smash',
                               'Headbutt', 'Surfing', 'Surf'):
                    method = {'Special Encounter': 'DexNav', 'Surfing': 'Surf'}.get(value, value)
                elif value == 'Fishing':
                    continue
                else:
                    labels[value] += 1
                    if re.search(r'\b[1-9]F\b|B[1-9]F|Flowers|Easy|Medium|Hard|Entrance|Underwater|Summit|Outside', value):
                        floor = value
                        if method in ('Swarm', 'DexNav'):
                            method = 'Grass/cave' if header == 1 else 'Surf'
    return records, labels


def doc_specials(book):
    """(area, method, [names], note, cell) from the Gift & Static and Trades & Game Corner sheets."""
    records = []
    sheet = book['Gift & Static Encounters']
    for row in range(4, 53):
        method, place, group, requirement = (sheet.cell(row, column).value for column in (1, 3, 7, 8))
        value = sheet.cell(row, 5).value or sheet.cell(row, 6).value
        if not place:
            if row not in (50, 51):
                continue
            place, method, group = 'Magnolia Café', 'Egg', ('Kalos Starters' if row == 50 else 'Froakie')
            requirement = 'Post-game' if row == 51 else 'Free egg once a day'
        names = GROUPS.get(group)
        if names is None and (value or (group and sid(group))):
            clean = re.sub(r'\s*\((?:Daily|Weekly|Specific days)\)', '', str(value or group), flags=re.I)
            clean = re.sub(r'^(?:Shiny |Gigantamax )+', '', clean).removesuffix(' Egg')
            names = [NAME_FIX.get(name.strip(), name.strip()) for name in clean.split('/')]
        if not names:
            continue
        place = re.sub(r'\s+', ' ', str(place)).strip()
        parts = re.findall(r'\(([^)]*)\)', place) + (['post-game'] if 'post-game' in place.lower() else [])
        if requirement == 'Number of Badges':
            parts.append('one at each badge count')
        elif requirement and str(requirement) != 'None':
            parts.append(str(requirement))
        parts.append(str(value or group))
        area = PLACE_FIX.get(place) or area_name(re.sub(r'\s*\(.*', '', place).removesuffix(' Post-game'))
        records.append((area, str(method), names, '; '.join(parts), 'Gift & Static Encounters!A%d' % row))
    sheet = book['In-game trades & Game Corner']
    for column in (1, 6, 11, 16, 21, 26):
        area = area_name(sheet.cell(4, column).value)
        for row in (6, 7):
            give, receive = sheet.cell(row, column).value, sheet.cell(row, column + 2).value
            if receive:
                records.append((area, 'Trade', [NAME_FIX.get(receive, receive)], 'trade for %s' % give,
                                'In-game trades!%s' % sheet.cell(row, column + 2).coordinate))
        if sheet.cell(12, column).value:
            records.append(('Dehara City', 'Game Corner', [sheet.cell(12, column).value],
                            '%d coins' % int(sheet.cell(11, column).value),
                            'In-game trades!%s' % sheet.cell(12, column).coordinate))
    return records


def doc_legends(book):
    """(names, first place) from the LegendMythical sheet's blocks (name row, then Requires / Location pairs)."""
    out = []
    sheet = book['LegendMythical & Ultra Beasts']
    for row in (3, 14, 25, 36, 47):
        for column in range(1, sheet.max_column, 2):
            value = sheet.cell(row, column).value
            if not value:
                continue
            names = {'Swords of Justice': ['Cobalion', 'Terrakion', 'Virizion']}.get(value) \
                or re.split(r'\s*(?:\+|,|/)\s*', str(value))
            out.append((names, sheet.cell(row + 2, column + 1).value))
    return out


def legend_rows():
    """(area, method, name, how) from the wiki's Legendary Pokémon page."""
    out = []
    for name, cell in legendaries(WIKI):
        area = LEGEND_PLACE.get(name) or area_name(cell)
        low = cell.lower()
        method = ('Mystery Gift' if 'mystery gift' in low else 'Roaming' if 'roaming' in low
                  else 'DexNav' if 'dexnav' in low else 'Egg' if re.search(r'hatches|\begg\b', low)
                  else 'Gift' if re.search(r'reward|inside a bag', low) else 'Static')
        out.append((area, method, name, re.sub(r'\s+\.', '.', cell)))
    return out


RHD_SLUG = {'minior-red-meteor': 'Minior (Core)'}     # the mirror's 404 page (notes.md -> Dex)


def rhd_sid(slug):
    species_id = sid(RHD_SLUG.get(slug, slug))
    if species_id is None:
        raise ValueError('Unresolved RomHackDex location slug: %s' % slug)
    return species_id


def rhd_membership():
    out = {}
    for path in sorted((Path(RD.path) / 'locations').glob('*/index.html')):
        raw = path.read_text(encoding='utf-8')
        title = text(re.search(r'<h1\b[^>]*>(.*?)</h1>', raw, re.S).group(1))
        names = re.findall(r'<tr\b[^>]*class="[^"]*encounter-row[^>]*data-id="([^"]+)"', raw)
        out[title] = {rhd_sid(name) for name in names}
    return out


def membership_differences(data):
    """RomHackDex location pages (mapped to our areas) against our wild rows there (rated rows, swarms, the doc's wild
    rows; not raid dens, DexNav or specials). The mirror's lists are partial (most fishing and Gen 8 rows missing)."""
    ours = defaultdict(set)
    for species in data['P']:
        for row in species['w']:
            wild = (len(row) > 5 and row[5] == 1) or row[1] == 'Swarm' or row[4].startswith('Doc says')
            if wild and not NOT_RHD.search(row[1]) and 'Gen 8' not in row[4]:
                ours[data['LOC'][row[0]]].add(species['id'])
    theirs, pages = defaultdict(set), defaultdict(list)
    for name, members in rhd_membership().items():
        area = area_name(name)
        theirs[area] |= members
        pages[area].append(name)
    return [(area, pages[area], sorted(theirs[area] - ours[area]), sorted(ours[area] - theirs[area]))
            for area in ORDER if area in theirs and theirs[area] != ours[area]]


def when_parts(when):
    """A wiki time cell -> (qualifier shown as its own group, 'both' / 'day' / 'night')."""
    w = re.sub(r'\s+', ' ', when).strip(' ()')
    low = w.lower()
    if low in ('day and night', '–', '-', ''):
        return '', 'both'
    if low in ('day', 'night'):
        return '', low
    dn = 'day' if re.search(r'\bday(time)?\b', low) else 'night' if re.search(r'\bnight(time)?\b', low) else 'both'
    rest = re.sub(r'\(?\b(?:day|night)(?:time)?(?: only)?\b\)?', '', w, flags=re.I).strip(' ,()')
    if rest.startswith('Requires Gen 8 Activation'):
        extra = rest[len('Requires Gen 8 Activation'):].strip(' ,()')
        return 'Gen 8' + ('; ' + extra[0].lower() + extra[1:] if extra else ''), dn
    if rest.startswith('Safari Zone'):
        return rest.removeprefix('Safari Zone ').removesuffix(' Mode').replace('/ ', '/'), dn
    if re.fullmatch(r'Requires post-game', rest, re.I):
        return 'Post-game', dn
    return rest, dn


def species_note(name):
    return '; '.join(word for word in ('Gigantamax', 'Shiny') if word in name)


def build(data):
    pages = {page.title: page for page in WIKI.locations()}
    if set(pages) != set(ORDER):
        raise ValueError('Location page inventory changed: %s' % (set(pages) ^ set(ORDER)))
    data['LOC'] = ['Starter'] + ORDER + [GIFT_AREA]
    data['AR'] = [{'n': name, 'l': [index]} for index, name in enumerate(data['LOC'])]
    data['AR'][0]['st'] = 1
    by_area = {area['n']: area for area in data['AR']}
    by_id = {species['id']: species for species in data['P']}
    for species in data['P']:
        species['w'] = []
    counts, notes = Counter(), defaultdict(list)
    placed = defaultdict(set)       # species id -> areas a wiki source has it in (the starter choice left out)
    differences = []

    def note(area, value):
        if value not in notes[area]:
            notes[area].append(value)

    def w_row(area, species_id, row):
        row = [by_area[area]['l'][0]] + row
        if row not in by_id[species_id]['w']:
            by_id[species_id]['w'].append(row)

    def section_row(area, section, kind, group, species_id, rate, dn, row_note):
        sections = by_area[area].setdefault('es', [])
        box = next((box for box in sections if box['n'] == section), None)
        if box is None:
            box = {'n': section, 'k': kind, 'g': []}
            sections.append(box)
        g = next((g for g in box['g'] if g['m'] == group), None)
        if g is None:
            g = {'m': group, 'rows': []}
            box['g'].append(g)
        x = next((x for x in g['rows'] if x['p'] == species_id), None)
        if x is None:
            x = {'p': species_id, 'r': [0, 0]}
            g['rows'].append(x)
        elif rate:
            counts['wiki slots summed'] += 1
        for j, on in enumerate((dn != 'night', dn != 'day')):
            if on:
                x['r'][j] = round(x['r'][j] + rate, 2)
        if row_note and row_note not in x.get('note', ''):
            x['note'] = (x.get('note', '') + '; ' + row_note).strip('; ')

    # Starter: the picker's area (Shadow Base, the start of the game)
    for name in GROUPS['One of the Borrius Starters']:
        w_row('Starter', sid(name), ['Starter choice', '1 of 3', '', 'Shadow Base, at the start'])

    # The wiki's location pages
    for area in ORDER:
        for floor, name, method, when, rate in pages[area].encounters:
            if method == 'Starter':
                counts['wiki starter rows'] += 1
                continue
            label = METHOD.get(method, method)
            qual, dn = when_parts(when)
            for species_id in species_ids(name):
                if NUMERIC.fullmatch(rate):
                    value = float(rate.rstrip('%'))
                    value = int(value) if value.is_integer() else value
                    group = label + (' · ' + qual if qual else '')
                    if floor:
                        section_row(area, floor, 'water', group, species_id, value, dn, species_note(name))
                    else:
                        section_row(area, group, 'grass', '', species_id, value, dn, species_note(name))
                    row_note = '; '.join(x for x in (floor, qual, dn if dn != 'both' else '', species_note(name)) if x)
                    w_row(area, species_id, [label, rate, '', row_note, 1])
                    counts['wiki wild'] += 1
                    if qual.startswith('Gen 8'):
                        note(area, NOTE_GEN8)
                else:
                    raw = re.sub(r'\s+', ' ', when).strip()
                    row_note = '; '.join(x for x in (floor, '' if raw in ('–', '-', 'Day and Night') else raw,
                                                      species_note(name)) if x)
                    w_row(area, species_id, [label, '?' if rate == '?%' else '', '', row_note])
                    counts['wiki other'] += 1
                placed[species_id].add(area)

    # Swarm timetables (Swarms page) on the area's Swarm rows
    for name, place, schedule in WIKI.swarms():
        area, species_id = area_name(place), sid(name)
        times = 'Swarm: ' + ', '.join('%s %s' % (day, hour.replace(':00', '').lower())
                                            for day, hour in schedule)
        rows = [x for box in by_area[area].get('es', []) for g in box['g'] for x in g['rows']
                if x['p'] == species_id and ('Swarm' in box['n'] or 'Swarm' in g['m'])]
        if not rows and not any(data['LOC'][row[0]] == area and row[1] == 'Swarm' for row in by_id[species_id]['w']):
            section_row(area, 'Swarm', 'grass', '', species_id, 50, 'both', '')
            w_row(area, species_id, ['Swarm', '50%', '', '', 1])
            rows = [x for box in by_area[area]['es'] if box['n'] == 'Swarm' for x in box['g'][0]['rows']
                    if x['p'] == species_id]
            differences.append('%s | %s | Swarms page only (added at 50%%)' % (area, name))
            counts['swarm rows added'] += 1
        for x in rows:
            x['note'] = (x.get('note', '') + '; ' + times).strip('; ')
        for row in by_id[species_id]['w']:
            if data['LOC'][row[0]] == area and row[1] == 'Swarm' and times not in row[4]:
                row[4] = (row[4] + '; ' + times).strip('; ')
        placed[species_id].add(area)
        note(area, NOTE_SWARM)
        counts['swarms'] += 1

    # Raid dens: one section per den, a group per star level
    for den in WIKI.raid_dens():
        area = area_name(den.title.removeprefix('Underwater ').removesuffix(' Raid Den'))
        access = den.access
        lead = re.match(r"(?:The )?[\w. ]+?(?:'s)? Raid Den (?:is |can (?:only )?be )(?:found |located |accessed |hidden )?",
                        access)
        if lead:
            access = access[lead.end()].upper() + access[lead.end() + 1:]
        note(area, '%s: %s' % ('Underwater raid den' if den.title.startswith('Underwater') else 'Raid den', access))
        for name, stars in den.encounters:
            gmax = 'Gigantamax' if re.search(r'Gigantamax|Gmax', name, re.I) else ''
            for species_id in species_ids(re.sub(r'^(?:Gigantamax|Gmax) ', '', name)):
                section_row(area, den.title, 'grass', stars, species_id, 0, 'both', gmax)
                w_row(area, species_id, ['Raid den', '', '', '; '.join(x for x in (stars, gmax) if x), 1])
                counts['raid rows'] += 1
        counts['dens'] += 1

    for area in by_area.values():
        for box in area.get('es', []):
            for g in box['g']:
                g['rows'].sort(key=lambda x: (-max(x['r']), by_id[x['p']]['n']))

    # Legendary Pokémon page: what the location pages lack
    for area, method, name, how in legend_rows():
        species_id = sid(name)
        if species_id is None:
            raise ValueError('Unresolved legendary: %s' % name)
        if placed[species_id] & related(area) or method == 'Mystery Gift':
            counts['legend page matched'] += 1
            continue
        if placed[species_id]:
            differences.append('%s | %s | Legendary page: %s; location pages: %s'
                               % (area, name, how, ', '.join(sorted(placed[species_id]))))
            counts['legend page other place'] += 1
        w_row(area, species_id, [method, '', '', how])
        placed[species_id].add(area)
        counts['legend page added'] += 1

    # Mystery Gift codes
    for code, reward, held in mystery_gifts(WIKI):
        reward = re.sub(r'^Mega ', '', reward)
        species_id = sid(NAME_FIX.get(reward, reward))
        if species_id is None:
            raise ValueError('Unresolved Mystery Gift: %s' % reward)
        w_row(GIFT_AREA, species_id, ['Mystery Gift', '', '', 'Code %s; holds %s' % (code, held)])
        placed[species_id].add(GIFT_AREA)
        counts['mystery gifts'] += 1
    note(GIFT_AREA, NOTE_GIFT)

    # The location guide workbook
    book = workbook()
    wild, labels = doc_wild(book)
    extra = {}
    for area, place, floor, method, names, colour, cell in wild:
        for name in names:
            species_id = species_ids(name)[0]
            if placed[species_id] & related(area):
                counts['doc wild matched'] += 1
                continue
            sub = place if place in AREA_ALIASES and place not in RESPELL else ''
            entry = extra.setdefault((area, species_id, method), {'where': {}, 'cells': [], 'name': name})
            floors = entry['where'].setdefault(sub, [])
            if floor and floor not in floors:
                floors.append(floor)
            entry['cells'].append(cell)
            counts['doc wild cells added'] += 1
    for (area, species_id, method), entry in extra.items():
        where = '; '.join((sub + (': ' if floors else '') if sub else '') + ', '.join(floors)
                          for sub, floors in entry['where'].items()).strip('; ')
        w_row(area, species_id, [method, '', '', 'Doc says' + (': ' + where if where else '')])
        if method == 'DexNav':
            note(area, NOTE_GEN8)
        differences.append('%s | %s | Doc says %s%s | %s' % (
            area, by_id[species_id]['n'], method, ' (%s)' % where if where else '', ' '.join(entry['cells'])))
        counts['doc wild rows added'] += 1
    for area, method, names, detail, cell in doc_specials(book):
        for name in names:
            species_id = species_ids(name)[0]
            if placed[species_id] & related(area):
                counts['doc special matched'] += 1
                continue
            w_row(area, species_id, [method, '', '', 'Doc says: ' + detail])
            differences.append('%s | %s | Doc says %s: %s%s | %s' % (
                area, name, method, detail,
                '; wiki: ' + ', '.join(sorted(placed[species_id])) if placed[species_id] else '', cell))
            counts['doc special added'] += 1
    for names, place in doc_legends(book):
        for name in names:
            species_id = sid(NAME_FIX.get(name, name))
            if species_id is None:
                raise ValueError('Unresolved doc legendary: %s' % name)
            area = area_name(place) if place else None
            if not placed[species_id]:
                differences.append('%s | %s | Doc legend sheet only, no place (not added)' % (area, name))
                counts['doc legend unplaced'] += 1
            elif area and not placed[species_id] & related(area):
                differences.append('%s | %s | Doc legend sheet place; wiki: %s' % (
                    area, name, ', '.join(sorted(placed[species_id]))))
                counts['doc legend other place'] += 1
            else:
                counts['doc legend matched'] += 1
    held = []
    sheet = book['Wild Held Items']
    for row in range(2, sheet.max_row + 1):
        name = sheet.cell(row, 3).value or sheet.cell(row, 2).value
        values = [str(sheet.cell(row, column).value).strip() for column in (6, 8) if sheet.cell(row, column).value
                  and str(sheet.cell(row, column).value).strip() != 'X']
        if not name or not values:
            continue
        species_id = sid(NAME_FIX.get(name, name))
        if not species_id:
            raise ValueError('Unresolved held-item species: %s' % name)
        counts['doc held species'] += 1
        held += ['%s: %s' % (by_id[species_id]['n'], value) for value in values
                 if not any(key(value) in key(existing) for existing in by_id[species_id].get('hi', []))]

    # Availability (EI's rule): anything with a row, plus evolution families both ways; a form change follows its base
    family = {p['id']: [t for _, t in p.get('et', []) + p.get('ef', [])] for p in data['P']}
    found = {p['id'] for p in data['P'] if p['w']}
    queue = list(found)
    while queue:
        for target in family[queue.pop()]:
            if target not in found:
                found.add(target)
                queue.append(target)
    for p in data['P']:
        if p['g'] == 1:
            continue
        base = next((x for x in data['P'] if x['dex'] == p['dex'] and not x.get('fc') and x['g'] != 1), None) \
            if p.get('fc') else None
        p['g'] = 0 if p['id'] in found or (base and base['id'] in found) else 3

    for area in data['AR']:
        if not any(row[0] == area['l'][0] for species in data['P'] for row in species['w']) \
                or area['n'] == GIFT_AREA:
            area['ns'] = 1
        if notes[area['n']]:
            area['note'] = ' '.join(notes[area['n']])
    report('locations: %d areas, %d with a tracker slot; %s' % (
        len(data['AR']), sum(1 for a in data['AR'] if not a.get('ns')), dict(sorted(counts.items()))))
    report('doc separator labels (floors / headings, not species): %d kinds' % len(labels))
    report('NOT FOUND (%d): %s' % (sum(p['g'] == 3 for p in data['P']), ', '.join(p['n'] for p in data['P'] if p['g'] == 3)))
    odd = ['%s / %s / %s: %s%%' % (area['n'], box['n'], g['m'] or '-', total)
           for area in data['AR'] for box in area.get('es', []) for g in box['g'] if 'Raid Den' not in box['n']
           for total in {round(sum(x['r'][j] for x in g['rows']), 2) for j in (0, 1)} if total and total != 100]
    report('WIKI RATE TOTALS NOT 100%% (%d, as the wiki gives them):\n%s' % (len(odd), '\n'.join(odd)))
    report('LOCATION SOURCE DIFFERENCES (%d):\n%s' % (len(differences), '\n'.join(differences)))
    report('DOC WILD HELD ITEMS NOT IN P.hi (%d):\n%s' % (len(held), '\n'.join(held)))
    rhd = membership_differences(data)
    report('RHD MEMBERSHIP DIFFERENCES (%d areas; %d species RHD only, %d guide only):\n%s' % (
        len(rhd), sum(len(x[2]) for x in rhd), sum(len(x[3]) for x in rhd), '\n'.join(
            '%s [%s] | RHD only: %s | guide only: %s' % (area, ', '.join(names), ', '.join(missing) or '-',
                                                         ', '.join(extra) or '-')
            for area, names, missing, extra in rhd)))

"""Reader for the unboundwiki.com export (.src/unboundwiki/unboundwiki.json: one record per page, {title, link,
categories, html}). Stdlib only.

    W = Wiki(path)
    W.pages(category)     [page] in the export's order ('Pokédex', 'Mega Stones', 'Locations', 'Items', ...)
    W.page(title)         one page by title (key match: "Farfetch’d" finds "Galarian Farfetch'd" only by its full title)
    W.pokemon()           {title: Mon} the 967 Pokédex pages
    W.mega_stones()       [Stone] the 48 Mega Stone pages (the Red Orb / Blue Orb page is one)
    W.tutors()            [Tutor] every tutor on the Move Tutors page
    W.trainer_locations() [TrainerRow] the Trainer Locations (List) page's 309 named rows, in page order
    text(html)            an HTML cell as plain text
"""
import html as _html
import json
import re
import unicodedata


def text(s):
    return re.sub(r'\s+', ' ', _html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))).replace('’', "'").strip()


def key(s):
    s = unicodedata.normalize('NFKD', str(s).replace('♀', 'f').replace('♂', 'm')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', s.lower())


def _field(raw, label):
    """The cell after a <th>/<td> whose text is label (the infobox rows: Type, National Dex, Location...)."""
    m = re.search(r'<t[dh][^>]*>\s*%s\s*</t[dh]>\s*<t[dh][^>]*>(.*?)</t[dh]>' % re.escape(label), raw, re.S)
    return m.group(1) if m else None


def _rows(raw):
    return [[text(c) for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', r, re.S)]
            for r in re.findall(r'<tr[^>]*>(.*?)</tr>', raw, re.S)]


def _between(raw, start, ends):
    i = raw.find(start)
    if i < 0:
        return ''
    j = min([k for k in (raw.find(e, i + len(start)) for e in ends) if k > 0] or [len(raw)])
    return raw[i:j]


class Mon:
    """A Pokédex page. types [str], dex int or None, location str, abilities [(name, description, hidden)],
    held [item text], evo [(parent name or None, name, how)] (the page's Evolution Line table: parent None for the
    family's first row, how None for a base / baby row), lv [(level, move)], tm [move], tutor [move], egg [move]."""

    SECTIONS = ['Evolution Line', 'Moveset (Level Up)', 'Learnset (TM/HM)', 'Move Tutor Moves', 'Egg Moves']

    def __init__(self, page):
        raw = page['html']
        self.title, self.link = text(page['title']), page['link']
        self.types = text(_field(raw, 'Type')).split()
        dex = re.search(r'\d+', text(_field(raw, 'National Dex')))
        self.dex = int(dex.group(0)) if dex else None
        self.location = text(_field(raw, 'Location'))
        ab = _between(raw, '>Abilities<', ['>Egg Groups<'])
        self.abilities = []
        for name, desc in re.findall(r'<td class="thh3">(.*?)</td>\s*<td>(.*?)</td>', ab, re.S):
            d = text(desc)
            hidden = '(Hidden Ability)' in d
            self.abilities.append((text(name), d.replace('(Hidden Ability)', '').strip(), hidden))
        held = text(_field(raw, 'Wild Held Items'))
        self.held = [] if held in ('', 'None') else [h.strip() for h in re.split(r',\s*(?![^()]*\))', held) if h.strip()]
        sec = {s: _between(raw, s, [x for x in self.SECTIONS if x != s] + ['Back to:']) for s in self.SECTIONS}
        self.evo, linear = [], None
        for cells in _rows(sec['Evolution Line']):
            cells = [c for c in cells if c]
            if not cells or 'Acquire At' in cells:
                continue
            m = re.match(r'From (.+?) →$', cells[0])
            if m and len(cells) >= 3:
                self.evo.append((m.group(1), cells[1], cells[2]))
                continue
            name, how = cells[0], (cells[1] if len(cells) > 1 else '')
            b = re.match(r'(Base|Baby) form\s*(?:\(breeding\))?\s*(.*)', how)
            if b:
                rest = b.group(2).strip()
                self.evo.append((linear, name, rest) if rest and linear and b.group(1) == 'Base' else (None, name, None))
            else:
                self.evo.append((linear, name, how))
            linear = name
        self.lv = [(int(c[0]), c[1]) for c in _rows(sec['Moveset (Level Up)']) if len(c) > 1 and c[0].isdigit()]
        self.tm = [c[0] for c in _rows(sec['Learnset (TM/HM)']) if len(c) > 1 and c[0] != 'Move']
        self.tutor = [c[0] for c in _rows(sec['Move Tutor Moves']) if len(c) > 1 and c[0] != 'Move']
        self.egg = [c[0] for c in _rows(sec['Egg Moves']) if len(c) > 1 and c[0] != 'Move']


class Stone:
    """A Mega Stone page: name ("Charizardite X"), location (the page's Location line), megas [species text] ("Charizard
    (X)", "Groudon/Kyogre"), trainer (the Mega Trainer or NPC line when the page names one, else None)."""

    def __init__(self, page):
        raw = page['html']
        self.title = text(page['title'])
        rows = [c for c in _rows(raw) if c]
        self.name = re.sub(r'\s*\(Mega Stone\)$', '', rows[0][0]) if rows else self.title
        self.location = text(_field(raw, 'Location'))
        mega = text(_field(raw, 'Mega Evolution'))
        self.megas = [m.strip() for m in mega.split('/') if m.strip()]
        after = [c for r in rows for c in r]
        i = after.index('Mega Evolution') if 'Mega Evolution' in after else -1
        self.trainer = after[i + 2] if 0 <= i < len(after) - 2 else None


class Tutor:
    """One tutor on the Move Tutors page: name (its heading), location, requirement, moves [(move, cost)] (the move
    without its "(Monday, Wednesday, Friday)" days; days kept in cost)."""

    def __init__(self, name, raw):
        self.name = name
        self.location = text(_field(raw, 'Location'))
        self.requirement = text(_field(raw, 'Unlock Requirements') or _field(raw, 'Prerequisites'))
        self.moves = []
        for c in _rows(raw):
            if len(c) >= 2 and c[0] not in ('Move', 'Location', 'Screenshot', 'Unlock Requirements', 'Prerequisites') \
                    and not c[0].endswith('Moves List'):
                m = re.match(r'(.+?)\s*\(([^)]*day[^)]*)\)$', c[0])
                move, days = (m.group(1), m.group(2)) if m else (c[0], '')
                self.moves.append((move, (c[1] + (' (%s)' % days if days else '')).strip()))


class Location:
    """A location's encounter rows, retaining floor, method, time and raw rate (never wild levels)."""

    def __init__(self, page):
        self.title, self.link = text(page['title']), page['link']
        self.encounters = []
        for table in re.findall(r'<table\b.*?</table>', page['html'], re.S):
            rows = re.findall(r'<tr\b[^>]*>(.*?)</tr>', table, re.S)
            if not rows or 'Method' not in text(rows[0]) or 'Rate' not in text(rows[0]):
                continue
            floor = ''
            for row in rows[1:]:
                cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.S)
                if len(cells) == 1:
                    floor = text(cells[0])
                elif len(cells) == 5:
                    name = text(re.split(r'<br\s*/?>', cells[1])[0])
                    self.encounters.append((floor, name, *(text(cell) for cell in cells[2:])))
                else:
                    raise ValueError('%s: unexpected encounter row %s' % (self.title, list(map(text, cells))))


class RaidDen:
    """One den, its access text and species / star levels exactly as listed, excluding reward-item tables."""

    def __init__(self, page):
        self.title, self.link = text(page['title']), page['link']
        intro = page['html'].split('<h2')[0]
        self.access = text(re.findall(r'<p\b[^>]*>(.*?)</p>', intro, re.S)[0])
        self.encounters = []
        for table in re.findall(r'<table\b.*?</table>', page['html'], re.S):
            rows = _rows(table)
            if rows and rows[0] == ['Pokémon', 'Star Level']:
                self.encounters.extend(tuple(row) for row in rows[1:])


class Wiki:
    def __init__(self, path):
        self.all = json.load(open(path, encoding='utf-8'))
        self._mons = None

    def pages(self, category):
        return [p for p in self.all if category in str(p['categories'])]

    def page(self, title):
        k = key(title)
        return next((p for p in self.all if key(text(p['title'])) == k), None)

    def pokemon(self):
        if self._mons is None:
            self._mons = {m.title: m for m in (Mon(p) for p in self.pages('Pokédex'))}
        return self._mons

    def mega_stones(self):
        return [Stone(p) for p in self.pages('Mega Stones') if text(p['title']) != 'Mega Stones']

    def tutors(self):
        raw = self.page('Move Tutors')['html']
        parts = re.split(r'<h[34][^>]*>(.*?)</h[34]>', raw)
        return [Tutor(text(parts[i]), parts[i + 1]) for i in range(1, len(parts) - 1, 2)
                if _field(parts[i + 1], 'Location')]

    def locations(self):
        return [Location(page) for page in self.all if re.search(r'/locations/[^/]+/$', page['link'])]

    def raid_dens(self):
        return [RaidDen(page) for page in self.all if re.search(r'/raid-dens/[^/]+/$', page['link'])]

    def swarms(self):
        """(species, area, [(day of month, time)]) from the per-species timetable headings and tables."""
        parts = re.split(r'<h[23][^>]*>(.*?)</h[23]>', self.page('Swarms')['html'])
        out = []
        for index in range(1, len(parts) - 1, 2):
            heading = re.split(r'\s+[–-]\s+', text(parts[index]))
            tables = re.findall(r'<table\b.*?</table>', parts[index + 1], re.S)
            rows = next((rows for table in tables if (rows := [row for row in _rows(table) if any(row)])
                         and rows[0] == ['Date', 'Time']), [])
            if len(heading) == 2 and rows and rows[0] == ['Date', 'Time']:
                out.append((*heading, [tuple(row) for row in rows[1:]]))
        return out

    def item_areas(self):
        return [p for p in self.all if re.search(r'/locations/[^/]+/?$', p['link'])]

    def item_locations(self):
        found = []
        for page in self.item_areas():
            for heading, block in item_sections(page['html']):
                if re.search(r'item.*location|hidden items', heading, re.I):
                    for cells in _rows(block):
                        if len(cells) >= 2 and cells[0] not in ('Item', 'Items', '#') and cells[1]:
                            found.append((text(page['title']), cells[0], cells[1]))
        return found

    def item_machines(self):
        return [dict(page=p, name=text(p['title']), fields=item_fields(p['html']),
                     requirements=item_prerequisites(p['html']))
                for p in self.all if re.match(r'^(TM|HM)\d+ ', text(p['title']))]

    def item_crystals(self):
        return [(cells[0], cells[1]) for cells in _rows(self.page('Z-Crystals')['html'])
                if len(cells) >= 2 and cells[0].endswith(' Z')]

    def item_details(self):
        found = []
        for page in self.pages('Items'):
            if not re.search(r'/items/(?:key-items|evolution-items)/[^/]+/?$', page['link']):
                continue
            places = []
            for cells in _rows(page['html']):
                if len(cells) >= 2 and cells[0].isdigit():
                    places.append(cells[1])
            fields = item_fields(page['html'])
            if fields.get('Location'):
                places.append(fields['Location'])
            found.append(dict(page=page, name=text(page['title']), fields=fields, places=places,
                              requirements=item_prerequisites(page['html'])))
        return found

    def item_shops(self):
        found = []
        for heading, block in item_sections(self.page('All Shop Inventories')['html']):
            stall = ''
            for cells in _rows(block):
                if len(cells) == 1:
                    stall = cells[0]
                elif len(cells) >= 2 and re.fullmatch(r'[\d,]+', cells[1]):
                    found.append((heading, stall, cells[0], cells[1], cells[2] if len(cells) > 2 else ''))
        return found

    def item_missions(self):
        return [dict(page=p, name=text(p['title']), fields=item_fields(p['html']))
                for p in self.pages('Missions') if re.match(r'^Mission #\d+:', text(p['title']))]

    def trainer_locations(self):
        """The Trainer Locations (List) page: one TrainerRow per named row, in page order. A Pokemon / place cell
        with rowspan covers the next row(s) too: those rows have no cells of their own (15 on the page), so they
        get the place and `shared` = the first row's name, and no team (the cell lists the first row's team)."""
        raw = self.page('Trainer Locations (List)')['html']
        out = []
        for head, body in re.findall(r'<h2[^>]*>(.*?)</h2>(.*?)(?=<h2|$)', raw, re.S):
            spans = []      # [rows left, first row] for an open rowspan
            for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', body, re.S):
                cells = re.findall(r'<td([^>]*)>(.*?)</td>', tr, re.S)
                if not cells:
                    continue
                row = TrainerRow(text(head), cells)
                if len(cells) == 1 and spans and spans[-1][0] > 0:
                    spans[-1][0] -= 1
                    row.shared = spans[-1][1].name
                    row.place = spans[-1][1].place
                for attrs, _ in cells[1:2]:
                    n = re.search(r'rowspan="(\d+)"', attrs)
                    if n:
                        spans.append([int(n.group(1)) - 1, row])
                out.append(row)
        return out


def mystery_gifts(wiki):
    """(password, reward, held item) rows of the Mystery Gift Codes page."""
    page = next(p for p in wiki.all if p['link'].endswith('/extras/mystery-gift-codes/'))
    rows = [row for table in re.findall(r'<table\b.*?</table>', page['html'], re.S) for row in _rows(table)]
    return [tuple(row) for row in rows if len(row) == 3 and row[0] != 'Password']


def legendaries(wiki):
    """(species, place and condition) rows of the Legendary Pokémon page."""
    page = next(p for p in wiki.all if p['link'].endswith('/extras/legendary-pokemon/'))
    rows = [row for table in re.findall(r'<table\b.*?</table>', page['html'], re.S) for row in _rows(table)]
    return [(row[0], row[1]) for row in rows if len(row) >= 2 and row[0] != 'Pokémon']


def item_sections(raw):
    parts = re.split(r'<h[234][^>]*>(.*?)</h[234]>', raw, flags=re.S)
    return [(text(parts[index]), parts[index + 1]) for index in range(1, len(parts) - 1, 2)]


def item_fields(raw):
    fields = {}
    for cells in _rows(raw):
        if len(cells) == 2:
            fields.setdefault(cells[0].rstrip(':'), cells[1])
    return fields


def item_prerequisites(raw):
    requirements = []
    for heading, block in item_sections(raw):
        if re.search(r'prerequisites|requirements', heading, re.I):
            requirements.extend(text(part) for part in re.findall(r'<li[^>]*>(.*?)</li>', block, re.S))
    return list(dict.fromkeys(requirements))


def item_crystal_parts(wiki):
    """The Z-Crystals table split at its line breaks: [(name, [places (the bold lines)], post-game, how)]."""
    out = []
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', wiki.page('Z-Crystals')['html'], re.S):
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)
        if len(cells) < 2 or not text(cells[0]).endswith(' Z'):
            continue
        lines = [ln for ln in (text(x) for x in re.split(r'<br\s*/?>', cells[1])) if ln]
        places = [text(x) for x in re.findall(r'<strong>(.*?)</strong>', cells[1], re.S)]
        post = any(re.fullmatch(r'\(post-game\)', ln, re.I) for ln in lines)
        how = ' '.join(ln for ln in lines if ln not in places and not re.fullmatch(r'\(post-game\)', ln, re.I))
        out.append((text(cells[0]), places, post, how))
    return out


def useful_npcs(wiki):
    """The Useful NPCs pages (misc-info/useful-npcs/<npc>/): [(name without "(NPC)", fields {Location, ...})]."""
    return [(re.sub(r'\s*\(NPCs?\)$', '', text(p['title'])), item_fields(p['html']))
            for p in wiki.all if re.search(r'/useful-npcs/[^/]+/?$', p['link'])]


def frontier_vendors(wiki):
    """The Battle Frontier page's Vendors: [(vendor, function, [[cell, ...] rows after its Function / Cost lines])]."""
    raw = dict(item_sections(wiki.page('Battle Frontier')['html'])).get('Vendors', '')
    out = []
    for cells in _rows(raw):
        cells = [c for c in cells if c]
        if len(cells) == 1:
            out.append([cells[0], '', []])
        elif out and len(cells) == 2 and cells[0] == 'Function':
            out[-1][1] = cells[1]
        elif out and cells and cells[0] not in ('Cost', 'Move', 'Item', 'TM'):
            out[-1][2].append(cells)
    return [tuple(v) for v in out]


class TrainerRow:
    """A Trainer Locations row: area (the page's h2), name, mons [(species, level)] as the wiki writes them, place
    (the Location and Requirements cell), cells (how many cells the row has), shared (see trainer_locations)."""

    def __init__(self, area, cells):
        self.area, self.cells, self.shared = area, len(cells), None
        self.name = text(cells[0][1])
        team = cells[1][1] if len(cells) > 1 else ''
        self.mons = [(text(n), int(lv)) for n, lv in
                     re.findall(r'<strong>(.*?)</strong>.*?\(Lv\.\s*(\d+)\)', team, re.S)]
        self.place = text(cells[2][1]) if len(cells) > 2 else ''

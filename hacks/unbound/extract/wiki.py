"""Reader for the unboundwiki.com export (.src/unboundwiki/unboundwiki.json: one record per page, {title, link,
categories, html}). Stdlib only.

    W = Wiki(path)
    W.pages(category)     [page] in the export's order ('Pokédex', 'Mega Stones', 'Locations', 'Items', ...)
    W.page(title)         one page by title (key match: "Farfetch’d" finds "Galarian Farfetch'd" only by its full title)
    W.pokemon()           {title: Mon} the 967 Pokédex pages
    W.mega_stones()       [Stone] the 48 Mega Stone pages (the Red Orb / Blue Orb page is one)
    W.tutors()            [Tutor] every tutor on the Move Tutors page
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

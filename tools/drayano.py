"""Readers for Drayano-family .txt docs (Blaze Black 2 / Volt White 2 Redux, Renegade Platinum; Sacred Gold, Storm
Silver, Blaze Black 2 and Volt White 2 use the same layout). Stdlib only. A hack's extract reads its docs with these and
keeps the hack's own choices (which version, which forms, docs over mirror) in its extract/.

    import drayano
    doc = drayano.read('hacks/<hack>/.src/Pokemon Changes.txt')     Doc: lines, title, version, blocks
    names = drayano.Names('move', canonical_names)                  the one name fixer; names.fixes is the record
    drayano.pokemon_changes(doc)      [Species]: num, name, line, fields (kind, versions, form, rows)
        Species.pick(kind, version='Complete', form=None) -> Field;  stats() / types() / abilities() / level_up() /
        tm_compat() / evolution() read a field's rows
    drayano.move_changes(doc)         MoveChanges: replacements [(old, new, line)], blocks [MoveBlock(name, line, foot,
                                      changes [Change(field, old, new, mark, text, line)])], footnotes {stars: text}
    drayano.type_changes(doc)         [(dex, name, old types, new types, justification, line)]
    drayano.evolution_changes(doc)    [(dex or None, name, sentence, line)]; evo_method(sentence) -> Evo
    Trainers, wild areas, items, gifts, trades, legendaries: the functions at the end (next units' hooks).

Both dialects: BB2R's species fields name the version and form in brackets ("Ability (Complete / Normal Forme):",
three ability slots: regular / regular / hidden) and its move changes are "- Power 20 -> 35 [!]" bullets; RP's write
"Ability:" (both versions, two regular slots), "Base Stats (Trash Cloak) (Complete):" and "Power: 65 >> 75". Separator
lines may carry trailing spaces, tabs stand in for spaces, and one BB2R header prints the wrong dex number (Kyurem as
546): the readers keep the printed number and line, and the extract resolves species by name.

Names: every name read from a doc goes through a Names (move / ability / item / species) built on the canonical list
(the RomHackDex mirror's names). It fixes, in order: spacing and case ("BubbleBeam"), the family's known aliases and
typos (ALIASES / TYPOS below: regional spellings, legacy names, misspellings seen in the docs), then a unique closest
name within edit distance 2. Every fix is recorded with where it was (names.fixes); a name it can't place is recorded
in names.unresolved and returned as None, never guessed further. names.lines() is the build report's list.
"""
import collections
import re
import unicodedata

# ---- reading ------------------------------------------------------------------------------------------------------


class Doc:
    """A doc's lines (1-based: lines[0] is '' so line numbers match the file), right-stripped, tabs as spaces."""

    def __init__(self, path):
        self.path = path
        raw = open(path, encoding='utf-8', errors='replace').read().replace('\r', '')
        self.lines = [''] + [l.replace('\t', '    ').rstrip() for l in raw.split('\n')]
        box = [l.strip('| ') for l in self.lines[1:5] if l.startswith('|')]
        m = re.search(r'\(v(\d[\d.]*)\)', ' '.join(box))
        self.version = m.group(1) if m else None
        self.title = re.sub(r'\s*\(v[\d.]+\)', '', box[-1]) if box else None

    def blocks(self):
        """[(title, line, start, end)]: every heading boxed by '=' lines ("====\\nTitle\\n===="), body lines
        start..end-1. Sections (57 '=') and species headers (19 '=') alike."""
        L, out = self.lines, []
        for i in range(2, len(L) - 1):
            if L[i] and re.fullmatch(r'=+', L[i - 1]) and re.fullmatch(r'=+', L[i + 1]) and not re.fullmatch(r'=+', L[i]):
                out.append([L[i].strip(), i, i + 2, None])
        for a, b in zip(out, out[1:]):
            a[3] = b[1] - 1
        if out:
            out[-1][3] = len(L)
        return [tuple(b) for b in out]

    def section(self, title):
        """Body lines [(line, text)] of the first block with this title (case-insensitive), or []."""
        for t, _, a, b in self.blocks():
            if t.lower() == title.lower():
                return [(i, self.lines[i]) for i in range(a, b)]
        return []


def read(path):
    return Doc(path)


# ---- names --------------------------------------------------------------------------------------------------------


def key(s):
    s = unicodedata.normalize('NFKD', str(s).replace('♀', 'f').replace('♂', 'm')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', s.lower())


# Regional spellings and older names the docs use: fixed without a claim that anything changed.
ALIASES = {
    'move': {'Faint Attack': 'Feint Attack', 'Acid Armour': 'Acid Armor', 'Judgement': 'Judgment',
             'Minimise': 'Minimize', 'Razorwind': 'Razor Wind', 'Hi Jump Kick': 'High Jump Kick',
             'SmokeScreen': 'Smokescreen', 'Vice Grip': 'Vise Grip', 'Vicegrip': 'Vise Grip'},
    'ability': {'Synchronise': 'Synchronize', 'Normalise': 'Normalize', 'Compoundeyes': 'Compound Eyes',
                'Lightningrod': 'Lightning Rod'},
    'item': {'NeverMeltIce': 'Never-Melt Ice', 'Sitrus Berries': 'Sitrus Berry'},
    'species': {},
}
# Misspellings seen in the family's docs (BB2R audit 2026-10-29, plans/blaze-black-2-redux-sources.md section 2).
TYPOS = {
    'move': {'Twinneedle': 'Twineedle', 'Sliver Wind': 'Silver Wind', 'Autonomize': 'Autotomize',
             'Will-O-Wiisp': 'Will-O-Wisp', 'Ominous Mind': 'Ominous Wind', 'Accupressure': 'Acupressure',
             'Scorching Sand': 'Scorching Sands', 'Magic Leaf': 'Magical Leaf', 'Acid Amor': 'Acid Armor',
             'Bonomerang': 'Bonemerang', 'Sword Dance': 'Swords Dance', 'Sleep Power': 'Sleep Powder',
             'Slee Powder': 'Sleep Powder', 'Mystic Fire': 'Mystical Fire', 'ock Slide': 'Rock Slide',
             'V-Creat': 'V-create', 'Dragon Meteor': 'Draco Meteor', 'Sheel Smash': 'Shell Smash',
             'Stength': 'Strength', 'Submisson': 'Submission'},
    'ability': {'Screne Grace': 'Serene Grace', 'Bad Breams': 'Bad Dreams', 'Water Abosrb': 'Water Absorb',
                'Study': 'Sturdy'},
    'item': {'Air Ballon': 'Air Balloon', 'Cobat Berry': 'Coba Berry', 'Wide Lense': 'Wide Lens',
             'Perism berries': 'Persim Berry', 'Gracadia': 'Gracidea'},
    'species': {'Treeko': 'Treecko', 'Phanphy': 'Phanpy'},
}


def distance(a, b, cap=3):
    """Levenshtein distance, stopping early once every path is past cap."""
    if abs(len(a) - len(b)) > cap:
        return cap + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        if min(cur) > cap:
            return cap + 1
        prev = cur
    return prev[-1]


class Names:
    """Canonical names of one kind. names(raw, where) -> canonical name or None. Records every fix:
    fixes {(raw, canonical): {'how': format|alias|typo|fuzzy, 'where': [..]}}, unresolved {raw: [where..]}."""

    def __init__(self, kind, canonical, aliases=None, typos=None):
        self.kind = kind
        self.canon = {}
        for n in canonical:
            self.canon.setdefault(key(n), n)
        self.aliases = {key(a): b for a, b in {**ALIASES.get(kind, {}), **(aliases or {})}.items()}
        self.typos = {key(a): b for a, b in {**TYPOS.get(kind, {}), **(typos or {})}.items()}
        self.fixes = collections.OrderedDict()
        self.unresolved = collections.OrderedDict()

    def _note(self, raw, name, how, where):
        rec = self.fixes.setdefault((raw, name), {'how': how, 'where': []})
        if where and len(rec['where']) < 50:
            rec['where'].append(where)

    def __call__(self, raw, where=''):
        raw = re.sub(r'\s+', ' ', str(raw)).strip()
        k = key(raw)
        if not k:
            return None
        if k in self.canon:
            name = self.canon[k]
            if name != raw:
                self._note(raw, name, 'format', where)
            return name
        for table, how in ((self.aliases, 'alias'), (self.typos, 'typo')):
            if k in table and key(table[k]) in self.canon:
                name = self.canon[key(table[k])]
                self._note(raw, name, how, where)
                return name
        best = sorted((distance(k, c), c) for c in self.canon)
        if best and best[0][0] <= 2 and (len(best) == 1 or best[1][0] > best[0][0]) and len(k) > 4:
            name = self.canon[best[0][1]]
            self._note(raw, name, 'fuzzy', where)
            return name
        self.unresolved.setdefault(raw, []).append(where)
        return None

    def lines(self, formats=False):
        """Report lines: one per fix (how, raw -> name, count, first places), then the unresolved names."""
        out = []
        for (raw, name), rec in self.fixes.items():
            if rec['how'] == 'format' and not formats:
                continue
            w = rec['where']
            out.append('  %s %s: %s -> %s (%d: %s)' % (self.kind, rec['how'], raw, name, len(w), ', '.join(w[:3])))
        for raw, w in self.unresolved.items():
            out.append('  %s UNRESOLVED: %s (%d: %s)' % (self.kind, raw, len(w), ', '.join(w[:3])))
        return out

    def count(self, how=None):
        return sum(1 for r in self.fixes.values() if how is None and r['how'] != 'format' or r['how'] == how)


# ---- Pokemon Changes ------------------------------------------------------------------------------------------------

VERSIONS = ('Complete', 'Classic')
KINDS = ('Level Up', 'Base Stats', 'Ability', 'Type', 'Moves', 'Evolution', 'Base Happiness', 'Base Experience',
         'Base Exp', 'EVs', 'Held Item', 'Gender Ratio', 'Catch Rate', 'Other')


class Field:
    """One heading of a species block: kind ('Ability', 'Level Up'...), versions (set of 'Complete' / 'Classic';
    None = both), form (the heading's form label, None = every form), line, rows [(line, text)] (blank rows dropped),
    malformed (the heading's own text when it needed repair)."""

    def __init__(self, head, line, rows):
        self.head, self.line, self.rows, self.malformed = head, line, rows, None
        h = head.rstrip(':').strip()
        if h.count('(') != h.count(')'):
            self.malformed = head
            h = h.replace(')', '').replace('(', '')
        kind = re.match(r'[^(]*', h).group(0).strip()
        quals = [q.strip() for g in re.findall(r'\(([^)]*)\)', h) for q in g.split('/')]
        if kind not in KINDS:          # "Black Kyurem:" = a form's level-up list
            quals, kind = [kind] + quals, 'Level Up'
        self.kind = kind
        vs = {q for q in quals if q in VERSIONS}
        self.versions = vs or None
        forms = [q for q in quals if q not in VERSIONS]
        self.form = ' / '.join(forms) or None

    def old_new(self):
        """(old text, new text) of an Old / New pair (either may be None)."""
        got = {}
        for _, t in self.rows:
            m = re.match(r'\s*(Old|New)\s+(.*)$', t)
            if m:
                got[m.group(1)] = m.group(2).strip()
        return got.get('Old'), got.get('New')


def parse_stats(s):
    m = re.search(r'(\d+) HP / (\d+) Atk / (\d+) Def / (\d+) SAtk / (\d+) SDef / (\d+) Spd', s or '')
    return [int(x) for x in m.groups()] if m else None


def parse_slash(s):
    """'Solar Power / Overgrow / -' -> ['Solar Power', 'Overgrow', None] ('-' / 'None' are empty slots)."""
    return [None if x.strip() in ('-', 'None', '') else x.strip() for x in (s or '').split('/')]


LV_MARKS = re.compile(r'\s*(\[\*\]|\(!+\))\s*')


class Species:
    def __init__(self, num, name, line, fields):
        self.num, self.name, self.line, self.fields = num, name, line, fields

    def pick(self, kind, version='Complete', form=None):
        """The field of this kind for the version and form. A field for the exact form wins over one for every form
        (no label, or "All ..."); a field for this version over one for both; one for the other version never."""
        best, rank = None, -1
        for f in self.fields:
            if f.kind != kind or f.versions and version not in f.versions:
                continue
            if f.form == form:
                r = 2
            elif f.form is None or f.form.startswith('All '):
                r = 0
            else:
                continue
            r += 1 if f.versions else 0
            if r > rank:
                best, rank = f, r
        return best

    def stats(self, **kw):
        f = self.pick('Base Stats', **kw)
        return parse_stats(f.old_new()[1]) if f else None

    def types(self, **kw):
        f = self.pick('Type', **kw)
        return [t for t in parse_slash(f.old_new()[1]) if t] if f else None

    def abilities(self, **kw):
        f = self.pick('Ability', **kw)
        return parse_slash(f.old_new()[1]) if f else None

    def level_up(self, **kw):
        """[(level, move as printed, marks, line)] or None when the doc lists none for this form."""
        f = self.pick('Level Up', **kw)
        if not f:
            return None
        out = []
        for i, t in f.rows:
            m = re.match(r'\s*(\d+)\s*-\s*(.+?)\s*$', t)
            if m:
                marks = ''.join(LV_MARKS.findall(m.group(2)))
                out.append((int(m.group(1)), LV_MARKS.sub(' ', m.group(2)).strip(), marks, i))
        return out

    def tm_compat(self, **kw):
        """[(machine 'TM56', move as printed, line)] from "Now compatible with TM56, Weather Ball." rows."""
        f = self.pick('Moves', **kw)
        return [(m.group(1), m.group(2).strip(), i) for i, t in (f.rows if f else [])
                for m in [re.search(r'compatible with ((?:TM|HM)\d+),\s*(.+?)\.?\s*$', t)] if m]

    def evolution(self, **kw):
        f = self.pick('Evolution', **kw)
        return [(t.strip(), i) for i, t in (f.rows if f else []) if t.strip()]


def pokemon_changes(doc):
    """Every species block in doc order. Field headings are unindented 'Name (...):' lines; a field runs to the next
    heading; rows keep their source line numbers."""
    out = []
    for title, line, a, b in doc.blocks():
        m = re.fullmatch(r'(\d{3}) - (.+)', title)
        if not m:
            continue
        fields, head, hl, rows = [], None, None, []
        for i in range(a, b):
            t = doc.lines[i]
            if re.fullmatch(r'=+', t):
                continue
            if re.fullmatch(r'[A-Za-z][^:]*:', t) or t in KINDS:     # Beldum's "Catch Rate" has no colon
                if head:
                    fields.append(Field(head, hl, rows))
                head, hl, rows = t, i, []
            elif t.strip() and head:
                rows.append((i, t))
        if head:
            fields.append(Field(head, hl, rows))
        out.append(Species(int(m.group(1)), m.group(2).strip(), line, fields))
    return out


# ---- Move Changes ---------------------------------------------------------------------------------------------------

Change = collections.namedtuple('Change', 'field old new mark text line')
MoveBlock = collections.namedtuple('MoveBlock', 'name line foot section changes')
MoveChanges = collections.namedtuple('MoveChanges', 'replacements blocks footnotes general')
FIELDS = ('Power', 'PP', 'Accuracy', 'Priority', 'Type', 'Successive Hits Power', 'Effect Chance', 'Category')
MOVE_SECTIONS = ('Type Changes', 'Redux Move Modifications', 'Legends: Arceus Moves', 'Move Modifications')


def _change(t, line, section):
    """One change row: BB2R ' - Power 20 -> 35 [!]' / ' - PP 10' / ' - Normal -> Fairy' (in Type Changes), RP
    'Power: 65 >> 75'. Anything else is kept as text (field None)."""
    body = re.sub(r'^\s*-\s*', '', t).strip()
    mark = None
    m = re.search(r'\s*\[(!|L:A)\]$', body)
    if m:
        mark, body = m.group(1), body[:m.start()].strip()
    text = body                                  # keeps a footnote's stars ("Power 60 -> 50**")
    body = re.sub(r'\*+$', '', body).strip()
    m = re.fullmatch(r'(%s):?\s+(.+?)\s*(?:->|>>|>)\s*(.+)' % '|'.join(map(re.escape, FIELDS)), body)
    if m:
        return Change(m.group(1), m.group(2).strip(), m.group(3).strip(), mark, text, line)
    m = re.fullmatch(r'(%s):?\s+(\S+)' % '|'.join(map(re.escape, FIELDS)), body)
    if m:
        return Change(m.group(1), None, m.group(2), mark, text, line)
    m = re.fullmatch(r'([+-]\d+) Priority.*', body)          # Esper Wing: "+1 Priority like Quick Attack"
    if m:
        return Change('Priority', None, m.group(1), mark, text, line)
    m = re.fullmatch(r'([A-Z][a-z]+)\s*->\s*([A-Z][a-z]+)', body)
    if m and section == 'Type Changes':
        return Change('Type', m.group(1), m.group(2), mark, text, line)
    return Change(None, None, None, mark, text, line)


def move_changes(doc):
    reps = []
    rows = doc.section('Move Replacements')
    table = False
    for i, t in rows:
        if re.match(r'-{3,}', t.strip()):
            table = True
            continue
        m = re.fullmatch(r'(\S.*?)\s{2,}(\S.*)', t)
        if table and m:
            reps.append((m.group(1).strip(), m.group(2).strip(), i))
    blocks, foot, general = [], {}, []
    for sec in MOVE_SECTIONS:
        rows = doc.section(sec)
        k = 0
        while k < len(rows):
            i, t = rows[k]
            nxt = rows[k + 1][1] if k + 1 < len(rows) else ''
            m = re.fullmatch(r'(\*+)(\S.*)', t)
            if m:
                foot[m.group(1)] = m.group(2).strip()
            head = re.fullmatch(r"([A-Z][A-Za-z0-9' -]{1,24}?)\s*(\*+)?", t)
            is_row = lambda x: re.match(r'\s*-\s', x) or re.match(r'(%s):' % '|'.join(FIELDS), x)
            if head and is_row(nxt):
                changes = []
                k += 1
                while k < len(rows) and rows[k][1].strip() and is_row(rows[k][1]):
                    changes.append(_change(rows[k][1], rows[k][0], sec))
                    k += 1
                blocks.append(MoveBlock(head.group(1).strip(), i, head.group(2), sec, changes))
                continue
            if re.match(r'\s*-\s', t) and sec != 'Type Changes':
                general.append((i, t.strip(' -')))
            k += 1
    return MoveChanges(reps, blocks, foot, general)


# ---- Type Changes ---------------------------------------------------------------------------------------------------


def type_changes(doc):
    """[(dex, name, old [types], new [types], justification, line)] from the fixed-width '#NNN Name  Old  New  Why'
    rows (the "Complete version only" table in both hacks)."""
    out = []
    for i, t in enumerate(doc.lines):
        m = re.fullmatch(r'#(\d{3}) (\S.*?)\s{2,}(\S.*?)\s{2,}(\S.*?)(?:\s{2,}(.*))?', t)
        if m:
            sp = lambda s: [x.strip() for x in s.split('/')]
            out.append((int(m.group(1)), m.group(2).strip(), sp(m.group(3)), sp(m.group(4)), (m.group(5) or '').strip(), i))
    return out


# ---- Evolution Changes ----------------------------------------------------------------------------------------------

Evo = collections.namedtuple('Evo', 'into how add')


def evolution_changes(doc):
    """[(dex or None, species, sentence, line)]: BB2R '021 Spearow    Now evolves into ...' rows and their indented
    continuation rows (same species); RP '- Poliwhirl: Now able to evolve into ...' bullets."""
    out, cur = [], None
    for i, t in enumerate(doc.lines):
        m = re.fullmatch(r'(\d{3})\s+(\S.*?)\s{2,}(Now .*)', t)
        if m:
            cur = (int(m.group(1)), m.group(2).strip())
            out.append(cur + (m.group(3).strip(), i))
            continue
        m = re.fullmatch(r'\s{6,}(Now .*)', t)
        if m and cur:
            out.append(cur + (m.group(1).strip(), i))
            continue
        m = re.fullmatch(r'-\s*(.+?):\s*(Now .*)', t)
        if m:
            cur = (None, m.group(1).strip())
            out.append(cur + (m.group(2).strip(), i))
            continue
        if t.strip():
            cur = None
    return out


def evo_method(s):
    """A 'Now evolves into X ...' / 'Now able to evolve into X by ...' sentence -> Evo(into, how, add): how in the
    guides' wording ('level 21', 'using Link Cable', 'level up knowing Heal Bell'); add = the doc keeps the old method
    too ("in addition to its normal evolution method", RP's "Now able to")."""
    s = s.strip().rstrip('.')
    m = re.match(r'(?i)(?:Now )?(?:only )?(?:evolves|able to evolve) into (.+?) (at Level|at any time|via|by|if|after|when|with|using) (.*)$', s)
    if not m:
        return None
    into, rest = m.group(1).strip(), (m.group(2) + ' ' + m.group(3)).strip()
    add = 'in addition to' in rest or 'able to' in s
    rest = re.sub(r'\s*in addition to its normal evolution method', '', rest)
    sex = re.search(r'if (?:\w+ is )?(female|male)', rest, re.I)
    lvl = re.search(r'(?i)at Level (\d+)', rest)
    item = re.search(r'(?:via the use of|using|^with) (?:an? |the )?(.+)$', rest)
    if lvl:
        how = 'level %s' % lvl.group(1)
        place = re.search(r'after last battling in (.+?) at Level', rest)
        extra = [sex.group(1).lower()] if sex else []
        if place:
            extra.append('last battle in ' + place.group(1))
        if extra:
            how += ' (%s)' % ', '.join(extra)
    elif item:
        how = 'using ' + item.group(1).strip() + (' (%s)' % sex.group(1).lower() if sex else '')
    elif re.search(r'knowing the move (.+)$', rest):
        how = 'level up knowing ' + re.search(r'knowing the move (.+)$', rest).group(1)
    elif re.search(r'when an? (.+?) is in the party', rest):
        how = 'level up with %s in the party' % re.search(r'when an? (.+?) is in the party', rest).group(1)
    elif re.search(r'(\d+)\+? friendship', rest):
        how = 'level up with %s+ friendship' % re.search(r'(\d+)\+? friendship', rest).group(1)
    elif re.search(r'when happy', rest):
        how = 'level up with high friendship' + (' (any time of day)' if 'regardless of the time' in rest else '')
    else:
        how = rest
    return Evo(into, how, add)


# ---- hooks for the next units (not written yet) ---------------------------------------------------------------------


def trainers(doc, dialect):
    """Trainer Changes (BB2R) / TrainerPokemon (RP) -> location sections of battle records with their teams.
    BB2R: '● Youngster Terrell:' headers, 'Species [Ability], lv.N @Item: Move, Move' rows, Normal/Challenge blocks,
    partners (left / right / tag), '*' = Complete-only ability. RP: inline 'Name  Species Lv. n, ...' rows and boss rows
    'Species (Lv. n) @ item / nature / ability / moves', Vs. Seeker rematches. Both resolve species / moves / abilities
    / items through Names (the structural repairs in the BB2R audit section 2 stay recorded)."""
    raise NotImplementedError('drayano.trainers: the trainers unit writes it')


def wild(doc, dialect):
    """BB2R -> {areas, grottos, events}. Areas have printed names and method groups; rows keep species, levels,
    rate, note and source line. Grottos keep rarity instead of percentages; --% events are not wild slots.
    RP's comma lists / time-of-day format awaits its locations unit."""
    if dialect != 'bb2r':
        raise NotImplementedError('wild dialect: ' + dialect)
    areas, grottos, events = [], [], []
    area, grotto, rarity = None, None, None
    groups = {}
    in_grottos = False
    slot = re.compile(r'^(.+?)\s+(?:Lv\.\s*)?(\d+(?:-\d+)?)\s*(.*?)\s*(\d+|--)%$')
    for line, text in enumerate(doc.lines):
        if text.strip() == 'Hidden Grotto Guide':
            in_grottos = True
            continue
        heading = re.fullmatch(r'~+\s*(.*?)\s*~+', text.strip())
        if heading:
            groups = {}
            if in_grottos:
                grotto = {'name': heading[1], 'line': line, 'rows': []}
                grottos.append(grotto)
                rarity = None
            else:
                area = {'name': heading[1], 'line': line, 'groups': []}
                areas.append(area)
            continue
        if in_grottos:
            if not grotto:
                continue
            category = re.fullmatch(r'(Guaranteed|Common|Uncommon|Rare) Encounters:', text.strip())
            if category:
                rarity = category[1]
            elif rarity == 'Guaranteed' and 'Lv. 30 Stantler' in text:
                grotto['rows'].append({'species': 'Stantler', 'levels': '30', 'rarity': rarity, 'line': line})
            elif rarity in ('Common', 'Uncommon', 'Rare') and re.fullmatch(r'\s*- .+', text):
                grotto['rows'].append({'species': text.strip()[2:].strip(), 'levels': '', 'rarity': rarity, 'line': line})
            continue
        if not area:
            continue
        cells = [(match.start(), match.group().strip()) for match in re.finditer(r'\S.*?(?=\s{3,}|$)', text)]
        for column, cell in cells:
            side = int(column >= 39)
            match = slot.fullmatch(cell)
            if match:
                species, levels, note, rate = match.groups()
                row = {'species': species.rstrip('*').strip(), 'levels': levels, 'note': note.strip(), 'line': line}
                if rate == '--':
                    events.append(dict(row, area=area['name'], method=groups.get(side, {}).get('method', 'Static')))
                else:
                    if side not in groups:
                        raise ValueError('%s:%d: slot without method: %s' % (doc.path, line, cell))
                    groups[side]['rows'].append(dict(row, rate=int(rate)))
                continue
            if re.match(r'^(Grass|Surf|Fish|Cave|Sand|Sewer|Bridge|Floor|Rooms|Swamps|Roof|Special Event|Hidden Grotto)[,: ]', cell):
                headings = re.findall(r'[^:]+:', cell) or [cell]
                for offset, title in enumerate(headings):
                    group = {'method': title.strip().rstrip(':'), 'line': line, 'rows': []}
                    groups[side + offset] = group
                    area['groups'].append(group)
    return {'areas': areas, 'grottos': grottos, 'events': events}


def items(doc, dialect):
    """Item Changes: BB2R 'Old -> New' placement lines with hidden markers, quantities and difficulty stars, TM rows;
    RP grouped categories -> [(area, old, new, note, line)]."""
    raise NotImplementedError('drayano.items: the items unit writes it')


def gifts(doc, dialect):
    """Gift Pokemon (BB2R) / SpecialEvents (RP): blocks of 'Location:' / 'Level:' fields, choices, the ranch egg pool."""
    if dialect != 'bb2r':
        raise NotImplementedError('gifts dialect: ' + dialect)
    return _encounter_blocks(doc)


def trades(doc, dialect):
    """Trade Changes: named trades with Location and trait bullets (BB2R prose; RP slash IVs and natures)."""
    if dialect != 'bb2r':
        raise NotImplementedError('trades dialect: ' + dialect)
    blocks = _encounter_blocks(doc)
    for block in blocks:
        match = re.search(r'looking for (?:an? )?(.+?) in exchange for (.+?),', block['text'])
        if not match:
            raise ValueError('trade pair missing: ' + block['name'])
        block['requested'], block['species'] = match.groups()
    return blocks


def _encounter_blocks(doc):
    out, current, kind = [], None, 'Gift'
    for line, text in enumerate(doc.lines):
        if text == 'Special Encounters':
            kind = 'Static'
        if line + 1 < len(doc.lines) and doc.lines[line + 1] == '---' and text.strip():
            current = {'name': text.strip().rstrip('.'), 'line': line, 'kind': kind, 'location': '', 'levels': '', 'text': ''}
            out.append(current)
        elif current and text.startswith('Location:'):
            current['location'] = text.split(':', 1)[1].strip().rstrip('.')
        elif current and text.startswith('Level:'):
            current['levels'] = text.split(':', 1)[1].strip()
        elif current and text.strip() and not re.fullmatch(r'=+', text):
            current['text'] += (' ' if current['text'] else '') + text.strip()
    return out

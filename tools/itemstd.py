"""Items tab standard: one box set, order, sub-headings and row style for every guide (decided with the user 2026-10-23).

    import itemstd; itemstd.standardise(D, itemstd.RULES.get('<hack>', {}))   # changes D['IT'] and D['WK']; extractlib.finalise runs it
    python -I tools/itemstd.py <hack> [data.json]                          # the same on a published data.json

The standard:
- Boxes in BOXES order, a box only when the hack has rows for it; no per-hack box names. Mega Stones only where the
  hack places its stones (not Photonic Sun: generated stones), Z-Crystals for Gen 7.
- Sub-headings use r[4]; headings equal to the item name are empty. Shops fold into the item's kind,
  one shop per line; Held Items by class
  (HELD_CLASSES), Stats and Abilities by STATS_SUBS, TMs and HMs as TMs / HMs.
- Rows are `Found:` / `Wild:` / `Also:` (gifts, rewards) / `Shop:` lines, in that order;
  tutors and Useful NPCs keep their place text and links.
- Game order (earliest walkthrough stop) for GAME_ORDER_BOXES when a hack's RULES ask for it, A to Z otherwise.
- Each item once (PRECEDENCE), except nomerge pickups and separate tutors. Key Items keep only what unlocks something or has story /
  QoL / gameplay value (no Town Map, Running Shoes, Holo Caster and the like).
A new hack needs a RULES entry only for its quirks (renames, dropped rows, its own box names in route()).

standardise() is idempotent: data already in the standard comes out unchanged. It reads whatever boxes the hack's own
extract wrote (the old names are handled in route()), files every row in the standard box with its sub-heading in
r[4], turns prose places into Found / Wild / Also / Shop lines, sorts, and rewrites the walkthrough's item rows
(D['WK'] stops and np: [box, item, text, link]) to match. Rows keep their stop: only box, name, text and link change.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ---- the standard ---------------------------------------------------------------------------------------------------
BOXES = ['Key Items', 'Poké Balls', 'Medicine', 'Held Items', 'TMs and HMs', 'Evolution Items',
         'Stats and Abilities', 'Mega Stones', 'Z-Crystals', 'Fossils', 'Valuables', 'Other', 'Move Tutors', 'Useful NPCs']
SHOP_BOX = {'Poké Balls': 'Poké Balls', 'Healing and repels': 'Medicine', 'Evolution items': 'Evolution Items',
            'Power items': 'Stats and Abilities', 'Held items': 'Held Items', 'Stats and abilities': 'Stats and Abilities',
            'TMs': 'TMs and HMs', 'Mega Stones': 'Mega Stones', 'Other': 'Other'}
KIND = {'TMs and HMs': 'tm', 'Move Tutors': 'tm', 'Mega Stones': 'mega', 'Useful NPCs': 'npc'}   # others: 'gen'
SHOP_KINDS = ['Poké Balls', 'Healing and repels', 'Evolution items', 'Power items', 'Held items', 'Stats and abilities',
              'TMs', 'Mega Stones', 'Other']
HELD_CLASSES = ['Type boosters', 'Battle gear', 'One-use items', 'Gems', 'Berries', 'Pokémon-specific',
                'Memories and Drives', 'Other held items']
STATS_SUBS = ['Raise stats (vitamins)', 'Raise stats (wings)', 'Power items (EVs while held)', 'Lower stats (berries)',
              'Hyper Training (IVs)', 'Abilities', 'Levels and PP']
# What each hack's own held-item sub-headings become (the standard names map to themselves).
HELD_MAP = {'Type boosting': 'Type boosters', 'Battle': 'Battle gear', 'Consumable': 'One-use items',
            'Silvally Memories, Genesect Drives': 'Memories and Drives', 'Genesect Drives': 'Memories and Drives',
            **{c: c for c in HELD_CLASSES}}
# Held items with no class of their own (EI's battle rewards): everything not listed here is Battle gear.
ONE_USE = {'Weakness Policy', 'Grassy Seed', 'Electric Seed', 'Misty Seed', 'Psychic Seed', 'Focus Sash', 'Red Card',
           'Booster Energy', 'Air Balloon', 'Eject Button', 'Eject Pack', 'White Herb', 'Power Herb'}
SPECIFIC = {'Thick Club', 'Light Ball', 'Stick', 'Lucky Punch', 'Metal Powder', 'Quick Powder', 'Soul Dew'}
# Where an item that is in more than one box stays.
PRECEDENCE = ['Key Items', 'TMs and HMs', 'Move Tutors', 'Mega Stones', 'Z-Crystals', 'Fossils', 'Evolution Items',
              'Stats and Abilities', 'Held Items', 'Useful NPCs']
# Boxes in game order (earliest walkthrough stop) when a hack asks for it; A to Z otherwise (GAME_ORDER_BOXES).
GAME_ORDER_BOXES = {'Key Items', 'TMs and HMs', 'Move Tutors', 'Stats and Abilities', 'Z-Crystals'}
BIG = 10 ** 6

# ---- per-hack rules -------------------------------------------------------------------------------------------------
# rename {old item: item} | drop {(old box, item)} | reorder {boxes put in game order from the walkthrough} |
# shop_kind {item: kind} (override) and shop_kind_re [(regex, kind)] (for shops listed per shop, EI) | tm_width |
# other {old "Other" item: (box, sub, item, text)} (HG's catch-all box; text None = the row's own) | text {(old box, item): text}
EI_KIND = [(r'^TM\d', 'TMs'), (r'Ball$', 'Poké Balls'), (r'Berry$', 'Held items'), (r'Ability', 'Stats and abilities'),
           (r'Stone$|Scale$|Link Cable|King.s Rock|Metal Coat|^Upgrade', 'Evolution items'), (r'Shard$', 'Other')]
HG_OTHER = {
    **{n: ('Key Items', 'Key Items', n, None) for n in
       ('Infinite Candy', 'Old Rod', 'Bike', 'Pokégear Upgrade 1', 'Starter Card', 'Dowsing Machine', 'SS Aqua Ticket',
        'Mega Ring')},
    **{n: ('Valuables', n, n, None) for n in ('Master Ball', 'Big Nugget', 'Rage Candy Bar', 'Escape Rope')},
    # NPC services: the source row names the service, the standard names the place (hand-written, not regexed)
    'Battle Bond. Starter: Froakie.': ('Useful NPCs', 'Useful NPCs', 'Blackthorn City',
        "Old lady in the house next to the Poké Mart changes Greninja's ability to Battle Bond. Starter: Froakie."),
    'Roamer Clearvoyance': ('Useful NPCs', 'Useful NPCs', 'Blackthorn City',
        'Old man in the house next to the Poké Mart tells you 3 of the 4 available Roamers.'),
    'Embedded Tower Reset': ('Useful NPCs', 'Useful NPCs', 'Pokémon League',
        'Old man next to the Bidoof resets the Embedded Tower.'),
}
RULES = {
    # keep_sub: boxes whose rows keep the extract's own sub-heading (Unbound: one per tutor, Zygarde Cells);
    # nomerge: items that stay one row per place (Unbound's Zygarde Cells)
    'unbound': {'reorder': set(GAME_ORDER_BOXES), 'keep_sub': {'Key Items', 'Move Tutors'}, 'nomerge': {'Zygarde Cell'},
                'text': {('TMs and HMs', 'TM004 Calm Mind'): 'Shop: Fallshore City Bazaar · Top-left Stall · ₽10,000'},
                'tutor_groups': [(r'Shard Tutor', 'Shard tutors'), (r'Gem Family', 'Gem Family'),
                                 (r'Ultimate and Battle Combo|Special Moves|Draco Meteor', 'Special moves'),
                                 (r'Move Tutor [1-4]$', 'Battle Frontier tutors')]},
    'emerald-imperium': {
        'reorder': set(GAME_ORDER_BOXES), 'tm_width': 3, 'shop_kind_re': EI_KIND,
        'drop': {('Shops', 'Pomeg Berry')},     # the author's stray first row (it only holds the vanilla-stock remark)
        'rename': {'Leaf stones': 'Leaf Stone', 'Choice band': 'Choice Band', 'Choice scarf': 'Choice Scarf',
                   'Choice specs': 'Choice Specs', 'Assault vest': 'Assault Vest', 'Punching glove': 'Punching Glove'},
    },
    'hardlove-gold': {'reorder': set(GAME_ORDER_BOXES), 'other': HG_OTHER,
                      'also': {'Charcoal'}},        # Found: -> Also: (it is the Cutters' reward after Bugsy, not lying around)
    'eternal-x': {'reorder': {'TMs and HMs/HMs'},
                  'also': {'Poké Radar', "King's Rock", 'Blastoisinite', 'Charizardite X', 'Venusaurite'}},
    'photonic-sun': {'reorder': {'TMs and HMs/HMs'}, 'shop_kind': {'Thunder Stone': 'Evolution items', 'Cherish Ball': 'Poké Balls'}},
}


# ---- text -----------------------------------------------------------------------------------------------------------
_LABEL = re.compile(r'^(Found|Wild|Also|Shop):')
_ALSO = re.compile(r"\b(given by|gift|reward|received|trade[sd]?)\b|\bfrom (the |a |an |Leader )"
                   r"|\bafter (beating|defeating|you defeat)\b|\bgives\b", re.I)
_TRAILER = re.compile(r'^(Starter:|Possible to miss permanently)')


def clean(text):
    return re.sub(r'[ \t]+', ' ', str(text or '').replace('\r', '')).strip()


def to_lines(text):
    """Prose place -> `Found: ...` / `Also: ...` / `Shop: ...` lines (rows that already are lines pass through).
    "Starter: X" and "Possible to miss permanently" stay at the very end (the walkthrough reads both there)."""
    text = clean(text)
    if not text or _LABEL.match(text):
        return text
    vals, trailers = {}, []
    last = None
    text = re.sub(r'\b(Mt|Lt|St|Dr|Mr|Mrs|Jr)\. ', lambda m: m.group(1) + '.\x01', text)      # not a sentence end
    text = re.sub(r'([^.\s]) (Yield:)', r'\1. \2', text)
    for seg in re.split(r'\n|(?<=[.)])\s+(?=[A-Z])', text):
        seg = seg.replace('\x01', ' ').strip().rstrip('.').strip()
        if not seg:
            continue
        if _TRAILER.match(seg):
            trailers.append(seg)
            continue
        if re.match(r'^Yield:', seg) and last:
            last[0][last[1]] += '. ' + seg
            continue
        m = re.match(r'^(?:Sold|Sells) at (?:the )?(.*)$', seg, re.I)
        if m:
            label, seg = 'Shop', m.group(1).strip()
        else:
            label = 'Also' if _ALSO.search(seg) else 'Found'
            seg = re.sub(r'^(Given|Received) ', lambda mm: mm.group(1).lower() + ' ', seg)
        vals.setdefault(label, []).append(seg)
        last = (vals[label], len(vals[label]) - 1)
    order = [lb for lb in ('Found', 'Wild', 'Also', 'Shop') if lb in vals]
    out = [f'{lb}: ' + '; '.join(vals[lb]) for lb in order]
    if trailers and out:
        out[-1] += '. ' + '. '.join(trailers)
    return '\n'.join(out)


def merge_lines(texts):
    """The lines of several rows for the same item, one value list per label (rewards read `reward, defeat A; defeat B`)."""
    vals = {}
    for t in texts:
        for ln in t.split('\n'):
            m = _LABEL.match(ln)
            if m:
                for v in ln[m.end():].strip().split('; '):
                    if v and v not in vals.setdefault(m.group(1), []):
                        vals[m.group(1)].append(v)
    out = []
    for lb in ('Found', 'Wild', 'Also', 'Shop'):
        if lb in vals:
            vs = vals[lb]
            if lb == 'Also' and sum(v.startswith('reward, ') for v in vs) > 1:
                vs = [vs[0]] + [re.sub(r'^reward, ', '', v) for v in vs[1:]]
            out.append(f'{lb}: ' + '; '.join(vs))
    return '\n'.join(out)


def plain(text):
    """A row's place text without labels (TM / HM rows read `Parfum Palace`, `Cyllage City (gift)`)."""
    return '; '.join(ln[_LABEL.match(ln).end():].strip() if _LABEL.match(ln) else ln for ln in clean(text).split('\n'))


def pickup_lines(texts):
    """Keep each acquisition on its own line, ordered by source kind and deduplicated."""
    lines = []
    for text in texts:
        for line in to_lines(text).splitlines():
            label = _LABEL.match(line)
            parts = (line[label.end():].strip().split('; ') if label.group(1) != 'Shop'
                     else [line[label.end():].strip()]) if label else [line]
            joined = []
            for part in parts:
                if joined and re.match(r'^(?:replaces|requires|needs|only|not |hidden|vanilla|post-game)', part, re.I):
                    joined[-1] += '; ' + part
                else:
                    joined.append(part)
            for part in joined:
                value = label.group() + ' ' + part if label else part
                if value and value not in lines:
                    lines.append(value)
    return '\n'.join(sorted(lines, key=lambda line: next((index for index, label in enumerate(
        ('Found:', 'Wild:', 'Also:', 'Shop:')) if line.startswith(label)), 4)))


def line_place(text):
    """The explicit place before an acquisition's detail separator, without its source label."""
    return re.sub(r'^(?:Found|Also|Wild|Shop):\s*', '', text).split(' · ', 1)[0].strip().rstrip('.')


def remove_shop_place(text, item, say):
    lines = text.splitlines()
    shops = [line_place(line).casefold() for line in lines if line.startswith('Shop:')]
    if not shops:
        return text
    out = []
    for line in lines:
        place = line_place(line).casefold()
        if line.startswith(('Found:', 'Also:')) and any(place == shop or shop.startswith(place + ' ·') for shop in shops):
            continue
        out.append(line)
    if any(line.startswith(('Found:', 'Also:')) for line in out):
        say('items: TM place and shop retained:', item, out)
    return '\n'.join(out)


# ---- routing: one old row -> entries for the new boxes --------------------------------------------------------------
class Entry:
    """One old row's result: where it goes and what it reads. wk = the texts this row has in the walkthrough."""
    def __init__(self, old_box, old_item, old_text, box, sub, item, text, link=None, miss=0, wk=(), suffix=None, fix_link=None):
        self.old_box = old_box
        self.old_item, self.old_text, self.box, self.sub, self.item, self.text = old_item, old_text, box, sub, item, text
        self.link, self.miss, self.suffix, self.fix_link = link, miss, suffix, fix_link
        self.wk = {old_text, *wk}


def held_class(item, sub):
    if sub in HELD_MAP:
        return HELD_MAP[sub]
    if item in ONE_USE:
        return 'One-use items'
    if item in SPECIFIC:
        return 'Pokémon-specific'
    return 'Battle gear' if sub is None else 'Other held items'


def route(old, rules):
    """All entries (list) one old row turns into. `old` = (box, item, text, link, miss, sub)."""
    box, item, text, link, miss, sub = old
    rn = rules.get('rename', {})
    name = rn.get(item, item)
    text = rules.get('text', {}).get((box, item), text)

    def E(nbox, nsub, nitem=None, ntext=None, nlink=link, **kw):
        return Entry(box, item, text, nbox, nsub, nitem or name, text if ntext is None else ntext, nlink, miss, **kw)

    if (box, item) in rules.get('drop', ()):
        return []
    if name.endswith(' Ball') and name not in ('Iron Ball', 'Light Ball', 'Smoke Ball') and box in ('Valuables', 'Key Items', 'Poké Balls', 'Other'):
        return [E('Poké Balls', 'Poké Balls', ntext=to_lines(text))]
    if name == 'Escape Rope' and box != 'Shops':
        return [E('Medicine', 'Medicine', ntext=to_lines(text))]
    if box in ('TMs', 'HMs', 'TMs and HMs'):
        return [E('TMs and HMs', 'HMs' if re.match(r'HM\d', item) else 'TMs')]
    own = sub if box in rules.get('keep_sub', ()) and sub else None
    if box == 'Move Tutors':
        return [E('Move Tutors', own or 'Move Tutors')]
    if box in ('Poké Balls', 'Medicine') or box == 'Other' and item not in rules.get('other', {}):
        return [E(box, sub or box, ntext=to_lines(text))]
    if box in ('Mega Stones', 'Z-Crystals'):
        return [E(box, box, ntext=text if box == 'Mega Stones' else to_lines(text))]
    if box in ('Evolution Items', 'Fossils'):
        return [E(box, box, ntext=to_lines(text))]
    if box == 'Key Items':
        if re.match(r'HM\d', item):                       # EX files the HMs as key items; they belong with the TMs
            return [E('TMs and HMs', 'HMs', ntext=plain(text), fix_link=item)]
        return [E('Key Items', own or 'Key Items', ntext=to_lines(text))]
    if box == 'Stats and Abilities':
        return [E(box, sub or 'Levels and PP', ntext=to_lines(text))]
    if box == 'Held Items':
        if sub == 'Mega Stones':                          # EX listed its stones under Held Items
            return [E('Mega Stones', 'Mega Stones', ntext=to_lines(text), fix_link='stone')]
        return [E(box, held_class(item, sub), ntext=to_lines(text))]
    if box == 'Battle item rewards':                      # EI: trainer rewards go in the item's own box
        t = 'Also: reward, ' + re.sub(r'^Defeat ', 'defeat ', clean(text))
        if re.search(r'stone', name, re.I):
            return [E('Evolution Items', 'Evolution Items', ntext=t)]
        if name == 'PP Max':
            return [E('Stats and Abilities', 'Levels and PP', ntext=t)]
        return [E('Held Items', held_class(name, None), ntext=t)]
    if box == 'Valuables':
        return [E(box, sub or name, ntext=to_lines(text))]
    if box == 'Useful NPCs':
        return [E(box, box)]
    if box == 'Other':                                    # HG's catch-all, sorted by what each row is
        nb, ns, ni, nt = rules['other'][item]
        return [E(nb, ns, ni, to_lines(text) if nt is None else nt)]
    if box == 'Shops':
        return shop_entries(old, rules, E)
    raise ValueError(f'items: no rule for box {box!r} (row {item!r})')


def shop_entries(old, rules, E):
    box, item, text, link, miss, sub = old
    per_shop = sub is not None and sub not in SHOP_KINDS    # EI: sub-heading = the shop, kind comes from the item name
    names = [item]
    if per_shop and ',' in item:                            # a row listing several berries
        parts = [p.strip() for p in item.split(',') if p.strip()]
        if len(parts) > 1 and all(p.endswith('Berry') for p in parts):
            names = parts
    out = []
    for n in names:
        n = rules.get('rename', {}).get(n, n)
        if per_shop:
            n = re.sub(r'\s*\(after getting them\)$', '', n)
            w = rules.get('tm_width')
            if w:
                n = re.sub(r'^TM\s*0*(\d+)\s*-?\s*', lambda m: f'TM{int(m.group(1)):0{w}d} ', n)
            line = f'{sub} · {text}' if text else sub
            kind = next((k for rx, k in rules.get('shop_kind_re', ()) if re.search(rx, n, re.I)), 'Other')
        else:
            line, kind = clean(text), sub
        kind = rules.get('shop_kind', {}).get(n, kind)
        target = SHOP_BOX.get(kind, 'Other')
        heading = ('Berries' if n.endswith('Berry') else 'Other held items') if target == 'Held Items' else target
        if target == 'TMs and HMs':
            heading = 'TMs'
        elif target == 'Stats and Abilities':
            heading = 'Power items (EVs while held)' if kind == 'Power items' else 'Levels and PP'
        line = re.sub(r' · (?:' + re.escape(n) + '|' + re.escape(re.sub(r'^TM\d+\s*', '', n)) + r')$', '', line)
        if ' · ' in line:
            trailer = line.rsplit(' · ', 1)[1]
            normal = lambda value: re.sub(r'[^a-z0-9]', '', value.casefold())
            if normal(trailer) in (normal(n), normal(re.sub(r'^TM\d+\s*', '', n))):
                line = line.rsplit(' · ', 1)[0]
        out.append(E(target, heading, n, line if line.startswith('Shop:') else 'Shop: ' + line,
                     suffix=line if per_shop else None, wk=(line,)))
    return out


# ---- the standard itself --------------------------------------------------------------------------------------------
def standardise(D, rules=None, report=None):
    rules = rules or {}
    say = report or (lambda *a: None)
    keyed = any(len(row) > 5 for box in D['IT'] for row in box['r'])
    old_keys = {(row[0], text): key for box in D['IT'] for row in box['r'] if len(row) > 5
                for text, key in zip(row[1].splitlines(), row[5])}
    entries, notes = [], {}
    for b in D['IT']:
        for r in b['r']:
            old = (b['n'], r[0], r[1], r[2] if len(r) > 2 else None, r[3] if len(r) > 3 else 0, r[4] if len(r) > 4 else None)
            if 'Blue-Striped Basculin:' in r[0] and 'Deep Sea Tooth' in r[0]:
                for name, holder in (('Deep Sea Scale', 'Blue-Striped Basculin'), ('Deep Sea Tooth', 'Red-Striped Basculin')):
                    entries += route((b['n'], name, 'Wild: ' + holder + ' (5% chance)', None, 0, None), rules)
            else:
                entries += route(old, rules)
        if b.get('note'):
            nb = {'TMs': 'TMs and HMs', 'HMs': 'TMs and HMs', 'Other': None, 'Battle item rewards': None}.get(b['n'], b['n'])
            if nb and b['note'] not in notes.setdefault(nb, []):
                notes[nb].append(b['note'])
    moves = {m: i for i, m in enumerate(D.get('M', []))}
    stones = {p['stone']: p['id'] for p in D.get('P', []) if p.get('stone')}
    for e in entries:                                       # links only the new box needs
        if e.fix_link == 'stone' and e.link is None:
            e.link = stones.get(e.item)
        elif e.fix_link and e.link is None:                 # an HM row: its move
            e.link = moves.get(e.item.split(' ', 1)[1]) if ' ' in e.item else None
    own = {}
    for entry in sorted(entries, key=lambda entry: PRECEDENCE.index(entry.box) if entry.box in PRECEDENCE else len(PRECEDENCE)):
        if entry.old_box != 'Shops' and entry.box not in ('Move Tutors', 'Useful NPCs'):
            own.setdefault(entry.item.casefold(), (entry.box, entry.sub, entry.item, entry.link))
    machines = {re.match(r'^(?:TM|HM)\d+', entry.item).group(): entry for entry in entries
                if entry.box == 'TMs and HMs' and re.match(r'^(?:TM|HM)\d+\s+\S', entry.item)
                and not entry.text.startswith('Shop:')}
    for entry in entries:
        machine = re.match(r'^(?:TM|HM)\d+', entry.item)
        if entry.text.startswith('Shop:') and machine and machine.group() in machines:
            target = machines[machine.group()]
            entry.item, entry.link = target.item, target.link
        if entry.item.casefold() in own and entry.box not in ('Move Tutors', 'Useful NPCs'):
            entry.box, entry.sub, entry.item, link = own[entry.item.casefold()]
            entry.link = link if link is not None else entry.link
    boxes = {n: [] for n in BOXES}
    for e in entries:
        rows = boxes[e.box]
        hit = next((x for x in rows if x['item'] == e.item and e.box not in ('Move Tutors', 'Useful NPCs')
                    and e.item not in rules.get('nomerge', ())), None)
        if hit:
            hit['parts'].append(e.text)
            hit['miss'] = hit['miss'] or e.miss
            hit['link'] = hit['link'] if hit['link'] is not None else e.link
        else:
            rows.append({'item': e.item, 'sub': e.sub, 'parts': [e.text], 'link': e.link, 'miss': e.miss})
    for n, rows in boxes.items():
        for x in rows:
            ps = list(dict.fromkeys(x['parts']))
            x['text'] = pickup_lines(ps) if n not in ('Move Tutors', 'Useful NPCs') else '\n'.join(ps)
            if x['sub'] == x['item']:
                x['sub'] = ''
            if n == 'Move Tutors':
                x['sub'] = next((heading for pattern, heading in rules.get('tutor_groups', ())
                                 if re.search(pattern, x['sub'])), x['sub'])
            if n == 'TMs and HMs':
                x['text'] = remove_shop_place(x['text'], x['item'], say)
    wk_first = walk_first(D, entries)
    new = []
    for n in BOXES:
        rows = boxes[n]
        if not rows:
            continue
        order = {'Shops': SHOP_KINDS, 'Held Items': HELD_CLASSES, 'Stats and Abilities': STATS_SUBS,
                 'TMs and HMs': ['TMs', 'HMs']}.get(n)
        az = n not in GAME_ORDER_BOXES

        def key(x, order=order, az=az, n=n):
            sub_i = order.index(x['sub']) if order and x['sub'] in order else (len(order) if order else 0)
            if az:
                return (sub_i, x['item'].casefold())
            game = n in rules.get('reorder', ()) or f"{n}/{x['sub']}" in rules.get('reorder', ())
            return (sub_i, wk_first.get((n, x['item']), BIG) if game else 0)
        rows.sort(key=key)                                  # stable: the hack's own order is the tie-break
        if not order:                                       # several sub-headings (keep_sub): the box's own first, then first seen
            first = {n: -1}
            for i, x in enumerate(rows):
                first.setdefault(x['sub'], i)
            rows.sort(key=lambda x: first[x['sub']])
        new.append({'n': n, 'k': KIND.get(n, 'gen'), 'note': ' '.join(notes.get(n, [])),
                    'r': [[x['item'], x['text'], x['link'], x['miss'], x['sub']] for x in rows]})
    D['IT'] = new
    if 'WK' in D:
        walk(D['WK'], entries, new, rules, say)
    if rules.get('also'):
        relabel_also(D, rules['also'])
    sort_rows(D, rules)
    if keyed:
        for box in D['IT']:
            for row in box['r']:
                row.append([old_keys.get((row[0], text), 0) for text in row[1].splitlines()])
        for rows in walk_rows(D['WK']):
            for row in rows:
                row[4:] = [old_keys.get((row[1], row[2]), 0)]
    return D


def sort_rows(D, rules):
    first = {}
    for index, stop in enumerate(stop for split in D.get('WK', {}).get('splits', []) for stop in split['st']):
        for row in stop['it']:
            first.setdefault((row[0], row[1]), index)
    for box in D['IT']:
        name = box['n']
        order = {'Held Items': HELD_CLASSES, 'Stats and Abilities': STATS_SUBS,
                 'TMs and HMs': ['TMs', 'HMs']}.get(name, [])
        headings = list(dict.fromkeys(row[4] for row in box['r']))

        def key(row):
            heading = order.index(row[4]) if row[4] in order else len(order) + headings.index(row[4])
            game = name in rules.get('reorder', ()) or f'{name}/{row[4]}' in rules.get('reorder', ())
            value = first.get((name, row[0]), BIG) if game else row[0].casefold()
            return heading, value
        box['r'].sort(key=key)


def relabel_also(D, items):
    """Items whose `Found:` line is really a gift / reward (the prose gave no hint _ALSO knows): that line becomes `Also:`.
    Runs on the published rows too (idempotent), in Items and in the walkthrough's item rows."""
    def fix(text):
        lines = text.split(chr(10))
        if not any(ln.startswith('Found:') for ln in lines):
            return text
        vals = {}
        for ln in lines:
            m = _LABEL.match(ln)
            lb = 'Also' if m and m.group(1) == 'Found' else (m.group(1) if m else None)
            if lb is None:
                return text
            vals.setdefault(lb, []).append(ln[len(m.group(0)):].strip())
        return chr(10).join(f'{lb}: ' + '; '.join(vals[lb]) for lb in ('Found', 'Wild', 'Also', 'Shop') if lb in vals)
    for b in D['IT']:
        for r in b['r']:
            if r[0] in items:
                r[1] = fix(r[1])
    if 'WK' in D:
        for rows in walk_rows(D['WK']):
            for r in rows:
                if r[1] in items:
                    r[2] = fix(r[2])


def already(row, std):
    """A walkthrough row that already reads as the standard row (second run, or a row nothing changed)."""
    return any(row[2] == t or row[2] in t.splitlines() for t in std.get((row[0], row[1]), ()))


def walk_rows(WK):
    for s in WK['splits']:
        for st in s['st']:
            yield st['it']
    yield WK['np']


def walk(WK, entries, new, rules, say):
    by_item = {}
    for e in entries:
        by_item.setdefault(e.old_item, []).append(e)
    added = []
    for rows in walk_rows(WK):
        out = []
        for row in rows:
            if (row[0], row[1]) in rules.get('drop', ()):
                continue
            hit = [e for e in by_item.get(row[1], ()) if row[2] in e.wk or (e.suffix and row[2].endswith(e.suffix))]
            names = {(entry.box, entry.item) for entry in hit}
            name = rules.get('rename', {}).get(row[1], row[1])
            candidates = [(box, item) for box in new for item in box['r']
                          if (box['n'], item[0]) in names or item[0] == name]
            if not candidates:
                routed = route((row[0], row[1], row[2], row[3], 0, None), rules)
                for entry in routed:
                    box = next((box for box in new if box['n'] == entry.box), None)
                    if box is None:
                        box = {'n': entry.box, 'k': KIND.get(entry.box, 'gen'), 'note': '', 'r': []}
                        new.append(box)
                    item = [entry.item, pickup_lines([entry.text]), entry.link, entry.miss, entry.sub]
                    box['r'].append(item)
                    candidates.append((box, item))
                    added.append((entry.item, item[1]))
            if not candidates:
                say('items: walkthrough row unresolved:', row)
                out.append(row)
                continue
            text = row[2]
            if hit:
                exact = [entry for entry in hit if entry.old_text == text]
                if len(exact) == 1:
                    text = exact[0].text
            lines = pickup_lines([text]).splitlines()
            matched = [(box, item, line) for box, item in candidates for line in item[1].splitlines()
                       if line in lines]
            if not matched:
                box, item = candidates[0]
                if name in rules.get('nomerge', ()):
                    item = [name, '\n'.join(lines), row[3], 0, 'Zygarde Cells']
                    box['r'].append(item)
                elif box['n'] not in ('Move Tutors', 'Useful NPCs'):
                    item[1] = pickup_lines([item[1], *lines])
                matched = [(box, item, line) for line in lines]
                added.extend((item[0], line) for line in lines)
            for box, item, line in matched:
                out.append([box['n'], item[0], line, item[2]])
        # a row two old boxes both produced is one row; an item on one stop twice stays twice
        seen, dedup = set(), []
        for r in out:
            k = tuple(map(str, r))
            if k not in seen:
                seen.add(k)
                dedup.append(r)
        rows[:] = dedup
    new.sort(key=lambda box: BOXES.index(box['n']))
    say('items: walkthrough rows added as IT lines:', len(added))
    for item, text in added:
        say('  ' + item + ': ' + text)


def walk_first(D, entries):
    """(new box, item) -> index of the earliest walkthrough stop that lists it, for the game-order boxes. Read from the
    rows as they are now, through the old -> new mapping of each row."""
    first = {}
    if 'WK' not in D:
        return first
    by_item = {}
    for e in entries:
        by_item.setdefault(e.old_item, []).append(e)
    idx = 0
    for s in D['WK']['splits']:
        for st in s['st']:
            for row in st['it']:
                hit = [e for e in by_item.get(row[1], ()) if row[2] in e.wk or (e.suffix and row[2].endswith(e.suffix))]
                names = {(e.box, e.item) for e in hit} or {(row[0], row[1])}
                for k in names:
                    first.setdefault(k, idx)
            idx += 1
    return first


def checks(D):
    """Problems in a standardised IT (empty list = fine)."""
    bad = []
    names = [b['n'] for b in D['IT']]
    if names != sorted(names, key=BOXES.index):
        bad.append(f'box order {names}')
    seen = {}
    for b in D['IT']:
        for r in b['r']:
            if len(r) < 5 or not r[4] and b['n'] != 'Valuables':
                bad.append(f'no sub-heading: {b["n"]} / {r[0]}')
            if b['n'] not in ('Shops', 'Valuables'):
                if seen.setdefault(r[0].casefold(), b['n']) != b['n']:
                    bad.append(f'in two boxes: {r[0]} ({seen[r[0].casefold()]}, {b["n"]})')
            if b['n'] == 'Shops' and re.search(r'(^|\n)Shop:', r[1]):
                bad.append(f'Shop: prefix in Shops: {r[0]}')
    return bad


if __name__ == '__main__':
    import datajson
    hack = sys.argv[1]
    path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'hacks', hack, 'data.json')
    data, raw = datajson.load(path)
    standardise(data, RULES.get(hack, {}), print)
    import pickup_keys
    keys = os.path.join(os.path.dirname(path), 'extract', 'pickup_keys.json')
    if os.path.exists(keys):
        pickup_keys.stabilise(data, keys, print)
    datajson.save(path, data, raw)
    print(hack, [(b['n'], len(b['r'])) for b in data['IT']])

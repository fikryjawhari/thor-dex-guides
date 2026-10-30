"""Items (IT) from the unboundwiki.com export; the RomHackDex item pages and the 2.1.1.1 location-guide.xlsx cross-check.

    build(D)    D['IT'] in the old-box form tools/itemstd.py standardises (finalise runs it); P.stone for Houndoominite
    PLACED      [(location page title, item, box, text line)] every location-page item, for the walkthrough (unit 7)
    canon(raw)  any source's item spelling -> (IT name, quantity, notes) ("Dusk Balls (x5)" -> ("Dusk Ball", 5, []))
    GAME_ITEMS  Unbound-Cloud item names (GID it) that differ from the IT name

Where each kind comes from (notes.md → Items):
- Field items, gifts and hidden items: the 67 Locations pages (each page's item table: item, then the place text with
  its flags "(requires Rock Climb)", "(hidden)", "(Gift)"). TMs / HMs, Mega Stones and Z-Crystals there are only a
  cross-check: their own pages are the source.
- TMs and HMs: the 128 machine pages (TM001-TM120, HM01-HM08), place text from the page's Location field.
- Mega Stones and orbs: the dex's P.stone / P.sloc (dex.py, from the Mega Stone pages).
- Z-Crystals: the Z-Crystals page. Key and evolution items: their item pages (places the Locations pages lack:
  shops, Battle Frontier exchange, raid drops, wild held items, Mystery Gift).
- Shops: All Shop Inventories (marts by badge, Dehara Dept. Store, the bazaars), plus the Fallshore evolution-item
  merchant and the Battle Frontier BP exchange from the item pages.
- Mission rewards: the 83 mission pages (#001 has no item reward). Move tutors: the Move Tutors page (29 tutors).
  Useful NPCs: the 34 Useful NPC pages.
"""
import re

from common import H, WIKI, move, report
import wiki as W
from wiki import key, text

PLACED = []
# Item-page place names -> the Locations page that covers them (the item pages name sub-areas and shorthands).
PLACE_ALIAS = {'Thundercap Mt.': 'Thundercap Mountain', 'Dehara Dept. Store': 'Dehara City',
               'Seaport City East Warehouse': 'Seaport Warehouses', "Professor Log's Lab": 'Frozen Heights',
               'Pokemon Day Care': 'Route 5', 'Magnolia Cafe': 'Magnolia Town', 'Your house': 'Frozen Heights',
               'Cube Corp': 'Cube Corp.', 'Tehl Town': 'Tehl Town / Underground Pass'}

# ---- names ----------------------------------------------------------------------------------------------------------
# Wiki / workbook spellings -> the item's name (the game's, as Unbound-Cloud writes it, or the official one).
ALIASES = {
    'Poke Ball': 'Poké Ball', 'Pokeball': 'Poké Ball', 'Poke Doll': 'Poké Doll', 'Parlyz Heal': 'Paralyze Heal',
    'Nevermeltice': 'Never-Melt Ice', 'Charizite X': 'Charizardite X', 'Terrain Ext.': 'Terrain Extender',
    'Protect Pads': 'Protective Pads', 'Whip Dream': 'Whipped Dream', 'Heavy Boots': 'Heavy-Duty Boots',
    'Heavy Duty Boots': 'Heavy-Duty Boots', 'Utility Parasol': 'Utility Umbrella', 'Adrenal Orb': 'Adrenaline Orb',
    'Alorichium Z': 'Aloraichium Z', 'Ultranecronium Z': 'Ultranecrozium Z', 'X Special Attack': 'X Sp. Atk',
    'X Special Defense': 'X Sp. Def', 'X Sp. Attack': 'X Sp. Atk', 'X Sp. Defense': 'X Sp. Def', 'X Defend': 'X Defense',
    'Guard Spec': 'Guard Spec.', 'Pomeg betty': 'Pomeg Berry', 'Pinab Berry': 'Pinap Berry', 'Aerodactite': 'Aerodactylite',
    'Houndoomite': 'Houndoominite', 'Hp Up': 'HP Up', 'Dream Mist (Unbound)': 'Dream Mist', 'Upgrade': 'Up-Grade',
    'DexNav (Key Item)': 'DexNav', 'Trainer Catalogue (Key Item)': 'Trainer Catalogue',
    "ADM (Advanced Diggin ‘n diving Machine)": 'ADM', "ADM (Advanced Diggin 'n diving Machine)": 'ADM',
    'Candy Sweets': 'Candy Sweet', 'Thunderstone': 'Thunder Stone', 'Silvally Memory': 'Silvally Memory',
    'Lucky Eggs': 'Lucky Egg', 'Proteins': 'Protein', 'PP Maxes': 'PP Max', 'Swift Wings': 'Swift Wing',
}
# Unbound-Cloud (GID it) names that differ from the IT name: the save reader shows the IT name.
GAME_ITEMS = {'Hp Up': 'HP Up', 'Guard Spec': 'Guard Spec.', 'Dream Mist (Unbound)': 'Dream Mist', 'Heavy Duty Boots': 'Heavy-Duty Boots'}
# Items the game has that Unbound-Cloud's held-item table doesn't (key items, collectibles, Unbound's own).
EXTRA = ['Zygarde Cell', 'DexNav', 'Coin Case', 'Costume Box', 'Go-Goggles', 'Good Rod', 'Old Rod', 'Super Rod',
         'Dowsing Machine', 'VS Seeker', 'Stat Scanner', 'Frontier Card', 'Town Map', 'S.S. Ticket', 'Prison Bottle',
         'Mega Keystone', 'Lunar Wing', 'Trainer Catalogue', 'Jade Orb', 'Magma Stone', 'Oval Charm', 'Porta-PC',
         'Reveal Glass', 'Shiny Charm', 'Grubby Hanky', 'Member Card', 'Notebook', 'Time Turner', 'Gracidea',
         'Motorcycle', 'Devon Scope', 'Braille Converter', 'ADM', 'Baby Monitor', 'Catching Charm', 'Candy Sweet',
         'Wishing Piece', 'Silvally Memory', 'Random healing item', 'Money', 'Sea Salt', 'Sea Shell']
KEY_DROP = {'Town Map', 'Costume Box'}            # the Items standard: no Town Map and the like
STONES = ['Fire Stone', 'Water Stone', 'Thunder Stone', 'Leaf Stone', 'Moon Stone', 'Sun Stone', 'Shiny Stone',
          'Dusk Stone', 'Dawn Stone', 'Ice Stone']
EVOLUTION = STONES + ['Deep Sea Scale', 'Deep Sea Tooth', 'Dragon Scale', 'Dubious Disc', 'Electirizer', "King's Rock",
                      'Magmarizer', 'Metal Coat', 'Protector', 'Reaper Cloth', 'Up-Grade', 'Link Stone', 'Prism Scale',
                      'Razor Claw', 'Razor Fang', 'Oval Stone', 'Sachet', 'Whipped Dream', 'Sweet Apple', 'Tart Apple',
                      'Cracked Pot', 'Chipped Pot', 'Galarica Cuff', 'Galarica Wreath', 'Black Augurite', 'Peat Block',
                      'Hisui Rock', 'Candy Sweet']
LOWER_BERRIES = ['Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry']
VITAMINS = ['HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos']
TYPE_BOOSTERS = {'Charcoal', 'Miracle Seed', 'Mystic Water', 'Magnet', 'Never-Melt Ice', 'Black Belt', 'Poison Barb',
                 'Soft Sand', 'Sharp Beak', 'Twisted Spoon', 'Silver Powder', 'Hard Stone', 'Spell Tag', 'Dragon Fang',
                 'Black Glasses', 'Silk Scarf', 'Sea Incense', 'Rose Incense', 'Odd Incense', 'Rock Incense',
                 'Wave Incense'}
# Valuables the guide lists (sub-heading each), the rest of VALUABLE (medicine, balls, sell items) is not listed.
VALUABLES = {'Heart Scale': 'Heart Scales', 'Red Shard': 'Shards', 'Blue Shard': 'Shards', 'Green Shard': 'Shards',
             'Yellow Shard': 'Shards', 'Beast Ball': 'Beast Balls'}
NOT_LISTED = 'Not listed'
VALUABLE = re.compile(
    r'(?<!Iron )Ball$|Potion$|Heal$|Repel$|Mail$|Shard$|Mushroom$|Pearl|Nugget|^Relic |^X |Flute$|^Money$'
    r'|^(?:Ether|Elixir|Max Ether|Max Elixir|Revive|Max Revive|Full Restore|Antidote|Awakening|Escape Rope|Honey'
    r'|Heart Scale|Sacred Ash|Berry Juice|Fresh Water|Soda Pop|Lemonade|Moomoo Milk|Rage Candy Bar|Casteliacone'
    r'|Lava Cookie|Old Gateau|Poké Doll|Fluffy Tail|Rare Bone|Stardust|Star Piece|Comet Shard|Guard Spec\.|Dire Hit'
    r'|Energy Root|Energy Powder|Heal Powder|Revival Herb|Sweet Heart|Sea Salt|Sea Shell|Shoal Salt'
    r'|Shoal Shell|Wishing Piece|Random healing item|Dream Mist|Balm Mushroom|Big Malasada|Lumiose Galette'
    r'|Shalour Sable|Pewter Crunchies)$')

_NAMES = {}


def names():
    """key -> item name: every game item (Unbound-Cloud), EXTRA, the aliases' targets."""
    if not _NAMES:
        import json
        import os
        path = os.path.join(H.src, 'repos', 'Unbound-Cloud', 'src', 'data', 'ItemNames.json')
        game = []
        if os.path.exists(path):
            raw = json.load(open(path, encoding='utf-8'))
            game = [v.get('name') if isinstance(v, dict) else v for v in (raw.values() if isinstance(raw, dict) else raw)]
        for n in [x for x in game if x] + EXTRA + list(ALIASES.values()):
            n = GAME_ITEMS.get(n, ALIASES.get(n, n))
            _NAMES.setdefault(key(n), n)
        for a, n in ALIASES.items():
            _NAMES[key(a)] = n
    return _NAMES


def resolve(name):
    """One clean item name -> its item name, or None. Plurals and "Max Ether"-style names resolve too."""
    N = names()
    for cand in (name, re.sub(r'es$', '', name), re.sub(r's$', '', name), re.sub(r"s(?= [A-Z])", '', name, count=1)):
        n = N.get(key(cand))
        if n:
            return n
    return None


def canon(raw):
    """Any spelling -> (name, quantity, notes). Notes are the name's own brackets other than the quantity and
    "(hidden)" ("gate opens 12pm", "random"). A TM / HM keeps its number: "TM05 Roar" -> "TM005 Roar"."""
    s = re.sub(r'\s+', ' ', str(raw).replace('’', "'")).strip()
    notes, qty = [], 1
    s = ALIASES.get(s, s)
    for inner in re.findall(r'\(([^)]*)\)', s):
        m = re.fullmatch(r'x\s*(\d+)', inner.strip(), re.I)
        if m:
            qty = int(m.group(1))
        elif not re.fullmatch(r'hidden|key item', inner.strip(), re.I):
            notes.append(inner.strip())
    s = re.sub(r'\s*\([^)]*\)', '', s).strip()
    m = re.match(r'^(\d[\d,]*)\s*x?\s+(.+)$', s)
    if m and not re.match(r'^[\d,]+ Pok', s):
        qty, s = int(m.group(1).replace(',', '')), m.group(2)
    m = re.match(r'^(TM|HM)\s*0*(\d+)\s*(.*)$', s)
    if m:
        return machine_name(m.group(1), int(m.group(2))) or s, qty, notes
    if re.match(r'^[\d,]+ Pok[eé] ?Dollars$', s):
        return 'Money', 1, [re.sub(r' Pok.*', '', s)]
    n = ALIASES.get(s) or resolve(s)
    return n or s, qty, notes


# ---- the machine table (filled first: other rows name a TM by number) -----------------------------------------------
MACHINES = {}       # ('TM', 5) -> "TM005 Roar"


def machine_name(kind, num):
    return MACHINES.get((kind, num))


# ---- classification -------------------------------------------------------------------------------------------------
KEY_ITEMS = set()   # the key-item pages, filled by build()


def box_of(name):
    """(old box, sub-heading) for an item; the standard (tools/itemstd.py) files it from these."""
    if re.match(r'(TM|HM)\d', name):
        return 'TMs and HMs', None
    if name in STONE_NAMES:
        return 'Mega Stones', None
    if re.search(r'ium Z$', name):
        return 'Z-Crystals', None
    if name == 'Zygarde Cell':
        return 'Key Items', 'Zygarde Cells'
    if name in KEY_ITEMS or name == 'Master Ball':
        return 'Key Items', None
    if name in EVOLUTION:
        return 'Evolution Items', None
    if 'Fossil' in name or name == 'Old Amber':
        return 'Fossils', None
    if name in LOWER_BERRIES:
        return 'Stats and Abilities', 'Lower stats (berries)'
    if name in VITAMINS:
        return 'Stats and Abilities', 'Raise stats (vitamins)'
    if name.endswith(' Wing') and name != 'Lunar Wing':
        return 'Stats and Abilities', 'Raise stats (wings)'
    if re.match(r'Power (Weight|Bracer|Belt|Lens|Band|Anklet)$', name):
        return 'Stats and Abilities', 'Power items (EVs while held)'
    if name in ('Bottle Cap', 'Gold Bottle Cap'):
        return 'Stats and Abilities', 'Hyper Training (IVs)'
    if name in ('Ability Capsule', 'Ability Patch'):
        return 'Stats and Abilities', 'Abilities'
    if name in ('Rare Candy', 'PP Up', 'PP Max'):
        return 'Stats and Abilities', 'Levels and PP'
    if VALUABLE.search(name):                   # only the curated few are listed (the user, 2026-10-30)
        return ('Valuables', VALUABLES[name]) if name in VALUABLES else (NOT_LISTED, None)
    if name.endswith(' Berry'):
        return 'Held Items', 'Berries'
    if name.endswith(' Gem'):
        return 'Held Items', 'Gems'
    if name.endswith(' Memory') or name.endswith(' Drive'):
        return 'Held Items', 'Memories and Drives'
    if name.endswith(' Plate') or name in TYPE_BOOSTERS:
        return 'Held Items', 'Type boosters'
    return 'Held Items', None


def shop_kind(name):
    box, sub = box_of(name)
    if box == 'Evolution Items' or name == 'Everstone':
        return 'Evolution items'
    if box == 'TMs and HMs':
        return 'TMs'
    if name.endswith('Ball'):
        return 'Poké Balls'
    if sub == 'Power items (EVs while held)':
        return 'Power items'
    if box == 'Stats and Abilities':
        return 'Stats and abilities'
    if box == 'Held Items':
        return 'Held items'
    if box == 'Mega Stones':
        return 'Mega Stones'
    if box in ('Valuables', NOT_LISTED) and not re.search(r'Mail|Shard|Scale|Honey', name):
        return 'Healing and repels'
    return 'Other'


# ---- place text -----------------------------------------------------------------------------------------------------
def sentence(s):
    """A wiki description as a value: no trailing full stop, no "; " (merge_lines splits values there)."""
    return re.sub(r'\s+', ' ', s.replace('; ', ', ').replace('“', '"').replace('”', '"')).strip().rstrip('.').strip()


def flags(desc):
    """Leading "(...)" groups of a Locations row -> (gift, hidden, [requires], [notes], rest)."""
    gift = hidden = False
    req, notes = [], []
    rest = desc.strip()
    while True:
        m = re.match(r'\(([^)]*)\)\s*', rest)
        if not m:
            break
        rest = rest[m.end():]
        for part in re.split(r',\s*', m.group(1).strip()):
            p = part.strip()
            if re.fullmatch(r'hidden', p, re.I):
                hidden = True
            elif re.fullmatch(r'gift', p, re.I):
                gift = True
            elif re.match(r'requires\b', p, re.I):
                req.append(re.sub(r'\s+', ' ', p[len('requires'):]).strip())
            elif p:
                notes.append(p)
    return gift, hidden, req, notes, rest


def place_line(place, desc, name_notes=(), qty=1):
    """A Locations row -> ('Found' | 'Also', 'Cliff Cave · requires Rock Climb · hidden · In the ...')."""
    gift, hidden, req, notes, rest = flags(desc)
    parts = [place] + ['requires ' + r for r in req] + (['hidden'] if hidden else []) + list(notes) + list(name_notes)
    if qty > 1:
        parts.append('x%d' % qty)
    if rest:
        parts.append(sentence(rest))
    return ('Also' if gift else 'Found'), ' · '.join(p for p in parts if p)


# ---- build ----------------------------------------------------------------------------------------------------------
STONE_NAMES = set()


def build(D):
    PLACED.clear()
    Mi = {m: i for i, m in enumerate(D['M'])}
    log, rows = [], []                          # rows: [old box, item, text, link, missable, sub]

    def add(box, item, txt, link=None, sub=None):
        if box == NOT_LISTED:                   # consumables and sell items: shops still list them
            return
        rows.append([box, item, txt, link, 0, sub])

    # Mega Stones (the dex placed them from the stone pages); the game's name for Houndoom's
    for p in D['P']:
        if p.get('stone'):
            p['stone'] = ALIASES.get(p['stone'], p['stone'])
            STONE_NAMES.add(p['stone'])
    # TMs and HMs
    for m in WIKI.item_machines():
        t = re.match(r'^(TM|HM)0*(\d+) (.+)$', m['name'])
        kind, num, mv = t.group(1), int(t.group(2)), t.group(3)
        name = move(mv)
        if name is None:
            log.append('TM/HM move not in M: ' + m['name'])
        label = '%s%0*d %s' % (kind, 3 if kind == 'TM' else 2, num, name or mv)
        MACHINES[(kind, num)] = label
        where = sentence(text(m['fields'].get('Location', '')))
        needs = [r[len('Have '):] for r in m['requirements'] if re.match(r'Have (?!access)', r)]
        badge = m['fields'].get('Badge Required', '')
        if badge and not badge.startswith('N/A'):
            where += ' · use outside battle: ' + sentence(badge)
        if needs:
            where += ' · needs ' + ', '.join(sentence(n) for n in needs)
        add('TMs and HMs', label, where, Mi.get(name))
    for p in D['P']:
        if p.get('stone'):
            add('Mega Stones', p['stone'], p['sloc'], p['id'])
    # key items: the key-item pages name them
    details = WIKI.item_details()
    for d in details:
        n = canon(d['name'])[0]
        if '/key-items/' in d['page']['link']:
            KEY_ITEMS.add(n)
    KEY_ITEMS.update({'Coin Case', 'DexNav', 'Go-Goggles', 'Good Rod', 'Old Rod', 'Super Rod', 'Dowsing Machine',
                      'VS Seeker', 'Stat Scanner', 'Frontier Card'})
    # Locations pages
    listed = {}                                  # item -> {location keys}
    unresolved = set()
    for place, raw, desc in WIKI.item_locations():
        for one in split_names(raw):
            name, qty, nn = canon(one)
            box, sub = box_of(name)
            if not resolve(name) and not re.match(r'(TM|HM)\d', name):
                unresolved.add(raw)
            if box == NOT_LISTED:
                continue                        # consumables and sell items: not listed (the user, 2026-10-30)
            label, line = place_line(place, desc, nn, qty)
            PLACED.append((place, name, box, label + ': ' + line))
            listed.setdefault(name, set()).add(key(place))
            if box in ('TMs and HMs', 'Mega Stones', 'Z-Crystals') or name in KEY_DROP:
                continue                        # their own pages are the source (cross-checked in check.py)
            add(box, name, label + ': ' + line, sub=sub)
    if unresolved:
        log.append('Locations item names kept as written (no game item): ' + ', '.join(sorted(unresolved)))
    # missions: rewards
    missions = {}
    rewards = 0
    for ms in WIKI.item_missions():
        num = int(re.match(r'Mission #0*(\d+)', ms['name']).group(1))
        title = re.sub(r'^Mission #\d+:\s*', '', ms['name'])
        start = sentence(ms['fields'].get('Start Location', '').split(' – ')[0])
        for one, qty in mission_items(ms['fields'].get('Reward', '')):
            name = canon(one)[0]
            missions.setdefault(name, set()).add(num)
            rewards += 1
            box, sub = box_of(name)
            if box in ('TMs and HMs', 'Mega Stones', 'Z-Crystals'):
                continue
            line = 'Also: Mission #%03d %s · %s' % (num, title, start) + (' · x%d' % qty if qty > 1 else '')
            add(box, name, line, sub=sub)
    # key and evolution item pages: the places the Locations pages and missions don't give
    shops = []                                   # (item, shop, price, unlock)
    stock = {canon(s[2])[0] for s in WIKI.item_shops()}
    vendors = W.frontier_vendors(WIKI)
    for vendor, _, vrows in vendors:            # the Battle Frontier's BP exchange
        if vendor.startswith('Exchange Service Vendor'):
            for cells in vrows:
                n = canon(cells[0])[0]
                shops.append((n, 'Battle Frontier · ' + vendor.replace(' Vendor – ', ' (') + ')',
                              cells[1].replace(' BP', ' BP'), 'post-game'))
    bp_stock = {x[0] for x in shops}
    extra = []                                   # item-page places no Locations page lists
    for d in details:
        name = canon(d['name'])[0]
        box, sub = box_of(name)
        if name in KEY_DROP:
            continue
        for pl in d['places']:
            where, _, how = [x.strip() for x in pl.partition(' – ')]
            how = sentence(how)
            mm = re.search(r'Mission #0*(\d+)', pl)
            if mm and int(mm.group(1)) in missions.get(name, ()):
                continue
            buy = re.search(r'Purchase from (?:the )?(.+?) for ([\d,]+) Poke ?Dollars', how)
            bp = re.search(r'Exchange (?:for )?(\d+) Battle Points', how)
            here = key(PLACE_ALIAS.get(re.sub(r'\s*\(.*\)$', '', where), where))
            if not (buy or bp or 'Raid Den' in where or 'Raid Den' in how or how.startswith('Dropped by')
                    or where == 'Mystery Gift'
                    or re.search(r'Pokemon Encounters|Wild Held Item', where) or re.match(r'Held', how)) \
                    and any(here.startswith(k) or k.startswith(here) for k in listed.get(name, ())):
                continue                         # the Locations page has it
            if buy:
                if name not in stock:            # the shop list has the Dept. Store's stones
                    shops.append((name, '%s · %s' % (where, buy.group(1)), '₽' + buy.group(2), ''))
            elif bp:
                if name not in bp_stock:
                        shops.append((name, 'Battle Frontier · Exchange Service Counter', bp.group(1) + ' BP', 'post-game'))
            elif re.search(r'Pokemon Encounters|Wild Held Item', where) or re.match(r'Held', how):
                add(box, name, 'Wild: ' + re.sub(r'^(?:Held(?: item)? by (?:the following )?wild Pokemon:?|Held by wild'
                                                 r'|Held by|5% chance being a held item on any of the following wild '
                                                 r'Pokemon:?)\s*', '', how), sub=sub)
            elif 'Raid Den' in where or 'Raid Den' in how or how.startswith('Dropped by'):
                where = PLACE_ALIAS.get(where, where)
                add(box, name, 'Also: %s · raid drop' % (where if 'Raid Den' in where else where + ' Raid Den'), sub=sub)
            elif where == 'Mystery Gift':
                add(box, name, 'Also: Mystery Gift · post-game · ' + how, sub=sub)
            else:
                label = 'Also' if re.search(r'gift|given|reward|from the|show|talk|exchange|sold', how, re.I) else 'Found'
                add(box, name, '%s: %s · %s' % (label, where, how), sub=sub)
                extra.append('%s (%s)' % (name, where))
    # Z-Crystals
    for zn, places, post, how in W.item_crystal_parts(WIKI):
        name = canon(zn)[0]
        where = ' / '.join(places) if places and places != ['Mission Reward'] else ''
        label = 'Also' if re.search(r'defeat|obtain|complete|show|reward|solve', how, re.I) else 'Found'
        parts = [where] + (['post-game'] if post else []) + [sentence(how)]
        add('Z-Crystals', name, label + ': ' + ' · '.join(p for p in parts if p))
    # shops
    for heading, stall, raw, price, unlock in WIKI.item_shops():
        name, qty, nn = canon(raw)
        shop = 'Any Poké Mart' if heading == 'Basic Pokémon Marts' else \
            (stall if stall.startswith(heading.replace(' Pokémon Mart', '')) else '%s · %s' % (heading, stall))
        u = re.sub(r'^Getting the (.+?) at (.+)$', r'after the \1 (\2)', unlock)
        u = '' if u == 'At the start of the game' else u
        shops.append((name, shop, '₽' + price.replace('9600', '9,600'), ', '.join(nn + ([u] if u else []))))
    for name, shop, price, unlock in shops:
        if name == 'Moomoo Milk' and '6,600' in price:
            price += ' a dozen'
        add('Shops', name, ' · '.join(x for x in (shop, price, unlock) if x), sub=shop_kind(name))
    # move tutors (the Battle Frontier page says who its Draco Meteor trainer teaches)
    learners = {move(m.group(1)): m.group(2) for _, f, _ in vendors
                for m in [re.match(r'Teaches (.+?) to (any .+)$', f)] if m}
    for t in WIKI.tutors():
        where = sentence(t.location)
        req = sentence(t.requirement)
        for mv, cost in t.moves:
            name = move(mv)
            if name is None:
                log.append('tutor move not in M: %s (%s)' % (mv, t.name))
            cost = re.sub(r'(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day', lambda x: x.group(1)[:3], cost)
            who = 'teaches ' + learners[name] if name in learners else ''
            add('Move Tutors', name or mv, ' · '.join(x for x in (where, cost, req, who) if x), Mi.get(name), sub=t.name)
    # useful NPCs
    for npc, f in W.useful_npcs(WIKI):
        where, _, how = [x.strip() for x in f.get('Location', '').partition(' – ')]
        if not how:
            where, how = '', where
        cost = f.get('Cost', '')
        txt = '%s: %s' % (npc, sentence(f.get('Purpose', '')))
        if cost and cost not in ('N/A', 'Free', 'Varies', '(Varies)'):
            txt += ' · ' + sentence(cost)
        elif cost == 'Free':
            txt += ' · free'
        add('Useful NPCs', where or npc, txt + ' · ' + sentence(how))
    D['IT'] = [{'n': box, 'k': 'gen', 'r': [r[1:] for r in rows if r[0] == box]} for box in dict.fromkeys(r[0] for r in rows)]
    counts = {}
    for r in rows:
        counts[r[0]] = counts.get(r[0], 0) + 1
    report('items: old-box rows', counts)
    report('items: %d machines, %d Mega Stones / orbs, %d Z-Crystals, %d tutors (%d moves), %d shop rows, '
           '%d mission item rewards, %d Locations rows placed' % (
               len(MACHINES), len(STONE_NAMES), sum(1 for r in rows if r[0] == 'Z-Crystals'), len(WIKI.tutors()),
               sum(1 for r in rows if r[0] == 'Move Tutors'), len(shops), rewards, len(PLACED)))
    report('items: item pages give %d places the Locations pages lack: %s' % (len(extra), '; '.join(extra)))
    for line in log:
        report('items:', line)


def split_names(raw):
    """One Locations / reward cell -> its items ("A or B or C", a run of item names with no separator)."""
    s = raw.strip()
    if ' or ' in s:
        return [x.strip() for x in s.split(' or ')]
    if resolve(canon(s)[0]) or re.match(r'(TM|HM)\s*\d', s) or '(' in s:
        return [s]
    words, out, i = s.split(' '), [], 0
    while i < len(words):
        for j in range(len(words), i, -1):
            if resolve(' '.join(words[i:j])):
                out.append(' '.join(words[i:j]))
                i = j
                break
        else:
            return [s]
    return out


def mission_items(reward):
    """A mission's Reward cell -> [(item text, quantity)]: only the "Item :" parts; BP, costumes, eggs, services and
    the Portal Purge stones (Mega Stones has them) left out."""
    out = []
    parts = re.split(r'\s*\b(Item|Pok[eé]mon|Service|Event|Effect)\s*:\s*', reward)
    for i in range(1, len(parts) - 1, 2):
        if parts[i] != 'Item':
            continue
        s = re.sub(r',?\s*and remaining two.*$', '', parts[i + 1])
        s = re.sub(r'\s*\((?:depending|only)[^)]*\)', '', s)
        for one in re.split(r'\s*,\s*|\s+or\s+', s):
            one = one.strip()
            if not one or re.search(r'BP$|Costume|Egg$|Upgrade', one):
                continue
            m = re.match(r'^(\d+)\s+(.+)$', one)
            out.append((m.group(2), int(m.group(1))) if m else (one, 1))
    return out

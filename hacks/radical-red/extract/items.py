"""Items (IT) for Radical Red 4.1 Hardcore: data.js areas (what lies where, by cap step) + the author's item sheet
(`drive/Item, TM, and Move Tutor Locations v4.1`: where exactly, gifts, prices, care packages, tutors), with the
Hardcore Main tab's swaps and removals applied. notes.md → Items has the rules and every source difference.

    PICKUPS   [{box, item, line, area (data.js area index or None), step (cap step or None)}] for walk.py: one per
              Found / Also line this module writes (shops, tutors and Useful NPCs are not pickups)
    build(D)  writes D['IT'] (old-box rows; extractlib.finalise runs the Items standard), P.sloc, Hardcore P.hi drops
"""
from pathlib import Path
import re
import sys

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DATA, H, item as game_item, move, report
from romhackdex import key

SHEET = Path(H.src) / 'drive' / 'Item, TM, and Move Tutor Locations v4.1 - Radical Red.xlsx'
PICKUPS = []

# ---- names ----------------------------------------------------------------------------------------------------------
TM_MOVES = {}       # 'TM001' / 'HM01' -> move name (data.js tmMoves: slots 0-119 TM01-120, 120-126 HM01-07)
for slot, ident in DATA['tmMoves'].items():
    slot = int(slot)
    if ident and move(ident):
        TM_MOVES['TM%03d' % (slot + 1) if slot < 120 else 'HM%02d' % (slot - 119)] = move(ident)


def machine(kind, number):
    """('TM', 5) -> 'TM005 Roar'; None when the game has no such machine."""
    label = '%s%0*d' % (kind, 3 if kind == 'TM' else 2, int(number))
    return '%s %s' % (label, TM_MOVES[label]) if label in TM_MOVES else None


# sheet spellings data.js has no record for (key items the game keeps elsewhere) or spells differently
SHEET_NAMES = {'Bugium Z': 'Buginium Z', 'Bugium': 'Buginium Z', 'Mewium Z': 'Mewnium Z', 'Mewium': 'Mewnium Z',
               'Alolaraichium Z': 'Aloraichium Z', 'Beedrilite': 'Beedrillite', 'Houndoominite': 'Houndoomnite',
               'Weakness Pol.': 'Weakness Policy', 'Pokédex': 'Pokédex', 'Time Changer': 'Time Changer',
               'Poké Vial': 'Poké Vial', 'DexNav': 'DexNav', 'Infinite Repel': 'Infinite Repel',
               'Hidden Costume': 'Hidden Costume', 'Necromizer (once)': 'Necromizer'}


def name(raw):
    """Any data.js id / sheet spelling -> the guide's item name (TMs as 'TM005 Roar'), or None."""
    if isinstance(raw, int) or str(raw).isdigit():
        found = game_item(raw)
    else:
        raw = fix(raw)
        m = re.match(r'^(TM|HM)\s*0*(\d+)\b', raw)
        if m:
            return machine(m.group(1), m.group(2))
        if raw in SHEET_NAMES:
            return SHEET_NAMES[raw]
        found = game_item(raw) or game_item(raw + ' Z')
    if found is None:
        return None
    m = re.match(r'^(TM|HM)0*(\d+)$', found)
    if m:
        return machine(m.group(1), m.group(2))
    return re.sub(r'\bPoke\b', 'Poké', found)


def fix(text):
    """The sheet's text: mojibake é, no line breaks, single spaces."""
    text = str(text or '').replace('�', 'é').replace('PokéDex', 'Pokédex')
    return re.sub(r'\s+', ' ', text.replace('\n', ' / ')).strip()


# ---- the sheet -------------------------------------------------------------------------------------------------------
_BOOK = None


def tab(title):
    """[(row number, {column letter: (text, font rgb, fill rgb)})] of one sheet tab."""
    global _BOOK
    if _BOOK is None:
        _BOOK = openpyxl.load_workbook(SHEET, data_only=True)
    out = []
    for row in _BOOK[title].iter_rows():
        cells = {}
        for c in row:
            if c.value is None:
                continue
            font = c.font.color.rgb if c.font and c.font.color is not None and c.font.color.type == 'rgb' else ''
            fill = c.fill.fgColor.rgb if c.fill and c.fill.fill_type else ''
            cells[c.column_letter] = (str(c.value), font, fill)
        if cells:
            out.append((row[0].row, cells))
    return out


def overworld():
    """The Overworld Items tab -> [{place, raw, items [(name or None, raw name)], qty, text, row}]."""
    out, place = [], None
    for row, cells in tab('Overworld Items'):
        if 'B' in cells and 'D' not in cells:
            place = fix(cells['B'][0])
            continue
        if 'D' not in cells or place is None or row == 1:
            continue
        raw = fix(cells['D'][0])
        qty = 1
        m = re.search(r'\s*\[?x(\d+)\]?$', raw)
        if m:
            qty, raw = int(m.group(1)), raw[:m.start()]
        parts = [p.strip() for p in re.split(r'\s+/\s+', raw)] if ' / ' in raw else [raw]
        out.append({'place': place, 'raw': raw, 'items': [(name(p), p) for p in parts], 'qty': qty,
                    'text': fix(cells.get('F', ('',))[0]), 'row': row})
    return out


# ---- data.js areas ---------------------------------------------------------------------------------------------------
def game_entries():
    """Every standard / hidden item of data.js areas: [{area, step, hidden, item}] in area order."""
    out = []
    for index, area in enumerate(DATA['areas']):
        for kind in ('item-standard', 'item-hidden'):
            for step, ids in area.get(kind, {}).items():
                for ident in ids:
                    out.append({'area': index, 'step': int(step), 'hidden': kind == 'item-hidden',
                                'item': name(ident), 'id': ident, 'used': False})
    return out


def akey(text):
    return key(re.sub(r'\(.*?\)', '', text.replace('Pokémon', 'Pokemon').replace('Mt.', 'Mt')))


# sheet heading -> data.js area name prefixes (default: the heading itself)
HEADING_AREAS = {
    "Diglett's Cave (Route 2)": ["Diglett's Cave"], "Diglett's Cave (Route 11)": ["Diglett's Cave"],
    'Underground Path (Route 7 - Route 8)': ['Underground Path'], 'Rocket Hideout': ['Rocket Hideout'],
    'Silph Co.': ['Silph Co'], 'Pokémon Tower': ['Pokemon Tower'], 'Pokémon Mansion': ['Pokemon Mansion'],
    'Indigo Plateau': ['Indigo Plateau', 'Pokemon League'], 'Mt. Ember (POST-GAME)': ['Mt Ember'],
    'Cinnabar Island': ['Cinnabar Island'], 'Lavender Town': ['Lavender Town'],
    'Treasure Beach (POST-GAME)': ['Treasure Beach', 'One Island'], 'Two Island (POST-GAME)': ['Two Island'],
    'Cape Brink (POST-GAME)': ['Cape Brink'], 'Three Island (POST-GAME)': ['Three Island', 'Three Isle Port'],
}


def candidates(heading):
    prefixes = [akey(p) for p in HEADING_AREAS.get(heading, [heading])]
    return {i for i, a in enumerate(DATA['areas']) if any(akey(a['name']).startswith(p) for p in prefixes)}


def match(entries, heading, item, hidden):
    """The data.js entry for one sheet pickup: the same item in the heading's areas (hidden first when the sheet says
    hidden); None when data.js has none left there (no search elsewhere: data.js files the follower finds under
    Viridian City's Poké Center, so a wider match pairs the wrong pickups)."""
    near = candidates(heading)
    pool = [e for e in entries if not e['used'] and e['item'] == item and e['area'] in near]
    if not pool:
        return None
    pool.sort(key=lambda e: e['hidden'] != hidden)
    pool[0]['used'] = True
    return pool[0]


# ---- boxes (Unbound's items.py lists; CFRU family: lift into tools/ when a third CFRU guide comes) ---------------------
KEY_ITEMS = {'Bicycle', 'Bike Voucher', 'Old Rod', 'Good Rod', 'Super Rod', 'S.S. Ticket', "Oak's Parcel", 'Poké Flute',
             'Silph Scope', 'Card Key', 'Lift Key', 'Secret Key', 'Gold Teeth', 'Tea', 'DexNav', 'Stat Scanner',
             'Exp. Share', 'Infinite Repel', 'Time Changer', 'Poké Vial', 'Poké Rider', 'Mega Ring', 'Z-Power Ring',
             'Dynamax Band', 'Shiny Charm', 'Master Ball', 'Tri-Pass', 'Rainbow Pass', 'Meteorite', 'Reveal Glass',
             'Prison Bottle', 'Gracidea', 'Necromizer', 'N-Solarizer', 'N-Lunarizer', 'DNA Splicers', 'Rotom Catalog',
             'Zygarde Cube', 'Coin Case', 'VS Seeker', 'Fame Checker', 'Berry Pouch', 'TM Case', 'Itemfinder',
             'Dowsing Machine', 'Ruby', 'Sapphire', 'Rusty Sword', 'Rusty Shield', 'Rainbow Wing', 'Silver Wing',
             'Red Orb', 'Blue Orb', 'Jade Orb', 'Adamant Crystal', 'Lustrous Globe', 'Griseous Core', 'Reins of Unity',
             'Eternamax Orb', 'Cornerstone Mask', 'Wellspring Mask', 'Hearthflame Mask', 'Soul Dew', 'Dream Patch',
             'Medicine'}
KEY_DROP = {'Town Map', 'Pokédex', 'Teachy TV', 'Hidden Costume'}     # the Items standard: no Town Map and the like
STONES = ['Fire Stone', 'Water Stone', 'Thunder Stone', 'Leaf Stone', 'Moon Stone', 'Sun Stone', 'Shiny Stone',
          'Dusk Stone', 'Dawn Stone', 'Ice Stone', 'ThunderStone']
EVOLUTION = set(STONES + ['Deep Sea Scale', 'Deep Sea Tooth', 'Dragon Scale', 'Dubious Disc', 'Electirizer',
                          "King's Rock", 'Magmarizer', 'Metal Coat', 'Protector', 'Reaper Cloth', 'Up-Grade',
                          'Link Cable', 'Prism Scale', 'Razor Claw', 'Razor Fang', 'Oval Stone', 'Sachet',
                          'Whipped Dream', 'Sweet Apple', 'Tart Apple', 'Cracked Pot', 'Chipped Pot', 'Galarica Cuff',
                          'Galarica Wreath', 'Black Augurite', 'Peat Block', 'Auspicious Armor', 'Malicious Armor',
                          'Syrupy Apple', 'Unremarkable Teacup', 'Masterpiece Teacup', 'Metal Alloy', 'Everstone',
                          'Strawberry Sweet', 'Love Sweet', 'Berry Sweet', 'Clover Sweet', 'Flower Sweet',
                          'Star Sweet', 'Ribbon Sweet', 'Linking Cord', 'Scroll of Darkness', 'Scroll of Waters', 'Upgrade'])
LOWER_BERRIES = ['Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry']
VITAMINS = ['HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos']
TYPE_BOOSTERS = {'Charcoal', 'Miracle Seed', 'Mystic Water', 'Magnet', 'Never-Melt Ice', 'NeverMeltIce', 'Black Belt',
                 'Poison Barb', 'Soft Sand', 'Sharp Beak', 'Twisted Spoon', 'TwistedSpoon', 'Silver Powder',
                 'SilverPowder', 'Hard Stone', 'Spell Tag', 'Dragon Fang', 'Black Glasses', 'BlackGlasses',
                 'Silk Scarf', 'Sea Incense', 'Rose Incense', 'Odd Incense', 'Rock Incense', 'Wave Incense',
                 'Fairy Feather'}
# Valuables the guide lists (Unbound's rule, the user 2026-10-30): Shards for the shard trades, Heart Scales, Beast
# Balls; the rest of VALUABLE (medicine, balls, X items, sell items) is not listed; Shops still list what's sold.
VALUABLES = {'Heart Scale': 'Heart Scales', 'Red Shard': 'Shards', 'Blue Shard': 'Shards', 'Green Shard': 'Shards',
             'Yellow Shard': 'Shards', 'Beast Ball': 'Beast Balls'}
NOT_LISTED = 'Not listed'
VALUABLE = re.compile(
    r'(?<!Iron )(?<!Light )(?<!Smoke )Ball$|Potion$|Heal$|Repel$|Mail$|Shard$|Mushroom$|Pearl|Nugget|^Relic |^X |Flute$'
    r'|^(?:Ether|Elixir|Max Ether|Max Elixir|Revive|Max Revive|Full Restore|Antidote|Awakening|Escape Rope|Honey'
    r'|Heart Scale|Sacred Ash|Berry Juice|Fresh Water|Soda Pop|Lemonade|Moomoo Milk|Rage Candy Bar|Lava Cookie'
    r'|Old Gateau|Poké Doll|Fluffy Tail|Rare Bone|Stardust|Star Piece|Comet Shard|Guard Spec\.|Dire Hit'
    r'|Energy Root|Energy Powder|EnergyPowder|Heal Powder|Revival Herb|Sweet Heart|Wishing Piece|Balm Mushroom'
    r'|Big Malasada|Red Nectar|Yellow Nectar|Pink Nectar|Purple Nectar|Shoal Salt|Shoal Shell|Max Honey'
    r'|Max Mushrooms|Gold Leaf|Silver Leaf|Pretty Feather|Beach Glass|Chalky Stone|Marble|Lone Earring'
    r'|Big Pearl|Pearl String|Strange Souvenir|Bottle Cap Fragment|Dynamax Candy|Dynamax Crystal|Armorite Ore'
    r'|Dynite Ore|Galarica Twig|Lure|Super Lure|Max Lure)$')
STONE_NAMES = set()


def box_of(item):
    """(old box, sub-heading) for an item; the Items standard (tools/itemstd.py) files it from these."""
    if re.match(r'(TM|HM)\d', item):
        return 'TMs and HMs', None
    if item in STONE_NAMES:
        return 'Mega Stones', None
    if re.search(r'ium Z$', item):
        return 'Z-Crystals', None
    if item in KEY_ITEMS or item in KEY_DROP:
        return 'Key Items', None
    if item in EVOLUTION:
        return 'Evolution Items', None
    if 'Fossil' in item or item == 'Old Amber':
        return 'Fossils', None
    if item in LOWER_BERRIES:
        return 'Stats and Abilities', 'Lower stats (berries)'
    if item in VITAMINS:
        return 'Stats and Abilities', 'Raise stats (vitamins)'
    if item.endswith(' Wing') and item not in ('Rainbow Wing', 'Silver Wing'):
        return 'Stats and Abilities', 'Raise stats (wings)'
    if re.match(r'Power (Weight|Bracer|Belt|Lens|Band|Anklet)$', item):
        return 'Stats and Abilities', 'Power items (EVs while held)'
    if item in ('Bottle Cap', 'Gold Bottle Cap'):
        return 'Stats and Abilities', 'Hyper Training (IVs)'
    if item in ('Ability Capsule', 'Ability Patch', 'Ability Pill'):
        return 'Stats and Abilities', 'Abilities'
    if item in ('Rare Candy', 'PP Up', 'PP Max'):
        return 'Stats and Abilities', 'Levels and PP'
    if VALUABLE.search(item):
        return ('Valuables', VALUABLES[item]) if item in VALUABLES else (NOT_LISTED, None)
    if item.endswith(' Berry'):
        return 'Held Items', 'Berries'
    if item.endswith(' Gem'):
        return 'Held Items', 'Gems'
    if item.endswith(' Memory') or item.endswith(' Drive'):
        return 'Held Items', 'Memories and Drives'
    if item.endswith(' Plate') or item in TYPE_BOOSTERS:
        return 'Held Items', 'Type boosters'
    return 'Held Items', None


def shop_kind(item):
    box, sub = box_of(item)
    if box == 'Evolution Items':
        return 'Evolution items'
    if box == 'TMs and HMs':
        return 'TMs'
    if item.endswith(' Ball') and item not in ('Iron Ball', 'Light Ball', 'Smoke Ball'):
        return 'Poké Balls'
    if sub == 'Power items (EVs while held)':
        return 'Power items'
    if box == 'Stats and Abilities':
        return 'Stats and abilities'
    if box == 'Held Items':
        return 'Held items'
    if box == 'Mega Stones':
        return 'Mega Stones'
    if box in ('Valuables', NOT_LISTED) and not re.search(r'Mail|Shard|Scale|Nectar|Wishing', item):
        return 'Healing and repels'
    return 'Other'




# ---- Hardcore (trainers-hardcore.xlsx Main tab; the item sheet's "(HARDCORE)" / "(MGM/HARDCORE MODE)" notes) ---------
HC_UNOBTAINABLE = {'Weakness Policy', 'Throat Spray', 'Air Balloon', 'Light Clay', 'Damp Rock', 'Heat Rock', 'Icy Rock',
                   'Smooth Rock'}                               # Main E36
HC_NO_TM = {'TM012', 'TM017', 'TM116'}                          # TM sheet F14 / F20 / F121: "(HARDCORE) Unavailable."
# the sheet rows naming both modes' items -> the Hardcore one (Main E24 / E26)
HC_PICK = {'Charizardite X/Y': 'Charizardite Y', 'Charizardite Y/X': 'Charizardite X',
           'Gardevoirite / Cameruptite': 'Gardevoirite'}
# the Hardcore wording of quest rows (the sheet's "(MGM/HARDCORE MODE)" alternative; Main E81)
HC_TEXT = {
    'Shiny Charm': 'From Sabrina after defeating her and showing her a shiny Pokémon',
    'Galladite': 'Requires Mega Ring - From Chuck after defeating him and showing him a Pokémon with 125+ base Attack',
    'Focus Sash': 'Requires Mega Ring - From Chuck after defeating him and showing him a Pokémon with 125+ base Attack',
    'Life Orb': 'From Koga after showing him a Pokémon with 125+ base Speed',
    'Toxtricitite': 'From Koga after showing him a Pokémon with 125+ base Speed',
    'Assault Vest': 'From Jasmine after defeating her in the Pokémon Lab and showing her a Pokémon with 125+ base '
                    'Defense',
    'Steelixite': 'From Jasmine after defeating her in the Pokémon Lab and showing her a Pokémon with 125+ base Defense',
    'Charizardite X': 'From Blaine after defeating him and showing him a Pokémon with 125+ base Special Attack',
    'Choice Specs': 'From Blaine after defeating him and showing him a Pokémon with 125+ base Special Attack',
    'Charizardite Y': 'Upstairs in the northern gate, from a Scientist upon showing Charizard',
    'Gardevoirite': '1F, in the south east part of the floor with lots of palm trees and a Scientist, accessed by '
                    'falling through the bigger hole on 3F',
}
# data.js entries the Hardcore view leaves out: the other mode's half of a swap, the follower finds data.js files under
# Viridian City's Poké Center (the sheet places them), Route 4's Macho Brace (4 PP Ups in Hardcore)
LEFT_DROP = {('Route 16 Gatehouse 2F', 'Charizardite X'), ('Cinnabar Island Gym', 'Charizardite Y'),
             ('Saffron City Gym', 'Gardevoirite'), ('Pokemon Mansion 1F', 'Cameruptite'), ('Route 4', 'Macho Brace'),
             ('Cerulean Cave B1F', 'Booster Energy'),       # Main E38: it won't spawn in Hardcore
             ('Cerulean City Gym', 'Waterium Z')}           # both sheet tabs: from Gian in Saffron City (notes.md)
LEFT_DROP_AREAS = {'Viridian City Poke Center'}
# data.js-only pickups the sheet's other tabs describe: (area, item) -> line text (label decided by line())
LEFT_TEXT = {('Saffron City Gym', 'Cameruptite'): 'From Sabrina after defeating her and showing her a shiny Pokémon'}
# Wild held items Hardcore keeps back until a boss (Main E14-E18)
HC_SWAPPED = {'Charizardite X', 'Charizardite Y', 'Gardevoirite', 'Cameruptite'}  # Main E24 / E26: the tabs give the default
UNIQUE = {'Key Items', 'TMs and HMs', 'Mega Stones', 'Z-Crystals'}      # one of each in the game
HC_WILD = {'Electric Seed': 'Lt. Surge', 'Misty Seed': 'Sabrina', 'Psychic Seed': 'Koga'}


def mode(text):
    """(keep, text): rows only for the other modes go; the Hardcore tags are dropped."""
    if re.match(r'\((?:DEFAULT MODES?(?: ONLY)?|REGULAR MODE)\)', text):
        return False, text
    return True, re.sub(r'^\((?:HARDCORE(?: MODE)?)\)\s*', '', text)


def pretty(place):
    """A data.js area name as a place."""
    place = re.sub(r'\bPoke\b', 'Poké', place).replace('Pokemon', 'Pokémon').replace('Mt Ember', 'Mt. Ember')
    return place.replace('Department Store', 'Dept. Store')


REQ = {'Keycard': 'Card Key', 'Z-Ring': 'Z-Power Ring'}


def line(place, text, qty=1, hidden=False, post=False):
    """A sheet row -> 'Found: Mt. Moon · requires Rock Smash · hidden · x2 · B2F (2nd Ladder), ...' ('Also:' for gifts,
    rewards and drops)."""
    reqs = []
    t = fix(text)
    if '(POST-GAME)' in t or '(POST-GAME)' in place:
        post = True
    t = t.replace('(POST-GAME)', '').strip()
    place = place.replace('(POST-GAME)', '').strip()

    def hm(m):
        reqs.append(m.group(1) + (' or ' + m.group(2) if m.group(2) else ''))
        return ''
    t = re.sub(r'\(?(?:Requires )?([A-Z][\w\-]*(?: [A-Z][\w\-]*)?) HM(?: or ([A-Z][\w\-]*(?: [A-Z][\w\-]*)?) HM)? '
               r'(?:required|needed)\)?\.?', hm, t)
    m = re.match(r'^(?:Requires|Needs) (.+?) - ', t)
    if m:
        reqs.append(m.group(1))
        t = t[m.end():]
    for m in list(re.finditer(r'\((?:Requires )?(Mega Ring|Z-Ring|Keycard)(?: required)?\)\.?', t)):
        reqs.append(REQ.get(m.group(1), m.group(1)))
    t = re.sub(r'\((?:Requires )?(Mega Ring|Z-Ring|Keycard)(?: required)?\)\.?', '', t)
    t = re.sub(r'\s+', ' ', t.replace(' / ', ' ')).strip().rstrip('.').strip().replace('; ', ', ')
    t = re.sub(r'\$(\d+) (\d{3})\b', r'₽\1,\2', t)
    # "right from the two Black Belts" is a direction, not a giver (itemstd.source_label reads "from <person>")
    t = re.sub(r'\b([Ll]eft|[Rr]ight|[Tt]op|[Bb]ottom|[Nn]orth|[Ss]outh|[Ee]ast|[Ww]est)(?:ward)? from\b', r'\1 of', t)
    if re.match(r'Hidden\b', t):
        hidden = False                                  # the text says so
    gift = re.search(r'\b(from|reward|given|gift|in exchange|receive[sd]?|dropped by|after defeating|rewards)\b', t, re.I)
    label = 'Also' if gift and not re.match(r'Hidden\b', t) else 'Found'
    parts = [place] + (['requires ' + ', '.join(dict.fromkeys(reqs))] if reqs else []) + \
        (['post-game'] if post else []) + (['hidden'] if hidden else []) + (['x%d' % qty] if qty > 1 else []) + [t]
    return label + ': ' + ' · '.join(p for p in parts if p)


def price(value):
    """'5000.0' / '10 000' / '3 BP' -> '₽5,000' / '3 BP'."""
    value = str(value).strip()
    if value.endswith('BP'):
        return value
    m = re.match(r'^([\d ]+)(?:\.0)?$', value)
    return '₽{:,}'.format(int(m.group(1).replace(' ', ''))) if m else value


# ---- build -----------------------------------------------------------------------------------------------------------
def build(D):
    PICKUPS.clear()
    STONE_NAMES.clear()
    Mi = {m: i for i, m in enumerate(D['M'])}
    stones = {}
    for p in D['P']:
        if p.get('stone') and re.search(r'_(mega|primal)', p['id']):     # P.stone also holds Memories, Z-Crystals...
            STONE_NAMES.add(p['stone'])
            stones.setdefault(p['stone'], p['id'])
    rows, log, dropped = [], [], []                     # rows: [old box, item, text, link, missable, sub]

    def link(item):
        if re.match(r'(TM|HM)\d', item):
            return Mi.get(item.split(' ', 1)[1])
        return stones.get(item)

    def add(item, text, area=None, step=None, box=None, sub=None, lnk=None):
        if box is None:
            box, sub = box_of(item)
        if box == NOT_LISTED or item in KEY_DROP:
            return
        rows.append([box, item, text, lnk if lnk is not None else link(item), 0, sub])
        if re.match(r'(Found|Also|Wild):', text) and not text.startswith('Wild:'):
            PICKUPS.append({'box': box, 'item': item, 'line': text, 'area': area, 'step': step})

    def hc_out(item):
        return item in HC_UNOBTAINABLE or (item or '')[:5] in HC_NO_TM

    # 1. the Overworld Items tab, each row paired with its data.js area entry
    entries = game_entries()
    sheet_only, placed = [], {}                          # placed: item -> data.js areas of its matched sheet rows
    for r in overworld():
        keep, text = mode(r['text'])
        if not keep:
            dropped.append('%s (%s): the sheet marks it default modes only' % (r['raw'], r['place']))
            if r['raw'] == 'TM 104 - Psyshock':
                match(entries, r['place'], name(r['raw']), False)   # Hardcore: from Sabrina (Main E40)
            continue
        qty, items = r['qty'], r['items']
        if r['raw'] in HC_PICK:
            items = [(HC_PICK[r['raw']], r['raw'])]
        if r['raw'] == 'Macho Brace':                    # "(you'll get 4 PP Ups if playing on MGM/HC mode)"
            items, qty = [('PP Up', 'PP Up')], 4
            text = 'From the right Black Belt (in place of the Macho Brace)'
        for item, raw in items:
            item = item or raw
            if item in HC_TEXT:
                text = HC_TEXT[item]
            if 'MGM/HARDCORE' in text or 'HARDCORE MODE' in text:
                log.append('Hardcore wording not settled: %s (%s)' % (raw, r['place']))
            e = match(entries, r['place'], item, 'idden' in text)
            if hc_out(item):
                dropped.append('%s (%s): unobtainable in Hardcore' % (item, r['place']))
                continue
            placed.setdefault(item, set()).add(e and e['area'])
            if e is None:
                sheet_only.append('%s (%s)' % (item, r['place']))
            add(item, line(r['place'], text, qty, bool(e and e['hidden'])), e and e['area'], e and e['step'])

    # 2. data.js pickups the Overworld tab lacks (the TM / Mega Stone / Z-Crystal tabs give their text)
    tm_text, mega_text, z_text = sheet_tms(), sheet_megas(), sheet_zs()
    game_only, twice = [], []
    for e in entries:
        area_name = DATA['areas'][e['area']]['name']
        if e['used'] or (area_name, e['item']) in LEFT_DROP or area_name in LEFT_DROP_AREAS:
            continue
        item = e['item']
        if hc_out(item) or box_of(item)[0] == NOT_LISTED:
            continue
        if e['area'] in placed.get(item, ()) or (item in placed and box_of(item)[0] in UNIQUE):
            twice.append('%s (%s)' % (item, pretty(area_name)))     # one gift data.js lists twice / elsewhere
            continue
        text = LEFT_TEXT.get((area_name, item)) or tm_text.get(item[:5]) or mega_text.get(item) or z_text.get(item) or ''
        if item == 'TM113 Play Rough':                  # bought from the 3F clerk (TM sheet A118)
            add(item, 'Shop: Celadon Dept. Store 3F (clerk) · ₽15,000', e['area'], e['step'])
            continue
        lt = line(pretty(area_name), text, 1, e['hidden'], post=e['step'] == len(DATA['caps']) - 1)
        if not text and box_of(item)[0] == 'Key Items':
            lt = 'Also' + lt[len('Found'):]
        add(item, lt, e['area'], e['step'])
        game_only.append('%s (%s)' % (item, pretty(area_name)))

    # 3. Z-Crystals the Overworld tab and data.js areas lack: the Z-Crystal tab (the BP ones are shop lines below)
    have = {r[1] for r in rows}
    for z, (where, text) in z_text_rows().items():
        if z not in have and 'BP Exchange' not in text:
            add(z, line(where, text, post=True))
            game_only.append('%s (%s, Z-Crystal tab)' % (z, where))

    # 4. shops: data.js stock, the Shops tab's prices
    n_shops = shops(add, hc_out, log, dropped)

    # 5. care packages (data.js "item-cheat"): Hardcore leaves out the red and blue ones
    n_care = care_packages(add, hc_out, log, dropped)

    # 6. wild held items Hardcore holds back
    for item, boss in HC_WILD.items():
        add(item, 'Wild: held items only after beating %s' % boss)

    # 7. move tutors and useful NPCs
    n_tutors = tutors(add, Mi, log, dropped)

    # 8. Pokémon pages: where each Mega Stone is; Hardcore's unobtainable wild held items
    sloc = {}
    for r in rows:
        if r[0] == 'Mega Stones':
            sloc.setdefault(r[1], r[2])
    for p in D['P']:
        if p.get('stone') in sloc:
            p['sloc'] = re.sub(r'^(Found|Also|Shop): ', '', sloc[p['stone']])
        if p.get('hi'):
            keep = [h for h in p['hi'] if h[0] not in HC_UNOBTAINABLE
                    and not (h[0] == 'Lucky Egg' and p['id'].startswith('pelipper'))]   # Other Useful Items C12
            if len(keep) != len(p['hi']):
                dropped.append('%s held by wild %s: unobtainable in Hardcore' % (
                    ', '.join(h[0] for h in p['hi'] if h not in keep), p['n']))
                if keep:
                    p['hi'] = keep
                else:
                    del p['hi']

    D['IT'] = [{'n': box, 'k': 'gen', 'r': [r[1:] for r in rows if r[0] == box]}
               for box in dict.fromkeys(r[0] for r in rows)]
    counts = {}
    for r in rows:
        counts[r[0]] = counts.get(r[0], 0) + 1
    report('items: old-box rows', counts)
    report('items: %d pickups (Found / Also lines), %d shop lines, %d care package lines, %d tutor moves' % (
        len(PICKUPS), n_shops, n_care, n_tutors))
    report('items: %d Mega Stones placed of %d; Mega pages without a place: %s' % (
        len(sloc), len(STONE_NAMES), ', '.join(sorted(STONE_NAMES - set(sloc))) or 'none'))
    report('items: sheet rows data.js has no pickup for (kept: gifts, rewards, follower finds): %d: %s' % (
        len(sheet_only), '; '.join(sheet_only)))
    report('items: data.js pickups the Overworld tab lacks (added from data.js / the other tabs): %d: %s' % (
        len(game_only), '; '.join(game_only)))
    report('items: data.js pickups already on a sheet row (a second branch of one gift, or a key item data.js files '
           'elsewhere): %d: %s' % (len(twice), '; '.join(twice)))
    report('items: Hardcore leaves out %d: %s' % (len(dropped), '; '.join(dropped)))
    for x in log:
        report('items:', x)
    report('items: item_desc.json: %d items, %d changed vs FireRed or in effect' % write_item_desc())
    for x in crosscheck(rows, tm_text, mega_text, {z: (p + ', ' + t if p else t) for z, (p, t) in z_text_rows().items()}):
        report('items: tabs differ:', x)


PLACE_WORDS = re.compile(r"\b(?:Route \d+|[A-Z][a-zé.']+(?: [A-Z][a-zé.']+)*)")
NOT_PLACES = {'From', 'In', 'On', 'The', 'Requires', 'Upstairs', 'Inside', 'After', 'Hidden', 'Near', 'Follow', 'Top',
              'Beat', 'Access', 'Dropped', 'Mega Ring', 'Surf', 'Cut', 'Rock Smash', 'HM', 'Keycard', 'Z-Ring'}


GENERIC = {'city', 'town', 'island', 'route', 'area', 'floor', 'house', 'room', 'part', 'side', 'pokemon'}


def places_in(text):
    """The proper-name words of a text, as keys ("Celadon City's Game Corner" -> celadon, game, corner)."""
    return {key(w) for p in PLACE_WORDS.findall(text.replace("'s ", ' ')) if p not in NOT_PLACES
            for w in ([p] if p.startswith('Route ') else p.split()) if len(key(w)) > 3 and key(w) not in GENERIC}


def crosscheck(rows, tm_text, mega_text, z_text):
    """The TM / Mega Stone / Z-Crystal tabs against the lines built from the Overworld tab and data.js: an item whose
    tab names no place the lines name (or that the lines lack). Places are compared as name keys."""
    lines = {}
    for r in rows:
        lines.setdefault(r[1], []).append(r[2])
    out = []
    for label, table in (('TM', {name(k) or k: v for k, v in tm_text.items()}), ('Mega Stone', mega_text),
                         ('Z-Crystal', z_text)):
        for item, text in sorted(table.items()):
            have = lines.get(item)
            if item is None or (label == 'TM' and item[:5] in HC_NO_TM) or (item in HC_SWAPPED and label != 'TM'):
                continue
            if not have:
                out.append('%s %s: the tab has "%s"; no line' % (label, item, text))
                continue
            got = {k for line_ in have for k in places_in(line_)}
            want = places_in(text)
            if want and not want & got:
                out.append('%s %s: the tab says "%s"; the guide: %s' % (label, item, text, ' / '.join(have)))
    return out


# ---- the sheet's other tabs ------------------------------------------------------------------------------------------
def sheet_tms():
    """The TMs & HMs tab -> {'TM001': text} (the Hardcore note under a TM wins; 'CANNOT BE FOUND.' rows left out)."""
    out, last = {}, None
    for row, cells in tab('TMs & HMs'):
        for num, text, kind in (('A', 'E', 'TM'), ('L', 'P', 'HM')):
            if num in cells and cells[num][0].isdigit() and text in cells:
                label = '%s%0*d' % (kind, 3 if kind == 'TM' else 2, int(cells[num][0]))
                if 'CANNOT BE FOUND' not in cells[text][0]:
                    out[label] = fix(cells[text][0])
                if kind == 'TM':
                    last = label
        if 'F' in cells and 'A' not in cells and last:
            keep, text = mode(fix(cells['F'][0]))
            if cells['F'][0].startswith('(HARDCORE)'):
                if 'Unavailable' in text:
                    out.pop(last, None)
                else:
                    out[last] = text
    return out


def sheet_megas():
    """The Mega Stones tab -> {stone: text} (names one row, text the next, two columns of stones)."""
    out, names = {}, {}
    for row, cells in tab('Mega Stones'):
        for n_col, t_col in (('F', 'E'), ('W', 'V')):
            if n_col in cells and t_col not in cells:
                names[t_col] = name(fix(cells[n_col][0])) or fix(cells[n_col][0])
            elif t_col in cells and names.get(t_col):
                out[names.pop(t_col)] = re.sub(r'^\(Swapped with [^)]*\)\s*/?\s*', '', fix(cells[t_col][0]))
    return out


def z_text_rows():
    """The Z-Crystals tab -> {Z-Crystal: (place, text)}: the place is the text's first clause."""
    out = {}
    for row, cells in tab('Z-Crystals'):
        if 'D' in cells and 'F' in cells and row > 1:
            z = name(fix(cells['D'][0]) + ' Z') or name(fix(cells['D'][0])) or fix(cells['D'][0]) + ' Z'
            text = fix(cells['F'][0])
            place, _, rest = text.partition(', ')
            if place == 'One Island' and rest.split(',')[0] in ('Kindle Road', 'Mt. Ember'):
                place, _, rest = rest.partition(', ')
            out[z] = (place if rest else '', rest or text)
    return out


def sheet_zs():
    return {z: text for z, (place, text) in z_text_rows().items()}


# ---- shops -----------------------------------------------------------------------------------------------------------
MART = 'Any Poké Mart'
# data.js shop area -> (shop name, the Shops tab heading with its prices)
SHOPS = {'Cerulean City Poke Mart': ('Cerulean City Poké Mart', 'CERULEAN CITY'),
         'Celadon City Department Store 2F': ('Celadon Dept. Store 2F', 'CELADON DEPT. STORE (2F)'),
         'Celadon City Department Store 4F': ('Celadon Dept. Store 4F', 'CELADON DEPT. STORE (4F)'),
         'Celadon City Department Store 5F': ('Celadon Dept. Store 5F', 'CELADON DEPT. STORE (5F)'),
         'Saffron City Trainer Fan Club': ('Saffron City Trainer Fan Club', 'SAFFRON CITY FANCLUB'),
         'Celadon City Game Corner Exchange': ('Celadon Game Corner', 'CELADON GAME CORNER'),
         'Two Island': ('Two Island shop', 'TWO ISLAND')}
# shops only the Shops tab lists
SHEET_SHOPS = {'CELADON DEPT. STORE (ROOF)': 'Celadon Dept. Store rooftop', 'CINNABAR POKEMON LAB': 'Cinnabar Pokémon Lab',
               'ONE ISLAND': 'One Island Pokémon Center · Battle Simulator BP Exchange'}


def sheet_shops():
    """The Shops tab -> {heading: {item: (price, note)}}."""
    out, heading = {}, None
    for row, cells in tab('Shops'):
        if 'F' in cells and 'G' not in cells:
            heading = fix(cells['F'][0]).replace('POKéMON', 'POKEMON')
            out[heading] = {}
        elif 'G' in cells and heading:
            raw = fix(cells['G'][0])
            note = ''
            m = re.match(r'^(.+?) \((.+)\)$', raw)
            if m:
                raw, note = m.group(1), m.group(2)
            out[heading][name(raw) or raw] = (price(cells.get('AA', ('',))[0]), note)
    return out


def vanilla_prices():
    import json
    path = Path(H.src) / 'repos' / 'pokefirered' / 'src' / 'data' / 'items.json'
    out = {key(r['english']): r['price'] for r in json.loads(path.read_text(encoding='utf-8'))['items'] if r.get('price')}
    out['paralyzeheal'] = out.get('parlyzheal')
    return out


def shops(add, hc_out, log, dropped):
    priced = sheet_shops()
    vanilla = vanilla_prices()
    marts = [a for a in DATA['areas'] if a.get('item-shop') and (a['name'].endswith('Poke Mart')
                                                                  or a['name'] == 'Pokemon League Lobby')]
    stock = [{name(i) for ids in a['item-shop'].values() for i in ids} for a in marts]
    everywhere = set.intersection(*stock)
    lines = []                                           # (item, shop, price, note)
    for item in sorted(everywhere):
        cost = vanilla.get(key(item))
        lines.append((item, MART, '₽{:,}'.format(cost) if cost else '', ''))
    for a in DATA['areas']:
        if not a.get('item-shop'):
            continue
        shop, heading = SHOPS.get(a['name'], (pretty(a['name']), None))
        table = priced.get(heading, {})
        for ident in [i for ids in a['item-shop'].values() for i in ids]:
            item = name(ident)
            if item in everywhere:                       # the Any Poké Mart line has it
                continue
            cost, note = table.get(item, ('', ''))
            if not cost and vanilla.get(key(item)):      # FRLG's price (pokefirered items.json)
                cost = '₽{:,}'.format(vanilla[key(item)])
                log.append('shop price: %s (%s) from FRLG, the Shops tab has none' % (item, shop))
            if not cost:
                log.append('shop price: none for %s (%s)' % (item, shop))
            lines.append((item, shop, cost, note))
        for item in table:
            if item not in {name(i) for ids in a['item-shop'].values() for i in ids} and item not in everywhere:
                log.append('shop: the Shops tab lists %s at %s, data.js does not (kept)' % (item, shop))
                lines.append((item, shop, table[item][0], table[item][1]))
    for heading, shop in SHEET_SHOPS.items():
        for item, (cost, note) in priced[heading].items():
            lines.append((item, shop, cost, note))
    n = 0
    for item, shop, cost, note in lines:
        if hc_out(item):
            dropped.append('%s (%s): unobtainable in Hardcore' % (item, shop))
            continue
        note = {'Need 8th Badge': 'after the 8th badge', 'once': 'once'}.get(note, note)
        text = ' · '.join(x for x in (shop, cost, note) if x)
        box = box_of(item)[0]
        if box in ('Z-Crystals', 'Key Items', 'Mega Stones'):  # no shop kind for these: their own box, a Shop line
            add(item, 'Shop: ' + text)
        else:
            add(item, text, box='Shops', sub=shop_kind(item))
        n += 1
    return n


# ---- care packages ---------------------------------------------------------------------------------------------------
RED, BLUE = 'FFFFC2C2', 'FFD2EFFF'       # Care Packages F14 / F15: not given in Hardcore / not in MGM + Hardcore


def care_title(text):
    t = text.title().replace("'S ", "'s ").replace('(Post-Game)', '(post-game)')
    t = re.sub(r'\b(After|Before|Entering|Exiting|Defeating|In)\b', lambda m: m.group(1).lower(), t)
    return t[0].upper() + t[1:]


def care_packages(add, hc_out, log, dropped):
    packages, heading = [], None
    for row, cells in tab('Care Packages'):
        for col, (text, font, fill) in sorted(cells.items()):
            text = fix(text)
            m = re.match(r'^(.+?) \[x(\d+)\]$', text)
            if m and heading is not None:
                packages[-1][1].append((name(m.group(1)) or m.group(1), int(m.group(2)), fill))
            elif col == 'E' and text.isupper() and len(text) < 60 and not text.startswith('WHAT'):
                heading = care_title(text)
                packages.append((heading, []))
    cheat = [(i, step, {name(x) for x in ids}) for i, a in enumerate(DATA['areas'])
             for step, ids in a.get('item-cheat', {}).items()]
    used, n = set(), 0
    for heading, items in packages:
        names = {i for i, q, f in items}
        best = max(cheat, key=lambda c: len(c[2] & names))
        if len(best[2] & names) < len(names) / 2:
            log.append('care package %r: no data.js area matches' % heading)
            best = (None, None, set())
        else:
            used.add(best[0])
            for missing in sorted(names - best[2]):
                log.append('care package %r: %s is not in data.js %s' % (heading, missing,
                                                                           DATA['areas'][best[0]]['name']))
        for item, qty, fill in items:
            if fill in (RED, BLUE) or hc_out(item):
                dropped.append('%s x%d (care package, %s): not given in Hardcore' % (item, qty, heading))
                continue
            add(item, 'Also: Care package · %s · x%d' % (heading, qty), best[0], int(best[1]) if best[1] else None)
            n += 1
    for i, step, ids in cheat:
        if i not in used:
            log.append('data.js care package items with no package on the sheet: %s (%s, step %s)' % (
                ', '.join(sorted(ids)), DATA['areas'][i]['name'], step))
    return n


# ---- move tutors -----------------------------------------------------------------------------------------------------
RED_FONT = 'FFCC0000'       # Move Tutors A3 / A4: not learnable / gone in Restricted / Hardcore Mode


def cost(value):
    value = fix(value)
    m = re.match(r'^([\d ]+)(?:\.0)?(?: \((.+)\))?$', value)
    if not m:
        return value
    amount = int(m.group(1).replace(' ', ''))
    note = (m.group(2) or '').replace('$0 1st Time', 'free the first time').lower()
    text = '₽{:,}'.format(amount) if amount else 'free'
    return text + (' (%s)' % note if note and note != 'only once' else ', once' if note else '')


def tutors(add, Mi, log, dropped):
    blocks, special = [], False
    for row, cells in tab('Move Tutors'):
        if 'A' in cells and 'SPECIAL MOVE TUTORS' in cells['A'][0]:
            special = True
            continue
        if 'A' in cells and 'C' in cells:
            blocks.append({'place': fix(cells['A'][0]), 'who': fix(cells['C'][0]).replace(' / ', ' '),
                           'gone': cells['A'][1] == RED_FONT, 'moves': [], 'cost': '', 'special': special})
        elif 'H' in cells and blocks:
            blocks[-1]['moves'].append((fix(cells['H'][0]), cells['H'][1] == RED_FONT))
            if 'N' in cells:
                blocks[-1]['cost'] = cost(cells['N'][0])
    n = 0
    sheet_moves = set()
    for b in blocks:
        place = re.sub(r'\s*/\s*', ' · ', b['place'])
        town = re.split(r"'s | · ", place)[0]
        where = place[len(town):].lstrip("'s ").lstrip(' · ')
        card = '%s (%s)' % (b['who'], town)
        if b['special']:
            for mv, _ in b['moves']:
                add(town, '%s: %s · %s' % (b['who'], mv, ' · '.join(x for x in (b['cost'], where) if x)),
                    box='Useful NPCs')
            continue
        for mv, red in b['moves']:
            m = move(mv)
            sheet_moves.add(m)
            if b['gone'] or red:
                dropped.append('tutor %s (%s): not in Hardcore' % (mv, card))
                continue
            if m is None:
                log.append('tutor move not in M: %s' % mv)
            add(m or mv, ' · '.join(x for x in (town, where, b['cost']) if x), box='Move Tutors', sub=card,
                lnk=Mi.get(m))
            n += 1
    for a in DATA['areas']:                              # data.js tutors the sheet doesn't list
        for step, ids in a.get('tutors', {}).items():
            for i in ids:
                m = move(DATA['tutorMoves'][str(i)])
                if m not in sheet_moves:
                    sheet_moves.add(m)
                    place = pretty(a['name'])
                    add(m, place, box='Move Tutors', sub='Tutor (%s)' % place, lnk=Mi.get(m))
                    log.append('tutor %s: data.js only (%s)' % (m, place))
                    n += 1
    return n


# ---- item text -------------------------------------------------------------------------------------------------------
# items whose battle effect RR changed (Showdown gen9rr/items.ts; v4.0 / v4.1 changelogs): changed even when FireRed
# has no text to compare with; their In battle text is extract/battle_text.json
RR_EFFECT = {'Adamant Orb', 'Bright Powder', 'Burnt Seed', 'Electirizer', 'Eternamax Orb', "King's Rock", 'Lax Incense',
             'Leek Stick', 'Magmarizer', 'Reaper Cloth', 'Upgrade', 'Up-Grade'} | \
    {t + ' Gem' for t in ('Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying',
                          'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy')}


def bag_text(text):
    text = re.sub(r'\s+', ' ', str(text)).strip()
    return re.sub(r'\bPoke(?=\b| Ball|Block)', 'Poké', text.replace('Pokemon', 'Pokémon'))


def write_item_desc():
    """extract/item_desc.json: data.js bag text for every item but TMs / HMs and unused records; changed = the text
    differs from FireRed's (pokefirered items.json, case, line breaks and accents ignored) or RR changed the effect."""
    import json
    vanilla = {key(r['english']): r['description_english']
               for r in json.loads((Path(H.src) / 'repos/pokefirered/src/data/items.json').read_text('utf-8'))['items']}
    vanilla['paralyzeheal'] = vanilla.get('parlyzheal')

    def norm(text):
        return key(str(text).replace(chr(92) + 'n', ' '))
    out = {}
    for ident, row in sorted(DATA['items'].items(), key=lambda x: int(x[0])):
        item = name(ident)
        text = bag_text(row['description'])
        if not item or re.match(r'(TM|HM)\d', item) or text in ('', 'Unimplemented.') or '???' in text:
            continue
        old = vanilla.get(key(row['name']))
        changed = int(bool(old) and norm(old) != norm(text) or item in RR_EFFECT)
        out.setdefault(item, [text, changed])
    path = Path(H.extract) / 'item_desc.json'
    body = json.dumps(out, ensure_ascii=False, indent=1, sort_keys=True) + '\n'
    if not path.exists() or path.read_text('utf-8') != body:
        path.write_text(body, encoding='utf-8', newline='\n')
    return len(out), sum(v[1] for v in out.values())

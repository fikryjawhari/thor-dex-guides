"""Stage 5: Items tab (IT) and the Mega stones' names (P.stone).

Vanilla places come from Bulbapedia's Kalos location pages (.src/bulbapedia/*.wiki): the {{Itemlist}} rows of each
page's Items section (Pokemon X rows only; the random Berries from "Natural objects" trees are left out) and the
{{shop}} / {{shopitem}} tables (Marts, Poke Ball Boutique, Stone Emporium, Herboriste, Incense Shop, Battle Maison BP
shops, Poke Miles). `Item Changes _ Locations.pdf` wins: its mart swaps (DOC_SWAPS), the Mega stones in every Mart
after five badges, the Incense Shop and the five TM changes are applied to the Bulbapedia stock. Wild holders come from
P.hi (the hack's own data; the doc's "Wild Hold Items" list is cross-checked against it). TM moves come from
dex-rebalanced.json (code.ips already applied).

Boxes (plans/ps-items.md, as Photonic Sun): Shops (a row per item under its kind, every shop that sells it), TMs,
Evolution Items, Held Items (sub-headings by class, Mega Stones among them), Stats and Abilities, Fossils (the hack
makes wild Pokemon hold them), Key Items. Rows say Found / Wild / Also / Shop on their own lines; the walkthrough
stage files them by D['_itp'] (their places as a '; ' list). Game order (Key Items, Stats and Abilities, TMs) needs
the walkthrough's stops, so order(D) runs after walk.py; the other boxes are A to Z.
"""
import glob, os, re
from collections import OrderedDict
from common import BULBA, load, report, fix, text

# ---- the doc (Item Changes _ Locations.pdf), transcribed ------------------------------------------------------------
TM_WAS = {'TM48': 'Round', 'TM60': 'Quash', 'TM49': 'Echoed Voice', 'TM58': 'Sky Drop', 'TM100': 'Confide',
          'TM51': 'Steel Wing', 'TM79': 'Frost Breath'}
MART_STONES = ['Gardevoirite', 'Garchompite', 'Scizorite', 'Kangaskhanite', 'Heracronite', 'Gyaradosite',
               'Tyranitarite', 'Pinsirite']                    # replace Potion ... Repel in every Mart from 5 badges
INCENSE_SWAP = {'Sea Incense': 'Manectite', 'Lax Incense': 'Houndoominite', 'Rose Incense': 'Mawilite',
                'Pure Incense': 'Banettite', 'Rock Incense': 'Charizardite Y', 'Odd Incense': 'Aggronite',
                'Luck Incense': 'Absolite', 'Full Incense': 'Medichamite', 'Wave Incense': 'Alakazite'}
# (place, shop label in Bulbapedia) -> {vanilla item: hack item}
DOC_SWAPS = {
    ('Aquacorde Town', 'West shop'): {'Poké Ball': 'Cherish Ball'},
    ('Vernal Avenue', 'Stone Emporium'): {'Fire Stone': 'Dawn Stone', 'Water Stone': 'Dusk Stone', 'Leaf Stone': 'Shiny Stone'},
    ('Santalune City', 'Right cashier'): {'X Speed': 'TM48', 'X Attack': 'TM60', 'X Defense': 'TM58', 'Guard Spec.': 'TM23',
                                          'Dire Hit': 'TM59', 'X Accuracy': 'TM05', 'X Sp. Atk': 'TM16', 'X Sp. Def': 'TM33'},
    ('North Boulevard', 'Right cashier'): {'Heal Ball': 'TM72', 'Net Ball': 'TM87', 'Nest Ball': 'TM51'},
    ('Cyllage City', 'Right cashier'): {'Nest Ball': 'Flying Gem'},
    ('Laverre City', 'Right cashier'): {'Protein': 'TM14', 'Iron': 'TM25', 'Calcium': 'TM38', 'Zinc': 'TM52', 'Carbos': 'TM15',
                                        'HP Up': 'TM68'},
    ('Anistar City', 'Right cashier'): {'TM14': 'TM93', 'TM25': 'TM91', 'TM38': 'TM34', 'TM52': 'TM50', 'TM15': 'TM64'},
    ('Coumarine City', 'Right cashier'): {'Quick Ball': 'Razor Claw', 'Timer Ball': 'Razor Fang', 'Repeat Ball': 'Dubious Disc'},
    ('Snowbelle City', 'Right cashier'): {'Heal Ball': 'Assault Vest', 'Net Ball': 'Life Orb', 'Nest Ball': 'Flame Orb',
                                          'Dusk Ball': 'Toxic Orb', 'Quick Ball': 'Choice Band', 'Timer Ball': 'Choice Scarf',
                                          'Repeat Ball': 'Choice Specs'},
}
DOC_BALLS_GONE = ['Quick Ball', 'Timer Ball', 'Repeat Ball']    # Coumarine Mart: "now exclusive to the Poké Ball Emporium"

# ---- item classes -------------------------------------------------------------------------------------------------
EVO = ['Fire Stone', 'Water Stone', 'Thunder Stone', 'Leaf Stone', 'Moon Stone', 'Sun Stone', 'Shiny Stone', 'Dusk Stone',
       'Dawn Stone', 'Ice Stone', 'Oval Stone', "King's Rock", 'Metal Coat', 'Dragon Scale', 'Up-Grade', 'Dubious Disc',
       'Deep Sea Tooth', 'Deep Sea Scale', 'Protector', 'Electirizer', 'Magmarizer', 'Reaper Cloth', 'Razor Claw',
       'Razor Fang', 'Sachet', 'Whipped Dream', 'Prism Scale']
POWER = ['Power Bracer', 'Power Belt', 'Power Lens', 'Power Band', 'Power Anklet', 'Power Weight', 'Macho Brace']
VIT = ['HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos']
WINGS = ['Health Wing', 'Muscle Wing', 'Resist Wing', 'Genius Wing', 'Clever Wing', 'Swift Wing']
LOWER = ['Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry']
STATS = [('Raise stats (vitamins)', VIT), ('Raise stats (wings)', WINGS), ('Power items (EVs while held)', POWER),
         ('Lower stats (berries)', LOWER), ('Abilities', ['Ability Capsule']), ('Levels and PP', ['Rare Candy', 'PP Up', 'PP Max'])]
FOSSILS = ['Helix Fossil', 'Dome Fossil', 'Old Amber', 'Root Fossil', 'Claw Fossil', 'Armor Fossil', 'Skull Fossil',
           'Plume Fossil', 'Cover Fossil', 'Sail Fossil', 'Jaw Fossil']
HELD = [
    ('Type boosters', ['Charcoal', 'Mystic Water', 'Magnet', 'Miracle Seed', 'Never-Melt Ice', 'Black Belt', 'Poison Barb',
                       'Soft Sand', 'Sharp Beak', 'TwistedSpoon', 'Twisted Spoon', 'Silk Scarf', 'SilverPowder', 'Silver Powder',
                       'Hard Stone', 'Spell Tag', 'Black Glasses', 'Dragon Fang', 'Rose Incense', 'Sea Incense', 'Odd Incense',
                       'Rock Incense', 'Wave Incense', 'Normal Gem', 'Flying Gem']),   # + every Plate
    ('Battle gear', ['Choice Band', 'Choice Scarf', 'Choice Specs', 'Life Orb', 'Leftovers', 'Black Sludge', 'Assault Vest',
                     'Eviolite', 'Rocky Helmet', 'Expert Belt', 'Muscle Band', 'Wise Glasses', 'Scope Lens', 'Wide Lens',
                     'Zoom Lens', 'Shell Bell', 'Quick Claw', 'Focus Band', 'Flame Orb', 'Toxic Orb', 'Iron Ball',
                     'Lagging Tail', 'Sticky Barb', 'Grip Claw', 'Light Clay', 'Metronome', 'Safety Goggles',
                     'Ring Target', 'Shed Shell', 'Smoke Ball', 'Float Stone', 'Damp Rock', 'Heat Rock', 'Icy Rock',
                     'Smooth Rock', 'Binding Band', 'Bright Powder', 'Big Root', 'Soothe Bell']),
    ('One-use items', ['Focus Sash', 'Power Herb', 'White Herb', 'Mental Herb', 'Red Card', 'Eject Button', 'Air Balloon',
                       'Absorb Bulb', 'Cell Battery', 'Luminous Moss', 'Snowball', 'Weakness Policy', 'Electric Seed',
                       'Grassy Seed', 'Misty Seed', 'Psychic Seed']),
    ('Pokémon-specific', ['Light Ball', 'Thick Club', 'Stick', 'Metal Powder', 'Quick Powder', 'Lucky Punch', 'Adamant Orb',
                          'Lustrous Orb', 'Griseous Orb']),
    ('Mega Stones', []),                                                # every stone a Mega needs
    ('Genesect Drives', []),                                            # every Drive
    ('Other held items', ['Everstone', 'Destiny Knot', 'Amulet Coin', 'Cleanse Tag', 'Lucky Egg', 'Lax Incense',
                          'Full Incense', 'Luck Incense', 'Pure Incense', 'Exp. Share']),
]
KEY = ['Bicycle', 'Roller Skates', 'Running Shoes', 'Town Map', 'Dowsing Machine', 'Old Rod', 'Good Rod', 'Super Rod',
       'Holo Caster', 'Mega Ring', 'Exp. Share', 'Poké Flute', 'Lens Case', "Prof's Letter", 'Honor of Kalos', 'Vs. Recorder',
       'Elevator Key', 'Lab Key Card A', 'Lab Key Card B', 'Lab Key Card C', 'Looker Ticket', 'Power Plant Pass',
       'Reveal Glass', 'Gracidea', 'DNA Splicers', 'Intriguing Stone', 'TMV Pass', 'Adventure Rules']
HEAL = ['Potion', 'Super Potion', 'Hyper Potion', 'Max Potion', 'Full Restore', 'Revive', 'Max Revive', 'Antidote',
        'Paralyze Heal', 'Awakening', 'Burn Heal', 'Ice Heal', 'Full Heal', 'Escape Rope', 'Repel', 'Super Repel',
        'Max Repel', 'Ether', 'Max Ether', 'Elixir', 'Max Elixir', 'Heal Powder', 'Energy Powder', 'Energy Root',
        'Revival Herb', 'Moomoo Milk', 'Berry Juice', 'Fresh Water', 'Soda Pop', 'Lemonade']
KINDS = ['Poké Balls', 'Healing and repels', 'Evolution items', 'Power items', 'Mega Stones', 'Held items',
         'Stats and abilities', 'TMs', 'Other']
BIG = 10 ** 4
SKIP_NAMES = {'', 'None', 'Pokédex', 'National Pokédex'}   # ribbons, clothing, the Pokédex: not items to file here


# ---- wikitext helpers -----------------------------------------------------------------------------------------------
def templates(t, starts):
    """Balanced {{...}} templates whose text begins with one of `starts` (lower case), with the heading above."""
    head, i, n = '', 0, len(t)
    low = t.lower()
    while i < n:
        j = low.find('{{', i)
        if j < 0:
            return
        hs = t.rfind('\n=', 0, j)
        if hs >= 0:
            e = t.find('\n', hs + 1)
            m = re.match(r'\n(=+)\s*([^=\n]+?)\s*=+\s*$', t[hs:e if e > 0 else n])
            head = m.group(2) if m else head
        if not any(low.startswith(s, j) for s in starts):
            i = j + 2
            continue
        d, k = 0, j
        while k < n:
            if t.startswith('{{', k):
                d += 1; k += 2
            elif t.startswith('}}', k):
                d -= 1; k += 2
                if d == 0:
                    break
            else:
                k += 1
        yield head, t[j + 2:k - 2]
        i = k


def split_args(s):
    out, d, cur, i = [], 0, '', 0
    while i < len(s):
        two = s[i:i + 2]
        if two in ('{{', '[['):
            d += 1; cur += two; i += 2
        elif two in ('}}', ']]'):
            d -= 1; cur += two; i += 2
        elif s[i] == '|' and d == 0:
            out.append(cur); cur = ''; i += 1
        else:
            cur += s[i]; i += 1
    out.append(cur)
    return out


def args(s):
    pos, named = [], {}
    for a in split_args(s)[1:]:
        m = re.match(r'^\s*([A-Za-z0-9]+)=(.*)$', a, re.S)
        if m:
            named[m.group(1).lower()] = m.group(2).strip()
        else:
            pos.append(a.strip())
    return pos, named


def plain(s):
    s = re.sub(r'\{\{(?:tc|rt|m|DL|dotw|player|color2|gameIcon|ga)\|(?:[^{}|]*\|)*([^{}|]*)\}\}', r'\1', s)
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]|]*)\]\]', r'\1', s)
    s = re.sub(r'<[^>]+>|\'\'+', '', s)
    s = re.sub(r'\{\{[^{}]*\}\}', '', s)
    return re.sub(r'\s+', ' ', s.replace('&nbsp;', ' ')).strip()


def place_of(stem):
    return re.sub(r'^Kalos Route', 'Route', re.sub(r' \(Kalos\)$', '', stem))


def item_name(a0, disp, tms):
    """The item an {{Itemlist}} row is about (the first argument is a sprite-ish name with a generation tag)."""
    m = re.match(r'\{\{(TM|HM)\|(\d+)\|', disp or '', re.I)
    if m:
        k = f'{m.group(1).upper()}{int(m.group(2)):02d}'
        return f'{k} {tms[k]}' if k in tms else None
    if disp and re.match(r'\{\{DL\|', disp):
        return None
    m = re.match(r'\{\{i\|([^|}]+)', disp or '')
    if m:
        return m.group(1).strip()
    if disp and a0 in ('', 'None'):
        return plain(disp)
    n = re.sub(r' (VI|IV|XY)$', '', a0)
    return n if n not in SKIP_NAMES else None


def kalos_items(tms):
    """[(item, place, hidden, gift, qty)] from the Itemlist rows of every location page (Pokemon X rows)."""
    out = []
    for f in sorted(glob.glob(os.path.join(BULBA, '*.wiki'))):
        stem = os.path.basename(f)[:-5]
        if stem.startswith('Walkthrough') or stem == 'Poké Mart':
            continue
        t = open(f, encoding='utf-8').read()
        for head, tpl in templates(t, ('{{itemlist|',)):
            pos, nm = args(tpl)
            if ('x' in nm or 'y' in nm) and nm.get('x') != 'yes':  # Y-only rows give only y=yes
                continue
            desc = plain(pos[1]) if len(pos) > 1 else ''
            if desc.startswith('Randomly found by using') or head == 'Natural objects':
                continue
            name = item_name(pos[0] if pos else '', nm.get('display'), tms)
            if not name:
                continue
            q = re.search(r'×\s*(\d+)', nm.get('display', ''))
            gift = bool(re.match(r'(From|Given|Gift|Reward|Received)\b', desc))
            out.append((name, place_of(stem), 'hidden' in pos[1].lower() if len(pos) > 1 else False, gift,
                        int(q.group(1)) if q else 1))
    return out


def kalos_shops(tms):
    """[{'place', 'lab', 'items'}] from the {{shop}} tables of the pages that have them (Pokemon X and Y rows only)."""
    out = []
    for f in sorted(glob.glob(os.path.join(BULBA, '*.wiki'))):
        stem = os.path.basename(f)[:-5]
        if stem.startswith('Walkthrough') or stem in ('Poké Mart', 'Herb Shop', 'Lumiose City'):
            continue
        t = open(f, encoding='utf-8').read()
        if stem == 'Battle Maison':                     # the X and Y exchange corner only (ORAS has its own)
            a = t.find('Exchange Service Corner')
            t = t[a:t.find('Omega Ruby and Alpha Sapphire====', a)]
        for m in re.finditer(r'\{\{shop\|([^}]*?)\}\}(.*?)\{\{shopfooter', t, re.S):
            lab, body = m.group(1).strip(), m.group(2)
            if re.search(r'gameIcon|Generation VI\b.*gameIcon', lab):
                continue
            head = ''
            for h in re.finditer(r'\n(=+)\s*([^=\n]+?)\s*=+\s*(?=\n)', t[:m.start()]):
                head = h.group(2)
            its = []
            for _, st in templates(body, ('{{shopitem|',)):
                pos, nm = args(st)
                n = nm.get('display') or nm.get('5') or pos[0]
                n = re.sub(r' \(item\)$', '', n.split('#')[-1]).strip()
                if re.match(r'TM\d+$', n):
                    n = f'{n} {tms[n]}'
                cur = pos[2] if len(pos) > 2 else ''
                its.append(n)
            its = list(dict.fromkeys(its))
            if its:
                out.append({'place': place_of(stem), 'lab': lab, 'head': head, 'items': its, 'cur': cur})
    return out


def lumiose_mart(tms):
    t = open(os.path.join(BULBA, 'Lumiose City.wiki'), encoding='utf-8').read()
    m = re.search(r'\{\{shop\|North/South/Magenta - Left cashier\}\}(.*?)\{\{shopfooter', t, re.S)
    its = [re.sub(r' \(item\)$', '', (args(s)[1].get('display') or args(s)[0][0])) for _, s in templates(m.group(1), ('{{shopitem|',))]
    return its


# ---- the build ------------------------------------------------------------------------------------------------------
def shop_label(s):
    r = 'right cashier' if 'Right' in s['lab'] or 'Upper' in s['lab'] else 'left cashier' if 'Left' in s['lab'] else ''
    h = s['head']
    if s['place'] == 'Battle Maison':
        return f"Battle Maison · BP shop, {r.replace('cashier', 'attendant')}"
    if s['lab'] in ('Left cashier', 'Right cashier', 'Generation VI', 'Left attendant', 'Right attendant', 'West shop', 'East shop'):
        if s['place'] == 'Aquacorde Town':
            return f"Aquacorde Town · {s['lab'].split()[0].lower()} shop"
        return f"{s['place']} · Mart" + (f', {r}' if r else '')
    if h == 'Poké Miles':
        return f"{s['place']} · Poké Miles"
    return f"{s['place']} · {h or s['lab']}"


def build(D):
    MI, P = D['_MI'], D['P']
    dexj = load('dex-rebalanced.json')
    tms = dexj['tms']
    names = {fix(i['name']) for i in dexj['items']}
    stone = {m['item']: D['_spec'][(s['id'], m['form'])] for s in dexj['species'] for m in s.get('mega', []) if m.get('item')}
    for item, pid in stone.items():
        m = D['_byid'].get(pid)
        if m:
            m['stone'] = item
        else:
            report('  mega stone with no Mega in the dex:', item)
    for p in P:
        if p['g'] == 1 and not p.get('stone') and 'Rayquaza' not in p['n'] and 'Primal' not in p['n']:
            report('  Mega with no stone:', p['n'])

    # shops: Bulbapedia stock with the doc's swaps ------------------------------------------------------------------
    shops = kalos_shops(tms)
    lum = lumiose_mart(tms)
    shops.append({'place': 'Lumiose City', 'lab': 'North/South/Magenta - Left cashier', 'head': 'Poké Mart', 'items': lum, 'cur': ''})
    keep, seen = [], set()
    for s in shops:
        if s['place'] in ('North Boulevard', 'South Boulevard') and s['lab'] == 'Left cashier':
            continue                                    # the same Mart as Lumiose City's left cashier
        if s['place'] == 'Lumiose City' and s['lab'].startswith('North/South'):
            s['lab'] = 'Left cashier'
        key = (s['place'], s['lab'], tuple(s['items']))
        if key in seen:
            continue
        seen.add(key)
        keep.append(s)
    shops = keep
    for s in shops:
        s['items'] = [i for i in s['items'] if not re.match(r'Drink$', i)]
        if s['place'] == 'Lumiose City':
            s['lab'], s['place'] = 'Left cashier', 'Lumiose City'
    for s in shops:
        sw = DOC_SWAPS.get((s['place'], s['lab'])) or DOC_SWAPS.get((s['place'], s['head']))
        if not sw:
            continue
        sw = {(f'{k} {tms[k]}' if re.match(r'TM\d+$', k) else k): (f'{v} {tms[v]}' if re.match(r'TM\d+$', v) else v)
              for k, v in sw.items()}
        its = list(s['items'])
        for old, new in sw.items():
            if old in its:
                its[its.index(old)] = new
            else:
                its.append(new)
                report(f'  doc swaps {old} => {new} in {s["place"]} {s["lab"]}, but Bulbapedia\'s stock lacks {old}: added')
        s['items'] = list(dict.fromkeys(its))
        s['doc'] = True
    # towns that have both cashiers name the left one
    twoshops = {s['place'] for s in shops if s['lab'] == 'Right cashier'}
    for s in shops:
        s['name'] = shop_label(s)
        if s['place'] in twoshops and s['lab'] == 'Left cashier':
            s['name'] = f"{s['place']} · Mart, left cashier"
    shops.append({'place': None, 'lab': '', 'head': '', 'cur': '', 'name': 'Every Poké Mart (from five badges)', 'items': list(MART_STONES), 'doc': True})
    inc = [s for s in shops if s['place'] == 'Coumarine City' and s['head'] == 'Incense shop']
    for s in inc:
        s['items'] = [INCENSE_SWAP.get(i, i) for i in s['items']] + [v for k, v in INCENSE_SWAP.items()
                                                                     if k not in s['items'] and v not in s['items']]
        s['items'] = list(dict.fromkeys(s['items']))
        s['name'] = 'Coumarine City · Incense Stand'
        s['doc'] = True
        s['items'] = [i if i != 'Charizardite Y' else 'Charizardite Y' for i in s['items']]
    D['_shops'] = shops
    # validate the doc against the hack's data
    for old, new in [(k, v) for sw in DOC_SWAPS.values() for k, v in sw.items()]:
        for x in (old, new):
            if not re.match(r'TM\d+$', x) and fix(x) not in names:
                report('  doc item not in the hack\'s item list:', x)
    for tm, was in TM_WAS.items():
        if tms.get(tm) in (None, was):
            report('  doc says', tm, 'changed from', was, 'but the hack has', tms.get(tm))

    # field items ---------------------------------------------------------------------------------------------------------
    found = kalos_items(tms)
    BY = OrderedDict()
    for n, pl, hid, gift, q in found:
        BY.setdefault(n, []).append({'loc': pl, 'hidden': hid, 'gift': gift, 'qty': q})
    wild = OrderedDict()
    for p in P:
        if p['g'] == 1:
            continue
        for it in p.get('hi', []):
            it = fix(it)
            wild.setdefault(it, [])
            if p['n'] not in wild[it]:
                wild[it].append(p['n'])
    shopsof = OrderedDict()
    for s in shops:
        for i in s['items']:
            shopsof.setdefault(i, []).append(s)
    D['_BY'], D['_wild'], D['_shopsof'] = BY, wild, shopsof

    # which box ------------------------------------------------------------------------------------------------------------
    held_cls = {x: c for c, xs in HELD for x in xs}
    statn = {x for _, xs in STATS for x in xs}
    allnames = set(BY) | set(wild) | set(shopsof)

    def held_class(n):
        if n in stone:
            return 'Mega Stones'
        if n.endswith(' Plate'):
            return 'Type boosters'
        if n.endswith(' Drive'):
            return 'Genesect Drives'
        return held_cls.get(n)

    def kind(n):
        if re.match(r'(TM|HM)\d', n):
            return 'TMs'
        if n in stone:
            return 'Mega Stones'
        if n in POWER:
            return 'Power items'
        if n in EVO:
            return 'Evolution items'
        if n.endswith(' Ball'):
            return 'Poké Balls'
        if n in HEAL:
            return 'Healing and repels'
        if n in statn:
            return 'Stats and abilities'
        if held_class(n):
            return 'Held items'
        return 'Other'

    # unplaced wild holders are noted, not boxed
    unboxed = sorted(n for n in wild if kind(n) == 'Other' and n not in FOSSILS and n not in KEY)
    report('  wild-held items not in any box (berries, valuables, consumables):', len(unboxed), '; '.join(unboxed))

    def shop_short(s):
        return s['name']

    az = lambda xs: sorted(xs, key=str.casefold)
    D['_itp'], D['_itc'] = {}, {}

    def parts(n):
        found, other, shop = [], [], []
        for r in BY.get(n, []):
            t = r['loc'] + (' (hidden)' if r['hidden'] else '')
            (other if r['gift'] else found).append(t + (' (gift)' if r['gift'] else ''))
        for s in shopsof.get(n, []):
            shop.append(s['name'])
        w = wild.get(n, [])
        if len(shop) > 7:
            shop = ['Most Poké Marts' if sum(' · Mart' in x for x in shop) > 7 else f'{len(shop)} shops']
        return [(lab, list(dict.fromkeys(xs))) for lab, xs in (('Found', found), ('Wild', w), ('Also', other), ('Shop', shop)) if xs]

    def places(n):
        out = []
        for r in BY.get(n, []):
            out.append(r['loc'] + (' (gift)' if r['gift'] else ''))
        for w in wild.get(n, []):
            out.append(f'held by wild {w}')
        for s in shopsof.get(n, []):
            out.append(f"{s['place'] or 'Poké Mart'} shop")
        return '; '.join(dict.fromkeys(out))

    def lines(ps):
        return '\n'.join(f'{lab}: ' + ', '.join(xs) for lab, xs in ps)

    def row(n, sub=None):
        D['_itp'][n] = places(n)
        D['_itc'][n] = parts(n)
        r = [n, lines(D['_itc'][n]), None, 0]
        return r + [sub] if sub else r

    IT = []
    # Shops: a row per item under its kind, every shop on its own line
    by_item = OrderedDict()
    for s in shops:
        for i in s['items']:
            by_item.setdefault(i, []).append(s['name'])
    snames = az(by_item)
    srows = []
    for k in KINDS:
        for n in snames:
            if kind(n) != k:
                continue
            ls = by_item[n]
            if len(ls) > 7:
                mart = [x for x in ls if ' · Mart' in x]
                rest = [x for x in ls if ' · Mart' not in x]
                ls = (['Most Poké Marts'] if len(mart) > 7 else mart) + rest
            srows.append([n, '\n'.join(ls), MI.get(n.split(' ', 1)[1]) if k == 'TMs' else None, 0, k])
    IT.append({'n': 'Shops', 'k': 'gen', 'note': 'Every Poké Mart sells the Mega Stones from five badges, in place of Potion to Repel.', 'r': srows})
    # TMs
    tmr = []
    for n in range(1, 101):
        tm = f'TM{n:02d}'
        mv = tms[tm]
        name = f'{tm} {mv}'
        D['_itp'][name] = places(name)
        pl = D['_itp'][name]
        txt = pl.replace('; ', ';').replace(';', '; ') or '?'
        if tm in TM_WAS:
            txt = f'Was {TM_WAS[tm]} in Pokémon X. ' + txt
        tmr.append([name, txt, MI.get(mv), 0])
    IT.append({'n': 'TMs', 'k': 'tm', 'note': 'TM48, TM49, TM51, TM58, TM60, TM79 and TM100 teach new moves in Eternal X. All TMs except Dream Eater and Retaliate can be had before the Elite Four.', 'r': tmr})
    IT.append({'n': 'Evolution Items', 'k': 'gen', 'note': '', 'r': [row(n) for n in az(n for n in EVO if n in allnames)]})
    held = [n for n in allnames if held_class(n) and kind(n) == 'Held items'] + [n for n in stone if n in allnames]
    held = az(dict.fromkeys(held))
    IT.append({'n': 'Held Items', 'k': 'gen', 'note': '',
               'r': [row(n, c) for c, _ in HELD for n in held if held_class(n) == c]})
    IT.append({'n': 'Stats and Abilities', 'k': 'gen', 'note': 'Vitamins are post-game only: Battle Maison BP shop.',
               'r': [row(n, g) for g, xs in STATS for n in xs if n in allnames]})
    IT.append({'n': 'Fossils', 'k': 'gen', 'note': '', 'r': [row(n) for n in FOSSILS if n in allnames]})
    IT.append({'n': 'Key Items', 'k': 'gen', 'note': '', 'r': [row(n) for n in KEY + [f'HM{i:02d} {tms[f"HM{i:02d}"]}' for i in range(1, 6)] if n in allnames]})
    D['IT'] = IT
    nostone = [n for n in stone if n not in allnames]
    if nostone:
        report('  Mega stones with no place in any source:', ', '.join(nostone))
    nopl = [r[0] for s in IT[1:] for r in s['r'] if not D['_itp'].get(r[0])]
    if nopl:
        report('  rows with no place:', ', '.join(nopl))
    report('items:', ', '.join(f"{s['n']} {len(s['r'])}" for s in IT))
    doc_check(D, wild)


def doc_check(D, wild):
    """The doc's Wild Hold Items list against P.hi (the game data wins)."""
    t = text('Item Changes _ Locations').split('Wild Hold Items:')[1]
    by_sp = {}
    for p in D['P']:
        by_sp.setdefault(re.sub(r'^(Mega|Primal) ', '', p['n']), set()).update(fix(x) for x in p.get('hi', []))
    miss = []
    for line in t.splitlines():
        m = re.match(r'\s+([A-Z][A-Za-z\'’.\- ]+?):\s*(?:[Ss]ometimes|[Aa]lways)? ?held by wild (.*)$', line)
        if not m:
            continue
        item = m.group(1).replace('’', "'")
        for sp in re.findall(r'([A-Z][a-z\'.\- ]+?)(?: \(\d+%\)|,| and|$)', m.group(2).replace('Always held by the one-time Torchic', '')):
            sp = sp.strip()
            if sp and sp in by_sp and item not in by_sp[sp] and not item.endswith('Fossil'):
                miss.append(f'{item}/{sp}')
    if miss:
        report('  doc says held by wild but P.hi lacks:', ', '.join(miss))


def order(D):
    """After walk.py: Key Items, Stats and Abilities (inside each sub-heading) and TMs in game order = the walkthrough
    stop of the earliest place the item can be had (wild holders count where they live, shops where they stand; no
    place last, ties A to Z); Found places in game order on every compact row. No-op without the walkthrough."""
    if 'WK' not in D:
        return
    try:
        from walk import same, ITEM_ALIAS
    except ImportError:
        from common import norm
        ITEM_ALIAS = {}
        same = lambda a, b: bool(norm(a)) and (norm(a) == norm(b) or norm(b).startswith(norm(a)))
    stops = [s['n'] for sp in D['WK']['splits'] for s in sp['st']]

    def stop_of(loc):
        loc = loc.split(' - ')[0].split(' · ')[0].replace(' shop', '').replace(' (gift)', '').replace(' (hidden)', '')
        loc = re.sub(r' \(.*\)$', '', ITEM_ALIAS.get(loc, loc))
        return next((i for i, s in enumerate(stops) if same(loc, s)), None)

    sp = {}
    for p in D['P']:
        ix = [i for i in (stop_of(D['AR'][w[0]]['n']) for w in p.get('w', []) if w[1] not in ('Gift', 'Trade')) if i is not None]
        if ix:
            sp[p['n']] = min(ix)

    def score(n):
        c = [stop_of(r['loc']) for r in D['_BY'].get(n, [])]
        c += [sp.get(w) for w in D['_wild'].get(n, [])]
        c += [stop_of(s['place']) if s['place'] else 5 for s in D['_shopsof'].get(n, [])]
        c = [x for x in c if x is not None]
        return min(c) if c else BIG

    def row_score(r):
        c = [stop_of(re.sub(r'^Was .*?\. ', '', x.strip())) for x in r[1].split(';') if x and not x.strip().startswith('held by')]
        c = [x for x in c if x is not None]
        return min(c) if c else BIG

    subs = [g for g, _ in STATS]
    for sec in D['IT']:
        if sec['n'] not in ('Shops', 'TMs'):
            for r in sec['r']:
                ps = D['_itc'].get(r[0])
                if ps is not None:
                    r[1] = '\n'.join(f'{lab}: ' + ', '.join(sorted(xs, key=lambda x: (stop_of(x) is None, stop_of(x) or 0)) if lab == 'Found' else xs)
                                     for lab, xs in ps)
        if sec['n'] in ('Key Items', 'Stats and Abilities'):
            sec['r'].sort(key=lambda r: (subs.index(r[4]) if len(r) > 4 else 0, score(r[0]), r[0].casefold()))
            late = [r[0] for r in sec['r'] if score(r[0]) == BIG]
            if late:
                report(f'  {sec["n"]} with no place (listed last):', ', '.join(late))
        elif sec['n'] == 'TMs':
            sec['r'].sort(key=lambda r: (row_score(r), r[0]))
    report('items:', ', '.join(f"{s['n']} {len(s['r'])}" for s in D['IT']))

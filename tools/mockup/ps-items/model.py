"""Items tab, proposed data (Photonic Sun pass 2): python -I model.py <repo> <data.json> [out.json]

Builds D.IT variants from Serebii's item list (hacks/photonic-sun/.src/item-locations.csv), items.py's SHOPS / TRIALS
and the walkthrough's stop order (data.json WK). This is the mockup's data AND the reference for the extract change
(plans/ps-items.md): the class sets below are the rules. Variants are keyed "<shops>.<held>.<order>.<text>":
  shops  S shop (a sub-heading per shop, a row per item)  K kind (a sub-heading per item kind, shops in the row)
  held   S sub-headings in one Held Items box  B one box per class
  order  A A-Z  G game order (walkthrough stops)
  text   F the current row text  C compact (Found / Wild / Shop lines)
Everything else is the same in every variant."""
import csv, json, re, sys
from pathlib import Path

repo = Path(sys.argv[1])
sys.path.insert(0, str(repo / 'hacks/photonic-sun/extract'))
import items as I           # SHOPS, TRIALS
from walk import same, ITEM_ALIAS

# ---- class rules -------------------------------------------------------------------------------------------------
POWER = ['Power Bracer', 'Power Belt', 'Power Lens', 'Power Band', 'Power Anklet', 'Power Weight']
VIT = ['HP Up', 'Protein', 'Iron', 'Calcium', 'Zinc', 'Carbos']
WINGS = ['Health Wing', 'Muscle Wing', 'Resist Wing', 'Genius Wing', 'Clever Wing', 'Swift Wing']
LOWER = ['Pomeg Berry', 'Kelpsy Berry', 'Qualot Berry', 'Hondew Berry', 'Grepa Berry', 'Tamato Berry']
STATS = [('Raise stats (vitamins)', VIT), ('Raise stats (wings)', WINGS), ('Power items (EVs while held)', POWER),
         ('Lower stats (berries)', LOWER), ('Hyper Training (IVs)', ['Bottle Cap', 'Gold Bottle Cap']),
         ('Abilities', ['Ability Capsule']), ('Levels and PP', ['Rare Candy', 'PP Up', 'PP Max'])]
HELD = [
    ('Type boosters', ['Charcoal', 'Mystic Water', 'Magnet', 'Miracle Seed', 'Never-Melt Ice', 'Black Belt', 'Poison Barb',
                       'Soft Sand', 'Sharp Beak', 'TwistedSpoon', 'Silk Scarf', 'SilverPowder', 'Hard Stone', 'Spell Tag',
                       'Black Glasses', 'Dragon Fang', 'Rose Incense']),   # + every Plate
    ('Battle gear', ['Choice Band', 'Choice Scarf', 'Choice Specs', 'Life Orb', 'Leftovers', 'Black Sludge', 'Assault Vest',
                     'Eviolite', 'Rocky Helmet', 'Expert Belt', 'Muscle Band', 'Wise Glasses', 'Scope Lens', 'Wide Lens',
                     'Zoom Lens', 'Shell Bell', 'Quick Claw', 'Focus Band', 'Flame Orb', 'Toxic Orb', 'Iron Ball',
                     'Lagging Tail', 'Sticky Barb', 'Grip Claw', 'Light Clay', 'Metronome', 'Safety Goggles',
                     'Protective Pads', 'Ring Target', 'Shed Shell', 'Smoke Ball', 'Float Stone', 'Terrain Extender',
                     'Damp Rock', 'Heat Rock', 'Icy Rock', 'Smooth Rock', 'Binding Band', 'Bright Powder', 'Big Root']),
    ('Gems', ['Normal Gem', 'Flying Gem']),
    ('One-use items', ['Focus Sash', 'Power Herb', 'White Herb', 'Mental Herb', 'Red Card', 'Eject Button', 'Air Balloon',
                       'Absorb Bulb', 'Cell Battery', 'Luminous Moss', 'Snowball', 'Weakness Policy', 'Electric Seed',
                       'Grassy Seed', 'Misty Seed', 'Psychic Seed']),
    ('Pokémon-specific', ['Light Ball', 'Thick Club', 'Stick', 'Metal Powder', 'Quick Powder', 'Lucky Punch', 'Soul Dew']),
    ('Silvally Memories, Genesect Drives', []),                         # every Memory and Drive
    ('Other held items', []),                                           # the rest: Everstone, Destiny Knot, Amulet Coin...
]
HELD_BOX = {'Type boosters': 'Type Boosters', 'Battle gear': 'Battle Gear', 'Gems': 'Gems', 'One-use items': 'One-use Items',
            'Pokémon-specific': 'Pokémon-specific Items', 'Silvally Memories, Genesect Drives': 'Memories and Drives',
            'Other held items': 'Other Held Items'}
KEY_ALSO = {'Exp. Share'}                                               # in Key Items, not repeated in Held Items

rows = list(csv.DictReader(open(repo / 'hacks/photonic-sun/.src/item-locations.csv', encoding='utf-8')))
D = json.load(open(sys.argv[2], encoding='utf-8'))
OLD = {s['n']: s for s in D['IT']}
CAT, BY = {}, {}
for r in rows:
    CAT[r['item']] = r['category']
    BY.setdefault(r['item'], []).append(r)

# ---- game order: a score per place (index of the walkthrough stop that names it) ----------------------------------
STOPS = [s['n'] for sp in D['WK']['splits'] for s in sp['st']]
BIG = 10 ** 4


def stop_of(loc):
    loc = loc.split(' - ')[0].replace(' PokéMart', '').replace(' shop', '')
    loc = re.sub(r' \(.*\)$', '', ITEM_ALIAS.get(loc, loc))
    return next((i for i, s in enumerate(STOPS) if same(loc, s)), None)


SP = {}
for p in D['P']:
    ix = [stop_of(D['AR'][w[0]]['n']) for w in p.get('w', []) if w[1] not in ('Gift', 'Trade')]
    ix = [i for i in ix if i is not None]
    if ix:
        SP[p['n']] = min(ix)
SHOPSTOP = {s: stop_of(s.split(' (')[0].split(',')[0]) for s, _ in I.SHOPS}
SHOPSTOP['Battle Tree'] = stop_of('Battle Tree')
TIER = {t: i for i, (t, _) in enumerate(I.TRIALS)}


# ---- row text -----------------------------------------------------------------------------------------------------
def shops_of(name):
    return [s for s, its in I.SHOPS if name in its.split(', ')]


def tier_of(name):
    for t, its in I.TRIALS:
        if name in re.sub(r' \(.*\)', '', its).split(', '):
            return t
    return None


def holder_idx(name):
    return SP.get(name.replace('Alolan ', 'Alolan ').strip())


def score(name):
    """Earliest the item can be had: a field place, a shop, or a wild holder that lives in an early place."""
    c = []
    for r in BY.get(name, []):
        if r['method'] == 'field':
            c.append(stop_of(r['location']))
        elif r['method'] == 'Wild Encounter':
            c.append(SP.get(r['location'].replace('Alolan ', 'Alolan ')))
        elif r['method'] == 'Shop':
            c.append(SHOPSTOP.get(r['location'], stop_of(r['location'])))
    c += [SHOPSTOP[s] for s in shops_of(name)]
    t = tier_of(name)
    if t:
        c.append(TIER[t] * 8)
    c = [x for x in c if x is not None]
    return min(c) if c else BIG


def text_full(name):
    out = []
    for r in BY.get(name, []):
        loc, m = r['location'], r['method']
        if m == 'Shop' and loc != 'Battle Tree':
            continue
        out.append(loc if m == 'field' else f'held by wild {loc}' if m == 'Wild Encounter' else f'{loc} shop' if m == 'Shop'
                   else f'{loc} ({m})' if loc and loc != m else m)
    out += [f'{s} shop' for s in shops_of(name)]
    return '; '.join(dict.fromkeys(out))


def text_compact(name, game):
    found, wild, other, shop = [], [], [], []
    for r in BY.get(name, []):
        loc, m = r['location'], r['method']
        if m == 'field':
            found.append(loc)
        elif m == 'Wild Encounter':
            wild.append(loc)
        elif m == 'Shop':
            if loc == 'Battle Tree':
                shop.append('Battle Tree (BP)')
        else:
            other.append(m)
    shop += [re.sub(r' \((.*)\)', r', \1', s).replace('Pokémon Center', 'PC') for s in shops_of(name)]
    t = tier_of(name)
    if t:
        shop.append('PC, left clerk' + ('' if t == 'None' else f' (after {t.lower()} trial{"s" if t != "One" else ""})'))
    if game:
        found = sorted(dict.fromkeys(found), key=lambda x: (stop_of(x) is None, stop_of(x) or 0))
    lines = []
    for lab, xs in (('Found', found), ('Wild', wild), ('Also', other), ('Shop', shop)):
        xs = list(dict.fromkeys(xs))
        if xs:
            lines.append(f'{lab}: ' + ', '.join(xs))
    return '\n'.join(lines)


# ---- classes ------------------------------------------------------------------------------------------------------
EVO = {r[0] for r in OLD['Evolution Items']['r']}
HELDALL = [r[0] for r in OLD['Held Items']['r']]


def held_class(n):
    if n.endswith(' Plate'):
        return 'Type boosters'
    if n.endswith(' Memory') or n.endswith(' Drive'):
        return 'Silvally Memories, Genesect Drives'
    for c, xs in HELD:
        if n in xs:
            return c
    return 'Other held items'


def held_items():
    names = [n for n in HELDALL if n not in EVO and n not in POWER and n not in KEY_ALSO]
    for c, xs in HELD:                       # shop-only items the Serebii list lacks (Flying Gem, Zoom Lens...)
        names += [x for x in xs if x not in names and shops_of(x)]
    return names


def kind(n):
    c = CAT.get(n, '')
    if n.startswith('TM'):
        return 'TMs'
    if n in POWER:
        return 'Power items'
    if n in EVO or c == 'Evolutionary Items':
        return 'Evolution items'
    if c.endswith('Balls'):
        return 'Poké Balls'
    if c == 'Recovery Items' or n in ('Repel', 'Super Repel', 'Max Repel', 'Escape Rope', 'Sacred Ash'):
        return 'Healing and repels'
    if any(n in xs for _, xs in STATS):
        return 'Stats and abilities'
    if n in held_items() or c == 'Hold Items':
        return 'Held items'
    return 'Other'


KINDS = ['Poké Balls', 'Healing and repels', 'Evolution items', 'Power items', 'Held items', 'Stats and abilities', 'TMs', 'Other']


# ---- sections -----------------------------------------------------------------------------------------------------
def srt(names, order):
    return sorted(names, key=(lambda n: n.casefold()) if order == 'A' else (lambda n: (score(n), n.casefold())))


def rowsfor(names, order, text, sub=lambda n: ''):
    return [[n, text_full(n) if text == 'F' else text_compact(n, order == 'G'), None, 0, sub(n)] for n in names]


def pretty(s):
    return re.sub(r' \((.*)\)', r' · \1', s)


def shop_section(by, order):
    r = []
    if by == 'S':
        left = [(it, 'from the start' if t == 'None' else f'after {t.lower()} trial{"s" if t != "One" else ""}')
                for t, its in I.TRIALS for it in re.sub(r' \(.*\)', '', its).split(', ')]
        blocks = [('Pokémon Center, left clerk (every town)', left, -1)]
        for s, its in I.SHOPS:
            at = SHOPSTOP.get(s)
            blocks.append((pretty(s), [(it, kind_label(it)) for it in its.split(', ')], BIG if at is None else at))
        blocks.sort(key=(lambda b: b[0]) if order == 'A' else (lambda b: b[2]))
        for h, its, _ in blocks:
            for it, t in its:
                r.append([it, t, None, 0, h])
    else:
        by_item = {}
        for s, its in I.SHOPS:
            for it in its.split(', '):
                by_item.setdefault(it, []).append(pretty(s))
        for t, its in I.TRIALS:
            for it in re.sub(r' \(.*\)', '', its).split(', '):
                by_item.setdefault(it, []).append('Pokémon Center, left clerk' + (' (from the start)' if t == 'None' else f' (after {t.lower()} trial{"s" if t != "One" else ""})'))
        names = srt(list(by_item), order)
        for k in KINDS:
            for n in names:
                if kind(n) == k:
                    r.append([n, '\n'.join(by_item[n]), None, 0, k])
    note = "From the Vendor Changes doc. Every Pokémon Center's left clerk sells more as you clear trials."
    return {'n': 'Shops', 'k': 'gen', 'note': note, 'r': r}


def kind_label(n):
    k = kind(n)
    if k == 'Held items':
        return held_class(n).lower().replace('other held items', 'held item')
    return {'Poké Balls': 'Poké Ball', 'Healing and repels': 'healing', 'Evolution items': 'evolution item', 'Power items': 'power item',
            'Stats and abilities': 'stats', 'TMs': 'TM', 'Other': ''}[k]


def variant(shops, held, order, text):
    IT = [shop_section(shops, order), OLD['TMs'], OLD['Mega Stones'], OLD['Z-Crystals']]
    IT.append({'n': 'Evolution Items', 'k': 'gen', 'note': '', 'r': rowsfor(srt(sorted(EVO), order), order, text)})
    hn = held_items()
    if held == 'S':
        IT.append({'n': 'Held Items', 'k': 'gen', 'note': 'Sorted by what they do. Evolution items and Power items have their own boxes.',
                   'r': [x for c, _ in HELD for x in rowsfor(srt([n for n in hn if held_class(n) == c], order), order, text, lambda n, c=c: c)]})
    else:
        for c, _ in HELD:
            names = [n for n in hn if held_class(n) == c]
            IT.append({'n': HELD_BOX[c], 'k': 'gen', 'note': '', 'r': rowsfor(srt(names, order), order, text)})
    sub = {n: g for g, xs in STATS for n in xs}
    sn = [n for _, xs in STATS for n in xs]
    r = []
    for g, xs in STATS:
        r += rowsfor(srt(xs, order), order, text, lambda n, g=g: g)
    IT.append({'n': 'Stats and Abilities', 'k': 'gen', 'note': 'Vitamins, wings, Power items, Hyper Training, Ability Capsule, PP and levels.', 'r': r})
    keys = [x[0] for x in OLD['Key Items']['r']]
    IT.append({'n': 'Key Items', 'k': 'gen', 'note': '', 'r': rowsfor(srt(keys, order), order, text)})
    return IT


if __name__ == '__main__':
    V = {f'{a}.{b}.{c}.{d}': variant(a, b, c, d) for a in 'SK' for b in 'SB' for c in 'AG' for d in 'FC'}
    print(len(V), 'variants;', 'unplaced in game order:',
          [n for n in held_items() + [x for _, xs in STATS for x in xs] + [x[0] for x in OLD['Key Items']['r']] if score(n) == BIG])
    cnt = {}
    for n in held_items():
        cnt[held_class(n)] = cnt.get(held_class(n), 0) + 1
    print(cnt)
    print([(s['n'], len(s['r'])) for s in V['S.S.G.C']])
    print([(s['n'], len(s['r'])) for s in V['K.B.A.F']])
    if len(sys.argv) > 3:
        json.dump(V, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

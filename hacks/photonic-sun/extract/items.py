"""Items (IT, P.stone): the Items tab and the Mega stones' names.

Overworld items are vanilla (SOURCES.md: the hack's zone scripts are byte-identical to Ultra Sun's), so places come
from Serebii's Ultra Sun lists (item-locations.csv). Marts are the hack's own (Vendor Changes.pdf, transcribed in
SHOPS); Serebii's vanilla mart rows are dropped, except the Battle Tree's BP shop, which the doc doesn't change.
The five changed TMs teach the hack's move (code.ips, via dex-rebalanced.json's TM list).

Boxes (plans/ps-items.md): Shops (a row per item under its kind, every shop that sells it), TMs, Z-Crystals,
Evolution Items, Held Items (sub-headings by class), Stats and Abilities, Key Items. Each item is in one box (plus
Shops). Rows say Found / Wild / Also / Shop on their own lines; the walkthrough files them by D['_itp'] (their places
as a '; ' list, like the old row text). Game order (Key Items, Stats and Abilities, TMs, Z-Crystals) needs the
walkthrough's stops, so order(D) runs after walk.py; the other boxes are A to Z. Battle Items, Fossils and Mega Stones
have no box (the stones are generated in; fossils are Poké Pelago only).
"""
import csv, os, re
from collections import OrderedDict
from common import SRC, load, report

TRIALS = [('None', 'Poké Ball, Potion, Antidote, Awakening, Burn Heal, Ice Heal, Escape Rope, Repel'),
          ('One', 'Great Ball, Super Potion, Adrenaline Orb'), ('Two', 'Revive, Ability Capsule'),
          ('Three', 'Hyper Potion, Super Repel'), ('Four', 'Ultra Ball, Poké Toy'), ('Five', 'Full Heal, Max Repel'),
          ('Six', 'Max Potion'), ('Seven', 'Full Restore, Weakness Policy, Sacred Ash (Repel and Potion no longer sold)')]
SHOPS = [
    ("Hau'oli City (Pokémon Center, right clerk)", 'Power Bracer, Power Belt, Power Lens, Power Band, Power Anklet, Power Weight, Oval Stone, Prism Scale'),
    ('Route 2 (Pokémon Center, right clerk)', 'Super Potion, Heal Ball, Nest Ball, Luxury Ball, Fast Ball, Level Ball, Lure Ball, Heavy Ball, Love Ball, Friend Ball, Moon Ball, Cherish Ball'),
    ('Route 5 (Pokémon Center, right clerk)', 'Leaf Stone, Fire Stone, Water Stone, Thunder Stone, Sun Stone, Moon Stone, Up-Grade, Dubious Disc'),
    ('Route 8 (Pokémon Center, right clerk)', "Quick Ball, Dusk Ball, Dive Ball, Deep Sea Tooth, Deep Sea Scale, Reaper Cloth, Sachet, Whipped Dream, Metal Coat, King's Rock, Old Amber"),
    ('Thrifty Megamart (clerk 1)', 'Quick Ball, Dusk Ball, Heal Ball, Nest Ball, Timer Ball'),
    ('Thrifty Megamart (clerk 2)', 'Electric Seed, Psychic Seed, Misty Seed, Grassy Seed, Air Balloon'),
    ('Konikoni City (clerk 1)', 'Dawn Stone, Dusk Stone, Shiny Stone, Ice Stone'),
    ('Konikoni City (clerk 2)', 'PP Max, Heart Scale, Electirizer, Magmarizer, Protector, Dragon Scale, Razor Claw, Razor Fang'),
    ('Tapu Village (Pokémon Center)', 'TM26 Earthquake, TM75 Swords Dance, TM50 Overheat, TM94 Surf, TM98 Waterfall, TM97 Dark Pulse, TM60 Aura Sphere, TM92 Trick Room'),
    ('Mount Hokulani (Pokémon Center)', 'Terrain Extender, Thick Club, Light Ball, Stick, Bottle Cap, Gold Bottle Cap'),
    ('Battle Royal Dome, vendor 1 (BP)', 'Eviolite, Choice Specs, Choice Band, Choice Scarf, Assault Vest, Rocky Helmet, Flame Orb, Toxic Orb'),
    ('Battle Royal Dome, vendor 2 (BP)', 'Red Card, Eject Button, Flying Gem, Normal Gem, White Herb, Power Herb, Focus Sash'),
    ('Battle Royal Dome, vendor 3 (BP)', 'Bright Powder, Black Sludge, Soothe Bell, Scope Lens, Leftovers, Life Orb, Muscle Band, Wise Glasses, Expert Belt, Zoom Lens, Metronome, Destiny Knot, Icy Rock, Smooth Rock, Heat Rock, Damp Rock, Float Stone, Binding Band'),
]
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
    ('One-use items', ['Focus Sash', 'Power Herb', 'White Herb', 'Mental Herb', 'Red Card', 'Eject Button', 'Air Balloon',
                       'Absorb Bulb', 'Cell Battery', 'Luminous Moss', 'Snowball', 'Weakness Policy', 'Electric Seed',
                       'Grassy Seed', 'Misty Seed', 'Psychic Seed', 'Normal Gem', 'Flying Gem']),
    ('Pokémon-specific', ['Light Ball', 'Thick Club', 'Stick', 'Metal Powder', 'Quick Powder', 'Lucky Punch', 'Soul Dew']),
    ('Silvally Memories, Genesect Drives', []),                         # every Memory and Drive
    ('Other held items', []),                                           # the rest: Everstone, Destiny Knot, Amulet Coin...
]
KEY_ALSO = {'Exp. Share'}                                               # in Key Items, not repeated in Held Items
KEY_KEEP = {
    'Exp. Share', 'Ride Pager', 'Z-Power Ring', 'Sparkling Stone', 'Gracidea', "Ilima's Normalium Z",
    'Orange Petal', 'Left Poké Ball', 'Oval Charm', 'Reveal Glass', 'Shiny Charm', 'Fishing Rod', 'Red Petal',
    'Blue Petal', 'Forage Bag', 'Green Petal', 'DNA Splicers', 'Prison Bottle', "Professor's Mask", 'Yellow Petal', 'Zygarde Cube',
    'Pink Petal', 'Rainbow Flower', 'Moon Flute', 'Sun Flute', 'N-Lunarizer', 'N-Solarizer', 'Key Stone', 'Purple Petal',
}
KINDS = ['Poké Balls', 'Healing and repels', 'Evolution items', 'Power items', 'Held items', 'Stats and abilities', 'TMs', 'Other']
BIG = 10 ** 4


def where(rows):
    out = []
    for r in rows:
        loc, m = r['location'], r['method']
        if m == 'field':
            out.append(loc)
        elif m == 'Wild Encounter':
            out.append(f'held by wild {loc}')
        elif m == 'Shop':
            out.append(f'{loc} shop')
        else:
            out.append(f'{loc} ({m})' if loc and loc != m else m)
    return '; '.join(dict.fromkeys(out))


def shops_of(name):
    return [s for s, its in SHOPS if name in its.split(', ')]


def tier_of(name):
    return next((t for t, its in TRIALS if name in re.sub(r' \(.*\)', '', its).split(', ')), None)


def trials_text(t):
    return 'from the start' if t == 'None' else f'after {t.lower()} trial{"s" if t != "One" else ""}'


def compact(rs, name):
    """[(label, [places])] for the Found / Wild / Also / Shop lines."""
    found, wild, other, shop = [], [], [], []
    for r in rs:
        loc, m = r['location'], r['method']
        if m == 'field':
            found.append(loc)
        elif m == 'Wild Encounter':
            wild.append(loc)
        elif m == 'Shop':
            shop.append('Battle Tree (BP)')
        else:
            other.append(f'{loc} ({m})' if loc and loc != m else m)
    shop += [re.sub(r' \((.*)\)', r', \1', s).replace('Pokémon Center', 'PC') for s in shops_of(name)]
    t = tier_of(name)
    if t:
        shop.append('PC, left clerk' + ('' if t == 'None' else f' ({trials_text(t)})'))
    return [(lab, list(dict.fromkeys(xs))) for lab, xs in (('Found', found), ('Wild', wild), ('Also', other), ('Shop', shop)) if xs]


def lines(parts):
    return '\n'.join(f'{lab}: ' + ', '.join(xs) for lab, xs in parts)


def build(D):
    allrows = list(csv.DictReader(open(os.path.join(SRC, 'item-locations.csv'), encoding='utf-8')))
    rows = [r for r in allrows if r['method'] != 'Shop' or r['location'] == 'Battle Tree']
    MI, P = D['_MI'], D['P']
    dexj = load('dex-rebalanced.json')
    tms = dexj['tms']
    stone = {m['item']: D['_spec'][(s['id'], m['form'])] for s in dexj['species'] for m in s.get('mega', []) if m.get('item')}
    CAT, CATS, BY = {}, {}, OrderedDict()      # CATS: some items are in two lists (King's Rock: hold and evolution)
    for r in allrows:                           # an item's kind from every row (Ice Heal is only in vanilla marts)
        CAT[r['item']] = r['category']
    for r in rows:                              # the boxes from the rows kept
        CATS.setdefault(r['item'], set()).add(r['category'])
        BY.setdefault(r['item'], []).append(r)
    # Mega pages name their stone, with no place: the stones are generated in
    of = lambda cat: [n for n, cs in CATS.items() if cat in cs]
    for item in of('Mega Stone'):
        m = D['_byid'].get(stone.get(item))
        if m:
            m['stone'] = item
        else:
            report('  mega stone with no Mega in the dex:', item)
    for p in P:
        if p['g'] == 1 and not p.get('stone') and 'Rayquaza' not in p['n'] and 'Primal' not in p['n']:
            report('  Mega with no stone:', p['n'])
    EVO = set(of('Evolutionary Items'))
    in_shops = [it for _, its in SHOPS for it in its.split(', ')]

    def held_class(n):
        if n.endswith(' Plate'):
            return 'Type boosters'
        if n.endswith(' Memory') or n.endswith(' Drive'):
            return 'Silvally Memories, Genesect Drives'
        return next((c for c, xs in HELD if n in xs), 'Other held items')

    held = [n for n in of('Hold Items') if n not in EVO and n not in POWER and n not in KEY_ALSO]
    held += [x for _, xs in HELD for x in xs if x not in held and x in in_shops]   # shop-only (Flying Gem...)
    statn = {x for _, xs in STATS for x in xs}

    def kind(n):
        c = CAT.get(n, '')
        if n.startswith('TM'):
            return 'TMs'
        if n in POWER:
            return 'Power items'
        if n in EVO:
            return 'Evolution items'
        if c.endswith('Balls'):
            return 'Poké Balls'
        if c == 'Recovery Items' or n in ('Repel', 'Super Repel', 'Max Repel', 'Escape Rope', 'Sacred Ash'):
            return 'Healing and repels'
        if n in statn:
            return 'Stats and abilities'
        if n in held or c == 'Hold Items':
            return 'Held items'
        return 'Other'

    az = lambda xs: sorted(xs, key=str.casefold)
    D['_itp'], D['_itc'], D['_BY'] = {}, {}, BY

    def row(n, sub=None):
        rs = BY.get(n, [])
        D['_itp'][n] = '; '.join(x for x in [where(rs)] + [s + ' shop' for s in shops_of(n)] if x)
        D['_itc'][n] = compact(rs, n)
        r = [n, lines(D['_itc'][n]), None, 0]
        return r + [sub] if sub else r

    IT = []
    # Shops: a row per item under its kind, every shop that sells it on its own line
    by_item = OrderedDict()
    for s, its in SHOPS:
        for it in its.split(', '):
            by_item.setdefault(it, []).append(re.sub(r' \((.*)\)', r' · \1', s))
    for t, its in TRIALS:
        for it in re.sub(r' \(.*\)', '', its).split(', '):
            by_item.setdefault(it, []).append(f'Pokémon Center, left clerk ({trials_text(t)})')
    names = az(by_item)
    IT.append({'n': 'Shops', 'k': 'gen', 'note': 'From the Vendor Changes doc. Every Pokémon Center\'s left clerk sells more as you clear trials.',
               'r': [[n, '\n'.join(by_item[n]), None, 0, k] for k in KINDS for n in names if kind(n) == k]})
    # TMs: the hack's moves (game order in order())
    tmr = []
    for n in range(1, 101):
        tm = f'TM{n:02d}'
        mv = tms[tm]
        src = next((v for k, v in BY.items() if k.startswith(tm + ' ')), [])
        old = next((k[5:] for k in BY if k.startswith(tm + ' ')), mv)
        txt = where(src) or '?'
        shop = next((s for s, items in SHOPS if f'{tm} ' in items), None)
        if shop:
            txt += f'; {shop} shop'
        if old != mv:
            txt = f'Was {old} in Ultra Sun. ' + txt
        tmr.append([f'{tm} {mv}', txt, MI.get(mv), 0])
    IT.append({'n': 'TMs', 'k': 'tm', 'note': 'TM59, TM60, TM67, TM79 and TM100 teach new moves in Photonic Sun (Move Changes doc).', 'r': tmr})
    IT.append({'n': 'Z-Crystals', 'k': 'gen', 'note': '', 'r': [[n, '; '.join([where(BY[n])] + [s + ' shop' for s in shops_of(n)]), None, 0] for n in of('Z Crystals')]})
    IT.append({'n': 'Evolution Items', 'k': 'gen', 'note': '', 'r': [row(n) for n in az(EVO)]})
    IT.append({'n': 'Held Items', 'k': 'gen', 'note': 'Sorted by what they do. Evolution items and Power items have their own boxes.',
               'r': [row(n, c) for c, _ in HELD for n in az(n for n in held if held_class(n) == c)]})
    IT.append({'n': 'Stats and Abilities', 'k': 'gen', 'note': 'Vitamins, wings, Power items, Hyper Training, Ability Capsule, PP and levels.',
               'r': [row(n, g) for g, xs in STATS for n in xs]})
    key_items = of('Key Items')
    report('key items removed:', ', '.join(n for n in key_items if n not in KEY_KEEP))
    IT.append({'n': 'Key Items', 'k': 'gen', 'note': '', 'r': [row(n) for n in key_items if n in KEY_KEEP]})
    D['IT'] = IT


def order(D):
    """After walk.py: Key Items, Stats and Abilities (inside each sub-heading), TMs and Z-Crystals in game order = the
    walkthrough stop of the earliest place the item can be had (wild holders count where they live, shops where they
    stand, the left clerk by trials; no place last, ties A to Z); Found places in game order on every compact row."""
    from walk import same, ITEM_ALIAS
    stops = [s['n'] for sp in D['WK']['splits'] for s in sp['st']]

    def stop_of(loc):
        loc = loc.split(' - ')[0].replace(' PokéMart', '').replace(' shop', '')
        loc = re.sub(r' \(.*\)$', '', ITEM_ALIAS.get(loc, loc))
        return next((i for i, s in enumerate(stops) if same(loc, s)), None)

    sp = {}
    for p in D['P']:
        ix = [i for i in (stop_of(D['AR'][w[0]]['n']) for w in p.get('w', []) if w[1] not in ('Gift', 'Trade')) if i is not None]
        if ix:
            sp[p['n']] = min(ix)
    shopstop = {s: stop_of(s.split(' (')[0].split(',')[0]) for s, _ in SHOPS}
    shopstop['Battle Tree'] = stop_of('Battle Tree')
    tier = {t: i for i, (t, _) in enumerate(TRIALS)}

    def score(n):
        c = []
        for r in D['_BY'].get(n, []):
            m = r['method']
            c.append(stop_of(r['location']) if m == 'field' else sp.get(r['location']) if m == 'Wild Encounter'
                     else shopstop.get(r['location']) if m == 'Shop' else None)
        c += [shopstop[s] for s in shops_of(n)]
        t = tier_of(n)
        if t:
            c.append(tier[t] * 8)
        c = [x for x in c if x is not None]
        return min(c) if c else BIG

    def row_score(r):
        c = [stop_of(x) for x in (re.sub(r'^Was .*?\. ', '', x.strip()) for x in r[1].split(';')) if x and not x.startswith('held by')]
        c = [x for x in c if x is not None]
        return min(c) if c else BIG

    subs = [g for g, _ in STATS]
    for sec in D['IT']:
        if sec['n'] != 'Shops':
            for r in sec['r']:
                parts = D['_itc'].get(r[0])
                if parts is not None:
                    r[1] = lines([(lab, sorted(xs, key=lambda x: (stop_of(x) is None, stop_of(x) or 0)) if lab == 'Found' else xs) for lab, xs in parts])
        if sec['n'] in ('Key Items', 'Stats and Abilities'):
            sec['r'].sort(key=lambda r: (subs.index(r[4]) if len(r) > 4 else 0, score(r[0]), r[0].casefold()))
            late = [r[0] for r in sec['r'] if score(r[0]) == BIG]
            if late:
                report(f'  {sec["n"]} with no place (listed last):', ', '.join(late))
        elif sec['n'] in ('TMs', 'Z-Crystals'):
            sec['r'].sort(key=lambda r: (row_score(r), r[0]))
    report('items:', ', '.join(f"{s['n']} {len(s['r'])}" for s in D['IT']))

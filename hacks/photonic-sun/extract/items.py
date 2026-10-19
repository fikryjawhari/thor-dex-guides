"""Stage 4: Items tab (IT) and the Mega stones' places (P.stone, P.sloc).

Overworld items are vanilla (SOURCES.md: the hack's zone scripts are byte-identical to Ultra Sun's), so places come
from Serebii's Ultra Sun lists (item-locations.csv). Marts are the hack's own (Vendor Changes.pdf, transcribed in
SHOPS); Serebii's vanilla mart rows are dropped, except the Battle Tree's BP shop, which the doc doesn't change.
The five changed TMs teach the hack's move (code.ips, via dex-rebalanced.json's TM list).
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
SECTIONS = [('TMs', 'tm', 'TMs'), ('Mega Stones', 'mega', 'Mega Stone'), ('Z-Crystals', 'gen', 'Z Crystals'),
            ('Evolution Items', 'gen', 'Evolutionary Items'), ('Held Items', 'gen', 'Hold Items'),
            ('Battle Items', 'gen', 'Battle Effect Items'), ('Vitamins', 'gen', 'Vitamins'),
            ('Fossils', 'gen', 'Fossils'), ('Key Items', 'gen', 'Key Items')]


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


def build(D):
    rows = list(csv.DictReader(open(os.path.join(SRC, 'item-locations.csv'), encoding='utf-8')))
    rows = [r for r in rows if r['method'] != 'Shop' or r['location'] == 'Battle Tree']
    MI, P = D['_MI'], D['P']
    dexj = load('dex-rebalanced.json')
    tms = dexj['tms']
    stone = {m['item']: D['_spec'][(s['id'], m['form'])] for s in dexj['species'] for m in s.get('mega', []) if m.get('item')}
    IT = []
    for name, kind, cat in SECTIONS:
        by = OrderedDict()
        for r in rows:
            if r['category'] == cat:
                by.setdefault(r['item'], []).append(r)
        sec = {'n': name, 'k': kind, 'note': '', 'r': []}
        if kind == 'tm':
            for n in range(1, 101):
                tm = f'TM{n:02d}'
                mv = tms[tm]
                src = next((v for k, v in by.items() if k.startswith(tm + ' ')), [])
                old = next((k[5:] for k in by if k.startswith(tm + ' ')), mv)
                txt = where(src) or '?'
                shop = next((s for s, items in SHOPS if f'{tm} ' in items), None)
                if shop:
                    txt += f'; {shop} shop'
                if old != mv:
                    txt = f'Was {old} in Ultra Sun. ' + txt
                sec['r'].append([f'{tm} {mv}', txt, MI.get(mv), 0])
            sec['note'] = 'TM59, TM60, TM67, TM79 and TM100 teach new moves in Photonic Sun (Move Changes doc).'
        else:
            for item, rs in by.items():
                link = None
                if kind == 'mega':
                    m = D['_byid'].get(stone.get(item))
                    if m:
                        link = m['id']
                        m['stone'], m['sloc'] = item, where(rs)
                    else:
                        report('  mega stone with no Mega in the dex:', item)
                sec['r'].append([item, where(rs), link, 0])
            for s, items in SHOPS:
                for it in items.split(', '):
                    hit = next((r for r in sec['r'] if r[0] == it), None)
                    if hit:
                        hit[1] = (hit[1] + '; ' if hit[1] else '') + s + ' shop'
        if sec['r']:
            IT.append(sec)
    shops = {'n': 'Shops', 'k': 'gen', 'note': 'From the Vendor Changes doc. Every Pokémon Center\'s left clerk sells more as you clear trials.', 'r': []}
    for t, items in TRIALS:
        shops['r'].append([f'Trials completed: {t}', ('+ ' if t != 'None' else '') + items, None, 0, 'Pokémon Center marts (left clerk)'])
    for s, items in SHOPS:
        shops['r'].append([s.split(' (')[0].split(',')[0], items, None, 0, s])
    IT.insert(0, shops)
    D['IT'] = IT
    for p in P:
        if p['g'] == 1 and not p.get('stone') and 'Rayquaza' not in p['n'] and 'Primal' not in p['n']:
            report('  Mega with no stone place:', p['n'])
    report('items:', ', '.join(f"{s['n']} {len(s['r'])}" for s in IT))

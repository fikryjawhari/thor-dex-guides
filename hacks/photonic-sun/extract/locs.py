"""Stage 2: wild encounters, statics, gifts and trades (LOC, AR, P.w, P.g).

Rates, slots and levels come from the game's tables (dex-rebalanced.json encounters). Gen 7 tables carry no method,
and one game area holds a copy of the table for every grass patch or fishing spot, so identical tables are merged
and each one is labelled from "Wild Pokemon Locations.pdf": the PDF is read by word position (area titles are the
18 pt lines; a table is a bold heading, a bold "Levels: a-b" line and the species in its first column), and each
game table takes the PDF table with the same level range and the most species in common, preferring tables under
an area title that matches the game area's name. A fishing table whose levels run higher than the PDF's is the
bubbling spot. Tables that differ by day and night become two methods ("Grass 1 (day)" / "(night)").

Areas (the tracker's slots) are the PDF's area titles in its order ("roughly the order they become accessible"),
plus Iki Town for the starter and the places of the Special Encounters doc that have no wild table. SPECIALS is
Special Encounters.pdf transcribed by hand (its tables don't survive text extraction); the trades' "you give"
Pokemon are from Bulbapedia's In-game trade page (the hack keeps the species, the doc only lists the new levels).
"""
import re
from collections import Counter, defaultdict
import pdfplumber
from common import SRC, load, norm, report

STARTERS = [('Rowlet', 5), ('Litten', 5), ('Popplio', 5)]
# (area, method, species, level, note)
SPECIALS = [
    # Island Scan: one Pokemon per island per weekday (Special Encounters.pdf)
    *[(a, f'Island Scan ({d})', s, l, f'Island Scan on {d}s' + (f'; knows {m}' if m else '')) for d, s, l, a, m in [
        ('Sunday', 'Bagon', 14, 'Route 3', 'Dragon Dance, Fire Fang'), ('Monday', 'Dratini', 16, 'Seaward Cave', 'Aqua Jet, Extreme Speed'),
        ('Tuesday', 'Jirachi', 18, 'Ten Carat Hill', 'Heart Stamp'), ('Wednesday', 'Manaphy', 25, "Kala'e Bay", ''),
        ('Thursday', 'Beldum', 10, "Hau'oli City", 'Hold Back, Zen Headbutt, Iron Head, Iron Defense'),
        ('Friday', 'Torchic', 10, 'Route 2', 'Baton Pass'), ('Saturday', 'Honedge', 10, "Hau'oli Cemetery", 'Destiny Bond, Wide Guard'),
        ('Sunday', 'Bisharp', 25, 'Route 6', 'Psycho Cut, Revenge'), ('Monday', 'Keldeo', 25, 'Route 7', ''),
        ('Tuesday', 'Volcarona', 35, 'Route 8', 'Incinerate, Struggle Bug'), ('Wednesday', 'Mew', 40, 'Akala Outskirts', ''),
        ('Thursday', 'Braviary', 25, 'Route 4', 'Superpower'), ('Friday', 'Mandibuzz', 25, 'Route 5', 'Bone Rush'),
        ('Saturday', 'Greninja', 20, 'Brooklet Hill', ''), ('Sunday', 'Volcanion', 55, 'Blush Mountain', ''),
        ('Monday', 'Marshadow', 60, 'Tapu Village', ''), ('Tuesday', 'Meloetta', 60, 'Routes 15 and 16', ''),
        ('Wednesday', 'Floette', 60, "Ula'ula Meadow", 'Light of Ruin'), ('Thursday', 'Victini', 50, 'Route 10', 'V-create, Blue Flare, Bolt Strike, Glaciate'),
        ('Friday', 'Celebi', 50, 'Route 11', 'Nasty Plot, Leaf Storm'), ('Saturday', 'Darkrai', 60, 'Mount Hokulani', 'Roar of Time, Spacial Rend'),
        ('Sunday', 'Stakataka', 100, 'Poni Grove', ''), ('Monday', 'Genesect', 100, 'Poni Plains', 'Extreme Speed, Blaze Kick, Shift Gear'),
        ('Tuesday', 'Arceus', 100, 'Poni Gauntlet', 'Roar of Time, Spacial Rend, Shadow Force'), ('Wednesday', 'Deoxys', 100, 'Poni Meadow', 'Nasty Plot, Dark Pulse'),
        ('Thursday', 'Shaymin', 80, 'Exeggutor Island', 'Celebrate'), ('Friday', 'Zeraora', 80, 'Poni Wilds', ''),
        ('Saturday', 'Hoopa', 80, 'Ancient Poni Path', '')]],
    # Ultra Wormhole legendaries: the doc's Photonic Sun additions, plus the Ultra Sun ones it moves to Prismatic Moon
    *[('Ultra Space Wilds', f'Ultra Wormhole ({c})', s, '', n) for c, s, n in [
        ('Red', 'Ho-Oh', ''), ('Red', 'Thundurus', 'replaces Yanmega'), ('Red', 'Tornadus', ''), ('Red', 'Yveltal', 'replaces Swanna'),
        ('Green', 'Dialga', ''), ('Green', 'Zekrom', 'replaces Audino'), ('Green', 'Reshiram', ''), ('Green', 'Entei', 'replaces Heliolisk'),
        ('Green', 'Raikou', ''), ('Green', 'Xerneas', ''), ('Green', 'Pheromosa', 'replaces Grumpig'), ('Green', 'Buzzwole', ''),
        ('Yellow', 'Celesteela', 'replaces Abomasnow'), ('Yellow', 'Kartana', ''), ('Yellow', 'Groudon', ''), ('Yellow', 'Regigigas', 'replaces Crustle'),
        ('Yellow', 'Heatran', ''), ('Yellow', 'Palkia', 'replaces Magcargo'), ('Blue', 'Latias', 'replaces Lombre'), ('Blue', 'Latios', ''),
        ('Blue', 'Kyogre', 'replaces Stunfisk'), ('Blue', 'Lugia', 'replaces Floatzel')]],
    # Gifts
    *[('Route 8', 'Gift (fossil)', s, 30, f'Restore a {f} at the Fossil Restoration Center; holds {i}') for s, i, f in [
        ('Omanyte', 'Dome Fossil', 'Helix Fossil'), ('Kabuto', 'Helix Fossil', 'Dome Fossil'), ('Aerodactyl', '', 'Old Amber'),
        ('Lileep', 'Claw Fossil', 'Root Fossil'), ('Anorith', 'Root Fossil', 'Claw Fossil'), ('Cranidos', 'Armor Fossil', 'Armor Fossil'),
        ('Shieldon', 'Skull Fossil', 'Skull Fossil'), ('Tirtouga', 'Plume Fossil', 'Cover Fossil'), ('Archen', 'Cover Fossil', 'Plume Fossil'),
        ('Tyrunt', 'Sail Fossil', 'Jaw Fossil'), ('Amaura', 'Jaw Fossil', 'Sail Fossil')]],
    ('Paniola Ranch', 'Gift (egg)', 'Togepi', 1, 'Egg from the Pokémon Nursery; knows Extrasensory'),
    ('Aether Paradise', 'Gift', 'Porygon', 90, 'Holds an Up-Grade'),
    ('Ancient Poni Path', 'Gift', 'Type: Null', 90, ''),
    ('Altar of the Sunne', 'Gift', 'Cosmog', 5, 'The doc says "Reverse World Altar"'),
    ('Seafolk Village', 'Gift', 'Aerodactyl', 75, 'Holds an Aerodactylite'),
    ('Heahea City', 'Gift', 'Pikachu', 90, 'Holds a Gold Bottle Cap; knows Surf'),
    ('Ultra Megalopolis', 'Gift', 'Poipole', 70, ''),
    ('Routes 15 and 16', 'Gift', 'Zygarde (50%)', 80, 'Assembled from Zygarde Cells'),
    *[('Heahea Beach', 'Gift (totem)', s, l, 'Totem-sized, from Dexio and Sina for Totem Stickers') for s, l in [
        ('Gumshoos', 25), ('Marowak (Alola)', 40), ('Araquanid', 40), ('Lurantis', 50), ('Salazzle', 50), ('Vikavolt', 65),
        ('Togedemaru', 65), ('Mimikyu', 70), ('Ribombee', 100), ('Kommo-o', 100)]],
    # Not in the doc: "Legendary Pokemon that are not listed here can be found in their usual locations within the
    # games, but at higher levels", so these are Ultra Sun's places (levels unknown)
    *[('Ultra Space Wilds', 'Ultra Wormhole', s, '', 'Usual Ultra Sun place (the doc only says higher levels)') for s in [
        'Articuno', 'Zapdos', 'Moltres', 'Mewtwo', 'Suicune', 'Regirock', 'Regice', 'Registeel', 'Rayquaza', 'Uxie',
        'Mesprit', 'Azelf', 'Giratina (Altered)', 'Cresselia', 'Cobalion', 'Terrakion', 'Virizion',
        'Landorus (Incarnate)', 'Kyurem']],
    *[(a, 'Static', s, '', 'Usual Ultra Sun place, after the story (the doc only says higher levels)') for a, s in [
        ('Ruins of Conflict', 'Tapu Koko'), ('Ruins of Life', 'Tapu Lele'), ('Ruins of Abundance', 'Tapu Bulu'),
        ('Ruins of Hope', 'Tapu Fini'), ('Ultra Megalopolis', 'Necrozma'), ('Ultra Space Wilds', 'Nihilego'),
        ('Ultra Space Wilds', 'Xurkitree'), ('Ultra Space Wilds', 'Guzzlord')]],
    ('Paniola Ranch', 'Breed', 'Phione', 1, 'Hatches from an Egg of Manaphy (Island Scan)'),
    ('Any Pokémon Center', 'Gift (QR code)', 'Magearna', '', 'Scan the QR code from the Special Encounters doc, then visit a Pokémon Center after the story'),
    # In-game trades (levels and items from the doc, the Pokemon you give from Bulbapedia)
    *[(a, 'Trade', s, l, f'For {g}') for a, s, l, g in [
        ('Route 2', 'Hawlucha', 10, 'Spearow'), ('Route 5', 'Noibat', 25, 'Lillipup'), ('Royal Avenue', 'Barboach', 30, 'Tentacool'),
        ('Route 8', 'Arbok', 38, 'Trumbeak'), ('Tapu Village', 'Phantump', 60, 'Phantump'), ('Seafolk Village', 'Shellos', 80, 'Granbull'),
        ('Poni Gauntlet', 'Tauros', 100, 'Bewear')]],
]
TRADE_ITEMS = {'Hawlucha': 'Liechi Berry', 'Noibat': 'Dawn Stone', 'Barboach': 'Dusk Stone', 'Arbok': 'Shiny Stone',
               'Phantump': 'Custap Berry', 'Shellos': 'Focus Sash', 'Tauros': 'Life Orb'}
# Areas with no wild table, and where they go in the area order (before the named PDF area; None = at the end)
EXTRA_BEFORE = {'Iki Town': 'Route 1', 'Heahea City': 'Route 4', 'Heahea Beach': 'Route 4', 'Royal Avenue': 'Route 6',
                'Aether Paradise': "Ula'ula Island", 'Ruins of Conflict': None, 'Ruins of Life': None,
                'Ruins of Abundance': None, 'Ruins of Hope': None, 'Ultra Megalopolis': None, 'Altar of the Sunne': None,
                'Ultra Space Wilds': None, 'Any Pokémon Center': None}
ISLANDS = {'Melemele Island', 'Akala Island', "Ula'ula Island", 'Poni Island'}
GENERIC = {'route', 'routes', 'and', 'poni', 'city', 'town', 'island', 'the', 'of', 'mount'}  # too common to match on
TITLE_FIX = {"Ula'Ula Meadow": "Ula'ula Meadow", 'Route 15/ 16': 'Routes 15 and 16', "Trainer's School": "Trainers' School"}
ALIAS = {'Mount Lanakila': ' Victory Road'}  # game area name -> PDF titles its tables sit under


def sk(name):
    """Species key for PDF matching: the PDF splits names into words and drops gender signs, so the first word."""
    return norm(name.split()[0].replace('♀', '').replace('♂', ''))


def pdf_tables():
    """[{title, head, lo, hi, sp:set}] in document order, and the area titles in order."""
    pdf = pdfplumber.open(f'{SRC}/Wild Pokemon Locations.pdf')
    tabs, titles, title = [], [], ''
    for pg in pdf.pages[2:]:
        ws = pg.extract_words(extra_attrs=['size', 'fontname'])
        bold = lambda w: 'Bold' in w['fontname']
        lines = defaultdict(list)
        for w in ws:
            if round(w['size']) == 18:
                lines[round(w['top'])].append(w)
        tl = [(t, ' '.join(w['text'] for w in sorted(lines[t], key=lambda w: w['x0']))) for t in sorted(lines)]
        tl = [(t, re.sub(r"Hau’ oli", "Hau’oli", n).replace('’', "'")) for t, n in tl]
        tl = [(t, TITLE_FIX.get(n, n)) for t, n in tl]
        for t, n in tl:
            if n not in titles and n not in ISLANDS:
                titles.append(n)
        lv = sorted((w for w in ws if w['text'] == 'Levels:' or w['text'].startswith('Levels:')), key=lambda w: (round(w['top']), w['x0']))
        # Weather SOS tables have no levels line: anchor them on their heading's first word instead
        wx = [w for w in ws if bold(w) and w['text'] in ('Weather', 'Rain') and any(
            x['text'] == 'SOS' and abs(x['top'] - w['top']) < 3 and 0 < x['x0'] - w['x0'] < 70 for x in ws)]
        for w in wx:
            sp, top = [], w['top']
            for x in sorted(ws, key=lambda x: x['top']):
                if x['top'] <= top + 5 or abs(x['x0'] - w['x0']) > 3 or round(x['size']) != 12:
                    continue
                if bold(x):
                    if x['text'] != 'Species':
                        break
                    top = x['top']
                    continue
                if x['top'] - top > 30:
                    break
                sp.append(x['text'])
                top = x['top']
            ttl = [n for t, n in tl if t < w['top']]
            tabs.append({'title': ttl[-1] if ttl else title, 'head': w['text'] + ' SOS', 'lo': 0, 'hi': 0,
                         'sp': {sk(x) for x in sp if not x[0].isdigit()}})
        for w in lv:
            m = re.search(r'(\d+)\s*-\s*(\d+)', ' '.join(x['text'] for x in ws if abs(x['top'] - w['top']) < 3 and 0 <= x['x0'] - w['x0'] < 70))
            if not m:
                continue
            nxt = min([x['x0'] for x in lv if abs(x['top'] - w['top']) < 3 and x['x0'] > w['x0'] + 5] + [9999])
            hw, end = [], w['x0']
            for x in sorted(ws, key=lambda x: x['x0']):  # the heading's words, up to a wide gap or the next table
                if bold(x) and 8 < w['top'] - x['top'] < 20 and w['x0'] - 3 <= x['x0'] < nxt - 3 and round(x['size']) == 12:
                    if hw and x['x0'] - end > 25:
                        break
                    hw.append(x['text'])
                    end = x['x1']
            head = ' '.join(hw)
            sp, top = [], w['top']
            for x in sorted(ws, key=lambda x: x['top']):
                if x['top'] <= top + 5 or abs(x['x0'] - w['x0']) > 3 or round(x['size']) != 12:
                    continue
                if bold(x):
                    if x['text'] != 'Species':
                        break
                    top = x['top']
                    continue
                if x['top'] - top > 30:
                    break
                sp.append(x['text'])
                top = x['top']
            ttl = [n for t, n in tl if t < w['top']]  # a table above the page's first title is the previous area's
            if ttl:
                title = ttl[-1]
            tabs.append({'title': title, 'head': head or '?', 'lo': int(m.group(1)), 'hi': int(m.group(2)), 'sp': {sk(x) for x in sp}})
        if tl:
            title = tl[-1][1]
    return tabs, titles


def build(D):
    P, spec, byid = D['P'], D['_spec'], D['_byid']
    H = load('dex-rebalanced.json')
    sid = {s['name']: s['id'] for s in H['species'] if not s['form']}
    tabs, titles = pdf_tables()
    report('wild PDF:', len(tabs), 'tables under', len(titles), 'area titles')
    areas = []
    for t in titles:
        areas.append(t)
    for a, before in EXTRA_BEFORE.items():
        if a in areas:
            continue
        if before in areas:
            areas.insert(areas.index(before), a)
        elif before and before in ISLANDS:
            nxt = {'Akala Island': 'Route 4', "Ula'ula Island": 'Malie City', 'Poni Island': 'Seafolk Village'}[before]
            areas.insert(areas.index(nxt), a)
        else:
            areas.append(a)
    for a, *_ in SPECIALS:
        if a not in areas:
            report('special encounter area not in the PDF, added at the end:', a)
            areas.append(a)
    A = {a: i for i, a in enumerate(areas)}
    W = defaultdict(list)  # pid -> w rows

    def pid_of(name, form=0):
        if name in byid:
            return name
        if (sid.get(name), form) in spec:
            return spec[(sid[name], form)]
        for p in P:
            if p['n'] == name:
                return p['id']
        report('species not found:', name)
        return None

    def toks(s):
        return set(re.findall(r'[a-z]+|\d+', s.lower().replace("'", '').replace('’', '')))

    # Game tables: merge day/night and duplicates, then label
    used, SOS, LAB = Counter(), defaultdict(set), []
    for ga in H['encounters']:
        uniq = {}
        for t in ga['tables']:
            agg = Counter()
            for sp, f, r in t['slots']:
                agg[(sp, f)] += r
            key = (t['levels'][0], t['levels'][1], tuple(sorted(agg.items())))
            u = uniq.setdefault((t['table'],), {})
            u[t['time']] = key
        groups = {}
        for (tn,), tm in uniq.items():
            k = (tm.get('day'), tm.get('night'))
            groups.setdefault(k, []).append(tn)
        gtoks = toks(ga['location'].replace('Poni Breaker', 'Ponibreaker') + ALIAS.get(ga['location'], ''))
        labelled = []
        for (dk, nk), tns in groups.items():
            lo, hi = dk[0], dk[1]
            species = {sk(s) for (s, f), r in dk[2]} | {sk(s) for (s, f), r in nk[2]}
            # A table under a matching area title sharing at least half its species, else an exact copy found
            # elsewhere; the rest are the game's leftover placeholder tables (Route 1 copies at level 2-3 and the like
            # in zones with no wild Pokemon) and are left out.
            best, bs = None, -99
            for i, pt in enumerate(tabs):
                ov = len(species & pt['sp'])
                tt = toks(pt['title']) - GENERIC
                if tt and tt <= gtoks and ov * 2 >= len(species) and (ov >= 2 or len(species) == 1):
                    sc = ov * 3 - len(species ^ pt['sp']) + (6 if (pt['lo'], pt['hi']) == (lo, hi) else 2 if pt['lo'] == lo else -4)
                    if sc > bs:
                        best, bs = i, sc
            if best is None:
                best = next((i for i, pt in enumerate(tabs) if pt['sp'] == species and (pt['lo'], pt['hi']) == (lo, hi)), None)
            sos = {s for t in ga['tables'] if t['table'] in tns for s in t.get('sos', [])}
            if best is None and species == {'crabrawler'}:
                ttl = next((t for t in titles if toks(t) - GENERIC and toks(t) - GENERIC <= gtoks), None)
                if ttl:
                    labelled.append((ttl, 'Berry Piles', dk, nk, sos))
                    LAB.append((ga, tns, ttl, 'Berry Piles', dk, nk, 9999))
                    continue
            if best is None:
                report('  wild table left out (no PDF table in its area):', ga['location'], f'{lo}-{hi}', sorted(species))
                continue
            pt = tabs[best]
            used[best] += 1
            head = pt['head']
            if head.startswith('Fishing') and hi > pt['hi']:
                head += ' (bubbling)'
            elif len(species) <= 5 and species - pt['sp'] and not head.startswith(('Fishing', 'Surfing')):
                head = 'Ambush Encounters'  # shaking grass and trees: small tables the PDF doesn't always list
            elif pt['sp'] != species:
                report(f"  table differs from the PDF: {ga['location']} {lo}-{hi} as {pt['title']} / {head}: game only",
                       sorted(species - pt['sp']), 'PDF only', sorted(pt['sp'] - species))
            labelled.append((pt['title'], head, dk, nk, sos))
            LAB.append((ga, tns, pt['title'], head, dk, nk, best))
        # Same label, different content in one area: number them
        cnt = Counter((t, h) for t, h, *_ in labelled)
        seen = Counter()
        for title, head, dk, nk, sos in labelled:
            for s in sos:
                SOS[s].add((title, f'{dk[0]}-{dk[1]}'))
            if cnt[(title, head)] > 1:
                seen[(title, head)] += 1
                if seen[(title, head)] > 1:
                    report('  two different game tables labelled the same, numbered:', title, head)
                    head = f'{head} (spot {seen[(title, head)]})'
            if title not in A:
                report('PDF title not an area:', title)
                continue
            for when, key in (('', dk),) if dk == nk else (('day', dk), ('night', nk)):
                if not key:
                    continue
                for (sp, f), r in key[2]:
                    p = pid_of(sp, f)
                    if p:
                        lv = f'{key[0]}' if key[0] == key[1] else f'{key[0]}-{key[1]}'
                        W[p].append([A[title], head + (f' ({when})' if when else ''), f'{r}%', lv, ''])
    for i, pt in enumerate(tabs):
        if not used[i] and not pt['head'].startswith(('SOS', 'Weather', 'Rain')):
            report('  PDF table no game table matched:', pt['title'], pt['head'], pt['lo'], pt['hi'], sorted(pt['sp']))
    # Weather SOS tables (PDF only: the game keeps them elsewhere): these allies answer in rain, hail or sand
    for pt in tabs:
        if pt['head'].startswith(('Weather SOS', 'Rain SOS')) and pt['title'] in A:
            for s in pt['sp']:
                p = next((q['id'] for q in P if sk(q['n']) == s and q['g'] != 1 and not q.get('fc')), None)
                if p:
                    W[p].append([A[pt['title']], pt['head'], '', '', 'Answers SOS calls in rain, hail or sandstorm'])
    for s, l in STARTERS:
        W[pid_of(s)].append([A['Iki Town'], 'Starter choice', '', str(l), 'Choose one from Hala'])
    for a, m, s, l, n in SPECIALS:
        p = pid_of(s)
        if p:  # a trade's note ("For Spearow") is its label in the tracker; its item goes in the area note
            W[p].append([A[a], m, '', str(l), n])
    # Merge duplicate rows (same place, method, level) by adding rates
    for p in P:
        rows = {}
        for w in W.get(p['id'], []):
            k = (w[0], w[1], w[3], w[4])
            if k in rows and w[2]:
                rows[k][2] = f"{int(rows[k][2][:-1]) + int(w[2][:-1])}%"
            else:
                rows.setdefault(k, w)
        p['w'] = list(rows.values())
    D['LOC'] = areas
    D['AR'] = [{'n': a, 'l': [i]} | ({'ns': 1} if a == 'Any Pokémon Center' else {}) for i, a in enumerate(areas)]
    trade_notes = defaultdict(list)
    for a, m, s, l, n in SPECIALS:
        if m == 'Trade':
            trade_notes[a].append(f'{s} (traded for {n[4:]}) holds a {TRADE_ITEMS[s]}.')
    for a, ns in trade_notes.items():
        D['AR'][A[a]]['note'] = ' '.join(ns)
    D['AR'][A['Ultra Space Wilds']]['note'] = ('Legendaries from the Special Encounters doc. The other Ultra Wormhole '
                                              'Pokémon are as in Ultra Sun.')
    availability(D)
    # SOS allies, for Pokemon with no other way in (Kantonian forms answer their Alolan forms' calls, and so on)
    added = []
    for p in P:
        if p['g'] == 3 and not p.get('fc'):
            names = {n for n in SOS if n == p['n'] or (p['dex'] == sid.get(n) and spec.get((sid[n], 0)) == p['id'])}
            for n in names:
                for title, lv in sorted(SOS[n]):
                    p['w'].append([A[title], 'SOS ally', '', lv, 'Answers a wild Pokémon\'s call for help'])
            if names:
                added.append(p['n'])
    report('found only as SOS allies:', ', '.join(added))
    availability(D)
    D['_LT'] = sections(LAB, A, pid_of, tabs)


# Small one-off methods that share one "Other" section (each keeps its own label inside it)
OTHER = ('Berry Piles', 'Ambush Encounters', 'Dust Clouds', 'Shadows', 'Rustling', 'Water Splashes', 'Wimpod')


def sections(LAB, A, pid_of, tabs):
    """Location sections (pass 2 preview, not shipped yet): {area index: {'s': [section], 'ws': [weather SOS allies]}}.
    A section is one game table (a grass patch, cave, building), or Water (Surfing + Fishing, bubbling as a second
    rate), or Other (berry piles, ambush, dust clouds...), or Special (gifts, trades, Island Scan). Rows carry
    [day, night] rates and the allies that Pokémon calls (other species or forms only)."""
    lv = lambda lo, hi: f'{lo}' if lo == hi else f'{lo}-{hi}'
    tabsof = lambda ga, tns: [t for t in ga['tables'] if t['table'] == tns[0]]
    seen, by = set(), defaultdict(list)  # (area, title, head) -> entries; identical tables in two game areas once
    for ga, tns, title, head, dk, nk, pi in LAB:
        if title not in A or (title, head, dk, nk) in seen:
            continue
        seen.add((title, head, dk, nk))
        by[(A[title], re.sub(r'^\d+', '', head).replace(' (bubbling)', ''))].append((ga, tns, dk, nk, pi))
    out = defaultdict(lambda: {'s': [], 'ws': []})

    def rows(ga, tns, dk, nk):
        allies = defaultdict(lambda: defaultdict(set))
        for t in tabsof(ga, tns):
            for (sp, f, r), al in zip(t['slots'], t.get('sosBy', [])):
                for a, af in al:
                    if (a, af) != (sp, f):
                        allies[(sp, f)][pid_of(a, af)].add(t['time'])
        rs = {}
        for when, key in (('day', dk), ('night', nk)):
            for (sp, f), r in (key or (0, 0, ()))[2]:
                p = pid_of(sp, f)
                if not p or not r:  # 0% slots (Poni Grove's Ultra Beasts) never appear
                    continue
                x = rs.setdefault(p, {'p': p, 'r': [0, 0]})
                x['r'][when == 'night'] += r
                al = [[a, '' if len(ts) == 2 else next(iter(ts))] for a, ts in allies[(sp, f)].items() if a and a != p]
                if al:
                    x['sos'] = al
        return list(rs.values())

    def merged(es):
        """One table in several patches: the copy in the most patches, plus what the others add."""
        es = sorted(es, key=lambda e: -len(e[1]))
        rs = rows(*es[0][:4])
        for e in es[1:]:
            have = {x['p'] for x in rs}
            for x in rows(*e[:4]):
                if x['p'] not in have:
                    x['note'] = 'Only in some patches'
                    rs.append(x)
        return rs

    for (a, head), es in sorted(by.items(), key=lambda kv: (kv[0][0], min(e[4] for e in kv[1]))):
        for ga, tns, *_ in es:
            for t in tabsof(ga, tns):
                for w in t.get('sosWeather', []):
                    p = pid_of(w)
                    if p and p not in out[a]['ws']:
                        out[a]['ws'].append(p)
        pi = min(e[4] for e in es)
        S = out[a]['s']
        m = re.match(r'(Surfing|Fishing)(.*)$', head)
        if m:
            name = 'Water' + m.group(2)
            sec = next((s for s in S if s['n'] == name), None) or (S.append({'n': name, 'k': 'water', 'g': []}) or S[-1])
            g = {'m': m.group(1), 'lv': '', 'rows': [], 'pi': pi}
            # Fishing: of the area's copies, the ones reaching the highest level are the bubbling spots (the PDF's
            # level ranges aren't always the game's, so they can't decide it)
            top = max(e[2][1] for e in es)
            fish = m.group(1) == 'Fishing' and len({e[2][1] for e in es}) > 1
            plain, bub = ([e for e in es if e[2][1] < top], [e for e in es if e[2][1] == top]) if fish else (es, [])
            g['rows'] = merged(plain)
            g['lv'] = lv(min(e[2][0] for e in plain), max(e[2][1] for e in plain))
            if bub:
                g['bl'] = lv(min(e[2][0] for e in bub), top)
                have = {x['p']: x for x in g['rows']}
                for x in merged(bub):
                    if x['p'] in have:
                        have[x['p']]['b'] = x['r']
                    else:
                        g['rows'].append({'p': x['p'], 'r': [0, 0], 'b': x['r']} | ({'sos': x['sos']} if 'sos' in x else {}))
            sec['g'].append(g)
            continue
        g = {'m': '', 'lv': lv(min(e[2][0] for e in es), max(e[2][1] for e in es)), 'rows': merged(es), 'pi': pi}
        if head.startswith(OTHER):
            sec = next((s for s in S if s['k'] == 'other'), None) or (S.append({'n': 'Other', 'k': 'other', 'g': []}) or S[-1])
            g['m'] = head
            sec['g'].append(g)
        else:
            S.append({'n': head, 'k': 'grass', 'g': [g]})
    for a, d in out.items():  # Water and Other after the land tables, Fishing before Surfing as in the docs
        d['s'].sort(key=lambda s: {'grass': 0, 'other': 1, 'water': 2}[s['k']])
        for s in d['s']:
            s['g'].sort(key=lambda g: (g['m'] == 'Surfing', g.get('pi', 0)))
            for g in s['g']:
                g.pop('pi', None)
    return dict(out)


def availability(D):
    """g: 0 found (any encounter, or in the evolution family of something found), 1 Mega/Primal, 3 not found.
    Form changes take their base form's value."""
    P, byid = D['P'], D['_byid']
    par = {p['id']: p['id'] for p in P}

    def f(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x
    for p in P:
        for _, t in p['ef'] + p['et']:
            par[f(p['id'])] = f(t)
    found = {f(p['id']) for p in P if p['w']}
    for p in P:
        if p['g'] == 1:
            continue
        p['g'] = 0 if f(p['id']) in found else 3
    for p in P:
        if p.get('fc'):
            b = next(q for q in P if q['dex'] == p['dex'] and not q.get('fc') and q['g'] != 1)
            p['g'] = b['g']
    report('obtainable', sum(p['g'] == 0 for p in P), 'not found', sum(p['g'] == 3 for p in P), ':',
           ', '.join(p['n'] for p in P if p['g'] == 3))

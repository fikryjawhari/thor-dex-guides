"""Locations (LOC, AR, P.w): the Locations pages, the tracker areas and each Pokemon's wild rows.

The game's encounter tables (dex-rebalanced.json) are the data. Wild Pokemon Locations.pdf names the areas and gives
their story order. Each doc title is one tracker area and one Locations page. Its game zones (floors, rooms) become
sections: Grass (walk encounters, flowers, Rough Terrain), Water (Surf and rods), Other (Rock Smash, hordes).
A location with several zones is matched to the doc's sub-areas (1F, B2F, Outside...) by species.
"""
import os, re

from common import SRC, load, fix, norm, report, text

GRASS = {'Grass', 'Yellow Flowers', 'Purple Flowers', 'Red Flowers', 'Rough Terrain'}
WATER = {'Surf', 'Old Rod', 'Good Rod', 'Super Rod'}
SECTIONS = [('grass', 'Grass'), ('water', 'Water'), ('other', 'Other')]
PDF_TABLE = re.compile(r'^(Grass|Yellow Flowers|Purple Flowers|Red Flowers|Rough Terrain|Snow|Cave|Surf|Rock Smash|'
                       r'Old Rod|Good Rod|Super Rod|Hordes)\b')
PDF_RATE = re.compile(r'([^,()]+?)\s*\((\d+)%\)')

# Gifts and one-offs that the docs name (the game's tables don't have them). Level '' = not in the docs.
STARTERS = ['Chespin', 'Fennekin', 'Froakie']  # Aquacorde Town, Lv 5 (Bulbapedia; DllField.cro agrees, holds a Big Nugget)
# Gifts and fixed encounters in DllField.cro: (species, area, method, note); level and held item come from the cro.
CRO_STATIC, CRO_GIFT = (0xEE46C, 0xC, 14), (0xF805C, 0x18, 19)  # vanilla X offsets, entry size, count (the hack keeps them)
SPECIALS = [
    ('Torchic', 'Route 2: Avance Trail', 'One-time encounter', 'Hidden Ability; replaces the Pidgey'),
    ('Snorlax', 'Route 7: Rivière Walk', 'Static', 'Wake it with the Poké Flute'),
    ('Xerneas', 'Team Flare Secret HQ', 'Static', ''),
    ('Articuno', 'Azure Bay', 'Roaming', "After the League; flees and roams Kalos, then waits in the Sea Spirit's Den after 11 encounters. Starter: Chespin"),
    ('Zapdos', 'Azure Bay', 'Roaming', "After the League; flees and roams Kalos, then waits in the Sea Spirit's Den after 11 encounters. Starter: Fennekin"),
    ('Moltres', 'Azure Bay', 'Roaming', "After the League; flees and roams Kalos, then waits in the Sea Spirit's Den after 11 encounters. Starter: Froakie"),
    ('Zygarde', 'Terminus Cave', 'Static', 'After the League'),
    ('Mewtwo', 'Pokémon Village', 'Static', 'In the Unknown Dungeon, after the League'),
    *[(k, 'Lumiose City', 'Gift', 'Choose one from Professor Sycamore') for k in ('Bulbasaur', 'Charmander', 'Squirtle')],
    ('Lapras', 'Route 12: Fourrage Road', 'Gift', 'From a man on Route 12'),
    ('Lucario', 'Shalour City', 'Gift', 'From Korrina after her Tower of Mastery battle'),
    ('Omanyte', 'Ambrette Town', 'Gift (fossil)', 'Restore the Helix Fossil at the Fossil Lab'),
    ('Kabuto', 'Ambrette Town', 'Gift (fossil)', 'Restore the Dome Fossil at the Fossil Lab'),
    ('Aerodactyl', 'Ambrette Town', 'Gift (fossil)', 'Restore the Old Amber at the Fossil Lab'),
    ('Lileep', 'Ambrette Town', 'Gift (fossil)', 'Restore the Root Fossil at the Fossil Lab'),
    ('Anorith', 'Ambrette Town', 'Gift (fossil)', 'Restore the Claw Fossil at the Fossil Lab'),
    ('Cranidos', 'Ambrette Town', 'Gift (fossil)', 'Restore the Skull Fossil at the Fossil Lab'),
    ('Shieldon', 'Ambrette Town', 'Gift (fossil)', 'Restore the Armor Fossil at the Fossil Lab'),
    ('Tirtouga', 'Ambrette Town', 'Gift (fossil)', 'Restore the Cover Fossil at the Fossil Lab'),
    ('Archen', 'Ambrette Town', 'Gift (fossil)', 'Restore the Plume Fossil at the Fossil Lab'),
    ('Tyrunt', 'Ambrette Town', 'Gift (fossil)', 'Restore the Jaw Fossil at the Fossil Lab'),
    ('Amaura', 'Ambrette Town', 'Gift (fossil)', 'Restore the Sail Fossil at the Fossil Lab'),
]


def cro_specials():
    """{species name: (level, held item)} from the hack's DllField.cro (fixed encounters, then gifts)."""
    import struct
    raw = open(os.path.join(SRC, 'cro', 'DllField-rebalanced.cro'), 'rb').read()
    dexj = load('dex-rebalanced.json')
    sname = {x['id']: fix(x['name']) for x in dexj['species'] if not x['form']}
    iname = {x['id']: fix(x['name']) for x in dexj['items']}
    out = {}
    for (start, size, n), lv_at, item_at in ((CRO_STATIC, 3, 4), (CRO_GIFT, 5, 12)):
        for k in range(n):
            e = raw[start + k * size:start + (k + 1) * size]
            sp, it = struct.unpack_from('<H', e, 0)[0], struct.unpack_from('<H', e, item_at)[0]
            out.setdefault(sname.get(sp), (e[lv_at], iname.get(it) if it not in (0, 0xFFFF) else None))
    return out


def lvstr(lo, hi):
    return f'{lo}-{hi}' if lo != hi else str(lo)


def pdf_areas(locs):
    """[{'title', 'loc', 'subs': [{'name', 'tables': [[method, text]]}]}] in the doc's order.

    A title is a line whose part before ':' is a game location (norm); any other title line is a sub-area of the
    last one ('1F', 'Outside', 'All Areas'); a table is a method line plus its wrapped continuation lines.
    """
    lines = text('Wild Pokemon Locations').split('\n')
    start = next(i for i, l in enumerate(lines) if 'Route 2: Avance Trail' in l)
    tops, sub, table = [], None, None
    for raw in lines[start:]:
        s = ' '.join(raw.split())
        if not s or s.startswith('*') or re.fullmatch(r'\d+', s):
            continue
        if PDF_TABLE.match(s):
            table = [s]
            sub['tables'].append(table)
            continue
        if table and '%' in s:
            table[0] += ' ' + s
            continue
        table = None
        head = fix(s.split(':')[0]) if ':' in s else fix(s)
        if norm(head) in locs:
            tops.append({'title': fix(s), 'loc': locs[norm(head)], 'subs': []})
            sub = {'name': '', 'tables': []}
            tops[-1]['subs'].append(sub)
        else:
            sub = {'name': re.sub(r'\s*\([^)]*\)', '', fix(s)).strip(), 'tables': []}  # 'Small Room, 1F (accessible...)'
            tops[-1]['subs'].append(sub)
    for top in tops:
        top['subs'] = [s for s in top['subs'] if s['tables']]
    return tops


def pdf_species(sub):
    """Species (norm) that the doc lists in a sub-area, for matching zones to sub-areas."""
    out = set()
    for t in sub['tables']:
        body = t[0].split(':', 1)[1] if ':' in t[0] else t[0]
        for name, _ in PDF_RATE.findall(body):
            for piece in re.split(r' & | and |, ', name):
                if piece.strip(' *'):
                    out.add(norm(piece))
    return out


def zone_species(z):
    return {norm(sl[0]) for t in z['tables'] for sl in t['slots']}


def assign(zs, subs):
    """Zone -> sub-area name, one to one by species overlap, leftover zones to their best sub."""
    shared = [s for s in subs if s['name'] == 'All Areas']
    if shared:  # the doc's table for every zone of the place: each zone's game tables already have it
        subs = [s for s in subs if s not in shared]
    if len(subs) <= 1:
        return [(z, subs[0]['name'] if subs else '') for z in zs]
    zsp = [zone_species(z) for z in zs]
    ssp = [pdf_species(s) for s in subs]

    def score(i, j):
        return len(zsp[i] & ssp[j]) / max(1, len(zsp[i] | ssp[j]))
    pairs = sorted(((score(i, j), i, j) for i in range(len(zs)) for j in range(len(subs))),
                   key=lambda p: (-p[0], p[1], p[2]))
    zo, so = {}, set()
    for sc, i, j in pairs:
        if sc > 0 and i not in zo and j not in so:
            zo[i] = j
            so.add(j)
    for j, s in enumerate(subs):
        if j not in so:
            report(f'locs: doc sub-area "{s["name"]}" has no zone of its own (species overlap 0)')
    out = []
    for i, z in enumerate(zs):
        if i in zo:
            j = zo[i]
        else:
            j = max(range(len(subs)), key=lambda j: (score(i, j), -j))
            report(f'locs: zone {z["zone"]} ({z["location"]}) has no matching sub-area; merged into "{subs[j]["name"]}"')
        out.append((z, subs[j]['name']))
    return out


def build(D):
    d = load('dex-rebalanced.json')
    zones = d['encounters']
    for z in zones:
        z['location'] = fix(z['location'])
    locs = {norm(z['location']): z['location'] for z in zones}
    by_loc = {}
    for z in sorted(zones, key=lambda z: z['zone']):
        by_loc.setdefault(z['location'], []).append(z)

    spid = {}
    for s in d['species']:
        if s.get('form') == 0:
            spid.setdefault(norm(s['name']), s['id'])

    noted = set()

    def pid_of(name, form):
        sid = spid.get(norm(name))
        if sid is None:
            return None
        pid = D['_spec'].get((sid, form))
        if pid is None:
            pid = D['_spec'].get((sid, 0))
            if (name, form) not in noted:
                noted.add((name, form))
                report(f'locs: {name} form {form} not in the dex, using form 0 (cosmetic form)')
        return pid

    tops = pdf_areas(locs)
    missing = set(locs.values()) - {t['loc'] for t in tops}
    if missing:
        report('locs: game locations with no doc title: ' + ', '.join(sorted(missing)))

    LOC = ['Starter']
    AR = [{'n': 'Starter', 'l': [0], 'st': 1}]
    for top in tops:
        idx = len(AR)
        zs = by_loc.get(top['loc'], [])
        if not zs:
            report(f'locs: doc title "{top["title"]}" has no game zone')
        pairs = assign(zs, top['subs']) if zs else []
        multi = len({s for _, s in pairs}) > 1
        groups = {k: [] for k, _ in SECTIONS}
        seen = set()
        for z, sub in pairs:
            for t in z['tables']:
                meth = t['method']
                sig = (sub, meth, tuple(map(tuple, t['slots'])))
                if sig in seen:
                    report(f'locs: {top["title"]}: {meth} table of zone {z["zone"]} repeats an earlier zone; skipped')
                    continue
                seen.add(sig)
                if meth.startswith('Horde'):
                    k, label, chance = 'other', f"Horde {t.get('chance', '')}%", t.get('chance', 0)
                else:
                    k = 'grass' if meth in GRASS else 'water' if meth in WATER else 'other'
                    label, chance = meth, None
                if multi and sub:
                    label = f'{sub} · {label}'
                groups[k].append((label, t, chance))
        secs = []
        for k, sname in SECTIONS:
            gs = []
            for label, t, chance in groups[k]:
                agg = {}
                tlo = min(sl[2] for sl in t['slots'])
                thi = max(sl[3] for sl in t['slots'])
                for sl in t['slots']:
                    name, form, lo, hi = sl[:4]
                    rate = sl[4] if len(sl) > 4 else chance
                    pid = pid_of(name, form)
                    if pid is None:
                        report(f'locs: species "{name}" not found ({top["title"]}, {t["method"]})')
                        continue
                    a = agg.setdefault(pid, [0, lo, hi])
                    a[0] = a[0] + rate if len(sl) > 4 else rate  # horde slots repeat the chance: once per species
                    a[1], a[2] = min(a[1], lo), max(a[2], hi)
                rows = []
                for pid in sorted(agg):
                    rate, lo, hi = agg[pid]
                    if not rate:
                        continue
                    rows.append((pid, {'p': pid, 'r': [rate, rate]}, lo, hi, rate))
                g_rows = []
                for pid, row, lo, hi, rate in rows:
                    g_rows.append(row)
                    D['_byid'][pid]['w'].append([idx, label, f'{rate}%', lvstr(lo, hi), '', 1])
                gs.append({'label': label, 'lv': lvstr(tlo, thi), 'rows': g_rows})
            if not gs:
                continue
            multi_g = len(gs) > 1 or multi
            secs.append({'n': sname, 'k': k, 'g': [{'m': g['label'] if multi_g else '', 'lv': g['lv'],
                                                    'rows': g['rows']} for g in gs]})
        LOC.append(fix(top['title']))
        AR.append({'n': fix(top['title']), 'l': [idx], 'es': secs})

    for s in STARTERS:
        pid = pid_of(s, 0)
        if pid is None:
            report(f'locs: starter {s} not found')
            continue
        D['_byid'][pid]['w'].append([0, 'Starter choice', '', '5', 'Choose one in Aquacorde Town; holds a Big Nugget'])

    # Gifts and fixed encounters: species, levels and held items from the hack's DllField.cro (cro_specials()); the
    # places are vanilla X's (Bulbapedia; the hack has no script edits).
    def add_area(name, before):
        LOC.append(name)
        AR.append({'n': name, 'l': [len(LOC) - 1]})
        aro.insert(aro.index([x['n'] for x in AR].index(before)), len(AR) - 1)
    aro = list(range(len(AR)))
    add_area('Lumiose City', 'Route 5: Versant Road')
    add_area('Team Flare Secret HQ', 'Route 18: Vallée Étroite Way')
    D['ARO'] = aro
    cro = cro_specials()
    for sp, area, method, note in SPECIALS:
        if sp not in cro:
            report('locs: special not in DllField.cro:', sp)
            continue
        lv, item = cro[sp]
        a = [x['n'] for x in AR].index(area)
        note = '; '.join(x for x in (note, f'holds {item}' if item else '') if x)
        D['_byid'][pid_of(sp, 0)]['w'].append([AR[a]['l'][0], method, '', str(lv), note])
    report('locs: specials from DllField.cro', len(SPECIALS), '(Abomasnow Lv 45 in Frost Cavern is a battle, not a catch; Yveltal is Y only)')

    D['LOC'] = LOC
    D['AR'] = AR

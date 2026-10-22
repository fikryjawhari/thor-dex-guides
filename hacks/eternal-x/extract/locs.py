"""Eternal X locations: LOC (Locations pages), AR (tracker areas) and each Pokemon's wild rows (P.w).

The game's encounter tables (dex-rebalanced.json) are the data. Wild Pokemon Locations.pdf names the areas and gives
their story order. Each doc title is one tracker area and one Locations page. Its game zones (floors, rooms) become
sections: Grass (walk encounters, flowers, Rough Terrain), Water (Surf and rods), Other (Rock Smash, hordes).
A location with several zones is matched to the doc's sub-areas (1F, B2F, Outside...) by species.
"""
import re

from common import load, fix, norm, report, text

GRASS = {'Grass', 'Yellow Flowers', 'Purple Flowers', 'Red Flowers', 'Rough Terrain'}
WATER = {'Surf', 'Old Rod', 'Good Rod', 'Super Rod'}
SECTIONS = [('grass', 'Grass'), ('water', 'Water'), ('other', 'Other')]
PDF_TABLE = re.compile(r'^(Grass|Yellow Flowers|Purple Flowers|Red Flowers|Rough Terrain|Snow|Cave|Surf|Rock Smash|'
                       r'Old Rod|Good Rod|Super Rod|Hordes)\b')
PDF_RATE = re.compile(r'([^,()]+?)\s*\((\d+)%\)')

# Gifts and one-offs that the docs name (the game's tables don't have them). Level '' = not in the docs.
STARTERS = ['Chespin', 'Fennekin', 'Froakie']  # Aquacorde Town, Lv 5 (Bulbapedia; the Changelog's Kanto starter isn't listed)
SPECIALS = [('Route 2', 'One-time encounter', 'Torchic', '', 'Hidden Ability, holds Blazikenite (CFW only)')]


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

    for name, method, species, lv, note in SPECIALS:
        pid = pid_of(species, 0)
        area = next((i for i, a in enumerate(AR) if a['n'] == name or a['n'].startswith(name + ':')), None)
        if pid is None or area is None:
            report(f'locs: special {species} at {name} not placed')
            continue
        D['_byid'][pid]['w'].append([area, method, '', str(lv), note])
    for s in STARTERS:
        pid = pid_of(s, 0)
        if pid is None:
            report(f'locs: starter {s} not found')
            continue
        D['_byid'][pid]['w'].append([0, 'Starter choice', '', '5', 'Choose one in Aquacorde Town'])

    # Gifts the docs only mention (Changelog: Kanto starter holds an Eviolite; Lapras and the Kanto starters have
    # perfect IVs; fossils revive at Lv 25). Places and the other levels are vanilla X's (Bulbapedia).
    names = [a['n'] for a in AR]
    LOC.append('Lumiose City')
    AR.append({'n': 'Lumiose City', 'l': [len(LOC) - 1]})
    D['ARO'] = list(range(len(AR) - 1))
    D['ARO'].insert(names.index('Route 5: Versant Road'), len(AR) - 1)  # Lumiose comes between Routes 4 and 5
    for area, sp, lv, note in [
        ('Lumiose City', 'Bulbasaur', 10, 'Choose one from Professor Sycamore; holds an Eviolite'),
        ('Lumiose City', 'Charmander', 10, 'Choose one from Professor Sycamore; holds an Eviolite'),
        ('Lumiose City', 'Squirtle', 10, 'Choose one from Professor Sycamore; holds an Eviolite'),
        ('Route 12: Fourrage Road', 'Lapras', 25, 'From a man on Route 12'),
        ('Ambrette Town', 'Tyrunt', 25, 'Restore the Jaw Fossil (chosen in Glittering Cave) at the Fossil Lab'),
        ('Ambrette Town', 'Amaura', 25, 'Restore the Sail Fossil (chosen in Glittering Cave) at the Fossil Lab')]:
        a = [x['n'] for x in AR].index(area)
        D['_byid'][pid_of(sp, 0)]['w'].append([AR[a]['l'][0], 'Gift', '', str(lv), note])
    report('locs: gifts from vanilla X places (Kanto starter, Lapras, Jaw/Sail fossils); other vanilla gifts not added')

    D['LOC'] = LOC
    D['AR'] = AR

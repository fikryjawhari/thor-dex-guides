"""Check the locations sheet's wild tables against the game's Encounters.c, slot by slot (with the hack's own slot odds).
encounters(HG) -> {table: {method: {speciesId: rate}}}; compare(sheet, game) -> list of differences."""
import re, collections
from src import LAND, WATER, ROCK

# sheet location -> Encounters.c table (sheet sub-locations not listed map by name: "Route 29" -> R29_ROUTE_29)
MAP = {'Dark Cave (1)': 'D42R0102_DARK_CAVE_ROUTE_31_ENTRANCE', 'Dark Cave (Inner)': 'D42R0101_DARK_CAVE_ROUTE_45_ENTRANCE',
       'Route 36 (1)': 'R36_ROUTE_36', 'Route 36 (2)': 'R36_ROUTE_36', 'Ruins of Alph - Outside': 'D24R0101_RUINS_OF_ALPH_OUTSIDE',
       'Ruins of Alph - Inside': 'D24R0205_RUINS_OF_ALPH_INSIDE_MAIN_ROOM', 'Slowpoke Well B1F': 'D26R0102_SLOWPOKE_WELL_1F',
       'Slowpoke Well B2F': 'D26R0103_SLOWPOKE_WELL_B2F', 'Ilex Forrest': 'D36R0101_ILEX_FOREST', 'National Park - Morning': 'D22R0101_NATIONAL_PARK',
       'National Park - Day': 'D22R0101_NATIONAL_PARK', 'National Park - Night': 'D22R0101_NATIONAL_PARK',
       'Mt. Mortar 1F (Entrance)': 'D38R0101_MT_MORTAR_WATERFALL_ROOM', 'Mt. Mortar 1F (Back)': 'D38R0102_MT_MORTAR_CENTRAL_ROOM',
       'Mt. Mortar 2F': 'D38R0103_MT_MORTAR_ROOM_ABOVE_WATERFALL', 'Mt. Mortar B1F': 'D38R0104_MT_MORTAR_B1F',
       'Whirl Islands B3F (Inner Cave)': 'D40R0106_WHIRL_ISLANDS_B3F_LEDGE_OVERLOOKING_LUGIA_ROOM', 'Ice Path 1F & B1F': 'D39R0102_ICE_PATH_B1F',
       'Mt. Silver Entrance': 'D41R0101_MT_SILVER_1F', 'Mt. Silver (Mountainside)': 'D41R0103_MT_SILVER_MOUNTAINSIDE',
       'Mt. Silver (Snowy Area)': 'D41R0102_MT_SILVER_TOP_SNOWY_AREA', 'Mt. Silver (Moltres Room)': 'D41R0105_MT_SILVER_MOLTRES_ROOM',
       'Cliff Cave': 'D50R0101_CLIFF_CAVE', "Dragon's Den": 'D44R0102_DRAGONS_DEN'}
TOD = {'National Park - Morning': 'speciesMorning', 'National Park - Night': 'speciesNight'}

def table_for(name, ENC):
    if name in MAP: return 'ENCDATA_' + MAP[name]
    k = re.sub(r'[^A-Z0-9]+', '_', name.upper()).strip('_')
    for t in ENC:
        if t.endswith('_' + k) or t.split('_', 1)[-1] == k: return t
    return None

def game_rates(e, sid, tod='speciesDay'):
    out = {}
    def addm(m, sp, r, lv):
        if sp in ('SPECIES_NONE', 0, '0'): return
        d = out.setdefault(m, {}); i = sid(sp); x = d.setdefault(i, [0, set()]); x[0] += r; x[1].add(lv)
    ls = e.get('landSlots', {})
    if e.get('rateWalk'):
        for sp, r, lv in zip(ls.get(tod, []), LAND, ls.get('levels', [])): addm('Land', sp, r, lv)
    if e.get('rateSurf'):
        for (lo, hi, sp), r in zip(e['surfSlots'], WATER): addm('Surf', sp, r, hi)
    if e.get('rateRockSmash'):
        for (lo, hi, sp), r in zip(e['rockSmashSlots'], ROCK): addm('Rock Smash', sp, r, hi)
    for rod in ('oldRod', 'goodRod', 'superRod'):
        # the hack only hands out the Old Rod; Good/Super Rod tables are left as one-species placeholders (Goldeen, Magikarp)
        if rod != 'oldRod' and len({x[2] for x in e[rod + 'Slots']} - {'SPECIES_NONE'}) <= 1: continue
        if e.get('rate' + rod[0].upper() + rod[1:]):
            for (lo, hi, sp), r in zip(e[rod + 'Slots'], WATER): addm(rod, sp, r, hi)
    return out

def best_table(sheet_rows, ENC, sid, prefer):
    """The game table sharing the most species with the sheet location (the hack reuses some Kanto table slots,
    e.g. Whirl Islands B3F lives in Route 15's slot), preferring the table with the matching name."""
    want = {i for r in sheet_rows.values() for i in r}
    def ov(t):
        g = game_rates(ENC[t], sid); return len(want & {i for m in g.values() for i in m})
    n0 = ov(prefer) if prefer else -1
    best = max(ENC, key=ov)
    return prefer if prefer and n0 >= ov(best) * 0.75 and n0 > 0 else (best if ov(best) >= max(2, len(want) // 2) else None)
def compare(sheet_loc, sheet_rows, ENC, sid):
    """sheet_rows: {method: {speciesId: rate%}}; returns (table, [difference text])."""
    t = best_table(sheet_rows, ENC, sid, table_for(sheet_loc, ENC))
    if not t: return None, ['no game table with these Pokemon (static, gift or scripted encounter, or not in the game)']
    g = game_rates(ENC[t], sid, TOD.get(sheet_loc, 'speciesDay'))
    diffs = []
    for m, rows in sheet_rows.items():
        gm = 'Land' if m == 'Land' else m
        if m == 'Fishing':
            cands = [x for x in ('superRod', 'goodRod', 'oldRod') if x in g]
            best = min(cands, key=lambda x: sum(abs(rows.get(i, 0) - g[x].get(i, [0])[0]) for i in set(rows) | set(g[x]))) if cands else None
            gv = {i: v[0] for i, v in g.get(best, {}).items()} if best else {}
            other = [x for x in cands if x != best and {i: v[0] for i, v in g[x].items()} != gv]
            if other: diffs.append('Fishing: the rods differ in the game (%s); the sheet shows %s' % (', '.join(cands), best))
            if best and best != 'oldRod': diffs.append('Fishing: the sheet matches the %s table' % best)
        else:
            gv = {i: v[0] for i, v in g.get(gm, {}).items()}
        if gm not in ('Land', 'Surf', 'Rock Smash', 'Fishing'): continue
        if gv != rows:
            miss = {i: r for i, r in rows.items() if gv.get(i) != r}
            extra = {i: r for i, r in gv.items() if i not in rows}
            diffs.append('%s: sheet %s; game %s' % (m, ', '.join('%s %s%%' % (i, r) for i, r in sorted(miss.items())) or '-', ', '.join('%s %s%%' % (i, gv[i]) for i in sorted(set(miss) | set(extra)) if i in gv) or '-'))
    for m in g:
        mm = 'Fishing' if m.endswith('Rod') else m
        if mm not in sheet_rows and mm in ('Land', 'Surf', 'Rock Smash', 'Fishing'):
            diffs.append('%s in the game, not in the sheet: %s' % (mm, ', '.join('%s %s%%' % (i, v[0]) for i, v in g[m].items())))
    if 'landSlots' in ENC[t] and TOD.get(sheet_loc) is None and sheet_loc not in ('National Park - Day',):
        ls = ENC[t]['landSlots']
        if ENC[t].get('rateWalk') and (ls.get('speciesMorning') != ls.get('speciesDay') or ls.get('speciesNight') != ls.get('speciesDay')):
            diffs.append('Land differs by time of day in the game')
    return t, diffs

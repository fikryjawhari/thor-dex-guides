# Stage 7: data for the split UI (plans/split-ui.md), run in the repo on hacks/emerald-imperium/data.json after stage 6:
#   python -I hacks/emerald-imperium/extract/stage7_split_ui.py
# Works on the finished data.json (no sources needed) and refuses to run twice (D['s7']).
# - Eggs: every hatch-here area (Oldale, Verdanturf, Fallarbor, Mt. Chimney, Lavaridge, Fortree) gets one tracker slot per
#   egg (Fire / Water / Grass starter egg, by shard; Oldale, Lavaridge, Pacifidlog egg), since any egg can hatch at any of
#   them. The slots are new areas appended to AR (AR[i].in = the town, the town gets .sub) so saved trackers, keyed by
#   area index, keep pointing at the same areas; the template moves a town's old saved egg into the matching slot.
# - Buildings in a town that only hold gifts fold into the town's own place (Littleroot's lab; Rustboro, Mossdeep,
#   Sootopolis houses: method "Gift (<building>)").
# - Trainers: boxes = level cap runs (the sheet's cap list names them), places = runs of one location. Hot House stays one
#   box, a place per badge tier with its cap.
# - Shops: each row gets its shop as r[4] (the text before the first " · "); r[1] keeps the rest.
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools'))
import datajson
sys.stdout.reconfigure(encoding="utf-8")
P = 'hacks/emerald-imperium/data.json'
D, RAW = datajson.load(P)
if D.get('s7'): sys.exit('stage 7 already applied')
LOC, AR = D['LOC'], D['AR']
byLoc = {}
for p in D['P']:
    for w in p['w']: byLoc.setdefault(w[0], []).append((p, w))
# ---------- eggs
HATCH = [2, 27, 31, 38, 40, 55]
OLDLOC = {137, 195, 196} | set(range(140, 195))
starters = [(p, w) for p, w in byLoc[140]]
kind = lambda p: next(t for t in p['t'] if t in ('Fire', 'Water', 'Grass'))
SHARD = {'Fire': 'Red', 'Water': 'Blue', 'Grass': 'Green'}
POOLS = [(f'{k} starter egg', [p for p, w in starters if kind(p) == k], '1',
          f'Give a {SHARD[k]} Shard to the man in the Fallarbor Town Move Relearner House (random {k.lower()} starter)') for k in ('Fire', 'Water', 'Grass')]
POOLS += [('Oldale egg', [p for p, w in byLoc[137]], byLoc[137][0][1][3], 'Random egg from the man in the Oldale Town Pokémon Center'),
          ('Lavaridge egg', [p for p, w in byLoc[195]], byLoc[195][0][1][3], 'Give the lady in Lavaridge Town a Yellow Shard'),
          ('Pacifidlog egg', [p for p, w in byLoc[196]], byLoc[196][0][1][3], 'Random egg from the man in the Pacifidlog Town Pokémon Center 1F')]
assert [len(x[1]) for x in POOLS] == [9, 9, 9, 10, 9, 10], [len(x[1]) for x in POOLS]
for p in D['P']: p['w'] = [w for w in p['w'] if w[0] not in OLDLOC]
for a in HATCH:
    town = AR[a]['n']; AR[a]['l'] = []; AR[a]['sub'] = []
    for name, sp, lv, note in POOLS:
        li = len(LOC); LOC.append(f'{town} ({name})')
        for p in sp: p['w'].append([li, 'Egg', f'1 of {len(sp)}', lv, note])
        AR[a]['sub'].append(len(AR)); AR.append({'n': LOC[li], 'l': [li], 'in': a})
# ---------- buildings with gifts fold into their town
for a in (0, 8, 85, 118):
    A = AR[a]; home = next(li for li in A['l'] if LOC[li] == A['n'])
    for li in [x for x in A['l'] if x != home]:
        b = LOC[li][len(A['n']) + 1:] if LOC[li].startswith(A['n'] + ' ') else LOC[li]
        for p, w in byLoc[li]:
            w[0] = home
            if w[1] in ('Gift', 'Static'): w[1] = f'{w[1]} ({b})'
    A['l'] = [home]
# ---------- trainers: boxes by level cap, places by location
CAPN = {c: re.sub(r'^Pre-|\s+(fight|battle)\b', '', n).replace(' in Victory Road', '').replace('Wally', 'Victory Road') for n, c in D['TR']['caps']}
CAPN[84] = 'Victory Road'
G = []
def place(sec, h, t):
    if not sec or sec[-1]['h'] != h: sec.append({'h': h, 'tr': []})
    sec[-1]['tr'].append(t)
for g in D['TR']['g']:
    if g['n'].startswith('Hot House'):
        G.append({'n': 'Hot House (optional, by badges)', 'tab': g['tab'], 'wk': g.get('wk'),
                  'sec': [dict(s, h=f"{s['h']} [Cap {s['tr'][0]['cap']}]") for s in g['sec']]}); continue
    for s in g['sec']:
        assert not s['h'] and not s.get('note') and not s.get('rw')
        for t in s['tr']:
            c = t['cap']
            if not G or G[-1].get('cap') != c: G.append({'n': f'{CAPN[c]} Split [Cap {c}]', 'cap': c, 'tab': g['tab'], 'wk': g.get('wk'), 'sec': []})
            place(G[-1]['sec'], t['loc'], t)
D['TR']['g'] = G
# ---------- shops
for sec in D['IT']:
    if sec['n'] != 'Shops': continue
    for r in sec['r']:
        while len(r) < 4: r.append(None if len(r) == 2 else 0)
        parts = [x for x in r[1].split(' · ') if x != 'All free']
        shop = 'Any Poké Mart' if parts[0].startswith('Any Pok') else parts[0]
        r[1] = ' · '.join(parts[1:]); r.append(shop)
D['s7'] = 1
datajson.save(P, D, RAW)
print('areas', len(AR), 'locs', len(LOC), 'boxes', [g['n'] for g in G])
print('shops', sorted({r[4] for s in D['IT'] if s['n'] == 'Shops' for r in s['r']}))

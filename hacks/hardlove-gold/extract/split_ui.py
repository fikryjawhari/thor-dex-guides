# Data for the split UI (plans/split-ui.md), run in the repo on hacks/hardlove-gold/data.json after extract/assemble.py:
#   python -I hacks/hardlove-gold/extract/split_ui.py
# Works on the finished data.json (no sources needed) and refuses to run twice (D['su']).
# - Trainers: boxes = the mini-splits the sheet's section headings start ("Elder Li Split [Level Cap 12], Cherrygrove
#   City" -> box "Elder Li Split [Cap 12]", place "Cherrygrove City"); places = the headings, repeats next to each other
#   merged. Mini Bosses keep one box, the "[Level Cap X-2]" prefix dropped from their places.
# - Items: Held Items and Berries become one box with categories (r[4]); Heart Scales and Rare Candies become Valuables.
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'tools'))
import datajson
from splits import split_name
sys.stdout.reconfigure(encoding="utf-8")
P = 'hacks/hardlove-gold/data.json'
D, RAW = datajson.load(P)
if D.get('su'): sys.exit('split_ui already applied')
# ---------- trainers
G = []
for g in D['TR']['g']:
    first = True
    for s in g['sec']:
        h = s['h']; m = re.match(r'^(.*?) \[Level Cap (\d+)\],?\s*(.*)$', h)
        if m: G.append({'n': split_name(m[1], int(m[2])), 'cap': int(m[2]), 'tab': g['tab'], 'note': [], 'sec': []}); h = m[3] or m[1]
        elif g['n'] == 'Mini Bosses':
            if first: G.append({'n': 'Mini Bosses', 'tab': g['tab'], 'note': [], 'sec': []})
            h = re.sub(r'^\[Level Cap X-2\]\s*', '', h)
        assert G, h
        if first and g.get('note'): G[-1]['note'] += g['note']
        first = False
        sec = G[-1]['sec']
        if sec and sec[-1]['h'] == h and not s.get('note') and not s.get('rw'): sec[-1]['tr'] += s['tr']
        else: sec.append(dict(s, h=h))
D['TR']['g'] = G
# ---------- items
TYPE = {'Miracle Seed', 'Nevermelt Ice', 'Poison Barb', 'Silk Scarf', 'Charcoal', 'Silver Powder', 'Soft Sand', 'Black Glasses',
        'Hard Stone', 'Magnet', 'Metal Coat', 'Twisted Spoon', 'Sharp Beak', 'Mystic Water', 'Black Belt', 'Spell Tag',
        'Pixie Plate', 'Dragon Fang'}
CONS = {'White Herb', 'Power Herb', 'Throat Spray', 'Room Service', 'Eject Button', 'Red Card', 'Eject Pack', 'Booster Energy',
        'Focus Sash', 'Electric Seed', 'Psychic Seed', 'Grassy Seed', 'Misty Seed'}
cat = lambda n: 'Gems' if n.endswith(' Gem') else 'Type boosting' if n in TYPE else 'Consumable' if n in CONS else 'Battle'
ORDER = ['Type boosting', 'Battle', 'Consumable', 'Gems', 'Berries']
S = {s['n']: s for s in D['IT']}
held = [r + [cat(r[0])] for r in S['Held Items']['r']] + [r + ['Berries'] for r in S['Berries']['r']]
held.sort(key=lambda r: ORDER.index(r[4]))
val = [r + ['Heart Scale'] for r in S['Heart Scales']['r']] + [r + ['Rare Candy'] for r in S['Rare Candies']['r']]
IT = [dict(S['Held Items'], r=held), {'n': 'Valuables', 'k': 'gen', 'note': '', 'r': val}]
IT += [s for s in D['IT'] if s['n'] not in ('Held Items', 'Berries', 'Heart Scales', 'Rare Candies')]
D['IT'] = IT
D['su'] = 1
datajson.save(P, D, RAW)
print('boxes', [(g['n'], [s['h'] for s in g['sec']]) for g in G])
print('held', {c: [r[0] for r in held if r[4] == c] for c in ORDER[:3]})

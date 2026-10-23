"""Items tab, proposed standard (plans/items-standard.md): python -I model.py <repo> <hack> <out.json>

Maps a guide's current D.IT (data.json) into the one shared box set and row style, for the mockup. It is a rough
version of the rules the build will use (class sets, kinds, Found / Wild / Shop / Also lines, box order); the build
puts them in a shared helper so the four extracts agree. Deliberately dumb: anything it can't place goes to the
hack's "Other" or stays as is, and the mockup page says so."""
import json, re, sys
from pathlib import Path

repo, hack, out = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
D = json.load(open(repo / f'hacks/{hack}/data.json', encoding='utf-8'))
OLD = D['IT']
BOX = ['Key Items', 'TMs', 'HMs', 'Move Tutors', 'Evolution Items', 'Held Items', 'Stats and Abilities',
       'Mega Stones', 'Z-Crystals', 'Fossils', 'Valuables', 'Shops', 'Useful NPCs']

# ---- shared class sets ---------------------------------------------------------------------------------------------
HELD_CLASS = ['Type boosters', 'Battle gear', 'One-use items', 'Gems', 'Berries', 'Pokémon-specific', 'Memories and Drives',
              'Other held items']
HELD_MAP = {'Type boosting': 'Type boosters', 'Battle': 'Battle gear', 'Consumable': 'One-use items', 'Gems': 'Gems',
            'Berries': 'Berries', 'Type boosters': 'Type boosters', 'Battle gear': 'Battle gear',
            'One-use items': 'One-use items', 'Pokémon-specific': 'Pokémon-specific',
            'Silvally Memories, Genesect Drives': 'Memories and Drives', 'Genesect Drives': 'Memories and Drives',
            'Other held items': 'Other held items'}
BATTLE = {'Leftovers', 'Expert Belt', 'Muscle Band', 'Wise Glasses', 'Black Sludge', 'Toxic Orb', 'Flame Orb', 'Eviolite',
          'Smoke Ball', 'Kicking Shoes', 'Protective Pads', 'Punching glove', 'Loaded Dice', 'Choice Band', 'Life Orb'}
ONE_USE = {'Weakness Policy', 'Grassy Seed', 'Electric Seed', 'Misty Seed', 'Psychic Seed', 'Focus Sash', 'Red Card'}
SPECIFIC = {'Thick Club', 'Light Ball', 'Stick', 'Lucky Punch', 'Metal Powder', 'Quick Powder', 'Soul Dew'}
KINDS = ['Poké Balls', 'Healing and repels', 'Evolution items', 'Power items', 'Held items', 'Stats and abilities', 'TMs',
         'Mega Stones', 'Other']
KIND_MAP = {'Pok� Balls': 'Poké Balls', 'Poké Balls': 'Poké Balls'}


def fix(s):
    return s.replace('�', 'é') if isinstance(s, str) else s


def lines(text):
    """Prose place -> Found / Shop / Also lines (the rows that are already lines pass through)."""
    text = fix(text).strip()
    if re.match(r'^(Found|Wild|Shop|Also):', text):
        return text
    out = {}
    for s in re.split(r'\n|(?<=[.)])\s+(?=[A-Z])', text):
        s = s.strip().rstrip('.')
        if not s:
            continue
        m = re.match(r'^(?:Sold at|Sells at|Available at)\s+(?:the\s+)?(.*)$', s, re.I)
        if m:
            k, v = 'Shop', m.group(1)
        elif re.search(r'\b(given by|gift|from [A-Z]|reward|after defeating|Defeat)\b', s):
            k, v = 'Also', re.sub(r'^Defeat ', 'reward: ', s) if s.startswith('Defeat ') else s
        else:
            k, v = 'Found', s
        out.setdefault(k, []).append(v)
    return '\n'.join(f'{k}: {"; ".join(out[k])}' for k in ('Found', 'Wild', 'Also', 'Shop') if k in out)


boxes = {n: [] for n in BOX}
notes = {}


def add(box, item, text, link=None, miss=0, sub=''):
    boxes[box].append([fix(item), text, link, miss] + ([fix(sub)] if sub else []))


def held_class(item):
    if item in BATTLE: return 'Battle gear'
    if item in ONE_USE: return 'One-use items'
    if item in SPECIFIC: return 'Pokémon-specific'
    return 'Other held items'


for b in OLD:
    n = b['n']
    for r in b['r']:
        it, tx = fix(r[0]), r[1]
        link, miss = (r[2] if len(r) > 2 else None), (r[3] if len(r) > 3 else 0)
        sub = fix(r[4]) if len(r) > 4 else ''
        if n in ('TMs', 'HMs', 'Move Tutors'):
            add(n, it, fix(tx), link, miss)
        elif n == 'Mega Stones':
            add('Mega Stones', it, fix(tx), link, miss)
        elif n == 'Z-Crystals':
            add('Z-Crystals', it, lines(tx), link, miss)
        elif n == 'Evolution Items':
            add(n, it, lines(tx), link, miss)
        elif n == 'Fossils':
            add(n, it, lines(tx), link, miss)
        elif n == 'Key Items':
            add(n, it, lines(tx), link, miss)
        elif n == 'Stats and Abilities':
            add(n, it, lines(tx), link, miss, sub)
        elif n == 'Held Items':
            cls = HELD_MAP.get(sub, 'Other held items')
            if cls == 'Other held items' and not sub: cls = held_class(it)
            if sub == 'Mega Stones':                     # Eternal X listed its stones under Held Items
                add('Mega Stones', it, lines(tx), link, miss)
            else:
                add('Held Items', it, lines(tx), link, miss, cls)
        elif n == 'Battle item rewards':                 # EI: trainer rewards fold into the item's own box
            tx2 = 'Also: reward, ' + fix(tx).replace('Defeat ', 'defeat ')
            if 'stone' in it.lower() or 'Stone' in it:
                add('Evolution Items', it.replace('Leaf stones', 'Leaf Stone'), tx2, None, 0)
            else:
                add('Held Items', it, tx2, None, 0, held_class(it))
        elif n == 'Shops':
            pass                                           # below
        elif n == 'Valuables':
            add('Valuables', it, lines(tx), link, miss, sub)
        elif n == 'Useful NPCs':
            add('Useful NPCs', it, fix(tx), None, 0)
        elif n == 'Other':                                 # HG's catch-all, sorted by what each row is
            KEYS = {'Infinite Candy', 'Old Rod', 'Bike', 'Pokégear Upgrade 1', 'Starter Card', 'Dowsing Machine',
                    'SS Aqua Ticket', 'Mega Ring'}
            VALS = {'Master Ball', 'Big Nugget', 'Rage Candy Bar', 'Escape Rope'}
            if it in KEYS: add('Key Items', it, lines(tx))
            elif it in VALS: add('Valuables', it, lines(tx), sub=it)
            else: add('Useful NPCs', it.split('.')[0], fix(tx))

# ---- Shops: one row per item, shops in the row, sub-headings by kind -------------------------------------------------
shops = next((b for b in OLD if b['n'] == 'Shops'), None)
if shops:
    notes['Shops'] = fix(shops.get('note', ''))
    byitem = {}
    for r in shops['r']:
        it, tx, sub = fix(r[0]), fix(r[1]), fix(r[4]) if len(r) > 4 else ''
        if hack == 'emerald-imperium':                    # EI sub-headings are shops: the item's kind comes from its name
            kind = 'TMs' if it.upper().startswith('TM') else 'Evolution items' if 'Stone' in it else 'Healing and repels' if 'Potion' in it or 'Repel' in it else 'Other'
            tx = f'{sub} ({tx})' if tx else sub
            it = re.sub(r'^TM\s*0*(\d+)\s*-\s*', lambda m: f'TM{int(m.group(1)):03d} ', it)
        else:
            kind = KIND_MAP.get(sub, sub)
        byitem.setdefault((kind, it), []).append(tx)
    for (kind, it), tx in byitem.items():
        add('Shops', it, '\n'.join(tx), None, 0, kind)

# ---- order: sub-headings in fixed order, rows A to Z where the order isn't the game's -------------------------------
SUBORDER = {'Held Items': HELD_CLASS, 'Shops': KINDS}
AZ = {'Evolution Items', 'Held Items', 'Shops', 'Fossils', 'Mega Stones', 'Useful NPCs'}
new = []
for n in BOX:
    rs = boxes[n]
    if not rs: continue
    if n in SUBORDER:
        o = SUBORDER[n]
        rs.sort(key=lambda r: (o.index(r[4]) if r[4] in o else len(o), r[0].lower() if n in AZ else 0))
    elif n in AZ:
        rs.sort(key=lambda r: r[0].lower())
    kind = 'tm' if n in ('TMs', 'HMs', 'Move Tutors') else 'mega' if n == 'Mega Stones' else 'gen'
    new.append({'n': n, 'k': kind, 'note': notes.get(n, ''), 'r': rs})
json.dump(new, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
print(hack, [(b['n'], len(b['r'])) for b in new])

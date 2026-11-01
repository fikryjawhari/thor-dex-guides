"""TR: every data.js trainer with its Hardcore team, in the 18 Hardcore cap splits (notes.md → Trainers, Caps).

Teams, levels and caps from the official dex's data.js (D2); the Hardcore workbook (bosssheet.py) gives the Trainer
Order tab (which split a boss is in, its cap or cap range), each boss block's labels (starter, team one / two, back to
back) and BATTLE EFFECT lines (tags, notes, pre-statuses); the RR calc's hardcore.js and hzla's radredhc.js are the
second and third checks (check_sets). Scaled levels (101-104 = cap + 0 / -1 / -2 / -3) are absolute at the split's cap,
or relative (`r`, the card's "Your level" box) for the Trainer Order's range / open caps ("28/36", "36+").
"""
from pathlib import Path
import collections
import copy
import itertools
import json
import re

from common import DATA, SPECIES, SPECIES_IDS, CAPS, H, key, sid, move, ability, item, report
import bosssheet

STATS = {}
# Main E44:E78 (asserted against data.js caps on every build)
SPLITS = ['Pre-Brock', 'Pre-Mt. Moon Archer', 'Pre-Misty', 'Pre-Lt. Surge', 'Pre-Erika', 'Pre-Game Corner Giovanni',
          'Pre-Silph Co. Archer & Ariana', 'Pre-Giovanni Silph Co.', 'Pre-Sabrina', 'Pre-Koga', 'Pre-May', 'Pre-Blaine',
          'Pre-Cerulean Cave Archer & Ariana', 'Pre-Cerulean Cave Giovanni', 'Pre-Clair', 'Pre-Brendan', 'Pre-Elite 4',
          'Post Game']
# The Trainer Order entry that ends each split (its first match after the previous one)
ENDERS = ['BROCK', 'ARCHER', 'MISTY', 'LT. SURGE', 'ERIKA', 'GIOVANNI', 'ARIANA & ARCHER', 'GIOVANNI', 'SABRINA',
          'KOGA', 'MAY', 'BLAINE', 'ARIANA', 'GIOVANNI', 'CLAIR', 'BRENDAN', 'RIVAL']
PARTNERS = {'55': ['53', '54'], '39': ['69']}         # Silph Brendan, Cerulean Cave Lance (Team Rocket E240 / E409)
REMATCHES = ['56', '48', '51', '65']                  # Brock, Misty, Lt. Surge, Erika (Kanto Rematch tab)
REMATCH_NOTE = 'Beat at least 3 of these 4 gym rematches (Brock, Misty, Lt. Surge, Erika) before Koga.'
# Same Hardcore team as the first (they differ only in Normal mode): one card
SAME_TEAM = {'63': '62', '64': '62'}
# Back-to-back chains (the sheet's "(!) BACK TO BACK" / "(!!) BACK TO BACK TO BACK" on the later fights)
CHAINS = [['477', '233'], ['199', '249', '250'], ['16', '17'], ['67', '68'], ['200', '210']]
# The rival's team follows the player's starter type (Main E93: "If he has the Squirtle team, that means the player
# chose a Fire-type starter")
RIVAL_STARTER = {'squirtle': 'Fire', 'charmander': 'Grass', 'bulbasaur': 'Water'}
LINES = {'squirtle': {'squirtle', 'wartortle', 'blastoise', 'blastoise_mega'},
         'charmander': {'charmander', 'charmeleon', 'charizard', 'charizard_mega_x', 'charizard_mega_y'},
         'bulbasaur': {'bulbasaur', 'ivysaur', 'venusaur', 'venusaur_mega'}}
TEAM_WORDS = {'TEAM ONE': 1, 'TEAM TWO': 2, 'TEAM THREE': 3, 'RAIN TEAM': 'Rain', 'SNOW TEAM': 'Snow'}
LABEL_NOTES = {'PRE LT. SURGE': 'This team if you fight him before beating Lt. Surge.',
               'POST LT. SURGE': 'This team if you fight him after beating Lt. Surge.',
               'REMATCH': 'Rematch: at least a day after the first battle.'}
LABEL_TAGS = {'FIRST BATTLE': 'First battle', 'REMATCH': 'Rematch'}
# BATTLE EFFECT parts -> (tags, notes); "X IS PRE-BURNED / PRE-POISONED" -> the mon's pre
EFFECTS = {
    'DOUBLES': (['Double Battle'], []),
    'DOUBLES WITH PARTNER BRENDAN': (['Double Battle'], []),
    'DOUBLES WITH PARTNER LANCE': (['Double Battle'], []),
    'PERMANENT SANDSTORM': (['Permanent Sandstorm'], []),
    'PERMANENT SUN': (['Permanent Sun'], []),
    'PERMANENT RAIN': (['Permanent Rain'], []),
    'PERMANENT SNOW': (['Permanent Snow'], []),
    'PERMANENT DESOLATE LAND': (['Permanent Desolate Land'], []),
    'PERMANENT PRIMORDIAL SEA': (['Permanent Primordial Sea'], []),
    'PERMANENT DELTA STREAM': (['Permanent Delta Stream'], []),
    'PERMANENT TAILWIND': (['Permanent Tailwind on enemy side'], []),
    'PERMANENT ELECTRIC TERRAIN': (['Permanent Electric Terrain'], []),
    'PERMANENT ELECTRIC TERRAIN & MAGNET RISE': (['Permanent Electric Terrain', 'Permanent Magnet Rise'], []),
    'PERMANENT GRASSY TERRAIN': (['Permanent Grassy Terrain'], []),
    'PERMANENT PSYCHIC TERRAIN': (['Permanent Psychic Terrain'], []),
    'PERMANENT MISTY TERRAIN': (['Permanent Misty Terrain'], []),
    'PERMANENT TRICK ROOM': (['Permanent Trick Room'], []),
    "PERMANENT SWAMP (PLAYER'S POKEMON SPEED STAT IS QUARTERED)": (['Permanent Swamp'], [
        "Swamp: your Pokémon's Speed is quartered."]),
    'PERMANENT MAGMA STORM (FIRE TYPES ARE IMMUNE)': (['Permanent Magma Storm'], ['Magma Storm: Fire types are immune.']),
    'INVERSE BATTLE': (['Inverse Battle'], []),
    'UNABLE TO USE FAIRY TYPES': ([], ["You can't use Fairy types."]),
    "CAN'T REMOVE HAZARDS": ([], ["Hazards can't be removed."]),
    'SUPER EFFECTIVE MOVES DEAL 33% LESS TO BROCK': ([], ['Super effective moves deal 33% less to Brock.']),
    'PALAFIN IS PRE-TRANSFORMED': ([], ['Palafin starts in its Hero Form.']),
    'RIVAL HAS SERENE GRACE EFFECT': ([], ['His Pokémon have the Serene Grace effect.']),
    "ERIKA'S GRASS TYPE MOVES DEAL 75% MORE DAMAGE IF- RESISTED AND IGNORE IMMUNITIES.": ([], [
        "Erika's Grass-type moves deal 75% more damage if resisted and ignore immunities."]),
    "CHUCK'S POKEMON HAVE ENDURE STATUS IF ABOVE 75% OF MAX HP": ([], [
        "Chuck's Pokémon endure a hit while above 75% of their max HP."]),
    'JASMINE IS IMMUNE TO FIRE TYPE ATTACKS': ([], ['Jasmine is immune to Fire-type attacks.']),
    'MEWTWO MEGA EVOLVES AFTER FAINTING FOR 1ST TIME': ([], ['Mewtwo Mega Evolves after the first faint.']),
    'OMNI-BOOSTED': ([], ['Omni-boosted: +1 to every stat.']),
    '252 HP EVS': ([], []),
    'STATS CANNOT BE REDUCED': ([], ["Its stats can't be lowered."]),
    'SAFEGUARD': ([], ['Safeguard is up.']),
    'GRENINJA IS PRE-TRANSFORMED': ([], ['Greninja starts transformed.']),
    "PLAYER'S FIRST 3 SLOTS GET FROSTBITE": ([], ['Your first 3 Pokémon get frostbite.']),
    'KYUREM BECOMES KYUREM-WHITE AFTER FIRST FAINT & EARTH POWER BECOMES FUSION FLARE': ([], [
        'Kyurem becomes Kyurem-White after the first faint, and its Earth Power becomes Fusion Flare.']),
    'CRAMORANT STARTS IN GORGING FORM': ([], ['Cramorant starts in its Gorging Form.']),
    "KETCHUP'S POKEMON WILL ENDURE A HIT IF ABOVE 75% OF MAX HP": ([], [
        "Ketchup's Pokémon endure a hit while above 75% of their max HP."]),
}
PRE = {'BURNED': 'Burned', 'POISONED': 'Poisoned'}
HP_TYPES = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass',
            'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark']
DEX = {SPECIES_IDS[i]: r['dexID'] for i, r in SPECIES.items()}
T = DATA['trainers']


def _hp_type(iv):
    hp, at, df, sa, sd, sp = iv
    bits = [hp, at, df, sp, sa, sd]
    return HP_TYPES[sum((v & 1) << i for i, v in enumerate(bits)) * 15 // 63]


def _sheet_dex(name):
    p = sid(name) or sid(re.sub(r'-Mega.*$|-Primal$', '', name)) or sid(name.split('-')[0])
    return DEX.get(p)


def _team_dex(tid):
    return sorted(SPECIES[str(m['species'])]['dexID'] for m in T[tid]['hardcore'])


def _move_score(ids, block):
    mons = [m for i in ids for m in T[i]['hardcore']]
    score = 0
    for m in mons:
        best = 0
        for x in block.mons:
            if _sheet_dex(x.species) == SPECIES[str(m['species'])]['dexID']:
                best = max(best, len({move(v) for v in m['moves']} & {move(v) for v in x.moves}))
        score += best
    return score


def match_blocks():
    """Each boss block -> the data.js trainer ids whose Hardcore team it is (one trainer, or a pair for a doubles
    block of two trainers); among equal teams the best move overlap wins. Unmatched blocks map to []."""
    out, taken = {}, collections.Counter()
    for b in bosssheet.blocks():
        want = sorted(_sheet_dex(m.species) or 0 for m in b.mons)
        words = set(re.findall(r'[a-z]+', b.title.lower()))
        named = lambda i: words & set(re.findall(r'[a-z]+', T[i]['name'].lower()))
        cands = [(i,) for i in T if _team_dex(i) == want]
        cands = [c for c in cands if named(c[0])] or cands
        if not cands:
            people = [i for i in T if named(i)]
            cands = [p for p in itertools.combinations(sorted(people, key=int), 2)
                     if sorted(_team_dex(p[0]) + _team_dex(p[1])) == want]
        cands.sort(key=lambda c: -_move_score(c, b))
        if len(cands) > 1 and _move_score(cands[0], b) == _move_score(cands[1], b):
            same = [c for c in cands if _move_score(c, b) == _move_score(cands[0], b)]
            out[(b.sheet, b.row)] = sorted({i for c in same for i in c}, key=int)
        else:
            out[(b.sheet, b.row)] = list(cands[0]) if cands else []
    return out


def _link_block(link):
    sheet, cell = link.split('!')
    sheet, row = sheet.strip("'"), int(re.sub(r'\D', '', cell))
    return next(b for b in bosssheet.blocks() if b.sheet == sheet and row <= b.row <= row + 6)


def _mega(species, held):
    for how, stone, target, _ in SPECIES[str(species)].get('evolutions', []):
        if how == 254 and stone == held:
            return target
    return None


def build(D):
    caps = [c['cap'][1] for c in CAPS]
    assert bosssheet.main_caps() == ['%s (%d)' % sc for sc in zip(SPLITS, caps)], bosssheet.main_caps()
    move_index = {m: i for i, m in enumerate(D['M'])}
    ab_index = {a[0]: i for i, a in enumerate(D['AB'])}
    natures = DATA['natures']
    scaled = {int(k): v for k, v in DATA['scaledLevels'].items()}
    blocks = {(b.sheet, b.row): b for b in bosssheet.blocks()}
    matched = match_blocks()
    block_of = {}
    for bk, ids in matched.items():
        for i in ids:
            block_of.setdefault(i, bk)
    counts = collections.Counter()
    fixes = []

    # Trainer Order: split, cap (or range), optional, order
    order = bosssheet.trainer_order()
    split_of, cap_text, optional, to_pos = {}, {}, set(), {}
    split, previous_cap = 0, None
    linked = [matched[(lambda b: (b.sheet, b.row))(_link_block(e.link))] for e in order]
    direct = {i for ids in linked for i in ids}
    for n, (e, ids) in enumerate(zip(order, linked)):
        assert ids, e
        first = T[ids[0]]
        # the fight's other teams (starter, team one / two, the rematch): same trainer, place and cap, no entry of its own
        alts = [i for i in T if i not in direct and i in block_of and T[i]['name'] == first['name'] and
                T[i]['areaName'] == first['areaName'] and T[i]['cap'] == first['cap']]
        cap = e.cap if e.cap != '' else previous_cap      # blank: as the fight before (Shelly after Sam, Ariana)
        previous_cap = cap
        # A number is the only cap the fight is at (F3's comment): its split, even where the entry sits after that
        # split's boss (Lewis 73 after May). A range / open cap ("28/36", "36+") is fought at the player's cap: the
        # entry's place in the order is the sheet's recommended split.
        where = caps.index(cap) if isinstance(cap, int) else split
        if where != split:
            fixes.append('Trainer Order row %d %s: cap %d, listed in %s: in %s' % (
                e.row, e.name, cap, SPLITS[split], SPLITS[where]))
        for i in ids + alts:
            assert i not in split_of, (i, e)
            split_of[i], cap_text[i], to_pos[i] = where, cap, n
            if e.optional:
                optional.add(i)
        if split < len(ENDERS) and e.name == ENDERS[split]:
            for i in ids:
                assert T[i]['cap'] == split, (e, i, T[i]['cap'])
            split += 1
    assert split == len(ENDERS), split
    for i in REMATCHES:
        cap_text[i] = '59/68'
        optional.discard(i)
    moved = sorted((i for i in split_of if T[i]['cap'] != split_of[i]), key=int)
    for i in moved:
        report('  trainers: Trainer Order puts %s (%s) in %s, data.js cap %d' % (
            T[i]['name'], i, SPLITS[split_of[i]], caps[T[i]['cap']]))
    for i in T:
        split_of.setdefault(i, T[i]['cap'])

    # labels, effects
    st_of, tags_of, notes_of, pre_of = {}, collections.defaultdict(list), collections.defaultdict(list), {}
    unknown_effects = []
    for bk, ids in matched.items():
        b = blocks[bk]
        for label in b.labels:
            m = re.fullmatch(r'IF RIVAL HAS (\w+)', label)
            for i in ids:
                if m:
                    pass        # the team's starter line decides (below); the label is the check
                elif label in TEAM_WORDS:
                    word = TEAM_WORDS[label]
                    alts = sum(1 for x in blocks.values() if x.title == b.title and
                               any(w in TEAM_WORDS for w in x.labels))
                    tags_of[i].append('%s team (1 of %d)' % (word, alts) if isinstance(word, str)
                                      else 'Team %d of %d' % (word, alts))
                elif label in LABEL_NOTES or label in LABEL_TAGS:
                    if label in LABEL_TAGS:
                        tags_of[i].append(LABEL_TAGS[label])
                    if label in LABEL_NOTES:
                        notes_of[i].append(LABEL_NOTES[label])
                elif 'BACK TO BACK' not in label:
                    unknown_effects.append((bk, label))
        for effect in b.effects:
            for part in re.split(r'\s*\+\s*', re.sub(r'\s+', ' ', effect).strip()):
                m = re.fullmatch(r'(\S+) IS PRE-(BURNED|POISONED)', part)
                if m:
                    for i in ids:
                        for x, mon in enumerate(T[i]['hardcore']):
                            if sid(str(mon['species'])).startswith(m[1].lower()):
                                pre_of[(i, x)] = PRE[m[2]]
                    continue
                part = part.upper()
                if part not in EFFECTS:
                    unknown_effects.append((bk, part))
                    continue
                tags, notes = EFFECTS[part]
                for i in ids:
                    tags_of[i] += [t for t in tags if t not in tags_of[i]]
                    notes_of[i] += notes
    assert not unknown_effects, unknown_effects
    for chain in CHAINS:
        for n, i in enumerate(chain):
            tags_of[i].append('Back to Back #%d' % (n + 1))
    for i in REMATCHES:
        notes_of[i].append(REMATCH_NOTE)

    def mon_of(i, x, m, cap, relative):
        pid = sid(str(m['species']))
        out = dict(id=pid)
        lv = m['level']
        if lv in scaled:
            if relative:
                out['r'] = scaled[lv]
            else:
                out['l'] = cap + scaled[lv]
        else:
            out['l'] = lv
        held = m.get('item')
        if held:
            out['i'] = item(held)
            assert out['i'], (i, held)
        abilities = SPECIES[str(m['species'])]['abilities']
        slot = m['ability']
        if slot > 2 or not abilities[slot][0]:
            slot = 1        # an empty slot (or 3) is the primary ability (RR calc / hzla agree)
        name = ability(abilities[slot])
        mega = _mega(m['species'], held) if held else None
        if mega:
            out['id'] = SPECIES_IDS[str(mega)]
            out['a0'] = ab_index[name]
            name = ability(SPECIES[str(mega)]['abilities'][1])
        out['a'] = ab_index[name]
        out['na'] = natures[str(m['nature'])]
        out['iv'] = list(m['IVs'])
        if any(m['EVs']):
            out['ev'] = list(m['EVs'])
        out['m'] = [move_index[move(v)] for v in m['moves'] if v]
        if any(move(v) == 'Hidden Power' for v in m['moves']):
            out['hp'] = _hp_type(m['IVs'])
        if (i, x) in pre_of:
            out['pre'] = [pre_of[(i, x)]]
        return out

    area_of = {}
    for a, rec in enumerate(DATA['areas']):
        for ids in (rec.get('trainers') or {}).values():
            for t in ids:
                area_of.setdefault(str(t), []).append(a)
    names = {}
    for a, rec in enumerate(DATA['areas']):
        names.setdefault(rec['name'], a)

    def area_index(i):
        own = [a for a in area_of.get(i, []) if DATA['areas'][a]['name'] == T[i]['areaName']]
        return min(own) if own else names.get(T[i]['areaName'], len(DATA['areas']))

    groups = [dict(n='%s [Cap %d]' % (n, c), cap=c, tab='', sec=[]) for n, c in zip(SPLITS, caps)]
    cards = collections.defaultdict(list)
    relative = []
    partner_of = {f: p for p, fs in PARTNERS.items() for f in fs}
    battles = {}
    for bk, ids in matched.items():
        if len(ids) == 2 and all(i in T for i in ids) and 'Double Battle' in tags_of[ids[0]]:
            for i in ids:
                battles[i] = 'rr-%s' % '-'.join(ids)
    for i, t in T.items():
        if i in PARTNERS or i in SAME_TEAM:
            continue
        s = split_of[i]
        cap = caps[s]
        rel = isinstance(cap_text.get(i), str)
        team = [mon_of(i, x, m, cap, rel) for x, m in enumerate(t['hardcore'])]
        if rel and any('r' in m for m in team):
            relative.append(i)
        card = dict(k='', n=t['name'], loc=t['areaName'], tags=[], note=list(notes_of[i]), p=team, cap=cap, id=i)
        if i in optional:
            card['tags'].append('Optional')
        card['tags'] += tags_of[i]
        line = next((s_ for s_, ids in LINES.items() if any(m['id'] in ids for m in team)), None)
        if t['name'] in ('Rival Blue', 'Champion Blue') and line:
            card['st'] = RIVAL_STARTER[line]
        if i in partner_of:
            p = partner_of[i]
            card['pt'] = [dict(n=T[p]['name'], p=[mon_of(p, x, m, cap, False)
                                                  for x, m in enumerate(T[p]['hardcore'])])]
        if i in battles:
            card['bt'] = battles[i]
        if isinstance(cap_text.get(i), str) and rel:
            counts['cap box'] += 1
        cards[s].append((area_index(i), to_pos.get(i, -1), block_of.get(i, ('', 0))[1], int(i), card))
        counts['cards'] += 1
    for s, rows in cards.items():
        rows.sort(key=lambda r: r[:4])
        secs = []
        for a, _, _, _, card in rows:
            if not secs or secs[-1][0] != a:
                secs.append((a, dict(h=card['loc'], tr=[])))
            secs[-1][1]['tr'].append(card)
        groups[s]['sec'] = [sec for _, sec in secs]
    for gi, g in enumerate(groups):
        for si, sec in enumerate(g['sec']):
            for ti, t in enumerate(sec['tr']):
                t['k'] = '%d.%d.%d' % (gi, si, ti)
    D['TR'] = dict(g=groups, caps=[[n, c] for n, c in zip(SPLITS, caps)])

    # starter check: the sheet's "IF RIVAL HAS X" label agrees with the team's line
    for bk, ids in matched.items():
        for label in blocks[bk].labels:
            m = re.fullmatch(r'IF RIVAL HAS (\w+)', label)
            if m:
                for i in ids:
                    team = {sid(str(x['species'])) for x in T[i]['hardcore']}
                    assert team & LINES[m[1].lower()], (bk, i)
    accounted = counts['cards'] + len(PARTNERS) + len(SAME_TEAM)
    assert accounted == len(T) == 464, (accounted, len(T))
    sheet_only = [bk for bk, ids in matched.items() if not ids]
    STATS.update(dict(cards=counts['cards'], partners=len(PARTNERS), same=len(SAME_TEAM), relative=relative,
                      cap_box=counts['cap box'], moved=moved, split_of=split_of, sheet_only=sheet_only,
                      matched=matched, to=len(order)))
    report('trainers: %d data.js trainers = %d cards + %d partners + %d same-team alternatives; %d splits' %
           (len(T), counts['cards'], len(PARTNERS), len(SAME_TEAM), len(groups)))
    report('trainers: Trainer Order %d entries; %d cards with the cap box (%d relative mons); %d boss blocks, %d '
           'matched, %d sheet only' % (len(order), counts['cap box'],
                                         sum(1 for i in relative for m in T[i]['hardcore'] if m['level'] in scaled),
                                         len(matched), len(matched) - len(sheet_only), len(sheet_only)))
    for bk in sheet_only:
        report('  sheet only: %s!C%d %s' % (bk[0], bk[1], blocks[bk].title))
    for f in fixes:
        report('  trainers: %s' % f)

"""The second and third checks of the boss teams (D2): the Hardcore workbook, the RR calc's hardcore.js, hzla's radredhc.js.

    sheet_diffs(tid, block)  data.js trainer vs its workbook block: {mon index: ["Sheet says ...", ...]}, unmatched slots
    calc_sets() / hzla_sets() {trainer name key: [(P id, set)]} from the two JS files (JSON object literals)
    set_diffs(mon, ours, sets, ...) the fields of one data.js mon a set disagrees on

The sheet abbreviates ("Thous. Arrows", "Pow-Up Punch", "Weakness Pol.", "HP Fire"): a sheet word matches when it is a
prefix of the data's word, word by word. Levels: "Highest Lv [-N]" / "Player Max Level" = the scaled codes 103..104
(cap - N), a number = an absolute level.
"""
from functools import lru_cache
from pathlib import Path
import difflib
import json
import re

from common import DATA, SPECIES, SPECIES_IDS, H, key, sid, move, ability, item

SCALED = {int(k): v for k, v in DATA['scaledLevels'].items()}
DEX = {SPECIES_IDS[i]: r['dexID'] for i, r in SPECIES.items()}


def words(s):
    return [w for w in re.split(r'[\s\-]+', str(s).replace('.', ' ').strip().lower()) if w]


# The game's own (12-13 character) item names the sheet / calc spell in full
MOVE_ALIASES = {'supercellslam': 'soupercellslam'}       # data.js spells it Soupercell Slam
ITEM_ALIASES = {'houndoominite': 'houndoomnite', 'abomasnite': 'abomasite', 'rustedshield': 'rustyshield',
                'rustedsword': 'rustysword', 'ultranecroziumz': 'necroziumz', 'leek': 'leekstick'}


def same(sheet, ours):
    """Does the sheet's (maybe abbreviated) text name ours? "A or B" matches either; a trailing "(Both)" / "(Dusk)"
    is dropped; "As One" matches either As One."""
    sheet = re.sub(r'\s*\((?:Both|Dusk|Wings|Ultra|Mega)\)$', '', str(sheet)).strip()
    if ' or ' in sheet:
        return any(same(part, ours) for part in sheet.split(' or '))
    if ours is not None and key(sheet) == 'asone' and key(ours).startswith('asone'):
        return True
    if ours is not None and key(ours) in (ITEM_ALIASES.get(key(sheet)), MOVE_ALIASES.get(key(sheet))):
        return True
    if ours is None:
        return key(sheet) in ('', 'noitem', 'none', 'noability')
    if key(sheet) == key(ours):
        return True
    a, b = words(sheet), words(ours)
    if len(a) == len(b) and all(y.startswith(x) for x, y in zip(a, b)):
        return True
    if key(sheet).replace('pow', 'power') == key(ours):
        return True
    # a sheet typo ("Eathquake"): one letter off a long name
    return len(key(ours)) > 7 and difflib.SequenceMatcher(None, key(sheet), key(ours)).ratio() >= 0.94


def _js_object(path):
    s = Path(path).read_text(encoding='utf-8')
    return json.loads(s[s.index('{'):s.rindex('}') + 1])


@lru_cache(maxsize=1)
def calc_sets():
    out = {}
    for sp, sets in _js_object(Path(H.src) / 'repos/damage-calc/src/js/data/sets/hardcore.js').items():
        for label, st in sets.items():
            out.setdefault(key(label.lstrip('*')), []).append((sid(sp), sp, st))
    return out


@lru_cache(maxsize=1)
def hzla_sets():
    out = {}
    for sp, sets in _js_object(Path(H.src) / 'repos/Dynamic-Calc-Decomps/backups/radredhc.js').items():
        for label, st in sets.items():
            m = re.match(r'Lvl -?\d+ (.*?)\s*(?:#\d+)?\s*$', label)
            if m:
                out.setdefault(key(m[1]), []).append((sid(sp), sp, st))
    return out


def dex(pid):
    return DEX.get(pid)


def level_text(code):
    if code in SCALED:
        return 'Highest Lv' + (' %d' % SCALED[code] if SCALED[code] else '')
    return 'Lv %d' % code


def sheet_level(text):
    if isinstance(text, (int, float)):
        return int(text)
    t = str(text)
    if re.fullmatch(r'Highest Lv|Player Max Level', t):
        return 103
    m = re.fullmatch(r'Highest Lv -(\d)', t)
    if m:
        return {1: 102, 2: 101, 3: 104}[int(m[1])]
    return None


def mon_view(m):
    """One data.js Hardcore mon as names: species P id, mega P id, level code, nature, ability (pre-Mega), Mega
    ability, item, moves, Hidden Power type."""
    from trainers import _mega, _mega_ability, _hp_type
    abilities = SPECIES[str(m['species'])]['abilities']
    slot = m['ability'] if m['ability'] <= 2 and abilities[min(m['ability'], 2)][0] else 1
    held = m.get('item')
    mega = _mega(m)
    moves = [move(v) for v in m['moves'] if v]
    return dict(id=sid(str(m['species'])), mega=SPECIES_IDS[str(mega)] if mega else None, level=m['level'],
                nature=DATA['natures'][str(m['nature'])], ability=ability(abilities[slot]),
                mega_ability=_mega_ability(m, mega) if mega else None,
                item=item(held) if held else None, moves=moves,
                hp=_hp_type(m['IVs']) if 'Hidden Power' in moves else None)


def _moves_same(sheet_moves, v):
    left = list(v['moves'])
    out = []
    for s in sheet_moves:
        h = re.fullmatch(r'HP (\w+)', s)
        hit = next((x for x in left if (x == 'Hidden Power' and h and v['hp'] and h[1].lower() == v['hp'].lower())
                    or same(s, x)), None)
        if hit is None:
            out.append(s)
        else:
            left.remove(hit)
    return out, left


def sheet_diffs(tid, block):
    """The sheet's block vs data.js trainer tid: per mon index the "Sheet says" texts; sheet slots with no mon."""
    team = DATA['trainers'][tid]['hardcore']
    views = [mon_view(m) for m in team]
    slots = list(block.mons)
    out, missing = {}, []
    for x, v in enumerate(views):
        cands = [s for s in slots if dex(sid(s.species) or sid(re.sub(r'-Mega.*$', '', s.species)) or
                                         sid(s.species.split('-')[0])) == dex(v['id'])]
        if not cands:
            continue
        s = max(cands, key=lambda s: len(_moves_same(s.moves, v)[1]) * -1)
        slots.remove(s)
        diffs = []
        lv = sheet_level(s.level)
        if lv != v['level']:
            diffs.append('%s (%s)' % (s.level if not isinstance(s.level, float) else 'Lv %d' % s.level, s.cell))
        if s.nature and s.nature != v['nature']:
            diffs.append('%s (%s)' % (s.nature, s.cell))
        if s.ability and not same(s.ability, v['ability']) and not same(s.ability, v['mega_ability'] or ''):
            diffs.append('ability %s' % s.ability)
        if s.ability_mega and v['mega_ability'] and not same(s.ability_mega, v['mega_ability']):
            diffs.append('Mega ability %s' % s.ability_mega)
        if not same(s.item, v['item']) and not (v['item'] is None and s.item in ('', '-')):
            diffs.append('item %s' % (s.item or 'none'))
        extra, _ = _moves_same(s.moves, v)
        if extra:
            diffs.append('moves %s' % ', '.join(extra))
        if diffs:
            out[x] = diffs
    missing = [s.cell for s in slots]
    return out, missing


def set_diffs(v, st, levels):
    """One calc / hzla set vs a mon view: the fields it disagrees on, worded "level 47", "Adamant", ...
    levels(code) gives the levels a set may show for the mon's level code: the calc stores a scaled level at some cap
    (cap + offset), hzla the offset (0, -1, ...) or the level at a cap."""
    out = []
    lv = st.get('level')
    if lv is not None and lv not in levels(v['level']):
        out.append('level %s' % lv)
    if st.get('nature') and st['nature'] != v['nature']:
        out.append(st['nature'])
    theirs = st.get('ability')
    if theirs and not any(same(theirs, x) or ability(theirs) == x for x in (v['ability'], v['mega_ability']) if x):
        out.append('ability %s' % theirs)
    theirs = st.get('item') or ''
    if not (same(theirs, v['item']) or theirs and item(theirs) == v['item']):
        out.append('item %s' % (theirs or 'none'))
    extra = [m for m in st.get('moves', []) if m and not any(
        same(m, x) or move(m) == x or (x == 'Hidden Power' and m.startswith('Hidden Power')) for x in v['moves'])]
    if extra:
        out.append('moves %s' % ', '.join(extra))
    return out


def compare(matched, blocks, caps):
    """Every boss team (a trainer with a workbook block) against the sheet, the RR calc and hzla.
    Returns ({(trainer id, mon index): {'cf': [...], 'hn': [...]}}, report lines, counts). The sheet's differences go
    on the card ("Sheet says"); hzla's ("hzla says") where its set is a sure join (two moves shared) and the sheet
    disputes that mon too; the rest, and the calc's, to the report only."""
    out, lines, counts = {}, [], dict(sheet=0, sheet_diff=0, calc=0, calc_diff=0, hzla=0, hzla_diff=0, missing=0)
    trainers = DATA['trainers']

    def levels(code):
        if code in SCALED:
            return {SCALED[code]} | {k + SCALED[code] for k in caps}
        return {code} | {code - k for k in caps if -3 <= code - k <= 0}

    bosses = []
    for bk, ids in matched.items():
        for tid in ids:
            bosses.append(tid)
            diffs, missing = sheet_diffs(tid, blocks[bk])
            counts['sheet'] += len(trainers[tid]['hardcore'])
            if missing and len(ids) == 1:
                counts['missing'] += len(missing)
                lines.append('sheet slots with no data.js mon: %s %s %s' % (tid, trainers[tid]['name'], missing))
            for x, ds in diffs.items():
                counts['sheet_diff'] += 1
                out.setdefault((tid, x), {}).setdefault('cf', []).extend(re.sub(r' \([^)]*!\w+\)$', '', d) for d in ds)
                lines.append('Sheet says: %s %s #%d: %s' % (tid, trainers[tid]['name'], x + 1, '; '.join(ds)))
    for which, sets in (('calc', calc_sets()), ('hzla', hzla_sets())):
        for tid in dict.fromkeys(bosses):
            t = trainers[tid]
            for x, m in enumerate(t['hardcore']):
                v = mon_view(m)
                cands = [c for c in sets.get(key(t['name']), []) if dex(c[0]) == dex(v['id'])]
                if not cands:
                    continue
                st = min(cands, key=lambda c: len(set_diffs(v, c[2], levels)))[2]
                st = dict(st, moves=[mv for mv in st.get('moves', []) if mv and mv != '(No Move)'])
                ds = set_diffs(v, st, levels)
                counts[which] += 1
                if not ds:
                    continue
                counts[which + '_diff'] += 1
                shared = sum(1 for mv in st['moves'] if any(same(mv, y) or move(mv) == y for y in v['moves']))
                # hzla on the card only where the sheet disputes data.js too (its ability slots often differ from
                # both: report only)
                shown = which == 'hzla' and shared >= 2 and 'cf' in out.get((tid, x), {})
                lines.append('%s says: %s %s #%d %s: %s%s' % (which, tid, t['name'], x + 1, v['id'], '; '.join(ds),
                                                              ' (shown)' if shown else ''))
                if shown:
                    out.setdefault((tid, x), {}).setdefault('hn', []).extend(ds)
    return out, lines, counts

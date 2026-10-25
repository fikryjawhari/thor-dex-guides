"""The Emerald Imperium dex site's data (miriamlefae/eidex, .src/repos/eidex.zip) and which of its species and forms the
guide keeps. Imported by dex.py, locs.py and trainers.py; loads once.

Species: forms banned from the guide (totem, gigantamax, tera) are dropped; cosmetic duplicates (same dex number, types,
stats, abilities and level-up moves) fold into the lowest id (canon). NAME is each kept species' display name.
Showdown (.src/repos/showdown, tools/showdown.js) gives each move's Gen 9 values, SD, and the ability names, SDA.
"""
import json, re, zipfile
from common import H, SRC, key, report

_zip = zipfile.ZipFile(SRC + '/repos/eidex.zip')
_root = _zip.namelist()[0].split('/')[0]
J = lambda f: json.loads(_zip.read(f'{_root}/src/data/{f}.json').decode('utf-8'))
S, MD, AD, ID, TD = J('speciesData'), J('moveData'), J('abilityData'), J('itemData'), J('typeData')
LBL, WE = J('speciesLabelMap'), J('wild_encounters')['wild_encounter_groups']
_sd = H.showdown('repos/showdown')
SD = {key(m['name']): {'pr': m['priority'], 'bp': m['basePower'], 'ac': None if m['accuracy'] is True else m['accuracy'],
                       'pp': m['pp'], 't': m['type'], 'c': m['category']} for m in _sd['moves'].values()}
SDA = {key(a['name']): a['name'] for a in _sd['abilities'].values()}
TN = {int(k): v['typeName'] for k, v in TD.items()}


def _crit_stages():
    """Crit stage per move name from the game's source (.src/repos/expansion/moves_info.h at the release's pin; eidex
    has no crit field): .criticalHitStage, 6 for .alwaysCriticalHit. The one config condition (Sky Attack,
    B_UPDATED_MOVE_DATA >= GEN_3) is true: the release sets GEN_LATEST."""
    out = {}
    for entry in open(SRC + '/repos/expansion/moves_info.h', encoding='utf-8').read().split('\n    [MOVE_')[1:]:
        name = re.search(r'\.name = COMPOUND_STRING\("([^"]*)"\)', entry)
        stage = re.search(r'\.criticalHitStage = ([^,]+),', entry)
        cr = 6 if '.alwaysCriticalHit = TRUE' in entry else (
            1 if stage and stage[1] == 'B_UPDATED_MOVE_DATA >= GEN_3' else int(stage[1]) if stage else 0)
        if name and cr: out[key(name[1])] = cr
    return out


CR = _crit_stages()
item = lambda i: ID.get(str(i), {}).get('Name', f'item {i}')

# ---------- 1. choose which species/forms to keep
BANNED = {'totem', 'gigantamax', 'tera'}
sp = {int(k): v for k, v in S.items()}
cand = [v for v in sp.values() if not (set(v['forms'] or []) & BANNED)]
# collapse cosmetic forms: same dex number + identical types, stats, abilities and level-up moves -> keep lowest id
sig = {}; alias = {}
for v in sorted(cand, key=lambda v: v['speciesId']):
    k = (v['dexId'], tuple(v['types']), tuple(v['stats']), tuple(v['abilities']), tuple(map(tuple, v['levelUpMoves'])))
    if k in sig: alias[v['speciesId']] = sig[k]
    else: sig[k] = v['speciesId']
keep = {v['speciesId'] for v in cand if v['speciesId'] not in alias}
canon = lambda i: alias.get(i, i)
report(f'species {len(sp)}, banned forms {len(sp)-len(cand)}, cosmetic duplicates folded {len(alias)}, kept {len(keep)}')

# ---------- 2. display names
REG = {'Alola': 'Alolan', 'Galar': 'Galarian', 'Hisui': 'Hisuian', 'Paldea': 'Paldean'}
def disp(v):
    n, k = v['speciesName'], v['nameKey']
    forms = v['forms'] or []
    base_k = sp.get(v['dexId'], {}).get('nameKey', '')
    suf = k[len(base_k):].lstrip('-') if k.startswith(base_k) and k != base_k else ''
    if not suf:
        m = re.match(r'^[^-]+(?:-(?:Oh|Z|Jr|Mime|O|Koko|Lele|Bulu|Fini|Chien|Pao|Lu|Yu))?-(.*)$', k)
        suf = m.group(1) if (m and v['formId']) else ''
    if 'mega' in forms:
        x = re.sub(r'^Mega-?', '', suf)
        return f'Mega {n}' + (f' {x}' if x else '')
    if 'primal' in forms: return f'Primal {n}'
    parts = suf.split('-') if suf else []
    if parts and parts[0] in REG:
        rest = ' '.join(parts[1:])
        return f'{REG[parts[0]]} {n}' + (f' ({rest})' if rest else '')
    if suf and v['formId']:
        suf = {'M': 'Male', 'F': 'Female', 'Phd': 'PhD'}.get(suf, suf)
        return f'{n} ({suf.replace("-", " ")})'
    return n
# base forms with a form suffix (Lycanroc-Midday, Toxtricity-Amped) get it shown when another form is kept
dexcount = {}
for i in keep: dexcount[sp[i]['dexId']] = dexcount.get(sp[i]['dexId'], 0) + 1
NAME = {}
for i in keep:
    v = sp[i]; n = disp(v)
    if not v['formId'] and dexcount[v['dexId']] > 1 and '-' in v['nameKey'] and v['nameKey'] not in ('Nidoran-F','Nidoran-M','Mr-Mime','Mime-Jr','Ho-Oh','Porygon-Z','Jangmo-O','Hakamo-O','Kommo-O','Wo-Chien','Chien-Pao','Ting-Lu','Chi-Yu') and not v['nameKey'].startswith('Tapu'):
        x = v['nameKey'].split('-',1)[1]; x = {'M': 'Male', 'F': 'Female'}.get(x, x)
        n = f"{v['speciesName']} ({x.replace('-', ' ')})"
    NAME[i] = n

MEGA = {i for i in keep if set(sp[i]['forms'] or []) & {'mega', 'primal'}}
# forms you switch into with an item, in battle or by a move follow the base form's availability
CHANGE = {351,421,386,479,487,492,493,483,484,555,641,642,645,905,646,647,648,658,681,718,720,746,773,774,778,800,845,875,877,888,889,890,898,964,1017,1024}
FC = {i for i in keep if sp[i]['formId'] and sp[i]['dexId'] in CHANGE and not (set(sp[i]['forms'] or []) & {'mega','primal'})}

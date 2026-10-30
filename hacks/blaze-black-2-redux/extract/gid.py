"""B2W2 IDs -> BB2R guide names, after finalise has fixed M/AB indices.

gen5-ids.json is the factual PKHeX.Core 26.10.18 English-name/personal-data export described in
template/calc/readers/README.md -> gen5. forms rows are [national species, form, growth rate].
No NuGet/.NET dependency at build time. Unrepresented battle forms stay unmapped, not the wrong type.
"""
import json
import re
from pathlib import Path

from common import doc, drayano, report

FORM_IDS = {
    'Deoxys': ['deoxys_attack', 'deoxys_defense', 'deoxys_speed'],
    'Wormadam': ['wormadam_sandy', 'wormadam_trash'],
    'Rotom': ['rotom_heat', 'rotom_wash', 'rotom_frost', 'rotom_fan', 'rotom_mow'],
    'Giratina': ['giratina_origin'], 'Shaymin': ['shaymin_sky'],
    'Shellos': ['shellos_east_sea'], 'Gastrodon': ['gastrodon_east_sea'],
    'Basculin': ['basculin_blue_striped'], 'Darmanitan': ['darmanitan_zen'],
    'Tornadus': ['tornadus_therian'], 'Thundurus': ['thundurus_therian'], 'Landorus': ['landorus_therian'],
    'Kyurem': ['kyurem_white', 'kyurem_black'], 'Meloetta': ['meloetta_pirouette'],
}
# PKHeX's current English item names -> BB2R's. The reused slots come from Item Changes ("Modified Items"):
# Red Scarf -> Ice Stone, Oval Stone -> Link Cable. Old Sea Map reuses an unused vanilla slot ("God/Grey Stone")
# PKHeX has no name for, so it stays unmapped (a key item: never held, never in a party).
GAME_ITEMS = {'Bike': 'Bicycle', 'Leek': 'Stick', 'Red Scarf': 'Ice Stone', 'Oval Stone': 'Link Cable',
              'Dropped Item (M)': 'Dropped Item', 'Dropped Item (F)': 'Dropped Item',
              **{f'{wing} Feather': f'{wing} Wing' for wing in
                 ('Health', 'Muscle', 'Resist', 'Genius', 'Clever', 'Swift', 'Pretty', 'Lunar')}}


def item_names(names):
    """Game item names as the guide names them; TMs / HMs by number (the guide's row is "TM04 Calm Mind")."""
    return [GAME_ITEMS.get(name, name) for name in names]


def item_key(name):
    machine = re.match(r'([TH]M\d\d)(?: |$)', name)
    return machine[1] if machine else name


def tables():
    return json.loads(Path(__file__).with_name('gen5-ids.json').read_text(encoding='utf-8'))


def normal(kind, name):
    for mapping in (drayano.ALIASES.get(kind, {}), drayano.TYPOS.get(kind, {})):
        lookup = {drayano.key(old): new for old, new in mapping.items()}
        name = lookup.get(drayano.key(name), name)
    return drayano.key(name)


def replacements(ids):
    moves = {normal('move', name): index for index, name in enumerate(ids['moves']) if index}
    return {moves[normal('move', old)]: new for old, new, _ in drayano.move_changes(doc('Move Changes')).replacements}


def build(data):
    ids = tables()
    base = {normal('species', pokemon['n']): pokemon['id'] for pokemon in data['P']}
    available = {pokemon['id'] for pokemon in data['P']}
    species, growth, missing = {}, {}, []
    for dex, form, rate in ids['forms']:
        name = ids['species'][dex]
        key = f'{dex}:{form}'
        target = base.get(normal('species', name))
        if form and name in FORM_IDS:
            forms = FORM_IDS[name]
            target = forms[form - 1] if form <= len(forms) else None
        elif form and name in ('Castform', 'Arceus'):
            target = None
        if target in available:
            species[key] = target
            growth[key] = rate
        else:
            missing.append(f'{key} {name}')
    report(f'GID species: {len(species)} species:form keys; {len(set(species.values()))}/{len(available)} P ids;'
           f' {sum(f"{dex}:0" in species for dex in range(1, 650))}/649 base species')
    report('GID unmapped species: ' + (', '.join(missing) or 'none'))

    def indexed(kind, names, targets, replace=None):
        lookup = {normal(kind, name): value for name, value in targets}
        out = [None] * len(names)
        for index, name in enumerate(names):
            if index:
                out[index] = lookup.get(normal(kind, (replace or {}).get(index, name)))
        mapped = {value for value in out if value is not None}
        missing = [name for name, value in targets if value not in mapped]
        report(f'GID {kind}: {len(mapped)}/{len(lookup)} guide names; unmapped: ' + (', '.join(missing) or 'none'))
        return out

    replace = replacements(ids)
    moves = indexed('move', ids['moves'], list(zip(data['M'], range(len(data['M'])))), replace)
    abilities = indexed('ability', ids['abilities'], [(ability[0], index) for index, ability in enumerate(data['AB'])])
    import items as item_extract         # IT leaves out medicine, balls and the like (items.NOT_LISTED): map them too
    items = list(dict.fromkeys([row[0] for section in data.get('IT', []) for row in section['r']] + item_extract.UNLISTED))
    item_ids = indexed('item', item_names(ids['items']), [(item_key(name), name) for name in items])
    if not items:
        report('GID items: IT empty; all 638 game item names deferred until the items unit merges')
    report(f'GID move replacements: {len(replace)}/{len(replace)} original slots mapped')
    data['GID'] = {'sp': species, 'mv': moves, 'ab': abilities, 'it': item_ids, 'gr': growth}

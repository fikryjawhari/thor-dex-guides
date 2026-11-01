"""P.hi (wild held items) from extract/held_items.json (written from the user's ROM by held_items.py).

Slot 1 50%, slot 2 5%, slot 3 1% (Gen 5); the same item in slots 1 and 2 = 100%, one entry per item (the rule in
plans/item-pages-data.md (deleted 2026-11-02, in git history) → Wild held item odds). The keys are gen5-ids forms rows, mapped to P ids by gid.species_map.
"""
import json
from pathlib import Path

import gid
from common import report

HERE = Path(__file__).resolve().parent
RATES = (50, 5, 1)


def odds(names):
    """[[item, %]] from the three slot names (None = empty)."""
    if names[0] and names[0] == names[1]:
        return [[names[0], 100]]
    out = {}
    for name, rate in zip(names, RATES):
        if name:
            out[name] = out.get(name, 0) + rate
    return [[name, rate] for name, rate in out.items()]


def build(data):
    held = json.loads((HERE / 'held_items.json').read_text(encoding='utf-8'))['held']
    species, _, missing = gid.species_map(data)
    byid = {pokemon['id']: pokemon for pokemon in data['P']}
    items = gid.item_names(gid.tables()['items'])
    for pokemon in data['P']:
        pokemon.pop('hi', None)
    shown, dropped = [], []
    for key, slots in held.items():
        target = species.get(key)
        if target is None:
            dropped.append(key)
            continue
        names = [items[slot] if slot else None for slot in slots]
        byid[target]['hi'] = odds(names)
        shown.append(f'{target} {byid[target]["hi"]}')
    report(f'held items: {len(shown)} P entries: ' + '; '.join(shown))
    report('held items with no P entry (not shown): ' + (', '.join(dropped) or 'none'))

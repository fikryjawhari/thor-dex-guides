"""Dex (M, MV, AB, P, TC): Pokemon, moves, abilities and the type chart from the game data.

dex-rebalanced.json (tools/ctr_dex.py on the hack's romfs + code.ips) is the source; dex-vanilla.json (the same tool
on vanilla Pokemon X v1.0) gives the move change notes (MV.h).
Forms: unnamed forms are dropped; cosmetic duplicates (same types, stats, abilities and level-up moves as a lower
form of the same species: Unown, Vivillon, the Flabebe line, Furfrou...) fold into that form. SPEC maps every
(species id, form) to the P id it ended up as, for the wild, trainer and item stages.
"""
from common import load, report, text
from ctrguide import build_dex, parse_move_doc

def evo_text(e):
    m, it = e['method'], e.get('item')
    lv = f"Lv {e['level']}" if e.get('level') else 'level up'
    t = {
        'Level': lv, 'Level (day)': lv + ', day', 'Level (night)': lv + ', night', 'Level (dusk)': lv + ', dusk (Own Tempo)',
        'Level (male)': lv + ', male', 'Level (female)': lv + ', female', 'Level (female, form 1)': lv + ', female',
        'Use item': f'use {it}', 'Use item (male)': f'use {it} (male)', 'Use item (female)': f'use {it} (female)',
'Friendship': 'high friendship',
        'Friendship (day)': 'high friendship, day', 'Friendship (night)': 'high friendship, night',
        'Hold item (day)': f'level up holding {it}, day', 'Hold item (night)': f'level up holding {it}, night',
        'Trade holding': f'trade holding {it}', 'Trade': 'trade', 'Know move': f"level up knowing {e.get('move')}",
        'Level with party member': f"level up with {e.get('with')} in the party", 'Level at magnetic field':
        'level up at Route 13 (magnetic field)', 'Trade for Shelmet/Karrablast': 'trade for Shelmet/Karrablast',
        'Affection and know move type':
        f"high affection knowing a {e.get('type')} move", 'Level (Atk < Def)': lv + ', Atk < Def',
        'Level (Atk > Def)': lv + ', Atk > Def', 'Level (Atk = Def)': lv + ', Atk = Def', 'Level (personality 1)':
        lv + ' (random)', 'Level (personality 2)': lv + ' (random)', 'Level (Ninjask)': lv,
        'Beauty': 'level up with max Beauty', 'Level with party type': f"{lv} with a {e.get('type')} type in the party",
        'Level holding 3DS upside down': lv + ', 3DS upside down', 'Level in rain': lv + ' in rain',
    }.get(m)
    if t is None:
        report('evolution method not described:', m, e)
        t = m
    return t


def evolution_rows(species, all_species):
    """Apply the base Pumpkaboo evolution rows to XY's blank size-form rows."""
    rows = species['evolutions']
    if species['form'] and any(not row['into'] for row in rows):
        base = next(base for base in all_species if base['id'] == species['id'] and not base['form'])
        rows = [dict(row, form=species['form']) for row in base['evolutions']]
    return rows


def build(data):
    build_dex(data, load('dex-rebalanced.json'), load('dex-vanilla.json'),
              move_notes=parse_move_doc(text('Move Changes')), evolution_text=evo_text,
              evolution_rows=evolution_rows, report=report)

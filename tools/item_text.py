"""Item names and item text for every guide (extractlib.finalise runs apply() before schema.standardise).

    import item_text; item_text.apply(D, hack, report)     # idempotent, in place

Names: one spelling per item. The key (letters and digits, accents folded, case and punctuation ignored, so
King's Rock = Kings Rock = KingsRock) groups the spellings; the spelled-out one wins (Silver Powder over the game's
squeezed SilverPowder), then the Items tab's (IT), then the most used.
ALIASES holds the real misspellings. Renamed in IT, WK (np and stop rows), P.hi, P.stone, trainer Pokémon `i`, MI `i`
and IX keys.

IX {item: [description, in-battle text, changed]} for every item the guide shows (IT outside TMs / Move Tutors /
Useful NPCs, WK rows the same way, P.hi, P.stone, trainer `i`, MI `i`) plus the guide's own item_desc.json items:
the hack's own extract/item_desc.json text (changed as written), else the same-key text of the other guide nearest in
generation (changed 0), else the hack's extract/item_text_extra.json ({name: [text, "wiki" or "made-up"]}, changed 0),
else for a Mega Stone the games' standard wording with the species from its P.stone entry (changed 0). Items with
none are named in the report.
In battle: IX[item][1] from tools/battle_text/items.json by generation, the hack's extract/battle_text.json "items"
over it; Mega Stones none. MV[i]['b'] likewise from moves.json and the hack's "moves", by the move's name M[i].
"""
import collections
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HACKS = os.path.join(ROOT, 'hacks')
BATTLE = os.path.join(ROOT, 'tools', 'battle_text')
# Mechanics generation for guides whose calc base does not say (cfg.calc.base "genN" wins).
GENS = {'hardlove-gold': 9, 'blaze-black-2-redux': 5, 'eternal-x': 6, 'photonic-sun': 7, 'emerald-imperium': 9,
        'unbound': 9}
# Generation for the description pool's nearest-generation order only: Hardlove's bag text is Gen 4-era game text.
POOL_GENS = {'hardlove-gold': 4}
ALIASES = {'Pasho Berry': 'Passho Berry', 'Never-MeltIce': 'Never-Melt Ice', 'Houndoomite': 'Houndoominite',
           'Kangaskhite': 'Kangaskhanite'}  # Unbound's wiki and trainer data spell the Mega Stones so
NO_ITEM_PAGE = ('tm', 'npc')  # IT section kinds: TMs / HMs / TRs, Move Tutors, Useful NPCs
MEGA_TEXT = ('One of a variety of mysterious Mega Stones. Have {species} hold it, and this stone will enable it to '
             'Mega Evolve during battle.')


def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding='utf-8') as handle:
        return json.load(handle)


def generation(hack):
    base = load_json(os.path.join(HACKS, hack, 'hack.json')).get('cfg', {}).get('calc', {}).get('base', '')
    match = re.fullmatch(r'gen(\d+)', base)
    if match:
        return int(match[1])
    if hack in GENS:
        return GENS[hack]
    raise KeyError(f'{hack}: no mechanics generation (cfg.calc.base or item_text.GENS)')


def pool_generation(hack):
    return POOL_GENS.get(hack) or generation(hack)


def key(name):
    folded = ''.join(c for c in unicodedata.normalize('NFKD', name) if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]', '', folded.lower())


def spelled(name):
    return ALIASES.get(name, name)


def mega_species(pokemon):
    """The species a Mega Stone's P.stone entry names: "Mega Charizard X" -> "Charizard", "Mega Venusaur" -> "Venusaur"."""
    return re.sub(r' [XYZ]$', '', re.sub(r'^Mega ', '', pokemon))


def pick(value, gen):
    """A battle text: a string, or {"gen<=N": text, ..., "": default}; the first nonempty condition that holds wins."""
    if isinstance(value, str):
        return value
    for cond, text in value.items():
        if not cond:
            continue
        match = re.fullmatch(r'gen<=(\d+)', cond)
        if not match:
            raise ValueError(f'unknown battle text condition {cond!r}')
        if gen <= int(match[1]):
            return text
    return value.get('', '')


def lookup_tables(override, shared):
    """(exact, by key) pairs in priority order: the hack's own overrides, then the shared set."""
    return [(table, {key(name): text for name, text in table.items()}) for table in (override, shared)]


def trainer_mons(node):
    if isinstance(node, dict):
        if 'id' in node and 'i' in node:
            yield node
        for value in node.values():
            yield from trainer_mons(value)
    elif isinstance(node, list):
        for value in node:
            yield from trainer_mons(value)


def slots(D):
    """(container, column, section, group) for every item name the data keeps; section is the IT / WK section name."""
    for section in D.get('IT', []):
        for row in section['r']:
            yield row, 0, section['n'], 'it'
    wk = D.get('WK', {})
    for row in wk.get('np', []):
        yield row, 1, row[0], 'wk'
    for split in wk.get('splits', []):
        for stop in split['st']:
            for row in stop.get('it', []):
                yield row, 1, row[0], 'wk'
    for p in D.get('P', []):
        for held in p.get('hi', []):
            yield held, 0, None, 'hi'
        if p.get('stone'):
            yield p, 'stone', None, 'stone'
    for mon in trainer_mons(D.get('TR', {})):
        if mon.get('i'):
            yield mon, 'i', None, 'mon'
    for interaction in D.get('MI', []):
        if interaction.get('i'):
            yield interaction, 'i', None, 'mi'


def apply(D, hack, report=print):
    gen = generation(hack)
    pool_gen = pool_generation(hack)
    slot_list = list(slots(D))
    no_page = {s['n'] for s in D.get('IT', []) if s.get('k') in NO_ITEM_PAGE}
    mega = {s['n'] for s in D.get('IT', []) if s.get('k') == 'mega'}
    own_text = load_json(os.path.join(HACKS, hack, 'extract', 'item_desc.json'))
    own_bt = load_json(os.path.join(HACKS, hack, 'extract', 'battle_text.json'))

    # Names -------------------------------------------------------------------------------------------------------
    uses = collections.Counter(spelled(container[column]) for container, column, _, _ in slot_list)
    uses.update(spelled(name) for name in list(own_text) + list(D.get('IX', {})))
    tab = {spelled(row[0]) for section in D.get('IT', []) for row in section['r']}
    groups = collections.defaultdict(set)
    for name in uses:
        groups[key(name)].add(name)
    final = {}
    for names in groups.values():
        # the spelled-out form wins (Silver Powder over SilverPowder, the game's squeezed bag name), then the Items tab's
        best = sorted(names, key=lambda name: (-sum(c in " -'" for c in name), name not in tab, -uses[name], name))[0]
        for name in names:
            final[name] = best
    renames, renamed = collections.Counter(), set()
    for container, column, _, group in slot_list:
        old = container[column]
        new = final[spelled(old)]
        if new != old:
            renames[(old, new)] += 1
            if group == 'it':
                renamed.add(id(container))
        container[column] = new
    # an IT row renamed onto another row of its box (Photonic's Shop "Thunderstone" and Found "Thunder Stone") joins it:
    # one row per item, as the Items standard has it (nomerge rows share one spelling, so they are never renamed together)
    for section in D.get('IT', []):
        rows = {}
        for row in list(section['r']):
            first = rows.setdefault(row[0], row)
            if first is row or not renamed.intersection({id(row), id(first)}):
                continue
            lines, keys = first[1].split('\n') if first[1] else [], list(first[5]) if len(first) > 5 else []
            for line, k in zip(row[1].split('\n') if row[1] else [], row[5] if len(row) > 5 else []):
                if line not in lines:
                    lines.append(line)
                    keys.append(k)
            first[1] = '\n'.join(lines)
            if len(first) > 5:
                first[5] = keys
            first[2] = first[2] or row[2]
            first[3] = max(first[3], row[3])
            section['r'].remove(row)
            report(f'item rows joined: {row[0]} in {section["n"]}')
    for old, new in sorted(renames):
        report(f'item name: {old} -> {new} ({renames[(old, new)]} use(s), Items tab spelling)' if new in tab
               else f'item name: {old} -> {new} ({renames[(old, new)]} use(s))')

    def canon(name):
        return final[spelled(name)]

    # Own and pooled description -------------------------------------------------------------------------------------
    own = {}
    for name, (text, changed) in own_text.items():
        own.setdefault(canon(name), (text, changed))
    pools = []
    for other in sorted(os.listdir(HACKS)):
        if other == hack or not os.path.exists(os.path.join(HACKS, other, 'extract', 'item_desc.json')):
            continue
        other_gen = pool_generation(other)
        texts = {key(name): text for name, (text, _) in load_json(
            os.path.join(HACKS, other, 'extract', 'item_desc.json')).items() if text}
        pools.append((abs(other_gen - pool_gen), other_gen, other, texts))
    pools.sort(key=lambda pool: pool[:3])
    extra = {key(name): (text, source) for name, (text, source) in
             load_json(os.path.join(HACKS, hack, 'extract', 'item_text_extra.json')).items()}

    shown = {canon(container[column]) for container, column, section, group in slot_list
             if section not in no_page}
    shown_mega = {canon(container[column]) for container, column, section, group in slot_list
                  if section in mega or group == 'stone'}
    stone_pokemon = {canon(container['stone']): container['n'] for container, column, _, group in slot_list
                     if group == 'stone'}
    names = shown   # own item_desc.json covers every item of the game; pages only for the shown ones

    # In battle ------------------------------------------------------------------------------------------------------
    item_tables = lookup_tables(own_bt.get('items', {}), load_json(os.path.join(BATTLE, 'items.json')))
    move_tables = lookup_tables(own_bt.get('moves', {}), load_json(os.path.join(BATTLE, 'moves.json')))

    def battle(name, tables):
        for exact, by_key in tables:
            found = exact.get(name, by_key.get(key(name)))
            if found is not None:
                return pick(found, gen)
        return ''

    IX = {}
    sources = collections.Counter()
    for name in sorted(names):
        text, changed = own.get(name, ('', 0))
        source = 'own' if text else ''
        if not text:
            for _, _, other, texts in pools:
                if key(name) in texts:
                    text, source = texts[key(name)], 'pooled'
                    break
        if not text and key(name) in extra:
            text, origin = extra[key(name)]
            source = 'extra-' + origin
        if not text and name in shown_mega and name in stone_pokemon:
            text, source = MEGA_TEXT.format(species=mega_species(stone_pokemon[name])), 'mega'
        changed = changed if source == 'own' else 0
        bt = '' if name in shown_mega else battle(name, item_tables)
        if text or bt:
            IX[name] = [text, bt, changed]
        sources[source or 'none'] += 1
        if not source and name in shown:
            report(f'item text: none for {name}')
    D['IX'] = IX
    report(f'item text: {sources["own"]} own, {sources["pooled"]} pooled, {sources["extra-wiki"]} from the wiki, '
           f'{sources["extra-made-up"]} made up, {sources["mega"]} Mega Stone standard, {sources["none"]} with no '
           'description')

    items_with = sum(1 for name in shown if name in IX and IX[name][1])
    report(f'in battle: {items_with} shown items with battle text, {len(shown) - items_with} without')

    moves = D.get('M', [])
    moves_with = 0
    for name, mv in zip(moves, D.get('MV', [])):
        text = battle(name, move_tables)
        if text:
            mv['b'] = text
            moves_with += 1
        else:
            mv.pop('b', None)
    report(f'in battle: {moves_with} moves with battle text, {len(moves) - moves_with} without')
    return D

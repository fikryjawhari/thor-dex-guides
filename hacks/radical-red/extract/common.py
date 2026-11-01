"""Radical Red paths and the official dex's data reader.

    DATA        decoded data.js tables, cached in memory (never writes .src/)
    read_data() parse the restricted JS data literal without evaluating JavaScript
    SPECIES     {data.js ID string: record}; SPECIES_IDS maps these to stable P ids
    SPECIES_NAMES {P id: displayed species/form name}, including cosmetic forms
    sid(x)      data.js species ID, sheet / hzla / Showdown name -> P id, or None
    move(x)     data.js move ID or name -> M name, or None (unused placeholders/Z/Max excluded)
    ability(x)  data.js [ability ID, name variant], ID or name -> AB name, or None
    item(x)     data.js item ID or name -> guide item name, or None
    type_name(x) data.js type ID -> type name; area(x) area index -> area record
    cap_step(x) area progression key -> integer (not a level); cap(x) -> Hardcore level
    CAPS        cap records in ID order (cap[0] normal, cap[1] Hardcore)
"""
from pathlib import Path
from functools import lru_cache
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from extractlib import Hack, report  # noqa: E402,F401
from romhackdex import key  # noqa: E402
import cfru  # noqa: E402

H = Hack('radical-red')


def _string(token):
    result = []
    offset = 1
    escapes = {'n': '\n', 'r': '\r', 't': '\t', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}
    while offset < len(token) - 1:
        char = token[offset]
        offset += 1
        if char != '\\':
            result.append(char)
            continue
        char = token[offset]
        offset += 1
        if char in ('x', 'u'):
            width = 2 if char == 'x' else 4
            result.append(chr(int(token[offset:offset + width], 16)))
            offset += width
        elif char == '\r':
            offset += offset < len(token) and token[offset] == '\n'
        elif char != '\n':
            result.append(escapes.get(char, char))
    return ''.join(result)


def parse_literal(source):
    """Convert only strings, keys, numbers, arrays, objects and JSON literals to JSON."""
    token = re.compile(r'''\s+|//[^\r\n]*|/\*[\s\S]*?\*/|'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z_$][\w$]*|[{}\[\]:,]''')
    source = source.strip().removesuffix(';')
    source = re.sub(r'^(?:(?:const|let|var)\s+)?[A-Za-z_$][\w$]*\s*=\s*', '', source)
    converted = []
    key_end = re.compile(r'\s*:')
    offset = 0
    while offset < len(source):
        match = token.match(source, offset)
        if not match:
            raise ValueError('Unsupported data.js syntax at byte %d' % offset)
        value = match.group()
        offset = match.end()
        if value.isspace() or value.startswith(('//', '/*')):
            continue
        is_key = key_end.match(source, offset) is not None
        if value[0] in ('"', "'"):
            value = json.dumps(_string(value), ensure_ascii=True)
        elif is_key:
            value = json.dumps(value)
        elif value[0].isalpha() and value not in ('true', 'false', 'null'):
            raise ValueError('Unsupported data.js identifier: %s' % value)
        converted.append(value)
    return json.loads(''.join(converted))


@lru_cache(maxsize=1)
def read_data():
    return parse_literal((Path(H.src) / 'repos/Radical-Red-Pokedex/data.js').read_text(encoding='utf-8'))


DATA = read_data()
SPECIES = DATA['species']
CAPS = sorted(DATA['caps'].values(), key=lambda row: row['ID'])
MOVE_IDS = {ident: cfru.official(row['name']) for ident, row in DATA['moves'].items()
            if int(ident) < 848 and row['name'] != 'Placeholder'}
MOVE_NAMES = {key(name): name for name in MOVE_IDS.values()}
ABILITY_NAMES = {key(name): cfru.official(name) for row in DATA['abilities'].values() for name in row['names']}
ITEM_NAMES = {key(row['name']): row['name'] for row in DATA['items'].values()}
for short, full in cfru.CFRU_NAMES.items():
    if key(full) in MOVE_NAMES:
        MOVE_NAMES[key(short)] = MOVE_NAMES[key(full)]
    if key(full) in ABILITY_NAMES:
        ABILITY_NAMES[key(short)] = ABILITY_NAMES[key(full)]


def move(value):
    return MOVE_IDS.get(str(value)) or MOVE_NAMES.get(key(value))


def ability(value):
    if isinstance(value, (list, tuple)):
        ident, variant = value
        row = DATA['abilities'].get(str(ident))
        return cfru.official(row['names'][variant]) if row else None
    row = DATA['abilities'].get(str(value))
    return cfru.official(row['names'][0]) if row else ABILITY_NAMES.get(key(value))


def item(value):
    row = DATA['items'].get(str(value))
    return row['name'] if row else ITEM_NAMES.get(key(value))


def type_name(value):
    return DATA['types'][str(value)]['name']


def area(value):
    return DATA['areas'][int(value)]


def cap_step(value):
    step = int(value)
    if not 0 <= step < len(CAPS):
        raise ValueError('Unknown Radical Red progression step: %s' % value)
    return step


def cap(value):
    return CAPS[cap_step(value)]['cap'][1]


def _slug(value):
    import unicodedata
    value = unicodedata.normalize('NFKD', value.replace('♀', '-f').replace('♂', '-m'))
    value = value.encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '_', value).strip('_')


def _form_key(row):
    name, order = row['key'], row.get('order', 0)
    if name in ('Pumpkaboo', 'Gourgeist'):
        return name + {0: '', 1: '-Small', 2: '-Large', 3: '-Super'}[order]
    if not order and name != 'Minior':
        return name
    if name == 'Unown':
        return name + ('-' + ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[order] if order < 26 else ('Exclamation', 'Question')[order - 26]) if order else '')
    if name in ('Unfezant', 'Frillish', 'Jellicent', 'Pyroar', 'Hippopotas', 'Hippowdon'):
        return name + ('-F' if order else '')
    if name in ('Deerling', 'Sawsbuck'):
        return name + ('-' + ('Spring', 'Summer', 'Autumn', 'Winter')[order] if order else '')
    if name in ('Burmy', 'Shellos', 'Gastrodon', 'Magearna'):
        suffixes = {'Burmy': ['', '-Sandy', '-Trash'], 'Shellos': ['', '-East'],
                    'Gastrodon': ['', '-East'], 'Magearna': ['', '-Original']}
        return name + suffixes[name][order]
    if name == 'Minior':
        return name + ('' if row['ID'] == 1065 else '-' + str(row['ID']))
    return name


FORM_KEYS = {ident: _form_key(row) for ident, row in SPECIES.items()}
SPECIES_IDS = {ident: _slug(name) for ident, name in FORM_KEYS.items()}
SPECIES_NAMES = {}
SPECIES_ALIASES = {}
REGIONS = {'Alola': 'Alolan', 'Galar': 'Galarian', 'Hisui': 'Hisuian', 'Paldea': 'Paldean', 'Sevii': 'Seviian'}
FORM_WORDS = {'F': 'Female', 'M': 'Male', 'Ice': 'Ice Rider', 'Shadow': 'Shadow Rider',
              'Super': 'Super Size', 'Small': 'Small', 'Large': 'Large', 'Eternal': 'Eternal Flower'}
for ident, row in sorted(SPECIES.items(), key=lambda pair: (pair[1].get('order', 0), int(pair[0]))):
    form_key = FORM_KEYS[ident]
    base = row['name']
    suffix = form_key[len(base):].strip('-')
    if base in ('Nidoran', 'Nidoran-F', 'Nidoran-M'):
        name = 'Nidoran♀' if form_key.endswith('-F') else 'Nidoran♂'
    elif '-Mega' in form_key:
        before, after = form_key.split('-Mega', 1)
        name = 'Mega ' + before.replace('-Sevii', ' (Seviian)') + after.replace('-', ' ')
    elif suffix == 'Primal':
        name = 'Primal ' + base
    else:
        parts = suffix.split('-') if suffix else []
        region = REGIONS.get(parts[0]) if parts else None
        if region:
            parts.pop(0)
        label = FORM_WORDS.get('-'.join(parts), ' '.join(parts))
        name = (region + ' ' if region else '') + base + (' (' + label + ')' if label else '')
    species_id = SPECIES_IDS[ident]
    SPECIES_NAMES[species_id] = name
    aliases = [form_key, species_id, name]
    if suffix:
        aliases.extend((base + ' ' + suffix, suffix + ' ' + base))
    if suffix == 'F':
        aliases.append(base + '-Female')
    for alias in aliases:
        SPECIES_ALIASES.setdefault(key(alias), species_id)
    if not row.get('order', 0):
        SPECIES_ALIASES.setdefault(key(base), species_id)
for alias, canonical in {'Urshifu-Single-Strike': 'Urshifu', 'Urshifu-Rapid-Strike-Style': 'Urshifu-Rapid-Strike',
                         'Calyrex-Ice-Rider': 'Calyrex-Ice', 'Calyrex-Shadow-Rider': 'Calyrex-Shadow',
                         'Floette-Eternal-Flower': 'Floette-Eternal', 'Minior-Core': 'Minior',
                         'Pumpkaboo-Average': 'Pumpkaboo', 'Gourgeist-Average': 'Gourgeist',
                         'Indeedee-M': 'Indeedee', 'Meowstic-M': 'Meowstic', 'Basculegion-M': 'Basculegion',
                         'Basculin-Red-Striped': 'Basculin', 'Toxtricity-Amped': 'Toxtricity'}.items():
    if key(canonical) in SPECIES_ALIASES:
        SPECIES_ALIASES[key(alias)] = SPECIES_ALIASES[key(canonical)]


def sid(value):
    return SPECIES_IDS.get(str(value)) or SPECIES_ALIASES.get(key(value))

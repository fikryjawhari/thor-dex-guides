"""CFRU family code: the hacks built on Skeli's Complete Fire Red Upgrade (Pokémon Unbound, Radical Red). Stdlib only.

    import cfru
    cfru.official(name)           a move or ability as the guides spell it ("Dazzle Gleam" -> "Dazzling Gleam")
    cfru.clean(text)              game text from a RomHackDex mirror ("Pok\\emon", "Pok�mon", line breaks)
    cfru.forms(rd)                {slug: Form} every pokedex page of a RomHackDex mirror (tools/romhackdex.py) placed:
                                  its base species, form kind and the name the guide gives it
    cfru.merge_into(form, F, S)   the page a cosmetic form is listed under (None: its own entry)
    cfru.evo_text(how)            a wiki / mirror evolution method in the guides' wording ("Level 16" -> "level 16")
    cfru.HIGH_CRIT, ALWAYS_CRIT   Gen VIII crit stages (CFRU battles are Gen VIII), for MV.cr
    cfru.calc_names()             the official names the damage calc knows (a name outside it: a hack original)

CFRU-general (true of any CFRU hack's RomHackDex mirror; Radical Red's was checked 2026-10-29):
- Names: the game stores moves and abilities in 12 characters, so the mirror shows "Dazzle Gleam", "Elec Terrain",
  "Wandering Soul"; its move list also has the constants' run-together spellings ("Petalblizzard", "Behemothbash")
  and Z / Max moves twice ("Breakneck Blitz P" / "S"). The guides show the official names (the damage calc and the
  trainer sheets use them): CFRU_NAMES maps the short ones, a run-together one matches on its letters (KNOWN).
- Forms: one page per form, slug "<base>-<suffix>" with CFRU's suffixes (-a / -g / -h regional, -mega, -mega-x,
  -primal, -giga, -f gender...). The page's h1 is the base name, its sprite number PokeAPI's form id, so the base and
  the form's name come from the slug (forms()). A few bases have no page of their own: VIRTUAL_BASE names the page that
  stands in. Gigantamax and Eternamax forms are not species a party can hold: forms() marks them dropped.
- Ability descriptions: the mirror's ability index pairs some short names with another ability's text ("Water
  Compact: Prevents burns."); a hack's own text (the wiki's, for Unbound) goes over those.
Hack-specific (each hack's extract/dex.py): which forms are hack originals, labels for its own forms, where its
Mega Stones are, its evolution methods, and every cross-check against its own docs.
"""
import re

from romhackdex import key

# ---- names ---------------------------------------------------------------------------------------------------------
# The official name for each CFRU 12-character name the letters alone can't place (seen in Unbound 2.1.1.1 and Radical
# Red 4.1 mirrors; a run-together name like "Petalblizzard" needs no entry). Unbound's own moves and abilities keep
# their names.
CFRU_NAMES = {
    # moves
    'GrassTerrain': 'Grassy Terrain', 'Petal Storm': 'Petal Blizzard', 'Disarm Cry': 'Disarming Voice',
    'Elec Terrain': 'Electric Terrain', 'Leech Fang': 'Leech Life', 'Mist Terrain': 'Misty Terrain',
    'Doll Eyes': 'Baby-Doll Eyes', 'Bad Tantrum': 'Stomping Tantrum', 'SmellingSalt': 'Smelling Salts',
    'Thunder Kick': 'Thunderous Kick', 'Power-Up Hit': 'Power-Up Punch', 'SurgeStrikes': 'Surging Strikes',
    'Psyc Terrain': 'Psychic Terrain', 'HiHorsepower': 'High Horsepower', 'Meteor Rush': 'Meteor Assault',
    'First Press': 'First Impression', 'Magnet Flux': 'Magnetic Flux', 'Hi Jump Kick': 'High Jump Kick',
    'Weird Steam': 'Strange Steam', 'Dazzle Gleam': 'Dazzling Gleam', 'Drain Kiss': 'Draining Kiss',
    'Sparkle Aria': 'Sparkling Aria', 'Mystic Fire': 'Mystical Fire', 'Floral Heal': 'Floral Healing',
    'Teary Look': 'Tearful Look', 'Flower Guard': 'Flower Shield', 'Psychic Fang': 'Psychic Fangs',
    'Scorch Sands': 'Scorching Sands', 'PsyshieldRam': 'Psyshield Bash', 'Break Swipe': 'Breaking Swipe',
    'Expand Force': 'Expanding Force', 'Clang Scales': 'Clanging Scales', 'Draco Hammer': 'Dragon Hammer',
    'Metal Bash': 'Behemoth Blade', 'Giant Bash': 'Behemoth Bash', 'Cliff Blades': 'Precipice Blades',
    'Aroma Mist': 'Aromatic Mist', 'Astral Storm': 'Astral Barrage', 'Geist Beam': 'Moongeist Beam',
    'Jungle Heal': 'Jungle Healing', 'Mystic Power': 'Mystical Power', 'Crafty Guard': 'Crafty Shield',
    'Water Star': 'Water Shuriken', 'BleakiceWind': 'Bleakwind Storm', 'WildboltWind': 'Wildbolt Storm',
    'SandsearWind': 'Sandsear Storm', 'Para Charge': 'Parabolic Charge', 'Woods Curse': "Forest's Curse",
    'TrickoTreat': 'Trick-or-Treat', 'Spirit Lock': 'Spirit Shackle', 'Space Hole': 'Hyperspace Hole',
    'Space Fury': 'Hyperspace Fury', 'Steam Pump': 'Steam Eruption', 'Light o Ruin': 'Light of Ruin',
    'Dark Lariat': 'Darkest Lariat', 'Revel Dance': 'Revelation Dance', 'Baneful Bunk': 'Baneful Bunker',
    'Clang Soul': 'Clangorous Soulblaze', "Nature's Mad": "Nature's Madness", 'Sunsteel Ram': 'Sunsteel Strike',
    'Core Enforce': 'Core Enforcer', 'Prism Laser': 'Prismatic Laser', 'Spect Thief': 'Spectral Thief',
    'Double Iron': 'Double Iron Bash', 'False Yield': 'Hold Back', 'DMax Cannon': 'Dynamax Cannon',
    'Freeze Glare': 'Freezing Glare', 'Spring Wind': 'Springtide Storm', 'Vicegrip': 'Vise Grip',
    'Fa�ade': 'Facade', 'Façade': 'Facade', 'Corrode Gas': 'Corrosive Gas', 'Jealous Burn': 'Burning Jealousy',
    'Misty Explode': 'Misty Explosion', 'Rising Volt': 'Rising Voltage', 'Will-o-Wisp': 'Will-O-Wisp', 'U-Turn': 'U-turn', 'Selfdestruct': 'Self-Destruct',
    'Kings Shield': "King's Shield", 'Lets Snuggle Forever': "Let's Snuggle Forever",
    '10000000 Volt Thunderbolt': '10,000,000 Volt Thunderbolt', 'Soul Stealing 7 Star Strike': 'Soul-Stealing 7-Star Strike',
    'Guardian Of Alola': 'Guardian of Alola', 'Light That Burns The Sky': 'Light That Burns the Sky',
    # abilities
    'Alchemic Power': 'Power of Alchemy', 'Neutralize Gas': 'Neutralizing Gas', 'Propellor Tail': 'Propeller Tail',
    'Valiant Shield': 'Dauntless Shield', 'Odd Medicine': 'Curious Medicine', 'Wandering Soul': 'Wandering Spirit', 'Water Compact': 'Water Compaction',
    'WaterCompaction': 'Water Compaction', 'Electromrphosis': 'Electromorphosis', 'Sword Of Ruin': 'Sword of Ruin',
    'Vessel Of Ruin': 'Vessel of Ruin', 'Zero To Hero': 'Zero to Hero',
}

# Official spellings the run-together names are matched against (letters only): every move and ability of Gens I-VIII
# whose name has a space, hyphen or apostrophe, i.e. the ones a CFRU constant spells differently.
KNOWN = [
    'Poison Powder', 'Grass Whistle', 'Dragon Breath', 'Ancient Power', 'Feather Dance', 'Thunder Shock',
    'Extreme Speed', 'Shell Side Arm', 'Dynamic Punch', 'Eerie Impulse', 'Fishious Rend', 'Victory Dance',
    'Oblivion Wing', 'Dragon Ascent', 'Headlong Rush', 'Bitter Malice', 'Mountain Gale', 'Diamond Storm',
    'Dragon Energy', 'Photon Geyser', 'Glacial Lance', 'Triple Arrows', 'High Jump Kick', 'Smelling Salts',
    'Baby-Doll Eyes', 'Disarming Voice', 'Flower Shield', 'Petal Blizzard', 'Hyperspace Hole', 'Hyperspace Fury',
    'Precipice Blades', 'Steam Eruption', 'Core Enforcer', 'Water Shuriken', 'Hold Back', 'Thousand Arrows',
    'Thousand Waves', 'Parabolic Charge', 'Baneful Bunker', 'Clanging Scales', 'Dragon Hammer', 'First Impression',
    'Floral Healing', 'Moongeist Beam', "Nature's Madness", 'Prismatic Laser', 'Revelation Dance', 'Sparkling Aria',
    'Spectral Thief', 'Spirit Shackle', 'Sunsteel Strike', 'Tearful Look', 'Crafty Shield', 'Aromatic Mist',
    'Magnetic Flux', 'Trick-or-Treat', "Forest's Curse", 'Light of Ruin', 'Double Iron Bash', 'Hold Hands',
    'Dynamax Cannon', 'Clangorous Soul', 'Behemoth Blade', 'Behemoth Bash', 'Strange Steam', 'False Surrender',
    'Meteor Assault', 'Jungle Healing', 'Surging Strikes', 'Freezing Glare', 'Thunderous Kick', 'Astral Barrage',
    'Psyshield Bash', 'Mystical Power', 'Infernal Parade', 'Ceaseless Edge', 'Bleakwind Storm', 'Wildbolt Storm',
    'Sandsear Storm', 'Springtide Storm', 'Lunar Blessing', 'Supreme Overlord', 'Orichalcum Pulse', 'Thermal Exchange',
    'Water Compaction',
]
_KNOWN = {key(n): n for n in KNOWN}


def official(name):
    """The official spelling of a CFRU move or ability name (unchanged when it already is one, or is the hack's own)."""
    name = name.strip()
    if name in CFRU_NAMES:
        return CFRU_NAMES[name]
    return _KNOWN.get(key(name), name)


ZMAX = re.compile(r'^(.*) ([PS])$')       # "Breakneck Blitz P": the physical / special copy of a Z or Max move


def move_kind(name):
    """'z' (a Z-move copy), 'max' (a Max / G-Max move copy) or '' for the mirror's move names."""
    m = ZMAX.match(name)
    if not m:
        return ''
    return 'max' if m.group(1).startswith(('Max ', 'G Max ')) else 'z'


def clean(s):
    """Game text from the mirror: the game's escapes and line breaks, and U+FFFD where the mirror lost a character
    (é in Pokémon, × after a number, ' between letters)."""
    s = (s or '').replace('\\n', ' ').replace('\\e', 'é').replace('\\l', ' ').replace('\\p', ' ')
    s = re.sub(r'Pok�(mon|\s*Ball|\s*Center|\s*Mart)', r'Poké\1', s)
    s = re.sub(r'(?<=\d)�', '×', s)
    s = re.sub(r'(?<=[A-Za-z])�(?=[a-z])', "'", s)
    s = s.replace('�', 'é')
    return re.sub(r'\s+', ' ', s).strip()


# ---- forms ---------------------------------------------------------------------------------------------------------
REGION = {'a': 'Alolan', 'g': 'Galarian', 'h': 'Hisuian'}
MEGA = {'mega': 'Mega {}', 'mega-x': 'Mega {} X', 'mega-y': 'Mega {} Y', 'primal': 'Primal {}'}
DROP = {'giga': 'Gigantamax (Dynamax only, in raids)', 'eternamax': 'Eternamax (not a form a party can hold)'}
# Slugs with no hyphen that are forms (the CFRU constant runs the words together).
JOINED = {'darmanitanzen': ('darmanitan', 'zen'), 'ashgreninja': ('greninja', 'ash')}
# Species whose own page is missing on the mirror (the default form has a suffix): the page that stands in for it.
VIRTUAL_BASE = {'urshifu': 'urshifu-single', 'basculin': 'basculin-red', 'minior': 'minior-shield', 'basculegion': 'basculegion-m',
                'farfetchd': 'farfetched', 'alcremie': 'alcremie-strawberry'}
# CFRU species that are no Pokémon a party holds.
DROP_SLUG = {'zygarde-cell': 'Zygarde Cell (a collectible, not a battle form)',
             'zygarde-core': 'Zygarde Core (a collectible, not a battle form)', 'missingno': 'placeholder species'}
# Form changes in battle or by an item / move / fusion: not a separate catch (P.fc).
FORM_CHANGE = {
    'blade', 'sun', 'gorging', 'gulping', 'zen', 'noice', 'pirouette', 'busted', 'hangry', 'complete', 'ultra',
    'crowned', 'origin', 'therian', 'unbound', 'resolute', 'ash', 'black', 'white', 'dawn-wings', 'dusk-mane',
    'ice-rider', 'shadow-rider', 'attack', 'defense', 'speed', 'heat', 'wash', 'frost', 'fan', 'mow', 'sky',
    'burn', 'chill', 'douse', 'shock',
}
TYPE_FORMS = {'arceus', 'silvally'}          # a form per type, by held Plate / Memory: form changes
# Labels for suffixes whose words aren't the form's name; the rest are the suffix's words in title case.
LABEL = {
    'f': 'Female', 'm': 'Male', 'female': 'Female', 'n': 'Midnight', 'dusk': 'Dusk', 'l': 'Large', 'xl': 'Super',
    'p': "Pa'u", 's': 'Sensu', 'y': 'Pom-Pom', 'sun': 'Sunshine', 'noice': 'Noice Face', 'blue': 'Blue Striped',
    'red': 'Red Striped', 'single': 'Single Strike', 'rapid': 'Rapid Strike', 'low-key': 'Low Key', '10': '10%',
    'eternal': 'Eternal Flower', 'dada': 'Dada', 'ash': 'Ash', 'shield': 'Meteor', 'natural': 'Neutral', 'phd': 'PhD',
    'east': 'East Sea', 'spiky': 'Spiky-eared', 'chipped': 'Antique', 'fight': 'Fighting',
}
# Per species where the same suffix means something else ("-m" is Pumpkaboo's Average size, Basculegion's male).
SPECIES_LABEL = {
    ('pumpkaboo', 'm'): 'Average', ('gourgeist', 'm'): 'Average', ('oricorio', 'p'): "Pa'u", ('oricorio', 'y'): 'Pom-Pom',
    ('wishiwashi', 's'): 'School', ('magearna', 'p'): 'Original Color',
    **{('minior', c): 'Core' for c in ('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet')},
}
# The default form's label (other sources' names for it: hzla's "Minior-Meteor"); NAME_BASE: the species whose name
# shows it, the ones whose forms are peers of the default rather than changes of it.
NAME_BASE = {'pumpkaboo', 'gourgeist', 'oricorio', 'lycanroc', 'toxtricity', 'urshifu', 'basculin', 'wormadam'}
BASE_LABEL = {
    'pumpkaboo': 'Small', 'gourgeist': 'Small', 'oricorio': 'Baile', 'lycanroc': 'Midday', 'toxtricity': 'Amped',
    'urshifu': 'Single Strike', 'basculin': 'Red Striped', 'wormadam': 'Plant', 'meowstic': 'Male',
    'indeedee': 'Male', 'basculegion': 'Male', 'arceus': 'Normal', 'silvally': 'Normal', 'zygarde': '50%', 'darmanitan': 'Standard', 'minior': 'Meteor',
    'wishiwashi': 'Solo', 'aegislash': 'Shield', 'deoxys': 'Normal', 'shaymin': 'Land',
    'giratina': 'Altered', 'tornadus': 'Incarnate', 'thundurus': 'Incarnate', 'landorus': 'Incarnate',
    'enamorus': 'Incarnate', 'meloetta': 'Aria', 'hoopa': 'Confined', 'keldeo': 'Ordinary', 'morpeko': 'Full Belly',
    'eiscue': 'Ice Face', 'mimikyu': 'Disguised', 'cherrim': 'Overcast',
}


class Form:
    """One mirror page placed. base: the base species' slug (itself for a base); suffix: the slug's form part ('' for a
    base, 'g-zen' for Galarian Darmanitan's Zen Mode); kind: 'base', 'regional', 'mega', 'drop' or 'form';
    region: the regional prefix word or None; label: the form's label or None; fc: a form change (P.fc);
    drop: why the page is no species of the guide (None if it is one)."""

    def __init__(self, slug, base, suffix):
        self.slug, self.base, self.suffix = slug, base, suffix
        parts = suffix.split('-') if suffix else []
        self.region = REGION.get(parts[0]) if parts and base not in LETTERS else None
        rest = '-'.join(parts[1:]) if self.region else suffix
        self.drop = next((why for s, why in DROP.items() if s in parts), None)
        self.fc = bool(rest) and (rest in FORM_CHANGE or base in TYPE_FORMS)
        self.rest = rest
        if self.drop:
            self.kind = 'drop'
        elif not suffix:
            self.kind = 'base'
        elif suffix in MEGA:
            self.kind = 'mega'
        elif self.region and not rest:
            self.kind = 'regional'
        else:
            self.kind = 'form'
        self.label = None
        if self.kind == 'base' and base in NAME_BASE:
            self.label = BASE_LABEL[base]
        elif rest and base in LETTERS:
            self.label = {'exclamation': '!', 'question': '?'}.get(rest, rest.upper())
        elif rest and self.kind != 'mega':
            self.label = SPECIES_LABEL.get((base, rest)) or LABEL.get(rest) or ' '.join(
                w.capitalize() for w in rest.split('-'))

    def name(self, base_name):
        """The guide's name: "Alolan Raichu", "Mega Charizard X", "Galarian Darmanitan (Zen)", "Pumpkaboo (Large)"."""
        if self.kind == 'mega':
            return MEGA[self.suffix].format(base_name)
        n = '%s %s' % (self.region, base_name) if self.region else base_name
        return '%s (%s)' % (n, self.label) if self.label else n


def forms(rd):
    """{slug: Form} for every page of a RomHackDex mirror (romhackdex.Mirror). A page is a form when a page whose slug
    is a hyphen-prefix of its own exists (or VIRTUAL_BASE names one) and either its h1 isn't its slug's letters
    ("Raichu" on raichu-a) or it shares that page's dex number (unown-b); else it is a base species (porygon-z,
    nidoran-f, tapu-koko)."""
    S = rd.species()
    out = {}

    def page_of(slug):
        return S.get(VIRTUAL_BASE.get(slug, slug))

    def root(slug):
        """(base, suffix) of a slug; suffix '' for a base species."""
        if slug in DROP_SLUG:
            return slug, ''
        if slug in JOINED:
            return JOINED[slug]
        parts = slug.split('-')
        for i in range(len(parts) - 1, 0, -1):
            pre = '-'.join(parts[:i])
            page = page_of(pre)
            if page is None or VIRTUAL_BASE.get(pre) == slug:
                continue
            sp = S[slug]
            if key(sp.name) != key(slug) or sp.dex == page.dex or pre in VIRTUAL_BASE:
                b, sfx = root(pre) if pre not in VIRTUAL_BASE else (pre, '')
                return b, '-'.join(x for x in (sfx, '-'.join(parts[i:])) if x)
        return next((b for b, page in VIRTUAL_BASE.items() if page == slug), slug), ''
    for slug in S:
        out[slug] = Form(slug, *root(slug))
        if slug in DROP_SLUG:
            out[slug].kind, out[slug].drop = 'drop', DROP_SLUG[slug]
    return out


# Species whose forms differ only in looks: every form is listed under the base species (their pages' small data
# differences, stale tutor lists mostly, go in the build report). Minior's cores merge into one core form; Floette's
# Eternal Flower stays its own form.
COSMETIC = {'unown', 'vivillon', 'furfrou', 'deerling', 'sawsbuck', 'flabebe', 'floette', 'florges', 'shellos',
            'gastrodon', 'alcremie', 'burmy', 'sinistea', 'polteageist', 'xerneas', 'magearna', 'zarude', 'pichu'}
KEEP = {('floette', 'eternal')}
COSMETIC_SUFFIX = {('pikachu', 'cap-')}     # (species, suffix's first word): merged into the base
SIBLINGS = {'minior'}                        # forms with one label merge into the first of them (Minior's cores)
LETTERS = {'unown'}                                          # suffixes are letters, not CFRU form words


def same_data(a, b):
    """True when two mirror pages have the same types, stats and abilities (learnsets are left out: a form's page
    often has a stale tutor or egg list)."""
    return (a.types == b.types and a.stats == b.stats and set(a.abilities) == set(b.abilities)
            and a.hidden == b.hidden)


def merge_into(f, F, S):
    """The slug a form's page merges into (the guide lists it under that species), or None when it is its own entry.
    F: forms(), S: the mirror's species()."""
    if f.kind != 'form':
        return None
    base = VIRTUAL_BASE.get(f.base, f.base)
    if f.base in COSMETIC and (f.base, f.suffix) not in KEEP:
        return base
    if (f.base, f.suffix.split('-')[0] + '-') in COSMETIC_SUFFIX:
        return base
    if f.base in SIBLINGS:
        first = min(s for s, g in F.items() if g.base == f.base and g.kind == 'form' and g.label == f.label)
        return None if first == f.slug else first
    return base if same_data(S[f.slug], S[base]) else None


# ---- evolutions ------------------------------------------------------------------------------------------------------
def evo_text(how):
    """A method as the guides word it: lowercase start, "level N", "using <item>" for a used item."""
    h = re.sub(r'\s+', ' ', (how or '').strip()).strip(' .')
    if not h:
        return None
    m = re.fullmatch(r'(?i)(?:Lv\.?|Level) (\d+)(.*)', h)
    if m:
        return 'level %s%s' % (m.group(1), m.group(2))
    m = re.fullmatch(r'(?i)use (?:a |an )?(.+?)(?: \(on [^)]*\))?', h)
    if m:
        return 'using ' + m.group(1)
    if re.fullmatch(r"[A-Z][\w'.-]*(?: [A-Z][\w'.-]*)* (?:Stone|Scale|Tooth|Coat|Cloth|Disc|Grade|Sweet|Apple|Pot|"
                    r"Sachet|Dream|Cuff|Wreath|Augurite|Protector|Electirizer|Magmarizer)( .+)?", h):
        return 'using ' + h
    return h[0].lower() + h[1:] if not h[:2].isupper() else h


# ---- crit stages (MV.cr): Gen VIII (Bulbapedia, Critical hit: Generation VI onwards; CFRU follows it) ----------------
HIGH_CRIT = ['Aeroblast', 'Air Cutter', 'Attack Order', 'Blaze Kick', 'Crabhammer', 'Cross Chop', 'Cross Poison',
             'Drill Run', 'Karate Chop', 'Leaf Blade', 'Night Slash', 'Poison Tail', 'Psycho Cut', 'Razor Leaf',
             'Razor Shell', 'Razor Wind', 'Shadow Claw', 'Sky Attack', 'Slash', 'Snipe Shot', 'Spacial Rend',
             'Stone Edge', 'Esper Wing', 'Stone Axe', '10,000,000 Volt Thunderbolt']
ALWAYS_CRIT = ['Frost Breath', 'Storm Throw', 'Wicked Blow', 'Surging Strikes']


_CALC = None


def calc_names():
    """Every official name the damage calc's data knows (template/calc/engine.js: moves, abilities, species, items).
    A move or ability name outside it is a hack original (MV.x / AB[2]) or a name the calc can't look up."""
    global _CALC
    if _CALC is None:
        import os
        eng = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'template', 'calc', 'engine.js'),
                   encoding='utf-8').read()
        _CALC = set(re.findall(r'name:"([^"]+)"', eng))
        _CALC |= {re.sub(r' \(.*\)$', '', n) for n in _CALC}       # "As One (Glastrier)"
    return _CALC


# RomHackDex's evolution labels on CFRU hacks (the game's method names), as text the player can act on; an item name
# alone means using it, "Trade <item>" trading holding it. evo_text() words "Lv. N".
RHD_EVO = {
    'Friendship': 'high friendship', 'Friendship (Day)': 'high friendship by day',
    'Friendship (Night)': 'high friendship at night', 'friendship-day': 'high friendship by day',
    'friendship-night': 'high friendship at night', 'level-day': 'level up by day', 'level-night': 'level up at night',
    'level-female': 'level up (female)', 'level-male': 'level up (male)', 'Trade': 'trade',
    'move': 'level up knowing a certain move', 'move-male': 'level up knowing a certain move (male)',
    'move-female': 'level up knowing a certain move (female)', 'map': 'level up in a special place',
    'level-hold-item': 'level up holding an item', 'hold-item-day': 'level up holding an item by day',
    'hold-item-night': 'level up holding an item at night', 'item-hold-item': 'using an item',
    'item-night': 'using an item at night', 'item-location': 'using an item in a special place',
    'rainy-foggy-overworld': 'level up in rain or fog', 'critical-hit': 'land critical hits in one battle',
    'level-atk-gt-def': 'level up with Attack > Defense', 'level-atk-eq-def': 'level up with Attack = Defense',
    'level-atk-lt-def': 'level up with Attack < Defense', 'level-silcoon': 'level up (random)',
    'level-cascoon': 'level up (random)', 'level-ninjask': 'level up', 'level-shedinja': 'level up with a free party slot',
    'other-party-mon': 'level up with a certain Pokémon in the party', 'type-in-party': 'level up with a Dark type in the party',
    'nature-high': 'level up (Amped nature)', 'nature-low': 'level up (Low Key nature)',
    'move-type Fairy': 'level up knowing a Fairy-type move',
}
NO_EVO = {'gigantamax', 'gigantamax true', 'None'}       # the mirror's chain drawn through a form change, not evolution


def rhd_evo(how):
    """A mirror label as method text, or None for a label that is no evolution (a form change drawn in the chain)."""
    h = (how or '').strip()
    if h in NO_EVO or not h:
        return None
    if h in RHD_EVO:
        return RHD_EVO[h]
    m = re.fullmatch(r'Trade (.+)', h)
    if m:
        return 'trade holding ' + m.group(1)
    return evo_text(h) if h.startswith('Lv') else 'using ' + h


def define_slug(define, forms_):
    """The mirror slug for a CFRU species constant (SPECIES_RAICHU_A -> raichu-a, SPECIES_DARMANITANZEN ->
    darmanitanzen), or None when the mirror has no page by that name (match those by display name)."""
    slug = define[len('SPECIES_'):].lower().replace('_', '-')
    for cand in (slug, slug.replace('-', ''), {'female': 'f'}.get(slug, slug)):
        if cand in forms_:
            return cand
    return None

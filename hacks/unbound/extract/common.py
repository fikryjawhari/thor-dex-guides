"""Paths, readers and name lookups shared by the unbound extract modules.

    RD          the RomHackDex mirror (tools/romhackdex.py)        WIKI   the unboundwiki.com export (wiki.py)
    FORMS       {slug: cfru.Form} every mirror page placed (tools/cfru.py)
    sid(name)   a species / form name as any source writes it -> our P id, or None: "Alolan Raichu", "Raichu-Alola",
                "Mega Charizard X", "Charizard-Mega-X", "Lycanroc (Midnight Form)", "Urshifu-Rapid-Strike", "Shadow-Warrior",
                "Indeedee-F", "Pumpkaboo-Super". A cosmetic form gives its base ("Unown-B" -> unown), a Gigantamax
                form its base species ("Charizard-Gmax" -> charizard).
    move(name)  a move as any source writes it -> its name in M ("Dazzle Gleam", "dazzlinggleam" -> "Dazzling Gleam")
    ability(name) the same for AB names ("Wandering Soul" -> "Wandering Spirit"; the wiki's "Below" -> "Bellow")
dex.py fills the move and ability tables when it builds M / AB; sid works from the mirror alone.
"""
from pathlib import Path
import os
import re
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from extractlib import Hack, report  # noqa: E402,F401
from romhackdex import Mirror, key  # noqa: E402
import cfru  # noqa: E402
from wiki import Wiki  # noqa: E402

H = Hack('unbound')
RD = Mirror(os.path.join(H.src, 'romhackdex'))
WIKI = Wiki(os.path.join(H.src, 'unboundwiki', 'unboundwiki.json'))
FORMS = cfru.forms(RD)

# Mirror h1 typos (the base name every form of the species takes).
NAME_FIX = {'Basculegon': 'Basculegion', 'Flab�b�': 'Flabébé', 'Poltegeist': 'Polteageist'}
# Unbound's own species: the mirror's page and the name the guide uses.
OWN = {'shadow-warrior': 'Shadow Warrior'}
# Words other sources use for a form, beside the guide's label (Showdown / hzla / the wiki).
ALIAS_WORDS = {'Alolan': ['Alola'], 'Galarian': ['Galar'], 'Hisuian': ['Hisui'], 'Female': ['F'], 'Male': ['M'],
               'Midnight': ['Midnight Form'], 'Dusk': ['Dusk Form'], '10%': ['10'], 'Ice Rider': ['Ice'],
               'Shadow Rider': ['Shadow'], 'Single Strike': ['Single Strike Style'],
               'Rapid Strike': ['Rapid Strike Style'], 'Low Key': ['Lowkey'], 'Eternal Flower': ['Eternal'],
               'Noice Face': ['Noice'], 'Blue Striped': ['Blue-Striped', 'Blue'], 'Original Color': ['Original'],
               "Pa'u": ['Pau'], 'Pom-Pom': ['Pompom'], 'Core': ['Red', 'Red Core'], 'Neutral': [],
               'Sunshine': ['Sunny'], 'Zen': ['Zen Mode'], 'Ash': [], 'Complete': ['Complete Forme']}


def base_name(slug):
    """The species name of a mirror page's base species (h1 typos fixed)."""
    f = FORMS[slug]
    page = RD.species()[cfru.VIRTUAL_BASE.get(f.base, f.base)] if f.base in FORMS or f.base in cfru.VIRTUAL_BASE \
        else RD.species()[slug]
    return OWN.get(page.slug) or NAME_FIX.get(page.name) or cfru.species_name(page)


def pid(slug):
    """Our species id for a mirror page: its base's id + '_' + the form suffix (raichu_a, charizard_mega_x)."""
    f = FORMS[slug]
    return '_'.join(x for x in (f.base, f.suffix) if x).replace('-', '_')


_SID = {}


def _aliases(slug):
    f, b = FORMS[slug], base_name(slug)
    names = {f.name(b), slug, f.base + f.suffix}
    if f.kind == 'mega':
        names |= {b + ' ' + f.suffix, b + ' Mega ' + f.suffix[5:]}
    if f.region:
        for w in [f.region] + ALIAS_WORDS.get(f.region, []):
            names |= {w + ' ' + b, b + ' ' + w}
    labels = [f.label] if f.label else []
    if f.kind == 'base' and cfru.BASE_LABEL.get(f.base):
        labels = [cfru.BASE_LABEL[f.base]]
    regions = [f.region] + ALIAS_WORDS.get(f.region, []) if f.region else []
    for lab in [x for la in labels for x in [la] + ALIAS_WORDS.get(la, [])]:
        pre = (['%s %s' % (r, b) for r in regions] + ['%s %s' % (b, r) for r in regions]) if regions else [b]
        for p in pre:
            names |= {p + ' ' + lab, p + ' (' + lab + ')', p + ' (' + lab + ' Form)', p + ' (' + lab + ' Forme)',
                      p + ' (' + lab + ' Style)'}
    return names


def _build_sid():
    S = RD.species()
    target = {}
    for slug, f in FORMS.items():
        if f.kind == 'drop':
            target[slug] = f.base.replace('-', '_') if f.base != slug else None
            continue
        into = cfru.merge_into(f, FORMS, S)
        target[slug] = pid(into) if into else pid(slug)
    for slug in sorted(FORMS, key=lambda s: FORMS[s].kind != 'base'):       # a base's names win over a form's
        if target[slug] is None:
            continue
        for n in _aliases(slug):
            _SID.setdefault(key(n), target[slug])
    _SID.setdefault('shadowwarrior', pid('shadow-warrior'))
    location_aliases = {
        'Magikarp (Shiny)': 'Magikarp', 'Spiky-Eared Pichu': 'Pichu (Spiky-eared)',
        'Gigantamax Garbodor': 'Garbodor', 'Gigantamax Butterfree': 'Butterfree',
        'Balloon Pikachu': 'Pikachu', 'Flying Pikachu': 'Pikachu',
        'Original Color Magearna': 'Magearna (Original Color)', 'Eternal Flower Floette': 'Floette (Eternal Flower)',
        'Eternal Floette': 'Floette (Eternal Flower)', 'Turtonaut': 'Turtonator', 'Gurrdurr': 'Gurdurr',
        'Flabebe (Red)': 'Flabébé', 'Frillish (M)': 'Frillish', 'Deerling (Spring)': 'Deerling',
        'Sawsbuck (Spring)': 'Sawsbuck', 'Gravler (Alolan)': 'Alolan Graveler',
        'Nidoran (female)': 'Nidoran♀', 'Nidoran (male)': 'Nidoran♂',
    }
    for alias, canonical in location_aliases.items():
        _SID.setdefault(key(alias), _SID[key(canonical)])


def FORMS_KIND(species_id):
    """The cfru form kind of a P id ('base', 'regional', 'mega', 'form')."""
    if not _KIND:
        _KIND.update({pid(s): f.kind for s, f in FORMS.items()})
    return _KIND.get(species_id, 'base')


_KIND = {}


def sid(name):
    """Our P id for a species / form name, or None (see the module docstring)."""
    if not _SID:
        _build_sid()
    k = key(re.sub(r'\s+', ' ', str(name).replace('’', "'")))
    if k in _SID:
        return _SID[k]
    k2 = re.sub(r'(gmax|gigantamax)$', '', k)
    return _SID.get(k2)


# Move / ability names: dex.py registers every name it puts in M / AB (official name and every mirror spelling).
MOVE_NAMES, ABILITY_NAMES = {}, {}
WIKI_ABILITY_FIX = {'Below': 'Bellow'}       # wiki typos
WIKI_MOVE_FIX = {'Steel Beem': 'Steel Beam', 'Whirpool': 'Whirlpool', 'Wavecrash': 'Wave Crash'}


def move(name):
    n = WIKI_MOVE_FIX.get(str(name).strip(), str(name).strip())
    return MOVE_NAMES.get(key(n)) or MOVE_NAMES.get(key(cfru.official(n)))


def ability(name):
    n = WIKI_ABILITY_FIX.get(str(name).strip(), str(name).strip())
    return ABILITY_NAMES.get(key(n)) or ABILITY_NAMES.get(key(cfru.official(n)))

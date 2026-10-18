"""Sprite keys (sprites/README.md) for a hack's species, worked out from dex number and name. Stdlib only.

assemble.py calls sprite_key() for every species without an explicit `sk` (data.json) or hack.json `sk` override.
A species it can't place in the shared set is a form the hack added (or a fakemon): only those need the hack's own
art in sprites.json.

Usage: python -I tools/sprite_keys.py <hack>   (prints the forms it matched and every species it couldn't place)

How it matches: the name's words, minus the base species' name, must cover one of the shared set's form slugs for
that dex number, with only filler words left over ("Shellos East Sea" -> 0422-east, "Mega Absol Z" -> 0359-mega-z,
"Arceus (Normal)" -> 0493). The slug matching the most words wins, so "Palafin (Hero)" is 0964-hero while
"Zacian (Hero)" is the base 0888.
"""
import json, os, re, sys, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
INDEX = json.load(open(os.path.join(ROOT, 'sprites', 'index.json'), encoding='utf-8'))

SYN = {'alolan': 'alola', 'galarian': 'galar', 'hisuian': 'hisui', 'paldean': 'paldea', 'female': 'f', 'male': 'm',
       'gigantamax': 'gmax', 'trashy': 'trash', 'pokeball': 'poke', 'pompom': 'pom'}
# Words that name a default form, or say nothing on their own ("Pikachu Alola Cap", "Floette (Red)").
FILLER = {'normal', 'average', 'standard', 'incarnate', 'altered', 'plant', 'baile', 'midday', 'solo', 'shield',
          'aria', 'land', 'confined', 'hero', 'red', 'striped', 'single', 'strike', 'm', 'ice', 'zero', 'chest',
          'teal', 'meteor', 'amped', 'green', 'flower', 'sea', 'west', 'form', 'forme', 'mode', 'cap', 'cloak',
          'style', 'mask', 'aura', 'break', 'of', 'the', 'plumage', 'build', 'drive', 'sweet', 'family', 'two',
          'segment', 'disguised', 'full', 'belly', 'vanilla', 'cream', 'strawberry', 'curly', 'ordinary', 'spring',
          'overcast', 'shell', 'core', 'many', 'battles'}


def words(s):
    s = unicodedata.normalize('NFKD', s.replace('♀', ' f ').replace('♂', ' m ')).encode('ascii', 'ignore').decode()
    s = re.sub(r"['.’]", '', s.lower())
    return [SYN.get(w, w) for w in re.split(r'[^a-z0-9]+', s) if w]


# dex number -> {form slug: key}, and the base species' name words per dex number.
FORMS, BASE = {}, {}
for key, const in INDEX['keys'].items():
    dex, _, slug = key.partition('-')
    FORMS.setdefault(int(dex), {})[slug] = key
    if not slug:
        BASE[int(dex)] = set(words(const[len('SPECIES_'):]))


def dex_by_name(ws):
    """Dex number sharing the most non-filler name words with ws, for species with no (or a wrong) dex number."""
    best = max(((len((b & set(ws)) - FILLER), d) for d, b in BASE.items()), default=(0, 0))
    return best[1] if best[0] else 0


def sprite_key(dex, name, sid=''):
    ws = set(words(name) or words(sid))
    if not 1 <= (dex or 0) <= 1025 or not (BASE.get(dex, set()) & ws) - FILLER:
        dex = dex_by_name(ws) or dex
    if dex not in FORMS:
        return None
    best = None
    for slug, key in FORMS[dex].items():
        need = set(words(slug))
        if need <= ws and ws - need - BASE[dex] <= FILLER and (best is None or len(need) > best[0]):
            best = (len(need), key)
    return best[1] if best else None


def keys_for(hid):
    """{species id: key or None} for a hack, honouring data.json `sk` and hack.json `sk` overrides."""
    data = json.load(open(os.path.join(ROOT, 'hacks', hid, 'data.json'), encoding='utf-8'))
    over = json.load(open(os.path.join(ROOT, 'hacks', hid, 'hack.json'), encoding='utf-8')).get('sk', {})
    return {p['id']: over.get(p['id']) or p.get('sk') or sprite_key(p.get('dex'), p['n'], p['id']) for p in data['P']}, data


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    keys, data = keys_for(sys.argv[1])
    names = {p['id']: p['n'] for p in data['P']}
    for sid, k in keys.items():
        if k and '-' in k:
            print(f'  {names[sid]} -> {k}')
    bad = [sid for sid, k in keys.items() if not k]
    print(f'{len(keys) - len(bad)} of {len(keys)} species matched; not in the shared set ({len(bad)}):')
    for sid in bad:
        print(f'  {sid}: {names[sid]}')

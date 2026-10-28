"""A save's expected.json (tools/README.md → Save check) from a Showdown-style paste of it, such as the one hzla's calc
importer makes (its cypress/fixtures/texts/<title>_save_paste.txt).

Usage: python -I tools/calc_paste_expected.py <paste.txt> <hack> <out.json> --layout box13:3,party:6,box0:24 [--boxes 14]

--layout says where the paste's Pokémon sit, in paste order (a paste has no box numbers); --boxes is how many boxes the
reader returns. Names are written in the guide's own names from hacks/<hack>/data.json: the species ("Marowak-Alola" ->
"Alolan Marowak", "Aegislash" -> the default form), moves and abilities (M, AB: "Kings Shield" -> "King's Shield"), items
(GID.it); nature, level and IVs as the paste has them. EVs are left out unless the paste lists them (a field left out is not compared).
"""
import argparse, json, os, re

REGION = {'Alola': 'Alolan', 'Galar': 'Galarian', 'Hisui': 'Hisuian', 'Paldea': 'Paldean'}
STATS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']
key = lambda s: re.sub(r'[^a-z0-9]', '', s.lower().replace('é', 'e'))


def species_name(name, names):
    """The guide's P name for a Showdown species name; a bare name of a species with forms is its default form (the P
    whose id is its dex number: Aegislash -> Aegislash (Shield))."""
    if name in names:
        return name
    base, _, form = name.partition('-')
    tries = [f'{REGION[form]} {base}'] if form in REGION else []
    tries += [n for n in names if key(n) == key(name)]
    tries += sorted((n for n in names if n.startswith(base + ' (')), key=lambda n: names[n]) if not form else []
    for t in tries:
        if t in names:
            return t
    raise SystemExit(f'no species in data.json for "{name}"')


def canon(names):
    """name -> the guide's spelling, matched loosely ("Kings Shield" -> "King's Shield"); unknown names stay as they are."""
    index = {key(n): n for n in names if n}
    return lambda n: index.get(key(n), n) if n else n


def parse(text, names, move_name, ability, item_name):
    mons = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        head, _, item = lines[0].partition(' @ ')
        nick = re.match(r'.*\((.+)\)$', head)
        mon = {'species': species_name((nick[1] if nick else head).strip(), names)}
        moves = []
        for line in lines[1:]:
            if line.startswith('Level:'):
                mon['level'] = int(line.split(':')[1])
            elif line.endswith(' Nature'):
                mon['nature'] = line[:-7]
            elif line.startswith('Ability:'):
                mon['ability'] = ability(line.split(':', 1)[1].strip())
            elif line.startswith(('IVs:', 'EVs:')):
                field, default = ('ivs', 31) if line.startswith('IVs') else ('evs', 0)
                values = dict((s, int(v)) for v, s in re.findall(r'(\d+) (\w+)', line))
                mon[field] = [values.get(s, default) for s in STATS]
            elif line.startswith('- '):
                move = line[2:].strip()
                moves.append('' if move == 'None' else move_name(move))
        mon['item'] = item_name(item.strip())
        mon['moves'] = (moves + [''] * 4)[:4]
        mons.append(mon)
    return mons


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('paste'), ap.add_argument('hack'), ap.add_argument('out')
    ap.add_argument('--layout', required=True), ap.add_argument('--boxes', type=int, default=14)
    a = ap.parse_args()
    D = json.load(open(os.path.join('hacks', a.hack, 'data.json'), encoding='utf8'))
    names = {p['n']: (p['id'] != str(p['dex']), int(p['id'])) for p in D['P']}      # default forms first
    items = (D.get('GID') or {}).get('it') or []                 # the names an import gives (the game's)
    mons = parse(open(a.paste, encoding='utf8').read(), names, canon(D['M']), canon(a[0] for a in D['AB']), canon(items))
    out, at = {'party': [], 'boxes': [[] for _ in range(a.boxes)]}, 0
    for part in a.layout.split(','):
        where, count = part.split(':')
        target = out['party'] if where == 'party' else out['boxes'][int(where[3:])]
        target += mons[at:at + int(count)]
        at += int(count)
    if at != len(mons):
        raise SystemExit(f'--layout places {at} Pokémon, the paste has {len(mons)}')
    json.dump(out, open(a.out, 'w', encoding='utf8', newline='\n'), ensure_ascii=False, indent=1)
    print(f'{a.out}: {len(out["party"])} party, {sum(map(len, out["boxes"]))} boxed')


if __name__ == '__main__':
    main()

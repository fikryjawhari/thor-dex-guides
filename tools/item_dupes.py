"""Items lines that describe one pickup twice, per guide (the itemstd matching rules, run over a built data.json).

    uv run python -X utf8 -I tools/item_dupes.py [hack ...] [--samples N] [--out file.md]

Kinds: `twice` = two Found / Also lines of one item that read as one pickup (same_pickup, one to one); `shop` = a TM's
Found / Also line that only names a place its Shop line sells it at; `no place` = a line that continues another
("Found: at the rock in the northwest corner"); `repeat` = a line that says a requirement twice ("Requires Surf ·
needs Surf"). `unsure` pairs name the same place with different details: kept apart, listed for review.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import datajson  # noqa: E402
import itemstd  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SKIP = ('Move Tutors', 'Useful NPCs')


def scan(D):
    found = {'twice': [], 'shop': [], 'no place': [], 'repeat': [], 'unsure': []}
    for box in D['IT']:
        if box['n'] in SKIP:
            continue
        for row in box['r']:
            lines = row[1].splitlines()
            picks = [line for line in lines if line.startswith(('Found:', 'Also:'))]
            same = {}
            for i, a in enumerate(picks):
                for b in picks[i + 1:]:
                    kind = itemstd.same_pickup(a, b, strict=bool(itemstd.head(a) and itemstd.head(b)))
                    if kind == 'same':
                        same.setdefault(a, []).append(b)
                        same.setdefault(b, []).append(a)
                    elif kind == 'unsure':
                        found['unsure'].append((row[0], a, b))
            for a, bs in same.items():
                for b in bs:
                    if a < b and len(bs) == 1 and len(same[b]) == 1:
                        found['twice'].append((row[0], a, b))
                    elif a < b:
                        found['unsure'].append((row[0], a, b))
            if box['n'] == 'TMs and HMs':
                for a in picks:
                    shop = next((s for s in lines if itemstd.same_shop(a, s)), None)
                    if shop:
                        found['shop'].append((row[0], a, shop))
            for a in picks:
                if itemstd.body(a)[:1].islower() and not itemstd.body(a).startswith(('reward, ', 'given ', 'received ')):
                    found['no place'].append((row[0], a))
                label = itemstd._LABEL.match(a).group()
                if label + ' ' + itemstd.drop_repeats(a[len(label):].strip()) != a:
                    found['repeat'].append((row[0], a))
    return found


def main(argv):
    samples, out, hacks = 3, None, []
    args = iter(argv)
    for arg in args:
        if arg == '--samples':
            samples = int(next(args))
        elif arg == '--out':
            out = next(args)
        else:
            hacks.append(arg)
    hacks = hacks or sorted(h for h in os.listdir(os.path.join(ROOT, 'hacks'))
                            if os.path.exists(os.path.join(ROOT, 'hacks', h, 'data.json')))
    md = ['| guide | twice | shop | no place | repeat | unsure |', '|---|---|---|---|---|---|']
    body = []
    for hack in hacks:
        D, _ = datajson.load(os.path.join(ROOT, 'hacks', hack, 'data.json'))
        found = scan(D)
        md.append(f'| {hack} | ' + ' | '.join(str(len(found[k])) for k in found) + ' |')
        body.append(f'\n## {hack}')
        for kind, rows in found.items():
            if rows:
                body.append(f'\n**{kind}** ({len(rows)})')
                for row in rows[:samples]:
                    body.append(f'- {row[0]}: ' + ' / '.join(f'`{x}`' for x in row[1:]))
    text = '\n'.join(md + body) + '\n'
    if out:
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as stream:
            stream.write(text)
    print(text)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main(sys.argv[1:])

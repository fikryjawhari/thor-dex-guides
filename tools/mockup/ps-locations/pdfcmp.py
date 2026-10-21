"""Wild Pokemon Locations.pdf vs the game tables: species, rates (day / night, bubbling) and SOS callers -> allies."""
import json, re, sys
from collections import Counter, defaultdict
import pdfplumber
sys.path.insert(0, 'hacks/photonic-sun/extract')
from common import norm  # noqa: E402
from locs import TITLE_FIX, ISLANDS, GENERIC, ALIAS  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8')
H = json.load(open('hacks/photonic-sun/.src/dex-rebalanced.json', encoding='utf-8'))
NAMES = {norm(s['name']): s['name'] for s in H['species']}


def nm(ws):
    """Join name words ('Mime', 'Jr.'), drop Kantonian/Alolan colouring we can't see."""
    t = ' '.join(ws).replace('’', "'")
    return t


def tok(s):
    return set(re.findall(r'[a-z]+|\d+', s.lower().replace("'", '').replace('’', '')))


def parse():
    pdf = pdfplumber.open('hacks/photonic-sun/.src/Wild Pokemon Locations.pdf')
    tabs, sos, title = [], [], ''
    for pg in pdf.pages[3:]:
        ws = [w for w in pg.extract_words(extra_attrs=['size', 'fontname'])]
        tl = defaultdict(list)
        for w in ws:
            if round(w['size']) == 18:
                tl[round(w['top'])].append(w)
        titles = []
        for t in sorted(tl):
            n = ' '.join(w['text'] for w in sorted(tl[t], key=lambda w: w['x0']))
            n = re.sub(r"Hau’ oli", "Hau’oli", n).replace('’', "'")
            titles.append((t, TITLE_FIX.get(n, n)))
        small = [w for w in ws if round(w['size']) == 12]
        heads = [w for w in small if w['text'] == 'Species' and 'Bold' in w['fontname']]
        for h in heads:
            ttl = [n for t, n in titles if t < h['top'] and n not in ISLANDS]
            cur = ttl[-1] if ttl else title
            same = sorted(x['x0'] for x in heads if abs(x['top'] - h['top']) < 3)
            right = min([x for x in same if x > h['x0'] + 5] + [9999])
            cols = [x for x in small if abs(x['top'] - h['top']) < 3 and h['x0'] < x['x0'] < right - 3]
            bub = next((x['x0'] for x in cols if x['text'].startswith('Bubbling')), None)
            ally = [x['x0'] for x in cols if x['text'] == 'Ally']
            # heading: bold words above the header (SOS Calls / Grass 1 + Levels line)
            above = [x for x in small if 'Bold' in x['fontname'] and 0 < h['top'] - x['top'] < 32 and h['x0'] - 3 <= x['x0'] < right - 3]
            lv = re.search(r'(\d+)\s*-\s*(\d+)', ' '.join(x['text'] for x in above if x['top'] > h['top'] - 18))
            head = ' '.join(x['text'] for x in sorted(above, key=lambda x: (round(x['top']), x['x0'])) if x['top'] < h['top'] - (18 if lv else 5) and not x['text'].startswith('Levels'))
            rows, top = [], h['top']
            lines = defaultdict(list)
            for x in small:
                if x['top'] > h['top'] + 5 and h['x0'] - 3 <= x['x0'] < right - 3:
                    lines[round(x['top'])].append(x)
            for t in sorted(lines):
                if t - top > 22:
                    break
                lw = sorted(lines[t], key=lambda x: x['x0'])
                if any('Bold' in x['fontname'] for x in lw):
                    break
                top = t
                name = [x['text'] for x in lw if not re.fullmatch(r'\d+', x['text']) and x['x0'] < h['x0'] + 60]
                rest = [x for x in lw if x['x0'] >= h['x0'] + 60 or re.fullmatch(r'\d+', x['text'])]
                rows.append((nm(name), rest))
            rate = next((x['x0'] for x in cols if x['text'] == 'Rate'), None)
            ax = min(ally) - 5 if ally else 9999
            for n, rest in rows:
                allies = []
                for x in (x for x in rest if x['x0'] >= ax and not re.fullmatch(r'\d+', x['text'])):
                    if allies and x['x0'] - allies[-1][1] < 8:
                        allies[-1] = (allies[-1][0] + ' ' + x['text'], x['x1'])
                    else:
                        allies.append((x['text'], x['x1']))
                if allies and n:
                    sos.append((cur, n, [a for a, _ in allies]))
            if rate is not None:
                out = []
                for n, rest in rows:
                    nums = [x for x in rest if re.fullmatch(r'\d+', x['text']) and x['x0'] < ax]
                    r = [int(x['text']) for x in nums if bub is None or x['x0'] < bub - 5]
                    b = [int(x['text']) for x in nums if bub is not None and x['x0'] >= bub - 5]
                    out.append((n, r, b))
                tabs.append({'title': cur, 'head': head, 'lv': (int(lv.group(1)), int(lv.group(2))) if lv else None, 'rows': out})
        if titles:
            title = [n for t, n in titles if n not in ISLANDS][-1] if [n for t, n in titles if n not in ISLANDS] else title
    return tabs, sos


tabs, sos = parse()
print(len(tabs), 'PDF tables,', len(sos), 'PDF SOS rows')


def gkey(s, f):
    return norm(s)


issues = []
used = Counter()
gsos = defaultdict(lambda: defaultdict(set))  # area -> caller -> allies
for ga in H['encounters']:
    gt = tok(ga['location'].replace('Poni Breaker', 'Ponibreaker') + ALIAS.get(ga['location'], ''))
    per = defaultdict(dict)
    for t in ga['tables']:
        per[t['table']][t['time']] = t
        for (sp, f, r), al in zip(t['slots'], t['sosBy']):
            for a, af in al:
                if (a, af) != (sp, f):
                    gsos[ga['location']][norm(sp)].add(norm(a))
    seen = set()
    for tn, tm in per.items():
        d, n = tm['day'], tm['night']
        rd, rn = Counter(), Counter()
        for s, f, r in d['slots']:
            rd[norm(s)] += r
        for s, f, r in n['slots']:
            rn[norm(s)] += r
        lv = tuple(d['levels'])
        sig = (lv, tuple(sorted(rd.items())), tuple(sorted(rn.items())))
        if sig in seen:
            continue
        seen.add(sig)
        sp = set(rd) | set(rn)
        best, bs = None, -99
        for i, pt in enumerate(tabs):
            tt = tok(pt['title']) - GENERIC
            if not tt or not tt <= gt or not pt['lv']:
                continue
            ps = {norm(r[0]) for r in pt['rows']}
            ov = len(sp & ps)
            if ov * 2 < len(sp):
                continue
            sc = ov * 3 - len(sp ^ ps) + (6 if pt['lv'] == lv else 0)
            if sc > bs:
                best, bs = i, sc
        if best is None:
            if len(sp) > 1 or 'pikipek' not in sp:
                issues.append(f"{ga['location']} table {tn} lv {lv[0]}-{lv[1]}: no PDF table ({', '.join(sorted(sp))})")
            continue
        pt = tabs[best]
        used[best] += 1
        where = f"{pt['title']} / {pt['head']}"
        diffs = []
        if pt['lv'] != lv and not (pt['head'].startswith('Fishing') and lv[0] == pt['lv'][0]):
            diffs.append(f"levels: PDF {pt['lv'][0]}-{pt['lv'][1]}, game {lv[0]}-{lv[1]}")
        bubbling = pt['head'].startswith('Fishing') and lv[1] > pt['lv'][1]
        ps = set()
        for name, r, b in pt['rows']:
            k = norm(name)
            ps.add(k)
            if k not in sp:
                diffs.append(f'{name}: in the PDF only')
                continue
            want = b if bubbling else r
            if not want:
                continue
            pd_, pn = (want[0], want[1]) if len(want) > 1 else (want[0], want[0])
            if (pd_, pn) != (rd.get(k, 0), rn.get(k, 0)):
                diffs.append(f"{name}: PDF {pd_}{'/' + str(pn) if pn != pd_ else ''}%, game {rd.get(k, 0)}{'/' + str(rn.get(k, 0)) if rn.get(k, 0) != rd.get(k, 0) else ''}%")
        for k in sorted(sp - ps):
            diffs.append(f"{NAMES.get(k, k)}: in the game only ({rd.get(k, 0)}/{rn.get(k, 0)}%)")
        if diffs:
            issues.append(f"{ga['location']} table {tn} = {where}{' (bubbling)' if bubbling else ''}: " + '; '.join(diffs))
for i, pt in enumerate(tabs):
    if not used[i] and pt['lv']:
        issues.append(f"PDF {pt['title']} / {pt['head']} {pt['lv']}: no game table")
print('\n'.join(issues))
print('\n== SOS: PDF vs game')
for title, caller, allies in sos:
    ga = [g for g in gsos if (tok(title) - GENERIC) and (tok(title) - GENERIC) <= tok(g.replace('Poni Breaker', 'Ponibreaker') + ALIAS.get(g, ''))]
    game = set().union(*(gsos[g].get(norm(caller), set()) for g in ga)) if ga else set()
    pdf = {norm(a) for a in allies} - {norm(caller)}
    if pdf != game:
        print(f'{title}: {caller} -> PDF {sorted(pdf)} game {sorted(game)}')

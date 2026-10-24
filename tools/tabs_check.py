"""Walkthrough and Trainers pages agree, in every guide: the same trainers, in the same order (a trainer at its last
walkthrough visit; tools/extractlib.py trainers_follow_walk), and the level cap a place or stop shows (dex.js trCapOf: the
section's cap, else its box's, else the trainer's) never goes down along either page. Optional boxes (no cap: Hot House,
Mini Bosses, post-game) are left out of the cap check.

Usage (repo root): python -I tools/tabs_check.py [hack ...]     (default: every hack with a data.json)
Exit 1 on any problem.
"""
import json
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


def sec_cap(s):
    c = s.get('cap')
    if isinstance(c, list):
        return c[1][0] if isinstance(c[0], list) else c[0]
    return c or 0


def check(hack):
    D = json.load(open(os.path.join(ROOT, 'hacks', hack, 'data.json'), encoding='utf-8'))
    G, bad = D['TR']['g'], []
    info, tr_order = {}, []
    for gi, g in enumerate(G):
        for s in g['sec']:
            for t in s['tr']:
                info[t['k']] = (gi, sec_cap(s) or g.get('cap') or t.get('cap') or 0, t['n'], s.get('h'))
                tr_order.append(t['k'])
    last, walk_caps, n = {}, [], 0
    for sp in D['WK']['splits']:
        for st in sp['st']:
            for k in st.get('tr', []):
                if k not in info:
                    bad.append(f'walkthrough trainer {k} not on the Trainers page')
                    continue
                last[k] = n
                n += 1
            ks = [k for k in st.get('tr', []) if k in info]
            if ks and all(G[info[k][0]].get('cap') for k in ks):
                walk_caps.append((max(info[k][1] for k in ks), f"{sp['n']} / {st['n']}"))
    in_walk = [k for k in tr_order if k in last]
    for a, b in zip(in_walk, in_walk[1:]):
        if last[a] > last[b]:
            bad.append(f'order: Trainers lists {info[a][2]} ({info[a][3]}) before {info[b][2]} ({info[b][3]}), '
                       'the walkthrough the other way')
    top = 0
    for cap, where in walk_caps:
        if cap < top:
            bad.append(f'walkthrough cap {cap} after {top}: {where}')
        top = max(top, cap)
    top = 0
    for g in G:
        if not g.get('cap'):
            continue
        for s in g['sec']:
            cap = sec_cap(s) or g['cap']
            if cap < top:
                bad.append(f"trainers cap {cap} after {top}: {g['n']} / {s.get('h')}")
            top = max(top, cap)
    caps = [g['cap'] for g in G if g.get('cap')]
    for a, b in zip(caps, caps[1:]):
        if b < a:
            bad.append(f'box caps go down: {a} then {b}')
    missing = len(tr_order) - len(in_walk)
    print(f"{hack}: {len(tr_order)} trainers, {missing} not in the walkthrough, {len(bad)} problems")
    for b in bad[:40]:
        print('  ' + b)
    return not bad


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    hacks = sys.argv[1:] or sorted(h for h in os.listdir(os.path.join(ROOT, 'hacks'))
                                   if os.path.exists(os.path.join(ROOT, 'hacks', h, 'data.json')))
    ok = all([check(h) for h in hacks])
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()

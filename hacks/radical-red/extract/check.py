"""Source-backed Radical Red checks: uv run python -I hacks/radical-red/extract/check.py

One function per unit's tab (trainer_checks: unit 6); main() runs them all. TODO (other units): their sections.
"""
from pathlib import Path
import collections
import json
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
data = Path(__file__).resolve().parents[1] / 'data.json'


def trainer_checks(D):
    """TR from data.js and the Hardcore workbook (notes.md → Trainers, Caps)."""
    from common import DATA, CAPS
    import bosssheet
    import trainers as T
    TR = D['TR']
    caps = [c['cap'][1] for c in CAPS]
    # the 18 Hardcore caps: Main E44:E78 = data.js caps = the boxes
    assert bosssheet.main_caps() == ['%s (%d)' % sc for sc in zip(T.SPLITS, caps)]
    assert [[g['n'], g['cap']] for g in TR['g']] == [['%s Split [Cap %d]' % sc, sc[1]] for sc in zip(T.SPLITS, caps)]
    assert TR['caps'] == [[n, c] for n, c in zip(T.SPLITS, caps)]
    cards = [(g, s, t) for g in TR['g'] for s in g['sec'] for t in s['tr']]
    for g, s, t in cards:
        assert t['cap'] == g['cap'], (g['n'], t['k'])
        assert t['loc'] == s['h'], t['k']
    # all 464 data.js trainers: a card each (by the key table's game id), the two partners, the two same-team copies
    keys = {e['k']: e for e in json.load(open(Path(__file__).with_name('trainer_keys.json'), encoding='utf-8'))}
    ids = [keys[t['k']]['id'] for _, _, t in cards]
    assert len(ids) == len(set(ids)) == 460, len(ids)
    every = set(ids) | set(T.PARTNERS) | set(T.SAME_TEAM)
    assert every == set(DATA['trainers']) and len(DATA['trainers']) == 464
    assert not set(ids) & (set(T.PARTNERS) | set(T.SAME_TEAM))
    split_of = {keys[t['k']]['id']: g['n'] for g, _, t in cards}
    # the user's answers: Justin (Route 12) in the Koga split, Lewis (Pokémon Mansion B1F) in the May split
    assert split_of['477'] == 'Pre-Koga Split [Cap 68]' and split_of['219'] == 'Pre-May Split [Cap 73]'
    by_id = {keys[t['k']]['id']: t for _, _, t in cards}
    assert all(m['l'] == 68 + {101: -2, 102: -1, 103: 0, 104: -3}[x['level']]
               for m, x in zip(by_id['477']['p'], DATA['trainers']['477']['hardcore']))
    # gym rematches: Pre-Koga, the cap box, the one note
    for i in T.REMATCHES:
        t = by_id[i]
        assert split_of[i] == 'Pre-Koga Split [Cap 68]' and all('r' in m for m in t['p']), i
        assert T.REMATCH_NOTE in t['note'] and 'Optional' not in t['tags'], i
    # the cap box: every range / open Trainer Order entry with scaled levels; nothing else relative
    relative = {i for i, t in by_id.items() if any('r' in m for m in t['p'])}
    order = bosssheet.trainer_order()
    assert len(order) == 115 and len(relative) == 46, (len(order), len(relative))
    for i in relative:
        assert not any('l' in m for m in by_id[i]['p']), i
    # the rival follows the starter type: each team set covers Fire / Grass / Water once
    rivals = collections.defaultdict(list)
    for i, t in by_id.items():
        if t['n'] in ('Rival Blue', 'Champion Blue'):
            rivals[(t['loc'], DATA['trainers'][i]['cap'])].append(t.get('st'))
    assert len(rivals) == 6 and all(sorted(v) == ['Fire', 'Grass', 'Water'] for v in rivals.values()), dict(rivals)
    # partners and shared battles
    assert [p['n'] for p in by_id['53']['pt']] == [p['n'] for p in by_id['54']['pt']] == ['PkMn Trainer Brendan']
    assert by_id['53']['bt'] == by_id['54']['bt'] and [p['n'] for p in by_id['69']['pt']] == ['Champion Lance']
    doubles = [t for _, _, t in cards if 'Double Battle' in t['tags']]
    assert len(doubles) == 47, len(doubles)
    print('PASS trainers: 464 data.js trainers (460 cards, 2 partners, 2 same-team), 18 Hardcore splits, '
          '%d cap-box cards, %d doubles, Justin / Lewis / rematch placement, rivals by starter type' %
          (len(relative), len(doubles)))


def main():
    if not data.is_file():
        print('SKIP radical-red extract-check: no data.json')
        return 0
    D = json.loads(data.read_text(encoding='utf-8'))
    trainer_checks(D)
    return 0


if __name__ == '__main__':
    sys.exit(main())

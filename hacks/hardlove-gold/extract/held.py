"""P.hi: wild held item odds from the hack's source (data/Species.c `.speciesData.wildHeldItems = {.common, .rare}`).
Hardlove calls pret/pokeheartgold's WildMonSetRandomHeldItem unchanged: the common slot 50%, the rare slot 5%, and the
same item in both slots 100%. A lone slot keeps its odds. Mega forms get none (the game never gives them items)."""
from common import X, key, report
import hgsource

ODDS = {'common': 50, 'rare': 5}

def build(D):
    HG = X.HG
    # item names as the trainer sets spell them (Kings Rock -> King's Rock), as gid.py does
    spelt = {key(m['i']): m['i'] for group in D['TR']['g'] for section in group['sec'] for t in section['tr']
             for m in t['p'] if m.get('i')}
    name = lambda c: spelt.get(key(hgsource.Src.title(c, 'ITEM_')), hgsource.Src.title(c, 'ITEM_'))
    done = []
    for p in D['P']:
        if p['g'] == 1: continue
        s = HG.S.get('SPECIES_' + p['id'].upper())
        if not isinstance(s, dict) or 'speciesData' not in s: continue
        w = s['speciesData'].get('wildHeldItems') or {}
        hi = []
        for slot in ('common', 'rare'):
            c = w.get(slot)
            if not c or c == 'ITEM_NONE': continue
            n = name(c)
            if n in [h[0] for h in hi]: hi = [[h[0], 100] if h[0] == n else h for h in hi]
            else: hi.append([n, ODDS[slot]])
        if hi:
            p['hi'] = hi
            done.append(p['id'] + ' ' + ' / '.join('%s %d%%' % (h[0], h[1]) for h in hi))
    report('wild held items (P.hi):', '; '.join(done) or 'none')

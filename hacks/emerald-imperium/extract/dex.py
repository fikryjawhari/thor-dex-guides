"""Dex (M, MV, AB, P, TC): species, moves, abilities and the type chart from the eidex data, then the official Changes doc.

eidex.py picks the species and forms. Evolution methods are written in plain words (codes from the dex site's
parseEvo.ts). Move values are the game's; Showdown's Gen 9 values give the priority, the MV.h change notes and which
abilities are EI originals. changes.py's doc-versus-dex comparison adds P.vc / P.cf, MV.dc / MV.e / MV.cf and the
abilities' effect text. P.w and P.g are filled by locs.py.
"""
import json
from pathlib import Path
import re
import changes
from common import key, report
from eidex import AD, CR, MD, SD, SDA, TD, TN, FC, MEGA, NAME, canon, item, keep, sp

mvname = lambda i: MD.get(str(i), {}).get('name', f'move {i}')
spname = lambda i: NAME.get(canon(i), sp.get(i, {}).get('speciesName', f'#{i}'))
EVO = {
 1: lambda p: 'level up with high friendship', 2: lambda p: 'level up with high friendship during the day',
 3: lambda p: 'level up with high friendship at night', 4: lambda p: f'level {p}', 5: lambda p: 'trade',
 6: lambda p: f'trade while holding {item(p)}', 7: lambda p: f'use {item(p)}',
 8: lambda p: f'level {p} with Attack higher than Defense', 9: lambda p: f'level {p} with Attack equal to Defense',
 10: lambda p: f'level {p} with Attack lower than Defense', 11: lambda p: f'level {p} (personality value decides)',
 12: lambda p: f'level {p} (personality value decides)', 13: lambda p: f'level {p}',
 14: lambda p: f'level {p} with a spare party slot and a Poké Ball', 15: lambda p: f'level up with Beauty {p} or higher',
 16: lambda p: f'level {p} (female)', 17: lambda p: f'level {p} (male)', 18: lambda p: f'level {p} at night',
 19: lambda p: f'level {p} during the day', 20: lambda p: f'level {p} at dusk',
 21: lambda p: f'level up holding {item(p)} during the day', 22: lambda p: f'level up holding {item(p)} at night',
 23: lambda p: f'level up knowing {mvname(p)}', 24: lambda p: f'level up with high friendship knowing a {TN.get(p, "?")}-type move',
 25: lambda p: 'level up at a special location', 26: lambda p: f'use {item(p)} (male)', 27: lambda p: f'use {item(p)} (female)',
 28: lambda p: f'level {p} while it rains in the overworld', 29: lambda p: f'level up with {spname(p)} in the party',
 30: lambda p: f'level {p} with a Dark type in the party', 31: lambda p: f'trade for {spname(p)}',
 32: lambda p: 'level up at a special location', 33: lambda p: f'level {p} with an Amped nature',
 34: lambda p: f'level {p} with a Low Key nature', 35: lambda p: f'land {p} critical hits in one battle',
 42: lambda p: f'level {p} in overworld fog', 43: lambda p: f'level up knowing {mvname(p)} (rare 1 in 100 form)',
 44: lambda p: f'level up knowing {mvname(p)}', 45: lambda p: f'level {p} (rare 1 in 100 form)', 46: lambda p: f'level {p}',
}


def build(D):

    ET = {i: [] for i in keep}; EF = {i: [] for i in keep}; unk = set()
    for i in keep:
        for m, t, p in sp[i]['evolutions'] or []:
            if m == 0: continue
            t = canon(t)
            if t not in keep: continue
            how = EVO[m](p) if m in EVO else (unk.add(m) or f'method {m}')
            if [how, t] not in ET[i]: ET[i].append([how, t])
            if [how, i] not in EF[t]: EF[t].append([how, i])
    if unk: report(f'unknown evo methods {unk}')
    order = sorted(keep, key=lambda i: (sp[i]['dexId'], 0 if not sp[i]['formId'] else 1, sp[i]['speciesId']))
    Mi = {}; M = []; MV = []
    CAT = ['Physical', 'Special', 'Status']
    def m(mid):
        if mid in Mi: return Mi[mid]
        d = MD[str(mid)]; Mi[mid] = len(M); M.append(d['name'])
        sd = SD.get(key(d['name']))
        ac = None if d['acc'] in (0, 999) else d['acc']
        bp = d['power'] or None
        o = {'t': TN.get(d['type'], ''), 'c': CAT[d['cat']], 'bp': ('Varies' if bp == 1 else bp), 'ac': ac, 'pp': d['pp'],
             'pr': sd['pr'] if sd else 0, 'd': (d['description'] or '').replace('- ', ''), 'f': d.get('properties') or []}
        if CR.get(key(d['name'])): o['cr'] = CR[key(d['name'])]
        # changes versus standard Gen 9 (Showdown); EI originals have no Showdown entry
        h = []
        if not sd: o['x'] = 1
        else:
            sbp = sd['bp'] or 0; ebp = bp if isinstance(o['bp'], int) else 0
            if sbp != ebp and o['bp'] != 'Varies' and not (sbp == 0 and sd['c'] == o['c']): h.append(f"Power {sbp or '-'} → {ebp or '-'}")
            if sd['ac'] != ac and not (sd['ac'] is None and o['c'] == 'Status'): h.append(f"Accuracy {sd['ac'] or 'never misses'} → {ac or 'never misses'}")
            if sd['pp'] != d['pp']: h.append(f"PP {sd['pp']} → {d['pp']}")
            if sd['t'] != o['t']: h.append(f"Type {sd['t']} → {o['t']}")
            if sd['c'] != o['c']: h.append(f"Category {sd['c']} → {o['c']}")
        o['h'] = h; MV.append(o)
        return Mi[mid]
    ABi = {}; AB = []
    def ab(aid):
        if not aid: return -1
        if aid not in ABi:
            a = AD[str(aid)]; ABi[aid] = len(AB); AB.append([a['name'], a['description'], 0 if key(a['name']) in SDA or any(n.startswith(a['name'] + ' (') for n in SDA.values()) else 1])
        return ABi[aid]
    nosd = set()
    P = []
    for i in order:
        v = sp[i]
        a1, a2, h = (v['abilities'] + [0, 0, 0])[:3]
        reg = [x for x in dict.fromkeys([a1, a2]) if x]
        sib = [canon(x) for x in (v['siblings'] or [])]
        of = sorted({x for x in sib if x in keep and x != i}, key=lambda x: order.index(x))
        P.append({'id': str(i), 'n': NAME[i], 'dex': v['dexId'], 't': [TN[t] for t in dict.fromkeys(v['types'])],
                  'a': [ab(x) for x in reg], 'ha': ab(h) if h and h not in reg else -1, 's': [v['stats'][k] for k in (0, 1, 2, 4, 5, 3)],  # source order is HP,Atk,Def,Spe,SpA,SpD (Gen 3)
                  'ef': [[how, str(t)] for how, t in EF[i]], 'et': [[how, str(t)] for how, t in ET[i]], 'of': [str(x) for x in of],
                  'lv': [[l, m(x)] for x, l in v['levelUpMoves']], 'tm': [m(x) for x in v['tmMoves'] or []],
                  'eg': [m(x) for x in v['eggMoves'] or []], 'w': [], 'g': 1 if i in MEGA else 3,
                  'hi': [item(x) for x in v['heldItems'] if x], **({'fc': 1} if i in FC else {})})
    for i, name in enumerate(M):
        if not SD.get(key(name)): nosd.add(name)
    report(f'EI original abilities: {[a[0] for a in AB if a[2]]}'); report(f'changed vs Gen 9: {sum(1 for x in MV if x["h"])}'); report(f'moves {len(M)} (no Showdown match for priority: {len(nosd)}: {", ".join(sorted(nosd)[:15])}...), abilities {len(AB)}')
    # type chart: attacking type -> multiplier x10 per defending type id
    TCH = {TD[k]['typeName']: {TN[j]: TD[k]['matchup'][j] for j in TN if j < len(TD[k]['matchup'])} for k in TD}
    D.update(M=M, MV=MV, AB=AB, P=P, TC=TCH, src='eidex repo (Mar 2026)')
    merge_changes(D)


def merge_changes(D):
    """The 1.3.1 Changes doc into P (vc, cf), MV (dc, e, cf) and AB (effect text)."""
    SP, CM = changes.species(), changes.moves(D)
    CM['mv'][key('Strange Steam')] = CM['mv'].pop(key('Strange Stream'))  # doc typo
    for p in D['P']:
        o=SP.get(p['id'])
        if not o: continue
        vc={k[1]:o[k] for k in ('vs','vt','va') if k in o}
        if vc: p['vc']=vc
        if o.get('cf'): p['cf']=o['cf']
    mconf=dict((key(n),d) for n,d in CM['conf'])
    for i,n in enumerate(D['M']):
        d=CM['mv'].get(key(n)); v=D['MV'][i]
        if d:
            v['dc']=1
            if d['e']: v['e']=d['e']
        if key(n) in mconf: v['cf']=['Changes doc says '+x.replace(' dex ',', EI Dex says ').split(' ',1)[0]+' '+x.split(' ',1)[1].replace('doc ','',1).replace(' dex ',', EI Dex says ') for x in mconf[key(n)]]
    for a in D['AB']:
        d=CM['ab'].get(key(a[0]))
        a.append(d['e'] if d else '')
    ability_text = json.loads(Path(__file__).with_name('ability_text.json').read_text(encoding='utf-8'))
    for ability in D['AB']:
        if not ability[2] and ability[3]:
            text = ability_text[ability[0]]
            ability.extend([text['s'], text['o']])
    D['src'] += '; EI Changes doc 1.3.1'
    report('changes doc merged: P vc', sum('vc' in p for p in D['P']), 'P cf', sum('cf' in p for p in D['P']), 'MV dc',
           sum('dc' in v for v in D['MV']), 'MV cf', [(D['M'][i], v['cf']) for i, v in enumerate(D['MV']) if 'cf' in v][:3],
           'AB doc', sum(1 for a in D['AB'] if a[3]))

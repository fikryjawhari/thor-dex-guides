"""Encounter standard (template/README.md → Encounters, decided with the user 2026-11-04): one shape for every guide's encounters.

    import encstd
    e = encstd.Enc()                                   # one per tracker slot (AR area)
    e.add('grass', pid, 20, lv='30-32')                # a row: kind code, species id, rate in % (or t='Common')
    e.add('water', pid, 60, lv='75', chip='S')         # chips say how: Surf / a rod / Horde / Bubbling ...
    e.add('grass', pid, 10, when='n', floor='B1F')     # when: morning / day / night, a season
    e.write(D, a)                                      # AR[a].es (+ fo), and one flagged P.w row per line
    encstd.finish(D)                                   # D.ESV = 2 (the template reads the standard), checks

The shape (template/README.md → Encounters):
  AR[a].es = [{k, g: [{f floor, v subheading, lv level, dr raid drops, rows: [{p, r: {'chip|when': %}, t text rate,
              lv, kl: {'chip|when': level}, note, sos: [[p, when]]}]}]}]   (empty fields left out)
  AR[a].fo = [floor, ...]  the floors in route order, when there are 2+
Sections (k) in KINDS order; their names are the template's. A row's rate keys are 'chip|when': chip = how (always
shown), when = a time or season (kept only when the row differs between them: a row the same in every case collapses
to 'chip|'). Level once: the most common level on the group; a row (lv) or a chip line (kl) only where it differs.
Every es row is repeated in P.w (flagged w[5] = 1) for Pokémon pages, search and the tracker: label
"[floor · ]Section[ · subheading][ · chip]" (Special / Raids / Gifts & static: the subheading alone; trades: "Trade").
"""
import re

KINDS = [('grass', 'Grass'), ('cave', 'Cave'), ('water', 'Water'), ('special', 'Special'), ('raid', 'Raids'),
         ('gift', 'Gifts & static'), ('trade', 'Trades')]
KIND_NAME = dict(KINDS)
KIND_ORDER = {k: i for i, (k, _) in enumerate(KINDS)}
# How (always shown on the rate) and when (only where a row differs); the template has the same labels.
CHIPS = {'': '', 'Su': 'Surf', 'SuR': 'Surf ripple', 'O': 'Old', 'G': 'Good', 'S': 'Super', 'F': 'Fish',
         'FR': 'Fish ripple', 'Bub': 'Bubbling', 'H': 'Horde'}
CHIP_ORDER = list(CHIPS)
WHEN = {'': '', 'm': 'morning', 'd': 'day', 'n': 'night', 'sa': 'Spring–Autumn', 'sp': 'Spring', 'su': 'Summer',
        'au': 'Autumn', 'wi': 'Winter'}
WHEN_ORDER = list(WHEN)
VERSION = 2


def num(x):
    x = round(float(x), 1)
    return int(x) if x == int(x) else x


def lv_merge(levels):
    """'30-32' and '31-34' -> '30-34'; text that isn't a number or range is listed as is."""
    levels = [str(x) for x in levels if x not in (None, '')]
    if not levels:
        return ''
    nums = []
    for x in levels:
        m = re.fullmatch(r'\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*', x)
        if not m:
            return ', '.join(dict.fromkeys(levels))
        nums += [int(m.group(1)), int(m.group(2) or m.group(1))]
    lo, hi = min(nums), max(nums)
    return str(lo) if lo == hi else f'{lo}-{hi}'


def key_sort(k):
    c, w = k.split('|')
    return CHIP_ORDER.index(c), WHEN_ORDER.index(w)


def label(kind, v='', chip='', floor=''):
    """The method text for P.w (Pokémon pages, the walkthrough's lines use the same names)."""
    if kind == 'trade':
        head = 'Trade'
    elif kind in ('special', 'raid', 'gift') and v:
        head = v
    else:
        head = ' · '.join(x for x in (KIND_NAME[kind], v) if x)
    return ' · '.join(x for x in (floor, head, CHIPS[chip]) if x)


def rate_text(byw):
    """{when: %} of one chip -> '20%' or '20% day, 10% night'."""
    if list(byw) == ['']:
        return f'{num(byw[""])}%' if byw[''] else ''
    return ', '.join(f'{num(v)}% {WHEN[w].lower()}' for w, v in sorted(byw.items(), key=lambda x: WHEN_ORDER.index(x[0])) if v)


class Enc:
    """The rows of one tracker slot, in the order added; write() turns them into the standard."""

    def __init__(self):
        self.floors = ['']
        self.groups = {}     # (kind, floor, v) -> {'rows': {pid: row}, 'dr': '', 'order': n}

    def add(self, kind, p, rate=None, lv='', floor='', v='', chip='', when='', note='', t='', sos=None, dr='', loc=None):
        assert kind in KIND_NAME, f'encstd: unknown kind {kind!r}'
        assert chip in CHIPS, f'encstd: unknown chip {chip!r}'
        assert when in WHEN, f'encstd: unknown when {when!r}'
        if floor not in self.floors:
            self.floors.append(floor)
        g = self.groups.setdefault((kind, floor, v), {'rows': {}, 'dr': '', 'order': len(self.groups)})
        if dr:
            g['dr'] = dr
        x = g['rows'].setdefault(p, {'p': p, 'r': {}, 'lv': {}, 't': '', 'note': [], 'sos': [], 'loc': loc,
                                     'plv': []})
        if rate is not None:
            key = chip + '|' + when
            x['r'][key] = num(x['r'].get(key, 0) + float(rate))
            x['lv'].setdefault(key, []).append(lv)
        else:
            x['plv'].append(lv)
            if chip or when:
                x['r'].setdefault(chip + '|' + when, 0)
                x['lv'].setdefault(chip + '|' + when, []).append(lv)
        if t and t not in x['t'].split(', '):
            x['t'] = ', '.join(y for y in (x['t'], t) if y)
        if note and note not in x['note']:
            x['note'].append(note)
        for s in sos or []:
            if list(s) not in x['sos']:
                x['sos'].append(list(s))
        if x['loc'] is None:
            x['loc'] = loc
        return x

    def _group(self, kind, floor, v, g):
        rows = list(g['rows'].values())
        # when: per chip, the whens any row has; a row with the same rate in all of them collapses to 'chip|'
        Q = {}
        for x in rows:
            for k in x['r']:
                c, w = k.split('|')
                Q.setdefault(c, set()).add(w)
        out = []
        for x in rows:
            by = {}
            for k, val in x['r'].items():
                c, w = k.split('|')
                by.setdefault(c, {})[w] = val
            r, kl = {}, {}
            for c, ws in by.items():
                levels = [l for w in ws for l in x['lv'].get(c + '|' + w, [])]
                if len(ws) > 1 and set(ws) == Q[c] and len(set(ws.values())) == 1:
                    r[c + '|'] = next(iter(ws.values()))
                    kl[c + '|'] = lv_merge(levels)
                else:
                    for w, val in ws.items():
                        r[c + '|' + w] = val
                        kl[c + '|' + w] = lv_merge(x['lv'].get(c + '|' + w, []))
            r = {k: r[k] for k in sorted(r, key=key_sort)}
            row = {'p': x['p'], 'r': r, 'kl': {k: kl[k] for k in r}, 'plv': lv_merge(x['plv']), 't': x['t'],
                   'note': '; '.join(x['note']), 'sos': x['sos'], 'loc': x['loc']}
            out.append(row)
        # level once: the most common level goes on the group; a row (one rate) or a chip line shows its own only
        # where it differs
        count, plain = {}, any(k.startswith('|') for row in out for k in row['kl'])
        for row in out:   # the plain chip's levels when there are any (Grass with hordes: the grass level)
            for k, l in (list(row['kl'].items()) if row['r'] else [('|', row['plv'])]):
                if l and (not plain or k.startswith('|')):
                    count[l] = count.get(l, 0) + 1
        glv = max(count, key=lambda l: (count[l], -list(count).index(l))) if count else ''
        res = []
        for row in out:
            y = {'p': row['p']}
            if row['r'] and (any(row['r'].values()) or set(row['r']) != {'|'}):
                y['r'] = row['r']          # chips with no rate (a gift by Surf) still say how
            if row['t']:
                y['t'] = row['t']
            if row['r']:
                own = {k: l for k, l in row['kl'].items() if l and l != glv}
                if own and len(row['r']) == 1:
                    y['lv'] = next(iter(own.values()))
                elif own:
                    y['kl'] = own
            elif row['plv'] and row['plv'] != glv:
                y['lv'] = row['plv']
            if row['note']:
                y['note'] = row['note']
            if row['sos']:
                y['sos'] = row['sos']
            res.append((y, row))
        grp = {}
        if floor:
            grp['f'] = floor
        if v:
            grp['v'] = v
        if glv:
            grp['lv'] = glv
        if g['dr']:
            grp['dr'] = g['dr']
        grp['rows'] = [y for y, _ in res]
        return grp, res, glv

    def write(self, D, a):
        """AR[a].es / fo from the rows added, and their P.w lines (flagged 1) on the species."""
        A = D['AR'][a]
        byid = D.get('_byid') or {p['id']: p for p in D['P']}
        secs = {}
        keys = sorted(self.groups, key=lambda k: (KIND_ORDER[k[0]], self.floors.index(k[1]), k[2] != '',
                                                  self.groups[k]['order']))
        for kind, floor, v in keys:
            grp, res, glv = self._group(kind, floor, v, self.groups[(kind, floor, v)])
            secs.setdefault(kind, []).append(grp)
            for y, row in res:
                loc = row['loc'] if row['loc'] is not None else A['l'][0]
                note = row['note']
                by = {}
                for k in (row['r'] or {}):
                    c, w = k.split('|')
                    by.setdefault(c, {})[w] = row['r'][k]
                if not by:
                    by = {'': {'': 0}}
                for c, ws in by.items():
                    lvt = lv_merge([row['kl'].get(c + '|' + w) for w in ws]) if row['r'] else row['plv']
                    byid[row['p']]['w'].append([loc, label(kind, v, c, floor), row['t'] or rate_text(ws), lvt, note, 1])
        es = [{'k': k, 'g': secs[k]} for k, _ in KINDS if k in secs]
        if es:
            A['es'] = es
        else:
            A.pop('es', None)
        fo = [f for f in self.floors if f and any(g.get('f') == f for s in es for g in s['g'])]
        if len(fo) > 1 or (fo and any(not g.get('f') for s in es for g in s['g'])):
            A['fo'] = ([''] if any(not g.get('f') for s in es for g in s['g']) else []) + fo
        else:
            A.pop('fo', None)
        return A


def finish(D):
    """Marks the data as the standard and checks it: every P.w row of an area with es is one of its es lines."""
    D['ESV'] = VERSION
    AR = D['AR']
    owner = {}
    for a, A in enumerate(AR):
        for li in A['l']:
            owner[li] = a
    bad = []
    for p in D['P']:
        for w in p['w']:
            a = owner.get(w[0])
            if a is None:
                continue
            if not (len(w) > 5 and w[5] == 1):
                bad.append(f"{AR[a]['n']}: {p.get('n') or p['id']} {w[1]}")
    assert not bad, 'encstd: P.w rows outside the standard (add them with Enc.add): ' + '; '.join(bad[:8])
    for A in AR:
        for s in A.get('es', []):
            assert s['k'] in KIND_NAME and s['g'], f"encstd: {A['n']}: bad section {s.get('k')}"
            for g in s['g']:
                assert g['rows'], f"encstd: {A['n']}: empty group"
                for x in g['rows']:
                    for k in x.get('r', {}):
                        c, w = k.split('|')
                        assert c in CHIPS and w in WHEN, f"encstd: {A['n']}: bad rate key {k}"


class LevelAwareEnc(Enc):
    """Opt-in: preserve seasonal levels and never give an unspecified row the group's known level."""

    def _group(self, kind, floor, variant, group):
        output, rows, common_level = super()._group(kind, floor, variant, group)
        if common_level and any(not row['plv'] and not any(row['kl'].values()) for _, row in rows):
            common_level = ''
            output.pop('lv', None)
        for published, row in rows:
            source = group['rows'][row['p']]
            for collapsed in list(row['r']):
                chip, when = collapsed.split('|')
                if when:
                    continue
                keys = [key for key in source['r'] if key.split('|')[0] == chip]
                levels = {key: lv_merge(source['lv'].get(key, [])) for key in keys}
                if len(keys) < 2 or len(set(levels.values())) < 2:
                    continue
                row['r'].pop(collapsed)
                row['kl'].pop(collapsed, None)
                row['r'].update({key: source['r'][key] for key in keys})
                row['kl'].update(levels)
            row['r'] = dict(sorted(row['r'].items(), key=lambda entry: key_sort(entry[0])))
            if row['r']:
                published['r'] = row['r']
            published.pop('lv', None)
            published.pop('kl', None)
            if row['r']:
                own = {key: level for key, level in row['kl'].items() if level and level != common_level}
                if own and len(row['r']) == 1:
                    published['lv'] = next(iter(own.values()))
                elif own:
                    published['kl'] = own
            elif row['plv'] and row['plv'] != common_level:
                published['lv'] = row['plv']
        return output, rows, common_level

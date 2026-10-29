"""M, MV, AB, P, TC for Pokémon Unbound 2.1.1.1: the RomHackDex mirror (stats, types, abilities, learnsets, moves,
type chart) with the unboundwiki.com export as cross-check and for what the mirror lacks (evolution methods, Mega Stone
locations, wild held items, the text of Unbound's own abilities). Differences: a species' "Wiki says ..." card (p.cf)
and the build report. Names and forms: tools/cfru.py. notes.md → Dex has the rules.

    build(D)    writes D['M'], D['MV'], D['AB'], D['P'], D['TC']
"""
import collections
import json
import os
import re

import cfru
from common import (ABILITY_NAMES, FORMS, MOVE_NAMES, OWN, RD, WIKI, WIKI_ABILITY_FIX, H, base_name, key, move, pid,
                    report, sid)
from wiki import key as wkey

KIND_ORDER = {'base': 0, 'mega': 1, 'regional': 2, 'form': 3}
TM_ORDER = lambda label: (label[:2] == 'HM', label)
# Edges the mirror draws that are no evolution in Unbound (its family chain flattened through forms and branches).
NOT_EVO = {('solgaleo', 'lunala'), ('necrozma_dusk_mane', 'necrozma_dawn_wings'), ('steelix', 'steelix'),
           ('marowak', 'marowak_a'), ('raichu', 'raichu_a'), ('wormadam_sandy', 'mothim'), ('urshifu', 'urshifu_rapid'),
           ('goodra', 'sliggoo_h'), ('lycanroc', 'lycanroc_n'), ('lycanroc_n', 'lycanroc_dusk'),
           ('toxtricity', 'toxtricity_low_key'), ('eevee', 'leafeon')}
# Mirror edges drawn from the wrong parent, and methods the mirror only names by kind: (parent, child) -> (parent, how).
EVO_FIX = {('meowstic', 'meowstic_female'): ('espurr', 'level 25 (female)'),
           ('basculegion', 'basculegion_f'): ('basculin_h', 'level up knowing Wave Crash (female)'),
           ('burmy', 'wormadam_sandy'): ('burmy', 'level 20 (female, Sandy Cloak)'),
           ('burmy', 'wormadam_trash'): ('burmy', 'level 20 (female, Trash Cloak)'),
           ('mime_jr_g', 'mr_mime_g'): ('mime_jr_g', 'level up knowing Mimic'),
           ('pumpkaboo_l', 'gourgeist_l'): ('pumpkaboo_l', 'trade'), ('pumpkaboo_m', 'gourgeist_m'): ('pumpkaboo_m', 'trade'),
           ('pumpkaboo_xl', 'gourgeist_xl'): ('pumpkaboo_xl', 'trade')}
# Abilities the mirror shows under another ability's name: Unbound's own abilities (and Mega Medicham's Huge Power),
# as the game's species table has them (Skeli's Unbound-Cloud tables, read through hzla's generated
# save_constants/unbound_2_1_constants.js at ff6c3e3, 2026-10-29); the wiki and hzla's boss sets agree where they
# list the species. id -> (abilities, hidden).
ABILITY_FIX = {
    'spearow': (['Keen Eye', 'Sniper'], 'Drill Beak'), 'fearow': (['Keen Eye', 'Sniper'], 'Drill Beak'),
    'vibrava': (['Levitate'], 'Sound Waves'), 'flygon': (['Levitate'], 'Sound Waves'),
    'smoochum': (['Oblivious', 'Hydration'], 'Icy Skin'), 'jynx': (['Oblivious', 'Dry Skin'], 'Icy Skin'),
    'glaceon': (['Snow Cloak'], 'Icy Skin'), 'magcargo': (['Evaporate', 'Flame Body'], 'Weak Armor'),
    'medicham_mega': (['Huge Power'], None), 'pidove': (['Rivalry', 'Super Luck'], 'Pride'),
    'tranquill': (['Rivalry', 'Super Luck'], 'Pride'), 'unfezant': (['Rivalry', 'Super Luck'], 'Pride'),
    'seviper': (['Shed Skin', 'Infiltrator'], 'Slippery Tail'), 'sunflora': (['Chlorophyll', 'Solar Power'], 'Grass Dash'),
    'wyrdeer': (['Intimidate', 'Frisk'], 'Sap Sipper'), 'unfezant_f': (['Big Pecks', 'Super Luck'], 'Pride'),
    'calyrex_ice_rider': (['As One (Glastrier)'], None), 'calyrex_shadow_rider': (['As One (Spectrier)'], None),
}


def wiki_how(how):
    """The wiki's "Acquire At" text in the guides' wording."""
    h = re.sub(r'^(?:Evolve|Evolves)\s+(?:at|with|by)\s+', '', how.strip(), flags=re.I)
    h = re.sub(r'^Level up \w[\w.\']* (with|knowing|while|holding|in|at|during)', r'level up \1', h)
    h = re.sub(r'^Use (.+?) \(on [^)]*\)$', r'Use \1', h)
    return cfru.evo_text(h)


def build(D):
    S = RD.species()
    calc = cfru.calc_names()
    wmons = {wkey(t): m for t, m in WIKI.pokemon().items()}

    # ---- moves: moves.json, official names; Max / G-Max and Z-move copies left out (no species learns them) ----
    raw = json.load(open(os.path.join(H.src, 'romhackdex', 'moves.json'), encoding='utf-8'))
    use = collections.Counter(m for sp in S.values() for m in [x for _, x in sp.lv] + [x for _, x in sp.tm] + sp.tutor + sp.egg)
    groups, skipped = collections.OrderedDict(), collections.Counter()
    for m in raw:
        k = cfru.move_kind(m['n'])
        if k:
            skipped[k] += 1
            continue
        groups.setdefault(cfru.official(m['n']), []).append(m)
    merged = []
    for name, ms in groups.items():
        if len(ms) > 1:
            ms.sort(key=lambda m: -use[m['n']])
            diff = [f for f in ('t', 'c', 'bp', 'ac', 'pp', 'pr') if len({m.get(f) for m in ms}) > 1]
            merged.append('%s <- %s%s' % (name, ' / '.join('"%s" (%d uses)' % (m['n'], use[m['n']]) for m in ms),
                                         ' differ in ' + ', '.join(diff) if diff else ''))
    M = sorted(groups, key=str.lower)
    MI = {n: i for i, n in enumerate(M)}
    for n in M:
        MOVE_NAMES[key(n)] = n
        for m in groups[n]:
            MOVE_NAMES.setdefault(key(m['n']), n)
    unknown_moves = collections.Counter()

    def mi(name, where):
        n = MOVE_NAMES.get(key(name)) or MOVE_NAMES.get(key(cfru.official(name)))
        if n is None:
            unknown_moves[name] += 1
            return None
        return MI[n]

    crit = dict.fromkeys(cfru.HIGH_CRIT, 1) | dict.fromkeys(cfru.ALWAYS_CRIT, 6)
    MV, originals = [], []
    for n in M:
        m = groups[n][0]
        o = {'t': m['t'], 'c': m['c'], 'bp': m['bp'], 'ac': m['ac'], 'pp': m['pp'], 'pr': m.get('pr') or 0,
             'd': cfru.clean(m.get('d')), 'h': []}
        if crit.get(n):
            o['cr'] = crit[n]
        if n not in calc:
            o['x'] = 1
            originals.append(n)
        MV.append(o)

    # ---- species and forms ----
    def pages_sorted():
        bases = [s for s, f in FORMS.items() if f.kind == 'base']
        dex = lambda s: S[s].dex if s not in OWN and (S[s].dex or 0) < 10000 else 99999
        out = []
        for b in sorted(bases, key=lambda s: (dex(s), s)):
            out.append(b)
            kids = [s for s, f in FORMS.items() if f.kind in KIND_ORDER and f.kind != 'base' and f.base == FORMS[b].base]
            out += sorted(kids, key=lambda s: (KIND_ORDER[FORMS[s].kind], s))
        return out

    P, byid, cf_count, merged_forms, dropped, dexfix, wiki_cf = [], {}, collections.Counter(), [], [], [], []
    for slug, f in FORMS.items():
        if f.kind == 'drop':
            dropped.append('%s (%s)' % (slug, f.drop))
    ab_seen, base_dex, abfix = collections.OrderedDict(), {}, []
    for slug in pages_sorted():
        f, page = FORMS[slug], S[slug]
        into = cfru.merge_into(f, FORMS, S)
        if into:
            merged_forms.append('%s -> %s' % (slug, pid(into)))
            continue
        name = f.name(base_name(slug))
        base_page = S.get(cfru.VIRTUAL_BASE.get(f.base, f.base))
        dex = (base_page or page).dex
        if slug in OWN:
            dex = 0
        w = wmons.get(wkey(name)) or (wmons.get(wkey(base_name(slug))) if f.kind == 'base' else None)
        if f.kind == 'base' and dex in base_dex and w and w.dex and w.dex != dex:
            dexfix.append('%s: mirror sprite #%s (also %s), wiki National Dex #%d (wiki taken)'
                          % (slug, dex, base_dex[dex], w.dex))
            dex = w.dex
        if f.kind == 'base':
            base_dex.setdefault(dex, slug)
        abil = list(dict.fromkeys(cfru.official(a) for a in page.abilities))
        hidden = cfru.official(page.hidden) if page.hidden else None
        if pid(slug) in ABILITY_FIX:
            was = '%s | %s' % (' / '.join(abil), hidden)
            abil, hidden = ABILITY_FIX[pid(slug)]
            abfix.append('%s: %s -> %s | %s' % (pid(slug), was, ' / '.join(abil), hidden))
        for a in abil + [hidden]:
            if a:
                ab_seen.setdefault(a, set()).add(slug)
        p = {'id': pid(slug), 'n': name, 'dex': dex, 't': list(page.types), 's': list(page.stats),
             '_a': abil, '_h': hidden if hidden not in abil else None,
             'ef': [], 'et': [], 'of': [], 'lv': [], 'tm': [], 'tu': [], 'eg': [], 'w': [], 'g': 1 if f.kind == 'mega' else 0}
        where = 'RomHackDex ' + slug
        p['lv'] = [[lvl, mi(m, where)] for lvl, m in page.lv]
        p['tm'] = [mi(m, where) for _, m in sorted(page.tm, key=lambda x: TM_ORDER(x[0]))]
        p['tu'] = [mi(m, where) for m in page.tutor]
        p['eg'] = [mi(m, where) for m in page.egg]
        if f.fc:
            p['fc'] = 1
        if w and w.held and f.kind in ('base', 'regional'):
            p['hi'] = [re.sub(r'\s*\([^)]*\)$', '', h) for h in w.held]
        # wiki cross-check (types, abilities): the "Wiki says ..." card
        p['_w'] = w
        if w and f.kind in ('base', 'regional'):
            cf = []
            if w.types and w.types != p['t']:
                cf.append('Wiki says %s; RomHackDex says %s' % (' / '.join(w.types), ' / '.join(p['t'])))
                cf_count['types'] += 1
            wab = [cfru.official(ab) for ab in (x[0] for x in w.abilities)]
            wab = [WIKI_ABILITY_FIX.get(a, a) for a in wab]
            mine = abil + ([hidden] if hidden and hidden not in abil else [])
            if wab and set(wab) != set(mine):
                cf.append('Wiki says abilities %s; RomHackDex says %s' % (' / '.join(wab), ' / '.join(mine)))
                cf_count['abilities'] += 1
            if cf:
                wiki_cf.append('%s: %s' % (p['id'], '; '.join(cf)))
        P.append(p)
        byid[p['id']] = p
    for p in P:
        p['of'] = [x['id'] for x in P if x['dex'] == p['dex'] and x['id'] != p['id']] if p['dex'] else []

    # ---- learnsets vs the wiki (counts only: the wiki's lists are older, e.g. "Petalblizzard" at 31) ----
    lsdiff = collections.Counter()
    for p in P:
        w = p.pop('_w')
        if not w or byid[p['id']].get('g') or p.get('fc'):
            continue
        for k, mine, theirs in (('level-up', {(l, M[i]) for l, i in p['lv'] if i is not None},
                                 {(l, MOVE_NAMES.get(key(cfru.official(m)), m)) for l, m in w.lv}),
                                ('TM', {M[i] for i in p['tm'] if i is not None},
                                 {MOVE_NAMES.get(key(cfru.official(m)), m) for m in w.tm}),
                                ('egg', {M[i] for i in p['eg'] if i is not None},
                                 {MOVE_NAMES.get(key(cfru.official(m)), m) for m in w.egg})):
            if theirs and mine != theirs:
                lsdiff[k] += 1

    # ---- Mega Stones (wiki pages): p.stone, p.sloc ----
    stones, nostone = {}, []
    for st in WIKI.mega_stones():
        names = [x.strip() for x in st.name.split('/')]
        for i, mega in enumerate(st.megas):
            m = re.fullmatch(r'(.+?) \((X|Y)\)', mega)
            target = sid(('Mega %s %s' % m.groups()) if m else ('Primal ' if 'Orb' in st.name else 'Mega ') + mega)
            stones[target] = (names[i] if i < len(names) else names[0], cfru.clean(st.location))
    for p in P:
        if p['g'] == 1:
            if p['id'] in stones:
                p['stone'], p['sloc'] = stones.pop(p['id'])
            else:
                nostone.append(p['id'])
    if stones:
        report('MEGA STONE pages with no Mega placed:', ', '.join(stones))

    # ---- evolutions: the wiki's Evolution Line tables (each with its parent), the mirror's levels over them ----
    edges, wiki_unplaced = collections.OrderedDict(), []

    def place(name):
        return sid(name) or sid(re.sub(r'\s*\([^)]*\)$', '', name.strip()))
    for t, w in WIKI.pokemon().items():
        for parent, child, how in w.evo:
            if parent is None or how is None:
                continue
            a, b = place(parent), place(child)
            if not a or not b or a not in byid or b not in byid:
                wiki_unplaced.append('%s -> %s (%s, page %s)' % (parent, child, how, t))
                continue
            edges.setdefault((a, b), wiki_how(how))
    rhd = {}
    for a, b, how in RD.evolutions():
        fa, fb = FORMS.get(a), FORMS.get(b)
        if not fa or not fb or 'drop' in (fa.kind, fb.kind) or 'mega' in (fa.kind, fb.kind):
            continue
        ia = pid(cfru.merge_into(fa, FORMS, S) or a)
        ib = pid(cfru.merge_into(fb, FORMS, S) or b)
        text = cfru.rhd_evo(how)
        if text and ia != ib and (ia, ib) not in NOT_EVO:
            rhd.setdefault((ia, ib), (how, text))
    lvl_conflict, rhd_only, wiki_only = [], [], []
    for (a, b), how in list(edges.items()):
        if (a, b) not in rhd:
            wiki_only.append('%s -> %s (%s)' % (a, b, how))
            continue
        lab, _ = rhd[(a, b)]
        ml, wl = re.fullmatch(r'Lv\. (\d+)', lab or ''), re.match(r'level (\d+)', how or '')
        if ml and wl and ml.group(1) != wl.group(1):
            lvl_conflict.append('%s -> %s: wiki "%s", RomHackDex %s (RomHackDex taken)' % (a, b, how, lab))
            edges[(a, b)] = 'level %s%s' % (ml.group(1), how[wl.end():])
        elif ml and not wl and 'level' not in (how or '').lower():
            edges[(a, b)] = '%s (level %s)' % (how, ml.group(1))
    children = {b for _, b in edges}
    for (a, b), (lab, text) in rhd.items():
        if (a, b) in EVO_FIX:
            a, text = EVO_FIX[(a, b)]
        if (a, b) in edges or b in children or a not in byid or b not in byid:
            continue              # the wiki places this child (under its real parent where the mirror's chain is flattened)
        edges[(a, b)] = text
        rhd_only.append('%s -> %s (%s: %s)' % (a, b, lab, text))
    for (a, b), how in edges.items():
        byid[a]['et'].append([how, b])
        byid[b]['ef'].append([how, a])

    # ---- abilities ----
    names = sorted(ab_seen, key=str.lower)
    mirror_desc = RD.abilities()
    wiki_desc = {}
    for w in WIKI.pokemon().values():
        for n, d, _ in w.abilities:
            wiki_desc.setdefault(cfru.official(WIKI_ABILITY_FIX.get(n, n)), cfru.clean(d))
    AB, from_wiki, no_desc, ab_orig = [], [], [], []
    for a in names:
        own = a not in calc
        md = mirror_desc.get(a)
        if own or not md:      # Unbound's own (the mirror pairs its short names with another ability's text), or none
            d = wiki_desc.get(a, '')
            if d:
                from_wiki.append(a)
        else:
            d = cfru.clean(md)
        if not d:
            no_desc.append(a)
        AB.append([a, d, 1] if own else [a, d])
        if own:
            ab_orig.append(a)
    ai = {a: i for i, a in enumerate(names)}
    for a in names:
        ABILITY_NAMES[key(a)] = a
    for n in RD.abilities():
        ABILITY_NAMES.setdefault(key(n), cfru.official(n))
    for p in P:
        p['a'] = [ai[a] for a in p.pop('_a')]
        h = p.pop('_h')
        p['ha'] = ai[h] if h else -1

    # ---- type chart: the mirror's (the wiki states no changes), checked against the Gen VI+ chart's key cells ----
    TC = RD.type_chart()
    claims = [('Fairy', 'Fighting', 20), ('Fairy', 'Dragon', 20), ('Fairy', 'Dark', 20), ('Fairy', 'Fire', 5),
              ('Fairy', 'Poison', 5), ('Fairy', 'Steel', 5), ('Ghost', 'Steel', 10), ('Dark', 'Steel', 10),
              ('Dragon', 'Fairy', 0), ('Poison', 'Fairy', 20), ('Steel', 'Fairy', 20), ('Bug', 'Fairy', 5)]
    bad = ['%s->%s %s' % c for c in claims if TC[c[0]][c[1]] != c[2]]

    # ---- tutors: the mirror's per-species lists against the wiki's Move Tutors page ----
    taught = {move(m) or m for t in WIKI.tutors() for m, _ in t.moves}
    listed = {M[i] for p in P for i in p['tu'] if i is not None}

    for p in P:
        p['lv'] = [x for x in p['lv'] if x[1] is not None]
        for k in ('tm', 'tu', 'eg'):
            p[k] = list(dict.fromkeys(x for x in p[k] if x is not None))
    D.update({'M': M, 'MV': MV, 'AB': AB, 'P': P, 'TC': TC})

    kinds = collections.Counter(FORMS[s].kind for s in FORMS)
    report('dex: P %d (%d species, %d regional forms, %d Megas / Primals, %d other forms); M %d; AB %d'
           % (len(P), sum(1 for p in P if FORMS_KIND(p) == 'base'), sum(1 for p in P if FORMS_KIND(p) == 'regional'),
              sum(1 for p in P if p['g'] == 1), sum(1 for p in P if FORMS_KIND(p) == 'form'), len(M), len(AB)))
    report('mirror pages: %d (%s); every one placed: %d in P, %d merged into a species, %d dropped'
           % (len(FORMS), ', '.join('%s %d' % kv for kv in sorted(kinds.items())), len(P), len(merged_forms), len(dropped)))
    report('  merged (cosmetic forms listed under their species) (%d): %s' % (len(merged_forms), '; '.join(merged_forms)))
    report('  dropped (%d): %s' % (len(dropped), '; '.join(sorted(dropped))))
    for x in dexfix:
        report('dex number:', x)
    report('moves: %d in moves.json; %d Max / G-Max and %d Z-move copies left out; %d CFRU spellings merged into one '
           'official name' % (len(raw), skipped['max'], skipped['z'], sum(len(v) - 1 for v in groups.values())))
    report('  merged move entries (%d): %s' % (len(merged), '; '.join(merged)))
    report('moves the calc does not know (MV.x, Unbound original or unmatched) (%d): %s' % (len(originals), ', '.join(originals)))
    if unknown_moves:
        report('MOVES not in M (%d): %s' % (len(unknown_moves), dict(unknown_moves)))
    report('abilities: %d; Unbound originals (AB[2]) %d: %s' % (len(AB), len(ab_orig), ', '.join(ab_orig)))
    report('  descriptions from the wiki (game text; the mirror pairs these names with another ability\'s text) (%d): %s'
           % (len(from_wiki), ', '.join(from_wiki)))
    if no_desc:
        report('ABILITIES without a description:', ', '.join(no_desc))
    report("abilities the mirror shows under another name, set from the game's species table (%d): %s"
           % (len(abfix), '; '.join(abfix)))
    report("wiki vs the dex: %d species differ (types %d, abilities %d; not shown: the game's tables agree with the dex "
           'on every one, notes.md)' % (len(wiki_cf), cf_count['types'], cf_count['abilities']))
    report('  ' + '; '.join(wiki_cf))
    report('  learnsets that differ from the wiki (not shown; the wiki is older): %s' % dict(lsdiff))
    report('evolutions: %d edges (wiki tables, the mirror\'s levels over them); %d level conflicts, %d from the mirror only, '
           '%d wiki-only' % (len(edges), len(lvl_conflict), len(rhd_only), len(wiki_only)))
    for title, rows in (('level conflicts', lvl_conflict), ('mirror only', rhd_only), ('wiki only', wiki_only),
                        ('wiki rows not placed', wiki_unplaced)):
        if rows:
            report('  %s (%d): %s' % (title, len(rows), '; '.join(rows)))
    report('Mega Stones: %d placed from the wiki; Megas with no stone page (%d): %s'
           % (sum(1 for p in P if p.get('stone')), len(nostone), ', '.join(nostone)))
    report('type chart vs the Gen VI+ chart: %s' % ('agrees' if not bad else 'DIFFERS ' + ', '.join(bad)))
    report('tutors: wiki Move Tutors page %d tutors / %d moves; tutor moves in species lists %d; listed but no wiki '
           'tutor teaches them (%d): %s' % (len(WIKI.tutors()), len(taught), len(listed), len(listed - taught),
                                             ', '.join(sorted(listed - taught))))
    if taught - listed:
        report('  taught by a wiki tutor but in no species list (%d): %s' % (len(taught - listed), ', '.join(sorted(taught - listed))))


def FORMS_KIND(p):
    """The cfru kind of a P entry (by its id)."""
    return _KIND.get(p['id']) or 'base'


_KIND = {pid(s): f.kind for s, f in FORMS.items()}

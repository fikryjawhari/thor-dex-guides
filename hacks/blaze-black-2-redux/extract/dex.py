"""M, MV, AB, P, TC for Blaze Black 2 Redux, Complete version: the docs (Pokemon / Move / Type / Evolution Changes)
over the RomHackDex mirror. Docs win; what the mirror says differently is in the report (species) or the move's
"Sources disagree" card (moves). notes.md → Sources and rules has the rules this applies.

    build(D)    writes D['M'], D['MV'], D['AB'], D['P'], D['TC']
"""
import collections
import copy
import re

from common import ABILITIES, MOVES, RD, SPECIES, doc, drayano, report

VERSION = 'Complete'

# Forms the guide lists (the mirror has one page per dex number). Data the docs don't give is the canonical Gen VIII
# value (the docs: stats, types and abilities "updated to match Sword and Shield"); doc fields for the form's label
# apply over it. base = the doc's label for the base form's own fields; fc = a form change of the base (item, move,
# battle), not caught on its own; same = only the name / sprite differs (wild in its own right); lv_add = the doc's
# list for the form adds to the base list (Kyurem's fused forms list only their level 70 moves).
BASE_LABEL = {'deoxys': 'Normal Forme', 'wormadam': 'Plant Cloak', 'rotom': 'Regular Form', 'shaymin': 'Land Forme'}
FORMS = [
    # id, base slug, name, doc label, fc, types, stats, [abilities], hidden
    ('deoxys_attack', 'deoxys', 'Deoxys Attack', 'Attack Forme', 1, None, [50, 180, 20, 180, 20, 150], None, None),
    ('deoxys_defense', 'deoxys', 'Deoxys Defense', 'Defense Forme', 1, None, [50, 70, 160, 70, 160, 90], None, None),
    ('deoxys_speed', 'deoxys', 'Deoxys Speed', 'Speed Forme', 1, None, [50, 95, 90, 95, 90, 180], None, None),
    ('wormadam_sandy', 'wormadam', 'Wormadam Sandy', 'Sandy Cloak', 0, ['Bug', 'Ground'], [60, 79, 105, 59, 85, 36], None, None),
    ('wormadam_trash', 'wormadam', 'Wormadam Trash', 'Trash Cloak', 0, ['Bug', 'Steel'], [60, 69, 95, 69, 95, 36], None, None),
    ('rotom_heat', 'rotom', 'Rotom Heat', 'Heat Form', 1, ['Electric', 'Fire'], [50, 65, 107, 105, 107, 86], None, None),
    ('rotom_wash', 'rotom', 'Rotom Wash', 'Wash Form', 1, ['Electric', 'Water'], [50, 65, 107, 105, 107, 86], None, None),
    ('rotom_frost', 'rotom', 'Rotom Frost', 'Frost Form', 1, ['Electric', 'Ice'], [50, 65, 107, 105, 107, 86], None, None),
    ('rotom_fan', 'rotom', 'Rotom Fan', 'Fan Form', 1, ['Electric', 'Flying'], [50, 65, 107, 105, 107, 86], None, None),
    ('rotom_mow', 'rotom', 'Rotom Mow', 'Mow Form', 1, ['Electric', 'Grass'], [50, 65, 107, 105, 107, 86], None, None),
    ('giratina_origin', 'giratina', 'Giratina Origin', 'Origin Forme', 1, ['Ghost', 'Dragon'], [150, 120, 100, 120, 100, 90], ['Levitate'], None),
    ('shaymin_sky', 'shaymin', 'Shaymin Sky', 'Sky Forme', 1, ['Grass', 'Flying'], [100, 103, 75, 120, 75, 127], ['Serene Grace'], None),
    ('basculin_blue_striped', 'basculin', 'Basculin Blue Striped', 'Blue-Striped Form', 0, None, None, ['Rock Head', 'Adaptability'], 'Mold Breaker'),
    ('darmanitan_zen', 'darmanitan', 'Darmanitan Zen', 'Zen Mode', 1, ['Fire', 'Psychic'], [105, 30, 105, 140, 105, 55], ['Zen Mode'], None),
    ('shellos_east_sea', 'shellos', 'Shellos East Sea', 'East Sea', 0, None, None, None, None),
    ('gastrodon_east_sea', 'gastrodon', 'Gastrodon East Sea', 'East Sea', 0, None, None, None, None),
    ('tornadus_therian', 'tornadus', 'Tornadus Therian', 'Therian Forme', 1, ['Flying'], [79, 100, 80, 110, 90, 121], ['Regenerator'], None),
    ('thundurus_therian', 'thundurus', 'Thundurus Therian', 'Therian Forme', 1, ['Electric', 'Flying'], [79, 105, 70, 145, 80, 101], ['Volt Absorb'], None),
    ('landorus_therian', 'landorus', 'Landorus Therian', 'Therian Forme', 1, ['Ground', 'Flying'], [89, 145, 90, 105, 80, 91], ['Intimidate'], None),
    ('kyurem_black', 'kyurem', 'Kyurem Black', 'Black Kyurem', 1, None, [125, 170, 100, 120, 90, 95], ['Teravolt'], None),
    ('kyurem_white', 'kyurem', 'Kyurem White', 'White Kyurem', 1, None, [125, 120, 90, 170, 100, 95], ['Turboblaze'], None),
    ('meloetta_pirouette', 'meloetta', 'Meloetta Pirouette', 'Pirouette Forme', 1, ['Normal', 'Fighting'], [100, 128, 90, 77, 77, 128], None, None),
]
LV_ADD = {'kyurem_black', 'kyurem_white'}
# Doc names for forms (Evolution prose: "Wormadam Sandy Cloak").
FORM_NAMES = {'wormadamplantcloak': 'wormadam', 'wormadamsandycloak': 'wormadam_sandy', 'wormadamtrashcloak': 'wormadam_trash'}

# The mirror draws these methods only as "Evolution item", "Friendship", "Level up at special location", "Trade",
# "Lv. Special" or "shed"; the docs leave them unchanged, so they are the Gen V games' methods.
GEN5_EVO = {
    ('pikachu', 'raichu'): 'using Thunder Stone', ('nidorina', 'nidoqueen'): 'using Moon Stone',
    ('nidorino', 'nidoking'): 'using Moon Stone', ('clefairy', 'clefable'): 'using Moon Stone',
    ('vulpix', 'ninetales'): 'using Fire Stone', ('jigglypuff', 'wigglytuff'): 'using Moon Stone',
    ('gloom', 'vileplume'): 'using Leaf Stone', ('gloom', 'bellossom'): 'using Sun Stone',
    ('poliwhirl', 'poliwrath'): 'using Water Stone', ('growlithe', 'arcanine'): 'using Fire Stone',
    ('weepinbell', 'victreebel'): 'using Leaf Stone', ('shellder', 'cloyster'): 'using Water Stone',
    ('exeggcute', 'exeggutor'): 'using Leaf Stone', ('staryu', 'starmie'): 'using Water Stone',
    ('eevee', 'vaporeon'): 'using Water Stone', ('eevee', 'jolteon'): 'using Thunder Stone',
    ('eevee', 'flareon'): 'using Fire Stone', ('sunkern', 'sunflora'): 'using Sun Stone',
    ('murkrow', 'honchkrow'): 'using Dusk Stone', ('misdreavus', 'mismagius'): 'using Dusk Stone',
    ('lombre', 'ludicolo'): 'using Water Stone', ('nuzleaf', 'shiftry'): 'using Leaf Stone',
    ('skitty', 'delcatty'): 'using Moon Stone', ('roselia', 'roserade'): 'using Shiny Stone',
    ('togetic', 'togekiss'): 'using Shiny Stone', ('snorunt', 'froslass'): 'using Dawn Stone (female)',
    ('kirlia', 'gallade'): 'using Dawn Stone (male)', ('pansage', 'simisage'): 'using Leaf Stone',
    ('pansear', 'simisear'): 'using Fire Stone', ('panpour', 'simipour'): 'using Water Stone',
    ('munna', 'musharna'): 'using Moon Stone', ('minccino', 'cinccino'): 'using Shiny Stone',
    ('cottonee', 'whimsicott'): 'using Sun Stone', ('petilil', 'lilligant'): 'using Sun Stone',
    ('lampent', 'chandelure'): 'using Dusk Stone', ('eelektrik', 'eelektross'): 'using Thunder Stone',
    ('gligar', 'gliscor'): 'level up holding Razor Fang at night', ('sneasel', 'weavile'): 'level up holding Razor Claw at night',
    ('happiny', 'chansey'): 'level up holding Oval Stone by day',
    ('pichu', 'pikachu'): 'high friendship', ('cleffa', 'clefairy'): 'high friendship',
    ('igglybuff', 'jigglypuff'): 'high friendship', ('golbat', 'crobat'): 'high friendship',
    ('chansey', 'blissey'): 'high friendship', ('togepi', 'togetic'): 'high friendship',
    ('eevee', 'espeon'): 'high friendship by day', ('eevee', 'umbreon'): 'high friendship at night',
    ('azurill', 'marill'): 'high friendship', ('buneary', 'lopunny'): 'high friendship',
    ('munchlax', 'snorlax'): 'high friendship', ('woobat', 'swoobat'): 'high friendship',
    ('swadloon', 'leavanny'): 'high friendship', ('budew', 'roselia'): 'high friendship by day',
    ('chingling', 'chimecho'): 'high friendship at night', ('riolu', 'lucario'): 'high friendship by day',
    ('magneton', 'magnezone'): 'level up in Chargestone Cave', ('nosepass', 'probopass'): 'level up in Chargestone Cave',
    ('eevee', 'leafeon'): 'level up near the Moss Rock (Pinwheel Forest)', ('eevee', 'glaceon'): 'level up near the Ice Rock (Twist Mountain)',
    ('nincada', 'shedinja'): 'level 20, with a free party slot and a Poké Ball',
    ('tyrogue', 'hitmonlee'): 'level 20 (Attack > Defense)', ('tyrogue', 'hitmonchan'): 'level 20 (Attack < Defense)',
    ('tyrogue', 'hitmontop'): 'level 20 (Attack = Defense)', ('mantyke', 'mantine'): 'level up with Remoraid in the party',
    ('wurmple', 'silcoon'): 'level 7 (random)', ('wurmple', 'cascoon'): 'level 7 (random)',
}


def pid(slug):
    return slug.replace('-', '_')


def mirror_how(h):
    """The mirror's method text in the guides' wording, or None when it doesn't say enough (an item, a place...)."""
    h = (h or '').strip()
    m = re.fullmatch(r'Lv\. (\d+)', h)
    if m:
        return 'level ' + m.group(1)
    m = re.fullmatch(r'Lv\. Know (.+)', h)
    if m:
        return 'level up knowing ' + m.group(1)
    return None


GEN5_HIGH_CRIT = ['Aeroblast', 'Air Cutter', 'Attack Order', 'Blaze Kick', 'Crabhammer', 'Cross Chop', 'Cross Poison',
                  'Drill Run', 'Karate Chop', 'Leaf Blade', 'Night Slash', 'Poison Tail', 'Psycho Cut', 'Razor Leaf',
                  'Razor Wind', 'Shadow Claw', 'Sky Attack', 'Slash', 'Spacial Rend', 'Stone Edge']
GEN5_ALWAYS_CRIT = ['Frost Breath', 'Storm Throw']


def build(D):
    S = RD.species()
    docs = {name: doc(name) for name in ('Pokemon Changes', 'Move Changes', 'Type Changes', 'Evolution Changes')}
    for name, d in docs.items():
        report('doc %s v%s' % (name, d.version))
    mc = drayano.move_changes(docs['Move Changes'])

    # ---- moves: every mirror move except the ones the docs replaced (no longer in the game) ----
    mirror_moves = RD.moves()
    replaced = {}
    for old, new, line in mc.replacements:
        o, n = MOVES(old, 'Move Changes:%d' % line), MOVES(new, 'Move Changes:%d' % line)
        replaced[o] = (n, line)
    M = sorted({m['n'] for m in mirror_moves.values()} - set(replaced), key=str.lower)
    MI = {n: i for i, n in enumerate(M)}
    gone = collections.Counter()

    def mi(raw, where):
        name = MOVES(raw, where)
        if name in replaced:
            gone[name] += 1
            name = replaced[name][0]
        return MI.get(name)

    # ---- species ----
    pc = {}
    for sp in drayano.pokemon_changes(docs['Pokemon Changes']):
        name = SPECIES(sp.name, 'Pokemon Changes:%d' % sp.line)
        page = RD.find(name) if name else None
        if not page:
            report('Pokemon Changes species without a mirror page:', sp.name)
            continue
        if page.dex != sp.num:
            report('Pokemon Changes prints %03d for %s (dex %d): placed by name' % (sp.num, sp.name, page.dex))
        pc[page.slug] = sp
    tchg = {}
    for dex, name, old, new, why, line in drayano.type_changes(docs['Type Changes']):
        page = RD.find(SPECIES(name, 'Type Changes:%d' % line))
        tchg[page.slug] = (new, line)

    stat_doc = stat_old = stat_conflict = lv_raw_diff = 0
    stat_other, lv_diff, tm_added, typex, abx = [], [], [], [], []

    def apply_doc(p, sp, label, page, base=True):
        """The doc's fields for this form label over p. A base species takes fields for its label or for every form; a
        form only those for its own label (or "All ..."): the rest it has from its base already."""
        nonlocal stat_doc, stat_old, stat_conflict
        got = []
        if not sp:
            return got
        ok = lambda f: f and (f.form == label or (f.form or '').startswith('All ') or base and f.form is None)
        kw = {'version': VERSION, 'form': label}
        f = sp.pick('Base Stats', **kw)
        if ok(f):
            old, new = f.old_new()
            p['s'] = drayano.parse_stats(new)
            got.append('s')
            stat_doc += 1
            stat_conflict += bool(page and page.stats != p['s'])
            if page and page.stats == drayano.parse_stats(old):
                stat_old += 1
            elif page and page.stats != p['s']:
                stat_other.append('%s doc old %s, mirror %s' % (p['id'], drayano.parse_stats(old), page.stats))
        f = sp.pick('Type', **kw)
        if ok(f):
            p['t'] = [t for t in drayano.parse_slash(f.old_new()[1]) if t]
            got.append('t')
        f = sp.pick('Ability', **kw)
        if ok(f):
            slots = [ABILITIES(a, 'Pokemon Changes:%d' % f.line) if a else None for a in drayano.parse_slash(f.old_new()[1])]
            p['_a'] = list(dict.fromkeys(a for a in slots[:2] if a))
            p['_h'] = slots[2] if len(slots) > 2 else None
            got.append('a')
        f = sp.pick('Level Up', **kw)
        if ok(f):
            rows = sp.level_up(**kw)
            lv = [[l, mi(m, 'Pokemon Changes:%d' % line)] for l, m, marks, line in rows]
            p['_lvdoc'] = lv
            got.append('lv')
        return got

    P, byid = [], {}
    for page in sorted(S.values(), key=lambda s: s.dex):
        p = {'id': pid(page.slug), 'n': page.name, 'dex': page.dex, 't': list(page.types), 's': list(page.stats),
             '_a': list(dict.fromkeys(page.abilities)), '_h': page.hidden,
             'ef': [], 'et': [], 'of': [], 'lv': [], 'tm': [], 'tu': [], 'eg': [], 'w': [], 'g': 0}
        mlv = [[l, mi(m, 'RomHackDex %s' % page.slug)] for l, m in page.lv]
        sp = pc.get(page.slug)
        apply_doc(p, sp, BASE_LABEL.get(page.slug), page)
        if page.slug in tchg and tchg[page.slug][0] != p['t']:
            typex.append('%s: Type Changes %s, Pokemon Changes %s' % (p['id'], '/'.join(tchg[page.slug][0]), '/'.join(p['t'])))
            if not (sp and sp.pick('Type', version=VERSION)):
                p['t'] = tchg[page.slug][0]
        if '_lvdoc' in p:
            raw = sorted((l, drayano.key(m)) for l, m, _, _ in sp.level_up(version=VERSION, form=BASE_LABEL.get(page.slug)))
            lv_raw_diff += raw != sorted((l, drayano.key(m)) for l, m in page.lv)
            if sorted(map(tuple, p['_lvdoc'])) != sorted(map(tuple, mlv)):
                lv_diff.append(p['id'])
            p['lv'] = p.pop('_lvdoc')
        else:
            p['lv'] = mlv
        p['tm'] = [mi(m, 'RomHackDex %s' % page.slug) for _, m in sorted(page.tm, key=lambda x: (x[0][:2] == 'HM', x[0]))]
        for machine, move, line in (sp.tm_compat(version=VERSION) if sp else []):
            i = mi(move, 'Pokemon Changes:%d' % line)
            if i is not None and i not in p['tm']:
                p['tm'].append(i)
                tm_added.append('%s %s %s' % (p['id'], machine, M[i]))
        p['tu'] = [mi(m, 'RomHackDex %s' % page.slug) for m in page.tutor]
        p['eg'] = [mi(m, 'RomHackDex %s' % page.slug) for m in page.egg]
        P.append(p)
        byid[p['id']] = p

    # ---- forms ----
    for fid, base, name, label, fc, types, stats, abil, hidden in FORMS:
        b = byid[pid(base)]
        p = copy.deepcopy(b)
        p.update({'id': fid, 'n': name})
        if fc:
            p['fc'] = 1
        if types:
            p['t'] = list(types)
        if stats:
            p['s'] = list(stats)
        if abil:
            p['_a'], p['_h'] = list(abil), hidden
        sp = pc.get(base)
        got = apply_doc(p, sp, label, None, base=False) if sp and any(f.form == label for f in sp.fields) else []
        if '_lvdoc' in p:
            add = p.pop('_lvdoc')
            p['lv'] = sorted(b['lv'] + add, key=lambda x: x[0]) if fid in LV_ADD else add
        report('form %s: canonical Gen VIII %s; doc fields (%s) %s' % (fid, ', '.join(k for k, v in (('types', types), ('stats', stats), ('abilities', abil)) if v) or 'nothing',
                                                                 label, ', '.join(got) or 'none'))
        at = next(i for i, x in enumerate(P) if x['dex'] == b['dex']) + sum(1 for x in P if x['dex'] == b['dex'])
        P.insert(at, p)
        byid[fid] = p
    for p in P:
        p['of'] = [x['id'] for x in P if x['dex'] == p['dex'] and x['id'] != p['id']]

    # ---- evolutions: the mirror's chains, the docs' changes over them, Gen V methods where the mirror is vague ----
    edges = collections.OrderedDict()
    for a, b, h in RD.evolutions():
        edges.setdefault((pid(a), pid(b)), []).append(['mirror', mirror_how(h), h])
    for f in ('wormadam_sandy', 'wormadam_trash'):     # the mirror draws Burmy -> Wormadam only
        edges[('burmy', f)] = [['mirror', None, None]]

    def sid(name, where):
        k = drayano.key(name)
        if k in FORM_NAMES:
            return FORM_NAMES[k]
        n = SPECIES(name, where)
        page = RD.find(n) if n else None
        return pid(page.slug) if page else None
    evdoc = collections.defaultdict(list)
    for dex, name, sentence, line in drayano.evolution_changes(docs['Evolution Changes']):
        e = drayano.evo_method(sentence)
        a, b = sid(name, 'Evolution Changes:%d' % line), sid(e.into, 'Evolution Changes:%d' % line)
        if not a or not b:
            report('EVOLUTION not placed:', name, sentence)
            continue
        evdoc[(a, b)].append(e)
    for (a, b), es in evdoc.items():
        keep = [x for x in edges.get((a, b), []) if any(e.add for e in es)]
        edges[(a, b)] = keep + [['doc', e.how, None] for e in es]
    # Pokemon Changes' own Evolution prose (Burmy's cloaks, "Now able to evolve" level changes) where Evolution Changes
    # doesn't give the pair
    extra = []
    for slug, sp in pc.items():
        for sentence, line in sp.evolution(version=VERSION):
            e = drayano.evo_method(sentence)
            if not e:
                continue
            b = sid(e.into, 'Pokemon Changes:%d' % line)
            if b and (pid(slug), b) not in evdoc:
                cur = edges.get((pid(slug), b), [])
                if not any(x[1] == e.how for x in cur):
                    edges[(pid(slug), b)] = ([x for x in cur if x[0] == 'mirror' and x[1]] if e.add else []) + [['doc', e.how, None]]
                    extra.append('%s -> %s %s' % (pid(slug), b, e.how))
    filled, vague = [], []
    for (a, b), hs in edges.items():
        for h in hs:
            if not h[1]:
                h[1] = GEN5_EVO.get((a, b))
                (filled if h[1] else vague).append('%s -> %s (%s)' % (a, b, h[2]))
        if a in byid and b in byid:
            for h in hs:
                how = h[1] or (h[2] or 'special').lower()
                byid[a]['et'].append([how, b])
                byid[b]['ef'].append([how, a])

    # ---- abilities ----
    names = sorted({a for p in P for a in p['_a'] + [p['_h']] if a}, key=str.lower)
    desc = RD.abilities()
    AB = [[a, desc.get(a, '')] for a in names]
    ai = {a: i for i, a in enumerate(names)}
    for p in P:
        p['a'] = [ai[a] for a in p.pop('_a')]
        h = p.pop('_h')
        p['ha'] = ai[h] if h and h not in [AB[i][0] for i in p['a']] else -1
    nodesc = [a for a, d in AB if not d]

    # ---- move table ----
    MV, applied, cf_count, doc_fixes = [], 0, 0, []
    blocks = collections.defaultdict(list)
    for bl in mc.blocks:
        name = MOVES(bl.name, 'Move Changes:%d' % bl.line)
        if name:
            blocks[name].append(bl)
        elif bl.section != 'Type Changes':
            report('Move Changes block that names no move:', bl.name, [c.text for c in bl.changes])
    lab = {'Power': 'bp', 'PP': 'pp', 'Accuracy': 'ac', 'Priority': 'pr', 'Type': 't'}
    show = lambda k, v: ('never misses' if v is None else '%s%%' % v) if k == 'ac' else ('-' if v is None else str(v))
    tag = {'!': ' (Redux)', 'L:A': ' (Legends: Arceus)'}
    for name in M:
        m = mirror_moves[drayano.key(name)]
        o = {'t': m['t'], 'c': m['c'], 'bp': m['bp'], 'ac': m['ac'], 'pp': m['pp'], 'pr': m['pr'] or 0,
             'd': m.get('d') or '', 'h': []}
        mirror = dict(o)
        old = [k for k, v in replaced.items() if v[0] == name]
        if old:
            o['h'].append('Replaces %s (Move Replacements).' % ', '.join(old))
            o['dc'] = 1
        for bl in blocks.get(name, []):
            o['dc'] = 1
            applied += 1
            for c in bl.changes:
                field, new = c.field, c.new
                text = re.sub(r'\*+$', '', c.text).replace('->', '→')
                if name == 'Shadow Claw' and field == 'PP':
                    field = 'Power'
                    doc_fixes.append('Shadow Claw: "PP 70 -> 90" read as Power 70 -> 90 (Move Changes:%d)' % c.line)
                    text = 'Power 70 → 90 (the doc prints "PP 70 -> 90")'
                note = text + tag.get(c.mark, '')
                stars = re.search(r'\*+$', c.text)
                if stars and stars.group(0) in mc.footnotes:
                    note += ' ' + mc.footnotes[stars.group(0)]
                o['h'].append(note)
                if field in lab and new is not None:
                    k = lab[field]
                    if k == 'ac':
                        val = None if re.fullmatch(r'(?i)never ?miss', new) else int(re.sub(r'\D', '', new))
                    elif k == 't':
                        val = new
                    else:
                        val = int(new.replace('+', ''))
                    o[k] = val
            if bl.foot and bl.foot in mc.footnotes:
                o['h'].append(mc.footnotes[bl.foot])
        cf = ['Move Changes says %s %s; RomHackDex says %s' % (f, show(k, o[k]), show(k, mirror[k]))
              for f, k in lab.items() if o[k] != mirror[k] and name in blocks]
        if cf:
            o['cf'] = cf
            cf_count += len(cf)
        MV.append(o)

    # ---- crit stages (MV.cr, for the calc): Gen V's high-crit and always-crit moves (Bulbapedia, Critical hit:
    # Generation V), then Move Changes: Cut, Dragon Claw, Octazooka, X-Scissor gain high crit; Crabhammer loses it.
    # Replacement moves keep stage 0: the docs give none of them a crit change.
    crit = dict.fromkeys(GEN5_HIGH_CRIT, 1) | dict.fromkeys(GEN5_ALWAYS_CRIT, 6)
    crit.update({'Cut': 1, 'Dragon Claw': 1, 'Octazooka': 1, 'X-Scissor': 1, 'Crabhammer': 0})
    for name, stage in crit.items():
        if stage and name in M:
            MV[M.index(name)]['cr'] = stage
    report('crit stages: %d moves high-crit, %d always-crit (Gen V list + Move Changes)'
           % (sum(1 for o in MV if o.get('cr') == 1), sum(1 for o in MV if o.get('cr') == 6)))

    # ---- type chart: the mirror's, checked against what the docs say ----
    TC = RD.type_chart()
    claims = [('Fairy', 'Fighting', 20), ('Fairy', 'Dragon', 20), ('Fairy', 'Dark', 20), ('Fairy', 'Fire', 5),
              ('Fairy', 'Poison', 5), ('Fairy', 'Steel', 5), ('Ghost', 'Steel', 10), ('Dark', 'Steel', 10),
              ('Dragon', 'Fairy', 0)]
    bad = ['%s->%s %s' % c for c in claims if TC[c[0]][c[1]] != c[2]]

    for p in P:
        for k in ('lv',):
            p[k] = [x for x in p[k] if x[1] is not None]
        for k in ('tm', 'tu', 'eg'):
            p[k] = list(dict.fromkeys(x for x in p[k] if x is not None))
    D.update({'M': M, 'MV': MV, 'AB': AB, 'P': P, 'TC': TC})

    report('dex: P %d (%d species + %d forms), M %d, AB %d' % (len(P), len(S), len(FORMS), len(M), len(AB)))
    report('Pokemon Changes: %d species blocks; stats from the doc for %d entries, %d differing from the mirror (which '
           'shows the doc\'s Old line for %d)' % (len(pc), stat_doc, stat_conflict, stat_old))
    report('level-up lists from the doc: %d differ from the mirror as printed (doc spellings)' % lv_raw_diff)
    if stat_other:
        report('  stats where the mirror matches neither of the doc\'s lines (%d): %s' % (len(stat_other), '; '.join(stat_other)))
    report('level-up lists from the doc that differ from the mirror after name fixes (%d): %s' % (len(lv_diff), ', '.join(lv_diff)))
    report('TM compatibility the doc adds that the mirror lacks: %d (e.g. %s)' % (len(tm_added), '; '.join(tm_added[:4])))
    report('Type Changes vs Pokemon Changes (%d): %s' % (len(typex), '; '.join(typex)))
    report('Move Changes: %d replacements, %d move blocks applied (%s), %d fields where the mirror disagrees (MV cf)'
           % (len(mc.replacements), applied, ', '.join('%s %d' % kv for kv in collections.Counter(b.section for b in mc.blocks).items()), cf_count))
    if gone:
        report('replaced moves the sources still use, mapped to their replacement:', dict(gone))
    report('evolutions: %d edges; doc-changed %d; from Pokemon Changes prose %d: %s' % (sum(len(v) for v in edges.values()),
           len(evdoc), len(extra), '; '.join(extra)))
    report('  methods the mirror leaves vague, Gen V method filled (%d): %s' % (len(filled), '; '.join(filled)))
    if vague:
        report('EVOLUTION methods still vague (%d): %s' % (len(vague), '; '.join(vague)))
    report('type chart vs the docs\' statements: %s' % ('agrees' if not bad else 'DIFFERS ' + ', '.join(bad)))
    if nodesc:
        report('abilities without a mirror description:', ', '.join(nodesc))
    report('move descriptions: none (the mirror has none for this hack; MV.d is empty)')
    for x in doc_fixes:
        report('doc fix:', x)

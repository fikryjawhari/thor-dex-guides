"""GID (the damage calc's save import tables) from Skeli's Unbound-Cloud (.src/repos/Unbound-Cloud, profile
unbound_2_1), checked against hzla's generated save_constants/unbound_2_1_constants.js. Runs after finalise() so the
M indexes are final. notes.md → Dex → Save ID tables.

    build(D)    writes D['GID'] = {sp, mv, it, gr} (tools/cfru.py save_ids), or leaves it out when the repo is missing
"""
import glob
import json
import os

import cfru
from common import FORMS, H, RD, move, pid, report, sid
from items import GAME_ITEMS

PROFILE = 'unbound_2_1'


# Forms that exist only in battle (they revert after it): a save holding one shows the base species, as Unbound-Cloud
# and hzla do (unit 8a). Shaymin Sky stays (it lasts outside battle until night / frozen).
BATTLE_ONLY = {'zen', 'g-zen', 'pirouette', 'blade', 'school', 'ultra', 'noice', 'complete', 'crowned', 'ash'}


def species_id(define, name):
    """A CFRU species constant -> our P id: its mirror page (a cosmetic form -> its species, a Gigantamax form -> the
    base), else the display name."""
    slug = cfru.define_slug(define, FORMS)
    if slug:
        f = FORMS[slug]
        if f.kind == 'drop':
            return f.base.replace('-', '_') if f.base != slug else None
        if f.kind == 'form' and f.suffix in BATTLE_ONLY:        # a battle-only form in a save is its base
            return pid(f.base + ('-g' if f.suffix.startswith('g-') else ''))
        return pid(cfru.merge_into(f, FORMS, RD.species()) or slug)
    return sid(name) or sid(define[len('SPECIES_'):].replace('_', ' '))


def build(D):
    cloud = os.path.join(H.src, 'repos', 'Unbound-Cloud')
    if not os.path.isdir(cloud):
        report('GID: not built (no .src/repos/Unbound-Cloud; SOURCES.md fetches it)')
        return
    gid, notes = cfru.save_ids(cloud, PROFILE, species_id, lambda n: move(n), D['P'], D['M'])
    gid['it'] = [GAME_ITEMS.get(n, n) if n else n for n in gid['it']]     # the Items page's names (items.py)
    # Species the prune removed (prune.py) are not in P: save_ids maps them to nothing, so an import skips them.
    D['GID'] = gid
    used = {x for x in gid['sp'] if x}
    report('GID (Unbound-Cloud %s): sp %d ids (%d P entries reached, %d not: %s), mv %d ids, it %d ids, gr %d'
           % (PROFILE, sum(1 for x in gid['sp'] if x), len(used), len(D['P']) - len(used),
              ', '.join(sorted({p['id'] for p in D['P']} - used)), sum(1 for x in gid['mv'] if x is not None),
              sum(1 for x in gid['it'] if x), sum(1 for x in gid['gr'] if x is not None)))
    for k, rows in notes.items():
        if rows:
            report('  GID %s unmapped (%d): %s' % (k, len(rows), '; '.join(rows)))
    # cross-check: hzla's constants (generated from the same repo) give the same id -> constant tables
    found = glob.glob(os.path.join(H.src, 'repos', 'hzla', '**', 'unbound_2_1_constants.js'), recursive=True)
    if not found:
        report('  GID cross-check: hzla constants not found')
        return
    s = open(found[0], encoding='utf-8').read()
    body = s[s.index('return {') + 7:]
    C = json.loads(body[:body.rindex('});')].strip().rstrip(';').strip())
    srv = os.path.join(cloud, 'server', 'src', 'data', PROFILE)
    diff = []
    for mine, theirs in (('Species', 'SPECIES_BY_ID'), ('Moves', 'MOVES_BY_ID'), ('Items', 'ITEMS_BY_ID')):
        a = json.load(open(os.path.join(srv, mine + '.json'), encoding='utf-8'))
        b = C[theirs]
        diff += ['%s %s: Unbound-Cloud %s, hzla %s' % (mine, k, a.get(k), b.get(k)) for k in sorted(set(a) | set(b), key=int)
                 if a.get(k) != b.get(k)]
    report('  GID cross-check vs hzla %s: %s' % (os.path.basename(found[0]), 'same ids for every species, move and item'
                                                  if not diff else '%d differ: %s' % (len(diff), '; '.join(diff))))

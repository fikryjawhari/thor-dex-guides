"""The shared start and end of every hack's extract/ (build.py, common.py): paths, the build report, text helpers,
PDF text, the node helper for Showdown data, the finalisers and the data.json writer.

    from extractlib import Hack, report, finalise, write_data      # a hack's common.py builds on this

Layout of every hack's extract/ (run from the repo root: uv run python -I hacks/<hack>/extract/build.py):
    build.py     the one entry: raw sources in .src/ -> data.json + report.txt (flags below)
    common.py    this hack's paths and the helpers its modules share
    dex.py       M, MV, AB, P, TC          locs.py   LOC, AR, P.w         trainers.py  TR
    items.py     IT                        walk.py   WK                   prune.py     species kept in P
    check.py     checks on a built data.json (optional baseline to compare)
    + helper modules that only one hack needs (format readers, source parsers), named for what they read.
build.py ends with finalise(): Items standard (tools/itemstd.py), the hack's prune, stable trainer keys
(tools/trainer_keys.py; extract/trainer_keys.json is committed), shared split names.

Damage calc: a hack's battle mechanics are hack.json -> cfg.calc (.agents/references/calc-mechanics.md), not data.json.
When its save family has a reader, the extract also writes data.json -> GID {sp, mv, ab, it}: game id -> our species
id / M index / AB index / item name (.agents/references/calc-save-reader.md).
"""
import datetime
import json
import os
import re
import subprocess
import sys
import unicodedata

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import datajson  # noqa: E402
import itemstd  # noqa: E402
import pickup_keys
import schema  # noqa: E402
import moveprops  # noqa: E402
import item_text  # noqa: E402
import trainer_fields  # noqa: E402
import trainer_keys  # noqa: E402
from splits import split_name  # noqa: E402,F401  (re-exported for the hacks' modules)

# UTF-8 output however the build is run (python -I ignores PYTHONUTF8; a redirected cp1252 stdout crashed on '♂').
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, 'reconfigure'):
        _stream.reconfigure(encoding='utf-8', errors='replace')

REPORT = []     # the build report: every conflict and guess; build.py writes it to extract/report.txt


def report(*a):
    REPORT.append(' '.join(str(x) for x in a))


def filter_species_links(species, kept_ids):
    """Remove links to pruned species in place, preserving species and edge order."""
    for entry in species:
        for field in ('et', 'ef'):
            entry[field] = [edge for edge in entry[field] if edge[1] in kept_ids]
        entry['of'] = [target for target in entry['of'] if target in kept_ids]


class Hack:
    """Paths of one hack (hacks/<name>/) and loaders for its raw sources."""

    def __init__(self, name):
        self.name = name
        self.dir = os.path.join(ROOT, 'hacks', name)
        self.src = os.path.join(self.dir, '.src')                # raw docs, git-ignored (SOURCES.md fetches them)
        self.txt = os.path.join(self.src, 'txt')                 # pdftotext -layout copies of the PDFs
        self.bulba = os.path.join(self.src, 'bulbapedia')
        self.cache = os.path.join(self.src, 'cache')             # files derived from the sources (node output...)
        self.extract = os.path.join(self.dir, 'extract')

    def load(self, name):
        return json.load(open(os.path.join(self.src, name), encoding='utf-8'))

    def text(self, name):
        return open(os.path.join(self.txt, name + '.txt'), encoding='utf-8').read()

    def pdf_text(self):
        """pdftotext -layout of every PDF in .src/ into .src/txt/ (refreshed when the PDF is newer)."""
        os.makedirs(self.txt, exist_ok=True)
        for f in sorted(os.listdir(self.src)):
            if f.endswith('.pdf'):
                out = os.path.join(self.txt, f[:-4] + '.txt')
                if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(os.path.join(self.src, f)):
                    subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', os.path.join(self.src, f), out], check=True)

    def showdown(self, folder):
        """tools/showdown.js on a pokemon-showdown dist/data folder (relative to .src/), cached in .src/cache/."""
        os.makedirs(self.cache, exist_ok=True)
        out = os.path.join(self.cache, 'showdown.json')
        subprocess.run(['node', os.path.join(ROOT, 'tools', 'showdown.js'), os.path.join(self.src, folder), out],
                       check=True, stdout=subprocess.DEVNULL)
        return json.load(open(out, encoding='utf-8'))


    def calc_backup(self, path):
        """tools/calcbackup.js on a calc backup file (relative to .src/): {backup_data, backup_moves}, cached in .src/cache/."""
        os.makedirs(self.cache, exist_ok=True)
        out = os.path.join(self.cache, 'calc.json')
        subprocess.run(['node', os.path.join(ROOT, 'tools', 'calcbackup.js'), os.path.join(self.src, path), out], check=True)
        return json.load(open(out, encoding='utf-8'))


def workbook(path, ints=False):
    """openpyxl workbook (values, not formulas). ints=True turns whole-number floats into ints, as older exports had them."""
    import openpyxl
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        wb = openpyxl.load_workbook(path, data_only=True)
    if ints:
        for ws in wb:
            for row in ws.iter_rows():
                for c in row:
                    if isinstance(c.value, float) and c.value.is_integer():
                        c.value = int(c.value)
    return wb


def fix(s):
    """Game text: the extract decodes é as U+FFFD, and descriptions keep the game's line breaks."""
    return re.sub(r'\s*\n\s*', ' ', (s or '').replace('�', 'é')).strip()


def norm(s):
    s = unicodedata.normalize('NFKD', str(s).replace('♀', 'f').replace('♂', 'm')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', s.lower())


def slug(s):
    s = unicodedata.normalize('NFKD', s.replace('♀', '-f').replace('♂', '-m')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


# ---- finalisers --------------------------------------------------------------------------------------------------------
def split_names(D):
    """Every walkthrough split and trainer box with a level cap is named 'Name Split [Cap N]' (tools/splits.py)."""
    for split in D['WK']['splits']:
        split['n'] = split_name(split['n'])
    for group in D['TR']['g']:
        if re.search(r'\[(?:Level )?Cap \d+\]$', group['n']):
            group['n'] = split_name(group['n'])
    if D['TR'].get('caps'):
        D['TR']['caps'] = [[split_name(row[0]) if row[0].startswith('Pre-') else row[0], *row[1:]] for row in D['TR']['caps']]


def trainers_follow_walk(D):
    """The Trainers page lists each box's trainers in walkthrough order (a trainer at its last walkthrough visit; one
    the walkthrough doesn't place stays after the trainer before it). A place whose trainers the walkthrough meets apart
    is listed at each (its header repeats); two places with the same header that end up side by side become one. Boxes
    already in order are left as they are."""
    pos, n = {}, 0
    for split in D['WK']['splits']:
        for stop in split['st']:
            for k in stop.get('tr', []):
                pos[k] = n
                n += 1
    moved = []
    for group in D['TR']['g']:
        rows, last = [], -1
        for si, section in enumerate(group['sec']):
            for trainer in section['tr']:
                last = pos.get(trainer['k'], last)
                rows.append((last, len(rows), si, trainer))
        if not rows:
            continue
        rows.sort(key=lambda r: r[:2])
        if [r[1] for r in rows] == list(range(len(rows))):
            continue
        out = []
        same = lambda a, b: {k: v for k, v in a.items() if k != 'tr'} == {k: v for k, v in b.items() if k != 'tr'}
        for _, _, si, trainer in rows:
            if not out or out[-1][0] != si and not same(out[-1][1], group['sec'][si]):
                out.append((si, dict(group['sec'][si], tr=[])))
            out[-1][1]['tr'].append(trainer)
        empty = [s for s in group['sec'] if not s['tr']]
        group['sec'] = [s for _, s in out] + empty
        moved.append(group['n'])
    if moved:
        report('trainers put in walkthrough order:', ', '.join(moved))


def numbered_gauntlets(section, name_numbers=False):
    """Yield source-tagged #1..#n runs in one section, separately for each starter/player variant."""
    variants = dict.fromkeys((trainer.get('st', ''), trainer.get('pl', '')) for trainer in section['tr'])
    for starter, player in variants:
        chain = []
        for trainer in section['tr']:
            if (trainer.get('st', ''), trainer.get('pl', '')) != (starter, player):
                continue
            match = next((re.fullmatch(r'Back to Back #(\d+)', tag) for tag in trainer['tags']
                          if re.fullmatch(r'Back to Back #(\d+)', tag)), None)
            if not match and name_numbers and 'Back to Back' in trainer['tags']:
                match = re.search(r'#(\d+)$', trainer['n'])
                assert match, ('unnumbered gauntlet member', trainer['n'])
            number = int(match[1]) if match else None
            if number in (None, 1):
                if len(chain) >= 2:
                    yield chain
                chain = []
            if number is not None:
                assert number == len(chain) + 1, ('gauntlet numbering', trainer['n'], number)
                chain.append(trainer)
        if len(chain) >= 2:
            yield chain


def gauntlets(trainers, rules):
    """Set stable-key gc lists from rules(group, section), which yields chains of trainer objects.

    Run after trainer_keys.stabilise and trainers_follow_walk. No rule means explicitly no chains.
    Reapplying replaces old gc fields, including ones whose source rule no longer selects a chain.
    """
    members = {id(trainer) for group in trainers['g'] for section in group['sec'] for trainer in section['tr']}
    for group in trainers['g']:
        for section in group['sec']:
            for trainer in section['tr']:
                trainer.pop('gc', None)
    if rules is None:
        return
    for group in trainers['g']:
        for section in group['sec']:
            for chain in rules(group, section):
                if len(chain) < 2:
                    continue
                assert all(id(trainer) in members for trainer in chain), 'gauntlet member outside TR'
                keys = [trainer['k'] for trainer in chain]
                assert all(isinstance(key, str) and key for key in keys), 'gauntlet needs stable trainer keys'
                assert len(keys) == len(set(keys)), ('duplicate gauntlet member', keys)
                for trainer in chain:
                    assert 'gc' not in trainer, ('overlapping gauntlets', trainer['k'])
                    trainer['gc'] = list(keys)


def merge_cap_splits(D, keep, rename=None):
    """A guide that caps only some fights: every split with a level cap that keep(name) refuses joins the next one it
    accepts, on the walkthrough and the Trainers page, in the same order. name is the split's name without ' Split
    [Cap N]'; rename maps a kept name to the one shown. The joined split takes the kept split's cap, a place's cap line
    counts the battles to it, and a stop keeps its key (schema.py would give it its position here, so it gets it first:
    dex.js migrateWalkState moves saved state). Two stops or places side by side with one name become one, the first's
    key staying (only stops with no checklist steps: a tick's key is its stop's). Splits with no cap (Post-game) stay.
    Runs after the trainer keys and gauntlets, which read the names and places as the sources give them. Idempotent."""
    base = lambda name: re.sub(r' Split \[Cap \d+\]$', '', name)
    splits, groups = D['WK']['splits'], D['TR']['g']
    assert [s['n'] for s in splits] == [g['n'] for g in groups], 'walkthrough splits and trainer boxes differ'
    for si, split in enumerate(splits):
        for ti, stop in enumerate(split['st']):
            stop.setdefault('k', f'{si}.{ti}')
    rows = dict(zip((g['n'] for g in groups if g.get('cap')), D['TR'].get('caps', [])))
    out_splits, out_groups, waiting, caps = [], [], [], []
    for split, group in zip(splits, groups):
        capped = bool(group.get('cap'))
        if capped and not keep(base(group['n'])):
            waiting.append((split, group))
            continue
        if not capped:
            assert not waiting, ('capped splits with no kept split after them', [g['n'] for _, g in waiting])
            out_splits.append(split)
            out_groups.append(group)
            continue
        name = base(group['n'])
        cap, shown = group['cap'], (rename or {}).get(name, name)
        run = waiting + [(split, group)]
        waiting = []
        caps.append([shown if shown != name else rows[group['n']][0], cap])
        boss = next((s['cap'] for s in group['sec'] if isinstance(s.get('cap'), list)), None)
        for index, (_, old) in enumerate(run):
            later = sum(next((s['cap'][3] for s in g['sec'] if isinstance(s.get('cap'), list)), 0) for _, g in run[index + 1:])
            for section in old['sec']:
                if isinstance(section.get('cap'), list):
                    section['cap'] = [boss[0], boss[1], boss[2], section['cap'][3] + later]
                for trainer in section['tr']:
                    if trainer.get('cap') == old['cap']:
                        trainer['cap'] = cap
        merged_split = dict(split, n=f'{shown} Split [Cap {cap}]', st=[s for sp, _ in run for s in sp['st']])
        notes = [sp['note'] for sp, _ in run if sp.get('note')]
        if notes:
            merged_split['note'] = ' '.join(notes)
        out_splits.append(merged_split)
        out_groups.append(dict(group, n=merged_split['n'], sec=[s for _, g in run for s in g['sec']],
                               **({'tab': shown if group['tab'] == name else merged_split['n']} if group.get('tab') else {})))
    assert not waiting, ('capped splits with no kept split after them', [g['n'] for _, g in waiting])
    for split in out_splits:
        stops = []
        for stop in split['st']:
            if stops and stops[-1]['n'] == stop['n'] and not stop.get('s'):
                last = stops[-1]
                for field in ('a', 'it', 'tr'):
                    last[field] = last.get(field, []) + [x for x in stop.get(field, []) if field != 'a' or x not in last.get('a', [])]
                if not stop.get('x'):
                    last.pop('x', None)
                if stop.get('note'):
                    last['note'] = (last.get('note', '') + ' ' + stop['note']).strip()
                assert not stop.get('e'), ('a return-visit stop would be merged', stop['n'])
            else:
                stops.append(stop)
        split['st'] = stops
    for group in out_groups:
        sections = []
        for section in group['sec']:
            if sections and sections[-1]['h'] == section['h']:
                sections[-1]['tr'] += section['tr']
            else:
                sections.append(section)
        group['sec'] = sections
    D['WK']['splits'], D['TR']['g'] = out_splits, out_groups
    D['TR']['caps'] = caps


def finalise(D, hack, prune=None, gauntlet_rules=None, regroup=None):
    """The end of every build: Items standard (tools/itemstd.py), stable pickup keys (tools/pickup_keys.py),
    the hack's species prune, stable trainer keys
    (tools/trainer_keys.py: extract/trainer_keys.json), Trainers page in walkthrough order, shared split names, the data
    move properties/interactions (tools/moveprops.py), schema (tools/schema.py: dead fields dropped, stop keys,
    key order). Optional gauntlet_rules(group, section) runs after key assignment and walkthrough ordering;
    omitted rules preserve existing gc when re-finishing built data. Optional regroup(D) changes the splits after that
    (merge_cap_splits). Idempotent."""
    itemstd.standardise(D, itemstd.RULES.get(hack, {}), report)
    pickup_keys.stabilise(D, os.path.join(ROOT, 'hacks', hack, 'extract', 'pickup_keys.json'), report,
                          itemstd.RULES.get(hack, {}).get('once', pickup_keys.ONCE))
    if prune:
        prune(D)
    trainer_keys.stabilise(D, os.path.join(ROOT, 'hacks', hack, 'extract', 'trainer_keys.json'), report)
    trainers_follow_walk(D)
    split_names(D)
    trainer_fields.annotate(D)
    if gauntlet_rules is not None:
        gauntlets(D['TR'], gauntlet_rules)
    if regroup is not None:
        regroup(D)
    moveprops.apply(D, hack, report)
    item_text.apply(D, hack, report)
    schema.standardise(D)


def write_data(D, H, report_file=True):
    """Stamp built, order the keys, write data.json and extract/report.txt (unless report_file is False: a re-finish of
    a published data.json has no raw-source report to write), print the report's headlines."""
    D['built'] = datetime.date.today().isoformat()
    D = schema.order(D, 'top')
    datajson.write(os.path.join(H.dir, 'data.json'), D)
    if report_file:
        open(os.path.join(H.extract, 'report.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(REPORT) + '\n')
    print('\n'.join(r for r in REPORT if not r.startswith('  ')))

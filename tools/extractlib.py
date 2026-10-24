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
build.py ends with finalise(): Items standard (tools/itemstd.py), the hack's prune, shared split names.
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
import schema  # noqa: E402
from splits import split_name  # noqa: E402,F401  (re-exported for the hacks' modules)

sys.stdout.reconfigure(encoding='utf-8')

REPORT = []     # the build report: every conflict and guess; build.py writes it to extract/report.txt


def report(*a):
    REPORT.append(' '.join(str(x) for x in a))


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


def finalise(D, hack, prune=None):
    """The end of every build: Items standard (tools/itemstd.py), the hack's species prune, Trainers page in walkthrough
    order, shared split names, the data schema (tools/schema.py: dead fields dropped, stop keys, key order). Idempotent."""
    itemstd.standardise(D, itemstd.RULES.get(hack, {}), report)
    if prune:
        prune(D)
    trainers_follow_walk(D)
    split_names(D)
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

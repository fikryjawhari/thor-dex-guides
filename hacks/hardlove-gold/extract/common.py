"""Shared paths and helpers for the Hardlove Gold extract (run from the repo root; see build.py).

X is the build's working state: the steps in dex.py, locs.py, trainers.py, items.py and walk.py hand each other what the
next one needs through it (the lookups and tables the old single-script build kept as globals).
"""
import collections, datetime, json, os, re, sys, types, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', '..', 'tools'))
from extractlib import Hack, REPORT, report, split_name  # noqa: E402,F401
import dexsite, enccheck, hgsource, xlsx  # noqa: E402,F401  (this hack's readers: site pages, game source, xlsx)

H = Hack('hardlove-gold')
HACK, SRC = H.dir, H.src
X = types.SimpleNamespace()


def key(s):
    s = unicodedata.normalize('NFD', str(s).lower())
    s = ''.join(c for c in s if not unicodedata.combining(c)).replace('♀', 'f').replace('♂', 'm')
    return re.sub(r'[^a-z0-9]', '', s)


def lev(a, b):
    if abs(len(a) - len(b)) > 3: return 9
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        p = d[0]; d[0] = i
        for j in range(1, len(b) + 1):
            t = d[j]; d[j] = min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] != b[j - 1])); p = t
    return d[len(b)]


def S(v): return '' if v is None else str(v).strip()


fid = lambda f: f[:-5]                                   # dex page file name -> id
note1 = lambda t: re.sub(r'\s+', ' ', t).strip()          # cell note on one line

# inputs derived from the sources
SD = H.showdown('repos/showdown')                         # Showdown: moves, move text, dex, ability text
CALC = H.calc_backup('repos/hardlove.js')['backup_data']  # the damage calc's species table (types fallback)
_previous = os.path.join(HACK, 'data.json')               # the published build: types of species the sources lack
OLDP = {p['id']: p for p in json.load(open(_previous, encoding='utf-8'))['P']} if os.path.exists(_previous) else {}

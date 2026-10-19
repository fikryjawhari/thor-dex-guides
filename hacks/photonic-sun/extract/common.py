"""Shared paths and helpers for the Photonic Sun extract (run from the repo root; see build.py)."""
import json, os, re, sys, unicodedata

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
HACK = os.path.join(ROOT, 'hacks', 'photonic-sun')
SRC = os.path.join(HACK, '.src')
TXT = os.path.join(SRC, 'txt')  # pdftotext -layout copies of the PDFs (build.py makes them)
BULBA = os.path.join(SRC, 'bulbapedia')
sys.stdout.reconfigure(encoding='utf-8')

REPORT = []


def report(*a):
    REPORT.append(' '.join(str(x) for x in a))


def load(name):
    return json.load(open(os.path.join(SRC, name), encoding='utf-8'))


def fix(s):
    """Game text: the extract decodes é as U+FFFD, and descriptions keep the game's line breaks."""
    return re.sub(r'\s*\n\s*', ' ', (s or '').replace('�', 'é')).strip()


def norm(s):
    s = unicodedata.normalize('NFKD', str(s).replace('♀', 'f').replace('♂', 'm')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', s.lower())


def slug(s):
    s = unicodedata.normalize('NFKD', s.replace('♀', '-f').replace('♂', '-m')).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def text(name):
    return open(os.path.join(TXT, name + '.txt'), encoding='utf-8').read()

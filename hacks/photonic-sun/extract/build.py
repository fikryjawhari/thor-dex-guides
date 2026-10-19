"""Build hacks/photonic-sun/data.json from hacks/photonic-sun/.src (SOURCES.md says how to fetch it).

Usage (repo root): uv run python -I hacks/photonic-sun/extract/build.py
Stages: dex.py (M, MV, AB, P, TC), locs.py (LOC, AR, P.w), trainers.py (TR), items.py (IT), walk.py (WK). The report
of every conflict and guess goes to hacks/photonic-sun/extract/report.txt.
"""
import datetime, json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import HACK, SRC, TXT, REPORT  # noqa: E402
import dex, locs, trainers, items, walk  # noqa: E402

LINES = ('M', 'MV', 'AB', 'P', 'LOC', 'AR')


def pdf_text():
    os.makedirs(TXT, exist_ok=True)
    for f in sorted(os.listdir(SRC)):
        if f.endswith('.pdf'):
            out = os.path.join(TXT, f[:-4] + '.txt')
            if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(os.path.join(SRC, f)):
                subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', os.path.join(SRC, f), out], check=True)


def write(D, path):
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':'))
    parts = [j(k) + ':[\n' + ',\n'.join(j(x) for x in v) + '\n]' if k in LINES else j(k) + ':' + j(v)
             for k, v in D.items() if not k.startswith('_')]
    open(path, 'w', encoding='utf-8', newline='\n').write('{\n' + ',\n'.join(parts) + '\n}\n')


def main():
    pdf_text()
    D = {}
    dex.build(D)
    locs.build(D)
    trainers.build(D)
    items.build(D)
    walk.build(D)
    D['built'] = datetime.date.today().isoformat()
    D['src'] = 'Photonic Sun 2.38 Rebalanced: game data (romfs + code.ips over Ultra Sun v1.2), Buffel Saft\'s docs, Bulbapedia (trainer places, story order), Serebii (item locations)'
    order = ['M', 'MV', 'AB', 'P', 'LOC', 'AR', 'IT', 'WK', 'TR', 'TC', 'built', 'src']
    D = {k: D[k] for k in order if k in D} | {k: v for k, v in D.items() if k not in order}
    write(D, os.path.join(HACK, 'data.json'))
    open(os.path.join(HACK, 'extract', 'report.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(REPORT) + '\n')
    print('\n'.join(r for r in REPORT if not r.startswith('  ')))


if __name__ == '__main__':
    main()

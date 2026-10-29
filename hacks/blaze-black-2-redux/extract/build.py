"""Build hacks/blaze-black-2-redux/data.json from hacks/blaze-black-2-redux/.src (SOURCES.md says how to fetch it).

Usage (repo root): python -I hacks/blaze-black-2-redux/extract/build.py
Modules: dex.py (M, MV, AB, P, TC), locs.py (LOC, AR, P.w), trainers.py (TR), items.py (IT), walk.py (WK). A module
whose unit isn't written yet raises NotImplementedError: its part stays empty (said in the report), so the dex can be
built and checked on its own. Then the shared finalisers (tools/extractlib.py finalise) and the name-fix record (every
doc name tools/drayano.py's Names fixed or couldn't place). The report goes to extract/report.txt.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ABILITIES, MOVES, SPECIES, H, report  # noqa: E402
import extractlib  # noqa: E402
import dex  # noqa: E402
import locs  # noqa: E402
import trainers  # noqa: E402
import items  # noqa: E402
import walk  # noqa: E402

EMPTY = {'LOC': [], 'AR': [], 'IT': [], 'WK': {'splits': [], 'np': []}, 'TR': {'g': [], 'caps': []}}


def main():
    data = {}
    for module in (dex, locs, trainers, items, walk):
        try:
            module.build(data)
        except NotImplementedError as error:
            report('not built yet:', module.__name__, '(%s)' % error)
    for k, v in EMPTY.items():
        data.setdefault(k, v)
    names = [n for fixer in (SPECIES, MOVES, ABILITIES) for n in fixer.lines()]
    report('doc name fixes: %d (%s)' % (sum(f.count() for f in (SPECIES, MOVES, ABILITIES)),
           ', '.join('%s %d' % (f.kind, f.count()) for f in (SPECIES, MOVES, ABILITIES))))
    for line in names:
        report(line)
    keys = Path(H.extract) / 'trainer_keys.json'
    seeded = keys.exists()
    extractlib.finalise(data, H.name)
    if not seeded and not any(s['tr'] for g in data['TR']['g'] for s in g['sec']):
        keys.unlink(missing_ok=True)     # the trainers unit's first build seeds it from real trainers
        extractlib.REPORT[:] = [r for r in extractlib.REPORT if not r.startswith('trainer keys: new table')]
        report('trainer keys: no trainers yet, no table written')
    extractlib.write_data(data, H)


if __name__ == '__main__':
    main()

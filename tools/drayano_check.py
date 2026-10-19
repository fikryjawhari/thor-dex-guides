"""Compare Drayano's "Pokemon Changes" doc with a RomHackDex mirror: base stats, and level-up lists.
Usage: python -I drayano_check.py <PokemonChanges.txt> <romhackdex/pokedex dir>
For each species the doc changes, compares the doc's new stats (the "Complete" line where a doc has versions)
and its full level-up list with the RomHackDex page. Prints mismatches and totals."""
import html, os, re, sys

doc = open(sys.argv[1], encoding="utf-8", errors="replace").read()
pdir = sys.argv[2]


def page_text(name):
    # RomHackDex slugs drop punctuation: nidoranf, mrmime, hooh, porygonz (spaces in other names become hyphens).
    slug = re.sub(r"[^a-z0-9 ]+", "", name.lower().replace("♀", "f").replace("♂", "m")).strip().replace(" ", "-")
    p = os.path.join(pdir, slug, "index.html")
    if not os.path.exists(p):
        return None
    raw = open(p, encoding="utf-8").read()
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))), raw


stat_bad = lv_bad = n = missing = 0
for num, name, body in re.findall(r"^(\d{3}) - ([^\n]+)\n=+\n(.*?)(?=^\d{3} - |\Z)", doc, re.S | re.M):
    name = name.strip()
    page = page_text(name)
    if page is None:
        missing += 1
        print("? no RomHackDex page for", num, name)
        continue
    s, raw = page
    n += 1
    m = re.search(r"Base Stats[^\n]*\n(?:Old[^\n]*\n)?New\s+(\d+) HP / (\d+) Atk / (\d+) Def / (\d+) SAtk / (\d+) SDef / (\d+) Spd", body)
    if m:
        want = list(map(int, m.groups()))
        g = re.search(r"Base Stats HP (\d+) Atk (\d+) Def (\d+) SpA (\d+) SpD (\d+) Spe (\d+)", s)
        got = list(map(int, g.groups())) if g else None
        if got != want:
            stat_bad += 1
            print(f"STATS {num} {name}: doc {want} romhackdex {got}")
    lv = re.search(r"Level Up:\n(.*?)(?:\n\n|\Z)", body, re.S)
    if lv:
        want = [(int(a), re.sub(r"\s*(\(!+\)|\[\*\])", "", b).strip())
                for a, b in re.findall(r"^(\d+) - (.+)$", lv.group(1), re.M)]
        # The page's level-up table: rows of <td>level</td><td><a ...>Move</a></td> up to the next <h3>.
        sec = raw.split(">Level Up</h3>", 1)[-1].split("<h3", 1)[0] if ">Level Up</h3>" in raw else ""
        got = [(int(a), html.unescape(b).strip()) for a, b in re.findall(
            r'learnset-row"[^>]*>\s*<td[^>]*>(\d+)</td>\s*<td[^>]*><a[^>]*>([^<]+)</a>', sec)]
        norm = lambda lst: sorted((lv, re.sub(r"[^a-z]", "", mv.lower())) for lv, mv in lst)
        if norm(want) != norm(got):
            lv_bad += 1
            ws, gs = set(want), set(got)
            print(f"LEVEL {num} {name}: doc-only {sorted(ws - gs)[:5]} romhackdex-only {sorted(gs - ws)[:5]}")
print(f"\n{n} changed species compared, {missing} without a page; {stat_bad} stat and {lv_bad} level-up differences")

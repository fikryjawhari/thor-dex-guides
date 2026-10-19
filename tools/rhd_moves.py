"""Every move of a RomHackDex hack with its priority and description, which the moves index lacks.
Usage: python -I rhd_moves.py <moves/index.html> <hack-slug> <out.json>
Reads the index (name, type, category, power, accuracy, PP), fetches each move's own page and keeps only the
numbers and the description: the pages themselves (~350 KB each, mostly the learner list) are not saved."""
import html, json, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

index, slug, out = sys.argv[1:4]


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def fetch(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity"})
            return urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
        except Exception as e:
            err = e
            time.sleep(2 + 2 * attempt)
    print("FAIL", url, err, flush=True)
    return None


def num(s):
    return int(s) if re.fullmatch(r"-?\d+", s) else None


moves = []
page = open(index, encoding="utf-8").read()
for row in re.findall(r'<tr[^>]*move-row[^>]*>.*?</tr>', page, re.S):
    cells = [clean(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
    moves.append({
        "slug": re.search(r'href="/[^/]+/moves/([^/]+)/"', row).group(1),
        "n": cells[0],
        "t": re.search(r'data-type="([^"]*)"', row).group(1),
        "c": re.search(r'data-cat="([^"]*)"', row).group(1),
        "bp": num(cells[3]), "ac": num(cells[4]), "pp": num(cells[5]),
    })


def detail(m):
    p = fetch(f"https://romhackdex.net/{slug}/moves/{m['slug']}/")
    if p is None:
        return m
    stats = dict((lab, val) for val, lab in re.findall(
        r'stat-num">([^<]*)</div>\s*<div class="text-sm text-muted mt-1">([^<]+)</div>', p))
    m["pr"] = num(stats.get("Priority", "").strip())
    d = re.search(r'<p class="mt-4 text-base[^"]*">(.*?)</p>', p, re.S)
    m["d"] = clean(d.group(1)) if d else ""
    return m


with ThreadPoolExecutor(6) as pool:
    moves = list(pool.map(detail, moves))
missing = [m["n"] for m in moves if "pr" not in m]
with open(out, "w", encoding="utf-8") as f:
    f.write("[\n" + ",\n".join(json.dumps(m, ensure_ascii=False) for m in moves) + "\n]\n")
print(len(moves), "moves,", len(missing), "failed:", missing[:20])

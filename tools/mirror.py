"""Mirror a static site's HTML pages (same-origin, under a start prefix) to a folder.
Usage: python -I mirror.py <start-url> <out-dir> [max-pages] [skip-substring ...]"""
import os, re, sys, urllib.parse
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_http import fetch_bytes

start, out = sys.argv[1], sys.argv[2]
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 5000
skips = sys.argv[4:]
prefix = start.rsplit("/", 1)[0] + "/"


def fetch(url):
    return fetch_bytes(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30, attempts=3,
                       delay=lambda attempt: 1 + attempt)


def save(url, data):
    rel = url[len(prefix):].split("#")[0].split("?")[0]
    if rel == "" or rel.endswith("/"):
        rel += "index.html"
    path = os.path.join(out, *rel.split("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)


seen, frontier = {start}, [start]
while frontier and len(seen) <= limit:
    with ThreadPoolExecutor(8) as pool:
        pages = list(zip(frontier, pool.map(fetch, frontier)))
    frontier = []
    for url, data in pages:
        if data is None:
            continue
        save(url, data)
        if not url.endswith((".html", "/")):
            continue
        for href in re.findall(r"""(?:href|src)=['"]([^'"#]+)""", data.decode("utf-8", "replace")):
            nxt = urllib.parse.urljoin(url, href)
            nxt = nxt.split("#")[0]
            if nxt.startswith(prefix) and "?" not in nxt and nxt not in seen and not any(s in nxt for s in skips):
                seen.add(nxt)
                frontier.append(nxt)
print("saved", len(seen), "urls", flush=True)

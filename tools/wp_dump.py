"""Dump a WordPress site's content through its REST API into one JSON file.
Usage: python -I wp_dump.py <site-url> <out.json> [post-type-rest-base ...]
Default types: pages, posts. Each entry keeps id, type, link, title, categories
(as names), modified date and the rendered HTML content."""
import html, json, sys, urllib.request

site, out = sys.argv[1].rstrip("/"), sys.argv[2]
types = sys.argv[3:] or ["pages", "posts"]


def get(path):
    req = urllib.request.Request(site + "/wp-json/wp/v2/" + path, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, timeout=120)
    return json.load(resp), int(resp.headers.get("X-WP-TotalPages") or 1)


cats, page = {}, 1
while True:
    batch, total = get(f"categories?per_page=100&page={page}")
    cats.update({c["id"]: html.unescape(c["name"]) for c in batch})
    if page >= total:
        break
    page += 1

entries = []
for t in types:
    page = 1
    while True:
        batch, total = get(f"{t}?per_page=100&page={page}")
        for e in batch:
            entries.append({
                "id": e["id"], "type": t, "link": e["link"],
                "title": html.unescape(e["title"]["rendered"]),
                "categories": [cats.get(c, c) for c in e.get("categories", [])],
                "modified": e["modified"], "html": e["content"]["rendered"],
            })
        print(t, "page", page, "of", total, flush=True)
        if page >= total:
            break
        page += 1

with open(out, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=1)
print("saved", len(entries), "entries")

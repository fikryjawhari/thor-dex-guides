"""Dump every main-namespace page of a MediaWiki (via api.php) as wikitext files.
Usage: python -I wiki_dump.py <api-url> <out-dir>"""
import json, os, re, sys, urllib.parse, urllib.request

api, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)


def call(**params):
    params["format"] = "json"
    req = urllib.request.Request(api + "?" + urllib.parse.urlencode(params), headers={"User-Agent": "Mozilla/5.0"})
    return json.load(urllib.request.urlopen(req, timeout=60))


titles, cont = [], {}
while True:
    d = call(action="query", list="allpages", aplimit=500, **cont)
    titles += [p["title"] for p in d["query"]["allpages"]]
    if "continue" not in d:
        break
    cont = {"apcontinue": d["continue"]["apcontinue"]}

for i in range(0, len(titles), 50):
    d = call(action="query", prop="revisions", rvprop="content|timestamp", rvslots="main", titles="|".join(titles[i:i + 50]))
    for page in d["query"]["pages"].values():
        rev = page["revisions"][0]
        name = re.sub(r'[\\/:*?"<>|]', "-", page["title"]) + ".wiki"
        with open(os.path.join(out, name), "w", encoding="utf-8") as f:
            f.write(f"<!-- {page['title']} | last edited {rev['timestamp']} -->\n")
            f.write(rev["slots"]["main"]["*"])
print("saved", len(titles), "pages")

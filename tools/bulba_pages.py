"""Dump Bulbapedia pages as wikitext files, picked by category or title prefix, through its MediaWiki API.

Usage: python -I bulba_pages.py <out-dir> [cat:<Category name> | pre:<Title prefix>] ...
  e.g. "cat:Ultra Sun and Ultra Moon locations" "pre:Walkthrough:Pokémon Ultra Sun and Ultra Moon"

Each page becomes <out-dir>/<title>.wiki (unsafe characters as "-"), first line a comment with the title and the
revision time. Redirects are followed. Used for vanilla trainer places (Trainerentry templates) and story order.
"""
import json, os, re, sys, time, urllib.parse, urllib.request

API = 'https://bulbapedia.bulbagarden.net/w/api.php'
UA = 'thor-dex-guides/1.0 (offline dex builder)'  # a browser UA gets 403 (2026-10-22)


def call(**params):
    params['format'] = 'json'
    req = urllib.request.Request(API + '?' + urllib.parse.urlencode(params), headers={'User-Agent': UA})
    for attempt in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 + 3 * attempt)


def titles_for(spec):
    kind, _, val = spec.partition(':')
    out, cont = [], {}
    while True:
        if kind == 'cat':
            d = call(action='query', list='categorymembers', cmtitle='Category:' + val, cmlimit=500, cmtype='page', **cont)
            out += [p['title'] for p in d['query']['categorymembers']]
        else:
            ns, _, rest = val.partition(':') if ':' in val else ('', '', val)
            nsid = {'Walkthrough': 108}.get(ns, 0)
            d = call(action='query', list='allpages', apprefix=rest if nsid else val, apnamespace=nsid, aplimit=500, **cont)
            out += [p['title'] for p in d['query']['allpages']]
        if 'continue' not in d:
            return out
        cont = {k: v for k, v in d['continue'].items() if k != 'continue'}


def main(out, *specs):
    os.makedirs(out, exist_ok=True)
    titles = sorted({t for s in specs for t in titles_for(s)})
    print(len(titles), 'pages')
    for i in range(0, len(titles), 50):
        d = call(action='query', prop='revisions', rvprop='content|timestamp', rvslots='main', redirects=1,
                 titles='|'.join(titles[i:i + 50]))
        for page in d['query']['pages'].values():
            if 'revisions' not in page:
                print('missing', page.get('title'))
                continue
            rev = page['revisions'][0]
            name = re.sub(r'[\\/:*?"<>|]', '-', page['title']) + '.wiki'
            with open(os.path.join(out, name), 'w', encoding='utf-8', newline='\n') as f:
                f.write(f"<!-- {page['title']} | last edited {rev['timestamp']} -->\n")
                f.write(rev['slots']['main']['*'])


if __name__ == '__main__':
    main(*sys.argv[1:])

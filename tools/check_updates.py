"""Check source pins without rebuilding or downloading patches.

Usage: uv run python -I tools/check_updates.py [hack]
       uv run python -I tools/check_updates.py --accept <hack>

watch.json: sources list of name, type, configuration and state.
Types: github (repo, ref, paths), drive (id), sheet (id, baseline), version
(url, pattern), page (url), sitemap (url, optional prefix), manual (note).
Checks never write state unless --accept succeeds for the whole hack.
Exit 0: unchanged/accepted, 1: changed, 2: failed. Manual entries are reminders.

GitHub's unauthenticated budget is 60 requests/hour. Compare filtered recursive
trees (two requests per ref, cached within a run), not per-path histories or the
compare API's 300-file cap. Reject truncated trees. Fetch raw text only for diffs.
Repos often have no release tags: release-bound sources use a reviewed ref and
a version-page guard. A new version blocks acceptance until its release commit
is resolved by date/changelog and ref + release.version are updated. Never use
Hardlove's development branch or Retiled's upstream engine head for game data.
Public game code wins; their docs use Drive dates for order/splits, not sets.

Sheets are not byte-stable. Reuse the builders' stdlib xlsx reader; hash cell
values and notes per tab, ignoring ZIP metadata and formatting. If the optional
local baseline matches a saved tab hash, show that tab's cell-by-cell diff.
No document text is saved in watch.json. Drive's embedded view has day-resolution
dates (today's clock display is normalised to a date); it is not a content diff.
Sitemap lastmod is publisher-supplied, not proof that every page is unchanged.
3DS patch updates are signalled by Drive; extracting a new romfs stays manual.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import difflib
import hashlib
import html
import importlib.util
import io
import json
from pathlib import Path
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from source_http import fetch_bytes

HEADERS = {'User-Agent': 'thor-dex-guides-update-checker', 'Accept-Language': 'en-US'}
CACHE = {}
GITHUB_REQUESTS = 0
GITHUB_BUDGET = 50


def fetch(url):
    global GITHUB_REQUESTS
    if url not in CACHE:
        github = urllib.parse.urlsplit(url).netloc == 'api.github.com'
        if github:
            if GITHUB_REQUESTS >= GITHUB_BUDGET:
                raise ValueError('GitHub run budget exhausted; check remaining hacks later')
            GITHUB_REQUESTS += 1
        data = fetch_bytes(url, headers=HEADERS, timeout=90,
                           attempts=1 if github else 2, delay=lambda attempt: 1)
        if data is None:
            raise ValueError('fetch failed: ' + url)
        CACHE[url] = data
    return CACHE[url]


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode('utf-8')).hexdigest()


def text(data):
    value = data.decode('utf-8', 'replace')
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', value, flags=re.S | re.I)
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', value)).split())


def differences(before, after):
    return [key for key in sorted(before.keys() | after.keys())
            if before.get(key) != after.get(key)]


def mapping_report(before, after):
    return [f'{key}: {before.get(key, "(added)")} -> {after.get(key, "(removed)")}'
            for key in differences(before, after)]


def version_value(source):
    matches = re.findall(source['pattern'], fetch(source['url']).decode('utf-8', 'replace'), re.I)
    if not matches or any(not isinstance(value, str) or not value for value in matches):
        raise ValueError('version pattern must capture one nonempty version per match')
    versions = set(matches)
    if len(versions) > 1 and source.get('select') != 'latest':
        raise ValueError('ambiguous version pattern: ' + ', '.join(sorted(versions)))
    if source.get('select') == 'latest':
        return max(versions, key=lambda value: tuple(int(part) for part in value.split('.')))
    return matches[0]


def check_version(source, directory):
    current = version_value(source)
    return current, [f'version: {source["state"]} -> {current}'] if current != source['state'] else []


def github_tree(repo, ref):
    base = 'https://api.github.com/repos/' + repo
    commit = json.loads(fetch(base + '/commits/' + urllib.parse.quote(ref, safe='')))
    tree = json.loads(fetch(base + '/git/trees/' + commit['commit']['tree']['sha'] + '?recursive=1'))
    if tree.get('truncated'):
        raise ValueError(repo + ': truncated GitHub tree; narrow the watched repository')
    return commit['sha'], {entry['path']: entry['sha'] for entry in tree['tree']
                           if entry['type'] == 'blob'}


def watched(path, paths):
    return any(path == prefix or (prefix.endswith('/') and path.startswith(prefix)) for prefix in paths)


def check_github(source, directory):
    if 'release' in source:
        release = source['release']
        current = version_value(release)
        if current != release['version']:
            raise ValueError(f'new release {current}; resolve its release commit, update ref and release.version before accepting')
    commit, tree = github_tree(source['repo'], source['ref'])
    files = {path: sha for path, sha in tree.items() if watched(path, source['paths'])}
    if not files:
        raise ValueError('no watched files found')
    previous = source['state']
    old_files = previous['files']
    details = []
    for path in differences(old_files, files):
        details.append(path)
        content = []
        for state, exists in ((previous['sha'], path in old_files), (commit, path in files)):
            if not exists:
                content.append([])
                continue
            url = f'https://raw.githubusercontent.com/{source["repo"]}/{state}/' + urllib.parse.quote(path)
            data = fetch(url)
            content.append(None if b'\0' in data else data.decode('utf-8', 'replace').splitlines())
        if None in content:
            details.append('  binary file changed')
        else:
            details.extend(difflib.unified_diff(*content, fromfile=previous['sha'] + '/' + path,
                                               tofile=commit + '/' + path, lineterm=''))
    return {'sha': commit, 'files': files}, details


def drive_date(value, today):
    value = value.strip()
    if re.fullmatch(r'\d{1,2}:\d{2}(?:\s*[AP]M)?', value, re.I):
        return today.date().isoformat()
    for pattern in ('%m/%d/%y', '%b %d, %Y', '%b %d'):
        try:
            dated = value + ' ' + str(today.year) if pattern == '%b %d' else value
            parsed = datetime.strptime(dated, '%b %d %Y' if pattern == '%b %d' else pattern)
        except ValueError:
            continue
        if pattern == '%b %d':
            parsed = parsed.replace(year=today.year)
            if parsed.date() > today.date():
                parsed = parsed.replace(year=today.year - 1)
        return parsed.date().isoformat()
    raise ValueError('unknown Drive modified date: ' + value)


def drive_state(data, source, today=None):
    today = today or datetime.now(timezone.utc)
    page = data.decode('utf-8', 'replace')
    entries = re.split(r'<div class="flip-entry"\s', page)[1:]
    files = {}
    for entry in entries:
        link = re.search(r'href="https://(?:drive|docs)\.google\.com/(file|drive/folders|spreadsheets|document|presentation)/(?:d/)?([\w-]+)', entry)
        name = re.search(r'class="flip-entry-title">(.*?)</div>', entry, re.S)
        modified = re.search(r'class="flip-entry-last-modified"><div>(.*?)</div>', entry, re.S)
        if not link or not name or not modified:
            raise ValueError('unrecognised Drive entry markup')
        kind, identifier = link.groups()
        if kind == 'drive/folders' or identifier in source.get('exclude_ids', []):
            continue
        if source.get('ids') and identifier not in source['ids']:
            continue
        files[identifier] = {'name': html.unescape(name.group(1)),
                             'modified': drive_date(html.unescape(modified.group(1)), today)}
    if not entries and 'flip-empty' not in page:
        raise ValueError('no Drive entries; folder inaccessible or markup changed')
    if not files:
        raise ValueError('no watched Drive files found')
    return files


def check_drive(source, directory):
    current = drive_state(fetch('https://drive.google.com/embeddedfolderview?id=' + source['id'] + '&hl=en'), source)
    return current, mapping_report(source['state'], current)


def sheet_cells(data):
    reader = ROOT / 'hacks/hardlove-gold/extract/xlsx.py'
    spec = importlib.util.spec_from_file_location('update_xlsx', reader)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    tabs = {}
    for sheet in module.load(io.BytesIO(data)):
        cells = {f'{row},{column}': value for (row, column), value in sheet.cells.items()}
        notes = {f'{row},{column}': value for (row, column), value in sheet.notes.items()}
        tabs[sheet.name] = {'cells': cells, 'notes': notes}
    if not tabs:
        raise ValueError('workbook has no tabs')
    return tabs


def sheet_state(tabs):
    return {name: digest(values) for name, values in tabs.items()}


def check_sheet(source, directory):
    tabs = sheet_cells(fetch(f'https://docs.google.com/spreadsheets/d/{source["id"]}/export?format=xlsx'))
    current = sheet_state(tabs)
    previous = source['state']
    changed = differences(previous, current)
    details = []
    baseline = directory / source['baseline'] if source.get('baseline') else None
    old_tabs = sheet_cells(baseline.read_bytes()) if changed and baseline and baseline.is_file() else {}
    for name in changed:
        if name not in previous:
            details.append('tab added: ' + name)
        elif name not in current:
            details.append('tab removed: ' + name)
        elif name in old_tabs and digest(old_tabs[name]) == previous[name]:
            details.append('tab changed: ' + name)
            for kind in ('cells', 'notes'):
                for coordinate in differences(old_tabs[name][kind], tabs[name][kind]):
                    details.append(f'  {kind} {coordinate}: {old_tabs[name][kind].get(coordinate)!r} -> {tabs[name][kind].get(coordinate)!r}')
        else:
            details.append('tab changed: ' + name + ' (matching baseline xlsx needed for cell diff)')
    return current, details


def check_page(source, directory):
    if isinstance(source['state'], dict):
        return check_pages(source, directory)
    current = digest(text(fetch(source['url'])))
    details = []
    if current != source['state']:
        details.append('page text hash changed: ' + source['url'])
        baseline = directory / source['baseline'] if source.get('baseline') else None
        if baseline and baseline.is_file():
            before = text(baseline.read_bytes())
            if digest(before) == source['state']:
                details.extend(difflib.unified_diff(before.split('. '), text(fetch(source['url'])).split('. '),
                                                   fromfile='fetched page', tofile='current page', lineterm=''))
    return current, details


def page_value(data, projection=None):
    if projection != 'move-details':
        return text(data)
    page = data.decode('utf-8', 'replace')
    stats = dict((label, value) for value, label in re.findall(
        r'stat-num">([^<]*)</div>\s*<div class="text-sm text-muted mt-1">([^<]+)</div>', page))
    priority = stats.get('Priority', '').strip()
    description = re.search(r'<p class="mt-4 text-base[^"]*">(.*?)</p>', page, re.S)
    if not stats:
        raise ValueError('move page has no move stats')
    return {'pr': int(priority) if re.fullmatch(r'-?\d+', priority) else None,
            'd': text(description.group(1).encode('utf-8')) if description else ''}


def check_pages(source, directory):
    previous = source['state']
    current = {}
    details = []

    def read(path):
        url = urllib.parse.urljoin(source['url'], path)
        try:
            value = page_value(fetch(url), source.get('projection'))
            return path, digest(value), value
        except ValueError as error:
            raise ValueError(url + ': ' + str(error)) from error
        finally:
            CACHE.pop(url, None)

    with ThreadPoolExecutor(6) as pool:
        for path, hashed, value in pool.map(read, previous):
            current[path] = hashed
            if hashed == previous[path]:
                continue
            details.append('page changed: ' + urllib.parse.urljoin(source['url'], path))
            baseline = directory / source['baseline'] / path if source.get('baseline') else None
            if baseline and baseline.is_file():
                before = page_value(baseline.read_bytes(), source.get('projection'))
                if digest(before) == previous[path] and isinstance(before, str):
                    details.extend(difflib.unified_diff(before.split('. '), value.split('. '),
                                                       fromfile='fetched/' + path, tofile='current/' + path, lineterm=''))
    return current, details


def sitemap_state(data, prefix=''):
    root = ET.fromstring(data)
    namespace = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    if root.tag not in (namespace + 'sitemapindex', namespace + 'urlset'):
        raise ValueError('not a sitemap')
    entries = {}
    for entry in root:
        location = entry.findtext(namespace + 'loc')
        if location and location.startswith(prefix):
            modified = entry.findtext(namespace + 'lastmod')
            entries[location] = modified or '(no lastmod; URL membership only)'
    if not entries:
        raise ValueError('no watched sitemap entries')
    return entries


def check_sitemap(source, directory):
    current = sitemap_state(fetch(source['url']), source.get('prefix', ''))
    return current, mapping_report(source['state'], current)


def check_manual(source, directory):
    return source.get('state'), ['MANUAL: ' + source['note']]


CHECKERS = {'github': check_github, 'drive': check_drive, 'sheet': check_sheet,
            'version': check_version, 'page': check_page, 'sitemap': check_sitemap,
            'manual': check_manual}


def check_file(path, accept=False):
    document = json.loads(path.read_text(encoding='utf-8'))
    changed = False
    failed = False
    print(path.parent.name + ':', flush=True)
    for source in document['sources']:
        try:
            state, details = CHECKERS[source['type']](source, path.parent)
            different = bool(details) and source['type'] != 'manual'
            changed |= different
            label = 'manual' if source['type'] == 'manual' else 'CHANGED' if different else 'unchanged'
            print(f'  {source["name"]} [{source["type"]}]: {label}', flush=True)
            for detail in details:
                print('    ' + detail, flush=True)
            if source['type'] != 'manual':
                source['state'] = state
        except (ValueError, KeyError, OSError, ET.ParseError, zipfile.BadZipFile) as error:
            failed = True
            print(f'  {source.get("name", "?")}: ERROR {error}', flush=True)
    if accept and not failed:
        temporary = path.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        temporary.replace(path)
        print('  accepted (manual sources still need review)', flush=True)
    elif accept:
        print('  NOT accepted: at least one check failed', flush=True)
    return 2 if failed else 1 if changed and not accept else 0


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('hack', nargs='?')
    parser.add_argument('--accept', metavar='HACK')
    args = parser.parse_args()
    if args.accept and args.hack:
        parser.error('use either [hack] or --accept <hack>')
    hack = args.accept or args.hack
    paths = sorted((ROOT / 'hacks').glob('*/watch.json'))
    if hack:
        paths = [path for path in paths if path.parent.name == hack]
        if not paths:
            parser.error('unknown hack or missing watch.json: ' + hack)
    elif not paths:
        parser.error('no watch.json files found')
    result = 0
    for path in paths:
        result = max(result, check_file(path, bool(args.accept)))
    print(f'GitHub API requests this run: {GITHUB_REQUESTS} (run cap {GITHUB_BUDGET}; unauthenticated limit 60/hour)')
    return result


if __name__ == '__main__':
    raise SystemExit(main())

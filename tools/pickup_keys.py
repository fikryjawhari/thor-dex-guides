"""Persistent pickup identities, assigned by finalise after item standardisation.

Tables retain removed pickups and only append new keys. Matching rounds run globally,
strictest first, accepting only unique candidates on both sides. Reworded / moved
pickups, new keys and unmatched historical entries are reported like trainer keys.
Item spellings share item_text's lookup key; historical spellings stay in the table
so raw extracts and expanded published names can alternate without rewriting it.
"""
import json
import os
import re

import item_text

ROUNDS = [('i', 'loc', 't'), ('i', 't'), ('i', 'loc')]
REPEATABLE = re.compile(r'\b(?:repeatable|daily|every day|each day|once (?:a|per) day|'
                        r'weekdays?|weekends?|weekly|every night|each night|'
                        r'mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?)\b'
                        r'|^Also: (?:Pickup\b|has a Use option)', re.I)  # the Pickup ability's odds, a use note: no place


ONCE = frozenset({'Key Items', 'TMs and HMs', 'Mega Stones', 'Z-Crystals'})   # one of a kind: bought ones too


def eligible(text, box, once=ONCE):
    """A pickup: a Found / Also line, or a Shop line of a one-of-a-kind item (`once` boxes: a hack whose TMs are
    single-use leaves TMs and HMs out); never Wild, Move Tutors / Useful NPCs or a repeatable line."""
    labels = ('Found:', 'Also:', 'Shop:') if box in once else ('Found:', 'Also:')
    return (box not in ('Useful NPCs', 'Move Tutors') and text.startswith(labels)
            and not REPEATABLE.search(text))


def walk_rows(data):
    for split in data.get('WK', {}).get('splits', []):
        for stop in split['st']:
            for row in stop['it']:
                yield stop['n'], row
    for row in data.get('WK', {}).get('np', []):
        yield '', row


def pickups(data, once=ONCE):
    """Return acquisition identities and writable (array, index) references to each."""
    locations = {}
    for place, row in walk_rows(data):
        while len(row) < 5:
            row.append(0)
        row[4] = 0
        if place:
            locations.setdefault((row[1], row[2]), []).append(place)
    found = {}
    for box in data['IT']:
        for row in box['r']:
            lines = row[1].splitlines()
            row[5:] = [[0] * len(lines)]
            for index, text in enumerate(lines):
                if not eligible(text, box['n'], once):
                    continue
                place = re.sub(r'^(?:Found|Also|Shop):\s*', '', text).split(' · ', 1)[0].strip().rstrip('.')
                stops = locations.get((row[0], text), [])
                if len(set(stops)) == 1:
                    place = stops[0]
                signature = (row[0], text)
                entry = found.setdefault(signature, {'i': row[0], 'loc': place, 't': text, 'refs': []})
                entry['refs'].append((row[5], index))
    for place, row in walk_rows(data):
        entry = found.get((row[1], row[2]))
        if entry and eligible(row[2], row[0], once):
            entry['refs'].append((row, 4))
        elif eligible(row[2], row[0], once):
            raise AssertionError(f'pickup keys: walkthrough item has no IT line: {place}: {row[:3]}')
    return list(found.values())


def signature(entry, fields):
    return tuple(item_text.key(entry[field]) if field == 'i' else entry[field] for field in fields)


def match(table, entries):
    pairs = {}
    used = set()
    for round_index, fields in enumerate(ROUNDS):
        old, new = {}, {}
        for index, entry in enumerate(table):
            if index not in used:
                old.setdefault(signature(entry, fields), []).append(index)
        for index, entry in enumerate(entries):
            if index not in pairs:
                new.setdefault(signature(entry, fields), []).append(index)
        for value, candidates in new.items():
            previous = old.get(value, [])
            if len(candidates) == len(previous) == 1:
                pairs[candidates[0]] = previous[0], round_index
                used.add(previous[0])
    return pairs


def read(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8') as stream:
        return json.load(stream)


def write(path, table):
    text = '[\n' + ',\n'.join(json.dumps(entry, ensure_ascii=False, separators=(',', ':')) for entry in table) + '\n]\n'
    if os.path.exists(path):
        with open(path, encoding='utf-8') as stream:
            if stream.read() == text:
                return
    with open(path, 'w', encoding='utf-8', newline='\n') as stream:
        stream.write(text)


def stabilise(data, path, report, once=ONCE):
    seeded = os.path.exists(path)
    table = read(path)
    entries = pickups(data, once)
    pairs = match(table, entries)
    loose, added = [], []
    old_count = len(table)
    next_key = max((int(entry['k'][1:]) for entry in table), default=-1) + 1
    for index, entry in enumerate(entries):
        identity = {field: entry[field] for field in ('i', 'loc', 't')}
        if index in pairs:
            previous, round_index = pairs[index]
            key = table[previous]['k']
            identity['i'] = table[previous]['i']
            table[previous] = dict(k=key, **identity)
            if round_index:
                loose.append(f"  {key}: {entry['i']} ({entry['loc']}) matched on {', '.join(ROUNDS[round_index])}")
        else:
            key = f'p{next_key}'
            next_key += 1
            table.append(dict(k=key, **identity))
            added.append(f"  {key}: {entry['i']} ({entry['loc']})")
        for target, position in entry['refs']:
            target[position] = key
    used = {previous for previous, _ in pairs.values()}
    gone = [f"  {entry['k']}: {entry['i']} ({entry['loc']})" for index, entry in enumerate(table[:old_count])
            if index not in used]
    if not seeded:
        report(f'pickup keys: new table {os.path.relpath(path)} ({len(entries)} pickups)')
    for title, lines in (('matched loosely', loose), ('new keys', added if seeded else []),
                         ('table entries no pickup matched', gone)):
        if lines:
            report(f'pickup keys: {len(lines)} {title}')
            for line in lines:
                report(line)
    report(f"pickup keys: {len(entries)} pickups, {sum(bool(row[4]) for _, row in walk_rows(data))} walkthrough rows keyed")
    write(path, table)


def check(data, path, once=ONCE):
    known = {entry['k'] for entry in read(path)}
    issues = []
    item_keys = set()
    for box in data['IT']:
        for row in box['r']:
            lines = row[1].splitlines()
            if len(row) != 6 or len(row[5]) != len(lines):
                issues.append(f'{row[0]}: pickup key / line count')
                continue
            for text, key in zip(lines, row[5]):
                if bool(key) != bool(eligible(text, box['n'], once)) or key and key not in known:
                    issues.append(f'{row[0]}: invalid pickup key {key!r}')
                if key:
                    item_keys.add((row[0], text, key))
    for place, row in walk_rows(data):
        if len(row) != 5 or bool(row[4]) != bool(eligible(row[2], row[0], once)):
            issues.append(f'{place}: invalid walkthrough pickup key: {row[:3]}')
        elif row[4] and (row[1], row[2], row[4]) not in item_keys:
            issues.append(f'{place}: walkthrough / IT pickup mismatch: {row[:3]}')
    return issues

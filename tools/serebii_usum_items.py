"""Build an item-locations CSV from Serebii's vanilla Ultra Sun / Ultra Moon pages (Photonic Sun).

Usage:
  python -I serebii_usum_items.py <items.shtml> <tm.shtml> <out.csv>

One row per item and place: item, category, location, method. Methods are Serebii's own labels: "field" (found
in the overworld, ball or hidden; Serebii doesn't say which), "Shop", "Wild Encounter" (held by wild Pokémon),
and one-off sources such as "Festival Plaza", "Poké Pelago", "PickUp Item", "Roto Loto", "Café gift" or
"Fishing - <island>", which have no location. Ultra Moon-only entries are not marked by Serebii.
"""
import csv, html, re, sys


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def items(page):
    s = open(page, encoding="latin-1").read()
    rows = []
    # section headings (<font size="4"><b><u>Name</u>) interleave with the item rows
    for m in re.finditer(r'<font size="4"><b><u>(.*?)</u>|<tr height="32">(.*?)</tr>', s, re.S):
        if m.group(1):
            category = clean(m.group(1))
            continue
        tds = re.findall(r"<td[^>]*>(.*?)</td>", m.group(2), re.S)
        name, loc = clean(tds[1]), tds[-1]
        method = "field"
        for seg in re.split(r"<br\s*/?>", loc):
            seg = seg.strip()
            if not seg:
                continue
            b = re.fullmatch(r"<b>(.*?)</b>", seg)
            if b:
                method = clean(b.group(1))
            elif "<a" in seg:
                for place in re.findall(r"<a [^>]*>(.*?)</a>", seg):
                    rows.append((name, category, clean(place), method))
            else:
                rows.append((name, category, "", clean(seg)))
    return rows


def tms(page):
    s = open(page, encoding="latin-1").read()
    rows = []
    for no, move, loc in re.findall(r'<td class="fooinfo">(TM\d+)</td><td class="fooinfo"><a[^>]*>(.*?)</a></td>.*?'
                                    r'<td class="fooinfo">([^<]*(?:<[^/][^>]*>[^<]*)*)</td></tr>', s, re.S):
        for place in re.split(r"<br\s*/?>", loc):
            if clean(place):
                rows.append((f"{no} {clean(move)}", "TMs", clean(place), "field"))
    return rows


def main(items_page, tm_page, out):
    rows = items(items_page) + tms(tm_page)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["item", "category", "location", "method", "source"])
        for r in rows:
            w.writerow(list(r) + ["vanilla Ultra Sun (Serebii)"])
    print(len(rows), "rows ->", out)


if __name__ == "__main__":
    main(*sys.argv[1:])

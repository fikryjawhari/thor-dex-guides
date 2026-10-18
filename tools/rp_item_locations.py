"""Build hacks/renegade-platinum/.src/item-locations.csv: Renegade Platinum's own item docs, filled with vanilla
Platinum placements (from the pret/pokeplatinum decomp) for every item the RP docs do not cover.

Usage (repo root): python -I tools/rp_item_locations.py
Needs hacks/renegade-platinum/.src/ItemChanges.txt and hacks/renegade-platinum/.src/romhackdex/items/ (see SOURCES.md).

Coverage rule: the RP docs list every location for held/evolution items, TMs, HMs, plates and key items. Those
items take RP rows only. All other items (medicine, balls, berries, vitamins...) take vanilla rows, marked
source=vanilla. RomHackDex is checked for items the RP docs miss and adds rows for them."""
import csv, html as html_lib, json, os, re, urllib.request

DECOMP_SHA = "1dc13dcea40c04ab53f1f607de46023dc409ef20"  # pret/pokeplatinum main on 2026-10-14
RAW = f"https://raw.githubusercontent.com/pret/pokeplatinum/{DECOMP_SHA}/"
RP = "hacks/renegade-platinum/.src"


def fetch(path):
    req = urllib.request.Request(RAW + path, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8")


def key(name):
    """Normalise an item name for matching: 'Poké Ball' / 'ITEM_POKE_BALL' -> 'pokeball'."""
    name = name.replace("é", "e").replace("ITEM_", "")
    return re.sub(r"[^a-z0-9]", "", name.lower())


def split_cols(line):
    return re.split(r"\s{2,}", line.strip())


# --- Renegade Platinum's own tables -------------------------------------------------------------
lines = open(f"{RP}/ItemChanges.txt", encoding="utf-8").read().splitlines()
sections, current = {}, None
for i, line in enumerate(lines):
    if i + 1 < len(lines) and re.fullmatch(r"=+", lines[i + 1].strip() or "x") and line.strip() and not re.fullmatch(r"=+", line.strip()):
        current = line.strip()
        sections[current] = []
    elif current and line.strip() and not re.fullmatch(r"[=-]+", line.strip()):
        sections[current].append(line)

rows, covered = [], set()


def add(item, location, method, source, note=""):
    rows.append({"item": item, "location": location, "method": method, "source": source, "note": note})


for line in sections["Item Locations"]:
    cols = split_cols(line)
    if len(cols) == 2 and cols[0] not in ("Item", "---"):
        add(cols[0], cols[1], "see location text", "renegade-platinum docs")
        covered.add(key(cols[0]))

for line in sections["TM Locations"]:
    cols = split_cols(line)
    if re.match(r"(TM|HM)\d\d ", cols[0]):
        changed = cols[-1] == "*"
        cols = [c for c in cols if c != "*"]
        add(cols[0], cols[1], cols[2] if len(cols) > 2 else "", "renegade-platinum docs", "changed from vanilla" if changed else "")
        covered.add(key(cols[0].split()[0]))

for line in sections["Plate Locations"]:
    cols = split_cols(line)
    if len(cols) == 2 and cols[0].endswith("Plate"):
        add(cols[0], cols[1], "Underground, or beat that type's Master Trainer", "renegade-platinum docs")
        covered.add(key(cols[0]))

for line in sections["Key Items"]:
    cols = split_cols(line)
    if len(cols) >= 3:
        flag = cols[3] if len(cols) > 3 else ""
        note = {"*": "changed from vanilla", "**": "new in Renegade Platinum"}.get(flag, "")
        add(cols[0], cols[1], cols[2], "renegade-platinum docs", note)
        covered.add(key(cols[0]))

# --- RomHackDex: anything the RP docs miss ------------------------------------------------------
rhd_added = []
for slug in sorted(os.listdir(f"{RP}/romhackdex/items")):
    page = f"{RP}/romhackdex/items/{slug}/index.html"
    if not os.path.isfile(page):
        continue
    html = open(page, encoding="utf-8").read()
    title = re.search(r"<h1[^>]*>\s*([^<]+?)\s*</h1>", html)
    where = re.search(r"Where to Find\s*</[^>]+>\s*(?:<[^>]+>\s*)*([^<]+)", html)
    name = html_lib.unescape(title.group(1)) if title else ""
    if name and key(name) not in covered and where:
        add(name, html_lib.unescape(where.group(1).strip()), "see location text", "romhackdex")
        covered.add(key(name))
        rhd_added.append(name)


# --- Vanilla Platinum placements for everything else --------------------------------------------
def place(camel):
    """'Route204South' -> 'Route 204 South'; 'OreburghGateB1F' -> 'Oreburgh Gate B1F'."""
    s = re.sub(r"(?<=[a-z])(?=[A-Z0-9])|(?<=[0-9])(?=[A-Z][a-z])", " ", camel)
    return re.sub(r"\bB (\d)F\b", r"B\1F", s)


names = {}


def item_name(const):
    if const not in names:
        try:
            names[const] = json.loads(fetch(f"res/items/data/{const[5:].lower()}.json"))["name"]
        except Exception:
            names[const] = const[5:].replace("_", " ").title()
    return names[const]


vanilla = []
visible = fetch("res/field/scripts/scripts_visible_items.s")
for label, const, qty in re.findall(r"^VisibleItems_(\w+?)_\w+:\s*\n\s*SetVar VAR_0x8008, (ITEM_\w+)\s*\n\s*SetVar VAR_0x8009, (\d+)", visible, re.M):
    if not label.startswith("Unused"):
        vanilla.append((const, place(label), "item on ground", int(qty)))

hidden = fetch("include/data/field/hidden_items.h")
for const, qty, flag in re.findall(r"HIDDEN_ITEM_ENTRY\((ITEM_\w+),\s*(\d+),\s*\d+,\s*FLAG_OBTAINED_HIDDEN_(\w+)\)", hidden):
    loc = re.sub("_" + const[5:] + "$", "", flag)
    vanilla.append((const, place("".join(w.capitalize() if not w.isdigit() else w for w in loc.split("_"))), "hidden", int(qty)))

skipped = 0
for const, loc, method, qty in vanilla:
    name = item_name(const)
    if key(name) in covered or key(const) in covered:
        skipped += 1
        continue
    add(name + (f" x{qty}" if qty > 1 else ""), loc, method, "vanilla",
        "vanilla Platinum placement; RP may have swapped some ground items for the held items it lists")

with open(f"{RP}/item-locations.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["item", "location", "method", "source", "note"])
    w.writeheader()
    w.writerows(rows)

by_source = {}
for r in rows:
    by_source[r["source"]] = by_source.get(r["source"], 0) + 1
print("rows by source:", by_source)
print("vanilla placements dropped because RP covers the item:", skipped)
print("added from romhackdex:", rhd_added or "none")

"""Cross-check a ctr_dex.py extract against Buffel Saft's docs (Photonic Sun, Eternal X).
Usage: python buffel_check.py <dex.json> <Pokemon Changes.pdf>   (needs pdftotext on PATH)
       python buffel_check.py <dex.json> "<Level Up Moves, ....txt>"

PDF: its stat rows are images, so only its text is checked: every "New moves" move must be learnable by each
species named in the block (level-up, TM, tutor or egg), and "Abilities" must match the game's three slots.
Level-up txt: every species' list must equal the game's form-0 level-up list, in order.
Prints one line per mismatch, then totals."""
import json, re, subprocess, sys

dex = json.load(open(sys.argv[1], encoding="utf-8"))

if sys.argv[2].lower().endswith(".txt"):
    raw = open(sys.argv[2], "rb").read()
    doc = raw.decode("utf-16") if raw[:2] in (b"\xff\xfe", b"\xfe\xff") else raw.decode("utf-8-sig")
    # The doc's number is the personal index: the dex number for base forms, higher for forms ("953 Mimikyu 1").
    game = {s["pidx"]: s for s in dex["species"]}
    bad = n = 0
    for head, body in re.findall(r"=+\s*\n\s*(\d+ [^\n]+?)\s*\n\s*=+\s*\n(.*?)(?=\n\s*=+\s*\n|\Z)", doc, re.S):
        num, name = head.split(" ", 1)
        lst = [[int(lv), mv.strip()] for lv, mv in re.findall(r"^\s*(\d+)\s*-\s*(.+?)\s*$", body, re.M)]
        s = game.get(int(num))
        if not s:
            print("? no game entry for", head)
            continue
        n += 1
        if not name.startswith(s["name"]):
            print(f"? {head}: game has {s['name']} form {s['form']} at that index")
        if lst != s["levelup"]:
            bad += 1
            doc_set, game_set = {tuple(x) for x in lst}, {tuple(x) for x in s["levelup"]}
            print(f"{name}: doc-only {sorted(doc_set - game_set)[:8]} game-only {sorted(game_set - doc_set)[:8]}"
                  + ("" if doc_set != game_set else " (same moves, different order)"))
    print(f"\n{n} species in doc, {bad} differ")
    sys.exit()
txt = subprocess.run(["pdftotext", "-enc", "UTF-8", "-layout", sys.argv[2], "-"], capture_output=True).stdout.decode("utf-8")

tms = dex["tms"]
by_name = {}
for s in dex["species"]:
    if s["form"] == 0:
        by_name[s["name"].lower()] = s


def learnable(s):
    return ({m for _, m in s["levelup"]} | {tms[t] for t in s["tm"] if t in tms} | set(s["tutor"]) | set(s["egg"]))


KEY = re.compile(r"\b(HP\s+Atk|Original|Modified|New moves|Abilities|Type Change)\b")
blocks, cur = [], None
for line in txt.split("\n"):
    if re.search(r"\bHP\s+Atk\s+Def", line):
        cur = {"names": [], "moves": "", "abil": "", "mode": None}
        blocks.append(cur)
    if cur is None:
        continue
    m = KEY.search(line)
    head = (line[:m.start()] if m else line).strip()
    if head and not re.search(r"\d", head) and len(head) < 40 and (m or cur["mode"] is None):
        cur["names"] += [h.strip() for h in head.split(",") if h.strip()]
    if "New moves" in line:
        cur["mode"] = "moves"
        cur["moves"] += line.split("New moves", 1)[1]
    elif "Abilities" in line:
        cur["mode"] = "abil"
        cur["abil"] = line.split("Abilities", 1)[1].strip()
    elif "Type Change" in line or "Original" in line or "Modified" in line:
        cur["mode"] = None if "Type Change" in line else cur["mode"]
    elif cur["mode"] == "moves" and line.strip() and not head:
        cur["moves"] += " " + line.strip()
    elif cur["mode"] == "moves" and line.startswith(" " * 12) and line.strip():
        cur["moves"] += " " + line.strip()

bad_moves = bad_abil = unknown = checked = 0
for b in blocks:
    raw = re.sub(r"\s{3,}|\r", ",", b["moves"])  # wide gaps separate columns (stat numbers, a second block)
    moves = [re.sub(r"\*+|^(TM|HM)\d*\s+", "", x.strip()).strip() for x in raw.split(",")]
    moves = [m for m in moves if m and not re.search(r"\d|=>|/", m)]
    abil = [] if re.search(r"\d|,", b["abil"]) else [a.strip() for a in b["abil"].split("/") if a.strip()]
    for n in b["names"]:
        s = by_name.get(n.lower())
        if not s:
            unknown += 1
            print("? unknown species in PDF block:", n)
            continue
        checked += 1
        can = learnable(s)
        miss = [m for m in moves if m not in can]
        if miss:
            bad_moves += 1
            print(f"MOVES {s['name']}: PDF lists {miss} but the game data can't learn them")
        if abil:
            game = s["abilities"]
            want = abil if len(abil) == 3 else abil + [abil[-1]] * (3 - len(abil))
            if [a.lower() for a in game] != [a.lower() for a in want] and \
                    sorted(set(a.lower() for a in game)) != sorted(set(a.lower() for a in abil)):
                bad_abil += 1
                print(f"ABIL  {s['name']}: PDF {abil} game {game}")
print(f"\n{len(blocks)} blocks, {checked} species checked, {bad_moves} with missing moves, {bad_abil} ability "
      f"differences, {unknown} names not matched")

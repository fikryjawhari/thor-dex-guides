"""Write Eternal X's rival fights (Serena/Calem, Shauna, Tierno, Trevor) from a trainers JSON made by xy_trainers.py.

Usage:
  python -I ex_rivals.py <trainers.json> <out.md> [variant name]

Trainer IDs are vanilla XY's (pk3DS RSTE.cs GetTagsXY), confirmed by name in Eternal X's own text archive.
Battles and locations come from Bulbapedia's vanilla rival pages (levels matched against a vanilla X dump).
"""
import json, sys

# (battle, location, role, {player's starter: (Calem id, Serena id)}) -- role: "Opponent" or a partner note
STARTERS = ["Chespin", "Fennekin", "Froakie"]
RIVAL = [
    ("Multi Battle partner", "Route 7", "Partner, vs Tierno and Trevor", (435, 436, 437), (596, 597, 598)),
    ("Multi Battle partner", "Glittering Cave", "Partner, vs two Team Flare Grunts", (130, 131, 132), (575, 576, 577)),
    ("First battle", "Tower of Mastery", "Opponent", (329, 330, 331), (581, 582, 583)),
    ("Second battle", "Coumarine City", "Opponent", (184, 185, 186), (578, 579, 580)),
    ("Third battle", "Route 14", "Opponent", (332, 333, 334), (584, 585, 586)),
    ("Multi Battle partner", "Poké Ball Factory", "Partner, vs Celosia and Bryony", (604, 605, 606), (607, 608, 609)),
    ("Fourth battle", "Anistar City", "Opponent", (335, 336, 337), (587, 588, 589)),
    ("Multi Battle partner", "Team Flare Secret HQ", "Partner, vs Team Flare Admins", (338, 339, 340), (590, 591, 592)),
    ("Fifth battle", "Victory Road", "Opponent", (341, 342, 343), (593, 594, 595)),
    ("Rematch", "Kiloude City", "Opponent", (519, 520, 521), (599, 600, 601)),
]
FRIENDS = [
    ("Shauna", "First battle", "Aquacorde Town", "Opponent", (137, 138, 139)),
    ("Tierno", "First battle", "Route 5", "Opponent", (573,)),
    ("Tierno", "Second battle", "Route 7", "Multi Battle with Trevor (partner: Serena/Calem)", (438,)),
    ("Trevor", "First battle", "Route 7", "Multi Battle with Tierno (partner: Serena/Calem)", (439,)),
    ("Shauna", "Second battle", "Route 19", "Opponent", (321, 322, 323)),
    ("Tierno", "Third battle", "Route 19", "Opponent", (324,)),
    ("Trevor", "Second battle", "Route 19", "Opponent", (325,)),
]


def mon_lines(m):
    form = "♀" if m["species"] == "Meowstic" and m["form"] else (f"form {m['form']}" if m["form"] else "")
    head = f"- **{m['species']}**" + (f" ({form})" if form else "") + f" Lv {m['level']}"
    bits = [f"@ {m['item']}" if m.get("item") else None, m["ability"], f"IVs {m['ivs']}"]
    line = head + " " + " · ".join(b for b in bits if b)
    if m.get("moves"):
        line += "  \n  " + " / ".join(m["moves"])
    return line


def main(src, out, variant="Rebalanced"):
    T = json.load(open(src, encoding="utf-8"))
    md = [f"# Eternal X ({variant} v2.67): rival teams", "",
          f"Extracted from the {variant} romfs (`a/0/3/8` trdata, `a/0/4/0` trpoke) with `tools/xy_trainers.py`.",
          "Gen 6 trainer data has no natures or EVs. Ability \"X or Y\" means the game picks one of the two.",
          "\"You picked\" is the player's starter; the rival takes the one strong against it.", ""]
    md += ["## Serena / Calem", "",
           "You face Serena if you play as Calem, and Calem if you play as Serena. Their teams differ (Meowstic's",
           "gender and ability, many movesets and items), so both are listed.", ""]
    for battle, loc, role, calem, serena in RIVAL:
        md += [f"### {battle}: {loc}", "", f"*{role}.* Trainer IDs Calem {calem}, Serena {serena}.", ""]
        for k, start in enumerate(STARTERS):
            for name, ids in (("Serena", serena), ("Calem", calem)):
                t = T[ids[k]]
                assert t["name"] == name, (ids[k], t["name"])
                md += [f"**You picked {start}: {name}** (bag: {', '.join(t['items']) or 'none'})", ""]
                md += [mon_lines(m) for m in t["team"]] + [""]
    md += ["## Shauna, Tierno, Trevor", ""]
    for name, battle, loc, role, ids in FRIENDS:
        md += [f"### {name}, {battle}: {loc}", "", f"*{role}.* Trainer ID{'s' if len(ids) > 1 else ''} {', '.join(map(str, ids))}.", ""]
        for k, tid in enumerate(ids):
            t = T[tid]
            assert t["name"] == name, (tid, t["name"])
            if len(ids) > 1:
                md += [f"**You picked {STARTERS[k]}**", ""]
            md += [mon_lines(m) for m in t["team"]] + [""]
    open(out, "w", encoding="utf-8").write("\n".join(md))
    print("->", out)


if __name__ == "__main__":
    main(*sys.argv[1:])

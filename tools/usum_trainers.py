"""Dump every USUM-engine trainer (Photonic Sun) from a romfs into JSON, names taken from the romfs's own text.

Usage:
  python -I usum_trainers.py <romfs> <out.json> [fallback-romfs ...]

<romfs> holds a/1/0/6 (trdata), a/1/0/7 (trpoke), a/0/3/2 (English game text) and a/0/1/7 (personal). Archives
missing from it are read from the fallback romfs folders in order (for Ultra Sun v1.2: the update's dump, then the
base game's). Record layouts: pk3DS TrainerData7.cs / TrainerPoke7.cs. Unlike Gen 6, Gen 7 trainer Pokémon carry
nature, EVs and per-stat IVs.
"""
import json, os, struct, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garc import entry, text
from xy_trainers import archive

BATTLE = {0: "Single", 1: "Double", 2: "Multi"}
GENDER = {0: "random", 1: "male", 2: "female"}
STATS = ["hp", "atk", "def", "spa", "spd", "spe"]


def main(romfs, out, *fallback):
    roots = [romfs, *fallback]
    trdata = archive(roots, "a/1/0/6")
    trpoke = archive(roots, "a/1/0/7")
    gt = archive(roots, "a/0/3/2")
    personal = archive(roots, "a/0/1/7")  # trainer and personal archives are never LZ11-compressed
    T = lambda i: text(entry(gt[i]))
    names, classes, species, moves, items, abilities, natures = T(110), T(111), T(60), T(118), T(40), T(101), T(92)

    def ability(spec, form, slot):
        pi = personal[spec]
        fsi, = struct.unpack_from("<H", pi, 0x1C)
        if form and pi[0x20] > form and fsi:
            pi = personal[fsi + form - 1]
        a = [abilities[x] for x in pi[0x18:0x1B]]
        return {0: f"{a[0]} or {a[1]}" if a[0] != a[1] else a[0], 1: a[0], 2: a[1], 3: a[2]}.get(slot, slot)

    trainers = []
    for tid, (d, p) in enumerate(zip(trdata, trpoke)):
        cls, = struct.unpack_from("<H", d, 0)
        battle, count = d[2], d[3]
        team = []
        for k in range(count):
            r = p[k * 0x20:(k + 1) * 0x20]
            iv32, = struct.unpack_from("<I", r, 8)
            spec, = struct.unpack_from("<H", r, 0x10)
            form, item = r[0x12], struct.unpack_from("<H", r, 0x14)[0]
            mon = {"species": species[spec], "speciesId": spec, "form": form, "level": r[0xE],
                   "nature": natures[r[1]], "ability": ability(spec, form, r[0] >> 4 & 3), "abilitySlot": r[0] >> 4 & 3,
                   "gender": GENDER.get(r[0] & 3, r[0] & 3), "item": items[item] if item else None,
                   "ivs": dict(zip(STATS, [iv32 >> (5 * s) & 0x1F for s in range(6)])),
                   "evs": dict(zip(STATS, r[2:8])), "shiny": bool(iv32 >> 30 & 1),
                   "moves": [moves[m] for m in struct.unpack_from("<4H", r, 0x18) if m]}
            team.append(mon)
        trainers.append({"id": tid, "name": names[tid] if tid < len(names) else "", "classId": cls,
                         "class": classes[cls] if cls < len(classes) else cls, "battle": BATTLE.get(battle, battle),
                         "items": [items[i] for i in struct.unpack_from("<4H", d, 4) if i], "ai": d[0xC],
                         "team": team})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(trainers, f, ensure_ascii=False, indent=1)
    print(len(trainers), "trainers ->", out)


if __name__ == "__main__":
    main(*sys.argv[1:])

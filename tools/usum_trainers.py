"""Dump every USUM-engine trainer (Photonic Sun) from a romfs into JSON, names taken from the romfs's own text.

Usage:
  python -I usum_trainers.py [--sm] <romfs> <out.json> [fallback-romfs ...]

--sm reads a Sun/Moon romfs (Meissa Moon): trdata a/1/0/5, trpoke a/1/0/6 and the SM text file numbers; the
records are the same.

<romfs> holds a/1/0/6 (trdata), a/1/0/7 (trpoke), a/0/3/2 (English game text) and a/0/1/7 (personal). Archives
missing from it are read from the fallback romfs folders in order (for Ultra Sun v1.2: the update's dump, then the
base game's). Record layouts: pk3DS TrainerData7.cs / TrainerPoke7.cs. Unlike Gen 6, Gen 7 trainer Pokémon carry
nature, EVs and per-stat IVs.
"""
import json, os, struct, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garc import entry, read_archive, text

BATTLE = {0: "Single", 1: "Double", 2: "Multi"}
GENDER = {0: "random", 1: "male", 2: "female"}
STATS = ["hp", "atk", "def", "spa", "spd", "spe"]


USUM = dict(trdata="a/1/0/6", trpoke="a/1/0/7", T=(110, 111, 60, 118, 40, 101, 92))
SM = dict(trdata="a/1/0/5", trpoke="a/1/0/6", T=(105, 106, 55, 113, 36, 96, 87))


def main(*args):
    sm = args[0] == "--sm"
    romfs, out, *fallback = args[1:] if sm else args
    g = SM if sm else USUM
    roots = [romfs, *fallback]
    trdata = read_archive(roots, g["trdata"])[0]
    trpoke = read_archive(roots, g["trpoke"])[0]
    gt = read_archive(roots, "a/0/3/2")[0]
    personal = read_archive(roots, "a/0/1/7")[0]  # trainer and personal archives are never LZ11-compressed
    T = lambda i: text(entry(gt[i]))
    names, classes, species, moves, items, abilities, natures = (T(i) for i in g["T"])

    def ability(spec, form, slot):
        pi = personal[spec]
        fsi, = struct.unpack_from("<H", pi, 0x1C)
        if form and pi[0x20] > form and fsi:
            pi = personal[fsi + form - 1]
        a = [abilities[x] if x < len(abilities) else f"ability #{x}" for x in pi[0x18:0x1B]]  # Meissa: 255
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
                   "moves": [moves[m] if m < len(moves) else f"move #{m}"
                             for m in struct.unpack_from("<4H", r, 0x18) if m not in (0, 0xFFFF)]}
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

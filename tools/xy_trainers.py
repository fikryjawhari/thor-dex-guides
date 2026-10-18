"""Dump every XY-engine trainer (Eternal X) from a romfs into JSON, names taken from the romfs's own text.

Usage:
  python -I xy_trainers.py <romfs> <out.json> [fallback-romfs ...]

<romfs> is the folder holding a/0/3/8 (trdata), a/0/4/0 (trpoke), a/0/7/4 (English game text) and a/2/1/8
(personal, for ability names). Archives missing from it (a LayeredFS hack folder ships only what it changed) are
read from the fallback folders in order: for a Viola Nerf overlay, its variant's romfs and then a vanilla X dump;
otherwise just the vanilla dump.
Record layouts: pk3DS TrainerData6.cs (XY). There is no nature or EV field in Gen 6 trainer data.
IVs are the IV byte / 8, as pk3DS prints them; that matches Buffel's Eternal X docs (Viola's team: byte 200, IVs 25).
Ability slot 1/2/3 is ability 1/2/hidden; 0 means the game picks 1 or 2, shown as "1 or 2".
"""
import json, os, struct, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garc import entry, read_garc, text

BATTLE = {0: "Single", 1: "Double", 2: "Triple", 3: "Rotation", 4: "Horde"}
GENDER = {0: "random", 1: "male", 2: "female"}


def archive(roots, path):
    for r in roots:
        p = os.path.join(r, path)
        if os.path.exists(p):
            return read_garc(p)
    raise FileNotFoundError(path)


def main(romfs, out, *fallback):
    roots = [romfs, *fallback]
    trdata = archive(roots, "a/0/3/8")
    trpoke = archive(roots, "a/0/4/0")
    gt = archive(roots, "a/0/7/4")
    personal = archive(roots, "a/2/1/8")  # trainer and personal archives are never LZ11-compressed
    T = lambda i: text(entry(gt[i]))
    names, classes, species, moves, items, abilities = T(21), T(20), T(80), T(13), T(96), T(34)

    def ability(spec, form, slot):
        pi = personal[spec]
        if form and pi[0x20] > form and struct.unpack_from("<H", pi, 0x1C)[0]:
            pi = personal[struct.unpack_from("<H", pi, 0x1C)[0] + form - 1]
        a = [abilities[x] for x in pi[0x18:0x1B]]
        return {0: f"{a[0]} or {a[1]}" if a[0] != a[1] else a[0], 1: a[0], 2: a[1], 3: a[2]}.get(slot, slot)
    trainers = []
    for tid, (d, p) in enumerate(zip(trdata, trpoke)):
        fmt, cls, battle, count = d[0], d[1], d[2], d[3]
        bag = [items[i] for i in struct.unpack_from("<4H", d, 4) if i]
        ai = d[0xC]
        prize = struct.unpack_from("<H", d, 0x12)[0] if len(d) >= 0x14 else 0
        team = []
        if count:
            size = len(p) // count
            for k in range(count):
                r = p[k * size:(k + 1) * size]
                iv, pid, level, spec, form = struct.unpack_from("<BBHHH", r, 0)
                mon = {"species": species[spec] if spec < len(species) else spec, "speciesId": spec, "form": form,
                       "level": level, "ivs": iv // 8, "ability": ability(spec, form, pid >> 4), "abilitySlot": pid >> 4,
                       "gender": GENDER.get(pid & 7, pid & 7)}
                q = 8
                if fmt & 2:
                    item, = struct.unpack_from("<H", r, q)
                    mon["item"] = items[item] if item else None
                    q += 2
                if fmt & 1:
                    mon["moves"] = [moves[m] for m in struct.unpack_from("<4H", r, q) if m]
                team.append(mon)
        trainers.append({"id": tid, "name": names[tid] if tid < len(names) else "", "classId": cls,
                         "class": classes[cls] if cls < len(classes) else cls, "battle": BATTLE.get(battle, battle),
                         "items": bag, "ai": ai, "prizeItem": items[prize] if prize else None, "team": team})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(trainers, f, ensure_ascii=False, indent=1)
    print(len(trainers), "trainers ->", out)


if __name__ == "__main__":
    main(*sys.argv[1:])

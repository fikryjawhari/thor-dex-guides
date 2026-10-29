"""Dump a USUM-engine romfs's static encounters (the Totem battles, their SOS allies and other scripted fights) to JSON.

Usage:
  python -I usum_statics.py <romfs> <out.json> [fallback-romfs ...]

Reads a/1/5/9 entry 1 (0x38-byte records), with names from a/0/3/2 and abilities from personal a/0/1/7, falling
back to the later romfs folders for archives the first lacks (as tools/usum_trainers.py). Layout worked out against
Totem Battles.pdf (Photonic Sun 2.38), every Totem and ally matching on species, level, item and moves:
  0x00 u16 species, 0x02 form, 0x03 level, 0x04 u16 held item (0xFFFF none), 0x06 bits 4-5 ability slot
  (1, 2, 3 = hidden), 0x0C 4 x u16 moves, 0x14 nature + 1 (0 = random), 0x15 6 x s8 IVs (-1 random; -4 first =
  three perfect), 0x1B 6 x u8 EVs, 0x25 aura (0 none, 1-15 = stat Atk / Def / SpA / SpD / Spe x stage +1..+3,
  16-18 = all +1..+3), 0x27 ally count, 0x28 / 0x2C u16 ally ids (record = id - 257).
IV and EV order is HP / Atk / Def / SpA / SpD / Spe (Nihilego: SpA 176, Spe 252, Timid).
"""
import json, os, struct, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garc import entry, read_archive, text

sys.stdout.reconfigure(encoding="utf-8")
STATS = ["hp", "atk", "def", "spa", "spd", "spe"]
AURA_STATS = ["atk", "def", "spa", "spd", "spe"]
SIZE, ALLY_BASE = 0x38, 257
T = dict(species=60, moves=118, items=40, abilities=101, natures=92)


def aura(code):
    """[Atk, Def, SpA, SpD, Spe] stages."""
    if not code:
        return None
    if code >= 16:
        return [code - 15] * 5
    stages = [0] * 5
    stages[(code - 1) // 3] = (code - 1) % 3 + 1
    return stages


def main(romfs, out, *fallback):
    roots = [romfs, *fallback]
    static = read_archive(roots, "a/1/5/9")[0][1]
    gt = read_archive(roots, "a/0/3/2")[0]
    personal = read_archive(roots, "a/0/1/7")[0]
    species, moves, items, abilities, natures = (text(entry(gt[T[k]])) for k in ("species", "moves", "items",
                                                                                 "abilities", "natures"))

    def ability(spec, form, slot):
        pi = personal[spec]
        fsi, = struct.unpack_from("<H", pi, 0x1C)
        if form and pi[0x20] > form and fsi:
            pi = personal[fsi + form - 1]
        return abilities[pi[0x18 + slot - 1]] if slot in (1, 2, 3) else None

    rows = []
    for k in range(len(static) // SIZE):
        r = static[k * SIZE:(k + 1) * SIZE]
        spec, form, level, item = struct.unpack_from("<HBBH", r, 0)
        slot = r[6] >> 4 & 3
        ivs = list(struct.unpack_from("<6b", r, 0x15))
        n = r[0x27]
        allies = [a - ALLY_BASE for a in struct.unpack_from("<HxxH", r, 0x28)[:n]]
        rows.append({"index": k, "species": species[spec], "speciesId": spec, "form": form, "level": level,
                     "item": items[item] if item not in (0, 0xFFFF) else None, "abilitySlot": slot,
                     "ability": ability(spec, form, slot), "nature": natures[r[0x14] - 1] if r[0x14] else None,
                     "ivs": dict(zip(STATS, ivs)), "evs": dict(zip(STATS, r[0x1B:0x21])),
                     "aura": aura(r[0x25]) if r[0x25] <= 18 else r[0x25], "allies": allies,
                     "moves": [moves[m] for m in struct.unpack_from("<4H", r, 0x0C) if m]})
    with open(out, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    print(len(rows), "static encounters ->", out)


if __name__ == "__main__":
    main(*sys.argv[1:])

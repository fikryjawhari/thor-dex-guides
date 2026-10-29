"""Make an EV-less copy of a 3DS (Gen 6/7) hack's mod files: no Pokémon grants EVs, no trainer Pokémon has EVs.

Usage:
  python -I ctr_evless.py <game> <mod-title-folder> <out-folder> [fallback-romfs ...]

<game> is xy, oras, sm or usum. <mod-title-folder> is the hack's LayeredFS title folder (the one holding romfs/ and
code.ips, e.g. .../luma/titles/00040000001B5000). The whole folder is copied to <out-folder> (which must not exist
yet) and only the copy is patched; the original mod files are never written. Archives the hack doesn't ship are
copied into the copy's romfs from the fallback romfs folders (the vanilla dumps), then patched, so the copy is a
complete mod on its own.

What changes (in place, same sizes; pk3DS PersonalInfo6/7 and TrainerPoke7 layouts):
- personal: the EV yield bits (u16 at 0x0A, two bits per stat) of every species and form are zeroed, in the
  per-species entries and the combined table the GARC ends with. Pokémon still give experience.
- Gen 7 trainer Pokémon (trpoke): the six EV bytes (0x02-0x07) of every Pokémon are zeroed. Gen 6 trainer data has
  no EVs, so XY / ORAS hacks only get the personal change.
Nothing else is touched: static encounters (the Totem battles, their SOS allies and other scripted fights in
USUM a/1/5/9) keep their EVs, and vitamins and wings still work. The script checks the result byte by byte: every
byte that differs from the original lies in an EV field.
"""
import os, shutil, struct, sys

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garc import spans

GAMES = {
    "xy": dict(personal="a/2/1/8", psize=0x40, trpoke=None),
    "oras": dict(personal="a/1/9/5", psize=0x50, trpoke=None),
    "sm": dict(personal="a/0/1/7", psize=0x54, trpoke="a/1/0/6"),
    "usum": dict(personal="a/0/1/7", psize=0x54, trpoke="a/1/0/7"),
}
YIELD = 0x0A  # u16: HP, Atk, Def, Spe, SpA, SpD yields, two bits each (bits 0-11)
POKE = 0x20  # Gen 7 trainer Pokémon record
EVS = range(2, 8)


def personal(data, psize):
    """Zero every record's EV yield; return (patched bytes, records changed, allowed offsets)."""
    out, changed, allowed = bytearray(data), 0, set()
    for start, end in spans(data):
        if end == start:
            continue
        assert (end - start) % psize == 0, f"personal entry at {start:#x}: {end - start} bytes, not a multiple of {psize:#x}"
        for rec in range(start, end, psize):
            value, = struct.unpack_from("<H", out, rec + YIELD)
            allowed.update((rec + YIELD, rec + YIELD + 1))
            if value & 0xFFF:
                struct.pack_into("<H", out, rec + YIELD, value & ~0xFFF)
                changed += 1
    return bytes(out), changed, allowed


def trpoke(data):
    """Zero every trainer Pokémon's EVs; return (patched bytes, Pokémon changed, allowed offsets)."""
    out, changed, allowed = bytearray(data), 0, set()
    for start, end in spans(data):
        assert (end - start) % POKE == 0, f"trpoke entry at {start:#x}: {end - start} bytes, not a multiple of {POKE:#x}"
        for rec in range(start, end, POKE):
            allowed.update(rec + i for i in EVS)
            if any(out[rec + i] for i in EVS):
                out[rec + 2:rec + 8] = bytes(6)
                changed += 1
    return bytes(out), changed, allowed


def main(game, mod, out, *fallback):
    g = GAMES[game]
    mod, out = os.path.abspath(mod), os.path.abspath(out)
    if not os.path.isdir(os.path.join(mod, "romfs")):
        sys.exit(f"{mod}: no romfs/ folder (give the mod's title folder)")
    if os.path.exists(out):
        sys.exit(f"{out} exists: give a new folder (the copy is made fresh each time)")
    if out == mod or out.startswith(mod + os.sep):
        sys.exit("the copy can't go inside the original mod folder")
    shutil.copytree(mod, out)
    print("copied", mod, "->", out)
    jobs = [(g["personal"], lambda d: personal(d, g["psize"]), "species / forms with an EV yield")]
    if g["trpoke"]:
        jobs.append((g["trpoke"], trpoke, "trainer Pokémon with EVs"))
    for rel, patch, what in jobs:
        dest = os.path.join(out, "romfs", rel)
        if not os.path.exists(dest):
            src = next((os.path.join(root, rel) for root in fallback if os.path.exists(os.path.join(root, rel))), None)
            if src is None:
                sys.exit(f"{rel}: not in the mod or any fallback romfs")
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copyfile(src, dest)
            print(f"{rel}: not shipped by the mod, copied from {src}")
        before = open(dest, "rb").read()
        after, changed, allowed = patch(before)
        stray = [i for i, (a, b) in enumerate(zip(before, after)) if a != b and i not in allowed]
        assert len(before) == len(after) and not stray, f"{rel}: bytes changed outside EV fields: {stray[:5]}"
        again, left, _ = patch(after)
        assert again == after and left == 0, f"{rel}: EVs left after patching"
        with open(dest, "wb") as f:
            f.write(after)
        print(f"{rel}: zeroed {changed} {what}")
    print("done: install", out, "in place of the original mod folder; the original is unchanged")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])

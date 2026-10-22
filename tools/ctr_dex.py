"""Dump a 3DS Pokémon game's dex data (XY / ORAS / SM / USUM engines) from a romfs into one JSON file.

Usage:
  python -I ctr_dex.py <game> <out.json> <romfs> [fallback-romfs ...] [--code code.bin] [--ips code.ips]

<game> is x (XY), oras, moon / sun (SM), usun / umoon (USUM); it picks the archive numbers and the encounter archive.
Archives missing from <romfs> (LayeredFS hacks ship only what they change) are read from the fallback folders in
order, as in xy_trainers.py. The TM list lives in the exefs code: pass the hack's full --code code.bin when it ships
one, or --ips for a code.ips patch, which is applied to the vanilla TM list (PKHeX) at the table's known offset.

Output, names from the romfs's own text (so a hack's renames come through):
  species    every species and form: stats (HP, Atk, Def, SpA, SpD, Spe), types, abilities [1, 2, hidden], catch
             rate, EV yield, held items, gender, egg groups, growth, height/weight, level-up moves [[level, move]]
             (level 0 = on evolution), egg moves, TMs/HMs, tutor moves, evolutions, Mega Evolutions
  moves      type, category, power, accuracy (101 = never misses), PP, priority, hits, flags, description
  abilities  name and description;  tms  TM/HM number to move;  encounters  wild tables per zone (see below)
Record layouts: pk3DS (PersonalInfo*, Learnset6, EggMoves6/7, EvolutionSet6/7, MegaEvolutions, Move6/7,
XYWE/RSWE, Area7/EncounterTable/ZoneData7), pinned in plans/romfs-extraction.md. Vanilla TM and tutor lists: PKHeX.
"""
import json, os, struct, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from garc import entry, mini, read_garc, text

TM6 = [468, 337, 473, 347, 46, 92, 258, 339, 474, 237, 241, 269, 58, 59, 63, 113, 182, 240, 355, 219,
          218, 76, 479, 85, 87, 89, 216, 91, 94, 247, 280, 104, 115, 482, 53, 188, 201, 126, 317, 332,
          259, 263, 488, 156, 213, 168, 490, 496, 497, 315, 211, 411, 412, 206, 503, 374, 451, 507, 510, 511,
          261, 512, 373, 153, 421, 371, 514, 416, 397, 148, 444, 521, 86, 360, 14, 522, 244, 523, 524, 157,
          404, 525, 611, 398, 138, 447, 207, 214, 369, 164, 430, 433, 528, 249, 555, 267, 399, 612, 605, 590]
TM_XY = TM6 + [15, 19, 57, 70, 127]  # TM01-100, HM01-05
TM_AO = TM6[:93] + [290] + TM6[94:] + [15, 19, 57, 70, 127, 249, 291]  # TM94 Secret Power; HM06-07
TM_SM = [526, 337, 473, 347, 46, 92, 258, 339, 474, 237, 241, 269, 58, 59, 63, 113, 182, 240, 355, 219,
         218, 76, 479, 85, 87, 89, 216, 141, 94, 247, 280, 104, 115, 482, 53, 188, 201, 126, 317, 332,
         259, 263, 488, 156, 213, 168, 490, 496, 497, 315, 211, 411, 412, 206, 503, 374, 451, 507, 693, 511,
         261, 512, 373, 153, 421, 371, 684, 416, 397, 694, 444, 521, 86, 360, 14, 19, 244, 523, 524, 157,
         404, 525, 611, 398, 138, 447, 207, 214, 369, 164, 430, 433, 528, 57, 555, 267, 399, 127, 605, 590]
TYPE_TUTORS = [520, 519, 518, 338, 307, 308, 434, 620]  # Grass/Fire/Water Pledge, Frenzy Plant ... Dragon Ascent
TUTORS_AO = [[450, 343, 162, 530, 324, 442, 402, 529, 340, 67, 441, 253, 9, 7, 8],
             [277, 335, 414, 492, 356, 393, 334, 387, 276, 527, 196, 401, 399, 428, 406, 304, 231],
             [20, 173, 282, 235, 257, 272, 215, 366, 143, 220, 202, 409, 355, 264, 351, 352],
             [380, 388, 180, 495, 270, 271, 478, 472, 283, 200, 278, 289, 446, 214, 285]]
TUTORS_USUM = [450, 343, 162, 530, 324, 442, 402, 529, 340, 67, 441, 253, 9, 7, 8,
               277, 335, 414, 492, 356, 393, 334, 387, 276, 527, 196, 401, 428, 406, 304, 231,
               20, 173, 282, 235, 257, 272, 215, 366, 143, 220, 202, 409, 264, 351, 352,
               380, 388, 180, 495, 270, 271, 478, 472, 283, 200, 278, 289, 446, 285,
               477, 502, 432, 710, 707, 675, 673]

# Text file numbers in the English game text (pk3DS TextReference.cs; ability descriptions found by search).
TEXT6 = dict(forms=5, moves=13, movedesc=15, types=17, abilitydesc=33, abilities=34, natures=47, locations=72,
             species=80, items=96, itemdesc=99)
TEXT_AO = dict(forms=5, moves=14, movedesc=16, types=18, abilitydesc=36, abilities=37, natures=51, locations=90,
               species=98, items=114, itemdesc=117)
TEXT_SM = dict(itemdesc=35, items=36, species=55, locations=67, natures=87, abilities=96, abilitydesc=97,
               types=107, movedesc=112, moves=113, forms=114)
TEXT_USUM = dict(itemdesc=39, items=40, species=60, locations=72, natures=92, abilities=101, abilitydesc=102,
                 types=112, movedesc=117, moves=118, forms=119)
GEN6 = dict(gen=6, psize=0x40, personal="a/2/1/8", levelup="a/2/1/4", egg="a/2/1/3", evo="a/2/1/5", mega="a/2/1/6",
            move="a/2/1/2", text="a/0/7/4", enc="a/0/1/2", T=TEXT6, tm=TM_XY, tm_off=0x464796,
            tm_sig=bytes([0xD4, 0, 0xAE, 2, 0xAF, 2, 0xB0, 2]))
GAMES = {
    "x": GEN6,
    "oras": dict(GEN6, psize=0x50, personal="a/1/9/5", levelup="a/1/9/1", egg="a/1/9/0", evo="a/1/9/2",
                 mega="a/1/9/3", move="a/1/8/9", text="a/0/7/3", enc="a/0/1/3", T=TEXT_AO, tm=TM_AO, tm_off=0x4A67EE),
    "moon": dict(gen=7, psize=0x54, personal="a/0/1/7", levelup="a/0/1/3", egg="a/0/1/2", evo="a/0/1/4",
                 mega="a/0/1/5", move="a/0/1/1", text="a/0/3/2", enc="a/0/8/3", zone="a/0/7/7", world="a/0/9/1",
                 T=TEXT_SM, tm=TM_SM, tm_off=None, tm_sig=bytes([3, 0x40, 3, 0x41, 3, 0x42, 3, 0x43, 3]), tm_skip=0),
}
GAMES["sun"] = dict(GAMES["moon"], enc="a/0/8/2")
# Ultra Sun v1.2: TM table at 0x4BD98A, found from Photonic Sun's code.ips (its five TM changes land on TM59/60/67/79/100).
GAMES["usun"] = dict(GAMES["moon"], enc="a/0/8/2", T=TEXT_USUM, tm_off=0x4BD98A, tm_skip=0x22)
GAMES["umoon"] = dict(GAMES["usun"], enc="a/0/8/3")

EVO = ["None", "Friendship", "Friendship (day)", "Friendship (night)", "Level", "Trade", "Trade holding",
       "Trade for Shelmet/Karrablast", "Use item", "Level (Atk > Def)", "Level (Atk = Def)", "Level (Atk < Def)",
       "Level (personality 1)", "Level (personality 2)", "Level (Ninjask)", "Level (Shedinja, free slot)",
       "Beauty", "Use item (male)", "Use item (female)", "Hold item (day)", "Hold item (night)", "Know move",
       "Level with party member", "Level (male)", "Level (female)", "Level at magnetic field", "Level at Moss Rock",
       "Level at Ice Rock", "Level holding 3DS upside down", "Affection and know move type", "Level with party type",
       "Level in rain", "Level (day)", "Level (night)", "Level (female, form 1)", "Unused", "Level (game version)",
       "Level (game version, day)", "Level (game version, night)", "Level at Mount Lanakila", "Level (dusk)",
       "Level in Ultra Space", "Use item in Ultra Space"]
EVO_ITEM = {6, 8, 17, 18, 19, 20, 42}
EVO_MOVE = {21}
EVO_SPECIES = {22}
EVO_TYPE = {29, 30}  # Gen 6 method 30 (Pancham) has no type: its argument is the level
EVO_LEVEL6 = {4, 9, 10, 11, 12, 13, 14, 15, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41}
CATEGORY = ["Status", "Physical", "Special"]
FLAGS = ["contact", "charge", "recharge", "protect", "reflectable", "snatch", "mirror", "punch", "sound",
         "gravity", "defrost", "triple-distance", "heal", "bypass-sub", "no-sky", "animate-ally", "dance"]
STATS = ["hp", "atk", "def", "spa", "spd", "spe"]
GROWTH = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"]
EGG = ["", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral",
       "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"]
SLOTS_XY = [("Grass", 12), ("Yellow Flowers", 12), ("Purple Flowers", 12), ("Red Flowers", 12),
            ("Rough Terrain", 12), ("Surf", 5), ("Rock Smash", 5), ("Old Rod", 3), ("Good Rod", 3),
            ("Super Rod", 3), ("Horde A", 5), ("Horde B", 5), ("Horde C", 5)]
# Gen 6 slot rates (%), checked against Eternal X's Wild Pokemon Locations.pdf; horde tables are picked 60/35/5.
RATES6 = {12: [10] * 9 + [5, 4, 1], 5: [50, 30, 15, 4, 1], 3: [60, 35, 5]}
HORDE = {"Horde A": 60, "Horde B": 35, "Horde C": 5}
SLOTS_AO = [("Grass", 12), ("Tall Grass", 12), ("Swarm", 3), ("Surf", 5), ("Rock Smash", 5), ("Old Rod", 3),
            ("Good Rod", 3), ("Super Rod", 3), ("Horde A", 5), ("Horde B", 5), ("Horde C", 5)]


ODD = []


def name(lst, i, what):
    """lst[i], or a placeholder (logged in ODD) when a hack uses an ID past the end of the game's text."""
    if 0 <= i < len(lst):
        return lst[i]
    ODD.append(f"{what} {i}")
    return f"{what} #{i}"


def bits(data):
    return [i for i in range(len(data) * 8) if data[i >> 3] >> (i & 7) & 1]


def archive(roots, path):
    for r in roots:
        p = os.path.join(r, path)
        if os.path.exists(p):
            return read_garc(p), r
    raise FileNotFoundError(path)


def apply_ips(base, patch, start):
    """Apply the parts of an IPS patch that fall inside a table of bytes that starts at code offset `start`."""
    out = bytearray(base)
    p = 5
    while patch[p:p + 3] != b"EOF":
        off = int.from_bytes(patch[p:p + 3], "big")
        n = int.from_bytes(patch[p + 3:p + 5], "big")
        p += 5
        if n == 0:
            n, fill = int.from_bytes(patch[p:p + 2], "big"), patch[p + 2]
            chunk = bytes([fill]) * n
            p += 3
        else:
            chunk = patch[p:p + n]
            p += n
        for k, b in enumerate(chunk):
            if 0 <= off + k - start < len(out):
                out[off + k - start] = b
    return bytes(out)


def tm_list(g, code, ips):
    """TM/HM moves in personal-bit order (TM01-100, then HMs)."""
    if g["gen"] == 6:
        n_hm = len(g["tm"]) - 100
        # code order: TM01-92, HM01-05, [ORAS: HM06], TM93-100, [ORAS: HM07]
        order = list(range(92)) + list(range(100, 105)) + ([105] if n_hm == 7 else []) + list(range(92, 100)) + \
            ([106] if n_hm == 7 else [])
    else:
        order = list(range(100))
    if code:
        data = open(code, "rb").read()
        off = data.index(g["tm_sig"], 0x400000) + len(g["tm_sig"]) + g.get("tm_skip", 0)
        table = data[off:off + 2 * len(order)]
        src = "code.bin"
    else:
        vanilla = struct.pack(f"<{len(order)}H", *[g["tm"][i] for i in order])
        table = apply_ips(vanilla, open(ips, "rb").read(), g["tm_off"]) if ips else vanilla
        src = "vanilla + code.ips" if ips else "vanilla"
    codes = struct.unpack(f"<{len(order)}H", table)
    out = [0] * len(order)
    for k, i in enumerate(order):
        out[i] = codes[k]
    return out, src


def main(game, out, *args):
    roots, code, ips = [], None, None
    it = iter(args)
    for a in it:
        if a == "--code":
            code = next(it)
        elif a == "--ips":
            ips = next(it)
        else:
            roots.append(a)
    g = GAMES[game]
    used = {}

    def arc(key):
        es, root = archive(roots, g[key])
        used[g[key]] = "hack" if root == roots[0] else root
        return es

    gt = arc("text")
    T = {k: text(entry(gt[i])) for k, i in g["T"].items()}
    species_names, move_names, item_names = T["species"], T["moves"], T["items"]
    type_names = T["types"]
    personal = arc("personal")
    levelup, egg, evo, mega = arc("levelup"), arc("egg"), arc("evo"), arc("mega")
    tms, tm_src = tm_list(g, code, ips)
    # The last named species: XY's text has 78 blank lines after Volcanion, Navy Sapphire's 90 filler lines.
    n_species = max(i for i, n in enumerate(species_names) if n)

    # Form names: line <species> names form 0; after the species lines (and one blank) come forms 1+ of every
    # species with more than one form, in dex order, cosmetic forms included (Unown's 27 "One form" lines).
    form_names, form_line, nxt = T["forms"], {}, n_species + 2
    for sp in range(1, n_species + 1):
        for f in range(1, personal[sp][0x20]):
            form_line[sp, f] = nxt
            nxt += 1

    def form_name(sp, f):
        i = sp if f == 0 else form_line.get((sp, f), -1)
        return form_names[i] if 0 <= i < len(form_names) else ""

    def mv(i):
        return move_names[i] if 0 < i < len(move_names) else None

    species = []
    for sp in range(1, n_species + 1):
        if not species_names[sp]:  # filler lines past the last species (Navy Sapphire's text has 90)
            continue
        base = personal[sp]
        count = max(base[0x20], 1)
        fsi = struct.unpack_from("<H", base, 0x1C)[0]
        for form in range(count):
            pidx = sp if form == 0 or not fsi else fsi + form - 1
            pi = personal[pidx]
            if len(pi) < g["psize"]:
                continue
            hp, atk, df, spe, spa, spd = pi[0:6]
            ev = struct.unpack_from("<H", pi, 0x0A)[0]
            evs = [ev >> s & 3 for s in (0, 2, 4, 8, 10, 6)]  # stored HP Atk Def Spe SpA SpD
            items = [name(item_names, i, "item") if i not in (0, 0xFFFF) else None for i in struct.unpack_from("<3H", pi, 0x0C)]
            abil = [name(T["abilities"], a, "ability") for a in pi[0x18:0x1B]]
            entry_ = {
                "id": sp, "form": form, "pidx": pidx, "name": species_names[sp],
                "formName": form_name(sp, form) if count > 1 else "",
                # A form without its own personal entry (Unown letters, Vivillon patterns) shares the base data.
                **({"cosmetic": 1} if form and pidx == sp else {}),
                "stats": [hp, atk, df, spa, spd, spe], "types": list(dict.fromkeys(type_names[t] for t in pi[6:8])),
                "abilities": abil, "catch": pi[8], "evYield": dict(zip(STATS, evs)),
                "items": items, "gender": pi[0x12], "hatch": pi[0x13], "friendship": pi[0x14],
                "growth": GROWTH[pi[0x15]] if pi[0x15] < 6 else pi[0x15],
                "eggGroups": list(dict.fromkeys(EGG[e] if e < len(EGG) else e for e in pi[0x16:0x18])),
                "baseExp": struct.unpack_from("<H", pi, 0x22)[0],
                "height": struct.unpack_from("<H", pi, 0x24)[0] / 10, "weight": struct.unpack_from("<H", pi, 0x26)[0] / 10,
            }
            # TMs/HMs: bit i = TM i+1 for i < 100, then HMs.
            tmb = bits(pi[0x28:0x38])
            entry_["tm"] = [f"TM{i + 1:02d}" if i < 100 else f"HM{i - 99:02d}" for i in tmb if i < len(tms)]
            tutors = [mv(TYPE_TUTORS[i]) for i in bits(pi[0x38:0x39])]
            if game == "oras":
                for k, (lst, ofs) in enumerate(zip(TUTORS_AO, (0x40, 0x44, 0x48, 0x4C))):
                    tutors += [mv(lst[i]) for i in bits(pi[ofs:ofs + 4]) if i < len(lst)]
            elif game in ("usun", "umoon"):
                tutors += [mv(TUTORS_USUM[i]) for i in bits(pi[0x3C:0x46]) if i < len(TUTORS_USUM)]
            entry_["tutor"] = tutors
            # Level-up: u16 move, u16 level pairs ending in 0xFFFF.
            lu = levelup[pidx] if pidx < len(levelup) else b""
            entry_["levelup"] = [[lv, mv(m)] for m, lv in struct.iter_unpack("<hh", lu[:len(lu) // 4 * 4]) if m > 0]
            # Egg moves: Gen 6 per species only; Gen 7 has a form table index.
            if g["gen"] == 6:
                e = egg[sp] if form == 0 and sp < len(egg) else b""
                n = struct.unpack_from("<H", e, 0)[0] if len(e) >= 2 else 0
                entry_["egg"] = [mv(m) for m in struct.unpack_from(f"<{n}H", e, 2)] if n else []
            else:
                e = egg[sp] if sp < len(egg) else b""
                if form and len(e) >= 4:
                    fti = struct.unpack_from("<H", e, 0)[0]
                    e = egg[fti + form - 1] if fti and fti + form - 1 < len(egg) else b""
                n = struct.unpack_from("<H", e, 2)[0] if len(e) >= 4 else 0
                entry_["egg"] = [mv(m) for m in struct.unpack_from(f"<{n}H", e, 4)] if n else []
            # Evolutions.
            ev_ = evo[pidx] if pidx < len(evo) else b""
            size = 6 if g["gen"] == 6 else 8
            evos = []
            for k in range(0, len(ev_) - size + 1, size):
                method, arg, into = struct.unpack_from("<HHH", ev_, k)
                if not method:
                    continue
                d = {"method": EVO[method] if method < len(EVO) else method, "into": species_names[into]}
                if g["gen"] == 7:
                    if ev_[k + 6] not in (0, 0xFF):
                        d["form"] = ev_[k + 6]
                    if ev_[k + 7]:
                        d["level"] = ev_[k + 7]
                elif method in EVO_LEVEL6:
                    d["level"] = arg
                if method in EVO_ITEM:
                    d["item"] = item_names[arg]
                elif method in EVO_MOVE:
                    d["move"] = mv(arg)
                elif method in EVO_SPECIES:
                    d["with"] = species_names[arg]
                elif method in EVO_TYPE and not (g["gen"] == 6 and method == 30):
                    d["type"] = type_names[arg]
                elif method == 16:
                    d["beauty"] = arg
                evos.append(d)
            entry_["evolutions"] = evos
            if form == 0:
                me = mega[sp] if sp < len(mega) else b""
                megas = []
                for k in range(0, len(me) - 7, 8):
                    mform, method, arg, _ = struct.unpack_from("<4H", me, k)
                    if method == 1:
                        megas.append({"form": mform, "item": item_names[arg]})
                    elif method == 2:
                        megas.append({"form": mform, "move": mv(arg)})
                if megas:
                    entry_["mega"] = megas
            species.append(entry_)

    # Moves: Gen 6 XY has one GARC entry per move; ORAS and Gen 7 pack them in one "WD" mini pack.
    me = arc("move")
    # Never LZ11: a Fairy move's record starts with 0x11 (type 17), which entry() would mistake for compression.
    recs = mini(me[0] if me[0][:2] == b"WD" else entry(me[0]))[1] if len(me) == 1 else me
    moves = []
    for i, r in enumerate(recs):
        if i == 0 or i >= len(move_names):
            continue
        flags = struct.unpack_from("<I", r, 0x1E if g["gen"] == 6 else 0x24)[0]
        moves.append({"id": i, "name": move_names[i], "type": type_names[r[0]], "cat": CATEGORY[r[2]],
                      "bp": r[3], "acc": r[4], "pp": r[5], "pr": struct.unpack("b", r[6:7])[0],
                      "hits": [r[7] & 0xF, r[7] >> 4], "crit": r[0xE], "flinch": r[0xF], "target": r[0x14],
                      "flags": [f for b, f in enumerate(FLAGS) if flags >> b & 1],
                      "desc": T["movedesc"][i] if i < len(T["movedesc"]) else ""})
    abilities = [{"id": i, "name": n, "desc": T["abilitydesc"][i] if i < len(T["abilitydesc"]) else ""}
                 for i, n in enumerate(T["abilities"]) if i]

    encounters = wild(g, game, roots, arc, T, species_names, used)

    data = {"game": game, "archives": used, "tmSource": tm_src,
            "tms": {(f"TM{i + 1:02d}" if i < 100 else f"HM{i - 99:02d}"): mv(m) for i, m in enumerate(tms)},
            "species": species, "moves": moves, "abilities": abilities, "encounters": encounters,
            "items": [{"id": i, "name": n, "desc": T["itemdesc"][i] if i < len(T["itemdesc"]) else ""}
                      for i, n in enumerate(item_names) if i and n and n != "???"]}
    with open(out, "w", encoding="utf-8") as f:
        f.write("{\n")
        parts = []
        for k, v in data.items():
            if isinstance(v, list):
                parts.append(f'"{k}": [\n' + ",\n".join(json.dumps(x, ensure_ascii=False) for x in v) + "\n]")
            else:
                parts.append(f'"{k}": ' + json.dumps(v, ensure_ascii=False))
        f.write(",\n".join(parts) + "\n}\n")
    print(f"{len(species)} species/forms, {len(moves)} moves, {len(abilities)} abilities, "
          f"{sum(len(z['tables']) for z in encounters)} encounter tables in {len(encounters)} zones; "
          f"TMs from {tm_src} -> {out}")
    if ODD:
        print("IDs past the end of the text:", sorted(set(ODD))[:30])


def slot(v):
    return v & 0x7FF, v >> 11


def wild(g, game, roots, arc, T, species_names, used):
    """Wild tables per zone. Gen 6 slots: [species, form, min level, max level, rate %] (no rate for hordes,
    which show five of one Pokémon, or ORAS swarms); Gen 7 tables: levels, day/night, slots [species, form, rate %]
    and the SOS allies. Gen 7 tables carry no method: they're in the game's order (grass areas first, then water)."""
    locs = T["locations"]
    out = []
    ed = arc("enc")
    if g["gen"] == 6:
        # Every entry is one zone: an LZ11 "ZO" mini pack whose file 0 is the 56-byte zone header (location at
        # 0x1C) and file 3 the encounter table after a 0x10 (XY) / 0xE (ORAS) byte header; empty without wild data.
        layout, start, size = (SLOTS_XY, 0x10, 0x178) if game == "x" else (SLOTS_AO, 0xE, 0xF4)
        for z, e in enumerate(ed):
            d = entry(e)
            if d[:2] != b"ZO":
                continue
            files = mini(d)[1]
            enc = files[3] if len(files) > 3 else b""
            if len(enc) < start + size:
                continue
            raw = enc[start:start + size]
            loc = name(locs, files[0][0x1C] + 0x100 * (files[0][0x1D] & 1), "location")
            tables, k = [], 0
            for method, n in layout:
                slots = []
                rates = None if method in HORDE or method == "Swarm" else RATES6[n]
                for j in range(n):
                    sp, form = slot(struct.unpack_from("<H", raw, k * 4)[0])
                    if sp:
                        slots.append([species_names[sp], form, raw[k * 4 + 2], raw[k * 4 + 3]]
                                     + ([rates[j]] if rates else []))
                    k += 1
                if slots:
                    tables.append({"method": method, "slots": slots,
                                   **({"chance": HORDE[method]} if method in HORDE else {})})
            if tables:
                out.append({"zone": z, "location": loc, "tables": tables})
        return out
    # Gen 7: zone -> area through the world data; area i's encounter pack is file 9 + 11i.
    zfiles = arc("zone")
    zone_data, world_data = entry(zfiles[0]), entry(zfiles[1])
    worlds = [mini(entry(w))[1][0] for w in arc("world")]
    area_zones = {}
    for z in range(len(zone_data) // 0x54):
        parent = struct.unpack_from("<i", zone_data, z * 0x54 + 0x1C)[0]
        wi = struct.unpack_from("<H", world_data, z * 2)[0]
        w = worlds[wi]
        mo = struct.unpack_from("<i", w, 8)[0]
        for o in range(mo, len(w) - 3, 4):
            zz, area = struct.unpack_from("<HH", w, o)
            if zz == z:
                area_zones.setdefault(area, []).append((z, locs[parent] if 0 <= parent < len(locs) else ""))
                break
    for area in range(len(ed) // 11):
        md = entry(ed[9 + 11 * area])
        if len(md) < 4:
            continue
        try:
            packs = mini(md)[1]
        except Exception:
            continue
        tables = []
        for ti, t in enumerate(packs):
            if len(t) < 4 + 2 * 0x164:
                continue
            for half, time in ((t[4:4 + 0x164], "day"), (t[0x168:0x168 + 0x164], "night")):
                rates = list(half[2:12])
                rows = [[slot(struct.unpack_from("<I", half, 0xC + (r * 10 + j) * 4)[0]) for j in range(10)]
                        for r in range(8)]
                weather = [slot(struct.unpack_from("<I", half, 0x14C + j * 4)[0]) for j in range(6)]
                slots = [[species_names[sp], form, rates[j]] for j, (sp, form) in enumerate(rows[0]) if sp]
                if not slots:
                    continue
                allies = sorted({species_names[sp] for row in rows[1:] for sp, _ in row if sp})
                # Rows 1-7 are the SOS rows, column j the allies a slot-j caller can bring in
                by_slot = [list(dict.fromkeys((species_names[sp], form) for sp, form in (rows[r][j] for r in range(1, 8)) if sp))
                           for j, (sp, _) in enumerate(rows[0]) if sp]
                tables.append({"table": ti + 1, "time": time, "levels": [half[0], half[1]], "slots": slots,
                               "sos": allies, "sosBy": [[list(a) for a in s] for s in by_slot],
                               "sosWeather": sorted({species_names[sp] for sp, _ in weather if sp})})
        if tables:
            zs = area_zones.get(area, [])
            out.append({"area": area, "zones": [z for z, _ in zs],
                        "location": " / ".join(dict.fromkeys(n for _, n in zs)), "tables": tables})
    return out


if __name__ == "__main__":
    main(*sys.argv[1:])

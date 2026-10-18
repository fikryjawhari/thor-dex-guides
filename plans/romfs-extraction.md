# Plan: Photonic Sun items and Eternal X rival teams from romfs

**Done 2026-10-18.** Results, commands and checks are in `hacks/eternal-x/SOURCES.md` and
`hacks/photonic-sun/SOURCES.md`; the scripts are in `tools/`. Kept as the format reference (archive numbers,
record layouts, text encryption). Found while doing it: trainer and personal archives must be read without the LZ11
check (a record can start with 0x11), Gen 6 trainer IVs are the byte / 8, and four of the Serena/Calem sets are
multi-battle partners, not opponents.

**Goal**
- **Eternal X:** every rival fight (Shauna, Tierno, Trevor, Serena/Calem) with all starter variants, for the
  Rebalanced version. Buffel's docs skip rivals entirely.
- **Photonic Sun:** overworld and hidden item locations for the Rebalanced version. Buffel's docs only cover
  marts (`Vendor Changes.pdf`).

**Assumption to test first.** LayeredFS ships whole files, and only the files a hack changed. So an archive in
the hack folder is complete, and an archive missing from it means that data is vanilla. See Risks: Eternal X's
variant folders may be meant to stack.

## 1. Getting the hack files

Both come from the same Drive folders as the docs (`hacks/eternal-x/SOURCES.md`, `hacks/photonic-sun/SOURCES.md`).
Drive file IDs and sizes were checked on 2026-10-18:

| Hack | Drive file | ID | Size |
| --- | --- | --- | --- |
| Eternal X v2.67 | `Eternal X 2.67.zip` (all variants, presumably) | `1oLGsfL4PS7jggtbiM-qtpP3z67ftRENI` | 110.6 MB |
| Eternal X | `code.bin files/EXcode.bin` (exefs patch) | `1zzR_e1M441mv5amYdhtP6Gdyvwf2K-08` | small |
| Photonic Sun v2.38 | `Photonic Sun/Rebalanced.zip` | `14vNSGKhl9Z80PLhrT2D4ClskfTt9b6Pn` | 440.6 MB |
| Photonic Sun | `Photonic Sun/Standard.zip` (only if Standard is ever wanted) | `1-oh6h4e6EA5hdmdh0ntoEcHS6Kih3eVN` | not checked |

Download each into its own new, empty folder. These are untrusted archives: never run anything inside them,
and pass paths to scripts kept outside them.

```bash
mkdir -p hacks/eternal-x/.src/romfs-dl hacks/photonic-sun/.src/romfs-dl
curl -L "https://drive.usercontent.google.com/download?id=1oLGsfL4PS7jggtbiM-qtpP3z67ftRENI&export=download&confirm=t" -o "hacks/eternal-x/.src/romfs-dl/Eternal X 2.67.zip"
curl -L "https://drive.usercontent.google.com/download?id=14vNSGKhl9Z80PLhrT2D4ClskfTt9b6Pn&export=download&confirm=t" -o hacks/photonic-sun/.src/romfs-dl/Rebalanced.zip
python -I -m zipfile -l "hacks/eternal-x/.src/romfs-dl/Eternal X 2.67.zip" | head -80   # look before extracting
python -I -m zipfile -l hacks/photonic-sun/.src/romfs-dl/Rebalanced.zip | head -80
```

Both folders are covered by the `.src/` gitignore rule. Add the steps to each hack's `SOURCES.md` once they
work.

### Game versions and vanilla dumps

From the install guides (`hacks/eternal-x/.src/*Install Guide.pdf`, `hacks/photonic-sun/.src/*Install Guide.pdf`):

| Hack | Expects | Title ID | Download layout |
| --- | --- | --- | --- |
| Eternal X | Pokémon X **with no title update** (the guides say to uninstall it; the hack breaks with it) | `0004000000055D00` | `Game Files/<variant>/luma/titles/0004000000055D00/` with `romfs/` + `code.ips`; variants: Legal Version, Rebalanced Version, Insanity - Legal, Insanity - Rebalanced; optional "Viola Nerf" `a/` folder to overlay |
| Photonic Sun | Ultra Sun **with the v1.2 title update** (Ultra Moon's update won't work) | `00040000001B5000` | `luma/titles/00040000001B5000/` with `romfs/` + `code.ips`, per variant (Rebalanced, Standard) |

So each Eternal X variant folder is complete on its own (no stacking), and vanilla files for diffing must come
from **base X v1.0** (`a/0/7/4`) and **Ultra Sun v1.2** (`a/0/8/2`). On 3DS a title update carries its own
RomFS that the game reads instead of the cartridge's, so a base-cartridge Ultra Sun dump may not match v1.2.
The user dumps these from their own games: Azahar/Citra "Dump RomFS" (remove the update for X; install v1.2 for
Ultra Sun, and check the dump really reflects it), GodMode9 on a 3DS (mount the title's or the update's RomFS),
or pk3DS Tools → Extract… → .3DS/.CXI on a decrypted dump.

## 2. Format references

Links are pinned to pk3DS `6daaca934ca2284a73ab743bf89c848c57cd9de1` (2026-02-27) and PKHeX
`641c26ba100225f3605e5a44b61b3b16e15a3774` (2026-10-13).

### Archive paths (pk3DS `GARCReference.cs`)

Source: [pk3DS.Core/Game/GARCReference.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/Game/GARCReference.cs).
A file number `NNN` is the romfs path `a/N/N/N`. Language-variant archives add the language index to `NNN`:
English is index 2 (the `CB_Lang` list in
[Main.Designer.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.WinForms/Main.Designer.cs)
is Katakana, Kanji, English, French, Italian, German, Spanish, Korean, then two Chinese for Gen 7 only).

| Data | XY (Eternal X) | USUM (Photonic Sun = Ultra Sun) |
| --- | --- | --- |
| Trainer data (`trdata`) | `a/0/3/8` | `a/1/0/6` |
| Trainer class (`trclass`) | `a/0/3/9` | `a/1/0/5` |
| Trainer Pokémon (`trpoke`) | `a/0/4/0` | `a/1/0/7` |
| Encounter / zone archive (`encdata`) | `a/0/1/2` | `a/0/8/2` (Ultra Sun; Ultra Moon is `a/0/8/3`) |
| Zone data / world data | (n/a) | `a/0/7/7` / `a/0/9/1` |
| Item data (`item`) | `a/2/2/0` | `a/0/1/9` |
| Game text, English (`gametext` + 2) | `a/0/7/4` | `a/0/3/2` |
| Story text, English (`storytext` + 2) | `a/0/8/2` | `a/0/4/2` |

Note the clash: XY's English story text and Ultra Sun's `encdata` are both `a/0/8/2`. Different games, no conflict.

### GARC container

[pk3DS.Core/CTR/GARC.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/CTR/GARC.cs)
(`UnpackGARC`, `GarcUnpack`). The layout is a header (`CRAG` magic, header size, endianness, version
`0x0400` for XY and `0x0600` for SM/USUM, chunk count, data offset, file size), then FATO (`OTAF` in file order:
offsets into FATB), FATB (`BTAF`: per entry a 32-bit vector of sub-entries, each with start, end and length),
and FIMB (data). A file's bytes start at `SubEntry.Start + DataOffset`. Entries starting with `0x11` are LZ11
compressed: [pk3DS.Core/CTR/LZSS.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/CTR/LZSS.cs).
Port this to Python in `tools/garc.py` (about 80 lines). No Python dependency is needed.

### XY trainer records (Eternal X)

[pk3DS.Core/Structures/Gen6/TrainerData6.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/Structures/Gen6/TrainerData6.cs).
File *i* of `trdata` and file *i* of `trpoke` are trainer ID *i*.

`trdata`, XY layout (ORAS widens the first fields to u16):

| Offset | Size | Field |
| --- | --- | --- |
| 0x00 | u8 | Format: bit 0 = has moves, bit 1 = has items |
| 0x01 | u8 | Trainer class |
| 0x02 | u8 | Battle type (single / double / triple / rotation / horde) |
| 0x03 | u8 | Number of Pokémon |
| 0x04 | 4 × u16 | Trainer's bag items |
| 0x0C | u8 | AI flags |
| 0x0D | 3 × u8 | Unknown |
| 0x10 | u8 | Healer |
| 0x11 | u8 | Money rate |
| 0x12 | u16 | Prize item |

`trpoke`: `NumPokemon` records of equal size (record length = file length / count):

| Offset | Size | Field |
| --- | --- | --- |
| 0x00 | u8 | IVs: one value for all six stats, 0 to 255; **IV = value / 8** (pk3DS's trainer dump prints `"IVs: All " + value / 8`, so 255 means 31) |
| 0x01 | u8 | PID byte: ability slot = bits 4 to 7 (0 = default/random, 1, 2, 3 = hidden); gender = bits 0 to 2; bit 3 unknown |
| 0x02 | u16 | Level |
| 0x04 | u16 | Species (national dex number) |
| 0x06 | u16 | Form |
| 0x08 | u16 | Held item, only if Format bit 1 |
| next | 4 × u16 | Moves, only if Format bit 0 (no moves = the game picks level-up moves) |

**There is no nature or EV field in Gen 6 trainer data.** See Risks.

For cross-reference, pk3DS's Gen 6 trainer editor is
[pk3DS.WinForms/Subforms/Gen6/RSTE.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.WinForms/Subforms/Gen6/RSTE.cs).
Its `GetTagsXY()` hard-codes vanilla XY trainer IDs for its randomizer. That's the rival ID list (section 4).
Gen 7 records, not needed here, are `Structures/Gen7/TrainerData7.cs` and `TrainerPoke7.cs`; they do carry
nature and EVs.

### USUM overworld items (Photonic Sun)

pk3DS has **no** overworld item editor for Gen 7.
[pk3DS.WinForms/Subforms/Gen7/Experimental/OWSE7.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.WinForms/Subforms/Gen7/Experimental/OWSE7.cs)
shows the layout and is marked "research only, no set". `encdata` (`a/0/8/2`) holds **11 files per zone**
(zone *i* = files `11i` to `11i+10`): 0 ED, 1 BG, 2 TR, 3 AC, 4 AS, 5 unknown, 6 AE (area environment), 7 ZS (zone
scripts), 8 ZI (zone info scripts), 9 EA (encounter area), 10 BG. ZS and ZI are "mini" packs of compiled scripts
(`Structures/Script.cs`, `Structures/Scripts.cs`). Item balls and hidden items are given by these scripts. Zone
names: [Structures/Gen7/ZoneData7.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/Structures/Gen7/ZoneData7.cs)
(0x54-byte records in `a/0/7/7`; `ParentMap` at 0x1C indexes the location-name text).

No public research decoding item placements from these scripts was found (Project Pokémon, GitHub and web
searches, 2026-10-18). So the plan does not decode them; it diffs instead (section 4).

### Text archives (both games)

[pk3DS.Core/TextFile.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/TextFile.cs)
and [Game/TextReference.cs](https://github.com/kwsch/pk3DS/blob/6daaca934ca2284a73ab743bf89c848c57cd9de1/pk3DS.Core/Game/TextReference.cs).
Each file in the game-text GARC is one text file whose line index is the ID. Lines are encrypted per line:
the key starts at `0x7C89` for line 0 and advances by `0x2983` per line; each u16 is XORed with the key, then the
key rotates left by 3 (`key << 3 | key >> 13`). `0x0010` starts a variable, `0xBE00` / `0xBE01` / `0xBE02` are
scroll / clear / wait, and `0x0000` ends the line. The section data offset is at 0x0C (always 0x10).

| File in game text | XY index | USUM index |
| --- | --- | --- |
| Trainer names (line = trainer ID) | 21 | 110 |
| Trainer classes (line = class ID) | 20 | 111 |
| Location names | 72 | 72 |
| Species / moves / items / abilities / natures | 80 / 13 / 96 / 34 / 47 | 60 / 118 / 40 / 101 / 92 |
| Forms | 5 | 119 |

## 3. ID-to-name tables

Prefer the hack's own text archive when it ships (it has the hack's renames). Otherwise use PKHeX's English
lists, where line *n* = ID *n* and line 0 is the empty or "None" entry, from
[PKHeX.Core/Resources/text/other/en/](https://github.com/kwsch/PKHeX/tree/641c26ba100225f3605e5a44b61b3b16e15a3774/PKHeX.Core/Resources/text/other/en):

| Table | File | Gen 6 / Gen 7 range |
| --- | --- | --- |
| Species | `text_Species_en.txt` | 1 to 721 / 1 to 807 |
| Moves | `text_Moves_en.txt` | 1 to 621 / 1 to 728 |
| Abilities | `text_Abilities_en.txt` | 1 to 191 / 1 to 233 |
| Natures | `text_Natures_en.txt` | 0 to 24 |
| Types | `text_Types_en.txt` | 0 to 17 |
| Items | [`text/items/text_Items_en.txt`](https://github.com/kwsch/PKHeX/blob/641c26ba100225f3605e5a44b61b3b16e15a3774/PKHeX.Core/Resources/text/items/text_Items_en.txt) | shared global item IDs |
| Locations | [`text/locations/gen6/text_xy_00000_en.txt`](https://github.com/kwsch/PKHeX/tree/641c26ba100225f3605e5a44b61b3b16e15a3774/PKHeX.Core/Resources/text/locations/gen6), [`gen7/text_sm_00000_en.txt`](https://github.com/kwsch/PKHeX/tree/641c26ba100225f3605e5a44b61b3b16e15a3774/PKHeX.Core/Resources/text/locations/gen7) | met-location lists |

Forms are not a flat list in PKHeX (they come from its `FormConverter`), so take form names from the game's
Forms text file, or just print `species-form#`.

## 4. Session steps

### Step 0: check the zips (both hacks)

List each zip and record the layout in the hack's `SOURCES.md`. For Eternal X, find out how the variants are
packaged (separate `romfs` per variant, or a base plus overlays); see Risks. Extract only the Rebalanced variant.

### Photonic Sun: items

Evidence so far: the changelog (v2.38 back to release) never mentions overworld or hidden items, and Buffel only
documents marts. That suggests the items are vanilla, but the file check below is what decides it.

1. List which of these exist under the Rebalanced `romfs/`: `a/0/8/2` (encdata, holding zone scripts and
   encounters), `a/0/7/7` (zone data), `a/0/9/1` (world data), and any loose `field`/script folders.
2. **If `a/0/8/2` is absent**, items are vanilla. Use the vanilla Ultra Sun list from
   [Serebii's USUM items page](https://www.serebii.net/ultrasunultramoon/items.shtml), which gives each item's field
   locations, PickUp and shops. Record "verified vanilla by file check: a/0/8/2 not shipped" in `SOURCES.md`, and
   build `hacks/photonic-sun/.src/item-locations.csv` with `source=vanilla`. Overlay `Vendor Changes.pdf` for marts.
3. **If `a/0/8/2` is present** (expected, because the hack changes wild encounters, which live in the same
   archive), the archive's presence proves nothing about items. Unpack the GARC and compare per zone: for each zone
   *i*, compare sub-files 7 (ZS) and 8 (ZI) against a vanilla Ultra Sun `a/0/8/2`.
   - That needs **one vanilla file**: `romfs/a/0/8/2` from an Ultra Sun dump (the user's own cartridge or eShop
     dump; GodMode9 can extract a single romfs file).
   - If every zone's ZS and ZI match vanilla byte for byte, items are vanilla: use Serebii as in step 2 and record
     "verified vanilla: ZS/ZI identical, only EA changed".
   - If some zones differ, list those zones (names via `a/0/7/7` + location text) and report them. Decoding the
     changed scripts is new research: hex-diff one known item ball against Serebii's location for that zone to
     find the give-item command and the item ID u16, then scan the other changed zones for it. Present the
     differing zones to the user before going down that road.
4. If no vanilla dump is available, fall back to Serebii marked "unverified vanilla: changelog lists no item
   changes", and say so plainly in the doc.

### Eternal X: rival teams

1. Unpack `a/0/3/8` (trdata) and `a/0/4/0` (trpoke) from the Rebalanced romfs. If either is missing, the variant
   folders stack on a base (see Risks): find the folder that has them.
2. Parse every trainer into `hacks/eternal-x/.src/trainers-rebalanced.json`: id, class, battle type, items, then per Pokémon
   species, form, level, IV value, ability slot, gender, item, moves.
3. **Rival IDs.** Start from pk3DS's vanilla XY tags (`GetTagsXY()` in `RSTE.cs`, linked in section 2):

   | Rival | Trainer IDs |
   | --- | --- |
   | Serena/Calem, rival has the Fire starter (you picked Grass) | 130, 184, 329, 332, 335, 338, 341, 435, 519, 604, 575, 578, 581, 584, 587, 590, 593, 596, 599, 607 |
   | Serena/Calem, rival has the Water starter (you picked Fire) | 131, 185, 330, 333, 336, 339, 342, 436, 520, 605, 576, 579, 582, 585, 588, 591, 594, 597, 600, 608 |
   | Serena/Calem, rival has the Grass starter (you picked Water) | 132, 186, 331, 334, 337, 340, 343, 437, 521, 606, 577, 580, 583, 586, 589, 592, 595, 598, 601, 609 |
   | Shauna | 321, 322, 323 |
   | Tierno | 324, 438, 573 |
   | Trevor | 325, 439 |

   Twenty IDs per starter is probably 10 fights × 2 genders (Serena and Calem), but that's unconfirmed. The
   friends' lists look short: Bulbapedia shows more Shauna/Tierno fights, including multi battles. So treat
   the tags as a seed and confirm with names and structure:
   - If the hack ships `a/0/7/4`, read text file 21 (names, line = trainer ID) and 20 (classes) for every
     trainer, and take every trainer named Shauna, Tierno, Trevor, Serena or Calem. That's done.
   - If `a/0/7/4` is absent, the text is vanilla. Find the class IDs used by the tagged IDs, list every trainer
     with those classes, and look for more starter-variant sets: consecutive IDs, same levels, and the same team
     except one starter-line slot. Match each to its battle with Bulbapedia's vanilla rival pages (location and
     level order):
     [Shauna](https://bulbapedia.bulbagarden.net/wiki/Shauna_(game)),
     [Tierno](https://bulbapedia.bulbagarden.net/wiki/Tierno_(game)),
     [Trevor](https://bulbapedia.bulbagarden.net/wiki/Trevor_(game)),
     [Calem](https://bulbapedia.bulbagarden.net/wiki/Calem_(game)) and
     [Serena](https://bulbapedia.bulbagarden.net/wiki/Serena_(game)). The changelog anchors a few: Route 19
     (Shauna and Tierno, levels cut by 3), the Poké Ball Factory multi battle (Serena/Calem with Flareon and Mega
     Kangaskhan), and Insanity changes to the rival's team.
   - Or, simplest: pull vanilla `a/0/7/4` from the user's own X dump, the same way as Ultra Sun's `a/0/8/2`.
4. Output every rival fight with all variants to `hacks/eternal-x/.src/rival-teams.md` (or `.csv`): battle, location,
   which starter you picked, then the team.
5. **Prove the parser.** Check 3 or 4 non-rival bosses against `Important Trainer Parties, Rebalanced.pdf`,
   using pk3DS's tagged IDs: Viola 6, Grant 76, Korrina 21, Malva 269, Diantha 276. Compare species, level, item
   and moves with the parsed records. Any mismatch means the offsets or variant folder are wrong: stop and fix
   before writing rival output.

## 5. Risks and open questions

- **Eternal X variants (mostly resolved).** The install guides install each variant's `luma` folder on its own,
  so variants don't stack. A PokeCommunity reply (archived thread, 2026-10-05 snapshot) still says "Playing the
  Rebalanced version and none of the encounters have been changed. The Legal version folder has more files...".
  That may mean Rebalanced simply keeps vanilla encounters, or that its folder is incomplete. If an archive the
  docs say was changed is missing from Rebalanced, flag it rather than assume vanilla.
- **Natures and EVs.** Gen 6 trainer data has no nature or EV field. Natures come from a PID generated at battle
  time. The Gen 6 algorithm was not found in pk3DS or PKHeX; Gen 4/5 used a trainer-ID/species/level seeded PID,
  and Gen 6 is probably similar but that's unconfirmed. Check whether Buffel's PDFs list natures. If they do, take
  natures from the docs, and treat the parsed records as the source for species, levels, items and moves. EVs are
  presumably zero unless `EXcode.bin` patches them in; check the docs and the changelog. The changelog says
  "the Rival's Absol had low IVs", which fits the per-Pokémon IV byte.
- **Trainer IDs may have moved.** pk3DS's tags are for vanilla XY. Buffel could have repointed fights to other
  IDs; the name/structure check in step 3 catches that.
- **USUM item scripts are undocumented.** If ZS/ZI differ from vanilla, decoding them is genuine reverse
  engineering. Section 4 says how to start; keep it time-boxed.
- **Vanilla dumps.** Both diff steps are cleanest with one vanilla file each, dumped by the user from games they own:
  base X v1.0 `a/0/7/4` and Ultra Sun **v1.2** `a/0/8/2` (see "Game versions" above). Ask before the session
  starts. A base-cartridge Ultra Sun file could differ from v1.2: if only that is available, a ZS/ZI mismatch may
  come from the update rather than the hack.
- **Ultra Sun vs Ultra Moon.** Photonic Sun is Ultra Sun, so `encdata` is `a/0/8/2`. Prismatic Moon would be
  `a/0/8/3`.
- **Download size.** The Photonic Sun zip is 440 MB; check disk space first.

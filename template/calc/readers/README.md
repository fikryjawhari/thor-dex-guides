# Save readers

One reader per save family, selected by `cfg.calc.save`. `assemble.py` inlines
`template/calc/readers/<save>.js`; without a reader the page hides Import.
Procedure for adding a family: `.agents/references/calc-save-reader.md`.
Licences and reference-use rules: `tools/calc/README.md` → Licences, oracles and checking a hack.

## Interface

`READERS[family] = (bytes, D) => ({game, party, boxes})` is synchronous, without dependencies or game tables.
`bytes` is a `Uint8Array`; `D` is the guide's data. Return party `[mon]` and boxes `[[mon]]`, retaining empty boxes.
A mon is `{pid, sp, lv, nat, ab?, abs?, it, mv, iv, ev}` in game IDs: nature 0-24, four moves,
six IVs/EVs in calc order HP/Atk/Def/SpA/SpD/Spe. `ab` is an ability ID; `abs` is a species ability slot
(0/1/2, with 2 hidden). Format-specific species/form keys are described below.

The extract writes `D.GID`: `sp` maps to guide species IDs, `mv` to `M` indices, `ab` to `AB` indices,
`it` to item names; `gr` supplies growth rates for boxed levels. The page maps these IDs and skips species
absent from the guide, counting them in the banner. `test.js` is the synthetic reader used by page checks.

Throw `{code: 'wrong' | 'state' | 'unreadable' | 'empty', game?}` for Wrong game, Save state, Unreadable or
No Pokémon yet. The family notes below describe format detection and validation; they record facts, not copied code.

## Families not built yet

| Family | Hacks | Format |
| --- | --- | --- |
| Gen 3 (pokeemerald / pokefirered) | SoulGold (expansion, like EI) | 14 sections in two slots (newest by save index); each Pokémon's 4 blocks ordered by personality value and XOR-encrypted with it. Expansion hacks change the struct per hack. |
| CFRU | Radical Red, Unbound | Gen 3 layout with CFRU's changes (expanded IDs, extra blocks). |
| Gen 4 (Pt / HGSS) | HeartGold Retiled, Renegade Platinum | As `gen4.js`; vanilla-engine hacks differ in the species / form numbers. |
| Gen 6/7 | Meissa Moon, Navy Sapphire | `gen67.js` as is, with the guide's own `GID`. |

The hard part of each new guide is the ID tables, not the reader: the data has no game IDs, so the extract writes
`GID` from the hack's own sources (expansion constants, CFRU tables, the NDS NARCs, the 3DS game files); forms are the
tricky part. Every new guide's extract writes them. References (read only): hzla/Dynamic-Calc-Decomps
`js/savereaders/` (sample saves in `cypress/fixtures/saves/`), PKHeX (open the same save there to check a reader).

Not doing: reading the game's memory while it runs (only an emulator can), writing to saves.

## Reader coverage

| File | Family | Hacks | Checked with |
| --- | --- | --- | --- |
| `test.js` | synthetic JSON | the calc checks' fixtures | `tools/scenarios/calc-import.mjs` |
| `expansion.js` | pokeemerald-expansion (GBA) | Emerald Imperium | hzla's EI 1.3 save (33 Pokémon) and the edge files: EI notes.md → Damage calc → Save import |
| `gen4.js` | HeartGold hg-engine (NDS) | Hardlove Gold | the user's 0.7.0 save (11 Pokémon) and the edge files: Hardlove notes.md → Damage calc → Save import |
| `gen5.js` | B2W2 raw NDS | Blaze Black 2 Redux | PKHeX.Core 26.10.18 generated saves; recipe and limits below |
| `gen67.js` | decrypted XY / ORAS / SM / USUM main | Photonic Sun (USUM); Eternal X (XY) | PKHeX.Core 26.10.18: Photonic's 38 Pokémon in each layout; Eternal X's own 85-Pokémon XY oracle; USUM/XY through the real file picker; wrong-game, checksum, truncation, egg/empty, state and PK6/PK7 hyper-training controls |

## gen5: Black 2 / White 2 (NDS)

Format references (read, not translated): PKHeX tag 26.10.18, commit
`bfe89c74a3f5265805e364b79bc04ad38ebbc5ea`, `PKHeX.Core/Saves/SAV5.cs`, `SAV5B2W2.cs`,
`Saves/Access/SaveBlockAccessor5B2W2.cs`, `SaveBlockAccessor5BW.cs`, `Saves/Blocks/BlockInfoNDS.cs`,
`Saves/Util/SaveUtil.cs`, `PKM/PK5.cs`, `PKM/Util/PokeCrypto.cs`, `PKM/Strings/StringConverter5.cs`
and `StringConverter4Util.cs`. Cross-reference Project Pokemon technical documentation, Generation 5,
**B2W2 Save Structure** (r72) and **BW Save Structure** (r73), accessed 2026-10-29.
These are independent format notes; the implementation contains no PKHeX code.

**Container.** Raw 512 KiB (0x80000), exported by melonDS / DraStic. Also accept a bounded
DeSmuME footer containing `|-DESMUME SAVE-|` after the raw data, as gen4 does. No arbitrary trailers.
Primary B2W2 save starts at 0, backup at 0x26000. Read the primary, as PKHeX does, without silently
recovering older backup data. A damaged primary is unreadable even if backup is good. DLC and unrelated
world blocks are neither imported nor validated. Native emulator states are not battery saves.

**Block CRCs.** CRC16-CCITT: polynomial 0x1021, initial 0xFFFF, MSB first, no final XOR.
Checksum table at 0x25F00: 0x94 bytes, CRC at 0x25FA2 (footer excluded). Each data block has a
u16 update counter after its payload, then a u16 payload CRC; the table holds a second copy of that CRC.
Require table CRC and both copies of every imported block CRC to agree. Validate box names (block 0:
start 0, length 0x3E0, CRC 0x3E2, mirror 0x25F00), all 24 boxes (block b+1: start
`0x400+b*0x1000`, length 0xFF0, CRC start+0xFF2, mirror `0x25F02+b*2`), party (block 26:
start 0x18E00, length 0x534, CRC 0x19336, mirror 0x25F34), and trainer (block 27:
start 0x19400, length 0xB0, CRC 0x194B2, mirror 0x25F36). Party count is u8 at +4 (0..6);
six 220-byte records start at +8. Each box holds 30 consecutive 136-byte records. Trainer game byte
at +0x1F is 23 Black 2 / 22 White 2 (BW1: 21 Black / 20 White); check it as well as the layout.

**Detection.** BW1 uses a different table: 0x23F00, length 0x8C, CRC 0x23F9A, backup at 0x24000,
despite sharing party/box offsets. Its valid table gives `wrong` (BW1). Gen 4 size/magic footers
give `wrong` (Gen 4). PNG, gzip, RASTATE, MELN and DeSmuME state signatures give `state`.
Truncation is `unreadable`, unknown containers/sizes are `wrong`. At the right size all-zero/all-FF
files are `empty`; so is a valid new save with neither usable party nor boxed Pokemon. Box-only saves
work. Broken B2W2 table/party/box/PK5 checksums give `unreadable`, never silently skipped or combined
with backup. No marker distinguishes BB2R from vanilla B2W2: the caller must select the hack.

**PK5 (136 stored / 220 party).** u32 PID at 0, u16 sanity at 4 (zero), u16 checksum at 6.
Payload bytes 8..135: four 32-byte blocks. Checksum is the sum of the 64 decrypted u16 words modulo
65536. Encryption advances `seed = seed*0x41C64E6D + 0x6073 mod 2^32` per word, XORing its high
16 bits; seed starts at the checksum. Party bytes 136..219 restart the stream at PID. Shuffle selector
is `((PID >>> 13) & 31) % 24`; canonical A/B/C/D positions use the gen67 permutation order below.

| Canonical offset | Field |
| --- | --- |
| 0x08 / 0x0A / 0x10 | u16 National Dex species / u16 held item / u32 experience |
| 0x15 | explicit u8 ability ID, not inferred from vanilla species abilities |
| 0x18..0x1D | u8 EVs: HP/Atk/Def/Speed/SpAtk/SpDef |
| 0x28..0x2F | four u16 moves (zero = empty) |
| 0x30..0x33 / 0x34..0x37 | four u8 current PP / PP-Up counts |
| 0x38 | six 5-bit IVs in game order, bit 30 egg, bit 31 nicknamed |
| 0x40 / 0x41 / 0x42 | form in bits 3..7 / explicit nature 0..24 / hidden-ability flag bit 0 |
| 0x48..0x5D | nickname: 11 little-endian 16-bit characters, max 10 visible; zero/FFFF terminates |
| 0x8C | party level, after decrypting the separate extension |

Gen 5 text is Unicode BMP, not Gen 4 character indices. Normalise 0x246D/0x246E to male/female
signs; preserve accents and other Unicode. Return `pid, sp, lv, nat, ab, it, mv, iv, ev`, with
`sp = species:form` and IVs/EVs reordered to calc HP/Atk/Def/SpA/SpD/Spe. Additive `nickname`, `pp`,
`ppUps` fields cover text/PP in the oracle; the calc may ignore them. Validate before omitting eggs
and species-zero slots, and retain all 24 boxes. Box levels use EXP and `D.GID.gr[species:form]`,
falling back to base growth. Missing/invalid growth gives null (like gen4), not an assumed vanilla level.
Never mutate the input.

**GID.** BB2R's `extract/gen5-ids.json` is a factual ID/name/form/growth export from NuGet
PKHeX.Core **26.10.18**, English strings and B2W2 personal data, not executable code. Gen 5 limits:
649 species, 559 moves, 164 abilities, 638 items. Map names after finalisation; all 26 doc move
replacements retain their original slot. Cosmetic forms map to the base, battle forms to distinct P.
Item names map when IT exists; unmapped names are reported. Unknown forms never silently map to base.
Personal data supplies growth/form counts, with Unown's 28 cosmetic letters explicitly enumerated.

## gen4: HeartGold hg-engine (NDS)

References: the hack's own hg-engine source at Hardlove's pin (kumakuma1/hardlove `ee4518c149`:
`include/pokemon.h` (the BoxPokemon blocks and the `DUMMY_P2_*` bit masks), `src/pokemon.c` (ability get / set, the
mint nature, hidden ability on generation), `include/save.h` (the block footer), `include/pokemon_storage_system.h`
(PC_BOX), `include/constants/species.h`), and the save itself. The vanilla parts (two partitions, the footer, PK4
encryption and block order) are the generally documented Gen 4 format (Bulbapedia / Project Pokémon's Gen 4 save and
Pokémon structure pages). Offsets were confirmed on the user's 0.7.0 save: all CRCs and Pokémon checksums hold,
and levels match the party's stored ones. The 0.8.x layout, mints and regional forms still need real-save checks.

**File.** 512 KB (0x80000); a DeSmuME `.dsv` adds its own text footer after it (`|-DESMUME SAVE-|`), accepted. Two
partitions at 0 and 0x40000, each with a **general** block (party, bag, flags) and a **storage** block (PC). hg-engine
enlarges both: general 0xFFA0 bytes at 0, storage 0x1E4FC at 0x10000 (vanilla HGSS: 0xF628, and 0x12310 at 0xF700).
Each block ends in a 16-byte footer: u32 save count, u32 block size, u32 magic 0x20060623, u16 block id (0 general,
1 storage), u16 CRC-16/CCITT (polynomial 0x1021, initial 0xFFFF, MSB first, no final XOR) of the block before the
footer. The reader takes each block from the partition whose copy has a valid CRC and the higher save count, separately
(HGSS may write the general block alone). No footer of this size anywhere: `wrong`, or `empty` for an all-0xFF / all-0
file; footers but no valid general or storage copy: `unreadable`.

**Party and boxes.** General block: u32 party count at 0x94 (more than 6: `unreadable`), six 236-byte party records
at 0x98. Storage block: 30 boxes of 0x1000 bytes (30 × 136-byte records, then 16 bytes of padding), from offset 0;
`NUM_PC_BOXES` is 30 here (the block size fits 30 boxes, and all 900 records decode). Empty slots are encrypted blank
records (species 0), skipped like eggs.

**PK4 record (136 stored, 236 party).** u32 personality at 0, u16 flags at 4, u16 checksum at 6. Bytes 8..135 are four
32-byte blocks A/B/C/D, encrypted with the same LCRNG as gen67 (`seed * 0x41C64E6D + 0x6073`, XOR the high 16 bits)
but seeded with the **checksum**; the party bytes 136..235 are seeded with the **personality**. Block order: selector
`((personality >>> 13) & 31) % 24` in the same 24-entry table as gen67. Checksum: the 16-bit sum of the 64 decrypted
words; a mismatch is a Bad Egg (skipped).

| Canonical record offset | Field |
| --- | --- |
| 0x08 / 0x0A | u16 species (hg-engine's number: Gen 5 on are 50 past the National Dex) / u16 held item |
| 0x10 | u32: experience in bits 0..20, **bit 31 the ability's 9th bit** (`abilityMSB`) |
| 0x15 | u8 ability, low 8 bits: the ability is stored, not derived (`ResetBoxMonAbility` writes the slot's or the hidden one) |
| 0x18..0x1D | six u8 EVs, HP / Atk / Def / Speed / SpAtk / SpDef |
| 0x28..0x2F | four u16 moves |
| 0x38 | u32 six 5-bit IVs in the same order, bit 30 egg, bit 31 nicknamed |
| 0x40 | u8: bit 0 fateful, bits 1-2 gender, **bits 3-7 form** |
| 0x41 | bits 6-7 `DUMMY_P2_1`: bit 6 the hidden-ability flag, bit 7 a crit-evolution counter |
| 0x42 | u16 `DUMMY_P2_2`: bit 0 ability slot swapped (Ability Capsule), **bits 1-5 mint nature + 1** (0 = none), bits 6-11 per-stat IV overrides (defined, unused at this pin) |
| 0x8C (party only) | u8 level |

**Derived values.** Nature: the mint's when set, else personality % 25 (`GetBoxMonNatureCountMints`). Ability: the
stored 9-bit id as `ab` (it already reflects the hidden flag and a capsule). Level: the party's stored level; boxed ones
from experience with `GID.gr` (keyed `species:form`, falling back to form 0), growth order as in expansion's notes
(Medium Fast, Erratic, Fluctuating, Medium Slow, Fast, Slow; `.expRate` in `Species.c`). `sp` is `species:form`; the
hack's `GID.sp` maps the forms (`PokeFormDataTbl.c`: form n of a base is its n-th entry). A Mega is reverted before
saving, so a save never holds one.

Other Gen 4 hacks (Renegade Platinum, HeartGold Retiled) need their own layout row: Platinum's blocks, vanilla HGSS's
sizes, the box count. Add it to `LAYOUT` (make it a list) once a save of that game is in hand to confirm the sizes.

## gen67: decrypted 3DS main saves

Format references:  PKHeX commit `8e3eb3d47bb496746c3eaa9d160329d295a5e2e5`,
`PKHeX.Core/PKM/{PK6,PK7}.cs`, `PKM/Util/PokeCrypto.cs`, `Saves/{SAV6,SAV7,SAV6XY,SAV6AO,SAV7SM,SAV7USUM,SAV_BEEF}.cs`,
`Saves/Access/SaveBlockAccessor{6XY,6AO,7SM,7USUM}.cs`, `Saves/Blocks/BlockInfo3DS.cs`, `Saves/Util/{SaveUtil,Checksums}.cs`,
`Saves/Substructures/Gen{6,7}/MyStatus{6,7}.cs`, `Saves/Encryption/MemeCrypto/MemeCrypto.cs` and `Game/Enums/GameVersion.cs`.
These are read-only format references, not implementation sources.
Background: [Project Pokémon: XY save structure](https://projectpokemon.org/home/docs/gen-6/xy-save-structure-r82/)
describes the cartridge container, **not** the decrypted `main` accepted here. Bulbapedia's
[Generation VI Pokémon structure](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_VI))
is background only; the offsets below were verified against PKHeX and its generated saves.

**File.** Decrypted main files contain one active save, not the cartridge's encrypted dual-save container.
All multibyte integers below are little endian. There is no newest-slot choice in main.

| Layout | Bytes | Party | Box storage | Boxes | Status | Block count | Game byte at Status+4 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| XY | 0x65600 | 0x14200 | 0x22600 | 31 | 0x14000 | 55 | 24 / 25 |
| ORAS | 0x76000 | 0x14200 | 0x33000 | 31 | 0x14000 | 58 | 26 / 27 |
| SM | 0x6BE00 | 0x1400 | 0x4E00 | 32 | 0x1200 | 37 | 30 / 31 |
| USUM | 0x6CC00 | 0x1600 | 0x5200 | 32 | 0x1400 | 39 | 32 / 33 |

Party: six 260-byte records followed by one byte count (0..6), in a 0x61C-byte block. Boxes: 30 records of
232 bytes each, consecutively, with no per-box padding. XY / ORAS party block id is 18, boxes 53 / 56, status 17;
SM / USUM party id is 4, boxes 14, status 3. These numbers come from the save block definitions, not the ROM.

**Footer/checksums.** The last 0x200 bytes start with two u64 secure timestamps, then u32 `0x42454546` at +0x10
(bytes 46 45 45 42, conventionally called BEEF). At +0x14 are block entries: u32 length, u16 id, u16 checksum.
Blocks start at zero, with each subsequent offset rounded up to 0x200 after the previous block's length. The
metadata describes lengths, not data offsets. Gen 6 uses CRC-16/CCITT polynomial 0x1021, initial 0xFFFF, no final
XOR, MSB first. Gen 7 uses reflected CRC-16 polynomial 0xA001, initial 0xFFFF, final XOR 0xFFFF. In Gen 7 block 36,
the 0x80-byte RSA signature at block+0x100 is treated as zero when verifying the CRC: signing happens after CRCs
are written. The reader verifies these CRCs (including that zeroed region), not the RSA signature or secure values.

**PK6/PK7 (232 stored, 260 party).** Unencrypted header: u32 encryption constant at 0, u16 sanity at 4 (zero),
u16 checksum at 6. The 224-byte payload is four 56-byte blocks, A/B/C/D. Decrypt consecutive u16 words by
advancing `seed = (seed * 0x41C64E6D + 0x6073) mod 2^32`, then XORing the word with seed's high 16 bits;
seed starts at the encryption constant, **not** the checksum. Party bytes 232..259 use the same cipher with the
seed restarted at the encryption constant. Shuffle selector is `(constant >>> 13) & 31`; 24..31 repeat 0..7.
Canonical A/B/C/D take their encrypted-block positions from these selectors, in order:
`0123 0132 0213 0312 0231 0321 1023 1032 2013 3012 2031 3021 1203 1302 2103 3102 2301 3201 1230 1320 2130 3120 2310 3210`.
Checksum is the sum of the 112 decrypted payload u16 words modulo 65536; shuffle does not change the sum.

| Canonical record offset (header included) | Field |
| --- | --- |
| 0x08 / 0x0A | u16 national species / u16 held item |
| 0x10 / 0x14 / 0x15 | u32 experience / u8 ability id / low three bits ability number (1,2,4; 4 = hidden slot) |
| 0x18 / 0x1C / 0x1D | u32 personality / u8 nature 0..24 / form in bits 3..7 (gender bits 1..2) |
| 0x1E..0x23 | six u8 EVs, HP/Atk/Def/Speed/SpAtk/SpDef |
| 0x5A..0x61 | four u16 move ids |
| 0x74 | u32 six 5-bit IVs in that same game order, bit 30 egg, bit 31 nickname |
| 0xDE (PK7 only) | hyper-training flags in HP/Atk/Def/SpAtk/SpDef/Speed order; effective IV is 31 when set |
| 0xEC (party only, separately decrypted) | u8 current level |

Box level is derived from experience and the hack's game-data growth rate (`GID.gr`, keyed like species).
The game-data growth order is Medium Fast, Erratic, Fluctuating, Medium Slow, Fast, Slow, as in expansion's notes.
Return `sp` as `species:form` (including form zero), and `ab` as the explicit ability id, not an inferred vanilla
ability. The hidden slot is documented but does not override that id. Eggs and genuinely blank records are omitted;
a nonblank record with bad sanity/checksum is unreadable, not silently dropped. Hyper training affects returned
IVs in Gen 7 only. Gen 6 byte 0xDE is not a hyper-training flag.

The family recognises all four layouts, but a Gen 7 guide accepts only USUM and a Gen 6 guide only XY; thus SM and
ORAS are wrong-game controls, not imports into Photonic Sun / Eternal X. PNG, gzip, RASTATE and Citra CST emulator
state headers give `state`. A damaged known-size save or recognisable truncated main gives `unreadable`;
unrecognised sizes/containers give `wrong`. Valid files with no non-egg party give `empty`.

**Verification.** The PKHeX fixtures in the recipe below cover all 32 shuffle selectors, hacked growth rates,
forms and compared import fields. Outer-CRC-resealed variants check bad Pokémon checksums and party count 7
(`unreadable`), zero/egg-only party (`empty`), a mismatched game byte (`wrong`) and PK7 hyper-trained Attack/Speed
(effective 31 IVs). Input bytes remain unchanged. The real file picker also checks wrong layouts, truncation,
corrupt party/footer and emulator state headers. Run `tools/calc_save_check.mjs` as documented in `tools/README.md`
→ Calc checks and the save check; these format checks do not verify hack battle mechanics.

## expansion: pokeemerald-expansion

Reference: the hack's own expansion source (Emerald Imperium: iriv24/pokeemerald-expansion `2576d0f`, `include/save.h`,
`src/save.c`, `include/pokemon.h`, `src/pokemon.c`, `include/global.h`, `include/pokemon_storage_system.h`).

**File.** 128 KB of flash (0x20000 bytes) as 32 sectors of 4096; mGBA appends a 16-byte real-time-clock footer
(131,088 bytes), so up to 64 extra bytes are accepted. Smaller or larger files are another platform (`wrong`).
Emulator save states are recognised by their start (mGBA's are PNG files, RetroArch's `RASTATE`, gzip for VBA) and give
`state`.

**Sectors.** Each sector: data, then a footer at 0xFF4: `u16 id` (which chunk), `u16 checksum`, `u32 signature`
(0x08012025), `u32 counter` (the save count). Checksum: the 32-bit sum of the data as little-endian words, then
`(sum >> 16) + sum`, low 16 bits. The game sums only the chunk's real size, but it zeroes each sector before writing, so
summing all 4084 bytes before the footer gives the same value and the reader needs no struct sizes.

**Slots.** Stock pokeemerald (and stock expansion): two slots of 14 sectors (0-13, 14-27), 3968 data bytes per sector;
chunk 0 SaveBlock2, 1-4 SaveBlock1, 5-13 PokemonStorage; the newest slot has the higher counter. Emerald Imperium
changes this (`NUM_SECTORS_PER_SLOT 28`, `SECTOR_DATA_SIZE 4084`, one slot): chunk 0 SaveBlock2, 1-16 SaveBlock1, 17-27
PokemonStorage, rotated through sectors 0-27 on every save, all with the same counter. The reader groups valid sectors
by counter and takes the newest group holding a full set of 28 ids, else of 14 (stock sizes). No signed sector at all:
`empty` (a blank file); signed sectors but no complete set: `unreadable`.

**Party and boxes.** Chunks are joined in id order. SaveBlock1: `u8 playerPartyCount` at 0x234 (more than 6:
`unreadable`), 6 × 100-byte `struct Pokemon` at 0x238. PokemonStorage: `u8 currentBox`, then 14 boxes × 30 × 80-byte
`struct BoxPokemon` from offset 4 (the header's `0x0001` comment is wrong: the u32 fields align it to 4; the next field
is at 0x8344 = 4 + 33600). A box Pokémon may straddle two sectors: joining the chunks first makes that harmless.

**BoxPokemon (80 bytes).** 0 `u32 personality`, 4 `u32 otId`, 8 nickname[10], 18 `u8 language:3,
hiddenNatureModifier:5`, 19 flags (`isBadEgg:1, hasSpecies:1, isEgg:1, …`), 20 otName[7], 27 markings, 28 `u16
checksum`, 30 hpLost / shiny, 32-79 the 48-byte secure part. Secure part: XOR each u32 with `personality ^ otId`; then
four 12-byte substructs whose order is `personality % 24` (the standard 24-entry table: substruct type t sits in slot
`ORDER[pid % 24][t]`). Checksum: the 16-bit sum of the decrypted 24 u16 words; a mismatch is a Bad Egg (skipped).
Skipped too: no species, Bad Egg, eggs (flag bit or substruct 3's isEgg).

| Substruct | Fields the reader takes (expansion bitfields) |
| --- | --- |
| 0 | `u16 species:11, teraType:5`; `u16 heldItem:10`; `u32 experience:21` |
| 1 | four `u16 moveN:11` (the top bits are evolution trackers / hyper training) |
| 2 | six `u8` EVs: HP, Atk, Def, **Speed**, SpAtk, SpDef |
| 3 | `u32` at +4: six 5-bit IVs in the same order, then `isEgg:1` (bit 30); `u32` at +8: `abilityNum:2` in bits 29-30 |

The game's stat order is HP, Atk, Def, Speed, SpAtk, SpDef; the calc's is HP, Atk, Def, SpA, SpD, Spe: the reader
reorders IVs and EVs.

**Derived values.**
- Nature: `(personality % 25) ^ hiddenNatureModifier` (`MON_DATA_HIDDEN_NATURE`, what stats use: a mint changes only the
  modifier). Returned as a number; the page names it in the standard order.
- Ability: `abilityNum` returned as `abs` (slot 0 / 1 / 2 = hidden); the page takes the species' ability in that slot,
  falling back to slot 0 when it is empty, as `GetAbilityBySpecies` does. The hack's ability randomiser option is not
  modelled.
- Level: the party's `u8 level` at 84 of `struct Pokemon`; a boxed Pokémon stores only experience, so its level is the
  highest level whose experience is ≤ its own in the species' growth table (`D.GID.gr`: GROWTH_ order medium fast,
  erratic, fluctuating, medium slow, fast, slow; formulas in `src/data/pokemon/experience_tables.h`, level 1 = 1 exp).
  For the sample save's party the experience level equals the stored level for all six.

## PKHeX oracle recipe (Gen 6/7)

Use a disposable .NET 10 console project in `.tmp/pkhex-oracle/` referencing NuGet `PKHeX.Core` **26.10.18**.
If dotnet is not on PATH, this machine has `%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe` (SDK 10.0.403).
Neither the program nor its linked binaries belong in this repository (GPLv3). Use `SAV7USUM`, `SAV7SM`, `SAV6XY`
and `SAV6AO` blank constructors, set Version to US / SN / X / OR, and insert PK7 / PK6 objects through PartyData
and SetBoxSlotAtIndex. Blank constructors leave footer identifiers unset: initialise the footer BEEF marker and
each block's length/id from AllBlocks before Write; let PKHeX write the checksums. Reopen with the matching save
constructor and require ChecksumsValid and PartyCount = 6.

The USUM / SM party is Alolan Raichu, hidden-ability Alolan Ninetales, Sensu Oricorio, Charizard with Charizardite X,
hidden-ability Garchomp and Heat Rotom; XY / ORAS substitute Pikachu, hidden-ability Ninetales and Clefairy for the
first three. Party indices 0..5 use levels 10 + 2*index, natures index%25, PID 0x24680000 + index and encryption
constant 0x10000001 | ((index%32)<<13). Thirty-two boxed specimens cycle Bulbasaur, Caterpie, Illumise, Finneon,
Magikarp and Pikachu: all shuffle selectors (including 24..31 aliases), all six hacked growth rates and
natures 0..24. Slots span boxes 1/2 and the last box's last slot; the other slots remain blank. Moves are Thunderbolt,
Flamethrower, Protect and Toxic. In calc order HP/Atk/Def/SpA/SpD/Spe, IVs are [31,index%32,17,23,9,3],
EVs [4,100,12,152,8,200]. Use PKHeX's CurrentLevel, RefreshAbility, ResetPartyStats and RefreshChecksum.

The input levels are 10..72. Preserve PKHeX's EXP, then calculate
the expected boxed level with PKHeX Experience.GetLevel(EXP, hacked growth rate from dex-rebalanced.json).
Party expectations use Stat_Level. Thus the expected files describe this guide's terms, not vanilla levels.
Export `<name>.expected.json` from those input objects, not the reader or imported page. Resolve numeric move,
ability and item names from Photonic Sun's `.src/dex-rebalanced.json`; spell the selected form names as the guide
does. Include every field checked by calc_save_check and every empty box. USUM files are
`hacks/photonic-sun/.src/saves/pkhex-usum.{sav,expected.json}`; SM/XY/ORAS are
`.tmp/pkhex-oracle/out/pkhex-<game>.{sav,expected.json}`. These are synthetic format fixtures, not legal teams or
evidence that Photonic Sun's mechanics match vanilla. Require all four to reopen with valid checksums.

Eternal X XY fixture: `hacks/eternal-x/.src/saves/pkhex-xy.{sav,expected.json}`,
generated with the same local project and PKHeX pin, but **Eternal X's own** `dex-rebalanced.json` for growth,
stored ability assignments and move/ability/item names. Its source has five growth rates (no Fluctuating);
expected boxed levels use PKHeX Experience.GetLevel with those rates, preserving vanilla-generated EXP.
Six party members include Charizard with each stone, Alakazam/Mewtwo with stones, hidden abilities, female
Meowstic and Heat Rotom. Seventy-nine boxed specimens cover all 32 shuffle selectors, natures 0..24, four stored
Megas with matching stones, all six Rotom forms, both Meowstic/Aegislash forms, all four Pumpkaboo/Gourgeist
sizes, all 20 Vivillon patterns and all five Flabébé colours. Identical cosmetic forms use the guide's retained
Icy Snow / Red names. IVs/EVs follow the recipe above, levels cycle 10..90, items include empty/Leftovers/Life
Orb/Focus Sash/Choice Scarf, and every third specimen has an empty fourth move. Box slots span boxes 1..5 and
box 31 slot 30, with all empty boxes included in expectations. Require valid XY checksums and party count.
Fixtures and the GPL-linked generator remain uncommitted.

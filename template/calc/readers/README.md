# Save readers

One reader per save family: `READERS['<family>'] = (bytes, D) => ({game, party, boxes})` in game ids, or `throw {code:
'wrong' | 'state' | 'unreadable' | 'empty', game}`. The interface, the families and the order they are built in:
`plans/calc-open.md` → Save readers; the procedure: `.agents/references/calc-save-reader.md`. A guide picks its reader
with `cfg.calc.save`; `assemble.py` inlines `readers/<save>.js`. The page maps the game ids through `D.GID` (written by
the hack's extract) and skips a Pokémon whose species the guide lacks, counting it in the banner.

The notes below are the formats as read from each reference (facts, not code: `tools/calc/README.md` → Licences).

## PKHeX oracle recipe (Gen 6/7)

2026-10-28: a disposable .NET 10 console project in `.tmp/pkhex-oracle/` references NuGet `PKHeX.Core` **26.10.18**.
On this machine invoke `%LOCALAPPDATA%\Microsoft\dotnet\dotnet.exe` (SDK 10.0.403); it is not on PATH.
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
evidence that Photonic Sun's mechanics match vanilla. All four reopen with valid checksums; generation log:
`.tmp/calc-save-photonic-sun/oracle.log`.

Eternal X XY fixture (2026-10-28): `hacks/eternal-x/.src/saves/pkhex-xy.{sav,expected.json}`,
generated with the same local project and PKHeX pin, but **Eternal X's own** `dex-rebalanced.json` for growth,
stored ability assignments and move/ability/item names. Its source has five growth rates (no Fluctuating);
expected boxed levels use PKHeX Experience.GetLevel with those rates, preserving vanilla-generated EXP.
Six party members include Charizard with each stone, Alakazam/Mewtwo with stones, hidden abilities, female
Meowstic and Heat Rotom. Seventy-nine boxed specimens cover all 32 shuffle selectors, natures 0..24, four stored
Megas with matching stones, all six Rotom forms, both Meowstic/Aegislash forms, all four Pumpkaboo/Gourgeist
sizes, all 20 Vivillon patterns and all five Flabébé colours. Identical cosmetic forms use the guide's retained
Icy Snow / Red names. IVs/EVs follow the recipe above, levels cycle 10..90, items include empty/Leftovers/Life
Orb/Focus Sash/Choice Scarf, and every third specimen has an empty fourth move. Box slots span boxes 1..5 and
box 31 slot 30, with all empty boxes included in expectations. Reopened XY checksums and party count pass;
generation log: `.tmp/calc-save-eternal-x/oracle.log`. Fixtures and the GPL-linked generator remain uncommitted.

## Reader coverage

| File | Family | Hacks | Checked with |
| --- | --- | --- | --- |
| `test.js` | synthetic JSON | the calc checks' fixtures | `tools/scenarios/calc-import.mjs` |
| `expansion.js` | pokeemerald-expansion (GBA) | Emerald Imperium | hzla's EI 1.3 save (33 Pokémon) and the edge files: EI notes.md → Damage calc → Save import |
| `gen67.js` | decrypted XY / ORAS / SM / USUM main | Photonic Sun (USUM); Eternal X (XY) | PKHeX.Core 26.10.18: Photonic's 38 Pokémon in each layout; Eternal X's own 85-Pokémon XY oracle; USUM/XY through the real file picker; wrong-game, checksum, truncation, egg/empty, state and PK6/PK7 hyper-training controls |

## gen67: decrypted 3DS main saves

Format references read on 2026-10-28: PKHeX commit `8e3eb3d47bb496746c3eaa9d160329d295a5e2e5`,
`PKHeX.Core/PKM/{PK6,PK7}.cs`, `PKM/Util/PokeCrypto.cs`, `Saves/{SAV6,SAV7,SAV6XY,SAV6AO,SAV7SM,SAV7USUM,SAV_BEEF}.cs`,
`Saves/Access/SaveBlockAccessor{6XY,6AO,7SM,7USUM}.cs`, `Saves/Blocks/BlockInfo3DS.cs`, `Saves/Util/{SaveUtil,Checksums}.cs`,
`Saves/Substructures/Gen{6,7}/MyStatus{6,7}.cs`, `Saves/Encryption/MemeCrypto/MemeCrypto.cs` and `Game/Enums/GameVersion.cs`.
These are read-only format references, not implementation sources.
Background: [Project Pokémon: XY save structure](https://projectpokemon.org/home/docs/gen-6/xy-save-structure-r82/)
describes the cartridge container, **not** the decrypted `main` accepted here. Bulbapedia's
[Generation VI Pokémon structure](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_VI))
is an additional reference link; its anti-bot page prevented verification in this session, so the offsets below
were verified against PKHeX and its generated saves instead.

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

**Verification (2026-10-28).** `node tools/calc_save_check.mjs dist/photonic-sun.html
hacks/photonic-sun/.src/saves/pkhex-usum.sav hacks/photonic-sun/.src/saves/pkhex-usum.expected.json` matches all
38 specimens, every compared field. `.tmp/calc-save-photonic-sun/checks.mjs` also compares all four layouts against
their expected files directly, including all 32 shuffle selectors and six hacked growth rates, and asserts no
mutation of input bytes. Against the actual Photonic page, XY / ORAS / SM show Wrong game, truncated (one byte and
half file), corrupted party and damaged footer show Unreadable, Citra's state header shows Save state.
Additional files made with PKHeX, with outer CRCs resealed: bad Pokémon checksum and count 7 are unreadable;
zero party or egg-only party are empty; mismatched game byte is wrong. PK7 hyper-trained Attack and Speed
return effective 31 IVs in calc order. These local variants and logs live in `.tmp/calc-save-photonic-sun/`.
The oracle generator remains local, including its footer initialisation and variant recipes; no GPL-linked code
or binaries are distributed with the guide.

`npm test --prefix tools/calc` passes. `uv run python -I tools/gate.py scenarios --only
calc-import,calc-bridge,calc-smoke --jobs 8` passes 12/12 runs across all four guides (normal/dvkb and viewer sizes).
Hzla remains 118 matches + 28 known differences, zero mismatches/errors. The pre-change data baseline at `62c2e6d`
correctly flags the new GID and two new report lines: all old data, counts and old report lines are unchanged.
Do not recapture that baseline to conceal the intentional additions; the parent must accept this delta.

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

# Save readers

One reader per save family: `READERS['<family>'] = (bytes, D) => ({game, party, boxes})` in game ids, or `throw {code:
'wrong' | 'state' | 'unreadable' | 'empty', game}`. The interface, the families and the order they are built in:
`plans/calc-open.md` → Save readers; the procedure: `.agents/references/calc-save-reader.md`. A guide picks its reader
with `cfg.calc.save`; `assemble.py` inlines `readers/<save>.js`. The page maps the game ids through `D.GID` (written by
the hack's extract) and skips a Pokémon whose species the guide lacks, counting it in the banner.

The notes below are the formats as read from each reference (facts, not code: `tools/calc/README.md` → Licences).

| File | Family | Hacks | Checked with |
| --- | --- | --- | --- |
| `test.js` | synthetic JSON | the calc checks' fixtures | `tools/scenarios/calc-import.mjs` |
| `expansion.js` | pokeemerald-expansion (GBA) | Emerald Imperium | hzla's EI 1.3 save (33 Pokémon) and the edge files: EI notes.md → Damage calc → Save import |

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

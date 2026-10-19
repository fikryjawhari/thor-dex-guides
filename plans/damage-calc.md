# Damage calc and save import (plan, not built)

Goal: the Calc page (`#/calc`, a placeholder today) becomes a damage calc: your Pokémon against a trainer's, with the
16 damage rolls and KO chances. You don't have to type in your team: you load your emulator's save file and the guide
reads your party (and boxes) from it. All you need from a save is species, level, stats (or IVs, EVs and nature, to work
them out), moves, nature, ability and held item.

Scoped 2026-10-19, after looking at PokeDaisy (a GBA emulator with a live companion that reads the game's memory) and
hzla's Dynamic-Calc-Decomps (a web calc with save upload; it replaces the older hzla/Dynamic-Calc). This plan is the
route that works for every platform we have: reading the game while it runs is only possible when you are the
emulator, which Dex Viewer isn't.

## Dynamic-Calc-Decomps (the main reference)

github.com/hzla/Dynamic-Calc-Decomps, active (last push 2026-10-15). What it has that we need:
- `js/savereaders/`: readers for Gen 3 (`savereader_g3`, `savereader_pokeemerald` with Emerald Imperium constants,
  `savereader_radicalred`, `savereader_unbound`), Gen 4/5 (`savereader.js`: Pt, HGSS, BW, BW2) and **Gen 6/7**
  (`savereader_g6`: XY and ORAS; `savereader_g7`: SM and USUM, with block offsets per game). Tests in `calc/test/`
  (Ancestral X, Radical Red, Unbound, Heart and Soul...) and sample saves in `cypress/fixtures/saves/` (EI 1.3).
- `calc/mechanics/`: per-gen damage code (gen12, gen3, gen4, gen56, gen789) plus **per-hack profiles**
  (`calc/mechanics/romhacks/`, hooks like `attackMods` and `finalMods`; Unbound is the only one of ours so far).
  `agent_notes/romhack_modifier_config.md` explains the system.
- `backups/<hack>.js`: its data per hack (imp, hardlove, navy, unbound, radred*, bb2redux1-4, pt/platredux, pspm, ax...),
  useful to cross-check our trainer sets and the move/species names a save maps to.

## Licenses (what we may reuse)

| Project | License | Use |
| --- | --- | --- |
| `@smogon/calc` (smogon/damage-calc) | MIT | The damage engine, one generation per hack. We can inline the built bundle in the template. Keep its notice. |
| hzla/Dynamic-Calc-Decomps | none at the top (all rights reserved); its `calc/` folder carries the MIT license of the Smogon calc it forks | Unclear for hzla's own changes inside `calc/` (the hack profiles); the save readers outside it are not licensed. Decided 2026-10-20: we don't ask. Read it to learn the formats, write the layouts down as notes (offsets, struct fields, steps), and write our own readers from those notes and PKHeX's documentation, in our own structure. Never translate his code line by line. Credit it in the guide footer as a reference. |
| PokeDaisy | GPLv3 | Read only. Copying code or its generated tables would make our guides GPL. |
| PKHeX | GPLv3 | Read only. Its format code is the best reference for the Gen 6/7 (3DS) saves. Also good for checking our reader: open the same save in PKHeX and compare. |

Save formats, offsets and the encryption scheme are facts, not code, so reimplementing them is fine.

## The formula

The basic formula has been the same since Gen 3. What changed between generations is the modifiers around it, and
the calc has to match the engine each hack runs on:
- Gen 5 onwards: modifiers are chained as fractions of 4096, with rounding at fixed steps (the rolls differ by ±1 from Gen 3/4).
- Critical hit ×2 until Gen 5, ×1.5 from Gen 6. Crit rates changed too.
- Gen 6: Fairy type and changes to the type chart (Steel lost its Ghost and Dark resistances). Gen 7: Z-moves. Gen 8: Dynamax.
- Terrains, weather rules, abilities and items each have per-gen differences that `@smogon/calc` already models.

So the engine is "which gen, plus this hack's switches", not one formula:

| Hack | Engine | Mechanics |
| --- | --- | --- |
| Emerald Imperium, SoulGold | pokeemerald-expansion | Modern by default, set per hack in `include/config/battle.h` (`B_CRIT_MULTIPLIER`, `B_..._GEN` switches). Read the hack's own copy. |
| Radical Red, Unbound | CFRU (public source) | Mostly Gen 7/8. Its `damage_calc.c` and the hack's docs settle the rest. |
| Hardlove Gold, HeartGold Retiled, Renegade Platinum | Gen 4 engine | Gen 4, plus whatever the hack backported (Fairy, physical/special split is native). |
| Blaze Black 2 Redux | Gen 5 engine | Gen 5, plus its changes (Fairy etc. per its docs). |
| Photonic Sun, Eternal X, Meissa Moon, Navy Sapphire | Gen 6/7 engine | Gen 6 (X/Y, ORAS bases) or 7 (S/M, US/UM bases). |

**How to check a hack's mechanics:**
1. Source code where there is some (expansion hacks, CFRU, Hardlove's repo): read the damage function and the config switches.
2. The hack's docs and changelog (Fairy type added, crit rules, changed abilities and items).
3. What Dynamic-Calc-Decomps does for that hack: its mechanics gen (`dmgGen`, `types` URL parameters per hack) and any
   profile under `calc/mechanics/romhacks/profiles/`. It is the calc the hacks' own players use.
4. **In-game test**, the final check: make a save state before a trainer battle, use one known move, note the damage, reload
   and repeat a few times. Every result has to fall inside the calc's 16 rolls. Do one physical and one special move, one crit, and
   one move boosted by weather or an ability. Cheap to do, and it catches what the source reading missed.

Per hack, the result goes in `hack.json`: `cfg.calc = {gen, overrides}`, plus a line in `notes.md` saying how it was checked.

## Save reading

One reader per save family, in the template (`dex.js`), picked by `cfg.calc.save`:

| Family | Hacks | Notes |
| --- | --- | --- |
| Gen 3 (pokeemerald / pokefirered layout) | Emerald Imperium, SoulGold | 14 sections in two save slots (newest by save index); each Pokémon's 4 data blocks are in an order set by its personality value and XOR-encrypted with it. Expansion hacks change the Pokémon struct (bigger species, move and ability IDs, hidden ability bit) per hack. |
| CFRU | Radical Red, Unbound | Gen 3 layout with CFRU's changes (expanded IDs, extra save blocks). Check with Dynamic-Calc's reader and the sheets. |
| Gen 4 (Pt / HGSS) | Hardlove Gold, HeartGold Retiled, Renegade Platinum | Two save slots, newest by a save counter; Pokémon blocks shuffled by personality value and encrypted with a PRNG (LCRNG 0x41C64E6D / 0x6073) seeded by the checksum. Party stats are stored separately (encrypted with the PV). |
| Gen 5 (BW2) | Blaze Black 2 Redux | Same Pokémon encryption as Gen 4; different block offsets and checksum table. |
| Gen 6/7 (XY / ORAS / SM / USUM) | Photonic Sun, Eternal X, Meissa Moon, Navy Sapphire | 232-byte PK6 / PK7 structs, same shuffle and LCRNG scheme. Azahar keeps the save as a plain (not console-encrypted) file, identified by size (XY 0x65600, ORAS 0x76000, SM 0x6BE00, USUM 0x6CC00) and a `BEEF` footer; party block at 0x14200 (XY/ORAS), 0x1400 (SM), 0x1600 (USUM). Dynamic-Calc-Decomps reads all four (tested on Ancestral X); PKHeX is the second reference. |

The 3DS readers are no harder than the Gen 4/5 ones: same encryption idea, known offsets, and we only need the party
and boxes. Dynamic-Calc-Decomps proves it works for a 3DS hack.

**The hard part is per hack, not per format: the ID tables.** A save stores numbers (species 1234, move 811, item 402),
and our `data.json` has no game IDs: Pokémon have our own `id`, and moves, abilities and items are in our own order. Each
hack's extract step has to write a table from game ID to our entry (`data.json` → e.g. `SID`, `MID`, `AID`, `IID`).
They come from the same sources as the rest of the data: source constants (expansion, Hardlove), CFRU tables, the NDS
NARCs and the 3DS game files we already extract (Photonic Sun and Eternal X use the game data as the source).
Forms are the tricky part (each family stores the form in its own way).

Testing: a save per hack (the user's own, in `hacks/<hack>/.src/`, git-ignored) and its expected party written out by
hand or taken from PKHeX. A small check under `tools/` loads the built guide headless, imports the save and compares.

## Getting the save into the guide

- Outside the viewer: `<input type="file" accept=".sav,.dsv,.bin,main">`, read with `FileReader`. Works in any phone browser.
- In Dex Viewer: Android WebView ignores file inputs unless the app handles `onShowFileChooser`. The app repo needs that
  (a small change, using Android's document picker), plus remembering the last folder. **Check first** whether the
  viewer already handles it.
- Later: "reload from the same file" with one button (the viewer keeps a persistent URI permission), so re-importing after
  each save is one tap.
- What's imported is kept in localStorage under a new `cfg.ls` key (adding a key is fine; never rename the existing ones).

## UI (mockup first, at 260 × 316)

- Calc page: your side (pick from imported party / boxes, or the Pokémon pages' stat calculator) against the foe side
  (pick a trainer and one of their Pokémon, filled from `TR` sets, which already list the hack's calc sets).
- Each of your moves shows the damage range in % and the KO chance (e.g. "38–45%, 3HKO"); a tap swaps attacker and defender.
- Field options kept small: weather, terrain, stat stages, burn, crit, reflect / light screen.
- From a trainer card: "calc against" each of the trainer's Pokémon. Later, a matchup line on trainer cards (your best move
  against each of theirs), which is the static version of PokeDaisy's battle suggestions.

## Order

1. Bundle `@smogon/calc` into the template (size check: guides stay one file; see how much of its data we can drop, since
   our `data.json` provides species and moves). Calc page with manual entry, EI first. In-game test of EI's mechanics.
2. Gen 3 save reader and EI's ID tables, tested against the user's save.
3. Viewer file picker (app repo).
4. Gen 4 reader (Hardlove Gold), then Gen 5 (BB2R) when its guide is built.
5. Gen 6/7 reader (Photonic Sun, then Eternal X).
6. Each new guide's extract step writes its ID tables and `cfg.calc` from then on (add it to CLAUDE.md → Making a new guide and the skill).

## Not doing

- Reading the game while it runs (memory). Only possible inside the emulator; RetroArch's network commands might allow
  it for some cores, but that's untested and doesn't help with Azahar. Revisit if a save import turns out to be too slow in practice.
- Writing to saves.

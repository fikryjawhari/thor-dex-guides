# Blaze Black 2 Redux guide: plan

The goal and acceptance are in the session prompt (PROGRESS.md → Current status links here while it's open). Source
inventory: `plans/blaze-black-2-redux-sources.md` (the audit). Mode mockup: `plans/blaze-black-2-redux-modes.html`.

## Decisions (user, 2026-10-29)
- **Version: Complete, EVless patch** (v1.4.1). Complete abilities / types / stats; EVless rules wherever the docs
  give them (no EVs for the player; any wild held item or vendor the EVless patch changes). Mode: **Challenge**.
- **Normal / Easy: option A.** Challenge teams on every card. The 31 bosses with a separate Easy/Normal team get a
  collapsed "Normal team" line (Normal levels, Easy note); the 3 Challenge-only battles (Grunt #884, Victini
  Guardian, Lance) get a "Challenge only" tag. No mode toggle, no new saved state.
- **Caps** (the doc's spoiler-free Challenge table; "New to Redux" rows named from the spoiler cap guide):
  Cheren 14, Roxie 21, (new) 23, Burgh 29, (new) 33, Subway Masters 36, Elesa 38, Charles 39, Rood 41, Clay 45,
  (new) 53, Skyla 55, (new) 56, Hugh 58, (new) 62, Drayden 64, Marlon 68, Ghetsis 72, (new) 76, Elite Four et al 78
  (Iris 79 as the doc's Challenge table gives it). Only these battles make splits. Optional bosses (○) sit in the
  split they fall in with the cap the doc gives them; other trainers' "+X" notes don't make caps.
- **Walkthrough:** the cap battles are the spine; each split's locations in Trainer Changes order with the docs'
  items, wild areas, gifts and legendaries; postgame last in the standard postgame box. Every trainer is kept
  (optional, postgame, rematches, E4 round two, Challenge-only), flagged.
- **Challenge level bug** (hzla's model): a generic trainer's Pokémon shows the boosted level in game, but its stats
  are those of the unboosted level; the damage formula uses the displayed level. Data keeps both (displayed level
  and stat level). **The guide always shows the in-game (displayed) level** (Cheren's Munchlax is Lv 14, not 13+1),
  so nobody caps themselves wrong. The calc computes stats at the stat level and uses the displayed level in the
  damage formula; how the calc shows the difference at 260 px is an initial choice in the calc unit, reviewed by the
  user at the end. Oracle: hzla's BB2R Challenge calc.
- **Trainer IVs / natures:** from hzla's BB2R calc data (fixed per Pokémon: natures were rolled when the game was
  made; important trainers 30/31 IVs, others 0). The docs stay the authority for species / moves / items / abilities
  / levels; hzla differences show as "hzla says ..." only where they disagree, listed in notes.md.
- **Encounter tracker:** one slot per route / area. Seasons are sections of the area (like Photonic Sun's grass
  patches), never extra slots. Floors: follow Emerald Imperium's rule. Gifts / statics: the template's standard.
  Initial choice; the user may tweak at review.
- **Gaps** (vanilla items, HMs, Curtis / Yancy trades): fill from RomHackDex, then Bulbapedia if needed, marked.
- **Doc oddities:** ranch egg = random from the 17 species (not Audino). Banette "Grab", Noctowl's berry-as-ability,
  Jellicent's ability-as-item, Klinklang's empty item, Shadow Claw "PP 70 -> 90" (read as Power 90): settle from
  hzla's data where it has them, else "Doc says ..." and notes.md. Docs beat RomHackDex on moves (154 field
  conflicts), shown where they differ.
- **Battle formats:** doubles / triples / tag use the calc's modes; rotation counts as singles, tagged.
- **Save:** standard B2W2 `.sav` (melonDS, DraStic export). No real save yet: a PKHeX.Core-generated `.sav` is the
  oracle (`template/calc/readers/README.md` → PKHeX oracle recipe), plus hzla's BW2 fixtures if any. A real save
  later is a follow-up check, not a blocker.

## Units (in order; each an agent in its own worktree from this branch, ending at a commit)
1. Source audit. Done (`d9c1eef`).
2. Scaffold (`tools/new_hack.py`). Done (`bab429a`).
3. **hzla source** (Sol): fetch hzla's BB2R calc data (trainer sets with IVs / natures, the Challenge level fields)
   and any BW2 save fixtures, pinned, into `.src/`; SOURCES.md; convert with `tools/calcbackup.js`; report coverage
   and its agreement with Trainer Changes. Check what the EVless patch changes in the docs.
4. **Shared Drayano / RomHackDex code + dex tab** (Opus): `tools/drayano.py` (doc parsers, typo fixes with a
   record), a RomHackDex reader, then `extract/dex.py`: species (stats from Pokemon Changes, else RomHackDex),
   Complete abilities / types, moves (docs over moves.json), abilities, type chart, evolutions. Designed so Renegade
   Platinum reuses it.
5. **Locations** (Sol): wild areas, seasons, grottos, gifts, statics, legendaries, trades, RomHackDex cross-check.
6. **Items** (Sol): Item Changes, TMs, marts, pickup, EVless changes, gaps.
7. **Trainers + caps** (Sol): every battle record, Challenge teams, Normal team lines, formats, level pairs, hzla
   IVs / natures, trainer keys seeded, cap list applied.
8. **Walkthrough** (Sol): the spine above, `tools/tabs_check.py` agreement.
9. **Calc + save** (Opus for the reader if Sol stalls): Gen 5 profile, level bug, fixtures, hzla oracle, field
   review with the user, GID tables, Gen 5 reader + PKHeX comparison.
10. Player's-eye review (Thor frame, phone preview), then the sceptic audit (Haiku medium).
Units 5-7 can run in parallel after 4 (different extract files; data.json is rebuilt on merge).

# Blaze Black 2 Redux docs

Fetched 2026-10-18 (v1.4.1) from the Documentation folder in
[Drayano's Google Drive](https://drive.google.com/drive/folders/0B-zmEVN0Mas6Q3lLbDJDaWNyaVU?resourcekey=0-o98YGOlDJ0JVXXjxoHprIA)
→ "(2022, B2W2) Blaze Black 2 Redux / Volt White 2 Redux" → Documentation.

| File | Contents |
| --- | --- |
| `Pokemon Changes.txt` | Stats, types, abilities, moves for every changed Pokémon |
| `Trainer Changes.txt` | All trainers, with separate Challenge Mode teams for important ones |
| `Wild Area Changes.txt` | Wild encounters by area |
| `Item Changes.txt` | Full item locations, marts, TMs, pickup table |
| `Move Changes.txt`, `Type Changes.txt`, `Evolution Changes.txt`, `Trade Changes.txt` | Changes |
| `Gift Pokemon.txt`, `Legendary Locations.txt`, `Important NPCs.txt` | Gifts, legendaries, NPCs |
| `Important and General Information.txt`, `Important Nuzlocke Information.txt`, `Redux FAQ.txt` | Rules, EVless modes, FAQ |
| `Changelog.txt`, `Credits.txt`, `Known Bugs and Hardware Information.txt`, `Patching Guide.txt`, `Useful Action Replay Codes.txt` | Reference |
| `romhackdex/pokedex/` | [RomHackDex](https://romhackdex.net/blaze-black-2-volt-white-2-redux/) pages for all 649 Pokémon: types, abilities, evolutions, level-up, TM, tutor and egg moves, wild locations. **Base stats are wrong for changed species** (see below) |
| `romhackdex/moves.json` | All 604 moves with type, category, power, accuracy, PP, priority and description (`tools/rhd_moves.py`) |
| `romhackdex/locations/`, `items/`, `abilities/index.html`, `types/` | 81 locations, 557 items, ability descriptions, type chart |

## Re-fetch

Source updates: `watch.json` (`uv run python -I tools/check_updates.py blaze-black-2-redux`).

```bash
python -I tools/drive_ls.py 1wVz7qTdZh8kn0Du9bmMKuXlrQRBeF01d hacks/blaze-black-2-redux/.src
D=hacks/blaze-black-2-redux/.src/romhackdex; S=blaze-black-2-volt-white-2-redux
python -I tools/mirror.py https://romhackdex.net/$S/ $D 4000 team-builder compare /moves/ /abilities/
for p in moves abilities; do mkdir -p $D/$p; curl -sL --compressed -A 'Mozilla/5.0' https://romhackdex.net/$S/$p/ -o $D/$p/index.html; done
python -I tools/rhd_moves.py $D/moves/index.html $S $D/moves.json
```

hzla inputs (checked 2026-10-29). Each SHA below is the last commit touching that file, not a floating branch.
The Decomps files also form a coherent snapshot at `403c2669f03f19db43b9f0f7f342c062f9519475` (2026-10-28).
Downloads are untrusted, read-only reference data/code; execute only the backup conversion through the existing
`tools/calcbackup.js`. Do not copy hzla's unlicensed implementation into the guide.

```bash
D=hacks/blaze-black-2-redux/.src/repos/hzla
mkdir -p "$D"
R=https://raw.githubusercontent.com/hzla/Dynamic-Calc-Decomps
while read -r sha path local; do
  curl -fsSL "$R/$sha/$path" -o "$D/$local"
done <<'HZLA'
403c2669f03f19db43b9f0f7f342c062f9519475 backups/bb2redux1-4.js backups__bb2redux1-4.js
403c2669f03f19db43b9f0f7f342c062f9519475 backups/title_to_backup_mappings.js backups__title_to_backup_mappings.js
da8a53328db5551f653c69401e52bcf4c048a8fc backups/trainer_orders/bb2redux1-4.js backups__trainer_orders__bb2redux1-4.js
403c2669f03f19db43b9f0f7f342c062f9519475 js/initialize.js js__initialize.js
403c2669f03f19db43b9f0f7f342c062f9519475 js/shared_controls.js js__shared_controls.js
bebf34ffe8827089b355e7534df48ba95eecc3c6 js/calc_ui/menu_settings.js js__calc_ui__menu_settings.js
fd5690e724028d825af6cf3dbe0de0b5b7f14070 calc/pokemon.js calc__pokemon.js
be7cc6c0649e00046a2bbb6d421554b89b704520 calc/mechanics/gen56.js calc__mechanics__gen56.js
7e57aec6c3ac54abab297b340c2cc893f387d622 calc/mechanics/util.js calc__mechanics__util.js
403c2669f03f19db43b9f0f7f342c062f9519475 index.html index.html
HZLA
node tools/calcbackup.js "$D/backups__bb2redux1-4.js" "$D/bb2redux1-4.json"
# Older live site's backup, for comparison only, not the selected trainer input:
curl -fsSL https://raw.githubusercontent.com/hzla/Dynamic-Calc/43d9b376867e21fb3789e890832f7ea5f1363c15/backups/bb2redux1-4.js -o "$D/legacy-bb2redux1-4.js"
node tools/calcbackup.js "$D/legacy-bb2redux1-4.js" "$D/legacy-bb2redux1-4.json"
# Official archive: inspect its directory/text only; do not run the bundled patchers.
curl -fsSL 'https://drive.usercontent.google.com/download?id=1AhsdffDiz872gwIB-kiGKutDAsM-GWvS&export=download&confirm=t' -o "$D/v1.4.1_BlazeBlack2Redux.zip"
curl -fsSL 'https://drive.usercontent.google.com/download?id=1J4wNraZ9YHG2UMmaYDi1_wHL7btUrIfG&export=download&confirm=t' -o "$D/RedditPostWithMoreInfo.txt"
```

Complete. No walkthrough beyond vanilla.

**Two versions.** Redux ships a *Complete* patch (extra ability, type and moveset changes) and a *Classic* patch
without them (`Important and General Information.txt`); `Pokemon Changes.txt` gives both ("Ability (Complete)" /
"Ability (Classic)", "Base Stats (Complete)"). RomHackDex shows the Complete abilities.

**RomHackDex vs the docs (2026-10-19):** `python -I -X utf8 tools/drayano_check.py "hacks/blaze-black-2-redux/.src/Pokemon Changes.txt" hacks/blaze-black-2-redux/.src/romhackdex/pokedex`
compares the 642 species the doc changes. Level-up lists agree (the 74 differences are doc typos: "Faint Attack",
"Sliver Wind", "Autonomize", "Twinneedle"). **Base stats don't: 188 changed species show vanilla stats on
RomHackDex** (Venusaur 82/83/100 for the doc's 87/85/103, Golurk 89/124/80 for 115/125/85). So take stats from
`Pokemon Changes.txt` for every species it lists (it gives full new stats) and RomHackDex for the rest (unchanged,
so vanilla is right). Trainers (with Challenge Mode teams), wild tables and items come from the docs.


## Files

Doc layout (2026-10-29 source audit; the full report is in git history, `plans/blaze-black-2-redux-sources.md`): the
text docs have a boxed title / version banner, `====` sections and optional `~~~~` sub-sections; keep source line
numbers in reports. Trainer Changes: 468 battle records in 68 sections, both modes, partners and variants together.
Wild Area Changes: positional two-column tables (one missing `Lv.`, one missing header colon), 20 grotto rarity lists.
Item Changes: hidden markers, quantities, arrows and difficulty stars matter; seven mode footnotes are not items.
Move Changes: numeric changes, prose effects and footnotes are different kinds. Type Changes says "Vanilla" for
Classic (not a third patch). Gift Pokemon: choices are not simultaneous gifts; Stantler lacks a Level field.
Legendary Locations: quest prose, no rates. Trade Changes: Phione says Route 7, its NPC prose Humilau. Useful Action
Replay Codes: built in since v1.1.0, not item / encounter data. Changelog: v1.0.0 to v1.4.1 (24/06/23).

The docs and RomHackDex inputs are listed at the top. Additional research inputs, all under `.src/`:

| File | Contents |
| --- | --- |
| `repos/hzla/backups__bb2redux1-4.js`, `bb2redux1-4.json` | [hzla/Dynamic-Calc-Decomps](https://github.com/hzla/Dynamic-Calc-Decomps) `backups/bb2redux1-4.js` at `403c2669f03f19db43b9f0f7f342c062f9519475`; JSON made by `tools/calcbackup.js`. Selected IV/nature input; includes both Normal and Challenge rosters, not an EVless-specific export |
| `repos/hzla/backups__title_to_backup_mappings.js`, `index.html`, `js__initialize.js` | Title, backup and mode routing at `403c2669f03f19db43b9f0f7f342c062f9519475`; exact paths and curl commands above |
| `repos/hzla/backups__trainer_orders__bb2redux1-4.js` | Trainer navigation, `backups/trainer_orders/bb2redux1-4.js` at `da8a53328db5551f653c69401e52bcf4c048a8fc` (2026-06-26); not a separate sets file |
| `repos/hzla/js__shared_controls.js`, `js__calc_ui__menu_settings.js` | UI/set-to-calculator reference at `403c2669f03f19db43b9f0f7f342c062f9519475` and `bebf34ffe8827089b355e7534df48ba95eecc3c6`, respectively |
| `repos/hzla/calc__pokemon.js`, `calc__mechanics__gen56.js`, `calc__mechanics__util.js` | Read-only level-bug references, at `fd5690e724028d825af6cf3dbe0de0b5b7f14070`, `be7cc6c0649e00046a2bbb6d421554b89b704520`, `7e57aec6c3ac54abab297b340c2cc893f387d622`, respectively |
| `repos/hzla/legacy-bb2redux1-4.js`, `legacy-bb2redux1-4.json` | [hzla/Dynamic-Calc](https://github.com/hzla/Dynamic-Calc) `backups/bb2redux1-4.js` at its last change, `43d9b376867e21fb3789e890832f7ea5f1363c15` (2026-01-26); 2,939 sets / 888 trainer IDs. Older comparison, not interchangeable with the selected Decomps backup |
| `repos/hzla/v1.4.1_BlazeBlack2Redux.zip`, `RedditPostWithMoreInfo.txt` | Official Redux folder archive and accompanying post, checked for missing EVless docs. ZIP SHA256 `ed87c03a3e828ff2223b33badaaee1c1349fc086c0775ff9b6472322834c5a22`; Drive files are mutable, so a changed hash needs a new audit |

### hzla title, mode and save fixtures

`backupFiles["Blaze Black 2/Volt White 2 Redux"]` selects `bb2redux1-4`; the `bb2redux` query alias selects that
title. `bb2` is the **original** Blaze Black 2 / Volt White 2, and `bw2` is vanilla: neither is Redux. Challenge
uses the **same** Redux backup with `challengeMode=true`, not another backup. The reference route is
`https://hzla.github.io/Dynamic-Calc-Decomps/?data=bb2redux&gen=8&challengeMode=true&types=6`.
The legacy site also advertises this query; its older opaque `data=11c4eeca5a94f8edf413` option is not the pinned
1.4 input. `setGameSettings` (`js/initialize.js`, lines 1269-1285 at the pin above) chooses game/damage generation
5, type chart 6 and critical generation 5. `gen=8` in the URL is not permission to use Gen VIII damage mechanics.

Checked repository trees: Decomps `403c2669f03f19db43b9f0f7f342c062f9519475`, Dynamic-Calc
`42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74`, Dynamic-Calc-Backup
`bae5fc423b755c6b8fd3d564d350da38cc3513df`, Dynamic-Calc-Staging
`e2dfbb1a7d300a8391ab0ac2ec51660686d14bcb`. **No B2W2/BB2R save or save-paste fixture found** in their
`cypress/fixtures/` or other save-named paths. Decomps fixtures are Emerald Imperium, Renegade Platinum and
Heart & Soul; its fixtures directory last changed at `bebf34ffe8827089b355e7534df48ba95eecc3c6` (2026-10-02).
No unrelated save was downloaded or relabelled as BW2. The PKHeX-generated B2W2 oracle is still needed.

### Challenge level model (static source inspection, not executed)

- A set's `level` is its **stat level**. `diff` is the integer `+N`; displayed/formula level is `level + diff`.
  Example: `tr_id=764`, Munchlax, `level=13`, `diff=1`: display Lv 14, compute stats at 13. Do not subtract the
  offset a second time, or use the Normal roster's Munchlax (trainer 156, stat level 11).
- `getChallengeModeLevelDiff` (`js/initialize.js`, lines 107-120), `formatChallengeModeLevelDiff` (122-134) and
  `refreshChallengeModeLevelBadge` (136-149), at `403c2669f03f19db43b9f0f7f342c062f9519475`, read the set offset
  and display a separate `(+N)` badge. `noCh=true` or the string `"true"` suppresses it. They accept the aliases
  `challengeLevelAdjustment`, `challengeLevelDelta`, `challengeModeLevelAdjustment`, `challengeModeLevelDelta`,
  `levelAdjustment`, `levelDelta`, then `diff`, taking the first finite numeric value; this backup uses `diff`.
- The set-selection handler (`js/shared_controls.js`, lines 2920-2924) puts `set.level` in the level control.
  `createPokemon` (3410-3490, 3573-3590), at that file's pin above, passes the stat-level control/set value to the
  Pokémon constructor. `Pokemon.prototype.calcStat` (`calc/pokemon.js`, lines 328-330, at its pin above) uses
  that unchanged level for every stat, including HP and Speed, with the supplied IVs, nature and EVs.
- `calculateBWXY` (`calc/mechanics/gen56.js`, lines 862-896, at `be7cc6c0649e00046a2bbb6d421554b89b704520`)
  adds the offset **only at the base-damage formula call**. It requires Challenge enabled, a current trainer set,
  a trainer attacker and no `noCh` suppression. In the UI it identifies the opposing attacker from the right set
  selector's species/level; without jQuery it falls back to equality of the attacker and current-set levels.
  Defender stats and player attacks are not generally level-boosted by this branch.
- **Fixed-damage caveat:** `calculateBWXY` calls its fixed-damage helper much earlier (lines 279-289).
  `handleFixedDamageMoves` (`calc/mechanics/util.js`, lines 914-926, at
  `7e57aec6c3ac54abab297b340c2cc893f387d622`) returns `attacker.level` for Night Shade and Seismic Toss.
  Thus the pinned oracle uses the **unboosted/stat level** for these moves, not `level + diff`. Dragon Rage is
  40 and Sonic Boom 20. This describes hzla's implementation, not an independently verified cartridge result.

The existing `tools/calc/hzla_compare.mjs` supports Dynamic-Calc and Decomps, but hard-pins Decomps to
`ff6c3e339e276e6b4e8e44db58750b6534bc26aa` and legacy to `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74`.
It defaults Challenge off and does not provide `get_current_in` for the new offset branch. Merely enabling
`settings.challengeMode` is therefore **not sufficient**: the calc unit needs an explicit reviewed pin/current-set
adapter and direction-sensitive tests, including fixed damage and equal-level player/trainer cases. No comparator
or engine changes belong to this source unit; no downloaded engine was executed here.

### Set coverage and quick trainer comparison

Selected JSON: `backup_data.formatted_sets[species][label]`; 639 species buckets, **2,970 sets / 889 distinct
`tr_id`s**. There are 998 distinct labels after stripping `Lvl N` because labels can vary within a party; do not
count labels as trainers. All 2,970 `(tr_id, sub_index)` pairs are unique: use these for stable party identity,
not array order or a guessed suffix (`Cheren2` is a different roster, not necessarily a rematch).

All 2,970 sets have six explicit IVs (`hp/at/df/sa/sd/sp`), a valid nature (all 25 nature names occur), ability,
item, integer level, `diff`, `noCh`, `tr_id`, `sub_index`, and a nonempty moves list. **No nature is missing.**
`item="None"` explicitly means no item (1,866 sets), not missing input. Seventeen moves lists have fewer than
four entries; other lists may use `-----` for an empty slot. Every record has `evs={"df":0}`; omitted EV stats
are zero, not a reason to apply the constructor's IV defaults. No EVless-specific trainer sets were found.

All six IVs are equal within each set, but **the assumption that every non-boss has 0 is false in this export**:

| IV value | Sets (all six IVs at this value) | Individual IV fields |
| --- | ---: | ---: |
| 31 | 1,202 | 7,212 |
| 30 | 117 | 702 |
| 0 | 832 | 4,992 |
| 3 | 18 | 108 |
| 6 | 206 | 1,236 |
| 12 | 251 | 1,506 |
| 18 | 49 | 294 |
| 24 | 293 | 1,758 |
| 29 | 2 | 12 |

The 819 other-IV sets must retain their exported IVs. `diff` distribution by set: 0=650, 1=119, 2=673,
3=304, 4=690, 5=528, 7=6; every `noCh` is false, including sets whose `diff` is zero.
These are counts of the whole export, including Normal teams, partners and unused/placeholder trainer records,
not a claim that all 889 trainer IDs are battles documented for the guide.

Throwaway audit: `.tmp/bb2r-hzla/audit.py`, reports in that directory (not committed). This is a deliberately
conservative, **partial** name+location join, not the production trainer mapper. It excludes explicitly Normal
teams and aggregate parties over six (rival alternatives, paired/partner blocks), deduplicates three repeated
Victory Road parties, normalises case/punctuation/class wording and Hugh/Rival labels, splits combined location
headings, and refuses multiple candidates. It does not join on species to force a match. Of 415 retained doc
team blocks, **216 match a unique trainer ID**, 20 are ambiguous and 179 have no strict name+location match.
Boss mode variants, absent locations, numbered grunts and mismatched trainer names need the trainers unit's
explicit mapping. A missing quick-join result is not proof of missing IV/nature data.

Matched teams contain 722 doc Pokémon and 723 hzla sets. Pairing by species within these teams (normalising
Nidoran gender and hzla's malformed apostrophe in Farfetch'd) pairs **711/722** doc Pokémon; eleven remain
unpaired. Among those 711: displayed level agrees **673**, complete unordered moves list **670**, item **711**,
ability **669**. Level comparison adds each doc section's Challenge offset unless its team is explicitly marked
Challenge, and adds hzla's `diff`; contextual subsection offsets and identities still need production review.
Move order is ignored, duplicates retained, `-----` omitted; spelling errors such as Faint/Feint are deliberately
counted as disagreements, not silently repaired. Thus these are conservative raw-doc comparison counts.

Ten example disagreements (doc -> hzla; doc line numbers refer to the fetched v1.4.1 text):

| Trainer / place / Pokémon | Disagreement |
| --- | --- |
| Scientist Clarke, Castelia Sewers, Magnemite (683; trainer 463) | Sturdy -> Analytic; Flash Cannon / Discharge / Light Screen / Thunderbolt -> Magic Coat / Gyro Ball / Signal Beam / Lock-On |
| Nurse Mariah, Desert Resort, Bayleef (977; 670) | Ability Screne Grace -> Serene Grace |
| Nurse Mariah, Desert Resort, Bayleef (977; 670) | Ancient Power -> Spit Up in the moves |
| Ranger Anja, Desert Resort, Ponyta (982; 667) | Charm -> Raging Fury |
| Backpacker Tami, Desert Resort, Archen (1014; 664) | Dragon Breath -> Spit Up |
| Psychic Perry, Relic Castle, Xatu (1028; 511) | Miracle Eye -> Quick Attack |
| Psychic Dua, Relic Castle, Kirlia (1035; 510) | Magic Leaf -> Magical Leaf |
| Psychic Low, Relic Castle, Spoink (1038; 512) | Mirror Coat / Mirror Coat / Amnesia / Future Sight -> Future Sight / Mirror Coat / Amnesia / Future Sight |
| Ranger Serenity, Lostlorn Forest, Mudkip (1176; 297) | Avalanche -> empty slot (`-----`) |
| Ranger Richard, Route 6, Sealeo (1376; 292) | Brine -> Super Fang |

Docs remain authoritative for species, displayed levels, moves, items and abilities per the agreed plan; hzla
supplies IVs/natures and an offset model. Record these as disagreements, not automatic replacements.

### Five doc oddities

- **Banette "Grab"** (Trainer Changes 1856): hzla has **Snatch**, with Trick / Snatch / Sucker Punch / Shadow
  Claw, **Frisk**, no item; stat level 44, `diff=3`, nature Hasty, six IVs 6. Important identity trap: this set is
  `tr_id=555`, labelled **Psychic Bryce - Celestial Tower**, while the doc calls the five-Pokémon team Micki.
  hzla's **Micki** (`tr_id=553`) instead has the doc's following Reuniclus team. Do not blindly attach natures by
  those names: reconcile both rosters (the doc appears to swap Bryce/Micki).
- **Noctowl [Wacan Berry] @Colbur Berry** (2488): Winona, `tr_id=836`; **Tinted Lens, Colbur Berry**, same four
  moves, stat/display level 58, `diff=0`. Wacan Berry is not an ability.
- **Jellicent [Water Absorb] @Water Absorb** (3572): Challenge Shauntal round two, `tr_id=777`; **Cursed Body,
  Leftovers**, same Scald / Hex / Will-O-Wisp / Recover, level 92, `diff=0`. Both the documented ability and item
  disagree, not just the item; keep that distinction visible when recording the agreed doc oddity resolution.
- **Postgame Colress Klinklang @:** (3705): `tr_id=813`, **Levitate, Air Balloon**; Gear Grind / Shift Gear /
  Wild Charge / **Earthquake**, not the doc's Superpower. Set level 88, `diff=4` (hzla formula/display 92), another
  level disagreement with the doc's unqualified postgame Lv 88. It is not an empty-item export.
- **Shadow Claw**: `backup_data.moves["Shadow Claw"]` is Ghost / Physical, **90 power, 100 accuracy, 15 PP**,
  priority 0 (`e_id=43`). This supports reading Move Changes' `PP 70 -> 90` as a **power** typo, not 90 PP.

### EVless versus regular Complete: what is actually documented

- **Patch choice:** Patching Guide 34-37 says to apply the additional Complete EVless patch to an already
  Complete-patched ROM, not directly to vanilla. Classic is a different secondary patch; EVless does not mean
  choosing Classic abilities/types/stats.
- **Player EVs:** no player EVs is the chosen EVless rule (the user, 2026-10-29; notes.md → Sources and rules). The fetched
  Important/General Information, Patching Guide, Item Changes, Changelog and FAQ do **not** specify the exact
  implementation (battle EV yield, vitamins, wings, caps, resets, or behaviour of an existing EV-trained save).
  Do not promote that missing detail to a claim that every method/item is removed. The guide should calculate
  the selected player's EVs as zero; a patch/ROM audit would be needed to certify all acquisition mechanisms.
- **Trainer EVs:** Trainer Changes 22-25 says trainer EVs cannot be set in Gen V; this is not a new EVless benefit.
  hzla supplies zero EVs in every set. No separate EVless trainer roster or changed trainer EV spread is documented.
- **Wild held items:** Item Changes 7-11 explicitly removes **all wild held items except Latios, Latias and
  Giratina**, in both Complete EVless and Classic EVless. This is the one explicitly enumerated EVless gameplay
  delta in these docs; do not import regular Complete wild-item tables unchanged.
- **Vendors:** Item Changes 63-72 removes BP prize vendors and the Castelia Cafe artist **on Challenge mode**, until
  sighting Suicune on Route 3 in the postgame. This applies to regular Complete Challenge too, not only EVless.
  Important/General Information's difficulty section corroborates the BP vendor restriction.
- **Other items/shops/mechanics:** no EVless-specific change to vitamins, EV-training NPCs, pickup, ground items,
  prices, marts, TMs, trainer held items, IVs, natures or the Challenge bug is enumerated in those five docs. The
  shared item list still contains vitamins and Macho Brace; that is **not proof** they work or spawn in EVless.
  Keep ordinary item/vendor changes separate from confirmed EVless overrides; unspecified does not mean verified
  unchanged. There is no evidence here for further exact vendor/inventory substitutions.

Checked the public Documentation listing (19 files), its parent Redux folder
`1xGtMbYtM2JIsTGg9PeRBvr5NBghBUqJ5`, the official Black 2 v1.4.1 ZIP's text files/directory, and the accompanying
Reddit post. **No separate EVless document found or left unfetched in those listings.** The archive contains the
Complete EVless and Classic EVless secondary patches but no EVless readme. The Drive docs contain an extra
Important Nuzlocke Information file absent from that ZIP; it too supplies no EVless implementation details.
The Volt White 2 archive and Older Versions folder were not exhaustively audited; a truly exhaustive patch
delta is still missing, and cannot be inferred from the short public documentation.


## Game files

TODO: document game files.


## Source checks

2026-10-29: pinned hzla's BB2R backups, title routing and Challenge implementation by each file's last-touch SHA;
converted both backups with `node tools/calcbackup.js`; counted all 2,970 selected sets and checked their IVs,
natures, offsets and unique party keys; verified all ten downloaded Decomps files against the Git blob IDs in
the coherent snapshot's tree; performed the conservative 216-trainer doc join above; inspected the
official Drive/ZIP for EVless documentation and four hzla repository trees for BW2 save fixtures. Research
scripts/reports are in `.tmp/bb2r-hzla/`, raw inputs/JSON in `.src/repos/hzla/`; neither is committed. No oracle
engine executed; runtime damage checks, the full trainer identity map and exhaustive EVless patch validation
are follow-ups for their respective units, not established by this audit.

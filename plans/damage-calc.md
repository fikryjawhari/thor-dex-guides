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

## UI spec (decided with the user, 2026-10-24, from the mockup)

The mockup is `plans/damage-calc-mockup/` (`build.py` → `dist/damage-calc-mock.html`, wrap with the Thor frame, `shot.mjs`
takes headless screenshots). It samples Emerald Imperium's `data.json`; its damage maths is a rough stand-in, so the build
replaces `damage()` / `koOf()` with `@smogon/calc` and keeps everything else. The mockup is the visual reference: when the
spec and the mockup differ, ask. Delete the mockup folder when the build is merged (the plan is deleted then too).

### Principles
- **One screen at 260 × 316.** The trainer bar, the trainer's team strip, both Pokémon cards and all four moves of the
  attacker fit in one viewport (292 px tall in the mockup; the viewer's real height is a few px less than the CSS height,
  so keep at least 12 px of slack). Everything else lives in an expander, a sheet or further up the page. Don't add a row
  to that block without removing one.
- **Nothing to open for the common edits.** Level, current HP, nature, ability, item, status, IVs, EVs, stat stages, Mega,
  move swaps, move power / type / hit count and crit are all in the main view. Sheets are only for choosing from a long
  list: importing, adding or finding a Pokémon, choosing a trainer, choosing a move.
- **Space is the budget.** Spend it on the matchup, not on labels. No heading, no explanatory text (CLAUDE.md), no divider
  lines. Names truncate with an ellipsis in the main block and show in full where there's room (trainer sheet, expanders).
- **Never overflow 260 px** (`documentElement.scrollWidth === 260`), in normal and `dvkb` mode, with every expander open.

### Layout (route `#/calc`, below 480 px wide)
Top to bottom, one column beside the 44 px rail:
1. **Import banner** (only after an import attempt; × dismisses it). Green: `Imported <file>` + counts + how many edited
   Pokémon were reset. Red: the error (below).
2. **Mine card.** A 3-button strip `↻ Import · + New · ⌕ Find` (28 px high), then one grid of all the user's Pokémon:
   party first, then the boxes in box order, then custom sets (dashed border). Six columns, cells the same size as the
   trainer's team strip (a 16 px sprite with the level under it). No dividers or headings between the groups. The selected
   Pokémon has the accent outline. **The grid scrolls inside its card** (touch scroll, no scrollbar chrome needed): in one
   column it is at most 4 rows (136 px) tall, so the page never grows with the box and, at the top of the page, the box, the
   whole foe bar and the foe's full team strip are on screen together; fewer Pokémon make it shorter.
   With nothing imported and no custom sets the grid is replaced by two buttons, `Import save` and `New Pokémon`.
3. **Foe card.** One bar: `‹` previous trainer, the trainer's name (one line, truncated; tap opens the trainer sheet), `›`
   next trainer, then `Cap [n]` when the trainer's levels are relative to the cap. Under it the strip of the trainer's
   Pokémon (up to six, level under each sprite); tapping one selects it as the foe.
4. **Two Pokémon cards**, Mine above Foe. Line 1: name (`*` unsaved changes, `•` saved changes), `M` (only if the species
   has a Mega in the data), `Edit ▾`, `Spe n` (the effective Speed with stages and paralysis, `↑` / `↓` when staged, accent
   colour on the faster side). Line 2: `Lv [n]`, `HP [now]/max`. **Tapping a card (not its controls) makes it the attacker**:
   the attacker has the accent outline and its moves are the list below. There is no ATK / DEF button.
5. **The attacker's four move slots.** Each is a row with the move name (truncated), damage in HP per hit (bold; accent
   colour on the best row, which also gets the accent bar), the % of max HP for all hits, and the KO text. A type-colour dot
   replaces the type tag. Empty slots show `+ Move`. Status moves are muted, show `—`, and keep a 26 px minimum height.
6. **Field** (collapsed, one summary line) and nothing else.
7. **Rail jump buttons** (the `.rjump` pair under the tabs): see Scroll stops.

From 480 px (the default first-open window, 480 × 392, up to 537 × 424 and 832 × 424; each column is then at least the
208 px of the minimum layout) the Mine card and Foe card sit in two columns of equal height, the two Pokémon cards in two
columns, and **both** movesets are shown, each under its own card and each calculated against the other Pokémon (like
the Showdown calc). Move rows are 31 px in both columns, status and empty slots included, so the rows line up. **The page
never scrolls at these widths:** the page is exactly the window's height; the Mine card's grid takes whatever height is left
and scrolls inside itself (about 5 rows at 424 px), so the matchup, both movesets and the Field row are always all on screen
(an open Edit dropdown or Field box can push past that: then the page scrolls). Tapping a card still moves the accent
outline but changes nothing else there. Extra features for these widths come after the minimum size is final.

### Controls, in every state
**Mine grid.** Tap a cell: select it (also from a box). `↻ Import` opens the file picker (below). `+ New` opens the species
picker, then makes a custom set (level = the foe's cap if there is one, else 50; nature Hardy; first ability; no item; the
last four level-up moves at that level; IVs 31, EVs 0), selects it and opens its Edit dropdown. `⌕ Find` opens the same
picker over every Pokémon in the party, boxes and custom sets. The level under each cell is the current (edited) level.

**Trainer bar.** `‹ ›` step through the trainers in the guide's own order (the Trainers page order, after the starter /
player-variant filter) and select their first Pokémon; disabled at either end. Tap the name: the trainer sheet.
**Cap box:** shows the effective cap (the trainer's default in grey, the user's own value in the accent colour; the
same `TCAP` store as the trainer card's "Your level" box, so both always agree). The spinner and the number pad's
`+` / `−` step from the shown value. Clearing the box (Clear, Done) returns to the default. Not shown for trainers whose
levels are fixed (set per Pokémon with its `Lv` box instead). A trainer with relative levels and no cap anywhere shows an
empty, red-bordered box and the results say `Set the level cap`.

**Trainer sheet** (full window, `‹ Done`): `Find trainer…` (typed search), then the selected trainer in full (full name,
place, cap, team sprites; accent border), then Recent (the last 6 picked, newest first), then every split as a collapsed
group (name and count) holding the trainers with the same row. Rows show the cap and place so repeated names (Hot House:
the same trainer name at several badge counts) are told apart. Picking a trainer selects its first Pokémon and closes the
sheet. Trainers whose starter / player variant doesn't match the user's pick are left out, as on the Trainers page.

**Pokémon card.**
- `Lv` and `HP`: number boxes (browser number input; in the viewer a button opening the pad). `Lv` overrides that one
  Pokémon only (the cap still sets the rest of the foe's team). `HP` is the current HP, not a percentage; the `HP` label
  is a button that restores full HP. Changing the level re-clamps HP to the new maximum.
- `M`: switches to the Mega form (species, so base stats and ability change; the held item becomes the Mega stone where
  the data knows it). With two Megas (X / Y) it cycles base → X → Y → base. Tapping from a Mega form back to base restores
  the previous species, ability and item. Counts as an unsaved change.
- `Edit ▾` opens the dropdown inside the card (the card grows; nothing else moves): Nature, Ability (the species'
  abilities and hidden ability), Item, Status (none / burn / paralysis / poison / sleep), a table of IV, EV, resulting
  Stat and Stage per stat, and the buttons below. **Stage row:** the first cell is a `+` / `−` mode button, each stat
  cell adds or subtracts one stage per tap (clamped ±6, red / green by sign), the `0` under HP clears all stages.
  Speed on the card follows the stage at once.
- **Save / Reset (imported Pokémon):** changes are unsaved (`*`) until `Save`, which overwrites that team member (`•`;
  it survives reloads and re-opening the guide). `Reset` discards unsaved changes; with none left it reads `Original`
  and discards the saved ones too, back to the values in the save file. Re-importing clears both layers (the save file
  is the truth after playing; the banner says how many edited Pokémon were reset).
- **Custom sets:** edits are the set itself (no Save / Reset); the dropdown has `Delete` instead.
- **Foe Pokémon:** unsaved changes only (`Reset` brings back the trainer's set; nothing is saved). Missing data is
  guessed and marked: an unknown ability uses the species' first ability, shown with a `?` in the dropdown.

**Move rows.** Tap a row to expand it (stays expanded across re-renders): Type (drop-down), Power (number box), Hits
(multi-hit moves only), the move's category and the damage in HP against the defender's current HP, the 16 rolls, the
modifiers (STAB, super effective, crit, weather...), `HP −min` / `HP −max` (subtract that damage, for all hits, from the
defender's current HP: the user's per-HP workflow), a full-width `Change move` (move sheet, then the slot is replaced),
and `Reset power / type` once either was edited. Type, power, hit count and crit belong to that Pokémon's slot (not to the move: the same move on another Pokémon is
independent), and are cleared when the slot's move is changed or removed; `Reset power / type` clears the first two. Variable-power moves (no fixed power in the data) show `—` until a Power is entered. `+ Move` opens the same
move sheet to fill an empty slot. The move list of an imported Pokémon is edited like any other field (unsaved until Save).
- **Right column (26 px, always):** `C` toggles a critical hit for that move (accent when on; recomputes damage, ignores
  screens and negative offence stages / positive defence stages as the engine does). Multi-hit moves (Bullet Seed, Icicle
  Spear, Rock Blast, Double Kick...) put `×n` above it (two stacked 14.5 px buttons, no gap); tapping `×n` cycles the hit
  count from the minimum to the maximum and back (default 3 for 2–5 hit moves). Future moves that need another control
  (spread, escalating power, ...) use the same stack.
- **Numbers.** Damage shown in bold is per hit (`15–18`); the % line is `×3 · 41–49%` for all hits together; the KO text is
  also for all hits per use (a use is n hits, `2HKO` = two uses). `OHKO` / `nHKO` when guaranteed, `nHKO 12%` when it is only
  a chance (min 1 %, max 99 %), `5+ hits` beyond four, `fainted` when the defender is at 0 HP, `No effect` for immunity.
  The KO chance uses the defender's current HP; the % uses its max HP.

**Field box.** Collapsed row `Field · <summary>`; open: Weather, Terrain, Reflect, Light Screen. The final list is the
user's to adjust later (it doesn't change the layout). Crit is per move, not a field option.

**Scroll stops (rail `↑ ↓`).** Three stops, computed when pressed and de-duplicated within 24 px: (1) the top of the page,
(2) the trainer block's last move row at the bottom of the viewport (so a full box stays visible above it), (3) the trainer
bar at the top of the viewport (the default view). `↓` goes to the next stop below the current scroll position, `↑` to the
previous one above it, with a 3 px tolerance. Pages too short to scroll to a stop use the nearest reachable one.

### Import flow
- `↻ Import` opens the system file picker (web: `<input type=file accept=".sav,.dsv,.bin,main">`; viewer: the app's
  document picker, a separate step in the app repo). Reading is synchronous and fast; no progress UI.
- **Success:** the banner (`Imported <file>` + `n in the party, n in boxes`), the grid is replaced by the new import, the
  selection moves to the first party Pokémon unless a custom set is selected. The previous import is replaced only now.
- **Errors never replace the previous import**, and show in a red banner: `Wrong game` (a save of a different game or
  platform; name it), `Save state` (an emulator save state, not a battery save; pick the `.sav`), `Unreadable` (both
  save slots fail their checksum; save again in-game), `No Pokémon yet` (the save has no party).
- Re-import after each play session is the same button; the later one-tap "reload from the same file" replaces the picker
  step only.

### What is remembered (new `cfg.ls` key, e.g. `<prefix>dmg`; never rename existing keys)
One object: `dir` (who attacks), `mine {src, b, i}`, `foe {k, i}`, `field`, `crit {slotKey: 1}`, `hits {slotKey: n}`,
`mvo {slotKey: {t, bp}}` (slotKey = the Pokémon's edit key + `:` + slot 0–3), `edits {key: fields}` (unsaved changes), `saved {key: fields}`, `custom [sets]`, `recent [6 trainer keys]`,
`imp {file, at, party, boxes}` (the imported sets: species, level, nature, ability, item, moves, IVs, EVs, stages = none,
a stable id such as the personality value for the `edits` / `saved` keys). Foe changes are keyed `foe:<trainer key>:<index>`,
the user's: `mine:<id>`. The cap override stays in the existing cap store (shared with the trainer card).
Open expanders and the open Edit dropdowns are not stored.

### Entry points
- **Trainer card:** each Pokémon block gets `Calc vs <name> ▸`: selects that trainer and Pokémon as the foe, keeps Mine,
  sets the foe's side as defender (Mine attacks), and opens `#/calc`.
- **Pokémon page (stat calculator card):** `Use in calc ▸` makes a custom set from the page's level, nature, IVs and EVs,
  selects it, opens `#/calc`.
- The rail's Calc tab opens `#/calc` with everything as left. Back / Forward and the viewer's restore follow the guide's
  existing history rules (sheets close on Back).

### Edge cases
- **No import yet:** the Mine card is the two big buttons; the results say `Pick one of yours`.
- **Empty party / box:** the grid is just the tools row and any custom sets.
- **No foe selected:** `Pick a trainer` in the bar, results say `Pick a foe`.
- **Foe with an unknown set:** no moves → `+ Move` rows (and `No moves listed` only when the foe attacks and has none);
  unknown ability → first ability with `?`; unknown level (relative with no cap) → `Set the level cap`; trainers marked
  "values are from the sheet" are used as they are.
- **Long names:** the trainer name, move names and the Pokémon name on the card truncate with `…` (never wrap, never
  push a control off the card); the trainer sheet and expanders show them in full. Test `Rival Brendan (sheet only)`,
  `Galarian Slowbro`, `Team Aqua Grunt Petalburg Woods`, `Mega Charizard X`.
- **Same species twice in a box:** the grid has no names; tell them apart by level and by `⌕ Find` (shows box and level).
- **Level 100 / 1, HP 0, stages ±6:** clamp, no NaN or negative numbers anywhere.
- **A Pokémon whose species has no sprite:** the usual type-coloured circle with the first letter.
- **dvkb:** every number box is a button opening the in-page pad (label names the box and range); `Clear` + `Done` on the cap
  box resets it. Selects use the viewer's injected option list. The letters keyboard serves the picker sheets (4 rows).
- **Light theme, 260 × 350, 480 × 392, 537 × 424, 832 × 424:** no overflow, nothing hidden.

### Touch targets (a deliberate exception to viewer-ui.md's 40–44 px)
To fit the block in 316 px these are smaller than the contract's minimum, on the user's decision: cap and level / HP
boxes about 22 px tall, `Edit` and the `M` button 18 px, the stacked `×n` / `C` buttons 28 × 14.5 px, move rows 31 px (26 px
for status moves), team and grid cells 28 px, the tools strip 28 px. If the Thor shows these are too small to hit, the
cheapest rows to grow are the cards' second line and the tools strip.

### Renderer notes learnt on the phone preview (Safari)
- Rows with block children inside a `<button>` get sized too small: use `<div role="button" tabindex="0">`.
- A flex column inside a flex sheet shrinks its rows below their content: give sheet children `flex:none`.
- Don't size two stacked buttons with `flex:1`: use explicit heights. A later `height` / `width` rule on the same button
  silently overrides it (what broke the first `×n` / `C` stack): scope the rules (`.mr .rcol button`).
- Text with `overflow:hidden` (ellipsis) clips descenders unless `line-height` is at least 1.2 and the box has a pixel of
  bottom padding (the `g` in "Giga Drain").

### Checks (scenarios for the build session; seed = the mockup's sample state unless stated)
Run each at 260 × 316 in normal and `dvkb` mode; the ones marked ★ also at 537 × 424 and 832 × 424. Every scenario also
asserts: no page errors and `documentElement.scrollWidth` equals the viewport width.
1. **Fit ★ (260 × 316):** imported party + boxes, a four-Pokémon trainer, Cloyster as attacker. Scroll so the trainer bar
   is 2 px from the top. The bottom of the fourth move row is at most 304 px (at 316 height). With `Edit` closed.
2. **Tap to attack:** tap the foe's card (not a control). The foe's moves are listed, the foe card gets the accent
   outline, the Mine card loses it. Tap Mine's name: it attacks again. Tapping `Lv`, `HP`, `Edit` or `M` does not change it.
3. **Cap box:** a trainer with relative levels, cap 34 default. Spin / `+` once: 35 and the foe's levels follow (strip,
   cards, results). Clear it: back to 34 in grey. The same value shows on the trainer card.
4. **Trainer stepping:** `›` selects the next trainer's first Pokémon; at the last trainer `›` is disabled; `‹` at the first.
5. **Trainer sheet:** open it; the selected trainer's full name is under `Find trainer…`; pick another from a split; the
   sheet closes, Recent lists it first. Pick seven different trainers: Recent holds six.
6. **Speed and stages:** Edit ▾ on Mine, `+` mode, tap the Spe stage twice: the card's Spe becomes double the base value
   with `↑`, nothing else opens or moves. `−` mode, tap once: stage +1, ×1.5 of base, arrow stays. `0` clears. The faster
   Pokémon's Spe is accent-coloured; paralysis halves the shown value.
7. **HP workflow:** expand a move, `HP −min`: the defender's HP box drops by exactly the min damage (×hits), the KO text of
   all rows recomputes against the new HP; tap the `HP` label: back to full. At 0 HP the rows say `fainted`.
8. **Crit per move:** toggle `C` on one move: only that row changes (≈×1.5 range); toggle off: back. A screen on the
   defender halves the non-crit rows, not the crit row.
9. **Multi-hit:** Icicle Spear shows `×3` over `C`; tapping `×3` cycles 2,3,4,5,2; bold damage per hit stays the same, the %
   and the KO text scale with the count; a 5-hit row can show `2HKO` where the 3-hit one shows `3HKO`.
10. **Move swap:** expand a move, `Change move`, pick another: the slot changes, the row recomputes. `+ Move` on a
    three-move Pokémon fills the fourth slot. Power and type edits recompute; `Reset power / type` appears and clears them.
11. **Mega:** on Garchomp `M`: name, Spe, stats and ability change, `*` shows. `M` again restores. Save, reload the page: the
    Mega persists with `•`. `Original`: back to base.
12. **Save / Reset:** change Level to 30 on an imported Pokémon: `*`. Reload: still 30 (unsaved changes are kept too). Save:
    `•`; Reset reads `Original`; pressing it returns to the save file's level. Re-import: edits cleared, banner says how many.
13. **Custom set:** `+ New`, pick a species: it is selected, its Edit dropdown is open, it has four default moves and a
    dashed cell; `Delete` removes it and selects the first party Pokémon.
14. **Import errors:** pick each of the four error files: red banner with the right text, the grid and selection unchanged.
    A good file after an error: green banner, grid replaced.
15. **Empty states:** clear the state: Mine shows the two big buttons; foe unset shows `Pick a trainer`; no exceptions.
16. **Unknown set:** the sheet-only trainer: its first Pokémon has no moves (`+ Move` rows when it attacks), ability shows `?`.
17. **Long names:** each name in Edge cases truncates on one line with no horizontal scroll; the descender of `g` / `y` is
    visible (row text box is at least 1.2 line-height).
18. **Scroll stops (single column):** with a box of 60+ Pokémon: `↓` from the top goes to stop 2 (last move row at the viewport bottom, part
    of the box visible above), `↓` again to stop 3 (trainer bar at the top), `↓` again stays; `↑` returns through the same
    stops. With a short page the stops collapse (no two within 24 px).
19. **Box size:** the grid cells match the trainer strip (same height and sprite size); six per row; no divider lines.
20. **Wide ★:** at 480 × 392, 537 × 424 and 832 × 424 two columns of equal-height cards, both movesets visible with correct
    per-side results, move rows aligned across the columns, the Mine grid scrolling inside its card; the document is exactly
    the window height (`scrollHeight === innerHeight`) with 61 Pokémon imported; no overflow. Open the Field box: the page may scroll.
21. **Entry points:** `Calc vs <name> ▸` on a trainer card lands on `#/calc` with that foe selected; `Use in calc ▸` from a
    Pokémon page lands with a custom set selected.
22. **Big box (single column):** import 61 Pokémon (6 party, 55 boxed). The grid card is at most 136 px tall and scrolls by
    touch; the page is not longer than with 11 Pokémon; at the top of the page the foe bar and all of the foe's team are
    visible with the grid's first four rows.
23. **Per-slot crit:** turn crit on for Earthquake on Garchomp; the same move on another Pokémon is unaffected; change the
    slot's move: crit is off again.
24. **Persistence:** after changing foe, dir, field, crit, a hit count, a power override, an edit and a saved change, reload:
    all restored. `Clear saved state` in the frame: back to defaults.

## Order

1. Bundle `@smogon/calc` into the template (size check: guides stay one file; see how much of its data we can drop, since
   our `data.json` provides species and moves). Build the calc page from the UI spec above (custom sets and the trainer side
   first; no import yet), EI first. In-game test of EI's mechanics.
2. Gen 3 save reader and EI's ID tables, tested against the user's save.
3. Viewer file picker (app repo).
4. Gen 4 reader (Hardlove Gold), then Gen 5 (BB2R) when its guide is built.
5. Gen 6/7 reader (Photonic Sun, then Eternal X).
6. Each new guide's extract step writes its ID tables and `cfg.calc` from then on (add it to CLAUDE.md → Making a new guide and the skill).

## Not doing

- Reading the game while it runs (memory). Only possible inside the emulator; RetroArch's network commands might allow
  it for some cores, but that's untested and doesn't help with Azahar. Revisit if a save import turns out to be too slow in practice.
- Writing to saves.

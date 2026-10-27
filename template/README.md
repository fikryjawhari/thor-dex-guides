# Template

`shell.html`, `dex.css` and `dex.js` are the one template every guide is built from (Emerald Imperium is the reference
build). `assemble.py` inlines them with the hack's `hack.json`, `data.json` and the sprites it uses into
`dist/<hack>.html`, and writes `dist/guides.json` and `dist/index.html`. Nothing about a hack is in the template: a
guide differs only by its data and its `cfg`. The device rules (window sizes, no Android keyboard, `<select>` shim,
lag rules, scroll restore) are the viewer contract: `.agents/skills/rom-hack-offline-dex/references/viewer-ui.md`.

## What a hack sets (`hack.json`)

`id`, `title`, `game`, `platform` (GBA / NDS / 3DS), `version` (the `dex-viewer:version` meta tag), and `cfg`:

| Key | What it does |
| --- | --- |
| `name` | The hack's name in wording. |
| `orig` | Tag for hack-original moves / abilities (`''` = none). |
| `evs` | `false` = no EV inputs or EV speeds. MGM shows only when this is on **and** some trainer Pokémon has EVs. |
| `starter` | `pick` = named starter picker (tracker bar, Trainers header, walkthrough) stored in `TK.s`; `type` = the same picker for guides whose rivals follow a type (`t.st` = Grass / Fire / Water). |
| `orbs` | Primal / Rayquaza Mega pages point at Useful NPCs. |
| `g3trainer` | Unobtainable species are tagged Trainer only. |
| `capLast` | The trainer cap box remembers the last cap set, for trainers with no cap. |
| `walkAreaNote` | Show area notes inside walkthrough encounters. |
| `trw` | Boss / trainer words, `[one, many, footer]`. |
| `credit` | Footer credit line (hook in place; no guide sets it yet). |
| `ls` | Every localStorage key. **Never change one after a guide is published**; add fields inside the existing objects instead. `capset` is unused but kept. |
| `txt` | All hack-specific wording (inserted as HTML): `obt`, `nw`, `g3`, `conf`, `tc`, `chdoc`, `mvh`, `nodc`, `mvsrc`, `mvsrcx`, `absrc`, `ns`, `walk` (Guide info text), `capl`, `capnone`, `noev`, `plm` / `plf` (player picker labels). |

## What the data switches on

A feature shows when the data has it, so a new hack needs no template change. The schema (every key, which are
optional) is `hacks/emerald-imperium/notes.md` → Data schema; `tools/schema.py` enforces the key order and raises on
an unknown key.

- Pokémon: tutor moves `p.tu`, source conflicts `p.cf` ("Sheet says ..."), Mega stone `p.stone` / `p.sloc`.
- Locations: a Starter area (`AR[i].st`, tied to the starter picker), sections per game table (`AR.es`), area maps
  (`AR.map`), tracker sub-slots (`AR.sub`), optional page order `ARO` (areas added later sit at the end of `AR` so saved
  trackers keep their slots).
- Trainers: caps `TR.caps` (hidden when empty), partners `t.pt`, shared battles `t.bt`, starter `t.st` and player `t.pl`
  variants (the player picker shows when any trainer has `pl`), EVs (MGM).
- Walkthrough: checklist steps `stop.s` (Next step and Reset checklist show only then), stop notes, cheat codes
  `WK.cheats`, game docs `WK.docs` / `WK.ko`, unplaced items `WK.np`, stop keys `stop.k`.
- Saved walkthrough state is keyed by stop key: when a hack regroups its stops, `migrateWalkState` moves saved ticks,
  open state and scroll anchors to the new positions (`tools/walk-state-check.mjs` tests it). Give every new stop a
  key that never changes; cutting a stop in two keeps the key on the first part and adds `.fN` to the others.

## Shared rules every guide follows

These came out of the consistency pass (2026-10-23/24); the extract helpers apply most of them.
- Species that are neither obtainable nor used by a trainer are left out (Megas / forms too).
- Trainers boxes are cap splits named `<Boss> Split [Cap N]`, then `Elite Four Split [Cap N]`, then `Post-game`
  (`tools/splits.py`). One cap list, mini caps included. The walkthrough's splits are the same boxes, and the
  Trainers page lists them in walkthrough order (`extractlib.trainers_follow_walk`; `tools/tabs_check.py` checks it).
- Items: one box set, sub-headings and row style for every guide (`tools/itemstd.py`, rules in its docstring).
- A Starter area on Locations, listed first.

## Page design

### Damage calculator

Profiles may declare `monControls` (`k`, `l`, `abilities`) for per-Pokémon battle-state checkboxes. EI uses
`abilityOn` for First turn out (Bull/Quill Rush) and Disguised (Illusion); off is the default. Ability controls sit on
the card's header line, left of Edit, no taller than Edit (the card keeps the height of one without them), with an
accessible label and tooltip: these checkboxes, the Intrepid Sword / Dauntless Shield box (checked = on, the default)
and the Download button. Edit itself is the same for every Pokémon. Changing ability or
Mega form clears this state. Controls do not change the attack direction. `categoryInvert` names moves with an
Invert category checkbox in their move details: a compact P/S · A/I button above Crit also toggles it while collapsed.
The tooltip spells out category, Auto/Inverted and ties. The ability boxes are battle state (scratch, see Fight
state); the category flag is a per-slot move override and is stored. EI also exposes allied Emperor's Presence per side;
it only affects doubles. Effective priority is an
engine result, not a claim about which move should happen first; the faster Speed colour is the current UI.
Opening Edit at wide sizes opens both populated editors; closing either closes both. Full form names appear inside
Edit. The team area's height is based on closed cards and move rows, so edits/residuals never enlarge it or change
the team from rows to a strip. Editors and expanded moves grow downwards; Field follows the whole moveset.
No condition labels or category controls appear in profiles that do not declare them.

**Turn end** (residual, 2026-10-25): `DMG.residual(set, field)` gives each side's end-of-turn parts (weather, Leftovers / Black
Sludge / Sticky Barb, status incl. rising toxic, Grassy Terrain, Dry Skin / Rain Dish / Ice Body / Solar Power / Poison Heal,
plus the profile's `residual`). The KO text counts the defender's per-turn change; rolls, percentages and HP buttons never do.
The clickable residual amount sits on its Pokémon's existing HP line. Tap it to apply one turn immediately, without
opening Edit or selecting the attacker. Toxic's 1-15 turn box sits on the same HP line (`T`), before the amount;
applying a turn advances it, capped at 15. Inside Edit the parts are folded behind a Turn end button on the Battle
state row (opened per card, not stored), so up to five residuals never make the open card taller than one window. **Triple Kick / Triple Axel**: the row's ×3 button
cycles ×3 (total, default) → H1 → H2 → H3; the outside number is the total or that hit's range, percent and KO stay on the
total; the choice lives in `ST.hits` (0 = total); no Hits box in the editor. An opened row repeats them (`Turn end: −2 Sandstorm`). Leech Seed is not offered
(no control says who is seeded). When HP is not full, the HP label becomes an accent ↺ button (tap: full HP).
**Protean / Libero**: the attacker takes each move's type (STAB in every base); the edit menu
of a Pokémon with either ability has a Type row (own types or one of the 18) used when it defends; a dot in that type's colour
marks the card. Scratch `pty`; ability / Mega change clears it. Scenario: `tools/scenarios/calc-residual.mjs`.
**Battle state**: per-row toggles, earlier-use counters, partner pledges (Doubles only) and Metronome use the one
top slot above Crit, without growing the row. Hack `over.state: false` suppresses a move's control; `curl: false`
suppresses Defense Curl in Rollout/Ice Ball details. A move's own control wins over the item's Metronome counter.
State is `ST.st[slotKey]`; target Dig/Fly/Dive/Minimized/Switching is `ST.tgt[cardKey]` in Edit (both scratch, never
stored). Changing a move clears
that slot, import clears imported Pokémon's state, and Reset power/type clears only those two overrides.
Download cycles Auto (with its actual stat), Atk, Sp. Atk, None, shown as `A·Atk` / `A·SpA`, `M·Atk`, `M·SpA`, `None`
(tooltip spells it out).
Details show used/listed/typed power, crit chance/stage and first-/between-hit changes; the move's own changes alone
can be omitted. Forced crit locks C on; blocked crit disables it. No new localStorage key is used.
**HP moves** (2026-10-26): fixed / fraction damage (Seismic Toss, Super Fang, Endeavor, Final
Gambit, Psywave, OHKO moves...) are ordinary rows with one number (no Power box). Counter / Mirror Coat / Bide / Metal
Burst / Comeuppance: the Power box reads Taken; the row shows — until it is typed (Reset power clears it). A move that changes its user's HP
(recoil, drain, Life Orb, Shell Bell, heals, costs, self-KO, Pain Split `↔n`, Wish `↻`, Rest `Zz`) has a signed amount
in the residual style: at the start of the % line (after Z), or in place of a status row's —. **One tap = one use**:
the target loses the default damage (the player attacking: minimum roll; the foe attacking: maximum roll; all hits;
capped at its HP) and the user gets the matching change (Rest also sets Sleep). The opened row of a damage-dependent
move has **Dealt / You** boxes: Dealt gives your change; You (the recoil / recovery seen) gives the damage range that
produces it, using its minimum when the player attacks, its maximum when the foe does; Apply applies both. Not stored.
HP −min / −max stay damage-only. Scenario: `tools/scenarios/calc-moves.mjs`.
Contact costs (Rocky Helmet / Rough Skin / Iron Barbs) are included once in the one-use amount, using the
engine's actually applied hit count, including early KOs. Crash moves (Jump Kick, High Jump Kick, Axe Kick,
Supercell Slam) have a separate **miss −HP** chip: `DMG.hp` with `miss: true`, and the default would-be roll
for Gen 4's damage-based rule. Its tap changes only the user's HP and logs the miss; no target hit or contact cost.
**Stockpile** is a 1–3 select in Swallow / Spit Up's opened details (`ST.st`, scratch, default 1): Swallow heals
quarter / half / full HP, Spit Up uses power 100 / 200 / 300; typed Power still wins. It does not occupy the
row's top-right control or share Metronome's counter. Recoil / drain / crash chips are no taller than the % line:
closed rows keep equal heights with or without a chip, including the two movesets in wide windows.
**Hit totals**: collapsed damage sums all selected hits, including Parental Bond. Fixed multi-hit and Parental Bond
share one total/H1/H2/etc. inspection button; ordinary variable-hit moves cycle through legal counts plus a one-hit
inspection. Loaded Dice restricts standard 2-5-hit choices to 1/4/5; Skill Link to 1/max. Loaded Dice makes Population Bomb a 1 / 4-10 cycle
(default 10, its fixed ×10 without the dice); Ash-Greninja's Water Shuriken is a fixed ×3 (the engine gives it power 20). Details retain per-hit rolls.
**Field**: a full-width Singles/Doubles segment, then shared Weather/Terrain and global toggles, followed by stable
Player/Foe columns. Stored `atk*` means Player and `def*` means Foe; the page remaps inputs for foe attacks. Old
attacker-relative state migrates once, using its saved direction. Focus Energy is offered on both sides in every
profile. Weather / terrain layers are manual (this fight), then the most recent entering ability setter, then
deduplicated trainer / section `field` evidence, then none. The first select option is `Auto: <value>` (dashed);
manual selections have an accent border. The source line names area / setter / manual provenance; **Auto** clears
every manual Field override. Simultaneous leads resolve in Speed order, slower setter winning (reversed under
Trick Room); primal weather resists ordinary setters. `DMG.settings().setterStays` controls whether a departing
setter leaves its layer behind. A fainted entrant sets nothing. Area evidence also supplies foe Tailwind, the
foe's guessed +1 crit, lead-exempt player Spikes / Toxic Spikes and Trick Room. Thunderstorm is Rain + Electric
Terrain; random terrain and Fog are text only. The Area line exposes the original wording on tap / tooltip;
variant labels are ignored. Automatic toggles are dashed, pressed and marked A; tapping makes them manual.
Trick Room is always offered from Gen 4 and reverses the faster-Speed colour, not damage.
Intimidate has a checked-by-default **Intim.** header box on its holder; the target's HP line shows the engine's
net `Int −1` / reaction mark without changing Edit stages. Orb status is derived through `DMG.derived` and labelled
`Burn (Orb)` / `Toxic (Orb)` in Edit; choosing any status, including None, is a kept override. Ice Face restoration
also comes from the entry API. HP −min / −max apply `DMG.hit` patches (HP, consumed items, stages, toggles, status,
Broken and field events); the one-use HP chip follows with `DMG.hp` using actual dealt damage / hit count, including
contact costs. Dealt / You Apply uses exact-damage threshold reactions only. Turn end applies `DMG.turn`, including
Speed Boost and eligible berries. An eligible berry has its own HP-line chip (`Sitrus +13`, `Salac Spe+1`), applying
`DMG.berry` once. A crowded HP line with a berry or Intimidate wraps rather than clipping actions or widening the page.
These actions and entry hazards replace a dismissible fixed bottom log (three lines, then internal
scrolling; above the keyboard in `dvkb`), never adding layout height or saved state. KO notes come from the engine.
Field toggles never break a word: the narrowest box is the widest single word of any toggle (measured in the page's
font at render, so text zoom counts), each toggle grid uses its own measured width and fits as many columns as there is room
(`auto-fit`), so a narrow grid becomes rows. Where a side column would hold one box per row (the minimum window, 206 px
of Field), a Player | Foe switch shows one side at full width (the count of its active toggles on each button; the
choice is not stored). Weather/Terrain have no caption: the empty choice reads "No weather" / "No terrain".
**Stackable states** (2026-10-26): `template/calc/field-states.json` defines side controls; `assemble.py` adds only
those supported by the guide's moves / causing abilities and generation (Protect additionally needs `zmove`). The engine accepts
these keys independently of UI availability. Dig / Fly / Dive / Minimized / Switching out remain the exclusive
Edit selection. Other states fold under States, Turn end and Hazards, with active counts; fold state is session-only.
Laser Focus / Lucky Chant / Dragon Cheer are per-side States toggles (`atk*` Player, `def*` Foe), gated by their
moves, generation and profile-disabled effects. Dragon Cheer is offered only in Doubles, never in Hardlove.
Global Water/Mud Sport, Power/Guard Split and ally aura states fold under **Global** beside the existing global
toggles; ally controls (including per-side Ruin sources) appear only in Doubles, and these global manual choices share the normal Auto / Reset fight / trainer-change lifecycle.
The closed group headings share one row so the minimum-size Field fits without scrolling. Expanded groups stay
inside that one-window Field, scrolling its body when needed; opening a group brings its controls into view.
Field content does not flex-shrink; toggle rows keep their natural wrapped-label height when pressed or redrawn.
The player's Pokemon box packs compact rows against its top edge, leaving any spare height below the last row.
Turn-end parts now include trapping (the opposing holder's Binding Band), Leech Seed transfer (Big Root / Liquid
Ooze / Magic Guard), Salt Cure, Ghost Curse, sleeping Nightmare, Ingrain, Aqua Ring, pledge fire and automatic Bad
Dreams. Speed uses the engine's final field-aware value, including Swamp. All side utilities use fixed Player/Foe
prefixes; attack calculation still remaps them for the chosen direction.
**Entry hazards**: Rocks and Spikes subtract HP once on team/strip selection, never on redraw, direction change
or reload. Toxic Spikes sets Poison / Bad poison once; Poison entrants do not consume its layers. Sticky Web sets
the absolute Speed stage to -1 (the engine respects drop immunity and Contrary), not current stage minus one.
Manual HP entry / Full HP, status changes and stage changes independently re-arm damage, poison and Web for the
**Apply hazards** button inside Hazards. Re-poisoning or resetting Web never subtracts already-applied Rocks again.
Layer toggles cycle 0-3 / 0-2 and only configure the field; changing them makes the relevant component available
to apply. Existing calc storage also keeps entry markers, so manual overrides survive reload. Hazards never appear
in turn-end parts or the HP-line residual amount. No White Herb consumption or reciprocal stat-drop effects are
simulated. Steelsurge is engine-only, with no control in any current or planned guide.
Checks: `tools/scenarios/calc-field-states.mjs` (entry, reapply, persistence, side mapping, groups and availability),
plus `tools/calc/test.mjs` (mechanics and generation splits).
**One window**: an open card (Edit), the open Field and an open move each fit one window at the minimum height
(316 px) at every width: the full name shares its line with Save/Reset, Type/Power/Hits share a row, the move's full
name shares its line with Change (and Reset), per-hit range and rolls share a line. Check: `calc-state.mjs` one-window.
Text zoom scales every font; box heights are fixed px. A hidden probe re-measures the toggle widths when the font size
changes. **Search**: Find trainer and Find yours also match a set's moves, held item and known ability (a trainer:
any of its Pokémon's); names rank first, and a term match is named on the row.
Scenario: `tools/scenarios/calc-state.mjs`; trainer Metronome top-slot conflicts: `tools/calc_ui_check.py`.
**Z-moves** (profile `zmove`, Photonic; 2026-10-26): each damaging row's % line opens with a Z toggle, centred under the
row's type dot (the dot and the Z share a 20 px column, so the name and the % text start at the same x; the user rejected
Z before the name: it cut long names at 260 px). On: the row shows the Z-move's name in the accent colour and its damage
(slot `z`, one hit: no ×n / Hits), the opened row says "Z-move of <move>". Stored per slot in `ST.z` (the calc's one key),
cleared with the slot's move. Rows are 36 px instead of 31 so the toggle fits (the % line sits 2 px up inside the row);
the trainer bar's arrows are drawn chevrons centred in their buttons (the ‹ › glyphs sat low), and below 480 px the buttons
are 24 × 22 and the bar 24 px tall (was 30 × 26, 28): trainer bar to the fourth move is 309 px of 316. From 480 px the Z is smaller
(12 px) and the rows stay 32 px: the 36 px rows left 211 px under the cards at 537 / 832 × 424, below the foe team list's
222 (now 227). Status rows have no Z. Guides without `zmove` render exactly as before (no `zm` class, no `pc` span class).
**Totem auras** (data `au`, five stages): the Trainers card tags the Totem ("Aura Def +1", "Aura +2 all"); in the calc
its stages start at the aura and an "Aura" mark sits at the end of the Lv / HP line while they are unchanged (Reset
brings it back). Scenario: `tools/scenarios/calc-zmove.mjs`.

`#/calc` is implemented by `calc.js` and `calc.css`; `assemble.py` includes these and `calc/engine.js` only with
`cfg.calc`. The resolved profile supplies the level and stage bounds, status choices, nature/ability/item switches,
field entries, multi-hit ranges and variable-power moves. The page calls `DMG.init`, `DMG.stats` and `DMG.calc`;
damage rolls and KO probabilities come from the adapter, not page-side mechanics. Weight / HP / speed moves (Low Kick, Flail, Gyro
Ball, ...) get their power from the engine (`r.bp`, shown in the row's Power box, which still overrides); Return /
Frustration show 102 (maximum happiness, 2026-10-26); the other variable-power moves show — until a power is set.
Effective Speed uses the optional `DMG.speed(set, field)` hook; without it, the fallback applies stages only.
The real adapter must provide that hook for paralysis and other game-specific Speed modifiers.
When the adapter returns `per`, the expander shows each hit's rolls; aggregate HP subtraction and best-move ranking
sum those per-hit ranges, while percentages and KO text use the adapter's already aggregated values.

Mine (party, boxes, custom sets), selection, unsaved/saved edits, kept HP / status, the Field and per-slot overrides
are one object in `cfg.ls.dmg` (no other key).
**Turn-end amount** excludes a berry already eligible before the turn: only its berry chip shows that recovery.
The turn action leaves that berry available. If residual damage first crosses the threshold, the turn amount and
action include its recovery and consumption. Speed Boost still follows the residual parts.

**Fight state** (2026-10-27): a Pokémon's battle condition (stages, ability boxes,
Download, entry box, Protean type, target state, row state incl. counters, toxic turn) is **scratch**: memory only
(`SC[cardKey]` + `ST.st` / `ST.tgt`), alive while the card is selected. Selecting another Pokémon and coming back
brings it fresh; only **HP and status** are kept (`hp` / `status` in `ST.edits`, a custom set's own fields), the
toxic counter restarts at 1. The player's **unsaved set edits** (nature, ability, item, level, IVs / EVs, moves) go
when the Pokémon is switched away; the **foe's set edits are kept for the fight** (no foe Save: trainer data stays the
source) and go on a trainer change / Reset fight. **Mega** is fight state like `broken` (`mega`, the form laid over
the set; ability / item edits while Mega go with it): kept across switches and reload, not a set edit, not an entry.
Save keeps set fields only, never HP / status / scratch; Edit Reset clears unsaved edits and scratch. `broken` (Disguise / Ice Face) is kept for the fight on both sides. Player HP is kept across trainers; foe
HP / status only for the current fight. A **trainer change** (bar arrows, Find trainer, a trainer card's Calc link)
clears all scratch, the foe's kept state and set edits, `broken` / Mega and the manual Field overrides (`ST.fman`: Field keys the user set
this fight; Singles / Doubles is not one); the foe team starts at full HP, slot 1 (or the linked Pokémon).
**Reset fight** (Field's first row, right of Singles / Doubles): the same, plus every HP 100 % and every status
cleared, same trainer and Pokémon. Reload keeps HP / status, the foe's of the current fight and the manual Field;
scratch is gone. Loading older storage drops stored scratch everywhere, turns a stored Mega (`pre`) into `mega` and
keeps only HP / status / fight state on player cards not selected. Entry hazards still apply once per selection and on a new fight. Scenario: `tools/scenarios/calc-auto.mjs`.
**Broken** is a labelled header checkbox only for a Mimikyu / Eiscue form with Disguise / Ice Face as its current
and available ability, with abilities enabled and the supported generation. It reads/writes `broken` fight state;
HP − / one-use actions tick it via `DMG.hit`. Busted / Noice forms start checked unless explicitly restored.
Switching preserves it; trainer change / Reset fight clears it; Ice Face can restore on entry in Hail / Snow.
Internal set aliases follow trainer data (`l`, `na`, `a`, `i`, `m`); the engine boundary converts them to its
`lv`, `nat`, `ab`, `it`, `st`, six-element `stg` contract. Caps stay in the existing `TCAP` store. Sheets and expanders
are transient; pickers use the shared keyboard/number pad and the viewer's normal select shim.

Import exists only with `profile.save`: a file input calls `READERS[profile.save](bytes, D)` and maps game IDs through
`D.GID` (bypassed with `ids: "ours"`). Success atomically replaces the import and clears imported edits/slot overrides;
errors retain the old import. `calc/readers/test.js` and `tools/scenarios/fixtures/calc/` supply synthetic JSON saves.
`node tools/scenarios/calc-smoke.mjs dist/emerald-imperium.html` patches only a temporary built page to select that reader.

`dex.js` owns guarded rail, trainer-card and stat-calculator entry hooks and delegates the calc's three scroll stops.
Below 480px, one moveset is shown; from 480px, equal columns show both and keep Field below the viewport-height block.
The Mine grid scrolls internally; the foe list replaces its strip only at 222px of measured availability. Both strips
share 28px cells with the level safely inside the selection border. Without `cfg.calc`, only removal of the Calc tab
changes the other pages' DOM, and `#/calc` redirects to the Pokémon list.

**Design rules** (UI spec 2026-10-24): one screen at 260 × 316 (trainer bar, foe strip, both cards, the attacker's
four moves); don't add a row to that block without removing one. Below 640 px (including narrow wide-layout columns),
a berry chip moves into Edit when Toxic, an Intimidate mark or a battle-state label crowds the HP line; compact
number boxes, marks and a Speed-change arrow keep that line unwrapped (full effect names remain in the tooltip). Consuming a berry does not change the closed card height or hide
the fourth move. Otherwise the berry stays beside the turn-end amount. Nothing to open for common edits (level, HP, nature,
ability, item, status, IVs / EVs, stages, Mega, moves, power / type / hits, crit); sheets only for long lists. Space goes
to the matchup: no headings, explanatory text or dividers; names truncate in the main block, full in sheets and
expanders. Never overflow the width, normal or `dvkb`, every expander open. The template owns the mechanics-free UI;
everything that differs between games (generation, field list, status / stage / level ranges, changed effects,
multi-hit / variable-power moves, forms, save family) comes from the profile. **Touch targets** are smaller than
viewer-ui.md's 40-44 px by the user's decision (number boxes ~22 px, Edit / M 18 px, `×n` / `C` 28 × 14.5 px, rows 31
px, cells and tools strip 28 px); if the Thor shows they are too small, grow the cards' second line and the tools strip
first. **Safari lessons:** rows with block children in a `<button>` size too small (use `div role=button`); give sheet
children `flex:none`; size stacked buttons with explicit heights, scoped (`.mr .rcol button`), not `flex:1`; ellipsis
text needs line-height ≥ 1.2 and 1 px bottom padding or descenders clip.

Built with the user over many mockup rounds; keep to it and don't retry what's listed as rejected.

**Collapsible pages** (walkthrough, Locations, Trainers, Items; `COLLAPSIBLE PAGES` in dex.js, "Collapsible pages" in
dex.css):
1. Levels: box (closed by default) → place (`details.stopd`, sticky under the search bar) → section
   (`details.sec`, sticky under the place). Every level's open state is saved in the page's `LS` object.
2. Tapping a header never scrolls (`flip()`, `hold()`); browser scroll anchoring is off while it settles.
3. Expand all / Collapse all bars (`segBar`): one at the page top for the boxes, one in a box with 2+ sub-levels. They
   only open or close their own level and never move the bar.
4. Collapse bars at the bottom of a block only when it is taller than the window (`bars()`); a pinned block collapses
   in place and flashes (inset accent ring). Rechecked on toggles, resizes, content-visibility renders and any change
   of the page size (a ResizeObserver on `#app`: the viewer's text zoom fires no resize but changes the height).
   Size changes clear cached bar heights and coalesce into one animation-frame check; no polling or extra elements.
5. Jump buttons in the rail (`.rjump`): up / down between boxes, landing at `T()` under the search bar.
6. Stacked sticky headers: paint `--bg` above the lower header so no gap shows on the phone, and pin only what's asked.
7. The level row ("Level cap 15 · yours 17") is closed by default.
8. Items: boxes don't pin, their sub-headings do. A box with one sub-heading named like itself shows the name twice
   (box header + sub-heading) on purpose: the user wants it that way so the box header never becomes sticky.

**Walkthrough:** Guide info → Starter → Next step → Expand / Collapse all, nothing else above the splits. Inside a stop:
note, then Checklist / Encounters / Items / Trainers sections. Stops with trainers show `n/N | cap` (the split's cap
when the stop has none). Empty stops are grey signs (`.wsign`), not boxes. Guide info holds tracker export / import /
reset, the game docs and the intro text.

**Trainers:** a Show switch per box (Places / Trainers / Teams, read from the page, not stored) pinned under the box
header; each place header has a `n/N | cap` button that fills first (part → all open, all → all closed) and never
toggles the place. Toggling keeps the trainer you're reading in place (anchor = the first row edge under the pinned
headers). Trainer cards: below 500 px a strip of up to six sprites above one Pokémon; from 500 px all Pokémon as
blocks, three across at most. An opened card starts at its team. One speed per Pokémon (with EVs, or without under MGM).

**Search:** the full-window search on every device (the in-page keyboard in the viewer or `dvkb`, the device keyboard
elsewhere). The current page's section first, then Pokémon, Filters, Locations, Trainers, Items, Walkthrough. Each
result has action buttons (Dex, Trainers, Places, Walk, Filter...) that jump or search; Enter searches the current page.
The search stays set across pages until its × or a tap on the current rail tab. Jumps use `land()`, which lays out
content-visibility-skipped ancestors first.

**Rejected** (don't bring back): animated collapses (slide, smooth scroll then close, synced fold); pinned trainer
rows or team previews; a ☰ rail; BST anywhere; IVs on cards; the "Changes from vanilla" card and Changed filter;
evo/breed tags; the trials / mini caps switch; per-hack item boxes; separate Expand / Collapse bars per island and place
on Trainers.

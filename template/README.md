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

**Both teams in the first frame (calc-team, 2026-10-28):** at every viewer size the first frame shows my team, the
foe's team, both cards, the attacker's four moves (wide: both lists) and the fight bar at once. Both sprite grids keep
six columns. **Narrow (< 480):** box (unchanged), then the trainer bar (22 px, no panel border), the fight bar (S / D,
weather, terrain, ↺; 22 px, its buttons too: accepted below the 26 px tap size), my team (3 × 2) facing the foe strip
(3 × 2), the two cards side by side, the moves (closed rows 33 px). The first frame is the page scrolled to the trainer
bar (`openMatch`). **Nameless card** (narrow): the highlighted team cell says who is in. Line 1 ↺, HP box, `/max`, ✎;
the HP bar under it; line 2 M, ability boxes, Speed (no label) at the right; line 3 (only when it has something) the
battle-state tag (Dig, Fly, ...), Aura and the berry chip at the left, T + Toxic box and residual at the right (the
user, 2026-10-28: state / Aura never on the name line). The name shows (line 0) only when the selected Pokémon is not
in the team row: then M, the ability boxes and Speed move up beside it, the name truncating as far as needed. **At most
three lines, always** (the user): `fitCards()` measures each narrow card (render, resize, size change: text zoom fires
no resize); one that takes more moves Aura up (the ability / Speed line, or after `/max` on a named card: Aura is the
rarest tag and about stages), then the battle state the same way, then goes tight (1 px gaps, Aura as "A"). No name line while Edit is open; an open card
spans both columns. Lv sits on the team cell (the Lv box only in Edit). No Intimidate mark on any card (the user,
2026-10-28): the holder's box is the only sign. **Wide (≥ 480):** left column = box panel with my team row under the grid (1 px line), then the fight bar; right
column = the trainer panel, whose preview (two-line rows, 25 px, all six always visible, no scrolling; tap = pick that
foe) is the foe's team (no strip); the cards (named, ~48 px) and both move lists pinned to the bottom of the window.
Jump arrows (`CALC.stops()`): top, the first frame (trainer bar − 2, narrow), the fourth move's bottom when an open row
or editor pushes it ≥ 24 px past that, and Field (always, clamped); stops within 24 px merge.
**My team row**: `team: [{src, pid}]` (≤ 6, dense) in `cfg.ls.dmg`, resolved by pid (imported: party then boxes;
custom: `ST.custom`); entries that no longer resolve drop out. Imports never fill or change it (the user): it is built
by drag and drop only. Tap a team cell = send it in (as a box tap). Pointer-event drag (HTML5 drag doesn't fire on
touch): touch / pen hold 250 ms without moving 8 px (moving first scrolls), mouse 5 px; box → empty slot appends, →
filled slot replaces, already in the team → swap; team → slot swaps (empty slot: to the end), → outside the row
removes (red × on the floating copy); the click right after a drop is swallowed (400 ms); narrow auto-scrolls at the
edges. Box cells in the team carry a 5 px accent dot. Mega is the card's M, never a second entry. **Foe Pokémon to my
team** (the user, 2026-10-28: a partner's team in a multi): a foe strip cell (narrow) or foe row (wide) dragged onto
the team row becomes a custom set copied from the trainer's (pid `f:<trainer>:<slot>`, once: a second drop moves it),
listed with the other custom sets; dropped anywhere else nothing happens, and a tap still picks the foe.
**HP bar and fainted** on every team cell (my row, the foe strip, the wide preview rows): a 2 px bar in the card HP
bar's colours (green, yellow ≤ 50 %, red ≤ 20 %), and a grey sprite at 0 HP; ↺ Reset fight and a trainer change
refill both sides (the user, 2026-10-28: my team's HP no longer carries over to the next trainer).
**Auto Doubles**: a trainer whose data carries a `gameType: Doubles` field record (`tools/trainer_fields.py`
`DOUBLES_TAGS` / partners: double, multi, 2on2, triple (the calc has no triples) tags or `pt` partners; not Back2Back,
not Rotation) opens in D automatically (dashed outline, no A mark: the user; tooltip and Area line name the tag); tapping S / D is manual for
the fight (tapping the trainer's own format is Auto); Auto, ↺ and the next trainer clear it.
**Battle type in the trainer's name** (calc only: the bar, the trainer sheet, Find trainer; the walkthrough shows the tag
itself): `[D]` double (True / 2on2 too), `[M]` multi (tag or `pt` partners), `[T]` triple, `[R]` rotation, `[BR]` battle
royal, `[B2B]` / `[B3B]` back to back; a double back-to-back shows both (`[D B2B]`). `[P]`: a partner at your side in a
multi (`t.pt`) is a calc trainer of its own right after its battle (key `<trainer>~p<n>`, name short as in the
walkthrough plus its starter team, e.g. `[P] Hau (Rowlet)`; only your starter's team once chosen), so its Pokémon can be
dragged to your team. From the trainer's tags in the
template (`BATTLETYPES`), no data change; a new hack's wording gets a pattern there. Search ignores the brackets, so
"d" lists the doubles first, and the tag's wording ("double battle", "back to back") is a search key.
Scenarios: `calc-team`, `calc-doubles`, `calc-layout`, `calc-retest`.
The HP line is 20 px high, with Toxic beside the unsigned red/green residual and nameless white +berry action;
a thin bar shows current HP. Each Turn end part in Edit is an independent button (no automatic berry or other parts).
Item (all engine items plus guide/custom items), Nature and Other ability use text entries opening the full-window
picker, including the in-guide keyboard. Species abilities remain a native select with Other…; × returns to it,
retaining a valid species ability or restoring the first species ability. Off-species saved abilities reopen as text.
No native select (status, battle state, move type, hit count, weather, terrain, etc.) is intercepted.

**Turn end** (residual, 2026-10-25): `DMG.residual(set, field)` gives each side's end-of-turn parts (weather, Leftovers / Black
Sludge / Sticky Barb, status incl. rising toxic, Grassy Terrain, Dry Skin / Rain Dish / Ice Body / Solar Power / Poison Heal,
plus the profile's `residual`). The KO text counts the defender's per-turn change; rolls, percentages and HP buttons never do.
The clickable residual amount sits on its Pokémon's existing HP line. Tap it to apply one turn immediately, without
opening Edit or selecting the attacker. Toxic's 1-15 turn box sits on the same HP line (`T`), before the amount;
applying a turn advances it, capped at 15. Inside Edit the parts are folded behind a Turn end button on the Battle
state row (opened per card, not stored), so up to five residuals never make the open card taller than one window. **Triple Kick / Triple Axel**: the row's ×3 button
cycles ×3 (total, default) → H1 → H2 → H3; the outside number is the total or that hit's range, percent and KO stay on the
total; the choice lives in `ST.hits` (0 = total); no Hits box in the editor. An opened row repeats them (`Turn end: −2 Sandstorm`). Leech Seed is the side's
Seeded state (Turn end group). The ↺ button restores full HP (accented when HP is not full).
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
**HP moves / move bars** (2026-10-27): damaging rows expose boxed minimum and maximum endpoints on the closed
row. Either applies that displayed damage to the opposite card through `DMG.hit`, then the user's recoil, drain,
Life Orb and contact costs through `DMG.hp`, using actual dealt damage and damaging hits. Crit, selected hit count,
Z and per-hit inspection affect the endpoints; Sash/Sturdy, berries, Broken and automatic reactions still apply.
The row's second bar contains every crit, hit-cycle, category, move-state and Stockpile control; all closed rows,
including status and multi-hit rows, have equal heights. Nothing sits outside the move card.
Recoil/drain/contact follow-ups are noninteractive unsigned red/green ranges. Status heals/costs, Rest, Wish and
Pain Split retain their one-use action in place of the status row's dash. Crash moves keep their separate miss
button, changing only the user's HP. Open damaging rows have a Damage amount + Apply (number pad in dvkb); rolls
fill that amount. Exact damage retains on-hit reactions without rerolling. The inverse You box is retained for
inferring damage from observed recoil/recovery; its separate Apply recovery amount keeps threshold-only semantics.
None of these amount entries is stored. Fixed damage has equal min/max endpoints and no Power box; Counter / Mirror
Coat / Bide / Metal Burst / Comeuppance still use Taken and show a dash until specified. Stockpile's native 1–3
select is on the bar for Swallow / Spit Up (`ST.st`, scratch, default 1); typed Spit Up power still wins.
**Move → Field / Edit**: profile-offered screens, rooms, weather, terrain and side states have a switch on the move
row (status: instead of the dash; damaging: beside crit). They share the exact Field keys and manual lifecycle.
Own states use the move user's side, hazards/debuffs the opponent's; Dig/Fly/Bounce/Dive/Minimize share the exclusive
Edit battle state. Layered hazards cycle through their legal counts; Helping Hand and Dragon Cheer obey Doubles
availability. Weather/terrain switches select that guide's value and toggle it back to none: Hail sets Snow in EI
and Hardlove, Hail in Photonic/Eternal X. The native Field/Edit control and row switch stay synchronized both ways.
Safeguard is per side where the move exists and blocks automatic opposing status (currently Toxic Spikes entry),
not self-induced Orb/Rest status. Protect is offered wherever a Protect-family move exists, independent of Z support.
Protected incoming attacks show zero / Protected; endpoints and custom Apply do nothing. Feint / move-data bypasses
and Unseen Fist contact bypass fully; Photonic Z damage is quarter strength, including with no held Z-crystal.
Scenarios: `calc-retest`, `calc-moves`, `calc-controls`, `calc-state`, `calc-field-states`, `calc-triple`, `calc-zmove`.
**Hit totals**: collapsed damage sums all selected hits, including Parental Bond. Fixed multi-hit and Parental Bond
share one total/H1/H2/etc. inspection button; ordinary variable-hit moves cycle through legal counts plus a one-hit
inspection. Loaded Dice restricts standard 2-5-hit choices to 1/4/5; Skill Link to 1/max. Loaded Dice makes Population Bomb a 1 / 4-10 cycle
(default 10, its fixed ×10 without the dice); Ash-Greninja's Water Shuriken is a fixed ×3 (the engine gives it power 20). Details retain per-hit rolls.
**Field**: Singles/Doubles, Weather and Terrain are in the fight bar; Field below it (layout: Field layout). Stored `atk*` means Player and `def*` means Foe; the page remaps inputs for foe attacks. Old
attacker-relative state migrates once, using its saved direction. Focus Energy is offered on both sides in every
profile. Weather / terrain layers are manual (this fight), then the most recent entering ability setter, then
deduplicated trainer / section `field` evidence, then none. The first select option is `Auto: <value>` (dashed);
manual selections have an accent border. The source line names area / setter / manual provenance; **Auto** clears
every manual Field override. Simultaneous leads resolve in Speed order, slower setter winning (reversed under
Trick Room; at the same Speed the foe's wins); primal weather resists ordinary setters. `DMG.settings().setterStays` controls whether a departing
setter leaves its layer behind. A fainted entrant sets nothing. Area evidence also supplies foe Tailwind, the
foe's guessed +1 crit, lead-exempt player Spikes / Toxic Spikes and Trick Room. Thunderstorm is Rain + Electric
Terrain; random terrain and Fog are text only. The Area line exposes the original wording on tap / tooltip;
variant labels are ignored. Automatic toggles are dashed, pressed and marked A; tapping makes them manual.
Trick Room is always offered from Gen 4 and reverses the faster-Speed colour, not damage.
Intimidate is a plain checked-by-default header box on its holder (no text; name in tooltip / aria-label); it applies the
engine's net drop / reaction without changing Edit stages, with no mark on the target's card. Orb status is derived through `DMG.derived` and labelled
`Burn (Orb)` / `Toxic (Orb)` in Edit; choosing any status, including None, is a kept override. Ice Face restoration
also comes from the entry API. The boxed damage endpoints apply `DMG.hit` patches (HP, consumed items, stages, toggles, status,
Broken and field events); the user change follows with `DMG.hp` using actual dealt damage / hit count, including
contact costs. Dealt / You Apply uses exact-damage threshold reactions only. Turn end applies `DMG.turn`, including
Speed Boost and eligible berries. An eligible berry has its own HP-line chip (`Sitrus +13`, `Salac Spe+1`), applying
`DMG.berry` once. A crowded HP line with a berry or Intimidate wraps rather than clipping actions or widening the page.
These actions and entry hazards replace a fixed log at the top of the window (three lines, then internal
scrolling; gone 3 s after the last action, held while a long one is touched or scrolled, × closes it at once; 2026-10-28,
the user: the bottom one stayed until dismissed), never adding layout height or saved state. KO notes come from the engine.
Field toggles never break a word: the narrowest box is the widest single word of any toggle (measured in the page's
font at render, so text zoom counts), each toggle grid uses its own measured width and fits as many columns as there is room
(`auto-fit`), so a narrow grid becomes rows. **Field layout** (R3, 2026-10-27), one column at every width: Global
(collapsible, every field-wide toggle incl. Trick Room), then a Player | Foe switch (one side at a time; its active
count on each button; not stored), then that side's ungrouped toggles and its States, Turn end and Hazards groups,
stacked. Each group ends in the standard `.endbar` (`Collapse <group>`, shown only when the open group is taller than
the window; it closes the group and keeps its heading in view). No whole-Field bar (rejected in the R3 mockup).
Fight-bar selects keep their closed text short for 260 px: the auto choice reads the auto value or "Auto" (dashed
border; the full "Auto: …" in its title), the empty choice "None", one-word values instead of long labels ("Sand").
In the preview rows the ability shrinks to an ellipsis first.
**Stackable states** (2026-10-26): `template/calc/field-states.json` defines side controls; `assemble.py` adds only
those supported by the guide's moves / causing abilities and generation (Protect needs a Protect-family move, not `zmove`). The engine accepts
these keys independently of UI availability. Dig / Fly / Dive / Minimized / Switching out remain the exclusive
Edit selection. Other states fold under States, Turn end and Hazards, with active counts; fold state is session-only.
**Grouped by what an entry affects** (2026-10-27): **Global** = every Pokémon on the field (rooms, Gravity, Sports,
Splits, Inverse; in Doubles the auras and Ruins, one toggle each named by the ability: another Pokémon on the field has
it, so it applies to both calc Pokémon; a calc Pokémon holding it keeps the automatic behaviour, is not lowered by its
own Ruin, and the same Ruin doesn't stack). The **side grid** (ungrouped) = the whole side: screens, Tailwind,
Safeguard, Lucky Chant, pledge Sea of Fire / Swamp, Emperor's Presence and the Doubles ally effects (no "Ally" in
labels). **States** = this Pokémon only (Focus Energy, Laser Focus, Charge, Power Trick, Protect, Roost, ...).
**Turn end** = its residuals; **Hazards** as before. `field-states.json` sets the group, also for a hack's own copy of
an entry (`assemble.py:calc_profile`). Ruin keys are `tabletsOfRuin` etc.; saved per-side `atk*/def*OfRuin` migrate on
load (either side on = on) and the engine still reads them. Each state is gated by its moves / abilities, generation
and profile-disabled effects (Dragon Cheer never in Hardlove); Doubles-only entries appear only in Doubles; global
manual choices share the normal Auto / Reset fight / trainer-change lifecycle.
Expanded groups stay inside the one-window Field, scrolling its body when needed; opening a group brings its controls
into view.
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
Orb status is derived on entry unless the user explicitly picked a status (including None). New custom presets
leave status unset, just like a new Pokémon in Edit; an empty status override would suppress the Orb.
**Used items** (`used`) are fight state: kept across switches and reload, cleared on trainer change / Reset fight.
Edit shows `No item (used)` with its effect off (the original item is in the tooltip). This fits at 260 px.
Its selected `@used` option is separate from the real item, so picking even that same item fires a normal set edit
and replaces it, clearing used.
Save keeps set fields only, never HP / status / scratch; Edit Reset clears unsaved edits and scratch. `broken` (Disguise / Ice Face) is kept for the fight on both sides. HP / status
(both sides) only for the current fight. A **trainer change** (bar arrows, Find trainer, a trainer card's Calc link)
clears all scratch, both sides' HP / status, the foe's set edits, `broken` / Mega / used items and the manual Field overrides (`ST.fman`: Field keys the user set
this fight, Singles / Doubles included); the foe team starts at full HP, slot 1 (or the linked Pokémon).
**Reset fight** (↺ in the fight bar): the same (every HP 100 %, every status cleared), same trainer and
Pokémon. Reload keeps HP / status, the foe's of the current fight and the manual Field;
scratch is gone. Loading older storage drops stored scratch everywhere, turns a stored Mega (`pre`) into `mega` and
keeps only HP / status / fight state on player cards not selected. Entry hazards still apply once per selection and on a new fight. Scenario: `tools/scenarios/calc-auto.mjs`.
**Broken** is a labelled header checkbox only for a Mimikyu / Eiscue form with Disguise / Ice Face as its current
and available ability, with abilities enabled and the supported generation. It reads/writes `broken` fight state;
Damage taps / one-use actions tick it via `DMG.hit`. Busted / Noice forms start checked unless explicitly restored.
Switching preserves it; trainer change / Reset fight clears it; Ice Face can restore on entry in Hail / Snow.
Internal set aliases follow trainer data (`l`, `na`, `a`, `i`, `m`); the engine boundary converts them to its
`lv`, `nat`, `ab`, `it`, `st`, six-element `stg` contract. Caps stay in the existing `TCAP` store. Sheets and expanders
are transient; pickers use the shared keyboard/number pad and the viewer's normal select shim.

Import exists only with `profile.save`: a file input calls `READERS[profile.save](bytes, D)` and maps game IDs through
`D.GID` (bypassed with `ids: "ours"`). A Pokémon whose species maps to nothing in the guide (EI's pruned species) is
skipped and counted in the banner ("· 1 not in this guide"); Wrong game only when no party Pokémon maps. Success
atomically replaces the import and clears imported edits/slot overrides; errors retain the old import. In Dex Viewer
the bytes come from the app's save bridge instead (`window.dexViewerApp`, contract: `../thor-offline-viewer/docs/
SAVE_BRIDGE.md`; the file input does nothing there). Nothing imported yet: Import calls `save()`, and `pickSave()` only
when no file is linked. With an import, ↻ Import is refresh: `save()` only, never the picker (it would take focus from
the game); the same file and `modified` as the import gives "No new save" and keeps the edits. Banners get a button
in the viewer: Change file (green) or Pick (red), both `pickSave()`; cancelling keeps everything. Bridge errors: `gone`
"Save file not found", `too-big` "Not a save file", `failed` "Unreadable", `busy` ignored; `save()` null with an
import, "No save file linked". `ST.imp.mod` keeps the save's `modified`; `saveInfo()` on entering the calc puts a dot on
↻ Import when the linked save is newer. Readers and
their formats: `calc/readers/README.md`. `calc/readers/test.js` and `tools/scenarios/fixtures/calc/` supply synthetic JSON saves.
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

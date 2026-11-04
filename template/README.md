# Template

`shell.html`, `dex.css` and `dex.js` are the one template every guide is built from (Emerald Imperium is the reference
build). `assemble.py` inlines them with the hack's `hack.json`, `data.json` and the sprites it uses into
`dist/<hack>.html`, and writes `dist/guides.json` and `dist/index.html`. Nothing about a hack is in the template: a
guide differs only by its data and its `cfg`. The device rules (window sizes, no Android keyboard, `<select>` shim,
lag rules, scroll restore) are the viewer contract: `.agents/skills/rom-hack-offline-dex/references/viewer-ui.md`.

## Item icon helpers

`icon(name, size=24)` returns a decorative inline sheet cell, or `''` for an unmapped exact
item name; `iconCard(name)` returns its 32 px cell or an empty 32 px spacer. `assemble.py` adds `D.IC` (name to
zero-based slot), `--item-sheet` and `--item-rows` from the committed per-guide sheets. See
`sprites/items/sheets/README.md` to regenerate them. No data URI is repeated in rendered markup.

## Pokémon sprites

`spr(id, sizeClass)` returns a `.spr` div with the class `sp-<id>` (unsafe characters escaped); the sprite's first use
adds one rule `.sp-<id>{background-image:url(data:…)}` to a stylesheet appended to `<head>`, so markup stays short and
an image is decoded only when painted. A species with no sprite gets the type-coloured circle (`.sprph`). Rejected
(2026-11-02): a `blob:` URL per sprite, the earlier way; creating the Pokémon list's ~1200 blobs took ~200 ms of
every first open on a desktop (more on the Thor), and nearly half of each check's page open.

## What a hack sets (`hack.json`)

`id`, `title`, `game`, `platform` (GBA / NDS / 3DS), `version` (the `dex-viewer:version` meta tag), and `cfg`:

| Key | What it does |
| --- | --- |
| `name` | The hack's name in wording. |
| `orig` | Tag for hack-original moves / abilities (`''` = none). |
| `evs` | `false` = no EV inputs or EV speeds. MGM shows only when this is on **and** some trainer Pokémon has EVs. |
| `mgm` | `false` = no MGM switch even with EVs on (Unbound, which has no way to turn EVs off; Photonic Sun's EV-less copy). A trainer Pokémon with no `iv`, or no `ev` where EVs count, shows no speed (unknown, not assumed). Speeds always count EVs. Absent = on. |
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
- Locations: the encounter standard (`D.ESV` 2, `AR.es` / `AR.fo`; Encounters below; guides not converted yet keep
  the older `AR.es` per game table or `P.w` methods), a Starter area (`AR[i].st`, tied to the starter picker), area maps
  (`AR.map`), tracker sub-slots (`AR.sub`), areas with no slot (`AR.ns`: encounters shown, `txt.ns` instead of a
  tracker; a saved entry for one drops on load), optional page order `ARO` (areas added later sit at the end of `AR` so
  saved trackers keep their slots).
- Trainers: caps `TR.caps` (hidden when empty), partners `t.pt`, shared battles `t.bt`, starter `t.st` and player `t.pl`
  variants (the player picker shows when any trainer has `pl`), EVs (MGM). `t.normal` adds a collapsed Normal team
  below the default team, with its Normal levels and Easy decrement (`easy`); it has no saved open state or calc
  launch buttons. Absent data renders nothing. `mon.l` is always the displayed level; optional `mon.sl` is the stat
  level (the trainer speed uses it). `mon.hn` lists disagreements as "hzla says ...", independently of sheet `cf`.
- Walkthrough: checklist steps `stop.s` (Next step and Reset checklist show only then), stop notes, cheat codes
  `WK.cheats`, game docs `WK.docs` / `WK.ko`, unplaced items `WK.np`, stop keys `stop.k`.
- Walkthrough missions (Unbound): a `stop.s` entry that is an object, not a `[text, note]` pair,
  `{m: slug, n: name, u: unlock, r: reward, note?, s: [{k, t, n?}]}`, is a mission card at that place in the stop's
  checklist (`misHTML`). `m` is unique in the guide and never changes once published (the wiki slug, not a title or an
  order); each step `k` never changes within its mission (an action or target name, not a position or a hash).
  `tools/schema.py` rejects missing / repeated keys and empty step lists; at runtime a malformed mission or a repeated
  slug is left out, nothing is invented. One leaf list (`stopLeaves`: ordinary steps, then each mission's steps at its
  place) drives every count, Next step, search and reset. Saved in `LS.walk` → `missions: {slug: {o: open, c: {stepKey:
  1}}}` (absent until a mission is used; an old save without it loads unchanged). Ordinary steps keep their keys
  (`split.stop.j`, j counting only the pairs), so missions placed among them shift nothing. A record whose mission or
  step is gone stays in the save, unused, and comes back with its key; a new step starts unticked, a moved or renamed
  mission keeps its state. Reset clears every mission's ticks (orphans too) and keeps open states. Search recents
  `{k:'ms', m, c?}` and scroll anchors (`details.wmis[data-m]`) go by slug; a gone step falls back to its mission, a
  gone mission's recent drops. Checks: `tools/scenarios/walk-missions.mjs`, the snapshot in `guide-update.mjs`.
- **Rule:** saved state never stores a position in the data (an index into `M` / `MV` / `AB` / `P` / `LOC` / `TR` / `WK` / `IT`). It stores
  names or stable keys, maps them back on load, says what happens when one is gone, and keeps loading older formats
  (below). `tools/scenarios/guide-update.mjs` checks it on every guide with a copy whose every index is shifted; a new
  kind of saved state goes in that scenario's snapshot.
- Saved walkthrough state is keyed by stop key: when a hack regroups its stops, `migrateWalkState` moves saved ticks,
  open state and scroll anchors to the new positions (`tools/walk-state-check.mjs` tests it). Give every new stop a
  key that never changes; cutting a stop in two keeps the key on the first part and adds `.fN` to the others.
- Saved moves, abilities, species and places are stored by name, not by their position in `M` / `AB` / `P` / `LOC`, so
  an update that inserts one (Hardlove 0.8.5 inserted Raging Bull at move 767) keeps them: the calc's sets (custom,
  imported, edits, saved, a Mega's form; a set's species as `sn` beside its `id`) and the Pokémon list's filters.
  `nameOf` / `idxOf` (dex.js) map them; a repeated name (Hardlove's duplicate ability slots, Photonic Sun's Z-moves,
  EI's two As One, Glastrier's and Spectrier's) carries its occurrence (`Swarm#2`). In memory they stay this build's indices. On load a gone move
  empties its slot, a gone ability falls back to the species' first, a gone species drops the set (an edit: the species
  edit), a gone filter drops; numbers (state saved before names, `a: -1` = no ability) load as indices.
  Scenario: `calc-persist.mjs` → 26c.
- The rest of the saved state is stored by identity too, so a guide update keeps it (scenario `stable-keys.mjs` → 27a-d):
  - Trainer keys `k` are stable (the extract's key table, `tools/trainer_keys.py`): level caps, the Trainers page's open
    trainers, the calc's foe, recent trainers, foe edits (`foe:<k>:<slot>`), copied foes (`f:<k>:<slot>`) and search
    recents need nothing in the template.
  - Species: the Dex stat calc (`cfg.ls.calc` + `:` + name, `calcKey`) and the tracker's caught / traded species
    (`spOut` / `spIn`; the backup code too) by name, the Extra card's rows too (`TK.x`; a species the guide no longer
    has keeps its row and shows its stored name). A stat calc key by species id moves to the name once on load;
    tracker ids load as before.
  - Search recents: a species, move, ability or place filter by name, a walkthrough stop by its key (`w`), an item by
    its box and row names (`recOut` / `recIn`); a stop saved by position takes its key from the layout it was saved
    under, other positions and ids load as they are, a gone one drops.
  - Open boxes saved by position (Trainers `o` / `p`, Items `o` / `x` / `s`, Locations `x` / `s`) keep the box and
    place names they were saved under (`layout`); `relayout` moves them to the positions those names have now.
  - The reopen route (`cfg.ls.pos`) names its Pokémon, move, ability or place page (`n`) and its anchor's link (`an`);
    when that moved, the route follows the name (gone: the Pokémon list).
  - The Pokémon page's open sections (`cfg.ls.dex` → `o`, beside the list filters): section names (`PSECS`), only those
    that differ from the default; an unknown name is dropped, a missing one takes its default.
  Tracker areas (`AR` indexes, append-only) and walkthrough state (stop keys, `migrateWalkState`) were stable already.

## Shared rules every guide follows

**Browser floor: Chrome 109** (the Thor's WebView). Write CSS / JS that runs there: no `@scope` (calc.css scopes its
rules with a `:where(body.calc-route)` prefix, `:where(body).calc-route` for the root, the same specificity), no CSS
nesting, `color-mix()` only after a plain declaration of the same property. The list and the check:
`tools/compatlint.py`; the contract: the skill's `references/viewer-ui.md` → The window.

The extract helpers apply most of these rules.
- Species that are neither obtainable nor used by a trainer are left out (Megas / forms too).
- Trainers boxes are cap splits named `<Boss> Split [Cap N]`, then `Elite Four Split [Cap N]`, then `Post-game`
  (`tools/splits.py`). One cap list, mini caps included. The walkthrough's splits are the same boxes, and the
  Trainers page lists them in walkthrough order (`extractlib.trainers_follow_walk`; `tools/tabs_check.py` checks it).
- Items: one box set, sub-headings and row style for every guide (`tools/itemstd.py`, rules in its docstring): the
  boxes are item kinds, each item is one row (shops fold in as Shop lines), one line per pickup labelled Found (in the
  world) / Also (given, reward, raid drop) / Shop (bought); a walkthrough row matches the Items line of the same item
  at the same place and shares its pickup key (`tools/pickup_keys.py`). One spelling per item, item text and In battle
  text: `tools/item_text.py` (bag text pooled across guides, `tools/battle_text/` by generation).
- A Starter area on Locations, listed first.

## Page design

### Damage calculator

`cfg.calc.ai: "hardlove"` opts Hardlove into its command AI. `assemble.py` adds the standalone
`template/calc/ai/hardlove.js` bundle, `ai/ui.js` adapter and `ai/ui.css` only for that profile; other guides do not
include those resources. Rebuild the committed bundle with `node tools/calc/build_ai.mjs` after AI module changes
(the assembly/Pages build stays Python-stdlib-only). The damage engine and its numbers are independent of the AI.
Foe move rows, including status rows, have a 30 px odds/score column (12 px bold percent, 9 px muted score; zero
muted, `A` for ally-only scores, `Lock` for a locked move). The largest displayed percent gets the 3 px accent bar.
Closed rows stay 32 px; move names give up space first. In doubles the displayed percent is the move into the viewed
player, or its ally-only percent; expanded rows list every target and the score distribution's base/bonus branches.
In singles a nonzero hard-switch chance appears as `Sw 13%` on the foe card, just before the battle-state tag and
placed as one (narrow: the last line; `.sup` moves both to the HP line, `.swdn` puts Sw back when both don't fit). Move odds plus Sw total 100.
`CALC.ai` exposes the adapter, explicit per-mon scratch `facts`, stable implicit active slots and cached engine
results. Nothing in AI state or returned party indices is saved. Facts default to inactive/unknown; first-turn-out
defaults true on entry and false after a damage tap to/from the viewed mon. Card reset, a switch away, fight reset and
gauntlet battle changes clear the appropriate facts. See Hardlove's notes for the input/default boundary; field facts
the calc already models are never duplicated as AI toggles.

With the AI on, both grids are AI grids (`.aigrid`, display only: the saved team order never changes). Narrow, they
read down, then right (3 x 2); wide, the same order runs along my row and down the foe rows. Foe: singles r1c1 is the
foe on the field (a picked foe moves there), then the switch-in order (`switchInOrder`; Zoroark's random bonus: the
most likely whole order), fainted last and grey; doubles column 1 is the two on the field (a 1 px line after it),
column 2 the first / second replacement (the double-KO pick), column 3 the rest, fainted last. Each benched, living
foe has its rank (1 = next out) as a 9 px accent number at the top left. Mine: party order in singles; in doubles my
two on the field first, then the bench in party order. The order is recomputed on every render, so cells move: for
350 ms after a reorder a tap in that grid counts as a tap on the Pokémon tapped last (a double tap still opens its dex
page) and any other tap is ignored. Doubles: a tap on an on-field Pokémon views it; a bench tap takes the viewed
one's cell (a foe replacement takes a fainted foe's cell); no slot-swap control (Hardlove's numbers ignore the slot).

Field → AI is the first Field section, above Global; open state as the other groups (`FIELDOPEN`, not saved). A
Player / Foe segment, then two-column toggles for that side's viewed on-field Pokémon: battle facts the AI reads that
the calc can't know (the list and the C fields: Hardlove's notes). First turn is Auto (dashed, `·A`) until tapped; a
derived fact (Can't escape from a trapping ability) shows the same way. Encored / Disabled / Torment wait for Last
move (a select of its moves; it also feeds a Choice item's lock); clearing Last move clears them. Any change
recomputes the odds, Sw, scores and the bench ranks. The toggles are battle scratch: cleared as the facts above.

Profiles may declare `monControls` (`k`, `l`, `abilities`) for per-Pokémon battle-state checkboxes. EI uses
`abilityOn` for First turn out (Bull/Quill Rush) and Disguised (Illusion); off is the default. Ability controls sit on
the card's header line, left of Edit, no taller than Edit (the card keeps the height of one without them), with an
accessible label and tooltip: these checkboxes, the Intrepid Sword / Dauntless Shield box (checked = on, the default)
and the Download button. Edit itself is the same for every Pokémon. Changing ability or
Mega form clears this state. Controls do not change the attack direction. `categoryInvert` names moves with an
Invert category checkbox in their move details: a compact P/S · A/I button in the second move bar also toggles it while collapsed.
The tooltip spells out category, Auto/Inverted and ties. The ability boxes are battle state (scratch, see Fight
state); the category flag is a per-slot move override and is stored. EI also exposes allied Emperor's Presence per side;
it only affects doubles. Effective priority is an
engine result, not a claim about which move should happen first; the faster Speed colour is the current UI.
Opening Edit at wide sizes opens both populated editors; closing either closes both. Full form names appear inside
Edit. The team area's height is based on closed cards and move rows, so edits/residuals never enlarge it or change
the team from rows to a strip. Editors and expanded moves grow downwards; Field follows the whole moveset.
No condition labels or category controls appear in profiles that do not declare them.

**Both teams in the first frame:** at every viewer size the first frame shows my team, the
foe's team, both cards, the attacker's four moves (wide: both lists) and the fight bar at once. Both sprite grids keep
six columns. **Narrow (< 480):** box (unchanged), then the trainer bar (22 px, no panel border), the fight bar (S / D,
weather, terrain, ↺; 20 px, its buttons too: accepted below the 26 px tap size; 22 until 2026-10-31), my team (3 × 2)
facing the foe strip (3 × 2), the two cards side by side, the moves (closed rows 32 px, two lines: Move rows). The first frame is the page scrolled to the trainer
bar (`openMatch`). **Card** (narrow, both sides; class `named`): line 0 the name, M, the ability boxes and Speed (no label) at the
right, the name truncating as far as needed; line 1 ↺, HP box, `/max`, ✎; the HP bar under it; line 2 (only when it
has something) the battle-state tag (Dig, Fly, ...), Aura and the berry chip (or, while offered, the hazard chip in its
place) at the left, T + Toxic box and residual at the right. State / Aura never sit on the name line. (Until 2026-10-31 the name showed only for a Pokémon not in
the team row; the user wants it always.) **At most
three lines, always**: `fitCards()` measures each narrow card (render, resize, size change: text zoom fires
no resize); one that takes more moves Aura up (the ability / Speed line, or after `/max` on a named card: Aura is the
rarest tag and about stages), then the battle state the same way, then goes tight (1 px gaps, Aura as "A"). No name line while Edit is open; an open card
spans both columns. Lv sits on the team cell (the Lv box only in Edit). No Intimidate mark on any card: the holder's box is the only sign. **Wide (≥ 480):** left column = box panel with my team row under the grid (1 px line), then the fight bar; right
column = the trainer panel, whose preview (two-line rows, 25 px, all six always visible, no scrolling; tap = pick that
foe) is the foe's team (no strip); the cards (named, ~48 px) and both move lists pinned to the bottom of the window.
Jump arrows (`CALC.stops()`): top, the first frame (trainer bar − 2, narrow), the fourth move's bottom when an open row
or editor pushes it ≥ 24 px past that, and Field (always, clamped); stops within 24 px merge.
Field's open box (capped to the window by `fitToggles`) and the box grid scroll inside but pass the wheel / drag on
to the page at their ends (no `overscroll-behavior:contain`: with it the mouse wheel over Field never moved the page).
**Short-wide (480+ wide and under 392 tall,** e.g. 480 × 316, 537 × 360): the narrow page's top with the wide match.
Box (`.mg`, 136 px, the grid scrolls inside) above the fold, then the trainer bar and the battle-state row sharing
one line, my team and the foe strip one row of six each (the narrow cells), then the wide cards, editors and two move
columns; no blank band above Field. Opening the calc scrolls to the trainer bar (as far as the page goes: at 480 × 316
the box's bottom still shows above it) and the rail has the narrow stops.
`shortWide()` sets `body.calc-short` on load and resize, not a media query, and leaves it alone while a calc input or
select has focus (a phone keyboard resizes the window); the page-top and scrolling tests (`stops`, `openMatch`, drag
auto-scroll: `narrowTop()`) treat it as narrow, the card and editor tests (`fitCards`, `eopen`, the editors' resize
handler) stay width-only. At 392 tall and up nothing changes (480 × 392 keeps the box beside the trainer list and fits
four rows). Rejected (prototype, 2026-10-31): the full wide page at these sizes.
**Move rows**: a closed damaging row is two lines, 32 px. Line 1: type dot + move name (shrinks first, `…`), the KO
text (`.ko`, 10 px, its colour; shrinks second), the min–max buttons (`.hp`, never shrink) at the right. Line 2: Z,
the HP / miss chip, the % range (10 px bold), the effect odds (grey, the rest of the line, `…`), the move controls
(H1 / ×n, category, state, toggles, C) at the right. Built in CSS only: `.mm` is a wrapping flex row, `.r1` / `.r2`
are `display:contents`, `order` puts the KO between the name and `.hp`, `.mm::after` breaks the line. Status rows
and empty slots keep name | right slot (Not modelled chip, Z then the slot in Z profiles) at the same 32 px, so
side-by-side columns line up; the opened row (`.dd`) follows line 2 at full width. The user reads the odds as "there
is an effect": cut odds are fine, the open row lists them all. Rejected (prototype): three lines (odds alone on line
3, every slot 41 px so the columns line up) and the earlier rows (range, KO and odds sharing line 2).
**My team row**: `team: [{src, pid}]` (≤ 6, dense) in `cfg.ls.dmg`, resolved by pid (imported: party then boxes;
custom: `ST.custom`); entries that no longer resolve drop out. Imports never fill or change it (the user): it is built
by drag and drop only. Tap a team cell = send it in (as a box tap). Pointer-event drag (HTML5 drag doesn't fire on
touch): touch / pen hold 250 ms without moving 8 px (moving first scrolls), mouse 5 px; box → empty slot appends, →
filled slot replaces, already in the team → swap; team → slot swaps (empty slot: to the end), → outside the row
removes (red × on the floating copy); the click right after a drop is swallowed (400 ms); narrow auto-scrolls at the
edges. Box cells in the team carry a 5 px accent dot. Mega is the card's M, never a second entry. **Foe Pokémon to my
team** (for a partner's team in a multi): a foe strip cell (narrow) or foe row (wide) dragged onto
the team row becomes a custom set copied from the trainer's (pid `f:<trainer>:<slot>`, once: a second drop moves it),
listed with the other custom sets; dropped anywhere else nothing happens, and a tap still picks the foe.
**HP bar and fainted** on every team cell (my row, the foe strip, the wide preview rows): a 2 px bar in the card HP
bar's colours (green, yellow ≤ 50 %, red ≤ 20 %), and a grey sprite at 0 HP; ↺ Reset fight and a trainer change
refill HP and clear status on both sides (see Fight state).
**Auto Doubles**: a trainer whose data carries a `gameType: Doubles` field record (`tools/trainer_fields.py`
`DOUBLES_TAGS` / partners: double, multi, 2on2, triple (the calc has no triples) tags or `pt` partners; not Back2Back,
not Rotation) opens in D automatically (dashed outline only, no A mark; tooltip and Area line name the tag); tapping S / D is manual for
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

**Turn end**: `DMG.residual(set, field)` supplies each side's parts; engine rules live in
`tools/calc/README.md` → Public contract. KO text counts the defender's per-turn change; rolls, percentages
and damage endpoints do not. Tap the residual amount on the HP line to apply one turn without opening Edit
or selecting the attacker. Toxic's 1–15 turn box (`T`) sits before it and advances on application, capped at 15.
Inside Edit the parts fold behind Turn end on the Battle state row (per card, not stored), so they never make
the open card taller than one window. An opened move repeats the parts (`Turn end: −2 Sandstorm`).
Leech Seed is the side's Seeded state. The ↺ button restores full HP (accented when HP is not full).
**Protean / Libero**: the attacker takes each move's type (STAB in every base); the edit menu
of a Pokémon with either ability has a Type row (own types or one of the 18) used when it defends; a dot in that type's colour
marks the card. Scratch `pty`; ability / Mega change clears it. Scenario: `tools/scenarios/calc-residual.mjs`.
**Battle state**: per-row toggles, earlier-use counters, partner pledges (Doubles only) and Metronome share the
second move bar with Crit, without growing the row. Hack `over.state: false` suppresses a move's control; `curl: false`
suppresses Defense Curl in Rollout/Ice Ball details. A move's own control wins over the item's Metronome counter.
State is `ST.st[slotKey]`; target Dig/Fly/Dive/Minimized/Switching is `ST.tgt[cardKey]` in Edit (both scratch, never
stored). Changing a move clears
that slot, import clears imported Pokémon's state, and Reset power/type clears only those two overrides.
Download cycles Auto (with its actual stat), Atk, Sp. Atk, None, shown as `A·Atk` / `A·SpA`, `M·Atk`, `M·SpA`, `None`
(tooltip spells it out).
Details show used/listed/typed power, crit chance/stage and first-/between-hit changes; the move's own changes alone
can be omitted. Forced crit locks C on; blocked crit disables it. No new localStorage key is used.
**HP moves / move bars**: damaging rows expose boxed minimum and maximum endpoints on the closed
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
Safeguard is per side where the move exists and blocks opposing status (Toxic Spikes from the hazard chip too),
not self-induced Orb/Rest status. Protect is offered wherever a Protect-family move exists, independent of Z support.
Protected incoming attacks show zero / Protected; endpoints and custom Apply do nothing. Feint / move-data bypasses
and Unseen Fist contact bypass fully; Photonic Z damage is quarter strength, including with no held Z-crystal.
Scenarios: `calc-retest`, `calc-moves`, `calc-controls`, `calc-state`, `calc-field-states`, `calc-triple`, `calc-zmove`.
**Hit totals**: collapsed damage sums all selected hits, including Parental Bond. Fixed multi-hit and Parental Bond
share one total/H1/H2/etc. inspection button; ordinary variable-hit moves cycle through legal counts plus a one-hit
inspection. Loaded Dice restricts standard 2-5-hit choices to 1/4/5; Skill Link to 1/max. Loaded Dice makes Population Bomb a 1 / 4-10 cycle
(default 10, its fixed ×10 without the dice); Ash-Greninja's Water Shuriken is a fixed ×3 (the engine gives it power 20). Details retain per-hit rolls.
**Move effects** (every guide; engine: `tools/calc/README.md` → Move effects): a status move's "—" is a button
showing what it does now, for the side that owns the row (a foe's Swords Dance raises the foe): `Atk+2`,
`SpA SpD+1`, `+1 ×3`, `+2 −1` (Shell Smash), `Def−1`, `Par` / `Brn` / `Psn` / `Tox` / `Slp` / `Frz`, `Conf`,
green for raises, red for drops and status; `Fails` (muted, reason in the title, a tap logs it and changes nothing)
when the game's move would fail (immune type, Limber, Mist, +6, already statused, ...). An HP part joins the same
button (`Atk+6 −50` Belly Drum). The button is the size of a damage endpoint, so closed status rows keep a damaging
row's height (also the HP chips, which were 4 px taller). Moves with a Field / Edit switch keep it; switching it on
also applies the move's other parts (Charge's SpD +1). Damaging moves get no new control: their guaranteed effects
(Close Combat's drops, Nuzzle's paralysis, Knock Off, a 50 % effect under Serene Grace) apply with the damage
endpoints, the custom Damage Apply and the damaging Use; the opened row says `After: …`. Chance effects never apply.
Unsupported status moves use a small disabled **Not modelled** chip in the existing right slot. Their opened row
shows `Not modelled: <reason>` as wrapping text, never a hover-only tooltip. A partly implemented move keeps its
damage / effect / HP / Field control and puts the missing part's reason only in the opened row (U-turn: switching).
Splash and other genuine battle no-ops show **No effect**, with the explanation in the opened row. The shared
reason / no-op table is `tools/calc/move-coverage.json`; `effects_coverage.mjs --all` checks all six guides.
Speed Swap's raw Speed is scratch battle state (`rs`), used in the card stats and engine and cleared by ↺;
Rest uses the resolver's sleep checks, full healing and berry reactions rather than an unconditional HP-only tap.
**Effect odds**: a damaging row's closed line 2 shows its `MV.se` added effects after the range (`30% paralysis`,
`10% burn, 10% flinch`, `100% target Atk −1`): the chances and the lower-case stage / status / flinch parts (recoil,
drain and heal are the HP chips), as the user has them: Serene Grace / Rainbow double a chance (`DMG.secondaryChance`),
Sheer Force (Gen 5+) removes the secondaries but not the user's own 100 % drops. One layout at every width: the odds
shrink first and end in `…` (the range and controls stay whole); the opened row lists them all (`Effects: …`).
**KO chance**: the closed row's KO text (`2HKO 43%`) can be cut off at 260 px, so the opened row always starts with
it in full (`43.2% chance to 2HKO`, `Guaranteed OHKO`, `No KO in 4 hits`; none when immune or fainted). Not a
`title`: no tooltip shows on Android / the Thor.
Text only. **Fight changes**: moves that change a type, ability or item do it for this fight only (FIGHT fields
`ft` types, `fadd` an added type, `fa` ability (`''` suppressed), `fi` item (`''` none); all names): Soak /
Magic Powder / Camouflage / Conversion / Reflect Type / Burn Up / Double Shock, Trick-or-Treat / Forest's Curse (the
added type replaces the last one), Worry Seed / Simple Beam / Entrainment / Role Play / Doodle / Skill Swap (both),
Gastro Acid / Core Enforcer (suppressed), Trick / Switcheroo (both), Bestow, Thief / Covet (the user gets the item;
the target's loss stays `used` like Knock Off / Incinerate / Bug Bite), Mummy / Lingering Aroma / Wandering Spirit on
a contact hit. The fail reasons are the resolver's (`tools/calc/README.md` → Move effects). Conversion 2 (random)
only logs. By hand, for any Pokémon: **Fight…** beside the battle state in Edit opens one searchable sheet (types
`Becomes` / `+Adds`, abilities with No ability, items with No item). The card shows **Δn** (n changes; narrow: first
on the card's third line, before the battle state / Aura / berry; wide: in the HP line after `/max`); a tap opens its
chips under the card (`Water`, `+Ghost`, `Insomnia`, `No ability`, `Item: Leftovers`, `No item`; Δn filled,
`aria-expanded`), again closes them; a chip tap clears that one, and at 0 the button and the row go. Open is per side in
memory (`FXOPEN`: the side's key), closed on load, kept across re-renders, shut when n is 0 or the side's Pokémon
changes. Rejected (prototype): the chips always on the card (as before); no sheet or new screen for them. ↺ and
Reset fight clear them all; Edit keeps showing the set's ability and item, and Save never stores them. Saved state:
names; a type or ability the guide lacks drops on load (`fightIn`). Not stored or not tracked (logged): accuracy /
evasion, confusion and other volatiles, switching. Mist is a side state (`atkMist` / `defMist`, beside Safeguard).
Stages, status, `used` and HP are the existing per-Pokémon battle state. Scenarios: `calc-effects`,
`calc-fight-state`.
**Field**: Singles/Doubles, Weather and Terrain are in the fight bar; Field below it (layout: Field layout). Stored `atk*` means Player and `def*` means Foe; the page remaps inputs for foe attacks. Old
attacker-relative state migrates once, using its saved direction. Focus Energy is offered on both sides in every
profile. Weather / terrain layers are manual (this fight), then the most recent entering ability setter, then
deduplicated trainer / section `field` evidence, then none. The first select option is `Auto: <value>` (dashed);
manual selections have an accent border. The source line names area / setter / manual provenance; **Auto** clears
every manual Field override. Simultaneous leads resolve in Speed order, slower setter winning (reversed under
Trick Room; at the same Speed the foe's wins); primal weather resists ordinary setters. `DMG.settings().setterStays` controls whether a departing
setter leaves its layer behind. A fainted entrant sets nothing. Area evidence also supplies foe Tailwind, the
foe's guessed +1 crit, lead-exempt player Spikes / Toxic Spikes and Trick Room. Thunderstorm is Rain + Electric
Terrain; random terrain and Fog are text only (Fog is a weather where the profile offers it: below). The Area line exposes the original wording on tap / tooltip;
variant labels are ignored. Automatic Field toggles are dashed, pressed and marked A; tapping makes them manual.
The fight bar's automatic D is the exception: dashed outline only.
Trick Room is always offered from Gen 4 and reverses the faster-Speed colour, not damage.

**Calc UI: area rules** (Unbound, 2026-10-30; `hacks/unbound/notes.md` → Unit 8c gimmicks). Named trainer / section effects drive
the engine, never a second damage path in the page: `speed-rule Weight`, `typing Camomons`, `battle-rule Inverse`,
`field-rule` Shadowy Veil / Negative Energy / Pixies / Rainbow Battle turn on the profile's Global toggles (auto, A
mark, tap = manual). `typed-side-condition` (Tailwind / Magnet Rise for listed types, both sides) and a locked
weather (`locked:true`) become runtime values (`AREARULES`: `atk/def…Types`, `weatherLock`) that `battleField()`
adds to the stored field; they are rebuilt by `updateField`, never saved. A lock beats every weather layer (select
disabled, setters, actions, an old manual save). With a Fog option in the profile, area Fog is the bottom weather
layer: a manual / setter weather covers it, **Defog** (its Use on the move row: the effect chip, or Clear Fog in a profile without Defog's effect) clears it for the fight. The
Global group lists an area switch per typed rule / lock / Fog (on = applies); the switches and Defog are saved in
`ST.areaByTrainer[t.k] = {disabled:{'kind:value:side':true}, fogCleared}` (trainer key + effect name; created only
when used, cleared by `newFight` / Reset fight). Field readouts (`.dfrule`) give each side's state: Tailwind / Magnet
Rise active / not that type / grounded, Camomons types, Weight Speed, Fog accuracy, Shadowy Veil eligibility, Pixies
boost, Rainbow chances. Camomons takes each side's first two moves (`toEngine` passes `moves`; a duplicate type counts
twice, as the official calc); with a first move unknown the results wait ("Choose first move for Camomons").
**Assumed sets** (`cfg.calc.assumedSets: 'level-up'`): a `Moves unknown` trainer's mon without source moves gets the
last four distinct level-up moves at its level (`dex.js` `guessMoves`), Hardy, 31 IVs, 0 EVs in the calc (`foeBase`),
each marked `?` until that field is edited. The trainer card shows the same guessed moves in italics with `?` and keeps
its `Moves unknown` tag (the user, 2026-10-30); a card Pokémon with no source IVs / EVs gets its Speed from the
same guess (31 IVs, 0 EVs, neutral nature), marked `?` (`monCard`); foe edits remember their species (`ST.foeSp`) and drop when another species is in the
slot after an update. **Import** maps party and boxes before refusing: a boxes-only save imports and starts on the
first box Pokémon; empty = no Pokémon anywhere, wrong = none in this guide; a refused file keeps the previous import.
Intimidate is a plain checked-by-default header box on its holder (no text; name in tooltip / aria-label); it applies the
engine's net drop / reaction without changing Edit stages, with no mark on the target's card. Orb status is derived through `DMG.derived` and labelled
`Burn (Orb)` / `Toxic (Orb)` in Edit; choosing any status, including None, is a kept override. Ice Face restoration
also comes from the entry API. The boxed damage endpoints apply `DMG.hit` patches (HP, consumed items, stages, toggles, status,
Broken and field events); the user change follows with `DMG.hp` using actual dealt damage / hit count, including
contact costs. Dealt / You Apply uses exact-damage threshold reactions only. Turn end applies `DMG.turn`, including
Speed Boost and eligible berries. An eligible berry has its own HP-line chip (`Sitrus +13`, `Salac Spe+1`), applying
`DMG.berry` once; while the hazard chip is offered it takes that spot instead (Entry hazards). A crowded card fits its berry action without clipping or widening the page; Intimidate has no target mark.
These actions and the hazard chip replace a fixed log at the top of the window (three lines, then internal
scrolling; gone 3 s after the last action, held while a long one is touched or scrolled, × closes it at once), never adding layout height or saved state. KO notes come from the engine.
Field toggles never break a word: the narrowest box is the widest single word of any toggle (measured in the page's
font at render, so text zoom counts), each toggle grid uses its own measured width and fits as many columns as there is room
(`auto-fit`), so a narrow grid becomes rows. **Field layout**, one column at every width: Global
(collapsible, every field-wide toggle incl. Trick Room), then a Player | Foe switch (one side at a time; its active
count on each button; not stored), then that side's ungrouped toggles and its States, Turn end and Hazards groups,
stacked. Each group ends in the standard `.endbar` (`Collapse <group>`, shown only when the open group is taller than
the window; it closes the group and keeps its heading in view). No whole-Field bar: each group owns its collapse control.
Fight-bar selects keep their closed text short for 260 px: the auto choice reads the auto value or "Auto" (dashed
border; the full "Auto: …" in its title), the empty choice "None", one-word values instead of long labels ("Sand").
In the preview rows the ability shrinks to an ellipsis first.
**Stackable states**: `template/calc/field-states.json` defines side controls; `assemble.py` adds only
those supported by the guide's moves / causing abilities and generation (Protect needs a Protect-family move, not `zmove`). The engine accepts
these keys independently of UI availability. Dig / Fly / Dive / Minimized / Switching out remain the exclusive
Edit selection. Other states fold under States, Turn end and Hazards, with active counts; fold state is session-only.
**Grouped by what an entry affects**: **Global** = every Pokémon on the field (rooms, Gravity, Sports,
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
Turn-end parts include trapping (the opposing holder's Binding Band), Leech Seed transfer (Big Root / Liquid
Ooze / Magic Guard), Salt Cure, Ghost Curse, sleeping Nightmare, Ingrain, Aqua Ring, pledge fire and automatic Bad
Dreams. Speed uses the engine's final field-aware value, including Swamp. All side utilities use fixed Player/Foe
prefixes; attack calculation still remaps them for the chosen direction.
**Entry hazards** never apply by themselves (the user, 2026-10-31): picking a Pokémon (team cell, box, foe strip, a
switch), a trainer's `after-first-send-out` hazards, redraw, direction change and reload change no HP, status or stage.
While a Pokémon is freshly in with hazards on its side that would do something to it, its card shows the **hazard
chip** in the berry chip's spot (narrow and wide; only one chip there, the card keeps its three lines). The label is the
net HP change the tap makes, hazards and an at-once berry together (`−37`, `+12`, `±0`), no "Hazards" text; with no HP
part, the other changes (`Psn`, `Tox`, `Spe−1`, `Tox Spe−1`, `Lum`, `White Herb`, `Absorb`). Title / aria-label give the
breakdown (each hazard, blockers, status, drop, item). One tap applies it all (`DMG.hazards`, `tools/calc/README.md` →
Entry hazards): Rocks (type-scaled) / Spikes damage, Toxic Spikes' status, Sticky Web's −1 from a fresh stage 0
whatever the card's Speed stage (−2 Simple, +1 Contrary; through the resolver: Clear Body, Defiant, Mirror Armor,
White Herb ...; a blocked Web leaves the stage), a grounded Poison type absorbing Toxic Spikes
(the Field layer goes to 0, manual), then a pinch / HP / cure berry it triggers (at once in every generation).
**Offered** (`ST.hzOffer[side]` = the card key): a Pokémon picked after another one was in on that side, ↺ on its
card, Reset fight / a trainer change (both sides; not the player's lead when the trainer's hazards come after the first
send-out). **A tap on the Pokémon already in** (box, team or foe cell) toggles the hazards in the chip
(`{k, off:true}`, kept with the offer across reload): off, the berry chip (if one is in range) shows alone, with
none the spot is empty; the next tap brings them back. With no offer (used or cleared), that tap offers them again,
hazards in. Nothing else changes. **Edits keep it** (HP, status, stages, level, set): the chip recomputes, so "it came
in at 60 %" is an HP edit, then the tap. **Gone** once tapped or on a battle action: a move / damage tap on either side
(Use, effect buttons, endpoints, Damage / You Apply, crash, a move switch: both cards), its turn end or a residual
part. Then the berry chip, if any, is back. Field's layer toggles only configure the field (0-3 / 0-2) and never re-offer; while offered, the chip follows
them. No Apply hazards button. Older builds stored applied-markers (`hazardEntry`): dropped on load, nothing applies.
Hazards never appear in turn-end parts or the HP-line residual amount. Steelsurge is engine-only, with no control in any
current or planned guide.
Checks: `tools/scenarios/calc-field-states.mjs` (entry lifecycle, entry immunity edits, sides and residuals),
`calc-auto.mjs` (lead exemption), `guide-update.mjs` (the offer), `tools/calc/effects_check.mjs` (blockers, berries).
plus `tools/calc/test.mjs` (mechanics and generation splits).
**One window**: an open card (Edit), the open Field and an open move each fit one window at the minimum height
(316 px) at every width: the full name shares its line with Save/Reset, Type/Power/Hits share a row, the move's full
name shares its line with Change (and Reset), per-hit range and rolls share a line. Check: `calc-state.mjs` one-window.
Text zoom scales every font; box heights are fixed px. A hidden probe re-measures the toggle widths when the font size
changes. **Search**: Find trainer and Find yours also match a set's moves, held item and known ability (a trainer:
any of its Pokémon's) and, Find trainer, its location; names rank first, and a term match is named on the row (a location
match isn't: the row already shows it).
Scenario: `tools/scenarios/calc-state.mjs`; trainer Metronome top-slot conflicts: `tools/calc_ui_check.py`.
**Z-moves** (profile `zmove`, Photonic and Unbound): each damaging row's % line has a Z toggle, centred under the
row's type dot (a shared 20 px column keeps the name and % text aligned). Z before the name was rejected because
it cut long names at 260 px. On: the row shows the Z-move's name in the accent colour and its damage
(slot `z`, one hit: no ×n / Hits); the opened row says "Z-move of <move>". Stored per slot in `ST.z`,
cleared with the slot's move. A status row whose move has a Z effect gets the same toggle in its `.r2` line; on, the
opened row says the effect ("Z: Atk +3", "Z: full heal", "Z: lowered stats reset") and the use chip applies it before
the move (Z-Splash +3 Atk; Z-Belly Drum heals, then pays half). Profiles without `zmove` have no Z control.
**Totem auras** (data `au`, five stages): the Trainers card tags the Totem ("Aura Def +1", "Aura +2 all"); in the calc
its stages start at the aura, with an "Aura" mark while unchanged (Reset brings it back).
Narrow placement follows the three-line card rules above. Scenario: `tools/scenarios/calc-zmove.mjs`.

`#/calc` is implemented by `calc.js` and `calc.css`; `assemble.py` includes these and `calc/engine.js` only with
`cfg.calc`. The resolved profile supplies the level and stage bounds, status choices, nature/ability/item switches,
field entries, multi-hit ranges and variable-power moves. The page calls `DMG.init`, `DMG.stats` and `DMG.calc`;
damage rolls and KO probabilities come from the adapter, not page-side mechanics. Weight / HP / speed moves (Low Kick, Flail, Gyro
Ball, ...) get their power from the engine (`r.bp`, shown in the row's Power box, which still overrides); Return /
Frustration show 102 (maximum happiness); the other variable-power moves show — until a power is set.
Effective Speed uses the optional `DMG.speed(set, field)` hook; without it, the fallback applies stages only.
The real adapter must provide that hook for paralysis and other game-specific Speed modifiers.
When the adapter returns `per`, the expander shows each hit's rolls; aggregate HP subtraction and best-move ranking
sum those per-hit ranges, while percentages and KO text use the adapter's already aggregated values.

Mine (party, boxes, custom sets), selection, unsaved/saved edits, kept HP / status, the Field and per-slot overrides
are one object in `cfg.ls.dmg` (no other key).
**Turn-end amount** excludes a berry already eligible before the turn: only its berry chip shows that recovery.
The turn action leaves that berry available. If residual damage first crosses the threshold, the turn amount and
action include its recovery and consumption. Speed Boost still follows the residual parts.

**Fight state**: a Pokémon's battle condition (stages, ability boxes,
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
Pokémon. **↺ on a card** (before the HP box) does the same for that one Pokémon: a battle-state reset to a fresh
send-out (full HP, no status / Toxic count, stages, toggles, battle-state tag, used item, `broken`, Mega), not a set reset
(its set edits and Save stay; Edit's Reset / Original is the set reset); its hazard chip is offered again (hazards in), no entry effect fires,
the other Pokémon and the Field are untouched. Lit (`.rs`) while the Pokémon has any of it. Scenario: `calc-team.mjs` mon reset.
**Gauntlets** (trainers with the same `gc`, the chain's stable trainer keys in fight order; partners `~p<n>` never
carry it): one fight across the chain. A step to another member (‹ ›, Find trainer, a Calc link, recents) is not a
trainer change: the player's **HP, status and used items carry**; each member's **foe state** (HP, status, used, set
edits, its selected slot: `ST.gcSel[trainer key]`) stays as left for the whole chain; **per battle** (fresh on every
member, `clearBattle`): scratch, `ST.st` / `ST.tgt`, Toxic counters, hazard offers, area switches, manual Field
(`ST.fman`, so weather / screens / S / D: each member opens in its own Auto format), the player's `broken` / Mega /
`ft` / `fadd` / `fa` / `fi`. A step **forward** (later in `gc`) takes the **snapshot** of the player's side
(`ST.gc.snap[trainer key]['mine:<pid>'] = {hp, status, used}`, only what differs from fresh); back takes none.
Leaving the chain is a trainer change as above (`ST.gc` / `ST.gcSel` go); entering a member from outside is a new fight
that starts the chain there (`ST.gc.first` = the chain's first key, a snapshot of that member). **↺ in a chain** is
two-stage: off its snapshot (player side ≠ snapshot, its foe team not fresh, or any per-battle state) it resets the
**member** (its foes fresh, the player's side back to the snapshot, per-battle state cleared; label "Reset this
fight"); at it, on the first member or with no snapshot it resets the **gauntlet** (⇤, accent: the chain's first
trainer, everything fresh, label "Reset gauntlet (back to <first>)"). Trainer bar: a dot per member under the name
(done fg, current accent and wider, later muted; no height added) and accent ‹ › ("Previous / Next in gauntlet") only
for a step within the chain. Saved: `ST.gc` / `ST.gcSel` hold keys only; on load a `first` / snapshot key not in the
current trainer's `gc` drops `ST.gc` (the next ↺ is the gauntlet reset), an unknown pid drops that entry, the foe
edits of the current chain's members are kept. Scenario: `calc-gauntlet.mjs`.
**Dex link:** a double tap (two taps on the same cell within 350 ms) on any box cell, team cell or foe strip / foe row
opens its dex page (`#/p/<id>`, the base form), selected or not (the user hit the old single tap by accident). The first
tap does what a single tap does (picks, or toggles the hazards of the Pokémon already in); the double tap puts that
toggle back, so it is unchanged when the page opens. A drag never counts (`DROPPED` swallows the click after a drop and
resets the pair).
Scenario: `calc-team.mjs` dex link. Reload keeps HP / status, the foe's of the current fight and the manual Field;
scratch is gone. Loading older storage drops stored scratch everywhere, turns a stored Mega (`pre`) into `mega` and
keeps only HP / status / fight state on player cards not selected. Entry hazards are only offered (the hazard chip), never applied by a selection or a new fight. Scenario: `tools/scenarios/calc-auto.mjs`.
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
the bytes come from the app's save bridge instead (`window.dexViewerApp`, contract: `../thor-offline-viewer/docs/SAVE_BRIDGE.md`; the file input does nothing there). Nothing imported yet: Import calls `save()`, and `pickSave()` only
when no file is linked. With an import, ↻ Import is refresh: `save()` only, never the picker (it would take focus from
the game); the same file and `modified` as the import gives "No new save" and keeps the edits. Banners get a button
in the viewer: Change file (green) or Pick (red), both `pickSave()`; cancelling keeps everything. Bridge errors: `gone`
"Save file not found", `too-big` "Not a save file", `failed` "Unreadable", `busy` ignored; `save()` null with an
import, "No save file linked". `ST.imp.mod` keeps the save's `modified`; `saveInfo()` on entering the calc puts a dot on
↻ Import when the linked save is newer. Readers and
their formats: `calc/readers/README.md`. `calc/readers/test.js` and `tools/scenarios/fixtures/calc/` supply synthetic JSON saves.
`node tools/scenarios/calc-smoke.mjs dist/emerald-imperium.html` patches only a temporary built page to select that reader.

`dex.js` owns guarded rail, trainer and stat-calculator entry hooks and delegates scroll stops to
`CALC.stops()` (see Both teams in the first frame). The trainer entry is one calc-icon button per trainer, at the end
of a trainer row's team preview line (usable without opening the row; it fits beside six sprites at 260 px) and on a
lone card's name line; it opens the calc on that trainer, lead first. Not a button per Pokémon card (2026-11-04: it
cost each card a line, so a six-card team didn't fit the tallest viewer frame). Without `cfg.calc`, only removal of the Calc tab changes the
other pages' DOM, and `#/calc` redirects to the Pokémon list.

Engine contracts, mechanics and profile authoring: `tools/calc/README.md`. Save formats and reader coverage:
`calc/readers/README.md`. Browser checks: `tools/scenarios/README.md` → Calc checks.

**Design rules**: one screen at 260 × 316 shows both teams, both cards, the attacker's four moves and the
fight bar; don't add a row without removing one. Closed cards expose HP, Mega, ability controls and turn-end/
berry actions; Edit holds level, nature, ability, item, status, IVs/EVs and stages. Move expanders hold details
and overrides; sheets are for long lists. The berry stays beside the turn-end amount (narrow placement follows
the three-line rules above); consuming it must not change card height or hide the fourth move. Space goes
to the matchup: no headings, explanatory text or dividers; names truncate in the main block, full in sheets and
expanders. Never overflow the width, normal or `dvkb`, every expander open. The template owns the mechanics-free UI;
everything that differs between games (generation, field list, status / stage / level ranges, changed effects,
multi-hit / variable-power moves, forms, save family) comes from the profile. **Touch targets** are smaller than
viewer-ui.md's 40-44 px by the user's decision (number boxes ~22 px, Edit / M 18 px, `×n` / `C` 28 × 14.5 px, closed rows about 33 px,
cells and tools strip 28 px); if the Thor shows they are too small, grow the cards' second line and the tools strip
first. **Safari lessons:** rows with block children in a `<button>` size too small (use `div role=button`); give sheet
children `flex:none`; size stacked buttons with explicit heights, scoped (`.mr .rcol button`), not `flex:1`; ellipsis
text needs line-height ≥ 1.2 and 1 px bottom padding or descenders clip.

Keep these decisions; don't retry what's listed as rejected.

**Collapsible pages** (walkthrough, Locations, Trainers, Items; `COLLAPSIBLE PAGES` in dex.js, "Collapsible pages" in
dex.css):
1. Levels: box → place (`details.stopd`, sticky under the search bar) → section (`details.sec`, sticky under the
   place). **Boxes and sections start closed** (2026-10-31, every page, a stop with one section too); Locations'
   places start open (the place header repeats the box name and gives a sticky header), the walkthrough's stops and
   the Trainers page's places closed. Every level's open state is saved in the page's `LS` object (`1` open, `0`
   closed; no entry = the level's default; a section's `0` from before still reads as closed). Links and jumps
   (search, a Pokémon page's place link `#/l/<place>`, Next step) open their target's chain and save it open. A
   filtered page (search this page) shows its places and sections open (the walkthrough's Checklist stays closed
   unless a mission matches).
2. Tapping a header never scrolls (`flip()`, `hold()`); browser scroll anchoring is off while it settles.
3. Expand all / Collapse all bars (`segBar`): one at the page top for the boxes; in an Items box with 2+ sub-headings,
   under the box header; in a Locations place with 2+ sections, under the place header. Each only opens or closes its
   own level and never moves. The walkthrough has a Show switch instead (below).
   **Reset all** (2026-10-31): the page-top Collapse all, pressed while every box is already closed, resets the page's
   open state to the defaults (sections closed, Locations' places open, walkthrough stops closed, Trainers in Places) and
   clears it from `LS`; ticks, trackers, caps and the walkthrough's Guide info and docs stay. While every box is closed the
   button reads "Reset all". The reset is one function (`resetOpen`), so the trigger can change (a double tap was the
   alternative).
4. Collapse bars at the bottom of a block only when it is taller than the window (`bars()`); a pinned block collapses
   in place and flashes (inset accent ring). Rechecked on toggles, resizes, content-visibility renders and any change
   of the page size (a ResizeObserver on `#app`: the viewer's text zoom fires no resize but changes the height).
   Size changes clear cached bar heights and coalesce into one animation-frame check; no polling or extra elements.
5. Jump buttons in the rail (`.rjump`): up / down between boxes, landing at `T()` under the search bar.
6. Stacked sticky headers: paint `--bg` above the lower header so no gap shows on the phone, and pin only what's asked.
7. The level row ("Level cap 15 · yours 17") is closed by default.
8. Items: boxes don't pin, their sub-headings do. A box with one sub-heading named like itself shows the name twice
   (box header + sub-heading) on purpose: the user wants it that way so the box header never becomes sticky.

**Encounters** (the encounter standard, decided 2026-11-04; `plans/encounters.md` until every guide is converted).
Data: `tools/encstd.py` (`Enc.add` per row, `write`, `finish` sets `D.ESV` 2 and checks every `P.w` row of an area is
one of its es lines). Page (`ENCOUNTER STANDARD` in dex.js):
- A card per location (an `AR` area = one tracker slot), never grouped; a place with nothing to catch has none. The
  card's white box (the place, pinned) holds the tracker, then floor headings (`.esfl`, only with 2+ floors, `AR.fo`
  order), then a yellow section per kind code in this order: Grass, Cave, Water, Special, Raids, Gifts & static,
  Trades (`ESK`; an empty one is left out). The yellow header names its floor in small text, so the pinned pair says
  where you are. Subheadings (`g.v`, or the section's name when it has several groups). Rejected: a white box per floor.
- Rates are keyed `chip|when`: the chip (Surf, Old, Good, Super, Fish, Surf / Fish ripple, Bubbling, Horde) always
  shows; when (morning / day / night icons, season chips) only where a row differs. One line per key. Dupes rescale
  per chip and when. Levels once: `g.lv` on the section header (one table) or subheading, a row's `lv` / a line's `kl`
  only where they differ.
- Starter card: its white box is the place (`LOC` of the area), the starter picker, the choices listed directly.
- Picker: None yet, Failed / fled, an `<optgroup>` per section (A–Z, each species once), Other…
- Merged slots: floors that were slots of their own are hidden members (`AR[i].in` = the slot, which has no `sub`);
  the slot shows the first recorded entry, the others stay stored, count, and show as "also: <species> (<floor>)"
  with a clear button. A member's lone entry moves to the slot on load.
- A member with its own card (`AR[i].card` = [floor, ...] of the slot's `fo`; BB2R's Relic Passage, Castelia side):
  one tracker slot, two cards. The member's card sits in its own route place under its own `n` and shows those
  floors; the slot's card shows the rest. Both show the slot's tracker (one `TK.e[slot]`, every species) and its
  "also:" line. A place link (`#/l/<i>`) and a walkthrough stop on the member show its card's floors. A plain member
  whose floor is on a member's card says so with `on` = that member (its place link opens that card).
- A published slot split into several (`AR[m].to` = [[slot, [species id, ...]], ...], `in` = the default; EI's
  Underwater into Routes 124 / 126): no card, no tracker of its own. Its saved entry moves on load to the slot whose
  list has the species (else `in`); when that slot already has an entry, it stays stored, counts, and shows there as
  "also:".
- Extra card: last on the page. Rows the player adds (`TK.x` [{w place, p species | f 1}]): a place (in the viewer the
  letters keyboard, words capitalised) and a species from the Other… search or failed, a remove button each, "+ Add
  encounter". Counted in caught / failed and dupes, in the backup code; Reset all clears them. No explanation text.
- Section open state: `LS.loc` s `area|floor|code`; names saved before the standard (`area.place.Grass`) move to the
  code once (`LO.ev` 2), others drop (UI state only). Everything starts closed; the white box opens with its card.
- The walkthrough's lines and Pokémon pages use the same names: `[floor · ]Section[ · subheading][ · chip]` (Special,
  Raids, Gifts & static: the subheading alone; trades "Trade").

**Walkthrough:** Guide info → Starter → Next step → Expand / Collapse all, nothing else above the splits. An opened box
starts with a Show switch (`.wksw`, the Trainers page's style, pinned under the search bar with the stop headers under
it): **Stops** (every stop closed, the default), **Sections** (every stop open, its yellow sections closed), **All**
(stops and sections open; trainer and mission cards keep their own state). Read from the page, not stored: after single
header taps that fit none of the three, no button is lit and "mixed" shows. Pressing one keeps the stop you're reading
at the same pixel. Inside a stop:
note, then Checklist / Encounters / Items / Trainers sections. Stops with trainers show `n/N | cap` (the split's cap
when the stop has none). Empty stops are grey signs (`.wsign`), not boxes. Guide info holds tracker export / import /
reset, the game docs and the intro text.

**Walkthrough missions** (decided 2026-10-29, Unbound unit 7a): a mission is a **bordered card** (panel background,
1 px border, no extra gutter) inside the Checklist at its unlock place, closed by default. The header is the name
(wraps, never cut), `done/total` and a chevron, 44 px tall, and doesn't pin (the stop and Checklist headers already
take the top of a 316 px window). Open: unlock, reward and note (each omitted when empty), then its steps (44 px rows).
No mission-wide checkbox. **The tick that completes a mission closes it** (`foldUp`: its header lands under the pinned
headers and takes focus); only that mission, never its stop or Checklist, never on load; reopened it stays open until
the next completing tick. Next step goes depth-first in data order (ordinary steps, every step of a mission, the next
ordinary step), opening only the target's chain and landing with `land()`. Search: a hit on a mission's name, unlock,
reward or note is one row for the mission (lands on its header); otherwise each matching step is a row (lands on it);
the search-this-page filter shows a matching mission open. Rejected: a quiet divider title (A), staying open on the
final tick (A), a sticky mission header, a mission tab or global list.

**Trainers:** a Show switch per box (Places / Trainers / Teams, read from the page, not stored) pinned under the box
header; an opened box starts in Places (every place closed; a box with no place headings, Trainers). `LS.tr` before
`v: 2` saved only closes: one with any place or trainer entry (a view the user chose) is read the old way (`d`: no
entry = open), one with none takes the new default; each place header has a `n/N | cap` button that fills first (part → all open, all → all closed) and never
toggles the place. Toggling keeps the trainer you're reading in place (anchor = the first row edge under the pinned
headers). Trainer cards: below 500 px a strip of up to six sprites above one Pokémon; from 500 px all Pokémon as
blocks, three across at most. An opened card starts at its team. One speed per Pokémon (with EVs, or without under MGM).

**Pokémon page** (decided 2026-10-31 on the phone preview; `POKEMON PAGE` in dex.js, "Pokémon page" in dex.css):
1. Pager at the top (no "‹ All Pokémon"; the rail's Pokéball goes to the list), the top card, Expand all / Collapse all
   (`segBar`, the page-top rule: Collapse all with every section closed reads and acts as **Reset all**, `resetOpen`),
   "Sources disagree" when present (doesn't collapse), then the sections: Abilities, Base stats, Stat calculator, Type
   defences, Where to find, Held items, Evolution, Used by trainers, Moves (`PSECS`; open by default: Abilities, Base stats,
   Evolution, Moves). One open / closed state for every Pokémon (`LS.dex` `o`), so switching lands on the same boxes.
   Header taps never scroll (`flip`); collapse bars as on the other pages (`bars()`, less the name bar's height).
2. **Name bar** (`#pbar`): fixed at the top beside the rail, slides in (120 ms) once the top card is off screen:
   `‹` · sprite, name, types (the forms menu) · `↑` (top of the page) · `›`. Under 300 px: name 13 px (two lines
   at most), sprite 30 with the type letters down its right edge; wider: 15 px, sprite 34, type tags.
3. **‹ ›** (bar and the top pager: chevron, name in link colour, `#dex · relation`) step through the Pokémon list as it
   stands (`pokeList`: search, filters, availability, sort; no filter: dex order, forms after their Pokémon). A page not
   in the list steps through the dex order to the nearest listed one. Nothing that way: the arrow is disabled, the
   pager half empty. Relation: the evolution between the two (`level 16` → `Lv 16`), else Mega / Base form / Form.
   The arrows and the forms menu replace the history entry; Evolution rows add one.
4. **Forms** (same dex number): `#6 · 3 forms ▾` in the top card; the top card or the bar's sprite / name opens the
   forms menu (sprite, name, type letters; the current one lit); a tap outside closes it. Forms keep their own pages.
5. **Switching keeps the place** (arrows, forms menu, Evolution rows): the first keyed row under the bar (`data-pk`:
   `sec:` / `ab:` / `bs:` / `sc:` / `td:` / `wh:<place>#n` / `hi:w:<item>` / `hi:t:<item>` / `ev:<id>` / `tr:<trainer key>` / `mv:<move>[#n]`, names,
   never positions) lands at the same height on the new page; missing: the nearest of its kind in that section
   (`data-po`: level, stat, slot; else the next name alphabetically), else that section's title, else the next one's.
   At the top: the top. The hashchange handler runs it (`PKEEP`) instead of its snapshot restore; Back and reload use
   the same keys (`ANCH`).
6. **Moves** fit: under 380 px of table (container query on `.mvw`) the type is a letter circle, the category P / Sp /
   St, Varies `Var`, no `%`, no Type / Cat header words; a one-word name that can't fit breaks inside the word.
   Markers instead of tags on this page: amber `!` new or changed in the hack, red `?` sources disagree (`title` says).
   A changed ability shows the hack's one statement (data `AB` [4]: the standard effect with the change, written per
   hack) where the data has it, else its changes text; its own page shows the original ([5]) and the change
   (`txt.chdoc`).
7. **Evolution** shows the whole family from its base stage: each Pokémon, its forms (not evolved into: Megas, Rockruff
   (Own Tempo)), then what it evolves into, indented per stage; the current row lit and not a link; one row: "Does not
   evolve."
8. **Stat calculator**, stats down the side: Level and Nature, a row per stat (base, IV, EV when the guide has EVs,
   result; the nature's raised stat red ↑, lowered blue ↓), Total (base total, EVs n / 510), Speed by level.
9. **Use in calc ▸** sits in the top card under the types (the calculator starts closed).
10. **Held items** (`hi`, `heldBlock`; no section when the form holds nothing in the wild): each wild item (`ilink`) and
    its % from `P.hi`, highest first (no % when the data has none), no heading. Only on a form you can meet in the wild
    (`wildForm`): a species' base form (its first `P` entry), or another form with wild encounters of its own (`P.w`);
    never a Mega. Castform's weather forms, Shaymin Sky or a regional form you only get by evolving list none (the data
    keeps `hi`; the item page's Held by follows the same rule). What trainers hold is on the item page's Held by, not
    here (rejected: a "Trainers give it" list, 2026-11-01). Where to find has no "Wild held item" line.
11. No word breaks inside a name: sizes fit the widest word in any guide (~6.7 em). Top card under 340 px: the name
    across the top at 20 px, the 88 px sprite and details under it; wider, the name beside the sprite.
Scenario: `tools/scenarios/dex-page.mjs`.

**Move page** (`#/m/<index>`, decided 2026-10-31; `MOVE PAGE` in dex.js):
1. The top card keeps the name, type, category, power / accuracy / PP / priority, description, the **In battle** box
   (`MV.b`, the item page's `fxBox`; none without it), "Also TM004 Calm Mind" (`moveTMs`: every TM / HM / TR that
   teaches it, each an `ilink` to its item page; it replaces the old TM place lines), tutor locations, hack changes and
   source disagreements. Under it, one **Where to find TM004 (N)** card per TM (`itemWhere`, the item page's card, so
   the ticks are the same ones). The Pokémon-list filter is "+ Filter" at the right end of the
   Back line (`backLine`: one flex row, the Back line's height, `nowrap` so it never wraps at 260 in kb mode; the user
   on the Thor, 2026-10-31: near the top, few words), not a sentence in the card or below Learned by. The target (`MV.tg`) is a 2 × 3 field: opponents above, You at the left end below, then the adjacent
   and far allies. Solid red cells are all hit; dashed red cells are choices (random / counter targets use the same
   possible-target outline). The accompanying line says which. Missing target data shows no invented target.
2. Properties (`MV.f`) are plain linked lines, not raw flags, pills, exception badges or tooltip-only explanations.
   Damaging moves always say Makes contact / No contact; the groups and exceptions appear only when present
   (including EI's `kick`, Kicking move).
   `reflectable` appears through Magic Bounce in Affected by, not as another property. `moveProps` and
   `moveProperties` are shared helpers for other pages. Added effects (`MV.se`, `[chance, text]` pairs) follow the
   properties verbatim with their odds, including guaranteed effects. Capitalised guaranteed recoil / drain / heal
   phrases already contain their quantity, so they do not get a redundant `100%` prefix.
3. Each property opens `#/mp/<prop>`: every matching move, alphabetical by name, with type and power, linking to
   its move page (`moveList`). `prop` is the stable `MV.f` string; `nocontact` is the derived damaging-move complement
   of `contact`. No list state is saved: the existing position save keeps this hash without index mapping. A gone
   or unknown property returns to the Pokémon list; Back and the Pokémon rail tab keep the usual route / position.
4. Affected by reads only `MI` records containing the move (`m`); Boosted / changed by (`w: 'u'`) opens, Against it
   (`w: 't'`, count of records) starts collapsed. Each is a card with a `.sec`. `interactionRows` groups equal effect
   text (`e`); every ability links by its `AB` index, item names link to their item page (`ilink`), and each
   hack-changed name (`h: 1`) carries the visible word changed. No universal interactions are invented in the UI.
5. Learned by has a `.sub`: All, Level up / TM / HM / Tutor / Egg / Evo, only methods present, with learn-record
   counts. HM is distinguished from TM by its machine entry in `IT`; a move in both appears in both groups. All
   starts with each method's `.sec` collapsed; selecting a method shows only it, open; returning to All collapses
   them again. None of these selections or open states is saved. Pokémon stay in dex order inside each method;
   their level / Evo labels, types, forms and links remain. Open method headers stick at the top and paint the card's
   colour (`--panel`, not `--bg`: they sit in a card; `--bg` showed as a dark band) above themselves, with no gap. Not one long mixed table or a saved method filter.
Scenario: `tools/scenarios/move-page.mjs`, every guide, all viewer sizes in normal and `dvkb` modes.

**Ability page** (`#/a/<index>`, decided 2026-10-31; `abilityDetail` in dex.js):
1. The top card keeps the name, description (or the original one), hack changes and source line; + Filter is on the
   Back line as on the move page (absent when no Pokémon has the ability).
2. Moves it affects (N = distinct moves), a `.sec` card collapsed on open, reads only `MI` records naming the ability
   (`a`): Its holder's moves (`w: 'u'`), then Moves used against it (`w: 't'`), each only when present. Equal effect
   text (`e`) is one block: the effect, the word changed for `h: 1`, then its moves (`moveList`: alphabetical, type,
   power, tap = move page). One effect per block, not one flat move list, so Mega Launcher's healing line and Magic
   Guard's two lines keep their own moves. No card when no record names it.
3. Pokémon with it has the move page's picker (`pickCard` / `bindPick`, shared with Learned by): All / Normal /
   Hidden with counts, only groups present; All shows each group collapsed, picking one shows only it, open; open
   headers stick. Normal = one of `p.a`, Hidden = `p.ha`; a species with it in both is in both. Nothing saved.

**Item page** (`#/i/<item name>`, decided 2026-11-01, `plans/item-pages.md (deleted 2026-11-02, in git history)`; `ITEM PAGE` in dex.js, "Item page" in dex.css):
1. Routed by name (`ihref`: URL-encoded, `'()!*~` too, so the reopen route keeps it); the Items rail tab's page. `itemIdx`
   builds, once, everything the guide says about each item by name: its `IT` rows (not Useful NPCs or Move Tutors), wild
   holders (`P.hi` pairs, Mega and form-change forms left out), trainers whose Pokémon or partners hold it, `MI` records
   with `i`, the Megas it makes (`p.stone`), and every `IX` name. A name it doesn't have: "‹ Back" and "Not found."
2. Top card: icon (32), name, kind line (its first box and sub-heading, "Held Items · Battle gear"; the sub-heading left
   out when it repeats the box or the name; no box: "Wild Pokémon hold it" / "Only trainers hold it"), the description
   (`IX` [0], the word changed when [2]), the **In battle** box (`IX` [1]; accent bar, small-caps label). A Mega Stone has
   no In battle box: its line `base sprite + name → Mega sprite + name` says it, and a `nu` Mega adds "Not obtainable in
   <hack>; trainers use it." A TM / HM / TR page is the icon, name, kind line and the move's row (`moveList`) only.
3. **Where to find (N)**, open: every line of its rows (N = lines). A pickup line (key in `r[5]`) has its tick box and, when
   a walkthrough row has its key, the stop's name as a link (`SR.jumpPick`: the split, stop and Items section open,
   search cleared, `land()` on `tr[data-pk]`, or on the stop when that row isn't drawn). Order: unticked pickups, the
   lines that aren't pickups (wild, repeatable, shops of ordinary items; a one-of-a-kind item's Shop line is a pickup), ticked pickups; set when the page is drawn, so a tap doesn't
   move the line under the finger.
4. **Held by (N)**: the ability page's picker (`pickCard` / `bindPick`): Wild (sprite, name, types, % on the right,
   highest first; no % when the data has none) and Trainers (its Pokémon holding it, name → `#/tr/<k>`, place · box;
   rivals of the other starters left out). **Moves it affects (N)**, collapsed: `affectsCard`, shared with the ability
   page. Nothing on the page is saved except ticks.
5. **Ticks** (`LS.items` → `g: {pickupKey: 1}`, no new key): `tickHas` / `tickSet` / `tickCount` (pickups of this build)
   / `tickClear` (empties `g`) / `tickBox(key)` (`input.itk[data-pk]`). One change listener on `#app` saves a tap,
   every copy of that box on screen follows, and `TICKHOOK` functions `(key, on)` redraw what depends on it (`key`
   null after a clear). Pickup keys are stable (`tools/pickup_keys.py`), so a tick whose key is gone waits in `g`.
6. **Links** (`ilink`: 18 px icon + name; plain text for a name the guide doesn't know): Items tab rows (TMs and Mega
   Stones too; tutors keep the move page), walkthrough item rows and Items with no walkthrough place, trainer cards'
   item, the Pokémon page's wild held items and Mega stone, the move page's Affected by and TM line, search results
   for items (a Page action). Not links: the calc's item chips and pickers (controls).
Scenario: `tools/scenarios/item-page.mjs`, every guide, all viewer sizes in normal and `dvkb` modes.

**Items tab** (decided 2026-11-01, `plans/item-pages.md (deleted 2026-11-02, in git history)` §5-6; `ITEMS TAB` in dex.js, "Items tab" in dex.css):
1. Boxes are the kinds, in the data's order (`D.IT`, `tools/itemstd.py` → `BOXES`), as the standard collapsible boxes
   (Collapsible pages above). Box count = items (a nomerge name counts once); Move Tutors: "N tutors". Sub-headings are
   the data's (`r[4]`), counted in cards.
2. Open state by name: `LS.items` `o: {<kind>: 1}`, `s: {<kind>.<sub-heading>: 1}`. Saved before 2026-11-01 by box index
   (`o` "3", `s` "3.Berries", a `layout`): those entries are dropped once on load and the rest saved back; a name a later
   build drops waits unused. Ticks (`g`) are the item page's (Item page 5).
3. **Cards** (the dex-row look, `.list>.row`, so `content-visibility:auto`): icon (or the 32 px spacer), name (item page
   link), a TM's move type, MISSABLE, "done/total" with 2+ pickups; then the first 3 lines in the item page's order
   (unticked pickups, other lines, ticked pickups) with their ticks and stop links, then "+N more" (item page). Every
   pickup ticked: the card fades (.55). A tick redraws the cards of that item (`TICKHOOK`), so the next lines move up.
   One card per item: a name on several rows of a box is one card with all its lines, except **nomerge** (every row of
   the name is one pickup line: Unbound's 90 Zygarde Cells), a card per row titled by the place, the rest of the line
   under it. (The data has no nomerge flag; the template reads it from the rows.)
4. **Move Tutors**: when the rows carry group headings (RULES `tutor_groups`; Unbound), one card per tutor (rows sharing
   a place and an unlock, "place · cost · unlock"): the place, "Needs: <unlock>", each move as a link + type + its cost,
   under the group sub-headings. No groups (Hardlove): the table. Useful NPCs: the table.
5. **Tick bar** above Expand / Collapse all: "N ticked" (pickups of this build) and, at N > 0, "Clear ticks". The first
   tap arms it ("Tap again to clear N"); any other tap or a redraw (leaving the tab) disarms; the second clears `g`
   (`tickClear`) and the hook redraws the cards and the bar. Not pinned: it is at the page top, where nothing covers it.
6. **Search** (`st.q`): rows whose name or text matches, as cards (tutors: the matching moves of each tutor) under their
   box names (`.sech`), ticks working. `SR.jumpItem` opens the box and sub-heading by name and lands on `[data-ri~=ri]`.
7. **Walkthrough item rows** (the stops' Items and Guide info's "Items with no walkthrough place"): the pickup's tick box
   before the place text (`walkItemText`), the same tick as the cards and the item page. Stop counts stay checklist-only.
Scenario: `tools/scenarios/items-tab.mjs`, every guide, 260 × 316 in normal and `dvkb` modes.

**Ability marks on the Pokémon page** (the compact moves table, `ownBoosts` / `bindBoosts` in dex.js): a move that one
of this Pokémon's (this form's) own abilities affects (`MI`, `w: 'u'`, ability in `p.as`) gets an A in an accent dot
after its name, in every tab, at every width: one form, no per-width variant. It is a button (padded hit area, no
hover or `title`): a tap inserts a row under the move naming each ability that affects it, hidden when it's the hidden
ability, and what it does ("Iron Fist: Power ×1.3", changed when `h: 1`); a second tap removes it. Not saved; the row
goes when the tab changes. At 260 the dot wraps under a long name rather than widening the table. Rejected: a legend
line under the table (repeats per tab and reads as instructions), a `title` tooltip (no hover on a touch screen),
fuller per-width text (the multiplier column would cost the name column its room at 260), target-side records (those
are about moves used against it, which this table doesn't list).
Scenario: `tools/scenarios/ability-page.mjs`, every guide, all viewer sizes in normal and `dvkb` modes.

**Search:** the full-window search on every device (the in-page keyboard in the viewer or `dvkb`, the device keyboard
elsewhere). The current page's section first, then Pokémon, Filters, Locations, Trainers, Items, Walkthrough. Each
result has action buttons (Dex, Trainers, Places, Walk, Filter...) that jump or search; Enter searches the current page.
The search stays set across pages until its × or a tap on the current rail tab. Jumps use `land()`, which lays out
content-visibility-skipped ancestors first.

**Rail tabs** (2026-10-31): each tab keeps its own page and place for the session (`TABS` in dex.js: route, anchor,
block sizes, saved when one of its routes is left), so scrolling one tab never moves another and an open Pokémon page
stays open. A tap on the tab you're on clears the search and goes to the top; on a Pokémon / move / ability page it
first goes to the list at its place, then the top. Back / forward keep their own per-entry restore.

**Dex links** (2026-10-31): every Pokémon name or sprite opens its dex page `#/p/<id>` as a plain link (`plink`,
`sprl`), so Back and the rail's tab memory need nothing more; the dex list keeps its own place. Not links, because the
sprite or name is a control or part of one: a trainer card's sprite strip (`.tpick`, picks the Pokémon shown), the
team previews in trainer / partner row headers (a tap opens the row), the SOS header, tracker and trade pickers, the
tracker's Other… results, the keyboard's picks and search results (their Dex button). The calc has its own.

**Rejected** (don't bring back): animated collapses (slide, smooth scroll then close, synced fold); pinned trainer
rows or team previews; a ☰ rail; BST anywhere but the stat calculator's Total row; IVs on cards; the "Changes from vanilla" card and Changed filter;
evo/breed tags; the trials / mini caps switch; per-hack item boxes; separate Expand / Collapse bars per island and place
on Trainers.

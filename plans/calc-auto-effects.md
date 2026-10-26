# Calc: automatic effects and fight state (spec)

Decided with the user 2026-10-26 (decide session on `worktree-damage-calc-auto`, off `worktree-damage-calc`).
Mockup: `plans/calc-auto-effects-mockup/` (`build.py` → `dist/calc-auto-mock.html`, preview
`calc-auto-mock.html`; `check.mjs` runs its scenarios; `engine-probe.mjs` is the survey below). The mockup's damage
numbers are a rough formula; only its behaviour is the spec. The user approved the mockup's behaviour as "as close to
perfect as I can think of"; where the spec differs from the mockup (log overlay, Reset fight, area toggles), the
spec wins. Replaces the open "Later field/ability/item automation" part of the calc handover and the UI half of the
trainer-field plan (both deleted 2026-10-26; git history).

## What changes

The calc applies what fires on its own in a fight (abilities, items, area conditions), so a quick calc never needs
the player to work out a berry, a Sash or an Intimidate drop. Three ideas carry everything:

1. **Fight state is scratch, HP is kept.** A Pokémon's battle condition (stages, used-up items, its ability
   checkboxes, target state, move counters) lives only while it is selected. Selecting another Pokémon and coming back
   brings it back fresh: item back, stages 0, Intimidate box on. **Only HP and status are kept** (non-volatile, as in
   the game; the toxic counter restarts at 1 like the game's); everything else is volatile.
   Set edits (nature, ability, item, EVs, moves) are kept only by **Save**; unsaved set edits are dropped when the
   Pokémon is switched away. Player HP is kept across trainers; foe HP is kept for the current fight only.
2. **Derived, not stored.** Weather / terrain from setters, the Orb status, Intimidate's −1 and the area conditions
   are worked out from what is selected now, so browsing never stacks anything. The player's manual choices override
   them for the current fight.
3. **Actions apply their consequences.** The HP − buttons (a hit landed), the turn-end amount (a turn passed) and the
   berry chip apply everything that follows from them, and a dismissible overlay says what happened.

Affects every guide with `cfg.calc` (EI, Hardlove, Photonic, Eternal). Storage: no new localStorage key; all saved
state stays in `cfg.ls.dmg` (see Storage).

### Engine survey (2026-10-26, `engine-probe.mjs`, EI profile)

Already applied by the engine, nothing to do: Air Balloon's Ground immunity, Multiscale / Shadow Shield at full HP,
type-resist berries, Gems, Ruin abilities, Cloud Nine / Air Lock, terrain seeds (first hit), Download, Intrepid Sword /
Dauntless Shield, between-hit Weakness Policy / Kee / Maranga / Absorb Bulb / Cell Battery / Luminous Moss / Snowball
and Stamina / Justified / Weak Armor / Water Compaction / Steam Engine / Cotton Down, Leftovers / Black Sludge /
Poison Heal / Rain Dish / Dry Skin / Ice Body / Solar Power / Bad Dreams in the turn end.

Not applied (this spec): weather / terrain from abilities, Intimidate, Speed Boost, Flame / Toxic Orb status,
Sitrus and other healing / pinch berries, Focus Sash, Sturdy, item use (Balloon pops, berry / Gem / Sash /
Weakness Policy used up), Unburden after an item is used, Moxie / Beast Boost on a KO, area conditions.
**Bug:** Protosynthesis / Quark Drive never activate (the adapter never sets Smogon's `boostedStat`), not in sun,
Electric Terrain or with Booster Energy.

Trainer items / abilities across the four guides (counts in `.tmp/auto-survey.txt` when re-run): Focus Sash 290,
Sitrus 263, Lum 101, White Herb 94, Air Balloon 85, Weakness Policy 61, Flame Orb 49, Toxic Orb 43, Custap 42,
Salac 40, Oran 36, Booster Energy 21; Intimidate 209, Sturdy 150, Speed Boost 51, Sand Stream 35, Drought 29,
Snow Warning 27, Drizzle 25, Quark Drive 19, Protosynthesis 14, terrain surges 33, Unburden 46, Moxie 36,
Beast Boost 48.

## Out of scope

- Moves the player picks (a parallel session does the moves that change HP directly), the move's own stat changes
  (Close Combat, Power-Up Punch's boost after the hit), recoil, Life Orb / Rocky Helmet / Rough Skin / Iron Barbs /
  Shell Bell (the user chose defender effects + KO boosts only).
- **Manual by the user's choice:** White Herb (untick Intimidate / reset the stage yourself), Mirror Herb, Starf
  (random), Moody, Harvest, Focus Band, Quick Claw, Custap, Micle, Lum / Chesto curing (the user changes status).
- Trace, Imposter, Illusion, Primal Reversion's form change (the Primal weathers are listed below; the form is a
  later item), Neutralizing Gas, Screen Cleaner, Room Service, doubles-only abilities (Hospitality, Costar).
- Random terrain and Fog: text only (no terrain pool is listed; Fog has no damage effect).
- A team row built by drag and drop: `plans/calc-team.md`, its own decide session.
- Turn order / priority UI: still only the faster Speed colour (now Trick Room aware).

## Behaviour

### Lifecycle

| Event | Player side | Foe side | Field |
| --- | --- | --- | --- |
| Select a Pokémon (strip, grid, Find) | the one leaving loses its scratch and unsaved set edits, keeps HP and status; the new one starts fresh (Intimidate box on), with its kept HP and status | same, HP and status kept for this fight | it **enters**: its setter weather / terrain applies; Orb status shows; entry hazards as now |
| Change trainer (bar arrows, Find trainer, a trainer card's Calc link) | scratch cleared, HP kept | team from the data, full HP, slot 1 selected | manual overrides cleared, area conditions applied, both leads enter together (slower setter wins; reversed under Trick Room) |
| **Reset fight** | **all HP 100%, status cleared**, scratch cleared | same | as a trainer change, same trainer, same selected Pokémon |
| Reload | HP kept (both sides); scratch gone (= fresh) | foe HP of the current fight kept | manual overrides of the current fight kept; derived values recomputed |
| Save (Edit) | set edits saved as now; never scratch fields | — | — |

"Hazards after the first send-out" (Hardlove Rocket HQ B3F): at fight start the player's lead is marked as already
in (no Spikes / Toxic Spikes on it); every later selection takes them, as entry hazards do now.

### Weather and terrain

- Layers, highest first: **manual** (this fight) → **setter** → **area** (trainer `field` evidence) → none.
- Setter: an ability that sets weather / terrain on entry: Drizzle, Drought, Sand Stream, Snow Warning (Hail before
  the profile's Snow), Desolate Land / Primordial Sea / Delta Stream (where the profile has those weathers),
  Orichalcum Pulse (Sun), Hadron Engine / Electric Surge (Electric), Grassy / Psychic / Misty Surge; a hack's own
  setter abilities through its profile (`over.abilities` effect aliases already map them). Weather-setting items
  (Damp Rock and co.) only lengthen a move's weather: nothing to do.
- Which setter: the one that entered most recently. Two entering together (trainer change / Reset fight): slower
  first in Speed order, so the slower one's weather stays (faster under Trick Room). Primal weathers can't be
  replaced by ordinary ones (game rule).
- **When its setter leaves:** profile switch `setterStays`.
  - `true`: the weather stays for the rest of the fight, until another setter or the player replaces it; a trainer
    change / Reset fight ends it. **Hardlove** (`Mechanics.txt`: "Weather abilities/moves: Will set Weather
    permanently", same for terrain); also the default for Gen 4-5 profiles (ability weather was indefinite).
  - `false` (Gen 6+ default: EI, Photonic, Eternal): it goes with its setter and the next layer shows (the other
    active setter, else the area). Stand-in for the 5 turns the calc doesn't count.
- An ability setter beats the area's weather while it applies (user's choice; unverified against each hack's source).
- **Display** (mockup): the Weather / Terrain select's first option is `Auto: <value>` (dashed border while auto);
  any other choice is manual for this fight (accent border). Under the selects one line: `Rain: area`,
  `Sand: foe Gigalith · Sand Stream`, or `Weather set by you (auto: Rain)` + **Auto** button (clears every manual
  Field override of this fight). The Field summary shows the effective weather. "No weather" / "No terrain" stay the
  empty manual choices.

### Area conditions (trainer `field` evidence)

Applied when the trainer is chosen, every fight afresh (a manual change lasts until trainer change / Reset fight /
Auto). Deduplicate section and trainer copies first (two mentions of +1 are +1). Shown on one Field line,
`Area: …`, with every record's wording available (tooltip / tap) as now.

| Evidence | Applies as | Guides |
| --- | --- | --- |
| Permanent weather (Rain, Sun, Sandstorm, Snow) | area weather layer | EI, Hardlove |
| Thunderstorm | Rain + Electric Terrain (two layers, never a new weather) | Hardlove |
| Permanent Misty Terrain | area terrain layer | EI |
| EI "Permanent Sand" (Route 111, 3 cards) | **apply** as Sandstorm (decided: it's the desert route) | EI |
| Permanent enemy Tailwind | Foe Tailwind toggle on, marked area | Hardlove |
| Trick Room (Hardlove Lt. Surge; EI "Trick Room" tags: Grace & Declan, Sidney) | new Trick Room toggle on, marked area | both |
| Player Spikes + Toxic Spikes after first send-out | Player Spikes 1 + Toxic Spikes 1, lead exempt | Hardlove |
| +1 critical chance | **best guess: the foe's side** +1 crit stage, labelled `+1 crit (foe, guess)` | Hardlove |
| Random terrain at battle start | text only; the player picks the terrain | Hardlove |
| Permanent Fog | text only: `Fog: accuracy ×0.6, no damage effect` (Gen 4 rule; hg-engine's config doesn't change it, its battle code isn't in our source copy: unverified) | Hardlove |
| EI "Sydney Tailwind / TrickRoom", "Glacia Snow / Sun" | **not a condition**: labels of two team variants (the teams show it); stay as card tags, not on the area line | EI |

Toggles turned on by the area (or by any automatic source) look pressed with a dashed border and an `A` corner
mark; tapping one makes it manual for this fight (solid). The Auto button restores them.

**Trick Room toggle** (new, global row, every profile from Gen 4): no damage effect; it swaps which Pokémon gets the
faster-Speed colour, so the coloured one is the one that moves first (ignoring priority). Always offered, not gated
by `field-states.json` move availability (area evidence turns it on in guides whose movesets may lack the move).

### Per-Pokémon automatic effects

| Effect | When | How it shows / overrides |
| --- | --- | --- |
| Intimidate | while the holder is selected and its box is ticked | **Checkbox on the holder's card header**, like First turn out, **on by default**, back on at every entry. The opposing Pokémon's Atk is its Edit stage −1 in every calc (+1 → 0; untick → +1 again); its stages are never written. Reactions by the engine: Simple −2, Contrary +1, Clear Body / White Smoke / Full Metal Body / Hyper Cutter / Clear Amulet none, Gen 8+ Inner Focus / Oblivious / Own Tempo / Scrappy none, Guard Dog +1, Defiant Atk +2 and Competitive SpA +2 on top, Rattled Spe +1 (Gen 8+), Mirror Armor reflects onto the holder, Adrenaline Orb Spe +1. Mark at the end of the target's Lv / HP line like Totem "Aura": `Int −1` (net, e.g. `Int +1` for Defiant). |
| Weather / terrain setters | on entry | Field (above) |
| Flame / Toxic Orb | on entry, when the holder has no status and can get it (not Fire for Flame Orb; not Poison / Steel, Comatose, Water Veil / Water Bubble, Misty Terrain grounded) | status shows `Burn (Orb)` / `Toxic (Orb)`; choosing a status (incl. None) in Edit overrides it and is kept like any status; turn-end damage / Poison Heal follow |
| Protosynthesis / Quark Drive (+ Booster Energy) | sun / Electric Terrain (incl. derived ones), else Booster Energy | engine (bug fix) |
| Speed Boost | each turn end applied | Spe +1 to the scratch stages; part of the turn-end amount (`−3 Spe+1`) |
| Unburden | after its item is used (berry, Sash, Balloon, Gem, Weakness Policy, seed) | Speed ×2 from then on (scratch) |

### Actions

**HP − buttons** (opened move; min or max total) mean "this hit landed". The engine resolves it hit by hit (the
chosen roll for every hit, as the buttons show) and returns the outcome; the page applies it:
- Defender, in game order: Focus Sash / Sturdy at full HP on a single hit leave 1 HP (Sash used up; a multi-hit
  move breaks Sash on hit 1 and KOs later); Disguise / Ice Face busting (existing Disguised box goes off); Air
  Balloon pops; resist berry used; Sitrus (1/4), Oran (10), Berry Juice (20), Figy-group (hack / generation
  fraction and threshold), Enigma (super-effective, 1/4), pinch stat berries Liechi / Ganlon / Salac / Petaya /
  Apicot (+1 at ¼, Gluttony ½), Lansat (+2 crit state), Kee / Maranga, with Ripen doubling and Cheek Pouch adding ⅓
  HP; Weakness Policy (super-effective: Atk / SpA +2); Stamina, Justified, Weak Armor, Water Compaction, Steam
  Engine, Rattled, Berserk / Anger Shell (crossing ½), Anger Point (on a crit), Electromorphosis / Wind Power (Charge),
  Cotton Down (attacker Spe −1), Toxic Debris (Toxic Spikes on the attacker's side), Seed Sower (Grassy Terrain),
  Sand Spit (Sandstorm): a weather / terrain from these is a setter event (same layers).
- Attacker: its Gem used; on a KO Moxie / Beast Boost (its highest stat) / Chilling / Grim Neigh / As One / Soul-Heart.
- All changes go to scratch (stages, used items, toggles); HP to the kept HP. The KO'd Pokémon shows 0 HP as now.

**Turn-end amount** (HP line, tap): applies the residual parts as now, then Speed Boost, then a healing / pinch berry
whose threshold the HP now reaches (one action: the berry fires as it would in game).

**Berry chip**: whenever HP is already at or under a held, unused healing berry's threshold (typed in, from an
earlier fight, ...), a `Sitrus +13` chip sits on the HP line after the turn-end amount. Tap: heal, berry used. Pinch
stat berries show the same way (`Salac Spe+1`).

**Log overlay**: every action above (and entry hazards) writes what happened to one overlay pinned to the bottom of
the screen, on its own layer (fixed position, above the page, never moving the layout): e.g. `Garchomp hit −58 ·
Focus Sash: 1 HP, used`. It stays until dismissed with its × or replaced by the next action's text (no stacking).
Max three lines, then it scrolls inside. It is never saved. In `dvkb` mode it sits above the keyboard area.

**Reset fight**: a button on the Field's first row, right of Singles / Doubles (the segment narrows). See Lifecycle.

### Storage

All in `cfg.ls.dmg` (no new key). Kept: player HP and status (per Pokémon, where HP lives now: `ST.edits` /
custom set base), foe HP and status keyed by the current trainer (cleared on trainer change), the manual Field
overrides of the current fight (`ST.field` + a small `ST.fman` set of overridden keys, cleared on trainer change /
Reset fight / Auto), saved edits as now. Not kept: scratch (memory only). Migration on load: for every edit entry
except the currently selected cards, keep only `hp` (and `status`); scratch fields already in storage (`stg`,
`abilityOn`, `dl`, `entry`, `pty`, `ST.tgt`, `ST.st` counters, toxic turn) are dropped once, everywhere. View
choices stay as they are: crit toggle, hits inspection, Z toggle, category invert, power / type overrides.

## Controls and states

| Control | Initial / saved | Action | Result | Disabled / empty |
| --- | --- | --- | --- | --- |
| Intimidate box (holder header) | on at each entry; not saved | untick / tick | opposing calcs lose / gain the drop; target mark updates | absent unless the ability is Intimidate (and abilities are on in the profile) |
| Weather / Terrain select | `Auto: x`; manual saved for this fight | pick | manual; source line shows auto value + Auto | Auto option text `Auto: none` when nothing derives |
| Auto button | only while a manual override exists | tap | clears every Field override of this fight | — |
| Auto-on toggles | pressed, dashed, `A` | tap | manual off (solid unpressed) / on | — |
| Trick Room | off unless area | tap | swaps faster-Speed colour | — |
| HP − min / max | — | tap | hit applied, overlay | disabled at 0 HP (as now) |
| Turn-end amount | — | tap | turn applied, overlay | absent when no parts |
| Berry chip | shown in range | tap | heal, used, overlay | absent when used / out of range |
| Overlay × | — | tap | overlay gone | — |
| Reset fight | — | tap | Lifecycle row | — |
| Status select (Edit) | `x (Orb)` derived | pick | override for this stay | — |

## Edge cases

- 260 × 316 and every viewer size (PROGRESS.md), normal and `dvkb`, text zoom 50-200 %, light / dark. The one-window
  rules (open card, open Field, open move) still hold: the source line, area line and Reset fight must fit the open
  Field at 316 px, or Field's body scrolls as now. The Intimidate box must fit the card header next to the other
  checkboxes at 260 px (EI Pokémon can have First turn out + Sword/Shield + Download + Intimidate: check the worst
  case; abbreviate `Intim.` if needed).
- Both leads have setters; a setter vs Primal weather; Air Lock / Cloud Nine in play (weather present but
  suppressed: show it, the engine suppresses); a Pokémon with Intimidate on both sides; Simple / Contrary targets.
- A KO'd Pokémon (0 HP) selected: no entry effects from it; its setter doesn't apply.
- Mega toggle: the Mega's ability counts once toggled (Mega Gyarados loses Intimidate); toggling is not an entry.
- Trainer with no `field`; guides with no evidence (Photonic, Eternal): no area line.
- Saved state from older builds (migration above); reload mid-fight; Reset fight after hazards were applied.
- Offline single file; no new storage key.

## Engine work (tools/calc, unit A)

1. `boostedStat: 'auto'` for Protosynthesis / Quark Drive holders (Smogon checks the weather / terrain / Booster
   Energy). Fixtures: Great Tusk in Sun, with Booster Energy, neither.
2. Intimidate: a set flag `intim` (absent = on, like `entry`) on the holder; `calc` applies it to the opposing set
   before the hit as a `pre` event (`src: 'Intimidate'`), with the reactions above. `DMG.speed(set, field, side,
   otherSet)` gains the opposing set (Rattled / Adrenaline Orb / Defiant don't change Speed except Rattled / Orb).
3. `DMG.hit(atk, def, slot, field, roll)` (`roll`: `'min' | 'max'`): resolves the action hit by hit and returns
   `{def: {hp, used?, stg?, toggles?, status?}, atk: {used?, stg?}, field?: {weather?, terrain?, hazards?}, log: [..]}`
   for the effects in Actions. Generation / hack fractions for berries; `over.items` / `over.abilities` aliases
   keep working.
4. `DMG.turn(set, field, otherSet, side)`: the residual parts plus Speed Boost and the berry that fires, same return
   shape (or `residual` grows an `after` field; builder's choice, documented in the README).
5. `DMG.derived(set, field)`: `{weather?, terrain?, primal?, status?}` an entering set would set (setter ability,
   Orb status with immunities), so the page never hard-codes ability names.
6. KO text: `ko` counts Focus Sash / Sturdy (full HP, single-hit moves) and one healing berry; `notes` say so
   (`Sash`, `after Sitrus`).
7. Side crit bonus `atkCritBonus` / `defCritBonus` (integer stages, added before the cap).
8. Profile `setterStays` (default by generation; Hardlove `true`).
Each with `test.mjs` groups; hack differences get fixtures in `hacks/<hack>/calc_states.json`.

## Data work (unit B, shared `tools/trainer_fields.py`)

EI "Permanent Sand" → `{kind: weather, value: Sandstorm, duration: permanent}`, review false; EI "Trick Room" tags →
`{kind: room, value: Trick Room}`; Sidney / Glacia variant labels → no effect, `review: false`, marked
`label: true` (not shown on the area line); Hardlove +1 crit → `side: opponent, guess: true`; Fog keeps its effect,
the UI text adds the accuracy note. Update `trainer_fields_check.py`, rebuild the four guides' data.json.

## Docs

- `template/README.md` → Damage calculator: lifecycle, layers, overlay, Reset fight, Trick Room; remove "Trainer
  `field` evidence is still not automatically consumed" and "automatic ... provenance remains a later decide/build".
- `tools/calc/README.md`: the new APIs and inputs.
- `hacks/hardlove-gold/notes.md`: `setterStays` from Mechanics.txt, crit guess, Fog note; `hacks/emerald-imperium/notes.md`:
  Sand / Trick Room decisions.
- **CLAUDE.md → Making a new guide, step 2**: after extraction, list the trainer `field` records marked `review`
  (`tools/trainer_fields_check.py`) and settle each with the user before the calc build; record the decisions in
  the hack's `notes.md` and normalise them in `trainer_fields.py`. Also: check the hack's mechanics doc for weather /
  terrain permanence (`setterStays`).
- When built: delete this plan and its mockup folder; take it off `plans/calc-open.md`.

## Build units

A engine (Sol), B data (Haiku medium), C page state model: scratch / HP-only / Reset fight / trainer change /
migration (Sol or Opus), D page effects: Field layers and toggles, Intimidate box, Orb status, actions, berry chip,
overlay, Trick Room colour (Sol), E audit (Haiku). Order: A and B (independent files) → C → D → E, each ending at a
commit; template units one at a time (Parallel sessions).

## Checks

| Requirement | Where | Seed / size / mode | Assertion |
| --- | --- | --- | --- |
| Engine pieces 1-8 | `tools/calc/test.mjs`, hack fixtures | — | numbers and returned events per case |
| Scratch lifecycle | `tools/scenarios/calc-auto.mjs` (new) | EI + Hardlove, 260 × 316 | stage / used item / Intimidate box reset on switch-back; HP kept; unsaved set edit dropped, saved kept |
| Trainer change / Reset fight | same | Hardlove Route 33 → Union Cave | foe HP fresh; manual weather cleared; area back; Reset: all HP 100 %, statuses cleared |
| Weather layers | same | Hardlove (sticky) and EI (not) | setter beats area; leaves: stays (Hardlove) / falls back (EI); both leads: slower wins; manual + Auto |
| Area conditions | same | Hardlove Radio Tower 4F, Rocket HQ B3F, Lt. Surge, Lake of Rage; EI Route 111 | Tailwind / crit / hazards (lead exempt) / Trick Room colour / Thunderstorm two layers / Sand |
| Intimidate | same | Growlithe vs Bibarel (Simple), a Defiant target | stage untouched; calc and mark show −1 / −2 / +1 |
| HP − actions | same | Sash, Sturdy, Sitrus, Weakness Policy, Balloon, Moxie KO | HP, used items, stages, overlay text |
| Turn end and berry chip | same | Speed Boost holder; Sitrus at 40 % | amount shows Spe+1; chip heals once |
| Orb status | same | Guts + Flame Orb; Fire-type holder | `Burn (Orb)` and Guts damage; none for Fire |
| Reload / migration | same + `calc-persist.mjs` | seeded old storage | only HP / status / current fight kept |
| Layout | `calc-state.mjs` one-window + `calc-layout.mjs` | all viewer sizes, normal / dvkb, zoom | header fits with Intimidate; Field fits; overlay above dvkb |
| Unchanged elsewhere | `gate.py` vs the recorded baseline, `domcompare` | four guides | only `#/calc` differs |

Finish with `preview.py --frame` on each guide and the user's Thor test.

## Settled after the mockup

- Status is kept across switches like HP (user, 2026-10-26: "everything else is generally volatile"). The toxic
  turn counter is volatile (restarts at 1 on entry).

## Settled at the build start (2026-10-26, Opus main chat with the user)

What changed since the spec was written (the HP-moves build, the docs cleanup, EI's scope check) and how it fits:
- **One-use tap** (HP moves: the % line's signed amount, one tap = one use) fires the same automatic reactions as
  HP −: the hit goes through `DMG.hit` (Sash / Sturdy / berries / Weakness Policy / KO boosts...), then the user's
  change (`DMG.hp`) is worked out from the damage actually dealt (Sash leaving 1 HP → drain / recoil from that).
  **Dealt / You → Apply**: only the threshold reactions (healing / pinch berries, Berserk / Anger Shell), no Sash /
  Sturdy (the player typed what the game showed). HP −min / −max stay without the user's change, as now.
- The spec's "Out of scope: recoil, Life Orb, Rocky Helmet / Rough Skin / Iron Barbs, Shell Bell" is superseded:
  recoil / Life Orb / Shell Bell are in `DMG.hp` (HP moves), the contact damage joins it (A2).
- **Disguise / Ice Face**: a new **Broken** box on the card header (ability checkbox pattern; not the EI Disguised
  box, which is Illusion's). Hit 1 does 0 while intact (Gen 8+ Disguise costs 1/8 max HP), later hits full. The HP −
  action / one-use tap ticks it when the hit busts it. **Kept for the fight** like foe HP (survives switching;
  cleared on trainer change / Reset fight); Ice Face comes back on entry while the effective weather is Hail / Snow.
- **Laser Focus / Lucky Chant / Dragon Cheer**: per-side Field toggles `atkLaserFocus` / `atkLuckyChant` /
  `atkDragonCheer` (and `def*`), gated by the guide's moves like the other states; Dragon Cheer Doubles only (+1 crit
  stage, +2 for a Dragon-type target ally). Hardlove's area +1 crit is `atkCritBonus` / `defCritBonus` (A1).
- **Foul Play** always reads the target's current Attack and stages, including manual stages and changes the calc
  applies (Weakness Policy, Intimidate); a later hit in the same use (Parental Bond) reads it after a between-hit
  change (Justified, Weakness Policy).
- **EI scope gaps: build all** (the user hides unwanted ones in a later UI pass): doubles ally effects as per-side
  Field toggles, Doubles only, gated by the guide's abilities / moves (Power Spot, Steely Spirit, ally Flower Gift,
  ally Fairy / Dark Aura and Aura Break, ally Ruin, Plus / Minus partner); Power Trick (per side, stock
  `isPowerTrick`); Water Sport / Mud Sport (field toggles, Fire / Electric power ×1352/4096 Gen 6+, the generation's
  own rule before); Power Split / Guard Split (field toggles: the two battlers' Atk+SpA / Def+SpD averaged, new engine
  code). Electrify / Ion Deluge: the move's Type override already covers it (no build; README says so).
- **Stockpile** count (1-3, Swallow / Spit Up) is row battle state: scratch, in `ST.st`.
- **Row heights with an HP chip** (`calc-layout` check 20 on EI): fixed in D2, a chip no taller than the % line.
- Hardlove Easy mode: not doing (Hardlove notes).

Build units (each ends at a commit the main chat reviews): A1 engine, spec · A2 engine, HP follow-ups + crit inputs +
Foul Play + cleanups · A3 engine, EI gaps · B data · C page state model · D1 page effects, spec · D2 page, open list
(HP follow-up controls, crit toggles, chip height, comment) · D3 page, EI gap toggles · E audit.

Settled after unit C (user, 2026-10-27): the **Mega toggle is kept for the fight** (like Broken: survives switching,
cleared on trainer change / Reset fight; toggling is still not an entry); **foe set edits are kept for the fight**
(no foe Save; trainer data stays the source). Singles / Doubles is not a manual override (survives a new fight).

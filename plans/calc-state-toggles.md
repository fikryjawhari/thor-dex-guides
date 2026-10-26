# Calc: battle-state controls (spec)


## Audit record (2026-10-26)
- Full four-guide gate: **88/117 pass**, not an unqualified green gate. Evidence:
  `.tmp/gate/20261026-133753-240043/summary.txt`. Baseline SHA:
  `e39529e6fed29674fa3a9d0c277dabd48fabeaf1` (incoming engine already merged; no UI implementation yet).
- All four extract builds/checks pass; data identical except built date; counts/reports unchanged.
- Eight complete DOM sweeps (normal/dvkb): only `#/calc` differs intentionally, zero old/new page errors.
  19,840 unaffected route/mode comparisons are identical. The eight generic identity checks therefore report FAIL.
- The other 21 failures are seven EI-specific scenarios run against the three other guides: controls, entry,
  field, import, layout, persist and smoke. Each reproduces against the untouched baseline build. Controls/import/
  layout/persist require EI trainer IDs; entry/field expect an EI save party slot; smoke expects EI good.json import.
  Baseline reproduction logs: `.tmp/resume-audit/baseline-*.log`. These tests have not been weakened or production
  code changed to accommodate mismatched fixtures. Actual-profile scenarios and the new state scenarios pass.
- Consistency (including light theme/viewer sizes), tabs, walkthrough state and tracker reload pass for all four.
  EI page/walk/jump/zoom checks pass in normal/dvkb. Photonic Z scenarios: 20 pass.
- Final refinement: pair editors on narrow-to-wide resize and automatic Edit opening; label uniform rolls Per hit;
  reset inherited residual negative-number geometry. All four guides rebuilt; state scenarios 24/10/10/10 pass;
  engine npm suite passes. No engine files changed.
- Explicit changed-route domcompare rerun uses `--ignore="built 2026-10-2[0-9]"`, normal/dvkb, one sweep at a time;
  logs under `.tmp/resume-audit/dom-*.log`. Full-route evidence is the eight complete gate sweeps above.
## Build status (2026-10-26)
- Working branch: `worktree-damage-calc-toggles`, tab of `worktree-damage-calc`.
- Engine pass merged cleanly at `f3203b1`; main checkout's Hardlove `.src/` copied before any extract build.
- Card/layout sub-step built: direct HP-line residual application, Edit residual/toxic parts, paired wide editors,
  target state, cycling Download and entry-off controls, full form name, compact ability checkbox. No engine edits.
  `calc-state.mjs` card/layout checks pass at all five viewer sizes, normal/dvkb (ten cases); all four guides assemble.
  Field sub-step built: full-width Singles/Doubles segment, stable Player/Foe columns, Focus Energy in all six base
  profiles and all four hack overrides. Side values now map correctly for both attacking directions, with a one-time
  migration from old attacker-relative saves. Field/profile checks: EI 2, Photonic 10, Eternal 10, Hardlove 10 passed;
  card/state/side-mapping checks: 12 passed. Move controls implemented: state toggles/counters, pledges, Metronome,
  Curl/pre inputs, forced/blocked crit metadata, total multi-hit/PB damage and per-hit inspection, compact Draco,
  full Z names, used/listed/typed power. Photonic state/hit checks (6) and EI triple/power checks (20) pass.
  Expanded state contract tests cover counters/toggles, hack suppressions, Curl/pre, typed-power reset, target Dig,
  Download/entry, forced/blocked crit, fixed/PB inspection, Z and persistence. EI: 24 cases pass; other profiles: 10
  each pass, including the final wide-resize editor regression. Photonic fourth move ends at 309 px. Residual (40),
  Imperium controls (10), layout (36), triple/power (20), engine npm suite and Metronome-holder checks pass.
  Built Thor frames: `/preview/calc-state-built.html` (EI), `/preview/calc-state-photonic.html` (Photonic).
  Full gate completed; see the audit record below. Phone/Thor user approval remains before the later field decide step.
  Approval mockup: `plans/calc-state-toggles-mockup/edit.html`, generated with `build-edit.mjs`
  (sampled Photonic Captain Mallow data and inline shared sprites), framed at `dist/calc-state-edit-frame.html`.
  Phone preview: `https://windows-pc.tail1846b8.ts.net/preview/calc-state-edit.html`.
  `node plans/calc-state-toggles-mockup/check-edit.mjs`: all five viewer sizes, normal/dvkb, pass (ten checks);
  fourth move ends at 309 px at 260 x 316; wide team area is 228 px at both 424 px-high sizes. Edit/residuals leave
  the team area unchanged, both wide editors populate/collapse together, Field stays below expanded moves.
  Approved with refinements (2026-10-26): build the settled controls and UI fixes below. Mock values are illustrative;
  production toxic counters use the engine. Existing choices remain final except the explicit Download refinement.
- No engine edits are authorised by this UI build. Any missing engine behaviour is reported first and deferred
  to the engine follow-up unless the user explicitly changes scope. No push without a fresh yes.

### Additional Thor feedback: UI work on this branch
Do this sequentially, not as parallel template jobs. The additions below are requests, not approved mockup designs.
1. Layout: preserve the opponent's six-row team view when residuals appear; opening Edit must not enlarge the
   area above the cards or switch the team presentation. At wide sizes both Edit panels open/collapse together,
   with both populated. Move details must push Field below the complete taller moveset, never overlap it.
2. Compactness proposal: keep the small view's trainer plus four moves intact. Trim card/header/navigation
   chrome, not legibility. Mock residual amounts on the existing HP line, with their parts and toxic control in
   Edit instead of a separate Turn row. Opening details/edits grows content downward, not the team area upward.
3. Card controls: First turn out / Disguised next to Edit, no additional card row; full species/form name inside
   Edit; target state, ability-appropriate Download Auto / Atk / SpA / Off and Sword / Shield off controls in Edit.
4. Move readouts: outside damage is the sum of selected hits (including Parental Bond), details list each hit;
   offer a one-hit inspection without introducing conflicting stacked hit buttons. Draco's category and
   Auto/Inverted control uses the top slot above Crit, not an extra text row. Expanded Z-moves show their full name.
   Loaded Dice / Skill Link narrow the UI's offered hit counts while retaining a one-hit inspection; derive their
   availability from the guide/profile, with no inferred new engine mechanic.
5. Trainer-field decide/build next, on this branch: two stable player/foe columns (or an explicitly approved
   four-state alternative), not mixed scattered side toggles. Automatic weather/terrain follows the active
   Pokemon unless manually overridden; manual overrides survive Pokemon changes; trainer changes clear the field.
   Specify precedence, simultaneous sources, manual None, persistence and trainer evidence in that decide step
   (`plans/trainer-field-conditions.md`), before implementing automation. Unsupported trainer effects are not
   silently approximated. Speed-colour comparison is sufficient; no extra turn-order control requested now.

### Engine triage (local probes, incoming committed engine)
Reproduce: `node plans/calc-state-toggles-mockup/scope-probe.mjs` (no npm install or engine rebuild).
- Return / Frustration defaults: both return `null` without explicit power. Setting their maximum default is a
  deferred engine-contract/default-power follow-up, not an engine edit in this page build.
- Power-Up Punch already changes hit two: EI Mega Kangaskhan / Parental Bond into neutral-nature Lv 50 Blissey,
  all defaults otherwise, returns hit ranges 146-174 and 54-64. The latter includes the intervening Attack boost;
  it is not merely one quarter of hit one. Do not schedule another implementation for this example.
- Stamina already affects later hits: EI Cloyster's three-hit Icicle Spear into Mudsdale with Stamina gives
  30-36, 20-26, 14-20, and `pre` reports Defense +1 before hits two and three.
- Loaded Dice / Skill Link: the engine honours an explicit `slot.hits` of 1-5 in both cases. Restricting what the
  page offers is UI policy; one-hit inspection is not a claim that Skill Link naturally rolled one hit.
- Emperor's Presence already has self and doubles-ally profile rules and source-chain checks in
  `tools/calc/imperium_check.mjs`. Existing fixtures return 31-37 with the ally off, 40-48 with it on, and 52-63
  when self and ally stack. Expose/verify the right side and singles/doubles UI; no established engine defect.
- Pursuit's switching-target input is implemented as `def.vol: "switch"`; this build adds its agreed Edit control.
- This triage verifies these examples, not every possible between-hit effect or field-changing ability/item.
  Further engine gaps found during implementation must be raised before editing engine code.

Decide session, 2026-10-26, on `worktree-damage-calc-toggles` (tab of `worktree-damage-calc`). Source: the
"Needs battle state" and "Power box readout" parts of `plans/calc-dynamic-power.md`. No template or engine change was
made in this step. Mockup: `plans/calc-state-toggles-mockup/mock.html` + `panel.html` (Thor frame, phone preview). The
probes behind the numbers are `probe.mjs` (stock engine, Node) and `presence.mjs` (which hack has which move); run
`node plans/calc-state-toggles-mockup/probe.mjs .` from the repo root. The build removes the mockup folder and these
scripts when it lands (git history keeps them).

**Engine side done (2026-10-26, engine pass on `worktree-damage-calc`).** The engine already takes every input this
spec needs and returns every value the page shows: contract in `tools/calc/README.md` → Battle state, Crit, Stat
changes before the hit; 2322 fixtures in each calc guide's `calc_states.json` (`tools/calc/state_check.mjs`, in `npm
test`). This branch starts from before that pass: **`git merge worktree-damage-calc` first.** What is left is the page
(this spec, with the settled choices below). Where this file and the README differ, the README is how the engine works.

## What changes
Per-row state controls for the moves whose power depends on battle state the page has no input for, a card control
for the target's state (Dig / Fly / Dive / Minimized / switching), and a Power box that shows every power the engine
uses. Affected: `template/calc.js` (row markup, card editor, state in `ST`, passing the inputs), `template/calc.css`,
`template/calc/profiles/` (the Focus Energy fields), `tools/scenarios/` (one new scenario).
The adapter and `engine.js` need no change unless the build finds a gap. Storage: the calc's existing key
`cfg.ls.dmg`; new fields only inside `ST`, and `ST` defaults cover saves from before (no key change).

**Engine inputs the page passes** (all optional; a missing one is off / 0):

| Control | Engine input |
| --- | --- |
| Row's own stat changes off | `slot.pre: false` |
| Row toggle / counter (tables below) | `slot.st`: `true` for a toggle, the earlier count for a counter (0 = first use). Never stock `timesUsed` (it repeats the whole hit over turns). |
| Pledge combo | `slot.st` = the partner pledge's move name (the engine sets power 150, the pair's type, STAB) |
| Defense Curl before Rollout / Ice Ball | `slot.curl: true` |
| Metronome counter | `slot.met`: earlier consecutive uses |
| Card target state | `def.vol`: `dig` / `fly` / `dive` / `min` / `switch` (and `atk.vol` when the foe attacks: the state belongs to the Pokémon being hit) |
| Focus Energy (field) | field keys `atkFocus` / `defFocus` (toggle; Focus Energy, Dire Hit or an eaten Lansat Berry) |
| Download / Intrepid Sword / Dauntless Shield | the set's `dl` (`atk` / `spa` / `off`; missing = auto) and `entry: false` (Sword / Shield off) |

**Hack differences the page must follow:** a move whose `cfg.calc.over.state[name]` is `false` gets no control (its
state does nothing in that hack). Today that is Hardlove: Echoed Voice, Rage Fist, Last Respects, Avalanche, Round,
Fusion Flare / Bolt and the three pledges. `{curl: false}` (Hardlove Rollout / Ice Ball) hides the Defense Curl
control. Hardlove's Revenge toggle means "the target was already damaged this turn" (its source's condition): the
tag's explanation should say so for that hack.

## Settled choices
1. **Where a state control sits:** the row's top slot (above C, in the `.rcol` column). It is empty today on rows that
   are not multi-hit. A state row uses the same two-button layout multi-hit rows already use (×n above C), so no row
   gets taller: 31 / 32 px as now. Z rows hide it, as they hide ×n.
2. **Toggle or counter:** a move gets a counter when the game scales power by a number (uses, turns, hits taken, allies
   fainted); a toggle when the state is yes / no. Target states are never per row (see 4).
3. **Power box:** yes, it shows every power the engine uses (see Power box below). Today it shows only the two kinds
   the adapter reports (`AUTO_POWER`, `HP_POWER`).
4. **Target state (Dig, Fly, Dive, Minimized, switching out):** one select per Pokémon, in its Edit menu (the card's
   Edit editor, not on the card face), not per row. The state belongs to the Pokémon, so a per-row toggle would have
   to be set on every move that reads it (Earthquake and Magnitude both need "Dig"). Not yet mocked: the Edit menu
   needs a mockup before the build.
5. **Persistence:** per slot, in the calc's one key, like `crit`, `hits` and `z`.

## Move list (what gets what)
Hack columns: P = Photonic Sun, E = Eternal X, H = Hardlove Gold, I = Emerald Imperium (`presence.mjs`).

**Toggle, row top slot** (tag on the button; accent when on; off by default):

| Move | Tag | On means | Effect | Hacks |
| --- | --- | --- | --- | --- |
| Assurance | Hit | the target was hurt this turn | ×2 | P E H I |
| Revenge, Avalanche | 1st | the attacker was hit this turn before it moved | ×2 | P E H I |
| Retaliate | Ally | an ally fainted last turn | ×2 | P E H I |
| Stomping Tantrum | Fail | the user's last move failed | ×2 | P H I |
| Temper Flare | Fail | the user's last move failed | ×2 | H I |
| Lash Out | Low | a stat was lowered this turn | ×2 | H |
| Round, Fusion Bolt, Fusion Flare | Cmb | Doubles only: the partner used the matching move this turn | ×2 | P E H I |
| Fire / Water / Grass Pledge | Cmb | Doubles only: the combo | combo power (150 in Gen 6+; check the hack's rows) | P E H |
| Fickle Beam | ×2 | the 30% double (chosen by the user) | ×2 | I |

**Counter, row top slot** (shows the count; tap 0 → 1 → … → max → 0; "0" is muted; the power follows the stock rule
for that count, which the build confirms with the probe):

| Move | Counts | Max | Hacks |
| --- | --- | --- | --- |
| Fury Cutter | earlier uses in a row | 4 | P E H I |
| Echoed Voice | earlier turns in a row | 4 | P E H I |
| Rollout, Ice Ball | earlier turns in a row | 4 | P E H I |
| Rage Fist | times hit (power 50 + 50 per hit, cap 350) | 6 | H I |
| Last Respects | allies fainted | 5 | H I |
| Metronome (item) | consecutive uses of this move | 10 | any Pokémon holding it; in data: H (Pachirisu), I (Tyrantrum) |

Metronome is a damage multiplier, not a power: the Power box doesn't change, and the details show it as "Metronome
×1.3". It shows only on the rows of a Pokémon that holds the item, on every damaging row (the item covers all moves),
so those rows get the two-button column. Holders' moves: Pachirisu's data set has only Discharge; Tyrantrum's has Poison
Fang, Rock Slide, Crunch and Dragon Claw. None of them is multi-hit or a state move, so none conflicts.

**Conflict rule:** a row takes one top-slot control. If a move on a holder needs one of its own (a multi-hit move, or a
state move from the tables above), that row shows the move's control and the Metronome counter is hidden there (its
count stays 0 for that move). The build check (below) catches this in the data; a move the player adds to their own
Pokémon is handled by this rule.

The counter holds the earlier count, so 0 is the first use. The page passes it as `slot.st` (Metronome: `slot.met`);
the engine applies the formula and the cap. (This replaces the earlier "`timesUsed` = count + 1" line: stock's
`timesUsed` repeats the whole hit over turns and would multiply the damage.)

**Card control, not per row** (a Battle state select in the card's Edit editor; a short mark on the card's Lv / HP
line, like the Aura mark, while set):

| State | Mark | Doubles | Hacks |
| --- | --- | --- | --- |
| Underground | Dig | Earthquake, Magnitude | P E H I |
| In the air | Fly | Gust, Twister | P E H I |
| Underwater | Dive | Surf, Whirlpool | P E H I |
| Minimized | Min | Stomp | P E H I |
| Switching out | Switch | Pursuit | P E H I |

Magnitude's power is random and stays manual in the Power box (as now); Dig only changes its damage (not in Hardlove,
whose source doubles only Earthquake). Before Gen 5 (Gen 6 for Minimize), and for Hardlove's Gust / Twister, the
state doubles the power instead, so the Power box shows it.

## Settled with the user after the engine pass (2026-10-26)
1. **Pledge partner:** the Cmb button cycles off → the first other pledge → the second → off (Fire Pledge: off → Water
   → Grass), its tag showing the partner (Wa / Gr). The page passes `slot.st` = the partner's move name; the details
   spell out the result ("with Water Pledge: Water, 150"). No button in Hardlove (flat pledges).
2. **Defense Curl:** a "Defense Curl used" checkbox in the opened details of the Rollout / Ice Ball row (`slot.curl`),
   not on the Defense Curl move. Not in Hardlove.
3. **Focus Energy:** a per-side field toggle with the other side toggles, in every calc profile (`atkFocus` /
   `defFocus`); +2 crit stages.
4. **Crit chance:** the opened row's details show the result's `crit` ("Crit 1/8, stage 1"); the chance is the game's
   own (each hack's table, `MV.cr`, its item rules). When `forced`, C is locked on and the details say why (always-crit
   move, Merciless on a poisoned target, a certain stage). `p` 0 (Battle / Shell Armor) disables C.
5. **Stat changes before the hit:** the outside numbers include them by default (Meteor Beam shows its +1 damage). The
   opened row has a details line ("Before the hit: Sp. Atk +1 (Meteor Beam)"; between hits: "before hit 2: Def +1
   (Stamina)") and a checkbox to drop the move's own changes for that row only (`slot.pre: false`: charge turn,
   Spectral Thief), e.g. when something lowered the stat between the boost and the hit, instead of changing the
   Pokémon's stages (which would change every other move). Pokémon-level changes (a seed, Download, Sword / Shield)
   are set on the Pokémon, not per row. Between-hit changes are listed but not switchable.
6. **Intrepid Sword / Dauntless Shield:** on by default; an "off" checkbox in the Pokémon's Edit menu (`entry: false`)
   for when the entry doesn't count (Hardlove: once per battle).
7. **Download:** one cycling button in the Pokemon's Edit menu: **Auto (→ stat) -> Atk -> Sp. Atk -> None -> Auto**,
   default Auto (`dl` missing). This replaces the originally settled select, per user approval on 2026-10-26.
   Auto is what the game does on a fresh entry against the current target, and its label shows which stat that gives
   now; Atk / SpA lock the boost it actually got, so it stays when the target changes; Off when it didn't fire. The
   engine takes `dl: "atk" | "spa" | "off"`.
8. Item activation checkboxes (Weakness Policy and the like, for a later Foul Play hit): not wanted.

Engine inputs for 5-7 are built (`tools/calc/README.md` → Stat changes before the hit). These are behaviour
decisions; the build still mocks the Edit-menu controls (target state, Download, Sword / Shield off) before building.

### Layout approval refinements (2026-10-26)
- The residual amount is a small clickable box on the existing HP line. Tapping it applies one turn immediately,
  without opening Edit, selecting that side or changing attack direction. Edit contains the parts and toxic counter.
  Real toxic damage follows the engine at the chosen turn and increments on applying a turn; the mock is illustrative.
- Download is the cycling button in choice 7. Auto's label follows the current target; explicit choices stay locked.
- Approved: first-turn/disguise checkbox next to Edit; full name inside Edit; paired wide Edit; compact multi-hit/
  Draco controls; two player/foe field columns. No extra first-turn label or category row on the closed cards/moves.
- A full-width Singles / Doubles segmented switch sits above Weather / Terrain, with the active half highlighted.
  Field side controls stay in their stable player/foe columns when the attack direction changes.
- Build these existing field controls now; trainer evidence, automatic ability/item weather and manual provenance
  remain the next sequential decide/build, not an implicit engine change or part of this switch's implementation.

**Not in this spec**
- Supreme Overlord: absent from all four calc hacks (the engine takes `atk.fnt` if a later hack has it).
- Historical stat changes (Intimidate, Rage, Charge, KO boosts, Berserk / Anger Shell): stay manual stages.
- Terrain and weather moves the stock engine already handles: no control (see Power box).
- Pledge combo side effects (the Sea of Fire / Swamp / Rainbow effects) beyond the combo power.
- Partner choice: a Cmb toggle assumes the partner used the matching move; the engine does not pick it.

## Stock engine: what it already does (probe, `probe.mjs`)
Run on Photonic's data with Garchomp (attacker) and Snorlax (defender), no held item unless stated (Hex: Snorlax
attacks Garchomp). Numbers are the engine's damage rolls, before and after the input. The Power box today shows the
listed power in every case below except Punishment, which the adapter already reports.

| Move | Input the page has | Engine change | Probe |
| --- | --- | --- | --- |
| Facade | attacker burned / paralysed / poisoned / bad poison | ×2 | 47–56 → 93–110 |
| Acrobatics | attacker holds no item | ×2 (Oran Berry: ×1) | 73–87 (no item) vs 37–44 (Oran Berry) |
| Brine | target at or below half HP | ×2 | 20–24 → 39–46 |
| Venoshock | target poisoned / bad poison | ×2 | 20–24 → 39–46 |
| Hex | target has any status | ×2 | 21–25 → 40–48 (target asleep) |
| Smelling Salts | target paralysed | ×2 | 47–56 → 93–110 |
| Wake-Up Slap | target asleep | ×2 | 186–220 with the target asleep (no awake run) |
| Knock Off | target holds an item | ×1.5 | 44–52 → 65–77 |
| Stored Power | attacker's positive stages | 20 + 20 per stage | +0: 6–8; +2 Sp. Atk: 18–22 |
| Punishment | target's positive stages | already automatic (`AUTO_POWER`) | shows `bp=100` |
| Weather Ball | sun / rain / sand / hail | power 100 and the weather type | 15–18 → 44–52 (sun) |
| Solar Beam | rain / sand / hail | ×0.5 | bundle only, not probed |
| Grav Apple, Terrain Pulse, Psyblade, Expanding Force | gravity / terrain | stock conditions | bundle only (not in P / E) |

What stock did not handle (Assurance, Revenge / Avalanche / Retaliate, the counters, Pursuit, the target states,
Lash Out's this-turn drop) is now in the engine (engine pass, U3): each takes the input in "Engine inputs" above.
Lash Out doubles only with its toggle; an earlier drop (a negative stage) no longer doubles it.

## Power box
"Listed" means the move's base power in the guide's move data (`bp` in `data.json`, the same number the game's move
table gives). The engine now reports `bp` for every move whose power differs from the listed one (engine pass U3);
the page still shows the listed power in the box. Example: Facade on a burned attacker shows 70 in the box and hits
as 140. Moves whose power changes hit by hit (Triple Kick) report per-hit rolls (`per`) instead of `bp`.

Decision: the Power box shows the power the damage actually uses, and the row's details say what the listed power was
when they differ.
- Opening a row shows, for example, `Power 140 · listed 70 (burned attacker)`. The number in the box is the one the
  rolls use. The box is still an input: typing a number sets a manual power, and "Reset power / type" removes it.
- The result reports `bp` whenever the power used is not the listed one (stock condition, state control, or a
  counter's formula; built). The box shows that number; the details add "listed 70" when they differ.
- Weather Ball also changes type: the details show the type used ("Fire"), and the type dot keeps the listed type.
  Its type change is not a Power box value; that row only gets the note.
- A typed power (the box edited by hand) still wins. While typed, the state controls show but have no effect, and the
  details say "typed". "Reset power / type" clears the typed power, as now.
- Z rows: the Z-move's power comes from the Z table, not the state. Unchanged in this pass; the build checks Z-Facade
  and Z-Brine against the stock rule.

## Controls and states
| Control | Off / initial | Tap | Result | Hidden or disabled when |
| --- | --- | --- | --- | --- |
| Toggle tag (top slot) | off (muted tag) | on (accent) ↔ off | power per the table; box shows used power | Z on; Cmb in Singles; no move |
| Counter (top slot) | 0 (muted) | 0 → 1 → … → max → 0 | power per the stock rule; box updates | Z on; no move |
| Plain row | no top slot; C fills the column | — | unchanged | — |
| Multi-hit row (×n / H1–H3) | as now | as now | as now | — |
| C (crit) | off | on / off | as now; independent of state | — |
| Card: Battle state select (Edit) | None | pick one | target-state moves change; mark on the Lv / HP line | None = no mark |
| Power box | listed power (or the engine's, when different) | type a value | typed power wins; state ignored | — |
| Reset power / type | — | tap | clears typed power and type only; states stay | — |
| Change move (the slot) | — | pick a move | clears that slot's state (like Z) | — |
| Change Pokémon | — | pick | the card's keys change, so states start off | — |
| Import | — | import | clears `ST.st` and `ST.tgt` (as it clears slot overrides) | — |
| Reload | — | — | every state comes back as saved | — |

Dir (Mine attacks / Foe attacks): the state keys include the side, so the two directions keep separate states.

## Persistence
- `ST.st[ck]`: the row's key `ck` (`side:mon key:slot`, as `crit` / `hits` / `z`). Toggle: `true`; counter: its number.
  Missing = off / 0.
- `ST.tgt[key]`: the card's key (`mine:pid` or `foe:k:i`), value `dig` / `fly` / `dive` / `min` / `switch`. Missing = none.
- Defaults in `defaults()`: `st:{}`, `tgt:{}`. Old saves merge in as now.
- No new localStorage key. No clear-all button: each state is cleared by tapping it back off.

## Edge cases
- Count caps: the counter stops at its max (no wrap past it); the stock formula's cap (160, 350, 250) applies.
- Repeated taps: each tap is one state change; no double-fire from the row's opener.
- Open row: taps on the top slot do not open the row; taps on the row body do.
- Doubles / Singles: the Field's gameType changes which Cmb toggles show; their stored value stays.
- Long names: state tags are 2–4 characters; the name keeps its ellipsis.
- The Lv / HP line at 260 px: the card mark must fit. If it does not, the mark goes only in the Edit editor and the card
  shows nothing.
- Light and dark: tags use the existing accent and muted colours.
- Text zoom: rows do not grow with zoom (the tags are fixed px like the ×n and C buttons).

## Checks
| Requirement | Check | Seed / size / mode | Assertion |
| --- | --- | --- | --- |
| Rows keep their height | `tools/scenarios/calc-state.mjs` (new) | photonic-sun, 260 × 316 and 537 × 424, normal and `dvkb` | a row with a state button is the same height as a plain row; the 4th move ends at ≤ 309 px at 260 × 316; the foe list has ≥ 222 px under the cards at 537 / 832 × 424 |
| Toggles and counters | same | an explicit `ST` seed | tap cycles; the power in the box matches the table; saved state after a reload |
| Z hides the slot | same | Photonic with Z on | no top slot on Z rows; the state comes back when Z is off |
| Doubles gate | same | Singles, then Doubles | Cmb tags only in Doubles |
| Card state | same | Dig on the foe card | Earthquake doubles; the mark shows; the mark is gone at None |
| Engine values | done: `tools/calc/state_check.mjs` (in `npm test`) | every `calc_states.json` | keep it green; the page passes the inputs exactly as "Engine inputs" says |
| Hack differences | `calc-state.mjs` | hardlove-gold | no control on the `over.state: false` moves; no Defense Curl control on Rollout |
| Settled choices 1-7 | `calc-state.mjs` | as settled | each settled behaviour, incl. C locked on a forced crit and the `pre` details line |
| Power box shows the engine's power | `calc-state.mjs` and existing `calc-*` scenarios | Photonic Facade on a burned attacker | box shows 140 and "listed 70" |
| Metronome holders have no conflicting row | build check, a new step in the Hardlove Gold and Emerald Imperium `extract/check.py` (or a shared helper) | the two holders from data | fails if a holder's set has a multi-hit or state move; lists the holders and their moves |
| Nothing else changes | `gate.py check` for every calc guide against the recorded baseline; `domcompare` (template changes) | photonic-sun, eternal-x, hardlove-gold, emerald-imperium | only the intended differences |

Build order (one template session, `template/` is shared): `git merge worktree-damage-calc` into this branch (the
engine), mock the Edit-menu controls, then the page, then the checks. `npm ci --prefix tools/calc` needs the network.
The phone preview of the built guide is the last step. Then this branch merges into `worktree-damage-calc`.

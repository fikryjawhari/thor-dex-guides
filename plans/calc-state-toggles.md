# Calc: battle-state controls (spec)

Decide session, 2026-10-26, on `worktree-damage-calc-toggles` (tab of `worktree-damage-calc`). Source: the
"Needs battle state" and "Power box readout" parts of `plans/calc-dynamic-power.md`. No template or engine change was
made in this step. Mockup: `plans/calc-state-toggles-mockup/mock.html` + `panel.html` (Thor frame, phone preview). The
probes behind the numbers are `probe.mjs` (stock engine, Node) and `presence.mjs` (which hack has which move); run
`node plans/calc-state-toggles-mockup/probe.mjs .` from the repo root. The build removes the mockup folder and these
scripts when it lands (git history keeps them).

## What changes
Per-row state controls for the moves whose power depends on battle state the page has no input for, a card control
for the target's state (Dig / Fly / Dive / Minimized / switching), and a Power box that shows every power the engine
uses. Affected: `template/calc.js` (row markup, card editor, state in `ST`), `template/calc.css`,
`tools/calc/src/adapter.js` (pass the new inputs to stock; report the power used), `template/calc/engine.js` (rebuilt),
`tools/scenarios/` (one new scenario), the calc profile where the hack needs it. Storage: the calc's existing key
`cfg.ls.dmg`; new fields only inside `ST`, and `ST` defaults cover saves from before (no key change).

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

The counter holds the earlier count, so 0 is the first use, which is the stock default. The adapter passes the stock
field as stock counts it (`timesUsed` = count + 1).

**Card control, not per row** (a Battle state select in the card's Edit editor; a short mark on the card's Lv / HP
line, like the Aura mark, while set):

| State | Mark | Doubles | Hacks |
| --- | --- | --- | --- |
| Underground | Dig | Earthquake, Magnitude | P E H I |
| In the air | Fly | Gust, Twister | P E H I |
| Underwater | Dive | Surf, Whirlpool | P E H I |
| Minimized | Min | Stomp | P E H I |
| Switching out | Switch | Pursuit | P E H I |

Magnitude's power is random and stays manual in the Power box (as now); Dig only changes its damage.

**Not in this spec**
- Metronome (item): a count across all of a Pokémon's moves, not one move. Deferred. Held in battle by one trainer in
  two guides: Hardlove Gold (Lass Krise, Pachirisu, Route 36 Schorsch Split) and Emerald Imperium (Trainer Sunbird,
  Tate and Liza Split, Mossdeep). None in Photonic Sun or Eternal X. Emerald Imperium's Fantina gets one as a reward
  (not held in battle).
- Stat changes before the hit (Meteor Beam, Electro Shot, Skull Bash, Spectral Thief): the second half of
  `calc-dynamic-power.md`. Not settled here.
- Supreme Overlord: absent from all four calc hacks.
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

Stock does **not** handle these (the probe shows no change, or the bundle has no name hit for the state), so the engine
needs the new input:
- Assurance: no stock condition in the bundle, and the adapter has no "target hurt this turn" input (the probe's
  40–48 is the plain roll).
- Revenge, Avalanche, Retaliate: no stock condition for the state.
- Fury Cutter, Echoed Voice, Rollout, Ice Ball: stock reads `timesUsed`, but the adapter never passes it.
- Pursuit: stock reads `isSwitching`; the adapter never passes it.
- Earthquake, Magnitude, Gust, Twister, Surf, Whirlpool, Stomp: no stock condition found. Confirm in the build.
- Lash Out (Hardlove): stock doubles on any negative attacker stage (`Me(r,e.boosts)<0`), i.e. a stat lowered on an
  earlier turn too. The Low toggle must replace that check, or the box and the rolls are wrong for an old drop.

## Power box
"Listed" means the move's base power in the guide's move data (`bp` in `data.json`, the same number the game's move
table gives). Today the adapter copies the engine's power only for `AUTO_POWER` and `HP_POWER` (`adapter.js`, `bp` on
the result). Every other change above reaches the rolls, but the Power box keeps the listed power. Example: Facade on
a burned attacker shows 70 in the box and hits as 140.

Decision: the Power box shows the power the damage actually uses, and the row's details say what the listed power was
when they differ.
- Opening a row shows, for example, `Power 140 · listed 70 (burned attacker)`. The number in the box is the one the
  rolls use. The box is still an input: typing a number sets a manual power, and "Reset power / type" removes it.
- The result reports `bp` whenever the power used is not the listed one (stock condition, state control, or a
  counter's formula). The box shows that number; the details add "listed 70" when they differ.
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
| Engine values | `tools/calc/*_check.mjs` (add a state case per move) | fixtures from `probe.mjs` | each row of the stock table and each engine state gives the expected roll range |
| Power box shows the engine's power | `calc-state.mjs` and existing `calc-*` scenarios | Photonic Facade on a burned attacker | box shows 140 and "listed 70" |
| Nothing else changes | `gate.py check` for every calc guide against the recorded baseline; `domcompare` (template changes) | photonic-sun, eternal-x, hardlove-gold, emerald-imperium | only the intended differences |

Build order (one template session, `template/` is shared): engine and adapter first (so the page can read the result),
then the page, then the checks. `npm ci --prefix tools/calc` needs the network; the build runs it, this session did not.
The phone preview of the built guide is the last step.

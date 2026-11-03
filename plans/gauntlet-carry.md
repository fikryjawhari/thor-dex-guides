# Gauntlets carry fight state (template, every guide)

Status: spec settled (2026-11-03, mockup approved on the phone). Next: the build (Opus main chat dispatching, Sol
agents): data unit first, then the template unit.

## What changes
In the calc, a gauntlet (trainers fought back to back with no heal) is ONE fight. Stepping between its members keeps
the player's HP / status / used items and each member's foe team as you left it. The trainer bar shows where you are
in the chain, and ↺ shows which reset the next press does. Every guide with chains; nothing changes outside the calc.

### Decided (the user, 2026-11-03)
- A gauntlet is only what a hack's docs call one: back to back / B2B / B3B / "gauntlet" / "Part of Gauntlet until
  Trainer X". Gym trainers before a leader are not (the game heals before the leader). A heal inside a gauntlet splits
  it into two chains.
- Moving to any trainer in the same chain, forward or back, keeps the fight state: no `newFight()`. Leaving the chain
  (a trainer outside it) is a new fight as today.
- Carried between members: player HP, status, used / consumed items. Per battle (fresh on each member): stat stages,
  ability toggles, scratch, hazards and hazard offers, Field (weather, terrain, screens, manual overrides, S / D:
  each member opens in its own Auto format), Mega, Disguise / Ice Face (`broken`), Toxic counter. Each member's foe
  team keeps its own state (HP, status, used items, set edits, the selected foe slot) for the whole chain.
- Snapshot: the player's side (HP, status, used items of every player Pokémon that has any), taken each time you step
  FORWARD into a member (‹ › or any route that lands on the next member from the one before). Going back takes none;
  stepping forward again retakes it (overwrites).
- ↺ Reset fight inside a chain: if the current member is not at its snapshot (player side ≠ snapshot, or its foe team
  not fresh, or any per-battle state set) the press resets the member: its foe team fresh, the player's side back to
  the snapshot, per-battle state cleared. If it already is, the press resets the gauntlet: go to the chain's FIRST
  trainer with everything fresh (every member's foe state, the player's side, snapshots: a new fight there). On the
  first member every press is the gauntlet reset. No snapshot for the member (old save): the gauntlet reset.
- Entering a member from outside the chain (Find trainer, a trainer card's Calc link, recents, ‹ › from the trainer
  before / after the chain) is a new fight that starts the chain there: everything fresh, a snapshot of that member
  taken. Its second ↺ (first, since it is at its snapshot) goes to the chain's first trainer.

## Out of scope
- Healing between chain members (some docs allow it; no guide models it): a heal ends the chain in the data.
- The AI plans (`plans/calc-ai.md`), range compare.
- The walkthrough / Trainers tab: unchanged (they show the tags as today).

## Data
- A per-trainer field `gc`: the chain's trainer keys in fight order (stable keys, never indexes), the same list on
  every member. Written by each guide's extract (`build.py` / the trainers script), a shared helper in
  `tools/extractlib.py` (`gauntlets(trainers, rules)`), schema entry in `tools/schema.py`. Only on trainers in a
  chain of 2+.
- Check (in the extract / `schema_test.py`): every `gc` list is the same on all its members, every key resolves, and
  the members are consecutive in the calc's trainer order (`D.TR`: walkthrough order, partners after their battle)
  once a starter is chosen; a starter-variant chain lists only that starter's keys.
- Rules per guide (from the 2026-11-03 audit; recheck each guide's source wording when writing the rule):
  | Guide | Source | Chains |
  | --- | --- | --- |
  | Hardlove Gold | tags `Back2Back...`, notes "Gauntlet until Trainer X" / "Part of Gauntlet..." / "End of Gauntlet", "Recurring Gauntlet" | Slowpoke Well Ariana + Proton (Proton untagged: confirm in the doc), Lighthouse 6 (Kent → Roberto), Rocket HQ three pairs (#8/#9, #10/#11, #12/#13), Whirl Islands trio (#24, Ariana, #25), Route 34 trio (Irene, Jenn, Kate), Kimono trio (Zuki, Naoko, Miki: Miki is a double) |
  | Blaze Black 2 Redux | tags `Back to Back #n`; Victory Road note "Hail then Sun, heal, Rain then Sand, heal, then Lance" | School Kids Seymour + Cassie per starter variant; Victory Road Hail → Sun and Rain → Sand (Lance alone) |
  | Emerald Imperium | tags `Back to Back` / `#n` | Aqua Museum grunts pair, Winstrates 4, Magma Hideout pair, Seafloor Cavern pair |
  | Radical Red | tags `Back to Back #n` | Celadon Hotel pair, Route 12 pair, Route 16 trio, Cerulean Cave pair, Oak pair |
  | Unbound | notes "back to back" | Ruins of Void beasts trio, birds pair (statics, counted by the rule) |
  | Photonic Sun / Eternal X | none ("Poni Gauntlet" is a place) | none |
  A tag `#n` numbers the member; chains are the consecutive run `#1 … #n` in the same section (and starter).

## Controls and states (narrow 260 × 316; wide uses the same trainer bar and fight bar)
| Control | State | Action | Result |
| --- | --- | --- | --- |
| Trainer bar name (`.dsrc`) | trainer in a chain | – | Name unchanged (`[B3B] Kimono Girl Naoko`, truncating as today). Under it, inside the button's box (no height added, `bottom:-2px`): one dot per member, 6 × 2 px, 2 px gap; done members fg, the current one accent and 10 px wide, later ones muted. Not in a chain: no dots. |
| ‹ / › | next / previous trainer in the same chain | tap | Step within the chain (carry; forward takes the snapshot). The button has an accent border and colour; aria-label / title "Previous in gauntlet" / "Next in gauntlet". |
| ‹ / › | the step leaves the chain (or no chain) | tap | New fight as today; plain button, "Previous trainer" / "Next trainer". |
| Fight bar ↺ (`.dfreset`) | not in a chain | tap | Reset fight as today; ↺, "Reset fight". |
| ↺ | in a chain, member not at its snapshot | tap | Member reset (above); glyph ↺, plain; label "Reset this fight". After it, the button turns to ⇤. |
| ↺ | in a chain, at the snapshot / first member / no snapshot | tap | Gauntlet reset: goes to the first member, all fresh, page re-renders on it (scroll as a trainer change); glyph ⇤ (bar + left chevron SVG, 12 px), accent border and colour; label "Reset gauntlet (back to <first trainer>)". |
| Find trainer / Calc link / recents | target in a chain, current trainer outside it or in another chain | pick | New fight starting the chain at the target (snapshot taken). |
| Find trainer / Calc link / recents | target in the same chain as the current trainer | pick | A step within the chain (forward = later in `gc`: snapshot; back: none). |
| Card ↺ (per Pokémon) | in a chain | tap | As today (that Pokémon fresh); doesn't touch snapshots. |
| Reload | mid-chain | – | Same trainer, the carried player side, every member's foe state and the snapshots back; scratch / per-battle state gone as today. |

## Saved state (`cfg.ls.dmg`, no new key)
- Foe state of every chain member: today's foe edits are already keyed `foe:<trainer key>:<slot>` in `ST.edits`, and
  `used` / HP / status with them; inside a chain a step no longer clears other members' entries; leaving the chain
  clears all of them (as a trainer change today). The selected foe slot per member: `ST.gcSel = {<trainer key>: slot}`.
- `ST.gc = {first: <trainer key>, snap: {<trainer key>: {<mine card key, i.e. mine:<pid>>: {hp, status, used}}}}`;
  keys only (trainer keys, pids), never positions. On load: a `first` or snapshot trainer key that no longer resolves,
  or is no longer in the current trainer's `gc` → `ST.gc` dropped (no chain state: the next ↺ is the gauntlet reset);
  a pid that no longer resolves drops that entry (that Pokémon restores to full on a member reset).
- Older saves: no `ST.gc` → loads as no chain state; nothing else changes.
- Add `ST.gc` / `ST.gcSel` (resolved to trainer and Pokémon names) to `tools/scenarios/guide-update.mjs`'s SNAPSHOT.
- Trainer keys stay append-only (`extract/trainer_keys.json`); `gc` uses them.

## Edge cases
- A double member (Miki) opens in D (Auto from its own tags); the format is per battle.
- A chain member whose `p` is all fainted when you step: no special case (you decide when to step).
- A chain of 6 (Lighthouse): 6 dots fit under the name at 260 (6 × 6 + 5 × 2 + 4 = 50 px).
- Partner entries (`~p<n>`) are never in a chain; a chain may not have one between its members (the data check).
- Starter not chosen (BB2R): the hidden-variant filter is off, so ‹ › from Seymour (Tepig) may land on another
  starter's Cassie: not in `gc`, so a new fight. Correct.
- Text zoom: the dots sit in the name button; they must not push the trainer bar past 22 px.
- Light theme: dots use `--fg` / `--acc` / `--mut`, as in the mockup.

## Checks
| Requirement | Scenario | Seed / size | Action and assertion |
| --- | --- | --- | --- |
| Carry and snapshot | new `tools/scenarios/calc-gauntlet.mjs` | Hardlove (Kimono chain), a 3-mon custom team, 260 × 316 | Hit mine and a foe at Zuki, › to Naoko: mine's HP carried, Naoko's team full, Zuki's state kept; ‹ back: Zuki's foes as left, no new snapshot; › again: snapshot retaken. |
| Per battle | same | same | A stage, a manual weather and S/D at Zuki are gone at Naoko; Mega / `broken` cleared. |
| ↺ twice | same | same | At Naoko after damage: ↺ (glyph ↺) → foe fresh, mine = snapshot, glyph now ⇤; ↺ → on Zuki, every member fresh, mine full. On Zuki: one press = full reset. |
| Leaving / entering | same | same | › from Miki to Ethan: new fight (all fresh, no `ST.gc`); Find trainer → Naoko from Hugh: new fight with a snapshot, ⇤ goes to Zuki. |
| Reload | same | same | Mid-chain reload keeps all of the above; a stale `ST.gc` (unknown key) loads as none. |
| Markers | same + `calc-layout.mjs` | 260 × 316 normal / `dvkb`, 480 × 316 | Dots present only on chain members, count = `gc.length`; ‹ › accent only within the chain; trainer bar still 22 px. |
| Data | `schema_test.py` / each extract's check | every guide | The `gc` rules above; the per-guide chain list matches the table. |
| Update | `guide-update.mjs` | every guide | Snapshot includes `ST.gc` / `ST.gcSel` by names. |

Build units: (1) data: `gc` helper, schema, per-guide rules, rebuild every guide's data.json (one agent, Sol);
(2) template: calc.js carry / snapshot / ↺ / markers, calc.css, README (Damage calculator → Fight state), scenario
(one agent, Sol), after (1) merges. Finish: `preview.py --frame` on Hardlove, the user tests on the Thor; the full
gate by whoever merges last.

# Offline damage engine

From the repository root:

```sh
npm ci --prefix tools/calc
node tools/calc/build.mjs
node tools/calc/test.mjs
```

Only rebuilding/testing needs npm. Commit `template/calc/engine.js` after every
adapter/dependency change. `assemble.py` inlines this committed, minified IIFE
without Node or a network. The banner preserves Smogon's MIT notice. Dependencies
are exact versions, with npm's integrity hashes in `package-lock.json`.

## Emerald Imperium validation

Emerald Imperium's `imperium_check.mjs` is also included in `npm test`. It checks source-derived category
estimates and conditional attack modifiers independently of hzla, plus field parity and priority/order contracts.
Per-mon `abilityOn` is opt-in for the profile's `monControls`; `categoryInvert` names moves whose `slot.invert`
swaps automatic category. Such results expose `categoryChoice: {automatic, inverted, tie}` and all results expose
effective `priority`. EI's `slot.order: "first" | "last"` feeds order-dependent power without guessing a foe's move.
These are battle inputs, not save/import facts; absent states stay off. See EI notes for source rules and differences.

## Hardlove Gold validation

Hardlove Gold has a provisional source/stock suite in `hardlove_check.mjs`, included
in `npm test`. Its fixtures use `oracle.kind: "source-and-stock-reference"`, not
runnable hzla settings; do not pass them to `hzla_compare.mjs`. Reports explicitly
say `independentHackOracle: false`. Hack notes list in-game checks and unsupported
type-history states (Protean / Libero: every-move STAB, a chosen defending type). `node tools/scenarios/calc-hardlove.mjs` checks its
actual controls and persistence at every viewer size/mode.

An explicit profile `evs: false` ignores supplied EVs in both `stats` and `calc`;
omitting it preserves EV-aware behaviour. This is independent of the guide's
`cfg.evs` UI switch so direct engine calls cannot accidentally add EVs.

## Photonic Sun validation

`node photonic_check.mjs` (also in `npm test`) validates the Photonic Gen 7 field profile:
107 fixtures, direct stock Gen 7 parity for non-inverse cases, explicit inverse effectiveness and positive/negative
field assertions. `node tools/calc/hzla_compare.mjs photonic-sun` from the repository root compares against the
pinned `pspm` oracle: 101 exact matches and 6 documented differences (Wonder Room and defensive Flower Gift).
These differences retain stock Gen 7, not oracle bugs; see the hack's notes. No shared engine change is needed.
`node tools/scenarios/calc-photonic.mjs dist/photonic-sun.html` checks actual controls/options and persistence at
five viewer sizes in normal/dvkb modes. Its profile adds inverse, Flower Gift and Battery to the Gen 7 fields
without altering another guide's field list. Inverse is expressed as a per-defending-type effectiveness rule;
ability immunities still apply. This is a field pass, not a complete audit of Photonic's individual effects.

## Eternal X validation

`node eternal_check.mjs` (also in `npm test`) validates the Eternal X Gen 6 field profile: 97 fixtures,
direct stock Gen 6 parity for every non-inverse case, hand-checked Wonder Room/defensive Flower Gift rolls,
inverse effectiveness and positive/negative field assertions. `node tools/calc/hzla_compare.mjs eternal-x --fetch`
from the repository root compares all 97 cases exactly against the older Dynamic-Calc, not Decomps.
`node tools/scenarios/calc-eternal.mjs dist/eternal-x.html` checks fields/options and persistence at five viewer
sizes in normal/dvkb modes. The profile adds inverse and both Flower Gift sides to Gen 6's existing controls;
it does not enable Psychic terrain, Aurora Veil or Battery, or change any other guide. See Eternal X's notes
for the pin, checks and remaining individual-effect/in-game work.

## Data ownership and size

The adapter supplies its own Generation interface to Smogon's Gen 4, Gen 5/6 and
Gen 7/8/9 mechanics, rather than wrapping a stock generation with per-call
overrides. `P` owns species stats, types, evolution eligibility and abilities;
`M`/`MV` own move power, type, category and priority; `TC` owns the type chart
(values divided by ten). Mega/Primal display names are normalised to Smogon's
names, but callers always select a guide species ID. Unknown species/forms work.

The build retains upstream move effect metadata/flags, species weights/genders,
item metadata, ability names, natures and generation-specific type fallbacks.
It strips upstream species stats/types/abilities and unused Z/Max power metadata,
delta-encodes the six generations, and tree-shakes away Gen 1/2/3/Champions
mechanics and the stock generation API. This is smaller than shipping stock
species tables plus the guide's existing tables. Build output reports byte/gzip
sizes and the largest contributors; retained fallback metadata dominates.
A guide form whose name is not a stock species ("Raichu Alolan", "Heat Rotom",
"Shellos (East Sea)", "Pyroar Female") takes the weight of the first stock spelling
`weightNames()` (`src/names.js`, shared with `hzla_compare.mjs`) finds, most specific first, then its base species (a hack's own
Megas: the base species until the profile sets `over.species[id].weightkg`); only
an unplaceable name falls back to 1 kg. Missing move metadata falls back to a plain attack.
Hack-original `x` moves and `AB[i][2]` abilities have no special effect unless
explicitly mapped in `over`. Unrecognised item/ability names have no effect.

## Public contract

`window.DMG` exposes `init(D, prof)`, `stats(set)`, `calc(atk, def, slot, field)`, `hp(atk, def, slot, field, dealt)`,
`residual(set, field = {}, otherSet = null, side = 'atk')`,
`speed(set, field = {}, side = 'atk')` and `entry(set, field = {}, side = 'atk')`.
Initialisation replaces all guide state and clears KO caches. It does not change
the supplied data/profile. `stats` returns unstaged `[HP, Atk, Def, SpA, SpD, Spe]`.
An absent ability means none, not the species' default. Defaults are level 50,
31 IVs, zero EVs/stages, neutral nature and full HP. `hp: 0` is retained.

Damage `rolls`, `min`, `max` describe **hit 1**. Optional `per` contains one
16-roll array per hit, and is present only when the hits differ. When absent,
repeat `rolls` exactly `hits` times. `pmin`/`pmax` cover all selected hits
as a percentage of maximum defender HP. The result's `cat` is `Physical` or
`Special`. Status, absent/zero power and variable power without an explicit
positive `slot.bp` return null. `slot.t` changes the type. Explicit power on a
variable move makes it a plain fixed-power attack, rather than allowing
upstream weight/speed/fixed-damage rules to overwrite the user's input.

`ko` is the first use count 1-4 with a nonzero KO chance against current HP,
otherwise `{n:0,p:0}` (5+). It convolves independent equiprobable rolls per hit,
not correlated per-use totals. No between-turn healing, hazards, poison, recoil,
accuracy or crit probability is included. Zero current HP returns `{n:0,p:0}`;
the UI supplies the separate fainted label. Percentages can exceed 100.
Every use repeats the returned set of per-hit distributions. Sequential effects
within a use (Triple Axel/Kick scaling, defensive changes, Parental Bond) retain
their own distributions. Changes between uses are not simulated. `eff: 0` means
immune, and `notes` contains short modifier labels including declarative rule notes.

`bp` is present whenever the first hit's power differs from the listed power:
state counters, stock power changes (Facade, Hex, Brine, Knock Off, Weather
Ball, Payback, Acrobatics), the hack's own `movePower` rules, rounded as the
game does (Gen 5+ half down, Gen 4 floor). Not for a power the page sets, Z-moves
or moves whose power changes hit by hit (they return `per`).

### HP moves

Fixed / fraction damage (`FIXED`, `OHKO`, `TAKEN` in `adapter.js`) returns an ordinary result with `fixed: true`:
16 equal rolls (Psywave: its 50-150% spread), the type chart and immunities from a power-100 run of the move. Seismic
Toss / Night Shade = level, Dragon Rage 40, Sonic Boom 20, Super Fang / Nature's Madness / Ruination = half current HP,
Guardian of Alola 3/4, Endeavor = target HP - user HP, Final Gambit = user HP, OHKO = target HP (0 against a higher
level, Sturdy, Ice vs Sheer Cold from Gen 7). Counter / Mirror Coat / Bide (2x), Metal Burst / Comeuppance (1.5x) read
the damage taken from `slot.bp`, null without it. `hp(atk, def, slot, field, dealt)` is the user's own HP change from
one use given the damage dealt: `{v, l, set?, st?, later?}` or null (`set` Pain Split's new HPs, `st: 'slp'` Rest,
`later` Wish). Recoil and drain use the move data's fractions (Gen 5+ round half up, Gen 4 floor, at least 1), Rock
Head / Magic Guard, Big Root, Liquid Ooze, Dream Eater on a sleeper; plus Struggle, Mind Blown family, Life Orb (not
with Sheer Force), Shell Bell, self-KO moves, heals (weather for Moonlight family, sand for Shore Up, Strength Sap =
the target's staged Attack, Swallow at one Stockpile, Purify on a statused target), costs. Not covered: Floral Healing
/ Heal Pulse, crash damage, Rocky Helmet / Rough Skin. Psywave's 16 rolls are an even spread over its 101 (Gen 5+) /
11 (Gen 4) outcomes. Tests: `test.mjs` (fixed damage, `DMG.hp`), `hardlove_check.mjs`
(OHKO).

### Battle state

Optional inputs; a page that passes none gets the same rolls as before.

| Input | Meaning |
| --- | --- |
| `slot.st` | The row's state. Counters take the earlier count (0 = first use), clamped: Fury Cutter (power doubles to 160), Echoed Voice (+listed per turn, 200), Rollout / Ice Ball (×2 per hit, 4), Rage Fist (+50 per hit, 6), Last Respects (+50 per faint, 100). Toggles take `true` (power ×2): Assurance, Revenge, Avalanche, Retaliate, Stomping Tantrum, Temper Flare, Lash Out, Fusion Flare / Bolt, Round, Fickle Beam. Pledges take the partner pledge's name: power 150, the pair's type, always STAB. Never stock `timesUsed`, which repeats the hit over turns. |
| `slot.curl` | Defense Curl used earlier: Rollout / Ice Ball power ×2. |
| `slot.met` | Earlier consecutive uses with a held Metronome (stock `timesUsedWithMetronome`). |
| `atk.fnt` | Fainted allies, 0-5 (Supreme Overlord, stock `alliesFainted`). |
| `def.vol` | `dig` (Earthquake, Magnitude), `dive` (Surf, Whirlpool), `fly` (Gust, Twister), `min` (Stomp, Steamroller, Body Slam, Dragon Rush, Flying Press, Heat Crash, Heavy Slam from Gen 7, Malicious Moonsault, Supercell Slam; Phantom / Shadow Force in Gen 6 only): damage ×2 (a built-in `finalMods` rule ahead of the hack's, note `Dig` / `Dive` / `Fly` / `Minimize`); before Gen 5 (Gen 6 for `min`) the power doubles instead. `switch`: Pursuit's switching target (stock `isSwitching: 'out'`). |

### Crit

Every result has `crit: {stage, p, forced}`. `stage` counts the move's `MV.cr`
(data.json; 6 = always a crit, a guarantee rather than six stages; without any `cr`
in the data, stock's high-crit and always-crit moves), the pumped state (field
`atkFocus`: Focus Energy, Dire Hit or an eaten Lansat Berry, +2; `defFocus` is the
other side's), one held item (Scope Lens / Razor Claw +1, Leek / Stick +2 for
Farfetch'd / Sirfetch'd, Lucky Punch +2 for Chansey; `over.critItems` changes one,
by species name) and Super Luck +1, capped at the table's last index. `p` is the
table's chance (Gen 4-5 1/16 1/8 1/4 1/3 1/2, Gen 6 1/16 1/8 1/2 1, Gen 7+ 1/24
1/8 1/2 1, or the profile's `critStages`). `forced` (always-crit move, Merciless on
a poisoned target, a stage the table makes certain) makes the hit a crit whatever
`slot.crit` says, p 1; Battle Armor / Shell Armor (unless the attacker breaks molds)
make p 0, not forced, and no crit. `slot.crit` still picks crit damage for an
ordinary hit. Laser Focus, Lucky Chant and Dragon Cheer have no input yet.

`over.state` (per hack) changes a move whose source differs: `false` = the state
input does nothing, `{curl: false}` = Defense Curl doesn't double it, `{vol: false}`
/ `{vol: "power"}` = the target's state doesn't double it / doubles its power
instead of its damage, `"Spectral Thief": false` = no theft (Hardlove), `{theft:
"headroom"}` = expansion's theft (Imperium: a stat at +6 is skipped, the gain is cut
to the room left before Simple / Contrary). Fixtures: `hacks/<hack>/calc_states.json`,
checked by `state_check.mjs` (in `npm test`); each case cites its rule.

### Stat changes before the hit

A result has `pre: [{who, stat, by, src, hit?}]` when the hit changes a stage before
it lands (absent = none; actual changes only, after Simple / Contrary and the ±6 cap;
the input stages are the starting point, never a trigger of their own). First-hit
events change the stages the hit uses: a held terrain seed in its terrain (consumed;
not under Magic Room or Klutz); on entry Dauntless Shield and Intrepid Sword (on unless
the set's `entry` is `false`) and Download (the set's `dl`: missing = from the target's
staged Defense vs Special Defense, tie = SpA; `"atk"` / `"spa"` = the boost it got,
kept whatever the target; `"off"` = none); stock's own copies never fire. The move's
own: the charge turn of Skull Bash (Def) / Meteor Beam / Electro Shot (SpA) and
Spectral Thief (the target's losses, then the attacker's gains; none against an immune
target); `slot.pre: false` leaves them out (the row's "without" view). Between-hit
events carry `hit`, the
next hit they come before: Stamina, Water Compaction, Weak Armor (Spe +1 before Gen
7), Justified, Steam Engine, Cotton Down (the attacker's Speed), and once per item
Weakness Policy, Kee / Maranga Berry, Luminous Moss, Absorb Bulb, Cell Battery,
Snowball. Stock works the Defense ones into the later hits; a later hit of Foul Play
does not read the target's new Attack. Post-move events (Berserk, Anger Shell, KOs),
random secondaries and history (Intimidate, Rage, Charge) stay manual stages.

## Base profiles and fields

The six committed JSON bases contain generation defaults, not verified hack
mechanics. `expansion` uses Gen 9; `cfru` uses Gen 8 as a modern family starting
point; `gen4` through `gen7` use their numbered mechanics. A later per-hack audit
must pin family configuration differences. They deliberately omit save readers.
`lv`, `stages`, `status`, `natures`, `abilities`, `items`, `field`, `multihit` and
`varpow` are the renderer's capability/control declarations. `multihit` is keyed
by move name with `[minimum,maximum,default]`; fixed-hit moves have equal values.
`zmove: true` (Gen 7 hacks; Photonic) lets a slot's `z` turn a damaging move into its Z-move (stock `useZ`: the
type's Z-move, or the signature one for the held Z-crystal; one hit). Z power is the game's band for the move's power,
so a hack's changed powers carry over, except the stock Z powers that are not the band (`catalog.zpow`, built from
stock Gen 7, used while the hack leaves the move's power alone); a hack that sets a move's Z power in its game data
lists it in `zpow` (`{"Arm Thrust": 140}`), which wins. The result then carries `z` (the Z-move's name).
`varpow` lists upstream attacks lacking a fixed base power; `MV.bp === "Varies"`
counts the same. Those stock can work out from the battle state (`AUTO_POWER` in
`adapter.js`: Low Kick, Grass Knot, Heavy Slam, Heat Crash, Flail, Reversal, Gyro
Ball, Electro Ball, Crush Grip, Wring Out, Hard Press, Punishment, Fling, Natural Gift) get it
automatically and return it as `bp`; a slot `bp` still overrides (as a plain
fixed-power move). Return and Frustration default to 102 (maximum happiness / none; `DEFAULT_POWER`,
the same in all four guides' sources), reported as `bp`. The rest return null until the page sets a power.

Field entries are `{k,l,type,o?,side,to}`. The UI stores `field[k]`; `to` names a
Smogon Field property for `side: "field"`, or a Side property for `atk`/`def`.
For example `defReflect` maps to `defenderSide.isReflect`, and `atkHelpingHand`
to `attackerSide.isHelpingHand`. These are relative to the **current attack**:
the UI must exchange atk/def entries when calculating in the other direction.
Select values must be in the entry's `o` list. Unknown keys are ignored, except
the built-in side-state keys below, which work independently of profile field entries.
No terrain/Aurora Veil is declared before its generation. Type availability is
driven by `TC`, not the field list; without a guide chart the stock generation
has no Fairy before Gen 6. Tailwind and Swamp affect internal speed checks and
`DMG.speed`; `DMG.stats` remains intentionally unstaged.

### Stackable side states and hazards

The engine accepts each of the following suffixes with `atk` or `def` prefixes,
without requiring the profile to declare a UI control. UI availability belongs
to the guide's generated profile; the engine does not read source-move lists.
Fields remain relative to the current attack: exchange prefixes when reversing
the matchup. `side` in the utility APIs selects which prefix describes `set`;
`otherSet` uses the opposite prefix. Calls do not modify sets, field values,
guide data or profiles.

- Turn end: `Trapped`, `Seeded`, `SaltCure`, `Cursed`, `Nightmare`, `Ingrain`,
  `AquaRing`, `SeaOfFire`. `residual` returns the existing array of
  `{l, v: [turn1, turn2, turn3, turn4]}`; negative values are damage. Its existing
  one/two-argument calls still describe the attacking side. The third argument
  is now the opposing set, not an internal Smogon Pokemon. KO evaluation calls
  `residual(def, field, atk, 'def')` and does not include entry hazards.
- Trapping reads Binding Band from the opposing set, never the trapped set:
  Gen 4 is 1/16, Gen 5 is 1/16 or 1/8 with the band, Gen 6+ is 1/8 or 1/6.
  Seed damage is 1/8; the opposing seeded set supplies a matching recovery part,
  with the recipient's active Big Root multiplying recovery by 1.3, floored
  after the base fraction. Liquid Ooze reverses that recovery. Magic Guard
  blocks residual damage, including Liquid Ooze, and prevents seed recovery
  from a guarded source. Ingrain and Aqua Ring each restore 1/16, also using
  Big Root. Salt Cure is 1/4 on Water/Steel and 1/8 otherwise; Curse/Nightmare
  are 1/4 (Nightmare requires sleep or Comatose). Sea of Fire is 1/8 for
  non-Fire types from Gen 5. Bad Dreams is automatic from the opposing ability
  while asleep or Comatose. Item suppression and weather suppression apply.
- Damage: `Charge`, `Protect`, `Foresight`, `MiracleEye`, `TarShot`,
  `GlaiveRush`, `Roost`, `Grounded`, `MagnetRise`, `Telekinesis`. Charge and
  Protect use the stock side flags, including quarter-strength Z damage through
  Protect. Foresight removes Ghost's Normal/Fighting immunity; Miracle Eye
  removes Dark's Psychic immunity. Tar Shot doubles Fire effectiveness once,
  not once per defending type. Glaive Rush doubles damage, including the
  reachable fixed-damage path. Roost removes Flying (pure Flying becomes Normal
  in Gen 4, typeless thereafter). Grounded and Ingrain override Flying,
  Levitate, Air Balloon, Magnet Rise and Telekinesis; Gravity and an effective
  Iron Ball also ground. Magnet Rise/Telekinesis block Ground attacks unless
  overridden or the move is Thousand Arrows. Grounding is shared by damage,
  terrain and entry checks without changing unrelated defending types.
  Type-removing states are applied before profile effectiveness rules; temporary
  Ground immunity and Tar Shot's extra multiplier apply afterwards. Inverse
  battles therefore do not turn Magnet Rise / Telekinesis into weaknesses or
  invert Tar Shot's damage boost.
- Speed: `Swamp` joins the stock speed-modifier chain at 1/4, so rounding,
  Tailwind, stages, weather abilities, held items and paralysis remain stock.
  `speed` returns the final numeric speed for display, not the unstaged stat.
  Its single-set signature cannot inspect an opposing weather-suppressing
  ability; callers should pass the effective weather when needed.
- Entry: `StealthRock` (boolean), `Spikes` (0-3), `ToxicSpikes` (0-2),
  `StickyWeb` (boolean), `Steelsurge` (boolean, engine only). `entry` returns
  `{parts: [{l, v: number}], status?: 'psn' | 'tox', spe?: -1 | 1}`. Damage
  is negative, separate from turn-end residuals and not applied by the engine.
  Rock and Steel hazards use the guide chart and a 1/8 base fraction. Spikes
  use 1/8, 1/6, 1/4 and require grounding. Effective Heavy-Duty Boots block all
  entry effects from Gen 8; Magic Guard blocks damage, not poison or Web.
  Toxic Spikes require grounding, an empty status, and no type/ability/terrain
  poison immunity. Poison entrants never consume layers. Web requires grounding
  and Gen 6+, respects stat-drop immunity and Clear Amulet, and returns an
  **absolute** stage: -1 normally, +1 for Contrary, independent of the current
  speed stage. There is no reciprocal/reflected Web effect and no White Herb
  consumption. Rock/Toxic Spikes require Gen 4, Steelsurge Gen 8. Layer inputs
  are integer-clamped; active hazards are never consumed.

The engine still supports only Gen 4-9. The historical Gen 1 seed fraction and
Gen 2-3 trapping branches are not reachable profiles and do not broaden support.
These APIs report four static residual turns/one entry event; they do not advance
turns, expire conditions, absorb Toxic Spikes, consume items, auto-clear trapping
after switching/fainting, or simulate self stat-reactions such as Defiant.
Callers apply returned parts with normal HP bounds and clear manual toggles.
The focused field groups in `test.mjs` are included in `npm test`.

## Engine overrides (`prof.over`)

`assemble.py` recursively merges the base with each hack's `cfg.calc`. Optional
override entries use **display names**, except species may use their guide ID:

```json
{
  "critMultiplier": 2,
  "critStages": [0.041666666666666664, 0.125, 0.5, 1],
  "typeChart": {"Ghost": {"Steel": 0.5}},
  "abilities": {"Custom Strength": {"effect": "Huge Power"}},
  "items": {"Custom Band": {"effect": "Choice Band"}},
  "moves": {"Custom Strike": {"effect": "Tackle", "flags": {"contact": 1}}},
  "species": {"906": {"weightkg": 155.5, "baseStats": {"atk": 110}}},
  "status": {"custom_burn": "brn"}
}
```

- `afterMove` lists held items the hack fires after the whole move, not between hits (Hardlove: Kee / Maranga Berry,
  move step 17 with Red Card / Eject Button): no `pre` event, and later hits keep the starting stage. Elsewhere Kee /
  Maranga fire once, before hit 2 (stock re-raised them on every later hit: patched in `build.mjs`, 2026-10-26).
- `critMultiplier` is applied at the actual critical-hit rounding step in every
  supported generation, **not** by scaling final rolls. `build.mjs` checks exact
  single-occurrence upstream source patches and fails if they drift. Default
  behaviour is unchanged. Sniper remains an additional 1.5 multiplier.
- `typeChart` uses ordinary multipliers (0, 0.5, 1, 2), unlike `D.TC`'s x10
  encoding; it has precedence over `TC` and stock data. Additional guide types
  are supported through `TC` rows. `typeGen: 4..9` explicitly selects a stock
  chart instead of `TC`, independently of `gen`; `typeChart` still wins.
- `moves`, `species` and `items` recursively overlay the upstream data shape
  after guide data. For species this includes `baseStats`, `types`, `weightkg`,
  `nfe`; for moves `basePower`, `type`, `category`, `flags`, `multihit`, `willCrit`,
  `overrideDefensiveStat`, etc. Arrays replace rather than merge.
- `effect` aliases abilities/items/moves/species to an existing engine effect;
  `effect: ""` disables a named ability/item/move effect. Unknown moves already
  behave as plain attacks. New effects use the declarative rules below, never
  JavaScript embedded in JSON. Guide display labels and IDs remain unchanged.
  An alias takes the engine record of its target name, so do not alias a move to
  a name another guide move already uses (EI's Draco Barrage and its own Shell
  Side Arm would share one record, and Smogon's merge leaks flags between them).
  Express that move's behaviour with a rule on `names.*` instead.
- `status` maps declared profile status keys to upstream status keys. Only
  statuses present in `profile.status` are accepted.
- `critStages` (or `over.critStages`) is the crit chance per counted stage when the
  hack's table differs from its generation's (Hardlove's five entries); see Crit.
  Stat-formula changes outside the exposed phases and new generation mechanics
  require engine work.
- `residual` adds a hack's own end-of-turn effects to `DMG.residual` / the KO text:
  `{abilities: {Name: [sign, divisor]}, status: {key: [sign, divisor, label]}}` (EI: Self Sufficient, Frostbite).

### Ordered modifier rules

`over.rules` is an ordered array of rules. Each rule selects a `phase`, optionally
tests `when`, then performs actions in this order: `set`, `value`, `remove`,
`replace`, `append`, `note`. Rules at the same phase run in array order. Omitted
`when` means always. Actions are optional; `value` replaces the phase's scalar,
array or object, while `set` mutates selected context paths. `remove`, `replace`
and `append` are only valid on array-valued phases. `remove` removes the first
matching value; `replace` replaces the last matching value, doing nothing if
absent. Unknown phases/operators fail explicitly rather than returning vanilla
damage. These profiles are trusted build inputs, not a general sandbox for
untrusted JSON.

Synthetic example, not a port of any hack's profile:

```json
{
  "items": {"Practice Band": {"effect": ""}},
  "rules": [
    {
      "phase": "attackMods",
      "when": {"op": "and", "args": [
        {"op": "eq", "args": [{"ref": "names.atkItem"}, "Practice Band"]},
        {"op": "eq", "args": [{"ref": "move.category"}, "Physical"]}
      ]},
      "append": [8192],
      "note": "Practice strength"
    },
    {
      "phase": "movePower",
      "when": {"op": "eq", "args": [{"ref": "names.move"}, "Practice Strike"]},
      "value": {"op": "mul", "args": [{"ref": "value"}, {"ref": "state.hit"}]}
    }
  ]
}
```

This example doubles physical Attack in modern mechanics, and gives a custom
move linearly increasing per-hit power. Use `append: [2]` for the Gen 4 attack
modifier equivalent. Use `set: {"move.type": "Fire"}` at `afterMoveType` for a
type change, or `value: false` at `critical` to suppress a selected critical hit.

#### Phases and rounding

| Phase | `value` and placement |
| --- | --- |
| `hits` | Integer hit count, once per calculation, after the requested or default count and before final-stat preparation. Rules may change it (a Parental Bond-like extra punch); the result is clamped to 1-10 and a non-number throws. `state.hits` follows it. |
| `beforeStats` | Mutation only, before native final-stat preparation; edit boosts, status, effects or field flags here. |
| `afterMoveType` | Mutation only, after native initial move-type changes. |
| `effectiveness` | Scalar for each defender type; `state.effectivenessType` identifies that type. Runs before native immunity exits. |
| `critical` | Boolean after native critical eligibility; may differ by hit. |
| `turnOrder` | `"first"` or `"last"` in speed-dependent base-power selection. |
| `movePower` | Scalar move-specific base power before power modifiers; hit-aware. |
| `powerMods` | Native base-power modifier list, before chaining. |
| `attackMods` | Native attacking-stat modifier list, before chaining. |
| `defenseMods` | Native defending-stat modifier list, before chaining. |
| `attack` | Scalar attacking stat after native modifiers. |
| `defense` | Scalar defending stat after native modifiers. |
| `hitBaseDamage` | Scalar base damage for each hit, after the native base damage and the spread step, before Parental Bond (Child), weather and crit. Hit-aware: `state.hit` is 1 for the first hit. Rules own rounding; `floor(value * 0.5)` is EI's half-down for ×0.5. Gen 4 sees the value before its `+2` constant, which Smogon adds with its final modifiers, so a Gen 4 rule halves 15 (not 17) to get 7 + 2. |
| `beforeWeather` | Mutation only, immediately before weather's damage adjustment. |
| `baseDamage` | Scalar at the end of native base-damage processing, including critical rounding. |
| `finalMods` | Native final-damage modifier list before chaining. |
| `beforeRolls` | Mutable damage-input object before random rolls, once per hit. |
| `roll` | Final integer for one random roll; `state.rollIndex` is 0-15. |

These are semantic insertion points in our pinned Smogon engine, not promises
that another calculator has identical intermediate state or ordering. Inspect
`instrument.mjs` and compare final rolls when translating a profile.

In Gen 5-9 the four `*Mods` phases use fixed-point numbers, **4096 = 1x**.
Native chaining, clamping and generation rounding remain in Smogon code. Gen 4
inlines its native modifiers instead of collecting lists: our four custom lists
start empty and use ordinary multipliers, applied sequentially with `floor`.
Its native inline modifiers have already run at the corresponding custom phase.
For a changed Gen 4 effect, suppress that native effect first, then add the new
one; do not assume a native array entry exists to replace. Use scalar phases
and explicit rounding expressions if the hack needs a different operation order.

Numeric modifier replacement can collide with an unrelated equal multiplier.
Prefer disabling a changed named effect with `effect: ""` (or changing the live
effect in `beforeStats`) and supplying its replacement with a rule conditioned
on `names.*`. This is our equivalent of an explicit named-effect handoff; there
is no synthetic `modifierId` injected into every native effect block.

`beforeRolls.value` in Gen 5-9 has `baseDamage`, `effectiveness`, `isBurned`,
`stabMod`, `finalMod`, `protect`. Gen 4 has `baseDamage`, `stabMod`,
`type1Effectiveness`, `type2Effectiveness`, `filterMod`, `ebeltMod`,
`metronomeMod`, `tintedMod`, `berryMod`. These are native internal units, not
interchangeable across generations. Rule writers own integer rounding when
replacing a scalar; the adapter does not silently round a custom `roll` value.
Native early exits (status, zero power, immunity, fixed damage) may bypass
later phases. Variable-power input is still required before rules execute.

#### Context, expressions and actions

Paths are dot-separated, including array indices. Available roots:

- `atk`, `def`: live engine Pokemon, including `rawStats`, `stats`, `boosts`,
  `types`, `status`, `item`, `ability`, `species`, `originalCurHP`.
- `move`, `field`, `desc`: live engine objects and description metadata.
- `names`: original guide names `atk`, `def`, `atkAbility`, `defAbility`,
  `atkItem`, `defItem`, `move`. Match custom names here, not engine effect aliases.
- `input`: original `{atk,def,slot,field}`; read-only, with guide IDs/indices.
- `mechanics`: numeric profile generation. `meta` contains `atkItem`, `defItem`
  and `move` metadata, including profile-added properties for classification.
- `state`: mutable scratch data per calculation; `hit` is 1-based, `hitCount`
  is 0-based, `hits` is the count after the `hits` phase, `originalPower` is
  supplied power. Phase-dependent keys include `isCritical`, `basePower`,
  `typeEffectiveness`, `effectivenessType`, `hitsPhysical`, `rollIndex`. Do not
  assume every key is available in every phase. Scratch state survives between
  hits, not matchups. The loop's `hit`/`hitCount` are authoritative: a native
  function's own parameter of the same name (Gen 5 base-power modifiers default
  `hit` to 1) does not overwrite them. A rule can set a flag at `hits` and read
  it later, which is how the ORA rule keeps the second hit to single-strike moves.
- `value`: the current phase value.

Writable roots for `set` are `atk`, `def`, `move`, `field`, `state`, `desc`,
`value`. Input/data/profile objects are not modified. Mutate properties, not an
entire context root, when the change must reach native mechanics. Forbidden
path components are `__proto__`, `prototype`, `constructor`, `gen`. Expressions
have a depth limit of 40; no function calls, code strings or `eval` are accepted.

Expressions are JSON primitives, recursively evaluated arrays, `{ "ref": "path" }`,
`{ "literal": <JSON> }` for deep-cloned object/array literals, or
`{ "op": "name", "args": [<expressions>] }`:

| Operators | Meaning |
| --- | --- |
| `and`, `or`, `if` | Short-circuit boolean combination; `if` has condition/yes/no arguments. |
| `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `not` | Strict equality/comparison and boolean negation. |
| `in`, `includes`, `startsWith`, `intersects` | Membership (`in`: right contains left), containment, prefix and array overlap. |
| `add`, `sub`, `mul`, `div`, `mod`, `min`, `max` | Arithmetic; `add`/`mul`/`min`/`max` accept multiple arguments. |
| `floor`, `ceil`, `round`, `pokeRound` | Explicit rounding; `pokeRound(x)` is `ceil(x - 0.5)`. |
| `of32`, `of16` | Native unsigned 32-bit / low 16-bit arithmetic. |
| `coalesce`, `lookup`, `positiveSum` | First non-nullish argument; object/key lookup; sum of positive object values (boosts). |

`set` is a path-to-expression object, evaluated in insertion order. `value` is
one expression. `remove`/`append` contain expression arrays; `replace` contains
`{"from": <expression>, "to": <expression>}` entries. `note` is an expression
converted to a short string and deduplicated in the result's notes.

### hzla profile concept → our over key

Reference reviewed: hzla/Dynamic-Calc-Decomps, branch `decomp`,
`agent_notes/romhack_modifier_config.md`, profile registry and selected profiles
under `calc/mechanics/romhacks/`, plus generation/type settings. That repository
has no licence for its changes. This engine contains **no copied or translated
hzla implementation or profile tables**. The table describes independent
configuration concepts, not drop-in source compatibility. Per-hack sessions
must derive their own data and compare all 16 rolls against a locally run
reference before marking a hack verified.

| hzla profile concept | Our profile / `over` key |
| --- | --- |
| Title matchers, profile id, supported gens, registry ordering | Explicit hack `cfg.calc.base`, `gen`, `over`; no title matching or browser globals. |
| Species/move data generation (`gen`) | Guide `D.P`, `D.M/MV/AB`; metadata overlays `over.species/moves/abilities/items`. Our `gen` selects mechanics, not guide species data. |
| Damage-mechanics generation (`dmgGen`) | Top-level profile `gen` (4-9), independent of guide data. |
| Type-generation setting (`types`) | `over.typeGen`; normally guide `D.TC`, then `over.typeChart` per-pair changes. |
| Critical multiplier / critical-rate stages | `over.critMultiplier` / `over.critStages` (rates metadata only); explicit slot crit. |
| Shared context, temporary state, description annotations | Rules read live `atk/def/move/field`, scratch `state`, and `desc`; `note` labels the result. |
| Pre-stat/switch-in adjustments | `beforeStats` rules and declared field flags for external switch-in state. |
| Move-type conversion / custom weather types | `afterMoveType` rules; `move.type`, `field.weather`, original-name tests. |
| Per-type effectiveness / immunity | `effectiveness` rules; `state.effectivenessType`; static `over.typeChart`. |
| Critical eligibility hooks (`criticalHit`) | `critical` rule value, optionally conditioned on hit. |
| Turn-order hooks | `turnOrder` rule value; `field` flags / input state as needed. |
| Move base-power hooks (`moveBasePower`) | `movePower` scalar rules; `state.hit`/`originalPower` for per-hit formulae. |
| Base-power modifiers (`basePowerMods`) | `powerMods` rules, `append` / `remove` / `replace` / complete `value`. |
| Attack / defence modifier hooks | `attackMods` / `defenseMods` rules; scalar `attack` / `defense` for post-chain adjustments. |
| Named modifier handoffs, skip-default markers | Disable native named effect via overlay/`beforeStats`, then condition custom rule on original `names.*`; no ambiguous numeric replacement needed. |
| HP-, status-, boost-, shared-type-, species-dependent conditions | `when` expressions over live context, `positiveSum`, `intersects`, comparisons and scratch state. |
| Ability/item rewrites and absent/new named effects | `over.abilities/items.*.effect` alias or suppress, plus phase rules. |
| Item classifications, special stones, NFE and species exceptions | Metadata overlays, `meta.atkItem/defItem/move`, `atk/def.species.nfe`, guide-ID/name keyed species overrides. |
| Base damage / weather-stage changes | `beforeWeather` mutation and `baseDamage` scalar rules; use explicit arithmetic/rounding. |
| Final modifier hooks (`finalMods`) | `finalMods` rule array, native chaining in modern generations. |
| Before-final-damage hooks (`beforeFinalDamage`) | `beforeRolls` object's damage/STAB/burn/effectiveness inputs; `roll` for final per-roll operations. |
| Hit-index effects and damage arrays | `state.hit` / `hitCount` plus phase rules; additive result `per` preserves different distributions. |
| Extra hits from an ability (Parental Bond-like, ORAORAORAORA!) | `hits` rule sets the count (with a flag if the extra hit depends on the move); `hitBaseDamage` rule scales the base damage for `state.hit >= 2`. Tested against the native Parental Bond second hit. |
| Per-type immunity bypass (Draco Barrage ignores Fairy) | `effectiveness` rule on `state.effectivenessType`, returning 1 where the value was 0. |
| Best of physical or special (Shell Side Arm-like) | `beforeStats` rule setting `move.category` from the staged Atk/SpA against Def/SpD ratios. Ties go to Special here; the source randomises them. |
| Frostbite-style special halving | `beforeRolls` rule setting `value.isBurned` for the attacker's status and move category. The burn input halves after type effectiveness, as the source does. |
| Global/UI-only field options | Declare `{k,l,type,o,side,to}` in profile `field`; consume via `field`/`input.field`, never DOM/global reads. |
| Utility arithmetic and helper tests | Declarative expression operators; expand named helper behaviour into independently authored data expressions. |

Arbitrary JavaScript profiles are not automatically convertible. This vocabulary
covers the reviewed modifier concepts, but not every possible future hook or
full battle simulation. A translation needing an unavailable intermediate value,
early-exit change or new insertion point must extend the engine with tests,
rather than claim parity through an approximate final-roll multiplier.

## Licences, oracles and checking a hack

| Project | Licence | Use |
| --- | --- | --- |
| `@smogon/calc` | MIT | The engine, inlined in every calc guide; keep its notice. |
| hzla/Dynamic-Calc-Decomps, hzla/Dynamic-Calc | none at the top (its `calc/` keeps Smogon's MIT) | A local oracle and a format reference only (decided 2026-10-20, we don't ask): read it, write the layouts / settings down as notes, write our own code. Never copy or translate its code or tables. Credit it in the footer as a reference. |
| PokeDaisy, PKHeX | GPLv3 | Read only (copying would make the guides GPL). PKHeX is the best save-format reference and a check for our readers. |

Save formats, offsets and encryption are facts, not code: reimplementing them is fine.

The oracle per built hack (hzla's link names the data set, `dmgGen` the damage mechanics, `gen` the game, `types`
the type chart): Emerald Imperium `Dynamic-Calc-Decomps/?data=imp13&dmgGen=8&gen=8&types=6&noSwitch=1&evs=0` (the
source uses Gen 9; `evs=0` is the catalog's No EVs variant, `noSwitch` AI switch prediction: neither is a damage
rule); Photonic Sun `?data=pspm&dmgGen=7&gen=7&types=6`; Eternal X the older `Dynamic-Calc/?data=8d1ab90a3b3c494d8485
&dmgGen=6&gen=6`; Hardlove Gold none (hg-engine: its `doc/Mechanics.txt` and source, hack notes → Damage calc; hzla's
ROM importer https://ddex-chi.vercel.app is a possible oracle for Gen 3 / 4 games without a calc).

Checking a hack's mechanics, in order: its source where there is some (damage function and config switches), its
docs and changelog, the oracle's settings and profile, and last the **in-game test**: a save state before a trainer
battle, one known move, note the damage, reload and repeat a few times; every result must fall inside the calc's 16
rolls (one physical, one special, one crit, one weather- or ability-boosted move). Each guide's notes.md → Damage
calc → In-game tests lists its cases. Procedure: `.agents/references/calc-mechanics.md`.

## Node runner and comparison harness

### Local hzla oracle

`node tools/calc/hzla_compare.mjs emerald-imperium --fetch` creates/uses the ignored
`.tmp/hzla/` checkout of `https://github.com/hzla/Dynamic-Calc-Decomps.git`, pinned to
`ff6c3e339e276e6b4e8e44db58750b6534bc26aa`. Later runs omit `--fetch`; no npm build
or browser is needed. `--repo <path>` selects another clean clone at that same SHA;
the tool rejects another HEAD or tracked edits. Never stage/vendor its unlicensed
code or generated tables. Our loader and comparison code are independently written.

Eternal X fixtures select `oracle.repository: "Dynamic-Calc"`. This uses `.tmp/hzla-eternal-x/` and
`https://github.com/hzla/Dynamic-Calc.git`, pinned at `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74`.
`--fetch` and `--repo` work the same way, enforcing that repository's pin. The legacy loader evaluates the
original `calc/` scripts in their `index.html` order, using its browser shared-export shim rather than its broken
CommonJS custom-util import. Its backup becomes `npoint_data` / `backup_moves`; inverse uses the actual
`isInverseBattle` field with the separate global `invert` left false. Switch-in/challenge defaults are off.
Other fixtures still use Decomps; any unrecognised repository selector fails explicitly. Nothing is vendored.

Fixtures are `hacks/<hack>/calc_matchups.json`: `{oracle, matchups}`. `oracle` sets
`title`, data `gen`, formula `damageGen`, `types`, `critGen`, optional `backup`
basename and `settings`. `names` has explicit `species`, `moves`, `abilities` and
`items` display-name translations. Mega/Primal and Alolan/Galarian/Hisuian/Paldean
prefixes are translated by `oracleName`; other aliases must be listed, never guessed.
Each named case contains the runner's `atk`, `def`, `slot`, `field` in guide IDs.
Optional `trainer` records the original TR key/slot. CLI selectors: `--case <name>`,
`--output .tmp/<path>.json`. Duplicate names, invalid inputs and oracle errors fail.

This is a **mechanics isolation** comparison, not a byte-for-byte reconstruction
of the web UI: both sides receive the guide's species stats/types and move
power/type/category. Oracle move metadata/flags and effects come independently
from its local stock/backup data, not our `over`. Its UI-only adjustments are not
executed; investigate those when attributing a disagreement. This avoids hiding
mechanics differences by passing our rules to both engines, but does not validate
the species/move data against the web calculator. Unknown oracle species weights
fall back to 1 kg, so do not use weight moves until the mapping/weights are audited.

The report saves both full per-hit 16-roll arrays, settings, SHA, descriptions and
oracle KO text. OHKO probabilities are compared only for eligible single-hit
cases; the oracle's multi-turn KO text is not compared (ours counts the defender's residual per turn).
Exit 1 means an error or unexplained mismatch. A case's `difference: {source,
reason}` records an explained disagreement; these remain visible as
`known-difference`, never matches. Review every reason against the game's source
or docs rather than adding an exception merely to get a green exit code.

The committed engine runs in a Node VM without jsdom or installed packages:

```sh
node tools/calc/run.mjs hacks/emerald-imperium/data.json template/calc/profiles/expansion.json matchups.json
node tools/calc/run.mjs hacks/emerald-imperium/data.json profile.json - < matchups.json
```

`profile.json` can be a full profile or `{"base":"expansion","over":{...}}`;
the runner merges a base recursively like assembly (arrays replace). Matchup
input is one `{atk,def,slot,field?}` or an array of those. Output is a result/null
or an equally ordered array. Species, move, ability and item selectors retain
the plan's guide IDs/indices. Errors go to stderr with a nonzero exit status.

For a local diff tool:

```js
import {createEngine, resolveProfile, runMatchups} from './tools/calc/run.mjs';
const results = await runMatchups(data, profile, matchups);
const engine = await createEngine(data, await resolveProfile(profile));
const stats = engine.stats(matchups[0].atk);
```

Compare `rolls` for hit 1 and expand `per || Array(hits).fill(rolls)` for every
hit. A separate reference adapter must apply the same guide data, settings,
current HP, hit count and field; do not compare only min/max. `test.mjs` uses a
separate direct Smogon oracle and synthetic hand-checked overrides, not hzla
code. It covers Gen 4/5 and modern mechanics, per-hit effects, exact KO
convolution, runner single/batch input, and input immutability. Reference parity
against a specific hack's local hzla calculator remains a per-hack audit.

## Validation snapshot (2026-10-25)

- Clean `npm ci --prefix tools/calc --ignore-scripts`: 6 packages audited,
  zero reported vulnerabilities.
- `node tools/calc/build.mjs` twice: identical SHA-256
  `009b0e716cf416c67e5a888e73948aefafc9ccf45780aceb38bb08e405e031c3`.
- `node tools/calc/test.mjs`: **81 passed, 0 failed**, including 41 direct
  Smogon parity matchups. Synthetic overrides exercise every exposed phase; the
  hit-phase tests use hand-checked rolls (base 17, Gen 4 base 15 before its +2)
  and the Parental Bond equivalence.
- Bundle: **375,315 bytes**, **88,389 bytes gzip** (the hit phases add 493 bytes).
  Fallback metadata dominates (249,186 attributed bytes); modern mechanics are next.
- Emerald Imperium against the pinned hzla oracle: **47/47** matches, no known
  differences (`hacks/emerald-imperium/notes.md` → Damage calc).
- `python assemble.py`: all four guides built; assembly needs no npm packages.
  Browser/Thor sweeps are deliberately deferred to integration, not claimed here.

These are framework checks, not a declaration that Emerald Imperium or any
other hack's mechanics profile is verified. Logs are local in
`.tmp/calc-engine/`; the baseline against `f44f780` was built separately under
`.tmp/baseline/` by the repository gate.

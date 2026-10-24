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
Missing weights fall back to 1 kg; exact weight-based moves need species
`weightkg` overrides. Missing move metadata falls back to a plain attack.
Hack-original `x` moves and `AB[i][2]` abilities have no special effect unless
explicitly mapped in `over`. Unrecognised item/ability names have no effect.

## Public contract

`window.DMG` contains exactly `init(D, prof)`, `stats(set)` and
`calc(atk, def, slot, field)`, as specified in `plans/damage-calc.md`.
Initialisation replaces all guide state and clears KO caches. It does not change
the supplied data/profile. `stats` returns unstaged `[HP, Atk, Def, SpA, SpD, Spe]`.
An absent ability means none, not the species' default. Defaults are level 50,
31 IVs, zero EVs/stages, neutral nature and full HP. `hp: 0` is retained.

Damage `rolls`, `min`, `max` are **per hit**; `pmin`/`pmax` cover all selected hits
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
Every use repeats the returned per-hit distribution: sequential hit effects
(Triple Axel/Kick scaling, defensive changes, Parental Bond) are not represented
by this uniform-per-hit contract. Nonuniform upstream results are rejected
instead of silently flattening them into incorrect rolls.

## Base profiles and fields

The six committed JSON bases contain generation defaults, not verified hack
mechanics. `expansion` uses Gen 9; `cfru` uses Gen 8 as a modern family starting
point; `gen4` through `gen7` use their numbered mechanics. A later per-hack audit
must pin family configuration differences. They deliberately omit save readers.
`lv`, `stages`, `status`, `natures`, `abilities`, `items`, `field`, `multihit` and
`varpow` are the renderer's capability/control declarations. `multihit` is keyed
by move name with `[minimum,maximum,default]`; fixed-hit moves have equal values.
`varpow` lists upstream attacks lacking a fixed base power; `MV.bp === "Varies"`
also always requires a power input.

Field entries are `{k,l,type,o?,side,to}`. The UI stores `field[k]`; `to` names a
Smogon Field property for `side: "field"`, or a Side property for `atk`/`def`.
For example `defReflect` maps to `defenderSide.isReflect`, and `atkHelpingHand`
to `attackerSide.isHelpingHand`. These are relative to the **current attack**:
the UI must exchange atk/def entries when calculating in the other direction.
Select values must be in the entry's `o` list. Unknown keys are ignored.
No terrain/Aurora Veil is declared before its generation. Type availability is
driven by `TC`, not the field list; without a guide chart the stock generation
has no Fairy before Gen 6. Tailwind affects the engine's internal speed checks;
the UI's displayed speed is outside `DMG.stats`, which is intentionally unstaged.

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

- `critMultiplier` is applied at the actual critical-hit rounding step in every
  supported generation, **not** by scaling final rolls. `build.mjs` checks exact
  single-occurrence upstream source patches and fails if they drift. Default
  behaviour is unchanged. Sniper remains an additional 1.5 multiplier.
- `typeChart` uses ordinary multipliers (0, 0.5, 1, 2), unlike `D.TC`'s x10
  encoding; it has precedence over `TC` and stock data. Additional guide types
  are supported through `TC` rows.
- `moves`, `species` and `items` recursively overlay the upstream data shape
  after guide data. For species this includes `baseStats`, `types`, `weightkg`,
  `nfe`; for moves `basePower`, `type`, `category`, `flags`, `multihit`, `willCrit`,
  `overrideDefensiveStat`, etc. Arrays replace rather than merge.
- `effect` aliases abilities/items/moves/species to an existing engine effect;
  `effect: ""` disables a named ability/item/move effect. Unknown moves already
  behave as plain attacks. Arbitrary new effect code is **not** accepted in JSON.
  Guide display labels and IDs remain unchanged.
- `status` maps declared profile status keys to upstream status keys. Only
  statuses present in `profile.status` are accepted.
- `critStages` is reserved metadata for a future crit-probability control; the
  current contract selects crit explicitly per slot and does not sample rates.
  Arbitrary custom ability/item effects, rounding rules, stat formulas, new
  generation mechanics and residual-damage simulations need later engine work,
  not pretend data-only support.

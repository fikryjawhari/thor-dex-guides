# In battle text

Hand-written mechanics, separate from bag text. `items.json` covers battle-effect
items named by the six guides; `moves.json` is maintained separately. Mega Stones
are excluded: their item pages already have a Mega Evolution line. No extract or
template consumes these files yet.

## Format

Each JSON maps exact display names to a string, or a generation-variant object:
`{"gen<=5": "...", "": "..."}`. Evaluate nonempty conditions in insertion
order and take the first match; `""` is the fallback. Only `gen<=N` is used here.
Every variant object has a default; this folder does not implement selection.

Select the guide's mechanics generation, not its ROM engine's generation.
Emerald Imperium and Unbound are not stock Gen 3. Hardlove, BB2R, Eternal X and
Photonic Sun start from Gen 4, 5, 6 and 7 respectively. Apply documented hack
changes through `hacks/<hack>/extract/battle_text.json`, not global wording.
Modern Rapid Spin or a backported Dream Ball needs the corresponding mechanics
selection/override. Defaults cover selected backports, not every Gen 8/9 rule
or hack-specific interaction.

## Style

- State the effect directly; omit flavour, acquisition and bag-text repetition.
- Give fractions, multipliers, stages, durations, priority and hit odds explicitly.
- Give the main effect and exact numbers, then at most the 1-2 interactions that
  matter most in play. Drop edge cases and exception lists.
- Aim for at most 230 characters per text, including each generation variant;
  most should be far shorter. The approved Leech Seed is the ceiling, not a target.
- Leftovers, Calm Mind and Sitrus Berry are the brevity models. Include triggers
  and consumption where needed, not exhaustive ability or Substitute caveats.
- Use short sentences, named stats and plain language, not simulator terminology.
- Add variants only for mechanics that differ across the generations of guides
  displaying that exact name; omit unused historical branches. Preserve approved
  wording verbatim as defaults.

Leech Seed, Calm Mind, Toxic, Bullet Seed, Life Orb, Leftovers, Sitrus Berry,
Dark Gem, Grass Gem and Dream Ball defaults are verbatim from
`plans/item-pages-mockup.js`'s `HAND` object, as requested. Historical variants
do not replace those defaults. These are review examples, not a claim that an
approved default covers every backported interaction.

## Source

Pokémon Showdown (MIT), `smogon/pokemon-showdown`, commit
`ccfaa20f32af363569cd21a9d501b2bc1ded26b1`: the calc's pin in
`tools/calc/move_effects.mjs`, not a moving branch or npm version.

- `data/text/items.ts` and `data/text/moves.ts`: descriptions and gen variants.
- `data/items.ts`, `data/moves.ts`, `data/conditions.ts` and Gen 4-7 mods: mechanics.
- Text and mechanics were read directly at that exact SHA; no moving branch or
  npm package supplies the battle descriptions.

No raw source is committed. Wording is original except the approved samples.
Showdown does not simulate catching. Capture behaviour was cross-checked with
Bulbapedia's Quick Ball, Dream Ball and Catch rate entries (2026-11-01):
`https://bulbapedia.bulbagarden.net/wiki/Quick_Ball`,
`https://bulbapedia.bulbagarden.net/wiki/Dream_Ball`,
`https://bulbapedia.bulbagarden.net/wiki/Catch_rate`.
Hack-specific ball changes still need the hack's own game-source confirmation.

Capture additions were checked against executable game-source implementations:
- `pret/pokeheartgold`, `ee26049b9bfb6bdbf909338ac1c54643bcc2bd79`,
  `src/battle/battle_command.c` (Gen 4 capture formulas).
- `rh-hideout/pokeemerald-expansion`,
  `c460a8661dfa0598ae25d42a968c690ecbf489c6`,
  `src/battle_script_commands.c` (generation-configurable capture formulas).
These supplement the pinned Showdown source, which does not simulate catching.
They are reference mechanics, not evidence of a particular hack's configuration.

Source discrepancy settled: Gen 4 Metronome's description caps its boost at 2×,
but the pinned Showdown item callback has no explicit cap. HeartGold's
`src/battle/overlay_12_0224E4FC.c`, `ov12_022565E0`, at the pin above limits the
repeat counter to 10, confirming 2×. The text keeps that cap. Baton Pass's Gen 5/7
prose says Mean Look trapping passes, but `conditions.ts` sets
`trapped.noCopy: true`, overridden only in Gen 4; the move sample follows the
executable mechanic.

## Item coverage

The six committed `hacks/*/data.json` files supply 1,125 distinct displayed names:
`IT` row names outside Useful NPCs / Move Tutors, `P.hi`, `P.stone`, trainer
Pokémon `i` (including alternate teams), and `MI.i`. The inventory reads the JSON
with a script, not a dump of the data files. `items.json` supplies 307 names.

Excluded or deferred (818 names):
- 416 TM/HM/TR names and 120 Mega Stone spellings.
- 278 names without an eligible battle effect: key items, ordinary medicine,
  evolution/training items, flavour or EV Berries, valuables, fossils, mail and
  field-only effects. As requested, Macho Brace and Power training items are
  excluded even though they also halve Speed. Ilima's Normalium Z is the quest
  key item, not the held Normalium Z.
- Kicking Shoes (EI), Max Powder and the grouped Silvally Memory (Unbound): no
  standard effect was invented. These need hack-specific source/normalisation.
- One malformed combined wild-item string:
  `Blue-Striped Basculin: Deep Sea Scale (5% chance) Red-Striped Basculin: Deep Sea Tooth`.
  The separate Deep Sea Scale and Deep Sea Tooth names are covered.

Different displayed spellings get separate keys: Booster Energy / BoosterEnergy,
Deep Sea Scale / DeepSeaScale, Deep Sea Tooth / DeepSeaTooth, Heavy-Duty Boots /
Heavy Duty Boots, King's Rock / Kings Rock, Never-Melt Ice / Never Melt Ice /
Never-MeltIce / Nevermelt Ice, Passho Berry / Pasho Berry, Silver Powder /
SilverPowder, and Twisted Spoon / TwistedSpoon. The nine literal odds-prefixed
`P.hi` names (`5% Chilan Berry`, `5% Focus Band`, `5% Haban Berry`, `5% Life Orb`,
`5% Poison Barb`, `5% Rawst Berry`, `5% Sharp Beak`, `5% Twisted Spoon`,
`50% Rawst Berry`) retain their displayed keys and the underlying item's effect;
the prefix is encounter odds, not an extra battle modifier.

Validation: JSON shape, duplicate keys at every depth, valid ordered generation
conditions, every key in the six-guide inventory, exclusions/coverage, all ten
approved defaults verbatim, and lengths of every variant. `moves.json` remains
unchanged by this item task. Final item checks: 307 keys, 47 generation-variant
objects and 359 individual texts; median 90 characters, maximum 222, none over
230. All ten approved defaults match the mockup verbatim. `git diff --check`
passes. Guide/browser gates do not apply until integration changes guide output.

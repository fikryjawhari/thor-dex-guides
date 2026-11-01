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
or interaction (such as Loaded Dice).

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
- Add variants for changed mechanics; preserve approved wording verbatim as defaults.

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
- The existing local `.tmp/showdown/.git/FETCH_HEAD` verifies the mechanics pin.
  Text files were fetched at that exact SHA into this worktree's `.tmp/btext/`.

No raw source is committed. Wording is original except the approved samples.
Showdown does not simulate catching. Capture behaviour was cross-checked with
Bulbapedia's Quick Ball, Dream Ball and Catch rate entries (2026-11-01):
`https://bulbapedia.bulbagarden.net/wiki/Quick_Ball`,
`https://bulbapedia.bulbagarden.net/wiki/Dream_Ball`,
`https://bulbapedia.bulbagarden.net/wiki/Catch_rate`.
Hack-specific ball changes still need the hack's own game-source confirmation.

Source discrepancy: Gen 4 Metronome's description caps its boost at 2×, but the
pinned item callback has no explicit cap. The sample follows the description
pending game-source confirmation. Baton Pass's Gen 5/7 prose says Mean Look
trapping passes, but `conditions.ts` sets `trapped.noCopy: true`, overridden
only in Gen 4; this sample follows the executable mechanic.

Validation: JSON shape, unique names, variant conditions, 25+25 coverage and
verbatim approved wording. Guide/browser gates do not apply until integration
changes guide output.

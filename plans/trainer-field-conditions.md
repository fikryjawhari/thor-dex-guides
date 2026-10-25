# Trainer area fields: data ready, UI not decided

2026-10-25, `worktree-damage-calc`. The user wants hack/mechanics coverage first, then a separate UI refinement
and bug-fix pass before pushing. This pass prepares conditions from area/battle setup, not a Pokémon's moves or
ability. It does not settle the UI, change calc results, add save readers or publish.

## Data contract

Optional `TR.g[].sec[].tr[].field` lists evidence, not executable calc presets. The lasting schema is in
`hacks/emerald-imperium/notes.md` → Data schema. Records retain complete original text, its scope (group-note,
section-note, trainer-note, trainer-tag), conservative effect normalisations, and a review marker.
`tools/trainer_fields.py` derives this through `extractlib.finalise()`. Existing notes/tags stay unchanged;
no field metadata is inferred from teams.

- Section/group conditions are copied onto each trainer with scope retained. The UI need not find its parent.
  Deduplicate repeated section/trainer evidence before applying anything: two mentions of +1 are not +2.
- Missing properties mean unknown, not calc defaults. The critical bonus has no documented target and random
  terrain has no listed pool. Neither has been guessed.
- `permanent` preserves the doc wording; replace/clear behaviour needs a source/in-game mechanics check.
- `review: true` means no safe normalisation or incomplete targeting/outcomes. False does not promise engine
  support. Fog, permanent effects and delayed hazards still need an implementation decision.
- Mixed notes (such as conditions plus a reward) keep their full wording. The later UI can use effects for
  controls without silently reinterpreting or discarding evidence.

## Coverage

| Guide | Cards with evidence | Evidence records | Review records |
| --- | ---: | ---: | ---: |
| Emerald Imperium | 20 | 22 | 9 |
| Hardlove Gold | 65 | 110 | 19 |
| Photonic Sun | 0 | 0 | 0 |
| Eternal X | 0 | 0 | 0 |

Counts describe four built guides, not all twelve hack source folders. Removing added `field` properties leaves
data identical. Storage keys, trainer keys, teams, notes and build dates are intact.

### Hardlove Gold

All 75 field comments in local Trainer Battles.xlsx active split tabs are represented verbatim apart from
existing whitespace normalisation. `trainer_fields_check.py --sources` checks section-header and trainer-block
comments, not just name rows. Published guide 0.8.3 is preserved; the older 0.8.2 extraction and newer 0.8.4
importer are not substituted. Counts below deduplicate repeated evidence per card; Rain includes thunderstorms.

| Condition | Cards | Place |
| --- | ---: | --- |
| Permanent Rain | 22 | Routes 33, 40, 41, 46; Lake of Rage |
| Thunderstorm = permanent Rain + Electric Terrain | 4 | Lake of Rage |
| Permanent Sandstorm | 5 | Route 47 |
| Permanent Sun | 3 | Route 42 |
| Permanent Snow | 4 | Mahogany Gym, third room |
| Permanent Fog | 6 | Goldenrod Tunnel B2F |
| Permanent Trick Room | 1 | Lt. Surge, Vermilion Gym |
| Random terrain at battle start | 5 | Rocket HQ B2F, including upper path |
| Player Spikes + Toxic Spikes, one layer each after first send-out | 7 | Rocket HQ B3F |
| Permanent enemy Tailwind | 8 | Goldenrod Radio Tower 2F/4F |
| +1 critical chance, target unspecified | 8 | Goldenrod Radio Tower 3F/4F |

Conditions can coexist. Thunderstorm must not become an invented weather enum or Rain alone. The HQ B3F note
calls its hazards a custom weather effect; preserve the described hazards rather than inventing a weather.
Lt. Surge's accompanying 31 Speed IV note also remains in the evidence text.

### Other guides and limits

Emerald Imperium's explicit Permanent Misty Terrain, Snow, Rain and Sun tags are normalised. Permanent Sand
(three cards), bare Trick Room tags, Sydney Tailwind/TrickRoom and Glacia Sun/Snow stay reviewable: a strategy
label alone does not prove an external battle effect. EI's local raw source folder is missing in this worktree,
so this is a published-data inventory, not a new source/game-script audit.

Photonic Sun and Eternal X have no external field notes in current extracted trainers. Their local Rebalanced
trainer-document text and Photonic's Totem document were checked for declarations; weather/terrain move and
ability rows are not external conditions. This does not prove every map has no environmental effects. Map
scripts, undocumented weather and Totem stat auras are outside this inventory. Totem auras are Pokémon-specific
and need their own check before calc automation.

## Later decide/build session

1. Read this handoff and the viewer contract, then make a cheap Thor-sized interactive mockup. No design is
   agreed for field evidence, inherited conditions, random outcomes or unsupported effects.
2. Decide whether trainer selection applies suggestions, asks, or only displays them. Specify player-set fields,
   manual overrides, changing trainers, battle/turn resets and saved calc state.
3. Specify sides separately from attacker/defender roles: enemy Tailwind stays with the trainer when roles swap.
   Hazards have send-out timing; they are not a damage modifier.
4. Keep unknown/random conditions visible. Check permanence, Fog, critical bonuses and the random terrain pool
   against source/in-game evidence before automating.
5. Test thunderstorm's two effects, inheritance, duplicate evidence, changing trainers, swapping sides, overrides
   and 260 x 316 normal/dvkb layouts.

## Checks

- `python -I tools/trainer_fields.py`: all four guides match derived evidence.
- `python -I tools/trainer_fields_check.py`: parser, ambiguous/negative cases, inheritance/removal, schema,
  and idempotence.
- `uv run python -I tools/trainer_fields_check.py --sources`: also checks all Hardlove field comments.
- `python assemble.py`: rebuild all guides. No template/UI change is part of this pass.

Results on 2026-10-25: metadata checks and all 75 Hardlove source comments pass; complete shared finalisation is
idempotent for all four guides. Existing data is identical after removing only `field`. All four guides assemble;
the calc suite passes (81 engine tests, 53 Hardlove source/stock checks, 107 Photonic fixtures, 97 Eternal fixtures).
Hardlove, Photonic and Eternal extraction checks pass. EI's extraction check cannot run: local
`.src/repos/eidex.zip` is missing. No browser scenarios were rerun because no template, UI or calc behaviour changed.

When built and merged, move remaining decisions into lasting schema/template docs and delete this pending plan.

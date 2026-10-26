# Calculator handover (2026-10-26)

## Start here
- Worktree: `C:\Users\fikry\.t3\worktrees\thor-dex-guides\worktree-damage-calc-toggles`.
- Branch: `worktree-damage-calc-toggles`, a tab of `worktree-damage-calc`. Keep the T3 thread bound to this tree;
  do not silently change checkouts. Use Sol in the main chat, keep discussion short, check both claim paths and
  claim `.claude/claim`. Only one session edits the template or engine/shared interfaces at a time.
- The user approved the built UI on 2026-10-26 except the single placement/height issue below. They explicitly
  asked this session to **write the handover, commit and push, without implementing anything further**.
- The incoming engine/Hardlove 0.8.4 pass was merged at `f3203b1`. No engine implementation was changed by this
  UI pass. Do not repeat that merge or restart the original mockup/approval step.
- Read `AGENTS.md`, the guide skill and its viewer reference, `PROGRESS.md` Open 2, `plans/calc-state-toggles.md`
  (settled choices and Audit record), `template/README.md` Damage calculator, and the engine contract in
  `tools/calc/README.md` Battle state / Crit / Stat changes before the hit.

## Compact pass (2026-10-26, second session): built, awaiting the user's Thor test
- Header controls: First turn out / Disguised, Intrepid Sword / Dauntless Shield (checkbox, checked = on by default)
  and Download (`A·Atk` / `A·SpA`, `M·Atk`, `M·SpA`, `None`) sit left of Edit; header height unchanged (the old
  checkbox label had a 32 px min-height, now 18). Edit is the same for every Pokémon.
- One window at 316 px height, every width: open card (Save/Reset share the full-name line, shorter selects/boxes),
  open move (Type/Power/Hits one row, full name + Change/Reset one line, per-hit range and rolls one line), open Field.
- Field toggles: min box = widest single word (measured at render), `auto-fit` columns. At the minimum window each
  side would be one box per row, so a Player | Foe switch shows one side at full width. Weather/Terrain lost their
  captions ("No weather" / "No terrain"). EI: the Player Emperor's Presence is labelled like the Foe one and sits
  after Focus Energy on both sides (keys unchanged).
- Checks: `calc-state.mjs` one-window (7 sizes) and header-height asserts; `tapField` helper in calc_check_lib for
  the narrow switch. Rules recorded in `template/README.md` → Damage calculator.
- Engine follow-ups below are deliberately left for the merge into `worktree-damage-calc` (the user's call).
- Then (same day): toxic turn box on the HP line, Edit's residual parts folded behind Turn end, stage buttons one
  size, search by move / item / ability, text-zoom refit, Find trainer guard for an empty team. The preview panel's
  All preset (also the fresh-load default) loads every preset as the team.
- **Next session: build `plans/calc-field-states.md`** (stackable states, pledge fields, hazards; engine + UI). It
  has one open question to ask first (how Stealth Rock / Spikes damage shows).

## What is already built and accepted
- Direct turn application by tapping the residual amount on the HP line; residual parts/toxic counter in Edit.
- Stable team height/list versus strip when residuals or editors appear; editors grow downward. Wide Edit opens
  and collapses both populated panels, including narrow-to-wide resize and automatic editor opening.
- Full form names inside Edit; target state None / Dig / Fly-Bounce / Dive / Minimized / Switching out.
- Download cycles Auto (actual boosted stat) -> Atk -> Sp. Atk -> None. Sword/Shield off controls in Edit.
- Move states/counters, pledges, Metronome, crit metadata/forced/blocked controls, Curl and pre-hit changes.
- Collapsed multi-hit damage totals all selected hits, including Parental Bond; individual-hit inspection and
  one-hit selection are available. Loaded Dice ordinary 2-5 offers 1/4/5; Skill Link offers 1/max. The 1 is an
  inspection override, not a claim that the ability naturally produces one hit.
- Compact Draco P/S and Auto/Inverted control; full Z names in expanded moves; used/listed/typed power details.
- Expanded moves push Field below the full movesets. Full-width Singles/Doubles switch above Weather/Terrain;
  stable Player/Foe columns, Focus Energy in every base/hack profile, field inputs remapped for either direction.
- Existing localStorage keys preserved. The faster Speed colour is enough for turn-order feedback; the user does
  not currently want an additional priority/turn-order UI.

## Engine requests from the original feedback: carried forward, not edited here

### Confirmed outstanding default-power request
**Return / Frustration:** the user wants maximum power by default (102, not fractional 102.5). The current engine
returns `null` without an explicit power for the probed EI sets; explicit 102 works. This remains a follow-up to
the engine/default-power contract. Check each hack's source overrides and existing happiness fixtures before
changing defaults; do not erase hack-specific behaviour accidentally. UI input policy should follow the settled
engine contract. No fix was made here.

### Requests to verify, not established missing implementations
- **Between-hit state/stats**, particularly Parental Bond Power-Up Punch's Attack boost and defensive reactions
  such as Stamina: the incoming engine already handles the user's two named examples. EI probe: PuP into Blissey
  gives 146-174 then 54-64; three-hit Icicle Spear into Stamina Mudsdale gives 30-36, 20-26, 14-20, with `pre`
  Defense events. Audit any additional effects/source-specific cases as needed; do not implement these examples
  twice. The UI already totals the hit results, with one top control for inspection rather than stacked buttons.
- **Loaded Dice / Skill Link legal counts:** the engine accepts explicit `slot.hits` 1-5 as an override. The
  ordinary selector restrictions requested by the user are implemented in the UI. Verify exceptional moves and
  per-hack rules before declaring another engine change necessary; this probe does not prove every move's rule.
- **Emperor's Presence:** self and doubles-ally rules and source-chain checks already exist. Probes give 31-37
  ally off, 40-48 ally on, 52-63 self plus ally. The UI now exposes the correct sides. There is no confirmed
  engine defect; keep this on the verification list if the user has a specific failing example.
- **Pursuit switching boost:** the engine already takes `def.vol: "switch"`; this UI adds Switching out in Edit.
  Not an outstanding missing engine feature.

Reproduce the local triage with `node plans/calc-state-toggles-mockup/scope-probe.mjs`. It verifies these examples,
not every possible mechanic. No engine edits were authorised as part of the completed UI build; settle new engine
work explicitly in the next session rather than treating this handover as a blanket implementation instruction.

## Later field/ability/item automation: separate decide, then build
Read `plans/trainer-field-conditions.md`: trainer `field` data is evidence, not executable presets. The two-column
manual Field UI is built; automatic effects were deliberately not implemented. This was also part of the original
feedback and must not get lost among the engine follow-ups. First establish which engine inputs already exist;
automation/provenance/reset lifecycle is UI orchestration, with engine extensions only for demonstrated gaps.

User requirements to settle in a mockup/spec before implementation:
- Selected Pokemon abilities/items can supply automatic weather/terrain/general effects (e.g. Sand Stream).
  Remove an automatically supplied effect when its source is switched away; apply it to both sides as appropriate.
- A manually chosen field persists across Pokemon swaps and is not silently replaced or cleared by automation.
  Track manual versus automatic provenance. Switching back to an automatic source must not reset manual choices.
- Changing the opposing trainer resets the overall fields. Changing the player's Pokemon must not clear manual
  fields, though its own automatic contribution can change.
- Trainer-scoped toggles for detected abilities, moves or items were a proposal, not an approved design. Moves,
  unknown/random trainer conditions, permanence and conflicts between sources still need decisions. The user was
  willing to keep move/teamwide application manual initially. Do not guess undocumented conditions.
- This happens sequentially on this branch, not alongside another template/engine job. Extra turn-order controls
  are not needed now: baseline faster-Speed colouring was accepted.

## Audit and known tooling failures
- `npm test --prefix tools/calc` passes. All four guides assemble; extract checks/counts/reports pass and rebuild
  data is identical except built dates. New `tools/scenarios/calc-state.mjs`: EI 24, other guides 10 each pass (54).
- Residual 40, Imperium controls 10, layout 36, triple/power 20, Photonic Z 20 and profile/field checks pass.
  `tools/calc_ui_check.py` checks trainer Metronome holders against competing top-slot controls.
- Full four-guide gate completed, **88/117 pass, not wholly green**. Eight failures are intentional Calc-only DOM
  differences: all eight full normal/dvkb sweeps show only `#/calc`, zero old/new page errors, and 19,840 unaffected
  route/mode comparisons identical. The other 21 are seven EI-only fixture scenarios mistakenly applied to the
  other three guides (controls, entry, field, import, layout, persist, smoke). Every failure was reproduced on the
  untouched pre-UI baseline. No tests were weakened and no production workaround was added for these fixtures.
- Logs: `.tmp/gate/20261026-133753-240043/summary.txt`; baseline
  `e39529e6fed29674fa3a9d0c277dabd48fabeaf1`, `.tmp/baseline/manifest.json`; baseline reproductions and explicit
  date-ignore changed-route comparisons: `.tmp/resume-audit/`. These outputs are local/ignored, not in Git.
- Explicit domcompare runs used `--routes==#/calc --ignore="built 2026-10-2[0-9]"`, normal/dvkb, with no page
  errors. Full-route evidence is the gate sweeps. Run browser sweeps one at a time. After the next UI fix rerun
  relevant scenarios, assembly and comparisons; do not describe the existing gate as an unconditional PASS.
- Live phone checks verified real toxic HP 235 -> 221, next amount -14 -> -29; the full Download cycle; paired
  wide editors; Sword-off; Photonic Savage Spin-Out details and Z state suppression, normal/dvkb, light/dark.

## Sources, previews and restart notes
- Hardlove `.src` was copied from main before building. Other guides' `.src` are linked by `worktree_setup.py`.
  EI's missing `moves_info.h` was restored from the exact documented pinned upstream commit in ignored sources.
  Do not commit raw sources or assume another checkout has them. Use each hack's SOURCES.md if recovery is needed.
- Built previews (not the old illustrative mockup):
  - https://windows-pc.tail1846b8.ts.net/preview/calc-state-built.html (EI).
  - https://windows-pc.tail1846b8.ts.net/preview/calc-state-photonic.html (Photonic/Z).
- Live preset panel: `plans/calc-state-toggles-mockup/built-panel.html`. Clicking a preset replaces preview test
  sets. Reload restores the calc route. Toxic has no item so its negative amount is visible. Sword uses a test
  Snorlax with Intrepid Sword; unsupported guide presets report unavailable, not an engine failure.
- Wrap built guides with `tools/mockup/thor-frame/build.py --panel` using that panel; publish through
  `tools/preview.py`. The generated frames live in ignored `dist/`. The shared frame's scaled dimensions now have
  pixel units (fixed the black gap at phone-fit wide sizes); all five sizes match the scaled iframe height.
- The cancelled `python -m http.server 8890 ...` is not needed. Tailnet preview publication serves these files.
  Prefer T3 collaborative preview tools, checking status then opening; one initial open timed out, retry worked.

## Commits and merge order
- Recent checkpoints: `0d8c729` cards/layout, `4e2b3df` fields, `44a92a7` moves/hits, `2ad92ce` scenarios/docs,
  `f9ea0be` live presets, `76ad8c1` resize refinement, `ea52c35` audit, `3078493` frame/preset validation.
- This handover is being committed and pushed with the user's explicit approval, including the UI implementation
  and incoming engine merge. Check the actual remote head before resuming; report a failed push rather than
  assuming this note proves it succeeded. Make frequent focused commits; ask before **every subsequent push**.
- No merges/deletions now. Once the remaining UI/engine work is settled and checked: this tab branch merges into
  `worktree-damage-calc`, then that branch into `main`, with rebuild/audit and explicit push approval. Never merge
  this tab directly into main. Fold durable decisions into the READMEs; delete completed plans only when merged.

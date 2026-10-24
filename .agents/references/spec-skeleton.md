# Spec skeleton

## What changes
User-visible goal, affected guides/routes/files, accepted behaviours and data/storage compatibility.

## Out of scope
What stays unchanged; ownership boundaries; choices needing a later decision.

## Controls and states
| Control / route | Initial / saved state | Action | Result / focus / scroll | Disabled / empty / error |
| --- | --- | --- | --- | --- |
| Name | Include expanded/collapsed and selected/unselected | Tap, change, clear, back, reload | Visible and saved state | Explicit behaviour |

Describe every control in every applicable state. Include route changes, linked controls, keyboard opening/closing,
sticky headers, expand/collapse, reset and reload. State what happens to search, focus and scroll, not just appearance.

## Edge cases
- 260 × 316 and the other viewer sizes in PROGRESS.md; normal and `dvkb`; text zoom; light/dark.
- Empty data, no results, missing optional features, long names, repeated taps and partially expanded content.
- Saved state from older builds, unchanged localStorage keys, migration, reset, reload and route history.
- Offline: one self-contained HTML file, no network or app changes.

## Checks
| Requirement / state | `tools/scenarios/<name>.mjs` or existing mockup check | Seed / size / mode | Action and assertion |
| --- | --- | --- | --- |
| Behaviour | One executable scenario per coherent flow | Explicit localStorage | Assert visible and saved state |

Follow `tools/scenarios/README.md`. Reuse existing mockup checks, do not port them. Run `gate.py` against the
recorded pre-change baseline; list intentional differences for review. Finish with `preview.py --frame` and Thor review.

# Game-specific calc and page code outside the shared template

Proposed 2026-11-06, not decided; decide after the walkthrough fix (`template/` is one session at a time).

**Goal:** a change that only one game needs leaves the other guides' bytes alone, so their gate passes stay cached. A
change for every guide still runs on every guide: that's correct, not a problem.

**Why it isn't so now:** the gate caches on a guide's built bytes. `template/calc/engine.js` and `template/calc.js` go into
every guide, so any edit there reruns all of them (about 29 min) even when the code only ever runs for one game.

## Three layers, in the order to reach for them

1. **Data, exists:** `hack.json` `cfg.calc` (`over`, `over.rules`), `calc_effects.json`. Only that guide's bytes change.
   Hardlove 0.8.9's Natural Gift berries went here.
2. **A hack's own code, new:** `hacks/<hack>/calc_ext.js`, inlined by `assemble.py` for that guide only, after the engine.
   Precedent: `template/calc/ai/hardlove.js`, bundled only for Hardlove. It registers on named hooks the engine and
   `calc.js` expose; `compatlint` (Chrome 109) and the single-file rule cover it.
3. **Shared code, as now:** generation mechanics, bug fixes, and each new hook point. A hook point costs one all-guide
   run, once.

Rule of thumb: if the code would name one game, or switch on a flag only one game sets, it belongs in 1 or 2.

## Rejected

- **An engine build per guide:** seven forks of a 500 KB bundle; a shared fix has to reach all of them.
- **Declaring a shared-code change "hack-only" to skip checks:** cheap, but those bytes do run on every guide, and that's
  how a typo ships to seven guides.

## Limits

- Hardlove 0.8.9 would still have run everywhere: `primalStays` needs its first hook, and the Natural Gift power report
  was a real all-guide fix. The saving comes later, once hooks exist.
- By commit message, about a quarter of the recent engine commits read (11-12 of the latest 45, of 72 since October) name
  one game; the rest are shared capability. So this trims part of the reruns, not most of them.
- A hook is a promise to keep an internal stable, so add them only as a real game needs one. Don't migrate old
  `over` keys or flags as a project; move one when its game next needs that code changed.

## To settle in the decide step

The first hooks (setter lifetime is the known one), the registration API, whether pages (`dex.js`) get the same file or stay
on `cfg` switches, and how each hack's node checks load its extension.

---
name: verify
description: Pick and run the checks for a change in thor-dex-guides (data, calc engine, template, scenarios), targeted while working and the full parallel set once at the end, and read a failure. Use before a commit that ends a sub-step, before handing over or merging, or when asked to verify / check / test a change.
---

# Verify a change

Rule: run a check only when no later work in the job will change what it covers. While working, run what the change
touches on the guides it touches; the full set once at the end of the job. Browser runs share the machine: the gate
refuses to start while another browser check runs, so start one sweep, then the next.

## 1. What changed → what to run

| Change | Run |
| --- | --- |
| A hack's extract / `data.json` | its `extract/build.py`, `extract/check.py`, `python assemble.py <hack>`, `uv run python -I tools/gate.py check <hack> --data` |
| Calc engine (`tools/calc/src`, `template/calc/profiles`), a profile in `hack.json` → `cfg.calc`, `calc_matchups.json` | `npm test --prefix tools/calc`; `node tools/calc/hzla_compare.mjs <hack>` for EI / Photonic / Eternal X / BB2R (expected: EI 142 + 12 known, Photonic 118 + 28, Eternal X 116 + 3, BB2R 46 + 4, 0 mismatch); `python assemble.py` |
| `template/` (shell, dex.css / dex.js, calc.js / calc.css) | `python assemble.py`; the scenarios for the area (below) on every guide; `node tools/domcompare.mjs <old> <new> [--kb] --routes '<#/route>'` against the job's start build |
| A scenario or `tools/calc_check_lib.mjs` | that scenario on every guide |
| Docs only (`*.md`) | nothing |

Scenarios for an area, every guide at once (8 jobs is the fastest on this PC: 4 min for everything; more only slows
each run):
`uv run python -I tools/gate.py scenarios [hack ...] --only calc-layout,calc-controls --jobs 8`
(names are the stems in `tools/scenarios/`; no `--only` runs all of them; no hack runs every built guide).

## 2. End of the job

`uv run python -I tools/gate.py check <hack ...> --jobs 8` for every guide the job touched (a template change: all of
them). It rebuilds, compares with the baseline (`gate.py baseline [ref]`, see `tools/README.md` → Standard gates), runs
consistency / tabs / walk-state / mockup checks one at a time and the scenarios `--jobs` at a time. Read the summary
line and every FAIL: a difference the job intended (a page it changed) is fine; say so when reporting.
The gate only means something when its baseline is the last good state (`.tmp/baseline/manifest.json` → ref): right
after a merge into `main`, or recaptured at `main` before merging a branch. A baseline older than the branch (the calc
branch's is from before the calc) flags every page; then answer "did this job change anything else" by building the
job's start commit (step 3.2) and running `domcompare` on the routes the job touched, plus a hash of the other guides'
dist with the build date removed.
UI changes also end in the Thor frame on the phone preview (`python -I tools/preview.py <page> <name>.html --frame`).

## 3. A failure

1. The message says what was expected; the screenshot is in `.tmp/calc-checks/` (`<scenario>-<guide>-<check>-<size>-<mode>-FAIL.png`),
   gate logs in `.tmp/gate/<stamp>/`. Look at the screenshot before guessing.
2. New or old? Build the job's start commit and run the same scenario there:
   `git worktree add --detach .tmp/before <start sha>`, `python assemble.py` inside it, then
   `node tools/scenarios/<scenario>.mjs dist/<hack>.html` from `.tmp/before`. Failing there too: it predates the job
   (report it, don't hide it). Remove the worktree after (`git worktree remove .tmp/before`).
3. Still unclear which commit broke it: `git bisect` over the job's commits (one per sub-step) with that one scenario
   on that one guide (about 30 s a step).
4. Fix the cause. Change a check only when the check is wrong (it tests one guide's data, a stale selector); a real
   page problem the job may not fix goes to the user with a recommendation.

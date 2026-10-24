# Code cleanup (findings and execution plan, written 2026-10-24)

Everything works; this is a quality pass, not a bug hunt. Goal: less old and useless code, and repeated logic pulled
into shared files, so the next guides are cheaper to build. It runs in two phases. **Phase 1 is read-only and ends
with a findings list for the user. Nothing is changed until the user has picked from it.**

## Read first
`AGENTS.md`, `PROGRESS.md`, `template/README.md` (what the template does, the shared rules, what was rejected),
`tools/README.md`, `tools/extractlib.py` (docstring: the extract layout), `hacks/emerald-imperium/notes.md` → Data
schema. Each hack's `notes.md` says how its data was built and which parts are deliberate.

## Scope
| Area | Files |
| --- | --- |
| Template | `template/dex.js` (~124 KB, one file inlined into every guide), `template/dex.css`, `template/shell.html` |
| Build | `assemble.py` (must stay stdlib only: the Pages workflow runs it bare) |
| Shared extract code | `tools/extractlib.py`, `schema.py`, `itemstd.py`, `splits.py`, `datajson.py`, `sprite_keys.py`, `pngpal.py` |
| Per-hack extracts | `hacks/<hack>/extract/*.py` for emerald-imperium, hardlove-gold, eternal-x, photonic-sun |
| Source tools | the rest of `tools/*.py` / `*.js` (fetchers, 3DS readers `garc.py`, `ctr_dex.py`, trainer dumpers) |
| Checks | `tools/domcompare.mjs`, `consistency-check.mjs`, `walk-state-check.mjs`, `tabs_check.py`, `tools/mockup/*.mjs` |

Out of scope: `data.json`, `sprites/`, `dist/`, `uv.lock`, the docs (cleaned on 2026-10-24), the hacks without a guide.

## What to look for
1. **Dead code:** functions, CSS rules, cfg / `cfg.txt` keys, data fields and branches nothing reaches any more.
   Features removed earlier left traces (the "Changes from vanilla" card, the trials / mini caps switch, IVs on
   cards, evo/breed tags, the old `#sugg` dropdown, `cfg.starter: 'slot'`). Prove it's dead with a search, not a
   guess.
   **Not dead:** migrations and fallbacks for saved state from published builds (`migrateWalkState`, legacy cap
   formats, old localStorage shapes). People's saved trackers depend on them. Flag them as "kept for saved state"
   instead. `cfg.ls` keys are never removed.
2. **Repeated logic** between the four hacks' extracts (Photonic Sun and Eternal X were ported from each other:
   compare their `trainers.py`, `locs.py`, `items.py`, `walk.py`, `dex.py`), between the extracts and `tools/`, and
   inside `dex.js` (near-identical render or bind code across pages). For each: the copies (file:line), what a
   shared function would look like, and where it would live (`extractlib.py`, a new `tools/<name>.py`, or a helper
   in `dex.js`). Only propose it when 2+ copies already exist, or the next 3DS / Gen 3 guide would clearly copy it
   again.
3. **Stale comments and names:** comments describing behaviour that changed, references to deleted plans or files,
   leftover debug code, unused imports.
4. **Tools nothing uses** (check every `SOURCES.md`, the extracts and the READMEs before calling one unused).
5. **Small structural smells** worth fixing: very long functions that do several jobs, magic numbers that appear
   more than once, inconsistent naming for the same thing across hacks.

Don't flag style preferences, a different architecture, new dependencies, type hints, or "add tests". The repo's
style is compact on purpose (short names in `dex.js`, one-line rows in data files).

## Phase 1 output
Write the findings into this file under **Findings**, ranked by value for the next guides. One entry each:
`[id] area · file:line(s) · what · proposed change · risk (none / low / needs a rebuild check / touches saved state)
· rough size`. Then stop and give the user the summary. No edits, branches or commits in phase 1 apart from this
file (on `main`, if nobody else is on it).

## Phase 2 (only the entries the user picks)
- Branch `worktree-code-cleanup` from `main` (AGENTS.md → Where a session works). `template/` is one session at a
  time: check that no other branch with template changes is unmerged.
- **The gate, after every change:**
  - Extracts: each hack's `data.json` must come out **byte-identical**. Raw rebuilds need `.src/` (copy it from the
    main checkout; the 3DS hacks also read `romfs-dl/` and the Azahar dumps through main's paths, see each
    `SOURCES.md`). Emerald Imperium's full raw pipeline and Hardlove Gold's raw 0.8.2 snapshot don't reproduce their
    published data. For those, check with the re-finish path (`build.py --published` for HG, `tools/itemstd.py
    <hack>`) and leave the raw-only code alone unless the user says otherwise.
  - Template: `python assemble.py`, then `node tools/domcompare.mjs <main build> <new build>` for all four guides,
    normal and `--kb`: 0 differing routes, 0 page errors. Also `node tools/consistency-check.mjs` and
    `python -I tools/tabs_check.py`.
- Small commits, one finding (or one group) each. Ask the user before every push; never push or merge `main` without
  a yes.
- At the end: update `tools/README.md` / `template/README.md` if something moved, tick the findings here, and say
  what merges next. Once it's merged, delete this file (the AGENTS.md rule for finished plans).

## Execution workflow agreed 2026-10-24

**Intent:** Opus orchestrates, one 6.1 sol worker runs at a time, and work survives a provider usage limit or a new
chat. Prefer using the remaining GPT allowance over Claude allowance. The user reported about 60% remaining on
each provider, with Claude resetting in roughly three hours and GPT in four, at planning time. Those are user
estimates, not live telemetry or a promise that the cleanup fits either window. Implementation plus verification
may exceed the audit's usage; sequential workers limit concurrency, not the total work or token cost.

This section is a **task-specific user exception** to the usual 6.1-sol-only model rule, not a global instruction
change. Opus may orchestrate this cleanup; use Sol for implementation and audit by default. Sonnet is an authorised
fallback for a small finish when GPT is exhausted. Luna is permitted for narrowly specified mechanical work and
on-demand read-only scouting as described below, but is not required or the default. Do not rewrite `AGENTS.md` or
`CLAUDE.md`, or override the user's effort settings.

**This turn records the plan only.** It does not launch phase 2, create branches or make commits. At kickoff, confirm
the selected findings. The intended scope is the cleanup findings, with two conservative defaults until the user
decides otherwise: [08] retains the hidden shell node to meet the strict DOM gate; [22] keeps the optional generic
wiki utility. Do not silently interpret general cleanup approval as approval to weaken the DOM gate.

### 1. Prepare a durable integration workspace

- Re-read current progress, instructions, claims and branch/worktree status. `main` advanced to `0504a94` while this
  plan was being discussed; the findings reference `f5a08e3`. Record the actual kickoff SHA and recheck the affected
  code against intervening changes rather than repeating the whole phase-1 investigation.
- Bind the orchestrator to `worktree-code-cleanup` from current local `main` through T3 workspace tools. Check for
  other template owners first. Preserve this plan's uncommitted findings/workflow explicitly: T3 worktree creation
  copies committed state only. Copy the exact current plan into the integration workspace if it is not committed;
  do not assume a newly created worktree already contains it, or discard the main-checkout copy silently.
- Once the user starts phase 2, make frequent **local task-branch checkpoint commits**, as requested. This does not
  authorise commits on `main`, a merge to `main`, pushes, or worktree/branch deletion. Ask before every push, naming
  the branch and changes. Keep sources, generated `dist/`, claims and local logs out of commits.
- Capture immutable baseline guide HTML/data and baseline check tooling before code changes, under a named
  git-ignored location. Record absolute paths, hashes, source revision and date-stamp handling here. Check source
  availability and baseline gates first; a failing baseline is a blocker to that gate, not a cleanup regression.
- Create the initial checkpoint with this plan, selected/deferred IDs, actual base SHA and baseline locations.
  Do not rely on either chat history or a subagent's final message as the only recovery record.

### 2. Delegate one bounded unit at a time

- Opus uses T3 `orchestrator_capabilities` then `delegate_task`, explicitly targeting the available Codex provider
  instance and `gpt-6.1-sol`. Cross-provider delegation was tested in both directions. Do not use Claude's native
  same-provider subagent launcher for Sol, or create ordinary top-level threads as workers.
- Use `isolation: "worktree"` from the integration branch's latest accepted local commit. Retain the task ID,
  backing thread and worktree path. Prepare the required git-ignored `.src/` inputs there; uncommitted edits and
  source downloads do not travel with the commit. Each worker owns its worktree and coordination claim.
- Only one implementation worker may be live. The parent does not edit the child's checkout. Wait for a terminal
  task result, or interrupt and confirm termination before handing unfinished work to another model.
- Give each worker only the chosen IDs, owned files, relevant findings/spec, protected behaviours, baseline paths,
  exact checks and checkpoint requirements. It rechecks its own findings against current code, not the full repo.
  Keep shared helpers and their callers in the same unit; no competing owners for `template/` or `ctrguide.py`.
- Workers checkpoint after each independently testable finding or small coherent group. Larger helpers need small
  working stages: introduce it, switch one caller and check, then switch the other caller and check. Do not leave
  a whole converter or harness rewrite uncommitted until the end, and do not create broken intermediate commits
  just to follow a line-count/time quota.
- Return a compact result: task/worktree/branch, commit SHAs, changed files, finding status, exact checks and log
  locations, remaining risks, and the next action. Send failure excerpts, not full successful test logs.
- Opus reviews that bounded diff and evidence, then integrates its commits into the cleanup branch one worker at
  a time using the authorised task-branch workflow. Never merge a tab/worker directly into `main`. Update and
  commit this plan's checkpoint ledger before starting the next child so the next worktree inherits accepted work.

#### Optional Luna scout: discovery only, not a mandatory third layer

- The findings already provide the initial scouting brief. Do not launch a scout to reread the complete scope,
  repeat phase 1, summarise a file merely because it is large, or precede every implementation unit.
- When unexpected scope would otherwise require substantial exploration, the active implementation worker may
  delegate one precise read-only question to Luna through T3. Opus may do the same before assigning a unit when
  its boundaries are genuinely unknown. Discover the available Codex provider/model with
  `orchestrator_capabilities` and select `gpt-6-luna`; do not substitute a model silently or change effort settings.
- Give the scout the exact checkout/revision, relevant files or search boundary, the specific question and any
  known exceptions. A nested scout may share the active worker's checkout read-only; it must not edit, create
  claims, build, commit, change saved state or launch further agents. Keep the checkout unchanged during its read,
  and give it the current dirty-state context if the answer depends on uncommitted changes.
- Useful questions include locating all callers of a newly discovered helper, checking a dynamic field's readers,
  or identifying differences between two additional implementations. Ask for exact file/line references, relevant
  callers/conditions, exceptions, unresolved uncertainty and a proposed edit boundary. Aim for a 300–600-token
  report, not pasted files or a second full spec. Return "not established" rather than guessing.
- **The editing agent still reads the current functions and relevant callers, then reviews its own diff.** A scout
  report is a navigation aid, not authority to declare code dead, remove compatibility paths or skip a gate. Resolve
  any uncertain or consequential claim directly before making the change; do not request a chain of summaries.
- Opus normally works from this spec, the ledger and compact implementation/review reports rather than rereading
  entire source files. If detailed source review is necessary, delegate a bounded review to the appropriate worker;
  neither Opus nor the implementation agent should duplicate an already completed whole-scope investigation.
- Record an actionable scout result/task ID with its implementation checkpoint so recovery does not repeat it.
  Luna still spends GPT allowance and has startup/report overhead: use it only when it plausibly replaces a larger
  exploration, not as an assumed discount for reading code. It does not replace independent final review.

### 3. Suggested order and worker boundaries

These are sequencing groups, not permission to make one large unchecked commit. A group can span several workers
if a smaller context is useful, but do not repeatedly rediscover the findings.

| Order | Findings | Boundary / checkpoint |
| --- | --- | --- |
| A | [09], [16], [17], [18], [20], [21] | Small verified removals/comments; separate extract and template checkpoints, with their applicable gates. |
| B | [04], then optional [19] | Source-reader helper, then independent fetch helper; keep binary parsing and network policy unchanged. |
| C | [02], [03] | Wikitext helper and trainer algorithms; own both 3DS callers and the new shared modules. |
| D | [01] | Dex converter only; preserve local evolution callbacks and check each caller before finishing. |
| E | [11], then [10] | Mechanical prune links first; walkthrough attachment last, with its stronger saved-state checks. |
| F | [12], [07], [06], [13], [14], [15], [08] | One template owner at a time; small DOM-preserving steps, all four guides checked after each accepted change. |
| G | [05] | Browser/CDP harness last; keep baseline tooling and scenario expectations unchanged as an independent reference. |
| H | approved [22], final audit | Optional tool retirement only if explicitly selected; review the integrated result and finish documentation. |

The parent can reorder independent units to fit the remaining allowance, but must record the next unit and keep
the same gates. Do not defer all validation until H. Rebuild/check commands are local work, not a reason to launch
another analysis agent; keep their verbose output in ignored logs and summarise results.

### 4. Checkpoints and recovery when quota runs out

- At every completed finding/group record: status, last accepted SHA, worker/task/branch/path, files, passing or
  failed checks with baseline/log paths, and exact next action. Use `pending`, `in progress`, `verified`, `blocked`
  or `deferred`. A source commit alone does not mean verified.
- Before starting a large unit, check the provider UI if allowance is uncertain. Neither model can reliably infer
  account quota from elapsed time or token counts here. Keep room for integration and final verification; do not
  promise that all findings will fit one window, and do not start duplicate agents to test a reported hard limit.
- If a worker hits a limit, preserve its worktree, dirty files, last commits and logs. The parent inspects durable
  state rather than trusting a missing/truncated final response. Once it is no longer running, record a recovery
  checkpoint; if needed, save partial work as an explicitly labelled **WIP** commit on the worker branch, not as an
  accepted integration checkpoint. Such a WIP must be completed/reviewed before it is eligible to merge.
- **Sonnet fallback:** use it only when the recorded remainder is small and explicit (for example a second caller,
  a failing check with a diagnosed cause, or the last audit commands). Launch it with the original brief, current
  diff/checkpoint and unresolved work. Do not silently use it for another full refactor or a broad fresh audit.
- If substantial work remains, stop at the durable checkpoint and resume after the GPT reset instead of spending
  Claude to chase the window. Do not install a background polling/wait loop or schedule anything unless requested.
  A new parent chat resumes from the ledger and Git; a new child gets only the unfinished unit, not a repeated audit.
- Continue in the same unfinished worker checkout through a supported workspace binding when possible. If the new
  T3 child receives a fresh worktree, explicitly transfer the recovery commits and any remaining dirty patch before
  it starts; supplying an old worktree path in a prompt does not change its binding. Never delete the old checkout
  until its work is accounted for and the user authorises deletion.

### 5. Final acceptance and handover

- Run the original gates against the recorded baseline: byte-identical extracts (controlled build stamp), all four
  guides route-by-route in normal and `--kb`, zero page errors, consistency/tabs checks, and relevant migration and
  interaction scenarios. Run the migrated harnesses too; changing a checker must not silently weaken its assertions.
- Prefer one bounded, read-only Sol reviewer of the integrated diff and evidence, not another open-ended phase-1
  audit. If GPT is unavailable, a small final review can use the Sonnet fallback; otherwise checkpoint and wait.
- Opus reports completed/deferred IDs, final branch/SHA, results, known blockers and what merges next. Do not claim
  completion with failed/unrun gates, or delete this plan before the cleanup is actually merged. A merge/push to
  `main` and cleanup of worker branches/worktrees still require the user's authorisation.

### Checkpoint ledger

Phase 2 started 2026-10-24. **Selected:** [01]–[21]. [08] keeps the hidden `#sugg` shell node (strict DOM gate;
only the JS/CSS around it goes). **Deferred:** [22] (`tools/wiki_dump.py` stays).

**Integration workspace:** branch `worktree-code-cleanup` from `main` at `0504a94` (findings were written against
`f5a08e3`; the only commits between are docs and HG/EX/PS gift-row data, so line numbers may drift slightly).
Path `C:\Users\fikry\.t3\worktrees\thor-dex-guides\worktree-code-cleanup` (T3 thread, orchestrator Opus).
`.src/` for EI, HG, EX and PS copied from the main checkout; `uv sync` done.

**Baseline** (git-ignored, `.tmp/cleanup-baseline/` in the integration worktree, built at `0504a94` on 2026-10-24):
- `dist/*.html` (assemble.py at base; sha256 prefixes: EI `5e75f94078ba`, EX `937d0f1e5b17`, HG `a209f77de69a`,
  PS `60bf31507454`, index `0b601c7ed9a6`), `data/<hack>.json` (EI `343d0a5b125d`, EX `90b2cbf9557b`,
  HG `df12f2bdd7a1`, PS `1b4bbeccc253`), `report/<hack>.txt`, `tools-base/`, `template/`, `assemble.py` at base.
- `datacmp.py`: compares each hack's `data.json` (and `report.txt`) with the baseline, ignoring only the `built`
  stamp. Run from the repo root: `uv run python -I .tmp/cleanup-baseline/datacmp.py [hack ...]`. A worker worktree
  copies `.tmp/cleanup-baseline/` from the integration worktree.
- Reproducible at base: EX and PS `extract/build.py` (raw, from `.src/`), HG `build.py --published`, EI
  `tools/itemstd.py emerald-imperium`: all four identical, reports identical. `tabs_check.py`: 0 problems.
- Template gate at base: `domcompare` baseline vs fresh build, all four, normal and `--kb`, and
  `consistency-check.mjs`: results in `.tmp/cleanup-baseline/gates/`. The EI `--kb` self-compare flagged 15
  `#/l/…` routes with no visible difference while unit A's worker was sweeping at the same time (CPU contention);
  unit A's own EI runs were clean. **Never run two domcompare sweeps at once.**
- HG `build.py --published` also needs `hacks/hardlove-gold/.src/` (copy it into worker worktrees).

| Unit / IDs | Status | Accepted SHA | Worker task / branch / path | Checks / evidence | Next action |
| --- | --- | --- | --- | --- | --- |
| Kickoff / baseline | verified | (this commit) | orchestrator | Data rebuilds identical ×4; tabs 0 problems; dom/consistency at base: see gates/ | Delegate unit A. |
| A [09] [16] [17] [18] [20] [21] | verified | `42cac28` (ff: `e60a330` extract, `42cac28` template) | gpt-6.1-sol, task `cleanup-unit-A-r1`, branch `t3/cleanup-dead-code`, `C:\Users\fikry\.t3\worktrees\thor-dex-guides\t3-c61d84de` | datacmp ×4 identical; domcompare ×4 normal + kb: 0 differing, 0 page errors; consistency + tabs pass. Log: that worktree's `.tmp/unitA-logs/report.md` | — |
| B [04] [19] | verified | `8b6078a` (ff: `296ff0d` [04], `8b6078a` [19]) | gpt-6.1-sol, task `cleanup-unit-B-r1`, branch `t3/share-garc-http-tools`, `C:\Users\fikry\.t3\worktrees\thor-dex-guides\t3-f91b8296` | 13 base/new reader JSON pairs byte-identical (EX ×2 variants + Viola Nerf, PS, MM, NS); not-found exception identical; EX/PS datacmp identical; 29 mocked HTTP scenarios identical. Logs: that worktree's `.tmp/unitB/` | — |
| C+D [02] [03] [01] | verified | `e1d9824` (ff: `0c00722` [02], `998f60c` [03], `d52f70f` + `e1d9824` [01]) | gpt-6.1-sol, task `cleanup-unit-CD-r1`, branch `t3/cleanup-units-cd`, `C:\Users\fikry\.t3\worktrees\thor-dex-guides\t3-b196c976` | New `tools/wikitext.py` (23 lines), `tools/ctrguide.py` (201); 447 caller lines out, net −181. EX/PS datacmp identical + check.py pass after every commit; differential checks on splitter, scoring, learnsets, intermediate dex. Logs: that worktree's `.tmp/unitCD/` | — |
| E [11] [10] | verified | `4850b90` (ff: `27c6926` [11], `0f557ea` + `4850b90` [10]) | gpt-6.1-sol, task `cleanup-unit-E-r1`, branch `t3/shared-3ds-extract-helpers`, `C:\Users\fikry\.t3\worktrees\thor-dex-guides\t3-2f66f4f4` | `extractlib.filter_species_links`, `ctrguide.walk_same` / `walk_stops`; +70/−100. EX/PS data + reports byte-identical (stamps too), check.py, tabs 0 problems. HTML equals baseline once unit A's template is substituted. Logs: that worktree's `.tmp/unitE/SUMMARY.md` | — |
| F [12] [07] [06] [13] [14] [15] [08 minus node] | verified | `225c9b0` (cherry-picked onto the ledger commits: `51030a2`…`e0de2f1` → … `225c9b0`; template files identical to the worker's tip) | gpt-6.1-sol, task `cleanup-unit-F-r1`, branch `t3/template-code-cleanup`, `C:\Users\fikry\.t3\worktrees\thor-dex-guides\t3-a452e602` | Full gate after [14], [15], [08]: EI 2,649 / HG 2,482 / EX 2,312 / PS 2,464 routes per mode, 0 differing, 0 page errors, no `--ignore`; consistency + tabs pass; EI kb pagecheck / walkcheck / jumpcheck match baseline (200 jumps, 0 bad). [08] kept the `#sugg` node and one startup `style.display='none'` (removing it changes the node's inline style). dex.js 123,852 → 122,188 B, dex.css 37,723 → 36,784 B. Log: that worktree's `.tmp/unitF/report.md` | — |
| G [05] | in progress (Sonnet: Codex at ~4%) | — | claude-sonnet-5-5, task `cleanup-unit-G-r1` | **Pre-existing:** `walk-state-check.mjs <old> <new> 0.0` fails at base too (EX `tick 2.0`, PS `tick 1.3`, `undefined !== 1` at line 131; identical on baseline-vs-baseline). Not a cleanup regression. **Also:** domcompare's EI `--kb` sweep flags identical-looking routes even when run alone (unit F needed isolated reruns on every full gate). | Diagnose and fix the walk-state check (or its invocation) and the EI kb flake in G, before refactoring the harnesses. |
| H final audit | pending | — | — | — | Haiku worker after G: every gate on the integrated branch vs the baseline (datacmp ×4, domcompare ×4 normal + kb one at a time, consistency, tabs, mockup checks, walk-state if G fixed it), pass/fail with evidence. Each unit's diff was already reviewed by the orchestrator before merging. Then ask the user to merge to `main`. |
| I standard-work tooling (added 2026-10-24, user approved) | pending | — | — | — | **Not on this branch:** after the cleanup merges, its own branch `worktree-standard-tooling` from `main`, Sonnet worker. Spec below. |

**Close-out agreed 2026-10-24 (user):** this session finishes G → H → merge the cleanup into `main` → the text-zoom
fix (Sonnet task `text-zoom-bars-r1`, branched from `7032a38`) → unit I (own branch) → the update checker
(`plans/update-checker.md`, subagent) → PROGRESS.md handover (hack families: 3DS done; pokeemerald-expansion EI +
SoulGold; CFRU Radical Red + Unbound; NDS Renegade Platinum, BB2 Redux, HG Retiled). **The user authorised local merges
into `main` for these branches, each after its gates pass. Pushes still need a yes each time.** New-hack data
collection (Sol after the Codex reset) and the calc (its own decide session, `worktree-damage-calc`) are out of scope.

**Models from the Codex reset (user, 2026-10-24):** every new worker on gpt-6.1-sol again (unit I, the update
checker, any fix rounds); audits (H and later ones) on Haiku. G and the text-zoom fix finish on Sonnet as launched.
No new worker before the reset (~15 min timer started at the request).

**Order agreed 2026-10-24** (Codex usage ~18% before F, ~6% per unit so far; Claude ~44%): F and G on Codex
(gpt-6.1-sol), H on Haiku, merge, then I on Sonnet. If G runs out partway, recover from its commits and finish the
small remainder on Sonnet (section 4).

**Unit I scope** (user approved 2026-10-24; touches `tools/`, `.agents/`, docs only, no template; carry this block
into `plans/standard-tooling.md` when the cleanup merges and this file is deleted):
1. `tools/gate.py`: `baseline [ref]` builds every guide at a git ref (default `main`) into `.tmp/baseline/`
   (dist, data.json, report.txt); `check [hacks] [--data] [--template]` rebuilds each hack by its reproducible path
   (EX/PS raw, HG `--published`, EI `itemstd.py`; the table lives in the script), compares data ignoring `built`,
   prints data counts (species, trainers, items, stops) against the baseline, runs `assemble.py`, domcompare per guide
   normal + `--kb` strictly one at a time, consistency, tabs, walk-state, and every scenario in `tools/scenarios/`;
   one pass/fail line per check, logs in `.tmp/gate/`. Replaces `.tmp/cleanup-baseline/datacmp.py`.
2. `tools/scenarios/`: spec checks as small scripts on `tools/browser.mjs` (seeded state, clicks, assertions); the
   existing pagecheck / walkcheck / jumpcheck runs become the first entries or are called from there.
3. Worktree setup: `tools/worktree_setup.py` (claim, `uv sync`, `.src/` linked to the main checkout instead of
   copied); wire it as the T3 project setup script if T3 allows.
4. `.agents/references/worker-brief.md`: the standard delegated-worker brief (setup, read-only worktrees, gates,
   commits, report format), so a task only adds its findings / files / checks.
5. `preview.py --frame` (Thor frame + phone preview in one command).
6. Spec skeleton in the workflow docs (What changes / out of scope; each control in every state; edge cases; checks
   as `tools/scenarios/` entries) and a big-job reference (units table, ledger, quota recovery) from this plan.
Not in I: the new-guide scaffold (`tools/new_hack.py`), built at the first new guide; the "write a family's first
guide with its sibling in mind" habit, proposed as a CLAUDE.md line at handover.

## Findings

Phase 1 completed 2026-10-24 against `main` (`f5a08e3`). Read-only inspection of the scoped template, build,
shared tools, four built hacks' extracts and checks; source-tool callers were checked across all twelve
`SOURCES.md` files, READMEs, extracts and workflows. No production code or data was changed and no builds or
browser checks were run. Only this plan is a tracked change. Findings are ranked by value for the next guides,
not by severity; these are cleanup choices, not reported bugs. Sizes describe approximate implementation scope.

### Ranked choices

**[01] 3DS extracts · Share the near-identical dex converter**
- Copies: `hacks/eternal-x/extract/dex.py:12`, `hacks/photonic-sun/extract/dex.py:12`; conversion bodies at
  `hacks/eternal-x/extract/dex.py:79`, `hacks/photonic-sun/extract/dex.py:81`.
- Evidence: file comparison shows identical type tables, form naming/folding, move comparison, species construction
  and most evolution linking. `form_name` and the move-doc parser are identical; the important differences are
  evolution wording/methods and Eternal X's Pumpkaboo fallback.
- Proposed change: focused `tools/ctrguide.py` helper
  `build_dex(data, hacked, vanilla, *, move_notes, evolution_text, evolution_rows, report)` plus the shared move-doc
  parser. Keep game-specific evolution callbacks local and preserve species/move order, slugs and scratch mappings.
  Remove the unused `names` parameter from the local evolution formatter as part of this change.
- Risk: **needs a rebuild check**, both 3DS guides byte-identical. Rough size: **medium**, about 180–200 shared lines
  replacing two copies. This is the largest saving before another 3DS guide.

**[02] 3DS extracts · One balanced wikitext argument splitter**
- Copies: `hacks/eternal-x/extract/trainers.py:56`, `hacks/photonic-sun/extract/trainers.py:76`,
  `hacks/eternal-x/extract/items.py:126`.
- Evidence: both `split_top` bodies are identical; `split_args` performs the same pipe splitting with nested
  `{{…}}` and `[[…]]` handling in a differently arranged loop.
- Proposed change: `tools/wikitext.py: split_args(text)` for the three callers. Keep their different cleaning,
  named-field interpretation and trainer-event parsing local.
- Risk: **needs a rebuild check**. Rough size: **small**, about 20 shared lines and three caller replacements.

**[03] 3DS trainers · Share two exact matching/learnset algorithms**
- Copies: scoring at `hacks/eternal-x/extract/trainers.py:208`, `hacks/photonic-sun/extract/trainers.py:238`;
  default moves at `hacks/eternal-x/extract/trainers.py:227`, `hacks/photonic-sun/extract/trainers.py:403`.
- Evidence: each pair has identical executable bodies, including the nested Photonic Sun default-moves helper.
- Proposed change: `tools/ctrguide.py: trainer_match_score(event, trainer)` and `default_moves(species, level)`.
  Preserve scoring and learnset-order semantics; do not merge the full Gen 6/7 trainer converters.
- Risk: **needs a rebuild check**. Rough size: **small**, about 20 shared lines and four replacements; can reuse
  the module from [01], but does not require the larger converter refactor.

**[04] Source readers · Centralise ordered GARC fallback lookup**
- Copies: `tools/xy_trainers.py:26`, `tools/ctr_dex.py:119`; `tools/usum_trainers.py:18` imports the Gen 6 tool's copy.
- Evidence: both scan roots in order, read the first existing archive and raise `FileNotFoundError(path)` otherwise.
  The dex copy additionally returns the selected root for provenance (`tools/ctr_dex.py:187`). All three tools have
  recorded callers, including the not-yet-built Meissa Moon and Navy Sapphire guides.
- Proposed change: `tools/garc.py: read_archive(roots, path) -> (entries, selected_root)`; trainer readers discard
  the root. Preserve raw/non-decompressed records, fallback precedence and exception payload.
- Risk: **needs a rebuild check**, including byte-identical intermediate trainer/dex JSON. Rough size: **small**,
  about 20–35 changed lines across four tools.

**[05] Checks · Share browser-process/CDP transport setup**
- Copies: `tools/domcompare.mjs:28`, `tools/consistency-check.mjs:13`, `tools/walk-state-check.mjs:78`,
  `tools/mockup/walkcheck.mjs:8`, `tools/mockup/pagecheck.mjs:9`, `tools/mockup/jumpcheck.mjs:11`.
- Evidence: six copies discover Chrome, create a profile, launch on port zero, poll `DevToolsActivePort`, connect a
  WebSocket and dispatch responses through a sequence counter/pending map.
- Proposed change: `tools/browser.mjs: startBrowser({profilePrefix, flags, onEvent, onDisconnect}) -> {send, close}`.
  Keep scenario logic, evaluation assertions, navigation waits and storage seeding local. Preserve domcompare's
  throttling flags/disconnect handling, context isolation, migration old/new sequencing, mockup scrollbar flags,
  exception collection and scale factor.
- Risk: **low**, but execute each affected harness after refactoring it. Rough size: **medium**, about 100–170
  repeated setup lines consolidated across six callers. No browser dependency is needed.

**[06] Template · One collapsible section-shell renderer**
- Copies: `template/dex.js:337`, `template/dex.js:420`, `template/dex.js:564`.
- Evidence: Locations' `LSEC`, Items' subheadings and walkthrough's `walkSec` each emit the same `details.sec`,
  summary/name/tags, `.secb` and `.endbar.sb` structure.
- Proposed change: stateless `sectionHTML(key, label, tags, body, open)` beside the shared collapsible helpers;
  keep page-specific escaping, key construction and open-state decisions in thin wrappers. Locations/Items use
  zero-means-closed; the walkthrough Checklist has a different default. Do not normalise their saved objects.
- Risk: **needs a rebuild check**, identical emitted markup and keys on every guide. Rough size: **small**,
  about 25–40 touched lines and three render copies reduced to one.

**[07] Template · Reuse tracker counts and action-button markup**
- Copies: `template/dex.js:318`, `template/dex.js:322`, `template/dex.js:539`, `template/dex.js:550`.
- Evidence: `tkBar()` recalculates the caught/failed counts already implemented by `tkCounts()` and repeats Guide
  info's Export/Import/Reset buttons.
- Proposed change: call `tkCounts()` and add `trackerButtons()` beside `tkBar()`. Keep each wrapper, classes and
  binding behaviour unchanged; append the walkthrough-only checklist-reset button separately.
- Risk: **needs a rebuild check**. Rough size: **small**, about 10–15 touched lines.

**[08] Template · Remove the retired suggestions dropdown**
- Locations: `template/shell.html:16`, `template/dex.css:71`, `template/dex.css:228`, `template/dex.js:129`,
  `template/dex.js:144`, `template/dex.js:159` and the page renderers' `sug.style.display='none'` calls.
- Evidence: `#sugg` is created empty; searches find no writer that populates or reveals it. `suggestions()` only
  hides it. Filters now come from the full-window search.
- Proposed change: delete the unused variable/helper/hide calls and four CSS rules; remove the shell node only
  after resolving the DOM-gate issue below. No replacement abstraction is needed.
- Risk: **needs a rebuild check**. Rough size: **small**, about 20 touched lines across three files.
  **Gate conflict:** deleting the hidden shell node is an intentional structural DOM difference, so it cannot pass
  the literal zero-differing-routes gate above. Either retain the inert node for the strict pass, or explicitly
  approve this precise expected DOM difference before phase 2; do not silently broaden `--ignore`.

**[09] Photonic Sun extract · Delete discarded legacy-map construction, not migrations**
- Locations: `hacks/photonic-sun/extract/walk.py:48`, `hacks/photonic-sun/extract/walk.py:72`;
  `hacks/photonic-sun/extract/trainers.py:260`, `hacks/photonic-sun/extract/trainers.py:266`,
  `hacks/photonic-sun/extract/trainers.py:289`, `hacks/photonic-sun/extract/trainers.py:291`,
  `hacks/photonic-sun/extract/trainers.py:620`.
- Evidence: walkthrough's `legacy` is written but never read or returned. Trainers' map becomes `TR.legacySections`,
  whose only downstream reference is unconditional removal in `tools/schema.py:93`; the runtime/checks use stable
  stop keys instead. Search for `legacySections`/`legacyStops` confirms no runtime consumer.
- Proposed change: remove unused dictionary construction and return/unpack plumbing only. Retain `stop.k`, `.fN`,
  trainer identities and defensive schema removal of old fields.
- Risk: **low**, dead extract bookkeeping, with byte-identical output still required. Rough size: **small**,
  about 10–15 lines removed.

**[10] 3DS walkthrough extracts · Share initial stop/area attachment**
- Copies: matching at `hacks/eternal-x/extract/walk.py:32`, `hacks/photonic-sun/extract/walk.py:31`; initial stop
  construction/attachment at `hacks/eternal-x/extract/walk.py:46`, `hacks/photonic-sun/extract/walk.py:79`.
- Evidence: identical block splits designated stops, attaches areas using aliases/explicit placements, and inserts
  unmatched areas as on-the-way stops; `same()` is also identical.
- Proposed change: `extractlib.walk_stops(areas, stops, trainer_names, *, aliases, placements, new_stops)` returning
  ordered initial stops. Keep Lumiose item routing, persistent-key/fragment assignment and cap regrouping local.
- Risk: **touches saved state** indirectly: later persistent-key assignment depends on this order. Require
  byte-identical 3DS data and migration checks. Rough size: **small–medium**, about 45 shared lines. Lower priority
  than the safer helpers despite the duplication.

**[11] Extracts · Share mechanical retained-species link filtering**
- Copies: `hacks/eternal-x/extract/prune.py:29`, `hacks/photonic-sun/extract/prune.py:14`,
  `hacks/emerald-imperium/extract/prune.py:22`.
- Evidence: each removes `ef`, `et` and `of` links whose target IDs were pruned.
- Proposed change: `extractlib.filter_species_links(species, kept_ids)`, preserving entry/edge order. Initially
  use it only in the two rebuildable 3DS pipelines; leave EI raw-only code untouched under the current gate.
  Do not combine availability policy: evolution/form/stone reachability and existing availability labels differ.
- Risk: **needs a rebuild check**. Rough size: **small**, about 10 shared lines and two initial callers.

**[12] Template · Reuse the existing starter-select renderer**
- Copies: `template/dex.js:317`, `template/dex.js:558`.
- Evidence: walkthrough's `PICK` branch repeats `starterSel()`'s `STARTERS` options, selected-value comparison and
  escaping; only the placeholder differs.
- Proposed change: use `starterSel('tk-starter', 'Not chosen (show all)')`, leaving the surrounding wrapper intact.
- Risk: **low**; standard template checks still apply. Rough size: **very small**, one replacement line.

**[13] Template CSS · Delete selectors with no producer**
- Locations: `template/dex.css:18`, `template/dex.css:23`, `template/dex.css:41`, `template/dex.css:86`,
  `template/dex.css:384`.
- Evidence: `.tabs`, `label.chk`, `.s56` and `.tag.capg` have no markup/JS producer, including dynamic sprite-size
  callers; inspected guide data supplies no class markup creating them.
- Proposed change: remove those rules only, retaining the live `.s40`/`.s112` fragments on the shared size line.
- Risk: **needs a rebuild check**, all guide sizes and both keyboard modes. Rough size: **very small**, about eight
  touched CSS lines.

**[14] Template keyboard · Remove the old search-button keyboard connection**
- Locations: `template/dex.js:105`, `template/dex.css:191`, `template/dex.css:194`, `template/dex.css:195`,
  `template/dex.css:197`.
- Evidence: the three `KB.open()` option objects (`template/dex.js:122`, `template/dex.js:126`,
  `template/dex.js:837`) never set `disp`; `KB.o.disp` cannot succeed. Search opens `SR`, not a keyboard attached to
  `.disp`, and the editing-related `.open` assignment targets numeric buttons.
- Proposed change: remove the unreachable buffer-sync condition and `.disp.open` selectors. On mixed selectors,
  retain `.kq::after` and its reduced-motion rule: the encounter picker still uses them.
- Risk: **needs a rebuild check**, especially search and encounter Other in `dvkb`. Rough size: **very small**,
  about 5–7 touched lines.

**[15] Template configuration · Retire the unused `starter: 'slot'` UI path**
- Locations: `template/dex.js:555`, `template/dex.js:559`, `template/dex.js:600`.
- Evidence: all four published `hack.json` files select `pick` or `type`; none selects `slot`. The `.wk-starter`
  element is produced/consumed only by this branch/binding. This is an unused configuration mode, not a migration.
- Proposed change: remove that branch/binding and update its comment. Keep the current `PICK` controls and all
  starter seeding/synchronisation and area-0/type fallback logic. Update the configuration documentation in phase 2
  if this retirement is selected.
- Risk: **needs a rebuild check**; deliberately removes a documented but unused mode. Rough size: **small**,
  about 6–8 code lines plus its documentation entry.

**[16] Template initialisation · Drop unused computed BST**
- Location: `template/dex.js:7`.
- Evidence: searches and dynamic-property inspection find no reader of `p.bst`; stat sorting reads `p.s[k]`.
- Proposed change: remove only `p.bst=p.s.reduce(...)`. The historical `.bst` list class is live, and the old
  `sort==='bst'` saved-state conversion at `template/dex.js:46` must remain.
- Risk: **low**. Rough size: **very small**, one expression.

**[17] Template routing · Delete the unreachable generic placeholder**
- Location: `template/dex.js:953`.
- Evidence: repository search finds `soon(` only at its declaration; the explicit router never dispatches to it
  and has no dynamic function-name dispatcher. Calc uses its own live `calcPage()`.
- Proposed change: delete `soon()` and its obsolete TABS NOT BUILT YET heading, not `calcPage()`.
- Risk: **low**. Rough size: **very small**, two lines.

**[18] Template trainers · Remove an unused local group counter**
- Locations: `template/dex.js:713`, `template/dex.js:716`, `template/dex.js:717`.
- Evidence: `trGroup()` initialises and increments local `n`, but never reads it for rendering, branching or its
  returned value; no closure exposing it escapes.
- Proposed change: remove this declaration and its two increments only, not other functions' live counters.
- Risk: **low**. Rough size: **very small**, three touched lines.

**[19] Fetchers · Share the matching retry/read skeleton**
- Copies: `tools/mirror.py:12`, `tools/rhd_moves.py:15`.
- Evidence: both retry urllib reads, retain the last exception, sleep after failures, then print FAIL and return
  `None`. Both have recorded source-fetch callers; neither tool is obsolete.
- Proposed change: optional `tools/source_http.py: fetch_bytes(url, *, headers, timeout, attempts, delay)`;
  keep text decoding in the move fetcher. Preserve mirror's 3 attempts/30 s/`1 + attempt` delays and moves'
  4 attempts/60 s/`2 + 2*attempt` delays, identity encoding header, and current final-failure sleep. Do not fold in
  Bulbapedia's distinct User-Agent and raise-on-exhaustion policy.
- Risk: **low**. Rough size: **small**, about 20–30 shared lines. Modest saving; lower priority than reader helpers.

**[20] Shared tools · Delete one verified unused import**
- Location: `tools/schema.py:11`.
- Evidence: AST inspection finds no loaded `re` name; text search finds only `import re`, and repository search
  finds no `schema.re` or `from schema import re` consumer. Shared `common.py` imports, by contrast, often re-export
  names and were not treated as dead just because a local AST scan lists them.
- Proposed change: remove that import only.
- Risk: **none** for recorded consumers. Rough size: **very small**, one line.

**[21] Template comments · Remove descriptions of the retired cap-set control**
- Locations: `template/dex.css:380`, `template/dex.js:790`.
- Evidence: comments mention the cap tag/set switch and current cap set, while live code uses the count/cap
  button, cap line and a single `TRD.caps` list.
- Proposed change: describe the current controls only. Do not remove legacy cap conversions or storage keys.
- Risk: **none**. Rough size: **very small**, about four comment lines.

**[22] Source tools · Optional retirement of the unused generic wiki dumper**
- Location: `tools/wiki_dump.py:1`.
- Evidence: searches across all twelve `SOURCES.md` files, extracts, READMEs, workflows and hidden instructions
  find only its own usage string and `tools/README.md:21`, which explicitly says no hack currently uses it.
- Proposed change: remove it only if the user no longer wants this manual utility; otherwise leave it. Its README
  inventory row would also need removal in phase 2. No recorded consumer is not proof that a generic CLI is unwanted;
  `bulba_pages.py` is not a drop-in replacement (namespace, redirects, retry and output behaviour differ).
- Risk: **low**, removes an available manual command. Rough size: **very small**, 31-line file plus inventory row.

### Kept for saved state / deliberately not proposed

- **Kept for saved state:** old BST-sort/changed-filter conversions (`template/dex.js:46`), tracker slot migration
  and starter seeding (`template/dex.js:254`, `template/dex.js:266`), `migrateWalkState` and `.fN` inheritance
  (`template/dex.js:498`), legacy cap shapes (`template/dex.js:630`, `template/dex.js:631`, `template/dex.js:695`),
  saved object defaults/old trainer-state tolerance, and route/anchor restoration (`template/dex.js:974`).
  Every `cfg.ls` key stays, including `capset`; AR/LOC order, stop keys and trainer identities stay stable.
- No unused configured `cfg.txt` key was proved. In particular `chdoc`, `walk`, `capnone` and `noev` have runtime
  readers. Trainer IV data still feeds speed calculation (`template/dex.js:648`), even though IV display is gone.
- EI/HG raw-only refactors are deferred under the existing non-reproducing-pipeline restriction. Their similar
  Levenshtein helpers (`hacks/emerald-imperium/extract/match.py:9`, `hacks/hardlove-gold/extract/common.py:25`) also
  differ in length cutoffs; they are not blindly interchangeable. Do not use a successful published-data re-finish
  as evidence that a raw-only change is safe.
- Gen 6/7 trainer record layouts and prune availability policies differ intentionally. Their shared mechanical
  parts are listed above; their full pipelines should not be combined.
- Preserve migration fixtures in `tools/walk-state-check.mjs`. Keep `tools/tabs_check.py`'s independent cap checker
  rather than sharing the production resolver and weakening the check's independence.
- Source tools used only by the eight unbuilt hacks are not unused. The only no-recorded-consumer tool found is
  [22], already documented as such. `assemble.py`, sprite matching/cropping, `itemstd`, `splits`, `datajson` and the
  shared finishing chain yielded no further high-value change worth proposing under this brief.

### Phase 2 validation cautions

- Apply only selected IDs. [08]'s hidden-node removal requires the explicit DOM-gate decision recorded there;
  all other template proposals are intended to preserve the rendered DOM under the existing gate.
- `extractlib.write_data()` stamps the current date (`tools/extractlib.py:174`). For strict byte comparisons on
  another day, control that stamp consistently in the comparison runs; do not mistake a date-only difference for
  converter drift or silently accept other differences.
- No phase 2 work, branches, commits, merges or pushes have been started. Findings remain on `main`; nothing
  needs merging from this audit. The user picks the IDs before implementation.

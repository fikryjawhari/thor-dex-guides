# Delegated worker brief

The task adds findings, owned files, protected behaviour and exact checks. This reference supplies the defaults;
explicit task authorisation and provider-specific instructions still win.

## Setup
- Read AGENTS.md, CLAUDE.md, PROGRESS.md and the task's spec/findings before editing. Recheck affected code.
- Use the supplied fresh worker branch/worktree from the parent's accepted SHA. In T3 the parent binds it with
  workspace tools. Do not switch another checkout, create a top-level thread or edit the integration/main checkout.
- Other worktrees are read-only. Check both claim paths; do not overwrite another session's claim or dirty work.
- Run `python -I tools/worktree_setup.py [hack ...] --session <stable-name>`: claim, source junctions, `uv sync`.
  Sources are shared inputs, not worker-owned files; never edit them. Existing extract caches are the exception.
  Existing source copies are not replaced automatically. Ask before removing or replacing them.
- Run `uv run python -I tools/gate.py baseline <accepted-ref>` once before edits; record its SHA and path.
  `git archive` captures committed data/reports and builds HTML without switching checkouts or needing raw inputs.

## Work and gates
- Own only the task's files. No template/extract/data edits outside the stated scope. Raise shared-file conflicts.
- Keep each finding or coherent group small and independently testable. Introduce a helper, switch one caller and
  check, then the other. Do not leave a large rewrite without a working checkpoint.
- `uv run python -I tools/gate.py check [hack ...] --data` rebuilds data and compares it/report/counts with baseline.
- `uv run python -I tools/gate.py check --template` checks every guide after template work. With neither flag,
  the gate runs both halves. Add task-specific checks under `tools/scenarios/`; do not weaken existing checks.
- One browser sweep at a time, across worktrees too. Check running Node check commands before each standalone run;
  the gate checks before every browser command and fails on contention. Logs belong in `.tmp/<unit>/` and `.tmp/gate/`.
- Intended DOM/data changes need explicit acceptance, not a new baseline or `--ignore` used to hide failures.

## Commits and handover
- Commit locally only when authorised. Small commits, no trailers; `git status` first, stage files by name.
- Never commit `.claude/`, `.codex/` local state, `.tmp/`, `dist/`, `.src/`, secrets or raw author documents.
- Never push, merge, touch main or delete worktrees/branches without task authorisation. Ask before every push.
- On a usage limit: preserve files/logs; commit what works. If incomplete, label the checkpoint WIP and list failed
  or unrun checks and the exact next action. A WIP is not accepted or eligible to merge as finished work.
- Release only your claim: `python -I tools/worktree_setup.py --session <stable-name> --release`.
- Compact report: branch/path; commit SHAs and purpose; changed files; completed/deferred findings; exact gate
  commands, timings/results and log paths; breakage evidence where required; risks/blockers; what merges next.

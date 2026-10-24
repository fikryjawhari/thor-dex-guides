# Big jobs

One bounded implementation worker at a time; durable checkpoints, not chat history, are the recovery record.
Model/effort/runtime policy comes from current instructions. The cleanup's Opus/Sol/Sonnet exception is not a
global model permission. Do not infer quota from time/tokens or change the user's effort settings.

## Before kickoff
- Confirm selected/deferred findings, protected behaviours and actual base SHA. Recheck intervening changes.
- Bind an integration workspace using T3 workspace tools; preserve any uncommitted spec explicitly.
- Capture `gate.py baseline <base>` and record SHA/path. Check raw inputs and baseline gates first; a failing
  baseline is a blocker, not a regression. Keep sources, generated HTML and logs ignored.

## Units
| Order / IDs | Owned files / boundary | Dependencies | Required checks | Worker / status |
| --- | --- | --- | --- | --- |
| A | One independently testable change | Accepted base SHA | Data/template/scenarios | Task ID, branch, path |

Keep shared helpers and callers in the same unit. A second template owner waits. A helper conversion can have
separate working commits for introduction, first caller, second caller. Never make broken commits to meet a quota.

## Checkpoint ledger
| Unit | Status | Accepted SHA | Worker/task/branch/path | Checks, baseline and logs | Exact next action |
| --- | --- | --- | --- | --- | --- |
| Kickoff | pending | SHA | Identity | Commands and evidence | Bounded next unit |

Use pending / in progress / verified / blocked / deferred. A source commit alone is not verified. The orchestrator
reviews the bounded diff and evidence, integrates one worker at a time with authorisation, then updates the ledger
before starting the next. Prompts add findings/files/checks to `worker-brief.md`; workers read current affected code.
Optional scouts are read-only, narrowly bounded navigation aids, never authority to remove code or skip checks.

## Limits and recovery
- Check the provider UI when allowance is uncertain. Reserve room for integration/audit; promise no completion window.
- On a hard limit, stop duplicate work. Preserve worker checkout, dirty files, commits and logs; confirm it is stopped.
- Inspect durable Git state, not a missing/truncated response. Save incomplete work as a labelled WIP when authorised;
  record remaining changes, failed/unrun gates and next command. WIP is not an accepted integration checkpoint.
- Use a fallback model only if explicitly authorised and the remainder is small and diagnosed. Pass the original
  brief, findings, checkpoint, responses and unresolved objections; otherwise wait for quota reset.
- A new T3 child starts from committed state: transfer recovery commits and any dirty patch explicitly. A worktree
  path in a prompt does not bind it. Do not delete the original until its work is accounted for and deletion authorised.

## Acceptance
Run original data/DOM/scenario gates against the recorded baseline, including every guide and both modes after
template changes. Changing a checker cannot weaken its assertions. Prefer one bounded read-only review of the
integrated diff/evidence, not another whole-scope audit. Report verified/deferred units, final SHA, results/blockers
and what merges next. Keep the plan until built and merged, then move lasting rules to docs and delete the plan.

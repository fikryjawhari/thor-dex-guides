# Claude and Codex setup

## Copies added on 2026-10-23
- `CLAUDE.md` → `AGENTS.md`, with Codex workspace mechanics and no Claude model routing.
- Synced `rom-hack-offline-dex/SKILL.md` → `.agents/skills/rom-hack-offline-dex/SKILL.md`.
- Its `references/viewer-ui.md` → `.agents/skills/rom-hack-offline-dex/references/viewer-ui.md`.

The skill source is under `~/.claude/skills/synced/<bucket>/rom-hack-offline-dex/`. Originals remain unchanged.
The Codex copy uses this repo's extract → data.json → assemble.py pipeline, not the old hand-built guide workflow.
Current source precedence and the licensed calc-engine decision supersede the old skill's recommendations.

The repo's `.claude/` contained only worktree storage: no project hooks, settings, commands, agents or MCP config
to port. No worktrees, private history, credentials, caches or unrelated global skills are copied. Global Claude
settings remain untouched. No `.codex/config.toml` is needed or added; retain your Codex / T3 model, effort and
permissions. Claude's UI toggles and permissions are not portable Codex settings.

## Switching
- Start a fresh Codex session in this repo or its correctly bound worktree to pick up `AGENTS.md`.
  The skill lives under `.agents/skills/`; request it explicitly with `$rom-hack-offline-dex` when useful.
  If it is not listed, restart and verify the workspace; `AGENTS.md` also names its path for explicit reading.
- Use 6.1 sol for everything. There is no Claude model-selection gate, routing table or effort override.
- Claude continues to use its original instructions and synced skill.
- Read shared `PROGRESS.md`, plans and hack notes before resuming work; private chat history is not a handover.
  Check actual branches / worktrees too, since historical progress-log paths can be stale.
- Never share a worktree between active sessions. Check `.claude/claim` and `.codex/claim`; write `.claude/claim`
  so unchanged Claude instructions see Codex ownership. Include provider, session, branch and start time. Remove
  only your own marker; claims stay local. In T3 bind workspaces through its tools, not silent shell path changes.
- Leave a handover with branch, work, checks, feedback and next merge. Commit only when explicitly requested;
  every push needs a fresh yes naming the branch and changes.

## Maintenance
These are independent copies, not symlinks or automatic sync. Update both instruction files for shared rules,
keeping provider sections separate. Compare future Claude skill changes and deliberately port relevant updates;
do not overwrite newer repo paths and decisions with historical text. Shared state belongs in `PROGRESS.md`,
plans and hack notes so neither assistant depends on the other's private memory.

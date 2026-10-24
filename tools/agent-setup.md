# Claude and Codex setup

Both assistants work in this repo from the same shared files; neither depends on the other's private memory.
- `CLAUDE.md` (Claude Code) and `AGENTS.md` (Codex) are independent copies of the same rules, not symlinks. Codex's
  copy has its own workspace mechanics and uses one model throughout (no Claude model routing). **Change a shared
  rule in both.**
- The `rom-hack-offline-dex` skill lives in the repo at `.agents/skills/rom-hack-offline-dex/` (Codex loads it from
  there; request it with `$rom-hack-offline-dex`). Claude sessions load the claude.ai account copy, synced into
  `~/.claude/skills/synced/<bucket>/rom-hack-offline-dex/`: after changing the repo copy, re-upload it to claude.ai
  (zip with forward-slash paths). The repo copy is the one to edit.
- Shared state is `PROGRESS.md`, `plans/`, `template/README.md` and each hack's `notes.md`. Check the actual branches
  and worktrees too.
- Never share a worktree between active sessions. Both write `.claude/claim` (provider, session, branch, start time)
  so either sees the other; Codex also checks `.codex/claim`. Remove only your own claim.
- Leave a handover with branch, work, checks, feedback and next merge. Every push needs a fresh yes naming the branch
  and changes.

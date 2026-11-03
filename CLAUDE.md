# Thor Dex Guides

Offline, single-file dex guides for ROM hacks, built for Dex Viewer on the AYN Thor (app: sibling repo
`../thor-offline-viewer`, private) and usable in any phone browser. This repo is **public**, served by GitHub Pages.
Read PROGRESS.md at the start of every session (short); PROGRESS-DETAIL.md only for the section a line points to.

## Hard rules
- Every guide is ONE self-contained HTML file: CSS, JS, data and sprites inline, no network requests. Sharing happens
  at build time (`assemble.py` inlines the template); nothing moves into the app.
- Never commit raw docs from hack authors (xlsx, pdf, zips, ROM / romfs dumps): they live in `hacks/<hack>/.src/`
  (git-ignored), re-fetched with that hack's `SOURCES.md`.
- A published guide keeps its localStorage keys (`hack.json` → `cfg.ls`), walkthrough stop keys and trainer keys
  (`extract/trainer_keys.json`: entries only ever added; read the build report's trainer-keys lines on an update).
- The guide works at the viewer sizes (PROGRESS-DETAIL.md → Viewer sizes), especially 260 × 316, normal and `dvkb`.
  Full viewer contract: `.agents/skills/rom-hack-offline-dex/references/viewer-ui.md`.
- Saved state never stores a position in the data (an index into `M` / `MV` / `AB` / `P` / `LOC` / `TR` / `WK` /
  `IT`): it stores names (`nameOf` / `idxOf`) or stable keys (stop keys, trainer keys, append-only `AR` indexes), maps
  them back on load, says what happens when one is gone, and keeps loading older builds' formats. A new kind of saved
  state goes in `tools/scenarios/guide-update.mjs`'s snapshot.
- No explanatory or provenance text at the top of pages, in any guide. Credits go in the footer.
- Template changes are shared by every guide: after one, `assemble.py` and check every guide (`tools/domcompare.mjs`).

## Layout
- `template/`: shell.html, dex.css, dex.js, the damage calc (calc.js / calc.css, `calc/` engine, profiles, save
  readers; inlined only with `cfg.calc`). Emerald Imperium is the reference build. Its README: `hack.json` settings,
  what the data switches on, shared rules, page design (and what was rejected).
- `hacks/<hack>/`: hack.json (`cfg` = wording, storage keys, switches), data.json, sprites.json (only forms the shared
  set lacks), notes.md (build notes, schema), extract/ (scripts that make data.json), SOURCES.md.
- `sprites/`: the shared set (pokeemerald-expansion; README: key scheme). `tools/`: fetchers, extract helpers, checks
  (README). `tools/mockup/`: the Thor frame and page checks. `plans/`: work not done yet only. `dist/`: built output
  (git-ignored; the Pages workflow builds it).

## Commands
- Build: `python assemble.py [hack]` (stdlib only: the Pages workflow runs it bare).
- Python env: `uv sync` once per machine, then `uv run python -X utf8 -I tools/<script>` (`-X utf8`: `-I` ignores
  `PYTHONUTF8`, and a redirected print of `♂` dies in cp1252). Need a package: `uv add <name>`, commit `pyproject.toml`
  + `uv.lock`; don't work around it.
- Checks: the `verify` skill (`.agents/skills/verify/SKILL.md`) says what to run for a change. The gate:
  `uv run python -X utf8 -I tools/gate.py check [hack ...]` / `scenarios [hack ...] [--only a,b]` / `lint [--fix]`;
  browser checks run 8 at once, failures rerun alone, and passes are cached by content (an unchanged guide costs
  nothing; `--fresh` reruns). Intended changes are declared, not hand-diffed: `--accept-data` / `--accept-routes` or
  `.tmp/accept.json` (`tools/README.md` → Gate).
- Git Bash: prefix commands that take `/`-paths with `MSYS_NO_PATHCONV=1`.

## Checks: who runs what
- Run a check only when no later work in the job changes what it covers. While working: the scenarios the change
  touches, on the guides it touches (`gate.py scenarios <hack> --only ...`). The full gate once, at the end.
- **The full gate belongs to whoever merges last.** A dispatched agent whose branch the parent will merge and audit
  runs only its targeted checks and reports them; it does not run `gate.py check` on every guide. The parent runs the
  full gate once, after the last merge into the branch it is finishing. (Unchanged guides come from the cache.)
- A failure names its check and leaves a screenshot in `.tmp/calc-checks/` and logs in `.tmp/gate/<stamp>/`.
  Unclear cause: bisect the job's commits with that one scenario on that one guide.
- Don't wait silently on another session's browser run: the gate refuses to start while one runs; say so.

## Making a new guide
The main chat writes the unit list (`plans/<hack>.md`, one unit per step / tab, with the sibling hack's script to
adapt); agents build the units. The procedure: `.agents/references/new-guide.md` (sources: `new-guide-sources.md`).

## Git
- Worker setup: `python -X utf8 -I tools/worktree_setup.py [hack ...] --session <name>` (`--release` removes your
  claim): claims, links each hack's `.src` and `.tmp/item-icons` from the main checkout (hzla clones:
  `--repo <main>/.tmp/hzla...`), `uv sync`, `npm ci` for `tools/calc` when it has no node_modules.
- Parallel work: a branch in a worktree (Claude Code: `.claude/worktrees/<name>`, git-ignored), merged into `main` when
  done. One session at a time edits on `main`.
- `git status` before committing; stage files by name, never `git add -A`; never commit anything under `.claude/`.
- Pushing `main` publishes the site: push only checked guides. Push working branches to `origin` often as a backup
  (after a finished step or a few commits). **Ask me before every push, every time**: name the branch and what's new.
- This clone's `.git/config` sets `core.sshCommand` to Git Bash's `ssh.exe` (Windows OpenSSH hangs after a push
  without a terminal); a fresh clone that hangs needs the same.

## Parallel sessions
Git stops only on lines both branches changed, so split work by files.
- A session owns its tab's extract script(s) and its tab's heading in `notes.md` / `PROGRESS.md`. Shared extract code
  (`common.py`, `build.py`): add freely; raise changes to existing code first.
- `template/` is one session at a time; a second piece needing it waits for the merge or joins that session.
- `data.json` and `dist/` are build output: on a conflict take either side, rerun the extract's `build.py` and
  `assemble.py`; never merge by hand.
- Merge one branch at a time (merge, rebuild, check, then the next); then delete its worktree and branch, local and
  `origin`. If I propose parallel work that breaks this, say so and suggest an order or split first.

## Where a session works
Decide from my prompt, say it in one line ("working in X because Y"), then start. One session per worktree.
- **Start order:** (1) work out the job; find its guide branch and read the job's files from it with
  `git show <branch>:<path>`. (2) **Model check** against Which model: weaker than needed, say so and stop until I
  switch or say go on; stronger, say which would do and carry on. (3) Busy check, claim, enter, work.
- **Guide branch**: the branch ahead of `main` touching `hacks/<hack>/` (usually `worktree-<hack>`). None: `main` is
  the base. Two: ask.
- **Routing:** new hack → `worktree-<hack>` from `main` (first say if a guide branch with unmerged `template/` changes
  exists: merge it first). One guide's tab / fix / spec build → its guide branch, or a tab branch off it if another
  session is there. A change for every guide → `worktree-<thing>` from `main` (say if unmerged `template/` changes
  exist). Questions / planning: no branch. Small CLAUDE.md / PROGRESS.md edits: `main`, if nobody else is. Nobody
  builds on `main`.
- **Busy check:** a `.claude/claim` (session, start time) means it's held: say who and since when and ask (over a day
  old is probably crashed; still ask). Mention uncommitted changes. Write your claim on entry, delete it when done.
- **Tab branch:** `git worktree add -b worktree-<hack>-<tab> .claude/worktrees/<hack>-<tab> <guide branch>`, copy the
  guide worktree's `.src/`, enter by path. Uncommitted guide-worktree changes don't carry over: say so. Touch only the
  tab's files; template changes are flagged and done in the guide branch. `git merge <guide branch>` for newer commits.
- **Merge order:** tab → its guide branch (one at a time, rebuild and check after each) → `main`. Never a tab into
  `main` while its guide branch is unmerged. End a session by saying which branch the work is on and what merges next.

## Workflow
- References (`.agents/references/`): worker-brief, spec-skeleton, big-job, calc-mechanics, calc-save-reader,
  new-guide, new-guide-sources, prompt-writing (prompts and briefs: big jobs goal first, small ones task first with
  the end goal named).
- I test on the Thor (PROGRESS-DETAIL.md → Testing on the Thor).
- UI changes: mockup first, a plain interactive page at the viewer's real size, then build.
- **Showing pages to me:** `python -X utf8 -I tools/preview.py <page.html> [name.html]` puts it on the phone preview (my
  tailnet; `tools/README.md` → Phone preview) and prints the link; give me the link (same name = same link).
  Thor frame: `python -X utf8 -I tools/mockup/thor-frame/build.py <page.html> <out.html> [--title] [--sub]
  [--panel]` (or `preview.py ... --frame`); mockups write only the inner page (and an optional `--panel`), never a frame.
- **Complex UI work goes in steps, each its own small context:** (1) *Decide*: a Sol session I talk to (Haiku xhigh
  when Sol is low), cheap mockups with sampled data in the Thor frame, every behaviour settled, spec to
  `plans/<thing>.md` (what goes, each control in every state, edge cases, checks); no template / extract changes.
  (2) *Build*: the Opus main chat reads the spec and dispatches agents (or builds it if the spec is "this code here");
  ends with the guide in the Thor frame on the phone preview. (3) *Fix* after my tests. (4) *Audit*: the full gate,
  once, by whoever merges last (Checks above). Template builds one at a time; decide steps can run in parallel.
- **A plan built and merged is deleted.** Lasting decisions go in `template/README.md` or the hack's `notes.md`,
  status in PROGRESS.md; git keeps the plan.
- **Which model** (Sol, Haiku, Opus; no Sonnet):
  - Opus medium: the main chat (spec builds, fixes after my tests, merges, branch picking, dispatching), a new hack's
    first build, anything unclear or crossing data rules, agent jobs Haiku can't do.
  - Sol (`gpt-6.1-sol` via T3 `delegate_task`): first choice for dispatched agents and decide sessions. I say when my
    Sol usage is low.
  - Haiku medium for mechanical jobs (audits, extract rules, notes, ingestion); xhigh only when Sol is low and the job
    stays under 100k context (split bigger jobs).
  - Effort medium unless I say; Opus low for question / analysis / docs sessions. High / xhigh only for short,
    reasoning-heavy jobs (thinking stays in context and is re-read every request).
  - Agents commit after each working sub-step (`WIP:` when incomplete). Brief one unit ending at a commit, ~60-80
    requests / 150k context (Haiku 100k); more work = more agents in sequence, each given the last commit and a short
    findings note.
  - Main chat past ~120 requests or ~250k context: at a natural break write the handover in PROGRESS.md and start fresh.
- Moving to a new session: update PROGRESS.md for a fresh session, commit, delete your `.claude/claim`.

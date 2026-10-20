# Thor Dex Guides

Offline, single-file dex guides for ROM hacks, built for Dex Viewer on the AYN Thor (the app lives in the sibling repo
`../thor-dex-viewer`, private) and also usable in any phone browser. This repo is **public** and served by GitHub
Pages. Status, decisions and history: PROGRESS.md. Read it at the start of every session.

## Hard rules
- Every guide stays ONE self-contained HTML file: all CSS, JS, data and sprites inline, no network requests. Sharing
  happens at build time (`assemble.py` inlines the template); nothing moves into the app.
- Never commit raw docs from hack authors (xlsx, pdf, zips, ROM or romfs dumps). They live in `hacks/<hack>/.src/`
  (git-ignored) and are re-fetched with that hack's `SOURCES.md`.
- Keep each hack's localStorage keys (`hack.json` → `cfg.ls`) once a guide is published: changing one throws away
  people's saved trackers, checklists and positions.
- The guide must work at the viewer sizes (PROGRESS.md → Viewer sizes), especially 260 × 316, in normal and `dvkb` mode.
  The full viewer contract is the `rom-hack-offline-dex` skill's `references/viewer-ui.md`.
- Template changes are shared by every guide: after one, run `assemble.py` and check every guide, not just the one
  you were working on (`tools/domcompare.mjs` shows exactly what changed).

## Layout
- `template/` shell.html, dex.css, dex.js: the one template (Emerald Imperium is the reference build).
- `hacks/<hack>/` hack.json (title, version, `cfg` = wording, storage keys, feature switches), data.json (`#data`),
  sprites.json (only forms the shared set lacks), notes.md (build notes and schema), extract/ (the scripts that made data.json), SOURCES.md.
- `sprites/` the shared sprite set (pokeemerald-expansion, 64×64, `png/<key>.png`; README has the key scheme,
  SOURCES.md the pin and credits).
- `tools/` source fetchers and extract helpers (README), `domcompare.mjs`, `mockup/` (page snapshots for mockups, the
  walkthrough check). `plans/` work not done yet, plus `split-ui.md` (the collapsible-page design, done for the
  walkthrough, next for the other pages).
- `dist/` built output (git-ignored); the Pages workflow builds and deploys it.

## Commands
- Build all: `python assemble.py` (or `python assemble.py <hack>`). Stdlib only (the Pages workflow runs it bare).
- Python env for tools and checks: `uv sync` once per machine (`pyproject.toml` + `uv.lock` are committed), then
  `uv run python -I tools/<script>`. Need a package? `uv add <name>` and commit both files; don't work around it.
- Compare two builds route by route: `node tools/domcompare.mjs <old.html> <new.html> [--kb]` (headless Chrome;
  options `--routes`, `--jobs`, `--ignore` in its header). Runs can go in parallel.
- In Git Bash, prefix commands that take `/`-paths as arguments with `MSYS_NO_PATHCONV=1`.

## Making a new guide
1. Fetch the sources into `hacks/<hack>/.src/` with its `SOURCES.md` (3DS hacks also need the user's vanilla romfs
   dumps: `plans/romfs-extraction.md`). Update its "Fetched" line and the source log in `tools/README.md`.
2. Write `hacks/<hack>/extract/` scripts that turn them into `hacks/<hack>/data.json`, in the schema in
   `hacks/emerald-imperium/notes.md` (DATA SCHEMA). Optional parts the template shows when present are listed in
   PROGRESS.md → Split results (tutor moves, trades, game docs...). Write it one entry per line like the existing ones.
   For hacks with public source code, the code wins over the docs ("Sheet says ..." on differences).
3. `hacks/<hack>/hack.json`: copy an existing one; new localStorage prefix in `cfg.ls`, the hack's wording in
   `cfg.txt`, feature switches. `notes.md`: sources, data rules and conflicts, like the existing ones.
4. Sprites: every guide uses the shared set (`sprites/README.md`); keys are worked out from dex number and name.
   `python -I tools/sprite_keys.py <hack>` lists the forms it matched (check once) and the species it couldn't place:
   those are the hack's own additions and go in its `sprites.json`, the only art a hack keeps. `assemble.py` lists
   species with no sprite; they show as a type-coloured circle with the name's first letter.
5. `python assemble.py <hack>`, then check `dist/<hack>.html` at 260 × 316 and maximised, normal and `dvkb` mode
   (headless Chrome over CDP, or on the Thor), and that every route renders without errors.

## Git
- Parallel work goes on a branch in a worktree. Claude Code creates them in `.claude/worktrees/<name>` (git-ignored);
  merge into `main` when done. Only one session at a time edits on `main`.
- Run `git status` before committing and stage files by name, not `git add -A`; never commit anything under `.claude/`.
- Pushing to `main` publishes the site (the Pages workflow), so push only checked guides.
- Push working branches (guide and tab branches) to `origin` often, as a backup: after each finished step or a few
  meaningful commits. It publishes nothing (only `main` deploys), and it keeps unmerged work off this PC alone (the
  agents view also refuses to delete a session whose worktree has unpushed commits). **Ask me before every push, every
  time**: name the branch and what's new since the last push, and push only on a yes.
- Pushing from a session: this clone's `.git/config` (not committed) sets `core.sshCommand` to Git Bash's `ssh.exe`,
  because the global Windows OpenSSH one hangs after the push when git runs without a terminal. A fresh clone that
  hangs on push needs the same setting.

## Parallel sessions
Git merges change by change and only stops on lines both branches changed, so split work by the files it touches.
- One worktree per independent piece. Which branch it comes from: Where a session works (below).
- A session owns its files: its tab's extract script(s), and its tab's heading in `notes.md` / `PROGRESS.md`. Shared
  extract code (`common.py`, `build.py`): add to it freely; changing existing code is something to raise first.
- `template/` is one session at a time, since it is shared by every guide. A second piece that needs template changes
  waits until the first is merged, or goes in the same session.
- `data.json` and `dist/` are build output: on a merge conflict take either side, then rerun the hack's extract
  `build.py` and `assemble.py`. Never merge them by hand.
- Merge one branch at a time: merge, rebuild, check the guides (`domcompare` if the template changed), then the
  next. After a merge, delete the worktree and the branch, local and on `origin`.
- If I propose parallel work that breaks these (two sessions on the template or the same script), say so and suggest
  an order or a split before starting it.

## Where a session works
Decide from my prompt, say it in one line ("working in X because Y"), then start. One session per worktree.
- **Start order** (before any edit):
  1. Work out the job from my prompt. Find the guide branch (below) and read the files the job is about straight
     from it, without entering: `git show <branch>:<path>` (the spec, the plan's heading, PROGRESS.md).
  2. **Model check**, now that you know the job: compare it with Which model (Workflow). If I picked a weaker model
     than the job needs, say so and stop until I switch (`/model`) or say go on. If I picked a stronger one than it
     needs, say which would do and carry on unless I switch. One line either way when it fits.
  3. Busy check, claim, enter the worktree (or make the tab branch), then work.
- **A hack's guide branch**: the branch ahead of `main` whose commits touch `hacks/<hack>/` (`git worktree list`,
  `git branch`, `git log --oneline main..<branch>`), usually `worktree-<hack>...`. None: `main` is the base. Two: ask.
- **Routing:**
  - New hack ("let's move on to X"): new guide branch `worktree-<hack>` from `main`; the first build happens there,
    one step after another. First say if a guide branch with `template/` changes is unmerged (merge it first, so the
    new guide starts with them).
  - A tab or change for one guide (review feedback, a decide session, a spec build, template changes that came out of
    that guide's pass): its guide branch if it's free; a tab branch off it only if another session is working there.
  - A change for every guide, not tied to one guide's pass (search, the damage calc): its own branch
    `worktree-<thing>` from `main`. Say if a guide branch with unmerged `template/` changes exists (conflict risk).
  - Questions, reading, planning: no branch. Small edits to CLAUDE.md / PROGRESS.md: on `main` if nobody else is.
  - Nobody builds on `main`: it takes merges and doc edits only.
- **Busy check** before entering a worktree: a `.claude/claim` file in it (session name, start time) means another
  session holds it: say who and since when and ask before going in (older than a day is probably a crashed session;
  still ask). Mention uncommitted changes there too. Write your own claim on entry; delete it when you finish or hand
  over.
- **Tab branch**: `git worktree add -b worktree-<hack>-<tab> .claude/worktrees/<hack>-<tab> <guide branch>` (a short
  hack name is fine: `ps-items`), copy `hacks/<hack>/.src/` from the guide worktree (git-ignored), enter it by path
  before any edit. Uncommitted changes in the guide worktree don't carry over: say so. Touch only the tab's files (its
  extract script, mockups, `plans/<hack>-<tab>.md`, its own heading in notes / PROGRESS / the plan); a template
  change is flagged and done in the guide branch. `git merge <guide branch>` when you need its newer commits.
- **Merge order**: tab into its guide branch, one at a time (rebuild data.json and dist after each, check), then the
  guide branch into `main`. Never a tab into `main` while its guide branch is unmerged. Finish a session by saying
  which branch the work is on and what merges next.

## Workflow
- I test on the Thor. Testing a guide there without the library: PROGRESS.md → Testing on the Thor.
- UI changes: mockup first as a plain interactive HTML artifact at the viewer's real size, then build it.
- **Complex UI work (several linked decisions) goes in steps, each its own small context** (trial since 2026-10-20;
  revise it, and add workflows for other kinds of work, once a few runs show what works):
  1. *Decide* (a Sonnet session the user talks to directly, in a worktree): cheap mockups only (a small standalone
     page with sampled data from data.json, not the full build), wrapped in the Thor frame. Settle every behaviour,
     then write the spec to `plans/<thing>.md`: what goes, what each control does in every state, edge cases, checks.
     Example: `plans/trainers-show-switch.md`. No template or extract changes in this step.
  2. *Build* (the Opus main chat reads the spec, then dispatches a Sonnet subagent in the worktree for template / UI
     logic, or a Haiku one for mechanical work: extract rules, notes; or builds it itself if the spec is already
     "this code in this place"). The build ends with the guide in the Thor frame published for the user.
  3. *Fix* in the main chat (the user's feedback after testing on the phone / Thor).
  4. *Audit* (a Haiku subagent): `assemble.py`, `domcompare` against main, the viewer-size checks, scenario runs from
     the spec; reports pass / fail with evidence.
  Template builds are one at a time (Parallel sessions); decide steps can run in parallel.
- **Which model** (the session's own; agents it dispatches pick theirs, step 2 above):
  - Opus: building a spec, fixing after my tests, merges, anything that picks branches or dispatches agents; a new
    hack's first build; anything unclear or touching data rules across tabs.
  - Sonnet: decide sessions (mockups and specs with me); a small, fully specified change to one tab's extract script.
  - Haiku: never a session I start; only agents an Opus session dispatches (audits, mechanical jobs).
  - Effort: medium unless I say otherwise.
- **Thor frame** (`tools/mockup/thor-frame/`, on the Photonic Sun branch until it merges): `python -I tools/mockup/thor-frame/build.py <page.html> <out.html>
  [--title] [--sub] [--panel]` wraps a built guide or a mockup's inner page in a Thor-sized screen (the viewer sizes,
  fit to screen, dvkb, tabs, reload / clear saved state, error and width readout; pinned on a phone). Publish the
  output as an artifact. Mockups write only the inner page (and an optional `--panel` of options), never a frame.
- When I say I'm moving to a new session, update PROGRESS.md with what a fresh session needs, commit, and delete
  your `.claude/claim`.

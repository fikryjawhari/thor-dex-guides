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

## Workflow
- I test on the Thor. Testing a guide there without the library: PROGRESS.md → Testing on the Thor.
- UI changes: mockup first as a plain interactive HTML artifact at the viewer's real size, then build it.
- **Complex UI work (several linked decisions) goes in steps, each its own small context:**
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
- **Thor frame** (`tools/mockup/thor-frame/`): `python -I tools/mockup/thor-frame/build.py <page.html> <out.html>
  [--title] [--sub] [--panel]` wraps a built guide or a mockup's inner page in a Thor-sized screen (the viewer sizes,
  fit to screen, dvkb, tabs, reload / clear saved state, error and width readout; pinned on a phone). Publish the
  output as an artifact. Mockups write only the inner page (and an optional `--panel` of options), never a frame.
- When I say I'm moving to a new session, update PROGRESS.md with what a fresh session needs.

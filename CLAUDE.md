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
  sprites.json (own art), notes.md (build notes and schema), extract/ (the scripts that made data.json), SOURCES.md.
- `sprites/` the shared standard sprite set (not chosen yet; see its README for the key scheme).
- `tools/` source fetchers and extract helpers (README), `domcompare.mjs`. `plans/` work not done yet.
- `dist/` built output (git-ignored); the Pages workflow builds and deploys it.

## Commands
- Build all: `python assemble.py` (or `python assemble.py <hack>`). Stdlib only.
- Compare two builds route by route: `node tools/domcompare.mjs <old.html> <new.html> [--kb]` (headless Chrome).
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
4. Sprites: the hack's own art in `sprites.json` (keyed by its species ids), else the shared set once it exists
   (`sprites/README.md`). `assemble.py` lists species with no sprite; they show as blank squares.
5. `python assemble.py <hack>`, then check `dist/<hack>.html` at 260 × 316 and maximised, normal and `dvkb` mode
   (headless Chrome over CDP, or on the Thor), and that every route renders without errors.

## Workflow
- I test on the Thor. Testing a guide there without the library: PROGRESS.md → Testing on the Thor.
- UI changes: mockup first as a plain interactive HTML artifact at the viewer's real size, then build it.
- When I say I'm moving to a new session, update PROGRESS.md with what a fresh session needs.

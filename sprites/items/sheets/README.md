# Per-guide item sheets

Rebuild with `uv run python -I tools/item_sheets.py [hack ...]`; verify reproducibility with
`uv run python -I tools/item_sheets.py --check [hack ...]`. Commit both the PNG and JSON for each guide.

These sheets are generated from the verified shared `../png/` icons and `../index.json`, without raw sources or
network access. Each is 16 columns of 24 px cells, quantised to a 256-colour palette with transparency. Canonical
art keys are sorted; aliases share a slot. Pillow is needed only when regenerating, not by `assemble.py` or Pages.
The manifest records the slot-ordered keys and source/sheet SHA-256 hashes. Assembly rejects stale artefacts with
the rebuild command instead of silently drawing the wrong icon after an inventory, lookup or artwork update.

Assembly inventories real IT rows (not NPCs/tutors), P.hi/P.stone, trainer/partner/normal-team held items, MI.i,
walkthrough stop it rows and no-place pickups. It resolves guide-specific names first, then shared names and
identical-art aliases, following `../README.md`. Exact displayed names become the built guide's `D.IC` slot map.
Missing names have no entry. Every build reports distinct icons, mapped names, missing names and PNG bytes.

The sheet is inlined once as `--item-sheet`; `--item-rows` gives its height in cells. No page uses it yet.

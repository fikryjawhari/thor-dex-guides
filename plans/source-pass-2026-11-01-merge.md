# Handoff: merge the 2026-11-01 source pass (Hardlove 0.8.6, Heartfelt Gold v1.0.0)

The work is done and committed on two branches; what's left is merging them into `main`, rebuilding Hardlove there,
checking it, and (on the user's yes) pushing so the live Hardlove guide updates. Opus medium is enough. Start after the
move-pages work (`worktree-move-pages`, claimed by `item-pages-build`) is merged or the user says go: it touches
`hacks/hardlove-gold/` heavily and reads Hardlove's `.src` through a junction to the main checkout.

| Branch (worktree) | Commits | What |
| --- | --- | --- |
| `worktree-heartfelt-gold` (`.claude/worktrees/heartfelt-gold`) | 2 | `hacks/heartgold-retiled` renamed `hacks/heartfelt-gold`, new SOURCES.md / watch.json for v1.0.0 (no guide, no data.json); doc renames in PROGRESS, tools/README, check_updates.py, readers README; EI watch.json accepted (hzla backup index only); PROGRESS → Open 6 |
| `worktree-hardlove-086` (`.claude/worktrees/hardlove-086`) | 2 | Hardlove 0.8.6: watch.json pin `4af49f7a8c` + accepted state, hack.json version, data.json / report.txt / trainer_keys.json rebuilt, calc_states.json / calc_matchups.json move and ability indices remapped by name, notes / SOURCES / tools README / PROGRESS line 11 |

What changed in the game and why: `hacks/hardlove-gold/notes.md` → History (2026-11-01) and
`hacks/heartfelt-gold/SOURCES.md`.

## 1. Heartfelt Gold first (docs only)

1. On `main`: `git merge worktree-heartfelt-gold`. Possible conflicts: PROGRESS.md, tools/README.md (other merges
   edit them too): keep both sides' content.
2. Move its raw sources (git-ignored). The main checkout still has the old `hacks/heartgold-retiled/.src/`; the
   worktree holds the v1.0.0 fetch with that old copy inside it as `v6.12.1/`. Check
   `.claude/worktrees/heartfelt-gold/hacks/heartfelt-gold/.src/v6.12.1/` exists, then move the worktree's `.src` to
   `hacks/heartfelt-gold/.src` in the main checkout and delete the empty-of-tracked-files `hacks/heartgold-retiled/`.
3. `uv run python -I tools/check_updates.py heartfelt-gold`: all three sources unchanged (or report what moved).

## 2. Hardlove 0.8.6

1. **Sources first.** The worktree has a private (not junction) `hacks/hardlove-gold/.src` at 0.8.6; main's is still
   0.8.5 (`repos/hardlove/COMMIT` = `64838bf7db...`). Copy the worktree's over main's:
   `cp -r .claude/worktrees/hardlove-086/hacks/hardlove-gold/.src/. hacks/hardlove-gold/.src/` and check
   `hacks/hardlove-gold/.src/repos/hardlove/COMMIT` reads `4af49f7a8cc929aaecee77636f74c5729f89a1df`.
   Any worktree still open with a junction to it (move-pages ones) now sees 0.8.6 and its Hardlove `build.py` refuses
   until it merges `main`: say so if one is still open.
2. `git merge worktree-hardlove-086`. Conflicts: `data.json`, `extract/report.txt` → take either side and rebuild
   (step 3); notes.md / SOURCES.md / PROGRESS.md → keep both sides' text (0.8.6 pin lines from this branch). If
   move-pages has merged, its SOURCES.md paragraph about `data/text/221.txt` / `222.txt` "not in watch.json, fetch by
   hand" stays: this branch added both files to the re-fetch loop, so trim that sentence to match.
3. Rebuild: `uv run python -I hacks/hardlove-gold/extract/build.py`, then
   `uv run python -I hacks/hardlove-gold/extract/check.py` (no baseline argument: with the 0.8.5 baseline it stops at
   the species / table-order asserts by design, since Butterfree and Quaxwell were added and Quaxly removed).
   `git diff hacks/hardlove-gold/extract/trainer_keys.json` must show no removed or renamed keys.
4. Calc fixtures. `cd tools/calc && npm ci` (if `node_modules` is missing), then `node state_check.mjs hardlove-gold`
   (expect 800 pass) and `node hardlove_check.mjs` (expect 107 passed). The fixtures hold M / AB indices, and M / AB
   are in first-use order, so if the merged extract (move-pages changes) orders them differently from this branch's
   build, many fail at once. Then remap from this branch's data to the new build, in place (keeps formatting):

   ```bash
   git show worktree-hardlove-086:hacks/hardlove-gold/data.json > .tmp/hl-fixtures-base.json
   uv run python -I - <<'EOF'
   import json, re
   a = json.load(open('.tmp/hl-fixtures-base.json', encoding='utf-8'))
   b = json.load(open('hacks/hardlove-gold/data.json', encoding='utf-8'))
   def occ(names):  # (name, nth occurrence): AB repeats some names
       seen, out = {}, []
       for n in names:
           seen[n] = seen.get(n, 0) + 1; out.append((n, seen[n]))
       return out
   def table(old, new):
       pos = {k: i for i, k in enumerate(occ(new))}
       return {i: pos[k] for i, k in enumerate(occ(old))}
   MV = table(a['M'], b['M']); AB = table([x[0] for x in a['AB']], [x[0] for x in b['AB']])
   for f in ('calc_states', 'calc_matchups'):
       p = f'hacks/hardlove-gold/{f}.json'; t = open(p, encoding='utf-8', newline='').read()
       t = re.sub(r'"mv": (\d+)', lambda m: f'"mv": {MV[int(m[1])]}', t)
       t = re.sub(r'"ab": (\d+)', lambda m: f'"ab": {AB[int(m[1])]}', t)
       open(p, 'w', encoding='utf-8', newline='').write(t)
   EOF
   ```
   Rerun both checks; they must pass before going on.
5. `python assemble.py` (all guides), then `uv run python -I tools/gate.py scenarios hardlove-gold --jobs 8` (31/31
   passed on the branch). No template change, so no domcompare needed. If move-pages merged in between, run its own
   checks as its handover says.
6. `uv run python -I tools/check_updates.py hardlove-gold`: unchanged, except "Documentation dates" if the author
   edited a sheet since (the Trainer Battles sheet was edited 2026-11-01, ahead of the code; a newer edit means
   re-download with `tools/drive_ls.py` per SOURCES.md, rebuild, and look at report.txt's "sheet says" lines). If
   `beta_hardlove` has moved past `4af49f7a8c` with a new Drive patch, that's 0.8.7: stop and tell the user.

## 3. Finish

- Ask the user before pushing `main` (name what's new since the last push: these two merges plus whatever else is
  unpushed). After the Pages Action deploys, the user updates Hardlove on the Thor (long-press → Update from link).
- Delete both worktrees and branches (`git worktree remove`, `git branch -d`; neither was pushed to `origin`).
- Delete this plan; PROGRESS.md → Current status / Open 6 to match (the branch names in Open 6 go).

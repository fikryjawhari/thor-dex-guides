# Sprite branch checks (runbook for a Claude session)

Written 2026-10-19 for a session on the user's PC, which has a fresh clone and nothing else set up. The user asks
for "the sprite checks" and expects this to be done end to end; they only step in for the Thor look and the merge.
Context: PROGRESS.md → "Sprite branch handover" (this is its step 2) and "Shared sprite set results".

## What is being checked

Branch `worktree-sprites` gives both guides (Emerald Imperium, Hardlove Gold) the shared sprite set, a box-fill crop,
a no-sprite placeholder circle and black text on light type tags. `main` has none of that. Render every route of both
guides, built from `main` and from the branch, in normal and keyboard (`dvkb`) mode, and confirm the only DOM changes
are the expected ones and no page throws an error. CSS changes (crop, placeholder style) are not covered by this; the
Thor look covers them.

Expected differences:
- Type tags on the nine light types get a `bt` class (`<span class="ty bt" ...>`). Removed with `--ignore=" bt"`.
- Sprites are `blob:` URLs and compare equal, so swapped art does not show. A species that had **no** sprite on `main`
  and has one now shows as old `<div class="spr ...">` without a style, new with `style="background-image:url(blob)"`.
  Expected, but list which ones.

Not expected (report and stop): a `sprph` (placeholder circle; `assemble.py` reports full coverage, so none should
render), any other markup change, any page error in the new build, a route that renders only in one build.

## 0. Machine setup (once, on a new clone)

The user only cloned the repo. Check, and tell the user what is missing rather than installing silently:
- `git`, `python` (3.10+, stdlib only), `node` (22+: `node --version`), Chrome or Edge in the usual Windows paths (else
  set `CHROME` to its exe), `gh` (logged in: `gh auth status`) for pushing.
- Repo-local git identity, required before any commit (the repo is public; never the user's Gmail):
  `git config user.name "Fikry Aljawhari"` and
  `git config user.email 110322959+fikryjawhari@users.noreply.github.com`.
- The laptop's Claude memory does not exist on the PC. Everything needed is in CLAUDE.md, PROGRESS.md and here.
- In Git Bash, prefix commands that take `/`-paths (like `--routes=#/p/1`) with `MSYS_NO_PATHCONV=1`.

## 1. Worktree for the branch

From the repo root (the clone already has `origin/worktree-sprites`):
`git worktree add .claude/worktrees/sprites worktree-sprites`, then enter it (EnterWorktree with that path). Work
only there; leave the main checkout on `main`. If the worktree already exists, `git -C <it> pull` instead.

## 2. Build both sides

- Branch: `python assemble.py` in the worktree. Expect
  `emerald-imperium: ... 1275 species, 1275 sprites (1247 shared, 28 own)` and
  `hardlove-gold: ... 986 species, 986 sprites (986 shared, 0 own)`, and no "no sprite" list.
- Baseline from `main`, outside the repo (e.g. the job's tmp dir): make an empty folder `<base>`, then
  `git archive main | tar -x -C <base>` and `python <base>/assemble.py`. Output lands in `<base>/dist/`.

## 3. Smoke test the tool (a minute)

`node tools/domcompare.mjs <base>/dist/emerald-imperium.html <base>/dist/emerald-imperium.html --routes=#/a/`
must print `differing routes: 0` and exit 0. If not, fix the tool before trusting anything below.

## 4. The four runs

Run from the worktree, each in the background, capturing output to a file:

```
node tools/domcompare.mjs <base>/dist/emerald-imperium.html dist/emerald-imperium.html --ignore=" bt"
node tools/domcompare.mjs <base>/dist/emerald-imperium.html dist/emerald-imperium.html --ignore=" bt" --kb
node tools/domcompare.mjs <base>/dist/hardlove-gold.html    dist/hardlove-gold.html    --ignore=" bt"
node tools/domcompare.mjs <base>/dist/hardlove-gold.html    dist/hardlove-gold.html    --ignore=" bt" --kb
```

Each picks its own port, so they can run at once. Each run opens `2 × --jobs` tabs (default jobs = CPU threads / 4).
Keep the total tabs over all runs at or under the thread count: with 16 threads run all four with `--jobs=2`, or two
at a time with the default. More tabs than cores made it slower on the laptop and the PC (4 jobs beat 6 and 8 for one run; tools/README.md → Timing). Note
the "swept in" times for PROGRESS.

## 5. Read the results

Each run prints: routes and chunks, sweep time, `no hashchange` and `never settled` counts (both should be 0; a few
are fine if those routes are not flagged), page errors for old and new (new must be 0; old errors are `main`'s and
worth a note), routes flagged by the sweep, how many were identical on a fresh load (sweep noise, fine), and the
routes still differing, with the first difference of `SHOW` of them (default 2).

Exit 0 = pass. For exit 1, classify every still-differing route:
- `SHOW=10` (or more) on a rerun narrowed with `--routes=#/p/` etc. shows more first differences; recheck one route
  alone with `--routes==#/exact/route`.
- If a whole class differs for an expected reason (say, the species that gained sprites), add another `--ignore`
  only when the regex removes exactly that and nothing else, and say so in PROGRESS.
- Anything unexpected: stop, write it up for the user (route, old vs new excerpt), don't patch the template on your
  own unless the cause is clear and small, and in that case rebuild and rerun the affected guide.

## 6. Record and hand back

- PROGRESS.md → "Sprite branch handover": mark step 2 done with the date, per guide and mode the route count, sweep
  time, flagged / noise / differing counts and anything learned. Update "What's left" if it changes.
- Commit in the worktree (stage files by name, never anything under `.claude/`, no `dist/`) and
  `git push origin worktree-sprites`. **Do not push or merge to `main`**: pushing `main` publishes the site.
- Tell the user step 3 is theirs: look on the Thor at 260 × 316, normal and `dvkb` (PROGRESS.md → Testing on the
  Thor; a session can drive it over CDP if the Thor is plugged in). After they OK it, merge the branch into `main`
  and push (that deploys Pages; check the Action run and the live `guides.json` afterwards), then remove the
  worktree.

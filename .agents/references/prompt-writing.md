# Writing prompts and briefs

For session prompts the user asks for, and the briefs the main chat gives agents. Adapted from George Moreas,
"Altitude, depth, range" (2026-10-22, after Felix Rieseberg's "How to be more ambitious"): ambition changes the
scope, method or viewpoint of the work, not only how fast it gets done.

## Size decides the shape
- **Big jobs** (a new guide, a feature for every guide, a new save family, anything that takes several units or
  sessions): write them **goal first**. Say what should exist and be true at the end, for whom, and how we'll know.
  Then cover the four dimensions below. Tasks follow from the goal, and the session plans them.
- **Small, targeted jobs** (a fix, one rule, one check, a doc edit): keep them **task first**: what to change, where,
  the check. Still name the end goal in one line (what this serves), so the agent doesn't optimise the task against
  it. A spelling fix doesn't need a strategy section.
- Give an agent brief one unit's goal (where it fits in the big goal) plus the task detail
  (`worker-brief.md`). The big goal goes in the session prompt, not in every brief.

## The four dimensions (big jobs)
- **Speed:** the same work done sooner: parallel agents where files don't overlap, cheap models for mechanical
  passes, reuse of the family's code, a context budget and handover points. Necessary, but never the whole prompt.
- **Altitude: the outcome, not the task.** What the user can do afterwards (for example "play BB2R Challenge Mode
  on the Thor with this one guide: dex, trainers at the right caps, calc with my imported save"). Ask what else
  that needs (shared code the next hack in the family reuses, repo gaps closed along the way). Give it limits: the
  hard rules, what must not change (other guides, published keys), who decides what (the user's decisions).
- **Depth: instruments, not personas.** Name the evidence that proves the work: the checks that already exist
  (`gate.py`, scenarios, `check.py`, `drayano_check.py`, PKHeX oracles, hzla compare), cross-checks between sources,
  counts reproduced from the docs, a real save import. Set a demanding target (every trainer the doc lists, every
  stat matching the doc, zero unexplained mismatches) and say that "no clean result" is a valid report when the
  sources disagree. Don't weaken checks to pass.
- **Range: complementary methods, each with an artifact.** Pick roles by what they do, not what they sound like.
  For example: a source auditor (inventory, conflicts list), a data builder (data.json + report), a mechanics
  checker (calc fixtures against an oracle), a format engineer (save reader + oracle comparison), a player's-eye
  reviewer (the guide at 260 × 316 in the Thor frame: can I find the next fight's team fast?), and a sceptic (the
  audit: tries to break saved state, finds pages wider than 260). Run dependent passes one after another, give
  each the same acceptance list, and cut any pass that only rewords.

## Resources and the judge
- **Resources:** before starting, check the agent can *see* (the sources in `.src/`, the screen via the Thor
  frame / CDP), *understand* (the spec, the schema, the family's code) and *test* (the checks run on this machine,
  a save file exists). The first unit closes the smallest gap. Say what's missing (for example "no save file
  yet: ask the user").
- **Outside judge:** define acceptance before the work starts, using deterministic checks first and the user's
  phone / Thor review last. Agents report check output, not their own verdict. A same-model reviewer shares
  blind spots: the audit runs the checks, it doesn't just read the code.

## Writing it
- Open with the goal in one or two sentences, then: outcome and limits, decisions already made (and the ones to
  ask), evidence and targets, crew and order, resources, acceptance, budget and handover.
- Give facts the session would otherwise spend requests finding (where the caps are, what the sources get
  wrong), but not instructions it can read in CLAUDE.md.
- No persona lines ("act as an expert"). Name the method and the output instead.

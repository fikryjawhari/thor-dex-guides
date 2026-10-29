# Unbound missions — unit 7a draft

Status: **draft for phone review, not accepted for 7b** (2026-10-29). Base: `72edc56`,
`worktree-unbound`; design branch: `worktree-unbound-missions`. No template or extract changes.

## What changes

D4 adds one collapsible mission inside a stop's **Checklist**, interleaved with ordinary steps at its unlock
point. Hierarchy: split → stop → Checklist → mission → checkbox rows. There is no new mission tab, top-of-page
explanation, global mission list, or second checklist section. Stop notes, Encounters, Items and Trainers stay put.
Other guides retain their current DOM and behaviour when they have no mission data.

Review page: `tools/mockup/unbound-missions/index.html`; options: `panel.html` alongside it. Self-contained inner
HTML with sampled data, plain JS, template colour tokens, 44px rail, section/title treatments and checkbox look.
Use the frame's own size, theme, dvkb, reload and clear controls. The options panel is **outside** the guide.

Phone preview: https://windows-pc.tail1846b8.ts.net/preview/unbound-missions.html

### Sample and evidence boundary

The local `hacks/unbound/.src/unboundwiki/unboundwiki.json` has 84 mission entries. Samples, paraphrased rather
than copied pages: `mission-007` Am I Blind? (11 rows, nine tablets plus acceptance/reward), `mission-003`
A Minor Scrap (3 rows, two prerequisite missions, Power Bracer), `mission-009` Armoured Body (2 rows, Flaming
Body prerequisite, perfect-IV Ditto). Stops: Icicle Cave, Antisis City, Seaport City; surrounding directions
from walkthrough parts 1/2, 27 and 31. Intermediate stops, trainers, encounters and actual cap splits are omitted.
The single Borrius box is not a proposed cap split. Unit 7 owns the full placement and verified instructions.

Unlock does not imply immediately completable: Am I Blind? can be accepted early, but finishing needs Champion
status/ADM. The wiki's introductory tablet count is inconsistent; the sample follows its nine numbered tablet
sections. Do not promote sample paraphrases into the final extract without source review.

## Out of scope

- No template, shared CSS/JS, extract, data, config, app or production storage edits in 7a.
- No 84-mission extraction, cap assignment, rewards database or automatic reading of in-game mission progress.
- No lock/skip/defer mechanic. Requirements are readable notes, not inferred completion gates.
- No saved style/auto-close preference in the final guide: the panel chooses one behaviour for the later build.
- Mockup does not reproduce all six routes, tracker, search categories/recents, scroll-history bridge, lazy
  content rendering, conditional collapse bars, or the viewer's confirmation shim. Its native reset confirmation
  works in a browser; 7b uses the existing guide confirmation path. Its Done/Enter is a first-hit shortcut for
  this trial; **7b must retain the current raw-query Done action** and existing search/history contract.

## Questions for the user

1. **Mission title:** panel “A · Quiet divider” or “B · Bordered card”? Recommend **A**, the default:
   avoids a fourth boxed/indented appearance at 260px; title wraps, progress and chevron stay visible. B adds
   a panel background, border and 6px inner padding, not another persistent gutter. Same content and behaviour.
2. **Final mission tick:** panel “A · Stay open” or “B · Auto-close”? Recommend **A**, the default:
   no movement after ticking, easy to read the reward and undo a mistaken tick. B collapses only the mission
   completed by that checkbox action, never its stop/Checklist and never an already-complete mission on load.

These are the only unsettled design choices. Both are live panel switches on one page. Approval must record
the chosen pair here before 7b. “Fresh”, “2 / 11, closed”, “Only missions left”, “One step left”, “All ticked”
are fixture controls, not additional guide controls or decisions.

## Controls and states

| Control / route | Initial / saved state | Action | Result / focus / scroll | Disabled / empty / error |
| --- | --- | --- | --- | --- |
| Walkthrough entry | Existing route and saved position | Open / Back / reload | Keep existing route history, anchors, split/stop/section state; restore mission state by key | Mission-free guides unchanged |
| Split | Closed on fresh save | Expand/Collapse all or its title | Only that level changes; hidden descendant states retained | Existing bars retain their scope |
| Stop | Open by default, existing saved override | Tap title | Toggle stop only; keep title in place and retain all descendant ticks/open states | Mission-only stop is a real stop, never a grey sign |
| Checklist | Closed by default, existing saved override | Tap title | Open/close Checklist only; progress counts all leaf checkbox rows | Omit it if there are no ordinary or mission leaf steps |
| Mission title, closed | Closed with no saved mission record; title + `done / total` + chevron | Tap whole summary or Enter/Space | Open, save `o:true`; unlock, reward, optional completion requirement note, then rows | No parent checkbox or bulk-complete action |
| Mission title, open | Saved `o:true` | Tap summary | Close, save `o:false`; no ticking; retain steps | Whole summary is ≥44px; title may wrap, never ellipsis away its identity |
| Mission progress | Recomputed from known step keys, even when closed | Any child tick changes | Update mission, Checklist and split totals immediately, no body rebuild | Count each leaf once, never count the mission container |
| Mission complete | All current children ticked, `N / N` accent badge | Reopen / untick child | Still readable, no title strikethrough; untick returns `N-1 / N` | Complete is derived, not separately saved |
| Ordinary/mission checkbox | Existing ordinary save or mission `(m, step.k)` | Tap entire label | Tick/untick, strike through that row, update totals and Next; keep row/focus/scroll | ≥44px label, 20px visual input; no mission-wide checkbox |
| Last mission checkbox, A | Mission open | Tick last unchecked row | Stay open and keep checkbox focus; reward text remains readable | Untick works immediately |
| Last mission checkbox, B | Mission open | Tick last unchecked row | Close that mission; focus its summary and reveal it below pinned ancestors, save closed state | Reopening a complete mission stays open until a new completion action |
| Mission bottom Collapse | Open mission taller than viewport | Tap | Close mission, land/flash summary below pinned ancestors; focus summary | 7b uses existing conditional collapse-bar machinery, not an always-visible extra bar |
| Next step, ordinary → mission | First unfinished leaf is in any closed mission | Tap | Open its split, stop, Checklist, mission; land and flash row under pinned ancestors, focus checkbox without ticking | Include closed missions; never infer completion from visibility |
| Next step, mission → ordinary | All preceding mission leaves complete | Tap | Land first unfinished ordinary row after mission; do not close completed mission as a side effect | Never skip ordinary rows or double-count a mission |
| Next step, mission → mission/stop | Earlier leaves done | Tap | Same traversal across containers and split boundaries, opening only target chain | Includes a stop containing only missions |
| Next, only missions remain | Every ordinary row ticked | Tap | Find first unfinished mission leaf, not “Checklist done” | No reliance on rendered DOM/lazy-filled bodies |
| Next, repeated tap | Target still unchecked | Tap again | Same target; no advance until user ticks it | A long-lived optional quest may remain first; user can navigate manually |
| All ticked | All current leaf rows done | Last tick / reload | Existing “Checklist done” label; no landing/ticking action | Mockup disables button; 7b may retain current harmless no-op appearance |
| Search entry | Query retained per existing search contract | Rail Search | Full-window overlay, real input outside viewer, button + in-page keyboard in dvkb | Back/Esc closes overlay without changing saved checks/open states |
| Step search hit | Stop/Checklist/mission can all be closed | Pick matching step | Open entire ancestor chain and land/flash exact row, even if already ticked; persist the opened states | Never tick or clear query as a side effect |
| Mission title/metadata hit | Any state | Pick result | One mission-level result; open chain and land mission summary; no forced tick | Match title, unlock note, reward and completion note; do not emit 11 identical metadata hits |
| Search Done/Enter | Any query | Done | In 7b keep existing current-page raw-query filtering; search text stays until ×/current rail tab | Mockup first-hit shortcut is not a new production decision |
| Search clear / no results | Query set / unmatched | × / type | Clear keeps overlay open; unmatched query shows “No results”, never changes ticks | Clearing/back restores current page position; no accidental navigation |
| Reset checklist | Guide info | Confirm existing reset | Clear ordinary and mission ticks; refresh totals/Next; retain mission open states | Cancel changes nothing; never clear filters, tracker, calc or other guide origins |
| Frame options | A/A defaults; mock-only saved choices | Change choice | Preserve ticks and open states while comparing, no reset | No panel controls are shipped in 7b |

### Layout and navigation details

- No additional sticky mission title: stop and Checklist already consume at least 88px of a 316px window.
  Reuse current pinned-header measurements, not a fixed 88px constant, for search/Next/collapse landings.
- Body starts directly inside Checklist; no second nested accent rail. A reserves width for its progress badge
  and chevron, lets the name wrap, and uses the current fine divider. B is the same hierarchy with a surface.
- Unlock/reward are under the title, never on the closed row. Omit missing metadata rather than empty labels.
  Long text/URLs/translated names wrap; badges do not force horizontal growth. Completion note distinguishes
  availability from unlock (not a disabled checkbox).
- Toggling a title never scrolls it to the top. Use `flip`/`hold` and the existing resize/anchor machinery in 7b.
  New mission anchors are stable-key selectors; track text-zoom reflow, resize, dvkb and theme changes.
- Search/Next lays out all skipped ancestors before measuring. Scroll enough to show the target row start
  below the actual pinned headers; long rows can extend below the viewport. Mission summary need not remain
  visible for a deep-row hit. Closing the stop never erases a mission's remembered expansion.
- Next traversal is data-order depth-first: ordinary → every mission leaf → next ordinary. It remains the
  first-unticked checklist shortcut, not a game prerequisite solver. An unfinished early long quest is not
  silently skipped, and accepting/reward rows are separate checks.
- In dvkb the mock uses the contract's full-window four-row search keyboard (34px rows at minimum size,
  42px on taller windows), digits toggle, clear, space, backspace repeat, Done and keyboard hide/show. It does
  not depend on a native input in the non-focusable viewer. 7b reuses `SR`/`KB`, not this trial keyboard.

## Data shape for 7b

Extend `stop.s` as a discriminated union: keep every existing `[text, note]` pair untouched; a mission entry is
an object with `m`, `n`, `u`, `r`, optional `note`, and `s`. Example:

```json
{
  "k": "antisis-city",
  "n": "Antisis City",
  "s": [
    ["Visit the Black Emboar HQ beside the Poké Mart.", ""],
    {
      "m": "mission-003",
      "n": "A Minor Scrap",
      "u": "Reach Antisis City; complete The Black Emboar and The Terror Granbull.",
      "r": "Power Bracer",
      "s": [
        {"k": "accept", "t": "Talk to the upstairs goon nearest the staircase.", "n": "He takes you to the east bridge."},
        {"k": "battle", "t": "Win the street battle and the Double Battle."},
        {"k": "reward", "t": "Collect the Power Bracer back at HQ."}
      ]
    },
    ["Continue to Antisis Port.", ""]
  ]
}
```

- `m`: literal final wiki slug (`mission-003`), global unique within guide, immutable after publication.
  Never a title-derived key, array offset, stop key + offset, or ordinal assigned by extraction order.
- Child `k`: immutable semantic key within that mission, not an array position or a hash of editable wording.
  Different missions may reuse `accept`/`reward`; their parent key disambiguates. No positional fallback.
- Full `u` unlock note stays readable. Unit 7 places conditional unlocks at the earliest relevant stop and
  records extra conditions; no automatic claim that a player has met them. Only one checklist instance per `m`.
- Preserve all legacy ordinary-step identities: introducing a mission object **must not** shift the numeric
  ordinary-step portion used by today's `WO.c`/layout migration. Count only legacy pairs for that ordinal;
  mission leaves use the new map. Do not rewrite ordinary pair order/content as part of 7b's schema change.
  This is compatibility with the current implementation, not permission to store new mission positions.
- Update `CHK`, `walkStop` emptiness, all counters, `nextStep`/`nextInner`, `stopText`/search targets, reset,
  validation, and any code doing `.map(x => x.join(...))` or indexing `s.s[j][0]`. One shared leaf enumerator
  must drive totals and Next, with an identity-bearing discriminated target, not a flattened saved index.
- Schema/extract checks reject missing/duplicate mission or child keys and empty child lists before publish.
  Runtime defensively omits malformed groups, never invents keys; mission-free/empty data remains usable.
  New child added to a formerly complete group makes progress incomplete; deleted child is excluded from totals.

## Saved state and compatibility

Keep `hack.json` → `cfg.ls` and the published `LS.walk` key unchanged. Add **one property** to the existing
walk object, not a new guide prefix. Proposed production representation:

```json
{
  "missions": {
    "mission-003": {"o": false, "c": {"accept": 1, "battle": 1}}
  }
}
```

- Missing record/default: closed, no ticks. Explicit `o:false` remembers closed state. `c` contains true ticks
  only. Titles, progress totals and parent positions are not stored. Stop migration must leave this map intact.
- Moving a mission to a different stop/split, or reordering missions/children, retains expansion and the exact
  same named ticks. New child key starts unchecked; renamed display text with the same keys keeps state.
- Existing saves without `missions` initialise an empty map and retain ordinary ticks, `layout`, `o`, `x`, `s`,
  tracker, filters, recents, calc and position. No migration should blanket-reset walkthrough storage.
- On load, malformed mission records fall back independently to closed/unchecked; a broken child map must not
  erase valid legacy state. Storage denial/quota failure keeps the page usable in memory.
- Disappeared mission/child key: **retain its orphaned record** in the save, ignore it for rendering, progress
  and Next. Reappearing same key recovers it. Never transfer it to a new mission/child or reuse retired keys.
  Reset clears all mission `c` maps, including orphans, but keeps saved `o`; this is the explicit deletion path.
- Store scroll anchors and any mission search recent by `(m, child.k)` (mission-only hit: `m`); resolve the
  current parent on load. Gone child falls back to its mission title; gone mission falls back to the resolved
  stop or walkthrough top, without an exception. No new mission recent/anchor is keyed by array offsets.
- Mockup namespace is deliberately **`unbound-missions-mock-v1`**, containing stable stop/mission/child keys,
  option fixtures and query. It is not the production save format and is never imported into the guide.

### Required guide-update snapshot

Extend `tools/scenarios/guide-update.mjs` without dropping current fields. Snapshot mission expansion as sorted
`[m, displayTitle, open]` tuples and true ticks as sorted `[m, child.k, displayText]` tuples; also assert raw
stored identities contain no split/stop/mission/child positions. Include mission recents and saved scroll
anchor identities if 7b creates them. Compare by identity and meaning, not array iteration order.

Seed at least two missions (one open, one explicitly closed), partial ticks and an ordinary tick **after** a
mission. Shift split/stop indexes as the existing scenario does; also insert/reorder missions and child steps,
move a mission to a different stop, and edit its title without changing keys. Check known state survives, new
children start unchecked, and the next target resolves the same semantic first unfinished entry in new order.
Use a separate deletion case for orphan retention/exclusion, then reintroduce keys and verify recovery; compare
visible-state snapshots separately from raw storage when data has intentionally been removed. Keep all current
legacy-save and other-guide assertions. Real Unbound fixtures plus a small synthetic mission fixture on a
mission-free guide cover this before Unbound's full walkthrough is available.

## Edge cases

- 260×316, 260×350, 480×392, 537×424, 832×424; normal and dvkb; dark/light; text zoom/reflow; long titles.
- All ancestors closed, complete mission explicitly reopened, repeated Next, untick after complete, all ticked,
  mission-only checklist/stop, no steps, malformed data, missing optional unlock/reward, repeated text.
- Reset confirm/cancel, reload, route Back/Forward and returning from search; title toggles do not move scroll.
- Search is not limited to unchecked/open groups. Query stays until explicit clear; no-results is harmless.
- Offline: no fetch, imports, fonts, images or remote runtime dependencies. Credits only at footer.

## Checks

### Unit 7a

Run `node tools/mockup/unbound-missions/check.mjs` with no other browser sweep active. This uses the existing
`tools/browser.mjs`, writes evidence only to `.tmp/unbound-missions/`, and closes its browser in `finally`.
The final measured results and exact reproduction commands are recorded in the mockup's `README.md`.
This is a decide mockup, so no data/template gate is claimed or needed; the reference EI build was generated
without edits. Browser checks prove the prototype interactions, not the production save migration above.

### Required unit 7b verification (not executed in 7a)

| Requirement / state | Scenario / check | Seed / size / mode | Action and assertion |
| --- | --- | --- | --- |
| Closed/open/partial/complete mission | New `tools/scenarios/walk-missions.mjs` | At least two missions, all viewer sizes, normal + dvkb | Toggle, tick, untick, reopen, reload; ≥44px rows, no overflow, correct ancestor totals |
| Depth-first Next | Same scenario | Ordinary → mission → ordinary → mission, mission-only stop, all ordinary done | Hidden target chain opens; exact row lands/flashes; no auto-tick; repeat stable; all done harmless |
| Search | Same scenario | Closed target, completed target, title/unlock/reward/child note hit, no results | Full-window results; pick opens correct chain; no duplicates for mission metadata; Done/filter/clear/back retain existing semantics |
| Completion choice | Same scenario | Last unchecked child and chosen A/B | Assert approved focus/open/scroll outcome, manual reopen, undo |
| Reset | Same scenario | Ordinary + mission + orphan ticks | Cancel preserves; confirm clears all ticks only, leaves other guide state |
| Save update | Extend `guide-update.mjs` snapshot + fixtures | Shift/reorder/move/rename/delete/reintroduce; old save missing map | Identity and meanings survive; no wrong tick inherited by newly inserted row |
| Anchors/history | Same mission scenario + current walk-state checks | Deep mission row, reload/Back/Forward, update moves parent | Restore identity below measured sticky headers; missing target fallback safe |
| Legacy compatibility | Existing `walk-state-check.mjs`, `stable-keys.mjs`, `guide-update.mjs` | Every existing guide, old ordinary ticks and state | No regressions; ordinary tick after inserted mission retains meaning |
| Data shape | Schema + Unbound extract checks, `tools/tabs_check.py` | All 84 missions, unique slugs/child keys, actual unlock placement | No missing/duplicate identity or empty group; cap/stop ordering remains consistent |
| Appearance | `domcompare.mjs` + viewer-size/mockup checks | Baseline from accepted integration ref; every guide | Only intentional mission UI differences; mission-free walkthrough DOM unchanged |

Before 7b edits, capture a gate baseline at the then-accepted integration ref (not blindly this older 7a SHA).
After template/data work run `python assemble.py`, targeted scenarios for every guide, then the full
`uv run python -I tools/gate.py check --jobs 8` for every built guide. Run browser sweeps one at a time; use
`domcompare` normal and `--kb` against that baseline; the plan's “other four” means **every** mission-free guide
present by then, including newer guides. Read failures and inspect screenshots, not baseline away regressions.
End 7b with the complete Unbound build in the Thor frame on the phone preview, then user/Thor review. Only after
build **and integration** move lasting decisions into `template/README.md`/Unbound notes and remove this plan.

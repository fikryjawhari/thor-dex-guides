# Blaze Black 2 Redux: the 328 trainer level disagreements with hzla

Analysis only (2026-10-29, branch bb2r-levels off 40fa618). Sources: `Trainer Changes.txt` v1.4.1, hzla
`bb2redux1-4.json` (Decomps pin in SOURCES.md), `extract/report.txt`, `extract/trainers.py`, `tools/drayano.py`.

## What hzla's two numbers are
- `level` comes from the ROM: the sets carry ROM fields (`tr_id`, `ai`, `reward_item`, IVs), so `level` is the stored
  level. That makes it the stat level on Challenge and the shown level on Normal. The older Dynamic-Calc backup
  (`legacy-bb2redux1-4.json`) has the same `level` on all 84 rows below where the stored level differs. Both backups
  give the same ROM data, so they can't show that one of them is from an older Redux version.
- `diff` is hzla's own number for each **location**, not from the game: Route 20 / Floccesy +1, Route 4 / Castelia /
  Nimbasa +2 … Victory Road +4, every postgame-only area +5, Faraway Island +7, Pokémon League 0. It ignores the
  doc's scoped exceptions and doesn't know when you come back to a place (postgame Morimoto at Castelia gets +2).
  Allies get 0.

Split: 244 rows have the same stat level but a different increment; in 84 the stored level differs and the increment is the same.

## Classes (offset = our shown level − hzla's shown level)

| class | rows | offsets | likely right |
|---|---|---|---|
| A1 our parser: sub-section "no level shift" scope | 24 | −2 | **hzla (our bug)**; fixed (5f596e7) |
| A2 doc's scoped "no level shift" that hzla's location +2 ignores | 15 | −2 | doc |
| A3 ally (partner) Pokémon in tag battles: we add the increment, hzla 0 | 54 | +2/+3/+4 | in-game check |
| A4 postgame: the doc states no increment; we carry +4, hzla +5 / +3 / +2 | 140 | −1 (110), +1 (18), +2 (12) | +4 vs +5: in-game; hzla's +3/+2: doc |
| A5 hzla location diff wrong in one room (Frigate Grunt #500 +3, Grunt #440 0) | 7 | +1, +4 | doc |
| B1 unique Challenge team: hzla `level` = stated, adds +2 | 4 | −2 | in-game check |
| D1 doc level = ROM + section increment ("doc lists the Challenge level") | 57 | +1…+4 | in-game check (hzla likely) |
| E1 Route 4 Braven / Clifford: hzla's teams 212/213 match no doc team | 8 | −5 (2), +5 (6) | doc (hzla data muddled) |
| G1 one-off base-level differences, doc vs ROM | 19 | −2…+4 | ROM (hzla) for stats |
| total | 328 | | |

(The asked-for (c) "no level shift" class is A1 + A2; (e) join errors are E1 only: no trainer is matched to the wrong
hzla team. Bryce/Micki, the starter/version branches and rematches all join correctly. (d) older-version: not shown,
see D1.)

**A1 (24).** Castelia, Burgh's Gym: "Levels … +2 … for the main gym puzzle" then "No level shift … in Burgh's room,
levels for Burgh himself are as stated" (lines 798-799); we zero the Harlequins too (Clarence, Jack, Gary, Anders:
15 rows). Nimbasa: the "No level shift" under `~~~ Big Stadium ~~~` (Flannery, line 1083) carries on into
`~~~ After Elesa has been defeated ~~~` (Plasma Grunts #359, #751: 9 rows). `_bb2r_trainers` resets the increment only
at `===` headings. Doc wording and hzla agree on +2.

**A2 (15).** Castelia "Accessible after Surf" (line 842: "No level shift… / All trainers are fought back to back"):
Roughneck Ricky, Dancer Jean-Paul, Guitarist Tina, lv.50. We show 50, hzla 52. The doc's line is explicit and inside
its sub-section; hzla's +2 is just the Castelia value.

**A3 (54).** Hugh in the Castelia Sewers tag (line 666: 9), Nate/Rosa with Ingo & Emmet (6), Cheren and Hugh on the
Frigate (12), the partner with Zinzolin at Lacunosa (9), and on the Frigate's second visit (9+9). hzla sets every
ally to 0 on purpose, while the same location's enemies get the location value. The doc lists allies under the
section's "Levels +N" with no word on them. Only the battle screen settles it. It hardly matters to the calc (allies
aren't attacked), but it changes the levels the page shows.

**A4 (140).** Line 3522: "the old documentation for the postgame is presented": postgame sections have no "Levels"
line, and `easy_increment` carries the last +4 into them. hzla: +5 for Steven, Wallace, N's Castle, Shadow Triad,
Cilan/Cress/Chili, Blue and the Nacrene leader rematches (110). Its +3 for postgame Hugh (Driftveil, 18) and +2 for
Morimoto/Nishino (Castelia lv.90, 12) are just those places' early-game values, so they're wrong. For +4: the doc's bug
text says "+4 level advantage for the rest of the game past Skyla". Nothing offline backs hzla's +5.

**A5 (7).** Frigate second visit: line 2850 says +4 and every other grunt there agrees with hzla at +4. Grunt #500 is +3
(5 rows) and Grunt #440 is 0 (2 rows) in hzla.

**B1 (4).** Lenora and Hawes [Challenge mode] (line 1055): stated lv.31, hzla stores 31 and adds +2 → shows 33. All
other unique Challenge teams fit "stated = stored + diff" (Cheren's Munchlax: stored 13, shows 14). So either the doc
gives Lenora/Hawes's stored level here, or hzla's +2 shouldn't apply to them.

**D1 (57).** Same increment on both sides; the doc level is exactly stored + increment, so hzla shows the doc's number
and we show doc + increment. Floccesy School Kids Seymour / Cassie (18: doc 11, stored 10), Hiker Jerome, Ranger
Naoko, Scientist Clarke, Janitor Brady, Gamefreak Morimoto / Nishino (Castelia), Ingo & Emmet (4), Hugh at
Chargestone (15: doc 46/47, stored 43/44), Backpacker Annie, Ranger Lewis, Frigate Grunts #436, #428, Giant
Chasm Grunt #724. Every other row agrees, so the doc lists the stored level. These trainers look like their
Challenge level was typed in. Changelog has nothing on these levels (v1.0.2 "Raised Hugh's levels slightly outside
Chargestone" comes before both hzla backups). The ROM is likely right, but this is the one class that changes the
displayed level of many early fights, so check it in the game.
Reversal Mountain B1F (Ranger Lewis): no shift line of its own; kept at the MAIN AREA's +4 by an explicit exception; the section default would be +3; settle in game.

**E1 (8).** Doc: early Braven/Clifford version branch lv.20 (3 Pokémon, line 575), later Braven and Clifford lv.25
(4 each). hzla: 212 = Braven 4 × lv.20, 213 = Clifford Meowth/Sandile 25 + Dwebble/Darumaka 20. That fits no doc
team, so hzla's export loses one Clifford. Trust the doc.

**G1 (19).** Guitarist Billy Jo 16 vs 17 (3), Clarke's Magnezone 45 vs 42 (the D1 pattern + 1), Wattson's [Challenge]
Manectric 28 vs 27, Backpacker Sam 27/26, Parasol Lady Tihana 36/34 and 36/35 (3), Worker Leo 39/38, Psychic Sarah
45/47, Colress [Normal] F-00 / MT 52 vs 48 (2), Shadow Triad 59/58 (3) and 66/65, Black Belt Drago 62/60 (2). These are
doc typos or later doc edits. For the stat level the ROM wins. For the shown level, use hzla's stored level + the doc
increment (left as report lines for now).

## Build bug and the fix (A1)
In `tools/drayano.py` `_bb2r_trainers`, change two things:
1. Keep a `section_increment`, set by "Levels …" / "No level shift" lines that come before the section's first `~~~`
   sub-heading. At each `~~~` sub-heading (a `~~~~ Name ~~~~` line, or a title between two `~~~` rules), reset
   `increment = section_increment`. A shift line inside a sub-section changes only `increment`.
2. Don't zero the increment for a "No level shift" line that names a scope (`"Burgh's room"`): Burgh's own teams are
   Normal-mode or unique Challenge records, so the increment never reaches them.
Simulated over the whole doc: exactly these 6 records change (Harlequins ×4, Grunts #359, #751). All 24 rows then
agree with hzla, and no other record moves. Only levels change; trainer keys and stop keys don't.
Don't change anything else until the checks below are back. If check 1 shows hzla's number, D1 (57 rows) should show
the doc level with `sl` = doc − increment.
Then A4 stays +4 unless a postgame look shows +5.

## In-game checks (Challenge mode, read the level on the battle screen)
1. **D1: School Kid Seymour or Cassie, Floccesy Town** (any starter branch; Pansage / Snivy / … lv.11 in the doc).
   Our build: **Lv 12**. hzla: **Lv 11**. 11 means the doc lists these trainers at Challenge level (fix D1).
2. **A3: Castelia Sewers tag with Hugh vs Plasma Grunts #342/#356** (line 666). Look at **Hugh's** Pokémon
   (Dewott / Servine / Pignite, Swellow, a Simi monkey; doc lv.24). Our build: **Lv 26**. hzla: **Lv 24**. 24 means allies get no
   increment (drop it for all 54 ally rows, no `sl`).
3. **B1: Lenora and Hawes [Challenge], Nimbasa** (line 1055; Gigalith / Machamp / Stoutland / Unfezant lv.31).
   Our build: **Lv 31**. hzla: **Lv 33**. 33 means this team's doc levels are stored levels (+2 shown, `sl` 31).
Later (postgame save): A4 at Striaton (Cilan / Cress / Chili, stored lv.82): our build **86**, hzla **87**.

# Range compare (later; noted 2026-11-03)

From rnbcalc (`SylmarDev/syl-rnb-calc`, `src/js/range_compare.js`, MIT). Queue a sequence of hits (mixed moves, either
side), each with its rolls and crit chance; the remaining-HP distribution is convolved hit by hit with Sitrus / Oran /
Iapapa / Leftovers between hits; output: a bar chart of the probability of each final HP, survival %, and
"P(HP <op> N)".

Why later: space. It needs its own "add to range" action on a move row, separate from the existing −HP (apply a roll)
action, plus a result panel. The final-HP chart is the part worth keeping. Our KO line covers only the same move
repeated.

"""Assemble guides/hardlove-gold-dex.html: notes comment + EI template (style, rail, app) + data + sprites + builder source.
Usage: python assemble.py <builder dir> <emerald-imperium-dex.html> <out dir of build.py> <hl_app.js> <out.html>"""
import sys, os, re, json
B, EI, OUT, APP, DST = sys.argv[1:6]
ei = open(EI, encoding='utf-8').read()
# the notes comment mentions these tags too, so search from the real <head>
h0 = ei.index('-->') + 3
style = ei[ei.index('<style>', h0) + 7:ei.index('<\/style>', h0)]
b0 = ei.index('<body>', h0) + 6
body = ei[b0:ei.index('<script id="data"', b0)]
style += """.doc{line-height:1.45;overflow-wrap:anywhere}.doc p{margin:6px 0}
/* long single-word item names (Blastoisinite, Weakness Policy) wrap instead of widening the page at 260 */
.itbl td{overflow-wrap:anywhere}
.dpre{font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre;overflow-x:auto;max-width:100%;background:var(--panel2);border-radius:8px;padding:6px 8px;margin:6px 0;tab-size:8}
"""
D = json.load(open(os.path.join(OUT, 'data.json'), encoding='utf-8'))
data = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('<\/', '<\\/')
spr = open(os.path.join(OUT, 'spr.json'), encoding='utf-8').read()
app = open(APP, encoding='utf-8').read()
src = ''
for f in ('build.py', 'src.py', 'hge.py', 'encv.py', 'xl.py', 'dex.py', 'png.py', 'sd.js', 'port.py', 'assemble.py'):
    src += '\n# ======================= %s =======================\n' % f + open(os.path.join(B, f), encoding='utf-8').read()
assert '<\/script' not in app.lower()
rep = open(os.path.join(OUT, 'report.txt'), encoding='utf-8').read().strip()
n = lambda k: sum(1 for p in D['P'] if p['g'] == k)
ntr = sum(len(s['tr']) for g in D['TR']['g'] for s in g['sec'])
notes = f"""<!doctype html>
<!--
HARDLOVE GOLD OFFLINE DEX - BUILD NOTES (read this first if you are extending the file)
========================================================================================

WHAT THIS FILE IS
One self-contained HTML page that works fully offline, made for the Dex Viewer floating window on the AYN Thor and for a
phone browser. Rebuilt {D['built']} for Hardlove Gold 0.8.3 from the hack's own source code and its docs. The UI is the Emerald Imperium template (left icon rail,
in-page keyboard, full-window search, number pad, blob sprites, content-visibility, anchor scroll restore,
dexViewer.restoreScroll, last-route reopen); only the data and the Hardlove-only parts differ (see VIEWER UI below).
{len(D['P'])} Pokemon and forms ({n(0)} obtainable, {n(1)} Megas, {n(3)} trainer only), {len(D['M'])} moves, {len(D['AB'])} abilities,
{ntr} trainers, {len(D['AR'])} encounter areas, {sum(len(s['st']) for s in D['WK']['splits'])} walkthrough stops.

FILE LAYOUT
  <script id="data" type="application/json">   all game data (schema below)
  <script id="spr" type="application/json">    sprite map {{pokemonId: "data:image/png;base64,..."}}
  <script id="build-source" type="text/plain"> the builder (build.py and helpers, port.py, assemble.py), not executed
  <script> (last)                              the app: hash router + renderers
Routes: #/ (list) #/p/<id> (Pokemon) #/m/<moveIndex> (move) #/a/<abilityIndex> (ability) #/locs #/l/<LOC index>
        #/trainers #/tr/<group.section.trainer> #/items #/walk #/calc

HOW TO REBUILD (Git Bash, repo root; Python 3 stdlib and Node only, see docs/hardlove-gold/SOURCES.md for fetching)
  Save the build-source parts as separate files (split on the "# ===== <name> =====" lines) in one folder <B>.
  The previous guide's data and sprites (old_data.json, old_spr.json) are read for a few fallbacks; extract them from this
  file's #data / #spr before overwriting it. The hack source must be in docs/hardlove-gold/repos/hardlove (SOURCES.md). Then:
    node <B>/sd.js docs/hardlove-gold/repos/showdown <W>/sd.json
    node -e "<eval repos/hardlove.js, write backup_data to <W>/calc.json>"   (only a types fallback now)
    python <B>/build.py docs/hardlove-gold <W> <W>/out          (prints the report below)
    python <B>/port.py <EI app script> <W>/hl_app.js              (EI = the last <script> of emerald-imperium-dex.html)
    python <B>/assemble.py <B> guides/emerald-imperium-dex.html <W>/out <W>/hl_app.js guides/hardlove-gold-dex.html
  port.py is a list of exact replacements on the EI app script; if the EI template changes, re-run it and fix any
  replacement that no longer matches (it stops with the text it could not find).

SOURCES (all in docs/hardlove-gold, fetched 2026-10-18)
 0. THE HACK'S SOURCE: github.com/kumakuma1/hardlove (the author's hg-engine build), branch beta_hardlove at commit
    f1b2363001 (2026-10-18, "use copy of pp for calcing mega stats" = release 0.8.3), files in repos/hardlove (COMMIT holds the sha).
    This is what the ROM is built from, so it is the authority wherever it has the data (src.py, hge.py read the C files):
      data/Species.c + HiddenAbilityTable.c  types, base stats, abilities and hidden abilities of every species and form
      data/learnsets/learnsets.json          level-up, TM, tutor and egg moves (forms without an entry use their base form)
      data/Evolutions.c                      evolutions (methods rewritten to words: evo_text in build.py)
      data/Moves.c + include/config.h        type, category, power, accuracy, PP, priority (CHAMPIONS_* changes are on)
      data/Trainers.c                        every trainer set: species, level, item, ability, nature, moves, IVs, battle type
      data/Encounters.c, SafariEncounters.c  wild tables, checked slot by slot against the locations sheet
      data/MachineMoves.c                    TM/HM numbers
      src/field/encounter_check.c (read online) the hack's slot odds: land 8 x 10% + 4 x 5%, surf/rod 30/30/25/10/5,
                                             rock smash 60/40. Good and Super Rod tables are one-species placeholders: the
                                             hack only gives the Old Rod.
    Not in the source: map scripts (item balls, NPC gifts, trades, marts), so item locations, tutors, gifts and statics
    still come from the sheets; HiddenItems.c still has vanilla leftovers in unused Kanto areas, so it is not used.
    Findings: the dex site predates 0.8.0 (learnsets) and 0.8.1 (abilities), never listed hidden abilities and had 5 wrong
    Mega/Crowned stat lines; the sheet's "Lycanroc-M" is Midnight; Mt. Mortar 1F/2F have Surf and Fishing swapped in the
    sheet; HM05/HM06 are swapped in the items sheet; Hiker Schorsch has the wrong trainer id in the sheet (11, game 233).
 1. Docs site kumakuma1.github.io/hardlove-docs (repo bb5862f), site/pokedex: 1,364 pages, one per species/form, in the
    index's dex order. Now used only for the species list and order, display names, other forms and sprites (160x80
    two-frame sheets; the builder keeps the left 80x80 frame, trimmed). Its stats, types, abilities, moves and evolutions
    are replaced by source 0 (the report lists every change). QUIRKS: Fairy types show "Typing not found" (filled from the calc's
    species data, a few from the previous build); "Wild Locations" are stale and not used; female-only species have no
    sprite (0-byte files), taken from the hack source (repos/sprites = kumakuma1/hardlove at the pinned commit,
    data/graphics/sprites/<id>/female/front.png). Bounsweet has none.
 2. "Pokemon Locations" sheet (xlsx): source of truth for availability. Encounter Tables (location names in merged row 1,
    Level/Pokemon column pairs, col A method, col B rate as a fraction), Safari Zone (same, areas after the gate), Random
    Pools ("Pool, Location" headers; cell notes kept), Game Corner (by badge), Trades, Unavailable Pokemon. Cell notes are
    now read: per encounter ("Starter: Litten.", "Requires 7th Badge."), per location (Azalea headbutt trees, Safari
    layout) and the roamer note. Name suffixes -A/-G/-H/-P regional, -T Therian, -D Defense. The player's starter choice
    (Turtwig, Litten, Froakie) is in no tab: added from Mechanics.txt as "Starter choice" at New Bark Town (the previous
    build missed it, so Froakie, Greninja and Mega Greninja showed as trainer only).
    Obtainable set = everything found + evolution family both ways, minus the Unavailable tab. Chimecho, Forretress, Great
    Tusk and Iron Bundle are in both a table and the Unavailable tab; they are kept as obtainable.
 3. "Trainer Battles" sheet (xlsx): split tabs in order (Falkner Split ... Clair Split, Victory Road, Elite Four, Mini
    Bosses). Block per trainer: "Name - <id>" row, Pokemon row, species row, Level, Ability, Held Item, Nature, 4 Moves rows.
    Section header rows ("Falkner Split [Level Cap 16], Ruins of Alph") give the split, cap and place. Brackets in names
    become tags ([Optional], [Double], [Back2Back]...); [Starter X] becomes the trainer's starter filter. Cell notes
    (column I) on a name row go to that trainer, on a section row to the section, otherwise to the trainer whose block holds
    the row. "-M" is Mega only when the item is the matching stone; "-M-X/Y/Z" Mega X/Y/Z; Floette-Eternal-M is Mega Floette.
    "X-2" levels (Mini Bosses) are relative to the level cap (r:-2). The hidden "Example - Vanilla" tab and the "Pokemon",
    "Trainers" and "import" tabs are not used. The sheet now gives order, places, tags and notes; the sets come from the game
    (source 0), paired by the "Name - <id>" trainer id and species. Where the sheet differs the card says "Sheet says ...".
 4. "Move Changes" sheet: changed moves only ("20 > 40"), plus the effect side table, kept as notes; the numbers come from
    the game (source 0). Notes say where the sheet disagrees with the game and which game changes the sheet doesn't list.
 5. "Item Location" sheet: Held Items (+ Berries side table), Heart Scales, Rare Candies, HM/TMs and Move Tutors (TMs, tutor
    side table, HMs after the "HM" row), Evolution Items, Mega Stones ("Unavailable." when not obtainable), Other.
 6. Hardlove calc github.com/kumakuma1/hardlovecalc backups/hardlove.js (Jan 2026): no longer used for sets (the game's
    Trainers.c replaced it); only a fallback for missing types.
 7. pokemon-showdown 0.11.11 (repos/showdown): move and ability descriptions, dex numbers, the Z-A Mega list (their data
    then comes from source 0), and the Gen 9 baseline the move notes compare against.
 8. Mechanics.txt (level caps, starter choice table, removed EVs and other rules), Hardlove Gold AI document_WIP.txt and
    Post-KO Switch-in AI.xlsx: shown as "Game docs" in the Walkthrough tab. Move Performance.txt (generic move order notes
    from a wiki) is not used.

DATA RULES
  P.g: 0 obtainable, 1 Mega (P.nu = stone unavailable, kept only because a trainer uses it), 3 trainer only.
  Megas: Other Forms of obtainable species; stone matched by name (X/Y/Z suffix must agree); dropped when the stone is
  unavailable and no trainer uses them (Mega Latias). Megas sit right after their base form.
  Locations: order = Encounter Tables column order, Safari areas after the gate, Blackthorn City after Ice Path. Areas merge
  sub-locations (areaOf in build.py); the area list is unchanged from the previous build, so tracker slots carry over.
  Walkthrough: no written walkthrough exists. Stops come from the trainer sheet's sections in order, split by level-cap
  header; each area is anchored to its first stop when that keeps the order monotonic, else becomes an "on the way" stop.
  Items are filed by the earliest area name in their location text (ALIASW in build.py).
  Level caps (TR.caps) from Mechanics.txt; a trainer's cap is its split header's cap.

DATA SCHEMA (the JSON in #data)
  M [moveName]   MV [{{t, c, bp, ac, pp, pr, d description, f [], h [Hardlove change notes]}}]   AB [[name, description]]
  P [{{id, n display name, dex, t[types], a[abilityIdx], ha hidden abilityIdx or -1, s[HP,Atk,Def,SpA,SpD,Spe], ef/et [[how, id or null]],
      of [ids], lv [[level, moveIdx]] (0 = on evolution), tm/tu/eg [moveIdx], w [[LOCidx, method, rate, level, note]],
      g, nu, stone, sloc}}]
  LOC [sublocation]   AR [{{n area, l [LOC idx], ns 1 = no tracker slot (Roaming), note}}]
  IT [{{n section, k tm|mega|gen, note, r [[item, text, link (move idx or mega id), missable 1/0]]}}]
  WK {{splits [{{n, note, st [{{n place, a [AR idx], s [], note, it [[section, item, text, link]], tr [trainer keys], x 1 = on the
      way}}]}}], np [unplaced items], docs [[title, text]], ko {{rows, note}}, gc game corner note}}
  TR {{caps [[boss, cap]], fix [], g [{{n, tab, note [], sec [{{h, note [], tr [{{k "g.s.t", n, id sheet trainer id, loc, tags [],
      st starter or '', cap, note [], p [{{id, s sheet name, l level or null, r relative to cap, na, a abilityIdx, ao "A / B" when
      the sheet lists two (sheet-only sets), a0 ability before Mega Evolution, i item, m [moveIdx], iv [6] HP,Atk,Def,SpA,SpD,Spe,
      ev [0 x6], hp Hidden Power type (from IVs), cf [what the sheet says instead], src "s" = no game set, sheet values}}]}}]}}]}}]}}
  TC {{attackType: {{defendType: multiplier x10}}}} standard Gen 9 chart (Mechanics: assume Gen 9)

STAT FORMULA
  HP = floor((2B + IV + floor(EV/4)) x L / 100) + L + 10; others = floor((floor((2B + IV + floor(EV/4)) x L / 100) + 5) x nature)
  EVs are 0 everywhere: the hack removes them.

LOCAL STORAGE (prefix hg)
  "hgtrack" tracker {{s starter, e {{areaIdx: {{p: id}} or {{f: 1}}}}, t {{"area|For X": id}}}} (same key and shape as the previous
  build), "hgcalc:<id>" + "hgcalc:lastlv" stat calc (same as before), "hgdex4" list filters, "hgwalk2" walkthrough open
  state, "hgcap2" level cap per trainer (+ _last), "hgtr" open trainer groups, "hgrecent" search picks, "hgpos" last route
  and anchor. "dvkb" = "1" forces viewer mode (shared test switch).

VIEWER UI (template from emerald-imperium-dex.html, changed by port.py)
  Kept: rail, keyboard, number pad, full-window search, lag work, scroll and route restore, trainer grid, tracker.
  Hardlove parts: Tutor move tab; starter selector in the tracker bar (filters rival teams, trades, starter-only items);
  trade slots in the tracker; no EV row in the stat calculator; trainer cards show "Sheet says ..." where the sheet and the game differ, a
  "Level cap" box for cap-relative teams; Walkthrough has Game docs instead of cheat codes and no checklist (there are
  no steps); availability filter "Trainer only" instead of "Changed from vanilla". Removed: Minimal Grinding Mode, Hot House,
  EI changes doc and conflict cards.

BUILD REPORT ({D['built']})
""" + '\n'.join('  ' + x for x in rep.split('\n')) + """

NEXT
  Damage calc on the Calc page (hardlovecalc has an engine and older sets); save file import.
-->
"""
inner = notes[notes.index('<!--') + 4:notes.rindex('-->')]
inner = inner.replace('--', '- -')  # an HTML comment may not contain "--"
notes = notes[:notes.index('<!--') + 4] + inner + '-->\n'
head = """<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<meta name="dex-viewer:game" content="Hardlove Gold">
<meta name="dex-viewer:platform" content="NDS">
<title>Hardlove Gold Dex<\/title>
<style>""" + style + "<\/style><\/head><body>" + body
out = (notes + head + '<script id="data" type="application/json">' + data + '<\/script>\n<script id="spr" type="application/json">' + spr +
       '<\/script>\n<script id="build-source" type="text/plain">' + src.replace('<\/', '<\\/') + '<\/script>\n<script>' + app + '<\/script>\n<\/body><\/html>\n')
open(DST, 'w', encoding='utf-8', newline='\n').write(out)
print(DST, len(out.encode('utf-8')))

# Blaze Black 2 Redux build notes

Scaffold only, based on `hardlove-gold`. Feature switches need review.

## Build

`uv run python -I hacks/blaze-black-2-redux/extract/build.py`

TODO: implement extract modules; audit inherited cfg switches and cfg.txt wording.

## Sources and rules

Complete version, Challenge Mode; NDS, documentation pin 1.4.1 (existing SOURCES.md).
TODO: incorporate the parallel source audit, audit watch.json and decide source-backed extraction rules.

## Local storage

Prefix `bb2r`. Keep these keys once published.

- `dex`: `bb2rdex`
- `calc`: `bb2rcalc`
- `track`: `bb2rtrack`
- `walk`: `bb2rwalk`
- `cap`: `bb2rcap`
- `tr`: `bb2rtr`
- `recent`: `bb2rrecent`
- `pos`: `bb2rpos`
- `mgm`: `bb2rmgm`
- `loc`: `bb2rloc`
- `items`: `bb2ritems`
- `dmg`: `bb2rdmg`

## Hack-only data

TODO: document hack-only data.

## Checks

`uv run python -I tools/gate.py check blaze-black-2-redux`

TODO: replace extract/check.py and calc stubs with source-backed assertions. Calc remains disabled.
Before enabling it, replace the null in tools/scenarios/calc-doubles.mjs EXPECTED with an audited count and add
tools/trainer_fields_check.py DOUBLES_EXPECTED (DOUBLES_PARTNER_ONLY if needed). The engine stub is registered
in tools/calc/package.json; review tools/calc/test.mjs field-profile fixtures. Never copy another hack's counts.
Review tools/itemstd.py RULES only for source-backed quirks; shared defaults need no entry.
Fill sources/watch.json, version/mode, GID/save reader and sprite additions by hand.

## History

2026-10-29: scaffold from Hardlove Gold with tools/new_hack.py; prefix bb2r, calc disabled, no data.json.
Four live guides' data gates pass and their built HTML is byte-identical to 23a42e1. Data / calc units fill TODOs.

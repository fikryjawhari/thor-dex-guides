# Pokémon page — decide mockup

Decide step for the Pokémon page: collapsible sections, a pinned name bar with a to-top button, and a moves table
that fits 260 px. Not the template; no template, extract or data edits. Mockup saves use `dex-page-mock-v1`.

Phone review: https://windows-pc.tail1846b8.ts.net/preview/dex-page.html

## Rebuild and publish

```powershell
python -I tools/mockup/dex-page/sample.py
python -I tools/mockup/thor-frame/build.py .tmp/dex-page/index.html .tmp/dex-page/framed.html --title "Dex page" --panel tools/mockup/dex-page/panel.html --routes none
python -I tools/preview.py .tmp/dex-page/framed.html dex-page.html
node tools/mockup/dex-page/check.mjs
```

`sample.py` takes eight Emerald Imperium Pokémon (data.json, shared-set sprites), inlines `template/dex.css` and the
shell's rail. `check.mjs`: the moves table at the five viewer sizes (letters vs today), every sampled Pokémon and move
tab at 260 wide, page errors; screenshots in `.tmp/dex-page/`.

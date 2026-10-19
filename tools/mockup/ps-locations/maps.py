"""Render each area map in Wild Pokemon Locations.pdf (the non-screenshot images, circles included) to PNG."""
import base64, io, json, re, sys
import pdfplumber
sys.stdout.reconfigure(encoding='utf-8')
out = sys.argv[1]
pdf = pdfplumber.open('hacks/photonic-sun/.src/Wild Pokemon Locations.pdf')
maps = {}
for i, pg in enumerate(pdf.pages[3:], 3):
    ws = pg.extract_words(extra_attrs=['size'])
    tl = [w for w in ws if round(w['size']) == 18]
    for im in pg.images:
        if (round(im['width']), round(im['height'])) in ((300, 180), (298, 179)) or im['width'] < 50:
            continue
        above = sorted({round(w['top']): 0 for w in tl if w['top'] < im['top']})
        line = above[-1] if above else None
        title = ' '.join(w['text'] for w in sorted(tl, key=lambda w: w['x0']) if line is not None and round(w['top']) == line)
        title = re.sub(r"Hau’ oli", "Hau'oli", title).replace('’', "'")
        box = (max(0, im['x0'] - 2), max(0, im['top'] - 2), min(pg.width, im['x1'] + 2), min(pg.height, im['bottom'] + 2))
        img = pg.crop(box).to_image(resolution=144).original
        b = io.BytesIO()
        img.save(b, 'PNG', optimize=True)
        maps.setdefault(title, []).append({'w': img.width, 'h': img.height, 'src': 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()})
        img.save(f'{out}/map-{i}.png')
        print(i, title, img.size, len(b.getvalue()) // 1024, 'KB')
json.dump(maps, open(f'{out}/maps.json', 'w', encoding='utf-8'))

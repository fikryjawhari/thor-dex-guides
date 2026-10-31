"""Calc layout prototype: injects plans/calc-layout-proto.css / .js into a built guide (template untouched).

python -I plans/calc-layout-proto.py [hack ...]  ->  .tmp/proto-<hack>.html, framed .tmp/proto-<hack>-frame.html
Then: python -I tools/preview.py .tmp/proto-<hack>-frame.html calc-proto-<short>.html
"""
import pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / 'plans/calc-layout-proto.css').read_text(encoding='utf8')
js = (root / 'plans/calc-layout-proto.js').read_text(encoding='utf8')
for hack in sys.argv[1:] or ['emerald-imperium', 'photonic-sun']:
    html = (root / 'dist' / f'{hack}.html').read_text(encoding='utf8')
    i = html.rindex('</body>')
    html = html[:i] + f'<style id="proto-css">\n{css}\n</style>\n<script id="proto-js">\n{js}\n</script>\n' + html[i:]
    out = root / '.tmp' / f'proto-{hack}.html'
    out.write_text(html, encoding='utf8')
    subprocess.run([sys.executable, '-I', str(root / 'tools/mockup/thor-frame/build.py'), str(out),
                    str(root / '.tmp' / f'proto-{hack}-frame.html'), '--title', f'Calc layout · {hack}',
                    '--panel', str(root / 'plans/calc-layout-proto-panel.html')], check=True)

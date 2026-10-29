"""TODO: source-backed unbound checks, including baseline comparisons."""
from pathlib import Path
import sys

data = Path(__file__).resolve().parents[1] / 'data.json'
if not data.is_file():
    print('SKIP unbound extract-check: no data.json')
    sys.exit(0)
sys.exit('TODO: implement unbound extract checks before accepting data')

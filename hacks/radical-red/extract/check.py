"""TODO: source-backed radical-red checks, including baseline comparisons."""
from pathlib import Path
import sys

data = Path(__file__).resolve().parents[1] / 'data.json'
if not data.is_file():
    print('SKIP radical-red extract-check: no data.json')
    sys.exit(0)
sys.exit('TODO: implement radical-red extract checks before accepting data')

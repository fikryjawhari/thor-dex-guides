"""TODO: source-backed blaze-black-2-redux checks, including baseline comparisons."""
from pathlib import Path
import sys

data = Path(__file__).resolve().parents[1] / 'data.json'
if not data.is_file():
    print('SKIP blaze-black-2-redux extract-check: no data.json')
    sys.exit(0)
sys.exit('TODO: implement blaze-black-2-redux extract checks before accepting data')

"""TODO: extract unbound sources; never seed data from another guide."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import H
import extractlib
import dex
import locs
import trainers
import items
import walk


def main():
    data = {}
    for module in (dex, locs, trainers, items, walk):
        module.build(data)
    extractlib.finalise(data, H.name)
    extractlib.write_data(data, H)


if __name__ == '__main__':
    try:
        main()
    except NotImplementedError as error:
        sys.exit(str(error))

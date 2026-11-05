"""Fetch the pinned trainer AI source, without replacing existing shared inputs."""
import argparse
from pathlib import Path
from urllib.request import urlopen

PIN = 'f715235073f9a6ab91be697e277c6c23d9e7caf4'
FILES = tuple(f'src/trainerai/{name}.c' for name in (
    'main', 'setupStateVariables', 'calcDamage', 'calcSpeed', 'scoringHelper',
    'calc', 'pick_command', 'postKO',
)) + ('include/custom/custom_ai.h',)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', type=Path,
                        default=Path(__file__).resolve().parents[1] / '.src/repos/hardlove')
    args = parser.parse_args()
    for name in FILES:
        target = args.destination / name
        if target.exists():
            print(f'kept {name}')
            continue
        with urlopen(f'https://raw.githubusercontent.com/kumakuma1/hardlove/{PIN}/{name}') as response:
            content = response.read()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        print(f'fetched {name} at {PIN}')


if __name__ == '__main__':
    main()

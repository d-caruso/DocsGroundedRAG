import json
from pathlib import Path

CHUNKS = Path(__file__).resolve().parent.parent / "data" / "chunks" / "chunks.json"


def main() -> None:
    from clean_text import information_density

    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    densities = sorted(information_density(c["content"]) for c in chunks)
    n = len(densities)
    print(
        f"n={n} "
        f"p1={densities[max(0, int(n * 0.01))]:.3f} "
        f"p5={densities[int(n * 0.05)]:.3f} "
        f"p50={densities[n // 2]:.3f} "
        f"min={densities[0]:.3f}"
    )


if __name__ == "__main__":
    main()

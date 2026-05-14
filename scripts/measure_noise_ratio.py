import json
from pathlib import Path

CHUNKS = Path(__file__).resolve().parent.parent / "data" / "chunks" / "chunks.json"


def noise_ratio(text: str) -> float:
    if not text:
        return 1.0
    non_alpha = sum(1 for c in text if not c.isalnum() and not c.isspace())
    return non_alpha / len(text)


def main() -> None:
    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    ratios = sorted(noise_ratio(c["content"]) for c in chunks)
    n = len(ratios)
    print(
        f"n={n} "
        f"p50={ratios[n // 2]:.3f} "
        f"p95={ratios[int(n * 0.95)]:.3f} "
        f"p99={ratios[int(n * 0.99)]:.3f} "
        f"max={ratios[-1]:.3f}"
    )


if __name__ == "__main__":
    main()

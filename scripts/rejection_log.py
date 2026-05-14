import json
from pathlib import Path
from typing import Any

REJECTED_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "chunks" / "rejected.jsonl"
)


def record_rejection(
    *,
    chunk_id: str,
    source_file: str,
    run_id: str,
    stage: str,
    reason: str,
    text: str,
    metric: Any = None,
) -> None:
    row: dict[str, Any] = {
        "chunk_id": chunk_id,
        "source_file": source_file,
        "run_id": run_id,
        "stage": stage,
        "reason": reason,
        "text": text,
    }
    if metric is not None:
        row["metric"] = metric

    REJECTED_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REJECTED_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")

# DocsGroundedRAG Ingestion Pipeline — Branching Strategy

**Status:** ❌ Not started
**Last Updated:** 2026-05-14

> **Status legend:** ❌ Not started · 🟡 In progress · ✅ Complete
> When a Phase or Task is finished, replace its ❌ with ✅.

---

## Overview

Git branching strategy for implementing the ingestion-pipeline redesign described in [`docs/ingestion-pipeline.md`](ingestion-pipeline.md).

The work spans five sequential phases. Each depends on artifacts introduced by the previous one (cleaning module → rejection writer → metadata fields → dedup keys → idempotency rules), so phases are not parallelisable.

| Phase | Label | Scope | Status |
|-------|-------|-------|--------|
| 1 | Text Cleaning extraction | Lift cleaning out of the chunker; add artifact / whitespace / newline regex sub-steps | ✅ |
| 2 | Structural checks + audit trail | `rejected.jsonl` writer; convert silent skips to audited rejections; add noise-ratio and low-density gates | ❌ |
| 3 | Metadata enrichment | Heading-path tracking; content-hash chunk IDs | ❌ |
| 4 | Deduplication | Hash-based dedup stage before embedding | ❌ |
| 5 | Idempotent re-ingestion | Delete-by-source in `chunks.json`, `rejected.jsonl`, and Supabase | ❌ |

---

## Pre-Merge Checklist

No automated test or lint infrastructure currently exists for `scripts/` (no `pyproject.toml`, no `pytest.ini`, no `tests/` directory). Each task is verified manually via the steps listed in its own "Verification" line — typically: re-run the affected script against `data/docs/`, then `diff` or `jq` over `data/chunks/chunks.json` and `data/chunks/rejected.jsonl`.

Adding pytest is out of scope for this feature. Do not bundle a test-infrastructure task into any phase below.

Before opening a PR for any branch:

- [ ] Re-ran the affected script(s) against `data/docs/`
- [ ] Verification step in the task description passes
- [ ] No unrelated changes in the diff
- [ ] Commit message follows `BRANCHING_STRATEGY.md` §2 format (max 6 lines, no AI references)

---

## Main Feature Branch

| | |
|---|---|
| **Branch** | `feature/ingestion-pipeline` |
| **Created from** | `develop` |
| **Merges to** | `develop` (via PR after all phases complete) |

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ingestion-pipeline
```

---

## Phase 1 — Text Cleaning extraction ✅

| | |
|---|---|
| **Branch** | `feature/ingestion-pipeline-Phase1-text-cleaning` |
| **Created from** | `feature/ingestion-pipeline` |
| **Merges to** | `feature/ingestion-pipeline` |

### Goal

Move text cleaning out of `scripts/chunk_docs.py` into a standalone module that runs on raw document text before chunking, and add the artifact-collapse / whitespace / newline regex sub-steps from §2 of the design doc.

### Tasks

---

#### Task 1.1 — Create `scripts/clean_text.py` ✅

Branch: `task/ingestion-pipeline-Task1.1-extract-cleaning`
Created from: `feature/ingestion-pipeline-Phase1-text-cleaning`

Create a new module containing the cleaning functions currently inlined in `scripts/chunk_docs.py:12-30` (`clean_text`, `remove_tables`). Behaviour must be byte-identical to the current pipeline at the end of this task — no regex additions yet.

**Code — `scripts/clean_text.py`:**
```python
import re


def clean_text(text: str) -> str:
    text = re.sub(
        r"Instructions for LLMs:.*?(?=\n# |\n## |\Z)",
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    return text.strip()


def remove_tables(text: str) -> str:
    lines = text.splitlines()
    return "\n".join(line for line in lines if "|" not in line)
```

Files:
- `scripts/clean_text.py` — new

Commit: `[TASK] 1.1 extract clean_text and remove_tables into scripts/clean_text.py`

Verification: module imports without error; nothing else changes yet.

---

#### Task 1.2 — Switch `chunk_docs.py` to use the new module ✅

Branch: `task/ingestion-pipeline-Task1.2-chunker-uses-clean-module`
Created from: `feature/ingestion-pipeline-Phase1-text-cleaning`

Delete the inline `clean_text` and `remove_tables` definitions in `scripts/chunk_docs.py:12-30` and import them from the new module instead.

**Code — `scripts/chunk_docs.py`:**
```python
from clean_text import clean_text, remove_tables
```

Files:
- `scripts/chunk_docs.py`

Commit: `[TASK] 1.2 import clean_text and remove_tables from scripts/clean_text`

Verification: `python3 scripts/chunk_docs.py` runs; `git diff data/chunks/chunks.json` is empty (byte-identical to the previous run).

---

#### Task 1.3 — Add artifact / whitespace / newline regex sub-steps ✅

Branch: `task/ingestion-pipeline-Task1.3-artifact-regex`
Created from: `feature/ingestion-pipeline-Phase1-text-cleaning`

Add the three regex sub-steps from §2 of the design doc to `clean_text`. Order is fixed: artifact collapse first, then whitespace, then newlines.

**Code — `scripts/clean_text.py`:**
```python
def clean_text(text: str) -> str:
    text = re.sub(
        r"Instructions for LLMs:.*?(?=\n# |\n## |\Z)",
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)

    # Collapse any non-word non-whitespace char repeated 3+ times
    text = re.sub(r"([^\w\s])\1{2,}", " ", text)

    # Collapse runs of spaces/tabs
    text = re.sub(r"[ \t]{2,}", " ", text)

    # Collapse 3+ newlines into a paragraph break
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
```

Files:
- `scripts/clean_text.py`

Commit: `[TASK] 1.3 add artifact/whitespace/newline collapse to clean_text`

Verification: re-run `scripts/chunk_docs.py`. `git diff data/chunks/chunks.json` shows changes only in chunks that previously contained `----`, `***`, `====`, `....`, `~~~~`, runs of spaces, or runs of newlines.

---

## Phase 2 — Structural checks + audit trail ❌

| | |
|---|---|
| **Branch** | `feature/ingestion-pipeline-Phase2-structural-checks` |
| **Created from** | `feature/ingestion-pipeline` (after Phase 1 merged) |
| **Merges to** | `feature/ingestion-pipeline` |

### Goal

Replace the silent skips in `should_skip_chunk` (`scripts/chunk_docs.py:134-159`) with audited rejections written to `data/chunks/rejected.jsonl`, then add the two new chunk-level gates from §3.1 of the design doc.

### Tasks

---

#### Task 2.1 — `rejected.jsonl` writer module ✅

Branch: `task/ingestion-pipeline-Task2.1-rejection-log`
Created from: `feature/ingestion-pipeline-Phase2-structural-checks`

Create `scripts/rejection_log.py` exposing an append-only writer for the schema defined in §3.3 of the design doc.

**Code — `scripts/rejection_log.py`:**
```python
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
```

Files:
- `scripts/rejection_log.py` — new

Commit: `[TASK] 2.1 add rejected.jsonl writer module`

Verification: a one-off call to `record_rejection(...)` appends one valid JSON line to `data/chunks/rejected.jsonl`.

---

#### Task 2.2 — Convert silent skips to audited rejections ✅

Branch: `task/ingestion-pipeline-Task2.2-audit-existing-skips`
Created from: `feature/ingestion-pipeline-Phase2-structural-checks`

Refactor `should_skip_chunk` (`scripts/chunk_docs.py:134-159`) so it returns a reason string (or `None`) instead of a bool. Update `process_file` to record a rejection row for each dropped chunk with `stage="structural_checks"` and one of: `table_heavy`, `code_heavy`, `oversized`, `skip_heading`.

Set a single `RUN_ID = datetime.now(UTC).isoformat()` at the top of `main()` and pass it through.

**Code — `scripts/chunk_docs.py`:**
```python
def chunk_rejection_reason(text: str) -> str | None:
    if starts_with_any_heading(text, SKIP_HEADINGS):
        return "skip_heading"
    if is_table_heavy_chunk(text):
        return "table_heavy"
    if is_code_heavy_chunk(text):
        return "code_heavy"
    if is_too_large(text):
        return "oversized"
    return None
```

In `process_file`, replace each `if should_skip_chunk(chunk): continue` with:
```python
reason = chunk_rejection_reason(chunk)
if reason is not None:
    record_rejection(
        chunk_id=f"{file_path.stem}_pre_{i}",
        source_file=file_path.name,
        run_id=RUN_ID,
        stage="structural_checks",
        reason=reason,
        text=chunk,
    )
    continue
```

Files:
- `scripts/chunk_docs.py`

Commit: `[TASK] 2.2 emit audited rejections from should_skip_chunk drops`

Verification: re-run `scripts/chunk_docs.py`. `data/chunks/rejected.jsonl` is non-empty; every row's `reason` is one of the four expected values. Surviving chunks in `chunks.json` match the previous run.

---

#### Task 2.3 — Noise-ratio gate + threshold measurement ❌

Branch: `task/ingestion-pipeline-Task2.3-noise-ratio`
Created from: `feature/ingestion-pipeline-Phase2-structural-checks`

Add a one-off measurement script that prints the noise-ratio distribution over the current corpus, then add the gate using the resulting p99 as a hard-coded threshold. Generalize `chunk_rejection_reason` to return `tuple[str, float | None] | None` so the metric can be recorded.

**Measurement — `scripts/measure_noise_ratio.py` (new):**
```python
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
```

**Gate — move `noise_ratio` into `scripts/clean_text.py`, then in `scripts/chunk_docs.py`:**
```python
from clean_text import noise_ratio

NOISE_RATIO_THRESHOLD = 0.0  # replace with p99 from measure_noise_ratio.py


def chunk_rejection_reason(text: str) -> tuple[str, float | None] | None:
    if starts_with_any_heading(text, SKIP_HEADINGS):
        return ("skip_heading", None)
    if is_table_heavy_chunk(text):
        return ("table_heavy", None)
    if is_code_heavy_chunk(text):
        return ("code_heavy", None)
    if is_too_large(text):
        return ("oversized", None)

    ratio = noise_ratio(text)
    if ratio > NOISE_RATIO_THRESHOLD:
        return ("high_noise_ratio", ratio)
    return None
```

Update the `process_file` rejection call to pass `metric=metric_value` when present.

Files:
- `scripts/measure_noise_ratio.py` — new
- `scripts/clean_text.py` — add `noise_ratio`
- `scripts/chunk_docs.py`

Commit: `[TASK] 2.3 add noise-ratio gate with p99 threshold`

Verification: run `scripts/measure_noise_ratio.py`, replace the `0.0` placeholder with the measured p99, re-run `chunk_docs.py`, confirm `high_noise_ratio` rows appear in `rejected.jsonl` with `metric` populated.

---

#### Task 2.4 — Low information density gate ❌

Branch: `task/ingestion-pipeline-Task2.4-low-density`
Created from: `feature/ingestion-pipeline-Phase2-structural-checks`

Add a meaningful-word-ratio gate using a real ~180-word English stopword list vendored inline (avoids an NLTK runtime dependency). No length filter on words. Threshold derived the same way as Task 2.3 — measure first, then hard-code.

**Code — `scripts/clean_text.py`:**
```python
# Vendored English stopword list (NLTK 'english' snapshot, ~180 words).
STOPWORDS: frozenset[str] = frozenset({
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    # ...keep the full list inline...
})


def information_density(text: str) -> float:
    words = text.split()
    if not words:
        return 0.0
    meaningful = [w for w in words if w.lower() not in STOPWORDS]
    return len(meaningful) / len(words)
```

**Measurement — `scripts/measure_density.py` (new):** mirrors `measure_noise_ratio.py`.

**Gate — `scripts/chunk_docs.py`:** add a branch in `chunk_rejection_reason`:
```python
density = information_density(text)
if density < LOW_DENSITY_THRESHOLD:
    return ("low_density", density)
```

Files:
- `scripts/clean_text.py`
- `scripts/measure_density.py` — new
- `scripts/chunk_docs.py`

Commit: `[TASK] 2.4 add low-information-density gate`

Verification: `rejected.jsonl` contains rows with `reason="low_density"` and `metric` populated; chunks that are headings alone or stub labels are now caught.

---

## Phase 3 — Metadata enrichment ❌

| | |
|---|---|
| **Branch** | `feature/ingestion-pipeline-Phase3-metadata` |
| **Created from** | `feature/ingestion-pipeline` (after Phase 2 merged) |
| **Merges to** | `feature/ingestion-pipeline` |

### Goal

Attach heading-path metadata to each chunk and switch to content-hash chunk IDs so identifiers remain stable across re-runs.

### Tasks

---

#### Task 3.1 — Heading-path tracking ❌

Branch: `task/ingestion-pipeline-Task3.1-heading-path`
Created from: `feature/ingestion-pipeline-Phase3-metadata`

Track h1/h2/h3 ancestry while splitting and attach it as `metadata.heading_path` (list of strings, deepest last).

**Code — `scripts/chunk_docs.py`:**
```python
def extract_heading_path(chunk_text: str, parent_path: list[str]) -> list[str]:
    match = re.match(r"^\s{0,3}(#{1,3})\s+(.+)$", chunk_text, flags=re.MULTILINE)
    if not match:
        return parent_path
    level = len(match.group(1))
    title = match.group(2).strip()
    return parent_path[: level - 1] + [title]
```

Thread `heading_path` through `process_file` so each survivor's `metadata["heading_path"]` reflects its position in the source markdown.

Files:
- `scripts/chunk_docs.py`

Commit: `[TASK] 3.1 add heading_path metadata to chunks`

Verification: every chunk in `chunks.json` has a non-empty `metadata.heading_path` list whose entries match the headings above it in its source file.

---

#### Task 3.2 — Content-hash chunk IDs ❌

Branch: `task/ingestion-pipeline-Task3.2-stable-ids`
Created from: `feature/ingestion-pipeline-Phase3-metadata`

Replace position-based chunk IDs with `{source_stem}_{sha1(content)[:8]}` so identifiers remain stable across re-runs even when cleaning thresholds change ordering.

**Code — `scripts/chunk_docs.py`:**
```python
import hashlib


def chunk_id(source_file: str, content: str) -> str:
    digest = hashlib.sha1(content.encode("utf-8")).hexdigest()[:8]
    return f"{Path(source_file).stem}_{digest}"
```

Replace ID assignments in `merge_small_chunks` and `process_file` with this helper.

Files:
- `scripts/chunk_docs.py`

Commit: `[TASK] 3.2 switch to content-hash chunk IDs`

Verification: running `chunk_docs.py` twice in a row produces identical IDs for unchanged content.

---

## Phase 4 — Deduplication ❌

| | |
|---|---|
| **Branch** | `feature/ingestion-pipeline-Phase4-dedup` |
| **Created from** | `feature/ingestion-pipeline` (after Phase 3 merged) |
| **Merges to** | `feature/ingestion-pipeline` |

### Goal

Add a dedup stage between structural checks and embedding. First occurrence wins; later duplicates are recorded in `rejected.jsonl` with `reason="duplicate"` and `metric` set to the surviving chunk's ID.

### Tasks

---

#### Task 4.1 — Hash-based dedup ❌

Branch: `task/ingestion-pipeline-Task4.1-content-hash-dedup`
Created from: `feature/ingestion-pipeline-Phase4-dedup`

Add a dedup pass in `scripts/chunk_docs.py:main()` after all `process_file` results are collected and before writing `chunks.json`.

**Code — `scripts/chunk_docs.py`:**
```python
def deduplicate(chunks: list[dict], run_id: str) -> list[dict]:
    seen: dict[str, str] = {}
    survivors: list[dict] = []
    for c in chunks:
        h = hashlib.sha1(c["content"].encode("utf-8")).hexdigest()
        if h in seen:
            record_rejection(
                chunk_id=c["id"],
                source_file=c["metadata"]["source_file"],
                run_id=run_id,
                stage="deduplication",
                reason="duplicate",
                text=c["content"],
                metric=seen[h],
            )
            continue
        seen[h] = c["id"]
        survivors.append(c)
    return survivors
```

Call `deduplicate(all_chunks, RUN_ID)` in `main()` immediately before writing `chunks.json`.

Files:
- `scripts/chunk_docs.py`

Commit: `[TASK] 4.1 add hash-based dedup before chunks.json write`

Verification: temporarily duplicate a section in one file under `data/docs/`, re-run, confirm one survivor in `chunks.json` and one `duplicate` row in `rejected.jsonl` whose `metric` matches the survivor's ID. Revert the test duplication.

---

## Phase 5 — Idempotent re-ingestion ❌

| | |
|---|---|
| **Branch** | `feature/ingestion-pipeline-Phase5-idempotent-ingestion` |
| **Created from** | `feature/ingestion-pipeline` (after Phase 4 merged) |
| **Merges to** | `feature/ingestion-pipeline` |

### Goal

Make every stage re-runnable per `source_file`: delete-before-append in local artifacts, and a single transaction with delete-by-source in Supabase. Replaces the current `truncate table chunks` at `scripts/load_to_supabase.py:27` so a partial re-ingest no longer wipes the table.

### Tasks

---

#### Task 5.1 — Delete-by-source in local artifacts ❌

Branch: `task/ingestion-pipeline-Task5.1-local-idempotency`
Created from: `feature/ingestion-pipeline-Phase5-idempotent-ingestion`

Before appending in `scripts/chunk_docs.py:main()`, drop rows from `chunks.json` and `rejected.jsonl` whose `source_file` is in the current batch.

**Code — `scripts/chunk_docs.py`:**
```python
from rejection_log import REJECTED_PATH


def prune_artifacts(batch_sources: set[str]) -> None:
    for path in (CHUNKS_PATH, REJECTED_PATH):
        if not path.exists():
            continue
        if path.suffix == ".json":
            rows = json.loads(path.read_text(encoding="utf-8"))
            kept = [r for r in rows if r["metadata"]["source_file"] not in batch_sources]
            path.write_text(json.dumps(kept, indent=2), encoding="utf-8")
        else:  # .jsonl
            kept_lines = [
                line
                for line in path.read_text(encoding="utf-8").splitlines()
                if json.loads(line)["source_file"] not in batch_sources
            ]
            path.write_text("\n".join(kept_lines) + ("\n" if kept_lines else ""), encoding="utf-8")
```

Call `prune_artifacts({p.name for p in DOCS_PATH.rglob("*.md")})` at the start of `main()`.

Files:
- `scripts/chunk_docs.py`

Commit: `[TASK] 5.1 delete-by-source in chunks.json and rejected.jsonl before append`

Verification: re-run with a subset of files temporarily moved out of `data/docs/`; only the in-batch files' rows change, others remain untouched.

---

#### Task 5.2 — Delete-by-source transaction in Supabase loader ❌

Branch: `task/ingestion-pipeline-Task5.2-supabase-idempotency`
Created from: `feature/ingestion-pipeline-Phase5-idempotent-ingestion`

Replace `cur.execute("truncate table chunks")` at `scripts/load_to_supabase.py:27` with a `DELETE WHERE source_file IN (...)` issued inside the same transaction as the bulk `INSERT`.

**Code — `scripts/load_to_supabase.py`:**
```python
batch_sources = sorted({chunk["metadata"]["source_file"] for chunk in chunks})

with psycopg.connect(DB_URL) as conn:
    register_vector(conn)
    with conn.cursor() as cur:
        cur.execute(
            "delete from chunks where metadata->>'source_file' = any(%s)",
            (batch_sources,),
        )
        cur.executemany(
            "insert into chunks (content, metadata, embedding) values (%s, %s::jsonb, %s)",
            rows,
        )
```

Files:
- `scripts/load_to_supabase.py`

Commit: `[TASK] 5.2 replace truncate with delete-by-source in load_to_supabase`

Verification: load a single-file subset; query Supabase and confirm only that file's rows changed, rows from other source files remain.

---

#### Task 5.3 — Prune step for removed files ❌

Branch: `task/ingestion-pipeline-Task5.3-prune-removed`
Created from: `feature/ingestion-pipeline-Phase5-idempotent-ingestion`

Add `scripts/prune_removed_sources.py` that deletes from `chunks.json`, `rejected.jsonl`, and Supabase any `source_file` that no longer exists under `data/docs/`. This is the separate prune step referenced in §3.5 of the design doc.

**Code — `scripts/prune_removed_sources.py`:**
```python
import json
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent.parent
DOCS = BASE / "data" / "docs"
CHUNKS = BASE / "data" / "chunks" / "chunks.json"
REJECTED = BASE / "data" / "chunks" / "rejected.jsonl"

load_dotenv(BASE / ".env")
DB_URL = os.environ["SUPABASE_DB_URL"]


def existing_sources() -> set[str]:
    return {p.name for p in DOCS.rglob("*.md")}


def main() -> None:
    keep = existing_sources()

    if CHUNKS.exists():
        rows = json.loads(CHUNKS.read_text(encoding="utf-8"))
        CHUNKS.write_text(
            json.dumps([r for r in rows if r["metadata"]["source_file"] in keep], indent=2),
            encoding="utf-8",
        )

    if REJECTED.exists():
        kept = [
            line
            for line in REJECTED.read_text(encoding="utf-8").splitlines()
            if json.loads(line)["source_file"] in keep
        ]
        REJECTED.write_text("\n".join(kept) + ("\n" if kept else ""), encoding="utf-8")

    with psycopg.connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(
            "delete from chunks where metadata->>'source_file' <> all(%s)",
            (sorted(keep),),
        )


if __name__ == "__main__":
    main()
```

Files:
- `scripts/prune_removed_sources.py` — new

Commit: `[TASK] 5.3 add prune step for removed source files`

Verification: move one file out of `data/docs/` temporarily, run `python3 scripts/prune_removed_sources.py`, confirm its rows disappear from `chunks.json`, `rejected.jsonl`, and Supabase. Restore the file afterwards.

---

## Merge Order

```
develop
└── feature/ingestion-pipeline
    ├── Phase1-text-cleaning           ← merge first
    ├── Phase2-structural-checks       ← after Phase 1
    ├── Phase3-metadata                ← after Phase 2
    ├── Phase4-dedup                   ← after Phase 3
    └── Phase5-idempotent-ingestion    ← after Phase 4
```

Each phase branch merges into `feature/ingestion-pipeline` via PR. The feature branch merges to `develop` only after all five phases pass the verification steps in each task.

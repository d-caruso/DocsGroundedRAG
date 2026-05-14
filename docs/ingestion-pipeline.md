# Ingestion Pipeline

## Decision rationale

The current ingestion pipeline (`scripts/chunk_docs.py:168-201` → `scripts/embed_chunks.py` → `scripts/load_to_supabase.py`) folds text cleaning silently inside the chunker, drops chunks via `should_skip_chunk` (`scripts/chunk_docs.py:134-159`) with no audit trail, and is not idempotent against re-ingestion of updated source files. For a small curated corpus where every chunk matters, silent drops are the worst failure mode — gaps in coverage are invisible until a query misses.

The target pipeline corrects three structural problems: (1) it separates document-level cleaning from chunk-level quality gates, (2) it makes every rejection auditable via a durable `rejected.jsonl` artifact that doubles as a re-processing queue, and (3) it makes re-ingestion idempotent per `source_file`. The tradeoff accepted: one additional artifact file to manage and a delete-before-insert step in Supabase ingestion, in exchange for a pipeline whose decisions are inspectable, tunable without losing data, and safe to re-run.

The embedding-model invariant from `docs/architecture-decisions.md` §6 still holds: query-time and ingestion-time embedders must match. Changing the embedding model means re-embedding the whole corpus and updating the `pgvector` column dimension.

---

## Pipeline flow

```
Raw document
    ↓
[Text Extraction]
    ↓
[Text Cleaning]
    └─ Regex artifact collapse: ([^\w\s])\1{2,} → " "
       (catches ----, ****, ====, ...., ~~~~, ===, >>>)
    └─ Whitespace normalization:  [ \t]{2,} → " "
    └─ Paragraph normalization:   \n{3,}    → "\n\n"
    ↓
[Chunking]
    └─ Heading split (h1/h2)
    └─ Size-based sub-split (## → ### → paragraphs, ≤500 words)
    └─ Small-chunk merge (<140 words)
    ↓
[Structural chunk checks]
    └─ Existing: table-heavy, code-heavy, oversized,
       blacklisted heading prefixes
    └─ New: noise ratio > corpus-derived p99 threshold
    └─ New: low information density
       (meaningful-word ratio < threshold,
        real ~180-word stopword list, no length filter)
    ↓
[Metadata enrichment]
    └─ Heading path (h1 → h2 → h3)
    └─ Source URL / anchor
    └─ Stable chunk ID
       (default: {source_stem}_{i};
        upgrade to {source_stem}_{sha1(content)[:8]}
        if external consumers ever hold references)
    ↓
[Deduplication]
    └─ Hash-based on normalized content,
       before paying to embed
    ↓
[Embedding]
    └─ BAAI/bge-small-en-v1.5, 384-dim
       (must match query-time embedder)
    ↓
[Database ingestion]
    └─ Idempotent per source_file (see §3.5)
```

---

## Implementation spec — rejection & re-ingestion

### 3.1 Per-chunk decision flow

**Forward path:**

```
Chunk enters [Text Cleaning]
    ├─ Regex matches artifact pattern?
    │     ├─ Yes → MUTATE text, continue
    │     └─ No  → continue unchanged
    ↓
Chunk enters [Structural chunk checks]
    ├─ Table-heavy?                  → DISCARD → rejected.jsonl (reason: table_heavy)
    ├─ Code-heavy?                   → DISCARD → rejected.jsonl (reason: code_heavy)
    ├─ Oversized (>500 words)?       → DISCARD → rejected.jsonl (reason: oversized)
    ├─ Blacklisted heading prefix?   → DISCARD → rejected.jsonl (reason: skip_heading)
    ├─ Noise ratio > p99 threshold?  → DISCARD → rejected.jsonl (reason: high_noise_ratio, metric=ratio)
    ├─ Low information density?      → DISCARD → rejected.jsonl (reason: low_density, metric=density)
    └─ All pass                      → continue
    ↓
Chunk enters [Metadata enrichment] → annotate (heading path, URL, stable ID), continue
    ↓
Chunk enters [Deduplication]
    ├─ Content hash already seen?    → DISCARD → rejected.jsonl (reason: duplicate, metric=duplicate_of_id)
    └─ Novel                         → continue
    ↓
Chunk enters [Embedding]            → 384-dim vector, continue
    ↓
Chunk enters [Database ingestion]   → upsert into Supabase (delete-by-source first, see §3.5)
```

**Re-processing path** (triggered when a threshold is tuned or a new regex/pattern is added):

```
Operator tunes threshold OR adds pattern
    ↓
Re-run cleaning + structural_checks + dedup over rejected.jsonl only
    ↓
For each previously-rejected chunk:
    ├─ Now passes all gates?
    │     ├─ Yes → REMOVE from rejected.jsonl
    │     │       → flow through metadata → dedup → embed → ingest
    │     └─ No  → KEEP in rejected.jsonl, update run_id + reason
```

### 3.2 Rejection routing summary (per gate)

| Gate | Action on failure | Audit row written |
|---|---|---|
| Text Cleaning regex | Mutation only — never rejects | No |
| Noise ratio > threshold | Discard | Yes |
| Low information density | Discard | Yes |
| Existing structural (table/code/oversized/skip-heading) | Discard (currently silent in `should_skip_chunk` — must start writing audit rows) | Yes |
| Deduplication | Discard | Yes |

### 3.3 `rejected.jsonl` schema

JSONL, one row per rejection:

```json
{
  "chunk_id": "...",
  "source_file": "...",
  "run_id": "<timestamp or git SHA>",
  "stage": "structural_checks",
  "reason": "high_noise_ratio",
  "metric": 0.42,
  "text": "<original chunk text>"
}
```

`stage` values: `cleaning`, `structural_checks`, `deduplication`.
`reason` values: `table_heavy`, `code_heavy`, `oversized`, `skip_heading`, `high_noise_ratio`, `low_density`, `duplicate`.

### 3.4 Lifecycle of `rejected.jsonl`

- Durable artifact alongside `data/chunks/chunks.json` (not a transient log).
- Re-processing queue: after tuning thresholds or adding regex patterns, re-run cleaning/checks over `rejected.jsonl` only. Survivors append to chunks artifact and get embedded; the rest stay rejected.
- Resolved rows are deleted from `rejected.jsonl` (or marked `resolved: true`) when accepted on a later pass.

### 3.5 Idempotency rules for re-ingestion

`source_file` is the natural key.

On every ingestion run, for each `source_file` in the batch:

1. Delete all rows in `chunks.json` where `source_file` matches the batch.
2. Delete all rows in `rejected.jsonl` where `source_file` matches the batch.
3. Run the full pipeline on the batch.
4. Append new chunks and new rejections.
5. In Supabase, mirror inside one transaction:
   ```sql
   DELETE FROM chunks WHERE source_file IN (...);
   INSERT INTO chunks ...;
   ```

Handles three cases:
- **New file** → no rows to delete, append only.
- **Updated file** → old chunks + old rejections wiped, no orphans.
- **Removed file** → not handled by this rule; a separate prune step deletes any `source_file` not present under `data/docs/` anymore.

### 3.6 Operational audit pattern

After each run, surface new artifact classes without reading any chunk text:

```sh
jq -s 'group_by(.reason) | map({reason: .[0].reason, n: length})' rejected.jsonl
```

Per surfaced class, tune one threshold or add one regex pattern, then re-process only `rejected.jsonl`.

The detailed git branching plan for implementing this pipeline lives in [`docs/ingestion-pipeline-branching-strategy.md`](ingestion-pipeline-branching-strategy.md).

---

## References

- `scripts/chunk_docs.py:12-21` — current `clean_text` (the gap: no artifact-repetition handling, no whitespace/newline normalization)
- `scripts/chunk_docs.py:134-159` — current `should_skip_chunk` (where silent drops happen today)
- `scripts/chunk_docs.py:168-201` — current `process_file` (cleaning + chunking conflated)
- `scripts/embed_chunks.py`, `scripts/load_to_supabase.py` — no text mutation happens here
- `docs/architecture-decisions.md` §6 — embedding-model invariant

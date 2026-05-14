from datetime import datetime, timezone
import hashlib
from pathlib import Path
import re
import json

from clean_text import clean_text, information_density, noise_ratio, remove_tables
from rejection_log import (
    REJECTED_PATH,
    record_rejection,
    REASON_CODE_HEAVY,
    REASON_DUPLICATE,
    REASON_HIGH_NOISE_RATIO,
    REASON_LOW_DENSITY,
    REASON_OVERSIZED,
    REASON_SKIP_HEADING,
    REASON_TABLE_HEAVY,
)

DOCS_PATH = Path("data/docs")
CHUNKS_PATH = Path("data/chunks/chunks.json")

def chunk_id(source_file: str, content: str) -> str:
    digest = hashlib.sha1(content.encode("utf-8")).hexdigest()[:8]
    return f"{Path(source_file).stem}_{digest}"


def split_by_headings(text):
    sections = re.split(r"\n(?=# )|\n(?=## )", text)
    return [s.strip() for s in sections if s.strip()]

def word_count(text):
    return len(text.split())

def merge_small_chunks(chunks, min_words=140):
    if not chunks:
        return []

    merged = [chunks[0]]

    for chunk in chunks[1:]:
        if word_count(chunk["content"]) < min_words:
            merged[-1]["content"] += "\n\n" + chunk["content"]
        else:
            merged.append(chunk)

    for chunk in merged:
        chunk["id"] = chunk_id(chunk["metadata"]["source_file"], chunk["content"])

    return merged

def is_table_heavy_chunk(text, min_table_lines=5, max_non_table_words=100):
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    table_lines = 0
    non_table_text = []

    for line in lines:
        if "|" in line:
            table_lines += 1
        else:
            non_table_text.append(line)

    non_table_words = len(" ".join(non_table_text).split())

    return table_lines >= min_table_lines and non_table_words <= max_non_table_words

def split_large_chunk(text, max_words=500):
    if word_count(text) <= max_words:
        return [text]

    # First try splitting by ## headings
    subchunks = re.split(r"\n(?=## )", text)
    subchunks = [s.strip() for s in subchunks if s.strip()]

    if len(subchunks) > 1:
        return merge_large_safe(subchunks, max_words=max_words)

    # Then try ###
    subchunks = re.split(r"\n(?=### )", text)
    subchunks = [s.strip() for s in subchunks if s.strip()]

    if len(subchunks) > 1:
        return merge_large_safe(subchunks, max_words=max_words)

    # Fallback: paragraphs
    paragraphs = re.split(r"\n\s*\n", text)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    return merge_large_safe(paragraphs, max_words=max_words)

def merge_large_safe(parts, max_words=800):
    merged = []
    current = ""

    for part in parts:
        candidate = part if not current else current + "\n\n" + part

        if word_count(candidate) <= max_words:
            current = candidate
        else:
            if current:
                merged.append(current.strip())
            current = part

    if current:
        merged.append(current.strip())

    return merged

def starts_with_any_heading(text, headings):
    first_heading = re.match(r"^\s{0,3}#{1,6}\s+(.+)$", text.strip(), flags=re.MULTILINE)
    if not first_heading:
        return False

    heading = first_heading.group(1).strip().lower()
    return any(heading.startswith(h.lower()) for h in headings)


def code_block_count(text):
    return len(re.findall(r"```", text)) // 2


def is_code_heavy_chunk(text, min_code_blocks=3, max_non_code_words=220):
    code_blocks = re.findall(r"```.*?```", text, flags=re.DOTALL)
    non_code_text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    non_code_words = word_count(non_code_text)

    return len(code_blocks) >= min_code_blocks and non_code_words <= max_non_code_words


NOISE_RATIO_THRESHOLD = 0.178   # p99 from measure_noise_ratio.py
LOW_DENSITY_THRESHOLD = 0.564   # p1  from measure_density.py

SKIP_HEADINGS = [
    "Supported currencies",
    "Test the integration",
    "Font compatibility",
    "Pricing",
    "Exchange rate",
    "Refunds",
    "See also",
    "Create a multi-currency price",
    "Create a Checkout Session",
]


def chunk_rejection_reason(text: str) -> tuple[str, float | None] | None:
    if starts_with_any_heading(text, SKIP_HEADINGS):
        return (REASON_SKIP_HEADING, None)
    if is_table_heavy_chunk(text):
        return (REASON_TABLE_HEAVY, None)
    if is_code_heavy_chunk(text):
        return (REASON_CODE_HEAVY, None)
    if is_too_large(text):
        return (REASON_OVERSIZED, None)
    ratio = noise_ratio(text)
    if ratio > NOISE_RATIO_THRESHOLD:
        return (REASON_HIGH_NOISE_RATIO, ratio)
    density = information_density(text)
    if density < LOW_DENSITY_THRESHOLD:
        return (REASON_LOW_DENSITY, density)
    return None

def is_too_large(text, max_words=500):
    return word_count(text) > max_words

def extract_heading_path(chunk_text: str, parent_path: list[str]) -> list[str]:
    match = re.match(r"^\s{0,3}(#{1,3})\s+(.+)$", chunk_text, flags=re.MULTILINE)
    if not match:
        return parent_path
    level = len(match.group(1))
    title = match.group(2).strip()
    return parent_path[: level - 1] + [title]


def split_by_h2(text):
    parts = re.split(r"\n(?=## )", text)
    return [p.strip() for p in parts if p.strip()]

def process_file(file_path, run_id: str):
    content = file_path.read_text(encoding="utf-8")
    content = clean_text(content)
    content = remove_tables(content)
    chunks = split_by_headings(content)

    results = []
    heading_path: list[str] = []

    for i, chunk in enumerate(chunks):
        heading_path = extract_heading_path(chunk, heading_path)

        result = chunk_rejection_reason(chunk)
        if result is not None:
            reason, metric = result
            record_rejection(
                chunk_id=f"{file_path.stem}_pre_{i}",
                source_file=file_path.name,
                run_id=run_id,
                stage="structural_checks",
                reason=reason,
                text=chunk,
                metric=metric,
            )
            continue

        split_chunks = split_large_chunk(chunk, max_words=500)

        for split_chunk in split_chunks:
            if word_count(split_chunk) > 450:
                sub_chunks = split_by_h2(split_chunk)
            else:
                sub_chunks = [split_chunk]

            for j, sub_chunk in enumerate(sub_chunks):
                result = chunk_rejection_reason(sub_chunk)
                if result is not None:
                    reason, metric = result
                    record_rejection(
                        chunk_id=f"{file_path.stem}_sub_{i}_{j}",
                        source_file=file_path.name,
                        run_id=run_id,
                        stage="structural_checks",
                        reason=reason,
                        text=sub_chunk,
                        metric=metric,
                    )
                    continue

                results.append({
                    "id": chunk_id(file_path.name, sub_chunk),
                    "content": sub_chunk,
                    "metadata": {
                        "source_file": file_path.name,
                        "category": str(file_path.parent.relative_to(DOCS_PATH)),
                        "heading_path": extract_heading_path(sub_chunk, heading_path),
                    }
                })
    results = merge_small_chunks(results)
    return results

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
                reason=REASON_DUPLICATE,
                text=c["content"],
                metric=seen[h],
            )
            continue
        seen[h] = c["id"]
        survivors.append(c)
    return survivors


def main():
    run_id = datetime.now(timezone.utc).isoformat()
    prune_artifacts({p.name for p in DOCS_PATH.rglob("*.md")})
    all_chunks = []

    for file_path in DOCS_PATH.rglob("*.md"):
        all_chunks.extend(process_file(file_path, run_id))

    all_chunks = deduplicate(all_chunks, run_id)

    CHUNKS_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2)

    print(f"Created {len(all_chunks)} chunks")

if __name__ == "__main__":
    main()

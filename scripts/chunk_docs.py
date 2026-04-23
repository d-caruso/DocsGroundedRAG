from pathlib import Path
import re
import json

DOCS_PATH = Path("data/docs")
OUTPUT_PATH = Path("data/chunks/chunks.json")

def split_by_headings(text):
    sections = re.split(r"\n(?=# )|\n(?=## )", text)
    return [s.strip() for s in sections if s.strip()]

def clean_text(text):
    # remove LLM instructions blocks (basic)
    text = re.sub(
        r"Instructions for LLMs:.*?(?=\n# |\n## |\Z)",
        "",
        text,
        flags=re.DOTALL
    )
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    return text.strip()

def remove_tables(text):
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if "|" in line:
            continue
        cleaned.append(line)
    return "\n".join(cleaned)

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

    # reassign ids after merge
    for i, chunk in enumerate(merged):
        source_stem = Path(chunk["metadata"]["source_file"]).stem
        chunk["id"] = f"{source_stem}_{i}"

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


def should_skip_chunk(text):
    skip_headings = [
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

    if starts_with_any_heading(text, skip_headings):
        return True

    if is_table_heavy_chunk(text):
        return True

    if is_code_heavy_chunk(text):
        return True

    if is_too_large(text):
        return True

    return False

def is_too_large(text, max_words=500):
    return word_count(text) > max_words

def split_by_h2(text):
    parts = re.split(r"\n(?=## )", text)
    return [p.strip() for p in parts if p.strip()]

def process_file(file_path):
    content = file_path.read_text(encoding="utf-8")
    content = clean_text(content)
    content = remove_tables(content)
    chunks = split_by_headings(content)

    results = []

    for chunk in chunks:
        if should_skip_chunk(chunk):
            continue

        split_chunks = split_large_chunk(chunk, max_words=500)

        for split_chunk in split_chunks:
            if word_count(split_chunk) > 450:
                sub_chunks = split_by_h2(split_chunk)
            else:
                sub_chunks = [split_chunk]

        for sub_chunk in sub_chunks:
            if should_skip_chunk(sub_chunk):
                continue

            results.append({
                "id": "",
                "content": sub_chunk,
                "metadata": {
                    "source_file": file_path.name,
                    "category": str(file_path.parent.relative_to(DOCS_PATH))
                }
            })
    results = merge_small_chunks(results)
    return results

def main():
    all_chunks = []

    for file_path in DOCS_PATH.rglob("*.md"):
        all_chunks.extend(process_file(file_path))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2)

    print(f"Created {len(all_chunks)} chunks")

if __name__ == "__main__":
    main()

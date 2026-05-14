import re


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


def noise_ratio(text: str) -> float:
    if not text:
        return 1.0
    non_alpha = sum(1 for c in text if not c.isalnum() and not c.isspace())
    return non_alpha / len(text)


def remove_tables(text: str) -> str:
    lines = text.splitlines()
    return "\n".join(line for line in lines if "|" not in line)

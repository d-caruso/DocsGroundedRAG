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

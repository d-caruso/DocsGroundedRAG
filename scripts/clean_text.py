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


# Vendored English stopword list (NLTK 'english' snapshot, ~180 words).
STOPWORDS: frozenset[str] = frozenset({
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
    "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
    "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "s", "t", "can",
    "will", "just", "don", "should", "now", "d", "ll", "m", "o", "re", "ve",
    "y", "ain", "aren", "couldn", "didn", "doesn", "hadn", "hasn", "haven",
    "isn", "ma", "mightn", "mustn", "needn", "shan", "shouldn", "wasn",
    "weren", "won", "wouldn",
})


def information_density(text: str) -> float:
    words = text.split()
    if not words:
        return 0.0
    meaningful = [w for w in words if w.lower() not in STOPWORDS]
    return len(meaningful) / len(words)


def remove_tables(text: str) -> str:
    lines = text.splitlines()
    return "\n".join(line for line in lines if "|" not in line)

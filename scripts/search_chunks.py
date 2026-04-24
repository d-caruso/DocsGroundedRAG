from pathlib import Path
import json
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_PATH = Path(__file__).resolve().parent.parent
CHUNKS_PATH = BASE_PATH / "data" / "chunks"
INPUT_PATH = CHUNKS_PATH / "chunks_with_embeddings.json"

TOP_K = 5

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

def cosine_similarity(a, b):
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b, axis=1, keepdims=True)
    return np.dot(b, a)

def main():
    query = input("Query: ").strip()

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    embeddings = np.array([chunk["embedding"] for chunk in chunks])
    query_embedding = model.encode(query)

    scores = cosine_similarity(query_embedding, embeddings)

    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True
    )[:TOP_K]

    print("\nTop results:\n")

    for i, (chunk, score) in enumerate(ranked, start=1):
        print(f"{i}. Score: {score:.4f}")
        print(f"File: {chunk['metadata']['source_file']}")
        print(f"Category: {chunk['metadata']['category']}")
        print(chunk["content"][:700].replace("\n", " "))
        print("-" * 80)


if __name__ == "__main__":
    main()

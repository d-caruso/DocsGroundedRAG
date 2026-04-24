from pathlib import Path
import json
from sentence_transformers import SentenceTransformer

BASE_PATH = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_PATH / "data"
CHUNKS_PATH = DATA_PATH / "chunks"

INPUT_PATH = CHUNKS_PATH / "chunks.json"
OUTPUT_PATH = CHUNKS_PATH / "chunks_with_embeddings.json"

model = SentenceTransformer("BAAI/bge-small-en-v1.5")

with open(INPUT_PATH, "r", encoding="utf-8") as f:
    chunks = json.load(f)

texts = [chunk["content"] for chunk in chunks]

embeddings = model.encode(texts, show_progress_bar=True)

for chunk, emb in zip(chunks, embeddings):
    chunk["embedding"] = emb.tolist()

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(chunks, f)

print(f"Saved {len(chunks)} chunks with embeddings")

from pathlib import Path
import json
import os
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

BASE_PATH = Path(__file__).resolve().parent.parent
CHUNKS_PATH = BASE_PATH / "data" / "chunks"
INPUT_PATH = CHUNKS_PATH / "chunks_with_embeddings.json"

TOP_K = 5
MODEL_NAME = "gemini-2.5-flash-lite"

load_dotenv(BASE_PATH / ".env")

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
generation_model = genai.GenerativeModel(MODEL_NAME)


def cosine_similarity(a, b):
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b, axis=1, keepdims=True)
    return np.dot(b, a)


def retrieve_chunks(query, chunks):
    embeddings = np.array([chunk["embedding"] for chunk in chunks])
    query_embedding = embedding_model.encode(query)

    scores = cosine_similarity(query_embedding, embeddings)

    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True
    )

    # --- DEDUPLICATION ---
    seen = set()
    unique_chunks = []

    for chunk, score in ranked:
        key = chunk["metadata"]["source_file"]
        if key not in seen:
            seen.add(key)
            unique_chunks.append((chunk, score))

    ranked = unique_chunks[:TOP_K]

    return ranked


def build_prompt(query, retrieved):
    context_parts = []

    for i, (chunk, score) in enumerate(retrieved, start=1):
        source = chunk["metadata"]["source_file"]
        category = chunk["metadata"]["category"]

        context_parts.append(
            f"[Source {i} | score={score:.4f} | file={source} | category={category}]\n"
            f"{chunk['content']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    return f"""
You are a technical documentation assistant.

Answer the user's question using ONLY the provided context.
If the answer is not present in the context, say:
"I could not find this information in the provided documentation."

Do not use external knowledge.
Do not guess.

Return your answer as JSON with this exact structure:
{{
  "answer": "...",
  "sources": ["source_file_1.md", "source_file_2.md"]
}}

Rules:
- "sources" must contain ONLY source_file names from the context
- Do not invent sources
- Do not include duplicates
- Use the exact file names as provided in the context
- Return ONLY valid JSON. No markdown, no explanations.

Context:
{context}

Question:
{query}
""".strip()


def main():
    query = input("Query: ").strip()

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    retrieved = retrieve_chunks(query, chunks)

    MIN_SIMILARITY_SCORE = 0.70

    best_score = retrieved[0][1] if retrieved else 0

    if best_score < MIN_SIMILARITY_SCORE:
        print(f"\n\033[38;5;208mQuery: {query}\033[0m")

        print("\nAnswer:\n")
        print("I could not find enough relevant information in the provided documentation.")

        return

    prompt = build_prompt(query, retrieved)

    response = generation_model.generate_content(prompt)

    raw_text = response.text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text.removeprefix("```json").strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.removeprefix("```").strip()

    if raw_text.endswith("```"):
        raw_text = raw_text.removesuffix("```").strip()

    # --- PARSE JSON ---
    try:
        response_json = json.loads(raw_text)
    except json.JSONDecodeError:
        print("\nInvalid JSON from LLM. Raw response:\n")
        print(raw_text)
        return

    final_answer = response_json["answer"]
    used_sources = response_json["sources"]

    print(f"\n\033[38;5;208mQuery: {query}\033[0m")
    print("\nAnswer:\n")
    print(final_answer)

    print("\nSources:\n")
    for chunk, score in retrieved:
        file = chunk["metadata"]["source_file"]
        if file in used_sources:
            print(f"{file} — score={score:.4f}")

if __name__ == "__main__":
    main()

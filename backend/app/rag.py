import json
import os

import google.generativeai as genai
from psycopg_pool import ConnectionPool
from sentence_transformers import SentenceTransformer

TOP_K = 5
MIN_SIMILARITY = 0.70
GENERATION_MODEL_NAME = "gemini-2.5-flash-lite"
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"

_embedding_model: SentenceTransformer | None = None
_generation_model: genai.GenerativeModel | None = None


def init() -> None:
    global _embedding_model, _generation_model
    _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    _generation_model = genai.GenerativeModel(GENERATION_MODEL_NAME)


def _retrieve(pool: ConnectionPool, query: str) -> list[tuple[str, dict, float]]:
    query_emb = _embedding_model.encode(query).tolist()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select content, metadata, 1 - (embedding <=> %s::vector) as score
            from chunks
            order by embedding <=> %s::vector
            limit %s
            """,
            (query_emb, query_emb, TOP_K * 4),
        )
        rows = cur.fetchall()

    seen: set[str] = set()
    unique: list[tuple[str, dict, float]] = []
    for content, metadata, score in rows:
        source = metadata["source_file"]
        if source not in seen:
            seen.add(source)
            unique.append((content, metadata, float(score)))
    return unique[:TOP_K]


def _build_prompt(query: str, retrieved: list[tuple[str, dict, float]]) -> str:
    context_parts = []
    for i, (content, metadata, score) in enumerate(retrieved, start=1):
        source = metadata["source_file"]
        category = metadata["category"]
        context_parts.append(
            f"[Source {i} | score={score:.4f} | file={source} | category={category}]\n{content}"
        )
    context = "\n\n---\n\n".join(context_parts)

    return f"""You are a technical documentation assistant.

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
{query}"""


def _strip_json_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw.removeprefix("```json").strip()
    if raw.startswith("```"):
        raw = raw.removeprefix("```").strip()
    if raw.endswith("```"):
        raw = raw.removesuffix("```").strip()
    return raw


def answer_query(pool: ConnectionPool, query: str) -> dict:
    retrieved = _retrieve(pool, query)

    if not retrieved or retrieved[0][2] < MIN_SIMILARITY:
        return {
            "answer": "I could not find this information in the provided documentation.",
            "sources": [],
        }

    prompt = _build_prompt(query, retrieved)
    response = _generation_model.generate_content(prompt)
    raw = _strip_json_fences(response.text)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {
            "answer": "The model returned a response that could not be parsed. Please try again.",
            "sources": [],
        }

    used = set(parsed.get("sources", []))
    sources = [
        {
            "file": metadata["source_file"],
            "category": metadata["category"],
            "score": score,
        }
        for _, metadata, score in retrieved
        if metadata["source_file"] in used
    ]

    return {"answer": parsed.get("answer", ""), "sources": sources}

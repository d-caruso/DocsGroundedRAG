import json
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from pgvector.psycopg import register_vector

BASE_PATH = Path(__file__).resolve().parent.parent
INPUT_PATH = BASE_PATH / "data" / "chunks" / "chunks_with_embeddings.json"

load_dotenv(BASE_PATH / ".env")

DB_URL = os.environ["SUPABASE_DB_URL"]


def main():
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"Loaded {len(chunks)} chunks from {INPUT_PATH.name}")

    batch_sources = sorted({chunk["metadata"]["source_file"] for chunk in chunks})

    rows = [
        (
            chunk["content"],
            json.dumps(chunk["metadata"]),
            chunk["embedding"],
        )
        for chunk in chunks
    ]

    with psycopg.connect(DB_URL) as conn:
        register_vector(conn)

        with conn.cursor() as cur:
            cur.execute(
                "delete from chunks where metadata->>'source_file' = any(%s)",
                (batch_sources,),
            )
            print(f"Deleted existing rows for {len(batch_sources)} source file(s)")

            cur.executemany(
                "insert into chunks (content, metadata, embedding) values (%s, %s::jsonb, %s)",
                rows,
            )

            cur.execute("select count(*) from chunks")
            print(f"Inserted {cur.fetchone()[0]} rows")

            cur.execute(
                "select content, metadata, vector_dims(embedding) as dim from chunks limit 1"
            )
            content, metadata, dim = cur.fetchone()
            print(f"Sample row: dim={dim}, source={metadata.get('source_file')}")


if __name__ == "__main__":
    main()

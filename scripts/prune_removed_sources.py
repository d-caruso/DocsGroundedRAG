import json
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent.parent
DOCS = BASE / "data" / "docs"
CHUNKS = BASE / "data" / "chunks" / "chunks.json"
REJECTED = BASE / "data" / "chunks" / "rejected.jsonl"

load_dotenv(BASE / ".env")
DB_URL = os.environ["SUPABASE_DB_URL"]


def existing_sources() -> set[str]:
    return {p.name for p in DOCS.rglob("*.md")}


def main() -> None:
    keep = existing_sources()

    if CHUNKS.exists():
        rows = json.loads(CHUNKS.read_text(encoding="utf-8"))
        CHUNKS.write_text(
            json.dumps([r for r in rows if r["metadata"]["source_file"] in keep], indent=2),
            encoding="utf-8",
        )

    if REJECTED.exists():
        kept = [
            line
            for line in REJECTED.read_text(encoding="utf-8").splitlines()
            if json.loads(line)["source_file"] in keep
        ]
        REJECTED.write_text("\n".join(kept) + ("\n" if kept else ""), encoding="utf-8")

    with psycopg.connect(DB_URL) as conn, conn.cursor() as cur:
        cur.execute(
            "delete from chunks where metadata->>'source_file' <> all(%s)",
            (sorted(keep),),
        )


if __name__ == "__main__":
    main()

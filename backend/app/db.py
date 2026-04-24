import os

from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=os.environ["SUPABASE_DB_URL"],
            min_size=1,
            max_size=4,
            configure=register_vector,
        )
    return _pool

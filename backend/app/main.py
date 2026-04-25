from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app import rag
from app.db import get_pool

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag.init()
    get_pool()
    yield


app = FastAPI(title="DocsGroundedRAG API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://dgrag.domenicocaruso.com",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    min_similarity: float | None = Field(default=None, ge=0.0, le=1.0)


class ChunkMetadata(BaseModel):
    source_file: str
    category: str
    title: str | None = None
    section: str | None = None
    url: str | None = None


class Chunk(BaseModel):
    id: str
    score: float
    content: str
    excerpt: str
    metadata: ChunkMetadata


class QueryResponse(BaseModel):
    answer: str
    chunks: list[Chunk]


@app.get("/")
def root():
    return {"service": "DocsGroundedRAG API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
@limiter.limit("10/minute")
def query(request: Request, body: QueryRequest):
    return rag.answer_query(get_pool(), body.query, body.min_similarity)

from fastapi import FastAPI

app = FastAPI(title="DocsGroundedRAG API")


@app.get("/")
def root():
    return {"service": "DocsGroundedRAG API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}

---
title: DocsGroundedRAG API
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# DocsGroundedRAG — Backend API

FastAPI backend for [DocsGroundedRAG](https://github.com/d-caruso/DocsGroundedRAG), a Retrieval-Augmented Generation system over a curated Stripe documentation corpus.

This Space hosts only the API. The full project (ingestion scripts, data, frontend) lives on GitHub.

## Endpoints

- `GET /health` — liveness probe
- `GET /` — service info

## Local development

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 7860
```

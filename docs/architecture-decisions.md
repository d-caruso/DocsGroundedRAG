# Architecture Decisions

DocsGroundedRAG is a Retrieval-Augmented Generation system over a curated subset of Stripe API documentation. This document records the architectural choices made while building it and the alternatives rejected along the way.

## Final stack

- **Frontend:** React + Vite + Mantine → Vercel
- **Backend:** FastAPI (Python 3.12) → Hugging Face Spaces (Docker)
- **Vector DB:** Supabase Postgres + `pgvector`
- **LLM:** Google Gemini 2.5 Flash Lite
- **Embedding model:** `BAAI/bge-small-en-v1.5` (local sentence-transformers) — *see §6*
- **Auth:** none (public demo, IP rate-limited)

**Live:** API at `https://d-caruso-dgrag-api.hf.space` · Frontend at `https://dgrag.domenicocaruso.com` (pending) · Source at `https://github.com/d-caruso/DocsGroundedRAG`

---

## 1. Frontend framework — Vite + React + Mantine

**Chosen:** Vite + React, styled with Mantine.
**Rejected:** Next.js.

FastAPI already owns routing, data access, and secret handling. Next.js's main superpowers — Server Components, Route Handlers as a BFF, SSR — would be unused weight in this shape. A Vite SPA ships faster, deploys as static assets on any CDN free tier, and keeps the dev loop minimal. Mantine provides chat-appropriate primitives (AppShell, ScrollArea, Code, Notifications) with zero CSS work.

**Tradeoff accepted:** no SEO and no server-rendered auth gating. Neither matters for a single-page chat UI.

## 2. Backend framework — FastAPI

**Chosen:** FastAPI.
**Rejected:** NestJS (Node/TypeScript).

The RAG pipeline is already Python — `sentence-transformers`, `google-generativeai`, and the retrieval/prompt logic all live in `scripts/`. Switching to Nest would mean rewriting ML glue code in TypeScript and abandoning the Python ecosystem that dominates RAG tooling. For a 2–3 endpoint API, Nest's DI + module ceremony is overhead without payoff.

**Tradeoff accepted:** two languages in the monorepo (Python + TypeScript), each isolated to its own directory.

## 3. Backend hosting — Hugging Face Spaces (Docker)

**Chosen:** Hugging Face Spaces, Docker SDK, CPU basic tier (free).
**Rejected:** Render free, Fly.io, Vercel, Google Cloud Run, Oracle Cloud Always Free.

Each rejection had a specific reason:

- **Render free** — spins down after 15 min idle; cold start with a local ML model pushes first-request latency to ~30–50s. Unacceptable for a recruiter landing on the page.
- **Fly.io** — no real free tier as of 2026, only a limited trial.
- **Vercel** — Python runs as serverless functions with per-invocation model loads and hard execution-time limits; the stateful "load model once, reuse across requests" shape doesn't fit.
- **Cloud Run** — viable but requires a billing card, Docker fluency, and still has 2–5s cold starts at `min-instances=0`. Keeping a warm instance exceeds the free compute allocation.
- **Oracle Cloud Always Free** — truly always-on and free, but requires running a Linux VM (systemd, reverse proxy, TLS) and has no static IP on the free tier, solvable only via Cloudflare Tunnel. Ops complexity not worth it for one demo.

HF Spaces is the only $0 option that (a) tolerates a stateful Python process with a loaded model, (b) handles HTTPS and deploy pipeline without extra infrastructure, and (c) signals "ML demo" to reviewers — which is exactly the audience for this project.

**Tradeoff accepted:** the Space sleeps after ~48h inactivity; wake-up on first request is ~5–10s. The URL is `*.hf.space` until a custom subdomain is added via a Cloudflare Worker proxy (deferred).

## 4. Vector DB — Supabase (Postgres + pgvector)

**Chosen:** Supabase free tier, with `pgvector`.
**Rejected:** Neon, local Postgres in Docker.

The corpus is tiny (<5 MB of chunks + embeddings), so capacity isn't the deciding factor — ergonomics are. Supabase bundles Postgres, `pgvector`, and Auth behind one managed service with a real free tier. Neon is comparable on Postgres but lacks bundled auth; local Postgres means self-hosting the DB for any public deploy.

**Tradeoff accepted:** free-tier projects pause after 7 days of inactivity. Mitigated by a scheduled `SELECT 1;` ping from GitHub Actions.

## 5. LLM — Google Gemini 2.5 Flash Lite

**Chosen:** `gemini-2.5-flash-lite` via `google-generativeai`.
**Rejected:** OpenAI GPT, Anthropic Claude.

Already integrated in the ingestion pipeline (`scripts/rag_answer.py`), has a generous free tier for demo-level traffic, and returns structured JSON reliably enough that the grounding contract (`{answer, sources}`) holds without heavy post-processing.

**Tradeoff accepted:** vendor lock-in to Google for generation. The prompt template itself is portable — swapping providers is a ~20-line change.

## 6. Embedding model — *decision deferred*

**Current:** `BAAI/bge-small-en-v1.5` via `sentence-transformers` (384-dim, ~133 MB weights).
**Candidate:** Gemini `text-embedding-004` via API (768-dim, hosted).

The swap is motivated by the backend RAM footprint of loading a local model: estimated 400–600 MB RSS with PyTorch runtime, which would dominate cold-start time and push against the free-tier memory ceiling. The exact figure has not been measured on the running container yet, so the decision is pending.

**Why this matters:** query-time embeddings must be produced by the *same* model as the chunks, otherwise retrieval silently degrades. Swapping means re-embedding the corpus once and updating the `pgvector` column to 768-dim.

**Resolution path:** measure actual process RSS after `sentence-transformers` load on the HF Space; if it fits comfortably under the tier's memory budget with cold starts under ~5s, keep the local model. Otherwise swap to Gemini embeddings.

## 7. Repo layout — monorepo with `backend/` subdirectory

**Chosen:** Single GitHub repo; `backend/` subdirectory pushed to HF Space via `git subtree`.
**Rejected:** Two separate repos (GitHub for source, HF for the Space).

A reviewer cloning the repo sees the full system — ingestion scripts, backend, frontend, data — in one place. `git subtree push --prefix=backend hf main` exports only the backend slice to HF, so the Space doesn't rebuild on unrelated (frontend, docs) changes. GitHub remains the source of truth; HF is a deploy target.

**Tradeoff accepted:** slightly awkward push command, and the first push to an HF-initialized repo requires a one-time force-push to reconcile unrelated histories.

## 8. Authentication — none

**Chosen:** Public, unauthenticated API; IP-based rate limiting via `slowapi` (10 req/min).
**Rejected:** Supabase Auth, Clerk, any identity layer.

The demo has no per-user state and no need to gate access. Rate limiting prevents trivial abuse of the Gemini API key; a monthly spend cap in the Gemini dashboard is the defense-in-depth layer.

**Tradeoff accepted:** cannot attribute usage or build user-scoped features without adding auth later. Both are out of scope.

## 9. Streaming responses — deferred to v2

**Chosen:** Synchronous JSON response from `/query`.
**Rejected:** Server-Sent Events for token-by-token streaming.

Gemini Flash Lite returns short grounded answers in roughly 1–2 seconds. A spinner covers that latency cleanly; streaming would add frontend complexity (EventSource handling, partial-render state) for marginal perceived-latency gains. Can be added later without breaking the API contract.

**Tradeoff accepted:** on slower networks or longer answers, the user sees a spinner for the full duration.

---

## Deferred / open

- **Custom subdomain** for the API (`api.dgrag.domenicocaruso.com`) — requires a Cloudflare Worker proxy in front of the `.hf.space` URL. Deferred until the core pipeline is shipping real queries.
- **Observability** — Langfuse free tier is the likely pick for RAG-aware tracing (retrieval + generation in one trace), but not wired up yet.
- **Frontend** — Vite + React + Mantine scaffold not yet started; currently only the backend stub is deployed.
- **Embedding model final call** — see §6.

# DocsGroundedRAG — Implementation Plan

This document outlines the minimal, production-relevant phases to build the system. Each phase focuses on correctness and clarity over scale.

## Main phases:

1. Select a limited Stripe docs subset
2. Prepare and chunk the documents
3. Generate embeddings and store them
4. Implement retrieval (similarity search)
5. Build prompt + grounded generation
6. Create basic UI (chat + sources panel)
7. Prepare demo queries and failure cases

---

## 1. Select a Limited Stripe Docs Subset

**Goal:** Define a small, coherent corpus that is sufficient to demonstrate retrieval and grounding.

**Scope guidelines**

* Target 40-50 pages total
* Prefer high-signal sections used in real workflows
* Avoid ingesting the entire documentation

**Recommended topics**

* Payments / Payment Intents
* Customers
* Subscriptions
* Checkout
* Webhooks
* Authentication
* Idempotency
* Error handling

**Acquisition options**

* Manual copy into `.md` files (fastest, most reliable)
* Light scraping of selected pages

**Output**

* Folder of clean text/markdown files
* One file per page/section

---

## 2. Prepare and Chunk the Documents

**Goal:** Convert raw docs into semantically meaningful chunks suitable for retrieval.

**Principles**

* Chunk by **section/heading**, not fixed size
* Preserve context: include section titles in each chunk
* Keep chunks self-contained

**Chunk size**

* 200–500 words (typical)
* Include short code examples when relevant

**Metadata per chunk**

* `source`: "stripe_docs"
* `title`: section title
* `section`: high-level topic (e.g., "Payment Intents")
* `url`: original page
* `path`: local file path

**Output**

* Structured records (JSON/DB rows): `{id, content, metadata}`

---

## 3. Generate Embeddings and Store Them

**Goal:** Represent each chunk as a vector and persist it for fast similarity search.

**Steps**

1. Choose an embedding model
2. Generate embeddings for all chunks
3. Store vectors + metadata in a database

**Storage options**

* Postgres with `pgvector`
* Lightweight vector DB (e.g., local)

**Schema (example)**

* `id` (uuid)
* `content` (text)
* `embedding` (vector)
* `metadata` (jsonb)

**Notes**

* Keep embeddings and metadata in the same table for simplicity
* Batch embedding generation for speed

---

## 4. Implement Retrieval (Similarity Search)

**Goal:** Given a user query, retrieve the most relevant chunks.

**Pipeline**

1. Embed the user query
2. Perform similarity search against stored vectors
3. Return top-k results

**Defaults**

* `top_k = 5`
* cosine similarity

**Enhancements (optional)**

* Metadata filtering (e.g., by topic)
* Basic reranking (if needed)

**Output**

* List of chunks with scores and metadata

---

## 5. Build Prompt + Grounded Generation

**Goal:** Constrain the language model to answer using only retrieved context.

**Prompt structure**

```
You are an assistant for Stripe API documentation.

Answer ONLY using the provided context.
If the answer is not in the context, say:
"I could not find this information in the provided documentation."

Context:
{retrieved_chunks}

Question:
{user_query}

Answer:
```

**Key rules**

* No external knowledge
* No guessing
* Explicit failure when context is insufficient

**Output**

* Final answer
* Optional: list of cited sources (from metadata)

---

## 6. Create Basic UI (Chat + Sources Panel)

**Goal:** Provide a simple interface that exposes both answers and retrieval evidence.

**Core components**

* Chat input/output (center)
* Sources panel (side)

**Sources panel should show**

* Chunk title
* Short excerpt
* Similarity score (optional)
* Link/reference to original doc

**UX considerations**

* Streaming responses (optional)
* Clear separation between answer and sources
* Toggle to show/hide context

---

## 7. Prepare Demo Queries and Failure Cases

**Goal:** Demonstrate correctness, grounding, and system limitations.

**Good queries**

* Task-oriented (e.g., creating a payment)
* Conceptual (e.g., idempotency)
* Comparative (e.g., Checkout vs Payment Intents)

**Failure cases**

* Ask about topics not in the dataset
* Verify the system returns a "not found" response

**Demo checklist**

* Show retrieved chunks
* Show grounded answer
* Show at least one failure case

---

## Outcome

At the end of these phases, the system should:

* Retrieve relevant documentation sections
* Generate answers grounded in those sections
* Expose sources to the user
* Refuse to answer when information is missing

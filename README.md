# DocsGroundedRAG

## Overview

**DocsGroundedRAG** is a Retrieval-Augmented Generation (RAG) system designed to answer questions over technical documentation by grounding responses in a curated corpus.

The system uses a subset of Stripe API documentation as its demonstration dataset, but the architecture is domain-agnostic and can be applied to any structured or semi-structured documentation.

---

## Core Idea

Instead of relying on a language model’s pretrained knowledge, the system:

1. Retrieves relevant documentation sections at query time
2. Injects them into the model context
3. Constrains the model to generate answers only from that context

This reduces hallucinations and ensures answers are traceable to source documents.

---

## Architecture Overview

### 1. Ingestion Layer

* Documentation pages are collected and converted into text
* Content is split into semantically meaningful chunks (e.g., sections)
* Each chunk is enriched with metadata (title, section, source, URL)

---

### 2. Embedding & Storage

* Each chunk is transformed into a vector representation (embedding)
* Embeddings are stored in a vector database (e.g., pgvector)
* Metadata is stored alongside vectors for filtering and citation

---

### 3. Retrieval Layer

* User queries are embedded into the same vector space
* Similarity search retrieves the top-k most relevant chunks
* Optional filtering (e.g., by topic or endpoint) can be applied

---

### 4. Generation Layer

* Retrieved chunks are injected into the model prompt
* The model is instructed to:

  * Answer only from provided context
  * Avoid using external knowledge
  * Explicitly state when information is missing

---

### 5. Interface Layer

* Chat-based interface for user queries
* Side panel displaying:

  * Retrieved chunks
  * Source sections
  * Similarity scores
* Answers include references to the originating documentation

---

## Key Properties

* **Grounded responses**: answers are tied to explicit source content
* **Traceability**: users can inspect the exact text used
* **Domain control**: knowledge is limited to the indexed corpus
* **Model-agnostic**: works with any LLM capable of text generation
* **Updatable knowledge**: updating the corpus updates system behavior without retraining

---

## Scope

The current implementation focuses on Stripe API documentation, covering:

* Payments
* Customers
* Subscriptions
* Webhooks
* Authentication and error handling

The system is intentionally scoped to a small, curated dataset to emphasize retrieval quality and explainability over scale.

---

## Goal

The project demonstrates how to transform static documentation into a **queryable, grounded knowledge system**, enabling task-oriented answers instead of manual document search and navigation.

# DocsGroundedRAG — Chat UI Implementation Analysis

## Context

The project has a complete RAG pipeline (chunking, embedding, retrieval, Gemini generation) implemented in Python scripts, and a FastAPI backend stub deployed to HF Spaces. The frontend does not exist yet. This plan covers how to build the chat-based interface from scratch using **Vite + React + TypeScript + Mantine**, with particular attention to:
- Which UI elements are necessary and why
- How to handle loading latency (no streaming; synchronous JSON response)
- How to handle potentially long model responses

---

## Critical Pre-condition: API Contract

Before any UI work is meaningful, the `/query` endpoint must return **richer data** than the scripts currently output. The current `rag_answer.py` returns `{answer, sources}` where `sources` is a list of filenames. The UI sources panel needs chunk-level detail.

**Required `/query` response shape:**
```json
{
  "answer": "string — full grounded answer from Gemini",
  "chunks": [
    {
      "id": "string",
      "score": 0.87,
      "content": "string — full chunk text",
      "excerpt": "string — first ~200 chars for preview",
      "metadata": {
        "source_file": "payments/payment-intents.md",
        "category": "payments",
        "title": "Creating a PaymentIntent",
        "section": "Payment Intents",
        "url": "https://stripe.com/docs/payments/payment-intents"
      }
    }
  ]
}
```

This contract must be agreed before Phase 5 begins (Sources Panel). The frontend can mock it during development.

---

## Necessary UI Elements

### Chat Panel (center)
| Element | Component | Purpose |
|---|---|---|
| Message list | `ScrollArea` + message stack | Scrollable history of turns |
| User message bubble | `Paper` + `Text` | Right-aligned, distinct background |
| Assistant message bubble | `Paper` + Markdown renderer | Left-aligned, supports code blocks |
| Loading skeleton bubble | `Skeleton` (3 animated lines) | Shown while awaiting API response |
| Error inline message | `Alert` (color=red) | API/network failures in context |
| Empty/welcome state | `Stack` + `Text` + sample chips | Onboarding, reduces blank-screen anxiety |
| Input textarea | `Textarea` (autosize) | Grows with multi-line queries; always enabled |
| Send button | `ActionIcon` | Submits; shows `Loader` during request or warm-up |

### Sources Panel (right aside)
| Element | Component | Purpose |
|---|---|---|
| Panel container | `AppShell.Aside` (desktop) / `Drawer` (mobile) | Houses retrieved chunks |
| Source card | `Card` | One card per returned chunk |
| Score badge | `Badge` (color varies by score) | Visual retrieval confidence |
| Excerpt text | `Text` (lineClamp=3) | Truncated chunk preview |
| Section label | `Text` (dimmed, size=xs) | category / section breadcrumb |
| "View source" link | `Anchor` | Opens original Stripe docs URL |
| Empty state | `Text` (dimmed) | "No sources yet — ask a question" |

### Global Shell
| Element | Component | Purpose |
|---|---|---|
| App shell | `AppShell` (header + main + aside) | Responsive two-column layout |
| Header | `AppShell.Header` | Logo, project name, theme toggle |
| Color scheme toggle | `ActionIcon` + `useMantineColorScheme` | Dark / light |

---

## Loading Time Strategy

The backend is on HF Spaces, which can sleep and wake in ~5–10s. Normal requests: ~1–2s.

### Warm-up health check

On app mount, `App.tsx` calls `checkHealth()` and tracks its resolution in state (`backendReady: boolean`, initially `false`). This starts waking the HF Space before the user types, and gates the send button on the result:

```ts
// src/App.tsx
useEffect(() => {
  checkHealth().then(() => dispatch({ type: 'SET_BACKEND_READY' }));
}, []);
```

**While `backendReady === false`:**
- `Textarea` is **enabled** — user can type their question while waiting.
- Send `ActionIcon` is **disabled** + shows a `Loader` spinner instead of the send icon.
- On hover over the disabled button: a Mantine `Tooltip` reads *"Warming up…"*.
- No banner, no toast, no other UI change.

**Once `backendReady === true`:**
- Send button becomes active and shows the send icon.
- If the user has already typed a question, they can submit immediately.

### Loading during query

- The skeleton bubble appears immediately after the user sends — it covers the full wait duration.
- All loading state lives in the message object: `{role: 'assistant', status: 'loading' | 'done' | 'error'}`.
- Send button is also disabled while any message has `status: 'loading'` (reuses the same disabled + spinner pattern).

---

## Long Response Strategy

Gemini is instructed to be concise, but answers can still be multi-paragraph with code blocks.

- Render with **react-markdown** + `@mantine/code-highlight` for code blocks — no custom parser needed.
- Message bubbles have `max-height: 60vh` with `overflow: auto` (Mantine `ScrollArea` inside the bubble) — user can scroll within a single answer without the whole page moving.
- A **"Copy answer"** `ActionIcon` (clipboard) on each assistant bubble improves UX for long code-heavy responses.
- No "Show more / collapse" truncation — RAG answers are grounded and purposeful; truncating them undermines the system's core value proposition.

---

## State Shape

```ts
// src/types.ts
interface SourceChunk {
  id: string;
  score: number;
  excerpt: string;
  content: string;
  metadata: {
    source_file: string;
    category: string;
    title: string;
    section: string;
    url: string;
  };
}

type MessageStatus = 'done' | 'loading' | 'error';

interface Message {
  id: string;           // crypto.randomUUID()
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  chunks: SourceChunk[];  // populated on assistant messages
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  backendReady: boolean;  // false until health check resolves; gates send button
}
```

State managed with `useReducer` in `App.tsx` — no external store needed for MVP.

---

## File / Folder Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx                   # MantineProvider, theme, app mount
    ├── App.tsx                    # AppShell, useReducer, orchestration
    ├── types.ts                   # Message, SourceChunk, ChatState
    ├── api/
    │   └── query.ts               # postQuery(), checkHealth(), mock fixture
    ├── components/
    │   ├── ChatInput.tsx          # Textarea + send ActionIcon
    │   ├── MessageList.tsx        # ScrollArea, auto-scroll, empty state
    │   ├── ChatMessage.tsx        # user and assistant bubble variants
    │   ├── SkeletonMessage.tsx    # loading placeholder bubble
    │   └── SourcesPanel/
    │       ├── index.tsx          # Aside (desktop) / Drawer (mobile)
    │       └── SourceCard.tsx
    └── theme.ts                   # Mantine theme overrides
```

---

## Phases

### Phase 1 — Project Scaffold
**Depends on:** nothing
**Enables:** all subsequent phases

| # | Task | Detail |
|---|---|---|
| 1.1 | Init Vite + React + TS | `npm create vite@latest frontend -- --template react-ts` |
| 1.2 | Install Mantine | `@mantine/core @mantine/hooks @mantine/code-highlight @mantine/notifications` + PostCSS |
| 1.3 | Configure MantineProvider | Wrap in `main.tsx`; add `ColorSchemeScript` in `index.html` |
| 1.4 | Set up env vars | `VITE_API_URL` pointing at `https://d-caruso-dgrag-api.hf.space` |
| 1.5 | Scaffold AppShell | Header + main content area + aside placeholder — no logic yet |
| 1.6 | Add `vercel.json` | SPA rewrite rule (`"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`) |

---

### Phase 2 — API Client & Types
**Depends on:** Phase 1
**Enables:** Phase 4, Phase 5 (wiring real data)
**Parallel with:** Phase 3

| # | Task | Detail |
|---|---|---|
| 2.1 | Define `types.ts` | `Message`, `SourceChunk`, `ChatState`, `QueryRequest`, `QueryResponse` |
| 2.2 | Write `api/query.ts` | `postQuery(question: string): Promise<QueryResponse>` using `fetch` with `AbortController` |
| 2.3 | Write health check | `checkHealth(): Promise<void>` — `GET /health`, resolves on 200, rejects on error; called on mount to gate the send button |
| 2.4 | Mock API response | Export `mockQueryResponse` fixture matching the contract — used during Phase 3 development before backend is ready |
| 2.5 | Error normalisation | Convert HTTP errors and network errors to a uniform `ApiError` type |

---

### Phase 3 — Core Chat Components
**Depends on:** Phase 1
**Enables:** Phase 4, Phase 5, Phase 6
**Parallel with:** Phase 2

| # | Task | Detail |
|---|---|---|
| 3.1 | `ChatMessage.tsx` | User bubble (right, filled bg) and assistant bubble (left, subtle bg); accepts `Message` prop |
| 3.2 | `SkeletonMessage.tsx` | Three `Skeleton` lines at 90%/70%/40% width, left-aligned, same width as assistant bubble |
| 3.3 | `MessageList.tsx` | `ScrollArea` with `ref` for auto-scroll; renders message list + skeleton when `isLoading`; empty state when `messages.length === 0` |
| 3.4 | `ChatInput.tsx` | `Textarea` (autosize, max 5 rows) + `ActionIcon` (send icon / `Loader` when loading); `onSubmit` callback |
| 3.5 | Wire `useReducer` in `App.tsx` | Actions: `SEND_MESSAGE`, `SET_LOADING`, `RECEIVE_RESPONSE`, `SET_ERROR`, `SET_BACKEND_READY` |
| 3.6 | Auto-scroll | `useEffect` on `messages` length: `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` |

---

### Phase 4 — Loading & UX States
**Depends on:** Phase 2 + Phase 3
**Enables:** Phase 7

| # | Task | Detail |
|---|---|---|
| 4.1 | Health warm-up on mount | `useEffect` in `App.tsx`: call `checkHealth().then(() => dispatch({ type: 'SET_BACKEND_READY' }))` — sets `backendReady: true` when the backend responds |
| 4.2 | Send button warm-up state | `ChatInput` send `ActionIcon`: disabled + shows `Loader` when `!backendReady \|\| isLoading`; shows send icon otherwise; Mantine `Tooltip` wraps it with label *"Warming up…"* (visible only while disabled due to warm-up) |
| 4.3 | Per-message error state | `ChatMessage` renders `Alert` (red, compact) when `message.status === 'error'`; includes retry affordance |
| 4.4 | Input disabled state | `ChatInput` `Textarea` is always enabled; only the send button is gated |
| 4.5 | Welcome / empty state | Shown when `messages.length === 0`; 3 sample query chips (`UnstyledButton`) that pre-fill the input |
| 4.6 | Request timeout | `AbortController` with 30s timeout; maps to error message in chat |

---

### Phase 5 — Sources Panel
**Depends on:** Phase 2 + Phase 3
**Enables:** Phase 7
**Parallel with:** Phase 4

| # | Task | Detail |
|---|---|---|
| 5.1 | `SourceCard.tsx` | `Card` with: score `Badge` (green ≥ 0.85, yellow ≥ 0.70, grey < 0.70), section label, title, excerpt (`lineClamp=3`), "View source" `Anchor` |
| 5.2 | `SourcesPanel/index.tsx` | Desktop: `AppShell.Aside` (fixed width 320px); always shows chunks from the **latest assistant message** |
| 5.3 | Mobile drawer | Use `useMediaQuery('(max-width: 768px)')` to swap Aside → `Drawer`; trigger via a "Sources (N)" button in the assistant bubble |
| 5.4 | Panel empty state | Dimmed text: "Sources will appear here after your first question" |
| 5.5 | Score colour logic | Helper `scoreToColor(score: number): MantineColor` used in `SourceCard` badge |

---

### Phase 6 — Long Response Handling
**Depends on:** Phase 3
**Enables:** Phase 7
**Parallel with:** Phases 4 & 5

| # | Task | Detail |
|---|---|---|
| 6.1 | Markdown rendering | Install `react-markdown`; render inside assistant bubble; remark-gfm for tables |
| 6.2 | Code block styling | `@mantine/code-highlight` `CodeHighlight` component as custom renderer for `<code>` blocks |
| 6.3 | Bubble scroll area | Wrap assistant bubble content in `ScrollArea` with `max-height: 60vh` so long answers scroll within the bubble |
| 6.4 | Copy button | `ActionIcon` in top-right of assistant bubble; uses `navigator.clipboard.writeText(message.content)` |
| 6.5 | Timestamp | Dimmed `Text` (size=xs) below each bubble: formatted with `Intl.DateTimeFormat` |

---

### Phase 7 — Polish & Responsiveness
**Depends on:** Phases 4 + 5 + 6
**Enables:** deployment

| # | Task | Detail |
|---|---|---|
| 7.1 | Responsive layout | `AppShell` `aside={{ width: 320, breakpoint: 'md' }}` hides aside on mobile automatically |
| 7.2 | Dark / light toggle | `useMantineColorScheme()` in header `ActionIcon`; persisted to `localStorage` via Mantine |
| 7.3 | Theme overrides | `theme.ts`: custom `fontFamily`, primary color, `defaultRadius: 'md'` |
| 7.4 | Page metadata | `<title>DocsGroundedRAG</title>`, favicon, OG tags in `index.html` |
| 7.5 | Accessibility | `aria-label` on all icon buttons; `role="log"` on message list; focus returns to input after send |
| 7.6 | Error boundary | React `ErrorBoundary` wrapping the shell; fallback to a simple reconnect prompt |

---

## Phase Dependency Map

```
Phase 1 (Scaffold)
    │
    ├──────────────────────────────────────────┐
    ▼                                          ▼
Phase 2 (API Client)               Phase 3 (Core Chat)
    │                                          │
    └──────────────┬───────────────────────────┘
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
    Phase 4    Phase 5    Phase 6
  (Loading)  (Sources)  (Markdown)
         │         │         │
         └─────────┴─────────┘
                   │
                   ▼
            Phase 7 (Polish)
```

- **Phases 2 and 3** can be developed in parallel after Phase 1.
- **Phases 4, 5, and 6** can be developed in parallel after Phases 2 + 3 are complete (note: 6 only needs Phase 3).
- **Phase 7** requires all of 4, 5, 6 to be complete.

---

## Verification

| Check | How |
|---|---|
| Scaffold renders | `npm run dev` → AppShell visible at localhost:5173 |
| API client works | Send a message → DevTools Network shows POST /query → response displayed |
| Loading state | Throttle network in DevTools to Slow 3G → skeleton bubble appears, send button disabled |
| Warm-up button state | Throttle network in DevTools → reload page → send button shows spinner; hover shows "Warming up…"; textarea remains typeable; button activates when health check resolves |
| Sources panel | Response arrives → SourceCards render with scores and excerpts |
| Mobile layout | DevTools → iPhone 12 → Sources Aside hidden, "Sources (N)" button on bubble → Drawer opens |
| Long response | Paste a query returning multi-paragraph answer → bubble scrolls internally, copy button works |
| Dark mode | Click theme toggle → full UI switches, preference persists on reload |

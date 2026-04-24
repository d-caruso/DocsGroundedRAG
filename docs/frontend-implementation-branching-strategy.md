# Frontend Implementation — Branching Strategy

Branching plan for `docs/frontend-implementation-plan.md`.
Follows the rules in `BRANCHING_STRATEGY.md`.

---

## Feature Branch

```
develop
└── feature/frontend        ← root of all frontend work; merges to develop
```

Created from `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/frontend
```

---

## Phase Execution Order

```
feature/frontend
│
├── [1] Phase 1 — Scaffold          ← must complete and merge first
│
├── [2 ‖ 3] Phase 2 — API Client    ← parallel after Phase 1 merges
│           Phase 3 — Core Chat     ← parallel after Phase 1 merges
│
├── [4 ‖ 5 ‖ 6] Phase 4 — Loading   ← parallel after Phases 2+3 merge
│               Phase 5 — Sources   ← parallel after Phases 2+3 merge
│               Phase 6 — Markdown  ← parallel after Phases 2+3 merge
│
└── [7] Phase 7 — Polish            ← must wait for Phases 4+5+6 to merge
```

`‖` = branches run in parallel.
Sequential constraint: each group cannot start until the prior group's branches are **all merged** back to `feature/frontend`.

---

## Full Branch Tree

```
feature/frontend
├── feature/frontend-Phase1-scaffold
│   ├── task/frontend-Task1.1-vite-init
│   ├── task/frontend-Task1.2-mantine-install
│   ├── task/frontend-Task1.3-mantine-provider
│   ├── task/frontend-Task1.4-env-vars
│   ├── task/frontend-Task1.5-appshell-scaffold
│   └── task/frontend-Task1.6-vercel-config
│
├── feature/frontend-Phase2-api-client          ← parallel with Phase3
│   ├── task/frontend-Task2.1-types
│   ├── task/frontend-Task2.2-post-query
│   ├── task/frontend-Task2.3-health-check
│   ├── task/frontend-Task2.4-mock-fixture
│   └── task/frontend-Task2.5-error-normalisation
│
├── feature/frontend-Phase3-core-chat           ← parallel with Phase2
│   ├── task/frontend-Task3.1-chat-message
│   ├── task/frontend-Task3.2-skeleton-message
│   ├── task/frontend-Task3.3-message-list
│   ├── task/frontend-Task3.4-chat-input
│   ├── task/frontend-Task3.5-use-reducer
│   └── task/frontend-Task3.6-auto-scroll
│
├── feature/frontend-Phase4-loading-ux          ← parallel with Phase5, Phase6
│   ├── task/frontend-Task4.1-health-warmup
│   ├── task/frontend-Task4.2-send-btn-warmup
│   ├── task/frontend-Task4.3-error-state
│   ├── task/frontend-Task4.4-input-state
│   ├── task/frontend-Task4.5-empty-state
│   └── task/frontend-Task4.6-request-timeout
│
├── feature/frontend-Phase5-sources-panel       ← parallel with Phase4, Phase6
│   ├── task/frontend-Task5.1-source-card
│   ├── task/frontend-Task5.2-sources-panel
│   ├── task/frontend-Task5.3-mobile-drawer
│   ├── task/frontend-Task5.4-panel-empty-state
│   └── task/frontend-Task5.5-score-color
│
├── feature/frontend-Phase6-long-response       ← parallel with Phase4, Phase5
│   ├── task/frontend-Task6.1-markdown-render
│   ├── task/frontend-Task6.2-code-highlight
│   ├── task/frontend-Task6.3-bubble-scroll
│   ├── task/frontend-Task6.4-copy-button
│   └── task/frontend-Task6.5-timestamp
│
└── feature/frontend-Phase7-polish              ← after Phase4+5+6 all merged
    ├── task/frontend-Task7.1-responsive-layout
    ├── task/frontend-Task7.2-dark-light-toggle
    ├── task/frontend-Task7.3-theme-overrides
    ├── task/frontend-Task7.4-page-metadata
    ├── task/frontend-Task7.5-accessibility
    └── task/frontend-Task7.6-error-boundary
```

---

## Phase-by-Phase Workflow

### Phase 1 — Scaffold

**Prerequisite:** none
**Created from:** `feature/frontend`
**Merges to:** `feature/frontend`

```bash
git checkout feature/frontend
git checkout -b feature/frontend-Phase1-scaffold
```

Tasks — each created from the phase branch, merged back to it:

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task1.1-vite-init` | Phase1 | Phase1 |
| `task/frontend-Task1.2-mantine-install` | Phase1 | Phase1 |
| `task/frontend-Task1.3-mantine-provider` | Phase1 | Phase1 |
| `task/frontend-Task1.4-env-vars` | Phase1 | Phase1 |
| `task/frontend-Task1.5-appshell-scaffold` | Phase1 | Phase1 |
| `task/frontend-Task1.6-vercel-config` | Phase1 | Phase1 |

Tasks 1.1–1.6 are sequential (each builds on the previous).
After all tasks merge → merge Phase1 to `feature/frontend`.

---

### Phase 2 — API Client & Types | Phase 3 — Core Chat Components

**Prerequisite:** Phase 1 merged to `feature/frontend`
**Parallel:** Phase 2 and Phase 3 run at the same time
**Created from:** `feature/frontend`
**Merges to:** `feature/frontend`

```bash
# Phase 2
git checkout feature/frontend
git checkout -b feature/frontend-Phase2-api-client

# Phase 3 — created from feature branch, not from Phase 2
git checkout feature/frontend
git checkout -b feature/frontend-Phase3-core-chat
```

**Phase 2 tasks:**

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task2.1-types` | Phase2 | Phase2 |
| `task/frontend-Task2.2-post-query` | Phase2 | Phase2 |
| `task/frontend-Task2.3-health-check` | Phase2 | Phase2 |
| `task/frontend-Task2.4-mock-fixture` | Phase2 | Phase2 |
| `task/frontend-Task2.5-error-normalisation` | Phase2 | Phase2 |

Tasks 2.1 → 2.2 → 2.3 → 2.4 → 2.5 are sequential.

**Phase 3 tasks:**

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task3.1-chat-message` | Phase3 | Phase3 |
| `task/frontend-Task3.2-skeleton-message` | Phase3 | Phase3 |
| `task/frontend-Task3.3-message-list` | Phase3 | Phase3 |
| `task/frontend-Task3.4-chat-input` | Phase3 | Phase3 |
| `task/frontend-Task3.5-use-reducer` | Phase3 | Phase3 |
| `task/frontend-Task3.6-auto-scroll` | Phase3 | Phase3 |

Tasks 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 are sequential.
After all tasks in each phase merge → merge Phase2 and Phase3 to `feature/frontend` (either order).

---

### Phase 4 — Loading & UX | Phase 5 — Sources Panel | Phase 6 — Long Response

**Prerequisite:** Phase 2 **and** Phase 3 both merged to `feature/frontend`
**Parallel:** Phases 4, 5, and 6 run at the same time
**Created from:** `feature/frontend`
**Merges to:** `feature/frontend`

```bash
# Phase 4
git checkout feature/frontend
git checkout -b feature/frontend-Phase4-loading-ux

# Phase 5
git checkout feature/frontend
git checkout -b feature/frontend-Phase5-sources-panel

# Phase 6
git checkout feature/frontend
git checkout -b feature/frontend-Phase6-long-response
```

**Phase 4 tasks:**

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task4.1-health-warmup` | Phase4 | Phase4 |
| `task/frontend-Task4.2-send-btn-warmup` | Phase4 | Phase4 |
| `task/frontend-Task4.3-error-state` | Phase4 | Phase4 |
| `task/frontend-Task4.4-input-state` | Phase4 | Phase4 |
| `task/frontend-Task4.5-empty-state` | Phase4 | Phase4 |
| `task/frontend-Task4.6-request-timeout` | Phase4 | Phase4 |

**Phase 5 tasks:**

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task5.1-source-card` | Phase5 | Phase5 |
| `task/frontend-Task5.2-sources-panel` | Phase5 | Phase5 |
| `task/frontend-Task5.3-mobile-drawer` | Phase5 | Phase5 |
| `task/frontend-Task5.4-panel-empty-state` | Phase5 | Phase5 |
| `task/frontend-Task5.5-score-color` | Phase5 | Phase5 |

**Phase 6 tasks:**

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task6.1-markdown-render` | Phase6 | Phase6 |
| `task/frontend-Task6.2-code-highlight` | Phase6 | Phase6 |
| `task/frontend-Task6.3-bubble-scroll` | Phase6 | Phase6 |
| `task/frontend-Task6.4-copy-button` | Phase6 | Phase6 |
| `task/frontend-Task6.5-timestamp` | Phase6 | Phase6 |

After all tasks in each phase merge → merge Phase4, Phase5, Phase6 to `feature/frontend` (any order).

---

### Phase 7 — Polish & Responsiveness

**Prerequisite:** Phases 4, 5, and 6 all merged to `feature/frontend`
**Created from:** `feature/frontend`
**Merges to:** `feature/frontend`

```bash
git checkout feature/frontend
git checkout -b feature/frontend-Phase7-polish
```

**Phase 7 tasks:**

| Branch | Created from | Merges to |
|---|---|---|
| `task/frontend-Task7.1-responsive-layout` | Phase7 | Phase7 |
| `task/frontend-Task7.2-dark-light-toggle` | Phase7 | Phase7 |
| `task/frontend-Task7.3-theme-overrides` | Phase7 | Phase7 |
| `task/frontend-Task7.4-page-metadata` | Phase7 | Phase7 |
| `task/frontend-Task7.5-accessibility` | Phase7 | Phase7 |
| `task/frontend-Task7.6-error-boundary` | Phase7 | Phase7 |

After all tasks merge → merge Phase7 to `feature/frontend`.

---

### Feature Merge to `develop`

After Phase 7 merges:

```bash
git checkout develop
git pull origin develop
git merge feature/frontend
git push origin develop
```

Requires explicit confirmation before running. Never merge directly to `main`.

---

## Commit Message Format

```
[TASK] <N.N> <short description>
[FIX]  <N.N> <short description>
[DOCS] <N.N> <short description>
[HOTFIX] <short description>
```

Examples:

```
[TASK] 1.1 init vite react typescript scaffold
[TASK] 2.3 add checkHealth fetch wrapper
[TASK] 3.5 wire useReducer with chat actions
[TASK] 4.2 send button warmup state with tooltip
[TASK] 5.1 SourceCard with score badge and excerpt
[TASK] 6.1 add react-markdown renderer to assistant bubble
[TASK] 7.5 add aria labels and role log to message list
```

Max 6 lines per commit. No reference to AI tools.

---

## PR Title Format

```
[TASK N.N] Short description
[PHASE N] Short description
[FEATURE] Short description
```

Examples:

```
[TASK 3.4] ChatInput textarea and send ActionIcon
[PHASE 1] Project scaffold — Vite, Mantine, AppShell
[FEATURE] frontend chat UI
```

---

## Pre-Merge Checklist (per task branch)

Run in order, one at a time, from the `frontend/` package directory:

```bash
cd frontend && npm run build
cd frontend && npm run typecheck
cd frontend && npm run lint
cd frontend && npm test -- <specific-test-file>
cd frontend && npm test
```

All must pass (0 errors, 0 failures) before creating a PR.

---

## Emergency: Hotfix Within a Phase

If a critical bug is found in a phase branch during development:

```bash
git checkout feature/frontend-Phase<N>-<label>
git checkout -b hotfix/<short-description>
# fix, commit
git checkout feature/frontend-Phase<N>-<label>
git merge hotfix/<short-description>
git push origin feature/frontend-Phase<N>-<label>
```

---

## Sequence Summary

| Step | Action | Gate |
|---|---|---|
| 1 | Create `feature/frontend` from `develop` | — |
| 2 | Run Phase 1 (sequential tasks) | — |
| 3 | Merge Phase 1 → `feature/frontend` | Phase 1 tasks all merged |
| 4 | Run Phase 2 and Phase 3 in parallel | Phase 1 merged |
| 5 | Merge Phase 2 → `feature/frontend` | Phase 2 tasks all merged |
| 6 | Merge Phase 3 → `feature/frontend` | Phase 3 tasks all merged |
| 7 | Run Phases 4, 5, 6 in parallel | Phase 2 and Phase 3 merged |
| 8 | Merge Phases 4, 5, 6 → `feature/frontend` | Each phase's tasks all merged |
| 9 | Run Phase 7 (sequential tasks) | Phases 4, 5, 6 merged |
| 10 | Merge Phase 7 → `feature/frontend` | Phase 7 tasks all merged |
| 11 | Merge `feature/frontend` → `develop` | Explicit confirmation required |

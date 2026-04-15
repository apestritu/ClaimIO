# AGENTS.md

## What ClaimIO Is
ClaimIO is an AI-powered travel insurance claim processing app with:
- a FastAPI backend that streams claim-processing events
- a Next.js frontend that visualizes the pipeline in real time
- a sequential multi-agent pipeline for claim review
- local demo cases under `input/`
- persisted run history on the backend

The app should feel like a polished AI operations console, not a generic admin dashboard.

## Core Rule
Before changing behavior, inspect the current code paths and follow the existing design unless the user explicitly asks for a change in direction.

Prefer this order of truth:
1. current code
2. current files in `input/`
3. tests
4. README

If these disagree, trust the live implementation and update stale docs if relevant.

## Existing Architecture

### Backend
Important files:
- `backend/server.py`
- `backend/orchestrator.py`
- `backend/a2a/`
- `backend/pipeline/`
- `backend/tools/`
- `backend/prompts/`
- `backend/tests/`

Current backend responsibilities:
- expose health and case-listing endpoints
- stream pipeline execution over SSE
- persist and return run history
- orchestrate the pipeline and agent events

### Frontend
Important files:
- `frontend/src/app/page.tsx`
- `frontend/src/lib/useEventStream.ts`
- `frontend/src/lib/claim-data.ts`
- `frontend/src/components/`

Current frontend responsibilities:
- landing and demo/live flow
- case selection
- SSE consumption
- active-step visualization
- event log rendering
- final result display

## Contracts To Preserve

### SSE event contract
The backend and frontend are tightly coupled through streamed events. Preserve this shape unless the task explicitly includes coordinated breaking changes:
- `id`
- `agent`
- `status`
- `message`
- `data`
- `timestamp`

Supported statuses:
- `submitted`
- `working`
- `completed`
- `failed`

If you change the producer, update the consumer in the same task.

### Pipeline identity contract
These step names are part of the current app behavior and UI mapping:
1. `IngestAgent`
2. `EvidenceCollectionAgent`
3. `FactExtractionAgent`
4. `EvidenceEvaluationAgent`
5. `CoverageReasoningAgent`
6. `ComplianceAgent`
7. `DecisionAgent`
8. `PaymentAgent`
9. `CloseNotifyAgent`

If a step is renamed, added, removed, or reordered, update:
- `backend/orchestrator.py`
- frontend pipeline metadata
- any phase/animation mapping
- any tests or summaries that depend on those names

### Shared context contract
Pipeline stages pass a shared `ctx` dictionary. Do not casually remove or rename fields that downstream stages use.

Important keys include:
- `docs`
- `docs_by_type`
- `missing_docs`
- `docs_confidence`
- `fact_map`
- `mean_extract_conf`
- `coverage_summary`
- `compliance`
- `decision`
- `payment`
- `final_summary`

## Working Style
- Make targeted changes, not broad rewrites.
- Preserve modular boundaries: routes in `server.py`, orchestration in `orchestrator.py`, step logic in `pipeline/`, helpers in `tools/`.
- Keep frontend state orchestration in hooks or coordinating components, not deep inside animation components.
- Keep animation and illustration components mostly presentational.
- Prefer small diffs that maintain the current mental model of the app.
- Do not introduce a new framework, state library, or architectural pattern without a strong reason.

## Backend Guidelines
- Keep FastAPI route handlers thin.
- Put claim-processing behavior in pipeline modules or tools.
- Emit clear, meaningful task events during long-running work.
- Handle malformed model outputs gracefully with fallback behavior.
- Use deterministic rules for guardrails where possible.
- Preserve history behavior and avoid making history persistence a failure point for the app.
- Return `404` for invalid case IDs.

When updating AI-assisted stages:
- keep outputs structured and predictable
- validate or sanitize model outputs before using them downstream
- avoid making later stages depend on fragile free-form text

## Frontend Guidelines
- Treat `useEventStream.ts` as a contract boundary.
- Preserve current state concepts such as:
  - `events`
  - `currentAgent`
  - `completedAgents`
  - `finalSummary`
  - `error`
- Prefer coordinated updates when backend event behavior changes.
- Preserve the polished mission-control feel of the UI.
- Keep readability high even when adding motion or visuals.

When editing visuals:
- follow the repo's current bold, animated style
- avoid replacing the UI with generic dashboard patterns
- preserve desktop and mobile usability

## Data and Demo Cases
- Cases are loaded from `input/`.
- Verify actual case IDs and filenames from the filesystem before hardcoding assumptions.
- Do not trust old demo labels if they conflict with live backend behavior.
- Keep demo and live mode semantics aligned where practical.

## Testing and Verification
Run the smallest relevant checks for the change.

### Backend
```bash
cd backend
pytest
```

If linting is relevant:
```bash
cd backend
ruff check .
```

### Frontend
```bash
cd frontend
npm run build
```

If you change live data flow, verify at least one manual run from case selection through final summary.

## Common Pitfalls
- breaking the frontend by changing backend event shape
- changing pipeline step names without updating UI mappings
- relying on README assumptions instead of current code
- moving business logic into UI components
- trusting raw model output without validation
- introducing unnecessary abstraction into a demo-oriented codebase

## Preferred Change Patterns

### Adding or updating a pipeline step
- keep the step focused on one responsibility
- emit useful progress events
- update downstream `ctx` consumers as needed
- reflect pipeline metadata changes in the frontend

### Changing decision or coverage logic
- preserve explainability in emitted summaries
- keep deterministic guardrails where possible
- verify the final result panel still has what it needs

### Changing case-selection or history behavior
- verify backend response shapes first
- then update frontend consumers
- avoid hardcoding values that should come from the API

## Acceptance Standard
A change is in good shape when:
1. it follows the existing repo structure
2. it preserves or intentionally updates backend/frontend contracts
3. it keeps the end-to-end claim flow working
4. it does not degrade the polished demo experience
5. the relevant checks or manual verification were completed

## Decision Rule When Unsure
Choose the option that best preserves:
- the existing FastAPI + Next.js split
- SSE-driven live updates
- the 9-step pipeline model
- the current UI's demo quality
- modular code organization

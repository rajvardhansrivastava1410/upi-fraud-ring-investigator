# Antigravity frontend implementation prompt

Copy the prompt below into Antigravity after giving it access to the project root and the `docs/` folder.

```text
You are the frontend engineer for RingLens, a synthetic-data-only UPI fraud-ring investigation hackathon project.

Read these files before coding:
- README.md
- docs/FRONTEND.md
- docs/API_CONTRACT.md
- docs/INTEGRATION.md
- docs/TESTING.md
- docs/TEAM_WORKFLOW.md

Use this stack:
- Next.js App Router
- React and TypeScript
- Tailwind CSS and shadcn/ui
- Axios
- TanStack Query for server state
- Zustand only for local UI state
- Cytoscape.js for graph visualization
- Recharts for evaluation charts

Build a polished, responsive analyst workbench. Start with deterministic local fixtures; the app must work in demo mode without FastAPI.

Core screens:
1. Three-pane analyst workspace:
   - Left: ranked alert queue with score, confidence band, top reasons, status, and baseline badges.
   - Centre: 1–2 hop Cytoscape graph with node/edge types, highlighted evidence path, dimmed unrelated edges, incomplete-record styling, filters, and event-time/ingest-time toggle.
   - Right: Evidence, Counterfactual, and Decision tabs.
2. Evaluation tab with P@K/R@K charts, benign shared-device false-positive table, late-arrival stability chart, baseline comparison cards, and failure-analysis table.

Evidence requirements:
- Ordered timeline with timestamps and rule tags.
- Score-breakdown waterfall with rule points and benign discounts.
- Missing-data warnings.
- Selecting a timeline item highlights the matching graph edge; graph selection updates the panel.

Counterfactual requirements:
- Per-edge removal toggles.
- New score, score delta, and below-cutoff indicator.
- Benign hypothesis cards and distinguishing checks.
- Clearly label missing-data what-if results as hypothetical.

Decision requirements:
- Confirm, Dismiss, or Needs more info.
- Require a note before submission.
- Show append-only decision history.
- Never say “fraud detected”; use “consistent with coordinated behaviour” or “review priority”.
- Use amber for review priority; do not use red to imply guilt.

Implementation rules:
- Treat docs/API_CONTRACT.md as proposed unless a route is explicitly marked implemented.
- Do not invent backend routes or silently change field names.
- Create shared TypeScript types matching the proposed contract.
- Create deterministic fixtures for a high-risk ring, benign shared-device case, shop/supplier case, empty queue, and API error.
- Create Axios functions and TanStack Query hooks so fixtures can later be replaced by FastAPI without changing UI components.
- Read NEXT_PUBLIC_API_BASE_URL and support NEXT_PUBLIC_DEMO=1.
- Use Next.js rewrites for /api proxying where appropriate.
- Load Cytoscape client-side with SSR disabled if needed.
- Keep backend logic in FastAPI, not Next.js route handlers.
- Use synthetic IDs only. Never use real PII, banking data, UPI IDs, phone numbers, or Aadhaar data.
- Include loading, empty, error, stale-data, and backend-down states.
- Provide a table-based evidence alternative for accessibility.
- Keep components feature-oriented; avoid one giant page component.

Suggested structure:
app/
  layout.tsx
  page.tsx
  evaluation/page.tsx
src/
  components/ui/
  features/queue/
  features/investigation/
  features/graph/
  features/evaluation/
  lib/api/
  mocks/
  store/
  types/

Build in this order:
1. Inspect the existing repository and preserve useful work.
2. Scaffold or repair the Next.js frontend.
3. Configure Tailwind, shadcn/ui, Axios, TanStack Query, and Zustand.
4. Add shared types and deterministic fixtures.
5. Build the queue and three-pane shell.
6. Build graph and evidence interaction.
7. Add counterfactual and decision panels.
8. Add the evaluation tab.
9. Add demo mode, loading/error states, accessibility, and responsive behavior.
10. Add focused tests.

Verify before finishing:
- npm install and the development server work.
- The queue loads in demo mode without FastAPI.
- Selecting an alert opens its graph and evidence.
- Selecting an evidence step highlights the matching graph edge.
- Counterfactual toggles update the displayed score.
- A decision cannot be submitted without a note.
- The evaluation tab renders from fixtures.
- No undocumented backend route is required.
- Tests and linting pass.

Report changed files, commands run, completed features, verification results, and unresolved API/schema decisions. Do not claim proposed backend routes already exist.
```

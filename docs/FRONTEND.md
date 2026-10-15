# Frontend guide

## Goal

Give an analyst a fast, explainable workflow: see priority alerts, understand why an entity or transaction is suspicious, traverse supporting evidence, and record an investigation outcome.

## Proposed screens

1. **Analyst queue** — filters, priority, risk score, status, assignee, age.
2. **Investigation workspace** — alert summary, entities, transactions, evidence path, graph, explanation, counterfactual panel.
3. **Evaluation** — precision/recall, confusion matrix, threshold comparison, synthetic scenario summary.

## Frontend stack

- Next.js App Router with React and TypeScript
- Tailwind CSS and shadcn/ui
- Axios for HTTP requests
- TanStack Query for server state
- Zustand for local UI state such as selected alert, selected edge, and as-of time
- Cytoscape.js for graph visualization
- Recharts for evaluation charts

## UI architecture

- `app`: routing, providers, query client, and global layout.
- `src/features/queue`: queue table, filters, status actions.
- `src/features/investigation`: summary, evidence, explanation, counterfactuals.
- `src/features/graph`: Cytoscape adapter, node/edge styling, legends, path highlighting.
- `src/components/ui`: shadcn/ui primitives and project-wide components.
- `src/lib/api`: Axios instance, typed request functions, error normalization.
- `src/mocks`: fixture responses used until the API contract is agreed.

Prefer feature-local components and hooks. TanStack Query owns server state; React state owns temporary UI state such as selected node and open panels.

Use Next.js rewrites to proxy `/api/*` to FastAPI in development. Load Cytoscape client-side with SSR disabled where required. Keep business logic out of Next.js route handlers; FastAPI remains the backend.

The first milestone is a three-pane analyst workspace: queue on the left, graph explorer in the centre, and evidence/counterfactual/decision tabs on the right. Build against fixtures before connecting FastAPI.

## UX rules

- Always show the reason behind a score; never present a risk score as a verdict.
- Use explicit labels such as “synthetic scenario” and “proposed explanation.”
- Provide loading, empty, error, and stale-data states.
- Keep graph interactions keyboard-accessible and provide a tabular evidence alternative.
- Never render raw PII; use synthetic IDs and masked display values.

## API integration pattern

Each query must have a typed response, a stable query key, and a fixture with the same shape. Do not call undocumented routes. See [API_CONTRACT.md](API_CONTRACT.md). The frontend must remain usable in demo mode when the backend is unavailable.

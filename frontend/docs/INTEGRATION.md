# Frontend/backend integration

## Source of truth

The API contract is the boundary. Backend contributors own response correctness; frontend contributors own rendering and interaction. Both sides must use the same fixtures and IDs.

## Local connection (proposed)

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Frontend environment: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- Backend environment: `CORS_ORIGINS=http://localhost:3000`

Names and ports are proposed; confirm them in the actual setup before publishing.

## Connection checklist

1. Agree the endpoint and response shape.
2. Add a JSON fixture and a typed frontend model.
3. Add backend contract tests and frontend mock/query tests.
4. Configure CORS and environment variables without hard-coding secrets.
5. Test loading, empty, validation, 404, 409, 429, and 500 states.
6. Run a smoke test against the real local backend.

For Antigravity agents, include the relevant doc path, endpoint status (proposed/agreed/implemented), fixture, and acceptance criteria in every task prompt.

The frontend must support `NEXT_PUBLIC_DEMO=1` so the core demo works without FastAPI.

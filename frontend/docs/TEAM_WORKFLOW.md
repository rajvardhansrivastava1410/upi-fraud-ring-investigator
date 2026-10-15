# Team workflow and Antigravity handoff

## Suggested ownership

- Frontend: screens, components, query hooks, graph UX, accessibility.
- Backend: FastAPI routes, validation, services, scoring and explanation logic.
- Database/data: migrations, synthetic generator, fixtures, indexes, evaluation datasets.
- Integrator: API contract, environment wiring, smoke tests, demo reliability.

## Small-task workflow

1. Start from the relevant document and state whether the behavior is proposed, agreed, or implemented.
2. Define inputs, outputs, acceptance criteria, and fixture IDs before coding.
3. Keep changes focused; update docs when a proposal becomes agreed.
4. Run the narrow tests, then the integration smoke test.
5. Report changed files, verification results, and any open contract decisions.

## Antigravity prompt template

```text
Context: RingLens synthetic-data-only UPI fraud-ring investigation app.
Read: docs/<relevant-doc>.md and docs/API_CONTRACT.md.
Task: <one focused change>.
Contract status: <proposed|agreed|implemented>.
Do not invent routes or schema fields; use fixtures if the contract is proposed.
Acceptance: <observable checks>.
Verify: <commands/tests>.
Report: changed files, test results, and unresolved decisions.
```

## Branch and review conventions

Use short branches, small commits, and descriptive pull requests. A review should check contract compatibility, synthetic-data safety, error/loading states, test coverage, and documentation updates.

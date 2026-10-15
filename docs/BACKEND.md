# Backend guide

## Responsibilities

FastAPI should expose validated, versioned endpoints for alerts, investigations, graph evidence, queue actions, counterfactuals, and evaluation. Business logic must be independent of HTTP so it can be tested with in-memory fixtures.

## Suggested modules

```text
app/
  main.py              # FastAPI application and middleware
  api/                 # routers and dependency wiring
  schemas/              # Pydantic request/response models
  services/            # alert, investigation, graph, evaluation services
  repositories/         # PostgreSQL access; no SQL in routers
  graph/                # NetworkX construction and path algorithms
  synthetic/            # deterministic data generator and scenarios
  tests/
```

## Design rules

- Validate every request with Pydantic.
- Return stable machine-readable error bodies.
- Keep scoring/explanation logic deterministic for the same dataset and model version.
- Record `dataset_id`, `scenario_id`, and `scoring_version` in results.
- Use dependency injection for repositories and graph providers so NetworkX can later be replaced by Neo4j.
- Add CORS only for configured development origins.
- Do not accept or persist real UPI, bank, Aadhaar, phone, or person data.

Routes in this document are proposals only; verify implementation before integrating.

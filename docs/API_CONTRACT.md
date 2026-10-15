# API contract (proposed)

The following routes and shapes are proposals. They are not claims about routes that already exist. The backend owner must mark each item agreed and implement tests before frontend code depends on it.

## Conventions

- Base path: `/api` (proposed)
- JSON over HTTPS in deployed environments.
- Error shape: `{ "code": "string", "message": "string", "details": {} }`.
- IDs are opaque strings; timestamps are ISO-8601 UTC.

## Proposed endpoints

| Method | Route | Purpose |
|---|---|---|
| GET | `/alerts?k=25&as_of=...` | Ranked queue with score, confidence, reasons, baselines, warnings, and status |
| GET | `/alerts/{alert_id}/graph?hops=2&as_of=...` | Bounded subgraph and ordered evidence path |
| POST | `/alerts/{alert_id}/counterfactual` | Remove edges or run a missing-data hypothesis |
| GET | `/alerts/{alert_id}/hypotheses` | Benign hypotheses and distinguishing checks |
| POST | `/alerts/{alert_id}/decision` | Append a confirm, dismiss, or needs-info decision |
| GET | `/evaluation` | Evaluation summary and failure analysis |
| GET | `/health` | Service health check |
| GET | `/meta` | Dataset card and synthetic-only metadata |

## Example proposed alert response

```json
{
  "id": "alert_demo_001",
  "status": "open",
  "risk_score": 0.92,
  "alert_type": "possible_ring",
  "synthetic": true,
  "explanation": [{"code": "rapid_hop", "text": "Funds moved through 4 synthetic accounts in 18 minutes."}],
  "dataset_id": "dataset_demo",
  "scoring_version": "proposal-0.1"
}
```

Use contract tests to prevent field drift. Unknown fields may be added; breaking changes require a versioned contract update. These route names, query parameters, and response fields remain proposed until the backend and frontend owners agree on them.

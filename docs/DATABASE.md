# Database and graph model

All entities and values are synthetic. PostgreSQL is the proposed system of record; migrations are required before schema changes are treated as agreed.

## Proposed tables

- `datasets(id, name, seed, version, created_at)`
- `entities(id, dataset_id, entity_type, synthetic_label, metadata_json)`
- `accounts(id, dataset_id, entity_id, synthetic_account_ref, opened_at)`
- `transactions(id, dataset_id, sender_account_id, receiver_account_id, amount_minor, currency, occurred_at, scenario_id)`
- `alerts(id, dataset_id, entity_id, alert_type, risk_score, explanation_json, status, assignee, created_at)`
- `evidence_paths(id, alert_id, path_json, rationale, generated_at)`
- `investigation_events(id, alert_id, actor, action, payload_json, created_at)`
- `evaluation_runs(id, dataset_id, scoring_version, metrics_json, created_at)`

Use UUIDs, UTC timestamps, foreign keys, indexes on dataset/status/time, and check constraints for score ranges and non-negative amounts. Store money as integer minor units.

## Proposed graph

NetworkX nodes represent synthetic accounts, devices, merchants, and entities. Edges represent transfers or shared synthetic signals. Every edge should carry `transaction_id`, timestamp, amount, and evidence type. A path must reference source records so the UI can explain it.

## Migration policy

Schema proposals require agreement from frontend, backend, and database owners. Once agreed, add a migration, fixture update, API contract update, and rollback note.

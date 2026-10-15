# Testing strategy

## Frontend

- Unit test scoring badges, filters, explanation rendering, and graph selection logic.
- Component test queue states and investigation workflows.
- Use MSW or equivalent fixtures for API behavior.
- Add an accessibility pass for keyboard navigation, labels, contrast, and table alternatives.

## Backend

- Unit test services and graph algorithms with deterministic synthetic fixtures.
- API test validation, pagination, errors, authorization boundaries if added, and contract shapes.
- Test repeatability: same seed and scoring version produce the same result.

## Integration and acceptance

- Start the backend and frontend together and load the queue.
- Open an alert, inspect its evidence path, and perform a queue action.
- Run a counterfactual and verify the explanation identifies changed assumptions.
- Verify no real-data fixtures, secrets, or personal identifiers enter the repository.

## Evaluation

Report precision, recall, F1, false-positive rate, alert volume, and latency by synthetic scenario. Do not claim production fraud accuracy from synthetic data.

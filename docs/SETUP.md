# Local setup (proposed)

## Prerequisites

- Node.js LTS and npm/pnpm
- Python 3.11+ and a virtual environment
- PostgreSQL 15+ if persistence is enabled

## Suggested commands

```bash
# frontend
cd frontend
npm install
npm run dev

# backend
cd backend
python -m venv .venv
# activate .venv for your shell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

These paths and commands are proposed until the repository implementation confirms them. The expected Next.js frontend URL is `http://localhost:3000`.

## Environment

Keep secrets in ignored local files. Provide a safe example file such as `.env.example`; never commit credentials. Seed only synthetic data and record the seed used.

Proposed frontend variables:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEMO=1
```

Use `NEXT_PUBLIC_DEMO=1` while the backend is unavailable. The UI should use fixtures without requiring a live API.

## Done check

The setup is ready when the health check responds, the queue loads from a fixture or database, an investigation opens, and the test suites pass.

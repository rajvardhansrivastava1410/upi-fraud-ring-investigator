#!/bin/bash
# AegisUPI - One-Command Startup Script for Hackathon
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "========================================================"
echo "🛡️  AegisUPI: UPI Fraud-Ring Graph Investigator (PS 16)"
echo "========================================================"

# 1. Check or activate Python venv
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "⚙️ Creating backend Python virtual environment..."
    python3 -m venv "$BACKEND_DIR/venv"
    "$BACKEND_DIR/venv/bin/pip" install --upgrade pip
    "$BACKEND_DIR/venv/bin/pip" install fastapi uvicorn networkx pydantic pytest
fi

# 2. Check node_modules
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "📦 Installing Next.js frontend dependencies..."
    cd "$PROJECT_DIR"
    npm install --legacy-peer-deps
fi

# 3. Trap exit signals to kill all child background processes cleanly
cleanup() {
    echo ""
    echo "🛑 Shutting down AegisUPI servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Launch FastAPI Server on port 8000
echo "🚀 [1/2] Launching FastAPI Backend on http://localhost:8000..."
cd "$PROJECT_DIR"
"$BACKEND_DIR/venv/bin/python" app.py &
BACKEND_PID=$!

# Wait briefly for FastAPI to spin up
sleep 2

# 5. Launch Next.js Frontend on port 3000
echo "🚀 [2/2] Launching Next.js Analyst UI on http://localhost:3000..."
npx next start -p 3000 &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo "✨ BOTH SERVERS ARE LIVE & FULLY INTEGRATED!"
echo "👉 Next.js React Workbench:       http://localhost:3000"
echo "👉 CARTO World Map & Full Engine: http://localhost:8000"
echo "👉 Interactive OpenAPI Docs:      http://localhost:8000/docs"
echo "========================================================"
echo "Press Ctrl+C to stop both servers."

wait

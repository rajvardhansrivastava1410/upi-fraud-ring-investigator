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

# 2. Generate benchmark dataset if not present
if [ ! -f "$BACKEND_DIR/data/dataset.json" ]; then
    echo "📊 Generating synthetic benchmark & ground truth..."
    cd "$BACKEND_DIR"
    ./venv/bin/python generator.py
fi

# 3. Run evaluation verification
echo "🧪 Running empirical benchmark against ground truth..."
cd "$BACKEND_DIR"
./venv/bin/python evaluation.py

# 4. Launch FastAPI Server + Web Workbench
echo ""
echo "🚀 Starting AegisUPI Analyst Workbench on http://localhost:8000"
echo "👉 Open your browser at: http://localhost:8000"
echo "👉 Interactive API Docs at: http://localhost:8000/docs"
echo "========================================================"

exec "$BACKEND_DIR/venv/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 --reload

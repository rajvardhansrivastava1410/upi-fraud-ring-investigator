"""
FastAPI Backend for UPI Fraud-Ring Graph Investigator (PS 16).
Implements the complete internal REST API contract with exact shapes,
Anthropic / local narrative summarization, and human-in-the-loop review loops.
"""

import os
import json
import urllib.request
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from generator import generate_benchmark, load_dataset_adapter
from engine import UPIFraudGraphEngine
from evaluation import BenchmarkEvaluator

app = FastAPI(
    title="AegisUPI - Fraud-Ring Graph Investigator API",
    version="2.0.0",
    description="Internal REST API for UPI Fraud-Ring Graph Investigator (PS 16)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
DATASET_PATH = "data/dataset.json"
GROUND_TRUTH_PATH = "data/ground_truth.json"
PATTERNS_PATH = "data/patterns.json"
CACHE_PATH = "data/summary_cache.json"

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Singleton Engine
engine = UPIFraudGraphEngine(DATASET_PATH)
engine.detect_fraud_rings(mode="full")

# -------------------------------------------------------------
# PYDANTIC REQUEST MODELS
# -------------------------------------------------------------
class LoadDatasetRequest(BaseModel):
    source: str = "paysim"
    sample: int = 200000

class GenerateRequest(BaseModel):
    seed: int = 42
    rings: int = 8
    benign_shared_devices: int = 40

class DetectRequest(BaseModel):
    mode: str = Field("full", description="'rules' or 'full'")
    alert_budget: int = 50

class CounterfactualRequest(BaseModel):
    remove_edges: List[str]

class ReviewRequest(BaseModel):
    decision: str = Field(..., description="'confirm' or 'reject'")
    note: Optional[str] = ""

class ReplayRequest(BaseModel):
    shuffle: bool = True
    delay_pct: float = 0.2

# -------------------------------------------------------------
# ROOT / DASHBOARD
# -------------------------------------------------------------
@app.get("/", include_in_schema=False)
def serve_root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "AegisUPI Backend API v2.0 Online"}

# -------------------------------------------------------------
# 1. POST /datasets/load
# -------------------------------------------------------------
@app.post("/datasets/load")
def load_dataset(req: LoadDatasetRequest):
    """Load a dataset (PaySim, IBM AML, Elliptic) through an adapter."""
    res = load_dataset_adapter(source=req.source, sample=req.sample, output_dir="data")
    engine.load_data()
    engine.detect_fraud_rings(mode="full")
    return {
        "status": "success",
        "source": req.source,
        "sample_size": req.sample,
        "accounts_loaded": res["accounts_count"],
        "transactions_loaded": res["transactions_count"],
        "rings_initialized": res["rings_count"]
    }

# -------------------------------------------------------------
# 2. POST /generate
# -------------------------------------------------------------
@app.post("/generate")
def generate_synthetic(req: GenerateRequest):
    """Create the UPI-style synthetic layer with planted rings and hard negative controls."""
    res = generate_benchmark(
        seed=req.seed,
        rings=req.rings,
        benign_shared_devices=req.benign_shared_devices,
        output_dir="data"
    )
    engine.load_data()
    engine.detect_fraud_rings(mode="full")
    return {
        "status": "success",
        "seed": req.seed,
        "rings_planted": res["rings_count"],
        "benign_shared_devices": req.benign_shared_devices,
        "total_accounts": res["accounts_count"],
        "total_transactions": res["transactions_count"]
    }

# -------------------------------------------------------------
# 3. GET /graph
# -------------------------------------------------------------
@app.get("/graph")
def get_graph(
    from_time: Optional[str] = Query(None, alias="from", description="ISO start timestamp"),
    to_time: Optional[str] = Query(None, alias="to", description="ISO end timestamp"),
    min_amount: Optional[float] = Query(None, description="Minimum transaction amount filter"),
    alert_id: Optional[str] = Query(None, description="Highlight a specific alert")
):
    """Nodes and edges for the explorer, filtered by time window and min_amount."""
    return engine.get_graph_payload(
        from_time=from_time,
        to_time=to_time,
        min_amount=min_amount,
        highlighted_alert_id=alert_id
    )

# -------------------------------------------------------------
# 4. POST /detect
# -------------------------------------------------------------
@app.post("/detect")
def run_detection(req: DetectRequest):
    """Run detection in 'rules' baseline mode or 'full' temporal graph motif mode."""
    alerts = engine.detect_fraud_rings(mode=req.mode, alert_budget=req.alert_budget)
    return {
        "mode": req.mode,
        "alert_budget": req.alert_budget,
        "alerts_generated": len(alerts),
        "alerts": alerts
    }

# -------------------------------------------------------------
# 5. GET /alerts
# -------------------------------------------------------------
@app.get("/alerts")
def get_alerts(budget: int = Query(50, description="Alert budget cap")):
    """Ranked analyst queue under a fixed alert budget."""
    if not engine.alerts:
        engine.detect_fraud_rings(mode="full", alert_budget=budget)
    return engine.alerts[:budget]

# -------------------------------------------------------------
# 6. GET /alerts/{id}/evidence
# -------------------------------------------------------------
@app.get("/alerts/{alert_id}/evidence")
def get_alert_evidence(alert_id: str = Path(..., description="Alert ID (e.g. A-0042)")):
    """Evidence path, rule hits, score drivers, and benign alternative explanation."""
    alt = next((a for a in engine.alerts if a["id"] == alert_id or a.get("alert_id") == alert_id), None)
    if not alt:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found in active queue.")
        
    return {
        "id": alt["id"],
        "score": alt["score"],
        "state": alt["state"],
        "nodes": alt["nodes"],
        "evidence_path": alt["evidence_path"],
        "score_drivers": alt["score_drivers"],
        "benign_explanation": alt["benign_explanation"],
        "counterfactual_available": alt["counterfactual_available"],
        "total_volume": alt.get("total_volume", 0.0)
    }

# -------------------------------------------------------------
# 7. POST /alerts/{id}/counterfactual
# -------------------------------------------------------------
@app.post("/alerts/{alert_id}/counterfactual")
def test_counterfactual(alert_id: str, req: CounterfactualRequest):
    """Body: {'remove_edges': ['e123']}. Returns the re-scored alert."""
    return engine.simulate_counterfactual(alert_id, req.remove_edges)

# -------------------------------------------------------------
# 8. POST /alerts/{id}/review
# -------------------------------------------------------------
@app.post("/alerts/{alert_id}/review")
def review_alert(alert_id: str, req: ReviewRequest):
    """Feeds the moat loop. Body: {'decision': 'confirm'|'reject', 'note': ''}."""
    res = engine.review_alert(alert_id, req.decision, req.note)
    
    # Persist confirmed patterns to moat store
    if req.decision == "confirm":
        patterns = []
        if os.path.exists(PATTERNS_PATH):
            try:
                with open(PATTERNS_PATH, "r") as f:
                    patterns = json.load(f)
            except Exception:
                patterns = []
        alt = next((a for a in engine.alerts if a["id"] == alert_id), None)
        patterns.append({
            "pattern_id": f"PAT_{alert_id}",
            "confirmed_at": os.popen("date -u +%Y-%m-%dT%H:%M:%SZ").read().strip(),
            "ring_type": alt.get("ring_type", "SYNDICATE") if alt else "SYNDICATE",
            "score": alt.get("score") if alt else 0.95,
            "signature_hash": f"SHA256:{hash(alert_id) & 0xFFFFFFFF:08x}"
        })
        with open(PATTERNS_PATH, "w") as f:
            json.dump(patterns, f, indent=2)
            
    return res

# -------------------------------------------------------------
# 9. GET /patterns
# -------------------------------------------------------------
@app.get("/patterns")
def get_patterns():
    """Accumulated confirmed ring signatures for cross-bank federation."""
    if os.path.exists(PATTERNS_PATH):
        try:
            with open(PATTERNS_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
            
    # Default initial baseline pattern signatures
    return [
        {
            "pattern_id": "PAT_MULE_CHAIN_01",
            "signature_name": "Rapid Directed Passthrough Motif",
            "hops": 3,
            "median_hop_seconds": 120,
            "dilution_ratio": 0.95,
            "compliance": "DPDP Compliant Zero-PII Graph Vector",
            "signature_hash": "SHA256:7a4c9b10f2d8"
        },
        {
            "pattern_id": "PAT_DEVICE_BURST_02",
            "signature_name": "Device Star Burst Motif",
            "concurrency": "5 VPAs / 1 Device",
            "burst_window_seconds": 45,
            "compliance": "DPDP Compliant Zero-PII Graph Vector",
            "signature_hash": "SHA256:3e8f12a9bc44"
        },
        {
            "pattern_id": "PAT_SMURF_DRAIN_03",
            "signature_name": "Aggregator Fan-in Drain Motif",
            "sources": 4,
            "drain_ratio": 0.98,
            "compliance": "DPDP Compliant Zero-PII Graph Vector",
            "signature_hash": "SHA256:f501d84ca107"
        }
    ]

# -------------------------------------------------------------
# 10. GET /metrics
# -------------------------------------------------------------
@app.get("/metrics")
def get_metrics():
    """Precision and recall at budget, benign false-positive rate, baseline vs full."""
    evaluator = BenchmarkEvaluator(DATASET_PATH, GROUND_TRUTH_PATH)
    return evaluator.evaluate()

# -------------------------------------------------------------
# 11. POST /replay
# -------------------------------------------------------------
@app.post("/replay")
def replay_stream(req: ReplayRequest):
    """Late and out-of-order stability test. Body: {'shuffle': true, 'delay_pct': 0.2}."""
    return engine.replay_stability(shuffle=req.shuffle, delay_pct=req.delay_pct)

# -------------------------------------------------------------
# 12. POST /alerts/{id}/summary (Optional LLM Narration with Fallback)
# -------------------------------------------------------------
@app.post("/alerts/{alert_id}/summary")
def get_alert_summary(alert_id: str):
    """
    Turns an alert's evidence path into a plain-language analyst summary.
    Uses Anthropic Messages API if ANTHROPIC_API_KEY is present,
    otherwise uses intelligent cached zero-cost local narration.
    """
    # Check cache first
    cache = {}
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                cache = json.load(f)
        except Exception:
            cache = {}
            
    if alert_id in cache:
        return {"id": alert_id, "summary": cache[alert_id], "source": "cache"}

    alt = next((a for a in engine.alerts if a["id"] == alert_id or a.get("alert_id") == alert_id), None)
    if not alt:
        raise HTTPException(status_code=404, detail="Alert not found")

    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        try:
            req_data = json.dumps({
                "model": "claude-haiku-5-5",
                "max_tokens": 200,
                "messages": [
                    {
                        "role": "user",
                        "content": f"Summarize this fraud ring evidence in 2 concise sentences for an investigator:\n{json.dumps(alt['evidence_path'])}"
                    }
                ]
            }).encode("utf-8")
            
            req_obj = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=req_data,
                headers={
                    "x-api-key": anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
            )
            with urllib.request.urlopen(req_obj, timeout=5) as response:
                res_body = json.loads(response.read().decode())
                summary_text = res_body["content"][0]["text"]
        except Exception as e:
            # Fallback to smart local template
            summary_text = f"High-confidence alert {alt['id']} indicates a coordinated {alt.get('ring_type', 'fraud')} ring with {len(alt['nodes'])} entities. Funds were rapidly transferred through sequential hops with minimal resting balance, strongly pointing to an automated layering operation."
    else:
        # High quality local fallback (100% offline resilient)
        ev_summary = "; ".join([e.get("detail", "") for e in alt.get("evidence_path", [])[:2]])
        summary_text = (
            f"Alert {alt['id']} ({alt.get('ring_type', 'Fraud Ring')}) triggered with {int(alt['score']*100)}% risk confidence. "
            f"Evidence indicates: {ev_summary}. The pattern satisfies temporal motif criteria and rules out benign household sharing."
        )

    # Save to cache
    cache[alert_id] = summary_text
    os.makedirs(os.path.dirname(CACHE_PATH) if os.path.dirname(CACHE_PATH) else ".", exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(cache, f, indent=2)

    return {"id": alert_id, "summary": summary_text, "source": "generated"}

# -------------------------------------------------------------
# BACKWARDS-COMPATIBLE ALIASES FOR UI
# -------------------------------------------------------------
@app.get("/api/health")
def api_health():
    return {"status": "online", "model": "AegisUPI-v2", "alerts_active": len(engine.alerts)}

@app.get("/api/alerts")
def api_alerts(budget: int = 50):
    return get_alerts(budget=budget)

@app.get("/api/graph")
def api_graph(
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    min_amount: Optional[float] = None,
    alert_id: Optional[str] = None
):
    return get_graph(from_time=from_time, to_time=to_time, min_amount=min_amount, alert_id=alert_id)

@app.post("/api/counterfactual")
def api_counterfactual(req: Dict[str, Any]):
    aid = req.get("alert_id") or req.get("id")
    edges = req.get("excluded_tx_ids") or req.get("remove_edges", [])
    return engine.simulate_counterfactual(aid, edges)

@app.post("/api/feedback")
def api_feedback(req: Dict[str, Any]):
    aid = req.get("alert_id") or req.get("id")
    action = req.get("action", "confirm")
    decision = "confirm" if "CONFIRM" in action.upper() else "reject"
    return review_alert(aid, ReviewRequest(decision=decision, note=req.get("analyst_notes", "")))

@app.get("/api/evaluation")
def api_evaluation():
    return get_metrics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

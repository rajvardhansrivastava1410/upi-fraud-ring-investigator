# AegisUPI: UPI Fraud-Ring Graph Investigator (PS 16)

> **Autonomous Temporal Graph Intelligence & Explainable Analyst Workbench for Cross-Bank UPI Fraud Syndicates**

Built for **Code-e-Manipal 36-Hour Hackathon** | **Track**: CyberTech / FinTech / Open Innovation

---

## ⚡ Quick Start (One Command)

To run the entire system (Data Generator, Graph Detection Engine, REST APIs, and Interactive Workbench):

```bash
chmod +x start.sh
./start.sh
```

- **Analyst Workbench UI**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🎯 The Problem & Our Solution

### The Challenge
In UPI networks, fraud syndicates exploit **banking data silos**. When an account receives stolen funds and immediately transfers them to another bank, both banks see an ordinary transaction. Existing rule-based engines:
1. **Miss multi-hop mule layering**: Fraud split into ₹25,000 hops escapes single-transaction threshold rules.
2. **Flag innocent users**: Families sharing an iPad or tea shops with rapid small customer payments are falsely frozen.

### Our Solution
**AegisUPI** builds a directed heterogeneous temporal graph from transaction metadata:
- **Temporal Graph Motif Mining**: Detects directed acyclic paths with rapid fund dilution ($0.80 \le \text{retention} \le 0.99$, $\Delta t < 15\text{ mins}$) and burst star topologies around shared devices.
- **Explainable Evidence Paths**: Every alert outputs the exact step-by-step transaction trail and formulates a plausible benign hypothesis (e.g. wedding pool, informal loan).
- **Counterfactual Simulator**: Analysts can toggle specific edges on/off to mathematically test which transaction is the keystone holding the ring together.
- **Empirical Ground-Truth Proof**: Built-in benchmark comparing our engine against heuristic baselines.

---

## 📊 Empirical Evaluation (Benchmark Ground Truth)

| Metric | Baseline Threshold Rules | AegisUPI Graph Motif Engine |
| :--- | :---: | :---: |
| **Precision** | 44.4% | **76.5%** |
| **Recall (Rings Caught)** | 30.8% | **100.0%** |
| **F1-Score** | 0.364 | **0.867** |
| **False Positives on Family Shared Device** | ❌ **FAILED** (Flagged benign iPad) | ✅ **100% Rejection** (Zero false alarms) |
| **Out-of-Order Transaction Invariance** | Low | **98.5% Stable** |

---

## 🏰 The Moat: Privacy-Preserving Pattern Federation

> **The 1-Sentence Pitch**: *"Banks cannot legally share raw transaction data due to DPDP Act privacy rules, but they can share encrypted temporal graph motifs."*

When an analyst at Bank A confirms a fraud syndicate:
1. The raw PII (account numbers, names, phone numbers) is stripped.
2. The subgraph is abstracted into an encrypted **Topological Vector Fingerprint** (hop latency, volume dilution ratio, degree distribution).
3. The signature is broadcasted across the federated network so Bank B and Bank C can proactively block the syndicate before they cash out.

---

## 📂 Project Architecture

```
upi-fraud-ring-investigator/
├── backend/
│   ├── generator.py          # Synthetic benchmark generator (Planted rings + Benign controls)
│   ├── engine.py             # NetworkX graph builder, temporal motif detectors & counterfactuals
│   ├── evaluation.py         # Precision, recall, and stability benchmark against ground truth
│   ├── main.py               # FastAPI server exposing REST APIs and static workbench
│   ├── requirements.txt      # Python dependencies (fastapi, uvicorn, networkx, pydantic)
│   ├── static/
│   │   └── index.html        # Interactive Dark-Mode Analyst Workbench (HTML5 Canvas + Tailwind)
│   └── data/
│       ├── dataset.json      # 150 accounts, 540+ transactions
│       ├── ground_truth.json # Planted ring labels (Mule chain, device burst, smurfing pool)
│       └── feedback_store.json# Human-in-the-loop analyst decisions
├── start.sh                  # One-command launch script
└── README.md                 # Project documentation & pitch guide
```

---

## 🎤 4-Minute Judge Demo Script

1. **Minute 1 - The Hook (Noise to Signal)**:
   - Open [http://localhost:8000](http://localhost:8000). Show the full graph: hundreds of transactions between accounts that look completely normal on surface level.
2. **Minute 2 - The Ring Emerges**:
   - Click **ALERT_MULE_...** in the left queue. Watch the canvas auto-zoom into the red pulsating 4-node chain.
   - Point out the evidence trail: ₹88,000 sent from victim, forwarded in 120 seconds with 5% cut to Mule 2, then Mule 3.
3. **Minute 3 - The Counterfactual Toggle (The "Wow" Moment)**:
   - Under the Counterfactual Test panel, uncheck the middle hop transaction (`TX_00511`).
   - Show how the score drops to **0.0% (RING COLLAPSED)** in real time. Explain: *"This mathematically proves to fraud investigators that cutting this single intermediary node neutralizes the syndicate."*
4. **Minute 4 - Benchmark & The Moat**:
   - Click the **Benchmark & Proof** tab: Show the 86.7% F1 score vs 36.4% baseline and highlight the zero false-positive rate on benign family devices.
   - Click **The Moat** tab: Deliver the DPDP-compliant cross-bank pattern sharing thesis.

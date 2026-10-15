<<<<<<< HEAD
# UPI Fraud-Ring Graph Investigator — Frontend

> **⚠️ Synthetic data only. This application never connects to live UPI rails and processes no personal financial data of any kind. All transactions, accounts, device hashes, and complaint records are procedurally generated solely for research and hackathon demonstration purposes.**

A Next.js analyst workbench for investigating coordinated payment-network behaviour. Analysts review a prioritised alert queue, explore the transaction graph behind each alert, and record decisions — all in a single dark-theme, accessibility-first UI.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Key Differentiators](#key-differentiators)
6. [Hackathon Language Policy](#hackathon-language-policy)
7. [Baseline Comparison](#baseline-comparison)
8. [Evaluation & Benchmarks](#evaluation--benchmarks)
9. [Accessibility & Motion](#accessibility--motion)
10. [Stack](#stack)

---

## Quick Start

```bash
# 1. Install dependencies (recharts is included)
npm install

# 2. Run in demo mode — no backend required
NEXT_PUBLIC_DEMO=1 npm run dev

# 3. Open the app
open http://localhost:3000
```

> **Demo mode** (`NEXT_PUBLIC_DEMO=1`) serves all data from local JSON fixtures under `fixtures/`. No network calls leave the machine.

To run against the real backend:

```bash
# Start the backend separately (see /backend/README.md)
npm run dev   # omit NEXT_PUBLIC_DEMO
=======
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
>>>>>>> 8a504ff377d2337480b389a9e61e93eb43d2553c
```

---

<<<<<<< HEAD
## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_DEMO` | `0` | Set to `1` to use local fixture data instead of hitting the backend API. |
| `NEXT_PUBLIC_API_URL` | _(empty)_ | Override the backend base URL (e.g. `http://localhost:8000`). |

---

## Project Structure

```
frontend/
├── app/
│   ├── api/mock/          # Next.js Route Handlers — demo fixture endpoints
│   │   └── alerts/
│   │       ├── route.ts          # GET /api/mock/alerts?k=N
│   │       └── [id]/
│   │           ├── graph/route.ts      # GET /api/mock/alerts/:id/graph
│   │           └── hypotheses/route.ts # GET /api/mock/alerts/:id/hypotheses
│   ├── evaluation/        # /evaluation page — Recharts benchmarks
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main investigator workbench
├── components/
│   ├── EmptyState.tsx      # [NEW] Inline-SVG empty states (3 variants)
│   ├── LoadingState.tsx    # [NEW] Spinner / skeleton / graph-placeholder
│   ├── GraphPane.tsx       # Graph explorer with edge filters
│   ├── GraphView.tsx       # Cytoscape canvas wrapper
│   ├── QueuePane.tsx       # Alert queue with baseline comparison toggle
│   ├── EvidencePane.tsx    # Explanation panel (reasons + discounts)
│   ├── DecisionTab.tsx     # Confirm / Dismiss / Needs-info workflow
│   ├── CounterfactualTab.tsx # Counterfactual "what-if" hypotheses
│   └── TimeSlider.tsx      # Temporal replay slider
├── fixtures/
│   ├── alerts.json
│   ├── graph-A-014.json
│   ├── graph-A-051.json
│   ├── graph-fallback.json # Generic fallback for unrecognised alert IDs
│   ├── hypotheses-A-014.json
│   └── hypotheses-A-051.json
├── lib/
│   ├── api.ts             # SWR hooks: useAlerts, useAlertGraph
│   ├── format.ts          # Edge/time formatters
│   ├── store.ts           # Zustand store (decisions, selected IDs)
│   └── types.ts           # Shared TypeScript contract
└── tailwind.config.js
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Next.js App Router)           │
│                                                         │
│  QueuePane ──────► Zustand store ◄──── GraphPane        │
│     │               selectedAlertId       │             │
│     │               selectedEdgeId        │             │
│     ▼                                     ▼             │
│  useAlerts()                        useAlertGraph()     │
│  (SWR hook)                         (SWR hook)          │
│     │                                     │             │
│     └──────────────┬────────────────────┘             │
│                    ▼                                    │
│            /api/mock/*  (demo)                         │
│         or /api/*       (live backend)                 │
└─────────────────────────────────────────────────────────┘
```

State is kept entirely in-browser via **Zustand**. Decisions are persisted to `localStorage` (key: `upi-decisions-v1`) so they survive page refreshes during demos.

---

## Key Differentiators

### 1. Time Slider — Temporal Graph Replay

The [`TimeSlider`](components/TimeSlider.tsx) component lets analysts scrub through the transaction timeline. As the slider advances, edges with `event_time` beyond the selected timestamp are hidden, revealing how the coordinated behaviour pattern built up over time. This is unique to graph-native tooling — traditional tabular rule engines have no concept of temporal topology.

### 2. Counterfactual Hypotheses

The [`CounterfactualTab`](components/CounterfactualTab.tsx) presents hypothesis cards generated by the backend: *"If we remove the shared device link, the score drops from 0.86 → 0.52."* This gives analysts an actionable explanation, not just a score — critical for accountability and for deciding whether to request additional data.

### 3. Confidence Intervals Under Missing Data

Every alert carries `confidence_low` / `confidence_high` bounds. When edge data is incomplete (e.g. `device_id` missing on some transfers), the bounds widen automatically. The score bar in the queue visualises this uncertainty band, making it obvious when an analyst should request more information before confirming.

### 4. Baseline Comparison Toggle

Click **▼ Compare** in the queue header to see a side-by-side table comparing B1 (Shared Device heuristic), B2 (Velocity rule), and B3 (Isolation Forest anomaly detector) against the Graph Engine's score for every alert. This demonstrates where graph-topology reasoning adds value over simpler methods.

---

## Hackathon Language Policy

This is a strict project-wide requirement. All contributors and AI tools **must** follow these rules:

| ❌ Forbidden term | ✅ Required alternative |
|---|---|
| "Fraud detected" / "fraudulent" | "Coordinated behaviour" |
| "Accept" (a decision) | "Confirm" |
| "Reject" (a decision) | "Dismiss" |
| Red (`red-*` Tailwind colours) | Amber (`amber-500` / `amber-400`) |
| "Criminal" / "fraudster" | "Subject account" / "ring member" |

**Rationale:** These patterns are high-risk and often benign (shared family phones, cyber cafes, wedding pools, merchant supplier chains). Language that presupposes guilt violates analyst objectivity and creates liability. The system surfaces *signals* for human review — it does not render verdicts.

---

## Baseline Comparison

Three baselines are tracked alongside the Graph Engine:

| ID | Name | Method |
|---|---|---|
| B1 | Shared Device | Rule: flag any account sharing a device fingerprint with ≥ 2 others |
| B2 | Velocity | Rule: flag accounts with > N transactions in a rolling T-minute window |
| B3 | Isolation Forest | Sklearn `IsolationForest` on per-account feature vectors |

In the queue, toggle **▼ Compare** to expand a comparison table per alert showing each baseline's flag status and synthetic score vs the Graph Engine's composite score.

The [`/evaluation`](http://localhost:3000/evaluation) page shows aggregate Precision@K, Recall@K, stability under late-arriving complaints (Jaccard similarity), and False Positive Rates on labelled benign typologies.

---

## Evaluation & Benchmarks

Navigate to [`/evaluation`](http://localhost:3000/evaluation) to see:

- **Precision / Recall at Budget (K)** — fixed analyst budget of K=10, 25, 50 alerts
- **Stability vs. Complaint Lag** — Top-K Jaccard similarity as complaint records are delayed by 0h → 48h
- **Benign Typology False Positive Rates** — Family Shared Phone, Cyber Cafe, Wedding Pool, Shop Suppliers

All charts use **Recharts** with a dark `slate-950` theme and amber accents.

---

## Accessibility & Motion

- All interactive elements have `focus-visible:ring-2 focus-visible:ring-amber-400` outlines.
- `aria-pressed`, `aria-live`, `aria-label`, and `role="status"` are used throughout.
- All CSS animations in `LoadingState` are wrapped in `motion-safe:animate-*`, so they are **automatically disabled** for users with `prefers-reduced-motion: reduce` set in their OS accessibility preferences.
- Colour is never used as the sole means of conveying information.

---

## Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Styling | Tailwind CSS v3 | ^3.4 |
| State | Zustand | ^5.0 |
| Data fetching | SWR | ^2.5 |
| Graph rendering | Cytoscape.js + react-cytoscapejs | ^3.34 / ^2.0 |
| Charts | Recharts | ^3.10 |
| Icons | lucide-react | ^1.57 |
| Language | TypeScript | ^5 |

> Tailwind v3 is intentionally pinned. The project does **not** use Tailwind v4 or the `@tailwindcss/vite` / `@tailwindcss/turbopack` v4 plugins in production CSS processing.
=======
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
>>>>>>> 8a504ff377d2337480b389a9e61e93eb43d2553c

// API contract shared with the backend. Keep in sync with backend/api_contract.md.

export type AlertStatus = 'open' | 'confirmed' | 'dismissed' | 'needs_info';

export type Reason = {
  rule: string; // e.g. "R2_pass_through"
  points: number; // positive contribution to the score
  text: string; // human-readable reason
  edge_ids: string[]; // evidence edges this term maps to
};

export type BenignDiscount = { name: string; points: number }; // points are negative

export type Alert = {
  id: string;
  rank: number;
  score: number; // 0..1
  confidence_low: number;
  confidence_high: number;
  status: AlertStatus;
  reasons: Reason[];
  benign_discounts: BenignDiscount[];
  missing_data: string[];
  baseline_flags: { shared_device: boolean; velocity: boolean; ml: boolean };
};

export type AlertQueue = {
  budget_k: number; // analyst alert budget per review cycle
  alerts: Alert[];
};

export type GraphNode = {
  id: string;
  type: 'account' | 'device' | 'merchant' | 'complaint';
  label: string;
  flagged?: boolean;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: 'transfer' | 'collect_request' | 'uses_device' | 'complaint_about' | 'pays_merchant';
  amount?: number;
  event_time: string; // ISO 8601
  ingest_time: string; // ISO 8601, always >= event_time
  incomplete?: boolean;
};

export type AlertGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  evidence_path: string[]; // ordered edge ids
};

export type DecisionKind = 'confirm' | 'dismiss' | 'needs_info';

// Append-only audit record. Decisions never change an alert's score or rank.
export type Decision = {
  id: string;
  alert_id: string;
  decision: DecisionKind;
  note: string; // required
  analyst: string;
  created_at: string; // ISO 8601
  score_at_decision: number;
  rank_at_decision: number;
};

// ── Counterfactual & hypotheses ───────────────────────────────────────────────

export type CounterfactualRequest = {
  remove_edges: string[];        // edge IDs to suppress
  hypothesis?: string;           // benign hypothesis ID to apply
  impute?: string[];             // missing-data what-if IDs to impute
};

export type CounterfactualResult = {
  new_score: number;
  delta: number;
  below_cutoff: boolean;
};

export type BenignHypothesis = {
  id: string;
  name: string;
  summary: string;
  check: string;   // distinguishing check an analyst should perform
  points: number;  // points subtracted from score if hypothesis holds
};

export type MissingDataWhatIf = {
  id: string;
  text: string;
  points: number;  // score impact if the missing data were to arrive
};

export type HypothesesResponse = {
  alert_id: string;
  hypotheses: BenignHypothesis[];
  what_ifs: MissingDataWhatIf[];
};

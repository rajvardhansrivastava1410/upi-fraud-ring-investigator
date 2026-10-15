/**
 * RingLens API and Data Model Types
 * Based on docs/API_CONTRACT.md and docs/DATABASE.md
 * NOTE: All fields and models correspond strictly to proposed schemas.
 */

export type AlertStatus = 'open' | 'investigating' | 'acknowledged' | 'escalated' | 'closed'
export type AlertType = 'possible_ring' | 'mule_burst' | 'fan_out_layering' | 'circular_routing'
export type ConfidenceBand = 'high' | 'medium' | 'low'
export type EntityType = 'account' | 'device' | 'merchant' | 'vpa'

export interface ExplanationItem {
  code: string
  text: string
  severity?: 'critical' | 'warning' | 'info'
  score_impact?: number // e.g. +35, +25, -20
}

export interface AlertSummary {
  id: string
  dataset_id: string
  entity_id: string
  alert_type: AlertType
  risk_score: number // 0.0 - 1.0 (display as Review Priority)
  confidence_band: ConfidenceBand
  status: AlertStatus
  assignee: string | null
  created_at: string
  synthetic: true
  scoring_version: string
  explanation: ExplanationItem[]
  
  // Baseline and warnings
  baseline_tag?: 'mule_burst' | 'shop_supplier' | 'shared_device' | 'ring_relay'
  missing_data_warnings?: string[]
  incomplete_records?: boolean
  
  // Associated synthetic context
  primary_vpa: string
  total_volume_minor: number
  hop_count: number
  node_count: number
}

export interface GraphNodeData {
  id: string
  label: string
  type: EntityType
  is_focal?: boolean
  risk_score?: number
  synthetic: true
  incomplete?: boolean
  meta?: {
    account_ref?: string
    vpa?: string
    device_fingerprint?: string
    bank_ifsc_synthetic?: string
    flagged?: boolean
    first_seen?: string
    last_seen?: string
  }
}

export interface GraphEdgeData {
  id: string
  source: string
  target: string
  transaction_id: string
  amount_minor: number
  currency: string
  occurred_at: string
  ingested_at: string
  evidence_type: 'direct_transfer' | 'shared_device' | 'rapid_relay' | 'circular_flow' | 'commercial'
  is_evidence_path?: boolean
  is_dimmed?: boolean
  incomplete?: boolean
  channel?: string
}

export interface EvidenceTimelineStep {
  step: number
  event_time: string
  ingest_time: string
  description: string
  rule_code: string
  rule_tag: string
  points: number // score points (e.g. +30)
  is_discount?: boolean // e.g. -15 for known merchant
  edge_id?: string
  node_id?: string
  transaction_id?: string
  amount_minor?: number
}

export interface SubgraphResponse {
  alert_id: string
  hops: number
  as_of: string
  rationale: string
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  timeline: EvidenceTimelineStep[]
  waterfall: Array<{
    factor: string
    impact: number
    type: 'rule_point' | 'benign_discount'
  }>
  missing_data_warnings: string[]
}

export interface CounterfactualEdgeToggle {
  edge_id: string
  removed: boolean
}

export interface CounterfactualResponse {
  alert_id: string
  original_risk_score: number
  new_risk_score: number
  score_delta: number
  below_cutoff: boolean
  is_hypothetical: true
  synthetic_scenario: string
  altered_factors: Array<{
    factor: string
    original_impact: string
    new_impact: string
  }>
  explanation: string
}

export interface BenignHypothesis {
  id: string
  title: string
  confidence: 'high' | 'medium' | 'low'
  description: string
  distinguishing_checks: string[]
}

export interface DecisionRecord {
  id: string
  alert_id: string
  decision: 'confirm' | 'dismiss' | 'needs_more_info'
  note: string
  actor: string
  timestamp: string
}

export interface DecisionRequest {
  decision: 'confirm' | 'dismiss' | 'needs_more_info'
  note: string
}

export interface EvaluationData {
  run_id: string
  scoring_version: string
  pr_at_k: Array<{ k: number; precision: number; recall: number; baseline_precision: number }>
  benign_false_positives: Array<{
    cluster_id: string
    device_fingerprint: string
    account_count: number
    tx_count: number
    benign_pattern: string
    recommended_discount: string
  }>
  late_arrival_stability: Array<{
    delay_minutes: number
    score_drift: number
    classification_stability_pct: number
  }>
  baseline_comparisons: {
    ringlens_f1: number
    rule_heuristic_f1: number
    unweighted_graph_f1: number
  }
  failure_cases: Array<{
    case_id: string
    scenario: string
    expected: string
    actual: string
    root_cause: string
  }>
}

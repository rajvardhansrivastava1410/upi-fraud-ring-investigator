import {
  AlertSummary,
  SubgraphResponse,
  BenignHypothesis,
  DecisionRecord,
  EvaluationData,
  CounterfactualResponse,
} from '@/types/api'

/**
 * Deterministic Synthetic Mock Fixtures
 * Seed: 4242
 * Strictly synthetic IDs and non-personal references.
 * Covers:
 * 1. High-risk multi-hop ring
 * 2. Benign shared-device case
 * 3. Shop/supplier commercial case
 * 4. Empty queue scenario fixture
 * 5. Incomplete records / late arrival case
 */

export const MOCK_ALERTS: AlertSummary[] = [
  {
    id: 'alert_syn_high_01',
    dataset_id: 'dataset_syn_2026_q1',
    entity_id: 'ent_syn_9011',
    alert_type: 'possible_ring',
    risk_score: 0.94, // Review priority 94%
    confidence_band: 'high',
    status: 'open',
    assignee: 'Analyst_A1',
    created_at: '2026-10-15T08:24:00Z',
    synthetic: true,
    scoring_version: 'proposal-0.2',
    primary_vpa: 'syn_layered_agg@synthetic-axis',
    total_volume_minor: 48500000, // ₹4,85,000.00
    hop_count: 4,
    node_count: 6,
    baseline_tag: 'ring_relay',
    missing_data_warnings: [
      'Device MAC record for Staging Hub D delayed by 18 minutes in telemetry ingest pipeline.',
    ],
    incomplete_records: false,
    explanation: [
      {
        code: 'rapid_hop_layering',
        text: 'Velocity cascade: ₹4.85L routed through 3 intermediate relays in 14 minutes.',
        severity: 'critical',
        score_impact: 40,
      },
      {
        code: 'shared_device_cluster',
        text: 'Shared hardware fingerprint SYN-DEV-99A authorized transfers for 2 separate relays.',
        severity: 'critical',
        score_impact: 35,
      },
      {
        code: 'round_structuring',
        text: 'Consecutive transactions structured precisely beneath common review thresholds.',
        severity: 'warning',
        score_impact: 20,
      },
    ],
  },
  {
    id: 'alert_syn_benign_dev_02',
    dataset_id: 'dataset_syn_2026_q1',
    entity_id: 'ent_syn_4412',
    alert_type: 'possible_ring',
    risk_score: 0.42, // Low review priority
    confidence_band: 'low',
    status: 'investigating',
    assignee: 'Analyst_B2',
    created_at: '2026-10-15T08:10:00Z',
    synthetic: true,
    scoring_version: 'proposal-0.2',
    primary_vpa: 'syn_cafe_pos@synthetic-hdfc',
    total_volume_minor: 12400000,
    hop_count: 1,
    node_count: 5,
    baseline_tag: 'shared_device',
    missing_data_warnings: [],
    incomplete_records: false,
    explanation: [
      {
        code: 'shared_pos_kiosk',
        text: 'Common tablet device fingerprint matches verified retail food kiosk.',
        severity: 'info',
        score_impact: -25, // discount
      },
      {
        code: 'diverse_counterparties',
        text: 'Incoming traffic originates from 4 distinct non-interconnected customer synthetic accounts.',
        severity: 'info',
        score_impact: -15,
      },
    ],
  },
  {
    id: 'alert_syn_shop_supplier_03',
    dataset_id: 'dataset_syn_2026_q1',
    entity_id: 'ent_syn_8819',
    alert_type: 'fan_out_layering',
    risk_score: 0.48,
    confidence_band: 'medium',
    status: 'acknowledged',
    assignee: null,
    created_at: '2026-10-15T07:45:00Z',
    synthetic: true,
    scoring_version: 'proposal-0.2',
    primary_vpa: 'syn_wholesaler_dist@synthetic-icici',
    total_volume_minor: 68000000,
    hop_count: 2,
    node_count: 5,
    baseline_tag: 'shop_supplier',
    missing_data_warnings: [
      'Bank settlement reference missing timestamp on invoice clearance.',
    ],
    incomplete_records: true,
    explanation: [
      {
        code: 'commercial_recurring_burst',
        text: 'Bimonthly scheduled batch payouts to verified local grocery retailers.',
        severity: 'info',
        score_impact: -30,
      },
      {
        code: 'fan_out_dispersion',
        text: 'Simultaneous disbursements to 4 merchant outlets within 10 minutes.',
        severity: 'warning',
        score_impact: 25,
      },
    ],
  },
  {
    id: 'alert_syn_mule_burst_04',
    dataset_id: 'dataset_syn_2026_q1',
    entity_id: 'ent_syn_2209',
    alert_type: 'mule_burst',
    risk_score: 0.88,
    confidence_band: 'high',
    status: 'open',
    assignee: 'Analyst_C3',
    created_at: '2026-10-15T06:30:00Z',
    synthetic: true,
    scoring_version: 'proposal-0.2',
    primary_vpa: 'syn_dormant_mule22@synthetic-sbi',
    total_volume_minor: 32000000,
    hop_count: 2,
    node_count: 4,
    baseline_tag: 'mule_burst',
    missing_data_warnings: [],
    incomplete_records: false,
    explanation: [
      {
        code: 'dormancy_break',
        text: 'Account inactive for 90 days received sudden inflow of ₹3.2L.',
        severity: 'critical',
        score_impact: 45,
      },
      {
        code: 'immediate_liquidation',
        text: '99% of total funds transferred outward within 3 minutes of receipt.',
        severity: 'critical',
        score_impact: 35,
      },
    ],
  },
]

export const MOCK_SUBGRAPHS: Record<string, SubgraphResponse> = {
  alert_syn_high_01: {
    alert_id: 'alert_syn_high_01',
    hops: 2,
    as_of: '2026-10-15T08:24:00Z',
    rationale:
      'Coordinated transaction sequence consistent with rapid hop layering: ₹4,85,000 disbursed from Source A across Mules B and C, aggregated into D, and liquidated at Merchant E in under 18 minutes.',
    missing_data_warnings: [
      'Device MAC record for Staging Hub D delayed by 18 minutes in telemetry ingest pipeline.',
    ],
    nodes: [
      {
        id: 'node_syn_source_A',
        label: 'Source A (Compromised)',
        type: 'account',
        is_focal: true,
        risk_score: 0.95,
        synthetic: true,
        meta: {
          account_ref: 'SYN-ACC-00109',
          vpa: 'syn_victim_source@synthetic-sbi',
          bank_ifsc_synthetic: 'SYNB0001001',
          flagged: true,
        },
      },
      {
        id: 'node_syn_mule_B',
        label: 'Relay Mule B',
        type: 'account',
        risk_score: 0.88,
        synthetic: true,
        meta: {
          account_ref: 'SYN-ACC-00821',
          vpa: 'syn_relay_b@synthetic-hdfc',
          bank_ifsc_synthetic: 'SYNB0002002',
          flagged: true,
        },
      },
      {
        id: 'node_syn_mule_C',
        label: 'Relay Mule C',
        type: 'account',
        risk_score: 0.91,
        synthetic: true,
        meta: {
          account_ref: 'SYN-ACC-00822',
          vpa: 'syn_relay_c@synthetic-axis',
          bank_ifsc_synthetic: 'SYNB0003003',
          flagged: true,
        },
      },
      {
        id: 'node_syn_device_99A',
        label: 'Device SYN-DEV-99A',
        type: 'device',
        risk_score: 0.99,
        synthetic: true,
        meta: {
          device_fingerprint: 'fp_syn_4f8812c98a0021b',
          flagged: true,
        },
      },
      {
        id: 'node_syn_aggregator_D',
        label: 'Staging Hub D',
        type: 'account',
        risk_score: 0.96,
        synthetic: true,
        incomplete: true,
        meta: {
          account_ref: 'SYN-ACC-00994',
          vpa: 'syn_staging_d@synthetic-icici',
          bank_ifsc_synthetic: 'SYNB0004004',
          flagged: true,
        },
      },
      {
        id: 'node_syn_merchant_E',
        label: 'Merchant E (Cashout)',
        type: 'merchant',
        risk_score: 0.72,
        synthetic: true,
        meta: {
          vpa: 'syn_crypto_p2p_mart@synthetic-yes',
          flagged: false,
        },
      },
      {
        id: 'node_syn_unrelated_F',
        label: 'Unrelated P2P User F',
        type: 'account',
        risk_score: 0.15,
        synthetic: true,
        meta: {
          account_ref: 'SYN-ACC-00777',
          vpa: 'syn_groceries@synthetic-upi',
          flagged: false,
        },
      },
    ],
    edges: [
      {
        id: 'edge_syn_tx_101',
        source: 'node_syn_source_A',
        target: 'node_syn_mule_B',
        transaction_id: 'SYN-TX-10101',
        amount_minor: 24500000,
        currency: 'INR',
        occurred_at: '2026-10-15T08:02:11Z',
        ingested_at: '2026-10-15T08:02:25Z',
        evidence_type: 'direct_transfer',
        is_evidence_path: true,
        channel: 'UPI_P2P',
      },
      {
        id: 'edge_syn_tx_102',
        source: 'node_syn_source_A',
        target: 'node_syn_mule_C',
        transaction_id: 'SYN-TX-10102',
        amount_minor: 24000000,
        currency: 'INR',
        occurred_at: '2026-10-15T08:03:45Z',
        ingested_at: '2026-10-15T08:03:55Z',
        evidence_type: 'direct_transfer',
        is_evidence_path: true,
        channel: 'UPI_P2P',
      },
      {
        id: 'edge_syn_dev_link_1',
        source: 'node_syn_mule_B',
        target: 'node_syn_device_99A',
        transaction_id: 'SYN-SIGNAL-001',
        amount_minor: 0,
        currency: 'INR',
        occurred_at: '2026-10-15T08:04:00Z',
        ingested_at: '2026-10-15T08:05:10Z',
        evidence_type: 'shared_device',
        is_evidence_path: true,
      },
      {
        id: 'edge_syn_dev_link_2',
        source: 'node_syn_mule_C',
        target: 'node_syn_device_99A',
        transaction_id: 'SYN-SIGNAL-002',
        amount_minor: 0,
        currency: 'INR',
        occurred_at: '2026-10-15T08:05:00Z',
        ingested_at: '2026-10-15T08:05:40Z',
        evidence_type: 'shared_device',
        is_evidence_path: true,
      },
      {
        id: 'edge_syn_tx_103',
        source: 'node_syn_mule_B',
        target: 'node_syn_aggregator_D',
        transaction_id: 'SYN-TX-10103',
        amount_minor: 24200000,
        currency: 'INR',
        occurred_at: '2026-10-15T08:08:12Z',
        ingested_at: '2026-10-15T08:10:00Z',
        evidence_type: 'rapid_relay',
        is_evidence_path: true,
        channel: 'UPI_P2P',
      },
      {
        id: 'edge_syn_tx_104',
        source: 'node_syn_mule_C',
        target: 'node_syn_aggregator_D',
        transaction_id: 'SYN-TX-10104',
        amount_minor: 23800000,
        currency: 'INR',
        occurred_at: '2026-10-15T08:09:50Z',
        ingested_at: '2026-10-15T08:11:10Z',
        evidence_type: 'rapid_relay',
        is_evidence_path: true,
        channel: 'UPI_P2P',
      },
      {
        id: 'edge_syn_tx_105',
        source: 'node_syn_aggregator_D',
        target: 'node_syn_merchant_E',
        transaction_id: 'SYN-TX-10105',
        amount_minor: 47900000,
        currency: 'INR',
        occurred_at: '2026-10-15T08:15:20Z',
        ingested_at: '2026-10-15T08:33:20Z', // 18m late arrival
        evidence_type: 'direct_transfer',
        is_evidence_path: true,
        incomplete: true,
        channel: 'UPI_P2M',
      },
      {
        id: 'edge_syn_tx_unrelated_106',
        source: 'node_syn_source_A',
        target: 'node_syn_unrelated_F',
        transaction_id: 'SYN-TX-10106',
        amount_minor: 50000,
        currency: 'INR',
        occurred_at: '2026-10-15T07:12:00Z',
        ingested_at: '2026-10-15T07:12:10Z',
        evidence_type: 'commercial',
        is_evidence_path: false,
        is_dimmed: true,
      },
    ],
    timeline: [
      {
        step: 1,
        event_time: '2026-10-15T08:02:11Z',
        ingest_time: '2026-10-15T08:02:25Z',
        description: 'First outbound layer: ₹2,45,000 transferred to Relay Mule B.',
        rule_code: 'R_DISPERSE_1',
        rule_tag: 'Dispersal Layer',
        points: 25,
        edge_id: 'edge_syn_tx_101',
        node_id: 'node_syn_mule_B',
        transaction_id: 'SYN-TX-10101',
        amount_minor: 24500000,
      },
      {
        step: 2,
        event_time: '2026-10-15T08:03:45Z',
        ingest_time: '2026-10-15T08:03:55Z',
        description: 'Second outbound layer: ₹2,40,000 transferred to Relay Mule C.',
        rule_code: 'R_DISPERSE_2',
        rule_tag: 'Dispersal Layer',
        points: 25,
        edge_id: 'edge_syn_tx_102',
        node_id: 'node_syn_mule_C',
        transaction_id: 'SYN-TX-10102',
        amount_minor: 24000000,
      },
      {
        step: 3,
        event_time: '2026-10-15T08:04:00Z',
        ingest_time: '2026-10-15T08:05:10Z',
        description: 'Hardware fingerprint collision: Mules B & C authenticated via SYN-DEV-99A.',
        rule_code: 'R_SHARED_DEV',
        rule_tag: 'Shared Device Co-location',
        points: 35,
        edge_id: 'edge_syn_dev_link_1',
        node_id: 'node_syn_device_99A',
        transaction_id: 'SYN-SIGNAL-001',
      },
      {
        step: 4,
        event_time: '2026-10-15T08:08:12Z',
        ingest_time: '2026-10-15T08:10:00Z',
        description: 'Rapid relay: 98% balance forwarded into Staging Hub D in 6 minutes.',
        rule_code: 'R_VELOCITY_RELAY',
        rule_tag: 'Fast Aggregation',
        points: 20,
        edge_id: 'edge_syn_tx_103',
        node_id: 'node_syn_aggregator_D',
        transaction_id: 'SYN-TX-10103',
        amount_minor: 24200000,
      },
      {
        step: 5,
        event_time: '2026-10-15T08:15:20Z',
        ingest_time: '2026-10-15T08:33:20Z',
        description: 'Final cashout: Aggregate ₹4,79,000 transferred to Merchant E (late telemetry ingest).',
        rule_code: 'R_CASHOUT_P2M',
        rule_tag: 'Liquidation Outflow',
        points: 15,
        edge_id: 'edge_syn_tx_105',
        node_id: 'node_syn_merchant_E',
        transaction_id: 'SYN-TX-10105',
        amount_minor: 47900000,
      },
    ],
    waterfall: [
      { factor: 'Rapid Hop Velocity (<15m)', impact: 40, type: 'rule_point' },
      { factor: 'Shared Hardware Fingerprint (SYN-DEV-99A)', impact: 35, type: 'rule_point' },
      { factor: 'Sub-threshold Structured Sums', impact: 20, type: 'rule_point' },
      { factor: 'Known Regular Contact Discount', impact: -5, type: 'benign_discount' },
    ],
  },
}

export const MOCK_HYPOTHESES: Record<string, BenignHypothesis[]> = {
  alert_syn_high_01: [
    {
      id: 'hyp_family_transfer',
      title: 'Family / Household Pool Transfer',
      confidence: 'low',
      description:
        'Members of a single family sharing an iPad or home device executing emergency healthcare payments.',
      distinguishing_checks: [
        'Check if account holders share matching surname or physical residential PIN code.',
        'Verify if beneficiary Merchant E is an accredited hospital or licensed entity versus unverified crypto mart.',
      ],
    },
    {
      id: 'hyp_retail_pos',
      title: 'Multi-clerk Retail Kiosk Terminal',
      confidence: 'low',
      description:
        'A busy storefront where multiple authorized cashiers collect customer UPI payments on one shared phone.',
      distinguishing_checks: [
        'Check if all transactions occur strictly during business operating hours (9 AM - 9 PM).',
        'Verify GST registration status of the receiving accounts.',
      ],
    },
  ],
  alert_syn_benign_dev_02: [
    {
      id: 'hyp_kiosk_verified',
      title: 'Commercial Food Court Shared Billing Tablet',
      confidence: 'high',
      description:
        'Device is physically located at stationary food court counter; customers scan dynamic QR codes.',
      distinguishing_checks: [
        'Geo-coordinates remain consistently within 10 meters radius across all transactions.',
        'High volume of distinct, repeat micro-transactions during lunchtime peak (12 PM - 3 PM).',
      ],
    },
  ],
}

export const MOCK_COUNTERFACTUALS: Record<string, CounterfactualResponse> = {
  alert_syn_high_01: {
    alert_id: 'alert_syn_high_01',
    original_risk_score: 0.94,
    new_risk_score: 0.32,
    score_delta: -0.62,
    below_cutoff: true,
    is_hypothetical: true,
    synthetic_scenario: 'counterfactual_device_severed',
    altered_factors: [
      {
        factor: 'Shared Device SYN-DEV-99A',
        original_impact: '+35 pts (Co-located hardware)',
        new_impact: '0 pts (Decoupled independent accounts)',
      },
      {
        factor: 'Velocity Decay Simulation',
        original_impact: '+40 pts (Transfers in 14 minutes)',
        new_impact: '+8 pts (Simulated 24-hour inter-hop delay)',
      },
    ],
    explanation:
      'Severing the shared device edge removes coordinated hardware linkage. The resulting review priority drops to 0.32, falling below the mandatory analyst intervention cutoff (0.60).',
  },
}

export const MOCK_DECISIONS: Record<string, DecisionRecord[]> = {
  alert_syn_high_01: [
    {
      id: 'dec_001',
      alert_id: 'alert_syn_high_01',
      decision: 'confirm',
      note: 'Evidence is consistent with coordinated behaviour across intermediary mules B and C. Shared hardware footprint confirms linkage. Recommend priority account freeze review.',
      actor: 'Senior_Analyst_Sharma',
      timestamp: '2026-10-15T08:35:00Z',
    },
  ],
}

export const MOCK_EVALUATION: EvaluationData = {
  run_id: 'eval_run_2026_syn_042',
  scoring_version: 'proposal-0.2',
  pr_at_k: [
    { k: 10, precision: 0.98, recall: 0.22, baseline_precision: 0.65 },
    { k: 25, precision: 0.95, recall: 0.48, baseline_precision: 0.58 },
    { k: 50, precision: 0.92, recall: 0.76, baseline_precision: 0.51 },
    { k: 100, precision: 0.88, recall: 0.89, baseline_precision: 0.44 },
    { k: 200, precision: 0.81, recall: 0.94, baseline_precision: 0.38 },
  ],
  benign_false_positives: [
    {
      cluster_id: 'CLUSTER-DEV-88B',
      device_fingerprint: 'SYN-DEV-88B (Canteen Tablet)',
      account_count: 6,
      tx_count: 142,
      benign_pattern: 'Food court kiosk with rapid multi-account QR scans',
      recommended_discount: 'Apply 35-point merchant terminal discount',
    },
    {
      cluster_id: 'CLUSTER-DEV-12C',
      device_fingerprint: 'SYN-DEV-12C (Apartment Society)',
      account_count: 8,
      tx_count: 48,
      benign_pattern: 'Society security guard collecting monthly maintenance fees',
      recommended_discount: 'Whitelist registered resident welfare VPAs',
    },
    {
      cluster_id: 'CLUSTER-DEV-44F',
      device_fingerprint: 'SYN-DEV-44F (Wholesale Mandi)',
      account_count: 5,
      tx_count: 89,
      benign_pattern: 'Vendor seasonal supplier invoices cleared in batch',
      recommended_discount: 'Apply commercial distributor schedule mask',
    },
  ],
  late_arrival_stability: [
    { delay_minutes: 0, score_drift: 0.0, classification_stability_pct: 100 },
    { delay_minutes: 5, score_drift: 0.02, classification_stability_pct: 98.5 },
    { delay_minutes: 15, score_drift: 0.05, classification_stability_pct: 96.1 },
    { delay_minutes: 30, score_drift: 0.09, classification_stability_pct: 92.4 },
    { delay_minutes: 60, score_drift: 0.14, classification_stability_pct: 88.0 },
  ],
  baseline_comparisons: {
    ringlens_f1: 0.905,
    rule_heuristic_f1: 0.672,
    unweighted_graph_f1: 0.748,
  },
  failure_cases: [
    {
      case_id: 'FAIL-SYN-001',
      scenario: 'High-frequency Kirana store with sub-minute transactions',
      expected: 'Review Priority < 0.40 (Benign retail)',
      actual: 'Review Priority 0.74 (Flagged as Mule Burst)',
      root_cause:
        'Heuristic misattributed high velocity without discounting verified merchant QR registration.',
    },
    {
      case_id: 'FAIL-SYN-002',
      scenario: 'Slow layering ring spanning >48 hours',
      expected: 'Review Priority > 0.85 (Fraud Ring)',
      actual: 'Review Priority 0.52 (Sub-threshold score)',
      root_cause:
        'Time-decay function aggressively eroded edge weights across 48-hour hop window.',
    },
  ],
}

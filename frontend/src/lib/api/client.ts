import axios from 'axios'
import {
  AlertSummary,
  SubgraphResponse,
  BenignHypothesis,
  DecisionRecord,
  DecisionRequest,
  EvaluationData,
  CounterfactualResponse,
} from '@/types/api'
import {
  MOCK_ALERTS,
  MOCK_SUBGRAPHS,
  MOCK_HYPOTHESES,
  MOCK_COUNTERFACTUALS,
  MOCK_DECISIONS,
  MOCK_EVALUATION,
} from '@/mocks/fixtures'

// Safely check environment in both Next.js and Vite browser environments
const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? (process.env as any) : {}
const metaEnv: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {}

export const API_BASE_URL =
  env.NEXT_PUBLIC_API_BASE_URL || metaEnv.VITE_API_BASE_URL || 'http://localhost:8000/api'
export const IS_DEMO_MODE =
  env.NEXT_PUBLIC_DEMO === '1' || metaEnv.VITE_DEMO === '1' || false

// Selective backend integration flag:
// Set to true to query live FastAPI for GET /alerts, while keeping all other endpoints safely mocked
export const CONNECT_LIVE_ALERTS_ENDPOINT =
  env.NEXT_PUBLIC_CONNECT_LIVE_ALERTS === '1' || metaEnv.VITE_CONNECT_LIVE_ALERTS === '1' || false

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
})

// In-memory state for append-only decisions in interactive demo mode
const localDecisions: Record<string, DecisionRecord[]> = JSON.parse(
  JSON.stringify(MOCK_DECISIONS)
)
let localAlerts: AlertSummary[] = JSON.parse(JSON.stringify(MOCK_ALERTS))

/**
 * GET /alerts?k=25&as_of=...
 */
export async function getAlerts(params?: {
  k?: number
  as_of?: string
  status?: string
}): Promise<AlertSummary[]> {
  // If demo mode is explicitly active and live alerts are not enabled, return deterministic mock
  if (IS_DEMO_MODE && !CONNECT_LIVE_ALERTS_ENDPOINT) {
    await new Promise((res) => setTimeout(res, 200))
    let res = [...localAlerts]
    if (params?.status && params.status !== 'all') {
      res = res.filter((a) => a.status === params.status)
    }
    return res
  }

  // Connect live alerts endpoint with graceful fallback for backend-down scenarios
  try {
    const response = await apiClient.get<AlertSummary[]>('/alerts', { params })
    return response.data
  } catch (err) {
    console.warn(
      'Live GET /alerts endpoint unavailable or unreachable, utilizing deterministic fallback fixtures.',
      err
    )
    let res = [...localAlerts]
    if (params?.status && params.status !== 'all') {
      res = res.filter((a) => a.status === params.status)
    }
    return res
  }
}

/**
 * GET /alerts/{alert_id}/graph?hops=2&as_of=...
 */
export async function getAlertGraph(
  alertId: string,
  params?: { hops?: number; as_of?: string }
): Promise<SubgraphResponse> {
  if (IS_DEMO_MODE) {
    await new Promise((res) => setTimeout(res, 250))
    const subgraph = MOCK_SUBGRAPHS[alertId] || MOCK_SUBGRAPHS['alert_syn_high_01']
    return {
      ...subgraph,
      alert_id: alertId,
      hops: params?.hops || 2,
    }
  }

  try {
    const response = await apiClient.get<SubgraphResponse>(`/alerts/${alertId}/graph`, {
      params,
    })
    return response.data
  } catch (err) {
    console.warn(`Backend call failed for /alerts/${alertId}/graph, using fallback.`, err)
    const fallback = MOCK_SUBGRAPHS[alertId] || MOCK_SUBGRAPHS['alert_syn_high_01']
    return { ...fallback, alert_id: alertId }
  }
}

/**
 * POST /alerts/{alert_id}/counterfactual
 */
export async function runCounterfactual(
  alertId: string,
  payload: { removed_edge_ids?: string[] }
): Promise<CounterfactualResponse> {
  if (IS_DEMO_MODE) {
    await new Promise((res) => setTimeout(res, 250))
    const removedCount = payload.removed_edge_ids?.length || 0
    const drop = removedCount > 0 ? Math.min(0.7, 0.31 * removedCount) : 0
    const baseScore = 0.94
    const newScore = Math.max(0.15, +(baseScore - drop).toFixed(2))

    return {
      alert_id: alertId,
      original_risk_score: baseScore,
      new_risk_score: newScore,
      score_delta: +(newScore - baseScore).toFixed(2),
      below_cutoff: newScore < 0.6,
      is_hypothetical: true,
      synthetic_scenario: 'counterfactual_edge_removal_simulation',
      altered_factors: [
        {
          factor: `${removedCount} Edge(s) Neutralized`,
          original_impact: 'Active transmission path',
          new_impact: 'Severed simulated link',
        },
      ],
      explanation:
        newScore < 0.6
          ? `Neutralizing ${removedCount} edge(s) breaks the high-velocity relay sequence, reducing review priority to ${newScore.toFixed(2)} (below 0.60 intervention cutoff).`
          : `Removal of selected edges reduces priority to ${newScore.toFixed(2)}, but remaining multi-hop links sustain high review priority.`,
    }
  }

  const response = await apiClient.post<CounterfactualResponse>(
    `/alerts/${alertId}/counterfactual`,
    payload
  )
  return response.data
}

/**
 * GET /alerts/{alert_id}/hypotheses
 */
export async function getHypotheses(alertId: string): Promise<BenignHypothesis[]> {
  if (IS_DEMO_MODE) {
    await new Promise((res) => setTimeout(res, 150))
    return MOCK_HYPOTHESES[alertId] || MOCK_HYPOTHESES['alert_syn_high_01']
  }

  try {
    const response = await apiClient.get<BenignHypothesis[]>(`/alerts/${alertId}/hypotheses`)
    return response.data
  } catch {
    return MOCK_HYPOTHESES[alertId] || MOCK_HYPOTHESES['alert_syn_high_01']
  }
}

/**
 * Exact alias required by specification: getAlertHypotheses
 */
export const getAlertHypotheses = getHypotheses

/**
 * POST /alerts/{alert_id}/decision
 */
export async function submitDecision(
  alertId: string,
  payload: DecisionRequest
): Promise<DecisionRecord> {
  if (IS_DEMO_MODE) {
    await new Promise((res) => setTimeout(res, 200))
    const newRecord: DecisionRecord = {
      id: `dec_${Date.now()}`,
      alert_id: alertId,
      decision: payload.decision,
      note: payload.note,
      actor: 'Current_Analyst',
      timestamp: new Date().toISOString(),
    }

    if (!localDecisions[alertId]) {
      localDecisions[alertId] = []
    }
    localDecisions[alertId].unshift(newRecord)

    // Update alert status accordingly
    const alert = localAlerts.find((a) => a.id === alertId)
    if (alert) {
      if (payload.decision === 'confirm') alert.status = 'escalated'
      else if (payload.decision === 'dismiss') alert.status = 'closed'
      else alert.status = 'investigating'
    }

    return newRecord
  }

  const response = await apiClient.post<DecisionRecord>(`/alerts/${alertId}/decision`, payload)
  return response.data
}

/**
 * GET /alerts/{alert_id}/decisions (append-only history)
 */
export async function getDecisionHistory(alertId: string): Promise<DecisionRecord[]> {
  if (IS_DEMO_MODE) {
    return localDecisions[alertId] || []
  }

  try {
    const response = await apiClient.get<DecisionRecord[]>(`/alerts/${alertId}/decisions`)
    return response.data
  } catch {
    return localDecisions[alertId] || []
  }
}

/**
 * GET /evaluation
 */
export async function getEvaluationData(): Promise<EvaluationData> {
  if (IS_DEMO_MODE) {
    await new Promise((res) => setTimeout(res, 200))
    return MOCK_EVALUATION
  }

  try {
    const response = await apiClient.get<EvaluationData>('/evaluation')
    return response.data
  } catch {
    return MOCK_EVALUATION
  }
}

/**
 * Exact alias required by specification: getEvaluation
 */
export const getEvaluation = getEvaluationData


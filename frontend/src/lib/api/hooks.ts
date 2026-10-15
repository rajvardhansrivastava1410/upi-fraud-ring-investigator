import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAlerts,
  getAlertGraph,
  getAlertHypotheses,
  runCounterfactual,
  submitDecision,
  getDecisionHistory,
  getEvaluation,
} from '@/lib/api/client'
import { DecisionRequest } from '@/types/api'

/**
 * Hook to retrieve the ranked alert queue with optional filtering parameters
 */
export function useAlertsQuery(params?: { k?: number; as_of?: string; status?: string }) {
  return useQuery({
    queryKey: ['alerts', params?.status, params?.as_of, params?.k],
    queryFn: () => getAlerts(params),
  })
}

/**
 * Hook to retrieve 1-2 hop bounded subgraph and ordered evidence path for an alert
 */
export function useAlertGraphQuery(alertId: string, hops: number = 2, asOf?: string) {
  return useQuery({
    queryKey: ['graph', alertId, hops, asOf],
    queryFn: () => getAlertGraph(alertId, { hops, as_of: asOf }),
    enabled: !!alertId,
  })
}

/**
 * Hook to retrieve benign alternative hypotheses and distinguishing checks
 */
export function useAlertHypothesesQuery(alertId: string) {
  return useQuery({
    queryKey: ['hypotheses', alertId],
    queryFn: () => getAlertHypotheses(alertId),
    enabled: !!alertId,
  })
}

/**
 * Mutation hook for running hypothetical counterfactual edge removal
 */
export function useCounterfactualMutation(alertId: string) {
  return useMutation({
    mutationFn: (removedEdgeIds: string[]) =>
      runCounterfactual(alertId, { removed_edge_ids: removedEdgeIds }),
  })
}

/**
 * Mutation hook for submitting an analyst investigation outcome (append-only)
 */
export function useDecisionMutation(alertId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DecisionRequest) => submitDecision(alertId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', alertId] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

/**
 * Hook to retrieve append-only decision audit history for an alert
 */
export function useDecisionHistoryQuery(alertId: string) {
  return useQuery({
    queryKey: ['decisions', alertId],
    queryFn: () => getDecisionHistory(alertId),
    enabled: !!alertId,
  })
}

/**
 * Hook to retrieve model evaluation benchmarks, P@K, and false-positive analyses
 */
export function useEvaluationQuery() {
  return useQuery({
    queryKey: ['evaluation'],
    queryFn: () => getEvaluation(),
  })
}
